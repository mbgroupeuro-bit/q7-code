// D:\Projekt2027\Basismodule\Posteingang\lib\posteingang\aktueller-mitarbeiter.ts
//
// ÜBERGANGSLÖSUNG (siehe Grill-Me, Punkt 1 — Option B, mit Peter bestätigt):
// Es gibt in Q7 noch kein echtes Login/Session-System, das einen
// Mitarbeiter-Datensatz mit einem angemeldeten Nutzer verknüpft. Analog zu
// getAktuelleRolle() in lib/auth-server.ts (die aktuell testweise fest
// "admin" liefert, da nur ein Nutzer die App nutzt) wird hier testweise ein
// simulierter Header "x-q7-mitarbeiter" (Mitarbeiter-ID) gelesen.
//
// Sobald echtes Login/Rollen-Basismodul existiert, ändert sich nur, WAS
// diese Funktion zurückgibt — alle Aufrufer (Adapter, Routen, UI) bleiben
// unverändert.
//
// WICHTIG: Wie bei x-q7-user muss der Proxy (proxy.ts) einen vom Client
// mitgeschickten x-q7-mitarbeiter-Header löschen, bevor er den echten Wert
// setzt, damit ein Client sich nicht selbst als anderer Mitarbeiter ausgeben
// kann.

import "server-only";
import { headers } from "next/headers";

export async function getAktuelleMitarbeiterId(): Promise<string | null> {
  const headerListe = await headers();
  const id = headerListe.get("x-q7-mitarbeiter");
  return id && id.trim() !== "" ? id.trim() : null;
}
