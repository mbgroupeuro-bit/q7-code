-- CreateTable
CREATE TABLE "projekte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mitarbeiter_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "beschreibung" TEXT,
    "angeheftet" BOOLEAN NOT NULL DEFAULT false,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "projekte_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projekt_kontext_dateien" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projekt_id" TEXT NOT NULL,
    "ablage_id" TEXT NOT NULL,
    "hinzugefuegt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projekt_kontext_dateien_projekt_id_fkey" FOREIGN KEY ("projekt_id") REFERENCES "projekte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projekt_erinnerung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projekt_id" TEXT NOT NULL,
    "inhalt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "fehlermeldung" TEXT,
    "letzte_aktualisierung" DATETIME NOT NULL,
    CONSTRAINT "projekt_erinnerung_projekt_id_fkey" FOREIGN KEY ("projekt_id") REFERENCES "projekte" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agent_chats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL DEFAULT 'Neuer Chat',
    "titel_status" TEXT NOT NULL DEFAULT 'pending',
    "agent" TEXT NOT NULL,
    "bereich_id" TEXT,
    "mitarbeiter_id" TEXT NOT NULL,
    "projekt_id" TEXT,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL,
    CONSTRAINT "agent_chats_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "agent_chats_mitarbeiter_id_fkey" FOREIGN KEY ("mitarbeiter_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_chats_projekt_id_fkey" FOREIGN KEY ("projekt_id") REFERENCES "projekte" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_agent_chats" ("agent", "aktualisiert_am", "bereich_id", "erstellt_am", "id", "mitarbeiter_id", "titel", "titel_status") SELECT "agent", "aktualisiert_am", "bereich_id", "erstellt_am", "id", "mitarbeiter_id", "titel", "titel_status" FROM "agent_chats";
DROP TABLE "agent_chats";
ALTER TABLE "new_agent_chats" RENAME TO "agent_chats";
CREATE INDEX "agent_chats_bereich_id_idx" ON "agent_chats"("bereich_id");
CREATE INDEX "agent_chats_mitarbeiter_id_idx" ON "agent_chats"("mitarbeiter_id");
CREATE INDEX "agent_chats_projekt_id_idx" ON "agent_chats"("projekt_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "projekte_mitarbeiter_id_idx" ON "projekte"("mitarbeiter_id");

-- CreateIndex
CREATE INDEX "projekt_kontext_dateien_projekt_id_idx" ON "projekt_kontext_dateien"("projekt_id");

-- CreateIndex
CREATE UNIQUE INDEX "projekt_erinnerung_projekt_id_key" ON "projekt_erinnerung"("projekt_id");
