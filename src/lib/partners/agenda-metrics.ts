import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type PartnerAgendaClientRow = {
  age_years: number | null;
  display_name: string;
  email: string;
  patient_id: string;
  phone: string | null;
  relationship_status: string;
  service_scopes: string[] | null;
};

export type PartnerAgendaAppointmentRecord = {
  appointment_type: string;
  avatar_url: string | null;
  birth_date: string | null;
  display_name: string;
  email: string;
  ends_at: string;
  gender: string | null;
  id: string;
  location_text: string | null;
  modality: string;
  notes: string | null;
  objective: string | null;
  patient_id: string;
  phone: string | null;
  reminder_minutes: number;
  starts_at: string;
  status: string;
  title: string;
};

export type PartnerAgendaBlockRecord = {
  ends_at: string;
  id: string;
  reason: string | null;
  starts_at: string;
  status: string;
  title: string;
};

export type PartnerAgendaRawData = {
  appointments: PartnerAgendaAppointmentRecord[];
  blocks: PartnerAgendaBlockRecord[];
  clients: PartnerAgendaClientRow[];
  partner: {
    id: string;
    professionalName: string;
    professionalType: string;
  } | null;
};

export type PartnerAgendaStatus = "scheduled" | "pending" | "completed" | "canceled" | "no_show";
export type PartnerAgendaModality = "online" | "presencial";
export type PartnerAgendaType = "consulta" | "avaliacao" | "retorno" | "reuniao" | "outro";

export type PartnerAgendaClient = {
  email: string;
  id: string;
  initial: string;
  name: string;
  phoneLabel: string;
  scopeLabel: string;
};

export type PartnerAgendaAppointment = {
  appointmentType: PartnerAgendaType;
  avatarUrl: string | null;
  client: {
    ageLabel: string;
    email: string;
    genderLabel: string;
    id: string;
    initial: string;
    name: string;
    objectiveLabel: string;
    phoneLabel: string;
  };
  dateKey: string;
  durationLabel: string;
  endsAt: string;
  id: string;
  locationLabel: string;
  modality: PartnerAgendaModality;
  modalityLabel: string;
  notes: string | null;
  reminderLabel: string;
  startsAt: string;
  status: PartnerAgendaStatus;
  statusLabel: string;
  timeLabel: string;
  title: string;
  typeLabel: string;
};

export type PartnerAgendaBlock = {
  dateKey: string;
  durationLabel: string;
  endsAt: string;
  id: string;
  reason: string | null;
  startsAt: string;
  status: "active" | "canceled";
  timeLabel: string;
  title: string;
};

export type PartnerAgendaMonthDay = {
  appointments: PartnerAgendaAppointment[];
  blocks: PartnerAgendaBlock[];
  date: string;
  dayLabel: string;
  disabled: boolean;
  isSelected: boolean;
  isToday: boolean;
};

export type PartnerAgendaWeekDay = {
  appointments: PartnerAgendaAppointment[];
  blocks: PartnerAgendaBlock[];
  date: string;
  dayNumber: string;
  isSelected: boolean;
  isToday: boolean;
  label: string;
};

export type PartnerAgendaSummary = {
  confirmedCount: number;
  freeHoursLabel: string;
  onlineCount: number;
  pendingCount: number;
  presencialCount: number;
  todayCount: number;
  totalCount: number;
};

export type PartnerAgendaData = {
  appointments: PartnerAgendaAppointment[];
  blocks: PartnerAgendaBlock[];
  clients: PartnerAgendaClient[];
  generatedAt: string;
  monthDays: PartnerAgendaMonthDay[];
  nextAppointments: PartnerAgendaAppointment[];
  partnerName: string;
  selectedDate: string;
  selectedDateLabel: string;
  selectedDayAppointments: PartnerAgendaAppointment[];
  selectedDayBlocks: PartnerAgendaBlock[];
  summary: PartnerAgendaSummary;
  weekDays: PartnerAgendaWeekDay[];
  weekLabel: string;
};

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const statusLabels: Record<PartnerAgendaStatus, string> = {
  canceled: "Cancelado",
  completed: "Concluído",
  no_show: "Ausente",
  pending: "Pendente",
  scheduled: "Confirmado",
};

