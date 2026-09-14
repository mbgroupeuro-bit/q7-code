import { PrismaClient } from "@prisma/client";
import type { ChatAdapter, ChatKanalDto, ChatNachrichtDto, MitarbeiterDto, NeueNachrichtInput } from "./types";

const prisma = new PrismaClient();

function toNachrichtDto(n: {
  id: string;
  absender_id: string;
  absender: { name: string };
  kanal_id: string | null;
  empfaenger_id: string | null;
  text: string;
  erstellt_am: Date;
  anhaenge: { id: string; dateiname: string; dateityp: string; groesse_bytes: number }[];
}): ChatNachrichtDto {
  return {
    id: n.id,
    absenderId: n.absender_id,
    absenderName: n.absender.name,
    kanalId: n.kanal_id,
    empfaengerId: n.empfaenger_id,
    text: n.text,
    erstelltAm: n.erstellt_am.toISOString(),
    anhaenge: n.anhaenge.map((a) => ({
      id: a.id,
      dateiname: a.dateiname,
      dateityp: a.dateityp,
      groesseBytes: a.groesse_bytes,
    })),
  };
}

export const chatAdapterPrisma: ChatAdapter = {
  async getSichtbareKanaele(mitarbeiterId: string): Promise<ChatKanalDto[]> {
    const mitarbeiter = await prisma.mitarbeiter.findUnique({
      where: { id: mitarbeiterId },
    });
    if (!mitarbeiter) return [];

    const kanaele = mitarbeiter.sieht_alle_bereiche
      ? await prisma.chatKanal.findMany({ orderBy: { name: "asc" } })
      : await prisma.chatKanal.findMany({
          where: { bereich_id: mitarbeiter.bereich_id },
          orderBy: { name: "asc" },
        });

    return kanaele.map((k) => ({ id: k.id, name: k.name, bereichId: k.bereich_id }));
  },

  async getMitarbeiterListe(ohneMitarbeiterId: string): Promise<MitarbeiterDto[]> {
    const mitarbeiter = await prisma.mitarbeiter.findMany({
      where: { id: { not: ohneMitarbeiterId } },
      orderBy: { name: "asc" },
    });
    return mitarbeiter.map((m) => ({ id: m.id, name: m.name }));
  },

  async getNachrichtenKanal(kanalId: string, seitId?: string): Promise<ChatNachrichtDto[]> {
    const nachrichten = await prisma.chatNachricht.findMany({
      where: {
        kanal_id: kanalId,
        ...(seitId ? { id: { gt: seitId } } : {}),
      },
      include: { absender: true, anhaenge: true },
      orderBy: { erstellt_am: "asc" },
      take: 200,
    });
    return nachrichten.map(toNachrichtDto);
  },

  async getNachrichtenDirekt(
    mitarbeiterIdA: string,
    mitarbeiterIdB: string,
    seitId?: string
  ): Promise<ChatNachrichtDto[]> {
    const nachrichten = await prisma.chatNachricht.findMany({
      where: {
        AND: [
          { kanal_id: null },
          {
            OR: [
              { absender_id: mitarbeiterIdA, empfaenger_id: mitarbeiterIdB },
              { absender_id: mitarbeiterIdB, empfaenger_id: mitarbeiterIdA },
            ],
          },
          ...(seitId ? [{ id: { gt: seitId } }] : []),
        ],
      },
      include: { absender: true, anhaenge: true },
      orderBy: { erstellt_am: "asc" },
      take: 200,
    });
    return nachrichten.map(toNachrichtDto);
  },

  async createNachricht(input: NeueNachrichtInput): Promise<ChatNachrichtDto> {
    if (!input.kanalId && !input.empfaengerId) {
      throw new Error("Entweder kanalId oder empfaengerId muss gesetzt sein.");
    }
    if (input.kanalId && input.empfaengerId) {
      throw new Error("kanalId und empfaengerId dürfen nicht gleichzeitig gesetzt sein.");
    }

    const nachricht = await prisma.chatNachricht.create({
      data: {
        absender_id: input.absenderId,
        kanal_id: input.kanalId,
        empfaenger_id: input.empfaengerId,
        text: input.text,
        anhaenge: input.anhaenge
          ? {
              create: input.anhaenge.map((a) => ({
                dateiname: a.dateiname,
                pfad: a.pfad,
                dateityp: a.dateityp,
                groesse_bytes: a.groesseBytes,
              })),
            }
          : undefined,
      },
      include: { absender: true, anhaenge: true },
    });

    return toNachrichtDto(nachricht);
  },

  async hatZugriffAufAnhang(mitarbeiterId: string, anhangId: string): Promise<boolean> {
    const anhang = await prisma.chatAnhang.findUnique({
      where: { id: anhangId },
      include: { nachricht: true },
    });
    if (!anhang) return false;

    const n = anhang.nachricht;

    // Direktnachricht: Zugriff nur für Absender oder Empfänger.
    if (n.empfaenger_id) {
      return n.absender_id === mitarbeiterId || n.empfaenger_id === mitarbeiterId;
    }

    // Kanal-Nachricht: Zugriff, wenn der Kanal für den Mitarbeiter sichtbar ist.
    if (n.kanal_id) {
      const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id: mitarbeiterId } });
      if (!mitarbeiter) return false;
      if (mitarbeiter.sieht_alle_bereiche) return true;

      const kanal = await prisma.chatKanal.findUnique({ where: { id: n.kanal_id } });
      return kanal?.bereich_id === mitarbeiter.bereich_id;
    }

    return false;
  },

  async getAnhangDatei(anhangId: string) {
    const anhang = await prisma.chatAnhang.findUnique({ where: { id: anhangId } });
    if (!anhang) return null;
    return { pfad: anhang.pfad, dateiname: anhang.dateiname, dateityp: anhang.dateityp };
  },
};
