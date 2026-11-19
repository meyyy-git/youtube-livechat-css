/* Captures the structure of YouTube Live Chat into yt-data.js (read by index.html and scripts/outline.mjs).
   How to use: open the chat popout of a stream that is live (youtube.com/live_chat?is_popout=1&v=VIDEO_ID),
   paste this whole file into the DevTools Console, wait a few minutes until the message types you need have
   appeared (check with __ytcap.summary()), then paste it once more to save. Put the downloaded yt-data.js
   next to index.html.
   Only structure is kept: viewer names, messages, photos and links are replaced with {{...}} markers.
   Rare types can be forced without waiting, with dummy data, through YouTube's own renderer:
   document.querySelector('yt-live-chat-item-list-renderer').polymerController.handleLiveChatActions_([
     { addChatItemAction: { item: { liveChatPaidMessageRenderer: { ... } } } } ]) */
(() => {
  const S = window.__ytcap || (window.__ytcap = { els: [] });
  const items = document.querySelector('#items.yt-live-chat-item-list-renderer');
  if (!items) return 'Open a YouTube live chat popout first.';

  const ATTRS = ['author-type', 'show-only-header', 'has-primary-header-text', 'is-v2-style', 'is-deleted'];
  const blank = s => !s.replace(/[​-‍﻿\s]/g, '');
  const key = el => {
    let k = el.localName + ATTRS.filter(a => el.hasAttribute(a)).map(a => `[${a}${el.getAttribute(a) ? '=' + el.getAttribute(a) : ''}]`).join('');
    const badges = [...el.querySelectorAll('yt-live-chat-author-badge-renderer')].map(b => b.getAttribute('type')).join('+');
    if (badges) k += '|badge:' + badges;
    const m = el.querySelector('#message');
    if (m && el.localName !== 'yt-live-chat-text-message-renderer') k += !blank(m.textContent) || m.querySelector('img') ? '|msg' : '|nomsg';
    const c = /primary-color:\s*(rgba?\([^)]*\))/.exec(el.getAttribute('style') || '');
    if (c) k += '|' + c[1].replace(/\s/g, '');
    return k;
  };
  S.summary = () => { const n = {}; S.els.forEach(e => { const k = key(e); n[k] = (n[k] || 0) + 1; }); return n; };

  if (!S.obs) {
    S.els.push(...items.children);
    S.obs = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && S.els.push(n))));
    S.obs.observe(items, { childList: true });
    return 'Recorder installed. Wait, check __ytcap.summary(), then run this script once more to save.';
  }

  // ---- harvest ----
  const inert = document.implementation.createHTMLDocument('');   // no custom element registry here, so clones are not upgraded
  const CLEAR = ['aria-label', 'shared-tooltip-text', 'alt', 'title', 'href', 'srcset', 'data-emoji-id'];
  const sanitize = (el, flattenMessage) => {
    const c = inert.importNode(el, true);
    c.removeAttribute('id');
    const idOf = n => { for (let p = n.parentElement; p; p = p.parentElement) if (p.id) return p.id; return 'text'; };
    c.querySelectorAll('#menu, #inline-action-button-container, #before-content-buttons, tp-yt-paper-tooltip, template').forEach(n => n.replaceChildren());
    if (flattenMessage) c.querySelectorAll('#message, #message-v2').forEach(m => { if (m.childNodes.length) m.replaceChildren('{{message}}'); });
    const w = inert.createTreeWalker(c, NodeFilter.SHOW_TEXT), texts = [];
    while (w.nextNode()) texts.push(w.currentNode);
    texts.forEach(t => { if (!blank(t.nodeValue) && t.nodeValue !== '{{message}}') t.nodeValue = `{{${idOf(t)}}}`; });
    c.querySelectorAll('*').forEach(e => {
      if (e.hasAttribute('src')) e.setAttribute('src', `{{img:${idOf(e)}}}`);
      CLEAR.forEach(a => e.hasAttribute(a) && e.setAttribute(a, ''));
      [...e.attributes].forEach(a => a.name.startsWith('data-') && e.setAttribute(a.name, ''));
    });
    return c.outerHTML;
  };

  const templates = {}, counts = S.summary();
  S.els.forEach(e => { const k = key(e); if (!templates[k]) templates[k] = sanitize(e, e.localName !== 'ytd-sponsorships-live-chat-gift-redemption-announcement-renderer'); });

  const emojiEl = S.els.map(e => e.querySelector('#message img.emoji')).find(Boolean);
  const linkEl = S.els.map(e => e.querySelector('#message a')).find(Boolean);
  const bare = (el, id) => { if (!el) return ''; const p = inert.createElement('span'); p.id = id; p.append(inert.importNode(el, true)); return sanitize(p).replace(/^<span[^>]*>|<\/span>$/g, ''); };

  const shell = [];
  for (let p = items; p; p = p.parentElement) shell.unshift([p.localName, Object.fromEntries([...p.attributes].map(a => [a.name, a.value]))]);

  let css = '';
  for (const s of [...document.styleSheets, ...(document.adoptedStyleSheets || [])]) {
    try { css += `/* ${s.href || 'inline'} */\n${[...s.cssRules].map(r => r.cssText).join('\n')}\n`; }
    catch (e) { css += `/* unreadable: ${s.href} */\n`; }
  }
  css = css.replace(/url\((["']?)\/(?!\/)/g, 'url($1https://www.youtube.com/');

  const text = 'window.YT_DATA = ' + JSON.stringify({ capturedAt: new Date().toISOString(), page: location.pathname, shell, counts, templates, emoji: bare(emojiEl, 'emoji'), link: bare(linkEl, 'link'), css }) + ';\n';

  if (window.__ytcapPost) {   // automated capture: post to a local receiver through a form
    const f = document.createElement('form'), i = document.createElement('input');
    f.method = 'POST'; f.action = window.__ytcapPost; f.acceptCharset = 'utf-8';
    i.type = 'hidden'; i.name = 'd'; i.value = text;
    f.append(i); document.body.append(f); setTimeout(() => f.submit(), 50);
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    a.download = 'yt-data.js';
    a.click();
  }
  return `Saved: ${Object.keys(templates).length} variants, CSS ${(css.length / 1024 | 0)} KB.`;
})();
