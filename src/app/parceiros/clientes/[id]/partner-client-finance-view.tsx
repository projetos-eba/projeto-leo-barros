"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, DollarSign, Folder, Info, RefreshCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import type { PartnerClientReceivable, PartnerFinanceData } from "@/lib/partners/finance-data";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import { recordReceivablePayment, revertReceivablePayment } from "../../planos-financeiro/actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type ReceivableFilter = "all" | "pending" | "paid" | "overdue";
type PaymentMethod = "pix_external" | "cash" | "bank_transfer" | "card_external" | "boleto_external" | "other";

const methodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Transferência",
  boleto_external: "Boleto",
  card_external: "Cartão",
  cash: "Dinheiro",
  other: "Outro",
  pix_external: "PIX",
};

const filterLabels: Record<ReceivableFilter, string> = {
  all: "Todas",
  overdue: "Atrasadas",
  paid: "Pagas",
  pending: "Pendentes",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatPaidDate(value: string | null) {
  if (!value) return "Sem registro";
  return new Date(value).toLocaleDateString("pt-BR");
}

function todayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function receivableStatus(status: string, dueDate: string) {
  if (status === "paid") return "Pago";
  if (status === "cancelled") return "Cancelado";
  if (new Date(`${dueDate}T00:00:00`) < new Date(new Date().toDateString())) return "Atrasado";
  return "Pendente";
}

function receivableTone(status: string) {
  if (status === "Pago") return "bg-[#0e2c1e] text-[#62d98b]";
  if (status === "Atrasado") return "bg-[#37171b] text-[#ff6f7d]";
  if (status === "Cancelado") return "bg-[#2b313a] text-[#a7b3bf]";
  return "bg-[#302813] text-[#f2c84b]";
}

export function PartnerClientFinanceView({ finance, overview }: { finance: PartnerFinanceData; overview: PartnerClientOverviewData }) {
  const router = useRouter();
  const patientId = overview.client.id;
  const contracts = finance.contracts.filter((contract) => contract.patient_id === patientId);
  const receivables = finance.receivables
    .filter((receivable) => receivable.patient_id === patientId)
    .sort((left, right) => left.due_date.localeCompare(right.due_date));
  const activeContract = contracts.find((contract) => contract.status === "active") ?? contracts[0] ?? null;
  const [filter, setFilter] = useState<ReceivableFilter>("all");
  const [paymentReceivableId, setPaymentReceivableId] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState(todayInputValue());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix_external");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const pendingCents = receivables
    .filter((receivable) => receivable.status === "pending")
    .reduce((total, receivable) => total + receivable.amount_cents, 0);
  const paidYearCents = receivables
    .filter((receivable) => receivable.status === "paid" && receivable.paid_at?.startsWith(String(new Date().getFullYear())))
    .reduce((total, receivable) => total + receivable.amount_cents, 0);
  const nextReceivable = receivables
    .filter((receivable) => receivable.status === "pending")
    .sort((left, right) => left.due_date.localeCompare(right.due_date))[0] ?? null;
  const overdueReceivables = receivables.filter((receivable) => receivableStatus(receivable.status, receivable.due_date) === "Atrasado");
  const paidReceivables = receivables.filter((receivable) => receivable.status === "paid");
  const openReceivables = receivables.filter((receivable) => receivable.status === "pending");
  const filteredReceivables = useMemo(() => {
    if (filter === "paid") return receivables.filter((receivable) => receivable.status === "paid");
    if (filter === "pending") return receivables.filter((receivable) => receivable.status === "pending");
    if (filter === "overdue") return receivables.filter((receivable) => receivableStatus(receivable.status, receivable.due_date) === "Atrasado");
    return receivables;
  }, [filter, receivables]);
  const selectedReceivable = receivables.find((receivable) => receivable.id === paymentReceivableId) ?? null;

  function contractFor(receivable: PartnerClientReceivable) {
    return contracts.find((item) => item.id === receivable.contract_id) ?? null;
  }

  function runAction(action: () => Promise<{ error?: string; message?: string; ok: boolean }>) {
    startTransition(() => {
      void action().then((result) => {
        setMessage(result.ok ? result.message ?? "Atualizado." : result.error ?? "Não foi possível concluir.");
        if (result.ok) router.refresh();
      });
    });
  }

  function openPayment(receivableId: string) {
    setPaymentReceivableId(receivableId);
    setPaymentDate(todayInputValue());
    setPaymentMethod("pix_external");
    setPaymentReference("");
    setPaymentNotes("");
    setMessage(null);
  }

  function submitPayment() {
    if (!selectedReceivable) return;
    runAction(() => recordReceivablePayment({
      paidAt: paymentDate,
      paymentMethod,
      paymentNotes: paymentNotes || null,
      paymentReference: paymentReference || null,
      receivableId: selectedReceivable.id,
    }));
    setPaymentReceivableId("");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0b1720] pb-10 text-white sm:pb-12">
      <div className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-6 sm:py-6">
        <PartnerClientProfileHeader activeTab="planos-financeiro" overview={overview} />

        <section className="mt-5 rounded-[10px] border border-[#287eed] bg-[linear-gradient(153deg,rgba(13,51,91,0.48),rgba(96,144,181,0)_79%)] p-3 sm:mt-8 sm:p-4">
          <div className="flex gap-3">
            <Info className="size-5 shrink-0 text-[#55b4ff]" />
            <p className="text-[13px] leading-5 text-[#d8e5ee]">Os pagamentos são realizados fora da plataforma. Use esta área para acompanhar contratos e recebimentos registrados manualmente.</p>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard Icon={Folder} label="Plano atual" value={activeContract?.plan_name_snapshot ?? "Sem plano"} subtext={activeContract ? "Ativo" : "Nenhum vínculo ativo"} tone="green" />
          <MetricCard Icon={CalendarClock} label="Próximo vencimento" value={nextReceivable ? formatDate(nextReceivable.due_date) : "Sem vencimento"} subtext={nextReceivable ? formatCurrency(nextReceivable.amount_cents) : "Nada pendente"} tone="amber" />
          <MetricCard Icon={DollarSign} label="Total pago no ano" value={formatCurrency(paidYearCents)} subtext={`${receivables.filter((item) => item.status === "paid").length} pagamento(s)`} tone="blue" />
          <MetricCard Icon={AlertTriangle} label="Saldo pendente" value={formatCurrency(pendingCents)} subtext={`${receivables.filter((item) => receivableStatus(item.status, item.due_date) === "Atrasado").length} em atraso`} tone="red" />
        </section>

        <section className="mt-4 grid min-w-0 gap-4 xl:mt-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-3 sm:p-5">
            <h2 className="text-[18px] font-bold">Planos cadastrados para o cliente</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {contracts.length === 0 ? <p className="text-[13px] text-[#8b92a3]">Nenhum plano vinculado.</p> : null}
              {contracts.map((contract) => (
                <article className={cn("rounded-[8px] border p-4", contract.status === "active" ? "border-[#287eed] bg-[#0d2b43]" : "border-[#303746] bg-[#0b1823]")} key={contract.id}>
                  <span className="rounded bg-[#0e2c1e] px-2 py-1 text-[11px] font-semibold text-[#62d98b]">{contract.status === "active" ? "Ativo" : "Encerrado"}</span>
                  <h3 className="mt-3 text-[15px] font-bold">{contract.plan_name_snapshot}</h3>
                  <p className="mt-2 text-[13px] text-[#62d98b]">{formatCurrency(contract.price_cents_snapshot)} / {contract.billing_interval_snapshot === "monthly" ? "mês" : "ciclo"}</p>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">Início em {formatDate(contract.start_date)}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[18px] font-bold">Gestão de recebimentos</h2>
                <p className="mt-1 text-[13px] text-[#8b92a3]">Acompanhe parcelas, vencimentos e pagamentos registrados.</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
                {(Object.keys(filterLabels) as ReceivableFilter[]).map((item) => (
                  <button
                    className={cn(
                      "h-9 shrink-0 rounded-[8px] border px-3 text-[12px] font-semibold transition",
                      filter === item ? "border-[#287eed] bg-[#0d2b43] text-[#8fcfff]" : "border-[#334656] bg-[#0d1823] text-[#a7b3bf] hover:border-[#3b97e3]",
                    )}
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                  >
                    {filterLabels[item]}
                  </button>
                ))}
              </div>
            </div>

            {message ? (
              <p className="mt-3 rounded-[8px] border border-[#2d4354] bg-[#0d1823] px-4 py-3 text-[13px] text-[#8fcfff]" role="status">
                {message}
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SmallSummary label="Em aberto" value={formatCurrency(pendingCents)} subtext={`${openReceivables.length} parcela(s)`} />
              <SmallSummary label="Atrasadas" value={String(overdueReceivables.length)} subtext={formatCurrency(overdueReceivables.reduce((total, item) => total + item.amount_cents, 0))} tone="red" />
              <SmallSummary label="Pagas" value={String(paidReceivables.length)} subtext={formatCurrency(paidYearCents)} tone="green" />
            </div>

            <div className="mt-3 w-full max-w-full overflow-x-auto rounded-[8px] border border-[#263846]">
              <table className="w-full min-w-[760px] text-left text-[12px] sm:min-w-[980px] sm:text-[13px]">
                <thead className="bg-[#0c1823] text-[#8b92a3]">
                  <tr>
                    <th className="px-3 py-3 font-medium sm:px-4">Vencimento</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Plano</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Parcela</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Valor</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Status</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Pagamento</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Forma</th>
                    <th className="px-3 py-3 text-right font-medium sm:px-4">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceivables.length === 0 ? (
                    <tr><td className="px-3 py-8 text-center text-[#8b92a3] sm:px-4" colSpan={8}>Nenhum recebimento encontrado.</td></tr>
                  ) : filteredReceivables.map((receivable) => {
                    const contract = contractFor(receivable);
                    const status = receivableStatus(receivable.status, receivable.due_date);
                    return (
                      <tr className="border-t border-[#263846]" key={receivable.id}>
                        <td className="px-3 py-3 sm:px-4">{formatDate(receivable.due_date)}</td>
                        <td className="px-3 py-3 sm:px-4">{contract?.plan_name_snapshot ?? "Plano"}</td>
                        <td className="px-3 py-3 sm:px-4">{receivable.installment_number}/{contract?.duration_cycles_snapshot ?? receivable.installment_number}</td>
                        <td className="px-3 py-3 sm:px-4">{formatCurrency(receivable.amount_cents)}</td>
                        <td className="px-3 py-3 sm:px-4"><span className={cn("rounded px-2 py-1 text-[12px] font-semibold", receivableTone(status))}>{status}</span></td>
                        <td className="px-3 py-3 sm:px-4">{formatPaidDate(receivable.paid_at)}</td>
                        <td className="px-3 py-3 sm:px-4">{receivable.payment_method ? methodLabels[receivable.payment_method as PaymentMethod] ?? "Outro" : "Sem registro"}</td>
                        <td className="px-3 py-3 sm:px-4">
                          <div className="flex justify-end">
                            {receivable.status === "paid" ? (
                              <ActionButton disabled={pending} label="Desfazer pagamento" onClick={() => runAction(() => revertReceivablePayment(receivable.id))}>
                                <RefreshCcw className="size-4" />
                                Desfazer
                              </ActionButton>
                            ) : (
                              <ActionButton disabled={pending || receivable.status === "cancelled"} label="Marcar como pago" tone="primary" onClick={() => openPayment(receivable.id)}>
                                <CheckCircle2 className="size-4" />
                                Pago
                              </ActionButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="min-w-0 rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-4 sm:p-5">
            <h2 className="text-[18px] font-bold">Resumo financeiro do cliente</h2>
            <div className="mt-5 space-y-4 text-[14px]">
              <p className="flex items-center justify-between gap-3"><span className="min-w-0 text-[#a7b3bf]">Receita anual</span><strong className="shrink-0 text-right">{formatCurrency(paidYearCents)}</strong></p>
              <p className="flex items-center justify-between gap-3"><span className="min-w-0 text-[#a7b3bf]">Pagamentos em dia</span><strong className="shrink-0 text-right text-[#62d98b]">{receivables.filter((item) => item.status === "paid").length}</strong></p>
              <p className="flex items-center justify-between gap-3"><span className="min-w-0 text-[#a7b3bf]">Pagamentos atrasados</span><strong className="shrink-0 text-right text-[#ff6f7d]">{receivables.filter((item) => receivableStatus(item.status, item.due_date) === "Atrasado").length}</strong></p>
              <p className="flex items-center justify-between gap-3"><span className="min-w-0 text-[#a7b3bf]">Ticket médio</span><strong className="shrink-0 text-right">{contracts.length > 0 ? formatCurrency(Math.round(contracts.reduce((sum, item) => sum + item.price_cents_snapshot, 0) / contracts.length)) : formatCurrency(0)}</strong></p>
            </div>
          </aside>
        </section>
      </div>

      {selectedReceivable ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-3 backdrop-blur-sm sm:px-4">
          <section className="max-h-[calc(100dvh-32px)] w-full max-w-[460px] overflow-y-auto rounded-[10px] border border-[#2d4354] bg-[#0b1720] p-4 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold">Registrar pagamento</h2>
                <p className="mt-1 text-[13px] text-[#8b92a3]">
                  {contractFor(selectedReceivable)?.plan_name_snapshot ?? "Plano"} · parcela {selectedReceivable.installment_number}
                </p>
              </div>
              <button className="flex size-9 items-center justify-center rounded-[8px] text-[#a7b3bf] hover:bg-white/5 hover:text-white" type="button" onClick={() => setPaymentReceivableId("")}>
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 rounded-[8px] border border-[#263846] bg-[#0d1823] p-4">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <p><span className="block text-[#8b92a3]">Vencimento</span><strong>{formatDate(selectedReceivable.due_date)}</strong></p>
                <p><span className="block text-[#8b92a3]">Valor</span><strong>{formatCurrency(selectedReceivable.amount_cents)}</strong></p>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Data do pagamento">
                <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none focus:border-[#3b97e3]" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
              </Field>
              <Field label="Forma de recebimento">
                <select className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none focus:border-[#3b97e3]" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                  {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Referência opcional">
                <input className="h-11 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none placeholder:text-[#6f7c89] focus:border-[#3b97e3]" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Comprovante, recibo ou observação curta" />
              </Field>
              <Field label="Observações">
                <textarea className="min-h-[86px] rounded-[8px] border border-[#303746] bg-[#081520] px-3 py-2 text-[13px] text-white outline-none placeholder:text-[#6f7c89] focus:border-[#3b97e3]" value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} placeholder="Detalhes do recebimento" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="h-10 rounded-[8px] border border-[#334656] bg-[#0d1823] text-[13px] font-semibold text-[#d8e5ee]" type="button" onClick={() => setPaymentReceivableId("")}>Cancelar</button>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#287eed] text-[13px] font-semibold text-white disabled:opacity-50" disabled={pending} type="button" onClick={submitPayment}>
                  <CheckCircle2 className="size-4" />
                  Marcar como pago
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
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

function ActionButton({ children, disabled, label, onClick, tone = "ghost" }: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  tone?: "ghost" | "primary";
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] px-2.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" && "bg-[#287eed] text-white hover:bg-[#3c90ff]",
        tone === "ghost" && "border border-[#334656] bg-[#0d1823] text-[#d8e5ee] hover:border-[#3b97e3]",
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SmallSummary({ label, subtext, tone = "blue", value }: { label: string; subtext: string; tone?: "blue" | "green" | "red"; value: string }) {
  const tones = {
    blue: "text-[#8fcfff]",
    green: "text-[#62d98b]",
    red: "text-[#ff6f7d]",
  };

  return (
    <section className="min-w-0 rounded-[8px] border border-[#263846] bg-[#0d1823] p-3">
      <p className="text-[12px] text-[#8b92a3]">{label}</p>
      <p className={cn("mt-1 break-words text-[17px] font-bold sm:text-[18px]", tones[tone])}>{value}</p>
      <p className="mt-1 text-[12px] text-[#a7b3bf]">{subtext}</p>
    </section>
  );
}

function MetricCard({ Icon, label, subtext, tone, value }: { Icon: typeof Folder; label: string; subtext: string; tone: "amber" | "blue" | "green" | "red"; value: string }) {
  const tones = {
    amber: "bg-[#302813] text-[#f2c84b]",
    blue: "bg-[#082a43] text-[#55b4ff]",
    green: "bg-[#0e2c1e] text-[#62d98b]",
    red: "bg-[#37171b] text-[#ff6f7d]",
  };
  return (
    <section className="min-w-0 rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[10px] sm:size-11", tones[tone])}>
          <Icon className="size-4 sm:size-5" />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[11px] leading-4 text-[#a7b3bf] sm:text-[13px]">{label}</p>
          <p className="mt-1 break-words text-[16px] font-bold leading-5 sm:text-[19px] sm:leading-6">{value}</p>
          <p className="mt-1 text-[11px] text-[#8b92a3] sm:text-[12px]">{subtext}</p>
        </div>
      </div>
    </section>
  );
}
