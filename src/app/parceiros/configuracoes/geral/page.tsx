import { Mail, Phone, UserRound } from "lucide-react";

import { requirePartnerBillingContext } from "@/lib/billing/data";

export const dynamic = "force-dynamic";

function displayValue(value?: string | null) {
  return value?.trim() || "Nao informado";
}

function professionalRegistry(type?: string | null, number?: string | null) {
  if (!type && !number) return "Nao informado";
  return [type, number].filter(Boolean).join(" ");
}

export default async function PartnerGeneralSettingsPage() {
  const { partnerId, profileId, supabase } = await requirePartnerBillingContext();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, phone")
    .eq("id", profileId)
    .maybeSingle();
  const { data: partner } = await supabase
    .from("partners")
    .select("professional_name, professional_type, professional_registry_type, professional_registry_number")
    .eq("id", partnerId)
    .maybeSingle();

  const rows = [
    ["Nome", displayValue(profile?.display_name)],
    ["Nome profissional", displayValue(partner?.professional_name)],
    ["E-mail", displayValue(profile?.email)],
    ["Telefone", displayValue(profile?.phone)],
    ["Tipo profissional", displayValue(partner?.professional_type)],
    ["Registro profissional", professionalRegistry(partner?.professional_registry_type, partner?.professional_registry_number)],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 text-[#f1f6fa] md:px-8 lg:px-10 lg:py-[35px]">
      <header className="border-b border-[#244454]/70 pb-6">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#5db7ef]">Configuracoes</p>
        <h1 className="mt-2 text-[30px] font-bold leading-[36px] text-[#f4f8fb] md:text-[34px]">Geral</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-[22px] text-[#8ca1af]">
          Consulte os dados principais do perfil profissional vinculado a sua conta.
        </p>
      </header>

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <UserRound className="size-5 text-[#5db7ef]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Perfil</p>
          <p className="mt-1 text-[22px] font-bold text-[#f1f6fa]">{displayValue(profile?.display_name)}</p>
        </div>
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <Mail className="size-5 text-[#58d881]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">E-mail</p>
          <p className="mt-1 break-words text-[18px] font-bold text-[#f1f6fa]">{displayValue(profile?.email)}</p>
        </div>
        <div className="rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-5">
          <Phone className="size-5 text-[#5db7ef]" />
          <p className="mt-4 text-[13px] text-[#8ca1af]">Telefone</p>
          <p className="mt-1 text-[22px] font-bold text-[#f1f6fa]">{displayValue(profile?.phone)}</p>
        </div>
      </section>

      <section className="mt-6 rounded-[8px] border border-[#2b4a5d]/90 bg-[#0d2635]/80 p-6">
        <h2 className="text-[18px] font-bold">Dados profissionais</h2>
        <dl className="mt-5 grid gap-4 text-[14px] sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div className="rounded-[8px] border border-[#294657]/70 bg-[#0b2230] p-4" key={label}>
              <dt className="text-[12px] text-[#8ca1af]">{label}</dt>
              <dd className="mt-1 font-semibold text-[#eaf2f7]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
