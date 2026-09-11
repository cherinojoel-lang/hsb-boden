/**
 * HSB Sales OS — Draft-Adapter
 * Apps Script  ->  Power Automate (DraftEmail)  ->  Outlook-Entwurf
 *
 * Vertrag: Apps Script entscheidet alles (Auswahl, Owner, Legal_Basis, Template,
 * Flyer). Power Automate erzeugt nur Entwuerfe. Gesendet wird von Hand.
 * Dieses Modul setzt NIEMALS SENT.
 *
 * Schnittstellen gegen die reale Engine (aus dem Sheet-Protokoll verifiziert):
 *   readLeads_({batchId})      -> { leads: [...] }
 *   renderEmail_(lead, flyer)  -> { subject, body }   body = Klartext mit \n
 *   getVerifiedFlyer_(owner)   -> Flyer (Blob oder {fileId})
 *   logActivity_(typ, leadId, info)
 */

// ----------------------------------------------------------------- Konfig

var ADAPTER_PROPS = { JORDI: 'HSB_ADAPTER_URL_JORDI', JOEL: 'HSB_ADAPTER_URL_JOEL' };

var SHEET_LEADS   = 'ALL_LEADS';
var SHEET_BATCHES = 'BATCHES';

// Spaltennamen in ALL_LEADS, exakt wie im Sheet.
var COL = {
  leadId:    'Lead-ID',
  owner:     'Verantwortlicher',
  freigabe:  'Versandfreigabe',
  batchStat: 'Batch_Status',
  sendStat:  'Send_Status',
  draftId:   'Draft_ID',
  draftedAt: 'Drafted_At',
  imid:      'Internet_Message_ID',
  convId:    'Conversation_ID',
  lastError: 'Last_Error'
};

var ENGINE_FUNCS = ['readLeads_', 'getVerifiedFlyer_', 'renderEmail_', 'logActivity_'];

// ----------------------------------------------------------------- Menue

/**
 * EINBAU: eine Zeile in die bestehende onOpen-Funktion der Engine einfuegen:
 *     hsbDraftAdapterMenu();
 * Kein zweites onOpen anlegen - davon gewinnt sonst nur eines.
 */
function hsbDraftAdapterMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Outlook-Entwürfe')
    .addItem('Vorprüfung (ändert nichts)', 'preflight')
    .addSeparator()
    .addItem('1 Testentwurf — Joel', 'testJoel')
    .addItem('1 Testentwurf — Jordi', 'testJordi')
    .addSeparator()
    .addItem('Entwürfe erzeugen — Joel', 'entwuerfeJoel')
    .addItem('Entwürfe erzeugen — Jordi', 'entwuerfeJordi')
    .addToUi();
}

function testJoel()      { return laufMitDialog_('Joel',  1); }
function testJordi()     { return laufMitDialog_('Jordi', 1); }
function entwuerfeJoel() { return laufMitAnzahl_('Joel');  }
function entwuerfeJordi(){ return laufMitAnzahl_('Jordi'); }

/** Fragt die Anzahl ab und startet. */
function laufMitAnzahl_(owner) {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Entwürfe für ' + owner,
    'Wie viele Entwürfe? (z. B. 1, 25, 50, 100)', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var n = parseInt(String(a.getResponseText()).trim(), 10);
  if (!(n > 0)) { ui.alert('Bitte eine Zahl größer 0 eingeben.'); return; }
  return laufMitDialog_(owner, n);
}

function laufMitDialog_(owner, limit) {
  var ui = SpreadsheetApp.getUi();
  try {
    var txt = createDrafts(owner, limit);
    ui.alert('Fertig', txt, ui.ButtonSet.OK);
    return txt;
  } catch (e) {
    ui.alert('Abgebrochen', String(e && e.message ? e.message : e), ui.ButtonSet.OK);
    throw e;
  }
}

// ----------------------------------------------------------------- Preflight

