"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Clock3,
  Copy,
  Dumbbell,
  EllipsisVertical,
  Flame,
  Gauge,
  GripVertical,
  Layers3,
  Library,
  ListChecks,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Unlink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  PartnerClientWorkoutData,
  PartnerClientWorkoutExercise,
  PartnerClientWorkoutSet,
  PartnerClientWorkoutSession,
  WorkoutIntensity,
  WorkoutObjective,
  WorkoutTechnique,
} from "@/lib/partners/client-workout-metrics";
import {
  workoutMuscleHeat,
  workoutMuscleLabels,
  workoutObjectiveLabels,
  workoutTechniqueLabels,
} from "@/lib/partners/client-workout-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  addClientWorkoutExercise,
  addClientWorkoutSet,
  applyClientWorkoutTemplate,
  combineClientWorkoutBiset,
  createClientWorkoutProgram,
  createClientWorkoutSession,
  duplicateClientWorkoutProgram,
  publishClientWorkoutProgram,
  removeClientWorkoutExercise,
  removeClientWorkoutSet,
  reorderClientWorkoutExercises,
  saveClientWorkoutNotes,
  saveClientWorkoutTemplate,
  sendClientWorkoutProgram,
  uncombineClientWorkoutBiset,
  updateClientWorkoutExercise,
  updateClientWorkoutSet,
} from "./actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type PartnerClientWorkoutViewProps = {
  overview: PartnerClientOverviewData;
  workout: PartnerClientWorkoutData;
};

const panelClass = "min-w-0 rounded-[8px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]";
const inputClass = "h-9 rounded-[7px] border border-[#2b3b49] bg-[#091722] px-2 text-[12px] text-white outline-none focus:border-[#3b97e3]";

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

function SessionCard({ active, onClick, session }: { active: boolean; onClick: () => void; session: PartnerClientWorkoutSession }) {
  return (
    <button
      className={cn(
        "relative h-[142px] min-w-[245px] overflow-hidden rounded-[8px] border p-4 text-left transition",
        active ? "border-[#3b97e3] bg-[#10283a]" : "border-[#303746] bg-[#101923]/70 hover:border-[#526779]",
      )}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[17px] font-bold text-white">{session.title}</h3>
        <EllipsisVertical className="size-4 text-[#8b92a3]" />
      </div>
      <p className="mt-3 text-[11px] uppercase text-[#728697]">Objetivo</p>
      <p className="text-[13px] font-semibold text-white">{workoutObjectiveLabels[session.objective]}</p>
      <p className="mt-3 text-[11px] uppercase text-[#728697]">Frequência</p>
      <p className="text-[13px] font-semibold text-white">{session.frequencyPerWeek}x/semana</p>
      <Dumbbell className="absolute -bottom-4 right-5 size-24 rotate-[-18deg] text-[#1d7ece]/15" />
    </button>
  );
}

