// Projektspezifische, geteilte UI-Komponente: Termin/Aufgabe-Dialog
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\lib\verdrahtung\EintragDialog.tsx
//
// WICHTIG: Wie lib/verdrahtung/aufgaben-kalender-listener.ts ist dies KEIN
// Teil eines Basismoduls — wird beim Kopieren von Basismodule\kalender\
// oder Basismodule\aufgabenliste\ NICHT mitkopiert. Diese Komponente
// importiert bewusst NICHTS aus lib/kalender/* oder lib/aufgaben-*
// (keine Adapter, keine internen Typen) — nur fetch() gegen die
// öffentlichen API-Routen beider Module (POST /api/termine,
// POST /api/meine-aufgaben). Bereich/Mitarbeiter werden als einfache,
// lokal duplizierte Typen erwartet (Duck-Typing), damit beide Module
// unabhängig bleiben.
//
// Neu 13.09.2026 (Kalender-Fixes-Session): Gemeinsamer "Neuer Eintrag"-
// Dialog mit Tabs Termin/Aufgabe (Absprache mit Mokid, Grill-Me-Ergebnis
// REVISE — Variante 2: Aufgaben-Modul darf den Kalender kennen, nicht
// umgekehrt). Ersetzt die bisherigen getrennten "+ Neuer Termin"- und
// "+ Neue Aufgabe"-Formulare für NEUE Einträge. Das Bearbeiten
// bestehender Termine (Punkt 1 der Kalender-Fixes) bleibt unverändert im
// bestehenden Inline-Formular in KalenderView.tsx — dieser Dialog ist nur
// für NEUE Einträge zuständig.
//
// Design (mit Mokid abgestimmt, Variante 1 aus dem Mockup-Vergleich):
// Datum als eigenes Feld, Start/Ende als zwei separate Uhrzeit-Felder
// daneben. Termin-Standardfarbe: Blau. Aufgabe-Standardfarbe: Orange.

"use client";

import { useState } from "react";

type Bereich = { id: string; name: string };

type MitarbeiterKontext = {
  id: string;
  bereich_id: string;
  bereich_name: string;
  sieht_alle_bereiche: boolean;
};

type Prioritaet = "niedrig" | "normal" | "hoch";
type Tab = "termin" | "aufgabe";

function heutigesDatumStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Lokales Datum + Uhrzeit (aus zwei <input>-Feldern) in einen vollständigen
// ISO-Datum-Zeit-String für die Aufgaben-API (verlangt .datetime()).
function datumZeitZuIso(datumStr: string, zeitStr: string): string {
  const [jahr, monat, tag] = datumStr.split("-").map(Number);
  const [stunde, minute] = zeitStr.split(":").map(Number);
  return new Date(jahr, monat - 1, tag, stunde, minute).toISOString();
}

