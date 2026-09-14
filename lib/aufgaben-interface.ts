// Basismodul "Meine Aufgaben" — Daten-Interface
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\aufgaben-interface.ts
//
// Einbau in Q7 (03.09.2026): "aufgabe_id" -> "posteingang_id" umbenannt,
// da Q7 hierfür bereits eine echte Relation zu PosteingangEintrag besitzt
// (statt eines losen Felds ohne Relation wie ursprünglich im Basismodul).
//
// Änderung (04.09.2026, 1): Dritter Status "in_bearbeitung" ergänzt (neuer
// Typ "AufgabenStatus", "Status" bleibt für Teilaufgaben unverändert bei 2
// Werten). Keine Migration nötig, da status ein String-Feld ist.
//
// Änderung (04.09.2026, 2): nummer, tags, deleteAufgabe(), Anhänge-Methoden
// ergänzt (Erweiterung "Meine Aufgaben" — Migration meine_aufgaben_erweiterung).
// Anhänge nutzen lib/ablage.ts als physische Speicherung — dieses Interface
// kennt nur die Verknüpfung (AnhangEintrag), nicht die Datei-Details selbst.

export type Prioritaet = "niedrig" | "normal" | "hoch";
export type Status = "offen" | "erledigt";
export type AufgabenStatus = "offen" | "in_bearbeitung" | "erledigt";
export type VerlaufTyp = "kommentar" | "weiterleitung" | "status_geaendert";

export type MeineAufgabe = {
  id: string;
  nummer: number | null;
  titel: string;
  beschreibung: string | null;
  zugewiesen_an: string;
  quelle: string;
  status: AufgabenStatus;
  erstellt_am: string; // ISO-String
  erledigt_am: string | null;
  faelligkeit: string | null;
  prioritaet: Prioritaet | null;
  farbe: string | null;
  tags: string[]; // im Adapter aus dem komma-getrennten DB-Feld geparst
  absender: string | null;
  kontakt: string | null;
  original_nachricht: string | null;
  posteingang_id: string | null;
  projekt_id: string | null;
};

export type MeineAufgabeVerlaufEintrag = {
  id: number;
  meineAufgabe_id: string;
  typ: VerlaufTyp;
  text: string;
  erstellt_von: string;
  erstellt_am: string; // ISO-String
};

export type Teilaufgabe = {
  id: string;
  meineAufgabe_id: string;
  titel: string;
  status: Status;
  erstellt_am: string; // ISO-String
  erledigt_am: string | null;
};

// Verknüpfung zu einem Ablage-Eintrag (lib/ablage.ts). dateiname/mimeType/
// groesse werden zur Anzeige aus dem Ablage-Index mitgegeben, damit die UI
// nicht selbst nachschlagen muss — die eigentliche Datei bleibt in der Ablage.
export type AnhangEintrag = {
  id: string;
  ablage_id: string;
  dateiname: string;
  mimeType: string;
  groesse: number;
  hinzugefuegt_am: string; // ISO-String
};

export type MeineAufgabeMitVerlauf = MeineAufgabe & {
  verlauf: MeineAufgabeVerlaufEintrag[];
  teilaufgaben: Teilaufgabe[];
  anhaenge: AnhangEintrag[];
};

export type AufgabenFilter = {
  prioritaet?: Prioritaet;
  zugewiesen_an?: string;
  status?: AufgabenStatus;
  faelligVon?: string; // ISO-String
  faelligBis?: string; // ISO-String
  suchtext?: string;
  tag?: string;
};

export type NeueAufgabeInput = {
  titel: string;
  beschreibung?: string;
  zugewiesen_an?: string;
  prioritaet?: Prioritaet;
  farbe?: string;
  faelligkeit?: string;
  projekt_id?: string;
  tags?: string[];
};

