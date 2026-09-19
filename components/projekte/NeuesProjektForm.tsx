"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { erstellenAction } from "@/app/projekte/actions";

/**
 * Kleines Inline-Formular statt Modal â€” minimal, ersetzt den
 * alert()-Platzhalter der alten Spaces-Seite durch echte Funktion.
 */
export default function NeuesProjektForm() {
  const [offen, setOffen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="flex items-center gap-1.5 rounded-[8px] bg-[#2563eb] px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
      >
        <Plus size={15} />
        Neues Projekt
      </button>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(() => {
          erstellenAction(formData);
        });
      }}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        autoFocus
        placeholder="Projektname"
        className="rounded-[8px] border border-[#e2e8f0] px-3 py-1.5 text-[13px]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-[8px] bg-[#2563eb] px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
      >
        {pending ? "..." : "Erstellen"}
      </button>
      <button
        type="button"
        onClick={() => setOffen(false)}
        className="text-[13px] text-[#64748b] hover:underline"
      >
        Abbrechen
      </button>
    </form>
  );
}
