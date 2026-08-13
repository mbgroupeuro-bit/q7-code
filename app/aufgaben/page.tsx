// app/aufgaben/page.tsx
// Neu 01.08.2026 — Q7-A-0XX (behebt 404 für Sidebar-Link "Aufgaben")
// Datenquelle: MeineAufgabe (siehe schema_ergaenzung.prisma)

import { PrismaClient } from "@prisma/client";
import AufgabenListe from "./AufgabenListe";

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

export default async function AufgabenPage() {
  const aufgaben = await prisma.meineAufgabe.findMany({
    orderBy: { erstellt_am: "desc" },
  });

  const offeneAnzahl = aufgaben.filter((a) => a.status === "offen").length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold">Aufgaben</h2>
          <div className="mt-1">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700">
              {offeneAnzahl} offen
            </span>
          </div>
        </div>
      </div>

      <AufgabenListe
        initialAufgaben={aufgaben.map((a) => ({
          ...a,
          erstellt_am: a.erstellt_am.toISOString(),
        }))}
      />
    </div>
  );
}
