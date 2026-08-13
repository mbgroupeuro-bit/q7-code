// app/input/PosteingangClient.tsx (Client Component)
// Neu 05.08.2026 — Kanal-Tabs + Detail-/Antwort-Panel laut Konzept Abschnitt 5
// Design-Tokens: Navy #1B2A56 (Sidebar/aktiv), #0F1A38 (Text/Headlines), Gold #D4A72C (Akzent)
// V1: Antwort wird in AufgabeChat gespeichert. Echter Kanal-Versand (WhatsApp/Telegram/
// Facebook/Mail-Ausgang) ist noch nicht angebunden — Connectoren folgen erst bei Bedarf
// ("Kein Monster züchten"). Team-Nachrichten bleiben ohnehin intern in Q7.

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Users,
  Mail,
  MessageCircle,
  Send,
  Globe,
  Loader2,
} from "lucide-react";
import VerlegenButton from "./VerlegenButton";

export type ChatEintrag = {
  id: number;
  absender: string; // "admin" | "agent" | "hermes"
  nachricht: string;
  zeitstempel: string; // ISO
};

export type AufgabeItem = {
  id: string;
  kanal: string;
  absender: string;
  zeitstempel: string; // ISO
  inhalt: string;
  status: string;
  anliegen_typ: string | null;
  konfidenz: string | null;
  chats: ChatEintrag[];
};

const STATUS_LABEL: Record<string, { label: string; farbe: string }> = {
  OFFEN: { label: "Offen", farbe: "bg-red-100 text-red-700" },
  IN_BEARBEITUNG: { label: "In Bearbeitung", farbe: "bg-blue-100 text-blue-700" },
  RUECKFRAGE_ADMIN: { label: "Rückfrage Admin", farbe: "bg-amber-100 text-amber-700" },
  GEPRUEFT_HERMES: { label: "Geprüft", farbe: "bg-blue-100 text-blue-700" },
  ANGEPASST_ADMIN: { label: "Angepasst", farbe: "bg-amber-100 text-amber-700" },
  FREIGEGEBEN_ADMIN: { label: "Freigegeben", farbe: "bg-green-100 text-green-700" },
  ABGELEHNT: { label: "Abgelehnt", farbe: "bg-slate-200 text-slate-700" },
};

const KONFIDENZ_ICON: Record<string, string> = {
  gruen: "🟢",
  gelb: "🟡",
  rot: "🔴",
};

const KANAL_LABEL: Record<string, string> = {
  team: "Team",
  email: "Mail",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  facebook: "Facebook",
};

const TABS = [
  { key: "alle", label: "Alle", icon: LayoutGrid },
  { key: "team", label: "Team", icon: Users },
  { key: "email", label: "Mail", icon: Mail },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "telegram", label: "Telegram", icon: Send },
  { key: "facebook", label: "Facebook", icon: Globe },
] as const;

