export type WorkoutObjective = "forca" | "hipertrofia" | "resistencia" | "mobilidade" | "reabilitacao" | "condicionamento";
export type WorkoutTechnique = "normal" | "biset" | "dropset" | "rest_pause" | "superset" | "cluster" | "isometria";
export type WorkoutIntensity = "warmup" | "moderate" | "maximum";

export type PartnerClientWorkoutSet = {
  id: string;
  intensity: WorkoutIntensity;
  loadKg: number | null;
  reps: number | null;
  setNumber: number;
};

export type PartnerClientWorkoutExercise = {
  bisetGroupId: string | null;
  bisetPosition: 1 | 2 | null;
  cadence: string | null;
  exerciseId: string;
  id: string;
  muscleGroup: string;
  name: string;
  notes: string | null;
  restSeconds: number;
  secondaryMuscleGroups: string[];
  sets: PartnerClientWorkoutSet[];
  sortOrder: number;
  technique: WorkoutTechnique;
  thumbnailUrl: string | null;
  variationName: string | null;
};

export type PartnerClientWorkoutSession = {
  durationMinutes: number;
  exercises: PartnerClientWorkoutExercise[];
  frequencyPerWeek: number;
  id: string;
  objective: WorkoutObjective;
  sortOrder: number;
  title: string;
  volumeKg: number;
};

export type PartnerClientWorkoutProgram = {
  createdAt: string;
  id: string;
  notes: string | null;
  publishedAt: string | null;
  sentAt: string | null;
  sessions: PartnerClientWorkoutSession[];
  status: "draft" | "published" | "sent" | "archived";
  title: string;
  updatedAt: string;
  version: number;
};

export type PartnerWorkoutLibraryExercise = {
  cadence: string | null;
  defaultReps: string;
  defaultSets: number;
  equipment: string;
  id: string;
  muscleGroup: string;
  name: string;
  objective: WorkoutObjective;
  restSeconds: number;
  secondaryMuscleGroups: string[];
  thumbnailUrl: string | null;
  usageCount: number;
  variations: string[];
  videoUrl: string | null;
};

export type PartnerWorkoutTemplate = {
  createdAt: string;
  id: string;
  notes: string | null;
  sessionCount: number;
  status: string;
  title: string;
  updatedAt: string;
  version: number;
};

export type PartnerWorkoutEvent = {
  actorName: string | null;
  createdAt: string;
  dateLabel: string;
  detail: string;
  eventType: string;
  id: string;
  version: number;
};

type NumberLike = number | string | null | undefined;

export type PartnerWorkoutExecutionSessionLog = {
  completedAt: string | null;
  durationMinutes: NumberLike;
  id: string;
  notes: string | null;
  prescribedSessionId: string;
  programId: string;
  startedAt: string | null;
  status: string;
  totalVolumeKg: NumberLike;
  workoutDate: string;
};

export type PartnerWorkoutExecutionExerciseLog = {
  clientSessionId: string;
  completedAt: string | null;
  id: string;
  notes: string | null;
  prescribedExerciseId: string;
  startedAt: string | null;
  status: string;
};

export type PartnerWorkoutExecutionSetLog = {
  clientSessionId: string;
  completedAt: string | null;
  exerciseLogId: string;
  id: string;
  loadKg: NumberLike;
  prescribedExerciseId: string;
  prescribedSetId: string;
  reps: NumberLike;
  setNumber: NumberLike;
  status: string;
};

export type PartnerWorkoutExecutionSession = {
  bestLoadKg: number;
  dateLabel: string;
  durationMinutes: number;
  exerciseCompletionPercent: number;
  exercisesDone: number;
  id: string;
  prescribedExercises: number;
  prescribedSets: number;
  sessionTitle: string;
  setCompletionPercent: number;
  setsDone: number;
  skippedExercises: number;
  status: "completed" | "partial" | "planned" | "skipped";
  statusLabel: string;
  totalVolumeKg: number;
};

