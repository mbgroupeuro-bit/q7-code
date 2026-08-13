"use client";

import { useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useAppState } from "@/lib/store";
import { AGENTS } from "@/lib/types";

const filters = ["Alle", "Nur GF-Aktionen", "Nur Agenten", "Nur Output-Ereignisse"] as const;

// Ermittelt, welcher Agent auf einen Kommentar zu einem Protokoll-Eintrag antworten soll.
// KORRIGIERT (11.07.2026): Fallback "A01a Hermes" -> "A01 Planung & Vorbereitung (Hermes)"
// nach Agentenmodell-Korrektur (siehe Q7_KLAERUNGSBEDARF_Agentenmodell.md).
function agentLabelFuerAkteur(akteur: string): string {
  const gefunden = AGENTS.find(
    (a) => akteur.startsWith(a.kuerzel) || akteur === a.name || akteur.includes(a.name)
  );
  if (gefunden) return `${gefunden.kuerzel} ${gefunden.name}`;
  return "A01 Planung & Vorbereitung (Hermes)"; // Fallback: Koordination übernimmt, wenn kein spezifischer Agent erkennbar ist
}

export default function ProtokollPage() {
  const { protokoll, fuegeThreadKommentarHinzu, setzeThreadAntwort } = useAppState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("Alle");
  const [offenerKommentar, setOffenerKommentar] = useState<string | null>(null);
  const [kommentarText, setKommentarText] = useState("");

  const eintraege = protokoll.filter((p) => {
    if (filter === "Alle") return true;
    if (filter === "Nur GF-Aktionen") return p.akteur === "GF";
    if (filter === "Nur Agenten") return p.akteur !== "GF" && p.akteur !== "System";
    if (filter === "Nur Output-Ereignisse") return /freigegeben|geteilt|nächster schritt/i.test(p.aktion);
    return true;
  });

  async function kommentarSenden(eintragId: string, akteur: string) {
    const text = kommentarText.trim();
    if (!text) return;

    const kommentarId = crypto.randomUUID();
    fuegeThreadKommentarHinzu(eintragId, kommentarId, text);
    setKommentarText("");

    const agentLabel = agentLabelFuerAkteur(akteur);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentLabel, space: "Kein Space", message: text }),
      });
      const data = await res.json();
      setzeThreadAntwort(eintragId, kommentarId, data.reply ?? "(Keine Antwort erhalten.)");
    } catch {
      setzeThreadAntwort(eintragId, kommentarId, "Fehler: Agent nicht erreichbar.");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-1">
        <h2 className="text-[20px] font-semibold">Protokoll</h2>
      </div>
      <div className="mb-4 text-[13px] text-[#64748b]">
        Kommentiere einen Eintrag, um den zuständigen Agenten direkt im Thread zu reaktivieren — ohne
        neuen Chat zu starten.
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-[8px] px-3.5 py-2 text-[13px] font-semibold ${
              filter === f ? "border border-[#e2e8f0] bg-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
        <select defaultValue="Monat" className="ml-auto rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px]">
          <option>Heute</option>
          <option>Woche</option>
          <option>Monat</option>
          <option>Alle</option>
        </select>
      </div>

      <div className="flex flex-col gap-2.5">
        {eintraege.map((p) => (
          <div key={p.id} className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="whitespace-nowrap text-[12px] text-[#64748b]">{p.zeitstempel}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600">
                {p.akteur}
              </span>
              <span className="text-[13.5px]">{p.aktion}</span>
              {p.spaceKontext && (
                <span className="ml-auto text-[12px] text-[#64748b]">{p.spaceKontext}</span>
              )}
            </div>

            {p.thread && p.thread.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-l-2 border-[#e2e8f0] pl-3">
                {p.thread.map((t) => (
                  <div key={t.id} className="text-[13px]">
                    <div className="text-[#0f172a]">
                      <span className="font-semibold">GF:</span> {t.kommentar}
                    </div>
                    {t.laedt ? (
                      <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#64748b]">
                        <Loader2 size={12} className="animate-spin" />
                        {agentLabelFuerAkteur(p.akteur)} antwortet...
                      </div>
                    ) : (
                      t.antwort && (
                        <div className="mt-1 text-[#475569]">
                          <span className="font-semibold">{agentLabelFuerAkteur(p.akteur)}:</span> {t.antwort}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            {offenerKommentar === p.id ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={kommentarText}
                  onChange={(e) => setKommentarText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") kommentarSenden(p.id, p.akteur);
                  }}
                  placeholder={`Kommentar an ${agentLabelFuerAkteur(p.akteur)}...`}
                  className="flex-1 rounded-[8px] border border-[#e2e8f0] px-3 py-1.5 text-[13px]"
                />
                <button
                  onClick={() => kommentarSenden(p.id, p.akteur)}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#2563eb] hover:opacity-90"
                >
                  <Send size={14} color="#fff" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setOffenerKommentar(p.id);
                  setKommentarText("");
                }}
                className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#64748b] hover:text-[#2563eb]"
              >
                <MessageSquare size={13} />
                Kommentieren
              </button>
            )}
          </div>
        ))}

        {eintraege.length === 0 && (
          <div className="py-10 text-center text-[13px] text-[#64748b]">Keine Einträge für diesen Filter.</div>
        )}
      </div>
    </div>
  );
}
