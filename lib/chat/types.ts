// Festes Daten-Interface für das Chat-Basismodul.
// UI-Komponenten und API-Routen rufen NUR diese Funktionen auf, nie direkt Prisma.
// Für jedes Zielsystem (Q7 = Prisma, Q7-ERP = NestJS-API) wird ein eigener Adapter erstellt,
// der dieses Interface erfüllt.

export interface ChatKanalDto {
  id: string;
  name: string;
  bereichId: string;
}

export interface MitarbeiterDto {
  id: string;
  name: string;
}

export interface ChatAnhangDto {
  id: string;
  dateiname: string;
  dateityp: string;
  groesseBytes: number;
}

export interface ChatNachrichtDto {
  id: string;
  absenderId: string;
  absenderName: string;
  kanalId: string | null;
  empfaengerId: string | null;
  text: string;
  erstelltAm: string;
  anhaenge: ChatAnhangDto[];
}

export interface NeueNachrichtInput {
  absenderId: string;
  text: string;
  kanalId?: string;
  empfaengerId?: string;
  anhaenge?: {
    dateiname: string;
    pfad: string;
    dateityp: string;
    groesseBytes: number;
  }[];
}

export interface ChatAdapter {
  // Liefert alle Kanäle, die der Mitarbeiter sehen darf
  // (eigener Bereich, oder alle, falls sieht_alle_bereiche = true).
  getSichtbareKanaele(mitarbeiterId: string): Promise<ChatKanalDto[]>;

  // Liefert alle Mitarbeiter (für Direktnachrichten-Auswahl), ohne den übergebenen Mitarbeiter selbst.
  getMitarbeiterListe(ohneMitarbeiterId: string): Promise<MitarbeiterDto[]>;

  // Liefert Nachrichten eines Kanals, neueste zuletzt.
  getNachrichtenKanal(kanalId: string, seitId?: string): Promise<ChatNachrichtDto[]>;

  // Liefert Direktnachrichten zwischen zwei Mitarbeitern, neueste zuletzt.
  getNachrichtenDirekt(mitarbeiterIdA: string, mitarbeiterIdB: string, seitId?: string): Promise<ChatNachrichtDto[]>;

  // Legt eine neue Nachricht an (Kanal- oder Direktnachricht, siehe kanalId/empfaengerId).
  createNachricht(input: NeueNachrichtInput): Promise<ChatNachrichtDto>;

  // Prüft, ob ein Mitarbeiter Zugriff auf einen Anhang hat (für geschützte Datei-Auslieferung).
  hatZugriffAufAnhang(mitarbeiterId: string, anhangId: string): Promise<boolean>;

  // Liefert Pfad + Dateiname eines Anhangs (nur nach erfolgreicher Zugriffsprüfung aufrufen).
  getAnhangDatei(anhangId: string): Promise<{ pfad: string; dateiname: string; dateityp: string } | null>;
}
