// Basismodul "Meine Aufgaben" — Listenseite
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\page.tsx
//
// Änderung (04.09.2026): lädt zusätzlich die Notizen und übergibt sie an
// AufgabenApp (für den neuen "Notizen"-Tab und das Übersicht-Widget).
//
// Geändert 13.09.2026 (Kalender-Fixes-Session): lädt zusätzlich
// Mitarbeiter-Kontext + Bereichsliste aus dem Kalender-Modul. Grund: der
// neue gemeinsame Termin/Aufgabe-Dialog (EintragDialog.tsx) braucht diesen
// Kontext, um im Aufgaben-Kalender auch einen Termin anlegen zu können
// (Bereichs-Pflichtfeld). Bewusste Abhängigkeit Aufgaben-Modul -> Kalender-
// Modul (Grill-Me-Entscheidung, Variante 2: nur diese Richtung, nie
// umgekehrt — der Kalender selbst kennt weiterhin keine Aufgaben).

import { getAufgabenDatenZugriff } from "@/lib/aufgaben-datenzugriff";
import { getNotizenDatenZugriff } from "@/lib/notizen-datenzugriff";
import { getAktuellerMitarbeiter } from "@/lib/kalender/aktueller-mitarbeiter";
import { prismaKalenderAdapter } from "@/lib/kalender/prisma-adapter";
import AufgabenApp from "./AufgabenApp";

export default async function AufgabenPage() {
  const aufgabenDatenZugriff = getAufgabenDatenZugriff();
  const notizenDatenZugriff = getNotizenDatenZugriff();

  const [aufgaben, notizen, mitarbeiter] = await Promise.all([
    aufgabenDatenZugriff.getAufgaben(),
    notizenDatenZugriff.getNotizen(),
    getAktuellerMitarbeiter(),
  ]);

  // Bereichsliste wird nur für sieht_alle_bereiche=true gebraucht (freie
  // Bereichswahl im Termin-Tab des Dialogs) — sonst unnötige DB-Abfrage.
  const bereiche = mitarbeiter?.sieht_alle_bereiche
    ? await prismaKalenderAdapter.getBereiche()
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <AufgabenApp
        initialAufgaben={aufgaben}
        initialNotizen={notizen}
        mitarbeiter={mitarbeiter}
        bereiche={bereiche}
      />
    </div>
  );
}
