"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(600).optional(),
  category: z.string().trim().min(2).max(40),
  billingCycle: z.enum(["unico", "mensal", "bimestral", "trimestral", "semestral", "anual"]),
  price: z.coerce.number().min(0),
  durationMonths: z.coerce.number().int().positive().optional(),
  includesDiet: z.boolean().default(false),
  includesTraining: z.boolean().default(false),
});

const assignmentSchema = z.object({
  patientId: z.string().uuid(),
  productId: z.string().uuid(),
  startDate: z.string().date(),
  firstDueDate: z.string().date(),
  notes: z.string().trim().max(600).optional(),
});

const paymentSchema = z.object({
  installmentId: z.string().uuid(),
  paymentMethod: z.string().trim().min(2).max(40),
});

async function getContext() {
  const supabase = (await createClient()) as any;
  const { profile } = await getCurrentProfile();
  if (!profile) throw new Error("Sessão do profissional indisponível.");

  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .single();

  if (!partner) throw new Error("Cadastro do profissional indisponível.");
  return { partnerId: partner.id as string, supabase };
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + amount);
  return next;
}

function cycleMonths(cycle: string) {
  return { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 }[cycle] ?? 0;
}

export async function createPartnerProduct(input: unknown) {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revise os dados do plano." };

  const { partnerId, supabase } = await getContext();
  const { error } = await supabase.from("partner_products").insert({
    partner_id: partnerId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    category: parsed.data.category,
    billing_cycle: parsed.data.billingCycle,
    price_cents: toCents(parsed.data.price),
    duration_months: parsed.data.durationMonths || null,
    includes_diet: parsed.data.includesDiet,
    includes_training: parsed.data.includesTraining,
  });

  if (error) return { ok: false, error: "Não foi possível criar o plano." };
  revalidatePath("/parceiros/planos");
  return { ok: true };
}

export async function assignPartnerProduct(input: unknown) {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revise o cliente e as datas." };

  const { partnerId, supabase } = await getContext();
  const { data: product } = await supabase
    .from("partner_products")
    .select("id, name, price_cents, billing_cycle, duration_months")
    .eq("id", parsed.data.productId)
    .eq("partner_id", partnerId)
    .single();

  if (!product) return { ok: false, error: "Plano não encontrado." };

  const start = new Date(`${parsed.data.startDate}T00:00:00Z`);
  const end = product.duration_months ? addMonths(start, product.duration_months) : null;
  const { data: clientPlan, error } = await supabase
    .from("partner_client_plans")
    .insert({
      partner_id: partnerId,
      patient_id: parsed.data.patientId,
      product_id: product.id,
      product_name: product.name,
      agreed_price_cents: product.price_cents,
      billing_cycle: product.billing_cycle,
      start_date: parsed.data.startDate,
      end_date: end?.toISOString().slice(0, 10) ?? null,
      next_due_date: parsed.data.firstDueDate,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !clientPlan) return { ok: false, error: "Não foi possível vincular o plano." };

  const interval = cycleMonths(product.billing_cycle);
  const count = product.billing_cycle === "unico" ? 1 : Math.max(1, Math.ceil((product.duration_months || interval) / interval));
  const firstDue = new Date(`${parsed.data.firstDueDate}T00:00:00Z`);
  const installments = Array.from({ length: count }, (_, index) => ({
    partner_id: partnerId,
    client_plan_id: clientPlan.id,
    due_date: addMonths(firstDue, interval * index).toISOString().slice(0, 10),
    amount_cents: product.price_cents,
    status: "pending",
  }));

  const { error: installmentError } = await supabase.from("partner_plan_installments").insert(installments);
  if (installmentError) return { ok: false, error: "Plano criado, mas as parcelas não foram registradas." };

  revalidatePath("/parceiros/planos");
  return { ok: true };
}

export async function markInstallmentPaid(input: unknown) {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pagamento inválido." };

  const { partnerId, supabase } = await getContext();
  const { error } = await supabase
    .from("partner_plan_installments")
    .update({ status: "paid", paid_at: new Date().toISOString(), payment_method: parsed.data.paymentMethod })
    .eq("id", parsed.data.installmentId)
    .eq("partner_id", partnerId);

  if (error) return { ok: false, error: "Não foi possível confirmar o pagamento." };
  revalidatePath("/parceiros/planos");
  return { ok: true };
}