export default function EintragDialog({
  offen,
  onClose,
  onGespeichert,
  standardTab,
  mitarbeiter,
  bereiche,
}: {
  offen: boolean;
  onClose: () => void;
  onGespeichert: () => void;
  standardTab: Tab;
  mitarbeiter: MitarbeiterKontext | null;
  bereiche: Bereich[];
}) {
  const [tab, setTab] = useState<Tab>(standardTab);
  const [titel, setTitel] = useState("");
  const [speichertGerade, setSpeichertGerade] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  // Termin-Felder
  const [terminDatum, setTerminDatum] = useState(heutigesDatumStr());
  const [terminStart, setTerminStart] = useState("09:00");
  const [terminEnde, setTerminEnde] = useState("10:00");
  const [terminFarbe, setTerminFarbe] = useState("blau");
  const [bereichId, setBereichId] = useState(mitarbeiter?.bereich_id ?? "");

  // Aufgabe-Felder
  const [aufgabeDatum, setAufgabeDatum] = useState(heutigesDatumStr());
  const [aufgabeZeit, setAufgabeZeit] = useState("12:00");
  const [prioritaet, setPrioritaet] = useState<Prioritaet>("normal");
  const [aufgabeFarbe, setAufgabeFarbe] = useState("orange");

  if (!offen) return null;

  function zuruecksetzenUndSchliessen() {
    setTitel("");
    setTerminDatum(heutigesDatumStr());
    setTerminStart("09:00");
    setTerminEnde("10:00");
    setTerminFarbe("blau");
    setAufgabeDatum(heutigesDatumStr());
    setAufgabeZeit("12:00");
    setPrioritaet("normal");
    setAufgabeFarbe("orange");
    setFehler(null);
    onClose();
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim()) return;

    setSpeichertGerade(true);
    setFehler(null);
    try {
      if (tab === "termin") {
        const antwort = await fetch("/api/termine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titel,
            start: `${terminDatum}T${terminStart}`,
            ende: `${terminDatum}T${terminEnde}`,
            farbe: terminFarbe,
            bereich_id: mitarbeiter?.sieht_alle_bereiche ? bereichId : mitarbeiter?.bereich_id,
          }),
        });
        if (!antwort.ok) {
          setFehler("Termin konnte nicht gespeichert werden.");
          return;
        }
      } else {
        const antwort = await fetch("/api/meine-aufgaben", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titel,
            prioritaet,
            farbe: aufgabeFarbe,
            faelligkeit: datumZeitZuIso(aufgabeDatum, aufgabeZeit),
          }),
        });
        if (!antwort.ok) {
          setFehler("Aufgabe konnte nicht gespeichert werden.");
          return;
        }
      }

      onGespeichert();
      zuruecksetzenUndSchliessen();
    } finally {
      setSpeichertGerade(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div className="w-full max-w-[420px] rounded-[12px] border border-[#e2e8f0] bg-white p-6">
        <input
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel hinzufügen"
          autoFocus
          className="mb-4 w-full border-0 border-b border-[#e2e8f0] px-0 py-2 text-lg outline-none focus:border-[#2563eb]"
        />

        <div className="mb-5 flex gap-1.5">
          <button
            type="button"
            onClick={() => setTab("termin")}
            className={`flex-1 rounded-[8px] px-3 py-2 text-[13px] font-medium ${
              tab === "termin" ? "bg-blue-100 text-blue-700" : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            Termin
          </button>
          <button
            type="button"
            onClick={() => setTab("aufgabe")}
            className={`flex-1 rounded-[8px] px-3 py-2 text-[13px] font-medium ${
              tab === "aufgabe" ? "bg-blue-100 text-blue-700" : "text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            Aufgabe
          </button>
        </div>

        <form onSubmit={speichern}>
          {tab === "termin" ? (
            <>
              <div className="mb-3">
                <label className="mb-1 block text-[12px] text-[#64748b]">Datum</label>
                <input
                  type="date"
                  value={terminDatum}
                  onChange={(e) => setTerminDatum(e.target.value)}
                  className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                />
              </div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Start</label>
                  <input
                    type="time"
                    value={terminStart}
                    onChange={(e) => setTerminStart(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  />
                </div>
                <span className="pt-5 text-[#94a3b8]">–</span>
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Ende</label>
                  <input
                    type="time"
                    value={terminEnde}
                    onChange={(e) => setTerminEnde(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4 flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Farbe</label>
                  <select
                    value={terminFarbe}
                    onChange={(e) => setTerminFarbe(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  >
                    <option value="blau">Blau</option>
                    <option value="rot">Rot</option>
                    <option value="orange">Orange</option>
                    <option value="gelb">Gelb</option>
                    <option value="gruen">Grün</option>
                    <option value="lila">Lila</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Bereich</label>
                  {mitarbeiter?.sieht_alle_bereiche ? (
                    <select
                      value={bereichId}
                      onChange={(e) => setBereichId(e.target.value)}
                      className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                    >
                      {bereiche.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-sm text-[#64748b]">
                      {mitarbeiter?.bereich_name ?? "—"}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Fälligkeit</label>
                  <input
                    type="date"
                    value={aufgabeDatum}
                    onChange={(e) => setAufgabeDatum(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div style={{ width: 110 }}>
                  <label className="mb-1 block text-[12px] text-[#64748b]">Uhrzeit</label>
                  <input
                    type="time"
                    value={aufgabeZeit}
                    onChange={(e) => setAufgabeZeit(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="mb-4 flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Priorität</label>
                  <select
                    value={prioritaet}
                    onChange={(e) => setPrioritaet(e.target.value as Prioritaet)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  >
                    <option value="niedrig">Niedrig</option>
                    <option value="normal">Normal</option>
                    <option value="hoch">Hoch</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[12px] text-[#64748b]">Farbe</label>
                  <select
                    value={aufgabeFarbe}
                    onChange={(e) => setAufgabeFarbe(e.target.value)}
                    className="w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-sm"
                  >
                    <option value="orange">Orange</option>
                    <option value="blau">Blau</option>
                    <option value="rot">Rot</option>
                    <option value="gelb">Gelb</option>
                    <option value="gruen">Grün</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {fehler && <div className="mb-3 text-[13px] text-red-600">{fehler}</div>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!titel.trim() || speichertGerade}
              className="rounded-[6px] bg-[#2563eb] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {speichertGerade ? "Speichert…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={zuruecksetzenUndSchliessen}
              className="rounded-[6px] px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc]"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
