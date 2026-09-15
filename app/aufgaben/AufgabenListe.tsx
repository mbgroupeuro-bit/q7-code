// Basismodul "Meine Aufgaben" — Listen-Komponente (Client)
// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\aufgaben\AufgabenListe.tsx
//
// Änderung (04.09.2026, 1): "+ Neue Aufgabe"-Formular um Priorität und
// Fälligkeit ergänzt.
//
// Änderung (04.09.2026, 2): Layout-Fix — table-layout:fixed + einzeilige
// Beschreibung mit Ellipsis, damit sehr lange Texte nicht mehr Fälligkeit/
// Status/Button aus dem sichtbaren Bereich schieben.
//
// Änderung (04.09.2026, 3): Dritter Status "in_bearbeitung" — Status jetzt
// als 3-Optionen-Auswahl statt 2-Wege-Toggle-Button. Titel ist jetzt
// klickbar (führt zur Detailseite, wie der Pfeil-Button).
//
// Änderung (04.09.2026, 4): Aufgaben-Nummer (#<nummer>), Tags (Anzeige,
// Filter, Formularfeld), Sortierung (Fälligkeit/Priorität/Status/Titel,
// auf-/absteigend) und Drei-Punkte-Menü pro Zeile (Weiterleiten, Löschen,
// Duplizieren, Teilen) ergänzt.

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MeineAufgabe, Prioritaet, AufgabenStatus } from "@/lib/aufgaben-interface";

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

const PRIORITAET_RANG: Record<Prioritaet, number> = { hoch: 0, normal: 1, niedrig: 2 };

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

const STATUS_RANG: Record<AufgabenStatus, number> = { offen: 0, in_bearbeitung: 1, erledigt: 2 };

type SortFeld = "faelligkeit" | "prioritaet" | "status" | "titel";

function relativeFaelligkeit(iso: string | null, status: string): { text: string; farbe: string } {
  if (status === "erledigt") return { text: "Erledigt", farbe: "text-[#64748b]" };
  if (!iso) return { text: "—", farbe: "text-[#64748b]" };

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  const faellig = new Date(iso);
  faellig.setHours(0, 0, 0, 0);

  const diffTage = Math.round((faellig.getTime() - heute.getTime()) / 86400000);

  if (diffTage < 0) return { text: "Überfällig", farbe: "text-red-600 font-medium" };
  if (diffTage === 0) return { text: "Heute", farbe: "text-red-600 font-medium" };
  if (diffTage === 1) return { text: "Morgen", farbe: "text-[#64748b]" };
  if (diffTage === 2) return { text: "Übermorgen", farbe: "text-[#64748b]" };

  return {
    text: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(faellig),
    farbe: "text-[#64748b]",
  };
}

