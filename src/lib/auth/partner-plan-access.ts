import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

export async function partnerHasActivePlan({
  profileId,
  supabase,
}: {
  profileId: string;
  supabase: SupabaseClient<Database>;
}) {
  const { data: partner, error: partnerError } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (partnerError || !partner) {
    return false;
  }

  const now = new Date().toISOString();
  const { data: subscription, error: subscriptionError } = await supabase
    .from("partner_subscriptions")
    .select("id")
    .eq("partner_id", partner.id)
    .in("status", [...ACTIVE_SUBSCRIPTION_STATUSES])
    .lte("current_period_start", now)
    .gt("current_period_end", now)
    .maybeSingle();

  return !subscriptionError && Boolean(subscription);
}
