-- CreateTable
CREATE TABLE "meine_aufgaben" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "zugewiesen_an" TEXT NOT NULL DEFAULT 'admin',
    "quelle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offen',
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "erledigt_am" DATETIME,
    "aufgabe_id" TEXT,
    CONSTRAINT "meine_aufgaben_aufgabe_id_fkey" FOREIGN KEY ("aufgabe_id") REFERENCES "aufgaben" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
