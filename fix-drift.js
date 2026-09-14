// fix-drift.js
// Einmal-Skript: entfernt die verwaiste Tabelle "new_termine", die durch
// die fehlgeschlagene Migration liegen geblieben ist. Rührt die
// eigentliche Tabelle "termine" NICHT an.
//
// Ausführen im Ordner a_Q7-code:
//   node fix-drift.js
//
// Danach kann diese Datei wieder gelöscht werden — sie wird nur einmalig
// zur Reparatur gebraucht.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const vorhanden = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='new_termine'"
  );

  if (Array.isArray(vorhanden) && vorhanden.length > 0) {
    await prisma.$executeRawUnsafe("DROP TABLE new_termine;");
    console.log("Tabelle 'new_termine' wurde entfernt.");
  } else {
    console.log("Keine Tabelle 'new_termine' gefunden — nichts zu tun.");
  }
}

main()
  .catch((e) => {
    console.error("Fehler:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
