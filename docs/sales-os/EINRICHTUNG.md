# HSB Sales OS — Outlook-Entwürfe aus dem Skript

Ergänzt `EINRICHTUNG_FINAL.md` um den Adapter. Der Weg bleibt unverändert:

    Google Sheet / Apps Script  →  Power Automate  →  Outlook-Entwurf  →  Mensch sendet

Apps Script entscheidet Eligibility, Owner, Rechtsgrundlage, Template und Flyer.
Power Automate entscheidet nichts und sendet nichts.

---

## 1. Jordi autorisiert Outlook

Umgebung: **`Default-8adbbf2e-…`** (die Standardumgebung).

    https://make.powerautomate.com/environments/Default-8adbbf2e-…/connections

Konto `j-post@hsb-boden.de` → Office 365 Outlook → Verbinden.

> Nicht `67d5e040-…` (HSB-SALES-OS-DEV). Das ist ein Developer-Environment;
> Microsoft lässt dort nur den Besitzer arbeiten, und Joel wie Jordi bekommen
> beim Anlegen eines Flows „Sie sind nicht berechtigt, Flows in diesem … zu
> erstellen". In der Standardumgebung wird jeder Benutzer automatisch Maker —
> dort lief auch der erfolgreiche Testflow vom 03.09.

## 2. Flows anlegen

`HSB_DraftFlow.definition.json` in der Standardumgebung importieren —
**zweimal**, einmal mit Jordis und einmal mit Joels Verbindung. Ein Flow läuft
immer unter genau einer Verbindung.

Die beiden HTTP-POST-URLs in die Skripteigenschaften eintragen:

    HSB_ADAPTER_URL_JORDI
    HSB_ADAPTER_URL_JOEL

## 3. Skript einrichten

`HSB_DraftAdapter.gs` ins Skriptprojekt
`1Xl6xkMTyn3Hu6UvBoX7gVrdppuyRal04NH6Ei16hnz_Pfuq-JWmh9U4c`.
Im Manifest muss `https://www.googleapis.com/auth/script.external_request`
stehen.

Dann **`preflight()`** ausführen. Sie verändert nichts und prüft, ob die
Engine-Funktionen `readLeads_`, `getVerifiedFlyer_`, `renderEmail_` und
`logActivity_` wirklich so heißen und beide URLs gesetzt sind. Bei
`PREFLIGHT=FAIL` nichts weiter starten — dann die Namen im Adapter an die
Engine anpassen, nicht umgekehrt.

## 4. Erster Entwurf

`entwurfTesten()` erzeugt genau **einen** Entwurf. In Outlook ansehen:
Anrede, Zeilenumbrüche, Betreff, Flyer als Anhang. Stimmt der, den Rest des
Batches mit `entwuerfeErzeugen()`.

Danach: Outlook → Ordner **Entwürfe** → prüfen → senden.

---

## Was der Adapter garantiert

- **Kein Doppelversand.** Leads mit vorhandener `Draft_ID` werden übersprungen.
  Ein Timeout ohne Antwort erzeugt beim nächsten Lauf keinen zweiten Entwurf.
- **Kein automatischer Retry.** Im Flow steht `retryPolicy: none`. Der Standard
  wären bis zu vier Wiederholungen — bei einem Entwurfsgenerator ist das genau
  die Duplikatquelle.
- **Kein Auto-Send.** Der Flow enthält nur `DraftEmail`; `SendEmailV2`,
  `SendDraftEmail` und `Mail.Send` kommen nicht vor.
- **Kein falsches SENT.** Geschrieben wird `Draft_ID`, `Internet_Message_ID`,
  `Conversation_ID`, `Drafted_At` und `Batch_Status = DRAFTED`. `SENT` setzt
  dieses Skript nie.
- **Fehler stoppen den Batch nicht.** Ein fehlgeschlagener Lead wird
  protokolliert und übersprungen.

---

## Offen — nicht Sache dieses Pakets

- **Rechtliche Freigabe.** 6.204 von 6.424 Leads stehen auf
  `Versandfreigabe = no`. Bei den Joel-Leads sind 70 von 100 `.ch`-Domains;
  dort trägt eine deutsche § 7 Abs. 3 UWG-Einstufung nicht. Nicht pauschal auf
  `EXISTING_CUSTOMER_7_3` setzen.
- **Ein inkonsistenter Datensatz:** ein Joel-Lead mit `Versandfreigabe = yes`
  bei `Legal_Basis = UNKNOWN`.
- **Post-Send-Reconciliation.** `SENT` wird bewusst von niemandem gesetzt; der
  Abgleich echter Sendungen ist weiterhin offen.
- **Lizenz.** Der HTTP-Trigger ist Premium.
- **`#ERROR!` im Leitstand-Reiter** bei mehreren Live-Kennzahlen.
- **Anleitung im Sheet** beschreibt noch den ZIP-Weg, nicht diesen Adapter.
