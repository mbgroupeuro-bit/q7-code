// Seed-Skript: rückwirkende Registrierung P_001–P_003
// Ausführen z.B. via: npx tsx prisma/seed_prozessregister.ts
// Status: embeddingJson bleibt hier bewusst NULL — Nachtrag erst beim ersten
// echten rufeKIAn()-Lauf im System (siehe Offene Punkte in P_001).
//
// WICHTIG: Next.js lädt .env.local automatisch, ein eigenständiges
// tsx/ts-node-Skript NICHT — deshalb hier explizit per dotenv nachladen,
// sonst ist process.env.DATABASE_URL leer und PrismaClient schlägt fehl.

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const eintraege = [
    {
      prozessId: 'P_001',
      titel: 'A01-Fallklassifizierung + Chronik-Auswertung',
      zweckKurzbeschreibung:
        'A01 unterscheidet bei Chat-Anfragen zwischen Allgemeinwissen (Pfad Allgemein) ' +
        'und Q7-internem Kontext (Pfad Intern), nutzt bei Pfad Intern die Chronik zur ' +
        'Wiedererkennung bewährter Workflows via Prozess-ID- und Embedding-Suche.',
      status: 'Final freigegeben',
      embeddingStatus: 'fehlgeschlagen',
      dateipfad: '02_Prozesse/P_001_A01-Fallklassifizierung-Chronik_v1.0.md',
    },
    {
      prozessId: 'P_002',
      titel: 'Kanal-Intake und Klassifikation',
      zweckKurzbeschreibung:
        'Nimmt eingehende Nachrichten aus externen Kanälen (E-Mail, WhatsApp) entgegen, ' +
        'normalisiert sie zu Tasks und klassifiziert Anliegen-Typ, Ziel-Agent und ' +
        'Dringlichkeit anhand von Konfidenzstufen (🟢🟡🔴).',
      status: 'Final freigegeben (produktiv im Code)',
      embeddingStatus: 'fehlgeschlagen',
      dateipfad: '02_Prozesse/P_002_A01-Kanal-Intake-Klassifikation_v1.1.md',
    },
    {
      prozessId: 'P_003',
      titel: 'Kunden-Feedback-Gate',
      zweckKurzbeschreibung:
        'Trennt Kunden-Rückmeldungen im Chat strukturiert in kostenlose Fehlerkorrektur ' +
        '(Pfad A) vs. kostenpflichtigen Zusatzwunsch (Pfad B), mit Kostenvoranschlag und ' +
        'Freigabe-Gate bei Pfad B.',
      status: 'Final freigegeben',
      embeddingStatus: 'fehlgeschlagen',
      dateipfad: '02_Prozesse/P_003_Kunden-Feedback-Gate_v1.1.md',
    },
  ];

  for (const eintrag of eintraege) {
    await prisma.prozessRegisterEintrag.upsert({
      where: { prozessId: eintrag.prozessId },
      update: eintrag,
      create: eintrag,
    });
    console.log(`Registriert: ${eintrag.prozessId} — ${eintrag.titel}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
