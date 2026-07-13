import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  updatePasswordWithToken,
  verifyPasswordResetToken,
} from "@/app/login/account-actions";

import { ResetPasswordView } from "./reset-password-view";

vi.mock("@/app/login/account-actions", () => ({
  updatePasswordWithToken: vi.fn(),
  verifyPasswordResetToken: vi.fn(),
}));

const mockedVerifyPasswordResetToken = vi.mocked(verifyPasswordResetToken);
const mockedUpdatePasswordWithToken = vi.mocked(updatePasswordWithToken);

async function submitNewPassword() {
  const passwordField = await screen.findByLabelText("Nova senha");

  await act(async () => {
    fireEvent.change(passwordField, {
      target: { value: "senha-nova" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "senha-nova" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Redefinir senha" }));
    await Promise.resolve();
  });
}

describe("ResetPasswordView", () => {
  beforeEach(() => {
    mockedVerifyPasswordResetToken.mockReset();
    mockedUpdatePasswordWithToken.mockReset();
  });

  it("direciona Cliente para o login de Cliente apos redefinir senha", async () => {
    mockedVerifyPasswordResetToken.mockResolvedValueOnce({
      loginHref: "/login",
      ok: true,
      resetSessionId: "reset-session",
      role: "cliente",
    });
    mockedUpdatePasswordWithToken.mockResolvedValueOnce({
      loginHref: "/login",
      ok: true,
      message: "Senha redefinida com sucesso.",
    });

    render(<ResetPasswordView token="token-seguro" />);
    await submitNewPassword();

    expect(await screen.findByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login");
  });

  it("direciona Parceiro para o login de Parceiro apos redefinir senha", async () => {
    mockedVerifyPasswordResetToken.mockResolvedValueOnce({
      loginHref: "/login/parceiros",
      ok: true,
      resetSessionId: "reset-session",
      role: "parceiro",
    });
    mockedUpdatePasswordWithToken.mockResolvedValueOnce({
      loginHref: "/login/parceiros",
      ok: true,
      message: "Senha redefinida com sucesso.",
    });

    render(<ResetPasswordView token="token-seguro" />);
    await submitNewPassword();

    expect(await screen.findByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login/parceiros");
  });

  it("direciona Admin para o login administrativo apos redefinir senha", async () => {
    mockedVerifyPasswordResetToken.mockResolvedValueOnce({
      loginHref: "/login/admin",
      ok: true,
      resetSessionId: "reset-session",
      role: "admin",
    });
    mockedUpdatePasswordWithToken.mockResolvedValueOnce({
      loginHref: "/login/admin",
      ok: true,
      message: "Senha redefinida com sucesso.",
    });

    render(<ResetPasswordView token="token-seguro" />);
    await submitNewPassword();

    expect(await screen.findByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login/admin");
  });

  it("usa fallback seguro quando a atualizacao nao retorna rota", async () => {
    mockedVerifyPasswordResetToken.mockResolvedValueOnce({
      loginHref: "/login",
      ok: true,
      resetSessionId: "reset-session",
      role: "cliente",
    });
    mockedUpdatePasswordWithToken.mockResolvedValueOnce({
      ok: true,
      message: "Senha redefinida com sucesso.",
    });

    render(<ResetPasswordView token="token-seguro" />);
    await submitNewPassword();

    await waitFor(() => {
      expect(mockedUpdatePasswordWithToken).toHaveBeenCalledWith({
        confirmPassword: "senha-nova",
        password: "senha-nova",
        resetSessionId: "reset-session",
      });
    });
    expect(screen.getByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login");
  });
});
