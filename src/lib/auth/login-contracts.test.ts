import { describe, expect, it } from "vitest";

import { normalizeEmailPasswordLogin } from "./login-contracts";

describe("contrato do login Next por e-mail e senha", () => {
  it("normaliza e-mail e preserva a senha informada", () => {
    expect(
      normalizeEmailPasswordLogin({
        loginId: "  PARCEIRO@EXAMPLE.COM ",
        password: "senha-local",
      }),
    ).toEqual({
      ok: true,
      email: "parceiro@example.com",
      password: "senha-local",
    });
  });

  it("rejeita CPF no fluxo Next", () => {
    expect(
      normalizeEmailPasswordLogin({
        loginId: "123.456.789-00",
        password: "senha-local",
      }),
    ).toEqual({
      ok: false,
      message: "Use o e-mail cadastrado para acessar.",
    });
  });

  it("rejeita credenciais incompletas", () => {
    expect(
      normalizeEmailPasswordLogin({
        loginId: "cliente@example.com",
        password: "",
      }),
    ).toEqual({
      ok: false,
      message: "Informe e-mail e senha para continuar.",
    });
  });
});

