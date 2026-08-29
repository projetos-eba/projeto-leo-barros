import { describe, expect, it } from "vitest";

import { isAdminRole, roleHasCapability } from "./capabilities";

describe("Admin capabilities", () => {
  it("gives Owners full access", () => {
    expect(roleHasCapability("owner", "security.sessions.revoke")).toBe(true);
    expect(roleHasCapability("owner", "subscription.cancel.manage")).toBe(true);
  });

  it("keeps sensitive operations exclusive to Owners", () => {
    expect(roleHasCapability("operator", "professional.status.write")).toBe(true);
    expect(roleHasCapability("viewer", "professional.read")).toBe(true);
    expect(roleHasCapability("operator", "audit.read")).toBe(false);
    expect(roleHasCapability("viewer", "settings.manage")).toBe(false);
    expect(roleHasCapability("operator", "subscription.cancel.manage")).toBe(false);
  });

  it("accepts only persisted role values", () => {
    expect(isAdminRole("owner")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(false);
  });
});
