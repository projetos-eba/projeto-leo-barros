"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth/next-guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import {
  acceptedMaterialMimeTypes,
  classifyMaterialFile,
  maxMaterialFileSize,
  normalizeMaterialVideoUrl,
} from "@/lib/partners/materials-metrics";

export type PartnerMaterialsActionResult = {
  error?: string;
  materialId?: string;
  message?: string;
  ok: boolean;
};

const uuidSchema = z.string().uuid();
const categorySchema = z.enum(["nutricao", "treino", "medico", "educativo", "formularios", "outros"]);
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(12);
const metadataSchema = z.object({
  category: categorySchema,
  description: z.string().trim().max(1000).nullable(),
  tags: tagsSchema,
  title: z.string().trim().min(3).max(140),
});

const fileMaterialSchema = metadataSchema.extend({
  materialId: uuidSchema,
  mimeType: z.enum(acceptedMaterialMimeTypes),
  originalFilename: z.string().trim().min(1).max(220),
  sizeBytes: z.number().int().min(1).max(maxMaterialFileSize),
  storagePath: z.string().trim().min(1).max(500),
});

const videoMaterialSchema = metadataSchema.extend({
  externalUrl: z.string().url().max(500),
});

const updateMaterialSchema = metadataSchema.extend({
  materialId: uuidSchema,
});

const materialStateSchema = z.object({
  materialId: uuidSchema,
  value: z.boolean(),
});

const shareMaterialSchema = z.object({
  materialId: uuidSchema,
  message: z.string().trim().max(300).nullable(),
  patientIds: z.array(uuidSchema).min(1).max(100),
});

const revokeShareSchema = z.object({
  materialId: uuidSchema,
  patientId: uuidSchema,
});

async function getPartnerContext() {
  const supabase = await createClient();
  const { profile } = await getCurrentProfile();

  if (!profile) {
    return { error: "Sessão do parceiro indisponível.", partnerId: null, supabase };
  }

  const { data: partner, error } = await supabase
    .from("partners")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error || !partner) {
    return { error: "Cadastro do parceiro indisponível.", partnerId: null, supabase };
  }

  return { error: null, partnerId: partner.id, supabase };
}

