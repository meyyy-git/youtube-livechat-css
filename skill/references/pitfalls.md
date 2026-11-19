# Pitfalls

Each of these looked fine in a mockup or an old simulator and failed on the real page or in OBS. Read before writing selectors; skim again before delivering.

## Selectors that lose

- **`renderer #id` is weaker than YouTube's `#id.scope-class`.** A theme set a Super Chat avatar to 36px with `yt-live-chat-paid-message-renderer #author-photo` and it stayed 32px, because YouTube's `#author-photo.yt-live-chat-paid-message-renderer` has one more class. Write `yt-live-chat-paid-message-renderer #author-photo.yt-live-chat-paid-message-renderer`. The scope class is printed by `outline.mjs` and is not always the renderer's name: `#author-name` and `#chat-badges` carry `.yt-live-chat-author-chip`, the avatar `img` carries `.yt-img-shadow`.
- **Sizes in `rem` are tenths.** YouTube sets `html { font-size: 10px }`, so `1.6rem` in its rules is 16px. Use `px` in the theme.
- **The starter resets margin and padding with `!important`.** Set `--msg-margin` and `--msg-padding` on a renderer instead of writing a competing margin.
- **`#message` line height is forced.** In ordinary chat YouTube sets `line-height: 20px` through `[enable-improved-visibility-style] #message` and `unset` under `html[live-chat-typography-migration]`; both beat the theme's selector form. A theme with its own line height writes `line-height: … !important` on `#message`.
- **Names in cards are forced to 14px.** `yt-live-chat-author-chip[disable-highlighting] #author-name` (Super Chat, sticker) and the typography-migration rules win over a theme's font size; put `!important` on the name's `font` there.
- **Super Sticker has its own stubborn layout.** `#card` stays `display: flex` with padding and a shadow, `#author-info` has `max-height: 40px`, `#price-column` is a flex box and `#sticker-container` keeps its margin. Restyling the sticker card means `!important` on exactly those (`display`, `padding`, `box-shadow`, `max-height`, `margin`).
- **Card chrome that survives `background: none`.** The gift purchase `#header` keeps a `box-shadow`, and the membership `#card` and `[show-only-header] #header` keep their background unless the override is `!important`. A white or green rectangle behind a restyled card is this.

## Structure

- **Long names in cards.** In membership and gift cards the author chip is not `single-line`, so a long name pushes past the card's right edge. Give the flex ancestors `min-width: 0` and the name `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` (or let it wrap). `check-theme.mjs` reports this as text sticking out of its message.
- **Super Sticker starts almost invisible.** YouTube keeps `#sticker-container` at a low opacity until its script adds `.sticker-loaded`. The tester adds the class for you; a theme that restyles the container should not depend on that opacity.
- **Moderator and verified badges are icons, not images.** Inside `yt-live-chat-author-badge-renderer` the member badge is an `<img>`, while moderator and verified are a `yt-icon` holding an inline SVG that takes the CSS `color`. The capture has them empty, so the tester draws stand-in icons; size and colour them, do not rely on their exact shape.
- **Old simulators lie.** Hand-copied chat markup drifts. Example: a membership milestone carries `has-primary-header-text`, while an older dummy used `has-primary-text`; a theme written for the dummy silently showed the "new member" look for milestones. Check `node scripts/outline.mjs` instead.
- **`author-type` is real.** The text message renderer carries `author-type=""` for viewers and `member`, `moderator`, `owner` otherwise; the owner also has `author-is-owner`. Role classes on `#author-name` (`.member`, `.moderator`, `.owner`) are a second hook.
- **The list is deeper than it looks.** `#item-scroller > #item-offset > #items`. `#item-offset` hides overflow, so anything that sticks out of the list sideways is cut. Keep ornaments inside a side margin on the messages.
- **Deleted messages stay in the list.** They get `is-deleted`, the message is hidden and `#deleted-state` shows "[message deleted]". Styling `#deleted-state` is not enough; hide the item (`#items > [is-deleted]`), which the starter does.
- **A selector that depends on being last** (`:last-child`) can land on a hidden deleted item. Avoid it for decoration.
- **`:has()` is missing in older OBS builds.** Put it only inside `:is()` next to an attribute alternative, for example `:is([show-only-header], :not(:has(#message:not(:empty))))`, so an unsupported `:has()` is dropped without killing the rule.
- **Text YouTube writes cannot be changed.** "Member for 6 months" and "Sent 5 gift memberships" are YouTube's strings. Restyle them (as a chip, for instance) and add your own label with `content`. Two narrow tricks exist: a fixed leading word can be cropped with a negative `text-indent` plus `overflow: hidden` (language-dependent), and digits can be isolated with an `@font-face` that covers every character except `0-9` (`unicode-range: U+0-2F, U+3A-10FFFF`), points at a local font and has `size-adjust: 0.01%`, listed before the real font: everything but the number collapses to nothing, in any language. Digits in a channel or tier name show too, so say so when using it.
- **The owner has no badge image.** Only member, moderator and verified badges exist as elements.
- **Zero-width spaces between the name and the message.** In ordinary chat `#content` holds text nodes with a zero-width space between `yt-live-chat-author-chip` and `#message-container`. Stack those two as blocks and each space becomes an empty 16px line. Give `#content` `font-size: 0; line-height: 0` and set the font on the children.
- **The Super Chat `#header` clips.** It has `overflow: hidden`, so a pseudo-element or child that moves outside it (a floating label, a ribbon that sticks out) is cut at its edge. Set `overflow: visible !important` on it.
- **Line clamp plus bottom padding shows the next line.** With `-webkit-line-clamp` the hidden lines still paint inside the element's own bottom padding. Put the padding and background on the wrapper (`#content`, `#message-container`) and clamp the text element with no padding of its own.

