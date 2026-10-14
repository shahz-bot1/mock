# Swara Builder Playground — progress (resumable)

## Goal
Independent Swara Builder studio/playground in the mock repo (shahz-bot1/mock).
User reviews in the morning; winner gets ported to RagaMentor as the loop swara builder.
Adi tala only for now.

## Status: 2026-10-11 ~00:45 BST
- [x] Shared core: `swara-builder/core.{js,css}` — 8 curated ragas (anchor-checked),
      harmonium sample engine (copied samples from varisai/), synth fallback,
      raga-aware picker bottom-sheet, Adi playback w/ hold-extension + equal-subdivision
      stacks + scaled legato, theme, BUILD_VERSION footer.
- [x] P1 `p1-grid.html` — 8-slot avarta rows, stacks/holds/gaps, Adi anga dividers,
      sync-highlight playback, JSON export, localStorage `sb-p1`.
- [x] P2 `p2-composition.html` — geetham-style sections (Pallavi/Anupallavi/Charanams),
      text token entry (`,`,`–`,`.S`,`S'`,`R2+G3` stacks), auto bar lines every 8,
      optional sahitya lines, demo phrase prefill (labelled demo).
- [x] P3 `p3-flow.html` — free-time chip strip, per-chip durations ¼–2 beats,
      localStorage `sb-p3`.
- [x] P4 `p4-tapalong.html` — demo phrase loops 4 cycles, tap pads in time,
      quantize to grid (stacks per beat), result grid + copy JSON.
- [x] `index.html` — playground index with comparison guide.
- [x] Tests: `test-core.js` (27 assertions, green), `test-render.js` (DOM-stub
      render paths for all 5 pages, green).
- [x] Linked from mock home `index.html`.
- [x] PUSHED to shahz-bot1/mock — all 20 files confirmed in repo via git-tree API
      (7 pages/assets + 12 harmonium mp3s + mock home link).
- [x] Live verify — DONE 00:45 BST: all pages 200 at
      https://shahz-bot1.github.io/mock/swara-builder/
      (index, p1–p4, core.js, core.css). CDN converged after the push churn.
- [x] P3 inline ＋ (2026-10-11, user request): dashed ＋ chip at the end of the flow
      strip appends directly (same picker); build 2026.10.11-4.
- [x] P3 Replace fix (2026-10-11, user-reported): Replace ignored hold/gap picks.
      Now converts chip note→hold/gap; non-note chips get "Set swara"; stack
      pickers (P1/P3) offer swaras only; build 2026.10.11-5.
- [x] Holds inside stacks (2026-10-11, user request): stack pickers now offer
      `, hold`; a hold in a stack stretches the preceding sub-note
      (P1/P2/P3 playback + labels); P2 text accepts `R2+,`; build 2026.10.11-6.
- [x] P3 durations to 4 beats (2026-10-11, user request): chip duration cycle
      now ¼ → ½ → 1 → 2 → 4; build 2026.10.11-7.
- [x] Cache-busting (2026-10-11): core.js/core.css now loaded with `?v=<build>`
      query strings after a mixed-version incident (new HTML + stale core.js made
      stack-holds vanish); build 2026.10.11-8. Bump the query string on every push.
- [x] Picker multi-select stack mode (2026-10-11, user request): ＋ Stack opens
      the picker with a single/stack toggle; tap swaras (and holds) in order,
      see the ordered selection near the toggle, tap a chip to remove, ✓ Done
      appends all at once; build 2026.10.11-9.
- [x] Single-line stack bar (2026-10-11, user request): picker stack UI collapsed
      to one row — Stack toggle · ordered selection · ✅; build 2026.10.11-10.
- [x] Stack bar to bottom (2026-10-11, user request): sits under the swara grid
      in the thumb zone; build 2026.10.11-12.
- [x] Edit mode in bottom sheet (2026-10-11, user request): action bars removed
      from P1/P3 — tapping a filled slot/chip opens the picker in edit mode
      (current value shown, tap = replace, Stack toggle off by default, hold/gap/
      clear in sheet, P3 length control in sheet); add pickers also carry the
      stack toggle (off by default); no dedicated ＋ Stack buttons; build
      2026.10.11-13.
- [x] P3 playback crash fix (2026-10-11, user-reported): a local `const d`
      shadowed the store accessor, throwing on play; renamed; build 2026.10.11-14.
      Lesson: run the play handlers in the Node harness, not just render paths.
- [x] Prefill current stack in edit mode (2026-10-11, user request): flipping
      the Stack toggle in edit mode shows the current stack/single swara already
      selected; ✅ replaces the stack; build 2026.10.11-15.
