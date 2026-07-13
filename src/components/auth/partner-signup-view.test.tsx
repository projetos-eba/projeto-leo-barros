import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getEmailVerificationStatus,
  resendEmailVerification,
  signupPartner,
} from "@/app/login/account-actions";

import { PartnerSignupView } from "./partner-signup-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/app/login/account-actions", () => ({
  getEmailVerificationStatus: vi.fn(),
  resendEmailVerification: vi.fn(),
  signupPartner: vi.fn(),
}));

vi.mock("@/app/login/actions", () => ({
  loginWithPassword: vi.fn(),
}));

const mockedGetEmailVerificationStatus = vi.mocked(getEmailVerificationStatus);
const mockedResendEmailVerification = vi.mocked(resendEmailVerification);
const mockedSignupPartner = vi.mocked(signupPartner);

describe("PartnerSignupView", () => {
  beforeEach(() => {
    mockedGetEmailVerificationStatus.mockReset();
    mockedResendEmailVerification.mockReset();
    mockedSignupPartner.mockReset();
  });

  it("exibe erro especifico de registro sem apagar dados preenchidos", async () => {
    mockedSignupPartner.mockResolvedValueOnce({
      fieldErrors: {
        professionalRegistryType: "Informe o tipo do registro.",
      },
      ok: false,
      message: "Revise os dados informados para concluir o cadastro.",
    });

    render(<PartnerSignupView />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Vinicius Ferrari" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "vinicius@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+55119984222461" },
    });
    fireEvent.change(screen.getByPlaceholderText("Opcional"), {
      target: { value: "123456-G/SP" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "senha-segura" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Criar cadastro" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Informe o tipo do registro.")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Revise os dados informados para concluir o cadastro."),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Opcional")).toHaveValue("123456-G/SP");
  });

  it("exibe confirmacao pendente com login segmentado de parceiro", async () => {
    mockedGetEmailVerificationStatus.mockResolvedValue({
      confirmed: false,
      destination: null,
      ok: true,
    });
    mockedSignupPartner.mockResolvedValueOnce({
      ok: true,
      message: "Cadastro recebido. Confirme seu e-mail para acessar.",
      verification: {
        email: "parceiro@example.com",
        loginHref: "/login/parceiros",
        profileId: "11111111-1111-4111-8111-111111111111",
        role: "parceiro",
      },
    });

    render(<PartnerSignupView />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Vinicius Ferrari" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "parceiro@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "+55119984222461" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), {
      target: { value: "senha-segura" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Criar cadastro" }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("parceiro@example.com")).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Ir para o login" }))
      .toHaveAttribute("href", "/login/parceiros");
  });
});
