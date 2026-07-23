import { Bell, Lock, UserRound } from "lucide-react";

import { fetchClientShellIdentity } from "@/lib/clients/home-data";

export const dynamic = "force-dynamic";

export default async function ClienteConfiguracoesPage() {
  const identity = await fetchClientShellIdentity();

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[980px]">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8fcfff]">Conta</p>
        <h1 className="mt-2 text-[34px] font-bold leading-tight">Configurações</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#9fb1c0]">
          Consulte seus dados principais e preferências do app.
        </p>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <section className="rounded-[14px] border border-[#263949] bg-[#0d1822] p-5">
            <UserRound className="size-6 text-[#8fcfff]" />
            <h2 className="mt-4 text-[18px] font-bold">Perfil</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#9fb1c0]">{identity?.name ?? "Cliente"}</p>
          </section>
          <section className="rounded-[14px] border border-[#263949] bg-[#0d1822] p-5">
            <Bell className="size-6 text-[#8fcfff]" />
            <h2 className="mt-4 text-[18px] font-bold">Notificações</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#9fb1c0]">Alertas de rotina e acompanhamentos ficam ativos no painel.</p>
          </section>
          <section className="rounded-[14px] border border-[#263949] bg-[#0d1822] p-5">
            <Lock className="size-6 text-[#8fcfff]" />
            <h2 className="mt-4 text-[18px] font-bold">Segurança</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#9fb1c0]">Para alterar a senha, use o fluxo de recuperação no login.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
