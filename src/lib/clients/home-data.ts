import { createClient } from "@/lib/supabase/server";

import {
  buildClientHome,
  type ClientHomeData,
  type ClientHomeRawData,
} from "./home-metrics";

export type ClientShellIdentity = {
  avatarUrl: string | null;
  initial: string;
  name: string;
};

type ProfileRow = {
  display_name: string;
  id: string;
};

type PatientRow = {
  avatar_url: string | null;
  id: string;
  objective: string | null;
};

function initial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "C";
}

async function fetchCurrentClientIdentity() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("user_id", userId)
    .eq("role", "cliente")
    .eq("status", "active")
    .maybeSingle<ProfileRow>();

  if (profileError || !profile) return null;

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, objective, avatar_url")
    .eq("profile_id", profile.id)
    .maybeSingle<PatientRow>();

  if (patientError || !patient) return null;

  return { patient, profile, supabase };
}

export async function fetchClientShellIdentity(): Promise<ClientShellIdentity | null> {
  const current = await fetchCurrentClientIdentity();
  if (!current) return null;

  return {
    avatarUrl: current.patient.avatar_url,
    initial: initial(current.profile.display_name),
    name: current.profile.display_name,
  };
}

export async function fetchClientHome(): Promise<ClientHomeData | null> {
  const current = await fetchCurrentClientIdentity();
  if (!current) return null;

  const { patient, profile, supabase } = current;

  const [
    { data: serviceRows, error: serviceError },
    { data: subscriptionRows, error: subscriptionError },
    { data: appointmentRows, error: appointmentError },
    { data: measurementRows, error: measurementError },
  ] = await Promise.all([
    supabase
      .from("partner_clients")
      .select("service_scope, status")
      .eq("patient_id", patient.id)
      .eq("status", "active"),
    supabase
      .from("partner_client_plan_subscriptions")
      .select("current_period_end, status")
      .eq("patient_id", patient.id)
      .in("status", ["active", "past_due", "pending"])
      .order("current_period_end", { ascending: false })
      .limit(1),
    supabase
      .from("partner_client_appointments")
      .select("starts_at, status, title")
      .eq("patient_id", patient.id)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1),
    supabase
      .from("partner_client_body_measurements")
      .select("body_fat_percentage, measured_at, weight_kg")
      .eq("patient_id", patient.id)
      .order("measured_at", { ascending: false })
      .limit(1),
  ]);

  if (serviceError) throw new Error(`Falha ao carregar módulos do Cliente: ${serviceError.message}`);
  if (subscriptionError) throw new Error(`Falha ao carregar assinatura do Cliente: ${subscriptionError.message}`);
  if (appointmentError) throw new Error(`Falha ao carregar agenda do Cliente: ${appointmentError.message}`);
  if (measurementError) throw new Error(`Falha ao carregar evolução do Cliente: ${measurementError.message}`);

  const raw: ClientHomeRawData = {
    appointments: (appointmentRows ?? []).map((item) => ({
      startsAt: item.starts_at,
      status: item.status,
      title: item.title,
    })),
    client: {
      avatarUrl: patient.avatar_url,
      displayName: profile.display_name,
      objective: patient.objective,
      patientId: patient.id,
    },
    measurements: (measurementRows ?? []).map((item) => ({
      bodyFatPercentage: item.body_fat_percentage,
      measuredAt: item.measured_at,
      weightKg: item.weight_kg,
    })),
    serviceScopes: (serviceRows ?? []).map((item) => item.service_scope),
    subscription: subscriptionRows?.[0]
      ? {
          currentPeriodEnd: subscriptionRows[0].current_period_end,
          status: subscriptionRows[0].status,
        }
      : null,
  };

  return buildClientHome(raw);
}
