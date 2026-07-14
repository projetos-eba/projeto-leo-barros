import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function readText(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("Playwright MCP local contract", () => {
  const requiredTools = [
    "browser_click",
    "browser_type",
    "browser_fill_form",
    "browser_cookie_set",
  ];

  it("requests full Playwright MCP tool exposure in .mcp.json", () => {
    const config = readJson<{
      mcpServers?: {
        playwright?: { command?: string; tools?: string[]; args?: string[] };
      };
    }>(".mcp.json");

    expect(config.mcpServers?.playwright?.command).toBe("node");
    expect(config.mcpServers?.playwright?.tools).toContain("*");
    expect(config.mcpServers?.playwright?.args?.join(" ")).toContain(
      "node_modules/@playwright/mcp/cli.js",
    );
    expect(config.mcpServers?.playwright?.args).toContain("--headless");
  });

  it("keeps the Playwright MCP check script wired in package.json", () => {
    const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");

    expect(packageJson.scripts?.["mcp:playwright:check"]).toBe(
      "node scripts/dev/check-playwright-mcp.mjs",
    );
  });

  it("documents required discovery hints in scripts, runbooks and skill", () => {
    const script = readText("scripts/dev/check-playwright-mcp.mjs");
    const runbook = readText("docs/runbooks/mcp-local.md");
    const agents = readText("AGENTS.md");
    const skill = readText(".codex/skills/leo-billing-stripe/SKILL.md");

    for (const tool of requiredTools) {
      expect(script).toContain(tool);
      expect(runbook).toContain(tool);
    }

    expect(script).toContain("tool_search");
    expect(runbook).toContain("tool_search");
    expect(agents).toContain("tool_search");
    expect(skill).toContain("tool_search");
  });
});