- [x] Length in add sheet (2026-10-11, user request): P3 append sheet now has
      the Length row like edit mode; build 2026.10.11-16.
- [x] Stack toggle auto-on (2026-10-11, user request): editing a stack opens
      with the Stack toggle active and prefilled; single swaras keep it off;
      build 2026.10.11-18.
- [x] Lone hold prefills (2026-10-11, user request): editing a hold with Stack
      on shows the `,` in the selection; all-hold ✅ stays a hold;
      build 2026.10.11-19.
- [x] Stack taps always add (2026-10-11, user request): no toggle-off on
      re-tap; duplicates allowed, × on chips removes; build 2026.10.11-20.
- [x] Shubhapanthuvarali added (2026-10-11, user request): melakarta 45,
      S R1 G2 M2 P D1 N3 (verified: prati madhyamam since 45 > 36);
      build 2026.10.11-21.
- [x] All-hold stacks kept (2026-10-11, user-reported): ✅ no longer collapses
      `,,,,` to a single hold; stored and shown as built, plays as silence;
      build 2026.10.11-22.
- [x] All-hold stacks extend (2026-10-11, user-reported): `[S,,,][,,,,]`
      now holds S through both; all-hold stacks behave like holds in P1+P3;
      build 2026.10.11-23.
- [x] P3 playhead per chip (2026-10-11, user-reported): highlight now fires
      for every chip (holds/all-hold stacks included), not just sounding events;
      build 2026.10.11-24.
- [x] P3 stack timing fix (2026-10-11, user-reported): stack now subdivides
      its own chip beats; outer holds extend the final sub-note only (was
      smearing the extension across all sub-notes); build 2026.10.11-25.
- [x] Compose Studio preview (2026-10-12, design confirmed by user): name
      locked "Compose Studio"; list of compositions (most-recent first, row
      ▶ play/stop), editor = P3 flow strip + loop toggle + Export (JSON
      envelope) + Delete; Import on the list ignores name clashes (fresh id
      every time); P3 gained Export in the same envelope for migration.
      Live at /mock/compose-studio/, build 2026.10.12-1; test-compose.js
      27 assertions green. Awaiting validation → then port to RagaMentor.
