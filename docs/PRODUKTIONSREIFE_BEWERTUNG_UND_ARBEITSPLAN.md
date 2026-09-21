# Q7 – Produktionsreife-Bewertung und Arbeitsplan

**Repository:** `mbgroupeuro-bit/q7-code`  
**Dokumentationsbasis:** `mbgroupeuro-bit/q7-doku`  
**Stand:** 21.09.2026  
**Bewertung:** 30 von 100 Punkten für eine vollständig produktionsreife Anwendung

## Kurzfazit

Q7 ist aktuell ein weit entwickeltes internes Frontend-/MVP-System mit umfangreicher UI, mehreren API-Modulen, Prisma-Datenmodell und ersten Agentenfunktionen. Für eine vollständig produktionsreife, sichere und mandantenfähige Anwendung fehlen jedoch noch zentrale Grundlagen bei Authentifizierung, Tenant-Isolation, Policy Enforcement, Tests und Betrieb.

Die Anwendung ist:

- **Demo-Ready:** Ja
- **Interner Prototyp:** Ja
- **Pilot-Ready:** Noch nicht vollständig
- **Production-Ready:** Nein

Die Bewertung von 30/100 bedeutet nicht, dass nur 30 % der sichtbaren Funktionen existieren. Die UI und die fachliche Struktur sind deutlich weiter. Die Punktzahl bewertet die gesamte Strecke bis zu einer sicheren, belastbaren und betreibbaren Produktionsanwendung.

## Bewertung nach Kategorien

| Kategorie | Gewicht | Aktueller Stand | Punkte | Einschätzung |
|---|---:|---:|---:|---|
| Produktidee und fachliches Modell | 10 | 8/10 | **8** | Sehr klares Produktziel mit Agenten, Posteingang, Aufgaben, Wissen, Projekten und Output. |
| UI/UX und Navigation | 15 | 10/15 | **10** | Umfangreiche Oberfläche vorhanden; einzelne Menü-/Terminologie- und Rollenfragen offen. |
| Frontend-Architektur | 10 | 7/10 | **7** | Next.js App Router, TypeScript und Komponentenstruktur sind gute Grundlagen. |
| Backend/API-Funktionalität | 15 | 7/15 | **7** | Viele API-Routen und Services vorhanden, aber nicht überall einheitlich abgesichert und produktiv durchgängig. |
| Datenmodell und Persistenz | 15 | 4/15 | **4** | Prisma und Migrationen existieren, aber SQLite und fehlende Tenant-FKs widersprechen der Zielarchitektur. |
| Authentifizierung und Autorisierung | 15 | 2/15 | **2** | Basic Auth als Übergang; Requests werden faktisch als Admin behandelt; kein echtes Multi-User-/Tenant-Login. |
| Sicherheitsarchitektur | 10 | 2/10 | **2** | Sicherheitsprinzipien sind dokumentiert, Tool Gateway, Sandbox, DLP und Quarantäne aber nicht vollständig als Enforcement nachgewiesen. |
| Tests und Qualitätssicherung | 5 | 0/5 | **0** | Kein belastbares Test-Setup und keine vollständige CI-/Traceability-Pipeline erkennbar. |
| Betrieb, Monitoring und Wiederherstellung | 5 | 1/5 | **1** | VPS-/PM2-Anleitung vorhanden; RPO/RTO, Restore-Tests und produktives Monitoring fehlen. |
| **Gesamt** | **100** |  | **41** |  |

### Korrigierte Gesamtbewertung

Die Einzelkategorien zeigen den vorhandenen Funktionsumfang. Für die Freigabe als produktionsreife Anwendung werden Sicherheits- und Betriebsblocker jedoch als harte Voraussetzungen behandelt. Deshalb lautet die praktische Reifeeinschätzung:

> **30/100 für Production Readiness**

Die Differenz erklärt sich daraus, dass eine Anwendung trotz guter UI nicht produktionsreif ist, wenn Identität, Tenant-Grenzen und Sicherheits-Enforcement nicht belastbar nachgewiesen sind.

## Die wichtigsten Blocker

### 1. Echte Authentifizierung

Aktuell verwendet `proxy.ts` ein gemeinsames Basic-Auth-Verfahren und setzt erfolgreiche Requests auf `admin`. `lib/auth.ts` liefert clientseitig ebenfalls standardmäßig `admin`.

