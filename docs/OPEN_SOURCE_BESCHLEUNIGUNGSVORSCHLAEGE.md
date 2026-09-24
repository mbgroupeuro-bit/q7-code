# Vorschläge zur Beschleunigung der Produktionsreife

**Projekt:** `mbgroupeuro-bit/q7-code`  
**Dokumentationsbasis:** `mbgroupeuro-bit/q7-doku`  
**Stand:** 21.09.2026

## Ziel

Der Weg zur produktionsreifen Q7-Anwendung soll verkürzt werden, indem Standardprobleme nicht selbst entwickelt, sondern durch bewährte Open-Source-Komponenten gelöst werden.

Die Grundidee lautet:

> Standardprobleme übernehmen – Q7-Fachlogik selbst entwickeln.

Nicht die gesamte Anwendung sollte durch ein fremdes Framework ersetzt werden. Sinnvoller ist eine gezielte Integration einzelner Bausteine für Authentifizierung, Rechte, Datenbank, Hintergrundjobs, Dateien, Tests und Monitoring.

## Aktueller Ausgangspunkt

Q7 verfügt bereits über eine gute Grundlage:

- Next.js 16 mit App Router
- React und TypeScript
- Tailwind CSS
- Prisma
- Zod
- OpenRouter-Anbindung
- API-Routen für Chat, Posteingang, Aufgaben, Kalender, Projekte und Agenten
- erste Agenten- und Workflow-Module
- ausführliche Architektur- und Sicherheitsdokumentation in `q7-doku`

Die größten noch offenen Bereiche sind:

- echte Benutzer-Authentifizierung
- Tenant-/Datenraum-Isolation
- serverseitige Rollen- und Rechteprüfung
- PostgreSQL als Produktionsdatenbank
- Policy Engine und Tool Gateway
- DLP und Secret Management
- Tests und CI
- Jobs, Monitoring, Backups und Restore

## Empfohlener Ziel-Stack

```text
Frontend:
  Next.js 16
  React 19
  TypeScript
  Tailwind CSS
  shadcn/ui optional

Authentifizierung:
  Better Auth oder Auth.js

Berechtigungen:
  zunächst Casbin
  später eventuell OpenFGA

Datenbank:
  PostgreSQL
  Prisma

Validierung:
  Zod

KI:
  bestehende OpenRouter-Anbindung
  zentraler eigener KI-Service

Hintergrundjobs:
  Trigger.dev oder Inngest

Dateien:
  S3-kompatibler Storage
  MinIO lokal

Retrieval:
  PostgreSQL + pgvector

Tests:
  Vitest
  Playwright
  Testcontainers

Monitoring:
  Sentry
  strukturierte Logs
  OpenTelemetry als nächste Ausbaustufe

Deployment:
  Docker Compose zunächst
  VPS/Hetzner
  Nginx
  PostgreSQL
  S3-kompatibler Object Storage
```

## 1. Authentifizierung

### Problem

Der aktuelle `proxy.ts` verwendet Basic Auth als Übergangsschutz. Erfolgreiche Requests werden derzeit als `admin` behandelt. Das reicht nicht für mehrere Benutzer, Rollen und Lizenznehmer.

### Vorschlag

Eine fertige Authentifizierungslösung integrieren:

- **Better Auth** – moderne TypeScript-Lösung mit guter Kontrolle über Sessions und Datenbank.
- **Auth.js** – etablierte Next.js-Lösung mit vielen Login-Providern.
- **Keycloak** – sinnvoll bei späterem Enterprise-SSO, mehreren Organisationen und komplexen Identitätsanforderungen.

### Empfehlung für Q7

Für den nächsten Schritt:

> **Better Auth oder Auth.js mit Prisma und PostgreSQL**

Keycloak sollte erst geprüft werden, wenn SSO, externe Identitätsanbieter oder Enterprise-Anforderungen tatsächlich benötigt werden.

### Ziel

- eigene Benutzerkonten
- sichere Session-Cookies
- Login und Logout
- Passwort-Hashing
- Session-Ablauf
- Rollen aus Session und Datenbank
- Tenant-Zuordnung
- serverseitige Berechtigungsprüfung

Basic Auth kann während der Migration als zusätzlicher VPS-Schutz bestehen bleiben, darf aber nicht die eigentliche Benutzeridentität ersetzen.

## 2. Rollen und Berechtigungen

### Problem

Q7 benötigt mehr als eine einfache Admin-/Nicht-Admin-Prüfung:

```text
Admin
Tenant-Admin
Lizenznehmer
Tenant
Sub-Tenant
Datenraum
Projekt
Agent
Prozess
```

