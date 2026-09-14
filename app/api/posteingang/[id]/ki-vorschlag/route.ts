// D:\Projekt2027\Basismodule\Posteingang\app\api\posteingang\[id]\ki-vorschlag\route.ts
//
// POST /api/posteingang/[id]/ki-vorschlag
// Body: { aktion: "uebernehmen" | "ablehnen", kommentar?: string }
//
// Mensch bleibt in der Kontrolle über jeden KI-Vorschlag (siehe Zusammen-
// fassung Abschnitt 3): Freigabe übernimmt die vorgeschlagenen Werte
// (prioritaet/bereich_id/verantwortlich_id) in den Eintrag, Ablehnung
// verwirft den Vorschlag. Beides wird transparent in PosteingangVerlauf
// protokolliert (siehe Adapter).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaPosteingangAdapter as datenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";

const BodySchema = z.object({
  aktion: z.enum(["uebernehmen", "ablehnen"]),
  kommentar: z.string().trim().max(2000).optional(),
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

  const { aktion, kommentar } = parsed.data;

  try {
    const eintrag =
      aktion === "uebernehmen"
        ? await datenQuelle.kiVorschlagUebernehmen(id, kommentar)
        : await datenQuelle.kiVorschlagAblehnen(id, kommentar);

    return NextResponse.json({ eintrag });
  } catch (err) {
    console.error(`POST /api/posteingang/${id}/ki-vorschlag fehlgeschlagen:`, err);
    return NextResponse.json({ error: "Vorgang fehlgeschlagen." }, { status: 500 });
  }
}
