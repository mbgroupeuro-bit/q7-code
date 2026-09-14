// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\instrumentation.ts
// (Projekt-Root, gleiche Ebene wie package.json)
//
// Neu 13.09.2026 (Kalender-Fixes-Session): Next.js führt register() einmalig
// beim Serverstart aus, bevor der erste Request bearbeitet wird. Genau der
// richtige Ort, um projektspezifische "Verdrahtung" zwischen Basismodulen
// zu aktivieren, die sich sonst nirgends von selbst einschalten würde.
//
// WICHTIG: Falls in diesem Projekt bereits eine instrumentation.ts existiert
// haben sollte (z.B. für Sentry/Logging o.ä.) — diese Datei NICHT blind
// überschreiben, sondern den Import + Aufruf unten in die bestehende
// register()-Funktion einfügen. Laut Suche im Projekt gab es aber keine
// solche Datei (nur Next-interne .d.ts-Typdeklarationen wurden gefunden).
//
// Läuft sowohl im Node.js- als auch im Edge-Runtime-Kontext — die
// Verdrahtung braucht Prisma/Node, daher die runtime-Prüfung.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registriereAufgabenKalenderListener } = await import(
      "@/lib/verdrahtung/aufgaben-kalender-listener"
    );
    registriereAufgabenKalenderListener();
  }
}
