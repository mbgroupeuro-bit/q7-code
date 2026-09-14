// Basismodul "Aufgabenliste" — Kommentar zu einer Aufgabe hinzufügen
// Speicherort: D:\Projekt2027\Basismodule\Aufgabenliste\app\api\meine-aufgaben\[id]\verlauf\route.ts
//
// POST: fügt einen Kommentar-Eintrag im Verlauf der Aufgabe hinzu.
// Weiterleitungen und Statusänderungen laufen über andere Stellen
// (updateAufgabe bzw. eine eigene Weiterleitungs-Funktion, folgt in Stufe 6).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import { getAktuelleRolle } from "@/lib/auth-server";

const BodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

export async function POST(
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
    const eintrag = await datenZugriff.addVerlaufEintrag(id, "kommentar", parsed.data.text, rolle);
    return NextResponse.json({ eintrag }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/meine-aufgaben/${id}/verlauf fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Kommentar konnte nicht gespeichert werden.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
