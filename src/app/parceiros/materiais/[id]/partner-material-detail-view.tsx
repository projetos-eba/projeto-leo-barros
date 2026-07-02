"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarDays,
  Check,
  Download,
  ExternalLink,
  FileText,
  History,
  Pencil,
  Search,
  Send,
  Star,
  Tag,
  Users,
  X,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  materialCategoryLabels,
  type PartnerMaterial,
  type PartnerMaterialCategory,
  type PartnerMaterialClient,
  type PartnerMaterialEvent,
} from "@/lib/partners/materials-metrics";
import { cn } from "@/lib/utils";

import {
  revokePartnerMaterialShare,
  setPartnerMaterialArchived,
  setPartnerMaterialFavorite,
  sharePartnerMaterial,
  updatePartnerMaterial,
} from "../actions";

type PartnerMaterialDetailViewProps = {
  clients: PartnerMaterialClient[];
  events: PartnerMaterialEvent[];
  material: PartnerMaterial;
};

const categoryOptions = Object.entries(materialCategoryLabels) as Array<[PartnerMaterialCategory, string]>;
const inputClass = "h-10 w-full rounded-[7px] border border-[#2b4050] bg-[#0a1620] px-3 text-[12px] text-white outline-none placeholder:text-[#637684] focus:border-[#168ce4]";

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[8px] border border-[#2a3d4c] bg-[#101b25]/82", className)}>{children}</section>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="block"><span className="mb-2 block text-[12px] font-medium text-[#c8d2da]">{label}</span>{children}</label>;
}

