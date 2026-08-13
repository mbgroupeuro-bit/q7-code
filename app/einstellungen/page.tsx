const sections = [
  { title: "Profil", desc: "Name, E-Mail, Passwort" },
  { title: "Team", desc: "Team-Name, Rolle" },
  { title: "Protokoll", desc: "Granularität: Alles / Nur wichtige Ereignisse / Konfigurierbar" },
  { title: "Sprache", desc: "Deutsch / Englisch" },
];

export default function EinstellungenPage() {
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
      </div>
    </div>
  );
}
