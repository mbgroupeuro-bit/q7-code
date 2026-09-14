// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\components\RoutinenEinstellung.tsx
//
// Für ALLE Mitarbeiter sichtbar (nicht admin-only) — jeder stellt seinen
// eigenen, persönlichen Arbeitsplan-Rhythmus ein. Nutzt /api/agent-routine
// (eigene Routinen, Besitzer-Prüfung passiert serverseitig).

"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";

type Wochentag = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";

const WOCHENTAGE: { wert: Wochentag; label: string }[] = [
  { wert: "mo", label: "Mo" },
  { wert: "di", label: "Di" },
  { wert: "mi", label: "Mi" },
  { wert: "do", label: "Do" },
  { wert: "fr", label: "Fr" },
  { wert: "sa", label: "Sa" },
  { wert: "so", label: "So" },
];

interface Routine {
  id: string;
  typ: string;
  anweisung: string;
  uhrzeit: string;
  wochentage: Wochentag[];
  aktiv: boolean;
}

export default function RoutinenEinstellung() {
  const [routinen, setRoutinen] = useState<Routine[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [fehler, setFehler] = useState<string | null>(null);

  const [neueAnweisung, setNeueAnweisung] = useState("");
  const [neueUhrzeit, setNeueUhrzeit] = useState("08:00");
  const [neueWochentage, setNeueWochentage] = useState<Wochentag[]>(["mo", "di", "mi", "do", "fr"]);
  const [wirdErstellt, setWirdErstellt] = useState(false);

  async function ladeRoutinen() {
    try {
      const res = await fetch("/api/agent-routine");
      const data = await res.json();
      setRoutinen(data.routinen ?? []);
    } catch (err) {
      console.error("Routinen konnten nicht geladen werden:", err);
      setFehler("Konnte Routinen nicht laden.");
    } finally {
      setLaedt(false);
    }
  }

  useEffect(() => {
    ladeRoutinen();
  }, []);

  function wochentagUmschalten(tag: Wochentag) {
    setNeueWochentage((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function routineErstellen() {
    if (neueAnweisung.trim().length === 0) {
      setFehler("Bitte eine Anweisung eingeben, was die KI erledigen soll.");
      return;
    }
    if (neueWochentage.length === 0) {
      setFehler("Mindestens ein Wochentag muss ausgewählt sein.");
      return;
    }

    setWirdErstellt(true);
    setFehler(null);

    try {
      const res = await fetch("/api/agent-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ: "eigene_routine",
          anweisung: neueAnweisung.trim(),
          uhrzeit: neueUhrzeit,
          wochentage: neueWochentage,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.fehler ?? "Anlegen fehlgeschlagen.");
      }

      setNeueAnweisung("");
      await ladeRoutinen();
    } catch (err) {
      console.error(err);
      setFehler(err instanceof Error ? err.message : "Anlegen fehlgeschlagen.");
    } finally {
      setWirdErstellt(false);
    }
  }

  async function aktivUmschalten(routine: Routine) {
    try {
      const res = await fetch(`/api/agent-routine/${routine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktiv: !routine.aktiv }),
      });
      if (!res.ok) throw new Error("Ändern fehlgeschlagen.");
      await ladeRoutinen();
    } catch (err) {
      console.error(err);
      setFehler("Ändern fehlgeschlagen.");
    }
  }

  async function routineLoeschen(routineId: string) {
    try {
      const res = await fetch(`/api/agent-routine/${routineId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen.");
      await ladeRoutinen();
    } catch (err) {
      console.error(err);
      setFehler("Löschen fehlgeschlagen.");
    }
  }

  if (laedt) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#64748b]">
        <Loader2 size={14} className="animate-spin" />
        Routinen werden geladen...
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <div className="mb-1 text-[14.5px] font-semibold">Meine Routinen</div>
      <div className="mb-3 text-[12.5px] text-[#64748b]">
        Stelle ein, was die KI wiederkehrend für dich erledigen soll, und wann.
      </div>

      {routinen.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {routinen.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#e2e8f0] px-3 py-2"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[13px]">
                  <Clock size={14} className="text-[#64748b]" />
                  <span className="font-semibold">{r.uhrzeit}</span>
                  <span className="text-[#64748b]">
                    {r.wochentage.map((t) => WOCHENTAGE.find((w) => w.wert === t)?.label).join(", ")}
                  </span>
                </div>
                <div className="text-[12px] text-[#475569]">{r.anweisung}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => aktivUmschalten(r)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    r.aktiv ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {r.aktiv ? "Aktiv" : "Pausiert"}
                </button>
                <button
                  onClick={() => routineLoeschen(r.id)}
                  aria-label="Routine löschen"
                  className="text-[#94a3b8] hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[#e2e8f0] pt-3">
        <label className="mb-3 flex flex-col gap-1 text-[12.5px]">
          <span className="font-medium">Was soll die KI tun?</span>
          <textarea
            value={neueAnweisung}
            onChange={(e) => setNeueAnweisung(e.target.value)}
            placeholder='z.B. "Liste mir die wichtigsten offenen Aufgaben auf" oder "Fasse zusammen, was heute erledigt wurde"'
            rows={2}
            className="rounded-[8px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
          />
        </label>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[12.5px]">
          <span className="font-medium">Uhrzeit</span>
          <input
            type="time"
            value={neueUhrzeit}
            onChange={(e) => setNeueUhrzeit(e.target.value)}
            className="rounded-[8px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[12.5px] font-medium">Wochentage</span>
          <div className="flex gap-1">
            {WOCHENTAGE.map((w) => (
              <button
                key={w.wert}
                onClick={() => wochentagUmschalten(w.wert)}
                className={`h-8 w-8 rounded-[6px] text-[11.5px] font-semibold ${
                  neueWochentage.includes(w.wert)
                    ? "bg-[#2563eb] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={routineErstellen}
          disabled={wirdErstellt}
          className="flex items-center gap-1.5 rounded-[8px] bg-[#2563eb] px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={14} />
          Routine hinzufügen
        </button>
      </div>
      </div>

      {fehler && <div className="mt-3 text-[12.5px] text-red-600">{fehler}</div>}
    </div>
  );
}
