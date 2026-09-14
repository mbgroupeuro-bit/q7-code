// Notizen — Listen-Komponente (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\NotizenListe.tsx
//
// Neu (04.09.2026): Eigener Tab für lose, wichtige Informationen (z.B.
// Kundendetails), die bewusst keine Aufgabe sind (kein Status, keine
// Fälligkeit). Karten-Ansicht mit Inline-Bearbeitung (Klick auf
// "Bearbeiten" verwandelt die Karte in ein Formular, analog zum
// Umbenennen-Muster in components/Sidebar.tsx).

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Notiz } from "@/lib/notizen-interface";

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

type FormWerte = { titel: string; text: string; kunde: string; projekt_id: string; tags: string };

const LEERES_FORMULAR: FormWerte = { titel: "", text: "", kunde: "", projekt_id: "", tags: "" };

function tagsParsen(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export default function NotizenListe({ initialNotizen }: { initialNotizen: Notiz[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [formOffen, setFormOffen] = useState(false);
  const [neu, setNeu] = useState<FormWerte>(LEERES_FORMULAR);

  const [bearbeitungId, setBearbeitungId] = useState<string | null>(null);
  const [bearbeitungsWerte, setBearbeitungsWerte] = useState<FormWerte>(LEERES_FORMULAR);

  async function notizAnlegen(e: React.FormEvent) {
    e.preventDefault();
    if (!neu.titel.trim() || !neu.text.trim()) return;

    await fetch("/api/notizen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: neu.titel,
        text: neu.text,
        kunde: neu.kunde.trim() || undefined,
        projekt_id: neu.projekt_id.trim() || undefined,
        tags: tagsParsen(neu.tags),
      }),
    });

    setNeu(LEERES_FORMULAR);
    setFormOffen(false);
    startTransition(() => router.refresh());
  }

  function bearbeitungStarten(n: Notiz) {
    setBearbeitungId(n.id);
    setBearbeitungsWerte({
      titel: n.titel,
      text: n.text,
      kunde: n.kunde ?? "",
      projekt_id: n.projekt_id ?? "",
      tags: n.tags.join(", "),
    });
  }

  async function bearbeitungSpeichern(e: React.FormEvent) {
    e.preventDefault();
    if (!bearbeitungId || !bearbeitungsWerte.titel.trim() || !bearbeitungsWerte.text.trim()) return;

    await fetch(`/api/notizen/${bearbeitungId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: bearbeitungsWerte.titel,
        text: bearbeitungsWerte.text,
        kunde: bearbeitungsWerte.kunde.trim() || null,
        projekt_id: bearbeitungsWerte.projekt_id.trim() || null,
        tags: tagsParsen(bearbeitungsWerte.tags),
      }),
    });

    setBearbeitungId(null);
    startTransition(() => router.refresh());
  }

  async function notizLoeschen(n: Notiz) {
    if (!confirm(`Notiz "${n.titel}" wirklich löschen?`)) return;
    await fetch(`/api/notizen/${n.id}`, { method: "DELETE" });
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
            + Neue Notiz
          </button>
        ) : (
          <form onSubmit={notizAnlegen} className="rounded-[10px] border border-[#e2e8f0] bg-white p-4">
            <input
              autoFocus
              value={neu.titel}
              onChange={(e) => setNeu({ ...neu, titel: e.target.value })}
              placeholder="Titel"
              className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13.5px]"
            />
            <textarea
              value={neu.text}
              onChange={(e) => setNeu({ ...neu, text: e.target.value })}
              placeholder="Text..."
              rows={3}
              className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
            />
            <div className="mb-2 flex flex-wrap gap-2">
              <input
                value={neu.kunde}
                onChange={(e) => setNeu({ ...neu, kunde: e.target.value })}
                placeholder="Kunde (optional)"
                className="min-w-[140px] flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
              />
              <input
                value={neu.projekt_id}
                onChange={(e) => setNeu({ ...neu, projekt_id: e.target.value })}
                placeholder="Projekt (optional)"
                className="min-w-[140px] flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
              />
              <input
                value={neu.tags}
                onChange={(e) => setNeu({ ...neu, tags: e.target.value })}
                placeholder="Tags, komma-getrennt (optional)"
                className="min-w-[180px] flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!neu.titel.trim() || !neu.text.trim()}
                className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOffen(false);
                  setNeu(LEERES_FORMULAR);
                }}
                className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748b]"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>

      {initialNotizen.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#e2e8f0] py-10 text-center text-[13px] text-[#64748b]">
          Noch keine Notizen. Nutze "+ Neue Notiz" für wichtige Infos, die keine Aufgabe sind.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {initialNotizen.map((n) => {
            const wirdBearbeitet = bearbeitungId === n.id;

            if (wirdBearbeitet) {
              return (
                <form
                  key={n.id}
                  onSubmit={bearbeitungSpeichern}
                  className="col-span-3 rounded-[12px] border border-[#2563eb] bg-white p-4 sm:col-span-1"
                >
                  <input
                    autoFocus
                    value={bearbeitungsWerte.titel}
                    onChange={(e) => setBearbeitungsWerte({ ...bearbeitungsWerte, titel: e.target.value })}
                    className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13.5px]"
                  />
                  <textarea
                    value={bearbeitungsWerte.text}
                    onChange={(e) => setBearbeitungsWerte({ ...bearbeitungsWerte, text: e.target.value })}
                    rows={3}
                    className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
                  />
                  <input
                    value={bearbeitungsWerte.kunde}
                    onChange={(e) => setBearbeitungsWerte({ ...bearbeitungsWerte, kunde: e.target.value })}
                    placeholder="Kunde"
                    className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
                  />
                  <input
                    value={bearbeitungsWerte.projekt_id}
                    onChange={(e) => setBearbeitungsWerte({ ...bearbeitungsWerte, projekt_id: e.target.value })}
                    placeholder="Projekt"
                    className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
                  />
                  <input
                    value={bearbeitungsWerte.tags}
                    onChange={(e) => setBearbeitungsWerte({ ...bearbeitungsWerte, tags: e.target.value })}
                    placeholder="Tags, komma-getrennt"
                    className="mb-3 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={() => setBearbeitungId(null)}
                      className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748b]"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div key={n.id} className="flex flex-col rounded-[12px] border border-[#e2e8f0] p-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="font-medium">{n.titel}</div>
                </div>
                <div
                  className="mb-2 flex-1 text-[13px] text-[#334155]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {n.text}
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {n.kunde && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">
                      {n.kunde}
                    </span>
                  )}
                  {n.projekt_id && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] text-purple-600">
                      {n.projekt_id}
                    </span>
                  )}
                  {n.tags.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-[#e2e8f0] pt-2">
                  <span className="text-[11px] text-[#94a3b8]">{formatDatum(n.aktualisiert_am)}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => bearbeitungStarten(n)}
                      className="text-[12px] text-[#2563eb] hover:underline"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => notizLoeschen(n)}
                      className="text-[12px] text-red-600 hover:underline"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
