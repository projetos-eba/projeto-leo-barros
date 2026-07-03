"use client";

import {
  Activity,
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
  Medal,
  Play,
  Timer,
  Utensils,
  Weight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import { WorkoutMuscleMap } from "@/components/workouts/muscle-map";
import type { ClientWorkoutData, ClientWorkoutHistoryItem, ClientWorkoutSession } from "@/lib/clients/workout-metrics";
import { workoutMuscleLabels } from "@/lib/partners/client-workout-metrics";
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

function EmptyWorkout() {
  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-10 text-white sm:px-8 lg:px-12">
      <Panel className="mx-auto max-w-[920px] p-8 text-center">
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
  );
}

function ModuleSelector() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {moduleCards.map((module) => {
        const Icon = module.icon;
        const active = module.key === "treino";
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative min-h-[138px] overflow-hidden rounded-[14px] border bg-[#101a25] p-5 transition duration-300 hover:-translate-y-0.5",
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

function StatPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#223646] bg-[#0d1822]/80 p-4">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#78c6ff]">{icon}<span>{label}</span></div>
      <p className="mt-2 text-[22px] font-bold text-white">{value}</p>
    </div>
  );
}

function WorkoutHero({ session }: { session: ClientWorkoutSession }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
    <Panel className="relative overflow-hidden border-[#1f8dff]/70 p-6 shadow-[0_0_0_1px_rgba(31,141,255,0.2),0_24px_80px_rgba(31,141,255,0.16)]">
      <img alt="" className="absolute inset-y-0 right-0 hidden h-full w-[48%] object-cover opacity-60 lg:block" src="/cliente/inicio/capa-treino.png" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_42%,rgba(31,141,255,0.35),transparent_26%),linear-gradient(90deg,#091722_0%,rgba(9,23,34,0.95)_50%,rgba(9,23,34,0.55)_100%)]" />
      <div className="relative z-10 max-w-[700px]">
        <span className="rounded-[8px] bg-[#0876d8] px-3 py-1 text-[11px] font-bold uppercase text-white">Treino do dia</span>
        <p className="mt-6 text-[14px] font-medium text-[#c8d6e1]">Treino {session.letter}</p>
        <h2 className="mt-2 text-[38px] font-bold leading-tight text-white">{session.trainingLabel}</h2>
        <p className="mt-2 max-w-[520px] text-[15px] leading-6 text-[#9fb1c0]">
          {session.focusLabel}. Registre séries, carga e repetições para manter seu histórico vivo.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-4">
          <StatPill icon={<Timer className="size-4" />} label="Duração" value={`${session.durationMinutes} min`} />
          <StatPill icon={<Dumbbell className="size-4" />} label="Exercícios" value={`${session.exercises.length}`} />
          <StatPill icon={<Activity className="size-4" />} label="Séries" value={`${session.totalSets}`} />
          <StatPill icon={<Weight className="size-4" />} label="Volume" value={`${formatNumber(session.volumeKg)} kg`} />
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className="inline-flex h-12 min-w-[210px] items-center justify-center gap-2 rounded-[10px] bg-[#1f8dff] px-5 text-[14px] font-bold text-white transition hover:bg-[#43a4ff] disabled:opacity-60"
            disabled={pending}
            type="button"
            onClick={startWorkout}
          >
            <Play className="size-4 fill-white" />
            {pending ? "Abrindo treino..." : "Iniciar treino"}
          </button>
          <span className="inline-flex h-12 items-center rounded-[10px] border border-[#263949] bg-[#0d1822]/80 px-4 text-[13px] font-semibold text-[#a8bac8]">
            Status: {session.statusLabel}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function SessionSelector({ selectedId, sessions, onSelect }: { onSelect: (id: string) => void; selectedId: string | null; sessions: ClientWorkoutSession[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {sessions.map((session) => {
        const active = session.id === selectedId;
        return (
          <button
            className={cn(
              "rounded-[13px] border p-4 text-left transition hover:-translate-y-0.5",
              active ? "border-[#1f8dff] bg-[#0b2943] shadow-[0_0_0_1px_rgba(31,141,255,0.25)]" : "border-[#243746] bg-[#0d1822]/78 hover:border-[#3f5970]",
            )}
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#12385a] text-[15px] font-black text-[#8fcfff]">{session.letter}</span>
              <span className="rounded-full border border-[#2a4052] px-2 py-1 text-[11px] font-bold text-[#a9bdcc]">{session.statusLabel}</span>
            </div>
            <h3 className="mt-4 text-[17px] font-bold text-white">{session.title}</h3>
            <p className="mt-1 text-[13px] text-[#93a6b5]">{session.trainingLabel}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#223443]">
              <div className="h-full rounded-full bg-[#1f8dff]" style={{ width: `${session.completionPercent}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ExerciseList({ session }: { session: ClientWorkoutSession }) {
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-bold text-white">Exercícios do treino</h3>
          <p className="mt-1 text-[12px] text-[#8fa3b4]">Prescrição do Parceiro com execução registrada pelo Cliente.</p>
        </div>
        <span className="rounded-full bg-[#12385a] px-3 py-1 text-[12px] font-bold text-[#8fcfff]">{session.completedSets} de {session.totalSets} séries</span>
      </div>
      <div className="mt-4 space-y-3">
        {session.exercises.map((exercise, index) => (
          <article className="grid gap-4 rounded-[12px] border border-[#223646] bg-[#0c1721]/85 p-4 lg:grid-cols-[minmax(0,1fr)_220px_150px]" key={exercise.id}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-[9px] bg-[#0f2d47] text-[13px] font-bold text-[#8fcfff]">{index + 1}</span>
                <h4 className="text-[16px] font-bold text-white">{exercise.name}</h4>
                <span className="rounded-full border border-[#29465e] px-2 py-1 text-[11px] font-bold text-[#a8bac8]">{exercise.statusLabel}</span>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-[#8fa3b4]">
                {workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
                {exercise.secondaryMuscleGroups.length ? ` + ${exercise.secondaryMuscleGroups.map((group) => workoutMuscleLabels[group] ?? group).join(", ")}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <span className="rounded-[10px] bg-[#111f2b] px-2 py-2 text-[12px] text-[#a9bdcc]"><b className="block text-[15px] text-white">{exercise.sets.length}</b>séries</span>
              <span className="rounded-[10px] bg-[#111f2b] px-2 py-2 text-[12px] text-[#a9bdcc]"><b className="block text-[15px] text-white">{exercise.prescribedRepsLabel}</b>reps</span>
              <span className="rounded-[10px] bg-[#111f2b] px-2 py-2 text-[12px] text-[#a9bdcc]"><b className="block text-[15px] text-white">{exercise.restSeconds}s</b>descanso</span>
            </div>
            <Link className="inline-flex h-10 items-center justify-center gap-2 self-center rounded-[9px] border border-[#29465e] px-3 text-[13px] font-bold text-[#cde6f8] transition hover:border-[#1f8dff]" href={`/cliente/treino#${exercise.id}`}>
              Ver detalhes <ChevronRight className="size-4" />
            </Link>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function WeeklySummary({ workout }: { workout: ClientWorkoutData }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-bold text-white">Resumo do treino</h3>
          <p className="mt-1 text-[12px] text-[#8fa3b4]">Sua semana de execução registrada.</p>
        </div>
        <LineChart className="size-6 text-[#64bbff]" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatPill icon={<Clock className="size-4" />} label="Minutos" value={`${workout.summary.completedMinutes}/${workout.summary.targetMinutes}`} />
        <StatPill icon={<Flame className="size-4" />} label="Tonelagem" value={`${formatNumber(workout.summary.totalVolumeKg)} kg`} />
        <StatPill icon={<Medal className="size-4" />} label="Melhor carga" value={`${formatNumber(workout.summary.bestLoadKg)} kg`} />
        <StatPill icon={<CheckCircle2 className="size-4" />} label="Sessões" value={`${workout.summary.completedSessions}`} />
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

function HistoryCard({ item }: { item: ClientWorkoutHistoryItem }) {
  const [open, setOpen] = useState(false);
  const statusClass = {
    completed: "border-[#2ba86c] text-[#73eba3]",
    partial: "border-[#d1a329] text-[#ffd45a]",
    planned: "border-[#386077] text-[#9fc8e4]",
    skipped: "border-[#ef6868] text-[#ff9a9a]",
  }[item.status];

  return (
    <article className="rounded-[12px] border border-[#223646] bg-[#0c1721]/85 p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" type="button" onClick={() => setOpen((value) => !value)}>
        <span>
          <span className="block text-[13px] font-semibold text-[#8fa3b4]">{item.dateLabel}</span>
          <span className="mt-1 block text-[16px] font-bold text-white">{item.sessionTitle}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className={cn("rounded-full border px-3 py-1 text-[11px] font-bold", statusClass)}>{item.statusLabel}</span>
          <ChevronDown className={cn("size-4 text-[#8fa3b4] transition", open && "rotate-180")} />
        </span>
      </button>
      <div className="mt-4 grid gap-2 text-[12px] text-[#9fb1c0] sm:grid-cols-4">
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
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#12385a] text-[#8fcfff]"><History className="size-5" /></span>
        <div>
          <h3 className="text-[18px] font-bold text-white">Histórico de treinos</h3>
          <p className="mt-1 text-[12px] text-[#8fa3b4]">Últimas execuções, cargas e volume registrado.</p>
        </div>
      </div>
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

export function ClientWorkoutView({ workout }: ClientWorkoutViewProps) {
  const [selectedSessionId, setSelectedSessionId] = useState(workout?.todaySession?.id ?? workout?.sessions[0]?.id ?? null);
  const selectedSession = useMemo(() => (
    workout?.sessions.find((session) => session.id === selectedSessionId) ?? workout?.sessions[0] ?? null
  ), [selectedSessionId, workout?.sessions]);

  if (!workout || !workout.program || !workout.todaySession || !selectedSession) {
    return <EmptyWorkout />;
  }

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <ModuleSelector />

        <header className="mt-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black tracking-[-0.01em] text-white">Painel de Treino</h1>
            <p className="mt-2 flex items-center gap-2 text-[14px] text-[#9fb1c0]">
              <span className="size-2 rounded-full bg-[#1f8dff]" />
              Acompanhe seu progresso físico, {workout.client.firstName}.
            </p>
          </div>
          <div className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#213444] bg-[#101a25] px-4 text-[13px] font-semibold text-[#b6c6d3]">
            <CalendarDays className="size-4 text-[#8fcfff]" />
            {workout.selectedDate.label}
          </div>
        </header>

        <main className="mt-6 grid gap-5">
          <WorkoutHero session={workout.todaySession} />
          <SessionSelector onSelect={setSelectedSessionId} selectedId={selectedSession.id} sessions={workout.sessions} />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <ExerciseList session={selectedSession} />
            <div className="grid gap-5">
              <WorkoutMuscleMap exercises={selectedSession.exercises} />
              <WeeklySummary workout={workout} />
            </div>
          </div>
          <HistoryPanel history={workout.history} />
        </main>
      </div>
    </div>
  );
}
