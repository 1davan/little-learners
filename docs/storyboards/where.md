# Where's Crab? (id: `where`)

- **World:** Beach (world id `beach`), "In, on, under!" (icon 🦀). Source: app/src/lessons/where.js and where-props.js.
- **Learning goal:** puts a friend IN, ON or UNDER a beach thing when asked (positional words).
- **Levels:** 3, 6 rounds each. Each round is a tiny story with its own place(s) and friend (Crab, Baby Crab, Duck, Gull).
- Meta intro line: "Let's play on the beach!" [voiced once queued] (fits every level, whoever comes first)

## Engine behaviour that applies to every round (engine/lesson.js)

- **Go! gate:** taps open as soon as the round is laid out; the "Go!" badge waits for the demo hand (max 2.5 s), forced at 3 s.
- **One hand demo per game:** round 1 only. L1 and L2: the hand drags the friend onto the asked place (2.5 s). L3: the hand only picks the friend up and lifts it, without showing where. A touch ends it.
- **Idle ladder (resets on every touch):** 5 s prompt + nudge 1 (the friend hops; the picture bubble replays, or at L3 appears for the first time); 8 s prompt (voiced again) + hop + 3 s halo + the hand demo again; 20 s errorless + prompt; 90 s "Bye bye! See you soon!" then Home.
- **Voice:** a line is voiced only if its text is in assets/voice/index.json; the same line at most once per 30 s unless the game asks for a repeat.
- **Success** (quiet): Pip turns and nods or claps; the game's payoff; 1 s of stillness; the round change.

## How a "where" round works (all levels)

