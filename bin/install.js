#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { emitKeypressEvents } from "node:readline";
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
const checkboxHint = "Up/Down move | Space toggle | A all | Enter install";

function chooseTargets() {
  const { stdin, stdout } = process;
  if (!stdin.isTTY || !stdout.isTTY || typeof stdin.setRawMode !== "function") {
    console.error("Interactive checkbox unavailable. Pass a target flag or --all.");
    process.exit(1);
  }

  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();

  const checked = new Set([0]);
  let cursor = 0;
  let drawn = false;

  const render = () => {
    if (drawn) stdout.write(`\x1b[${targets.length}A`);
    targets.forEach(({ label }, index) => {
      stdout.write(`\r\x1b[2K${index === cursor ? ">" : " "} [${checked.has(index) ? "x" : " "}] ${label}\n`);
    });
    stdout.write(`\r\x1b[2K${checkboxHint}`);
    drawn = true;
  };

  console.log("Choose agents to install for:");
  stdout.write("\x1b[?25l");
  render();

  return new Promise((resolve) => {
    const finish = () => {
      stdin.removeListener("keypress", onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\x1b[?25h\n");
    };

    const onKeypress = (_input, key) => {
      if (key.ctrl && key.name === "c") {
        finish();
        process.exit(130);
      }
      if (key.name === "up") cursor = (cursor - 1 + targets.length) % targets.length;
      if (key.name === "down") cursor = (cursor + 1) % targets.length;
      if (key.name === "space") checked.has(cursor) ? checked.delete(cursor) : checked.add(cursor);
      if (key.name === "a") checked.size === targets.length ? checked.clear() : targets.forEach((_, index) => checked.add(index));
      if (key.name === "return") {
        if (!checked.size) return stdout.write("\x07");
        finish();
        return resolve(targets.filter((_, index) => checked.has(index)));
      }
      render();
    };

    stdin.on("keypress", onKeypress);
  });
}

const args = new Set(process.argv.slice(2));
const validArgs = new Set(["--all", "--force", "--help", "-h", ...targets.map(({ key }) => `--${key}`)]);

if (args.has("--help") || args.has("-h")) {
  console.log(`Install ${skillName} for one or more coding agents.

Usage: npx youtube-livechat-css-skill [targets] [--force]

Targets:
${targets.map(({ key, label }) => `  --${key.padEnd(8)} ${label}`).join("\n")}
  --all      All supported agents

Without a target flag, an interactive checkbox is shown.
${checkboxHint}`);
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
  selected = await chooseTargets();
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
