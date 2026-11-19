---
name: youtube-livechat-css
description: Design, write, rework, debug and test a single-file CSS theme for YouTube Live Chat shown as an OBS browser source. Use this whenever the user wants a custom live chat or livechat overlay for a streamer or VTuber, gives a banner, logo, model sheet or layout picture to turn into a chat theme, asks for Super Chat, membership or gift cards to be styled, wants chat animations, asks what should show or hide in the chat overlay, or reports that a chat theme looks wrong or drops frames in OBS, even when they never say "YouTube" or "CSS". Do not use for custom chat relay renderers or non-YouTube chat platforms.
---

# YouTube Live Chat CSS for OBS

The deliverable is one readable CSS file the user pastes into the Custom CSS field of an OBS Browser Source that points at a YouTube live chat popout. No HTML and no JavaScript reach OBS: everything is done by restyling YouTube's own elements. Adapt to the user's design; do not impose a house style, and do not reuse the composition of a theme that already sits in the workspace unless asked, because each streamer wants a look of their own.

This skill bundles what makes that reliable:

- `assets/yt-chat-tester/` — a local tester that renders every message type with YouTube's real element structure and YouTube's own base CSS.
- `assets/starter.css` — the part every theme repeats: transparent page, hidden YouTube chrome, hidden deleted messages.
- `assets/mockup-template.html` — a plain page for showing a design before any YouTube selector is written.
- `scripts/outline.mjs` — prints the real element tree of any message type, YouTube's own rules for a selector, or the Super Chat tier colours.
- `scripts/check-theme.mjs` — runs a theme through the tester in headless Chrome, reports what a machine can check, and saves screenshots.
- `references/youtube-live-chat-elements.md` — selector guide. `references/pitfalls.md` — problems already paid for once.

## The order of work

Follow this order. Each step exists because skipping it cost a rewrite.

1. **Brief.** Look at what is already in the workspace before asking. The workspace is the folder the user is working in plus its sibling theme folders; read them for conventions (file names, browser-source size, fonts already agreed), not for a layout to copy. Then settle the visibility rules below and the browser-source size. Ask only for what cannot be found; when the user does not answer, use the defaults and say which ones were used. A channel or streamer name is for the folder and file name, the owner's sample name in the mockup, and any label the theme adds; CSS cannot print it anywhere else, because YouTube writes the chat's text.
2. **Read the reference.** From a banner, logo or model sheet, write down the palette (with roles: base, surface, ink, accent), the shapes, the ornaments and the lettering. When the user gives one picture for layout and another for brand, take structure from the first and colours and ornaments from the second. Say what was estimated by eye. With no picture at all, only words ("night ocean, navy and teal, bubbles"), choose the hex values, shapes and ornaments yourself and put them on the mockup's palette strip as a proposal: the mockup is then where the user first sees and corrects them.
3. **Mockup first.** Copy `assets/mockup-template.html`, style it, and show it. People react to a picture, not to selectors, and a mockup changes in minutes while a finished theme does not. Show every message type the theme will style. Mark what YouTube supplies (avatar, badge images, milestone text) as placeholders so nobody expects to redesign them. Wait for approval. When the user hands over a finished design (a Figma file, an exact comp), that design is the mockup: skip to step 4, take every measurement and asset from the file instead of estimating by eye, and prove the match by comparing a tester screenshot with the design's own export at the same scale.
4. **Write the CSS.** Start from `assets/starter.css`. Check structure with `node scripts/outline.mjs <part of a renderer name>` instead of guessing; read `references/pitfalls.md` before the first selector.
5. **Test in the tester.** Run `node scripts/check-theme.mjs <theme.css>` and look at its screenshots; for work with the user watching, open `assets/yt-chat-tester/index.html`, load the CSS file and send every type. Fix what the real structure reveals.
6. **Motion, only after the look is approved.** Propose a short list with its cost in OBS, wait for a choice, then implement.
7. **Deliver.** Report the file path, what shows and hides, fonts and their hosting, the animation decision, the size tested, and what was not verified (OBS itself, a real chat).

## Visibility rules

These are the defaults. Present them as a short list, let the user change any line, and write the result into the theme. A chat overlay shows what viewers said and paid for, and hides everything that is YouTube's own interface.

