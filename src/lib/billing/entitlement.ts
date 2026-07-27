export const BILLING_MANAGEMENT_PATHS = [
  "/parceiros/checkout",
  "/parceiros/checkout/sucesso",
  "/parceiros/configuracoes/assinatura",
] as const;

export const PARTNER_SETTINGS_PATH = "/parceiros/configuracoes";

// A regularização da conta não pode depender de uma assinatura já ativa. Estas
// rotas permitem ao parceiro consultar a conta, alterar dados de segurança e
// recuperar a assinatura sem expor os módulos operacionais.
export const PARTNER_ROUTES_AVAILABLE_WITHOUT_ACTIVE_PLAN = [
  "/parceiros/checkout",
  PARTNER_SETTINGS_PATH,
] as const;

export function isBillingManagementPath(pathname: string) {
  return BILLING_MANAGEMENT_PATHS.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ));
}

export function isPartnerSettingsPath(pathname: string) {
  return pathname === PARTNER_SETTINGS_PATH || pathname.startsWith(`${PARTNER_SETTINGS_PATH}/`);
}

export function isPartnerRouteAvailableWithoutActivePlan(pathname: string) {
  return PARTNER_ROUTES_AVAILABLE_WITHOUT_ACTIVE_PLAN.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ));
}
