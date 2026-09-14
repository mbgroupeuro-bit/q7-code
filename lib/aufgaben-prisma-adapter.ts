// Basismodul "Meine Aufgaben" — Prisma-Adapter
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\aufgaben-prisma-adapter.ts
//
// HINWEIS (13.09.2026): Ursprünglich war als Speicherort lib/prisma-adapter.ts
// vorgesehen (siehe alter Kommentarkopf). Dieser Pfad wird jedoch bereits vom
// Kalender-Modul belegt (prismaKalenderAdapter, lib/prisma-adapter.ts). Um den
// funktionierenden Kalender-Adapter nicht zu überschreiben/verschieben, liegt
// dieser Adapter unter eigenem Dateinamen. Import in aufgaben-datenzugriff.ts
// entsprechend anpassen (siehe Hinweis am Ende dieser Datei).
//
// Implementiert AufgabenDatenZugriff für Projekte, die direkt mit Prisma
// arbeiten (z.B. Q7).
//
// Einbau in Q7 (03.09.2026): "aufgabe_id" -> "posteingang_id" umbenannt.
//
// Änderung (04.09.2026): nummer-Vergabe (applikationsseitig, da SQLite kein
// Autoincrement auf Nicht-Primary-Key-Spalten unterstützt), tags (komma-
// getrennt in der DB, als string[] im Interface), deleteAufgabe() (löscht
// abhängige Teilaufgaben/Verlauf/Anhänge zuerst, da die Foreign Keys
// ON DELETE RESTRICT sind), addAnhang()/removeAnhang() (nutzen lib/ablage.ts
// für die physische Datei-Speicherung, hier nur die Verknüpfungstabelle
// meine_aufgabe_anhang).

import { PrismaClient } from "@prisma/client";
import { speichereAblageDatei, loescheAblageDatei, ladeIndex } from "@/lib/ablage";
import type {
  AufgabenDatenZugriff,
  AufgabenFilter,
  AufgabeAktualisierenInput,
  AnhangEintrag,
  MeineAufgabe,
  MeineAufgabeMitVerlauf,
  MeineAufgabeVerlaufEintrag,
  NeueAufgabeInput,
  Teilaufgabe,
  VerlaufTyp,
} from "./aufgaben-interface";

