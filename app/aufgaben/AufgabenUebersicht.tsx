// Basismodul "Meine Aufgaben" — Dashboard-Übersicht (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\AufgabenUebersicht.tsx
//
// Neu (04.09.2026, 1): Statistik-Kacheln, Priorität-Verteilung, fällige
// Aufgaben.
//
// Neu (04.09.2026, 2): Widget "Letzte Notizen" ergänzt (die 3 zuletzt
// bearbeiteten Notizen, Klick führt zum "Notizen"-Tab).

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { MeineAufgabe, Prioritaet } from "@/lib/aufgaben-interface";
import type { Notiz } from "@/lib/notizen-interface";
import type { Tab } from "./AufgabenApp";

const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  hoch: "Hoch",
  normal: "Normal",
  niedrig: "Niedrig",
};

const PRIORITAET_PUNKT_FARBE: Record<Prioritaet, string> = {
  hoch: "bg-red-500",
  normal: "bg-amber-500",
  niedrig: "bg-green-500",
};

function tageBisFaelligkeit(iso: string): number {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const faellig = new Date(iso);
  faellig.setHours(0, 0, 0, 0);
  return Math.round((faellig.getTime() - heute.getTime()) / 86400000);
}

function faelligkeitBadge(diffTage: number): { text: string; farbe: string } {
  if (diffTage < 0) return { text: "Überfällig", farbe: "bg-red-100 text-red-700" };
  if (diffTage === 0) return { text: "Heute", farbe: "bg-red-100 text-red-700" };
  if (diffTage === 1) return { text: "Morgen", farbe: "bg-amber-100 text-amber-700" };
  return { text: `In ${diffTage} Tagen`, farbe: "bg-amber-100 text-amber-700" };
}

export default function AufgabenUebersicht({
  aufgaben,
  notizen,
  onTabWechseln,
}: {
  aufgaben: MeineAufgabe[];
  notizen: Notiz[];
  onTabWechseln: (tab: Tab) => void;
}) {
  const router = useRouter();

  const stats = useMemo(() => {
    let inBearbeitung = 0;
    let erledigt = 0;
    let ueberfaellig = 0;

    for (const a of aufgaben) {
      if (a.status === "erledigt") erledigt++;
      else if (a.status === "in_bearbeitung") inBearbeitung++;

      if (a.status !== "erledigt" && a.faelligkeit && tageBisFaelligkeit(a.faelligkeit) < 0) {
        ueberfaellig++;
      }
    }

    return { gesamt: aufgaben.length, inBearbeitung, erledigt, ueberfaellig };
  }, [aufgaben]);

  const prioritaetVerteilung = useMemo(() => {
    const zaehler: Record<Prioritaet, number> = { hoch: 0, normal: 0, niedrig: 0 };
    for (const a of aufgaben) {
      if (a.prioritaet && a.status !== "erledigt") zaehler[a.prioritaet]++;
    }
    return zaehler;
  }, [aufgaben]);

  const faelligeAufgaben = useMemo(() => {
    return aufgaben
      .filter((a) => a.status !== "erledigt" && a.faelligkeit)
      .map((a) => ({ aufgabe: a, diffTage: tageBisFaelligkeit(a.faelligkeit as string) }))
      .sort((a, b) => a.diffTage - b.diffTage)
      .slice(0, 5);
  }, [aufgaben]);

  const letzteNotizen = useMemo(() => notizen.slice(0, 3), [notizen]);

  const gesamtPrioritaet = prioritaetVerteilung.hoch + prioritaetVerteilung.normal + prioritaetVerteilung.niedrig;

  return (
    <div>
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="rounded-[12px] border border-[#e2e8f0] p-4">
          <div className="text-[13px] text-[#64748b]">Gesamt</div>
          <div className="mt-1 text-[24px] font-semibold">{stats.gesamt}</div>
        </div>
        <div className="rounded-[12px] border border-[#e2e8f0] p-4">
          <div className="text-[13px] text-[#64748b]">In Bearbeitung</div>
          <div className="mt-1 text-[24px] font-semibold">{stats.inBearbeitung}</div>
        </div>
        <div className="rounded-[12px] border border-[#e2e8f0] p-4">
          <div className="text-[13px] text-[#64748b]">Erledigt</div>
          <div className="mt-1 text-[24px] font-semibold">{stats.erledigt}</div>
        </div>
        <div className="rounded-[12px] border border-red-100 bg-red-50 p-4">
          <div className="text-[13px] text-red-600">Überfällig</div>
          <div className="mt-1 text-[24px] font-semibold text-red-600">{stats.ueberfaellig}</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-[12px] border border-[#e2e8f0] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[14px] font-semibold">Fällige Aufgaben</div>
            <button
              onClick={() => onTabWechseln("liste")}
              className="text-[12px] text-[#2563eb] hover:underline"
            >
              Alle anzeigen →
            </button>
          </div>
          <div className="flex flex-col">
            {faelligeAufgaben.length === 0 && (
              <div className="py-4 text-center text-[12.5px] text-[#64748b]">
                Keine offenen Aufgaben mit Fälligkeit.
              </div>
            )}
            {faelligeAufgaben.map(({ aufgabe, diffTage }) => {
              const badge = faelligkeitBadge(diffTage);
              return (
                <button
                  key={aufgabe.id}
                  onClick={() => router.push(`/aufgaben/${aufgabe.id}`)}
                  className="flex items-center justify-between border-b border-[#e2e8f0] py-2.5 text-left last:border-b-0 hover:bg-[#f8fafc]"
                >
                  <span className="truncate text-[13.5px]">{aufgabe.titel}</span>
                  <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.farbe}`}>
                    {badge.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[12px] border border-[#e2e8f0] p-4">
          <div className="mb-3 text-[14px] font-semibold">Nach Priorität</div>
          <div className="flex flex-col gap-2.5">
            {(Object.keys(PRIORITAET_LABEL) as Prioritaet[]).map((p) => {
              const anzahl = prioritaetVerteilung[p];
              const breite = gesamtPrioritaet > 0 ? (anzahl / gesamtPrioritaet) * 100 : 0;
              return (
                <div key={p}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${PRIORITAET_PUNKT_FARBE[p]}`} />
                      {PRIORITAET_LABEL[p]}
                    </span>
                    <span className="text-[#64748b]">{anzahl}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${PRIORITAET_PUNKT_FARBE[p]}`}
                      style={{ width: `${breite}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {gesamtPrioritaet === 0 && (
              <div className="py-2 text-center text-[12.5px] text-[#64748b]">
                Keine offenen Aufgaben mit Priorität.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-[#e2e8f0] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[14px] font-semibold">Letzte Notizen</div>
          <button
            onClick={() => onTabWechseln("notizen")}
            className="text-[12px] text-[#2563eb] hover:underline"
          >
            Alle anzeigen →
          </button>
        </div>
        {letzteNotizen.length === 0 ? (
          <div className="py-4 text-center text-[12.5px] text-[#64748b]">Noch keine Notizen.</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {letzteNotizen.map((n) => (
              <button
                key={n.id}
                onClick={() => onTabWechseln("notizen")}
                className="rounded-[8px] border border-[#e2e8f0] p-3 text-left hover:bg-[#f8fafc]"
              >
                <div className="mb-1 truncate text-[13px] font-medium">{n.titel}</div>
                <div
                  className="text-[12px] text-[#64748b]"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {n.text}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
