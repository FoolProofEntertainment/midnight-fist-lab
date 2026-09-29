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

**Important (learned 2026-09-29):** the runtime loader is NOT a block on page
6720. Page 6720 carries the comment `<!-- pp-mfl: removed duplicate
orbital-v2 inline loader (maps-v4 via WPCode pp-mfl-runtime-loader) -->` —
the loader lives in the WPCode snippet **"MFL runtime loader clean
20260907" (ID 11313, Active, Site Wide Header, conditional: Page URL Contains
"midnight-fist-lab")**. The `page-scripts/pp-mfl-runtime-loader.js` copy in
this repo is a stale snapshot of that snippet; treat the snippet as
authoritative.

Game JS changes: upload the edited file through wp-admin Media Library (as a
new file; WordPress may keep or uniquify the name — record the final URL),
then edit WPCode snippet 11313's `urls` map to point `game` at the new URL
with a fresh `?v=` cache-buster. Keep a backup of the replaced file every
time — the superseded upload is the rollback. Page-script changes: edit the
matching Custom HTML block on the MFL page (ID 6720) in wp-admin.

## Fix pass 1 — deployed live 2026-09-29 04:16 MDT

Game JS: `https://plot-pulse.com/wp-content/uploads/2026/09/midnight-fist-game-18.js?v=20260929fix1`
(via snippet 11313). Page patch: `page-patches/mfl-cleanup-affordance-20260929.html`
(hide `#arena-walk-test`, roster bottom-fade affordance) as a Custom HTML
block at the end of page 6720.

- Fix 1 (partial): `#arena-walk-test` section hidden via CSS. The
  "SPACE UPPERCUT" / "WINDOW UPPERCUT" badges are intentional finisher badges
  in `renderArenaPicker()` — left alone. Raven's Hollow flash/seizure warning
  preserved.
- Fix 2: fight clock now uses `performance.now()` wall time stamped at fight
  start (both entry paths); the old dt-accumulator ran slow at low frame
  rates (verified: 60 real seconds at 10fps showed 79s before, 39s after).
- Fix 3: hit-stop and screen shake already existed in `applyHit` (40/100ms,
  shake 6/14) — left intact; added damage numbers riding the existing
  `comboFloats` pipeline (white, red ≥18, gray when guarded).
- Fix 4: result screen verified functional in source — `maxCombo`, `powers`,
  `finisher` are all tracked and rendered with `|| 0` / `|| "None"` fallbacks.
  No change.
- Fix 5: display name "Plot-Pulse Theam" → "Plot-Pulse Team" (internal id
  `plot-pulse-theam` kept for save compat); "Win N fight(s)" pluralized;
  "Dragon Born" → "Wyrm" (id `dragon-born` kept).
- Fix 6: `separateFighters()` is now wall-aware — when one fighter is pinned
  at a wall, only the other is pushed, with unmoved slack handed over; unit
  tested (corner-left/right/midfield/reversed all hold 54px).
- Fix 7: roster grid gets a bottom fade while more fighters sit below the
  fold (`mfl-at-bottom` toggle via scroll + MutationObserver).
- Fix 8: the GET READY 10s hang did not reproduce in two live boot/fight
  cycles; left unpatched rather than fixed blind.

Rollback: in snippet 11313, swap the `game` URL back to
`.../midnight-fist-game-18-maps-v4-window-finisher-feelpack-v02.js?v=20260911v02`.
Old file retained in the Media Library.

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
