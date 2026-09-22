# CLAUDE.md — Q7 Betriebssystem (a_Q7-code)

Verhaltensrichtlinien für Claude Code in diesem Repo. Verhaltensteil basiert auf den Karpathy-Guidelines (forrestchang/andrej-karpathy-skills), ergänzt um bindende Q7-Projektregeln. Bei Konflikt: Q7-Projektregeln haben Vorrang.

**Trade-off:** Diese Regeln priorisieren Sorgfalt vor Geschwindigkeit. Bei trivialen Aufgaben (Tippfehler, Ein-Zeilen-Fix) reicht gesunder Menschenverstand.

---

## 1. Think Before Coding — keine stillen Annahmen

- Vor der Implementierung: Annahmen explizit benennen, nicht raten.
- Bei Unklarheit: nachfragen statt stillschweigend eine plausible Interpretation wählen.
- Bei mehreren Lösungswegen: kurz benennen, warum einer gewählt wird (siehe bis1 unten).
- Nie automatisch "korrigieren", was nicht explizit verlangt wurde. Widersprüche zwischen Dateien/Dokumenten offen benennen statt still aufzulösen.

## 2. Simplicity First — keine Überkonstruktion

- Kein spekulatives Feature, keine ungefragte Flexibilität, keine Abstraktion "für später".
- YAGNI-Leiter vor jeder neuen Lösung, in dieser Reihenfolge:
  1. Braucht es das überhaupt?
  2. Existiert es schon im Repo?
  3. Löst Stdlib / Next.js / Prisma es nativ?
  4. Reicht eine bereits installierte Dependency?
  5. Reicht eine Zeile?
  6. Erst dann: die minimale Lösung, die funktioniert.
- Ausnahme, die NIE eingespart wird: Sicherheits-Checks (SEC-GATE), Validierung, Fehler-/Datenverlust-Handling, Barrierefreiheit.

## 3. Surgical Changes — nur anfassen, was verlangt wurde

- Nur die explizit angefragte Datei/Stelle ändern.
- Keine Drive-by-Refactorings, keine "während ich eh dabei war"-Aufräumarbeiten ohne Rückfrage.
- Kommentare oder Code, die nicht verstanden werden, nicht als Nebeneffekt löschen oder verändern.

## 4. Goal-Driven Execution

- Erfolgskriterien nennen statt jeden Einzelschritt vorzuschreiben — Ergebnis vor Abschluss dagegen prüfen.
- Fertigstellung nur nach Beleg behaupten: Verzeichnis-Listing, Testlauf-Output oder Build-Ergebnis. Unbelegte "erledigt"-Meldungen zählen nicht.

---

## Q7-Projektregeln (bindend)

**KI-Aufrufe**
- `rufeKIAn()` in `lib/rufeKIAn.ts` ist die einzige erlaubte Abstraktion für Modellaufrufe. Kein direkter oder verstreuter OpenRouter-Call irgendwo im Code — vor jedem KI-Integrationsschritt prüfen.

**Codebase-Konventionen**
- Prisma-Felder: snake_case mit `@map`; cuid-IDs; `@@index` auf FK-Feldern; `@updatedAt` für Timestamps.
- Ablage-Pattern: physische Dateien laufen über `lib/ablage.ts`, die DB speichert ausschließlich die `ablage_id`-Referenz.
- Testskripte laufen vom Projekt-Root und müssen selbstlöschend sein — alle Testdaten nach Ausführung bereinigen.
- Background-Jobs (z. B. `ProzessRegisterEintrag`, `ProjektErinnerung`) brauchen `status`- und `fehlermeldung`-Felder nach dem `AgentCronLauf`-Muster, um stille Fehlschläge zu verhindern.

**Windows / Prisma**
- Vor `prisma generate`: alle Node-Prozesse killen (EPERM-Konflikt durch Datei-Locks).
- Vor jeder Migration: Git-Commit. Migration-SQL immer zuerst mit `--create-only` reviewen.
- Datei-I/O mit Sonderzeichen (Umlaute): `[System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)` und `[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))` verwenden — nicht `Get-Content`/`Set-Content -Encoding utf8`, sonst Mojibake-Korruption.
- Generische TypeScript-Typen (`Partial<Pick<...>>`) einzeilig schreiben, kein freistehendes `<` am Zeilenende — geht beim Kopieren aus Chat-Codeblöcken sonst verloren.

**Diagnose- und Debugging-Runden**
- Alle Befehle einer Runde in EIN PowerShell-Skript bündeln, das in EINE Output-Datei schreibt (`Out-File -Append`). Kein "ein Befehl pro Nachricht".

---

## Zusammenarbeit — Checkpoint-Prinzip (bis1)

- Ein logischer Architekturschritt wird bestätigt, bevor der nächste beginnt.
- Bei offenen Entscheidungspunkten: drei gelabelte Lösungsoptionen präsentieren, bevorzugte Wahl mit Begründung nennen, dann auf Freigabe warten.
- Keine automatischen Korrekturen ohne Rückfrage.
- Jede ausgelieferte Datei mit explizitem Speicherpfad versehen: `Herunterladen, speichern unter: [exakter Pfad]`.

---

## Optional: Ponytail (aktive Code-Minimierung)

Dieses `CLAUDE.md` deckt das Verhaltensprinzip ab. Für zusätzliche, messbare Code-Reduktion via YAGNI-Leiter als aktives Plugin (Node-Lifecycle-Hooks, kein Konflikt mit obigen Regeln):

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Sicherheits-, Validierungs- und Datenverlust-Logik bleiben laut Ponytail-Projekt davon ausdrücklich unberührt.
