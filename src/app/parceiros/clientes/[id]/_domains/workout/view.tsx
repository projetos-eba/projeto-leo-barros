"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Dumbbell,
  EllipsisVertical,
  Flame,
  Layers3,
  Library,
  ListChecks,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  Trash2,
  Unlink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { indexCatalog, searchCatalog } from "@/lib/partners/catalog-search";
import { WorkoutMusclePreview } from "@/components/workouts/workout-muscle-preview";
import type {
  PartnerClientWorkoutData,
  PartnerClientWorkoutExercise,
  PartnerWorkoutExecutionSummary,
  PartnerClientWorkoutSet,
  PartnerClientWorkoutSession,
  WorkoutIntensity,
  WorkoutObjective,
  WorkoutTechnique,
} from "@/lib/partners/client-profile/workout";
import {
  workoutMuscleHeat,
  workoutMuscleLabels,
  workoutTechniqueLabels,
  workoutTrainingTypeLabel,
} from "@/lib/partners/client-profile/workout";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";
import { cn } from "@/lib/utils";

import {
  addClientWorkoutExercise,
  addClientWorkoutSet,
  applyClientWorkoutTemplate,
  combineClientWorkoutBiset,
  createClientWorkoutProgram,
  createClientWorkoutSession,
  deleteClientWorkoutSession,
  publishClientWorkoutProgram,
  removeClientWorkoutExercise,
  reorderClientWorkoutExercises,
  saveClientWorkoutNotes,
  saveClientWorkoutTemplate,
  sendClientWorkoutProgram,
  uncombineClientWorkoutBiset,
  updateClientWorkoutExercise,
  updateClientWorkoutSession,
  updateClientWorkoutSet,
} from "../../_actions/workout";
import { PartnerClientProfileHeader } from "../../partner-client-profile-header";

type PartnerClientWorkoutViewProps = {
  overview: PartnerClientOverviewData;
  workout: PartnerClientWorkoutData;
};

const panelClass = "min-w-0 rounded-[8px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]";
const inputClass = "h-9 rounded-[7px] border border-[#2b3b49] bg-[#091722] px-2 text-[12px] text-white outline-none focus:border-[#3b97e3]";
const setSlotNumbers = [1, 2, 3, 4, 5] as const;
const workoutTypeOptions = [
  "Peito e Tríceps",
  "Costas e Bíceps",
  "Pernas / Inferiores",
  "Ombros e Braços",
  "Full body",
  "Push",
  "Pull",
  "Lower",
  "Core e mobilidade",
  "Glúteos e Posterior",
  "Quadríceps e Panturrilhas",
] as const;

type ProgramSessionDraft = {
  durationMinutes: number;
  frequencyPerWeek: number;
  muscles: string;
  objective: WorkoutObjective;
  title: string;
};

const workoutProgramModels = [
  {
    description: "Divisão clássica para hipertrofia, com grupos musculares fáceis de alternar na semana.",
    id: "abc_hipertrofia",
    sessions: [
      { durationMinutes: 60, frequencyPerWeek: 1, muscles: "Peito, ombros e tríceps", objective: "hipertrofia", title: "Treino A - Push" },
      { durationMinutes: 60, frequencyPerWeek: 1, muscles: "Costas, bíceps e posterior", objective: "hipertrofia", title: "Treino B - Pull" },
      { durationMinutes: 65, frequencyPerWeek: 1, muscles: "Quadríceps, glúteos e panturrilhas", objective: "hipertrofia", title: "Treino C - Lower" },
    ],
    title: "Programa ABC Hipertrofia",
  },
  {
    description: "Alterna membros superiores e inferiores para clientes com rotina de quatro sessões semanais.",
    id: "upper_lower",
    sessions: [
      { durationMinutes: 60, frequencyPerWeek: 2, muscles: "Peito, costas, ombros e braços", objective: "forca", title: "Treino Superior" },
      { durationMinutes: 60, frequencyPerWeek: 2, muscles: "Quadríceps, posterior, glúteos e panturrilhas", objective: "forca", title: "Treino Inferior" },
    ],
    title: "Programa Upper / Lower",
  },
  {
    description: "Estrutura enxuta para adaptação, retorno ou clientes com baixa disponibilidade semanal.",
    id: "full_body",
    sessions: [
      { durationMinutes: 50, frequencyPerWeek: 3, muscles: "Corpo todo, estabilidade e padrões básicos", objective: "resistencia", title: "Treino Full body" },
    ],
    title: "Programa Full body",
  },
] satisfies Array<{ description: string; id: string; sessions: ProgramSessionDraft[]; title: string }>;

function modelSessions(modelId: string): ProgramSessionDraft[] {
  const model = workoutProgramModels.find((item) => item.id === modelId) ?? workoutProgramModels[0];
  return model.sessions.map((session) => ({ ...session }));
}

const intensityMeta: Record<WorkoutIntensity, { Icon: typeof Dumbbell; className: string; label: string }> = {
  maximum: { Icon: Flame, className: "bg-[#32171b] text-[#ff7b88]", label: "Carga máxima" },
  moderate: { Icon: Dumbbell, className: "bg-[#0e2c1e] text-[#62d98b]", label: "Carga moderada" },
  warmup: { Icon: Sparkles, className: "bg-[#302813] text-[#f2c84b]", label: "Aquecimento" },
};

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function sessionDisplayName(session: PartnerClientWorkoutSession) {
  return /^treino\s+[a-z]$/i.test(session.title.trim())
    ? session.title
    : `Treino ${String.fromCharCode(65 + session.sortOrder)}`;
}

