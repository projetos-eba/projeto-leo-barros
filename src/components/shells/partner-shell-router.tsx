"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isBillingManagementPath, isPartnerSettingsPath } from "@/lib/billing/entitlement";

import { AuthenticatedShell } from "./authenticated-shell";
import { PartnerBillingShell } from "./partner-billing-shell";
import { PartnerPlansSidebarItem } from "./partner-plans-sidebar-item";
import { PartnerSettingsShell } from "./partner-settings-shell";

type PartnerShellRouterProps = {
  children: ReactNode;
  hasActivePlan: boolean;
};

export function PartnerShellRouter({ children, hasActivePlan }: PartnerShellRouterProps) {
  const pathname = usePathname() ?? "";
  const isBillingPath = isBillingManagementPath(pathname);
  const isSettingsPath = isPartnerSettingsPath(pathname);

  if (isSettingsPath && hasActivePlan) {
    return <PartnerSettingsShell>{children}</PartnerSettingsShell>;
  }

  if (isBillingPath) {
    return <PartnerBillingShell>{children}</PartnerBillingShell>;
  }

  return (
    <AuthenticatedShell profile="parceiros">
      <PartnerPlansSidebarItem />
      {children}
    </AuthenticatedShell>
  );
}