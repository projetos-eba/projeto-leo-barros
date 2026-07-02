import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerMaterialsData,
  type PartnerMaterialClient,
  type PartnerMaterialEventRecord,
  type PartnerMaterialRecord,
  type PartnerMaterialsData,
  type PartnerMaterialShareRecord,
} from "./materials-metrics";

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

export async function fetchPartnerMaterialsData(): Promise<PartnerMaterialsData> {
  const supabase = (await createClient()) as unknown as SupabaseReadClient;
  const { profile } = await getCurrentProfile();

  if (!profile) {
    throw new Error("Falha ao carregar materiais: sessão do parceiro indisponível.");
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
    return buildPartnerMaterialsData({
      clients: [],
      events: [],
      materials: [],
      partner: null,
      shares: [],
    });
  }

  const [clientRows, materials, shares, events] = await Promise.all([
    expectData(
      asQuery<PartnerClientListRow>(supabase.rpc("partner_clients_list")),
      "Clientes disponíveis",
    ),
    expectData(
      asQuery<PartnerMaterialRecord>(
        supabase
          .from("partner_materials")
          .select("id, title, description, category, material_kind, file_type, original_filename, mime_type, size_bytes, storage_path, cover_storage_path, external_url, tags, status, is_favorite, created_at, updated_at")
          .eq("partner_id", partner.id)
          .order("updated_at", { ascending: false }),
      ),
      "biblioteca",
    ),
    expectData(
      asQuery<PartnerMaterialShareRecord>(
        supabase
          .from("partner_material_shares")
          .select("id, material_id, patient_id, message, status, shared_at, revoked_at")
          .eq("partner_id", partner.id)
          .order("shared_at", { ascending: false }),
      ),
      "compartilhamentos",
    ),
    expectData(
      asQuery<PartnerMaterialEventRecord>(
        supabase
          .from("partner_material_events")
          .select("id, material_id, patient_id, event_type, details, occurred_at")
          .eq("partner_id", partner.id)
          .order("occurred_at", { ascending: false }),
      ),
      "histórico",
    ),
  ]);

  const clients: PartnerMaterialClient[] = clientRows
    .filter((row) => row.relationship_status === "active")
    .map((row) => ({
      avatarUrl: null,
      displayName: row.display_name,
      email: row.email,
      id: row.patient_id,
      status: row.relationship_status,
    }));

  return buildPartnerMaterialsData({
    clients,
    events,
    materials,
    partner: {
      id: partner.id,
      professionalName: partner.professional_name,
      professionalType: partner.professional_type,
    },
    shares,
  });
}
