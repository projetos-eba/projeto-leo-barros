import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getEmailVerificationStatus,
  resendEmailVerification,
} from "@/app/login/account-actions";
import {
  type LoginActionResult,
  loginWithPassword,
} from "@/app/login/actions";

import { EmailVerificationPendingView } from "./email-verification-pending-view";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/app/login/account-actions", () => ({
  getEmailVerificationStatus: vi.fn(),
  resendEmailVerification: vi.fn(),
}));

vi.mock("@/app/login/actions", () => ({
  loginWithPassword: vi.fn(),
}));

const routerReplace = vi.fn();
const routerRefresh = vi.fn();
const mockedUseRouter = vi.mocked(useRouter);
const mockedGetEmailVerificationStatus = vi.mocked(getEmailVerificationStatus);
const mockedResendEmailVerification = vi.mocked(resendEmailVerification);
const mockedLoginWithPassword = vi.mocked(loginWithPassword);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("EmailVerificationPendingView", () => {
  beforeEach(() => {
    routerReplace.mockReset();
    routerRefresh.mockReset();
    mockedUseRouter.mockReturnValue({
      replace: routerReplace,
      refresh: routerRefresh,
    } as ReturnType<typeof useRouter>);
    mockedGetEmailVerificationStatus.mockReset();
    mockedResendEmailVerification.mockReset();
    mockedLoginWithPassword.mockReset();
  });

  it("redireciona quando o polling encontra e-mail confirmado", async () => {
    mockedGetEmailVerificationStatus.mockResolvedValueOnce({
      confirmed: true,
      destination: "/planos",
      ok: true,
    });

    render(
      <EmailVerificationPendingView
        email="parceiro@example.com"
        loginHref="/login/parceiros"
        message="Cadastro recebido."
        profileId="11111111-1111-4111-8111-111111111111"
        role="parceiro"
        title="Cadastro recebido"
      />,
    );

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith("/planos");
    });
    expect(mockedGetEmailVerificationStatus).toHaveBeenCalledWith({
      profileId: "11111111-1111-4111-8111-111111111111",
      role: "parceiro",
    });
    expect(mockedLoginWithPassword).not.toHaveBeenCalled();
  });

  it("faz auto-login apos confirmacao e preserva checkout escolhido", async () => {
    const loginResult = deferred<LoginActionResult>();
    mockedGetEmailVerificationStatus.mockResolvedValueOnce({
      confirmed: true,
      destination: "/planos",
      ok: true,
    });
    mockedLoginWithPassword.mockReturnValueOnce(loginResult.promise);

    render(
      <EmailVerificationPendingView
        autoLogin={{
          next: "/parceiros/checkout?plan=complete-annual",
          password: "senha-segura",
        }}
        email="parceiro@example.com"
        loginHref="/login/parceiros"
        message="Cadastro recebido."
        profileId="11111111-1111-4111-8111-111111111111"
        role="parceiro"
        title="Cadastro recebido"
      />,
    );

    await waitFor(() => {
      expect(mockedLoginWithPassword).toHaveBeenCalledWith({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        next: "/parceiros/checkout?plan=complete-annual",
        password: "senha-segura",
      });
    });

    expect(screen.getByRole("button", { name: /Reenviar em/ }))
      .toBeDisabled();

    loginResult.resolve({
      destination: "/parceiros/checkout?plan=complete-annual",
      ok: true,
    });

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith(
        "/parceiros/checkout?plan=complete-annual",
      );
    });
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("redireciona para o destino confirmado quando o auto-login falha", async () => {
    mockedGetEmailVerificationStatus.mockResolvedValueOnce({
      confirmed: true,
      destination: "/planos",
      ok: true,
    });
    mockedLoginWithPassword.mockResolvedValueOnce({
      ok: false,
      message: "E-mail ou senha invalidos.",
    });

    render(
      <EmailVerificationPendingView
        autoLogin={{
          password: "senha-com-divergencia",
        }}
        email="parceiro@example.com"
        loginHref="/login/parceiros"
        message="Cadastro recebido."
        profileId="11111111-1111-4111-8111-111111111111"
        role="parceiro"
        title="Cadastro recebido"
      />,
    );

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith("/planos");
    });
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(screen.queryByText("E-mail ou senha invalidos.")).not
      .toBeInTheDocument();
  });

  it("mantem reenvio bloqueado durante o cooldown inicial", () => {
    mockedGetEmailVerificationStatus.mockResolvedValue({
      confirmed: false,
      destination: null,
      ok: true,
    });

    render(
      <EmailVerificationPendingView
        email="cliente@example.com"
        loginHref="/login"
        message="Senha criada."
        profileId="22222222-2222-4222-8222-222222222222"
        role="cliente"
        title="Senha criada"
      />,
    );

    expect(screen.getByRole("button", { name: /Reenviar em 60s/ }))
      .toBeDisabled();
    expect(screen.getByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login");
  });
});
