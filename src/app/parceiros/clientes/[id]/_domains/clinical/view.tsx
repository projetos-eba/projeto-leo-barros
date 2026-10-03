"use client";

import {
  Archive,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import type {
  PartnerClientClinicalWorkspaceData,
} from "@/lib/partners/client-clinical-workspace-data";
import type { PartnerClientOverviewData } from "@/lib/partners/client-profile/overview";
import { cn } from "@/lib/utils";

import {
  sendExistingFormToClient,
  saveClientAnamnesisEntry,
  saveClientPrescriptionNote,
  setClientPrescriptionStatus,
} from "../../_actions/clinical";
import { PartnerClientProfileHeader } from "../../partner-client-profile-header";

type ClinicalTab = "anamnese" | "formularios" | "prescricoes";
type PrescriptionType = "behavior" | "exam" | "general" | "nutrition" | "supplement" | "training";

type PartnerClientClinicalWorkspaceViewProps = {
  activeTab: ClinicalTab;
  data: PartnerClientClinicalWorkspaceData;
  overview: PartnerClientOverviewData;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const prescriptionTypeLabels: Record<string, string> = {
  behavior: "Conduta",
  exam: "Exames",
  general: "Geral",
  nutrition: "Nutrição",
  supplement: "Suplementação",
  training: "Treino",
};

const statusLabels: Record<string, string> = {
  assigned: "Enviado",
  archived: "Arquivado",
  draft: "Rascunho",
  in_progress: "Em andamento",
  opened: "Aberto",
  published: "Publicado",
  sent: "Enviado",
  submitted: "Respondido",
};

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[8px] border border-[rgba(65,80,92,0.71)] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)]", className)}>
      {children}
    </section>
  );
}

function inputClass(className?: string) {
  return cn("w-full rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none placeholder:text-[#617184] focus:border-[#3b97e3]", className);
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">
      {label}
      {children}
    </label>
  );
}

function Button({ children, disabled, onClick, tone = "ghost", type = "button" }: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "danger" | "ghost" | "primary";
  type?: "button" | "submit";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        tone === "primary" && "bg-[#3b97e3] text-white hover:bg-[#55a8eb]",
        tone === "ghost" && "border border-[#303746] bg-[#101923] text-[#d8e5ee] hover:border-[#3b97e3]",
        tone === "danger" && "border border-[#6e3535] bg-[#31151b] text-[#ff9aa6] hover:border-[#ff7b8e]",
      )}
      disabled={disabled}
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#304354] bg-[#0b1823]/70 p-5 text-[13px] leading-5 text-[#93a6b5]">
      {children}
    </div>
  );
}