function Button({ children, disabled, onClick, tone = "ghost", type = "button" }: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "ghost" | "primary";
  type?: "button" | "submit";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" ? "bg-[#3b97e3] text-white hover:bg-[#55a8eb]" : "border border-[#303746] bg-[#101923] text-[#d8e5ee] hover:border-[#3b97e3]",
      )}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SessionCard({
  active,
  canDelete,
  menuOpen,
  onClick,
  onDelete,
  onEdit,
  onToggleMenu,
  pending,
  session,
}: {
  active: boolean;
  canDelete: boolean;
  menuOpen: boolean;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleMenu: () => void;
  pending: boolean;
  session: PartnerClientWorkoutSession;
}) {
  const trainingType = workoutTrainingTypeLabel(session);
  return (
    <article
      className={cn(
        "relative h-[142px] min-w-[245px] overflow-hidden rounded-[8px] border p-4 text-left transition",
        active ? "border-[#3b97e3] bg-[#10283a]" : "border-[#303746] bg-[#101923]/70 hover:border-[#526779]",
      )}
    >
      <button className="absolute inset-0 text-left" type="button" onClick={onClick}>
        <span className="sr-only">Selecionar {sessionDisplayName(session)}</span>
      </button>
      <div className="pointer-events-none relative z-10 pr-[104px]">
        <h3 className="text-[17px] font-bold text-white">{sessionDisplayName(session)}</h3>
        <p className="mt-3 text-[11px] uppercase text-[#728697]">Tipo de treino</p>
        <p className="line-clamp-2 text-[13px] font-semibold leading-4 text-white">{trainingType}</p>
        <p className="mt-3 text-[11px] uppercase text-[#728697]">Frequência</p>
        <p className="text-[13px] font-semibold text-white">{session.frequencyPerWeek}x/semana</p>
      </div>
      <WorkoutMusclePreview className="pointer-events-none absolute bottom-2 right-3 z-10 max-w-[92px]" exercises={session.exercises} />
      <button
        aria-expanded={menuOpen}
        aria-label={`Abrir ações de ${sessionDisplayName(session)}`}
        className="absolute right-3 top-3 z-20 inline-flex size-8 items-center justify-center rounded-[7px] text-[#8b92a3] hover:bg-[#172433] hover:text-white"
        disabled={pending}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleMenu();
        }}
      >
        <EllipsisVertical className="size-4" />
      </button>
      {menuOpen ? (
        <div className="absolute right-3 top-11 z-30 grid w-[160px] gap-1 rounded-[8px] border border-[#303746] bg-[#0b1720] p-1 shadow-xl">
          <button className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[12px] font-semibold text-[#d8e5ee] hover:bg-[#10283a]" type="button" onClick={onEdit}>
            <Pencil className="size-3.5" /> Editar divisão
          </button>
          <button
            className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-left text-[12px] font-semibold text-[#ff8a96] hover:bg-[#32151b] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canDelete}
            type="button"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" /> Excluir divisão
          </button>
        </div>
      ) : null}
    </article>
  );
}

function SetSlot({ exerciseId, exerciseName, patientId, pending, runAction, set, setNumber }: {
  exerciseId: string;
  exerciseName: string;
  patientId: string;
  pending: boolean;
  runAction: (action: () => Promise<{ error?: string; ok: boolean }>) => void;
  set: PartnerClientWorkoutSet | undefined;
  setNumber: number;
}) {
  const [reps, setReps] = useState(set?.reps?.toString() ?? "");
  const [load, setLoad] = useState(set?.loadKg?.toString() ?? "");
  const [intensity, setIntensity] = useState<WorkoutIntensity>(set?.intensity ?? (setNumber === 1 ? "warmup" : "moderate"));

  useEffect(() => {
    setReps(set?.reps?.toString() ?? "");
    setLoad(set?.loadKg?.toString() ?? "");
    setIntensity(set?.intensity ?? (setNumber === 1 ? "warmup" : "moderate"));
  }, [set, setNumber]);

  if (!set) {
    return (
      <button
        aria-label={`Criar série ${setNumber} para ${exerciseName}`}
        className={cn(
          "grid min-h-[86px] content-center gap-1 border-l border-[#273847] px-2 py-2 text-center transition hover:bg-[#10283a]",
          setNumber > 3 ? "opacity-40" : "opacity-60",
        )}
        disabled={pending}
        type="button"
        onClick={() => runAction(() => addClientWorkoutSet({ exerciseId, patientId }))}
      >
        <span className="mx-auto inline-flex size-6 items-center justify-center rounded-[6px] border border-dashed border-[#3b5870] text-[#8fcfff]"><Plus className="size-3.5" /></span>
        <span className="text-[10px] font-semibold text-[#8fcfff]">Série {setNumber}</span>
        <span className="text-[9px] text-[#718394]">reps/carga</span>
      </button>
    );
  }

  const activeSet = set;

  function persist(nextIntensity = intensity) {
    runAction(() => updateClientWorkoutSet({
      intensity: nextIntensity,
      loadKg: load === "" ? null : Number(load.replace(",", ".")),
      patientId,
      reps: reps === "" ? null : Number(reps),
      setId: activeSet.id,
    }));
  }

  const meta = intensityMeta[intensity];
  const Icon = meta.Icon;
  return (
    <div className="grid min-h-[86px] content-center gap-1 border-l border-[#273847] px-2 py-2">
      <button
        aria-label={`Intensidade da série ${activeSet.setNumber}`}
        className={cn("mx-auto inline-flex size-6 items-center justify-center rounded-[6px]", meta.className)}
        disabled={pending}
        title={meta.label}
        type="button"
        onClick={() => {
          const next = intensity === "warmup" ? "moderate" : intensity === "moderate" ? "maximum" : "warmup";
          setIntensity(next);
          persist(next);
        }}
      >
        <Icon className="size-3.5" />
      </button>
      <input aria-label={`Repetições da série ${activeSet.setNumber}`} className="h-7 min-w-0 rounded-[5px] border border-[#263846] bg-[#081520] px-1 text-center text-[12px] text-white outline-none focus:border-[#3b97e3]" inputMode="numeric" placeholder="Rep" value={reps} onBlur={() => persist()} onChange={(event) => setReps(event.target.value)} />
      <input aria-label={`Carga da série ${activeSet.setNumber}`} className="h-7 min-w-0 rounded-[5px] border border-[#263846] bg-[#081520] px-1 text-center text-[12px] text-white outline-none focus:border-[#3b97e3]" inputMode="decimal" placeholder="Kg" value={load} onBlur={() => persist()} onChange={(event) => setLoad(event.target.value)} />
    </div>
  );
}

