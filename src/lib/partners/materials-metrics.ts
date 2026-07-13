export type PartnerMaterialCategory =
  | "nutricao"
  | "treino"
  | "medico"
  | "educativo"
  | "formularios"
  | "outros";

export type PartnerMaterialFileType = "pdf" | "image" | "office" | "video";
export type PartnerMaterialKind = "file" | "video_link";
export type PartnerMaterialStatus = "active" | "archived";

export type PartnerMaterialClient = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  id: string;
  status: string;
};

export type PartnerMaterialShareRecord = {
  id: string;
  material_id: string;
  message: string | null;
  patient_id: string;
  revoked_at: string | null;
  shared_at: string;
  status: string;
};

export type PartnerMaterialEventRecord = {
  details: Record<string, unknown>;
  event_type: string;
  id: string;
  material_id: string;
  occurred_at: string;
  patient_id: string | null;
};

export type PartnerMaterialRecord = {
  category: string;
  cover_storage_path: string | null;
  created_at: string;
  description: string | null;
  external_url: string | null;
  file_type: string;
  id: string;
  is_favorite: boolean;
  material_kind: string;
  mime_type: string | null;
  original_filename: string | null;
  size_bytes: number | null;
  status: string;
  storage_path: string | null;
  tags: string[];
  title: string;
  updated_at: string;
};

export type PartnerMaterialShare = {
  client: PartnerMaterialClient;
  id: string;
  message: string | null;
  revokedAt: string | null;
  sharedAt: string;
  status: "linked" | "revoked";
};

export type PartnerMaterialEvent = {
  clientName: string | null;
  details: Record<string, unknown>;
  id: string;
  materialId: string;
  occurredAt: string;
  type: string;
};

export type PartnerMaterial = {
  category: PartnerMaterialCategory;
  categoryLabel: string;
  coverStoragePath: string | null;
  createdAt: string;
  description: string | null;
  embedUrl: string | null;
  externalUrl: string | null;
  fileLabel: string;
  fileType: PartnerMaterialFileType;
  id: string;
  isFavorite: boolean;
  kind: PartnerMaterialKind;
  mimeType: string | null;
  originalFilename: string | null;
  shareCount: number;
  shares: PartnerMaterialShare[];
  sizeBytes: number | null;
  sizeLabel: string;
  status: PartnerMaterialStatus;
  storagePath: string | null;
  tags: string[];
  title: string;
  updatedAt: string;
};

export type PartnerMaterialsData = {
  clients: PartnerMaterialClient[];
  events: PartnerMaterialEvent[];
  materials: PartnerMaterial[];
  metrics: {
    favorites: number;
    forms: number;
    shared: number;
    total: number;
  };
  partner: {
    id: string;
    professionalName: string;
    professionalType: string;
  } | null;
};

export type PartnerMaterialsRawData = {
  clients: PartnerMaterialClient[];
  events: PartnerMaterialEventRecord[];
  materials: PartnerMaterialRecord[];
  partner: PartnerMaterialsData["partner"];
  shares: PartnerMaterialShareRecord[];
};

export const materialCategoryLabels: Record<PartnerMaterialCategory, string> = {
  educativo: "Educativo",
  formularios: "Formulários",
  medico: "Médico",
  nutricao: "Nutrição",
  outros: "Outros",
  treino: "Treino",
};

const fileLabels: Record<PartnerMaterialFileType, string> = {
  image: "Imagem",
  office: "Office",
  pdf: "PDF",
  video: "Vídeo",
};

export const acceptedMaterialMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export const maxMaterialFileSize = 50 * 1024 * 1024;

export function classifyMaterialFile(mimeType: string): PartnerMaterialFileType | null {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/jpeg" || mimeType === "image/png") return "image";
  if (acceptedMaterialMimeTypes.includes(mimeType as (typeof acceptedMaterialMimeTypes)[number])) {
    return "office";
  }
  return null;
}

export function normalizeMaterialVideoUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.pathname.startsWith("/embed/")
        ? url.pathname.split("/")[2]
        : url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function formatMaterialSize(size: number | null) {
  if (!size) return "Link externo";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function buildPartnerMaterialsData(raw: PartnerMaterialsRawData): PartnerMaterialsData {
  const clientsById = new Map(raw.clients.map((client) => [client.id, client]));
  const sharesByMaterial = new Map<string, PartnerMaterialShare[]>();

  for (const share of raw.shares) {
    const client = clientsById.get(share.patient_id);
    if (!client) continue;
    const shares = sharesByMaterial.get(share.material_id) ?? [];
    shares.push({
      client,
      id: share.id,
      message: share.message,
      revokedAt: share.revoked_at,
      sharedAt: share.shared_at,
      status: share.status === "revoked" ? "revoked" : "linked",
    });
    sharesByMaterial.set(share.material_id, shares);
  }

  const materials = raw.materials.map((row): PartnerMaterial => {
    const category = row.category as PartnerMaterialCategory;
    const fileType = row.file_type as PartnerMaterialFileType;
    const shares = sharesByMaterial.get(row.id) ?? [];
    return {
      category,
      categoryLabel: materialCategoryLabels[category] ?? materialCategoryLabels.outros,
      coverStoragePath: row.cover_storage_path,
      createdAt: row.created_at,
      description: row.description,
      embedUrl: row.material_kind === "video_link" && row.external_url
        ? normalizeMaterialVideoUrl(row.external_url)
        : null,
      externalUrl: row.external_url,
      fileLabel: fileLabels[fileType] ?? "Arquivo",
      fileType,
      id: row.id,
      isFavorite: row.is_favorite,
      kind: row.material_kind as PartnerMaterialKind,
      mimeType: row.mime_type,
      originalFilename: row.original_filename,
      shareCount: shares.filter((share) => share.status === "linked").length,
      shares,
      sizeBytes: row.size_bytes,
      sizeLabel: formatMaterialSize(row.size_bytes),
      status: row.status === "archived" ? "archived" : "active",
      storagePath: row.storage_path,
      tags: row.tags ?? [],
      title: row.title,
      updatedAt: row.updated_at,
    };
  });

  const active = materials.filter((material) => material.status === "active");
  const events = raw.events.map((event): PartnerMaterialEvent => ({
    clientName: event.patient_id ? clientsById.get(event.patient_id)?.displayName ?? "Cliente" : null,
    details: event.details ?? {},
    id: event.id,
    materialId: event.material_id,
    occurredAt: event.occurred_at,
    type: event.event_type,
  }));

  return {
    clients: raw.clients,
    events,
    materials,
    metrics: {
      favorites: active.filter((material) => material.isFavorite).length,
      forms: active.filter((material) => material.category === "formularios").length,
      shared: active.reduce((total, material) => total + material.shareCount, 0),
      total: active.length,
    },
    partner: raw.partner,
  };
}
