// D:\Projekt2027\Basismodule\Posteingang\app\api\posteingang\[id]\antwort\route.ts
//
// Ersetzt die alte Datei app/api/aufgabe-chat/route.ts (kann nach Umstellung
// entfernt werden). Speichert Admin-Antworten aus dem Posteingang-
// Antwortpanel. V1: reine Persistenz in PosteingangChat. Echter Kanal-
// Versand (WhatsApp/Telegram/Facebook/Mail-Ausgang) folgt erst mit dem
// jeweiligen Connector (unverändert gegenüber Vorgänger-Datei).

import { NextRequest, NextResponse } from "next/server";
import { prismaPosteingangAdapter as datenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const body = await req.json().catch(() => null);
  const nachricht = typeof body?.nachricht === "string" ? body.nachricht.trim() : "";

  if (!nachricht) {
    return NextResponse.json({ error: "nachricht ist leer." }, { status: 400 });
  }

  try {
    const eintrag = await datenQuelle.antwortSpeichern(id, nachricht, "admin");
    return NextResponse.json({ eintrag }, { status: 201 });
  } catch (err) {
    console.error(`POST /api/posteingang/${id}/antwort fehlgeschlagen:`, err);
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }
}
