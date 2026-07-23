"use client";

import { CheckCircle2, FileText, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ClientFormsData } from "@/lib/clients/forms-data";
import { cn } from "@/lib/utils";

import { submitClientFormResponse } from "./actions";

export function ClientFormsView({ forms }: { forms: ClientFormsData }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(forms.forms[0]?.assignmentClientId ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const activeForm = forms.forms.find((form) => form.assignmentClientId === activeId) ?? forms.forms[0] ?? null;

  function submit() {
    if (!activeForm) return;
    startTransition(() => {
      void submitClientFormResponse({
        answers,
        assignmentClientId: activeForm.assignmentClientId,
      }).then((result) => {
        setMessage(result.ok ? result.message ?? "Respostas enviadas." : result.error ?? "Não foi possível enviar.");
        if (result.ok) {
          setAnswers({});
          router.refresh();
        }
      });
    });
  }

  return (
    <main className="min-h-screen bg-[#07141d] px-5 py-8 text-white">
      <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[10px] border border-[#23394a] bg-[#0b1b27] p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#082a43] text-[#55b4ff]">
              <FileText className="size-5" />
            </span>
            <div>
              <h1 className="text-[20px] font-bold">Formulários</h1>
              <p className="text-[12px] text-[#9fb1c0]">Responda aos envios do seu profissional.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {forms.forms.length === 0 ? (
              <p className="rounded-[8px] border border-dashed border-[#2d4354] px-3 py-8 text-center text-[13px] text-[#8b92a3]">
                Nenhum formulário disponível.
              </p>
            ) : forms.forms.map((form) => (
              <button
                className={cn(
                  "rounded-[8px] border p-3 text-left transition",
                  activeForm?.assignmentClientId === form.assignmentClientId
                    ? "border-[#3b97e3] bg-[#0d2b43]"
                    : "border-[#263846] bg-[#07131d] hover:border-[#3b97e3]",
                )}
                key={form.assignmentClientId}
                type="button"
                onClick={() => setActiveId(form.assignmentClientId)}
              >
                <span className="block text-[13px] font-semibold">{form.title}</span>
                <span className="mt-1 block text-[12px] text-[#8b92a3]">
                  {form.status === "answered" ? "Respondido" : "Pendente"}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[10px] border border-[#23394a] bg-[#0b1b27] p-5">
          {message ? <p className="mb-4 rounded-[8px] border border-[#2d4354] bg-[#07131d] px-4 py-3 text-[13px] text-[#8fcfff]">{message}</p> : null}
          {!activeForm ? (
            <div className="grid min-h-[420px] place-items-center text-center">
              <div>
                <FileText className="mx-auto size-10 text-[#55b4ff]" />
                <p className="mt-3 text-[14px] text-[#9fb1c0]">Tudo em dia por aqui.</p>
              </div>
            </div>
          ) : activeForm.response ? (
            <div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-7 text-[#62d98b]" />
                <div>
                  <h2 className="text-[24px] font-bold">{activeForm.title}</h2>
                  <p className="text-[13px] text-[#9fb1c0]">Suas respostas já foram enviadas.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                {activeForm.questions.map((question) => (
                  <article className="rounded-[8px] border border-[#263846] bg-[#07131d] p-4" key={question.id}>
                    <h3 className="text-[14px] font-bold">{question.label}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#d8e5ee]">{activeForm.response?.[question.id] ?? "Sem resposta"}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-[28px] font-bold">{activeForm.title}</h2>
              {activeForm.description ? <p className="mt-2 text-[14px] leading-6 text-[#9fb1c0]">{activeForm.description}</p> : null}
              <div className="mt-7 grid gap-6">
                {activeForm.questions.map((question, index) => (
                  <label className="grid gap-2" key={question.id}>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#8b92a3]">Pergunta {index + 1}</span>
                    <span className="text-[18px] font-bold">{question.label}</span>
                    <textarea
                      className="min-h-[130px] rounded-[10px] border border-[#303746] bg-[#07131d] px-4 py-3 text-[14px] leading-6 text-white outline-none focus:border-[#3b97e3]"
                      value={answers[question.id] ?? ""}
                      onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    />
                  </label>
                ))}
              </div>
              <button
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[#3b97e3] px-5 text-[14px] font-semibold text-white transition hover:bg-[#55a8eb] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending || activeForm.questions.some((question) => !answers[question.id]?.trim())}
                type="button"
                onClick={submit}
              >
                <Send className="size-4" />
                Enviar respostas
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
