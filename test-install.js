import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const temp = mkdtempSync(join(tmpdir(), "youtube-livechat-css-skill-"));
const env = { ...process.env, YOUTUBE_LIVECHAT_SKILL_HOME: temp };
delete env.CODEX_HOME;
const packageRoot = dirname(fileURLToPath(import.meta.url));
const skillPaths = [
  [".agents", "skills"],
  [".claude", "skills"],
  [".cursor", "skills"],
  [".gemini", "skills"],
  [".config", "opencode", "skills"],
  [".copilot", "skills"],
];
const run = (...args) => spawnSync(process.execPath, ["bin/install.js", ...args], { cwd: packageRoot, env, encoding: "utf8" });

try {
  const missingTarget = run();
  assert.equal(missingTarget.status, 1);
  assert.match(missingTarget.stderr, /Interactive checkbox unavailable/);

  const first = run("--all");
  assert.equal(first.status, 0, first.stderr);
  for (const parts of skillPaths) {
    const skillFile = join(temp, ...parts, "youtube-livechat-css", "SKILL.md");
    assert.match(readFileSync(skillFile, "utf8"), /^---\nname: youtube-livechat-css/m);
  }
  const elementGuide = readFileSync(join(temp, ".agents", "skills", "youtube-livechat-css", "references", "youtube-live-chat-elements.md"), "utf8");
  assert.match(elementGuide, /ytd-sponsorships-live-chat-gift-purchase-announcement-renderer/);
  assert.doesNotMatch(elementGuide, /`yt-live-chat-sponsorships-gift-purchase-announcement-renderer`/);

  const duplicate = run("--all");
  assert.equal(duplicate.status, 1);
  assert.match(duplicate.stderr, /--force/);

  const update = run("--all", "--force");
  assert.equal(update.status, 0, update.stderr);
  assert.match(run("--help").stdout, /Space toggle/);
  console.log("Installer test passed.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
