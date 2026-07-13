import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sensitiveResponseFragments = [
  "action_link",
  "access_token",
  "refresh_token",
  "hashed_token",
];

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("contrato das Edge Functions de auth publico", () => {
  it("registra cadastro publico e primeiro acesso como funcoes publicas controladas", () => {
    const config = readProjectFile("supabase/config.toml");

    expect(config).toContain("[functions.signup-partner]");
    expect(config).toContain("[functions.complete-client-first-access]");
    expect(config).toContain("[functions.check-email-verification-status]");
    expect(config).toMatch(
      /\[functions\.signup-partner\]\s+verify_jwt = false/s,
    );
    expect(config).toMatch(
      /\[functions\.complete-client-first-access\]\s+verify_jwt = false/s,
    );
    expect(config).toMatch(
      /\[functions\.check-email-verification-status\]\s+verify_jwt = false/s,
    );
  });

  it("mantem service role somente nas Edge Functions privilegiadas de auth", () => {
    const signup = readProjectFile("supabase/functions/signup-partner/index.ts");
    const firstAccess = readProjectFile(
      "supabase/functions/complete-client-first-access/index.ts",
    );
    const verificationStatus = readProjectFile(
      "supabase/functions/check-email-verification-status/index.ts",
    );
    const accountActions = readProjectFile("src/app/login/account-actions.ts");

    expect(signup).toContain("getSupabaseAdminEnv");
    expect(firstAccess).toContain("getSupabaseAdminEnv");
    expect(verificationStatus).toContain("getSupabaseAdminEnv");
    expect(accountActions).not.toContain("getSupabaseAdminEnv");
    expect(accountActions).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("nao retorna tokens ou links sensiveis nas respostas das funcoes publicas", () => {
    const signup = readProjectFile("supabase/functions/signup-partner/index.ts");
    const firstAccess = readProjectFile(
      "supabase/functions/complete-client-first-access/index.ts",
    );
    const verificationStatus = readProjectFile(
      "supabase/functions/check-email-verification-status/index.ts",
    );

    for (const fragment of sensitiveResponseFragments) {
      expect(signup.toLowerCase()).not.toContain(fragment);
      expect(firstAccess.toLowerCase()).not.toContain(fragment);
      expect(verificationStatus.toLowerCase()).not.toContain(fragment);
    }
  });

  it("mantem rollback no cadastro publico de Parceiro quando ha falha parcial", () => {
    const signup = readProjectFile("supabase/functions/signup-partner/index.ts");

    expect(signup).toContain("rollbackSignup");
    expect(signup).toContain(".from(\"partners\").delete()");
    expect(signup).toContain(".from(\"profiles\").delete()");
    expect(signup).toContain("auth.admin.deleteUser");
  });

  it("preserva senha sem trim nas funcoes que fazem cadastro ou primeiro acesso", () => {
    const signup = readProjectFile("supabase/functions/signup-partner/index.ts");
    const firstAccess = readProjectFile(
      "supabase/functions/complete-client-first-access/index.ts",
    );

    expect(signup).toContain("const password = rawStringValue(rawBody.password)");
    expect(firstAccess).toContain("const password = rawStringValue(rawBody.password)");
    expect(firstAccess).toContain(
      "const confirmPassword = rawStringValue(rawBody.confirmPassword)",
    );
  });

  it("mantem destino segmentado na confirmacao e no checkout de Parceiro", () => {
    const confirmationPage = readProjectFile(
      "src/app/auth/confirmar-email/page.tsx",
    );
    const confirmationView = readProjectFile(
      "src/components/auth/email-confirmation-status-view.tsx",
    );
    const partnerBillingShell = readProjectFile(
      "src/components/shells/partner-billing-shell.tsx",
    );
    const loginActions = readProjectFile("src/app/login/actions.ts");
    const partnerLoginPage = readProjectFile(
      "src/app/login/parceiros/page.tsx",
    );
    const partnerSignupPage = readProjectFile(
      "src/app/login/parceiros/cadastro/page.tsx",
    );
    const pendingView = readProjectFile(
      "src/components/auth/email-verification-pending-view.tsx",
    );

    expect(confirmationPage).toContain("loginHref={result.loginHref}");
    expect(confirmationView).not.toContain('href="/login">Ir para o login');
    expect(partnerBillingShell).toContain("logoutPartner");
    expect(loginActions).toContain('redirect("/login/parceiros")');
    expect(loginActions).toContain('redirect("/login/admin")');
    expect(partnerLoginPage).toContain("encodeURIComponent(safeNext)");
    expect(partnerSignupPage).toContain("<PartnerSignupView next={safeNext}");
    expect(pendingView).toContain("loginWithPassword");
    expect(pendingView).toContain("router.refresh()");
  });

  it("aplica cooldown de reenvio tambem no backend", () => {
    const resendFunction = readProjectFile(
      "supabase/functions/send-verification-email/index.ts",
    );

    expect(resendFunction).toContain("RESEND_COOLDOWN_SECONDS = 60");
    expect(resendFunction).toContain("secondsSinceLastSend");
    expect(resendFunction).toContain("return response(429");
  });
});
