# Midnight Fist Lab

Standalone source for the Midnight Fist Lab fighting game on plot-pulse.com
(`https://plot-pulse.com/midnight-fist-lab/`).

Pulled together 2026-09-29. The game previously lived only as inline page
content + media-library JS on the live WordPress site; this repo is now the
working copy. **The live site remains the deploy target** — changes here go
live via the documented deploy path below, not automatically.

## Layout

- `page-midnight-fist-lab.html` — the WP block template (from the
  plot-pulse.com repo). Shell only; the game itself is page content.
- `page-scripts/` — the 23 inline `<script>` blocks from the live page,
  extracted 2026-09-29, one file per block id:
  - `pp-mfl-boot-bridge.js`, `pp-mfl-runtime-loader.js` — boot + script loading
  - `pp-mfl-affiliate-rotate-20260918.js`,
    `pp-mfl-affiliate-rotate-20260919.js` — ad-rail rotation
  - `pp-mfl-uphold-rail.js`, `pp-mfl-amazon-splinter.js`,
    `pp-mfl-scrambly-std.js` — rail ad cards
  - `pp-mfl-input-harden-20260909.js`,
    `pp-mfl-force-fight-controls-js-20260909.js`,
    `pp-mfl-mobile-joystick-only-js-20260909.js`,
    `pp-mfl-mobile-layout-*.js` — input + mobile fixes
  - `pp-mfl-countdown-fight-gate-20260909.js` — fight countdown gate
  - `pp-mfl-arena-*.js`, `pp-mfl-mute-win-narrator-20260909.js`,
    `pp-lab-game19-override*.js`, `pp-lab-fs-wire.js` — arena/finisher patches
- `vendor/` — the runtime JS loaded from `wp-content/uploads` (NOT in any
  previous git repo; pulled from the live site):
  - `midnight-fist-game-18.js` (692 KB) — the game engine
  - `midnight-fist-storage-12.js` — storage layer
  - `midnight-fist-audio-12.js` — audio layer

## Deploy

Game JS changes: upload the edited file through wp-admin Media Library
(replace the existing upload) or the file editor path the site uses, then
bump the `?v=` query string in `pp-mfl-runtime-loader.js` so browsers fetch
the new copy. Page-script changes: edit the matching Custom HTML block on
the MFL page (ID 6720) in wp-admin. Keep a backup of the replaced file every
time — the superseded upload is the rollback.

## Approved fix list (2026-09-29, owner-approved)

From the live playtest critique, in fix order:

1. Remove dev debris: the "ARENA WALK TEST (LOCATION PROTOTYPE)" arena tile,
   its "FIND NEARBY ARENA" / "DESKTOP TEST" buttons, and placeholder arena
   name suffixes ("SPACE UPPERCUT", "WINDOW UPPERCUT",
   "RAVEN'S HOLLOW RELAY. FLASH / SEIZURE WARNING").
2. Fix the fight clock (reported 19s for 60s+ of real play).
3. Hit feedback: hit-stop, damage numbers, screen shake — blows feel weightless.
4. Result screen: BEST COMBO / POWER ATTACKS / FINISHER render blank — track
   them or cut them.
5. Copy: "PLOT-PULSE THEAM" → "TEAM"; "Win 1 fight(s) as X (0/1)"
   pluralization; DRAGON MARTIAL ARTIST vs DRAGON BORN DRACONIC WARRIOR
   near-duplicate names.
6. Corner play: fighters interpenetrate when cornered; camera doesn't adjust.
7. Roster scroll affordance: only ~10 of 30 fighters visible, nothing signals
   the list scrolls.
8. Flaky "GET READY" hang (~10s stall seen once on retry); boot hung once in
   an earlier repro but booted clean later — nondeterministic, still a bug.
9. Ad rails: restyle to the dark terminal theme, 2 cards per rail + rotation
   (mockup: `../your_files/mfl-rail-redesign-mockup.html` in the assistant
   workspace). Rail CSS must stay scoped to rail selectors — the character
   preview panel is never to break.

## Rules

- Never alter the live game without the owner's fresh, specific go-ahead.
- The character preview panel is sacred: rail/page edits must not touch its
  markup, CSS, or JS.
- Every site change gets a timestamped line in the site-change log.
