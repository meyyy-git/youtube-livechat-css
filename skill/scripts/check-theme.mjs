#!/usr/bin/env node
// Runs a theme through the bundled tester in headless Chrome: renders every captured message type at the
// browser-source size, checks what can be checked by machine, and saves screenshots to look at.
//
//   node check-theme.mjs path/to/theme.css [--size 420x900] [--out <folder>] [--chrome <path to chrome>]
//
// It does not replace looking at the screenshots, and it is not OBS. Exit code 1 means a FAIL line was printed.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
const [W, H] = (flag("--size") || "420x900").split("x").map(Number);
const chromeArg = flag("--chrome"), outArg = flag("--out");
const themePath = args[0] && resolve(args[0]);
if (!themePath || !existsSync(themePath)) { console.error("Usage: node check-theme.mjs path/to/theme.css [--size 420x900] [--out <folder>] [--chrome <path>]"); process.exit(2); }

const here = dirname(fileURLToPath(import.meta.url));
const tester = join(here, "..", "assets", "yt-chat-tester", "index.html");
const out = resolve(outArg || join(dirname(themePath), "theme-check"));
const chrome = [chromeArg, process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find(p => p && existsSync(p));
if (!chrome) { console.error("Chrome or Edge not found. Pass --chrome <path> or set CHROME_PATH."); process.exit(2); }

mkdirSync(out, { recursive: true });
const profile = join(tmpdir(), `yt-chat-check-${process.pid}`);   // throwaway browser profile, removed at the end
const port = 9300 + (process.pid % 500);
const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run",
  "--no-default-browser-check", "--allow-file-access-from-files", `--window-size=${W + 760},${H + 220}`, pathToFileURL(tester).href], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failed = false;

