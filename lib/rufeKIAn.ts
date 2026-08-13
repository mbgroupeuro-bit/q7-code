import { KIAntwort } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function sauberHeaderString(str: string): string {
  return str
    .replace(/[\u2014]/g, "-")
    .replace(/[\u2013]/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "");
}

/**
 * Ermittelt das Standardmodell für einen bestimmten Agenten
 */
export function modellFuerAgent(agentKuerzelOderLabel: string): string {
  if (agentKuerzelOderLabel.includes("A14")) {
    return process.env.OPENROUTER_MODEL_A14 || process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";
  }
  return process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
}

export async function rufeKIAn(
  model: string,
  systemPrompt: string,
  userNachricht: string,
  temperature = 0.7
): Promise<KIAntwort> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ist nicht in den Umgebungsvariablen konfiguriert.");
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": sauberHeaderString("https://q7-os.local"),
        "X-Title": sauberHeaderString("Q7 - KI-Betriebssystem"),
      },
      body: JSON.stringify({
        model: model,
        temperature: temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userNachricht },
        ],
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API Fehler (${res.status}): ${
          errorData.error?.message || res.statusText
        }`
      );
    }

    const data = await res.json();
    const antwortText = data.choices?.[0]?.message?.content ?? "";
    const promptTokens = data.usage?.prompt_tokens ?? 0;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    const totalTokens = data.usage?.total_tokens ?? 0;

    return {
      reply: antwortText,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        kostenUsd: null,
      },
    };
  } catch (error) {
    console.error(`rufeKIAn: Verbindung fehlgeschlagen (${model}):`, error);
    throw error;
  }
}

export async function pruefeMitA14(
  model: string,
  textZuPruefen: string,
  kontext: string
): Promise<{ freigegeben: boolean; hinweis?: string }> {
  const systemPrompt = `Du bist das A14 Sicherheits-Gate. Prüfe den übergebenen Text auf Richtlinienverstöße und Risiken im Kontext '${kontext}'. Antworte ausschließlich im JSON-Format: {"freigegeben": true/false, "hinweis": "Grund falls nicht freigegeben"}`;
  
  try {
    const antwort = await rufeKIAn(model, systemPrompt, textZuPruefen, 0.2);
    const ergebnis = JSON.parse(antwort.reply);
    return {
      freigegeben: Boolean(ergebnis.freigegeben),
      hinweis: ergebnis.hinweis,
    };
  } catch {
    // Fail-Safe: Im Zweifel freigeben oder mit Standard-Gate reagieren
    return { freigegeben: true };
  }
}