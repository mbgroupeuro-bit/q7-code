-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_posteingang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kanal" TEXT NOT NULL,
    "absender" TEXT NOT NULL,
    "zeitstempel" DATETIME NOT NULL,
    "inhalt" TEXT NOT NULL,
    "anhaenge" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFEN',
    "anliegen_typ" TEXT,
    "ziel_agent" TEXT,
    "dringlichkeit" TEXT,
    "konfidenz" TEXT,
    "prioritaet" TEXT,
    "bereich_id" TEXT,
    "verantwortlich_id" TEXT,
    "ki_vorschlag_status" TEXT,
    "ki_vorschlag_prioritaet" TEXT,
    "ki_vorschlag_bereich_id" TEXT,
    "ki_vorschlag_verantwortlich_id" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "posteingang_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "posteingang_verantwortlich_id_fkey" FOREIGN KEY ("verantwortlich_id") REFERENCES "mitarbeiter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_posteingang" ("absender", "aktualisiert_am", "anhaenge", "anliegen_typ", "bereich_id", "dringlichkeit", "erstellt_am", "id", "inhalt", "kanal", "ki_vorschlag_bereich_id", "ki_vorschlag_prioritaet", "ki_vorschlag_status", "ki_vorschlag_verantwortlich_id", "konfidenz", "prioritaet", "status", "verantwortlich_id", "zeitstempel", "ziel_agent") SELECT "absender", "aktualisiert_am", "anhaenge", "anliegen_typ", "bereich_id", "dringlichkeit", "erstellt_am", "id", "inhalt", "kanal", "ki_vorschlag_bereich_id", "ki_vorschlag_prioritaet", "ki_vorschlag_status", "ki_vorschlag_verantwortlich_id", "konfidenz", "prioritaet", "status", "verantwortlich_id", "zeitstempel", "ziel_agent" FROM "posteingang";
DROP TABLE "posteingang";
ALTER TABLE "new_posteingang" RENAME TO "posteingang";
CREATE INDEX "posteingang_status_idx" ON "posteingang"("status");
CREATE INDEX "posteingang_kanal_zeitstempel_idx" ON "posteingang"("kanal", "zeitstempel");
CREATE INDEX "posteingang_bereich_id_idx" ON "posteingang"("bereich_id");
CREATE INDEX "posteingang_verantwortlich_id_idx" ON "posteingang"("verantwortlich_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
