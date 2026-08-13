import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/chat-title
 *
 * Generiert einen kurzen, prägnanten Chat-Titel aus der ersten Nutzer-
 * nachricht eines neuen Chats. Wird von lib/store.tsx (holeHermesTitel)
 * automatisch nach dem Erstellen eines neuen Chats aufgerufen.
 *
 * War bisher NICHT implementiert — Store-Logik (createChat, holeHermesTitel,
 * titelStatus "pending"/"final") existierte schon, der Aufruf lief aber ins
 * Leere (404), weshalb Chats dauerhaft "Neuer Chat" hießen (Q7-UI-012).
 *
 * Modellwahl folgt der bestehenden Konvention: OPENROUTER_MODEL_TITEL als
 * optionale Ausnahme, sonst globaler OPENROUTER_MODEL-Fallback. Bewusst ein
 * schlankes/günstiges Modell sinnvoll, da nur ein kurzer Titel erzeugt wird.
 *
 * Erwarteter Request-Body: { message: string }
 * Erwartete Response:      { titel: string }
 *
 * Fail-Open-Prinzip: schlägt die Titel-Generierung fehl (API-Fehler, kein
 * Key etc.), wird trotzdem ein Titel zurückgegeben (gekürzte Nutzer-
 * nachricht als Fallback) — damit ein Chat NIE dauerhaft "Neuer Chat"
 * heißen bleibt, selbst wenn OpenRouter gerade nicht erreichbar ist.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const STANDARD_MODELL_FALLBACK = "anthropic/claude-sonnet-5";
const MAX_TITEL_LAENGE = 48;

function modellFuerTitel(): string {
  return process.env.OPENROUTER_MODEL_TITEL || process.env.OPENROUTER_MODEL || STANDARD_MODELL_FALLBACK;
}

function fallbackTitel(nachricht: string): string {
  const bereinigt = nachricht.trim().replace(/\s+/g, " ");
  if (bereinigt.length <= MAX_TITEL_LAENGE) return bereinigt || "Neuer Chat";
  return bereinigt.slice(0, MAX_TITEL_LAENGE - 1).trim() + "…";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ titel: "Neuer Chat" }, { status: 200 });
  }

  const nachricht = body.message as string;
  const apiKey = process.env.OPENROUTER_API_KEY;

  // Kein Key -> sofort Fallback, kein Fehlerfall (Fail-Open)
  if (!apiKey) {
    return NextResponse.json({ titel: fallbackTitel(nachricht) }, { status: 200 });
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Q7 KI-Betriebssystem",
      },
      body: JSON.stringify({
        model: modellFuerTitel(),
        messages: [
          {
            role: "system",
            content:
              "Erzeuge aus der folgenden Nutzernachricht einen extrem kurzen Chat-Titel (max. 6 Wörter, auf Deutsch, ohne Anführungszeichen, ohne Punkt am Ende). Antworte NUR mit dem Titel, sonst nichts.",
          },
          { role: "user", content: nachricht },
        ],
        max_tokens: 30,
      }),
    });

    if (!res.ok) {
      console.error("Titel-Generierung: OpenRouter-Fehler", res.status);
      return NextResponse.json({ titel: fallbackTitel(nachricht) }, { status: 200 });
    }

    const data = await res.json();
    const roh: string = data.choices?.[0]?.message?.content ?? "";
    const titel = roh.trim().replace(/^["'„»]|["'“«]$/g, "").slice(0, MAX_TITEL_LAENGE);

    return NextResponse.json({ titel: titel || fallbackTitel(nachricht) }, { status: 200 });
  } catch (err) {
    console.error("Titel-Generierung fehlgeschlagen:", err);
    return NextResponse.json({ titel: fallbackTitel(nachricht) }, { status: 200 });
  }
}