try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === "page" && t.url.includes("yt-chat-tester")); } catch {}
  }
  if (!target) throw new Error("Chrome did not open the tester page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const waiting = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const id = ++seq; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const run = async expr => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result.result.value;
  };
  await send("Emulation.setDeviceMetricsOverride", { width: W + 760, height: H + 220, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 60 && !(await run("typeof T === 'object' && !!T.doc")); i++) await sleep(200);
  await run(`T.setSize(${W}, ${H})`);

  // Runs inside the page. Theme-independent checks only: a theme decides its own sizes and gaps.
  await run(`window.probe = () => {
    const d = T.doc, w = d.defaultView, W = d.documentElement.clientWidth, fails = [], warns = [], rows = [];
    const cs = el => w.getComputedStyle(el);
    const shown = el => { const r = el.getBoundingClientRect(), c = cs(el); return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && r.width > 0 && r.height > 0; };
    const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
    const solid = el => { for (; el; el = el.parentElement) { const c = cs(el).backgroundColor, a = c.match(/[\\d.]+/g); if (a.length < 4 || +a[3] === 1) return c; } return null; };
    const UI = '#timestamp,#menu,#inline-action-button-container,#show-original,#before-content-buttons,#leaderboard-badge,#creator-heart-button,#footer,#action-buttons,#input-container,#lower-bumper,#lower-buy-button';
    const TEXT = '#author-name,#message,#purchase-amount,#purchase-amount-chip,#header-primary-text,#header-subtext,#primary-text';
    for (const el of d.querySelector('#items').children) {
      const r = el.getBoundingClientRect();
      const id = el.localName.replace(/^yt-live-chat-|^ytd-sponsorships-live-chat-/, '').replace(/-renderer$/, '') + (el.getAttribute('author-type') ? ':' + el.getAttribute('author-type') : '')
        + (el.hasAttribute('show-only-header') ? ':header-only' : '') + (el.hasAttribute('has-primary-header-text') ? ':milestone' : '') + (el.hasAttribute('is-deleted') ? ':deleted' : '');
      const fail = m => fails.push(id + ': ' + m), warn = m => warns.push(id + ': ' + m);
      if (el.hasAttribute('is-deleted')) { if (r.height > 0) warn('deleted message is visible (' + Math.round(r.height) + 'px). The default is to hide it.'); rows.push({ id, height: Math.round(r.height) }); continue; }
      if (!shown(el)) { rows.push({ id, hidden: true }); continue; }
      if (r.left < -0.5 || r.right > W + 0.5) fail('wider than the chat: ' + Math.round(r.left) + '..' + Math.round(r.right) + ' of ' + W);
      for (const u of el.querySelectorAll(UI)) if (shown(u)) warn('YouTube interface visible: #' + u.id);
      const contrast = {};
      for (const t of el.querySelectorAll(TEXT)) {
        if (!shown(t) || !t.textContent.trim()) continue;
        const tr = t.getBoundingClientRect();
        if (tr.left < r.left - 1 || tr.right > r.right + 1) fail('#' + t.id + ' sticks out of its message: ' + Math.round(tr.left) + '..' + Math.round(tr.right) + ' vs ' + Math.round(r.left) + '..' + Math.round(r.right));
        if (tr.right > W + 0.5) fail('#' + t.id + ' runs past the right edge');
        const bg = solid(t);
        if (bg) {
          const a = lum(cs(t).color), b = lum(bg), c = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          // Outlined lettering (a text-shadow ring or a text stroke) gets its contrast from the outline, which this cannot measure.
          const outlined = cs(t).textShadow !== 'none' || parseFloat(cs(t).webkitTextStrokeWidth) > 0;
          contrast[t.id] = outlined ? 'outlined' : +c.toFixed(1);
          if (!outlined && c < 3) fail('#' + t.id + ' contrast ' + c.toFixed(1) + ':1');
          else if (!outlined && c < 4.5) warn('#' + t.id + ' contrast ' + c.toFixed(1) + ':1 (under 4.5)');
        }
      }
      const photo = el.querySelector('#author-photo'), img = photo && shown(photo) && photo.querySelector('img');
      if (img) {   // compare with the frame's inner box, so a border on the frame does not count
        const i = img.getBoundingClientRect(), pw = photo.clientWidth, ph = photo.clientHeight;
        if (Math.abs(i.height - ph) > 1.5 || Math.abs(i.width - pw) > 1.5) warn('avatar image is ' + Math.round(i.width) + 'x' + Math.round(i.height) + ' inside a ' + pw + 'x' + ph + ' frame (see pitfalls: Super Chat avatar)');
      }
      rows.push({ id, x: Math.round(r.left) + '..' + Math.round(r.right), height: Math.round(r.height), avatar: !!img, contrast });
    }
    if (d.documentElement.scrollWidth > W) fails.push('the chat scrolls sideways (' + d.documentElement.scrollWidth + ' > ' + W + ')');
    // A scaled theme: <body> is only as tall as the unscaled app and, with overflow hidden on both <html> and <body>, clips the rest.
    const app = d.querySelector('yt-live-chat-app'), ab = app.getBoundingClientRect(), bb = d.body.getBoundingClientRect();
    if (cs(d.documentElement).overflowY !== 'visible' && cs(d.body).overflowY !== 'visible' && ab.bottom > bb.bottom + 1)
      fails.push('the page clips the chat: yt-live-chat-app ends at ' + Math.round(ab.bottom) + 'px but <body> ends at ' + Math.round(bb.bottom) + 'px and hides the rest, so the newest messages are cut off in OBS (add html, body { height: 100% !important })');
    return { fails, warns, rows };
  }`);

  // Health check: without a theme the default YouTube look must appear, or the tester itself is broken.
  await run("T.setTheme(''); T.clear(); T.send('viewer'); T.send('superchat', { tier: 3 })");
  const plain = await run(`(() => { const d = T.doc, g = (s, p) => d.defaultView.getComputedStyle(d.querySelector(s))[p]; return { avatar: g('yt-live-chat-text-message-renderer #author-photo', 'display'), card: g('#card.yt-live-chat-paid-message-renderer', 'backgroundColor') }; })()`);
  if (plain.avatar === "none" || !/255, 202, 40|255, 179, 0/.test(plain.card)) { failed = true; console.log("FAIL tester health check: the default YouTube look did not appear", JSON.stringify(plain)); }

  await run(`T.setTheme(${JSON.stringify(readFileSync(themePath, "utf8"))}, 'theme under test')`);
  const groups = {
    chat: `['viewer', 'member', 'moderator', 'moderatorMember', 'owner', 'verified', 'deleted'].forEach(n => T.send(n));
           T.send('viewer', { long: true }); T.send('member', { long: true }); T.send('owner', { name: 'a', message: 'w', emoji: false }); T.send('viewer', { link: true });`,
    superchat: `[0, 1, 2, 3, 4, 5, 6].forEach(t => T.send(t % 2 ? 'superchatNoMessage' : 'superchat', { tier: t })); T.send('superchat', { tier: 0, long: true });`,
    sticker: `[0, 3, 6].forEach(t => T.send('sticker', { tier: t })); T.send('sticker', { tier: 1, long: true });`,
    members: `['newMember', 'milestone', 'milestoneMessage', 'giftPurchase', 'giftReceived', 'giftReceived'].forEach(n => T.send(n));
              T.send('milestoneMessage', { long: true }); T.send('giftPurchase', { long: true }); T.send('newMember', { long: true });`,
  };
  for (const [name, script] of Object.entries(groups)) {
    await run(`T.clear(); ${script}`);
    // Entrance animations can run well over a second; measure and shoot the settled state. Long decorative loops are
    // not waited for: after 4 s the check goes on.
    await run("Promise.race([Promise.all(T.doc.getAnimations().filter(a => a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)).map(a => a.finished.catch(() => 0))), new Promise(r => setTimeout(r, 4000))]).then(() => 1)");
    await sleep(300);   // YouTube's own colour transitions
    const res = await run("probe()");
    console.log(`\n== ${name} ==`);
    for (const r of res.rows) console.log("  ", JSON.stringify(r));
    const tally = list => Object.entries(list.reduce((n, m) => (n[m] = (n[m] || 0) + 1, n), {})).map(([m, n]) => (n > 1 ? `${m}  (×${n})` : m));
    for (const m of tally(res.warns)) console.log("  WARN", m);
    for (const m of tally(res.fails)) { failed = true; console.log("  FAIL", m); }
    for (const bg of ["dark", "light"]) {
      const clip = await run(`(T.setBackground('${bg}'), (r => ({ x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 }))(document.getElementById('fit').getBoundingClientRect()))`);
      const shot = await send("Page.captureScreenshot", { format: "png", clip });
      writeFileSync(join(out, `${name}-${bg}.png`), Buffer.from(shot.result.data, "base64"));
    }
  }
  ws.close();
  console.log(`\nScreenshots: ${out}  (look at them: a machine cannot judge the design)`);
} catch (e) { failed = true; console.error("ERROR", e.message); }

proc.kill();
await sleep(800);
try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch {}
console.log(failed ? "RESULT: FAILED" : "RESULT: no FAIL (WARN lines and the screenshots still need a look)");
process.exit(failed ? 1 : 0);
