// Basismodul "Aufgabenliste" — Event-Schnittstelle zum Kalender
// Speicherort: D:\Projekt2027\Basismodule\aufgabenliste\lib\aufgaben-events.ts
//
// Entkoppelte, event-basierte Verbindung (Basismodul-Konzept, Abschnitt 4b):
// Die Aufgabenliste kennt kein Termin-/Kalender-Modell und schreibt nie
// direkt in eine Termin-Tabelle. Stattdessen wird bei Anfrage eines Termins
// nur dieses Event ausgelöst — ein künftiges Kalender-Basismodul hört im
// selben Prozess per Node EventEmitter darauf und legt den Termin selbst an.
//
// Läuft Frontend/Backend getrennt (z.B. Q7-ERP mit NestJS), muss der
// jeweilige Adapter diesen Event-Mechanismus um einen Netzwerkaufruf/Webhook
// erweitern — der Kern hier bleibt dabei unverändert.
//
// Geändert (13.09.2026, Kalender-Fixes-Session): Payload um mitarbeiterId
// ergänzt. Grund: Das Kalender-Basismodul benötigt zwingend eine
// mitarbeiterId, um den Termin dem korrekten bereich_id zuzuordnen
// (Pflichtfeld, siehe kalender_bereich_pflicht-Migration). Die Aufgabenliste
// selbst kennt keinen Bereich-Begriff — sie liest hier lediglich denselben
// simulierten Header (x-q7-mitarbeiter) aus, den auch das Kalender-Modul
// nutzt, und reicht die ID unverändert durch. Das ist bewusst KEINE
// Kopplung an das Kalender-Datenmodell, nur eine ID-Weitergabe.

import { EventEmitter } from "events";

export const aufgabenEvents = new EventEmitter();

export const TERMIN_ANGEFORDERT = "aufgabe:termin_angefordert";

export type TerminAngefordertPayload = {
  meineAufgabeId: string;
  titel: string;
  beschreibung: string | null;
  start: string; // ISO-String
  ende: string; // ISO-String
  farbe: string | null;
  // Neu: ID aus dem x-q7-mitarbeiter-Header, roh durchgereicht.
  // Kann null sein, falls kein Header gesetzt war (z.B. Testbetrieb ohne
  // simulierten Mitarbeiter) — der Listener entscheidet dann, wie er
  // damit umgeht (siehe lib/verdrahtung/aufgaben-kalender-listener.ts).
  mitarbeiterId: string | null;
};
