import { NextRequest, NextResponse } from "next/server";
import { ladeIndex, speichereWissenDatei, loescheWissenDatei } from "@/lib/wissen";

/**
 * /api/wissen
 *
 * Verwaltung des globalen Fachwissens (06_WISSEN, L7).
 * NICHT zu verwechseln mit Kunden-/Space-Dokumenten (05_UNTERNEHMEN / künftig 08_ABLAGE).
 * Dieser Endpoint ist bewusst nur für global-scope-Wissen (Frameworks, Methodik,
 * Agenten-Fachwissen) gedacht — siehe Checkpoint-Klärung "was kommt in 06_WISSEN".
 *
 * POST   { dateiname: string, inhalt: string, kategorie?: string } -> neuer/aktualisierter Eintrag
 * GET    -> Liste aller Wissenseinträge (Metadaten, kein Volltext)
 * DELETE { id: string } -> löscht Eintrag + Datei
 */

export async function GET() {
  try {
    const index = await ladeIndex();
    return NextResponse.json({ eintraege: index });
  } catch (err) {
    console.error("Wissen-Index konnte nicht geladen werden:", err);
    return NextResponse.json(
      { error: "Wissen-Index konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.dateiname !== "string" || typeof body.inhalt !== "string") {
    return NextResponse.json(
      { error: "Felder 'dateiname' und 'inhalt' sind erforderlich." },
      { status: 400 }
    );
  }

  const { dateiname, inhalt, kategorie } = body as {
    dateiname: string;
    inhalt: string;
    kategorie?: string;
  };

  try {
    const eintrag = await speichereWissenDatei(dateiname, inhalt, kategorie || "Allgemein");
    return NextResponse.json({ eintrag }, { status: 201 });
  } catch (err) {
    const meldung = err instanceof Error ? err.message : "Unbekannter Fehler beim Speichern.";
    // SEC-GATE-Ablehnungen kommen als Error mit "SEC-GATE:"-Präfix -> 400 statt 500
    const istSecGateFehler = meldung.startsWith("SEC-GATE:");
    console.error("Wissen-Upload fehlgeschlagen:", meldung);
    return NextResponse.json(
      { error: meldung },
      { status: istSecGateFehler ? 400 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "Feld 'id' ist erforderlich." }, { status: 400 });
  }

  try {
    await loescheWissenDatei(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Wissen-Löschung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
