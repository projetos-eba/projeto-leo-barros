import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminDashboardView } from "./admin-dashboard-view";
import type { AdminDashboardData } from "@/lib/admin/dashboard-metrics";

vi.mock("./admin-dashboard-charts", () => ({
  GrowthChart: () => <div data-testid="growth-chart" />,
  PlanDistributionChart: () => <div data-testid="plan-chart" />,
  ProfessionalStatusChart: () => <div data-testid="professional-status-chart" />,
}));

const dashboard: AdminDashboardData = {
  alerts: [
    {
      action: "Revisar documentos",
      body: "2 documento(s) aguardando análise ou regularização.",
      id: "pending-documents",
      title: "Documentos pendentes",
      tone: "danger",
    },
  ],
  approvals: [
    {
      date: "28/06/2026",
      email: "partner@example.invalid",
      initial: "P",
      name: "Parceira Local",
      specialty: "nutricionista",
      status: "Aguardando revisão",
    },
  ],
  bottomMetrics: [
    { delta: "+2%", id: "newClients", label: "Novos clientes (mês)", trend: "good", value: "8" },
    { delta: "0 p.p.", id: "churn", label: "Churn de assinaturas", trend: "good", value: "0%" },
    { delta: "0", id: "failedPayments", label: "Pagamentos falhos", trend: "good", value: "0" },
    { delta: "+2", id: "pendingDocuments", label: "Documentos pendentes", trend: "bad", value: "2" },
  ],
  generatedAt: "2026-06-28T12:00:00.000Z",
  growth: [],
  health: [
    { badge: "Processado", id: "processedPayments", label: "Pagamentos processados", subtext: "Este mês", value: "R$ 299" },
    { badge: "Bom", id: "ticketsSla", label: "Tickets dentro do SLA", subtext: "Resolvidos este mês", value: "100%" },
    { badge: "Atenção", id: "pendingDocuments", label: "Documentos pendentes", subtext: "Parceiros e profissionais", value: "2" },
  ],
  kpis: [
    { delta: "+10%", id: "activePartners", label: "Parceiros ativos", trend: "good", value: "4" },
    { delta: "+20%", id: "activeClients", label: "Clientes ativos", trend: "good", value: "18" },
    { delta: "+30%", id: "mrr", label: "Receita recorrente mensal (MRR)", trend: "good", value: "R$ 1.196" },
    { delta: "-1%", id: "openTickets", label: "Tickets abertos", trend: "good", value: "1" },
    { delta: "+5 p.p.", id: "renewalRate", label: "Taxa de renovação", trend: "good", value: "95%" },
  ],
  movements: [
    { detail: "Plano Pro", id: "event-1", time: "Há 2h", title: "Assinatura ativada", tone: "green" },
  ],
  periodLabel: "01 jun - 30 jun",
  planDistribution: [{ color: "#2d9cff", count: 4, label: "Pro Mensal", value: 4 }],
  professionalStatusDistribution: [
    { color: "#58d881", count: 3, id: "active", label: "Ativos", value: 3 },
    { color: "#f0a52b", count: 1, id: "suspended", label: "Suspensos", value: 1 },
    { color: "#8998a4", count: 0, id: "inactive", label: "Inativos", value: 0 },
  ],
};

describe("AdminDashboardView", () => {
  it("renderiza o dashboard funcional sem blocos removidos da versão mockada", () => {
    render(<AdminDashboardView dashboard={dashboard} />);

    expect(screen.getByRole("heading", { name: "Super Admin — Visão Geral" })).toBeInTheDocument();
    expect(screen.getByText("Parceiros ativos")).toBeInTheDocument();
    expect(screen.getByText("Clientes ativos")).toBeInTheDocument();
    expect(screen.getByText("Receita recorrente mensal (MRR)")).toBeInTheDocument();
    expect(screen.getByText("Tickets abertos")).toBeInTheDocument();
    expect(screen.getByText("Taxa de renovação")).toBeInTheDocument();
    expect(screen.getByTestId("growth-chart")).toBeInTheDocument();
    expect(screen.getByTestId("plan-chart")).toBeInTheDocument();
    expect(screen.getByTestId("professional-status-chart")).toBeInTheDocument();
    expect(screen.getByText("Profissionais por status")).toBeInTheDocument();
    expect(screen.getByText("Indicadores do mês")).toBeInTheDocument();
    expect(screen.getByText("Novos clientes (mês)")).toBeInTheDocument();
    expect(screen.getByText("Churn de assinaturas")).toBeInTheDocument();
    expect(screen.getByText("Pagamentos falhos")).toBeInTheDocument();
    expect(screen.queryByText("Profissionais aguardando revisão")).not.toBeInTheDocument();
    expect(screen.queryByText("Profissionais aprovados")).not.toBeInTheDocument();
    expect(screen.queryByText("Faturamento por origem")).not.toBeInTheDocument();
    expect(screen.queryByText("Uptime da plataforma")).not.toBeInTheDocument();
    expect(screen.queryByText("NPS da plataforma")).not.toBeInTheDocument();
    expect(screen.queryByText("Taxa de conversão (trials)")).not.toBeInTheDocument();
    expect(screen.queryByText("Receita média por parceiro")).not.toBeInTheDocument();
  });
});
