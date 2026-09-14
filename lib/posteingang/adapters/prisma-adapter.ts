// D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\posteingang\adapters\prisma-adapter.ts
//
// Prisma-Adapter für Q7 (reines Next.js-Projekt, direkter DB-Zugriff über
// Prisma zulässig — siehe Basismodul-Konzept Abschnitt 4a). Erfüllt das
// PosteingangDatenQuelle-Interface. Kein UI-Code kennt diese Datei direkt
// außerhalb der API-Routen dieses Moduls.
//
// Änderung (04.09.2026), verlegeZuMeineAufgabe(): "beschreibung" enthielt
// bisher den rohen HTML-Quelltext (inkl. Outlook-/MSO-Kommentaren) 1:1 aus
// eintrag.inhalt — dieselbe Bereinigung, die PosteingangListe.tsx für die
// Anzeige nutzt (htmlZuText, jetzt in lib/htmlZuText.ts ausgelagert), wird
// hier beim Verlegen einmalig angewendet, sodass die neue MeineAufgabe
// direkt sauberen Text erhält. Zusätzlich werden absender und
// original_nachricht mitgegeben (Felder existieren im Schema und werden von
// AufgabeDetail.tsx schon angezeigt, blieben bisher aber leer).
//
// Hinweis: Diese Bereinigung gilt nur für ab jetzt neu verlegte Aufgaben.
// Bereits bestehende MeineAufgabe-Einträge mit rohem HTML in beschreibung
// werden dadurch NICHT rückwirkend korrigiert (bewusste Entscheidung,
// 04.09.2026 — kein Backfill).

import { prisma } from "@/lib/prisma";
import { htmlZuText } from "@/lib/htmlZuText";
import { getAktuelleMitarbeiterId } from "../aktueller-mitarbeiter";
import type { PosteingangDatenQuelle } from "../interface";
import type {
  AkteurInfo,
  Mitarbeiter,
  PosteingangEintrag,
  PosteingangFilter,
  PosteingangUpdateDaten,
} from "../types";

function zuIso(datum: Date): string {
  return datum.toISOString();
}

function mappeEintrag(row: {
  id: string;
  kanal: string;
  absender: string;
  zeitstempel: Date;
  inhalt: string;
  anhaenge: string | null;
  status: string;
  anliegen_typ: string | null;
  ziel_agent: string | null;
  dringlichkeit: string | null;
  konfidenz: string | null;
  prioritaet: string | null;
  bereich_id: string | null;
  verantwortlich_id: string | null;
  ki_vorschlag_status: string | null;
  ki_vorschlag_prioritaet: string | null;
  ki_vorschlag_bereich_id: string | null;
  ki_vorschlag_verantwortlich_id: string | null;
  erstellt_am: Date;
  aktualisiert_am: Date;
}): PosteingangEintrag {
  return {
    id: row.id,
    kanal: row.kanal,
    absender: row.absender,
    zeitstempel: zuIso(row.zeitstempel),
    inhalt: row.inhalt,
    anhaenge: row.anhaenge,
    status: row.status,
    anliegen_typ: row.anliegen_typ,
    ziel_agent: row.ziel_agent,
    dringlichkeit: row.dringlichkeit,
    konfidenz: row.konfidenz,
    prioritaet: row.prioritaet as PosteingangEintrag["prioritaet"],
    bereich_id: row.bereich_id,
    verantwortlich_id: row.verantwortlich_id,
    ki_vorschlag_status: row.ki_vorschlag_status as PosteingangEintrag["ki_vorschlag_status"],
    ki_vorschlag_prioritaet: row.ki_vorschlag_prioritaet as PosteingangEintrag["ki_vorschlag_prioritaet"],
    ki_vorschlag_bereich_id: row.ki_vorschlag_bereich_id,
    ki_vorschlag_verantwortlich_id: row.ki_vorschlag_verantwortlich_id,
    erstellt_am: zuIso(row.erstellt_am),
    aktualisiert_am: zuIso(row.aktualisiert_am),
  };
}

/**
 * Ermittelt den aktuellen Mitarbeiter und die daraus resultierende
 * Sichtbarkeits-Einschränkung (Grill-Me, Punkt 5): Mitarbeiter ohne
 * "sieht_alle_bereiche" sehen nur ihren eigenen Bereich, in beiden
 * Ansichten (Standard + Bearbeitung) gleichermaßen.
 *
 * Ist kein Mitarbeiter-Header gesetzt (aktueller Q7-Teststand, nur ein
 * Admin-Nutzer ohne Mitarbeiter-Zuordnung), bleibt die Sicht unbeschränkt.
 */
