import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminSettingsView } from "./admin-settings-view";
import type { AdminSettingsData } from "@/lib/admin/settings-metrics";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("./actions", () => ({
  addIntegrationAction: vi.fn(async () => ({ message: "Integração adicionada.", ok: true })),
  restoreSettingsSectionAction: vi.fn(async () => ({ message: "Padrão restaurado.", ok: true })),
  saveGeneralSettingsAction: vi.fn(async () => ({ message: "Configurações gerais salvas.", ok: true })),
  saveIntegrationAction: vi.fn(async () => ({ message: "Integração salva.", ok: true })),
  saveSecuritySettingsAction: vi.fn(async () => ({ message: "Configurações de segurança salvas.", ok: true })),
  testIntegrationAction: vi.fn(async () => ({ message: "Teste local concluído. Configuração mínima presente.", ok: true })),
}));

const settings: AdminSettingsData = {
  activities: [
    {
      action: "settings_general_saved",
      actor: "Super Admin",
      createdAt: "29/06, 10:32",
      detail: "Domínio principal alterado para app.leonardobarros.com.br",
      id: "activity-1",
      title: "Configurações gerais atualizadas",
      tone: "success",
    },
  ],
  admins: [
    {
      email: "admin@example.invalid",
      id: "admin-1",
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
      lastTestLabel: "Ainda não testado",
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

describe("AdminSettingsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza abas enxutas e não mostra blocos removidos", () => {
    render(<AdminSettingsView settings={settings} />);

    expect(screen.getByRole("heading", { name: "Configurações" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Geral/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Usuários & Permissões/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Integrações/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Segurança/i })).toBeInTheDocument();
    expect(screen.queryByText(/Aprovação de profissionais/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Planos e cobrança/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Notificações/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Últimas alterações" })).toBeInTheDocument();
  });

  it("abre integração no drawer, testa e salva alterações gerais", async () => {
    render(<AdminSettingsView settings={settings} />);

    fireEvent.click(screen.getByRole("button", { name: /Integrações/i }));
    fireEvent.click(screen.getByRole("button", { name: /Configurar/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Configurar integração" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Testar$/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Teste local concluído. Configuração mínima presente.").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Geral/i }));
    fireEvent.change(screen.getByDisplayValue("Leonardo Barros"), { target: { value: "LB Performance" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));

    await waitFor(() => {
      expect(screen.getByText("Configurações gerais salvas.")).toBeInTheDocument();
    });
  });
});
