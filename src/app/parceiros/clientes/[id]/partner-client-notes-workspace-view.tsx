"use client";

import { ClipboardList, FileText, Send, StickyNote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import type { PartnerClientClinicalData } from "@/lib/partners/client-clinical-data";
import type { PartnerClientOverviewData } from "@/lib/partners/client-overview-metrics";

import { createAndSendPartnerForm, createPartnerClientNote } from "./clinical-actions";
import { PartnerClientProfileHeader } from "./partner-client-profile-header";

type NotesTab = "anamnese" | "formularios" | "prescricoes";

const copyByTab: Record<NotesTab, { cta: string; description: string; empty: string; icon: typeof StickyNote; title: string }> = {
  anamnese: {
    cta: "Salvar anotação",
    description: "Histórico em formato de bloco de notas para registrar evolução, queixas e observações do atendimento.",
    empty: "Nenhuma anotação salva nesta sessão.",
    icon: StickyNote,
    title: "Anamnese",
  },
  formularios: {
    cta: "Registrar formulário",
    description: "Rascunho visual para organizar formulários enviados ao cliente e acompanhar respostas recebidas.",
    empty: "Nenhum formulário registrado nesta sessão.",
    icon: FileText,
    title: "Formulários",
  },
  prescricoes: {
    cta: "Salvar prescrição",
    description: "Histórico em formato de bloco de notas para condutas, orientações e ajustes prescritos ao cliente.",
    empty: "Nenhuma prescrição salva nesta sessão.",
    icon: ClipboardList,
    title: "Prescrições",
  },
};

export function PartnerClientNotesWorkspaceView({
  clinical,
  overview,
  tab,
}: {
  clinical: PartnerClientClinicalData;
  overview: PartnerClientOverviewData;
  tab: NotesTab;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [formTitle, setFormTitle] = useState("Check-in de acompanhamento");
  const [formDescription, setFormDescription] = useState("Responda com calma antes da próxima consulta.");
  const [formQuestions, setFormQuestions] = useState([
    { id: "q1", label: "Como você se sentiu nos últimos dias?", type: "long_text" as const },
    { id: "q2", label: "Quais foram suas maiores dificuldades?", type: "long_text" as const },
    { id: "q3", label: "O que funcionou melhor no plano?", type: "long_text" as const },
  ]);
  const [selectedClientIds, setSelectedClientIds] = useState([overview.client.id]);
  const [message, setMessage] = useState<string | null>(null);
  const content = copyByTab[tab];
  const Icon = content.icon;
  const noteType = tab === "prescricoes" ? "prescription" : "anamnesis";
  const entries = useMemo(
    () => clinical.notes.filter((note) => note.note_type === noteType),
    [clinical.notes, noteType],
  );
  const responseByAssignmentClientId = useMemo(
    () => Object.fromEntries(clinical.responses.map((response) => [response.assignment_client_id, response])),
    [clinical.responses],
  );
  const assignmentsById = useMemo(
    () => Object.fromEntries(clinical.assignments.map((assignment) => [assignment.id, assignment])),
    [clinical.assignments],
  );

  function addEntry() {
    const body = draft.trim();
    if (!body) return;
    startTransition(() => {
      void createPartnerClientNote({
        body,
        noteType,
        patientId: overview.client.id,
        title: title.trim() || content.title,
      }).then((result) => {
        setMessage(result.ok ? result.message ?? "Registro salvo." : result.error ?? "Não foi possível salvar.");
        if (result.ok) {
          setDraft("");
          setTitle("");
          router.refresh();
        }
      });
    });
  }

  function sendForm() {
    startTransition(() => {
      void createAndSendPartnerForm({
        description: formDescription || null,
        patientIds: selectedClientIds,
        questions: formQuestions,
        title: formTitle,
      }).then((result) => {
        setMessage(result.ok ? result.message ?? "Formulário enviado." : result.error ?? "Não foi possível enviar.");
        if (result.ok) router.refresh();
      });
    });
  }

  function toggleClient(clientId: string) {
    setSelectedClientIds((current) =>
      current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId],
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1720] pb-10 text-white sm:pb-12">
      <div className="mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-6 sm:py-6">
        <PartnerClientProfileHeader activeTab={tab} overview={overview} />

        {message ? <p className="mt-6 rounded-[8px] border border-[#2d4354] bg-[#0d1823] px-4 py-3 text-[13px] text-[#8fcfff]">{message}</p> : null}

        {tab === "formularios" ? (
          <section className="mt-4 grid gap-4 sm:mt-8 sm:gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#0a2c48] text-[#68afe9]">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h1 className="text-[22px] font-bold">Formulário</h1>
                  <p className="mt-1 text-[13px] leading-5 text-[#9aa5b6]">Crie perguntas e envie para um ou mais Clientes.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <input className="h-10 rounded-[8px] border border-[#303746] bg-[#07131d] px-3 text-[13px] outline-none focus:border-[#3b97e3]" value={formTitle} onChange={(event) => setFormTitle(event.target.value)} />
                <textarea className="min-h-[76px] rounded-[8px] border border-[#303746] bg-[#07131d] px-3 py-2 text-[13px] outline-none focus:border-[#3b97e3]" value={formDescription} onChange={(event) => setFormDescription(event.target.value)} />
                {formQuestions.map((question, index) => (
                  <input
                    className="h-10 rounded-[8px] border border-[#303746] bg-[#07131d] px-3 text-[13px] outline-none focus:border-[#3b97e3]"
                    key={question.id}
                    value={question.label}
                    onChange={(event) => setFormQuestions((current) => current.map((item) => item.id === question.id ? { ...item, label: event.target.value } : item))}
                    placeholder={`Pergunta ${index + 1}`}
                  />
                ))}
                <button
                  className="h-10 rounded-[8px] border border-[#303746] bg-[#101923] text-[13px] font-semibold text-[#d8e5ee]"
                  type="button"
                  onClick={() => setFormQuestions((current) => [...current, { id: crypto.randomUUID(), label: "", type: "long_text" }])}
                >
                  Adicionar pergunta
                </button>
              </div>
              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">Enviar para</p>
                <div className="mt-3 max-h-[180px] space-y-2 overflow-y-auto pr-1">
                  {clinical.clients.map((client) => (
                    <label className="flex items-center justify-between rounded-[8px] border border-[#263846] bg-[#07131d] px-3 py-2" key={client.id}>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold">{client.name}</span>
                        <span className="text-[12px] text-[#8b92a3]">{client.email}</span>
                      </span>
                      <input checked={selectedClientIds.includes(client.id)} type="checkbox" onChange={() => toggleClient(client.id)} />
                    </label>
                  ))}
                </div>
              </div>
              <button
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#3b97e3] px-4 text-[13px] font-semibold text-white transition hover:bg-[#55a8eb] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending || selectedClientIds.length === 0 || formQuestions.some((question) => !question.label.trim())}
                type="button"
                onClick={sendForm}
              >
                <Send className="size-4" />
                Enviar formulário
              </button>
            </section>

            <section className="rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-4 sm:p-5">
              <h2 className="text-[18px] font-bold">Envios e respostas</h2>
              <div className="mt-4 grid gap-3">
                {clinical.assignmentClients.length === 0 ? (
                  <p className="rounded-[8px] border border-dashed border-[#303746] px-4 py-10 text-center text-[13px] text-[#8b92a3]">
                    Nenhum formulário enviado para este Cliente.
                  </p>
                ) : clinical.assignmentClients.map((assignmentClient) => {
                  const assignment = assignmentsById[assignmentClient.assignment_id];
                  const response = responseByAssignmentClientId[assignmentClient.id];
                  return (
                    <article className="rounded-[8px] border border-[#263846] bg-[#07131d] p-4" key={assignmentClient.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-[15px] font-bold">{assignment?.title_snapshot ?? "Formulário"}</h3>
                        <span className="rounded bg-[#0e2c1e] px-2 py-1 text-[11px] font-semibold text-[#62d98b]">
                          {assignmentClient.status === "answered" ? "Respondido" : "Enviado"}
                        </span>
                      </div>
                      {response ? (
                        <div className="mt-3 space-y-2">
                          {Object.entries(response.answers).map(([questionId, answer]) => {
                            const label = assignment?.questions_snapshot.find((question) => question.id === questionId)?.label ?? "Resposta";
                            return <p className="text-[13px] leading-5 text-[#d8e5ee]" key={questionId}><strong>{label}:</strong> {answer}</p>;
                          })}
                        </div>
                      ) : <p className="mt-3 text-[13px] text-[#8b92a3]">Aguardando resposta.</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          </section>
        ) : (
        <section className="mt-4 grid gap-4 sm:mt-8 sm:gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[#0a2c48] text-[#68afe9]">
                <Icon className="size-5" />
              </span>
              <div>
                <h1 className="text-[22px] font-bold">{content.title}</h1>
                <p className="mt-1 text-[13px] leading-5 text-[#9aa5b6]">{content.description}</p>
              </div>
            </div>
            <input
              className="mt-5 h-10 w-full rounded-[8px] border border-[#303746] bg-[#07131d] px-4 text-[13px] text-white outline-none focus:border-[#3b97e3]"
              placeholder="Título"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <textarea
              className="mt-5 min-h-[280px] w-full resize-y rounded-[8px] border border-[#303746] bg-[#07131d] px-4 py-3 text-[14px] leading-6 text-white outline-none focus:border-[#3b97e3]"
              placeholder="Escreva aqui..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#3b97e3] px-4 text-[13px] font-semibold text-white transition hover:bg-[#55a8eb] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending || !draft.trim()}
              type="button"
              onClick={addEntry}
            >
              <Send className="size-4" />
              {content.cta}
            </button>
          </section>

          <section className="rounded-[10px] border border-[#2d4354] bg-[linear-gradient(153deg,rgba(42,63,79,0.35)_8%,rgba(96,144,181,0)_79%)] p-4 sm:p-5">
            <h2 className="text-[18px] font-bold">Histórico</h2>
            <div className="mt-4 grid gap-3">
              {entries.length === 0 ? (
                <p className="rounded-[8px] border border-dashed border-[#303746] px-4 py-10 text-center text-[13px] text-[#8b92a3]">
                  {content.empty}
                </p>
              ) : entries.map((entry) => (
                <article className="rounded-[8px] border border-[#263846] bg-[#07131d] p-4" key={entry.id}>
                  <p className="text-[12px] font-semibold text-[#68afe9]">
                    {entry.title} · {new Date(entry.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[#d8e5ee]">{entry.body}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
        )}
      </div>
    </main>
  );
}