## Sizes YouTube sets where you would not expect

- **Super Chat avatar.** `#author-photo` is a 32 × 32 circle, but the `<img>` inside is 32 × 40 (it carries `width="40" height="40"` and only `max-width: 100%`). The photo is stretched and its bottom cut. A theme that shows this avatar sets the `img` to `width: 100%; height: 100%; object-fit: cover`.
- **Emoji.** In ordinary chat YouTube sizes them through `.emoji.yt-live-chat-text-message-renderer`; in Super Chat and membership messages through `#content.<renderer> img.<renderer>`. One theme rule on `#message img.emoji` across the renderers (as in the starter) keeps them equal.
- **Margins collapse** between stacked messages. A title that pokes out above a card needs the card's top margin to be at least that overhang plus the gap, or it touches the message above.
- **`<body>` is only as tall as the app.** `html` and `body` have no height of their own; they wrap `yt-live-chat-app` (100vh). A theme that sets the app to `100vh / scale` and scales it back with `transform` leaves `<body>` at the smaller height, and because the theme also gives `html` and `body` `overflow: hidden`, `<body>` clips the lower `1 - 1/scale` of the chat: the newest messages look stuck below the edge in OBS. The starter's `html, body { height: 100% !important }` prevents it.

## Rendering

- **White on white.** A white ornament or sparkle that overlaps a white message panel disappears where they overlap and reads as "cut off". Give ornaments an outline (a chain of 1px `drop-shadow`s in the ink colour) or keep them off same-coloured panels.
- **Outlined lettering.** `paint-order: stroke` on HTML text needs a recent Chromium; in an older OBS a thick `-webkit-text-stroke` eats the letters. A ring of `text-shadow`s gives the same sticker look everywhere.
- **Two pseudo-elements per element.** Decide early which element carries the ornament, the divider, the label. Running out forces a restructure.
- **Content-wide messages.** With `width: fit-content`, a name tag positioned absolutely does not widen the bubble, so a short message under a long name leaves the tag hanging outside. Keep the tag in flow and shift it with `position: relative`.
- **`!important` wars.** YouTube writes some sizes and colours with high specificity or inline (`--yt-live-chat-paid-message-*` variables on Super Chats, sizes on `#item-offset`). Use `outline.mjs --css` to see the rule you are fighting before adding `!important`.
- **Fonts.** A web font is fetched by OBS at runtime. No network means the fallback stack is what viewers see, so choose a fallback that keeps the layout.

## Motion

- **Loops outlive their purpose.** An `infinite` animation on a decoration keeps running on every message still on screen. Give entrance decorations a finite count and hide the layer (`visibility: hidden`) when it ends.
- **Animating a custom property that inherits** recalculates the whole subtree every frame, and everything it drives (`clip-path`, `mask`, `left`) repaints or re-lays out. Prefer keyframes on `transform` and `opacity` of the element itself.
- **`left`/`top` in an animation** trigger layout. Move with `transform`.
- **Moving backgrounds, animated masks and `filter` on a card-sized area** repaint the card every frame. One is tolerable; several cards on screen drop frames.
- **Fading a white ornament** lets the edge behind it show through; reduce the fade or keep it opaque.
- **Loops are not in sync** across messages, because each starts when its message arrives. Fine for twinkles; if they must be in step, drive them from one animation on the list.
- **A background browser tab freezes animations.** Judge motion in a visible window, not from a script-driven hidden one.
- **Slow drifts make text shiver.** The browser snaps text to whole pixels while the box behind it moves by fractions, so a label floating 2px up and down jitters against its own bubble. `will-change: transform` on the moving element makes both move together. To check a motion without watching it, pause every animation at a set time (`T.doc.getAnimations().forEach(a => { a.pause(); a.currentTime = t; })`) and screenshot.

## Process

- **Do not carry over the previous theme's composition.** A second theme in the same workspace should not be the first one recoloured.
- **Show before building.** A layout change after the CSS exists costs far more than the same change on a mockup.
- **Say what was not tested.** The tester is not OBS, and a capture is one day's structure.
- **Page-shell changes need a real chat.** The tester builds its own page around the captured chat. Rules on `html`, `body` or `yt-live-chat-app` (scaling above all) are checked in a real popout chat before delivery; SKILL.md says how.
- **Send Gift is not captured.** `yt-gift-message-view-model` is missing from `yt-data.js`, so nothing here can show or test it. Style it lightly, never guess its children, and report it as untested (see "Known gap" in SKILL.md).
- **Files can change between turns.** The user or another tool may have edited the theme; re-read before a large edit rather than writing over it.
