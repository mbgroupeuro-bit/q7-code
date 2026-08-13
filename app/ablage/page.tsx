"use client";

import { useState } from "react";
import { FileText, Scale, Workflow, Receipt, Folder, Plus, X } from "lucide-react";
import { WISSEN_EINTRAEGE, WissenEintrag } from "@/lib/types";
import FileUpload from "@/components/FileUpload";
import { useAppState } from "@/lib/store";

const kategorieIcon: Record<WissenEintrag["kategorie"], typeof FileText> = {
  Verträge: FileText,
  Prozesse: Workflow,
  Preislisten: Receipt,
  Regeln: Scale,
};

const kategorienAlt: Array<WissenEintrag["kategorie"] | "Alle"> = [
  "Alle",
  "Verträge",
  "Prozesse",
  "Preislisten",
  "Regeln",
];

// Block 3, Option C (Admin-Entscheidung): Upload-Kategorien sind NICHT an
// WissenEintrag["kategorie"] gebunden — Admin/Lizenznehmer kann eigene
// Kategorien frei anlegen (siehe STANDARD_WISSEN_KATEGORIEN in lib/types.ts
// + wissenKategorien im Store, persistiert unter "q7-wissen-kategorien").
// Die bestehenden WISSEN_EINTRAEGE (Mock-Daten) bleiben von der separaten
// Union-Type-Kategorie unberührt und werden weiterhin über den alten Filter
// oben in der Seite angezeigt.

export default function AblagePage() {
  const { uploads, addUpload, removeUpload, wissenKategorien, addWissenKategorie } = useAppState();
  const [filter, setFilter] = useState<(typeof kategorienAlt)[number]>("Alle");
  const [neueKategorie, setNeueKategorie] = useState("");
  const [zeigeNeueKategorieFeld, setZeigeNeueKategorieFeld] = useState(false);

  const eintraege =
    filter === "Alle" ? WISSEN_EINTRAEGE : WISSEN_EINTRAEGE.filter((w) => w.kategorie === filter);

  function kategorieHinzufuegen() {
    if (!neueKategorie.trim()) return;
    addWissenKategorie(neueKategorie.trim());
    setNeueKategorie("");
    setZeigeNeueKategorieFeld(false);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold">Ablage</h2>
          <div className="mt-1 text-[13px] text-[#64748b]">
            Dokumentenablage — Verträge, Prozesse, Preislisten, Regeln und hochgeladene Dateien
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {kategorienAlt.map((k) => (
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {eintraege.map((w) => {
          const Icon = kategorieIcon[w.kategorie];
          return (
            <div
              key={w.id}
              className="cursor-pointer rounded-[12px] border border-[#e2e8f0] bg-white p-4 hover:border-[#cbd5e1]"
              onClick={() => alert(`Öffnet: ${w.titel} (folgt später)`)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-slate-100">
                  <Icon size={17} className="text-[#475569]" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold">{w.titel}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {w.kategorie}
                    </span>
                    {w.space && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        {w.space}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[12px] text-[#64748b]">
                Aktualisiert am {w.aktualisiert}
              </div>
            </div>
          );
        })}

        {eintraege.length === 0 && (
          <div className="col-span-full py-10 text-center text-[13px] text-[#64748b]">
            Keine Einträge in dieser Kategorie.
          </div>
        )}
      </div>

      {/* Block 3 — Upload-Bereich: eigene, frei konfigurierbare Kategorienliste */}
      <div className="mt-8 border-t border-[#e2e8f0] pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Dateien</h3>
          {!zeigeNeueKategorieFeld ? (
            <button
              onClick={() => setZeigeNeueKategorieFeld(true)}
              className="flex items-center gap-1 text-[12.5px] font-semibold text-[#2563eb] hover:opacity-80"
            >
              <Plus size={14} /> Kategorie
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={neueKategorie}
                onChange={(e) => setNeueKategorie(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && kategorieHinzufuegen()}
                placeholder="Neue Kategorie..."
                className="rounded-[8px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
              />
              <button onClick={kategorieHinzufuegen} className="text-[#2563eb]">
                <Plus size={16} />
              </button>
              <button onClick={() => setZeigeNeueKategorieFeld(false)} className="text-[#94a3b8]">
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {wissenKategorien.map((kategorie) => {
            const dateien = uploads.filter((u) => u.kategorie === kategorie);
            return (
              <div key={kategorie} className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                    <Folder size={16} className="text-[#475569]" />
                    {kategorie}
                  </div>
                  <FileUpload
                    variante="button"
                    label="Hochladen"
                    kategorie={kategorie}
                    onUpload={addUpload}
                  />
                </div>
                {dateien.length === 0 ? (
                  <div className="text-[12.5px] text-[#94a3b8]">Noch keine Dateien.</div>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {dateien.map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between rounded-[8px] bg-slate-50 px-3 py-2 text-[12.5px]"
                      >
                        <span className="truncate">{d.name}</span>
                        <div className="flex flex-shrink-0 items-center gap-2 text-[#94a3b8]">
                          <span>{d.hochgeladenAm}</span>
                          <button onClick={() => removeUpload(d.id)} aria-label={`${d.name} entfernen`}>
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
