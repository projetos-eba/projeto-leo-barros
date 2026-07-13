import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminFinancialView } from "./admin-financial-view";
import type { AdminFinancialData } from "@/lib/admin/financial-metrics";

vi.mock("./admin-financial-charts", () => ({
  FinancialPlanChart: () => <div data-testid="financial-plan-chart" />,
  HorizontalBars: () => <div data-testid="financial-bars" />,
  RevenueTrendChart: () => <div data-testid="revenue-trend-chart" />,
}));

const financial: AdminFinancialData = {
  churnMrrCents: 0,
  cycleDistribution: [{ color: "#2d9cff", label: "Mensal", percent: 100, value: 29900 }],
  generatedAt: "2026-06-28T12:00:00.000Z",
  kpis: [
    { delta: "+10%", description: "Receita recorrente mensal", id: "mrr", label: "MRR", trend: "good", value: "R$ 1.196" },
    { delta: "+10%", description: "Receita recorrente anual", id: "arr", label: "ARR", trend: "good", value: "R$ 14.352" },
    { delta: "+10%", description: "Profissionais com assinatura ativa", id: "activeSubscriptions", label: "Assinaturas ativas", trend: "good", value: "4" },
    { delta: "0 p.p.", description: "Taxa de cancelamento mensal", id: "churn", label: "Churn mensal", trend: "good", value: "0%" },
    { delta: "+1 p.p.", description: "Cobranças vencidas ou falhas", id: "delinquency", label: "Inadimplência", trend: "bad", value: "25%" },
    { delta: "+10%", description: "Valor médio em 12 meses", id: "ltv", label: "LTV médio", trend: "good", value: "R$ 3.588,00" },
  ],
  newMrrCents: 100000,
  periodLabel: "01 jun - 30 jun",
  planDistribution: [{ color: "#2d9cff", count: 4, label: "Pro Mensal", percent: 100, value: 4 }],
  recentRows: [
    { amount: "R$ 299", dateLabel: "01/07/2026", email: "partner@example.invalid", id: "sub-1", method: "Cartão", name: "Parceira Local", plan: "Pro", status: "Ativa", statusTone: "active" },
    { amount: "R$ 199", dateLabel: "01/07/2026", email: "pending@example.invalid", id: "sub-2", method: "Boleto", name: "Parceira Pendente", plan: "Starter", status: "Pendente", statusTone: "warning" },
    { amount: "R$ 299", dateLabel: "01/06/2026", email: "canceled@example.invalid", id: "sub-3", method: "Cartão", name: "Parceira Cancelada", plan: "Pro", status: "Cancelada", statusTone: "danger" },
  ],
  reductionMrrCents: 0,
  renewalRows: [
    { amount: "R$ 299,00", dateLabel: "01/07/2026", email: "partner@example.invalid", id: "sub-1", name: "Parceira Local", plan: "Pro" },
  ],
  revenueByKind: [{ color: "#2d9cff", label: "Renovações", percent: 100, value: 29900 }],
  revenueTrend: [],
};

describe("AdminFinancialView", () => {
  it("renderiza financeiro funcional com KPIs, graficos e tabelas", () => {
    render(<AdminFinancialView financial={financial} />);

    expect(screen.getByRole("heading", { name: "Financeiro & Planos" })).toBeInTheDocument();
    expect(screen.getAllByText("MRR").length).toBeGreaterThan(0);
    expect(screen.getByText("ARR")).toBeInTheDocument();
    expect(screen.getByText("Assinaturas ativas")).toBeInTheDocument();
    expect(screen.getByText("Churn mensal")).toBeInTheDocument();
    expect(screen.getByText("Inadimplência")).toBeInTheDocument();
    expect(screen.getByText("LTV médio")).toBeInTheDocument();
    expect(screen.getByTestId("revenue-trend-chart")).toBeInTheDocument();
    expect(screen.getByTestId("financial-plan-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("financial-bars")).toHaveLength(2);
    expect(screen.queryByText("Upgrade x Downgrade")).not.toBeInTheDocument();
    expect(screen.queryByText("Conversão Trial → Pago")).not.toBeInTheDocument();
    expect(screen.queryByText("Cobranças com risco")).not.toBeInTheDocument();
    expect(screen.queryByText("Novos clientes")).not.toBeInTheDocument();
    expect(screen.getByText("Próximas renovações críticas")).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText("Pendente")).toBeInTheDocument();
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.queryByText("Teste")).not.toBeInTheDocument();
    expect(screen.getAllByText("Parceira Local").length).toBeGreaterThan(0);
  });
});
