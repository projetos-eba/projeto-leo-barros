"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Lock, Mail } from "lucide-react";

import { PlatformLogo } from "@/components/branding/platform-logo";
import { usePlatformBranding } from "@/components/branding/use-platform-branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginCredentials = {
  loginId: string;
  password: string;
};

type LoginViewProps = LoginCredentials & {
  errorMessage?: string | null;
  forgotPasswordHref?: string;
  isLoading: boolean;
  loginIdAutoComplete?: string;
  loginIdLabel?: string;
  loginIdPlaceholder?: string;
  onLoginIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (credentials: LoginCredentials) => void;
  passwordAutoComplete?: string;
  primaryAuxiliaryHref?: string;
  primaryAuxiliaryLabel?: string;
  roleLabel?: string;
  showBackToSelector?: boolean;
  subtitle?: string;
  supportText?: string;
  title?: string;
};

const LOGIN_COVER_SRC = "/auth/login-athlete-reference-20260812.jpg";

export function LoginView({
  errorMessage = null,
  forgotPasswordHref,
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
  primaryAuxiliaryHref,
  primaryAuxiliaryLabel,
  roleLabel,
  showBackToSelector = true,
  subtitle = "Acesse sua conta para continuar",
  supportText = "Acesso restrito a pacientes cadastrados",
  title = "Bem-vindo",
}: LoginViewProps) {
  const branding = usePlatformBranding();
  const LoginIcon = loginIdLabel.toLowerCase().includes("e-mail")
    ? Mail
    : CreditCard;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1720] text-foreground lg:grid lg:grid-cols-2">
      <section
        aria-hidden="true"
        className="relative hidden min-h-screen overflow-hidden bg-[#101820] lg:block"
      >
        <Image
          src={LOGIN_COVER_SRC}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-6 py-10 lg:px-12">
        <div
          className="absolute inset-x-0 top-0 h-56 overflow-hidden bg-cover bg-center lg:hidden"
          style={{ backgroundImage: `url(${LOGIN_COVER_SRC})` }}
        />

        <div className="page-enter relative z-10 w-full max-w-[380px]">
          <div className="mb-10 flex justify-center">
            <div className="inline-flex items-center gap-3">
              <PlatformLogo
                className="h-11 w-11 rounded-[10px] bg-[#f4f7fa] text-[#092333]"
                fallbackClassName="text-sm text-[#092333]"
                showIconFallback
              />
              <div className="text-left">
                <h1 className="text-2xl font-bold leading-6 text-[#f9fafb]">
                  {branding.platformName}
                </h1>
                <p className="mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-[#bac2c9]">
                  {branding.tagline}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-white/10 bg-[#0b1720]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur md:border-transparent md:bg-transparent md:p-0 md:shadow-none">
            <div className="mb-6">
              {roleLabel ? (
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  {roleLabel}
                </p>
              ) : null}
              <h2 className="text-center text-2xl font-bold leading-8 text-[#f9fafb]">
                {title}
              </h2>
              <p className="mt-2 text-center text-sm leading-6 text-[#bac2c9]">
                {subtitle}
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
                  <LoginIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="loginId"
                    type="text"
                    autoComplete={loginIdAutoComplete}
                    placeholder={loginIdPlaceholder}
                    value={loginId}
                    onChange={(event) => onLoginIdChange(event.target.value)}
                    className="h-12 rounded-[10px] border-[#303840] bg-[#181c20] pl-10 text-[#f9fafb] placeholder:text-[#bac2c9]/80 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="password"
                    className="text-sm text-muted-foreground"
                  >
                    Senha
                  </Label>
                  {forgotPasswordHref ? (
                    <Link
                      href={forgotPasswordHref}
                      className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Esqueceu a senha?
                    </Link>
                  ) : null}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={passwordAutoComplete}
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    className="h-12 rounded-[10px] border-[#303840] bg-[#181c20] pl-10 text-[#f9fafb] placeholder:text-[#bac2c9]/80 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-[10px] text-base font-semibold transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
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

            <div className="mt-8 space-y-3 text-center">
              {primaryAuxiliaryHref && primaryAuxiliaryLabel ? (
                <Link
                  href={primaryAuxiliaryHref}
                  className="inline-flex text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {primaryAuxiliaryLabel}
                </Link>
              ) : null}
              <p className="text-xs text-[#bac2c9]">{supportText}</p>
              {showBackToSelector ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Escolher outro perfil
                </Link>
              ) : null}
              <p className="pt-3 text-[11px] leading-4 text-[#bac2c9]">
                Plataforma Saúde & Performance © 2026
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export type { LoginCredentials, LoginViewProps };
