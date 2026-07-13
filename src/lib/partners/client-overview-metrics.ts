export type PartnerClientOverviewRawData = {
  adherence: Array<{
    dietPercentage: number | null;
    id: string;
    periodEnd: string;
    periodStart: string;
    trainingPercentage: number | null;
  }>;
  appointments: Array<{
    endsAt: string;
    id: string;
    notes: string | null;
    startsAt: string;
    status: string;
    title: string;
  }>;
  events: Array<{
    createdAt: string;
    detail: string;
    id: string;
    title: string;
    type: string;
  }>;
  goals: {
    adherenceTargetPct: number;
    targetBodyFatMaxPct: number | null;
    targetBodyFatMinPct: number | null;
    targetWeightKg: number | null;
  } | null;
  identity: {
    avatarUrl: string | null;
    birthDate: string | null;
    displayName: string;
    email: string;
    gender: string | null;
    objective: string | null;
    patientId: string;
    phone: string | null;
    profileId: string;
    serviceScopes: string[];
    startedAt: string;
    status: string;
  };
  measurements: Array<{
    bodyFatPercentage: number | null;
    id: string;
    measuredAt: string;
    notes: string | null;
    weightKg: number | null;
  }>;
  observations: Array<{
    detail: string | null;
    id: string;
    occurredAt: string;
    severity: string;
    title: string;
    type: string;
    value: string | null;
  }>;
  planModules: Array<{
    id: string;
    primarySummary: string;
    secondarySummary: string | null;
    title: string;
    type: string;
  }>;
  subscription: {
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string;
    currentPeriodStart: string;
    id: string;
    planDescription: string | null;
    planId: string;
    planName: string;
    status: string;
  } | null;
  tasks: Array<{
    completedAt: string | null;
    createdAt: string;
    dueAt: string | null;
    id: string;
    priority: string;
    status: string;
    title: string;
  }>;
};

export type PartnerClientOverviewAlert = {
  dateLabel: string;
  detail: string;
  id: string;
  severity: "attention" | "critical";
  title: string;
};

export type PartnerClientOverviewHistoryItem = {
  dateLabel: string;
  detail: string;
  id: string;
  occurredAt: string;
  title: string;
  tone: "blue" | "green" | "amber" | "red" | "slate";
};

export type PartnerClientOverviewTask = {
  dueLabel: string;
  id: string;
  priority: "low" | "medium" | "high";
  priorityLabel: string;
  status: "pending" | "completed";
  title: string;
};

export type PartnerClientOverviewData = {
  adherenceTarget: number;
  adherenceWeeks: Array<{
    dietDelta: number | null;
    dietPercentage: number | null;
    id: string;
    label: string;
    periodStart: string;
    trainingDelta: number | null;
    trainingPercentage: number | null;
  }>;
  alerts: PartnerClientOverviewAlert[];
  bodyFat: {
    delta: number | null;
    targetLabel: string;
    value: number | null;
  };
  bodyMeasurements: Array<{
    bodyFatPercentage: number | null;
    fatMassKg: number | null;
    id: string;
    label: string;
    leanMassKg: number | null;
    measuredAt: string;
    weightKg: number | null;
  }>;
  client: {
    ageLabel: string;
    avatarUrl: string | null;
    birthDateLabel: string;
    email: string;
    genderLabel: string;
    id: string;
    initial: string;
    name: string;
    objectiveLabel: string;
    phoneDigits: string | null;
    phoneLabel: string;
    planPeriodLabel: string;
    serviceScopes: string[];
    status: "active" | "inactive" | "pending" | "suspended";
    statusLabel: string;
  };
  generalAdherence: {
    delta: number | null;
    value: number | null;
  };
  generatedAt: string;
  history: PartnerClientOverviewHistoryItem[];
  nextAppointment: {
    dateLabel: string;
    daysLabel: string;
    id: string;
    startsAt: string;
    timeLabel: string;
    title: string;
  } | null;
  plan: {
    description: string | null;
    modules: Array<{
      id: string;
      primarySummary: string;
      secondarySummary: string | null;
      title: string;
      type: "dieta" | "saude" | "treino";
    }>;
    name: string;
    renewalLabel: string;
  } | null;
  recentRecords: Array<{
    dateLabel: string;
    id: string;
    severity: "normal" | "info" | "attention" | "critical";
    title: string;
    type: string;
    value: string;
  }>;
  tasks: PartnerClientOverviewTask[];
  weight: {
    delta: number | null;
    target: number | null;
    value: number | null;
  };
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function parseStatus(value: string): PartnerClientOverviewData["client"]["status"] {
  if (value === "active" || value === "pending" || value === "suspended") return value;
  return "inactive";
}

function statusLabel(status: PartnerClientOverviewData["client"]["status"]) {
  return {
    active: "Ativo",
    inactive: "Inativo",
    pending: "Pendente",
    suspended: "Suspenso",
  }[status];
}

function genderLabel(value: string | null) {
  return {
    female: "Feminino",
    male: "Masculino",
    non_binary: "Não binário",
    not_informed: "Não informado",
    other: "Outro",
  }[value ?? "not_informed"] ?? "Não informado";
}

function ageLabel(value: string | null, now: Date) {
  if (!value) return "Não informada";
  const birthDate = new Date(`${value}T12:00:00`);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDifference = now.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return `${age} anos`;
}

function delta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return roundOne(current - previous);
}

