// Projektspezifische Verdrahtung: Aufgabenliste -> Kalender
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\verdrahtung\aufgaben-kalender-listener.ts
//
// WICHTIG: Diese Datei ist bewusst NICHT Teil eines Basismoduls und wird
// beim Kopieren von Basismodule\kalender\ oder Basismodule\aufgabenliste\
// in ein neues Projekt NICHT mitkopiert. Sie ist reine, projektspezifische
// Klebe-Logik, die beide Module miteinander verbindet — nur in a_Q7-code
// (bzw. später Q7-ERP) vorhanden, wo tatsächlich beide Module gemeinsam
// laufen.
//
// Neu (13.09.2026, Kalender-Fixes-Session): Hört auf das Event
// TERMIN_ANGEFORDERT aus der Aufgabenliste und legt den Termin über den
// prismaKalenderAdapter an. Reagiert damit auf den bisher unbeantworteten
// Kommentar in aufgaben-events.ts ("Kalender-Basismodul reagiert darauf,
// sobald es existiert").
//
// Bereichs-Zuordnung: createTermin() im Kalender-Adapter braucht eine
// mitarbeiterId, um bereich_id korrekt zu setzen. Falls das Event keine
// mitarbeiterId mitbringt (z.B. Header fehlte), wird NICHT geraten
// (kein automatischer Fallback auf "Allgemein") — stattdessen wird der
// Fehler geloggt und der Termin NICHT angelegt. Grund: ein Termin im
// falschen/neutralen Bereich wäre für den anfragenden Mitarbeiter u.U.
// gar nicht sichtbar (Sichtbarkeitsregel: nur eigener Bereich, außer
// sieht_alle_bereiche) — ein stiller Fallback würde den Fehler nur
// verstecken statt ihn sichtbar zu machen. Muss ggf. gemeinsam
// entschieden werden, falls das in der Praxis öfter vorkommt.

import { aufgabenEvents, TERMIN_ANGEFORDERT, TerminAngefordertPayload } from "@/lib/aufgaben-events";
import { prismaKalenderAdapter } from "@/lib/kalender/prisma-adapter";

let registriert = false;

export function registriereAufgabenKalenderListener() {
  // Schutz gegen Mehrfach-Registrierung bei Next.js Hot-Reload / mehrfachem
  // Import derselben Datei in unterschiedlichen Modulen.
  if (registriert) return;
  registriert = true;

  aufgabenEvents.on(TERMIN_ANGEFORDERT, async (payload: TerminAngefordertPayload) => {
    if (!payload.mitarbeiterId) {
      console.error(
        `[aufgaben-kalender-listener] Termin für Aufgabe ${payload.meineAufgabeId} ` +
          `konnte nicht angelegt werden: keine mitarbeiterId im Event ` +
          `(x-q7-mitarbeiter-Header war beim Anfordern nicht gesetzt).`
      );
      return;
    }

    try {
      await prismaKalenderAdapter.createTermin(
        {
          titel: payload.titel,
          beschreibung: payload.beschreibung ?? undefined,
          start: payload.start,
          ende: payload.ende,
          farbe: payload.farbe ?? undefined,
          // Wird vom Adapter ohnehin durch den eigenen Bereich des
          // Mitarbeiters ersetzt, falls sieht_alle_bereiche = false.
          // Hier nur als Platzhalter nötig, da bereich_id im Typ
          // NeuerTermin Pflicht ist.
          bereich_id: "",
        },
        payload.mitarbeiterId
      );
    } catch (fehler) {
      console.error(
        `[aufgaben-kalender-listener] Termin für Aufgabe ${payload.meineAufgabeId} ` +
          `konnte nicht angelegt werden:`,
        fehler
      );
    }
  });
}
