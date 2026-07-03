export type ClientHomeRawData = {
  appointments: Array<{
    startsAt: string;
    status: string;
    title: string;
  }>;
  client: {
    avatarUrl: string | null;
    displayName: string;
    objective: string | null;
    patientId: string;
  };
  measurements: Array<{
    bodyFatPercentage: number | null;
    measuredAt: string;
    weightKg: number | null;
  }>;
  serviceScopes: string[];
  subscription: {
    currentPeriodEnd: string;
    status: string;
  } | null;
};

export type ClientHomeData = {
  client: {
    avatarUrl: string | null;
    firstName: string;
    id: string;
    initial: string;
    name: string;
    objectiveLabel: string;
  };
  latestMetrics: {
    bodyFatLabel: string;
    measuredAtLabel: string;
    weightLabel: string;
  } | null;
  modules: {
    dieta: boolean;
    saude: boolean;
    treino: boolean;
  };
  nextAppointment: {
    dateLabel: string;
    dayLabel: string;
    monthLabel: string;
    timeLabel: string;
    title: string;
  } | null;
  subscription: {
    daysUntilRenewal: number | null;
    renewalDateLabel: string;
    statusLabel: string;
  } | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Cliente";
}

function initial(name: string) {
  return firstName(name).slice(0, 1).toUpperCase() || "C";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function daysUntil(value: string, now: Date) {
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

function statusLabel(status: string) {
  return {
    active: "Plano ativo",
    past_due: "Pagamento pendente",
    pending: "Plano em ativação",
  }[status] ?? "Plano vigente";
}

export function buildClientHome(raw: ClientHomeRawData, now = new Date()): ClientHomeData {
  const scopes = new Set(raw.serviceScopes);
  const appointment = raw.appointments
    .filter((item) => item.status === "scheduled")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  const measurement = raw.measurements
    .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];

  return {
    client: {
      avatarUrl: raw.client.avatarUrl,
      firstName: firstName(raw.client.displayName),
      id: raw.client.patientId,
      initial: initial(raw.client.displayName),
      name: raw.client.displayName,
      objectiveLabel: raw.client.objective ?? "Jornada integrada",
    },
    latestMetrics: measurement
      ? {
          bodyFatLabel:
            measurement.bodyFatPercentage === null
              ? "Sem gordura registrada"
              : `${formatNumber(measurement.bodyFatPercentage)}% gordura`,
          measuredAtLabel: dateFormatter.format(new Date(measurement.measuredAt)),
          weightLabel:
            measurement.weightKg === null
              ? "Sem peso registrado"
              : `${formatNumber(measurement.weightKg)} kg`,
        }
      : null,
    modules: {
      dieta: scopes.has("dieta"),
      saude: Boolean(appointment || measurement),
      treino: scopes.has("treino"),
    },
    nextAppointment: appointment
      ? {
          dateLabel: dateFormatter.format(new Date(appointment.startsAt)),
          dayLabel: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(appointment.startsAt)),
          monthLabel: monthFormatter.format(new Date(appointment.startsAt)).replace(".", ""),
          timeLabel: timeFormatter.format(new Date(appointment.startsAt)),
          title: appointment.title,
        }
      : null,
    subscription: raw.subscription
      ? {
          daysUntilRenewal: daysUntil(raw.subscription.currentPeriodEnd, now),
          renewalDateLabel: dateFormatter.format(new Date(raw.subscription.currentPeriodEnd)),
          statusLabel: statusLabel(raw.subscription.status),
        }
      : null,
  };
}
