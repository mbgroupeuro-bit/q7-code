// Basismodul KI-Agent — Werkzeug-Liste (PROJEKTSPEZIFISCH)
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\werkzeuge.ts
//
// WICHTIG: Das ist die EINZIGE Datei im ganzen Basismodul, die sich pro Kopie
// (CRM standalone, ERP, Q7) unterscheidet — alles andere (Interface, Adapter,
// Validierung, Rollen-Check, Routine-Engine) bleibt unverändert. Passt zum
// Basismodul-Grundprinzip: Original bleibt Vorlage, nur diese Datei wird pro
// Projekt ausgetauscht/erweitert.
//
// NEU (12.09.2026): neuerProzessWerkzeug ergänzt — registriert einen neuen
// Q7-Unternehmensprozess im Prozessregister (lib/prozessRegister.ts).
// Normales schreibendes Werkzeug, NICHT nurInternAufrufbar (Architektur-
// Entscheidung 12.09.2026, siehe Kommentar bei der Definition unten).

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { WerkzeugDefinition } from "./types";
import { schlageKurzbeschreibungVor, registriereProzess } from "@/lib/prozessRegister";

const beispielEingabeSchema = z.object({
  zeitraum: z.enum(["heute", "diese_woche", "dieser_monat"]).default("heute"),
});

const beispielWerkzeug: WerkzeugDefinition<z.infer<typeof beispielEingabeSchema>> = {
  id: "beispiel-lesend",
  name: "Beispiel-Werkzeug (Platzhalter)",
  beschreibung: "Platzhalter zur Orientierung — bei Einbau durch echte Werkzeuge ersetzen.",
  kategorie: "Beispiel",
  typ: "lesend",
  eingabeSchema: beispielEingabeSchema,
  eingabeBeschreibung: 'zeitraum: einer von genau "heute", "diese_woche", "dieser_monat" (klein, mit Unterstrich).',
  async lesen(eingabe) {
    return {
      text: `Platzhalter-Antwort für Zeitraum "${eingabe.zeitraum}". Dieses Werkzeug muss durch echte Werkzeuge ersetzt werden.`,
    };
  },
};

// -- termin-anlegen (schreibend, SEC-GATE: nur vorbereiten) --------------

const terminEingabeSchema = z.object({
  titel: z.string().min(1).max(200),
  beschreibung: z.string().max(2000).optional(),
  // NEU (Fixrunde, Zeitzonen-Fix): OHNE "Z" — lokale deutsche Uhrzeit, wie
  // der Nutzer sie meint. Vorher zwang das "Z"-Format die KI zu einer
  // UTC-Umrechnung, die sie nicht korrekt beherrschte (18 Uhr wurde zu
  // 19/20 Uhr, teils sogar Datumssprung auf den Folgetag).
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, "Format: JJJJ-MM-TTTHH:MM:SS, ohne Z"),
  ende: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, "Format: JJJJ-MM-TTTHH:MM:SS, ohne Z"),
});

const terminAnlegenWerkzeug: WerkzeugDefinition<z.infer<typeof terminEingabeSchema>> = {
  id: "termin-anlegen",
  name: "Termin anlegen",
  beschreibung: "Legt einen neuen Kalendertermin im Bereich des Mitarbeiters an.",
  kategorie: "Kalender",
  typ: "schreibend",
  eingabeSchema: terminEingabeSchema,
  eingabeBeschreibung:
    'titel (Pflichttext), beschreibung (optionaler Text), start und ende jeweils als deutsche Ortszeit, OHNE Zeitzone/Z, exaktes Format "JJJJ-MM-TTTHH:MM:SS", z.B. "2026-09-11T18:00:00" für 18 Uhr deutscher Zeit. NIEMALS umrechnen, NIEMALS "Z" anhängen — die eingegebene Uhrzeit ist bereits die richtige lokale Uhrzeit.',

  async vorbereiten(eingabe) {
    return {
      typ: "Termin anlegen",
      zusammenfassung: `Termin "${eingabe.titel}" von ${eingabe.start} bis ${eingabe.ende}.`,
      eingabeDaten: eingabe,
    };
  },

  async revalidieren(_eingabeDaten, kontext) {
    if (!kontext.bereichId) {
      return { gueltig: false, hinweis: "Kein Bereich zugeordnet." };
    }
    const bereich = await prisma.bereich.findUnique({ where: { id: kontext.bereichId } });
    if (!bereich) return { gueltig: false, hinweis: "Bereich existiert nicht mehr." };
    return { gueltig: true };
  },

  async ausfuehren(eingabeDaten, kontext) {
    if (!kontext.bereichId) {
      return { erfolg: false, ergebnisText: "", fehlermeldung: "Kein Bereich zugeordnet." };
    }
    const termin = await prisma.termin.create({
      data: {
        titel: eingabeDaten.titel,
        beschreibung: eingabeDaten.beschreibung,
        start: new Date(eingabeDaten.start),
        ende: new Date(eingabeDaten.ende),
        bereich_id: kontext.bereichId,
      },
    });
    return { erfolg: true, ergebnisText: `Termin "${termin.titel}" wurde angelegt.` };
  },
};

