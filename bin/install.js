#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const skillName = "youtube-livechat-css";
const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  console.log(`Install ${skillName} into $CODEX_HOME/skills.\n\nUsage: npx youtube-livechat-css-skill [--force]`);
  process.exit(0);
}

for (const arg of args) {
  if (arg !== "--force") {
    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }
}

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(packageRoot, "skill");
const skillsDir = join(process.env.CODEX_HOME || join(homedir(), ".codex"), "skills");
const target = join(skillsDir, skillName);

if (existsSync(target) && !args.has("--force")) {
  console.error(`${skillName} is already installed at ${target}. Re-run with --force to update it.`);
  process.exit(1);
}

mkdirSync(skillsDir, { recursive: true });
cpSync(source, target, { recursive: true, force: true });
console.log(`Installed ${skillName} to ${target}`);
