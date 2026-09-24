# Q7 Arbeitsplan in Blöcken – Final

**Projekt:** Q7  
**Code:** `mbgroupeuro-bit/q7-code`  
**Dokumentation:** `mbgroupeuro-bit/q7-doku`  
**Zweck:** kontrolliertes Aufräumen, Prüfen, Stabilisieren und schrittweiser Ausbau zur produktionsreifen Anwendung  
**Status:** Arbeitsplan zur Freigabe  
**Version:** 1.0  
**Datum:** 21.09.2026

> Dieser Plan ist für Obsidian strukturiert. Jeder Block hat ein Ziel, konkrete Aufgaben, einen Verantwortlichen, ein Prüfergebnis und ein Tor. Der nächste Block darf erst beginnen, wenn das Tor des vorherigen Blocks erfüllt und dokumentiert ist.

---

## 0. Rollen und Kontrollfluss

### Mensch / Admin

Der Admin entscheidet über:

- endgültiges Löschen
- Änderungen an verbindlichen Dokumenten
- Stack, Authentifizierung, Hosting und Datenschutz
- Freigabe von Sicherheits- und Datenbankänderungen
- Übergang zum nächsten Block

### Claude Code

Claude Code arbeitet die zugewiesenen Implementierungsblöcke ab:

- nur im vorgesehenen Blockumfang
- mit dokumentierten Änderungen
- mit Build-/Testnachweisen
- ohne eigenmächtiges Löschen von geschützten Dateien

### Sonnet

Sonnet übernimmt klar begrenzte, gut prüfbare Aufgaben:

- Inventur und Klassifikation
- Aufräumen nach Freigabe
- Dokumentationspflege
- Testgerüst und einfache Tests
- Routen- und Codeprüfungen
- wiederholbare Massenänderungen mit anschließendem Build

### Fable

Fable übernimmt oder reviewt sicherheitskritische Kernbereiche:

- Login und Sessions
- Rollen und Berechtigungen
- Tenant- und Datenraum-Scope
- Policy Engine
- Tool Gateway
- DLP und Secret-Grenzen
- Review des von Sonnet geänderten Codes

Wenn Fable einen Sicherheitsblock nicht übernimmt, wird Sonnet eingesetzt. Dieser Wechsel muss im Arbeitsprotokoll begründet werden.

### Gemini als Kontrolleur

Gemini kontrolliert die Ergebnisse, ersetzt aber nicht den Admin und führt keine ungeprüften Änderungen direkt im Repository aus.

Empfohlener Ablauf:

```text
Claude Code bearbeitet Block
  -> Commit / Patch / Ergebnisdateien
  -> Ablage im Google-Drive-Arbeitsordner
  -> Gemini prüft gegen diesen Plan
  -> Gemini erstellt Prüfbericht und nächste Aufgaben
  -> Admin entscheidet über Freigabe
  -> Claude Code erhält nur freigegebene nächste Aufgaben
```

Google Drive ist dabei ein Kontroll- und Übergabeordner, nicht die primäre Quelle des Codes. Die primäre Quelle bleibt GitHub. Jeder Drive-Bericht muss Commit-SHA, Block-ID und Repository enthalten.

---

## 1. Unverhandelbare Sicherheitsregeln

### 1.1 Erst sichern, dann inventarisieren

Vor B01 müssen beide Repositories gesichert werden:

- Git-Tag auf dem aktuellen Stand
- ZIP-Export von `q7-code`
- ZIP-Export von `q7-doku`
- Ablage der ZIP-Dateien auf einem zweiten Datenträger
- Dokumentation von Commit-SHA, Tag, Datum und Prüfsumme

### 1.2 Erst inventarisieren, dann entscheiden, dann ändern

- **B01:** ausschließlich lesen und inventarisieren
- **B02:** Admin prüft und gibt jede Änderung frei
- **B03:** erst danach werden Änderungen durchgeführt