export default function AufgabenListe({ initialAufgaben }: { initialAufgaben: MeineAufgabe[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [neuePrioritaet, setNeuePrioritaet] = useState<Prioritaet | "">("");
  const [neueFaelligkeit, setNeueFaelligkeit] = useState("");
  const [neueTags, setNeueTags] = useState("");
  const [formOffen, setFormOffen] = useState(false);

  const [filterPrioritaet, setFilterPrioritaet] = useState<string>("alle");
  const [filterZustaendig, setFilterZustaendig] = useState<string>("alle");
  const [filterFaelligkeit, setFilterFaelligkeit] = useState<string>("alle");
  const [filterTag, setFilterTag] = useState<string>("alle");
  const [suchtext, setSuchtext] = useState("");

  const [sortFeld, setSortFeld] = useState<SortFeld>("faelligkeit");
  const [sortRichtung, setSortRichtung] = useState<"auf" | "ab">("auf");

  const [offenesMenuId, setOffenesMenuId] = useState<string | null>(null);
  const [kopiertId, setKopiertId] = useState<string | null>(null);
  const [weiterleitenOffenId, setWeiterleitenOffenId] = useState<string | null>(null);

  const zustaendigeOptionen = useMemo(
    () => Array.from(new Set(initialAufgaben.map((a) => a.zugewiesen_an))),
    [initialAufgaben]
  );

  const alleTags = useMemo(
    () => Array.from(new Set(initialAufgaben.flatMap((a) => a.tags))).sort(),
    [initialAufgaben]
  );

  const gefilterteAufgaben = useMemo(() => {
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const gefiltert = initialAufgaben.filter((a) => {
      if (filterPrioritaet !== "alle" && a.prioritaet !== filterPrioritaet) return false;
      if (filterZustaendig !== "alle" && a.zugewiesen_an !== filterZustaendig) return false;
      if (filterTag !== "alle" && !a.tags.includes(filterTag)) return false;

      if (filterFaelligkeit !== "alle") {
        if (!a.faelligkeit) return false;
        const faellig = new Date(a.faelligkeit);
        faellig.setHours(0, 0, 0, 0);
        const diffTage = Math.round((faellig.getTime() - heute.getTime()) / 86400000);

        if (filterFaelligkeit === "heute" && diffTage !== 0) return false;
        if (filterFaelligkeit === "woche" && (diffTage < 0 || diffTage > 7)) return false;
        if (filterFaelligkeit === "ueberfaellig" && diffTage >= 0) return false;
      }

      if (suchtext.trim()) {
        const text = suchtext.trim().toLowerCase();
        const treffer =
          a.titel.toLowerCase().includes(text) ||
          (a.beschreibung ?? "").toLowerCase().includes(text) ||
          a.tags.some((t) => t.toLowerCase().includes(text));
        if (!treffer) return false;
      }

      return true;
    });

    const richtung = sortRichtung === "auf" ? 1 : -1;
    return [...gefiltert].sort((a, b) => {
      if (sortFeld === "titel") return richtung * a.titel.localeCompare(b.titel, "de");
      if (sortFeld === "status") return richtung * (STATUS_RANG[a.status] - STATUS_RANG[b.status]);
      if (sortFeld === "prioritaet") {
        const ra = a.prioritaet ? PRIORITAET_RANG[a.prioritaet] : 99;
        const rb = b.prioritaet ? PRIORITAET_RANG[b.prioritaet] : 99;
        return richtung * (ra - rb);
      }
      // faelligkeit: Aufgaben ohne Fälligkeit ans Ende, unabhängig von Richtung
      const fa = a.faelligkeit ? new Date(a.faelligkeit).getTime() : null;
      const fb = b.faelligkeit ? new Date(b.faelligkeit).getTime() : null;
      if (fa === null && fb === null) return 0;
      if (fa === null) return 1;
      if (fb === null) return -1;
      return richtung * (fa - fb);
    });
  }, [initialAufgaben, filterPrioritaet, filterZustaendig, filterFaelligkeit, filterTag, suchtext, sortFeld, sortRichtung]);

  async function neueAufgabeAnlegen(e: React.FormEvent) {
    e.preventDefault();
    if (!titel.trim()) return;

    const tags = neueTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const res = await fetch("/api/meine-aufgaben", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel,
        beschreibung,
        prioritaet: neuePrioritaet || undefined,
        faelligkeit: neueFaelligkeit ? new Date(neueFaelligkeit).toISOString() : undefined,
        tags: tags.length > 0 ? tags : undefined,
      }),
    });

    if (!res.ok) {
      alert("Fehler: Aufgabe konnte nicht angelegt werden. Bitte erneut versuchen.");
      return;
    }

    setTitel("");
    setBeschreibung("");
    setNeuePrioritaet("");
    setNeueFaelligkeit("");
    setNeueTags("");
    setFormOffen(false);
    startTransition(() => router.refresh());
  }

  async function statusAendern(id: string, neuerStatus: AufgabenStatus) {
    const res = await fetch(`/api/meine-aufgaben/${id}`, {
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

  async function aufgabeLoeschen(a: MeineAufgabe) {
    setOffenesMenuId(null);
    if (!confirm(`Aufgabe "${a.titel}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;

    const res = await fetch(`/api/meine-aufgaben/${a.id}`, { method: "DELETE" });

    if (!res.ok) {
      alert("Fehler: Aufgabe konnte nicht geloescht werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function aufgabeDuplizieren(a: MeineAufgabe) {
    setOffenesMenuId(null);

    const res = await fetch("/api/meine-aufgaben", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel: `Kopie von ${a.titel}`,
        beschreibung: a.beschreibung || undefined,
        prioritaet: a.prioritaet || undefined,
        faelligkeit: a.faelligkeit || undefined,
        projekt_id: a.projekt_id || undefined,
        tags: a.tags.length > 0 ? a.tags : undefined,
      }),
    });

    if (!res.ok) {
      alert("Fehler: Aufgabe konnte nicht dupliziert werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  async function aufgabeWeiterleiten(a: MeineAufgabe, an: string) {
    setOffenesMenuId(null);
    setWeiterleitenOffenId(null);

    const res = await fetch(`/api/meine-aufgaben/${a.id}/weiterleiten`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ an }),
    });

    if (!res.ok) {
      alert("Fehler: Aufgabe konnte nicht weitergeleitet werden. Bitte erneut versuchen.");
      return;
    }

    startTransition(() => router.refresh());
  }

  function aufgabeTeilen(a: MeineAufgabe) {
    const link = `${window.location.origin}/aufgaben/${a.id}`;
    navigator.clipboard?.writeText(link).catch(() => {
      /* Clipboard evtl. nicht verfügbar (z.B. kein HTTPS) -> stiller Fehlschlag */
    });
    setKopiertId(a.id);
    setTimeout(() => setKopiertId((k) => (k === a.id ? null : k)), 1800);
    setOffenesMenuId(null);
  }

  return (
    <div>
      <div className="mb-4">
        {!formOffen ? (
          <button
            onClick={() => setFormOffen(true)}
            className="rounded-[8px] bg-[#2563eb] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            + Neue Aufgabe
          </button>
        ) : (
          <form
            onSubmit={neueAufgabeAnlegen}
            className="rounded-[10px] border border-[#e2e8f0] bg-white p-4"
          >
            <input
              autoFocus
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Titel"
              className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13.5px]"
            />
            <textarea
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              placeholder="Beschreibung (optional)"
              rows={2}
              className="mb-2 w-full rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[13px]"
            />
            <div className="mb-2 flex flex-wrap gap-2">
              <select
                value={neuePrioritaet}
                onChange={(e) => setNeuePrioritaet(e.target.value as Prioritaet | "")}
                className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
              >
                <option value="">Priorität (optional)</option>
                <option value="hoch">Hoch</option>
                <option value="normal">Normal</option>
                <option value="niedrig">Niedrig</option>
              </select>
              <input
                type="date"
                value={neueFaelligkeit}
                onChange={(e) => setNeueFaelligkeit(e.target.value)}
                className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
              />
              <input
                value={neueTags}
                onChange={(e) => setNeueTags(e.target.value)}
                placeholder="Tags, komma-getrennt (optional)"
                className="min-w-[200px] flex-1 rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!titel.trim() || isPending}
                className="rounded-[6px] bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setFormOffen(false)}
                className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-[#64748b]"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={filterPrioritaet}
          onChange={(e) => setFilterPrioritaet(e.target.value)}
          className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
        >
          <option value="alle">Priorität: Alle</option>
          <option value="hoch">Hoch</option>
          <option value="normal">Normal</option>
          <option value="niedrig">Niedrig</option>
        </select>

        <select
          value={filterZustaendig}
          onChange={(e) => setFilterZustaendig(e.target.value)}
          className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
        >
          <option value="alle">Zuständig: Alle</option>
          {zustaendigeOptionen.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>

        <select
          value={filterFaelligkeit}
          onChange={(e) => setFilterFaelligkeit(e.target.value)}
          className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
        >
          <option value="alle">Fälligkeit: Alle</option>
          <option value="heute">Heute</option>
          <option value="woche">Diese Woche</option>
          <option value="ueberfaellig">Überfällig</option>
        </select>

        {alleTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
          >
            <option value="alle">Tag: Alle</option>
            {alleTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}

        <select
          value={sortFeld}
          onChange={(e) => setSortFeld(e.target.value as SortFeld)}
          className="rounded-[6px] border border-[#e2e8f0] px-2 py-1.5 text-[12.5px]"
        >
          <option value="faelligkeit">Sortieren: Fälligkeit</option>
          <option value="prioritaet">Sortieren: Priorität</option>
          <option value="status">Sortieren: Status</option>
          <option value="titel">Sortieren: Titel</option>
        </select>
        <button
          onClick={() => setSortRichtung((r) => (r === "auf" ? "ab" : "auf"))}
          title={sortRichtung === "auf" ? "Aufsteigend" : "Absteigend"}
          className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px] hover:bg-[#f8fafc]"
        >
          {sortRichtung === "auf" ? "↑" : "↓"}
        </button>

        <input
          value={suchtext}
          onChange={(e) => setSuchtext(e.target.value)}
          placeholder="Suchen..."
          className="flex-1 min-w-[160px] rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[12.5px]"
        />
      </div>

      <div className="overflow-visible rounded-[12px] border border-[#e2e8f0]">
        <table className="w-full border-collapse text-[13.5px] table-fixed">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[13%]" />
            <col className="w-[18%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr>
              {["Titel", "Fälligkeit", "Status", "", ""].map((h, i) => (
                <th
                  key={i}
                  className="border-b border-[#e2e8f0] px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gefilterteAufgaben.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#64748b]">
                  Keine Aufgaben.
                </td>
              </tr>
            )}
            {gefilterteAufgaben.map((a) => {
              const faelligkeit = relativeFaelligkeit(a.faelligkeit, a.status);
              const menuOffen = offenesMenuId === a.id;
              const weiterleitenOffen = weiterleitenOffenId === a.id;

              return (
                <tr key={a.id} className="last:border-b-0">
                  <td className="border-b border-[#e2e8f0] px-3 py-3 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.nummer !== null && (
                        <span className="shrink-0 text-[11.5px] font-medium text-[#94a3b8]">#{a.nummer}</span>
                      )}
                      <button
                        onClick={() => router.push(`/aufgaben/${a.id}`)}
                        className="truncate text-left font-medium hover:underline"
                      >
                        {a.titel}
                      </button>
                      {a.prioritaet && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${PRIORITAET_FARBE[a.prioritaet]}`}
                        >
                          {PRIORITAET_LABEL[a.prioritaet]}
                        </span>
                      )}
                      {a.projekt_id && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] text-indigo-600">
                          {a.projekt_id}
                        </span>
                      )}
                      {a.tags.map((t) => (
                        <span
                          key={t}
                          className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    {a.beschreibung && (
                      <div className="mt-0.5 truncate whitespace-nowrap text-[12px] text-[#64748b]">
                        {a.beschreibung}
                      </div>
                    )}
                  </td>
                  <td className={`border-b border-[#e2e8f0] px-3 py-3 text-[12.5px] ${faelligkeit.farbe}`}>
                    {faelligkeit.text}
                  </td>
                  <td className="border-b border-[#e2e8f0] px-3 py-3">
                    <select
                      value={a.status}
                      onChange={(e) => statusAendern(a.id, e.target.value as AufgabenStatus)}
                      disabled={isPending}
                      className={`rounded-full border-0 px-2.5 py-1 text-[11.5px] font-semibold ${STATUS_FARBE[a.status]}`}
                    >
                      {(Object.keys(STATUS_LABEL) as AufgabenStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-[#e2e8f0] px-3 py-3">
                    <button
                      onClick={() => router.push(`/aufgaben/${a.id}`)}
                      aria-label="Details öffnen"
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-[#e2e8f0] text-[13px] hover:bg-[#f8fafc]"
                    >
                      →
                    </button>
                  </td>
                  <td className="relative border-b border-[#e2e8f0] px-3 py-3">
                    <button
                      onClick={() => {
                        setWeiterleitenOffenId(null);
                        setOffenesMenuId(menuOffen ? null : a.id);
                      }}
                      aria-label="Weitere Aktionen"
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-[#e2e8f0] text-[13px] hover:bg-[#f8fafc]"
                    >
                      ⋯
                    </button>

                    {menuOffen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOffenesMenuId(null)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg">
                          {!weiterleitenOffen ? (
                            <button
                              onClick={() => setWeiterleitenOffenId(a.id)}
                              className="flex w-full items-center px-3 py-1.5 text-left text-[12.5px] text-[#0f172a] hover:bg-[#f8fafc]"
                            >
                              Weiterleiten an...
                            </button>
                          ) : (
                            <div className="px-2 py-1">
                              <div className="mb-1 px-1 text-[10.5px] font-semibold uppercase text-[#94a3b8]">
                                Weiterleiten an
                              </div>
                              {zustaendigeOptionen
                                .filter((z) => z !== a.zugewiesen_an)
                                .map((z) => (
                                  <button
                                    key={z}
                                    onClick={() => aufgabeWeiterleiten(a, z)}
                                    className="block w-full rounded-[4px] px-2 py-1 text-left text-[12.5px] hover:bg-[#f8fafc]"
                                  >
                                    {z}
                                  </button>
                                ))}
                            </div>
                          )}
                          <button
                            onClick={() => aufgabeDuplizieren(a)}
                            className="flex w-full items-center px-3 py-1.5 text-left text-[12.5px] text-[#0f172a] hover:bg-[#f8fafc]"
                          >
                            Duplizieren
                          </button>
                          <button
                            onClick={() => aufgabeTeilen(a)}
                            className="flex w-full items-center px-3 py-1.5 text-left text-[12.5px] text-[#0f172a] hover:bg-[#f8fafc]"
                          >
                            {kopiertId === a.id ? "Link kopiert ✓" : "Teilen (Link kopieren)"}
                          </button>
                          <div className="my-1 h-px bg-[#e2e8f0]" />
                          <button
                            onClick={() => aufgabeLoeschen(a)}
                            className="flex w-full items-center px-3 py-1.5 text-left text-[12.5px] text-red-600 hover:bg-red-50"
                          >
                            Löschen
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
