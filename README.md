# Q7 GUI

KI-Betriebssystem-Oberfläche für Peter's Team. Next.js 16 (App Router), TypeScript, Tailwind CSS v4, lucide-react.

Alle Seiten sind aktuell **statisch mit Dummy-Daten** (kein Backend, keine Datenbank), gemäß Bauanleitung.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

→ `http://localhost:3000`

## Build & Test des Production-Builds

```bash
npm run build
npm run start
```

## Deployment auf einem eigenen VPS (Hetzner / IONOS)

Next.js läuft im Standalone-Modus als Node-Prozess — kein Vercel/Serverless nötig.

**1. Standalone-Output aktivieren** (einmalig in `next.config.ts`):

```ts
const nextConfig = {
  output: "standalone",
};
export default nextConfig;
```

**2. Auf dem Server bauen (oder lokal bauen und hochladen):**

```bash
npm ci
npm run build
```

Der Standalone-Output liegt danach in `.next/standalone/`. Kopiere zusätzlich `.next/static` nach
`.next/standalone/.next/static` und den `public/`-Ordner nach `.next/standalone/public`.

**3. Prozess dauerhaft am Laufen halten (PM2):**

```bash
npm install -g pm2
pm2 start .next/standalone/server.js --name q7-app
pm2 save
pm2 startup
```

Der Server hört standardmäßig auf Port 3000 (per `PORT`-Env-Variable änderbar).

**4. Nginx als Reverse-Proxy davor** (Beispiel `/etc/nginx/sites-available/q7`):

