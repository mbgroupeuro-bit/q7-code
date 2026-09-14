// app/api/termine/route.ts
// Aktualisiert 04.09.2026 — Kalender-Basismodul: Zugriff über
// prismaKalenderAdapter statt direktem Prisma-Zugriff, Mitarbeiter-Prüfung.

import { NextResponse } from "next/server";
import { prismaKalenderAdapter } from "@/lib/kalender/prisma-adapter";
import { getAktuellerMitarbeiterAusRequest } from "@/lib/kalender/aktueller-mitarbeiter";

export async function GET(request: Request) {
  try {
    const mitarbeiter = await getAktuellerMitarbeiterAusRequest(request);
    if (!mitarbeiter) {
      return NextResponse.json({ error: "Kein Mitarbeiter erkannt." }, { status: 401 });
    }

    const termine = await prismaKalenderAdapter.getTermine(mitarbeiter.id);
    return NextResponse.json({ termine });
  } catch (error) {
    console.error("GET /api/termine fehlgeschlagen:", error);
    return NextResponse.json({ error: "Termine konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const mitarbeiter = await getAktuellerMitarbeiterAusRequest(request);
    if (!mitarbeiter) {
      return NextResponse.json({ error: "Kein Mitarbeiter erkannt." }, { status: 401 });
    }

    const body = await request.json();
    const { titel, beschreibung, start, ende, farbe, bereich_id } = body as {
      titel?: string;
      beschreibung?: string;
      start?: string;
      ende?: string;
      farbe?: string;
      bereich_id?: string;
    };

    if (!titel?.trim() || !start || !ende) {
      return NextResponse.json({ error: "Titel, Start und Ende sind erforderlich." }, { status: 400 });
    }

    const neuerTermin = await prismaKalenderAdapter.createTermin(
      {
        titel,
        beschreibung,
        start,
        ende,
        farbe,
        bereich_id: bereich_id || mitarbeiter.bereich_id,
      },
      mitarbeiter.id
    );

    return NextResponse.json({ termin: neuerTermin }, { status: 201 });
  } catch (error) {
    console.error("POST /api/termine fehlgeschlagen:", error);
    return NextResponse.json({ error: "Termin konnte nicht angelegt werden." }, { status: 500 });
  }
}
