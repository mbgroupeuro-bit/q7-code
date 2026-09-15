import { notFound } from "next/navigation";
import { projektAbrufen } from "@/lib/projekt";
import ProjektHeader from "@/components/projekte/ProjektHeader";
import ProjektSpeicherBox from "@/components/projekte/ProjektSpeicherBox";
import ProjektKontextBox from "@/components/projekte/ProjektKontextBox";
import { anheftenAction, kontextHinzufuegenAction, kontextEntfernenAction } from "../actions";

// ANNAHME: projektAbrufen(id) liefert Projekt inkl. relations
// (ProjektErinnerung, ProjektKontextDatei[]) â€” bitte gegen lib/projekt.ts
// prÃ¼fen. Falls projektAbrufen nur das Projekt selbst liefert, mÃ¼ssen
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