```nginx
server {
    listen 80;
    server_name deine-domain.de;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Danach `certbot` für HTTPS (Let's Encrypt) einrichten.

## Struktur

```
app/
├── layout.tsx          Root-Layout (Sidebar + Main)
├── page.tsx             Startseite = Chat
├── input/page.tsx
├── spaces/page.tsx
├── output/page.tsx
├── agenten/page.tsx
├── wissen/page.tsx       Platzhalter
├── studio/page.tsx       Platzhalter
├── protokoll/page.tsx
└── einstellungen/page.tsx
components/
├── Sidebar.tsx
├── ChatWindow.tsx
├── AgentSelector.tsx
└── SpaceSelector.tsx
lib/
└── types.ts              Typen + Dummy-Daten
```

## Modell-Anbindung (OpenRouter)

Der Chat läuft über [OpenRouter](https://openrouter.ai). Die **Modellwahl ist bewusst nicht im Code
festgelegt**, sondern komplett über Umgebungsvariablen steuerbar — du kannst jederzeit ein anderes
Modell einstellen, ohne Code anzufassen.

**Setup:**

1. API-Key erzeugen: [openrouter.ai/keys](https://openrouter.ai/keys)
2. `.env.example` zu `.env.local` kopieren:
   ```bash
   cp .env.example .env.local
   ```
3. Key eintragen (`OPENROUTER_API_KEY=...`) und gewünschtes Modell setzen (`OPENROUTER_MODEL=...`)
4. `npm run dev`

**Modellwahl:**

- `OPENROUTER_MODEL` — globaler Standard für alle Agenten
- `OPENROUTER_MODEL_<KUERZEL>` — optionale Ausnahme für einen einzelnen Agenten
  (z.B. `OPENROUTER_MODEL_A01A` für Hermes)
- Modell-Slugs (beliebiger Anbieter über OpenRouter möglich): [openrouter.ai/models](https://openrouter.ai/models)

Ohne gesetzten `OPENROUTER_API_KEY` zeigt der Chat einen klaren Hinweis statt eines kryptischen Fehlers.

## Slash-Befehle (Chat)

Im Chat-Eingabefeld verfügbar (Maßnahme 2.4 aus `Q7_Massnahmen_Zusammenfassung`):

| Befehl | Wirkung |
|---|---|
| `/space [Name]` | Space wechseln |
| `/agent [Kürzel]` | Agent wechseln (nur aktive Agenten) |
| `/status` | Aktueller Space, Agent, Vergleichsmodus |
| `/protokoll` | Letzte 5 Protokoll-Einträge im Chat anzeigen |
| `/neu` | Chat-Kontext zurücksetzen |
| `/rückgängig` | Letzten Nachrichtenaustausch entfernen |
| `/verdichten` | Sichtbare Session-Historie zu einer Kurzfassung komprimieren |

`/vorschlag` ist laut Maßnahmenkatalog Agenten vorbehalten — von der GF aus getippt kommt ein Hinweis
statt einer Ausführung.

## Protokoll-Kommentare (Comment-driven Wakes)

Jeder Protokoll-Eintrag hat einen "Kommentieren"-Button. Ein Kommentar reaktiviert den zuständigen
Agenten (erkannt am `akteur`-Feld, Fallback Hermes) **direkt im Thread des Eintrags** — ohne neuen
Chat zu starten. Antwort erscheint eingerückt unter dem jeweiligen Eintrag (Maßnahme 2.6).

## Vergleichsmodus (Modelle nebeneinander testen)

Button "Vergleichsmodus" im Chat aktiviert paralleles Abfragen mehrerer Modelle mit derselben Nachricht
(Standard: Haiku/Sonnet/Opus, überschreibbar via `OPENROUTER_COMPARE_MODELS` in `.env.local`). Antworten
erscheinen nebeneinander mit echten Token-/Kosten-Werten pro Modell — nützlich, um vor einer Festlegung
zu sehen, welches Modell für eine Aufgabe am besten passt.

## Token- & Kosten-Anzeige

Jede Chat-Antwort zeigt die echte Token-Zahl und (sofern von OpenRouter geliefert) die tatsächlichen
Kosten in USD — keine Schätzung, sondern die von OpenRouter direkt mitgelieferten Werte
(`usage: { include: true }` im Request). Sichtbar unter jeder Agenten-Nachricht im Chat und als
Protokoll-Eintrag ("Antwort erhalten – N Tokens (~$X)").

## Zugriffssperre (bevor es auf den VPS geht)

Solange kein echtes Login existiert, sperrt `proxy.ts` (Next.js Basic-Auth-Middleware) die gesamte App
hinter einem gemeinsamen Benutzername/Passwort. **Vor dem VPS-Deployment unbedingt setzen:**

```
BASIC_AUTH_USER=peter
BASIC_AUTH_PASSWORD=ein-sicheres-passwort-hier
```

Lokal (`npm run dev`) kann das leer bleiben — dann ist die Sperre deaktiviert. Details und Hintergrund
zur Geheimhaltung von Prompts/Agenten-Wissen: siehe `SICHERHEIT.md`.

## Nächste Ausbaustufen

- **Echtes Agenten-Routing**: aktuell wählt der Chat immer nur den in der GUI ausgewählten Agenten an.
  Die eigentliche Hermes-Logik (welcher Agent bekommt welche Anfrage automatisch) fehlt noch — aktuell
  entscheidet die GF das manuell über den Agent-Selector.
- System-Prompts der Agenten sind noch Platzhalter (`route.ts` → `systemPromptFuerAgent`) — später durch
  die echten `wt_role_rules.md`-Inhalte ersetzen.
- Login (aktuell bewusst nicht enthalten)
- Wissen: echte Dokumente/Dateien statt Dummy-Einträge anbinden (z.B. über Input-Pipeline)
- Studio: "Werkzeug starten" öffnet ein **Parameter-Formular** (pro Werkzeug definierte Felder in
  `lib/types.ts` → `STUDIO_TOOLS[].felder`). Beim Bestätigen wird ein Protokoll-Eintrag erzeugt und der
  Chat mit vorausgewähltem Agent sowie vorausgefülltem, editierbarem Nachrichtenentwurf geöffnet.
- Protokoll-Granularität funktional schalten

## Konzept Wissen vs. Studio

- **Wissen** = Bibliothek: passives Nachschlagewerk (Verträge, Prozesse, Preislisten, Regeln)
- **Studio** = Werkbank: aktive Werkzeuge, die ein Ergebnis erzeugen (Angebot, Produktionsauftrag, Content-Plan, ...),
  jeweils einem Agenten zugeordnet. Klick auf "Werkzeug starten" öffnet den Chat mit
  vorausgewähltem Agenten. Ergebnisse landen am Ende in **Output**.

## Gemeinsamer Session-State (`lib/store.tsx`)

Die Seiten sind über einen React-Context (`AppStateProvider`, im Root-Layout eingehängt) verbunden.
Aktionen erzeugen dadurch **live Protokoll-Einträge**, ohne dass ein Backend nötig ist:

- Output → Freigeben / An Kunden teilen / Nächster Schritt
- Spaces → Neuer Space
- Studio → Werkzeug starten
- Chat → Nachricht senden

Der State lebt nur innerhalb der Browser-Sitzung (kein LocalStorage, keine Datenbank) und bleibt beim
Navigieren zwischen Seiten erhalten, weil der Provider im Root-Layout sitzt und nicht neu gemountet wird.
Beim Neuladen der Seite setzt er sich auf die Dummy-Ausgangsdaten zurück.
