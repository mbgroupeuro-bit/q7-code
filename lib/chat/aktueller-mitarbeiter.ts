import { headers } from "next/headers";

// Übergangslösung bis ein echtes Rollen-/Rechte-Basismodul existiert.
// Liest den simulierten Header "x-q7-mitarbeiter", analog zum Posteingang-Modul
// (lib/posteingang/aktueller-mitarbeiter.ts).

export async function getAktuellerMitarbeiterId(): Promise<string | null> {
  const headerListe = await headers();
  const mitarbeiterId = headerListe.get("x-q7-mitarbeiter");
  return mitarbeiterId ?? null;
}
