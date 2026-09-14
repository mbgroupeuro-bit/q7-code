// Basismodul KI-Agent — Orchestrierung
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\orchestrierung.ts
//
// NEU (Fixrunde): Gemeinsame Werkzeug-Aufruf-Logik, die sowohl von der
// Chat-Route (mit Nachrichtenverlauf) als auch von Routinen (einzelne freie
// Anweisung, siehe Fixrunde Punkt 2) genutzt wird. Vorher war diese Logik
// nur in app/api/chat/route.ts, Routinen hatten eigenen, starren Code
// (routine-engine.ts, jetzt abgelöst) — Leitlinie: KI-Flexibilität statt
// Einzel-Code pro Anwendungsfall, keine Doppelung zwischen Chat und Routine.

import { rufeKIAn, pruefeMitA14, modellFuerAgent, type KIVerlaufNachricht } from "@/lib/rufeKIAn";
import type { KIAgentAdapter } from "./werkzeuge-interface";
import type { WerkzeugDefinition, WerkzeugKontext } from "./types";

// -- Werkzeug-Prompt + Parsing ------------------------------------------

/**
 * Listet verfügbare Werkzeuge im System-Prompt auf, inkl. exakter
 * Eingabe-Anforderungen (eingabeBeschreibung) — Fixrunde Punkt 1, verhindert
 * dass die KI bei Eingabewerten raten muss (z.B. "diese Woche" statt
 * "diese_woche").
 */
export function baueWerkzeugPrompt(werkzeuge: WerkzeugDefinition[]): string {
  if (werkzeuge.length === 0) return "";

  const liste = werkzeuge
    .map(
      (w) =>
        `- id: "${w.id}" — ${w.name}: ${w.beschreibung} (Typ: ${w.typ})\n  Erwartete Eingabe: ${w.eingabeBeschreibung}`
    )
    .join("\n");

  return `\n\nDir stehen folgende Werkzeuge zur Verfügung:\n${liste}\n\nWenn du eines davon nutzen möchtest, antworte AUSSCHLIESSLICH mit einem JSON-Objekt in genau diesem Format, ohne weiteren Text: {"werkzeug_aufruf": {"id": "werkzeug-id", "eingabe": { ... }}}. Halte dich exakt an die beschriebene Eingabe (Feldnamen, erlaubte Werte). Wenn kein Werkzeug nötig ist, antworte ganz normal in Text.`;
}

/**
 * Versucht, eine Antwort als Werkzeug-Aufruf zu interpretieren. Kein Treffer
 * = normale Text-Antwort, kein Fehler (gleiches Muster wie pruefeMitA14).
 */
export function parseWerkzeugAufruf(text: string): { id: string; eingabe: unknown } | null {
  const bereinigt = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  try {
    const ergebnis = JSON.parse(bereinigt);
    if (ergebnis && typeof ergebnis === "object" && ergebnis.werkzeug_aufruf?.id) {
      return { id: String(ergebnis.werkzeug_aufruf.id), eingabe: ergebnis.werkzeug_aufruf.eingabe ?? {} };
    }
  } catch {
    // kein gültiges JSON -> ganz normale Text-Antwort
  }
  return null;
}

// -- Werkzeug-Ausführung (geteilt zwischen Chat und Routine) ------------

export interface WerkzeugVerarbeitungsErgebnis {
  finalReply: string;
  errorKindZusatz?: string;
}

/**
 * Führt einen erkannten Werkzeug-Aufruf aus (lesend: sofort + zweite
 * Formulierungs-Runde; schreibend: nur vorbereiten, SEC-GATE) und liefert
 * die finale Antwort. Wird identisch von Chat-Route und Routine genutzt.
 */
export async function verarbeiteWerkzeugAufruf(
  werkzeugAufruf: { id: string; eingabe: unknown },
  adapter: KIAgentAdapter,
  kontext: WerkzeugKontext,
  model: string,
  agentSystemPrompt: string
): Promise<WerkzeugVerarbeitungsErgebnis> {
  const werkzeug = adapter.getWerkzeug(werkzeugAufruf.id);

  if (!werkzeug) {
    return { finalReply: `Das angeforderte Werkzeug "${werkzeugAufruf.id}" ist nicht verfügbar.` };
  }

  if (werkzeug.typ === "lesend") {
    const ergebnis = await adapter.fuehreLesewerkzeugAus(werkzeug.id, werkzeugAufruf.eingabe, kontext);

    const folgeAntwort = await rufeKIAn(
      model,
      agentSystemPrompt,
      `Werkzeug-Ergebnis für "${werkzeug.name}":\n${ergebnis.text}\n\nFormuliere daraus eine klare Antwort für den Nutzer, ohne technische Details oder JSON.`
    );
    return { finalReply: folgeAntwort.reply };
  }

  // schreibend — SEC-GATE: NUR vorbereiten, NIE hier ausführen.
  const aktion = await adapter.bereiteSchreibaktionVor(werkzeug.id, werkzeugAufruf.eingabe, kontext);
  return {
    finalReply: `${aktion.ergebnisText ?? "Vorschlag vorbereitet."}\n\nDieser Vorschlag wartet jetzt in der Ausgabe auf deine Freigabe.`,
    errorKindZusatz: "aktion_erstellt",
  };
}

// -- Vollständiger Durchlauf für Routinen (Fixrunde Punkt 2) -------------

/**
 * Führt eine freie Anweisung (aus AgentRoutine.anweisung) einmalig aus:
 * KI entscheidet selbst, ob und welches Werkzeug sie braucht — genau wie im
 * Chat, nur ohne Nachrichtenverlauf (Routine hat keinen Dialog). Wirft einen
 * Error bei Gate-Ablehnung oder KI-Fehler — der Aufrufer (adapter-prisma.ts,
 * fuehreRoutineAus) fängt das ab und protokolliert "fehlgeschlagen"
 * (kein stiller Fehler, Code-Review Punkt 1).
 */
export async function fuehreAgentAuftragAus(
  anweisung: string,
  agentLabel: string,
  adapter: KIAgentAdapter,
  kontext: WerkzeugKontext
): Promise<string> {
  const model = modellFuerAgent(agentLabel);
  const systemPrompt = `Du bist der Assistent im Q7 KI-Betriebssystem. Du führst gerade eine wiederkehrende, vom Mitarbeiter selbst eingerichtete Routine aus. Antworte klar, strukturiert und auf Deutsch. Bezeichne dich ausschließlich als "der Assistent".`;
  const werkzeugPrompt = baueWerkzeugPrompt(adapter.getWerkzeuge());

  const antwort = await rufeKIAn(model, systemPrompt + werkzeugPrompt, anweisung);

  const werkzeugAufruf = parseWerkzeugAufruf(antwort.reply);
  let finalReply = antwort.reply;

  if (werkzeugAufruf) {
    const ergebnis = await verarbeiteWerkzeugAufruf(werkzeugAufruf, adapter, kontext, model, systemPrompt);
    finalReply = ergebnis.finalReply;
  }

  const a14Model = modellFuerAgent("A14");
  const gate = await pruefeMitA14(a14Model, finalReply, "Output-Gate (Routine)");
  if (!gate.freigegeben) {
    throw new Error(gate.hinweis ?? "Routinen-Ergebnis wurde vom Sicherheits-Gate nicht freigegeben.");
  }

  return finalReply;
}

export type { KIVerlaufNachricht };
