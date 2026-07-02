import { describe, expect, it } from "vitest";

import {
  buildPartnerMaterialsData,
  classifyMaterialFile,
  normalizeMaterialVideoUrl,
  type PartnerMaterialsRawData,
} from "./materials-metrics";

const raw: PartnerMaterialsRawData = {
  clients: [
    {
      avatarUrl: null,
      displayName: "Ana Ribeiro",
      email: "ana@example.invalid",
      id: "client-1",
      status: "active",
    },
  ],
  events: [],
  materials: [
    {
      category: "nutricao",
      cover_storage_path: null,
      created_at: "2026-06-30T10:00:00.000Z",
      description: "Guia alimentar.",
      external_url: null,
      file_type: "pdf",
      id: "material-1",
      is_favorite: true,
      material_kind: "file",
      mime_type: "application/pdf",
      original_filename: "guia.pdf",
      size_bytes: 2_400_000,
      status: "active",
      storage_path: "partner/material/guia.pdf",
      tags: ["nutricao"],
      title: "Guia alimentar",
      updated_at: "2026-06-30T10:00:00.000Z",
    },
    {
      category: "formularios",
      cover_storage_path: null,
      created_at: "2026-06-30T11:00:00.000Z",
      description: null,
      external_url: "https://youtu.be/abc123",
      file_type: "video",
      id: "material-2",
      is_favorite: false,
      material_kind: "video_link",
      mime_type: null,
      original_filename: null,
      size_bytes: null,
      status: "active",
      storage_path: null,
      tags: [],
      title: "Orientação em vídeo",
      updated_at: "2026-06-30T11:00:00.000Z",
    },
  ],
  partner: { id: "partner-1", professionalName: "Antonio Ferrari", professionalType: "nutricionista" },
  shares: [
    {
      id: "share-1",
      material_id: "material-1",
      message: null,
      patient_id: "client-1",
      revoked_at: null,
      shared_at: "2026-06-30T12:00:00.000Z",
      status: "linked",
    },
  ],
};

describe("materials metrics", () => {
  it("classifica arquivos e restringe vídeos aos provedores aprovados", () => {
    expect(classifyMaterialFile("application/pdf")).toBe("pdf");
    expect(classifyMaterialFile("image/png")).toBe("image");
    expect(classifyMaterialFile("application/zip")).toBeNull();
    expect(normalizeMaterialVideoUrl("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
    expect(normalizeMaterialVideoUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
    expect(normalizeMaterialVideoUrl("https://example.com/video")).toBeNull();
  });

  it("calcula métricas e agrega destinatários ativos", () => {
    const data = buildPartnerMaterialsData(raw);
    expect(data.metrics).toEqual({ favorites: 1, forms: 1, shared: 1, total: 2 });
    expect(data.materials[0].shareCount).toBe(1);
    expect(data.materials[0].sizeLabel).toBe("2,3 MB");
    expect(data.materials[1].embedUrl).toBe("https://www.youtube.com/embed/abc123");
  });
});
