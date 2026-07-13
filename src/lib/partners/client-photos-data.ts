import { createClient } from "@/lib/supabase/server";

import {
  buildPartnerClientPhotos,
  type PartnerClientPhotosData,
  type PartnerClientPhotosRawData,
} from "./client-photos-metrics";

type PhotosRpcClient = {
  rpc(name: "partner_client_photos", params: { p_patient_id: string }): PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

export async function fetchPartnerClientPhotos(patientId: string): Promise<PartnerClientPhotosData | null> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as PhotosRpcClient).rpc("partner_client_photos", {
    p_patient_id: patientId,
  });

  if (error) {
    throw new Error(`Falha ao carregar Fotos do Cliente: ${error.message}`);
  }

  if (!data) return null;

  return buildPartnerClientPhotos(data as PartnerClientPhotosRawData);
}
