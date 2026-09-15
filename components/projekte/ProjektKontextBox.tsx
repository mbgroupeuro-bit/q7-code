"use client";

import { Trash2 } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import type { UploadedFile } from "@/lib/types";

interface KontextDatei {
  id: string;
  name: string;
  typ: string;
  hochgeladenAm: string;
}

interface ProjektKontextBoxProps {
  projektId: string;
  dateien: KontextDatei[];
  onHinzufuegen: (datei: UploadedFile) => void;
  onEntfernen: (dateiId: string) => void;
}

/**
 * Kontext-Box: Liste bestehender Kontext-Dateien + Upload Ã¼ber
 * bestehende Ablage-Mechanik (FileUpload.tsx, unverÃ¤ndert wiederverwendet).
 * Kein eigener Upload-Pfad â€” postet an /api/ablage, verknÃ¼pft danach
 * nur die ablage_id via onHinzufuegen -> kontextDateiHinzufuegen().
 */
export default function ProjektKontextBox({
  projektId,
  dateien,
  onHinzufuegen,
  onEntfernen,
}: ProjektKontextBoxProps) {
  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#334155]">Kontext</h3>
        <FileUpload
          variante="button"
          label="Datei hinzufÃ¼gen"
          kategorie="Projekt-Kontext"
          space={projektId}
          onUpload={onHinzufuegen}
        />
      </div>

      {dateien.length === 0 ? (
        <p className="text-[12.5px] text-[#94a3b8] italic">Noch keine Kontext-Dateien hinterlegt.</p>
      ) : (
        <ul className="space-y-1.5">
          {dateien.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-[6px] border border-[#f1f5f9] px-2.5 py-1.5 text-[12.5px]"
            >
              <span className="text-[#334155]">{d.name}</span>
              <button
                type="button"
                onClick={() => onEntfernen(d.id)}
                aria-label="Entfernen"
                className="text-[#94a3b8] hover:text-[#dc2626]"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
