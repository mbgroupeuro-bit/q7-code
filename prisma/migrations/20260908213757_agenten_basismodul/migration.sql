-- CreateTable
CREATE TABLE "agent_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL DEFAULT 'Neuer Chat',
    "titel_status" TEXT NOT NULL DEFAULT 'pending',
    "agent" TEXT NOT NULL,
    "bereich_id" TEXT,
    "mitarbeiter_id" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "agent_chats_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agent_chats_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_chat_nachrichten" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agent_chat_id" TEXT NOT NULL,
    "rolle" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "usage_json" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_chat_nachrichten_agent_chat_id_fkey" FOREIGN KEY ("agent_chat_id") REFERENCES "agent_chats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_aktionen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "werkzeug_id" TEXT,
    "typ" TEXT NOT NULL,
    "eingabe_daten" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'wartet_auf_freigabe',
    "mitarbeiter_id" TEXT NOT NULL,
    "bereich_id" TEXT,
    "agent_chat_id" TEXT,
    "ergebnis_text" TEXT,
    "fehlermeldung" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entschieden_am" DATETIME,
    "entschieden_von" TEXT,
    "ausgefuehrt_am" DATETIME,
    CONSTRAINT "agent_aktionen_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_aktionen_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agent_aktionen_agent_chat_id_fkey" FOREIGN KEY ("agent_chat_id") REFERENCES "agent_chats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_delegation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stufe" TEXT NOT NULL DEFAULT 'keine',
    "einzel_werkzeuge" TEXT,
    "geaendert_am" DATETIME NOT NULL,
    "geaendert_von" TEXT
);

-- CreateTable
CREATE TABLE "agent_cron_laeufe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routine_id" TEXT NOT NULL,
    "mitarbeiter_id" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'erfolgreich',
    "ergebnis_text" TEXT,
    "fehlermeldung" TEXT,
    "agent_chat_id" TEXT,
    "agent_chat_nachricht_id" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_cron_laeufe_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "agent_routinen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_cron_laeufe_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_cron_laeufe_agent_chat_id_fkey" FOREIGN KEY ("agent_chat_id") REFERENCES "agent_chats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agent_routinen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitarbeiter_id" TEXT NOT NULL,
    "typ" TEXT NOT NULL DEFAULT 'arbeitsplan',
    "uhrzeit" TEXT NOT NULL,
    "wochentage" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "letzter_lauf_am" DATETIME,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geaendert_am" DATETIME NOT NULL,
    CONSTRAINT "agent_routinen_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "nummer" INTEGER,
    "tags" TEXT,
    "prioritaet" TEXT,
    "farbe" TEXT,
    "absender" TEXT,
    "kontakt" TEXT,
    "original_nachricht" TEXT,
    "projekt_id" TEXT,
    "mitarbeiter_id" TEXT,
    "posteingang_id" TEXT,
    CONSTRAINT "meine_aufgaben_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "meine_aufgaben_posteingang_id_fkey" FOREIGN KEY ("posteingang_id") REFERENCES "posteingang" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_meine_aufgaben" ("absender", "beschreibung", "erledigt_am", "erstellt_am", "faelligkeit", "farbe", "id", "kontakt", "nummer", "original_nachricht", "posteingang_id", "prioritaet", "projekt_id", "quelle", "status", "tags", "titel", "zugewiesen_an") SELECT "absender", "beschreibung", "erledigt_am", "erstellt_am", "faelligkeit", "farbe", "id", "kontakt", "nummer", "original_nachricht", "posteingang_id", "prioritaet", "projekt_id", "quelle", "status", "tags", "titel", "zugewiesen_an" FROM "meine_aufgaben";
DROP TABLE "meine_aufgaben";
ALTER TABLE "new_meine_aufgaben" RENAME TO "meine_aufgaben";
CREATE INDEX "meine_aufgaben_zugewiesen_an_status_idx" ON "meine_aufgaben"("zugewiesen_an", "status");
CREATE INDEX "meine_aufgaben_faelligkeit_idx" ON "meine_aufgaben"("faelligkeit");
CREATE INDEX "meine_aufgaben_posteingang_id_idx" ON "meine_aufgaben"("posteingang_id");
CREATE INDEX "meine_aufgaben_projekt_id_idx" ON "meine_aufgaben"("projekt_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "agent_chats_bereich_id_idx" ON "agent_chats"("bereich_id");

-- CreateIndex
CREATE INDEX "agent_chats_mitarbeiter_id_idx" ON "agent_chats"("mitarbeiter_id");

-- CreateIndex
CREATE INDEX "agent_chat_nachrichten_agent_chat_id_idx" ON "agent_chat_nachrichten"("agent_chat_id");

-- CreateIndex
CREATE INDEX "agent_aktionen_status_idx" ON "agent_aktionen"("status");

-- CreateIndex
CREATE INDEX "agent_aktionen_mitarbeiter_id_idx" ON "agent_aktionen"("mitarbeiter_id");

-- CreateIndex
CREATE INDEX "agent_aktionen_bereich_id_idx" ON "agent_aktionen"("bereich_id");

-- CreateIndex
CREATE INDEX "agent_aktionen_agent_chat_id_idx" ON "agent_aktionen"("agent_chat_id");

-- CreateIndex
CREATE INDEX "agent_cron_laeufe_datum_idx" ON "agent_cron_laeufe"("datum");

-- CreateIndex
CREATE INDEX "agent_cron_laeufe_routine_id_idx" ON "agent_cron_laeufe"("routine_id");

-- CreateIndex
CREATE INDEX "agent_cron_laeufe_mitarbeiter_id_idx" ON "agent_cron_laeufe"("mitarbeiter_id");

-- CreateIndex
CREATE INDEX "agent_cron_laeufe_agent_chat_id_idx" ON "agent_cron_laeufe"("agent_chat_id");

-- CreateIndex
CREATE INDEX "agent_routinen_mitarbeiter_id_idx" ON "agent_routinen"("mitarbeiter_id");

-- CreateIndex
CREATE INDEX "agent_routinen_aktiv_idx" ON "agent_routinen"("aktiv");
