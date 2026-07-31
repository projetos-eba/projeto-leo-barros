"use client";

import {
  Activity,
  Calculator,
  Check,
  ClipboardPlus,
  Download,
  Dumbbell,
  Eye,
  Flame,
  Layers3,
  Loader2,
  Percent,
  Pencil,
  Ruler,
  Save,
  SlidersHorizontal,
  Target,
  Weight,
} from "lucide-react";
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
  AssessmentBiologicalSex,
  AssessmentFormula,
  AssessmentMethod,
  CalorieCalculation,
  PartnerClientAssessmentsData,
} from "@/lib/partners/client-assessments-metrics";
import {
  assessmentMethodLabels,
  assessmentMethodUsesSkinfoldFormula,
  assessmentProtocolSkinfolds,
  activityLevels,
  buildChartDomain,
  buildCalorieProjection,
  buildDynamicNumberDomain,
  calculateCalories,
  calculatePhysicalAssessment,
  circumferenceLabels,
  formulaLabels,
  skinfoldLabels,
} from "@/lib/partners/client-assessments-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  applyClientCalorieCalculation,
  completePartnerClientProfile,
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
  "biceps",
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
  { key: "ffmi", label: "FFMI", suffix: "" },
  { key: "muscleMassKg", label: "Massa muscular", suffix: " kg" },
];

const formulaNotes: Record<AssessmentFormula, string> = {
  cunningham: "Baseada em massa magra estimada ou informada.",
  harris_benedict: "Equação revisada para estimar metabolismo basal.",
  mifflin: "Referência prática para adultos ativos.",
  tinsley: "Alternativa por peso corporal para rotina esportiva.",
};

function Panel({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[14px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] shadow-[0_2px_4px_rgba(0,0,0,0.07)]",
        className,
      )}
      id={id}
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

function classifyBodyFat(value: number | null, biologicalSex: AssessmentBiologicalSex) {
  if (value === null) return { label: "Sem dados", tone: "text-[#8b92a3]" };
  if (biologicalSex === "female") {
    if (value < 14) return { label: "Essencial", tone: "text-[#8fcfff]" };
    if (value < 21) return { label: "Atlético", tone: "text-[#58a067]" };
    if (value < 25) return { label: "Fitness", tone: "text-[#9bd36f]" };
    if (value < 32) return { label: "Aceitável", tone: "text-[#f0c76a]" };
    if (value < 39) return { label: "Elevado", tone: "text-[#f48c58]" };
    return { label: "Muito elevado", tone: "text-[#ff7b8e]" };
  }
  if (value < 6) return { label: "Essencial", tone: "text-[#8fcfff]" };
  if (value < 14) return { label: "Atlético", tone: "text-[#58a067]" };
  if (value < 18) return { label: "Fitness", tone: "text-[#9bd36f]" };
  if (value < 25) return { label: "Aceitável", tone: "text-[#f0c76a]" };
  if (value < 30) return { label: "Elevado", tone: "text-[#f48c58]" };
  return { label: "Muito elevado", tone: "text-[#ff7b8e]" };
}

function classifyFfmi(value: number | null, biologicalSex: AssessmentBiologicalSex) {
  if (value === null) return { label: "Sem dados", tone: "text-[#8b92a3]" };
  if (biologicalSex === "female") {
    if (value < 15) return { label: "Baixo", tone: "text-[#8fcfff]" };
    if (value < 17) return { label: "Média", tone: "text-[#58a067]" };
    if (value < 19) return { label: "Bom", tone: "text-[#9bd36f]" };
    if (value < 21) return { label: "Muito alto", tone: "text-[#f0c76a]" };
    return { label: "Elevado", tone: "text-[#ff7b8e]" };
  }
  if (value < 18) return { label: "Baixo", tone: "text-[#8fcfff]" };
  if (value < 20) return { label: "Média", tone: "text-[#58a067]" };
  if (value < 22) return { label: "Bom", tone: "text-[#9bd36f]" };
  if (value < 25) return { label: "Muito alto", tone: "text-[#f0c76a]" };
  return { label: "Elevado", tone: "text-[#ff7b8e]" };
}

