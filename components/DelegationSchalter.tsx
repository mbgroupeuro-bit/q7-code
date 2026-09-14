// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\components\DelegationSchalter.tsx
//
// 3-Stufen-Schalter (Keine/Teil/Komplett) für die Admin-Konsole. Nutzt
// /api/agent-delegation (GET für alle mit Agent-Zugriff, PUT nur Admin —
// serverseitig via pruefeAdminZugriff() abgesichert, diese Komponente ist
// KEINE Sicherheitsgrenze, nur UI).

"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

type DelegationStufe = "keine" | "teil" | "komplett";

const STUFEN: { wert: DelegationStufe; label: string; beschreibung: string; icon: typeof ShieldX }[] = [
  {
    wert: "keine",
    label: "Keine Freigabe",
    beschreibung: "Jede KI-Aktion braucht eine manuelle Freigabe in der Ausgabe.",
    icon: ShieldX,
  },
  {
    wert: "teil",
    label: "Teilfreigabe",
    beschreibung: "Einzelne Aktionen delegiert, Rest bleibt freigabepflichtig (Einzelsteuerung folgt später).",
    icon: ShieldAlert,
  },
  {
    wert: "komplett",
    label: "Komplett-Freigabe",
    beschreibung: "KI darf alle Aktionen selbständig ausführen, ohne Rückfrage.",
    icon: ShieldCheck,
  },
];

export default function DelegationSchalter() {
  const [stufe, setStufe] = useState<DelegationStufe | null>(null);
  const [laedt, setLaedt] = useState(true);
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agent-delegation")
      .then((res) => res.json())
      .then((data) => setStufe(data.delegation?.stufe ?? "keine"))
      .catch((err) => {
        console.error("Delegation konnte nicht geladen werden:", err);
        setFehler("Konnte aktuelle Einstellung nicht laden.");
      })
      .finally(() => setLaedt(false));
  }, []);

  async function stufeAendern(neueStufe: DelegationStufe) {
    if (neueStufe === stufe) return;
    setSpeichert(true);
    setFehler(null);

    try {
      const res = await fetch("/api/agent-delegation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stufe: neueStufe }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.fehler ?? "Ändern fehlgeschlagen.");
      }

      const data = await res.json();
      setStufe(data.delegation.stufe);
    } catch (err) {
      console.error(err);
      setFehler(err instanceof Error ? err.message : "Ändern fehlgeschlagen.");
    } finally {
      setSpeichert(false);
    }
  }

  if (laedt) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
        <Loader2 size={14} className="animate-spin" />
        Einstellung wird geladen...
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 text-[14.5px] font-semibold">KI-Freigabe-Stufe</div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {STUFEN.map((s) => {
          const Icon = s.icon;
          const aktiv = stufe === s.wert;
          return (
            <button
              key={s.wert}
              onClick={() => stufeAendern(s.wert)}
              disabled={speichert}
              className={`flex flex-col items-start gap-1.5 rounded-[10px] border p-3 text-left transition disabled:opacity-50 ${
                aktiv
                  ? "border-[#2563eb] bg-blue-50"
                  : "border-[#e2e8f0] bg-white hover:bg-slate-50"
              }`}
            >
              <Icon size={16} className={aktiv ? "text-[#2563eb]" : "text-[#64748b]"} />
              <div className={`text-[13px] font-semibold ${aktiv ? "text-[#2563eb]" : "text-[#0f172a]"}`}>
                {s.label}
              </div>
              <div className="text-[11.5px] text-[#64748b]">{s.beschreibung}</div>
            </button>
          );
        })}
      </div>
      {fehler && <div className="mt-3 text-[12.5px] text-red-600">{fehler}</div>}
    </div>
  );
}
