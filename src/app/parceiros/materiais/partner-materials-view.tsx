"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Check,
  ChevronDown,
  FileImage,
  FileSpreadsheet,
  FileText,
  Film,
  Grid2X2,
  HeartPulse,
  LayoutList,
  MoreVertical,
  Plus,
  Search,
  Send,
  Star,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import {
  acceptedMaterialMimeTypes,
  materialCategoryLabels,
  maxMaterialFileSize,
  type PartnerMaterial,
  type PartnerMaterialCategory,
  type PartnerMaterialFileType,
  type PartnerMaterialsData,
} from "@/lib/partners/materials-metrics";
import { cn } from "@/lib/utils";

import {
  createPartnerFileMaterial,
  createPartnerVideoMaterial,
  setPartnerMaterialArchived,
  setPartnerMaterialFavorite,
  sharePartnerMaterial,
  updatePartnerMaterial,
} from "./actions";

type PartnerMaterialsViewProps = {
  data: PartnerMaterialsData;
};

type ViewMode = "grid" | "list";
type NewMaterialKind = "file" | "video";
type StatusFilter = "active" | "archived" | "all";
type TypeFilter = "all" | PartnerMaterialFileType;
type SortMode = "recent" | "oldest" | "title" | "shared";

const categories: Array<"all" | PartnerMaterialCategory> = [
  "all",
  "nutricao",
  "treino",
  "medico",
  "educativo",
  "formularios",
  "outros",
];

const categoryStyles: Record<PartnerMaterialCategory, { accent: string; bg: string; icon: typeof FileText }> = {
  educativo: { accent: "text-[#a98cff]", bg: "bg-[#2e2451]", icon: BookOpen },
  formularios: { accent: "text-[#b481ff]", bg: "bg-[#322153]", icon: FileText },
  medico: { accent: "text-[#5cd995]", bg: "bg-[#123c2e]", icon: HeartPulse },
  nutricao: { accent: "text-[#54d18a]", bg: "bg-[#143b2d]", icon: FileImage },
  outros: { accent: "text-[#a9b8c5]", bg: "bg-[#243440]", icon: FileText },
  treino: { accent: "text-[#5eb5ff]", bg: "bg-[#123a5c]", icon: FileSpreadsheet },
};

const typeIcons: Record<PartnerMaterialFileType, typeof FileText> = {
  image: FileImage,
  office: FileSpreadsheet,
  pdf: FileText,
  video: Film,
};

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[8px] border border-[#293b49] bg-[#101a24]/78", className)}>
      {children}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  tone: string;
  value: number;
}) {
  return (
    <Panel className="flex min-h-[72px] items-center gap-3 px-3 py-3 sm:min-h-[96px] sm:gap-4 sm:px-5 sm:py-4">
      <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-[7px] sm:size-12 sm:rounded-[8px]", tone)}>
        <Icon className="size-4 sm:size-6" />
      </div>
      <div>
        <p className="text-[21px] font-bold leading-none text-[#edf4f8] sm:text-[25px]">{value}</p>
        <p className="mt-1 text-[11px] leading-3 text-[#8797a6] sm:mt-2 sm:text-[12px]">{label}</p>
      </div>
    </Panel>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(value))
    .replace(".", "");
}

function parseTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function safeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

