// Basismodul KI-Agent — Prisma-Adapter
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\adapter-prisma.ts
//
// Konkrete Umsetzung von KIAgentAdapter für Zielsysteme mit direktem
// Prisma-Zugriff (Q7, CRM standalone — siehe Basismodul-Konzept Abschnitt 4a).
// Für ERP / CRM-im-ERP kommt stattdessen adapter-connector.ts zum Einsatz.
//
// WICHTIG: Reine Datenzugriffs-Logik. Die eigentliche KI-Textgenerierung für
// Routinen (z.B. Arbeitsplan-Priorisierung) liegt bewusst NICHT hier, sondern
// in routine-engine.ts (Grill-Me-Entscheidung: Adapter bleibt Datenschicht,
// Orchestrierung ist eine eigene Schicht, sonst müsste jeder Adapter die
// KI-Logik duplizieren).

import { prisma } from "@/lib/prisma";
import { validiereWerkzeugEingabe } from "./validierung";
import { fuehreAgentAuftragAus } from "./orchestrierung";
import {
  WerkzeugFehler,
  type AgentAktion,
  type AgentAktionStatus,
  type AgentRoutine,
  type DelegationEinstellung,
  type DelegationStufe,
  type WerkzeugDefinition,
  type WerkzeugKontext,
  type WerkzeugLeseErgebnis,
  type WerkzeugAusfuehrungsErgebnis,
  type Wochentag,
} from "./types";
import type { KIAgentAdapter } from "./werkzeuge-interface";

const WOCHENTAG_INDEX: Wochentag[] = ["so", "mo", "di", "mi", "do", "fr", "sa"];
const DELEGATION_SINGLETON_ID = "global";

// ---------------------------------------------------------------------
// Mapping-Hilfsfunktionen: Prisma-Zeile (snake_case) -> App-Typ (camelCase)
// ---------------------------------------------------------------------

function mapAgentAktion(row: {
  id: string;
  werkzeug_id: string | null;
  typ: string;
  eingabe_daten: string;
  status: string;
  mitarbeiter_id: string;
  bereich_id: string | null;
  agent_chat_id: string | null;
  ergebnis_text: string | null;
  fehlermeldung: string | null;
  erstellt_am: Date;
  entschieden_am: Date | null;
  entschieden_von: string | null;
  ausgefuehrt_am: Date | null;
  geplante_ausfuehrung_am: Date | null;
}): AgentAktion {
  return {
    id: row.id,
    werkzeugId: row.werkzeug_id,
    typ: row.typ,
    eingabeDaten: JSON.parse(row.eingabe_daten),
    status: row.status as AgentAktionStatus,
    mitarbeiterId: row.mitarbeiter_id,
    bereichId: row.bereich_id,
    agentChatId: row.agent_chat_id,
    ergebnisText: row.ergebnis_text,
    fehlermeldung: row.fehlermeldung,
    erstelltAm: row.erstellt_am.toISOString(),
    entschiedenAm: row.entschieden_am?.toISOString() ?? null,
    entschiedenVon: row.entschieden_von,
    ausgefuehrtAm: row.ausgefuehrt_am?.toISOString() ?? null,
    geplanteAusfuehrungAm: row.geplante_ausfuehrung_am?.toISOString() ?? null,
  };
}

// NEU (Punkt 2, 11.09.2026): Cooling-off-Zeitpunkt berechnen — übernächster
// 07:00-Slot, Mindestabstand 24h ab jetzt. Beispiel: Freigabe heute 10:00 ->
// mindestens morgen 10:00 -> frühester 07:00-Slot danach ist übermorgen 07:00
// (morgen 07:00 wäre nur ~21h entfernt, also zu früh). Freigabe heute 02:00 ->
// mindestens morgen 02:00 -> frühester 07:00-Slot danach ist morgen 07:00.
function berechneCoolingOffZeitpunkt(jetzt: Date): Date {
  const mindestZeitpunkt = new Date(jetzt.getTime() + 24 * 60 * 60 * 1000);
  const kandidat = new Date(mindestZeitpunkt);
  kandidat.setHours(7, 0, 0, 0);
  if (kandidat.getTime() < mindestZeitpunkt.getTime()) {
    kandidat.setDate(kandidat.getDate() + 1);
  }
  return kandidat;
}

