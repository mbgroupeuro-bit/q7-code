// Basismodul KI-Agent — Adapter-Interface
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\werkzeuge-interface.ts
//
// Dieses Interface kennt jeder Adapter erfüllen muss (Prisma-Adapter für
// Q7/CRM standalone, Connector-Adapter für ERP/CRM-im-ERP — siehe
// Basismodul-Konzept Abschnitt 4a). Die UI/Chat-Logik kennt NUR dieses
// Interface, nie die konkrete Implementierung darunter.

import type {
  WerkzeugDefinition,
  WerkzeugKontext,
  WerkzeugLeseErgebnis,
  DelegationEinstellung,
  DelegationStufe,
  AgentAktion,
  AgentRoutine,
  Wochentag,
  WerkzeugAusfuehrungsErgebnis,
} from "./types";

/**
 * Fester Vertrag, den jeder Adapter erfüllen muss. Der Chat/Studio-Code ruft
 * ausschließlich diese Methoden auf — nie direkt Prisma oder die
 * Connector-Schicht.
 */
export interface KIAgentAdapter {
  // -- Werkzeuge -------------------------------------------------------

  /** Liefert alle für dieses Zielsystem registrierten Werkzeuge (aus der
   *  festen Werkzeug-Liste der jeweiligen Kopie, z.B. werkzeuge-crm.ts). */
  getWerkzeuge(): WerkzeugDefinition[];

  /** Sucht ein einzelnes Werkzeug per Id, oder null wenn unbekannt. */
  getWerkzeug(werkzeugId: string): WerkzeugDefinition | null;

  // -- Lesende Ausführung (sofort, keine Freigabe nötig) ---------------

  fuehreLesewerkzeugAus(
    werkzeugId: string,
    eingabe: unknown,
    kontext: WerkzeugKontext
  ): Promise<WerkzeugLeseErgebnis>;

  // -- Schreibende Ausführung (zweistufig, SEC-GATE) --------------------

  /** Schritt 1: bereitet vor, schreibt NICHTS. Erzeugt eine AgentAktion mit
   *  Status "wartet_auf_freigabe" und gibt sie zurück. */
  bereiteSchreibaktionVor(
    werkzeugId: string,
    eingabe: unknown,
    kontext: WerkzeugKontext
  ): Promise<AgentAktion>;

  /** Schritt 2: wird NUR nach menschlicher Freigabe aufgerufen. Führt intern
   *  zuerst revalidieren() aus (Grill-Me-Punkt 1) und bricht bei
   *  Ungültigkeit ab, statt blind zu schreiben.
   *  HINWEIS (Punkt 2, 11.09.2026): Wird sowohl direkt bei sofortiger
   *  Freigabe (über freigebenAktion) als auch verzögert nach Cooling-off
   *  (über fuehreCoolingOffAktionAus) aufgerufen — akzeptiert deshalb Status
   *  "wartet_auf_freigabe" UND "freigegeben". */
  fuehreSchreibaktionAus(aktionId: string, kontext: WerkzeugKontext): Promise<WerkzeugAusfuehrungsErgebnis>;

  /** NEU (Punkt 2, 11.09.2026): Entscheidungspunkt bei menschlicher Freigabe
   *  in der Ausgabe. Prüft, ob das zugehörige Werkzeug erfordertCoolingOff
   *  gesetzt hat:
   *  - false/undefined (Normalfall, alle bisherigen Werkzeuge): führt sofort
   *    aus (ruft intern fuehreSchreibaktionAus auf) -> { terminiert: false }.
   *  - true (aktuell nur "system-autonomie-aendern"): führt NICHT aus,
   *    sondern setzt Status "freigegeben" + geplante_ausfuehrung_am
   *    (übernächster 07:00-Slot, min. 24h Abstand) -> { terminiert: true }. */
  freigebenAktion(
    aktionId: string,
    kontext: WerkzeugKontext
  ): Promise<
    | { terminiert: true; aktion: AgentAktion }
    | { terminiert: false; ergebnis: WerkzeugAusfuehrungsErgebnis }
  >;

