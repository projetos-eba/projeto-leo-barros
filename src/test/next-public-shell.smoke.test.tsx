import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NextFoundationPage from "@/app/(public)/page";
import { AppProviders } from "@/app/providers";

describe("shell publico Next existente", () => {
  it("renderiza o seletor de perfil dentro dos providers sem crash", () => {
    render(
      <AppProviders>
        <NextFoundationPage />
      </AppProviders>,
    );

    expect(
      screen.getByRole("heading", { name: "Quem está acessando?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Cliente: Sou aluno\/cliente acompanhado por um profissional/,
      }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", {
        name: /Parceiro: Sou profissional ou prestador de serviço/,
      }),
    ).toHaveAttribute("href", "/login/parceiros");
    expect(
      screen.getByRole("link", {
        name: /Administrador: Acesso restrito à gestão da plataforma/,
      }),
    ).toHaveAttribute("href", "/login/admin");
    expect(
      screen.getByText("Escolha seu perfil para continuar"),
    ).toBeInTheDocument();
  });
});
