"use client";

import {
  ArrowLeftRight,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  ImagePlus,
  Info,
  Maximize2,
  MoreVertical,
  Save,
  Trash2,
  UploadCloud,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import {
  buildAngleAvailability,
  buildPhotoDeltas,
  formatPhotoNumber,
  intervalDays,
  photoAngles,
  type PartnerClientPhotoSession,
  type PartnerClientPhotosData,
  type PhotoAngle,
} from "@/lib/partners/client-photos-metrics";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import {
  removeClientPhotoSession,
  saveClientPhotoComparisonNote,
  saveClientPhotoSession,
} from "./actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type PartnerClientPhotosViewProps = {
  overview: PartnerClientOverviewData;
  photos: PartnerClientPhotosData;
};

type FileDraft = Record<PhotoAngle, File | null>;

const panelClass = "min-w-0 rounded-[8px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]";
const inputClass = "h-10 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none transition focus:border-[#3b97e3]";
const textareaClass = "min-h-[108px] rounded-[8px] border border-[#303746] bg-[#081520] px-3 py-2 text-[13px] text-white outline-none transition placeholder:text-[#667684] focus:border-[#3b97e3]";

function todayDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toIsoFromInput(value: string) {
  return new Date(value).toISOString();
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "foto.png";
}

function angleFileName(angle: PhotoAngle, file: File) {
  return `${angle}-${safeFilename(file.name)}`;
}

function actionMessage(result: { error?: string; message?: string; ok: boolean }) {
  return result.ok ? result.message ?? "Atualizado." : result.error ?? "Não foi possível concluir a ação.";
}

function ActionButton({ children, disabled, onClick, tone = "ghost", type = "button" }: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "danger" | "ghost" | "primary";
  type?: "button" | "submit";
}) {
  const tones = {
    danger: "border-[#71313a] bg-[#2b1218] text-[#ff8d98] hover:border-[#ef626c]",
    ghost: "border-[#303746] bg-[#101923] text-[#d8e5ee] hover:border-[#3b97e3]",
    primary: "border-[#3b97e3] bg-[#2d9cff] text-white hover:bg-[#55a8eb]",
  };
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", tones[tone])}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
      {label}
      {children}
    </label>
  );
}