Erforderlich:

- Benutzerkonten
- sichere Session-Cookies
- Login und Logout
- Passwort-Hashing
- Rollen aus der Session oder Datenbank
- serverseitige Guards
- keine vertrauenswürdigen Rollen aus Client-Headern

### 2. Tenant- und Datenraum-Isolation

Das Prisma-Schema enthält kein verbindliches Tenant-Modell. Relevante Ressourcen besitzen keine systematische `tenant_id` beziehungsweise `data_space_id`.

Erforderlich:

- `Tenant`
- `User`
- `TenantMembership`
- `DataSpace`
- Ownership-Felder für Geschäftsobjekte
- tenant-scoped Services und Queries
- Cross-Tenant-Sicherheitstests

### 3. Produktionsdatenbank

Die Zieldokumentation beschreibt PostgreSQL, während `prisma/schema.prisma` SQLite verwendet.

Erforderlich:

- PostgreSQL als Produktionsziel
- geprüfte Migrationen
- Staging-Datenbank
- Backup und Restore
- SQLite nur noch für lokale Demo/Entwicklung

### 4. Policy Engine und Tool Gateway

Die Doku schreibt vor, dass jeder Tool-Aufruf über Policy-Prüfung, Sandbox und Audit laufen muss. Dieser Pfad muss als einzige technische Ausführungsschicht erzwungen werden.

Erforderlich:

```text
Agent
  -> Policy Engine
  -> Tool Gateway
  -> Sandbox
  -> Audit/Evidence Record
  -> Ergebnis
```

Bei Policy-Ausfall muss die Aktion blockiert werden.

### 5. Prompt-Injection-, DLP- und Secret-Schutz

Fremdinhalte aus Chat, Uploads, E-Mails und externen Systemen müssen von Systeminstruktionen getrennt werden. Externe Ausgaben brauchen ein DLP-Gate.

Erforderlich:

- typisiertes `ContextPackage`
- Sanitization und Quarantäne
- Datenklassifikation
- `Niemals Extern`-Regel
- Secret-Redaction
- keine Secrets in Logs, Prompts oder Responses

### 6. Test- und Betriebsfähigkeit

Für Production Readiness fehlen automatisierte Tests, CI, Traceability, definierte RPO/RTO-Werte und Restore-Nachweise.

## Arbeitsplan ab heute Abend

## Abend 1 – Baseline und Sicherheitsinventur

**Ziel:** Nicht sofort umbauen, sondern den aktuellen Zustand messbar machen.

### Aufgaben

- [ ] Repository lokal aktualisieren.
- [ ] `npm ci` ausführen.
- [ ] `npm run typecheck` ausführen und Fehler dokumentieren.
- [ ] `npm run lint` ausführen und Fehler dokumentieren.
- [ ] `npm run build` ausführen und Fehler dokumentieren.
- [ ] Alle Dateien unter `app/api/` inventarisieren.
- [ ] Alle UI-Routen mit `Sidebar.tsx` vergleichen.
- [ ] Prüfen, welche API-Routen `getAktuelleRolle()` oder `getAktuelleMitarbeiterId()` verwenden.
- [ ] Alle Stellen markieren, an denen `admin`, `x-q7-user` oder `x-q7-mitarbeiter` hart codiert sind.

### Ergebnis

Am Ende des ersten Abends sollten drei Listen vorhanden sein:

```text
1. Build-/Typecheck-Fehler
2. Ungeschützte API-Routen
3. Ressourcen ohne Tenant-/Ownership-Scope
```

## Abend 2 – Authentifizierungsentscheidung und Datenmodell

**Ziel:** Das Sicherheitsfundament verbindlich festlegen.

### Aufgaben

- [ ] Entscheidung für Session-Lösung treffen.
- [ ] Rollenmatrix für `admin`, `tenant_admin` und `lizenznehmer` definieren.
- [ ] Modelle `User`, `Tenant`, `TenantMembership` und `DataSpace` entwerfen.
- [ ] Alle bestehenden Modelle einer Ownership-Kategorie zuordnen.
- [ ] Daten-Migrationsstrategie für bestehende Testdaten erstellen.
- [ ] Keine Migration direkt auf Produktionsdaten anwenden.

