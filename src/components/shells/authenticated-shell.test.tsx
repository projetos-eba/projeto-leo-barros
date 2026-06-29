import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthenticatedShell } from "./authenticated-shell";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >(function MockLink({ children, href, ...props }, ref) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }),
}));

const mockedUsePathname = vi.mocked(usePathname);

describe("AuthenticatedShell", () => {
  beforeEach(() => {
    mockedUsePathname.mockReset();
  });

  it("renderiza children e marca a rota Cliente como ativa", () => {
    mockedUsePathname.mockReturnValue("/cliente/inicio");

    render(
      <AuthenticatedShell profile="cliente">
        <p>Conteúdo Cliente</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByText("Conteúdo Cliente")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Início" })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("button", { name: "Dieta" })).toBeDisabled();
  });

  it("renderiza a navegação de Parceiros sem habilitar rotas futuras", () => {
    mockedUsePathname.mockReturnValue("/parceiros/dashboard");

    render(
      <AuthenticatedShell profile="parceiros">
        <p>Conteúdo Parceiros</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/parceiros/dashboard",
    );
    expect(screen.getByRole("button", { name: "Clientes" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Clientes" })).not.toBeInTheDocument();
  });

  it("mantém o Admin separado da operação de Parceiros", () => {
    mockedUsePathname.mockReturnValue("/admin/dashboard");

    render(
      <AuthenticatedShell profile="admin">
        <p>Conteúdo Admin</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("link", { name: "Visão Geral" })).toHaveAttribute(
      "href",
      "/admin/dashboard",
    );
    expect(screen.getByRole("button", { name: "Parceiros/Profissionais" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Financeiro & Planos" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Suporte" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Configurações" })).toBeDisabled();
    expect(screen.queryByText("Clientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Relatórios")).not.toBeInTheDocument();
    expect(screen.queryByText("Agenda")).not.toBeInTheDocument();
    expect(screen.queryByText("Materiais")).not.toBeInTheDocument();
  });
});
