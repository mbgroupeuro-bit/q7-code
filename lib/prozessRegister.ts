// lib/prozessRegister.ts
//
// Prozessregister-Modul: deterministische Prozess-ID-Vergabe + KI-gestützte
// Ähnlichkeitswarnung (Fail-Safe, keine Blockade).
//
// Architektur-Entscheidungen (Grill-Session 12.09.2026):
// - DB ist alleinige Primärquelle. .md-Frontmatter wird NICHT ausgewertet.
// - Kurzbeschreibung: LLM-Vorschlag via rufeKIAn(), Admin bestätigt vor Speicherung.
// - ID-Vergabe selbst ist rein deterministisch, kein Modell-Call nötig.
// - Embedding-Call soll über rufeKIAn() laufen (bindende Architekturregel) —
//   ⚠️ AKTUELL NICHT MÖGLICH: rufeKIAn() (Stand 11.09.2026, geprüft) hat
//   keinerlei Embedding-Fähigkeit. Siehe berechneEmbedding() weiter unten —
//   dort bewusst als throw Error stehengelassen, kein Fake-Rückgabewert.
//
// Offene Punkte (siehe P_001, Abschnitt 10 / Grill-Verdict):
// - ECHTER BLOCKER (nicht nur "offener Punkt"): Embedding-Fähigkeit fehlt in
//   rufeKIAn() komplett. Ähnlichkeitsprüfung (pruefeAehnlichkeit) und
//   Embedding-Speicherung (registriereProzess) sind bis zur Klärung
//   nicht nutzbar. Deterministische ID-Vergabe (ermittleNaechsteProzessId)
//   und Kurzbeschreibungs-Vorschlag (schlageKurzbeschreibungVor) sind
//   davon UNABHÄNGIG und bereits funktionsfähig.
// - embeddingJson für rückwirkend erfasste Prozesse (P_001-P_003) bleibt NULL,
//   bis obige Entscheidung getroffen UND nachtrageFehlendeEmbeddings() läuft.
// - Kollision mit altem Teil-C-Register (P_012/P_023) bleibt ungeklärter Merkposten,
//   dieses Modul verhindert nur KÜNFTIGE Kollisionen innerhalb seiner selbst.

import { PrismaClient } from '@prisma/client';
import { rufeKIAn, modellFuerAgent } from './rufeKIAn';

const prisma = new PrismaClient();

// Prozessregister ist keinem einzelnen Fachagenten zugeordnet — nutzt das
// Standardmodell (nicht A14-spezifisch), analog zu anderen Hilfsfunktionen.
const MODELL_PROZESSREGISTER = modellFuerAgent('prozessregister');

const AEHNLICHKEITS_SCHWELLE = 0.85; // Cosine-Similarity, Startwert — im Testlauf ggf. justieren

interface NeuerProzessInput {
  titel: string;
  volltext: string; // vollständiges Prozessdokument (Zweck + Ablauf), Basis für LLM-Vorschlag + Embedding
}

interface KurzbeschreibungsVorschlag {
  vorschlag: string;
  // Admin muss diesen Vorschlag bestätigen/korrigieren, bevor registriereProzess() aufgerufen wird
}

interface AehnlichkeitsTreffer {
  prozessId: string;
  titel: string;
  aehnlichkeit: number;
}

/**
 * Schritt 1: LLM schlägt Kurzbeschreibung vor (Grill-Entscheidung Punkt 2, Ansatz 3).
 * Admin muss das Ergebnis bestätigen, bevor registriereProzess() aufgerufen wird —
 * kein automatisches Durchschreiben ohne Freigabe.
 */
export async function schlageKurzbeschreibungVor(
  input: NeuerProzessInput
): Promise<KurzbeschreibungsVorschlag> {
  const systemPrompt =
    'Du fasst Q7-Prozessdokumente in 1-2 prägnanten Sätzen zusammen. ' +
    'Gib ausschließlich die Kurzbeschreibung aus, keine Einleitung, keine Anführungszeichen.';

  const antwort = await rufeKIAn(
    MODELL_PROZESSREGISTER,
    systemPrompt,
    input.volltext,
    0.3, // niedrige Temperature — Zusammenfassung soll konsistent, nicht kreativ sein
    300, // Kurzbeschreibung braucht wenig Tokens
    15_000
  );

  return { vorschlag: antwort.reply.trim() };
}

/**
 * Schritt 2: Nächste freie Prozess-ID ermitteln (rein deterministisch, kein Modell-Call).
 */
