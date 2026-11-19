#!/usr/bin/env node
// Inspect the captured YouTube Live Chat data (assets/yt-chat-tester/yt-data.js) without opening a browser.
//
//   node outline.mjs                    list every captured message variant
//   node outline.mjs paid-message       print the element tree of each variant whose key contains the text
//   node outline.mjs --css "#author-photo paid-message"   print YouTube's own CSS rules containing every word
//   node outline.mjs --css "sponsor-color" --all          ...including hover, ticker, menu and dashboard rules
//   node outline.mjs --tiers            print the seven Super Chat tier colours as they appear in the inline style
//   node outline.mjs --shell            print the element chain from <html> down to #items
//
// Pass --data <path> to read a yt-data.js somewhere else.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = name => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1] ?? ""; };
const dataPath = flag("--data") || join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "yt-chat-tester", "yt-data.js");
const cssQuery = flag("--css");
const shell = args.includes("--shell");
const query = args.find(a => !a.startsWith("--")) || "";

const window = {};
new Function("window", readFileSync(dataPath, "utf8"))(window);
const D = window.YT_DATA;
console.log(`# captured ${D.capturedAt} from ${D.page}\n`);

if (cssQuery !== null) {
  // Rules are one per line in the capture. Every word of the query must appear somewhere in the rule
  // (selector or declarations), so '--css "#author-photo paid-message"' narrows, and a variable name finds its users.
  // Rules for hover states, the ticker, menus, buttons and the creator dashboard are left out unless --all is passed.
  const terms = cssQuery.split(/\s+/).filter(Boolean);
  const noise = /:hover|:focus|dashboard|ticker|#menu|-button|tooltip/;
  const all = D.css.split("\n").filter(line => terms.every(t => line.includes(t)));
  const hits = args.includes("--all") ? all : all.filter(line => !noise.test(line.split("{")[0]));
  console.log(hits.length ? hits.join("\n") : `No YouTube rule contains ${terms.map(t => `"${t}"`).join(" and ")}.`);
  if (all.length > hits.length) console.log(`\n(${all.length - hits.length} more rule(s) for hover, ticker, menus, buttons or the dashboard: add --all to see them)`);
} else if (args.includes("--tiers")) {
  // Not part of the capture: these are YouTube's long-standing tier colours. A Super Chat carries them inline as
  // style="--yt-live-chat-paid-message-primary-color: rgba(R,G,B,1); ..." with no spaces inside rgba().
  const tiers = [["blue", "30,136,229", "21,101,192"], ["cyan", "0,229,255", "0,184,212"], ["green", "29,233,182", "0,191,165"], ["yellow", "255,202,40", "255,179,0"],
    ["orange", "245,124,0", "230,81,0"], ["magenta", "233,30,99", "194,24,91"], ["red", "230,33,23", "208,0,0"]];
  console.log("tier      primary (body)     secondary (header)   selector");
  for (const [name, p, s] of tiers) console.log(`${name.padEnd(9)} ${p.padEnd(18)} ${s.padEnd(20)} yt-live-chat-paid-message-renderer[style*="${p}"]`);
  console.log('\nSuper Sticker uses --yt-live-chat-paid-sticker-chip-background-color (primary) and --yt-live-chat-paid-sticker-background-color (secondary).');
  console.log('Also match the spaced form, [style*="30, 136, 229"], in case YouTube changes the serialisation.');
} else if (shell) {
  D.shell.forEach(([tag, attrs], depth) => console.log("  ".repeat(depth) + describe(tag, attrs)));
} else if (!query) {
  for (const key of Object.keys(D.templates)) console.log(`${String(D.counts[key] ?? 0).padStart(4)}  ${key}`);
  console.log("\nRun again with part of a key to see its element tree.");
} else {
  const keys = Object.keys(D.templates).filter(k => k.includes(query));
  if (!keys.length) console.log(`No variant matches "${query}".`);
  for (const key of keys) console.log(`## ${key}\n${tree(D.templates[key])}\n`);
}

function describe(tag, attrs) {
  const id = attrs.id ? `#${attrs.id}` : "";
  // The class after "style-scope" (the scope class, e.g. .yt-live-chat-paid-message-renderer) is kept on purpose:
  // YouTube's own rules are written "#id.scope-class", and a theme needs the same class to win over them.
  const classes = (attrs.class || "").split(/\s+/).filter(c => c && c !== "style-scope").map(c => `.${c}`).join("");
  const rest = Object.entries(attrs)
    .filter(([k]) => !["id", "class", "style", "src", "alt", "draggable", "dir", "href", "tabindex", "role", "aria-label", "aria-hidden", "focusable", "viewBox", "d", "xmlns"].includes(k))
    .map(([k, v]) => (v && v.length < 24 ? `[${k}=${v}]` : `[${k}]`)).join("");
  return tag + id + classes + rest + (attrs.style ? "  (inline style)" : "");
}

function tree(html) {
  const VOID = new Set(["img", "br", "input", "path", "hr", "circle", "rect"]);
  const out = [];
  let depth = 0;
  html = html.replace(/<!--[\s\S]*?-->/g, "");   // Polymer build comments are noise
  for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s"'>=/]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g)) {
    const [, close, tag, rawAttrs, text] = m;
    if (text !== undefined) {
      const t = text.replace(/[​-‍﻿]/g, "").trim();
      if (t) out.push("  ".repeat(depth) + JSON.stringify(t));
    } else if (close) {
      depth = Math.max(0, depth - 1);
    } else {
      const attrs = Object.fromEntries([...rawAttrs.matchAll(/([^\s"'>=/]+)(?:="([^"]*)")?/g)].map(a => [a[1], a[2] ?? ""]));
      if (tag === "svg") { out.push("  ".repeat(depth) + "svg"); }
      else if (!["path", "g", "defs"].includes(tag)) out.push("  ".repeat(depth) + describe(tag, attrs));
      if (!VOID.has(tag)) depth++;
    }
  }
  return out.join("\n");
}