### Vorschläge

- **Casbin** – geeignet für den ersten Ausbau eines rollenbasierten Policy-Systems.
- **OpenFGA** – geeignet für komplexe Beziehungen und Objektberechtigungen.
- **Oso** – ebenfalls möglich, sollte aber nur nach einem kleinen technischen Vergleich ausgewählt werden.

### Empfehlung

- Kurzfristig: **Casbin oder eine eigene kleine Policy-Schicht mit klaren Tests**
- Langfristig bei stark wachsendem Berechtigungsmodell: **OpenFGA** prüfen

Eine Berechtigungsbibliothek ersetzt nicht das Tenant-Datenmodell. Jede Ressource benötigt weiterhin Ownership- und Scope-Informationen.

## 3. PostgreSQL statt SQLite für Produktion

### Problem

Das aktuelle Prisma-Schema verwendet SQLite. Die Q7-Zieldokumentation beschreibt PostgreSQL als relationalen Produktions-Store.

### Vorschlag

```text
Prisma
  +
PostgreSQL
  +
Tenant-Scope in Services
  +
Staging-Datenbank
```

### Vorteile

- bessere Eignung für parallele Zugriffe
- stabilere Produktionsbasis
- bessere Backup- und Restore-Möglichkeiten
- spätere Nutzung von `pgvector`
- bessere Grundlage für mehrere Benutzer und Tenants

### Umsetzung

1. PostgreSQL lokal über Docker Compose bereitstellen.
2. Staging-Datenbank anlegen.
3. Prisma-Schema und Migrationen gegen PostgreSQL testen.
4. Bestehende Daten kontrolliert migrieren.
5. SQLite nur noch für lokale Demo oder ausdrücklich dokumentierte Entwicklung verwenden.

## 4. Admin-Oberfläche

### Problem

Für Benutzer-, Tenant-, Agenten-, Freigabe- und Policy-Verwaltung wird langfristig eine eigene Verwaltungsoberfläche benötigt.

### Vorschläge

- **Refine** – flexibles React-Framework für Admin-Oberflächen.
- **React Admin** – stark für klassische CRUD-Verwaltung.
- **shadcn/ui** – keine fertige Admin-Lösung, aber gute Grundlage für eine eigene Q7-Admin-Oberfläche.

### Empfehlung

Das bestehende Q7-Frontend sollte nicht vollständig ersetzt werden. Die bestehende Fach-UI bleibt erhalten. Ein Framework kann gezielt für interne Bereiche genutzt werden:

```text
/admin/tenants
/admin/users
/admin/agenten
/admin/policies
/admin/connectoren
/admin/freigaben
```

Wichtig ist eine serverseitige Zugriffssperre. Nur das Ausblenden eines Menüpunktes reicht nicht aus.

## 5. Hintergrundjobs und Routinen

### Problem

Q7 benötigt zukünftig:

- Agenten-Routinen
- nächtliche Projekt-Memory-Verdichtung
- Gmail-Polling
- Retry bei KI-Fehlern
- Cooling-off-Aktionen
- verzögerte Freigaben
- Connector-Aufgaben

### Vorschläge

- **Trigger.dev** – gute TypeScript-Basis für längere und KI-bezogene Workflows.
- **Inngest** – geeignet für ereignisbasierte Abläufe und Retries.
- **BullMQ + Redis** – klassische Queue-Lösung mit mehr Eigenbetrieb.
- **Temporal** – sehr mächtig, aber für den aktuellen Q7-Stand wahrscheinlich zu komplex.

### Empfehlung

Zuerst Trigger.dev und Inngest anhand eines kleinen Pilotjobs vergleichen. Als Pilot eignet sich:

```text
Projekt-Memory-Verdichtung
  -> Auftrag starten
  -> KI-Aufruf
  -> Fehler-Retry
  -> Ergebnis speichern
  -> Status protokollieren
```

## 6. Validierung mit Zod

Zod ist bereits im Projekt vorhanden und sollte konsequent eingesetzt werden. Ein neues Framework ist dafür nicht notwendig.

Zu validieren sind mindestens:

- Login-Daten
- Chat-Nachrichten
- Datei-Uploads
- Aufgaben
- Projekte
- Agentenaktionen
- Studio-Formulare
- Connector-Aufträge
- Query- und Path-Parameter

Beispiel:

```ts
import { z } from "zod";

export const chatRequestSchema = z.object({
  chatId: z.string().optional(),
  message: z.string().trim().min(1).max(20_000),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
});
```

