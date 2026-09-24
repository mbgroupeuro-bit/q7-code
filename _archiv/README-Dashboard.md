# Q7 Dashboard — Einbau-Anleitung (Stand: finale, vereinte Sidebar)

## 1. Dateien — diese vier ersetzen/einsetzen

```
components/Sidebar.tsx                        → überschreibt eure bestehende Sidebar
app/layout.tsx                                 → überschreibt euer bestehendes Root-Layout
components/dashboard/DashboardWidgets.tsx      → neu, in Unterordner components/dashboard/
app/dashboard/page.tsx                         → neu, in Unterordner app/dashboard/
```

`components/Sidebar.tsx` ist die **vereinte** Version: enthält weiterhin alle bisherigen
Chat-Funktionen (Neuer Chat, Suche, Chatliste mit Umbenennen/Löschen, Mobile-Drawer) —
zusätzlich neues Navy/Gold-Design, gruppierte Navigation und den neuen Menüpunkt
"Überblick" (führt zu `/dashboard`). Sie ist ein **Default-Export ohne Props** — holt
sich Chats/Nutzerdaten wie vorher selbst über `useAppState()`.

`app/layout.tsx` bindet sie unverändert simpel ein: `<Sidebar />`.

## 2. Farben registrieren (Tailwind 4) — bereits erledigt, nur zur Doku

In `app/globals.css` steht (ans Ende angehängt):

```css
@theme {
  --color-navy: #1B2A56;
  --color-navy-dark: #0F1A38;
  --color-gold: #D4A72C;
}
```

## 3. Icons

Ausschließlich `lucide-react` (bereits in `package.json`). Wichtig: Es wird
**Version 1.x** verwendet, die viele Icon-Namen umbenannt hat. Falls neue Icons
ergänzt werden, immer den aktuellen Namen auf lucide.dev prüfen (z. B.
`CheckSquare` → `SquareCheck`, `BarChart3` → `ChartColumn`, `LineChart` → `ChartLine`).

## 4. Routen-Zuordnung (Sidebar-Navigation)

| Label | Route |
|---|---|
| Überblick | `/dashboard` (neu) |
| Posteingang | `/input` |
| Aufgaben | `/aufgaben` |
| Kalender | `/kalender` |
| Entwicklung | `/studio` |
| Arbeitsbereiche | `/spaces` |
| Ausgabe | `/output` |
| ERP *(Neu)* | `/erp` |
| Chronik | `/protokoll` |
| Bibliothek | `/ablage` |
| Einstellungen | `/einstellungen` |

## 5. Platzhalterdaten ersetzen

Alle Beispieldaten in `app/dashboard/page.tsx` (`wichtigItems`, `aufgabenItems`,
`kalenderItems`, `statusBars`, `kpiValues`) sind mit `// TODO` markiert und müssen
später durch echte Server-Abfragen ersetzt werden. Laut Konzept läuft das über die
Integrationsplattform, nicht direkt gegen ein ERP.

Sidebar-Badges (Posteingang: 8, Aufgaben: 12) kommen aus `useAppState()` — Feldnamen
`ungeleseneInputs` / `offeneAufgaben` ggf. an euer reales Store-Schema anpassen.

## 6. Noch offen

- **Widget-Konfiguration** (Ein-/Ausblenden + Pfeil-Reihenfolge, Live-Vorschau) —
  Konzept steht (siehe Q7_Dashboard_Posteingang_Konzept.docx), Code noch nicht gebaut
- **Datenanbindung** über die Integrationsplattform (Connector-Layer)
- **Posteingang-Seite** (Kanal-Tabs + Antwort-Panel) — Konzept steht, Code noch nicht gebaut
- Sidebar-Footer zeigt noch hartkodiert "Peter's Team" / "Admin" — auf echte
  Session-/Auth-Daten umstellen
