# HSB Sales OS — Einrichtung (korrigierte Fassung)

Ersetzt `EINRICHTUNG_FINAL.md`. Grund steht in Abschnitt 1.
Maßgeblich ist der Drive-Handoff *HSB Sales OS – CURRENT HANDOFF &
FINALISIERUNGSPLAN – 2026-08-28*.

---

## 1. Korrektur: falsche Umgebung im bisherigen Dokument

`EINRICHTUNG_FINAL.md` weist Jordi an, die Outlook-Verbindung in
**`Default-8adbbf2e-…`** zu autorisieren, „nicht `67d5e040-…`".

**Das ist vertauscht.** Der Handoff vom 28.08. legt fest:

    Power Platform Environment : HSB-SALES-OS-DEV
    Environment ID             : 67d5e040-da4e-e629-a8c9-9176bd070948
    Environment URL            : https://hsbsalesosdev.crm17.dynamics.com/

Dort liegen Solution, Flow und Connection Reference. `Default-8adbbf2e-…`
ist die Umgebung des **alten Testflows** vom 23.08.

Der richtige Link für Jordi:

    https://make.powerautomate.com/environments/67d5e040-da4e-e629-a8c9-9176bd070948/connections

Konto: `j-post@hsb-boden.de` → Office 365 Outlook → Verbinden.

Wird nach dem alten Dokument autorisiert, entsteht eine Verbindung in der
falschen Umgebung, der solution-aware Flow bleibt unverbunden, und der
Fehler sieht aus wie ein Connector-Problem.

---

## 2. Reihenfolge

### P0 — Jordis Autorisierung (menschlich, blockierend)
Link oben. Danach prüfen: Connection-Status `Connected`, Identität exakt
`j-post@hsb-boden.de`, Connection Reference bindet auf genau diese Verbindung.

### P1 — Flow importieren
`HSB_DraftFlow.definition.json` in **HSB-SALES-OS-DEV** anlegen,
solution-aware, mit Connection Reference. Für Joel ein zweiter Flow mit
dessen Verbindung — ein Flow läuft immer unter genau einer Verbindung.

HTTP-POST-URL beider Flows in die Skripteigenschaften eintragen:

    HSB_ADAPTER_URL_JORDI
    HSB_ADAPTER_URL_JOEL

### P2 — Skript einrichten
`HSB_DraftAdapter.gs` ins Skriptprojekt
(`1Xl6xkMTyn3Hu6UvBoX7gVrdppuyRal04NH6Ei16hnz_Pfuq-JWmh9U4c`).
Manifest braucht `https://www.googleapis.com/auth/script.external_request`.

Dann **`preflight()`** ausführen. Sie verändert nichts und prüft, ob die
Engine-Funktionen `readLeads_`, `getVerifiedFlyer_`, `renderEmail_`,
`logActivity_` wirklich so heißen und die beiden URLs gesetzt sind.
Bei `PREFLIGHT=FAIL` nichts weiter ausführen — die Namen im Adapter an die
Engine anpassen, nicht die Engine an den Adapter.

### P3 — Ein Entwurf
`entwurfTesten()` erzeugt genau **einen** Entwurf. In Outlook ansehen:
Anrede, Umbrüche, Flyer als Anhang, Betreff. Erst wenn der stimmt,
`entwuerfeErzeugen()` für den Rest des Batches.

---

## 3. Was das Skript garantiert

- **Idempotenz:** Leads mit vorhandener `Draft_ID` werden übersprungen.
  Ein Timeout ohne Antwort erzeugt beim nächsten Lauf keinen zweiten Entwurf.
- **Retry aus:** Im Flow ist `retryPolicy: none` gesetzt. Der Standard wäre
  bis zu vier automatische Wiederholungen — bei einem Entwurfsgenerator ist
  das ein Duplikatrisiko. Die Wiederholung steuert das Skript über `Draft_ID`.
- **Kein Auto-Send:** Der Flow enthält nur `DraftEmail`. `SendEmailV2`,
  `SendDraftEmail` und `Mail.Send` kommen nicht vor. Das Skript setzt
  `Batch_Status = DRAFTED`, niemals `SENT`.
- **Fehler stoppen nicht den Lauf:** Ein fehlgeschlagener Lead wird
  protokolliert und übersprungen, der Batch läuft weiter.

---

## 4. Offen — nicht von diesem Paket gelöst

- **Rechtliche Freigabe.** 6.204 von 6.424 Leads stehen auf
  `Versandfreigabe = no`. Bei den Joel-Leads sind 70 von 100 `.ch`-Domains;
  Schweizer UWG Art. 3 Abs. 1 lit. o verlangt grundsätzlich vorherige
  Einwilligung, eine deutsche § 7 Abs. 3 UWG-Einstufung trägt dort nicht.
  Nicht pauschal auf `EXISTING_CUSTOMER_7_3` setzen.
- **Ein inkonsistenter Datensatz.** Ein Joel-Lead steht auf
  `Versandfreigabe = yes` bei `Legal_Basis = UNKNOWN`. Vor jedem Lauf klären.
- **Post-Send-Reconciliation.** `SENT` wird bis heute von niemandem gesetzt.
  Das ist gewollt, aber der Abgleich echter Sendungen ist noch offen.
- **Lizenz.** HTTP-Trigger ist Premium; ein Developer-Environment ist laut
  Microsoft kein Produktivbetrieb.
- **`#ERROR!` im Leitstand.** Mehrere Live-Kennzahlen im Sheet-Reiter
  *Leitstand* liefern `#ERROR!` (Leads je Owner, reservierte Kontakte,
  versendete Mails, Antworten, Review-Fälle). Kosmetisch, aber der Leitstand
  ist damit als Statusquelle unbrauchbar.
- **Anleitung im Sheet veraltet.** Der Reiter beschreibt weiterhin den
  ZIP-Download-Weg, nicht diesen Adapter.
