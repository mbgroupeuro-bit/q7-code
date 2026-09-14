// Basismodul "Aufgabenliste" — Status einer Teilaufgabe ändern
// Speicherort: D:\Projekt2027\Basismodule\aufgabenliste\app\api\meine-aufgaben\[id]\teilaufgaben\[teilaufgabeId]\route.ts
//
// PATCH: setzt eine Teilaufgabe auf offen/erledigt.
// Hinweis: [id] (die übergeordnete Aufgabe) wird hier nicht gebraucht, da
// Teilaufgaben über ihre eigene id direkt aktualisiert werden — der Parameter
// existiert nur wegen der Ordnerstruktur unter [id]/teilaufgaben/.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";

const BodySchema = z.object({
  status: z.enum(["offen", "erledigt"]),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; teilaufgabeId: string }> }
) {
  const { teilaufgabeId } = await context.params;

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
    const teilaufgabe = await datenZugriff.updateTeilaufgabeStatus(teilaufgabeId, parsed.data.status);
    return NextResponse.json({ teilaufgabe });
  } catch (err) {
    console.error(`PATCH /teilaufgaben/${teilaufgabeId} fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Aktualisierung fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
