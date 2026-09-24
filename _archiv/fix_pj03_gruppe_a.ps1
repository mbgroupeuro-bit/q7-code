# =====================================================================
# PJ-03 Nachbesserung — Gruppe-A-Fehler (actions.ts, page.tsx)
# Behebt: falsche Signaturen (projektUmbenennen/-Anheften/kontextDateiEntfernen)
# und fehlendes Ablage-Mapping fuer Kontext-Dateien.
# =====================================================================

$ErrorActionPreference = "Stop"
Set-Location "D:\Projekt2027\Q7_Entwicklung\a_Q7-code"

Write-Host "=== Git-Checkpoint ===" -ForegroundColor Cyan
git add -A
git commit -m "Checkpoint vor PJ-03 Gruppe-A-Fehlerkorrektur" --allow-empty

Write-Host "`n=== actions.ts korrigieren ===" -ForegroundColor Cyan
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
Write-Host "  -> app\projekte\actions.ts korrigiert" -ForegroundColor Green

Write-Host "`n=== page.tsx korrigieren ===" -ForegroundColor Cyan
@'
import { notFound } from "next/navigation";
import { projektAbrufen } from "@/lib/projekt";
import { ladeIndex } from "@/lib/ablage";
import ProjektHeader from "@/components/projekte/ProjektHeader";
import ProjektSpeicherBox from "@/components/projekte/ProjektSpeicherBox";
import ProjektKontextBox from "@/components/projekte/ProjektKontextBox";
import { anheftenAction, kontextHinzufuegenAction, kontextEntfernenAction } from "../actions";

// Kontext-Dateien liegen in ProjektKontextDatei nur mit ablage_id vor
// (kein eigener Upload-Pfad, siehe lib/projekt.ts). Name/Typ/Datum
// kommen aus lib/ablage.ts (AblageEintrag), hier per Map verknuepft.

export default async function ProjektDetailPage({ params }: { params: { id: string } }) {
  const projekt = await projektAbrufen(params.id);
  if (!projekt) notFound();

  const ablageIndex = await ladeIndex();
  const ablageMap = new Map(ablageIndex.map((e) => [e.id, e]));

  const kontextDateien = projekt.kontextDateien.map((kd) => {
    const ablageEintrag = ablageMap.get(kd.ablage_id);
    return {
      id: kd.id,
      name: ablageEintrag?.dateiname ?? "Unbekannte Datei",
      typ: ablageEintrag?.mimeType ?? "unbekannt",
      hochgeladenAm:
        ablageEintrag?.hochgeladenAm ?? new Date(kd.hinzugefuegt_am).toLocaleDateString("de-DE"),
    };
  });

  return (
    <div className="p-6">
      <ProjektHeader
        projektId={projekt.id}
        name={projekt.name}
        angeheftet={projekt.angeheftet ?? false}
        onTogglePin={async () => {
          "use server";
          await anheftenAction(projekt.id, !projekt.angeheftet);
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <ProjektSpeicherBox
          status={projekt.erinnerung?.status ?? null}
          inhalt={projekt.erinnerung?.inhalt ?? null}
          fehlermeldung={projekt.erinnerung?.fehlermeldung ?? null}
          letzteAktualisierung={
            projekt.erinnerung?.letzte_aktualisierung
              ? new Date(projekt.erinnerung.letzte_aktualisierung).toLocaleDateString("de-DE")
              : null
          }
        />

        <ProjektKontextBox
          projektId={projekt.id}
          dateien={kontextDateien}
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
'@ | Set-Content -Encoding UTF8 -LiteralPath "app\projekte\[id]\page.tsx"
Write-Host "  -> app\projekte\[id]\page.tsx korrigiert" -ForegroundColor Green

Write-Host "`n=== Build-Kontrolle ===" -ForegroundColor Cyan
npm run build

Write-Host "`n=== FERTIG ===" -ForegroundColor Cyan
Write-Host "Verbleibende Fehler (falls welche) sollten nur noch aus Gruppe B stammen (termine, ki-agent/werkzeuge, rufeKIAn types, prisma.config, trigger-hermes) -- nicht PJ-03." -ForegroundColor Yellow
