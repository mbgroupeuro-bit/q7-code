// lib/kalender/typen.ts
// Gemeinsame Datentypen für das Kalender-Basismodul.
// Neu 04.09.2026 — Kalender-Basismodul.

export type Termin = {
  id: string;
  titel: string;
  beschreibung: string | null;
  start: string; // ISO-String
  ende: string; // ISO-String
  farbe: string;
  bereich_id: string;
  bereich_name: string;
};

export type NeuerTermin = {
  titel: string;
  beschreibung?: string;
  start: string;
  ende: string;
  farbe?: string;
  // Wird vom Adapter ignoriert und durch den eigenen Bereich des
  // Mitarbeiters ersetzt, falls sieht_alle_bereiche = false.
  bereich_id: string;
};

export type Aufgabe = {
  id: string;
  titel: string;
  faelligkeit: string | null;
  status: string;
};

export type Bereich = {
  id: string;
  name: string;
};

export type MitarbeiterKontext = {
  id: string;
  bereich_id: string;
  bereich_name: string;
  sieht_alle_bereiche: boolean;
};
