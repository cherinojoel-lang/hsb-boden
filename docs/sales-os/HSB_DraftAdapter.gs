/**
 * HSB Sales OS — Draft-Adapter (Apps Script -> Power Automate -> Outlook-Entwurf)
 *
 * Vertrag (aus CURRENT HANDOFF 2026-08-28, Architektur eingefroren):
 *   - Google Sheet = SSOT. Apps Script entscheidet Eligibility, Owner,
 *     Legal_Basis, Template und Flyer. Power Automate entscheidet NICHTS.
 *   - Power Automate erzeugt ausschliesslich ENTWUERFE. Kein Auto-Send.
 *   - PREPARED != DRAFTED != SENT. Dieses Skript setzt NIEMALS SENT.
 *
 * Dieses Modul ruft keine Engine-Funktion blind auf: preflight() prueft zuerst,
 * ob die erwartete Engine-Oberflaeche wirklich existiert, und bricht sonst mit
 * einer klaren Meldung ab, statt eine zweite Parallelimplementierung zu bauen.
 */

// ---------------------------------------------------------------- Konfiguration

var ADAPTER_PROPS = {
  JORDI: 'HSB_ADAPTER_URL_JORDI',
  JOEL: 'HSB_ADAPTER_URL_JOEL'
};

// Spalten im Sheet, in die zurueckgeschrieben wird.
var WRITEBACK = {
  draftId: 'Draft_ID',
  internetMessageId: 'Internet_Message_ID',
  conversationId: 'Conversation_ID',
  draftedAt: 'Drafted_At',
  batchStatus: 'Batch_Status'
};

// Engine-Funktionen, auf die dieser Adapter angewiesen ist.
var REQUIRED_ENGINE_FUNCTIONS = ['readLeads_', 'getVerifiedFlyer_', 'renderEmail_', 'logActivity_'];

var HTTP_TIMEOUT_NOTE = 'UrlFetchApp hat kein eigenes Timeout; der Flow muss serverseitig begrenzen.';

// ---------------------------------------------------------------- Preflight

/**
 * Prueft die Voraussetzungen, ohne irgendetwas zu veraendern.
 * Vor dem ersten echten Lauf ausfuehren und die Ausgabe lesen.
 */
function preflight() {
  var report = [];
  var ok = true;

  REQUIRED_ENGINE_FUNCTIONS.forEach(function (name) {
    var exists = (typeof this[name] === 'function') ||
                 (typeof globalThis[name] === 'function');
    report.push((exists ? 'OK   ' : 'FEHLT') + '  Engine-Funktion ' + name);
    if (!exists) ok = false;
  }, this);

  var props = PropertiesService.getScriptProperties();
  Object.keys(ADAPTER_PROPS).forEach(function (owner) {
    var key = ADAPTER_PROPS[owner];
    var url = props.getProperty(key);
    var good = !!url && url.indexOf('https://') === 0;
    report.push((good ? 'OK   ' : 'FEHLT') + '  Skripteigenschaft ' + key);
    if (!good) ok = false;
  });

  report.push('');
  report.push(ok ? 'PREFLIGHT=PASS' : 'PREFLIGHT=FAIL — nichts ausfuehren, bis alle Zeilen OK sind.');
  var text = report.join('\n');
  Logger.log(text);
  return text;
}

// ---------------------------------------------------------------- Hilfen

/** Klartext aus renderEmail_ in HTML wandeln. Der Outlook-Connector erwartet HTML. */
function textToHtml_(text) {
  var escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .split(/\n{2,}/)
    .map(function (para) { return '<p>' + para.replace(/\n/g, '<br>') + '</p>'; })
    .join('');
}

/** Flyer als base64 fuer den Connector. Nutzt die Engine-Verifikation, kein eigener Pfad. */
function flyerAttachment_(owner) {
  var flyer = getVerifiedFlyer_(owner);
  if (!flyer) throw new Error('ASSET_GATE_FAIL: kein verifizierter Flyer fuer ' + owner);
  var blob = flyer.blob || DriveApp.getFileById(flyer.fileId).getBlob();
  return {
    Name: blob.getName(),
    ContentBytes: Utilities.base64Encode(blob.getBytes())
  };
}

function adapterUrlFor_(owner) {
  var key = ADAPTER_PROPS[String(owner).toUpperCase().indexOf('JORDI') >= 0 ? 'JORDI' : 'JOEL'];
  var url = PropertiesService.getScriptProperties().getProperty(key);
  if (!url) throw new Error('Skripteigenschaft ' + key + ' ist nicht gesetzt.');
  return url;
}

// ---------------------------------------------------------------- Kern

/**
 * Erzeugt Entwuerfe fuer einen vorbereiteten Batch.
 *
 * @param {string} batchId    Batch aus dem Sheet (PREPARED).
 * @param {Object} options    {limit: number, dryRun: boolean}
 *
 * Idempotenz: Leads, die bereits ein Draft_ID tragen, werden uebersprungen.
 * Ein Timeout ohne Antwort erzeugt daher beim naechsten Lauf KEINEN zweiten
 * Entwurf fuer denselben Lead, solange der Flow die ID zurueckgibt.
 */
