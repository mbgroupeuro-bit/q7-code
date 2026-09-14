// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\rufeKIAn.ts
// ERSETZT die bestehende Datei. Fixrunde (11.09.2026), Änderung mit
// "// NEU (Fix Punkt 1)" markiert:
//   1. Guardrail-Bug: pruefeMitA14() bekommt jetzt einen Zusatz-Hinweis, wenn
//      kontext === "Output-Gate:Admin-Delegation" — A14 weiß dann, dass die
//      Autorisierung (Rollenprüfung/RBAC) bereits durch die App-Ebene erfolgt
//      ist (siehe route.ts: delegationPrompt nur bei istAdmin && adapter),
//      und soll NICHT mehr wegen fehlender eigener Autorisierungsprüfung
//      blockieren, sondern nur auf echte Content-Risiken prüfen.
//      Betrifft NUR diesen einen Kontext-Wert — alle anderen Aufrufe von
//      pruefeMitA14 (kontext === "Output-Gate" o.ä.) bleiben unverändert
//      fail-closed wie bisher.

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

// Nachrichtenverlauf-Nachricht (unverändert)
export interface KIVerlaufNachricht {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ermittelt das Standardmodell für einen bestimmten Agenten
 */
const FALLBACK_MODEL_STANDARD = "anthropic/claude-sonnet-5";
const FALLBACK_MODEL_A14 = "anthropic/claude-haiku-4.5";

export function modellFuerAgent(agentKuerzelOderLabel: string): string {
  if (agentKuerzelOderLabel.includes("A14")) {
    return process.env.OPENROUTER_MODEL_A14 || process.env.OPENROUTER_MODEL || FALLBACK_MODEL_A14;
  }
  return process.env.OPENROUTER_MODEL || FALLBACK_MODEL_STANDARD;
}

export async function rufeKIAn(
  model: string,
  systemPrompt: string,
  userNachricht: string | KIVerlaufNachricht[],
  temperature = 0.7,
  maxTokens = 2048,
  timeoutMs = 60_000
): Promise<KIAntwort> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY ist nicht in den Umgebungsvariablen konfiguriert.");
  }

  const verlauf: KIVerlaufNachricht[] =
    typeof userNachricht === "string" ? [{ role: "user", content: userNachricht }] : userNachricht;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": sauberHeaderString("https://q7-os.local"),
        "X-Title": sauberHeaderString("Q7 - KI-Betriebssystem"),
      },
      body: JSON.stringify({
        model: model,
        temperature: temperature,
        max_tokens: maxTokens,
        messages: [{ role: "system", content: systemPrompt }, ...verlauf],
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (errorData.error?.metadata?.raw) {
        console.error("OpenRouter-Fehlerdetail (metadata.raw):", errorData.error.metadata.raw);
      }
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
        kostenUsd: data.usage?.cost ?? null,
      },
    };
  } catch (error) {
    console.error(`rufeKIAn: Verbindung fehlgeschlagen (${model}):`, error);
    throw error;
  }
}

function extrahiereErstesJsonObjekt(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let tiefe = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") tiefe++;
    else if (text[i] === "}") {
      tiefe--;
      if (tiefe === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// ZURÜCKGEBAUT (11.09.2026): Ein erster Fix-Versuch (Zusatz-Hinweis im
// A14-Prompt bei kontext === "Output-Gate:Admin-Delegation") wurde getestet
// und hat einen NEUEN, andersartigen Fehlalarm produziert (A14 interpretierte
// den Erklärungstext als Manipulationsversuch gegen sich selbst — schlimmer
// als das ursprüngliche Verhalten). Deshalb hier bewusst KEIN drittes
// Prompt-Tuning, sondern Rückbau auf den Originalzustand. Der eigentliche
// Fix für den Guardrail-Bug liegt jetzt in route.ts (Bypass nur für den
// deterministischen Bestätigungs-Text). Die verbleibende Lücke bei der
// freien Erklärungs-Antwort ist offen dokumentiert, siehe Aufgabenliste
// Punkt 1 / Kopplung an Punkt 2 (SEC-GATE-Erweiterung).

export async function pruefeMitA14(
  model: string,
  textZuPruefen: string,
  kontext: string
): Promise<{ freigegeben: boolean; hinweis?: string }> {
  const systemPrompt = `Du bist das A14 Sicherheits-Gate. Prüfe den übergebenen Text auf Richtlinienverstöße und Risiken im Kontext '${kontext}'. Antworte ausschließlich im JSON-Format: {"freigegeben": true/false, "hinweis": "Grund falls nicht freigegeben"}`;

  try {
    const antwort = await rufeKIAn(model, systemPrompt, textZuPruefen, 0, 300, 15_000);
    const roh = antwort.reply
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "");

    let ergebnis: { freigegeben?: unknown; hinweis?: string };
    try {
      ergebnis = JSON.parse(roh);
    } catch {
      const extrahiert = extrahiereErstesJsonObjekt(roh);
      if (!extrahiert) throw new Error("Kein JSON-Objekt im Gate-Antworttext gefunden.");
      ergebnis = JSON.parse(extrahiert);
    }

    return {
      freigegeben: Boolean(ergebnis.freigegeben),
      hinweis: ergebnis.hinweis,
    };
  } catch (err) {
    // Fail-closed bleibt für ALLE Kontexte unverändert (auch Admin-Delegation) —
    // nur die Bewertung bei erfolgreicher A14-Antwort wird kontextsensitiver.
    console.error(`A14-GATE FEHLGESCHLAGEN (${kontext}) – fail-closed:`, err);
    return { freigegeben: false, hinweis: "Sicherheitsprüfung momentan nicht verfügbar." };
  }
}