### Ergebnis

Ein abgestimmtes Datenmodell und eine Liste aller benötigten Migrationen.

## Abend 3 – Server Guards

**Ziel:** Keine geschützte API darf ohne Identitäts- und Berechtigungsprüfung funktionieren.

### Aufgaben

- [ ] `requireUser()` serverseitig implementieren.
- [ ] `requireRole()` implementieren.
- [ ] `requireTenantAccess()` implementieren.
- [ ] API-Routen für Chat, Posteingang, Aufgaben, Projekte, Wissen und Agenten prüfen.
- [ ] Direkte Nutzung von Client-Headern als Identitätsquelle entfernen.
- [ ] Tests für `401`, `403` und Cross-Tenant-Zugriffe schreiben.

### Ergebnis

Eine API, die bei fehlender oder falscher Berechtigung fail-closed reagiert.

## Abend 4 – Tenant-Scope und PostgreSQL-Staging

**Ziel:** Datenbank und Datenzugriff an die Zielarchitektur angleichen.

### Aufgaben

- [ ] PostgreSQL-Stagingdatenbank bereitstellen.
- [ ] Prisma-Datasource für Staging konfigurieren.
- [ ] Tenant-Felder und Relationen ergänzen.
- [ ] Bestehende Migrationen in Staging prüfen.
- [ ] Backfill für bestehende Demo-Daten planen.
- [ ] Queries in den Adaptern auf Tenant-Scope umstellen.

### Ergebnis

Ein erster vollständiger Workflow, zum Beispiel Posteingang, läuft tenant-scoped über PostgreSQL.

## Abend 5 – Policy Engine und Tool Gateway

**Ziel:** KI-Aktionen und Werkzeuge dürfen nicht mehr direkt ausgeführt werden.

### Aufgaben

- [ ] Policy-Entscheidungen definieren: `ALLOW`, `DENY`, `REVIEW`.
- [ ] Fail-Closed-Verhalten implementieren.
- [ ] `ToolGateway` erstellen.
- [ ] Tool-Allowlist definieren.
- [ ] Agenten- und API-Code auf direkte Tool-Aufrufe prüfen.
- [ ] Audit-/Evidence-Record mit Correlation-ID einführen.

### Ergebnis

Jede Werkzeugaktion ist nachvollziehbar und policy-geprüft.

## Abend 6 – Prompt-Sicherheit, DLP und Secrets

**Ziel:** Daten dürfen nicht unkontrolliert in Prompts oder externe Systeme gelangen.

### Aufgaben

- [ ] `ContextPackage` mit getrennten Ebenen erstellen.
- [ ] Uploads und Posteingangsinhalte klassifizieren.
- [ ] Quarantänepfade definieren.
- [ ] Secret-Redaction in Logs und Fehlern einbauen.
- [ ] Datenklassen und `Niemals Extern` definieren.
- [ ] DLP-Prüfung vor jedem Connector-/Exportversand erzwingen.

### Ergebnis

Prompt-Injection- und Datenabflussrisiken sind technisch reduziert und testbar.

## Abend 7 – Tests und Release-Gate

**Ziel:** Die Änderungen reproduzierbar prüfen.

### Aufgaben

- [ ] Vitest einrichten.
- [ ] Playwright einrichten.
- [ ] Unit-Tests für Rollen und Tenant-Scope schreiben.
- [ ] Integrationstests für geschützte API-Routen schreiben.
- [ ] Prompt-Injection- und DLP-Tests ergänzen.
- [ ] CI für Lint, Typecheck, Tests, Migration-Check und Build einrichten.
- [ ] Release-Gate dokumentieren.

### Ergebnis

Kein Merge in den Produktionsbranch ohne bestandene Sicherheits- und Build-Prüfungen.

## Priorisierte Ticketliste