function average(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
}

function formatRelativeDate(value: string | null, now: Date) {
  if (!value) return "Sem prazo";
  const target = new Date(value);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((targetDay.getTime() - nowDay.getTime()) / 86_400_000);
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days === -1) return "Ontem";
  if (days < 0) return `${Math.abs(days)} dias em atraso`;
  return dateFormatter.format(target);
}

function normalizeScopes(scopes: string[]) {
  return Array.from(new Set(scopes.map((scope) => (scope === "cardio" ? "treino" : scope)))).sort();
}

function normalizeModuleTitle(type: string, title: string) {
  return type === "cardio" ? "Treino" : title;
}

function observationTone(severity: string): PartnerClientOverviewHistoryItem["tone"] {
  if (severity === "critical") return "red";
  if (severity === "attention") return "amber";
  if (severity === "normal") return "green";
  return "blue";
}

export function buildPartnerClientOverview(
  raw: PartnerClientOverviewRawData,
  now = new Date(),
): PartnerClientOverviewData {
  const measurements = [...raw.measurements].sort(
    (left, right) => new Date(left.measuredAt).getTime() - new Date(right.measuredAt).getTime(),
  );
  const latestMeasurement = measurements.at(-1) ?? null;
  const previousMeasurement = measurements.at(-2) ?? null;
  const adherence = [...raw.adherence].sort(
    (left, right) => new Date(left.periodStart).getTime() - new Date(right.periodStart).getTime(),
  );
  const latestAdherence = adherence.at(-1) ?? null;
  const previousAdherence = adherence.at(-2) ?? null;
  const serviceScopes = normalizeScopes(raw.identity.serviceScopes ?? []);
  const activeAdherenceValues = serviceScopes.length
    ? [
        serviceScopes.includes("dieta") ? latestAdherence?.dietPercentage ?? null : null,
        serviceScopes.includes("treino") ? latestAdherence?.trainingPercentage ?? null : null,
      ]
    : [
        latestAdherence?.dietPercentage ?? null,
        latestAdherence?.trainingPercentage ?? null,
      ];
  const previousAdherenceValues = serviceScopes.length
    ? [
        serviceScopes.includes("dieta") ? previousAdherence?.dietPercentage ?? null : null,
        serviceScopes.includes("treino") ? previousAdherence?.trainingPercentage ?? null : null,
      ]
    : [
        previousAdherence?.dietPercentage ?? null,
        previousAdherence?.trainingPercentage ?? null,
      ];
  const generalAdherenceValue = average(activeAdherenceValues);
  const previousGeneralAdherence = average(previousAdherenceValues);
  const adherenceTarget = raw.goals?.adherenceTargetPct ?? 80;

  const observations = [...raw.observations].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
  const alerts: PartnerClientOverviewAlert[] = observations
    .filter((item) => item.severity === "attention" || item.severity === "critical")
    .map((item) => ({
      dateLabel: dateFormatter.format(new Date(item.occurredAt)),
      detail: item.detail ?? item.value ?? "Registro requer atenção.",
      id: `observation-${item.id}`,
      severity: item.severity as "attention" | "critical",
      title: item.title,
    }));

  if (generalAdherenceValue !== null && generalAdherenceValue < adherenceTarget) {
    alerts.push({
      dateLabel: formatRelativeDate(latestAdherence?.periodEnd ?? null, now),
      detail: `Adesão geral em ${generalAdherenceValue}%, abaixo da meta de ${adherenceTarget}%.`,
      id: "adherence-below-target",
      severity: generalAdherenceValue < adherenceTarget - 15 ? "critical" : "attention",
      title: "Adesão abaixo da meta",
    });
  }

  raw.tasks
    .filter(
      (task) =>
        task.status === "pending" &&
        task.priority === "high" &&
        task.dueAt !== null &&
        new Date(task.dueAt) < now,
    )
    .forEach((task) => {
      alerts.push({
        dateLabel: formatRelativeDate(task.dueAt, now),
        detail: "Tarefa de alta prioridade está vencida.",
        id: `task-${task.id}`,
        severity: "attention",
        title: task.title,
      });
    });

  const nextAppointment = [...raw.appointments]
    .filter((appointment) => appointment.status === "scheduled" && new Date(appointment.startsAt) >= now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())[0] ?? null;

  const status = parseStatus(raw.identity.status);
  const planPeriodLabel = raw.subscription
    ? `${dateFormatter.format(new Date(raw.subscription.currentPeriodStart))} – ${dateFormatter.format(new Date(raw.subscription.currentPeriodEnd))}`
    : "Sem plano vigente";
  const phoneDigits = raw.identity.phone?.replace(/\D/g, "") || null;

  const history: PartnerClientOverviewHistoryItem[] = [
    ...raw.events.map((event) => ({
      dateLabel: dateFormatter.format(new Date(event.createdAt)),
      detail: event.detail,
      id: `event-${event.id}`,
      occurredAt: event.createdAt,
      title: event.title,
      tone: "blue" as const,
    })),
    ...raw.observations.map((observation) => ({
      dateLabel: dateFormatter.format(new Date(observation.occurredAt)),
      detail: observation.detail ?? observation.value ?? "Registro atualizado.",
      id: `observation-${observation.id}`,
      occurredAt: observation.occurredAt,
      title: observation.title,
      tone: observationTone(observation.severity),
    })),
    ...raw.appointments.map((appointment) => ({
      dateLabel: dateFormatter.format(new Date(appointment.startsAt)),
      detail: appointment.status === "completed" ? "Consulta concluída." : "Consulta agendada.",
      id: `appointment-${appointment.id}`,
      occurredAt: appointment.startsAt,
      title: appointment.title,
      tone: appointment.status === "completed" ? "green" as const : "blue" as const,
    })),
    ...raw.tasks.map((task) => ({
      dateLabel: dateFormatter.format(new Date(task.completedAt ?? task.createdAt)),
      detail: task.status === "completed" ? "Tarefa concluída." : `Prioridade ${task.priority}.`,
      id: `task-${task.id}`,
      occurredAt: task.completedAt ?? task.createdAt,
      title: task.title,
      tone: task.status === "completed" ? "green" as const : "slate" as const,
    })),
  ].sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime());

  return {
    adherenceTarget,
    adherenceWeeks: adherence.map((snapshot, index) => ({
      dietDelta: delta(snapshot.dietPercentage, adherence[index - 1]?.dietPercentage ?? null),
      dietPercentage: snapshot.dietPercentage,
      id: snapshot.id,
      label: index === adherence.length - 1 ? "Esta semana" : `Semana de ${dateFormatter.format(new Date(`${snapshot.periodStart}T12:00:00`))}`,
      periodStart: snapshot.periodStart,
      trainingDelta: delta(snapshot.trainingPercentage, adherence[index - 1]?.trainingPercentage ?? null),
      trainingPercentage: snapshot.trainingPercentage,
    })),
    alerts,
    bodyFat: {
      delta: delta(latestMeasurement?.bodyFatPercentage ?? null, previousMeasurement?.bodyFatPercentage ?? null),
      targetLabel:
        raw.goals?.targetBodyFatMinPct != null && raw.goals?.targetBodyFatMaxPct != null
          ? `${raw.goals.targetBodyFatMinPct}–${raw.goals.targetBodyFatMaxPct}%`
          : "Não definida",
      value: latestMeasurement?.bodyFatPercentage ?? null,
    },
    bodyMeasurements: measurements.map((measurement) => {
      const weight = measurement.weightKg;
      const fatPercentage = measurement.bodyFatPercentage;
      const fatMass = weight !== null && fatPercentage !== null ? roundOne(weight * fatPercentage / 100) : null;
      const leanMass = weight !== null && fatMass !== null ? roundOne(weight - fatMass) : null;

      return {
        bodyFatPercentage: fatPercentage,
        fatMassKg: fatMass,
        id: measurement.id,
        label: shortDateFormatter.format(new Date(measurement.measuredAt)),
        leanMassKg: leanMass,
        measuredAt: measurement.measuredAt,
        weightKg: weight,
      };
    }),
    client: {
      ageLabel: ageLabel(raw.identity.birthDate, now),
      avatarUrl: raw.identity.avatarUrl,
      birthDateLabel: raw.identity.birthDate
        ? dateFormatter.format(new Date(`${raw.identity.birthDate}T12:00:00`))
        : "Não informado",
      email: raw.identity.email,
      genderLabel: genderLabel(raw.identity.gender),
      id: raw.identity.patientId,
      initial: raw.identity.displayName.trim().charAt(0).toUpperCase() || "C",
      name: raw.identity.displayName,
      objectiveLabel: raw.identity.objective?.trim() || "Não informado",
      phoneDigits,
      phoneLabel: raw.identity.phone?.trim() || "Não informado",
      planPeriodLabel,
      serviceScopes,
      status,
      statusLabel: statusLabel(status),
    },
    generalAdherence: {
      delta: delta(generalAdherenceValue, previousGeneralAdherence),
      value: generalAdherenceValue,
    },
    generatedAt: now.toISOString(),
    history,
    nextAppointment: nextAppointment
      ? {
          dateLabel: dateFormatter.format(new Date(nextAppointment.startsAt)),
          daysLabel: formatRelativeDate(nextAppointment.startsAt, now),
          id: nextAppointment.id,
          startsAt: nextAppointment.startsAt,
          timeLabel: `${weekdayFormatter.format(new Date(nextAppointment.startsAt))} • ${timeFormatter.format(new Date(nextAppointment.startsAt))}`,
          title: nextAppointment.title,
        }
      : null,
    plan: raw.subscription
      ? {
          description: raw.subscription.planDescription,
          modules: raw.planModules.map((module) => ({
            id: module.id,
            primarySummary: module.primarySummary,
            secondarySummary: module.secondarySummary,
            title: normalizeModuleTitle(module.type, module.title),
            type: (module.type === "cardio" ? "treino" : module.type) as "dieta" | "saude" | "treino",
          })),
          name: raw.subscription.planName,
          renewalLabel: formatRelativeDate(raw.subscription.currentPeriodEnd, now),
        }
      : null,
    recentRecords: observations.slice(0, 3).map((observation) => ({
      dateLabel: `${dateFormatter.format(new Date(observation.occurredAt))} • ${timeFormatter.format(new Date(observation.occurredAt))}`,
      id: observation.id,
      severity: observation.severity as "normal" | "info" | "attention" | "critical",
      title: observation.title,
      type: observation.type,
      value: observation.value ?? "Sem valor",
    })),
    tasks: raw.tasks
      .filter((task) => task.status !== "canceled")
      .map((task) => ({
        dueLabel: formatRelativeDate(task.dueAt, now),
        id: task.id,
        priority: task.priority as "low" | "medium" | "high",
        priorityLabel: { high: "Alta", low: "Baixa", medium: "Média" }[task.priority] ?? "Média",
        status: task.status === "completed" ? "completed" : "pending",
        title: task.title,
      })),
    weight: {
      delta: delta(latestMeasurement?.weightKg ?? null, previousMeasurement?.weightKg ?? null),
      target: raw.goals?.targetWeightKg ?? null,
      value: latestMeasurement?.weightKg ?? null,
    },
  };
}
