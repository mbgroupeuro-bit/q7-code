import { Search, Bell, Plus, Sparkles, ArrowUp, FileChartColumn, ChartLine, CalendarPlus, PenLine, Folder, FileText } from "lucide-react";
import {
  HeuteWichtigWidget,
  AufgabenWidget,
  KalenderWidget,
  UnternehmensstatusWidget,
  UmsatzHeuteWidget,
  KpiWidget,
  StatCard,
} from "@/components/dashboard/DashboardWidgets";

// TODO: Diese Daten kommen später live über die Integrationsplattform
// (siehe Q7_Dashboard_Posteingang_Konzept.docx, Abschnitt 3.1).
// Platzhalter hier nur zur Struktur-Abnahme.

const wichtigItems = [
  {
    id: "1",
    icon: Folder,
    iconBg: "#FBF0D9",
    iconColor: "#D4A72C",
    title: "Angebot Müller GmbH freigeben",
    subtitle: "Fällig heute, 10 Uhr",
    href: "/aufgaben/1",
  },
  {
    id: "2",
    icon: FileText,
    iconBg: "#E7ECFB",
    iconColor: "#1B2A56",
    title: "2 Rechnungen prüfen",
    subtitle: "2 Dokumente warten",
    href: "/aufgaben/2",
  },
];

const aufgabenItems = [
  { id: "1", title: "Angebot #245 versenden", time: "Heute, 09:00", priority: "Hoch" as const },
  { id: "2", title: "Marketingkampagne prüfen", time: "Heute, 11:30", priority: "Mittel" as const },
];

const kalenderItems = [
  { id: "1", time: "09:00", title: "Angebot Müller GmbH", range: "09:00–10:00" },
  { id: "2", time: "11:00", title: "Team Meeting", range: "11:00–12:00" },
];

const statusBars = [
  { id: "1", label: "Produktion", percent: 88 },
  { id: "2", label: "Vertrieb", percent: 72 },
  { id: "3", label: "Finanzen", percent: 64 },
];

const kpiValues = [
  { id: "1", label: "Umsatz", value: "€12.4k" },
  { id: "2", label: "Offene Rg.", value: "3" },
  { id: "3", label: "Leads", value: "18", highlight: true },
  { id: "4", label: "Conversion", value: "24%" },
];

const quickActions = [
  { icon: FileChartColumn, label: "Bericht erstellen" },
  { icon: ChartLine, label: "Daten analysieren" },
  { icon: CalendarPlus, label: "Aufgabe planen" },
  { icon: PenLine, label: "Text generieren" },
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <main className="flex-1 overflow-auto bg-[#F4F3EF] px-7 py-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-dark">
              Guten Morgen, Peter 👋
            </h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Hier ist, was heute wichtig ist.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex w-56 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-400">
              <Search size={14} />
              Suche in Q7...
            </div>
            <button className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-neutral-200 bg-white">
              <Bell size={15} className="text-neutral-600" />
              <span className="absolute -right-1 -top-1 rounded-full bg-gold px-1 text-[9px] font-bold text-navy-dark">
                8
              </span>
            </button>
            <button className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-navy text-white">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* KI-Assistent */}
        <div className="mt-4 rounded-xl bg-white p-5">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-navy-dark">
            <Sparkles size={17} className="text-gold" />
            Ich bin Q7. Wie kann ich Ihnen helfen?
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 rounded-full bg-[#F7F6F2] px-4 py-2.5 text-sm text-neutral-400">
              Fragen Sie Q7 etwas...
            </div>
            <button className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gold text-navy-dark">
              <ArrowUp size={16} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickActions.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600"
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Widget-Grid — Reihenfolge/Sichtbarkeit später aus dashboard_konfiguration */}
        <div className="mt-4 grid grid-cols-3 gap-3.5">
          <HeuteWichtigWidget items={wichtigItems} />
          <AufgabenWidget count={12} items={aufgabenItems} />
          <KalenderWidget items={kalenderItems} />
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-3.5">
          <UnternehmensstatusWidget bars={statusBars} />
          <UmsatzHeuteWidget
            amount="€ 12.450"
            deltaPercent={8.4}
            points={[35, 32, 22, 26, 15, 18, 8, 6]}
          />
          <KpiWidget values={kpiValues} />
        </div>

        <div className="mt-3.5 grid grid-cols-4 gap-3.5">
          <StatCard label="Posteingang" value="8" sub="Ungelesen" />
          <StatCard label="Offene Angebote" value="15" sub="€72.800" />
          <StatCard label="Offene Rechnungen" value="7" sub="€18.600" />
          <StatCard
            label="Neue Leads"
            value="6"
            sub="↗ 20%"
            subColor="text-emerald-600"
          />
        </div>
      </main>
    </div>
  );
}
