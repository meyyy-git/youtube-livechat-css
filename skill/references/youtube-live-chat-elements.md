# YouTube Live Chat element guide

Use this map to find your way around YouTube Live Chat. YouTube can change its private DOM without notice, so treat this file as orientation and take the exact structure from the capture bundled with the skill:

```bash
node scripts/outline.mjs                       # every captured message variant
node scripts/outline.mjs membership-item       # element tree of the variants whose key contains the text
node scripts/outline.mjs --css "#author-photo" # YouTube's own rules for a selector
node scripts/outline.mjs --shell               # the chain from <html> down to #items
```

The capture date is printed on the first line. Facts below marked "verified" were read from the live page on 2026-11-10.

## Selector rules

- Look a selector up before writing it: `node scripts/outline.mjs --css "<part of the selector>"` shows what YouTube applies and how specific it is.
- Scope repeated IDs beneath their renderer: `yt-live-chat-paid-message-renderer #content`, never bare `#content`.
- Build a selector from the custom-element tag, the stable ID with its scope class, and state attributes: `yt-live-chat-paid-message-renderer #header.yt-live-chat-paid-message-renderer`. The scope class (the class that follows `style-scope` on every element) is what YouTube's own rules use, so a theme needs it to win; `.style-scope` itself is useless as a hook.
- `author-type` is a real attribute on `yt-live-chat-text-message-renderer` (verified): empty for viewers, `member`, `moderator` or `owner` otherwise; the owner also carries `author-is-owner`. A moderator who is also a member is `author-type="moderator"` with two badges.
- YouTube's gift renderers do not share one prefix. Use the exact tags below; do not normalize their names.
- Use `!important` narrowly for hiding, transparency, or an override that demonstrably loses to YouTube specificity or inline styles.

## Shell and chrome

| Purpose | Renderer or selector | Useful children / notes |
| --- | --- | --- |
| Page root | `html`, `body`, `yt-live-chat-app`, `yt-live-chat-renderer` | Make all required layers transparent for OBS. |
| Chat surface | `#chat.yt-live-chat-renderer` | Contains the visible feed and input layers. |
| Message feed | `#chat-messages.yt-live-chat-renderer`, `#item-list.yt-live-chat-renderer`, `yt-live-chat-item-list-renderer` | Inside: `#contents > #item-scroller > #item-offset > #items` (verified). `#item-offset` hides overflow and gets its height from JavaScript; `#items` is positioned inside it. |
| Header | `yt-live-chat-header-renderer` | Hide only when the user selected it. |
| Ticker | `#ticker.yt-live-chat-renderer`, `yt-live-chat-ticker-renderer` | Paid/member ticker items are separate renderers. |
| Input | `#input-panel.yt-live-chat-renderer`, `yt-live-chat-message-input-renderer` | Restricted participation may use `yt-live-chat-restricted-participation-renderer`. |
| Banners | `yt-live-chat-banner-manager`, `yt-live-chat-banner-renderer` | Poll, redirect, donation, and Q&A banners have nested renderers. |
| Action panel | `yt-live-chat-action-panel-renderer` | Separate from the ordinary input panel. |
| Reactions | `yt-reaction-control-panel-overlay-view-model`, `yt-reaction-control-panel-view-model`, `yt-emoji-fountain-view-model` | Hide as a group only when approved. |
| Scrollbar | `yt-live-chat-app ::-webkit-scrollbar`, `yt-live-chat-kevlar-container ::-webkit-scrollbar` | Thumb and track have separate pseudo-elements. |

## Messages and events

