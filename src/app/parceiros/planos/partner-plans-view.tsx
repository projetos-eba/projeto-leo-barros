"use client";

import { useMemo, useState, useTransition } from "react";
import { BadgeDollarSign, CheckCircle2, CircleDollarSign, PackagePlus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { assignPartnerProduct, createPartnerProduct, markInstallmentPaid } from "./actions";

type Product = { id: string; name: string; description: string | null; category: string; billing_cycle: string; price_cents: number; duration_months: number | null; status: string; includes_diet: boolean; includes_training: boolean };
type ClientPlan = { id: string; patient_id: string; product_name: string; agreed_price_cents: number; status: string; start_date: string; next_due_date: string | null };
type Installment = { id: string; client_plan_id: string; due_date: string; amount_cents: number; status: string; paid_at: string | null; payment_method: string | null };
type Client = { id: string; name: string };

type Props = { products: Product[]; plans: ClientPlan[]; installments: Installment[]; clients: Client[] };

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function PartnerPlansView({ products, plans, installments, clients }: Props) {
  const [tab, setTab] = useState<"catalog" | "contracts" | "receivables">("catalog");
  const [pending, startTransition] = useTransition();
  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, client.name])), [clients]);
  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const pendingTotal = installments.filter((item) => item.status === "pending" || item.status === "overdue").reduce((sum, item) => sum + item.amount_cents, 0);
  const paidTotal = installments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount_cents, 0);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.error(result.error ?? "Não foi possível concluir a ação.");
      else toast.success(success);
    });
  }

  return (
    <main className="min-h-screen bg-[#0b1720] px-5 py-7 text-[#eef5fa] lg:px-8">
      <div className="mx-auto max-w-[1260px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#39a9ff]">Gestão manual</p>
            <h1 className="mt-1 text-3xl font-bold">Planos & Financeiro</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#8fa1ae]">Crie produtos, vincule-os aos clientes e acompanhe contas a receber. Este módulo não possui checkout, gateway, cobrança automática ou processamento de pagamentos.</p>
          </div>
          <div className="rounded-xl border border-[#735c1f] bg-[#2a2414] px-4 py-3 text-xs text-[#e8c86e]">Os pagamentos são apenas registrados manualmente pelo profissional.</div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <Metric icon={PackagePlus} label="Planos cadastrados" value={String(products.filter((item) => item.status === "active").length)} />
          <Metric icon={CircleDollarSign} label="A receber" value={money.format(pendingTotal / 100)} />
          <Metric icon={CheckCircle2} label="Recebido registrado" value={money.format(paidTotal / 100)} />
        </section>

        <nav className="flex gap-2 border-b border-[#1b303d] pb-3">
          {([['catalog','Meus planos'],['contracts','Planos de clientes'],['receivables','Contas a receber']] as const).map(([value, label]) => (
            <button key={value} onClick={() => setTab(value)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === value ? 'bg-[#0d71b9] text-white' : 'bg-[#0d202c] text-[#8fa1ae]'}`}>{label}</button>
          ))}
        </nav>

        {tab === "catalog" ? (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            <form className="space-y-4 rounded-2xl border border-[#1b303d] bg-[#0d1d28] p-5" onSubmit={(event) => {
              event.preventDefault(); const data = new FormData(event.currentTarget);
              run(() => createPartnerProduct({ name: data.get('name'), description: data.get('description'), category: data.get('category'), billingCycle: data.get('billingCycle'), price: data.get('price'), durationMonths: data.get('durationMonths') || undefined, includesDiet: data.get('includesDiet') === 'on', includesTraining: data.get('includesTraining') === 'on' }), "Plano criado.");
              event.currentTarget.reset();
            }}>
              <h2 className="text-lg font-bold">Criar plano/produto</h2>
              <Field label="Nome"><input name="name" required minLength={3} className="input" placeholder="Ex.: Acompanhamento trimestral" /></Field>
              <Field label="Descrição"><textarea name="description" className="input min-h-20" placeholder="Escopo e observações" /></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Categoria"><select name="category" className="input"><option value="integrado">Integrado</option><option value="nutricao">Nutrição</option><option value="treino">Treino</option><option value="consulta">Consulta</option></select></Field><Field label="Periodicidade"><select name="billingCycle" className="input"><option value="unico">Pagamento único</option><option value="mensal">Mensal</option><option value="trimestral">Trimestral</option><option value="semestral">Semestral</option><option value="anual">Anual</option></select></Field></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Valor (R$)"><input name="price" type="number" min="0" step="0.01" required className="input" /></Field><Field label="Duração em meses"><input name="durationMonths" type="number" min="1" className="input" /></Field></div>
              <div className="flex gap-4 text-sm text-[#b7c5cf]"><label><input type="checkbox" name="includesDiet" className="mr-2" />Inclui dieta</label><label><input type="checkbox" name="includesTraining" className="mr-2" />Inclui treino</label></div>
              <button disabled={pending} className="w-full rounded-lg bg-[#1689dd] px-4 py-3 font-bold text-white disabled:opacity-50">Salvar plano</button>
            </form>
            <section className="grid content-start gap-3 md:grid-cols-2">
              {products.length === 0 ? <Empty text="Nenhum plano cadastrado." /> : products.map((product) => <article key={product.id} className="rounded-2xl border border-[#1b303d] bg-[#0d1d28] p-5"><div className="flex justify-between gap-4"><div><p className="text-xs uppercase text-[#39a9ff]">{product.category}</p><h3 className="mt-1 text-lg font-bold">{product.name}</h3></div><span className="text-lg font-bold">{money.format(product.price_cents / 100)}</span></div><p className="mt-3 text-sm text-[#8fa1ae]">{product.description || "Sem descrição."}</p><div className="mt-4 flex gap-2 text-xs text-[#b7c5cf]"><span className="rounded bg-[#142b38] px-2 py-1">{product.billing_cycle}</span>{product.duration_months ? <span className="rounded bg-[#142b38] px-2 py-1">{product.duration_months} meses</span> : null}</div></article>)}
            </section>
          </div>
        ) : null}

        {tab === "contracts" ? (
          <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
            <form className="space-y-4 rounded-2xl border border-[#1b303d] bg-[#0d1d28] p-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); run(() => assignPartnerProduct({ patientId: data.get('patientId'), productId: data.get('productId'), startDate: data.get('startDate'), firstDueDate: data.get('firstDueDate'), notes: data.get('notes') }), "Plano vinculado ao cliente."); event.currentTarget.reset(); }}>
              <div className="flex items-center gap-2"><UserPlus className="size-5 text-[#39a9ff]"/><h2 className="text-lg font-bold">Vincular plano</h2></div>
              <Field label="Cliente"><select name="patientId" required className="input"><option value="">Selecione</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></Field>
              <Field label="Plano"><select name="productId" required className="input"><option value="">Selecione</option>{products.filter((item) => item.status === 'active').map((product) => <option key={product.id} value={product.id}>{product.name} — {money.format(product.price_cents/100)}</option>)}</select></Field>
              <div className="grid grid-cols-2 gap-3"><Field label="Início"><input name="startDate" type="date" required className="input" /></Field><Field label="1º vencimento"><input name="firstDueDate" type="date" required className="input" /></Field></div>
              <Field label="Observações"><textarea name="notes" className="input min-h-20" /></Field>
              <button disabled={pending || products.length === 0 || clients.length === 0} className="w-full rounded-lg bg-[#1689dd] px-4 py-3 font-bold text-white disabled:opacity-50">Vincular e gerar parcelas</button>
            </form>
            <section className="overflow-hidden rounded-2xl border border-[#1b303d] bg-[#0d1d28]"><div className="border-b border-[#1b303d] p-5"><h2 className="font-bold">Planos ativos de clientes</h2></div>{plans.length === 0 ? <Empty text="Nenhum plano vinculado." /> : plans.map((plan) => <div key={plan.id} className="grid gap-2 border-b border-[#1b303d] p-4 md:grid-cols-[1.2fr_1fr_140px_120px]"><div><p className="font-semibold">{clientMap.get(plan.patient_id) ?? "Cliente"}</p><p className="text-xs text-[#8fa1ae]">{plan.product_name}</p></div><p className="text-sm">{money.format(plan.agreed_price_cents/100)}</p><p className="text-sm text-[#8fa1ae]">Próx.: {plan.next_due_date ?? "—"}</p><span className="text-sm text-[#53c58a]">{plan.status}</span></div>)}</section>
          </div>
        ) : null}

        {tab === "receivables" ? <section className="overflow-hidden rounded-2xl border border-[#1b303d] bg-[#0d1d28]"><div className="border-b border-[#1b303d] p-5"><h2 className="font-bold">Contas a receber</h2><p className="mt-1 text-xs text-[#8fa1ae]">Confirme somente após receber o valor fora da plataforma.</p></div>{installments.length === 0 ? <Empty text="Nenhuma parcela registrada." /> : installments.map((item) => { const plan = planMap.get(item.client_plan_id); return <div key={item.id} className="grid items-center gap-3 border-b border-[#1b303d] p-4 md:grid-cols-[1.2fr_140px_140px_120px_160px]"><div><p className="font-semibold">{plan ? clientMap.get(plan.patient_id) : "Cliente"}</p><p className="text-xs text-[#8fa1ae]">{plan?.product_name}</p></div><p className="text-sm">{item.due_date}</p><p className="font-semibold">{money.format(item.amount_cents/100)}</p><span className={item.status === 'paid' ? 'text-[#53c58a]' : 'text-[#e8c86e]'}>{item.status}</span>{item.status === 'paid' ? <span className="text-xs text-[#8fa1ae]">{item.payment_method}</span> : <button disabled={pending} onClick={() => run(() => markInstallmentPaid({ installmentId: item.id, paymentMethod: 'manual' }), "Pagamento registrado.")} className="rounded-lg border border-[#1689dd] px-3 py-2 text-sm font-semibold text-[#62baff]">Marcar como pago</button>}</div>})}</section> : null}
      </div>
      <style jsx global>{`.input{width:100%;border:1px solid #213847;background:#091923;border-radius:8px;padding:10px 12px;color:#eef5fa;outline:none}.input:focus{border-color:#1689dd}`}</style>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BadgeDollarSign; label: string; value: string }) { return <div className="rounded-2xl border border-[#1b303d] bg-[#0d1d28] p-5"><div className="flex items-center gap-3"><div className="rounded-lg bg-[#0d3450] p-2"><Icon className="size-5 text-[#39a9ff]" /></div><div><p className="text-xs text-[#8fa1ae]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div></div></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-xs font-semibold text-[#aebcc6]"><span>{label}</span>{children}</label> }
function Empty({ text }: { text: string }) { return <div className="p-8 text-center text-sm text-[#718491]">{text}</div> }
