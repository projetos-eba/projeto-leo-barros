import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { partnerHasActivePlan } from "@/lib/auth/partner-plan-access";
import { createClient } from "@/lib/supabase/server";

import { loginWithPassword } from "./actions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/partner-plan-access", () => ({
  partnerHasActivePlan: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedPartnerHasActivePlan = vi.mocked(partnerHasActivePlan);

function buildSupabaseMock({
  authError = null,
  profile = {
    email_confirmed_at: "2026-07-13T00:00:00.000Z",
    id: "profile-id",
    role: "parceiro",
    status: "active",
  },
}: {
  authError?: { message: string; name?: string; status?: number } | null;
  profile?: Record<string, unknown> | null;
} = {}) {
  const signOut = vi.fn();
  const maybeSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: null,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(
        authError
          ? { data: { user: null }, error: authError }
          : { data: { user: { id: "auth-user-id" } }, error: null },
      ),
      signOut,
    },
    from,
    signOut,
  };
}

describe("loginWithPassword", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedCreateClient.mockReset();
    mockedPartnerHasActivePlan.mockReset();
    mockedPartnerHasActivePlan.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mapeia e-mail nao confirmado do provedor sem mascarar como senha invalida", async () => {
    const supabase = buildSupabaseMock({
      authError: {
        message: "Email not confirmed",
        name: "AuthApiError",
        status: 400,
      },
    });
    mockedCreateClient.mockResolvedValue(supabase as never);

    await expect(
      loginWithPassword({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        password: "senha-local",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Confirme seu e-mail para acessar.",
    });
  });

  it("mantem credenciais invalidas quando o provedor rejeita login generico", async () => {
    const supabase = buildSupabaseMock({
      authError: {
        message: "Invalid login credentials",
        name: "AuthApiError",
        status: 400,
      },
    });
    mockedCreateClient.mockResolvedValue(supabase as never);

    await expect(
      loginWithPassword({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        password: "errada",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Nao foi possivel entrar. Confira seus dados ou redefina a senha.",
    });
  });

  it("retorna erro especifico quando autentica mas a role esta ausente", async () => {
    const supabase = buildSupabaseMock({
      profile: {
        email_confirmed_at: "2026-07-13T00:00:00.000Z",
        id: "profile-id",
        role: null,
        status: "active",
      },
    });
    mockedCreateClient.mockResolvedValue(supabase as never);

    await expect(
      loginWithPassword({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        password: "senha-local",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Nao foi possivel identificar o tipo da sua conta.",
    });
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("redireciona parceiro sem plano para planos sem erro falso de senha", async () => {
    const supabase = buildSupabaseMock();
    mockedCreateClient.mockResolvedValue(supabase as never);
    mockedPartnerHasActivePlan.mockResolvedValue(false);

    await expect(
      loginWithPassword({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        password: "senha-local",
      }),
    ).resolves.toEqual({
      destination: "/planos",
      ok: true,
    });
  });

  it("preserva checkout de parceiro quando a autenticacao e autorizacao passam", async () => {
    const supabase = buildSupabaseMock();
    mockedCreateClient.mockResolvedValue(supabase as never);
    mockedPartnerHasActivePlan.mockResolvedValue(true);

    await expect(
      loginWithPassword({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        next: "/parceiros/checkout?plan=complete-monthly",
        password: "senha-local",
      }),
    ).resolves.toEqual({
      destination: "/parceiros/checkout?plan=complete-monthly",
      ok: true,
    });
  });
});
