# Technische Gap-Liste für Entwickler

**Projekt:** `mbgroupeuro-bit/q7-code`  
**Referenz:** `mbgroupeuro-bit/q7-doku`  
**Stand:** 21.09.2026

## Priorität und Definition

- **P0:** Sicherheits- oder Architekturblocker; vor produktivem Einsatz zwingend.
- **P1:** Für die nächste produktive Iteration erforderlich.
- **P2:** Wartbarkeit, Konsistenz und technische Schulden.

## P0 — Sicherheits- und Architekturblocker

### GAP-001 — Keine echte Tenant-Isolation

**Referenz:** `Q7_Tenant_Modell_v1_2.md`, `Q7_Datenbank_Architektur_v1_2.md`

**Befund:**

- `prisma/schema.prisma` besitzt kein `Tenant`-/`Lizenznehmer`-Modell.
- Die relevanten Geschäftsmodelle besitzen keine `tenant_id`.
- `Projekt` und weitere Modelle sind nur über `mitarbeiter_id` beziehungsweise lose IDs verbunden.
- Es existiert kein zentraler, verpflichtender Tenant-Scope für Datenbankabfragen.

**Risiko:** Daten können nicht zuverlässig voneinander isoliert werden.

**Erforderliche Umsetzung:**

- `Tenant`, `TenantMembership`, `User` und `DataSpace` modellieren.
- Tenant-/Datenraum-Fremdschlüssel in alle relevanten Ressourcen aufnehmen.
- Datenzugriff ausschließlich über tenant-scoped Services erlauben.
- Cross-Tenant-Tests hinzufügen.

**Abnahmekriterium:** Ein Nutzer aus Tenant A kann weder UI- noch API-Daten von Tenant B lesen oder verändern.

### GAP-002 — Basic Auth ersetzt keine Benutzer- und Sessionverwaltung

**Referenz:** `Q7_Sicherheitsmodell_v1_6.md`, `Q7_UI_Spezifikation_v1_2.md`

**Befund:**

- `proxy.ts` verwendet ein gemeinsames Basic-Auth-Konto.
- Jeder erfolgreiche Request wird als `admin` behandelt.
- Eine feste `ADMIN_MITARBEITER_ID` ist im Code hinterlegt.
- `lib/auth.ts` liefert clientseitig weiterhin immer die Rolle `admin`.

**Risiko:** Keine individuelle Identität, keine belastbare Rollen- oder Tenant-Prüfung.

**Erforderliche Umsetzung:**

- Session-basierte Authentifizierung einführen.
- `getCurrentUser()` nur serverseitig implementieren.
- Rollen und Tenant-Mitgliedschaften aus der Session/Datenbank laden.
- Basic Auth nur als temporären Deployment-Schutz behalten oder entfernen.
- Client darf keine Identitätsheader setzen können.

**Abnahmekriterium:** Ungültige oder fehlende Sessions werden mit `401` abgewiesen; Rollenänderungen greifen ohne Codeänderung.

### GAP-003 — Datenbankarchitektur weicht von der Zieldokumentation ab

**Referenz:** `Q7_Technisches_Architekturhandbuch_v1_2.md`

**Befund:**

- `prisma/schema.prisma` verwendet SQLite.
- Die Zieldokumentation beschreibt PostgreSQL für relationale Geschäftsdaten.
- Vector Store, Object Storage, Append-only Audit Store und Secret Manager sind nicht als produktive Adapter vollständig umgesetzt.

**Erforderliche Umsetzung:**

- PostgreSQL als Produktionsziel festlegen.
- Bestehende Migrationen in einer Staging-Datenbank testen.
- Storage-Abstraktionen definieren: Relational, Object, Retrieval, Audit, Secrets.
- SQLite ausdrücklich auf lokale Entwicklung/Demo begrenzen.

**Abnahmekriterium:** Produktionsumgebung läuft mit PostgreSQL; Migration und Rollback sind dokumentiert und getestet.

### GAP-004 — Policy Engine und Tool Gateway sind nicht als harte Enforcement-Grenze nachgewiesen

**Referenz:** `Q7_Sicherheitsmodell_v1_6.md`

**Befund:**

- Die Doku verlangt `Agent → Policy-Prüfung → Sandbox → Audit → Ergebnis`.
- Die Codebasis besitzt Agenten- und Werkzeugmodule, aber keinen nachgewiesenen einzigen Aufrufpfad für alle Tools.
- Ein zentraler Fail-Closed-Nachweis fehlt.

**Erforderliche Umsetzung:**

