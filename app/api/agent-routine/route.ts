// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\agent-routine\route.ts
//
// GET  -> eigene Routinen auflisten
// POST -> neue Routine anlegen
// Mitarbeiter verwaltet NUR seine eigenen Routinen (kein bereichsweiter oder
// globaler Zugriff nötig — jeder stellt seinen persönlichen Rhythmus selbst ein).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";
import { PrismaAdapter } from "@/lib/ki-agent/adapter-prisma";
import { WERKZEUGE } from "@/lib/ki-agent/werkzeuge";

const WOCHENTAG_SCHEMA = z.enum(["mo", "di", "mi", "do", "fr", "sa", "so"]);

const NeueRoutineSchema = z.object({
  typ: z.string().max(50).default("eigene_routine"),
  anweisung: z.string().trim().min(1).max(2000),
  uhrzeit: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format muss HH:MM sein."),
  wochentage: z.array(WOCHENTAG_SCHEMA).min(1).max(7),
});

export async function GET() {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  const routinen = await adapter.getRoutinen(pruefung.kontext.mitarbeiterId);

  return NextResponse.json({ routinen });
}

export async function POST(req: NextRequest) {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const rohBody = await req.json().catch(() => null);
  const parsed = NeueRoutineSchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { fehler: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  const routine = await adapter.erstelleRoutine(pruefung.kontext.mitarbeiterId, parsed.data);

  return NextResponse.json({ routine });
}
