import {
  CheckCircle2,
  MailCheck,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";

import { CreatePartnerForm } from "./create-partner-form";

const adminMetrics = [
  {
    icon: UserRoundPlus,
    label: "Provisionamento",
    value: "Local",
    detail: "Parceiros ficticios via Supabase local",
  },
  {
    icon: ShieldCheck,
    label: "Seguranca",
    value: "Edge",
    detail: "Service role restrita a provision-partner",
  },
  {
    icon: MailCheck,
    label: "Convite",
    value: "Pendente",
    detail: "pending_delivery ate configurar envio real",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Super Admin
          </p>
          <h1 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
            Criar Parceiro
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Primeiro fluxo funcional do Admin no Next: cadastro controlado de
            Parceiro local, sem senha exposta e sem envio real de e-mail.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-4" />
          Fase F
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {adminMetrics.map((metric) => (
          <div className="glass-card p-5" key={metric.label}>
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <metric.icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <CreatePartnerForm />
    </div>
  );
}
