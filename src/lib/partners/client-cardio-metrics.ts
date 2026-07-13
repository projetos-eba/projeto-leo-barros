export type CardioActivityKey =
  | "bicicleta_leve"
  | "caminhada_leve"
  | "caminhada_moderada"
  | "corrida_forte"
  | "corrida_moderada"
  | "eliptico";

export type CardioPlanStatus = "archived" | "draft" | "published" | "sent";
export type CardioZoneKey = "z1" | "z2" | "z3" | "z4" | "z5";

export type PartnerClientCardioRawData = {
  calculations: Array<{
    activityKey: string;
    comparisonActivityKey: string;
    comparisonKcalEstimate: number;
    comparisonKcalPerMin: number;
    comparisonMet: number;
    createdAt: string;
    durationMinutes: number;
    id: string;
    kcalEstimate: number;
    kcalPerMin: number;
    met: number;
    parameters: Record<string, unknown>;
    targetZone: string;
    weightKg: number;
  }>;
  events: Array<{
    actorName: string | null;
    createdAt: string;
    detail: string;
    eventType: string;
    id: string;
    version: number;
  }>;
  generatedAt: string;
  patient: {
    birthDate: string | null;
  };
  plan: {
    activityKey: string;
    comparisonActivityKey: string;
    createdAt: string;
    id: string;
    notes: string | null;
    publishedAt: string | null;
    sentAt: string | null;
    status: string;
    targetZone: string;
    title: string;
    updatedAt: string;
    version: number;
    weeklyTargetMinutes: number;
    weightKg: number;
  } | null;
  sessions: Array<{
    activityKey: string;
    createdAt: string;
    durationMinutes: number;
    id: string;
    kcalEstimate: number;
    met: number;
    notes: string | null;
    performedAt: string;
    targetZone: string;
  }>;
};

export type CardioActivity = {
  intensityLabel: string;
  key: CardioActivityKey;
  label: string;
  met: number;
  shortLabel: string;
};

export type CardioCalculation = {
  activity: CardioActivity;
  comparisonActivity: CardioActivity;
  comparisonKcalEstimate: number;
  comparisonKcalPerMin: number;
  createdAt: string;
  createdLabel: string;
  durationMinutes: number;
  id: string;
  kcalEstimate: number;
  kcalPerMin: number;
  parameters: Record<string, unknown>;
  targetZone: CardioZoneKey;
  targetZoneLabel: string;
  weightKg: number;
};

export type CardioSession = {
  activity: CardioActivity;
  createdAt: string;
  dateLabel: string;
  durationMinutes: number;
  id: string;
  kcalEstimate: number;
  notes: string | null;
  performedAt: string;
  targetZone: CardioZoneKey;
  targetZoneLabel: string;
};

export type CardioPlan = {
  activity: CardioActivity;
  comparisonActivity: CardioActivity;
  createdAt: string;
  id: string;
  notes: string | null;
  publishedAt: string | null;
  sentAt: string | null;
  status: CardioPlanStatus;
  statusLabel: string;
  targetZone: CardioZoneKey;
  targetZoneLabel: string;
  title: string;
  updatedAt: string;
  version: number;
  weeklyTargetMinutes: number;
  weightKg: number;
};

export type CardioComparisonPoint = {
  comparisonKcal: number;
  minutes: number;
  primaryKcal: number;
};

export type CardioHeartRateZone = {
  bpmEnd: number;
  bpmRangeLabel: string;
  bpmStart: number;
  description: string;
  key: CardioZoneKey;
  label: string;
  objective: string;
  percentLabel: string;
};

