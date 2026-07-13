import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerProtocolsData,
  type PartnerProtocolClient,
  type PartnerProtocolExerciseRecord,
  type PartnerProtocolFoodRecord,
  type PartnerProtocolsData,
} from "./protocols-metrics";

type QueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type SupabaseReadQuery = PromiseLike<QueryResult<unknown>> & {
  eq(column: string, value: string): SupabaseReadQuery;
  order(column: string, options?: { ascending?: boolean }): SupabaseReadQuery;
};

type SupabaseReadClient = {
  from(table: string): {
    select(columns: string): SupabaseReadQuery;
  };
  rpc(functionName: "partner_clients_list"): PromiseLike<QueryResult<unknown>>;
};

type PartnerRecord = {
  id: string;
  professional_name: string;
  professional_type: string;
  profile_id: string;
};

type PartnerClientListRow = {
  display_name: string;
  email: string;
  patient_id: string;
  relationship_status: string;
};

function asQuery<T>(query: SupabaseReadQuery | PromiseLike<QueryResult<unknown>>) {
  return query as PromiseLike<QueryResult<T>>;
}

async function expectData<T>(result: PromiseLike<QueryResult<T>>, label: string) {
  const { data, error } = await result;
  if (error) throw new Error(`Falha ao carregar ${label}: ${error.message}`);
  return data ?? [];
}

export async function fetchPartnerProtocolsData(): Promise<PartnerProtocolsData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar cadastros: sessão do parceiro indisponível.");
  }

  const partners = await expectData(
    asQuery<PartnerRecord>(
      supabase
        .from("partners")
        .select("id, profile_id, professional_name, professional_type")
        .eq("profile_id", profile.id),
    ),
    "cadastro do parceiro",
  );
  const partner = partners[0] ?? null;

  if (!partner) {
    return buildPartnerProtocolsData({
      clients: [],
      exercises: [],
      foods: [],
      partner: null,
    });
  }

  const [clientRows, foods, exercises] = await Promise.all([
    expectData(
      asQuery<PartnerClientListRow>(supabase.rpc("partner_clients_list")),
      "Clientes disponíveis",
    ),
    expectData(
      asQuery<PartnerProtocolFoodRecord>(
        supabase
          .from("partner_protocol_foods")
          .select("id, name, category, source, serving_size, serving_unit, household_measure, kcal, carbs_g, protein_g, fat_g, fiber_g, sodium_mg, notes, tags, suggested_uses, usage_count, status, created_at, updated_at")
          .eq("partner_id", partner.id)
          .order("updated_at", { ascending: false }),
      ),
      "base de alimentos",
    ),
    expectData(
      asQuery<PartnerProtocolExerciseRecord>(
        supabase
          .from("partner_protocol_exercises")
          .select("id, name, muscle_group, secondary_muscle_groups, equipment, level, objective, default_sets, default_reps, rest_seconds, cadence, video_url, thumbnail_url, instructions, tags, variations, usage_count, status, created_at, updated_at")
          .eq("partner_id", partner.id)
          .order("updated_at", { ascending: false }),
      ),
      "biblioteca de exercícios",
    ),
  ]);

  const clients: PartnerProtocolClient[] = clientRows
    .filter((row) => row.relationship_status === "active")
    .map((row) => ({
      displayName: row.display_name,
      email: row.email,
      id: row.patient_id,
      status: row.relationship_status,
    }));

  return buildPartnerProtocolsData({
    clients,
    exercises,
    foods,
    partner: {
      id: partner.id,
      professionalName: partner.professional_name,
      professionalType: partner.professional_type,
    },
  });
}
