import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminSettingsView } from "./admin-settings-view";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AdminSettingsData } from "@/lib/admin/settings-metrics";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("./actions", () => ({
  activateAdminUserAction: vi.fn(async () => ({ message: "Administrador ativado.", ok: true })),
  addIntegrationAction: vi.fn(async () => ({ message: "Integracao adicionada.", ok: true })),
  createAdminUserAction: vi.fn(async () => ({ message: "Administrador cadastrado.", ok: true })),
  deactivateAdminUserAction: vi.fn(async () => ({ message: "Administrador inativado.", ok: true })),
  deleteAdminUserAction: vi.fn(async () => ({ message: "Usuario administrativo excluido.", ok: true })),
  restoreSettingsSectionAction: vi.fn(async () => ({ message: "Padrao restaurado.", ok: true })),
  saveGeneralSettingsAction: vi.fn(async () => ({ message: "Configuracoes gerais salvas.", ok: true })),
  saveIntegrationAction: vi.fn(async () => ({ message: "Integracao salva.", ok: true })),
  saveSecuritySettingsAction: vi.fn(async () => ({ message: "Configuracoes de seguranca salvas.", ok: true })),
  testIntegrationAction: vi.fn(async () => ({ message: "Teste local concluido. Configuracao minima presente.", ok: true })),
  updateAdminUserAction: vi.fn(async () => ({ message: "Administrador atualizado.", ok: true })),
}));

const settings: AdminSettingsData = {
  activities: [
    {
      action: "settings_general_saved",
      actor: "Super Admin",
      createdAt: "29/06, 10:32",
      detail: "Dominio principal alterado para app.leonardobarros.com.br",
      id: "activity-1",
      title: "Configuracoes gerais atualizadas",
      tone: "success",
    },
  ],
  admins: [
    {
      email: "admin@example.invalid",
      id: "admin-1",
      isCurrentUser: true,
      isProtectedLastActive: true,
      name: "Super Admin",
      status: "active",
      statusLabel: "Ativo",
    },
  ],
  generatedAt: "2026-06-29T12:00:00.000Z",
  general: {
    logo: null,
    maintenanceMessage: "Voltamos em breve.",
    maintenanceMode: false,
    platformDomain: "app.leonardobarros.com.br",
    platformName: "Leonardo Barros",
  },
  integrations: [
    {
      category: "Pagamentos",
      config: { mode: "test", publicKeyRef: "pk_ref" },
      configuredFields: ["mode", "publicKeyRef"],
      id: "stripe-1",
      key: "stripe_billing",
      lastTestLabel: "Ainda nao testado",
      lastTestMessage: "Aguardando teste.",
      name: "Stripe Billing",
      status: "needs_config",
      statusLabel: "Configurar",
      statusTone: "warning",
    },
  ],
  security: {
    auditTrailEnabled: true,
    require2fa: true,
    restrictByIp: false,
    sessionTimeoutMinutes: 120,
  },
};

function renderSettings() {
  return render(
    <TooltipProvider>
      <AdminSettingsView settings={settings} />
    </TooltipProvider>,
  );
}

describe("AdminSettingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza abas enxutas e nao mostra blocos removidos", () => {
    renderSettings();

    expect(screen.getByRole("heading", { level: 1, name: /Configura/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Geral/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Usu.rio/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Integra/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Seguran/i })).toBeInTheDocument();
    expect(screen.queryByText(/Aprova/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Planos e cobran/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notifica/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ltimas altera/i })).toBeInTheDocument();
  });

  it("abre integracao no drawer, testa e salva alteracoes gerais", async () => {
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: /Integra/i }));
    fireEvent.click(screen.getByRole("button", { name: /Configurar/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Configurar integra/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Testar$/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Teste local concluido. Configuracao minima presente.").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Geral/i }));
    fireEvent.change(screen.getByDisplayValue("Leonardo Barros"), { target: { value: "LB Performance" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar altera/i }));

    await waitFor(() => {
      expect(screen.getByText("Configuracoes gerais salvas.")).toBeInTheDocument();
    });
  });

  it("renderiza CRUD de usuarios com protecao visual do admin atual", () => {
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: /Usu.rio/i }));

    expect(screen.getByRole("button", { name: /Adicionar administrador/i })).toBeInTheDocument();
    expect(screen.getByText("admin@example.invalid")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /A própria conta não pode ser removida/i })[0]).toBeDisabled();
    expect(screen.getByRole("button", { name: /Editar/i })).toBeEnabled();
  });
});