// -- aufgabe-anlegen (schreibend, SEC-GATE: nur vorbereiten) --------------
//
// ANNAHME (bitte prüfen): "quelle" hat im Schema keinen Wert für
// "von der KI erstellt" (nur "manuell" | "kanal_verlegt" | "freigabe").
// Hier bewusst "manuell" gewählt (semantisch am nächsten: keine
// Posteingang-Verlegung, kein Freigabe-Flow) — bei Bedarf im Schema um einen
// vierten Wert ("ki_agent") erweitern, dann hier anpassen.
// "nummer" wird bewusst NICHT gesetzt — die fortlaufende Anzeige-Nummer wird
// laut Schema-Kommentar applikationsseitig vergeben; die genaue Logik dafür
// war nicht Teil der geprüften Dateien, daher hier nicht nachgebaut (kein
// Raten bei einer möglicherweise woanders zentral verwalteten Zählung).

const aufgabeEingabeSchema = z.object({
  titel: z.string().min(1).max(200),
  beschreibung: z.string().max(2000).optional(),
  faelligkeit: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, "Format: JJJJ-MM-TTTHH:MM:SS, ohne Z").optional(),
  prioritaet: z.enum(["niedrig", "normal", "hoch"]).optional(),
});

const aufgabeAnlegenWerkzeug: WerkzeugDefinition<z.infer<typeof aufgabeEingabeSchema>> = {
  id: "aufgabe-anlegen",
  name: "Aufgabe anlegen",
  beschreibung: "Legt eine neue persönliche Aufgabe für den Mitarbeiter an.",
  kategorie: "Aufgaben",
  typ: "schreibend",
  eingabeSchema: aufgabeEingabeSchema,
  eingabeBeschreibung:
    'titel (Pflichttext), beschreibung (optional), faelligkeit (optional, deutsche Ortszeit OHNE Zeitzone/Z, Format "JJJJ-MM-TTTHH:MM:SS", z.B. "2026-09-11T00:00:00"), prioritaet (optional, einer von "niedrig", "normal", "hoch").',

  async vorbereiten(eingabe) {
    return {
      typ: "Aufgabe anlegen",
      zusammenfassung: `Aufgabe "${eingabe.titel}"${eingabe.faelligkeit ? ` (fällig: ${eingabe.faelligkeit})` : ""}.`,
      eingabeDaten: eingabe,
    };
  },

  async ausfuehren(eingabeDaten, kontext) {
    const aufgabe = await prisma.meineAufgabe.create({
      data: {
        titel: eingabeDaten.titel,
        beschreibung: eingabeDaten.beschreibung,
        faelligkeit: eingabeDaten.faelligkeit ? new Date(eingabeDaten.faelligkeit) : undefined,
        prioritaet: eingabeDaten.prioritaet,
        quelle: "manuell", // siehe ANNAHME-Kommentar oben
        status: "offen",
        mitarbeiter_id: kontext.mitarbeiterId,
      },
    });
    return { erfolg: true, ergebnisText: `Aufgabe "${aufgabe.titel}" wurde angelegt.` };
  },
};

