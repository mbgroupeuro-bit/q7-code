// Basismodul "Meine Aufgaben" — Kalender-Ansicht (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\AufgabenKalender.tsx
//
// Neu (04.09.2026): Einfacher Monatskalender. Aufgaben werden an ihrem
// Fälligkeitsdatum (faelligkeit) eingeblendet. Aufgaben ohne Fälligkeit
// erscheinen hier nicht (dafür gibt's die Liste/Übersicht). Bewusst ohne
// externe Kalender-Bibliothek gebaut, um keine neue Abhängigkeit
// einzuführen — reines Grid mit Date-Arithmetik.
//
// Geändert 13.09.2026 (Kalender-Fixes-Session, 1): eigenes "+ Neue
// Aufgabe"-Formular wieder entfernt — ersetzt durch den gemeinsamen
// EintragDialog (Termin/Aufgabe-Tabs), Absprache mit Mokid. mitarbeiter/
// bereiche-Props ergänzt, die der Dialog für den Termin-Tab braucht.

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MeineAufgabe, Prioritaet } from "@/lib/aufgaben-interface";
import EintragDialog from "@/lib/verdrahtung/EintragDialog";

type Bereich = { id: string; name: string };
type MitarbeiterKontext = {
  id: string;
  bereich_id: string;
  bereich_name: string;
  sieht_alle_bereiche: boolean;
};

const PRIORITAET_FARBE: Record<Prioritaet, string> = {
  hoch: "bg-red-100 text-red-700",
  normal: "bg-blue-100 text-blue-700",
  niedrig: "bg-slate-100 text-slate-600",
};

const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function istGleicherTag(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function AufgabenKalender({
  aufgaben,
  mitarbeiter,
  bereiche,
}: {
  aufgaben: MeineAufgabe[];
  mitarbeiter: MitarbeiterKontext | null;
  bereiche: Bereich[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [monatsAnker, setMonatsAnker] = useState(() => {
    const heute = new Date();
    return new Date(heute.getFullYear(), heute.getMonth(), 1);
  });
  const [dialogOffen, setDialogOffen] = useState(false);

  const heute = new Date();

  const tage = useMemo(() => {
    const jahr = monatsAnker.getFullYear();
    const monat = monatsAnker.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const letzterTag = new Date(jahr, monat + 1, 0);

    // Montag = 0 statt JS-Standard Sonntag = 0, damit die Woche wie gewohnt
    // (Mo-So) beginnt.
    const vorlauf = (ersterTag.getDay() + 6) % 7;

    const liste: (Date | null)[] = [];
    for (let i = 0; i < vorlauf; i++) liste.push(null);
    for (let tag = 1; tag <= letzterTag.getDate(); tag++) {
      liste.push(new Date(jahr, monat, tag));
    }
    while (liste.length % 7 !== 0) liste.push(null);

    return liste;
  }, [monatsAnker]);

  const aufgabenProTag = useMemo(() => {
    const map = new Map<string, MeineAufgabe[]>();
    for (const a of aufgaben) {
      if (!a.faelligkeit) continue;
      const d = new Date(a.faelligkeit);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const liste = map.get(key) ?? [];
      liste.push(a);
      map.set(key, liste);
    }
    return map;
  }, [aufgaben]);

  function aufgabenFuerTag(tag: Date): MeineAufgabe[] {
    const key = `${tag.getFullYear()}-${tag.getMonth()}-${tag.getDate()}`;
    return aufgabenProTag.get(key) ?? [];
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[15px] font-semibold">
          {new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(monatsAnker)}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setMonatsAnker(new Date(monatsAnker.getFullYear(), monatsAnker.getMonth() - 1, 1))}
            className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1 text-[13px] hover:bg-[#f8fafc]"
          >
            ←
          </button>
          <button
            onClick={() => setMonatsAnker(new Date(heute.getFullYear(), heute.getMonth(), 1))}
            className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1 text-[12.5px] hover:bg-[#f8fafc]"
          >
            Heute
          </button>
          <button
            onClick={() => setMonatsAnker(new Date(monatsAnker.getFullYear(), monatsAnker.getMonth() + 1, 1))}
            className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1 text-[13px] hover:bg-[#f8fafc]"
          >
            →
          </button>
          <button
            onClick={() => setDialogOffen(true)}
            className="rounded-[6px] bg-[#2563eb] px-3 py-1 text-[13px] font-medium text-white hover:opacity-90"
          >
            + Neuer Eintrag
          </button>
        </div>
      </div>

      <EintragDialog
        offen={dialogOffen}
        onClose={() => setDialogOffen(false)}
        onGespeichert={() => startTransition(() => router.refresh())}
        standardTab="aufgabe"
        mitarbeiter={mitarbeiter}
        bereiche={bereiche}
      />

      <div className="grid grid-cols-7 overflow-hidden rounded-[12px] border border-[#e2e8f0]">
        {WOCHENTAGE.map((w) => (
          <div
            key={w}
            className="border-b border-[#e2e8f0] bg-slate-50 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748b]"
          >
            {w}
          </div>
        ))}

        {tage.map((tag, i) => {
          if (!tag) {
            return <div key={i} className="min-h-[92px] border-b border-r border-[#e2e8f0] bg-slate-50/40" />;
          }
          const eintraege = aufgabenFuerTag(tag);
          const istHeute = istGleicherTag(tag, heute);

          return (
            <div key={i} className="min-h-[92px] border-b border-r border-[#e2e8f0] p-1.5">
              <div
                className={`mb-1 inline-flex h-[20px] w-[20px] items-center justify-center rounded-full text-[11.5px] ${
                  istHeute ? "bg-[#2563eb] font-semibold text-white" : "text-[#64748b]"
                }`}
              >
                {tag.getDate()}
              </div>
              <div className="flex flex-col gap-1">
                {eintraege.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => router.push(`/aufgaben/${a.id}`)}
                    className={`truncate rounded-[4px] px-1.5 py-0.5 text-left text-[10.5px] font-medium ${
                      a.prioritaet ? PRIORITAET_FARBE[a.prioritaet] : "bg-slate-100 text-slate-600"
                    }`}
                    title={a.titel}
                  >
                    {a.titel}
                  </button>
                ))}
                {eintraege.length > 3 && (
                  <div className="px-1.5 text-[10.5px] text-[#94a3b8]">+{eintraege.length - 3} weitere</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
