"use client";

import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  FileText,
  HeartPulse,
  Moon,
  Pill,
  ShieldCheck,
  Sparkles,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useTransition } from "react";

import type { ClientHealthAction, ClientHealthData, ClientHealthMedication } from "@/lib/clients/health-metrics";
import { cn } from "@/lib/utils";

import { completeClientHealthAction, markClientHealthMedication } from "./actions";

type ClientHealthViewProps = {
  health: ClientHealthData | null;
};

const moduleCards = [
  { href: "/cliente/dieta", icon: Utensils, image: "/cliente/inicio/capa-dieta.png", key: "dieta", title: "Dieta" },
  { href: "/cliente/treino", icon: Dumbbell, image: "/cliente/inicio/capa-treino.png", key: "treino", title: "Treino" },
  { href: "/cliente/saude", icon: HeartPulse, image: "/cliente/inicio/capa-saude.png", key: "saude", title: "Saúde" },
] as const;

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[14px] border border-[#213444] bg-[linear-gradient(146deg,rgba(17,31,43,0.96)_0%,rgba(8,18,27,0.94)_100%)] shadow-[0_22px_70px_rgba(0,0,0,0.28)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function EmptyHealth() {
  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-10 text-white sm:px-8 lg:px-12">
      <Panel className="mx-auto max-w-[920px] p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-[14px] bg-[#12385a] text-[#8fcfff]">
          <HeartPulse className="size-7" />
        </div>
        <h1 className="mt-5 text-[30px] font-bold">Painel de Saúde</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-6 text-[#9fb1c0]">
          Seu acompanhamento de saúde ainda não foi publicado. Assim que houver indicadores, eles aparecerão aqui.
        </p>
        <Link className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#2d9cff] px-5 text-[14px] font-bold text-white" href="/cliente/inicio">
          Voltar para Home
        </Link>
      </Panel>
    </div>
  );
}

function ModuleSelector() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {moduleCards.map((module) => {
        const Icon = module.icon;
        const active = module.key === "saude";
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative min-h-[138px] overflow-hidden rounded-[14px] border bg-[#101a25] p-5 transition duration-300 hover:-translate-y-0.5",
              active ? "border-[#1f8dff] shadow-[0_0_0_1px_rgba(31,141,255,0.35),0_18px_55px_rgba(31,141,255,0.2)]" : "border-[#2a3946] hover:border-[#4b6072]",
            )}
            href={module.href}
            key={module.key}
          >
            <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-[1.04]" src={module.image} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07141d]/95 via-[#07141d]/65 to-[#07141d]/20" />
            <div className="relative flex h-full flex-col justify-between">
              <span className={cn("flex size-12 items-center justify-center rounded-[10px]", active ? "bg-[#0d57a6] text-[#8fcfff]" : "bg-white/10 text-[#c6d3df]")}> 
                <Icon className="size-6" />
              </span>
              <div className="mt-7 flex items-center justify-between gap-4">
                <h2 className="text-[26px] font-bold text-white">{module.title}</h2>
                <ChevronRight className={cn("size-5 transition", active ? "text-[#8fcfff]" : "text-[#8ea0ae]")} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ProgressRing({ children, percent, size = 132 }: { children: ReactNode; percent: number; size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#1f8dff 0deg, #20d3f2 ${Math.min(100, Math.max(0, percent)) * 3.6}deg, rgba(45,61,76,0.72) 0deg)`,
        height: size,
        width: size,
      }}
    >
      <div className="absolute inset-[10px] rounded-full bg-[#101a25] shadow-[inset_0_0_24px_rgba(31,141,255,0.18)]" />
      <div className="relative grid size-[58%] place-items-center rounded-full border border-[#1f8dff]/80 bg-[#0b1a28] text-center shadow-[0_0_24px_rgba(31,141,255,0.35)]">
        {children}
      </div>
    </div>
  );
}

