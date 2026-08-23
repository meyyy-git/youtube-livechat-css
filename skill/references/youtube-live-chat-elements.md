# YouTube Live Chat element guide

Use this map to navigate a YouTube Live Chat stylesheet or DOM snapshot. It is derived from a real `yt-original.css` baseline and its matching dummy renderer, but YouTube can change private DOM without notice. Verify every renderer used in the final CSS against the best source available in the project.

## Selector rules

- Search a supplied baseline first: `rg -n "yt-live-chat-|ytd-sponsorships-live-chat|yt-gift-message-view-model" path/to/yt-original.css`.
- Scope repeated IDs beneath their renderer: `yt-live-chat-paid-message-renderer #content`, never bare `#content`.
- Prefer custom-element tags, stable IDs, state attributes, and documented CSS variables over generated utility classes such as `.style-scope`.
- `author-type` is added by some dummy renderers and is not a production YouTube contract. For OBS, verify role attributes, author-chip classes, and badge types instead.
- YouTube's gift renderers do not share one prefix. Use the exact tags below; do not normalize their names.
- Use `!important` narrowly for hiding, transparency, or an override that demonstrably loses to YouTube specificity or inline styles.

## Shell and chrome

| Purpose | Renderer or selector | Useful children / notes |
| --- | --- | --- |
| Page root | `html`, `body`, `yt-live-chat-app`, `yt-live-chat-renderer` | Make all required layers transparent for OBS. |
| Chat surface | `#chat.yt-live-chat-renderer` | Contains the visible feed and input layers. |
| Message feed | `#chat-messages.yt-live-chat-renderer`, `#item-list.yt-live-chat-renderer`, `yt-live-chat-item-list-renderer` | Feed internals include `#item-scroller` and `#items`. |
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
| Regular chat | `yt-live-chat-text-message-renderer` | `#timestamp`, `#author-photo`, `yt-live-chat-author-chip`, `#message`, `#menu`, `#deleted-state` | Check `[author-is-owner]`, `[author-is-moderator]`, `[author-is-member]`, `[avatar-hidden]`, `[is-deleted]`, `[in-banner]`. |
| Membership | `yt-live-chat-membership-item-renderer` | `#card`, `#header`, `#header-content`, `#header-subtext`, `#header-primary-text`, `#content`, `#message`, `#author-photo`, `#menu` | Test `[show-only-header]` and a membership with a message. |
| Super Chat | `yt-live-chat-paid-message-renderer` | `#card`, `#header`, `#header-content`, `#author-name-chip`, `#purchase-amount-column`, `#purchase-amount`, `#content`, `#message`, `#author-photo`, `#menu` | Preserve tier CSS variables unless intentionally replacing them. Test `[show-only-header]`, `[is-deleted]`, and `[has-heart-button]`. |
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
/* Renderer state: verify attributes in the target DOM. */
yt-live-chat-text-message-renderer[author-is-owner] { }
yt-live-chat-text-message-renderer[author-is-moderator] { }
yt-live-chat-text-message-renderer[author-is-member] { }

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
/* Safe: repeated IDs are scoped to their component. */
yt-live-chat-paid-message-renderer #content { }
yt-live-chat-membership-item-renderer #content { }

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
- long author name, multiline text, links, emoji, and missing badge;
- membership header-only and membership with message;
- multiple Super Chat tiers and a Super Sticker;
- membership gift purchase and redemption as separate renderers;
- Send Gift classic and V2 when the target exposes both;
- avatar hidden, deleted/retracted, and menu hidden states;
- YouTube chrome visibility exactly matching the approved checklist.

If the simulator cannot render a selected variant, state that limitation instead of claiming coverage.