| Thing | Default | Why |
| --- | --- | --- |
| Chat from viewers, members, moderators, the owner, verified accounts | Show | The point of the overlay. Give each role a difference beyond colour. |
| Author name and message text | Show | |
| YouTube's badges (member, moderator, verified) | Show, as YouTube draws them | The member badge is the streamer's own image; moderator and verified are small icons that take the CSS `color`. Do not replace them with invented text labels. The owner has no badge, so mark the owner by colour or ornament. |
| Avatar on ordinary chat messages | Hide | Keeps a narrow overlay readable. Show it when the reference clearly has avatars. |
| Avatar on Super Chat, Super Sticker, membership and gift purchase cards | Show | The card celebrates one person. |
| Super Chat and Super Sticker, all seven tiers | Show | With name, amount and message. Map the seven YouTube tiers onto the theme's own two or three levels. |
| New member, membership milestone (with or without a message) | Show | The milestone text ("Member for 6 months") comes from YouTube and cannot be reworded, only restyled. |
| Gift membership purchase | Show | The gift-count text also comes from YouTube. |
| YouTube's stock gift artwork on a gift purchase | Hide | A large fixed picture that will not match the theme. |
| Gift membership received | Show, as one small line, without avatar or gift icon | It arrives in bursts; a full card each would flood the chat. |
| Send Gift (jewels, `yt-gift-message-view-model`) | Show, as one small line | Not in the bundled capture, so its structure is unverified; say so when delivering. |
| Deleted or retracted messages | Hide the whole message | YouTube keeps them in the list as "[message deleted]". An overlay should not show that a message was removed. |
| Timestamps | Hide | |
| Per-message menu, inline action buttons, "show original", leaderboard badge, creator heart, Super Chat footer buttons | Hide | Interface for a logged-in viewer, meaningless on stream. |
| Chat header, ticker strip, message input, restricted-participation notice | Hide | YouTube chrome. |
| Banners and pinned messages, polls, action panel | Hide | Ask before showing; they are large and unstyled. |
| System notices (the welcome notice, slow mode and members-only notices), placeholder items | Hide | |
| Reactions and the emoji fountain | Hide | |
| Scrollbar and the "new messages" button | Hide | |
| Page and list backgrounds | Transparent | So the stream shows through. |
| Error messages ("chat is disabled") | Leave as YouTube shows them | So the streamer notices a broken source. Hide only if the user accepts losing that. |

Labels added by the theme (for example "Welcome" on a new member card) are short and in the language the user asks for; the default is plain English.

### Known gap: Send Gift is not in the captured data

Send Gift (the jewels gift, `yt-gift-message-view-model`) has not been captured yet. `outline.mjs` cannot print it, the tester cannot send it, and `check-theme.mjs` does not cover it. Until it is captured:

- Do not invent its inner structure. Give it only the light, low-risk treatment in `references/youtube-live-chat-elements.md` (a small line on the outer element and its two documented wrappers, `#gift-message-content` and `#gift-message-v2`), and force the text colours with `!important`, because YouTube's own colour there is white.
- Tell the user, in the brief and again when delivering, that Send Gift is styled blind and was not tested.
- If the user needs it designed properly, capture it first: run `assets/yt-chat-tester/capture.js` on a live chat where a Send Gift appears, replace `yt-data.js`, then design against the real tree. Remove this section once the capture contains a `yt-gift-message-view-model` variant.

## Writing the CSS

- **One file.** Keep a token block at the top (`:root` custom properties for colours, radii, fonts) when values repeat. Keep comments that explain why while developing; strip them only when the user asks, and keep any `@import` as the first line or the fonts will not load.
- **Verify, never guess, a selector.** YouTube mixes `yt-live-chat-*`, `ytd-sponsorships-*` and view-model elements, and its attribute names are not what the feature names suggest. `node scripts/outline.mjs` lists what was captured from the real page; `node scripts/outline.mjs --css "<text>"` shows the rule YouTube itself applies, which tells you what you are overriding and how specific you must be.
- **Write selectors in YouTube's own form, with the renderer in front.** YouTube styles its elements as `#content.yt-live-chat-paid-message-renderer` (an ID plus the scope class every element carries). A theme rule written as `yt-live-chat-paid-message-renderer #content` is weaker and silently loses. Write `yt-live-chat-paid-message-renderer #content.yt-live-chat-paid-message-renderer`: it wins without `!important`, and it scopes the repeated IDs (`#header`, `#content`, `#message`, `#author-photo`) to one renderer. `outline.mjs` prints each element's scope class; note that it is not always the renderer's own name (`#author-name` carries `.yt-live-chat-author-chip`).
- **Restyle, do not rebuild.** There is no way to add elements. Ornaments and labels come from `::before` and `::after`, background layers and inline SVG data URIs. Each element has only two pseudo-elements, so plan which element carries which ornament before writing.
- **Width.** Decide early whether a message is as wide as the chat or as wide as its content, because it changes how name tags and ornaments are placed.
- **Scale.** Write sizes in the design's own pixels and enlarge the whole chat in one place when the browser source is bigger: `yt-live-chat-app { width: calc(100vw / var(--scale)); height: calc(100vh / var(--scale)); min-width: 0; min-height: 0; transform: scale(var(--scale)); transform-origin: 0 0; }`. `transform` leaves YouTube's scroll arithmetic alone. It only works together with the starter's `html, body { height: 100% !important }`: without it `<body>` cuts off the bottom of the chat (see pitfalls), which the tester now shows and `check-theme.mjs` reports.
- **Fonts.** System fonts by default. A web font needs the user's agreement, a trusted host, and a fallback stack, because OBS must fetch it at runtime.
- **Assets.** Prefer CSS shapes and inline SVG. A bitmap must sit at a stable HTTPS URL or be embedded as a `data:` URI in a `:root` custom property (no hosting needed; keep those properties in one block at the end of the file so the rules stay readable); never ship a local file path.
- **`!important`** only where YouTube's specificity or an inline style demonstrably wins. The starter's reset is the one deliberate exception; change message spacing through its `--msg-margin` and `--msg-padding` variables rather than adding more `!important`.
- **Super Chat tiers.** `node scripts/outline.mjs --tiers` prints the seven colours and the selector that matches each.

