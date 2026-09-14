// D:\Projekt2027\Basismodule\Posteingang\app\posteingang\bearbeitung\BearbeitungTabelle.tsx (Client Component)
//
// Tabellen-Ansicht zur Bearbeitung: Priorität, Bereich und Verantwortlicher
// werden hier zugewiesen (Lernphase: manuell durch Admin, später KI-Vorschlag
// mit Freigabe/Ablehnung durch Mensch). Filter nach Bereich, Priorität und
// Mitarbeiter — "Weitergeleitet an" ist hier der Mitarbeiter-Filter, keine
// eigene Seite (siehe Klärung mit Peter).

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Bereich, Mitarbeiter, PosteingangEintrag, Prioritaet } from "@/lib/posteingang/types";

type Props = {
  initialEintraege: PosteingangEintrag[];
  bereiche: Bereich[];
  mitarbeiter: Mitarbeiter[];
};

const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

const PRIORITAET_FARBE: Record<Prioritaet, string> = {
  hoch: "bg-red-100 text-red-700",
  mittel: "bg-amber-100 text-amber-700",
  niedrig: "bg-green-100 text-green-700",
};

export default function BearbeitungTabelle({ initialEintraege, bereiche, mitarbeiter }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [filterBereich, setFilterBereich] = useState<string>("alle");
  const [filterPrioritaet, setFilterPrioritaet] = useState<string>("alle");
  const [filterMitarbeiter, setFilterMitarbeiter] = useState<string>("alle");
  const [suche, setSuche] = useState("");

  const gefilterte = useMemo(() => {
    return initialEintraege.filter((e) => {
      if (filterBereich !== "alle" && e.bereich_id !== filterBereich) return false;
      if (filterPrioritaet !== "alle" && e.prioritaet !== filterPrioritaet) return false;
      if (filterMitarbeiter !== "alle" && e.verantwortlich_id !== filterMitarbeiter) return false;
      if (suche.trim() && !e.inhalt.toLowerCase().includes(suche.trim().toLowerCase())) return false;
      return true;
    });
  }, [initialEintraege, filterBereich, filterPrioritaet, filterMitarbeiter, suche]);

  async function feldAendern(id: string, daten: Record<string, string>) {
    await fetch(`/api/posteingang/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(daten),
    });
    startTransition(() => router.refresh());
  }

  async function kiVorschlagEntscheiden(id: string, aktion: "uebernehmen" | "ablehnen") {
    await fetch(`/api/posteingang/${id}/ki-vorschlag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={filterBereich}
          onChange={(e) => setFilterBereich(e.target.value)}
          className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px]"
        >
          <option value="alle">Alle Bereiche</option>
          {bereiche.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={filterPrioritaet}
          onChange={(e) => setFilterPrioritaet(e.target.value)}
          className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px]"
        >
          <option value="alle">Alle Prioritäten</option>
          <option value="hoch">Hoch</option>
          <option value="mittel">Mittel</option>
          <option value="niedrig">Niedrig</option>
        </select>

        <select
          value={filterMitarbeiter}
          onChange={(e) => setFilterMitarbeiter(e.target.value)}
          className="rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px]"
        >
          <option value="alle">Alle Mitarbeiter</option>
          {mitarbeiter.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Posteingang durchsuchen…"
          className="ml-auto rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13px]"
        />
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0]">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["Eingang", "Kanal", "Priorität", "Bereich", "Verantwortlich", "KI-Vorschlag"].map((h) => (
                <th
                  key={h}
                  className="border-b border-[#e2e8f0] px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gefilterte.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[#64748b]">
                  Keine Einträge für diese Filterung.
                </td>
              </tr>
            )}
            {gefilterte.map((e) => (
              <tr key={e.id}>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  <div className="font-medium">{e.absender}</div>
                  <div className="mt-0.5 max-w-[260px] truncate text-[12px] text-[#64748b]">{e.inhalt}</div>
                </td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">{e.kanal}</td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  <select
                    value={e.prioritaet ?? ""}
                    onChange={(ev) => feldAendern(e.id, { prioritaet: ev.target.value })}
                    className={`rounded-full border-0 px-2.5 py-1 text-[11.5px] font-semibold ${
                      e.prioritaet ? PRIORITAET_FARBE[e.prioritaet] : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <option value="">—</option>
                    <option value="hoch">Hoch</option>
                    <option value="mittel">Mittel</option>
                    <option value="niedrig">Niedrig</option>
                  </select>
                </td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  <select
                    value={e.bereich_id ?? ""}
                    onChange={(ev) => feldAendern(e.id, { bereich_id: ev.target.value })}
                    className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[12.5px]"
                  >
                    <option value="">Nicht zugeordnet</option>
                    {bereiche.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  <select
                    value={e.verantwortlich_id ?? ""}
                    onChange={(ev) => feldAendern(e.id, { verantwortlich_id: ev.target.value })}
                    className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[12.5px]"
                  >
                    <option value="">Nicht zugeordnet</option>
                    {mitarbeiter.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  {e.ki_vorschlag_status === "offen" ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-[#64748b]">
                        {e.ki_vorschlag_prioritaet ? PRIORITAET_LABEL[e.ki_vorschlag_prioritaet] : "–"}
                      </span>
                      <button
                        onClick={() => kiVorschlagEntscheiden(e.id, "uebernehmen")}
                        className="rounded-[6px] bg-green-100 px-2 py-1 text-[11.5px] font-semibold text-green-700"
                      >
                        Übernehmen
                      </button>
                      <button
                        onClick={() => kiVorschlagEntscheiden(e.id, "ablehnen")}
                        className="rounded-[6px] bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-600"
                      >
                        Ablehnen
                      </button>
                    </div>
                  ) : (
                    <span className="text-[12px] text-[#94a3b8]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
