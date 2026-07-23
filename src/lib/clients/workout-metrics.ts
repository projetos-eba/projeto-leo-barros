import {
  cardioActivities,
  cardioZoneLabels,
  type CardioActivityKey,
  type CardioZoneKey,
} from "@/lib/partners/client-cardio-metrics";
import {
  type MuscleHeat,
  type PartnerClientWorkoutExercise,
  type PartnerClientWorkoutProgram,
  type PartnerClientWorkoutSession,
  type PartnerClientWorkoutSet,
  type WorkoutIntensity,
  type WorkoutObjective,
  type WorkoutTechnique,
  workoutMuscleHeat,
  workoutObjectiveLabels,
  workoutTrainingTypeLabel,
  workoutVolume,
} from "@/lib/partners/client-workout-metrics";

type NumberLike = number | string | null | undefined;

export type ClientWorkoutRawSessionLog = {
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

export type ClientWorkoutRawExerciseLog = {
  clientSessionId: string;
  completedAt: string | null;
  id: string;
  notes: string | null;
  prescribedExerciseId: string;
  startedAt: string | null;
  status: string;
};

export type ClientWorkoutRawSetLog = {
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

export type ClientWorkoutRawData = {
  cardio?: {
    plan: {
      activityKey: string;
      comparisonActivityKey: string;
      id: string;
      notes: string | null;
      publishedAt: string | null;
      sentAt: string | null;
      status: string;
      targetZone: string;
      title: string;
      updatedAt: string;
      version: NumberLike;
      weeklyTargetMinutes: NumberLike;
      weightKg: NumberLike;
    };
    sessions: Array<{
      activityKey: string;
      durationMinutes: NumberLike;
      id: string;
      kcalEstimate: NumberLike;
      met: NumberLike;
      notes: string | null;
      performedAt: string;
      targetZone: string;
    }>;
  } | null;
  client: {
    avatarUrl: string | null;
    id: string;
    name: string;
    objective: string | null;
  } | null;
  exerciseLogs: ClientWorkoutRawExerciseLog[];
  generatedAt: string;
  program: (Omit<PartnerClientWorkoutProgram, "sessions"> & {
    partnerId: string;
    patientId: string;
    sessions: Array<Omit<PartnerClientWorkoutSession, "volumeKg" | "exercises"> & {
      exercises: Array<Omit<PartnerClientWorkoutExercise, "sets"> & {
        sets: PartnerClientWorkoutSet[];
      }>;
    }>;
  }) | null;
  selectedDate: string;
  setLogs: ClientWorkoutRawSetLog[];
  workoutSessions: ClientWorkoutRawSessionLog[];
};

export type ClientWorkoutExercise = PartnerClientWorkoutExercise & {
  completedSets: number;
  logStatus: "pending" | "in_progress" | "completed" | "skipped";
  prescribedLoadLabel: string;
  prescribedRepsLabel: string;
  setLogs: ClientWorkoutSetLog[];
  statusLabel: string;
};

export type ClientWorkoutSession = Omit<PartnerClientWorkoutSession, "exercises"> & {
  completionPercent: number;
  completedSets: number;
  exercises: ClientWorkoutExercise[];
  focusLabel: string;
  letter: string;
  log: ClientWorkoutRawSessionLog | null;
  muscleHeat: MuscleHeat[];
  statusLabel: string;
  totalSets: number;
  trainingLabel: string;
};

export type ClientWorkoutSetLog = {
  completedAtLabel: string | null;
  id: string;
  loadKg: number | null;
  prescribedSetId: string;
  reps: number | null;
  setNumber: number;
  status: "pending" | "completed";
};

export type ClientWorkoutHistoryItem = {
  bestLoadKg: number;
  dateLabel: string;
  detailLabel: string;
  durationMinutes: number;
  exercisesDone: number;
  id: string;
  sessionId: string;
  sessionTitle: string;
  setsDone: number;
  status: "completed" | "partial" | "skipped" | "planned";
  statusLabel: string;
  totalVolumeKg: number;
  workoutDate: string;
};

export type ClientWorkoutExecution = {
  clientSessionId: string;
  currentExercise: ClientWorkoutExercise | null;
  currentSet: (PartnerClientWorkoutSet & { log: ClientWorkoutSetLog | null }) | null;
  exercises: ClientWorkoutExercise[];
  prescribedSession: ClientWorkoutSession;
  sessionLog: ClientWorkoutRawSessionLog;
};

export type ClientWorkoutData = {
  cardio: {
    activityLabel: string;
    completedKcal: number;
    completedMinutes: number;
    latestSessionLabel: string | null;
    planTitle: string;
    progressPercent: number;
    statusLabel: string;
    targetMinutes: number;
    targetZoneLabel: string;
  } | null;
  client: {
    avatarUrl: string | null;
    firstName: string;
    id: string;
    name: string;
    objectiveLabel: string;
  };
  executionSessions: ClientWorkoutExecution[];
  generatedAt: string;
  history: ClientWorkoutHistoryItem[];
  program: PartnerClientWorkoutProgram | null;
  routine: {
    completedToday: number;
    nextSessionId: string | null;
    nextSessionLabel: string;
    reasonLabel: string;
    totalToday: number;
  };
  selectedDate: {
    iso: string;
    label: string;
    shortLabel: string;
  };
  selectedSession: ClientWorkoutSession | null;
  sessions: ClientWorkoutSession[];
  summary: {
    bestLoadKg: number;
    completedMinutes: number;
    completedSessions: number;
    completionPercent: number;
    targetMinutes: number;
    totalExercises: number;
    totalSets: number;
    totalVolumeKg: number;
  };
  todaySession: ClientWorkoutSession | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  weekday: "long",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
});

function numberValue(value: NumberLike) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asCardioActivity(value: string | null | undefined): CardioActivityKey {
  return value && value in cardioActivities ? (value as CardioActivityKey) : "caminhada_leve";
}

function asCardioZone(value: string | null | undefined): CardioZoneKey {
  return value && value in cardioZoneLabels ? (value as CardioZoneKey) : "z2";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Cliente";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const [weekday, rest] = dateFormatter.format(date).split(", ");
  return `${rest}, ${weekday}`;
}

function sessionLetter(index: number) {
  return String.fromCharCode(65 + index);
}

function percent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
}

