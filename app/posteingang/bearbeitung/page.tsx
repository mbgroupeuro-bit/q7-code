// D:\Projekt2027\Basismodule\Posteingang\app\posteingang\bearbeitung\page.tsx
//
// Zweite Ansicht "Bearbeitung": Tabellen-Übersicht, hier werden Priorität,
// Bereich und Verantwortlicher zugewiesen. Filter nach Priorität,
// Mitarbeiter und Bereich (Weiterleitungs-Übersicht als Filter statt eigener
// Seite, siehe Klärung). Design orientiert sich am Listenansicht-Referenz-
// bild (Dropdown-Filter, Status-Badges, Spalten-Aufbau).

import BearbeitungTabelle from "./BearbeitungTabelle";
import { prismaPosteingangAdapter as datenQuelle } from "@/lib/posteingang/adapters/prisma-adapter";

export default async function PosteingangBearbeitungPage() {
  const [eintraege, bereiche, mitarbeiter] = await Promise.all([
    datenQuelle.getEintraege(),
    datenQuelle.getBereiche(),
    datenQuelle.getMitarbeiter(),
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5">
        <h2 className="text-[20px] font-semibold">Posteingang — Bearbeitung</h2>
      </div>

      <BearbeitungTabelle
        initialEintraege={eintraege}
        bereiche={bereiche}
        mitarbeiter={mitarbeiter}
      />
    </div>
  );
}