function SetEditor({ canRemove, patientId, pending, runAction, set }: {
  canRemove: boolean;
  patientId: string;
  pending: boolean;
  runAction: (action: () => Promise<{ error?: string; ok: boolean }>) => void;
  set: PartnerClientWorkoutSet;
}) {
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [load, setLoad] = useState(set.loadKg?.toString() ?? "");
  const [intensity, setIntensity] = useState<WorkoutIntensity>(set.intensity);

  function persist(nextIntensity = intensity) {
    runAction(() => updateClientWorkoutSet({
      intensity: nextIntensity,
      loadKg: load === "" ? null : Number(load.replace(",", ".")),
      patientId,
      reps: reps === "" ? null : Number(reps),
      setId: set.id,
    }));
  }

  const Icon = intensity === "warmup" ? Sparkles : intensity === "maximum" ? Gauge : Dumbbell;
  return (
    <div className="grid w-[58px] shrink-0 gap-1 border-l border-[#273847] px-1.5 py-2">
      <button
        aria-label={`Intensidade da série ${set.setNumber}`}
        className={cn(
          "mx-auto inline-flex size-5 items-center justify-center rounded-[5px]",
          intensity === "warmup" ? "bg-[#332a12] text-[#f0c76a]" : intensity === "maximum" ? "bg-[#32151b] text-[#ff7b8e]" : "bg-[#0b2b22] text-[#64db8a]",
        )}
        disabled={pending}
        title={intensity === "warmup" ? "Aquecimento" : intensity === "maximum" ? "Carga máxima" : "Carga moderada"}
        type="button"
        onClick={() => {
          const next = intensity === "warmup" ? "moderate" : intensity === "moderate" ? "maximum" : "warmup";
          setIntensity(next);
          persist(next);
        }}
      >
        <Icon className="size-3" />
      </button>
      <input aria-label={`Repetições da série ${set.setNumber}`} className="h-7 min-w-0 rounded-[5px] border border-[#263846] bg-[#081520] px-1 text-center text-[12px] text-white outline-none focus:border-[#3b97e3]" inputMode="numeric" value={reps} onBlur={() => persist()} onChange={(event) => setReps(event.target.value)} />
      <input aria-label={`Carga da série ${set.setNumber}`} className="h-7 min-w-0 rounded-[5px] border border-[#263846] bg-[#081520] px-1 text-center text-[12px] text-white outline-none focus:border-[#3b97e3]" inputMode="decimal" value={load} onBlur={() => persist()} onChange={(event) => setLoad(event.target.value)} />
      {canRemove ? <button aria-label={`Remover série ${set.setNumber}`} className="mx-auto text-[#718394] hover:text-[#ff7b8e]" type="button" onClick={() => runAction(() => removeClientWorkoutSet({ patientId, setId: set.id }))}><Trash2 className="size-3" /></button> : null}
    </div>
  );
}

function SortableExerciseRow({
  checked,
  exercise,
  onCheck,
  patientId,
  pending,
  runAction,
}: {
  checked: boolean;
  exercise: PartnerClientWorkoutExercise;
  onCheck: (checked: boolean) => void;
  patientId: string;
  pending: boolean;
  runAction: (action: () => Promise<{ error?: string; ok: boolean }>) => void;
}) {
  const sortable = useSortable({ id: exercise.id });
  const [rest, setRest] = useState(exercise.restSeconds.toString());
  const [cadence, setCadence] = useState(exercise.cadence ?? "");
  const [technique, setTechnique] = useState<WorkoutTechnique>(exercise.technique);
  const [notes, setNotes] = useState(exercise.notes ?? "");
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };

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
        "relative flex min-w-[850px] border-b border-[#273847] bg-[#0b1822]/80 last:border-b-0",
        exercise.bisetGroupId && "ml-5 border-l-2 border-l-[#3b97e3]",
        sortable.isDragging && "z-10 opacity-60",
      )}
      ref={sortable.setNodeRef}
      style={style}
    >
      {exercise.bisetPosition ? <span className="absolute -left-[14px] top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#3b97e3] text-[10px] font-bold text-white">{exercise.bisetPosition}</span> : null}
      <div className="flex w-[215px] shrink-0 items-center gap-2 p-3">
        <input aria-label={`Selecionar ${exercise.name}`} checked={checked} className="size-4 accent-[#3b97e3]" type="checkbox" onChange={(event) => onCheck(event.target.checked)} />
        <button aria-label={`Ordenar ${exercise.name}`} className="cursor-grab text-[#657687]" type="button" {...sortable.attributes} {...sortable.listeners}><GripVertical className="size-4" /></button>
        {exercise.thumbnailUrl ? <img alt="" className="size-10 rounded-[7px] object-cover" src={exercise.thumbnailUrl} /> : <span className="flex size-10 items-center justify-center rounded-[7px] bg-[#0a2c48] text-[#68afe9]"><Dumbbell className="size-4" /></span>}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[12px] font-semibold text-white">{exercise.name}</p>
          <p className="truncate text-[10px] text-[#718394]">{exercise.variationName ?? workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}</p>
        </div>
      </div>
      <div className="flex shrink-0">
        {exercise.sets.map((set, index) => <SetEditor canRemove={exercise.sets.length > 1 && index === exercise.sets.length - 1} key={set.id} patientId={patientId} pending={pending} runAction={runAction} set={set} />)}
        {exercise.sets.length < 6 ? (
          <button aria-label={`Adicionar série a ${exercise.name}`} className="flex w-10 items-center justify-center border-l border-[#273847] text-[#8fcfff] hover:bg-[#10283a]" type="button" onClick={() => runAction(() => addClientWorkoutSet({ exerciseId: exercise.id, patientId }))}><Plus className="size-4" /></button>
        ) : null}
      </div>
      <div className="grid w-[92px] shrink-0 place-items-center border-l border-[#273847] p-2">
        <input aria-label={`Intervalo de ${exercise.name}`} className={cn(inputClass, "w-[68px] text-center")} value={rest} onBlur={() => persistMeta()} onChange={(event) => setRest(event.target.value)} />
        <span className="text-[10px] text-[#657687]">segundos</span>
      </div>
      <div className="grid w-[116px] shrink-0 place-items-center border-l border-[#273847] p-2">
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
      <div className="flex min-w-[150px] flex-1 items-center gap-2 border-l border-[#273847] p-2">
        <input aria-label={`Observação de ${exercise.name}`} className={cn(inputClass, "min-w-0 flex-1")} placeholder="Observação" value={notes} onBlur={() => persistMeta()} onChange={(event) => setNotes(event.target.value)} />
        <button aria-label={`Remover ${exercise.name}`} className="inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] text-[#8b92a3] hover:bg-[#32151b] hover:text-[#ff7b8e]" type="button" onClick={() => runAction(() => removeClientWorkoutExercise({ exerciseId: exercise.id, patientId }))}><Trash2 className="size-4" /></button>
      </div>
    </article>
  );
}

