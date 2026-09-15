# =====================================================================
# PJ-03 Setup-Skript — Projekte-UI (Nav-Rename, Komponenten, Server Actions)
# Ausführen im Projekt-Root: D:\Projekt2027\Q7_Entwicklung\a_Q7-code
# =====================================================================

$ErrorActionPreference = "Stop"
Set-Location "D:\Projekt2027\Q7_Entwicklung\a_Q7-code"

Write-Host "=== 1) Git-Checkpoint ===" -ForegroundColor Cyan
git add -A
git commit -m "Checkpoint vor PJ-03 Aufbau (Projekte-UI)" --allow-empty

Write-Host "`n=== 2) Ordner-Rename: arbeitsbereiche -> projekte ===" -ForegroundColor Cyan
if (Test-Path "app\arbeitsbereiche") {
    git mv app\arbeitsbereiche app\projekte
    Write-Host "  -> umbenannt (Git-Historie bleibt erhalten)" -ForegroundColor Green
} else {
    Write-Host "  WARNUNG: app\arbeitsbereiche nicht gefunden. Übersprungen." -ForegroundColor Red
}

Write-Host "`n=== 3) Komponenten-Ordner anlegen ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "components\projekte" | Out-Null

# ---------------------------------------------------------------------
# 4) Neue Komponenten schreiben (existieren noch nicht -> kein Überschreib-Risiko)
# ---------------------------------------------------------------------
Write-Host "`n=== 4) Komponenten schreiben ===" -ForegroundColor Cyan

@'
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
 * ANNAHME: Feldname "angeheftet" laut Migration projekt_kontext_memory —
 * bitte gegen Prisma-Schema prüfen, falls Build-Fehler.
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
'@ | Set-Content -Encoding UTF8 "components\projekte\ProjektHeader.tsx"
Write-Host "  -> ProjektHeader.tsx" -ForegroundColor Green

@'
"use client";

interface ProjektSpeicherBoxProps {
  status: string | null;
  inhalt: string | null;
  fehlermeldung: string | null;
  letzteAktualisierung: string | null;
}

/**
 * Zeigt ProjektErinnerung.status / .inhalt an.
 * ANNAHME: status-Werte analog AgentCronLauf-Muster
 * (z.B. "ok" | "fehler" | "laeuft" | "ausstehend") — bitte gegen
 * tatsächliche Enum-Werte im Prisma-Schema prüfen.
 */
export default function ProjektSpeicherBox({
  status,
  inhalt,
  fehlermeldung,
  letzteAktualisierung,
}: ProjektSpeicherBoxProps) {
  const istFehler = status === "fehler";

  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-[#334155]">Speicher</h3>
        {letzteAktualisierung && (
          <span className="text-[11px] text-[#94a3b8]">Stand: {letzteAktualisierung}</span>
        )}
      </div>

      {istFehler ? (
        <p className="text-[12.5px] text-[#dc2626]">
          Fehler bei der letzten Verdichtung: {fehlermeldung ?? "Unbekannter Fehler."}
        </p>
      ) : inhalt ? (
        <p className="text-[12.5px] text-[#475569] whitespace-pre-wrap">{inhalt}</p>
      ) : (
        <p className="text-[12.5px] text-[#94a3b8] italic">
          Noch keine Erinnerung vorhanden. Wird nach dem nächtlichen Lauf befüllt.
        </p>
      )}
    </div>
  );
}
'@ | Set-Content -Encoding UTF8 "components\projekte\ProjektSpeicherBox.tsx"
Write-Host "  -> ProjektSpeicherBox.tsx" -ForegroundColor Green

@'
"use client";

import { Trash2 } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import type { UploadedFile } from "@/lib/types";

interface KontextDatei {
  id: string;
  name: string;
  typ: string;
  hochgeladenAm: string;
}

interface ProjektKontextBoxProps {
  projektId: string;
  dateien: KontextDatei[];
  onHinzufuegen: (datei: UploadedFile) => void;
  onEntfernen: (dateiId: string) => void;
}