Read `references/pitfalls.md` before writing: it lists the failures that look fine in a mockup and break on the real page.

## Testing

`assets/yt-chat-tester/index.html` opens in Chrome directly. Choose the theme file (it reloads on every save), or paste CSS into its panel, then send messages from the left panel: each role, the seven Super Chat tiers with and without a message, sticker, new member, milestones, gift purchase and gift received, a deleted message. Set the size to the user's browser-source size.

Check, at that size:

- every type the theme styles, plus a long name, a long message, an emoji, and a one-letter message;
- nothing clipped at the left, right or bottom edge, including ornaments and shadows;
- hidden things leave no gap, and a deleted message leaves nothing;
- text contrast on every background the theme uses, over both a dark and a light stream background;
- with the theme removed, the default YouTube look still appears (that proves the tester itself is healthy).

Run the automated check before looking by eye; it needs Chrome or Edge and nothing else:

```bash
node scripts/check-theme.mjs path/to/theme.css --size 420x900
```

It first confirms the tester shows YouTube's default look, then renders every type with the theme (long names and messages, an emoji, a link, all seven tiers) and waits for entrance animations to end, and reports FAIL for a message wider than the chat, text that sticks out of its message, sideways scrolling, a chat cut off by the page shell and unreadable contrast, and WARN for visible YouTube interface, a visible deleted message, borderline contrast and an avatar image that does not fill its frame. Screenshots on a dark and a light background go to `theme-check/` beside the CSS (or `--out`). Open them: the script cannot judge the design, and outlined lettering is reported as `outlined` instead of a ratio.

For your own script, the page exposes `window.T`: `T.send(name, { tier, name, message, long, emoji, link, amount, giftText, milestoneText, subtext })` adds one message (the last four replace text YouTube writes: the Super Chat amount, the gift purchase line, "Member for N months" and the tier line) (`Object.keys(T.KEYS)` lists the names; `tier` is 0 to 6), `T.setTheme(cssText)`, `T.setSize(w, h)`, `T.setBackground('dark' | 'light' | 'check' | 'green')`, `T.clear()`, and `T.doc` is the chat document. A background browser tab may not advance animations; judge motion in a visible window.

The tester's limits: it replaces the two things YouTube sets with JavaScript (the list's offset height and the list's position), and its data is a capture from one day. Anything that touches the page shell (scaling, sizes on `html`, `body` or `yt-live-chat-app`) deserves one look at a real chat as well: open a live stream's popout chat (`https://www.youtube.com/live_chat?v=<video id>&is_popout=1`) in a browser, inject just those rules, and check that the newest message sits at the bottom edge and stays there as messages arrive. If something looks different in OBS, re-capture: `assets/yt-chat-tester/capture.js` explains how in its first comment. State plainly what was tested in the tester and what was not tested in OBS.

## Motion

Offer motion only after the static look is approved, as a numbered list with where it applies, its duration and its cost, and a recommendation. Ship nothing the user did not pick.

- Ordinary chat arrives constantly, so its entrance is short and small (about 200 ms, a few pixels). Rare events (Super Chat, membership, gifts) can carry a bigger moment.
- Animate `transform` and `opacity`. Start from a visible state such as `scale(0.95)`, never from nothing.
- Ease-out for entrances. Custom curves read better than the built-in keywords.
- Text inside an element that drifts slowly snaps to whole pixels and shivers against its own background. Give that element `will-change: transform` so text and background move as one layer.
- Loops cost the most. Keep them to small elements and to `transform` and `opacity`; anything that repaints a whole card every frame (a moving background, an animated mask, a filter over a large area) shows as dropped frames once several cards are on screen.
- A layer that has finished its job is hidden, not left transparent and still animating.
- Every animation gets a `prefers-reduced-motion: reduce` fallback, kept as the last rule in the file.

## Deliver

Finish with: the CSS path; the visibility list as built; fonts and whether they need the network; the animations chosen; the size tested; and the things not verified. If the tester showed a difference from what the mockup promised, say which and why.
