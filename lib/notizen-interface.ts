// Notizen — Daten-Interface
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\notizen-interface.ts
//
// Neu (04.09.2026): Eigenständige Notiz-Funktion innerhalb von "Meine
// Aufgaben" (eigener Tab), für lose, wichtige Informationen, die keine
// Aufgabe sind (z.B. Kundendetails). Gleiches Adapter-Pattern wie
// aufgaben-interface.ts, damit künftig auch hier verschiedene
// Backends (Prisma direkt / NestJS) austauschbar bleiben.

export type Notiz = {
  id: string;
  titel: string;
  text: string;
  kunde: string | null;
  projekt_id: string | null;
  tags: string[];
  erstellt_von: string;
  erstellt_am: string; // ISO-String
  aktualisiert_am: string; // ISO-String
};

export type NeueNotizInput = {
  titel: string;
  text: string;
  kunde?: string;
  projekt_id?: string;
  tags?: string[];
};

export type NotizAktualisierenInput = {
  titel?: string;
  text?: string;
  kunde?: string | null;
  projekt_id?: string | null;
  tags?: string[];
};

export interface NotizenDatenZugriff {
  getNotizen(): Promise<Notiz[]>;
  getNotiz(id: string): Promise<Notiz | null>;
  createNotiz(input: NeueNotizInput): Promise<Notiz>;
  updateNotiz(id: string, input: NotizAktualisierenInput): Promise<Notiz>;
  deleteNotiz(id: string): Promise<void>;
}
