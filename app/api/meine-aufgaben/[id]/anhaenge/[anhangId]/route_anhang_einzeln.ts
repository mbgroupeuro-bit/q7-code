// Basismodul "Meine Aufgaben" — einzelner Anhang
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\api\meine-aufgaben\[id]\anhaenge\[anhangId]\route.ts
//
// Neu (04.09.2026): DELETE entfernt die Verknüpfung UND die physische Datei
// aus der Ablage (siehe removeAnhang im Adapter).

import { NextRequest, NextResponse } from "next/server";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string; anhangId: string }> }
) {
  const { id, anhangId } = await context.params;
  const datenZugriff = getAufgabenDatenZugriff();

  try {
    await datenZugriff.removeAnhang(id, anhangId);
    return NextResponse.json({ erfolg: true });
  } catch (err) {
    console.error(`DELETE /api/meine-aufgaben/${id}/anhaenge/${anhangId} fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
