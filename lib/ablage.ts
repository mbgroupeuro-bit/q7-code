import fs from "fs/promises";
import path from "path";

/**
 * lib/ablage.ts
 *
 * Verwaltung der Ablage (08_ABLAGE) — freier Dokumenten-/Datei-Upload-Bereich,
 * getrennt von 06_WISSEN (globales Fachwissen, siehe lib/wissen.ts).
 *
 * Bewusste Trennung (Checkpoint-Entscheidung): Ablage ist für beliebige
 * Nutzer-/Kundendateien gedacht (Verträge, Bilder, Brand-Books etc.),
 * NICHT für system-/agentenweites Fachwissen. Beide Bereiche haben eigene
 * Backends, eigene Indizes, eigene physische Verzeichnisse — keine
 * Vermischung, um genau den Fehler zu vermeiden, der zur ursprünglichen
 * Q7-UI-010-Meldung geführt hat.
 *
 * Space-Feld ist optional vorbereitet, aber NICHT aktiv genutzt — die
 * volle Space-Tag-Architektur wurde besprochen, dann pausiert. Hier nur
 * als Platzhalter im Schema, ohne Funktionslogik.
 */

const DATA_ROOT = process.env.Q7_ROOT_PATH || "";
const ABLAGE_DIR = "08_ABLAGE";
const INDEX_DATEI = "_index.json";

// SEC-GATE: breitere Whitelist als bei Wissen, da Ablage auch Bilder/Office-
// Dokumente aufnehmen muss (siehe Checkpoint-Freigabe).
const ERLAUBTE_TYPEN = [".md", ".txt", ".pdf", ".docx", ".xlsx", ".csv", ".png", ".jpg", ".jpeg"];
const MAX_GROESSE_BYTES = 20 * 1024 * 1024; // 20 MB (höher als Wissen, wegen Bildern/PDFs)

export interface AblageEintrag {
  id: string;
  dateiname: string;
  kategorie: string;
  space?: string; // vorbereitet, aktuell ungenutzt (Space-Architektur pausiert)
  mimeType: string;
  hochgeladenAm: string;
  groesse: number;
}

export interface SecGateErgebnis {
  erlaubt: boolean;
  grund?: string;
}

function ablagePfad(): string {
  if (!DATA_ROOT) {
    throw new Error(
      "Q7_ROOT_PATH ist nicht gesetzt. Bitte in .env.local aktivieren (Basispfad zur ROOT-Struktur)."
    );
  }
  return path.join(DATA_ROOT, ABLAGE_DIR);
}

function indexPfad(): string {
  return path.join(ablagePfad(), INDEX_DATEI);
}

export function pruefeDateiMitSecGate(dateiname: string, groesseBytes: number): SecGateErgebnis {
  const ext = path.extname(dateiname).toLowerCase();

  if (!ERLAUBTE_TYPEN.includes(ext)) {
    return {
      erlaubt: false,
      grund: `Dateityp '${ext}' nicht erlaubt. Erlaubt: ${ERLAUBTE_TYPEN.join(", ")}`,
    };
  }

  if (groesseBytes > MAX_GROESSE_BYTES) {
    return {
      erlaubt: false,
      grund: `Datei zu groß (${Math.round(groesseBytes / 1024 / 1024)} MB). Limit: ${
        MAX_GROESSE_BYTES / 1024 / 1024
      } MB.`,
    };
  }

  if (dateiname.includes("..") || dateiname.includes("/") || dateiname.includes("\\")) {
    return { erlaubt: false, grund: "Ungültiger Dateiname." };
  }

  return { erlaubt: true };
}

async function stelleAblageVerzeichnisSicher(): Promise<void> {
  await fs.mkdir(ablagePfad(), { recursive: true });
}

