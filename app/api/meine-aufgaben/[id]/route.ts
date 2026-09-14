// Basismodul "Meine Aufgaben" — API-Route für eine einzelne Aufgabe
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\api\meine-aufgaben\[id]\route.ts
//
// GET: liefert eine Aufgabe inkl. Verlauf (für die Detailseite)
// PATCH: aktualisiert Status, Zuweisung, Priorität, Farbe, Fälligkeit, Projekt, Tags
// DELETE: löscht die Aufgabe unwiderruflich (inkl. Teilaufgaben/Verlauf/Anhänge)
//
// Änderung (04.09.2026, 1): Status-Enum um "in_bearbeitung" erweitert.
// Änderung (04.09.2026, 2): tags im PATCH ergänzt, DELETE-Handler neu
// (für das Drei-Punkte-Menü "Löschen" in der Liste).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import { getAktuelleRolle } from "@/lib/auth-server";

const PatchSchema = z
  .object({
    status: z.enum(["offen", "in_bearbeitung", "erledigt"]).optional(),
    zugewiesen_an: z.string().trim().min(1).max(200).optional(),
    prioritaet: z.enum(["niedrig", "normal", "hoch"]).optional(),
    farbe: z.string().trim().max(50).optional(),
    faelligkeit: z.string().datetime().nullable().optional(),
    projekt_id: z.string().trim().max(200).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "Mindestens ein Feld muss angegeben werden." }
  );

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const datenZugriff = getAufgabenDatenZugriff();

  const aufgabe = await datenZugriff.getAufgabeMitVerlauf(id);
  if (!aufgabe) {
    return NextResponse.json(
      { error: "Aufgabe nicht gefunden.", errorKind: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ aufgabe });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rolle = await getAktuelleRolle();
  const { id } = await context.params;

  const rohBody = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Anfrage.", errorKind: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const datenZugriff = getAufgabenDatenZugriff();

  try {
    const aktualisiert = await datenZugriff.updateAufgabe(id, parsed.data, rolle);

    console.log(`Aufgabenliste PATCH: Rolle=${rolle} id=${id}`);

    return NextResponse.json({ aufgabe: aktualisiert });
  } catch (err) {
    console.error(`PATCH /api/meine-aufgaben/${id} fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Aktualisierung fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rolle = await getAktuelleRolle();
  const { id } = await context.params;
  const datenZugriff = getAufgabenDatenZugriff();

  try {
    await datenZugriff.deleteAufgabe(id);

    console.log(`Aufgabenliste DELETE: Rolle=${rolle} id=${id}`);

    return NextResponse.json({ erfolg: true });
  } catch (err) {
    console.error(`DELETE /api/meine-aufgaben/${id} fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
