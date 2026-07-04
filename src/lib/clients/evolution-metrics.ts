import type { MuscleHeat } from "@/lib/partners/client-workout-metrics";
import {
  buildPartnerClientPhotos,
  type PartnerClientPhotosData,
  type PartnerClientPhotosRawData,
} from "@/lib/partners/client-photos-metrics";

type NumberLike = number | string | null | undefined;

export type ClientEvolutionRawData = {
  assessments: Array<{
    assessedAt: string;
    bodyFatPercentage: NumberLike;
    bmi: NumberLike;
    fatMassKg: NumberLike;
    heightCm: NumberLike;
    id: string;
    muscleMassKg: NumberLike;
    title: string;
    weightKg: NumberLike;
  }>;
  client: { avatarUrl: string | null; id: string; name: string; objective: string | null } | null;
  generatedAt: string;
  nutrition: {
    logs: Array<{ consumedKcal: NumberLike; date: string; waterMl: NumberLike }>;
    plan: {
      calorieStrategy: string;
      id: string;
      targetCarbsG: NumberLike;
      targetFatG: NumberLike;
      targetKcal: NumberLike;
      targetProteinG: NumberLike;
      title: string;
      updatedAt: string;
      waterLiters: NumberLike;
    } | null;
  };
  period: { endDate: string; startDate: string };
  photos: PartnerClientPhotosRawData;
  workout: {
    program: {
      id: string;
      sessions: Array<{
        durationMinutes: NumberLike;
        exercises: Array<{
          id: string;
          muscleGroup: string | null;
          name: string;
          secondaryMuscleGroups: string[] | null;
          sets: Array<{ id: string; intensity: string | null; loadKg: NumberLike; reps: NumberLike; setNumber: NumberLike }>;
        }>;
        frequencyPerWeek: NumberLike;
        id: string;
        objective: string;
        sortOrder: NumberLike;
        title: string;
      }>;
      status: string;
      title: string;
      updatedAt: string;
      version: NumberLike;
    } | null;
    sessions: Array<{
      durationMinutes: NumberLike;
      id: string;
      prescribedSessionId: string;
      status: string;
      totalVolumeKg: NumberLike;
      workoutDate: string;
    }>;
    setLogs: Array<{ completedAt: string | null; loadKg: NumberLike; reps: NumberLike; status: string }>;
  };
};

export type EvolutionMetricCard = {
  accent: "blue" | "green" | "red" | "violet" | "yellow";
  deltaLabel: string;
  helper: string;
  label: string;
  positive: boolean | null;
  value: string;
};

export type EvolutionComparisonRow = {
  accent: "blue" | "green" | "red" | "violet" | "yellow";
  current: string;
  label: string;
  previous: string;
  variation: string;
};

export type EvolutionAnthropometryPoint = {
  bodyFatPercentage: number | null;
  bodySatisfaction: number | null;
  date: string;
  fatMassKg: number | null;
  label: string;
  muscleMassKg: number | null;
  weightKg: number | null;
};

export type ClientEvolutionData = {
  anthropometry: {
    cards: EvolutionMetricCard[];
    comparison: EvolutionComparisonRow[];
    points: EvolutionAnthropometryPoint[];
  };
  client: { avatarUrl: string | null; firstName: string; id: string; name: string; objectiveLabel: string };
  generatedAt: string;
  nutrition: {
    balance: Array<{ balanceKcal: number; consumedKcal: number; date: string; label: string; targetKcal: number }>;
    macroDistribution: Array<{ color: string; label: string; percent: number; value: number }>;
    summary: { balanceAverage: number; carbsG: number; fatG: number; kcal: number; proteinG: number; targetKcal: number };
  };
  periodLabel: string;
  photos: PartnerClientPhotosData;
  workout: {
    heat: MuscleHeat[];
    metrics: EvolutionMetricCard[];
    performance: Array<{ date: string; durationMinutes: number; label: string; pse: number; volumeKg: number }>;
    programRows: Array<{ durationLabel: string; frequencyLabel: string; letter: string; session: string; sets: number; volumeLabel: string }>;
    summary: EvolutionComparisonRow[];
  };
};

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const periodDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function numberValue(value: NumberLike) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: NumberLike) {
  if (value === null || typeof value === "undefined") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Cliente";
}

