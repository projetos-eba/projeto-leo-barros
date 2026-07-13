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

export type MuscleHeat = {
  group: string;
  score: number;
  level: 1 | 2 | 3;
};

export type PartnerClientWorkoutRawData = {
  events: Array<Omit<PartnerWorkoutEvent, "dateLabel">>;
  exercises: PartnerWorkoutLibraryExercise[];
  programs: Array<Omit<PartnerClientWorkoutProgram, "sessions"> & {
    sessions: Array<Omit<PartnerClientWorkoutSession, "volumeKg">>;
  }>;
  templates: PartnerWorkoutTemplate[];
};

export type PartnerClientWorkoutData = {
  activeProgram: PartnerClientWorkoutProgram | null;
  events: PartnerWorkoutEvent[];
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
    library: raw.exercises,
    programs,
    templates: raw.templates,
  };
}