const regionGeometry: Record<string, Array<{ cx?: number; cy?: number; h?: number; r?: number; rx?: number; ry?: number; type: "circle" | "ellipse" | "rect"; w?: number; x?: number; y?: number }>> = {
  biceps: [{ type: "ellipse", cx: 38, cy: 70, rx: 7, ry: 17 }, { type: "ellipse", cx: 122, cy: 70, rx: 7, ry: 17 }],
  core: [{ type: "rect", x: 61, y: 72, w: 38, h: 38 }],
  costas: [{ type: "rect", x: 61, y: 40, w: 38, h: 38 }],
  gluteos: [{ type: "ellipse", cx: 70, cy: 112, rx: 11, ry: 8 }, { type: "ellipse", cx: 90, cy: 112, rx: 11, ry: 8 }],
  ombros: [{ type: "circle", cx: 52, cy: 44, r: 9 }, { type: "circle", cx: 108, cy: 44, r: 9 }],
  peito: [{ type: "ellipse", cx: 68, cy: 51, rx: 13, ry: 10 }, { type: "ellipse", cx: 92, cy: 51, rx: 13, ry: 10 }],
  pernas: [{ type: "rect", x: 57, y: 112, w: 18, h: 62 }, { type: "rect", x: 85, y: 112, w: 18, h: 62 }],
  triceps: [{ type: "ellipse", cx: 38, cy: 70, rx: 7, ry: 17 }, { type: "ellipse", cx: 122, cy: 70, rx: 7, ry: 17 }],
};

function BodyFigure({ back, heat }: { back?: boolean; heat: ReturnType<typeof workoutMuscleHeat> }) {
  const fill = (group: string) => {
    const level = heat.find((item) => item.group === group)?.level ?? 0;
    return level === 3 ? "#ff5f72" : level === 2 ? "#f0c76a" : level === 1 ? "#4ba8ea" : "#1b303e";
  };
  const visible = back ? ["costas", "ombros", "triceps", "gluteos", "pernas"] : ["peito", "ombros", "biceps", "core", "pernas"];
  return (
    <svg aria-label={back ? "Mapa muscular posterior" : "Mapa muscular anterior"} className="h-[180px] w-[145px]" viewBox="0 0 160 190">
      <circle cx="80" cy="17" fill="#253946" r="13" />
      <rect fill="#253946" height="76" rx="24" width="54" x="53" y="30" />
      <rect fill="#253946" height="68" rx="10" width="16" x="29" y="39" />
      <rect fill="#253946" height="68" rx="10" width="16" x="115" y="39" />
      <rect fill="#253946" height="76" rx="10" width="20" x="55" y="104" />
      <rect fill="#253946" height="76" rx="10" width="20" x="85" y="104" />
      {visible.flatMap((group) => (regionGeometry[group] ?? []).map((shape, index) => {
        const props = { fill: fill(group), opacity: 0.95, stroke: "#07131b", strokeWidth: 1 };
        if (shape.type === "circle") return <circle {...props} cx={shape.cx} cy={shape.cy} key={`${group}-${index}`} r={shape.r} />;
        if (shape.type === "ellipse") return <ellipse {...props} cx={shape.cx} cy={shape.cy} key={`${group}-${index}`} rx={shape.rx} ry={shape.ry} />;
        return <rect {...props} height={shape.h} key={`${group}-${index}`} rx={5} width={shape.w} x={shape.x} y={shape.y} />;
      }))}
    </svg>
  );
}

