// lib/types.ts — VOLLSTÄNDIGER Ersatz (nicht nur AGENTS-Block)
// Aktualisiert 11.07.2026: Agentenmodell-Korrektur nach Admin-Entscheidung
// (reale Struktur 02_KI-UNTERNEHMEN verbindlich, siehe
// Q7_KLAERUNGSBEDARF_Agentenmodell.md). "A01a" -> "A01", alle 15 Agenten aktiv.
// Alle anderen Typen/Konstanten (Space, InputFile, OutputEintrag, WissenEintrag,
// StudioTool, STUDIO_TOOLS, PROTOKOLL_LIST) unverändert aus Original übernommen.

export type AgentKuerzel =
  | "A00" | "A01" | "A02" | "A03" | "A04" | "A05" | "A06" | "A07"
  | "A08" | "A09" | "A10" | "A11" | "A12" | "A13" | "A14"
  | "A15" | "A16" | "A17";

export interface Agent {
  kuerzel: AgentKuerzel;
  name: string;
  rolle: string;
  aktiv: boolean;
}

export interface Space {
  id: string;
  name: string;
  typ: "Solo-Projekt" | "Lizenznehmer-Projekt";
  aktiv: boolean;
  letzteAktivitaet: string;
}

export interface InputFile {
  id: string;
  dateiname: string;
  typ: "PDF" | "MD" | "DOCX" | "Bild";
  eingangsdatum: string;
  status: "Offen" | "Verarbeitet";
  space: string;
}

export interface OutputEintrag {
  id: string;
  dateiname: string;
  space: string;
  erstellungsdatum: string;
  status: "Final" | "In Bearbeitung" | "Zurückgewiesen";
}

export interface ThreadEintrag {
  id: string;
  kommentar: string;
  zeitstempel: string;
  antwort?: string;
  laedt?: boolean;
}

export interface ProtokollEintrag {
  id: string;
  zeitstempel: string;
  akteur: string;
  aktion: string;
  spaceKontext?: string;
  thread?: ThreadEintrag[]; // Comment-driven Wakes: Admin-Kommentar reaktiviert Agent im selben Thread
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  kostenUsd: number | null;
}

// Standard-Modelle für den Vergleichsmodus, falls in .env.local kein
// OPENROUTER_COMPARE_MODELS gesetzt ist. Bewusst nur ein Fallback, keine
// feste Vorgabe — überschreibbar ohne Code-Änderung.
export const STANDARD_VERGLEICHS_MODELLE = [
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-sonnet-5",
  "anthropic/claude-opus-4.8",
];

export interface VergleichsErgebnis {
  modell: string;
  reply: string;
  usage: ChatUsage | null;
}

export interface ChatThread {
  id: string;
  titel: string;
  titelStatus: "pending" | "final";
  agent: string;
  space?: string;
  messages: ChatMessage[];
  aktualisiert: string; // ISO-String, für Sortierung
}

export interface ChatMessage {
  id: string;
  role: "agent" | "user";
  label: string;
  text: string;
  usage?: ChatUsage;
  vergleich?: VergleichsErgebnis[];
}

// AGENTS: vollständig nach realer Struktur 02_KI-UNTERNEHMEN (Admin-Entscheidung
// 10.07.2026). "Hermes" bleibt informelle Zusatzbezeichnung für A01
// (Admin-Entscheidung 10.07.2026, siehe Q7_KLAERUNGSBEDARF_Agentenmodell.md).
export const AGENTS: Agent[] = [
  { kuerzel: "A00", name: "Stab", rolle: "Strategische Planung, Admin-Unterstützung, systemweite Überwachung", aktiv: true },
  { kuerzel: "A01", name: "Planung & Vorbereitung (Hermes)", rolle: "Haupt-Koordinator, routet alle Anfragen", aktiv: true },
  { kuerzel: "A02", name: "Marketing", rolle: "Kommunikation, Außendarstellung", aktiv: true },
  { kuerzel: "A03", name: "Vertrieb", rolle: "Kundenakquise, Angebote", aktiv: true },
  { kuerzel: "A04", name: "PM", rolle: "Projektmanagement", aktiv: true },
  { kuerzel: "A05", name: "QM", rolle: "Qualitätsmanagement", aktiv: true },
  { kuerzel: "A06", name: "Verwaltung", rolle: "Administrative Aufgaben", aktiv: true },
  { kuerzel: "A07", name: "Recht", rolle: "Rechtliche Prüfung, Verträge", aktiv: true },
  { kuerzel: "A08", name: "Finanzen", rolle: "Buchhaltung, Finanzplanung", aktiv: true },
  { kuerzel: "A09", name: "Dokumentation", rolle: "Systemdokumentation, Wissenspflege", aktiv: true },
  { kuerzel: "A10", name: "KI-Center", rolle: "KI-Entwicklung, Modellpflege", aktiv: true },
  { kuerzel: "A11", name: "Systemcontrolling", rolle: "Systemüberwachung, Kennzahlen", aktiv: true },
  { kuerzel: "A12", name: "Zukunftsforschung", rolle: "Trendanalyse, Innovation", aktiv: true },
  { kuerzel: "A13", name: "Personal", rolle: "Personalwesen", aktiv: true },
  { kuerzel: "A14", name: "Sicherheit", rolle: "Compliance, Datenschutz, SEC-GATE", aktiv: true },
  { kuerzel: "A15", name: "Q7-ERP Synchronisation", rolle: "Kontext-Synchronisation zwischen Q7-ERP und Q7 (Domain Events, Webhook Connector)", aktiv: true },
  { kuerzel: "A16", name: "Buchhaltung", rolle: "Finanzbuchhaltung, Belegverarbeitung", aktiv: true },
  { kuerzel: "A17", name: "Design", rolle: "Gestaltung, Markenidentität, visuelle Konsistenz", aktiv: true },
];

