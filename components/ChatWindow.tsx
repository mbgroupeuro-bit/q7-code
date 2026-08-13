"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, GitCompare } from "lucide-react";
import SpaceSelector from "@/components/SpaceSelector";
import FileUpload from "@/components/FileUpload";
import { ChatMessage, SPACES, AGENTS, UploadedFile } from "@/lib/types";
import { useAppState } from "@/lib/store";

const WILLKOMMENS_NACHRICHT: ChatMessage = {
  id: "welcome",
  role: "agent",
  label: "Hermes · A01",
  text: "Willkommen bei Q7. Wie kann ich dir heute helfen?",
};

export default function ChatWindow() {
  const searchParams = useSearchParams();
  const {
    logAktion,
    protokoll,
    chats,
    activeChatId,
    createChat,
    addMessage,
    setChatMessages,
    addUpload,
    getActiveChat,
    clearActiveChat,
    holeHermesTitel,
  } = useAppState();
  const agentFromUrl = searchParams.get("agent");
  const toolFromUrl = searchParams.get("tool");
  const messageFromUrl = searchParams.get("message");

  const [agent, setAgent] = useState(agentFromUrl ?? "A01 Planung & Vorbereitung (Hermes)");
  const [space, setSpace] = useState("Kein Space");
  const [vergleichsModus, setVergleichsModus] = useState(false);
  const [draft, setDraft] = useState(messageFromUrl ?? "");
  const [anhaenge, setAnhaenge] = useState<UploadedFile[]>([]);
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const aktiverChat = getActiveChat();

  const messages: ChatMessage[] = aktiverChat
    ? aktiverChat.messages
    : toolFromUrl
    ? [
        {
          id: "welcome",
          role: "agent",
          label: (agentFromUrl ?? "A01 Planung & Vorbereitung (Hermes)").replace(" ", " · "),
          text: `Werkzeug „${toolFromUrl}“ ist bereit. Die Angaben stehen im Eingabefeld — prüfen und senden.`,
        },
      ]
    : [WILLKOMMENS_NACHRICHT];

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!toolFromUrl) return;
    clearActiveChat();
    setAgent(agentFromUrl ?? "A01 Planung & Vorbereitung (Hermes)");
    setSpace("Kein Space");
    setDraft(messageFromUrl ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function systemNachricht(text: string) {
    const nachricht: ChatMessage = { id: crypto.randomUUID(), role: "agent", label: "System", text };
    if (activeChatId) {
      addMessage(activeChatId, nachricht);
    } else {
      createChat(agent, space !== "Kein Space" ? space : undefined, nachricht);
    }
  }

  function verarbeiteSlashBefehl(eingabe: string): boolean {
    if (!eingabe.startsWith("/")) return false;

    const [befehlRoh, ...rest] = eingabe.trim().split(" ");
    const befehl = befehlRoh.toLowerCase();
    const argument = rest.join(" ").trim();

    const userNachricht: ChatMessage = { id: crypto.randomUUID(), role: "user", label: "Admin", text: eingabe };
    let chatId = activeChatId;
    if (chatId) {
      addMessage(chatId, userNachricht);
    } else {
      chatId = createChat(agent, space !== "Kein Space" ? space : undefined, userNachricht);
    }

    switch (befehl) {
      case "/space": {
        const gefunden =
          argument.toLowerCase() === "kein space"
            ? "Kein Space"
            : SPACES.find((s) => s.name.toLowerCase() === argument.toLowerCase())?.name;
        if (gefunden) {
          setSpace(gefunden);
          systemNachricht(`Space gewechselt zu „${gefunden}“.`);
          logAktion("Admin", `/space → ${gefunden}`);
        } else {
          systemNachricht(
            `Space „${argument}“ nicht gefunden. Verfügbar: ${SPACES.map((s) => s.name).join(", ")}.`
          );
        }
        return true;
      }
      case "/agent": {
        const gefunden = AGENTS.find(
          (a) => a.aktiv && a.kuerzel.toLowerCase() === argument.toLowerCase()
        );
        if (gefunden) {
          const label = `${gefunden.kuerzel} ${gefunden.name}`;
          setAgent(label);
          systemNachricht(`Agent gewechselt zu ${label}.`);
          logAktion("Admin", `/agent → ${label}`);
        } else {
          const aktive = AGENTS.filter((a) => a.aktiv).map((a) => a.kuerzel).join(", ");
          systemNachricht(`Agent „${argument}“ nicht verfügbar. Aktiv: ${aktive}.`);
        }
        return true;
      }
      case "/status": {
        systemNachricht(`Space: ${space} · Agent: ${agent} · Vergleichsmodus: ${vergleichsModus ? "an" : "aus"}`);
        return true;
      }
      case "/protokoll": {
        const letzte = protokoll.slice(0, 5);
        const text = letzte.length
          ? letzte.map((p) => `• ${p.zeitstempel} — ${p.akteur}: ${p.aktion}`).join("\n")
          : "Noch keine Protokoll-Einträge.";
        systemNachricht(`Letzte 5 Protokoll-Einträge:\n${text}`);
        return true;
      }
      case "/neu": {
        createChat(agent, space !== "Kein Space" ? space : undefined, {
          id: "welcome",
          role: "agent",
          label: agent.replace(" ", " · "),
          text: "Neuer Chat-Kontext. Wie kann ich dir helfen?",
        });
        logAktion("Admin", "/neu — Session zurückgesetzt");
        return true;
      }
      case "/rückgängig": {
        if (chatId) {
          const aktuell = chats.find((c) => c.id === chatId)?.messages ?? [];
          const ohneBefehl = aktuell.slice(0, -1);
          setChatMessages(chatId, ohneBefehl.slice(0, Math.max(0, ohneBefehl.length - 2)));
        }
        logAktion("Admin", "/rückgängig — letzte Aktion widerrufen");
        return true;
      }
      case "/verdichten": {
        if (chatId) {
          const aktuell = chats.find((c) => c.id === chatId)?.messages ?? [];
          const nutzerNachrichten = aktuell.filter((m) => m.role === "user" && !m.text.startsWith("/"));
          const kurzfassung = nutzerNachrichten
            .map((m) => `– ${m.text.slice(0, 60)}${m.text.length > 60 ? "…" : ""}`)
            .join("\n");
          setChatMessages(chatId, [
            {
              id: crypto.randomUUID(),
              role: "agent",
              label: "System",
              text: `Session komprimiert. Bisherige Anfragen:\n${kurzfassung || "(keine)"}`,
            },
          ]);
        }
        logAktion("Admin", "/verdichten — Kontext komprimiert");
        return true;
      }
      case "/vorschlag": {
        systemNachricht(
          "Dieser Befehl ist für Agenten reserviert (Skill-Vorschläge werden von Agenten selbst eingereicht, nicht vom Admin)."
        );
        return true;
      }
      default: {
        systemNachricht(
          `Unbekannter Befehl „${befehl}“. Verfügbar: /space, /agent, /status, /protokoll, /neu, /rückgängig, /verdichten.`
        );
        return true;
      }
    }
  }

  async function send() {
    const text = draft.trim();

    if (!text || sending) return;

    if (verarbeiteSlashBefehl(text)) {
      setDraft("");
      return;
    }

    const anhangText = anhaenge.length
      ? `\n\n📎 ${anhaenge.map((a) => a.name).join(", ")}`
      : "";
    const anhangIds = anhaenge.map((a) => a.id);
    const userNachricht: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      label: "Admin",
      text: text + anhangText,
    };
    anhaenge.forEach((a) => addUpload(a));
    setAnhaenge([]);
    
    let chatId = activeChatId;
    const istNeuerChat = !chatId;

    if (chatId) {
      addMessage(chatId, userNachricht);
    } else {
      chatId = createChat(agent, space !== "Kein Space" ? space : undefined, userNachricht);
    }
    
    setDraft("");
    setSending(true);

    if (vergleichsModus) {
      logAktion("Admin", "Modell-Vergleich gestartet", space !== "Kein Space" ? space : undefined);
      try {
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent, space, message: text }),
        });
        const data = await res.json();

        if (data.error) {
          addMessage(chatId, { id: crypto.randomUUID(), role: "agent", label: "System", text: data.error });
        } else {
          addMessage(chatId, {
            id: crypto.randomUUID(),
            role: "agent",
            label: `Vergleich · ${data.agentLabel}`,
            text: "",
            vergleich: data.ergebnisse,
          });
          const gesamtkosten = data.ergebnisse.reduce(
            (summe: number, e: { usage?: { kostenUsd: number | null } }) =>
              summe + (e.usage?.kostenUsd ?? 0),
            0
          );
          logAktion(
            "System",
            `Vergleich abgeschlossen – ${data.ergebnisse.length} Modelle (~$${gesamtkosten.toFixed(4)} gesamt)`,
            space !== "Kein Space" ? space : undefined
          );
        }
      } catch {
        addMessage(chatId, {
          id: crypto.randomUUID(),
          role: "agent",
          label: "System",
          text: "Fehler: Vergleich fehlgeschlagen.",
        });
      } finally {
        setSending(false);
      }
      return;
    }

    logAktion("Admin", "Chat gestartet", space !== "Kein Space" ? space : undefined);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, space, message: text, anhangIds }),
      });

      if (!res.ok) throw new Error("Antwort fehlgeschlagen");
      const data = await res.json();

      addMessage(chatId, {
        id: crypto.randomUUID(),
        role: "agent",
        label: data.agentLabel ?? agent.replace(" ", " · "),
        text: data.reply,
        usage: data.usage ?? undefined,
      });

      // Nach erfolgreicher Hauptantwort wird der Titel sequenziell angefragt
      if (istNeuerChat && chatId) {
        holeHermesTitel(chatId, text);
      }

      if (data.usage) {
        const kosten =
          typeof data.usage.kostenUsd === "number" ? ` (~$${data.usage.kostenUsd.toFixed(4)})` : "";
        logAktion(
          data.agentLabel ?? agent,
          `Antwort erhalten – ${data.usage.totalTokens} Tokens${kosten}`,
          space !== "Kein Space" ? space : undefined
        );
      }
    } catch {
      addMessage(chatId, {
        id: crypto.randomUUID(),
        role: "agent",
        label: "System",
        text: "Fehler: Backend nicht erreichbar. Bitte später erneut versuchen.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-3.5">
        <h1 className="text-[16px] font-semibold">{aktiverChat?.titel ?? "Neuer Chat"}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#e2e8f0] px-6 py-3">
        <SpaceSelector value={space} onChange={setSpace} />
        <button
          onClick={() => setVergleichsModus((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[12.5px] font-semibold ${
            vergleichsModus
              ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
              : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-slate-50"
          }`}
        >
          <GitCompare size={14} />
          Vergleichsmodus{vergleichsModus ? " an" : ""}
        </button>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {messages.map((m) =>
          m.vergleich ? (
            <div key={m.id} className="w-full">
              <div className="mb-2 px-1 text-[11px] text-[#64748b]">{m.label}</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {m.vergleich.map((e) => (
                  <div key={e.modell} className="rounded-[12px] border border-[#e2e8f0] bg-white p-3">
                    <div className="mb-2 truncate text-[11.5px] font-semibold text-[#2563eb]">{e.modell}</div>
                    <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#0f172a]">
                      {e.reply}
                    </div>
                    {e.usage && (
                      <div className="mt-2 border-t border-[#e2e8f0] pt-2 text-[10.5px] text-[#94a3b8]">
                        {e.usage.totalTokens} Tokens
                        {typeof e.usage.kostenUsd === "number" ? ` · ~$${e.usage.kostenUsd.toFixed(4)}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex max-w-[65%] flex-col ${
                m.role === "user" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              <div className="mb-1 px-1 text-[11px] text-[#64748b]">{m.label}</div>
              <div
                className={`rounded-[12px] px-3.5 py-2.5 text-[14px] leading-relaxed ${
                  m.role === "user" ? "bg-[#2563eb] text-white" : "bg-[#f1f5f9] text-[#0f172a]"
                }`}
              >
                {m.text}
              </div>
              {m.usage && (
                <div className="mt-1 px-1 text-[10.5px] text-[#94a3b8]">
                  {m.usage.totalTokens} Tokens
                  {typeof m.usage.kostenUsd === "number" ? ` · ~$${m.usage.kostenUsd.toFixed(4)}` : ""}
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="border-t border-[#e2e8f0] px-6 py-3.5">
        {anhaenge.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {anhaenge.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] text-[#475569]"
              >
                📎 {a.name}
                <button
                  onClick={() => setAnhaenge((prev) => prev.filter((x) => x.id !== a.id))}
                  aria-label={`${a.name} entfernen`}
                  className="text-[#94a3b8] hover:text-[#475569]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2.5">
          <FileUpload
            variante="icon"
            space={space !== "Kein Space" ? space : undefined}
            onUpload={(datei) => setAnhaenge((prev) => [...prev, datei])}
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={
              vergleichsModus
                ? "Nachricht an alle Vergleichsmodelle..."
                : `Nachricht an ${agent.split(" ")[1] ?? "Hermes"}... (oder /befehl)`
            }
            rows={1}
            className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-[8px] border border-[#e2e8f0] px-3 py-2.5 text-[14px] font-sans"
          />
          <button
            onClick={send}
            disabled={sending}
            aria-label="Nachricht senden"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#2563eb] hover:opacity-90 disabled:opacity-50"
          >
            <Send size={18} color="#fff" />
          </button>
        </div>
        <div className="mt-1.5 px-1 text-[10.5px] text-[#94a3b8]">
          /space · /agent · /status · /protokoll · /neu · /rückgängig · /verdichten
        </div>
      </div>
    </div>
  );
}