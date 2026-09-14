// D:\Projekt2027\Basismodule\Posteingang\app\api\posteingang\[id]\zu-aufgabe\route.ts
//
// Ersetzt die alte Datei app/api/meine-aufgaben/aus-kanal/route.ts, die
// wegen der Umbenennung Aufgabe -> PosteingangEintrag nicht mehr funktioniert
// hätte (nutzte prisma.aufgabe). Fachliche Funktion unverändert: Admin
// bestätigt manuell per Klick, legt daraus eine MeineAufgabe mit
// quelle="kanal_verlegt" an. Automatische KI-Erkennung weiterhin nicht
// enthalten (wie im Original vermerkt).

import { NextRequest, NextResponse } from "next/server";

import { prismaPosteingangAdapter as datenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const body = await req.json().catch(() => ({}));
  const zugewiesenAn = typeof body?.zugewiesen_an === "string" ? body.zugewiesen_an : undefined;

  try {
    const aufgabe = await datenQuelle.verlegeZuMeineAufgabe(id, zugewiesenAn);
    return NextResponse.json({ aufgabe }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/posteingang/${id}/zu-aufgabe fehlgeschlagen:`, err);
    return NextResponse.json({ error: "Verlegung fehlgeschlagen." }, { status: 500 });
  }
}
