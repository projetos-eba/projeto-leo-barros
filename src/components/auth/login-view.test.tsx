import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  LoginView,
  type LoginCredentials,
} from "@/components/auth/login-view";

type LoginViewHarnessProps = {
  isLoading?: boolean;
  onSubmit?: (credentials: LoginCredentials) => void;
};

function LoginViewHarness({
  isLoading = false,
  onSubmit = () => {},
}: LoginViewHarnessProps) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  return (
    <LoginView
      loginId={loginId}
      password={password}
      isLoading={isLoading}
      onLoginIdChange={setLoginId}
      onPasswordChange={setPassword}
      onSubmit={onSubmit}
    />
  );
}

describe("LoginView", () => {
  it("renderiza a identidade, os campos e a ação principal", () => {
    render(<LoginViewHarness />);

    expect(
      screen.getByRole("heading", { name: "Leonardo Barros" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Bem-vindo" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("CPF ou E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("envia as credenciais preenchidas pelo usuário", () => {
    const onSubmit = vi.fn();

    render(<LoginViewHarness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("CPF ou E-mail"), {
      target: { value: "123.456.789-00" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-segura" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      loginId: "123.456.789-00",
      password: "senha-segura",
    });
  });

  it("representa o estado visual de loading", () => {
    render(<LoginViewHarness isLoading />);

    expect(screen.getByRole("button", { name: "Entrando..." })).toBeDisabled();
  });
});