- Camera 3.2 high, 12.6 back; Pip at the far left. The props drop onto the sand with real physics (0.2 s, then 0.3 s later for the second; the boat and its pool grow in place instead of falling). Loose bits (shells, stars, balls, melon, coins) rain onto the sand, or into a container that is NOT the asked place (so the friend never lands on a shell). Tapping a loose bit makes it jump.
- **The friend** walks or scuttles in from just off the right edge (x 6.6) to its home spot in front (z 4.6, clear of the props) in 1.1-1.5 s, with its call. Home: beside a lone prop (2.6 from its centre; 3.45 for the big chair), or centred between two. The walk-in takes about 1.35 s (under 5 units/s), then she can drag at once. **Round-start to input-ready: about 1.4 s at every round**, including the L3 swap round: there the boat and the bucket grow in place and swap while the friend walks in.
- **The picture instruction (L1 and L2):** once the friend has arrived, a white thought bubble appears beside it (y 3.45, scale 0.88, below the caption) with a bigger, centred mini scene: a mini friend hops IN / ON / scoots UNDER a mini copy of the asked prop, looping every 3 s (tall props cropped to their top). At L3 the bubble is not shown at the start: it appears at the first wrong drop or the 5 s nudge.
- **Prompt (voiced):** "Put <the crab | the baby crab | the duck | the gull> <IN | ON | UNDER> the <prop>!" ("treasure chest" for the chest).
- **Drag:** picking the friend up plays its call and grows it 12% (legs paddle, claws snap or wings flap, eyes look at the nearest prop). A prop leans up a little to meet the friend as it comes near (no sound per hover). Dropping on nothing sends it hopping home; a plain tap makes it call and squash.
- **Wrong place (L2 and L3; at L1 only the asked place is live):** the friend hops home, the wrong prop wobbles with a soft "no", the bubble finishes its loop and replays (or appears, L3). Two voiced lines one after the other: "Oops, that's ON!" (the place she chose) then the instruction again, voiced even if it was said a moment ago. 2nd wrong: errorless (other places off, the other prop shrinks), with no extra prompt on top.
- **Right drop:** the friend goes there at hop pace (never faster than about 5 units/s): **in**: hop over the rim, thunk, claws up, a splash ring of soft drops for wet stories, a little bob. **on**: arc up, land, wobble-balance, claws or wings up. **under**: the friend shrinks to fit and tucks its claws in, the cover lifts, it walks under at walking pace (about 3 units/s), crouches as the cover comes down (thump), then peeks out, blinks and glances left and right. The umbrella no longer squashes its pole: it dips 0.5 and tilts. The word is voiced at the moment it happens, once the friend is really there: "In the bucket!", "Under the umbrella!", "On the treasure chest!" and so on. Then the story payoff (below), 1 s of stillness.
- **Round change (rounds 1-5), overlapped (rule 0):** 0.45 s after her right drop the next round begins while this one pays off: the other prop fades (it was only a choice); the friend lands in its place, the word is said, the friend's gag and the story play; the place (friend attached) steps straight back out of the front row (0.45 s) and then glides to its spot at the back of the beach (z -4.4, scale 0.42; six spots, x -4.9 to 5.6) where it stays all level. The next round's places grow in place on the sand (nothing drops from the sky) as soon as the old place has stepped back, while the next friend walks in. **From her right drop to the next friend being draggable (with both new places there): 1.65-1.76 s at L1, 1.74-1.95 s at L2, 1.45-1.9 s at L3 (measured; under-drops are the longest).** In the swap round she can drag while the two places swap. The kept places can be poked.
- **Under covers** (bucket, box, hat) settle back down after the peek, just open a crack for the eyes; they never stay hovering.
- **The umbrella** is 0.8 size in the round where a friend stands ON it (its head stays below the caption).
- The left place stands at x -2.7 (clear of Pip and his lantern).
- **Ending (all levels):** the last round's props stay in front. **10 s of free play:** the friend glows; she can drag it to any place on those props (every place is open, including the one she just used) and each place says its word ("In the basket!", "Under the hat!", voiced every time). Then the other prop fades, the friend's place (friend and all; a friend left on the sand hops back into the round's place first) glides to the sixth spot of the keepsake row, and the camera frames the whole row from its real bounds. "Look what you made!" (voiced once per session), photo, sticker, Home.

## The places (Blender models)

- **Deck chair:** a big sling chair, 4.0 wide, seat at 1.25, no arm rests; one canvas sling with five crisp full-thickness stripes. A friend sits ON it at full size; UNDER, it fits between the legs at 0.8 (nothing low at the front to cut through it).
- **Boat:** floats in a modelled tide pool (damp sand bank with pebbles, brim-full water at y 0.26 with a deeper middle, a pale shallow band and soft glints; the game adds slow ripple rings).
- **Sun hat:** brim radius 2.4 (a crab hides under it at 0.65), crisp pink ribbon band.
- **Treasure chest:** a solid barrel lid with the body's footprint, seated on it; a friend stands ON it at y 1.65.
- **Box:** flaps fold out and down (2.45); the tape ends under the rim; label and arrow are crisp stickers.

## Story payoffs (no emoji floats; the friends and models react)

- **swim / float / sail (in):** splash ring; sail: the boat rocks and drifts with its sailor.
- **look (on):** the friend up high looks left and right with a joyful face while a real little sailboat glides past far out at sea.
- **sleep:** at the start a slow yawn-stretch; after: eyes close and three "z" letters float up.
- **picnic:** a happy "mmm" in the basket.
- **sun (under the chair at L2, on the chair at L1):** a long happy sigh in the shade.
- **rain:** a grumpy cloud drizzles soft drops across the beach; after: it cheers up and drifts away and a small rainbow rises far behind the beach.
- **hide:** the seeker (Gull) turns three-quarters away and covers its eyes with its wings; after: it turns back, gasps and looks around.
- **treasure:** gold coins jump up out of the chest in a little fountain and drop back in.
- **ball:** a beach ball bounces onto the hat's brim beside the friend and rolls off, then fades.

## Level 1: crab family, one place at a time (only the asked place is live)

| # | Friend | Place | Prompt [voiced] | Right line [voiced once queued] |
|---|---|---|---|---|
| R1 | Crab | bucket (x 2.6) | "Put the crab IN the bucket!" | "In the bucket!" |
| R2 | Crab | sandcastle (x -2.4) | "Put the crab ON the castle!" | "On the castle!" |
| R3 | Baby Crab | swim ring (x 2.4) | "Put the baby crab IN the ring!" | "In the ring!" |
| R4 | Crab | towel (x -2.2) | "Put the crab ON the towel!" | "On the towel!" |
| R5 | Crab | picnic basket (x 2.4) | "Put the crab IN the basket!" | "In the basket!" |
| R6 | Crab | deck chair (x -2.2) | "Put the crab ON the chair!" | "On the chair!" |

## Level 2: Duck and Gull's beach day (two places, three spots)

| # | Friend | Props (asked one first) | Prompt | Right line |
|---|---|---|---|---|
| R1 rain | Duck | umbrella (under) + bucket (in) | "Put the duck UNDER the umbrella!" | "Under the umbrella!" |
| R2 sail | Crab | boat (in) + castle (on) | "Put the crab IN the boat!" | "In the boat!" |
| R3 look | Gull | treasure chest shut (on) + open box (in) | "Put the gull ON the treasure chest!" | "On the treasure chest!" |
| R4 sun | Crab | chair (under) + ring (in) | "Put the crab UNDER the chair!" | "Under the chair!" |
| R5 sleep | Duck | open box (in) + towel (on) | "Put the duck IN the box!" | "In the box!" |
| R6 hide | Crab (Gull seeks) | sun hat (under) + basket (in) | "Put the crab UNDER the hat!" | "Under the hat!" |

## Level 3: the treasure cove at night (two places that each offer two spots)

| # | Friend | Props | Prompt | Right line |
|---|---|---|---|---|
| R1 hide | Crab (Gull seeks) | upside-down bucket (on / under) + ring (in) | "Put the crab UNDER the bucket!" | "Under the bucket!" |
| R2 look | Gull | umbrella (on / under) + basket (in) | "Put the gull ON the umbrella!" | "On the umbrella!" |
| R3 treasure | Baby Crab | open treasure chest (in) + chair (on / under) | "Put the baby crab IN the treasure chest!" | "In the treasure chest!" |
| R4 rain | Duck | shut box (on / under) + boat (in) | "Put the duck UNDER the box!" | "Under the box!" |
| R5 ball | Crab | sun hat (on / under) + bucket (in) | "Put the crab ON the hat!" | "On the hat!" |
| R6 sail | Crab | boat (in) + upside-down bucket (on / under); the two swap places while Crab walks in | "Put the crab IN the boat!" | "In the boat!" |

## Every narrator line

1. "Let's play on the beach!"
2. The prompt for each round (above) [voiced]
3. Wrong: "Oops, that's IN!" / "Oops, that's ON!" / "Oops, that's UNDER!", then the prompt again [voiced, the prompt as a repeat]
4. Right: "<In | On | Under> the <place>!" [voiced]
5. Finale free play: the place line for every drop [voiced every time]; "Look what you made!"; "You did it! A sticker!"
6. Idle repeats of the prompt; "Bye bye! See you soon!"

All new lines are queued in tools/voice/new-lines.txt.