function AnamnesisTab({ data, patientId }: { data: PartnerClientClinicalWorkspaceData["anamnesis"]; patientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState(data.current?.content ?? "");
  const [summary, setSummary] = useState(data.current?.summary ?? "");
  const [title, setTitle] = useState(data.current?.title ?? "Anamnese clínica");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveClientAnamnesisEntry({ content, patientId, summary, title });
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível salvar a anamnese.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8fcfff]">Bloco de notas</p>
            <h2 className="mt-1 text-[22px] font-bold text-white">Anamnese</h2>
          </div>
          <span className="rounded-[6px] border border-[#303746] px-3 py-1 text-[12px] text-[#9fb1c0]">
            {data.current ? `Versão ${data.current.version}` : "Novo histórico"}
          </span>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Field label="Título">
            <input className={inputClass("h-10")} required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Resumo">
            <input className={inputClass("h-10")} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Síntese rápida para localizar esta versão" />
          </Field>
          <Field label="Registro">
            <textarea
              className={inputClass("min-h-[420px] resize-y py-3 font-mono text-[13px] leading-6")}
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={"Queixa principal\nHistórico\nHábitos\nRestrições\nObservações do profissional"}
            />
          </Field>
          <div className="flex justify-end">
            <Button disabled={pending} tone="primary" type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar versão
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <History className="size-4 text-[#8fcfff]" />
          <h2 className="text-[18px] font-bold text-white">Histórico</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {data.state === "unavailable" ? (
            <EmptyState>A anamnese está temporariamente indisponível. Os demais módulos continuam disponíveis.</EmptyState>
          ) : data.history.length === 0 ? (
            <EmptyState>Nenhuma anamnese salva para este Cliente.</EmptyState>
          ) : data.history.map((entry) => (
            <button
              className={cn("rounded-[8px] border p-3 text-left transition hover:border-[#3b97e3]", entry.isCurrent ? "border-[#3b97e3] bg-[#10283a]" : "border-[#303746] bg-[#0b1823]")}
              key={entry.id}
              type="button"
              onClick={() => {
                setTitle(entry.title);
                setSummary(entry.summary ?? "");
                setContent(entry.content);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{entry.title}</p>
                <span className="text-[11px] text-[#8fcfff]">v{entry.version}</span>
              </div>
              <p className="mt-1 text-[12px] text-[#8b92a3]">{formatDate(entry.createdAt)}</p>
              {entry.summary ? <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#c4d0dc]">{entry.summary}</p> : null}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PrescriptionsTab({ data, patientId }: { data: PartnerClientClinicalWorkspaceData["prescriptions"]; patientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType>("general");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [title, setTitle] = useState("Nova prescrição");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveClientPrescriptionNote({ content, patientId, prescriptionType, status, title });
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível salvar a prescrição.");
        return;
      }
      setContent("");
      setStatus("draft");
      setTitle("Nova prescrição");
      router.refresh();
    });
  }

  function setStatusForNote(prescriptionId: string, nextStatus: "archived" | "published") {
    startTransition(async () => {
      const result = await setClientPrescriptionStatus({ patientId, prescriptionId, status: nextStatus });
      if (!result.ok) window.alert(result.error ?? "Não foi possível atualizar a prescrição.");
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Panel className="p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8fcfff]">Bloco de prescrições</p>
          <h2 className="mt-1 text-[22px] font-bold text-white">Condutas e orientações</h2>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Field label="Título">
            <input className={inputClass("h-10")} required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipo">
              <select className={inputClass("h-10")} value={prescriptionType} onChange={(event) => setPrescriptionType(event.target.value as PrescriptionType)}>
                {Object.entries(prescriptionTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select className={inputClass("h-10")} value={status} onChange={(event) => setStatus(event.target.value as "draft" | "published")}>
                <option value="draft">Salvar como rascunho</option>
                <option value="published">Publicar para o Cliente</option>
              </select>
            </Field>
          </div>
          <Field label="Prescrição">
            <textarea
              className={inputClass("min-h-[360px] resize-y py-3 font-mono text-[13px] leading-6")}
              required
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={"Objetivo\nOrientação\nFrequência\nCuidados\nObservações"}
            />
          </Field>
          <div className="flex justify-end">
            <Button disabled={pending} tone="primary" type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar prescrição
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-[#8fcfff]" />
          <h2 className="text-[18px] font-bold text-white">Histórico de prescrições</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {data.state === "unavailable" ? (
            <EmptyState>As prescrições estão temporariamente indisponíveis. Tente novamente em alguns instantes.</EmptyState>
          ) : data.history.length === 0 ? (
            <EmptyState>Nenhuma prescrição salva para este Cliente.</EmptyState>
          ) : data.history.map((entry) => (
            <article className="rounded-[8px] border border-[#303746] bg-[#0b1823] p-4" key={entry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{entry.title}</p>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">
                    v{entry.version} • {prescriptionTypeLabels[entry.type ?? "general"]} • {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <span className="rounded-[6px] border border-[#304354] px-2 py-1 text-[11px] text-[#c4d0dc]">{statusLabels[entry.status ?? "draft"]}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-[#d8e5ee]">{entry.content}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.status === "draft" ? (
                  <Button disabled={pending} onClick={() => setStatusForNote(entry.id, "published")}>
                    <Send className="size-4" /> Publicar
                  </Button>
                ) : null}
                {entry.status !== "archived" ? (
                  <Button disabled={pending} tone="danger" onClick={() => setStatusForNote(entry.id, "archived")}>
                    <Archive className="size-4" /> Arquivar
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

type FormsFilter = "all" | "answered" | "in_progress" | "late" | "waiting";

function ClientFormsAndResponses({ data, patientId }: { data: PartnerClientClinicalWorkspaceData["forms"]; patientId: string }) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(data.templates[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [filter, setFilter] = useState<FormsFilter>("all");
  const [detailTab, setDetailTab] = useState<"answers" | "original">("answers");
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(data.assignments[0]?.assignmentClientId ?? null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const isLate = (item: PartnerClientClinicalWorkspaceData["forms"]["assignments"][number]) =>
    item.status !== "submitted" && Boolean(item.dueAt && new Date(item.dueAt).getTime() < Date.now());
  const metrics = {
    answered: data.assignments.filter((item) => item.status === "submitted").length,
    late: data.assignments.filter(isLate).length,
    sent: data.assignments.length,
    waiting: data.assignments.filter((item) => item.status !== "submitted").length,
  };
  const filtered = data.assignments.filter((item) => {
    if (filter === "answered") return item.status === "submitted";
    if (filter === "late") return isLate(item);
    if (filter === "in_progress") return item.status === "opened" || item.status === "in_progress";
    if (filter === "waiting") return item.status === "assigned" || item.status === "sent";
    return true;
  });
  const assignment = data.assignments.find((item) => item.assignmentClientId === selected) ?? null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionMessage(null);
    startTransition(async () => {
      const result = await sendExistingFormToClient({
        dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null,
        message,
        patientId,
        templateId,
      });
      setActionMessage(result.ok ? result.message ?? "Formulário enviado." : result.error ?? "Não foi possível enviar o formulário.");
      if (result.ok) {
        setDueAt("");
        setMessage("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-6 grid gap-4">
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-[11px] font-semibold uppercase tracking-wider text-[#8fcfff]">Biblioteca de modelos</p><h2 className="mt-1 text-[22px] font-bold">Formulários e respostas</h2></div>
          <div className="flex flex-wrap gap-3 text-xs"><span>Enviados {metrics.sent}</span><span>Respondidos {metrics.answered}</span><span>Aguardando {metrics.waiting}</span><span>Atrasados {metrics.late}</span><span>Taxa {metrics.sent ? Math.round(metrics.answered / metrics.sent * 100) : 0}%</span></div>
        </div>
        <p className="mt-2 text-xs text-[#8b92a3]">Escolha um modelo já publicado. O destinatário permanece fixo neste Cliente.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_180px_auto]" onSubmit={submit}>
          <select aria-label="Modelo de formulário" className={inputClass("h-10")} required value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Escolha um modelo</option>{data.templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select>
          <input aria-label="Mensagem" className={inputClass("h-10")} placeholder="Mensagem opcional" value={message} onChange={(event) => setMessage(event.target.value)} />
          <input aria-label="Prazo" className={inputClass("h-10")} type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          <Button disabled={pending || !templateId} tone="primary" type="submit">{pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Enviar formulário</Button>
        </form>
        {actionMessage ? <p className="mt-3 text-sm text-[#8fcfff]" role="status">{actionMessage}</p> : null}
      </Panel>

      <div className="flex flex-wrap gap-2">
        {([["all", "Todos"], ["waiting", "Aguardando"], ["in_progress", "Em andamento"], ["answered", "Respondidos"], ["late", "Atrasados"]] as Array<[FormsFilter, string]>).map(([value, label]) => <button className={cn("rounded-full border px-3 py-1.5 text-xs", filter === value ? "border-[#3b97e3] bg-[#15334a] text-white" : "border-[#303746] text-[#9eabb8]")} key={value} onClick={() => setFilter(value)}>{label}</button>)}
      </div>

      {data.state === "unavailable" ? <Panel className="p-5"><EmptyState>Os formulários estão temporariamente indisponíveis. Tente novamente.</EmptyState></Panel> : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <Panel className="p-3">
            <div className="grid max-h-[620px] gap-2 overflow-y-auto">
              {filtered.map((item) => <button className={cn("rounded border p-3 text-left", selected === item.assignmentClientId ? "border-[#3b97e3] bg-[#102333]" : "border-[#303746]")} key={item.assignmentClientId} onClick={() => setSelected(item.assignmentClientId)}><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#8b92a3]">{formatDate(item.sentAt ?? item.createdAt)} · {isLate(item) ? "Atrasado" : statusLabels[item.status] ?? item.status}</p></button>)}
              {filtered.length === 0 ? <EmptyState>Nenhum envio neste filtro.</EmptyState> : null}
            </div>
          </Panel>
          <Panel className="p-5">
            {assignment ? <>
              <div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-lg font-bold">{assignment.title}</h3><p className="text-xs text-[#8b92a3]">Enviado em {formatDate(assignment.sentAt ?? assignment.createdAt)}{assignment.dueAt ? ` · prazo ${formatDate(assignment.dueAt)}` : ""}{assignment.submittedAt ? ` · respondido em ${formatDate(assignment.submittedAt)}` : ""}</p>{assignment.message ? <p className="mt-2 text-sm text-[#c4d0dc]">{assignment.message}</p> : null}</div><span className="h-fit rounded border border-[#304354] px-2 py-1 text-xs">{isLate(assignment) ? "Atrasado" : statusLabels[assignment.status] ?? assignment.status}</span></div>
              <div className="mt-5 flex gap-2 border-b border-[#303746]"><button className={cn("px-3 py-2 text-sm", detailTab === "answers" && "border-b-2 border-[#3b97e3] text-white")} onClick={() => setDetailTab("answers")}>Respostas</button><button className={cn("px-3 py-2 text-sm", detailTab === "original" && "border-b-2 border-[#3b97e3] text-white")} onClick={() => setDetailTab("original")}>Formulário original</button></div>
              {detailTab === "answers" ? <div className="mt-5 grid gap-4">{assignment.questions.map((question) => { const answer = assignment.responseAnswers.find((item) => item.questionId === question.id); return <div className="rounded border border-[#303746] p-3" key={question.id}><p className="text-sm font-semibold">{question.prompt}</p><p className="mt-1 text-sm text-[#c4d0dc]">{answer?.value ?? "Sem resposta"}</p></div>; })}</div> : <div className="mt-5 grid gap-3">{assignment.questions.map((question, index) => <div className="rounded border border-[#303746] p-3" key={question.id}><p className="text-xs text-[#8fcfff]">Pergunta {index + 1} · {question.type}</p><p className="mt-1 text-sm">{question.prompt}{question.required ? " *" : ""}</p>{question.options.length ? <p className="mt-1 text-xs text-[#8b92a3]">{question.options.join(" · ")}</p> : null}</div>)}</div>}
            </> : <EmptyState>Selecione um envio para visualizar respostas e o formulário original.</EmptyState>}
          </Panel>
        </div>
      )}
    </div>
  );
}

export function PartnerClientClinicalWorkspaceView({
  activeTab,
  data,
  overview,
}: PartnerClientClinicalWorkspaceViewProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1720] px-5 py-6 font-['Rethink_Sans',sans-serif] text-[#f3f4f7] lg:px-6">
      <div className="mx-auto min-w-0 max-w-[1197px]">
        <PartnerClientProfileHeader activeTab={activeTab} overview={overview} />
        {activeTab === "anamnese" ? <AnamnesisTab data={data.anamnesis} patientId={overview.client.id} /> : null}
        {activeTab === "prescricoes" ? <PrescriptionsTab data={data.prescriptions} patientId={overview.client.id} /> : null}
        {activeTab === "formularios" ? <ClientFormsAndResponses data={data.forms} patientId={overview.client.id} /> : null}
      </div>
    </div>
  );
}
