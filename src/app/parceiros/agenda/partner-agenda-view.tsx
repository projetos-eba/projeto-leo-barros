"use client";

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
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Lock,
  MapPin,
  Plus,
  RotateCcw,
  Save,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  createPartnerAgendaAppointment,
  createPartnerCalendarBlock,
  setPartnerAgendaAppointmentStatus,
  setPartnerCalendarBlockCanceled,
  updatePartnerAgendaAppointment,
} from "./actions";
import {
  type PartnerAgendaAppointment,
  type PartnerAgendaBlock,
  type PartnerAgendaClient,
  type PartnerAgendaData,
  type PartnerAgendaModality,
  type PartnerAgendaStatus,
  type PartnerAgendaType,
} from "@/lib/partners/agenda-metrics";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type PartnerAgendaViewProps = {
  agenda: PartnerAgendaData;
};

type AgendaViewMode = "month" | "week" | "day";
type FilterMode = "all" | PartnerAgendaModality | "pending";
type DrawerMode = "appointment" | "block";

type AppointmentFormFields = {
  appointmentId: string | null;
  appointmentType: PartnerAgendaType;
  date: string;
  durationMinutes: number;
  locationText: string;
  modality: PartnerAgendaModality;
  notes: string;
  patientId: string;
  reminderMinutes: 0 | 10 | 15 | 30 | 60 | 120 | 1440;
  status: PartnerAgendaStatus;
  time: string;
  title: string;
};

type BlockFormFields = {
  blockId: string | null;
  date: string;
  durationMinutes: number;
  reason: string;
  time: string;
  title: string;
};

const hours = Array.from({ length: 12 }, (_, index) => index + 7);
const monthWeekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const weekLegend = [
  { className: "bg-[#2d9cff]", label: "Consulta online" },
  { className: "bg-[#f7a81b]", label: "Consulta presencial" },
  { className: "bg-[#7c8794]", label: "Avaliação" },
  { className: "bg-[#2ec27e]", label: "Retorno" },
  { className: "bg-[#8b5cf6]", label: "Reunião/Outros" },
  { className: "bg-[#7f8fa0]", label: "Bloqueio" },
];

const statusClasses: Record<PartnerAgendaStatus, string> = {
  canceled: "border-[#7d3439] bg-[#31151b] text-[#ff7b8e]",
  completed: "border-[#1f5f38] bg-[#0c2b1d] text-[#58d881]",
  no_show: "border-[#5c5641] bg-[#2d2b21] text-[#d8c37f]",
  pending: "border-[#5a4420] bg-[#2b2417] text-[#f0c76a]",
  scheduled: "border-[#1f5f38] bg-[#0c2b1d] text-[#58d881]",
};

