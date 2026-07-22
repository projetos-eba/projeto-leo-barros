"use client";

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  Info,
  Plus,
  ReceiptText,
  RefreshCcw,
  Save,
  UserPlus,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import type {
  PartnerClientPlanContract,
  PartnerClientReceivable,
  PartnerFinanceData,
  PartnerServicePlan,
} from "@/lib/partners/finance-data";
import { cn } from "@/lib/utils";

import {
  archivePartnerServicePlan,
  assignPlanToClient,
  createPartnerServicePlan,
  duplicatePartnerServicePlan,
  recordReceivablePayment,
  revertReceivablePayment,
} from "./actions";

type FinanceTab = "plans" | "contracts" | "receivables";

type PlanFormState = {
  billingInterval: "one_time" | "weekly" | "monthly" | "quarterly" | "custom";
  category: string;
  description: string;
  durationCycles: number;
  includesDiet: boolean;
  includesTraining: boolean;
  name: string;
  notes: string;
  price: string;
  status: "active" | "archived";
};

const emptyPlanForm: PlanFormState = {
  billingInterval: "monthly",
  category: "Acompanhamento",
  description: "",
  durationCycles: 3,
  includesDiet: true,
  includesTraining: true,
  name: "",
  notes: "",
  price: "",
  status: "active",
};

const intervalLabels: Record<string, string> = {
  custom: "Personalizado",
  monthly: "Mensal",
  one_time: "Único",
  quarterly: "Trimestral",
  weekly: "Semanal",
};

const methodLabels: Record<string, string> = {
  bank_transfer: "Transferência",
  boleto_external: "Boleto externo",
  card_external: "Cartão fora da plataforma",
  cash: "Dinheiro",
  other: "Outro",
  pix_external: "PIX externo",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function parseCurrencyToCents(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusLabel(receivable: PartnerClientReceivable) {
  if (receivable.status === "paid") return "Pago";
  if (receivable.status === "cancelled") return "Cancelado";
  if (new Date(`${receivable.due_date}T00:00:00`) < new Date(new Date().toDateString())) return "Atrasado";
  return "Pendente";
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]", className)}>
      {children}
    </section>
  );
}

function SummaryCard({ Icon, label, tone, value }: { Icon: typeof WalletCards; label: string; tone: string; value: string }) {
  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border sm:size-10", tone)}>
          <Icon className="size-4 sm:size-5" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] leading-4 text-[#a7b3bf] sm:text-[13px]">{label}</p>
          <p className="mt-1 break-words text-[18px] font-bold leading-6 text-white sm:mt-2 sm:text-[24px] sm:leading-7">{value}</p>
        </div>
      </div>
    </Panel>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-semibold text-[#d7e0ea]">
      {label}
      {children}
    </label>
  );
}

