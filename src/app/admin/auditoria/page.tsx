import { AccessBlocked } from "@/components/auth/access-blocked";
import { fetchAdminAuditEvents } from "@/lib/admin/audit/application/admin-audit-data";
import { recordAdminAuditEvent } from "@/lib/admin/audit/application/admin-audit-service";
import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";

import { AdminAuditView } from "./_components/admin-audit-view";

export const dynamic = "force-dynamic";
export default async function AdminAuditPage() {
  const authorization = await requireAdminCapability("audit.read");
  if (!authorization) return <AccessBlocked title="Acesso restrito" description="Somente Owners podem consultar a auditoria administrativa." />;
  const events = await fetchAdminAuditEvents();
  await recordAdminAuditEvent({ actorProfileId: authorization.profileId, actionKey: "admin.critical_data.viewed", resourceType: "admin_audit_events", metadata: { view: "audit" } });
  return <AdminAuditView events={events} />;
}
