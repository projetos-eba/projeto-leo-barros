import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminProfessionalsView } from "./admin-professionals-view";
import type { AdminProfessionalsData } from "@/lib/admin/professionals-metrics";

vi.mock("./admin-professionals-charts", () => ({
  ProfessionalsDonutChart: ({ testId }: { testId: string }) => <div data-testid={testId} />,
}));

vi.mock("./create-partner-dialog", () => ({
  CreatePartnerDialog: () => <button type="button">Novo parceiro</button>,
}));

const professionals: AdminProfessionalsData = {
  bottomMetrics: [
    { delta: "+100%", id: "newProfessionals", label: "Novos profissionais no mês", tone: "blue", trend: "good", value: "2" },
    { delta: "0%", id: "suspendedProfessionals", label: "Profissionais suspensos", tone: "red", trend: "good", value: "1" },
    { delta: "sem histórico", id: "nps", label: "NPS dos profissionais", note: "Aguardando coleta", tone: "purple", trend: "neutral", value: "Sem dados" },
    { delta: "0 p.p.", id: "churn", label: "Churn de profissionais", tone: "green", trend: "good", value: "0%" },
  ],
  generatedAt: "2026-06-28T12:00:00.000Z",
  kpis: [
    { delta: "+10%", id: "active", label: "Profissionais ativos", tone: "blue", trend: "good", value: "4" },
    { delta: "+1", id: "activeSubscriptions", label: "Assinaturas ativas", tone: "green", trend: "good", value: "3" },
    { delta: "+3%", id: "averageRevenue", label: "Receita média por profissional", tone: "purple", trend: "good", value: "R$ 299,00" },
  ],
  professionals: [
    {
      clientsCount: 12,
      email: "ana@example.invalid",
      id: "partner-1",
      initial: "A",
      lastAccessLabel: "Sem registro",
      name: "Ana Local",
      planLabel: "Pro Mensal",
      profileStatusLabel: "Ativo",
      revenueBaseCents: 29900,
      specialtyLabel: "Nutrição",
      statusLabel: "Ativo",
      statusTone: "active",
      subscriptionDateLabel: "28/06/2026",
      subscriptionLabel: "Ativa",
      subscriptionTone: "active",
    },
    {
      clientsCount: 0,
      email: "bruno@example.invalid",
      id: "partner-2",
      initial: "B",
      lastAccessLabel: "Sem registro",
      name: "Bruno Local",
      planLabel: "Starter Mensal",
      profileStatusLabel: "Suspenso",
      revenueBaseCents: 0,
      specialtyLabel: "Educação Física",
      statusLabel: "Suspenso",
      statusTone: "suspended",
      subscriptionDateLabel: "28/06/2026",
      subscriptionLabel: "Pagamento pendente",
      subscriptionTone: "suspended",
    },
  ],
  recentSubscriptions: [
    {
      date: "28/06/2026",
      email: "ana@example.invalid",
      id: "sub-1",
      initial: "A",
      name: "Ana Local",
      plan: "Pro Mensal",
      status: "Ativa",
      statusTone: "active",
    },
  ],
  specialtyDistribution: [{ color: "#138eff", count: 1, label: "Nutrição", value: 100 }],
  statusDistribution: [{ color: "#60c348", count: 1, label: "Ativo", value: 100 }],
  tabCounts: {
    active: 4,
    all: 5,
    inactive: 0,
    suspended: 1,
  },
};

describe("AdminProfessionalsView", () => {
  it("renderiza a gestão SaaS de Parceiros & Profissionais sem aprovação documental", () => {
    render(<AdminProfessionalsView professionals={professionals} />);

    expect(screen.getByRole("heading", { name: "Parceiros & Profissionais" })).toBeInTheDocument();
    expect(screen.getByText("Gerencie toda a rede de profissionais da plataforma.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo parceiro" })).toBeInTheDocument();
    expect(screen.getByText("Profissionais ativos")).toBeInTheDocument();
    expect(screen.getByText("Assinaturas ativas")).toBeInTheDocument();
    expect(screen.getAllByText("Receita média por profissional")[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar por nome ou e-mail")).toBeInTheDocument();
    expect(screen.getAllByText("Ana Local")[0]).toBeInTheDocument();
    expect(screen.getByText("Assinaturas recentes")).toBeInTheDocument();
    expect(screen.getByText("Distribuição por tipo profissional")).toBeInTheDocument();
    expect(screen.getByTestId("specialty-chart")).toBeInTheDocument();
    expect(screen.getByTestId("status-chart")).toBeInTheDocument();
    expect(screen.queryByText("Pendentes de aprovação")).not.toBeInTheDocument();
    expect(screen.queryByText("Taxa de ativação")).not.toBeInTheDocument();
    expect(screen.queryByText("Fila de aprovação")).not.toBeInTheDocument();
    expect(screen.queryByText("Documentação")).not.toBeInTheDocument();
    expect(screen.queryByText("Aprovar")).not.toBeInTheDocument();
    expect(screen.queryByText("Rejeitar")).not.toBeInTheDocument();
    expect(screen.queryByText("Supabase local")).not.toBeInTheDocument();
    expect(screen.queryByText("pending_delivery")).not.toBeInTheDocument();
    expect(screen.queryByText("Edge")).not.toBeInTheDocument();
  });

  it("filtra por abas, busca e abre ações do profissional", () => {
    render(<AdminProfessionalsView professionals={professionals} />);

    let table = screen.getByRole("table");
    expect(within(table).getByText("Ana Local")).toBeInTheDocument();
    expect(within(table).getByText("Bruno Local")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Suspensos/ }));
    table = screen.getByRole("table");
    expect(within(table).queryByText("Ana Local")).not.toBeInTheDocument();
    expect(within(table).getByText("Bruno Local")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 a 1 de 1 profissionais")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Buscar por nome ou e-mail"), {
      target: { value: "ana" },
    });
    expect(within(screen.getByRole("table")).getByText("Nenhum profissional encontrado.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Todos/ }));
    table = screen.getByRole("table");
    expect(within(table).getByText("Ana Local")).toBeInTheDocument();
    expect(within(table).queryByText("Bruno Local")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Ver perfil" })[0]);
    expect(screen.getByRole("dialog", { name: "Ana Local" })).toBeInTheDocument();
    expect(screen.getByText("Receita mensal considerada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByLabelText("Mais ações para Ana Local")).toBeInTheDocument();
  });
});
