import { NextRequest, NextResponse } from "next/server";
import { ladeIndex, speichereAblageDatei, loescheAblageDatei } from "@/lib/ablage";

/**
 * /api/ablage
 *
 * Verwaltung freier Nutzer-/Kundendateien (01_Ablage, siehe
 * c_Q7_datenbank/01_Mandanten_Datenbank/01_Ablage — Kommentar-Korrektur
 * 26.07.2026, vorheriger Verweis "08_ABLAGE" war veraltetes Ordnerschema).
 * Getrennt von /api/wissen (globales Fachwissen, 06_WISSEN) — siehe
 * Checkpoint-Entscheidung zur sauberen Scope-Trennung.
 *
 * POST   { dateiname, inhaltBase64, mimeType, kategorie?, space? } -> neuer Eintrag
 * GET    -> Liste aller Ablage-Einträge (Metadaten)
 * DELETE { id } -> löscht Eintrag + Datei
 *
 * KORRIGIERT (26.07.2026, Q7-M-078 — Black-Box-Verstoß):
 * Fehlermeldungen mit internem "SEC-GATE:"-Präfix wurden bisher 1:1 an den
 * Client durchgereicht (landete z.B. im FileUpload.tsx-alert() sichtbar für
 * den Lizenznehmer). Der Präfix wird jetzt vor der Rückgabe entfernt — die
 * vollständige, unveränderte Meldung bleibt weiterhin im Server-Log
 * (console.error) erhalten.
 */

/** Entfernt einen führenden "SEC-GATE:"-Präfix aus einer Fehlermeldung, bevor
 * sie an den Client geht. Interne Sicherheits-Begriffe dürfen laut
 * Black-Box-Prinzip (L3 Architekturprinzip 3, L4 Namenskonvention) nicht im
 * Lizenznehmer-UI erscheinen — auch nicht über Fehlertexte. */
function bereinigeFuerClient(meldung: string): string {
  return meldung.replace(/^SEC-GATE:\s*/i, "");
}

export async function GET() {
  try {
    const index = await ladeIndex();
    return NextResponse.json({ eintraege: index });
  } catch (err) {
    console.error("Ablage-Index konnte nicht geladen werden:", err);
    return NextResponse.json(
      { error: "Ablage-Index konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body.dateiname !== "string" ||
    typeof body.inhaltBase64 !== "string" ||
    typeof body.mimeType !== "string"
  ) {
    return NextResponse.json(
      { error: "Felder 'dateiname', 'inhaltBase64' und 'mimeType' sind erforderlich." },
      { status: 400 }
    );
  }

  const { dateiname, inhaltBase64, mimeType, kategorie, space } = body as {
    dateiname: string;
    inhaltBase64: string;
    mimeType: string;
    kategorie?: string;
    space?: string;
  };

  try {
    const eintrag = await speichereAblageDatei(
      dateiname,
      inhaltBase64,
      mimeType,
      kategorie || "Sonstiges",
      space
    );
    return NextResponse.json({ eintrag }, { status: 201 });
  } catch (err) {
    const meldung = err instanceof Error ? err.message : "Unbekannter Fehler beim Speichern.";
    const istSecGateFehler = meldung.startsWith("SEC-GATE:");
    // Voller interner Text (inkl. SEC-GATE-Präfix) bleibt im Server-Log:
    console.error("Ablage-Upload fehlgeschlagen:", meldung);
    return NextResponse.json(
      { error: bereinigeFuerClient(meldung) },
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
    await loescheAblageDatei(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ablage-Löschung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
