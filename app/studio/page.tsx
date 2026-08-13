"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { STUDIO_TOOLS, StudioTool, AGENTS } from "@/lib/types";
import { useAppState } from "@/lib/store";

const kategorien: Array<StudioTool["kategorie"] | "Alle"> = [
  "Alle",
  "Sales",
  "Produktion",
  "Marketing",
  "Verwaltung",
];

export default function StudioPage() {
  const router = useRouter();
  const { logAktion } = useAppState();
  const [filter, setFilter] = useState<(typeof kategorien)[number]>("Alle");
  const [activeTool, setActiveTool] = useState<StudioTool | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const tools =
    filter === "Alle" ? STUDIO_TOOLS : STUDIO_TOOLS.filter((t) => t.kategorie === filter);

  function oeffneFormular(tool: StudioTool) {
    const initial: Record<string, string> = {};
    tool.felder.forEach((f) => {
      initial[f.id] = f.typ === "select" && f.optionen ? f.optionen[0] : "";
    });
    setFormValues(initial);
    setActiveTool(tool);
  }

  function schliesseFormular() {
    setActiveTool(null);
    setFormValues({});
  }

  function starteWerkzeug() {
    if (!activeTool) return;
    const agent = `${activeTool.agentKuerzel} ${activeTool.agentName}`;
    const spaceKontext = formValues["space"];

    const zusammenfassung = activeTool.felder
      .map((f) => `${f.label}: ${formValues[f.id] || "—"}`)
      .join(" · ");

    logAktion("GF", `Werkzeug gestartet: ${activeTool.name}`, spaceKontext);

    const nachricht = `${activeTool.name} — ${zusammenfassung}`;
    const params = new URLSearchParams({ agent, tool: activeTool.name, message: nachricht });
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold">Studio</h2>
        <div className="mt-1 text-[13px] text-[#64748b]">
          Werkzeuge, die ein Ergebnis erzeugen — landet danach in Output. Alle 15 Agenten aktiv.
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {kategorien.map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-[8px] px-3.5 py-2 text-[13px] font-semibold ${
              filter === k
                ? "border border-[#e2e8f0] bg-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const agentAktiv = AGENTS.find((a) => a.kuerzel === tool.agentKuerzel)?.aktiv ?? false;
          return (
            <div
              key={tool.id}
              className={`flex flex-col rounded-[12px] border border-[#e2e8f0] bg-white p-4 ${!agentAktiv ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="text-[14.5px] font-semibold">{tool.name}</div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {tool.kategorie}
                </span>
              </div>
              <div className="mt-2 flex-1 text-[12.5px] text-[#64748b]">{tool.beschreibung}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11.5px] text-[#64748b]">
                  Agent: <span className="font-semibold text-[#0f172a]">{tool.agentKuerzel} {tool.agentName}</span>
                </span>
              </div>
              {agentAktiv ? (
                <button
                  onClick={() => oeffneFormular(tool)}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-[8px] bg-[#2563eb] py-2 text-[13px] font-semibold text-white hover:opacity-90"
                >
                  Werkzeug starten
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  disabled
                  className="mt-3 cursor-not-allowed rounded-[8px] bg-slate-100 py-2 text-[13px] font-semibold text-slate-400"
                >
                  Agent noch nicht aktiv
                </button>
              )}
            </div>
          );
        })}

        {tools.length === 0 && (
          <div className="col-span-full py-10 text-center text-[13px] text-[#64748b]">
            Keine Werkzeuge in dieser Kategorie.
          </div>
        )}
      </div>

      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[420px] rounded-[12px] border border-[#e2e8f0] bg-white p-5">
            <div className="mb-1 flex items-start justify-between">
              <div>
                <div className="text-[15px] font-semibold">{activeTool.name}</div>
                <div className="text-[12px] text-[#64748b]">
                  Agent: {activeTool.agentKuerzel} {activeTool.agentName}
                </div>
              </div>
              <button onClick={schliesseFormular} aria-label="Schließen" className="text-[#64748b] hover:text-[#0f172a]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {activeTool.felder.map((f) => (
                <label key={f.id} className="flex flex-col gap-1.5 text-[13px]">
                  <span className="font-medium text-[#0f172a]">{f.label}</span>
                  {f.typ === "select" ? (
                    <select
                      value={formValues[f.id] ?? ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      className="rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
                    >
                      {(f.optionen ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formValues[f.id] ?? ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={schliesseFormular}
                className="rounded-[8px] bg-slate-100 px-3.5 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-200"
              >
                Abbrechen
              </button>
              <button
                onClick={starteWerkzeug}
                className="flex items-center gap-1.5 rounded-[8px] bg-[#2563eb] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
              >
                An {activeTool.agentName} übergeben
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
