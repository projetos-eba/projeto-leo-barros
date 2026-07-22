"use client";

import {
  Activity,
  Calculator,
  Check,
  ClipboardPlus,
  Download,
  Dumbbell,
  Flame,
  Layers3,
  Loader2,
  Lock,
  Percent,
  Plus,
  Ruler,
  Save,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  Utensils,
  Weight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AssessmentActivityLevel,
  AssessmentFormula,
  AssessmentMethod,
  CalorieCalculation,
  PartnerClientAssessmentsData,
} from "@/lib/partners/client-assessments-metrics";
import {
  assessmentMethodLabels,
  activityLevels,
  buildChartDomain,
  buildCalorieProjection,
  buildDynamicNumberDomain,
  calculateCalories,
  circumferenceLabels,
  formulaLabels,
  skinfoldLabels,
} from "@/lib/partners/client-assessments-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  applyClientCalorieCalculation,
  saveClientAssessment,
  saveClientCalorieCalculation,
} from "./actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type PartnerClientAssessmentsViewProps = {
  assessments: PartnerClientAssessmentsData;
  overview: PartnerClientOverviewData;
};

const implementedTabs = [
  { href: "visao-geral", label: "Visão Geral" },
  { href: "avaliacoes", label: "Avaliações" },
  { href: "dietas", label: "Dietas" },
];

const futureTabs = ["Anamnese", "Prescrições", "Formulários"];

const circumferenceKeys = [
  "chest",
  "waist",
  "abdomen",
  "hip",
  "right_arm_relaxed",
  "right_arm_contracted",
  "left_arm_relaxed",
  "left_arm_contracted",
  "right_forearm",
  "left_forearm",
  "right_thigh",
  "left_thigh",
  "right_calf",
  "left_calf",
] as const;

const skinfoldKeys = [
  "pectoral",
  "abdominal",
  "triceps",
  "subscapular",
  "axillary",
  "suprailiac",
  "thigh",
  "medial_calf",
] as const;

const compositionMetrics = [
  { key: "bodyFatPercentage", label: "% Gordura", suffix: "%" },
  { key: "weightKg", label: "Peso corporal", suffix: " kg" },
  { key: "fatMassKg", label: "Massa gorda", suffix: " kg" },
  { key: "leanMassKg", label: "Massa magra", suffix: " kg" },
  { key: "muscleMassKg", label: "Massa muscular", suffix: " kg" },
];