| Message type | Exact renderer | High-value children | States and traps |
| --- | --- | --- | --- |
| Regular chat | `yt-live-chat-text-message-renderer` | `#author-photo`, then `#content` holding `#timestamp`, `yt-live-chat-author-chip`, `#message-container > #message`, `#deleted-state`; then `#menu` | Roles: `[author-type]` (verified), `[author-is-owner]`. Also `[is-deleted]` (verified), `[avatar-hidden]`, `[in-banner]`. |
| Membership | `yt-live-chat-membership-item-renderer` | `#card`, `#header`, `#header-content`, `#header-subtext`, `#header-primary-text`, `#content`, `#message`, `#author-photo`, `#menu` | New member: `[show-only-header]`, text in `#header-subtext`. Milestone: `[has-primary-header-text]` (verified; not `has-primary-text`), text in `#header-primary-text`, tier name in `#header-subtext`; `[show-only-header]` too when it has no message. |
| Super Chat | `yt-live-chat-paid-message-renderer` | `#card`, `#header`, `#header-content`, `#single-line`, `#author-name-chip`, `#leaderboard-badge`, `#purchase-amount-column`, `#purchase-amount`, `#content`, `#message`, `#author-photo`, `#menu`, `#lower-bumper` | Tier colours arrive as inline `--yt-live-chat-paid-message-*` variables; match a tier with `[style*="255,202,40"]` (`node scripts/outline.mjs --tiers` lists all seven). `[show-only-header]` when there is no message (verified). The avatar `<img>` is 32 × 40 inside a 32 × 32 `#author-photo` (verified). |
| Super Sticker | `yt-live-chat-paid-sticker-renderer` | `#author-info`, `#author-name-chip`, `#purchase-amount-chip`, `#sticker-container`, `#sticker`, `#content`, `#author-photo`, `#menu` | Test `[is-v2-style]`, `[is-deleted]`, and loaded sticker geometry. |
| Legacy paid event | `yt-live-chat-legacy-paid-message-renderer` | `#card`, `#author-name`, `#content`, `#event-text`, `#detail-text` | Support only when present in the target DOM or simulator. |
| Send Gift | `yt-gift-message-view-model` | Classic: `#gift-message-content`, `#icon`, `#message-block`, `#author-name`, `#message`. V2: `#gift-message-v2`, `#author-photo`, `#content`, `#author-name-v2`, `#message-v2`, `#gift-image` | Classic and V2 layouts are different; do not style only one accidentally. |
| Membership gift purchase | `ytd-sponsorships-live-chat-gift-purchase-announcement-renderer` | Usually wraps `ytd-sponsorships-live-chat-header-renderer`, whose children include `#header`, `#content`, `#header-content`, `#author-photo`, `#primary-text`, `#secondary-text`, `.rhs-image`, `#menu` | Styling only the outer wrapper often appears to do nothing; target the nested header renderer. |
| Membership gift redemption | `ytd-sponsorships-live-chat-gift-redemption-announcement-renderer` | `#content`, `#author-photo`, `yt-live-chat-author-chip`, `#message`, `#gift-icon`, `#deleted-message`, `#menu` | The correct prefix is `ytd-sponsorships-`, not `yt-live-chat-sponsorships-`. |
| Donation announcement | `yt-live-chat-donation-announcement-renderer` | `#card`, `#author-name`, `#text`, `#subtext`, `#author-photo`, `#menu` | May use `[dashboard-money-feed]`; only cover if selected. |
| Viewer engagement | `yt-live-chat-viewer-engagement-message-renderer` | `#card`, `#icon`, `#content`, `#message`, `#action-button`, `#menu` | Gift purchase wrappers may reuse this renderer in some variants. |
| Mode change | `yt-live-chat-mode-change-message-renderer` | `#contents`, `#text-container`, `#text`, `#subtext`, `#buttons` | Treat as a system message. |
| Moderation / AutoMod | `yt-live-chat-moderation-message-renderer`, `yt-live-chat-auto-mod-message-renderer` | Message, explanation, warning, and moderation controls | Usually hidden in a public OBS overlay unless requested. |
| Error state | `yt-live-chat-server-error-message`, `yt-live-chat-error-message-renderer` | `#message` or formatted error content | Hide only if the user accepts losing reconnect/error feedback. |

## Author roles and badges

Use more than color to keep roles legible when possible.

```css
/* Renderer state (verified). */
yt-live-chat-text-message-renderer[author-type="owner"] { }
yt-live-chat-text-message-renderer[author-type="moderator"] { }
yt-live-chat-text-message-renderer[author-type="member"] { }

/* Author chip and badge fallbacks visible in the YouTube baseline. */
#author-name.owner.yt-live-chat-author-chip { }
#author-name.moderator.yt-live-chat-author-chip { }
#author-name.member.yt-live-chat-author-chip { }
yt-live-chat-author-badge-renderer[type="owner"] { }
yt-live-chat-author-badge-renderer[type="moderator"] { }
yt-live-chat-author-badge-renderer[type="member"] { }
```

Do not copy empty rules into output. They show the selector relationships only.

## Paid-event variables

YouTube supplies tier-dependent variables on paid messages. Prefer consuming them before hardcoding a single Super Chat color:

- `--yt-live-chat-paid-message-primary-color`
- `--yt-live-chat-paid-message-secondary-color`
- `--yt-live-chat-paid-message-header-color`
- `--yt-live-chat-paid-message-color`
- `--yt-live-chat-paid-message-timestamp-color`

If the design intentionally replaces tier colors, verify amount contrast at every available tier.

## Scoping examples

```css
/* Safe and strong enough: scoped to the component, and one step more specific than YouTube's "#content.<scope>". */
yt-live-chat-paid-message-renderer #content.yt-live-chat-paid-message-renderer { }
yt-live-chat-membership-item-renderer #content.yt-live-chat-membership-item-renderer { }

/* Scoped but too weak: loses to YouTube's own "#content.yt-live-chat-paid-message-renderer". */
/* yt-live-chat-paid-message-renderer #content { } */

/* Unsafe: affects many unrelated YouTube components. */
/* #content { } */
```

For gift purchase cards, style both levels deliberately:

```css
ytd-sponsorships-live-chat-gift-purchase-announcement-renderer { }
ytd-sponsorships-live-chat-gift-purchase-announcement-renderer
  ytd-sponsorships-live-chat-header-renderer #header { }
```

## Minimum coverage matrix

Before delivery, exercise every selected type plus these variants where available:

- regular viewer, owner, moderator, and member messages;
- long author name, multiline text, a link, emoji, and missing badge;
- membership header-only and membership with message;
- multiple Super Chat tiers and a Super Sticker;
- membership gift purchase and redemption as separate renderers;
- a deleted message;
- Send Gift (classic and V2) and the `[avatar-hidden]` state only against a real chat: the bundled tester cannot send them;
- YouTube chrome visibility exactly matching the approved checklist.

If the simulator cannot render a selected variant, state that limitation instead of claiming coverage.