export async function ladeIndex(): Promise<AblageEintrag[]> {
  await stelleAblageVerzeichnisSicher();
  try {
    const inhalt = await fs.readFile(indexPfad(), "utf-8");
    return JSON.parse(inhalt) as AblageEintrag[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

async function schreibeIndex(eintraege: AblageEintrag[]): Promise<void> {
  await fs.writeFile(indexPfad(), JSON.stringify(eintraege, null, 2), "utf-8");
}

/**
 * Erzeugt bei Namenskollision einen eindeutigen Dateinamen
 * (z.B. "Foto.png" -> "Foto_2.png"), statt stillschweigend zu überschreiben.
 * Anders als bei Wissen (wo Re-Upload = bewusstes Update ist), sind Ablage-
 * Dateien i.d.R. unabhängige Uploads verschiedener Nutzer/Anlässe.
 */
async function eindeutigerDateiname(dateiname: string): Promise<string> {
  const ext = path.extname(dateiname);
  const basis = path.basename(dateiname, ext);
  let kandidat = dateiname;
  let zaehler = 2;

  while (true) {
    try {
      await fs.access(path.join(ablagePfad(), kandidat));
      kandidat = `${basis}_${zaehler}${ext}`;
      zaehler++;
    } catch {
      return kandidat; // Datei existiert nicht -> Name frei
    }
  }
}

/**
 * Speichert eine neue Ablage-Datei. Inhalt kommt als Base64-String
 * (Frontend liest Datei via FileReader.readAsDataURL / btoa).
 */
export async function speichereAblageDatei(
  dateiname: string,
  inhaltBase64: string,
  mimeType: string,
  kategorie: string,
  space?: string
): Promise<AblageEintrag> {
  const buffer = Buffer.from(inhaltBase64, "base64");

  const gate = pruefeDateiMitSecGate(dateiname, buffer.byteLength);
  if (!gate.erlaubt) {
    throw new Error(`SEC-GATE: ${gate.grund}`);
  }

  await stelleAblageVerzeichnisSicher();

  const finalerName = await eindeutigerDateiname(dateiname);
  const zielPfad = path.join(ablagePfad(), finalerName);
  await fs.writeFile(zielPfad, buffer);

  const eintrag: AblageEintrag = {
    id: `ablage_${Date.now()}`,
    dateiname: finalerName,
    kategorie: kategorie || "Sonstiges",
    space,
    mimeType,
    hochgeladenAm: new Date().toISOString().slice(0, 10),
    groesse: buffer.byteLength,
  };

  const index = await ladeIndex();
  index.push(eintrag);
  await schreibeIndex(index);

  return eintrag;
}

export async function loescheAblageDatei(id: string): Promise<void> {
  const index = await ladeIndex();
  const eintrag = index.find((e) => e.id === id);
  if (!eintrag) return;

  await fs.unlink(path.join(ablagePfad(), eintrag.dateiname)).catch(() => {
    /* Datei evtl. schon weg -> Index trotzdem bereinigen */
  });

  const bereinigt = index.filter((e) => e.id !== id);
  await schreibeIndex(bereinigt);
}

// Dateitypen, deren Inhalt als Klartext in den Chat-Prompt eingebettet werden
// kann. Alles außerhalb dieser Liste (Bilder, PDF, Office-Dokumente) wird
// bewusst NUR als Referenz (Dateiname + Typ) übergeben — echtes Bild-
// Verstehen (multimodale Anfrage) ist ein separater, größerer Ausbauschritt
// und bewusst nicht Teil dieses Scopes (Checkpoint-Entscheidung).
const TEXT_TYPEN = [".md", ".txt", ".csv"];

export interface AblageInhaltErgebnis {
  dateiname: string;
  art: "text" | "referenz";
  inhalt?: string; // nur bei art === "text"
  typ: string; // Dateiendung, für Referenz-Anzeige
}

/**
 * Lädt Inhalte für die Chat-Injection (siehe FileUpload-Integration in
 * ChatWindow.tsx). Für Textdateien: echter Volltext. Für alles andere:
 * nur eine Referenz, damit der Agent zumindest weiß, dass eine Datei
 * angehängt wurde, auch wenn er sie (noch) nicht "sehen" kann.
 */
export async function ladeAblageInhalt(ids: string[]): Promise<AblageInhaltErgebnis[]> {
  const index = await ladeIndex();
  const treffer = index.filter((e) => ids.includes(e.id));

  const ergebnisse = await Promise.all(
    treffer.map(async (e) => {
      const ext = path.extname(e.dateiname).toLowerCase();

      if (TEXT_TYPEN.includes(ext)) {
        try {
          const inhalt = await fs.readFile(path.join(ablagePfad(), e.dateiname), "utf-8");
          return { dateiname: e.dateiname, art: "text" as const, inhalt, typ: ext };
        } catch {
          // Datei nicht lesbar (z.B. gelöscht) -> Fail-Open auf Referenz
          return { dateiname: e.dateiname, art: "referenz" as const, typ: ext };
        }
      }

      return { dateiname: e.dateiname, art: "referenz" as const, typ: ext };
    })
  );

  return ergebnisse;
}
