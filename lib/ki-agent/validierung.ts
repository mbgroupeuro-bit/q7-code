// Basismodul KI-Agent — Validierung
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\validierung.ts
//
// Zentrale Zod-Prüfung, die JEDER Adapter vor jeder Werkzeug-Ausführung
// aufruft (Grill-Me-Entscheidung Punkt 2: Validierung pro Werkzeug, statt
// ungeprüftes JSON durchzureichen — deckt sich mit der im Code-Review
// vorgeschlagenen Lösung für app/api/chat/route.ts).

import type { ZodError } from "zod";
import type { WerkzeugDefinition } from "./types";

export interface ValidierungsErgebnis<T> {
  gueltig: boolean;
  daten?: T;
  fehlerText?: string;
}

/**
 * Prüft rohe Eingabedaten (z.B. von der KI erzeugtes JSON) gegen das
 * eingabeSchema des Werkzeugs. Wirft NIE einen Fehler — gibt stattdessen ein
 * klares Ergebnis zurück (fail-closed statt stiller Fehler, siehe A14-Gate-
 * Lehre aus dem Code-Review).
 */
export function validiereWerkzeugEingabe<T>(
  werkzeug: WerkzeugDefinition<T>,
  rohEingabe: unknown
): ValidierungsErgebnis<T> {
  const ergebnis = werkzeug.eingabeSchema.safeParse(rohEingabe);

  if (ergebnis.success) {
    return { gueltig: true, daten: ergebnis.data };
  }

  return {
    gueltig: false,
    fehlerText: formatiereZodFehler(ergebnis.error),
  };
}

function formatiereZodFehler(fehler: ZodError): string {
  return fehler.issues
    .map((i) => `${i.path.join(".") || "(Feld)"}: ${i.message}`)
    .join(" · ");
}
