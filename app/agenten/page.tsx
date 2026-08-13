"use client";

import { useRouter } from "next/navigation";
import { AGENTS } from "@/lib/types";
import { useCurrentRole, darfAdminKonsoleSehen } from "@/lib/auth";

export default function AgentenPage() {
  const router = useRouter();
  const role = useCurrentRole();

  // RBAC-Fix (siehe Q7_UI_Spezifikation_v1.md, Grundprinzip 3 + Feststellung
  // zur bestehenden "Agenten"-Seite): Zugriff nur für GF/Admin, nie für Kunden.
  if (!darfAdminKonsoleSehen(role)) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-6 text-center text-[13px] text-[#64748b]">
          Diese Ansicht ist nicht verfügbar.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold">Agenten</h2>
        <div className="mt-1 text-[13px] text-[#64748b]">
          Admin-/Operator-Ansicht. Alle 15 Agenten (A00–A14) aktiv.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
          <div
            key={a.kuerzel}
            className={`rounded-[12px] border border-[#e2e8f0] bg-white p-4 ${!a.aktiv ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="text-[20px] font-bold">{a.kuerzel}</div>
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${a.aktiv ? "bg-green-500" : "bg-slate-300"}`} />
            </div>
            <div className="mt-1 font-semibold">{a.name}</div>
            <div className="mt-1 min-h-[32px] text-[12.5px] text-[#64748b]">{a.rolle}</div>
            {a.aktiv ? (
              <button
                onClick={() => router.push(`/?agent=${encodeURIComponent(`${a.kuerzel} ${a.name}`)}`)}
                className="mt-2.5 w-full rounded-[8px] border border-[#e2e8f0] bg-white py-2 text-[13px] font-semibold hover:bg-slate-50"
              >
                Chat öffnen
              </button>
            ) : (
              <button
                disabled
                className="mt-2.5 w-full cursor-not-allowed rounded-[8px] bg-slate-100 py-2 text-[13px] font-semibold text-slate-400"
              >
                Folgt später
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
