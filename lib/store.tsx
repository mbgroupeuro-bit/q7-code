"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import {
  PROTOKOLL_LIST,
  ProtokollEintrag,
  ThreadEintrag,
  ChatThread,
  ChatMessage,
  UploadedFile,
  STANDARD_WISSEN_KATEGORIEN,
} from "@/lib/types";

const CHATS_STORAGE_KEY = "q7-chats";
const UPLOADS_STORAGE_KEY = "q7-uploads";
const KATEGORIEN_STORAGE_KEY = "q7-wissen-kategorien";

interface AppState {
  protokoll: ProtokollEintrag[];
  logAktion: (akteur: string, aktion: string, spaceKontext?: string) => void;
  fuegeThreadKommentarHinzu: (eintragId: string, kommentarId: string, kommentar: string) => void;
  setzeThreadAntwort: (eintragId: string, kommentarId: string, antwort: string) => void;

  chats: ChatThread[];
  activeChatId: string | null;
  createChat: (agent: string, space: string | undefined, ersteNachricht: ChatMessage) => string;
  addMessage: (chatId: string, message: ChatMessage) => void;
  setChatMessages: (chatId: string, messages: ChatMessage[]) => void;
  switchChat: (id: string) => void;
  clearActiveChat: () => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, neuerTitel: string) => void;
  getActiveChat: () => ChatThread | undefined;
  holeHermesTitel: (chatId: string, nachricht: string) => void;

  // Block 3 — Upload-Funktion
  uploads: UploadedFile[];
  addUpload: (file: UploadedFile) => void;
  removeUpload: (id: string) => void;
  wissenKategorien: string[];
  addWissenKategorie: (name: string) => void;
}

const AppStateContext = createContext<AppState | null>(null);

function jetztAlsZeitstempel(): string {
  const now = new Date();
  const datum = now.toLocaleDateString("de-DE");
  const uhrzeit = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${datum} · ${uhrzeit}`;
}

function ladeChatsAusStorage(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const roh = window.localStorage.getItem(CHATS_STORAGE_KEY);
    return roh ? (JSON.parse(roh) as ChatThread[]) : [];
  } catch (err) {
    console.error("Chat-Historie konnte nicht geladen werden:", err);
    return [];
  }
}

function ladeAusStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const roh = window.localStorage.getItem(key);
    return roh ? (JSON.parse(roh) as T) : fallback;
  } catch (err) {
    console.error(`Storage-Key "${key}" konnte nicht geladen werden:`, err);
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [protokoll, setProtokoll] = useState<ProtokollEintrag[]>(PROTOKOLL_LIST);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [wissenKategorien, setWissenKategorien] = useState<string[]>(STANDARD_WISSEN_KATEGORIEN);

  useEffect(() => {
    const geladen = ladeChatsAusStorage();
    setChats(geladen);
    if (geladen.length > 0) setActiveChatId(geladen[0].id);
    setUploads(ladeAusStorage<UploadedFile[]>(UPLOADS_STORAGE_KEY, []));
    setWissenKategorien(ladeAusStorage<string[]>(KATEGORIEN_STORAGE_KEY, STANDARD_WISSEN_KATEGORIEN));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(uploads));
  }, [uploads]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KATEGORIEN_STORAGE_KEY, JSON.stringify(wissenKategorien));
  }, [wissenKategorien]);

  const addUpload = useCallback((file: UploadedFile) => {
    setUploads((prev) => [file, ...prev]);
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const addWissenKategorie = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWissenKategorien((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  const createChat = useCallback(
    (agent: string, space: string | undefined, ersteNachricht: ChatMessage): string => {
      const id = crypto.randomUUID();
      const neuerChat: ChatThread = {
        id,
        titel: "Neuer Chat",
        titelStatus: "pending",
        agent,
        space,
        messages: [ersteNachricht],
        aktualisiert: new Date().toISOString(),
      };
      setChats((prev) => [neuerChat, ...prev]);
      setActiveChatId(id);

      // Sequenzieller Aufruf: holeHermesTitel wird erst aus ChatWindow.tsx aufgerufen
      return id;
    },
    []
  );

  const holeHermesTitel = useCallback((chatId: string, nachricht: string) => {
    fetch("/api/chat-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: nachricht }),
    })
      .then((res) => res.json())
      .then((data: { titel?: string }) => {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId && c.titelStatus === "pending"
              ? { ...c, titel: data.titel || c.titel, titelStatus: "final" }
              : c
          )
        );
      })
      .catch((err) => console.error("Titel-Generierung fehlgeschlagen:", err));
  }, []);

  const setChatMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, messages, aktualisiert: new Date().toISOString() } : c))
    );
  }, []);

  const addMessage = useCallback((chatId: string, message: ChatMessage) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, message], aktualisiert: new Date().toISOString() }
          : c
      )
    );
  }, []);

  const switchChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const clearActiveChat = useCallback(() => {
    setActiveChatId(null);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setActiveChatId((prev) => (prev === id ? null : prev));
  }, []);

  const renameChat = useCallback((id: string, neuerTitel: string) => {
    const bereinigt = neuerTitel.trim();
    if (!bereinigt) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, titel: bereinigt, titelStatus: "final" as const } : c
      )
    );
  }, []);

  const getActiveChat = useCallback(() => {
    return chats.find((c) => c.id === activeChatId);
  }, [chats, activeChatId]);

  const logAktion = useCallback((akteur: string, aktion: string, spaceKontext?: string) => {
    setProtokoll((prev) => [
      { id: crypto.randomUUID(), zeitstempel: jetztAlsZeitstempel(), akteur, aktion, spaceKontext },
      ...prev,
    ]);
  }, []);

  const fuegeThreadKommentarHinzu = useCallback(
    (eintragId: string, kommentarId: string, kommentar: string) => {
      setProtokoll((prev) =>
        prev.map((e) => {
          if (e.id !== eintragId) return e;
          const neuerEintrag: ThreadEintrag = { id: kommentarId, kommentar, zeitstempel: jetztAlsZeitstempel(), laedt: true };
          return { ...e, thread: [...(e.thread ?? []), neuerEintrag] };
        })
      );
    },
    []
  );

  const setzeThreadAntwort = useCallback(
    (eintragId: string, kommentarId: string, antwort: string) => {
      setProtokoll((prev) =>
        prev.map((e) => {
          if (e.id !== eintragId || !e.thread) return e;
          return { ...e, thread: e.thread.map((t) => (t.id === kommentarId ? { ...t, antwort, laedt: false } : t)) };
        })
      );
    },
    []
  );

  return (
    <AppStateContext.Provider
      value={{
        protokoll,
        logAktion,
        fuegeThreadKommentarHinzu,
        setzeThreadAntwort,
        chats,
        activeChatId,
        createChat,
        addMessage,
        setChatMessages,
        switchChat,
        clearActiveChat,
        deleteChat,
        renameChat,
        getActiveChat,
        holeHermesTitel,
        uploads,
        addUpload,
        removeUpload,
        wissenKategorien,
        addWissenKategorie,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState muss innerhalb von AppStateProvider verwendet werden.");
  return ctx;
}