function MaterialVisual({ material }: { material: PartnerMaterial }) {
  const category = categoryStyles[material.category];
  const Icon = typeIcons[material.fileType] ?? category.icon;
  const hasCover = Boolean(material.coverStoragePath);

  if (hasCover) {
    return (
      <img
        alt=""
        className="h-full w-full object-cover object-top"
        src={`/parceiros/materiais/${material.id}/arquivo?cover=1`}
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center", category.bg)}>
      <Icon className={cn("size-16", category.accent)} strokeWidth={1.35} />
    </div>
  );
}

function MaterialCard({
  layout,
  material,
  onArchive,
  onEdit,
  onFavorite,
  onShare,
}: {
  layout: ViewMode;
  material: PartnerMaterial;
  onArchive: (material: PartnerMaterial) => void;
  onEdit: (material: PartnerMaterial) => void;
  onFavorite: (material: PartnerMaterial) => void;
  onShare: (material: PartnerMaterial) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const category = categoryStyles[material.category];

  if (layout === "list") {
    const Icon = typeIcons[material.fileType];
    return (
      <Panel className="grid min-h-[82px] grid-cols-[48px_minmax(0,1fr)_120px_100px_116px] items-center gap-4 px-4 max-md:grid-cols-[44px_minmax(0,1fr)_auto]">
        <div className={cn("flex size-11 items-center justify-center rounded-[7px]", category.bg, category.accent)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <Link className="block truncate text-[14px] font-semibold text-[#eef4f8] hover:text-[#55b4ff]" href={`/parceiros/materiais/${material.id}`}>
            {material.title}
          </Link>
          <p className="mt-1 truncate text-[11px] text-[#8192a1]">{material.categoryLabel} · {material.fileLabel} · {material.sizeLabel}</p>
        </div>
        <p className="text-[12px] text-[#9aa8b4] max-md:hidden">{formatDate(material.updatedAt)}</p>
        <p className="flex items-center gap-1.5 text-[12px] text-[#9aa8b4] max-md:hidden"><Users className="size-3.5" /> {material.shareCount}</p>
        <div className="flex items-center justify-end gap-1">
          <button aria-label={material.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="flex size-9 items-center justify-center rounded-[7px] text-[#9ba9b5] hover:bg-[#172a38]" onClick={() => onFavorite(material)} type="button">
            <Star className={cn("size-4", material.isFavorite && "fill-[#f5c542] text-[#f5c542]")} />
          </button>
          <button aria-label="Compartilhar material" className="flex size-9 items-center justify-center rounded-[7px] text-[#55b4ff] hover:bg-[#172a38]" onClick={() => onShare(material)} type="button">
            <Send className="size-4" />
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="relative flex min-h-[282px] min-w-0 flex-col overflow-hidden sm:min-h-[354px]">
      <div className="relative h-[96px] overflow-hidden border-b border-[#293b49] sm:h-[126px]">
        <MaterialVisual material={material} />
        <span className="absolute left-3 top-3 rounded-[5px] border border-[#3c4d5a] bg-[#0b1620]/90 px-2 py-1 text-[10px] font-semibold text-[#d4dee6]">
          {material.fileLabel}
        </span>
        <button aria-label={material.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-[7px] bg-[#0b1620]/84 text-[#aab7c2]" onClick={() => onFavorite(material)} type="button">
          <Star className={cn("size-4", material.isFavorite && "fill-[#f5c542] text-[#f5c542]")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className={cn("text-[10px] font-semibold sm:text-[11px]", category.accent)}>{material.categoryLabel}</p>
        <Link className="mt-1 line-clamp-2 text-[14px] font-semibold leading-5 text-[#eef4f8] hover:text-[#55b4ff] sm:text-[16px]" href={`/parceiros/materiais/${material.id}`}>
          {material.title}
        </Link>
        <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-4 text-[#8b9aa7] sm:mt-2 sm:min-h-10 sm:text-[12px] sm:leading-5">
          {material.description ?? "Material de apoio disponível na biblioteca."}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-[#273845] pt-3 text-[11px] text-[#8797a5]">
          <span>{material.sizeLabel}</span>
          <span>{formatDate(material.updatedAt)}</span>
          <span className="flex items-center gap-1"><Users className="size-3.5" /> {material.shareCount}</span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_42px_42px] gap-2">
          <Link className="flex h-10 items-center justify-center rounded-[7px] bg-[#168ce4] text-[13px] font-semibold text-white hover:bg-[#259cef]" href={`/parceiros/materiais/${material.id}`}>
            Acessar
          </Link>
          <button aria-label="Compartilhar material" className="flex h-10 items-center justify-center rounded-[7px] border border-[#2c4353] text-[#b7c4ce] hover:border-[#168ce4] hover:text-[#55b4ff]" onClick={() => onShare(material)} type="button">
            <Send className="size-4" />
          </button>
          <div className="relative">
            <button aria-label="Mais ações" className="flex size-10 items-center justify-center rounded-[7px] border border-[#2c4353] text-[#b7c4ce] hover:border-[#168ce4]" onClick={() => setMenuOpen((value) => !value)} type="button">
              <MoreVertical className="size-4" />
            </button>
            {menuOpen ? (
              <div className="absolute bottom-11 right-0 z-20 w-40 rounded-[7px] border border-[#304553] bg-[#101d27] p-1 shadow-xl">
                <button className="flex h-9 w-full items-center gap-2 rounded-[5px] px-3 text-left text-[12px] text-[#c3ced7] hover:bg-[#192c39]" onClick={() => { onEdit(material); setMenuOpen(false); }} type="button">
                  <FileText className="size-4" /> Editar dados
                </button>
                <button className="flex h-9 w-full items-center gap-2 rounded-[5px] px-3 text-left text-[12px] text-[#c3ced7] hover:bg-[#192c39]" onClick={() => { onArchive(material); setMenuOpen(false); }} type="button">
                  {material.status === "archived" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                  {material.status === "archived" ? "Restaurar" : "Arquivar"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function PartnerMaterialsView({ data }: PartnerMaterialsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | PartnerMaterialCategory>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [newOpen, setNewOpen] = useState(false);
  const [newKind, setNewKind] = useState<NewMaterialKind>("file");
  const [file, setFile] = useState<File | null>(null);
  const [shareMaterial, setShareMaterial] = useState<PartnerMaterial | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [shareSearch, setShareSearch] = useState("");
  const [editMaterial, setEditMaterial] = useState<PartnerMaterial | null>(null);

  const visibleMaterials = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return data.materials
      .filter((material) => statusFilter === "all" || material.status === statusFilter)
      .filter((material) => category === "all" || material.category === category)
      .filter((material) => typeFilter === "all" || material.fileType === typeFilter)
      .filter((material) => !query || [material.title, material.description ?? "", material.tags.join(" ")].join(" ").toLocaleLowerCase("pt-BR").includes(query))
      .sort((a, b) => {
        if (sort === "oldest") return a.updatedAt.localeCompare(b.updatedAt);
        if (sort === "title") return a.title.localeCompare(b.title, "pt-BR");
        if (sort === "shared") return b.shareCount - a.shareCount;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [category, data.materials, search, sort, statusFilter, typeFilter]);

  const filteredClients = useMemo(() => {
    const query = shareSearch.trim().toLocaleLowerCase("pt-BR");
    return data.clients.filter((client) => !query || `${client.displayName} ${client.email}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [data.clients, shareSearch]);

  function runAction(action: () => Promise<{ error?: string; message?: string; ok: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      toast.success(result.message ?? "Alteração salva.");
      router.refresh();
    });
  }

  function handleFavorite(material: PartnerMaterial) {
    runAction(() => setPartnerMaterialFavorite({ materialId: material.id, value: !material.isFavorite }));
  }

  function handleArchive(material: PartnerMaterial) {
    runAction(() => setPartnerMaterialArchived({ materialId: material.id, value: material.status !== "archived" }));
  }

  function openShare(material: PartnerMaterial) {
    setShareMaterial(material);
    setSelectedClients(material.shares.filter((share) => share.status === "linked").map((share) => share.client.id));
    setShareSearch("");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "");
    const description = String(form.get("description") ?? "").trim() || null;
    const selectedCategory = String(form.get("category") ?? "outros") as PartnerMaterialCategory;
    const tags = parseTags(String(form.get("tags") ?? ""));

    setUploading(true);
    try {
      if (newKind === "video") {
        const result = await createPartnerVideoMaterial({
          category: selectedCategory,
          description,
          externalUrl: String(form.get("externalUrl") ?? ""),
          tags,
          title,
        });
        if (!result.ok) throw new Error(result.error);
        toast.success(result.message);
      } else {
        if (!file || !data.partner) throw new Error("Selecione um arquivo.");
        if (!acceptedMaterialMimeTypes.includes(file.type as (typeof acceptedMaterialMimeTypes)[number])) throw new Error("Formato de arquivo não suportado.");
        if (file.size > maxMaterialFileSize) throw new Error("O arquivo deve ter no máximo 50 MB.");

        const materialId = crypto.randomUUID();
        const storagePath = `${data.partner.id}/${materialId}/${safeFilename(file.name)}`;
        const supabase = createClient();
        const upload = await supabase.storage.from("partner-materials").upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
        if (upload.error) throw new Error("Falha ao enviar o arquivo para o Storage.");

        const result = await createPartnerFileMaterial({
          category: selectedCategory,
          description,
          materialId,
          mimeType: file.type as (typeof acceptedMaterialMimeTypes)[number],
          originalFilename: file.name,
          sizeBytes: file.size,
          storagePath,
          tags,
          title,
        });
        if (!result.ok) {
          await supabase.storage.from("partner-materials").remove([storagePath]);
          throw new Error(result.error);
        }
        toast.success(result.message);
      }

      setNewOpen(false);
      setFile(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o material.");
    } finally {
      setUploading(false);
    }
  }

  function handleShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!shareMaterial) return;
    const form = new FormData(event.currentTarget);
    runAction(() => sharePartnerMaterial({
      materialId: shareMaterial.id,
      message: String(form.get("message") ?? "").trim() || null,
      patientIds: selectedClients,
    }));
    setShareMaterial(null);
  }

  function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editMaterial) return;
    const form = new FormData(event.currentTarget);
    runAction(() => updatePartnerMaterial({
      category: String(form.get("category")) as PartnerMaterialCategory,
      description: String(form.get("description") ?? "").trim() || null,
      materialId: editMaterial.id,
      tags: parseTags(String(form.get("tags") ?? "")),
      title: String(form.get("title") ?? ""),
    }));
    setEditMaterial(null);
  }

  return (
    <div className="min-h-screen bg-[#0b1720] px-3 py-4 text-[#edf4f8] sm:px-4 sm:py-7 md:px-7 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-wrap items-start justify-between gap-3 sm:gap-5">
          <div>
            <h1 className="text-[24px] font-bold leading-tight sm:text-[30px]">Materiais</h1>
            <p className="mt-1 text-[12px] text-[#8c9aa6] sm:mt-2 sm:text-[13px]">Organize conteúdos de apoio e compartilhe com seus Clientes.</p>
          </div>
          <button className="flex h-9 items-center gap-1.5 rounded-[8px] bg-[#168ce4] px-3 text-[12px] font-semibold text-white hover:bg-[#269cf0] sm:h-11 sm:gap-2 sm:px-5 sm:text-[13px]" onClick={() => setNewOpen(true)} type="button">
            <Plus className="size-4" /> Novo material
          </button>
        </header>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 xl:grid-cols-4">
          <MetricCard icon={FileText} label="Materiais ativos" tone="bg-[#123d60] text-[#5eb5ff]" value={data.metrics.total} />
          <MetricCard icon={Send} label="Compartilhamentos ativos" tone="bg-[#123d2d] text-[#54d18a]" value={data.metrics.shared} />
          <MetricCard icon={FileSpreadsheet} label="Formulários" tone="bg-[#302052] text-[#ae88ff]" value={data.metrics.forms} />
          <MetricCard icon={Star} label="Favoritos" tone="bg-[#443818] text-[#f5c542]" value={data.metrics.favorites} />
        </div>

        <Panel className="mt-4 p-2 sm:mt-5 sm:p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {categories.map((item) => (
                <button className={cn("h-8 rounded-[7px] px-2.5 text-[11px] font-medium sm:h-9 sm:px-3 sm:text-[12px]", category === item ? "bg-[#0c6eb2] text-white" : "text-[#9aa8b4] hover:bg-[#172a38]")} key={item} onClick={() => setCategory(item)} type="button">
                  {item === "all" ? "Todos" : materialCategoryLabels[item]}
                </button>
              ))}
            </div>
            <div className="ml-auto flex flex-1 flex-wrap justify-end gap-2 min-[900px]:flex-none">
              <label className="relative min-w-[170px] flex-1 min-[900px]:w-[250px] min-[900px]:flex-none">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#778895]" />
                <input aria-label="Buscar material" className="h-9 w-full rounded-[7px] border border-[#2b3f4e] bg-[#0d1822] pl-9 pr-3 text-[12px] text-white outline-none focus:border-[#168ce4] sm:h-10" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material..." value={search} />
              </label>
              <select aria-label="Filtrar por tipo" className="h-9 rounded-[7px] border border-[#2b3f4e] bg-[#0d1822] px-2.5 text-[12px] text-[#bac5ce] sm:h-10 sm:px-3" onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} value={typeFilter}>
                <option value="all">Todos os tipos</option><option value="pdf">PDF</option><option value="image">Imagem</option><option value="office">Office</option><option value="video">Vídeo</option>
              </select>
              <select aria-label="Filtrar por status" className="h-9 rounded-[7px] border border-[#2b3f4e] bg-[#0d1822] px-2.5 text-[12px] text-[#bac5ce] sm:h-10 sm:px-3" onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}>
                <option value="active">Ativos</option><option value="archived">Arquivados</option><option value="all">Todos</option>
              </select>
              <select aria-label="Ordenar materiais" className="h-9 rounded-[7px] border border-[#2b3f4e] bg-[#0d1822] px-2.5 text-[12px] text-[#bac5ce] sm:h-10 sm:px-3" onChange={(event) => setSort(event.target.value as SortMode)} value={sort}>
                <option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option><option value="title">Título</option><option value="shared">Mais compartilhados</option>
              </select>
              <div className="flex rounded-[7px] border border-[#2b3f4e] p-1">
                <button aria-label="Visualização em grade" className={cn("flex size-8 items-center justify-center rounded-[5px]", view === "grid" ? "bg-[#164b70] text-[#65b7f4]" : "text-[#80909c]")} onClick={() => setView("grid")} type="button"><Grid2X2 className="size-4" /></button>
                <button aria-label="Visualização em lista" className={cn("flex size-8 items-center justify-center rounded-[5px]", view === "list" ? "bg-[#164b70] text-[#65b7f4]" : "text-[#80909c]")} onClick={() => setView("list")} type="button"><LayoutList className="size-4" /></button>
              </div>
            </div>
          </div>
        </Panel>

        {visibleMaterials.length ? (
          <div className={cn("mt-3 gap-2 sm:mt-4 sm:gap-3", view === "grid" ? "grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "flex flex-col")}>
            {visibleMaterials.map((material) => (
              <MaterialCard key={material.id} layout={view} material={material} onArchive={handleArchive} onEdit={setEditMaterial} onFavorite={handleFavorite} onShare={openShare} />
            ))}
          </div>
        ) : (
          <Panel className="mt-4 flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <FileText className="size-10 text-[#536b7d]" />
            <h2 className="mt-4 text-[17px] font-semibold">Nenhum material encontrado</h2>
            <p className="mt-2 max-w-md text-[12px] text-[#81919e]">Ajuste os filtros ou adicione o primeiro conteúdo à biblioteca.</p>
          </Panel>
        )}
      </div>

      <Sheet open={newOpen} onOpenChange={setNewOpen}>
        <SheetContent className="w-full overflow-y-auto border-[#2c4353] bg-[#0d1c27] p-0 text-white sm:max-w-[560px]">
          <SheetHeader className="border-b border-[#263a49] px-6 py-5 text-left">
            <SheetTitle className="text-[22px] text-white">Novo material</SheetTitle>
            <SheetDescription className="text-[#8fa0ad]">Adicione um arquivo ou vídeo à sua biblioteca.</SheetDescription>
          </SheetHeader>
          <form className="space-y-5 p-6" onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-2 rounded-[8px] border border-[#2b4050] bg-[#0a1620] p-1">
              <button className={cn("h-10 rounded-[6px] text-[13px]", newKind === "file" ? "bg-[#155f94] text-white" : "text-[#8fa0ad]")} onClick={() => setNewKind("file")} type="button">Arquivo</button>
              <button className={cn("h-10 rounded-[6px] text-[13px]", newKind === "video" ? "bg-[#155f94] text-white" : "text-[#8fa0ad]")} onClick={() => setNewKind("video")} type="button">Vídeo por link</button>
            </div>
            <Field label="Título"><input className={inputClass} name="title" placeholder="Ex.: Guia alimentar inicial" required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria"><CategorySelect /></Field>
              <Field label="Tipo">{newKind === "file" ? <div className="flex h-10 items-center rounded-[7px] border border-[#2b4050] bg-[#0a1620] px-3 text-[12px] text-[#8798a5]">Detectado pelo arquivo</div> : <div className="flex h-10 items-center rounded-[7px] border border-[#2b4050] bg-[#0a1620] px-3 text-[12px] text-[#8798a5]">YouTube ou Vimeo</div>}</Field>
            </div>
            {newKind === "file" ? (
              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#3c5a70] bg-[#0b1923] px-5 text-center hover:border-[#168ce4]">
                {file ? <><Check className="size-8 text-[#55d48d]" /><span className="mt-2 text-[13px] font-medium">{file.name}</span><span className="mt-1 text-[11px] text-[#8294a1]">{(file.size / 1024 / 1024).toFixed(2)} MB</span></> : <><UploadCloud className="size-9 text-[#68b8f1]" /><span className="mt-3 text-[13px] font-medium">Clique para selecionar</span><span className="mt-1 text-[11px] text-[#8294a1]">PDF, JPG, PNG, DOCX, XLSX ou PPTX · até 50 MB</span></>}
                <input accept={acceptedMaterialMimeTypes.join(",")} className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} type="file" />
              </label>
            ) : (
              <Field label="Link do vídeo"><input className={inputClass} name="externalUrl" placeholder="https://youtube.com/watch?v=..." required /></Field>
            )}
            <Field label="Descrição"><textarea className={cn(inputClass, "min-h-[96px] py-3")} maxLength={1000} name="description" placeholder="Descreva o conteúdo e como ele pode ajudar o Cliente." /></Field>
            <Field label="Tags"><input className={inputClass} name="tags" placeholder="nutrição, guia, alimentação" /></Field>
            <div className="flex justify-end gap-2 border-t border-[#263a49] pt-5">
              <button className="h-11 rounded-[7px] border border-[#344b5a] px-5 text-[13px] text-[#c1ccd4]" onClick={() => setNewOpen(false)} type="button">Cancelar</button>
              <button className="h-11 rounded-[7px] bg-[#168ce4] px-6 text-[13px] font-semibold disabled:opacity-50" disabled={uploading} type="submit">{uploading ? "Salvando..." : "Salvar material"}</button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(shareMaterial)} onOpenChange={(open) => !open && setShareMaterial(null)}>
        <SheetContent className="w-full overflow-y-auto border-[#2c4353] bg-[#0d1c27] p-0 text-white sm:max-w-[540px]">
          <SheetHeader className="border-b border-[#263a49] px-6 py-5 text-left">
            <SheetTitle className="text-[22px] text-white">Compartilhar material</SheetTitle>
            <SheetDescription className="text-[#8fa0ad]">Vincule este conteúdo aos Clientes selecionados.</SheetDescription>
          </SheetHeader>
          {shareMaterial ? (
            <form className="space-y-5 p-6" onSubmit={handleShare}>
              <Panel className="flex items-center gap-3 p-3">
                <div className={cn("flex size-12 items-center justify-center rounded-[7px]", categoryStyles[shareMaterial.category].bg, categoryStyles[shareMaterial.category].accent)}>
                  {(() => {
                    const ShareIcon = typeIcons[shareMaterial.fileType];
                    return <ShareIcon className="size-5" />;
                  })()}
                </div>
                <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{shareMaterial.title}</p><p className="mt-1 text-[11px] text-[#8495a2]">{shareMaterial.categoryLabel} · {shareMaterial.fileLabel}</p></div>
              </Panel>
              <Field label="Buscar Cliente"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#748795]" /><input className={cn(inputClass, "pl-9")} onChange={(event) => setShareSearch(event.target.value)} placeholder="Nome ou e-mail..." value={shareSearch} /></div></Field>
              <div className="max-h-[310px] space-y-1 overflow-y-auto rounded-[8px] border border-[#2b4050] p-2">
                {filteredClients.map((client) => {
                  const selected = selectedClients.includes(client.id);
                  return (
                    <button className="flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left hover:bg-[#142735]" key={client.id} onClick={() => setSelectedClients((current) => selected ? current.filter((id) => id !== client.id) : [...current, client.id])} type="button">
                      <span className={cn("flex size-5 items-center justify-center rounded-[4px] border", selected ? "border-[#168ce4] bg-[#168ce4]" : "border-[#486070]")}>{selected ? <Check className="size-3.5 text-white" /> : null}</span>
                      <span className="min-w-0"><span className="block truncate text-[13px] font-medium">{client.displayName}</span><span className="block truncate text-[11px] text-[#8495a2]">{client.email}</span></span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] text-[#7fa0b7]">{selectedClients.length} Cliente{selectedClients.length === 1 ? "" : "s"} selecionado{selectedClients.length === 1 ? "" : "s"}</p>
              <Field label="Mensagem opcional"><textarea className={cn(inputClass, "min-h-[90px] py-3")} maxLength={300} name="message" placeholder="Adicione uma orientação para acompanhar o material." /></Field>
              <div className="flex justify-end gap-2 border-t border-[#263a49] pt-5">
                <button className="h-11 rounded-[7px] border border-[#344b5a] px-5 text-[13px]" onClick={() => setShareMaterial(null)} type="button">Cancelar</button>
                <button className="flex h-11 items-center gap-2 rounded-[7px] bg-[#168ce4] px-6 text-[13px] font-semibold disabled:opacity-50" disabled={!selectedClients.length || isPending} type="submit"><Send className="size-4" /> Compartilhar</button>
              </div>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(editMaterial)} onOpenChange={(open) => !open && setEditMaterial(null)}>
        <SheetContent className="w-full border-[#2c4353] bg-[#0d1c27] p-0 text-white sm:max-w-[520px]">
          <SheetHeader className="border-b border-[#263a49] px-6 py-5 text-left"><SheetTitle className="text-[22px] text-white">Editar material</SheetTitle><SheetDescription className="text-[#8fa0ad]">Atualize os dados de organização da biblioteca.</SheetDescription></SheetHeader>
          {editMaterial ? <form className="space-y-5 p-6" onSubmit={handleEdit}><Field label="Título"><input className={inputClass} defaultValue={editMaterial.title} name="title" required /></Field><Field label="Categoria"><CategorySelect defaultValue={editMaterial.category} /></Field><Field label="Descrição"><textarea className={cn(inputClass, "min-h-[110px] py-3")} defaultValue={editMaterial.description ?? ""} name="description" /></Field><Field label="Tags"><input className={inputClass} defaultValue={editMaterial.tags.join(", ")} name="tags" /></Field><div className="flex justify-end gap-2 border-t border-[#263a49] pt-5"><button className="h-11 rounded-[7px] border border-[#344b5a] px-5 text-[13px]" onClick={() => setEditMaterial(null)} type="button">Cancelar</button><button className="h-11 rounded-[7px] bg-[#168ce4] px-6 text-[13px] font-semibold" type="submit">Salvar alterações</button></div></form> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const inputClass = "h-10 w-full rounded-[7px] border border-[#2b4050] bg-[#0a1620] px-3 text-[12px] text-white outline-none placeholder:text-[#637684] focus:border-[#168ce4]";

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="block"><span className="mb-2 block text-[12px] font-medium text-[#c8d2da]">{label}</span>{children}</label>;
}

function CategorySelect({ defaultValue = "outros" }: { defaultValue?: PartnerMaterialCategory }) {
  return (
    <div className="relative">
      <select className={cn(inputClass, "appearance-none pr-9")} defaultValue={defaultValue} name="category">
        {categories.filter((item) => item !== "all").map((item) => <option key={item} value={item}>{materialCategoryLabels[item]}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8394a1]" />
    </div>
  );
}
