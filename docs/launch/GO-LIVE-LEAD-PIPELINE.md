# Go-Live: Lead-Zustellung aktivieren

Stand: Code vollständig, getestet, gebaut. Es fehlen **zwei Konfigurationswerte**,
die nur der Betreiber setzen kann. Kein weiterer Code-Schritt nötig.

## Architektur (nach Portierung von `main`)

    Browser (LeadForm.tsx)
      └─ POST same-origin  /api/lead
           └─ src/pages/api/lead.ts   (Cloudflare Worker, SSR)
                ├─ Origin-Prüfung (nur hsb-boden.de / www.hsb-boden.de)
                ├─ Payload-Limit 16 KB, gechunktes Lesen
                ├─ Zod-Validierung (src/lib/leadSchema.ts)
                ├─ Rate-Limit: 5/IP/10min, 2/E-Mail/30min
                └─ POST an  LEAD_WEBHOOK_URL  (Timeout 6 s)

Die Ziel-URL ist ein **Worker-Secret**, keine `PUBLIC_*`-Variable — sie landet
nicht im Browser-Bundle. Das ist der Grund für die Umstellung: die vorherige
Variante `PUBLIC_LEAD_ENDPOINT` hätte die Webhook-URL öffentlich exponiert.

## Schritt 1 — Zustellziel setzen (Secret)

    LEAD_WEBHOOK_URL = <URL des Zustellziels>

Ziel ist die Apps-Script-Web-App (`.../exec`), die den Lead ins CRM-Light-Sheet
schreibt. Als Cloudflare-Pages-Secret hinterlegen, nicht in die `.env` committen.

## Schritt 2 — Formular-UI freischalten

    PUBLIC_LEAD_FORM_ENABLED = true

Erst umlegen, **nachdem** Schritt 1 steht. Solange der Flag `false` ist, zeigt
das Formular bewusst den direkten Telefonweg statt Anfragen ins Leere laufen zu
lassen. Beide Werte für Production **und** Preview setzen, dann neu deployen.

## Schritt 3 — E2E-Test

1. Formular auf der Preview-URL mit Testdaten absenden.
2. Erwartung: Redirect auf `/danke-projektanfrage/`, Response `200 {"ok":true}`.
3. Prüfen, dass die Zeile im Sheet ankommt.
4. Fehlerbilder: `502 webhook_unreachable` = Schritt 1 falsch/nicht erreichbar.
   `400 validation_failed` = Payload-Feld fehlt. `429 rate_limited` = Limit,
   normal bei Wiederholtests (5/IP/10min).

## Bekannte Grenze

Das Rate-Limiting liegt im Worker-Arbeitsspeicher, gilt also pro Instanz. Für
den Start ausreichend; bei echtem Mehrinstanz-Betrieb auf Cloudflare KV
umstellen. Die Einschränkung ist im Code kommentiert.