### 1.3 Verschieben vor Löschen

- Dateien werden zunächst nach `_archiv/` verschoben.
- Endgültiges Löschen erst nach grünem Build, Typecheck, Smoke-Test und Admin-Freigabe.
- Keine Sammellöschung ohne Datei- und Verwendungsnachweis.

### 1.4 Nie eigenmächtig als Müll behandeln

Nicht ohne ausdrückliche Prüfung löschen oder verschieben:

- `prisma/migrations/`
- `prisma/schema.prisma`
- `*.db`
- `.env*`
- `package-lock.json`
- `tsconfig.json`
- echte Unterlagen außerhalb des Repositories
- verbindliche Dokumente oder aktive SSOT-Dateien

`.env*` dürfen nicht in Sicherungs-ZIPs oder Reports mit geheimen Inhalten landen. Nur Dateinamen und Secret-freie Metadaten dokumentieren.

### 1.5 Dokumentationsregeln

Alte Dokumentversionen werden nur archiviert, wenn:

- der Systemindex geprüft wurde;
- keine aktiven Querverweise mehr auf sie zeigen;
- die aktuelle Ersatzdatei eindeutig feststeht;
- der Admin die Änderung freigibt.

---

# Phase A – Sicherung, Inventur, Aufräumen und Baseline

## B00 – Sicherung beider Repositories

**Verantwortlicher:** Admin / Claude Code für technische Ausführung  
**Modell:** Claude Code  
**Ändert Code:** Nein

### Aufgaben

- aktuellen Branch und Commit beider Repositories erfassen;
- Git-Tags erstellen;
- ZIP-Sicherungen erzeugen;
- Sicherungen auf zweitem Datenträger ablegen;
- SHA-256-Prüfsummen erstellen;
- Sicherungsbericht im Google-Drive-Arbeitsordner speichern.

### Ergebnisdateien

```text
B00_backup_report.md
B00_manifest_q7-code.txt
B00_manifest_q7-doku.txt
B00_checksums.txt
```

### Tor A00

- beide Repositories sind tag- und ZIP-gesichert;
- Prüfsummen stimmen;
- Admin bestätigt schriftlich: **B00 freigegeben**.

---

## B01 – Read-only-Inventur

**Verantwortlicher:** Sonnet oder Claude Code  
**Modell:** Sonnet  
**Ändert Code:** Nein

### Aufgaben Code

- Top-Level-Dateien und Verzeichnisse erfassen;
- alle `app/`-Routen erfassen;
- alle `app/api/**/route.ts` erfassen;
- `components/`, `lib/`, `prisma/`, `scripts/` klassifizieren;
- `package.json`, Prisma, Next-Konfiguration und Umgebungsvariablen-Namen erfassen;
- Diagnose-, Log-, Backup- und historische Dateien markieren;
- Duplikate nur als Kandidaten markieren, nicht löschen;
- alle bekannten Build-/Typecheck-Dateien dokumentieren.

### Aufgaben Doku

- aktive SSOT-Dokumente erfassen;
- Archivdokumente erfassen;
- Querverweise und Systemindex prüfen;
- veraltete Versionen nur markieren;
- IST-/SOLL-/GAP-Lücken notieren.

### Ergebnisdateien

```text
B01_code-inventur.md
B01_doku-inventur.md
B01_duplikat-kandidaten.md
B01_loeschkandidaten.md
B01_route-inventur.md
B01_offene-entscheidungen.md
```

### Tor A01

- vollständige Inventur liegt vor;
- keine Datei wurde gelöscht oder verschoben;
- jeder Löschkandidat besitzt eine Begründung und einen Verwendungscheck;
- Admin bestätigt: **B01 freigegeben**.

---

## B02 – Zeilenweise Freigabe und Aufräumentscheidung

**Verantwortlicher:** Admin  
**Modell:** kein autonomer Modellentscheid

### Aufgaben

