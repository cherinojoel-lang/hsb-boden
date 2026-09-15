# Anfrage an die IT-Administration — HSB-Boden

**An:** Jan Brinkert (`j-brinkert@HSB-Boden.de`)
**Betrifft:** Microsoft-365-Tenant *Hexagonal Säurebau GmbH*
`8adbbf2e-fd2c-4857-8540-bbcdb3a20f30`
**Von:** Joel Cherino Diaz (`j-cherino@hsb-boden.de`)

---

## Worum es geht

Für die B2B-Akquise werden aus einem Google Sheet personalisierte
Outlook-**Entwürfe** in den Postfächern von `j-cherino@hsb-boden.de` und
`j-post@hsb-boden.de` erzeugt. Geprüft und gesendet wird **von Hand**; es gibt
keinen automatischen Versand.

Es werden **zwei Dinge** gebraucht. **Punkt A ist der wichtigere** und
unabhängig von allem Technischen.

---

# A · DKIM für `hsb-boden.de` aktivieren

**Warum:** Ohne DKIM-Signatur der eigenen Domäne landet ausgehende Geschäftspost
häufiger im Spam. Bei mehreren hundert Nachrichten über Wochen betrifft das
nicht nur die Kampagne, sondern die Zustellbarkeit von `hsb-boden.de`
insgesamt — also auch normale Geschäftskorrespondenz.

### Schritt 1 — Status prüfen

Defender-Portal → **E-Mail & Zusammenarbeit → Richtlinien & Regeln →
Bedrohungsrichtlinien → E-Mail-Authentifizierungseinstellungen → Reiter DKIM**

Direktlink: `https://security.microsoft.com/authentication?viewid=DKIM`

Alternativ per Exchange Online PowerShell:

    Get-DkimSigningConfig | Format-List Name,Enabled,Status,Selector1CNAME,Selector2CNAME

Steht bei `hsb-boden.de` **Enabled: True, Status: Valid** → **fertig, nichts zu tun.**

### Schritt 2 — CNAME-Werte holen

Steht dort `NoDKIMKeys` oder `CnameMissing`:

Im Portal die Domäne anklicken → im Detailbereich den Abschnitt
**„Publish CNAMEs"** → **Kopieren**.

Der Schalter *Disabled → Enabled* wirft zunächst einen Fehlerdialog mit
denselben Werten. Das ist erwartetes Verhalten, kein Defekt.

### Schritt 3 — Zwei CNAME-Einträge im DNS anlegen

    Hostname: selector1._domainkey   →  <Selector1CNAME aus Schritt 2>
    Hostname: selector2._domainkey   →  <Selector2CNAME aus Schritt 2>

Seit Mai 2025 hat das Format bei neu angelegten Domänen die Form
`selector1-hsb-boden-com._domainkey.<Initialpräfix>.<x>-v1.dkim.mail.microsoft`.
Bestandsdomänen behalten das alte Format. **Beide Formate dürfen für denselben
Selektor nicht nebeneinander existieren** — deshalb bitte ausschließlich die
Werte aus Schritt 2 verwenden, keine aus Beispielen.

### Schritt 4 — Einschalten

Im Portal den Schalter auf **Enabled**, oder:

    Set-DkimSigningConfig -Identity hsb-boden.de -Enabled $true

Danach zur Kontrolle Schritt 1 wiederholen: **Enabled: True, Status: Valid**.

### Schritt 5 — SPF und DMARC gegenprüfen

Microsoft weist ausdrücklich darauf hin: *„DKIM alone is not enough."*
Bitte bei der Gelegenheit prüfen, ob für `hsb-boden.de` ein gültiger
SPF-Eintrag und eine DMARC-Richtlinie existieren.

---

# B · Administratorzustimmung für eine App *(nur falls Weg 2 gewählt wird)*

**Wichtig vorab: Das wird sehr wahrscheinlich nicht gebraucht.**

Der operative Weg läuft über **Power Automate** mit dem
Office-365-Outlook-Connector. Das ist eine Microsoft-Erstanbieter-App, in jedem
Tenant vorautorisiert — jeder Benutzer meldet sich für sein **eigenes** Postfach
an, keine Administratorzustimmung nötig. Auf diesem Weg sind bereits 67 Entwürfe
in den beiden Postfächern entstanden.

Nur falls stattdessen der direkte Graph-Weg genutzt werden soll:

    Anwendung   HSB Sales OS Entwuerfe
    Client-ID   43c0f077-be59-4509-be74-3d82821eaf0a
    Berechtigung  Mail.ReadWrite  (delegiert)

**Entra-Portal → Unternehmensanwendungen → die Anwendung suchen →
Berechtigungen → Administratorzustimmung erteilen**

`Mail.ReadWrite` erlaubt das **Erstellen und Ändern von Entwürfen**. Es
enthält **kein** Senderecht — `Mail.Send` wird ausdrücklich nicht angefragt.

---

## Was ausdrücklich **nicht** angefragt wird

- Keine Administratorrechte für Joel oder Jordi
- Keine Änderung an Tenant-Einstellungen oder Richtlinien
- Kein `Mail.Send`, kein Zugriff auf fremde Postfächer
- Keine Anwendungsberechtigung (`Application`), nur delegiert im Namen des
  jeweils angemeldeten Benutzers

## Aufwand

Punkt A: etwa 10 Minuten plus DNS-Wartezeit.
Punkt B, falls überhaupt: zwei Klicks.
