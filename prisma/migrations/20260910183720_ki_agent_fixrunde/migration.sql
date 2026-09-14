-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agent_routinen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitarbeiter_id" TEXT NOT NULL,
    "typ" TEXT NOT NULL DEFAULT 'arbeitsplan',
    "anweisung" TEXT NOT NULL DEFAULT 'Erstelle einen priorisierten Arbeitsplan aus meinen offenen Aufgaben.',
    "uhrzeit" TEXT NOT NULL,
    "wochentage" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "letzter_lauf_am" DATETIME,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geaendert_am" DATETIME NOT NULL,
    CONSTRAINT "agent_routinen_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_agent_routinen" ("aktiv", "erstellt_am", "geaendert_am", "id", "letzter_lauf_am", "mitarbeiter_id", "typ", "uhrzeit", "wochentage") SELECT "aktiv", "erstellt_am", "geaendert_am", "id", "letzter_lauf_am", "mitarbeiter_id", "typ", "uhrzeit", "wochentage" FROM "agent_routinen";
DROP TABLE "agent_routinen";
ALTER TABLE "new_agent_routinen" RENAME TO "agent_routinen";
CREATE INDEX "agent_routinen_mitarbeiter_id_idx" ON "agent_routinen"("mitarbeiter_id");
CREATE INDEX "agent_routinen_aktiv_idx" ON "agent_routinen"("aktiv");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
