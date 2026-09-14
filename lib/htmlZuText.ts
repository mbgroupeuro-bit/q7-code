// lib/htmlZuText.ts
// Ausgelagert aus app/posteingang/PosteingangListe.tsx (04.09.2026), damit
// sowohl die Posteingang-Anzeige (Client) als auch die Verlegung zu
// "Meine Aufgaben" (Server, prisma-adapter.ts) dieselbe, einzige
// Implementierung nutzen — statt sie doppelt zu pflegen.
//
// Entfernt HTML-Tags, MSO-/Outlook-Kommentare und dekodiert die gängigsten
// HTML-Entities, damit E-Mail-Inhalte als reiner Text angezeigt werden
// können. Bewusst simpel gehalten (kein DOM-Parser nötig) — reicht für die
// Anzeige, ersetzt aber keine "echte" HTML-Sanitisierung für sicherheits-
// kritische Zwecke.
//
// Automatisch generierte E-Mails (z.B. Google-Benachrichtigungen) enthalten
// oft denselben Textblock mehrfach — einmal je bedingtem Kommentar-Block
// (<!--[if mso]-->, <!--[if !mso]><!--> usw.), weil jeweils nur EINE Version
// im tatsächlichen Mail-Programm sichtbar wäre. Damit der angezeigte Text
// nicht 2-3x so lang wirkt, werden Block-Elemente (div/p/tr/td/li) als
// Grenzen genutzt, um wortwörtlich identische Blöcke zu erkennen und bis auf
// das erste Vorkommen zu entfernen. Nur EXAKT gleiche Blöcke werden entfernt
// — unterschiedliche, nur ähnlich klingende Sätze bleiben unangetastet.
export function htmlZuText(input: string): string {
  if (!input) return "";
  const bereinigt = input
    // HTML-Kommentare entfernen (nicht-gierig — jeder Kommentar von "<!--" bis
    // zum NÄCHSTEN "-->", auch MSO-Marker wie <!--[if mso]><!--> oder
    // <!--<![endif]--> werden dadurch korrekt als einzelne Kommentare erkannt,
    // ohne den echten Text dazwischen zu verschlucken)
    .replace(/<!--[\s\S]*?-->/g, " ")
    // <br> zuerst durch Platzhalter ersetzen, damit er später als einziger
    // "echter" Zeilenumbruch übrig bleibt
    .replace(/<br\s*\/?>/gi, "\u0000")
    // Block-Elemente als Grenzen für die Duplikat-Erkennung markieren
    // (eigener Platzhalter, WIRD NICHT automatisch zu einem sichtbaren
    // Zeilenumbruch — nur zur Gruppierung für die Dedupe-Logik unten)
    .replace(/<\/(p|div|tr|td|li)>/gi, "\u0001")
    // Alle verbleibenden Tags als Leerzeichen entfernen
    .replace(/<[^>]+>/g, " ")
    // Gängige HTML-Entities dekodieren
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    // Alle echten Whitespace-Zeichen (Leerzeichen, Tabs, ECHTE Zeilenumbrüche
    // aus dem Quelltext) zu einem einzelnen Leerzeichen zusammenfassen
    .replace(/\s+/g, " ");

  // Anhand der Block-Platzhalter (\u0001) in Abschnitte zerlegen, getrimmt,
  // leere Abschnitte verworfen, wortwörtliche Duplikate entfernt (nur das
  // erste Vorkommen bleibt erhalten, Reihenfolge bleibt sonst erhalten).
  const gesehen = new Set<string>();
  const abschnitte = bereinigt
    .split("\u0001")
    .map((teil) => teil.trim())
    .filter((teil) => teil.length > 0)
    .filter((teil) => {
      if (gesehen.has(teil)) return false;
      gesehen.add(teil);
      return true;
    });

  return abschnitte
    .join(" ")
    // Platzhalter für <br> wieder in echte Zeilenumbrüche zurückverwandeln
    .replace(/\u0000/g, "\n")
    .replace(/\n\s*\n+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}