// -- neuer-prozess (schreibend, SEC-GATE: nur vorbereiten) ----------------
//
// NEU (12.09.2026): Registriert einen neuen Q7-Unternehmensprozess im
// Prozessregister (lib/prozessRegister.ts) — deterministische ID-Vergabe +
// KI-gestützter Kurzbeschreibungs-Vorschlag + Ähnlichkeitsprüfung (Fail-Safe,
// aktuell inaktiv, siehe embeddingStatus in der Rückmeldung: rufeKIAn() hat
// noch keine Embedding-Fähigkeit).
//
// Architektur-Entscheidung: normales schreibendes Werkzeug, NICHT
// nurInternAufrufbar — jeder Mitarbeiter mit Chat-Zugriff kann einen neuen
// Prozess vorschlagen, das SEC-GATE (Freigabe in der Ausgabe) schützt vor
// unautorisierter Übernahme, analog zu termin-anlegen/aufgabe-anlegen.
//
// WICHTIG zum Ablauf: Der LLM-Kurzbeschreibungs-Vorschlag (rufeKIAn()-Call)
// passiert bereits in vorbereiten() — die Zusammenfassung, die der Admin in
// der Ausgabe zur Freigabe sieht, enthält den Vorschlag direkt. Freigabe =
// Bestätigung dieses Vorschlags (Grill-Entscheidung Punkt 2, Ansatz 3:
// "Vorschlag → Bestätigung"). Die eigentliche Registrierung (registriereProzess(),
// inkl. echter ID-Vergabe + Embedding-Versuch) passiert ERST in ausfuehren(),
// also erst NACH SEC-GATE-Freigabe — sonst würde ein abgelehnter Vorschlag
// trotzdem schon eine Prozess-ID verbraucht haben.

const neuerProzessEingabeSchema = z.object({
  titel: z.string().min(1).max(200),
  volltext: z.string().min(20).max(20_000), // vollständiger Prozesstext (Zweck + Ablauf)
});

const neuerProzessWerkzeug: WerkzeugDefinition<z.infer<typeof neuerProzessEingabeSchema>> = {
  id: "neuer-prozess",
  name: "Neuen Prozess registrieren",
  beschreibung:
    "Registriert einen neuen Q7-Unternehmensprozess im Prozessregister: vergibt eine " +
    "eindeutige Prozess-ID, schlägt eine Kurzbeschreibung vor und prüft (falls verfügbar) " +
    "Ähnlichkeit zu bestehenden Prozessen.",
  kategorie: "System",
  typ: "schreibend",
  eingabeSchema: neuerProzessEingabeSchema,
  eingabeBeschreibung:
    'titel (Pflichttext, Kurzname des Prozesses), volltext (vollständiger Prozesstext inkl. ' +
    'Zweck und Ablauf, mind. 20 Zeichen — je vollständiger, desto besser die spätere ' +
    'Ähnlichkeitsprüfung).',

  async vorbereiten(eingabe) {
    const { vorschlag } = await schlageKurzbeschreibungVor({
      titel: eingabe.titel,
      volltext: eingabe.volltext,
    });

    return {
      typ: "Neuer Prozess",
      zusammenfassung:
        `Prozess "${eingabe.titel}" wird registriert.\n` +
        `Vorgeschlagene Kurzbeschreibung: "${vorschlag}"\n` +
        `(Hinweis: Ähnlichkeitsprüfung gegen bestehende Prozesse ist aktuell nicht ` +
        `verfügbar — siehe embeddingStatus nach Registrierung.)`,
      eingabeDaten: {
        titel: eingabe.titel,
        volltext: eingabe.volltext,
        vorgeschlageneKurzbeschreibung: vorschlag,
      },
    };
  },

  async ausfuehren(eingabeDaten, _kontext) {
    // eingabeDaten kommt hier aus dem, was vorbereiten() zurückgegeben hat
    // (adapter-prisma.ts speichert vorschlag.eingabeDaten, nicht die
    // Roh-Eingabe) — enthält also zusätzlich vorgeschlageneKurzbeschreibung.
    const daten = eingabeDaten as {
      titel: string;
      volltext: string;
      vorgeschlageneKurzbeschreibung: string;
    };

    const ergebnis = await registriereProzess(
      daten.titel,
      daten.vorgeschlageneKurzbeschreibung, // Admin hat durch Freigabe bestätigt
      daten.volltext
    );

    const warnungenText =
      ergebnis.aehnlichkeitsWarnungen.length > 0
        ? ` ⚠️ Ähnlich zu: ${ergebnis.aehnlichkeitsWarnungen
            .map((w) => `${w.prozessId} (${w.titel})`)
            .join(", ")}.`
        : "";

    const embeddingHinweis =
      ergebnis.embeddingStatus === "fehlgeschlagen"
        ? " ⚠️ Ähnlichkeitsprüfung nicht verfügbar (Embedding-Funktion fehlt aktuell) — nur ID gesichert, keine Kollisionsprüfung durchgeführt."
        : "";

    return {
      erfolg: true,
      ergebnisText: `Prozess ${ergebnis.prozessId} ("${daten.titel}") wurde registriert.${warnungenText}${embeddingHinweis}`,
    };
  },
};

