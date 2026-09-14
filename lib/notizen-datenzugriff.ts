// Notizen — zentrale Adapter-Auswahl
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\notizen-datenzugriff.ts
//
// Analog zu lib/aufgaben-datenzugriff.ts: nutzt die zentrale, geteilte
// Prisma-Client-Instanz aus lib/prisma.ts.

import { prisma } from "./prisma";
import { PrismaNotizenAdapter } from "./notizen-prisma-adapter";
import type { NotizenDatenZugriff } from "./notizen-interface";

export function getNotizenDatenZugriff(): NotizenDatenZugriff {
  return new PrismaNotizenAdapter(prisma);
}
