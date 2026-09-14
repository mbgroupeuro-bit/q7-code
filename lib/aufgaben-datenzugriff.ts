// Basismodul "Meine Aufgaben" — zentrale Adapter-Auswahl
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\aufgaben-datenzugriff.ts
//
// Einzige Stelle im Modul, die festlegt, welcher Adapter tatsächlich verwendet
// wird. Für Q7 (direkt Prisma) ist das aktuell immer PrismaAufgabenAdapter.
// Für ein Projekt mit getrenntem Backend (z.B. Q7-ERP) würde hier stattdessen
// ein NestJsAufgabenAdapter zurückgegeben — der Rest des Moduls (API-Routen,
// UI) bleibt dabei unverändert, da beide Adapter AufgabenDatenZugriff erfüllen.
//
// Einbau in Q7 (04.09.2026): nutzt die zentrale, geteilte Prisma-Client-Instanz
// aus lib/prisma.ts, statt eine eigene zu erstellen. Die ursprüngliche Basismodul-
// Version hatte hier ein eigenes Q7_AGENTEN_DB_URL-Fallback-Muster — das wurde
// laut lib/prisma.ts bewusst projektweit entfernt (Risiko: Routen könnten sonst
// versehentlich gegen unterschiedliche Datenbanken laufen). Deshalb hier nicht
// wieder eingeführt.
//
// Korrektur (13.09.2026): Import von "./prisma-adapter" auf
// "./aufgaben-prisma-adapter" geändert. "./prisma-adapter" ist bereits vom
// Kalender-Modul belegt (prismaKalenderAdapter) und enthält keinen
// PrismaAufgabenAdapter-Export (Build-Fehler "Export PrismaAufgabenAdapter
// doesn't exist in target module"). Der Aufgaben-Adapter liegt seither unter
// eigenem Dateinamen, um den Kalender-Adapter nicht zu überschreiben.

import { prisma } from "./prisma";
import { PrismaAufgabenAdapter } from "./aufgaben-prisma-adapter";
import type { AufgabenDatenZugriff } from "./aufgaben-interface";

export function getAufgabenDatenZugriff(): AufgabenDatenZugriff {
  return new PrismaAufgabenAdapter(prisma);
}
