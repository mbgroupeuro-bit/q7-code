# Optimierung Q7 – Zielbild und Prioritäten

## Ziel

Das Projekt Q7 ist technisch bereits weit fortgeschritten: Es enthält eine Next.js-Anwendung, Prisma-Modelle, mehrere API-Routen, Agentenlogik, Aufgaben-, Posteingang-, Kalender- und Projekt-Module sowie KI-Integrationen. Der nächste Schritt ist nicht ein kompletter Rewrite, sondern eine gezielte Stabilisierung, Strukturverbesserung und Sicherheits-/Datenmodell-Standardisierung.

Die Priorität liegt darin, aus dem aktuellen Prototyp ein belastbares, wartbares und gut dokumentiertes System zu machen.

---

## 1. Grundsatz

Q7 soll nicht neu gebaut werden, sondern sauber organisiert werden.

Die wichtigsten Prinzipien:

- bestehende Funktionen behalten
- fachliche Bereiche klar trennen
- Dokumentation und Code auf einen aktuellen Stand bringen
- Sicherheits- und Tenant-Prinzipien konsequent durchsetzen
- Architekturbestandteile im Sinne von Domänen, Services und Infrastruktur sauber aufteilen

---

## 2. Kernprobleme der aktuellen Struktur

### 2.1 Dokumentation und Ist-Zustand stimmen nicht immer überein

Die README und andere zentrale Dokumente beschreiben teilweise noch einen älteren Zustand, der nicht mehr zum aktuellen Code passt.

Beispiele:

- README beschreibt überwiegend eine statische App mit Dummy-Daten
- der Code enthält aber bereits API-Routen, Datenbank, Prisma-Migrationen, Aufgabenlogik, Agentenlogik und Projektstrukturen
- STATUS.md und andere Dokumente enthalten teilweise veraltete Architekturannahmen

### Empfehlung

README, STATUS und Architektur-Dokumentation klar trennen:

```text
README.md                -- Installation, Start, Deployment
ARCHITECTURE.md          -- technische Architektur
STATUS.md                -- aktueller Entwicklungsstand
ROADMAP.md               -- geplante Arbeiten
SECURITY.md              -- Sicherheitsmodell
TRACEABILITY.md          -- Doku / Ticket / Code / Test
```

### 2.2 Historische Kommentare liegen im produktiven Code

Im Code sind viele Kommentare zu Einträgen aus früheren Umsetzungen vorhanden, z. B.:

- alte Architekturentscheidungen
- vergangene Fixrunden
- Windows-Pfade von früheren Entwicklungsumgebungen
- temporäre Anpassungen und Zwischenstände

Diese Informationen sind für die Historie wichtig, aber nicht im produktiven Quellcode zu platzieren.

### Empfehlung

Historische Einträge nach `docs/decisions/` oder `docs/archive/` verschieben. Im produktiven Code bleiben nur noch aktuelle Kommentare mit fachlicher Relevanz.

### 2.3 `app/api/chat/route.ts` ist zu groß und erfüllt zu viele Aufgaben

Die Chat-Route übernimmt derzeit zu viele Verantwortlichkeiten auf einmal:

- Auth/Role-Checks
- Request-Validation
- Prompt-Aufbau
- Wissensdaten laden
- Anhänge verarbeiten
- KI-Aufruf
- Tool-Ausführung
- Delegation/Autonomie-Logik
- Response-Aufbereitung

Das macht die Datei schwer wartbar und testbar.

### Empfehlung

Die Route als HTTP-Interface klein halten. Die fachliche Logik in Services und Module auslagern.

Beispiel:

```text
app/api/chat/route.ts
  -> HTTP-Eingabe/Ausgabe

lib/chat/
  schema.ts
  service.ts
  context.ts
  prompts.ts
  response.ts

lib/ai/
  provider.ts
  model-selection.ts
  usage.ts
  safety-gate.ts
```