function statusLabel(status: string, completionPercent = 0) {
  if (status === "completed") return "Concluído";
  if (status === "skipped") return "Pulado";
  if (status === "in_progress") return completionPercent > 0 ? "Em andamento" : "Iniciado";
  return "Pendente";
}

function latestProgramLog(logs: ClientWorkoutRawSessionLog[], programId: string | null | undefined) {
  return logs
    .filter((log) => !programId || log.programId === programId)
    .slice()
    .sort((left, right) => {
      const dateCompare = right.workoutDate.localeCompare(left.workoutDate);
      if (dateCompare !== 0) return dateCompare;
      return (right.startedAt ?? right.completedAt ?? "").localeCompare(left.startedAt ?? left.completedAt ?? "");
    })[0] ?? null;
}

function nextSessionAfter(sessions: ClientWorkoutSession[], sessionId: string | null | undefined) {
  if (!sessions.length) return null;
  const currentIndex = sessions.findIndex((session) => session.id === sessionId);
  if (currentIndex < 0) return sessions[0] ?? null;
  return sessions[(currentIndex + 1) % sessions.length] ?? sessions[0] ?? null;
}

function suggestedSession(
  sessions: ClientWorkoutSession[],
  rawLogs: ClientWorkoutRawSessionLog[],
  selectedDate: string,
  programId: string | null | undefined,
) {
  if (!sessions.length) return { reasonLabel: "Sem treino disponível", session: null };

  const inProgress = sessions.find((session) => session.log?.status === "in_progress");
  if (inProgress) return { reasonLabel: "Continuar treino iniciado hoje", session: inProgress };

  const pendingToday = sessions.find((session) => session.log && session.log.status !== "completed" && session.log.status !== "skipped");
  if (pendingToday) return { reasonLabel: "Retomar treino de hoje", session: pendingToday };

  const untouchedToday = sessions.find((session) => !session.log);
  const completedToday = sessions.filter((session) => session.log?.status === "completed").length;
  if (untouchedToday && completedToday > 0) return { reasonLabel: "Próximo treino do ciclo de hoje", session: untouchedToday };

  const latest = latestProgramLog(rawLogs, programId);
  const nextByCycle = latest ? nextSessionAfter(sessions, latest.prescribedSessionId) : null;
  if (nextByCycle) return { reasonLabel: latest.status === "completed" ? "Próximo treino do ciclo" : "Sugestão baseada no último registro", session: nextByCycle };

  return { reasonLabel: "Primeiro treino do programa", session: sessions[0] ?? null };
}

