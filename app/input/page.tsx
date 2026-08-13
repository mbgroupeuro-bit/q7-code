// app/input/page.tsx — Posteingang (Server Component)
// Erweitert 05.08.2026: Kanal-Tabs + Antwort-Panel laut Q7_Dashboard_Posteingang_Konzept.docx Abschnitt 5
// Vorheriger Stand (Prisma-Anbindung, Status-Fix, VerlegenButton) bleibt erhalten.

import { PrismaClient } from "@prisma/client";
import PosteingangClient, { type AufgabeItem } from "./PosteingangClient";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    process.env.Q7_AGENTEN_DB_URL
      ? { datasources: { db: { url: process.env.Q7_AGENTEN_DB_URL } } }
      : undefined
  );
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default async function InputPage() {
  const aufgaben = await prisma.aufgabe.findMany({
    orderBy: { zeitstempel: "desc" },
    include: {
      chats: { orderBy: { zeitstempel: "asc" } },
    },
  });

  // Dates → ISO-Strings, da Date-Objekte nicht zuverlässig über die
  // Server/Client-Grenze serialisiert werden sollten.
  const aufgabenSerialisiert: AufgabeItem[] = aufgaben.map((a) => ({
    id: a.id,
    kanal: a.kanal,
    absender: a.absender,
    zeitstempel: a.zeitstempel.toISOString(),
    inhalt: a.inhalt,
    status: a.status,
    anliegen_typ: a.anliegen_typ,
    konfidenz: a.konfidenz,
    chats: a.chats.map((c) => ({
      id: c.id,
      absender: c.absender,
      nachricht: c.nachricht,
      zeitstempel: c.zeitstempel.toISOString(),
    })),
  }));

  return <PosteingangClient aufgaben={aufgabenSerialisiert} />;
}
