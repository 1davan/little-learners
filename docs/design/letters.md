# 🔤 Letter friends (`letters`): design

Status: design only, no code. Read with `docs/design/BRIEF.md`, `docs/FEEL-BRIEF.md`, `docs/SATISFACTION.md`, `docs/QUALITY-BRIEF.md`.
Word list: `docs/design/VOCAB.md` did not exist when this was written. Section 7.3 is this game's request to it.

---

## 1. Pitch and references

**Pitch.** The Alphabet Train stops at a little station. A chunky letter friend ("A!") arrives, the station trunk opens and its favourite things tumble out: apple, ant, alligator. She taps each one to hear its name, then packs them into that letter's carriage, until a whole train of letters and their things is ready to go.
Level 1 is meeting letters and naming things, Level 2 is sorting each thing to its letter, Level 3 is listening for first sounds ("Mmm... moon!").

**How it complements Brick letters (`bricks`).** Bricks teaches the *shape* of a capital (stroke by stroke, with counting) and gives one picture word per letter, A to T. Letter friends never builds a letter. It teaches the other three things: recognising a letter among others, the letter's *sound*, and vocabulary (two or three words per letter, all 26 letters). The friends are built from the same stroke shapes as the brick letters, so "the A I built" and "my friend A" look like the same letter.

| Reference | What we take |
|---|---|
| Endless Alphabet (Originator) | Letters are characters with a voice: touching a letter makes it say its *sound*. Words are funny things, not flashcards. We leave out the frantic monsters and the spelling. |
| Sago Mini (World, Trucks) | Dump-and-fill play with chunky toys, a vehicle that fills up and stays filled, characters that react with their faces instead of fanfares. |
| Pok Pok | Calm toy-room pace, almost no sound, everything pokeable and nothing punished. |
| Busy Shapes (Edoki) | Levels that add one small difficulty at a time, hints that appear only when she is stuck, the right target opening as you approach it. |
| Peekaboo Barn | Tap, a thing appears, a warm voice names it once. The whole vocabulary loop is that simple. |
| Montessori sound games ("I spy something that starts with mmm") | Sounds before letter names for phonics, stretchy sounds first, three-part naming, vowels in one colour and consonants in others. |

---

## 2. Learning goals (Marble os-taxonomy ids)

| Topic id | Name | Where it is taught |
|---|---|---|
| `mt_frDIaXzWbx` | Knowing all letters | Every level: each friend is a capital letter, named on arrival and when poked; Level 2 sorts things to the right letter and has "Find S!" rounds. |
| `mt_F978c32kDr` | Single Letter Sounds | Level 3: the friend says its sound, the child finds the thing that starts with it, then matches a heard sound to its letter. |
| `mt_j89i4u2fKr` | Spotting and making alliteration | Level 1 recap ("A! Apple, ant, alligator!") and Level 3 ("Who starts like this?"). |
| `mt_NP101Zl-4g` | Using New Vocabulary | Tap any thing, any time, to hear its name: 74 concrete nouns. |
| `mt_zVLOm6U7bh` | Naming Common Animals | Secondary: about a third of the things are animals. |

The taxonomy places letters and sounds at age 4 and up. For a 2-year-old the honest goals are: **names of things** (mastery), **letter names and shapes** (familiarity through repetition), **first sounds** (playful exposure, errorless). Nothing in the game needs her to already know a letter.

Suggested `meta.js` entry: `id: 'letters'`, title "Letter friends", name "Letters!", icon 🔤, intro "All aboard the letter train!", topics = the first four rows above. World: decided by whoever integrates the five new games; `build` (beside Brick letters, currently 3 games) is the natural home. The scene is self-contained either way.

---

## 3. Core loop, moment by moment

### 3.1 The cast of interactions (same in every level)

