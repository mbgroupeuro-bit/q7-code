// Notizen — Prisma-Adapter
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\notizen-prisma-adapter.ts
//
// Neu (04.09.2026). tags wird wie bei MeineAufgabe als komma-getrennter
// String in der DB gehalten und im Adapter zu string[] geparst.

import { PrismaClient } from "@prisma/client";
import type {
  NotizenDatenZugriff,
  Notiz,
  NeueNotizInput,
  NotizAktualisierenInput,
} from "./notizen-interface";

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

function zuNotiz(n: {
  id: string;
  titel: string;
  text: string;
  kunde: string | null;
  projekt_id: string | null;
  tags: string | null;
  erstellt_von: string;
  erstellt_am: Date;
  aktualisiert_am: Date;
}): Notiz {
  return {
    ...n,
    tags: tagsZuArray(n.tags),
    erstellt_am: n.erstellt_am.toISOString(),
    aktualisiert_am: n.aktualisiert_am.toISOString(),
  };
}

export class PrismaNotizenAdapter implements NotizenDatenZugriff {
  constructor(private prisma: PrismaClient) {}

  async getNotizen(): Promise<Notiz[]> {
    const notizen = await this.prisma.notiz.findMany({
      orderBy: { aktualisiert_am: "desc" },
    });
    return notizen.map(zuNotiz);
  }

  async getNotiz(id: string): Promise<Notiz | null> {
    const notiz = await this.prisma.notiz.findUnique({ where: { id } });
    return notiz ? zuNotiz(notiz) : null;
  }

  async createNotiz(input: NeueNotizInput): Promise<Notiz> {
    const notiz = await this.prisma.notiz.create({
      data: {
        titel: input.titel,
        text: input.text,
        kunde: input.kunde || null,
        projekt_id: input.projekt_id || null,
        tags: tagsZuString(input.tags),
      },
    });
    return zuNotiz(notiz);
  }

  async updateNotiz(id: string, input: NotizAktualisierenInput): Promise<Notiz> {
    const notiz = await this.prisma.notiz.update({
      where: { id },
      data: {
        ...(input.titel !== undefined && { titel: input.titel }),
        ...(input.text !== undefined && { text: input.text }),
        ...(input.kunde !== undefined && { kunde: input.kunde }),
        ...(input.projekt_id !== undefined && { projekt_id: input.projekt_id }),
        ...(input.tags !== undefined && { tags: tagsZuString(input.tags) }),
      },
    });
    return zuNotiz(notiz);
  }

  async deleteNotiz(id: string): Promise<void> {
    await this.prisma.notiz.delete({ where: { id } });
  }
}
