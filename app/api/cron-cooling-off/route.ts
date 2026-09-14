// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\api\cron-cooling-off\route.ts
//
// NEU (Punkt 2, 11.09.2026). Analog zur bestehenden Routine unter
// app\api\cron-routinen\route.ts — wird periodisch von außen aufgerufen
// (z.B. Windows Task Scheduler, wie bereits für den Gmail-IMAP-Poll genutzt,
// oder Vercel Cron) und führt alle AgentAktionen aus, deren Cooling-off-Frist
// abgelaufen ist (Status "freigegeben", geplante_ausfuehrung_am <= jetzt).
//
// Gleicher CRON_SECRET-Schutz wie bei cron-routinen — übernommen, nicht neu
// erfunden. Empfehlung: alle 15 Minuten aufrufen (gleiches Intervall wie
// Routinen-Cron), da der 07:00-Slot ohnehin die eigentliche Präzision liefert.

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

  const faelligeAktionen = await adapter.getFaelligeCoolingOffAktionen(jetzt);

  const ergebnisse: { aktionId: string; erfolg: boolean }[] = [];

  for (const aktion of faelligeAktionen) {
    try {
      await adapter.fuehreCoolingOffAktionAus(aktion.id);
      ergebnisse.push({ aktionId: aktion.id, erfolg: true });
    } catch (fehler) {
      console.error(`Cron (Cooling-off): Aktion ${aktion.id} fehlgeschlagen:`, fehler);
      ergebnisse.push({ aktionId: aktion.id, erfolg: false });
    }
  }

  return NextResponse.json({ geprueft: faelligeAktionen.length, ergebnisse });
}
