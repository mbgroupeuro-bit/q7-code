import { NextRequest, NextResponse } from "next/server";

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
 */

export function proxy(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !pass) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const separatorIndex = decoded.indexOf(":");
      const gegebenerUser = decoded.slice(0, separatorIndex);
      const gegebenesPasswort = decoded.slice(separatorIndex + 1);

      if (gegebenerUser === user && gegebenesPasswort === pass) {
        return NextResponse.next();
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
