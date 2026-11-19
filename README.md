# youtube-livechat-css-skill

Installs the `$youtube-livechat-css` Agent Skill for designing one-file YouTube Live Chat themes for OBS browser sources.

The skill includes a scoped element guide for current YouTube chat renderers, nested IDs, role states, membership gifts, Send Gift, Super Chat, and Super Sticker.

It also bundles a local tester built from YouTube's real element structure and base CSS, a starter stylesheet, a mockup template, a list of known pitfalls, and a headless check that runs a theme through every message type.

```bash
npx youtube-livechat-css-skill
```

The interactive checkbox supports Codex, Claude Code, Cursor, Gemini CLI, OpenCode, and GitHub Copilot. Move with Up/Down, toggle with Space, select all with A, and install with Enter.

For non-interactive installs, pass target flags:

```bash
npx youtube-livechat-css-skill --codex --claude
npx youtube-livechat-css-skill --all
```

Run again with `--force` to update existing installations:

```bash
npx youtube-livechat-css-skill --all --force
```
