import { NextRequest, NextResponse } from "next/server";
import { chatAdapterPrisma } from "@/lib/chat/adapter-prisma";
import { getAktuellerMitarbeiterId } from "@/lib/chat/aktueller-mitarbeiter";

// GET /api/chat/nachrichten?kanalId=...          -> Kanal-Verlauf
// GET /api/chat/nachrichten?mitEmpfaengerId=...   -> Direktnachrichten-Verlauf
// Optionaler Parameter "seitId" für Polling (nur neuere Nachrichten laden).
export async function GET(request: NextRequest) {
  const mitarbeiterId = await getAktuellerMitarbeiterId();
  if (!mitarbeiterId) {
    return NextResponse.json({ fehler: "Kein Mitarbeiter-Kontext." }, { status: 401 });
  }

  const kanalId = request.nextUrl.searchParams.get("kanalId");
  const mitEmpfaengerId = request.nextUrl.searchParams.get("mitEmpfaengerId");
  const seitId = request.nextUrl.searchParams.get("seitId") ?? undefined;

  if (!kanalId && !mitEmpfaengerId) {
    return NextResponse.json(
      { fehler: "kanalId oder mitEmpfaengerId muss angegeben werden." },
      { status: 400 }
    );
  }

  const nachrichten = kanalId
    ? await chatAdapterPrisma.getNachrichtenKanal(kanalId, seitId)
    : await chatAdapterPrisma.getNachrichtenDirekt(mitarbeiterId, mitEmpfaengerId as string, seitId);

  return NextResponse.json(nachrichten);
}

// POST /api/chat/nachrichten
// Body: { text: string, kanalId?: string, empfaengerId?: string, anhaenge?: [...] }
export async function POST(request: NextRequest) {
  const mitarbeiterId = await getAktuellerMitarbeiterId();
  if (!mitarbeiterId) {
    return NextResponse.json({ fehler: "Kein Mitarbeiter-Kontext." }, { status: 401 });
  }

  const body = await request.json();
  const { text, kanalId, empfaengerId, anhaenge } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ fehler: "Nachrichtentext darf nicht leer sein." }, { status: 400 });
  }
  if (!kanalId && !empfaengerId) {
    return NextResponse.json(
      { fehler: "Entweder kanalId oder empfaengerId muss angegeben werden." },
      { status: 400 }
    );
  }

  try {
    const nachricht = await chatAdapterPrisma.createNachricht({
      absenderId: mitarbeiterId,
      text: text.trim(),
      kanalId,
      empfaengerId,
      anhaenge,
    });
    return NextResponse.json(nachricht, { status: 201 });
  } catch (fehler) {
    return NextResponse.json({ fehler: (fehler as Error).message }, { status: 400 });
  }
}
