"use client";

import {
  Archive,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";

import type {
  PartnerClientClinicalWorkspaceData,
} from "@/lib/partners/client-clinical-workspace-data";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";
import { cn } from "@/lib/utils";

import {
  createAndSendClientForm,
  saveClientAnamnesisEntry,
  saveClientPrescriptionNote,
  setClientPrescriptionStatus,
} from "./clinical-actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type ClinicalTab = "anamnese" | "formularios" | "prescricoes";
type FormQuestionType = "boolean" | "date" | "multiple_choice" | "number" | "scale" | "single_choice" | "text_long" | "text_short";
type PrescriptionType = "behavior" | "exam" | "general" | "nutrition" | "supplement" | "training";

type PartnerClientClinicalWorkspaceViewProps = {
  activeTab: ClinicalTab;
  data: PartnerClientClinicalWorkspaceData;
  overview: PartnerClientOverviewData;
};

type BuilderQuestion = {
  helpText: string;
  id: string;
  optionsText: string;
  prompt: string;
  required: boolean;
  type: FormQuestionType;
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

const questionTypeLabels: Record<FormQuestionType, string> = {
  boolean: "Sim/Não",
  date: "Data",
  multiple_choice: "Múltipla escolha",
  number: "Número",
  scale: "Escala",
  single_choice: "Escolha única",
  text_long: "Texto longo",
  text_short: "Texto curto",
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
          {data.history.length === 0 ? (
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
          {data.history.length === 0 ? (
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

function FormsTab({ data, patientId }: { data: PartnerClientClinicalWorkspaceData["forms"]; patientId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState<BuilderQuestion[]>([
    { helpText: "", id: "q-1", optionsText: "", prompt: "Como você avalia sua evolução nesta semana?", required: true, type: "text_long" },
  ]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(data.clients.filter((client) => client.selected).map((client) => client.id));
  const [title, setTitle] = useState("Check-in semanal");

  const selectedCount = selectedClientIds.length;
  const assignments = useMemo(() => data.assignments, [data.assignments]);

  function updateQuestion(id: string, next: Partial<BuilderQuestion>) {
    setQuestions((current) => current.map((question) => question.id === id ? { ...question, ...next } : question));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createAndSendClientForm({
        message,
        patientIds: selectedClientIds,
        questions: questions.map((question) => ({
          helpText: question.helpText,
          options: question.optionsText.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
          prompt: question.prompt,
          required: question.required,
          type: question.type,
        })),
        title,
      });
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível enviar o formulário.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
      <Panel className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8fcfff]">Estilo Typeform</p>
            <h2 className="mt-1 text-[22px] font-bold text-white">Criar e enviar formulário</h2>
          </div>
          <span className="rounded-[6px] border border-[#303746] px-3 py-1 text-[12px] text-[#9fb1c0]">{selectedCount} selecionado(s)</span>
        </div>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Field label="Título">
            <input className={inputClass("h-10")} required value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Mensagem para o Cliente">
            <textarea className={inputClass("min-h-20 py-3")} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Contexto do formulário ou prazo combinado." />
          </Field>

          <div className="grid gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">Clientes</p>
            <div className="grid max-h-[210px] gap-2 overflow-y-auto rounded-[8px] border border-[#303746] bg-[#081520] p-3">
              {data.clients.map((client) => {
                const checked = selectedClientIds.includes(client.id);
                return (
                  <label className="flex items-center gap-3 rounded-[7px] px-2 py-2 text-[13px] text-[#d8e5ee] hover:bg-[#102333]" key={client.id}>
                    <input
                      checked={checked}
                      type="checkbox"
                      onChange={(event) => {
                        setSelectedClientIds((current) => event.target.checked
                          ? Array.from(new Set([...current, client.id]))
                          : current.filter((id) => id !== client.id));
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white">{client.name}</span>
                      <span className="block truncate text-[11px] text-[#8b92a3]">{client.email}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">Perguntas</p>
              <Button onClick={() => setQuestions((current) => [...current, { helpText: "", id: `q-${Date.now()}`, optionsText: "", prompt: "", required: true, type: "text_short" }])}>
                <Plus className="size-4" /> Pergunta
              </Button>
            </div>
            {questions.map((question, index) => (
              <div className="rounded-[8px] border border-[#303746] bg-[#0b1823] p-3" key={question.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[12px] font-semibold text-[#8fcfff]">Pergunta {index + 1}</p>
                  {questions.length > 1 ? (
                    <button aria-label="Remover pergunta" className="text-[#ff9aa6]" type="button" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}>
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3">
                  <input className={inputClass("h-10")} required value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} placeholder="Digite a pergunta" />
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select className={inputClass("h-10")} value={question.type} onChange={(event) => updateQuestion(question.id, { type: event.target.value as FormQuestionType })}>
                      {Object.entries(questionTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <label className="flex h-10 items-center gap-2 rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[12px] text-[#d8e5ee]">
                      <input checked={question.required} type="checkbox" onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} />
                      Obrigatória
                    </label>
                  </div>
                  {question.type === "single_choice" || question.type === "multiple_choice" ? (
                    <textarea className={inputClass("min-h-20 py-2")} required value={question.optionsText} onChange={(event) => updateQuestion(question.id, { optionsText: event.target.value })} placeholder="Uma opção por linha ou separadas por vírgula" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button disabled={pending || selectedClientIds.length === 0} tone="primary" type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar formulário
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[#8fcfff]" />
          <h2 className="text-[18px] font-bold text-white">Respostas deste Cliente</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {assignments.length === 0 ? (
            <EmptyState>Nenhum formulário enviado para este Cliente.</EmptyState>
          ) : assignments.map((assignment) => (
            <article className="rounded-[8px] border border-[#303746] bg-[#0b1823] p-4" key={assignment.assignmentClientId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{assignment.title}</p>
                  <p className="mt-1 text-[12px] text-[#8b92a3]">{formatDate(assignment.createdAt)} • {assignment.questions.length} pergunta(s)</p>
                </div>
                <span className="rounded-[6px] border border-[#304354] px-2 py-1 text-[11px] text-[#c4d0dc]">{statusLabels[assignment.status] ?? assignment.status}</span>
              </div>
              {assignment.message ? <p className="mt-3 text-[13px] leading-5 text-[#c4d0dc]">{assignment.message}</p> : null}
              <div className="mt-4 grid gap-2">
                {assignment.responseAnswers.length === 0 ? (
                  <p className="rounded-[7px] border border-dashed border-[#304354] px-3 py-2 text-[12px] text-[#8b92a3]">Aguardando resposta.</p>
                ) : assignment.responseAnswers.map((answer) => (
                  <div className="rounded-[7px] border border-[#263846] bg-[#081520] p-3" key={`${assignment.assignmentClientId}-${answer.label}`}>
                    <p className="text-[12px] font-semibold text-[#8fcfff]">{answer.label}</p>
                    <p className="mt-1 whitespace-pre-line text-[13px] leading-5 text-white">{answer.value}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Panel>
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
        {activeTab === "formularios" ? <FormsTab data={data.forms} patientId={overview.client.id} /> : null}
      </div>
    </div>
  );
}
