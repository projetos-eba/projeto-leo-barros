"use client";

import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  MoreVertical,
  PauseCircle,
  RotateCcw,
  SkipForward,
  Timer,
  Weight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import type { ClientWorkoutExecution } from "@/lib/clients/workout-metrics";
import { workoutMuscleLabels } from "@/lib/partners/client-workout-metrics";
import { cn } from "@/lib/utils";

import { finishClientWorkoutSession, logClientWorkoutSet, skipClientWorkoutExercise } from "../../actions";

type ClientWorkoutExecutionViewProps = {
  execution: ClientWorkoutExecution;
};

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function prescribedRange(values: Array<number | null>) {
  const clean = values.filter((value): value is number => value !== null);
  if (!clean.length) return "Livre";
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  return min === max ? `${min}` : `${min} - ${max}`;
}

export function ClientWorkoutExecutionView({ execution }: ClientWorkoutExecutionViewProps) {
  const router = useRouter();
  const initialIndex = Math.max(0, execution.exercises.findIndex((exercise) => exercise.id === execution.currentExercise?.id));
  const [exerciseIndex, setExerciseIndex] = useState(initialIndex);
  const [restSeconds, setRestSeconds] = useState(0);
  const [pending, startTransition] = useTransition();
  const exercise = execution.exercises[exerciseIndex] ?? execution.exercises[0] ?? null;
  const exerciseSets = useMemo(() => exercise?.sets.map((set) => ({
    ...set,
    log: exercise.setLogs.find((item) => item.prescribedSetId === set.id) ?? null,
  })) ?? [], [exercise]);
  const nextSet = exerciseSets.find((set) => set.log?.status !== "completed") ?? null;
  const completedSets = exerciseSets.filter((set) => set.log?.status === "completed").length;
  const progressPercent = execution.exercises.length > 0 ? Math.round(((exerciseIndex + completedSets / Math.max(1, exerciseSets.length)) / execution.exercises.length) * 100) : 0;

  useEffect(() => {
    if (restSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setRestSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restSeconds]);

  if (!exercise) {
    return (
      <div className="min-h-[calc(100vh-81px)] bg-[#0b1720] px-5 py-10 text-white">
        <div className="mx-auto max-w-[780px] rounded-[14px] border border-[#213444] bg-[#101a25] p-8 text-center">
          <h1 className="text-[28px] font-bold">Treino sem exercícios</h1>
          <Link className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-[#1f8dff] px-5 text-[14px] font-bold" href="/cliente/treino">
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  function submitSet(formData: FormData) {
    startTransition(async () => {
      const result = await logClientWorkoutSet(formData);
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível registrar a série.");
        return;
      }
      setRestSeconds(exercise.restSeconds);
      router.refresh();
    });
  }

  function skipExercise() {
    startTransition(async () => {
      const result = await skipClientWorkoutExercise(execution.clientSessionId, exercise.id);
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível pular o exercício.");
        return;
      }
      setExerciseIndex((index) => Math.min(index + 1, execution.exercises.length - 1));
      router.refresh();
    });
  }

  function finishWorkout() {
    startTransition(async () => {
      const result = await finishClientWorkoutSession(execution.clientSessionId);
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível finalizar o treino.");
        return;
      }
      router.push("/cliente/treino");
    });
  }

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[radial-gradient(circle_at_50%_0%,rgba(31,141,255,0.18),transparent_28%),#06111a] px-4 py-5 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1320px]">
        <header className="flex items-center justify-between gap-4">
          <Link aria-label="Voltar para o painel de treino" className="flex size-12 items-center justify-center rounded-[12px] border border-[#213444] bg-[#0d1822] text-[#dce9f4] transition hover:border-[#1f8dff]" href="/cliente/treino">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#78c6ff]">Exercício</p>
            <h1 className="text-[20px] font-bold text-white sm:text-[24px]">{execution.prescribedSession.title}</h1>
          </div>
          <div className="flex gap-2">
            <button aria-label="Salvar exercício" className="flex size-12 items-center justify-center rounded-[12px] border border-[#213444] bg-[#0d1822] text-[#dce9f4]" type="button">
              <Bookmark className="size-5" />
            </button>
            <button aria-label="Mais opções" className="flex size-12 items-center justify-center rounded-[12px] border border-[#213444] bg-[#0d1822] text-[#dce9f4]" type="button">
              <MoreVertical className="size-5" />
            </button>
          </div>
        </header>

        <main className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <section className="relative overflow-hidden rounded-[22px] border border-[#16334a] bg-[#07141d] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.36)] sm:p-8">
            <img alt="" className="absolute inset-x-0 top-0 h-[46%] w-full object-cover opacity-45" src="/cliente/inicio/capa-treino.png" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,26,0.08)_0%,rgba(6,17,26,0.78)_42%,#06111a_100%)]" />
            <div className="relative z-10 pt-[210px] sm:pt-[280px] xl:pt-[360px]">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-[10px] border border-[#1f8dff]/40 bg-[#071d32]/85 px-3 py-2 text-[13px] font-bold text-[#9ed6ff]">{workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}</span>
                {exercise.secondaryMuscleGroups.slice(0, 3).map((group) => (
                  <span className="rounded-[10px] border border-[#815cff]/40 bg-[#1c1430]/80 px-3 py-2 text-[13px] font-bold text-[#c9b6ff]" key={group}>{workoutMuscleLabels[group] ?? group}</span>
                ))}
              </div>
              <h2 className="mt-5 max-w-[780px] text-[42px] font-black leading-[1.02] tracking-[-0.01em] text-white sm:text-[64px]">{exercise.name}</h2>
              <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-[#a9bdcc]">{exercise.notes ?? "Execute com técnica controlada, registre a carga real e respeite o descanso prescrito."}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                <div className="rounded-[14px] border border-[#223646] bg-[#0d1822]/80 p-4 text-center"><Dumbbell className="mx-auto size-5 text-[#1f8dff]" /><b className="mt-2 block text-[25px]">{exercise.sets.length}</b><span className="text-[13px] text-[#a8bac8]">séries</span></div>
                <div className="rounded-[14px] border border-[#223646] bg-[#0d1822]/80 p-4 text-center"><RotateCcw className="mx-auto size-5 text-[#1f8dff]" /><b className="mt-2 block text-[25px]">{prescribedRange(exercise.sets.map((set) => set.reps))}</b><span className="text-[13px] text-[#a8bac8]">repetições</span></div>
                <div className="rounded-[14px] border border-[#223646] bg-[#0d1822]/80 p-4 text-center"><Weight className="mx-auto size-5 text-[#1f8dff]" /><b className="mt-2 block text-[25px]">{prescribedRange(exercise.sets.map((set) => set.loadKg))}</b><span className="text-[13px] text-[#a8bac8]">kg prescritos</span></div>
                <div className="rounded-[14px] border border-[#223646] bg-[#0d1822]/80 p-4 text-center"><Clock className="mx-auto size-5 text-[#1f8dff]" /><b className="mt-2 block text-[25px]">{exercise.restSeconds}s</b><span className="text-[13px] text-[#a8bac8]">descanso</span></div>
              </div>
            </div>
          </section>

          <aside className="grid content-start gap-5">
            <section className="rounded-[18px] border border-[#213444] bg-[#101a25]/94 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[19px] font-bold text-white">Progresso do exercício</h3>
                  <p className="mt-1 text-[13px] text-[#8fa3b4]">{completedSets} de {exerciseSets.length} séries concluídas</p>
                </div>
                <span className="text-[13px] font-bold text-[#78c6ff]">{progressPercent}% do treino</span>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {exerciseSets.map((set) => {
                  const completed = set.log?.status === "completed";
                  const active = nextSet?.id === set.id;
                  return (
                    <span
                      className={cn(
                        "flex size-16 items-center justify-center rounded-full border text-[22px] font-bold transition",
                        completed ? "border-[#1f8dff] bg-[#0d57d8] text-white" : active ? "border-[#1f8dff] bg-[#071d32] text-white shadow-[0_0_0_6px_rgba(31,141,255,0.08)]" : "border-[#3a4857] bg-[#101a25] text-[#8999a7]",
                      )}
                      key={set.id}
                    >
                      {completed ? <Check className="size-7" /> : set.setNumber}
                    </span>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#213444] bg-[#101a25]/94 p-5">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full border border-[#1f8dff]/45 bg-[#071d32] text-[#1f8dff]">
                  <Timer className="size-8" />
                </div>
                <div>
                  <p className="text-[14px] text-[#9fb1c0]">Descanso</p>
                  <p className="text-[42px] font-black leading-none text-white">{formatTime(restSeconds)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#213444] bg-[#101a25]/94 p-5">
              <h3 className="text-[18px] font-bold text-white">Registrar série</h3>
              {nextSet ? (
                <form action={submitSet} className="mt-4 grid gap-4">
                  <input name="clientSessionId" type="hidden" value={execution.clientSessionId} />
                  <input name="setId" type="hidden" value={nextSet.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-2 text-[12px] font-semibold uppercase text-[#8fa3b4]">
                      Carga usada
                      <input className="h-12 rounded-[10px] border border-[#2a4052] bg-[#07141d] px-4 text-[16px] font-bold text-white outline-none focus:border-[#1f8dff]" defaultValue={nextSet.log?.loadKg ?? nextSet.loadKg ?? ""} min="0" name="loadKg" step="0.5" type="number" />
                    </label>
                    <label className="grid gap-2 text-[12px] font-semibold uppercase text-[#8fa3b4]">
                      Repetições
                      <input className="h-12 rounded-[10px] border border-[#2a4052] bg-[#07141d] px-4 text-[16px] font-bold text-white outline-none focus:border-[#1f8dff]" defaultValue={nextSet.log?.reps ?? nextSet.reps ?? ""} min="1" name="reps" step="1" type="number" />
                    </label>
                  </div>
                  <button className="inline-flex h-13 items-center justify-center gap-2 rounded-[12px] bg-[#0d74ff] px-5 py-4 text-[16px] font-bold text-white transition hover:bg-[#2290ff] disabled:opacity-60" disabled={pending} type="submit">
                    <CheckCircle2 className="size-5" />
                    Marcar série como concluída
                  </button>
                </form>
              ) : (
                <div className="mt-4 rounded-[12px] border border-[#1f8dff]/35 bg-[#071d32]/70 p-4 text-[14px] text-[#cbe8ff]">
                  Todas as séries deste exercício foram registradas.
                </div>
              )}
            </section>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] border border-[#1f8dff] px-4 text-[15px] font-bold text-[#7cc8ff] transition hover:bg-[#09233a] disabled:opacity-60"
                disabled={exerciseIndex >= execution.exercises.length - 1}
                type="button"
                onClick={() => setExerciseIndex((index) => Math.min(index + 1, execution.exercises.length - 1))}
              >
                Próximo exercício <ChevronRight className="size-5" />
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] border border-[#385166] px-4 text-[15px] font-bold text-[#c7d8e5] transition hover:border-[#ffb74d] disabled:opacity-60"
                disabled={pending}
                type="button"
                onClick={skipExercise}
              >
                <SkipForward className="size-5" />
                Pular exercício
              </button>
            </div>
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-[#1f8dff] px-4 text-[15px] font-bold text-white transition hover:bg-[#43a4ff] disabled:opacity-60" disabled={pending} type="button" onClick={finishWorkout}>
              <PauseCircle className="size-5" />
              Finalizar treino
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}
