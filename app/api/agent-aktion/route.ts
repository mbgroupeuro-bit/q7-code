// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\agent-aktion\route.ts
//
// Liefert alle offenen (wartet_auf_freigabe) AgentAktionen für die Ausgabe-Seite.
// Rollenprüfung fest eingebaut (Grill-Me-Entscheidung Punkt 5) — nicht nur
// auf den Proxy verlassen (Code-Review Punkt 2).

import { NextResponse } from "next/server";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";
import { PrismaAdapter } from "@/lib/ki-agent/adapter-prisma";
import { WERKZEUGE } from "@/lib/ki-agent/werkzeuge";

export async function GET() {
  const pruefung = await pruefeAgentZugriff();
  if (!pruefung.erlaubt || !pruefung.kontext) {
    return NextResponse.json({ fehler: pruefung.fehlerText }, { status: pruefung.fehlerStatus ?? 403 });
  }

  const adapter = new PrismaAdapter(WERKZEUGE);
  const aktionen = await adapter.getOffeneAktionen(pruefung.kontext);

  return NextResponse.json({ aktionen });
}
