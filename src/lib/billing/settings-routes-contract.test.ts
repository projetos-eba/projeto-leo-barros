import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("partner settings routes contract", () => {
  it("mantem area propria de configuracoes com rota geral e assinatura", () => {
    const indexPage = read("src/app/parceiros/configuracoes/page.tsx");
    const generalPage = read("src/app/parceiros/configuracoes/geral/page.tsx");
    const shell = read("src/components/shells/partner-settings-shell.tsx");
    const shellRouter = read("src/components/shells/partner-shell-router.tsx");
    const partnerLayout = read("src/app/parceiros/layout.tsx");

    expect(indexPage).toContain('redirect("/parceiros/configuracoes/geral")');
    expect(generalPage).toContain("Dados profissionais");
    expect(shell).toContain("/parceiros/configuracoes/geral");
    expect(shell).toContain("/parceiros/configuracoes/assinatura");
    expect(shell).toContain("/parceiros/dashboard");
    expect(partnerLayout).toContain("PartnerShellRouter");
    expect(shellRouter).toContain("usePathname");
    expect(shellRouter).toContain("isSettingsPath && hasActivePlan");
    expect(shellRouter).toContain('<AuthenticatedShell profile="parceiros">');
  });
});
