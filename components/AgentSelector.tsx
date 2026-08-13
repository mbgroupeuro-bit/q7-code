"use client";

import { ChevronDown } from "lucide-react";
import { AGENTS } from "@/lib/types";

interface AgentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const options = AGENTS.filter((a) => a.aktiv).map((a) => `${a.kuerzel} ${a.name}`);

export default function AgentSelector({ value, onChange }: AgentSelectorProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-[8px] border border-[#e2e8f0] bg-white py-1.5 pl-3 pr-8 text-[13px] cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
    </div>
  );
}
