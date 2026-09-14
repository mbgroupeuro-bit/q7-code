// lib/auth-server.ts
// Speicherort im Zielprojekt: a_Q7-code/lib/auth-server.ts
// (gehört strenggenommen nicht zum KI-Agent-Basismodul, wird aber mitgeliefert,
// falls im Zielprojekt noch nicht vorhanden — siehe Code-Review Punkt 2 und
// Grill-Me-Entscheidung zu rollen-check.ts. Falls die Datei im Zielprojekt
// bereits existiert: nicht überschreiben, nur abgleichen.)
//
// server-only, liest ausschließlich den vom proxy.ts gesetzten x-q7-user-Header.
// Client-gesetzte Werte kommen hier NIE an (proxy.ts löscht und setzt den Header
// serverseitig neu, siehe proxy.ts-Kommentar).

import "server-only";
import { headers } from "next/headers";
import type { Role } from "./rollen";

const GUELTIGE_ROLLEN: readonly Role[] = ["admin", "tenant_admin", "lizenznehmer"];

/**
 * Liefert die aktuelle Rolle aus dem x-q7-user-Header.
 * Fail-closed: fehlt der Header oder ist der Wert unbekannt, wird NICHT auf
 * "admin" zurückgefallen, sondern auf die niedrigste Berechtigungsstufe
 * ("lizenznehmer") — Lehre aus dem A14-Gate-Fehler (Code-Review Punkt 1).
 */
export async function getAktuelleRolle(): Promise<Role> {
  const headerListe = await headers();
  const wert = headerListe.get("x-q7-user");

  if (wert && (GUELTIGE_ROLLEN as readonly string[]).includes(wert)) {
    return wert as Role;
  }

  return "lizenznehmer";
}

/** Liefert die aktuelle Mitarbeiter-Id aus dem x-q7-mitarbeiter-Header, oder null. */
export async function getAktuelleMitarbeiterId(): Promise<string | null> {
  const headerListe = await headers();
  return headerListe.get("x-q7-mitarbeiter");
}
