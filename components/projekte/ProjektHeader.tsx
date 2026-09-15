"use client";

import Link from "next/link";
import { Pin, PinOff } from "lucide-react";

interface ProjektHeaderProps {
  projektId: string;
  name: string;
  angeheftet: boolean;
  onTogglePin: () => void;
}

/**
 * Breadcrumb "Projekte / [Name]" + Pin-Toggle.
 * ANNAHME: Feldname "angeheftet" laut Migration projekt_kontext_memory â€”
 * bitte gegen Prisma-Schema prÃ¼fen, falls Build-Fehler.
 */
export default function ProjektHeader({ projektId, name, angeheftet, onTogglePin }: ProjektHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-4">
      <div className="flex items-center gap-1.5 text-[13px] text-[#64748b]">
        <Link href="/projekte" className="hover:text-[#334155] hover:underline">
          Projekte
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#1e293b]">{name}</span>
      </div>
      <button
        type="button"
        onClick={onTogglePin}
        aria-label={angeheftet ? "Pin entfernen" : "Anheften"}
        className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[#64748b] hover:bg-slate-50"
      >
        {angeheftet ? <Pin size={15} className="fill-current" /> : <PinOff size={15} />}
      </button>
    </div>
  );
}
