-- AlterTable
ALTER TABLE "meine_aufgaben" ADD COLUMN "absender" TEXT;
ALTER TABLE "meine_aufgaben" ADD COLUMN "farbe" TEXT;
ALTER TABLE "meine_aufgaben" ADD COLUMN "kontakt" TEXT;
ALTER TABLE "meine_aufgaben" ADD COLUMN "original_nachricht" TEXT;
ALTER TABLE "meine_aufgaben" ADD COLUMN "prioritaet" TEXT;
ALTER TABLE "meine_aufgaben" ADD COLUMN "projekt_id" TEXT;

-- CreateTable
CREATE TABLE "teilaufgaben" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meineAufgabe_id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erledigt_am" DATETIME,
    CONSTRAINT "teilaufgaben_meineAufgabe_id_fkey" FOREIGN KEY ("meineAufgabe_id") REFERENCES "meine_aufgaben" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meine_aufgabe_verlauf" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "meineAufgabe_id" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "erstellt_von" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meine_aufgabe_verlauf_meineAufgabe_id_fkey" FOREIGN KEY ("meineAufgabe_id") REFERENCES "meine_aufgaben" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "teilaufgaben_meineAufgabe_id_idx" ON "teilaufgaben"("meineAufgabe_id");

-- CreateIndex
CREATE INDEX "meine_aufgabe_verlauf_meineAufgabe_id_erstellt_am_idx" ON "meine_aufgabe_verlauf"("meineAufgabe_id", "erstellt_am");

-- CreateIndex
CREATE INDEX "meine_aufgaben_projekt_id_idx" ON "meine_aufgaben"("projekt_id");
