// D:\Projekt2027\Basismodule\Posteingang\lib\posteingang\types.ts
//
// Feste Typen für das Posteingang-Basismodul. UI und Interface kennen nur
// diese Typen, nie ein Prisma-Modell direkt.

export type Prioritaet = "niedrig" | "mittel" | "hoch";
export type KiVorschlagStatus = "offen" | "uebernommen" | "abgelehnt";
export type Akteur = "mensch" | "ki";

export type Bereich = {
  id: string;
  name: string;
};

export type Mitarbeiter = {
  id: string;
  name: string;
  bereich_id: string;
  sieht_alle_bereiche: boolean;
};

export type PosteingangEintrag = {
  id: string;
  kanal: string;
  absender: string;
  zeitstempel: string; // ISO-String
  inhalt: string;
  anhaenge: string | null;
  status: string;
  anliegen_typ: string | null;
  ziel_agent: string | null;
  dringlichkeit: string | null;
  konfidenz: string | null;

  prioritaet: Prioritaet | null;
  bereich_id: string | null;
  verantwortlich_id: string | null;

  ki_vorschlag_status: KiVorschlagStatus | null;
  ki_vorschlag_prioritaet: Prioritaet | null;
  ki_vorschlag_bereich_id: string | null;
  ki_vorschlag_verantwortlich_id: string | null;

  erstellt_am: string;
  aktualisiert_am: string;
};

export type PosteingangChatEintrag = {
  id: number;
  posteingang_id: string;
  absender: string;
  nachricht: string;
  zeitstempel: string;
};

export type PosteingangVerlaufEintrag = {
  id: number;
  posteingang_id: string;
  akteur: Akteur;
  akteur_name: string | null;
  aktion: string;
  alter_wert: string | null;
  neuer_wert: string | null;
  kommentar: string | null;
  zeitstempel: string;
};

export type PosteingangFilter = {
  kanal?: string;
  bereich_id?: string;
  verantwortlich_id?: string;
  prioritaet?: Prioritaet;
  status?: string;
};

export type PosteingangUpdateDaten = {
  status?: string;
  prioritaet?: Prioritaet;
  bereich_id?: string;
  verantwortlich_id?: string;
};

export type AkteurInfo = {
  akteur: Akteur;
  akteur_name?: string;
  kommentar?: string;
};