- `ToolGateway` als einzigen Einstiegspunkt für Tool-Aufrufe erstellen.
- Allowlist und Policy-Prüfung vor jeder Ausführung erzwingen.
- Sandbox-Adapter definieren.
- Jeden Aufruf mit Correlation-ID und Evidence Record protokollieren.
- Policy-Ausfall muss zu `DENY` führen.

**Abnahmekriterium:** Direkte Tool-Aufrufe außerhalb des Gateways sind technisch nicht möglich oder schlagen im Test fehl.

### GAP-005 — Fehlende standardisierte Prompt-/Datenebenen-Trennung

**Referenz:** `Q7_Sicherheitsmodell_v1_6.md`

**Befund:**

- Nutzer-, Dokument- und externe Inhalte gelangen über Chat/Posteingang/Upload in KI-Flows.
- Ein zentral typisiertes Kontextpaket mit getrennten Rollen `system`, `instruction` und `data` ist nicht nachgewiesen.

**Erforderliche Umsetzung:**

- `ContextPackage` definieren.
- Fremdinhalte vor Agentenverarbeitung klassifizieren und sanitizen.
- Verdächtige Inhalte in Quarantäne überführen.
- Prompt-Injection-Regressionstests ergänzen.

**Abnahmekriterium:** Als Daten klassifizierte Inhalte können keine System- oder Nutzerinstruktionen überschreiben.

### GAP-006 — DLP und Secret Management fehlen als verbindliche Pipeline

**Referenz:** `Q7_Sicherheitsmodell_v1_6.md`

**Befund:**

- Secret-Nutzung basiert auf Umgebungsvariablen; eine Secret-Manager-Anbindung ist nicht erkennbar.
- Ein zentrales DLP-Gate vor externen Connector-Ausgaben ist nicht nachgewiesen.

**Erforderliche Umsetzung:**

- Secrets serverseitig beziehen und in Logs/Fehlern redigieren.
- Datenklassifikation und `Niemals Extern` erzwingen.
- Connector-Versand nur nach DLP-Entscheidung erlauben.

**Abnahmekriterium:** Kein Secret erscheint in Prompts, Logs, Responses oder Wissensartefakten; verbotene Exporte werden blockiert.

## P1 — Nächste produktive Iteration

### GAP-007 — Admin- und Lizenznehmer-UI sind nicht vollständig getrennt

**Referenz:** `Q7_UI_Spezifikation_v1_2.md`

**Befund:**

- `app/agenten/page.tsx` ist als Route vorhanden.
- `lib/auth.ts` meldet clientseitig immer `admin`.
- Direkte URL- und API-Zugriffe müssen unabhängig von der Navigation geprüft werden.

**Umsetzung:**

- Admin-Routen unter `/admin/*` bündeln oder strikt serverseitig schützen.
- Kundenansichten dürfen keine Agentencodes, Prozess-IDs oder internen Protokolldetails ausgeben.
- Rollenabhängige Response-DTOs definieren.

### GAP-008 — Sidebar widerspricht der finalen Doku

**Referenz:** `Q7_Sidebar_Struktur_2026-08-05_v4.md`

**Befund:**

- `components/Sidebar.tsx` enthält weiterhin `/erp` mit „Neu“.
- Die finale Sidebar-Doku erklärt, dass ERP kein eigener Menüpunkt sein soll.

**Umsetzung:**

- ERP-Link entfernen.
- Bezeichnung `Arbeitsbereiche`/`Projekte` mit der Produktentscheidung abgleichen.
- Navigations-Smoke-Test ergänzen.

### GAP-009 — A01-Routing ist noch nicht vollständig produktiv

**Referenz:** `A01_Routing-Entscheidung_v1.1.md`, `L6_Q7_Agentenmodell_v1_8.md`

**Befund:**

- Die README beschreibt manuelle Agentenauswahl.
- Die verbindliche A01-Koordinationsfunktion ist nicht vollständig als Routing-Regelwerk nachgewiesen.

**Umsetzung:**

- Routing-Matrix als versioniertes Regelmodul implementieren.
- A01 als verantwortlichen Routing-Agenten modellieren.
- Fallback, Konfidenz und Eskalation protokollieren.

### GAP-010 — Wissen ist noch kein versioniertes, gescoptes Retrieval-System

**Referenz:** `Q7_Wissens_Artefaktmodell_v1_2.md`, `03_Wissen/README.md`

**Befund:**