async function ermittleNaechsteProzessId(): Promise<string> {
  const eintraege = await prisma.prozessRegisterEintrag.findMany({
    select: { prozessId: true },
    orderBy: { prozessId: 'desc' },
  });

  const nummern = eintraege
    .map((e) => parseInt(e.prozessId.replace('P_', ''), 10))
    .filter((n) => !isNaN(n));

  const naechsteNummer = nummern.length > 0 ? Math.max(...nummern) + 1 : 1;
  return `P_${String(naechsteNummer).padStart(3, '0')}`;
}

/**
 * Vergleicht ein bereits berechnetes Embedding gegen bestehende Prozesse.
 * Reine DB-Vergleichslogik, KEIN eigener Embedding-Call — vermeidet den
 * redundanten Doppel-Call, der in der ursprünglichen pruefeAehnlichkeit()
 * bestand (Grill-Fix Punkt 1, 12.09.2026).
 */
async function vergleicheMitBestehenden(
  neuesEmbedding: number[]
): Promise<AehnlichkeitsTreffer[]> {
  const bestehende = await prisma.prozessRegisterEintrag.findMany({
    where: { embeddingJson: { not: null } },
    select: { prozessId: true, titel: true, embeddingJson: true },
  });

  const treffer: AehnlichkeitsTreffer[] = [];

  for (const eintrag of bestehende) {
    const bestehendesEmbedding: number[] = JSON.parse(eintrag.embeddingJson!);
    const aehnlichkeit = kosinusAehnlichkeit(neuesEmbedding, bestehendesEmbedding);

    if (aehnlichkeit >= AEHNLICHKEITS_SCHWELLE) {
      treffer.push({
        prozessId: eintrag.prozessId,
        titel: eintrag.titel,
        aehnlichkeit,
      });
    }
  }

  return treffer.sort((a, b) => b.aehnlichkeit - a.aehnlichkeit);
}

/**
 * Öffentlicher Wrapper: berechnet Embedding + vergleicht in einem Aufruf.
 * Für externe Aufrufer, die nur die Ähnlichkeitsprüfung brauchen (z.B.
 * Vorschau vor Registrierung), ohne selbst zu registrieren.
 */
export async function pruefeAehnlichkeit(
  volltext: string
): Promise<AehnlichkeitsTreffer[]> {
  const neuesEmbedding = await berechneEmbedding(volltext);
  return vergleicheMitBestehenden(neuesEmbedding);
}

/**
 * Schritt 4: Finale Registrierung — erst nach Admin-Bestätigung der Kurzbeschreibung
 * und nach Kenntnisnahme etwaiger Ähnlichkeitswarnungen (Fail-Safe: Admin kann trotzdem
 * fortfahren, wird nicht blockiert).
 *
 * embeddingStatus wird IMMER in die DB geschrieben (Grill-Fix Punkt 2, 12.09.2026) —
 * nicht nur als Rückgabewert an den Aufrufer gemeldet. Ein Aufrufer, der die
 * Rückgabe ignoriert, kann die Information trotzdem nicht verlieren: Admin
 * kann jederzeit per DB-Abfrage alle Einträge mit embeddingStatus =
 * "fehlgeschlagen" finden. Verhindert das Wiederauftreten des bereits einmal
 * gelösten Musters (stille Datenverschmutzung, siehe P_001 Grill-Revision 2).
 */
export async function registriereProzess(
  titel: string,
  bestaetigteKurzbeschreibung: string,
  volltext: string,
  dateipfad?: string
): Promise<{
  prozessId: string;
  aehnlichkeitsWarnungen: AehnlichkeitsTreffer[];
  embeddingStatus: 'berechnet' | 'fehlgeschlagen';
}> {
  const prozessId = await ermittleNaechsteProzessId();

  let aehnlichkeitsWarnungen: AehnlichkeitsTreffer[] = [];
  let embeddingJson: string | null = null;
  let embeddingStatus: 'berechnet' | 'fehlgeschlagen' = 'fehlgeschlagen';

  try {
    const embedding = await berechneEmbedding(volltext); // EIN Call (Grill-Fix Punkt 1)
    embeddingJson = JSON.stringify(embedding);
    aehnlichkeitsWarnungen = await vergleicheMitBestehenden(embedding);
    embeddingStatus = 'berechnet';
  } catch (err) {
    console.warn(`Embedding/Ähnlichkeitsprüfung übersprungen für ${prozessId}: ${err}`);
    embeddingStatus = 'fehlgeschlagen';
  }

  await prisma.prozessRegisterEintrag.create({
    data: {
      prozessId,
      titel,
      zweckKurzbeschreibung: bestaetigteKurzbeschreibung,
      embeddingJson,
      embeddingStatus, // persistiert, nicht nur zurückgegeben
      status: 'Entwurf',
      dateipfad: dateipfad ?? null,
    },
  });

  return { prozessId, aehnlichkeitsWarnungen, embeddingStatus };
}