// -- system-autonomie-aendern (schreibend, SEC-GATE + Cooling-off) --------
//
// NEU (Punkt 2, 11.09.2026): Ersetzt den bisherigen Sonderfall in
// app/api/chat/route.ts (parseDelegationAufruf -> direktes
// setDelegationStufe). Läuft jetzt über denselben Vorschlag->Freigabe-
// Mechanismus wie jedes andere schreibende Werkzeug (z.B. termin-anlegen),
// zusätzlich mit erfordertCoolingOff=true (siehe types.ts, adapter-prisma.ts).
//
// WICHTIG: nurInternAufrufbar=true — wird bewusst NICHT über
// baueWerkzeugPrompt() an die KI gemeldet, damit nicht jeder Chat-Nutzer
// dieses Werkzeug sehen/aufrufen kann. Die "erkläre zuerst, nur bei klarer
// Zustimmung ausführen"-Logik bleibt beim bestehenden, Admin-only
// Delegation-Prompt-Mechanismus in route.ts — dieses Werkzeug wird von dort
// direkt per bereiteSchreibaktionVor() aufgerufen, nie über den generischen
// werkzeug_aufruf-Weg.

const DELEGATION_SINGLETON_ID = "global";

const autonomieEingabeSchema = z.object({
  stufe: z.enum(["keine", "teil", "komplett"]),
  werkzeugIds: z.array(z.string()).optional(),
});

const autonomieAendernWerkzeug: WerkzeugDefinition<z.infer<typeof autonomieEingabeSchema>> = {
  id: "system-autonomie-aendern",
  name: "Automatische Freigabe-Stufe ändern",
  beschreibung: "Ändert die globale Autonomie-/Delegation-Stufe des Systems (keine/teil/komplett).",
  kategorie: "System",
  typ: "schreibend",
  eingabeSchema: autonomieEingabeSchema,
  eingabeBeschreibung:
    'stufe: einer von "keine", "teil", "komplett". werkzeugIds: optionale Liste von Werkzeug-IDs, nur bei stufe="teil" relevant.',
  erfordertCoolingOff: true,
  nurInternAufrufbar: true,

  async vorbereiten(eingabe) {
    return {
      typ: "Autonomie-Änderung",
      zusammenfassung: `Automatische Freigabe-Stufe wird auf "${eingabe.stufe}" geändert${
        eingabe.stufe === "teil" && eingabe.werkzeugIds ? ` (Werkzeuge: ${eingabe.werkzeugIds.join(", ")})` : ""
      }. Tritt nach Cooling-off-Frist in Kraft.`,
      eingabeDaten: eingabe,
    };
  },

  async ausfuehren(eingabeDaten, kontext) {
    const einzelWerkzeugeWert =
      eingabeDaten.stufe === "teil" && eingabeDaten.werkzeugIds ? JSON.stringify(eingabeDaten.werkzeugIds) : null;

    await prisma.agentDelegation.upsert({
      where: { id: DELEGATION_SINGLETON_ID },
      create: {
        id: DELEGATION_SINGLETON_ID,
        stufe: eingabeDaten.stufe,
        geaendert_von: kontext.mitarbeiterId,
        einzel_werkzeuge: einzelWerkzeugeWert,
      },
      update: {
        stufe: eingabeDaten.stufe,
        geaendert_von: kontext.mitarbeiterId,
        einzel_werkzeuge: einzelWerkzeugeWert,
      },
    });

    return {
      erfolg: true,
      ergebnisText: `Freigabe-Stufe wurde auf "${eingabeDaten.stufe}" gesetzt${
        eingabeDaten.stufe === "teil" && eingabeDaten.werkzeugIds
          ? ` (Werkzeuge: ${eingabeDaten.werkzeugIds.join(", ")})`
          : ""
      }.`,
    };
  },
};

export const WERKZEUGE: WerkzeugDefinition[] = [
  beispielWerkzeug,
  terminAnlegenWerkzeug,
  aufgabeAnlegenWerkzeug,
  neuerProzessWerkzeug,
  autonomieAendernWerkzeug,
];
