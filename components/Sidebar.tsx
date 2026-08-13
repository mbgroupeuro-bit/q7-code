"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Inbox,
  SquareCheck,
  Calendar,
  Code,
  Package,
  FolderCheck,
  Building2,
  FileText,
  Archive,
  Settings,
  Plus,
  Menu,
  X,
  Search,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useCurrentRole, darfAdminKonsoleSehen } from "@/lib/auth";
import { useAppState } from "@/lib/store";

// Vereinte Version (04.08.2026): führt die ursprüngliche Sidebar (Chat-Liste,
// Suche, Umbenennen/Löschen, Mobile-Drawer — siehe Q7_App_Umbau_Uebergabe.md)
// mit dem neuen Navy/Gold-Design und der Dashboard-Navigation zusammen.
// "Überblick" (/dashboard) ist neu und führt zur KPI-Startseite.
//
// Gruppe 1 = operative Kernpunkte, Gruppe 2 = Verwaltung. "badgeKey" verweist
// auf ein Feld in useAppState() für Live-Zähler — Feldnamen ggf. an reales
// Store-Schema anpassen.
//
// Black-Box-Prinzip weiterhin gültig: "Agenten"-Menüpunkt bleibt entfernt,
// Route /agenten bleibt im Code für möglichen späteren Admin-Debug-Zugriff.
const navGroups = [
  [
    { href: "/dashboard", label: "Überblick", Icon: Home, adminOnly: false },
    { href: "/input", label: "Posteingang", Icon: Inbox, adminOnly: false, badgeKey: "ungeleseneInputs" as const },
    { href: "/aufgaben", label: "Aufgaben", Icon: SquareCheck, adminOnly: false, badgeKey: "offeneAufgaben" as const },
    { href: "/kalender", label: "Kalender", Icon: Calendar, adminOnly: false },
    { href: "/studio", label: "Entwicklung", Icon: Code, adminOnly: false },
    { href: "/spaces", label: "Arbeitsbereiche", Icon: Package, adminOnly: false },
    { href: "/output", label: "Ausgabe", Icon: FolderCheck, adminOnly: false },
    { href: "/erp", label: "ERP", Icon: Building2, adminOnly: false, badgeLabel: "Neu" as const },
  ],
  [
    { href: "/protokoll", label: "Chronik", Icon: FileText, adminOnly: false },
    { href: "/ablage", label: "Bibliothek", Icon: Archive, adminOnly: false },
    { href: "/einstellungen", label: "Einstellungen", Icon: Settings, adminOnly: false },
  ],
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [suche, setSuche] = useState("");
  const role = useCurrentRole();
  const zeigeAdminLinks = darfAdminKonsoleSehen(role);
  const {
    chats,
    activeChatId,
    switchChat,
    clearActiveChat,
    deleteChat,
    renameChat,
    // Optionale Live-Zähler für Badges — Feldnamen an reales Store-Schema
    // anpassen, falls abweichend. Fallback auf 0, falls (noch) nicht vorhanden.
    ungeleseneInputs,
    offeneAufgaben,
  } = useAppState() as ReturnType<typeof useAppState> & {
    ungeleseneInputs?: number;
    offeneAufgaben?: number;
  };
  const badgeWerte: Record<string, number | undefined> = { ungeleseneInputs, offeneAufgaben };

  const [offenesMenuChatId, setOffenesMenuChatId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [umbenennenChatId, setUmbenennenChatId] = useState<string | null>(null);
  const [umbenennenText, setUmbenennenText] = useState("");

  const chatsSortiert = useMemo(
    () => [...chats].sort((a, b) => (a.aktualisiert < b.aktualisiert ? 1 : -1)),
    [chats]
  );

  const chatsGefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return chatsSortiert;
    return chatsSortiert.filter(
      (c) =>
        c.titel.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }, [chatsSortiert, suche]);

  const content = (
    <div className="flex h-full flex-col bg-navy-dark text-[#C7CBDA]">
      {/* Kopfzeile: Q7-Wordmark statt Bild-Logo, damit Navy-Hintergrund passt */}
      <div className="flex items-center px-4 py-4 border-b border-[#22305A]">
        <div>
          <div className="text-xl font-bold text-gold leading-none">Q7</div>
          <div className="text-[9px] tracking-wide text-[#7C82A0] mt-0.5">
            AI BUSINESS OS
          </div>
        </div>
        <button
          className="ml-auto md:hidden text-[#C7CBDA]"
          onClick={() => setOpen(false)}
          aria-label="Sidebar schließen"
        >
          <X size={20} />
        </button>
      </div>

      <button
        onClick={() => {
          clearActiveChat();
          router.push("/");
          setOpen(false);
        }}
        className="mx-3 mt-3 mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2.5 text-sm font-medium text-navy-dark transition-opacity hover:opacity-90"
      >
        <Plus size={16} />
        Neuer Chat
      </button>

      <div className="px-3 pb-1">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7C82A0]" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Chat suchen"
            className="w-full rounded-lg border border-[#22305A] bg-[#151F42] py-1.5 pl-8 pr-2.5 text-[12.5px] text-white placeholder:text-[#7C82A0] outline-none"
          />
        </div>
      </div>

      {chatsGefiltert.length > 0 && (
        <div className="max-h-[200px] overflow-y-auto px-2 pb-2">
          <div className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#7C82A0]">
            Chats
          </div>
          {chatsGefiltert.map((chat) => {
            const wirdUmbenannt = umbenennenChatId === chat.id;
            const menuOffen = offenesMenuChatId === chat.id;

            if (wirdUmbenannt) {
              return (
                <div
                  key={chat.id}
                  className="my-0.5 flex items-center gap-1.5 rounded-lg border border-gold bg-[#151F42] px-2.5 py-1.5"
                >
                  <MessageSquare size={15} className="flex-shrink-0 text-[#7C82A0]" />
                  <input
                    autoFocus
                    value={umbenennenText}
                    onChange={(e) => setUmbenennenText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameChat(chat.id, umbenennenText);
                        setUmbenennenChatId(null);
                      } else if (e.key === "Escape") {
                        setUmbenennenChatId(null);
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none"
                  />
                  <button
                    onClick={() => {
                      renameChat(chat.id, umbenennenText);
                      setUmbenennenChatId(null);
                    }}
                    aria-label="Umbenennen bestätigen"
                    className="flex-shrink-0 text-gold"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => setUmbenennenChatId(null)}
                    aria-label="Umbenennen abbrechen"
                    className="flex-shrink-0 text-[#7C82A0]"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            }

            return (
              <div key={chat.id} className="group relative my-0.5">
                <button
                  onClick={() => {
                    switchChat(chat.id);
                    router.push("/");
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 pr-8 text-left text-sm font-medium ${
                    chat.id === activeChatId
                      ? "bg-navy text-white"
                      : "text-[#C7CBDA] hover:bg-navy/50"
                  }`}
                >
                  <MessageSquare size={15} className="flex-shrink-0" />
                  <span className="truncate">
                    {chat.titel}
                    {chat.titelStatus === "pending" && (
                      <span className="ml-1 text-[10.5px] text-[#7C82A0]">···</span>
                    )}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (menuOffen) {
                      setOffenesMenuChatId(null);
                      setMenuPosition(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({ top: rect.bottom + 4, left: rect.right - 144 });
                      setOffenesMenuChatId(chat.id);
                    }
                  }}
                  aria-label="Chat-Optionen"
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-[#7C82A0] hover:bg-navy ${
                    menuOffen ? "bg-navy" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <MoreVertical size={14} />
                </button>

                {menuOffen && menuPosition && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => {
                        setOffenesMenuChatId(null);
                        setMenuPosition(null);
                      }}
                    />
                    <div
                      style={{ top: menuPosition.top, left: menuPosition.left }}
                      className="fixed z-50 w-36 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                    >
                      <button
                        onClick={() => {
                          setUmbenennenText(chat.titel);
                          setUmbenennenChatId(chat.id);
                          setOffenesMenuChatId(null);
                          setMenuPosition(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-neutral-600 hover:bg-neutral-50"
                      >
                        <Pencil size={13} />
                        Umbenennen
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Chat "${chat.titel}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) {
                            deleteChat(chat.id);
                          }
                          setOffenesMenuChatId(null);
                          setMenuPosition(null);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Löschen
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mx-1.5 mb-1 h-px bg-[#22305A]" />

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {navGroups.map((group, gi) => {
          const sichtbareEintraege = group.filter((item) => !item.adminOnly || zeigeAdminLinks);
          if (sichtbareEintraege.length === 0) return null;
          return (
            <div key={gi}>
              {sichtbareEintraege.map(({ href, label, Icon, badgeKey, badgeLabel }) => {
                const active = pathname === href;
                const badgeWert = badgeKey ? badgeWerte[badgeKey] : undefined;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`my-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium ${
                      active
                        ? "bg-navy text-white"
                        : "text-[#C7CBDA] hover:bg-navy/50"
                    }`}
                  >
                    <Icon size={17} className={active ? "text-gold" : ""} />
                    <span className="flex-1">{label}</span>
                    {!!badgeWert && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#26335C] px-1 text-[10.5px] font-semibold text-white">
                        {badgeWert}
                      </span>
                    )}
                    {badgeLabel && (
                      <span className="rounded-md bg-gold px-1.5 py-0.5 text-[10px] font-bold text-navy-dark">
                        {badgeLabel}
                      </span>
                    )}
                  </Link>
                );
              })}
              {gi < navGroups.length - 1 && (
                <div className="mx-1.5 my-2 h-px bg-[#22305A]" />
              )}
            </div>
          );
        })}
      </nav>

      {/* TODO: "Peter's Team"/"Admin" durch echte Session/Auth-Daten ersetzen */}
      <div className="flex items-center gap-2.5 border-t border-[#22305A] px-4 py-3">
        <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-gold text-[12px] font-bold text-navy-dark">
          PT
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-tight text-white">Peter&apos;s Team</div>
          <div className="text-[11.5px] text-[#7C82A0]">Admin</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-[#22305A] bg-navy-dark text-white md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Menü öffnen"
      >
        <Menu size={18} />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-[224px] flex-shrink-0 md:block">{content}</aside>

      {/* Mobile overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[224px]">{content}</div>
        </div>
      )}
    </>
  );
}
