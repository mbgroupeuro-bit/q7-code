// lib/auth.ts (NEU)
// Minimal-Rollenmodell (Szenario 1: saubere Abstraktion, geringer späterer Aufwand)
//
// Aktuell: Testphase, nur Admin (Abu Umar) nutzt die App, KEIN echtes Multi-Tenant-Auth.
// Rollenhierarchie (siehe Q7_UI_Spezifikation_v1.md, Q7_Tenant_Modell_v1.md):
//   - "admin"         Plattform-Eigentümer, Letztentscheidungsinstanz (HART-Prinzip,
//                      siehe L1 Grundprinzip 9). Ausschließlich Abu Umar.
//   - "tenant_admin"  Vom Lizenznehmer benannte Person (IT, Inhaber etc.),
//                      administrative Kontrolle über die EIGENE Mandanten-Instanz
//   - "lizenznehmer"  Regulärer Mitarbeiter des lizenznehmenden Unternehmens, nur
//                      Lizenznehmer-UI. (Vormals "kunde" — korrigiert nach binding
//                      Terminologie-Konvention: "Lizenznehmer" ersetzt "Kunde"/"Mandant"
//                      überall in Code, DB-Schema und Dokumentation.)
//
// WICHTIG: Type und darfAdminKonsoleSehen() liegen jetzt in lib/rollen.ts (shared
// zwischen Client und Server), damit lib/auth-server.ts dieselbe Definition nutzt
// und keine zwei Rollenmodelle auseinanderlaufen können.
//
// Sobald echtes Multi-Tenant-Auth existiert (z.B. Session-Cookie, NextAuth, oder
// Ausbau von proxy.ts auf mehrere Nutzer-Passwort-Paare mit zugeordneter Rolle),
// wird NUR die Implementierung von useCurrentRole() ausgetauscht. Alle Komponenten,
// die diesen Hook nutzen, bleiben unverändert — sie kennen nur "welche Rolle habe
// ich", nicht "wie wurde das ermittelt".

export type { Role } from "./rollen";
export { darfAdminKonsoleSehen } from "./rollen";
import type { Role } from "./rollen";

export function useCurrentRole(): Role {
  // TODO: durch echte Session/Auth ersetzen, sobald Lizenznehmer-Zugänge existieren.
  // Aktuell fest auf "admin", da nur Abu Umar (Admin) die App in der Testphase nutzt.
  return "admin";
}