async function ermittleSicht(): Promise<{
  mitarbeiter: Mitarbeiter | null;
  bereichEinschraenkung: string | null;
}> {
  const mitarbeiterId = await getAktuelleMitarbeiterId();
  if (!mitarbeiterId) {
    return { mitarbeiter: null, bereichEinschraenkung: null };
  }

  const row = await prisma.mitarbeiter.findUnique({ where: { id: mitarbeiterId } });
  if (!row) {
    return { mitarbeiter: null, bereichEinschraenkung: null };
  }

  const mitarbeiter: Mitarbeiter = {
    id: row.id,
    name: row.name,
    bereich_id: row.bereich_id,
    sieht_alle_bereiche: row.sieht_alle_bereiche,
  };

  return {
    mitarbeiter,
    bereichEinschraenkung: row.sieht_alle_bereiche ? null : row.bereich_id,
  };
}

export const prismaPosteingangAdapter: PosteingangDatenQuelle = {
  async getEintraege(filter?: PosteingangFilter) {
    const { bereichEinschraenkung } = await ermittleSicht();

    const where: Record<string, unknown> = {};
    if (filter?.kanal) where.kanal = filter.kanal;
    if (filter?.status) where.status = filter.status;
    if (filter?.prioritaet) where.prioritaet = filter.prioritaet;
    if (filter?.verantwortlich_id) where.verantwortlich_id = filter.verantwortlich_id;

    // Sichtbarkeitsregel geht vor manuellem Filter-Wunsch (Grill-Me, Punkt 5):
    // ein eingeschränkter Mitarbeiter kann sich nicht über den Bereich-Filter
    // hinweg andere Bereiche anzeigen lassen.
    if (bereichEinschraenkung) {
      where.bereich_id = bereichEinschraenkung;
    } else if (filter?.bereich_id) {
      where.bereich_id = filter.bereich_id;
    }

    const rows = await prisma.posteingangEintrag.findMany({
      where,
      orderBy: { zeitstempel: "desc" },
    });
    return rows.map(mappeEintrag);
  },

  async getEintrag(id: string) {
    const row = await prisma.posteingangEintrag.findUnique({ where: { id } });
    return row ? mappeEintrag(row) : null;
  },

  async getChatVerlauf(posteingangId: string) {
    const rows = await prisma.posteingangChat.findMany({
      where: { posteingang_id: posteingangId },
      orderBy: { zeitstempel: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      posteingang_id: r.posteingang_id,
      absender: r.absender,
      nachricht: r.nachricht,
      zeitstempel: zuIso(r.zeitstempel),
    }));
  },

  async getVerlauf(posteingangId: string) {
    const rows = await prisma.posteingangVerlauf.findMany({
      where: { posteingang_id: posteingangId },
      orderBy: { zeitstempel: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      posteingang_id: r.posteingang_id,
      akteur: r.akteur as "mensch" | "ki",
      akteur_name: r.akteur_name,
      aktion: r.aktion,
      alter_wert: r.alter_wert,
      neuer_wert: r.neuer_wert,
      kommentar: r.kommentar,
      zeitstempel: zuIso(r.zeitstempel),
    }));
  },

  async getBereiche() {
    const rows = await prisma.bereich.findMany({ orderBy: { name: "asc" } });
    return rows.map((r) => ({ id: r.id, name: r.name }));
  },

  async getMitarbeiter(bereichId?: string) {
    const rows = await prisma.mitarbeiter.findMany({
      where: bereichId ? { bereich_id: bereichId } : undefined,
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      bereich_id: r.bereich_id,
      sieht_alle_bereiche: r.sieht_alle_bereiche,
    }));
  },

  async getAktuellenMitarbeiter() {
    const { mitarbeiter } = await ermittleSicht();
    return mitarbeiter;
  },

  async updateEintrag(id: string, daten: PosteingangUpdateDaten, akteurInfo: AkteurInfo) {
    const vorher = await prisma.posteingangEintrag.findUnique({ where: { id } });
    if (!vorher) {
      throw new Error("Posteingang-Eintrag nicht gefunden.");
    }

    const aktualisiert = await prisma.posteingangEintrag.update({
      where: { id },
      data: {
        ...(daten.status !== undefined && { status: daten.status }),
        ...(daten.prioritaet !== undefined && { prioritaet: daten.prioritaet }),
        ...(daten.bereich_id !== undefined && { bereich_id: daten.bereich_id }),
        ...(daten.verantwortlich_id !== undefined && { verantwortlich_id: daten.verantwortlich_id }),
      },
    });

    // Verlauf protokollieren (Grill-Me, Punkt 3, Option A) — ein Eintrag pro
    // tatsächlich geändertem Feld, transparent für Mensch und KI.
    const geaenderteFelder: Array<{
      feld: keyof PosteingangUpdateDaten;
      alt: string | null;
      neu: string | null;
    }> = [
      { feld: "status", alt: vorher.status, neu: aktualisiert.status },
      { feld: "prioritaet", alt: vorher.prioritaet, neu: aktualisiert.prioritaet },
      { feld: "bereich_id", alt: vorher.bereich_id, neu: aktualisiert.bereich_id },
      { feld: "verantwortlich_id", alt: vorher.verantwortlich_id, neu: aktualisiert.verantwortlich_id },
    ];

    for (const { feld, alt, neu } of geaenderteFelder) {
      if (daten[feld] !== undefined && alt !== neu) {
        await prisma.posteingangVerlauf.create({
          data: {
            posteingang_id: id,
            akteur: akteurInfo.akteur,
            akteur_name: akteurInfo.akteur_name ?? null,
            aktion: `${feld}_geaendert`,
            alter_wert: alt,
            neuer_wert: neu,
            kommentar: akteurInfo.kommentar ?? null,
          },
        });
      }
    }

    return mappeEintrag(aktualisiert);
  },

  async antwortSpeichern(posteingangId: string, nachricht: string, absender: string) {
    const eintrag = await prisma.posteingangEintrag.findUnique({ where: { id: posteingangId } });
    if (!eintrag) {
      throw new Error("Posteingang-Eintrag nicht gefunden.");
    }

    const chat = await prisma.posteingangChat.create({
      data: { posteingang_id: posteingangId, absender, nachricht },
    });

    return {
      id: chat.id,
      posteingang_id: chat.posteingang_id,
      absender: chat.absender,
      nachricht: chat.nachricht,
      zeitstempel: zuIso(chat.zeitstempel),
    };
  },

  async verlegeZuMeineAufgabe(posteingangId: string, zugewiesenAn?: string) {
    const eintrag = await prisma.posteingangEintrag.findUnique({ where: { id: posteingangId } });
    if (!eintrag) {
      throw new Error("Posteingang-Eintrag nicht gefunden.");
    }

    const bereinigterInhalt = htmlZuText(eintrag.inhalt);

    const neueAufgabe = await prisma.meineAufgabe.create({
      data: {
        titel: `${eintrag.anliegen_typ ?? "Eingang"} — ${eintrag.absender}`,
        beschreibung: bereinigterInhalt,
        zugewiesen_an: zugewiesenAn?.trim() || "admin",
        quelle: "kanal_verlegt",
        posteingang_id: eintrag.id,
        absender: eintrag.absender,
        original_nachricht: bereinigterInhalt,
      },
    });

    return { id: neueAufgabe.id };
  },

  async kiVorschlagUebernehmen(posteingangId: string, kommentar?: string) {
    const eintrag = await prisma.posteingangEintrag.findUnique({ where: { id: posteingangId } });
    if (!eintrag || eintrag.ki_vorschlag_status !== "offen") {
      throw new Error("Kein offener KI-Vorschlag für diesen Eintrag.");
    }

    const aktualisiert = await prisma.posteingangEintrag.update({
      where: { id: posteingangId },
      data: {
        prioritaet: eintrag.ki_vorschlag_prioritaet,
        bereich_id: eintrag.ki_vorschlag_bereich_id,
        verantwortlich_id: eintrag.ki_vorschlag_verantwortlich_id,
        ki_vorschlag_status: "uebernommen",
      },
    });

    await prisma.posteingangVerlauf.create({
      data: {
        posteingang_id: posteingangId,
        akteur: "mensch",
        aktion: "ki_vorschlag_uebernommen",
        neuer_wert: `prioritaet=${eintrag.ki_vorschlag_prioritaet ?? "-"}, bereich_id=${
          eintrag.ki_vorschlag_bereich_id ?? "-"
        }, verantwortlich_id=${eintrag.ki_vorschlag_verantwortlich_id ?? "-"}`,
        kommentar: kommentar ?? null,
      },
    });

    return mappeEintrag(aktualisiert);
  },

  async kiVorschlagAblehnen(posteingangId: string, kommentar?: string) {
    const eintrag = await prisma.posteingangEintrag.findUnique({ where: { id: posteingangId } });
    if (!eintrag || eintrag.ki_vorschlag_status !== "offen") {
      throw new Error("Kein offener KI-Vorschlag für diesen Eintrag.");
    }

    const aktualisiert = await prisma.posteingangEintrag.update({
      where: { id: posteingangId },
      data: { ki_vorschlag_status: "abgelehnt" },
    });

    await prisma.posteingangVerlauf.create({
      data: {
        posteingang_id: posteingangId,
        akteur: "mensch",
        aktion: "ki_vorschlag_abgelehnt",
        alter_wert: `prioritaet=${eintrag.ki_vorschlag_prioritaet ?? "-"}, bereich_id=${
          eintrag.ki_vorschlag_bereich_id ?? "-"
        }, verantwortlich_id=${eintrag.ki_vorschlag_verantwortlich_id ?? "-"}`,
        kommentar: kommentar ?? null,
      },
    });

    return mappeEintrag(aktualisiert);
  },
};
