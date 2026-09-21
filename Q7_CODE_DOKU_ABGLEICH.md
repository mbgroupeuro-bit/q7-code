# Q7: Vergleich `q7-code` vs. `q7-doku`

**Stand:** 21.09.2026  
**Code-Repository:** `mbgroupeuro-bit/q7-code`  
**Dokumentations-Repository:** `mbgroupeuro-bit/q7-doku`

## 1. Management-Zusammenfassung

`q7-code` ist deutlich weiter entwickelt als die ursprüngliche README beschreibt. Neben der Next.js-Oberfläche existieren inzwischen API-Routen, Prisma-Migrationen, Datenzugriffs-Adapter für Aufgaben, Posteingang, Kalender, Notizen und KI-Agenten sowie ein Prozessregister.

Die zentrale Lücke ist daher nicht mehr „kein Backend“, sondern die fehlende Durchgängigkeit zwischen der verbindlichen Zielarchitektur aus `q7-doku` und der tatsächlichen Implementierung. Besonders kritisch sind:

1. **Mandantenfähigkeit fehlt im Prisma-Schema**, obwohl sie in `Q7_Tenant_Modell_v1_2.md` verbindlich ist.
2. **PostgreSQL, getrennte Datenbereiche, Object Storage, Vector Store und Append-only Audit Store** sind dokumentiert, der Code verwendet aber eine SQLite-Datenquelle und vermischt Domänen in einem Schema.
3. **Echte Authentifizierung fehlt**: `proxy.ts` nutzt gemeinsames Basic Auth und setzt jeden Request auf `admin`.
4. **Admin-/Lizenznehmer-Trennung ist nicht vollständig umgesetzt**: `app/agenten/page.tsx` ist als Route vorhanden; die Servergrenzen müssen für jede direkte URL und API geprüft werden.
5. **Tool Gateway, Sandbox, DLP, Quarantäne und belastbare Prompt-Injection-Abwehr** sind in der Doku verbindlich, im Code aber nicht als vollständige technische Enforcement-Kette nachgewiesen.
6. **Traceability und automatisierte Akzeptanztests** sind dokumentiert, im Code fehlen jedoch ein Test-Setup und eine nachweisbare Matrix-Verknüpfung.

## 2. Was bereits umgesetzt ist

### Im Code

- Next.js 16 App Router mit TypeScript und Tailwind CSS.
- Oberflächen für Überblick, Posteingang, Aufgaben, Kalender, Chat, Projekte, Studio, Ausgabe, Chronik, Bibliothek und Einstellungen.
- API-Module für Chat, Posteingang, Aufgaben, Termine, Notizen, Wissen und Agenten-Aktionen.
- Prisma-Schema mit Modellen für `PosteingangEintrag`, `MeineAufgabe`, `Termin`, `AgentChat`, `AgentAktion`, `AgentRoutine`, `ProzessRegisterEintrag` und `Projekt`.
- Adapter-/Service-Strukturen, zum Beispiel `lib/ki-agent/`, `lib/posteingang/`, `lib/kalender/` und `lib/chat/`.
- Rollenwerte `admin`, `tenant_admin` und `lizenznehmer` in `lib/rollen.ts` sowie serverseitige Header-Auswertung in `lib/auth-server.ts`.
- Freigabe- und Cooling-off-Felder für Agentenaktionen.
- Token-/Kostenmodell für KI-Antworten.
- Basic-Auth-Schutz im `proxy.ts` als Übergangslösung.

### In der Dokumentation

- Verbindliches Agentenmodell inklusive A00/A01 und Agentenstruktur.
- Verbindliches Tenant-Modell mit Sub-Lizenznehmern und Datenräumen.
- Sicherheitsmodell mit Tool Gateway, Policy-Prüfung, Sandbox, DLP, Secret Management und Quarantäne.
- Technisches Architekturhandbuch mit Store-Zuordnung, Connector-Lifecycle, Deployment-Modi, Observability und Restore-Pflichten.
- UI-Spezifikation für Kunden-UI und Admin-Konsole.
- Test- und Traceability-Modell für Code, Workflows, Prompts, Retrieval, Policies und Outputs.
- Final freigegebene Sidebar-Struktur ohne dauerhaften ERP-Menüpunkt.

## 3. Mismatch-Liste

### P0: Vor produktivem Betrieb zwingend schließen

