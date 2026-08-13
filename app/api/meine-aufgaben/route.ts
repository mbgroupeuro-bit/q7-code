// app/api/aufgabe-chat/route.ts
// Neu 05.08.2026 — speichert Admin-Antworten aus dem Posteingang-Antwortpanel.
// V1: reine Persistenz in AufgabeChat. Echter Kanal-Versand (WhatsApp/Telegram/
// Facebook/Mail-Ausgang) folgt erst mit dem jeweiligen Connector.

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    process.env.Q7_AGENTEN_DB_URL
      ? { datasources: { db: { url: process.env.Q7_AGENTEN_DB_URL } } }
      : undefined
  );
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const aufgabeId = body?.aufgabe_id;
  const nachricht = typeof body?.nachricht === "string" ? body.nachricht.trim() : "";

  if (!aufgabeId || typeof aufgabeId !== "string") {
    return NextResponse.json({ fehler: "aufgabe_id fehlt." }, { status: 400 });
  }
  if (!nachricht) {
    return NextResponse.json({ fehler: "nachricht ist leer." }, { status: 400 });
  }

  const aufgabe = await prisma.aufgabe.findUnique({ where: { id: aufgabeId } });
  if (!aufgabe) {
    return NextResponse.json({ fehler: "Aufgabe nicht gefunden." }, { status: 404 });
  }

  const eintrag = await prisma.aufgabeChat.create({
    data: {
      aufgabe_id: aufgabeId,
      absender: "admin",
      nachricht,
    },
  });

  return NextResponse.json({ eintrag }, { status: 201 });
}
