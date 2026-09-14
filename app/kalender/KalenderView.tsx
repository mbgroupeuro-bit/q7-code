// app/kalender/KalenderView.tsx (Client Component)
// Aktualisiert 04.09.2026 — Kalender-Basismodul:
// - Termine sind bereichsbezogen (bereich_id). Formular zeigt Bereich nur
//   als Auswahl, wenn sieht_alle_bereiche = true, sonst fest der eigene
//   Bereich.
// - Fällige, offene Aufgaben werden zusätzlich als reine Anzeige in
//   Tag-/Wochenansicht (eigene Zeile) und Monatsansicht (eigener Chip-Stil)
//   eingeblendet — kein eigener Termin-Datensatz (Grill-Me-Entscheidung
//   "Option B"). Optisch unterschieden durch gestrichelten, neutralen Chip
//   plus Kästchen-Symbol, damit sie nie mit einem echten Termin verwechselt
//   werden.
//
// Ursprüngliches Layout (rechte Spalte: Mini-Monat → Meine Aufgaben →
// Erledigte Aufgaben) bleibt unverändert bestehen.
//
// Geändert 13.09.2026 (Kalender-Fixes-Session), Punkt 1 der Übergabe
// "Q7 – Kalender-Fixes": Termine waren in keiner Ansicht klickbar/
// bearbeitbar. Lösung (Variante a, mit Mokid abgestimmt): dasselbe
// Formular wie beim Neu-Anlegen wird jetzt auch fürs Bearbeiten genutzt,
// vorausgefüllt mit den Werten des angeklickten Termins. Klick-Handler
// wurden in allen vier Ansichten ergänzt (Liste, Tag, Woche, Monat).
// Bereich ist im Bearbeiten-Modus bewusst nicht änderbar (siehe
// TerminAktualisieren in adapter-interface.ts — Bereichswechsel eines
// bestehenden Termins ist ein eigenständiges, noch nicht besprochenes
// Thema wegen Sichtbarkeits-Konsequenzen für andere Mitarbeiter).

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import EintragDialog from "@/lib/verdrahtung/EintragDialog";

type Termin = {
  id: string;
  titel: string;
  beschreibung: string | null;
  start: string;
  ende: string;
  farbe: string;
  bereich_id: string;
  bereich_name: string;
};

type Aufgabe = {
  id: string;
  titel: string;
  faelligkeit: string | null;
  status: string;
};

type ErledigteAufgabe = {
  id: string;
  titel: string;
};

type Bereich = {
  id: string;
  name: string;
};

type MitarbeiterKontext = {
  id: string;
  bereich_id: string;
  bereich_name: string;
  sieht_alle_bereiche: boolean;
};

type Ansicht = "liste" | "tag" | "woche" | "monat";

const FARBEN: Record<string, { bg: string; kante: string; text: string; label: string }> = {
  blau: { bg: "bg-blue-50", kante: "border-blue-500", text: "text-blue-800", label: "Blau" },
  rot: { bg: "bg-red-50", kante: "border-red-500", text: "text-red-800", label: "Rot" },
  orange: { bg: "bg-orange-50", kante: "border-orange-500", text: "text-orange-800", label: "Orange" },
  gelb: { bg: "bg-amber-50", kante: "border-amber-500", text: "text-amber-800", label: "Gelb" },
  gruen: { bg: "bg-green-50", kante: "border-green-500", text: "text-green-800", label: "Grün" },
  lila: { bg: "bg-purple-50", kante: "border-purple-500", text: "text-purple-800", label: "Lila" },
};

const STUNDEN = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00–19:00

// Geändert 13.09.2026 (Kalender-Fixes-Session), Punkt 4 der Übergabe
// "Q7 – Kalender-Fixes": toISOString() liefert UTC, nicht lokale Zeit.
// Die Wochentag-Spalten wurden über new Date(jahr, monat, tag) (lokale
// Mitternacht) gebaut und DANACH mit toISOString() in UTC umgewandelt —
// bei UTC+2 (deutscher Sommerzeit) rutscht z.B. lokale Mitternacht des
// 18.09. auf 17.09. 22:00 UTC, wodurch die Spalte "18.09." intern den
// Schlüssel "17.09." bekam. Ein Termin am 17.09. tagsüber (UTC-Zeit noch
// am selben Tag) bekam ebenfalls den Schlüssel "17.09." — beide trafen
// sich fälschlich, der Termin erschien unter der sichtbar falschen Spalte.
// Betraf praktisch jeden Termin, nicht nur späte Uhrzeiten. Fix: rein
// lokale Datumskomponenten verwenden, kein UTC-Umweg mehr.
function tagStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // Montag = 0
  const res = new Date(d);
  res.setDate(d.getDate() - day);
  res.setHours(0, 0, 0, 0);
  return res;
}

