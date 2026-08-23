---
name: youtube-livechat-css
description: Create or rework a single-file CSS theme for YouTube Live Chat shown as an OBS browser source. Use for theme briefs, visual references, existing chat CSS, visibility choices, previews, and theme-matched motion advice. Do not use for custom chat relay renderers or non-YouTube chat platforms.
---

# YouTube Live Chat CSS for OBS

Produce one readable CSS file that the user can paste into OBS Browser Source's Custom CSS field. Adapt to the project and the user's design; do not impose a house style.

## Establish the brief

Inspect existing CSS, HTML, screenshots, assets, and preview tools before asking questions. Ask only for decisions that cannot be discovered. Accept a text brief, visual reference, existing CSS, or any combination.

Before implementation, collect one compact checklist and confirm the answers:

- OBS browser-source width, height, and display scale. If unknown, offer a 1920x1080 canvas with a 420x900 chat region as a starting point.
- Visual direction, palette, typography, chat density, and required readability.
- Message types to show or hide: regular viewer, owner, moderator, member, membership event, gift purchase/redemption, Super Chat, Super Sticker, and system/banner messages.
- Message details to show or hide: avatar, author badge, author name, timestamp, amount, message body, and event header.
- YouTube chrome to show or hide: chat header, ticker, message input, menus, action buttons, and scrollbar.

If the user declines configuration, show chat messages and paid/member events, and hide YouTube's input/navigation chrome.

## Build the theme

Use the smallest implementation that satisfies the approved brief:

1. When writing or debugging selectors, visibility, or preview markup, read [references/youtube-live-chat-elements.md](references/youtube-live-chat-elements.md).
2. Verify selectors against supplied markup, the project's simulator, a baseline stylesheet such as `yt-original.css`, or the current rendered YouTube chat DOM. Treat the reference as a navigation guide, not a permanent API contract.
3. Search the available baseline before inventing a selector. Never derive a tag name from a feature label; YouTube mixes `yt-live-chat-*`, `ytd-sponsorships-*`, and view-model elements.
4. Scope repeated IDs such as `#header`, `#content`, `#message`, and `#author-photo` under their renderer. Do not style these IDs globally.
5. Distinguish simulator-only attributes from production YouTube attributes. In particular, do not rely on `author-type` unless the output targets that simulator rather than OBS YouTube chat.
6. Reuse the project's working selector patterns and preview harness when present.
7. Keep the deliverable in one CSS file. Use a small token block only when values repeat meaningfully.
8. Hide only items approved in the visibility checklist. Keep names, messages, and monetary values legible at the target OBS size.
9. Prefer CSS shapes and effects, then user-provided assets. Create new bitmap assets only when the concept needs them and image generation is available.
10. Reference final assets with stable HTTPS URLs. Do not ship local file paths as the OBS-ready result.
11. Use system fonts by default. External web fonts require user approval, a trusted host, and a fallback stack.

## Motion

When motion could support the theme, propose a short set of matching CSS animations and state their likely OBS performance cost. Wait for approval before implementing any motion. If the user skips the choice, ship no animation.

Animate `transform` and `opacity` where possible. Avoid continuous decorative loops, large animated filters, and JavaScript. Add a `prefers-reduced-motion: reduce` fallback for every implemented animation.

## Preview and verify

Use an existing simulator when available. Otherwise, create one minimal local preview page only when needed to verify the selected message types; the production deliverable remains one CSS file.

Check at the requested OBS dimensions:

- transparent page and list backgrounds;
- long names, multiline messages, emoji, and missing optional fields;
- every selected role and event type;
- regular, header-only, deleted, avatar-hidden, and multiline states where applicable;
- hidden elements do not leave gaps;
- borders, ornaments, avatars, and amounts are not clipped;
- text contrast and font size remain readable after OBS scaling;
- approved animations enter cleanly and honor reduced motion.

Report any selector that could not be verified against real or simulated markup. Do not claim YouTube DOM compatibility that was not tested.

## Deliver

Write the CSS and preview/assets when the user asked to build, rather than stopping at a plan. Finish with the CSS path, the chosen visibility summary, asset hosting requirements, animation decision, and the exact OBS browser-source dimensions used for validation.
