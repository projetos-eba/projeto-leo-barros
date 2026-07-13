import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PartnerMaterialsData } from "@/lib/partners/materials-metrics";

import {
  createPartnerVideoMaterial,
  setPartnerMaterialFavorite,
  sharePartnerMaterial,
} from "./actions";
import { PartnerMaterialsView } from "./partner-materials-view";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("./actions", () => ({
  createPartnerFileMaterial: vi.fn(),
  createPartnerVideoMaterial: vi.fn(),
  setPartnerMaterialArchived: vi.fn(),
  setPartnerMaterialFavorite: vi.fn(),
  sharePartnerMaterial: vi.fn(),
  updatePartnerMaterial: vi.fn(),
}));

const data: PartnerMaterialsData = {
  clients: [{ avatarUrl: null, displayName: "Ana Ribeiro", email: "ana@example.invalid", id: "client-1", status: "active" }],
  events: [],
  materials: [
    {
      category: "nutricao",
      categoryLabel: "Nutrição",
      coverStoragePath: null,
      createdAt: "2026-06-30T10:00:00.000Z",
      description: "Plano alimentar de sete dias.",
      embedUrl: null,
      externalUrl: null,
      fileLabel: "PDF",
      fileType: "pdf",
      id: "material-1",
      isFavorite: false,
      kind: "file",
      mimeType: "application/pdf",
      originalFilename: "dieta.pdf",
      shareCount: 0,
      shares: [],
      sizeBytes: 7309,
      sizeLabel: "7 KB",
      status: "active",
      storagePath: "partner/material/dieta.pdf",
      tags: ["low-carb"],
      title: "Plano Alimentar Low Carb",
      updatedAt: "2026-06-30T10:00:00.000Z",
    },
    {
      category: "treino",
      categoryLabel: "Treino",
      coverStoragePath: null,
      createdAt: "2026-06-30T11:00:00.000Z",
      description: "Treino ABC.",
      embedUrl: null,
      externalUrl: null,
      fileLabel: "PDF",
      fileType: "pdf",
      id: "material-2",
      isFavorite: true,
      kind: "file",
      mimeType: "application/pdf",
      originalFilename: "treino.pdf",
      shareCount: 0,
      shares: [],
      sizeBytes: 6267,
      sizeLabel: "6 KB",
      status: "active",
      storagePath: "partner/material/treino.pdf",
      tags: ["hipertrofia"],
      title: "Plano de Treino ABC",
      updatedAt: "2026-06-30T11:00:00.000Z",
    },
  ],
  metrics: { favorites: 1, forms: 0, shared: 0, total: 2 },
  partner: { id: "partner-1", professionalName: "Antonio Ferrari", professionalType: "nutricionista" },
};

describe("PartnerMaterialsView", () => {
  beforeEach(() => {
    vi.mocked(createPartnerVideoMaterial).mockResolvedValue({ ok: true, message: "Vídeo salvo." });
    vi.mocked(setPartnerMaterialFavorite).mockResolvedValue({ ok: true });
    vi.mocked(sharePartnerMaterial).mockResolvedValue({ ok: true });
    refresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.pointerEvents = "";
    vi.restoreAllMocks();
  });

  it("renderiza biblioteca sem Pacientes ou Cardio e filtra por categoria", () => {
    render(<PartnerMaterialsView data={data} />);
    expect(screen.getByRole("heading", { name: "Materiais" })).toBeInTheDocument();
    expect(screen.queryByText("Pacientes")).not.toBeInTheDocument();
    expect(screen.queryByText("Cardio")).not.toBeInTheDocument();
    expect(screen.getByText("Plano Alimentar Low Carb")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Treino" }));
    expect(screen.queryByText("Plano Alimentar Low Carb")).not.toBeInTheDocument();
    expect(screen.getByText("Plano de Treino ABC")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Visualização em lista" }));
    expect(screen.getByText("PDF · 6 KB", { exact: false })).toBeInTheDocument();
  });

  it("cria vídeo por link e favorita um material", async () => {
    render(<PartnerMaterialsView data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "Novo material" }));
    fireEvent.click(screen.getByRole("button", { name: "Vídeo por link" }));
    fireEvent.change(screen.getByPlaceholderText("Ex.: Guia alimentar inicial"), { target: { value: "Aula de mobilidade" } });
    fireEvent.change(screen.getByPlaceholderText("https://youtube.com/watch?v=..."), { target: { value: "https://youtu.be/abc123" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar material" }));

    await waitFor(() => expect(createPartnerVideoMaterial).toHaveBeenCalledWith(expect.objectContaining({
      externalUrl: "https://youtu.be/abc123",
      title: "Aula de mobilidade",
    })));

    cleanup();
    render(<PartnerMaterialsView data={data} />);
    const favoriteButtons = screen.getAllByRole("button", { name: "Adicionar aos favoritos" });
    fireEvent.click(favoriteButtons[0]);
    await waitFor(() => expect(setPartnerMaterialFavorite).toHaveBeenCalledWith({ materialId: "material-1", value: true }));
  });

  it("compartilha com Cliente selecionado", async () => {
    render(<PartnerMaterialsView data={data} />);
    const shareButtons = screen.getAllByRole("button", { name: "Compartilhar material" });
    fireEvent.click(shareButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "Ana Ribeiro ana@example.invalid" }));
    fireEvent.click(screen.getByRole("button", { name: "Compartilhar" }));

    await waitFor(() => expect(sharePartnerMaterial).toHaveBeenCalledWith(expect.objectContaining({
      materialId: "material-2",
      patientIds: ["client-1"],
    })));
  });
});
