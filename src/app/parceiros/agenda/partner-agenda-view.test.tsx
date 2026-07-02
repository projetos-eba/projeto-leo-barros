import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerAgendaData } from "@/lib/partners/agenda-metrics";

import {
  createPartnerAgendaAppointment,
  createPartnerCalendarBlock,
  setPartnerAgendaAppointmentStatus,
  updatePartnerAgendaAppointment,
} from "./actions";
import { PartnerAgendaView } from "./partner-agenda-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("./actions", () => ({
  createPartnerAgendaAppointment: vi.fn(),
  createPartnerCalendarBlock: vi.fn(),
  reschedulePartnerAgendaAppointment: vi.fn(),
  setPartnerAgendaAppointmentStatus: vi.fn(),
  setPartnerCalendarBlockCanceled: vi.fn(),
  updatePartnerAgendaAppointment: vi.fn(),
}));

const agenda: PartnerAgendaData = {
  appointments: [
    {
      appointmentType: "consulta",
      avatarUrl: null,
      client: {
        ageLabel: "35 anos",
        email: "ana@example.invalid",
        genderLabel: "Feminino",
        id: "a1000000-0000-4000-8000-000000000301",
        initial: "A",
        name: "Ana Ribeiro",
        objectiveLabel: "Hipertrofia",
        phoneLabel: "+5511999999999",
      },
      dateKey: "2026-06-30",
      durationLabel: "1h",
      endsAt: "2026-06-30T15:00:00.000Z",
      id: "appt-1",
      locationLabel: "Online",
      modality: "online",
      modalityLabel: "Online",
      notes: "Revisar adesão.",
      reminderLabel: "Enviar 30 min antes",
      startsAt: "2026-06-30T14:00:00.000Z",
      status: "pending",
      statusLabel: "Pendente",
      timeLabel: "14:00 – 15:00",
      title: "Consulta de acompanhamento",
      typeLabel: "Consulta",
    },
  ],
  blocks: [
    {
      dateKey: "2026-06-30",
      durationLabel: "1h",
      endsAt: "2026-06-30T13:00:00.000Z",
      id: "block-1",
      reason: "Pausa",
      startsAt: "2026-06-30T12:00:00.000Z",
      status: "active",
      timeLabel: "12:00 – 13:00",
      title: "Intervalo",
    },
  ],
  clients: [
    {
      email: "ana@example.invalid",
      id: "a1000000-0000-4000-8000-000000000301",
      initial: "A",
      name: "Ana Ribeiro",
      phoneLabel: "+5511999999999",
      scopeLabel: "Dieta + Treino",
    },
  ],
  generatedAt: "2026-06-30T09:00:00.000Z",
  monthDays: [],
  nextAppointments: [],
  partnerName: "Antonio Ferrari",
  selectedDate: "2026-06-30",
  selectedDateLabel: "30 de junho de 2026",
  selectedDayAppointments: [],
  selectedDayBlocks: [],
  summary: {
    confirmedCount: 0,
    freeHoursLabel: "8h",
    onlineCount: 1,
    pendingCount: 1,
    presencialCount: 0,
    todayCount: 1,
    totalCount: 1,
  },
  weekDays: [],
  weekLabel: "29 a 05 de julho",
};

describe("PartnerAgendaView", () => {
  beforeEach(() => {
    vi.mocked(createPartnerAgendaAppointment).mockResolvedValue({ ok: true });
    vi.mocked(createPartnerCalendarBlock).mockResolvedValue({ ok: true });
    vi.mocked(setPartnerAgendaAppointmentStatus).mockResolvedValue({ ok: true });
    vi.mocked(updatePartnerAgendaAppointment).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.pointerEvents = "";
    vi.restoreAllMocks();
  });

  it("renderiza agenda com linguagem de Clientes e alterna views", () => {
    render(<PartnerAgendaView agenda={agenda} />);

    expect(screen.getByRole("heading", { name: "Agenda de Parceiros" })).toBeInTheDocument();
    expect(screen.getByText("Próximos clientes")).toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardio")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Semana" }));
    expect(screen.getByText("Resumo da Semana")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dia" }));
    expect(screen.getByText("Fim da agenda do dia")).toBeInTheDocument();
  });

  it("cria compromisso e bloqueia horário pelo drawer", async () => {
    render(<PartnerAgendaView agenda={agenda} />);

    fireEvent.click(screen.getByRole("button", { name: "Novo compromisso" }));
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2026-07-10" } });
    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "10:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar compromisso" }));

    await waitFor(() => expect(createPartnerAgendaAppointment).toHaveBeenCalled());
    expect(createPartnerAgendaAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: "a1000000-0000-4000-8000-000000000301",
        title: "Consulta de acompanhamento",
      }),
    );

    cleanup();
    render(<PartnerAgendaView agenda={agenda} />);

    fireEvent.click(screen.getByRole("button", { name: "Novo compromisso" }));
    fireEvent.click(screen.getByRole("button", { name: "Bloqueio" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Reunião interna" } });
    fireEvent.click(screen.getByRole("button", { name: "Bloquear horário" }));

    await waitFor(() => expect(createPartnerCalendarBlock).toHaveBeenCalled());
    expect(createPartnerCalendarBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Reunião interna",
      }),
    );
  });

  it("confirma, cancela e abre remarcação de compromisso", async () => {
    render(<PartnerAgendaView agenda={agenda} />);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(setPartnerAgendaAppointmentStatus).toHaveBeenCalledWith({
      appointmentId: "appt-1",
      patientId: "a1000000-0000-4000-8000-000000000301",
      status: "scheduled",
    }));

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(setPartnerAgendaAppointmentStatus).toHaveBeenCalledWith({
      appointmentId: "appt-1",
      patientId: "a1000000-0000-4000-8000-000000000301",
      status: "canceled",
    }));

    fireEvent.click(screen.getByRole("button", { name: "Remarcar" }));
    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "16:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar compromisso" }));

    await waitFor(() => expect(updatePartnerAgendaAppointment).toHaveBeenCalled());
    expect(updatePartnerAgendaAppointment).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: "appt-1",
        status: "scheduled",
      }),
    );
  });
});
