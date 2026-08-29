import Link from "next/link";

export function ClientDetailView({ patientId, summary, links }: { patientId: string; summary: Record<string, unknown>; links: Record<string, unknown>[] }) {
  const profile = (summary.profiles ?? {}) as Record<string, unknown>;
  return <main className="mx-auto w-full max-w-[1180px] px-5 py-7 text-[#e7eef3]">
    <Link className="text-sm text-[#59b8ff]" href="/admin/clientes">← Clientes</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[#9ab0be]">Cliente</p><h1 className="text-3xl font-bold">{String(profile.display_name ?? "Cliente")}</h1><p className="mt-1 text-sm text-[#a8bbc7]">{String(profile.email ?? "")}</p></div><Link className="rounded-md border border-[#2d85bf] px-3 py-2 text-sm text-[#74c7ff]" href={`/admin/clientes/${patientId}/acessos`}>Histórico de acessos</Link></div>
    <section className="mt-7 grid gap-4 rounded-xl border border-[#294a5e] bg-[#0d2635] p-5 sm:grid-cols-2 lg:grid-cols-4">
      {[["Status", profile.status], ["Telefone", summary.phone], ["Nascimento", summary.birth_date], ["Cadastro", summary.created_at]].map(([label, value]) => <div className="rounded-lg border border-[#244253] bg-[#092132] p-4" key={String(label)}><p className="text-xs uppercase text-[#8fa6b4]">{String(label)}</p><p className="mt-2 text-sm font-semibold">{value ? String(value) : "Sem registro"}</p></div>)}
    </section>
    <section className="mt-6 rounded-xl border border-[#294a5e] bg-[#0d2635] p-5"><h2 className="text-lg font-bold">Vínculos operacionais</h2><p className="mt-1 text-sm text-[#9eb1bd]">Dados de atendimento e relacionamento, sem informações clínicas.</p>
      {links.length === 0 ? <p className="mt-5 text-sm text-[#aabcc7]">Nenhum vínculo registrado.</p> : <div className="mt-5 grid gap-3">{links.map((link, index) => { const partner = (link.partners ?? {}) as Record<string, unknown>; return <div className="rounded-lg border border-[#244253] bg-[#092132] p-4" key={String(link.id ?? index)}><p className="font-semibold">{String(partner.professional_name ?? "Profissional")}</p><p className="mt-1 text-sm text-[#aabcc7]">{String(link.service_scope ?? "") } · {String(link.status ?? "")}</p><p className="mt-2 text-xs text-[#8fa6b4]">Início: {String(link.started_at ?? "Sem registro")}</p></div>; })}</div>}
    </section>
  </main>;
}