- [x] Editor-never-unhides fix (2026-10-12, user-reported "page empty on add
      new composition"): view switcher set inline display but the `.hidden`
      class overrode it — both views ended up hidden. Now toggles the class;
      test-compose asserts effective visibility (33 assertions);
      build 2026.10.12-2.
- [x] Insert before/after (2026-10-12, user request): chip edit sheet gains
      insert actions (picker `insert` option); opens the new-chip sheet and
      splices at i / i+1. Wired in Compose + P3; build 2026.10.12-3. Moved
      2026-10-13 (user request): a ＋ button at the sheet's top-right opens a
      popover with "Insert before" / "Insert after" (the two-button row is
      gone); build 2026.10.13-3. The popover dismisses on any other tap inside
      the sheet (capture-phase listener, tap swallowed so the control under it
      doesn't also fire); build 2026.10.13-4.
- [x] Crossfaded sustain loop (2026-10-13, user-reported + approved): a long
      hold changed character ~5 beats in — the hard buffer loop jumped from
      the sample tail back to 0.5s. playNote now loops the sustain as a chain
      of overlapping segments with crossfades (scheduleSample); short
      notes unchanged. test-longhold.js covers the scheduling; stack-hold/
      repro/P3 playback suites still verified with identical timings;
      build 2026.10.13-1. First attempt used exponential fade ramps — the pair
      collapses to ~0.02 combined at the crossfade centre, so the note audibly
      dipped and returned (user-reported same day). Replaced with equal-power
      sine/cosine curves (fadeIn² + fadeOut² = 1, 0.8s fades); the test now
      asserts the COMBINED crossfade power stays ~1; build 2026.10.13-2.
- [x] Raw JSON edit mode (2026-10-13, user request — placement brainstormed,
      he picked option 1): "{ } JSON" toggle beside Export swaps Setup +
      Phrase cards for a monospace editor showing the composition (name/
      ragaId/saOffset/tempo/loop/chips, one chip per line for section
      copy/paste) with Apply / Copy all / Cancel. Apply parses and runs the
      SAME sanitizer as Import (envelope pastes also accepted); invalid input
      alerts and stays in raw mode, nothing saved. test-compose 53
      assertions; build 2026.10.13-5.
- [x] PORTED TO RAGAMENTOR (2026-10-13, user go-ahead): Compose Studio is the
      fifth studio, live at shahz-bot1.github.io/RagaMentor/compose/ with a
      home-launcher card. Built on the shared architecture: shared/studio.css,
      StudioTheme (shared slowloop-theme key), StudioUI.tempoSlider,
      StudioAudio — extended additively with playSampledSustain (the
      crossfaded sustain chain) in shared/audio.js; samples from
      raga/samples/harmonium/. Same localStorage key (compose-studio-v1,
      same origin) so preview compositions carry over. Tests:
      ios-slowdown-app/tests/compose-test.js (47) + sustain-test.js (14);
      PLAN.md synced. Noted during port (NOT changed — faithful to the
      validated preview): ragaPickerList offers arohana sthanas only, though
      its comment says aro+ava union (e.g. Bhairavi's ava-only D1 isn't in
      the picker) — user decision needed before changing.
- [ ] Deep-research handoff (carnatic-composition-notation) — when it arrives,
      fold notation findings into P2 + note here; re-push if changed.

## Notation decisions (locked with user in chat 2026-10-10/11)
- Slot model: note(stack) | hold `,` (extends previous) | gap `–` (silent) | empty.
- Stacks subdivide the beat equally; no dheergam inside a stack.
- `.` = lower octave marker, `'` = upper (display); text entry in P2 uses `.S` / `S'`.
- SEMI map copied verbatim from shipped Varisai Studio — do not "fix" enharmonics.

## If resuming after shutdown
1. `cd ~/workspace/mock/swara-builder && node test-core.js && node test-render.js`
2. Check `git` — push is via `~/workspace/skills/github/bin/gh_push.py`
   (stored PAT; see memory "Push lessons 2026-10-08").
3. If research handoff arrived, update P2, bump BUILD_VERSION in core.js,
   re-run tests, re-push, verify live.
4. Morning: deliver summary of findings + recommendation to user.

- 2026-10-13 (build 2026.10.13-7): chips now show octave dots without losing the compact one-line layout — each swara is an inline-flex column with reserved 9px dot slots above/below (user-approved from a rendered mockup). Same CSS shipped in RagaMentor Compose Studio. Picker list is the aro+ava union (build -6).

- 2026-10-13 (build 2026.10.13-8): chip octave marks are now combining diacritic dots on the letter glyph (scholarly print style, user-chosen over the reserved-slot design): new SB.chipLabelHTML for chips in P3 + Compose preview; P1 slots keep slotLabelHTML/CSS dots. Shipped Compose Studio uses the same diacritic labels.

- 2026-10-14: LoopLab swaras-section design mock (looplab-swaras/): loop-private phrase — Swaras section on the loop screen with Add/Edit, read-only diacritic chips, Play + tempo in the section, composer = the Compose editor forked. Stored under its own key, never in Compose Studio. Awaiting user design feedback.

- 2026-10-14: LoopLab swaras mock v2 — two loops per song, each with its own Swaras section: line 1 filled, line 2 shows the EMPTY state (user asked for it explicitly). Per-loop Add/Edit/Play/tempo; phrases carry a loopId.

- 2026-10-14: Swaras section layout decided by user: Option B (round Play in the section header, top right, beside Edit) with a tempo SLIDER row (not the stepper) for consistency with the other studios. Delete swaras lives in the composer with confirm.

- 2026-10-14: picker stack confirm is now a proper Done button (was ✅) — mock core build 2026.10.14-1, synced with the shipped LoopLab + Compose fix.

- 2026-10-14: RagaBrowser pick link (design mock): raga-pick/ page carries the real RagaBrowser library (87 ragas) with a pick mode; composers link out via "Choose in RagaBrowser" and auto-resume with the pick applied. Picks match the built-in table by scale signature (Dheerasankarabharanam = Shankarabharanam) else save to a personal registry ("Your ragas", rb- ids) in localStorage. Mock core build 2026.10.14-2.

- 2026-10-14: raga dropdown reworked per user: groups are Recents (last 5 set, MRU) then Favourites (RagaBrowser stars + adopted picks, mirrored into the registry), then the built-in 10, and the last option is "Select from RagaBrowser..." (replaces the separate link). Picker page gained star toggles writing the real raga-favs key + registry mirror. Mock core build 2026.10.14-4.

- 2026-10-14: dropdown final shape (user decision): composers show ONLY Recents, Favourites and a "RagaBrowser >" entry (opens the picker) — the built-in 10 no longer appear in composer dropdowns. Groups deduped (first group wins); the current raga always appears (leads Recents if in neither group). Playground prototypes (no picker trip) keep the built-in list. Mock core build 2026.10.14-5.