function CareOverview({ health }: { health: ClientHealthData }) {
  return (
    <Panel className="grid gap-6 p-6 xl:grid-cols-[430px_minmax(0,1fr)_300px] xl:items-center">
      <div className="flex items-center gap-7">
        <ProgressRing percent={health.care.percent} size={150}>
          <Check className="size-9 text-[#20d3f2]" />
        </ProgressRing>
        <div>
          <p className="text-[16px] font-bold text-white">Seu cuidado de hoje</p>
          <p className="mt-4 text-[44px] font-black leading-none text-white">{health.care.completed} de {health.care.total}</p>
          <p className="mt-2 text-[22px] text-[#c3d2df]">ações concluídas</p>
          <p className="mt-4 text-[13px] font-semibold text-[#22c55e]">Você está cuidando bem da sua saúde.</p>
        </div>
      </div>

      <div className="grid gap-3 border-y border-[#223646] py-5 xl:border-x xl:border-y-0 xl:px-8 xl:py-0">
        {health.actions.map((action) => (
          <ActionRow action={action} key={action.key} />
        ))}
      </div>

      <div className="rounded-[14px] border border-[#223646] bg-[#0b1722]/88 p-5">
        <p className="text-[13px] font-black uppercase text-white">Próxima consulta/atualização</p>
        {health.nextAppointment ? (
          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-[76px] w-[80px] place-items-center rounded-[14px] border border-[#1d7ece] bg-[linear-gradient(152deg,rgba(29,126,206,0.51),rgba(25,42,55,0))] text-center">
              <span className="block text-[18px] font-black uppercase text-[#cae7ff]">{health.nextAppointment.monthLabel}</span>
              <span className="block text-[32px] font-black leading-8 text-white">{health.nextAppointment.dayLabel}</span>
            </div>
            <div>
              <p className="text-[28px] font-black text-white">{health.nextAppointment.timeLabel}</p>
              <p className="mt-1 text-[12px] text-[#94a3b8]">{health.nextAppointment.detailLabel} ›</p>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-[14px] text-[#9fb1c0]">Nenhuma consulta agendada.</p>
        )}
      </div>
    </Panel>
  );
}

function ActionRow({ action }: { action: ClientHealthAction }) {
  const done = action.status === "completed";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-4 text-[13px]">
      <div className="min-w-0">
        <p className="flex items-center gap-3 font-bold text-white">
          <span className={cn("size-2.5 rounded-full", done ? "bg-[#22c55e]" : "border border-[#3b97e3]")} />
          <span className="truncate">{action.title}</span>
        </p>
        {action.detail || action.timeLabel ? <p className="ml-5 mt-0.5 truncate text-[11px] text-[#798697]">{action.detail ?? action.timeLabel}</p> : null}
      </div>
      <span className={cn("text-[12px] font-bold", done ? "text-[#22c55e]" : "text-[#3b97e3]")}>• {action.statusLabel}</span>
    </div>
  );
}

function SleepCard({ health }: { health: ClientHealthData }) {
  return (
    <Panel className="p-5">
      <CardHeader href="/cliente/saude#sono" icon={<Moon className="size-5" />} title="Sono" />
      <div className="mt-6 grid gap-5 sm:grid-cols-[150px_1fr]">
        <div className="grid justify-items-center gap-3">
          <ProgressRing percent={health.sleep.efficiency} size={132}>
            <span className="text-[31px] font-black text-[#8ca6ff]">{health.sleep.efficiency}%</span>
            <span className="text-[10px] leading-3 text-[#c3d2df]">Eficiência do sono</span>
          </ProgressRing>
          <span className="rounded-full border border-[#22c55e]/65 bg-[#22c55e]/15 px-4 py-1 text-[11px] font-bold text-[#22c55e]">● {health.sleep.qualityLabel}</span>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-3">
            <Metric value={health.sleep.totalLabel} label="Tempo total" />
            <Metric value={health.sleep.deepLabel} label="Sono profundo" />
            <Metric value={health.sleep.latencyLabel} label="Latência" />
          </div>
          <MiniLineChart className="mt-5" points={health.sleep.trend.map((item) => item.percent)} labels={health.sleep.trend.map((item) => item.label)} />
          <div className="mt-4 rounded-[10px] border border-[#164264] bg-[#0b2943]/70 p-3 text-[12px] text-[#b9d8f5]">
            Sua qualidade do sono está excelente. Mantenha sua rotina e horários consistentes.
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PressureCard({ health }: { health: ClientHealthData }) {
  return (
    <Panel className="p-5">
      <CardHeader href="/cliente/saude#pressao" icon={<HeartPulse className="size-5" />} title="Monitoramento da pressão (MRPA)" />
      <div className="mt-5 grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)]">
        <div className="flex items-center gap-4 lg:block">
          <ProgressRing percent={health.pressure.protocolPercent} size={104}>
            <span className="text-[24px] font-black text-white">{health.pressure.daysCompleted}</span>
            <span className="text-[9px] leading-3 text-[#c3d2df]">de {health.pressure.totalDays} dias</span>
          </ProgressRing>
          <div className="lg:mt-4">
            <p className="text-[13px] font-bold text-white">Protocolo em andamento</p>
            <p className="mt-1 text-[11px] text-[#94a3b8]">Faltam {Math.max(0, health.pressure.totalDays - health.pressure.daysCompleted)} dias para concluir</p>
            <div className="mt-3 h-2 rounded-full bg-[#223443]"><div className="h-full rounded-full bg-[#1f8dff]" style={{ width: `${health.pressure.protocolPercent}%` }} /></div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[10px] border border-[#223646] bg-[#0c1721] p-4">
            <p className="text-[12px] font-bold text-[#8fcfff]">Últimos registros</p>
            <div className="mt-3 space-y-2">
              {health.pressure.lastRecords.map((record) => (
                <div className="flex justify-between gap-4 text-[12px]" key={`${record.dateLabel}-${record.valueLabel}`}>
                  <span className="text-[#9fb1c0]">{record.dateLabel}</span>
                  <span className="font-bold text-white">{record.valueLabel}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[10px] border border-[#223646] bg-[#0c1721] p-4">
            <p className="text-[12px] font-bold text-[#c7d5e2]">Média dos últimos registros</p>
            <p className="mt-3 text-[26px] font-black text-white">{health.pressure.averageLabel}</p>
            <MiniLineChart className="mt-2" points={health.pressure.points.map((item) => item.systolic)} labels={health.pressure.points.map((item) => item.label)} secondary={health.pressure.points.map((item) => item.diastolic)} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RemindersCard({ health }: { health: ClientHealthData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function completeNext() {
    if (!health.nextAction) return;
    startTransition(async () => {
      const result = await completeClientHealthAction(health.nextAction?.key ?? "", health.selectedDate.iso);
      if (!result.ok) window.alert(result.error ?? "Não foi possível concluir a ação.");
      router.refresh();
    });
  }

  return (
    <Panel className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#201844] text-[#a98cff]"><Bell className="size-5" /></span>
        <h2 className="text-[16px] font-bold text-white">Lembretes de hoje</h2>
      </div>
      <div className="mt-5 space-y-3">
        {health.actions.slice(0, 4).map((action) => (
          <div className="flex items-center justify-between gap-3 text-[12px]" key={action.key}>
            <span className={cn("font-bold", action.status === "completed" ? "text-[#22c55e]" : "text-[#f59e0b]")}>{action.timeLabel ?? "--:--"}</span>
            <span className="min-w-0 flex-1 truncate text-[#c3d2df]">{action.title}</span>
            <span className={cn("size-3 rounded-full", action.status === "completed" ? "bg-[#22c55e]" : "border border-[#f59e0b]")} />
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-[12px] border border-[#f59e0b]/70 bg-[#2a1b08]/55 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[16px] font-bold text-white"><Zap className="size-5 text-[#f59e0b]" />Próxima ação</p>
          <p className="text-[26px] font-black text-[#f59e0b]">{health.nextAction?.timeLabel ?? "--:--"}</p>
        </div>
        <p className="mt-2 text-[13px] font-bold text-white">{health.nextAction?.title ?? "Tudo em dia"}</p>
        <p className="mt-1 text-[12px] leading-5 text-[#b9c2d0]">{health.nextAction?.detail ?? "Continue mantendo sua rotina de cuidado."}</p>
        <button className="mt-4 h-10 rounded-[9px] bg-[#f59e0b] px-4 text-[12px] font-bold text-white disabled:opacity-60" disabled={!health.nextAction || pending} type="button" onClick={completeNext}>
          Iniciar agora
        </button>
      </div>
    </Panel>
  );
}

function MedicationCard({ health }: { health: ClientHealthData }) {
  return (
    <Panel className="p-5 xl:col-span-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#2b2107] text-[#f59e0b]"><Pill className="size-5" /></span>
          <h2 className="text-[16px] font-bold text-white">Medicações e suplementos de hoje</h2>
        </div>
        <div className="flex gap-5 text-[13px] font-bold">
          <span className="text-[#22c55e]">{health.medications.activeCount} Ativas</span>
          <span className="text-[#f59e0b]">{health.medications.pendingCount} Pendente</span>
          <span className="text-[#3b97e3]">{health.medications.completedCount} Concluídas</span>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {health.medications.items.map((item) => <MedicationRow item={item} key={item.id} logDate={health.selectedDate.iso} />)}
      </div>
    </Panel>
  );
}

function MedicationRow({ item, logDate }: { item: ClientHealthMedication; logDate: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const done = item.status === "completed";

  function toggle() {
    startTransition(async () => {
      const result = await markClientHealthMedication(item.id, logDate, !done);
      if (!result.ok) window.alert(result.error ?? "Não foi possível atualizar a medicação.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 rounded-[10px] border border-[#223646] bg-[#0c1721] p-3 md:grid-cols-[minmax(0,1fr)_90px_130px_170px] md:items-center">
      <div>
        <p className="flex items-center gap-2 text-[13px] font-bold text-white"><span className="size-2 rounded-full border border-[#f59e0b]" />{item.name}</p>
        <p className="ml-4 text-[11px] text-[#9fb1c0]">{item.dosage}</p>
      </div>
      <p className="text-[12px] text-[#b9c2d0]">{item.scheduleLabel}</p>
      <span className={cn("rounded-full border px-3 py-1 text-center text-[11px] font-bold", done ? "border-[#22c55e]/60 bg-[#22c55e]/15 text-[#22c55e]" : "border-[#f59e0b]/60 bg-[#f59e0b]/15 text-[#f59e0b]")}>{item.statusLabel}</span>
      <button className="h-9 rounded-[8px] border border-[#254157] bg-[#10243a] px-3 text-[12px] font-bold text-[#b9d8f5] disabled:opacity-60" disabled={pending} type="button" onClick={toggle}>
        {done ? "Desmarcar" : "Marcar como tomado"}
      </button>
    </div>
  );
}

function ExamsCard({ health }: { health: ClientHealthData }) {
  return (
    <Panel className="p-5 xl:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#132b38] text-[#8fcfff]"><FileText className="size-5" /></span>
          <h2 className="text-[16px] font-bold text-white">Exames</h2>
        </div>
        <div className="flex gap-6 text-[13px] font-bold"><span className="text-[#ef4444]">{health.exams.alertCount} Precisam atenção</span><span className="text-[#22c55e]">{health.exams.normalCount} Normais</span></div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[10px] border border-[#ef4444]/70 bg-[#2a0c10]/55 p-4">
          <p className="text-[13px] font-bold text-white">Exames com atenção</p>
          <div className="mt-4 space-y-3">
            {health.exams.attention.map((exam) => (
              <div className="grid grid-cols-[minmax(0,1fr)_86px_72px] items-center gap-3 text-[12px]" key={exam.name}>
                <span className="truncate text-white">{exam.name}</span><span className="text-[#c3d2df]">{exam.valueLabel}</span><span className="rounded-full border border-[#ef4444]/60 bg-[#ef4444]/15 px-2 py-1 text-center font-bold text-[#ef4444]">{exam.statusLabel}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-4 text-[#b9c2d0]">Interpretação: ajuste suplementação conforme orientação profissional.</p>
        </div>
        <div className="rounded-[10px] border border-[#22c55e]/60 bg-[#05261f]/55 p-4">
          <p className="text-[13px] font-bold text-white">Exames normais</p>
          <div className="mt-4 space-y-3">
            {health.exams.normal.map((exam) => (
              <div className="grid grid-cols-[minmax(0,1fr)_70px] items-center gap-3 text-[12px]" key={exam.name}>
                <span className="truncate text-[#c3d2df]">{exam.name}<span className="block text-[11px] text-[#798697]">{exam.dateLabel} · {exam.valueLabel}</span></span><span className="text-right font-bold text-[#22c55e]">Normal</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-4 text-[#b9c2d0]">Interpretação: resultados dentro da faixa de normalidade.</p>
        </div>
      </div>
    </Panel>
  );
}

function TimelineCard({ health }: { health: ClientHealthData }) {
  const toneClass = { blue: "bg-[#3b97e3]", green: "bg-[#22c55e]", orange: "bg-[#f59e0b]", red: "bg-[#ef4444]" };
  return (
    <Panel className="p-5 xl:col-span-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#12385a] text-[#8fcfff]"><Sparkles className="size-5" /></span>
        <h2 className="text-[16px] font-bold text-white">Linha do tempo da saúde</h2>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {health.timeline.map((item) => (
          <div className="relative pl-5" key={item.id}>
            <span className={cn("absolute left-0 top-1 size-3 rounded-full", toneClass[item.tone])} />
            <p className="text-[12px] text-[#b9c2d0]">{item.dateLabel}</p>
            <p className="mt-1 text-[13px] font-bold text-white">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#798697]">{item.detail}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AchievementsCard({ health }: { health: ClientHealthData }) {
  const toneClass = { blue: "text-[#3b97e3]", green: "text-[#22c55e]", orange: "text-[#f59e0b]" };
  return (
    <Panel className="p-5 xl:col-span-7">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#2b2107] text-[#f59e0b]"><Trophy className="size-5" /></span>
        <div><h2 className="text-[16px] font-bold text-white">Conquistas da semana</h2><p className="text-[12px] text-[#798697]">Seu progresso nos últimos 7 dias</p></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {health.achievements.map((item) => (
          <div className="rounded-[10px] border border-[#2e3848] bg-[#101721]/80 p-4 text-center" key={item.label}>
            <p className={cn("text-[25px] font-black", toneClass[item.tone])}>{item.value}</p>
            <p className="mt-2 text-[11px] text-[#b9c2d0]">{item.label}</p>
            <p className="mt-1 text-[11px] font-bold text-[#22c55e]">Muito bom!</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CardHeader({ href, icon, title }: { href: string; icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-[10px] bg-[#0b2943] text-[#3b97e3]">{icon}</span><h2 className="text-[16px] font-bold text-white">{title}</h2></div>
      <Link className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-[#2e3848] bg-[#101721] px-3 text-[12px] font-bold text-[#b9c2d0]" href={href}>Ir para <ChevronRight className="size-3.5" /></Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[16px] font-black text-[#8ca6ff]">{value}</p><p className="text-[10px] text-[#798697]">{label}</p></div>;
}

function MiniLineChart({ className, labels, points, secondary }: { className?: string; labels: string[]; points: number[]; secondary?: number[] }) {
  const max = Math.max(...points, ...(secondary ?? []), 1);
  const min = Math.min(...points, ...(secondary ?? []), 0);
  const range = Math.max(1, max - min);
  const pointList = points.map((point, index) => `${(index / Math.max(1, points.length - 1)) * 100},${100 - ((point - min) / range) * 78 - 10}`).join(" ");
  const secondaryList = secondary?.map((point, index) => `${(index / Math.max(1, secondary.length - 1)) * 100},${100 - ((point - min) / range) * 78 - 10}`).join(" ");
  return (
    <div className={cn("rounded-[10px] border border-[#1b3245] bg-[#07141d] p-3", className)}>
      <svg aria-hidden="true" className="h-[88px] w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
        <polyline fill="none" points={pointList} stroke="#1f8dff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {secondaryList ? <polyline fill="none" points={secondaryList} stroke="#22c55e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
      </svg>
      <div className="mt-1 grid grid-flow-col justify-between gap-2 text-[9px] text-[#798697]">
        {labels.map((label) => <span key={label}>{label}</span>)}
      </div>
    </div>
  );
}

export function ClientHealthView({ health }: ClientHealthViewProps) {
  if (!health) return <EmptyHealth />;

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] text-[#f9fafb]">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 pb-14 pt-8 sm:px-8 lg:px-12">
        <ModuleSelector />
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-black leading-tight text-white sm:text-[38px]">Painel de Saúde</h1>
            <p className="mt-1 text-[14px] text-[#b9c2d0]">Acompanhe seus indicadores, mantenha a consistência e evolua todos os dias.</p>
          </div>
          <div className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#213444] bg-[#101a25] px-4 text-[13px] font-semibold text-[#b6c6d3]"><CalendarDays className="size-4 text-[#8fcfff]" />Hoje • {health.selectedDate.label}</div>
        </header>

        <CareOverview health={health} />

        <div className="grid gap-5 xl:grid-cols-12">
          <div className="xl:col-span-4"><SleepCard health={health} /></div>
          <div className="xl:col-span-4"><PressureCard health={health} /></div>
          <div className="xl:col-span-4"><RemindersCard health={health} /></div>
          <MedicationCard health={health} />
          <ExamsCard health={health} />
          <TimelineCard health={health} />
          <AchievementsCard health={health} />
        </div>

        <Panel className="grid gap-4 p-5 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-[10px] bg-[#0d3154] text-[#65bdff]"><ShieldCheck className="size-6" /></span>
            <p className="text-[15px] text-[#b9c2d0]">Você está construindo uma versão mais forte e saudável de si mesmo. Continue assim!</p>
          </div>
          <div className="text-[13px] text-[#b9c2d0]">Precisa de ajuda? Fale com seu profissional pelo acompanhamento.</div>
        </Panel>
      </main>
    </div>
  );
}
