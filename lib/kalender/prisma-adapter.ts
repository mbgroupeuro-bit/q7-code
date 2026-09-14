// lib/kalender/prisma-adapter.ts
// Prisma-Adapter für Q7 (direkter Datenbankzugriff).
// Erfüllt das KalenderAdapter-Interface aus adapter-interface.ts.
// Neu 04.09.2026 — Kalender-Basismodul.

import { PrismaClient } from "@prisma/client";
import { KalenderAdapter } from "./adapter-interface";
import { Termin, NeuerTermin, Bereich } from "./typen";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    process.env.Q7_AGENTEN_DB_URL
      ? { datasources: { db: { url: process.env.Q7_AGENTEN_DB_URL } } }
      : undefined
  );
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

async function mitarbeiterLaden(mitarbeiterId: string) {
  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
  });
  if (!mitarbeiter) {
    throw new Error(`Mitarbeiter ${mitarbeiterId} nicht gefunden.`);
  }
  return mitarbeiter;
}

export const prismaKalenderAdapter: KalenderAdapter = {
  async getTermine(mitarbeiterId) {
    const mitarbeiter = await mitarbeiterLaden(mitarbeiterId);

    const termine = await prisma.termin.findMany({
      where: mitarbeiter.sieht_alle_bereiche
        ? {}
        : { bereich_id: mitarbeiter.bereich_id },
      orderBy: { start: "asc" },
      include: { bereich: true },
    });

    return termine.map((t) => ({
      id: t.id,
      titel: t.titel,
      beschreibung: t.beschreibung,
      start: t.start.toISOString(),
      ende: t.ende.toISOString(),
      farbe: t.farbe,
      bereich_id: t.bereich_id,
      bereich_name: t.bereich.name,
    }));
  },

  async createTermin(daten: NeuerTermin, mitarbeiterId: string): Promise<Termin> {
    const mitarbeiter = await mitarbeiterLaden(mitarbeiterId);

    // Bereich darf nur frei gewählt werden, wenn sieht_alle_bereiche = true.
    // Sonst wird der Bereich des Mitarbeiters erzwungen, unabhängig davon,
    // was das Formular schickt (Absicherung gegen manipulierte Requests).
    const bereichId = mitarbeiter.sieht_alle_bereiche
      ? daten.bereich_id
      : mitarbeiter.bereich_id;

    const neuerTermin = await prisma.termin.create({
      data: {
        titel: daten.titel.trim(),
        beschreibung: daten.beschreibung?.trim() || null,
        start: new Date(daten.start),
        ende: new Date(daten.ende),
        farbe: daten.farbe || "blau",
        bereich_id: bereichId,
      },
      include: { bereich: true },
    });

    return {
      id: neuerTermin.id,
      titel: neuerTermin.titel,
      beschreibung: neuerTermin.beschreibung,
      start: neuerTermin.start.toISOString(),
      ende: neuerTermin.ende.toISOString(),
      farbe: neuerTermin.farbe,
      bereich_id: neuerTermin.bereich_id,
      bereich_name: neuerTermin.bereich.name,
    };
  },

  async deleteTermin(terminId, mitarbeiterId) {
    const mitarbeiter = await mitarbeiterLaden(mitarbeiterId);

    const termin = await prisma.termin.findUnique({ where: { id: terminId } });
    if (!termin) return;

    // Sichtbarkeitsregel gilt auch für das Löschen: eigener Bereich, außer
    // sieht_alle_bereiche = true.
    if (!mitarbeiter.sieht_alle_bereiche && termin.bereich_id !== mitarbeiter.bereich_id) {
      throw new Error("Kein Zugriff auf diesen Termin (anderer Bereich).");
    }

    await prisma.termin.delete({ where: { id: terminId } });
  },

  async getBereiche(): Promise<Bereich[]> {
    const bereiche = await prisma.bereich.findMany({ orderBy: { name: "asc" } });
    return bereiche.map((b) => ({ id: b.id, name: b.name }));
  },
};
