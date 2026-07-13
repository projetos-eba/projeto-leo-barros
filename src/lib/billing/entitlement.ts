export const BILLING_MANAGEMENT_PATHS = [
  "/parceiros/checkout",
  "/parceiros/checkout/sucesso",
  "/parceiros/configuracoes/assinatura",
] as const;

export const PARTNER_SETTINGS_PATH = "/parceiros/configuracoes";

export function isBillingManagementPath(pathname: string) {
  return BILLING_MANAGEMENT_PATHS.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ));
}

export function isPartnerSettingsPath(pathname: string) {
  return pathname === PARTNER_SETTINGS_PATH || pathname.startsWith(`${PARTNER_SETTINGS_PATH}/`);
}
