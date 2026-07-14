import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredTools = [
  "browser_click",
  "browser_type",
  "browser_fill_form",
  "browser_cookie_set",
];
const discoveryHint =
  "Playwright MCP browser_click browser_type browser_fill_form browser_cookie_set click type fill form set cookie";

const failures = [];
const warnings = [];
const playwrightCliPath = path.join(root, "node_modules", "@playwright", "mcp", "cli.js");

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    failures.push(`Nao foi possivel ler JSON em ${filePath}: ${error.message}`);
    return null;
  }
}

const configPath = path.join(root, ".mcp.json");
const config = readJson(configPath);
const playwrightServer = config?.mcpServers?.playwright;

if (!playwrightServer) {
  failures.push(".mcp.json nao define mcpServers.playwright.");
} else {
  if (playwrightServer.command !== "node") {
    failures.push("mcpServers.playwright.command deve ser node.");
  }

  if (!Array.isArray(playwrightServer.args)) {
    failures.push("mcpServers.playwright.args deve ser uma lista.");
  } else {
    const cliArg = playwrightServer.args.find((arg) =>
      String(arg).includes("@playwright/mcp/cli.js"),
    );
    if (!cliArg) {
      failures.push("mcpServers.playwright.args deve apontar para node_modules/@playwright/mcp/cli.js.");
    }
  }

  if (!Array.isArray(playwrightServer.tools) || !playwrightServer.tools.includes("*")) {
    failures.push('mcpServers.playwright.tools deve incluir "*" para solicitar exposicao completa.');
  }
}

let versionOutput = "";
try {
  versionOutput = execFileSync(process.execPath, [playwrightCliPath, "--version"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
} catch (error) {
  failures.push(`node node_modules/@playwright/mcp/cli.js --version falhou: ${error.message}`);
}

const readmePath = path.join(root, "node_modules", "@playwright", "mcp", "README.md");
if (!existsSync(readmePath)) {
  failures.push("node_modules/@playwright/mcp/README.md nao foi encontrado. Execute npm install.");
} else {
  const readme = readFileSync(readmePath, "utf8");
  for (const tool of requiredTools) {
    if (!readme.includes(tool)) {
      failures.push(`@playwright/mcp instalado nao documenta a ferramenta ${tool}.`);
    }
  }
}

const configTypesPath = path.join(root, "node_modules", "@playwright", "mcp", "config.d.ts");
if (existsSync(configTypesPath)) {
  const configTypes = readFileSync(configTypesPath, "utf8");
  for (const capability of ["core-input", "storage"]) {
    if (!configTypes.includes(`'${capability}'`)) {
      warnings.push(`Capacidade ${capability} nao apareceu em config.d.ts.`);
    }
  }
} else {
  warnings.push("node_modules/@playwright/mcp/config.d.ts nao foi encontrado.");
}

for (const warning of warnings) {
  console.warn(`[playwright-mcp:warn] ${warning}`);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[playwright-mcp:error] ${failure}`);
  }
  process.exit(1);
}

console.log(`Playwright MCP OK${versionOutput ? ` (${versionOutput})` : ""}.`);
console.log(`Ferramentas criticas documentadas no pacote: ${requiredTools.join(", ")}.`);
console.log(`Se o cliente Codex nao expuser essas acoes, use tool_search com: "${discoveryHint}".`);
console.log("Se browser_cookie_set ainda nao aparecer no cliente, use browser_run_code_unsafe ou storage-state como fallback documentado.");