Für jeden Kandidaten entscheiden:

```text
BEHALTEN
VERSCHIEBEN NACH _archiv/
ZUSAMMENFÜHREN
AKTUALISIEREN
ENDGÜLTIG LÖSCHEN – nur nach späterem grünen Gate
```

Zusätzlich entscheiden:

- welche README aktuell ist;
- welche Doku SSOT ist;
- welche Versionen aktiv bleiben;
- ob ERP aus der Sidebar entfernt wird;
- ob `/agenten` Admin-only wird;
- ob der bestehende SQLite-Stand zunächst bleibt oder PostgreSQL sofort vorbereitet wird.

### Ergebnis

```text
B02_freigabeliste.md
B02_ssot-entscheidungen.md
B02_aufraeumumfang.md
```

### Tor A02

Keine Aufräumänderung beginnt ohne dokumentierte Admin-Freigabe.

---

## B03 – Kontrolliertes Aufräumen

**Verantwortlicher:** Claude Code  
**Modell:** Sonnet für mechanische Aufgaben; Admin-Freigabe vor jeder Gruppe

### Aufgaben

- genehmigte Dateien nach `_archiv/` verschieben;
- echte Duplikate zusammenführen;
- veraltete Root-Logs und temporäre Diagnoseartefakte archivieren;
- lokale Windows-Pfade aus produktiven Kommentaren entfernen;
- README- und STATUS-Widersprüche markieren oder aktualisieren;
- keine Prisma-Migrationshistorie entfernen;
- keine `.env`-Dateien mit Secret-Inhalten kopieren;
- Git-Commit pro logischer Aufräumgruppe erstellen.

### Tor A03

- jede Änderung entspricht B02;
- keine geschützte Datei wurde ungewollt verändert;
- Git-Diff ist nachvollziehbar;
- Archivpfade sind dokumentiert.

---

## B04 – Doku-Aufräumen und SSOT-Index

**Verantwortlicher:** Sonnet / Admin für verbindliche Inhalte  
**Modell:** Sonnet erstellt Vorschläge; Admin gibt verbindliche Doku frei

### Aufgaben

- zentralen Systemindex in `q7-doku` aktualisieren;
- aktive Dokumente von Archivdokumenten trennen;
- Code- und Testbezug in wichtige Dokumente ergänzen;
- IST/SOLL/GAP/ABNAHME in Architektur-, Sicherheits- und Tenant-Dokumenten ergänzen;
- `q7-code`-README auf den tatsächlichen Backend-/Prisma-Stand aktualisieren;
- Architekturentscheidungen als ADRs vorbereiten.

### Tor A04

- jede aktive Spezifikation hat Status, Version, Geltungsbereich und Akzeptanzkriterien;
- Systemindex und Querverweise sind geprüft;
- verbindliche Änderungen sind vom Admin freigegeben.

---

## B05 – Technische Baseline

**Verantwortlicher:** Claude Code  
**Modell:** Sonnet für Ausführung; Gemini für unabhängige Kontrolle

