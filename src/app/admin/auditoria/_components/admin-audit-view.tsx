"use client";

import { useMemo, useState } from "react";

import type { AdminAuditEvent } from "@/lib/admin/audit/domain/admin-audit";

export function AdminAuditView({ events }: { events: AdminAuditEvent[] }) {
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => filter === "all" ? events : events.filter((event) => event.outcome === filter), [events, filter]);
  return <main className="mx-auto w-full max-w-[1440px] px-5 py-7 text-[#e7eef3]"><h1 className="text-3xl font-bold">Auditoria administrativa</h1><p className="mt-1 text-sm text-[#9eb1bd]">Registros imutáveis de ações administrativas sensíveis.</p><label className="mt-6 block text-sm">Resultado<select className="ml-3 rounded border border-[#294a5e] bg-[#092132] px-3 py-2" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Todos</option><option value="succeeded">Concluído</option><option value="failed">Falhou</option><option value="denied">Negado</option><option value="attempted">Tentativa</option></select></label><section className="mt-5 overflow-x-auto rounded-xl border border-[#294a5e] bg-[#0d2635]"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-[#294a5e] text-xs uppercase text-[#8fa6b4]"><th className="p-4">Quando</th><th className="p-4">Ação</th><th className="p-4">Recurso</th><th className="p-4">Resultado</th><th className="p-4">Metadados permitidos</th></tr></thead><tbody>{rows.length === 0 ? <tr><td className="p-5 text-[#aabcc7]" colSpan={5}>Nenhum evento encontrado.</td></tr> : rows.map((event) => <tr className="border-b border-[#1e3b4d]" key={event.id}><td className="p-4">{new Date(event.createdAt).toLocaleString("pt-BR")}</td><td className="p-4 font-medium">{event.actionKey}</td><td className="p-4">{event.resourceType}</td><td className="p-4">{event.outcome}</td><td className="max-w-[360px] truncate p-4 text-xs text-[#b5c7d1]">{JSON.stringify(event.metadata)}</td></tr>)}</tbody></table></section></main>;
}