const typeLabels: Record<PartnerAgendaType, string> = {
  avaliacao: "Avaliação",
  consulta: "Consulta",
  outro: "Outro",
  retorno: "Retorno",
  reuniao: "Reunião",
};

function normalizeStatus(value: string): PartnerAgendaStatus {
  if (value === "pending" || value === "completed" || value === "canceled" || value === "no_show") return value;
  return "scheduled";
}

function normalizeType(value: string): PartnerAgendaType {
  if (value === "avaliacao" || value === "retorno" || value === "reuniao" || value === "outro") return value;
  return "consulta";
}

function normalizeModality(value: string): PartnerAgendaModality {
  return value === "presencial" ? "presencial" : "online";
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

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || "C";
}

function dateKey(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function durationLabel(start: Date, end: Date) {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function reminderLabel(minutes: number) {
  if (minutes === 0) return "Sem lembrete";
  if (minutes === 1440) return "Enviar 1 dia antes";
  if (minutes >= 60) return `Enviar ${minutes / 60}h antes`;
  return `Enviar ${minutes} min antes`;
}

function serviceScopeSummary(scopes: string[] | null) {
  const labels: Record<string, string> = {
    dieta: "Dieta",
    saude: "Saúde",
    treino: "Treino",
  };
  const normalized = Array.from(new Set((scopes ?? []).map((scope) => (scope === "cardio" ? "treino" : scope)))).sort();
  if (normalized.length === 0) return "Sem escopo";
  return normalized.map((scope) => labels[scope] ?? scope).join(" + ");
}

function toAppointment(row: PartnerAgendaAppointmentRecord, now: Date): PartnerAgendaAppointment {
  const startsAt = new Date(row.starts_at);
  const endsAt = new Date(row.ends_at);
  const status = normalizeStatus(row.status);
  const appointmentType = normalizeType(row.appointment_type);
  const modality = normalizeModality(row.modality);

  return {
    appointmentType,
    avatarUrl: row.avatar_url,
    client: {
      ageLabel: ageLabel(row.birth_date, now),
      email: row.email,
      genderLabel: genderLabel(row.gender),
      id: row.patient_id,
      initial: initials(row.display_name),
      name: row.display_name,
      objectiveLabel: row.objective?.trim() || typeLabels[appointmentType],
      phoneLabel: row.phone?.trim() || "Sem telefone",
    },
    dateKey: dateKey(startsAt),
    durationLabel: durationLabel(startsAt, endsAt),
    endsAt: row.ends_at,
    id: row.id,
    locationLabel: row.location_text?.trim() || (modality === "online" ? "Online" : "Local a definir"),
    modality,
    modalityLabel: modality === "online" ? "Online" : "Presencial",
    notes: row.notes,
    reminderLabel: reminderLabel(row.reminder_minutes),
    startsAt: row.starts_at,
    status,
    statusLabel: statusLabels[status],
    timeLabel: `${timeFormatter.format(startsAt)} – ${timeFormatter.format(endsAt)}`,
    title: row.title,
    typeLabel: typeLabels[appointmentType],
  };
}

function toBlock(row: PartnerAgendaBlockRecord): PartnerAgendaBlock {
  const startsAt = new Date(row.starts_at);
  const endsAt = new Date(row.ends_at);

  return {
    dateKey: dateKey(startsAt),
    durationLabel: durationLabel(startsAt, endsAt),
    endsAt: row.ends_at,
    id: row.id,
    reason: row.reason,
    startsAt: row.starts_at,
    status: row.status === "canceled" ? "canceled" : "active",
    timeLabel: `${timeFormatter.format(startsAt)} – ${timeFormatter.format(endsAt)}`,
    title: row.title,
  };
}

function buildMonthDays(selectedDate: Date, appointments: PartnerAgendaAppointment[], blocks: PartnerAgendaBlock[]) {
  const monthStart = startOfWeek(startOfMonth(selectedDate), { locale: ptBR, weekStartsOn: 0 });
  const monthEnd = endOfWeek(endOfMonth(selectedDate), { locale: ptBR, weekStartsOn: 0 });

  return eachDayOfInterval({ end: monthEnd, start: monthStart }).map((day) => {
    const key = dateKey(day);
    return {
      appointments: appointments.filter((appointment) => appointment.dateKey === key),
      blocks: blocks.filter((block) => block.dateKey === key && block.status === "active"),
      date: key,
      dayLabel: format(day, "d", { locale: ptBR }),
      disabled: !isSameMonth(day, selectedDate),
      isSelected: isSameDay(day, selectedDate),
      isToday: isToday(day),
    };
  });
}

function buildWeekDays(selectedDate: Date, appointments: PartnerAgendaAppointment[], blocks: PartnerAgendaBlock[]) {
  const weekStart = startOfWeek(selectedDate, { locale: ptBR, weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { locale: ptBR, weekStartsOn: 1 });

  return eachDayOfInterval({ end: weekEnd, start: weekStart }).map((day) => {
    const key = dateKey(day);
    return {
      appointments: appointments.filter((appointment) => appointment.dateKey === key),
      blocks: blocks.filter((block) => block.dateKey === key && block.status === "active"),
      date: key,
      dayNumber: format(day, "d", { locale: ptBR }),
      isSelected: isSameDay(day, selectedDate),
      isToday: isToday(day),
      label: format(day, "EEE", { locale: ptBR }),
    };
  });
}

function freeHoursLabel(appointments: PartnerAgendaAppointment[], blocks: PartnerAgendaBlock[]) {
  const busyMinutes = [...appointments, ...blocks].reduce((sum, item) => {
    return sum + Math.max(0, new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60_000;
  }, 0);
  const freeMinutes = Math.max(0, 10 * 60 - busyMinutes);
  const hours = Math.floor(freeMinutes / 60);
  const minutes = freeMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function moveSelectedDate(selectedDate: string, view: "day" | "month" | "week", direction: -1 | 1) {
  const current = parseISO(`${selectedDate}T12:00:00`);
  const next = view === "month"
    ? (direction > 0 ? addMonths(current, 1) : subMonths(current, 1))
    : view === "week"
      ? (direction > 0 ? addWeeks(current, 1) : subWeeks(current, 1))
      : addDays(current, direction);
  return dateKey(next);
}

export function buildPartnerAgendaData(raw: PartnerAgendaRawData, now = new Date()): PartnerAgendaData {
  const selected = startOfDay(now);
  const selectedKey = dateKey(selected);
  const appointments = raw.appointments
    .map((appointment) => toAppointment(appointment, now))
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const blocks = raw.blocks
    .map(toBlock)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  const selectedDayAppointments = appointments.filter((appointment) => appointment.dateKey === selectedKey);
  const selectedDayBlocks = blocks.filter((block) => block.dateKey === selectedKey && block.status === "active");
  const nextAppointments = appointments.filter(
    (appointment) => appointment.status !== "canceled" && new Date(appointment.startsAt) >= now,
  ).slice(0, 6);

  return {
    appointments,
    blocks,
    clients: raw.clients
      .filter((client) => client.relationship_status === "active")
      .map((client) => ({
        email: client.email,
        id: client.patient_id,
        initial: initials(client.display_name),
        name: client.display_name,
        phoneLabel: client.phone?.trim() || "Sem telefone",
        scopeLabel: serviceScopeSummary(client.service_scopes),
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
    generatedAt: now.toISOString(),
    monthDays: buildMonthDays(selected, appointments, blocks),
    nextAppointments,
    partnerName: raw.partner?.professionalName ?? "Parceiro",
    selectedDate: selectedKey,
    selectedDateLabel: fullDateFormatter.format(selected),
    selectedDayAppointments,
    selectedDayBlocks,
    summary: {
      confirmedCount: appointments.filter((appointment) => appointment.status === "scheduled").length,
      freeHoursLabel: freeHoursLabel(selectedDayAppointments, selectedDayBlocks),
      onlineCount: appointments.filter((appointment) => appointment.modality === "online").length,
      pendingCount: appointments.filter((appointment) => appointment.status === "pending").length,
      presencialCount: appointments.filter((appointment) => appointment.modality === "presencial").length,
      todayCount: selectedDayAppointments.length,
      totalCount: appointments.length,
    },
    weekDays: buildWeekDays(selected, appointments, blocks),
    weekLabel: `${format(startOfWeek(selected, { locale: ptBR, weekStartsOn: 1 }), "dd", { locale: ptBR })} a ${format(endOfWeek(selected, { locale: ptBR, weekStartsOn: 1 }), "dd 'de' MMMM", { locale: ptBR })}`,
  };
}
