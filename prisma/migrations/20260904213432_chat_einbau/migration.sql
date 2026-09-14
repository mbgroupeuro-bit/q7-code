-- CreateTable
CREATE TABLE "chat_kanaele" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bereich_id" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_kanaele_bereich_id_fkey" FOREIGN KEY ("bereich_id") REFERENCES "bereiche" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_nachrichten" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "absender_id" TEXT NOT NULL,
    "kanal_id" TEXT,
    "empfaenger_id" TEXT,
    "text" TEXT NOT NULL,
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_nachrichten_absender_id_fkey" FOREIGN KEY ("absender_id") REFERENCES "mitarbeiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "chat_nachrichten_kanal_id_fkey" FOREIGN KEY ("kanal_id") REFERENCES "chat_kanaele" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "chat_nachrichten_empfaenger_id_fkey" FOREIGN KEY ("empfaenger_id") REFERENCES "mitarbeiter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_anhaenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nachricht_id" TEXT NOT NULL,
    "dateiname" TEXT NOT NULL,
    "pfad" TEXT NOT NULL,
    "dateityp" TEXT NOT NULL,
    "groesse_bytes" INTEGER NOT NULL,
    CONSTRAINT "chat_anhaenge_nachricht_id_fkey" FOREIGN KEY ("nachricht_id") REFERENCES "chat_nachrichten" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_kanaele_bereich_id_key" ON "chat_kanaele"("bereich_id");

-- CreateIndex
CREATE INDEX "chat_nachrichten_kanal_id_idx" ON "chat_nachrichten"("kanal_id");

-- CreateIndex
CREATE INDEX "chat_nachrichten_empfaenger_id_idx" ON "chat_nachrichten"("empfaenger_id");
