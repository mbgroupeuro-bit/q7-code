import { NextResponse } from "next/server";
import { chatAdapterPrisma } from "@/lib/chat/adapter-prisma";
import { getAktuellerMitarbeiterId } from "@/lib/chat/aktueller-mitarbeiter";

export async function GET() {
  const mitarbeiterId = await getAktuellerMitarbeiterId();
  if (!mitarbeiterId) {
    return NextResponse.json({ fehler: "Kein Mitarbeiter-Kontext." }, { status: 401 });
  }

  const kanaele = await chatAdapterPrisma.getSichtbareKanaele(mitarbeiterId);
  return NextResponse.json(kanaele);
}
