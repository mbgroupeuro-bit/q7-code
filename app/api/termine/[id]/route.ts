// app/api/termine/[id]/route.ts
// Aktualisiert 04.09.2026 — Kalender-Basismodul: Zugriff über
// prismaKalenderAdapter, prüft Bereichs-Zugriffsrecht vor dem Löschen.
//
// Geändert 13.09.2026 (Kalender-Fixes-Session):
// 1. PATCH ergänzt — bisher fehlte jede Möglichkeit, einen Termin zu
//    bearbeiten (siehe Übergabe "Q7 – Kalender-Fixes", Punkt 1).
// 2. params auf Next.js-16-Muster (Promise) umgestellt — die Datei nutzte
//    bisher noch { params: { id: string } } ohne Promise/await, was laut
//    Ablage-Basismodul-Erfahrung in Next.js 16 nicht mehr korrekt ist.
//    War hier offenbar übersehen worden, wird jetzt im Zuge der ohnehin
//    nötigen Änderung mit korrigiert.

import { NextResponse } from "next/server";
import { prismaKalenderAdapter } from "@/lib/kalender/prisma-adapter";
import { getAktuellerMitarbeiterAusRequest } from "@/lib/kalender/aktueller-mitarbeiter";
import type { TerminAktualisieren } from "@/lib/kalender/adapter-interface";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mitarbeiter = await getAktuellerMitarbeiterAusRequest(request);
    if (!mitarbeiter) {
      return NextResponse.json({ error: "Kein Mitarbeiter erkannt." }, { status: 401 });
    }

    const body = await request.json();
    const { titel, beschreibung, start, ende, farbe } = body as TerminAktualisieren;

    if (titel !== undefined && !titel.trim()) {
      return NextResponse.json({ error: "Titel darf nicht leer sein." }, { status: 400 });
    }

    const aktualisierterTermin = await prismaKalenderAdapter.updateTermin(
      id,
      { titel, beschreibung, start, ende, farbe },
      mitarbeiter.id
    );

    return NextResponse.json({ termin: aktualisierterTermin });
  } catch (error) {
    console.error("PATCH /api/termine/[id] fehlgeschlagen:", error);
    const nachricht = error instanceof Error ? error.message : "Termin konnte nicht aktualisiert werden.";
    const istZugriffsfehler = nachricht.includes("Kein Zugriff");
    return NextResponse.json(
      { error: nachricht },
      { status: istZugriffsfehler ? 403 : 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mitarbeiter = await getAktuellerMitarbeiterAusRequest(request);
    if (!mitarbeiter) {
      return NextResponse.json({ error: "Kein Mitarbeiter erkannt." }, { status: 401 });
    }

    await prismaKalenderAdapter.deleteTermin(id, mitarbeiter.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/termine/[id] fehlgeschlagen:", error);
    return NextResponse.json({ error: "Termin konnte nicht gelöscht werden." }, { status: 500 });
  }
}
