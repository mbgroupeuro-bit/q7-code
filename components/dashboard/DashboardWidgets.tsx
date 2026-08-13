import {
  Folder,
  FileText,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/* ---------- Card shell ---------- */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Eigene Hintergrundfarbe (z. B. "bg-navy" bei KpiWidget) hat Vorrang.
  // "bg-white" nur als Fallback, wenn className keine eigene bg-*-Klasse setzt.
  const hasOwnBg = /(^|\s)bg-/.test(className);
  return (
    <div className={`rounded-xl p-4 ${hasOwnBg ? "" : "bg-white"} ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 text-[13px] font-semibold text-navy-dark">
      {children}
    </div>
  );
}

/* ---------- Heute wichtig ---------- */

export interface WichtigItem {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  href: string;
}

export function HeuteWichtigWidget({ items }: { items: WichtigItem[] }) {
  return (
    <Card>
      <CardTitle>Heute wichtig</CardTitle>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-neutral-50"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: item.iconBg }}
            >
              <item.icon size={15} style={{ color: item.iconColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-navy-dark">
                {item.title}
              </div>
              <div className="truncate text-[11px] text-neutral-400">
                {item.subtitle}
              </div>
            </div>
          </a>
        ))}
      </div>
      <a
        href="/aufgaben"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold"
      >
        Alle anzeigen <ArrowRight size={12} />
      </a>
    </Card>
  );
}

/* ---------- Aufgaben ---------- */

export interface AufgabeItem {
  id: string;
  title: string;
  time: string;
  priority: "Hoch" | "Mittel" | "Niedrig";
}

const PRIORITY_STYLE: Record<AufgabeItem["priority"], string> = {
  Hoch: "bg-[#FBF0D9] text-[#B8862A]",
  Mittel: "bg-neutral-100 text-neutral-600",
  Niedrig: "bg-neutral-100 text-neutral-500",
};

export function AufgabenWidget({
  count,
  items,
}: {
  count: number;
  items: AufgabeItem[];
}) {
  return (
    <Card>
      <CardTitle>
        Aufgaben <span className="font-normal text-neutral-400">{count}</span>
      </CardTitle>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-navy-dark">
                {item.title}
              </div>
              <div className="text-[11px] text-neutral-400">{item.time}</div>
            </div>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                PRIORITY_STYLE[item.priority]
              }`}
            >
              {item.priority}
            </span>
          </div>
        ))}
      </div>
      <a
        href="/aufgaben"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold"
      >
        Alle Aufgaben <ArrowRight size={12} />
      </a>
    </Card>
  );
}

/* ---------- Kalender ---------- */

export interface KalenderItem {
  id: string;
  time: string;
  title: string;
  range: string;
}

export function KalenderWidget({ items }: { items: KalenderItem[] }) {
  return (
    <Card>
      <CardTitle>Kalender</CardTitle>
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2">
            <span className="w-9 shrink-0 text-[11px] text-neutral-400">
              {item.time}
            </span>
            <div>
              <div className="text-xs font-medium text-navy-dark">
                {item.title}
              </div>
              <div className="text-[11px] text-neutral-400">{item.range}</div>
            </div>
          </div>
        ))}
      </div>
      <a
        href="/kalender"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold"
      >
        Zum Kalender <ArrowRight size={12} />
      </a>
    </Card>
  );
}

/* ---------- Unternehmensstatus ---------- */

export interface StatusBar {
  id: string;
  label: string;
  percent: number;
}

export function UnternehmensstatusWidget({ bars }: { bars: StatusBar[] }) {
  return (
    <Card>
      <CardTitle>Unternehmensstatus</CardTitle>
      <div className="flex flex-col gap-2.5">
        {bars.map((bar) => (
          <div key={bar.id}>
            <div className="mb-1 flex justify-between text-[11px] text-neutral-500">
              <span>{bar.label}</span>
              <span>{bar.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100">
              <div
                className="h-1.5 rounded-full bg-gold"
                style={{ width: `${bar.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Umsatz heute ---------- */

export function UmsatzHeuteWidget({
  amount,
  deltaPercent,
  points,
}: {
  amount: string;
  deltaPercent: number;
  points: number[];
}) {
  const w = 200;
  const h = 50;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${x},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Card>
      <CardTitle>Umsatz heute</CardTitle>
      <div className="text-2xl font-bold text-navy-dark">{amount}</div>
      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-600">
        <TrendingUp size={12} />
        {deltaPercent > 0 ? "+" : ""}
        {deltaPercent}% vs. gestern
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-12 w-full">
        <polyline
          points={path}
          fill="none"
          stroke="#D4A72C"
          strokeWidth={2}
        />
      </svg>
    </Card>
  );
}

/* ---------- KPI-Kacheln (Integrationsplattform, live) ---------- */

export interface KpiValue {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

export function KpiWidget({ values }: { values: KpiValue[] }) {
  return (
    <Card className="bg-navy text-white">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[13px] text-white/80">KPI-Kacheln</div>
        <div className="flex items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-[11px] font-semibold text-navy-dark">
          <Sparkles size={11} />
          live
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {values.map((v) => (
          <div key={v.id}>
            <div className="text-[11px] text-white/70">{v.label}</div>
            <div
              className={`text-xl font-bold ${
                v.highlight ? "text-gold" : "text-white"
              }`}
            >
              {v.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Kompakte Statuskarten unten ---------- */

export function StatCard({
  label,
  value,
  sub,
  subColor = "text-neutral-400",
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <Card>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-navy-dark">
        {value}{" "}
        <span className={`text-[11px] font-normal ${subColor}`}>{sub}</span>
      </div>
    </Card>
  );
}

export const icons = { Folder, FileText };