function createDraftsForBatch(batchId, options) {
  options = options || {};
  var limit = options.limit || 1;              // bewusst 1 als Default
  var dryRun = options.dryRun === true;

  var pre = preflight();
  if (pre.indexOf('PREFLIGHT=PASS') < 0) throw new Error(pre);

  var leads = readLeads_({ batchId: batchId });
  if (!leads || !leads.length) {
    return 'Keine Leads im Batch ' + batchId + '. Das ist bei geschlossenem Gate korrektes Verhalten.';
  }

  var results = { drafted: 0, skipped: 0, failed: 0, details: [] };

  for (var i = 0; i < leads.length && results.drafted < limit; i++) {
    var lead = leads[i];

    if (lead[WRITEBACK.draftId]) {
      results.skipped++;
      results.details.push(lead.Lead_ID + ' uebersprungen (Draft_ID vorhanden)');
      continue;
    }

    var owner = lead.Verantwortlicher || lead.Owner;
    var rendered = renderEmail_(lead);          // Klartext aus der Engine
    var payload = {
      leadId: lead.Lead_ID,
      batchId: batchId,
      to: lead['E-Mail'] || lead.Email,
      subject: rendered.subject,
      bodyHtml: textToHtml_(rendered.body),
      attachments: [flyerAttachment_(owner)]
    };

    if (dryRun) {
      results.details.push(lead.Lead_ID + ' DRY-RUN, kein Aufruf');
      results.drafted++;
      continue;
    }

    var res = UrlFetchApp.fetch(adapterUrlFor_(owner), {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = res.getResponseCode();
    if (code !== 200) {
      results.failed++;
      results.details.push(lead.Lead_ID + ' FEHLER HTTP ' + code + ' ' + res.getContentText().slice(0, 200));
      logActivity_('DRAFT_FAILED', lead.Lead_ID, 'HTTP ' + code);
      continue;                                  // kein Abbruch, kein Retry im selben Lauf
    }

    var body = JSON.parse(res.getContentText());
    writeBackDraft_(lead, body);
    logActivity_('DRAFTED', lead.Lead_ID, body.draftId);
    results.drafted++;
    results.details.push(lead.Lead_ID + ' DRAFTED ' + body.draftId);
  }

  var summary = 'Batch ' + batchId + ': ' + results.drafted + ' Entwuerfe, ' +
                results.skipped + ' uebersprungen, ' + results.failed + ' Fehler\n' +
                results.details.join('\n') +
                '\n\nSENT wird nicht gesetzt. Versand erfolgt manuell in Outlook.';
  Logger.log(summary);
  return summary;
}

/** Schreibt die Korrelations-IDs zurueck. Setzt niemals SENT. */
function writeBackDraft_(lead, body) {
  var sheet = SpreadsheetApp.getActive().getSheetByName('ALL_LEADS');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = lead._row;
  if (!row) throw new Error('Lead ohne Zeilenreferenz (_row): ' + lead.Lead_ID);

  var set = {};
  set[WRITEBACK.draftId] = body.draftId;
  set[WRITEBACK.internetMessageId] = body.internetMessageId;
  set[WRITEBACK.conversationId] = body.conversationId;
  set[WRITEBACK.draftedAt] = new Date();
  set[WRITEBACK.batchStatus] = 'DRAFTED';

  Object.keys(set).forEach(function (col) {
    var idx = headers.indexOf(col);
    if (idx < 0) throw new Error('Spalte fehlt im Sheet: ' + col);
    sheet.getRange(row, idx + 1).setValue(set[col]);
  });
}

// ---------------------------------------------------------------- Bedienung

/** Ein einzelner Entwurf zum Pruefen. Immer damit anfangen. */
function entwurfTesten() {
  var batch = offenenBatchFinden_();
  return createDraftsForBatch(batch, { limit: 1 });
}

/** Alle Entwuerfe des offenen Batches. Erst nach Sichtung des Testentwurfs. */
function entwuerfeErzeugen() {
  var batch = offenenBatchFinden_();
  return createDraftsForBatch(batch, { limit: 9999 });
}

/** Sucht den juengsten Batch mit Status PREPARED. */
function offenenBatchFinden_() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('BATCHES');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idBatch = headers.indexOf('Batch');
  var idStatus = headers.indexOf('Status');
  if (idBatch < 0 || idStatus < 0) throw new Error('BATCHES: Spalten Batch/Status nicht gefunden.');
  for (var i = data.length - 1; i > 0; i--) {
    if (String(data[i][idStatus]).toUpperCase() === 'PREPARED') return data[i][idBatch];
  }
  throw new Error('Kein Batch mit Status PREPARED gefunden. Zuerst Batch vorbereiten.');
}
