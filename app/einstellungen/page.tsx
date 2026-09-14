// Speicherort: D:\Projekt2027\Q7_Entwicklung\a_Q7-code\app\einstellungen\page.tsx
// ERSETZT die bestehende Datei. NEU (KI-Agent): eigener Bereich mit
// DelegationSchalter, nur sichtbar für admin/tenant_admin (server-seitig
// geprüft über getAktuelleRolle() — dieselbe Quelle, die auch die API-Routen
// nutzen, kein zweites Rollenmodell).

import DelegationSchalter from "@/components/DelegationSchalter";
import RoutinenEinstellung from "@/components/RoutinenEinstellung";
import { getAktuelleRolle } from "@/lib/auth-server";
import { darfAdminKonsoleSehen } from "@/lib/rollen";

const sections = [
  { title: "Profil", desc: "Name, E-Mail, Passwort" },
  { title: "Team", desc: "Team-Name, Rolle" },
  { title: "Protokoll", desc: "Granularität: Alles / Nur wichtige Ereignisse / Konfigurierbar" },
  { title: "Sprache", desc: "Deutsch / Englisch" },
];

export default async function EinstellungenPage() {
  const rolle = await getAktuelleRolle();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="mb-5 text-[20px] font-semibold">Einstellungen</h2>
      <div className="flex max-w-[560px] flex-col gap-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
            <div className="mb-2.5 font-semibold">{s.title}</div>
            <div className="text-[13px] text-[#64748b]">{s.desc}</div>
          </div>
        ))}

        {/* NEU (KI-Agent): für ALLE Mitarbeiter sichtbar — persönlicher
            Arbeitsplan-Rhythmus, Besitzer-Prüfung passiert serverseitig
            (jeder sieht/verwaltet ausschließlich seine eigenen Routinen). */}
        <div>
          <div className="mb-2.5 font-semibold">KI-Agent</div>
          <RoutinenEinstellung />
        </div>

        {/* NEU (KI-Agent): nur für Admin/Tenant-Admin, da PUT auf
            /api/agent-delegation ohnehin serverseitig auf diese Rollen
            beschränkt ist (pruefeAdminZugriff) — hier zusätzlich UI-seitig
            ausgeblendet, damit reguläre Mitarbeiter keinen wirkungslosen
            Schalter sehen. */}
        {darfAdminKonsoleSehen(rolle) && (
          <div>
            <div className="mb-2.5 font-semibold">KI-Agent — Freigabe-Stufe (Admin)</div>
            <DelegationSchalter />
          </div>
        )}
      </div>
    </div>
  );
}
