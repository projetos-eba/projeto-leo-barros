import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type MaterialFileRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: MaterialFileRouteProps) {
  const { id } = await params;
  const { profile } = await getCurrentProfile();
  if (!profile) return new NextResponse("Não autorizado.", { status: 401 });

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!partner) return new NextResponse("Não autorizado.", { status: 403 });

  const { data: material } = await supabase
    .from("partner_materials")
    .select("id, partner_id, storage_path, cover_storage_path, original_filename")
    .eq("id", id)
    .eq("partner_id", partner.id)
    .maybeSingle();

  if (!material) return new NextResponse("Material não encontrado.", { status: 404 });

  const url = new URL(request.url);
  const useCover = url.searchParams.get("cover") === "1";
  const download = url.searchParams.get("download") === "1";
  const storagePath = useCover ? material.cover_storage_path : material.storage_path;

  if (!storagePath) return new NextResponse("Arquivo indisponível.", { status: 404 });

  const { data, error } = await supabase.storage
    .from("partner-materials")
    .createSignedUrl(
      storagePath,
      300,
      download ? { download: material.original_filename ?? true } : undefined,
    );

  if (error || !data?.signedUrl) {
    return new NextResponse("Não foi possível abrir o arquivo.", { status: 500 });
  }

  if (download) {
    await supabase.from("partner_material_events").insert({
      details: { download: true },
      event_type: "accessed",
      material_id: material.id,
      partner_id: partner.id,
    });
  }

  return NextResponse.redirect(data.signedUrl);
}
