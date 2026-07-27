"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowDown, ArrowUp, Copy, Eye, FilePlus2, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { PartnerFormQuestionDraft, PartnerFormTemplate } from "@/lib/partners/form-library";
import type { PartnerMaterialClient } from "@/lib/partners/materials-metrics";
import { cn } from "@/lib/utils";

import {
  changePartnerFormTemplateStatus,
  savePartnerFormTemplate,
  sendPartnerFormTemplate,
} from "./form-actions";

const inputClass = "h-10 w-full rounded-[8px] border border-[#303746] bg-[#081520] px-3 text-[13px] text-white outline-none focus:border-[#168ce4]";
const questionTypes: Array<[PartnerFormQuestionDraft["type"], string]> = [
  ["text_short", "Texto curto"],
  ["text_long", "Texto longo"],
  ["boolean", "Sim ou não"],
  ["number", "Número"],
  ["date", "Data"],
  ["single_choice", "Escolha única"],
  ["multiple_choice", "Múltipla escolha"],
  ["scale", "Escala"],
];

function blankQuestion(): PartnerFormQuestionDraft {
  return { helpText: "", options: [], prompt: "", required: true, settings: {}, type: "text_short" };
}

function PreviewField({ question }: { question: PartnerFormQuestionDraft }) {
  const placeholder = String(question.settings.placeholder ?? "Sua resposta");
  if (question.type === "text_long") return <textarea className={cn(inputClass, "min-h-24 py-2")} disabled placeholder={placeholder} />;
  if (question.type === "boolean") return <div className="flex gap-2"><button className="rounded border border-[#3b4b59] px-3 py-2" disabled>Sim</button><button className="rounded border border-[#3b4b59] px-3 py-2" disabled>Não</button></div>;
  if (question.type === "single_choice" || question.type === "multiple_choice") return <div className="grid gap-2">{question.options.map((option) => <label className="text-sm" key={option}><input disabled type={question.type === "multiple_choice" ? "checkbox" : "radio"} /> {option}</label>)}</div>;
  if (question.type === "date") return <input className={inputClass} disabled type="date" />;
  if (question.type === "number") return <div className="flex items-center gap-2"><input className={inputClass} disabled placeholder={placeholder} type="number" />{question.settings.unit ? <span className="text-sm text-[#9eabb8]">{String(question.settings.unit)}</span> : null}</div>;
  if (question.type === "scale") return <div><input className="w-full" disabled max={question.scaleMax ?? 10} min={question.scaleMin ?? 0} step={Number(question.settings.increment ?? 1)} type="range" /><div className="flex justify-between text-xs text-[#8b92a3]"><span>{String(question.settings.minLabel ?? question.scaleMin ?? 0)}</span><span>{String(question.settings.maxLabel ?? question.scaleMax ?? 10)}</span></div></div>;
  return <input className={inputClass} disabled placeholder={placeholder} />;
}

function QuestionPreview({ question }: { question: PartnerFormQuestionDraft }) {
  return <div className="grid gap-2"><p className="text-sm font-semibold">{question.prompt || "Nova pergunta"}{question.required ? " *" : ""}</p>{question.helpText ? <p className="text-xs text-[#8b92a3]">{question.helpText}</p> : null}<PreviewField question={question} /></div>;
}