export type PartnerWorkoutSkippedExercise = {
  count: number;
  name: string;
};

export type PartnerWorkoutExecutionSummary = {
  bestLoadKg: number;
  completedMinutes: number;
  completedSessions: number;
  completionPercent: number;
  partialSessions: number;
  recentSessions: PartnerWorkoutExecutionSession[];
  skippedExercises: number;
  skippedTop: PartnerWorkoutSkippedExercise[];
  totalSessions: number;
  totalVolumeKg: number;
};

export type MuscleHeat = {
  group: string;
  score: number;
  level: 1 | 2 | 3;
};

export type PartnerClientWorkoutRawData = {
  events: Array<Omit<PartnerWorkoutEvent, "dateLabel">>;
  exerciseLogs?: PartnerWorkoutExecutionExerciseLog[];
  exercises: PartnerWorkoutLibraryExercise[];
  programs: Array<Omit<PartnerClientWorkoutProgram, "sessions"> & {
    sessions: Array<Omit<PartnerClientWorkoutSession, "volumeKg">>;
  }>;
  setLogs?: PartnerWorkoutExecutionSetLog[];
  templates: PartnerWorkoutTemplate[];
  workoutSessions?: PartnerWorkoutExecutionSessionLog[];
};

export type PartnerClientWorkoutData = {
  activeProgram: PartnerClientWorkoutProgram | null;
  events: PartnerWorkoutEvent[];
  execution: PartnerWorkoutExecutionSummary | null;
  library: PartnerWorkoutLibraryExercise[];
  programs: PartnerClientWorkoutProgram[];
  templates: PartnerWorkoutTemplate[];
};

export const workoutObjectiveLabels: Record<WorkoutObjective, string> = {
  condicionamento: "Condicionamento",
  forca: "Força",
  hipertrofia: "Hipertrofia",
  mobilidade: "Mobilidade",
  reabilitacao: "Reabilitação",
  resistencia: "Resistência",
};

const workoutTrainingTypeFallbacks = [
  "Peito e Tríceps",
  "Costas e Bíceps",
  "Pernas / Inferiores",
  "Ombros e Braços",
] as const;

export const workoutTechniqueLabels: Record<WorkoutTechnique, string> = {
  biset: "Bi-set",
  cluster: "Cluster",
  dropset: "Drop-set",
  isometria: "Isometria",
  normal: "Cadência",
  rest_pause: "Rest-pause",
  superset: "Super-set",
};

export const workoutMuscleLabels: Record<string, string> = {
  biceps: "Bíceps",
  core: "Core",
  costas: "Costas",
  gluteos: "Glúteos",
  ombros: "Ombros",
  peito: "Peito",
  pernas: "Pernas",
  triceps: "Tríceps",
};

export function workoutVolume(exercises: PartnerClientWorkoutExercise[]) {
  return exercises.reduce((total, exercise) =>
    total + exercise.sets.reduce((sum, set) =>
      sum + (set.reps !== null && set.loadKg !== null ? set.reps * set.loadKg : 0), 0), 0);
}

export function workoutTrainingTypeLabel(session: Pick<PartnerClientWorkoutSession, "exercises" | "sortOrder" | "title">) {
  const explicitTitle = session.title.trim();
  if (explicitTitle && !/^treino\s+[a-z]$/i.test(explicitTitle)) return explicitTitle;

  const scores = new Map<string, number>();
  session.exercises.forEach((exercise) => {
    const groups = new Set([exercise.muscleGroup, ...exercise.secondaryMuscleGroups]);
    groups.forEach((group) => scores.set(group, (scores.get(group) ?? 0) + 1));
  });

  const pushScore = (scores.get("peito") ?? 0) + (scores.get("triceps") ?? 0);
  const pullScore = (scores.get("costas") ?? 0) + (scores.get("biceps") ?? 0);
  const lowerScore = (scores.get("pernas") ?? 0) + (scores.get("gluteos") ?? 0);
  const shoulderScore = scores.get("ombros") ?? 0;
  const maxScore = Math.max(pushScore, pullScore, lowerScore, shoulderScore);

  if (maxScore > 0) {
    if (lowerScore === maxScore) return "Pernas / Inferiores";
    if (pullScore === maxScore) return "Costas e Bíceps";
    if (pushScore === maxScore) return "Peito e Tríceps";
    return "Ombros e Braços";
  }

  return workoutTrainingTypeFallbacks[session.sortOrder % workoutTrainingTypeFallbacks.length];
}

