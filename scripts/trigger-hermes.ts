// Q7 -- Hermes-Trigger (Schritt 4 + 5 aus dem Kanal-Intake-Prozess)
// Speicherort: a_Q7-code/scripts/trigger-hermes.ts
//
// Aufruf: npx tsx scripts/trigger-hermes.ts
//
// Was dieses Skript macht:
// 1. Liest alle Tasks mit status=OFFEN aus der Datenbank
// 2. Ruft fuer jeden Task rufeKIAn() auf (Hermes-Klassifikationslogik)
// 3. Schreibt Anliegen-Typ, Ziel-Agent, Dringlichkeit, Konfidenz zurueck
// 4. Setzt status je nach Konfidenz: gruen -> IN_BEARBEITUNG, gelb/rot -> RUECKFRAGE_ADMIN

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { rufeKIAn, modellFuerAgent } from "../lib/rufeKIAn";

const prisma = new PrismaClient();

// Start-Liste der Anliegen-Typen (aus Anliegen_Prozess_Matrix.md)
const ANLIEGEN_TYPEN = [
  "Reklamation",
  "Vertriebsanfrage",
  "Support-Anfrage",
  "Interne Aufgabe",
  "Terminanfrage",
  "Beschwerde (allgemein)",
  "Sonstiges",
];

// Zuordnung Anliegen-Typ -> Standard-Ziel-Agent (aus Anliegen_Prozess_Matrix.md)
const ZIEL_AGENT_MAP: Record<string, string> = {
  "Reklamation": "A05_QM",
  "Vertriebsanfrage": "A03_Vertrieb",
  "Support-Anfrage": "A04_PM",
  "Terminanfrage": "A03_Vertrieb",
  "Beschwerde (allgemein)": "A05_QM",
};

const HERMES_SYSTEM_PROMPT = `Du bist A01_Hermes, der zentrale Orchestrator im Q7-Betriebssystem.
Deine Aufgabe: klassifiziere eine eingehende Nachricht (Schritt 5.2.1 des Kanal-Intake-Prozesses).

Verfuegbare Anliegen-Typen: ${ANLIEGEN_TYPEN.join(", ")}

Antworte AUSSCHLIESSLICH im folgenden JSON-Format, ohne Erklaerung, ohne Markdown-Codeblock:
{
  "anliegen_typ": "einer der Anliegen-Typen aus der Liste",
  "dringlichkeit": "sofort" | "normal" | "niedrig",
  "konfidenz": "gruen" | "gelb" | "rot",
  "begruendung": "kurze Begruendung, max 1 Satz"
}

Konfidenz-Regeln:
- gruen: Anliegen-Typ ist eindeutig erkennbar
- gelb: wahrscheinlich richtig, aber nicht sicher
- rot: mehrdeutig, mehrere Interpretationen moeglich (z.B. koennte mehrere Abteilungen betreffen)`;

async function main() {
  const offeneTasks = await prisma.posteingangEintrag.findMany({
    where: { status: "OFFEN" },
  });

  if (offeneTasks.length === 0) {
    console.log("Keine offenen Tasks zur Klassifikation.");
    await prisma.$disconnect();
    return;
  }

  console.log(`${offeneTasks.length} offene(r) Task(s) gefunden. Starte Klassifikation...`);

  const model = modellFuerAgent("A01");

  for (const task of offeneTasks) {
    try {
      const userNachricht = `Kanal: ${task.kanal}\nAbsender: ${task.absender}\nInhalt: ${task.inhalt}`;

      const antwort = await rufeKIAn(model, HERMES_SYSTEM_PROMPT, userNachricht, 0.3);

      let ergebnis;
      try {
        ergebnis = JSON.parse(antwort.reply);
      } catch {
        console.error(`Task ${task.id}: Antwort konnte nicht als JSON gelesen werden:`, antwort.reply);
        continue;
      }

      const anliegenTyp = ergebnis.anliegen_typ || "Sonstiges";
      const konfidenz = ergebnis.konfidenz || "rot";
      const zielAgent = ZIEL_AGENT_MAP[anliegenTyp] || null;

      // Konfidenz-Logik (aus P_0XX_A01_Kanal-Intake-Klassifikation_v1.0.md, Schritt 5.3)
      const neuerStatus = konfidenz === "gruen" ? "IN_BEARBEITUNG" : "RUECKFRAGE_ADMIN";

      await prisma.posteingangEintrag.update({
        where: { id: task.id },
        data: {
          anliegen_typ: anliegenTyp,
          ziel_agent: zielAgent,
          dringlichkeit: ergebnis.dringlichkeit || "normal",
          konfidenz: konfidenz,
          status: neuerStatus,
        },
      });

      console.log(
        `Task ${task.id}: ${anliegenTyp} | Konfidenz: ${konfidenz} | Ziel: ${zielAgent || "Rückfrage nötig"} | Status: ${neuerStatus}`
      );
    } catch (fehler) {
      console.error(`Fehler bei Task ${task.id}:`, fehler);
    }
  }

  console.log("Klassifikation abgeschlossen.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Fehler:", err);
  await prisma.$disconnect();
  process.exit(1);
});
