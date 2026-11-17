# Visual QA pass: production polish

The parent asked for this check:

> "It needs to look like a really clean, tidy game, with really good production quality. I'm not saying remove anything, but things have to be tasteful and tidy. There's thought behind the placement of effects, and they're not sloppily done. We don't want slop."

## How
1. Capture one sheet per game and level:

   ```
   tools/qa-shots.sh <gameId> <level 0|1|2> $TMPDIR/qa 10 <interval_ms>
   ```

   - It plays the level with autoplay and takes 10 screenshots spread across the play: `<game>-L<l>/shot01..10.png`, which are JPEG data despite the `.png` name.
   - It also makes a 5×2 contact sheet, `<game>-L<l>-sheet.jpg`.
   - Choose the interval so the 10 shots cover the whole level. Most levels finish in 20–40 s (about 2500–4000 ms). If shot 10 is still mid-game, use a longer interval.
   - Run only one Electron at a time.
2. Read every sheet. Open the full-size shots, or crop them, wherever something looks off:

   ```
   sips -c H W --cropOffset Y X in.jpg --out out.jpg
   ```

3. Fix the problems in the game or engine files you own. Re-capture **only** the game and level your change affects. Never re-run sheets that already passed.

## Checklist: every frame must pass all of these
- **Clipping:** no object passes through another, no character sinks into or floats above anything, nothing pokes through clothes, walls, containers or the ground.
- **Lighting and shading:**
  - no black or dark blotches, harsh black shadows or shadow acne
  - no z-fighting flicker or stripes, no missing or inside-out faces, no surfaces showing black from behind
  - no stray outline (ink) lines inside objects
- **Deformation:** no stretched or morphing meshes, twisted limbs, collapsed bones, or exploded or shrunk models stuck mid-animation.
- **Effects:**
  - Confetti, rays, halos, glows, sparkles, floating numbers and splashes should be tasteful and in proportion.
  - They should be placed with intent (near the action, not covering the child's target or the characters' faces) and timed to clear quickly.
  - They should never pile up, cover half the screen, look garish, or overlap each other messily.
- **Composition:**
  - The subject is clear and nothing important is cut off at the frame edges.
  - Captions don't cover anything important.
  - Bubbles and hints are readable and sensibly sized, with no tiny unreadable thought bubbles.
  - Props and characters have tidy spacing.
- **Consistency:** the art style matches across all objects (sculpted Blender look). No leftover crude code-primitive objects (a hat made of a plain cone, a flat disc used as a puddle) unless they're deliberately simple and clean.
- **UI:** buttons, the sticker shelf, the level panel and the reward screens look clean and intentional.

## Report
For each game and level, give `PASS`, or list the issues found and how each was fixed (file: change).
