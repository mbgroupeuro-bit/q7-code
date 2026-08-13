// app/api/meine-aufgaben/aus-kanal/route.ts
// Neu 01.08.2026 — Quelle "kanal_verlegt" laut Q7_Freigabe_Rechte_Aufgaben_v1_1 Abschnitt 3.
// VEREINFACHUNG (V1): Admin bestätigt manuell per Klick auf der Eingang-Seite
// (Button = Bestätigung). Automatische KI-Erkennung "Rückruf gewünscht" durch A01
// ist noch NICHT gebaut — offener Punkt für spätere Sitzung.

import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { aufgabe_id, zugewiesen_an } = body as { aufgabe_id?: string; zugewiesen_an?: string };

    if (!aufgabe_id) {
      return NextResponse.json({ error: "aufgabe_id ist erforderlich." }, { status: 400 });
    }

    const kanalTask = await prisma.aufgabe.findUnique({ where: { id: aufgabe_id } });
    if (!kanalTask) {
      return NextResponse.json({ error: "Kanal-Task nicht gefunden." }, { status: 404 });
    }

    const neueAufgabe = await prisma.meineAufgabe.create({
      data: {
        titel: `${kanalTask.anliegen_typ ?? "Eingang"} — ${kanalTask.absender}`,
        beschreibung: kanalTask.inhalt,
        zugewiesen_an: zugewiesen_an?.trim() || "admin",
        quelle: "kanal_verlegt",
        aufgabe_id: kanalTask.id,
      },
    });

    return NextResponse.json({ aufgabe: neueAufgabe }, { status: 201 });
  } catch (error) {
    console.error("POST /api/meine-aufgaben/aus-kanal fehlgeschlagen:", error);
    return NextResponse.json({ error: "Verlegung fehlgeschlagen." }, { status: 500 });
  }
}