function formatZeitstempel(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatUhrzeit(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function PosteingangClient({ aufgaben }: { aufgaben: AufgabeItem[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("alle");
  const [selectedId, setSelectedId] = useState<string | null>(aufgaben[0]?.id ?? null);
  const [entwurf, setEntwurf] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sendeFehler, setSendeFehler] = useState<string | null>(null);

  const gefiltert = useMemo(
    () => (activeTab === "alle" ? aufgaben : aufgaben.filter((a) => a.kanal === activeTab)),
    [aufgaben, activeTab]
  );

  const anzahlProTab = useMemo(() => {
    const map: Record<string, number> = { alle: aufgaben.length };
    for (const tab of TABS) {
      if (tab.key === "alle") continue;
      map[tab.key] = aufgaben.filter((a) => a.kanal === tab.key).length;
    }
    return map;
  }, [aufgaben]);

  // Beim Tab-Wechsel: falls die aktuelle Auswahl im gefilterten Set nicht mehr
  // existiert, erste sichtbare Aufgabe auswählen.
  useEffect(() => {
    if (!gefiltert.find((a) => a.id === selectedId)) {
      setSelectedId(gefiltert[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const ausgewaehlt = gefiltert.find((a) => a.id === selectedId) ?? null;

  async function antwortSenden() {
    if (!ausgewaehlt || !entwurf.trim()) return;
    setSendeFehler(null);
    const text = entwurf.trim();
    try {
      const res = await fetch("/api/aufgabe-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aufgabe_id: ausgewaehlt.id, nachricht: text }),
      });
      if (!res.ok) throw new Error("Antwort konnte nicht gespeichert werden.");
      setEntwurf("");
      startTransition(() => router.refresh());
    } catch (err) {
      setSendeFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden p-6">
      {/* Kopfzeile */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-navy-dark">Posteingang</h2>
          <div className="mt-1">
            <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11.5px] font-semibold text-navy-dark">
              {aufgaben.length} Eingänge
            </span>
          </div>
        </div>
      </div>

      {/* Kanal-Tabs */}
      <div className="mb-4 flex gap-1 border-b border-neutral-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const aktiv = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                aktiv ? "border-gold text-navy" : "border-transparent text-neutral-500 hover:text-navy"
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold ${
                  aktiv ? "bg-gold/15 text-navy-dark" : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {anzahlProTab[tab.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste + Detailpanel */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Liste links */}
        <div className="flex w-full max-w-sm flex-shrink-0 flex-col overflow-y-auto rounded-[12px] border border-neutral-200">
          {gefiltert.length === 0 && (
            <div className="p-6 text-center text-[13px] text-neutral-400">
              Keine Nachrichten in diesem Kanal.
            </div>
          )}
          {gefiltert.map((a) => {
            const aktiv = a.id === selectedId;
            const status = STATUS_LABEL[a.status] ?? { label: a.status, farbe: "bg-slate-100 text-slate-700" };
            return (
              <div
                key={a.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(a.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedId(a.id);
                }}
                className={`group relative w-full cursor-pointer border-b border-neutral-200 px-4 py-3 text-left last:border-b-0 ${
                  aktiv ? "bg-gold/10" : "bg-transparent"
                }`}
              >
                {aktiv && <span className="absolute left-0 top-0 h-full w-[3px] bg-gold" />}
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-navy-dark">{a.absender}</span>
                  <span className="flex-shrink-0 text-[11px] text-neutral-400">
                    {formatUhrzeit(a.zeitstempel)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-neutral-500">{a.inhalt}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                    {KANAL_LABEL[a.kanal] ?? a.kanal}
                  </span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${status.farbe}`}>
                    {status.label}
                  </span>
                  {a.konfidenz && <span className="text-[11px]">{KONFIDENZ_ICON[a.konfidenz] ?? a.konfidenz}</span>}
                  <span
                    className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <VerlegenButton aufgabeId={a.id} variant="icon" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail-/Antwortpanel rechts */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-[12px] border border-neutral-200">
          {!ausgewaehlt && (
            <div className="flex flex-1 items-center justify-center text-[13.5px] text-neutral-400">
              Wähle eine Nachricht aus der Liste.
            </div>
          )}

          {ausgewaehlt && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                <div>
                  <div className="text-[14.5px] font-semibold text-navy-dark">{ausgewaehlt.absender}</div>
                  <div className="text-[12px] text-neutral-500">
                    via {KANAL_LABEL[ausgewaehlt.kanal] ?? ausgewaehlt.kanal}
                    {ausgewaehlt.anliegen_typ ? ` · ${ausgewaehlt.anliegen_typ}` : ""}
                  </div>
                </div>
                <VerlegenButton aufgabeId={ausgewaehlt.id} variant="text" />
              </div>

              {/* Chat-Verlauf */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {/* Ursprüngliche Nachricht als erste Bubble */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-[10px] bg-neutral-100 px-3.5 py-2.5">
                    <p className="text-[13.5px] text-navy-dark">{ausgewaehlt.inhalt}</p>
                    <span className="mt-1 block text-[10.5px] text-neutral-400">
                      {formatZeitstempel(ausgewaehlt.zeitstempel)}
                    </span>
                  </div>
                </div>

                {ausgewaehlt.chats.map((c) => {
                  const istAdmin = c.absender === "admin";
                  return (
                    <div key={c.id} className={`flex ${istAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-[10px] px-3.5 py-2.5 ${
                          istAdmin ? "bg-navy text-white" : "bg-neutral-100 text-navy-dark"
                        }`}
                      >
                        <p className="text-[13.5px]">{c.nachricht}</p>
                        <span className={`mt-1 block text-[10.5px] ${istAdmin ? "text-white/60" : "text-neutral-400"}`}>
                          {c.absender === "admin" ? "Admin" : c.absender === "agent" ? "Agent" : "A01"} ·{" "}
                          {formatZeitstempel(c.zeitstempel)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Antwortfeld */}
              <div className="border-t border-neutral-200 p-3">
                {ausgewaehlt.kanal !== "team" && (
                  <p className="mb-1.5 text-[11px] text-neutral-400">
                    Versand-Connector für {KANAL_LABEL[ausgewaehlt.kanal] ?? ausgewaehlt.kanal} noch nicht
                    aktiv — Antwort wird intern gespeichert.
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={entwurf}
                    onChange={(e) => setEntwurf(e.target.value)}
                    placeholder="Antwort schreiben ..."
                    rows={2}
                    className="flex-1 resize-none rounded-[8px] border border-neutral-200 px-3 py-2 text-[13.5px] outline-none focus:border-gold"
                  />
                  <button
                    onClick={antwortSenden}
                    disabled={isPending || !entwurf.trim()}
                    className="flex items-center gap-1.5 rounded-[8px] bg-navy px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    {isPending && <Loader2 size={14} className="animate-spin" />}
                    Senden
                  </button>
                </div>
                {sendeFehler && <p className="mt-1.5 text-[11.5px] text-red-600">{sendeFehler}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