function normalizeSetLogs(logs: ClientWorkoutRawSetLog[]) {
  return logs.map<ClientWorkoutSetLog>((log) => ({
    completedAtLabel: log.completedAt ? timeFormatter.format(new Date(log.completedAt)) : null,
    id: log.id,
    loadKg: log.loadKg === null || log.loadKg === undefined ? null : numberValue(log.loadKg),
    prescribedSetId: log.prescribedSetId,
    reps: log.reps === null || log.reps === undefined ? null : numberValue(log.reps),
    setNumber: numberValue(log.setNumber),
    status: log.status === "completed" ? "completed" : "pending",
  }));
}

function setLogVolume(logs: ClientWorkoutSetLog[]) {
  return logs.reduce((total, log) => total + (log.status === "completed" ? (log.loadKg ?? 0) * (log.reps ?? 0) : 0), 0);
}

function buildExercises(
  exercises: PartnerClientWorkoutExercise[],
  exerciseLogs: ClientWorkoutRawExerciseLog[],
  setLogs: ClientWorkoutRawSetLog[],
): ClientWorkoutExercise[] {
  const exerciseLogMap = new Map(exerciseLogs.map((log) => [log.prescribedExerciseId, log]));
  const setLogsByExercise = new Map<string, ClientWorkoutSetLog[]>();

  normalizeSetLogs(setLogs).forEach((log) => {
    const raw = setLogs.find((item) => item.id === log.id);
    if (!raw) return;
    setLogsByExercise.set(raw.prescribedExerciseId, [...(setLogsByExercise.get(raw.prescribedExerciseId) ?? []), log]);
  });

  return exercises.map((exercise) => {
    const logs = (setLogsByExercise.get(exercise.id) ?? []).sort((a, b) => a.setNumber - b.setNumber);
    const completedSets = logs.filter((log) => log.status === "completed").length;
    const exerciseLog = exerciseLogMap.get(exercise.id);
    const logStatus = (exerciseLog?.status === "completed" || exerciseLog?.status === "skipped" || exerciseLog?.status === "in_progress" ? exerciseLog.status : "pending") as ClientWorkoutExercise["logStatus"];
    const reps = exercise.sets.map((set) => set.reps).filter((value): value is number => value !== null);
    const loads = exercise.sets.map((set) => set.loadKg).filter((value): value is number => value !== null);

    return {
      ...exercise,
      completedSets,
      logStatus,
      prescribedLoadLabel: loads.length ? `${Math.min(...loads)}-${Math.max(...loads)} kg` : "Carga livre",
      prescribedRepsLabel: reps.length ? `${Math.min(...reps)}-${Math.max(...reps)} reps` : "Reps livres",
      setLogs: logs,
      statusLabel: statusLabel(logStatus, percent(completedSets, exercise.sets.length)),
    };
  });
}

function buildExecution(session: ClientWorkoutSession, log: ClientWorkoutRawSessionLog, exerciseLogs: ClientWorkoutRawExerciseLog[], setLogs: ClientWorkoutRawSetLog[]): ClientWorkoutExecution {
  const logsForSession = exerciseLogs.filter((item) => item.clientSessionId === log.id);
  const setLogsForSession = setLogs.filter((item) => item.clientSessionId === log.id);
  const exercises = buildExercises(session.exercises, logsForSession, setLogsForSession);
  const currentExercise = exercises.find((exercise) => exercise.logStatus !== "completed" && exercise.logStatus !== "skipped") ?? exercises[0] ?? null;
  const currentSet = currentExercise?.sets.map((set) => ({
    ...set,
    log: currentExercise.setLogs.find((logItem) => logItem.prescribedSetId === set.id) ?? null,
  })).find((set) => set.log?.status !== "completed") ?? null;

  return {
    clientSessionId: log.id,
    currentExercise,
    currentSet,
    exercises,
    prescribedSession: session,
    sessionLog: log,
  };
}

