# HSB Sales OS — welcher Tenant, welches Konto

Verbindliche Fassung. Belegt aus Live-Fehlermeldungen, Sheet-Protokoll und
Microsoft-Dokumentation. Wer hiervon abweicht, läuft in die Fehler unten.

---

## Es gibt zwei Tenants. Nur einer zählt.

### ✅ Tenant A — Hexagonal Säurebau GmbH  (HIER läuft alles)

    Tenant-ID    8adbbf2e-fd2c-4857-8540-bbcdb3a20f30
    Domäne       hsb-boden.de
    Umgebung     Default-8adbbf2e-fd2c-4857-8540-bbcdb3a20f30
    Konten       j-cherino@hsb-boden.de   (Joel)
                 j-post@hsb-boden.de      (Jordi)

Hier liegen: **die Postfächer**, die Power-Automate-Flows, die
Outlook-Verbindungen, und die App `HSB Sales OS Entwuerfe`
(`43c0f077-be59-4509-be74-3d82821eaf0a`).

Admins dieses Tenants: **Jan Brinkert**, **Stefan Rößler**. Joel ist dort
normaler Benutzer — das reicht für alles Operative.

### ❌ Tenant B — Standardverzeichnis  (Umweg, wird nicht gebraucht)

    Tenant-ID    192d5b35-39f3-48e6-b481-fa753790b9a1
    Domäne       infocherinodiaz.onmicrosoft.com
    Konto        hsb-admin@infocherinodiaz.onmicrosoft.com   ← KEIN Postfach

Enthielt die gelöschte Entwicklerumgebung `HSB-SALES-OS-DEV`
(`67d5e040-…`) und die App-Registrierungen `HSB-Admin-CLI` (`09603bd8-…`)
und `HSB OS` (`dc724030-…`).

**Aus diesem Tenant erreicht nichts die Postfächer.** Mandantengrenzen
lassen das nicht zu — kein Admin-Recht hier hilft dort drüben.

---

## Die eine Regel

> **Jede Microsoft-Anmeldung erfolgt als `j-cherino@hsb-boden.de` oder
> `j-post@hsb-boden.de`. Niemals als `hsb-admin@infocherinodiaz…`.**

Der Browser schlägt das Admin-Konto automatisch vor, weil es angemeldet ist.
Deshalb: **privates Fenster** benutzen, oder „Anderes Konto verwenden".

---

## Fehlerbilder und was sie wirklich bedeuten

| Meldung | Bedeutung |
|---|---|
| `AADSTS50020: … does not exist in tenant 'Hexagonal Säurebau GmbH'` | Falsches Konto. Du bist als `hsb-admin` aus Tenant B angemeldet. Abmelden, als HSB-Konto neu anmelden. Kein Rechteproblem. |
| `MailboxNotEnabledForRESTAPI` | Das Konto hat kein Postfach. Trifft auf `hsb-admin` zu — es ist unlizenziert. |
| „Sie sind nicht berechtigt, Flows in diesem … zu erstellen" | Galt für `67d5e040` (Developer-Umgebung mit aktiviertem Managed Environment). Diese Umgebung ist gelöscht und wird nicht gebraucht. |
| „Administratorgenehmigung erforderlich" | Betrifft **nur** die eigene Graph-App. Power Automates Outlook-Connector braucht das nicht. |
| „Dieses Google-Konto ist mit keinem Postfach verbunden" | Gehört zum neuen Graph-Weg. Der Adapter-Weg über `HSB_ADAPTER_URL_*` braucht diese Verknüpfung nicht. |

---

## Warum Power Automate keine Admin-Zustimmung braucht

Der **Office-365-Outlook-Connector ist eine Microsoft-Erstanbieter-App** und
in jedem Tenant vorab zugelassen. Jeder Benutzer autorisiert ihn für sein
eigenes Postfach — fertig.

Eine **eigene App-Registrierung** hat diesen Status nicht. Für `Mail.ReadWrite`
verlangt der HSB-Tenant dort eine Administratorzustimmung, die nur Jan Brinkert
oder Stefan Rößler erteilen können.

**Der Graph-Weg hat diese Anforderung erst eingeführt. Vorher gab es sie nicht.**

Beweis: Es existieren **67 Entwürfe** — 25 bei Jordi
(Postfach `AAMkADQzMGFm…`), 42 bei Joel (`AAMkADkyNjcw…`), in zwei
verschiedenen Postfächern, ohne Duplikate. Alle entstanden **ohne jede
Administratorzustimmung**. Wäre sie nötig, könnten sie nicht existieren.

---

## Der operative Weg

1. Power Automate, angemeldet als HSB-Konto, Umgebung `Default-8adbbf2e-…`
2. Draft-Flow je Operator, jeder mit **seiner eigenen** Outlook-Verbindung
3. HTTP-POST-URL des Flows → Skripteigenschaft
   `HSB_ADAPTER_URL_JOEL` bzw. `HSB_ADAPTER_URL_JORDI`
4. Sheet → Seitenleiste → Anzahl → Entwürfe
5. Outlook → Entwürfe → prüfen → **von Hand senden**

Status laut Adapter-Dialog vom 11.09.: beide URLs gesetzt, beide zeigen auf
`default8adbbf2e…`, alle vier Engine-Funktionen vorhanden. **Das ist korrekt
konfiguriert.**

---

## Nicht mehr anfassen

- Tenant B / `infocherinodiaz` — wird nicht gebraucht
- `HSB-SALES-OS-DEV` / `67d5e040` — gelöscht, war ein Developer-Environment
- Gastkonten als Zugang zu den Postfächern — Gäste bringen Identität, kein Postfach
- Client-ID der Azure CLI als Ersatz für eine eigene App — umgeht eine
  Sicherheitsentscheidung des HSB-Tenants und wird von Microsoft zunehmend
  blockiert
