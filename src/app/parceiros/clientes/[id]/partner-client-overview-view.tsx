"use client";

import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Dumbbell,
  FileDown,
  HeartPulse,
  History,
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  Plus,
  Scale,
  Target,
  TrendingUp,
  Utensils,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  PartnerClientOverviewData,
  PartnerClientOverviewTask,
} from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import { createClientAppointment, createClientTask, setClientTaskCompleted } from "./actions";
import { ClientOverviewChart } from "./client-overview-chart";

type PartnerClientOverviewViewProps = {
  overview: PartnerClientOverviewData;
};

type ChartPeriod = "3m" | "6m" | "12m" | "all";

const chartPeriodLabels: Record<ChartPeriod, string> = {
  "12m": "12 meses",
  "3m": "3 meses",
  "6m": "6 meses",
  all: "Tudo",
};

const futureTabs = ["Anamnese", "Prescrições", "Formulários"];

const moduleIcons: Record<string, typeof Dumbbell> = {
  cardio: HeartPulse,
  dieta: Utensils,
  saude: Target,
  treino: Dumbbell,
};

const moduleLabels: Record<string, string> = {
  cardio: "Cardio",
  dieta: "Dieta",
  saude: "Saúde",
  treino: "Treino",
};

const priorityClasses: Record<PartnerClientOverviewTask["priority"], string> = {
  high: "border-[#6e3535] bg-[#31151b] text-[#ff7b8e]",
  low: "border-[#303746] bg-[#161a22] text-[#8b92a3]",
  medium: "border-[#5a4420] bg-[#2b2417] text-[#f0c76a]",
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

function formatNumber(value: number | null, suffix: string) {
  if (value === null) return "Sem dados";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}

function splitMetricValue(value: number | null, suffix: string) {
  if (value === null) return { number: "Sem dados", suffix: "" };
  return {
    number: value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
    suffix,
  };
}

function formatDelta(value: number | null, suffix: string, inverse = false) {
  if (value === null || value === 0) return "Estável";
  const positive = value > 0;
  const good = inverse ? !positive : positive;
  const sign = positive ? "+" : "";
  return `${good ? "▲" : "▼"} ${sign}${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${suffix}`;
}

function formatDeltaBadge(value: number | null, suffix: string) {
  if (value === null || value === 0) return "0";
  const absolute = Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `${absolute}${suffix}`;
}

function deltaIsGood(value: number | null, inverse = false) {
  if (value === null || value === 0) return null;
  return inverse ? value < 0 : value > 0;
}

function activeScopeLabel(scopes: string[]) {
  if (scopes.length === 0) return "Sem módulo ativo";
  return scopes.map((scope) => moduleLabels[scope] ?? scope).join(" + ");
}

function HeaderModule({ scope }: { scope: string }) {
  const Icon = moduleIcons[scope] ?? Target;

  return (
    <span className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#2f82bf]/45 bg-[rgba(10,44,72,0.35)] px-3 text-[12px] font-semibold text-[#c5e7ff]">
      <Icon className="size-3.5" />
      {moduleLabels[scope] ?? scope}
    </span>
  );
}

function MetricCard({
  delta,
  deltaSuffix,
  footer,
  className,
  icon,
  label,
  tone = "default",
  value,
  valueSuffix,
  inverseDelta = false,
}: {
  delta?: number | null;
  deltaSuffix?: string;
  footer: string;
  className?: string;
  icon: ReactNode;
  label: string;
  tone?: "default" | "danger";
  value: number | string | null;
  valueSuffix?: string;
  inverseDelta?: boolean;
}) {
  const splitValue = typeof value === "number" ? splitMetricValue(value, valueSuffix ?? "") : null;
  const badgeTone = deltaIsGood(delta ?? null, inverseDelta);

  return (
    <Panel
      className={cn(
        "relative h-[124px] overflow-hidden p-5",
        tone === "danger" && "border-[#6e3535] bg-[#241116]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-[#68afe9]", tone === "danger" && "text-[#d96975]")}>
              {icon}
            </span>
            <p className="truncate text-[12px] font-medium uppercase leading-4 tracking-[0.05em] text-white">
              {label}
            </p>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            {splitValue ? (
              <>
                <p className="text-[32px] font-bold leading-10 text-white">{splitValue.number}</p>
                {splitValue.suffix ? <span className="text-[14px] leading-5 text-[#9aa5b6]">{splitValue.suffix}</span> : null}
              </>
            ) : (
              <p className={cn("text-[28px] font-bold leading-10 text-white", typeof value === "string" && value.length > 10 && "text-[24px]")}>
                {value ?? "Sem dados"}
              </p>
            )}
          </div>
          <p className="mt-0.5 truncate text-[12px] leading-4 text-[#5a6477]">{footer}</p>
        </div>
        {delta !== undefined ? (
          <div className="mt-[47px] shrink-0 text-right">
            <span
              className={cn(
                "inline-flex h-[21px] items-center gap-1 rounded-[4px] px-2 text-[12px] leading-4 text-white",
                badgeTone === false ? "bg-[#e77]" : badgeTone === true ? "bg-[#0a1f19] text-[#58a067]" : "bg-[#162334] text-[#9aa5b6]",
              )}
            >
              <span>{deltaIsGood(delta, inverseDelta) === false ? "↘" : deltaIsGood(delta, inverseDelta) === true ? "↗" : "→"}</span>
              {formatDeltaBadge(delta, deltaSuffix ?? "")}
            </span>
            <p className="mt-1 text-[10px] leading-[14px] text-[#5a6477]">
              {deltaSuffix === "%" ? "vs semana anterior" : "vs mês anterior"}
            </p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#0a2c48]/70 text-[#68afe9]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium leading-4 text-[#9aa5b6]">{label}</p>
        <p className="truncate text-[14px] font-semibold leading-5 text-white">{value}</p>
      </div>
    </div>
  );
}

function DeltaPill({
  inverse = false,
  suffix,
  value,
}: {
  inverse?: boolean;
  suffix: string;
  value: number | null;
}) {
  const good = deltaIsGood(value, inverse);
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center gap-1 rounded-[4px] px-2 text-[10px] leading-[14px]",
        good === true && "bg-[#0a1f19] text-[#58a067]",
        good === false && "bg-[#241827] text-[#d88f9c]",
        good === null && "bg-[#162334] text-[#9aa5b6]",
      )}
    >
      <span>{good === true ? "↗" : good === false ? "↘" : "→"}</span>
      {formatDeltaBadge(value, suffix)}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[20px] font-bold uppercase leading-[30px] text-white">
      {children}
    </h2>
  );
}

