import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";

type PhotoFileRouteProps = {
  params: Promise<{ photoId: string }>;
};

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type PhotoFileQuery = PromiseLike<QueryResult> & {
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
  if (!profile) return new NextResponse("Não autorizado.", { status: 401 });

  const supabase = await createClient();
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!partner) return new NextResponse("Não autorizado.", { status: 403 });

  const { data: item } = await (supabase as unknown as PhotoFileDb)
    .from("partner_client_photo_items")
    .select("id, partner_id, storage_path, original_filename")
    .eq("id", photoId)
    .eq("partner_id", partner.id)
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
