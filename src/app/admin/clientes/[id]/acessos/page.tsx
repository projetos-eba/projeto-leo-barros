import Link from "next/link";
import { notFound } from "next/navigation";

import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";
import { fetchClientDetailSummary } from "@/lib/admin/details/application/admin-details-data";
import { createClient } from "@/lib/supabase/server";

type SecurityClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> };
export const dynamic = "force-dynamic";

export default async function AdminClientAccessPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, authorization] = await Promise.all([params, requireAdminCapability("security.read")]);
  if (!authorization) return <AccessBlocked title="Acesso restrito" description="Somente Owners podem consultar histórico de acessos." />;
  const summary = await fetchClientDetailSummary(id);
  if (!summary) notFound();
  const profile = (summary.profiles ?? {}) as Record<string, unknown>;
  const supabase = (await createClient()) as unknown as SecurityClient;
  const [{ data: sessions, error: sessionsError }, { data: events, error: eventsError }] = await Promise.all([
    supabase.rpc("admin_security_sessions", { p_target_profile_id: profile.id, p_limit: 50 }),
    supabase.rpc("admin_security_auth_events", { p_target_profile_id: profile.id, p_limit: 100 }),
  ]);
  if (sessionsError || eventsError) throw new Error("Não foi possível carregar o histórico de acessos.");
  const sections: Array<{ title: string; rows: Record<string, unknown>[] }> = [{ title: "Sessões", rows: sessions ?? [] }, { title: "Eventos de autenticação", rows: events ?? [] }];
  return <main className="mx-auto w-full max-w-[1180px] px-5 py-7 text-[#e7eef3]"><Link className="text-sm text-[#59b8ff]" href={`/admin/clientes/${id}`}>← Cliente</Link><h1 className="mt-4 text-3xl font-bold">Histórico de acessos</h1><p className="mt-1 text-sm text-[#9eb1bd]">{String(profile.display_name ?? "Cliente")} · dados sanitizados de autenticação.</p><section className="mt-6 grid gap-5 lg:grid-cols-2">{sections.map(({ title, rows }) => <div className="rounded-xl border border-[#294a5e] bg-[#0d2635] p-5" key={title}><h2 className="font-bold">{title}</h2>{rows.length === 0 ? <p className="mt-4 text-sm text-[#aabcc7]">Nenhum registro disponível.</p> : <div className="mt-4 grid gap-3">{rows.map((row, index) => <pre className="overflow-x-auto rounded bg-[#092132] p-3 text-xs text-[#c7d7e0]" key={String(row.session_id ?? row.event_id ?? index)}>{JSON.stringify(row, null, 2)}</pre>)}</div>}</div>)}</section></main>;
}
