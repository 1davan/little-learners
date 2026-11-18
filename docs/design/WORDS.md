# 🗣️ Word world (`words`): design

A vocabulary game for a bright 2-year-old, built on about 300 first words. Written against `docs/design/BRIEF.md`.

**Status of the word list.** `docs/design/WORDS.md` was not written yet when this was designed. Section 7.5 contains a complete proposed list (300 words, with the exact voice lines, model and reaction for each), organised into the brief's nine categories. When `WORDS.md` lands, it wins on which words exist and how they are spelt; section 8.7 says how to reconcile. Nothing else in this design depends on the exact words.

---

## 1. The pitch

**She walks Pip through tiny storybook places (a farmyard, a kitchen table, a bathroom, a street). Everything she taps comes alive and says its name. Then Pip asks "Where's the cup?" and her tap takes its photo. The photos go into her own word book, which fills up over weeks.**

Six things per visit, never more. The game remembers every word she has met and brings each one back just as she is about to forget it.

| Reference | What we take | What we leave |
|---|---|---|
| **Peekaboo Barn** (Night & Day) | One thing, one clear name, one small reaction. A 1–2-year-old can play it alone. | Its fixed order: ours adapts to what she knows. |
| **Sago Mini World** | Tapping anything in a scene gives a small, charming, in-character reaction. Nothing fails. | Busy screens: we show 3 things at a time. |
| **Endless Alphabet** (Originator) | A word is a little character with one memorable behaviour of its own. | Letters and spelling. |
| **Pok Pok** | Calm; almost silent; the toy does not perform at the child. | Fully open-ended play: we add a gentle question. |
| **Busy Shapes / Edoki** | The game quietly adapts to the child: easier after misses, harder after a streak. | |
| **Toca Boca** | What she made stays: the word book is hers and persists. | |
| **Khan Academy Kids** | A real curriculum behind the play: a fixed word list, spaced review, a parent view. | Reward animations. |

Three things from early-language research shape the rules (they are why the game is built this way):
1. **Contingent labelling.** A word sticks best when the name arrives the moment she touches the thing. So every tap names; even a wrong tap in a finding round names what she touched.
2. **Fast mapping by exclusion.** Shown one thing she knows and one she does not, a toddler picks the new thing for a new word. Level 1 pairs each new word with a familiar one, so her first try at a new word is usually right.
3. **Spaced retrieval beats repetition.** Each new word is met, then found a minute later, then named again at the book, then brought back at widening gaps (about 1, 1, 2, 3 and 5 weeks).

---

## 2. Learning goals

| Topic id | Name | What she does here |
|---|---|---|
| `mt_NP101Zl-4g` | Using New Vocabulary | Meets about 300 everyday nouns, 2–4 new ones per visit, each heard in isolation and in a tiny phrase. |
| `mt_6-MYToNZ39` | Discussing and Questioning New Words | Links a new word to known ones (found beside familiar things; second tap gives a phrase about it). |
| `mt_mB7DVai-Uf` | Listening and responding | Hears "Where's the cup?" and answers by touching it (2 choices, then 3). |
| `mt_6lHBTwQPrS` | Question Words | Answers a "where" question. |
| `mt_yBJyCfhtem` | Basic Nouns & Verbs | Nouns from every tap; verbs and sounds from the second-tap phrases ("Sip, sip, sip!"). |
| `mt_oL9s_bufDp` | Sorting & Categorising Words | Level 3: animals, food, toys, clothes and things that go, each to its own home. |
| `mt_xppl18avyY` | Sorting into categories | Level 3: the same action seen from the maths side. |
| `mt_zVLOm6U7bh` | Naming Common Animals | The Animals place (40 words). |
| `mt_83gRQ9OPkc` | Body Parts & Senses | The Me place (24 words). |

`meta.js` entry: `topics` = the first, third and sixth rows (the three that hold for every visit); the rest go in a comment. `goal`: "Touches the named thing out of 2, then 3; meets about 300 first words over many visits; sorts things into groups."

---

## 3. The core loop, moment by moment

### 3.1 Words the design uses

- **Place:** one of nine themed sets (Animals, Food, Playroom, Clothes, Me, Home, Things that go, Outside, People).
- **Nook:** a small corner of a place with exactly three **slots** in a row (left, middle, right). A place has 2–5 nooks; a visit uses two of them, side by side: **nook A** then **nook B**.
- **Thing:** the model standing in a slot. Six things per visit.
- **Name line / about line / where line:** the three voice lines every word has ("A cup!" / "Sip, sip, sip!" / "Where's the cup?").
- **Visit:** one play of the game (one level run), 3.5–5 minutes.

### 3.2 A visit, in order

| Phase | What happens | Levels |
|---|---|---|
| 0. Arrive | The scene is already built. The camera starts close on nook A. Pip is sitting on the back ledge. | all |
| 1. Meet | She taps the three things in nook A, then the three in nook B. Each reacts and says its name. | all |
| 2. Find | "Where's the cup?" Her tap on the right thing takes its photo; the photo goes on the line. Nook B first (the camera is already there), then back to nook A. | L1: 6 rounds of 2 choices. L2: 8 rounds of 3. L3: 4 rounds of 3. |
| 3. Tidy | A toy train brings three toys at a time; she drags each to its home. | L3 only |
| 4. Book | She taps each photo on the line and it flies into its place in the word book. Then the engine's finale. | all |

### 3.3 Arrive (about 4 s)

1. Fade in on nook A in the **trio view** (all three things, section 6.3). Nothing moves for 0.8 s.
2. Pip, on the ledge behind the things, turns to the child and waves once. Voice: the place line, for example **"Let's go to the farm!"**
3. The three things each have a pale cream ring on the ground under them (0.9 radius, 35% opacity, slow 3 s pulse) and breathe 3% in scale. This is the only "tap me" signal. No arrows, no sparkle.
4. First visit ever (and whenever she has been stuck 12 s): a slow ghost hand (`fx.ghostHand`) floats to the middle thing and taps it. The thing really reacts and says its name, exactly as if she had tapped. Then the "Go!" badge.

### 3.4 Meet: tapping a thing

One tap, one response. The response has three parts that start together.

| Part | Exactly what |
|---|---|
| Under the finger | The engine's press-in (0.94) and spring back. |
| The reaction | The word's own reaction from the library in section 8.3 (the cup tips as if drinking; the cow lowers its head and lifts it; the lamp lights; the ball rolls a quarter-turn and rolls back). 0.6–0.9 s, eased. While it plays, more taps on that thing only press it in. |
| The voice | **First tap and every odd tap: the name line** ("A cup!"). **Every even tap: the about line** ("Sip, sip, sip!"). Caption shown both times. |
| Sound | None on a name tap: the voice is the sound. On an about tap, about 45 words also play one soft signature sound (the cow's moo, the phone's ring, a splash); section 7.3. Never a boing. |
| Pip | Turns his head to the thing. Nothing else. |
| The ring | On the first tap the cream ring fades out over 0.5 s and the breathing stops. The thing is "met". It stays tappable for the whole visit. |

Rules:
- **She sets the pace.** There is no timer. When all three things in a nook are met and she has not touched the screen for 4 s, Pip hops along the ledge toward nook B (walking pace, 2.4 units/s), the camera glides with him (1.6 s), and the voice says **"Come and see!"** If she taps a nook-A thing during the glide, the glide finishes first; she cannot go back (nook A returns in the Find phase).
- **Mashing.** The same line is never spoken twice within 4 s: a repeat inside 4 s is caption-only. A new line waits for the current one to finish (engine rule). More than 3 taps in 1.2 s: reactions still play, no voice until she pauses for 0.6 s.
- **Stuck** (engine ladder): 6 s, one unmet thing does one silent look-at-me bob and the caption **"What's that?"** shows (voiced once per visit). 12 s, the ghost hand taps an unmet thing (it reacts and names itself). 20 s, errorless: the unmet things name themselves one at a time, 5 s apart, and count as met.
- **Recording:** every name line she hears for a word counts as one exposure (section 8.5). A word in box 0 moves to box 1 the moment it is met.

### 3.5 Find: "Where's the cup?"

Set-up, once, as the Find phase starts in nook B: Pip lifts the little camera that has been hanging round his neck all along. Voice: **"Let's take pictures!"** (1.2 s). The photo line (a string with six wooden pegs) is already hanging across the top of the backdrop, empty.

**One round:**