function historyStatus(log: ClientWorkoutRawSessionLog, setsDone: number): ClientWorkoutHistoryItem["status"] {
  if (log.status === "completed") return "completed";
  if (log.status === "skipped") return "skipped";
  if (setsDone > 0 || log.status === "in_progress") return "partial";
  return "planned";
}

export function buildClientWorkout(raw: ClientWorkoutRawData): ClientWorkoutData {
  const clientName = raw.client?.name ?? "Cliente";
  const rawProgram = raw.program;
  const selectedDate = raw.selectedDate;

  const program = rawProgram ? {
    ...rawProgram,
    sessions: rawProgram.sessions.map((session) => ({
      ...session,
      exercises: [...session.exercises].map((exercise) => ({
        ...exercise,
        bisetPosition: (exercise.bisetPosition === 1 || exercise.bisetPosition === 2 ? exercise.bisetPosition : null),
        intensity: undefined,
        sets: [...exercise.sets].map((set) => ({
          ...set,
          intensity: (set.intensity === "warmup" || set.intensity === "maximum" ? set.intensity : "moderate") as WorkoutIntensity,
          loadKg: set.loadKg === null || set.loadKg === undefined ? null : numberValue(set.loadKg),
          reps: set.reps === null || set.reps === undefined ? null : numberValue(set.reps),
          setNumber: numberValue(set.setNumber),
        })).sort((a, b) => a.setNumber - b.setNumber),
        technique: exercise.technique as WorkoutTechnique,
      })).sort((a, b) => a.sortOrder - b.sortOrder),
      objective: session.objective as WorkoutObjective,
      volumeKg: workoutVolume(session.exercises),
    })).sort((a, b) => a.sortOrder - b.sortOrder),
  } satisfies PartnerClientWorkoutProgram : null;

  const todayLogBySession = new Map(raw.workoutSessions.filter((log) => log.workoutDate === selectedDate).map((log) => [log.prescribedSessionId, log]));

  const sessions = (program?.sessions ?? []).map<ClientWorkoutSession>((session, index) => {
    const allSetCount = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const log = todayLogBySession.get(session.id) ?? null;
    const logsForToday = raw.setLogs.filter((item) => item.clientSessionId === log?.id);
    const exerciseLogsForToday = raw.exerciseLogs.filter((item) => item.clientSessionId === log?.id);
    const exercises = buildExercises(session.exercises, exerciseLogsForToday, logsForToday);
    const completedSets = logsForToday.filter((log) => log.status === "completed").length;
    const sessionCompletion = percent(completedSets, allSetCount);

    return {
      ...session,
      completionPercent: sessionCompletion,
      completedSets,
      exercises,
      focusLabel: `${workoutObjectiveLabels[session.objective]} e consistência`,
      letter: sessionLetter(index),
      log,
      muscleHeat: workoutMuscleHeat(session.exercises),
      statusLabel: statusLabel(log?.status ?? "pending", sessionCompletion),
      totalSets: allSetCount,
      trainingLabel: workoutTrainingTypeLabel(session),
    };
  });

  const suggestion = suggestedSession(sessions, raw.workoutSessions, selectedDate, program?.id);
  const todaySession = suggestion.session;
  const selectedSession = todaySession;
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const setLogsByClientSession = new Map<string, ClientWorkoutRawSetLog[]>();
  raw.setLogs.forEach((log) => {
    setLogsByClientSession.set(log.clientSessionId, [...(setLogsByClientSession.get(log.clientSessionId) ?? []), log]);
  });

  const history = raw.workoutSessions.slice().sort((a, b) => b.workoutDate.localeCompare(a.workoutDate)).slice(0, 10).map<ClientWorkoutHistoryItem>((log) => {
    const session = sessionById.get(log.prescribedSessionId);
    const logs = normalizeSetLogs(setLogsByClientSession.get(log.id) ?? []);
    const setsDone = logs.filter((item) => item.status === "completed").length;
    const bestLoadKg = logs.reduce((best, item) => Math.max(best, item.loadKg ?? 0), 0);
    const status = historyStatus(log, setsDone);
    const date = new Date(`${log.workoutDate}T12:00:00`);

    return {
      bestLoadKg,
      dateLabel: `${weekdayFormatter.format(date)} · ${shortDateFormatter.format(date)}`,
      detailLabel: `${setsDone} séries · ${numberValue(log.totalVolumeKg)} kg`,
      durationMinutes: numberValue(log.durationMinutes),
      exercisesDone: raw.exerciseLogs.filter((item) => item.clientSessionId === log.id && item.status === "completed").length,
      id: log.id,
      sessionId: log.prescribedSessionId,
      sessionTitle: session ? `${session.title} · ${session.trainingLabel}` : "Treino",
      setsDone,
      status,
      statusLabel: status === "completed" ? "Concluído" : status === "skipped" ? "Pulado" : status === "partial" ? "Parcial" : "Planejado",
      totalVolumeKg: numberValue(log.totalVolumeKg) || setLogVolume(logs),
      workoutDate: log.workoutDate,
    };
  });

  const completedHistory = history.filter((item) => item.status === "completed");
  const completedMinutes = completedHistory.reduce((total, item) => total + item.durationMinutes, 0);
  const totalVolumeKg = history.reduce((total, item) => total + item.totalVolumeKg, 0);
  const targetMinutes = Math.max(60, sessions.reduce((total, session) => total + session.durationMinutes * session.frequencyPerWeek, 0));
  const executionSessions = raw.workoutSessions
    .filter((log) => log.status !== "skipped")
    .map((log) => {
      const session = sessionById.get(log.prescribedSessionId);
      return session ? buildExecution(session, log, raw.exerciseLogs, raw.setLogs) : null;
    })
    .filter((item): item is ClientWorkoutExecution => Boolean(item));
  const cardio = raw.cardio?.plan ? (() => {
    const activityKey = asCardioActivity(raw.cardio?.plan.activityKey);
    const targetZone = asCardioZone(raw.cardio?.plan.targetZone);
    const cardioSessions = raw.cardio?.sessions ?? [];
    const completedMinutes = cardioSessions.reduce((total, session) => total + numberValue(session.durationMinutes), 0);
    const completedKcal = cardioSessions.reduce((total, session) => total + numberValue(session.kcalEstimate), 0);
    const targetMinutes = numberValue(raw.cardio?.plan.weeklyTargetMinutes);
    const latestSession = cardioSessions[0] ?? null;
    const status = raw.cardio?.plan.status;

    return {
      activityLabel: cardioActivities[activityKey].label,
      completedKcal: Math.round(completedKcal),
      completedMinutes,
      latestSessionLabel: latestSession ? shortDateTimeFormatter.format(new Date(latestSession.performedAt)) : null,
      planTitle: raw.cardio?.plan.title ?? "Plano de Cardio",
      progressPercent: percent(completedMinutes, targetMinutes),
      statusLabel: status === "sent" ? "Ativo" : status === "published" ? "Publicado" : "Disponível",
      targetMinutes,
      targetZoneLabel: cardioZoneLabels[targetZone],
    };
  })() : null;

  return {
    cardio,
    client: {
      avatarUrl: raw.client?.avatarUrl ?? null,
      firstName: firstName(clientName),
      id: raw.client?.id ?? "cliente",
      name: clientName,
      objectiveLabel: raw.client?.objective ?? "Evolução física",
    },
    executionSessions,
    generatedAt: raw.generatedAt,
    history,
    program,
    routine: {
      completedToday: sessions.filter((session) => session.log?.status === "completed").length,
      nextSessionId: todaySession?.id ?? null,
      nextSessionLabel: todaySession ? `Treino ${todaySession.letter} · ${todaySession.trainingLabel}` : "Sem treino disponível",
      reasonLabel: suggestion.reasonLabel,
      totalToday: sessions.length,
    },
    selectedDate: {
      iso: selectedDate,
      label: formatDate(selectedDate),
      shortLabel: shortDateFormatter.format(new Date(`${selectedDate}T12:00:00`)),
    },
    selectedSession,
    sessions,
    summary: {
      bestLoadKg: history.reduce((best, item) => Math.max(best, item.bestLoadKg), 0),
      completedMinutes,
      completedSessions: completedHistory.length,
      completionPercent: percent(completedMinutes, targetMinutes),
      targetMinutes,
      totalExercises: selectedSession?.exercises.length ?? 0,
      totalSets: selectedSession?.totalSets ?? 0,
      totalVolumeKg,
    },
    todaySession,
  };
}
