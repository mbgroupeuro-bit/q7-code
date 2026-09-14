// lib/kalender/adapter-interface.ts
// Festes Daten-Interface für das Kalender-Basismodul.
// Jedes Zielsystem (Q7 direkt/Prisma, Q7-ERP/NestJS ...) bekommt einen
// eigenen Adapter, der genau dieses Interface erfüllt. Die UI-Komponenten
// kennen nur dieses Interface, nie die konkrete Datenquelle.
// Neu 04.09.2026 — Kalender-Basismodul.
//
// Geändert 13.09.2026 (Kalender-Fixes-Session): updateTermin ergänzt.
// Fehlte bisher komplett — Termine konnten nach dem Anlegen nicht mehr
// bearbeitet werden (weder UI noch API noch Adapter kannten dafür einen
// Weg). Siehe Übergabe "Q7 – Kalender-Fixes", Punkt 1.

import { Termin, NeuerTermin, Bereich } from "./typen";

// Teilmenge von NeuerTermin: bereich_id bewusst NICHT veränderbar über
// dieses Update — ein Bereichswechsel eines bestehenden Termins ist ein
// eigenständiges, noch nicht besprochenes Thema (Sichtbarkeits-
// Konsequenzen für andere Mitarbeiter) und daher hier bewusst
// ausgeklammert, statt es nebenbei mitzunehmen.
export type TerminAktualisieren = Partial<
  Pick<NeuerTermin, "titel" | "beschreibung" | "start" | "ende" | "farbe">
>;

export interface KalenderAdapter {
  // Liefert nur Termine, die der Mitarbeiter sehen darf:
  // eigener Bereich, oder alle, falls sieht_alle_bereiche = true.
  getTermine(mitarbeiterId: string): Promise<Termin[]>;

  createTermin(daten: NeuerTermin, mitarbeiterId: string): Promise<Termin>;

  // Bearbeitet einen bestehenden Termin. Sichtbarkeitsregel gilt auch hier:
  // nur eigener Bereich, außer sieht_alle_bereiche = true (analog zu
  // deleteTermin) — wirft einen Error, falls kein Zugriff besteht.
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
