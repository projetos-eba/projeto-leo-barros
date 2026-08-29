"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { ProfessionalDetailTab } from "@/lib/admin/details/application/admin-details-data";

import { changeProfessionalStatus, changeSubscriptionCancellation } from "../actions";

const tabs: Array<[ProfessionalDetailTab, string]> = [
  ["overview", "Visão geral"], ["subscription", "Assinatura"], ["payments", "Pagamentos"],
  ["clients", "Clientes"], ["usage", "Utilização"], ["tickets", "Tickets"],
  ["activity", "Atividade"], ["permissions", "Permissões"],
];
const initialState = { ok: false, message: "" };

function label(value: unknown) {
  if (value === null || value === undefined || value === "") return "Sem registro";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number" && String(value).includes("amount")) return String(value);
  return String(value).replaceAll("_", " ");
}
function Cell({ value }: { value: unknown }) { return <span className="text-sm text-[#c9d8e1]">{label(value)}</span>; }

export function ProfessionalDetailView({
  partnerId, summary, tab, tabData, canChangeStatus, canManageSubscription,
}: {
  partnerId: string;
  summary: Record<string, unknown>;
  tab: ProfessionalDetailTab;
  tabData: Record<string, unknown>[];
  canChangeStatus: boolean;
  canManageSubscription: boolean;
}) {
  const [state, action, pending] = useActionState(changeProfessionalStatus, initialState);
  const [subscriptionState, subscriptionAction, subscriptionPending] = useActionState(changeSubscriptionCancellation, initialState);
  const profile = (summary.profiles ?? {}) as Record<string, unknown>;
  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-7 text-[#e7eef3]">
      <Link className="text-sm text-[#59b8ff]" href="/admin/profissionais">← Profissionais</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#9ab0be]">Profissional</p>
          <h1 className="text-3xl font-bold">{String(summary.professional_name ?? profile.display_name ?? "Profissional")}</h1>
          <p className="mt-1 text-sm text-[#a8bbc7]">{String(profile.email ?? "")}</p>
        </div>
        {canChangeStatus ? <form action={action} className="flex items-center gap-2 rounded-lg border border-[#294a5e] bg-[#0d2635] p-3">
          <input name="partnerId" type="hidden" value={partnerId} />
          <select aria-label="Status do profissional" className="bg-transparent text-sm" defaultValue={String(profile.status ?? "active")} name="status">
            <option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="disabled">Desativado</option>
          </select>
          <Button disabled={pending} size="sm" type="submit">Salvar status</Button>
          {state.message ? <span className={state.ok ? "text-xs text-emerald-300" : "text-xs text-red-300"}>{state.message}</span> : null}
        </form> : null}
      </div>
      <nav aria-label="Seções do profissional" className="mt-7 flex gap-2 overflow-x-auto border-b border-[#274658] pb-3">
        {tabs.map(([key, text]) => <Link className={`whitespace-nowrap rounded px-3 py-2 text-sm ${key === tab ? "bg-[#117ac4] text-white" : "text-[#aac0ce] hover:bg-[#102c3c]"}`} href={`/admin/profissionais/${partnerId}?tab=${key}`} key={key}>{text}</Link>)}
      </nav>
      <section className="mt-6 rounded-xl border border-[#294a5e] bg-[#0d2635] p-5">
        {tab === "overview" ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Status", profile.status], ["Especialidade", summary.professional_type], ["Registro", `${summary.professional_registry_type ?? ""} ${summary.professional_registry_number ?? ""}`.trim()], ["Cadastro", summary.created_at]].map(([title, value]) => <div className="rounded-lg border border-[#244253] bg-[#092132] p-4" key={String(title)}><p className="text-xs uppercase text-[#8fa6b4]">{String(title)}</p><p className="mt-2 text-sm font-semibold"><Cell value={value} /></p></div>)}
        </div> : tab === "permissions" ? <p className="text-sm text-[#b7c8d2]">As permissões administrativas são gerenciadas somente por Owners em Configurações.</p> : tabData.length === 0 ? <p className="text-sm text-[#aabcc7]">Nenhum registro disponível nesta seção.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr>{Object.keys(tabData[0]).filter((key) => !key.includes("stripe_")).map((key) => <th className="border-b border-[#294a5e] px-3 py-3 text-xs uppercase text-[#8fa6b4]" key={key}>{key.replaceAll("_", " ")}</th>)}{tab === "subscription" && canManageSubscription ? <th className="border-b border-[#294a5e] px-3 py-3" /> : null}</tr></thead><tbody>{tabData.map((row, index) => <tr className="border-b border-[#1e3b4d]" key={String(row.id ?? index)}>{Object.entries(row).filter(([key]) => !key.includes("stripe_")).map(([key, value]) => <td className="px-3 py-3" key={key}><Cell value={typeof value === "object" ? JSON.stringify(value) : value} /></td>)}{tab === "subscription" && canManageSubscription ? <td className="px-3 py-3"><form action={subscriptionAction}><input name="partnerId" type="hidden" value={partnerId} /><input name="subscriptionId" type="hidden" value={String(row.id ?? "")} /><input name="action" type="hidden" value={row.cancel_at_period_end ? "reverse_cancel" : "schedule_cancel"} /><Button disabled={subscriptionPending} size="sm" type="submit" variant="outline">{row.cancel_at_period_end ? "Reverter cancelamento" : "Cancelar no fim do ciclo"}</Button></form></td> : null}</tr>)}</tbody></table>{subscriptionState.message ? <p className={subscriptionState.ok ? "mt-3 text-sm text-emerald-300" : "mt-3 text-sm text-red-300"}>{subscriptionState.message}</p> : null}</div>}
      </section>
    </main>
  );
}
