import { notFound } from "next/navigation";

import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";
import { fetchClientDetailSummary, fetchClientOperationalLinks } from "@/lib/admin/details/application/admin-details-data";

import { ClientDetailView } from "./_components/client-detail-view";

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, authorization] = await Promise.all([params, requireAdminCapability("client.read")]);
  if (!authorization) return <AccessBlocked title="Acesso restrito" description="Sua função não possui acesso ao detalhe operacional de clientes." />;
  const [summary, links] = await Promise.all([fetchClientDetailSummary(id), fetchClientOperationalLinks(id)]);
  if (!summary) notFound();
  return <ClientDetailView patientId={id} summary={summary} links={links} />;
}
