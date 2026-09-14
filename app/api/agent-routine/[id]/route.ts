// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\agent-routine\[id]\route.ts
//
// PATCH  -> Uhrzeit/Wochentage/aktiv ändern
// DELETE -> Routine löschen
// Beide prüfen zusätzlich, dass die Routine wirklich dem anfragenden
// Mitarbeiter gehört (sonst 403) — reine Rollenprüfung allein reicht nicht,
// da jeder Mitarbeiter grundsätzlich Zugriff auf DIESE Route hat.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";
import { PrismaAdapter } from "@/lib/ki-agent/adapter-prisma";
import { WERKZEUGE } from "@/lib/ki-agent/werkzeuge";
import { WerkzeugFehler } from "@/lib/ki-agent/types";
import { prisma } from "@/lib/prisma";

const WOCHENTAG_SCHEMA = z.enum(["mo", "di", "mi", "do", "fr", "sa", "so"]);

const AenderungSchema = z.object({
  anweisung: z.string().trim().min(1).max(2000).optional(),
  uhrzeit: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format muss HH:MM sein.").optional(),
  wochentage: z.array(WOCHENTAG_SCHEMA).min(1).max(7).optional(),
  aktiv: z.boolean().optional(),
});

async function pruefeBesitz(routineId: string, mitarbeiterId: string): Promise<boolean> {
  const routine = await prisma.agentRoutine.findUnique({ where: { id: routineId } });
  return routine?.mitarbeiter_id === mitarbeiterId;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const { id } = await params;

  if (!(await pruefeBesitz(id, pruefung.kontext.mitarbeiterId))) {
    return NextResponse.json({ fehler: "Diese Routine gehört nicht zu dir." }, { status: 403 });
  }

  const rohBody = await req.json().catch(() => null);
  const parsed = AenderungSchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { fehler: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const adapter = new PrismaAdapter(WERKZEUGE);

  try {
    const routine = await adapter.aktualisiereRoutine(id, parsed.data);
    return NextResponse.json({ routine });
  } catch (fehler) {
    if (fehler instanceof WerkzeugFehler) {
      return NextResponse.json({ fehler: fehler.message }, { status: fehler.status });
    }
    console.error("Routine-Änderung fehlgeschlagen:", fehler);
    return NextResponse.json({ fehler: "Unerwarteter Fehler." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const { id } = await params;

  if (!(await pruefeBesitz(id, pruefung.kontext.mitarbeiterId))) {
    return NextResponse.json({ fehler: "Diese Routine gehört nicht zu dir." }, { status: 403 });
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  await adapter.loescheRoutine(id);

  return NextResponse.json({ erfolg: true });
}