export type PartnerClientCardioData = {
  calculations: CardioCalculation[];
  comparison: CardioComparisonPoint[];
  events: Array<{
    actorName: string | null;
    createdAt: string;
    dateLabel: string;
    detail: string;
    eventType: string;
    id: string;
    version: number;
  }>;
  generatedAt: string;
  heartRateZones: CardioHeartRateZone[];
  latestCalculation: CardioCalculation | null;
  patient: {
    ageYears: number | null;
    birthDate: string | null;
    maxHeartRate: number;
  };
  plan: CardioPlan | null;
  sessions: CardioSession[];
  weekSummary: {
    completedKcal: number;
    completedMinutes: number;
    estimatedKcal: number;
    progressPct: number;
    targetMinutes: number;
    targetZone: CardioZoneKey;
    targetZoneLabel: string;
  };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const cardioActivities: Record<CardioActivityKey, CardioActivity> = {
  caminhada_leve: {
    intensityLabel: "Leve (1,6-2,9 METs)",
    key: "caminhada_leve",
    label: "Caminhada leve",
    met: 2.5,
    shortLabel: "Caminhada",
  },
  caminhada_moderada: {
    intensityLabel: "Moderado (3,0-3,9 METs)",
    key: "caminhada_moderada",
    label: "Caminhada moderada",
    met: 3.5,
    shortLabel: "Caminhada",
  },
  bicicleta_leve: {
    intensityLabel: "Leve a moderado (4,0 METs)",
    key: "bicicleta_leve",
    label: "Bicicleta leve",
    met: 4,
    shortLabel: "Bicicleta",
  },
  eliptico: {
    intensityLabel: "Moderado (5,0 METs)",
    key: "eliptico",
    label: "Elíptico",
    met: 5,
    shortLabel: "Elíptico",
  },
  corrida_moderada: {
    intensityLabel: "Moderado / vigoroso (5,0 METs)",
    key: "corrida_moderada",
    label: "Corrida moderada",
    met: 5,
    shortLabel: "Corrida",
  },
  corrida_forte: {
    intensityLabel: "Vigoroso (8,0 METs)",
    key: "corrida_forte",
    label: "Corrida forte",
    met: 8,
    shortLabel: "Corrida",
  },
};

export const cardioActivityOptions = Object.values(cardioActivities);

export const cardioZoneLabels: Record<CardioZoneKey, string> = {
  z1: "Z1",
  z2: "Z2",
  z3: "Z3",
  z4: "Z4",
  z5: "Z5",
};

const zoneRanges: Array<{
  description: string;
  end: number;
  key: CardioZoneKey;
  objective: string;
  percentLabel: string;
  start: number;
}> = [
  { description: "Recuperação ativa", end: 0.6, key: "z1", objective: "Recuperação", percentLabel: "50-60%", start: 0.5 },
  { description: "Queima de gordura", end: 0.7, key: "z2", objective: "Resistência básica", percentLabel: "60-70%", start: 0.6 },
  { description: "Condicionamento", end: 0.8, key: "z3", objective: "Resistência aeróbica", percentLabel: "70-80%", start: 0.7 },
  { description: "Limiar anaeróbio", end: 0.9, key: "z4", objective: "Performance", percentLabel: "80-90%", start: 0.8 },
  { description: "Máximo", end: 1, key: "z5", objective: "Potência máxima", percentLabel: "90-100%", start: 0.9 },
];

const validActivityKeys = Object.keys(cardioActivities) as CardioActivityKey[];
const validZoneKeys = Object.keys(cardioZoneLabels) as CardioZoneKey[];

function isCardioActivityKey(value: string): value is CardioActivityKey {
  return validActivityKeys.includes(value as CardioActivityKey);
}

function isCardioZoneKey(value: string): value is CardioZoneKey {
  return validZoneKeys.includes(value as CardioZoneKey);
}

function asActivity(value: string | null | undefined, fallback: CardioActivityKey): CardioActivity {
  return cardioActivities[value && isCardioActivityKey(value) ? value : fallback];
}

function asZone(value: string | null | undefined, fallback: CardioZoneKey): CardioZoneKey {
  return value && isCardioZoneKey(value) ? value : fallback;
}

function round(value: number, fractionDigits = 0) {
  return Number(value.toFixed(fractionDigits));
}

export function calculateCardioKcal(weightKg: number, met: number, minutes: number) {
  return round((met * 3.5 * weightKg) / 200 * minutes, 0);
}

export function calculateCardioKcalPerMinute(weightKg: number, met: number) {
  return round((met * 3.5 * weightKg) / 200, 1);
}

export function calculateAgeYears(birthDate: string | null, now = new Date()) {
  if (!birthDate) return null;
  const parsed = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  let age = now.getFullYear() - parsed.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > parsed.getMonth() || (now.getMonth() === parsed.getMonth() && now.getDate() >= parsed.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export function buildHeartRateZones(ageYears: number | null): CardioHeartRateZone[] {
  const maxHeartRate = 220 - (ageYears ?? 40);
  return zoneRanges.map((zone) => {
    const bpmStart = Math.round(maxHeartRate * zone.start);
    const bpmEnd = Math.round(maxHeartRate * zone.end);
    return {
      bpmEnd,
      bpmRangeLabel: `${bpmStart}-${bpmEnd}`,
      bpmStart,
      description: zone.description,
      key: zone.key,
      label: cardioZoneLabels[zone.key],
      objective: zone.objective,
      percentLabel: zone.percentLabel,
    };
  });
}

export function buildCardioComparison(
  weightKg: number,
  primaryActivityKey: CardioActivityKey,
  comparisonActivityKey: CardioActivityKey,
): CardioComparisonPoint[] {
  const primary = cardioActivities[primaryActivityKey];
  const comparison = cardioActivities[comparisonActivityKey];
  return [0, 15, 30, 45, 60].map((minutes) => ({
    comparisonKcal: calculateCardioKcal(weightKg, comparison.met, minutes),
    minutes,
    primaryKcal: calculateCardioKcal(weightKg, primary.met, minutes),
  }));
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function normalizePlan(plan: PartnerClientCardioRawData["plan"]): CardioPlan | null {
  if (!plan) return null;
  const activity = asActivity(plan.activityKey, "caminhada_leve");
  const comparisonActivity = asActivity(plan.comparisonActivityKey, "corrida_moderada");
  const targetZone = asZone(plan.targetZone, "z2");
  const status = ["archived", "draft", "published", "sent"].includes(plan.status) ? (plan.status as CardioPlanStatus) : "draft";
  return {
    activity,
    comparisonActivity,
    createdAt: plan.createdAt,
    id: plan.id,
    notes: plan.notes,
    publishedAt: plan.publishedAt,
    sentAt: plan.sentAt,
    status,
    statusLabel: status === "sent" ? "Enviado" : status === "published" ? "Publicado" : status === "archived" ? "Arquivado" : "Rascunho",
    targetZone,
    targetZoneLabel: cardioZoneLabels[targetZone],
    title: plan.title,
    updatedAt: plan.updatedAt,
    version: plan.version,
    weeklyTargetMinutes: plan.weeklyTargetMinutes,
    weightKg: plan.weightKg,
  };
}

function normalizeCalculation(raw: PartnerClientCardioRawData["calculations"][number]): CardioCalculation {
  const activity = asActivity(raw.activityKey, "caminhada_leve");
  const comparisonActivity = asActivity(raw.comparisonActivityKey, "corrida_moderada");
  const targetZone = asZone(raw.targetZone, "z2");
  return {
    activity,
    comparisonActivity,
    comparisonKcalEstimate: round(Number(raw.comparisonKcalEstimate), 0),
    comparisonKcalPerMin: round(Number(raw.comparisonKcalPerMin), 1),
    createdAt: raw.createdAt,
    createdLabel: dateTimeFormatter.format(new Date(raw.createdAt)),
    durationMinutes: Number(raw.durationMinutes),
    id: raw.id,
    kcalEstimate: round(Number(raw.kcalEstimate), 0),
    kcalPerMin: round(Number(raw.kcalPerMin), 1),
    parameters: raw.parameters ?? {},
    targetZone,
    targetZoneLabel: cardioZoneLabels[targetZone],
    weightKg: Number(raw.weightKg),
  };
}

function normalizeSession(raw: PartnerClientCardioRawData["sessions"][number]): CardioSession {
  const targetZone = asZone(raw.targetZone, "z2");
  return {
    activity: asActivity(raw.activityKey, "caminhada_leve"),
    createdAt: raw.createdAt,
    dateLabel: dateFormatter.format(new Date(raw.performedAt)),
    durationMinutes: Number(raw.durationMinutes),
    id: raw.id,
    kcalEstimate: round(Number(raw.kcalEstimate), 0),
    notes: raw.notes,
    performedAt: raw.performedAt,
    targetZone,
    targetZoneLabel: cardioZoneLabels[targetZone],
  };
}

function predominantZone(sessions: CardioSession[], fallback: CardioZoneKey) {
  const totals = sessions.reduce<Record<CardioZoneKey, number>>((acc, session) => {
    acc[session.targetZone] += session.durationMinutes;
    return acc;
  }, { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 });
  const winner = validZoneKeys.reduce((best, zone) => (totals[zone] > totals[best] ? zone : best), fallback);
  return totals[winner] > 0 ? winner : fallback;
}

export function buildPartnerClientCardio(raw: PartnerClientCardioRawData, now = new Date()): PartnerClientCardioData {
  const plan = normalizePlan(raw.plan);
  const calculations = raw.calculations.map(normalizeCalculation);
  const latestCalculation = calculations[0] ?? null;
  const sessions = raw.sessions.map(normalizeSession);
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekSessions = sessions.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= weekStart && performedAt < weekEnd;
  });
  const completedMinutes = weekSessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const completedKcal = round(weekSessions.reduce((sum, session) => sum + session.kcalEstimate, 0), 0);
  const targetMinutes = plan?.weeklyTargetMinutes ?? 180;
  const targetZone = predominantZone(weekSessions, plan?.targetZone ?? "z2");
  const weightKg = plan?.weightKg ?? latestCalculation?.weightKg ?? 70;
  const primaryActivity = plan?.activity ?? latestCalculation?.activity ?? cardioActivities.caminhada_leve;
  const comparisonActivity = plan?.comparisonActivity ?? latestCalculation?.comparisonActivity ?? cardioActivities.corrida_moderada;
  const ageYears = calculateAgeYears(raw.patient.birthDate, now);

  return {
    calculations,
    comparison: buildCardioComparison(weightKg, primaryActivity.key, comparisonActivity.key),
    events: raw.events.map((event) => ({
      ...event,
      dateLabel: dateTimeFormatter.format(new Date(event.createdAt)),
    })),
    generatedAt: raw.generatedAt,
    heartRateZones: buildHeartRateZones(ageYears),
    latestCalculation,
    patient: {
      ageYears,
      birthDate: raw.patient.birthDate,
      maxHeartRate: 220 - (ageYears ?? 40),
    },
    plan,
    sessions,
    weekSummary: {
      completedKcal,
      completedMinutes,
      estimatedKcal: completedKcal || calculateCardioKcal(weightKg, primaryActivity.met, targetMinutes),
      progressPct: targetMinutes > 0 ? Math.min(100, Math.round((completedMinutes / targetMinutes) * 100)) : 0,
      targetMinutes,
      targetZone,
      targetZoneLabel: cardioZoneLabels[targetZone],
    },
  };
}
