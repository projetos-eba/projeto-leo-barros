import { describe, expect, it } from "vitest";
import { clientBioSchema, clientProfileEditorSchema } from "./client-profile-editor";
const bio = { birthDate: "2000-01-01", biologicalSex: "not_informed", objective: "Hipertrofia" };
describe("client profile validation", () => {
  it("rejects impossible/future dates and empty objectives", () => {
    for (const birthDate of ["2000-02-31", "2999-01-01", "invalid"]) expect(clientBioSchema.safeParse({ ...bio, birthDate }).success).toBe(false);
    expect(clientBioSchema.safeParse({ ...bio, objective: "  " }).success).toBe(false);
  });
  it("accepts international or empty phone without accepting credential fields", () => {
    const data = { ...bio, displayName: "Cliente", patientId: "a1000000-0000-4000-8000-000000000301", phone: "+5511999999999", email: "changed@example.invalid", role: "admin" };
    expect(clientProfileEditorSchema.parse(data)).not.toHaveProperty("email");
    expect(clientProfileEditorSchema.parse(data)).not.toHaveProperty("role");
    expect(clientProfileEditorSchema.safeParse({ ...data, phone: "" }).success).toBe(true);
    expect(clientProfileEditorSchema.safeParse({ ...data, phone: "123" }).success).toBe(false);
  });
});
