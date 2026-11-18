# Shape house (id: `shapes`)

- **World:** Meadow.
- **Learning goal:** 2-D shapes: drag each shape piece into the window of the same shape (circle, square, triangle, rectangle). Later pieces are small, tilted or upside-down: a shape is still a shape.
- **Levels:** 3 (6 rounds each). L1 a cottage, L2 a toy train, L3 a castle.
- Source: `app/src/lessons/shapes.js` (+ `shapes-themes.js`, `shapes-parts.js`).
- Updated for the fix pass (AUDIT-meadow S1–S10, QA shapes 1–27).
- Tags: `[voiced]` has a clip; `[to record]` is in `tools/voice/new-lines.txt` and silent until recorded; `[caption only]` is never spoken.

## Behaviour shared by every round

- **Camera:** (0, 3.5, 13.2) looking at (0, 2.8, 0). For the castle it stands back to z 14.2 so the tower tips sit clear of the Home and settings buttons. Pip stands at (-5.6, 0, 0.6), not pressed against the frame edge. The snowman and near-flank scenery are hidden.
- **Windows:** two or three at the start. While windows move to new places, drops on them are off for 1.5 s (the piece floats home). New ones join at the end of the round before (`prepNext`): the others slide over, the new window pops in at its place once they have moved, and it glows for about 1.3 s as its name is said at the next round's start. Four windows on the train and castle sit closer (±3.0 / ±3.1) at 0.85 scale, so none hangs off the building. A window that has far to go shrinks a little (to 0.6 at most). If it moves right it passes in front of the others, never through them. Its seated piece and accessory move with it.
- **Arrival (about 1.1–1.4 s):** out of the door, popped out of the chimney, funnel or tower, dropped from the sky, rolled in, or tossed by Pip (from beside him, never over his face). No grabbing and no Go! until it has landed (`busy` during `enter`). No sneezes, winks or glasses before she acts.
- **The demo (round 1, and again at 8 s stuck):** the ghost hand carries the real piece. It lifts, takes its window's size, turns to fit, hovers over the right window and floats back. A touch ends it, and the piece floats home unless she picked it up.
- **Drag:** the piece takes its window's size as she lifts it. Near the right window it is pulled in and turns to fit, its face lights up and the window rim pulses (no sound).
- **Right window:** the piece floats over the window (0.3 s), a held breath (`beat`, 0.35 s), and the round moves on: the next piece starts arriving at once while this one sinks in with a wooden tok (the level's rising `sfx.step`) and **stays seated in its window** for the rest of the level. On the same beat the window lights and one roof lamp lights (pale glass, then yellow). The window's accessory pops on: party hat, crown, bow or flower, beside the lamp row and one per window, otherwise on the next lit window without one. Then one friend pops up at the window ledge, waves and ducks down (no sound). Caption `{Shape}!` `[caption only]`. If the window already holds a piece (each shape comes twice), the earlier piece hops down onto the window box, small, and sits there. The next round's windows are laid out during the peek, and the next prompt waits until they have settled.
- **Wrong window:** a soft bump. The piece floats up to just short of the window, the window wobbles slightly with one soft thud, and the piece floats back. No stars, no dizzy face, nothing to chase. Redirect line (below). After 2 wrong drops in a round, the other windows shrink (errorless).
- **Stuck ladder:** 5 s, the prompt plus the piece hops. 8 s, the prompt is spoken again, a glow, and the demo again. 20 s, errorless. 90 s, home.

## Level 1: cottage (start: circle, square; triangle joins after round 2)

| # | Piece and arrival | Narrator says | Prompt | If right | If wrong |
|---|---|---|---|---|---|
| 1 | Red circle, out of the door. | "Circle! Put it in the circle window!" `[to record]` | Drag it into the circle window (demo shown). | Seated, lamp 1, party hat, bunny peeks. | "That's the square. Find the circle!" `[voiced]` |
| 2 | Blue square, out of the chimney. | "Square! Put it in the square window!" `[to record]` | Square window. | Seated, lamp 2, cat peeks. | "That's the circle. Find the square!" `[to record]` |
| 3 | The triangle window has just joined and glows. Yellow triangle dropped from the sky. | "Triangle! Put it in the triangle window!" `[to record]` | Triangle window. | Seated, bow, frog peeks. | "That's the {x}. Find the triangle!" |
| 4 | Small tilted green square, tossed by Pip. | "Square! Put it in the square window!" | Square window. The blue square hops down to the box. | Seated, bear peeks. | "That's the {x}. Find the square!" |
| 5 | Upside-down orange triangle, rolled in. | "Triangle! Put it in the triangle window!" | Triangle window. | Seated, flower, hedgehog peeks. | … |
| 6 | Big purple circle, out of the door. | "Circle! Put it in the circle window!" | Circle window. | Seated, elephant peeks. | … |

## Level 2: toy train (start: circle, square, triangle; rectangle joins after round 2)

Rounds: orange circle (funnel); pink triangle (rolled); green rectangle (tossed; the rectangle window has just joined); small tilted red square (dropped); upside-down blue triangle (funnel); purple rectangle on its side (rolled). Prompts and redirects as above, including "Rectangle! Put it in the rectangle window!" `[to record]`. Each piece stays seated, and the repeat shapes push the earlier piece down onto the window box.

## Level 3: castle (start: circle, square, triangle; rectangle joins after round 2; the windows swap round twice)

Rounds: purple circle (gate), cyan triangle (tower), pink rectangle (dropped; the rectangle window has just joined), small tilted green square (tossed; before this round the windows reverse order), upside-down orange triangle (rolled; a cat peeks, because a white bunny vanished on the snow), blue rectangle on its side (gate; before this round the windows swap to square, rectangle, circle, triangle). The prompt is said once the windows have settled.

## Ending (all levels)

- Dusk falls: the light and the sky dim slowly (1.4 s). The windows glow warm one at a time **in the order she filled them**, each with its note. Then the door opens and a friend (bunny, frog or cat) steps out and waves. The train has no door, so a frog walks up beside it.
- The friend comes out first (0.3 s in), so the photo never catches it mid-walk; the windows glow from about 1.6 s. The camera glides to the building, fitted to the 4:3 photo (`creationView`; for the train, the engine too). The castle's window row sits 0.25 higher, so the ledges clear the gate arch. Admire, about 6 s: "Look what you made!" `[to record]`. Every seated piece is pokeable and sounds its note.
- Photo, "You did it! A sticker!" `[voiced]`, the sticker, Home.

## Timings (measured, autoplay, round start → input open)

- L1: 1.14, 1.33, 1.17, 1.65*, 1.44, 1.13 s. (*Before the toss shortening; Pip's hop no longer delays the throw.) L2: 1.32, 1.42, 1.29, 1.19, 1.32, 1.41 s. L3: 1.12, 1.33, 1.19, 1.34, 1.43, 1.14 s.
- After a right drop: about 1.1 s of fit, then about 1.9 s of peek, then about 1.5 s of next-round layout plus 1 s still.

## Every narrator line

- Intro "Let's find shapes!" `[voiced]`.
- Prompts "{Shape}! Put it in the {shape} window!" ×4 `[to record]`.
- Redirects "That's the {x}. Find the {y}!" ×12: "That's the square. Find the circle!" is `[voiced]`; the other 11 are `[to record]`.
- Captions "{Shape}!" `[caption only]`. Ending: "Look what you made!", "You did it! A sticker!".

## Timing after the release review (rule: her last action → the next thing she can answer ≤ 2 s)

- Her right drop → the next piece she can drag (measured, autoplay): L1 1.52–1.86 s, L2 1.74–1.90 s, L3 1.52–1.90 s.