---

## 3. Zielstruktur für den Code

Die Struktur sollte in Arbeitspakete und Domänen aufgeteilt werden, statt alles in einer flachen Datei- und Ordnerstruktur zu belassen.

```text
app/
  (public)/
    login/
      page.tsx

  (workspace)/
    dashboard/
    chat/
    posteingang/
    aufgaben/
    kalender/
    projekte/
    studio/
    output/
    ablage/
    einstellungen/

  admin/
    agenten/
    tenants/
    policies/
    protokoll/

  api/
    auth/
    chat/
    posteingang/
    aufgaben/
    kalender/
    projekte/
    wissen/
    studio/
    admin/

components/
  ui/
  layout/
  chat/
  posteingang/
  aufgaben/
  kalender/
  projekte/
  studio/
  admin/

lib/
  auth/
  authorization/
  chat/
  ai/
  ki-agent/
  policy/
  wissen/
  posteingang/
  aufgaben/
  kalender/
  projekte/
  storage/
  audit/
  db/

prisma/
  schema.prisma
  migrations/
  seed.ts

tests/
  unit/
  integration/
  e2e/

docs/
  ARCHITECTURE.md
  SECURITY.md
  DATABASE.md
  ROUTES.md
  TRACEABILITY.md
  decisions/
  runbooks/
```

---

## 4. Bereiche sauber trennen

### 4.1 UI

In `app/` und `components/` gehören nur:

- Darstellung
- Interaktion
- Route-Komponenten
- Seitennavigation

Nicht hier hinein gehören:

- Prisma-Zugriffe
- OpenRouter-Aufrufe
- Rollenentscheidungen
- fachliche Workflow-Logik

### 4.2 Fachlogik

In `lib/chat/`, `lib/posteingang/`, `lib/aufgaben/`, `lib/kalender/`, `lib/projekte/` gehören:

- fachliche Services
- Datenmodelle
- Validierungen
- Domänenregeln

### 4.3 Infrastruktur

In `lib/db/`, `lib/auth/`, `lib/policy/`, `lib/audit/`, `lib/storage/`, `lib/ai/` gehören:

- Datenbankzugriff
- Authentifizierung
- Sicherheitsprüfungen
- Audit- und Storage-Mechanismen
- KI-Provider-Integration

### 4.4 Agentenlogik

`lib/ki-agent/` sollte die Agenten-Orchestrierung und Tool-Logik weiter zentralisieren. Diese Logik sollte keinesfalls mit UI- oder HTTP-Details vermischt sein.

---

## 5. Agentenarchitektur weiter professionalisieren

Die vorhandene Struktur in `lib/ki-agent/` ist ein guter Ausgangspunkt. Sie sollte jedoch weiter aufgebrochen werden.

### Empfehlung

```text
lib/ki-agent/
  types.ts
  registry.ts
  routing.ts
  orchestration.ts
  tool-gateway.ts
  tool-policy.ts
  tool-validation.ts
  adapter.ts
  audit.ts
```

### Problematische Stelle

`lib/ki-agent/werkzeuge.ts` ist derzeit zu breit. Sie enthält zugleich:

- Werkzeugdefinitionen
- Zod-Schemas
- Prisma-Zugriffe
- Prozessregister-Logik
- Termin- und Aufgaben-Erstellung
- Autonomie-/Cooling-off-Regeln

Das ist zu viel Verantwortung in einer Datei.

### Bessere Aufteilung

```text
lib/tools/
  registry.ts
  types.ts
  schemas.ts

lib/tools/termin/
  schema.ts
  service.ts
  definition.ts

lib/tools/aufgabe/
  schema.ts
  service.ts
  definition.ts

lib/tools/prozess/
  schema.ts
  service.ts
  definition.ts

lib/tools/autonomie/
  schema.ts
  service.ts
  definition.ts
```