export function workoutMuscleHeat(exercises: PartnerClientWorkoutExercise[]): MuscleHeat[] {
  const scores = new Map<string, number>();
  exercises.forEach((exercise) => {
    const groups = new Set([exercise.muscleGroup, ...exercise.secondaryMuscleGroups]);
    groups.forEach((group) => scores.set(group, (scores.get(group) ?? 0) + 1));
  });
  return Array.from(scores, ([group, score]) => ({
    group,
    level: (score >= 5 ? 3 : score >= 2 ? 2 : 1) as 1 | 2 | 3,
    score,
  })).sort((left, right) => right.score - left.score);
}

export function parseDefaultReps(value: string) {
  const parsed = Number(value.match(/\d+/)?.[0] ?? 10);
  return Math.max(1, Math.min(500, parsed));
}

function numberValue(value: NumberLike) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  weekday: "short",
});

function executionStatus(log: PartnerWorkoutExecutionSessionLog, setsDone: number): PartnerWorkoutExecutionSession["status"] {
  if (log.status === "completed") return "completed";
  if (log.status === "skipped") return "skipped";
  if (setsDone > 0 || log.status === "in_progress") return "partial";
  return "planned";
}

function executionStatusLabel(status: PartnerWorkoutExecutionSession["status"]) {
  if (status === "completed") return "Concluído";
  if (status === "partial") return "Parcial";
  if (status === "skipped") return "Pulado";
  return "Planejado";
}

