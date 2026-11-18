# Fill & balance (`balance`) — storyboard

- **World:** Building site (`build`), a sandpit with a see-saw. L1 sunny sandpit with Frog riding the right end of the see-saw (green, so never mixed up with Pip), L2 brick yard (red and blue pails), L3 night site (orange and teal pails). Pip watches from beyond the right end of the see-saw.
- **Learning goal:** capacity and weight words: full, half full, empty, heavy, light, flat / balances, holds more / less. Every teaching line is spoken.
- **Levels:** 3, six rounds each.
- Source: `app/src/lessons/balance.js` (PLANS), `balance-props.js`, `balance-sound.js`; models `tools/blender/creatures/prop_balance.py`.

## Fixed scene

A see-saw plank on a big brick; clear toy pails with a dashed HALF line and a FULL line with a star ride its ends; a spirit level with a readable bubble on the plank. The sand heap with the scoop and the water tub with the jug are out to the left (in the opening wide shot, off the close-up). The game opens on the whole yard and eases (1.2 s) into the see-saw close-up; the first round's scoop or jug is already waiting beside its pail, so she can pour from the first moment (the words and the hand demo follow once the camera has settled). Each pour round the scoop or jug flies over (in front of the plank, never through it) to wait on the sand in front of its pail, toward the middle but well clear of the pivot brick; it sets off while the round is laid out. When she picks it up it stays in its own plane in front of the plank and only moves back over the pail's mouth to pour. Sand castles stand in front of the see-saw's ends (never in front of the pivot or where the scoop waits) and stay all level.

## Engine behaviours

- **Hand demos:** first time each action comes up: pour (the hand carries the scoop/jug over the pail and keeps pressing there), tap-to-tip (tap the pail), choose (scan over the pails), pour across (tap the full pail). Again after about 8 s stuck, then every 14 s.
- **Idle ladder:** 5 s / 8 s = prompt again + the scoop/jug bobs (pick rounds: both pails hop); 20 s = errorless (pours stop by themselves at the goal; pick rounds: the wrong pail switches off); 90 s = home. Halos are small and go away while she pours.
- **Two ways to pour:** drag the scoop or jug over the pail (it tips and pours; the level rises past HALF and up to FULL, each mark dings), or tap the scoop, the jug or the pail (it pours for her). **Letting go over the bucket in a fill round finishes the pour** (no silent restart). Only the Level 3 balance rounds need her to stop in time.
- **Wrong pail:** "Pour in this one!" and the right pail hops.
- **Success:** the teaching lines are spoken ("It's full!", "Half full!", "Heavy goes down!" …), Pip watches.

## Level 1: one pail against Frog

| # | Narrator says | Prompt | If right |
|---|---|---|---|
| R1 | "Fill the bucket with sand!" | Pour sand into the red pail. | Fills to FULL, the end sinks and Frog flies up. "It's full!" |
| R2 | "Now tip it out!" | Tap the pail. | It flips onto the sand at the front (its own side) and leaves a sand castle that stays. "A sand castle!" `[caption]` |
| R3 | "Fill it up with water!" | A blue pail drops on (about 1.2 s; the jug is already on its way). Pour water. | "It's full!" |
| R4 | "Make it empty!" | Tap the pail. | It rolls onto its side toward the middle and pours out a puddle that dries. "All empty!" |
| R5 | "Fill the big bucket up!" | A big yellow pail (1.3 size) drops on. Pour sand. | "It's full!" |
| R6 | "Tip it out!" | Tap the pail. | A second castle. "Another sand castle!" `[caption]` |

## Level 2: two pails, each round carries on

| # | Narrator says | If right | If wrong |
|---|---|---|---|
| R1 | "Fill it half way! To the line!" | The pour stops at the HALF line: "Half full!" | "Pour in this one!" |
| R2 | "Which bucket is heavy?" | "Heavy goes down!" (the plank kicks) | "That's the light one!" and the heavy one hops |
| R3 | "Fill it to the star!" | "Full right up!" | "Pour in this one!" |
| R4 | "Which bucket is full?" | "That one is full!" (star flash) | "That one isn't full yet!" and the full one hops |
| R5 | "Tip out the half full one!" | A castle; "Now it's empty!" | "Find the half full one!" |
| R6 | "Which bucket is light?" | "Light goes up!" | "That's the heavy one!" and the light one hops |

## Level 3: flat see-saw, and pouring across

Balance rounds: the plank starts tilted by the pre-filled pail; she pours into the other one; the pour slows near the balance point; she lets go when it is flat. Flat = a held breath (the see-saw squashes a touch, the bubble centres), both pails squash happily, then about 1 s of stillness: "It balances!".
Too much (by letting go, **or by pouring right to the brim**): "Too much! Tap the bucket!"; the tap demo shows tapping the pail; each tap tips a little out ("Tap it again!" while still too much). Too little: "A little bit more!" once.

| # | What happens |
|---|---|
| R1 | Left pail full of sand. "Make the see-saw flat!" Pour sand into the right pail. |
| R2 | Two new pails at the front: a big empty green one and a small pink one full of sand. "Pour the little one in the big one!" Tapping either pail pours the full one into the empty one (no wrong answer): it all goes in with lots of room left. "The big one holds more!" |
| R3 | "Tip them out!" She taps each pail on the plank: each flips onto the sand at its own side and leaves a castle (both stay). Then water is poured into the right pail to half (about 1 s). "Make it flat with water!" Pour water into the left pail. |
| R4 | A wide purple pail and a tall thin yellow one (full of water). "Pour the tall one in the wide one!" Tap either: the tall one pours in, the wide one is not even half full. "The wide one holds more!" |
| R5 | "Tip them out!" (the water splashes out into puddles), then 75% sand into the left pail. "Make it flat again!" Pour sand into the right pail. |
| R6 | A big red pail full of sand and a small blue empty one. "Pour the big one in the little one!" Tap either: the little one fills to the top and the rest runs over its rim onto the sand, leaving a small heap that stays. "The little one holds less!" |

## Ending (all levels)

The camera frames the sandpit: the see-saw and every castle she made (and the spill heap at L3). "Look what you made!" Castles are pokeable (a press and a note). Photo, sticker, Home.

## Timings (measured, real drags and taps)

- Round start → ready: tap rounds about 0 to 1 s; fill rounds about 1.3 to 3 s (pail swap and the scoop arriving run together); L3 rounds 0.6 to 1.0 s; game open: ready at once (the first scoop is already beside its pail).
- A pour takes about 1.5 to 2 s once started.

## Every narrator line

L1: "Fill the bucket with sand!", "Now tip it out!", "Fill it up with water!", "Make it empty!", "Fill the big bucket up!", "Tip it out!", "It's full!", "All empty!", "A sand castle!" / "Another sand castle!" (captions).
L2: "Fill it half way! To the line!", "Which bucket is heavy?", "Fill it to the star!", "Which bucket is full?", "Tip out the half full one!", "Which bucket is light?", "Half full!", "Heavy goes down!", "Full right up!", "That one is full!", "Now it's empty!", "Light goes up!", "That's the light one!", "That's the heavy one!", "That one isn't full yet!", "Find the half full one!".
L3: "Make the see-saw flat!", "Make it flat with water!", "Make it flat again!", "Tip them out!", "Pour the little one in the big one!", "Pour the tall one in the wide one!", "Pour the big one in the little one!", "It balances!", "The big one holds more!", "The wide one holds more!", "The little one holds less!", "Too much! Tap the bucket!", "Tap it again!", "A little bit more!", "Pour in this one!".