function mapAgentRoutine(row: {
  id: string;
  mitarbeiter_id: string;
  typ: string;
  anweisung: string;
  uhrzeit: string;
  wochentage: string;
  aktiv: boolean;
  letzter_lauf_am: Date | null;
}): AgentRoutine {
  return {
    id: row.id,
    mitarbeiterId: row.mitarbeiter_id,
    typ: row.typ,
    anweisung: row.anweisung,
    uhrzeit: row.uhrzeit,
    wochentage: row.wochentage
      .split(",")
      .map((t) => t.trim())
      .filter((t): t is Wochentag => t.length > 0) as Wochentag[],
    aktiv: row.aktiv,
    letzterLaufAm: row.letzter_lauf_am?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------

/**
 * Werkzeuge werden dem Adapter von außen übergeben (nicht fest importiert) —
 * jede Basismodul-Kopie (CRM, ERP, Q7) bringt ihre eigene Werkzeug-Liste mit
 * (z.B. werkzeuge-crm.ts), das Original bleibt dadurch unverändert
 * wiederverwendbar (Basismodul-Konzept Abschnitt 1).
 */
export class PrismaAdapter implements KIAgentAdapter {
  constructor(private readonly werkzeuge: WerkzeugDefinition[]) {}

  // -- Werkzeuge ---------------------------------------------------------

  getWerkzeuge(): WerkzeugDefinition[] {
    return this.werkzeuge;
  }

  getWerkzeug(werkzeugId: string): WerkzeugDefinition | null {
    return this.werkzeuge.find((w) => w.id === werkzeugId) ?? null;
  }

  // -- Lesende Ausführung --------------------------------------------------

  async fuehreLesewerkzeugAus(
    werkzeugId: string,
    eingabe: unknown,
    kontext: WerkzeugKontext
  ): Promise<WerkzeugLeseErgebnis> {
    const werkzeug = this.getWerkzeug(werkzeugId);
    if (!werkzeug) throw new WerkzeugFehler(`Unbekanntes Werkzeug: ${werkzeugId}`, 404);
    if (werkzeug.typ !== "lesend" || !werkzeug.lesen) {
      throw new WerkzeugFehler(`Werkzeug "${werkzeugId}" ist kein lesendes Werkzeug.`, 400);
    }

    const validiert = validiereWerkzeugEingabe(werkzeug, eingabe);
    if (!validiert.gueltig) {
      throw new WerkzeugFehler(`Ungültige Eingabe für "${werkzeugId}": ${validiert.fehlerText}`, 422);
    }

    return werkzeug.lesen(validiert.daten, kontext);
  }

  // -- Schreibende Ausführung (SEC-GATE, zweistufig) ------------------------

  async bereiteSchreibaktionVor(
    werkzeugId: string,
    eingabe: unknown,
    kontext: WerkzeugKontext
  ): Promise<AgentAktion> {
    const werkzeug = this.getWerkzeug(werkzeugId);
    if (!werkzeug) throw new WerkzeugFehler(`Unbekanntes Werkzeug: ${werkzeugId}`, 404);
    if (werkzeug.typ !== "schreibend" || !werkzeug.vorbereiten) {
      throw new WerkzeugFehler(`Werkzeug "${werkzeugId}" ist kein schreibendes Werkzeug.`, 400);
    }

    const validiert = validiereWerkzeugEingabe(werkzeug, eingabe);
    if (!validiert.gueltig) {
      throw new WerkzeugFehler(`Ungültige Eingabe für "${werkzeugId}": ${validiert.fehlerText}`, 422);
    }

    const vorschlag = await werkzeug.vorbereiten(validiert.daten, kontext);

    const zeile = await prisma.agentAktion.create({
      data: {
        werkzeug_id: werkzeugId,
        typ: vorschlag.typ,
        eingabe_daten: JSON.stringify(vorschlag.eingabeDaten),
        status: "wartet_auf_freigabe",
        mitarbeiter_id: kontext.mitarbeiterId,
        bereich_id: kontext.bereichId,
        agent_chat_id: kontext.agentChatId,
        ergebnis_text: vorschlag.zusammenfassung,
      },
    });

    return mapAgentAktion(zeile);
  }

  async fuehreSchreibaktionAus(aktionId: string, kontext: WerkzeugKontext): Promise<WerkzeugAusfuehrungsErgebnis> {
    const zeile = await prisma.agentAktion.findUnique({ where: { id: aktionId } });
    if (!zeile) throw new WerkzeugFehler(`Unbekannte Aktion: ${aktionId}`, 404);
    // NEU (Punkt 2, 11.09.2026): akzeptiert jetzt zusätzlich Status
    // "freigegeben" — wird nach Ablauf des Cooling-off vom Cron aufgerufen
    // (siehe fuehreCoolingOffAktionAus). "freigegeben" wird AUSSCHLIESSLICH
    // von freigebenAktion() gesetzt, für keinen anderen Zweck verwendet.
    if (zeile.status !== "wartet_auf_freigabe" && zeile.status !== "freigegeben") {
      throw new WerkzeugFehler(`Aktion "${aktionId}" ist nicht mehr freigabefähig (Status: ${zeile.status}).`, 409);
    }

    const werkzeug = zeile.werkzeug_id ? this.getWerkzeug(zeile.werkzeug_id) : null;
    if (!werkzeug || !werkzeug.ausfuehren) {
      throw new WerkzeugFehler(`Werkzeug zur Aktion "${aktionId}" nicht gefunden oder nicht ausführbar.`, 500);
    }

    const eingabeDaten = JSON.parse(zeile.eingabe_daten);

    // Grill-Me-Entscheidung Punkt 1: Re-Validierung unmittelbar vor der
    // echten Ausführung, nicht blind auf Basis der alten Vorschau-Daten.
    if (werkzeug.revalidieren) {
      const revalidierung = await werkzeug.revalidieren(eingabeDaten, kontext);
      if (!revalidierung.gueltig) {
        await prisma.agentAktion.update({
          where: { id: aktionId },
          data: {
            status: "fehlgeschlagen",
            fehlermeldung: revalidierung.hinweis ?? "Daten seit Vorschlag nicht mehr gültig.",
            entschieden_am: new Date(),
            entschieden_von: kontext.mitarbeiterId,
          },
        });
        return {
          erfolg: false,
          ergebnisText: "",
          fehlermeldung: revalidierung.hinweis ?? "Daten seit Vorschlag nicht mehr gültig.",
        };
      }
    }

    const ergebnis = await werkzeug.ausfuehren(eingabeDaten, kontext);

    await prisma.agentAktion.update({
      where: { id: aktionId },
      data: {
        status: ergebnis.erfolg ? "ausgefuehrt" : "fehlgeschlagen",
        ergebnis_text: ergebnis.ergebnisText,
        fehlermeldung: ergebnis.fehlermeldung ?? null,
        entschieden_am: new Date(),
        entschieden_von: kontext.mitarbeiterId,
        ausgefuehrt_am: ergebnis.erfolg ? new Date() : null,
      },
    });

    return ergebnis;
  }

  // NEU (Punkt 2, 11.09.2026): Entscheidungspunkt bei menschlicher Freigabe.
  // Prüft erfordertCoolingOff des zugehörigen Werkzeugs und verzweigt
  // entsprechend — siehe werkzeuge-interface.ts für die volle Doku.
  async freigebenAktion(
    aktionId: string,
    kontext: WerkzeugKontext
  ): Promise<
    | { terminiert: true; aktion: AgentAktion }
    | { terminiert: false; ergebnis: WerkzeugAusfuehrungsErgebnis }
  > {
    const zeile = await prisma.agentAktion.findUnique({ where: { id: aktionId } });
    if (!zeile) throw new WerkzeugFehler(`Unbekannte Aktion: ${aktionId}`, 404);
    if (zeile.status !== "wartet_auf_freigabe") {
      throw new WerkzeugFehler(`Aktion "${aktionId}" ist nicht mehr freigabefähig (Status: ${zeile.status}).`, 409);
    }

    const werkzeug = zeile.werkzeug_id ? this.getWerkzeug(zeile.werkzeug_id) : null;
    if (!werkzeug) {
      throw new WerkzeugFehler(`Werkzeug zur Aktion "${aktionId}" nicht gefunden.`, 500);
    }

    if (!werkzeug.erfordertCoolingOff) {
      // Normalfall, unverändertes Verhalten: sofort ausführen.
      const ergebnis = await this.fuehreSchreibaktionAus(aktionId, kontext);
      return { terminiert: false, ergebnis };
    }

    // Cooling-off: nur terminieren, NICHT ausführen.
    const geplanteAusfuehrung = berechneCoolingOffZeitpunkt(new Date());
    const aktualisiert = await prisma.agentAktion.update({
      where: { id: aktionId },
      data: {
        status: "freigegeben",
        entschieden_am: new Date(),
        entschieden_von: kontext.mitarbeiterId,
        geplante_ausfuehrung_am: geplanteAusfuehrung,
      },
    });

    return { terminiert: true, aktion: mapAgentAktion(aktualisiert) };
  }

  async lehneAktionAb(aktionId: string, kontext: WerkzeugKontext): Promise<void> {
    const zeile = await prisma.agentAktion.findUnique({ where: { id: aktionId } });
    if (!zeile) throw new WerkzeugFehler(`Unbekannte Aktion: ${aktionId}`, 404);
    if (zeile.status !== "wartet_auf_freigabe") {
      throw new WerkzeugFehler(`Aktion "${aktionId}" ist nicht mehr offen (Status: ${zeile.status}).`, 409);
    }

    await prisma.agentAktion.update({
      where: { id: aktionId },
      data: {
        status: "abgelehnt",
        entschieden_am: new Date(),
        entschieden_von: kontext.mitarbeiterId,
      },
    });
  }

  async getOffeneAktionen(kontext: WerkzeugKontext): Promise<AgentAktion[]> {
    const zeilen = await prisma.agentAktion.findMany({
      where: {
        status: "wartet_auf_freigabe",
        ...(kontext.siehtAlleBereiche ? {} : { bereich_id: kontext.bereichId }),
      },
      orderBy: { erstellt_am: "desc" },
    });

    return zeilen.map(mapAgentAktion);
  }

  // -- Cooling-off (Punkt 2, 11.09.2026) -----------------------------------
  // Analog zum bestehenden Routinen-Cron-Muster (getFaelligeRoutinen /
  // fuehreRoutineAus, siehe unten): periodischer Check ohne aktiven
  // Nutzer-Kontext — Kontext wird beim Ausführen aus dem gespeicherten
  // mitarbeiter_id der Aktion neu geladen.

  async getFaelligeCoolingOffAktionen(jetzt: Date): Promise<AgentAktion[]> {
    const zeilen = await prisma.agentAktion.findMany({
      where: {
        status: "freigegeben",
        geplante_ausfuehrung_am: { lte: jetzt },
      },
    });

    return zeilen.map(mapAgentAktion);
  }

  async fuehreCoolingOffAktionAus(aktionId: string): Promise<void> {
    const zeile = await prisma.agentAktion.findUnique({ where: { id: aktionId } });
    if (!zeile) throw new WerkzeugFehler(`Unbekannte Aktion: ${aktionId}`, 404);

    // Echten Mitarbeiter-Kontext laden statt raten — dieselbe Quelle wie
    // fuehreRoutineAus() für denselben Zweck (kein aktiver Request/Session).
    const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id: zeile.mitarbeiter_id } });
    if (!mitarbeiter) throw new WerkzeugFehler(`Unbekannter Mitarbeiter: ${zeile.mitarbeiter_id}`, 404);

    const kontext: WerkzeugKontext = {
      mitarbeiterId: mitarbeiter.id,
      bereichId: mitarbeiter.bereich_id,
      siehtAlleBereiche: mitarbeiter.sieht_alle_bereiche,
      agentChatId: zeile.agent_chat_id,
    };

    await this.fuehreSchreibaktionAus(aktionId, kontext);
  }

  async getDelegation(): Promise<DelegationEinstellung> {
    const zeile = await prisma.agentDelegation.findUnique({ where: { id: DELEGATION_SINGLETON_ID } });

    if (!zeile) {
      // Erster Aufruf: Default-Zeile anlegen (Stufe "keine" — SEC-GATE-Grundhaltung).
      const neu = await prisma.agentDelegation.create({
        data: { id: DELEGATION_SINGLETON_ID, stufe: "keine" },
      });
      return { stufe: neu.stufe as DelegationStufe, einzelWerkzeuge: null };
    }

    return {
      stufe: zeile.stufe as DelegationStufe,
      einzelWerkzeuge: zeile.einzel_werkzeuge ? JSON.parse(zeile.einzel_werkzeuge) : null,
    };
  }

  async setDelegationStufe(
    stufe: DelegationStufe,
    geaendertVon: string,
    einzelWerkzeugIds?: string[]
  ): Promise<DelegationEinstellung> {
    // NEU (Fixrunde): einzelWerkzeugIds nur bei "teil" übernehmen — bei
    // "keine"/"komplett" ist die Liste irrelevant, wird geleert statt
    // veraltete Werte stehen zu lassen.
    const einzelWerkzeugeWert = stufe === "teil" && einzelWerkzeugIds ? JSON.stringify(einzelWerkzeugIds) : null;

    const zeile = await prisma.agentDelegation.upsert({
      where: { id: DELEGATION_SINGLETON_ID },
      create: { id: DELEGATION_SINGLETON_ID, stufe, geaendert_von: geaendertVon, einzel_werkzeuge: einzelWerkzeugeWert },
      update: { stufe, geaendert_von: geaendertVon, einzel_werkzeuge: einzelWerkzeugeWert },
    });

    return {
      stufe: zeile.stufe as DelegationStufe,
      einzelWerkzeuge: zeile.einzel_werkzeuge ? JSON.parse(zeile.einzel_werkzeuge) : null,
    };
  }

  async darfAutomatischAusgefuehrtWerden(werkzeugId: string): Promise<boolean> {
    const delegation = await this.getDelegation();
    if (delegation.stufe === "komplett") return true;
    if (delegation.stufe === "teil") {
      // NEU (Fixrunde): schließt den bisherigen Platzhalter — Stufe "teil"
      // nutzt jetzt wirklich die Einzel-Werkzeug-Liste.
      return delegation.einzelWerkzeuge?.includes(werkzeugId) ?? false;
    }
    return false;
  }

  // -- Routinen (konfigurierbar pro Mitarbeiter) ----------------------------

  async getRoutinen(mitarbeiterId: string): Promise<AgentRoutine[]> {
    const zeilen = await prisma.agentRoutine.findMany({ where: { mitarbeiter_id: mitarbeiterId } });
    return zeilen.map(mapAgentRoutine);
  }

  async erstelleRoutine(
    mitarbeiterId: string,
    daten: { typ: string; anweisung: string; uhrzeit: string; wochentage: Wochentag[] }
  ): Promise<AgentRoutine> {
    const zeile = await prisma.agentRoutine.create({
      data: {
        mitarbeiter_id: mitarbeiterId,
        typ: daten.typ,
        anweisung: daten.anweisung,
        uhrzeit: daten.uhrzeit,
        wochentage: daten.wochentage.join(","),
      },
    });
    return mapAgentRoutine(zeile);
  }

  async aktualisiereRoutine(
    routineId: string,
    daten: Partial<{ anweisung: string; uhrzeit: string; wochentage: Wochentag[]; aktiv: boolean }>
  ): Promise<AgentRoutine> {
    const zeile = await prisma.agentRoutine.update({
      where: { id: routineId },
      data: {
        ...(daten.anweisung !== undefined ? { anweisung: daten.anweisung } : {}),
        ...(daten.uhrzeit !== undefined ? { uhrzeit: daten.uhrzeit } : {}),
        ...(daten.wochentage !== undefined ? { wochentage: daten.wochentage.join(",") } : {}),
        ...(daten.aktiv !== undefined ? { aktiv: daten.aktiv } : {}),
      },
    });
    return mapAgentRoutine(zeile);
  }

  async loescheRoutine(routineId: string): Promise<void> {
    await prisma.agentRoutine.delete({ where: { id: routineId } });
  }

  async getFaelligeRoutinen(jetzt: Date): Promise<AgentRoutine[]> {
    const aktuelleUhrzeit = `${String(jetzt.getHours()).padStart(2, "0")}:${String(jetzt.getMinutes()).padStart(2, "0")}`;
    const heutigerTag = WOCHENTAG_INDEX[jetzt.getDay()];
    const heuteBeginn = new Date(jetzt);
    heuteBeginn.setHours(0, 0, 0, 0);

    const kandidaten = await prisma.agentRoutine.findMany({
      where: {
        aktiv: true,
        uhrzeit: { lte: aktuelleUhrzeit },
      },
    });

    const faellig = kandidaten.filter((r) => {
      const wochentage = r.wochentage.split(",").map((t) => t.trim());
      const heuteSchonGelaufen = r.letzter_lauf_am !== null && r.letzter_lauf_am >= heuteBeginn;
      return wochentage.includes(heutigerTag) && !heuteSchonGelaufen;
    });

    return faellig.map(mapAgentRoutine);
  }

  async fuehreRoutineAus(routineId: string): Promise<void> {
    const routine = await prisma.agentRoutine.findUnique({ where: { id: routineId } });
    if (!routine) throw new WerkzeugFehler(`Unbekannte Routine: ${routineId}`, 404);

    const heute = new Date();
    const heuteDatum = new Date(heute);
    heuteDatum.setHours(0, 0, 0, 0);

    try {
      // NEU (Fixrunde Punkt 2): freie Anweisung statt fester Arbeitsplan-Logik.
      // Die KI entscheidet selbst über die Werkzeug-Infrastruktur (dieselbe
      // wie im Chat, siehe orchestrierung.ts), welche Daten sie braucht.
      // Echten Mitarbeiter-Kontext laden (nicht raten/leer lassen) — dieselbe
      // Quelle wie rollen-check.ts bei normalen Chat-Anfragen.
      const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id: routine.mitarbeiter_id } });
      if (!mitarbeiter) throw new WerkzeugFehler(`Unbekannter Mitarbeiter: ${routine.mitarbeiter_id}`, 404);

      const kontext: WerkzeugKontext = {
        mitarbeiterId: mitarbeiter.id,
        bereichId: mitarbeiter.bereich_id,
        siehtAlleBereiche: mitarbeiter.sieht_alle_bereiche,
        agentChatId: null,
      };

      const ergebnisText = await fuehreAgentAuftragAus(
        routine.anweisung,
        "A01 Planung & Vorbereitung (Hermes)",
        this,
        kontext
      );

      const chat = await prisma.agentChat.create({
        data: {
          titel: `Routine ${heuteDatum.toLocaleDateString("de-DE")}`,
          agent: "A01 Planung & Vorbereitung (Hermes)",
          mitarbeiter_id: routine.mitarbeiter_id,
        },
      });

      const nachricht = await prisma.agentChatNachricht.create({
        data: {
          agent_chat_id: chat.id,
          rolle: "agent",
          label: "Hermes",
          text: ergebnisText,
        },
      });

      await prisma.agentCronLauf.create({
        data: {
          routine_id: routine.id,
          mitarbeiter_id: routine.mitarbeiter_id,
          datum: heuteDatum,
          status: "erfolgreich",
          ergebnis_text: ergebnisText,
          agent_chat_id: chat.id,
          agent_chat_nachricht_id: nachricht.id,
        },
      });

      await prisma.agentRoutine.update({
        where: { id: routine.id },
        data: { letzter_lauf_am: heute },
      });
    } catch (fehler) {
      await prisma.agentCronLauf.create({
        data: {
          routine_id: routine.id,
          mitarbeiter_id: routine.mitarbeiter_id,
          datum: heuteDatum,
          status: "fehlgeschlagen",
          fehlermeldung: fehler instanceof Error ? fehler.message : "Unbekannter Fehler",
        },
      });

      // letzter_lauf_am wird auch bei Fehlschlag gesetzt, damit derselbe
      // Fehler nicht alle 15 Minuten erneut ausgelöst wird — nächster
      // Versuch erst am folgenden aktiven Wochentag.
      await prisma.agentRoutine.update({
        where: { id: routine.id },
        data: { letzter_lauf_am: heute },
      });
    }
  }
}
