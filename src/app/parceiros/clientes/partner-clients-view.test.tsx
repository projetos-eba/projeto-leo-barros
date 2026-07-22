import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PartnerClientsView } from "./partner-clients-view";
import type { PartnerClientsData } from "@/lib/partners/clients-metrics";
import { createClient } from "@/lib/supabase/client";
import { assignPlanToClient } from "../planos-financeiro/actions";

const refresh = vi.fn();
const push = vi.fn();
const invoke = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("../planos-financeiro/actions", () => ({
  assignPlanToClient: vi.fn(),
}));

const clients: PartnerClientsData = {
  activeCount: 2,
  generatedAt: "2026-06-30T12:00:00.000Z",
  rows: [
    {
      ageLabel: "28 anos",
      email: "carlos@example.invalid",
      id: "patient-1",
      initial: "C",
      lastUpdateLabel: "Hoje, 09:30",
      name: "Carlos Eduardo Santos",
      objectiveLabel: "Hipertrofia",
      phoneLabel: "+5511999999999",
      planNames: ["Mensal Performance"],
      planSummaryLabel: "Mensal Performance",
      renewalDateLabel: "08/07/2026",
      renewalLabel: "8 dias",
      renewalTone: "amber",
      searchText: "carlos eduardo santos carlos@example.invalid +5511999999999 hipertrofia treino mensal performance ativo",
      serviceScopeLabel: "Treino",
      serviceScopes: ["treino"],
      startedAtLabel: "01/06/2026",
      status: "active",
      statusLabel: "Ativo",
    },
    {
      ageLabel: "34 anos",
      email: "mariana@example.invalid",
      id: "patient-2",
      initial: "M",
      lastUpdateLabel: "Ontem, 14:15",
      name: "Mariana Costa",
      objectiveLabel: "Emagrecimento",
      phoneLabel: "Sem telefone",
      planNames: [],
      planSummaryLabel: "Sem plano",
      renewalDateLabel: "Sem plano ativo",
      renewalLabel: "Sem renovação",
      renewalTone: "slate",
      searchText: "mariana costa mariana@example.invalid sem telefone emagrecimento dieta sem plano inativo",
      serviceScopeLabel: "Dieta",
      serviceScopes: ["dieta"],
      startedAtLabel: "01/05/2026",
      status: "inactive",
      statusLabel: "Inativo",
    },
  ],
  servicePlans: [
    {
      billing_interval: "monthly",
      duration_cycles: 3,
      id: "11111111-1111-4111-8111-111111111111",
      includes_diet: true,
      includes_training: true,
      name: "PowerShape",
      price_cents: 39000,
      status: "active",
    },
  ],
  tabCounts: {
    active: 1,
    all: 2,
    inactive: 1,
    pending: 0,
    suspended: 0,
  },
  totalCount: 2,
};

describe("PartnerClientsView", () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    vi.mocked(createClient).mockReturnValue({
      functions: {
        invoke,
      },
    } as unknown as ReturnType<typeof createClient>);
    invoke.mockReset();
    vi.mocked(assignPlanToClient).mockReset();
    vi.mocked(assignPlanToClient).mockResolvedValue({ message: "Plano vinculado ao cliente.", ok: true });
    push.mockReset();
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.pointerEvents = "";
    vi.restoreAllMocks();
  });

  it("renderiza lista, filtra, navega para detalhe e exporta sem CPF", () => {
    const createObjectURL = vi.fn(() => "blob:clientes");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });

    render(<PartnerClientsView clients={clients} />);

    expect(screen.getByRole("heading", { name: "Clientes" })).toBeInTheDocument();
    expect(screen.getByText(/Total: 2 ativos/)).toBeInTheDocument();
    expect(screen.getByText("Carlos Eduardo Santos")).toBeInTheDocument();
    expect(screen.queryByText("Mariana Costa")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Status: Ativos/i }));
    expect(screen.getByText("Mariana Costa")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar clientes"), {
      target: { value: "mariana" },
    });
    expect(screen.queryByText("Carlos Eduardo Santos")).not.toBeInTheDocument();
    expect(screen.getByText("Mariana Costa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exportar" }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:clientes");

    fireEvent.click(screen.getByRole("button", { name: "Mariana Costa" }));
    expect(push).toHaveBeenCalledWith("/parceiros/clientes/patient-2");
  });

  it("valida e cria Cliente pela Edge Function", async () => {
    invoke.mockResolvedValue({
      data: {
        client: { patientId: "22222222-2222-4222-8222-222222222222" },
        invite: { status: "pending_delivery" },
        status: "created",
      },
      error: null,
    });

    render(<PartnerClientsView clients={clients} />);

    fireEvent.click(screen.getByRole("button", { name: "Novo Cliente" }));
    expect(screen.queryByText("Saúde")).not.toBeInTheDocument();
    expect(screen.queryByText("Escopos")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Plano")).toHaveValue("11111111-1111-4111-8111-111111111111");
    fireEvent.click(screen.getByRole("button", { name: "Criar e vincular Cliente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Revise os campos destacados");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Novo Cliente" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "novo@example.invalid" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+5511988887777" },
    });
    expect(screen.getByLabelText("Telefone")).toHaveValue("(11) 98888-7777");
    fireEvent.change(screen.getByLabelText("CPF opcional"), {
      target: { value: "49261729843" },
    });
    expect(screen.getByLabelText("CPF opcional")).toHaveValue("492.617.298-43");
    fireEvent.click(screen.getByRole("button", { name: "Hipertrofia" }));

    fireEvent.click(screen.getByRole("button", { name: "Criar e vincular Cliente" }));

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke).toHaveBeenCalledWith("provision-client-for-partner", {
      body: expect.objectContaining({
        displayName: "Novo Cliente",
        email: "novo@example.invalid",
        phone: "+5511988887777",
        cpf: "49261729843",
        objective: "Hipertrofia",
        serviceScopes: ["dieta", "treino"],
      }),
    });
    expect(assignPlanToClient).toHaveBeenCalledWith(expect.objectContaining({
      patientId: "22222222-2222-4222-8222-222222222222",
      priceCents: 39000,
      servicePlanId: "11111111-1111-4111-8111-111111111111",
      totalInstallments: 3,
    }));
    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText("Cliente criado e plano vinculado.")).toBeInTheDocument();
  });
});