/** Prueft Voraussetzungen. Veraendert nichts. */
function preflight() {
  var out = [], ok = true;

  ENGINE_FUNCS.forEach(function (n) {
    var da = (typeof this[n] === 'function') || (typeof globalThis[n] === 'function');
    out.push((da ? 'OK   ' : 'FEHLT') + '  Engine-Funktion ' + n);
    if (!da) ok = false;
  }, this);

  var props = PropertiesService.getScriptProperties();
  Object.keys(ADAPTER_PROPS).forEach(function (k) {
    var key = ADAPTER_PROPS[k], url = props.getProperty(key);
    var gut = !!url && url.indexOf('https://') === 0;
    out.push((gut ? 'OK   ' : 'FEHLT') + '  Skripteigenschaft ' + key +
             (url ? '  (' + url.slice(0, 45) + '…)' : ''));
    if (!gut) ok = false;
  });

  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_LEADS);
  if (!sh) { out.push('FEHLT  Tabellenblatt ' + SHEET_LEADS); ok = false; }
  else {
    var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    Object.keys(COL).forEach(function (k) {
      var da = head.indexOf(COL[k]) >= 0;
      out.push((da ? 'OK   ' : 'FEHLT') + '  Spalte ' + COL[k]);
      if (!da && k !== 'lastError') ok = false;
    });
  }

  out.push('', ok ? 'PREFLIGHT=PASS' : 'PREFLIGHT=FAIL — nichts ausführen, bis alles OK ist.');
  var t = out.join('\n');
  Logger.log(t);
  try { SpreadsheetApp.getUi().alert('Vorprüfung', t, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) {}
  return t;
}

// ----------------------------------------------------------------- Kern

/**
 * Erzeugt bis zu `limit` Entwuerfe fuer `owner` aus dessen offenem Batch.
 * Idempotent: Leads mit vorhandener Draft_ID werden uebersprungen.
 */
function createDrafts(owner, limit) {
  limit = limit || 1;

  var pre = preflightStill_();
  if (pre.indexOf('PREFLIGHT=PASS') < 0) throw new Error(pre);

  var batchId = offenenBatchFinden_(owner);
  var res = readLeads_({ batchId: batchId });
  var leads = (res && res.leads) ? res.leads : (Array.isArray(res) ? res : []);
  if (!leads.length) {
    return 'Batch ' + batchId + ' liefert 0 Kontakte. Bei geschlossenem Gate ist das korrekt.';
  }

  var flyer = getVerifiedFlyer_(owner);
  if (!flyer) throw new Error('ASSET_GATE_FAIL: kein verifizierter Flyer für ' + owner);
  var anhang = flyerAnhang_(flyer);
  var url = adapterUrl_(owner);

  var sh   = SpreadsheetApp.getActive().getSheetByName(SHEET_LEADS);
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  var erzeugt = 0, uebersprungen = 0, fehler = 0, zeilen = [];

  for (var i = 0; i < leads.length && erzeugt < limit; i++) {
    var lead = leads[i];

    if (lead[COL.draftId]) { uebersprungen++; continue; }
    if (String(lead[COL.freigabe]).toLowerCase() !== 'yes') { uebersprungen++; continue; }

    var mail = renderEmail_(lead, flyer);
    var payload = {
      leadId:  lead[COL.leadId] || lead.Lead_ID,
      batchId: batchId,
      to:      lead['E-Mail'] || lead.Email,
      subject: mail.subject,
      bodyHtml: textToHtml_(mail.body),
      attachments: [anhang]
    };

    var r = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify(payload), muteHttpExceptions: true
    });

    var code = r.getResponseCode();
    if (code !== 200) {
      fehler++;
      var msg = 'HTTP ' + code + ' ' + r.getContentText().slice(0, 180);
      zeilen.push(payload.leadId + '  FEHLER  ' + msg);
      schreibeFehler_(sh, head, lead, msg);
      logActivity_('DRAFT_FAILED', payload.leadId, msg);
      continue;
    }

    var body = JSON.parse(r.getContentText());
    schreibeZurueck_(sh, head, lead, body);
    logActivity_('DRAFTED', payload.leadId, body.draftId);
    erzeugt++;
    zeilen.push(payload.leadId + '  DRAFTED  ' + String(body.draftId).slice(0, 24) + '…');
  }

  return 'Batch ' + batchId + ' · ' + owner + '\n' +
         erzeugt + ' Entwürfe, ' + uebersprungen + ' übersprungen, ' + fehler + ' Fehler\n\n' +
         zeilen.join('\n') +
         '\n\nSENT wird nicht gesetzt. Prüfen und senden in Outlook.';
}

