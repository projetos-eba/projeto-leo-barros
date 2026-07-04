import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { logout } from "@/app/login/actions";

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

vi.mock("@/app/login/actions", () => ({
  logout: vi.fn(),
}));

const mockedUsePathname = vi.mocked(usePathname);
const mockedLogout = vi.mocked(logout);

describe("AuthenticatedShell", () => {
  beforeEach(() => {
    mockedUsePathname.mockReset();
    mockedLogout.mockReset();
  });

  it("renderiza children e marca a rota Cliente como ativa", () => {
    mockedUsePathname.mockReturnValue("/cliente/inicio");

    render(
      <AuthenticatedShell
        clientIdentity={{
          avatarUrl: "/avatars/ana-ribeiro-seed.png",
          initial: "A",
          name: "Ana Ribeiro",
        }}
        profile="cliente"
      >
        <p>Conteúdo Cliente</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByText("Conteúdo Cliente")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Ana Ribeiro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minha Evolução" })).toHaveAttribute(
      "href",
      "/cliente/evolucao",
    );
    expect(screen.getByRole("button", { name: "Configurações" })).toBeDisabled();
  });

  it("renderiza a navegação de Parceiros com Clientes habilitado", () => {
    mockedUsePathname.mockReturnValue("/parceiros/clientes");

    render(
      <AuthenticatedShell profile="parceiros">
        <p>Conteúdo Parceiros</p>
      </AuthenticatedShell>,
    );

    expect(screen.getByRole("link", { name: "Visão Geral" })).toHaveAttribute(
      "href",
      "/parceiros/dashboard",
    );
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "href",
      "/parceiros/clientes",
    );
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const logoutButton = screen.getByRole("button", { name: "Sair" });
    expect(logoutButton).toHaveAttribute("type", "button");
    fireEvent.click(logoutButton);
    expect(mockedLogout).toHaveBeenCalledTimes(1);
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
    expect(screen.getByRole("link", { name: "Parceiros/Profissionais" })).toHaveAttribute(
      "href",
      "/admin/profissionais",
    );
    expect(screen.getByRole("link", { name: "Clientes" })).toHaveAttribute(
      "href",
      "/admin/clientes",
    );
    expect(screen.getByRole("link", { name: "Financeiro & Planos" })).toHaveAttribute(
      "href",
      "/admin/financeiro",
    );
    expect(screen.getByRole("link", { name: "Suporte" })).toHaveAttribute(
      "href",
      "/admin/suporte",
    );
    expect(screen.getByRole("link", { name: "Configurações" })).toHaveAttribute(
      "href",
      "/admin/configuracoes",
    );
    expect(screen.getByRole("button", { name: "Sair" })).toHaveAttribute("type", "button");
    expect(screen.queryByText("Relatórios")).not.toBeInTheDocument();
    expect(screen.queryByText("Agenda")).not.toBeInTheDocument();
    expect(screen.queryByText("Materiais")).not.toBeInTheDocument();
  });
});
