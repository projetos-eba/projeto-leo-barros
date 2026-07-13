import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginWithPassword } from "./actions";
import { NextLoginForm } from "./login-form";

const routerReplace = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace,
  }),
}));

vi.mock("./actions", () => ({
  loginWithPassword: vi.fn(),
}));

describe("NextLoginForm", () => {
  beforeEach(() => {
    vi.mocked(loginWithPassword).mockReset();
    routerReplace.mockReset();
    routerRefresh.mockReset();
  });

  it("renderiza o login Next por e-mail", () => {
    render(<NextLoginForm />);

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("redireciona para o destino retornado pelo servidor", async () => {
    vi.mocked(loginWithPassword).mockResolvedValue({
      ok: true,
      destination: "/parceiros/dashboard",
    });

    render(<NextLoginForm />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "parceiro@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-local" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith({
        expectedRole: "cliente",
        loginId: "parceiro@example.com",
        password: "senha-local",
      });
      expect(routerReplace).toHaveBeenCalledWith("/parceiros/dashboard");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("mostra erro seguro quando o servidor rejeita o login", async () => {
    vi.mocked(loginWithPassword).mockResolvedValue({
      ok: false,
      message: "E-mail ou senha inválidos.",
    });

    render(<NextLoginForm />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "cliente@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "errada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha inválidos.",
    );
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("envia a role esperada do login de parceiro", async () => {
    vi.mocked(loginWithPassword).mockResolvedValue({
      ok: true,
      destination: "/parceiros/dashboard",
    });

    render(<NextLoginForm expectedRole="parceiro" />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "parceiro@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-local" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(loginWithPassword).toHaveBeenCalledWith({
        expectedRole: "parceiro",
        loginId: "parceiro@example.com",
        password: "senha-local",
      });
    });
  });
});
