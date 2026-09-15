"use client";

import { Plus } from "lucide-react";
import { SPACES } from "@/lib/types";
import { useAppState } from "@/lib/store";

export default function SpacesPage() {
  const { logAktion } = useAppState();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold">Spaces</h2>
        <button
          onClick={() => {
            logAktion("GF", "Space erstellt (Platzhalter)");
            alert("Neuer Space (folgt später) — wurde ins Protokoll eingetragen.");
          }}
          className="flex items-center gap-1.5 rounded-[8px] bg-[#2563eb] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        >
          <Plus size={15} />
          Neuer Space
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPACES.map((s) => (
          <div
            key={s.id}
            onClick={() => alert(`Space-Detail: ${s.name} (folgt später)`)}
            className="cursor-pointer rounded-[12px] border border-[#e2e8f0] bg-white p-4 hover:border-[#cbd5e1]"
          >
            <div className="flex items-start justify-between">
              <div className="text-[15px] font-semibold">{s.name}</div>
              <span
                className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                  s.aktiv ? "bg-green-500" : "bg-slate-300"
                }`}
              />
            </div>
            <div className="mt-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600">
                {s.typ}
              </span>
            </div>
            <div className="mt-3 text-[12.5px] text-[#64748b]">
              {s.aktiv ? "Aktiv" : "Archiviert"} · zuletzt {s.letzteAktivitaet}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