| ID | Dokumentvorgabe | Aktueller Codebefund | Risiko | Ziel/Fix |
|---|---|---|---|---|
| M-01 | Plattform-Multi-Tenancy mit eindeutiger Tenant-ID für jede Ressource | `prisma/schema.prisma` enthält kein `Tenant`-/`Lizenznehmer`-Modell; Kernmodelle besitzen kein `tenant_id` | Daten verschiedener Lizenznehmer können nicht strukturell getrennt werden | `Tenant`, hierarchische Sub-Tenants, Datenräume und Tenant-FKs ergänzen; Queries standardmäßig tenant-scoped |
| M-02 | Kein Zugriff über Lizenznehmergrenzen | Rollenprüfung basiert auf Headern; `proxy.ts` setzt für alle Requests `admin` und eine feste Mitarbeiter-ID | Spoofing-/Fehlkonfigurationsrisiko, keine echte Identität | Session-basierte Authentifizierung; serverseitige `requireUser()`-/`requireTenantAccess()`-Prüfung |
| M-03 | PostgreSQL als relationaler Store | Prisma datasource ist `sqlite` | Nicht passend zur Zielarchitektur; eingeschränkte Parallelität und Migrationseignung | PostgreSQL für Produktivbetrieb; SQLite nur explizit für lokale Demo |
| M-04 | Mandanten- und Agentendaten getrennt | Ein Prisma-Schema enthält Geschäfts-, Agenten-, Aufgaben- und Prozessdaten gemeinsam | Verstoß gegen strukturelle Datenraumtrennung | Datenbereiche logisch oder physisch trennen; mindestens getrennte DB-Schemas/Clients und klare Servicegrenzen |
| M-05 | Admin-Konsole für Kundenrollen nicht erreichbar | `app/agenten/page.tsx` existiert; `useCurrentRole()` im Client liefert weiterhin immer `admin` | Kunden könnten interne Agenteninformationen sehen | Route und APIs serverseitig schützen; Kunden-UI darf keine Agentencodes, Prozess-IDs oder interne Prompts zeigen |
| M-06 | Tool-Aufrufe ausschließlich über Tool Gateway und Sandbox | `lib/ki-agent/werkzeuge.ts` und Agentenrouten müssen auf direkte Werkzeugausführung geprüft werden; kein zentraler Enforcement-Nachweis | Agent kann Policy/Sandbox umgehen | `ToolGateway` als einziger Aufrufpfad; Policy-Check, Sandbox, Audit Record und Fail-Closed |
| M-07 | Fremdinhalte durch Sanitization, Quarantäne und Policy vor Agentenverarbeitung | Posteingang, Upload und Chat haben Datenpfade; vollständige Quarantäne-/Prompt-Injection-Kette ist nicht nachgewiesen | Prompt Injection und Datenabfluss | normalisiertes `ContextPackage` mit `system`, `instruction`, `data`; Verdachtsfälle quarantänisieren |
| M-08 | Keine Secrets in Prompts, Logs oder Fehlermeldungen | Architektur fordert Secret Manager; Repo nutzt `.env`-Variablen und Logging-Mechanismen | Secret-Leakage | Secret Manager/Deployment-Secrets, Redaction-Utility und Log-Policy einführen |
| M-09 | DLP vor jedem externen Connector-Output | Connector-Framework und DLP-Enforcement sind nicht als zentrale Codepfade sichtbar | Unkontrollierter Export vertraulicher Daten | `classifyData()` → `checkConnectorPolicy()` → `send()` als verpflichtende Pipeline |
| M-10 | Append-only Audit/Evidence Records | `AgentAktion` und Verlaufsmodelle existieren, aber kein einheitlicher Evidence Record für jeden KI-/Tool-/Output-Lauf | Fehlende Nachvollziehbarkeit und Abrechnung | unveränderlichen Audit-Service mit Correlation-ID, Actor, Tenant, Tool, Input-Hash, Output-Hash, Kosten und Ergebnis |

### P1: Für die nächste produktive Iteration

