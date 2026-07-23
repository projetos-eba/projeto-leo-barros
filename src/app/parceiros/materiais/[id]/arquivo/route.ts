import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type MaterialFileRouteProps = {
  params: Promise<{ id: string }>;
};

function placeholderImageResponse(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><rect width="1200" height="760" fill="#102333"/><rect x="80" y="80" width="1040" height="600" rx="34" fill="#0b1720" stroke="#304354" stroke-width="4"/><text x="600" y="368" fill="#8fcfff" font-family="Arial, sans-serif" font-size="42" font-weight="700" text-anchor="middle">${label}</text><text x="600" y="424" fill="#9fb1c0" font-family="Arial, sans-serif" font-size="24" text-anchor="middle">Arquivo não disponível neste momento</text></svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function unavailableFileResponse(filename: string | null) {
  const title = filename ?? "Arquivo";
  return new NextResponse(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><body style="margin:0;background:#0b1720;color:#d8e5ee;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center"><main style="max-width:520px;text-align:center;padding:32px"><h1 style="color:#fff;font-size:24px">${title}</h1><p style="line-height:1.6;color:#9fb1c0">Arquivo não disponível neste momento.</p></main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

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
    return useCover ? placeholderImageResponse(material.original_filename ?? "Material") : unavailableFileResponse(material.original_filename);
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
