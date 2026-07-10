export const BILLING_MANAGEMENT_PATHS = [
  "/parceiros/checkout",
  "/parceiros/checkout/sucesso",
  "/parceiros/configuracoes/assinatura",
] as const;

export function isBillingManagementPath(pathname: string) {
  return BILLING_MANAGEMENT_PATHS.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ));
}
