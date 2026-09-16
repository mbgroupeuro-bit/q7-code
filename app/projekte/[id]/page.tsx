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
