// app/api/termine/route.ts
// Neu 02.08.2026 — Kalender-Feature

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

export async function GET() {
  try {
    const termine = await prisma.termin.findMany({ orderBy: { start: "asc" } });
    return NextResponse.json({ termine });
  } catch (error) {
    console.error("GET /api/termine fehlgeschlagen:", error);
    return NextResponse.json({ error: "Termine konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titel, beschreibung, start, ende, farbe } = body as {
      titel?: string;
      beschreibung?: string;
      start?: string;
      ende?: string;
      farbe?: string;
    };

    if (!titel?.trim() || !start || !ende) {
      return NextResponse.json({ error: "Titel, Start und Ende sind erforderlich." }, { status: 400 });
    }

    const neuerTermin = await prisma.termin.create({
      data: {
        titel: titel.trim(),
        beschreibung: beschreibung?.trim() || null,
        start: new Date(start),
        ende: new Date(ende),
        farbe: farbe || "blau",
      },
    });

    return NextResponse.json({ termin: neuerTermin }, { status: 201 });
  } catch (error) {
    console.error("POST /api/termine fehlgeschlagen:", error);
    return NextResponse.json({ error: "Termin konnte nicht angelegt werden." }, { status: 500 });
  }
}