| Ticket | Aufgabe | Priorität | Abhängigkeit | Status |
|---|---|---:|---|---|
| Q7-001 | Technische Baseline erzeugen | P0 | keine | Offen |
| Q7-010 | User-, Session- und Membership-Modell | P0 | Q7-001 | Offen |
| Q7-011 | Serverseitige Permission Guards | P0 | Q7-010 | Offen |
| Q7-020 | Tenant-Scope in Prisma | P0 | Q7-010 | Offen |
| Q7-021 | PostgreSQL-Stagingmigration | P0 | Q7-020 | Offen |
| Q7-030 | Policy Engine mit Fail-Closed | P0 | Q7-011 | Offen |
| Q7-031 | Zentrales Tool Gateway | P0 | Q7-030 | Offen |
| Q7-032 | Context Package und Prompt-Schutz | P0 | Q7-030 | Offen |
| Q7-033 | Secret-Redaction | P0 | Q7-011 | Offen |
| Q7-034 | DLP-Gate | P0 | Q7-030 | Offen |
| Q7-012 | Admin-/Lizenznehmer-UI | P0 | Q7-011 | Offen |
| Q7-040 | A01-Routing | P1 | Q7-030 | Offen |
| Q7-041 | Agenten-/Prompt-Doku validieren | P1 | Q7-040 | Offen |
| Q7-042 | Wissensartefakte und Retrieval-Scope | P1 | Q7-020 | Offen |
| Q7-050 | Sidebar aktualisieren | P1 | Q7-001 | Offen |
| Q7-052 | Testframework und CI | P0 | Q7-011 | Offen |
| Q7-053 | Traceability-Matrix | P1 | Q7-052 | Offen |
| Q7-054 | Backup, Restore und Healthchecks | P1 | Q7-021 | Offen |
| Q7-055 | Repository bereinigen und Doku aktualisieren | P2 | Q7-001 | Offen |

## Definition of Done für Production Readiness

Die Anwendung darf erst als produktionsreif bezeichnet werden, wenn alle folgenden Punkte erfüllt sind:

- [ ] Jeder Benutzer besitzt eine eigene gültige Session.
- [ ] Rollen werden serverseitig geprüft.
- [ ] Jeder Zugriff ist einem Tenant und gegebenenfalls einem Datenraum zugeordnet.
- [ ] Cross-Tenant-Zugriffe sind durch automatisierte Tests ausgeschlossen.
- [ ] Produktivdaten laufen auf PostgreSQL.
- [ ] Migrationen wurden in Staging geprüft.
- [ ] Tool-Aufrufe laufen ausschließlich über das Tool Gateway.
- [ ] Policy-Ausfälle führen zu `DENY`.
- [ ] Fremdinhalte werden von Systeminstruktionen getrennt.
- [ ] Verdächtige Inhalte werden quarantänisiert.
- [ ] DLP prüft jeden externen Output.
- [ ] Secrets erscheinen nicht in Logs, Prompts oder Responses.
- [ ] A01-Routing ist versioniert und getestet.
- [ ] Wissenszugriffe prüfen Tenant und Datenraum.
- [ ] Unit-, Integrations- und E2E-Tests laufen in CI.
- [ ] Traceability zwischen Doku, Ticket, Code und Test ist vorhanden.
- [ ] Backups und Restore wurden erfolgreich getestet.
- [ ] RPO und RTO sind dokumentiert.
- [ ] README und Architektur-Dokumentation entsprechen dem tatsächlichen Code.

## Zielwerte für die Reifeentwicklung

| Meilenstein | Ziel | Bedeutung |
|---|---:|---|
| Aktueller Stand | 30/100 | Umfangreicher interner Prototyp/MVP, nicht produktionsreif |
| Nach Auth + Tenant + Tests | 50/100 | Kontrollierter interner Pilot möglich |
| Nach PostgreSQL + Security Enforcement | 70/100 | Begrenzter produktiver Pilot mit Monitoring |
| Nach DLP, Retrieval, Restore und vollständiger CI | 85/100 | Belastbare Produktionsbasis |
| Nach Betriebserfahrung, Security Review und vollständiger Traceability | 95–100/100 | Vollständig produktionsreife Anwendung |

## Wichtigste Empfehlung

Nicht zuerst weitere UI-Funktionen ergänzen. Der nächste Arbeitsfokus sollte lauten:

```text
1. Identität
2. Tenant-Scope
3. Server Guards
4. PostgreSQL
5. Policy/Tool Gateway
6. Tests und CI
```

Wenn diese sechs Grundlagen stehen, kann Q7 sicher und kontrolliert um weitere Agenten-, Wissens- und Connector-Funktionen erweitert werden.
