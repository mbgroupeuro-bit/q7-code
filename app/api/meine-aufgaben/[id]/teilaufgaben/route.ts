// Basismodul "Aufgabenliste" — Teilaufgabe anlegen
// Speicherort: D:\Projekt2027\Basismodule\aufgabenliste\app\api\meine-aufgaben\[id]\teilaufgaben\route.ts
//
// POST: legt eine neue Teilaufgabe zu einer Aufgabe an.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";

const BodySchema = z.object({
  titel: z.string().trim().min(1).max(200),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const rohBody = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Anfrage.", errorKind: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const datenZugriff = getAufgabenDatenZugriff();

  try {
    const teilaufgabe = await datenZugriff.createTeilaufgabe(id, parsed.data.titel);
    return NextResponse.json({ teilaufgabe }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/meine-aufgaben/${id}/teilaufgaben fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Anlegen fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