function tagsZuArray(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function tagsZuString(tags: string[] | undefined): string | null {
  if (!tags || tags.length === 0) return null;
  return tags.map((t) => t.trim()).filter((t) => t.length > 0).join(",");
}

function zuMeineAufgabe(a: {
  id: string;
  nummer: number | null;
  titel: string;
  beschreibung: string | null;
  zugewiesen_an: string;
  quelle: string;
  status: string;
  erstellt_am: Date;
  erledigt_am: Date | null;
  faelligkeit: Date | null;
  prioritaet: string | null;
  farbe: string | null;
  tags: string | null;
  absender: string | null;
  kontakt: string | null;
  original_nachricht: string | null;
  posteingang_id: string | null;
  projekt_id: string | null;
}): MeineAufgabe {
  return {
    ...a,
    status: a.status as MeineAufgabe["status"],
    prioritaet: a.prioritaet as MeineAufgabe["prioritaet"],
    tags: tagsZuArray(a.tags),
    erstellt_am: a.erstellt_am.toISOString(),
    erledigt_am: a.erledigt_am ? a.erledigt_am.toISOString() : null,
    faelligkeit: a.faelligkeit ? a.faelligkeit.toISOString() : null,
  };
}

function zuVerlaufEintrag(v: {
  id: number;
  meineAufgabe_id: string;
  typ: string;
  text: string;
  erstellt_von: string;
  erstellt_am: Date;
}): MeineAufgabeVerlaufEintrag {
  return {
    ...v,
    typ: v.typ as VerlaufTyp,
    erstellt_am: v.erstellt_am.toISOString(),
  };
}

function zuTeilaufgabe(t: {
  id: string;
  meineAufgabe_id: string;
  titel: string;
  status: string;
  erstellt_am: Date;
  erledigt_am: Date | null;
}): Teilaufgabe {
  return {
    ...t,
    status: t.status as Teilaufgabe["status"],
    erstellt_am: t.erstellt_am.toISOString(),
    erledigt_am: t.erledigt_am ? t.erledigt_am.toISOString() : null,
  };
}

export class PrismaAufgabenAdapter implements AufgabenDatenZugriff {
  constructor(private prisma: PrismaClient) {}

  async getAufgaben(filter?: AufgabenFilter): Promise<MeineAufgabe[]> {
    const aufgaben = await this.prisma.meineAufgabe.findMany({
      where: {
        ...(filter?.prioritaet && { prioritaet: filter.prioritaet }),
        ...(filter?.zugewiesen_an && { zugewiesen_an: filter.zugewiesen_an }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.tag && { tags: { contains: filter.tag } }),
        ...((filter?.faelligVon || filter?.faelligBis) && {
          faelligkeit: {
            ...(filter?.faelligVon && { gte: new Date(filter.faelligVon) }),
            ...(filter?.faelligBis && { lte: new Date(filter.faelligBis) }),
          },
        }),
        ...(filter?.suchtext && {
          OR: [
            { titel: { contains: filter.suchtext } },
            { beschreibung: { contains: filter.suchtext } },
          ],
        }),
      },
      orderBy: { erstellt_am: "desc" },
    });

    return aufgaben.map(zuMeineAufgabe);
  }

  async getAufgabeMitVerlauf(id: string): Promise<MeineAufgabeMitVerlauf | null> {
    const aufgabe = await this.prisma.meineAufgabe.findUnique({
      where: { id },
      include: {
        verlauf: { orderBy: { erstellt_am: "asc" } },
        teilaufgaben: { orderBy: { erstellt_am: "asc" } },
        anhaenge: { orderBy: { hinzugefuegt_am: "asc" } },
      },
    });

    if (!aufgabe) return null;

    const anhaenge = await this.anhaengeZuEintraegen(aufgabe.anhaenge);

    return {
      ...zuMeineAufgabe(aufgabe),
      verlauf: aufgabe.verlauf.map(zuVerlaufEintrag),
      teilaufgaben: aufgabe.teilaufgaben.map(zuTeilaufgabe),
      anhaenge,
    };
  }

  async createAufgabe(input: NeueAufgabeInput): Promise<MeineAufgabe> {
    // nummer applikationsseitig vergeben (siehe Schema-Kommentar): SQLite
    // erlaubt Autoincrement nur auf dem Primary Key. Race-Condition-Risiko
    // ist beim aktuellen Q7-Teststand (Einzelnutzer) vernachlässigbar.
    const höchsteNummer = await this.prisma.meineAufgabe.aggregate({
      _max: { nummer: true },
    });
    const naechsteNummer = (höchsteNummer._max.nummer ?? 0) + 1;

    const neueAufgabe = await this.prisma.meineAufgabe.create({
      data: {
        nummer: naechsteNummer,
        titel: input.titel,
        beschreibung: input.beschreibung || null,
        zugewiesen_an: input.zugewiesen_an || "admin",
        quelle: "manuell",
        prioritaet: input.prioritaet || null,
        farbe: input.farbe || null,
        faelligkeit: input.faelligkeit ? new Date(input.faelligkeit) : null,
        projekt_id: input.projekt_id || null,
        tags: tagsZuString(input.tags),
      },
    });

    return zuMeineAufgabe(neueAufgabe);
  }

  async updateAufgabe(
    id: string,
    input: AufgabeAktualisierenInput,
    ausgefuehrtVon: string
  ): Promise<MeineAufgabe> {
    const bisherige = await this.prisma.meineAufgabe.findUnique({ where: { id } });
    if (!bisherige) {
      throw new Error(`MeineAufgabe mit id ${id} nicht gefunden.`);
    }

    const aktualisiert = await this.prisma.meineAufgabe.update({
      where: { id },
      data: {
        ...(input.status !== undefined && {
          status: input.status,
          erledigt_am: input.status === "erledigt" ? new Date() : null,
        }),
        ...(input.zugewiesen_an !== undefined && { zugewiesen_an: input.zugewiesen_an }),
        ...(input.prioritaet !== undefined && { prioritaet: input.prioritaet }),
        ...(input.farbe !== undefined && { farbe: input.farbe }),
        ...(input.faelligkeit !== undefined && {
          faelligkeit: input.faelligkeit ? new Date(input.faelligkeit) : null,
        }),
        ...(input.projekt_id !== undefined && { projekt_id: input.projekt_id }),
        ...(input.tags !== undefined && { tags: tagsZuString(input.tags) }),
      },
    });

    // Automatischer Verlaufseintrag bei Statusänderung (siehe Absprache 31.08.2026)
    if (input.status !== undefined && input.status !== bisherige.status) {
      await this.addVerlaufEintrag(
        id,
        "status_geaendert",
        `Status geändert: ${bisherige.status} → ${input.status}`,
        ausgefuehrtVon
      );
    }

    return zuMeineAufgabe(aktualisiert);
  }

  async deleteAufgabe(id: string): Promise<void> {
    // Physische Anhang-Dateien in der Ablage zuerst löschen, dann erst die
    // DB-Zeilen — sonst blieben verwaiste Dateien in 08_ABLAGE liegen.
    const anhaenge = await this.prisma.meineAufgabeAnhang.findMany({ where: { meineAufgabe_id: id } });
    for (const anhang of anhaenge) {
      await loescheAblageDatei(anhang.ablage_id).catch(() => {
        /* Datei evtl. schon weg -> DB-Zeile trotzdem entfernen */
      });
    }

    // Foreign Keys sind ON DELETE RESTRICT -> abhängige Zeilen müssen vor
    // der Aufgabe selbst gelöscht werden.
    await this.prisma.$transaction([
      this.prisma.meineAufgabeAnhang.deleteMany({ where: { meineAufgabe_id: id } }),
      this.prisma.teilaufgabe.deleteMany({ where: { meineAufgabe_id: id } }),
      this.prisma.meineAufgabeVerlauf.deleteMany({ where: { meineAufgabe_id: id } }),
      this.prisma.meineAufgabe.delete({ where: { id } }),
    ]);
  }

  async addVerlaufEintrag(
    meineAufgabeId: string,
    typ: VerlaufTyp,
    text: string,
    erstelltVon: string
  ): Promise<MeineAufgabeVerlaufEintrag> {
    const eintrag = await this.prisma.meineAufgabeVerlauf.create({
      data: {
        meineAufgabe_id: meineAufgabeId,
        typ,
        text,
        erstellt_von: erstelltVon,
      },
    });

    return zuVerlaufEintrag(eintrag);
  }

  async createTeilaufgabe(meineAufgabeId: string, titel: string): Promise<Teilaufgabe> {
    const teilaufgabe = await this.prisma.teilaufgabe.create({
      data: {
        meineAufgabe_id: meineAufgabeId,
        titel,
      },
    });

    return zuTeilaufgabe(teilaufgabe);
  }

  async updateTeilaufgabeStatus(teilaufgabeId: string, status: "offen" | "erledigt"): Promise<Teilaufgabe> {
    const aktualisiert = await this.prisma.teilaufgabe.update({
      where: { id: teilaufgabeId },
      data: {
        status,
        erledigt_am: status === "erledigt" ? new Date() : null,
      },
    });

    return zuTeilaufgabe(aktualisiert);
  }

  async getMitarbeiterListe(): Promise<string[]> {
    const ergebnisse = await this.prisma.meineAufgabe.findMany({
      distinct: ["zugewiesen_an"],
      select: { zugewiesen_an: true },
    });

    return ergebnisse.map((e) => e.zugewiesen_an);
  }

  async weiterleiten(
    id: string,
    an: string,
    ausgefuehrtVon: string,
    kommentar?: string
  ): Promise<MeineAufgabe> {
    const bisherige = await this.prisma.meineAufgabe.findUnique({ where: { id } });
    if (!bisherige) {
      throw new Error(`MeineAufgabe mit id ${id} nicht gefunden.`);
    }

    const aktualisiert = await this.prisma.meineAufgabe.update({
      where: { id },
      data: { zugewiesen_an: an },
    });

    const basisText = `Weitergeleitet von ${bisherige.zugewiesen_an} an ${an}`;
    const text = kommentar?.trim() ? `${basisText} — ${kommentar.trim()}` : basisText;

    await this.addVerlaufEintrag(id, "weiterleitung", text, ausgefuehrtVon);

    return zuMeineAufgabe(aktualisiert);
  }

  async addAnhang(
    meineAufgabeId: string,
    dateiname: string,
    inhaltBase64: string,
    mimeType: string
  ): Promise<AnhangEintrag> {
    const aufgabe = await this.prisma.meineAufgabe.findUnique({ where: { id: meineAufgabeId } });
    if (!aufgabe) {
      throw new Error(`MeineAufgabe mit id ${meineAufgabeId} nicht gefunden.`);
    }

    // Physische Speicherung + SEC-GATE-Prüfung übernimmt lib/ablage.ts
    // vollständig (Dateityp-Whitelist, Größenlimit, eindeutiger Dateiname).
    const ablageEintrag = await speichereAblageDatei(
      dateiname,
      inhaltBase64,
      mimeType,
      `Meine Aufgabe: ${aufgabe.titel}`
    );

    const anhang = await this.prisma.meineAufgabeAnhang.create({
      data: {
        meineAufgabe_id: meineAufgabeId,
        ablage_id: ablageEintrag.id,
      },
    });

    return {
      id: anhang.id,
      ablage_id: ablageEintrag.id,
      dateiname: ablageEintrag.dateiname,
      mimeType: ablageEintrag.mimeType,
      groesse: ablageEintrag.groesse,
      hinzugefuegt_am: anhang.hinzugefuegt_am.toISOString(),
    };
  }

  async removeAnhang(meineAufgabeId: string, anhangId: string): Promise<void> {
    const anhang = await this.prisma.meineAufgabeAnhang.findUnique({ where: { id: anhangId } });
    if (!anhang || anhang.meineAufgabe_id !== meineAufgabeId) {
      throw new Error("Anhang nicht gefunden oder gehört nicht zu dieser Aufgabe.");
    }

    await loescheAblageDatei(anhang.ablage_id).catch(() => {
      /* Datei evtl. schon weg -> DB-Zeile trotzdem entfernen */
    });

    await this.prisma.meineAufgabeAnhang.delete({ where: { id: anhangId } });
  }

  private async anhaengeZuEintraegen(
    anhaenge: { id: string; ablage_id: string; hinzugefuegt_am: Date }[]
  ): Promise<AnhangEintrag[]> {
    if (anhaenge.length === 0) return [];

    const ablageIndex = await ladeIndex();
    const ablageMap = new Map(ablageIndex.map((e) => [e.id, e]));

    return anhaenge
      .map((a) => {
        const ablageEintrag = ablageMap.get(a.ablage_id);
        if (!ablageEintrag) return null; // Ablage-Eintrag wurde extern gelöscht -> überspringen
        return {
          id: a.id,
          ablage_id: a.ablage_id,
          dateiname: ablageEintrag.dateiname,
          mimeType: ablageEintrag.mimeType,
          groesse: ablageEintrag.groesse,
          hinzugefuegt_am: a.hinzugefuegt_am.toISOString(),
        };
      })
      .filter((a): a is AnhangEintrag => a !== null);
  }
}
