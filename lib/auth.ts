// lib/auth.ts (NEU)
// Minimal-Rollenmodell (Szenario 1: saubere Abstraktion, geringer späterer Aufwand)
//
// Aktuell: Testphase, nur GF nutzt die App, KEIN echtes Multi-Tenant-Auth.
// Rollenhierarchie (siehe Q7_UI_Spezifikation_v1.md, Q7_Tenant_Modell_v1.md):
//   - "gf"     Plattform-Eigentümer, Letztentscheidungsinstanz (siehe L1 Grundprinzip 9)
//   - "admin"  Vom lizenznehmenden Unternehmen benannte Person (IT, Inhaber etc.),
//              administrative Kontrolle über die EIGENE Mandanten-Instanz
//   - "kunde"  Regulärer Mitarbeiter des lizenznehmenden Unternehmens, nur Kunden-UI
//
// WICHTIG: Dies ist ein Platzhalter. Sobald echtes Multi-Tenant-Auth existiert
// (z.B. Session-Cookie, NextAuth, oder Ausbau von proxy.ts auf mehrere
// Nutzer-Passwort-Paare mit zugeordneter Rolle), wird NUR die Implementierung
// von useCurrentRole() ausgetauscht. Alle Komponenten, die diesen Hook nutzen,
// bleiben unverändert — sie kennen nur "welche Rolle habe ich", nicht "wie wurde
// das ermittelt".

export type Role = "gf" | "admin" | "kunde";

export function useCurrentRole(): Role {
  // TODO: durch echte Session/Auth ersetzen, sobald Mandanten existieren.
  // Aktuell fest auf "gf", da nur der GF selbst die App in der Testphase nutzt.
  return "gf";
}

// Hilfsfunktion: darf diese Rolle die Admin-/Operator-Konsole sehen
// (z.B. Agenten-Seite, vollständiges Protokoll)?
// Siehe Q7_UI_Spezifikation_v1.md, Grundprinzip 3 "Keine Agentensteuerung in der Kunden-UI".
export function darfAdminKonsoleSehen(role: Role): boolean {
  return role === "gf" || role === "admin";
}
