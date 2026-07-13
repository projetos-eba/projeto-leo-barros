export type ClientHealthRawData = {
  actions: Array<{
    completedAt: string | null;
    detail: string | null;
    key: string;
    status: string;
    time: string | null;
    title: string;
  }>;
  appointments: Array<{
    id: string;
    startsAt: string;
    status: string;
    title: string;
  }>;
  client: {
    avatarUrl: string | null;
    id: string;
    name: string;
    objective: string | null;
  } | null;
  dailyLog: {
    hydrationMl: number | string | null;
    sleepDeepMinutes: number | string | null;
    sleepEfficiencyPct: number | string | null;
    sleepLatencyMinutes: number | string | null;
    sleepMinutes: number | string | null;
  } | null;
  examResults: Array<{
    collectedAt: string;
    name: string;
    status: string;
    unit: string;
    value: number | string;
  }>;
  generatedAt: string;
  medications: Array<{
    dosage: string;
    id: string;
    logStatus: string | null;
    name: string;
    scheduleTime: string;
    takenAt: string | null;
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
  pressureLogs: Array<{
    diastolic: number | string;
    measuredAt: string;
    systolic: number | string;
  }>;
  selectedDate: string;
};

export type ClientHealthMedication = {
  dosage: string;
  id: string;
  name: string;
  scheduleLabel: string;
  status: "completed" | "pending";
  statusLabel: string;
};

export type ClientHealthAction = {
  completedAtLabel: string | null;
  detail: string | null;
  key: string;
  status: "completed" | "pending";
  statusLabel: string;
  timeLabel: string | null;
  title: string;
};

export type ClientHealthData = {
  achievements: Array<{ label: string; tone: "blue" | "green" | "orange"; value: string }>;
  actions: ClientHealthAction[];
  care: {
    completed: number;
    percent: number;
    total: number;
  };
  client: {
    avatarUrl: string | null;
    firstName: string;
    id: string;
    name: string;
    objectiveLabel: string;
  };
  exams: {
    alertCount: number;
    attention: Array<{ name: string; statusLabel: string; valueLabel: string }>;
    normal: Array<{ dateLabel: string; name: string; valueLabel: string }>;
    normalCount: number;
  };
  generatedAt: string;
  medications: {
    activeCount: number;
    completedCount: number;
    items: ClientHealthMedication[];
    pendingCount: number;
  };
  nextAction: ClientHealthAction | null;
  nextAppointment: {
    dateLabel: string;
    dayLabel: string;
    detailLabel: string;
    monthLabel: string;
    timeLabel: string;
    title: string;
  } | null;
  pressure: {
    averageLabel: string;
    daysCompleted: number;
    lastRecords: Array<{ dateLabel: string; valueLabel: string }>;
    points: Array<{ diastolic: number; label: string; systolic: number }>;
    protocolPercent: number;
    totalDays: number;
  };
  selectedDate: {
    iso: string;
    label: string;
  };
  sleep: {
    deepLabel: string;
    efficiency: number;
    latencyLabel: string;
    qualityLabel: string;
    totalLabel: string;
    trend: Array<{ label: string; percent: number }>;
  };
  timeline: Array<{
    dateLabel: string;
    detail: string;
    id: string;
    title: string;
    tone: "blue" | "green" | "orange" | "red";
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  weekday: "long",
});

const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Cliente";
}

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}min`;
  return `${hours}h${String(mins).padStart(2, "0")}min`;
}

function formatDateLabel(date: Date) {
  const [weekday, rest] = dateFormatter.format(date).split(", ");
  return `${rest}, ${weekday}`;
}

function statusLabel(status: string) {
  return status === "completed" ? "Concluída" : "Pendente";
}

function examStatusLabel(status: string) {
  if (status === "low") return "Baixo";
  if (status === "high") return "Atenção";
  if (status === "normal") return "Normal";
  return "Acompanhar";
}

function timelineTone(severity: string): ClientHealthData["timeline"][number]["tone"] {
  if (severity === "critical") return "red";
  if (severity === "attention") return "orange";
  if (severity === "normal") return "green";
  return "blue";
}

export function buildClientHealth(raw: ClientHealthRawData): ClientHealthData {
  const selectedDate = new Date(`${raw.selectedDate}T12:00:00`);
  const clientName = raw.client?.name ?? "Cliente";
  const actions = raw.actions.map<ClientHealthAction>((action) => {
    const status = action.status === "completed" ? "completed" : "pending";
    return {
      completedAtLabel: action.completedAt ? timeFormatter.format(new Date(action.completedAt)) : null,
      detail: action.detail,
      key: action.key,
      status,
      statusLabel: statusLabel(status),
      timeLabel: action.time,
      title: action.title,
    };
  });
  const completed = actions.filter((action) => action.status === "completed").length;
  const total = Math.max(actions.length, 1);
  const medications = raw.medications.map<ClientHealthMedication>((medication) => {
    const completedMedication = medication.logStatus === "completed";
    return {
      dosage: medication.dosage,
      id: medication.id,
      name: medication.name,
      scheduleLabel: medication.scheduleTime,
      status: completedMedication ? "completed" : "pending",
      statusLabel: completedMedication ? "Concluída" : "Pendente",
    };
  });
  const completedMeds = medications.filter((item) => item.status === "completed").length;
  const pressureRows = raw.pressureLogs.slice(0, 7).map((item) => ({
    date: new Date(item.measuredAt),
    diastolic: numberValue(item.diastolic),
    systolic: numberValue(item.systolic),
  }));
  const pressureAverage = pressureRows.length
    ? {
        diastolic: Math.round(pressureRows.reduce((sum, item) => sum + item.diastolic, 0) / pressureRows.length),
        systolic: Math.round(pressureRows.reduce((sum, item) => sum + item.systolic, 0) / pressureRows.length),
      }
    : { diastolic: 0, systolic: 0 };
  const sleepMinutes = numberValue(raw.dailyLog?.sleepMinutes) || 462;
  const sleepEfficiency = Math.round(numberValue(raw.dailyLog?.sleepEfficiencyPct) || 84);
  const attentionExams = raw.examResults.filter((exam) => exam.status === "low" || exam.status === "high").slice(0, 2);
  const normalExams = raw.examResults.filter((exam) => exam.status === "normal").slice(0, 2);
  const nextAppointment = raw.appointments.find((item) => item.status === "scheduled") ?? null;

  return {
    achievements: [
      { label: "Dias ativos", tone: "orange", value: "6" },
      { label: "Metas concluídas", tone: "green", value: `${Math.round((completed / total) * 100)}%` },
      { label: "Hábitos concluídos", tone: "orange", value: String(completed + completedMeds + 7) },
      { label: "Evolução geral", tone: "green", value: "+18%" },
    ],
    actions,
    care: {
      completed,
      percent: Math.round((completed / total) * 100),
      total,
    },
    client: {
      avatarUrl: raw.client?.avatarUrl ?? null,
      firstName: firstName(clientName),
      id: raw.client?.id ?? "cliente",
      name: clientName,
      objectiveLabel: raw.client?.objective ?? "Jornada integrada",
    },
    exams: {
      alertCount: attentionExams.length,
      attention: attentionExams.map((exam) => ({
        name: exam.name,
        statusLabel: examStatusLabel(exam.status),
        valueLabel: `${numberValue(exam.value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${exam.unit}`,
      })),
      normal: normalExams.map((exam) => ({
        dateLabel: shortDateFormatter.format(new Date(exam.collectedAt)),
        name: exam.name,
        valueLabel: `${numberValue(exam.value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${exam.unit}`,
      })),
      normalCount: normalExams.length,
    },
    generatedAt: raw.generatedAt,
    medications: {
      activeCount: medications.length,
      completedCount: completedMeds,
      items: medications,
      pendingCount: medications.length - completedMeds,
    },
    nextAction: actions.find((action) => action.status === "pending") ?? null,
    nextAppointment: nextAppointment
      ? {
          dateLabel: formatDateLabel(new Date(nextAppointment.startsAt)),
          dayLabel: dayFormatter.format(new Date(nextAppointment.startsAt)),
          detailLabel: "Ver detalhes",
          monthLabel: monthFormatter.format(new Date(nextAppointment.startsAt)).replace(".", ""),
          timeLabel: timeFormatter.format(new Date(nextAppointment.startsAt)),
          title: nextAppointment.title,
        }
      : null,
    pressure: {
      averageLabel: pressureRows.length ? `${pressureAverage.systolic} / ${pressureAverage.diastolic}` : "Sem registros",
      daysCompleted: Math.min(pressureRows.length, 7),
      lastRecords: pressureRows.slice(0, 3).map((item) => ({
        dateLabel: `${shortDateFormatter.format(item.date)} · ${timeFormatter.format(item.date)}`,
        valueLabel: `${item.systolic} / ${item.diastolic}`,
      })),
      points: pressureRows.slice().reverse().map((item) => ({
        diastolic: item.diastolic,
        label: weekdayFormatter.format(item.date),
        systolic: item.systolic,
      })),
      protocolPercent: Math.round((Math.min(pressureRows.length, 7) / 7) * 100),
      totalDays: 7,
    },
    selectedDate: {
      iso: raw.selectedDate,
      label: formatDateLabel(selectedDate),
    },
    sleep: {
      deepLabel: minutesLabel(numberValue(raw.dailyLog?.sleepDeepMinutes) || 72),
      efficiency: sleepEfficiency,
      latencyLabel: minutesLabel(numberValue(raw.dailyLog?.sleepLatencyMinutes) || 12),
      qualityLabel: sleepEfficiency >= 80 ? "Muito bom" : "Ajustar rotina",
      totalLabel: minutesLabel(sleepMinutes),
      trend: [82, 76, 84, 78, 81, 88, sleepEfficiency].map((percent, index) => ({
        label: ["Sex", "Sáb", "Dom", "Seg", "Ter", "Qua", "Hoje"][index] ?? "Dia",
        percent,
      })),
    },
    timeline: raw.observations.slice(0, 4).map((item) => ({
      dateLabel: shortDateFormatter.format(new Date(item.occurredAt)),
      detail: item.value ? `${item.detail ?? "Registro atualizado."} · ${item.value}` : (item.detail ?? "Registro atualizado."),
      id: item.id,
      title: item.title,
      tone: timelineTone(item.severity),
    })),
  };
}