function PhotoFrame({ label, photo, session, zoom }: {
  label: "Antes" | "Depois";
  photo: PartnerClientPhotoSession["photos"][number] | null;
  session: PartnerClientPhotoSession | null;
  zoom: number;
}) {
  return (
    <section className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-[#303746] bg-[#111923]">
      <div className="absolute left-4 top-4 z-10">
        <span className={cn("rounded-[6px] px-3 py-1 text-[13px] font-bold", label === "Antes" ? "bg-[#083f75] text-[#62baff]" : "bg-[#164c25] text-[#68df88]")}>
          {label}
        </span>
        <p className="mt-2 text-[14px] font-semibold text-white">{session?.capturedDateLabel ?? "--/--/----"}</p>
      </div>
      {photo ? (
        <img
          alt={`${label} - ${photo.angleLabel}`}
          className="h-full min-h-[420px] w-full object-contain transition-transform"
          src={photo.imageUrl}
          style={{ transform: `scale(${zoom / 100})` }}
        />
      ) : (
        <div className="flex h-full min-h-[420px] items-center justify-center text-[13px] text-[#8b92a3]">Ângulo indisponível</div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_24%,rgba(255,255,255,0.25)_24%,rgba(255,255,255,0.25)_24.4%,transparent_24.4%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_50.4%,transparent_50.4%,transparent_76%,rgba(255,255,255,0.18)_76%,rgba(255,255,255,0.18)_76.4%,transparent_76.4%)]" />
    </section>
  );
}

function Dropzone({ angle, file, onChange }: {
  angle: { label: string; value: PhotoAngle };
  file: File | null;
  onChange: (angle: PhotoAngle, file: File | null) => void;
}) {
  return (
    <label className="grid gap-3">
      <span className="text-[15px] font-bold text-white">{angle.label}</span>
      <span className={cn(
        "flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed px-4 text-center transition",
        file ? "border-[#2d9cff] bg-[#09233a]" : "border-[#56606d] bg-[#0a141e] hover:border-[#2d9cff]",
      )}>
        <UploadCloud className="size-8 text-[#8b92a3]" />
        <span className="mt-4 text-[14px] font-semibold text-white">{file ? file.name : "Arraste ou clique"}</span>
        <span className="mt-1 text-[13px] text-[#8b92a3]">{file ? `${Math.round(file.size / 1024)} KB` : "para adicionar"}</span>
      </span>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        type="file"
        onChange={(event) => onChange(angle.value, event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function TimelineRow({ active, onCompare, onRemove, onView, session }: {
  active: boolean;
  onCompare: () => void;
  onRemove: () => void;
  onView: () => void;
  session: PartnerClientPhotoSession;
}) {
  return (
    <article className={cn("grid gap-4 rounded-[10px] border p-4 md:grid-cols-[220px_minmax(0,1fr)_170px] md:items-center", active ? "border-[#2d9cff] bg-[#071c30]" : "border-[#25313d] bg-[#08131d]")}>
      <div className="flex items-center gap-4">
        <span className={cn("size-7 rounded-full border-2", active ? "border-[#2d9cff] bg-[#2d9cff]" : "border-[#748190]")} />
        <div>
          <p className="text-[18px] font-bold text-white">{session.capturedDateLabel}</p>
          <p className="text-[13px] text-[#8b92a3]">{session.title} · {session.capturedTimeLabel}</p>
          <span className="mt-2 inline-flex rounded-full bg-[#10341e] px-2.5 py-1 text-[11px] font-bold text-[#65d77d]">{session.completed ? "Completa" : "Rascunho"}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {photoAngles.map((angle) => {
          const photo = session.photosByAngle[angle.value];
          return (
            <div className="min-w-0" key={angle.value}>
              {photo ? (
                <img alt={angle.label} className="h-24 w-full rounded-[8px] border border-[#303746] object-cover" src={photo.imageUrl} />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-[8px] border border-[#303746] text-[11px] text-[#8b92a3]">--</div>
              )}
              <p className="mt-1 truncate text-center text-[12px] text-[#c8d1dc]">{angle.label}</p>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <ActionButton onClick={onView}><Eye className="size-4" />Ver</ActionButton>
        <ActionButton onClick={onCompare}><ArrowLeftRight className="size-4" />Comparar</ActionButton>
        <button
          aria-label={`Remover sessão ${session.capturedDateLabel}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#71313a] bg-[#2b1218] px-4 text-[13px] font-semibold text-[#ff8d98] transition hover:border-[#ef626c]"
          type="button"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
        <button className="flex size-10 items-center justify-center rounded-[8px] border border-[#303746] text-[#8b92a3]" type="button"><MoreVertical className="size-4" /></button>
      </div>
    </article>
  );
}

export function PartnerClientPhotosView({ overview, photos }: PartnerClientPhotosViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState(todayDateTimeValue());
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileDraft>({ back: null, front: null, left: null, right: null });
  const [selectedSessionId, setSelectedSessionId] = useState(photos.sessions[0]?.id ?? "");
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [beforeId, setBeforeId] = useState(photos.comparison.before?.id ?? photos.sessions[1]?.id ?? photos.sessions[0]?.id ?? "");
  const [afterId, setAfterId] = useState(photos.comparison.after?.id ?? photos.sessions[0]?.id ?? "");
  const [activeAngle, setActiveAngle] = useState<PhotoAngle>("front");
  const [zoom, setZoom] = useState(100);
  const [noteDraft, setNoteDraft] = useState(photos.comparison.note?.notes ?? "");

  const before = photos.sessions.find((session) => session.id === beforeId) ?? null;
  const after = photos.sessions.find((session) => session.id === afterId) ?? null;
  const selectedSession = photos.sessions.find((session) => session.id === selectedSessionId) ?? photos.sessions[0] ?? null;
  const comparison = useMemo(() => ({
    angleAvailability: buildAngleAvailability(before, after),
    deltas: buildPhotoDeltas(before?.measurements ?? null, after?.measurements ?? null),
    intervalDays: before && after ? intervalDays(before.capturedAt, after.capturedAt) : null,
  }), [after, before]);

  function handleFileChange(angle: PhotoAngle, file: File | null) {
    setFiles((current) => ({ ...current, [angle]: file }));
  }

  function viewSession(session: PartnerClientPhotoSession) {
    setSelectedSessionId(session.id);
    setComparisonOpen(false);
  }

  function compareFromSession(session: PartnerClientPhotoSession) {
    const olderSession = photos.sessions.find((item) => item.id !== session.id && new Date(item.capturedAt) < new Date(session.capturedAt))
      ?? photos.sessions.find((item) => item.id !== session.id)
      ?? null;
    setSelectedSessionId(session.id);
    setAfterId(session.id);
    if (olderSession) setBeforeId(olderSession.id);
    setComparisonOpen(true);
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const selected = photoAngles.flatMap((angle) => {
      const file = files[angle.value];
      return file ? [{ angle: angle.value, file }] : [];
    });
    if (selected.length === 0) {
      setMessage("Selecione pelo menos uma foto.");
      return;
    }

    const sessionId = crypto.randomUUID();
    const supabase = createClient();
    const uploaded: string[] = [];
    try {
      const payload: Array<{
        angle: PhotoAngle;
        heightPx: number | null;
        mimeType: "image/jpeg" | "image/png" | "image/webp";
        originalFilename: string;
        sizeBytes: number;
        storagePath: string;
        widthPx: number | null;
      }> = [];
      for (const item of selected) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(item.file.type)) throw new Error("Formato de imagem não suportado.");
        if (item.file.size > 15 * 1024 * 1024) throw new Error("Cada foto deve ter no máximo 15 MB.");
        const storagePath = `${photos.partnerId}/${overview.client.id}/${sessionId}/${angleFileName(item.angle, item.file)}`;
        const upload = await supabase.storage.from("partner-client-photos").upload(storagePath, item.file, {
          cacheControl: "3600",
          contentType: item.file.type,
          upsert: false,
        });
        if (upload.error) throw new Error("Falha ao enviar uma das fotos.");
        uploaded.push(storagePath);
        payload.push({
          angle: item.angle,
          heightPx: null,
          mimeType: item.file.type as "image/jpeg" | "image/png" | "image/webp",
          originalFilename: item.file.name,
          sizeBytes: item.file.size,
          storagePath,
          widthPx: null,
        });
      }

      const result = await saveClientPhotoSession({
        capturedAt: toIsoFromInput(capturedAt),
        notes: notes.trim() || null,
        patientId: overview.client.id,
        photos: payload,
        sessionId,
        title: `${photos.summary.sessionCount + 1}ª sessão`,
      });
      if (!result.ok) throw new Error(result.error ?? "Não foi possível salvar a sessão.");
      setMessage(actionMessage(result));
      setFiles({ back: null, front: null, left: null, right: null });
      setNotes("");
      router.refresh();
    } catch (error) {
      if (uploaded.length) await supabase.storage.from("partner-client-photos").remove(uploaded);
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a sessão.");
    }
  }

  function runAction(action: () => Promise<{ error?: string; message?: string; ok: boolean }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(actionMessage(result));
      if (result.ok) router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-[#07131c] pb-12 text-white">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <PartnerClientProfileHeader activeTab="fotos" overview={overview} />

      <div className="client-overview-print-panel mt-8 grid gap-6 pb-12">
        {message ? <p className="rounded-[8px] border border-[#303746] bg-[#101923] px-4 py-3 text-[13px] text-[#d8e5ee]">{message}</p> : null}

        <section className={cn(panelClass, "p-5")}>
          <div className="mb-5">
            <h2 className="text-[20px] font-bold text-white">Linha do tempo</h2>
            <p className="mt-1 text-[14px] text-[#9aa5b6]">Histórico de todas as sessões de fotos registradas.</p>
          </div>
          <div className="grid gap-3">
            {photos.sessions.length ? photos.sessions.map((session) => (
              <TimelineRow
                active={session.id === selectedSessionId}
                key={session.id}
                session={session}
                onCompare={() => compareFromSession(session)}
                onRemove={() => runAction(() => removeClientPhotoSession({ patientId: overview.client.id, sessionId: session.id }))}
                onView={() => viewSession(session)}
              />
            )) : (
              <div className="flex min-h-40 flex-col items-center justify-center rounded-[8px] border border-dashed border-[#303746] text-center">
                <ImagePlus className="size-8 text-[#8b92a3]" />
                <p className="mt-3 text-[14px] font-semibold text-white">Nenhuma sessão salva.</p>
                <p className="mt-1 text-[12px] text-[#8b92a3]">Adicione fotos para iniciar a comparação de evolução.</p>
              </div>
            )}
          </div>
        </section>

        {selectedSession ? (
          <section className={cn(panelClass, "p-5")}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-white">Fotos da sessão</h2>
                <p className="mt-1 text-[14px] text-[#9aa5b6]">{selectedSession.title} · {selectedSession.capturedDateLabel} às {selectedSession.capturedTimeLabel}</p>
              </div>
              <ActionButton onClick={() => compareFromSession(selectedSession)}><ArrowLeftRight className="size-4" />Comparar evolução</ActionButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {photoAngles.map((angle) => {
                const photo = selectedSession.photosByAngle[angle.value] ?? null;
                return (
                  <section className="rounded-[8px] border border-[#303746] bg-[#08131d] p-3" key={angle.value}>
                    <p className="mb-3 text-[13px] font-semibold text-white">{angle.label}</p>
                    {photo ? (
                      <img alt={angle.label} className="h-[280px] w-full rounded-[8px] border border-[#303746] object-contain" src={photo.imageUrl} />
                    ) : (
                      <div className="flex h-[280px] items-center justify-center rounded-[8px] border border-dashed border-[#303746] text-[12px] text-[#8b92a3]">Ângulo indisponível</div>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className={cn(panelClass, "p-5")}>
          <form className="grid gap-6" onSubmit={handleCreateSession}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-[12px] bg-[#07345a] text-[#2d9cff]"><Camera className="size-5" /></span>
                <div>
                  <h2 className="text-[20px] font-bold text-white">Nova sessão de fotos</h2>
                  <p className="mt-1 text-[14px] text-[#9aa5b6]">Registre o progresso do Cliente com fotos padronizadas.</p>
                </div>
              </div>
              <Field label="Data da avaliação">
                <input className={inputClass} type="datetime-local" value={capturedAt} onChange={(event) => setCapturedAt(event.target.value)} />
              </Field>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {photoAngles.map((angle) => <Dropzone angle={angle} file={files[angle.value]} key={angle.value} onChange={handleFileChange} />)}
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <Field label="Observações da sessão">
                <textarea className={textareaClass} maxLength={700} placeholder="Observações internas da sessão..." value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Field>
              <ActionButton disabled={isPending} tone="primary" type="submit"><Save className="size-4" />Salvar sessão</ActionButton>
            </div>
            <p className="flex items-center gap-2 text-[12px] text-[#8b92a3]"><Info className="size-4" />Fotos em boa iluminação, roupas justas e mesma distância da câmera.</p>
          </form>
        </section>

        {comparisonOpen ? (
        <section className={cn(panelClass, "p-5")}>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#303746] pb-5">
                <div>
                  <h2 className="text-[20px] font-bold text-white">Comparação de evolução</h2>
                  <p className="mt-1 text-[13px] text-[#9aa5b6]">Compare o progresso entre duas sessões de fotos.</p>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Sessão A (Antes)">
                    <select className={inputClass} value={beforeId} onChange={(event) => setBeforeId(event.target.value)}>
                      {photos.sessions.map((session) => <option key={session.id} value={session.id}>{session.capturedDateLabel}</option>)}
                    </select>
                  </Field>
                  <Field label="Sessão B (Depois)">
                    <select className={inputClass} value={afterId} onChange={(event) => setAfterId(event.target.value)}>
                      {photos.sessions.map((session) => <option key={session.id} value={session.id}>{session.capturedDateLabel}</option>)}
                    </select>
                  </Field>
                  <ActionButton onClick={() => { setBeforeId(afterId); setAfterId(beforeId); }}><ArrowLeftRight className="size-4" />Trocar ordem</ActionButton>
                  <a className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-[#3b97e3] bg-[#2d9cff] px-4 text-[13px] font-semibold text-white" href={`/parceiros/clientes/${overview.client.id}/fotos/exportar`}>
                    <Download className="size-4" />Exportar comparação
                  </a>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto rounded-[8px] border border-[#303746] bg-[#08131d] p-2">
                {photoAngles.map((angle) => (
                  <button
                    className={cn("h-9 min-w-[140px] rounded-[7px] px-4 text-[13px] font-semibold transition", activeAngle === angle.value ? "bg-[#2d9cff] text-white" : "text-[#b7c3cf] hover:bg-[#101923]")}
                    key={angle.value}
                    type="button"
                    onClick={() => setActiveAngle(angle.value)}
                  >
                    {angle.label}
                  </button>
                ))}
              </div>

              <div className="relative mt-4 grid gap-1 lg:grid-cols-2">
                <PhotoFrame label="Antes" photo={before?.photosByAngle[activeAngle] ?? null} session={before} zoom={zoom} />
                <PhotoFrame label="Depois" photo={after?.photosByAngle[activeAngle] ?? null} session={after} zoom={zoom} />
                <span className="absolute left-1/2 top-1/2 hidden size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#303746] bg-[#07121c] text-white lg:flex"><ArrowLeftRight className="size-5" /></span>
                <div className="absolute bottom-4 left-4 flex overflow-hidden rounded-[8px] border border-[#303746] bg-[#101923]">
                  <button className="flex size-10 items-center justify-center text-[#c8d1dc]" type="button" onClick={() => setZoom((value) => Math.max(80, value - 10))}><ZoomOut className="size-4" /></button>
                  <span className="flex h-10 min-w-16 items-center justify-center text-[13px] font-semibold text-white">{zoom}%</span>
                  <button className="flex size-10 items-center justify-center text-[#c8d1dc]" type="button" onClick={() => setZoom((value) => Math.min(150, value + 10))}><ZoomIn className="size-4" /></button>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="flex size-10 items-center justify-center rounded-[8px] border border-[#303746] bg-[#101923] text-white" type="button" onClick={() => window.open(after?.photosByAngle[activeAngle]?.imageUrl ?? before?.photosByAngle[activeAngle]?.imageUrl, "_blank")}><Maximize2 className="size-4" /></button>
                  <button className="flex size-10 items-center justify-center rounded-[8px] border border-[#303746] bg-[#101923] text-white" type="button"><Camera className="size-4" /></button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {[before, after].map((session, index) => (
                  <section className="rounded-[8px] border border-[#303746] bg-[#08131d] p-3" key={session?.id ?? index}>
                    <p className="mb-3 text-[13px] font-semibold text-white">Sessão {index === 0 ? "A" : "B"} - {session?.capturedDateLabel ?? "--/--/----"}</p>
                    <div className="grid grid-cols-4 gap-3">
                      {photoAngles.map((angle) => {
                        const photo = session?.photosByAngle[angle.value] ?? null;
                        return (
                          <button className="text-left" key={angle.value} type="button" onClick={() => setActiveAngle(angle.value)}>
                            {photo ? <img alt={angle.label} className={cn("h-24 w-full rounded-[8px] border object-cover", activeAngle === angle.value ? "border-[#2d9cff]" : "border-[#303746]")} src={photo.imageUrl} /> : <span className="flex h-24 items-center justify-center rounded-[8px] border border-[#303746] text-[11px] text-[#8b92a3]">--</span>}
                            <span className="mt-1 block truncate text-center text-[12px] text-white">{angle.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <aside className="grid gap-4 content-start">
              <section className={cn(panelClass, "p-4")}>
                <h3 className="text-[16px] font-bold text-white">Resumo comparativo</h3>
                <div className="mt-4 flex items-center justify-between gap-4 text-[13px] text-[#9aa5b6]">
                  <span>Intervalo entre sessões</span>
                  <strong className="text-[22px] text-white">{comparison.intervalDays ?? "--"} dias</strong>
                </div>
                <div className="mt-4 grid overflow-hidden rounded-[8px] border border-[#25313d]">
                  {comparison.deltas.map((delta) => (
                    <div className="grid grid-cols-[86px_1fr_auto] items-center gap-2 border-b border-[#25313d] px-3 py-3 last:border-b-0" key={delta.key}>
                      <span className="text-[13px] font-semibold text-white">{delta.label}</span>
                      <span className="text-right text-[12px] text-[#9aa5b6]">{formatPhotoNumber(delta.beforeValue, delta.unit)} → {formatPhotoNumber(delta.afterValue, delta.unit)}</span>
                      <span className={cn("text-[12px] font-bold", delta.improved ? "text-[#58d881]" : "text-[#ff7b88]")}>{delta.delta === null ? "--" : `${delta.delta > 0 ? "+" : ""}${delta.delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${delta.unit}`}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-[#8b92a3]">* Medidas derivadas das avaliações físicas mais próximas de cada sessão.</p>
              </section>

              <section className={cn(panelClass, "p-4")}>
                <h3 className="text-[16px] font-bold text-white">Observações do profissional</h3>
                <textarea className={cn(textareaClass, "mt-3")} maxLength={500} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#8b92a3]">{noteDraft.length}/500 caracteres</span>
                  <ActionButton disabled={!before || !after || isPending} onClick={() => before && after && runAction(() => saveClientPhotoComparisonNote({ afterSessionId: after.id, beforeSessionId: before.id, notes: noteDraft, patientId: overview.client.id }))}><Save className="size-4" />Salvar</ActionButton>
                </div>
              </section>

              <section className={cn(panelClass, "p-4")}>
                <h3 className="text-[16px] font-bold text-white">Disponibilidade de ângulos</h3>
                <div className="mt-4 grid gap-2">
                  {comparison.angleAvailability.map((angle) => (
                    <div className="grid grid-cols-[1fr_70px_70px] items-center gap-2 border-b border-[#25313d] pb-2 text-[12px] text-[#c8d1dc]" key={angle.value}>
                      <span>{angle.label}</span>
                      <span className="text-center">{angle.before ? <CheckCircle2 className="mx-auto size-4 text-[#58d881]" /> : "--"}</span>
                      <span className="text-center">{angle.after ? <CheckCircle2 className="mx-auto size-4 text-[#58d881]" /> : "--"}</span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
        ) : null}
      </div>
      </div>
    </main>
  );
}