function spectrumPosition(value: number | null, min: number, max: number) {
  if (value === null) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function ResultSpectrum({
  label,
  max,
  min,
  suffix = "",
  tone,
  value,
}: {
  label: string;
  max: number;
  min: number;
  suffix?: string;
  tone: string;
  value: number | null;
}) {
  const position = spectrumPosition(value, min, max);

  return (
    <div className="rounded-[12px] border border-[#303746] bg-[#081522]/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">{label}</p>
        <p className={cn("text-[12px] font-bold", tone)}>{value === null ? "Sem dados" : formatNumber(value, suffix)}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#111821]">
        <div className="flex h-full">
          <span className="h-full flex-1 bg-[#2f82bf]" />
          <span className="h-full flex-1 bg-[#58a067]" />
          <span className="h-full flex-1 bg-[#f0c76a]" />
          <span className="h-full flex-1 bg-[#f48c58]" />
          <span className="h-full flex-1 bg-[#ff7b8e]" />
        </div>
      </div>
      <div className="relative h-4">
        {value !== null ? <span className="absolute top-[-5px] h-4 w-1 rounded-full bg-white shadow-[0_0_0_2px_rgba(11,23,32,0.8)]" style={{ left: `${position}%` }} /> : null}
      </div>
    </div>
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

function ClientDataInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-[64px] min-w-0 flex-col justify-center rounded-[10px] border border-[#303746] bg-[#081522] px-3 py-2">
      <p className="min-w-0 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#8b92a3]">{label}</p>
      <p className="mt-1 min-w-0 truncate text-[14px] font-semibold leading-5 text-white">{value}</p>
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

  const estimated = payload.find((item) => item.dataKey === "weightKg")?.value;
  const target = payload.find((item) => item.dataKey === "targetWeightKg")?.value;

  return (
    <div className="w-[154px] rounded-[8px] border border-[#2f82bf] bg-[#071827] px-3 py-2 text-[#f4f8fb] shadow-[0_10px_24px_rgba(0,0,0,0.25)] sm:w-[180px]">
      <p className="text-[14px] font-semibold leading-5 sm:text-[15px]">Dia {label}</p>
      <div className="mt-2 grid gap-1 text-[12px] leading-4 sm:text-[13px]">
        <p className="truncate text-[#3b97e3]">Estimado: {typeof estimated === "number" ? estimated.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : estimated} kg</p>
        <p className="truncate text-[#9aa5b6]">Meta: {typeof target === "number" ? target.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : target} kg</p>
      </div>
    </div>
  );
}

function CalorieProjectionChart({
  data,
  targetWeightKg,
}: {
  data: PartnerClientAssessmentsData["calorie"]["projection"];
  targetWeightKg: number | null;
}) {
  const { ref, width } = useMeasuredWidth();
  const chartData = data.map((item) => ({ ...item, targetWeightKg }));
  const domain = buildDynamicNumberDomain(
    chartData.flatMap((item) => [item.weightKg, item.targetWeightKg]),
    0.16,
  );
  const compact = width > 0 && width < 430;
  const chartHeight = compact ? 218 : 230;
  const xTicks = compact ? data.filter((item) => item.day % 30 === 0).map((item) => item.day) : undefined;
  const tooltipPosition = compact ? { x: Math.max(72, width - 184), y: 58 } : undefined;

  return (
    <div className="h-[218px] min-w-0 overflow-hidden sm:h-[230px]" data-testid="client-assessments-calorie-chart" ref={ref}>
      {width > 0 && chartData.length > 0 ? (
        <LineChart data={chartData} height={chartHeight} margin={{ bottom: 2, left: compact ? -16 : -10, right: compact ? 10 : 6, top: 10 }} width={width}>
          <CartesianGrid stroke="#31536b" strokeDasharray="4 6" strokeOpacity={0.75} vertical={false} />
          <XAxis axisLine={false} dataKey="day" tick={{ fill: "#9aa5b6", fontSize: compact ? 10 : 11 }} tickFormatter={(value) => `${value}d`} tickLine={false} ticks={xTicks} />
          <YAxis axisLine={false} domain={domain} tick={{ fill: "#9aa5b6", fontSize: compact ? 10 : 11 }} tickFormatter={(value) => `${value}kg`} tickLine={false} width={compact ? 46 : 52} />
          <Tooltip
            allowEscapeViewBox={{ x: false, y: false }}
            content={<CompactCalorieTooltip />}
            cursor={{ stroke: "#d7dae0", strokeWidth: 1 }}
            position={tooltipPosition}
            wrapperStyle={{ maxWidth: compact ? 160 : 190, zIndex: 20 }}
          />
          <Line dataKey="targetWeightKg" dot={false} name="Meta" stroke="#7b8794" strokeDasharray="6 6" strokeWidth={2.2} type="monotone" />
          <Line dataKey="weightKg" dot={{ fill: "#3b97e3", r: 3 }} name="Estimado" stroke="#3b97e3" strokeWidth={2.8} type="monotone" />
        </LineChart>
      ) : (
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Sem dados para projetar a meta.</div>
      )}
    </div>
  );
}

function CircumferenceChart({
  data,
  metrics,
  mode = "general",
  selectedMetrics,
}: {
  data: PartnerClientAssessmentsData["charts"]["circumferenceSeries"];
  metrics: PartnerClientAssessmentsData["circumferences"]["availableMetrics"];
  mode?: "general" | "region" | "radar";
  selectedMetrics: string[];
}) {
  const { ref, width } = useMeasuredWidth();
  const colors = ["#3b97e3", "#58a067", "#f0c76a", "#ff7b8e", "#9b7cff"];
  const visibleMetrics = metrics.filter((metric) => selectedMetrics.includes(metric.key));
  const domain = buildChartDomain(data, visibleMetrics.map((metric) => metric.key), 0.14);
  const latest = data.at(-1);
  const radarData = visibleMetrics.map((metric) => ({
    metric: metric.label,
    value: typeof latest?.[metric.key] === "number" ? latest[metric.key] as number : 0,
  }));

  return (
    <div className="h-[260px] min-w-0 overflow-visible" data-testid="client-assessments-circumference-chart" ref={ref}>
      {width > 0 && data.length > 0 && visibleMetrics.length > 0 ? (
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
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Selecione ao menos uma métrica.</div>
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

function MetricSelector({
  groups,
  onToggle,
  onToggleAll,
  selected,
}: {
  groups: Array<{ label: string; metrics: Array<{ key: string; label: string }> }>;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
  selected: string[];
}) {
  const allMetrics = groups.flatMap((group) => group.metrics);
  const allSelected = allMetrics.length > 0 && allMetrics.every((metric) => selected.includes(metric.key));

  return (
    <aside className="grid content-start gap-4 border-b border-[#303746] bg-[#081522]/55 p-3 sm:p-4 lg:border-b-0 lg:border-r">
      <button className="inline-flex h-9 items-center justify-center gap-2 rounded-[9px] bg-[#3b97e3] px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white" type="button" onClick={onToggleAll}>
        <Check className="size-3.5" />
        {allSelected ? "Desmarcar todos" : "Marcar todos"}
      </button>
      {groups.map((group) => (
        <div className="grid gap-2" key={group.label}>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b92a3]">{group.label}</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {group.metrics.map((metric) => {
              const active = selected.includes(metric.key);
              return (
                <button
                  className={cn(
                    "inline-flex h-9 min-w-0 items-center gap-2 rounded-[9px] border px-2 text-left text-[11px] font-semibold transition",
                    active ? "border-[#3b97e3] bg-[#102f4a] text-[#8fcfff]" : "border-[#303746] bg-[#111821] text-[#8b92a3]",
                  )}
                  key={metric.key}
                  type="button"
                  onClick={() => onToggle(metric.key)}
                >
                  <span className={cn("flex size-3.5 shrink-0 items-center justify-center rounded-[4px]", active ? "bg-[#3b97e3] text-white" : "bg-[#25313f]")}>{active ? <Check className="size-2.5" /> : null}</span>
                  <span className="truncate">{metric.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

function CompositionChart({
  data,
  mode,
  selectedMetrics,
}: {
  data: PartnerClientAssessmentsData["charts"]["compositionSeries"];
  mode: "dynamic" | "stack";
  selectedMetrics: string[];
}) {
  const { ref, width } = useMeasuredWidth();
  const colors = ["#3b97e3", "#a277ff", "#ff7b8e", "#58a067", "#f0c76a"];
  const visible = compositionMetrics.filter((metric) => selectedMetrics.includes(metric.key));
  const domain = buildChartDomain(data, visible.map((metric) => metric.key), 0.14);

  return (
    <div className="h-[260px] min-w-0 overflow-visible" data-testid="client-assessments-composition-chart" ref={ref}>
      {width > 0 && data.length > 0 && visible.length > 0 ? (
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
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Selecione ao menos uma métrica.</div>
      )}
    </div>
  );
}

function SkinfoldChart({
  data,
  metrics,
  mode,
  selectedMetrics,
}: {
  data: PartnerClientAssessmentsData["charts"]["skinfoldSeries"];
  metrics: PartnerClientAssessmentsData["skinfolds"]["availableMetrics"];
  mode: "general" | "region" | "radar";
  selectedMetrics: string[];
}) {
  const { ref, width } = useMeasuredWidth();
  const colors = ["#3b97e3", "#ff7b8e", "#a277ff", "#58a067", "#f0c76a", "#62d0ff", "#d678ff", "#f48c58"];
  const visibleMetrics = metrics.filter((metric) => selectedMetrics.includes(metric.key));
  const domain = buildChartDomain(data, visibleMetrics.map((metric) => metric.key), 0.16);
  const latest = data.at(-1);
  const radarData = visibleMetrics.map((metric) => ({
    metric: metric.label,
    value: typeof latest?.[metric.key] === "number" ? latest[metric.key] as number : 0,
  }));

  return (
    <div className="h-[260px] min-w-0 overflow-visible" data-testid="client-assessments-skinfold-chart" ref={ref}>
      {width > 0 && data.length > 0 && visibleMetrics.length > 0 ? (
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
        <div className="flex h-full items-center justify-center text-[13px] text-[#708597]">Selecione ao menos uma métrica.</div>
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
  assessment,
  data,
  mode,
  onOpenChange,
  open,
}: {
  assessment: PartnerClientAssessmentsData["records"][number] | null;
  data: PartnerClientAssessmentsData;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const router = useRouter();
  const base = mode === "edit" && assessment ? assessment : data.latestAssessment;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    activityLevel: base?.activityLevel ?? "moderate",
    assessmentMethod: base?.assessmentMethod ?? "jackson_pollock_7",
    assessedAt: mode === "edit" && base ? base.assessedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    bodyFatPercentage: base?.bodyFatPercentage?.toString() ?? "",
    heightCm: base?.heightCm?.toString() ?? "175",
    muscleMassKg: base?.muscleMassKg?.toString() ?? "",
    notes: mode === "edit" ? base?.notes ?? "" : "",
    targetDays: base?.targetDays?.toString() ?? "90",
    targetWeightKg: base?.targetWeightKg?.toString() ?? "",
    title: mode === "edit" ? base?.title ?? "Avaliação corporal" : "Avaliação corporal",
    weightKg: base?.weightKg?.toString() ?? "",
  });
  const [circumferences, setCircumferences] = useState<Record<string, string>>(() =>
    Object.fromEntries(circumferenceKeys.map((key) => [
      key,
      base?.circumferences.find((item) => item.metricKey === key)?.valueCm.toString() ?? "",
    ])),
  );
  const [skinfolds, setSkinfolds] = useState<Record<string, string>>(() =>
    Object.fromEntries(skinfoldKeys.map((key) => [
      key,
      base?.skinfolds.find((item) => item.metricKey === key)?.valueMm.toString() ?? "",
    ])),
  );

  useEffect(() => {
    if (!open) return;
    const nextBase = mode === "edit" && assessment ? assessment : data.latestAssessment;
    setError(null);
    setForm({
      activityLevel: nextBase?.activityLevel ?? "moderate",
      assessmentMethod: nextBase?.assessmentMethod ?? "jackson_pollock_7",
      assessedAt: mode === "edit" && nextBase ? nextBase.assessedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      bodyFatPercentage: nextBase?.bodyFatPercentage?.toString() ?? "",
      heightCm: nextBase?.heightCm?.toString() ?? "175",
      muscleMassKg: nextBase?.muscleMassKg?.toString() ?? "",
      notes: mode === "edit" ? nextBase?.notes ?? "" : "",
      targetDays: nextBase?.targetDays?.toString() ?? "90",
      targetWeightKg: nextBase?.targetWeightKg?.toString() ?? "",
      title: mode === "edit" ? nextBase?.title ?? "Avaliação corporal" : "Avaliação corporal",
      weightKg: nextBase?.weightKg?.toString() ?? "",
    });
    setCircumferences(Object.fromEntries(circumferenceKeys.map((key) => [
      key,
      nextBase?.circumferences.find((item) => item.metricKey === key)?.valueCm.toString() ?? "",
    ])));
    setSkinfolds(Object.fromEntries(skinfoldKeys.map((key) => [
      key,
      nextBase?.skinfolds.find((item) => item.metricKey === key)?.valueMm.toString() ?? "",
    ])));
  }, [assessment, data.latestAssessment, mode, open]);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const selectedMethod = form.assessmentMethod as AssessmentMethod;
  const activeSkinfolds = assessmentProtocolSkinfolds[selectedMethod];
  const usesSkinfoldFormula = assessmentMethodUsesSkinfoldFormula(selectedMethod);
  const physicalPreview = useMemo(() => calculatePhysicalAssessment({
    age: data.client.age,
    assessmentMethod: selectedMethod,
    biologicalSex: data.client.biologicalSex as AssessmentBiologicalSex,
    bodyFatPercentage: form.bodyFatPercentage ? Number(form.bodyFatPercentage) : null,
    heightCm: Number(form.heightCm),
    skinfolds: Object.entries(skinfolds)
      .filter(([, value]) => value.trim() !== "")
      .map(([metricKey, value]) => ({ metricKey, valueMm: Number(value) })),
    weightKg: Number(form.weightKg),
  }), [data.client.age, data.client.biologicalSex, form.bodyFatPercentage, form.heightCm, form.weightKg, selectedMethod, skinfolds]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await saveClientAssessment({
        activityLevel: form.activityLevel as AssessmentActivityLevel,
        assessmentMethod: form.assessmentMethod as AssessmentMethod,
        assessedAt: new Date(`${form.assessedAt}T12:00:00`).toISOString(),
        assessmentId: mode === "edit" && assessment ? assessment.id : undefined,
        bodyFatPercentage: usesSkinfoldFormula ? physicalPreview.bodyFatPercentage : form.bodyFatPercentage ? Number(form.bodyFatPercentage) : null,
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
          <DialogTitle className="text-[20px] font-bold sm:text-[24px]">{mode === "edit" ? "Editar avaliação" : "Nova avaliação"}</DialogTitle>
          <DialogDescription className="text-[#8b92a3]">
            {mode === "edit" ? "Revise dados corporais, metodologia, dobras cutâneas, circunferências e parâmetros da avaliação." : "Registre dados corporais, metodologia, dobras cutâneas, circunferências e parâmetros para cálculo calórico."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Label text="Título"><Input required value={form.title} onChange={(value) => setField("title", value)} /></Label>
            <Label text="Data"><Input required type="date" value={form.assessedAt} onChange={(value) => setField("assessedAt", value)} /></Label>
            <Label text="Altura (cm)"><Input required inputMode="decimal" value={form.heightCm} onChange={(value) => setField("heightCm", value)} /></Label>
            <Label text="Peso (kg)"><Input required inputMode="decimal" value={form.weightKg} onChange={(value) => setField("weightKg", value)} /></Label>
            <Label text={usesSkinfoldFormula ? "% gordura calculada" : "% gordura"}>
              <Input inputMode="decimal" readOnly={usesSkinfoldFormula} value={usesSkinfoldFormula ? physicalPreview.bodyFatPercentage?.toString() ?? "" : form.bodyFatPercentage} onChange={(value) => setField("bodyFatPercentage", value)} />
            </Label>
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
            {usesSkinfoldFormula ? <p className="mt-1 text-[12px] text-[#8b92a3]">Preencha as dobras exigidas pelo protocolo selecionado.</p> : null}
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {skinfoldKeys.map((key) => {
                const active = !usesSkinfoldFormula || activeSkinfolds.includes(key);
                return (
                <Label className={cn(!active && "opacity-35")} key={key} text={String(skinfoldLabels[key] ?? key) + " (mm)"}>
                  <Input disabled={!active} inputMode="decimal" value={skinfolds[key]} onChange={(value) => setSkinfolds((current) => ({ ...current, [key]: value }))} />
                </Label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 rounded-[12px] border border-[#303746] bg-[#111821]/70 p-3 sm:grid-cols-4">
            <MiniInfo label="Gordura" value={formatNumber(physicalPreview.bodyFatPercentage, "%")} />
            <MiniInfo label="Massa gorda" value={formatNumber(physicalPreview.fatMassKg, " kg")} />
            <MiniInfo label="Massa magra" value={formatNumber(physicalPreview.leanMassKg, " kg")} />
            <MiniInfo label="FFMI" value={formatNumber(physicalPreview.ffmi)} />
            {physicalPreview.reason ? <p className="text-[12px] text-amber-200 sm:col-span-4">{physicalPreview.reason}</p> : null}
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
              {mode === "edit" ? "Atualizar avaliação" : "Salvar avaliação"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className, text }: { children: ReactNode; className?: string; text: string }) {
  return <label className={cn("grid gap-1.5 text-[12px] font-semibold leading-4 text-[#d7dae0] sm:gap-2 sm:text-[13px]", className)}>{text}{children}</label>;
}

function Input({
  inputMode,
  disabled,
  onChange,
  readOnly,
  required,
  type = "text",
  value,
}: {
  inputMode?: "decimal" | "numeric";
  disabled?: boolean;
  onChange: (value: string) => void;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <input
      className="h-10 min-w-0 rounded-[10px] border border-[#303746] bg-[#161a22] px-2 text-[13px] outline-none focus:border-[#3b97e3] sm:px-3 sm:text-[14px]"
      disabled={disabled}
      inputMode={inputMode}
      readOnly={readOnly}
      required={required}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ProfileBioDialog({
  draft,
  onDraftChange,
  onOpenChange,
  onSubmit,
  open,
  pending,
}: {
  draft: { biologicalSex: AssessmentBiologicalSex; birthDate: string; objective: string };
  onDraftChange: (draft: { biologicalSex: AssessmentBiologicalSex; birthDate: string; objective: string }) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#303746] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[560px] sm:rounded-[14px]">
        <DialogHeader className="border-b border-[#303746] px-4 py-4 text-left sm:px-6 sm:py-5">
          <DialogTitle className="text-[20px] font-bold sm:text-[24px]">Editar bio</DialogTitle>
          <DialogDescription className="text-[#8b92a3]">Atualize os dados usados nas fórmulas de avaliação.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <Label text="Data de nascimento">
            <Input required type="date" value={draft.birthDate} onChange={(value) => onDraftChange({ ...draft, birthDate: value })} />
          </Label>
          <label className="grid gap-1.5 text-[12px] font-semibold leading-4 text-[#d7dae0] sm:gap-2 sm:text-[13px]">
            Sexo biológico
            <select className="h-10 w-full rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]" value={draft.biologicalSex} onChange={(event) => onDraftChange({ ...draft, biologicalSex: event.target.value as AssessmentBiologicalSex })}>
              <option value="not_informed">Sexo não informado</option>
              <option value="female">Feminino</option>
              <option value="male">Masculino</option>
            </select>
          </label>
          <Label text="Objetivo principal">
            <Input required value={draft.objective} onChange={(value) => onDraftChange({ ...draft, objective: value })} />
          </Label>
          <div className="flex justify-end gap-2 border-t border-[#303746] pt-4">
            <button className="h-10 rounded-[10px] border border-[#303746] px-5 text-[14px] font-semibold text-white" type="button" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#3b97e3] px-5 text-[14px] font-semibold text-white disabled:opacity-60" disabled={pending} type="button" onClick={onSubmit}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar bio
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssessmentDetailsDialog({
  assessment,
  biologicalSex,
  onEdit,
  onOpenChange,
  open,
}: {
  assessment: PartnerClientAssessmentsData["records"][number] | null;
  biologicalSex: AssessmentBiologicalSex;
  onEdit: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const bodyFatClassification = classifyBodyFat(assessment?.bodyFatPercentage ?? null, biologicalSex);
  const ffmiClassification = classifyFfmi(assessment?.ffmi ?? null, biologicalSex);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#303746] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[720px] sm:rounded-[14px]">
        <DialogHeader className="border-b border-[#303746] px-4 py-4 text-left sm:px-6 sm:py-5">
          <DialogTitle className="text-[20px] font-bold sm:text-[24px]">{assessment?.title ?? "Detalhes da avaliação"}</DialogTitle>
          <DialogDescription className="text-[#8b92a3]">
            {assessment ? `${new Date(assessment.assessedAt).toLocaleDateString("pt-BR")} · ${assessmentMethodLabels[assessment.assessmentMethod]}` : "Selecione uma avaliação para visualizar."}
          </DialogDescription>
        </DialogHeader>

        {assessment ? (
          <div className="grid gap-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <MiniInfo label="Peso" value={formatNumber(assessment.weightKg, " kg")} />
              <MiniInfo label="% gordura" value={`${formatNumber(assessment.bodyFatPercentage, "%")} · ${bodyFatClassification.label}`} />
              <MiniInfo label="Massa magra" value={formatNumber(assessment.leanMassKg, " kg")} />
              <MiniInfo label="FFMI" value={`${formatNumber(assessment.ffmi)} · ${ffmiClassification.label}`} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ResultSpectrum label={`IMC · ${assessment.bmiClassification}`} max={45} min={12} tone="text-[#8fcfff]" value={assessment.bmi} />
              <ResultSpectrum label={`% Gordura · ${bodyFatClassification.label}`} max={biologicalSex === "female" ? 50 : 40} min={biologicalSex === "female" ? 5 : 0} suffix="%" tone={bodyFatClassification.tone} value={assessment.bodyFatPercentage} />
              <ResultSpectrum label={`FFMI · ${ffmiClassification.label}`} max={biologicalSex === "female" ? 27 : 30} min={biologicalSex === "female" ? 12 : 15} tone={ffmiClassification.tone} value={assessment.ffmi} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Dobras cutâneas</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {assessment.skinfolds.map((item) => (
                    <MiniInfo key={item.metricKey} label={item.label} value={formatNumber(item.valueMm, " mm")} />
                  ))}
                  {assessment.skinfolds.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Nenhuma dobra cutânea registrada.</p> : null}
                </div>
              </div>
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Circunferências</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {assessment.circumferences.map((item) => (
                    <MiniInfo key={item.metricKey} label={item.label} value={formatNumber(item.valueCm, " cm")} />
                  ))}
                  {assessment.circumferences.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Nenhuma circunferência registrada.</p> : null}
                </div>
              </div>
            </div>

            {assessment.notes ? <p className="rounded-[10px] border border-[#303746] bg-[#111821]/70 p-3 text-[13px] leading-5 text-[#d7dae0]">{assessment.notes}</p> : null}

            <div className="flex justify-end border-t border-[#303746] pt-4">
              <button className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#3b97e3] px-5 text-[14px] font-semibold text-white" type="button" onClick={onEdit}>
                <Pencil className="size-4" />
                Editar avaliação
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function PartnerClientAssessmentsView({ assessments, overview }: PartnerClientAssessmentsViewProps) {
  const router = useRouter();
  const [assessmentFlow, setAssessmentFlow] = useState<{
    assessmentId: string | null;
    mode: "create" | "details" | "edit";
    open: boolean;
  }>({ assessmentId: null, mode: "create", open: false });
  const [selectedFormula, setSelectedFormula] = useState<AssessmentFormula>(assessments.calorie.selected?.formula ?? "mifflin");
  const [compositionMode, setCompositionMode] = useState<"dynamic" | "stack">("dynamic");
  const [skinfoldMode, setSkinfoldMode] = useState<"general" | "region" | "radar">("general");
  const [circumferenceMode, setCircumferenceMode] = useState<"general" | "region" | "radar">("general");
  const [selectedCompositionMetrics, setSelectedCompositionMetrics] = useState(() => compositionMetrics.map((metric) => metric.key));
  const [selectedSkinfoldMetrics, setSelectedSkinfoldMetrics] = useState(() => assessments.skinfolds.availableMetrics.map((metric) => metric.key));
  const [selectedCircumferenceMetrics, setSelectedCircumferenceMetrics] = useState(() => assessments.circumferences.availableMetrics.slice(0, 8).map((metric) => metric.key));
  const [pendingAction, setPendingAction] = useState<"save" | "apply" | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePending, setProfilePending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState({
    biologicalSex: assessments.client.biologicalSex,
    birthDate: assessments.client.birthDate ?? "",
    objective: assessments.client.objective ?? "",
  });
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
    return (Object.keys(formulaLabels) as AssessmentFormula[])
      .filter((formula) => assessments.formulaEligibility[formula].status === "available")
      .map((formula) => calculateCalories({
      activityLevel: calorieInputs.activityLevel,
      age,
      bodyFatPercentage: latestAssessment.bodyFatPercentage,
      formula,
      biologicalSex: assessments.client.biologicalSex,
      heightCm,
      targetDays: latestAssessment.targetDays,
      targetWeightKg: calorieInputs.targetWeightKg,
      weightKg,
    }));
  }, [assessments, calorieInputs]);
  const selectedCalculation = calorieComparison.find((item) => item.formula === selectedFormula) ?? null;
  useEffect(() => {
    if (assessments.formulaEligibility[selectedFormula].status === "available") return;
    const available = (Object.keys(formulaLabels) as AssessmentFormula[])
      .find((formula) => assessments.formulaEligibility[formula].status === "available");
    if (available) setSelectedFormula(available);
  }, [assessments.formulaEligibility, selectedFormula]);
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
      biologicalSex: assessments.client.biologicalSex,
      heightCm,
      targetDays: latestAssessment.targetDays,
      targetWeightKg: calorieInputs.targetWeightKg,
      weightKg,
    }, selectedCalculation);
  }, [assessments, calorieInputs, selectedCalculation, selectedFormula]);
  const latestAssessment = assessments.latestAssessment;
  const selectedAssessment = assessmentFlow.assessmentId
    ? assessments.records.find((item) => item.id === assessmentFlow.assessmentId) ?? null
    : null;
  const bodyFatClassification = classifyBodyFat(latestAssessment?.bodyFatPercentage ?? null, assessments.client.biologicalSex);
  const ffmiClassification = classifyFfmi(latestAssessment?.ffmi ?? null, assessments.client.biologicalSex);

  async function saveProfileDraft() {
    setProfilePending(true);
    setActionMessage(null);
    try {
      const result = await completePartnerClientProfile({ ...profileDraft, patientId: assessments.client.id });
      setActionMessage(result.message ?? result.error ?? null);
      if (result.ok) {
        setProfileOpen(false);
        router.refresh();
      }
    } finally {
      setProfilePending(false);
    }
  }

  function toggleMetric(current: string[], key: string) {
    return current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
  }

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
          biologicalSex: assessments.client.biologicalSex,
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
        <PartnerClientProfileHeader activeTab="avaliacoes" overview={overview} onEditProfile={() => setProfileOpen(true)} />

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
                {Object.entries(formulaLabels).map(([key, label]) => {
                  const eligibility = assessments.formulaEligibility[key as AssessmentFormula];
                  return <option disabled={eligibility.status !== "available"} key={key} value={key}>{label}{eligibility.status === "available" ? "" : " — indisponível"}</option>;
                })}
              </select>
            </label>
          </div>

          <div className="grid gap-4 p-3 sm:gap-5 sm:p-5">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Metodologias</h3>
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#303746] px-3 py-1 text-[11px] font-semibold text-[#8b92a3]"><SlidersHorizontal className="size-3.5 shrink-0" /> <span className="truncate">{assessmentMethodLabels[assessments.latestAssessment?.assessmentMethod ?? "jackson_pollock_7"]}</span></span>
              </div>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {(Object.keys(formulaLabels) as AssessmentFormula[]).map((formula) => {
                const calculation = calorieComparison.find((item) => item.formula === formula);
                if (calculation) return <FormulaCard active={selectedFormula === calculation.formula} calculation={calculation} key={formula} onSelect={() => setSelectedFormula(calculation.formula)} />;
                const eligibility = assessments.formulaEligibility[formula];
                return <div className="rounded-[12px] border border-[#303746] bg-[#111821] p-4" key={formula}><p className="font-semibold text-white">{formulaLabels[formula]}</p><p className="mt-2 text-[11px] font-semibold uppercase text-amber-300">{eligibility.status === "invalid_inputs" ? "Dados inválidos" : "Dados ausentes"}</p><p className="mt-1 text-[12px] leading-5 text-[#8b92a3]">{eligibility.reason}</p><button className="mt-3 text-xs font-semibold text-[#8fcfff]" type="button" onClick={() => setProfileOpen(true)}>Editar bio</button></div>;
              })}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.25fr_0.9fr]">
              <div className="rounded-[12px] border border-[#303746] bg-[#111821]/80 p-3 sm:p-4">
                <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-white">Dados do Cliente</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4">
                  <ClientDataInfo label="Sexo biológico" value={assessments.client.biologicalSex === "female" ? "Feminino" : assessments.client.biologicalSex === "male" ? "Masculino" : "Não informado"} />
                  <ClientDataInfo label="Idade" value={overview.client.ageLabel} />
                  <label className="flex min-h-[64px] min-w-0 flex-col justify-center rounded-[10px] border border-[#303746] bg-[#081522] px-3 py-2 text-[#8b92a3] focus-within:border-[#3b97e3]">
                    <span className="min-w-0 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.05em]">Altura (cm)</span>
                    <input aria-label="Altura (cm)" className="mt-1 h-5 w-full min-w-0 bg-transparent p-0 text-[14px] font-semibold leading-5 text-white outline-none" min="100" step="0.1" type="number" value={calorieInputs.heightCm ?? ""} onChange={(event) => setCalorieInputs((current) => ({ ...current, heightCm: event.target.value === "" ? null : Number(event.target.value) }))} />
                  </label>
                  <label className="flex min-h-[64px] min-w-0 flex-col justify-center rounded-[10px] border border-[#303746] bg-[#081522] px-3 py-2 text-[#8b92a3] focus-within:border-[#3b97e3]">
                    <span className="min-w-0 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.05em]">Peso atual (kg)</span>
                    <input aria-label="Peso atual (kg)" className="mt-1 h-5 w-full min-w-0 bg-transparent p-0 text-[14px] font-semibold leading-5 text-white outline-none" min="20" step="0.1" type="number" value={calorieInputs.weightKg ?? ""} onChange={(event) => setCalorieInputs((current) => ({ ...current, weightKg: event.target.value === "" ? null : Number(event.target.value) }))} />
                  </label>
                  <label className="flex min-h-[64px] min-w-0 flex-col justify-center rounded-[10px] border border-[#303746] bg-[#081522] px-3 py-2 text-[#8b92a3] focus-within:border-[#3b97e3]">
                    <span className="min-w-0 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.05em]">Peso meta (kg)</span>
                    <input aria-label="Peso meta (kg)" className="mt-1 h-5 w-full min-w-0 bg-transparent p-0 text-[14px] font-semibold leading-5 text-white outline-none" min="20" step="0.1" type="number" value={calorieInputs.targetWeightKg ?? ""} onChange={(event) => setCalorieInputs((current) => ({ ...current, targetWeightKg: event.target.value === "" ? null : Number(event.target.value) }))} />
                  </label>
                  <ClientDataInfo label="Prazo" value={`${assessments.latestAssessment?.targetDays ?? 90} dias`} />
                  <label className="col-span-2 flex min-h-[64px] min-w-0 flex-col justify-center rounded-[10px] border border-[#303746] bg-[#081522] px-3 py-2 text-[#8b92a3] focus-within:border-[#3b97e3]">
                    <span className="min-w-0 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.05em]">Fator de atividade</span>
                    <select aria-label="Fator de atividade" className="mt-1 h-6 w-full min-w-0 bg-transparent p-0 text-[14px] font-semibold normal-case leading-5 text-white outline-none" value={calorieInputs.activityLevel} onChange={(event) => setCalorieInputs((current) => ({ ...current, activityLevel: event.target.value as AssessmentActivityLevel }))}>
                      {Object.entries(activityLevels).sort((left, right) => left[1].factor - right[1].factor).map(([key, value]) => <option key={key} value={key}>{value.shortLabel} ({value.factor})</option>)}
                    </select>
                  </label>
                </div>
                <div className="mt-3 rounded-[10px] bg-[#081522] px-3 py-3 text-[11px] leading-4 text-[#8fcfff]">
                  Fator aplicado: {selectedCalculation?.activityFactor ?? "-"} · {selectedCalculation?.activityLabel ?? "Sem dados"}
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
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#9aa5b6]">Projeção de meta ao longo do tempo</h3>
                  <div className="flex gap-4 text-[12px] text-[#9aa5b6]">
                    <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#3b97e3]" /> Estimado</span>
                    <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[#7b8794]" /> Meta</span>
                  </div>
                </div>
                  <CalorieProjectionChart data={calorieProjection} targetWeightKg={selectedCalculation?.targetWeightKg ?? null} />
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
                <p className="mt-1 text-[12px] leading-5 text-[#8b92a3] sm:text-[13px]">Resultado calculado, protocolo, dobras cutâneas e circunferências da última avaliação.</p>
              </div>
              <button className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-[#3b97e3] px-3 text-[13px] font-semibold text-white sm:h-10 sm:rounded-[10px] sm:px-4 sm:text-[14px]" type="button" onClick={() => setAssessmentFlow({ assessmentId: null, mode: "create", open: true })}>
                <ClipboardPlus className="size-4" /> Registrar dados
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              <MiniInfo label="Protocolo" value={latestAssessment ? assessmentMethodLabels[latestAssessment.assessmentMethod] : "Sem avaliação"} />
              <MiniInfo label="Gordura corporal" value={latestAssessment ? `${formatNumber(latestAssessment.bodyFatPercentage, "%")} · ${bodyFatClassification.label}` : "Sem dados"} />
              <MiniInfo label="Massa magra" value={formatNumber(latestAssessment?.leanMassKg ?? null, " kg")} />
              <MiniInfo label="Massa gorda" value={formatNumber(latestAssessment?.fatMassKg ?? null, " kg")} />
              <MiniInfo label="Soma de dobras" value={formatNumber(latestAssessment?.sumSkinfoldsMm ?? null, " mm")} />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <ResultSpectrum label={`IMC · ${latestAssessment?.bmiClassification ?? "Sem dados"}`} max={45} min={12} suffix="" tone="text-[#8fcfff]" value={latestAssessment?.bmi ?? null} />
              <ResultSpectrum label={`% Gordura · ${bodyFatClassification.label}`} max={assessments.client.biologicalSex === "female" ? 50 : 40} min={assessments.client.biologicalSex === "female" ? 5 : 0} suffix="%" tone={bodyFatClassification.tone} value={latestAssessment?.bodyFatPercentage ?? null} />
              <ResultSpectrum label={`FFMI · ${ffmiClassification.label}`} max={assessments.client.biologicalSex === "female" ? 27 : 30} min={assessments.client.biologicalSex === "female" ? 12 : 15} tone={ffmiClassification.tone} value={latestAssessment?.ffmi ?? null} />
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
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303746] px-5 py-4">
              <div>
                <SectionTitle>Histórico de Avaliações</SectionTitle>
                <p className="mt-1 text-[12px] text-[#8b92a3]">Comparativo técnico das avaliações registradas.</p>
              </div>
              <span className="rounded-full border border-[#303746] px-3 py-1 text-[11px] font-semibold text-[#8b92a3]">{assessments.history.length} registros</span>
            </div>
            <div className="max-h-[520px] overflow-auto">
              {assessments.history.length > 0 ? (
                <table className="min-w-[760px] w-full text-left">
                  <thead className="sticky top-0 z-10 bg-[#0e1923]">
                    <tr className="border-b border-[#303746] text-[10px] font-bold uppercase tracking-[0.06em] text-[#8b92a3]">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Protocolo</th>
                      <th className="px-4 py-3">Peso</th>
                      <th className="px-4 py-3">IMC</th>
                      <th className="px-4 py-3">FFMI</th>
                      <th className="px-4 py-3">% Gordura</th>
                      <th className="px-4 py-3">M. magra</th>
                      <th className="px-4 py-3">M. gorda</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#25313f]">
                    {assessments.history.map((item) => (
                      <tr className="bg-[#0b1720]/30 text-[12px] text-[#d7dae0] transition hover:bg-[#111821]" key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{item.dateLabel}</p>
                          <p className="mt-1 line-clamp-1 text-[11px] text-[#5a6477]">{item.title}</p>
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate text-[#8fcfff]">{assessmentMethodLabels[item.assessmentMethod]}</td>
                        <td className="px-4 py-3 font-semibold">{formatNumber(item.weightKg, " kg")}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{formatNumber(item.bmi)}</p>
                          <p className="text-[10px] text-[#8b92a3]">{item.bmiClassification}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatNumber(item.ffmi)}</td>
                        <td className="px-4 py-3 font-bold text-[#ff9aaa]">{formatNumber(item.bodyFatPercentage, "%")}</td>
                        <td className="px-4 py-3 font-semibold text-[#8bd89d]">{formatNumber(item.leanMassKg, " kg")}</td>
                        <td className="px-4 py-3 font-semibold text-[#f0c76a]">{formatNumber(item.fatMassKg, " kg")}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              aria-label={`Visualizar avaliação ${item.dateLabel}`}
                              className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#303746] text-[#8fcfff] transition hover:border-[#3b97e3]"
                              type="button"
                              onClick={() => setAssessmentFlow({ assessmentId: item.id, mode: "details", open: true })}
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              aria-label={`Editar avaliação ${item.dateLabel}`}
                              className="inline-flex size-8 items-center justify-center rounded-[8px] border border-[#303746] text-[#f0c76a] transition hover:border-[#f0c76a]"
                              type="button"
                              onClick={() => setAssessmentFlow({ assessmentId: item.id, mode: "edit", open: true })}
                            >
                              <Pencil className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-5 py-4 text-[13px] text-[#8b92a3]">Nenhuma avaliação cadastrada.</p>
              )}
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
            <Panel className="overflow-hidden p-0">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303746] p-5">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Painel Dinâmico de Composição Corporal</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Análise integrada de peso, gordura e massa magra.</p>
                </div>
                <ModeToggle modes={[{ label: "Dinâmico", value: "dynamic" }, { label: "Stack", value: "stack" }]} value={compositionMode} onChange={(value) => setCompositionMode(value as "dynamic" | "stack")} />
              </div>
              <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
                <MetricSelector
                  groups={[{ label: "Variáveis", metrics: compositionMetrics.map((metric) => ({ key: metric.key, label: metric.label })) }]}
                  selected={selectedCompositionMetrics}
                  onToggle={(key) => setSelectedCompositionMetrics((current) => toggleMetric(current, key))}
                  onToggleAll={() => setSelectedCompositionMetrics((current) => current.length === compositionMetrics.length ? [] : compositionMetrics.map((metric) => metric.key))}
                />
                <div className="p-4">
                  <CompositionChart data={assessments.charts.compositionSeries} mode={compositionMode} selectedMetrics={selectedCompositionMetrics} />
                </div>
              </div>
            </Panel>

            <Panel className="overflow-hidden p-0">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303746] p-5">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Distribuição de Dobras Cutâneas</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Evolução detalhada por ponto de medição.</p>
                </div>
                <ModeToggle modes={[{ label: "Geral", value: "general" }, { label: "Por região", value: "region" }, { label: "Radar", value: "radar" }]} value={skinfoldMode} onChange={(value) => setSkinfoldMode(value as "general" | "region" | "radar")} />
              </div>
              <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
                <MetricSelector
                  groups={["Tronco", "Membros superiores", "Membros inferiores", "Outros"].map((region) => ({
                    label: region,
                    metrics: assessments.skinfolds.availableMetrics.filter((metric) => metric.region === region).map((metric) => ({ key: metric.key, label: metric.label })),
                  })).filter((group) => group.metrics.length > 0)}
                  selected={selectedSkinfoldMetrics}
                  onToggle={(key) => setSelectedSkinfoldMetrics((current) => toggleMetric(current, key))}
                  onToggleAll={() => setSelectedSkinfoldMetrics((current) => current.length === assessments.skinfolds.availableMetrics.length ? [] : assessments.skinfolds.availableMetrics.map((metric) => metric.key))}
                />
                <div className="p-4">
                  <SkinfoldChart data={assessments.charts.skinfoldSeries} metrics={assessments.skinfolds.availableMetrics} mode={skinfoldMode} selectedMetrics={selectedSkinfoldMetrics} />
                </div>
              </div>
            </Panel>

            <Panel className="overflow-hidden p-0 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303746] p-5">
                <div>
                  <h3 className="text-[15px] font-bold text-white">Painel de Circunferências</h3>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Medidas corporais com visualização geral, por região ou radar.</p>
                </div>
                <ModeToggle modes={[{ label: "Geral", value: "general" }, { label: "Por região", value: "region" }, { label: "Radar", value: "radar" }]} value={circumferenceMode} onChange={(value) => setCircumferenceMode(value as "general" | "region" | "radar")} />
              </div>
              <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
                <MetricSelector
                  groups={[{ label: "Medidas", metrics: assessments.circumferences.availableMetrics.map((metric) => ({ key: metric.key, label: metric.label })) }]}
                  selected={selectedCircumferenceMetrics}
                  onToggle={(key) => setSelectedCircumferenceMetrics((current) => toggleMetric(current, key))}
                  onToggleAll={() => setSelectedCircumferenceMetrics((current) => current.length === assessments.circumferences.availableMetrics.length ? [] : assessments.circumferences.availableMetrics.map((metric) => metric.key))}
                />
                <div className="p-4">
                  <CircumferenceChart data={assessments.charts.circumferenceSeries} metrics={assessments.circumferences.availableMetrics} mode={circumferenceMode} selectedMetrics={selectedCircumferenceMetrics} />
                </div>
              </div>
            </Panel>
          </div>
        </section>

      </div>

      <ProfileBioDialog
        draft={profileDraft}
        open={profileOpen}
        pending={profilePending}
        onDraftChange={setProfileDraft}
        onOpenChange={setProfileOpen}
        onSubmit={() => void saveProfileDraft()}
      />
      <AssessmentDetailsDialog
        assessment={selectedAssessment}
        biologicalSex={assessments.client.biologicalSex}
        open={assessmentFlow.open && assessmentFlow.mode === "details"}
        onEdit={() => setAssessmentFlow((current) => ({ ...current, mode: "edit", open: true }))}
        onOpenChange={(open) => setAssessmentFlow((current) => ({ ...current, open }))}
      />
      <AssessmentDialog
        assessment={assessmentFlow.mode === "edit" ? selectedAssessment : null}
        data={assessments}
        mode={assessmentFlow.mode === "edit" ? "edit" : "create"}
        open={assessmentFlow.open && assessmentFlow.mode !== "details"}
        onOpenChange={(open) => setAssessmentFlow((current) => ({ ...current, open }))}
      />
    </div>
  );
}
