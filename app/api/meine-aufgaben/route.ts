// app/api/meine-aufgaben/route.ts
//
// POST: legt eine neue MeineAufgabe manuell an, quelle="manuell".
//
// Änderung (04.09.2026): tags-Feld ergänzt (Array von Strings aus dem
// Formular, wird im Adapter zu komma-getrenntem String für die DB).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import { getAktuelleRolle } from "@/lib/auth-server";

const BodySchema = z.object({
  titel: z.string().trim().min(1).max(200),
  beschreibung: z.string().trim().max(5000).optional(),
  zugewiesen_an: z.string().trim().min(1).max(200).optional(),
  prioritaet: z.enum(["niedrig", "normal", "hoch"]).optional(),
  farbe: z.string().trim().max(50).optional(),
  faelligkeit: z.string().datetime().optional(),
  projekt_id: z.string().trim().max(200).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export async function POST(req: NextRequest) {
  const rolle = await getAktuelleRolle();

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
    const neueAufgabe = await datenZugriff.createAufgabe(parsed.data);

    console.log(`Aufgabenliste POST (manuell): Rolle=${rolle} id=${neueAufgabe.id}`);

    return NextResponse.json({ aufgabe: neueAufgabe }, { status: 201 });
  } catch (err) {
    console.error("POST /api/meine-aufgaben fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Anlegen fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
