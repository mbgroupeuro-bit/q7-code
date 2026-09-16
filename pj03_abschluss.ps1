# =====================================================================
# PJ-03 Abschluss — Projekt-Liste-Seite (ersetzt Spaces-Platzhalter)
# =====================================================================

$ErrorActionPreference = "Stop"
Set-Location "D:\Projekt2027\Q7_Entwicklung\a_Q7-code"

Write-Host "=== Git-Checkpoint ===" -ForegroundColor Cyan
git add -A
git commit -m "Checkpoint vor PJ-03 Abschluss (Projekt-Liste)" --allow-empty

Write-Host "`n=== actions.ts erweitern (erstellenAction) ===" -ForegroundColor Cyan
@'
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  projektErstellen,
  projektUmbenennen,
  projektAnheften,
  projektLoeschen,
  kontextDateiHinzufuegen,
  kontextDateiEntfernen,
} from "@/lib/projekt";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";

export async function erstellenAction(formData: FormData) {
  const zugriff = await pruefeAgentZugriff();
  if (!zugriff.erlaubt || !zugriff.kontext) {
    throw new Error("Kein Zugriff auf Projekte.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Projektname darf nicht leer sein.");
  }

  const projekt = await projektErstellen({
    mitarbeiterId: zugriff.kontext.mitarbeiterId,
    name,
  });

  revalidatePath("/projekte");
  redirect(`/projekte/${projekt.id}`);
}

export async function umbenennenAction(projektId: string, neuerName: string) {
  await projektUmbenennen(projektId, { name: neuerName });
  revalidatePath(`/projekte/${projektId}`);
  revalidatePath("/projekte");
}

export async function anheftenAction(projektId: string, angeheftet: boolean) {
  await projektAnheften(projektId, angeheftet);
  revalidatePath("/projekte");
  revalidatePath(`/projekte/${projektId}`);
}

export async function loeschenAction(projektId: string) {
  await projektLoeschen(projektId);
  revalidatePath("/projekte");
}

export async function kontextHinzufuegenAction(projektId: string, ablageId: string) {
  await kontextDateiHinzufuegen(projektId, ablageId);
  revalidatePath(`/projekte/${projektId}`);
}

export async function kontextEntfernenAction(projektId: string, kontextDateiId: string) {
  await kontextDateiEntfernen(kontextDateiId);
  revalidatePath(`/projekte/${projektId}`);
}
'@ | Set-Content -Encoding UTF8 "app\projekte\actions.ts"
Write-Host "  -> app\projekte\actions.ts erweitert" -ForegroundColor Green

Write-Host "`n=== NeuesProjektForm.tsx anlegen ===" -ForegroundColor Cyan
@'
"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { erstellenAction } from "@/app/projekte/actions";

/**
 * Kleines Inline-Formular statt Modal — minimal, ersetzt den
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
'@ | Set-Content -Encoding UTF8 "components\projekte\NeuesProjektForm.tsx"
Write-Host "  -> components\projekte\NeuesProjektForm.tsx" -ForegroundColor Green

Write-Host "`n=== page.tsx (Liste) ersetzen ===" -ForegroundColor Cyan
@'
import Link from "next/link";
import { Pin } from "lucide-react";
import { projekteListenFuerMitarbeiter } from "@/lib/projekt";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";
import NeuesProjektForm from "@/components/projekte/NeuesProjektForm";

export default async function ProjektePage() {
  const zugriff = await pruefeAgentZugriff();

  if (!zugriff.erlaubt || !zugriff.kontext) {
    return (
      <div className="p-6 text-[13px] text-[#64748b]">
        Kein Zugriff auf Projekte fuer diesen Account.
      </div>
    );
  }

  const projekte = await projekteListenFuerMitarbeiter(zugriff.kontext.mitarbeiterId);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold">Projekte</h2>
        <NeuesProjektForm />
      </div>

      {projekte.length === 0 ? (
        <p className="text-[13px] italic text-[#64748b]">
          Noch keine Projekte angelegt. Mit &quot;Neues Projekt&quot; starten.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projekte.map((p) => (
            <Link
              key={p.id}
              href={`/projekte/${p.id}`}
              className="block rounded-[12px] border border-[#e2e8f0] bg-white p-4 hover:border-[#cbd5e1]"
            >
              <div className="flex items-start justify-between">
                <div className="text-[15px] font-semibold">{p.name}</div>
                {p.angeheftet && <Pin size={14} className="fill-current text-[#2563eb]" />}
              </div>
              {p.beschreibung && (
                <p className="mt-2 line-clamp-2 text-[12.5px] text-[#64748b]">{p.beschreibung}</p>
              )}
              <div className="mt-3 text-[11.5px] text-[#94a3b8]">
                Aktualisiert: {new Date(p.aktualisiert_am).toLocaleDateString("de-DE")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
'@ | Set-Content -Encoding UTF8 "app\projekte\page.tsx"
Write-Host "  -> app\projekte\page.tsx ersetzt" -ForegroundColor Green

Write-Host "`n=== Build-Kontrolle ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== FERTIG ===" -ForegroundColor Cyan
Write-Host "PJ-03 sollte hiermit vollstaendig abgeschlossen sein. Verbleibende Fehler sollten ausschliesslich Gruppe B (termine, ki-agent/werkzeuge, rufeKIAn types, prisma.config, trigger-hermes) betreffen." -ForegroundColor Yellow