| ID | Dokumentvorgabe | Aktueller Codebefund | Ziel/Fix |
|---|---|---|---|
| M-11 | Final freigegebene Sidebar | `Sidebar.tsx` enthält weiterhin `/erp` mit „Neu“; Doku sagt ausdrücklich, ERP soll entfernt werden | ERP-Eintrag entfernen; `Arbeitsbereiche`/`Projekte` terminologisch vereinheitlichen |
| M-12 | UI zeigt Zustände/Rollen statt interner Agentenlogik | `AgentSelector`, Agentenseite und Protokoll zeigen interne Agenten-/Akteurwerte | Sichtbarkeit abhängig von Rolle; Lizenznehmer sieht neutrale Rollenbezeichnungen |
| M-13 | A01 routet Anfragen; Agenten arbeiten über definierte Prozesse | README sagt, Chat wählt aktuell den Agenten manuell; Agenten-Routing fehlt | Routing-Matrix aus `A01_Routing-Entscheidung_v1.1.md` als versionierte, testbare Regel implementieren |
| M-14 | Zentrale Wissensbasis mit Artefaktversionen und Scope-Prüfung | `lib/wissen.ts` und statische Wissensdaten sind nicht als versioniertes Retrieval-System umgesetzt | Artefaktmodell, Metadatenfilter, Berechtigungsscope, Retrieval-Evidence |
| M-15 | PostgreSQL-/Object-/Vector-/Audit-Store gemäß Architekturhandbuch | Uploads und Ablagepfade sind teilweise lose Strings bzw. LocalStorage-/Dateiannahmen | Storage-Ports definieren und je Datenklasse einen zuständigen Store festlegen |
| M-16 | Test- und Traceability-Modell | `package.json` enthält kein `test`-Script; keine erkennbare CI-Testpipeline | Vitest/Playwright, API-/Policy-/Workflow-Tests und Traceability-Matrix einführen |
| M-17 | RPO/RTO und Restore-Tests | README beschreibt VPS/PM2, aber keine belastbaren Backup-/Restore-Nachweise | Backup-Job, Restore-Runbook und periodischer Restore-Test |
| M-18 | Connector-Lifecycle | Gmail-Polling existiert als Script, aber ein allgemeines Connector-Registry-Modell ist nicht erkennbar | Connector-ID, Konfiguration, Status, Deaktivierung und DLP-Gate standardisieren |

### P2: Konsistenz und Wartbarkeit

| ID | Befund | Ziel/Fix |
|---|---|---|
| M-19 | `README.md` beschreibt weiterhin eine statische Dummy-App ohne Backend, obwohl API, Prisma und Migrationen existieren | README aktualisieren und den tatsächlichen Reifegrad dokumentieren |
| M-20 | `lib/types.ts` enthält Demo-Daten und historische Änderungsnotizen neben Domänentypen | Seed-Daten, Types und Architekturentscheidungen trennen |
| M-21 | Viele Statusfelder sind freie `String`-Werte | Prisma-Enums oder zentrale Zod-Schemas verwenden |
| M-22 | Mehrere fachliche Domänen liegen im React-Context `lib/store.tsx` | UI-Cache vom Server-State trennen; Domänen-Services zentralisieren |
| M-23 | Migrationshistorie enthält viele nachträgliche Erweiterungen und SQLite-spezifische Hinweise | Migrationen gegen PostgreSQL in einer Staging-Datenbank validieren |
| M-24 | Es existieren Diagnose-/Log-/PowerShell-Dateien im Repository-Root | `diagnostics/` bzw. externe Artefakte verwenden; keine sensiblen Logs versionieren |

## 4. Priorisierte Roadmap

### Sprint 0: Baseline und Entscheidungsfreeze

**Ziel:** Eine überprüfbare Ausgangsbasis schaffen.

1. Code- und Doku-Versionen fest pinnen.
2. `npm run typecheck`, `npm run lint`, `npm run build` ausführen und Ergebnisse als Baseline speichern.
3. Alle API- und UI-Routen inventarisieren.
4. Aktive SSOT-Dokumente markieren; Archivdokumente aus Implementierungsanforderungen entfernen.
5. Terminologie festlegen: `Tenant/Lizenznehmer`, `Bereich/Datenraum`, `Arbeitsbereiche/Projekte`.
6. Mismatch-IDs in ein versioniertes Register übernehmen.

**Abnahmekriterium:** Jeder Mismatch besitzt einen Verantwortlichen, eine Zielversion und ein prüfbares Akzeptanzkriterium.

### Sprint 1: Authentifizierung, Rollen und Tenant-Scope

1. Session-basierte Authentifizierung einführen.
2. `User`, `Tenant`, `TenantMembership`, `Role` und optional `DataSpace` modellieren.
3. `getCurrentUser()` und `requirePermission()` server-only implementieren.
4. Header aus Client-Anfragen nicht mehr als Identitätsquelle akzeptieren.
5. Jede API-Route auf Authentifizierung und Tenant-Scope umstellen.
6. `/agenten`, Konfiguration, Protokoll und Agenten-Aktionen nur für Admin/Operator freigeben.