function buildExecutionSummary(
  activeProgram: PartnerClientWorkoutProgram | null,
  rawSessions: PartnerWorkoutExecutionSessionLog[] = [],
  rawExerciseLogs: PartnerWorkoutExecutionExerciseLog[] = [],
  rawSetLogs: PartnerWorkoutExecutionSetLog[] = [],
): PartnerWorkoutExecutionSummary | null {
  if (!activeProgram) return null;

  const sessionsById = new Map(activeProgram.sessions.map((session) => [session.id, session]));
  const exercisesById = new Map(activeProgram.sessions.flatMap((session) => session.exercises).map((exercise) => [exercise.id, exercise]));
  const relevantSessions = rawSessions.filter((session) => session.programId === activeProgram.id);
  const sessionIds = new Set(relevantSessions.map((session) => session.id));
  const setLogsBySession = new Map<string, PartnerWorkoutExecutionSetLog[]>();
  rawSetLogs.filter((log) => sessionIds.has(log.clientSessionId)).forEach((log) => {
    setLogsBySession.set(log.clientSessionId, [...(setLogsBySession.get(log.clientSessionId) ?? []), log]);
  });
  const exerciseLogsBySession = new Map<string, PartnerWorkoutExecutionExerciseLog[]>();
  rawExerciseLogs.filter((log) => sessionIds.has(log.clientSessionId)).forEach((log) => {
    exerciseLogsBySession.set(log.clientSessionId, [...(exerciseLogsBySession.get(log.clientSessionId) ?? []), log]);
  });

  const recentSessions = relevantSessions.slice(0, 8).map<PartnerWorkoutExecutionSession>((log) => {
    const session = sessionsById.get(log.prescribedSessionId);
    const setLogs = setLogsBySession.get(log.id) ?? [];
    const exerciseLogs = exerciseLogsBySession.get(log.id) ?? [];
    const completedSetLogs = setLogs.filter((setLog) => setLog.status === "completed");
    const setsDone = completedSetLogs.length;
    const prescribedSets = session?.exercises.reduce((total, exercise) => total + exercise.sets.length, 0) ?? 0;
    const prescribedExercises = session?.exercises.length ?? 0;
    const exercisesDone = exerciseLogs.filter((exerciseLog) => exerciseLog.status === "completed").length;
    const totalVolumeKg = numberValue(log.totalVolumeKg) || completedSetLogs.reduce((total, setLog) => total + numberValue(setLog.loadKg) * numberValue(setLog.reps), 0);
    const status = executionStatus(log, setsDone);
    const date = new Date(`${log.workoutDate}T12:00:00`);

    return {
      bestLoadKg: completedSetLogs.reduce((best, setLog) => Math.max(best, numberValue(setLog.loadKg)), 0),
      dateLabel: shortDateFormatter.format(date),
      durationMinutes: numberValue(log.durationMinutes),
      exerciseCompletionPercent: prescribedExercises > 0 ? Math.round((exercisesDone / prescribedExercises) * 100) : 0,
      exercisesDone,
      id: log.id,
      prescribedExercises,
      prescribedSets,
      sessionTitle: session ? `${session.title} · ${workoutTrainingTypeLabel(session)}` : "Treino",
      setCompletionPercent: prescribedSets > 0 ? Math.round((setsDone / prescribedSets) * 100) : 0,
      setsDone,
      skippedExercises: exerciseLogs.filter((exerciseLog) => exerciseLog.status === "skipped").length,
      status,
      statusLabel: executionStatusLabel(status),
      totalVolumeKg,
    };
  });

  const skippedCounts = new Map<string, number>();
  rawExerciseLogs.filter((log) => sessionIds.has(log.clientSessionId) && log.status === "skipped").forEach((log) => {
    const exercise = exercisesById.get(log.prescribedExerciseId);
    const name = exercise?.name ?? "Exercício";
    skippedCounts.set(name, (skippedCounts.get(name) ?? 0) + 1);
  });
  const completedSessions = recentSessions.filter((session) => session.status === "completed").length;
  const totalSessions = recentSessions.length;

  return {
    bestLoadKg: recentSessions.reduce((best, session) => Math.max(best, session.bestLoadKg), 0),
    completedMinutes: recentSessions.reduce((total, session) => total + session.durationMinutes, 0),
    completedSessions,
    completionPercent: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    partialSessions: recentSessions.filter((session) => session.status === "partial").length,
    recentSessions,
    skippedExercises: recentSessions.reduce((total, session) => total + session.skippedExercises, 0),
    skippedTop: Array.from(skippedCounts, ([name, count]) => ({ count, name })).sort((left, right) => right.count - left.count).slice(0, 3),
    totalSessions,
    totalVolumeKg: recentSessions.reduce((total, session) => total + session.totalVolumeKg, 0),
  };
}

export function buildPartnerClientWorkout(raw: PartnerClientWorkoutRawData): PartnerClientWorkoutData {
  const programs = raw.programs.map((program) => ({
    ...program,
    sessions: program.sessions.map((session) => ({
      ...session,
      exercises: [...session.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
      volumeKg: workoutVolume(session.exercises),
    })).sort((a, b) => a.sortOrder - b.sortOrder),
  }));
  const activeProgram =
    programs.find((program) => program.status === "draft") ??
    programs.find((program) => program.status === "sent") ??
    programs.find((program) => program.status === "published") ??
    programs[0] ??
    null;
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
  return {
    activeProgram,
    events: raw.events.map((event) => ({
      ...event,
      dateLabel: dateFormatter.format(new Date(event.createdAt)),
    })),
    execution: buildExecutionSummary(activeProgram, raw.workoutSessions ?? [], raw.exerciseLogs ?? [], raw.setLogs ?? []),
    library: raw.exercises,
    programs,
    templates: raw.templates,
  };
}