Jede API-Route sollte denselben Ablauf verwenden:

```text
Request
  -> Zod-Validierung
  -> Session-Prüfung
  -> Tenant-/Datenraum-Scope
  -> Policy-Prüfung
  -> Service-Aufruf
  -> Audit-Eintrag
  -> typisierte Antwort
```

## 7. Observability

### Problem

Für den Produktionsbetrieb müssen Fehler, Laufzeiten, KI-Kosten, Retries und Connector-Probleme sichtbar sein.

### Vorschläge

- **Sentry** für Fehler und Performance.
- **OpenTelemetry** für standardisierte Traces.
- **Grafana, Loki und Prometheus** für eine stärker selbst betriebene Monitoring-Lösung.

### Empfehlung

Als erste Stufe:

```text
Sentry
  +
strukturierte Logs
  +
Correlation-ID
  +
Token-/Kostenprotokollierung
```

Später kann OpenTelemetry für komplette Agenten- und Workflow-Traces ergänzt werden.

Jeder wichtige Vorgang sollte eine Correlation-ID besitzen:

```text
Benutzeranfrage
  -> Routing
  -> Prompt
  -> Retrieval
  -> Modellaufruf
  -> Tool-Aufruf
  -> Output
```

## 8. Dateien und Uploads

### Problem

Dateien sollten nicht dauerhaft unkontrolliert auf dem App-Server oder nur über Metadaten in der Datenbank verwaltet werden.

### Vorschläge

- **MinIO** lokal und selbst betrieben.
- **Hetzner Object Storage** für VPS-nahe Produktion.
- **Cloudflare R2** für kostengünstigen S3-kompatiblen Speicher.
- **AWS S3** als etablierter Standard.

### Empfehlung

```text
Lokal:       MinIO via Docker
Produktion:  S3-kompatibler Object Storage
Datenbank:   nur Metadaten und Object-Key
```

Die Datenbank sollte speichern:

```text
Datei-ID
Tenant-ID
Datenraum-ID
Object-Key
Dateityp
Hash
Größe
Status
Freigabestatus
```

## 9. Wissensbasis und Retrieval

### Problem

Q7-doku enthält bereits Frameworks, Expertenwissen, Vorlagen, Prozesse und Marketingartefakte. Für produktives Retrieval braucht jedes Artefakt jedoch Scope, Version, Status und Datenklasse.

### Vorschläge

- **PostgreSQL + pgvector** – erste und wahrscheinlich einfachste Lösung.
- **Qdrant** – spätere Option für eine spezialisierte Vector-Datenbank.
- **Weaviate** oder **Milvus** – erst bei deutlich größeren Retrieval-Anforderungen prüfen.

### Empfehlung

Zuerst:

> **PostgreSQL + pgvector**

Vorteile:

- weniger Infrastruktur
- relationale Metadaten und Vektoren in einer Umgebung
- einfache Tenant- und Datenraumfilter
- gute Grundlage für Prototyp und Pilot

Wichtig:

```text
Tenant-/Datenraumfilter
  -> Datenklassenfilter
  -> Volltext-/Vektorsuche
  -> Retrieval-Evidence
```

Der Scope-Filter darf nicht erst nach der Suche angewendet werden.

## 10. Tests

### Vorschlag

- **Vitest** für Unit- und Integrationstests.
- **Playwright** für Browser- und End-to-End-Tests.
- **Testcontainers** für realistische PostgreSQL-Tests.

Empfohlene Struktur:

```text
tests/
  unit/
    auth/
    policies/
    routing/
  integration/
    api/
    database/
    tenant-scope/
  e2e/
    login.spec.ts
    chat.spec.ts
    posteingang.spec.ts
    permissions.spec.ts
```

Pflichtfälle:

- Login und Logout
- Sessionablauf
- Rollenprüfung
- Cross-Tenant-Zugriff
- Chat
- Posteingang
- Aufgaben
- Freigaben
- Prompt Injection
- DLP
- Tool Gateway
- Policy-Ausfall

## 11. Was nicht selbst entwickelt werden sollte

Diese Standardprobleme sollten nicht von Grund auf neu gebaut werden:

- Passwort-Hashing
- Session-Management
- OAuth und SSO
- Rollen-/Policy-Grundmechanismen
- Job-Queues
- Retry-Infrastruktur
- Fehlertracking
- Object Storage
- Vector Search
- Browser-Testframework
- Monitoring und Tracing

## 12. Was Q7 selbst entwickeln muss

Die Q7-spezifische Fachlogik bleibt eigene Entwicklung:

