// Basismodul "Meine Aufgaben" — Detail-Komponente (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\[id]\AufgabeDetail.tsx
//
// Änderung (04.09.2026, 1): Dritter Status "in_bearbeitung" — Status jetzt
// als 3-Optionen-Auswahl statt 2-Wege-Toggle-Button.
//
// Änderung (04.09.2026, 2): Nummer-Anzeige, Tags-Editor (Chips + Hinzufügen/
// Entfernen) und Datei-Anhänge (Upload per FileReader -> Base64, Liste,
// Löschen) ergänzt.

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MeineAufgabeMitVerlauf, Prioritaet, Teilaufgabe, AufgabenStatus } from "@/lib/aufgaben-interface";

const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  hoch: "Hoch",
  normal: "Normal",
  niedrig: "Niedrig",
};

const PRIORITAET_FARBE: Record<Prioritaet, string> = {
  hoch: "bg-red-100 text-red-700",
  normal: "bg-slate-100 text-slate-600",
  niedrig: "bg-blue-100 text-blue-600",
};

const STATUS_LABEL: Record<AufgabenStatus, string> = {
  offen: "Offen",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
};

const STATUS_FARBE: Record<AufgabenStatus, string> = {
  offen: "bg-amber-100 text-amber-700",
  in_bearbeitung: "bg-blue-100 text-blue-700",
  erledigt: "bg-green-100 text-green-700",
};

const FARBE_OPTIONEN: { wert: string; hex: string }[] = [
  { wert: "rot", hex: "#ef4444" },
  { wert: "orange", hex: "#f59e0b" },
  { wert: "gelb", hex: "#eab308" },
  { wert: "blau", hex: "#3b82f6" },
  { wert: "gruen", hex: "#10b981" },
  { wert: "lila", hex: "#8b5cf6" },
];

const VERLAUF_TYP_LABEL: Record<string, string> = {
  kommentar: "Kommentar",
  weiterleitung: "Weiterleitung",
  status_geaendert: "Statusänderung",
};

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dateiZuBase64(datei: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ergebnis = reader.result as string;
      // "data:<mime>;base64,<daten>" -> nur den Teil nach dem Komma nehmen
      const [kopf, daten] = ergebnis.split(",");
      const mimeMatch = kopf.match(/data:(.*);base64/);
      resolve({ base64: daten, mimeType: mimeMatch?.[1] ?? datei.type ?? "application/octet-stream" });
    };
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(datei);
  });
}

