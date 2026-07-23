"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";

import type { ClientFormDetail, ClientFormQuestion } from "@/lib/clients/forms-data";
import { cn } from "@/lib/utils";

import { saveClientFormResponse } from "../actions";

type ClientFormResponseViewProps = {
  form: ClientFormDetail;
};

type AnswerValue = string | string[] | number | boolean;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function normalizeAnswer(value: unknown): AnswerValue {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "number" || typeof value === "boolean") return value;
  return value === undefined || value === null ? "" : String(value);
}

function inputClass(className?: string) {
  return cn("w-full rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[16px] text-white outline-none placeholder:text-[#607386] focus:border-[#3b97e3]", className);
}

function QuestionInput({
  answer,
  disabled,
  onAnswer,
  question,
}: {
  answer: AnswerValue;
  disabled: boolean;
  onAnswer: (value: AnswerValue) => void;
  question: ClientFormQuestion;
}) {
  if (question.type === "text_long") {
    return <textarea className={inputClass("min-h-[190px] py-4 leading-7")} disabled={disabled} value={String(answer)} onChange={(event) => onAnswer(event.target.value)} />;
  }

  if (question.type === "single_choice") {
    return (
      <div className="grid gap-3">
        {question.options.map((option) => (
          <button
            className={cn("rounded-[10px] border px-4 py-3 text-left text-[15px] font-semibold transition", answer === option ? "border-[#3b97e3] bg-[#12385a] text-white" : "border-[#263949] bg-[#0d1822] text-[#d8e8f4]")}
            disabled={disabled}
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    const selected = Array.isArray(answer) ? answer : [];
    return (
      <div className="grid gap-3">
        {question.options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label className={cn("flex items-center gap-3 rounded-[10px] border px-4 py-3 text-[15px] font-semibold", checked ? "border-[#3b97e3] bg-[#12385a] text-white" : "border-[#263949] bg-[#0d1822] text-[#d8e8f4]")} key={option}>
              <input
                checked={checked}
                disabled={disabled}
                type="checkbox"
                onChange={(event) => onAnswer(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))}
              />
              {option}
            </label>
          );
        })}
      </div>
    );
  }

  if (question.type === "scale") {
    const numeric = typeof answer === "number" ? answer : Number(answer || 0);
    return (
      <div>
        <input className="w-full accent-[#3b97e3]" disabled={disabled} max={10} min={0} type="range" value={numeric} onChange={(event) => onAnswer(Number(event.target.value))} />
        <div className="mt-4 flex justify-between text-[13px] text-[#8ea0ae]">
          <span>0</span>
          <span className="rounded-[8px] bg-[#12385a] px-3 py-1 text-white">{numeric}</span>
          <span>10</span>
        </div>
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Sim", value: true },
          { label: "Não", value: false },
        ].map((option) => (
          <button
            className={cn("h-12 rounded-[10px] border text-[15px] font-bold", answer === option.value ? "border-[#3b97e3] bg-[#12385a] text-white" : "border-[#263949] bg-[#0d1822] text-[#d8e8f4]")}
            disabled={disabled}
            key={option.label}
            type="button"
            onClick={() => onAnswer(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "number") {
    return <input className={inputClass("h-12")} disabled={disabled} inputMode="decimal" type="number" value={String(answer)} onChange={(event) => onAnswer(Number(event.target.value))} />;
  }

  if (question.type === "date") {
    return <input className={inputClass("h-12")} disabled={disabled} type="date" value={String(answer)} onChange={(event) => onAnswer(event.target.value)} />;
  }

  return <input className={inputClass("h-12")} disabled={disabled} value={String(answer)} onChange={(event) => onAnswer(event.target.value)} />;
}

export function ClientFormResponseView({ form }: ClientFormResponseViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const submitted = form.status === "submitted";
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(() => Object.fromEntries(
    form.questions.map((question) => [question.id, normalizeAnswer(form.answers[question.id])]),
  ));
  const [index, setIndex] = useState(0);
  const question = form.questions[index] ?? null;
  const progress = form.questions.length > 0 ? Math.round(((index + 1) / form.questions.length) * 100) : 100;

  const answerList = useMemo(() => Object.entries(answers).map(([questionId, value]) => ({ questionId, value })), [answers]);

  function updateAnswer(questionId: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function persist(submit: boolean) {
    if (submit) {
      const missing = form.questions.find((item) => {
        const answer = answers[item.id];
        return item.required && (answer === "" || answer === undefined || (Array.isArray(answer) && answer.length === 0));
      });
      if (missing) {
        window.alert("Responda as perguntas obrigatórias antes de finalizar.");
        setIndex(form.questions.findIndex((item) => item.id === missing.id));
        return;
      }
    }

    startTransition(async () => {
      const result = await saveClientFormResponse({ answers: answerList, assignmentClientId: form.assignmentClientId, submit });
      if (!result.ok) {
        window.alert(result.error ?? "Não foi possível salvar suas respostas.");
        return;
      }
      if (submit) router.push("/cliente/formularios");
      else router.refresh();
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (index < form.questions.length - 1) {
      setIndex((current) => current + 1);
      return;
    }
    persist(true);
  }

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[900px]">
        <Link className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#8fcfff] hover:text-white" href="/cliente/formularios">
          <ArrowLeft className="size-4" />
          Voltar para formulários
        </Link>

        <div className="mt-7 overflow-hidden rounded-[18px] border border-[#263949] bg-[#0b1823] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="border-b border-[#263949] p-5">
            <div className="h-2 overflow-hidden rounded-full bg-[#07141d]">
              <span className="block h-full rounded-full bg-[#3b97e3]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8fcfff]">{dateFormatter.format(new Date(form.createdAt))}</p>
                <h1 className="mt-2 text-[30px] font-bold leading-tight">{form.title}</h1>
                {form.message ? <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#9fb1c0]">{form.message}</p> : null}
              </div>
              {submitted ? <span className="rounded-[8px] border border-[#25563b] px-3 py-2 text-[12px] font-bold text-[#62d98b]">Respondido</span> : null}
            </div>
          </div>

          {question ? (
            <form className="p-6 sm:p-8" onSubmit={handleSubmit}>
              <p className="text-[13px] font-semibold text-[#8ea0ae]">Pergunta {index + 1} de {form.questions.length}</p>
              <h2 className="mt-3 text-[28px] font-bold leading-tight">{question.prompt}</h2>
              {question.helpText ? <p className="mt-2 text-[14px] leading-6 text-[#9fb1c0]">{question.helpText}</p> : null}
              <div className="mt-8">
                <QuestionInput
                  answer={answers[question.id] ?? ""}
                  disabled={pending || submitted}
                  question={question}
                  onAnswer={(value) => updateAnswer(question.id, value)}
                />
              </div>

              <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
                <button
                  className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[14px] font-bold text-[#d8e8f4] disabled:opacity-50"
                  disabled={index === 0 || pending}
                  type="button"
                  onClick={() => setIndex((current) => Math.max(0, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </button>
                <div className="flex flex-wrap gap-3">
                  {!submitted ? (
                    <button
                      className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 text-[14px] font-bold text-[#d8e8f4] disabled:opacity-50"
                      disabled={pending}
                      type="button"
                      onClick={() => persist(false)}
                    >
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Salvar
                    </button>
                  ) : null}
                  <button
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f8dff] px-5 text-[14px] font-bold text-white disabled:opacity-50"
                    disabled={pending || submitted}
                    type="submit"
                  >
                    {index === form.questions.length - 1 ? <Check className="size-4" /> : <ChevronRight className="size-4" />}
                    {index === form.questions.length - 1 ? "Finalizar" : "Próxima"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center text-[#9fb1c0]">Este formulário não possui perguntas.</div>
          )}
        </div>
      </div>
    </div>
  );
}
