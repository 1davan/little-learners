# Share the snacks (`share`, shown as "Sharing!")

- **World:** Farm (`farm`). Friends stand in a row (z -0.6), each with a coloured plate/bowl/leaf in front of it (z 1.35-1.5); the snack bin sits low at the front (z 3.3, fully in frame) between two plates (in the middle for four friends) with the next snack lying on top of its pile. Along the back is a **bench of four hay bales** (the keepsake tray, seat at y 1.69 so the friends on it show above the heads of the row; six spots 1.15 apart): each round's first friend, fed and happy, walks to it, hops up and stays sitting there for the rest of the level. Pip stands back-left beside the bench (x -6.78, clear of the left friend in three- and four-friend rounds).
- **Build-up object:** the bench of fed friends (one more each round, six by the finale). It is what the finale frames and photographs.
- **Goal (meta):** Gives carrots one at a time so every bunny gets the same.
- **Levels:** 3 (L1 picnic: a soft checked blanket with china plates; L2 inside the barn: tall red plank wall with a hay-loft beam and two lanterns, a plank floor, wooden bowls; L3 garden party: a big crochet rug, bunting, leaf plates). Six rounds each.
- **Source:** `app/src/lessons/share.js`, `share-props.js`; engine `lesson.js`, `keepsake.js`. Models: `prop_barnback`, `prop_strawfloor`, `prop_barnlantern`, `prop_partyrug`, `prop_bunnybow`, `prop_fish`, `prop_wicker`, `prop_leafplate`, `prop_carrot`, `prop_cookie` (`tools/blender/creatures/`), the picnic blanket is code-built (`makeBlanket`).

## Common behaviour

- **Opening (all levels):** Pip waves, `sfx.hello`, "The bunnies are hungry!" `[voiced]` (wait capped at 2.2 s), round 1 after 0.6 s.
- **Round setup (input ready in about 0.45 s; her last drop of the previous round to the next snack being draggable about 1.5 s, to the first new friend ready 1.4-2.0 s):** the round begins while last round's friends are still eating and walking off; each new friend and its plate grow in calmly (0.45 s, tiny overshoot) as soon as its spot in the row is clear (accepting a snack 0.15 s into its arrival). The bin swaps to the round's snack only when the snack changes (the old bin settles away as soon as the last snack of the previous round has been dropped, then the new one grows in; never two bins inside each other) and slides between the plates. The first snack rises out of the bin onto the pile (no sound, no Pip hop). The snack bobs gently ("pick me up"). Friends' heads follow the snack (a hen's only a little, so its beak never goes behind its wing).
- **Friends and calls:** carrots = bunnies (each with a ribbon bow at the base of its right ear: red, blue, yellow, purple); apples = piglets (oink); corn = hens (cluck); fish = kittens (meow); cookies = a party of mixed friends (bunny, pig, hen, kitten).
- **Prompt (`cue()`):** each = 1: "Give each <friend> <a snack>!"; each = 2 or 3: "<Two/Three> <snacks> each!" (see the tables). The ghost-hand demo (a slow drag from the snack to the first friend that needs one) plays at the first round of the game at **every level** (L3 no longer shows a scan hand). The dotted spots on each plate show how many each friend gets.
- **Pick up the snack:** it grows a little; friends that still need one light up with a happy face and reach out (arms or wings, never up past the face); the friend the snack is held over leans in.
- **Drop on a friend that has the fewest (RIGHT):** the snack arcs low (0.7 s, reaching the plate's depth first so it never crosses the friend's face) onto its dotted spot (the spot disappears), one landing thud, the plate dips (straight down). Long snacks lie side by side (carrots and cobs), apples sit in a triangle when there are three, fish lie one behind the other. 0.75 s later that friend gives a small bounce and its own call, and its count floats up in front of the plate. Caption "One for you!" (first and second snack) / "And one for you!" (third and later) `[caption only]`. After 1.2 s the next snack rises out of the bin.
- **Last snack (everyone has the same):** the snack lands (0.7 s), the plates light gold in a quick ripple (soft additive glow) while the friends glance along the row at each other's plates; `success()` with "The same! One each!" / "The same! Two each!" / "The same! Three each!" `[voiced]`. Then the friends **eat in turn, left to right, 0.25 s apart**: head down, one munch (`sfx.chomp`), the snacks shrink to a bitten 60 %, a second bite and they are gone, a joyful face. One payoff only: no "=" signs, no hearts, no juggle or spin, no shimmer.
- **Overlapped with the next round (rule 0):** 0.3 s after the landing the next round lays itself out while the eating carries on. Each friend leaves as soon as it has eaten: the plate settles away (0.45 s); the **first friend of the round walks straight back to the bench lane, along to its spot and hops up onto the hay bench** (it stays all level, breathing, pokeable: a poke presses it and it answers in its own voice); the others step back into an exit lane behind the row (z -1.8) and walk off to the right. Leaving friends never pass through friends still eating or new friends stepping in (lanes, and a new friend waits until every leaving friend is clear of its spot).
- **Drop on a friend who already has more (WRONG):** the snack glides back to the bin; that friend shakes its head (one soft "no" sound); the waiting friend makes a sad face, reaches out and hops, and its plate gets a halo for 2 s; caption "That <friend> is waiting!" `[voiced]` ("That bunny/piggy/hen/kitty is waiting!", "That friend is waiting!" at the cookie party).
- **Drop on nothing / let go:** the snack glides home silently; friends calm down. No line.
- **Pre-filled friend (L3 rounds 2 and 4):** as it arrives its snack is already on its plate; it gives a small wiggle and looks over at the first friend's plate (no line; the hidden dot already shows it).
- **Idle ladder (engine):** 5 s = prompt again + the snack hops; 8 s = prompt (voiced again) + hop + the hand demo of the drag again; 20 s = errorless (friends that already have enough shrink to 80 % and stop accepting drops) + prompt; 90 s = "Bye bye! See you soon!" and home. After each placement the ladder resets and errorless is lifted. Every 5 s of quiet a waiting friend gives a small hop. Two wrong drops in a round trigger errorless.
- **Mash:** Pip scared face + wiggle. No line.
- **Finale (all levels):** after the last round everyone settles (the last first-friend sits on the bench, the others have walked off); Pip walks over to stand at the left end of the bench, and the camera glides to a wider view of the bench of six fed friends with Pip (both kept inside the middle 75 % of the width, so the centre 4:3 photo crop holds them). "Look what you made!" (voiced once per session) for >= 4 s: she can poke each friend and it answers in its own voice. Shutter, photo of the bench (saved to the gallery), rain, resolve, "You did it! A sticker!" `[voiced]`, sticker, home.

