-- CreateTable
CREATE TABLE "aufgaben" (
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
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "aufgabe_chat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aufgabe_id" TEXT NOT NULL,
    "absender" TEXT NOT NULL,
    "nachricht" TEXT NOT NULL,
    "zeitstempel" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aufgabe_chat_aufgabe_id_fkey" FOREIGN KEY ("aufgabe_id") REFERENCES "aufgaben" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
