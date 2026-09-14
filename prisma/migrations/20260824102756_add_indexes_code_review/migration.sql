-- AlterTable
ALTER TABLE "meine_aufgaben" ADD COLUMN "faelligkeit" DATETIME;

-- CreateTable
CREATE TABLE "termine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "start" DATETIME NOT NULL,
    "ende" DATETIME NOT NULL,
    "farbe" TEXT NOT NULL DEFAULT 'blau',
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "termine_start_ende_idx" ON "termine"("start", "ende");

-- CreateIndex
CREATE INDEX "aufgabe_chat_aufgabe_id_idx" ON "aufgabe_chat"("aufgabe_id");

-- CreateIndex
CREATE INDEX "aufgaben_status_idx" ON "aufgaben"("status");

-- CreateIndex
CREATE INDEX "aufgaben_kanal_zeitstempel_idx" ON "aufgaben"("kanal", "zeitstempel");

-- CreateIndex
CREATE INDEX "meine_aufgaben_zugewiesen_an_status_idx" ON "meine_aufgaben"("zugewiesen_an", "status");

-- CreateIndex
CREATE INDEX "meine_aufgaben_faelligkeit_idx" ON "meine_aufgaben"("faelligkeit");

-- CreateIndex
CREATE INDEX "meine_aufgaben_aufgabe_id_idx" ON "meine_aufgaben"("aufgabe_id");