**Abnahmekriterium:** Ein Testbenutzer aus Tenant A kann weder UI noch API-Daten von Tenant B abrufen; fehlende/ungültige Session wird fail-closed abgewiesen.

### Sprint 2: Datenarchitektur und Migration

1. PostgreSQL als Ziel festlegen.
2. Tenant-FK und Ownership-FK für alle relevanten Modelle ergänzen.
3. Agenten-/Systemdaten und Lizenznehmerdaten durch Services/Schema-Grenzen trennen.
4. Migrationen in einer Kopie der Produktdatenbank testen.
5. Storage-Ports für relationale Daten, Dateien, Retrieval und Audit definieren.
6. LocalStorage nur noch als optionalen UI-Cache verwenden.

**Abnahmekriterium:** Alle produktiven Ressourcen sind einem Tenant/DataSpace zugeordnet und jede Datenabfrage enthält einen serverseitigen Scope.

### Sprint 3: Security Enforcement

1. `PolicyEngine` mit fail-closed Verhalten erstellen.
2. `ToolGateway` als einzigen Tool-Aufrufpfad einführen.
3. Sandbox-Adapter und Tool-Allowlist implementieren.
4. Prompt-/Datenebenen mit typisiertem `ContextPackage` trennen.
5. Quarantänepfade für verdächtige Uploads, E-Mails und externe Antworten implementieren.
6. Redaction und Secret-Manager-Anbindung ergänzen.
7. DLP-Gate vor Connector-Outputs einbauen.

**Abnahmekriterium:** Kein Tool-Aufruf, Connector-Output oder Agenten-Request kann die Policy-Prüfung umgehen.

### Sprint 4: Agentenrouting und Wissenszugriff

1. A01-Routing-Matrix aus `q7-doku` in testbare Regeln überführen.
2. A00 als Aufsichtsagent transparent im Audit führen.
3. Agentenprompt-Versionen aus den Dokumentationsdateien erzeugen oder kontrolliert synchronisieren.
4. Wissensartefakte mit Version, Scope, Datenklasse und Freigabestatus modellieren.
5. Retrieval-Evidence für jede KI-Antwort speichern.
6. Modell-Retry/Fallback und Kosten-Observability vervollständigen.

**Abnahmekriterium:** Jede Anfrage besitzt einen nachvollziehbaren Routing-, Prompt-, Retrieval- und Kostenpfad.

### Sprint 5: Tests, Traceability und Betrieb

1. Unit-Tests für Rollen, Policies, Routing und Daten-Scope.
2. Integrations-Tests für API-Routen und Datenbank.
3. Playwright-Smoke-Tests für Login, Posteingang, Aufgaben, Chat und Freigaben.
4. Prompt-Injection-, DLP- und Quarantäne-Regressionstests.
5. Traceability-Matrix mit Mismatch-ID, Dokumentabschnitt, Codepfad und Test-ID.
6. GitHub Actions für Lint, Typecheck, Tests, Migration-Check und Build.
7. Backup, Restore und RPO/RTO-Runbook.

**Abnahmekriterium:** Kein produktiver Merge ohne bestandene Sicherheits-, Scope-, Workflow- und Build-Prüfungen.

## 5. Umsetzungsvorlage

### 5.1 Authentifizierung und Autorisierung

Empfohlene Struktur:

```text
lib/auth/
  session.ts          // server-only: Session lesen/validieren
  permissions.ts      // Rollen + Policy-Matrix
  guards.ts           // requireUser, requireRole, requireTenantAccess
  types.ts

app/login/page.tsx
app/api/auth/login/route.ts
app/api/auth/logout/route.ts
```

Beispielhafte Server-Verträge:

```ts
export type Role = "admin" | "tenant_admin" | "lizenznehmer";

export type CurrentUser = {
  id: string;
  tenantId: string;
  role: Role;
  dataSpaceIds: string[];
};

export async function requireUser(): Promise<CurrentUser> {
  // Session-Cookie serverseitig validieren; bei Fehler 401.
  throw new Error("Implementierung erforderlich");
}

export async function requireTenantAccess(
  user: CurrentUser,
  tenantId: string,
): Promise<void> {
  if (user.role !== "admin" && user.tenantId !== tenantId) {
    throw new Error("FORBIDDEN");
  }
}
```

Wichtig:

- Keine Rollenbestimmung aus frei eingesendeten Request-Headern.
- Kein Fallback auf `admin`.
- UI-Ausblendung nur als Komfort, niemals als Sicherheitsgrenze.
- Jede Route prüft Identität, Tenant, Datenraum und Aktion.

