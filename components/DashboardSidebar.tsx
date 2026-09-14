"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Inbox,
  SquareCheck,
  Calendar,
  Star,
  Package,
  FolderCheck,
  Building2,
  FileText,
  Archive,
  Settings,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  badgeLabel?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Überblick", href: "/dashboard", icon: Home },
  { label: "Posteingang", href: "/posteingang", icon: Inbox, badge: 8 },
  { label: "Meine Aufgaben", href: "/aufgaben", icon: SquareCheck, badge: 12 },
  { label: "Kalender", href: "/kalender", icon: Calendar },
  { label: "Entwicklung", href: "/studio", icon: Star },
  { label: "Arbeitsbereiche", href: "/spaces", icon: Package },
  { label: "Ausgabe", href: "/output", icon: FolderCheck },
  { label: "ERP", href: "/erp", icon: Building2, badgeLabel: "Neu" },
  { label: "Chronik", href: "/protokoll", icon: FileText },
  { label: "Bibliothek", href: "/ablage", icon: Archive },
];

export interface SidebarUser {
  name: string;
  role: string;
  initials: string;
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-52 flex-shrink-0 flex-col gap-1 bg-navy-dark px-3.5 py-5 text-[#C7CBDA]">
      <div className="mb-5 px-1.5">
        <div className="text-2xl font-bold text-gold">Q7</div>
        <div className="text-[9px] tracking-wide text-[#7C82A0]">
          AI BUSINESS OS
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon, badge, badgeLabel }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors ${
                active
                  ? "bg-navy font-medium text-white"
                  : "text-[#C7CBDA] hover:bg-navy/50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Icon size={16} className={active ? "text-gold" : ""} />
                {label}
              </span>
              {badge !== undefined && (
                <span className="rounded-md bg-[#26335C] px-1.5 py-0.5 text-[11px]">
                  {badge}
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
      </nav>

      <Link
        href="/einstellungen"
        className="flex items-center gap-2.5 rounded-lg border-t border-[#22305A] px-2.5 py-2 pt-3.5 text-sm text-[#C7CBDA] hover:bg-navy/50"
      >
        <Settings size={16} />
        Einstellungen
      </Link>

      <div className="flex items-center gap-2 px-1.5 pt-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-navy-dark">
          {user.initials}
        </div>
        <div>
          <div className="text-xs font-medium text-white">{user.name}</div>
          <div className="text-[10px] text-[#7C82A0]">{user.role}</div>
        </div>
      </div>
    </aside>
  );
}
