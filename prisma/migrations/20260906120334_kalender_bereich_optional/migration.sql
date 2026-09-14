-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_termine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "start" DATETIME NOT NULL,
    "ende" DATETIME NOT NULL,
    "farbe" TEXT NOT NULL DEFAULT 'blau',
    "bereich_id" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "termine_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_termine" ("beschreibung", "ende", "erstellt_am", "farbe", "id", "start", "titel") SELECT "beschreibung", "ende", "erstellt_am", "farbe", "id", "start", "titel" FROM "termine";
DROP TABLE "termine";
ALTER TABLE "new_termine" RENAME TO "termine";
CREATE INDEX "termine_start_ende_idx" ON "termine"("start", "ende");
CREATE INDEX "termine_bereich_id_idx" ON "termine"("bereich_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