/**
 * Kontext-Box: Liste bestehender Kontext-Dateien + Upload über
 * bestehende Ablage-Mechanik (FileUpload.tsx, unverändert wiederverwendet).
 * Kein eigener Upload-Pfad — postet an /api/ablage, verknüpft danach
 * nur die ablage_id via onHinzufuegen -> kontextDateiHinzufuegen().
 */
export default function ProjektKontextBox({
  projektId,
  dateien,
  onHinzufuegen,
  onEntfernen,
}: ProjektKontextBoxProps) {
  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#334155]">Kontext</h3>
        <FileUpload
          variante="button"
          label="Datei hinzufügen"
          kategorie="Projekt-Kontext"
          space={projektId}
          onUpload={onHinzufuegen}
        />
      </div>

      {dateien.length === 0 ? (
        <p className="text-[12.5px] text-[#94a3b8] italic">Noch keine Kontext-Dateien hinterlegt.</p>
      ) : (
        <ul className="space-y-1.5">
          {dateien.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-[6px] border border-[#f1f5f9] px-2.5 py-1.5 text-[12.5px]"
            >
              <span className="text-[#334155]">{d.name}</span>
              <button
                type="button"
                onClick={() => onEntfernen(d.id)}
                aria-label="Entfernen"
                className="text-[#94a3b8] hover:text-[#dc2626]"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
'@ | Set-Content -Encoding UTF8 "components\projekte\ProjektKontextBox.tsx"
Write-Host "  -> ProjektKontextBox.tsx" -ForegroundColor Green

# ---------------------------------------------------------------------
# 5) Server Actions (gebündelt, wie in Checkpoint 2 besprochen)
# ---------------------------------------------------------------------
Write-Host "`n=== 5) Server Actions schreiben ===" -ForegroundColor Cyan

@'
"use server";

import { revalidatePath } from "next/cache";
import {
  projektUmbenennen,
  projektAnheften,
  projektLoeschen,
  kontextDateiHinzufuegen,
  kontextDateiEntfernen,
} from "@/lib/projekt";

// ANNAHME: exakte Signaturen (Parameter-Reihenfolge/-Namen) laut
// lib/projekt.ts (9/9 getestet) — bitte gegen Original prüfen, falls
// TypeScript-Fehler beim Build auftreten.

export async function umbenennenAction(projektId: string, neuerName: string) {
  await projektUmbenennen(projektId, neuerName);
  revalidatePath(`/projekte/${projektId}`);
  revalidatePath("/projekte");
}

export async function anheftenAction(projektId: string) {
  await projektAnheften(projektId);
  revalidatePath("/projekte");
}

export async function loeschenAction(projektId: string) {
  await projektLoeschen(projektId);
  revalidatePath("/projekte");
}

export async function kontextHinzufuegenAction(projektId: string, ablageId: string) {
  await kontextDateiHinzufuegen(projektId, ablageId);
  revalidatePath(`/projekte/${projektId}`);
}

export async function kontextEntfernenAction(projektId: string, dateiId: string) {
  await kontextDateiEntfernen(projektId, dateiId);
  revalidatePath(`/projekte/${projektId}`);
}
'@ | Set-Content -Encoding UTF8 "app\projekte\actions.ts"
Write-Host "  -> app\projekte\actions.ts" -ForegroundColor Green

# ---------------------------------------------------------------------
# 6) Detailseite NUR anlegen, wenn sie noch nicht existiert
# ---------------------------------------------------------------------
Write-Host "`n=== 6) Detailseite ===" -ForegroundColor Cyan

$detailPath = "app\projekte\[id]\page.tsx"
if (Test-Path $detailPath) {
    Write-Host "  Existiert bereits -> Vorschlag als page_VORSCHLAG.tsx daneben abgelegt, NICHT überschrieben." -ForegroundColor Yellow
    $detailTargetPath = "app\projekte\[id]\page_VORSCHLAG.tsx"
} else {
    New-Item -ItemType Directory -Force -Path "app\projekte\[id]" | Out-Null
    $detailTargetPath = $detailPath
}

@'
import { notFound } from "next/navigation";
import { projektAbrufen } from "@/lib/projekt";
import ProjektHeader from "@/components/projekte/ProjektHeader";
import ProjektSpeicherBox from "@/components/projekte/ProjektSpeicherBox";
import ProjektKontextBox from "@/components/projekte/ProjektKontextBox";
import { anheftenAction, kontextHinzufuegenAction, kontextEntfernenAction } from "../actions";

// ANNAHME: projektAbrufen(id) liefert Projekt inkl. relations
// (ProjektErinnerung, ProjektKontextDatei[]) — bitte gegen lib/projekt.ts
// prüfen. Falls projektAbrufen nur das Projekt selbst liefert, müssen
// die Erinnerung/Kontext-Dateien separat geladen werden.

export default async function ProjektDetailPage({ params }: { params: { id: string } }) {
  const projekt = await projektAbrufen(params.id);
  if (!projekt) notFound();

  return (
    <div className="p-6">
      <ProjektHeader
        projektId={projekt.id}
        name={projekt.name}
        angeheftet={projekt.angeheftet ?? false}
        onTogglePin={async () => {
          "use server";
          await anheftenAction(projekt.id);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <ProjektSpeicherBox
          status={projekt.erinnerung?.status ?? null}
          inhalt={projekt.erinnerung?.inhalt ?? null}
          fehlermeldung={projekt.erinnerung?.fehlermeldung ?? null}
          letzteAktualisierung={projekt.erinnerung?.letzte_aktualisierung ?? null}
        />

        <ProjektKontextBox
          projektId={projekt.id}
          dateien={projekt.kontextDateien ?? []}
          onHinzufuegen={async (datei) => {
            "use server";
            await kontextHinzufuegenAction(projekt.id, datei.id);
          }}
          onEntfernen={async (dateiId) => {
            "use server";
            await kontextEntfernenAction(projekt.id, dateiId);
          }}
        />
      </div>
    </div>
  );
}
'@ | Set-Content -Encoding UTF8 $detailTargetPath
Write-Host "  -> $detailTargetPath" -ForegroundColor Green

# ---------------------------------------------------------------------
# 7) Nav-Label-Ersetzung (reiner Text-Swap, sicher)
# ---------------------------------------------------------------------
Write-Host "`n=== 7) Nav-Label anpassen ===" -ForegroundColor Cyan

$navFiles = @("components\DashboardSidebar.tsx", "components\Sidebar.tsx")
foreach ($f in $navFiles) {
    if (Test-Path $f) {
        $inhalt = Get-Content $f -Raw
        $neu = $inhalt -replace "Arbeitsbereiche", "Projekte" -replace "/arbeitsbereiche", "/projekte"
        if ($neu -ne $inhalt) {
            Set-Content -Encoding UTF8 -Path $f -Value $neu
            Write-Host "  -> $f aktualisiert" -ForegroundColor Green
        } else {
            Write-Host "  -> ${f}: kein Treffer fuer 'Arbeitsbereiche', manuell pruefen." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  $f nicht gefunden, übersprungen." -ForegroundColor DarkGray
    }
}

# ---------------------------------------------------------------------
# 8) Hinweis zur Liste-Seite (bewusst nicht automatisch überschrieben)
# ---------------------------------------------------------------------
Write-Host "`n=== 8) Projekt-Liste (page.tsx) ===" -ForegroundColor Cyan
Write-Host "  NICHT automatisch verändert -- bestehender Inhalt von app\projekte\page.tsx bleibt erhalten." -ForegroundColor Yellow
Write-Host "  Bitte Inhalt separat prüfen/anpassen, sobald lib/projekt.ts-Funktionen (projekteListenFuerMitarbeiter) eingebunden werden sollen." -ForegroundColor Yellow

# ---------------------------------------------------------------------
# 9) Build-Kontrolle
# ---------------------------------------------------------------------
Write-Host "`n=== 9) Build-Kontrolle ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== FERTIG ===" -ForegroundColor Cyan
Write-Host "Bitte Build-Ausgabe pruefen. Bei TypeScript-Fehlern: vermutlich Feldname-Annahmen (siehe Kommentare 'ANNAHME' in den neuen Dateien) gegen Prisma-Schema/lib/projekt.ts abgleichen." -ForegroundColor Yellow