function ActionButton({ children, disabled, onClick, tone = "ghost", type = "button" }: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "ghost" | "primary" | "danger";
  type?: "button" | "submit";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-[8px] px-3 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" && "bg-[#287eed] text-white hover:bg-[#3c90ff]",
        tone === "danger" && "border border-[#7d3439] bg-[#2d1217] text-[#ff8b98] hover:border-[#d35b5b]",
        tone === "ghost" && "border border-[#334656] bg-[#0d1823] text-[#d8e5ee] hover:border-[#3b97e3]",
      )}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function PartnerPlansFinancialView({ data }: { data: PartnerFinanceData }) {
  const router = useRouter();
  const [tab, setTab] = useState<FinanceTab>("plans");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm);
  const [assignPlanId, setAssignPlanId] = useState<string>("");
  const [assignClientId, setAssignClientId] = useState<string>("");
  const [assignFirstDue, setAssignFirstDue] = useState(new Date().toISOString().slice(0, 10));
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignInstallments, setAssignInstallments] = useState(3);
  const [paymentReceivableId, setPaymentReceivableId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("pix_external");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const planClients = useMemo(() => {
    return data.contracts.reduce<Record<string, number>>((acc, contract) => {
      if (contract.service_plan_id && contract.status === "active") acc[contract.service_plan_id] = (acc[contract.service_plan_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [data.contracts]);

  const clientsById = useMemo(() => Object.fromEntries(data.clients.map((client) => [client.id, client])), [data.clients]);
  const plansById = useMemo(() => Object.fromEntries(data.servicePlans.map((plan) => [plan.id, plan])), [data.servicePlans]);
  const selectedAssignPlan = plansById[assignPlanId] ?? data.servicePlans.find((plan) => plan.status === "active");
  const nextReceivables = data.receivables
    .filter((receivable) => receivable.status === "pending")
    .slice(0, 5);

  function runAction(action: () => Promise<{ error?: string; message?: string; ok: boolean }>) {
    startTransition(() => {
      void action().then((result) => {
        setMessage(result.ok ? result.message ?? "Atualizado." : result.error ?? "Não foi possível concluir.");
        if (result.ok) router.refresh();
      });
    });
  }

  function submitPlan() {
    runAction(() => createPartnerServicePlan({
      billingInterval: planForm.billingInterval,
      category: planForm.category,
      description: planForm.description || null,
      durationCycles: planForm.durationCycles,
      includesDiet: planForm.includesDiet,
      includesTraining: planForm.includesTraining,
      name: planForm.name,
      notes: planForm.notes || null,
      priceCents: parseCurrencyToCents(planForm.price),
      status: planForm.status,
    }));
    setDrawerOpen(false);
    setPlanForm(emptyPlanForm);
  }

  function submitAssign() {
    if (!selectedAssignPlan || !assignClientId) return;
    runAction(() => assignPlanToClient({
      firstDueDate: assignFirstDue,
      notes: null,
      patientId: assignClientId,
      priceCents: selectedAssignPlan.price_cents,
      renewalReminder: true,
      servicePlanId: selectedAssignPlan.id,
      startDate: assignStartDate,
      totalInstallments: assignInstallments,
    }));
  }

  function submitPayment() {
    if (!paymentReceivableId) return;
    runAction(() => recordReceivablePayment({
      paidAt: paymentDate,
      paymentMethod: paymentMethod as "pix_external",
      paymentNotes: null,
      paymentReference: null,
      receivableId: paymentReceivableId,
    }));
    setPaymentReceivableId("");
  }

  return (
    <main className="min-h-screen bg-[#0b1720] px-3 py-4 text-white sm:px-5 sm:py-6">
      <div className="mx-auto grid max-w-[1280px] gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <section className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-bold leading-8 text-white sm:text-[30px] sm:leading-9">Planos & Financeiro</h1>
              <p className="mt-1 text-[12px] text-[#a7b3bf] sm:mt-2 sm:text-[14px]">Gestão manual de planos, contratos e recebimentos.</p>
            </div>
            <ActionButton tone="primary" onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" />
              Novo plano
            </ActionButton>
          </div>

          <Panel className="mt-4 border-[#287eed] p-3 sm:mt-5 sm:p-5">
            <div className="flex gap-3 sm:gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#287eed] bg-[#0a2b4a] text-[#3b97e3] sm:size-11">
                <Info className="size-5 sm:size-6" />
              </span>
              <div>
                <h2 className="text-[15px] font-bold sm:text-[17px]">Controle financeiro manual</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#d8e5ee] sm:text-[13px]">
                  Os pagamentos são realizados fora da plataforma. Não há checkout, gateway, PIX, boleto ou cobrança automática.
                </p>
              </div>
            </div>
          </Panel>

          <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard Icon={WalletCards} label="Planos ativos" tone="border-[#287eed] bg-[#08213b] text-[#3b97e3]" value={String(data.summary.activePlans)} />
            <SummaryCard Icon={UsersRound} label="Clientes com plano" tone="border-[#3e7a49] bg-[#0b2719] text-[#58d881]" value={String(data.summary.clientsWithPlan)} />
            <SummaryCard Icon={DollarSign} label="A receber no mês" tone="border-[#3e7a49] bg-[#0b2719] text-[#58d881]" value={formatCurrency(data.summary.pendingCents)} />
            <SummaryCard Icon={AlertTriangle} label="Em atraso" tone="border-[#7d3439] bg-[#2d1217] text-[#ff6f7d]" value={formatCurrency(data.summary.overdueCents)} />
          </section>

          <div className="mt-5 flex flex-wrap items-center gap-6 border-b border-[#263846]">
            {[
              ["plans", "Planos cadastrados"],
              ["contracts", "Planos dos clientes"],
              ["receivables", "Contas a receber"],
            ].map(([id, label]) => (
              <button
                className={cn(
                  "relative h-11 text-[14px] font-semibold",
                  tab === id ? "text-[#55b4ff] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[#3b97e3]" : "text-[#94a3b5]",
                )}
                key={id}
                type="button"
                onClick={() => setTab(id as FinanceTab)}
              >
                {label}
              </button>
            ))}
          </div>

          {message ? <p className="mt-3 rounded-[8px] border border-[#2d4354] bg-[#0d1823] px-4 py-3 text-[13px] text-[#8fcfff]">{message}</p> : null}

          {tab === "plans" ? (
            <Panel className="mt-4 overflow-hidden">
              <FinanceTable
                headers={["Plano", "Categoria", "Valor", "Periodicidade", "Duração", "Módulos", "Clientes", "Status", "Ações"]}
                rows={data.servicePlans.map((plan) => [
                  <div key="name"><p className="font-semibold text-white">{plan.name}</p><p className="text-[12px] text-[#8b92a3]">{plan.description ?? "Sem descrição"}</p></div>,
                  plan.category,
                  formatCurrency(plan.price_cents),
                  intervalLabels[plan.billing_interval] ?? plan.billing_interval,
                  `${plan.duration_cycles} ${plan.duration_cycles === 1 ? "ciclo" : "ciclos"}`,
                  <span className="inline-flex gap-1" key="mods">
                    {plan.includes_diet ? <span className="rounded bg-[#0e2c1e] px-2 py-1 text-[#62d98b]">Dieta</span> : null}
                    {plan.includes_training ? <span className="rounded bg-[#0a2b48] px-2 py-1 text-[#55b4ff]">Treino</span> : null}
                  </span>,
                  String(planClients[plan.id] ?? 0),
                  <span className={cn("rounded px-2 py-1 text-[12px] font-semibold", plan.status === "active" ? "bg-[#0e2c1e] text-[#62d98b]" : "bg-[#2b313a] text-[#a7b3bf]")} key="status">{plan.status === "active" ? "Ativo" : "Arquivado"}</span>,
                  <div className="flex gap-1" key="actions">
                    <IconAction label="Duplicar" disabled={pending} onClick={() => runAction(() => duplicatePartnerServicePlan(plan.id))}><Copy className="size-4" /></IconAction>
                    <IconAction label="Vincular" disabled={pending || plan.status !== "active"} onClick={() => { setAssignPlanId(plan.id); setTab("contracts"); }}><UserPlus className="size-4" /></IconAction>
                    <IconAction label="Arquivar" disabled={pending || plan.status !== "active"} onClick={() => runAction(() => archivePartnerServicePlan(plan.id))}><Archive className="size-4" /></IconAction>
                  </div>,
                ])}
                empty="Nenhum plano cadastrado."
              />
            </Panel>
          ) : null}

          {tab === "contracts" ? (
            <Panel className="mt-4 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                <select className="h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" value={assignClientId} onChange={(event) => setAssignClientId(event.target.value)}>
                  <option value="">Cliente</option>
                  {data.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <select className="h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" value={assignPlanId} onChange={(event) => setAssignPlanId(event.target.value)}>
                  <option value="">Plano</option>
                  {data.servicePlans.filter((plan) => plan.status === "active").map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
                <input className="h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" type="date" value={assignFirstDue} onChange={(event) => setAssignFirstDue(event.target.value)} />
                <ActionButton disabled={pending || !assignClientId || !selectedAssignPlan} tone="primary" onClick={submitAssign}>
                  <UserPlus className="size-4" /> Vincular
                </ActionButton>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Início">
                  <input className="h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" type="date" value={assignStartDate} onChange={(event) => setAssignStartDate(event.target.value)} />
                </Field>
                <Field label="Parcelas">
                  <input className="h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" min={1} type="number" value={assignInstallments} onChange={(event) => setAssignInstallments(Number(event.target.value))} />
                </Field>
              </div>
              <div className="mt-4 overflow-hidden rounded-[8px] border border-[#263846]">
                <FinanceTable
                  headers={["Cliente", "Plano", "Início", "Próxima cobrança", "Valor", "Situação"]}
                  rows={data.contracts.map((contract) => [
                    clientsById[contract.patient_id]?.name ?? "Cliente",
                    contract.plan_name_snapshot,
                    formatDate(contract.start_date),
                    formatDate(contract.first_due_date),
                    formatCurrency(contract.price_cents_snapshot),
                    contract.status === "active" ? "Ativo" : contract.status === "paused" ? "Pausado" : "Encerrado",
                  ])}
                  empty="Nenhum plano vinculado."
                />
              </div>
            </Panel>
          ) : null}

          {tab === "receivables" ? (
            <Panel className="mt-4 overflow-hidden">
              <FinanceTable
                headers={["Cliente", "Plano", "Parcela", "Vencimento", "Valor", "Situação", "Pagamento", "Ações"]}
                rows={data.receivables.map((receivable) => {
                  const contract = data.contracts.find((item) => item.id === receivable.contract_id);
                  const status = statusLabel(receivable);
                  return [
                    clientsById[receivable.patient_id]?.name ?? "Cliente",
                    contract?.plan_name_snapshot ?? "Plano",
                    `${receivable.installment_number}/${contract?.duration_cycles_snapshot ?? receivable.installment_number}`,
                    formatDate(receivable.due_date),
                    formatCurrency(receivable.amount_cents),
                    <span className={cn("rounded px-2 py-1 text-[12px] font-semibold", status === "Pago" ? "bg-[#0e2c1e] text-[#62d98b]" : status === "Atrasado" ? "bg-[#37171b] text-[#ff6f7d]" : "bg-[#302813] text-[#f2c84b]")} key="status">{status}</span>,
                    receivable.payment_method ? methodLabels[receivable.payment_method] : "Sem registro",
                    <div className="flex gap-1" key="actions">
                      {receivable.status === "paid" ? (
                        <IconAction label="Desfazer pagamento" disabled={pending} onClick={() => runAction(() => revertReceivablePayment(receivable.id))}><RefreshCcw className="size-4" /></IconAction>
                      ) : (
                        <IconAction label="Registrar pagamento" disabled={pending} onClick={() => setPaymentReceivableId(receivable.id)}><CheckCircle2 className="size-4" /></IconAction>
                      )}
                    </div>,
                  ];
                })}
                empty="Nenhuma parcela cadastrada."
              />
            </Panel>
          ) : null}
        </section>

        <aside className="grid content-start gap-4">
          <Panel className="p-4">
            <div className="flex gap-3">
              <ReceiptText className="size-5 text-[#8fcfff]" />
              <div>
                <h2 className="font-bold">Operação manual</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#a7b3bf]">Todas as operações são registradas manualmente. Mantenha seus controles sempre atualizados.</p>
              </div>
            </div>
          </Panel>
          <Panel className="p-4">
            <h2 className="text-[14px] font-bold">Recebimentos do mês</h2>
            <p className="mt-3 text-[24px] font-bold">{formatCurrency(data.summary.receivedMonthCents)}</p>
            <div className="mt-4 space-y-2 text-[13px]">
              <p className="flex justify-between"><span className="text-[#a7b3bf]">A receber</span><strong className="text-[#55b4ff]">{formatCurrency(data.summary.pendingCents)}</strong></p>
              <p className="flex justify-between"><span className="text-[#a7b3bf]">Em atraso</span><strong className="text-[#ff6f7d]">{formatCurrency(data.summary.overdueCents)}</strong></p>
            </div>
          </Panel>
          <Panel className="p-4">
            <h2 className="text-[14px] font-bold">Próximos vencimentos</h2>
            <div className="mt-3 space-y-3">
              {nextReceivables.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Sem vencimentos pendentes.</p> : null}
              {nextReceivables.map((receivable) => (
                <button className="grid w-full grid-cols-[1fr_auto] gap-3 rounded-[8px] border border-[#263846] bg-[#0d1823] p-3 text-left" key={receivable.id} type="button" onClick={() => setPaymentReceivableId(receivable.id)}>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{clientsById[receivable.patient_id]?.name ?? "Cliente"}</span>
                    <span className="text-[12px] text-[#8b92a3]">{formatDate(receivable.due_date)}</span>
                  </span>
                  <strong className="text-[13px]">{formatCurrency(receivable.amount_cents)}</strong>
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
          <div className="h-full w-full max-w-[500px] overflow-y-auto border-l border-[#2d4354] bg-[#0b1720] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[24px] font-bold">Novo plano</h2>
              <button className="flex size-9 items-center justify-center rounded-[8px] hover:bg-white/5" type="button" onClick={() => setDrawerOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <Panel className="mt-5 border-[#2d6ecf] p-4">
              <div className="flex gap-3">
                <Info className="size-5 text-[#55b4ff]" />
                <p className="text-[13px] leading-5 text-[#d8e5ee]">Este plano será usado apenas para gestão manual. Nenhuma cobrança será processada pela plataforma.</p>
              </div>
            </Panel>
            <div className="mt-5 grid gap-4">
              <Field label="Nome do plano">
                <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoria">
                  <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" value={planForm.category} onChange={(event) => setPlanForm({ ...planForm, category: event.target.value })} />
                </Field>
                <Field label="Valor">
                  <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" placeholder="R$ 0,00" value={planForm.price} onChange={(event) => setPlanForm({ ...planForm, price: event.target.value })} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Periodicidade">
                  <select className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" value={planForm.billingInterval} onChange={(event) => setPlanForm({ ...planForm, billingInterval: event.target.value as PlanFormState["billingInterval"] })}>
                    {Object.entries(intervalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Duração">
                  <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" min={1} type="number" value={planForm.durationCycles} onChange={(event) => setPlanForm({ ...planForm, durationCycles: Number(event.target.value) })} />
                </Field>
              </div>
              <Field label="Descrição">
                <textarea className="min-h-[88px] rounded-[8px] border border-[#303746] bg-[#081520] px-3 py-2 text-[13px]" value={planForm.description} onChange={(event) => setPlanForm({ ...planForm, description: event.target.value })} />
              </Field>
              <Panel className="p-4">
                <h3 className="font-bold">Módulos incluídos</h3>
                <div className="mt-3 grid gap-3">
                  <label className="flex items-center justify-between rounded-[8px] border border-[#263846] bg-[#0d1823] p-3">
                    <span><span className="block text-[14px] font-semibold">Dieta</span><span className="text-[12px] text-[#8b92a3]">Plano alimentar e orientações nutricionais.</span></span>
                    <input checked={planForm.includesDiet} type="checkbox" onChange={(event) => setPlanForm({ ...planForm, includesDiet: event.target.checked })} />
                  </label>
                  <label className="flex items-center justify-between rounded-[8px] border border-[#263846] bg-[#0d1823] p-3">
                    <span><span className="block text-[14px] font-semibold">Treino</span><span className="text-[12px] text-[#8b92a3]">Plano de treino e exercícios.</span></span>
                    <input checked={planForm.includesTraining} type="checkbox" onChange={(event) => setPlanForm({ ...planForm, includesTraining: event.target.checked })} />
                  </label>
                </div>
              </Panel>
              <div className="grid grid-cols-2 gap-3">
                <ActionButton onClick={() => setDrawerOpen(false)}>Cancelar</ActionButton>
                <ActionButton disabled={pending || !planForm.name || parseCurrencyToCents(planForm.price) <= 0} tone="primary" onClick={submitPlan}>
                  <Save className="size-4" /> Salvar plano
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {paymentReceivableId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 backdrop-blur-sm">
          <Panel className="w-full max-w-[420px] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold">Registrar pagamento</h2>
              <button type="button" onClick={() => setPaymentReceivableId("")}><X className="size-5" /></button>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Data do pagamento">
                <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
              </Field>
              <Field label="Forma de recebimento">
                <select className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px]" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <ActionButton disabled={pending} tone="primary" onClick={submitPayment}>
                <CheckCircle2 className="size-4" /> Registrar
              </ActionButton>
            </div>
          </Panel>
        </div>
      ) : null}
    </main>
  );
}

function FinanceTable({ empty, headers, rows }: { empty: string; headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full text-left text-[13px]">
        <thead className="bg-[#0c1823] text-[#8b92a3]">
          <tr>{headers.map((header) => <th className="px-4 py-3 font-medium" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="px-4 py-10 text-center text-[#8b92a3]" colSpan={headers.length}>{empty}</td></tr>
          ) : rows.map((row, index) => (
            <tr className="border-t border-[#263846]" key={index}>
              {row.map((cell, cellIndex) => <td className="px-4 py-3 text-[#d8e5ee]" key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconAction({ children, disabled, label, onClick }: { children: ReactNode; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-[7px] border border-[#334656] bg-[#0d1823] text-[#d8e5ee] transition hover:border-[#3b97e3] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
