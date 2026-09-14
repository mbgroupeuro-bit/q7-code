import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

function sicherVergleichen(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  // Unterschiedliche Länge würde timingSafeEqual zum Werfen bringen — daher
  // erst auf gleiche Länge padden, das Ergebnis bleibt trotzdem false.
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA); // konstante Laufzeit auch im Längen-Mismatch-Fall
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Basic-Auth-Sperre für die gesamte Q7-App.
 *
 * Solange es kein echtes Login gibt, verhindert das hier, dass irgendjemand
 * mit der URL die GUI öffnen und mit den Agenten chatten kann.
 *
 * Aktivierung: BASIC_AUTH_USER und BASIC_AUTH_PASSWORD in .env.local setzen.
 * Sind beide NICHT gesetzt, ist die Sperre deaktiviert (praktisch für die
 * lokale Entwicklung mit `npm run dev`).
 *
 * WICHTIG: Das ist ein einfacher Zwischenschutz, kein vollwertiges Login
 * (ein gemeinsames Passwort für alle, keine einzelnen Konten/Rollen).
 *
 * ÄNDERUNG 05.09.2026 (Chat-Basismodul-Einbau):
 * Zusätzlich zu "x-q7-user" wird jetzt auch "x-q7-mitarbeiter" gesetzt.
 * Analog zu x-q7-user (fest "admin") wird hier testweise eine feste
 * Mitarbeiter-ID gesetzt, bis ein echtes Login/Rollen-Basismodul existiert.
 *
 * WICHTIG: Diese ID (Admin-Mitarbeiter, sieht_alle_bereiche = true) muss in
 * der Datenbank existieren (Tabelle "mitarbeiter"). Falls die ID sich ändert
 * (z.B. DB neu aufgesetzt), hier den Wert ADMIN_MITARBEITER_ID anpassen.
 */

const ADMIN_MITARBEITER_ID = "cmto4m32v0007v8o0l6h9sabi"; // Admin, siehe Tabelle "mitarbeiter"

export function proxy(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      console.error("Q7 SICHERHEIT: BASIC_AUTH_USER/BASIC_AUTH_PASSWORD nicht gesetzt — Zugriff verweigert.");
      return new NextResponse("Server fehlkonfiguriert.", { status: 500 });
    }
    // Nur außerhalb von production offen (lokale Entwicklung mit `npm run dev`).
    // Auch hier den Header verwerfen und fest auf "admin" setzen, damit lokale
    // Entwicklung und Produktionsverhalten bezüglich x-q7-user konsistent sind.
    const devHeaders = new Headers(req.headers);
    devHeaders.delete("x-q7-user");
    devHeaders.set("x-q7-user", "admin");
    devHeaders.delete("x-q7-mitarbeiter");
    devHeaders.set("x-q7-mitarbeiter", ADMIN_MITARBEITER_ID);
    return NextResponse.next({ request: { headers: devHeaders } });
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      // UTF-8-sicheres Dekodieren statt atob() (bricht sonst bei ä/ö/ü/ß im Passwort).
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const separatorIndex = decoded.indexOf(":");
      const gegebenerUser = decoded.slice(0, separatorIndex);
      const gegebenesPasswort = decoded.slice(separatorIndex + 1);

      if (sicherVergleichen(gegebenerUser, user) && sicherVergleichen(gegebenesPasswort, pass)) {
        // x-q7-user ist die einzige Quelle für getAktuelleRolle() in
        // lib/auth-server.ts — ein client-gesetzter Wert darf NIE durchkommen,
        // sonst könnte sich jeder authentifizierte Basic-Auth-Nutzer selbst zum
        // Admin erklären. Aktuell (nur ein gemeinsames Passwort, kein
        // Multi-Tenant-Login) ist jeder erfolgreich authentifizierte Request
        // "admin" — das ändert sich erst mit echtem Login pro Nutzer.
        const requestHeaders = new Headers(req.headers);
        requestHeaders.delete("x-q7-user");
        requestHeaders.set("x-q7-user", "admin");
        requestHeaders.delete("x-q7-mitarbeiter");
        requestHeaders.set("x-q7-mitarbeiter", ADMIN_MITARBEITER_ID);
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
  }

  return new NextResponse("Zugriff verweigert.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Q7"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
