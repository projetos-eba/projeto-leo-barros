<<<<<<< HEAD
import Link from "next/link";
import { CheckCircle2, FileText, Send } from "lucide-react";

import { fetchClientForms } from "@/lib/clients/forms-data";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const statusLabels: Record<string, string> = {
  assigned: "Novo",
  in_progress: "Em andamento",
  opened: "Aberto",
  submitted: "Respondido",
};
=======
import { fetchClientForms } from "@/lib/clients/forms-data";

import { ClientFormsView } from "./client-forms-view";
>>>>>>> origin/main

export const dynamic = "force-dynamic";

export default async function ClienteFormulariosPage() {
  const forms = await fetchClientForms();
<<<<<<< HEAD
  const pendingCount = forms.filter((form) => form.status !== "submitted").length;

  return (
    <div className="min-h-[calc(100vh-81px)] bg-[#07141d] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#8fcfff]">Acompanhamento</p>
            <h1 className="mt-2 text-[34px] font-bold leading-tight">Formulários</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#9fb1c0]">
              Responda os check-ins e questionários enviados pelo seu profissional.
            </p>
          </div>
          <div className="rounded-[10px] border border-[#263949] bg-[#0d1822] px-4 py-3 text-right">
            <p className="text-[22px] font-bold text-white">{pendingCount}</p>
            <p className="text-[12px] text-[#8ea0ae]">pendente(s)</p>
          </div>
        </div>

        <div className="mt-7 grid gap-3">
          {forms.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#263949] bg-[#0d1822] p-8 text-center">
              <FileText className="mx-auto size-10 text-[#8fcfff]" />
              <h2 className="mt-4 text-[22px] font-bold">Nenhum formulário por enquanto</h2>
              <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[#9fb1c0]">
                Quando um novo formulário for enviado, ele aparecerá aqui.
              </p>
            </div>
          ) : forms.map((form) => {
            const submitted = form.status === "submitted";
            return (
              <Link
                className={cn(
                  "grid gap-4 rounded-[14px] border bg-[#0d1822] p-5 transition hover:border-[#3b97e3] sm:grid-cols-[1fr_auto] sm:items-center",
                  submitted ? "border-[#25563b]" : "border-[#263949]",
                )}
                href={`/cliente/formularios/${form.assignmentClientId}`}
                key={form.assignmentClientId}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex size-9 items-center justify-center rounded-[9px]", submitted ? "bg-[#0d3924] text-[#62d98b]" : "bg-[#12385a] text-[#8fcfff]")}>
                      {submitted ? <CheckCircle2 className="size-5" /> : <Send className="size-5" />}
                    </span>
                    <h2 className="min-w-0 truncate text-[18px] font-bold">{form.title}</h2>
                  </div>
                  {form.message ? <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-[#9fb1c0]">{form.message}</p> : null}
                  <p className="mt-3 text-[12px] text-[#758899]">
                    {dateFormatter.format(new Date(form.createdAt))} • {form.questionCount} pergunta(s)
                  </p>
                </div>
                <span className={cn("inline-flex h-8 items-center justify-center rounded-[8px] border px-3 text-[12px] font-semibold", submitted ? "border-[#25563b] text-[#62d98b]" : "border-[#2f82bf] text-[#8fcfff]")}>
                  {statusLabels[form.status] ?? form.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
=======
  return <ClientFormsView forms={forms} />;
>>>>>>> origin/main
}
