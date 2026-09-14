import { NextRequest, NextResponse } from "next/server";
import { chatAdapterPrisma } from "@/lib/chat/adapter-prisma";
import { getAktuellerMitarbeiterId } from "@/lib/chat/aktueller-mitarbeiter";
import { readFile } from "fs/promises";
import path from "path";

const STORAGE_BASIS = path.join(process.cwd(), "storage");

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const mitarbeiterId = await getAktuellerMitarbeiterId();
  if (!mitarbeiterId) {
    return NextResponse.json({ fehler: "Kein Mitarbeiter-Kontext." }, { status: 401 });
  }

  const { id: anhangId } = await params;

  const zugriffErlaubt = await chatAdapterPrisma.hatZugriffAufAnhang(mitarbeiterId, anhangId);
  if (!zugriffErlaubt) {
    return NextResponse.json({ fehler: "Kein Zugriff auf diese Datei." }, { status: 403 });
  }

  const anhang = await chatAdapterPrisma.getAnhangDatei(anhangId);
  if (!anhang) {
    return NextResponse.json({ fehler: "Datei nicht gefunden." }, { status: 404 });
  }

  const vollerPfad = path.join(STORAGE_BASIS, anhang.pfad);
  const inhalt = await readFile(vollerPfad);

  return new NextResponse(inhalt, {
    headers: {
      "Content-Type": anhang.dateityp,
      "Content-Disposition": `attachment; filename="${anhang.dateiname}"`,
    },
  });
}