Die Werkzeugdefinition sollte nur noch beschreiben, was ein Werkzeug macht; die eigentliche Logik muss in Services ausgelagert werden.

---

## 6. Sicherheitsmodell verstärken

Die Sicherheitslogik darf nicht direkt im Werkzeug selbst oder im UI verankert sein.

### Ziel

```text
Werkzeug
  -> Tool Gateway
  -> Policy Engine
  -> Domain Service
  -> Tenant-Scoped Repository
  -> Prisma
```

### Nicht zulässig

```text
Werkzeug
  -> direkt Prisma
```

### Grundsatz

Werkzeuge müssen immer über eine zentrale Policy-Prüfung laufen. Dabei muss gewährleistet sein:

- Rollen- und Tenant-Scope werden geprüft
- keine unkontrollierten DB-Zugriffe aus Tools
- jede kritische Aktion wird protokolliert
- Freigaben und Cooling-off-Zeitpunkte werden eingehalten

---

## 7. Datenbank und Tenant-Scope standardisieren

Das Prisma-Schema ist umfangreich und in mehreren Iterationen entstanden. Das ist funktional gut, aber kulturell und technisch noch nicht konsistent genug.

### Probleme

- viele freie Status-Strings
- lose IDs ohne echte Relation
- teilweise unklare Tenant-/Lizenznehmer-Bezüge
- Geschäfts- und Agentendaten im selben Systemmodell
- SQLite als Zwischenlösung, aber Architekturziel ist oft klarer strukturiert

### Empfehlungen

#### 7.1 Statuswerte zentralisieren

Statt einfacher String-Statuswerte besser Enums oder zentrale Typdefinitionen verwenden.

#### 7.2 Tenant-Felder ergänzen

Wichtige Modelle sollten zumindest verfügen über:

```prisma
tenant_id     String
data_space_id String?
```

Das betrifft insbesondere:

- PosteingangEintrag
- MeineAufgabe
- Notiz
- Termin
- AgentChat
- Projekt
- Wissensartefakt
- Ablage
- Output
- Audit

#### 7.3 Lose Beziehungen reduzieren

Einige Felder wie `projekt_id`, `ablage_id` oder `werkzeug_id` sind teilweise los gekoppelt. Diese sollten schrittweise in echte Relation-FKs überführt werden.

---

## 8. Dokumentationsstruktur verbessern

Die Doku ist fachlich stark, aber inhaltlich zu breit und teilweise nicht sauber zwischen aktuellem Stand, Zielarchitektur und Historie getrennt.

### Empfohlene Struktur

```text
docs/
  ARCHITECTURE.md
  SECURITY.md
  DATABASE.md
  ROUTES.md
  TRACEABILITY.md
  decisions/
  runbooks/
```

Zusätzlich sollte jedes verbindliche Dokument klare Merkmale haben:

- Status
- Version
- Geltungsbereich
- Codebezug
- Akzeptanzkriterien
- Testbezug
- Änderungsprotokoll

### Wichtig

Dokumente sollten zwischen den Kategorien unterscheiden:

- IST
- SOLL
- GAP
- ABNAHME

So wird klar, was aktuell umgesetzt ist und was noch offen ist.

---

## 9. Das richtige Verhältnis von Zielarchitektur und Ist-Zustand

Das ist ein zentraler Punkt: Q7-Dokumente beschreiben teilweise die gewünschte Architektur, nicht nur den aktuellen Code.

Das ist nicht falsch, aber es muss transparent gemacht werden.

### Beispiel

```markdown
## Implementierungsstatus

- IST: Rollenwerte existieren in `lib/rollen.ts`.
- IST: Basic Auth existiert in `proxy.ts`.
- FEHLT: echte Sessionverwaltung.
- FEHLT: Tenant-Scope in allen relevanten Modulen.
- SOLL: Session-basierte Identität mit Tenant-Filter.
- ABNAHME: Cross-Tenant-Test Q7-SEC-003.
```

