// app/aufgaben/AufgabenListe.tsx (Client Component)
// Neu 01.08.2026 — Interaktion für MEINE AUFGABEN (Anlegen, Status wechseln)

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type MeineAufgabe = {
  id: string;
  titel: string;
  beschreibung: string | null;
  zugewiesen_an: string;
  quelle: string;
  status: string;
  erstellt_am: string;
};

const QUELLE_LABEL: Record<string, string> = {
  manuell: "Manuell",
  kanal_verlegt: "Aus Eingang",
  freigabe: "Freigabe",
};

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AufgabenListe({ initialAufgaben }: { initialAufgaben: MeineAufgabe[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [formOffen, setFormOffen] = useState(false);

  async function neueAufgabeAnlegen(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim()) return;

    await fetch("/api/meine-aufgaben", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titel, beschreibung }),
    });

    setTitel("");
    setBeschreibung("");
    setFormOffen(false);
    startTransition(() => router.refresh());
  }

  async function statusWechseln(id: string, neuerStatus: "offen" | "erledigt") {
    await fetch(`/api/meine-aufgaben/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: neuerStatus }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-4">
        {!formOffen ? (
          <button
            onClick={() => setFormOffen(true)}
            className="rounded-[8px] bg-[#2563eb] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Neue Aufgabe
          </button>
        ) : (
          <form
            onSubmit={neueAufgabeAnlegen}
            className="rounded-[10px] border border-[#e2e8f0] bg-white p-4"
          >
            <input
              autoFocus
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Titel"
              className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13.5px]"
            />
            <textarea
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              placeholder="Beschreibung (optional)"
              rows={2}
              className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!titel.trim() || isPending}
                className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setFormOffen(false)}
                className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748b]"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0]">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["Titel", "Quelle", "Zugewiesen an", "Erstellt", "Status"].map((h) => (
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
            {initialAufgaben.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#64748b]">
                  Keine Aufgaben.
                </td>
              </tr>
            )}
            {initialAufgaben.map((a) => (
              <tr key={a.id} className="last:border-b-0">
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  <div className="font-medium">{a.titel}</div>
                  {a.beschreibung && (
                    <div className="mt-0.5 text-[12px] text-[#64748b]">{a.beschreibung}</div>
                  )}
                </td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  {QUELLE_LABEL[a.quelle] ?? a.quelle}
                </td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">{a.zugewiesen_an}</td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">{formatDatum(a.erstellt_am)}</td>
                <td className="border-b border-[#e2e8f0] px-3 py-3">
                  <button
                    onClick={() => statusWechseln(a.id, a.status === "offen" ? "erledigt" : "offen")}
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                      a.status === "erledigt"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {a.status === "erledigt" ? "Erledigt" : "Offen"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
