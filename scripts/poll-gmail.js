// Q7 — Kanal-Adapter: E-Mail (Gmail IMAP Polling)
// Speicherort im Projekt: a_Q7-code/scripts/poll-gmail.js
//
// Aufruf: node -r dotenv/config scripts/poll-gmail.js
//
// Was dieses Skript macht (Schritt 2 + 3 aus dem Prozess):
// 1. Verbindet sich per IMAP mit Gmail
// 2. Holt alle ungelesenen Nachrichten im Posteingang
// 3. Normalisiert jede Nachricht (Absender, Zeitstempel, Inhalt)
// 4. Schreibt einen neuen Eintrag in die "aufgaben"-Tabelle mit status=OFFEN
// 5. Markiert die Mail als gelesen, damit sie nicht doppelt verarbeitet wird

const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function neueTaskId() {
  const zeit = Date.now().toString(36);
  const zufall = Math.random().toString(36).slice(2, 6);
  return `T_${zeit}${zufall}`;
}

async function main() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error("Fehler: GMAIL_USER oder GMAIL_APP_PASSWORD fehlt in .env");
    process.exit(1);
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  await client.connect();
  console.log("Verbunden mit Gmail:", process.env.GMAIL_USER);

  let lock = await client.getMailboxLock("INBOX");
  let anzahlNeu = 0;

  try {
    // Nur ungelesene Nachrichten suchen
    const nachrichten = await client.search({ seen: false });

    if (!nachrichten || nachrichten.length === 0) {
      console.log("Keine neuen Nachrichten.");
    } else {
      for (const seq of nachrichten) {
        const nachricht = await client.fetchOne(seq, { source: true });
        const geparst = await simpleParser(nachricht.source);

        const task = {
          id: neueTaskId(),
          kanal: "email",
          absender: geparst.from?.text || "unbekannt",
          zeitstempel: geparst.date || new Date(),
          inhalt: geparst.text || geparst.subject || "(kein Inhalt)",
          anhaenge: geparst.attachments.length > 0
            ? JSON.stringify(geparst.attachments.map(a => a.filename))
            : null,
          status: "OFFEN",
        };

        await prisma.aufgabe.create({ data: task });
        anzahlNeu++;
        console.log("Neuer Task angelegt:", task.id, "von", task.absender);

        // Als gelesen markieren, damit nicht doppelt verarbeitet
        await client.messageFlagsAdd(seq, ["\\Seen"]);
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  console.log(`Fertig. ${anzahlNeu} neue(r) Task(s) angelegt.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Fehler beim Abrufen:", err);
  await prisma.$disconnect();
  process.exit(1);
});
