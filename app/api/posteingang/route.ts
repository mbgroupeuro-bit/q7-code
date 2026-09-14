// D:\Projekt2027\Basismodule\Posteingang\app\api\posteingang\[id]\route.ts
//
// GET   /api/posteingang/[id]  — Detail + Chat-Verlauf + Änderungs-Verlauf
// PATCH /api/posteingang/[id]  — Status/Prioritaet/Bereich/Verantwortlich
//                                 ändern (löst automatisch einen Verlauf-
//                                 Eintrag pro geändertem Feld aus, siehe
//                                 Adapter).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prismaPosteingangAdapter as datenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";
import { getAktuelleRolle } from "@/lib/auth-server";

const PatchSchema = z
  .object({
    status: z.string().trim().min(1).max(50).optional(),
    prioritaet: z.enum(["niedrig", "mittel", "hoch"]).optional(),
    bereich_id: z.string().trim().min(1).optional(),
    verantwortlich_id: z.string().trim().min(1).optional(),
    kommentar: z.string().trim().max(2000).optional(),
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.prioritaet !== undefined ||
      d.bereich_id !== undefined ||
      d.verantwortlich_id !== undefined,
    { message: "Mindestens ein Feld (status, prioritaet, bereich_id oder verantwortlich_id) muss angegeben werden." }
  );

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const eintrag = await datenQuelle.getEintrag(id);
  if (!eintrag) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  const [chats, verlauf] = await Promise.all([
    datenQuelle.getChatVerlauf(id),
    datenQuelle.getVerlauf(id),
  ]);

  return NextResponse.json({ eintrag, chats, verlauf });
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

  const { kommentar, ...daten } = parsed.data;

  try {
    const aktualisiert = await datenQuelle.updateEintrag(id, daten, {
      akteur: "mensch",
      akteur_name: rolle,
      kommentar,
    });

    console.log(`Q7 Posteingang PATCH: Rolle=${rolle} id=${id}`);

    return NextResponse.json({ eintrag: aktualisiert });
  } catch (err) {
    console.error(`PATCH /api/posteingang/${id} fehlgeschlagen:`, err);
    return NextResponse.json({ error: "Aktualisierung fehlgeschlagen." }, { status: 500 });
  }
}