function formatTag(d: Date): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }).format(d);
}

function formatZeit(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function formatDatum(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

// Für datetime-local-Inputs: ISO-String -> "YYYY-MM-DDTHH:mm" in lokaler
// Zeit (nicht UTC, sonst würde ein Termin beim Bearbeiten in der falschen
// Stunde/am falschen Tag im Formular erscheinen).
function isoZuDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function faelligkeitLabel(iso: string | null): string {
  if (!iso) return "—";
  const heute = tagStr(new Date());
  const datum = tagStr(new Date(iso));
  if (datum === heute) return "Heute";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(new Date(iso));
}

// Kleiner, neutraler Chip für fällige Aufgaben — bewusst optisch anders als
// ein Termin (gestrichelt, grau, Kästchen-Symbol), damit nie der Eindruck
// entsteht, es handle sich um einen echten Termin.
function AufgabenChip({ titel }: { titel: string }) {
  return (
    <div className="flex items-center gap-1 truncate rounded-[4px] border-l-[3px] border-dashed border-slate-400 bg-slate-50 px-1.5 py-0.5 text-[10.5px] text-slate-600">
      <span aria-hidden="true">☐</span>
      <span className="truncate">{titel}</span>
    </div>
  );
}

export default function KalenderView({
  mitarbeiter,
  bereiche,
  initialTermine,
  initialAufgaben,
  initialErledigt,
}: {
  mitarbeiter: MitarbeiterKontext;
  bereiche: Bereich[];
  initialTermine: Termin[];
  initialAufgaben: Aufgabe[];
  initialErledigt: ErledigteAufgabe[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [ansicht, setAnsicht] = useState<Ansicht>("woche");
  const [bezugsdatum, setBezugsdatum] = useState(new Date());
  const [formOffen, setFormOffen] = useState(false);
  // null = Neu-Anlegen-Modus, sonst ID des gerade bearbeiteten Termins.
  const [bearbeitungId, setBearbeitungId] = useState<string | null>(null);
  // Geändert 13.09.2026: "+ Neuer Termin" öffnet jetzt den gemeinsamen
  // EintragDialog (Termin/Aufgabe-Tabs) statt dieses Inline-Formular hier.
  // formOffen/bearbeitungId dienen ab jetzt ausschließlich dem BEARBEITEN
  // bestehender Termine (ausgelöst über terminBearbeiten beim Anklicken).
  const [dialogOffen, setDialogOffen] = useState(false);
  const [titel, setTitel] = useState("");
  const [startZeit, setStartZeit] = useState("");
  const [endeZeit, setEndeZeit] = useState("");
  const [farbe, setFarbe] = useState("blau");
  const [bereichId, setBereichId] = useState(mitarbeiter.bereich_id);
  const [bereichName, setBereichName] = useState(mitarbeiter.bereich_name);

  const termine = initialTermine;
  const heute = tagStr(new Date());

  // Nur Aufgaben mit gesetzter Fälligkeit werden im Kalender selbst
  // eingeblendet (Sidebar-Widget unten zeigt weiterhin alle offenen
  // Aufgaben, unabhängig von Fälligkeit).
  const faelligeAufgaben = useMemo(
    () => initialAufgaben.filter((a) => a.faelligkeit !== null),
    [initialAufgaben]
  );

  function formularZuruecksetzen() {
    setTitel("");
    setStartZeit("");
    setEndeZeit("");
    setFarbe("blau");
    setBereichId(mitarbeiter.bereich_id);
    setBereichName(mitarbeiter.bereich_name);
    setBearbeitungId(null);
  }

  function terminBearbeiten(t: Termin) {
    setBearbeitungId(t.id);
    setTitel(t.titel);
    setStartZeit(isoZuDatetimeLocal(t.start));
    setEndeZeit(isoZuDatetimeLocal(t.ende));
    setFarbe(t.farbe);
    setBereichId(t.bereich_id);
    setBereichName(t.bereich_name);
    setFormOffen(true);
  }

  function formularAbbrechen() {
    formularZuruecksetzen();
    setFormOffen(false);
  }

  async function termineSpeichern(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim() || !startZeit || !endeZeit) return;

    if (bearbeitungId) {
      // Bearbeiten: bereich_id bewusst NICHT mitgeschickt (siehe
      // TerminAktualisieren — Bereichswechsel ist nicht Teil dieser
      // Änderung).
      await fetch(`/api/termine/${bearbeitungId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titel, start: startZeit, ende: endeZeit, farbe }),
      });
    } else {
      await fetch("/api/termine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titel, start: startZeit, ende: endeZeit, farbe, bereich_id: bereichId }),
      });
    }

    formularZuruecksetzen();
    setFormOffen(false);
    startTransition(() => router.refresh());
  }

  async function termineLoeschen(id: string) {
    await fetch(`/api/termine/${id}`, { method: "DELETE" });
    if (bearbeitungId === id) {
      formularZuruecksetzen();
      setFormOffen(false);
    }
    startTransition(() => router.refresh());
  }

  function navigiere(richtung: -1 | 1) {
    const neu = new Date(bezugsdatum);
    if (ansicht === "tag") neu.setDate(neu.getDate() + richtung);
    else if (ansicht === "woche") neu.setDate(neu.getDate() + richtung * 7);
    else neu.setMonth(neu.getMonth() + richtung);
    setBezugsdatum(neu);
  }

  const wochenTage = useMemo(() => {
    const start = startOfWeek(bezugsdatum);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [bezugsdatum]);

  const monatsGrid = useMemo(() => {
    const jahr = bezugsdatum.getFullYear();
    const monat = bezugsdatum.getMonth();
    const ersterTag = new Date(jahr, monat, 1);
    const start = startOfWeek(ersterTag);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [bezugsdatum]);

  // Mini-Monatsübersicht folgt immer dem heutigen Kalendermonat, unabhängig
  // von der Hauptansicht-Navigation (bewusst entkoppelt, wie im Mockup)
  const miniMonatGrid = useMemo(() => {
    const jetzt = new Date();
    const start = startOfWeek(new Date(jetzt.getFullYear(), jetzt.getMonth(), 1));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  function termineAmTag(d: Date): Termin[] {
    const key = tagStr(d);
    return termine.filter((t) => tagStr(new Date(t.start)) === key);
  }

  function aufgabenAmTag(d: Date): Aufgabe[] {
    const key = tagStr(d);
    return faelligeAufgaben.filter((a) => tagStr(new Date(a.faelligkeit as string)) === key);
  }

  function terminPosition(t: Termin) {
    const s = new Date(t.start);
    const e = new Date(t.ende);
    const startMin = s.getHours() * 60 + s.getMinutes() - STUNDEN[0] * 60;
    const dauerMin = (e.getTime() - s.getTime()) / 60000;
    return { top: `${(startMin / 60) * 48}px`, height: `${Math.max((dauerMin / 60) * 48, 20)}px` };
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
      <div>
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex rounded-[8px] border border-[#e2e8f0] bg-white p-0.5">
            {(["liste", "tag", "woche", "monat"] as Ansicht[]).map((a) => (
              <button
                key={a}
                onClick={() => setAnsicht(a)}
                className={`rounded-[6px] px-3 py-1.5 text-sm font-medium capitalize ${
                  ansicht === a ? "bg-[#2563eb] text-white" : "text-[#475569] hover:bg-[#eef2f7]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {ansicht !== "liste" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigiere(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#eef2f7]"
                aria-label="Zurück"
              >
                ‹
              </button>
              <button
                onClick={() => setBezugsdatum(new Date())}
                className="rounded-[6px] border border-[#e2e8f0] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#eef2f7]"
              >
                Heute
              </button>
              <button
                onClick={() => navigiere(1)}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#eef2f7]"
                aria-label="Weiter"
              >
                ›
              </button>
            </div>
          )}

          <button
            onClick={() => setDialogOffen(true)}
            className="ml-auto rounded-[8px] bg-[#2563eb] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Neuer Eintrag
          </button>
        </div>

        <EintragDialog
          offen={dialogOffen}
          onClose={() => setDialogOffen(false)}
          onGespeichert={() => startTransition(() => router.refresh())}
          standardTab="termin"
          mitarbeiter={mitarbeiter}
          bereiche={bereiche}
        />

        {formOffen && (
          <form
            onSubmit={termineSpeichern}
            className="mb-4 flex flex-wrap items-end gap-2 rounded-[10px] border border-[#e2e8f0] bg-white p-4"
          >
            {bearbeitungId && (
              <div className="mb-1 w-full text-[12px] font-medium text-[#2563eb]">Termin bearbeiten</div>
            )}
            <div className="flex-1 min-w-[160px]">
              <label className="mb-1 block text-[12px] font-medium text-[#64748b]">Titel</label>
              <input
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="z.B. Fokuszeit"
                className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#64748b]">Start</label>
              <input
                type="datetime-local"
                value={startZeit}
                onChange={(e) => setStartZeit(e.target.value)}
                className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#64748b]">Ende</label>
              <input
                type="datetime-local"
                value={endeZeit}
                onChange={(e) => setEndeZeit(e.target.value)}
                className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#64748b]">Farbe</label>
              <select
                value={farbe}
                onChange={(e) => setFarbe(e.target.value)}
                className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
              >
                {Object.entries(FARBEN).map(([key, v]) => (
                  <option key={key} value={key}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#64748b]">Bereich</label>
              {bearbeitungId ? (
                // Im Bearbeiten-Modus bewusst nicht änderbar (siehe
                // TerminAktualisieren in adapter-interface.ts).
                <div
                  className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-sm text-[#64748b]"
                  title="Bereich kann nachträglich nicht geändert werden."
                >
                  {bereichName}
                </div>
              ) : mitarbeiter.sieht_alle_bereiche ? (
                <select
                  value={bereichId}
                  onChange={(e) => setBereichId(e.target.value)}
                  className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                >
                  {bereiche.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <div className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-sm text-[#64748b]">
                  {mitarbeiter.bereich_name}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!titel.trim() || !startZeit || !endeZeit}
              className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {bearbeitungId ? "Änderungen speichern" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={formularAbbrechen}
              className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc]"
            >
              Abbrechen
            </button>
          </form>
        )}

        {/* LISTENANSICHT */}
        {ansicht === "liste" && (
          <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white">
            {termine.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[#64748b]">Keine Termine.</div>
            )}
            {termine.map((t) => {
              const f = FARBEN[t.farbe] ?? FARBEN.blau;
              return (
                <div key={t.id} className={`flex items-center gap-3 border-b border-l-[3px] ${f.kante} border-[#e2e8f0] px-4 py-3 last:border-b-0`}>
                  <button
                    type="button"
                    onClick={() => terminBearbeiten(t)}
                    className="flex-1 text-left hover:opacity-80"
                    title="Klicken zum Bearbeiten"
                  >
                    <div className="text-sm font-medium">{t.titel}</div>
                    <div className="text-[12px] text-[#64748b]">
                      {formatDatum(t.start)} · {formatZeit(t.start)}–{formatZeit(t.ende)}
                      {mitarbeiter.sieht_alle_bereiche && <> · {t.bereich_name}</>}
                    </div>
                  </button>
                  <button
                    onClick={() => termineLoeschen(t.id)}
                    className="text-[12px] text-[#94a3b8] hover:text-red-600"
                  >
                    Löschen
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAGESANSICHT */}
        {ansicht === "tag" && (
          <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white">
            <div className="border-b border-[#e2e8f0] px-4 py-2 text-sm font-medium">{formatTag(bezugsdatum)}</div>

            {aufgabenAmTag(bezugsdatum).length > 0 && (
              <div className="flex flex-wrap gap-1 border-b border-[#e2e8f0] px-4 py-1.5">
                {aufgabenAmTag(bezugsdatum).map((a) => (
                  <AufgabenChip key={a.id} titel={a.titel} />
                ))}
              </div>
            )}

            <div className="relative" style={{ height: `${STUNDEN.length * 48}px` }}>
              {STUNDEN.map((h) => (
                <div key={h} className="absolute left-0 right-0 border-t border-[#f1f5f9]" style={{ top: `${(h - STUNDEN[0]) * 48}px` }}>
                  <span className="absolute -top-2 left-2 text-[10px] text-[#94a3b8]">{h}:00</span>
                </div>
              ))}
              <div className="absolute left-14 right-2 top-0 bottom-0">
                {termineAmTag(bezugsdatum).map((t) => {
                  const f = FARBEN[t.farbe] ?? FARBEN.blau;
                  const pos = terminPosition(t);
                  return (
                    <div
                      key={t.id}
                      onClick={() => terminBearbeiten(t)}
                      role="button"
                      tabIndex={0}
                      title="Klicken zum Bearbeiten"
                      style={{ position: "absolute", top: pos.top, height: pos.height, left: 0, right: 0 }}
                      className={`cursor-pointer overflow-hidden rounded-r-[4px] border-l-[3px] ${f.kante} ${f.bg} px-2 py-1 text-[12px] ${f.text} hover:opacity-80`}
                    >
                      <div className="font-medium truncate">{t.titel}</div>
                      <div className="truncate">{formatZeit(t.start)}–{formatZeit(t.ende)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WOCHENANSICHT */}
        {ansicht === "woche" && (
          <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white">
            <div className="grid grid-cols-[44px_repeat(7,1fr)] border-b border-[#e2e8f0]">
              <div />
              {wochenTage.map((d) => (
                <div
                  key={tagStr(d)}
                  className={`border-l border-[#e2e8f0] px-2 py-2 text-center text-[12px] font-medium ${
                    tagStr(d) === heute ? "text-[#2563eb]" : ""
                  }`}
                >
                  {formatTag(d)}
                </div>
              ))}
            </div>

            {/* Fällige Aufgaben je Tag — reine Anzeige, kein Termin-Datensatz */}
            {faelligeAufgaben.length > 0 && (
              <div className="grid grid-cols-[44px_repeat(7,1fr)] border-b border-[#e2e8f0]">
                <div />
                {wochenTage.map((d) => (
                  // min-w-0 ist hier entscheidend (Punkt 3 der Kalender-Fixes,
                  // 13.09.2026): Ohne min-w-0 verhält sich eine 1fr-Grid-Spalte
                  // wie minmax(auto, 1fr) — sie kann NICHT unter die
                  // intrinsische Mindestbreite ihres Inhalts schrumpfen. Ein
                  // langer, wegen "truncate" (white-space: nowrap) nicht
                  // umbrechbarer Aufgaben-Titel konnte dadurch genau die
                  // Spalte des Tages, an dem die Aufgabe hängt, breiter als
                  // die übrigen sechs Tage aufblähen (beobachtet: Montag
                  // sichtbar breiter als die restlichen Wochentage).
                  // min-w-0 erzwingt, dass die Spalte trotzdem auf 1fr
                  // schrumpft und der Inhalt stattdessen wie vorgesehen
                  // per truncate abgeschnitten wird.
                  <div key={`aufg-${tagStr(d)}`} className="min-w-0 space-y-0.5 border-l border-[#e2e8f0] p-1">
                    {aufgabenAmTag(d).map((a) => (
                      <AufgabenChip key={a.id} titel={a.titel} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="relative grid grid-cols-[44px_repeat(7,1fr)]" style={{ height: `${STUNDEN.length * 48}px` }}>
              {/* Durchgehende horizontale Stundenlinien über die volle Breite */}
              {STUNDEN.map((h) => (
                <div
                  key={h}
                  className="absolute left-[44px] right-0 border-t border-[#f1f5f9]"
                  style={{ top: `${(h - STUNDEN[0]) * 48}px` }}
                />
              ))}

              <div className="relative">
                {STUNDEN.map((h) => (
                  <span key={h} className="absolute left-1 text-[10px] text-[#94a3b8]" style={{ top: `${(h - STUNDEN[0]) * 48 - 6}px` }}>
                    {h}:00
                  </span>
                ))}
              </div>
              {wochenTage.map((d) => (
                <div key={tagStr(d)} className="relative border-l border-[#e2e8f0]">
                  {termineAmTag(d).map((t) => {
                    const f = FARBEN[t.farbe] ?? FARBEN.blau;
                    const pos = terminPosition(t);
                    return (
                      <div
                        key={t.id}
                        onClick={() => terminBearbeiten(t)}
                        role="button"
                        tabIndex={0}
                        title="Klicken zum Bearbeiten"
                        style={{ position: "absolute", top: pos.top, height: pos.height, left: 2, right: 2 }}
                        className={`cursor-pointer overflow-hidden rounded-r-[4px] border-l-[3px] ${f.kante} ${f.bg} px-1 text-[10.5px] ${f.text} hover:opacity-80`}
                      >
                        <div className="font-medium truncate">{t.titel}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MONATSANSICHT (V1 — einfache Chips, Balken über mehrere Tage folgt später) */}
        {ansicht === "monat" && (
          <div className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white">
            <div className="grid grid-cols-7 border-b border-[#e2e8f0] text-center text-[11px] font-medium text-[#64748b]">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
                <div key={d} className="border-l border-[#e2e8f0] py-1.5 first:border-l-0">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monatsGrid.map((d) => {
                const imMonat = d.getMonth() === bezugsdatum.getMonth();
                const tagesTermine = termineAmTag(d);
                const tagesAufgaben = aufgabenAmTag(d);
                const gesamtAnzahl = tagesTermine.length + tagesAufgaben.length;
                const sichtbareTermine = tagesTermine.slice(0, 3);
                const restplatz = Math.max(3 - sichtbareTermine.length, 0);
                const sichtbareAufgaben = tagesAufgaben.slice(0, restplatz);
                const mehrAnzahl = gesamtAnzahl - sichtbareTermine.length - sichtbareAufgaben.length;

                return (
                  <div
                    key={tagStr(d)}
                    className={`min-h-[92px] border-b border-l border-[#e2e8f0] p-1 first:border-l-0 ${imMonat ? "" : "bg-[#f8fafc]"}`}
                  >
                    <div className={`mb-1 text-[11px] ${imMonat ? "text-[#0f172a]" : "text-[#cbd5e1]"} ${tagStr(d) === heute ? "font-bold text-[#2563eb]" : ""}`}>
                      {d.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {sichtbareTermine.map((t) => {
                        const f = FARBEN[t.farbe] ?? FARBEN.blau;
                        return (
                          <div
                            key={t.id}
                            onClick={() => terminBearbeiten(t)}
                            role="button"
                            tabIndex={0}
                            title="Klicken zum Bearbeiten"
                            className={`cursor-pointer truncate rounded-[3px] border-l-[3px] ${f.kante} ${f.bg} px-1 text-[10px] ${f.text} hover:opacity-80`}
                          >
                            {t.titel}
                          </div>
                        );
                      })}
                      {sichtbareAufgaben.map((a) => (
                        <AufgabenChip key={a.id} titel={a.titel} />
                      ))}
                      {mehrAnzahl > 0 && (
                        <div className="text-[10px] text-[#94a3b8]">+{mehrAnzahl} mehr</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RECHTE SPALTE: Mini-Monat → Meine Aufgaben → Erledigte Aufgaben */}
      <div className="flex flex-col gap-4">
        {/* Mini-Monatsübersicht */}
        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-2.5 text-sm font-semibold">
            {new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date())}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
              <span key={d} className="text-[10px] text-[#94a3b8]">{d}</span>
            ))}
            {miniMonatGrid.map((d) => {
              const imMonat = d.getMonth() === new Date().getMonth();
              const hatTermin = termineAmTag(d).length > 0;
              const istHeute = tagStr(d) === heute;
              return (
                <div key={tagStr(d)} className="relative py-0.5">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                      istHeute
                        ? "bg-[#2563eb] font-semibold text-white"
                        : imMonat
                        ? "text-[#0f172a]"
                        : "text-[#cbd5e1]"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {hatTermin && !istHeute && (
                    <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#2563eb]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Meine Aufgaben */}
        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-3 text-sm font-semibold">Meine Aufgaben</div>
          {initialAufgaben.length === 0 && (
            <div className="text-[12.5px] text-[#94a3b8]">Keine offenen Aufgaben.</div>
          )}
          <div className="space-y-2">
            {initialAufgaben.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 text-[12.5px]">
                <span className="text-[#0f172a]">{a.titel}</span>
                <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
                  {faelligkeitLabel(a.faelligkeit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Erledigte Aufgaben */}
        <div className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-[#64748b]">Erledigte Aufgaben</div>
          {initialErledigt.length === 0 && (
            <div className="text-[12.5px] text-[#94a3b8]">Noch keine erledigten Aufgaben.</div>
          )}
          <div className="space-y-2">
            {initialErledigt.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-[12.5px] text-[#94a3b8] line-through">
                <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-[9px] text-green-700 no-underline">✓</span>
                {a.titel}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
