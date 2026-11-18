# Word world (id: `words`)

- **World:** Farm (meta world `farm`), "Word world", button name "Words!". Source: app/src/lessons/words.js, words-list.js, words-plan.js, words-scene.js; engine base app/src/engine/lesson.js. Written from the code as it is now.
- **Learning goal:** hear and name real everyday things, find the named thing out of 2 then 3, and (Level 3) sort toys into the right home; each thing found is photographed and kept in her own word book.
- **Levels:** 3 (parent-chosen, not progressive; the word memory is shared by all three). L1 = meet 6 things, then 6 find rounds out of 2. L2 = meet 6 things, then 8 find rounds out of 3 (6 + 2 "again"), with up to 2 listen-first rounds. L3 = meet 6 things, 4 find rounds out of 3, then a toy train brings 6 or 9 toys to sort (6 sorts = 10 rounds in all, or 9 sorts = 13).
- **Meta intro line:** "Let's find some words!" [pending voice]
- **Which things appear is not fixed.** A planner (words-plan.js) picks the place, the two corners ("nooks") and the six words from her saved memory. The three visits below are worked examples produced by running the real planner and word list; a real visit uses whatever her memory says. See "How the visits rotate" at the end.

## Voice and captions (whole game)

- Only lines whose text is in assets/voice/index.json are voiced. Of the game's 928 lines, **912 have no clip yet** (all are in tools/voice/new-lines.txt: `[pending voice]`). 16 lines are voiced by coincidence, because another game already has the same text: "Hello, Bear!", "A butterfly!", "A snail!", "A worm!", "Ooh, ooh, aah!", "Stomp, stomp!", "A ball!", "Blocks!", "Fill it up.", "Twirl, twirl!", "A sock!", "Brush, brush, brush!", "Night night!", "Rain!", "A rainbow!", "Splash!". Plus the engine lines "Bye bye! See you soon!" [voiced] and "You did it! A sticker!" [voiced]. "Look what you made!" [caption only].
- The OS voice is switched off (`VOICE = false` in speech.js), so a silent line is a caption only. A silent caption stays about 1.4 s for a short name ("A cat!") and up to about 2.5 s for a sentence (0.6 s + 85 ms per letter).
- The game's own `speak()` never repeats a line within 4 s (caption only after that). Taps on things bypass the engine's 30 s rule, because naming on every tap is the point.
- Success captions are not used at all: no praise word, no confetti. The reward is the photo.

## The scene (whole game)

- Two corners side by side ("nook A" at x 0, "nook B" at x 12.5), each a little set (outdoor ground or an indoor wall and floor, set dressing, a ledge run behind). Three things stand in three slots (left, middle, right; 2.4 apart). Small things (size S) stand on a low stand (hay roll, stump, crate, stool...) when the nook has one; big things (cow, horse) stand on the ground; the "sky" nook puts things on stems; Me nooks use ONE big bear with three body parts as the three things.
- Pip sits on the ledge behind the things (height 1.5) between the middle and right thing, scaled to 0.52, with a small camera on his chest. He hops along the ledge, never down among the things.
- A **photo line** (a string with a wooden peg above every slot of both nooks, posts at both ends) hangs high over the sets. An **easel with a closed word book** (blue cover with a gold star) stands between the nooks at x 6.25.
- Unmet things breathe 3% and have a pale cream ring on the ground (a small ring on the touch point for body parts), pulsing slowly (3 s).
- The camera is always a glide, never a cut. Views: trio (whole nook, 7.5 away), pair (two slots, 5.05 away, L1 only), line view, book view, tidy view.
- Rain under a cloud keeps falling; nothing else moves on its own.
- Taps on empty space or scenery do nothing (no boings).

## Engine behaviour that applies to every round (engine/lesson.js, as this game uses it)

