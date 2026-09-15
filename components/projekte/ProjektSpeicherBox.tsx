"use client";

interface ProjektSpeicherBoxProps {
  status: string | null;
  inhalt: string | null;
  fehlermeldung: string | null;
  letzteAktualisierung: string | null;
}

/**
 * Zeigt ProjektErinnerung.status / .inhalt an.
 * ANNAHME: status-Werte analog AgentCronLauf-Muster
 * (z.B. "ok" | "fehler" | "laeuft" | "ausstehend") â€” bitte gegen
 * tatsÃ¤chliche Enum-Werte im Prisma-Schema prÃ¼fen.
 */
export default function ProjektSpeicherBox({
  status,
  inhalt,
  fehlermeldung,
  letzteAktualisierung,
}: ProjektSpeicherBoxProps) {
  const istFehler = status === "fehler";

  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-[#334155]">Speicher</h3>
        {letzteAktualisierung && (
          <span className="text-[11px] text-[#94a3b8]">Stand: {letzteAktualisierung}</span>
        )}
      </div>

      {istFehler ? (
        <p className="text-[12.5px] text-[#dc2626]">
          Fehler bei der letzten Verdichtung: {fehlermeldung ?? "Unbekannter Fehler."}
        </p>
      ) : inhalt ? (
        <p className="text-[12.5px] text-[#475569] whitespace-pre-wrap">{inhalt}</p>
      ) : (
        <p className="text-[12.5px] text-[#94a3b8] italic">
          Noch keine Erinnerung vorhanden. Wird nach dem nÃ¤chtlichen Lauf befÃ¼llt.
        </p>
      )}
    </div>
  );
}
