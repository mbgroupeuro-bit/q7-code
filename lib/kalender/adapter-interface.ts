// lib/kalender/adapter-interface.ts
// Festes Daten-Interface für das Kalender-Basismodul.
// Jedes Zielsystem (Q7 direkt/Prisma, Q7-ERP/NestJS ...) bekommt einen
// eigenen Adapter, der genau dieses Interface erfüllt. Die UI-Komponenten
// kennen nur dieses Interface, nie die konkrete Datenquelle.
// Neu 04.09.2026 — Kalender-Basismodul.

import { Termin, NeuerTermin, Bereich } from "./typen";

export type TerminAktualisieren = Partial<Pick<NeuerTermin, "titel" | "beschreibung" | "start" | "ende" | "farbe">>;

export interface KalenderAdapter {
  // Liefert nur Termine, die der Mitarbeiter sehen darf:
  // eigener Bereich, oder alle, falls sieht_alle_bereiche = true.
  getTermine(mitarbeiterId: string): Promise<Termin[]>;

  createTermin(daten: NeuerTermin, mitarbeiterId: string): Promise<Termin>;

  // Bearbeitet einen bestehenden Termin. Sichtbarkeitsregel gilt auch hier:
  // nur eigener Bereich, ausser sieht_alle_bereiche = true (analog zu
  // deleteTermin) - wirft einen Error, falls kein Zugriff besteht.
  updateTermin(
    terminId: string,
    daten: TerminAktualisieren,
    mitarbeiterId: string
  ): Promise<Termin>;

  deleteTermin(terminId: string, mitarbeiterId: string): Promise<void>;

  // Für das Termin-Formular: Bereichsliste (nur relevant bei
  // sieht_alle_bereiche = true, sonst wird der eigene Bereich fest
  // verwendet und dieser Aufruf wird nicht gebraucht).
  getBereiche(): Promise<Bereich[]>;
}
