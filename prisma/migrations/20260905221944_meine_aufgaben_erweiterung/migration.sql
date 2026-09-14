-- AlterTable
ALTER TABLE "meine_aufgaben" ADD COLUMN "nummer" INTEGER;
ALTER TABLE "meine_aufgaben" ADD COLUMN "tags" TEXT;

-- CreateTable
CREATE TABLE "meine_aufgabe_anhang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meineAufgabe_id" TEXT NOT NULL,
    "ablage_id" TEXT NOT NULL,
    "hinzugefuegt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meine_aufgabe_anhang_meineAufgabe_id_fkey" FOREIGN KEY ("meineAufgabe_id") REFERENCES "meine_aufgaben" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "meine_aufgabe_anhang_meineAufgabe_id_idx" ON "meine_aufgabe_anhang"("meineAufgabe_id");
