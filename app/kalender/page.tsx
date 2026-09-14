// app/kalender/page.tsx
// Aktualisiert 04.09.2026 — Kalender-Basismodul: bereichsbezogene Termine,
// fällige Aufgaben zusätzlich im Kalender sichtbar (nur Anzeige, siehe
// KalenderView.tsx).

import { PrismaClient } from "@prisma/client";
import KalenderView from "./KalenderView";
import { getAktuellerMitarbeiter } from "@/lib/kalender/aktueller-mitarbeiter";
import { prismaKalenderAdapter } from "@/lib/kalender/prisma-adapter";

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

export default async function KalenderPage() {
  const mitarbeiter = await getAktuellerMitarbeiter();

  if (!mitarbeiter) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-5">
          <h2 className="text-[20px] font-semibold">Kalender</h2>
        </div>
        <div className="rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#991b1b]">
          Kein Mitarbeiter erkannt (Header <code>x-q7-mitarbeiter</code> fehlt
          oder ist ungültig). Der Kalender kann ohne bekannten Mitarbeiter
          keine bereichsbezogenen Termine anzeigen.
        </div>
      </div>
    );
  }

  const [termine, bereiche, offeneAufgaben, erledigteAufgaben] = await Promise.all([
    prismaKalenderAdapter.getTermine(mitarbeiter.id),
    mitarbeiter.sieht_alle_bereiche ? prismaKalenderAdapter.getBereiche() : Promise.resolve([]),
    // Bewusst ohne Filter nach Zuständigkeit — identisch zum bestehenden
    // Verhalten des Meine-Aufgaben-Widgets (siehe Grill-Me-Entscheidung).
    prisma.meineAufgabe.findMany({
      where: { status: "offen" },
      orderBy: { faelligkeit: "asc" },
    }),
    prisma.meineAufgabe.findMany({
      where: { status: "erledigt" },
      orderBy: { erledigt_am: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold">Kalender</h2>
      </div>

      <KalenderView
        mitarbeiter={mitarbeiter}
        bereiche={bereiche}
        initialTermine={termine}
        initialAufgaben={offeneAufgaben.map((a) => ({
          id: a.id,
          titel: a.titel,
          faelligkeit: a.faelligkeit ? a.faelligkeit.toISOString() : null,
          status: a.status,
        }))}
        initialErledigt={erledigteAufgaben.map((a) => ({
          id: a.id,
          titel: a.titel,
        }))}
      />
    </div>
  );
}
