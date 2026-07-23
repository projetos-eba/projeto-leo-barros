"use client";

import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  History,
  LineChart,
  ListChecks,
  Medal,
  Play,
  Target,
  Timer,
  Utensils,
  Weight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import { WorkoutMuscleMap } from "@/components/workouts/muscle-map";
import type { ClientWorkoutData, ClientWorkoutHistoryItem, ClientWorkoutSession } from "@/lib/clients/workout-metrics";
import { workoutMuscleLabels, workoutTechniqueLabels } from "@/lib/partners/client-workout-metrics";
import { cn } from "@/lib/utils";

import { startClientWorkoutSession } from "./actions";

type ClientWorkoutViewProps = {
  workout: ClientWorkoutData | null;
};

const moduleCards = [
  {
    href: "/cliente/dieta",
    icon: Utensils,
    image: "/cliente/inicio/capa-dieta.png",
    key: "dieta",
    title: "Dieta",
  },
  {
    href: "/cliente/treino",
    icon: Dumbbell,
    image: "/cliente/inicio/capa-treino.png",
    key: "treino",
    title: "Treino",
  },
  {
    href: "/cliente/saude",
    icon: HeartPulse,
    image: "/cliente/inicio/capa-saude.png",
    key: "saude",
    title: "Saúde",
  },
] as const;

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function Panel({ children, className, dataTestId }: { children: ReactNode; className?: string; dataTestId?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[18px] border border-[#213444] bg-[linear-gradient(146deg,rgba(17,31,43,0.96)_0%,rgba(8,18,27,0.94)_100%)] shadow-[0_22px_70px_rgba(0,0,0,0.28)]",
        className,
      )}
      data-testid={dataTestId}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  action,
  eyebrow,
  icon,
  title,
}: {
  action?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#082748] text-[#74c5ff]">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#74c5ff]">{eyebrow}</p> : null}
          <h2 className="truncate text-[19px] font-black tracking-[-0.01em] text-white">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function MiniMetric({
  accent = "blue",
  icon,
  label,
  value,
}: {
  accent?: "amber" | "blue" | "green" | "red";
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const colors = {
    amber: "bg-[#2d250a] text-[#ffd45a]",
    blue: "bg-[#082748] text-[#74c5ff]",
    green: "bg-[#092b1b] text-[#69e994]",
    red: "bg-[#341117] text-[#ff7b87]",
  };

  return (
    <div className="min-w-0 rounded-[14px] border border-[#223646] bg-[#0b1721]/82 p-3 sm:p-4">
      <div className={cn("flex size-9 items-center justify-center rounded-[10px]", colors[accent])}>{icon}</div>
      <p className="mt-3 truncate text-[12px] font-semibold text-[#8fa3b4]">{label}</p>
      <p className="mt-1 truncate text-[22px] font-black leading-none text-white sm:text-[24px]">{value}</p>
    </div>
  );
}

function ModuleSelector() {
  return (
    <nav aria-label="Módulos do cliente" className="grid gap-3 sm:grid-cols-3 lg:gap-4">
      {moduleCards.map((module) => {
        const Icon = module.icon;
        const active = module.key === "treino";
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative min-h-[108px] overflow-hidden rounded-[16px] border bg-[#101a25] p-4 transition duration-300 hover:-translate-y-0.5 sm:min-h-[128px] sm:p-5",
              active
                ? "border-[#1f8dff] shadow-[0_0_0_1px_rgba(31,141,255,0.35),0_18px_55px_rgba(31,141,255,0.2)]"
                : "border-[#2a3946] hover:border-[#4b6072]",
            )}
            href={module.href}
            key={module.key}
          >
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-500 group-hover:scale-[1.04]"
              src={module.image}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07141d]/95 via-[#07141d]/64 to-[#07141d]/24" />
            <div className="relative flex h-full flex-col justify-between">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-[12px] sm:size-12",
                  active ? "bg-[#0d57a6] text-[#8fcfff]" : "bg-white/10 text-[#c6d3df]",
                )}
              >
                <Icon className="size-5 sm:size-6" />
              </span>
              <div className="mt-6 flex items-center justify-between gap-4">
                <h2 className="text-[22px] font-black text-white sm:text-[26px]">{module.title}</h2>
                <ChevronRight className={cn("size-5 transition", active ? "text-[#8fcfff]" : "text-[#8ea0ae]")} />
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function EmptyWorkout() {
  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-4 py-6 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1160px]">
        <ModuleSelector />
        <Panel className="mt-8 p-7 text-center sm:p-9">
          <div className="mx-auto flex size-14 items-center justify-center rounded-[14px] bg-[#12385a] text-[#8fcfff]">
            <Dumbbell className="size-7" />
          </div>
          <h1 className="mt-5 text-[30px] font-bold">Painel de Treino</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-6 text-[#9fb1c0]">
            Seu programa de treino ainda não foi publicado. Assim que estiver disponível, sua rotina aparecerá aqui.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[10px] bg-[#2d9cff] px-5 text-[14px] font-bold text-white"
            href="/cliente/inicio"
          >
            Voltar para Home
          </Link>
        </Panel>
      </div>
    </div>
  );
}

function WorkoutHero({
  badgeLabel,
  detailLabel,
  session,
  workout,
}: {
  badgeLabel: string;
  detailLabel: string;
  session: ClientWorkoutSession;
  workout: ClientWorkoutData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextExercise = session.exercises.find((exercise) => exercise.logStatus !== "completed" && exercise.logStatus !== "skipped") ?? session.exercises[0] ?? null;

  function startWorkout() {
    startTransition(async () => {
      const result = await startClientWorkoutSession(session.id);
      if (!result.ok || !result.clientSessionId) {
        window.alert(result.error ?? "Não foi possível iniciar o treino.");
        return;
      }
      router.push(`/cliente/treino/executar/${result.clientSessionId}`);
    });
  }

  return (
    <Panel
      className="relative overflow-hidden border-[#1f8dff]/70 bg-[#0a2338] p-5 shadow-[0_0_0_1px_rgba(31,141,255,0.22),0_24px_80px_rgba(31,141,255,0.16)] sm:p-6 lg:min-h-[430px]"
      dataTestId="client-workout-hero"
    >
      <img alt="" className="absolute inset-y-0 right-0 hidden h-full w-[52%] object-cover opacity-62 lg:block" src="/cliente/inicio/capa-treino.png" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_34%,rgba(31,141,255,0.38),transparent_27%),linear-gradient(90deg,#07141d_0%,rgba(8,23,35,0.98)_50%,rgba(8,23,35,0.58)_100%)]" />
      <div className="relative z-10 flex h-full max-w-[720px] flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0d57a6] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.08em] text-white">
            <Dumbbell className="size-4" />
            {badgeLabel}
          </span>
          <span className="rounded-full border border-[#2b5c80] bg-[#0b1c2b]/80 px-3 py-1.5 text-[12px] font-bold text-[#b7d9f2]">
            {workout.routine.reasonLabel}
          </span>
          <span className="rounded-full border border-[#2b5c80] bg-[#0b1c2b]/80 px-3 py-1.5 text-[12px] font-bold text-[#b7d9f2]">
            {workout.program?.title ?? "Programa ativo"} · v{workout.program?.version ?? 1}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-[14px] font-semibold text-[#8fcfff]">Treino {session.letter}</p>
          <h1 className="mt-2 max-w-[660px] text-[38px] font-black leading-[1.04] tracking-[-0.01em] text-white sm:text-[48px]">
            {session.trainingLabel}
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-[#a9bdcc]">
            {detailLabel}. Registre séries, carga e repetições para acompanhar sua evolução real.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniMetric icon={<Timer className="size-5" />} label="Duração" value={`${session.durationMinutes} min`} />
          <MiniMetric icon={<ListChecks className="size-5" />} label="Exercícios" value={`${session.exercises.length}`} />
          <MiniMetric icon={<Activity className="size-5" />} label="Séries" value={`${session.totalSets}`} />
          <MiniMetric icon={<Weight className="size-5" />} label="Volume" value={`${formatNumber(session.volumeKg)} kg`} />
        </div>

        <div className="mt-auto pt-6">
          <div className="mb-4 rounded-[14px] border border-[#223646] bg-[#07141d]/72 p-4">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#78c6ff]">Próxima ação</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[18px] font-bold text-white">{nextExercise?.name ?? "Treino disponível"}</p>
              <span className="rounded-full border border-[#2a4052] px-3 py-1 text-[12px] font-bold text-[#a8bac8]">{session.statusLabel}</span>
            </div>
          </div>
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#1f8dff] px-5 text-[15px] font-black text-white transition hover:bg-[#43a4ff] disabled:opacity-60 sm:w-auto sm:min-w-[230px]"
            disabled={pending}
            type="button"
            onClick={startWorkout}
          >
            <Play className="size-4 fill-white" />
            {pending ? "Abrindo treino..." : "Iniciar treino"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function SessionSelector({
  onSelect,
  selectedId,
  suggestedId,
  sessions,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
  suggestedId: string | null;
  sessions: ClientWorkoutSession[];
}) {
  return (
    <Panel className="p-5">
      <SectionTitle eyebrow="Rotina" icon={<CalendarDays className="size-5" />} title="Selecione o treino" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
        {sessions.map((session) => {
          const active = session.id === selectedId;
          const suggested = session.id === suggestedId;
          return (
            <button
              className={cn(
                "min-h-[136px] rounded-[15px] border p-4 text-left transition hover:-translate-y-0.5",
                active
                  ? "border-[#1f8dff] bg-[#0b2943] shadow-[0_0_0_1px_rgba(31,141,255,0.24)]"
                  : "border-[#243746] bg-[#0d1822]/78 hover:border-[#3f5970]",
              )}
              key={session.id}
              type="button"
              onClick={() => onSelect(session.id)}
            >
              <span className="block text-[36px] font-black leading-none text-white">{session.letter}</span>
              <span className="mt-3 line-clamp-2 block text-[13px] font-bold text-[#cfe1ef]">{session.trainingLabel}</span>
              <span className="mt-1 block text-[12px] text-[#8fa3b4]">{session.durationMinutes} min · {session.exercises.length} exercícios</span>
              {suggested ? <span className="mt-3 inline-flex rounded-full bg-[#0d57a6] px-2.5 py-1 text-[11px] font-black text-white">Próximo</span> : null}
              <span className="mt-4 block h-1.5 overflow-hidden rounded-full bg-[#223443]">
                <span className="block h-full rounded-full bg-[#1f8dff]" style={{ width: `${session.completionPercent}%` }} />
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function RoutineStrip({ workout }: { workout: ClientWorkoutData }) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#74c5ff]">Ciclo do programa</p>
          <h2 className="mt-1 text-[18px] font-black text-white">{workout.routine.nextSessionLabel}</h2>
        </div>
        <span className="rounded-full border border-[#2a4052] bg-[#0b1721] px-3 py-1.5 text-[12px] font-bold text-[#b7d9f2]">
          {workout.routine.completedToday}/{workout.routine.totalToday} hoje
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {workout.sessions.map((session) => {
          const active = session.id === workout.routine.nextSessionId;
          const done = session.log?.status === "completed";
          return (
            <div
              className={cn(
                "min-w-0 rounded-[13px] border p-3",
                active ? "border-[#1f8dff] bg-[#0b2943]" : done ? "border-[#1e7e53] bg-[#082916]/65" : "border-[#223646] bg-[#0b1721]/78",
              )}
              key={session.id}
            >
              <div className="flex items-center justify-between gap-2">
                <b className="text-[17px] text-white">{session.letter}</b>
                <span className={cn("size-2 rounded-full", active ? "bg-[#1f8dff]" : done ? "bg-[#69e994]" : "bg-[#405466]")} />
              </div>
              <p className="mt-2 truncate text-[12px] font-bold text-[#cfe1ef]">{session.trainingLabel}</p>
              <p className="mt-1 text-[11px] text-[#8fa3b4]">{active ? "próximo treino" : session.statusLabel}</p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ExerciseStatusBadge({ status }: { status: ClientWorkoutSession["exercises"][number]["logStatus"] }) {
  const styles = {
    completed: "border-[#1e7e53] bg-[#082916] text-[#69e994]",
    in_progress: "border-[#1f8dff] bg-[#071d32] text-[#8fcfff]",
    pending: "border-[#33485a] bg-[#111d28] text-[#a9bdcc]",
    skipped: "border-[#8f3740] bg-[#341117] text-[#ff9a9a]",
  };
  const labels = {
    completed: "Concluído",
    in_progress: "Em andamento",
    pending: "Pendente",
    skipped: "Pulado",
  };

  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-black", styles[status])}>{labels[status]}</span>;
}

function ExerciseList({ session }: { session: ClientWorkoutSession }) {
  const bisetLabels = new Map<string, number>();
  session.exercises.forEach((exercise) => {
    if (!exercise.bisetGroupId || bisetLabels.has(exercise.bisetGroupId)) return;
    bisetLabels.set(exercise.bisetGroupId, bisetLabels.size + 1);
  });

  return (
    <Panel className="p-5">
      <SectionTitle
        action={<span className="rounded-full bg-[#12385a] px-3 py-1 text-[12px] font-bold text-[#8fcfff]">{session.exercises.length} exercícios</span>}
        eyebrow="Execução"
        icon={<ListChecks className="size-5" />}
        title="Exercícios do treino"
      />
      <div className="mt-5 divide-y divide-[#203343] overflow-hidden rounded-[14px] border border-[#223646] bg-[#091722]/80">
        {session.exercises.map((exercise, index) => (
          <article className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_260px] xl:grid-cols-[56px_minmax(0,1fr)_260px]" id={exercise.id} key={exercise.id}>
            <div className="hidden size-10 items-center justify-center self-start rounded-full bg-[#12385a] text-[14px] font-black text-[#8fcfff] xl:flex">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#12385a] text-[12px] font-black text-[#8fcfff] xl:hidden">{index + 1}</span>
                <h3 className="min-w-0 text-[16px] font-black text-white">{exercise.name}</h3>
                <ExerciseStatusBadge status={exercise.logStatus} />
                {exercise.bisetGroupId ? (
                  <span className="rounded-full border border-[#1f8dff]/40 bg-[#071d32] px-2.5 py-1 text-[11px] font-black text-[#8fcfff]">
                    Bi-set {bisetLabels.get(exercise.bisetGroupId)}
                    {exercise.bisetPosition ? (exercise.bisetPosition === 1 ? "A" : "B") : ""}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[13px] leading-5 text-[#8fa3b4]">
                {workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
                {exercise.secondaryMuscleGroups.length ? ` + ${exercise.secondaryMuscleGroups.map((group) => workoutMuscleLabels[group] ?? group).join(", ")}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold text-[#a9bdcc]">
                <span className="rounded-[9px] bg-[#111f2b] px-2.5 py-1.5">{exercise.sets.length} séries</span>
                <span className="rounded-[9px] bg-[#111f2b] px-2.5 py-1.5">{exercise.prescribedRepsLabel}</span>
                <span className="rounded-[9px] bg-[#111f2b] px-2.5 py-1.5">{exercise.restSeconds}s descanso</span>
                {exercise.cadence ? <span className="rounded-[9px] bg-[#111f2b] px-2.5 py-1.5">Cadência {exercise.cadence}</span> : null}
                {exercise.technique && exercise.technique !== "normal" ? <span className="rounded-[9px] bg-[#2d250a] px-2.5 py-1.5 text-[#ffd45a]">{workoutTechniqueLabels[exercise.technique]}</span> : null}
                {exercise.bisetGroupId && exercise.bisetPosition === 2 ? <span className="rounded-[9px] bg-[#111f2b] px-2.5 py-1.5">Descanse após o par</span> : null}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center md:self-center">
              <span className="rounded-[10px] bg-[#111f2b] px-2 py-2 text-[12px] text-[#a9bdcc]">
                <b className="block text-[15px] text-white">{exercise.completedSets}/{exercise.sets.length}</b>
                feitas
              </span>
              <span className="rounded-[10px] bg-[#111f2b] px-2 py-2 text-[12px] text-[#a9bdcc]">
                <b className="block text-[15px] text-white">{exercise.prescribedLoadLabel}</b>
                carga
              </span>
              <Link className="inline-flex items-center justify-center rounded-[10px] border border-[#29465e] px-2 text-[12px] font-bold text-[#cde6f8] transition hover:border-[#1f8dff]" href={`/cliente/treino#${exercise.id}`}>
                Detalhes
              </Link>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function CardioBento({ workout }: { workout: ClientWorkoutData }) {
  const cardio = workout.cardio;
  const percent = clampPercent(cardio?.progressPercent ?? 0);

  return (
    <Panel className="overflow-hidden p-5">
      <SectionTitle
        action={<span className="rounded-full border border-[#2a5c7d] px-3 py-1 text-[12px] font-black text-[#8fcfff]">{percent}%</span>}
        eyebrow="Submódulo"
        icon={<HeartPulse className="size-5" />}
        title="Cardio"
      />
      <div className="mt-5 grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)] xl:grid-cols-1">
        <div className="mx-auto grid size-[136px] place-items-center rounded-full border border-[#245f8e] bg-[conic-gradient(#39a6ff_var(--progress),#1c3547_var(--progress))]" style={{ "--progress": `${percent}%` } as CSSProperties}>
          <div className="grid size-[108px] place-items-center rounded-full bg-[#07141d] text-center">
            <span>
              <b className="block text-[30px] font-black text-white">{percent}%</b>
              <span className="text-[12px] font-bold text-[#8fa3b4]">semana</span>
            </span>
          </div>
        </div>
        <div className="grid content-center gap-3">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#8fa3b4]">
              {cardio ? cardio.planTitle : "Sem plano ativo"}
            </p>
            <p className="mt-1 text-[28px] font-black text-white">
              {cardio ? `${cardio.completedMinutes}/${cardio.targetMinutes} min` : "0/0 min"}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#223443]">
            <div className="h-full rounded-full bg-[#39a6ff]" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-[13px] leading-5 text-[#9fb1c0]">
            {cardio
              ? `${cardio.activityLabel} · ${cardio.targetZoneLabel} · ${cardio.completedKcal} kcal registradas nesta semana.`
              : "Quando o profissional publicar um plano de cardio, ele aparece aqui junto da rotina de treino."}
          </p>
          {cardio?.latestSessionLabel ? <p className="text-[12px] font-semibold text-[#74c5ff]">Último registro: {cardio.latestSessionLabel}</p> : null}
        </div>
      </div>
    </Panel>
  );
}

function WeeklySummary({ workout }: { workout: ClientWorkoutData }) {
  return (
    <Panel className="p-5">
      <SectionTitle eyebrow="Semana" icon={<LineChart className="size-5" />} title="Resumo do treino" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniMetric icon={<Clock className="size-5" />} label="Minutos" value={`${workout.summary.completedMinutes}/${workout.summary.targetMinutes}`} />
        <MiniMetric accent="amber" icon={<Flame className="size-5" />} label="Tonelagem" value={`${formatNumber(workout.summary.totalVolumeKg)} kg`} />
        <MiniMetric accent="green" icon={<Medal className="size-5" />} label="Melhor carga" value={`${formatNumber(workout.summary.bestLoadKg)} kg`} />
        <MiniMetric icon={<CheckCircle2 className="size-5" />} label="Sessões" value={`${workout.summary.completedSessions}`} />
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[12px] text-[#9fb1c0]">
          <span>Meta semanal</span>
          <span>{workout.summary.completionPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#223443]">
          <div className="h-full rounded-full bg-[#1f8dff]" style={{ width: `${workout.summary.completionPercent}%` }} />
        </div>
      </div>
    </Panel>
  );
}

function ProgramSummary({ session, workout }: { session: ClientWorkoutSession; workout: ClientWorkoutData }) {
  const muscleLabels = session.muscleHeat.slice(0, 4).map((item) => workoutMuscleLabels[item.group] ?? item.group);

  return (
    <Panel className="p-5">
      <SectionTitle eyebrow="Programa" icon={<Target className="size-5" />} title="Resumo do treino" />
      <dl className="mt-5 divide-y divide-[#203343] rounded-[14px] border border-[#223646] bg-[#091722]/70">
        {[
          ["Grupos musculares", muscleLabels.length ? muscleLabels.join(", ") : session.trainingLabel],
          ["Exercícios", `${session.exercises.length}`],
          ["Séries prescritas", `${session.totalSets}`],
          ["Frequência", `${session.frequencyPerWeek}x por semana`],
          ["Objetivo", workout.client.objectiveLabel],
        ].map(([label, value]) => (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-3 px-4 py-3 text-[13px]" key={label}>
            <dt className="text-[#8fa3b4]">{label}</dt>
            <dd className="text-right font-bold text-[#dce9f4]">{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function HistoryCard({ item }: { item: ClientWorkoutHistoryItem }) {
  const [open, setOpen] = useState(false);
  const statusClass = {
    completed: "border-[#2ba86c] bg-[#082916] text-[#73eba3]",
    partial: "border-[#d1a329] bg-[#2d250a] text-[#ffd45a]",
    planned: "border-[#386077] bg-[#0f2232] text-[#9fc8e4]",
    skipped: "border-[#ef6868] bg-[#341117] text-[#ff9a9a]",
  }[item.status];

  return (
    <article className="rounded-[14px] border border-[#223646] bg-[#0c1721]/85 p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-[#8fa3b4]">{item.dateLabel}</span>
          <span className="mt-1 block truncate text-[16px] font-bold text-white">{item.sessionTitle}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-bold", statusClass)}>{item.statusLabel}</span>
          <ChevronDown className={cn("size-4 text-[#8fa3b4] transition", open && "rotate-180")} />
        </span>
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-[#9fb1c0] sm:grid-cols-4">
        <span><b className="block text-[15px] text-white">{item.durationMinutes} min</b>duração</span>
        <span><b className="block text-[15px] text-white">{formatNumber(item.totalVolumeKg)} kg</b>volume</span>
        <span><b className="block text-[15px] text-white">{item.setsDone}</b>séries</span>
        <span><b className="block text-[15px] text-white">{formatNumber(item.bestLoadKg)} kg</b>melhor carga</span>
      </div>
      {open ? (
        <div className="mt-4 rounded-[10px] border border-[#243746] bg-[#08141d] p-3 text-[13px] text-[#a9bdcc]">
          {item.exercisesDone} exercícios concluídos. {item.detailLabel}. Histórico pronto para comparação com os próximos treinos.
        </div>
      ) : null}
    </article>
  );
}

function HistoryPanel({ history }: { history: ClientWorkoutHistoryItem[] }) {
  return (
    <Panel className="p-5">
      <SectionTitle eyebrow="Últimos registros" icon={<History className="size-5" />} title="Histórico de treinos" />
      <div className="mt-5 space-y-3">
        {history.length ? history.map((item) => <HistoryCard item={item} key={item.id} />) : (
          <div className="rounded-[12px] border border-[#223646] bg-[#0c1721]/85 p-5 text-[14px] text-[#9fb1c0]">
            Nenhum treino executado ainda. Inicie o treino do dia para criar seu primeiro registro.
          </div>
        )}
      </div>
    </Panel>
  );
}

function GuidancePanel({ workout }: { workout: ClientWorkoutData }) {
  return (
    <Panel className="p-5">
      <SectionTitle eyebrow="Orientações" icon={<BadgeCheck className="size-5" />} title="Do profissional" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[14px] border border-[#223646] bg-[#0b1721]/82 p-4">
          <Zap className="size-5 text-[#ffd45a]" />
          <h3 className="mt-3 text-[15px] font-black text-white">Técnica primeiro</h3>
          <p className="mt-2 text-[13px] leading-5 text-[#9fb1c0]">Priorize amplitude e controle antes de subir carga.</p>
        </div>
        <div className="rounded-[14px] border border-[#223646] bg-[#0b1721]/82 p-4">
          <Timer className="size-5 text-[#74c5ff]" />
          <h3 className="mt-3 text-[15px] font-black text-white">Descanso prescrito</h3>
          <p className="mt-2 text-[13px] leading-5 text-[#9fb1c0]">Use o intervalo como parte do treino, não como pausa livre.</p>
        </div>
        <div className="rounded-[14px] border border-[#223646] bg-[#0b1721]/82 p-4">
          <Medal className="size-5 text-[#69e994]" />
          <h3 className="mt-3 text-[15px] font-black text-white">Evolução real</h3>
          <p className="mt-2 text-[13px] leading-5 text-[#9fb1c0]">
            {workout.program?.notes ?? "Registre as séries para o profissional acompanhar ajustes futuros."}
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function ClientWorkoutView({ workout }: ClientWorkoutViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(workout?.todaySession?.id ?? workout?.sessions[0]?.id ?? null);
  const selectedSession = useMemo(
    () => workout?.sessions.find((session) => session.id === selectedSessionId) ?? workout?.sessions[0] ?? null,
    [selectedSessionId, workout?.sessions],
  );

  if (!workout || !workout.program || !workout.todaySession || !selectedSession) {
    return <EmptyWorkout />;
  }

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[radial-gradient(circle_at_50%_0%,rgba(31,141,255,0.16),transparent_28%),#07141d] px-4 py-6 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <ModuleSelector />

        <header className="mt-8 flex flex-wrap items-end justify-between gap-4 sm:mt-10">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#74c5ff]">Olá, {workout.client.firstName}</p>
            <h1 className="mt-2 text-[34px] font-black tracking-[-0.01em] text-white sm:text-[44px]">Painel de Treino</h1>
            <p className="mt-2 flex items-center gap-2 text-[14px] text-[#9fb1c0]">
              <span className="size-2 rounded-full bg-[#1f8dff]" />
              {workout.client.objectiveLabel} · {workout.selectedDate.label}
            </p>
          </div>
          <div className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#213444] bg-[#101a25] px-4 text-[13px] font-semibold text-[#b6c6d3]">
            <CalendarDays className="size-4 text-[#8fcfff]" />
            {workout.program.title} · v{workout.program.version}
          </div>
        </header>

        <main className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
          <WorkoutHero
            badgeLabel={selectedSession.id === workout.todaySession.id ? "Treino do dia" : "Treino selecionado"}
            detailLabel={selectedSession.id === workout.todaySession.id ? workout.routine.nextSessionLabel : `Treino ${selectedSession.letter} · ${selectedSession.trainingLabel}`}
            session={selectedSession}
            workout={workout}
          />
          <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <SessionSelector onSelect={setSelectedSessionId} selectedId={selectedSession.id} suggestedId={workout.routine.nextSessionId} sessions={workout.sessions} />
            <CardioBento workout={workout} />
          </div>

          <div className="xl:col-span-2">
            <RoutineStrip workout={workout} />
          </div>

          <div className="grid min-w-0 items-start gap-5 xl:col-span-2 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.44fr)]">
            <ExerciseList session={selectedSession} />
            <div className="grid min-w-0 gap-5">
              <ProgramSummary session={selectedSession} workout={workout} />
              <WorkoutMuscleMap className="rounded-[18px]" exercises={selectedSession.exercises} />
              <WeeklySummary workout={workout} />
            </div>
          </div>

          <div className="grid min-w-0 items-start gap-5 xl:col-span-2 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.44fr)]">
            <HistoryPanel history={workout.history} />
            <GuidancePanel workout={workout} />
          </div>
        </main>
      </div>
    </div>
  );
}