- A01-Agentenrouting
- A00-Aufsichtslogik
- Q7-Policy-Regeln
- Tenant- und Datenraummodell
- Q7-Wissensartefakte
- Workflow-Zustände
- Freigaben und Cooling-off
- Agentenprompts
- DLP-Datenklassen
- Connector-Fachlogik
- Q7-UI
- Geschäftsprozesse

Ein Framework kann die technische Infrastruktur beschleunigen, aber nicht die verbindlichen Q7-Regeln aus `q7-doku` ersetzen.

## 13. Empfohlene Integrationsreihenfolge

### Phase 1: Fundament

```text
1. PostgreSQL
2. Authentifizierung
3. Tenant-/Datenmodell
4. Vitest und Playwright
```

### Phase 2: Zugriffsschutz

```text
1. Server Guards
2. Rollenmodell
3. Tenant-Scope
4. Zod für alle APIs
```

### Phase 3: Sichere KI-Verarbeitung

```text
1. Policy Engine
2. Tool Gateway
3. Context Package
4. Prompt-Injection-Schutz
5. DLP
6. Secret Redaction
```

### Phase 4: Betrieb

```text
1. Hintergrundjobs
2. S3-/MinIO-Speicher
3. Sentry
4. Backups
5. Restore-Tests
```

### Phase 5: Fachliche Erweiterung

```text
1. pgvector
2. A01-Routing
3. Q7-Wissensartefakte
4. Connector-Lifecycle
5. vollständige Traceability
```

## 14. Realistische Zeitersparnis

Durch die Nutzung fertiger, bewährter Open-Source-Komponenten kann voraussichtlich viel Eigenentwicklung eingespart werden:

| Bereich | Mögliche Ersparnis |
|---|---|
| Authentifizierung | mehrere Tage bis Wochen |
| Rollen-/Rechtesystem | mehrere Tage |
| Hintergrundjobs und Retries | mehrere Tage bis Wochen |
| Monitoring | mehrere Tage |
| Upload-/Object-Storage | mehrere Tage |
| Tests und Browserautomation | mehrere Tage |

Eine realistische Einschätzung ist:

> Der Weg zu einem kontrollierten Pilotbetrieb kann sich bei stabilen Anforderungen auf etwa 4–8 Wochen konzentrierte Integrationsarbeit verkürzen.

Das ist keine Garantie. Die Zeit hängt stark davon ab, wie viele Q7-Fachprozesse, Connectoren und Tenant-Regeln gleichzeitig produktiv umgesetzt werden sollen.

## 15. Konkreter erster Spike

Nicht alle Frameworks gleichzeitig einführen. Der erste technische Spike sollte nur diese vier Themen enthalten:

```text
1. PostgreSQL mit Prisma
2. Authentifizierung
3. Tenant-Scope
4. Vitest-/Playwright-Basis
```

### Spike-Abnahmekriterien

- Ein Testbenutzer kann sich anmelden.
- Ein Testbenutzer gehört genau einem Tenant an.
- Ein geschützter Datensatz wird korrekt geladen.
- Ein Cross-Tenant-Zugriff wird mit `403` blockiert.
- Ein Chat- oder Posteingangstest läuft gegen PostgreSQL.
- CI führt Typecheck, Lint, Tests und Build aus.

Erst wenn dieser Spike stabil funktioniert, sollten Policy Engine, Tool Gateway, Jobs, DLP und Retrieval nacheinander integriert werden.

## 16. Zielbild

```text
Next.js
  -> Session/Auth
  -> Server Guards
  -> Tenant-/Datenraum-Scope
  -> Zod-Validierung
  -> Policy Engine
  -> Q7-Service
  -> PostgreSQL / Object Storage / pgvector / Audit Store
  -> OpenRouter über zentralen KI-Service
```

## Schlussfolgerung

Der schnellste Weg zur Produktionsreife besteht nicht darin, möglichst viele GitHub-Repositories einzubauen. Der größte Zeitgewinn entsteht durch eine klare technische Trennung:

- Standardprobleme werden durch geprüfte Open-Source-Komponenten gelöst.
- Q7-Fachlogik bleibt kontrolliert in diesem Projekt.
- Sicherheits- und Tenant-Grenzen werden nicht an ein UI-Framework delegiert.
- Jede integrierte Komponente bekommt Tests, Scope-Prüfung und eine dokumentierte Abnahmeregel.

Die wichtigste erste Entscheidung lautet deshalb:

> PostgreSQL, Authentifizierung, Tenant-Scope und Testbasis zuerst stabilisieren; danach Policy, Tool Gateway, DLP und Retrieval integrieren.
