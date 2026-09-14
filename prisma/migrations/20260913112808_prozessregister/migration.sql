-- CreateTable
CREATE TABLE "ProzessRegisterEintrag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prozessId" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "zweckKurzbeschreibung" TEXT NOT NULL,
    "embeddingJson" TEXT,
    "embeddingStatus" TEXT NOT NULL DEFAULT 'ausstehend',
    "status" TEXT NOT NULL DEFAULT 'Entwurf',
    "dateipfad" TEXT,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aktualisiertAm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProzessRegisterEintrag_prozessId_key" ON "ProzessRegisterEintrag"("prozessId");

-- CreateIndex
CREATE INDEX "ProzessRegisterEintrag_status_idx" ON "ProzessRegisterEintrag"("status");

-- CreateIndex
CREATE INDEX "ProzessRegisterEintrag_embeddingStatus_idx" ON "ProzessRegisterEintrag"("embeddingStatus");
