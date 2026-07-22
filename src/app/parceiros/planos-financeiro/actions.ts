"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

export type PartnerFinanceActionResult = {
  error?: string;
  message?: string;
  ok: boolean;
};

const uuidSchema = z.string().uuid();
const billingIntervalSchema = z.enum(["one_time", "weekly", "monthly", "quarterly", "custom"]);
const paymentMethodSchema = z.enum(["pix_external", "cash", "bank_transfer", "card_external", "boleto_external", "other"]);

const servicePlanSchema = z.object({
  billingInterval: billingIntervalSchema,
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).nullable(),
  durationCycles: z.number().int().min(1).max(60),
  includesDiet: z.boolean(),
  includesTraining: z.boolean(),
  name: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(800).nullable(),
  priceCents: z.number().int().min(1),
  status: z.enum(["active", "archived"]),
});

const assignPlanSchema = z.object({
  firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(800).nullable(),
  patientId: uuidSchema,
  priceCents: z.number().int().min(1),
  renewalReminder: z.boolean(),
  servicePlanId: uuidSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalInstallments: z.number().int().min(1).max(60),
});

const paymentSchema = z.object({
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: paymentMethodSchema,
  paymentNotes: z.string().trim().max(500).nullable(),
  paymentReference: z.string().trim().max(120).nullable(),
  receivableId: uuidSchema,
});

const renewContractSchema = z.object({
  contractId: uuidSchema,
  firstDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalInstallments: z.number().int().min(1).max(60),
});

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partnerId: null, supabase };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partnerId: null, supabase };
  }

  return { error: null, partnerId: partner.id, supabase };
}

