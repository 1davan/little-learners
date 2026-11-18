# Storyboards: what actually happens in each game, beat by beat

One file per game: `docs/storyboards/<gameId>.md`. A storyboard is written **from the code as it is now** (`app/src/lessons/<id>*.js`, the engine in `app/src/engine/`), not from design docs or intentions. If the code does something odd, write down what it does.

## Format

Start with a header:
- the game name and id
- the world
- the learning goal in one line
- the level count

Then, for **each level** (L1, L2, L3), give the opening and then every round in order, as a numbered beat list. Write out the rounds or puzzles one by one; only summarise a round if it is truly identical to one already listed, and say which.

For each beat, give one row:

| # | What the child sees (scene, camera, who moves where) | Narrator says (exact caption; mark `[voiced]` or `[caption only]`) | Prompt: what she must do (tap / drag / hold, on what, where on screen) | How she knows (demo hand? glow? Go! badge? when?) | If right (feedback: animation, sound, voice) | If wrong or nothing (redirect line, nudge timings, hint replay) | Then |

After the table, add:
- **Ending:** what happens at the end of the level (finale, photo, keepsake) and how she leaves.
- **Timings:** rough seconds per round, and any waits longer than about 3 s where she can't act.
- **Every narrator line:** the full list of caption lines in this level, in order.

Keep it factual and concise; this is a working document an auditor will check against a 2-year-old's eye view.

## Audit (`docs/storyboards/AUDIT-<world>.md`)

For each game, the auditor checks every beat for:
1. **The prompt:** is it concrete for a 2-year-old? Does it name the action and the object, with no adult or abstract words ("Bubbles in" fails)?
2. **Showing how:** does every new action get a slow hand demo before she's expected to do it? Is there a Go! badge, a glow or bob on the target, and a hint replay when she's stuck?
3. **Logic:** does each step follow from the last? Is anything unexplained, or a dead end, or a moment where she can't tell what to do or whether she succeeded?
4. **Pacing:** no frantic rushes and no long dead waits.
5. **Voice:** narrator lines that are needless, repetitive, too long, or unvoiced where a voice is needed.
6. **Learning:** does each round actually teach the stated goal, and do the levels progress sensibly?
7. **Satisfaction:** does her own action cause the payoff? Does the creation persist?

Output per game: a verdict (good / needs work / poor), then each issue with its beat number, severity (blocker / major / minor) and the exact fix. Include rewritten caption lines.