| Child does | What happens | Sound | Voice |
|---|---|---|---|
| Taps the **trunk** | Lid presses 0.94, `beat(trunk, 0.45)`, lid swings open over 0.6 s, things come out one at a time, 0.9 s apart | One wooden latch click as the lid opens. One soft thud per landing (the physics landing sound, nothing added) | none |
| Taps a **thing** on the rug | Press-in, then its own small silent show (section 3.5), 0.6 s | none | Its name: "Apple!" Spoken on every tap (needs the `repeat` option, section 8.1), minimum 1.5 s between repeats of the same word |
| Taps a **letter friend** | Press-in, friend rocks once, mouth opens | none | Levels 1 and 2: its name, "A!". Level 3: its sound, "Mmm!" |
| Picks up a thing | Engine grab feel (squash and lift, spring carry). Creatures are not lifted: they walk under the finger with their gait | Default quiet pick-up | none |
| Carries it near a carriage | That carriage's front flap lowers in proportion to closeness (`onNear`), its friend leans toward the thing and watches it | none | none |
| Drops on the **right** carriage | Thing arcs to the next free seat (0.5 s), settles with a landing squash, friend shows `joy` for 1 s | One wooden clonk + `sfx.step(i, n)` (the level's rising note; clonk and step are one combined sound event) | Level 2: "B! Banana!" Level 3: "B, b, b... banana!" Level 1: none (already heard) |
| Drops on the **wrong** carriage | `redirect(line, { obj: thatFriend })`: that friend shakes its head once, flap closes, the thing walks home on a 0.5 s arc. From the second miss in a round only the right carriage's flap opens (errorless) | `sfx.nope` once | Caption only: "Try the other one!" (voiced the first time in a session) |
| Drops on nothing | `autoHome`: arcs back to its rug spot | none | none |
| Pokes anything already loaded | Soft press, it does its show | Its step note | Its name |

Rules that hold everywhere: one sound per action, no boings, no confetti before the finale, nothing leaves the scene once she has placed it, every automatic movement eases over 0.5 to 0.9 s, and at least 1 s of stillness follows every success.

### 3.2 Level 1 loop: Meet, then All aboard (two rounds per letter)

**Round "Meet" (letter n)**

1. The train is standing with an empty carriage at the station. The letter friend waddles in from the right along the back of the platform (1.5 s), stops beside the carriage, turns to the camera, rocks once. Voice: **"A!"**
2. The trunk lid bobs slowly (the "use me" bob, silent). First time only: hand demo taps the trunk, voice "Tap the trunk!", then the Go badge.
3. She opens the trunk (four variants, section 4.1). Things land on the rug spots, wobble upright to face her. No names yet: the question "what are they?" is the suspense.
4. Things she has not tapped yet bob gently in turn. She taps each: name and show. Any order.
5. When the last one has been heard: 0.6 s still, then the recap. The friend rocks, voice "A!", then each thing hops once as its name is spoken: "Apple!" "Ant!" "Alligator!" (chained existing clips, each hop starts with its clip, so sync is exact). This is the alliteration moment.
6. `success()` with no line. Pip nods.

**Round "All aboard" (letter n)**

1. Voice: **"All aboard!"** First time: hand demo drags the first thing to the carriage. Go badge.
2. She drags each thing in (any order). Flap lowers as she approaches; each lands on a seat with clonk + rising step note.
3. Last piece is the friend: letters 1 and 2 waddle up the flap and onto the rear deck by themselves (0.9 s); letters 3 and 4 are dragged by her ("M goes too!").
4. Payoff (`payoffP`): flap closes, `beat(train, 0.45)`, one soft chuff, the train rolls one carriage forward (1.2 s, ease in-out) so the next empty carriage arrives at the station. The loaded carriage stays in view at the left edge.
5. `success()`, 1 s still, next letter.

### 3.3 Level 2 loop: Which letter? (one thing per round)

1. Two (later three, four) carriages are at the station, each with its friend on the rear deck.
2. Trunk bobs. She taps it: one thing tumbles to the middle of the rug and stands up. Voice: its name, "Banana!"
3. Go badge. She drags it to a carriage. Feedback as in 3.1. On a correct drop voice: "B! Banana!"
4. Hint ladder: at 6 s the right friend rocks once and says its name; at 12 s hand demo of the drag plus a soft glow on the right carriage; at 20 s the thing walks there itself (engine errorless step).

"Find it" rounds (two per level): no thing comes out. Voice: "Where is S?" She taps a friend. Right: it rocks, says "S!", and Pip walks over and plants a small pennant on that carriage (the pennant stays). Wrong: that friend says its own name ("M!") and shakes its head; ask again in caption only.

### 3.4 Level 3 loop: First sounds

*Sound to thing* (rounds 1 to 8): one carriage at the station.
1. Rounds 1 to 4: voice "Tap M!" (letter name), Go badge, she taps the friend, it says its sound: **"Mmm!"** with its mouth held in the sound shape and a small body shiver. Rounds 5 to 8: the friend says its sound by itself as its carriage arrives; tapping repeats it.
2. Two (later three) things are on the rug. Voice: **"Who starts like this?"** then the sound again, "Mmm!"
3. She taps or drags a thing.
   - Right: voice **"Mmm... moon!"**, it goes to its seat (tap: it hops there on an arc; drag: as usual), clonk + step.
   - Wrong: that thing does a small wobble and says its *own* sound and name, "Sss... sock!", then the friend repeats "Mmm!". Informative, never a buzzer. It stays on the rug. From the second miss the right thing bobs with a glow.
4. The things left on the rug stay there: they are the targets of the next rounds.

*Sound to letter* (last rounds): two carriages at the station, one thing.
1. Trunk tap, the thing tumbles out. Voice: "Sss... snail!"
2. She drags it to M or to S. Tapping a friend makes it say its sound, so she can compare. Feedback as Level 2, with the sound line.

### 3.5 Thing shows (silent, 0.6 s, on tap)

Reuse the show table in `bricks-words.js` (`bounce`, `wobble`, `flip`, `jiggle`, `spin`, `float`, `fly`, `flutter`, `rock`, `sway`, `sparkle`) without its sounds. Creatures use their existing per-character tap reaction, also silent. In the finale admire only, animals give their call (`sfx.moo`, `quack`, `meow`, `oink`, `ribbit`, `neigh`) instead of a step note, and the xylophone plays three step notes.

---

## 4. Progression

> **Rebuilt (audit `docs/storyboards/AUDIT-letters.md` section 3).** The core loop is now much shorter: Level 1 has **4 rounds** (one per letter: one tap on the box, then three drags), Levels 2 and 3 have **6 rounds** each with one action per round, and a level takes about 1 to 1.5 minutes. Friends ride on the train from the start; nothing walks or rolls in from far away. The tables in 4.1 to 4.3 below describe the original design; the current beat-by-beat behaviour is in `docs/storyboards/letters.md`.

### 4.0 Letter sets

A session plays one set of four letters. Each level keeps its own set counter in the store (`store.update`), advanced when the level is **finished** (its finale), so every completed play of a level brings the next set; after the last set it wraps round. Sets are ordered so the early ones use familiar words, existing models and clearly different sounds. Never in one set: c/k/q, b/p/d, m/n, f/v, s/z, l/r, r/w, t/d, two vowels.

| Set | Letters (train order, front to back) | Notes |
|---|---|---|
| 1 | A, B, M, S | |
| 2 | C, D, H, P | |
| 3 | F, L, T, G | |
| 4 | R, N, E, J | |
| 5 | W, K, O, Z | Z has two things |
| 6 | I, V, Y, B | Levels 1 and 2. B is a review letter |
| 7 | U, Q, X, S | Levels 1 and 2 only (Q and X have no clean first-sound words). S is a review letter |
| 6 (Level 3) | I, V, Y, B | Level 3: one vowel per set (audit LF17) |
| 7 (Level 3) | U, K, P, S | Level 3 has seven sets: 1 to 5 and these two |

Things per letter are in section 7.3. A letter has three things, or two (Z, U, Q, X). Things marked "name only" (ice cream, owl, x-ray) are used in Levels 1 and 2 and never in Level 3.

### 4.1 Level 1: "Meet the letters" (8 rounds; set 1 shown)

Look: morning, pale blue sky, red-and-yellow wooden train, cream rug with a red border.

| Round | Letter | Kind | Layout | What she does (solution) | New this round |
|---|---|---|---|---|---|
| 1 | A | Meet | Trunk closed, rug empty, A beside carriage 1 | **Tap the trunk once**: apple, ant, alligator tumble out. Tap each | Tap demo on trunk, tap demo on first thing |
| 2 | A | All aboard | Three things on rug, carriage 1 flap up | Drag apple, ant, alligator into carriage 1. A waddles aboard | Drag demo |
| 3 | B | Meet | As round 1, B beside carriage 2 | **Knock three times**: each tap on the trunk lets one thing out (ball, banana, bear). Tap each | Bear does not tumble: it hops out and lands on its feet |
| 4 | B | All aboard | | Drag ball and banana; bear walks under her finger. B waddles aboard | A creature that walks |
| 5 | M | Meet | Lid has a round handle that glows | **Lift the lid**: drag the handle up. The lid follows her finger and stays where she leaves it; moon comes out at one third open, monkey at two thirds, milk at fully open. Tap each | Drag demo on the handle |
| 6 | M | All aboard | | Drag moon, monkey, milk, **then drag M itself** onto the rear deck ("M goes too!") | Handling the letter |
| 7 | S | Meet | Lid opens a crack by itself | **Peekaboo**: one thing at a time peeks over the trunk rim (top third showing). Tap it and it hops out: sun, sock, snail. Then tap each on the rug | Tap demo on the peeking thing |
| 8 | S | All aboard | | Drag sun, sock, snail and S aboard. The train is full | |

Why no two rounds feel the same: four ways of opening the trunk, props that tumble versus animals that hop out and walk, a different show for every thing, and from letter 3 she carries the letter itself. Sets with a two-thing letter simply have two things in those rounds.

Timing target: 40 to 50 s per letter, about 4 minutes in all.

### 4.2 Level 2: "Which letter?" (11 rounds; set 1 shown)

Look: midday, warm sky, green-and-cream train, striped blue rug. The level opens with the train rolling in from the right with all four friends already on their rear decks (2.5 s, the only wide shot), then the camera closes on the first pair.

Carriages at the station are listed left to right. "Anchor" = a thing already sitting in the carriage as a clue.

| Round | At the station | Thing | Solution | What is new |
|---|---|---|---|---|
| 1 | A (anchor apple) and B (anchor ball) | banana | B | Two choices, with a clue in each carriage |
| 2 | A, B | ant | A | |
| 3 | M, S (train rolls two carriages on; no anchors) | moon | M | No clue: she learns from the friends' reactions |
| 4 | M, S | sun | S | |
| 5 | M, S | milk **and** sock together | milk to M, sock to S, any order | Two things at once (a real sort) |
| 6 | M, S | none: "Where is S?" | Tap S. It gets a pennant | Pure letter recognition |
| 7 | B, M, S (train rolls back one; camera a little wider) | bear | B | Three choices |
| 8 | B, M, S | snail | S | |
| 9 | B, M, S | monkey | M | |
| 10 | A, B, M, S (camera shows the whole train) | alligator | A | Four choices |
| 11 | A, B, M, S | none: "Where is A?" | Tap A. It gets a pennant | Recognition among four |

End state: every carriage holds its three things, two carriages fly pennants.

Generator rule for other sets (letters L1 to L4 in train order, things t1 to t3 each): anchors = L1.t1 and L2.t1; rounds = L2.t2, L1.t2, L3.t1, L4.t1, (L3.t2 + L4.t2 together), find L4, L2.t3, L4.t3, L3.t3, L1.t3, find L1. A round whose thing does not exist (two-thing letters) is skipped; a level never has fewer than 9 rounds.

### 4.3 Level 3: "First sounds" (12 rounds; set 1 shown)

Look: golden late afternoon, two lit lanterns (`prop_lantern`) on the platform, blue-and-white train, soft green rug. The train rolls in with friends aboard and empty carriages.

| Round | Friend at the station | On the rug (new ones tumble from the trunk) | Voice | Solution | What is new |
|---|---|---|---|---|---|
| 1 | A (tap A to hear it) | apple, ball | "A, a, a!" "Who starts like this?" | apple | Sound, two choices |
| 2 | B (tap) | ball (stayed), moon | "B, b, b!" | ball | The one left behind is now the answer |
| 3 | M (tap) | moon, sock | "Mmm!" | moon | |
| 4 | S (tap) | sock, ant | "Sss!" | sock | |
| 5 | A (train rolls back three; A speaks by itself) | ant, banana, milk | "A, a, a!" | ant | Three choices |
| 6 | B | banana, milk, sun | "B, b, b!" | banana | |
| 7 | M | milk, sun, alligator | "Mmm!" | milk | |
| 8 | S | sun, alligator, bear | "Sss!" | sun | |
| 9 | M and S | alligator, bear stay; monkey tumbles out | "Mmm... monkey!" | drag monkey to M | Sound to letter |
| 10 | M and S | snail tumbles out | "Sss... snail!" | drag snail to S | |
| 11 | A and B (train rolls back two) | alligator | "A, a, a... alligator!" (on pick-up) | drag to A | |
| 12 | A and B | bear | "B, b, b... bear!" (on pick-up) | drag to B | |

In rounds 9 to 12 only the named thing can be picked up; the others on the rug are still tappable to hear.

Generator rule: pass 1 (two choices) takes each letter's t1 in train order, the distractor being the next round's target (the last round borrows the first letter's t2). Pass 2 (three choices) takes each letter's t2, distractors being the next two targets. Pass 3 (sound to letter, pairs L3+L4 then L1+L2) places every thing still unplaced. Two-thing letters give a 10 or 11 round level. The set tables guarantee the distractor's first sound is far from the target's.

---

## 5. Satisfaction beats and the ending

1. **Opening the trunk.** Her tap, a held breath (`beat`), the lid, then real tumbling toys, each with one thud. The four opening variants keep it fresh.
2. **Naming.** Every tap on a thing gets an immediate, warm, single word and a small move. This is the Peekaboo Barn loop and it never runs out.
3. **Packing.** Grab feel, the flap that lowers for her, the clonk on the seat, and a note that climbs with each thing, reaching the top tonic on the last thing of the level.
4. **The train moving because she finished.** One chuff, wheels turn, the next carriage arrives. The loaded carriage is still visible.
5. **The letter looks pleased.** The only praise is the friend's `joy` face and Pip's nod.

**"Look what you made" (all levels).** When the last thing is aboard:
- `onFinale()`: flaps close, friends turn to the camera, voice "All aboard!" (once).
- `showOff()`: camera glides back over 0.9 s to frame the whole train (engine plus four carriages) while effects hush.
- Admire (6 s, `admireTime = 6`): everything is pokeable. Things say their names (Level 3: "Mmm... moon!"), animals give their call, friends say their name or sound. Poking the **engine**: one soft toot, the wheels turn and the train creeps 0.4 units forward and back over 1.5 s. Nothing moves unless she pokes it.
- Photo, sticker, home. `creationView()` = the whole-train framing; `creationObjects()` = the 12 things, the 4 friends and the engine. No rain of confetti needed beyond the engine default; `finaleRain = false` is recommended because the train is the picture.

The gallery photo is a train of four letters with her things in it, different for every set.

---

## 6. Characters and staging

### 6.1 Layout (world units, ground y = 0, camera looks toward −z; tune in `qa-shots`)

- **Track**: along x at z = −1.6. The train heads **left**, so carriages read left to right in alphabet-set order and new carriages arrive from the right.
- **Carriage**: 2.0 long, 1.2 deep, pitch 2.2. Front half is the cargo bay (floor y = 0.45, three seats 0.6 apart, a front flap 0.3 high hinged at the bottom edge). Back half is a raised rear deck (y = 1.0) where the friend stands, so the whole letter is visible above the cargo. A small plate on the flap shows the lowercase letter.
- **Station position**: the active single carriage is centred at x = −0.6. Pairs are centred on x = −0.6; three and four carriages are centred on x = 0 with a wider camera.
- **Rug**: centre (0, 0, +0.9), spots at x = −1.0, 0, +1.0.
- **Trunk**: (3.0, 0, +0.5), turned 20 degrees toward the rug, mouth 1.0 wide.
- **Pip** (the station porter, small cap): (3.9, 0, −0.3), behind and to the right of the trunk. Pip only watches, nods, and plants pennants.
- **Friend on the platform** (Level 1 Meet): enters at x = 5 on the line z = −0.5 (behind the trunk), stops at (1.3, 0, −0.5), to the right of the active carriage.
- **Sizes**: friend 1.2 tall; things 0.8 on the rug and 0.55 on a seat (they ease smaller during the arc to the seat, which reads as distance); trunk 1.0 tall closed.

### 6.2 Camera per moment

| Moment | Framing |
|---|---|
| Level 1 Meet | Trunk, rug and friend fill the width; the carriage is visible behind. Rug things at 40 to 50% of the screen height band. Suggested look (1.0, 0.7, 0.2), distance 8, elevation 24 degrees |
| Level 1 All aboard, Level 3 rounds 1 to 8 | Glide 0.8 s left: rug and the one carriage. Look (−0.3, 0.9, −0.3), distance 7.5 |
| Two carriages | Look (−0.4, 0.9, −0.3), distance 8.5 |
| Three carriages | Look (0, 0.9, −0.3), distance 10 |
| Four carriages, finale | Look (−0.8, 1.0, −0.6), distance 13 (engine included) |
| Trunk opening | No cut. A 0.5 s ease 10% closer toward the trunk during the `beat`, back out as the last thing lands |

### 6.3 Keeping targets unblocked

- Friends on the train stand on the rear deck, behind and above the cargo bay: they can never cover a seat or the flap.
- On the platform the friend stands behind the rug line and to the right of the carriage, never between the rug and the carriage.
- Pip stays behind the trunk at all times. When planting a pennant Pip walks along z = −0.5 and the pennant goes on the rear corner post.
- Drag zones are the cargo bays (radius 1.1 each, centres 2.2 apart, so they never overlap). Tap targets on friends are the letter's bounding box grown by 20%.
- Things on the rug are 1.0 apart with hit radius 0.5.
- No teleporting: friends, things, the train and Pip always move along the ground or on an arc at walking pace. The train enters and leaves the frame by rolling.

---

## 7. Assets

### 7.1 Blender models

**Stage and train (new unless noted)**

| Kind | Description |
|---|---|
| `prop_lt_carriage` | Chunky wooden toy carriage as in 6.1: cargo bay, rear deck, four fat wheels (bone or separate layer so they turn), corner post for a pennant, buffers. Flap is a separate piece `prop_lt_flap` (hinges in code). Painted from a base colour so one model gives all liveries. 2,500 tris |
| `prop_engine` | Existing. Check its scale and coupling height against the new carriage; repaint per level in code |
| `prop_track` | Existing, tiled along x |
| `prop_lt_trunk`, `prop_lt_trunklid` | Rounded travel trunk with corner caps, two straps, luggage stickers (a star, a heart); lid with a round knob handle. Dark inside so nothing shows before it comes out |
| `prop_lt_platform` | Low wooden station platform with a rounded front edge, 11 wide, 4 deep |
| `prop_lt_rug` | Oval rug with a border; colours set per level |
| `prop_lt_sign` | Small station sign on two posts at the back right (canvas texture shows the set's four letters) |
| `prop_pennant`, `prop_lantern`, `prop_scene_cloud`, `prop_scene_tree` | Existing: pennants, Level 3 lanterns, backdrop |

**Letter friends: `prop_lt_A` to `prop_lt_Z` (26 new, one script)**

- Capital letters as fat rounded tubes along the stroke centre lines from `bricks-letters.js` (port the A to T tables to Python and add U to Z), cross-section about 0.30 wide, flattened to 0.6 in depth, with a slightly flat base so it stands. 1.2 tall. One script loops over the table.
- Two small rounded shoes as a separate layer (code animates the waddle: rock ±6 degrees, shoes alternate). No rig.
- Face is the engine's code face (`makeFace`), placed per letter from an anchor table in data (the widest solid part: the bowl of B, the crossbar zone of A, the top of S). Eyes must sit fully on the letter, checked for all 26.
- Colour: the five vowels coral red; consonants cycle through blue, green, orange, purple, teal so no two letters in a set match.
- Budget 1,500 tris each.

**Things: reuse (50)**

| Letter | Things and model |
|---|---|
| A | apple `prop_word_apple` |
| B | ball `prop_word_ball`, banana `prop_m_banana`, bear (creature) |
| C | cat (creature), car `prop_m_car`, cup `prop_m_cup` |
| D | duck (creature), donut `prop_m_donut` |
| E | egg `prop_word_egg`, elephant (creature) |
| F | fish `prop_fish`, frog (creature), flower `prop_m_flower` |
| G | grapes `prop_word_grapes`, glasses `prop_m_glasses` |
| H | hat `prop_hat`, horse (creature), house `prop_m_cottage` |
| I | ice cream `prop_word_icecream` (name only) |
| J | jellyfish `prop_word_jellyfish`, jar `prop_jar` |
| K | kite `prop_word_kite`, key `prop_sinkkey` |
| L | leaf `prop_word_leaf`, lemon `prop_m_lemon`, ladybug `prop_m_ladybug` |
| M | moon `prop_word_moon`, monkey (creature), milk `prop_k_milk` |
| N | nest `prop_word_nest` |
| O | orange `prop_m_orange`, owl `prop_word_owl` (name only) |
| P | pig (creature), pear `prop_m_pear`, pumpkin `prop_m_pumpkin` |
| R | rabbit (creature `bunny`), rainbow `prop_rainbow`, rock `prop_rock` |
| S | sun `prop_word_sun`, sock `prop_farmsock`, snail `prop_farmsnail` |
| T | tomato `prop_ck_tomato`, teacup `prop_teacup` |
| U | umbrella `prop_umbrella` |
| V | vegetables: a `prop_woodbowl` holding `prop_carrot`, `prop_k_broccoli`, `prop_ck_tomato` (assembled in code) |
| W | watermelon `prop_m_watermelon`, worm `prop_m_worm`, window `prop_window` |
| Y | yogurt `prop_k_yogurt` |

Every reused model must be checked at 0.8 and 0.55 scale in the viewer; several were made as scenery and may need a cleaner small-size silhouette.

**Things: new (24), in build order**

| Pack | Kinds |
|---|---|
| 1 (sets 1 to 3) | `prop_lt_ant` (three round segments, six short legs, big eyes), `prop_lt_alligator` (short, fat, smiling, toy-like), `prop_lt_dog` (sitting puppy, floppy ears), `prop_lt_turtle`, `prop_lt_goat` |
| 2 (sets 4 and 5) | `prop_lt_noodles` (bowl with a swirl of noodles), `prop_lt_net` (butterfly net), `prop_lt_envelope` (with a heart seal), `prop_lt_juice` (carton with a straw), `prop_lt_kangaroo`, `prop_lt_octopus`, `prop_lt_zebra` (the horse recipe with stripes and a short mane), `prop_lt_zip` (a chunky zip, half open) |
| 3 (sets 6 and 7) | `prop_lt_igloo`, `prop_lt_insect` (a green beetle; must not read as the ladybug), `prop_lt_van`, `prop_lt_vase` (with one flower), `prop_lt_yoyo`, `prop_lt_yarn` (ball of wool with a loose end), `prop_lt_underpants` (spotty), `prop_lt_queen` (round little queen with a crown and a robe), `prop_lt_quilt` (folded patchwork), `prop_lt_xylophone` (five coloured bars and a beater), `prop_lt_xray` (a card showing a fish skeleton) |

The new animals are static toy figures (props with a code face where it helps), not rigged creatures, so they tumble like toys. The game ships with pack 1 alone (sets 1 to 3); a set whose models are missing is skipped by the rotation.

### 7.2 Sounds

| Sound | Source | When |
|---|---|---|
| Latch click | CC0 wooden latch, or `sfx.tick` pitched down | Trunk lid opens |
| Landing thud | Existing physics landing sound | Each thing lands on the rug |
| Clonk + `sfx.step(i, n)` | CC0 wooden block on wood, layered with the step note as one event | A thing lands on its seat |
| `sfx.nope` | Existing | Wrong carriage or wrong thing |
| Chuff | Synthesised: one soft filtered noise puff, 0.4 s | The train starts to roll (one per move, not per wheel turn) |
| Toot | Synthesised: two soft sine notes a fifth apart, 0.5 s, in the world key | Engine poked in the finale only |
| Animal calls | Existing `sfx.*` | Finale pokes only |
| Music | The world's existing loop | Throughout |

No sounds on waddling, on flaps, on idle bobs, or on taps (the voice is the tap's sound).

### 7.3 Words: request to `docs/design/VOCAB.md`

Rules this game needs from the shared list: concrete, picturable nouns a 2-year-old meets; the first sound is the letter's primary sound (short vowels, hard c and g); no digraph starts (sh, ch, th, wh, ph, kn) and no tr or dr; at least two such words per letter.

| Letter | Things (in order t1, t2, t3) | Alternates if VOCAB.md prefers | Flag |
|---|---|---|---|
| A | apple, ant, alligator | astronaut | needs ant, alligator |
| B | ball, banana, bear | bee, boat, bus, bed, bucket | |
| C | cat, car, cup | cow, carrot, cookie, cake | hard c only |
| D | duck, dog, donut | door, doll, dinosaur | needs dog |
| E | egg, elephant, envelope | elbow, engine | needs envelope |
| F | fish, frog, flower | fox, fork, feather | |
| G | grapes, goat, glasses | gift, gate, guitar | needs goat; never giraffe |
| H | hat, horse, house | hen, hedgehog, hand, heart | |
| I | igloo, insect, ice cream (name only) | ink, iguana | **needs extra words**: igloo, insect |
| J | jellyfish, jar, juice | jug, jam, jacket | needs juice |
| K | kite, key, kangaroo | kettle, king, kiwi | needs kangaroo |
| L | leaf, lemon, ladybug | lion, lamp, log | "ladybird" also starts with L |
| M | moon, monkey, milk | mouse, mushroom, mug | |
| N | nest, noodles, net | nose, nut, nine | **needs extra words**: noodles, net |
| O | octopus, orange, owl (name only) | otter, ostrich, olive | **needs extra words**: octopus; a third short-o word would be welcome |
| P | pig, pear, pumpkin | pea, pot, pizza, penguin | |
| Q | queen, quilt | question mark | **needs extra words**: both; two things only |
| R | rabbit, rainbow, rock | rocket, ring, robot, rose | |
| S | sun, sock, snail | spoon, star, sandwich, spider | never sheep, shell, shoe |
| T | tomato, teacup, turtle | tiger, table, towel, tent | never tree, train |
| U | umbrella, underpants | up, under | **needs extra words**: underpants; two things only |
| V | van, vase, vegetables | violin, vest, volcano | **needs extra words**: all three |
| W | watermelon, worm, window | web, wall, watch | never whale, wheel |
| X | xylophone, x-ray (both name only) | (fox, box as "X at the end" if the list prefers) | **needs extra words**; never in Level 3 |
| Y | yogurt, yo-yo, yarn | yak, yacht | **needs extra words**: yo-yo, yarn |
| Z | zebra, zip | zoo, zero, zigzag | **needs extra words**: both; two things only |

74 words. If VOCAB.md settles on different words, it wins wherever its words meet the rules above; the round generators only need t1 to t3 per letter.

### 7.4 Voice lines (Sulafat), exact captions

Lines marked with a spoken form need the caption and the text sent to the voice generator to differ (section 8.1). All 74 word lines and all letter lines are new; none exists in `app/assets/voice` today.

**Instructions (13)**
```
All aboard the letter train!
Tap the trunk!
Knock, knock, knock!
Lift the lid!
Peekaboo! Who is it?
Tap them!
All aboard!
Put it on the train!
Tap the letter!
Who starts like this?
Which letter?
Try the other one!
Listen!
```

**Letter by letter (templates; one line per letter)**
```
"<L> goes too!"      26 lines: A goes too!  B goes too!  ...  Z goes too!
"Where is <L>?"      26 lines: Where is A?  Where is B?  ...  Where is Z?
"Tap <L>!"           24 lines (the Level 3 letters: all except Q and X)
```

**Letter names (26).** Caption, then spoken form:
```
A!  (ay)      B!  (bee)     C!  (see)     D!  (dee)     E!  (ee)      F!  (eff)     G!  (jee)
H!  (aitch)   I!  (eye)     J!  (jay)     K!  (kay)     L!  (el)      M!  (em)      N!  (en)
O!  (oh)      P!  (pee)     Q!  (cue)     R!  (ar)      S!  (ess)     T!  (tee)     U!  (you)
V!  (vee)     W!  (double-you)   X!  (ex)   Y!  (why)   Z!  (zed; "zee" if the family is American)
```

**Letter sounds (24, no Q or X).** Caption, then what must be heard (the pure sound, no added "uh"):
```
A, a, a!   short a as in apple, three times        Nnn!       held n
B, b, b!   b as in ball, three short               O, o, o!   short o as in octopus
C, c, c!   k sound as in cat                       P, p, p!   p as in pig, whispered
D, d, d!   d as in duck                            Rrr!       held r
E, e, e!   short e as in egg                       Sss!       held s
Fff!       held f                                  T, t, t!   t as in tap, whispered
G, g, g!   hard g as in goat                       U, u, u!   short u as in umbrella
H, h, h!   breathy h                               Vvv!       held v
I, i, i!   short i as in igloo                     W, w, w!   w as in worm
J, j, j!   j as in jar                             Y, y, y!   y as in yo-yo
K, k, k!   k as in kite                            Zzz!       held z
Lll!       held l                                  Mmm!       held m
```

**Words (74).** Each is one line, the word with an exclamation mark:
```
Apple! Ant! Alligator! Ball! Banana! Bear! Cat! Car! Cup! Duck! Dog! Donut! Egg! Elephant! Envelope!
Fish! Frog! Flower! Grapes! Goat! Glasses! Hat! Horse! House! Igloo! Insect! Ice cream! Jellyfish! Jar! Juice!
Kite! Key! Kangaroo! Leaf! Lemon! Ladybug! Moon! Monkey! Milk! Nest! Noodles! Net! Octopus! Orange! Owl!
Pig! Pear! Pumpkin! Queen! Quilt! Rabbit! Rainbow! Rock! Sun! Sock! Snail! Tomato! Teacup! Turtle!
Umbrella! Underpants! Van! Vase! Vegetables! Watermelon! Worm! Window! Xylophone! X-ray!
Yogurt! Yo-yo! Yarn! Zebra! Zip!
```
("Frog!" already exists as a clip and is reused.)

**Sound plus word (68, Level 3).** Template `<sound caption without "!">... <word>!`, one per first-sound thing of the 24 Level 3 letters:
```
A, a, a... apple!   A, a, a... ant!   A, a, a... alligator!
B, b, b... ball!   B, b, b... banana!   B, b, b... bear!
C, c, c... cat!   C, c, c... car!   C, c, c... cup!
D, d, d... duck!   D, d, d... dog!   D, d, d... donut!
E, e, e... egg!   E, e, e... elephant!   E, e, e... envelope!
Fff... fish!   Fff... frog!   Fff... flower!
G, g, g... grapes!   G, g, g... goat!   G, g, g... glasses!
H, h, h... hat!   H, h, h... horse!   H, h, h... house!
I, i, i... igloo!   I, i, i... insect!
J, j, j... jellyfish!   J, j, j... jar!   J, j, j... juice!
K, k, k... kite!   K, k, k... key!   K, k, k... kangaroo!
Lll... leaf!   Lll... lemon!   Lll... ladybug!
Mmm... moon!   Mmm... monkey!   Mmm... milk!
Nnn... nest!   Nnn... noodles!   Nnn... net!
O, o, o... octopus!   O, o, o... orange!
P, p, p... pig!   P, p, p... pear!   P, p, p... pumpkin!
Rrr... rabbit!   Rrr... rainbow!   Rrr... rock!
Sss... sun!   Sss... sock!   Sss... snail!
T, t, t... tomato!   T, t, t... teacup!   T, t, t... turtle!
U, u, u... umbrella!   U, u, u... underpants!
Vvv... van!   Vvv... vase!   Vvv... vegetables!
W, w, w... watermelon!   W, w, w... worm!   W, w, w... window!
Y, y, y... yogurt!   Y, y, y... yo-yo!   Y, y, y... yarn!
Zzz... zebra!   Zzz... zip!
```

Total: about 281 lines. Levels 1 and 2 for sets 1 to 3 need only 13 + 12 names + 36 words + 24 templated = 85, so the voice work can follow the model packs.

---

## 8. Technical notes and risks

### 8.1 Engine and tool requests (small, outside this game's files)

1. **`say(text, { repeat: true })`**: bypass the "same line at most once per 30 s" rule for speech the child asked for by tapping. Needed for tap-to-hear and for the recap chain. The game enforces its own 1.5 s gap per word. Without it the game still works but re-taps are caption only, which defeats the vocabulary loop.
2. **Voice generator: spoken form differs from caption.** Let `tools/voice/gen.py` accept `caption => spoken text / style note` lines. The index key stays the caption. Needed for letter names (so "A!" is not read "ah") and for all letter sounds.
3. **Strokes for U to Z** in the letter table (shared benefit: Brick letters could later go to Z).

### 8.2 Physics

- Trunk: static box colliders for the walls, none for the mouth. Things are created inside only at the moment they leave (never 3 bodies overlapping in the trunk).
- Props leave with `physics.toss(obj, rugSpot, { arc: 1.3, spin: 1 })` and tumble on convex hulls. After landing, wait until slow or 0.8 s at most, then remove the body and ease position and rotation to the spot, upright, facing the camera (0.4 s). From then on rug things are kinematic, so nothing rolls away or gets knocked.
- Round things (ball, orange, tomato, yarn, yo-yo): high angular damping during the toss.
- Animals leave with `toss(..., { spin: 0 })` and rotation locked (`rot: [false, true, false]`), so they land on their feet with the landing squash.
- Seats: no physics. The drop is a tweened arc to the seat; the thing is then parented to the carriage, so it rides rigidly when the train moves. This is what guarantees no jitter and no clipping in a moving vehicle.
- The train is one group moved by a tween; wheels rotate by distance / radius.

### 8.3 Faking things

- **Waddle**: friend rocks about its base, shoes alternate, position moves at 1.8 units/s. Climbing aboard is a ground walk to the flap, then a two-step arc onto the deck.
- **Speaking mouth**: swap the code face between `happy` and `joy` on the clip's start and end (as Candy beats does). For held sounds (m, s, f, l, n, r, v, z) add a 3 degree, 12 Hz body shiver for the clip's length; for stop sounds three small forward nods.
- **Lowercase plate and station sign**: canvas textures. Draw lowercase from a small polyline table (single-storey a and g) rather than a system font, so it looks the same on every machine.
- **Lid drag (variant 3)**: hinge angle = clamp((fingerY − lidY) / 1.2) × 100 degrees; monotonic (it never closes again), so a wobbly drag still makes progress.
- **Peekaboo (variant 4)**: the peeking thing is a visual only, clipped by the trunk's front wall being in front of it; it must be fully inside the trunk's silhouette except above the rim.

### 8.4 Risks and how to avoid them

| Risk | Mitigation |
|---|---|
| The voice reads letter sounds as letter names or adds "uh" ("buh") | Spoken-form override plus a style note per line; a person listens to all 24 sounds and 68 sound-plus-word clips before ship. Fallback: cut the onset from the word's own clip with ffmpeg and repeat it. Stop sounds are the hard ones: if p, t, k cannot be made clean, play the onset twice then the word |
| Too hard for age 2 | Every level is errorless by the second try; Level 1 has no wrong answers at all; parent picks the level. Level 3 is exposure: success there means she enjoyed hearing the sounds |
| 50 new models is a lot | Three packs; ship pack 1. Letter friends are one script. New animals are static toys, not rigs |
| A thing lands on another or on the friend | One at a time, 0.9 s apart, fixed spots 1.0 apart, friend at z = −0.5 behind the rug, play-pen walls, ease-to-spot after 0.8 s |
| Friend's face lands on a thin stroke (I, L, T, J) | Per-letter face anchor and scale table; thin letters get a slightly wider stem (0.36) and smaller face. Review all 26 in the viewer |
| Scenery-scale models look wrong small (house, window, rainbow) | Viewer check at 0.55; substitute an alternate word from 7.3 rather than ship a poor silhouette |
| Voice pile-up when she taps quickly | Taps while a word is playing re-trigger the show only; the word is queued once at most (latest wins) |
| Mashing the trunk | Taps during the tumble are ignored; variant 2 accepts one knock per 0.9 s |
| Four carriages make targets small | Bay drag radius 1.1 regardless of zoom; four-carriage rounds are only the last two of Level 2 |
| Long rollbacks feel slow | Roll at most three carriages in 2.6 s; she can poke things on the rug meanwhile |
| "Zed" versus "zee", "ladybug" versus "ladybird" | Ask the parent once; record both only if wanted |

### 8.5 Hooks

- `showHint(glow)`: the right demo for the current step (tap trunk, tap the next unheard thing, drag thing to bay, drag handle, tap friend). Shown the first time each action appears and again after about 8 s stuck.
- `nudgeTarget()`: the trunk, the next unheard thing, the thing to drag, or the right friend, according to the step.
- Autoplay: expose the current step's target and destination so `tools/autoplay.js` can tap or drag it.
- New captions go in `tools/voice/new-lines.txt` in the caption form.

---

## 9. Acceptance criteria

**Learning**
1. Every thing's spoken name starts with its carriage's letter; in Level 3 every thing used starts with that letter's primary sound, and no round pairs sounds from the forbidden list in 4.0.
2. Tapping any thing, at any time including the finale, speaks its name within 0.3 s; tapping any friend speaks its name (Levels 1, 2) or sound (Level 3).
3. A listener who cannot see the screen can tell every one of the 24 letter sounds apart from the letter's name, and hears no added vowel on stop sounds.
4. Level 1 cannot be failed. In Levels 2 and 3 the second attempt in a round always has only the right target available or highlighted.

**Feel**
5. No sound plays on idle animation, waddling, flaps or taps; never more than one effect per child action; no boing anywhere; no confetti before the finale.
6. Each new action (tap trunk, tap thing, drag to carriage, knock, lift lid, peek tap, drag friend, tap friend) gets a slow hand demo the first time and again after about 8 s of no progress; a Go badge follows every voiced instruction.
7. At least 1 s of stillness after every success; no automatic movement shorter than 0.5 s; the train never moves faster than 2 units/s.
8. An instruction is voiced at most once per round; praise is never voiced.

**Polish**
9. In `qa-shots` at every round of every level for set 1: no object intersects another (things in the trunk mouth, things on seats, friend on the deck, flap against things, Pip against the trunk), nothing floats, nothing sinks into the rug or platform.
10. Nothing appears or disappears in view: friends walk in, the train rolls in, things come out of the trunk. Nothing the child placed is ever removed.
11. No friend, Pip or prop overlaps a seat, a flap, a rug thing or the trunk on screen at any camera position used.
12. The active things fill 40 to 60% of the screen height band in single-carriage views; the wide view is used only for the Level 2 and 3 arrival and the finale.
13. All 26 letter friends read instantly as their letter in the viewer, with the whole face on the letter, and match the Brick letters shapes.

**Structure**
14. Level 1 has 4 rounds (one tap and three drags each), Level 2 has 6, Level 3 has 6, one action per round; finishing a level brings the next letter set.
15. The three levels differ at a glance (sky, train livery, rug) and in task (meet and pack, sort to a letter, listen for a sound).
16. The finale shows the whole train with every thing in the right carriage; every thing, friend and the engine respond to pokes; nothing moves unless poked; the photo appears in the home gallery.
17. Runs at a steady frame rate on the target laptop with 12 things, 4 friends and the train on screen; one level takes 1 to 1.5 minutes.
