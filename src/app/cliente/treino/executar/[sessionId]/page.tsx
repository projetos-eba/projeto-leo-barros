import Link from "next/link";

import { fetchClientWorkoutExecution } from "@/lib/clients/workout-data";

import { ClientWorkoutExecutionView } from "./client-workout-execution-view";

export const dynamic = "force-dynamic";

type ClienteTreinoExecutarPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ClienteTreinoExecutarPage({ params }: ClienteTreinoExecutarPageProps) {
  const { sessionId } = await params;
  const result = await fetchClientWorkoutExecution(sessionId);

  if (!result) {
    return (
      <div className="min-h-[calc(100vh-81px)] bg-[#0b1720] px-5 py-10 text-white">
        <div className="mx-auto max-w-[780px] rounded-[14px] border border-[#213444] bg-[#101a25] p-8 text-center">
          <h1 className="text-[28px] font-bold">Sessão de treino não encontrada</h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-6 text-[#9fb1c0]">
            Inicie o treino pelo painel para continuar registrando suas séries.
          </p>
          <Link className="mt-6 inline-flex h-11 items-center rounded-[10px] bg-[#1f8dff] px-5 text-[14px] font-bold" href="/cliente/treino">
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  return <ClientWorkoutExecutionView execution={result.execution} />;
}
