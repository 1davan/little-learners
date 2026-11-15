# World 2 (Beach) and levels: design

Fable 5.2 designed this world. The notes below record what was built.

## Changes across all ten games

- **Immediate cue.** Every round starts with `cue()`: Pip says the instruction while a ghost hand demonstrates the move. Levels 1 and 2 show the real answer so the child can copy it. Level 3 shows the gesture without the answer: it scans over the choices for tap games and lifts the object without placing it for drag games. The cue plays again after 6 s with no touch. After 12 s the hint adds a glow. After 20 s, or after two wrong tries, the round becomes errorless. After a wrong try the hand shows the move again.
- **Captions.** Each spoken line also appears in a bubble at the top of the screen.
- **Levels.** The parent chooses Level 1, 2 or 3 on the home screen and it applies to every game. Levels no longer adjust themselves automatically. Each session records the level it was played at.
- **Worlds.** The home screen has one page per world. Swipe, or tap ◀ ▶, to change world. Each world has its own sky, ground and props, in both the home screen and its games.
- **Ghost hand.** `fx.ghostPath(points, {mode})` supports four modes: `tap`, `drag`, `rub` and `scan`. It leaves a dotted trail and a tap ripple, and disappears as soon as the child touches the screen.

## Games

### Pattern parade
**Topics:** `mt_ZjIFGc6zPW`, `mt_WXW0hjNhph`

Items pop in along a boardwalk while Pip chants their names. Each kind of item has its own xylophone note. The child taps the next item from a towel.

| Level | Patterns | Choices |
|---|---|---|
| 1 | AB | 2 |
| 2 | AB, then AAB and ABB | 3 |
| 3 | AAB, ABB and ABC; the last round has a missing middle item | 3 |

### Where's Crab?
**Topics:** `mt_qeZYF6HZ4o`, `mt_VY3rBq8RyP`

The child drags Crab in the bucket, on the stool, or under the stool.

| Level | Props shown | What counts as correct |
|---|---|---|
| 1 | Only the prop that's needed; "in" or "on" | The one live spot |
| 2 | Both props | Dropping anywhere on the right prop |
| 3 | Both props; the last round swaps them | The exact spot ("on" and "under" share the stool) |

### Which has more?
**Topic:** `mt__h7hvT4tEb`

Two towels on drying racks hold groups of items. After a correct tap, the two groups line up one-to-one so the extras stand out.

| Level | Groups |
|---|---|
| 1 | Ratio of at least 3:1 |
| 2 | Ratio of at least 1.5:1 |
| 3 | Groups differ by one; some rounds ask "fewer"; some rounds have big items against small, or spread out against packed |

### Touch Bear's nose
**Topic:** `mt_83gRQ9OPkc` only. The private-parts topic was deliberately left out.

Bear is used instead of Pip because Bear has a nose, mouth, ears, hands and feet. Every body part reacts when touched.

| Level | Parts used |
|---|---|
| 1 | Nose, tummy, ears and feet only |
| 2 | All seven parts |
| 3 | Sense clues ("We smell with our nose!"); the last two rounds switch to Bunny |

### Splash wash
**Topic:** `mt_vbbxnY7ZDT`

The child rubs sandy spots with a sponge. Rubbing is measured by how far the sponge moves on screen near a spot. Tapping a spot also cleans part of it, except at Level 3.

| Level | Spots per round | Rubbing needed (share of the screen's short side) | Extra rule |
|---|---|---|---|
| 1 | 1–2 | 0.35 | None |
| 2 | 2–4 | 0.6 | None |
| 3 | 3–4 | 0.8 | The sponge must be dipped in the water bucket first and dries after 2 spots |

The last round of every level ends with "Clean hands! Now eat!"

The exact round data for every game is in `PLANS` at the top of each file in `app/src/lessons/`.
