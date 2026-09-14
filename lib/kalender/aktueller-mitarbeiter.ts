// lib/kalender/aktueller-mitarbeiter.ts
// Liest den simulierten Mitarbeiter-Header (x-q7-mitarbeiter) und lädt den
// zugehörigen Mitarbeiter-Datensatz inkl. Bereich. Übergangslösung, solange
// es kein echtes Login/Session-System gibt (siehe Allgemeine_Infos_
// Ergaenzung_v1.md, Punkt 2). Analog zu
// lib/posteingang/aktueller-mitarbeiter.ts.
//
// WICHTIG (bekannter, noch offener Punkt aus dem Chat-Basismodul):
// proxy.ts setzt den Header x-q7-mitarbeiter aktuell noch NICHT. Solange das
// nicht behoben ist, liefert dieses Modul hier ebenfalls "kein Mitarbeiter
// erkannt" zurück — das ist kein Fehler in dieser Datei, sondern die
// bekannte, noch offene Abhängigkeit.
//
// Neu 04.09.2026 — Kalender-Basismodul.

import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { MitarbeiterKontext } from "./typen";

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

async function laden(mitarbeiterId: string | null): Promise<MitarbeiterKontext | null> {
  if (!mitarbeiterId) return null;

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { id: mitarbeiterId },
    include: { bereich: true },
  });
  if (!mitarbeiter) return null;

  return {
    id: mitarbeiter.id,
    bereich_id: mitarbeiter.bereich_id,
    bereich_name: mitarbeiter.bereich.name,
    sieht_alle_bereiche: mitarbeiter.sieht_alle_bereiche,
  };
}

// Für Server Components (page.tsx), liest next/headers
export async function getAktuellerMitarbeiter(): Promise<MitarbeiterKontext | null> {
  const h = await headers();
  return laden(h.get("x-q7-mitarbeiter"));
}

// Für API-Routen (Request-Objekt statt next/headers)
export async function getAktuellerMitarbeiterAusRequest(
  request: Request
): Promise<MitarbeiterKontext | null> {
  return laden(request.headers.get("x-q7-mitarbeiter"));
}