function ExerciseRow({
  canMoveDown,
  canMoveUp,
  exercise,
  onMoveDown,
  onMoveUp,
  onSelect,
  patientId,
  pending,
  runAction,
  selected,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  exercise: PartnerClientWorkoutExercise;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onSelect: () => void;
  patientId: string;
  pending: boolean;
  runAction: (action: () => Promise<{ error?: string; ok: boolean }>) => void;
  selected: boolean;
}) {
  const [rest, setRest] = useState(exercise.restSeconds.toString());
  const [cadence, setCadence] = useState(exercise.cadence ?? "");
  const [technique, setTechnique] = useState<WorkoutTechnique>(exercise.technique);
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const setsByNumber = useMemo(() => new Map(exercise.sets.map((set) => [set.setNumber, set])), [exercise.sets]);

  function persistMeta(nextTechnique = technique) {
    if (nextTechnique === "biset") return;
    runAction(() => updateClientWorkoutExercise({
      cadence: cadence || null,
      exerciseId: exercise.id,
      notes: notes || null,
      patientId,
      restSeconds: Number(rest) || 0,
      technique: nextTechnique,
      variationName: exercise.variationName,
    }));
  }

  return (
    <article
      className={cn(
        "relative grid min-w-[1028px] grid-cols-[232px_repeat(5,72px)_86px_112px_minmax(140px,1fr)_96px] border-b border-[#273847] bg-[#0b1822]/80 last:border-b-0",
        exercise.bisetGroupId && "bg-[#0d1d2a]",
        selected && "ring-1 ring-inset ring-[#3b97e3]",
      )}
    >
      {exercise.bisetPosition === 1 ? <span className="pointer-events-none absolute bottom-0 left-[17px] top-1/2 z-20 w-0.5 bg-[#3b97e3]" /> : null}
      {exercise.bisetPosition === 2 ? <span className="pointer-events-none absolute bottom-1/2 left-[17px] top-0 z-20 w-0.5 bg-[#3b97e3]" /> : null}
      {exercise.bisetPosition ? <span className="absolute left-2 top-1/2 z-30 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#3b97e3] text-[10px] font-bold text-white">{exercise.bisetPosition}</span> : null}
      <button
        aria-label={`Selecionar ${exercise.name} para Bi-set`}
        aria-pressed={selected}
        className="flex min-w-0 items-center gap-3 px-4 py-3 pl-9 text-left transition hover:bg-[#10283a]"
        type="button"
        onClick={onSelect}
      >
        {exercise.thumbnailUrl ? <img alt="" className="size-10 rounded-[7px] object-cover" src={exercise.thumbnailUrl} /> : <span className="flex size-10 items-center justify-center rounded-[7px] bg-[#0a2c48] text-[#68afe9]"><Dumbbell className="size-4" /></span>}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[12px] font-semibold text-white">{exercise.name}</p>
          <p className="truncate text-[10px] text-[#718394]">{exercise.variationName ?? workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}</p>
        </div>
      </button>
      {setSlotNumbers.map((setNumber) => (
        <SetSlot
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          key={setNumber}
          patientId={patientId}
          pending={pending}
          runAction={runAction}
          set={setsByNumber.get(setNumber)}
          setNumber={setNumber}
        />
      ))}
      <div className="grid place-items-center border-l border-[#273847] p-2">
        <input aria-label={`Intervalo de ${exercise.name}`} className={cn(inputClass, "w-[68px] text-center")} value={rest} onBlur={() => persistMeta()} onChange={(event) => setRest(event.target.value)} />
        <span className="text-[10px] text-[#657687]">segundos</span>
      </div>
      <div className="grid place-items-center border-l border-[#273847] p-2">
        <select aria-label={`Técnica de ${exercise.name}`} className={cn(inputClass, "w-[100px]")} value={technique} onChange={(event) => {
          const next = event.target.value as WorkoutTechnique;
          setTechnique(next);
          persistMeta(next);
        }}>
          {Object.entries(workoutTechniqueLabels).filter(([key]) => key !== "biset").map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          {exercise.technique === "biset" ? <option value="biset">Bi-set</option> : null}
        </select>
        <input aria-label={`Cadência de ${exercise.name}`} className={cn(inputClass, "mt-1 w-[100px] text-center")} placeholder="2-0-2-1" value={cadence} onBlur={() => persistMeta()} onChange={(event) => setCadence(event.target.value)} />
      </div>
      <div className="flex min-w-0 items-center border-l border-[#273847] p-2">
        <input aria-label={`Observação de ${exercise.name}`} className={cn(inputClass, "min-w-0 flex-1")} placeholder="Observação" value={notes} onBlur={() => persistMeta()} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <div className="flex items-center justify-center gap-1 border-l border-[#273847] p-2">
        <button aria-label={`Subir ${exercise.name}`} className="inline-flex size-8 items-center justify-center rounded-[7px] text-[#8b92a3] hover:bg-[#10283a] hover:text-[#8fcfff] disabled:opacity-30" disabled={!canMoveUp || pending} type="button" onClick={onMoveUp}><ArrowUp className="size-4" /></button>
        <button aria-label={`Descer ${exercise.name}`} className="inline-flex size-8 items-center justify-center rounded-[7px] text-[#8b92a3] hover:bg-[#10283a] hover:text-[#8fcfff] disabled:opacity-30" disabled={!canMoveDown || pending} type="button" onClick={onMoveDown}><ArrowDown className="size-4" /></button>
        <button aria-label={`Remover ${exercise.name}`} className="inline-flex size-8 items-center justify-center rounded-[7px] text-[#8b92a3] hover:bg-[#32151b] hover:text-[#ff7b8e]" type="button" onClick={() => runAction(() => removeClientWorkoutExercise({ exerciseId: exercise.id, patientId }))}><Trash2 className="size-4" /></button>
      </div>
    </article>
  );
}

function MusclePanel({ exercises }: { exercises: PartnerClientWorkoutExercise[] }) {
  const heat = workoutMuscleHeat(exercises);
  return (
    <section className={cn(panelClass, "p-4")}>
      <h3 className="text-[15px] font-bold text-white">Resumo muscular</h3>
      <p className="mt-1 text-[11px] leading-4 text-[#8b92a3]">Regiões atualizadas conforme os exercícios prescritos.</p>
      <div className="mt-3 flex justify-center overflow-hidden rounded-[8px] border border-[#1e3343] bg-[#07141d]/55 py-2">
        <WorkoutMusclePreview exercises={exercises} mode="summary" />
      </div>
      <div className="flex flex-wrap gap-2">
        {heat.slice(0, 6).map((item) => (
          <span className="rounded-full border border-[#255a80] bg-[#0a2c48]/40 px-2 py-1 text-[10px] text-[#c8d4df]" key={item.group}>{workoutMuscleLabels[item.group] ?? item.group} · {item.score}x</span>
        ))}
        {heat.length === 0 ? <span className="text-[11px] text-[#718394]">Adicione exercícios para visualizar o estímulo.</span> : null}
      </div>
    </section>
  );
}

function ExecutionPanel({ execution }: { execution: PartnerWorkoutExecutionSummary | null }) {
  const [collapsed, setCollapsed] = useState(true);

  if (!execution || execution.totalSessions === 0) {
    return (
      <section className={cn(panelClass, "mt-5 p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-bold text-white">Acompanhamento real</h3>
            <p className="mt-1 text-[12px] text-[#8b92a3]">A execução do Cliente aparecerá aqui após o primeiro treino registrado.</p>
          </div>
          <span className="inline-flex size-11 items-center justify-center rounded-[8px] bg-[#082239] text-[#68afe9]">
            <BarChart3 className="size-5" />
          </span>
        </div>
      </section>
    );
  }

  const cards = [
    { Icon: CheckCircle2, label: "Concluídos", value: execution.completedSessions.toString() },
    { Icon: Clock3, label: "Parciais", value: execution.partialSessions.toString() },
    { Icon: TrendingUp, label: "Volume realizado", value: `${Math.round(execution.totalVolumeKg).toLocaleString("pt-BR")} kg` },
    { Icon: Dumbbell, label: "Melhor carga", value: `${Math.round(execution.bestLoadKg).toLocaleString("pt-BR")} kg` },
  ];
  const latestSession = execution.recentSessions[0] ?? null;

  return (
    <section className={cn(panelClass, "mt-5 overflow-hidden")}>
      <button
        aria-expanded={!collapsed}
        className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-[#303746] p-4 text-left transition hover:bg-[#10283a]/55"
        type="button"
        onClick={() => setCollapsed((current) => !current)}
      >
        <span>
          <span className="block text-[17px] font-bold text-white">Acompanhamento real</span>
          <span className="mt-1 block text-[12px] text-[#8b92a3]">Sessões registradas pelo Cliente nos últimos 90 dias.</span>
        </span>
        <span className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-[#2a5c7d] bg-[#0a2c48]/55 px-3 py-1 text-[11px] font-bold text-[#8fcfff]">{execution.completionPercent}% conclusão</span>
          <span className="rounded-full border border-[#273847] bg-[#081520] px-3 py-1 text-[11px] font-semibold text-[#c8d4df]">{execution.completedSessions}/{execution.totalSessions} treinos</span>
          <ChevronDown className={cn("size-4 text-[#8b92a3] transition", !collapsed && "rotate-180")} />
        </span>
      </button>

      {collapsed ? null : (
        <>
          <div className="border-b border-[#303746] p-4">
            <div className="max-w-[240px]">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#9aa5b6]">
                <span>Conclusão</span>
                <span className="text-[#8fcfff]">{execution.completionPercent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#07131b]">
                <div className="h-full rounded-full bg-[#3b97e3]" style={{ width: `${Math.min(100, Math.max(0, execution.completionPercent))}%` }} />
              </div>
            </div>
          </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ Icon, label, value }) => (
          <article className="rounded-[8px] border border-[#273847] bg-[#081520]/75 p-3" key={label}>
            <span className="inline-flex size-9 items-center justify-center rounded-[7px] bg-[#0a2c48] text-[#68afe9]">
              <Icon className="size-4" />
            </span>
            <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-[#718394]">{label}</p>
            <p className="mt-1 text-[20px] font-bold text-white">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 border-t border-[#273847] p-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-[13px] font-bold text-white">Últimas sessões</h4>
            {latestSession ? (
              <span className="rounded-full border border-[#2a5c7d] bg-[#0a2c48]/55 px-3 py-1 text-[11px] font-bold text-[#8fcfff]">
                Última: {latestSession.setCompletionPercent}% das séries
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 md:hidden">
            {execution.recentSessions.map((session) => (
              <article className="rounded-[8px] border border-[#273847] bg-[#081520]/75 p-3" key={session.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#9aa5b6]">{session.dateLabel}</p>
                    <h5 className="mt-1 truncate text-[13px] font-bold text-white">{session.sessionTitle}</h5>
                  </div>
                  <span className={cn(
                    "shrink-0 rounded-[6px] px-2 py-1 text-[10px] font-bold",
                    session.status === "completed" && "bg-[#0e2c1e] text-[#62d98b]",
                    session.status === "partial" && "bg-[#302813] text-[#f2c84b]",
                    session.status === "skipped" && "bg-[#32171b] text-[#ff7b88]",
                    session.status === "planned" && "bg-[#172433] text-[#9aa5b6]",
                  )}>{session.statusLabel}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[#8b92a3]">
                  <span><b className="block text-[13px] text-white">{session.setsDone}/{session.prescribedSets}</b>séries</span>
                  <span><b className="block text-[13px] text-white">{session.exercisesDone}/{session.prescribedExercises}</b>exercícios</span>
                  <span><b className="block text-[13px] text-[#8fcfff]">{Math.round(session.totalVolumeKg).toLocaleString("pt-BR")} kg</b>volume</span>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <div className="min-w-[820px] overflow-hidden rounded-[8px] border border-[#273847]">
              <div className="grid grid-cols-[96px_minmax(180px,1fr)_92px_88px_92px_110px] bg-[#07131b] px-3 py-2 text-[10px] font-bold uppercase text-[#718394]">
                <span>Data</span>
                <span>Treino</span>
                <span>Status</span>
                <span>Séries</span>
                <span>Execução</span>
                <span>Volume</span>
              </div>
              {execution.recentSessions.map((session) => (
                <div className="grid grid-cols-[96px_minmax(180px,1fr)_92px_88px_92px_110px] items-center border-t border-[#273847] px-3 py-2 text-[12px]" key={session.id}>
                  <span className="text-[#9aa5b6]">{session.dateLabel}</span>
                  <span className="min-w-0 truncate font-semibold text-white">{session.sessionTitle}</span>
                  <span className={cn(
                    "w-fit rounded-[6px] px-2 py-1 text-[10px] font-bold",
                    session.status === "completed" && "bg-[#0e2c1e] text-[#62d98b]",
                    session.status === "partial" && "bg-[#302813] text-[#f2c84b]",
                    session.status === "skipped" && "bg-[#32171b] text-[#ff7b88]",
                    session.status === "planned" && "bg-[#172433] text-[#9aa5b6]",
                  )}>{session.statusLabel}</span>
                  <span className="text-[#c8d4df]">{session.setsDone}/{session.prescribedSets}</span>
                  <span className="text-[#c8d4df]">{session.setCompletionPercent}%</span>
                  <span className="font-semibold text-[#8fcfff]">{Math.round(session.totalVolumeKg).toLocaleString("pt-BR")} kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="grid gap-3">
          {latestSession ? (
            <div className="rounded-[8px] border border-[#273847] bg-[#081520]/75 p-4">
              <h4 className="text-[13px] font-bold text-white">Realizado vs prescrito</h4>
              <div className="mt-3 grid gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[#8b92a3]">
                    <span>Séries</span>
                    <span>{latestSession.setsDone}/{latestSession.prescribedSets}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#07131b]">
                    <div className="h-full rounded-full bg-[#3b97e3]" style={{ width: `${Math.min(100, latestSession.setCompletionPercent)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#8b92a3]">
                    <span>Exercícios</span>
                    <span>{latestSession.exercisesDone}/{latestSession.prescribedExercises}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#07131b]">
                    <div className="h-full rounded-full bg-[#62d98b]" style={{ width: `${Math.min(100, latestSession.exerciseCompletionPercent)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[8px] border border-[#273847] bg-[#081520]/75 p-4">
          <h4 className="text-[13px] font-bold text-white">Pontos de atenção</h4>
          <p className="mt-1 text-[12px] text-[#8b92a3]">{execution.skippedExercises} exercício(s) pulado(s) no período.</p>
          <div className="mt-3 grid gap-2">
            {execution.skippedTop.map((item) => (
              <div className="flex items-center justify-between gap-3 rounded-[7px] bg-[#101923] px-3 py-2 text-[12px]" key={item.name}>
                <span className="min-w-0 truncate text-[#d8e5ee]">{item.name}</span>
                <span className="font-bold text-[#ff7b88]">{item.count}x</span>
              </div>
            ))}
            {execution.skippedTop.length === 0 ? <p className="rounded-[7px] bg-[#101923] px-3 py-2 text-[12px] text-[#8b92a3]">Nenhum exercício pulado recentemente.</p> : null}
          </div>
          </div>
        </aside>
      </div>
        </>
      )}
    </section>
  );
}

function InlineExerciseSearch({ library, sessionName, pending, onAdd }: {
  library: PartnerClientWorkoutViewProps["workout"]["library"]; sessionName: string; pending: boolean; onAdd: (id: string) => void;
}) {
  const [inlineExerciseSearchOpen, setInlineExerciseSearchOpen] = useState(false);
  const [inlineExerciseQuery, setInlineExerciseQuery] = useState("");
  const [inlineExerciseDropdownRect, setInlineExerciseDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const inlineExerciseInputRef = useRef<HTMLInputElement | null>(null);
  const inlineExerciseSearchRef = useRef<HTMLDivElement | null>(null);
  const index = useMemo(() => indexCatalog(library, (exercise) => `${exercise.name} ${workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}`), [library]);
  const inlineExerciseOptions = useMemo(() => inlineExerciseQuery.trim() ? searchCatalog(index, inlineExerciseQuery, 6) : [], [index, inlineExerciseQuery]);
  function updateInlineExerciseDropdownRect() {
    const rect = inlineExerciseInputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setInlineExerciseDropdownRect({
      left: rect.left,
      top: rect.bottom + 8,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (!inlineExerciseSearchOpen) {
      setInlineExerciseDropdownRect(null);
      return undefined;
    }

    updateInlineExerciseDropdownRect();
    window.addEventListener("resize", updateInlineExerciseDropdownRect);
    window.addEventListener("scroll", updateInlineExerciseDropdownRect, true);
    return () => {
      window.removeEventListener("resize", updateInlineExerciseDropdownRect);
      window.removeEventListener("scroll", updateInlineExerciseDropdownRect, true);
    };
  }, [inlineExerciseSearchOpen]);

  return <>
                        {inlineExerciseSearchOpen ? (
                          <div
                            className="relative max-w-[520px]"
                            ref={inlineExerciseSearchRef}
                            onBlur={(event) => {
                              const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
                              if (!event.currentTarget.contains(nextTarget)) {
                                setInlineExerciseSearchOpen(false);
                                setInlineExerciseQuery("");
                              }
                            }}
                          >
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718394]" />
                              <input
                                aria-label={`Buscar exercício para ${sessionName}`}
                                autoFocus
                                className={cn(inputClass, "w-full pl-9")}
                                placeholder="Digite para buscar exercício..."
                                ref={inlineExerciseInputRef}
                                value={inlineExerciseQuery}
                                onChange={(event) => {
                                  setInlineExerciseQuery(event.target.value);
                                }}
                                onFocus={updateInlineExerciseDropdownRect}
                                onKeyDown={(event) => {
                                  if (event.key === "Escape") {
                                    setInlineExerciseSearchOpen(false);
                                    setInlineExerciseQuery("");
                                  }
                                }}
                              />
                            </div>
                            {inlineExerciseQuery.trim() && inlineExerciseDropdownRect ? (
                              <div
                                className="fixed z-[9999] max-h-[260px] overflow-y-auto rounded-[8px] border border-[#303746] bg-[#07131b] p-1 shadow-2xl"
                                style={{
                                  left: inlineExerciseDropdownRect.left,
                                  top: inlineExerciseDropdownRect.top,
                                  width: inlineExerciseDropdownRect.width,
                                }}
                              >
                                {inlineExerciseOptions.length ? inlineExerciseOptions.map((exercise) => (
                                  <button
                                    aria-label={`Adicionar ${exercise.name} ao ${sessionName}`}
                                    className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-[7px] px-2 py-2 text-left hover:bg-[#10283a]"
                                    disabled={pending}
                                    key={exercise.id}
                                    type="button"
                                    onClick={() => { onAdd(exercise.id); setInlineExerciseSearchOpen(false); setInlineExerciseQuery(""); }}
                                  >
                                    {exercise.thumbnailUrl ? <img alt="" className="size-8 rounded-[6px] object-cover" src={exercise.thumbnailUrl} /> : <span className="flex size-8 items-center justify-center rounded-[6px] bg-[#0a2c48] text-[#68afe9]"><Dumbbell className="size-3.5" /></span>}
                                    <span className="min-w-0">
                                      <span className="block truncate text-[12px] font-semibold text-white">{exercise.name}</span>
                                      <span className="block truncate text-[10px] text-[#718394]">{workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}</span>
                                    </span>
                                    <Plus className="size-4 text-[#8fcfff]" />
                                  </button>
                                )) : <p className="px-3 py-2 text-[12px] text-[#718394]">Nenhum exercício encontrado.</p>}
                              </div>
                            ) : null}
                            <button className="mt-2 text-[12px] font-semibold text-[#8fcfff]" type="button" onClick={() => { setInlineExerciseSearchOpen(false); setInlineExerciseQuery(""); }}>Fechar busca</button>
                          </div>
                        ) : (
                          <button
                            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#8fcfff] hover:text-white"
                            disabled={pending}
                            type="button"
                            onClick={() => setInlineExerciseSearchOpen(true)}
                          >
                            <Plus className="size-4" /> Adicionar exercício
                          </button>
                        )}
  </>;
}

function ExerciseLibrary({ library, pending, onAdd }: {
  library: PartnerClientWorkoutViewProps["workout"]["library"]; pending: boolean; onAdd: (id: string, variation: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(30);
  const [variations, setVariations] = useState<Record<string, string>>({});
  const index = useMemo(() => indexCatalog(library, (exercise) => `${exercise.name} ${workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}`), [library]);
  const visibleLibrary = useMemo(() => searchCatalog(index, query, limit + 1), [index, query, limit]);
  return (
                  <section className={cn(panelClass, "p-4")}>
                    <h3 className="text-[15px] font-bold text-white">Biblioteca de exercícios</h3>
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718394]" />
                      <input aria-label="Buscar exercício" className={cn(inputClass, "w-full pl-9")} placeholder="Buscar exercício..." value={query} onChange={(event) => { setQuery(event.target.value); setLimit(30); }} />
                    </div>
                    <div className="mt-3 max-h-[360px] overflow-y-auto pr-2 [scrollbar-gutter:stable]">
                      {visibleLibrary.slice(0, limit).map((exercise) => (
                        <article className="grid grid-cols-[36px_minmax(0,1fr)_28px] items-center gap-2 border-b border-[#273847] py-2 last:border-b-0" key={exercise.id}>
                          {exercise.thumbnailUrl ? <img alt="" className="size-8 rounded-[6px] object-cover" src={exercise.thumbnailUrl} /> : <span className="flex size-8 items-center justify-center rounded-[6px] bg-[#0a2c48] text-[#68afe9]"><Dumbbell className="size-3.5" /></span>}
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-white">{exercise.name}</p>
                            <p className="truncate text-[10px] text-[#718394]">{workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}</p>
                            {exercise.variations.length ? (
                              <select aria-label={`Variação de ${exercise.name}`} className="mt-1 h-6 max-w-full rounded-[5px] border border-[#2b3b49] bg-[#091722] px-1 text-[10px] text-[#c8d4df]" value={variations[exercise.id] ?? ""} onChange={(event) => setVariations({ ...variations, [exercise.id]: event.target.value })}>
                                <option value="">Padrão</option>
                                {exercise.variations.map((variation) => <option key={variation} value={variation}>{variation}</option>)}
                              </select>
                            ) : null}
                          </div>
                          <button aria-label={`Adicionar ${exercise.name}`} className="inline-flex size-7 items-center justify-center rounded-[6px] bg-[#173a56] text-[#8fcfff]" disabled={pending} type="button" onClick={() => onAdd(exercise.id, variations[exercise.id] || null)}><Plus className="size-4" /></button>
                        </article>
                      ))}
                    </div>
                    {visibleLibrary.length > limit && <Button type="button" tone="ghost" onClick={() => setLimit((value) => value + 30)}>Carregar mais</Button>}
                    <Link className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-[#8fcfff]" href="/parceiros/cadastros"><Library className="size-4" /> Ver todos em Cadastros</Link>
                  </section>
  );
}

export function PartnerClientWorkoutView({ overview, workout }: PartnerClientWorkoutViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const program = workout.activeProgram;
  const [sessionId, setSessionId] = useState(program?.sessions[0]?.id ?? null);
  const [exerciseOrder, setExerciseOrder] = useState(() => program?.sessions[0]?.exercises.map((exercise) => exercise.id) ?? []);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [notes, setNotes] = useState(program?.notes ?? "");
  const [programDialog, setProgramDialog] = useState(false);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<PartnerClientWorkoutSession | null>(null);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [programModelId, setProgramModelId] = useState(workoutProgramModels[0].id);
  const [programTitle, setProgramTitle] = useState(workoutProgramModels[0].title);
  const [programSessions, setProgramSessions] = useState<ProgramSessionDraft[]>(() => modelSessions(workoutProgramModels[0].id));
  const [newSession, setNewSession] = useState({
    durationMinutes: 60,
    frequencyPerWeek: 2,
    objective: "hipertrofia" as WorkoutObjective,
    title: String(workoutTypeOptions[(program?.sessions.length ?? 0) % workoutTypeOptions.length]),
  });
  const [templateId, setTemplateId] = useState(workout.templates[0]?.id ?? "");
  const [sessionMenuId, setSessionMenuId] = useState<string | null>(null);
  const session = program?.sessions.find((item) => item.id === sessionId) ?? program?.sessions[0] ?? null;
  const firstSessionId = program?.sessions[0]?.id ?? null;
  const orderedExercises = useMemo(() => {
    const map = new Map((session?.exercises ?? []).map((exercise) => [exercise.id, exercise]));
    return exerciseOrder.map((id) => map.get(id)).filter((item): item is PartnerClientWorkoutExercise => Boolean(item));
  }, [exerciseOrder, session]);
  const selectedRows = orderedExercises.filter((exercise) => selectedExercises.includes(exercise.id));
  const selectedBisetGroup = selectedRows.length === 2 && selectedRows[0].bisetGroupId && selectedRows[0].bisetGroupId === selectedRows[1].bisetGroupId
    ? selectedRows[0].bisetGroupId
    : null;

  useEffect(() => { setExerciseOrder(session?.exercises.map((exercise) => exercise.id) ?? []); }, [session]);

  useEffect(() => {
    setSessionId(firstSessionId);
    setNotes(program?.notes ?? "");
    setSelectedExercises([]);
  }, [firstSessionId, program?.id, program?.notes]);

  function runAction(action: () => Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      router.refresh();
    });
  }

  function selectSession(id: string) {
    const next = program?.sessions.find((item) => item.id === id);
    setSessionId(id);
    setExerciseOrder(next?.exercises.map((exercise) => exercise.id) ?? []);
    setSelectedExercises([]);
    setSessionMenuId(null);
  }

  function addInlineExercise(exerciseId: string) {
    if (!session) return;
    runAction(() => addClientWorkoutExercise({
      exerciseId,
      patientId: overview.client.id,
      sessionId: session.id,
      variationName: null,
    }));
  }

  function toggleExerciseSelection(id: string) {
    setSelectedExercises((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current.filter((item) => item !== id), id].slice(-2));
  }

  function moveExercise(exerciseId: string, direction: -1 | 1) {
    if (!session) return;
    const currentIndex = exerciseOrder.indexOf(exerciseId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= exerciseOrder.length) return;
    const next = moveArrayItem(exerciseOrder, currentIndex, nextIndex);
    setExerciseOrder(next);
    runAction(() => reorderClientWorkoutExercises({ exerciseIds: next, patientId: overview.client.id, sessionId: session.id }));
  }

  function selectProgramModel(modelId: string) {
    const model = workoutProgramModels.find((item) => item.id === modelId) ?? workoutProgramModels[0];
    setProgramModelId(model.id);
    setProgramTitle(model.title);
    setProgramSessions(model.sessions.map((item) => ({ ...item })));
  }

  function updateProgramSession(index: number, patch: Partial<ProgramSessionDraft>) {
    setProgramSessions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-3 py-4 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] sm:px-5 sm:py-6 lg:px-6">
      <div className="relative mx-auto min-w-0 max-w-[1197px]">
        <PartnerClientProfileHeader activeTab="treinos" overview={overview} />

        <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold text-white">Prescrição de Treinos</h2>
            <p className="mt-1 text-[13px] text-[#8b92a3]">Monte, edite e organize os protocolos de treino do Cliente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button tone="primary" onClick={() => setProgramDialog(true)}><Plus className="size-4" /> Novo programa de treino</Button>
            <Button disabled={!program || pending} onClick={() => setTemplateDialog(true)}><Archive className="size-4" /> Usar template</Button>
            <Button disabled={!program || pending} onClick={() => program && runAction(() => sendClientWorkoutProgram({ patientId: overview.client.id, programId: program.id }))}><Send className="size-4" /> Enviar ao Cliente</Button>
            {program ? <span className="inline-flex h-10 items-center rounded-[8px] border border-[#303746] px-3 text-[12px] text-[#8fcfff]">Plano {program.status === "draft" ? "rascunho" : program.status === "published" ? "publicado" : program.status === "sent" ? "enviado" : "arquivado"} v{program.version}.0</span> : null}
          </div>
        </section>

        {program ? (
          <>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {program.sessions.map((item) => (
                <SessionCard
                  active={item.id === session?.id}
                  canDelete={program.sessions.length > 1}
                  key={item.id}
                  menuOpen={sessionMenuId === item.id}
                  pending={pending}
                  session={item}
                  onClick={() => selectSession(item.id)}
                  onDelete={() => {
                    setSessionMenuId(null);
                    if (!window.confirm(`Excluir ${sessionDisplayName(item)}?`)) return;
                    runAction(() => deleteClientWorkoutSession({ patientId: overview.client.id, programId: program.id, sessionId: item.id }));
                  }}
                  onEdit={() => {
                    setEditingSession(item);
                    setSessionMenuId(null);
                  }}
                  onToggleMenu={() => setSessionMenuId((current) => current === item.id ? null : item.id)}
                />
              ))}
              <button className="flex h-[142px] min-w-[150px] items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#3b5870] text-[13px] font-semibold text-[#8fcfff]" type="button" onClick={() => setSessionDialog(true)}><Plus className="size-4" /> Divisão</button>
            </div>

            <ExecutionPanel execution={workout.execution} />

            {session ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className={cn(panelClass, "overflow-visible")}>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#303746] p-4">
                    <div>
                      <h2 className="text-[20px] font-bold text-white">{sessionDisplayName(session)} - {workoutTrainingTypeLabel(session)}</h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#9aa5b6]">
                        <span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" /> {session.exercises.length} exercícios</span>
                        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" /> {session.frequencyPerWeek}x/semana</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right"><p className="text-[10px] uppercase text-[#718394]">Volume</p><p className="text-[16px] font-bold text-white">{session.volumeKg.toLocaleString("pt-BR")} kg</p></div>
                      {selectedExercises.length === 2 ? (
                        selectedBisetGroup
                          ? <Button onClick={() => runAction(() => uncombineClientWorkoutBiset({ firstExerciseId: selectedExercises[0], patientId: overview.client.id, secondExerciseId: selectedExercises[1] }))}><Unlink className="size-4" /> Desfazer Bi-set</Button>
                          : <Button onClick={() => runAction(() => combineClientWorkoutBiset({ firstExerciseId: selectedExercises[0], patientId: overview.client.id, secondExerciseId: selectedExercises[1] }))}><Layers3 className="size-4" /> Combinar Bi-set</Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 border-b border-[#273847] px-4 py-3 text-[11px] font-semibold text-[#9aa5b6]">
                    {(["warmup", "moderate", "maximum"] as const).map((intensity) => {
                      const meta = intensityMeta[intensity];
                      const Icon = meta.Icon;
                      return (
                        <span className="inline-flex items-center gap-2 whitespace-nowrap" key={intensity}>
                          <span className={cn("inline-flex size-6 items-center justify-center rounded-[6px]", meta.className)}><Icon className="size-3.5" /></span>
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[1028px]">
                      <div className="grid grid-cols-[232px_repeat(5,72px)_86px_112px_minmax(140px,1fr)_96px] border-b border-[#303746] bg-[#07131b] text-[10px] font-bold uppercase text-[#718394]">
                        <span className="p-3">Exercício</span>
                        {setSlotNumbers.map((setNumber) => <span className="grid place-items-center gap-1 p-2 text-center" key={setNumber}><Dumbbell className="size-3.5 text-[#3b97e3]" />Série {setNumber}</span>)}
                        <span className="p-3 text-center">Intervalo</span>
                        <span className="p-3 text-center">Técnica</span>
                        <span className="p-3">Observação</span>
                        <span className="p-3 text-center">Ações</span>
                      </div>
                      {orderedExercises.map((exercise, index) => (
                        <ExerciseRow
                          canMoveDown={index < orderedExercises.length - 1}
                          canMoveUp={index > 0}
                          exercise={exercise}
                          key={exercise.id}
                          patientId={overview.client.id}
                          pending={pending}
                          runAction={runAction}
                          selected={selectedExercises.includes(exercise.id)}
                          onMoveDown={() => moveExercise(exercise.id, 1)}
                          onMoveUp={() => moveExercise(exercise.id, -1)}
                          onSelect={() => toggleExerciseSelection(exercise.id)}
                        />
                      ))}
                      {orderedExercises.length === 0 ? <div className="p-8 text-center text-[13px] text-[#718394]">Clique em Adicionar exercício para buscar na biblioteca.</div> : null}
                      <div className="relative border-t border-[#273847] px-4 py-3">
                        <InlineExerciseSearch key={session.id} library={workout.library} sessionName={sessionDisplayName(session)} pending={pending} onAdd={addInlineExercise} />
                      </div>
                    </div>
                  </div>
                </section>

                <aside className="grid content-start gap-4">
                  <ExerciseLibrary library={workout.library} pending={pending} onAdd={(exerciseId, variationName) => runAction(() => addClientWorkoutExercise({ exerciseId, variationName, patientId: overview.client.id, sessionId: session.id }))} />
                  <MusclePanel exercises={session.exercises} />
                  <section className={cn(panelClass, "p-4")}>
                    <h3 className="text-[15px] font-bold text-white">Observações do treino</h3>
                    <textarea aria-label="Observações do treino" className="mt-3 min-h-[150px] w-full resize-y rounded-[8px] border border-[#303746] bg-[#091722] p-3 text-[12px] leading-5 text-white outline-none focus:border-[#3b97e3]" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
                    <div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-[#718394]">{notes.length}/2000</span><Button disabled={pending} onClick={() => runAction(() => saveClientWorkoutNotes({ notes: notes || null, patientId: overview.client.id, programId: program.id }))}><Save className="size-4" /> Salvar</Button></div>
                  </section>
                </aside>
              </div>
            ) : null}

            <section className={cn(panelClass, "mt-5 overflow-hidden")}>
              <div className="border-b border-[#303746] px-4 py-3"><h3 className="text-[15px] font-bold text-white">Histórico de alterações</h3></div>
              {workout.events.slice(0, 5).map((event) => <div className="grid gap-1 border-b border-[#273847] px-4 py-3 text-[12px] last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)_60px]" key={event.id}><span className="text-[#718394]">{event.dateLabel}</span><span className="text-[#d8e5ee]">{event.detail}</span><span className="text-right text-[#8fcfff]">v{event.version}.0</span></div>)}
              {workout.events.length === 0 ? <p className="p-4 text-[12px] text-[#718394]">Nenhuma alteração registrada.</p> : null}
            </section>

            <div className="sticky bottom-0 z-20 mt-5 flex flex-wrap justify-end gap-2 border-t border-[#303746] bg-[#0b1720]/95 py-4 backdrop-blur">
              <Button disabled={pending} onClick={() => runAction(() => saveClientWorkoutTemplate({ patientId: overview.client.id, programId: program.id }))}><Archive className="size-4" /> Salvar como template</Button>
              <Button disabled={pending} onClick={() => runAction(() => saveClientWorkoutNotes({ notes: notes || null, patientId: overview.client.id, programId: program.id }))}><Save className="size-4" /> Salvar alterações</Button>
              <Button disabled={pending} tone="primary" onClick={() => runAction(() => publishClientWorkoutProgram({ patientId: overview.client.id, programId: program.id }))}><Send className="size-4" /> Publicar plano</Button>
            </div>
          </>
        ) : (
          <section className={cn(panelClass, "mt-8 p-10 text-center")}>
            <Dumbbell className="mx-auto size-10 text-[#68afe9]" />
            <h2 className="mt-4 text-[22px] font-bold text-white">Nenhum programa de treino</h2>
            <p className="mt-2 text-[13px] text-[#8b92a3]">Crie um programa ou aplique um template para começar.</p>
            <Button tone="primary" onClick={() => setProgramDialog(true)}><Plus className="size-4" /> Criar programa</Button>
          </section>
        )}
      </div>

      <Dialog open={programDialog} onOpenChange={setProgramDialog}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-[#303746] bg-[#101923] text-white sm:max-w-[760px]">
          <DialogHeader><DialogTitle>Novo programa de treino</DialogTitle><DialogDescription className="text-[#8b92a3]">Escolha um modelo e ajuste as divisões antes de criar.</DialogDescription></DialogHeader>
          <form className="grid gap-5" onSubmit={(event: FormEvent) => {
            event.preventDefault();
            runAction(() => createClientWorkoutProgram({
              patientId: overview.client.id,
              sessions: programSessions.map((sessionDraft) => ({
                durationMinutes: sessionDraft.durationMinutes,
                frequencyPerWeek: sessionDraft.frequencyPerWeek,
                objective: sessionDraft.objective,
                title: sessionDraft.title,
              })),
              title: programTitle,
            }));
            setProgramDialog(false);
          }}>
            <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Nome<input className={cn(inputClass, "w-full")} value={programTitle} onChange={(event) => setProgramTitle(event.target.value)} /></label>
            <div className="grid gap-2">
              <p className="text-[12px] font-semibold text-[#9aa5b6]">Modelo inicial</p>
              <div className="grid gap-2 md:grid-cols-3">
                {workoutProgramModels.map((model) => (
                  <button
                    className={cn(
                      "grid min-h-[132px] gap-2 rounded-[8px] border p-3 text-left transition",
                      programModelId === model.id ? "border-[#3b97e3] bg-[#0d2b43]" : "border-[#303746] bg-[#0b1823] hover:border-[#526779]",
                    )}
                    key={model.id}
                    type="button"
                    onClick={() => selectProgramModel(model.id)}
                  >
                    <span className="text-[13px] font-bold text-white">{model.title}</span>
                    <span className="text-[11px] leading-4 text-[#8b92a3]">{model.description}</span>
                    <span className="text-[11px] font-semibold text-[#8fcfff]">{model.sessions.length} divisões</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-[12px] font-semibold text-[#9aa5b6]">Divisões criadas</p>
              <div className="grid gap-2">
                {programSessions.map((sessionDraft, index) => (
                  <div className="grid gap-3 rounded-[8px] border border-[#263846] bg-[#0b1823] p-3 md:grid-cols-[minmax(0,1fr)_120px]" key={`${sessionDraft.title}-${index}`}>
                    <label className="grid gap-1 text-[11px] text-[#9aa5b6]">
                      Tipo e músculos
                      <div className="grid gap-1">
                        <input className={cn(inputClass, "w-full")} value={sessionDraft.title} onChange={(event) => updateProgramSession(index, { title: event.target.value })} />
                        <span className="text-[11px] leading-4 text-[#718394]">{sessionDraft.muscles}</span>
                      </div>
                    </label>
                    <label className="grid gap-1 text-[11px] text-[#9aa5b6]">Frequência<input className={cn(inputClass, "w-full")} min="1" type="number" value={sessionDraft.frequencyPerWeek} onChange={(event) => updateProgramSession(index, { frequencyPerWeek: Number(event.target.value) })} /></label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end"><Button disabled={programSessions.length === 0 || pending} tone="primary" type="submit"><Plus className="size-4" /> Criar programa</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white">
          <DialogHeader><DialogTitle>Nova divisão</DialogTitle><DialogDescription className="text-[#8b92a3]">Adicione um novo tipo de treino ao programa.</DialogDescription></DialogHeader>
          <form className="grid gap-3" onSubmit={(event: FormEvent) => { event.preventDefault(); if (program) runAction(() => createClientWorkoutSession({ ...newSession, patientId: overview.client.id, programId: program.id })); setSessionDialog(false); }}>
            <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Tipo de treino<select className={inputClass} value={newSession.title} onChange={(event) => setNewSession({ ...newSession, title: event.target.value })}>{workoutTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
            <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Frequência<input className={inputClass} min="1" type="number" value={newSession.frequencyPerWeek} onChange={(event) => setNewSession({ ...newSession, frequencyPerWeek: Number(event.target.value) })} /></label>
            <div className="flex justify-end"><Button tone="primary" type="submit"><Plus className="size-4" /> Adicionar divisão</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingSession)} onOpenChange={(open) => { if (!open) setEditingSession(null); }}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white">
          <DialogHeader><DialogTitle>Editar divisão</DialogTitle><DialogDescription className="text-[#8b92a3]">Ajuste nome, objetivo e frequência do bloco.</DialogDescription></DialogHeader>
          {editingSession ? (
            <form className="grid gap-3" onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (!program) return;
              runAction(() => updateClientWorkoutSession({
                frequencyPerWeek: editingSession.frequencyPerWeek,
                objective: editingSession.objective,
                patientId: overview.client.id,
                programId: program.id,
                sessionId: editingSession.id,
                title: editingSession.title,
              }));
              setEditingSession(null);
            }}>
              <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Nome da divisão<input className={inputClass} value={editingSession.title} onChange={(event) => setEditingSession({ ...editingSession, title: event.target.value })} /></label>
              <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Objetivo<select className={inputClass} value={editingSession.objective} onChange={(event) => setEditingSession({ ...editingSession, objective: event.target.value as WorkoutObjective })}>
                <option value="hipertrofia">Hipertrofia</option>
                <option value="forca">Força</option>
                <option value="resistencia">Resistência</option>
                <option value="mobilidade">Mobilidade</option>
                <option value="reabilitacao">Reabilitação</option>
                <option value="condicionamento">Condicionamento</option>
              </select></label>
              <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Frequência<input className={inputClass} min="1" type="number" value={editingSession.frequencyPerWeek} onChange={(event) => setEditingSession({ ...editingSession, frequencyPerWeek: Number(event.target.value) })} /></label>
              <div className="flex justify-end"><Button disabled={pending} tone="primary" type="submit"><Save className="size-4" /> Salvar divisão</Button></div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white">
          <DialogHeader><DialogTitle>Usar template</DialogTitle><DialogDescription className="text-[#8b92a3]">Aplique uma cópia independente de um template próprio.</DialogDescription></DialogHeader>
          {workout.templates.length ? (
            <div className="grid gap-4">
              <select aria-label="Template de treino" className={inputClass} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{workout.templates.map((template) => <option key={template.id} value={template.id}>{template.title} - {template.sessionCount} divisões</option>)}</select>
              <div className="flex justify-end"><Button disabled={!templateId} tone="primary" onClick={() => { runAction(() => applyClientWorkoutTemplate({ patientId: overview.client.id, templateId })); setTemplateDialog(false); }}><Archive className="size-4" /> Aplicar template</Button></div>
            </div>
          ) : <p className="text-[13px] text-[#8b92a3]">Ainda não há templates. Salve o programa atual como template primeiro.</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
