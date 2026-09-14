// app/api/notizen/route.ts
//
// GET: Liste aller Notizen
// POST: legt eine neue Notiz an

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNotizenDatenZugriff } from "@/lib/notizen-datenzugriff";

const BodySchema = z.object({
  titel: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(10000),
  kunde: z.string().trim().max(200).optional(),
  projekt_id: z.string().trim().max(200).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export async function GET() {
  const datenZugriff = getNotizenDatenZugriff();
  const notizen = await datenZugriff.getNotizen();
  return NextResponse.json({ notizen });
}

export async function POST(req: NextRequest) {
  const rohBody = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Anfrage.", errorKind: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const datenZugriff = getNotizenDatenZugriff();

  try {
    const notiz = await datenZugriff.createNotiz(parsed.data);
    return NextResponse.json({ notiz }, { status: 201 });
  } catch (err) {
    console.error("POST /api/notizen fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Anlegen fehlgeschlagen.", errorKind: "upstream" },
      { status: 500 }
    );
  }
}