function MusclePanel({ exercises }: { exercises: PartnerClientWorkoutExercise[] }) {
  const heat = workoutMuscleHeat(exercises);
  return (
    <section className={cn(panelClass, "p-4")}>
      <h3 className="text-[15px] font-bold text-white">Resumo muscular</h3>
      <p className="mt-1 text-[11px] leading-4 text-[#8b92a3]">Regiões atualizadas conforme os exercícios e séries.</p>
      <div className="mt-3 flex justify-center overflow-hidden">
        <BodyFigure heat={heat} />
        <BodyFigure back heat={heat} />
      </div>
      <div className="flex flex-wrap gap-2">
        {heat.slice(0, 6).map((item) => (
          <span className="rounded-full border border-[#303746] px-2 py-1 text-[10px] text-[#c8d4df]" key={item.group}>{workoutMuscleLabels[item.group] ?? item.group}</span>
        ))}
        {heat.length === 0 ? <span className="text-[11px] text-[#718394]">Adicione exercícios para visualizar o estímulo.</span> : null}
      </div>
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
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState(program?.notes ?? "");
  const [programDialog, setProgramDialog] = useState(false);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [programTitle, setProgramTitle] = useState("Programa de hipertrofia");
  const [newSession, setNewSession] = useState({ durationMinutes: 60, frequencyPerWeek: 2, objective: "hipertrofia" as WorkoutObjective, title: `Treino ${String.fromCharCode(65 + (program?.sessions.length ?? 0))}` });
  const [templateId, setTemplateId] = useState(workout.templates[0]?.id ?? "");
  const [variations, setVariations] = useState<Record<string, string>>({});
  const session = program?.sessions.find((item) => item.id === sessionId) ?? program?.sessions[0] ?? null;
  const firstSessionId = program?.sessions[0]?.id ?? null;
  const orderedExercises = useMemo(() => {
    const map = new Map((session?.exercises ?? []).map((exercise) => [exercise.id, exercise]));
    return exerciseOrder.map((id) => map.get(id)).filter((item): item is PartnerClientWorkoutExercise => Boolean(item));
  }, [exerciseOrder, session]);
  const visibleLibrary = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return workout.library.filter((exercise) =>
      !normalized || `${exercise.name} ${workoutMuscleLabels[exercise.muscleGroup] ?? exercise.muscleGroup}`.toLowerCase().includes(normalized),
    );
  }, [query, workout.library]);
  const selectedRows = (session?.exercises ?? []).filter((exercise) => selectedExercises.includes(exercise.id));
  const selectedBisetGroup = selectedRows.length === 2 && selectedRows[0].bisetGroupId && selectedRows[0].bisetGroupId === selectedRows[1].bisetGroupId
    ? selectedRows[0].bisetGroupId
    : null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setExerciseOrder(session?.exercises.map((exercise) => exercise.id) ?? []);
  }, [session]);

  useEffect(() => {
    setSessionId(firstSessionId);
    setNotes(program?.notes ?? "");
    setSelectedExercises([]);
  }, [firstSessionId, program?.id, program?.notes]);

  function runAction(action: () => Promise<{ error?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) window.alert(result.error ?? "Não foi possível concluir a ação.");
      router.refresh();
    });
  }

  function selectSession(id: string) {
    const next = program?.sessions.find((item) => item.id === id);
    setSessionId(id);
    setExerciseOrder(next?.exercises.map((exercise) => exercise.id) ?? []);
    setSelectedExercises([]);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!session || !event.over || event.active.id === event.over.id) return;
    const oldIndex = exerciseOrder.indexOf(String(event.active.id));
    const newIndex = exerciseOrder.indexOf(String(event.over.id));
    const next = arrayMove(exerciseOrder, oldIndex, newIndex);
    setExerciseOrder(next);
    runAction(() => reorderClientWorkoutExercises({ exerciseIds: next, patientId: overview.client.id, sessionId: session.id }));
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6">
      <div className="relative mx-auto min-w-0 max-w-[1197px]">
        <Link className="inline-flex h-10 items-center gap-2 text-[13px] font-semibold text-[#8fcfff] hover:text-white lg:hidden" href="/parceiros/clientes"><ArrowLeft className="size-4" /> Voltar para Clientes</Link>
        <PartnerClientProfileHeader activeTab="treinos" overview={overview} />

        <section className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-bold text-white">Prescrição de Treinos</h2>
            <p className="mt-1 text-[13px] text-[#8b92a3]">Monte, edite e organize os protocolos de treino do Cliente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button tone="primary" onClick={() => setProgramDialog(true)}><Plus className="size-4" /> Novo treino</Button>
            <Button disabled={!program || pending} onClick={() => program && runAction(() => duplicateClientWorkoutProgram({ patientId: overview.client.id, programId: program.id }))}><Copy className="size-4" /> Duplicar</Button>
            <Button disabled={!program || pending} onClick={() => setTemplateDialog(true)}><Archive className="size-4" /> Usar template</Button>
            <Button disabled={!program || pending} onClick={() => program && runAction(() => sendClientWorkoutProgram({ patientId: overview.client.id, programId: program.id }))}><Send className="size-4" /> Enviar ao Cliente</Button>
            {program ? <span className="inline-flex h-10 items-center rounded-[8px] border border-[#303746] px-3 text-[12px] text-[#8fcfff]">Plano {program.status === "draft" ? "rascunho" : program.status === "published" ? "publicado" : program.status === "sent" ? "enviado" : "arquivado"} v{program.version}.0</span> : null}
          </div>
        </section>

        {program ? (
          <>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {program.sessions.map((item) => <SessionCard active={item.id === session?.id} key={item.id} session={item} onClick={() => selectSession(item.id)} />)}
              <button className="flex h-[142px] min-w-[150px] items-center justify-center gap-2 rounded-[8px] border border-dashed border-[#3b5870] text-[13px] font-semibold text-[#8fcfff]" type="button" onClick={() => setSessionDialog(true)}><Plus className="size-4" /> Divisão</button>
            </div>

            {session ? (
              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className={cn(panelClass, "overflow-hidden")}>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#303746] p-4">
                    <div>
                      <h2 className="text-[20px] font-bold text-white">{session.title} - {workoutObjectiveLabels[session.objective]}</h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#9aa5b6]">
                        <span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" /> {session.exercises.length} exercícios</span>
                        <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {session.durationMinutes} min</span>
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
                      {selectedExercises.length > 0 ? <button aria-label="Limpar seleção" className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[#303746] text-[#8b92a3]" type="button" onClick={() => setSelectedExercises([])}><Unlink className="size-4" /></button> : null}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex min-w-[850px] border-b border-[#303746] bg-[#07131b] text-[10px] font-bold uppercase text-[#718394]">
                      <span className="w-[215px] shrink-0 p-3">Exercício</span>
                      <span className="w-[348px] shrink-0 p-3 text-center">Séries - intensidade / reps / carga</span>
                      <span className="w-[92px] shrink-0 p-3 text-center">Intervalo</span>
                      <span className="w-[116px] shrink-0 p-3 text-center">Técnica</span>
                      <span className="min-w-[150px] flex-1 p-3">Observação</span>
                    </div>
                    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
                      <SortableContext items={exerciseOrder} strategy={verticalListSortingStrategy}>
                        {orderedExercises.map((exercise) => (
                          <SortableExerciseRow
                            checked={selectedExercises.includes(exercise.id)}
                            exercise={exercise}
                            key={exercise.id}
                            patientId={overview.client.id}
                            pending={pending}
                            runAction={runAction}
                            onCheck={(checked) => setSelectedExercises((current) => checked ? [...current.filter((id) => id !== exercise.id), exercise.id].slice(-2) : current.filter((id) => id !== exercise.id))}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    {orderedExercises.length === 0 ? <div className="p-8 text-center text-[13px] text-[#718394]">Adicione o primeiro exercício pela biblioteca.</div> : null}
                  </div>
                </section>

                <aside className="grid content-start gap-4">
                  <section className={cn(panelClass, "p-4")}>
                    <h3 className="text-[15px] font-bold text-white">Biblioteca de exercícios</h3>
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718394]" />
                      <input aria-label="Buscar exercício" className={cn(inputClass, "w-full pl-9")} placeholder="Buscar exercício..." value={query} onChange={(event) => setQuery(event.target.value)} />
                    </div>
                    <div className="mt-3 max-h-[360px] overflow-y-auto">
                      {visibleLibrary.map((exercise) => (
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
                          <button aria-label={`Adicionar ${exercise.name}`} className="inline-flex size-7 items-center justify-center rounded-[6px] bg-[#173a56] text-[#8fcfff]" disabled={pending} type="button" onClick={() => runAction(() => addClientWorkoutExercise({ exerciseId: exercise.id, patientId: overview.client.id, sessionId: session.id, variationName: variations[exercise.id] || null }))}><Plus className="size-4" /></button>
                        </article>
                      ))}
                    </div>
                    <Link className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-[#8fcfff]" href="/parceiros/cadastros"><Library className="size-4" /> Ver todos em Cadastros</Link>
                  </section>
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
        <DialogContent className="border-[#303746] bg-[#101923] text-white">
          <DialogHeader><DialogTitle>Novo programa</DialogTitle><DialogDescription className="text-[#8b92a3]">Crie o programa e sua primeira divisão de treino.</DialogDescription></DialogHeader>
          <form className="grid gap-4" onSubmit={(event: FormEvent) => { event.preventDefault(); runAction(() => createClientWorkoutProgram({ patientId: overview.client.id, title: programTitle })); setProgramDialog(false); }}>
            <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Nome<input className={inputClass} value={programTitle} onChange={(event) => setProgramTitle(event.target.value)} /></label>
            <div className="flex justify-end"><Button tone="primary" type="submit"><Plus className="size-4" /> Criar programa</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
        <DialogContent className="border-[#303746] bg-[#101923] text-white">
          <DialogHeader><DialogTitle>Nova divisão</DialogTitle><DialogDescription className="text-[#8b92a3]">Adicione um novo tipo de treino ao programa.</DialogDescription></DialogHeader>
          <form className="grid gap-3" onSubmit={(event: FormEvent) => { event.preventDefault(); if (program) runAction(() => createClientWorkoutSession({ ...newSession, patientId: overview.client.id, programId: program.id })); setSessionDialog(false); }}>
            <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Nome<input className={inputClass} value={newSession.title} onChange={(event) => setNewSession({ ...newSession, title: event.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Objetivo<select className={inputClass} value={newSession.objective} onChange={(event) => setNewSession({ ...newSession, objective: event.target.value as WorkoutObjective })}>{Object.entries(workoutObjectiveLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
              <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Frequência<input className={inputClass} min="1" type="number" value={newSession.frequencyPerWeek} onChange={(event) => setNewSession({ ...newSession, frequencyPerWeek: Number(event.target.value) })} /></label>
              <label className="grid gap-1 text-[12px] text-[#9aa5b6]">Duração (min)<input className={inputClass} min="5" type="number" value={newSession.durationMinutes} onChange={(event) => setNewSession({ ...newSession, durationMinutes: Number(event.target.value) })} /></label>
            </div>
            <div className="flex justify-end"><Button tone="primary" type="submit"><Plus className="size-4" /> Adicionar divisão</Button></div>
          </form>
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
