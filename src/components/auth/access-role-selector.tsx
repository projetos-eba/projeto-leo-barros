import Link from "next/link";
import { Activity, ArrowRight, Shield, UserRound, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

const accessOptions = [
  {
    href: "/login",
    icon: UserRound,
    label: "Cliente",
    role: "cliente",
    subtext: "Sou aluno/cliente acompanhado por um parceiro",
  },
  {
    href: "/login/parceiros",
    icon: UsersRound,
    label: "Parceiro",
    role: "parceiro",
    subtext: "Sou profissional ou prestador de serviço",
  },
  {
    href: "/login/admin",
    icon: Shield,
    label: "Administrador",
    role: "admin",
    subtext: "Acesso restrito à gestão da plataforma",
  },
] as const;

export function AccessRoleSelector() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-10 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-[-120px] h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-120px] h-96 w-96 rounded-full bg-primary/5 blur-[160px]" />

      <section className="page-enter relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center justify-center">
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">
              Leonardo Barros
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-normal text-foreground md:text-5xl">
            Quem está acessando?
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Escolha seu perfil para continuar
          </p>
        </div>

        <div className="grid w-full gap-4 md:grid-cols-3">
          {accessOptions.map((option) => (
            <Link
              key={option.role}
              href={option.href}
              aria-label={`${option.label}: ${option.subtext}`}
              className={cn(
                "glass-card-hover group flex min-h-56 flex-col justify-between p-6",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <option.icon className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {option.label}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {option.subtext}
                </p>
              </div>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Continuar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
