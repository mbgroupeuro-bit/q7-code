// lib/rollen.ts
// Shared zwischen Client (useCurrentRole in auth.ts) und Server (auth-server.ts).
// Enthält NUR den Typ und reine Berechtigungsfunktionen, keine Ermittlungslogik.

export type Role = "admin" | "tenant_admin" | "lizenznehmer";

// Hilfsfunktion: darf diese Rolle die Admin-/Operator-Konsole sehen
// (z.B. Agenten-Seite, vollständiges Protokoll)?
// Siehe Q7_UI_Spezifikation_v1.md, Grundprinzip 3 "Keine Agentensteuerung in der Kunden-UI".
export function darfAdminKonsoleSehen(role: Role): boolean {
  return role === "admin" || role === "tenant_admin";
}
