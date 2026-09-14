/*
  Warnings:

  - Made the column `bereich_id` on table `termine` required. This step will fail if there are existing NULL values in that column.

*/
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
    "bereich_id" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "termine_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_termine" ("bereich_id", "beschreibung", "ende", "erstellt_am", "farbe", "id", "start", "titel") SELECT "bereich_id", "beschreibung", "ende", "erstellt_am", "farbe", "id", "start", "titel" FROM "termine";
DROP TABLE "termine";
ALTER TABLE "new_termine" RENAME TO "termine";
CREATE INDEX "termine_start_ende_idx" ON "termine"("start", "ende");
CREATE INDEX "termine_bereich_id_idx" ON "termine"("bereich_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
