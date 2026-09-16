"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isBillingManagementPath, isPartnerSettingsPath } from "@/lib/billing/entitlement";

import { AuthenticatedShell } from "./authenticated-shell";
import { PartnerBillingShell } from "./partner-billing-shell";
import { PartnerSettingsShell } from "./partner-settings-shell";

type PartnerShellRouterProps = {
  accountName?: string | null;
  children: ReactNode;
  hasActivePlan: boolean;
};

export function PartnerShellRouter({ accountName, children, hasActivePlan }: PartnerShellRouterProps) {
  const pathname = usePathname() ?? "";
  const isBillingPath = isBillingManagementPath(pathname);
  const isSettingsPath = isPartnerSettingsPath(pathname);

  if (isSettingsPath && hasActivePlan) {
    return <PartnerSettingsShell accountName={accountName}>{children}</PartnerSettingsShell>;
  }

  if (isBillingPath) {
    return <PartnerBillingShell accountName={accountName} hasActivePlan={hasActivePlan}>{children}</PartnerBillingShell>;
  }

  return <AuthenticatedShell accountName={accountName} hasActivePlan={hasActivePlan} profile="parceiros">{children}</AuthenticatedShell>;
}
