// Basismodul KI-Agent — Kern-Typen
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\types.ts
//
// Diese Datei definiert das feste Vokabular, mit dem Werkzeuge, Adapter und
// die Chat-Logik miteinander sprechen. Sie kennt keine Prisma- oder
// NestJS-Details — das ist bewusst so (Interface+Adapter-Pattern, siehe
// Basismodul-Konzept Abschnitt 4a).

import type { ZodType } from "zod";

/**
 * Einheitlicher Fehler für Adapter-Methoden (unbekanntes Werkzeug, falscher
 * Werkzeug-Typ, ungültige Eingabe usw.) — status ist der HTTP-Status, den die
 * aufrufende API-Route zurückgeben soll. Verhindert stille Fehler (Lehre aus
 * dem A14-Gate-Problem, Code-Review Punkt 1).
 */
export class WerkzeugFehler extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WerkzeugFehler";
    this.status = status;
  }
}

// ---------------------------------------------------------------------
// Werkzeug-Definition
// ---------------------------------------------------------------------

/**
 * "lesend"    -> darf die KI ohne Freigabe direkt ausführen (nur Datenabfrage).
 * "schreibend" -> erzeugt immer erst einen AgentAktion-Vorschlag (SEC-GATE),
 *                 echte Ausführung erst nach menschlicher Freigabe.
 */
export type WerkzeugTyp = "lesend" | "schreibend";

/**
 * Kontext, den JEDES Werkzeug bei jeder Ausführung bekommt — unabhängig davon,
 * ob es lesend oder schreibend ist. Enthält die Berechtigungsgrundlage
 * (Admin-Entscheidung: Agent sieht nur, was der fragende Mitarbeiter auch sieht).
 */
export interface WerkzeugKontext {
  mitarbeiterId: string;
  bereichId: string | null;
  siehtAlleBereiche: boolean;
  agentChatId: string | null;
}

/**
 * Ergebnis eines LESENDEN Werkzeugs — wird direkt im Chat + Ausgabe gespiegelt
 * (Admin-Entscheidung: alles kommt im Chat UND in der Ausgabe an).
 */
export interface WerkzeugLeseErgebnis {
  text: string;               // für Chat-Verlauf, verständlich formuliert
  daten?: unknown;             // optional strukturierte Daten (z.B. für Tabellen-Darstellung)
}

/**
 * Ergebnis der VORBEREITUNG eines schreibenden Werkzeugs — noch KEINE
 * Ausführung, landet als AgentAktion mit Status "wartet_auf_freigabe".
 */
export interface WerkzeugSchreibVorschlag {
  typ: string;                 // z.B. "Rechnung erstellen" — Anzeige in Ausgabe
  zusammenfassung: string;     // Klartext für Chat + Ausgabe, was passieren würde
  eingabeDaten: unknown;       // geprüfte, vom Zod-Schema validierte Eingabedaten
}

/**
 * Ergebnis der ECHTEN Ausführung eines schreibenden Werkzeugs — wird erst
 * nach Freigabe UND Re-Validierung aufgerufen (Grill-Me-Entscheidung).
 */
export interface WerkzeugAusfuehrungsErgebnis {
  erfolg: boolean;
  ergebnisText: string;
  fehlermeldung?: string;
}

/**
 * Eine Werkzeug-Definition. TEingabe ist der Typ der Eingabedaten, geprüft
 * durch eingabeSchema (Zod) — siehe Grill-Me-Entscheidung "Validierung pro
 * Werkzeug", deckt sich mit der im Code-Review vorgeschlagenen Zod-Lösung
 * für app/api/chat/route.ts.
 */
export interface WerkzeugDefinition<TEingabe = unknown> {
  id: string;                          // z.B. "crm-top-artikel"
  name: string;                        // z.B. "Top 5 verkaufte Artikel"
  beschreibung: string;
  kategorie: string;                   // frei, projektspezifisch (Sales, Produktion, ...)
  typ: WerkzeugTyp;
  eingabeSchema: ZodType<TEingabe>;
  // NEU (Fixrunde Punkt 1): Klartext-Beschreibung der erwarteten Eingabefelder
  // (Namen, Typen, erlaubte Werte), die der KI im System-Prompt mitgegeben
  // wird — verhindert Raten der KI (z.B. "diese Woche" statt "diese_woche").
  // Bewusst als Klartext statt automatischer Zod-Introspektion: robuster,
  // keine Abhängigkeit von internen Zod-Strukturen, die sich zwischen
  // Zod-Versionen ändern können.
  eingabeBeschreibung: string;

  // NEU (Punkt 2, 11.09.2026): Nur bei typ === "schreibend" relevant. Wenn
  // true, wird die Aktion nach menschlicher Freigabe NICHT sofort
  // ausgeführt, sondern erst zum übernächsten 07:00-Slot (min. 24h Abstand,
  // siehe adapter-prisma.ts). Default false/undefined = normales Verhalten
  // (sofortige Ausführung nach Freigabe, wie bisher). Aktuell nur für das
  // Werkzeug "system-autonomie-aendern" gesetzt.
  erfordertCoolingOff?: boolean;

