// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\output\page.tsx
// (oder entsprechender Pfad in der Basismodul-Kopie: app/output/page.tsx)
// ERSETZT die bestehende Datei. NEU (KI-Agent): oberer Bereich mit echten
// AgentAktion-Vorschlägen (SEC-GATE, Freigeben/Ablehnen). Der bestehende
// Mock-Bereich (OUTPUT_LIST) bleibt unverändert darunter erhalten.

"use client";

import { useEffect, useState } from "react";
import { FileText, Check, Share2, ArrowRight, Loader2, X, Bot } from "lucide-react";
import { OUTPUT_LIST } from "@/lib/types";
import { useAppState } from "@/lib/store";

const statusStyle: Record<string, string> = {
  Final: "bg-green-100 text-green-700",
  "In Bearbeitung": "bg-yellow-100 text-yellow-700",
  Zurückgewiesen: "bg-red-100 text-red-700",
};

// NEU (KI-Agent): Form entspricht AgentAktion aus lib/ki-agent/types.ts,
// hier lokal gehalten, damit diese Seite nicht vom KI-Agent-Modul importieren
// muss (Ausgabe-Seite gehört zum Q7-Kern, nicht zum Basismodul selbst).
interface AgentAktionAnzeige {
  id: string;
  typ: string;
  ergebnisText: string | null;
  erstelltAm: string;
  status: string;
}

function AgentAktionenBereich() {
  const [aktionen, setAktionen] = useState<AgentAktionAnzeige[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [inBearbeitung, setInBearbeitung] = useState<string | null>(null);

  async function ladeAktionen() {
    try {
      const res = await fetch("/api/agent-aktion");
      const data = await res.json();
      setAktionen(data.aktionen ?? []);
    } catch (err) {
      console.error("KI-Vorschläge konnten nicht geladen werden:", err);
    } finally {
      setLaedt(false);
    }
  }

  useEffect(() => {
    ladeAktionen();
  }, []);

  async function freigeben(id: string) {
    setInBearbeitung(id);
    try {
      const res = await fetch(`/api/agent-aktion/${id}/freigeben`, { method: "POST" });
      if (!res.ok) throw new Error("Freigeben fehlgeschlagen");
      await ladeAktionen();
    } catch (err) {
      console.error(err);
      alert("Freigeben fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setInBearbeitung(null);
    }
  }

  async function ablehnen(id: string) {
    setInBearbeitung(id);
    try {
      const res = await fetch(`/api/agent-aktion/${id}/ablehnen`, { method: "POST" });
      if (!res.ok) throw new Error("Ablehnen fehlgeschlagen");
      await ladeAktionen();
    } catch (err) {
      console.error(err);
      alert("Ablehnen fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setInBearbeitung(null);
    }
  }

  if (laedt) {
    return (
      <div className="mb-6 flex items-center gap-2 text-[13px] text-[#64748b]">
        <Loader2 size={14} className="animate-spin" />
        KI-Vorschläge werden geladen...
      </div>
    );
  }

  if (aktionen.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
        <Bot size={16} className="text-[#2563eb]" />
        KI-Vorschläge — wartet auf Freigabe
      </h3>
      <div className="flex flex-col gap-3">
        {aktionen.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border border-[#2563eb]/30 bg-blue-50/40 p-4"
          >
            <div>
              <div className="text-[14px] font-semibold">{a.typ}</div>
              {a.ergebnisText && (
                <div className="mt-1 max-w-[520px] text-[12.5px] text-[#475569]">{a.ergebnisText}</div>
              )}
              <div className="mt-1 text-[11px] text-[#94a3b8]">
                {new Date(a.erstelltAm).toLocaleString("de-DE")}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => freigeben(a.id)}
                disabled={inBearbeitung === a.id}
                className="flex items-center gap-1.5 rounded-[8px] bg-green-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <Check size={14} />
                Freigeben
              </button>
              <button
                onClick={() => ablehnen(a.id)}
                disabled={inBearbeitung === a.id}
                className="flex items-center gap-1.5 rounded-[8px] bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                <X size={14} />
                Ablehnen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OutputPage() {
  const { logAktion } = useAppState();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-5 text-[20px] font-semibold">Output</h2>

      {/* NEU (KI-Agent): echte, freigabepflichtige KI-Vorschläge */}
      <AgentAktionenBereich />

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
