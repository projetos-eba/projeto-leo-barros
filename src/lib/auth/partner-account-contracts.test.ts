import { describe, expect, it } from "vitest";

import {
  formatPartnerPhone,
  normalizePartnerPhone,
  partnerAccountSchema,
} from "./partner-account-contracts";

describe("partner account contracts", () => {
  it("mascara telefone brasileiro com DDI e normaliza para E.164", () => {
    expect(formatPartnerPhone("+5511999998888")).toBe("+55 (11) 99999-8888");
    expect(formatPartnerPhone("11999998888")).toBe("+55 (11) 99999-8888");
    expect(normalizePartnerPhone("+55 (11) 99999-8888")).toBe("+5511999998888");
  });

  it("exige tipo e número de registro em conjunto", () => {
    const result = partnerAccountSchema.safeParse({
      displayName: "Profissional",
      phone: "+5511999998888",
      professionalType: "nutricionista",
      professionalRegistryType: "crn",
      professionalRegistryNumber: "",
    });

    expect(result.success).toBe(false);
  });
});