function normalizeNullable(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function friendlyError(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (/schema cache|Could not find the table|does not exist/i.test(message)) {
    return "Não foi possível salvar agora. Atualize a tela e tente novamente.";
  }
  return "Não foi possível concluir a ação.";
}

function addCycles(firstDueDate: string, interval: string, cycles: number) {
  const date = new Date(`${firstDueDate}T00:00:00`);
  if (interval === "weekly") date.setDate(date.getDate() + cycles * 7);
  else if (interval === "quarterly") date.setMonth(date.getMonth() + cycles * 3);
  else if (interval === "one_time") date.setDate(date.getDate() + cycles);
  else date.setMonth(date.getMonth() + cycles);
  return date.toISOString().slice(0, 10);
}

function previousDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function revalidateFinance(patientId?: string) {
  revalidatePath("/parceiros/dashboard");
  revalidatePath("/parceiros/planos-financeiro");
  if (patientId) revalidatePath(`/parceiros/clientes/${patientId}`);
}

async function recordEvent(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  eventType: string,
  detail: string,
  values: {
    contractId?: string | null;
    patientId?: string | null;
    receivableId?: string | null;
    servicePlanId?: string | null;
  } = {},
) {
  if (!context.partnerId) return;
  const db = context.supabase as unknown as { from(table: string): { insert(values: Record<string, unknown>): Promise<{ error: unknown }> } };
  await db.from("partner_financial_events").insert({
    contract_id: values.contractId ?? null,
    detail,
    event_type: eventType,
    partner_id: context.partnerId,
    patient_id: values.patientId ?? null,
    receivable_id: values.receivableId ?? null,
    service_plan_id: values.servicePlanId ?? null,
  });
}

export async function createPartnerServicePlan(input: z.input<typeof servicePlanSchema>): Promise<PartnerFinanceActionResult> {
  const parsed = servicePlanSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do plano.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = context.supabase as unknown as {
    from(table: string): {
      insert(values: Record<string, unknown>): { select(columns: string): { single(): Promise<{ data: { id: string }; error: unknown }> } };
    };
  };

  try {
    const { data, error } = await db
      .from("partner_service_plans")
      .insert({
        billing_interval: parsed.data.billingInterval,
        category: parsed.data.category,
        description: normalizeNullable(parsed.data.description),
        duration_cycles: parsed.data.durationCycles,
        includes_diet: parsed.data.includesDiet,
        includes_training: parsed.data.includesTraining,
        interval_count: 1,
        name: parsed.data.name,
        notes: normalizeNullable(parsed.data.notes),
        partner_id: context.partnerId,
        price_cents: parsed.data.priceCents,
        status: parsed.data.status,
      })
      .select("id")
      .single();

    if (error) throw error;
    await recordEvent(context, "plan_created", "Plano criado.", { servicePlanId: data.id });
    revalidateFinance();
    return { message: "Plano salvo.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function archivePartnerServicePlan(servicePlanId: string): Promise<PartnerFinanceActionResult> {
  const parsed = uuidSchema.safeParse(servicePlanId);
  if (!parsed.success) return { error: "Plano inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = context.supabase as unknown as {
    from(table: string): {
      update(values: Record<string, unknown>): { eq(column: string, value: string): { eq(column: string, value: string): Promise<{ error: unknown }> } };
    };
  };

  try {
    const { error } = await db
      .from("partner_service_plans")
      .update({ status: "archived" })
      .eq("id", parsed.data)
      .eq("partner_id", context.partnerId);
    if (error) throw error;
    await recordEvent(context, "plan_archived", "Plano arquivado.", { servicePlanId: parsed.data });
    revalidateFinance();
    return { message: "Plano arquivado.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function duplicatePartnerServicePlan(servicePlanId: string): Promise<PartnerFinanceActionResult> {
  const parsed = uuidSchema.safeParse(servicePlanId);
  if (!parsed.success) return { error: "Plano inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = context.supabase as unknown as {
    from(table: string): {
      insert(values: Record<string, unknown>): { select(columns: string): { single(): Promise<{ data: { id: string }; error: unknown }> } };
      select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { single(): Promise<{ data: Record<string, unknown> & { name: string }; error: unknown }> } } };
    };
  };

  try {
    const { data: plan, error: readError } = await db
      .from("partner_service_plans")
      .select("name, description, category, price_cents, billing_interval, interval_count, duration_cycles, includes_diet, includes_training, notes")
      .eq("id", parsed.data)
      .eq("partner_id", context.partnerId)
      .single();
    if (readError) throw readError;

    const { data, error } = await db
      .from("partner_service_plans")
      .insert({
        ...plan,
        name: `${plan.name} (cópia)`,
        partner_id: context.partnerId,
        status: "active",
      })
      .select("id")
      .single();
    if (error) throw error;
    await recordEvent(context, "plan_duplicated", "Plano duplicado.", { servicePlanId: data.id });
    revalidateFinance();
    return { message: "Plano duplicado.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function assignPlanToClient(input: z.input<typeof assignPlanSchema>): Promise<PartnerFinanceActionResult> {
  const parsed = assignPlanSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do vínculo.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  type LooseInsertBuilder = PromiseLike<{ error: unknown }> & {
    select(columns: string): { single(): Promise<{ data: { id: string }; error: unknown }> };
  };
  const db = context.supabase as unknown as {
    from(table: string): {
      insert(values: Record<string, unknown> | Array<Record<string, unknown>>): LooseInsertBuilder;
      select(columns: string): {
        eq(column: string, value: string): {
          eq(column: string, value: string): {
            eq(column: string, value: string): { single(): Promise<{ data: {
              billing_interval: string;
              category: string;
              duration_cycles: number;
              id: string;
              includes_diet: boolean;
              includes_training: boolean;
              name: string;
              price_cents: number;
            }; error: unknown }> };
          };
        };
      };
    };
  };

  try {
    const { data: plan, error: planError } = await db
      .from("partner_service_plans")
      .select("id, name, category, price_cents, billing_interval, duration_cycles, includes_diet, includes_training")
      .eq("id", parsed.data.servicePlanId)
      .eq("partner_id", context.partnerId)
      .eq("status", "active")
      .single();
    if (planError) throw planError;

    const { data: contract, error: contractError } = await db
      .from("partner_client_plan_contracts")
      .insert({
        billing_interval_snapshot: plan.billing_interval,
        category_snapshot: plan.category,
        duration_cycles_snapshot: parsed.data.totalInstallments,
        first_due_date: parsed.data.firstDueDate,
        includes_diet_snapshot: plan.includes_diet,
        includes_training_snapshot: plan.includes_training,
        notes: normalizeNullable(parsed.data.notes),
        partner_id: context.partnerId,
        patient_id: parsed.data.patientId,
        plan_name_snapshot: plan.name,
        price_cents_snapshot: parsed.data.priceCents,
        renewal_reminder: parsed.data.renewalReminder,
        service_plan_id: plan.id,
        start_date: parsed.data.startDate,
        status: "active",
      })
      .select("id")
      .single();
    if (contractError) throw contractError;

    const receivables = Array.from({ length: parsed.data.totalInstallments }, (_, index) => ({
      amount_cents: parsed.data.priceCents,
      contract_id: contract.id,
      due_date: addCycles(parsed.data.firstDueDate, plan.billing_interval, index),
      installment_number: index + 1,
      partner_id: context.partnerId,
      patient_id: parsed.data.patientId,
      status: "pending",
    }));

    const { error: receivablesError } = await db.from("partner_client_receivables").insert(receivables) as { error: unknown };
    if (receivablesError) throw receivablesError;

    await recordEvent(context, "contract_created", "Plano vinculado ao cliente.", {
      contractId: contract.id,
      patientId: parsed.data.patientId,
      servicePlanId: plan.id,
    });
    revalidateFinance(parsed.data.patientId);
    return { message: "Plano vinculado ao cliente.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function renewClientPlanContract(input: z.input<typeof renewContractSchema>): Promise<PartnerFinanceActionResult> {
  const parsed = renewContractSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados da renovação.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  type LooseInsertBuilder = PromiseLike<{ error: unknown }> & {
    select(columns: string): { single(): Promise<{ data: { id: string }; error: unknown }> };
  };
  const db = context.supabase as unknown as {
    from(table: string): {
      insert(values: Record<string, unknown> | Array<Record<string, unknown>>): LooseInsertBuilder;
      select(columns: string): {
        eq(column: string, value: string): {
          eq(column: string, value: string): { single(): Promise<{ data: {
            billing_interval_snapshot: string;
            category_snapshot: string;
            duration_cycles_snapshot: number;
            id: string;
            includes_diet_snapshot: boolean;
            includes_training_snapshot: boolean;
            notes: string | null;
            patient_id: string;
            plan_name_snapshot: string;
            price_cents_snapshot: number;
            service_plan_id: string | null;
          }; error: unknown }> };
        };
      };
      update(values: Record<string, unknown>): {
        eq(column: string, value: string): { eq(column: string, value: string): Promise<{ error: unknown }> };
      };
    };
  };

  try {
    const { data: contract, error: readError } = await db
      .from("partner_client_plan_contracts")
      .select("id, patient_id, service_plan_id, plan_name_snapshot, category_snapshot, price_cents_snapshot, billing_interval_snapshot, duration_cycles_snapshot, includes_diet_snapshot, includes_training_snapshot, notes")
      .eq("id", parsed.data.contractId)
      .eq("partner_id", context.partnerId)
      .single();
    if (readError) throw readError;

    const { error: closeError } = await db
      .from("partner_client_plan_contracts")
      .update({
        end_date: previousDate(parsed.data.startDate),
        status: "completed",
      })
      .eq("id", contract.id)
      .eq("partner_id", context.partnerId);
    if (closeError) throw closeError;

    const { data: renewedContract, error: contractError } = await db
      .from("partner_client_plan_contracts")
      .insert({
        billing_interval_snapshot: contract.billing_interval_snapshot,
        category_snapshot: contract.category_snapshot,
        duration_cycles_snapshot: parsed.data.totalInstallments,
        first_due_date: parsed.data.firstDueDate,
        includes_diet_snapshot: contract.includes_diet_snapshot,
        includes_training_snapshot: contract.includes_training_snapshot,
        notes: contract.notes,
        partner_id: context.partnerId,
        patient_id: contract.patient_id,
        plan_name_snapshot: contract.plan_name_snapshot,
        price_cents_snapshot: contract.price_cents_snapshot,
        renewal_reminder: true,
        service_plan_id: contract.service_plan_id,
        start_date: parsed.data.startDate,
        status: "active",
      })
      .select("id")
      .single();
    if (contractError) throw contractError;

    const receivables = Array.from({ length: parsed.data.totalInstallments }, (_, index) => ({
      amount_cents: contract.price_cents_snapshot,
      contract_id: renewedContract.id,
      due_date: addCycles(parsed.data.firstDueDate, contract.billing_interval_snapshot, index),
      installment_number: index + 1,
      partner_id: context.partnerId,
      patient_id: contract.patient_id,
      status: "pending",
    }));
    const { error: receivablesError } = await db.from("partner_client_receivables").insert(receivables) as { error: unknown };
    if (receivablesError) throw receivablesError;

    await recordEvent(context, "contract_renewed", "Contrato financeiro renovado.", {
      contractId: renewedContract.id,
      patientId: contract.patient_id,
      servicePlanId: contract.service_plan_id,
    });
    revalidateFinance(contract.patient_id);
    return { message: "Contrato renovado.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function recordReceivablePayment(input: z.input<typeof paymentSchema>): Promise<PartnerFinanceActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do pagamento.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = context.supabase as unknown as {
    from(table: string): {
      select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { single(): Promise<{ data: { id: string; patient_id: string }; error: unknown }> } } };
      update(values: Record<string, unknown>): { eq(column: string, value: string): { eq(column: string, value: string): Promise<{ error: unknown }> } };
    };
  };

  try {
    const { data: receivable, error: readError } = await db
      .from("partner_client_receivables")
      .select("id, patient_id")
      .eq("id", parsed.data.receivableId)
      .eq("partner_id", context.partnerId)
      .single();
    if (readError) throw readError;

    const { error } = await db
      .from("partner_client_receivables")
      .update({
        paid_at: `${parsed.data.paidAt}T12:00:00.000Z`,
        payment_method: parsed.data.paymentMethod,
        payment_notes: normalizeNullable(parsed.data.paymentNotes),
        payment_reference: normalizeNullable(parsed.data.paymentReference),
        status: "paid",
      })
      .eq("id", parsed.data.receivableId)
      .eq("partner_id", context.partnerId);
    if (error) throw error;
    await recordEvent(context, "payment_recorded", "Pagamento registrado.", {
      patientId: receivable.patient_id,
      receivableId: receivable.id,
    });
    revalidateFinance(receivable.patient_id);
    return { message: "Pagamento registrado.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}

export async function revertReceivablePayment(receivableId: string): Promise<PartnerFinanceActionResult> {
  const parsed = uuidSchema.safeParse(receivableId);
  if (!parsed.success) return { error: "Parcela inválida.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };
  const db = context.supabase as unknown as {
    from(table: string): {
      select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { single(): Promise<{ data: { id: string; patient_id: string }; error: unknown }> } } };
      update(values: Record<string, unknown>): { eq(column: string, value: string): { eq(column: string, value: string): Promise<{ error: unknown }> } };
    };
  };

  try {
    const { data: receivable, error: readError } = await db
      .from("partner_client_receivables")
      .select("id, patient_id")
      .eq("id", parsed.data)
      .eq("partner_id", context.partnerId)
      .single();
    if (readError) throw readError;

    const { error } = await db
      .from("partner_client_receivables")
      .update({
        paid_at: null,
        payment_method: null,
        payment_notes: null,
        payment_reference: null,
        status: "pending",
      })
      .eq("id", parsed.data)
      .eq("partner_id", context.partnerId);
    if (error) throw error;
    await recordEvent(context, "payment_reverted", "Registro de pagamento desfeito.", {
      patientId: receivable.patient_id,
      receivableId: receivable.id,
    });
    revalidateFinance(receivable.patient_id);
    return { message: "Pagamento desfeito.", ok: true };
  } catch (error) {
    return { error: friendlyError(error), ok: false };
  }
}
