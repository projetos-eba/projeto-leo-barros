import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PartnerDashboardView } from "./partner-dashboard-view";
import type { PartnerDashboardData } from "@/lib/partners/dashboard-metrics";

vi.mock("./partner-dashboard-charts", () => ({
  AdherenceRings: () => <div data-testid="partner-adherence-rings" />,
  ClientGrowthChart: () => <div data-testid="partner-client-growth-chart" />,
  NewPatientsBarChart: () => <div data-testid="partner-new-patients-chart" />,
  PerformanceTrendChart: ({ metric }: { metric: { id: string } }) => (
    <div data-testid="partner-performance-trend-chart">{metric.id}</div>
  ),
}));

const dashboard: PartnerDashboardData = {
  adherence: [
    {
      description: "Clientes ativos em planos personalizados.",
      id: "planCoverage",
      label: "% de adesão aos planos",
      tone: "blue",
      value: 74,
    },
    {
      description: "Assinaturas em dia.",
      id: "renewalHealth",
      label: "% renovações em dia",
      tone: "green",
      value: 68,
    },
  ],
  alerts: [
    {
      body: "2 renovação(ões) previstas para os próximos 30 dias.",
      id: "due-renewals",
      title: "Renovações próximas",
      tone: "warning",
    },
  ],
  generatedAt: "2026-06-28T12:00:00.000Z",
  growth: [],
  kpis: [
    {
      delta: "+10%",
      description: "Clientes distintos com vínculo ativo com este parceiro na data atual.",
      id: "activeClients",
      label: "Clientes ativos",
      tone: "blue",
      trend: "good",
      value: "18",
    },
    {
      delta: "+20%",
      description: "Clientes distintos cujo vínculo ativo começou no mês atual.",
      id: "newClients",
      label: "Novos clientes",
      tone: "green",
      trend: "good",
      value: "4",
    },
    {
      delta: "+30%",
      description: "Soma mensalizada dos planos personalizados ativos ou pendentes de cobrança dos clientes.",
      id: "forecastMrr",
      label: "Receita prevista",
      tone: "green",
      trend: "good",
      value: "R$ 3.400",
    },
    {
      delta: "0 atrasada(s)",
      description: "Assinaturas de clientes em planos personalizados que renovam nos próximos 30 dias.",
      id: "renewalsNext30",
      label: "Renovações próximas",
      tone: "amber",
      trend: "neutral",
      value: "2",
    },
    {
      delta: "-10%",
      description: "Tickets abertos ou em atendimento vinculados a este parceiro.",
      id: "openTickets",
      label: "Tickets abertos",
      tone: "slate",
      trend: "good",
      value: "1",
    },
  ],
  movements: [
    {
      detail: "Cliente vinculado ao plano Premium",
      id: "event-1",
      time: "Há 2h",
      title: "Plano iniciado",
      tone: "green",
    },
  ],
  objectiveDistribution: [
    { color: "#3b82f6", count: 2, label: "Premium", value: 80 },
  ],
  partnerName: "Dra. Parceira",
  pendingUpdates: [
    {
      actionLabel: "Atualizar",
      clientLabel: "Cliente patient",
      daysLateLabel: "4 dias",
      id: "pending-1",
      lastUpdateLabel: "20/06/26",
      objective: "Premium",
    },
  ],
  performanceMetrics: [
    {
      chartKey: "adherenceRate",
      description: "Percentual de clientes ativos com plano personalizado vigente.",
      icon: "users",
      id: "adherenceRate",
      label: "Adesão média no período",
      unit: "percent",
      value: "74%",
    },
    {
      chartKey: "adherentClients",
      description: "Clientes aderentes.",
      icon: "users",
      id: "adherentClients",
      label: "Clientes aderentes (≥80%)",
      unit: "number",
      value: "112",
    },
    {
      chartKey: "adherenceTarget",
      description: "Meta do mês.",
      icon: "activity",
      id: "adherenceTarget",
      label: "Meta do mês de adesão",
      unit: "percent",
      value: "80%",
    },
  ],
  periodLabel: "01 jun - 30 jun",
  planDistribution: [{ color: "#0ea5e9", count: 2, label: "Premium", value: 2 }],
  planRows: [
    {
      activeSubscriptions: 2,
      intervalLabel: "Mensal",
      monthlyRevenue: "R$ 980",
      name: "Premium",
      renewalsNext30: 2,
    },
  ],
  platformPlanLabel: "Pro Mensal · ativo",
  renewals: [
    {
      amount: "R$ 490",
      clientLabel: "Cliente patient-1",
      dueInLabel: "7 dias",
      dueLabel: "05/07/2026",
      id: "renewal-1",
      planName: "Premium",
      status: "A renovar",
    },
  ],
  summaryMetrics: [
    {
      delta: "+10%",
      description: "Clientes distintos com vínculo ativo.",
      id: "activeClients",
      label: "Clientes ativos",
      subtext: "vs. mês anterior",
      tone: "blue",
      trend: "good",
      value: "18",
    },
    {
      description: "Atualizações próximas.",
      id: "pendingUpdates",
      label: "Próximos da Atualização",
      subtext: "2 pendentes",
      tone: "amber",
      trend: "neutral",
      value: "2",
    },
    {
      description: "Clientes sem vínculo ativo.",
      id: "inactiveClients",
      label: "Clientes Inativos",
      tone: "slate",
      trend: "neutral",
      value: "3",
    },
    {
      description: "Planos vencendo.",
      id: "renewalsNext30",
      label: "Próximos do vencimento",
      tone: "amber",
      trend: "neutral",
      value: "2",
    },
    {
      delta: "+30%",
      description: "Receita mensalizada.",
      id: "forecastMrr",
      label: "Receita do Mês",
      subtext: "vs. mês anterior",
      tone: "green",
      trend: "good",
      value: "R$ 3.400",
    },
    {
      description: "Alertas operacionais.",
      id: "clinicalAlerts",
      label: "Alertas clínicos",
      subtext: "Requerem atenção",
      tone: "red",
      trend: "bad",
      value: "1",
    },
  ],
  todayAgenda: [
    {
      id: "agenda-1",
      subtitle: "Premium",
      time: "Hoje",
      title: "Cliente patient",
      tone: "blue",
    },
  ],
};

