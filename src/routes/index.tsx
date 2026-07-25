import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BatteryFull,
  Cloud,
  Droplets,
  Gauge,
  Layers,
  Lock,
  MapPin,
  Radio,
  Satellite,
  ShieldAlert,
  Signal,
  Sprout,
  Timer,
  Unlock,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bionode | Flood & Pollution Command" },
      {
        name: "description",
        content:
          "Mobile-first command dashboard for Kenyan farmers and extension officers: automated flood diversion and community-led pollution alerting powered by Copernicus satellites and KijaniBox IoT.",
      },
      { property: "og:title", content: "Bionode | Flood & Pollution Command" },
      {
        property: "og:description",
        content:
          "Real-time catchment monitoring, automated gravity-fed flood gate control, and pollution broadcasts for rural Kenyan communities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type SceneMode = "peak" | "normal";

function Dashboard() {
  const [mode, setMode] = useState<SceneMode>("peak");
  const [water, setWater] = useState(268);
  const [turbidity, setTurbidity] = useState(162);
  const [soil, setSoil] = useState(88);
  const [syncMinutes, setSyncMinutes] = useState(45);

  // simulated live telemetry drift
  useEffect(() => {
    const id = setInterval(() => {
      if (mode === "peak") {
        setWater((v) => clamp(268 + jitter(6), 258, 278));
        setTurbidity((v) => clamp(162 + jitter(8), 150, 178));
        setSoil((v) => clamp(88 + jitter(1.5), 84, 92));
      } else {
        setWater((v) => clamp(180 + jitter(4), 172, 190));
        setTurbidity((v) => clamp(40 + jitter(3), 34, 48));
        setSoil((v) => clamp(52 + jitter(1.5), 48, 58));
      }
    }, 1400);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    const id = setInterval(() => setSyncMinutes((m) => m + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const critical = mode === "peak";
  const safeMax = 250;
  const waterPct = Math.min(100, Math.round((water / 320) * 100));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopHeader syncMinutes={syncMinutes} />

      <main className="mx-auto max-w-7xl px-4 pb-40 pt-4 sm:px-6 lg:px-8">
        {/* headline strip */}
        <section className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-soft text-emerald">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Catchment Node: NYANDO_01
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Kisumu County, Kenya &middot; Live telemetry
              </p>
            </div>
          </div>
          <StateBadge critical={critical} />
        </section>

        {/* Component A: map + telemetry */}
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <MapWidget critical={critical} />
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <TelemetryCard
              icon={<Waves className="h-4 w-4" />}
              source="KijaniBox"
              label="Water Level"
              value={`${water.toFixed(0)} cm`}
              sub={`Safe baseline ${safeMax} cm`}
              tone={water > safeMax ? "danger" : "aqua"}
              progress={waterPct}
              barMark={(safeMax / 320) * 100}
            />
            <TelemetryCard
              icon={<Droplets className="h-4 w-4" />}
              source="KijaniBox"
              label="Turbidity / Silt"
              value={`${turbidity.toFixed(0)} NTU`}
              sub={mode === "peak" ? "Elevated runoff" : "Within normal band"}
              tone={turbidity > 100 ? "amber" : "emerald"}
              progress={Math.min(100, (turbidity / 200) * 100)}
            />
            <TelemetryCard
              icon={<Satellite className="h-4 w-4" />}
              source="Copernicus"
              label="Upstream Soil Saturation"
              value={`${soil.toFixed(0)} %`}
              sub="Macro catchment index"
              tone={soil > 80 ? "amber" : "emerald"}
              progress={soil}
            />
          </div>
        </section>

        {/* Component B: flood gate */}
        <section className="mt-4">
          <FloodGate active={critical} water={water} safeMax={safeMax} />
        </section>

        {/* Component C: pollution */}
        {critical && (
          <section className="mt-4">
            <PollutionAlert />
          </section>
        )}

        {!critical && (
          <section className="mt-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-soft text-emerald">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">All systems nominal</p>
                <p className="text-xs text-muted-foreground">
                  No pollution advisory. Catchment is retaining safely.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <SimPanel mode={mode} setMode={setMode} />
    </div>
  );
}

/* ---------------- header ---------------- */

function TopHeader({ syncMinutes }: { syncMinutes: number }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight sm:text-base">
              Bionode
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Catchment command &middot; MVP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <StatusPill
            icon={<Signal className="h-3.5 w-3.5 signal-blink" />}
            label="4G"
            tone="emerald"
          />
          <StatusPill
            icon={<BatteryFull className="h-3.5 w-3.5" />}
            label="94%"
            sub="Solar"
            tone="emerald"
          />
          <StatusPill
            icon={<Satellite className="h-3.5 w-3.5" />}
            label={`${syncMinutes}m`}
            sub="Copernicus"
            tone="aqua"
          />
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  icon,
  label,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  tone: "emerald" | "aqua" | "amber";
}) {
  const toneClass = {
    emerald: "bg-emerald-soft text-emerald",
    aqua: "bg-aqua-soft text-aqua",
    amber: "bg-amber-soft text-amber",
  }[tone];
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      {icon}
      <span>{label}</span>
      {sub && <span className="hidden text-[10px] font-medium opacity-70 sm:inline">{sub}</span>}
    </div>
  );
}

function StateBadge({ critical }: { critical: boolean }) {
  if (critical) {
    return (
      <div className="pulse-danger inline-flex items-center gap-2 self-start rounded-full bg-danger px-3 py-1.5 text-xs font-bold text-white sm:self-auto">
        <span className="h-2 w-2 rounded-full bg-white" />
        CRITICAL &middot; DIVERSION ACTIVE
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-soft px-3 py-1.5 text-xs font-bold text-emerald sm:self-auto">
      <span className="h-2 w-2 rounded-full bg-emerald" />
      NOMINAL &middot; RETAINING
    </div>
  );
}

/* ---------------- map ---------------- */

function MapWidget({ critical }: { critical: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-aqua" />
          <p className="text-sm font-semibold">Catchment Map</p>
        </div>
        <span className="text-[11px] text-muted-foreground">Leaflet &middot; OSM tiles</span>
      </div>
      <div className="relative h-72 sm:h-80">
        {/* fake tiles grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.28 0.03 220) 1px, transparent 1px), linear-gradient(90deg, oklch(0.28 0.03 220) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            backgroundColor: "oklch(0.22 0.03 230)",
          }}
        />
        {/* river */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="riv" x1="0" x2="1">
              <stop offset="0" stopColor="oklch(0.7 0.13 220)" stopOpacity="0.9" />
              <stop offset="1" stopColor="oklch(0.55 0.14 220)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M -10 60 C 80 90, 120 20, 200 120 S 340 260, 420 220"
            fill="none"
            stroke="url(#riv)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 180 130 C 220 160, 250 200, 260 260"
            fill="none"
            stroke="oklch(0.6 0.1 220 / 0.5)"
            strokeWidth="6"
          />
        </svg>
        {/* fields */}
        <div className="absolute left-6 top-6 h-16 w-24 rounded-md bg-emerald/20 ring-1 ring-emerald/40" />
        <div className="absolute right-8 top-10 h-14 w-20 rounded-md bg-emerald/15 ring-1 ring-emerald/30" />
        <div className="absolute bottom-6 left-14 h-12 w-28 rounded-md bg-emerald/15 ring-1 ring-emerald/30" />

        {/* marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={`relative grid h-10 w-10 place-items-center rounded-full ${critical ? "bg-danger" : "bg-emerald"} text-white shadow-lg`}>
            <MapPin className="h-5 w-5" />
            <span
              className={`absolute inset-0 rounded-full ${critical ? "bg-danger" : "bg-emerald"} map-ping`}
            />
          </div>
          <div className="mt-2 -translate-x-1/2 rounded-md bg-slate-elev px-2 py-1 text-center text-[10px] font-semibold shadow"
            style={{ marginLeft: "50%" }}>
            NYANDO_01
          </div>
        </div>

        {/* legend */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-md bg-slate-elev/90 px-2 py-1.5 text-[10px]">
          <LegendDot color="bg-aqua" label="Waterway" />
          <LegendDot color="bg-emerald" label="Farmland" />
          <LegendDot color={critical ? "bg-danger" : "bg-emerald"} label="Node" />
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

/* ---------------- telemetry ---------------- */

function TelemetryCard({
  icon,
  source,
  label,
  value,
  sub,
  tone,
  progress,
  barMark,
}: {
  icon: React.ReactNode;
  source: "KijaniBox" | "Copernicus";
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "aqua" | "amber" | "danger";
  progress: number;
  barMark?: number;
}) {
  const toneText = {
    emerald: "text-emerald",
    aqua: "text-aqua",
    amber: "text-amber",
    danger: "text-danger",
  }[tone];
  const toneBar = {
    emerald: "bg-emerald",
    aqua: "bg-aqua",
    amber: "bg-amber",
    danger: "bg-danger",
  }[tone];
  const toneSoft = {
    emerald: "bg-emerald-soft",
    aqua: "bg-aqua-soft",
    amber: "bg-amber-soft",
    danger: "bg-danger-soft",
  }[tone];
  const SourceIcon = source === "KijaniBox" ? Radio : Cloud;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneSoft} ${toneText}`}>
          <SourceIcon className="h-3 w-3" />
          {source}
        </div>
        <span className={toneText}>{icon}</span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneText}`}>{value}</p>
      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-elev">
        <div
          className={`h-full ${toneBar} transition-[width] duration-700 ease-out`}
          style={{ width: `${progress}%` }}
        />
        {barMark !== undefined && (
          <div
            className="absolute top-0 h-full w-px bg-white/70"
            style={{ left: `${barMark}%` }}
            aria-label="safe limit"
          />
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

/* ---------------- flood gate ---------------- */

function FloodGate({
  active,
  water,
  safeMax,
}: {
  active: boolean;
  water: number;
  safeMax: number;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        active ? "border-danger/60" : "border-border"
      } bg-card`}
    >
      {active ? (
        <div className="flash-danger flex items-center gap-3 border-b border-danger/40 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
          <p className="text-sm font-bold uppercase tracking-wide text-danger">
            Automated Flood Action Notice: Diversion In Progress
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-b border-border bg-emerald-soft px-4 py-3">
          <Lock className="h-5 w-5 shrink-0 text-emerald" />
          <p className="text-sm font-bold uppercase tracking-wide text-emerald">
            Gate Sealed &middot; Retaining Catchment
          </p>
        </div>
      )}

      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_1.1fr]">
        {/* schematic */}
        <div className="relative h-64 overflow-hidden rounded-xl border border-border bg-slate-panel">
          {/* surface water */}
          <div className="absolute inset-x-0 top-0 h-24 overflow-hidden bg-gradient-to-b from-aqua/40 to-aqua/10">
            {active &&
              Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="water-drop absolute h-6 w-0.5 rounded-full bg-aqua/80"
                  style={{
                    left: `${10 + i * 11}%`,
                    animationDelay: `${(i % 4) * 0.25}s`,
                  }}
                />
              ))}
          </div>
          {/* ground */}
          <div className="absolute inset-x-0 top-24 h-6 bg-[oklch(0.32_0.04_60)]" />
          {/* gate housing */}
          <div className="absolute left-1/2 top-24 h-24 w-24 -translate-x-1/2 border-x-2 border-border bg-slate-elev">
            <div
              className={`absolute inset-x-0 top-0 h-8 border-b-2 border-border bg-muted ${
                active ? "gate-panel-open" : ""
              }`}
            />
            {active && (
              <div className="absolute inset-x-2 bottom-2 top-10 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className="water-drop absolute h-8 w-0.5 rounded-full bg-aqua"
                    style={{ left: `${15 + i * 22}%`, animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* subterranean well */}
          <div className="absolute bottom-0 left-1/2 h-24 w-40 -translate-x-1/2 rounded-b-xl border-2 border-t-0 border-border bg-aqua/10">
            <div
              className={`absolute inset-x-0 bottom-0 ${
                active ? "h-16" : "h-6"
              } bg-aqua/40 transition-[height] duration-1000`}
            />
            <p className="absolute inset-x-0 top-1 text-center text-[10px] font-semibold text-muted-foreground">
              Conservation Well
            </p>
          </div>

          <div className="absolute left-2 top-2 rounded bg-slate-elev/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            Surface
          </div>
          <div className="absolute bottom-2 left-2 rounded bg-slate-elev/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            Subterranean
          </div>
        </div>

        {/* steps */}
        <div className="flex flex-col gap-3">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Gravity-Fed Subterranean Gate Valve
              </p>
              <p className="text-sm font-semibold">
                Water {water.toFixed(0)} cm &middot; Limit {safeMax} cm
              </p>
            </div>
            <div
              className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                active ? "bg-danger text-white" : "bg-emerald text-primary-foreground"
              }`}
            >
              {active ? "OPEN" : "SEALED"}
            </div>
          </div>

          <Step
            n={1}
            icon={<Zap className="h-4 w-4" />}
            title="KijaniBox Relay"
            status={active ? "ENERGIZED" : "STANDBY"}
            active={active}
            desc="Automated 12V relay triggered by threshold breach on water-level sensor."
          />
          <Step
            n={2}
            icon={active ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            title="Physical Seal"
            status={active ? "SHIFTED OPEN" : "CLOSED"}
            active={active}
            desc="Underground gate valve retracts along guide rails to expose the diversion mouth."
          />
          <Step
            n={3}
            icon={<Droplets className="h-4 w-4" />}
            title="Gravity Diversion"
            status={active ? "DRAINING" : "IDLE"}
            active={active}
            desc="Excess surface water flows via natural gravity into the conservation well for dry-season irrigation."
          />
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  status,
  desc,
  active,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  status: string;
  desc: string;
  active: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border p-3 transition-colors ${
        active ? "border-danger/40 bg-danger-soft" : "border-border bg-slate-panel"
      }`}
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${
          active ? "bg-danger bob" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Step {n}
        </p>
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          active ? "bg-danger text-white" : "bg-muted text-muted-foreground"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

/* ---------------- pollution ---------------- */

function PollutionAlert() {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber/50 bg-card">
      <div className="flex items-center gap-3 border-b border-amber/40 bg-amber-soft px-4 py-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber" />
        <p className="text-sm font-bold uppercase tracking-wide text-amber">
          Scenario A &middot; Upward Pollution Spike
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="rounded-xl border border-border bg-slate-panel p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Rate Shift &middot; 3 hour window
          </p>
          <p className="mt-2 text-4xl font-black tabular-nums text-amber">
            +35.4%
          </p>
          <p className="mt-1 text-sm font-medium">Upward Toxicity Spike Detected</p>

          <div className="mt-4">
            <MiniSparkline />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Baseline" value="119" />
            <MiniStat label="Current" value="162" tone="amber" />
            <MiniStat label="Delta" value="+43" tone="danger" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Headline
            </p>
            <p className="mt-1 text-base font-semibold leading-snug sm:text-lg">
              Upstream sensors have detected a 35.4% increase in chemical and silt
              runoff over the last baseline cycle.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-slate-panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber" />
              <p className="text-sm font-bold uppercase tracking-wide">
                Actionable Local Control Procedures
              </p>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed">
              <ActionItem
                title="Farming Communities"
                text="Immediately halt all upstream spraying of liquid nitrogen, fertilizers, or chemical pesticides for the next 24 hours to prevent additional field wash-off."
              />
              <ActionItem
                title="Domestic Users"
                text="Do not allow cattle or poultry to drink directly from the open channel; utilize water pumped from secure wells."
              />
              <ActionItem
                title="Community Action"
                text="Cooperative teams should inspect the nearest upstream canal junction for potential agricultural or industrial drainage leaks."
              />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ title, text }: { title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
      <p>
        <span className="font-bold text-amber">{title}:</span>{" "}
        <span className="text-foreground/90">{text}</span>
      </p>
    </li>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "danger";
}) {
  const toneText =
    tone === "amber" ? "text-amber" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="rounded-md bg-slate-elev py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${toneText}`}>{value}</p>
    </div>
  );
}

function MiniSparkline() {
  const pts = [22, 24, 21, 26, 28, 32, 30, 38, 46, 52, 58, 66];
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * 100;
      const y = 100 - ((p - min) / (max - min)) * 100;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="oklch(0.82 0.17 75)" stopOpacity="0.55" />
          <stop offset="1" stopColor="oklch(0.82 0.17 75)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#spg)" />
      <path d={path} fill="none" stroke="oklch(0.82 0.17 75)" strokeWidth="2" />
    </svg>
  );
}

/* ---------------- sim panel ---------------- */

function SimPanel({
  mode,
  setMode,
}: {
  mode: SceneMode;
  setMode: (m: SceneMode) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-7xl px-3 pb-3 sm:px-6">
        <div className="rounded-2xl border border-border bg-slate-panel/95 shadow-2xl backdrop-blur">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/20 text-primary">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  Developer Simulation Panel
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Drive the prototype through hardcoded scenarios
                </p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {open ? "Hide" : "Show"}
            </span>
          </button>
          {open && (
            <div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2">
              <SimButton
                active={mode === "normal"}
                onClick={() => setMode("normal")}
                title="Trigger Normal State"
                subtitle="Water 180 cm &middot; Turbidity 40 NTU &middot; Gate Sealed"
                tone="emerald"
                icon={<Gauge className="h-4 w-4" />}
              />
              <SimButton
                active={mode === "peak"}
                onClick={() => setMode("peak")}
                title="Trigger Scenario A Peak"
                subtitle="Diversion active &middot; +35.4% pollution advisory"
                tone="danger"
                icon={<Timer className="h-4 w-4" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimButton({
  active,
  onClick,
  title,
  subtitle,
  tone,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  tone: "emerald" | "danger";
  icon: React.ReactNode;
}) {
  const toneRing =
    tone === "emerald"
      ? "ring-emerald bg-emerald-soft text-emerald"
      : "ring-danger bg-danger-soft text-danger";
  return (
    <button
      onClick={onClick}
      className={`group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        active
          ? `border-transparent ring-2 ${toneRing}`
          : "border-border bg-slate-elev hover:border-muted-foreground/40"
      }`}
    >
      <div
        className={`grid h-9 w-9 place-items-center rounded-lg ${
          tone === "emerald" ? "bg-emerald text-primary-foreground" : "bg-danger text-white"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          active
            ? tone === "emerald"
              ? "bg-emerald text-primary-foreground"
              : "bg-danger text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {active ? "ACTIVE" : "IDLE"}
      </span>
    </button>
  );
}

/* ---------------- utils ---------------- */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function jitter(spread: number) {
  return (Math.random() - 0.5) * spread;
}
