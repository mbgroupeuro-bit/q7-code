// Basismodul KI-Agent — Rollenprüfung
// Speicherort in der Vorlage: D:\Projekt2027\Basismodule\KI-Agent\lib\ki-agent\rollen-check.ts
//
// JEDE neue Agent-API-Route MUSS pruefeAgentZugriff() (bzw. pruefeAdminZugriff()
// für Admin-only Aktionen) als ERSTES aufrufen — Grill-Me-Entscheidung Punkt 5
// (Rollenprüfung fest in neuen Agent-Routen, nicht nachträglich).
//
// Der Proxy allein ist keine Sicherheitsgrenze (Code-Review Punkt 2) — diese
// Prüfung läuft zusätzlich in jeder Route selbst.

import "server-only";
import { prisma } from "@/lib/prisma";
import { getAktuelleRolle, getAktuelleMitarbeiterId } from "@/lib/auth-server";
import { darfAdminKonsoleSehen } from "@/lib/rollen";
import type { WerkzeugKontext } from "./types";

export interface RollenPruefungErgebnis {
  erlaubt: boolean;
  kontext?: WerkzeugKontext;
  fehlerStatus?: number;
  fehlerText?: string;
}

/**
 * Lädt den aktuellen Mitarbeiter (aus x-q7-mitarbeiter) und baut daraus den
 * WerkzeugKontext für Werkzeug-Aufrufe. Fail-closed: fehlender/unbekannter
 * Mitarbeiter = kein Zugriff, kein Rückfall auf Default-Werte.
 */
export async function pruefeAgentZugriff(): Promise<RollenPruefungErgebnis> {
  const mitarbeiterId = await getAktuelleMitarbeiterId();

  if (!mitarbeiterId) {
    return { erlaubt: false, fehlerStatus: 401, fehlerText: "Kein Mitarbeiter-Header vorhanden." };
  }

  const mitarbeiter = await prisma.mitarbeiter.findUnique({ where: { id: mitarbeiterId } });

  if (!mitarbeiter) {
    return { erlaubt: false, fehlerStatus: 403, fehlerText: "Unbekannter Mitarbeiter." };
  }

  return {
    erlaubt: true,
    kontext: {
      mitarbeiterId: mitarbeiter.id,
      bereichId: mitarbeiter.bereich_id,
      siehtAlleBereiche: mitarbeiter.sieht_alle_bereiche,
      agentChatId: null, // wird von der jeweiligen Route ergänzt, falls vorhanden
    },
  };
}

/**
 * Zusätzliche Prüfung für Admin-only Aktionen (z.B. Delegation-Stufe ändern).
 * Baut auf pruefeAgentZugriff() auf und prüft zusätzlich die Role
 * (admin/tenant_admin) aus lib/rollen.ts.
 */
export async function pruefeAdminZugriff(): Promise<RollenPruefungErgebnis> {
  const basis = await pruefeAgentZugriff();
  if (!basis.erlaubt) return basis;

  const rolle = await getAktuelleRolle();
  if (!darfAdminKonsoleSehen(rolle)) {
    return { erlaubt: false, fehlerStatus: 403, fehlerText: "Nur Admin/Tenant-Admin dürfen das." };
  }

  return basis;
}
