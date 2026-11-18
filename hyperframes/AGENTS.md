# Working on the HyperFrames composition

Follow the [project instructions](../AGENTS.md) for the recording, portrait direction, output format and review. This folder contains the HTML/GSAP composition. Use the HyperFrames skill for timeline behavior and its CLI skill for preview and verification.

## Commands for this checkout

Run these from the repository root. The CLI is installed with the project.

| Task | Command |
|---|---|
| Check the composition after an HTML edit | `pnpm hf:check` |
| Inspect the moments you edited | `pnpm exec hyperframes snapshot hyperframes --at 1,3,5` (replace those seconds with your cues) |
| Preview in a persistent Studio session | `pnpm exec hyperframes preview hyperframes --background`, then verify with `pnpm exec hyperframes preview --status` |
| Open CLI documentation | `pnpm exec hyperframes docs <topic>` |
| Export a directed project's editable composition | `pnpm video hyperframes <name> --format shorts` |

If the composition has been edited in the desktop app, use `pnpm exec hyperframes catch-up` from its folder before further edits. Resolve check errors and inspect the changed frames at their actual times. Use the existing pinned CLI.

## Key Rules

1. Every timed element needs `data-start` and a duration. `data-start` is what marks it as timed; `data-track-index` is an optional Studio display lane the render never reads
2. Give timed visual elements `class="clip"`. The framework keys visibility off `data-start`, not the class, but the shared `.clip` CSS is what gives a scene its full-frame box, and `lint` warns without it
3. Register one paused root timeline per composition on `window.__timelines`:
   ```js
   window.__timelines = window.__timelines || {};
   window.__timelines["composition-id"] = gsap.timeline({ paused: true });
   ```
   Scene timelines manually added to this root must not be paused. A paused
   child does not advance when the root is seeked. The runtime activates
   registered composition siblings, not arbitrary nested scene timelines.
4. A video with sound keeps it on the `<video>` (`data-has-audio="true"`, no `muted`). Use a separate `<audio>` for music, voiceover, replacement audio, J/L cuts, or audio detached in Studio. Silent footage and b-roll: `muted`.
5. Sub-compositions use `data-composition-src="compositions/file.html"` to reference other HTML files
6. Only deterministic logic — no `Date.now()`, no `Math.random()`, no network fetches