export const SPACES: Space[] = [
  { id: "sp-1", name: "Al Amani Küchen", typ: "Lizenznehmer-Projekt", aktiv: true, letzteAktivitaet: "30.06.2026" },
  { id: "sp-2", name: "MK-SALES Rollout", typ: "Solo-Projekt", aktiv: true, letzteAktivitaet: "29.06.2026" },
  { id: "sp-3", name: "Kelaâ Werkstatt Doku", typ: "Solo-Projekt", aktiv: false, letzteAktivitaet: "12.05.2026" },
];

export const INPUT_FILES: InputFile[] = [
  { id: "in-1", dateiname: "Angebot_AlAmani.pdf", typ: "PDF", eingangsdatum: "29.06.2026", status: "Offen", space: "Al Amani Küchen" },
  { id: "in-2", dateiname: "Grundriss_Kelaa.docx", typ: "DOCX", eingangsdatum: "28.06.2026", status: "Verarbeitet", space: "Kelaâ Werkstatt Doku" },
  { id: "in-3", dateiname: "Notizen_Kickoff.md", typ: "MD", eingangsdatum: "27.06.2026", status: "Verarbeitet", space: "Nicht zugeordnet" },
];

export const OUTPUT_LIST: OutputEintrag[] = [
  { id: "out-1", dateiname: "Angebot_v2.docx", space: "Al Amani Küchen", erstellungsdatum: "30.06.2026", status: "Final" },
  { id: "out-2", dateiname: "Produktionsauftrag_ST3.pdf", space: "Kelaâ Werkstatt Doku", erstellungsdatum: "29.06.2026", status: "In Bearbeitung" },
  { id: "out-3", dateiname: "Content_Plan_Juli.md", space: "MK-SALES Rollout", erstellungsdatum: "26.06.2026", status: "Zurückgewiesen" },
];

// Block 3 — Upload-Funktion. kategorie bewusst als string (nicht Union-Type):
// Admin/Lizenznehmer kann eigene Kategorien anlegen (siehe STANDARD_WISSEN_KATEGORIEN
// als Startwerte, erweiterbar über Store ohne Code-Änderung).
export interface UploadedFile {
  id: string;
  name: string;
  typ: string;
  groesse: number;
  kategorie: string;
  space?: string;
  hochgeladenAm: string;
}

export const STANDARD_WISSEN_KATEGORIEN: string[] = ["Verträge", "Vorlagen", "Marken-ID", "Sonstiges"];

export interface WissenEintrag {
  id: string;
  titel: string;
  kategorie: "Verträge" | "Prozesse" | "Preislisten" | "Regeln";
  aktualisiert: string;
  space?: string;
}

export interface StudioFeld {
  id: string;
  label: string;
  typ: "text" | "select";
  optionen?: string[];
  placeholder?: string;
}

export interface StudioTool {
  id: string;
  name: string;
  beschreibung: string;
  agentKuerzel: AgentKuerzel;
  agentName: string;
  kategorie: "Sales" | "Produktion" | "Marketing" | "Verwaltung";
  felder: StudioFeld[];
}

