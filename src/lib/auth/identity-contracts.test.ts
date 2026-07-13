import { describe, expect, it } from "vitest";

import {
  FUTURE_LOGIN_ROUTE,
  ROLE_HOME_ROUTES,
  getLoginRouteByRole,
  isActiveAccountStatus,
  isKnownRole,
  resolvePostLoginDestination,
} from "./identity-contracts";

describe("contratos de identidade e autorização", () => {
  it("declara a rota futura de login único sem criar runtime", () => {
    expect(FUTURE_LOGIN_ROUTE).toBe("/login");
  });

  it("resolve rotas de login por role com fallback seguro", () => {
    expect(getLoginRouteByRole("cliente")).toBe("/login");
    expect(getLoginRouteByRole("parceiro")).toBe("/login/parceiros");
    expect(getLoginRouteByRole("admin")).toBe("/login/admin");
    expect(getLoginRouteByRole("patient")).toBe("/login");
    expect(getLoginRouteByRole(undefined)).toBe("/login");
  });

  it("cliente ativo redireciona para /cliente/inicio", () => {
    expect(
      resolvePostLoginDestination({ role: "cliente", status: "active" }),
    ).toEqual({
      allowed: true,
      role: "cliente",
      destination: "/cliente/inicio",
    });
  });

  it("parceiro ativo redireciona para /parceiros/dashboard", () => {
    expect(
      resolvePostLoginDestination({ role: "parceiro", status: "active" }),
    ).toEqual({
      allowed: true,
      role: "parceiro",
      destination: "/parceiros/dashboard",
    });
  });

  it("admin ativo redireciona para /admin/dashboard", () => {
    expect(
      resolvePostLoginDestination({ role: "admin", status: "active" }),
    ).toEqual({
      allowed: true,
      role: "admin",
      destination: "/admin/dashboard",
    });
  });

  it("role ausente resulta em acesso negado", () => {
    expect(
      resolvePostLoginDestination({ role: undefined, status: "active" }),
    ).toEqual({
      allowed: false,
      destination: null,
      reason: "unknown_role",
    });
  });

  it("role inválido resulta em acesso negado", () => {
    expect(
      resolvePostLoginDestination({ role: "patient", status: "active" }),
    ).toEqual({
      allowed: false,
      destination: null,
      reason: "unknown_role",
    });
  });

  it("conta pending não recebe destino autenticado", () => {
    expect(
      resolvePostLoginDestination({ role: "cliente", status: "pending" }),
    ).toEqual({
      allowed: false,
      destination: null,
      reason: "inactive_account",
    });
  });

  it("conta suspended não recebe destino autenticado", () => {
    expect(
      resolvePostLoginDestination({ role: "parceiro", status: "suspended" }),
    ).toEqual({
      allowed: false,
      destination: null,
      reason: "inactive_account",
    });
  });

  it("conta disabled não recebe destino autenticado", () => {
    expect(
      resolvePostLoginDestination({ role: "admin", status: "disabled" }),
    ).toEqual({
      allowed: false,
      destination: null,
      reason: "inactive_account",
    });
  });

  it("nenhum cenário inválido cai em /admin/dashboard", () => {
    const invalidResults = [
      resolvePostLoginDestination({ role: undefined, status: "active" }),
      resolvePostLoginDestination({ role: null, status: "active" }),
      resolvePostLoginDestination({ role: "", status: "active" }),
      resolvePostLoginDestination({ role: "patient", status: "active" }),
      resolvePostLoginDestination({ role: "cliente", status: "pending" }),
      resolvePostLoginDestination({ role: "parceiro", status: "suspended" }),
      resolvePostLoginDestination({ role: "admin", status: "disabled" }),
    ];

    invalidResults.forEach((result) => {
      expect(result).toMatchObject({
        allowed: false,
        destination: null,
      });
    });

    expect(
      invalidResults.some(
        (result) => result.destination === ROLE_HOME_ROUTES.admin,
      ),
    ).toBe(false);
  });

  it("valida somente roles oficiais conhecidos", () => {
    expect(isKnownRole("cliente")).toBe(true);
    expect(isKnownRole("parceiro")).toBe(true);
    expect(isKnownRole("admin")).toBe(true);
    expect(isKnownRole("patient")).toBe(false);
    expect(isKnownRole(undefined)).toBe(false);
  });

  it("considera ativa somente conta active", () => {
    expect(isActiveAccountStatus("active")).toBe(true);
    expect(isActiveAccountStatus("pending")).toBe(false);
    expect(isActiveAccountStatus("suspended")).toBe(false);
    expect(isActiveAccountStatus("disabled")).toBe(false);
    expect(isActiveAccountStatus(undefined)).toBe(false);
  });
});
