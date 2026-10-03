import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) { return readFileSync(resolve(process.cwd(), path), "utf8"); }

describe("Admin privileged Edge Functions", () => {
  it("requires the Owner session before global session revocation", () => {
    const source = read("supabase/functions/admin-security/index.ts");
    expect(source).toContain('"security.sessions.revoke"');
    expect(source).toContain("caller.auth.getUser()");
    expect(source).toContain("auth.admin.signOut");
    expect(source).toContain("security.session.revoked");
    expect(source).not.toContain("access_token");
  });

  it("limits subscription administration to end-of-cycle cancellation changes", () => {
    const source = read("supabase/functions/admin-subscriptions/index.ts");
    expect(source).toContain('"subscription.cancel.manage"');
    expect(source).toContain('"schedule_cancel"');
    expect(source).toContain('"reverse_cancel"');
    expect(source).toContain("cancel_at_period_end: cancelling");
    expect(source).not.toContain("stripe.subscriptions.cancel");
    expect(source).not.toContain("items:");
  });
});