const formulaNotes: Record<AssessmentFormula, string> = {
  cunningham: "Baseada em massa magra estimada ou informada.",
  harris_benedict: "Equação revisada para estimar metabolismo basal.",
  mifflin: "Referência prática para adultos ativos.",
  tinsley: "Alternativa por peso corporal para rotina esportiva.",
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[14px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] shadow-[0_2px_4px_rgba(0,0,0,0.07)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-[17px] font-bold uppercase leading-6 text-white sm:text-[20px] sm:leading-[30px]">{children}</h2>;
}

function formatNumber(value: number | null, suffix = "") {
  if (value === null) return "Sem dados";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}

function formatKcal(value: number | null) {
  if (value === null) return "Sem dados";
  return `${value.toLocaleString("pt-BR")} kcal`;
}

function deltaLabel(value: number | null, suffix: string, inverse = false) {
  if (value === null || value === 0) return "Estável";
  const positive = value > 0;
  const good = inverse ? !positive : positive;
  const sign = positive ? "+" : "";
  return `${good ? "↗" : "↘"} ${sign}${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}

function HeaderModule({ scope }: { scope: string }) {
  const Icon = scope === "dieta" ? Utensils : scope === "treino" ? Dumbbell : Target;
  const label = scope === "dieta" ? "Dieta" : scope === "treino" ? "Treino" : "Saúde";

  return (
    <span className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#2f82bf]/45 bg-[rgba(10,44,72,0.35)] px-3 text-[12px] font-semibold text-[#c5e7ff]">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function KpiCard({
  delta,
  helper,
  icon,
  inverseDelta,
  label,
  suffix,
  value,
}: {
  delta?: number | null;
  helper: string;
  icon: ReactNode;
  inverseDelta?: boolean;
  label: string;
  suffix?: string;
  value: number | string | null;
}) {
  const deltaGood = delta === null || delta === undefined || delta === 0 ? null : inverseDelta ? delta < 0 : delta > 0;

  return (
    <Panel className="min-h-[104px] overflow-hidden p-3 sm:min-h-[124px] sm:p-5">
      <div className="min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#68afe9]">
            {icon}
            <p className="min-w-0 text-[10px] font-medium uppercase leading-3 tracking-[0.05em] text-white sm:text-[12px] sm:leading-4">{label}</p>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <p className="min-w-0 whitespace-nowrap text-[20px] font-bold leading-6 text-white sm:text-[24px] sm:leading-7">
              {typeof value === "number" ? formatNumber(value, suffix) : value ?? "Sem dados"}
            </p>
            {delta !== undefined ? (
              <span
                className={cn(
                  "inline-flex min-h-[20px] shrink-0 items-center rounded-[5px] px-1.5 text-[10px] font-semibold sm:min-h-[22px] sm:px-2 sm:text-[11px]",
                  deltaGood === true && "bg-[#0a1f19] text-[#58a067]",
                  deltaGood === false && "bg-[#31151b] text-[#ff7b8e]",
                  deltaGood === null && "bg-[#162334] text-[#9aa5b6]",
                )}
              >
                {deltaLabel(delta, suffix ?? "", inverseDelta)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 min-w-0 text-[11px] leading-4 text-[#5a6477] sm:text-[12px]">{helper}</p>
        </div>
      </div>
    </Panel>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#303746] bg-[#111821]/70 p-3">
      <p className="text-[11px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#8b92a3]">{label}</p>
      <p className="mt-1 min-w-0 break-words text-[14px] font-semibold leading-5 text-white">{value}</p>
    </div>
  );
}

function FormulaCard({
  active,
  calculation,
  onSelect,
}: {
  active: boolean;
  calculation: CalorieCalculation;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        "min-h-[112px] rounded-[10px] border bg-[#101923]/80 p-3 text-left transition hover:border-[#3b97e3] sm:min-h-[124px] sm:rounded-[12px] sm:p-4",
        active ? "border-[#3b97e3] shadow-[0_0_0_1px_rgba(59,151,227,0.25)]" : "border-[#303746]",
      )}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold leading-4 text-white sm:text-[14px] sm:leading-5">{calculation.formulaLabel}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#8b92a3]">{formulaNotes[calculation.formula]}</p>
        </div>
        {active ? <Check className="size-4 text-[#3b97e3]" /> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.05em] text-[#5a6477]">TMB</p>
          <p className="text-[15px] font-bold text-white sm:text-[17px]">{calculation.bmrKcal.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.05em] text-[#5a6477]">GET</p>
          <p className="text-[15px] font-bold text-white sm:text-[17px]">{calculation.tdeeKcal.toLocaleString("pt-BR")}</p>
        </div>
      </div>
    </button>
  );
}

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => setWidth(Math.floor(element.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

type ChartTooltipPayload = Array<{
  dataKey?: string | number;
  value?: number | string;
}>;

function CompactCalorieTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipPayload;
}) {
  if (!active || !payload?.length) return null;

  const goal = payload.find((item) => item.dataKey === "goalKcal")?.value;
  const maintenance = payload.find((item) => item.dataKey === "maintenanceKcal")?.value;

  return (
    <div className="w-[154px] rounded-[8px] border border-[#2f82bf] bg-[#071827] px-3 py-2 text-[#f4f8fb] shadow-[0_10px_24px_rgba(0,0,0,0.25)] sm:w-[180px]">
      <p className="text-[14px] font-semibold leading-5 sm:text-[15px]">Dia {label}</p>
      <div className="mt-2 grid gap-1 text-[12px] leading-4 sm:text-[13px]">
        <p className="truncate text-[#3b97e3]">Meta: {typeof goal === "number" ? goal.toLocaleString("pt-BR") : goal} kcal</p>
        <p className="truncate text-[#9aa5b6]">Manter: {typeof maintenance === "number" ? maintenance.toLocaleString("pt-BR") : maintenance} kcal</p>
      </div>
    </div>
  );
}

function CalorieProjectionChart({ data }: { data: PartnerClientAssessmentsData["calorie"]["projection"] }) {
  const { ref, width } = useMeasuredWidth();
  const domain = buildDynamicNumberDomain(
    data.flatMap((item) => [item.goalKcal, item.maintenanceKcal]),
    0.16,
  );
  const compact = width > 0 && width < 430;
  const chartHeight = compact ? 218 : 230;
  const xTicks = compact ? data.filter((item) => item.day % 30 === 0).map((item) => item.day) : undefined;
  const tooltipPosition = compact ? { x: Math.max(72, width - 184), y: 58 } : undefined;

  return (
    <div className="h-[218px] min-w-0 overflow-hidden sm:h-[230px]" data-testid="client-assessments-calorie-chart" ref={ref}>
      {width > 0 && data.length > 0 ? (
        <LineChart data={data} height={chartHeight} margin={{ bottom: 2, left: compact ? -16 : -10, right: compact ? 10 : 6, top: 10 }} width={width}>
          <CartesianGrid stroke="#31536b" strokeDasharray="4 6" strokeOpacity={0.75} vertical={false} />
          <XAxis axisLine={false} dataKey="day" tick={{ fill: "#9aa5b6", fontSize: compact ? 10 : 11 }} tickFormatter={(value) => `${value}d`} tickLine={false} ticks={xTicks} />
          <YAxis axisLine={false} domain={domain} tick={{ fill: "#9aa5b6", fontSize: compact ? 10 : 11 }} tickLine={false} width={compact ? 46 : 52} />
          <Tooltip
            allowEscapeViewBox={{ x: false, y: false }}
            content={<CompactCalorieTooltip />}
            cursor={{ stroke: "#d7dae0", strokeWidth: 1 }}
            position={tooltipPosition}
            wrapperStyle={{ maxWidth: compact ? 160 : 190, zIndex: 20 }}
          />
          <Line dataKey="maintenanceKcal" dot={{ fill: "#5a6477", r: 3 }} name="Manter peso" stroke="#7b8794" strokeDasharray="6 6" strokeWidth={2.2} type="monotone" />
          <Line dataKey="goalKcal" dot={{ fill: "#3b97e3", r: 3 }} name="Chegar à meta" stroke="#3b97e3" strokeWidth={2.8} type="monotone" />
        </LineChart>
      ) : (
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Sem dados para projetar calorias.</div>
      )}
    </div>
  );
}

function CircumferenceChart({
  data,
  metrics,
  mode = "general",
}: {
  data: PartnerClientAssessmentsData["charts"]["circumferenceSeries"];
  metrics: PartnerClientAssessmentsData["circumferences"]["availableMetrics"];
  mode?: "general" | "region" | "radar";
}) {
  const { ref, width } = useMeasuredWidth();
  const colors = ["#3b97e3", "#58a067", "#f0c76a", "#ff7b8e", "#9b7cff"];
  const visibleMetrics = metrics.slice(0, mode === "region" ? 8 : 5);
  const domain = buildChartDomain(data, visibleMetrics.map((metric) => metric.key), 0.14);
  const latest = data.at(-1);
  const radarData = visibleMetrics.map((metric) => ({
    metric: metric.label,
    value: typeof latest?.[metric.key] === "number" ? latest[metric.key] as number : 0,
  }));

  return (
    <div className="h-[260px] min-w-0 overflow-visible" data-testid="client-assessments-circumference-chart" ref={ref}>
      {width > 0 && data.length > 0 && metrics.length > 0 ? (
        mode === "radar" ? (
          <RadarChart cx="50%" cy="50%" data={radarData} height={260} outerRadius={Math.min(82, Math.max(54, width / 5))} width={width}>
            <PolarGrid stroke="#31536b" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#9aa5b6", fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={buildDynamicNumberDomain(radarData.map((item) => item.value), 0.18)} tick={{ fill: "#9aa5b6", fontSize: 10 }} />
            <Radar dataKey="value" fill="#3b97e3" fillOpacity={0.24} stroke="#3b97e3" strokeWidth={2} />
          </RadarChart>
        ) : (
        <LineChart data={data} height={260} margin={{ bottom: 4, left: -10, right: 6, top: 12 }} width={width}>
          <CartesianGrid stroke="#31536b" strokeDasharray="4 6" strokeOpacity={0.7} vertical={false} />
          <XAxis axisLine={false} dataKey="date" tick={{ fill: "#9aa5b6", fontSize: 11 }} tickLine={false} />
          <YAxis axisLine={false} domain={domain} tick={{ fill: "#9aa5b6", fontSize: 11 }} tickLine={false} width={42} />
          <Tooltip
            wrapperStyle={{ maxWidth: Math.max(180, width - 24), zIndex: 20 }}
            contentStyle={{ background: "#071827", border: "1px solid #2f82bf", borderRadius: 8, color: "#f4f8fb" }}
            formatter={(value, name) => [`${Number(value).toLocaleString("pt-BR")} cm`, circumferenceLabels[String(name)] ?? name]}
          />
          {visibleMetrics.map((metric, index) => (
            <Line
              dataKey={metric.key}
              dot={{ fill: colors[index % colors.length], r: 3 }}
              key={metric.key}
              name={metric.label}
              stroke={colors[index % colors.length]}
              strokeWidth={2.5}
              type="monotone"
            />
          ))}
        </LineChart>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Sem circunferências registradas.</div>
      )}
    </div>
  );
}


function ModeToggle<TMode extends string>({
  modes,
  onChange,
  value,
}: {
  modes: Array<{ label: string; value: TMode }>;
  onChange: (value: TMode) => void;
  value: TMode;
}) {
  return (
    <div className="inline-flex rounded-[10px] border border-[#303746] bg-[#0d1620] p-1">
      {modes.map((mode) => (
        <button
          className={cn(
            "h-8 rounded-[8px] px-3 text-[11px] font-semibold text-[#8b92a3]",
            value === mode.value && "bg-[#173a56] text-[#8fcfff] shadow-[inset_0_0_0_1px_rgba(59,151,227,0.35)]",
          )}
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function CompositionChart({
  data,
  mode,
}: {
  data: PartnerClientAssessmentsData["charts"]["compositionSeries"];
  mode: "dynamic" | "stack";
}) {
  const { ref, width } = useMeasuredWidth();
  const colors = ["#3b97e3", "#a277ff", "#ff7b8e", "#58a067", "#f0c76a"];
  const visible = mode === "dynamic" ? compositionMetrics.filter((metric) => metric.key !== "muscleMassKg") : compositionMetrics;
  const domain = buildChartDomain(data, visible.map((metric) => metric.key), 0.14);

  return (
    <div className="h-[260px] min-w-0 overflow-visible" data-testid="client-assessments-composition-chart" ref={ref}>
      {width > 0 && data.length > 0 ? (
        <LineChart data={data} height={260} margin={{ bottom: 4, left: -10, right: 6, top: 12 }} width={width}>
          <CartesianGrid stroke="#31536b" strokeDasharray="4 6" strokeOpacity={0.7} vertical={false} />
          <XAxis axisLine={false} dataKey="date" tick={{ fill: "#9aa5b6", fontSize: 11 }} tickLine={false} />
          <YAxis axisLine={false} domain={domain} tick={{ fill: "#9aa5b6", fontSize: 11 }} tickLine={false} width={42} />
          <Tooltip
            wrapperStyle={{ maxWidth: Math.max(180, width - 24), zIndex: 20 }}
            contentStyle={{ background: "#071827", border: "1px solid #2f82bf", borderRadius: 8, color: "#f4f8fb" }}
            formatter={(value, name) => {
              const metric = compositionMetrics.find((item) => item.key === name);
              return [String(Number(value).toLocaleString("pt-BR")) + (metric?.suffix ?? ""), metric?.label ?? name];
            }}
          />
          {visible.map((metric, index) => (
            <Line
              dataKey={metric.key}
              dot={{ fill: colors[index % colors.length], r: 3 }}
              key={metric.key}
              name={metric.label}
              stroke={colors[index % colors.length]}
              strokeDasharray={mode === "stack" && metric.key === "weightKg" ? "6 6" : undefined}
              strokeWidth={2.4}
              type="monotone"
            />
          ))}
        </LineChart>
      ) : (
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Sem composição registrada.</div>
      )}
    </div>
  );
}

function SkinfoldChart({
  data,
  metrics,
  mode,
}: {
  data: PartnerClientAssessmentsData["charts"]["skinfoldSeries"];
  metrics: PartnerClientAssessmentsData["skinfolds"]["availableMetrics"];
  mode: "general" | "region" | "radar";
}) {
  const { ref, width } = useMeasuredWidth();
  const colors = ["#3b97e3", "#ff7b8e", "#a277ff", "#58a067", "#f0c76a", "#62d0ff", "#d678ff", "#f48c58"];
  const visibleMetrics = metrics.slice(0, mode === "region" ? 8 : 5);
  const domain = buildChartDomain(data, visibleMetrics.map((metric) => metric.key), 0.16);
  const latest = data.at(-1);
  const radarData = visibleMetrics.map((metric) => ({
    metric: metric.label,
    value: typeof latest?.[metric.key] === "number" ? latest[metric.key] as number : 0,
  }));

  return (
    <div className="h-[260px] min-w-0 overflow-visible" data-testid="client-assessments-skinfold-chart" ref={ref}>
      {width > 0 && data.length > 0 && metrics.length > 0 ? (
        mode === "radar" ? (
          <RadarChart cx="50%" cy="50%" data={radarData} height={260} outerRadius={Math.min(82, Math.max(54, width / 5))} width={width}>
            <PolarGrid stroke="#31536b" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#9aa5b6", fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={buildDynamicNumberDomain(radarData.map((item) => item.value), 0.18)} tick={{ fill: "#9aa5b6", fontSize: 10 }} />
            <Radar dataKey="value" fill="#a277ff" fillOpacity={0.24} stroke="#a277ff" strokeWidth={2} />
          </RadarChart>
        ) : (
          <LineChart data={data} height={260} margin={{ bottom: 4, left: -10, right: 6, top: 12 }} width={width}>
            <CartesianGrid stroke="#31536b" strokeDasharray="4 6" strokeOpacity={0.7} vertical={false} />
            <XAxis axisLine={false} dataKey="date" tick={{ fill: "#9aa5b6", fontSize: 11 }} tickLine={false} />
            <YAxis axisLine={false} domain={domain} tick={{ fill: "#9aa5b6", fontSize: 11 }} tickLine={false} width={42} />
            <Tooltip
              wrapperStyle={{ maxWidth: Math.max(180, width - 24), zIndex: 20 }}
              contentStyle={{ background: "#071827", border: "1px solid #2f82bf", borderRadius: 8, color: "#f4f8fb" }}
              formatter={(value, name) => [String(Number(value).toLocaleString("pt-BR")) + " mm", skinfoldLabels[String(name)] ?? name]}
            />
            {visibleMetrics.map((metric, index) => (
              <Line
                dataKey={metric.key}
                dot={{ fill: colors[index % colors.length], r: 3 }}
                key={metric.key}
                name={metric.label}
                stroke={colors[index % colors.length]}
                strokeWidth={2.4}
                type="monotone"
              />
            ))}
          </LineChart>
        )
      ) : (
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Sem dobras cutâneas registradas.</div>
      )}
    </div>
  );
}

function exportCsv(
  data: PartnerClientAssessmentsData,
  selected: CalorieCalculation | null,
  projection: PartnerClientAssessmentsData["calorie"]["projection"],
) {
  const rows = [
    ["Tipo", "Campo", "Valor"],
    ["Calculo", "Formula", selected?.formulaLabel ?? "Sem cálculo"],
    ["Calculo", "TMB", selected?.bmrKcal ?? ""],
    ["Calculo", "GET", selected?.tdeeKcal ?? ""],
    ["Calculo", "Calorias para objetivo", selected?.targetKcal ?? ""],
    ...projection.map((item) => ["Projecao", `Dia ${item.day}`, `${item.goalKcal} kcal`]),
    ...data.skinfolds.latest.map((item) => ["Dobra cutanea", item.label, `${item.valueMm} mm`]),
    ...data.circumferences.latest.map((item) => ["Circunferencia", item.label, `${item.valueCm} cm`]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `avaliacoes-${data.client.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function AssessmentDialog({
  data,
  onOpenChange,
  open,
}: {
  data: PartnerClientAssessmentsData;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const router = useRouter();
  const latest = data.latestAssessment;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    activityLevel: latest?.activityLevel ?? "moderate",
    assessmentMethod: latest?.assessmentMethod ?? "pollock_7",
    assessedAt: new Date().toISOString().slice(0, 10),
    bodyFatPercentage: latest?.bodyFatPercentage?.toString() ?? "",
    heightCm: latest?.heightCm?.toString() ?? "175",
    muscleMassKg: latest?.muscleMassKg?.toString() ?? "",
    notes: "",
    targetDays: latest?.targetDays?.toString() ?? "90",
    targetWeightKg: latest?.targetWeightKg?.toString() ?? "",
    title: "Avaliação corporal",
    weightKg: latest?.weightKg?.toString() ?? "",
  });
  const [circumferences, setCircumferences] = useState<Record<string, string>>(() =>
    Object.fromEntries(circumferenceKeys.map((key) => [
      key,
      latest?.circumferences.find((item) => item.metricKey === key)?.valueCm.toString() ?? "",
    ])),
  );
  const [skinfolds, setSkinfolds] = useState<Record<string, string>>(() =>
    Object.fromEntries(skinfoldKeys.map((key) => [
      key,
      latest?.skinfolds.find((item) => item.metricKey === key)?.valueMm.toString() ?? "",
    ])),
  );

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await saveClientAssessment({
        activityLevel: form.activityLevel as AssessmentActivityLevel,
        assessmentMethod: form.assessmentMethod as AssessmentMethod,
        assessedAt: new Date(`${form.assessedAt}T12:00:00`).toISOString(),
        bodyFatPercentage: form.bodyFatPercentage ? Number(form.bodyFatPercentage) : null,
        circumferences: Object.entries(circumferences)
          .filter(([, value]) => value.trim() !== "")
          .map(([metricKey, value]) => ({ metricKey: metricKey as (typeof circumferenceKeys)[number], valueCm: Number(value) })),
        heightCm: Number(form.heightCm),
        muscleMassKg: form.muscleMassKg ? Number(form.muscleMassKg) : null,
        notes: form.notes || null,
        patientId: data.client.id,
        skinfolds: Object.entries(skinfolds)
          .filter(([, value]) => value.trim() !== "")
          .map(([metricKey, value]) => ({ metricKey: metricKey as (typeof skinfoldKeys)[number], valueMm: Number(value) })),
        targetDays: Number(form.targetDays),
        targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : null,
        title: form.title,
        weightKg: Number(form.weightKg),
      });

      if (!result.ok) {
        setError(result.error ?? "Não foi possível salvar a avaliação.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#303746] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[760px] sm:rounded-[14px]">
        <DialogHeader className="border-b border-[#303746] px-4 py-4 text-left sm:px-6 sm:py-5">
          <DialogTitle className="text-[20px] font-bold sm:text-[24px]">Nova avaliação</DialogTitle>
          <DialogDescription className="text-[#8b92a3]">
            Registre dados corporais, metodologia, dobras cutâneas, circunferências e parâmetros para cálculo calórico.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Label text="Título"><Input required value={form.title} onChange={(value) => setField("title", value)} /></Label>
            <Label text="Data"><Input required type="date" value={form.assessedAt} onChange={(value) => setField("assessedAt", value)} /></Label>
            <Label text="Altura (cm)"><Input required inputMode="decimal" value={form.heightCm} onChange={(value) => setField("heightCm", value)} /></Label>
            <Label text="Peso (kg)"><Input required inputMode="decimal" value={form.weightKg} onChange={(value) => setField("weightKg", value)} /></Label>
            <Label text="% gordura"><Input inputMode="decimal" value={form.bodyFatPercentage} onChange={(value) => setField("bodyFatPercentage", value)} /></Label>
            <Label text="Massa muscular (kg)"><Input inputMode="decimal" value={form.muscleMassKg} onChange={(value) => setField("muscleMassKg", value)} /></Label>
            <Label text="Peso meta (kg)"><Input inputMode="decimal" value={form.targetWeightKg} onChange={(value) => setField("targetWeightKg", value)} /></Label>
            <Label text="Prazo (dias)"><Input required inputMode="numeric" value={form.targetDays} onChange={(value) => setField("targetDays", value)} /></Label>
            <label className="grid gap-2 text-[12px] font-semibold text-[#d7dae0] sm:text-[13px]">
              Nível de atividade
              <select className="h-10 w-full min-w-0 rounded-[10px] border border-[#303746] bg-[#161a22] px-2 text-[13px] outline-none focus:border-[#3b97e3] sm:px-3 sm:text-[14px]" value={form.activityLevel} onChange={(event) => setField("activityLevel", event.target.value)}>
                {Object.entries(activityLevels).map(([key, value]) => <option key={key} value={key}>{value.shortLabel}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-[12px] font-semibold text-[#d7dae0] sm:text-[13px]">
              Método de avaliação física
              <select className="h-10 w-full min-w-0 rounded-[10px] border border-[#303746] bg-[#161a22] px-2 text-[13px] outline-none focus:border-[#3b97e3] sm:px-3 sm:text-[14px]" value={form.assessmentMethod} onChange={(event) => setField("assessmentMethod", event.target.value)}>
                {Object.entries(assessmentMethodLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
              </select>
            </label>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-white">Dobras cutâneas</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {skinfoldKeys.map((key) => (
                <Label key={key} text={String(skinfoldLabels[key] ?? key) + " (mm)"}>
                  <Input inputMode="decimal" value={skinfolds[key]} onChange={(value) => setSkinfolds((current) => ({ ...current, [key]: value }))} />
                </Label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-white">Circunferências</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {circumferenceKeys.map((key) => (
                <Label key={key} text={`${circumferenceLabels[key]} (cm)`}>
                  <Input inputMode="decimal" value={circumferences[key]} onChange={(value) => setCircumferences((current) => ({ ...current, [key]: value }))} />
                </Label>
              ))}
            </div>
          </div>

          <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
            Observações
            <textarea className="min-h-24 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 py-2 text-[14px] outline-none focus:border-[#3b97e3]" value={form.notes} onChange={(event) => setField("notes", event.target.value)} />
          </label>

          {error ? <p className="rounded-[10px] border border-[#6e3535] bg-[#31151b] px-3 py-2 text-[13px] text-[#ff7b8e]">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3 border-t border-[#303746] pt-4 sm:flex sm:justify-end sm:pt-5">
            <button className="h-10 rounded-[10px] border border-[#303746] px-5 text-[14px] font-semibold text-white" type="button" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#3b97e3] px-5 text-[14px] font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar avaliação
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, text }: { children: ReactNode; text: string }) {
  return <label className="grid gap-1.5 text-[12px] font-semibold leading-4 text-[#d7dae0] sm:gap-2 sm:text-[13px]">{text}{children}</label>;
}

function Input({
  inputMode,
  onChange,
  required,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "numeric";
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <input
      className="h-10 min-w-0 rounded-[10px] border border-[#303746] bg-[#161a22] px-2 text-[13px] outline-none focus:border-[#3b97e3] sm:px-3 sm:text-[14px]"
      inputMode={inputMode}
      required={required}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function PartnerClientAssessmentsView({ assessments, overview }: PartnerClientAssessmentsViewProps) {
  const router = useRouter();
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<AssessmentFormula>(assessments.calorie.selected?.formula ?? "mifflin");
  const [compositionMode, setCompositionMode] = useState<"dynamic" | "stack">("dynamic");
  const [skinfoldMode, setSkinfoldMode] = useState<"general" | "region" | "radar">("general");
  const [circumferenceMode, setCircumferenceMode] = useState<"general" | "region" | "radar">("general");
  const [pendingAction, setPendingAction] = useState<"save" | "apply" | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [calorieInputs, setCalorieInputs] = useState(() => {
    const latest = assessments.latestAssessment;
    const saved = (assessments.calorie.latestApplied ?? assessments.calculations[0])?.inputs ?? {};
    const savedNumber = (key: string, fallback: number | null) =>
      typeof saved[key] === "number" ? saved[key] as number : fallback;
    const savedActivity = saved.activityLevel;
    return {
      activityLevel: typeof savedActivity === "string" && savedActivity in activityLevels
        ? savedActivity as AssessmentActivityLevel
        : latest?.activityLevel ?? "moderate",
      heightCm: savedNumber("heightCm", latest?.heightCm ?? null),
      targetWeightKg: savedNumber("targetWeightKg", latest?.targetWeightKg ?? null),
      weightKg: savedNumber("weightKg", latest?.weightKg ?? null),
    };
  });
  const calorieComparison = useMemo(() => {
    if (!assessments.latestAssessment || !assessments.client.age || calorieInputs.heightCm === null || calorieInputs.weightKg === null) return [];
    const age = assessments.client.age;
    const heightCm = calorieInputs.heightCm;
    const latestAssessment = assessments.latestAssessment;
    const weightKg = calorieInputs.weightKg;
    return (Object.keys(formulaLabels) as AssessmentFormula[]).map((formula) => calculateCalories({
      activityLevel: calorieInputs.activityLevel,
      age,
      bodyFatPercentage: latestAssessment.bodyFatPercentage,
      formula,
      gender: assessments.client.gender,
      heightCm,
      targetDays: latestAssessment.targetDays,
      targetWeightKg: calorieInputs.targetWeightKg,
      weightKg,
    }));
  }, [assessments, calorieInputs]);
  const selectedCalculation = calorieComparison.find((item) => item.formula === selectedFormula) ?? null;
  const calorieProjection = useMemo(() => {
    if (!selectedCalculation || !assessments.latestAssessment || !assessments.client.age || calorieInputs.heightCm === null || calorieInputs.weightKg === null) return [];
    const age = assessments.client.age;
    const heightCm = calorieInputs.heightCm;
    const latestAssessment = assessments.latestAssessment;
    const weightKg = calorieInputs.weightKg;
    return buildCalorieProjection({
      activityLevel: calorieInputs.activityLevel,
      age,
      bodyFatPercentage: latestAssessment.bodyFatPercentage,
      formula: selectedFormula,
      gender: assessments.client.gender,
      heightCm,
      targetDays: latestAssessment.targetDays,
      targetWeightKg: calorieInputs.targetWeightKg,
      weightKg,
    }, selectedCalculation);
  }, [assessments, calorieInputs, selectedCalculation, selectedFormula]);

  async function saveCalculation(apply: boolean) {
    if (!selectedCalculation || !assessments.latestAssessment) return;
    setPendingAction(apply ? "apply" : "save");
    setActionMessage(null);

    try {
      const result = await saveClientCalorieCalculation({
        activityFactor: selectedCalculation.activityFactor,
        assessmentId: assessments.latestAssessment.id,
        bmrKcal: selectedCalculation.bmrKcal,
        dailyEnergyDeltaKcal: selectedCalculation.dailyEnergyDeltaKcal,
        formula: selectedCalculation.formula,
        inputs: {
          activityLevel: calorieInputs.activityLevel,
          bodyFatPercentage: assessments.latestAssessment.bodyFatPercentage,
          heightCm: calorieInputs.heightCm,
          targetDays: selectedCalculation.targetDays,
          targetWeightKg: selectedCalculation.targetWeightKg,
          weightKg: calorieInputs.weightKg,
        },
        patientId: assessments.client.id,
        projectedWeightDeltaKg: selectedCalculation.projectedWeightDeltaKg,
        targetDays: selectedCalculation.targetDays,
        targetKcal: selectedCalculation.targetKcal,
        targetWeightKg: selectedCalculation.targetWeightKg,
        tdeeKcal: selectedCalculation.tdeeKcal,
        weeklyEnergyDeltaKcal: selectedCalculation.weeklyEnergyDeltaKcal,
      });

      if (!result.ok || !result.id) {
        setActionMessage(result.error ?? "Não foi possível salvar o cálculo.");
        return;
      }

      if (apply) {
        const applyResult = await applyClientCalorieCalculation({
          calculationId: result.id,
          patientId: assessments.client.id,
        });
        setActionMessage(applyResult.ok ? applyResult.message ?? "Cálculo aplicado." : applyResult.error ?? "Não foi possível aplicar.");
      } else {
        setActionMessage(result.message ?? "Cálculo salvo.");
      }

      router.refresh();
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-3 py-4 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] sm:px-5 sm:py-6 lg:px-6">
      <div className="relative mx-auto min-w-0 max-w-[1197px]">
        <PartnerClientProfileHeader activeTab="avaliacoes" overview={overview} />

        <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-8 xl:grid-cols-3 2xl:grid-cols-6">
          <KpiCard delta={assessments.kpis.weight.delta} helper={assessments.kpis.weight.helper} icon={<Weight className="size-4" />} inverseDelta label="Peso atual" suffix=" kg" value={assessments.kpis.weight.value} />
          <KpiCard delta={assessments.kpis.bodyFat.delta} helper={assessments.kpis.bodyFat.helper} icon={<Percent className="size-4" />} inverseDelta label="% Gordura" suffix="%" value={assessments.kpis.bodyFat.value} />
          <KpiCard delta={assessments.kpis.muscleMass.delta} helper={assessments.kpis.muscleMass.helper} icon={<Dumbbell className="size-4" />} label="Massa muscular" suffix=" kg" value={assessments.kpis.muscleMass.value} />
          <KpiCard delta={assessments.kpis.leanMass.delta} helper={assessments.kpis.leanMass.helper} icon={<Activity className="size-4" />} label="Massa magra" suffix=" kg" value={assessments.kpis.leanMass.value} />
          <KpiCard delta={assessments.kpis.bmi.delta} helper={assessments.kpis.bmi.classification} icon={<Ruler className="size-4" />} label="IMC" value={assessments.kpis.bmi.value} />
          <KpiCard helper={assessments.kpis.lastAssessment.daysAgoLabel} icon={<ClipboardPlus className="size-4" />} label="Última avaliação" value={assessments.kpis.lastAssessment.value} />
        </section>

        <Panel className="mt-5 overflow-hidden p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303746] px-3 py-4 sm:px-5">
            <div>
              <SectionTitle>Cálculo Calórico</SectionTitle>
              <p className="mt-1 text-[12px] leading-5 text-[#8b92a3] sm:text-[13px]">Defina fórmula, parâmetros e metas para calcular necessidades calóricas do Cliente.</p>
            </div>
            <label className="grid max-w-full gap-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
              Fórmula selecionada
              <select className="h-10 max-w-full rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[13px] normal-case tracking-normal text-white outline-none focus:border-[#3b97e3]" value={selectedFormula} onChange={(event) => setSelectedFormula(event.target.value as AssessmentFormula)}>
                {Object.entries(formulaLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid gap-4 p-3 sm:gap-5 sm:p-5">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Metodologias</h3>
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#303746] px-3 py-1 text-[11px] font-semibold text-[#8b92a3]"><SlidersHorizontal className="size-3.5 shrink-0" /> <span className="truncate">{assessmentMethodLabels[assessments.latestAssessment?.assessmentMethod ?? "pollock_7"]}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {calorieComparison.length > 0 ? calorieComparison.map((calculation) => (
                <FormulaCard active={selectedFormula === calculation.formula} calculation={calculation} key={calculation.formula} onSelect={() => setSelectedFormula(calculation.formula)} />
              )) : (
                <div className="rounded-[12px] border border-[#303746] bg-[#111821] p-4 text-[13px] text-[#8b92a3]">Cadastre uma avaliação para habilitar cálculos.</div>
              )}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.25fr_0.9fr]">
              <div className="rounded-[12px] border border-[#303746] bg-[#111821]/80 p-3 sm:p-4">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">Dados do Cliente</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4">
                  <MiniInfo label="Gênero" value={overview.client.genderLabel} />
                  <MiniInfo label="Idade" value={overview.client.ageLabel} />
                  <label className="grid gap-1 text-[11px] font-semibold uppercase text-[#8b92a3]">
                    Altura (cm)
                    <input aria-label="Altura (cm)" className="h-10 rounded-[8px] border border-[#303746] bg-[#081522] px-3 text-[13px] font-semibold text-white outline-none focus:border-[#3b97e3]" min="100" step="0.1" type="number" value={calorieInputs.heightCm ?? ""} onChange={(event) => setCalorieInputs((current) => ({ ...current, heightCm: event.target.value === "" ? null : Number(event.target.value) }))} />
                  </label>
                  <label className="grid gap-1 text-[11px] font-semibold uppercase text-[#8b92a3]">
                    Peso atual (kg)
                    <input aria-label="Peso atual (kg)" className="h-10 rounded-[8px] border border-[#303746] bg-[#081522] px-3 text-[13px] font-semibold text-white outline-none focus:border-[#3b97e3]" min="20" step="0.1" type="number" value={calorieInputs.weightKg ?? ""} onChange={(event) => setCalorieInputs((current) => ({ ...current, weightKg: event.target.value === "" ? null : Number(event.target.value) }))} />
                  </label>
                  <label className="grid gap-1 text-[11px] font-semibold uppercase text-[#8b92a3]">
                    Peso meta (kg)
                    <input aria-label="Peso meta (kg)" className="h-10 rounded-[8px] border border-[#303746] bg-[#081522] px-3 text-[13px] font-semibold text-white outline-none focus:border-[#3b97e3]" min="20" step="0.1" type="number" value={calorieInputs.targetWeightKg ?? ""} onChange={(event) => setCalorieInputs((current) => ({ ...current, targetWeightKg: event.target.value === "" ? null : Number(event.target.value) }))} />
                  </label>
                  <MiniInfo label="Prazo" value={`${assessments.latestAssessment?.targetDays ?? 90} dias`} />
                </div>
                <label className="mt-3 grid gap-1 text-[11px] font-semibold uppercase text-[#8b92a3]">
                  Fator de atividade
                  <select aria-label="Fator de atividade" className="h-10 rounded-[8px] border border-[#303746] bg-[#081522] px-3 text-[13px] normal-case text-white outline-none focus:border-[#3b97e3]" value={calorieInputs.activityLevel} onChange={(event) => setCalorieInputs((current) => ({ ...current, activityLevel: event.target.value as AssessmentActivityLevel }))}>
                    {Object.entries(activityLevels).sort((left, right) => left[1].factor - right[1].factor).map(([key, value]) => <option key={key} value={key}>{value.shortLabel} ({value.factor})</option>)}
                  </select>
                </label>
                <div className="mt-3 rounded-[8px] bg-[#081522] p-3 text-[11px] leading-4 text-[#8fcfff]">
                  Fator aplicado: {selectedCalculation?.activityFactor ?? "-"} - {selectedCalculation?.activityLabel ?? "Sem dados"}
                </div>
              </div>

              <div className="grid content-start gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Panel className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-[#f0c76a]"><Flame className="size-4" /><p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#9aa5b6]">Calorias para manutenção</p></div>
                    <p className="mt-3 whitespace-nowrap text-[22px] font-bold leading-8 text-white sm:text-[30px] sm:leading-10">{formatKcal(selectedCalculation?.tdeeKcal ?? null)}</p>
                    <p className="mt-1 text-[12px] text-[#5a6477]">TMB {formatKcal(selectedCalculation?.bmrKcal ?? null)}</p>
                  </Panel>
                  <Panel className="border-[#2f82bf]/70 bg-[linear-gradient(135deg,rgba(33,150,243,0.5),rgba(11,35,58,0.8))] p-3 shadow-[0_0_0_1px_rgba(59,151,227,0.24)] sm:p-4">
                    <div className="flex items-center gap-2 text-[#bde5ff]"><Target className="size-4" /><p className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#d9f1ff]">Calorias para objetivo</p></div>
                    <p className="mt-3 whitespace-nowrap text-[22px] font-bold leading-8 text-white sm:text-[30px] sm:leading-10">{formatKcal(selectedCalculation?.targetKcal ?? null)}</p>
                    <p className="mt-1 text-[12px] text-[#c5e7ff]">{selectedCalculation?.strategyLabel ?? "Sem estratégia"}</p>
                  </Panel>
                </div>
                <div className="rounded-[12px] border border-[#303746] bg-[#081522]/70 p-3 sm:p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Projeção calórica ao longo do tempo</h3>
                  <div className="flex gap-4 text-[12px] text-[#9aa5b6]">
                    <span className="inline-flex items-center gap-2"><span className="h-px w-4 bg-[#7b8794]" /> Manter peso</span>
                    <span className="inline-flex items-center gap-2"><span className="h-px w-4 bg-[#3b97e3]" /> Chegar à meta</span>
                  </div>
                </div>
                  <CalorieProjectionChart data={calorieProjection} />
                </div>
              </div>

              <div className="rounded-[12px] border border-[#303746] bg-[#111821]/80 p-3 sm:p-4">
                <h3 className="text-[15px] font-bold uppercase text-white">Resumo da estratégia</h3>
                <div className="mt-4 grid gap-3">
                <MiniInfo label="Fórmula" value={selectedCalculation?.formulaLabel ?? "Sem cálculo"} />
                <MiniInfo label="TMB" value={formatKcal(selectedCalculation?.bmrKcal ?? null)} />
                <MiniInfo label="GET" value={formatKcal(selectedCalculation?.tdeeKcal ?? null)} />
                <MiniInfo label="Déficit/superávit diário" value={formatKcal(selectedCalculation?.dailyEnergyDeltaKcal ?? null)} />
                <MiniInfo label="Déficit/superávit semanal" value={formatKcal(selectedCalculation?.weeklyEnergyDeltaKcal ?? null)} />
                <MiniInfo label="Tempo para meta" value={selectedCalculation ? `${selectedCalculation.targetDays} dias` : "Sem prazo"} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#303746] px-3 py-4 sm:px-5">
            {actionMessage ? <p className="text-[13px] text-[#8fcfff]">{actionMessage}</p> : <span />}
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#303746] px-4 text-[14px] font-semibold text-white" type="button" onClick={() => setSelectedFormula("mifflin")}>
                <Calculator className="size-4" /> Recalcular
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#173a56] px-4 text-[14px] font-semibold text-[#c5e7ff] disabled:opacity-60" disabled={!selectedCalculation || pendingAction !== null} type="button" onClick={() => saveCalculation(false)}>
                {pendingAction === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar cálculo
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-semibold text-white disabled:opacity-60" disabled={!selectedCalculation || pendingAction !== null} type="button" onClick={() => saveCalculation(true)}>
                {pendingAction === "apply" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Aplicar ao plano
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#303746] px-4 text-[14px] font-semibold text-white" type="button" onClick={() => exportCsv(assessments, selectedCalculation, calorieProjection)}>
                <Download className="size-4" /> Exportar planilha
              </button>
            </div>
          </div>
        </Panel>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <Panel className="p-3 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <SectionTitle>Avaliação Física</SectionTitle>
                <p className="mt-1 text-[12px] leading-5 text-[#8b92a3] sm:text-[13px]">Dobras cutâneas, circunferências e método técnico da última avaliação.</p>
              </div>
              <button className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-[#3b97e3] px-3 text-[13px] font-semibold text-white sm:h-10 sm:rounded-[10px] sm:px-4 sm:text-[14px]" type="button" onClick={() => setAssessmentOpen(true)}>
                <ClipboardPlus className="size-4" /> Registrar dados
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[#8fcfff]"><Layers3 className="size-4" /><h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Dobras cutâneas (mm)</h3></div>
                <div className="grid grid-cols-2 gap-2">
                  {assessments.skinfolds.latest.map((item) => (
                    <div className="rounded-[10px] border border-[#303746] bg-[#111821]/70 p-2.5 sm:p-3" key={item.key}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-[12px] font-semibold text-[#d7dae0]">{item.label}</p>
                        <span className="hidden text-[10px] uppercase text-[#5a6477] sm:inline">{item.region}</span>
                      </div>
                      <p className="mt-2 text-[17px] font-bold text-white sm:text-[18px]">{formatNumber(item.valueMm, " mm")}</p>
                      <p className="text-[11px] text-[#8b92a3]">{deltaLabel(item.delta, " mm", true)}</p>
                    </div>
                  ))}
                  {assessments.skinfolds.latest.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Nenhuma dobra cutânea registrada.</p> : null}
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2 text-[#8fcfff]"><Ruler className="size-4" /><h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Circunferências (cm)</h3></div>
                <div className="grid grid-cols-2 gap-2">
                  {assessments.circumferences.latest.slice(0, 10).map((item) => (
                    <div className="rounded-[10px] border border-[#303746] bg-[#111821]/70 p-2.5 sm:p-3" key={item.key}>
                      <p className="truncate text-[12px] font-semibold text-[#d7dae0]">{item.label}</p>
                      <p className="mt-2 text-[17px] font-bold text-white sm:text-[18px]">{formatNumber(item.valueCm, " cm")}</p>
                      <p className="text-[11px] text-[#8b92a3]">{deltaLabel(item.delta, " cm", true)}</p>
                    </div>
                  ))}
                  {assessments.circumferences.latest.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Nenhuma circunferência registrada.</p> : null}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden p-0">
            <div className="border-b border-[#303746] px-5 py-4">
              <SectionTitle>Histórico de Avaliações</SectionTitle>
            </div>
            <div className="max-h-[520px] overflow-y-auto px-5 py-4">
              <div className="relative grid gap-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[#303746]">
                {assessments.history.map((item, index) => (
                  <article className="relative grid gap-1 pl-8" key={item.id}>
                    <span className={cn("absolute left-0 top-1 size-3.5 rounded-full border-2", index === 0 ? "border-[#3b97e3] bg-[#3b97e3]" : "border-[#708597] bg-[#0b1720]")} />
                    <div className="rounded-[10px] border border-[#303746] bg-[#111821]/70 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[13px] font-bold text-white">{item.dateLabel}</h3>
                        <button className="text-[11px] font-semibold text-[#8fcfff]" type="button" onClick={() => setAssessmentOpen(true)}>Ver detalhes</button>
                      </div>
                      <p className="mt-1 text-[11px] text-[#8b92a3]">Peso {formatNumber(item.weightKg, " kg")} • Gordura {formatNumber(item.bodyFatPercentage, "%")}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#5a6477]">{item.notes ?? item.title}</p>
                    </div>
                  </article>
                ))}
                {assessments.history.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Nenhuma avaliação cadastrada.</p> : null}
              </div>
            </div>
          </Panel>
        </section>

        <section className="mt-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-2 text-[20px] font-bold leading-[30px] text-white"><Activity className="size-4 text-[#3b97e3]" /> Análise Gráfica da Avaliação</h2>
              <p className="mt-1 text-[13px] text-[#8b92a3]">Acompanhe a evolução das principais métricas corporais ao longo do tempo.</p>
            </div>
            <span className="rounded-[10px] border border-[#303746] px-3 py-2 text-[12px] text-[#8b92a3]">{assessments.history.at(-1)?.dateLabel ?? "Sem histórico"} - {assessments.history[0]?.dateLabel ?? "Sem histórico"}</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel className="p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Painel Dinâmico de Composição Corporal</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Peso, gordura e massa magra com eixo ajustado aos dados.</p>
                </div>
                <ModeToggle modes={[{ label: "Dinâmico", value: "dynamic" }, { label: "Stack", value: "stack" }]} value={compositionMode} onChange={(value) => setCompositionMode(value as "dynamic" | "stack")} />
              </div>
              <CompositionChart data={assessments.charts.compositionSeries} mode={compositionMode} />
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Distribuição de Dobras Cutâneas</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Evolução detalhada por ponto de medição.</p>
                </div>
                <ModeToggle modes={[{ label: "Geral", value: "general" }, { label: "Por região", value: "region" }, { label: "Radar", value: "radar" }]} value={skinfoldMode} onChange={(value) => setSkinfoldMode(value as "general" | "region" | "radar")} />
              </div>
              <SkinfoldChart data={assessments.charts.skinfoldSeries} metrics={assessments.skinfolds.availableMetrics} mode={skinfoldMode} />
            </Panel>

            <Panel className="p-5 xl:col-span-2">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Painel de Circunferências</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Medidas corporais com visualização geral, por região ou radar.</p>
                </div>
                <ModeToggle modes={[{ label: "Geral", value: "general" }, { label: "Por região", value: "region" }, { label: "Radar", value: "radar" }]} value={circumferenceMode} onChange={(value) => setCircumferenceMode(value as "general" | "region" | "radar")} />
              </div>
              <CircumferenceChart data={assessments.charts.circumferenceSeries} metrics={assessments.circumferences.availableMetrics} mode={circumferenceMode} />
            </Panel>
          </div>
        </section>

      </div>

      <AssessmentDialog data={assessments} open={assessmentOpen} onOpenChange={setAssessmentOpen} />
    </div>
  );
}
