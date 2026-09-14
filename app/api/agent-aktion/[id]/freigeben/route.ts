// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\app\api\agent-aktion\[id]\freigeben\route.ts
//
// Löst SCHRITT 2 des SEC-GATE-Prinzips aus: erst hier wird tatsächlich
// geschrieben (Re-Validierung + Ausführung), nie vorher (Admin-Entscheidung,
// siehe Grill-Me-Plan "Wann führt die KI eine schreibende Aktion aus?").
//
// NEU (Punkt 2, 11.09.2026): Ruft jetzt freigebenAktion() statt direkt
// fuehreSchreibaktionAus() auf. Bei Werkzeugen mit erfordertCoolingOff=true
// (aktuell nur Autonomieänderung) wird NICHT sofort ausgeführt, sondern nur
// terminiert (Status "freigegeben" + geplante_ausfuehrung_am) — die
// eigentliche Ausführung übernimmt später der Cooling-off-Cron. Für alle
// anderen Werkzeuge bleibt das Verhalten unverändert (sofortige Ausführung).

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
    const entscheidung = await adapter.freigebenAktion(id, pruefung.kontext);

    if (entscheidung.terminiert) {
      // NEU (Punkt 2): Cooling-off aktiv, noch nicht ausgeführt.
      return NextResponse.json({
        terminiert: true,
        aktion: entscheidung.aktion,
      });
    }

    // Unverändertes Verhalten: sofort ausgeführt (Normalfall, alle
    // bisherigen Werkzeuge ohne erfordertCoolingOff).
    return NextResponse.json(entscheidung.ergebnis);
  } catch (fehler) {
    if (fehler instanceof WerkzeugFehler) {
      return NextResponse.json({ fehler: fehler.message }, { status: fehler.status });
    }
    console.error("Freigeben fehlgeschlagen:", fehler);
    return NextResponse.json({ fehler: "Unerwarteter Fehler." }, { status: 500 });
  }
}
