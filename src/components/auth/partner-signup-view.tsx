"use client";

import { CheckCircle2, Lock, Mail, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { signupPartner } from "@/app/login/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PartnerSignupInput } from "@/lib/auth/partner-signup-contracts";

import { AuthCardShell } from "./auth-card-shell";

export function PartnerSignupView() {
  const [form, setForm] = useState<PartnerSignupInput>({
    confirmPassword: "",
    displayName: "",
    email: "",
    password: "",
    phone: "",
    professionalRegistryNumber: "",
    professionalRegistryType: "",
    professionalType: "personal_trainer",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (message) {
    return (
      <AuthCardShell
        backHref="/login/parceiros"
        backLabel="Ir para o login"
        title="Cadastro recebido"
        subtitle="Confirme seu e-mail para acessar como Parceiro."
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </AuthCardShell>
    );
  }

  function update<K extends keyof PartnerSignupInput>(
    key: K,
    value: PartnerSignupInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <AuthCardShell
      backHref="/login/parceiros"
      backLabel="Voltar para o login"
      title="Cadastro de Parceiro"
      subtitle="Crie sua conta profissional. Depois da confirmação, você será direcionado para planos se ainda não houver assinatura ativa."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await signupPartner(form);

            if (result.ok) {
              setMessage(result.message);
            } else {
              setError(result.message);
            }
          });
        }}
      >
        <Field
          icon={<UserRound className="h-4 w-4" />}
          id="displayName"
          label="Nome"
          value={form.displayName}
          onChange={(value) => update("displayName", value)}
          placeholder="Seu nome completo"
        />
        <Field
          icon={<Mail className="h-4 w-4" />}
          id="email"
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(value) => update("email", value)}
          placeholder="seu@email.com"
        />
        <Field
          icon={<Phone className="h-4 w-4" />}
          id="phone"
          label="Telefone"
          value={form.phone}
          onChange={(value) => update("phone", value)}
          placeholder="+5511999999999"
        />

        <div className="space-y-2">
          <Label>Tipo profissional</Label>
          <Select
            value={form.professionalType}
            onValueChange={(value) =>
              update(
                "professionalType",
                value as PartnerSignupInput["professionalType"],
              )
            }
          >
            <SelectTrigger className="h-12 bg-accent">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal_trainer">Personal trainer</SelectItem>
              <SelectItem value="nutricionista">Nutricionista</SelectItem>
              <SelectItem value="medico">Médico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="professionalRegistryType"
            label="Tipo do registro"
            value={form.professionalRegistryType ?? ""}
            onChange={(value) => update("professionalRegistryType", value)}
            placeholder="CREF, CRN, CRM"
          />
          <Field
            id="professionalRegistryNumber"
            label="Número do registro"
            value={form.professionalRegistryNumber ?? ""}
            onChange={(value) => update("professionalRegistryNumber", value)}
            placeholder="Opcional"
          />
        </div>

        <Field
          icon={<Lock className="h-4 w-4" />}
          id="password"
          label="Senha"
          type="password"
          value={form.password}
          onChange={(value) => update("password", value)}
          placeholder="Mínimo 8 caracteres"
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          value={form.confirmPassword}
          onChange={(value) => update("confirmPassword", value)}
          placeholder="Repita a senha"
        />
        <Button type="submit" className="h-12 w-full" disabled={isPending}>
          {isPending ? "Enviando..." : "Criar cadastro"}
        </Button>
        {error ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </form>
    </AuthCardShell>
  );
}

function Field({
  icon,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  icon?: ReactNode;
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={icon ? "h-12 bg-accent pl-10" : "h-12 bg-accent"}
          required={
            id !== "professionalRegistryType" &&
            id !== "professionalRegistryNumber"
          }
        />
      </div>
    </div>
  );
}
