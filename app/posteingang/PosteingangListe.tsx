// D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\posteingang\PosteingangListe.tsx (Client Component)
//
// Interaktion für die Posteingang-Standardansicht: Kanal-Tabs, chronologische
// Liste links, Detailansicht rechts mit Original-Nachricht und Antwortfeld.
// Design orientiert sich 1:1 am bestehenden Q7-Screenshot.
//
// ANNAHME (bitte prüfen): Die Status-Werte im Schema (OFFEN | IN_BEARBEITUNG |
// GEPRUEFT_HERMES | ANGEPASST_ADMIN | FREIGEGEBEN_ADMIN | ABGELEHNT) stimmen
// nicht 1:1 mit den im Screenshot sichtbaren Badges ("Offen", "In Bearbeitung",
// "Rückfrage Admin") überein. Da ich nichts raten wollte, zeige ich hier den
// rohen Status-Wert lesbar formatiert an (Unterstriche entfernt, erster
// Buchstabe groß) statt eine erfundene 1:1-Zuordnung zu "Rückfrage Admin"
// vorzunehmen. Falls "Rückfrage Admin" ein eigener, noch fehlender Status-
// Wert sein soll, bitte Bescheid geben — leicht ergänzbar.
//
// E-Mail-Inhalte können als rohes HTML gespeichert sein (inkl. Outlook-/MSO-
// Kommentaren wie <!--[if mso]-->, VML-Tags usw.). Damit in der Liste/
// Detailansicht lesbarer Text statt Code-Müll erscheint, wird `inhalt` vor
// der Anzeige durch `htmlZuText()` bereinigt. Das ist eine reine Anzeige-
// Bereinigung — der Original-Wert in der Datenbank bleibt unverändert.
//
// Änderung (04.09.2026): htmlZuText() nach lib/htmlZuText.ts ausgelagert,
// damit auch lib/posteingang/adapters/prisma-adapter.ts (verlegeZuMeineAufgabe)
// dieselbe Bereinigung nutzen kann, statt sie zu duplizieren.

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PosteingangChatEintrag, PosteingangEintrag } from "@/lib/posteingang/types";
import { htmlZuText } from "@/lib/htmlZuText";

type Props = {
  initialEintraege: PosteingangEintrag[];
  kanaele: readonly string[];
  kanalLabel: Record<string, string>;
  anzahlProKanal: Record<string, number>;
};

function formatUhrzeit(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((teil) => teil.charAt(0).toUpperCase() + teil.slice(1))
    .join(" ");
}

function statusFarbe(status: string): string {
  if (status === "OFFEN") return "bg-red-100 text-red-700";
  if (status === "FREIGEGEBEN_ADMIN" || status === "GEPRUEFT_HERMES") return "bg-green-100 text-green-700";
  if (status === "ABGELEHNT") return "bg-slate-100 text-slate-600";
  return "bg-blue-100 text-blue-700"; // IN_BEARBEITUNG, ANGEPASST_ADMIN
}

function eintragAlsChatText(e: PosteingangEintrag, kanalLabel: Record<string, string>): string {
  const zeilen = [`Posteingang von: ${e.absender}`, `Kanal: ${kanalLabel[e.kanal] ?? e.kanal}`];
  if (e.anliegen_typ) zeilen.push(`Anliegen: ${e.anliegen_typ}`);
  zeilen.push("", htmlZuText(e.inhalt), "", `Status: ${formatStatusLabel(e.status)}`);
  return zeilen.join("\n");
}

