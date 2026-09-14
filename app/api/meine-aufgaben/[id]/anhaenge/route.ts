// Basismodul "Meine Aufgaben" — Anhänge einer Aufgabe
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\api\meine-aufgaben\[id]\anhaenge\route.ts
//
// Neu (04.09.2026): POST lädt eine Datei hoch und verknüpft sie mit der
// Aufgabe. Die eigentliche Speicherung + Validierung (Dateityp-Whitelist,
// Größenlimit) läuft über lib/ablage.ts (addAnhang im Adapter) — diese Route
// ist bewusst dünn gehalten.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";

const BodySchema = z.object({
  dateiname: z.string().trim().min(1).max(255),
  inhaltBase64: z.string().min(1),
  mimeType: z.string().trim().min(1).max(150),
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
    const anhang = await datenZugriff.addAnhang(
      id,
      parsed.data.dateiname,
      parsed.data.inhaltBase64,
      parsed.data.mimeType
    );

    return NextResponse.json({ anhang }, { status: 201 });
  } catch (err) {
    const nachricht = err instanceof Error ? err.message : "Upload fehlgeschlagen.";
    // SEC-GATE-Ablehnungen aus lib/ablage.ts (Dateityp/Größe) sollen als 400
    // ankommen, nicht als 500 — sind Nutzerfehler, kein Serverproblem.
    const istValidierungsfehler = nachricht.startsWith("SEC-GATE:");
    console.error(`POST /api/meine-aufgaben/${id}/anhaenge fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: nachricht, errorKind: istValidierungsfehler ? "validation" : "upstream" },
      { status: istValidierungsfehler ? 400 : 500 }
    );
  }
}
