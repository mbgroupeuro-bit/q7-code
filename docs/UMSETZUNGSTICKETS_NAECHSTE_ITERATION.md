# Umsetzungstickets für die nächste produktive Iteration

**Projekt:** `q7-code`  
**Referenz:** `q7-doku`  
**Ziel:** Sicherheits- und Architekturkonformität herstellen, ohne weitere fachliche Funktionen auf ein unsicheres Fundament zu bauen.

## Ticketregeln

- Jedes Ticket besitzt eine Gap-ID und ein prüfbares Abnahmekriterium.
- P0-Tickets müssen vor einem öffentlichen oder mandantenfähigen Produktivbetrieb abgeschlossen sein.
- Änderungen an Datenmodell und Authentifizierung benötigen Migrationstests und Security-Tests.
- Kein Ticket gilt als erledigt, wenn nur die UI angepasst wurde; API- und Servergrenzen müssen ebenfalls geprüft sein.

## EPIC 0 — Baseline und SSOT

### Q7-001 — Technische Baseline erzeugen

- **Priorität:** P0
- **Bezug:** GAP-012, GAP-015
- **Betroffene Dateien:** `package.json`, `README.md`, `STATUS.md`, `.github/workflows/`
- **Aufgaben:**
  - `npm run typecheck`, `npm run lint` und `npm run build` ausführen.
  - Fehler, Warnungen und bekannte Einschränkungen versioniert dokumentieren.
  - Aktuelle UI-, API- und Prisma-Routen inventarisieren.
  - README auf den tatsächlichen Stand mit Backend und Prisma aktualisieren.
- **Akzeptanzkriterien:**
  - Baseline-Bericht ist im Repository vorhanden.
  - Alle drei Prüfungen sind reproduzierbar dokumentiert.
  - README behauptet nicht mehr, dass kein Backend existiert.

### Q7-002 — Aktive SSOT-Dokumente markieren

- **Priorität:** P1
- **Bezug:** GAP-011, GAP-015
- **Betroffene Dateien:** `docs/`, Prozessregister, `q7-doku/04_Doku/00_Q7_Systemindex.md`
- **Aufgaben:**
  - Aktive Dokumente und Archivdokumente unterscheiden.
  - Agenten-, Prozess-, Sicherheits- und UI-SSOT benennen.
  - Versionsstand des Codes gegen die Doku dokumentieren.
- **Akzeptanzkriterien:** Jeder Entwickler kann für Agentenrolle, Tenant, Sicherheit, UI und Datenarchitektur genau eine aktive Quelle nennen.

## EPIC 1 — Authentifizierung und Berechtigungen

### Q7-010 — User-, Session- und Membership-Modell einführen

- **Priorität:** P0
- **Bezug:** GAP-001, GAP-002
- **Betroffene Dateien:** `prisma/schema.prisma`, `lib/auth.ts`, `lib/auth-server.ts`, `proxy.ts`
- **Aufgaben:**
  - `User`, `Tenant`, `TenantMembership`, `DataSpace` und Session-Modell ergänzen.
  - Passwort-Hashing und Session-Cookies serverseitig implementieren.
  - Bestehende Basic-Auth nur als expliziten Übergang markieren.
- **Akzeptanzkriterien:** Login, Logout, Sessionablauf und ungültige Session funktionieren; kein Request wird standardmäßig als `admin` behandelt.

### Q7-011 — Serverseitige Permission Guards implementieren

- **Priorität:** P0
- **Bezug:** GAP-002, GAP-007
- **Betroffene Dateien:** `lib/auth-server.ts`, `lib/rollen.ts`, neue `lib/auth/guards.ts`, alle `app/api/**/route.ts`
- **Aufgaben:**
  - `requireUser()`, `requireRole()` und `requireTenantAccess()` implementieren.
  - Rollenprüfung aus Client-Hook und frei gesetzten Headern entfernen.
  - Alle API-Handler auf Guards umstellen.
- **Akzeptanzkriterien:** Direkter API-Aufruf ohne Session liefert `401`; unberechtigte Rolle liefert `403`; Header-Manipulation ändert keine Identität.

### Q7-012 — Rollenabhängige UI- und Response-DTOs

- **Priorität:** P0
- **Bezug:** GAP-007
- **Betroffene Dateien:** `components/Sidebar.tsx`, `app/agenten/page.tsx`, `app/protokoll/page.tsx`, neue `app/admin/**`
- **Aufgaben:**
  - Admin-Routen unter `/admin/*` bündeln oder streng schützen.
  - Interne Agentencodes und vollständige Protokolldetails aus Lizenznehmer-Responses entfernen.
  - Neutrale Rollenbezeichnungen für die Lizenznehmer-UI verwenden.