## Level 1: picnic blanket with china plates. 2 or 3 friends, one snack each

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 0 | Picnic blanket, the empty hay bench at the back, Pip waves. | "The bunnies are hungry!" `[voiced]` | none | n/a | n/a | n/a | Round 1 |
| 1 | 2 bunnies (red, blue bows), carrot crate; one dotted spot each. | "Give each bunny a carrot!" `[voiced]` | Drag the carrot onto a bunny's plate (2 drags). | Demo hand drags the carrot to the first plate; carrot bobs; Go!. | Carrot lands, "One for you!", bunny bounces and squeaks, "1" floats. Second drop: gold plates, "The same! One each!", the bunnies eat in turn; the red-bow bunny walks to the bench and hops up. | Drop on a bunny that has one: "That bunny is waiting!" `[voiced]`, halo on the waiting plate. | Round 2 |
| 2 | 2 piglets, apple basket. | "Give each piggy an apple!" `[voiced]` | 2 drags. | Bob, Go!. | As above; piglets oink and eat. | "That piggy is waiting!" | Round 3 |
| 3 | 3 hens, corn crate. | "Give each hen some corn!" `[voiced]` | 3 drags. | Same. | Third drop: "And one for you!"; then the payoff. | "That hen is waiting!" | Round 4 |
| 4 | 2 kittens, fish pail (fish floating on their sides). | "Give each kitty a fish!" `[voiced]` | 2 drags. | Same. | Kittens meow and eat. | "That kitty is waiting!" | Round 5 |
| 5 | 3 mixed friends (bunny, pig, hen), cookie basket. | "Give each friend a cookie!" `[voiced]` | 3 drags. | Same. | Each friend calls in its own voice. | "That friend is waiting!" | Round 6 |
| 6 | 3 piglets, apple basket. | "Give each piggy an apple!" (caption only if within 30 s of round 2's voicing) | 3 drags. | Same. | Payoff; the first piglet sits on the bench (six friends there now). | Same. | Finale |

- **Timings (measured, full plays at 1280x800, 1366x768, 1920x1080):** round start to input ready 0.45-0.47 s. Her last drop of a round to the next snack draggable 1.46-1.52 s; to the first new friend ready 1.41-2.02 s. Within a round, drop to next snack 1.2 s. Per round about 6-10 s: 2-3 drags (each about 2.5 s: fly 0.7 + call 0.75 + 1.2 s before the next snack); the gold plates and eating play over the start of the next round.
- **Every narrator line (L1):** "The bunnies are hungry!"; "Give each bunny a carrot!"; "Give each piggy an apple!"; "Give each hen some corn!"; "Give each kitty a fish!"; "Give each friend a cookie!"; "One for you!"; "And one for you!"; "The same! One each!"; "That bunny is waiting!"; "That piggy is waiting!"; "That hen is waiting!"; "That kitty is waiting!"; "That friend is waiting!"; "Bye bye! See you soon!"; "Look what you made!"; "You did it! A sticker!".

## Level 2: inside the barn with wooden bowls. 2 or 3 friends, one or two snacks each

The outdoor farm is hidden: a tall red plank wall with a hay loft fills the back, two lanterns hang above the friends' heads, hay bales stand in the back corners and the floor is wooden boards with a little straw at the sides. The dotted spots in the dark bowls are cream.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | 2 piglets, apple basket (1 each). | "Give each piggy an apple!" `[voiced]` | 2 drags. | Demo (first round), bob, Go!. | As Common. | "That piggy is waiting!" | 2 |
| 2 | 3 bunnies, carrot crate (1 each). | "Give each bunny a carrot!" `[voiced]` | 3 drags. | Same. | Same. | "That bunny is waiting!" | 3 |
| 3 | 2 kittens, fish pail (2 each = 4 drags). | "Two fish each!" `[voiced]` | Two fish to each kitten, taking turns. | Two dotted spots per bowl (one behind the other); count floats. | "The same! Two each!" then the payoff. | "That kitty is waiting!" | 4 |
| 4 | 2 hens, corn crate (2 each = 4 drags). | "Two corn each!" `[voiced]` | 4 drags, taking turns. | Same. | "The same! Two each!" | "That hen is waiting!" | 5 |
| 5 | 3 mixed friends, cookie basket (1 each). | "Give each friend a cookie!" `[voiced]` | 3 drags. | Same. | "The same! One each!" | "That friend is waiting!" | 6 |
| 6 | 3 bunnies, carrot crate (2 each = 6 drags). | "Two carrots each!" `[voiced]` | 6 drags, always to a friend with the fewest. | Same. | "The same! Two each!" | Same. | Finale |

- **Timings:** about 8-18 s per round (round 6 is the longest: six drags). Input ready 0.45 s into each round; last drop to next snack draggable about 1.5 s.
- **Every narrator line (L2):** "The bunnies are hungry!"; "Give each piggy an apple!"; "Give each bunny a carrot!"; "Two fish each!"; "Two corn each!"; "Give each friend a cookie!"; "Two carrots each!"; "One for you!"; "And one for you!"; "The same! One each!"; "The same! Two each!"; the five "That ... is waiting!" lines; "Bye bye! See you soon!"; finale lines.

## Level 3: garden party with leaf plates. 2-4 friends, up to 3 each; two rounds start with one friend already served

Snacks per round: corn, fish, carrot, apple, cookie, fish. The plates, bin and snacks stand on the raised crochet rug. In the four-friend round the friends stand closer (x -3.6 … 3.6), the leaf plates are a little smaller and the cookie basket sits in the middle.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | 2 hens, corn (2 each = 4 drags). | "Two corn each!" `[voiced]` | 4 drags, taking turns. | Demo hand drags the corn (first round), bob, Go!. | "The same! Two each!" | "That hen is waiting!" | 2 |
| 2 | 3 kittens, fish (2 each; kitten 2 already has 1) = 5 drags. | "Two fish each!" `[voiced]` | 5 drags; kitten 2 waits until the others catch up. | Dotted spots; kitten 2 wiggles and looks at kitten 1's plate as it arrives. | "The same! Two each!" | "That kitty is waiting!" | 3 |
| 3 | 2 bunnies, carrots (3 each = 6 drags). | "Three carrots each!" `[voiced]` | 6 drags. | Same. | "The same! Three each!" | "That bunny is waiting!" | 4 |
| 4 | 3 piglets, apples (2 each; piglet 2 starts with 1) = 5 drags. | "Two apples each!" `[voiced]` | 5 drags. | Same. | "The same! Two each!" | "That piggy is waiting!" | 5 |
| 5 | 4 mixed friends (bunny, pig, hen, kitten), cookies (1 each = 4 drags). | "Give each friend a cookie!" `[voiced]` | 4 drags. | Same. | "The same! One each!" | "That friend is waiting!" | 6 |
| 6 | 2 kittens, fish (3 each = 6 drags). | "Three fish each!" `[voiced]` | 6 drags. | Same. | "The same! Three each!" | "That kitty is waiting!" | Finale |

- **Timings:** about 10-20 s per round; input ready 0.45 s into each round; last drop to next snack draggable about 1.5 s (first new friend ready by about 2 s).
- **Every narrator line (L3):** "The bunnies are hungry!"; "Two corn each!"; "Two fish each!"; "Three carrots each!"; "Two apples each!"; "Give each friend a cookie!"; "Three fish each!"; "One for you!"; "And one for you!"; "The same! One each!"; "The same! Two each!"; "The same! Three each!"; the five "That ... is waiting!" lines; "Bye bye! See you soon!"; finale lines.