export const WISSEN_EINTRAEGE: WissenEintrag[] = [
  { id: "w-1", titel: "Rahmenvertrag Al Amani Küchen", kategorie: "Verträge", aktualisiert: "18.05.2026", space: "Al Amani Küchen" },
  { id: "w-2", titel: "System-32 Grundregeln", kategorie: "Regeln", aktualisiert: "02.04.2026" },
  { id: "w-3", titel: "Produktionsablauf ST1–ST4", kategorie: "Prozesse", aktualisiert: "29.06.2026" },
  { id: "w-4", titel: "Preisliste Granit & Arbeitsplatten", kategorie: "Preislisten", aktualisiert: "12.06.2026" },
  { id: "w-5", titel: "Zahlungsstandard 40/40/20", kategorie: "Regeln", aktualisiert: "10.03.2026" },
  { id: "w-6", titel: "Freelancer-Vertrag Vorlage", kategorie: "Verträge", aktualisiert: "22.02.2026" },
];

// HINWEIS: agentKuerzel-Werte unten ("A03", "A00", "A02") sind auch nach der
// Agentenmodell-Korrektur weiterhin gültig (unverändert in der neuen Liste
// enthalten) — keine Anpassung nötig.
export const STUDIO_TOOLS: StudioTool[] = [
  {
    id: "st-1",
    name: "Angebot generieren",
    beschreibung: "Erstellt ein Kundenangebot auf Basis von Space-Daten und Preisliste.",
    agentKuerzel: "A03",
    agentName: "Vertrieb",
    kategorie: "Sales",
    felder: [
      { id: "space", label: "Space", typ: "select", optionen: SPACES.map((s) => s.name) },
      { id: "ansprechpartner", label: "Kunde / Ansprechpartner", typ: "text", placeholder: "z.B. Herr Amani" },
      { id: "positionen", label: "Positionen (Kurzbeschreibung)", typ: "text", placeholder: "z.B. Küchenblock 4m, Granit-Arbeitsplatte" },
    ],
  },
  {
    id: "st-2",
    name: "Produktionsauftrag anlegen",
    beschreibung: "Wandelt eine Aufnahme in einen System-32-konformen Produktionsauftrag um.",
    agentKuerzel: "A00",
    agentName: "Stab",
    kategorie: "Produktion",
    felder: [
      { id: "space", label: "Space", typ: "select", optionen: SPACES.map((s) => s.name) },
      { id: "schranktyp", label: "Schranktyp", typ: "select", optionen: ["ST1", "ST2", "ST3", "ST4"] },
      { id: "menge", label: "Menge (Stück)", typ: "text", placeholder: "z.B. 6" },
    ],
  },
  {
    id: "st-3",
    name: "Content-Plan erstellen",
    beschreibung: "Erstellt einen Kanal-übergreifenden Content-Plan für den gewählten Zeitraum.",
    agentKuerzel: "A02",
    agentName: "Marketing",
    kategorie: "Marketing",
    felder: [
      { id: "zeitraum", label: "Zeitraum", typ: "select", optionen: ["Diese Woche", "Dieser Monat", "Nächster Monat"] },
      { id: "kanal", label: "Kanal", typ: "select", optionen: ["Facebook", "Instagram", "LinkedIn", "Alle Kanäle"] },
    ],
  },
  {
    id: "st-4",
    name: "Vertrag entwerfen",
    beschreibung: "Erstellt einen Vertragsentwurf auf Basis einer Wissens-Vorlage.",
    agentKuerzel: "A00",
    agentName: "Stab",
    kategorie: "Verwaltung",
    felder: [
      { id: "space", label: "Space", typ: "select", optionen: SPACES.map((s) => s.name) },
      { id: "vertragsart", label: "Vertragsart", typ: "select", optionen: ["Rahmenvertrag", "Freelancer-Vertrag", "Sonstiges"] },
      { id: "empfaenger", label: "Empfänger", typ: "text", placeholder: "Name des Empfängers" },
    ],
  },
];

// HINWEIS: akteur "A01a" in p-2 unten auf "A01" korrigiert (Konsistenz mit
// neuem Agentenmodell). Reine Mock-/Demo-Daten, keine funktionale Auswirkung.
export const PROTOKOLL_LIST: ProtokollEintrag[] = [
  { id: "p-1", zeitstempel: "30.06.2026 · 17:42", akteur: "Admin", aktion: "Output freigegeben", spaceKontext: "Al Amani Küchen" },
  { id: "p-2", zeitstempel: "30.06.2026 · 16:10", akteur: "A01", aktion: "Chat gestartet" },
  { id: "p-3", zeitstempel: "29.06.2026 · 11:03", akteur: "A03", aktion: "Angebot entworfen", spaceKontext: "Al Amani Küchen" },
  { id: "p-4", zeitstempel: "27.06.2026 · 09:20", akteur: "Admin", aktion: "Space erstellt", spaceKontext: "Kelaâ Werkstatt Doku" },
];
