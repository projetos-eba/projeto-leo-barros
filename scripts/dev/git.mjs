#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

function commandWorks(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    shell: false,
    stdio: "pipe",
  });
  return !result.error && result.status === 0;
}

function findGit() {
  const explicit = process.env.GIT_BINARY?.trim();
  if (explicit && existsSync(explicit)) return explicit;
  if (commandWorks("git")) return "git";

  const candidates = [
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files\\Git\\bin\\git.exe",
    "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
    "C:\\Program Files (x86)\\Git\\bin\\git.exe",
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

if (args.length === 0) {
  console.error("Uso: npm run git:local -- <comando git>");
  console.error("Exemplo: npm run git:local -- diff --check");
  process.exit(2);
}

const git = findGit();
if (!git) {
  console.error("Git nao encontrado. Instale o Git ou defina GIT_BINARY com o caminho completo do executavel.");
  process.exit(127);
}

const result = spawnSync(git, args, {
  shell: false,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