So wissen Entwickler sofort, ob sie in einem bestehenden Modul etwas erweitern oder eine neue Festlegung realisieren müssen.

---

## 10. Nächste Prioritäten in sinnvoller Reihenfolge

### Phase 1: Ordnung schaffen

1. `README.md` und `STATUS.md` auf den aktuellen Codebestand bringen
2. Historische Kommentare aus produktiven Dateien entfernen
3. zentrale Dokumentations-Indexdatei ergänzen
4. aktive Doku von Archiv/Verlauf trennen

### Phase 2: Chat und Agenten entkoppeln

1. `app/api/chat/route.ts` verkleinern
2. Chat-Service auslagern
3. Prompt-Aufbau separieren
4. KI-Provider auslagern
5. Tool-Ausführung über zentrales Gateway steuern

### Phase 3: Datenmodell und Sicherheitsmodell stabilisieren

1. Tenant-Scope durchsetzen
2. lose Beziehungen reduzieren
3. Statuswerte standardisieren
4. Werkzeuglogik von Prisma entkoppeln
5. Policy-/Audit-Schichten zentralisieren

### Phase 4: Tests und Qualität

1. Typecheck und Lint ergänzen
2. Integrationstests für Auth und Tenant-Scopes einbauen
3. E2E-Tests für zentrale Workflows ergänzen
4. CI für Build, Test und Sicherheit einrichten

---

## 11. Was man nicht sofort ändern sollte

Nicht alles ist jetzt sofort zu ändern. Die bestehenden Grundlagen sind sinnvoll:

- Next.js App Router
- TypeScript
- Prisma als ORM
- OpenRouter-Abstraktion über `rufeKIAn()`
- vorhandene UI-Struktur
- bestehende Fachseiten
- bestehende Migrationen (solange sie geprüft sind)

Eine komplette Neuentwicklung würde hier derzeit zu viel Risiko erzeugen.

---

## 12. Meine Prioritätsbewertung

| Bereich | Empfehlung | Priorität |
|---|---|---:|
| README / STATUS / Doku | sofort korrigieren | P0 |
| zentrale Doku-Indexdatei | sofort ergänzen | P0 |
| Chat-Route aufteilen | sehr sinnvoll | P1 |
| Werkzeuge von Prisma entkoppeln | sehr wichtig | P0 |
| Tenant-Scope durchsetzen | zwingend | P0 |
| echte Authentifizierung | zwingend | P0 |
| PostgreSQL- bzw. Produktionsmodell vorbereiten | erforderlich | P0 |
| kompletter Rewrite | nein | — |

---

## 13. Fazit

Q7 ist kein Rebuild-Projekt, sondern ein Strukturierungs- und Reifungsprojekt.

Die wichtigsten nächsten Schritte sind:

1. Code und Dokumentation auf einen einheitlichen aktuellen Stand bringen
2. Chat- und Werkzeuglogik entkoppeln
3. Sicherheit und Tenant-Scope standardisieren
4. Datenmodell und Tests professionalisieren
5. keine komplette Neuentwicklung, sondern gezielte Stabilisierung

Wenn diese Punkte umgesetzt werden, bleibt die vorhandene Basis erhalten und das System wird langfristig belastbar, prüfbar und skalierbar.

---

## 14. Konkrete nächste Aufgaben

1. `README.md` und `STATUS.md` auf aktuellen Codebestand anpassen
2. `app/api/chat/route.ts` in kleinere Services aufteilen
3. `docs/` mit einem zentralen Überblicksindex ergänzen
4. `lib/ki-agent/werkzeuge.ts` nach Domänen aufspalten
5. Tenant-Scope und Authentifizierung als verbindliche Sicherheitsanforderung durchsetzen

Damit ist Q7 auf dem richtigen Weg: von einem funktionierenden Prototyp zu einer tragfähigen Systembasis.
