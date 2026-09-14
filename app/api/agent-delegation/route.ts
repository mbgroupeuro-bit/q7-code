// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\agent-delegation\route.ts
//
// GET  -> aktuelle Delegation-Stufe (für alle mit Agent-Zugriff sichtbar)
// PUT  -> Stufe ändern (nur Admin/Tenant-Admin, siehe pruefeAdminZugriff())

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pruefeAgentZugriff, pruefeAdminZugriff } from "@/lib/ki-agent/rollen-check";
import { PrismaAdapter } from "@/lib/ki-agent/adapter-prisma";
import { WERKZEUGE } from "@/lib/ki-agent/werkzeuge";

const StufeSchema = z.object({
  stufe: z.enum(["keine", "teil", "komplett"]),
  // NEU (Fixrunde): bei Stufe "teil" die Liste der delegierten Werkzeug-IDs.
  werkzeugIds: z.array(z.string()).max(50).optional(),
});

export async function GET() {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  const delegation = await adapter.getDelegation();

  return NextResponse.json({ delegation });
}

export async function PUT(req: NextRequest) {
  const pruefung = await pruefeAdminZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const rohBody = await req.json().catch(() => null);
  const parsed = StufeSchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { fehler: "Ungültige Eingabe.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  const delegation = await adapter.setDelegationStufe(
    parsed.data.stufe,
    pruefung.kontext.mitarbeiterId,
    parsed.data.werkzeugIds
  );

  return NextResponse.json({ delegation });
}
