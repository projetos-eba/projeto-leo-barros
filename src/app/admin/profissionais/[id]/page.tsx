import { notFound } from "next/navigation";

import { AccessBlocked } from "@/components/auth/access-blocked";
import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";
import { fetchProfessionalDetailSummary, fetchProfessionalDetailTab, isProfessionalDetailTab } from "@/lib/admin/details/application/admin-details-data";

import { ProfessionalDetailView } from "./_components/professional-detail-view";

export const dynamic = "force-dynamic";

export default async function AdminProfessionalDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab: requestedTab }, authorization] = await Promise.all([params, searchParams, requireAdminCapability("professional.read")]);
  if (!authorization) return <AccessBlocked title="Acesso restrito" description="Sua função não possui acesso ao detalhe operacional de profissionais." />;
  const tab = isProfessionalDetailTab(requestedTab) ? requestedTab : "overview";
  const [summary, tabData] = await Promise.all([fetchProfessionalDetailSummary(id), fetchProfessionalDetailTab(id, tab)]);
  if (!summary) notFound();
  return <ProfessionalDetailView partnerId={id} summary={summary} tab={tab} tabData={tabData} canChangeStatus={authorization.can("professional.status.write")} canManageSubscription={authorization.can("subscription.cancel.manage")} />;
}
