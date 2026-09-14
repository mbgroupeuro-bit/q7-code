// app/api/notizen/[id]/route.ts
//
// GET: eine einzelne Notiz
// PATCH: aktualisiert Titel, Text, Kunde, Projekt, Tags
// DELETE: löscht die Notiz unwiderruflich

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNotizenDatenZugriff } from "@/lib/notizen-datenzugriff";

const PatchSchema = z
  .object({
    titel: z.string().trim().min(1).max(200).optional(),
    text: z.string().trim().min(1).max(10000).optional(),
    kunde: z.string().trim().max(200).nullable().optional(),
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
  const datenZugriff = getNotizenDatenZugriff();

  const notiz = await datenZugriff.getNotiz(id);
  if (!notiz) {
    return NextResponse.json({ error: "Notiz nicht gefunden.", errorKind: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ notiz });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rohBody = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Anfrage.", errorKind: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const datenZugriff = getNotizenDatenZugriff();

  try {
    const notiz = await datenZugriff.updateNotiz(id, parsed.data);
    return NextResponse.json({ notiz });
  } catch (err) {
    console.error(`PATCH /api/notizen/${id} fehlgeschlagen:`, err);
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
  const { id } = await context.params;
  const datenZugriff = getNotizenDatenZugriff();

  try {
    await datenZugriff.deleteNotiz(id);
    return NextResponse.json({ erfolg: true });
  } catch (err) {
    console.error(`DELETE /api/notizen/${id} fehlgeschlagen:`, err);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
