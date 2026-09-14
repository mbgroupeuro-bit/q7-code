// Basismodul "Aufgabenliste" — Aufgabe weiterleiten
// Speicherort: D:\Projekt2027\Basismodule\aufgabenliste\app\api\meine-aufgaben\[id]\weiterleiten\route.ts
//
// PATCH: ändert zugewiesen_an und schreibt automatisch einen Verlaufseintrag.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import { getAktuelleRolle } from "@/lib/auth-server";

const BodySchema = z.object({
  an: z.string().trim().min(1).max(200),
  kommentar: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rolle = await getAktuelleRolle();
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
    const aufgabe = await datenZugriff.weiterleiten(id, parsed.data.an, rolle, parsed.data.kommentar);
    return NextResponse.json({ aufgabe });
  } catch (err) {
    console.error(`PATCH /api/meine-aufgaben/${id}/weiterleiten fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Weiterleitung fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