- **Go! gate:** taps are ignored until the round's set-up, narration and demo are done; then a "Go!" badge flashes 1.3 s (forced after 6 s). In this game the first Go! of the visit appears at the START of nook A's meet (after the wave and place line, after the demo if there is one). It does not appear again before nook B's meet or before the first find round (see "Looked broken"). Every later find round, every sort round and the book each get their own Go! (the Go! is consumed as soon as busy ends).
- **Idle ladder (resets on any touch; not counted while busy, a demo is playing, or she is dragging):** 6 s = the prompt line again as a caption + nudge 1 (the answer bobs up 0.16 and back, silent); 12 s = prompt again + nudge 2 (bob + cream ring on the answer for 3.5 s) + a 2.2 s hand demo on the answer (counts as a hint); 20 s = errorless (see per phase) + prompt again (counts as a hint); 45 s = "Bye bye! See you soon!" [voiced], then Home.
- **Hand demo (`hand()`):** a slow ghost hand floats in from lower right (0.95 s), presses with a ripple (0.28 s), lifts; 2.1 s in all for a tap, 3.9 s for a drag (toy to home). Any touch ends it.
- **Demos that play once ever (stored in her saved memory):** the tap-a-thing demo (meet), the find demo, the sort demo, the book demo. After that, a returning child sees no hand unless she is stuck.
- **Records:** every thing met counts as a first-try record (6 per visit); each find or sort adds one record (first try = no wrong tap, no hint, no errorless).
- **Prompt line shown by the ladder:** meet = "What's that?"; find = "Where's the ...?" (the round's line); sort = the toy's "Where do ...?" line.

## The three phases, as they work in every level

### Meet (all levels, 6 things, nook A then nook B)

1. Arrival: camera close on nook A; 0.8 s; the place line (caption) while Pip turns and waves once (1 s). If the place is Me and neither nook has the big bear: "Let's look at me!" instead.
2. Free exploring, one nook at a time (only that nook's three things answer). Tap a thing: a press-in, then it reacts once (about 0.8 s: creatures and figures hop with a nod and arm swing and a joy face; flutterers lift 0.3 and flap; "sway" things rock; "part" words wiggle that body part of the bear) and its caption shows **name** ("A cat!"). Tap it again: the **about** line ("The cat says miaow.") plus a signature sound if it has one. Third tap: name again; and so on, alternating. More than 3 taps in 1.2 s: reactions still play but no caption or sound for 0.6 s. A tap while it is mid-reaction only presses in.
3. The cream ring fades (0.5 s) when a thing is first met.
4. When all three of the nook are met, the voice is not busy and **4 s pass with no touch**, the phase ends. (Short runs: about 8 to 12 s per nook.) There is no prompt line at the start of a nook.
5. If stuck: the ladder; at 6 s the unmet thing bobs; at 12 s a hand really taps an unmet thing (it names itself); at 20 s errorless: the unmet things name themselves one at a time, 5 s apart, and count as met.
6. After nook A: Pip says "Come and see!" and hops along the ledge to nook B (about 3.4 s) while the camera glides with him. Nook B's things become tappable only when he arrives.

### Find (L1, L2, L3)

Common to every find round (rows below give only what differs):

1. **Set-up (busy, taps off):** the first find of the visit also shows "Let's take pictures!" and Pip lifts his camera (0.6 s). Pip hops along the ledge to the round's gap and the camera glides to the round's view: same nook about 0.8 s; a change of nook about 3.5 s (the camera glides with him over 12.5 units).
2. **Question:** the caption "Where's the ...?" (about 2 s; the game waits at most 2.6 s). At L2 the first two rounds whose word has a sound play the sound first (listen round) and wait 1.1 s.
3. **First find ever:** after the question a 2.2 s hand taps the right thing.
4. Go! badge. Only the round's choices answer taps (L1: the two in the pair; L2/L3: all three).
5. **Right:** four thin white corners close in on the thing (1.35x to 1.1x over 0.35 s) while it squashes 10% (music ducks 30%, effects hush); shutter; the thing reacts (about 0.8 s) and its **name** caption shows; 0.55 s; a white photo card (the thing as it really is, rendered into a card) slides up behind it (0.4 s), arcs (0.8 s) to its own peg on the photo line while the camera glides back out to show the line, a rising note (`sfx.step`) and the card swings (0.9 s). Pip turns toward it and nods or claps (joy face 1 s). Then 1 s of stillness. About 4 s from tap to next round; she cannot act during it. If the same word is already on the line (L2 "again" rounds): a small gold star floats (0.6 s) from the thing to the star slot of its photo instead, the same note and swing.
6. **Wrong:** the tapped thing wobbles softly (0.55 s) and shows its OWN name caption (no "no", no buzzer), taps lock 0.6 s, and 1.4 s later the question caption again. 2nd wrong: the right thing bobs and gets its cream ring (3.5 s). 3rd wrong: errorless (the other things dim to 60% and stop answering; a hand taps the right one; prompt caption). A wrong word still counts as heard.
7. **Nothing:** the ladder above.
8. After the last find round: Pip lowers his camera (0.6 s), then the Book.

### Book (all levels, the ending)

1. Pip hops along the ledge to the easel (about 2 to 3 s at L1/L2) and climbs onto its top bar; the camera glides to the line view; the caption "Pop them in your book!"; the cover swings open (0.8 s) showing two pages with dotted empty squares (nook A left page, nook B right page; 12 fixed places each).
2. Every photo on the line becomes tappable (radius 0.55). Go! badge. Tap a photo: the card arcs (0.7 s) into its own place on its page, a pop sound, its name caption. Taps while a card is in flight are ignored (no feedback). When nook A's photos are all in, the camera glides (1.2 s) to the right half of the line.
3. First ever: a hand taps the first photo for her (about 2 s).
4. If she does nothing for 8 s the cards go in by themselves, one every 1.5 s (nook A's first).
5. Old photos of the page's other words she has met before were drawn into the book quietly in the background from 1.5 s into the visit (up to 18, one every 0.25 s), so the book is fuller each time.
6. When the last card is in: 0.6 s, then the finale.

### Finale

Camera glides to the open book (0.9 s); Pip's joy face; **6 s admire** with the caption "Look what you made!" [caption only]; she can poke any photo: it presses, plays its note and shows its name caption (a quiet review). Then the photo flash (saved to the gallery), no confetti rain (finaleRain is off), the 3-note resolve, "You did it! A sticker!" [voiced], the sticker award, then Home. The visit's results are saved when the photo is taken (words learned, adjusting how many new words come next).

---

## Level 1: worked example, her very first visit ever (Animals: Farmyard + Garden)

Planner result with a blank memory (all demos still to come): place Animals; nook A = Farmyard (barn and hay set, hay-roll stand, fence ledge, sandy ground), nook B = Garden (flowers, stump stand, hedge ledge, green ground). Round shape L1: pairs.

| Slot | Thing | Stands | Name line | About line | Sound on 2nd tap | Reaction |
|---|---|---|---|---|---|---|
| A left | cat | ground | "A cat!" [pending voice] | "The cat says miaow." [pending voice] | meow | creature |
| A middle | dog | ground | "A dog!" [pending voice] | "The dog says woof." [pending voice] | none (the sound `woof` does not exist) | figure |
| A right | cow (big) | ground | "A cow!" [pending voice] | "The cow says moo." [pending voice] | moo | creature |
| B left | bunny | ground | "A bunny!" [pending voice] | "Hop, hop, hop!" [pending voice] | none | creature |
| B middle | bird | stump | "A bird!" [pending voice] | "Tweet, tweet!" [pending voice] | tweet | flutter |
| B right | bee | stump | "A bee!" [pending voice] | "Buzz, buzz!" [pending voice] | buzz | flutter |

Beats:

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | Camera close on the Farmyard (cat, dog, cow with pulsing rings). Pip waves (engine intro wave, sfx hello), then turns and waves once more. | Intro "Let's find some words!" [pending voice]; 0.8 s later "Let's go to the farm!" [pending voice] | none | Pip waves | n/a | n/a | about 3 s, then the demo |
| 2 | A slow hand floats to the dog (middle) and presses it. | none | Watch | The hand itself | The dog really reacts (hop, nod, arms) and "A dog!" shows; its ring fades. 2.1 s. | n/a | Go! badge flashes; her turn |
| 3 | She taps cat, dog, cow in any order (see free exploring above). | Name on 1st tap, about on 2nd | Tap a thing | The pulsing cream rings on unmet things; Go! badge | Reaction plus caption; ring fades | Nothing is wrong. At 6 s "What's that?" [pending voice] caption and the unmet thing bobs; 12 s hand taps one for her; 20 s the rest name themselves | When all three met and 4 s quiet |
| 4 | Pip says "Come and see!" and hops along the ledge to the Garden; camera glides right. Nothing is tappable. About 3.4 s. | "Come and see!" [pending voice] | none | Camera and Pip move | n/a | n/a | Garden: bunny (left), bird and bee (on stumps) |
| 5 | Garden, rings pulsing. No demo this time (the demo plays only at the first nook ever). | none | Tap a thing | Rings; Go! does NOT flash here | As row 3 | As row 3 | When all three met and 4 s quiet; the planner counts this place as visited now (turn 1) |
| 6 | Find 1 (Garden, pair bunny + bird, target bird). Pip lifts his camera; camera glides in to frame bunny and bird; the third thing (bee) is out of the pair and cannot be tapped. | "Let's take pictures!" [pending voice]; then "Where's the bird?" [pending voice] | Tap the bird | First find ever: a 2.2 s hand taps the bird after the question. Ring/bob/hand per ladder. | Bird: viewfinder, shutter, flutter, "A bird!" [pending voice], card to peg 5 of 6 (over the middle of the Garden); note 1 of 6 | Tap bunny: wobbles, "A bunny!" [pending voice], then the question again | Next round |
| 7 | Find 2 (pair bird + bee, target bee). Pip hops 2.4 right (0.9 s); camera glides 0.8 s. | "Where's the bee?" [pending voice] | Tap the bee | Go! | Bee photo to its peg; "A bee!" | Tap bird: wobble, "A bird!" | Next |
| 8 | Find 3 (pair bunny + bird, target bunny). Pip hops back left. | "Where's the bunny?" [pending voice] | Tap the bunny | Go! | Bunny photo; "A bunny!" | Tap bird: wobble, "A bird!" | Next; the Garden is done |
| 9 | Find 4 (Farmyard, pair cat + dog, target cat). Pip hops 12.5 units back to the Farmyard (about 3.5 s) with the camera gliding alongside. Nothing is tappable. | "Where's the cat?" [pending voice] | Tap the cat | Go! | Cat photo to peg 1 (over the Farmyard); "A cat!" | Tap dog: wobble, "A dog!" | Next |
| 10 | Find 5 (pair dog + cow, target dog). Pip hops right 1.2; the cow is large. | "Where's the dog?" [pending voice] | Tap the dog | Go! | Dog photo; "A dog!" | Tap cow: wobble, "A cow!" | Next |
| 11 | Find 6 (same pair dog + cow, target cow). Pip does not move; same camera. | "Where's the cow?" [pending voice] | Tap the cow | Go! | Cow photo; "A cow!"; six photos now hang on the line. Camera lowers. | Tap dog: wobble, "A dog!" | Book |
| 12 | Book phase (see above): Pip hops to the easel and climbs; line view; cover opens. | "Pop them in your book!" [pending voice] | Tap a photo | First ever: a hand taps the first photo (the bird's: photos are listed in the order they were taken) | The card arcs to its page place, pop sound, name caption ("A cat!"...) | 8 s idle: they go in by themselves, one per 1.5 s. Photos stay in the book for good. | After the last card: finale |

- **Ending:** the camera glides to the open book (0.9 s). Six photos sit in their places on the two pages, the rest dotted. 6 s admire ("Look what you made!" [caption only]); she can poke photos (press, note, name caption). Photo flash, resolve, "You did it! A sticker!" [voiced], sticker, Home. No rain.
- **Timings (about):** arrival 3 s; demo 2 s; meet A 8-15 s; walk 3.4 s; meet B 8-15 s; find round about 2 s of set-up and question + her time + 4 s of payoff, so about 10 s each (longer with the first demo); nook changes add about 3.5 s; book about 5-12 s; finale about 12 s. A whole visit is about 2.5 to 3 minutes. Waits over 3 s where she cannot act: the walk (row 4), the walk back (row 9), the payoff (about 4 s after every right find), the first Find's camera lift plus demo.
- **Every narrator line (in order):** "Let's find some words!" [pending voice]; "Let's go to the farm!" [pending voice]; names and abouts of cat, dog, cow, bunny, bird, bee as above [pending voice]; "What's that?" [pending voice] (idle only); "Come and see!" [pending voice]; "Let's take pictures!" [pending voice]; "Where's the bird?", "Where's the bee?", "Where's the bunny?", "Where's the cat?", "Where's the dog?", "Where's the cow?" [all pending voice]; the name caption after each right find; wrong-tap name captions; "Pop them in your book!" [pending voice]; the six names again as each card goes in; "Look what you made!" [caption only]; "You did it! A sticker!" [voiced]; idle exit "Bye bye! See you soon!" [voiced].

---

## Level 2: worked example, a review visit (Animals, turn 2, Farmyard + Garden)

Planner result after three earlier visits (simulated child who found everything first try; she has been to Animals, Home, Food). This is the 4th visit, so it is a review turn. All demos have already played. Three new things come this time (L2 asks for one more new word than the base two).

| Slot | Thing | Stands | Name | About | Sound on 2nd tap | Reaction |
|---|---|---|---|---|---|---|
| A left | cat (known) | ground | "A cat!" [pending voice] | "The cat says miaow." [pending voice] | meow | creature |
| A middle | dog (known) | ground | "A dog!" [pending voice] | "The dog says woof." [pending voice] | none (no `woof` sound) | figure |
| A right | duck (new) | ground | "A duck!" [pending voice] | "The duck says quack." [pending voice] | quack | creature |
| B left | butterfly (new) | stump | "A butterfly!" [voiced] | "Flutter, flutter!" [pending voice] | none | flutter |
| B middle | bird (known) | stump | "A bird!" [pending voice] | "Tweet, tweet!" [pending voice] | tweet | flutter |
| B right | frog (new) | ground | "A frog!" [pending voice] | "Ribbit!" [pending voice] | ribbit | creature |

Nothing marks the known things from the new ones; she meets all six again.

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | Farmyard; Pip waves. The book on the easel already holds photos of cow, bunny, bee (drawn quietly from 1.5 s). | Intro [pending voice]; "Let's go to the farm!" [pending voice] | none | Pip waves | n/a | n/a | Meet A |
| 2 | Meet A (cat, dog, duck): rings, no demo. | Names and abouts as table | Tap each thing | Rings; Go! | Reaction plus caption | Ladder as in Meet | 4 s quiet after all three |
| 3 | Walk to the Garden (about 3.4 s). | "Come and see!" [pending voice] | none | Camera glide | n/a | n/a | Meet B |
| 4 | Meet B (butterfly, bird, frog). | Names and abouts as table | Tap each thing | Rings | As above | As above | 4 s quiet |
| 5 | Find 1 (Garden, trio, target bird). "Let's take pictures!" and Pip lifts his camera; Pip hops 2.4 to the gap right of the middle; camera glides 0.8 s. Listen round: the tweet sound plays, 1.1 s of nothing, then the question. | "Let's take pictures!" [pending voice]; "Where's the bird?" [pending voice] | Tap the bird (out of butterfly, bird, frog) | Go! after the question; no hand | Bird photo to its peg; "A bird!" | Tap butterfly or frog: wobble, its name, question again; 2nd wrong: bird bobs and ring; 3rd: others dim | Next |
| 6 | Find 2 (target butterfly). No listen (no sound). | "Where's the butterfly?" [pending voice] | Tap the butterfly | Go! | Photo; "A butterfly!" [voiced] | As above | Next |
| 7 | Find 3 (target frog). Second and last listen round: ribbit, 1.1 s, then the question. | "Where's the frog?" [pending voice] | Tap the frog | Go! | Photo; "A frog!" | As above | Next |
| 8 | Find 4 (Farmyard, trio, target duck). Pip and the camera cross back (about 3.5 s). No listen (two already used). | "Where's the duck?" [pending voice] | Tap the duck (out of cat, dog, duck) | Go! | Photo; "A duck!" | As above | Next |
| 9 | Find 5 (target cat). | "Where's the cat?" [pending voice] | Tap the cat | Go! | Photo; "A cat!" | As above | Next |
| 10 | Find 6 (target dog). | "Where's the dog?" [pending voice] | Tap the dog | Go! | Photo; "A dog!" | As above | Next |
| 11 | "Again" round, Garden (about 3.5 s crossing first). The target is the word she missed in this nook, else the one with the lowest box (here most likely butterfly: a new word, first in slot order among the lowest). | "Where's the butterfly?" [pending voice] (the target's line) | Tap it | Go! | No new card: a small gold star floats from the butterfly to the star slot of its photo on the line; note and swing | As above | Next |
| 12 | "Again" round, Farmyard (crossing again, about 3.5 s). Most likely the duck. | "Where's the duck?" [pending voice] | Tap it | Go! | Gold star onto its photo | As above | Book |
| 13 | Book: six photos, six cards go in. Hand demo not shown (taught once). | "Pop them in your book!" [pending voice] | Tap a photo | Go! | Cards fly in, names | 8 s: auto, one per 1.5 s | Finale |

- **Ending:** as Level 1: open book, 6 s admire, flash, resolve, "You did it! A sticker!" [voiced], sticker, Home. Photos of known words with higher confidence also show a small gold star on the book photo (a word known well enough, box 4 or more).
- **Timings (about):** find round about 10 s (listen rounds +1.5 s); three nook crossings in the finds (rows 8, 11, 12) each add about 3.5 s of travel; whole visit about 3.5 minutes. Waits over 3 s: three crossings, the 4 s payoff after each find, the 1.1 s of listen silence.
- **Every narrator line (in order):** intro, "Let's go to the farm!", six names and abouts (above), "What's that?" (idle), "Come and see!", "Let's take pictures!", "Where's the bird?", "Where's the butterfly?", "Where's the frog?", "Where's the duck?", "Where's the cat?", "Where's the dog?", then the two "again" questions, name captions after each find, "Pop them in your book!", names as cards fly in, "Look what you made!", "You did it! A sticker!" [voiced]. All [pending voice] except "A butterfly!" [voiced] and the two exit lines.

---

## Level 3: worked example, the train sorting (her first visit ever at L3: Animals; sort stage 1)

Planner result with a blank memory at Level 3. Same Farmyard and Garden, same six things and lines as Level 1 (cat, dog, cow; bunny, bird, bee). All four demos (meet, find, sort, book) are still to come. Sort stage 1 = two "very different" groups: Animals (barn) and Clothes (wardrobe), because Animals is today's place.

Beats 1 to 5 (arrival, meet A with the dog demo, walk, meet B) are exactly Level 1 rows 1 to 5. Then:

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 6 | Find 1 (Garden, trio: bunny, bird, bee; target bee, the third slot). "Let's take pictures!"; Pip lifts his camera; hand demo taps the bee after the question. | "Let's take pictures!" [pending voice]; "Where's the bee?" [pending voice] | Tap the bee (out of three) | 2.2 s hand, Go! | Bee photo to its peg; "A bee!" | Wrong tap: wobble, its name, question again | Next |
| 7 | Find 2 (target bunny) | "Where's the bunny?" [pending voice] | Tap the bunny | Go! | Photo; "A bunny!" | As above | Next (the bird gets no photo) |
| 8 | Find 3 (Farmyard, trio; target cow). Cross to nook A (about 3.5 s). | "Where's the cow?" [pending voice] | Tap the cow | Go! | Photo; "A cow!" | As above | Next |
| 9 | Find 4 (target cat). | "Where's the cat?" [pending voice] | Tap the cat | Go! | Photo; "A cat!"; four photos on the line (dog and bird have none). Camera lowers. | As above | Tidy |
| 10 | Tidy set-up: Pip hops along the fences far right (about 3.5 s, z behind the rug), camera glides to a pink rug with TWO homes: a barn (left) and a wardrobe (right), doors standing open. A toy-train track runs along the front of the rug; the train is parked off screen right. | "Tidy-up time!" [pending voice] | none | Camera | n/a | n/a | Train |
| 11 | The train (blue engine, three coloured carts, wheels turning) rolls in from the right over about 5.2 s and tootles. Three toys ride in the carts: duck, pig, coat. | "Here comes the train!" [pending voice] (first load only) | none | Train arrival | n/a | n/a | Demo |
| 12 | First sort ever: a slow hand picks up the duck and carries it to the barn (3.9 s). | "Take it home!" [pending voice] | Drag the duck to the barn | The hand; then Go! | Not her drag | Ladder | Her turn |
| 13 | Sort 1: duck. She picks it up (press-and-lift, the duck's name caption). Near the barn, the barn's doors open wider. | "A duck!" [pending voice] on pick-up; prompt line (idle only) "Where do animals go?" [pending voice] | Drag the duck to the barn (left) | The hand; doors opening wider as it nears the right home only; Go! | Duck arcs onto the barn shelf (0.6 s or more), note, reaction, caption "Animals go in the barn." [pending voice]; 0.9 s; 1 s still | Wrong home (wardrobe): it shakes its head (0.55 s), the duck walks back to its cart (0.5 s), "Where do animals go?"; 2nd wrong: barn's doors open wider plus a ring on the floor; 3rd: the wardrobe's doors close (see Looked broken). Drop on nothing: walks home silently. Stuck 8 s: the hand demo again (every 14 s); 12 s ladder prompt; 20 s errorless; 45 s exit | Sort 2 |
| 14 | Sort 2: pig (second cart). | "A pig!" [pending voice]; "Animals go in the barn." [pending voice] | Drag the pig to the barn | As row 13 | As row 13, second barn spot | As row 13 | Sort 3 |
| 15 | Sort 3: coat (third cart). Coat is a word she has not met yet; picking it up is the first time she hears it. | "A coat!" [pending voice]; "Clothes go in the wardrobe." [pending voice]; ask "Where do clothes go?" [pending voice] | Drag the coat to the wardrobe (right) | As row 13; the wardrobe's doors open as the coat comes near | Coat to the wardrobe shelf; sway reaction | Wrong home: the barn shakes, "Where do clothes go?" | Load done |
| 16 | The carts are empty; after 1 s the train rolls out to the right (about 5.2 s) and comes back with the next load (about 5.2 s): tshirt, sheep, trousers. | none | none | Train sounds (toot) | n/a | n/a | Sort 4 |
| 17 | Sort 4: tshirt, wardrobe. | "A T-shirt!"; "Clothes go in the wardrobe." (all [pending voice]) | Drag the T-shirt to the wardrobe | As row 13 | As row 13 | As row 13 | Sort 5 |
| 18 | Sort 5: sheep, barn. | "A sheep!"; "Animals go in the barn." | Drag the sheep to the barn | As row 13 | As row 13 | As row 13 | Sort 6 |
| 19 | Sort 6: trousers, wardrobe. The train does not leave after the last load. | "Trousers!"; "Clothes go in the wardrobe." | Drag the trousers to the wardrobe | As row 13 | As row 13 | As row 13 | Book |
| 20 | Pip claps at the full barn (2 s look), then hops back along the ledge to the easel (about 5 s, the camera gliding 18 units); book opens; four photos on the line. | "Pop them in your book!" [pending voice] | Tap a photo | First ever: hand taps the first photo | Card to its place | 8 s: auto, one per 1.5 s | Finale |

- **Ending:** as Level 1, but only four of today's six words have photos in the book (the dog and the bird have empty dotted places). 6 s admire, flash, resolve, "You did it! A sticker!" [voiced], sticker, Home.
- **Later sort stages (not shown):** stage 2 uses two groups of any kind (any two of animals, food, toys, clothes, things that go) with a mixed pattern, 2 loads (6 sorts, 10 rounds in all); stage 3 uses three homes and 3 loads, one or more toys per home each load (9 sorts, 13 rounds in all). Stage rises after good sorts, falls after 2 or more wrong drops.
- **Timings (about):** meet 30 s; finds about 9 s each plus one crossing; Tidy move 3.5 s; train in 5.2 s (plus the first demo 4 s); about 20 s per load of her own time; train out and in between loads about 11.4 s; travel to the easel about 5 s; whole visit about 4.5 minutes. Waits over 3 s where she cannot act: Tidy move 3.5 s, first train arrival 5.2 s, the train swap about 11.4 s (nothing to do while carts are empty), the walk to the easel 5 s, plus the 4 s payoff after each find.
- **Every narrator line (in order):** as Level 1 up to the first find, then "Where's the bee?", "Where's the bunny?", "Where's the cow?", "Where's the cat?", "Tidy-up time!", "Here comes the train!", "Take it home!", pick-up names ("A duck!", "A pig!", "A coat!", "A T-shirt!", "A sheep!", "Trousers!"), "Where do animals go?" / "Where do clothes go?" (idle or wrong), "Animals go in the barn." / "Clothes go in the wardrobe." (on success), "Pop them in your book!", "Look what you made!", "You did it! A sticker!" [voiced]. All [pending voice] except where noted.

---

## How the visits rotate (words-plan.js)

The place, the two nooks and the six words are chosen at the start of each visit from one saved memory (shared by all three levels); there is no "level up" through the places.

- **Place:** never the same place twice running; places wait at most 14 visits. The default pick is the place that has waited longest (a never-visited place counts as waiting for ever; ties go in the order Animals, Home, Food, Playroom, Things that go, Clothes, Me, Outside, People). Every 4th visit (the visit counter is 0-based and is checked with `% 3`, so visits 4, 7, 10...) is a **review**: the place with the most words she met but has not got firmly (boxes 1 and 2 that are due). If none are due, it is a fresh place. Running the planner with a child who is always right gives: Animals, Home, Food, Animals (review), Playroom, Things that go, Home (review), Clothes, Me, Food (review), Outside, People.
- **Nooks:** a place's first visit uses its fixed first pair (Animals: Farmyard + Garden; Home: Kitchen + Bathroom; Food: Fruit + Breakfast...). Later turns score each nook by due words (heavier for young words) plus fresh words plus a growing pull for any nook left out for a while, and take the best two.
- **Words:** each nook takes up to 3. First the new words (the quota is 2 per visit to start, 3 at Level 2, changed by how she does), then words that are due, then the least recently seen, then more new ones to fill. Words that look or sound alike never share a nook (lion/tiger, mud/puddle...). The most familiar word goes in the middle slot; very big things go to the sides.
- **Words come back:** a word has a box from 0 (never met) to 5. A box-1 or 2 word returns at the place's next turn; box 3 after 2 turns; box 4 after 3; box 5 after 5. A right-first-try find (once a day) raises the box; a hinted or wrong find lowers it.
- **How many new words:** after a visit with fewer than half the finds right first try, new words drop by one (never below 1); after two good visits in a row (all but one right first try, 4 or more finds) it rises by one (up to 4). The first visit to a place never counts.
- **Level 3 sorting:** stage 1 (two very different groups), 2 (any two, the pattern mixes more), 3 (three homes); up after 2 (stage 1) or 3 (stage 2) good sorts, down after 2 or more wrong drops.
- **Availability:** a word only appears when its model exists; today all 300 words of VOCAB.md are available (60 Animals, 60 Food, 30 Playroom, 57 Home, 29 Outside, 21 Clothes, 18 Me, 15 Things that go, 10 People).
- **The quit case:** the place's turn is counted when the Meet finishes, but the visit counter only rises when the finale's photo is taken, so a visit quit mid-way still counts that place as visited but not toward the review cycle.
- **Parent panel:** shows "Words met X of 300 · known Y" and a per-place count; Reset forgets the word memory.

---

## Looked broken or off (for the audit)

1. **Almost nothing is voiced.** 912 of 928 lines are pending voice; the 16 voiced are accidental matches from other games, so a child hears "A ball!" and "A butterfly!" but not "A dog!" or any question. The engine's idle exit line and the sticker line are voiced.
2. **Silent signature sounds.** `woof` (dog), `monkey`, `rattle`, `bell` and `honk` (car) are not defined anywhere (neither in sfx nor in the game's own sounds), so the dog's, monkey's, rattle's, bell's and car's second tap shows the about line with no sound.
3. **Place line says "farm" for every Animals visit.** "Let's go to the farm!" also plays at the Wild wood, Zoo, Rock pool and Far away.
4. **The first round's Go! badge is used up at the start of the meet.** Round 0 contains the whole meet phase, so the Go! flashes once when nook A becomes tappable and never before nook B's meet or before the first Find question (every later round gets its own Go!).
5. **The demo for tapping a thing plays only at the first nook ever.** The second nook (and every later visit) shows no hand until she is stuck for 12 s.
6. **Dead waits over 3 s at Level 3:** the Tidy set-up (about 3.5 s), the first train arrival (5.2 s), and between loads the carts are empty while the train rolls out and in (about 11.4 s in all); then about 5 s walking to the easel. She can do nothing during any of these.
7. **Sort nudges do nothing.** The silent bob (6 s, 12 s) tries to bob the home, but a home has no pose group, so nothing moves; only the 8 s drag demo, the caption and, from the 2nd wrong, the ring and wider doors help. The "errorless" step in Tidy only closes the wrong homes' doors; a drop on a closed wrong home is still just a wrong drop.
8. **Level 3 leaves two words per visit without photos** (only 4 finds out of 6 words), so the book keeps dotted empty places for words she met today, and today's words are excluded from the quiet old-photo drawing, so a word she earned on an earlier visit also shows an empty place today if it is not asked.
9. **In the Meet phase every known word is re-met** with no sign of which are new, and she must stay quiet 4 s to move on (a child who keeps tapping never advances; the idle ladder is the only way out).
10. **Level 2 "again" rounds** may ask for the word just found 2 to 3 rounds earlier (the lowest-box word of that nook, ties in slot order), and cross between the two nooks three times (about 3.5 s each).
11. **Review cycle comment is wrong:** words-plan.js says "fresh, fresh, review", but the code gives three fresh places then a review (visits 4, 7, 10...).
12. **Body words reuse models:** "finger", "toes", "teeth" and "tongue" show the whole hand, foot and mouth models, so a tap on a hand picture is named "finger" (the planner never puts them in the same nook).
13. **Book taps while a card is flying are ignored with no feedback** (0.7 s).
14. **An idle 45 s in the Tidy phase exits Home** with "Bye bye!", losing that visit's results (the place turn counts, the visit does not).