function normalizeNullable(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

function revalidateMaterials(materialId?: string) {
  revalidatePath("/parceiros/materiais");
  if (materialId) revalidatePath(`/parceiros/materiais/${materialId}`);
}

async function recordEvent(
  context: Awaited<ReturnType<typeof getPartnerContext>>,
  materialId: string,
  eventType: string,
  patientId?: string,
  details: Json = {},
) {
  if (!context.partnerId) return;
  await context.supabase.from("partner_material_events").insert({
    details,
    event_type: eventType,
    material_id: materialId,
    partner_id: context.partnerId,
    patient_id: patientId ?? null,
  });
}

export async function createPartnerFileMaterial(
  input: z.input<typeof fileMaterialSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = fileMaterialSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados e o arquivo selecionado.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const expectedPrefix = `${context.partnerId}/${parsed.data.materialId}/`;
  if (!parsed.data.storagePath.startsWith(expectedPrefix)) {
    return { error: "O caminho do arquivo não pertence a este parceiro.", ok: false };
  }

  const fileType = classifyMaterialFile(parsed.data.mimeType);
  if (!fileType) return { error: "Formato de arquivo não suportado.", ok: false };

  const { error } = await context.supabase.from("partner_materials").insert({
    category: parsed.data.category,
    description: normalizeNullable(parsed.data.description),
    file_type: fileType,
    id: parsed.data.materialId,
    material_kind: "file",
    mime_type: parsed.data.mimeType,
    original_filename: parsed.data.originalFilename,
    partner_id: context.partnerId,
    size_bytes: parsed.data.sizeBytes,
    storage_path: parsed.data.storagePath,
    tags: uniqueTags(parsed.data.tags),
    title: parsed.data.title,
  });

  if (error) return { error: "Não foi possível registrar o material.", ok: false };

  await recordEvent(context, parsed.data.materialId, "created", undefined, { fileType });
  revalidateMaterials(parsed.data.materialId);
  return { materialId: parsed.data.materialId, message: "Material salvo.", ok: true };
}

export async function createPartnerVideoMaterial(
  input: z.input<typeof videoMaterialSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = videoMaterialSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do vídeo.", ok: false };

  const embedUrl = normalizeMaterialVideoUrl(parsed.data.externalUrl);
  if (!embedUrl) return { error: "Use um link válido do YouTube ou Vimeo.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const materialId = crypto.randomUUID();
  const { error } = await context.supabase.from("partner_materials").insert({
    category: parsed.data.category,
    description: normalizeNullable(parsed.data.description),
    external_url: parsed.data.externalUrl.trim(),
    file_type: "video",
    id: materialId,
    material_kind: "video_link",
    partner_id: context.partnerId,
    tags: uniqueTags(parsed.data.tags),
    title: parsed.data.title,
  });

  if (error) return { error: "Não foi possível registrar o vídeo.", ok: false };

  await recordEvent(context, materialId, "created", undefined, { provider: embedUrl.includes("vimeo") ? "vimeo" : "youtube" });
  revalidateMaterials(materialId);
  return { materialId, message: "Vídeo salvo.", ok: true };
}

export async function updatePartnerMaterial(
  input: z.input<typeof updateMaterialSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = updateMaterialSchema.safeParse(input);
  if (!parsed.success) return { error: "Revise os dados do material.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_materials")
    .update({
      category: parsed.data.category,
      description: normalizeNullable(parsed.data.description),
      tags: uniqueTags(parsed.data.tags),
      title: parsed.data.title,
    })
    .eq("id", parsed.data.materialId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível atualizar o material.", ok: false };

  await recordEvent(context, parsed.data.materialId, "updated");
  revalidateMaterials(parsed.data.materialId);
  return { message: "Material atualizado.", ok: true };
}

export async function setPartnerMaterialFavorite(
  input: z.input<typeof materialStateSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = materialStateSchema.safeParse(input);
  if (!parsed.success) return { error: "Material inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_materials")
    .update({ is_favorite: parsed.data.value })
    .eq("id", parsed.data.materialId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível atualizar o favorito.", ok: false };

  await recordEvent(context, parsed.data.materialId, parsed.data.value ? "favorited" : "unfavorited");
  revalidateMaterials(parsed.data.materialId);
  return { message: parsed.data.value ? "Adicionado aos favoritos." : "Removido dos favoritos.", ok: true };
}

export async function setPartnerMaterialArchived(
  input: z.input<typeof materialStateSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = materialStateSchema.safeParse(input);
  if (!parsed.success) return { error: "Material inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_materials")
    .update({ status: parsed.data.value ? "archived" : "active" })
    .eq("id", parsed.data.materialId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível alterar o status.", ok: false };

  await recordEvent(context, parsed.data.materialId, parsed.data.value ? "archived" : "restored");
  revalidateMaterials(parsed.data.materialId);
  return { message: parsed.data.value ? "Material arquivado." : "Material restaurado.", ok: true };
}

export async function sharePartnerMaterial(
  input: z.input<typeof shareMaterialSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = shareMaterialSchema.safeParse(input);
  if (!parsed.success) return { error: "Selecione ao menos um Cliente válido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const patientIds = Array.from(new Set(parsed.data.patientIds));
  const rows = patientIds.map((patientId) => ({
    material_id: parsed.data.materialId,
    message: normalizeNullable(parsed.data.message),
    partner_id: context.partnerId!,
    patient_id: patientId,
    revoked_at: null,
    shared_at: new Date().toISOString(),
    status: "linked" as const,
  }));

  const { error } = await context.supabase
    .from("partner_material_shares")
    .upsert(rows, { onConflict: "material_id,patient_id" });

  if (error) return { error: "Não foi possível compartilhar o material.", ok: false };

  await Promise.all(patientIds.map((patientId) => recordEvent(
    context,
    parsed.data.materialId,
    "shared",
    patientId,
    parsed.data.message ? { message: parsed.data.message } : {},
  )));
  revalidateMaterials(parsed.data.materialId);
  return { message: `Material compartilhado com ${patientIds.length} Cliente${patientIds.length > 1 ? "s" : ""}.`, ok: true };
}

export async function revokePartnerMaterialShare(
  input: z.input<typeof revokeShareSchema>,
): Promise<PartnerMaterialsActionResult> {
  const parsed = revokeShareSchema.safeParse(input);
  if (!parsed.success) return { error: "Compartilhamento inválido.", ok: false };

  const context = await getPartnerContext();
  if (!context.partnerId) return { error: context.error ?? "Acesso indisponível.", ok: false };

  const { error } = await context.supabase
    .from("partner_material_shares")
    .update({ revoked_at: new Date().toISOString(), status: "revoked" })
    .eq("material_id", parsed.data.materialId)
    .eq("patient_id", parsed.data.patientId)
    .eq("partner_id", context.partnerId);

  if (error) return { error: "Não foi possível revogar o compartilhamento.", ok: false };

  await recordEvent(context, parsed.data.materialId, "revoked", parsed.data.patientId);
  revalidateMaterials(parsed.data.materialId);
  return { message: "Compartilhamento revogado.", ok: true };
}
