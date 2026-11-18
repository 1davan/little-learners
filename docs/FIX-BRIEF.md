# Fix pass brief (existing games)

Each fix agent owns a few games and touches each of them **once**, applying everything below together.

## Read first
1. `docs/FEEL-BRIEF.md`, especially rule 0 (no waiting: she can act within 1.5 s of every round, never waits more than 2 s) and rule 3 (everything she needs fully on screen).
2. `docs/QUALITY-BRIEF.md` and `docs/SATISFACTION.md`. Apply SATISFACTION's per-game changes for your games; they were deferred to this pass.
3. `docs/QA-ISSUES.md`:
   - Part 1 (top P1s, repeat problems, teleport log).
   - Your games' sections in Part 2.
   - Part 3A entries for models that failed in **your** games.
4. `docs/storyboards/AUDIT-<world>.md` (your games) and `docs/storyboards/<game>.md`.

## What to fix
- **Must fix:** every QA P1 and P2 and every audit blocker, major and minor for your games. P3s where cheap.
- **Overlaps:** where QA and an audit overlap or conflict, follow the audit for design and wording, and QA for visuals.
- **Models (QA Part 3A):** models that failed in your games are yours to rebuild or fix with Blender (`tools/blender`, `build.sh`), at premium quality with 3+ render-and-fix rounds. Another agent handles the Part 3B catalogue, skipping anything listed in 3A.
- **Creations:** her creation must persist into the finale ("Look what you made!" must show what she made). Use `creationView` / `creationObjects` and the keepsake tray.

## Rules
- **Engine files are off limits.** Don't edit `app/src/engine/*`; the coordinator owns them. If a fix truly needs an engine change, describe it in your report.
- **Shared files** (`meta.js`, `src/main.js`, `home.js`, `tools/autoplay.js`, `docs/WORLDS.md`): small exact Edit additions only, re-reading right before each edit.
- **Voice lines:** every new or changed caption goes in `tools/voice/new-lines.txt`. No emoji in captions. Use `say(text, {repeat:true})` for teaching words she needs to hear again.
- **Quality bar:** no clipping and no teleporting, ever. Characters walk and never block targets. Calm motion, very few sounds, no boings.
- **Storyboards:** update `docs/storyboards/<game>.md` to match what you changed.
- **Git:** don't commit.

## Testing (re-test only what you changed)
- One Electron at a time, with a unique user-data directory. Kill only your own processes, never `pkill`.
- Run `tools/qa-shots.sh <game> <level> …` for each changed level. Inspect the sheets, plus zoomed close-ups of every contact point you fixed.
- Use real pointer events (mouse down/move/up through the input system) for every core interaction you changed.
- Log round-start → input-ready on a full play of each level and report the numbers.
- Screenshots at 1366x768 and 1920x1080 for the framing fixes.

## Report
Per game:
- what you fixed
- what you didn't fix, and why
- timing numbers
- any engine change you need
- screenshot paths
