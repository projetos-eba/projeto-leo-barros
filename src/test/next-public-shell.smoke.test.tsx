import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NextFoundationPage from "@/app/(public)/page.next";
import { AppProviders } from "@/app/providers.next";

describe("shell público Next existente", () => {
  it("renderiza a página técnica atual dentro dos providers sem crash", () => {
    render(
      <AppProviders>
        <NextFoundationPage />
      </AppProviders>,
    );

    expect(
      screen.getByRole("heading", { name: "Shell público preservado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("App Router ativo")).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma tela de negócio foi migrada/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Validar Tooltip" }),
    ).toBeInTheDocument();
  });
});
