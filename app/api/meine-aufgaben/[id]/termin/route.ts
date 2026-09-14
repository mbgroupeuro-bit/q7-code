// Basismodul "Aufgabenliste" — Termin zu einer Aufgabe anfordern
// Speicherort: D:\Projekt2027\Basismodule\aufgabenliste\app\api\meine-aufgaben\[id]\termin\route.ts
//
// POST: löst das Event TERMIN_ANGEFORDERT aus (Kalender-Basismodul reagiert
// darauf, sobald es existiert) und schreibt einen Verlaufseintrag.
// Speichert selbst KEINEN Termin — siehe lib/aufgaben-events.ts.
//
// Geändert (13.09.2026, Kalender-Fixes-Session): liest zusätzlich den
// simulierten Header x-q7-mitarbeiter (denselben, den auch das
// Kalender-Modul nutzt) und reicht die rohe ID im Event mit. Diese Datei
// importiert bewusst NICHTS aus dem Kalender-Modul (kein Adapter, kein
// Prisma-Zugriff auf Termin/Bereich) — sie liest nur einen HTTP-Header,
// den Q7 an mehreren Stellen bereits auf dieselbe Weise nutzt
// (vgl. lib/kalender/aktueller-mitarbeiter.ts, lib/posteingang/
// aktueller-mitarbeiter.ts). Das hält die Aufgabenliste weiterhin
// unabhängig vom Kalender-Datenmodell.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import { getAktuelleRolle } from "@/lib/auth-server";
import { aufgabenEvents, TERMIN_ANGEFORDERT } from "@/lib/aufgaben-events";

const BodySchema = z
  .object({
    start: z.string().datetime(),
    ende: z.string().datetime(),
  })
  .refine((data) => new Date(data.ende) > new Date(data.start), {
    message: "Ende muss nach Start liegen.",
  });

function formatDatumUhrzeit(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rolle = await getAktuelleRolle();
  const { id } = await context.params;

  const rohBody = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(rohBody);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Anfrage.", errorKind: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const datenZugriff = getAufgabenDatenZugriff();
  const aufgabe = await datenZugriff.getAufgabeMitVerlauf(id);

  if (!aufgabe) {
    return NextResponse.json(
      { error: "Aufgabe nicht gefunden.", errorKind: "not_found" },
      { status: 404 }
    );
  }

  const { start, ende } = parsed.data;

  // Roher Header-Wert, keine Kalender-Logik. Kann null sein.
  const mitarbeiterId = req.headers.get("x-q7-mitarbeiter");

  aufgabenEvents.emit(TERMIN_ANGEFORDERT, {
    meineAufgabeId: aufgabe.id,
    titel: aufgabe.titel,
    beschreibung: aufgabe.beschreibung,
    start,
    ende,
    farbe: aufgabe.farbe,
    mitarbeiterId,
  });

  await datenZugriff.addVerlaufEintrag(
    id,
    "kommentar",
    `Termin angefragt: ${formatDatumUhrzeit(start)} – ${formatDatumUhrzeit(ende)}`,
    rolle
  );

  return NextResponse.json({ ok: true });
}
