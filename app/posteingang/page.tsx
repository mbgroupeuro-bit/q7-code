// D:\Projekt2027\Basismodule\Posteingang\app\posteingang\page.tsx
//
// Standardseite Posteingang — Design unverändert übernommen (siehe
// Screenshot: Liste links mit Kanal-Tabs, Detail rechts mit Original-
// Nachricht + Antwortfeld). Datenzugriff läuft über den Posteingang-
// Adapter (Interface+Adapter-Pattern), nicht direkt über Prisma.

import PosteingangListe from "./PosteingangListe";
import { prismaPosteingangAdapter as datenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";

const KANAELE = ["team", "email", "whatsapp", "telegram", "facebook"] as const;

const KANAL_LABEL: Record<string, string> = {
  team: "Team",
  email: "Mail",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  facebook: "Facebook",
};

export default async function PosteingangPage() {
  const eintraege = await datenQuelle.getEintraege();

  const anzahlProKanal: Record<string, number> = { alle: eintraege.length };
  for (const kanal of KANAELE) {
    anzahlProKanal[kanal] = eintraege.filter((e) => e.kanal === kanal).length;
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-1">
        <h2 className="text-[20px] font-semibold">Posteingang</h2>
      </div>
      <div className="mb-4">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700">
          {eintraege.length} Eingänge
        </span>
      </div>

      <PosteingangListe
        initialEintraege={eintraege}
        kanaele={KANAELE}
        kanalLabel={KANAL_LABEL}
        anzahlProKanal={anzahlProKanal}
      />
    </div>
  );
}
