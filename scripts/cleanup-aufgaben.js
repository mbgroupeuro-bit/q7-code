// Q7 -- Bereinigung: loescht ALLE Eintraege in Aufgabe + AufgabeChat
// Speicherort: a_Q7-code/scripts/cleanup-aufgaben.js
// Aufruf: node scripts/cleanup-aufgaben.js
//
// ACHTUNG: Loescht wirklich ALLE Datensaetze -- nur fuer Testphase gedacht,
// nicht mehr verwenden, sobald echte Kundendaten in der Tabelle stehen.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const chatsGeloescht = await prisma.aufgabeChat.deleteMany({});
  const aufgabenGeloescht = await prisma.aufgabe.deleteMany({});

  console.log(`Geloescht: ${aufgabenGeloescht.count} Aufgabe(n), ${chatsGeloescht.count} Chat-Eintrag/-einträge.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Fehler:", err);
  await prisma.$disconnect();
  process.exit(1);
});
