"use client";

import { ChevronDown } from "lucide-react";
import { SPACES } from "@/lib/types";

interface SpaceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const options = ["Kein Space", ...SPACES.map((s) => s.name)];

export default function SpaceSelector({ value, onChange }: SpaceSelectorProps) {
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