export type AufgabeAktualisierenInput = {
  status?: AufgabenStatus;
  zugewiesen_an?: string;
  prioritaet?: Prioritaet;
  farbe?: string;
  faelligkeit?: string | null;
  projekt_id?: string | null;
  tags?: string[];
};

export interface AufgabenDatenZugriff {
  /** Liste aller Aufgaben, optional gefiltert. */
  getAufgaben(filter?: AufgabenFilter): Promise<MeineAufgabe[]>;

  /** Eine einzelne Aufgabe inkl. ihres Verlaufs. Gibt null zurück, wenn nicht gefunden. */
  getAufgabeMitVerlauf(id: string): Promise<MeineAufgabeMitVerlauf | null>;

  /** Legt eine neue Aufgabe manuell an. */
  createAufgabe(input: NeueAufgabeInput): Promise<MeineAufgabe>;

  /**
   * Aktualisiert Felder einer bestehenden Aufgabe (Status, Zuweisung, Priorität, ...).
   * ausgefuehrtVon: wer die Änderung vornimmt (z.B. Ergebnis von getAktuelleRolle()) —
   * wird bei einer Statusänderung automatisch als erstellt_von im Verlauf gespeichert.
   */
  updateAufgabe(
    id: string,
    input: AufgabeAktualisierenInput,
    ausgefuehrtVon: string
  ): Promise<MeineAufgabe>;

  /** Löscht eine Aufgabe unwiderruflich (inkl. Teilaufgaben/Verlauf/Anhänge-Verknüpfungen). */
  deleteAufgabe(id: string): Promise<void>;

  /** Fügt einen Verlaufseintrag hinzu (Kommentar, Weiterleitung, Statusänderung). */
  addVerlaufEintrag(
    meineAufgabeId: string,
    typ: VerlaufTyp,
    text: string,
    erstelltVon: string
  ): Promise<MeineAufgabeVerlaufEintrag>;

  /** Legt eine neue Teilaufgabe zu einer Aufgabe an. */
  createTeilaufgabe(meineAufgabeId: string, titel: string): Promise<Teilaufgabe>;

  /** Ändert den Status einer Teilaufgabe (offen/erledigt). */
  updateTeilaufgabeStatus(teilaufgabeId: string, status: Status): Promise<Teilaufgabe>;

  /**
   * Liefert eine Liste möglicher Zuständiger für das Weiterleiten-Dropdown.
   * PLATZHALTER: Im Basismodul werden hier nur bereits vorkommende
   * zugewiesen_an-Werte aus der DB zurückgegeben. Sobald das zentrale
   * Mitarbeiter-/Bereich-Modell (aus dem Posteingang-Basismodul, bereits
   * in Q7 vorhanden) genutzt werden soll, wird diese Methode im
   * Projekt-Adapter durch eine echte Anbindung an "Mitarbeiter" ersetzt.
   */
  getMitarbeiterListe(): Promise<string[]>;

  /**
   * Leitet eine Aufgabe an einen anderen Mitarbeiter weiter: ändert
   * zugewiesen_an und schreibt automatisch einen Verlaufseintrag
   * (typ = "weiterleitung"). kommentar ist optional.
   */
  weiterleiten(
    id: string,
    an: string,
    ausgefuehrtVon: string,
    kommentar?: string
  ): Promise<MeineAufgabe>;

  /**
   * Hängt eine Datei an eine Aufgabe an. inhaltBase64/mimeType kommen 1:1 aus
   * dem Upload; die eigentliche Speicherung läuft über lib/ablage.ts
   * (speichereAblageDatei), hier wird nur die Verknüpfung angelegt.
   */
  addAnhang(
    meineAufgabeId: string,
    dateiname: string,
    inhaltBase64: string,
    mimeType: string
  ): Promise<AnhangEintrag>;

  /** Entfernt eine Anhang-Verknüpfung UND die physische Datei aus der Ablage. */
  removeAnhang(meineAufgabeId: string, anhangId: string): Promise<void>;
}