- `03_Wissen` enthält Frameworks, Expertenwissen, Vorlagen und Marketingartefakte.
- Die Codebasis besitzt Wissensmodule, aber kein vollständig nachgewiesenes Artefaktmodell mit Version, Freigabe, Datenklasse und Scope.

**Umsetzung:**

- Wissensartefakte mit Metadaten, Versionen und Status modellieren.
- Tenant-/Datenraumfilter vor Volltext-/Vektorsuche erzwingen.
- Retrieval-Evidence pro KI-Antwort speichern.

### GAP-011 — Prozess-, Prompt- und Agentendoku ist nicht automatisch synchronisiert

**Befund:**

- `q7-doku` besitzt strukturierte Agentenordner mit `README`, `Skills`, `agentenbeschreibung`, `loop` und `regeln`.
- `q7-code` besitzt parallel Agentenkonstanten, Rollen und Promptlogik.
- Ein Build-/Validierungsschritt gegen die Doku-Struktur fehlt.

**Umsetzung:**

- Prozessregister als SSOT verwenden.
- Validierungsscript für Agentencodes, Pflichtdateien und Versionen einführen.
- Prompt-Version in jedem KI-Lauf speichern.

### GAP-012 — Test- und Traceability-Modell ist noch nicht technisch verankert

**Referenz:** `Q7_Test_und_Traceability_v1_2.md`

**Befund:**

- `package.json` enthält kein Test-Script.
- Eine CI-Testpipeline und eine Code/Test-Traceability-Matrix sind nicht erkennbar.

**Umsetzung:**

- Unit-/Integrationstests mit Vitest.
- Browser-/Workflowtests mit Playwright.
- Policy-, Prompt-Injection-, DLP- und Tenant-Tests.
- Jede Test-ID mit Gap-/Mangel-ID und Akzeptanzkriterium verknüpfen.

### GAP-013 — Observability und Evidence Records sind unvollständig

**Referenz:** `Q7_Technisches_Architekturhandbuch_v1_2.md`

**Umsetzung:**

- Einheitliche Correlation-ID einführen.
- Agentenlauf, Modell, Promptversion, Retrieval, Tools, Tokens, Kosten und Ergebnisstatus erfassen.
- Audit-Daten append-only behandeln.
- Keine sensiblen Inhalte oder Secrets protokollieren.

### GAP-014 — Backup, Restore und Betrieb sind nicht nachgewiesen

**Referenz:** `Q7_Technisches_Architekturhandbuch_v1_2.md`

**Umsetzung:**

- RPO/RTO pro Store festlegen.
- Backup- und Restore-Runbook erstellen.
- Regelmäßigen Restore-Test automatisieren oder protokollieren.
- Healthchecks für Datenbank, KI-Provider, Queue und Connectoren ergänzen.

## P2 — Wartbarkeit und technische Schulden

### GAP-015 — README beschreibt einen veralteten Systemstand

Die README behauptet weiterhin „kein Backend, keine Datenbank“, obwohl API-Routen, Prisma-Schema und Migrationen vorhanden sind. Die Start-, Architektur- und Deploymentdokumentation muss aktualisiert werden.

### GAP-016 — Domänenzustand und UI-State sind vermischt

`lib/store.tsx` verwaltet mehrere Domänen. Server-State, UI-State und Cache sollten getrennt werden. Fachlogik gehört in Services beziehungsweise Route Handler, nicht in einen globalen React-Context.

### GAP-017 — Freie Strings statt zentrale Statusmodelle

Statuswerte wie Aufgaben-, Eingangs- und Agentenstatus werden als freie Strings geführt. Zod-Schemas und Prisma-Enums oder zentrale Konstanten sollen Inkonsistenzen verhindern.

### GAP-018 — Historische Diagnose- und Logdateien im Repository

Root-Dateien wie `diagnose_*.txt`, `fix-*.txt` und ähnliche Artefakte sollten in ein definiertes Diagnoseverzeichnis verschoben, bereinigt oder aus Git entfernt werden, falls sie keine dauerhafte Dokumentationsfunktion haben.

## Empfohlene technische Reihenfolge

```text
GAP-001/002  Auth + Tenant-Scope
GAP-003      PostgreSQL + Store-Grenzen
GAP-004/005  Policy, Tool Gateway, Kontexttrennung
GAP-006/007  DLP, Secrets, Admin-/Lizenznehmer-Grenzen
GAP-008/009  Sidebar und A01-Routing
GAP-010/011  Wissen, Prozesse, Prompt-Synchronisierung
GAP-012/013  Tests, Traceability, Observability
GAP-014/018  Betrieb, Dokumentation und Aufräumen
```