- **Akzeptanzkriterien:** Lizenznehmer kann `/admin/agenten` und interne APIs auch bei direkter URL nicht öffnen; Kunden-UI zeigt keine Agentencodes.

## EPIC 2 — Tenant- und Datenarchitektur

### Q7-020 — Tenant-Scope in Prisma ergänzen

- **Priorität:** P0
- **Bezug:** GAP-001
- **Betroffene Dateien:** `prisma/schema.prisma`, neue Migration, alle Datenzugriffsadapter unter `lib/`
- **Aufgaben:**
  - Tenant-/Datenraum-FKs für `Bereich`, `PosteingangEintrag`, `MeineAufgabe`, `Notiz`, `Termin`, `AgentChat`, `Projekt`, Wissen, Ablage, Output und Audit ergänzen.
  - Migration mit bestehender Datenzuordnung planen.
  - Default-Scope im Service-Layer erzwingen.
- **Akzeptanzkriterien:** Kein produktives Modell ohne Ownership; fehlender Tenant-Scope führt zu einer sicheren Fehlermeldung statt zu einer globalen Abfrage.

### Q7-021 — PostgreSQL-Stagingmigration

- **Priorität:** P0
- **Bezug:** GAP-003, GAP-014
- **Betroffene Dateien:** `prisma/schema.prisma`, `prisma/migrations/`, `README.md`, Deploymentdokumentation
- **Aufgaben:**
  - PostgreSQL als Produktionsprovider konfigurieren.
  - Alle Migrationen in einer Kopie der Datenbank testen.
  - SQLite als lokale Demo dokumentieren oder über getrennte Konfiguration isolieren.
- **Akzeptanzkriterien:** `prisma migrate deploy` läuft in Staging ohne Datenverlust; Rollback-/Restore-Verfahren ist dokumentiert.

### Q7-022 — Store-Ports und Datenbereichsgrenzen

- **Priorität:** P0
- **Bezug:** GAP-003, GAP-004
- **Betroffene Dateien:** `lib/prisma.ts`, `lib/ablage.ts`, Adapter in `lib/chat/`, `lib/posteingang/`, `lib/ki-agent/`
- **Aufgaben:**
  - Relationalen Store, Object Storage, Retrieval Store und Audit Store über Interfaces kapseln.
  - Agenten-Service erhält keinen direkten Zugriff auf geschützte Lizenznehmerdaten.
  - Kontextübergabe erfolgt nur über geprüfte Service-Methoden.
- **Akzeptanzkriterien:** Agentenmodule können keine direkte Datenbankverbindung zum geschützten Geschäftsdatenscope importieren.

## EPIC 3 — Policy, Tools und sichere KI-Verarbeitung

### Q7-030 — Policy Engine mit Fail-Closed-Verhalten

- **Priorität:** P0
- **Bezug:** GAP-004, GAP-006
- **Betroffene Dateien:** neue `lib/policy/engine.ts`, `lib/ki-agent/rollen-check.ts`, API-Routen
- **Aufgaben:**
  - Policy-Entscheidungen `ALLOW`, `DENY`, `REVIEW` definieren.
  - Ausfall oder Timeout der Policy Engine als `DENY` behandeln.
  - Enforcement Points für Tool-Aufruf, Retrieval und Export dokumentieren.
- **Akzeptanzkriterien:** Jeder Policy-Ausfall blockiert die Aktion; Entscheidungen werden mit Actor, Tenant, Ressource und Grund protokolliert.

### Q7-031 — Zentrales Tool Gateway

- **Priorität:** P0
- **Bezug:** GAP-004
- **Betroffene Dateien:** `lib/ki-agent/werkzeuge.ts`, `lib/ki-agent/werkzeuge-interface.ts`, neue `lib/tools/gateway.ts`
- **Aufgaben:**
  - Tool-Allowlist und typisierte Tool-Anfragen definieren.
  - Direkte Tool-Aufrufe aus Agenten- und API-Code entfernen.
  - Policy-Check, Sandbox-Adapter und Audit-Aufzeichnung erzwingen.
- **Akzeptanzkriterien:** Jeder Tool-Aufruf erzeugt einen Gateway-Evidence-Record; ein direkter Aufruf ohne Gateway schlägt im Test fehl.

### Q7-032 — Context Package und Prompt-Injection-Schutz