| t (s) | What happens |
|---|---|
| 0.0 | The camera glides (0.8 s) to frame the choices: a **pair view** on two neighbouring slots (L1) or the **trio view** (L2, L3). In a pair view the third thing is off-screen. |
| 0.8 | Voice: the where line, **"Where's the cup?"** The "Go!" badge shows after the line ends; taps before that only press things in. |
| | **She taps the right thing:** |
| +0.00 | `beat(thing, 0.35)`: it squashes 10% and holds; effects hush; music dips. Four thin white corner brackets (a viewfinder, in the scene, 1.1× the thing's size) close in around it. |
| +0.35 | One soft shutter click (`sfx.shutter`, at half volume). The brackets blink once and fade. The thing springs back and plays its reaction. Voice: the **name line** ("A cup!"). Pip nods once (`pipWatch`). |
| +0.9 | A photo card (white border, a picture of that exact thing on the place's pastel colour) slides up from behind the thing, 0.4 s. |
| +1.3 | The camera eases out to the trio view (0.8 s) while the card arcs up to the next free peg on the line. |
| +2.1 | The peg closes on it: `sfx.step(i, n)`, the level's rising note. The card swings twice (6°) and hangs still. |
| +2.1 to +3.1 | One second where nothing moves but breathing. Then the next round. |
| | **She taps the wrong thing:** |
| +0.0 | That thing presses in and gives a small, soft wobble (no sound). Voice, calmly: **its own name line** ("A spoon!"). She learns what she touched. No "no", no buzzer. |
| +1.4 | Voice again: **"Where's the cup?"** (this one repeat is spoken; any later repeats in the round are caption-only). Taps are ignored for 0.6 s after a wrong tap, so a mash cannot hit the answer by accident. |
| second wrong | Same, and the right thing gets the cream ring and a slow bob (`nudgeTarget`). |
| third wrong | Errorless: the other things turn dim (60% brightness) and stop answering; the ghost hand taps the right one. |
| | **She does nothing:** 6 s, the where line shows again (caption). 12 s, ring and ghost hand on the answer. 20 s, errorless. 45 s, home (engine). |

Only a first-try correct tap counts as "found" for the memory (section 8.5). Every round still ends with the photo, so every word always gets its picture.

If a word is found a second time in the same visit (the "again" rounds of Level 2), no second photo is taken: after the click a small gold star sticker floats from the thing onto its photo on the line (0.6 s) and the same peg note plays.

### 3.6 Tidy (Level 3 only): "Tidy-up time!"

1. After the last photo, voice: **"Tidy-up time!"** Pip hops along the ledge to the tidy rug to the right of nook B; the camera glides with him (1.8 s) to the **tidy view**. Two homes (or three, section 4.3) stand at the back of the rug with their fronts open and empty: for example the little barn and the picnic hamper.
2. Voice: **"Here comes the train!"** The wooden engine rolls in from the right along the track at the front of the rug (2.4 units/s, wheels turning, one soft toot when it stops). It pulls three flat carts. On each cart sits one toy: a small version (0.8 units) of a word she already knows, for example a cow, an apple and a pig.
3. First time ever (and when stuck 8 s): a slow ghost hand drags the first toy to its home (`fx.ghostPath`, drag mode). "Go!"
4. **She picks up a toy:** the engine's grab feel (squash and lift, quiet `sfx.pup`). Voice: its name line ("A cow!").
5. **She carries it near the right home** (within 1.2× the zone): that home's doors swing wider and the friend sign on its roof leans toward the toy (`onNear`). Near the wrong home: nothing opens.
6. **She drops it in the right home:** the engine's magnet and landing squash. The toy walks or slides onto the next free spot on the home's shelves, turns to face her, and plays its reaction once. One sound: `sfx.step(i, n)`. Voice, the first time for each home in a visit (caption-only after that): the home line, **"Animals go in the barn."** It stays there, visible, for the rest of the visit.
7. **Wrong home:** the home gives a small head-shake wobble (`redirect(line, { obj: home })`), the toy walks back to its cart on a 0.5 s arc (`autoHome`), caption and voice: **"Where do animals go?"** Second wrong: the right home's doors open wide and it gets the cream ring. Third: errorless (the wrong homes close their doors).
8. **Dropped on nothing:** it walks back to its cart. No sound, no line.
9. When all three carts are empty and 1 s has passed, the train rolls out to the right and comes back in with the next three toys (about 5 s for the round trip; the homes and their toys are what she looks at meanwhile).

### 3.7 Book: the word book

1. Pip hops to the easel that stands between the two nooks. The big closed book on it opens (hinged cover, 0.8 s). Camera: the **line view** (the photo line across the top, the book below it). Voice: **"Pop them in your book!"**
2. **She taps a photo on the line:** the peg opens, the card drops into the book on a 0.7 s arc and lands in **its own fixed place** on its nook's page (every word has one place for ever, like a sticker album). One soft paper pat (`sfx.pup`). Voice: the name line once more. This is the third time she has pulled that word out today.
3. If she waits 8 s, the remaining photos go on their own, one every 1.5 s, each named.
4. When the line is empty: the engine's finale (section 5.3).

---

## 4. Progression

The parent picks Level 1, 2 or 3 as for every game. The word memory is shared by all three levels. Which words appear is decided by the planner (section 8.6), so there are no fixed rounds to list; instead this section gives the exact round structure of each level, the rules that fill it, and fully worked examples.

### 4.1 Level 1: Meet and find (two choices). 12 rounds.

| Round | Where | Type | Choices (slots) | Target |
|---|---|---|---|---|
| 1–3 | nook A | Meet | all three | any order she likes |
| 4–6 | nook B | Meet | all three | any order |
| 7 | nook B | Find, pair | L + M | M |
| 8 | nook B | Find, pair | M + R | R |
| 9 | nook B | Find, pair | L + M | L |
| 10 | nook A | Find, pair | L + M | L |
| 11 | nook A | Find, pair | M + R | M |
| 12 | nook A | Find, pair | M + R | R |
| then | easel | Book | six photos | |

- Each word is the target exactly once. The target is on the right, right, left, left, left, right of its pair, so "always tap the right-hand one" does not work.
- **Words per visit:** 2 new + 4 she has met (when there are enough). The planner puts each nook's most familiar word in the middle slot, so every new word's first question is asked beside a word she knows.
- Slow and roomy: 1.2 s of stillness after each photo instead of 1.0.

**Worked example: the very first visit (Level 1, nothing met yet).** Place: Animals. Nook A, the farmyard: dog (L), cat (M), cow (R). Nook B, the garden: bird (L), bunny (M), bee (R). All six are top-of-list words she almost certainly knows, so the first visit is easy on purpose.

| Round | Voice | Framed | Right answer |
|---|---|---|---|
| 1–3 | "A cat!" "A dog!" "A cow!" as tapped | dog, cat, cow | |
| 4–6 | "A bunny!" "A bird!" "A bee!" as tapped | bird, bunny, bee | |
| 7 | "Where's the bunny?" | bird, bunny | bunny |
| 8 | "Where's the bee?" | bunny, bee | bee |
| 9 | "Where's the bird?" | bird, bunny | bird |
| 10 | "Where's the dog?" | dog, cat | dog |
| 11 | "Where's the cat?" | cat, cow | cat |
| 12 | "Where's the cow?" | cat, cow | cow |

**Worked example: a return visit (her 7th; Level 1).** Place: Home. Nook A, the kitchen table: spoon (L, met), cup (M, met), plate (R, **new**). Nook B, the bathroom: soap (L, met), bath (M, met), toothbrush (R, **new**). Round 8 asks "Where's the toothbrush?" beside the bath she knows; round 12 asks "Where's the plate?" beside the cup she knows.

### 4.2 Level 2: Find (three choices). 14 rounds.

| Round | Where | Type | Target |
|---|---|---|---|
| 1–3 | nook A | Meet | |
| 4–6 | nook B | Meet | |
| 7–9 | nook B | Find, trio | M, then L, then R |
| 10–12 | nook A | Find, trio | R, then L, then M |
| 13 | nook B | Find again, trio | the nook-B word she is least sure of |
| 14 | nook A | Find again, trio | the nook-A word she is least sure of |
| then | easel | Book | |

- **Words per visit:** 3 new + 3 met.
- All three things in the nook are choices, so two new words can stand side by side. The planner still never puts a clashing pair in one nook (mouth and lips, foot and toes, boat and ship; the `clash` lists in section 7.5).
- **"Least sure of"** for rounds 13–14: a word she missed this visit; if none, the newest word.
- **Listen rounds.** If the target has a signature sound (section 7.3), the sound plays first, then the where line: the moo, a breath, "Where's the cow?" At most two listen rounds per visit.
- Stillness after each photo: 1.0 s.

**Worked example (a later visit; Level 2).** Place: Food. Nook A, the fruit stall: banana (L, known), strawberry (M, met), pear (R, **new**). Nook B, the dinner table: milk (L, known), cheese (M, **new**), juice (R, **new**). Rounds 7–9: "Where's the cheese?", "Where's the milk?", "Where's the juice?" Rounds 10–12: "Where's the pear?", "Where's the banana?", "Where's the strawberry?" She tapped the milk when asked for the juice in round 9, so round 13 is "Where's the juice?" again; round 14 is the newest nook-A word, "Where's the pear?"

### 4.3 Level 3: Find and tidy. 16 rounds (19 at sort stage 3).

| Round | Where | Type | Detail |
|---|---|---|---|
| 1–3 | nook A | Meet | |
| 4–6 | nook B | Meet | |
| 7–8 | nook B | Find, trio | the two words in nook B she knows least |
| 9–10 | nook A | Find, trio | the two words in nook A she knows least |
| 11–13 | tidy rug | Sort, train load 1 | three toys |
| 14–16 | tidy rug | Sort, train load 2 | three toys |
| (17–19) | tidy rug | Sort, train load 3 | sort stage 3 only |
| then | easel | Book | four photos |

- **Words per visit:** 2 new + 4 met.
- **Sortable groups and their homes:** animals → the barn; food → the picnic hamper; toys → the toy box; clothes → the wardrobe; things that go → the garage. (Home things, Outside, Me and People are not sorted: "home things" is not a toddler's category, and people do not go in boxes.)
- **Which toys:** words she has met, best-known first, from the chosen groups; if a group has fewer than needed, the first words of its lists. A toy that could belong to both groups on show is never used (`sortClash`: teddy, doll and dinosaur are never sorted when the barn is on show; scooter never when the garage is).
- **Sort stages** (the stage is remembered between visits; it starts at 1):

| Stage | Homes | Group pairs | Loads (toys of group X / Y / Z) | Move up when |
|---|---|---|---|---|
| 1 | 2 | Very different: animals + food, animals + clothes, food + things that go, clothes + things that go | load 1: X, X, Y. load 2: Y, X, Y. | two visits with at least 5 of 6 right first time |
| 2 | 2 | Any pair, including toys + food, toys + clothes, animals + things that go | load 1: X, Y, X. load 2: Y, Y, X. | three visits with at least 5 of 6 |
| 3 | 3 | Any three | load 1: X, Y, Z. load 2: Z, X, Y. load 3: Y, Z, X. | (stays) |

 Two misses or more in a visit at stage 2 or 3: the next visit drops one stage.
- The first toy of the first load is always from the left-hand home's group and gets the hand demo (first time only).
- When today's place is one of the five sortable groups, it is always one of the homes.

**Worked example (Level 3, sort stage 1, place: Animals).** Homes: barn (left), hamper (right). Load 1: cow, pig, apple. Load 2: banana, duck, bread. End frame: three animals looking out of the barn, three foods in the hamper.

### 4.4 The long game: how 300 words rotate

Full rules in sections 8.5 and 8.6. In short:

- **Each word lives in a box, 0 to 5.** Box 0 = never met. Meeting it puts it in box 1. Finding it first try moves it up one box (at most one box per calendar day, because sleep is when words settle). Missing it moves it down one (never below 1).
- **It comes back** when it is due. Time is counted in **turns of its own place** (a place has a turn about once every six visits): a word in box 1 or 2 is due at the place's next turn, box 3 after 2 turns, box 4 after 3, box 5 after 5. At one visit a day that is roughly 1, 1, 2, 3 and 5 weeks.
- **The game chooses the place** for each visit, never the same place twice running. Two kinds of visit alternate in a fixed rhythm: **fresh, fresh, review**. A fresh visit goes to the place that has waited longest (places never visited come first). A review visit (visits 4, 7, 10, …) goes back to the place with the most young words (boxes 1 and 2) that are due, so brand-new words are seen again within about three visits. No place waits more than 14 visits.
- **New words arrive in list order** within each nook (the lists in section 7.5 run from the commonest first words to the rarer ones).
- **It adapts.** Under half right first time last visit: one fewer new word next time (never fewer than 1). Two visits running at 5 of 6 or better: one more (never more than 4).
- **How long it takes.** About 2.5 new words a visit. All 300 are met after about 120 visits: four months at one visit a day. A word reaches box 4 ("known") after being found first try on three different days.

**The first ten visits (Level 1, all answered right), as the planner produces them:**

| Visit | Place | Nook A (L, M, R) | Nook B (L, M, R) |
|---|---|---|---|
| 1 | Animals | dog, cat, cow | bird, bunny, bee |
| 2 | Home | cup, spoon, bowl | bath, soap, towel |
| 3 | Food | apple, banana, orange | milk, bread, egg |
| 4 (review) | Animals | cat, dog, **duck** | bunny, bird, **butterfly** |
| 5 | Playroom | ball, teddy, blocks | slide, swing, balloon |
| 6 | Things that go | car, bus, bike | train, plane, boat |
| 7 (review) | Home | spoon, cup, **plate** | soap, bath, **toothbrush** |
| 8 | Clothes | shoes, socks, boots | hat, bag, gloves |
| 9 | Me | nose, eyes, mouth | tummy, hands, arms |
| 10 (review) | Food | banana, apple, **strawberry** | bread, milk, **cheese** |

(A place's first visit is six top-of-list words; bold marks the new words on return visits. Outside and People have their first turns at visits 11 and 12, and visit 13 is a review.)

### 4.5 Variety: why no two rounds feel the same

- Six different things with six different reactions every visit, out of a library of 19 kinds.
- Nine places and 31 nooks, each with its own backdrop, ledge, light and ground. Two nooks per visit gives well over a hundred different stage pairings.
- The second tap always gives something new (the about line), so going back to a thing is rewarded.
- Things with a state keep it: the lamp she switched on is still on in the Find round; the fridge door she opened is closed again but the light inside the window stays warm. The scene shows where she has been.
- Find rounds alternate pair windows and target sides; Level 2 adds listen rounds; Level 3 adds the train.
- The word book page is different after every visit.

---

## 5. Satisfaction

### 5.1 Against the seven rules of `SATISFACTION.md`

| Rule | Here |
|---|---|
| The finger does it | Her tap is the thing's reaction, and in Find her tap is the camera shutter. In Tidy she carries the toy home. At the book she sends each photo in herself. |
| It changes and stays changed | Rings fade as things are met. Lamps stay lit. Photos stay on the line. Toys stay in their homes. Photos stay in the book for ever. |
| One thing grows all level | **The photo line**, from zero to six photos (four in Level 3, plus the homes filling). Across visits: **the word book**. |
| A beat before the release | 0.35 s squash, hush and viewfinder before every shutter click. |
| A character reacts, not the screen | The thing itself is the character: the cow moos, the cup sips. Pip only nods. No confetti in rounds. |
| Then nothing happens | 1.0–1.2 s of stillness after every photo and every sorted toy. |
| One soft sound per action | Name tap: the voice. Photo: one click, then the peg's note. Sort: one note. |

**Mute test:** things react, rings fade, photos collect. **End-frame test:** the open book with today's photos on its page.

### 5.2 Small beats to get right

1. The first tap on anything: the reaction must start within one frame of the touch.
2. The viewfinder brackets closing: this is the moment she learns "my tap takes the picture".
3. The photo sliding up really shows that thing, in the state she left it (lamp lit, fridge shut).
4. The peg notes climb all visit; the last photo lands on the top note.
5. Level 3: the home's doors opening wider as her toy comes near.
6. Each photo landing in its own place in the book, next to photos from other days.

### 5.3 The end: "Look what you made"

Engine sequence: `onFinale()` → `showOff()` → admire → photo → sticker → home.

- `onFinale()`: Pip, on the easel's top bar, looks down at the book and claps once. (Level 3: before the Book phase, a 2 s look at the full homes in the tidy view; Pip claps there instead.)
- `showOff()`: the camera glides (0.9 s) to the **book view**: the open spread fills 80% of the screen width. Left page: nook A's page. Right page: nook B's page. Each page has 12 fixed places in a 4 × 3 grid. Today's photos are there with every photo from earlier visits to those nooks; places not yet earned show a faint dotted square. Words in box 4 or 5 have a small gold star on the corner of their photo.
- Admire (at least 4 s; `creationObjects()` = every photo on the spread): poking a photo presses it, plays its note, and the voice says its name line. So the admire is also one more quiet review, of old words too.
- The engine's photo is this spread, so the home-screen gallery shows her latest word-book page.
- `quietEnding = false`, `finaleRain = false`: the one sticker, no rain. The reward is the book.
- `creationView()` returns the book view. `admireTime = 6`.

---

## 6. Characters and staging

### 6.1 Who is where

- **Pip** (guide, with a small camera on a neck strap): always on the **back ledge** of the nook, 1.5 units up and 1.6 units behind the slots, centred behind the gap between two slots, never behind a tall thing. He hops along the ledge to move. He never comes down to slot level, so he can never stand in front of a target. At the easel he sits on its top bar.
- **The things** never leave their slots. Animals and people turn their heads to follow her finger (the engine's look-at) but do not walk about.
- **Me place:** the three "slots" are three parts of one big friendly Monkey sitting facing her (section 8.4). Pip sits on a shelf to one side, above shoulder height.
- **People place:** each person is a member of the Bear family, standing in a slot.
- **Tidy rug:** the homes stand at the back; the train stops at the front; Pip sits on the back fence between the homes, above them.

### 6.2 The set (all distances in world units)

```
        ledge (y 1.5, z -1.6) ......Pip hops along here......................................
        backdrop (z -3)      [ nook A backdrop ]   easel+book   [ nook B backdrop ]   [ fence ]  homes (z -2.2)
        photo line (y 3.0, z -2.4) ---o---o---o---o---o---o---   (spans both nooks, pegs over each nook)
        slots (z 0)          L     M     R                       L     M     R          tidy rug
        x:                 -2.4    0    2.4        4.5          6.6    9   11.4          18 (L3 only)
        track (z +1.2)                                                             =====train=====
```

- Slot spacing 2.4. A thing fits a box 1.5 wide, 1.5 deep and 1.7 high above the ground, including its stand.
- **Size classes** (storybook scale, not real scale): **S** small things (cup, apple, sock) are scaled to 0.8 and stand on the nook's stand (a stool, crate, tuffet or shelf, top at y 0.75). **M** (teddy, dog, chair) are scaled to 1.2 and stand on the ground. **L** (bus, fridge, tree, cow) are scaled to 1.6 and stand on the ground. So a cup and a bus are both big, clear and easy to hit.
- **Sky nook** (sun, moon, cloud…): the three things hang at y 1.4 on thin stems rising from a hill, so they still sit in the same three slots and the same views work.
- Three photo pegs hang above each nook (six in all), so a photo's flight is short and stays in frame.

### 6.3 Camera

| View | Used for | Framing rule (check with `project()`) |
|---|---|---|
| Trio | Meet; Find with 3 choices; after each photo | The three slots span 80% of the screen width. Each thing is at least 28% of the screen height. The ledge, Pip and the photo pegs are in frame. |
| Pair | Find with 2 choices | Centred between two neighbouring slots. Each thing is at least 40% of the screen height. The third slot's thing is wholly off-screen. Pip's head is in frame above the gap. |
| Walk | Nook A → nook B → easel → tidy rug | A glide at Pip's pace; 1.6–1.8 s; never a cut. |
| Tidy | Level 3 sort | The train's three carts and all homes in frame; a toy on a cart is at least 14% of the screen height; a home at least 38%. |
| Line | Start of the Book phase | Photo line across the top third, the open book in the bottom half. |
| Book | Finale | The spread spans 80% of the screen width; each photo place is at least 9% of the screen width. |

Elevation 0.30–0.45 rad in every view (a child's-eye look slightly down), never top-down.

### 6.4 Keeping targets unblocked

- Pip is always above and behind. The ghost hand is 60% transparent and leaves the moment she touches.
- The viewfinder brackets are four thin corners, not a frame; they never cover a neighbour.
- Photo cards rise up and away from the things, never across another thing.
- Captions sit in the engine's caption bar; no in-scene labels.
- In the Me place, the Monkey's arms rest at its sides and never cross its tummy or face except during a reaction, and input is ignored while a reaction that moves an arm across another target is playing.
- In Tidy, a carried toy is drawn above everything (the engine's lift), and the homes are behind the carts, so a toy on a cart can never hide behind a home.

---

## 7. Assets

### 7.1 Places and nooks (sets)

Every nook is built from the same kit: a ground patch (10 × 5), a backdrop at z −3, a back ledge for Pip, and three stands for small things. Reuse existing scenery props wherever named. New set pieces are marked **new**.

| Place (id) | Place line (voiced) | Nook id | The corner | Backdrop and ledge | Stand for small things |
|---|---|---|---|---|---|
| Animals (`animals`) | "Let's go to the farm!" | `yard` | Farmyard | `barn`, `hay`; ledge: `fence` rail | `hayroll` |
| | | `garden` | Garden bed | `farmhedge`, `scene_flower`; ledge: top of the hedge | `m_stump` |
| | | `wild` | Wild wood | `scene_pine`, `scene_tree`; ledge: a fallen `sinklog` on two stumps | `m_stump` |
| | | `sea` | Rock pool | `palm`, `rock`, beach ground; ledge: `boardwalk` rail | `rock` (flat) |
| Food (`food`) | "Let's find some food!" | `fruit` | Fruit stall | `stall`; ledge: the stall's back shelf | `crate` |
| | | `veg` | Veg patch | `planterbox`, `scarecrow`; ledge: `fence` | `crate` |
| | | `meal` | Dinner table | `window`, `k_counter`; ledge: counter back | `m_table` (one long table replaces the three stands) |
| | | `treat` | Picnic | `picnic`, `scene_tree`; ledge: tree branch (`st_branch`, scaled) | `cakestand` |
| Playroom (`toys`) | "Let's go and play!" | `rug` | Play rug | `m_rug`, `shelf`, `m_toybox`; ledge: the shelf | `blk_cube` |
| | | `make` | Art table | `m_playtable`, `frame`; ledge: shelf | the play table |
| | | `park` | Playground | `fence`, `scene_tree`, sand ground; ledge: fence | `m_stump` |
| Clothes (`clothes`) | "Let's get dressed!" | `rail` | Clothes rail | `clothesrail`, `wardrobe`; ledge: top of the rail | **new** `w_hanger_stand` (things hang from it at slot height) |
| | | `feet` | Shoe bench | `coatpegs`, `umbrellastand`; ledge: peg shelf | **new** `w_shoebench` |
| | | `out` | By the door | `hatstand`, `m_door`, `mirror`; ledge: shelf | `md_stool` |
| Me (`body`) | "Hello, Monkey!" | `face`, `arms`, `legs` | One big Monkey on `m_rug`; the nook is a camera framing (8.4) | `curtain`, `floorlamp`; ledge: `shelf` at one side | none |
| Home (`home`) | "Let's go home!" | `kitchen` | Kitchen | `k_counter`, `k_jars`, `window`; ledge: counter back | `m_table` |
| | | `bath` | Bathroom | `md_drape`, tiled wall (canvas texture), `md_towel` on a rail; ledge: window sill | `md_stool` |
| | | `bedroom` | Bedroom | `window` with `curtain`, night sky outside; ledge: `shelf` | `md_table` |
| | | `living` | Living room | `frame`, `floorlamp`, `m_rug`; ledge: `shelf` | `m_table` (low) |
| | | `house` | Front garden | `fence`, `scene_tree`, path; ledge: fence | `m_stump` |
| Things that go (`vehicles`) | "Let's see what goes!" | `road` | The street | `shop`, `streetlamp`, road ground (canvas texture); ledge: a low wall, **new** `w_wall` | none (all M or L) |
| | | `far` | Station and sky | `track`, `m_hill`, `scene_cloud`; ledge: `m_bridge` | none |
| Outside (`outdoors`) | "Let's go outside!" | `sky` | The sky | `m_hill` ×2, stems for the sky things; ledge: hilltop | none |
| | | `grow` | Under the tree | `scene_tree`, `m_bush`; ledge: fallen log | `m_stump` |
| | | `walk` | A walk | `m_hill`, `fence`, path; ledge: fence | `m_mound` |
| | | `tools` | The shed | `planterbox`, `seedbag`, **new** `w_shed` wall; ledge: shed shelf | `crate` |
| People (`people`) | "Let's say hello!" | `family` | At home | `house`, `flowerbox`; ledge: garden wall `w_wall` | none |
| | | `helpers` | In town | `shop`, `streetlamp`; ledge: `w_wall` | none |
| | | `dressup` | Dressing-up box | `curtain`, `chest`, `mirror`; ledge: `shelf` | none |

Sky and light: each place sets its own sky with `setSky` (Animals and Outside: meadow day; Food `treat`, Playroom `park`: meadow; Home `bedroom`: dusk; all indoor nooks: a warm wall colour and a floor plane instead of a horizon).

### 7.2 New Blender models that are not words

| Model | Description |
|---|---|
| `w_camera` | Pip's toy camera: a chunky rounded box, round lens, one big button, neck strap. Fits Pip's chest. |
| `w_photoline` | A string in a shallow curve with six wooden clothes pegs; each peg has a `jaw` bone that opens 25°. |
| `w_photocard` | A rounded white card, 0.62 × 0.74, with a 0.5 square face for the picture (the picture is a canvas texture made in code, section 8.2) and a `star` sticker layer in one corner, hidden until earned. |
| `w_viewfinder` | Four thin white rounded L-shaped corners (one model, four bones) that close in around a thing. |
| `w_book` | The word book: a big hardback, 3.2 × 2.0 open, with a `cover` bone (opens 170°) and a ribbon. Cream pages. |
| `w_easel` | A low wooden easel that holds the book at 25° from upright; a top bar wide enough for Pip to sit on. |
| `w_ring` | The cream ground ring under an unmet thing (a flat soft-edged torus). Reuse `ring` if it reads well when tinted cream. |
| `w_home_barn` | An open-fronted toy barn, 2.2 wide × 2.2 high, two shelves with three spots each, two half doors on `doorL` / `doorR` bones, and a friend sign on the roof: a round board with a cow's head sticker, on a `sign` bone that can lean 15°. |
| `w_home_hamper` | A big wicker picnic hamper standing open, same size and spots, lid on a `lid` bone; sign: an apple. |
| `w_home_toybox` | A painted toy chest stood on end like a cubby, same spots; sign: a ball. (Not `m_toybox`: that one has no shelves.) |
| `w_home_wardrobe` | A little open wardrobe, same spots, two doors; sign: a T-shirt. |
| `w_home_garage` | A toy garage with a roll-up door on an `up` bone, same spots; sign: a car. |
| `w_tidyrug` | A big round rug, 8 across, with a path for the track across its front. |
| `w_hanger_stand`, `w_shoebench`, `w_wall`, `w_shed` | The set pieces marked new in 7.1. |

Reused as they are: `engine`, `traincart` ×3, `track` (the tidy train), `pip` and his hats, `monkey`, `bear`.

### 7.3 Sounds

Very few. Everything else is the voice.

| Sound | When | Source |
|---|---|---|
| `sfx.shutter` (half volume) | Each photo | exists |
| `sfx.step(i, n)` | Each photo pegged; each toy sorted | exists |
| `sfx.pup` | Picking up a toy; a photo landing in the book | exists |
| One soft train toot | The train stops (not when it leaves) | **new** CC0, `words_toot` |
| Signature sounds, on **about** taps and listen rounds only | cow `moo`, pig `oink`, sheep `baa`, duck `quack`, hen `cluck`, horse `neigh`, chick `cheep`, frog `ribbit`, cat `meow`, bee `buzz`, elephant `trumpet`, mouse `squeak`, bush `rustle`, clock `tick`, drum `drumSoft`, apple / carrot / biscuit / cracker `crunch`, bath / tap / sink / puddle / pond / sea / river / whale / rain `splash` (quiet), milk / juice / water / watering can `pour` | all exist |
| | dog woof, bird tweet, owl hoot, lion roar (soft), phone ring, keys jingle, train choo, car beep, fire engine nee-naw (one cycle) | **new** CC0: `words_woof`, `words_tweet`, `words_hoot`, `words_roar`, `words_ring`, `words_jingle`, `words_choo`, `words_beep`, `words_neenaw` |

Not used at all: boing, chime, fanfare, giggle, twinkle, confetti sounds, `sfx.nope`.

Music: the host world's loop, ducked to 70% for the whole game so every word is clear.

### 7.4 Fixed voice lines (exact text)

Place lines (9): "Let's go to the farm!" · "Let's find some food!" · "Let's go and play!" · "Let's get dressed!" · "Hello, Monkey!" · "Let's go home!" · "Let's see what goes!" · "Let's go outside!" · "Let's say hello!"

Meet: "What's that?" · "Come and see!"

Find: "Let's take pictures!"

Tidy: "Tidy-up time!" · "Here comes the train!" · "Take it home!" (with the drag demo) · "Animals go in the barn." · "Food goes in the basket." · "Toys go in the toy box." · "Clothes go in the wardrobe." · "Things that go, go in the garage." · "Where do animals go?" · "Where does food go?" · "Where do toys go?" · "Where do clothes go?" · "Where do things that go, go?"

Book: "Pop them in your book!" (The engine's "Look what you made!" already exists.)

Intro (`meta.js`): "Let's find some words!"

That is 28 fixed lines. Each word adds three (7.5).

### 7.5 The words: 300, with every voice line, model and reaction

How to read the tables:
- **Order matters.** Within a nook the words are in teaching order: the top of the list is taught first.
- **Name line** and **About line** are exact voice lines.
- **Where line** is made from the word by one of four patterns. No mark: "Where's the *word*?" **(pl)**: "Where are the *word*?" **(pn)**: "Where's *Word*?" Body words: "Where's Monkey's *word*?" or, with (pl), "Where are Monkey's *word*?" Where the word in the where line differs from the id, it is given in brackets.
- **Model:** an existing model name, or `w_…` = a new model to build. **Size** S, M or L (6.2).
- **React:** a reaction from the library in 8.3; `+name` = the signature sound played on about taps.
- **Clash:** words in the same clash group never share a nook in one visit.

#### Animals (40)

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| yard | dog | A dog! | The dog says woof. | `w_dog` (rigged creature) M | creature +woof |
| yard | cat | A cat! | The cat says miaow. | `cat` M | creature +meow |
| yard | cow | A cow! | The cow says moo. | `cow` L | creature +moo |
| yard | duck | A duck! | The duck says quack. | `duck` M | creature +quack |
| yard | pig | A pig! | The pig says oink. | `pig` M | creature +oink |
| yard | sheep | A sheep! | The sheep says baa. | `sheep` M | creature +baa |
| yard | horse | A horse! | The horse says neigh. | `horse` L | creature +neigh |
| yard | hen | A hen! | The hen says cluck. | `hen` M | creature +cluck |
| yard | chick | A chick! | Cheep, cheep! | `chick` S | creature +cheep |
| yard | mouse | A mouse! | Squeak, squeak! | `w_mouse` S | hop +squeak |
| yard | goat | A goat! | The goat has horns. | `w_goat` M | hop |
| yard | donkey | A donkey! | Hee-haw! | `w_donkey` L | hop |
| garden | bird | A bird! | Tweet, tweet! | `w_bird` S | flutter +tweet |
| garden | bunny | A bunny! | Hop, hop, hop! | `bunny` M | creature |
| garden | bee | A bee! | Buzz, buzz! | `farmbee` S | flutter +buzz |
| garden | butterfly | A butterfly! | Flutter, flutter! | `m_butterfly` S | flutter |
| garden | frog | A frog! | Ribbit! | `frog` M | creature +ribbit |
| garden | ladybird | A ladybird! | Red with black spots. | `m_ladybug` S | flutter |
| garden | snail | A snail! | Slow, slow snail. | `farmsnail` S | wriggle |
| garden | worm | A worm! | Wiggle, wiggle! | `m_worm` S | wriggle |
| garden | spider | A spider! | Eight little legs. | `m_spider` S | hop |
| garden | caterpillar | A caterpillar! | Munch, munch! | `st_caterpillar` S | wriggle |
| garden | ant | An ant! | A tiny, tiny ant. | `w_ant` S | hop |
| wild | bear | A bear! | A big, soft bear. | `bear` L | creature |
| wild | monkey | A monkey! | Ooh, ooh, aah! | `monkey` M | creature |
| wild | elephant | An elephant! | A long, long trunk. | `elephant` L | creature +trumpet |
| wild | lion | A lion! | Roar! | `w_lion` L | hop +roar |
| wild | giraffe | A giraffe! | A long, long neck. | `w_giraffe` L | sway |
| wild | owl | An owl! | Twit-twoo! | `word_owl` M | flutter +hoot |
| wild | tiger | A tiger! | Stripy tiger! | `w_tiger` L | hop |
| wild | zebra | A zebra! | Black and white stripes. | `w_zebra` L | hop |
| wild | fox | A fox! | A bushy red tail. | `w_fox` M | hop |
| wild | squirrel | A squirrel! | Up the tree! | `w_squirrel` S | hop |
| wild | hedgehog | A hedgehog! | Prickly, prickly! | `hedgehog` M | creature |
| wild | snake | A snake! | Hiss! | `w_snake` M | wriggle |
| sea | fish | A fish! | Swim, swim, swim! | `fish` S | wriggle |
| sea | crab | A crab! | Snip, snap! | `crab` M | creature |
| sea | turtle | A turtle! | A hard, round shell. | `w_turtle` M | open (head and legs tuck in, come out) |
| sea | whale | A whale! | A great big whale. | `w_whale` L | splash +splash |
| sea | penguin | A penguin! | Waddle, waddle! | `w_penguin` M | hop |

Clash: (lion, tiger) · (horse, donkey) · (hen, chick, duck) only at Level 1 · (worm, caterpillar, snake).

#### Food (44)

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| fruit | apple | An apple! | Crunch, crunch! | `m_apple` S | nibble +crunch |
| fruit | banana | A banana! | Peel the banana. | `m_banana` S | nibble |
| fruit | orange | An orange! | A juicy orange. | `m_orange` S | roll |
| fruit | strawberry | A strawberry! | Sweet and red. | `m_strawberry` S | nibble |
| fruit | grapes (pl) | Grapes! | Lots of little grapes. | `m_grapes` S | hop |
| fruit | pear | A pear! | A soft, sweet pear. | `m_pear` S | nibble |
| fruit | blueberries (pl) | Blueberries! | Tiny blue berries. | `w_blueberries` (five `m_blueberry` in a little dish) S | roll |
| fruit | watermelon | A watermelon! | Big and green. | `m_watermelon` S | roll |
| fruit | cherries (pl) | Cherries! | Two red cherries. | `m_cherry` S | sway |
| fruit | lemon | A lemon! | Ooh, sour! | `m_lemon` S | roll |
| fruit | plum | A plum! | A purple plum. | `m_plum` S | roll |
| veg | carrot | A carrot! | Crunchy carrot! | `carrot` S | nibble +crunch |
| veg | peas (pl) | Peas! | Little green peas. | `k_peapod` S | open (the pod opens) |
| veg | tomato | A tomato! | Round and red. | `ck_tomato` S | roll |
| veg | potato | A potato! | A lumpy potato. | `ck_potato` S | roll |
| veg | corn | Corn! | Yellow corn. | `corn` S | nibble |
| veg | broccoli | Broccoli! | Like a little tree. | `k_broccoli` S | sway |
| veg | cucumber | A cucumber! | Long and green. | `k_cucumber` S | roll |
| veg | pumpkin | A pumpkin! | Big and orange. | `m_pumpkin` S | squish |
| veg | mushroom | A mushroom! | Like a little umbrella. | `m_mushroom` S | squish |
| veg | onion | An onion! | Lots of layers. | `ck_onion` S | roll |
| veg | pepper | A pepper! | A shiny pepper. | `ck_pepper` S | hop |
| veg | cabbage | A cabbage! | Leafy and green. | `farmcabbage` S | squish |
| meal | milk | Milk! | Glug, glug, glug! | `k_milk` S | tip +pour |
| meal | bread | Bread! | Soft, warm bread. | `bread` S | squish |
| meal | egg | An egg! | Tap, tap, crack! | `farmegg` S | roll |
| meal | cheese | Cheese! | Yellow cheese. | `k_cheese` S | nibble |
| meal | water | Water! | A drink of water. | `w_water` (a beaker of water) S | tip +pour |
| meal | juice | Juice! | Sip, sip, sip! | `w_juice` (carton and straw) S | tip +pour |
| meal | yogurt | Yogurt! | Creamy yogurt. | `k_yogurt` S | hop |
| meal | pasta | Pasta! | Twirly pasta. | `w_pasta` (a bowl of spirals) S | hop |
| meal | soup | Soup! | Hot soup. Blow! | `w_soup` (a bowl) S | puff |
| meal | sandwich | A sandwich! | Bread and cheese. | `sandwich` S | nibble |
| meal | pizza | Pizza! | A slice of pizza. | `w_pizza` S | nibble |
| meal | cereal | Cereal! | Crunchy breakfast. | `w_cereal` (bowl and spoon) S | hop |
| treat | biscuit | A biscuit! | Snap! | `cookie` S | nibble +crunch |
| treat | cake | A cake! | Happy birthday cake. | `w_cake` (one candle) S | squish |
| treat | ice cream | An ice cream! | Cold, cold, lick! | `icecream` S | nibble |
| treat | cracker | A cracker! | Crunch! | `k_cracker` S | nibble +crunch |
| treat | lolly | A lolly! | Lick, lick! | `lolly` S | spin |
| treat | chocolate | Chocolate! | Yummy chocolate. | `w_chocolate` (a bar, half unwrapped) S | nibble |
| treat | cupcake | A cupcake! | A little cake. | `m_cupcake` S | squish |
| treat | doughnut | A doughnut! | Round with a hole. | `m_donut` S | roll |
| treat | honey | Honey! | Sticky, sweet honey. | `w_honey` (a jar and dipper) S | tip |

Clash: (orange, lemon, plum) at Level 1 · (cake, cupcake) · (biscuit, cracker) · (water, juice, milk) at Level 1 · (tomato, pepper).

#### Playroom (28)

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| rug | ball | A ball! | Roll the ball. | `m_toyball` S | roll |
| rug | teddy | A teddy! | Cuddle teddy. | `w_teddy` M | squish |
| rug | blocks (pl) | Blocks! | Build them up high. | `w_blocks` (three `m_block`, stacked) S | hop |
| rug | doll | A doll! | Rock-a-bye, dolly. | `w_doll` M | sway |
| rug | drum | A drum! | Bang, bang! | `drum` S | hop +drumSoft |
| rug | puzzle | A puzzle! | The pieces fit. | `w_puzzle` (a board, one piece on a `lift` bone) S | open |
| rug | dinosaur | A dinosaur! | Stomp, stomp! | `w_dinosaur` M | hop |
| rug | robot | A robot! | Beep, boop! | `w_robot` M | spin |
| rug | top (spinning top) | A spinning top! | Round and round. | `w_top` S | spin |
| rug | toy box | A toy box! | Toys go inside. | `m_toybox` M | open |
| make | book | A book! | Turn the page. | `w_storybook` (with a `page` bone) S | open |
| make | crayon | A crayon! | Scribble, scribble! | `m_crayon` S | hop |
| make | paint | Paint! | Splish, splosh! | `m_paintpot` S | tip |
| make | paper | Paper! | Draw on the paper. | `w_paper` S | sway |
| make | pencil | A pencil! | Draw a line. | `w_pencil` S | hop |
| make | playdough | Playdough! | Squish, squash! | `w_playdough` S | squish |
| make | sticker | A sticker! | Stick it on. | `w_sticker` (a star sticker, peeling) S | hop |
| make | present | A present! | What's inside? | `m_giftbox` + `m_giftlid` S | open |
| park | slide | A slide! | Whee, down we go! | `w_slide` L | hop |
| park | swing | A swing! | Back and forth. | `w_swing` (seat on a `swing` bone) L | sway |
| park | balloon | A balloon! | Up, up, up! | `m_balloon` M | float |
| park | bubbles (pl) | Bubbles! | Pop, pop, pop! | `w_bubbles` (tub and wand) S | puff |
| park | bucket | A bucket! | Fill it up. | `bucket` S | tip |
| park | spade | A spade! | Dig, dig, dig! | `spade` S | hop |
| park | kite | A kite! | High in the sky. | `word_kite` M | float |
| park | see-saw | A see-saw! | Up and down. | `bal_seesaw` L | sway |
| park | sandcastle | A sandcastle! | Made of sand. | `castle` M | squish |
| park | scooter | A scooter! | Push and go! | `w_scooter` M | drive |

Clash: (crayon, pencil) · (teddy, doll) at Level 1.

#### Clothes (26)

Check `dress-clothes.js` first: any garment already built as a monkey layer can be exported flat as the prop here.

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| rail | coat | A coat! | Warm and cosy. | `w_coat` M | sway |
| rail | T-shirt | A T-shirt! | Arms in! | `w_tshirt` M | sway |
| rail | trousers (pl) | Trousers! | One leg, two legs. | `w_trousers` M | sway |
| rail | dress | A dress! | Twirl, twirl! | `w_dress` M | spin |
| rail | jumper | A jumper! | Soft and woolly. | `w_jumper` M | squish |
| rail | pyjamas (pl) | Pyjamas! | Time for bed. | `w_pyjamas` M | sway |
| rail | nappy | A nappy! | A clean, dry nappy. | `w_nappy` S | squish |
| rail | shorts (pl) | Shorts! | For sunny days. | `w_shorts` M | sway |
| rail | skirt | A skirt! | Swish, swish! | `w_skirt` M | spin |
| feet | shoes (pl) | Shoes! | Shoes on your feet. | `w_shoes` S | hop |
| feet | socks (pl) | Socks! | One sock, two socks. | `w_socks` (two `farmsock`) S | hop |
| feet | boots (pl) | Boots! | Splash in puddles! | `wellies` S | hop |
| feet | slippers (pl) | Slippers! | Soft, snug slippers. | `w_slippers` S | squish |
| feet | sandals (pl) | Sandals! | Toes out! | `w_sandals` S | hop |
| feet | tights (pl) | Tights! | Stretchy tights. | `w_tights` S | sway |
| out | hat | A hat! | On your head. | `hat` S | squish |
| out | bag | A bag! | Put things in. | `w_bag` (a little backpack, `flap` bone) S | open |
| out | gloves (pl) | Gloves! | Warm fingers. | `w_gloves` S | sway |
| out | scarf | A scarf! | Round and round. | `w_scarf` S | sway |
| out | umbrella | An umbrella! | Pop it open! | `umbrella` M | open |
| out | glasses (pl) | Glasses! | Help us see. | `m_glasses` S | hop |
| out | bib | A bib! | Catch the crumbs. | `w_bib` S | sway |
| out | button | A button! | Push it through. | `m_button` S | spin |
| out | zip | A zip! | Zip it up. Zzzip! | `w_zip` (slider on a `zip` bone) S | open |
| out | pocket | A pocket! | Hide your hand inside. | `w_pocket` S | squish |
| out | swimsuit | A swimsuit! | Splash time! | `w_swimsuit` S | sway |

Clash: (coat, jumper) at Level 1 · (shorts, trousers, tights) · (shoes, sandals, slippers) · (dress, skirt).

#### Me (24): all on the big Monkey

| Nook | Word | Name line | About line | What Monkey does (react `part`) |
|---|---|---|---|---|
| face | nose | Monkey's nose! | Sniff, sniff! | nose twitches twice |
| face | eyes (pl) | Monkey's eyes! | Blink, blink! | two slow blinks |
| face | mouth | Monkey's mouth! | Open wide! | mouth opens, closes |
| face | ears (pl) | Monkey's ears! | Wiggle, wiggle! | ears wiggle (spring bones) |
| face | head | Monkey's head! | Nod, nod. | two nods |
| face | teeth (pl) | Monkey's teeth! | Brush your teeth. | big grin showing teeth |
| face | tongue | Monkey's tongue! | Aah! | tongue out, in |
| face | face | Monkey's face! | Peekaboo! | hands over face, open |
| face | cheeks (pl) | Monkey's cheeks! | Puff! | cheeks puff, let go |
| face | chin | Monkey's chin! | Tickle, tickle! | chin lifts, small giggle face |
| face | lips (pl) | Monkey's lips! | Mwah! | a kiss shape |
| face | neck | Monkey's neck! | Stretch up tall. | neck stretches, settles |
| arms | tummy | Monkey's tummy! | Pat, pat! | pats tummy twice |
| arms | hands (pl) | Monkey's hands! | Clap, clap! | two soft claps (no sound) |
| arms | arms (pl) | Monkey's arms! | Up high! | both arms up, down |
| arms | fingers (pl) | Monkey's fingers! | Wiggle your fingers. | fingers wiggle |
| arms | belly button | Monkey's belly button! | Beep! | tummy pokes out, in |
| arms | shoulders (pl) | Monkey's shoulders! | Shrug! | one shrug |
| arms | thumb | Monkey's thumb! | Thumbs up! | thumb up |
| arms | elbow | Monkey's elbow! | Bend, bend. | arm bends twice |
| legs | feet (pl) | Monkey's feet! | Stamp, stamp! | two gentle stamps |
| legs | toes (pl) | Monkey's toes! | Wiggle your toes. | toes wiggle |
| legs | legs (pl) | Monkey's legs! | Kick, kick! | two small kicks |
| legs | knees (pl) | Monkey's knees! | Bend your knees. | knees bend, straighten |

Clash: (mouth, lips, teeth, tongue) · (face, head, cheeks, chin) · (hands, fingers, thumb) · (arms, elbow, shoulders) · (feet, toes) · (legs, knees) · (tummy, belly button).

#### Home (54)

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| kitchen | cup | A cup! | Sip, sip, sip! | `m_cup` S | tip |
| kitchen | spoon | A spoon! | Scoop it up. | `farmspoon` S | hop |
| kitchen | bowl | A bowl! | A round bowl. | `bowl` S | spin |
| kitchen | plate | A plate! | Food goes on top. | `m_plate` S | spin |
| kitchen | bottle | A bottle! | Shake, shake! | `md_bottle` S | tip |
| kitchen | fork | A fork! | Poke, poke! | `w_fork` S | hop |
| kitchen | highchair | A highchair! | Up you go! | `w_highchair` L | hop |
| kitchen | fridge | A fridge! | Brrr, it's cold! | `k_fridge` L | open |
| kitchen | pan | A pan! | Sizzle, sizzle! | `w_pan` S | puff |
| kitchen | cooker | A cooker! | Hot! Don't touch. | `w_cooker` (oven with `ck_hob` on top) L | glow |
| kitchen | bin | A bin! | Rubbish goes in. | `md_bin` + `md_binlid` M | open |
| bath | bath | A bath! | Splish, splash! | `md_bath` L | splash +splash |
| bath | soap | Soap! | Rub, rub, bubbles! | `md_soap` S | puff |
| bath | towel | A towel! | Rub-a-dub dry. | `md_towel` M | sway |
| bath | toothbrush | A toothbrush! | Brush, brush, brush! | `md_brush` S | wriggle |
| bath | potty | A potty! | Sit on the potty. | `w_potty` M | hop |
| bath | tap | A tap! | Drip, drip, drip! | `k_tap` S | splash +splash |
| bath | sink | A sink! | Wash your hands. | `md_sink` L | splash +splash |
| bath | toilet | A toilet! | Flush! Whoosh! | `w_toilet` L | open |
| bath | toothpaste | Toothpaste! | Squeeze a little. | `md_paste` S | squish |
| bath | sponge | A sponge! | Squeeze the sponge. | `sponge` S | squish |
| bath | mirror | A mirror! | Who can you see? | `mirror` M | glow |
| bath | hairbrush | A hairbrush! | Brush your hair. | `md_hairbrush` S | wriggle |
| bedroom | bed | A bed! | Night night! | `md_bed` L | squish |
| bedroom | blanket | A blanket! | Snuggle up warm. | `m_blanket` S | squish |
| bedroom | pillow | A pillow! | Soft for your head. | `w_pillow` S | squish |
| bedroom | lamp | A lamp! | Click! Light on. | `md_lamp` S | glow |
| bedroom | clock | A clock! | Tick, tock! | `md_clock` S | ring +tick |
| bedroom | cot | A cot! | Baby sleeps here. | `w_cot` L | sway |
| bedroom | dummy | A dummy! | Suck, suck. | `w_dummy` S | hop |
| bedroom | curtains (pl) | Curtains! | Open, shut. | `curtain` L | open |
| bedroom | drawers (pl) | Drawers! | Pull it open. | `w_drawers` (one `drawer` bone) L | open |
| bedroom | wardrobe | A wardrobe! | Clothes hang inside. | `wardrobe` L | open |
| bedroom | rug | A rug! | Soft under your feet. | `m_rug` (small) M | squish |
| living | chair | A chair! | Sit down. | `chair` M | hop |
| living | table | A table! | Things go on top. | `m_table` M | hop |
| living | phone | A phone! | Ring, ring! Hello? | `w_phone` S | ring +ring |
| living | keys (pl) | Keys! | Jingle, jingle! | `w_keys` (three `sinkkey` on a ring) S | ring +jingle |
| living | sofa | A sofa! | A comfy sofa. | `w_sofa` L | squish |
| living | TV | A TV! | Click! It's on. | `w_tv` M | glow |
| living | box | A box! | What's in the box? | `box` M | open |
| living | basket | A basket! | Carry it along. | `wicker` M | sway |
| living | picture | A picture! | Hang it on the wall. | `frame` S | sway |
| living | plant | A plant! | It needs water. | `plant` M | sway |
| living | hoover | A hoover! | Vroom, vroom! | `w_hoover` M | drive |
| living | broom | A broom! | Sweep, sweep! | `w_broom` M | sway |
| house | door | A door! | Knock, knock! | `m_door` L | open |
| house | house | A house! | Home, sweet home. | `house` L | glow (the windows light) |
| house | window | A window! | Look outside. | `window` M | open |
| house | stairs (pl) | Stairs! | Up, up, up! | `w_stairs` L | hop |
| house | light | A light! | On! Off! | `w_light` (a hanging ceiling light on a short bracket) M | glow |
| house | roof | A roof! | On top of the house. | `blk_roof` M | hop |
| house | gate | A gate! | Open the gate. | `w_gate` M | open |
| house | chimney | A chimney! | Puff, puff, smoke. | `m_chimney` M | puff |

Clash: (bowl, plate) at Level 1 · (spoon, fork) at Level 1 · (bath, sink) · (toothbrush, hairbrush) · (bed, cot) · (blanket, rug, towel) · (lamp, light) · (door, gate) · (drawers, wardrobe) · (chair, sofa).

#### Things that go (22)

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| road | car | A car! | Beep, beep! | `m_car` M | drive +beep |
| road | bus | A bus! | The wheels go round. | `w_bus` L | drive |
| road | bike | A bike! | Pedal, pedal! | `w_bike` M | drive |
| road | lorry | A lorry! | A big load. | `w_lorry` L | drive |
| road | tractor | A tractor! | Chug, chug, chug! | `w_tractor` L | drive |
| road | fire engine | A fire engine! | Nee-naw, nee-naw! | `w_fireengine` L | drive +neenaw |
| road | digger | A digger! | Scoop and dump. | `w_digger` (arm on `arm` and `scoop` bones) L | open |
| road | buggy | A buggy! | Push the baby. | `w_buggy` M | drive |
| road | ambulance | An ambulance! | It helps poorly people. | `w_ambulance` L | drive |
| road | police car | A police car! | Flash, flash! | `w_policecar` M | drive, light glows |
| road | motorbike | A motorbike! | Vroom! | `w_motorbike` M | drive |
| road | wheel | A wheel! | Round and round. | `m_wheel` S | spin |
| far | train | A train! | Choo, choo! | `engine` L | drive +choo, puff |
| far | plane | A plane! | Zoom, up high! | `w_plane` L | float |
| far | boat | A boat! | Bobbing on the water. | `boat` M | sway |
| far | helicopter | A helicopter! | Whirr, whirr! | `w_helicopter` (rotor on a `rotor` bone) L | float, rotor spins |
| far | rocket | A rocket! | Three, two, one, blast off! | `w_rocket` L | float |
| far | crane | A crane! | Lift it up high. | `crane` L | open (the hook lifts) |
| far | bin lorry | A bin lorry! | It takes the rubbish. | `w_binlorry` L | drive |
| far | ship | A ship! | A big, big boat. | `sailboat` L | sway |
| far | bridge | A bridge! | Over we go. | `m_bridge` L | hop |
| far | road | A road! | Cars drive on it. | `w_road` (a short curved piece, white dashes) M | hop |

Clash: (lorry, bin lorry) · (car, police car) · (ambulance, fire engine) at Level 1 · (bike, motorbike) · (boat, ship) · (plane, rocket, helicopter) at Level 1.

#### Outside (38)

| Nook | Word | Name line | About line | Model, size | React |
|---|---|---|---|---|---|
| sky | sun | The sun! | Warm and bright. | `scene_sun` M | glow |
| sky | moon | The moon! | Night night, moon. | `scene_moon` M | glow |
| sky | star | A star! | Twinkle, twinkle! | `m_puffstar` S | glow |
| sky | cloud | A cloud! | Fluffy white cloud. | `scene_cloud` M | float |
| sky | rain | Rain! | Pitter, patter! | `w_raincloud` (grey cloud, drops) M | splash +splash |
| sky | rainbow | A rainbow! | So many colours. | `scene_rainbow` M | glow |
| sky | snow | Snow! | Cold, white snow. | `w_snowcloud` (cloud, flakes) M | splash (flakes drift down, silent) |
| sky | snowman | A snowman! | Brrr! Hello, snowman. | `scene_snowman` M | hop |
| grow | tree | A tree! | Tall, tall tree. | `scene_tree` L | sway |
| grow | flower | A flower! | Sniff. Mmm! | `scene_flower` S | sway |
| grow | grass | Grass! | Green and tickly. | `w_grass` (a soft tuft) S | sway |
| grow | leaf | A leaf! | It floats down. | `m_leaf` S | float |
| grow | stone | A stone! | Hard and heavy. | `rock` S | hop |
| grow | stick | A stick! | Tap, tap, tap! | `st_branch` S | hop |
| grow | puddle | A puddle! | Splash! | `icon_puddle` M | splash +splash |
| grow | mud | Mud! | Squelch, squelch! | `mud` M | squish |
| grow | bush | A bush! | Rustle, rustle! | `m_bush` M | sway +rustle |
| grow | acorn | An acorn! | A seed from a tree. | `m_acorn` S | roll |
| grow | nest | A nest! | A bed for birds. | `st_nest` S | hop |
| grow | log | A log! | An old tree. | `sinklog` M | roll |
| walk | sand | Sand! | Dig in the sand. | `sandpile` M | squish |
| walk | sea (the sea) | The sea! | Swish, swoosh! | `w_sea` (a little rolling wave) L | splash +splash |
| walk | hill | A hill! | Up and over! | `m_hill` L | squish |
| walk | shell | A shell! | Listen. Swoosh! | `seashell` S | spin |
| walk | pond | A pond! | Ducks swim here. | `pond` L | splash +splash |
| walk | garden | A garden! | Things grow here. | `flowerbox` M | sway |
| walk | shop | A shop! | Let's buy some food. | `shop` L | open |
| walk | fence | A fence! | Peep through! | `fence` (short) M | hop |
| walk | bench | A bench! | Sit and rest. | `w_bench` M | hop |
| walk | river | A river! | It flows along. | `w_river` (a blue ribbon between two banks) L | splash +splash |
| walk | mountain | A mountain! | Very, very high. | `w_mountain` (snow cap) L | hop |
| tools | watering can | A watering can! | Sprinkle, sprinkle! | `w_wateringcan` S | tip +pour |
| tools | flowerpot | A flowerpot! | Plant a seed inside. | `pot` S | hop |
| tools | wheelbarrow | A wheelbarrow! | Push it along. | `wheelbarrow` M | drive |
| tools | ladder | A ladder! | Climb up, up. | `w_ladder` L | hop |
| tools | tent | A tent! | Peep inside! | `w_tent` (door flap bone) L | open |
| tools | fire | A fire! | Hot! Stay back. | `bonfire` M | glow |
| tools | torch | A torch! | Shine the light. | `w_torch` S | glow |

Clash: (sun, moon, star) at Level 1 · (rain, snow, cloud) · (hill, mountain) · (sea, river, pond, puddle) · (stick, log) · (bush, grass, tree) at Level 1.

#### People (24): the Bear family

Each person is the `bear` rig, scaled and dressed. Adults 1.0, grandparents 0.95, children 0.7, baby 0.5. React is always `wave` (waves, joy face) plus the small action given.

| Nook | Word | Name line | About line | Bear plus | Action |
|---|---|---|---|---|---|
| family | Mummy (pn) | Mummy! | Mummy gives a cuddle. | `w_acc_necklace`, soft pink tint | hugs her arms in |
| family | Daddy (pn) | Daddy! | Daddy waves hello. | `w_acc_tie`, warm brown tint | big wave |
| family | baby (the baby) | A baby! | Shh. Baby is little. | scale 0.5, `w_nappy`, `w_dummy` | rocks side to side |
| family | Grandma (pn) | Grandma! | Grandma reads a story. | `m_glasses`, `w_acc_shawl`, grey tint | opens a tiny book |
| family | Grandpa (pn) | Grandpa! | Grandpa has a hat. | `w_acc_flatcap`, `m_glasses`, grey tint | lifts his cap |
| family | girl | A girl! | She likes to jump. | scale 0.7, `m_bow` | one small jump |
| family | boy | A boy! | He likes to run. | scale 0.7, `w_acc_cap` | runs on the spot |
| helpers | doctor | A doctor! | The doctor helps us feel better. | `w_acc_doctorcoat`, `w_acc_stethoscope` | listens with the stethoscope |
| helpers | firefighter | A firefighter! | Puts out fires. | `w_acc_firehelmet`, `w_acc_hose` | points the hose |
| helpers | farmer | A farmer! | Feeds the animals. | `pip_strawhat` (scaled), `w_acc_dungarees` | tips the hat |
| helpers | builder | A builder! | Bang, bang, build! | `hardhat`, `w_acc_hammer` | two hammer taps |
| helpers | police officer | A police officer! | Keeps us safe. | `w_acc_policecap` | salutes |
| helpers | teacher | A teacher! | Reads us a book. | `w_storybook` in hand | opens the book |
| helpers | nurse | A nurse! | Looks after us. | `w_acc_nursecap`, `w_acc_plaster` | holds up a plaster |
| helpers | chef | A chef! | Cooks our dinner. | `w_acc_chefhat`, `farmspoon` | stirs the air |
| helpers | postman | A postman! | Brings a letter. | `w_acc_postbag`, `w_acc_letter` | holds out a letter |
| helpers | dentist | A dentist! | Looks at our teeth. | `w_acc_mask`, `w_acc_dentmirror` | holds up the mirror |
| helpers | pilot | A pilot! | Flies the plane. | `w_acc_pilotcap` | arms out like wings |
| dressup | king | A king! | A golden crown. | `m_crown`, `w_acc_cape` | bows |
| dressup | queen | A queen! | A sparkly crown. | `icon_crown`, `w_acc_cape` (purple) | royal wave |
| dressup | princess | A princess! | A pretty dress. | `w_acc_tiara`, `w_dress` layer | twirls |
| dressup | pirate | A pirate! | Arr! | `w_acc_piratehat`, `w_acc_eyepatch` | looks through a hand telescope |
| dressup | clown | A clown! | A funny red nose. | `w_acc_clownnose`, `m_partyhat` | wobbles |
| dressup | fairy | A fairy! | Tiny wings. | `w_acc_wings`, `w_acc_wand` | waves the wand |

Clash: (Mummy, Daddy) at Level 1 · (Grandma, Grandpa) at Level 1 · (girl, boy) · (doctor, nurse, dentist) · (king, queen, princess).

#### Count and build order

- 300 words: Animals 40, Food 44, Playroom 28, Clothes 26, Me 24, Home 54, Things that go 22, Outside 38, People 24.
- Voice lines: 300 name + 300 where + 300 about + 28 fixed = **928 new clips** (the app has 943 today).
- About 150 word models already exist. About 125 are new props (`w_…`), 15 are new animals, and about 30 are small accessories for the Bear family.
- **Build in three waves; the game ships after wave 1 and grows on its own** (a word with no model is simply not offered yet, section 8.6):
  - **Wave 1 (ship):** the first four words of every nook (about 120 words), plus everything in 7.2. Of these, only about 35 models are new; the one new rigged animal is the dog.
  - **Wave 2:** words five to eight of every nook.
  - **Wave 3:** the rest.
- New animals after the dog may be built as simple props with two or three bones (head, tail, legs as one) and the `hop` reaction; they do not need the full creature rig or a gait, because things never walk in this game.

---

## 8. Technical notes

### 8.1 Files

| File | Holds |
|---|---|
| `words.js` | The Lesson subclass: phases, rounds, camera, finale. |
| `words-list.js` | The word table of 7.5 as data: `{ id, place, nook, name, about, where, model, size, react, sound, clash }`. Generated from `WORDS.md` plus 7.5 by a small script; never edited by hand twice. |
| `words-places.js` | The nook sets of 7.1, slot positions, camera views. |
| `words-react.js` | The reaction library (8.3). |
| `words-memory.js` | The saved word memory (8.5). |
| `words-plan.js` | The planner (8.6): pure functions, no scene code, so it can be unit-tested with a seeded random. |
| `words-photo.js` | Photo cards, the line, the book (8.2). |
| `words-tidy.js` | The train, homes and sorting. |
| `tools/voice/words-lines.py` | Writes every voice line of 7.4 and 7.5 to `tools/voice/words-lines.txt` for `gen.py`. |

Engine API used: `Lesson` (`success`, `redirect`, `beat`, `payoffP`, `showHint`, `nudgeTarget`, `makeErrorless`, `glideCamera`, `walkTo`, `pokeable`, `creationView`, `creationObjects`, `onAdmirePoke`), `input.addTap` / `addDrag` with `onNear` and `autoHome`, `fx.ghostHand` / `ghostPath`, `sfx.step` / `shutter` / `pup`, the "Go!" gate.

`totalRounds`: Find rounds + Sort rounds (6 / 8 / 10, or 13 at sort stage 3). The Meet phase runs before round 1 as a pre-phase inside `startRound(0)`; each met thing is still written to `records` as a round with `firstTry: true` so the session stats count 12 / 14 / 16.

### 8.2 Photos without textures or stored images

- A photo's picture is a **canvas texture made in code**: render the thing alone (same toon materials, its current state) on the place's pastel colour into a 256 × 256 `WebGLRenderTarget` from a fixed three-quarter angle, then copy it to a canvas texture and free the target. One render per photo, at the moment of the shutter, hidden inside the 0.35 s beat. Me place: the same, with the render camera cropped to the body part. People: the dressed bear.
- **The book's older photos** are rendered the same way in the background: once the Meet phase starts, load the models of the already-met words on today's two pages (at most 18 more), render each to a 128 × 128 canvas on an idle frame, then dispose the model. All of it finishes well before the Book phase. If a model fails to load, that place shows the dotted square.
- **Nothing is stored as an image.** Only the word memory (a few kB) is saved. The book is rebuilt from it every visit, so it can never go out of step with the memory.

### 8.3 The reaction library (19 kinds)

Every reaction is a short tween on the thing's own transform or named bones, 0.6–0.9 s, ending exactly where it began (except `glow`, which toggles and stays). All of them stay inside the slot box, so nothing can clip a neighbour. None makes a sound of its own.

| Kind | Motion |
|---|---|
| `creature` | The rigged animal's own tap reaction (`poke`), joy face 1 s. |
| `hop` | Squash 8%, lift 0.18, land with a 5% squash. Silent. Not a bounce: one lift, one settle. |
| `flutter` | Wings flap four times; the body lifts 0.3 and comes down. |
| `wriggle` | A body wave along its length, twice (or the brush moves side to side). |
| `roll` | Rolls a quarter-turn (0.35 units) to the side and rolls back. |
| `spin` | One full slow turn about its upright axis, easing in and out. |
| `drive` | Rolls forward 0.5 with turning wheels, pauses, rolls back. |
| `tip` | Tilts 35° toward the child as if pouring or drinking; three small drops or crumbs arc out and fade; tilts back. |
| `nibble` | Two quick small squashes and three crumbs falling. The food is not changed (it must look the same in its photo). |
| `open` | The named bone opens (door, lid, flap, pod, page), holds 0.4 s, closes. |
| `glow` | Emissive up over 0.3 s; stays on. The next about-tap turns it off. (Lamp, sun, torch, TV, windows.) |
| `ring` | A fast, small shake for 0.5 s. |
| `sway` | Leans 12° left, right, back to rest, pivoting at its base or hanger. |
| `float` | Rises 0.4, drifts 0.15 sideways, returns. |
| `squish` | A deep, slow squash (18%) and a slow recovery with no overshoot. |
| `splash` | Six drops rise 0.5 and fall back in. |
| `puff` | Three soft white puffs rise and fade (steam, smoke, bubbles). |
| `part` | The Monkey moves the named body part (7.5, Me). |
| `wave` | The Bear waves, joy face 1 s, then the role's small action. |

A word with no reaction named falls back to `hop`.

### 8.4 The Me place

- One Monkey, scaled so it is 3.2 high sitting, at the centre of the nook. Targets are hit spheres on its anchors, as in `body.js` (reuse its `PARTS` table and extend it). Minimum hit radius on screen: 9% of screen height.
- The "nook" is a camera framing: `face` frames head and neck; `arms` frames shoulders to tummy; `legs` frames knees to toes. The three targets of a nook are spread left, middle and right as far as the body allows; the planner prefers one target from each side.
- A pair view cannot push a body part off-screen. Instead, in pair rounds the third part's hit sphere is switched off and the cream ring is not used; the two live parts each get a soft cream halo (`fx.halo`) for the first 1.5 s of the round so she can see which two are in play.
- Needs a detail pass on the monkey model (or a `w_bigmonkey` variant): separate fingers and a thumb, toes, a belly button decal, and teeth, tongue and lips states in the code face. Until a part exists on the model, its word is not offered (same gate as a missing model).

### 8.5 The word memory (how she is remembered)

Saved in localStorage under its own key, `ll.words.v1` (separate from `ll.v1`, like the creation gallery):

```
{ v: 1,
  visit: 37,                      // visits finished so far
  last: ['home', 'animals'],      // the last two places, newest first
  turn: { animals: 6, ... },      // how many turns each place has had
  at: { animals: 35, ... },       // the visit number of each place's last turn
  newPer: 2,                      // the adaptive number of new words per visit, 1..4
  sortStage: 1, sortGood: 0,
  w: { cup: [b, v, d, n, ok, no], ... } }   // one short array per met word
```

Per word: `b` box 0–5 · `v` its place's turn number when last practised · `d` day number of its last promotion · `n` times she has heard its name line · `ok` first-try finds · `no` misses. 300 words is under 12 kB.

| Event | Effect |
|---|---|
| She hears the name line (Meet tap, wrong tap in Find, picking up a toy, book) | `n` + 1. If `b` is 0, `b` becomes 1 and `v` = this turn. |
| Found first try | `ok` + 1; `v` = this turn; `b` + 1 (max 5) unless it was already promoted today (`d` = today). |
| Found after a miss, a hint or errorless | `no` + 1; `v` = this turn; `b` − 1 (min 1). |
| In the visit but never a Find target (two words in Level 3) | `v` = this turn; `b` unchanged. |
| Sorted correctly first try | counts toward the sort stage only. |

- **Due:** a met word is due when `turn[place] − v ≥ gap[b]`, with `gap = [–, 1, 1, 2, 3, 5]` (turns of its place).
- **States shown to people:** *met* (`b ≥ 1`), *known* (`b ≥ 4`: found first try on at least three different days).
- Saved at the end of each phase, not only at the end, so a visit abandoned half-way still remembers what she met.
- Unknown ids in a saved record (a word later removed from the list) are ignored and kept; new ids start at box 0.
- **Parent view:** in the parent panel, one line, "Words met 87 of 300 · known 41", and the nine place names each with their met count. `store.reset()` must also remove `ll.words.v1` (engine request 3 below).

### 8.6 The planner (which words today)

Run once at the start of a visit. Deterministic given the memory and a seed (the visit number), so it can be tested.

1. **Available words:** those whose model is in `assets/models/index.json` (and, for Me, whose part exists). Everything below uses only these.
2. **Choose the place.** Never the place of the last visit. If `visit % 3 == 0` (the 4th, 7th, 10th… visit) it is a **review visit**: the place with the most due words in boxes 1 and 2; ties go to the place whose last turn was longest ago; if no place has any, treat it as a fresh visit. Otherwise it is a **fresh visit**: the place whose last turn was longest ago, never-visited places first. Remaining ties go in the fixed order Animals, Home, Food, Playroom, Things that go, Clothes, Me, Outside, People. A place switched off by the parent, or with fewer than six available words, is skipped.
3. **Choose two nooks** of that place: the pair with the highest `3 × due + min(fresh, 2)` summed, among nooks with at least three available words. On a place's first turn the pair is fixed: yard + garden, fruit + meal, rug + park, feet + out, face + arms, kitchen + bath, road + far, sky + grow, family + helpers. A place with exactly two usable nooks uses both. Nook A is the one with more due words.
4. **Choose the words:** `newPer` new words for the level (Level 1: `newPer`, starts at 2; Level 2: `newPer` + 1; Level 3: `newPer`; all capped at 4), split as evenly as possible between the two nooks, taken from the top of each nook's list. Fill the remaining slots with that nook's due words (lowest box first), then its met words longest unseen, then more new words. Skip any word that clashes with one already chosen for the nook.
5. **Seat them:** the most familiar word (highest box) of each nook in the middle slot. Size L things go in the left or right slot when possible, so a tall thing never stands in front of Pip.
6. **Order the Find targets** as in the level tables of section 4.
7. **Level 3 sort set:** groups by sort stage (4.3); toys = met words of each group, highest box first, skipping `sortClash`.
8. **After the visit:** update `newPer` (4.4), the sort stage, `visit`, `last`, `turn`, `at`.

Checks the planner must pass in a unit test (10,000 simulated visits with a random-answer child): never fewer than six things; never a clash pair in a nook; never the same place twice running; no place waits more than 14 visits; every available word is met within 160 visits; the first ten visits of an always-right child match the table in 4.4.

### 8.7 Reconciling with `WORDS.md`

- A word in both: use `WORDS.md`'s spelling; keep this document's lines, model and reaction.
- A word only in `WORDS.md`: add it to the nook of its category that has the fewest words, at the end of the list; it needs a name line and an about line in the pattern of 7.5, and uses `hop` until someone designs better.
- A word only here: drop it, unless `WORDS.md` has fewer than 300.
- No nook may exceed 12 words (the book page has 12 places). Split a nook rather than exceed it.
- A `WORDS.md` word that is not a picturable noun (more, up, bye-bye) is out of scope for this game.

### 8.8 Engine requests (small, exact)

1. **Voice repeats.** `speech.say` speaks a line at most once every 30 s. This game needs a per-call override: `say(text, { minGap: 4 })` (seconds). Without it, the second tap on a thing within 30 s would be silent, which breaks the game's main purpose. Default stays 30.
2. **Preload voice.** Before the Meet phase, preload the 18 clips of today's six words so the name starts within 80 ms of a tap.
3. **Reset.** `store.reset()` calls a registered hook so `words-memory.js` can clear `ll.words.v1`.
4. **Stuck demo at 8 s** in the Tidy phase uses the lesson's own timer, as `cook.js` does (`STUCK_DEMO`).

### 8.9 Physics and performance

- No rigid bodies are needed. Things stand on static surfaces and react with tweens. Sorted toys are placed by tween onto shelf spots. This keeps a modest laptop smooth and removes any chance of a thing falling over.
- Only the six things, two nook sets, Pip, the line and the book are in the scene (plus five small models in Level 3's tidy rug). Nook B and the tidy rug are built at start, off-screen, so nothing pops in.
- Loading: six word models per visit, a few hundred kB. Show the scene only when all six are ready.
- Autoplay hooks (`tools/autoplay.js`): `words.meetAll()`, `words.findRight()`, `words.findWrong()`, `words.sortRight()`, `words.bookAll()`; and a debug entry `router.go('words', { place, nooks, words })` to force a set for QA shots.

### 8.10 Risks, and how to avoid them

| Risk | Avoid it by |
|---|---|
| 300 models is a very large art job | The three build waves; the availability gate; only the dog needs a full rig. The game is complete and good at 120 words. |
| The voice nags (the parent's first complaint) | Names are spoken only when she taps. The game itself speaks at most three lines without being touched per phase. 4 s same-line gap. Praise is never spoken. |
| Sizes look wrong (a cup as big as a bus) | Storybook scale is deliberate and consistent: S things always sit on a stand, L things always on the ground, and things from one nook are chosen to be plausible together (the nook lists already group like with like). |
| The third thing shows at the edge of a pair view | The pair view is checked with `project()` at build for the widest thing; if it cannot be hidden, that round falls back to dimming the third thing to 60% and switching off its tap. |
| A tall thing hides Pip, or Pip hides a thing | Pip is always behind a gap and above 1.5; L things are seated left or right; acceptance test below. |
| Family words on bears feel wrong to the parent | The lines say "Mummy!" as picture books do. If the parent dislikes it, the People place can be switched off in the parent panel (the planner then skips it); nothing else changes. |
| "Things that go" is an awkward group name | It is the phrase toddlers' books use; the home's car sign carries the meaning. |
| Body parts overlap (hand and fingers) | Clash groups keep them out of the same round. |
| She only ever taps one thing in Meet | The ladder's errorless step names the others for her; the Find phase still asks each once. |
| The memory and the book disagree | The book is drawn from the memory each time; no second record exists. |
| British or American words | The list is British to match the app's captions (mummy, nappy, lorry). A second column in `words-list.js` can hold American lines later; the ids do not change. |

---

## 9. Acceptance criteria

A strict reviewer checks each of these.

**Feel and pace**
1. Tapping any thing starts its reaction within one frame and its name within 100 ms.
2. Every tap on a thing in the Meet phase produces a spoken line, except a repeat of the same line inside 4 s.
3. The second tap on a thing gives its about line; the third gives its name again.
4. No reaction is shorter than 0.6 s or longer than 0.9 s. No camera move is a cut.
5. After every photo and every sorted toy there is at least 1.0 s in which nothing moves but breathing.
6. With the child not touching, the game speaks no more than three lines in any phase.
7. No boing, chime, fanfare, giggle or confetti before the finale. A name tap makes no sound effect at all.
8. Mute test: with sound off, a Level 1 visit is still clear and pleasing.

**Clarity**
9. The first Meet tap, the first Find round and the first sort each get a slow ghost-hand demo on the real object, the first time ever and again when she is stuck (12 s in Meet and Find, 8 s in Tidy). The "Go!" badge follows each demo.
10. Unmet things show the cream ring; the ring goes when the thing is met and never returns in that visit.
11. In the trio view each thing is at least 28% of the screen height; in the pair view at least 40%, and the third thing is not visible.
12. Pip is never between the camera and a thing, a toy, a home or a photo, in any view. Checked by screenshot in all nine places.

**Finding**
13. Level 1 Find rounds have exactly two choices; Levels 2 and 3 exactly three.
14. Each of the six words is a target exactly once in Level 1; in Level 2 each once, plus two repeats.
15. A wrong tap makes the tapped thing say its own name; there is no "no" sound and no head-shake line.
16. Every Find round ends with a photo of the target on the line, whatever happened.
17. The photo shows the thing as it is at that moment (a lit lamp is lit in its photo).

**Sorting (Level 3)**
18. The train rolls in and out at walking pace; toys never appear or vanish.
19. A home's doors open wider when its own toy is carried near, and not for another group's toy.
20. A sorted toy is still visible in its home at the end of the visit.
21. Stage 1 uses two homes from the "very different" pairs only.

**Memory and rotation**
22. After a visit, quitting and reopening the app shows the same photos in the word book, in the same places.
23. A word met for the first time is in the set again at the next turn of its place.
24. The same place is never used twice running; with all places available, all nine are visited within the first 12 visits, and visits 4, 7 and 10 are returns to Animals, Home and Food.
25. Level 1 visits have 1–4 new words (2 by default) once a place has been visited before.
26. A word found wrong on its first try is in the set again at the next turn of its place.
27. The planner unit test of 8.6 passes.
28. A word with no model in `index.json` is never offered, and the game runs with only the wave 1 models.
29. The parent panel shows "Words met N of 300 · known K" and the numbers match the memory. Reset clears them.

**Finale**
30. At the book, tapping a photo sends it to its own fixed place; the same word lands in the same place on every visit.
31. The finale frame shows the open spread with today's photos and earlier ones; every photo is pokeable and says its name.
32. The gallery photo on the home screen is that spread.

**Quality**
33. No clipping at any slot, for any word, in any view: every thing fits its 1.5 × 1.5 × 1.7 box including its reaction (checked by a script that plays every reaction of every available word and tests its bounds).
34. Every word model passes the art bar of `QUALITY-BRIEF.md` in the viewer at close range, and reads clearly as that thing at 128 × 128 in its photo.
35. Every caption line in 7.4 and 7.5 has a voice clip; no line is cut off by another.
36. 60 frames a second on the target laptop in the trio view of the busiest nook.