### Prüfungen

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npx prisma validate
npx prisma migrate status
```

Zusätzlich:

- zentrale UI-Routen als Smoke-Test öffnen;
- zentrale API-Routen mit gültigen und ungültigen Eingaben prüfen;
- mindestens einen Happy Path für Chat, Posteingang, Aufgaben und Kalender testen;
- aktuelle Fehler als Baseline dokumentieren.

### Ergebnisdateien

```text
B05_baseline.md
B05_typecheck.log
B05_lint.log
B05_build.log
B05_smoke-test.md
```

### Tor A05

Phase A ist bestanden, wenn:

- Build reproduzierbar läuft oder alle Fehler bekannt und freigegeben sind;
- Typecheck und Lint dokumentiert sind;
- Smoke-Test abgeschlossen ist;
- Aufräumen keine unbemerkten Funktionsverluste erzeugt hat;
- Gemini-Bericht vorliegt;
- Admin Phase B freigibt.

---

# Phase B – Entscheidungen, Tests, Login, Daten und Betrieb

## B10 – Architektur- und Stack-Entscheidungen

**Verantwortlicher:** Admin  
**Modell:** Gemini/Sonnet können Optionen bewerten; Entscheidung bleibt beim Admin

### Entscheidungen

- Session-Lösung
- Rollenmodell
- Tenant-/Datenraum-Modell
- SQLite-Übergang oder PostgreSQL-Migration
- Hosting und Deployment
- Object Storage
- KI-Anbieter und Datenschutz
- Logging- und Aufbewahrungsregeln
- Backup- und Restore-Ziele

### Tor B10

Eine freigegebene Entscheidungsmatrix liegt vor. Ohne B10 keine produktive Auth-, Tenant- oder Datenbankimplementierung.

---

## B11 – Testfundament und CI-Grundgerüst

**Verantwortlicher:** Sonnet  
**Review:** Fable für Security-Tests, Gemini für Ergebnisprüfung

### Aufgaben

- Vitest einrichten;
- Playwright einrichten;
- Testcontainers oder gleichwertige DB-Testumgebung prüfen;
- CI für Lint, Typecheck, Test und Build einrichten;
- Traceability-ID für jeden kritischen Test festlegen.

### Tor B11

CI prüft jeden Pull Request und schlägt bei Lint, Typecheck, Test oder Build fehl.

---

## B12 – Login und Sessionverwaltung

**Verantwortlicher:** Fable  
**Fallback:** Sonnet nach Admin-Freigabe

### Aufgaben

- User- und Session-Modell einführen;
- sichere Cookies und Sessionablauf implementieren;
- Login und Logout bauen;
- Basic Auth als Übergang kennzeichnen;
- `x-q7-user` und `x-q7-mitarbeiter` nicht als Identitätsquelle vertrauen;
- Auth-Tests ergänzen.

### Tor B12

- kein anonymer Zugriff auf geschützte Bereiche;
- kein Standard-Admin für jeden Request;
- `401` bei fehlender Session;
- Sessionablauf und Logout funktionieren.

---

## B13 – Server Guards und Rollen

**Verantwortlicher:** Fable  
**Fallback:** Sonnet nach Freigabe

### Aufgaben

- `requireUser()`;
- `requireRole()`;
- `requirePermission()`;
- Admin-/Lizenznehmer-Trennung;
- direkte URL- und API-Prüfungen;
- `401` und `403` unterscheiden;
- Rollenmatrix aus der Doku als Testfälle umsetzen.

### Tor B13

Kein geschützter API-Handler funktioniert ohne Auth- und Permission-Guard.

---

## B14 – Tenant- und Datenraum-Modell

**Verantwortlicher:** Fable  
**Review:** Gemini

### Aufgaben

- `Tenant`, `TenantMembership`, `DataSpace` ergänzen;
- Ownership für Posteingang, Aufgaben, Projekte, Chats, Wissen, Ablage, Output und Audit definieren;
- Tenant-Filter im Service-Layer erzwingen;
- Cross-Tenant-Tests schreiben;
- Backfill bestehender Testdaten planen.

### Tor B14

Ein Nutzer aus Tenant A kann keine Daten von Tenant B lesen oder verändern – weder über UI noch API.

---

## B15 – PostgreSQL und Migrationen

**Verantwortlicher:** Fable oder Claude Code nach B10  
**Review:** Gemini

### Aufgaben

- PostgreSQL-Staging einrichten;
- Prisma-Schema prüfen und anpassen;
- Migrationen gegen Staging testen;
- keine Migration ohne Backup/Snapshot;
- Rollback- oder Restore-Plan dokumentieren;
- SQLite klar als lokale Ausnahme markieren.

### Tor B15

Migration und Datenzugriff funktionieren in Staging ohne Datenverlust.

---

## B16 – Ablage und Object Storage

**Verantwortlicher:** Sonnet  
**Review:** Fable für Tenant-/Security-Scope

### Aufgaben

- Object-Storage-Entscheidung umsetzen;
- Datei-Metadaten von Dateiinhalt trennen;
- Tenant/DataSpace/Object-Key speichern;
- Upload-Limits und erlaubte Dateitypen definieren;
- Zugriff auf Dateien serverseitig prüfen.

### Tor B16

Kein Nutzer kann Dateien eines anderen Tenants über ID, Pfad oder direkte URL abrufen.

---

## B17 – Audit und Observability

**Verantwortlicher:** Sonnet  
**Review:** Fable für Sicherheitsereignisse

### Aufgaben

- Correlation-ID einführen;
- Auth-, Policy-, Tool-, KI-, DLP- und Exportereignisse protokollieren;
- Secrets und sensible Inhalte redigieren;
- Evidence Record für KI-/Tool-Läufe definieren;
- Logs und Auditdaten getrennt behandeln.

### Tor B17

Jede kritische Aktion ist nachvollziehbar, ohne Secrets oder unnötige sensible Inhalte zu speichern.

---

## B18 – Backup, Restore und Runbooks

**Verantwortlicher:** Sonnet / Admin entscheidet Zielwerte

### Aufgaben

- RPO/RTO festlegen;
- PostgreSQL-Backup erstellen;
- Object-Storage-Backup planen;
- Restore-Test durchführen;
- Deployment-, Rollback- und Notfall-Runbooks schreiben.

### Tor B18

Eine Testumgebung kann aus dem Backup erfolgreich wiederhergestellt werden.

---

## B19 – Review und Gate Phase B

**Verantwortlicher:** Gemini kontrolliert; Admin gibt frei

### Prüfung

- Login
- Guards
- Tenant-Scope
- PostgreSQL
- Ablage
- Audit
- Backup/Restore
- CI
- Dokumentation

### Tor B19

Phase B ist bestanden, wenn ein interner, geschützter Testbetrieb mit Testdaten möglich ist.

---

# Phase C – Staging und Pilot

## B20 – Staging mit Testdaten

**Verantwortlicher:** Claude Code / Sonnet  
**Kontrolle:** Gemini

### Aufgaben

- Staging deployen;
- ausschließlich synthetische Testdaten verwenden;
- Test-Tenants und Testrollen anlegen;
- zentrale Workflows durchführen;
- Fehler und Logs prüfen.

### Tor C20

Staging ist reproduzierbar deploybar und verwendet keine echten sensiblen Produktivdaten.

---

## B21 – Pilotvorbereitung

**Verantwortlicher:** Admin / Sonnet

### Aufgaben

- Pilotumfang festlegen;
- erlaubte Nutzer und Rollen festlegen;
- Support- und Rollback-Prozess definieren;
- Datenschutz- und KI-Anbieterentscheidung dokumentieren;
- Pilot-Testfälle und Abbruchkriterien definieren.

### Tor C21

Pilotfreigabe mit klarer Nutzergruppe, Datenbegrenzung und Rückfallplan.

---

## B22 – Kontrollierter Pilot

**Verantwortlicher:** Admin / Claude Code
**Kontrolle:** Gemini

### Aufgaben

- Pilot mit begrenzten Nutzern;
- tägliche Fehler- und Sicherheitskontrolle;
- Kosten und KI-Aufrufe beobachten;
- Benutzerfeedback dokumentieren;
- keine unkontrollierte Funktionsausweitung.

### Tor C22

Pilot ist erfolgreich, wenn keine kritischen Sicherheits-, Datenverlust- oder Tenant-Isolationsfehler auftreten.

---

# Phase D – KI-Sicherheit und produktive Enforcement-Schichten

## B30 – Modellaufruf-Gate

**Verantwortlicher:** Fable  
**Review:** Gemini

### Aufgaben

- zentralen KI-Service definieren;
- Modellwahl und Provider-Zugriff kapseln;
- Kontextpaket mit `system`, `instruction` und `data` trennen;
- Prompt- und Retrieval-Evidence speichern;
- Input- und Output-Gate definieren;
- Retry/Fallback kontrollieren.

### Tor D30

Kein Modellaufruf umgeht den zentralen KI-Service und keine Datenklasse wird ungeprüft an den Provider gesendet.

---

## B31 – Policy Engine

**Verantwortlicher:** Fable  
**Fallback:** Sonnet nach Admin-Freigabe

### Aufgaben

- `ALLOW`, `DENY`, `REVIEW` definieren;
- Fail-Closed bei Timeout oder Ausfall;
- Enforcement Points für Auth, Retrieval, Tools und Export;
- Policy-Entscheidungen auditieren;
- Policy-Tests schreiben.

### Tor D31

Ein Policy-Ausfall erlaubt keine geschützte Aktion.

---

## B32 – Tool Gateway und Sandbox

**Verantwortlicher:** Fable  
**Review:** Gemini

### Aufgaben

- zentrales Tool Gateway;
- Allowlist;
- Eingabevalidierung;
- Tenant-/Rollenprüfung;
- Sandbox-Adapter;
- Audit vor und nach Ausführung;
- direkte Prisma-Zugriffe aus Werkzeugdefinitionen entfernen.

### Tor D32

Jeder Tool-Aufruf läuft über Gateway, Policy, Sandbox und Audit. Direkte Umgehungen schlagen im Test fehl.

---

## B33 – DLP, Secret-Management und Quarantäne

**Verantwortlicher:** Fable  
**Review:** Gemini

### Aufgaben

- Datenklassen definieren;
- `Niemals Extern` erzwingen;
- Secret-Manager oder sichere Secret-Quelle anschließen;
- Log- und Prompt-Redaction;
- Prompt-Injection-Erkennung;
- Quarantäne für verdächtige Inhalte;
- DLP vor Connector- und Exportaktionen.

### Tor D33

- kein Secret in Logs, Prompts oder Responses;
- verbotene Exporte werden blockiert;
- verdächtige Inhalte werden auditierbar quarantänisiert.

---

## B34 – UI-Trennung und Routen-Schutz

**Verantwortlicher:** Sonnet  
**Review:** Fable

### Aufgaben

- Admin-Routen unter `/admin/*` bündeln oder streng schützen;
- Lizenznehmer-UI ohne interne Agentencodes und Prozess-IDs;
- Sidebar gemäß finaler Doku aktualisieren;
- `/erp` entfernen, wenn die finale Entscheidung bestätigt ist;
- Rollenabhängige Response-DTOs verwenden.

### Tor D34

Kein Lizenznehmer erreicht Admin-UI oder interne APIs per direkter URL. Die UI-Spezifikation ist nachweisbar umgesetzt.

---

## B35 – CI, Traceability und Produktionsfreigabe

**Verantwortlicher:** Sonnet / Claude Code  
**Kontrolle:** Gemini / Fable für Security-Review

### CI muss prüfen

```text
Lint
Typecheck
Unit-Tests
Integrationstests
E2E-Smoke-Tests
Prisma-Validierung
Migration-Check
Build
Security-Tests
Tenant-Isolation
```

### Traceability

Jeder kritische Punkt muss verknüpft sein:

```text
Doku
  -> Gap-ID
  -> Ticket
  -> Codepfad
  -> Test-ID
  -> Status
```

### Tor D35

Produktive Freigabe erst, wenn:

- Phase A bis D bestanden ist;
- alle P0-Gaps geschlossen oder ausdrücklich vom Admin akzeptiert sind;
- Backup und Restore getestet sind;
- Tenant-Isolation nachgewiesen ist;
- Security-Review dokumentiert ist;
- Gemini-Prüfbericht vorliegt;
- Admin die Freigabe erteilt.

---

# 2. Google-Drive-Arbeitsablage

Google Drive wird für Übergaben und Prüfberichte verwendet.

```text
Q7_Arbeitsablage/
  00_Arbeitsplan/
  01_Backups/
  02_Inventur/
  03_Freigaben/
  04_Claude_Code/
    B00/
    B01/
    B03/
  05_Gemini_Pruefungen/
    B00/
    B01/
    B03/
  06_Release_Reports/
```

Jeder Blockbericht enthält:

```text
Block-ID
Repository
Commit-SHA
Bearbeiter/Modell
Änderungsübersicht
Tests und Ergebnisse
Offene Punkte
Risiken
Empfehlung: FREIGABE / NACHARBEIT / STOPP
```

Gemini darf keine Aufgabe an Claude Code weitergeben, wenn:

- der Blockbericht fehlt;
- Commit-SHA oder Repository fehlen;
- Tests nicht dokumentiert sind;
- ein kritisches Risiko offen ist;
- eine Admin-Entscheidung fehlt.

---

# 3. Standard-Prompt für Claude Code

```text
Arbeite ausschließlich an Block <BLOCK-ID> des Dokuments Q7_Arbeitsplan_Bloecke_FINAL.md.

Repository: <OWNER>/<REPO>
Erlaubter Umfang: <KONKRETE DATEIEN ODER AUFGABEN>
Nicht erlaubt: <DATEIEN, AKTIONEN ODER LÖSCHUNGEN>

Regeln:
- Keine Änderungen außerhalb des Blockumfangs.
- Nichts endgültig löschen, sofern es nicht ausdrücklich freigegeben ist.
- Vor jeder Änderung aktuellen Zustand prüfen.
- Nach der Änderung Typecheck, Lint, Build und blockbezogene Tests ausführen.
- Commit-SHA und geänderte Dateien dokumentieren.
- Bei Unsicherheit STOPPEN und eine Entscheidung anfordern.

Ergebnisdateien:
- Blockbericht
- Testbericht
- Liste offener Punkte
- Empfehlung für Gemini und Admin
```

---

# 4. Standard-Prompt für Gemini

```text
Prüfe den Block <BLOCK-ID> aus Q7_Arbeitsplan_Bloecke_FINAL.md.

Prüfe ausschließlich:
1. Wurde der erlaubte Umfang eingehalten?
2. Sind Änderungen nachvollziehbar?
3. Sind Build, Typecheck und Tests dokumentiert?
4. Wurden geschützte Dateien unzulässig verändert?
5. Entsprechen die Änderungen der aktiven Q7-Dokumentation?
6. Gibt es Sicherheits-, Daten- oder Tenant-Risiken?
7. Darf der nächste Block beginnen?

Ergebnisformat:
- Status: FREIGABE / NACHSERARBEIT / STOPP
- Befunde mit Priorität P0/P1/P2
- konkrete nächste Aufgaben
- betroffene Dateien
- benötigte Admin-Entscheidungen
- Begründung anhand des Arbeitsplans
```

---

# 5. Schlussentscheidung

Der Plan folgt bewusst dieser Reihenfolge:

```text
Sichern
  -> Inventarisieren
  -> Freigeben
  -> Aufräumen
  -> Baseline testen
  -> Entscheidungen treffen
  -> Auth und Tenant-Scope bauen
  -> Staging und Pilot
  -> Policy, Gateway, DLP und UI-Trennung
  -> CI und Produktionsfreigabe
```

Die wichtigste Regel lautet:

> Kein neuer Funktionsausbau auf einem ungeprüften oder unsicheren Fundament.

Q7 wird nicht komplett neu geschrieben. Bestehender Code wird zuerst sicher inventarisiert, dann kontrolliert bereinigt, anschließend getestet und danach blockweise zu einer produktionsfähigen Architektur weiterentwickelt.
