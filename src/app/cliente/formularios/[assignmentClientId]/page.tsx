import { notFound } from "next/navigation";

import { fetchClientFormDetail } from "@/lib/clients/forms-data";

import { ClientFormResponseView } from "./client-form-response-view";

type ClienteFormularioPageProps = {
  params: Promise<{
    assignmentClientId: string;
  }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const dynamic = "force-dynamic";

export default async function ClienteFormularioPage({ params }: ClienteFormularioPageProps) {
  const { assignmentClientId } = await params;
  if (!uuidPattern.test(assignmentClientId)) notFound();

  const form = await fetchClientFormDetail(assignmentClientId);
  if (!form) notFound();

  return <ClientFormResponseView form={form} />;
}
