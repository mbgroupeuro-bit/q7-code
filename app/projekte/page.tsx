import Link from "next/link";
import { Pin } from "lucide-react";
import { projekteListenFuerMitarbeiter } from "@/lib/projekt";
import { pruefeAgentZugriff } from "@/lib/ki-agent/rollen-check";
import NeuesProjektForm from "@/components/projekte/NeuesProjektForm";

export default async function ProjektePage() {
  const zugriff = await pruefeAgentZugriff();

  if (!zugriff.erlaubt || !zugriff.kontext) {
    return (
      <div className="p-6 text-[13px] text-[#64748b]">
        Kein Zugriff auf Projekte fuer diesen Account.
      </div>
    );
  }

  const projekte = await projekteListenFuerMitarbeiter(zugriff.kontext.mitarbeiterId);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-semibold">Projekte</h2>
        <NeuesProjektForm />
      </div>

      {projekte.length === 0 ? (
        <p className="text-[13px] italic text-[#64748b]">
          Noch keine Projekte angelegt. Mit &quot;Neues Projekt&quot; starten.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projekte.map((p) => (
            <Link
              key={p.id}
              href={`/projekte/${p.id}`}
              className="block rounded-[12px] border border-[#e2e8f0] bg-white p-4 hover:border-[#cbd5e1]"
            >
              <div className="flex items-start justify-between">
                <div className="text-[15px] font-semibold">{p.name}</div>
                {p.angeheftet && <Pin size={14} className="fill-current text-[#2563eb]" />}
              </div>
              {p.beschreibung && (
                <p className="mt-2 line-clamp-2 text-[12.5px] text-[#64748b]">{p.beschreibung}</p>
              )}
              <div className="mt-3 text-[11.5px] text-[#94a3b8]">
                Aktualisiert: {new Date(p.aktualisiert_am).toLocaleDateString("de-DE")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
