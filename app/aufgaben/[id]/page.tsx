// Basismodul "Meine Aufgaben" — Detailseite
// Speicherort: D:\Projekt2027\Basismodule\meine_aufgaben\app\aufgaben\[id]\page.tsx

import { notFound } from "next/navigation";
import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import AufgabeDetail from "./AufgabeDetail";

export default async function AufgabeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const datenZugriff = getAufgabenDatenZugriff();
  const aufgabe = await datenZugriff.getAufgabeMitVerlauf(id);

  if (!aufgabe) {
    notFound();
  }

  const mitarbeiterListe = await datenZugriff.getMitarbeiterListe();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <AufgabeDetail initialAufgabe={aufgabe} mitarbeiterListe={mitarbeiterListe} />
    </div>
  );
}
