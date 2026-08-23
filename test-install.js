import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const temp = mkdtempSync(join(tmpdir(), "youtube-livechat-css-skill-"));
const env = { ...process.env, CODEX_HOME: temp };
const packageRoot = dirname(fileURLToPath(import.meta.url));

try {
  const first = spawnSync(process.execPath, ["bin/install.js"], { cwd: packageRoot, env, encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  assert.match(readFileSync(join(temp, "skills", "youtube-livechat-css", "SKILL.md"), "utf8"), /^---\nname: youtube-livechat-css/m);

  const duplicate = spawnSync(process.execPath, ["bin/install.js"], { cwd: packageRoot, env, encoding: "utf8" });
  assert.equal(duplicate.status, 1);

  const update = spawnSync(process.execPath, ["bin/install.js", "--force"], { cwd: packageRoot, env, encoding: "utf8" });
  assert.equal(update.status, 0, update.stderr);
  console.log("Installer test passed.");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