export default function PosteingangListe({
  initialEintraege,
  kanaele,
  kanalLabel,
  anzahlProKanal,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [aktiverKanal, setAktiverKanal] = useState<"alle" | string>("alle");
  const [ausgewaehlteId, setAusgewaehlteId] = useState<string | null>(
    initialEintraege[0]?.id ?? null
  );
  const [chats, setChats] = useState<PosteingangChatEintrag[]>([]);
  const [antwortText, setAntwortText] = useState("");
  const [chatsLaden, setChatsLaden] = useState(false);

  const gefilterte = useMemo(
    () =>
      aktiverKanal === "alle"
        ? initialEintraege
        : initialEintraege.filter((e) => e.kanal === aktiverKanal),
    [initialEintraege, aktiverKanal]
  );

  const ausgewaehlt = initialEintraege.find((e) => e.id === ausgewaehlteId) ?? null;

  async function eintragAuswaehlen(id: string) {
    setAusgewaehlteId(id);
    setChatsLaden(true);
    try {
      const res = await fetch(`/api/posteingang/${id}`);
      const data = await res.json();
      setChats(data.chats ?? []);
    } finally {
      setChatsLaden(false);
    }
  }

  async function antwortSenden() {
    if (!ausgewaehlt || !antwortText.trim()) return;
    const nachricht = antwortText.trim();

    await fetch(`/api/posteingang/${ausgewaehlt.id}/antwort`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nachricht }),
    });

    setAntwortText("");
    await eintragAuswaehlen(ausgewaehlt.id);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1 border-b border-[#e2e8f0]">
        <button
          onClick={() => setAktiverKanal("alle")}
          className={`flex items-center gap-1.5 rounded-t-[8px] px-3.5 py-2 text-[13.5px] font-medium ${
            aktiverKanal === "alle"
              ? "border-b-2 border-[#2563eb] text-[#2563eb]"
              : "text-[#64748b] hover:text-[#0f172a]"
          }`}
        >
          Alle
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px]">
            {anzahlProKanal.alle}
          </span>
        </button>
        {kanaele.map((kanal) => (
          <button
            key={kanal}
            onClick={() => setAktiverKanal(kanal)}
            className={`flex items-center gap-1.5 rounded-t-[8px] px-3.5 py-2 text-[13.5px] font-medium ${
              aktiverKanal === kanal
                ? "border-b-2 border-[#2563eb] text-[#2563eb]"
                : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            {kanalLabel[kanal] ?? kanal}
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px]">
              {anzahlProKanal[kanal] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex overflow-hidden rounded-[12px] border border-[#e2e8f0]" style={{ height: 640 }}>
        {/* Liste links */}
        <div className="w-[340px] overflow-y-auto border-r border-[#e2e8f0]">
          {gefilterte.length === 0 && (
            <div className="p-6 text-center text-[13px] text-[#64748b]">Keine Einträge.</div>
          )}
          {gefilterte.map((e) => (
            <button
              key={e.id}
              onClick={() => eintragAuswaehlen(e.id)}
              className={`block w-full border-b border-[#e2e8f0] p-3.5 text-left ${
                e.id === ausgewaehlteId ? "bg-amber-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold">{e.absender}</span>
                <span className="whitespace-nowrap text-[11.5px] text-[#94a3b8]">
                  {formatUhrzeit(e.zeitstempel)}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-[#64748b]">{htmlZuText(e.inhalt)}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="rounded-[4px] bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                  {kanalLabel[e.kanal] ?? e.kanal}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusFarbe(e.status)}`}>
                  {formatStatusLabel(e.status)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail rechts */}
        <div className="flex flex-1 flex-col">
          {!ausgewaehlt ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#64748b]">
              Kein Eintrag ausgewählt.
            </div>
          ) : (
            <>
              <div className="border-b border-[#e2e8f0] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{ausgewaehlt.absender}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#94a3b8]">
                      via {kanalLabel[ausgewaehlt.kanal] ?? ausgewaehlt.kanal}
                      {ausgewaehlt.anliegen_typ ? ` · ${ausgewaehlt.anliegen_typ}` : ""}
                    </span>
                    <button
                      onClick={() =>
                        router.push(
                          `/chat?vorlage=${encodeURIComponent(eintragAlsChatText(ausgewaehlt, kanalLabel))}`
                        )
                      }
                      aria-label="Im Chat weiterleiten"
                      title="Im Chat weiterleiten"
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-[#e2e8f0] text-[13px] hover:bg-[#f8fafc]"
                    >
                      💬
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="rounded-[10px] bg-slate-50 p-3.5">
                  <div className="whitespace-pre-wrap">{htmlZuText(ausgewaehlt.inhalt)}</div>
                  <div className="mt-1.5 text-[11.5px] text-[#94a3b8]">
                    {new Intl.DateTimeFormat("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(ausgewaehlt.zeitstempel))}
                  </div>
                </div>

                {chatsLaden && <div className="mt-3 text-[12px] text-[#64748b]">Lädt…</div>}

                {!chatsLaden &&
                  chats.map((c) => (
                    <div key={c.id} className="mt-3 rounded-[10px] border border-[#e2e8f0] p-3.5">
                      <div className="mb-1 text-[11.5px] font-semibold text-[#64748b]">{c.absender}</div>
                      <div>{c.nachricht}</div>
                    </div>
                  ))}
              </div>

              <div className="border-t border-[#e2e8f0] p-4">
                <div className="mb-2 text-[12px] text-[#94a3b8]">
                  Versand-Connector für {kanalLabel[ausgewaehlt.kanal] ?? ausgewaehlt.kanal} noch nicht aktiv —
                  Antwort wird intern gespeichert.
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={antwortText}
                    onChange={(e) => setAntwortText(e.target.value)}
                    placeholder="Antwort schreiben …"
                    rows={2}
                    className="flex-1 rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
                  />
                  <button
                    onClick={antwortSenden}
                    disabled={!antwortText.trim() || isPending}
                    className="rounded-[8px] bg-[#64748b] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Senden
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
