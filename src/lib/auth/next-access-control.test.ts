import { describe, expect, it } from "vitest";

import { resolveProtectedShellAccess } from "./next-access-control";

describe("guards mínimos dos shells Next", () => {
  it("permite acesso quando role e status correspondem ao shell", () => {
    expect(
      resolveProtectedShellAccess({
        requiredRole: "admin",
        role: "admin",
        status: "active",
      }),
    ).toEqual({
      allowed: true,
      role: "admin",
    });
  });

  it("redireciona usuário ativo para o shell canônico do próprio role", () => {
    expect(
      resolveProtectedShellAccess({
        requiredRole: "admin",
        role: "parceiro",
        status: "active",
      }),
    ).toEqual({
      allowed: false,
      action: "redirect",
      destination: "/parceiros/dashboard",
      reason: "wrong_role",
    });
  });

  it("bloqueia profile inativo sem destino autenticado", () => {
    expect(
      resolveProtectedShellAccess({
        requiredRole: "cliente",
        role: "cliente",
        status: "suspended",
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "inactive_account",
    });
  });

  it("bloqueia role desconhecida sem fallback para admin", () => {
    expect(
      resolveProtectedShellAccess({
        requiredRole: "admin",
        role: "patient",
        status: "active",
      }),
    ).toEqual({
      allowed: false,
      action: "block",
      reason: "unknown_role",
    });
  });
});