export function PartnerFormLibrary({ clients, templates, unavailable = false }: { clients: PartnerMaterialClient[]; templates: PartnerFormTemplate[]; unavailable?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<PartnerFormTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [sendTemplate, setSendTemplate] = useState<PartnerFormTemplate | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [questions, setQuestions] = useState<PartnerFormQuestionDraft[]>([blankQuestion()]);
  const [selected, setSelected] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();

  const filteredClients = useMemo(
    () => clients.filter((client) => `${client.displayName} ${client.email}`.toLowerCase().includes(search.toLowerCase())),
    [clients, search],
  );

  function openEditor(template?: PartnerFormTemplate, duplicate = false) {
    setEditing(template && !duplicate ? template : null);
    setTitle(template ? `${template.title}${duplicate ? " (cópia)" : ""}` : "");
    setDescription(template?.description ?? "");
    setMessage(template?.defaultMessage ?? "");
    setQuestions(template?.questions.length ? structuredClone(template.questions) : [blankQuestion()]);
    setEditorOpen(true);
    setPreview(false);
  }

  function openSend(template: PartnerFormTemplate) {
    setSendTemplate(template);
    setMessage(template.defaultMessage ?? "");
    setSelected([]);
    setDueAt("");
    setSearch("");
    setRequestKey(crypto.randomUUID());
  }

  function updateQuestion(index: number, patch: Partial<PartnerFormQuestionDraft>) {
    setQuestions((current) => current.map((question, itemIndex) => itemIndex === index ? { ...question, ...patch } : question));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((current) => {
      const reordered = [...current];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  function save(status: "draft" | "active") {
    startTransition(async () => {
      const result = await savePartnerFormTemplate({ defaultMessage: message, description, questions, status, templateId: editing?.id ?? null, title });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setEditorOpen(false);
      router.refresh();
    });
  }

  function changeStatus(template: PartnerFormTemplate) {
    startTransition(async () => {
      const result = await changePartnerFormTemplateStatus({ status: template.status === "archived" ? "active" : "archived", templateId: template.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  function send() {
    if (!sendTemplate) return;
    startTransition(async () => {
      const result = await sendPartnerFormTemplate({
        dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null,
        message,
        patientIds: selected,
        requestKey,
        templateId: sendTemplate.id,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setSendTemplate(null);
      router.refresh();
    });
  }

  return (
    <section className="mb-6 rounded-[10px] border border-[#293b49] bg-[#101a24] p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-[#8fcfff]">Materiais · Formulários</p><h2 className="mt-1 text-xl font-bold">Modelos de formulários</h2></div>
        <button className="flex items-center gap-2 rounded-[8px] bg-[#168ce4] px-4 py-2 text-sm font-semibold" onClick={() => openEditor()}><FilePlus2 className="size-4" />Criar modelo</button>
      </div>
      {unavailable ? <p className="mt-4 rounded border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100" role="status">Os modelos estão temporariamente indisponíveis. Tente recarregar a página.</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <article className="rounded-[8px] border border-[#303746] p-4" key={template.id}>
            <div className="flex justify-between gap-2"><h3 className="font-semibold">{template.title}</h3><span className="text-xs text-[#8fcfff]">{template.status} · v{template.version}</span></div>
            <p className="mt-2 line-clamp-2 text-xs text-[#8b92a3]">{template.description || "Sem descrição"}</p>
            <p className="mt-2 text-xs text-[#8b92a3]">{template.questionCount} perguntas · {template.sendCount} envios · {template.responseCount} respostas</p>
            <p className="mt-1 text-xs text-[#8b92a3]">Conclusão {template.sendCount ? Math.round(template.responseCount / template.sendCount * 100) : 0}% · atualizado em {new Date(template.updatedAt).toLocaleDateString("pt-BR")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded border border-[#3b4b59] p-2 text-xs" onClick={() => openEditor(template)} title="Editar e pré-visualizar"><Eye className="size-4" /></button>
              <button className="rounded border border-[#3b4b59] p-2 text-xs" onClick={() => openEditor(template, true)} title="Duplicar"><Copy className="size-4" /></button>
              <button className="rounded border border-[#3b4b59] p-2 text-xs" onClick={() => changeStatus(template)} title={template.status === "archived" ? "Restaurar" : "Arquivar"}>{template.status === "archived" ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}</button>
              {template.status === "active" ? <button className="flex items-center gap-1 rounded border border-[#3b4b59] px-3 py-2 text-xs" onClick={() => openSend(template)}><Send className="size-4" />Enviar</button> : null}
            </div>
          </article>
        ))}
        {templates.length === 0 ? <p className="text-sm text-[#9eabb8]">Nenhum modelo criado.</p> : null}
      </div>

      {editorOpen ? (
        <div className="mt-5 grid gap-4 border-t border-[#303746] pt-5 xl:grid-cols-2">
          <div className={cn("grid gap-3", preview && "hidden xl:grid")}>
            <input aria-label="Título do modelo" className={inputClass} placeholder="Título" value={title} onChange={(event) => setTitle(event.target.value)} />
            <textarea aria-label="Descrição do modelo" className={cn(inputClass, "min-h-20 py-2")} placeholder="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} />
            <textarea aria-label="Mensagem padrão" className={cn(inputClass, "min-h-20 py-2")} placeholder="Mensagem padrão" value={message} onChange={(event) => setMessage(event.target.value)} />
            {questions.map((question, index) => (
              <div className="grid gap-2 rounded border border-[#303746] p-3" key={index}>
                <div className="flex justify-between"><span className="text-xs text-[#9eabb8]">Pergunta {index + 1}</span><div className="flex gap-1"><button disabled={index === 0} onClick={() => moveQuestion(index, -1)} title="Mover para cima"><ArrowUp className="size-4" /></button><button disabled={index === questions.length - 1} onClick={() => moveQuestion(index, 1)} title="Mover para baixo"><ArrowDown className="size-4" /></button><button disabled={questions.length === 1} onClick={() => setQuestions((all) => all.filter((_, itemIndex) => itemIndex !== index))} title="Remover pergunta"><Trash2 className="size-4 text-red-300" /></button></div></div>
                <input className={inputClass} placeholder="Pergunta" value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} />
                <select className={inputClass} value={question.type} onChange={(event) => { const type = event.target.value as PartnerFormQuestionDraft["type"]; updateQuestion(index, type === "scale" ? { scaleMax: question.scaleMax ?? 10, scaleMin: question.scaleMin ?? 0, settings: { increment: 1, ...question.settings }, type } : { type }); }}>{questionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <input className={inputClass} placeholder="Texto de ajuda (opcional)" value={question.helpText} onChange={(event) => updateQuestion(index, { helpText: event.target.value })} />
                {(question.type === "single_choice" || question.type === "multiple_choice") ? <textarea className={cn(inputClass, "min-h-20 py-2")} placeholder="Uma opção por linha" value={question.options.join("\n")} onChange={(event) => updateQuestion(index, { options: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /> : null}
                {(question.type === "text_short" || question.type === "text_long") ? <div className="grid gap-2 sm:grid-cols-2"><input className={inputClass} placeholder="Placeholder" value={String(question.settings.placeholder ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, placeholder: event.target.value } })} /><input className={inputClass} min="1" placeholder="Limite de caracteres" type="number" value={String(question.settings.maxLength ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, maxLength: event.target.value ? Number(event.target.value) : null } })} /></div> : null}
                {question.type === "number" ? <div className="grid gap-2 sm:grid-cols-2"><input className={inputClass} placeholder="Unidade" value={String(question.settings.unit ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, unit: event.target.value } })} /><input className={inputClass} placeholder="Placeholder" value={String(question.settings.placeholder ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, placeholder: event.target.value } })} /><input className={inputClass} placeholder="Mínimo" type="number" value={String(question.settings.min ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, min: event.target.value ? Number(event.target.value) : null } })} /><input className={inputClass} placeholder="Máximo" type="number" value={String(question.settings.max ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, max: event.target.value ? Number(event.target.value) : null } })} /><input className={inputClass} min="0" max="6" placeholder="Casas decimais" type="number" value={String(question.settings.decimals ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, decimals: event.target.value ? Number(event.target.value) : 0 } })} /></div> : null}
                {question.type === "scale" ? <div className="grid gap-2 sm:grid-cols-2"><input className={inputClass} placeholder="Mínimo" type="number" value={question.scaleMin ?? 0} onChange={(event) => updateQuestion(index, { scaleMin: Number(event.target.value) })} /><input className={inputClass} placeholder="Máximo" type="number" value={question.scaleMax ?? 10} onChange={(event) => updateQuestion(index, { scaleMax: Number(event.target.value) })} /><input className={inputClass} placeholder="Rótulo mínimo" value={String(question.settings.minLabel ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, minLabel: event.target.value } })} /><input className={inputClass} placeholder="Rótulo máximo" value={String(question.settings.maxLabel ?? "")} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, maxLabel: event.target.value } })} /><input className={inputClass} min="0.1" step="0.1" placeholder="Incremento" type="number" value={String(question.settings.increment ?? 1)} onChange={(event) => updateQuestion(index, { settings: { ...question.settings, increment: Number(event.target.value) } })} /></div> : null}
                <label className="text-sm"><input checked={question.required} type="checkbox" onChange={(event) => updateQuestion(index, { required: event.target.checked })} /> Resposta obrigatória</label>
              </div>
            ))}
            <button className="rounded border border-[#3b4b59] px-3 py-2 text-sm" onClick={() => setQuestions((all) => [...all, blankQuestion()])}>Adicionar pergunta</button>
            <div className="flex flex-wrap gap-2"><button disabled={pending} className="rounded border border-[#3b4b59] px-4 py-2" onClick={() => save("draft")}>Salvar rascunho</button><button disabled={pending} className="rounded bg-[#168ce4] px-4 py-2" onClick={() => save("active")}>Publicar</button><button className="rounded border border-[#3b4b59] px-4 py-2 xl:hidden" onClick={() => setPreview(true)}>Pré-visualizar</button><button className="rounded border border-[#3b4b59] px-4 py-2" onClick={() => setEditorOpen(false)}>Cancelar</button></div>
          </div>
          <aside className={cn("hidden rounded border border-[#303746] p-5 xl:block", preview && "block")}><div className="mb-4 flex justify-between xl:hidden"><strong>Pré-visualização</strong><button onClick={() => setPreview(false)}>Editar</button></div><h3 className="text-lg font-bold">{title || "Pré-visualização"}</h3><p className="mt-1 text-sm text-[#8b92a3]">{description}</p><div className="mt-5 grid gap-5">{questions.map((question, index) => <QuestionPreview key={index} question={question} />)}</div></aside>
        </div>
      ) : null}

      {sendTemplate ? (
        <div className="mt-5 grid gap-3 border-t border-[#303746] pt-5">
          <h3 className="font-bold">Enviar “{sendTemplate.title}”</h3>
          <input className={inputClass} placeholder="Buscar Clientes" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button className="w-fit text-xs text-[#8fcfff]" onClick={() => setSelected(filteredClients.map((client) => client.id))}>Selecionar todos os filtrados ({filteredClients.length})</button>
          <div className="max-h-48 overflow-auto rounded border border-[#303746] p-2">{filteredClients.map((client) => <label className="block py-1 text-sm" key={client.id}><input checked={selected.includes(client.id)} type="checkbox" onChange={(event) => setSelected((current) => event.target.checked ? [...new Set([...current, client.id])] : current.filter((id) => id !== client.id))} /> {client.displayName} <span className="text-[#8b92a3]">{client.email}</span></label>)}</div>
          <textarea className={cn(inputClass, "min-h-20 py-2")} placeholder="Mensagem" value={message} onChange={(event) => setMessage(event.target.value)} />
          <label className="grid gap-1 text-sm">Prazo opcional<input className={inputClass} type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
          <p className="text-sm text-[#9eabb8]">Confirme o envio para {selected.length} Cliente(s). Uma nova tentativa deste diálogo não criará duplicidade.</p>
          <div className="flex gap-2"><button className="rounded bg-[#168ce4] px-4 py-2" disabled={!selected.length || pending} onClick={send}><Send className="mr-2 inline size-4" />Confirmar envio</button><button className="rounded border border-[#3b4b59] px-4 py-2" onClick={() => setSendTemplate(null)}>Cancelar</button></div>
        </div>
      ) : null}
    </section>
  );
}
