-- CreateTable
CREATE TABLE "notizen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "kunde" TEXT,
    "projekt_id" TEXT,
    "tags" TEXT,
    "erstellt_von" TEXT NOT NULL DEFAULT 'admin',
    "erstellt_am" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiert_am" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "notizen_projekt_id_idx" ON "notizen"("projekt_id");
