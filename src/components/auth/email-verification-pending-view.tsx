"use client";

import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  getEmailVerificationStatus,
  resendEmailVerification,
} from "@/app/login/account-actions";
import { loginWithPassword } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import type { OfficialRole } from "@/lib/auth/identity-contracts";

import { AuthCardShell } from "./auth-card-shell";

const POLLING_INTERVAL_MS = 5_000;
const RESEND_COOLDOWN_SECONDS = 60;

type EmailVerificationPendingViewProps = {
  autoLogin?: {
    next?: string;
    password: string;
  };
  email: string;
  loginHref: string;
  message: string;
  profileId: string;
  role: Exclude<OfficialRole, "admin">;
  title: string;
};

export function EmailVerificationPendingView({
  autoLogin,
  email,
  loginHref,
  message,
  profileId,
  role,
  title,
}: EmailVerificationPendingViewProps) {
  const router = useRouter();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [authFailure, setAuthFailure] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isResendPending, startResendTransition] = useTransition();
  const redirectStartedRef = useRef(false);
  const roleLabel = role === "parceiro" ? "Parceiro" : "Cliente";
  const canPoll = useMemo(() => Boolean(profileId), [profileId]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timeout = window.setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  useEffect(() => {
    if (!canPoll || authFailure || redirectStartedRef.current) return;

    let active = true;

    async function checkStatus() {
      const status = await getEmailVerificationStatus({ profileId, role });

      if (!active || !status.ok || !status.confirmed || !status.destination) {
        return;
      }

      if (redirectStartedRef.current) return;
      redirectStartedRef.current = true;
      setIsRedirecting(true);

      if (autoLogin) {
        const login = await loginWithPassword({
          expectedRole: role,
          loginId: email,
          next: autoLogin.next,
          password: autoLogin.password,
        });

        if (!active) return;

        if (login.ok) {
          router.replace(login.destination);
          router.refresh();
          return;
        }

        if (status.destination) {
          router.replace(status.destination);
          return;
        }

        setFeedback(login.message);
        setAuthFailure(true);
        redirectStartedRef.current = false;
        setIsRedirecting(false);
        return;
      }

      router.replace(status.destination);
    }

    void checkStatus();
    const interval = window.setInterval(() => {
      void checkStatus();
    }, POLLING_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [
    authFailure,
    autoLogin,
    canPoll,
    email,
    profileId,
    role,
    router,
  ]);

  function handleResend() {
    if (cooldown > 0 || isResendPending || !profileId) return;

    setFeedback(null);
    startResendTransition(async () => {
      const result = await resendEmailVerification({ profileId, role });

      if (result.ok) {
        setFeedback(result.message);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setFeedback(result.message);
      }
    });
  }

  return (
    <AuthCardShell
      backHref={loginHref}
      backLabel="Ir para o login"
      title={title}
      subtitle={`Confirme seu e-mail para acessar como ${roleLabel}.`}
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {isRedirecting ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Mail className="h-8 w-8 text-primary" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          <p className="break-all text-sm font-semibold text-foreground">
            {email}
          </p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-left text-sm leading-6 text-muted-foreground">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              Após a confirmação, você será redirecionado automaticamente.
            </p>
          </div>
        </div>
        <Button
          className="h-12 w-full"
          disabled={cooldown > 0 || isResendPending || !profileId}
          onClick={handleResend}
          type="button"
          variant="outline"
        >
          {isResendPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reenviando...
            </>
          ) : cooldown > 0 ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reenviar em {cooldown}s
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reenviar e-mail
            </>
          )}
        </Button>
        {feedback ? (
          <p className="text-sm text-muted-foreground" role="status">
            {feedback}
          </p>
        ) : null}
      </div>
    </AuthCardShell>
  );
}