const typeColorClasses: Record<PartnerAgendaType, string> = {
  avaliacao: "border-[#6f7c89] bg-[#26303a]",
  consulta: "border-[#1d7ece] bg-[#123f68]",
  outro: "border-[#7c5fd6] bg-[#30235f]",
  retorno: "border-[#268e5d] bg-[#123f2a]",
  reuniao: "border-[#7c5fd6] bg-[#30235f]",
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[14px] border border-[#314353]/75 bg-[linear-gradient(135deg,rgba(7,22,32,0.92),rgba(12,34,48,0.68))] shadow-[0_18px_55px_rgba(0,0,0,0.18)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-[8px] border border-[#2b3d4b] bg-[#111b27] text-[#b8c4cf] transition-colors hover:border-[#1d7ece] hover:text-white sm:size-10 sm:rounded-[10px]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "h-9 rounded-[7px] px-3 text-[12px] font-medium transition-colors sm:h-10 sm:rounded-[8px] sm:px-5 sm:text-[14px]",
        active ? "bg-[#0a4b7d] text-[#68afe9]" : "text-[#b4c0cb] hover:bg-[#102635] hover:text-white",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function formatDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseDateKey(date: string) {
  return parseISO(`${date}T12:00:00`);
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getPeriodLabel(viewMode: AgendaViewMode, selectedDate: string) {
  const date = parseDateKey(selectedDate);
  if (viewMode === "month") return format(date, "MMMM yyyy", { locale: ptBR });
  if (viewMode === "week") {
    const start = startOfWeek(date, { locale: ptBR, weekStartsOn: 1 });
    const end = endOfWeek(date, { locale: ptBR, weekStartsOn: 1 });
    return `${format(start, "dd", { locale: ptBR })} a ${format(end, "dd 'de' MMMM, yyyy", { locale: ptBR })}`;
  }
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function moveDate(dateKey: string, viewMode: AgendaViewMode, direction: -1 | 1) {
  const date = parseDateKey(dateKey);
  const next = viewMode === "month"
    ? (direction > 0 ? addMonths(date, 1) : subMonths(date, 1))
    : viewMode === "week"
      ? (direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1))
      : (direction > 0 ? addDays(date, 1) : subDays(date, 1));
  return formatDateKey(next);
}

function buildMonthDays(
  selectedDate: string,
  appointments: PartnerAgendaAppointment[],
  blocks: PartnerAgendaBlock[],
) {
  const selected = parseDateKey(selectedDate);
  const start = startOfWeek(startOfMonth(selected), { locale: ptBR, weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(selected), { locale: ptBR, weekStartsOn: 0 });
  return eachDayOfInterval({ end, start }).map((day) => {
    const key = formatDateKey(day);
    return {
      appointments: appointments.filter((appointment) => appointment.dateKey === key),
      blocks: blocks.filter((block) => block.dateKey === key && block.status === "active"),
      date: key,
      disabled: !isSameMonth(day, selected),
      isSelected: isSameDay(day, selected),
      isToday: isToday(day),
      label: format(day, "d", { locale: ptBR }),
    };
  });
}

function buildWeekDays(
  selectedDate: string,
  appointments: PartnerAgendaAppointment[],
  blocks: PartnerAgendaBlock[],
) {
  const selected = parseDateKey(selectedDate);
  const start = startOfWeek(selected, { locale: ptBR, weekStartsOn: 1 });
  const end = endOfWeek(selected, { locale: ptBR, weekStartsOn: 1 });
  return eachDayOfInterval({ end, start }).map((day) => {
    const key = formatDateKey(day);
    return {
      appointments: appointments.filter((appointment) => appointment.dateKey === key),
      blocks: blocks.filter((block) => block.dateKey === key && block.status === "active"),
      date: key,
      isSelected: isSameDay(day, selected),
      isToday: isToday(day),
      label: format(day, "EEE", { locale: ptBR }),
      number: format(day, "d", { locale: ptBR }),
    };
  });
}

function minutesFromDayStart(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function eventTop(value: string) {
  return Math.max(0, ((minutesFromDayStart(value) - 7 * 60) / (12 * 60)) * 100);
}

function eventHeight(start: string, end: string) {
  return Math.max(7, ((new Date(end).getTime() - new Date(start).getTime()) / 60_000 / (12 * 60)) * 100);
}

function defaultAppointmentFields(date: string, clients: PartnerAgendaClient[]): AppointmentFormFields {
  return {
    appointmentId: null,
    appointmentType: "consulta",
    date,
    durationMinutes: 50,
    locationText: "",
    modality: "online",
    notes: "",
    patientId: clients[0]?.id ?? "",
    reminderMinutes: 30,
    status: "scheduled",
    time: "14:00",
    title: "Consulta de acompanhamento",
  };
}

function appointmentToFields(appointment: PartnerAgendaAppointment): AppointmentFormFields {
  return {
    appointmentId: appointment.id,
    appointmentType: appointment.appointmentType,
    date: appointment.dateKey,
    durationMinutes: Math.max(15, Math.round((new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime()) / 60_000)),
    locationText: appointment.locationLabel === "Online" || appointment.locationLabel === "Local a definir" ? "" : appointment.locationLabel,
    modality: appointment.modality,
    notes: appointment.notes ?? "",
    patientId: appointment.client.id,
    reminderMinutes: appointment.reminderLabel.includes("1 dia") ? 1440 : appointment.reminderLabel.includes("2h") ? 120 : appointment.reminderLabel.includes("1h") ? 60 : appointment.reminderLabel.includes("15") ? 15 : appointment.reminderLabel.includes("10") ? 10 : appointment.reminderLabel.includes("Sem") ? 0 : 30,
    status: appointment.status,
    time: format(new Date(appointment.startsAt), "HH:mm"),
    title: appointment.title,
  };
}

function defaultBlockFields(date: string): BlockFormFields {
  return {
    blockId: null,
    date,
    durationMinutes: 60,
    reason: "",
    time: "12:00",
    title: "Horário bloqueado",
  };
}

function buildIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function StatusBadge({ status, label }: { label: string; status: PartnerAgendaStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusClasses[status])}>
      {label}
    </span>
  );
}

function ModalityIcon({ modality }: { modality: PartnerAgendaModality }) {
  return modality === "online" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />;
}

function AppointmentPill({ appointment, onSelect }: { appointment: PartnerAgendaAppointment; onSelect?: () => void }) {
  return (
    <button
      className={cn(
        "max-w-full truncate rounded-[6px] border px-2 py-1 text-left text-[11px] leading-4 text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)]",
        typeColorClasses[appointment.appointmentType],
      )}
      onClick={onSelect}
      type="button"
    >
      {appointment.title}
    </button>
  );
}

function MonthView({
  appointments,
  blocks,
  onSelectAppointment,
  selectedDate,
  setSelectedDate,
}: {
  appointments: PartnerAgendaAppointment[];
  blocks: PartnerAgendaBlock[];
  onSelectAppointment: (appointment: PartnerAgendaAppointment) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}) {
  const days = buildMonthDays(selectedDate, appointments, blocks);

  return (
    <Panel className="p-5 lg:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[22px] font-bold capitalize leading-8 text-white">{format(parseDateKey(selectedDate), "MMMM yyyy", { locale: ptBR })}</h2>
        <div className="flex gap-2">
          <IconButton label="Mês anterior" onClick={() => setSelectedDate(moveDate(selectedDate, "month", -1))}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton label="Próximo mês" onClick={() => setSelectedDate(moveDate(selectedDate, "month", 1))}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-[12px] border border-[#263747]">
        {monthWeekdays.map((weekday) => (
          <div className="border-b border-[#263747] px-2 py-3 text-center text-[13px] font-semibold text-[#a8b5c2]" key={weekday}>
            {weekday}
          </div>
        ))}
        {days.map((day) => (
          <div
            className={cn(
              "min-h-[104px] border-b border-r border-[#263747] p-3 text-left transition-colors hover:bg-[#102635]/70",
              day.disabled && "text-[#536273]",
              day.isSelected && "bg-[#0a2c48]/70",
            )}
            key={day.date}
          >
            <button
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full text-[15px] font-semibold",
                day.isToday ? "bg-[#1d7ece] text-white" : "text-[#d7dae0]",
              )}
              onClick={() => setSelectedDate(day.date)}
              type="button"
            >
              {day.label}
            </button>
            <div className="mt-3 flex flex-col gap-1.5">
              {day.appointments.slice(0, 2).map((appointment) => (
                <AppointmentPill appointment={appointment} key={appointment.id} onSelect={() => onSelectAppointment(appointment)} />
              ))}
              {day.blocks.length > 0 ? (
                <span className="truncate rounded-[6px] border border-[#435160] bg-[#1b2530] px-2 py-1 text-[11px] text-[#aeb9c4]">
                  {day.blocks.length} bloqueio{day.blocks.length > 1 ? "s" : ""}
                </span>
              ) : null}
              {day.appointments.length > 2 ? (
                <span className="text-[11px] font-medium text-[#68afe9]">+{day.appointments.length - 2} compromissos</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function WeekView({
  appointments,
  blocks,
  onSelectAppointment,
  selectedDate,
}: {
  appointments: PartnerAgendaAppointment[];
  blocks: PartnerAgendaBlock[];
  onSelectAppointment: (appointment: PartnerAgendaAppointment) => void;
  selectedDate: string;
}) {
  const days = buildWeekDays(selectedDate, appointments, blocks);

  return (
    <Panel className="overflow-hidden p-5 lg:p-6">
      <div className="grid min-w-[860px] grid-cols-[58px_repeat(7,minmax(104px,1fr))]">
        <div />
        {days.map((day) => (
          <div className="pb-5 text-center" key={day.date}>
            <span className="text-[14px] font-semibold capitalize text-white">{day.label}</span>
            <span className={cn("ml-2 inline-flex size-8 items-center justify-center rounded-full text-[14px] font-bold", day.isSelected || day.isToday ? "bg-[#1d7ece] text-white" : "text-[#cbd7e2]")}>
              {day.number}
            </span>
          </div>
        ))}
        <div className="relative col-span-8 grid min-h-[650px] grid-cols-[58px_repeat(7,minmax(104px,1fr))] border-t border-[#253646]">
          <div className="col-start-1">
            {hours.map((hour) => (
              <div className="h-[54px] pr-3 pt-1 text-right text-[12px] text-[#8fa0ae]" key={hour}>
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {days.map((day, index) => (
            <div className="relative border-l border-[#203443]" key={day.date}>
              {hours.map((hour) => (
                <div className="h-[54px] border-b border-[#203443]/70" key={hour} />
              ))}
              {day.blocks.map((block) => (
                <div
                  className="absolute left-1 right-1 rounded-[8px] border border-[#53606d] bg-[#1a222c]/90 px-2 py-2 text-[11px] text-[#aeb9c4]"
                  key={block.id}
                  style={{ height: `${eventHeight(block.startsAt, block.endsAt)}%`, top: `${eventTop(block.startsAt)}%` }}
                >
                  <Lock className="mb-1 size-3" />
                  {block.title}
                </div>
              ))}
              {day.appointments.map((appointment) => (
                <button
                  className={cn(
                    "absolute left-1 right-1 overflow-hidden rounded-[8px] border px-2 py-2 text-left text-[11px] text-white",
                    appointment.modality === "online" ? "border-[#1d7ece] bg-[#0f4776]/95" : "border-[#7a6232] bg-[#27303a]/95",
                  )}
                  key={appointment.id}
                  onClick={() => onSelectAppointment(appointment)}
                  style={{ height: `${eventHeight(appointment.startsAt, appointment.endsAt)}%`, top: `${eventTop(appointment.startsAt)}%`, zIndex: index + 1 }}
                  type="button"
                >
                  <span className="block text-[#b8dfff]">{appointment.timeLabel}</span>
                  <strong className="mt-1 block truncate text-white">{appointment.client.name}</strong>
                  <span className="block truncate text-[#c9d3dc]">{appointment.typeLabel}</span>
                  <span className="mt-1 flex items-center gap-1 text-[#68afe9]">
                    <ModalityIcon modality={appointment.modality} />
                    {appointment.modalityLabel}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-5 text-[12px] text-[#98a8b7]">
        {weekLegend.map((item) => (
          <span className="inline-flex items-center gap-2" key={item.label}>
            <span className={cn("size-2.5 rounded-full", item.className)} />
            {item.label}
          </span>
        ))}
      </div>
    </Panel>
  );
}

function DayTimeline({
  appointments,
  blocks,
  onSelectAppointment,
  selectedId,
}: {
  appointments: PartnerAgendaAppointment[];
  blocks: PartnerAgendaBlock[];
  onSelectAppointment: (appointment: PartnerAgendaAppointment) => void;
  selectedId?: string;
}) {
  const items = [
    ...appointments.map((appointment) => ({ appointment, startsAt: appointment.startsAt, type: "appointment" as const })),
    ...blocks.map((block) => ({ block, startsAt: block.startsAt, type: "block" as const })),
  ].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

  return (
    <Panel className="p-5 lg:p-6">
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#41505c] px-4 py-14 text-center">
            <CalendarDays className="mx-auto size-7 text-[#647789]" />
            <p className="mt-3 text-[14px] text-[#9aa8b5]">Nenhum compromisso para este dia.</p>
          </div>
        ) : (
          items.map((item) => {
            if (item.type === "block") {
              return (
                <div className="grid grid-cols-[72px_1fr] items-center gap-4" key={item.block.id}>
                  <span className="text-[14px] text-[#9aa8b5]">{timeLabel(item.block.startsAt)}</span>
                  <div className="rounded-[10px] border border-[#52606d] bg-[#18222c] px-5 py-4 text-[#aeb9c4]">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-[15px] text-[#d7dae0]">{item.block.title}</strong>
                      <span className="rounded-full border border-[#52606d] px-2.5 py-1 text-[11px]">Bloqueado</span>
                    </div>
                    <p className="mt-1 text-[12px]">{item.block.timeLabel}</p>
                  </div>
                </div>
              );
            }

            const appointment = item.appointment;
            return (
              <div className="grid grid-cols-[72px_1fr] items-center gap-4" key={appointment.id}>
                <span className="text-[14px] text-[#9aa8b5]">{timeLabel(appointment.startsAt)}</span>
                <button
                  className={cn(
                    "border-l-2 rounded-[10px] border border-[#263747] bg-[#111b27]/88 px-5 py-4 text-left transition-colors hover:border-[#1d7ece]",
                    selectedId === appointment.id && "border-[#1d7ece] bg-[#123f68]/78",
                    appointment.status === "pending" ? "border-l-[#f5a623]" : appointment.status === "canceled" ? "border-l-[#ff5c70]" : "border-l-[#2ec27e]",
                  )}
                  onClick={() => onSelectAppointment(appointment)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[17px] font-bold text-white">{appointment.client.name}</p>
                      <p className="mt-1 text-[13px] text-[#a9b6c2]">{appointment.title} · {appointment.typeLabel}</p>
                    </div>
                    <StatusBadge label={appointment.statusLabel} status={appointment.status} />
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-8 flex items-center justify-center gap-4 text-[13px] text-[#8fa0ae]">
        <span className="h-px w-20 bg-[#263747]" />
        Fim da agenda do dia
        <span className="h-px w-20 bg-[#263747]" />
      </div>
    </Panel>
  );
}

function SummaryCards({ agenda }: { agenda: PartnerAgendaData }) {
  const cards = [
    { icon: CalendarDays, label: "Total de consultas", value: agenda.summary.totalCount, tone: "green" },
    { icon: Video, label: "Consultas online", value: agenda.summary.onlineCount, tone: "blue" },
    { icon: MapPin, label: "Consultas presenciais", value: agenda.summary.presencialCount, tone: "amber" },
    { icon: Clock3, label: "Horários livres hoje", value: agenda.summary.freeHoursLabel, tone: "purple" },
  ];

  return (
    <Panel className="p-4">
      <h2 className="text-[18px] font-bold text-white">Resumo da Semana</h2>
      <p className="mt-1 text-[13px] text-[#8fa0ae]">Indicadores da agenda atual</p>
      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <div className="flex items-center gap-4 rounded-[10px] border border-[#263747] bg-[#111b27]/76 p-4" key={card.label}>
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-[10px]",
                card.tone === "green" && "bg-[#0c2b1d] text-[#58d881]",
                card.tone === "blue" && "bg-[#0a2c48] text-[#68afe9]",
                card.tone === "amber" && "bg-[#2b2417] text-[#f0c76a]",
                card.tone === "purple" && "bg-[#30235f] text-[#b69cff]",
              )}
            >
              <card.icon className="size-5" />
            </span>
            <div>
              <p className="text-[22px] font-bold text-white">{card.value}</p>
              <p className="text-[13px] text-[#9aa8b5]">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AppointmentDetail({
  appointment,
  onEdit,
  onReschedule,
  onStatus,
  pending,
}: {
  appointment: PartnerAgendaAppointment | null;
  onEdit: (appointment: PartnerAgendaAppointment) => void;
  onReschedule: (appointment: PartnerAgendaAppointment) => void;
  onStatus: (appointment: PartnerAgendaAppointment, status: PartnerAgendaStatus) => void;
  pending: boolean;
}) {
  if (!appointment) {
    return (
      <Panel className="p-5">
        <h2 className="text-[18px] font-bold text-white">Detalhes do compromisso</h2>
        <div className="mt-8 rounded-[12px] border border-dashed border-[#41505c] px-4 py-10 text-center text-[13px] text-[#8fa0ae]">
          Selecione um compromisso para ver detalhes.
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-white">Detalhes do compromisso</h2>
        <span className="rounded-[8px] border border-[#263747] px-3 py-1 text-[12px] text-[#9aa8b5]">ID: {appointment.id.slice(0, 8)}</span>
      </div>
      <div className="mt-5 flex items-center gap-4">
        {appointment.avatarUrl ? (
          <img alt="" className="size-[74px] rounded-full border-2 border-[#1d7ece] object-cover" src={appointment.avatarUrl} />
        ) : (
          <span className="flex size-[74px] items-center justify-center rounded-full border-2 border-[#1d7ece] bg-[#0a2c48] text-[24px] font-bold text-white">
            {appointment.client.initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold text-white">{appointment.client.name}</p>
          <p className="mt-1 text-[13px] text-[#a9b6c2]">Cliente</p>
          <p className="mt-2 text-[12px] text-[#8fa0ae]">{appointment.client.phoneLabel} · {appointment.client.email}</p>
          <p className="mt-1 text-[12px] text-[#8fa0ae]">{appointment.client.ageLabel} · {appointment.client.genderLabel}</p>
        </div>
      </div>
      <dl className="mt-5 divide-y divide-[#263747] rounded-[12px] border border-[#263747] bg-[#111b27]/72">
        {[
          ["Data e horário", `${format(new Date(appointment.startsAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} · ${appointment.timeLabel}`],
          ["Parceiro responsável", "Profissional autenticado"],
          ["Tipo de consulta", appointment.typeLabel],
          ["Local", appointment.locationLabel],
          ["Status", appointment.statusLabel],
          ["Lembrete", appointment.reminderLabel],
          ["Observações", appointment.notes ?? "Sem observações"],
        ].map(([label, value]) => (
          <div className="grid grid-cols-[150px_1fr] gap-4 px-4 py-3 text-[13px]" key={label}>
            <dt className="text-[#8fa0ae]">{label}</dt>
            <dd className={cn("text-[#d7dae0]", label === "Status" && appointment.status === "scheduled" && "text-[#58d881]")}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#1d7ece] text-[13px] font-semibold text-white hover:bg-[#2992df] disabled:opacity-60"
          disabled={pending}
          onClick={() => onStatus(appointment, "scheduled")}
          type="button"
        >
          <Check className="size-4" />
          Confirmar
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#1d7ece] text-[13px] font-semibold text-[#68afe9] hover:bg-[#0a2c48] disabled:opacity-60"
          disabled={pending}
          onClick={() => onReschedule(appointment)}
          type="button"
        >
          <CalendarDays className="size-4" />
          Remarcar
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#7d3439] text-[13px] font-semibold text-[#ff6f80] hover:bg-[#31151b] disabled:opacity-60"
          disabled={pending}
          onClick={() => onStatus(appointment, "canceled")}
          type="button"
        >
          <X className="size-4" />
          Cancelar
        </button>
      </div>
      <button
        className="mt-3 h-9 text-[13px] font-semibold text-[#9fd8ff] hover:text-white"
        onClick={() => onEdit(appointment)}
        type="button"
      >
        Editar detalhes
      </button>
    </Panel>
  );
}

function UpcomingPanel({ appointments, onSelect }: { appointments: PartnerAgendaAppointment[]; onSelect: (appointment: PartnerAgendaAppointment) => void }) {
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-white">Próximos clientes</h2>
        <span className="text-[12px] text-[#68afe9]">Ver todos</span>
      </div>
      <div className="mt-5 space-y-4">
        {appointments.length === 0 ? (
          <p className="text-[13px] text-[#8fa0ae]">Nenhum atendimento futuro.</p>
        ) : (
          appointments.slice(0, 5).map((appointment) => (
            <button className="flex w-full items-center gap-3 text-left" key={appointment.id} onClick={() => onSelect(appointment)} type="button">
              <span className={cn("size-2.5 rounded-full", appointment.status === "pending" ? "bg-[#f5a623]" : appointment.status === "canceled" ? "bg-[#ff5c70]" : "bg-[#2ec27e]")} />
              <span className="w-12 text-[13px] text-[#9aa8b5]">{timeLabel(appointment.startsAt)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-white">{appointment.client.name}</span>
                <span className="block truncate text-[12px] text-[#8fa0ae]">{appointment.typeLabel} · {appointment.modalityLabel}</span>
              </span>
              <StatusBadge label={appointment.statusLabel} status={appointment.status} />
            </button>
          ))
        )}
      </div>
    </Panel>
  );
}

function AppointmentDrawer({
  clients,
  fields,
  mode,
  onBlockChange,
  onBlockSubmit,
  onChange,
  onClose,
  onModeChange,
  onSubmit,
  open,
  pending,
}: {
  clients: PartnerAgendaClient[];
  fields: AppointmentFormFields;
  mode: DrawerMode;
  onBlockChange: (fields: BlockFormFields) => void;
  onBlockSubmit: (fields: BlockFormFields) => void;
  onChange: (fields: AppointmentFormFields) => void;
  onClose: (open: boolean) => void;
  onModeChange: (mode: DrawerMode) => void;
  onSubmit: (fields: AppointmentFormFields) => void;
  open: boolean;
  pending: boolean;
}) {
  const [blockFields, setBlockFields] = useState<BlockFormFields>(defaultBlockFields(fields.date));
  const selectedClient = clients.find((client) => client.id === fields.patientId);

  function updateBlock(next: Partial<BlockFormFields>) {
    const merged = { ...blockFields, ...next };
    setBlockFields(merged);
    onBlockChange(merged);
  }

  function submitAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(fields);
  }

  function submitBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBlockSubmit(blockFields);
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto border-[#314353] bg-[#0b1720] p-0 text-[#f1f6fa] sm:max-w-[640px]">
        <div className="border-b border-[#263747] p-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 text-[22px] text-white">
              <CalendarDays className="size-6 text-[#68afe9]" />
              {mode === "appointment" ? "Novo compromisso" : "Bloquear horário"}
            </SheetTitle>
            <SheetDescription className="text-[#9aa8b5]">
              {mode === "appointment" ? "Preencha os dados para organizar um novo compromisso." : "Crie um bloqueio sem vínculo com Cliente."}
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_230px]">
          <div>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-[10px] border border-[#263747] bg-[#111b27] p-1">
              <button
                className={cn("h-9 rounded-[8px] text-[13px] font-semibold", mode === "appointment" ? "bg-[#0a4b7d] text-[#68afe9]" : "text-[#9aa8b5]")}
                onClick={() => onModeChange("appointment")}
                type="button"
              >
                Compromisso
              </button>
              <button
                className={cn("h-9 rounded-[8px] text-[13px] font-semibold", mode === "block" ? "bg-[#0a4b7d] text-[#68afe9]" : "text-[#9aa8b5]")}
                onClick={() => {
                  updateBlock({ date: fields.date, time: fields.time });
                  onModeChange("block");
                }}
                type="button"
              >
                Bloqueio
              </button>
            </div>
            {mode === "appointment" ? (
              <form className="space-y-4" onSubmit={submitAppointment}>
                <label className="block text-[13px] font-semibold text-[#d7dae0]">
                  Cliente
                  <select
                    className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]"
                    value={fields.patientId}
                    onChange={(event) => onChange({ ...fields, patientId: event.target.value })}
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Data
                    <input className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" type="date" value={fields.date} onChange={(event) => onChange({ ...fields, date: event.target.value })} />
                  </label>
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Horário
                    <input className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" type="time" value={fields.time} onChange={(event) => onChange({ ...fields, time: event.target.value })} />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Tipo
                    <select className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={fields.appointmentType} onChange={(event) => onChange({ ...fields, appointmentType: event.target.value as PartnerAgendaType })}>
                      <option value="consulta">Consulta</option>
                      <option value="avaliacao">Avaliação</option>
                      <option value="retorno">Retorno</option>
                      <option value="reuniao">Reunião</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Duração
                    <select className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={fields.durationMinutes} onChange={(event) => onChange({ ...fields, durationMinutes: Number(event.target.value) })}>
                      <option value={30}>30 minutos</option>
                      <option value={50}>50 minutos</option>
                      <option value={60}>60 minutos</option>
                      <option value={90}>90 minutos</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Modalidade
                    <select className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={fields.modality} onChange={(event) => onChange({ ...fields, modality: event.target.value as PartnerAgendaModality })}>
                      <option value="online">Online</option>
                      <option value="presencial">Presencial</option>
                    </select>
                  </label>
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Status
                    <select className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={fields.status} onChange={(event) => onChange({ ...fields, status: event.target.value as PartnerAgendaStatus })}>
                      <option value="scheduled">Confirmado</option>
                      <option value="pending">Pendente</option>
                      <option value="completed">Concluído</option>
                      <option value="canceled">Cancelado</option>
                    </select>
                  </label>
                </div>
                <label className="block text-[13px] font-semibold text-[#d7dae0]">
                  Local
                  <input className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" placeholder="Online, sala ou endereço" value={fields.locationText} onChange={(event) => onChange({ ...fields, locationText: event.target.value })} />
                </label>
                <label className="block text-[13px] font-semibold text-[#d7dae0]">
                  Observações
                  <textarea className="mt-2 min-h-[88px] w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 py-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" maxLength={500} value={fields.notes} onChange={(event) => onChange({ ...fields, notes: event.target.value })} />
                </label>
                <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#1d7ece] text-[13px] font-bold text-white hover:bg-[#2992df] disabled:opacity-60" disabled={pending || !fields.patientId} type="submit">
                  <Save className="size-4" />
                  Salvar compromisso
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={submitBlock}>
                <label className="block text-[13px] font-semibold text-[#d7dae0]">
                  Título
                  <input className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={blockFields.title} onChange={(event) => updateBlock({ title: event.target.value })} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Data
                    <input className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" type="date" value={blockFields.date} onChange={(event) => updateBlock({ date: event.target.value })} />
                  </label>
                  <label className="block text-[13px] font-semibold text-[#d7dae0]">
                    Horário
                    <input className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" type="time" value={blockFields.time} onChange={(event) => updateBlock({ time: event.target.value })} />
                  </label>
                </div>
                <label className="block text-[13px] font-semibold text-[#d7dae0]">
                  Duração
                  <select className="mt-2 h-10 w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={blockFields.durationMinutes} onChange={(event) => updateBlock({ durationMinutes: Number(event.target.value) })}>
                    <option value={30}>30 minutos</option>
                    <option value={60}>60 minutos</option>
                    <option value={120}>2 horas</option>
                    <option value={240}>4 horas</option>
                  </select>
                </label>
                <label className="block text-[13px] font-semibold text-[#d7dae0]">
                  Motivo
                  <textarea className="mt-2 min-h-[88px] w-full rounded-[8px] border border-[#314353] bg-[#111b27] px-3 py-3 text-[13px] text-white outline-none focus:border-[#1d7ece]" value={blockFields.reason} onChange={(event) => updateBlock({ reason: event.target.value })} />
                </label>
                <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[#1d7ece] text-[13px] font-bold text-[#68afe9] hover:bg-[#0a2c48] disabled:opacity-60" disabled={pending} type="submit">
                  <Lock className="size-4" />
                  Bloquear horário
                </button>
              </form>
            )}
          </div>
          <aside className="rounded-[12px] border border-[#263747] bg-[#111b27]/70 p-4">
            <h3 className="text-[15px] font-bold text-white">Resumo</h3>
            <div className="mt-5 space-y-4 text-[13px]">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 size-4 text-[#6f7c89]" />
                <div>
                  <p className="text-[#7f8fa0]">Cliente</p>
                  <p className="font-semibold text-[#d7dae0]">{selectedClient?.name ?? "Selecione"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 size-4 text-[#6f7c89]" />
                <div>
                  <p className="text-[#7f8fa0]">Data</p>
                  <p className="font-semibold text-[#d7dae0]">{fields.date} · {fields.time}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Video className="mt-0.5 size-4 text-[#6f7c89]" />
                <div>
                  <p className="text-[#7f8fa0]">Modalidade</p>
                  <p className="font-semibold text-[#d7dae0]">{fields.modality === "online" ? "Online" : "Presencial"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 text-[#6f7c89]" />
                <div>
                  <p className="text-[#7f8fa0]">Duração</p>
                  <p className="font-semibold text-[#d7dae0]">{fields.durationMinutes} minutos</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PartnerAgendaView({ agenda }: PartnerAgendaViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<AgendaViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(agenda.selectedDate);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("appointment");
  const [appointmentFields, setAppointmentFields] = useState(() => defaultAppointmentFields(agenda.selectedDate, agenda.clients));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(agenda.selectedDayAppointments[0]?.id ?? agenda.nextAppointments[0]?.id ?? null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAppointments = useMemo(() => {
    return agenda.appointments.filter((appointment) => {
      if (filter === "all") return true;
      if (filter === "pending") return appointment.status === "pending";
      return appointment.modality === filter;
    });
  }, [agenda.appointments, filter]);

  const selectedDayAppointments = filteredAppointments.filter((appointment) => appointment.dateKey === selectedDate);
  const selectedDayBlocks = agenda.blocks.filter((block) => block.dateKey === selectedDate && block.status === "active");
  const selectedAppointment = filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId)
    ?? selectedDayAppointments[0]
    ?? agenda.nextAppointments[0]
    ?? null;

  function openNewAppointment() {
    setDrawerMode("appointment");
    setAppointmentFields(defaultAppointmentFields(selectedDate, agenda.clients));
    setDrawerOpen(true);
  }

  function openEditAppointment(appointment: PartnerAgendaAppointment) {
    setDrawerMode("appointment");
    setAppointmentFields(appointmentToFields(appointment));
    setDrawerOpen(true);
  }

  function openRescheduleAppointment(appointment: PartnerAgendaAppointment) {
    setDrawerMode("appointment");
    setAppointmentFields({
      ...appointmentToFields(appointment),
      status: "scheduled",
    });
    setDrawerOpen(true);
  }

  function selectAppointment(appointment: PartnerAgendaAppointment) {
    setSelectedAppointmentId(appointment.id);
    setSelectedDate(appointment.dateKey);
  }

  function submitAppointment(fields: AppointmentFormFields) {
    setFeedback(null);
    startTransition(async () => {
      const payload = {
        appointmentType: fields.appointmentType,
        durationMinutes: fields.durationMinutes,
        locationText: fields.locationText || null,
        modality: fields.modality,
        notes: fields.notes || null,
        patientId: fields.patientId,
        reminderMinutes: fields.reminderMinutes,
        startsAt: buildIso(fields.date, fields.time),
        status: fields.status,
        title: fields.title,
      };
      const result = fields.appointmentId
        ? await updatePartnerAgendaAppointment({ ...payload, appointmentId: fields.appointmentId })
        : await createPartnerAgendaAppointment(payload);

      if (!result.ok) {
        setFeedback(result.error ?? "Não foi possível salvar.");
        return;
      }
      setFeedback(result.message ?? "Agenda atualizada.");
      setDrawerOpen(false);
      router.refresh();
    });
  }

  function submitBlock(fields: BlockFormFields) {
    setFeedback(null);
    startTransition(async () => {
      const result = await createPartnerCalendarBlock({
        durationMinutes: fields.durationMinutes,
        reason: fields.reason || null,
        startsAt: buildIso(fields.date, fields.time),
        title: fields.title,
      });

      if (!result.ok) {
        setFeedback(result.error ?? "Não foi possível bloquear o horário.");
        return;
      }
      setFeedback(result.message ?? "Horário bloqueado.");
      setDrawerOpen(false);
      router.refresh();
    });
  }

  function updateStatus(appointment: PartnerAgendaAppointment, status: PartnerAgendaStatus) {
    setFeedback(null);
    startTransition(async () => {
      const result = await setPartnerAgendaAppointmentStatus({
        appointmentId: appointment.id,
        patientId: appointment.client.id,
        status,
      });
      setFeedback(result.ok ? result.message ?? "Status atualizado." : result.error ?? "Não foi possível atualizar.");
      if (result.ok) router.refresh();
    });
  }

  function cancelFirstBlock() {
    const block = selectedDayBlocks[0];
    if (!block) return;
    startTransition(async () => {
      const result = await setPartnerCalendarBlockCanceled({ blockId: block.id, canceled: true });
      setFeedback(result.ok ? result.message ?? "Bloqueio cancelado." : result.error ?? "Não foi possível cancelar o bloqueio.");
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(29,126,206,0.14),transparent_32%),#0b1720] px-3 py-4 text-[#f1f6fa] sm:px-6 sm:py-8 lg:px-[42px]">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[24px] font-bold leading-8 text-white sm:text-[30px] sm:leading-10">Agenda de Parceiros</h1>
          <p className="mt-1 text-[12px] leading-4 text-[#a4afbb] sm:mt-2 sm:text-[15px] sm:leading-6">Gerencie compromissos e otimize a colaboração com seus clientes.</p>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <div className="hidden text-right md:block">
            <p className="text-[15px] font-bold text-white">{agenda.partnerName}</p>
            <p className="text-[13px] text-[#9aa8b5]">Profissional</p>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full border border-[#314353] bg-[#111b27] text-[14px] font-bold text-white">
            {agenda.partnerName.charAt(0)}
          </span>
          <ChevronDown className="size-4 text-[#9aa8b5]" />
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3 sm:mt-7 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="flex rounded-[9px] border border-[#263747] bg-[#111b27]/92 p-1 sm:rounded-[10px]">
            <SegmentButton active={viewMode === "month"} onClick={() => setViewMode("month")}>Mês</SegmentButton>
            <SegmentButton active={viewMode === "week"} onClick={() => setViewMode("week")}>Semana</SegmentButton>
            <SegmentButton active={viewMode === "day"} onClick={() => setViewMode("day")}>Dia</SegmentButton>
          </div>
          <div className="flex rounded-[9px] border border-[#263747] bg-[#111b27]/92 p-1 sm:rounded-[10px]">
            <button className="inline-flex h-9 items-center gap-1.5 rounded-[7px] px-3 text-[12px] font-medium text-[#b4c0cb] hover:bg-[#102635] sm:h-10 sm:gap-2 sm:rounded-[8px] sm:px-4 sm:text-[14px]" type="button">
              <Filter className="size-4" />
              Filtros
            </button>
            {(["all", "online", "presencial", "pending"] as FilterMode[]).map((item) => (
              <button
                className={cn("hidden h-10 rounded-[8px] px-3 text-[12px] font-semibold sm:inline-flex sm:items-center", filter === item ? "bg-[#0a4b7d] text-[#68afe9]" : "text-[#9aa8b5]")}
                key={item}
                onClick={() => setFilter(item)}
                type="button"
              >
                {item === "all" ? "Todos" : item === "pending" ? "Pendentes" : item === "online" ? "Online" : "Presencial"}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 items-center gap-1.5 rounded-[9px] border border-[#263747] bg-[#111b27]/92 p-1 sm:gap-2 sm:rounded-[10px]">
            <IconButton label="Período anterior" onClick={() => setSelectedDate(moveDate(selectedDate, viewMode, -1))}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <button className="h-9 min-w-0 max-w-[176px] truncate px-2 text-[12px] font-medium capitalize text-white sm:h-10 sm:min-w-[190px] sm:px-4 sm:text-[14px]" type="button">
              {getPeriodLabel(viewMode, selectedDate)}
            </button>
            <IconButton label="Próximo período" onClick={() => setSelectedDate(moveDate(selectedDate, viewMode, 1))}>
              <ChevronRight className="size-4" />
            </IconButton>
            <button className="hidden h-10 rounded-[8px] px-4 text-[14px] font-medium text-[#b4c0cb] hover:bg-[#102635] md:inline-flex md:items-center" onClick={() => setSelectedDate(formatDateKey(new Date()))} type="button">
              Hoje
            </button>
          </div>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-[#1d7ece] px-3 text-[12px] font-semibold text-white shadow-[0_16px_40px_rgba(29,126,206,0.26)] transition-colors hover:bg-[#2992df] sm:h-[46px] sm:gap-3 sm:rounded-[10px] sm:px-6 sm:text-[15px]"
          onClick={openNewAppointment}
          type="button"
        >
          <Plus className="size-4 sm:size-5" />
          Novo compromisso
        </button>
      </div>

      {feedback ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-[#314353] bg-[#111b27] px-4 py-2 text-[13px] text-[#d7dae0]">
          <AlertCircle className="size-4 text-[#68afe9]" />
          {feedback}
        </div>
      ) : null}

      <main className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 overflow-x-auto">
          {viewMode === "month" ? (
            <MonthView appointments={filteredAppointments} blocks={agenda.blocks} onSelectAppointment={selectAppointment} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
          ) : viewMode === "week" ? (
            <WeekView appointments={filteredAppointments} blocks={agenda.blocks} onSelectAppointment={selectAppointment} selectedDate={selectedDate} />
          ) : (
            <DayTimeline appointments={selectedDayAppointments} blocks={selectedDayBlocks} onSelectAppointment={selectAppointment} selectedId={selectedAppointment?.id} />
          )}
        </div>
        <aside className="space-y-4 sm:space-y-5">
          {viewMode === "week" ? <SummaryCards agenda={agenda} /> : null}
          <AppointmentDetail
            appointment={selectedAppointment}
            onEdit={openEditAppointment}
            onReschedule={openRescheduleAppointment}
            onStatus={updateStatus}
            pending={isPending}
          />
          {selectedDayBlocks.length > 0 ? (
            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-[#52606d] text-[13px] font-semibold text-[#aeb9c4] hover:bg-[#18222c]"
              disabled={isPending}
              onClick={cancelFirstBlock}
              type="button"
            >
              <RotateCcw className="size-4" />
              Cancelar bloqueio do dia
            </button>
          ) : null}
          <UpcomingPanel appointments={agenda.nextAppointments} onSelect={selectAppointment} />
        </aside>
      </main>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8fa0ae] sm:mt-5 sm:text-[13px]">
        <span className="flex size-5 items-center justify-center rounded-full border border-[#1d7ece] text-[#68afe9]">i</span>
        Dica: use Remarcar para mover um compromisso sem arrastar na agenda.
      </div>

      <AppointmentDrawer
        clients={agenda.clients}
        fields={appointmentFields}
        mode={drawerMode}
        onBlockChange={() => undefined}
        onBlockSubmit={submitBlock}
        onChange={setAppointmentFields}
        onClose={setDrawerOpen}
        onModeChange={setDrawerMode}
        onSubmit={submitAppointment}
        open={drawerOpen}
        pending={isPending}
      />
    </div>
  );
}
