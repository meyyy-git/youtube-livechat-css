#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const skillName = "youtube-livechat-css";
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(packageRoot, "skill");
const userHome = process.env.YOUTUBE_LIVECHAT_SKILL_HOME || homedir();
const targets = [
  ["codex", "Codex", process.env.CODEX_HOME ? join(process.env.CODEX_HOME, "skills") : join(userHome, ".agents", "skills")],
  ["claude", "Claude Code", join(userHome, ".claude", "skills")],
  ["cursor", "Cursor", join(userHome, ".cursor", "skills")],
  ["gemini", "Gemini CLI", join(userHome, ".gemini", "skills")],
  ["opencode", "OpenCode", join(userHome, ".config", "opencode", "skills")],
  ["copilot", "GitHub Copilot", join(userHome, ".copilot", "skills")],
].map(([key, label, skillsDir]) => ({ key, label, skillsDir }));

const args = new Set(process.argv.slice(2));
const validArgs = new Set(["--all", "--force", "--help", "-h", ...targets.map(({ key }) => `--${key}`)]);

if (args.has("--help") || args.has("-h")) {
  console.log(`Install ${skillName} for one or more coding agents.

Usage: npx youtube-livechat-css-skill [targets] [--force]

Targets:
${targets.map(({ key, label }) => `  --${key.padEnd(8)} ${label}`).join("\n")}
  --all      All supported agents

Without a target flag, an interactive checklist is shown.`);
  process.exit(0);
}

for (const arg of args) {
  if (!validArgs.has(arg)) {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }
}

let selected = args.has("--all") ? targets : targets.filter(({ key }) => args.has(`--${key}`));

if (!selected.length) {
  if (!process.stdin.isTTY) {
    console.error("No agent selected. Pass a target flag or --all.");
    process.exit(1);
  }

  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  console.log("Choose agents to install for:");
  targets.forEach(({ label }, index) => console.log(`  ${index + 1}. [ ] ${label}`));

  while (!selected.length) {
    const answer = (await prompt.question('Enter numbers separated by commas, or "all" [1]: ')).trim().toLowerCase() || "1";
    const indexes = answer === "all" ? targets.map((_, index) => index) : [...new Set(answer.split(/[\s,]+/).map(Number).map((number) => number - 1))];

    if (indexes.length && indexes.every((index) => Number.isInteger(index) && targets[index])) {
      selected = indexes.map((index) => targets[index]);
    } else {
      console.error("Invalid selection. Use numbers from the checklist.");
    }
  }

  prompt.close();
}

const installs = selected.map((target) => ({ ...target, destination: join(target.skillsDir, skillName) }));
const conflicts = installs.filter(({ destination }) => existsSync(destination));

if (conflicts.length && !args.has("--force")) {
  conflicts.forEach(({ label, destination }) => console.error(`${label}: already installed at ${destination}`));
  console.error("Re-run with --force to update existing installations.");
  process.exit(1);
}

for (const { label, skillsDir, destination } of installs) {
  mkdirSync(skillsDir, { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
  console.log(`Installed for ${label}: ${destination}`);
}