- **Priorität:** P0
- **Bezug:** GAP-005
- **Betroffene Dateien:** `app/api/chat/route.ts`, `app/api/posteingang/**`, `app/api/chat/upload/**`, neue `lib/ai/context-package.ts`
- **Aufgaben:**
  - `system`, `instruction` und `data` getrennt modellieren.
  - Fremdinhalte sanitizen und klassifizieren.
  - Verdächtige Inhalte in `QUARANTAENE/01_Verdacht`, bestätigte Fälle in `QUARANTAENE/02_Bestaetigt` speichern.
- **Akzeptanzkriterien:** Eingebettete Anweisungen in E-Mail, Datei oder Chatdaten ändern nicht die Systemregeln; Verdachtsfälle sind auditierbar.

### Q7-033 — Secret Redaction und Secret-Manager-Schnittstelle

- **Priorität:** P0
- **Bezug:** GAP-006
- **Betroffene Dateien:** `.env.example`, `app/api/**`, neue `lib/security/secrets.ts`, Loggingpfade
- **Aufgaben:**
  - Secrets nur serverseitig beziehen.
  - Redaction für Logs, Fehler und Evidence Records einführen.
  - Rotation und Zugriff auf Secrets dokumentieren.
- **Akzeptanzkriterien:** Tests finden keinen API-Key, Token oder Passwortwert in Response, Log oder Prompt.

### Q7-034 — DLP-Gate vor Connector-Outputs

- **Priorität:** P0
- **Bezug:** GAP-006, GAP-014
- **Betroffene Dateien:** Gmail-/Connector-Skripte, neue `lib/connectors/`, neue `lib/dlp/`
- **Aufgaben:**
  - Datenklassifikation definieren.
  - Connector-Policy je Tenant und Kanal auswerten.
  - Versand nur nach `ALLOW`; `Niemals Extern` immer blockieren.
- **Akzeptanzkriterien:** Ein verbotener Export wird nicht gesendet und erzeugt einen nachvollziehbaren Audit-Eintrag.

## EPIC 4 — Agenten, Wissen und Prozesse

### Q7-040 — A01-Routing implementieren

- **Priorität:** P1
- **Bezug:** GAP-009
- **Betroffene Dateien:** `lib/ki-agent/orchestrierung.ts`, `lib/ki-agent/types.ts`, `01_Agentenstruktur/A01_.../A01_Routing-Entscheidung_v1.1.md`
- **Aufgaben:**
  - Routing-Matrix als versioniertes Regelmodul abbilden.
  - Manuelle Auswahl als expliziten Admin-Override behandeln.
  - Konfidenz, Fallback und Eskalation speichern.
- **Akzeptanzkriterien:** Jede neue Anfrage erhält genau einen Routing-Entscheid oder eine dokumentierte Eskalation.

### Q7-041 — Agenten-/Prompt-Doku validieren

- **Priorität:** P1
- **Bezug:** GAP-011
- **Betroffene Dateien:** `scripts/`, `lib/ki-agent/`, `01_Agentenstruktur/`
- **Aufgaben:**
  - Pflichtdateien für jeden Agenten prüfen.
  - Agentencodes und Rollen mit `lib/types.ts`/Datenbank abgleichen.
  - Promptversion im Agentenlauf speichern.
- **Akzeptanzkriterien:** CI schlägt bei fehlender Pflichtdatei, unbekanntem Agentencode oder Versionskonflikt fehl.

### Q7-042 — Wissensartefakte und Retrieval-Scope

- **Priorität:** P1
- **Bezug:** GAP-010
- **Betroffene Dateien:** `lib/wissen.ts`, `app/api/wissen/route.ts`, Prisma-Schema, `03_Wissen/`
- **Aufgaben:**
  - Artefaktstatus, Version, Datenklasse, Tenant und Datenraum speichern.
  - Metadatenfilter vor Volltext-/Vektorsuche erzwingen.
  - Retrieval-Evidence pro KI-Antwort speichern.
- **Akzeptanzkriterien:** Ein Retrieval kann nie Artefakte eines anderen Tenants zurückgeben; jede Antwort nennt intern die verwendeten Artefaktversionen.

## EPIC 5 — UI, Tests und Betrieb

### Q7-050 — Sidebar an finale Spezifikation anpassen

- **Priorität:** P1
- **Bezug:** GAP-008
- **Betroffene Dateien:** `components/Sidebar.tsx`, UI-Dokumentation
- **Aufgaben:**
  - `/erp` entfernen.
  - Menübezeichnungen mit der finalen Sidebar-Doku abgleichen.
  - Routen-Smoke-Test ergänzen.
- **Akzeptanzkriterien:** Sidebar entspricht Position 1–10 der finalen Doku; ERP ist kein eigener Menüpunkt.

