"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { SanitizedSecurityRow } from "@/lib/admin/security/application/admin-security-data";

import { revokeGlobalSession } from "../actions";
const initialState = { ok: false, message: "" };

export function AdminSecurityView({ sessions, events }: { sessions: SanitizedSecurityRow[]; events: SanitizedSecurityRow[] }) {
  const [state, action, pending] = useActionState(revokeGlobalSession, initialState);
  return <main className="mx-auto w-full max-w-[1440px] px-5 py-7 text-[#e7eef3]"><h1 className="text-3xl font-bold">Segurança administrativa</h1><p className="mt-1 text-sm text-[#9eb1bd]">Sessões e eventos de autenticação sanitizados para os três perfis.</p><p className="mt-3 rounded-lg border border-[#294a5e] bg-[#0d2635] p-3 text-sm text-[#b9cbd5]">A autenticação multifator está pronta para acompanhamento de nível de garantia e fator; a exigência só será ativada quando o fluxo de login MFA estiver integrado.</p>{state.message ? <p className={state.ok ? "mt-3 text-sm text-emerald-300" : "mt-3 text-sm text-red-300"}>{state.message}</p> : null}<section className="mt-6 grid gap-5 lg:grid-cols-2"><SecurityList title="Sessões" rows={sessions} action={action} pending={pending} /><SecurityList title="Eventos de autenticação" rows={events} /></section></main>;
}
function SecurityList({ title, rows, action, pending }: { title: string; rows: SanitizedSecurityRow[]; action?: (formData: FormData) => void; pending?: boolean }) { return <section className="rounded-xl border border-[#294a5e] bg-[#0d2635] p-5"><h2 className="font-bold">{title}</h2>{rows.length === 0 ? <p className="mt-4 text-sm text-[#aabcc7]">Nenhum registro disponível.</p> : <div className="mt-4 grid max-h-[620px] gap-3 overflow-auto">{rows.map((row, index) => <div className="rounded-lg border border-[#244253] bg-[#092132] p-3" key={String(row.session_id ?? row.event_id ?? index)}><pre className="overflow-x-auto text-xs text-[#c8d7df]">{JSON.stringify(row, null, 2)}</pre>{action && row.profile_id ? <form action={action} className="mt-2"><input name="targetProfileId" type="hidden" value={String(row.profile_id)} /><Button disabled={pending} size="sm" type="submit" variant="outline">Revogar sessões globais</Button></form> : null}</div>)}</div>}</section>; }
