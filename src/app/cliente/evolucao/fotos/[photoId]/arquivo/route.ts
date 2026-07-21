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

function placeholderImageResponse(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" fill="#102333"/><rect x="80" y="80" width="740" height="1040" rx="38" fill="#0b1720" stroke="#304354" stroke-width="4"/><text x="450" y="600" fill="#8fcfff" font-family="Arial, sans-serif" font-size="42" font-weight="700" text-anchor="middle">${label}</text><text x="450" y="660" fill="#9fb1c0" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">Arquivo não disponível neste momento</text></svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

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
    return placeholderImageResponse("Foto");
  }

  return NextResponse.redirect(data.signedUrl);
}