### Q7-051 — Einheitliche Fehler-, Lade- und Leerzustände

- **Priorität:** P1
- **Bezug:** GAP-015, GAP-016
- **Betroffene Dateien:** `app/**`, `components/**`, API-Clients
- **Aufgaben:**
  - Fehlerzustände nicht nur per `console.error` behandeln.
  - Gemeinsame UI-Komponenten und typisierte API-Fehler verwenden.
  - Retry für temporäre KI-/Connectorfehler anbieten.
- **Akzeptanzkriterien:** Jeder zentrale Workflow hat sichtbare Lade-, Leer- und Fehlerzustände.

### Q7-052 — Testframework und CI

- **Priorität:** P0
- **Bezug:** GAP-012
- **Betroffene Dateien:** `package.json`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/`
- **Aufgaben:**
  - Vitest für Unit-/Integrations-Tests einführen.
  - Playwright für Login, Tenant-Scope, Chat, Posteingang und Freigaben einführen.
  - CI für Lint, Typecheck, Test, Migration-Check und Build konfigurieren.
- **Akzeptanzkriterien:** Kein Merge in `master` ohne erfolgreiche CI; kritische Security- und Tenant-Tests laufen automatisch.

### Q7-053 — Traceability-Matrix technisch pflegen

- **Priorität:** P1
- **Bezug:** GAP-012
- **Betroffene Dateien:** `docs/TRACEABILITY.md`, Testdateien, `Q7_CODE_DOKU_ABGLEICH.md`
- **Aufgaben:**
  - Gap-ID, Doku-Abschnitt, Ticket, Codepfad, Test-ID und Status verknüpfen.
  - Kein Test ohne Traceability-Referenz zulassen.
  - Status `Offen`, `Umgesetzt`, `Getestet` pflegen.
- **Akzeptanzkriterien:** Jeder P0-Gap besitzt mindestens einen automatisierten Test und ein dokumentiertes Akzeptanzkriterium.

### Q7-054 — Backup, Restore und Healthchecks

- **Priorität:** P1
- **Bezug:** GAP-014
- **Betroffene Dateien:** `scripts/`, Deploymentdokumentation, Monitoringkonfiguration
- **Aufgaben:**
  - RPO/RTO festlegen.
  - PostgreSQL-Backup und Restore dokumentieren.
  - Restore-Test durchführen und Ergebnis protokollieren.
  - Healthchecks für DB, OpenRouter, Queue und Connectoren ergänzen.
- **Akzeptanzkriterien:** Ein dokumentierter Restore-Test stellt eine Testdatenbank erfolgreich wieder her.

### Q7-055 — Repository bereinigen und Architektur dokumentieren

- **Priorität:** P2
- **Bezug:** GAP-015, GAP-018
- **Betroffene Dateien:** Root-Diagnose-/Logdateien, `README.md`, neue `docs/ARCHITECTURE.md`
- **Aufgaben:**
  - Temporäre Diagnoseartefakte verschieben oder entfernen.
  - Architekturdiagramm und Datenfluss dokumentieren.
  - `lib/store.tsx`-Verantwortung reduzieren und Domänenservices benennen.
- **Akzeptanzkriterien:** Root enthält keine unklassifizierten Diagnose-/Logdateien; Architektur- und Betriebsdoku entsprechen dem Code.

## Empfohlene Reihenfolge der Umsetzung

```text
Q7-001  Baseline
Q7-010  User/Session/Membership
Q7-011  Server Guards
Q7-020  Tenant-Scope
Q7-021  PostgreSQL-Stagingmigration
Q7-030  Policy Engine
Q7-031  Tool Gateway
Q7-032  Context Package
Q7-033  Secret Redaction
Q7-034  DLP-Gate
Q7-012  Admin-/Lizenznehmer-UI
Q7-040  A01-Routing
Q7-041  Doku-/Prompt-Validierung
Q7-042  Wissensartefakte
Q7-050  Sidebar
Q7-052  Testframework/CI
Q7-053  Traceability
Q7-054  Backup/Restore
Q7-055  Bereinigung
```

## Release-Gate

Die nächste produktive Version darf erst freigegeben werden, wenn mindestens folgende Tickets abgeschlossen und in CI nachgewiesen sind:

- `Q7-010`, `Q7-011`, `Q7-020`, `Q7-021`
- `Q7-030`, `Q7-031`, `Q7-032`, `Q7-033`, `Q7-034`
- `Q7-012`, `Q7-052`

Zusätzlich müssen Migration, Restore-Test und Tenant-Isolation in einer Stagingumgebung erfolgreich geprüft worden sein.
