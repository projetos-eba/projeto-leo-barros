import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminClientsView } from "./admin-clients-view";
import type { AdminClientsData } from "@/lib/admin/clients-metrics";

const clients: AdminClientsData = {
  clients: [
    {
      activeLinksCount: 1,
      email: "ana.cliente@example.invalid",
      id: "patient-1",
      initial: "A",
      lastUpdateLabel: "20/06/2026",
      links: [
        {
          endedAtLabel: "Sem registro",
          id: "link-1",
          partnerName: "Dra. Carla",
          professionalStatus: "active",
          scopeLabel: "Dieta",
          startedAtLabel: "05/06/2026",
          statusLabel: "Ativo",
        },
      ],
      name: "Ana Cliente",
      phoneLabel: "+5511999990001",
      primaryPartnerLabel: "Dra. Carla",
      scopeLabel: "Dieta",
      startedAtLabel: "05/06/2026",
      status: "active",
      statusLabel: "Ativo",
      statusTone: "active",
    },
    {
      activeLinksCount: 0,
      email: "bruno.cliente@example.invalid",
      id: "patient-2",
      initial: "B",
      lastUpdateLabel: "21/06/2026",
      links: [],
      name: "Bruno Cliente",
      phoneLabel: "Sem telefone",
      primaryPartnerLabel: "Sem profissional",
      scopeLabel: "Sem escopo",
      startedAtLabel: "21/06/2026",
      status: "unassigned",
      statusLabel: "Sem vínculo ativo",
      statusTone: "warning",
    },
  ],
  generatedAt: "2026-06-28T12:00:00.000Z",
  kpis: [
    { delta: "+100%", description: "Clientes distintos com vínculo ativo em profissionais ativos.", id: "activeClients", label: "Clientes ativos", tone: "blue", trend: "good", value: "1" },
    { delta: "+100%", description: "Clientes distintos iniciados neste mês em profissionais ativos.", id: "newClients", label: "Novos clientes (mês)", tone: "green", trend: "good", value: "1" },
    { delta: "0%", description: "Clientes cadastrados sem vínculo ativo com profissional ativo.", id: "withoutActiveLink", label: "Sem vínculo ativo", tone: "amber", trend: "neutral", value: "1" },
    { delta: "0%", description: "Clientes com pelo menos um vínculo encerrado no mês.", id: "endedLinks", label: "Vínculos encerrados", tone: "slate", trend: "good", value: "0" },
  ],
  statusDistribution: [
    { color: "#58d881", count: 1, id: "active", label: "Ativo", value: 50 },
    { color: "#f0a52b", count: 1, id: "unassigned", label: "Sem vínculo ativo", value: 50 },
    { color: "#8998a4", count: 0, id: "inactive", label: "Inativo", value: 0 },
  ],
  tabCounts: {
    active: 1,
    all: 2,
    inactive: 0,
    unassigned: 1,
  },
  topProfessionals: [
    { clientsCount: 1, id: "partner-1", name: "Dra. Carla", specialtyLabel: "Nutrição" },
  ],
};

describe("AdminClientsView", () => {
  it("renderiza a tela simplificada de clientes sem fluxos clínicos", () => {
    render(<AdminClientsView clients={clients} />);

    expect(screen.getByRole("heading", { name: "Clientes" })).toBeInTheDocument();
    expect(screen.getByText("Acompanhe clientes vinculados aos profissionais com uma visão operacional simples.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    expect(screen.getByText("Clientes ativos")).toBeInTheDocument();
    expect(screen.getByText("Novos clientes (mês)")).toBeInTheDocument();
    expect(screen.getAllByText("Sem vínculo ativo")[0]).toBeInTheDocument();
    expect(screen.getByText("Clientes por status")).toBeInTheDocument();
    expect(screen.getByText("Top profissionais")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar por nome, e-mail ou profissional")).toBeInTheDocument();
    expect(screen.queryByText(/prontuário/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/anamnese/i)).not.toBeInTheDocument();
  });

  it("filtra, abre drawer e copia e-mail", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<AdminClientsView clients={clients} />);

    expect(within(screen.getByRole("table")).getByText("Ana Cliente")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Bruno Cliente")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Sem vínculo/ }));
    expect(within(screen.getByRole("table")).queryByText("Ana Cliente")).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Bruno Cliente")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Todos/ }));
    fireEvent.change(screen.getByPlaceholderText("Buscar por nome, e-mail ou profissional"), {
      target: { value: "carla" },
    });
    expect(within(screen.getByRole("table")).getByText("Ana Cliente")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).queryByText("Bruno Cliente")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalhes" }));
    expect(await screen.findByRole("dialog", { name: "Cliente selecionado" })).toBeInTheDocument();
    expect(screen.getByText("Dados operacionais, vínculos e histórico resumido.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Copiar e-mail de Ana Cliente"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ana.cliente@example.invalid");
    });
  });
});