export default function AufgabeDetail({
  initialAufgabe,
  mitarbeiterListe,
}: {
  initialAufgabe: MeineAufgabeMitVerlauf;
  mitarbeiterListe: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [kommentar, setKommentar] = useState("");
  const [neueTeilaufgabe, setNeueTeilaufgabe] = useState("");
  const [weiterleitungKommentar, setWeiterleitungKommentar] = useState("");
  const [terminFormOffen, setTerminFormOffen] = useState(false);
  const [terminStart, setTerminStart] = useState("");
  const [terminEnde, setTerminEnde] = useState("");
  const [neuerTag, setNeuerTag] = useState("");
  const [uploadLaeuft, setUploadLaeuft] = useState(false);
  const [uploadFehler, setUploadFehler] = useState<string | null>(null);
  const dateiInputRef = useRef<HTMLInputElement>(null);
  const aufgabe = initialAufgabe;

  async function statusAendern(neuerStatus: AufgabenStatus) {
    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: neuerStatus }),
    });

    if (!res.ok) {
      alert("Fehler: Status konnte nicht geaendert werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function prioritaetAendern(neuePrioritaet: Prioritaet) {
    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prioritaet: neuePrioritaet }),
    });

    if (!res.ok) {
      alert("Fehler: Prioritaet konnte nicht geaendert werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function farbeAendern(neueFarbe: string) {
    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ farbe: neueFarbe }),
    });

    if (!res.ok) {
      alert("Fehler: Farbe konnte nicht geaendert werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function tagsAktualisieren(neueTags: string[]) {
    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: neueTags }),
    });

    if (!res.ok) {
      alert("Fehler: Tags konnten nicht aktualisiert werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  function tagHinzufuegen(e: React.FormEvent) {
    e.preventDefault();
    const wert = neuerTag.trim();
    if (!wert || aufgabe.tags.includes(wert)) {
      setNeuerTag("");
      return;
    }
    setNeuerTag("");
    tagsAktualisieren([...aufgabe.tags, wert]);
  }

  function tagEntfernen(tag: string) {
    tagsAktualisieren(aufgabe.tags.filter((t) => t !== tag));
  }

  async function weiterleiten(an: string) {
    if (!an || an === aufgabe.zugewiesen_an) return;

    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/weiterleiten`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        an,
        kommentar: weiterleitungKommentar.trim() || undefined,
      }),
    });

    if (!res.ok) {
      alert("Fehler: Aufgabe konnte nicht weitergeleitet werden. Bitte erneut versuchen.");
      return;
    }

    setWeiterleitungKommentar("");
    startTransition(() => router.refresh());
  }

  async function terminAnfordern(e: React.FormEvent) {
    e.preventDefault();
    if (!terminStart || !terminEnde) return;

    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/termin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: new Date(terminStart).toISOString(),
        ende: new Date(terminEnde).toISOString(),
      }),
    });

    if (!res.ok) {
      alert("Fehler: Termin konnte nicht angefragt werden. Bitte erneut versuchen.");
      return;
    }

    setTerminStart("");
    setTerminEnde("");
    setTerminFormOffen(false);
    startTransition(() => router.refresh());
  }

  async function kommentarSenden(e: React.FormEvent) {
    e.preventDefault();
    if (!kommentar.trim()) return;

    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/verlauf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: kommentar }),
    });

    if (!res.ok) {
      alert("Fehler: Kommentar konnte nicht gespeichert werden. Bitte erneut versuchen.");
      return;
    }

    setKommentar("");
    startTransition(() => router.refresh());
  }

  async function teilaufgabeAnlegen(e: React.FormEvent) {
    e.preventDefault();
    if (!neueTeilaufgabe.trim()) return;

    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/teilaufgaben`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titel: neueTeilaufgabe }),
    });

    if (!res.ok) {
      alert("Fehler: Teilaufgabe konnte nicht angelegt werden. Bitte erneut versuchen.");
      return;
    }

    setNeueTeilaufgabe("");
    startTransition(() => router.refresh());
  }

  async function teilaufgabeStatusWechseln(teilaufgabe: Teilaufgabe) {
    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/teilaufgaben/${teilaufgabe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: teilaufgabe.status === "offen" ? "erledigt" : "offen" }),
    });

    if (!res.ok) {
      alert("Fehler: Status konnte nicht geaendert werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function dateiHochladen(e: React.ChangeEvent<HTMLInputElement>) {
    const datei = e.target.files?.[0];
    if (!datei) return;

    setUploadFehler(null);
    setUploadLaeuft(true);

    try {
      const { base64, mimeType } = await dateiZuBase64(datei);

      const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/anhaenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateiname: datei.name, inhaltBase64: base64, mimeType }),
      });

      if (!res.ok) {
        const daten = await res.json().catch(() => null);
        throw new Error(daten?.error ?? "Upload fehlgeschlagen.");
      }

      startTransition(() => router.refresh());
    } catch (err) {
      setUploadFehler(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploadLaeuft(false);
      if (dateiInputRef.current) dateiInputRef.current.value = "";
    }
  }

  async function anhangLoeschen(anhangId: string) {
    if (!confirm("Anhang wirklich löschen?")) return;

    const res = await fetch(`/api/meine-aufgaben/${aufgabe.id}/anhaenge/${anhangId}`, { method: "DELETE" });

    if (!res.ok) {
      alert("Fehler: Anhang konnte nicht geloescht werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <button
        onClick={() => router.push("/aufgaben")}
        className="mb-4 text-[13px] text-[#2563eb] hover:underline"
      >
        ← Zurück zur Liste
      </button>

      <div className="rounded-[12px] border border-[#e2e8f0] p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h1 className="text-[19px] font-semibold">
            {aufgabe.nummer !== null && (
              <span className="mr-1.5 font-normal text-[#94a3b8]">#{aufgabe.nummer}</span>
            )}
            {aufgabe.titel}
          </h1>
          <select
            value={aufgabe.status}
            onChange={(e) => statusAendern(e.target.value as AufgabenStatus)}
            disabled={isPending}
            className={`shrink-0 rounded-full border-0 px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_FARBE[aufgabe.status]}`}
          >
            {(Object.keys(STATUS_LABEL) as AufgabenStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select
            value={aufgabe.prioritaet ?? ""}
            onChange={(e) => prioritaetAendern(e.target.value as Prioritaet)}
            disabled={isPending}
            className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[12px]"
          >
            <option value="" disabled>
              Priorität wählen
            </option>
            <option value="hoch">Hoch</option>
            <option value="normal">Normal</option>
            <option value="niedrig">Niedrig</option>
          </select>

          <div className="flex gap-1">
            {FARBE_OPTIONEN.map((f) => (
              <button
                key={f.wert}
                onClick={() => farbeAendern(f.wert)}
                disabled={isPending}
                aria-label={`Farbe ${f.wert}`}
                style={{ backgroundColor: f.hex }}
                className={`h-[20px] w-[20px] rounded-[5px] ${
                  aufgabe.farbe === f.wert ? "ring-2 ring-offset-1 ring-[#0f172a]" : ""
                }`}
              />
            ))}
          </div>

          {aufgabe.projekt_id && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] text-indigo-600">
              {aufgabe.projekt_id}
            </span>
          )}
          {aufgabe.faelligkeit && (
            <span className="text-[11.5px] text-[#64748b]">
              Fällig: {formatDatum(aufgabe.faelligkeit)}
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={aufgabe.zugewiesen_an}
            onChange={(e) => weiterleiten(e.target.value)}
            disabled={isPending}
            className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[12px]"
          >
            <option value={aufgabe.zugewiesen_an}>Zuständig: {aufgabe.zugewiesen_an}</option>
            {mitarbeiterListe
              .filter((m) => m !== aufgabe.zugewiesen_an)
              .map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
          </select>
          <input
            value={weiterleitungKommentar}
            onChange={(e) => setWeiterleitungKommentar(e.target.value)}
            placeholder="Kommentar zur Weiterleitung (optional)"
            className="min-w-[220px] flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1 text-[12px]"
          />
        </div>

        <div className="mb-4">
          <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Tags</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {aufgabe.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] text-slate-600"
              >
                #{t}
                <button
                  onClick={() => tagEntfernen(t)}
                  aria-label={`Tag ${t} entfernen`}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            ))}
            <form onSubmit={tagHinzufuegen}>
              <input
                value={neuerTag}
                onChange={(e) => setNeuerTag(e.target.value)}
                placeholder="+ Tag"
                className="w-[90px] rounded-full border border-dashed border-[#cbd5e1] px-2.5 py-0.5 text-[11.5px] focus:border-solid focus:border-[#2563eb] focus:outline-none"
              />
            </form>
          </div>
        </div>

        {aufgabe.beschreibung && (
          <>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">
              Beschreibung
            </div>
            <div className="mb-4 text-[13.5px]">{aufgabe.beschreibung}</div>
          </>
        )}

        {(aufgabe.absender || aufgabe.kontakt) && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            {aufgabe.absender && (
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">
                  Absender
                </div>
                <div className="text-[13.5px]">{aufgabe.absender}</div>
              </div>
            )}
            {aufgabe.kontakt && (
              <div>
                <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">
                  Kontakt
                </div>
                <div className="text-[13.5px]">{aufgabe.kontakt}</div>
              </div>
            )}
          </div>
        )}

        {aufgabe.original_nachricht && (
          <>
            <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">
              Original-Nachricht
            </div>
            <div className="mb-5 rounded-[8px] bg-[#f8fafc] px-3 py-2.5 text-[13px]">
              {aufgabe.original_nachricht}
            </div>
          </>
        )}

        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Anhänge</div>
          <button
            onClick={() => dateiInputRef.current?.click()}
            disabled={uploadLaeuft}
            className="text-[12px] font-medium text-[#2563eb] hover:underline disabled:opacity-50"
          >
            {uploadLaeuft ? "Lädt hoch…" : "+ Datei anhängen"}
          </button>
          <input ref={dateiInputRef} type="file" onChange={dateiHochladen} className="hidden" />
        </div>
        {uploadFehler && <div className="mb-2 text-[12px] text-red-600">{uploadFehler}</div>}
        <div className="mb-5 flex flex-col gap-1.5">
          {aufgabe.anhaenge.length === 0 && (
            <div className="text-[12.5px] text-[#64748b]">Keine Anhänge.</div>
          )}
          {aufgabe.anhaenge.map((anhang) => (
            <div
              key={anhang.id}
              className="flex items-center justify-between rounded-[8px] border border-[#e2e8f0] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">{anhang.dateiname}</div>
                <div className="text-[11px] text-[#94a3b8]">{formatGroesse(anhang.groesse)}</div>
              </div>
              <button
                onClick={() => anhangLoeschen(anhang.id)}
                aria-label={`${anhang.dateiname} löschen`}
                className="ml-2 shrink-0 text-[12px] text-red-600 hover:underline"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>

        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">
          Teilaufgaben
        </div>
        <div className="mb-3 flex flex-col gap-1">
          {aufgabe.teilaufgaben.length === 0 && (
            <div className="text-[12.5px] text-[#64748b]">Noch keine Teilaufgaben.</div>
          )}
          {aufgabe.teilaufgaben.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-1.5">
              <span
                className={`text-[13px] ${
                  t.status === "erledigt" ? "text-[#94a3b8] line-through" : ""
                }`}
              >
                {t.titel}
              </span>
              <button
                onClick={() => teilaufgabeStatusWechseln(t)}
                disabled={isPending}
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                  t.status === "erledigt"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {t.status === "erledigt" ? "Erledigt" : "Offen"}
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={teilaufgabeAnlegen} className="mb-5 flex gap-2">
          <input
            value={neueTeilaufgabe}
            onChange={(e) => setNeueTeilaufgabe(e.target.value)}
            placeholder="Neue Teilaufgabe..."
            className="flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
          />
          <button
            type="submit"
            disabled={!neueTeilaufgabe.trim() || isPending}
            className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            +
          </button>
        </form>

        <div className="mb-5">
          {!terminFormOffen ? (
            <button
              onClick={() => setTerminFormOffen(true)}
              className="rounded-[6px] border border-[#e2e8f0] px-3 py-1.5 text-[12.5px] font-medium hover:bg-[#f8fafc]"
            >
              📅 Termin hinzufügen
            </button>
          ) : (
            <form onSubmit={terminAnfordern} className="rounded-[8px] border border-[#e2e8f0] p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  value={terminStart}
                  onChange={(e) => setTerminStart(e.target.value)}
                  className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[12.5px]"
                />
                <input
                  type="datetime-local"
                  value={terminEnde}
                  onChange={(e) => setTerminEnde(e.target.value)}
                  className="rounded-[6px] border border-[#e2e8f0] px-2 py-1 text-[12.5px]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!terminStart || !terminEnde || isPending}
                  className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Termin anfragen
                </button>
                <button
                  type="button"
                  onClick={() => setTerminFormOffen(false)}
                  className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748b]"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">
          Verlauf
        </div>
        <div className="mb-3 flex flex-col gap-2">
          {aufgabe.verlauf.length === 0 && (
            <div className="text-[12.5px] text-[#64748b]">Noch keine Einträge.</div>
          )}
          {aufgabe.verlauf.map((v) => (
            <div key={v.id} className="border-l-2 border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]">
              <span className="text-[#64748b]">
                {formatDatum(v.erstellt_am)} — {v.erstellt_von} ({VERLAUF_TYP_LABEL[v.typ] ?? v.typ}):
              </span>{" "}
              {v.text}
            </div>
          ))}
        </div>

        <form onSubmit={kommentarSenden} className="flex gap-2">
          <input
            value={kommentar}
            onChange={(e) => setKommentar(e.target.value)}
            placeholder="Kommentar hinzufügen..."
            className="flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
          />
          <button
            type="submit"
            disabled={!kommentar.trim() || isPending}
            className="rounded-[6px] bg-[#2563eb] px-3.5 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Senden
          </button>
        </form>
      </div>
    </div>
  );
}
