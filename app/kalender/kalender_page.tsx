// app/kalender/page.tsx
// Aktualisiert 02.08.2026 — Mini-Monatsübersicht + Erledigte-Aufgaben-Widget

import { PrismaClient } from "@prisma/client";
import KalenderView from "./KalenderView";

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
  const [termine, offeneAufgaben, erledigteAufgaben] = await Promise.all([
    prisma.termin.findMany({ orderBy: { start: "asc" } }),
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
        initialTermine={termine.map((t) => ({
          ...t,
          start: t.start.toISOString(),
          ende: t.ende.toISOString(),
        }))}
        initialAufgaben={offeneAufgaben.map((a) => ({
          ...a,
          faelligkeit: a.faelligkeit ? a.faelligkeit.toISOString() : null,
        }))}
        initialErledigt={erledigteAufgaben.map((a) => ({
          id: a.id,
          titel: a.titel,
        }))}
      />
    </div>
  );
}