function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("pt-BR", withTime
    ? { dateStyle: "short", timeStyle: "short" }
    : { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function eventLabel(event: PartnerMaterialEvent) {
  const labels: Record<string, string> = {
    accessed: "Arquivo acessado",
    archived: "Material arquivado",
    created: "Material criado",
    favorited: "Adicionado aos favoritos",
    restored: "Material restaurado",
    revoked: "Compartilhamento revogado",
    shared: "Compartilhado",
    unfavorited: "Removido dos favoritos",
    updated: "Dados atualizados",
  };
  const base = labels[event.type] ?? "Atividade registrada";
  return event.clientName ? `${base} com ${event.clientName}` : base;
}

export function PartnerMaterialDetailView({ clients, events, material }: PartnerMaterialDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>(
    material.shares.filter((share) => share.status === "linked").map((share) => share.client.id),
  );
  const [clientSearch, setClientSearch] = useState("");

  const activeShares = material.shares.filter((share) => share.status === "linked");
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLocaleLowerCase("pt-BR");
    return clients.filter((client) => !query || `${client.displayName} ${client.email}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [clientSearch, clients]);

  function runAction(action: () => Promise<{ error?: string; message?: string; ok: boolean }>, close?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível concluir a ação.");
        return;
      }
      toast.success(result.message ?? "Alteração salva.");
      close?.();
      router.refresh();
    });
  }

  function handleShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    runAction(() => sharePartnerMaterial({
      materialId: material.id,
      message: String(form.get("message") ?? "").trim() || null,
      patientIds: selectedClients,
    }), () => setShareOpen(false));
  }

  function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    runAction(() => updatePartnerMaterial({
      category: String(form.get("category")) as PartnerMaterialCategory,
      description: String(form.get("description") ?? "").trim() || null,
      materialId: material.id,
      tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
      title: String(form.get("title") ?? ""),
    }), () => setEditOpen(false));
  }

  return (
    <div className="min-h-screen bg-[#0b1720] px-4 py-7 text-[#edf4f8] md:px-7 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 text-[13px]">
            <Link aria-label="Voltar para Materiais" className="flex size-9 shrink-0 items-center justify-center rounded-[7px] border border-[#2c4251] text-[#9fb0bd] hover:text-white" href="/parceiros/materiais"><ArrowLeft className="size-4" /></Link>
            <Link className="text-[#8fa0ad] hover:text-white" href="/parceiros/materiais">Materiais</Link>
            <span className="text-[#536b7d]">/</span>
            <span className="max-w-[420px] truncate font-semibold text-white">{material.title}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex h-10 items-center gap-2 rounded-[7px] border border-[#2d4657] px-4 text-[12px] text-[#c5d0d8] hover:border-[#168ce4]" onClick={() => setShareOpen(true)} type="button"><Send className="size-4" /> Compartilhar</button>
            <button className="flex h-10 items-center gap-2 rounded-[7px] border border-[#2d4657] px-4 text-[12px] text-[#c5d0d8] hover:border-[#168ce4]" onClick={() => setEditOpen(true)} type="button"><Pencil className="size-4" /> Editar</button>
            <button aria-label={material.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="flex size-10 items-center justify-center rounded-[7px] border border-[#2d4657] text-[#c5d0d8]" onClick={() => runAction(() => setPartnerMaterialFavorite({ materialId: material.id, value: !material.isFavorite }))} type="button"><Star className={cn("size-4", material.isFavorite && "fill-[#f5c542] text-[#f5c542]")} /></button>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_minmax(380px,0.88fr)]">
          <Panel className="min-h-[650px] overflow-hidden p-3">
            <div className="flex min-h-11 items-center justify-between border-b border-[#293d4b] px-2 pb-3 text-[12px] text-[#8fa0ad]">
              <span className="rounded-[5px] border border-[#3a4c59] px-2 py-1 font-semibold text-[#dce5eb]">{material.fileLabel}</span>
              {material.kind === "file" ? <a className="flex items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-[#172b38] hover:text-white" href={`/parceiros/materiais/${material.id}/arquivo?download=1`}><Download className="size-4" /> Baixar</a> : <a className="flex items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-[#172b38] hover:text-white" href={material.externalUrl ?? "#"} rel="noreferrer" target="_blank"><ExternalLink className="size-4" /> Abrir origem</a>}
            </div>
            <div className="mt-3 min-h-[570px] overflow-hidden rounded-[6px] bg-[#07131b]">
              {material.fileType === "pdf" ? (
                <iframe className="h-[70vh] min-h-[570px] w-full bg-white" src={`/parceiros/materiais/${material.id}/arquivo`} title={`Visualização de ${material.title}`} />
              ) : material.fileType === "image" ? (
                <div className="flex min-h-[570px] items-center justify-center p-4"><img alt={material.title} className="max-h-[68vh] max-w-full object-contain" src={`/parceiros/materiais/${material.id}/arquivo`} /></div>
              ) : material.fileType === "video" && material.embedUrl ? (
                <iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full" src={material.embedUrl} title={material.title} />
              ) : (
                <div className="flex min-h-[570px] flex-col items-center justify-center px-6 text-center"><FileText className="size-16 text-[#547185]" /><h2 className="mt-5 text-lg font-semibold">{material.originalFilename}</h2><p className="mt-2 max-w-md text-sm text-[#8193a0]">Este formato deve ser aberto no aplicativo correspondente.</p><a className="mt-6 flex h-11 items-center gap-2 rounded-[7px] bg-[#168ce4] px-5 text-sm font-semibold" href={`/parceiros/materiais/${material.id}/arquivo?download=1`}><Download className="size-4" /> Baixar arquivo</a></div>
              )}
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[11px] font-semibold text-[#53b6ff]">{material.categoryLabel}</p><h1 className="mt-2 text-[23px] font-bold leading-7">{material.title}</h1></div>
                <span className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold", material.status === "active" ? "border-[#245f3c] bg-[#102d20] text-[#60d98c]" : "border-[#5b4d2e] bg-[#2b261b] text-[#d9bc70]")}>{material.status === "active" ? "Ativo" : "Arquivado"}</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-y border-[#293c4a] py-4 text-[12px]">
                <Meta icon={<FileText className="size-4" />} label="Tipo" value={material.fileLabel} />
                <Meta icon={<Download className="size-4" />} label="Tamanho" value={material.sizeLabel} />
                <Meta icon={<CalendarDays className="size-4" />} label="Atualização" value={formatDate(material.updatedAt)} />
                <Meta icon={<Users className="size-4" />} label="Compartilhado" value={`${material.shareCount} Cliente${material.shareCount === 1 ? "" : "s"}`} />
              </div>
              {material.tags.length ? <div className="mt-4 flex flex-wrap gap-2">{material.tags.map((tag) => <span className="rounded-[6px] border border-[#304654] bg-[#122431] px-2.5 py-1 text-[10px] text-[#aebbc5]" key={tag}>{tag}</span>)}</div> : null}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {material.kind === "file" ? <a className="flex h-11 items-center justify-center gap-2 rounded-[7px] bg-[#168ce4] text-[12px] font-semibold" href={`/parceiros/materiais/${material.id}/arquivo?download=1`}><Download className="size-4" /> Acessar arquivo</a> : <a className="flex h-11 items-center justify-center gap-2 rounded-[7px] bg-[#168ce4] text-[12px] font-semibold" href={material.externalUrl ?? "#"} rel="noreferrer" target="_blank"><ExternalLink className="size-4" /> Abrir vídeo</a>}
                <button className="flex h-11 items-center justify-center gap-2 rounded-[7px] border border-[#2d4657] text-[12px]" onClick={() => runAction(() => setPartnerMaterialArchived({ materialId: material.id, value: material.status !== "archived" }))} type="button">{material.status === "archived" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}{material.status === "archived" ? "Restaurar" : "Arquivar"}</button>
              </div>
            </Panel>

            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold">Descrição</h2>
              <p className="mt-3 text-[12px] leading-5 text-[#91a0ac]">{material.description ?? "Nenhuma descrição adicionada."}</p>
            </Panel>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel className="p-5">
                <div className="flex items-center justify-between"><h2 className="text-[15px] font-semibold">Clientes vinculados</h2><button className="text-[11px] font-medium text-[#50b4ff]" onClick={() => setShareOpen(true)} type="button">Adicionar</button></div>
                <div className="mt-4 space-y-2">
                  {activeShares.length ? activeShares.slice(0, 5).map((share) => (
                    <div className="flex items-center gap-3 border-b border-[#263946] pb-2.5" key={share.id}>
                      <div className="flex size-8 items-center justify-center rounded-full bg-[#174568] text-[11px] font-bold">{share.client.displayName.slice(0, 1)}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium">{share.client.displayName}</p><p className="mt-0.5 text-[10px] text-[#7f919f]">{formatDate(share.sharedAt)}</p></div>
                      <button aria-label={`Revogar acesso de ${share.client.displayName}`} className="flex size-8 items-center justify-center rounded-[6px] text-[#9cacb8] hover:bg-[#342029] hover:text-[#ff7585]" onClick={() => runAction(() => revokePartnerMaterialShare({ materialId: material.id, patientId: share.client.id }))} type="button"><X className="size-4" /></button>
                    </div>
                  )) : <p className="py-4 text-center text-[11px] text-[#7e909d]">Ainda não compartilhado.</p>}
                </div>
              </Panel>

              <Panel className="p-5">
                <div className="flex items-center gap-2"><History className="size-4 text-[#56b5fa]" /><h2 className="text-[15px] font-semibold">Histórico</h2></div>
                <div className="mt-4 space-y-3">
                  {events.slice(0, 6).map((event) => <div className="border-b border-[#263946] pb-2.5" key={event.id}><p className="text-[11px] text-[#c4ced6]">{eventLabel(event)}</p><p className="mt-1 text-[10px] text-[#748794]">{formatDate(event.occurredAt, true)}</p></div>)}
                  {!events.length ? <p className="py-4 text-center text-[11px] text-[#7e909d]">Sem atividades registradas.</p> : null}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent className="w-full overflow-y-auto border-[#2c4353] bg-[#0d1c27] p-0 text-white sm:max-w-[540px]">
          <SheetHeader className="border-b border-[#263a49] px-6 py-5 text-left"><SheetTitle className="text-[22px] text-white">Compartilhar material</SheetTitle><SheetDescription className="text-[#8fa0ad]">Selecione os Clientes que terão este conteúdo vinculado.</SheetDescription></SheetHeader>
          <form className="space-y-5 p-6" onSubmit={handleShare}>
            <Field label="Buscar Cliente"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#748795]" /><input className={cn(inputClass, "pl-9")} onChange={(event) => setClientSearch(event.target.value)} placeholder="Nome ou e-mail..." value={clientSearch} /></div></Field>
            <div className="max-h-[350px] space-y-1 overflow-y-auto rounded-[8px] border border-[#2b4050] p-2">
              {filteredClients.map((client) => {
                const selected = selectedClients.includes(client.id);
                return <button className="flex w-full items-center gap-3 rounded-[7px] px-3 py-2.5 text-left hover:bg-[#142735]" key={client.id} onClick={() => setSelectedClients((current) => selected ? current.filter((id) => id !== client.id) : [...current, client.id])} type="button"><span className={cn("flex size-5 items-center justify-center rounded-[4px] border", selected ? "border-[#168ce4] bg-[#168ce4]" : "border-[#486070]")}>{selected ? <Check className="size-3.5" /> : null}</span><span className="min-w-0"><span className="block truncate text-[13px] font-medium">{client.displayName}</span><span className="block truncate text-[11px] text-[#8495a2]">{client.email}</span></span></button>;
              })}
            </div>
            <Field label="Mensagem opcional"><textarea className={cn(inputClass, "min-h-[90px] py-3")} maxLength={300} name="message" /></Field>
            <div className="flex justify-end gap-2 border-t border-[#263a49] pt-5"><button className="h-11 rounded-[7px] border border-[#344b5a] px-5 text-[13px]" onClick={() => setShareOpen(false)} type="button">Cancelar</button><button className="flex h-11 items-center gap-2 rounded-[7px] bg-[#168ce4] px-6 text-[13px] font-semibold disabled:opacity-50" disabled={!selectedClients.length || isPending} type="submit"><Send className="size-4" /> Compartilhar</button></div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full border-[#2c4353] bg-[#0d1c27] p-0 text-white sm:max-w-[520px]">
          <SheetHeader className="border-b border-[#263a49] px-6 py-5 text-left"><SheetTitle className="text-[22px] text-white">Editar material</SheetTitle><SheetDescription className="text-[#8fa0ad]">Atualize título, categoria, descrição e tags.</SheetDescription></SheetHeader>
          <form className="space-y-5 p-6" onSubmit={handleEdit}>
            <Field label="Título"><input className={inputClass} defaultValue={material.title} name="title" required /></Field>
            <Field label="Categoria"><select className={inputClass} defaultValue={material.category} name="category">{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
            <Field label="Descrição"><textarea className={cn(inputClass, "min-h-[120px] py-3")} defaultValue={material.description ?? ""} name="description" /></Field>
            <Field label="Tags"><div className="relative"><Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#748795]" /><input className={cn(inputClass, "pl-9")} defaultValue={material.tags.join(", ")} name="tags" /></div></Field>
            <div className="flex justify-end gap-2 border-t border-[#263a49] pt-5"><button className="h-11 rounded-[7px] border border-[#344b5a] px-5 text-[13px]" onClick={() => setEditOpen(false)} type="button">Cancelar</button><button className="h-11 rounded-[7px] bg-[#168ce4] px-6 text-[13px] font-semibold" type="submit">Salvar alterações</button></div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-2"><span className="mt-0.5 text-[#638298]">{icon}</span><span><span className="block text-[10px] uppercase text-[#708391]">{label}</span><span className="mt-1 block text-[#d4dde4]">{value}</span></span></div>;
}