### 5.2 Datenbankmodell

Minimaler Kern für die nächste Iteration:

```prisma
model Tenant {
  id            String             @id @default(cuid())
  name          String
  parentId      String?
  parent        Tenant?            @relation("TenantHierarchy", fields: [parentId], references: [id])
  children      Tenant[]           @relation("TenantHierarchy")
  memberships   TenantMembership[]
  dataSpaces    DataSpace[]
  createdAt     DateTime           @default(now())
}

model TenantMembership {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String
  role      String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  @@unique([tenantId, userId])
  @@index([userId])
}

model User {
  id          String             @id @default(cuid())
  email       String             @unique
  passwordHash String
  active      Boolean            @default(true)
  memberships TenantMembership[]
  createdAt   DateTime           @default(now())
}

model DataSpace {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  @@index([tenantId])
}
```

Danach erhalten mindestens diese Modelle eine Ownership-Zuordnung:

```text
Bereich
PosteingangEintrag
MeineAufgabe
Notiz
Termin
AgentChat
Projekt
Datei/Ablage
Wissensartefakt
Output
Audit/Evidence
```

Für jede Änderung gilt:

- Migration zuerst in Staging testen.
- Bestehende Zeilen erhalten einen expliziten Tenant/DataSpace.
- Keine Migration mit unkontrolliertem `DROP TABLE`.
- Queries über Services kapseln, nicht direkt aus beliebigen UI-Komponenten.

### 5.3 Routen und Zugriffsmatrix

Empfohlene sichtbare Struktur:

```text
Öffentliche/Authentifizierung
  /login

Lizenznehmer-UI
  /dashboard
  /posteingang
  /aufgaben
  /kalender
  /chat
  /projekte
  /studio
  /output
  /ablage
  /einstellungen

Admin-/Operator-Konsole
  /admin/agenten
  /admin/protokoll
  /admin/policies
  /admin/connectoren
  /admin/tenants
```

Die bestehende Route `/agenten` sollte entweder nach `/admin/agenten` verschoben oder serverseitig streng geschützt werden. `/protokoll` muss abhängig von der Rolle unterschiedliche Detailstufen liefern.

API-Organisation:

```text
/api/auth/*
/api/me/*
/api/tenants/*
/api/posteingang/*
/api/aufgaben/*
/api/chat/*
/api/wissen/*
/api/studio/*
/api/output/*
/api/admin/agenten/*
/api/admin/policies/*
/api/admin/connectoren/*
```

Jeder Handler folgt diesem Ablauf:

```text
Request
  -> Schema-Validierung (Zod)
  -> requireUser()
  -> Tenant-/Datenraum-Scope
  -> Policy-Prüfung
  -> Service-Aufruf
  -> Audit/Evidence Record
  -> typisierte Antwort
```

## 6. Definition of Done für die produktive Iteration

Die Iteration ist erst abgeschlossen, wenn:

- echte Benutzer-Sessions funktionieren;
- jede Ressource einem Tenant oder Datenraum zugeordnet ist;
- direkte URL- und API-Zugriffe serverseitig geschützt sind;
- PostgreSQL-Migrationen erfolgreich in Staging und Produktion laufen;
- Agentenaktionen über Policy Engine und Tool Gateway gehen;
- Fremdinhalte klassifiziert und bei Verdacht quarantänisiert werden;
- kein Secret in Logs, Prompts oder Antworten auftaucht;
- jeder externe Output ein DLP-Ergebnis besitzt;
- A01-Routing und A00-Aufsicht nachvollziehbar protokolliert werden;
- Unit-, Integrations-, E2E- und Security-Tests in CI laufen;
- Backup-/Restore-Tests dokumentiert sind;
- README, Doku und Code denselben Implementierungsstand beschreiben.

## 7. Schlussfolgerung

`q7-code` ist kein reiner statischer Prototyp mehr. Es ist ein wachsendes Next.js-/Prisma-System mit mehreren realen Modulen. Die nächste Aufgabe sollte deshalb nicht primär neue UI-Funktionen sein, sondern die **Verbindlichkeit der Architektur im Code** herzustellen.

Die wichtigste Reihenfolge lautet:

```text
Auth + Tenant-Scope
  -> PostgreSQL/Datenmodell
  -> Policy/Tool Gateway/Sandbox
  -> Routing/Wissen/Observability
  -> Tests/Traceability/Restore
```

Erst danach sollten weitere Agenten- und Connector-Funktionen produktiv freigeschaltet werden.
