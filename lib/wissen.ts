import fs from "fs/promises";
import path from "path";

/**
 * lib/wissen.ts
 *
 * Zentrale Verwaltung des globalen Fachwissens (06_WISSEN, L7 Wissensmodell).
 * Struktur bleibt FLACH (kein Ordnerbaum) — Kategorie ist reines Metadatum,
 * kein physischer Unterordner. Siehe L7-Prinzip.
 *
 * Nutzt die BESTEHENDE Variable Q7_ROOT_PATH aus .env.local (bisher von keiner
 * Route gelesen, laut Kommentar dort explizit für künftiges Wissensbasis-
 * Retrieval vorgesehen — genau dieser Anwendungsfall). Zeigt auf das
 * Verzeichnis, das direkt 06_WISSEN, 05_UNTERNEHMEN etc. als Unterordner
 * enthält. Kein Pfad im Code hartkodiert.
 */

const DATA_ROOT = process.env.Q7_ROOT_PATH || "";
const WISSEN_DIR = "06_WISSEN";
const INDEX_DATEI = "_index.json";

// SEC-GATE Minimalscope: Whitelist + Größenlimit (siehe Checkpoint-Freigabe)
const ERLAUBTE_TYPEN = [".md", ".txt", ".pdf"];
const MAX_GROESSE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface WissenEintrag {
  id: string;
  dateiname: string;
  kategorie: string;
  hochgeladenAm: string;
  groesse: number;
  typ: string;
}

export interface SecGateErgebnis {
  erlaubt: boolean;
  grund?: string;
}

function wissenPfad(): string {
  if (!DATA_ROOT) {
    throw new Error(
      "Q7_ROOT_PATH ist nicht gesetzt. Bitte in .env.local aktivieren (Basispfad zur ROOT-Struktur)."
    );
  }
  return path.join(DATA_ROOT, WISSEN_DIR);
}

function indexPfad(): string {
  return path.join(wissenPfad(), INDEX_DATEI);
}

/**
 * SEC-GATE-Minimalprüfung für eingehende Dateien.
 * Bewusst schlank gehalten (Whitelist + Größe) — Ausbau (Malware-Scan,
 * Content-Prüfung via A14) ist ein späterer Schritt, kein Teil dieses Scopes.
 */
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

  // Einfache Pfad-Traversal-Absicherung (kein "../" im Dateinamen)
  if (dateiname.includes("..") || dateiname.includes("/") || dateiname.includes("\\")) {
    return { erlaubt: false, grund: "Ungültiger Dateiname." };
  }

  return { erlaubt: true };
}

async function stelleWissenVerzeichnisSicher(): Promise<void> {
  await fs.mkdir(wissenPfad(), { recursive: true });
}

export async function ladeIndex(): Promise<WissenEintrag[]> {
  await stelleWissenVerzeichnisSicher();
  try {
    const inhalt = await fs.readFile(indexPfad(), "utf-8");
    return JSON.parse(inhalt) as WissenEintrag[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return []; // Index existiert noch nicht -> leere Liste
    }
    throw err;
  }
}

async function schreibeIndex(eintraege: WissenEintrag[]): Promise<void> {
  await fs.writeFile(indexPfad(), JSON.stringify(eintraege, null, 2), "utf-8");
}

/**
 * Speichert eine neue Wissensdatei: Inhalt physisch flach unter 06_WISSEN,
 * Metadaten (inkl. Kategorie) im Index.
 */
export async function speichereWissenDatei(
  dateiname: string,
  inhalt: string,
  kategorie: string
): Promise<WissenEintrag> {
  const gate = pruefeDateiMitSecGate(dateiname, Buffer.byteLength(inhalt, "utf-8"));
  if (!gate.erlaubt) {
    throw new Error(`SEC-GATE: ${gate.grund}`);
  }

  await stelleWissenVerzeichnisSicher();

  const zielPfad = path.join(wissenPfad(), dateiname);
  await fs.writeFile(zielPfad, inhalt, "utf-8");

  const eintrag: WissenEintrag = {
    id: `wissen_${Date.now()}`,
    dateiname,
    kategorie: kategorie || "Allgemein",
    hochgeladenAm: new Date().toISOString().slice(0, 10),
    groesse: Buffer.byteLength(inhalt, "utf-8"),
    typ: path.extname(dateiname).toLowerCase(),
  };

  const index = await ladeIndex();
  // Bestehenden Eintrag mit gleichem Dateinamen ersetzen (Re-Upload = Update)
  const bereinigt = index.filter((e) => e.dateiname !== dateiname);
  bereinigt.push(eintrag);
  await schreibeIndex(bereinigt);

  return eintrag;
}

/**
 * Lädt den Volltextinhalt einer oder mehrerer Wissensdateien anhand ihrer IDs.
 * Wird vom Chat-Agenten-Endpoint genutzt, um Wissen in den Prompt zu injizieren
 * (Ansatz A: Volltext-Injection, siehe Checkpoint-Freigabe).
 */
export async function ladeWissenInhalt(ids: string[]): Promise<{ dateiname: string; inhalt: string }[]> {
  const index = await ladeIndex();
  const treffer = index.filter((e) => ids.includes(e.id));

  const ergebnisse = await Promise.all(
    treffer.map(async (e) => {
      const inhalt = await fs.readFile(path.join(wissenPfad(), e.dateiname), "utf-8");
      return { dateiname: e.dateiname, inhalt };
    })
  );

  return ergebnisse;
}

export async function loescheWissenDatei(id: string): Promise<void> {
  const index = await ladeIndex();
  const eintrag = index.find((e) => e.id === id);
  if (!eintrag) return;

  await fs.unlink(path.join(wissenPfad(), eintrag.dateiname)).catch(() => {
    /* Datei evtl. schon weg -> Index trotzdem bereinigen */
  });

  const bereinigt = index.filter((e) => e.id !== id);
  await schreibeIndex(bereinigt);
}
