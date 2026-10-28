# Carbon Companion

Minimalistische, interaktive **Netto-Carbon-Balance** für eine AI-gesteuerte
Energiemanagement-Lösung (BIP 2026 · E2 Energy · Gruppenprojekt 11).

Der Companion-Avatar ist das Haupt-Interaktionselement: **antippen** blättert
durch die Ergebnisse (Nettobilanz, Fußabdruck, Unsicherheit, Break-even,
Systemgrenze). Er reagiert „emotional" — Farbe und Gesicht ändern sich je nach
Nettobilanz. Eine dauerhaft sichtbare Anzeige zeigt, ob sich die AI lohnt.
Die Modellparameter liegen in einem aufklappbaren **Debug-Menü** (⚙ oben rechts).

Sprachen: English, Deutsch, Polski, Italiano, Español, Français.

## Live

https://SirQuacksALot.github.io/carbonCompanion/

## Lokal starten

```bash
npm start        # oder: node server.js
# → http://localhost:5173
```

`index.html` funktioniert auch direkt per Doppelklick (ohne Server).

Oder mit Docker:

```bash
docker compose up -d --build
```

## Aufbau

```
carbonCompanion/
├── index.html       # Markup, Companion-SVG, Debug-Drawer
├── style.css        # Tokens, Layout, Companion, Anzeigen
├── app.js           # Bilanz-Modell, Monte-Carlo, i18n, Interaktion
├── server.js        # statischer Server (keine Dependencies)
├── package.json
├── Dockerfile
└── docker-compose.yml
```

## Rechenmodell (Beispielannahmen)

Netto = vermiedene Emissionen (Energie × Strommix-Faktor)
      − AI-Fußabdruck (Hardware/5 J. + Datentransfer + Training + Inferenz × RZ-Faktor)

Unsicherheit über Monte-Carlo (2.000 Läufe, Normalverteilungen).

## Sprache ergänzen

In `app.js` einen `I18N.<code> = { … }`-Block mit denselben Keys wie `en`
hinzufügen und den Code in `LANGS` aufnehmen.
