// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\agent-aktion\[id]\ablehnen\route.ts

import { NextRequest, NextResponse } from "next/server";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";
import { PrismaAdapter } from "@/lib/ki-agent/adapter-prisma";
import { WERKZEUGE } from "@/lib/ki-agent/werkzeuge";
import { WerkzeugFehler } from "@/lib/ki-agent/types";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const { id } = await params;
  const adapter = new PrismaAdapter(WERKZEUGE);

  try {
    await adapter.lehneAktionAb(id, pruefung.kontext);
    return NextResponse.json({ erfolg: true });
  } catch (fehler) {
    if (fehler instanceof WerkzeugFehler) {
      return NextResponse.json({ fehler: fehler.message }, { status: fehler.status });
    }
    console.error("Ablehnen fehlgeschlagen:", fehler);
    return NextResponse.json({ fehler: "Unerwarteter Fehler." }, { status: 500 });
  }
}
