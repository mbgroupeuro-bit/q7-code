// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\cron-routinen\route.ts
//
// Wird periodisch von außen aufgerufen (z.B. Vercel Cron alle 15 Minuten,
// oder ein einfacher externer Scheduler) — prüft, welche AgentRoutine gerade
// fällig ist, und führt sie aus. Ersetzt den ursprünglich fest auf 8:00
// geplanten Job (Admin-Entscheidung: Uhrzeit/Wochentage pro Mitarbeiter).
//
// ANNAHME (bitte prüfen, nicht abschließend abgestimmt): Schutz über
// CRON_SECRET-Header, gängiges Muster für öffentlich erreichbare Cron-
// Endpunkte (z.B. Vercel Cron sendet automatisch "Authorization: Bearer
// <CRON_SECRET>", wenn in vercel.json konfiguriert). Falls ihr einen anderen
// Scheduler nutzt (z.B. lokaler Server-Cron ohne HTTP), bitte Rückmeldung —
// dann reicht ggf. auch ein interner Aufruf ohne dieses Secret.

import { NextRequest, NextResponse } from "next/server";
import { PrismaAdapter } from "@/lib/ki-agent/adapter-prisma";
import { WERKZEUGE } from "@/lib/ki-agent/werkzeuge";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = req.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ fehler: "Zugriff verweigert." }, { status: 401 });
    }
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  const jetzt = new Date();

  const faelligeRoutinen = await adapter.getFaelligeRoutinen(jetzt);

  const ergebnisse: { routineId: string; erfolg: boolean }[] = [];

  for (const routine of faelligeRoutinen) {
    try {
      await adapter.fuehreRoutineAus(routine.id);
      ergebnisse.push({ routineId: routine.id, erfolg: true });
    } catch (fehler) {
      console.error(`Cron: Routine ${routine.id} fehlgeschlagen:`, fehler);
      ergebnisse.push({ routineId: routine.id, erfolg: false });
    }
  }

  return NextResponse.json({ geprueft: faelligeRoutinen.length, ergebnisse });
}