function RecordIcon({ type }: { type: string }) {
  const Icon = type === "sleep" ? Clock3 : type === "exam" ? ClipboardList : AlertTriangle;

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#051326] text-[#68afe9]">
      <Icon className="size-4" />
    </span>
  );
}

function AppointmentDialog({
  onOpenChange,
  open,
  patientId,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  patientId: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("Consulta de acompanhamento");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await createClientAppointment({
        durationMinutes: Number(duration),
        notes,
        patientId,
        startsAt: new Date(`${date}T${time}:00`).toISOString(),
        title,
      });

      if (!result.ok) {
        setError(result.error ?? "Não foi possível agendar.");
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
      <DialogContent className="border-[#303746] bg-[#0b1720] text-[#f3f4f7] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Agendar consulta</DialogTitle>
          <DialogDescription className="text-[#8b92a3]">
            Defina data, horário e observações operacionais para este Cliente.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
            Título
            <input
              className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0] sm:col-span-1">
              Data
              <input
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
              Horário
              <input
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
                required
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
              Duração
              <select
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                <option value="30">30 min</option>
                <option value="50">50 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
            Observação
            <textarea
              className="min-h-24 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 py-2 text-[14px] outline-none focus:border-[#3b97e3]"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Contexto, pauta ou lembrete interno."
            />
          </label>
          {error ? <p className="rounded-[10px] border border-[#6e3535] bg-[#31151b] px-3 py-2 text-[13px] text-[#ff7b8e]">{error}</p> : null}
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
            Agendar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({
  onOpenChange,
  open,
  patientId,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  patientId: string;
}) {
  const router = useRouter();
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [priority, setPriority] = useState<PartnerClientOverviewTask["priority"]>("medium");
  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await createClientTask({
        dueAt: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
        patientId,
        priority,
        title,
      });

      if (!result.ok) {
        setError(result.error ?? "Não foi possível adicionar a tarefa.");
        return;
      }

      setDueAt("");
      setPriority("medium");
      setTitle("");
      onOpenChange(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#303746] bg-[#0b1720] text-[#f3f4f7] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription className="text-[#8b92a3]">
            Crie um item de acompanhamento para o checklist deste Cliente.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
            Tarefa
            <input
              className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Revisar plano alimentar"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
              Prazo
              <input
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
                type="date"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[#d7dae0]">
              Prioridade
              <select
                className="h-10 rounded-[10px] border border-[#303746] bg-[#161a22] px-3 text-[14px] outline-none focus:border-[#3b97e3]"
                value={priority}
                onChange={(event) => setPriority(event.target.value as PartnerClientOverviewTask["priority"])}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </label>
          </div>
          {error ? <p className="rounded-[10px] border border-[#6e3535] bg-[#31151b] px-3 py-2 text-[13px] text-[#ff7b8e]">{error}</p> : null}
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Adicionar
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDrawer({
  data,
  onOpenChange,
  open,
}: {
  data: PartnerClientOverviewData["history"];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#303746] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[520px]" side="right">
        <SheetHeader className="border-b border-[#303746] px-6 py-5 text-left">
          <SheetTitle className="text-[22px] font-bold text-[#f3f4f7]">Histórico completo</SheetTitle>
          <SheetDescription className="text-[13px] text-[#8b92a3]">
            Eventos, registros, consultas, tarefas e renovações em ordem cronológica.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 px-6 py-5">
          {data.length === 0 ? (
            <p className="rounded-[10px] border border-[#303746] bg-[#161a22] p-4 text-[13px] text-[#8b92a3]">
              Ainda não há histórico para este Cliente.
            </p>
          ) : (
            data.map((item) => (
              <article className="rounded-[10px] border border-[#303746] bg-[#161a22] p-4" key={item.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[14px] font-semibold text-[#f3f4f7]">{item.title}</h3>
                  <span className="shrink-0 text-[12px] text-[#8b92a3]">{item.dateLabel}</span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[#bac1ce]">{item.detail}</p>
              </article>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AlertsDrawer({
  alerts,
  onOpenChange,
  open,
}: {
  alerts: PartnerClientOverviewData["alerts"];
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-[#472a30] bg-[#0b1720] p-0 text-[#f3f4f7] sm:max-w-[500px]" side="right">
        <SheetHeader className="border-b border-[#472a30] px-6 py-5 text-left">
          <SheetTitle className="text-[22px] font-bold text-[#f3f4f7]">Alertas do Cliente</SheetTitle>
          <SheetDescription className="text-[13px] text-[#d07a84]">
            Observações críticas, baixa adesão e tarefas relevantes para acompanhamento.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 px-6 py-5">
          {alerts.length === 0 ? (
            <p className="rounded-[10px] border border-[#1f5f38] bg-[#0c2b1d] p-4 text-[13px] text-[#58d881]">
              Nenhum alerta ativo neste momento.
            </p>
          ) : (
            alerts.map((alert) => (
              <article className="rounded-[10px] border border-[#6e3535] bg-[#241116] p-4" key={alert.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[14px] font-semibold text-[#ffbdc5]">{alert.title}</h3>
                  <span className="shrink-0 text-[12px] text-[#d07a84]">{alert.dateLabel}</span>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[#e2a0a8]">{alert.detail}</p>
              </article>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PartnerClientOverviewView({ overview }: PartnerClientOverviewViewProps) {
  const router = useRouter();
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("6m");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskPendingId, setTaskPendingId] = useState<string | null>(null);
  const [weekId, setWeekId] = useState(overview.adherenceWeeks.at(-1)?.id ?? "");

  const filteredMeasurements = useMemo(() => {
    if (chartPeriod === "all" || overview.bodyMeasurements.length === 0) return overview.bodyMeasurements;
    const latest = new Date(overview.bodyMeasurements.at(-1)?.measuredAt ?? overview.generatedAt);
    const months = chartPeriod === "3m" ? 3 : chartPeriod === "6m" ? 6 : 12;
    const start = new Date(latest);
    start.setMonth(start.getMonth() - months + 1);
    return overview.bodyMeasurements.filter((item) => new Date(item.measuredAt) >= start);
  }, [chartPeriod, overview.bodyMeasurements, overview.generatedAt]);

  const selectedWeek =
    overview.adherenceWeeks.find((week) => week.id === weekId) ??
    overview.adherenceWeeks.at(-1) ??
    null;
  const whatsappHref = overview.client.phoneDigits
    ? `https://wa.me/${overview.client.phoneDigits}?text=${encodeURIComponent(`Olá, ${overview.client.name}! Passando para acompanhar seu plano.`)}`
    : null;
  const weeklyRows = [
    {
      deltaValue: selectedWeek?.dietDelta ?? null,
      icon: Utensils,
      label: "Dieta",
      value: selectedWeek?.dietPercentage ?? null,
    },
    {
      deltaValue: selectedWeek?.trainingDelta ?? null,
      icon: Dumbbell,
      label: "Treino",
      value: selectedWeek?.trainingPercentage ?? null,
    },
  ];

  async function toggleTask(task: PartnerClientOverviewTask, completed: boolean) {
    setTaskPendingId(task.id);
    try {
      await setClientTaskCompleted({
        completed,
        patientId: overview.client.id,
        taskId: task.id,
      });
      router.refresh();
    } finally {
      setTaskPendingId(null);
    }
  }

  return (
    <div className="client-overview-page min-h-screen overflow-x-hidden bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6 lg:py-6">
      <style>{`
        @media print {
          aside,
          nav,
          .client-overview-no-print,
          .client-overview-tabs,
          .client-overview-actions {
            display: none !important;
          }

          .client-overview-page {
            background: #ffffff !important;
            color: #111827 !important;
            padding: 0 !important;
          }

          .client-overview-print-panel {
            border-color: #d1d5db !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="relative mx-auto min-w-0 max-w-[1197px]">
        <div className="client-overview-actions flex flex-wrap items-center justify-between gap-3 lg:absolute lg:inset-x-0 lg:top-0 lg:z-10">
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 text-[14px] font-medium text-[#f3f4f7]"
              type="button"
              onClick={() => setHistoryOpen(true)}
            >
              <History className="size-[18px]" />
              Histórico completo
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 text-[14px] font-medium text-[#f3f4f7]"
              type="button"
              onClick={() => window.print()}
            >
              <FileDown className="size-[18px]" />
              Exportar PDF
            </button>
            {whatsappHref ? (
              <a
                className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#1f5f38] bg-[#0c2b1d] px-4 text-[14px] font-medium text-[#58d881]"
                href={whatsappHref}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="size-[18px]" />
                Mensagem
              </a>
            ) : (
              <button className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-[10px] border border-[#303746] bg-[#161a22] px-4 text-[14px] font-medium text-[#6f7c89]" disabled type="button">
                <MessageCircle className="size-[18px]" />
                Mensagem
              </button>
            )}
            <button
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#3b97e3] px-4 text-[14px] font-medium text-white"
              type="button"
              onClick={() => setAppointmentOpen(true)}
            >
              <CalendarPlus className="size-[18px]" />
              Agendar consulta
            </button>
          </div>
        </div>

        <header className="client-overview-print-panel mt-6 grid gap-6 lg:mt-2 lg:grid-cols-[120px_minmax(0,1fr)_280px] lg:items-start">
          {overview.client.avatarUrl ? (
            <img
              alt=""
              className="size-[120px] rounded-full border-2 border-[#1d7ece]/70 object-cover"
              src={overview.client.avatarUrl}
            />
          ) : (
            <span className="flex size-[120px] items-center justify-center rounded-full border-2 border-[#1d7ece]/70 bg-[#fce4e7] text-[40px] font-bold text-[#121722]">
              {overview.client.initial}
            </span>
          )}

          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="truncate text-[30px] font-bold leading-8 text-white">{overview.client.name}</h1>
              <span className="inline-flex h-[26px] items-center gap-2 rounded-[13px] bg-[#0c2b1d] px-4 text-[12px] font-medium text-[#58d881]">
                <span className="size-2 rounded-full bg-[#58d881]" />
                {overview.client.statusLabel}
              </span>
            </div>
            <p className="mt-2 truncate text-[14px] leading-5 text-[#9aa5b6]">{overview.client.email}</p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <InfoItem icon={<CalendarPlus className="size-4" />} label="Idade" value={overview.client.ageLabel} />
              <InfoItem icon={<Users className="size-4" />} label="Gênero" value={overview.client.genderLabel} />
              <InfoItem icon={<CalendarPlus className="size-4" />} label="Nascimento" value={overview.client.birthDateLabel} />
              <InfoItem icon={<Phone className="size-4" />} label="Telefone" value={overview.client.phoneLabel} />
              <InfoItem icon={<Target className="size-4" />} label="Período do plano" value={overview.client.planPeriodLabel} />
              <InfoItem icon={<Target className="size-4" />} label="Objetivo principal" value={overview.client.objectiveLabel} />
            </div>
          </div>

          <div className="lg:pt-0">
            <p className="text-[11px] font-semibold uppercase leading-[14px] tracking-[0.05em] text-[#9aa5b6]">
              Módulos ativos
            </p>
            <div className="mt-[107px] flex flex-wrap gap-2 lg:justify-end">
              {overview.client.serviceScopes.map((scope) => (
                <HeaderModule key={scope} scope={scope} />
              ))}
              {overview.client.serviceScopes.length === 0 ? (
                <span className="inline-flex h-[42px] items-center rounded-[10px] border border-[#303746] px-3 text-[12px] text-[#8b92a3]">
                  Sem módulo ativo
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="client-overview-tabs mt-7 flex min-w-0 gap-7 overflow-x-auto border-b border-[#303746]">
          <button className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-white after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[#3b97e3]" type="button">
            Visão Geral
          </button>
          <Link
            className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-[#8fcfff] hover:text-white"
            href={`/parceiros/clientes/${overview.client.id}?tab=avaliacoes`}
          >
            Avaliações
          </Link>
          <Link
            className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-[#8fcfff] hover:text-white"
            href={`/parceiros/clientes/${overview.client.id}?tab=dietas`}
          >
            Dietas
          </Link>
          <Link
            className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-[#8fcfff] hover:text-white"
            href={`/parceiros/clientes/${overview.client.id}?tab=treinos`}
          >
            Treinos
          </Link>
          <Link
            className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-[#8fcfff] hover:text-white"
            href={`/parceiros/clientes/${overview.client.id}?tab=cardio`}
          >
            Cardio
          </Link>
          <Link
            className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-[#8fcfff] hover:text-white"
            href={`/parceiros/clientes/${overview.client.id}?tab=exames`}
          >
            Exames
          </Link>
          <Link
            className="relative inline-flex h-[47px] shrink-0 items-center px-4 text-[14px] font-semibold text-[#8fcfff] hover:text-white"
            href={`/parceiros/clientes/${overview.client.id}?tab=fotos`}
          >
            Fotos
          </Link>
          {futureTabs.map((tab) => (
            <button
              className="inline-flex h-[47px] shrink-0 cursor-not-allowed items-center gap-2 text-[14px] font-semibold text-[#6f7c89]"
              disabled
              key={tab}
              type="button"
            >
              <Lock className="size-3.5" />
              {tab}
            </button>
          ))}
        </div>

        <section className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.99fr_1.22fr_0.78fr]">
          <MetricCard
            delta={overview.weight.delta}
            deltaSuffix=" kg"
            footer={overview.weight.target !== null ? `Meta: ${formatNumber(overview.weight.target, " kg")}` : "Sem meta definida"}
            icon={<Scale className="size-4" />}
            inverseDelta
            label="Peso atual"
            value={overview.weight.value}
            valueSuffix="kg"
          />
          <MetricCard
            delta={overview.bodyFat.delta}
            deltaSuffix="%"
            footer={`Meta: ${overview.bodyFat.targetLabel}`}
            icon={<TrendingUp className="size-4" />}
            inverseDelta
            label="% Gordura Corporal"
            value={overview.bodyFat.value}
            valueSuffix="%"
          />
          <MetricCard
            delta={overview.generalAdherence.delta}
            deltaSuffix="%"
            footer={`Meta: >= ${overview.adherenceTarget}%`}
            icon={<CheckCircle2 className="size-4" />}
            label="Adesão Geral"
            value={overview.generalAdherence.value}
            valueSuffix="%"
          />
          <MetricCard
            footer={overview.nextAppointment ? overview.nextAppointment.timeLabel : "Nenhuma consulta futura"}
            icon={<Clock3 className="size-4" />}
            label="Próxima Consulta"
            value={overview.nextAppointment?.dateLabel ?? "Sem agenda"}
          />
          <button className="min-w-0 text-left" type="button" onClick={() => setAlertsOpen(true)}>
            <MetricCard
              footer={overview.alerts.length > 0 ? "Requerem atenção" : "Sem alertas ativos"}
              icon={<AlertTriangle className="size-4" />}
              label="Alertas"
              tone={overview.alerts.length > 0 ? "danger" : "default"}
              value={overview.alerts.length}
            />
          </button>
        </section>

        <section className="mt-[22px] grid gap-4 xl:grid-cols-[2.05fr_1fr_1fr]">
          <Panel className="client-overview-print-panel h-auto p-4 xl:h-[260px]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                <SectionTitle>Evolução Corporal</SectionTitle>
                <div className="flex flex-wrap items-center gap-4 text-[12px] leading-4 text-[#9aa5b6]">
                  <span className="inline-flex items-center gap-2"><span className="h-px w-3 bg-[#238bd7]" /> Peso (kg)</span>
                  <span className="inline-flex items-center gap-2"><span className="h-px w-3 bg-[#5ec66a]" /> Massa magra (kg)</span>
                  <span className="inline-flex items-center gap-2"><span className="h-px w-3 bg-[#ff6f7d]" /> Massa gorda (kg)</span>
                </div>
              </div>
              <select
                aria-label="Período da evolução corporal"
                className="client-overview-no-print h-8 shrink-0 rounded-[10px] border border-transparent bg-transparent px-2 text-[12px] font-medium text-[#9aa5b6] outline-none focus:border-[#3b97e3]"
                value={chartPeriod}
                onChange={(event) => setChartPeriod(event.target.value as ChartPeriod)}
              >
                {(Object.keys(chartPeriodLabels) as ChartPeriod[]).map((period) => (
                  <option key={period} value={period}>
                    {chartPeriodLabels[period]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <ClientOverviewChart data={filteredMeasurements} />
            </div>
          </Panel>

          <Panel className="client-overview-print-panel h-auto p-4 xl:h-[260px]">
            <div className="flex items-start justify-between gap-3">
              <SectionTitle>Desempenho Semanal</SectionTitle>
              <select
                aria-label="Semana de desempenho"
                className="h-8 min-w-[118px] rounded-[8px] border border-[#303746] bg-[#101923] px-2 text-[11px] font-medium text-[#d7dae0] outline-none focus:border-[#3b97e3]"
                value={selectedWeek?.id ?? ""}
                onChange={(event) => setWeekId(event.target.value)}
              >
                {overview.adherenceWeeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid gap-5">
              {weeklyRows.map(({ deltaValue, icon: Icon, label, value }) => {
                const displayLabel = label === "Dieta" ? "Adesão à dieta" : "Conclusão dos treinos";
                const barColor = label === "Dieta" ? "bg-[#3b97e3]" : "bg-[#58a067]";
                return (
                  <div className="min-w-0" key={label}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#051326] text-[#1d7ece]">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium leading-5 text-white">{displayLabel}</p>
                          <p className="text-[12px] leading-4 text-[#5a6477]">Meta: &gt;= {overview.adherenceTarget}%</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[18px] font-bold leading-7 text-white">{formatNumber(value, "%")}</p>
                        <DeltaPill suffix="%" value={deltaValue} />
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-[4px] bg-[#051326]">
                      <div
                        className={cn("h-full rounded-[4px]", barColor)}
                        style={{ width: `${Math.max(0, Math.min(100, Number(value ?? 0)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="client-overview-print-panel h-auto p-4 xl:h-[260px]">
            <SectionTitle>Últimos Registros</SectionTitle>
            <div className="mt-5 grid gap-4">
              {overview.recentRecords.length === 0 ? (
                <p className="rounded-[10px] border border-[#303746] bg-[#161a22] p-4 text-[13px] text-[#8b92a3]">
                  Ainda não há registros recentes.
                </p>
              ) : (
                overview.recentRecords.slice(0, 3).map((record) => (
                  <article className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3" key={record.id}>
                    <RecordIcon type={record.type} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[14px] font-medium leading-5 text-white">{record.title}</h3>
                      <p className="truncate text-[10px] leading-[14px] text-[#5a6477]">{record.dateLabel}</p>
                    </div>
                    <span className="max-w-[70px] truncate text-right text-[13px] font-semibold leading-4 text-white">{record.value}</span>
                  </article>
                ))
              )}
            </div>
          </Panel>
        </section>

        <section className="mt-[22px] grid gap-4 xl:grid-cols-[1.75fr_1fr]">
          <Panel className="client-overview-print-panel min-h-[235px] overflow-hidden p-0">
            <div className="flex min-h-[56px] items-center justify-between gap-6 border-b border-[#303746] px-5 py-3">
              <SectionTitle>Resumo do Plano Atual</SectionTitle>
            </div>
            {overview.plan ? (
              <div className="p-4">
                <p className="text-[12px] leading-4 text-[#9aa5b6]">{overview.plan.name}</p>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {overview.plan.modules.map((module) => {
                    const Icon = moduleIcons[module.type] ?? Target;
                    return (
                      <article className="min-w-0 border-[#303746] md:border-r md:pr-5 md:last:border-r-0" key={module.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="size-4 text-[#68afe9]" />
                          <h3 className="text-[14px] font-semibold leading-5 text-white">{module.title}</h3>
                        </div>
                        <p className="mt-4 text-[13px] leading-4 text-[#9aa5b6]">{module.primarySummary}</p>
                        {module.secondarySummary ? <p className="mt-2 text-[12px] leading-4 text-[#5a6477]">{module.secondarySummary}</p> : null}
                      </article>
                    );
                  })}
                </div>
                <p className="mt-5 text-[13px] text-[#8b92a3]">
                  Renovação: <span className="font-semibold text-white">{overview.plan.renewalLabel}</span>
                </p>
              </div>
            ) : (
              <p className="m-4 rounded-[10px] border border-[#303746] bg-[#161a22] p-4 text-[13px] text-[#8b92a3]">
                Nenhuma assinatura personalizada ativa para este Cliente.
              </p>
            )}
          </Panel>

          <Panel className="client-overview-print-panel min-h-[235px] overflow-hidden p-0">
            <div className="flex min-h-[56px] items-center justify-between gap-6 border-b border-[#303746] px-5 py-3">
              <SectionTitle>Pendências Importantes</SectionTitle>
              <button
                className="client-overview-no-print inline-flex h-8 shrink-0 items-center gap-2 rounded-[8px] bg-[#3b97e3] px-3 text-[12px] font-semibold text-white"
                type="button"
                onClick={() => setTaskOpen(true)}
              >
                <Plus className="size-3.5" />
                Tarefa
              </button>
            </div>
            <div>
              {overview.tasks.length === 0 ? (
                <p className="m-4 rounded-[10px] border border-[#303746] bg-[#161a22] p-4 text-[13px] text-[#8b92a3]">
                  Nenhuma tarefa criada.
                </p>
              ) : (
                overview.tasks.slice(0, 4).map((task) => (
                  <article className="grid min-h-[49px] grid-cols-[20px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[#303746] px-5 py-3 last:border-b-0" key={task.id}>
                    <Checkbox
                      aria-label={task.status === "completed" ? "Reabrir tarefa" : "Concluir tarefa"}
                      checked={task.status === "completed"}
                      className="border-[#3b97e3] data-[state=checked]:bg-[#3b97e3]"
                      disabled={taskPendingId === task.id}
                      onCheckedChange={(checked) => toggleTask(task, checked === true)}
                    />
                    <p className={cn("min-w-0 truncate text-[14px] font-medium leading-5 text-white", task.status === "completed" && "text-[#8b92a3] line-through")}>
                      {task.title}
                    </p>
                    <span className="hidden items-center gap-1 text-[12px] leading-4 text-[#9aa5b6] sm:inline-flex">
                      <CalendarPlus className="size-4" />
                      {task.dueLabel}
                    </span>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", priorityClasses[task.priority])}>
                      {task.priorityLabel}
                    </span>
                  </article>
                ))
              )}
            </div>
          </Panel>
        </section>

        <div className="mt-6 flex flex-wrap gap-4 text-[12px] text-[#728697]">
          <span className="inline-flex items-center gap-2">
            <ClipboardList className="size-4" /> Dados clínicos restritos ao parceiro vinculado
          </span>
          <span className="inline-flex items-center gap-2">
            <Dumbbell className="size-4" /> Escopo ativo: {activeScopeLabel(overview.client.serviceScopes)}
          </span>
        </div>
      </div>

      <AppointmentDialog open={appointmentOpen} patientId={overview.client.id} onOpenChange={setAppointmentOpen} />
      <TaskDialog open={taskOpen} patientId={overview.client.id} onOpenChange={setTaskOpen} />
      <HistoryDrawer data={overview.history} open={historyOpen} onOpenChange={setHistoryOpen} />
      <AlertsDrawer alerts={overview.alerts} open={alertsOpen} onOpenChange={setAlertsOpen} />
    </div>
  );
}