/**
 * Admin-Abfrage: alle Prozesse, deren Ähnlichkeitsprüfung fehlgeschlagen ist.
 * Direkte Umsetzung von Grill-Fix Punkt 2 — macht die persistierte Warnung
 * aktiv abrufbar, statt nur passiv in der DB zu liegen.
 */
export async function findeProzesseOhneEmbedding(): Promise<
  { prozessId: string; titel: string }[]
> {
  return prisma.prozessRegisterEintrag.findMany({
    where: { embeddingStatus: 'fehlgeschlagen' },
    select: { prozessId: true, titel: true },
  });
}

/**
 * Nachtrag fehlender Embeddings für rückwirkend erfasste Prozesse (P_001-P_003).
 * Einmalig auszuführen, sobald rufeKIAn() im Embedding-Modus verfügbar ist.
 * Siehe P_001, Abschnitt 10 "Offene Punkte".
 */
export async function nachtrageFehlendeEmbeddings(
  volltexteProProzessId: Record<string, string>
): Promise<void> {
  const ohneEmbedding = await prisma.prozessRegisterEintrag.findMany({
    where: { embeddingStatus: 'fehlgeschlagen' },
  });

  for (const eintrag of ohneEmbedding) {
    const volltext = volltexteProProzessId[eintrag.prozessId];
    if (!volltext) {
      console.warn(`Kein Volltext für ${eintrag.prozessId} übergeben — übersprungen.`);
      continue;
    }

    try {
      const embedding = await berechneEmbedding(volltext);
      await prisma.prozessRegisterEintrag.update({
        where: { prozessId: eintrag.prozessId },
        data: { embeddingJson: JSON.stringify(embedding), embeddingStatus: 'berechnet' },
      });
      console.log(`Embedding nachgetragen: ${eintrag.prozessId}`);
    } catch (err) {
      console.warn(`Nachtrag weiterhin fehlgeschlagen für ${eintrag.prozessId}: ${err}`);
    }
  }
}

// --- Hilfsfunktionen ---

/**
 * ⚠️ NICHT FUNKTIONSFÄHIG — echter Blocker, kein bloßes TODO.
 *
 * Geprüft anhand der tatsächlichen lib/rufeKIAn.ts (Stand 11.09.2026, Fixrunde
 * Guardrail-Bug): rufeKIAn() ist ausschließlich ein Chat-Completion-Wrapper
 * um OpenRouter (Signatur: model, systemPrompt, userNachricht, temperature,
 * maxTokens, timeoutMs → { reply, usage }). Es gibt AKTUELL KEINERLEI
 * Embedding-Fähigkeit — auch nicht ansatzweise, kein Embedding-Modus,
 * kein Embedding-Endpoint.
 *
 * Diese Funktion ist bewusst als Platzhalter stehengelassen, NICHT
 * eigenmächtig gegen rufeKIAn.ts implementiert — das würde in eine gerade
 * frisch reparierte, sicherheitskritische Datei eingreifen (siehe
 * pruefeMitA14()-Fixhistorie in derselben Datei), ohne dass das hier
 * abgestimmt wurde.
 *
 * Bevor pruefeAehnlichkeit() / registriereProzess() produktiv nutzbar sind,
 * muss EXPLIZIT entschieden werden:
 * - Wird rufeKIAn() um einen Embedding-Modus erweitert (z.B. via
 *   OpenRouter-Embedding-Endpoint oder separatem Provider-Call)?
 * - Oder wird eine andere Embedding-Quelle genutzt (separate Funktion,
 *   nicht über rufeKIAn(), was aber der bindenden Architekturregel
 *   "jeder Modell-Call läuft über rufeKIAn()" widersprechen würde)?
 *
 * Bis diese Entscheidung getroffen ist, wirft diese Funktion bewusst einen
 * Fehler, statt stillschweigend falsche Daten zu erzeugen.
 */
async function berechneEmbedding(text: string): Promise<number[]> {
  throw new Error(
    'berechneEmbedding() ist nicht implementiert: rufeKIAn() hat aktuell keine ' +
    'Embedding-Fähigkeit. Siehe Kommentar in dieser Funktion für nötige ' +
    'Architektur-Entscheidung vor Weiterbau.'
  );
}

function kosinusAehnlichkeit(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embedding-Dimensionen stimmen nicht überein.');
  }

  let skalarprodukt = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    skalarprodukt += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return skalarprodukt / (Math.sqrt(normA) * Math.sqrt(normB));
}
