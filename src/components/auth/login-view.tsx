import { Activity, CreditCard, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginCredentials = {
  loginId: string;
  password: string;
};

type LoginViewProps = LoginCredentials & {
  errorMessage?: string | null;
  isLoading: boolean;
  loginIdAutoComplete?: string;
  loginIdLabel?: string;
  loginIdPlaceholder?: string;
  onLoginIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (credentials: LoginCredentials) => void;
  passwordAutoComplete?: string;
  supportText?: string;
};

export function LoginView({
  errorMessage = null,
  isLoading,
  loginId,
  loginIdAutoComplete = "username",
  loginIdLabel = "CPF ou E-mail",
  loginIdPlaceholder = "000.000.000-00 ou seu@email.com",
  onLoginIdChange,
  onPasswordChange,
  onSubmit,
  password,
  passwordAutoComplete = "current-password",
  supportText = "Acesso restrito a pacientes cadastrados",
}: LoginViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/3 rounded-full blur-[150px]" />

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground">Leonardo Barros</h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">
                Saúde & Performance
              </p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo</h2>
            <p className="text-muted-foreground mt-1">
              Acesse sua conta para continuar
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit({ loginId, password });
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label
                htmlFor="loginId"
                className="text-sm text-muted-foreground"
              >
                {loginIdLabel}
              </Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="loginId"
                  type="text"
                  autoComplete={loginIdAutoComplete}
                  placeholder={loginIdPlaceholder}
                  value={loginId}
                  onChange={(event) => onLoginIdChange(event.target.value)}
                  className="pl-10 bg-accent border-border focus:border-primary h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm text-muted-foreground"
              >
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={passwordAutoComplete}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  className="pl-10 bg-accent border-border focus:border-primary h-12"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold text-base rounded-[10px] transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            {errorMessage ? (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {supportText}
          </p>
        </div>
      </div>
    </div>
  );
}

export type { LoginCredentials, LoginViewProps };
