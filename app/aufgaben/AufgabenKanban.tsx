// Basismodul "Meine Aufgaben" — Kanban-Board (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\AufgabenKanban.tsx
//
// Neu (04.09.2026, 1): 3 Spalten passend zum Status-Feld. Drag&Drop zwischen
// Spalten ändert den Status.
//
// Änderung (04.09.2026, 2): Zusätzlich zum Drag&Drop jetzt auch ein
// Status-Dropdown direkt auf der Karte — für alle, die nicht per Drag&Drop
// arbeiten wollen (z.B. auf Touch-Geräten).

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MeineAufgabe, Prioritaet, AufgabenStatus } from "@/lib/aufgaben-interface";

const SPALTEN: { status: AufgabenStatus; label: string; kopfFarbe: string }[] = [
  { status: "offen", label: "Offen", kopfFarbe: "bg-amber-50 text-amber-700" },
  { status: "in_bearbeitung", label: "In Bearbeitung", kopfFarbe: "bg-blue-50 text-blue-700" },
  { status: "erledigt", label: "Erledigt", kopfFarbe: "bg-green-50 text-green-700" },
];

const STATUS_LABEL: Record<AufgabenStatus, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
};

const PRIORITAET_FARBE: Record<Prioritaet, string> = {
  hoch: "bg-red-100 text-red-700",
  normal: "bg-slate-100 text-slate-600",
  niedrig: "bg-blue-100 text-blue-600",
};

const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  hoch: "Hoch",
  normal: "Normal",
  niedrig: "Niedrig",
};

export default function AufgabenKanban({ aufgaben }: { aufgaben: MeineAufgabe[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [gezogeneId, setGezogeneId] = useState<string | null>(null);
  const [zielSpalte, setZielSpalte] = useState<AufgabenStatus | null>(null);

  const spaltenInhalt = useMemo(() => {
    const map: Record<AufgabenStatus, MeineAufgabe[]> = { offen: [], in_bearbeitung: [], erledigt: [] };
    for (const a of aufgaben) {
      map[a.status].push(a);
    }
    return map;
  }, [aufgaben]);

  async function statusAendern(id: string, neuerStatus: AufgabenStatus) {
    await fetch(`/api/meine-aufgaben/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: neuerStatus }),
    });
    startTransition(() => router.refresh());
  }

  function onDrop(status: AufgabenStatus) {
    if (gezogeneId) {
      const aktuelle = aufgaben.find((a) => a.id === gezogeneId);
      if (aktuelle && aktuelle.status !== status) {
        statusAendern(gezogeneId, status);
      }
    }
    setGezogeneId(null);
    setZielSpalte(null);
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {SPALTEN.map((spalte) => (
        <div
          key={spalte.status}
          onDragOver={(e) => {
            e.preventDefault();
            setZielSpalte(spalte.status);
          }}
          onDragLeave={() => setZielSpalte((z) => (z === spalte.status ? null : z))}
          onDrop={() => onDrop(spalte.status)}
          className={`rounded-[12px] border p-2.5 transition-colors ${
            zielSpalte === spalte.status ? "border-[#2563eb] bg-blue-50/40" : "border-[#e2e8f0]"
          }`}
        >
          <div className={`mb-2.5 flex items-center justify-between rounded-[8px] px-2.5 py-1.5 ${spalte.kopfFarbe}`}>
            <span className="text-[13px] font-semibold">{spalte.label}</span>
            <span className="text-[12px] font-medium">{spaltenInhalt[spalte.status].length}</span>
          </div>

          <div className="flex min-h-[80px] flex-col gap-2">
            {spaltenInhalt[spalte.status].length === 0 && (
              <div className="rounded-[8px] border border-dashed border-[#e2e8f0] py-4 text-center text-[12px] text-[#94a3b8]">
                Keine Aufgaben
              </div>
            )}
            {spaltenInhalt[spalte.status].map((a) => (
              <div
                key={a.id}
                draggable
                onDragStart={() => setGezogeneId(a.id)}
                onDragEnd={() => {
                  setGezogeneId(null);
                  setZielSpalte(null);
                }}
                className={`cursor-grab rounded-[8px] border border-[#e2e8f0] bg-white p-2.5 active:cursor-grabbing ${
                  gezogeneId === a.id ? "opacity-40" : ""
                }`}
              >
                <button
                  onClick={() => router.push(`/aufgaben/${a.id}`)}
                  className="mb-1 block w-full truncate text-left text-[13px] font-medium hover:underline"
                >
                  {a.nummer !== null && <span className="mr-1 text-[#94a3b8]">#{a.nummer}</span>}
                  {a.titel}
                </button>
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {a.prioritaet && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10.5px] ${PRIORITAET_FARBE[a.prioritaet]}`}>
                      {PRIORITAET_LABEL[a.prioritaet]}
                    </span>
                  )}
                  {a.faelligkeit && (
                    <span className="text-[10.5px] text-[#94a3b8]">
                      {new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(
                        new Date(a.faelligkeit)
                      )}
                    </span>
                  )}
                </div>
                <select
                  value={a.status}
                  onChange={(e) => statusAendern(a.id, e.target.value as AufgabenStatus)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded-[6px] border border-[#e2e8f0] px-1.5 py-1 text-[11px]"
                >
                  {(Object.keys(STATUS_LABEL) as AufgabenStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
