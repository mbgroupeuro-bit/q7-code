// D:\Projekt2027\Basismodule\Posteingang\lib\posteingang\interface.ts
//
// Festes Daten-Interface für das Posteingang-Basismodul (Interface+Adapter-
// Pattern, siehe Basismodul-Konzept Abschnitt 4a). Die UI und die API-Routen
// kennen nur dieses Interface, nie eine konkrete Datenquelle.
//
// Für jedes Zielsystem wird ein eigener Adapter geschrieben, der dieses
// Interface erfüllt:
// - Q7 (direkt Prisma):        adapters/prisma-adapter.ts
// - Q7-ERP (NestJS-Backend):   künftiger Adapter, MUSS durch die bestehende
//                              Service-Schicht mit RLS/lizenznehmerId-Filterung
//                              gehen (Master-Dokument 3.1, 3.6) — niemals
//                              direkt auf die Datenbank zugreifen.

import type {
  AkteurInfo,
  Bereich,
  Mitarbeiter,
  PosteingangChatEintrag,
  PosteingangEintrag,
  PosteingangFilter,
  PosteingangUpdateDaten,
  PosteingangVerlaufEintrag,
} from "./types";

export interface PosteingangDatenQuelle {
  // --- Lesen ---
  getEintraege(filter?: PosteingangFilter): Promise<PosteingangEintrag[]>;
  getEintrag(id: string): Promise<PosteingangEintrag | null>;
  getChatVerlauf(posteingangId: string): Promise<PosteingangChatEintrag[]>;
  getVerlauf(posteingangId: string): Promise<PosteingangVerlaufEintrag[]>;
  getBereiche(): Promise<Bereich[]>;
  getMitarbeiter(bereichId?: string): Promise<Mitarbeiter[]>;
  getAktuellenMitarbeiter(): Promise<Mitarbeiter | null>;

  // --- Schreiben ---
  updateEintrag(
    id: string,
    daten: PosteingangUpdateDaten,
    akteurInfo: AkteurInfo
  ): Promise<PosteingangEintrag>;

  antwortSpeichern(
    posteingangId: string,
    nachricht: string,
    absender: string
  ): Promise<PosteingangChatEintrag>;

  verlegeZuMeineAufgabe(
    posteingangId: string,
    zugewiesenAn?: string
  ): Promise<{ id: string }>;

  kiVorschlagUebernehmen(
    posteingangId: string,
    kommentar?: string
  ): Promise<PosteingangEintrag>;

  kiVorschlagAblehnen(
    posteingangId: string,
    kommentar?: string
  ): Promise<PosteingangEintrag>;
}