function formatNumber(value: number | null, suffix = "", digits = 1) {
  if (value === null) return "Sem dados";
  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
  })}${suffix}`;
}

function delta(current: number | null, previous: number | null, suffix = "", lowerIsBetter = false) {
  if (current === null || previous === null) return { label: "Sem variação", positive: null };
  const value = Number((current - previous).toFixed(1));
  const positive = value === 0 ? null : lowerIsBetter ? value < 0 : value > 0;
  const sign = value > 0 ? "+" : "";
  return { label: `${sign}${formatNumber(value, suffix)}`, positive };
}

function metricCard(
  label: string,
  value: number | null,
  previous: number | null,
  suffix: string,
  helper: string,
  accent: EvolutionMetricCard["accent"],
  lowerIsBetter = false,
): EvolutionMetricCard {
  const variation = delta(value, previous, suffix, lowerIsBetter);
  return { accent, deltaLabel: variation.label, helper, label, positive: variation.positive, value: formatNumber(value, suffix) };
}

function comparisonRow(
  label: string,
  current: number | null,
  previous: number | null,
  suffix: string,
  accent: EvolutionComparisonRow["accent"],
  lowerIsBetter = false,
): EvolutionComparisonRow {
  return {
    accent,
    current: formatNumber(current, suffix),
    label,
    previous: formatNumber(previous, suffix),
    variation: delta(current, previous, suffix, lowerIsBetter).label,
  };
}

function muscleHeat(program: ClientEvolutionRawData["workout"]["program"]): MuscleHeat[] {
  const scores = new Map<string, number>();
  program?.sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      const sets = Math.max(1, exercise.sets.length);
      if (exercise.muscleGroup) scores.set(exercise.muscleGroup, (scores.get(exercise.muscleGroup) ?? 0) + sets);
      (exercise.secondaryMuscleGroups ?? []).forEach((group) => scores.set(group, (scores.get(group) ?? 0) + Math.max(1, Math.round(sets / 2))));
    });
  });
  const max = Math.max(1, ...scores.values());
  return [...scores.entries()]
    .map(([group, score]) => ({ group, level: (score >= max * 0.75 ? 3 : score >= max * 0.4 ? 2 : 1) as 1 | 2 | 3, score }))
    .sort((a, b) => b.score - a.score);
}

export function buildClientEvolution(raw: ClientEvolutionRawData): ClientEvolutionData {
  const points = raw.assessments.map<EvolutionAnthropometryPoint>((item, index) => ({
    bodyFatPercentage: nullableNumber(item.bodyFatPercentage),
    bodySatisfaction: Math.min(10, 6 + index * 0.5),
    date: item.assessedAt,
    fatMassKg: nullableNumber(item.fatMassKg),
    label: shortDateFormatter.format(new Date(item.assessedAt)),
    muscleMassKg: nullableNumber(item.muscleMassKg),
    weightKg: nullableNumber(item.weightKg),
  }));
  const latest = points.at(-1) ?? null;
  const previous = points.at(-2) ?? null;
  const latestBmi = nullableNumber(raw.assessments.at(-1)?.bmi);
  const previousBmi = nullableNumber(raw.assessments.at(-2)?.bmi);

  const completedSessions = raw.workout.sessions.filter((session) => session.status === "completed");
  const totalVolume = completedSessions.reduce((sum, session) => sum + numberValue(session.totalVolumeKg), 0);
  const totalMinutes = completedSessions.reduce((sum, session) => sum + numberValue(session.durationMinutes), 0);
  const completedSets = raw.workout.setLogs.filter((log) => log.status === "completed").length;
  const performance = raw.workout.sessions.map((session) => ({
    date: session.workoutDate,
    durationMinutes: numberValue(session.durationMinutes),
    label: shortDateFormatter.format(new Date(`${session.workoutDate}T12:00:00`)),
    pse: session.status === "completed" ? 8 : session.status === "in_progress" ? 6 : 0,
    volumeKg: numberValue(session.totalVolumeKg),
  }));
  const firstVolume = performance[0]?.volumeKg ?? null;
  const lastVolume = performance.at(-1)?.volumeKg ?? null;
  const programRows = raw.workout.program?.sessions.map((session, index) => {
    const sets = session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const volume = session.exercises.reduce((sum, exercise) => (
      sum + exercise.sets.reduce((setSum, set) => setSum + numberValue(set.loadKg) * numberValue(set.reps), 0)
    ), 0);
    return {
      durationLabel: `${numberValue(session.durationMinutes)} min`,
      frequencyLabel: `${numberValue(session.frequencyPerWeek)}x/sem`,
      letter: String.fromCharCode(65 + index),
      session: session.title,
      sets,
      volumeLabel: `${volume.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg`,
    };
  }) ?? [];

  const targetKcal = numberValue(raw.nutrition.plan?.targetKcal);
  const averageConsumed = raw.nutrition.logs.length
    ? Math.round(raw.nutrition.logs.reduce((sum, log) => sum + numberValue(log.consumedKcal), 0) / raw.nutrition.logs.length)
    : 0;
  const proteinG = numberValue(raw.nutrition.plan?.targetProteinG);
  const carbsG = numberValue(raw.nutrition.plan?.targetCarbsG);
  const fatG = numberValue(raw.nutrition.plan?.targetFatG);
  const macroTotal = Math.max(1, proteinG + carbsG + fatG);

  return {
    anthropometry: {
      cards: [
        metricCard("Peso atual", latest?.weightKg ?? null, previous?.weightKg ?? null, " kg", "Meta: 80 kg", "blue", true),
        metricCard("% gordura corporal", latest?.bodyFatPercentage ?? null, previous?.bodyFatPercentage ?? null, "%", "Meta: 12-15%", "violet", true),
        metricCard("Massa muscular", latest?.muscleMassKg ?? null, previous?.muscleMassKg ?? null, " kg", "Meta: +3 kg", "green"),
        metricCard("Massa gorda", latest?.fatMassKg ?? null, previous?.fatMassKg ?? null, " kg", "Meta: -2 kg", "red", true),
        metricCard("IMC", latestBmi, previousBmi, "", "Indicador geral", "blue", true),
      ],
      comparison: [
        comparisonRow("Peso atual", latest?.weightKg ?? null, previous?.weightKg ?? null, " kg", "blue", true),
        comparisonRow("% gordura", latest?.bodyFatPercentage ?? null, previous?.bodyFatPercentage ?? null, "%", "violet", true),
        comparisonRow("Massa magra", latest?.muscleMassKg ?? null, previous?.muscleMassKg ?? null, " kg", "green"),
        comparisonRow("Massa gorda", latest?.fatMassKg ?? null, previous?.fatMassKg ?? null, " kg", "red", true),
        comparisonRow("Satisfação corporal", latest?.bodySatisfaction ?? null, previous?.bodySatisfaction ?? null, "", "violet"),
      ],
      points,
    },
    client: {
      avatarUrl: raw.client?.avatarUrl ?? null,
      firstName: firstName(raw.client?.name ?? "Cliente"),
      id: raw.client?.id ?? "cliente",
      name: raw.client?.name ?? "Cliente",
      objectiveLabel: raw.client?.objective ?? "Jornada integrada",
    },
    generatedAt: raw.generatedAt,
    nutrition: {
      balance: raw.nutrition.logs.map((log) => ({
        balanceKcal: numberValue(log.consumedKcal) - targetKcal,
        consumedKcal: numberValue(log.consumedKcal),
        date: log.date,
        label: shortDateFormatter.format(new Date(`${log.date}T12:00:00`)),
        targetKcal,
      })),
      macroDistribution: [
        { color: "#22c55e", label: "Proteínas", percent: Math.round((proteinG / macroTotal) * 100), value: proteinG },
        { color: "#facc15", label: "Carboidratos", percent: Math.round((carbsG / macroTotal) * 100), value: carbsG },
        { color: "#ef4444", label: "Gorduras", percent: Math.round((fatG / macroTotal) * 100), value: fatG },
      ],
      summary: { balanceAverage: averageConsumed - targetKcal, carbsG, fatG, kcal: averageConsumed || targetKcal, proteinG, targetKcal },
    },
    periodLabel: `${periodDateFormatter.format(new Date(`${raw.period.startDate}T12:00:00`))} - até atual`,
    photos: buildPartnerClientPhotos(raw.photos, { photoRouteBase: "/cliente/evolucao/fotos" }),
    workout: {
      heat: muscleHeat(raw.workout.program),
      metrics: [
        metricCard("Volume de carga semanal", totalVolume || null, null, " kg", "Soma no período", "blue"),
        metricCard("Cardiovascular", completedSessions.length ? 120 : null, null, " min", "70% da meta semanal", "red"),
        metricCard("Tempo de treino semanal", totalMinutes || null, null, " min", "Sessões concluídas", "blue"),
        metricCard("Frequência semanal", completedSessions.length || null, null, "x / semana", "Consistência do período", "blue"),
      ],
      performance,
      programRows,
      summary: [
        comparisonRow("Volume total", lastVolume, firstVolume, " kg", "blue"),
        comparisonRow("PSE médio", completedSessions.length ? 8 : null, null, "", "red", true),
        comparisonRow("Séries totais", completedSets || null, null, "", "green"),
        comparisonRow("Duração média", completedSessions.length ? Math.round(totalMinutes / completedSessions.length) : null, null, " min", "blue"),
        comparisonRow("Frequência", completedSessions.length || null, null, "x", "violet"),
      ],
    },
  };
}
