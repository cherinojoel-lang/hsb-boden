# Auftrag: Versanderkennung im CRM (Send-Detection)

**Für:** Antigravity / bearbeitende Agenten-Session
**System:** HSB Sales OS — Google Sheet `1W-NjwEq0UhDo2TaeS-2qp_qit4YFMz6k-IqKHlPpHmg`
**Stand:** 2026-09-15

---

## 1. Symptom

Das Vertriebs-Cockpit meldet **159 tatsächlich versendete Mails** (119 Jordi,
40 Joel). Die Operatoren berichten, dass **deutlich mehr** versendet wurde.

Die Differenz ist kein Anzeigefehler. Sie ist der Kern des Problems.

## 2. Befund (verifiziert am 15.09. gegen das Live-Sheet)

    Kontakte gesamt          6.424   (3.212 Jordi / 3.212 Joel)
    In Batches reserviert    2.392   (1.320 / 1.072)
    Tatsächlich versendet      159   (119 / 40)
    Antworten erhalten           4
    Opt-Outs / Bounces          41   (14 / 6 — Summe stimmt nicht, 21 unzugeordnet)

Vorhandene Spalten in `ALL_LEADS`:
`Batch_Status`, `Send_Status`, `Draft_ID`, `Drafted_At`,
`Internet_Message_ID`, `Conversation_ID`, `Outlook_Message_ID`

`Internet_Message_ID` **ist befüllt** — das ist der Schlüssel zur Lösung.
`Conversation_ID` und `Outlook_Message_ID` sind leer.

## 3. Hypothese

**Es existiert keine Versanderkennung.**

Der Ablauf ist: Apps Script erzeugt einen Entwurf über Power Automate →
`Batch_Status = DRAFTED` → **ein Mensch öffnet Outlook und sendet von Hand**.

Beim letzten Schritt verlässt der Vorgang das System. Nichts meldet zurück.
`SENT` kann daher nur dort stehen, wo es jemand manuell gesetzt hat.

Das deckt sich mit dem ursprünglichen Handoff, der
`POST_SEND_RECONCILIATION = FINAL_VERIFICATION_OPEN` führt — das war schon
immer der offene Punkt, er ist nur nie geschlossen worden.

## 4. Hypothese prüfen, bevor gebaut wird

1. **Gesendet-Ordner zählen.** Wie viele Mails liegen in *Gesendete Elemente*
   von `j-cherino@hsb-boden.de` und `j-post@hsb-boden.de` seit dem 07.09.?
   Diese Zahl ist die Wahrheit.
2. **Gegen das Sheet halten.** Ist sie deutlich größer als 159, ist die
   Hypothese bestätigt.
3. **Stichprobe korrelieren.** Eine gesendete Mail heraussuchen, ihre
   `Internet-Message-ID` aus dem Kopf lesen, im Sheet suchen. Findet sie sich
   in `Internet_Message_ID`, aber die Zeile steht auf `DRAFTED` statt `SENT`,
   ist der Beweis erbracht — und zugleich ist bewiesen, dass die Korrelation
   technisch funktioniert.

## 5. Wie große CRMs das lösen — drei Muster

### A · BCC-Dropbox  *(robustestes, einfachstes Muster)*
HubSpot und Salesforce arbeiten so. Jeder Entwurf bekommt eine feste
**BCC-Adresse**. Wird die Mail gesendet — egal von wem, egal ob vom Rechner
oder vom Handy — landet eine Kopie bei dieser Adresse, und die markiert den
Lead als versendet.

*Vorteil:* Erkennt **jeden** Versand, unabhängig von Client und Gerät. Keine
Berechtigungen, keine Abfragen, kein Polling.
*Preis:* Eine Postfach- oder Weiterleitungsadresse, und die BCC-Zeile muss in
den Entwurf.

### B · Mailbox-Sync über den Gesendet-Ordner
Regelmäßig *Gesendete Elemente* lesen und über `Internet_Message_ID` gegen das
Sheet abgleichen. Das ist das Verfahren verbundener Postfächer in HubSpot und
Salesforce.

*Vorteil:* Kein Eingriff in den Mailtext, funktioniert rückwirkend — die
bereits gesendeten Mails würden sofort korrekt erkannt.
*Preis:* Lesezugriff aufs Postfach. Über Power Automate genügt der bestehende
Office-365-Outlook-Connector.

### C · Versand durch das System selbst
Wer sendet, weiß es. Scheidet aus: Die Architektur verlangt ausdrücklich
manuellen Versand durch einen Menschen.

## 6. Empfehlung

**B umsetzen, A ergänzen.**

**B** repariert den Bestand — die bereits gesendeten Mails werden rückwirkend
erkannt, weil `Internet_Message_ID` schon gespeichert ist. Ohne diesen Schritt
bleibt die Historie dauerhaft falsch.

**A** sichert die Zukunft ab, auch für Versand vom Handy oder aus einem
anderen Client.

Konkret für **B** mit dem vorhandenen Stack: ein zweiter Power-Automate-Flow je
Operator mit dem Auslöser auf gesendete Mails, der `internetMessageId` an ein
Apps-Script-Web-App (`doPost`) meldet. Dieses setzt:

    Send_Status  = sent
    Batch_Status = SENT
    Sent_At      = <Zeitstempel aus der Mail>

## 7. Vertrag, der nicht gebrochen werden darf

- `PREPARED` ≠ `DRAFTED` ≠ `SENT`
- `SENT` **nur** mit echtem Sendenachweis (Fund im Gesendet-Ordner oder
  BCC-Eingang). Niemals aus „Entwurf existiert" ableiten.
- Ohne eindeutige Zuordnung: `NEEDS_REVIEW`, **kein** falsches `SENT`
- Idempotenz: dieselbe Mail zweimal erkannt darf keinen zweiten Statuswechsel
  und keinen zweiten Follow-up auslösen
- Kein automatischer Versand. Der Mensch sendet.

## 8. Abnahmekriterien

    SENT_OHNE_NACHWEIS            = 0
    DOPPELTE_SEND_ERKENNUNG       = 0
    RÜCKWIRKEND_ERKANNT           > 0      (Bestand repariert)
    DASHBOARD_VERSENDET           ≈ Anzahl im Gesendet-Ordner
    UNZUGEORDNET                  in NEEDS_REVIEW, nicht verworfen

## 9. Nebenbefund, getrennt zu klären

41 Opt-Outs/Bounces bei 159 versendeten Mails sind 26 %. Falls überwiegend
**Bounces**: Listenqualität prüfen, bevor weiter versendet wird — üblich sind
2–3 %. Opt-Outs sind unkritisch. **Die beiden Werte müssen getrennt gezählt
werden**, aktuell stehen sie in einer Zelle. Zusätzlich stimmt die Aufteilung
nicht: 14 + 6 = 20 bei ausgewiesenen 41.