/** Preflight ohne Dialog (fuer den internen Aufruf). */
function preflightStill_() {
  var ui = SpreadsheetApp.getUi;
  SpreadsheetApp.getUi = function () { throw new Error('kein UI'); };
  try { return preflight(); } finally { SpreadsheetApp.getUi = ui; }
}

// ----------------------------------------------------------------- Hilfen

/** Klartext -> HTML. Der Outlook-Connector erwartet HTML, sonst ein Absatz ohne Umbrueche. */
function textToHtml_(text) {
  var e = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return e.split(/\n{2,}/).map(function (p) {
    return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}

function flyerAnhang_(flyer) {
  var blob = flyer.blob || (flyer.getBlob ? flyer.getBlob()
           : DriveApp.getFileById(flyer.fileId || flyer.id).getBlob());
  return { Name: blob.getName(), ContentBytes: Utilities.base64Encode(blob.getBytes()) };
}

function adapterUrl_(owner) {
  var key = ADAPTER_PROPS[String(owner).toUpperCase().indexOf('JORDI') >= 0 ? 'JORDI' : 'JOEL'];
  var url = PropertiesService.getScriptProperties().getProperty(key);
  if (!url) throw new Error('Skripteigenschaft ' + key + ' ist nicht gesetzt.');
  return url;
}

function offenenBatchFinden_(owner) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_BATCHES);
  if (!sh) throw new Error('Tabellenblatt ' + SHEET_BATCHES + ' fehlt.');
  var d = sh.getDataRange().getValues(), h = d[0];
  var iId = h.indexOf('Batch_ID'), iSt = h.indexOf('Status'), iOw = h.indexOf('Owner');
  if (iId < 0) iId = h.indexOf('Batch');
  if (iSt < 0) throw new Error('BATCHES: Spalte Status nicht gefunden.');
  var kurz = String(owner).toUpperCase().indexOf('JORDI') >= 0 ? 'JORDI' : 'JOEL';
  for (var i = d.length - 1; i > 0; i--) {
    if (String(d[i][iSt]).toUpperCase() !== 'PREPARED') continue;
    var passt = iOw >= 0 ? String(d[i][iOw]).toUpperCase().indexOf(kurz) >= 0
                         : String(d[i][iId]).toUpperCase().indexOf(kurz) >= 0;
    if (passt) return d[i][iId];
  }
  throw new Error('Kein Batch mit Status PREPARED für ' + owner + '. Zuerst Batch vorbereiten.');
}

function zeileVon_(lead, sh, head) {
  if (lead._row) return lead._row;
  var i = head.indexOf(COL.leadId);
  if (i < 0) throw new Error('Spalte ' + COL.leadId + ' fehlt.');
  var sp = sh.getRange(2, i + 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues();
  var id = lead[COL.leadId] || lead.Lead_ID;
  for (var r = 0; r < sp.length; r++) if (sp[r][0] === id) return r + 2;
  throw new Error('Lead nicht gefunden: ' + id);
}

function setze_(sh, head, row, name, wert) {
  var i = head.indexOf(name);
  if (i < 0) return;
  sh.getRange(row, i + 1).setValue(wert);
}

/** Schreibt die Korrelations-IDs zurueck. Setzt niemals SENT. */
function schreibeZurueck_(sh, head, lead, body) {
  var row = zeileVon_(lead, sh, head);
  setze_(sh, head, row, COL.draftId,   body.draftId);
  setze_(sh, head, row, COL.imid,      body.internetMessageId);
  setze_(sh, head, row, COL.convId,    body.conversationId);
  setze_(sh, head, row, COL.draftedAt, new Date().toISOString());
  setze_(sh, head, row, COL.batchStat, 'DRAFTED');
  setze_(sh, head, row, COL.sendStat,  'drafted');
  setze_(sh, head, row, COL.lastError, '');
}

function schreibeFehler_(sh, head, lead, msg) {
  try { setze_(sh, head, zeileVon_(lead, sh, head), COL.lastError, msg); } catch (e) {}
}
