import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type PhotoFileRouteProps = {
  params: Promise<{ photoId: string }>;
};

type PhotoFileQuery = PromiseLike<{ data: unknown; error: { message: string } | null }> & {
  eq(column: string, value: unknown): PhotoFileQuery;
  maybeSingle(): PhotoFileQuery;
  select(columns: string): PhotoFileQuery;
};

type PhotoFileDb = {
  from(table: string): PhotoFileQuery;
};

export async function GET(_request: Request, { params }: PhotoFileRouteProps) {
  const { photoId } = await params;
  const { profile } = await getCurrentProfile();
  if (!profile || profile.role !== "cliente") return new NextResponse("Não autorizado.", { status: 401 });

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const patientRow = patient as { id: string } | null;
  if (!patientRow) return new NextResponse("Não autorizado.", { status: 403 });

  const { data: item } = await (supabase as unknown as PhotoFileDb)
    .from("partner_client_photo_items")
    .select("id, patient_id, storage_path, original_filename")
    .eq("id", photoId)
    .eq("patient_id", patientRow.id)
    .maybeSingle();

  const photo = item as { original_filename: string; storage_path: string } | null;
  if (!photo) return new NextResponse("Foto não encontrada.", { status: 404 });

  const { data, error } = await supabase.storage
    .from("partner-client-photos")
    .createSignedUrl(photo.storage_path, 300);

  if (error || !data?.signedUrl) {
    return new NextResponse("Não foi possível abrir a foto.", { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
