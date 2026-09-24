# Q7 GUI — Status

Stand: 01.07.2026

## Abgleich mit der ursprünglichen Bauanleitung

| Baustein | Status | Anmerkung |
|---|---|---|
| Projekt-Setup (Next.js, Tailwind, TS) | ✅ | wie spezifiziert |
| Sidebar (Nav, aktiver Zustand, Footer) | ✅ | inkl. mobilem Hamburger-Menü |
| Chat (Agent-/Space-Selector, Feed, Eingabe) | ✅ übertroffen | echte `/api/chat`-Route statt reinem Dummy, Sende-Status, Fehlerbehandlung |
| Input (read-only Tabelle) | ✅ | exakt wie Spec |
| Spaces (Karten-Grid) | ✅ | "Neuer Space" erzeugt jetzt Protokoll-Eintrag |
| Output (Liste + GF-Aktionen) | ✅ übertroffen | Aktionen schreiben live ins Protokoll |
| Agenten (Karten-Grid) | ✅ | "Chat öffnen" springt korrekt |
| Wissen | ✅ übertroffen | war Platzhalter in der Spec, jetzt echte Bibliothek mit Kategorie-Filter (auf deinen Wunsch) |
| Studio | ✅ übertroffen | war Platzhalter in der Spec, jetzt Werkzeug-Kacheln mit Agenten-Zuordnung (auf deinen Wunsch) |
| Protokoll (Liste + Filter) | ✅ übertroffen | Filter sind jetzt funktional, live gespeist aus echten Aktionen |
| Einstellungen | ✅ | Granularitäts-Schalter bewusst nur Anzeige, wie in Spec gefordert |
| Kein Login | ✅ | wie gefordert |
| Mobile-Responsive | ✅ | Sidebar ausblendbar |

**Alle Punkte der ursprünglichen Bauanleitung sind umgesetzt.** Wissen, Studio, Output und Protokoll gehen inhaltlich über den ursprünglichen Platzhalter-Stand hinaus, weil wir sie gemeinsam konkretisiert haben.

## Bewusst offen gelassen

- **Login/Auth** — laut Spec im Grundgerüst nicht vorgesehen
- **Persistenz** — aktueller Zustand (Protokoll-Einträge etc.) lebt nur in der Browser-Sitzung, keine Datenbank
- **Echtes Hermes-Routing** — GF wählt Agent aktuell manuell aus, kein automatisches Routing der Anfrage

## ✅ Erledigt seit letztem Stand

- **Slash-Befehl-Register (Maßnahme 2.4)**: `/space`, `/agent`, `/status`, `/protokoll`, `/neu`,
  `/rückgängig`, `/verdichten` im Chat nutzbar. `/vorschlag` bewusst nur als Hinweis (Agenten-reserviert).
- **Protokoll-Kommentare / Comment-driven Wakes (Maßnahme 2.6)**: jeder Protokoll-Eintrag hat einen
  Kommentar-Thread. Kommentar reaktiviert den zuständigen Agenten direkt im Thread, nicht im Haupt-Chat.
  Protokoll-Seite von Tabelle auf Karten umgestellt, um Threads darzustellen.
- Vergleichsmodus, Token-/Kosten-Anzeige, Testphase-Begrenzung (siehe vorherige Einträge)

## Aus dem Maßnahmenkatalog noch NICHT umgesetzt (bewusst zurückgestellt)

Die übrigen Punkte aus `Q7_Massnahmen_Zusammenfassung` sind Backend-/Prozess-Ebene, nicht GUI:
Skill-Vorschlagsmechanismus (2.1), Subagent-Delegation mit Live-Fortschritt (2.2), `berechtigung.md`
pro Agent (2.3), Ziel-Referenz-Feld (2.5). Diese betreffen die Hermes-Logik und Prozessdateien selbst,
nicht die Next.js-Oberfläche — separates Thema außerhalb dieses Repos.

## Aktueller Testfokus (auf deinen Wunsch)

Du testest jetzt gezielt mit **Hermes** (Koordination) und **Sicherheit** (Compliance), während du als
GF Ergebnisse in Output freigibst/entscheidest. Sobald OpenRouter-Anbindung, Ordnerstruktur und
Oberfläche damit reibungslos laufen, aktivieren wir weitere Agenten — dafür einfach in `lib/types.ts`
bei `AGENTS` das jeweilige `aktiv: false` auf `true` setzen. Kein sonstiger Code-Umbau nötig, GUI und
Studio reagieren automatisch darauf.

## Vorschlag für den nächsten Schritt

Der Chat ist jetzt "live" — sobald ein API-Key hinterlegt ist, antworten die Agenten wirklich.
Sinnvolle nächste Schritte:

1. **Echte System-Prompts** einbauen (deine `wt_role_rules.md`-Dateien pro Agent statt Platzhalter-Text)
2. **Hermes-Routing**: automatische Zuordnung der Anfrage zum passenden Agenten, statt manueller Auswahl
3. Design-Feinschliff
4. Login/Auth ergänzen

Sag Bescheid, was du priorisierst.
