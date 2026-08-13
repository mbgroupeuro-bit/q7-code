"use client";

import { FileText, Check, Share2, ArrowRight } from "lucide-react";
import { OUTPUT_LIST } from "@/lib/types";
import { useAppState } from "@/lib/store";

const statusStyle: Record<string, string> = {
  Final: "bg-green-100 text-green-700",
  "In Bearbeitung": "bg-yellow-100 text-yellow-700",
  Zurückgewiesen: "bg-red-100 text-red-700",
};

export default function OutputPage() {
  const { logAktion } = useAppState();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-5 text-[20px] font-semibold">Output</h2>

      <div className="flex flex-col gap-3">
        {OUTPUT_LIST.map((o) => (
          <div
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#e2e8f0] bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-[#64748b] flex-shrink-0" />
              <div>
                <div className="text-[14px] font-semibold">{o.dateiname}</div>
                <div className="text-[12px] text-[#64748b]">
                  {o.space} · {o.erstellungsdatum}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${statusStyle[o.status]}`}>
                {o.status}
              </span>
              <button
                onClick={() => logAktion("GF", `Output freigegeben: ${o.dateiname}`, o.space)}
                className="flex items-center gap-1.5 rounded-[8px] bg-green-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
              >
                <Check size={14} />
                Freigeben
              </button>
              <button
                onClick={() => logAktion("GF", `An Kunden geteilt: ${o.dateiname}`, o.space)}
                className="flex items-center gap-1.5 rounded-[8px] bg-[#2563eb] px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90"
              >
                <Share2 size={14} />
                An Kunden teilen
              </button>
              <button
                onClick={() => logAktion("GF", `Nächster Schritt ausgelöst: ${o.dateiname}`, o.space)}
                className="flex items-center gap-1.5 rounded-[8px] bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:opacity-90"
              >
                <ArrowRight size={14} />
                Nächster Schritt
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
