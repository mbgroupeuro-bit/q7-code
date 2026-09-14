// app/api/meine-aufgaben/aus-kanal/route.ts
//
// HINWEIS ZUR UMBENENNUNG (Grill-Me, Punkt 3): Die alte Version dieser
// Datei griff auf prisma.aufgabe zu. Durch die Umbenennung Aufgabe ->
// PosteingangEintrag existiert dieses Prisma-Modell nicht mehr — diese
// Datei muss durch die vorliegende Version ersetzt werden, sonst bricht
// die Verlegung "Posteingang -> Meine Aufgaben".
//
// Fachliche Funktion unverändert (Admin bestätigt manuell per Klick), nur
// die Datenzugriffs-Logik läuft jetzt über den Posteingang-Adapter statt
// direkt über Prisma — damit Feldnamen/Umbenennung an einer einzigen Stelle
// (Adapter) gepflegt werden, nicht doppelt in zwei Modulen.

import { NextRequest, NextResponse } from "next/server";
import { prismaPosteingangAdapter as posteingangDatenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aufgabe_id, zugewiesen_an } = body as { aufgabe_id?: string; zugewiesen_an?: string };

    if (!aufgabe_id) {
      return NextResponse.json({ error: "aufgabe_id ist erforderlich." }, { status: 400 });
    }

    const posteingangEintrag = await posteingangDatenQuelle.getEintrag(aufgabe_id);
    if (!posteingangEintrag) {
      return NextResponse.json({ error: "Posteingang-Eintrag nicht gefunden." }, { status: 404 });
    }

    const neueAufgabe = await posteingangDatenQuelle.verlegeZuMeineAufgabe(aufgabe_id, zugewiesen_an);

    return NextResponse.json({ aufgabe: neueAufgabe }, { status: 201 });
  } catch (error) {
    console.error("POST /api/meine-aufgaben/aus-kanal fehlgeschlagen:", error);
    return NextResponse.json({ error: "Verlegung fehlgeschlagen." }, { status: 500 });
  }
}
