# Adapter per Termux einspielen

Getestet gegen clasp **3.4.1**. Keine Heredocs, jeder Block ist einzeln
kopierbar.

---

## Zuerst lesen — die eine Gefahr

`clasp push` spiegelt das lokale Verzeichnis ins Skriptprojekt. **Dateien, die
lokal fehlen, werden im Projekt gelöscht.** Wenn du in ein Verzeichnis pushst,
das nur den Adapter enthält, ist die Engine weg.

Deshalb die Reihenfolge unten genau einhalten: erst das Projekt holen, dann den
Adapter dazulegen, dann pushen. Und in Schritt 4 eine Sicherungsversion anlegen.

---

## 1. Termux vorbereiten

    pkg update -y
    pkg install -y nodejs-lts git
    npm install -g @google/clasp@3.4.1
    clasp -v

Falls `nodejs-lts` nicht gefunden wird: `pkg install -y nodejs`.
Erwartet: `3.4.1`.

## 2. Anmelden

    clasp login --no-localhost

Ohne `--no-localhost` wartet clasp auf einen lokalen Server — auf dem Handy der
übliche Hänger. Mit dem Schalter bekommst du eine URL, öffnest sie im Browser
und fügst den Code zurück ins Terminal.

Prüfen:

    clasp show-authorized-user

## 3. Projekt holen

    mkdir -p ~/hsb && cd ~/hsb
    clasp clone 1Xl6xkMTyn3Hu6UvBoX7gVrdppuyRal04NH6Ei16hnz_Pfuq-JWmh9U4c
    ls

**Stopp, wenn hier nicht die Engine liegt.** Erwartet werden unter anderem
`appsscript.json`, `HSB_SALES_OS.js` und `Sidebar.html`. Siehst du nur
`appsscript.json`, hast du das falsche Projekt — nicht weitermachen, sonst
löscht der spätere Push die Engine.

## 4. Sicherungsversion anlegen

    clasp create-version "vor Draft-Adapter"

Das erzeugt eine unveränderliche Version. Notiere die ausgegebene Nummer.

## 5. Adapter holen

    curl -fsSL -o HSB_DraftAdapter.gs https://raw.githubusercontent.com/cherinojoel-lang/hsb-boden/claude/hsb-boden-architecture-o2479f/docs/sales-os/HSB_DraftAdapter.gs
    head -3 HSB_DraftAdapter.gs

## 6. Scope ins Manifest

Der Adapter ruft `UrlFetchApp` auf und braucht dafür
`script.external_request`. Dieser Einzeiler ergänzt ihn nur, wenn das Manifest
bereits eine explizite Scope-Liste hat:

    node -e "const fs=require('fs'),f='appsscript.json',j=JSON.parse(fs.readFileSync(f));if(!j.oauthScopes){console.log('KEINE oauthScopes im Manifest. Nichts geaendert - Apps Script leitet die Scopes selbst ab.');process.exit(0)}const s='https://www.googleapis.com/auth/script.external_request';if(j.oauthScopes.indexOf(s)>=0){console.log('Scope bereits vorhanden.');process.exit(0)}j.oauthScopes.push(s);fs.writeFileSync(f,JSON.stringify(j,null,2));console.log('Scope ergaenzt.')"

Warum diese Vorsicht: Sobald `oauthScopes` existiert, gilt die Liste
abschließend. Eine Liste mit nur einem Eintrag anzulegen würde der Engine ihre
Zugriffe auf Tabelle und Drive nehmen. Meldet der Befehl „KEINE oauthScopes",
lass es so — Apps Script ermittelt die Scopes dann selbst.

Kontrolle:

    cat appsscript.json

## 7. Vor dem Push prüfen, was gepusht wird

    clasp status

Die Liste muss die Engine-Dateien **und** `HSB_DraftAdapter.gs` enthalten.
Fehlt eine Engine-Datei, nicht pushen.

## 8. Push

    clasp push

## 9. Preflight im Editor

    clasp open-script

Im Editor `preflight` auswählen und ausführen. Sie verändert nichts und meldet,
ob die Engine-Funktionen wirklich `readLeads_`, `getVerifiedFlyer_`,
`renderEmail_` und `logActivity_` heißen und beide Adapter-URLs gesetzt sind.

Bei `PREFLIGHT=FAIL` nichts weiter starten. Die Namen im Adapter an die Engine
anpassen — nicht die Engine an den Adapter.

## 10. Skripteigenschaften setzen

Geht nicht über clasp. Im Editor: **Projekteinstellungen → Skripteigenschaften**

    HSB_ADAPTER_URL_JORDI = <HTTP-POST-URL des Jordi-Flows>
    HSB_ADAPTER_URL_JOEL  = <HTTP-POST-URL des Joel-Flows>

Danach `preflight` erneut laufen lassen, bis `PREFLIGHT=PASS` steht.

## 11. Erster Entwurf

Im Editor `entwurfTesten` ausführen — genau ein Entwurf. In Outlook ansehen:
Anrede, Zeilenumbrüche, Betreff, Flyer als Anhang. Passt er, `entwuerfeErzeugen`
für den Rest des Batches.

---

## Wenn etwas schiefgeht

Versionen ansehen:

    clasp list-versions

Stand aus Schritt 4 in ein frisches Verzeichnis holen und zurückspielen
(`<NR>` ist die notierte Versionsnummer):

    mkdir -p ~/hsb-restore && cd ~/hsb-restore
    clasp clone 1Xl6xkMTyn3Hu6UvBoX7gVrdppuyRal04NH6Ei16hnz_Pfuq-JWmh9U4c <NR>
    clasp status
    clasp push

Erst `clasp status` lesen, dann pushen.
