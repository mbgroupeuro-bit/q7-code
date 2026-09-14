// lib/prisma.ts
// Einziger, zentraler Prisma-Client fürs gesamte Projekt. Vorher gab es dasselbe
// Instanziierungs-Muster 3x dupliziert in einzelnen API-Routen (aus-kanal,
// aufgabe-chat, [id]) — jede mit eigener globalForPrisma-Variable und der
// zusätzlichen, undokumentierten Q7_AGENTEN_DB_URL-Fallback-Option. Das barg
// das Risiko, dass verschiedene Routen versehentlich gegen unterschiedliche
// Datenbanken laufen, falls Q7_AGENTEN_DB_URL irgendwo abweichend gesetzt wird.
//
// Jetzt: EINE Quelle der Wahrheit, DATABASE_URL aus schema.prisma / prisma.config.ts.
// Q7_AGENTEN_DB_URL absichtlich entfernt — falls es doch gebraucht wird (z.B. für
// einen zweiten Datenbank-Zugriff), bitte zuerst klären, wofür, statt es fallback-
// artig weiterzuführen.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
