"use client";

import { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { UploadedFile } from "@/lib/types";

interface FileUploadProps {
  onUpload: (file: UploadedFile) => void;
  kategorie?: string;
  space?: string;
  /** Nur Icon-Button (Chat-Eingabefeld). Sonst voller Button mit Label (Ablage-Seite). */
  variante?: "icon" | "button";
  label?: string;
}

/**
 * ERWEITERT (18.07.2026): Datei-Inhalt wird jetzt tatsächlich an
 * /api/ablage gesendet und dort persistiert (08_ABLAGE), statt nur als
 * Metadatum im Client-State zu landen und danach verworfen zu werden.
 * Siehe Root-Cause-Analyse Q7-UI-009 / Q7-UI-010.
 *
 * onUpload wird erst NACH erfolgreicher Backend-Antwort aufgerufen, mit
 * den vom Server bestätigten Daten (u.a. echte id, ggf. umbenannter
 * Dateiname bei Namenskollision) — nicht mit optimistischen Client-Daten.
 */
export default function FileUpload({
  onUpload,
  kategorie,
  space,
  variante = "button",
  label = "Datei hochladen",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [wirdHochgeladen, setWirdHochgeladen] = useState(false);

  function leseAlsBase64(datei: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const ergebnis = reader.result as string;
        // "data:<mime>;base64,<inhalt>" -> nur den Teil nach dem Komma behalten
        const base64 = ergebnis.split(",")[1] ?? "";
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(datei);
    });
  }

  async function ladeDateiHoch(datei: File) {
    const inhaltBase64 = await leseAlsBase64(datei);

    const res = await fetch("/api/ablage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateiname: datei.name,
        inhaltBase64,
        mimeType: datei.type || "application/octet-stream",
        kategorie: kategorie ?? "Sonstiges",
        space,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Upload fehlgeschlagen.");
    }

    const eintrag = data.eintrag as {
      id: string;
      dateiname: string;
      kategorie: string;
      space?: string;
      mimeType: string;
      hochgeladenAm: string;
      groesse: number;
    };

    onUpload({
      id: eintrag.id,
      name: eintrag.dateiname,
      typ: eintrag.mimeType || datei.name.split(".").pop()?.toUpperCase() || "Datei",
      groesse: eintrag.groesse,
      kategorie: eintrag.kategorie,
      space: eintrag.space,
      hochgeladenAm: new Date(eintrag.hochgeladenAm).toLocaleDateString("de-DE"),
    });
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const dateien = e.target.files;
    if (!dateien || dateien.length === 0) return;

    setWirdHochgeladen(true);
    const fehler: string[] = [];

    for (const datei of Array.from(dateien)) {
      try {
        await ladeDateiHoch(datei);
      } catch (err) {
        const meldung = err instanceof Error ? err.message : "Unbekannter Fehler.";
        fehler.push(`${datei.name}: ${meldung}`);
      }
    }

    setWirdHochgeladen(false);
    e.target.value = ""; // erneuten Upload derselben Datei ermöglichen

    if (fehler.length > 0) {
      alert(`Fehler beim Hochladen:\n\n${fehler.join("\n")}`);
    }
  }

  if (variante === "icon") {
    return (
      <>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={wirdHochgeladen}
          aria-label="Datei anhängen"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[#64748b] hover:bg-slate-50 disabled:opacity-50"
        >
          {wirdHochgeladen ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
        </button>
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={wirdHochgeladen}
        className="flex items-center gap-1.5 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#475569] hover:bg-slate-50 disabled:opacity-50"
      >
        {wirdHochgeladen ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
        {wirdHochgeladen ? "Lädt hoch..." : label}
      </button>
    </>
  );
}
