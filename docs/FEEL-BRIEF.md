# Feel brief: calm, clear, satisfying

## The parent's feedback (latest)
- The voiceovers repeat so often that it becomes annoying.
- Some are cut off really quickly.
- Some voiceovers are not needed.
- Some of the games are way too quick and frantic.
- New games are viewed from really far away. They should be zoomed in on the thing you're doing.
- Games need to show how to do it more (the washing one especially).
- Games have to be really satisfying and not too fast-paced.
- Too many boings and too many sound effects.
- Models still clip into things in some games.

## Already fixed in the engine (don't redo)
- **Voice:**
  - A line is spoken at most once every 30 s; repeats show the caption only.
  - A new line waits for the current one to finish instead of cutting it off.
  - Praise is mostly caption-only.
- **Sound:**
  - Boing-type sounds share a 1.2 s cooldown at half volume.
  - At most 4 effects play in any 0.7 s.
- **Timing:** after a correct answer the game waits 1.6 s (was 0.85 s) before the next round.

## Rules for every game
0. **Hard rule: no waiting.** She must be able to touch something within about 1.5 s of every round starting, within 2 s of the game opening, and never wait more than 2 s with nothing to touch.
   - Lay out the next round while the last celebration plays.
   - Keep friends and carts already in place rather than having them arrive from far away.
   - Keep input open while voice lines play.
   - Log round-start → input-ready on a full play and report the numbers. (A 15 s cart arrival made the parent furious.)
1. **Pacing: calm, never frantic.**
   - Movements ease over 0.5–0.9 s.
   - Nothing rapid-fire.
   - Give the child time to look at what just happened before the next thing starts.
   - Characters walk, they don't zip.
   - No more than one celebratory effect at a time.
2. **Show how, clearly.**
   - The first time each new kind of action appears in a game (drag the soap, tap the tap, pour, chop…), show a slow, obvious hand demo (`fx.ghostPath` / `fx.ghostHand`) on the real object.
   - Show it again when the child is stuck for about 8 s.
   - This replaces the old "one demo per game" rule.
   - The thing to use gently glows or bobs.
3. **Camera: zoomed in on the action.**
   - Frame the active station tightly. The object being worked on should fill roughly 40–60% of the screen height.
   - If the game moves between stations (sink, bath, bed; board, pot), glide the camera to each one with `setCamera`, eased over about 0.8 s.
   - The wide view is only for a short establishing moment, if at all.
   - The thing she is making, and every target she needs, must always be fully on screen. Nothing is cut by the frame edge or hidden under UI.
     - Compute framing from the real bounding box and the camera's FOV and aspect.
     - Check at 1366x768, 1280x800 and 1920x1080.
4. **Voice only where it helps.**
   - Speak short instructions ("Tap the tap!", "Put the crab ON the bucket!").
   - Use `this.say(text, { voice: false })` for everything else: praise, fillers, counting chatter, story narration that the visuals already carry, and any line that repeats in the same round.
   - Keep instruction lines short.
5. **Sound: fewer, nicer sounds.**
   - One clear, satisfying sound per meaningful action (chop, plop, sizzle, splash, click).
   - No boings for routine things.
   - No sounds on idle animations.
   - Use `sfx.*` sparingly.
6. **No clipping, ever.** Check every object you place, move or animate against everything around it, and at every camera position.
7. **Testing:**
   - Use `tools/qa-shots.sh <game> <level> $TMPDIR/qa 10 <ms>` (one Electron at a time). Review the sheets, fix, and re-capture only the game and level a change affects.
   - New caption lines must stay short so they can be voiced later. Put any new or changed lines in `tools/voice/new-lines.txt`, one per line.