describe("PartnerDashboardView", () => {
  it("renderiza a visão geral de parceiro com planos e renovações", () => {
    render(<PartnerDashboardView dashboard={dashboard} />);

    expect(screen.getByRole("heading", { name: "Painel de Performance" })).toBeInTheDocument();
    expect(screen.getByText(/Olá, Dra. Parceira/)).toBeInTheDocument();
    expect(screen.getByText("Pro Mensal · ativo")).toBeInTheDocument();
    expect(screen.getByText("Clientes ativos")).toBeInTheDocument();
    expect(screen.getAllByText("Receita do Mês").length).toBeGreaterThan(0);
    expect(screen.getByText("Alertas clínicos")).toBeInTheDocument();
    expect(screen.getByText("Requerem atenção")).toBeInTheDocument();
    expect(screen.getByText("Próximos do vencimento")).toBeInTheDocument();
    expect(screen.getByTestId("partner-performance-trend-chart")).toHaveTextContent("adherenceRate");
    expect(screen.getAllByTestId("performance-outline")).toHaveLength(1);
    expect(screen.getByTestId("performance-outline")).toHaveAttribute("data-active-metric", "averageAdhesion");
    expect(screen.getByTestId("performance-outline")).toHaveClass("pointer-events-none", "absolute", "inset-0");
    expect(screen.getByTestId("performance-outline-path")).toHaveAttribute("fill", "none");
    expect(screen.getByTestId("partner-new-patients-chart")).toBeInTheDocument();
    expect(screen.getByTestId("partner-adherence-rings")).toBeInTheDocument();
    expect(screen.getByTestId("partner-performance-card-adherenceRate")).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("partner-performance-card-adherenceRate")).not.toHaveClass("border");
    fireEvent.click(screen.getByTestId("partner-performance-card-adherentClients"));
    expect(screen.getByTestId("partner-performance-card-adherentClients")).toHaveAttribute("data-selected", "true");
    expect(screen.getByTestId("partner-performance-trend-chart")).toHaveTextContent("adherentClients");
    expect(screen.getByTestId("performance-outline")).toHaveAttribute("data-active-metric", "adherentClients");
    fireEvent.click(screen.getByTestId("partner-performance-card-adherenceTarget"));
    expect(screen.getByTestId("partner-performance-trend-chart")).toHaveTextContent("adherenceTarget");
    expect(screen.getByTestId("performance-outline")).toHaveAttribute("data-active-metric", "monthlyGoal");
    expect(screen.getByText("Distribuição por objetivo principal")).toBeInTheDocument();
    expect(screen.getByText("Pendências de atualização")).toBeInTheDocument();
    expect(screen.getAllByText("Premium").length).toBeGreaterThan(0);
    expect(screen.getByText("Planos próximos do vencimento")).toBeInTheDocument();
    expect(screen.getByText("Sem exposição clínica detalhada")).toBeInTheDocument();
    expect(screen.queryByText("Cardio")).not.toBeInTheDocument();
  });
});
