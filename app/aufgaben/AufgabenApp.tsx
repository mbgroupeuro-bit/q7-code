// Basismodul "Meine Aufgaben" — App-Shell mit Tabs (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\AufgabenApp.tsx
//
// Neu (04.09.2026, 1): Tabs Übersicht/Liste/Kalender/Kanban.
//
// Neu (04.09.2026, 2): 5. Tab "Notizen" ergänzt — lose, wichtige
// Informationen (z.B. Kundendetails), die bewusst keine Aufgabe sind.
// Bewusst im selben Modul statt eigenem Sidebar-Eintrag (Entscheidung
// 04.09.2026, um die Sidebar nicht unübersichtlich zu machen).
//
// Geändert 13.09.2026 (Kalender-Fixes-Session): mitarbeiter/bereiche-Props
// ergänzt, nur durchgereicht an AufgabenKalender (für den neuen
// Termin/Aufgabe-Dialog dort). Andere Tabs unverändert, ignorieren die
// neuen Props.

"use client";

import { useState } from "react";
import type { MeineAufgabe } from "@/lib/aufgaben-interface";
import type { Notiz } from "@/lib/notizen-interface";
import AufgabenListe from "./AufgabenListe";
import AufgabenUebersicht from "./AufgabenUebersicht";
import AufgabenKalender from "./AufgabenKalender";
import AufgabenKanban from "./AufgabenKanban";
import NotizenListe from "./NotizenListe";

export type Tab = "uebersicht" | "liste" | "kalender" | "kanban" | "notizen";

type Bereich = { id: string; name: string };
type MitarbeiterKontext = {
  id: string;
  bereich_id: string;
  bereich_name: string;
  sieht_alle_bereiche: boolean;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "uebersicht", label: "Übersicht" },
  { id: "liste", label: "Liste" },
  { id: "kalender", label: "Kalender" },
  { id: "kanban", label: "Kanban" },
  { id: "notizen", label: "Notizen" },
];

export default function AufgabenApp({
  initialAufgaben,
  initialNotizen,
  mitarbeiter,
  bereiche,
}: {
  initialAufgaben: MeineAufgabe[];
  initialNotizen: Notiz[];
  mitarbeiter: MitarbeiterKontext | null;
  bereiche: Bereich[];
}) {
  const [tab, setTab] = useState<Tab>("uebersicht");
  const offeneAnzahl = initialAufgaben.filter((a) => a.status !== "erledigt").length;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold">Meine Aufgaben</h2>
          <div className="mt-1">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700">
              {offeneAnzahl} offen
            </span>
          </div>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-1 rounded-[10px] bg-slate-100 p-1" style={{ width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              tab === t.id ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "uebersicht" && (
        <AufgabenUebersicht aufgaben={initialAufgaben} notizen={initialNotizen} onTabWechseln={setTab} />
      )}
      {tab === "liste" && <AufgabenListe initialAufgaben={initialAufgaben} />}
      {tab === "kalender" && (
        <AufgabenKalender aufgaben={initialAufgaben} mitarbeiter={mitarbeiter} bereiche={bereiche} />
      )}
      {tab === "kanban" && <AufgabenKanban aufgaben={initialAufgaben} />}
      {tab === "notizen" && <NotizenListe initialNotizen={initialNotizen} />}
    </div>
  );
}
