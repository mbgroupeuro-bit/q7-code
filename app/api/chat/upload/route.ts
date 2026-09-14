import { NextRequest, NextResponse } from "next/server";
import { getAktuellerMitarbeiterId } from "@/lib/chat/aktueller-mitarbeiter";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Ablageort AUSSERHALB von public/ — Dateien sind nur über die geschützte
// Auslieferungs-Route /api/chat/datei/[id] erreichbar, nie direkt per URL.
const UPLOAD_VERZEICHNIS = path.join(process.cwd(), "storage", "chat-uploads");

export async function POST(request: NextRequest) {
  const mitarbeiterId = await getAktuellerMitarbeiterId();
  if (!mitarbeiterId) {
    return NextResponse.json({ fehler: "Kein Mitarbeiter-Kontext." }, { status: 401 });
  }

  const formData = await request.formData();
  const datei = formData.get("datei") as File | null;

  if (!datei) {
    return NextResponse.json({ fehler: "Keine Datei übermittelt." }, { status: 400 });
  }

  await mkdir(UPLOAD_VERZEICHNIS, { recursive: true });

  const eindeutigerName = `${randomUUID()}_${datei.name}`;
  const zielPfad = path.join(UPLOAD_VERZEICHNIS, eindeutigerName);

  const bytes = Buffer.from(await datei.arrayBuffer());
  await writeFile(zielPfad, bytes);

  return NextResponse.json({
    dateiname: datei.name,
    pfad: path.join("chat-uploads", eindeutigerName),
    dateityp: datei.type || "application/octet-stream",
    groesseBytes: bytes.length,
  });
}
