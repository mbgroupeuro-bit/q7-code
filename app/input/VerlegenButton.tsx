// app/input/VerlegenButton.tsx (Client Component)
// 01.08.2026 — Bestätigungspflichtige Verlegung Eingang → MEINE AUFGABEN
// 05.08.2026 — variant-Prop ergänzt ("text" = Original-Verhalten unverändert,
// "icon" = kompakte Variante für die Posteingang-Liste). Kein Breaking Change.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoveRight, Loader2 } from "lucide-react";

export default function VerlegenButton({
  aufgabeId,
  variant = "text",
}: {
  aufgabeId: string;
  variant?: "text" | "icon";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [verlegt, setVerlegt] = useState(false);

  async function verlegen(e?: React.MouseEvent) {
    e?.stopPropagation();
    await fetch("/api/meine-aufgaben/aus-kanal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aufgabe_id: aufgabeId }),
    });
    setVerlegt(true);
    startTransition(() => router.refresh());
  }

  if (variant === "icon") {
    if (verlegt) {
      return <span className="text-[10.5px] text-[#94a3b8]">In Aufgaben</span>;
    }
    return (
      <button
        onClick={verlegen}
        disabled={isPending}
        title="Zu Aufgaben verlegen"
        className="rounded-[5px] border border-[#e2e8f0] p-1 text-[#2563eb] hover:bg-blue-50 disabled:opacity-50"
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <MoveRight size={12} />}
      </button>
    );
  }

  if (verlegt) {
    return <span className="text-[11.5px] text-[#94a3b8]">In Aufgaben</span>;
  }

  return (
    <button
      onClick={verlegen}
      disabled={isPending}
      className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-sm font-medium text-[#2563eb] hover:bg-blue-50 disabled:opacity-50"
    >
      → Zu Aufgaben
    </button>
  );
}
