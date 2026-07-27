import { describe, expect, it } from "vitest";

import {
  isPartnerRouteAvailableWithoutActivePlan,
} from "./entitlement";

describe("partner entitlement routing", () => {
  it.each([
    "/parceiros/checkout",
    "/parceiros/checkout/sucesso",
    "/parceiros/configuracoes",
    "/parceiros/configuracoes/assinatura",
    "/parceiros/configuracoes/geral",
  ])("keeps %s available to a partner without an active plan", (pathname) => {
    expect(isPartnerRouteAvailableWithoutActivePlan(pathname)).toBe(true);
  });

  it.each([
    "/parceiros/dashboard",
    "/parceiros/clientes",
    "/parceiros/agenda",
    "/parceiros/materiais",
  ])("keeps operational route %s behind an active plan", (pathname) => {
    expect(isPartnerRouteAvailableWithoutActivePlan(pathname)).toBe(false);
  });
});
