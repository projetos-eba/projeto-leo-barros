import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import { PartnerPlansView } from "./partner-plans-view";

export const dynamic = "force-dynamic";

export default async function PartnerPlansPage() {
  const supabase = (await createClient()) as any;
  const { profile } = await getCurrentProfile();
  if (!profile) throw new Error("Sessão do profissional indisponível.");

  const { data: partner } = await supabase.from("partners").select("id").eq("profile_id", profile.id).single();
  if (!partner) throw new Error("Cadastro do profissional indisponível.");

  const [{ data: products }, { data: plans }, { data: installments }, { data: clients }] = await Promise.all([
    supabase.from("partner_products").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }),
    supabase.from("partner_client_plans").select("*").eq("partner_id", partner.id).order("created_at", { ascending: false }),
    supabase.from("partner_plan_installments").select("*").eq("partner_id", partner.id).order("due_date", { ascending: true }),
    supabase.rpc("partner_clients_list"),
  ]);

  const activeClients = (clients ?? [])
    .filter((client: any) => client.relationship_status === "active")
    .map((client: any) => ({ id: client.patient_id, name: client.display_name }));

  return (
    <PartnerPlansView
      clients={activeClients}
      installments={installments ?? []}
      plans={plans ?? []}
      products={products ?? []}
    />
  );
}