  /** Lehnt eine wartende Aktion ab, ohne sie auszuführen. */
  lehneAktionAb(aktionId: string, kontext: WerkzeugKontext): Promise<void>;

  /** Liefert alle Aktionen mit Status "wartet_auf_freigabe" für die Ausgabe-Seite. */
  getOffeneAktionen(kontext: WerkzeugKontext): Promise<AgentAktion[]>;

  // -- Cooling-off (Punkt 2, 11.09.2026) --------------------------------
  // Analog zum bestehenden Routinen-Cron-Muster (getFaelligeRoutinen /
  // fuehreRoutineAus): periodischer Check, kein aktiver Nutzer-Kontext
  // vorhanden — der Kontext wird beim Ausführen aus dem gespeicherten
  // mitarbeiter_id der Aktion neu geladen (siehe adapter-prisma.ts).

  /** Wird vom periodischen Cron-Check aufgerufen — liefert alle Aktionen mit
   *  Status "freigegeben", deren geplante_ausfuehrung_am erreicht ist. */
  getFaelligeCoolingOffAktionen(jetzt: Date): Promise<AgentAktion[]>;

  /** Führt eine fällige Cooling-off-Aktion aus: lädt den Mitarbeiter-Kontext
   *  aus der Aktion, ruft intern fuehreSchreibaktionAus auf. */
  fuehreCoolingOffAktionAus(aktionId: string): Promise<void>;

  // -- Delegation (3-Stufen-Schalter, global) ---------------------------

  getDelegation(): Promise<DelegationEinstellung>;

  // NEU (Fixrunde): optionale Liste einzelner Werkzeug-IDs, die bei Stufe
  // "teil" automatisch laufen dürfen — schließt den bisherigen Platzhalter.
  setDelegationStufe(
    stufe: DelegationStufe,
    geaendertVon: string,
    einzelWerkzeugIds?: string[]
  ): Promise<DelegationEinstellung>;

  /** Prüft, ob ein Werkzeug bei der aktuellen Delegation-Stufe automatisch
   *  (ohne Freigabe) ausgeführt werden darf. Bei "teil" aktuell immer false,
   *  solange einzelWerkzeuge nicht genutzt wird (siehe types.ts). */
  darfAutomatischAusgefuehrtWerden(werkzeugId: string): Promise<boolean>;

  // -- Routinen (konfigurierbar pro Mitarbeiter) -------------------------
  // Ersetzt den ursprünglich fest auf 8:00 geplanten Arbeitsplan-Cron-Job
  // (Admin-Entscheidung: Mitarbeiter legt Uhrzeit + Wochentage selbst fest).
  // Bewusst gekapselt für spätere Auskopplung als eigenes Basismodul
  // "Routinen" — siehe Notiz im Schema.

  getRoutinen(mitarbeiterId: string): Promise<AgentRoutine[]>;

  erstelleRoutine(
    mitarbeiterId: string,
    daten: { typ: string; anweisung: string; uhrzeit: string; wochentage: Wochentag[] }
  ): Promise<AgentRoutine>;

  aktualisiereRoutine(
    routineId: string,
    daten: Partial<{ anweisung: string; uhrzeit: string; wochentage: Wochentag[]; aktiv: boolean }>
  ): Promise<AgentRoutine>;

  loescheRoutine(routineId: string): Promise<void>;

  /** Wird vom periodischen Cron-Check aufgerufen (z.B. alle 15 Minuten) —
   *  liefert alle Routinen, die JETZT fällig sind (Uhrzeit erreicht,
   *  heutiger Wochentag aktiv, noch nicht heute gelaufen). */
  getFaelligeRoutinen(jetzt: Date): Promise<AgentRoutine[]>;

  /** Führt eine einzelne fällige Routine aus: erzeugt z.B. den Arbeitsplan,
   *  legt ihn als Chat-Nachricht ab (gespiegelt in Ausgabe), protokolliert
   *  den Lauf in AgentCronLauf und setzt letzterLaufAm. */
  fuehreRoutineAus(routineId: string): Promise<void>;
}