  // NEU (Punkt 2, 11.09.2026): Wenn true, wird dieses Werkzeug NICHT über
  // baueWerkzeugPrompt() an die KI gemeldet (siehe route.ts-Filter) — kann
  // also nicht über den generischen werkzeug_aufruf-Weg von irgendeinem
  // Chat-Nutzer ausgelöst werden. Nur direkt aus Code heraus aufrufbar
  // (z.B. bereiteSchreibaktionVor mit fester Werkzeug-Id). Aktuell nur für
  // "system-autonomie-aendern" gesetzt, dessen Freigabe-Erkennung weiterhin
  // über den separaten, Admin-only Delegation-Prompt läuft.
  nurInternAufrufbar?: boolean;

  // Nur bei typ === "lesend" aufgerufen.
  lesen?: (eingabe: TEingabe, kontext: WerkzeugKontext) => Promise<WerkzeugLeseErgebnis>;

  // Nur bei typ === "schreibend" aufgerufen — bereitet NUR vor, schreibt nichts.
  vorbereiten?: (eingabe: TEingabe, kontext: WerkzeugKontext) => Promise<WerkzeugSchreibVorschlag>;

  // Nur bei typ === "schreibend" aufgerufen — NACH Freigabe + Re-Validierung.
  ausfuehren?: (eingabeDaten: TEingabe, kontext: WerkzeugKontext) => Promise<WerkzeugAusfuehrungsErgebnis>;

  // Prüft vor der Ausführung (nicht vor dem Vorschlag), ob referenzierte
  // Objekte noch gültig sind (z.B. Kunde nicht gelöscht, Preis unverändert).
  // Grill-Me-Entscheidung Punkt 1 (Re-Validierung bei Freigabe).
  revalidieren?: (eingabeDaten: TEingabe, kontext: WerkzeugKontext) => Promise<{ gueltig: boolean; hinweis?: string }>;
}

// ---------------------------------------------------------------------
// Delegation (3-Stufen-Schalter)
// ---------------------------------------------------------------------

export type DelegationStufe = "keine" | "teil" | "komplett";

export interface DelegationEinstellung {
  stufe: DelegationStufe;
  // Aktuell ungenutzt (Platzhalter für spätere Einzel-Häkchen bei "teil"),
  // siehe Grill-Me-Entscheidung.
  einzelWerkzeuge: string[] | null;
}

// ---------------------------------------------------------------------
// Routinen (konfigurierbar pro Mitarbeiter, z.B. täglicher Arbeitsplan)
// ---------------------------------------------------------------------
// Bewusst gekapselt für spätere Auskopplung als eigenes Basismodul "Routinen"
// (siehe Notiz zum KI-Agent-Basismodul) — Typen hier bleiben unabhängig vom
// restlichen KI-Agent-Vokabular verständlich, falls sie später in eine eigene
// Datei/eigenes Modul wandern.

export type Wochentag = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";

export interface AgentRoutine {
  id: string;
  mitarbeiterId: string;
  typ: string;                 // z.B. "arbeitsplan" — frei, nur noch Anzeige-Label
  // NEU (Fixrunde Punkt 2): freie Anweisung statt fester Typ-Logik im Code.
  // Die KI führt diese Anweisung über dieselbe Werkzeug-Infrastruktur wie der
  // Chat aus (siehe orchestrierung.ts) — kein Code pro "Routinen-Art" nötig.
  anweisung: string;
  uhrzeit: string;              // Format "HH:MM"
  wochentage: Wochentag[];
  aktiv: boolean;
  letzterLaufAm: string | null;
}

// ---------------------------------------------------------------------
// AgentAktion (Spiegel des Prisma-Modells, für die Anwendungslogik)
// ---------------------------------------------------------------------

export type AgentAktionStatus =
  | "wartet_auf_freigabe"
  | "freigegeben"
  | "abgelehnt"
  | "ausgefuehrt"
  | "fehlgeschlagen";

export interface AgentAktion {
  id: string;
  werkzeugId: string | null;
  typ: string;
  eingabeDaten: unknown;
  status: AgentAktionStatus;
  mitarbeiterId: string;
  bereichId: string | null;
  agentChatId: string | null;
  ergebnisText: string | null;
  fehlermeldung: string | null;
  erstelltAm: string;
  entschiedenAm: string | null;
  entschiedenVon: string | null;
  ausgefuehrtAm: string | null;
  // NEU (Punkt 2, 11.09.2026): Spiegel von Prisma-Feld
  // "geplante_ausfuehrung_am". Nur gesetzt bei Werkzeugen mit
  // erfordertCoolingOff=true, sonst immer null.
  geplanteAusfuehrungAm: string | null;
}
