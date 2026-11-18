# Apple count (id: `counting`)

- **World:** Meadow.
- **Learning goal:** one-to-one counting (one tap, one spoken number) and cardinality (the last number is how many: "Three apples!").
- **Levels:** 3 (6 rounds each). L1 the orchard (Hedgehog, basket, counts to 3). L2 the berry patch (Bunny, pail, counts to 4). L3 the tea party (Bear, bowl, counts to 5).
- Source: `app/src/lessons/counting.js` (+ `counting-hosts.js`, `counting-items.js`), engine `lesson.js`, `keepsake.js`.
- Updated for the fix pass (AUDIT-meadow K1–K8, QA counting 1–30).
- Tags: `[voiced]` has a clip; `[to record]` is in `tools/voice/new-lines.txt` and silent until recorded; `[caption only]` is never spoken.

## Behaviour shared by every round

- **Scene:** the container (basket, pail or bowl) stands front-centre (0, 0, 3.2). The friend (the "eater") stands beside it at (4.4, 0, 2.2), outside every host's footprint. It watches the fruit but never turns its back or full profile (rotation clamped to ±0.9). The **keepsake shelf** at the back (0, 0, -3) has six spots, one per round. Snowman and near-flank scenery are hidden. The bear's arms hang down (no T-pose).
- **Camera:** glides (0.8 s) to frame each host. The tree camera stands back (0, 4.4, 14.8 → 0, 3.0, 0), so both the crown under the caption and the whole basket fit.
- **Host:** the old host settles away (0.45 s fade). The new one springs up (tree, blossom, bush, patch, balloons, blanket, table, stand, tray), its things pop in, and taps are open at once.
- **Each tap:** the number is spoken every time ("One!", "Two!"… with `repeat`). Input locks for 0.65 s so a quick double tap never skips a number. A numeral floats over the thing, beside it if "above" would sit under the caption. One sound: the pluck on the level's rising `sfx.step` (a balloon round plays its pop instead). The thing leaves its host (stretch and snap, rustle out of the bush, pull out of the patch, hop off the plate) and is thrown with real physics into the container, where it piles up. The friend shows a joyful face for 0.35 s and does a small hop. No confetti.
- **Last tap:** its number is spoken too, and **the friend (and the container) can be tapped at once**. A slow, silent recount plays underneath: after 0.9 s the pile jumps once per number, every 0.45 s, with a small numeral each. Then the total is spoken with the noun, "Three apples!" (`repeat`), and the friend beams.
- **The friend and the shelf (her action):** the friend glows; the first time, a ghost hand taps it. Once she has tapped the friend (or the container) and the recount has jumped, the next host springs up at once. Meanwhile the friend sniffs the pile happily (one "mmm", a joyful face, a tummy wiggle), and the counted things settle into a little wooden bowl, in counting order, with the round's numeral on a round tag. The bowl hops onto the next spot of the **keepsake shelf, which stands on tall posts at the back (y 2.35, z -3.6)** so it shows over every host. It stays all level. If she does nothing, it happens by itself 5 s after the recount. Poking a bowl says its total again.
- **Twists:** a ladybug (twice its old size, on the fruit's upper-front shoulder) flies off sideways and never above y 6. A frog visitor at (-2.7, 0, 4.0), clear of Pip, watches and walks off at the end of the round. A golden one looks like the others and sparkles once at the start. Bouncy items bounce harder.
- **Stuck ladder:** 5 s, the prompt plus the next thing hops. 8 s, the prompt is spoken again, a glow, and the demo again: a hand taps the next thing, with the fingertip on its lower edge. 20 s, errorless. 90 s, home.
- **No wrong answer** exists: every tap counts.

## Level 1: the orchard (Hedgehog, basket)

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | The tree springs up with 1 apple. | "Tap the apple!" `[to record]` | Tap the apple. | Demo: the hand taps the apple (round 1). | "One!" `[voiced]`, recount, "One apple!" `[to record]`. | Ladder. | Tap Hedgehog (hand shown), bowl "1" to the shelf. |
| 2 | Bush with 2 apples, a ladybug on one. | "Count the apples!" `[voiced]` | Tap each apple. | Go! | "One!", "Two!", recount, "Two apples!". | Ladder. | Shelf bowl "2". |
| 3 | Blossom tree, 3 bouncy pears. | "Count the pears!" | Tap each pear. | Go! | … "Three pears!". | Ladder. | Bowl "3". |
| 4 | Balloons with 2 oranges, a frog visitor. | "Count the oranges!" | Tap each balloon: pop, the orange drops. | Go! | … "Two oranges!". | Ladder. | Bowl "2"; the frog walks off. |
| 5 | Picnic blanket with 3 plums on plates. | "Count the plums!" | Tap each plum. | Go! | … "Three plums!". | Ladder. | Bowl "3". |
| 6 | The tree with 3 apples in an arc, one sparkles. | "Count the apples!" | Tap each apple. | Go! | … "Three apples!". | Ladder. | Bowl "3"; finale. |

## Level 2: the berry patch (Bunny, pail)

| # | Host and things | Prompt | Total |
|---|---|---|---|
| 1 | Patch (mounds at least 2.1 apart, level), 2 strawberries. | "Count the strawberries!" | "Two strawberries!" |
| 2 | Bush, 3 blueberries, a ladybug. | "Count the blueberries!" | "Three blueberries!" |
| 3 | Blossom tree, 3 bouncy cherries. | "Count the cherries!" | "Three cherries!" |
| 4 | Patch, 4 strawberries (scatter). | "Count the strawberries!" | "Four strawberries!" |
| 5 | Balloons, 3 lemons, a frog visitor. | "Count the lemons!" | "Three lemons!" |
| 6 | Patch, 4 strawberries in an arc, one sparkles. | "Count the strawberries!" | "Four strawberries!" |

Every round ends the same way: tap Bunny, and the bowl with its tag goes to the shelf.

## Level 3: the tea party (Bear, bowl)

| # | Host and things | Prompt | Total |
|---|---|---|---|
| 1 | Table (four legs), 3 cookies lying flat on plates. | "Count the cookies!" | "Three cookies!" |
| 2 | Cake stand, 4 cupcakes, a ladybug. | "Count the cupcakes!" | "Four cupcakes!" |
| 3 | Balloons, 3 donuts, a frog visitor. | "Count the donuts!" | "Three donuts!" |
| 4 | Baking tray, 4 bouncy cookies. | "Count the cookies!" | "Four cookies!" |
| 5 | Table, 5 cupcakes, one sparkles. | "Count the cupcakes!" | "Five cupcakes!" |
| 6 | Cake stand, 4 sweets, a ladybug. | "Count the sweets!" | "Four sweets!" |

## Ending (all levels)

- The empty container settles away and the camera glides to the shelf of six bowls (`tray.view()`), each with its numeral tag. The friend beams and looks at them. Treats in the pile only spin about their up axis, so a cupcake never lands upside-down.
- Admire, at least 4 s: "Look what you made!" `[to record]`. Poking a bowl says its total ("Three apples!").
- Photo, "You did it! A sticker!" `[voiced]`, the sticker, Home.

## Design note (deviation from the audit)

- AUDIT K3 has the friend eat one fruit, while the shelf keeps the counted totals (1, 2, 3, 2, 3, 3). Both can't be true: eating one leaves n-1 in the bowl, and round 1 would leave an empty bowl. The friend therefore sniffs the pile happily ("mmm", tummy wiggle) instead of eating one. Every bowl holds exactly the number she counted, and its tag and its spoken total match it.

## Timings (measured, autoplay)

- Round start → input open: 0.01–0.03 s in every round, all levels (the things are tappable while they spring up).
- One count of n: n taps (at least 0.65 s apart), then about 1.25 + 0.5 n s of recount and total, then her tap on the friend (auto after 5 s), about 1.1 s of bowl to shelf, and 1 s still.

## Every narrator line

- Intro `[voiced]`; "Tap the apple!" `[to record]`; "Count the {things}!" `[voiced]`.
- Numbers: "One!"–"Four!" `[voiced]`, "Five!" `[to record]`.
- Totals (all `[to record]`): L1 "One apple!", "Two apples!", "Three pears!", "Two oranges!", "Three plums!", "Three apples!". L2 "Two strawberries!", "Three blueberries!", "Three cherries!", "Four strawberries!", "Three lemons!". L3 "Three cookies!", "Four cupcakes!", "Three donuts!", "Four cookies!", "Five cupcakes!", "Four sweets!".
- Ending: "Look what you made!", "You did it! A sticker!".

## Timing after the release review (rule: her last action → the next thing she can answer ≤ 2 s)

- Last fruit → the friend can be tapped: at once. Her tap on the friend → the next host's things can be tapped: L1 0.36–1.28 s, L2 0.84–1.74 s, L3 1.26–2.0 s (the recount must finish jumping).
