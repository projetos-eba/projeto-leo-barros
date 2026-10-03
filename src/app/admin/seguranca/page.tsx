import { AccessBlocked } from "@/components/auth/access-blocked";
import { recordAdminAuditEvent } from "@/lib/admin/audit/application/admin-audit-service";
import { requireAdminCapability } from "@/lib/admin/authorization/application/admin-authorization-service";
import { fetchAdminSecurityData } from "@/lib/admin/security/application/admin-security-data";

import { AdminSecurityView } from "./_components/admin-security-view";

export const dynamic = "force-dynamic";
export default async function AdminSecurityPage() { const authorization = await requireAdminCapability("security.read"); if (!authorization) return <AccessBlocked title="Acesso restrito" description="Somente Owners podem consultar a área de segurança." />; const data = await fetchAdminSecurityData(); await recordAdminAuditEvent({ actorProfileId: authorization.profileId, actionKey: "admin.critical_data.viewed", resourceType: "security", metadata: { view: "security" } }); return <AdminSecurityView {...data} />; }
