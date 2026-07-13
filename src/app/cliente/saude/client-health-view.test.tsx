import { render, screen } from "@testing-library/react";
import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildClientHealth, type ClientHealthRawData } from "@/lib/clients/health-metrics";

import { ClientHealthView } from "./client-health-view";

vi.mock("next/link", () => ({
  default: forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >(function MockLink({ children, href, ...props }, ref) {
    return <a ref={ref} href={href} {...props}>{children}</a>;
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("./actions", () => ({
  completeClientHealthAction: vi.fn(async () => ({ ok: true })),
  markClientHealthMedication: vi.fn(async () => ({ ok: true })),
}));

const raw: ClientHealthRawData = {
  actions: [
    { completedAt: "2026-07-03T08:04:00.000Z", detail: "Dose única", key: "vitamin_d", status: "completed", time: "08:00", title: "Tomar Vitamina D" },
    { completedAt: "2026-07-03T20:35:00.000Z", detail: "1 cápsula", key: "omega_3", status: "completed", time: "20:30", title: "Tomar Ômega 3 à noite" },
    { completedAt: null, detail: null, key: "pressure", status: "pending", time: "12:30", title: "Registrar pressão" },
    { completedAt: null, detail: null, key: "exam_review", status: "pending", time: null, title: "Revisar exame de Vitamina D" },
    { completedAt: "2026-07-03T12:00:00.000Z", detail: "Meta: 2L de água", key: "hydration", status: "completed", time: "21:00", title: "Manter hidratação" },
  ],
  appointments: [{ id: "appointment", startsAt: "2026-07-08T13:30:00.000Z", status: "scheduled", title: "Consulta de acompanhamento" }],
  client: { avatarUrl: null, id: "ana", name: "Ana Ribeiro", objective: "Hipertrofia" },
  dailyLog: { hydrationMl: 2100, sleepDeepMinutes: 72, sleepEfficiencyPct: 84, sleepLatencyMinutes: 12, sleepMinutes: 462 },
  examResults: [
    { collectedAt: "2026-07-02", name: "Vitamina D", status: "low", unit: "ng/mL", value: 28 },
    { collectedAt: "2026-07-02", name: "Hemograma completo", status: "normal", unit: "g/dL", value: 13.1 },
  ],
  generatedAt: "2026-07-03T12:00:00.000Z",
  medications: [
    { dosage: "2000 UI", id: "med-1", logStatus: "completed", name: "Vitamina D", scheduleTime: "08:00", takenAt: "2026-07-03T08:04:00.000Z" },
    { dosage: "200 mg", id: "med-2", logStatus: null, name: "Magnésio", scheduleTime: "22:00", takenAt: null },
  ],
  observations: [{ detail: "Resultado baixo.", id: "obs", occurredAt: "2026-07-01T12:00:00.000Z", severity: "attention", title: "Vitamina D baixa", type: "exam", value: "28 ng/mL" }],
  pressureLogs: [{ diastolic: 78, measuredAt: "2026-07-03T11:30:00.000Z", systolic: 122 }],
  selectedDate: "2026-07-03",
};

describe("ClientHealthView", () => {
  it("renderiza o painel de saúde do Cliente sem expor dados sensíveis", () => {
    render(<ClientHealthView health={buildClientHealth(raw)} />);

    expect(screen.getByRole("heading", { name: "Painel de Saúde" })).toBeInTheDocument();
    expect(screen.getByText("Seu cuidado de hoje")).toBeInTheDocument();
    expect(screen.getByText("Próxima consulta/atualização")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sono" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monitoramento da pressão (MRPA)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Medicações e suplementos de hoje" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Exames" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Linha do tempo da saúde" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conquistas da semana" })).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Dieta/i })).toHaveAttribute("href", "/cliente/dieta");
    expect(screen.getByRole("link", { name: /Treino/i })).toHaveAttribute("href", "/cliente/treino");
    expect(screen.getByRole("link", { name: /Saúde/i })).toHaveAttribute("href", "/cliente/saude");
    expect(screen.queryByText(/Mensagem do seu profissional/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Registrar pressão/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/CPF/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pacientes/i)).not.toBeInTheDocument();
  });
});
