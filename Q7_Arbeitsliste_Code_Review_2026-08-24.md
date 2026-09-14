# Q7 — Arbeitsliste (Stand 24.08.2026, v2)

Erstellt im Anschluss an den externen Code Review vom 23.08.2026 und die
gemeinsame Umsetzungs-Session vom 24.08.2026. Alle 🔴- und 🟠-Punkte aus dem
Review sowie die dabei entdeckten Zusatzfunde sind bereits erledigt und
getestet — diese Liste enthält nur noch das, was übrig ist.

Erledigte Punkte sind zur Nachvollziehbarkeit unten mit durchgestrichen
markiert, nicht gelöscht (Konvention aus Q7_Änderung_1.md).

---

## Bereits erledigt (24.08.2026, zur Referenz)

- ~~Alle 6 🔴-Punkte (A14-Gate, Rollenprüfung, Eingabelimits, Timeouts,
  Modell-Slugs, Proxy)~~
- ~~🟠 Punkte 7–11 (Indizes, DATABASE_URL, Drift-Check, errorKind, kostenUsd)~~
- ~~`.env`/`.env.local`/`prisma.config.ts`-Ladereihenfolge korrigiert~~
- ~~`types.tsx` → `types.ts`, Agenten A15–A17 ergänzt, GF/Kunden-Terminologie
  korrigiert~~
- ~~`.gitignore` ergänzt (`*.db`, tote Dateien)~~
- ~~`kalender_page.tsx` → `page.tsx`~~
- ~~`lib/prisma.ts` zentralisiert, `[id]/route.ts` zur echten PATCH-Funktion
  ausgebaut (Status offen/erledigt), getestet gegen echte DB~~
- ~~**AR-01**: Tote Dateien gelöscht (`api - Verknüpfung.lnk`,
  `schema_prisma_BEREINIGT.txt`, `struktur.txt`)~~
- ~~**ND-01**: Dritte `MeineAufgabe`-Erstellstelle gefunden und repariert —
  `app/api/meine-aufgaben/route.ts` enthielt fälschlich `AufgabeChat`-Logik
  statt einer echten `POST`-Route für Titel/Beschreibung. Dabei **zwei echte,
  bislang unbemerkte UI-Bugs gefunden und behoben**: der "Erledigt"-Button
  und der "+ Neue Aufgabe"-Button in `AufgabenListe.tsx` funktionierten beide
  nicht (kein sichtbarer Fehler im UI, da `fetch`-Ergebnis nie geprüft wurde).
  Beide jetzt getestet und funktionsfähig gegen echte DB bestätigt.~~

---

## 🟡 Aufräumen

| ID | Aufgabe | Aufwand |
|---|---|---|
| **AR-02** | `neueTaskId()` in `poll-gmail.js` zentralisieren, falls ein zweiter Schreiber für `Aufgabe` dazukommt (aktuell einziger Schreiber, geringe Dringlichkeit) | offen |
| **AR-03** | Prüfen, ob `q7_agenten.db` jemals in Git committed war — falls ja, mit `git rm --cached` aus der Historie entfernen | ~5 Min, nur falls zutreffend |

## 🔎 Neu entdeckt (24.08.2026), noch ungeklärt

| ID | Aufgabe | Aufwand |
|---|---|---|
| **ND-02** | Entscheidung: `aufgabe-chat`-Feature bauen oder verwerfen (aktuell nur Entwurf, nie im Projekt gespeichert) | Admin-Entscheidung |
| **ND-03** | `fetch`-Aufrufe in `AufgabenListe.tsx` prüfen nie `response.ok` — bei Fehlern lädt die Seite trotzdem ohne Hinweis neu. Betrifft `neueAufgabeAnlegen` und `statusWechseln`. | ~15 Min |

## 🟢 Später einplanen (laut Review selbst nicht dringend)

| ID | Aufgabe | Aufwand |
|---|---|---|
| **SP-01** | Prisma 6 → 7 Upgrade (Breaking Changes, bewusster eigener Schritt) | mehrere Stunden |
| **SP-02** | HTTPS + Rate-Limit (erst bei Internet-Exposure zwingend) | — |
| **SP-03** | Tests (Vitest) für `lib/wissen.ts`, `lib/ablage.ts`, API-Routen | mehrere Stunden |
| **SP-04** | Streaming (SSE) für Chat-Gefühl | — |
| **SP-05** | Echtes User-/Rollenmodell in der DB (`zugewiesen_an` aktuell freier String) | — |
| **SP-06** | Input-Gate zusätzlich zum Output-Gate (A14 prüft aktuell nur Antworten, nicht eingehende Kanal-Inhalte wie E-Mails) | — |

## 📋 Aus früheren Sitzungen offen (nicht Teil dieser Review-Session)

| ID | Aufgabe | Quelle |
|---|---|---|
| **FS-01** | Bulk-Umbenennung `kunde_id` → `lizenznehmer_id` in `mandantenDb.ts`/`mandanten_schema.sql`, vollständiger Sweep über Code/DB-Schema/Doku | Terminologie-Konvention |
| **FS-02** | Q7-ERP: RLS-Policies (Aufgabe 4) | Q7ERP_Aufgabenliste_v2 |
| **FS-03** | Q7-ERP: Tenancy-Middleware (Aufgabe 5) | Q7ERP_Aufgabenliste_v2 |
| **FS-04** | Q7-ERP: erste `LizenznehmerService`-Klasse (Aufgabe 6) | Q7ERP_Aufgabenliste_v2 |
| **FS-05** | Connector-Architektur Q7 ↔ Q7-ERP (A15) — noch nicht implementiert | Agenten-Registry |
| **AD-01** | Admin-Entscheidung: Platzierung OSS-Referenzdokument (`07_Doku/referenz-projekte.md` vorgeschlagen) | offene Admin-Entscheidung |
| **AD-02** | Admin-Entscheidung: Layer-Reviews L4–L8 (L1–L3 bereits bestätigt sauber) | offene Admin-Entscheidung |
| **AD-03** | Admin-Entscheidung: Umbenennung `01_Mandanten_Datenbank`-Ordner | offene Admin-Entscheidung |
| **AD-04** | Kapselungs-Audit `agentenDb.ts`/`mandantenDb.ts` — läuft DB-Zugriff sauber über Service-Layer? | Weekend-Review-Punkt |

---

## Änderungsprotokoll

- **24.08.2026, v1:** Erstellt im Anschluss an die Umsetzungs-Session des
  externen Code Reviews vom 23.08.2026.
- **24.08.2026, v2:** AR-01 und ND-01 abgeschlossen. Dabei zwei reale UI-Bugs
  gefunden und behoben (Erledigt-Button, Neue-Aufgabe-Button). Neuer Punkt
  ND-03 (fehlende response.ok-Prüfung) ergänzt, ND-02 aus ursprünglichem
  ND-01 abgespalten (war zwei getrennte Fragen).

