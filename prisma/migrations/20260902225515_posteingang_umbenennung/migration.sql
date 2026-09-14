PRAGMA foreign_keys=OFF;

-- DropIndex (alte Namen, werden unten mit neuen Namen neu angelegt)
DROP INDEX "aufgabe_chat_aufgabe_id_idx";
DROP INDEX "aufgaben_kanal_zeitstempel_idx";
DROP INDEX "aufgaben_status_idx";

-- aufgaben -> posteingang umbenennen (alle 22 Zeilen bleiben erhalten)
ALTER TABLE "aufgaben" RENAME TO "posteingang";

-- neue Spalten ergänzen (bei bestehenden Zeilen zunächst NULL)
ALTER TABLE "posteingang" ADD COLUMN "prioritaet" TEXT;
ALTER TABLE "posteingang" ADD COLUMN "bereich_id" TEXT;
ALTER TABLE "posteingang" ADD COLUMN "verantwortlich_id" TEXT;
ALTER TABLE "posteingang" ADD COLUMN "ki_vorschlag_status" TEXT;
ALTER TABLE "posteingang" ADD COLUMN "ki_vorschlag_prioritaet" TEXT;
ALTER TABLE "posteingang" ADD COLUMN "ki_vorschlag_bereich_id" TEXT;
ALTER TABLE "posteingang" ADD COLUMN "ki_vorschlag_verantwortlich_id" TEXT;

-- aufgabe_chat -> posteingang_chat umbenennen (alle Zeilen bleiben erhalten)
ALTER TABLE "aufgabe_chat" RENAME TO "posteingang_chat";
ALTER TABLE "posteingang_chat" RENAME COLUMN "aufgabe_id" TO "posteingang_id";

-- CreateTable (komplett neue Tabellen, keine alten Daten)
CREATE TABLE "bereiche" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "mitarbeiter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bereich_id" TEXT NOT NULL,
    "sieht_alle_bereiche" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mitarbeiter_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "posteingang_verlauf" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "posteingang_id" TEXT NOT NULL,
    "akteur" TEXT NOT NULL,
    "akteur_name" TEXT,
    "aktion" TEXT NOT NULL,
    "alter_wert" TEXT,
    "neuer_wert" TEXT,
    "kommentar" TEXT,
    "zeitstempel" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "posteingang_verlauf_posteingang_id_fkey" FOREIGN KEY ("posteingang_id") REFERENCES "posteingang" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables: meine_aufgaben (aufgabe_id -> posteingang_id, Werte bleiben erhalten)
PRAGMA defer_foreign_keys=ON;
CREATE TABLE "new_meine_aufgaben" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "zugewiesen_an" TEXT NOT NULL DEFAULT 'admin',
    "quelle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erledigt_am" DATETIME,
    "faelligkeit" DATETIME,
    "posteingang_id" TEXT,
    CONSTRAINT "meine_aufgaben_posteingang_id_fkey" FOREIGN KEY ("posteingang_id") REFERENCES "posteingang" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_meine_aufgaben" ("id", "titel", "beschreibung", "zugewiesen_an", "quelle", "status", "erstellt_am", "erledigt_am", "faelligkeit", "posteingang_id")
SELECT "id", "titel", "beschreibung", "zugewiesen_an", "quelle", "status", "erstellt_am", "erledigt_am", "faelligkeit", "aufgabe_id" FROM "meine_aufgaben";
DROP TABLE "meine_aufgaben";
ALTER TABLE "new_meine_aufgaben" RENAME TO "meine_aufgaben";
CREATE INDEX "meine_aufgaben_zugewiesen_an_status_idx" ON "meine_aufgaben"("zugewiesen_an", "status");
CREATE INDEX "meine_aufgaben_faelligkeit_idx" ON "meine_aufgaben"("faelligkeit");
CREATE INDEX "meine_aufgaben_posteingang_id_idx" ON "meine_aufgaben"("posteingang_id");
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "bereiche_name_key" ON "bereiche"("name");
CREATE INDEX "mitarbeiter_bereich_id_idx" ON "mitarbeiter"("bereich_id");
CREATE INDEX "posteingang_status_idx" ON "posteingang"("status");
CREATE INDEX "posteingang_kanal_zeitstempel_idx" ON "posteingang"("kanal", "zeitstempel");
CREATE INDEX "posteingang_bereich_id_idx" ON "posteingang"("bereich_id");
CREATE INDEX "posteingang_verantwortlich_id_idx" ON "posteingang"("verantwortlich_id");
CREATE INDEX "posteingang_chat_posteingang_id_idx" ON "posteingang_chat"("posteingang_id");
CREATE INDEX "posteingang_verlauf_posteingang_id_idx" ON "posteingang_verlauf"("posteingang_id");

PRAGMA foreign_keys=ON;
