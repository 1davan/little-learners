# What happens next? (`story`)

- **World:** Farm (`farm`). A row of three numbered wooden stands (one, two, three dice dots) holds the story's picture cards in order; the cards to choose from stand on the grass in front; a gently bobbing "?" sits on the stand that needs the next card. Behind the stands is the **story shelf** (the keepsake tray, 6 spots): every finished story leaves its ending card there for the rest of the level. Pip stands just off the frame at the left and walks to the shelf for the finale.
- **Goal (meta):** Hears a little picture story told card by card (egg, crack…) and picks how it ends; later puts the story cards in order and tells the finished story.
- **Levels:** 3, all with three-card stories. L1 = the narrator tells cards 1 and 2, she picks the ending from two (one from another story). L2 = the narrator tells card 1, she puts card 2 and then card 3 on the stands (two cards, no decoy). L3 = three empty stands, she puts all three in order. Six rounds each; every round is a different story.
- **Source:** `app/src/lessons/story.js`, `story-tales.js`, `story-props.js`; engine `lesson.js`, `keepsake.js`.

## The six stories (a fresh random order every game)

| Story | Cards | Card 1 line | Card 2 line | Its question (for the last card) | Ending (voiced as she tells it) |
|---|---|---|---|---|---|
| Chick | egg, cracked egg, chick | An egg! | Crack, crack! | Who comes out? | The chick hatched! |
| Flower | seed, sprout, flower | A little seed! | A tiny sprout! | What grows? | The flower grew! |
| Caterpillar | caterpillar, cocoon, butterfly | A caterpillar! | It goes to sleep! | Who comes out? | A butterfly! |
| Apple | tree with apple, apple falls, Bunny eats it | An apple tree! | The apple falls! | Who eats it? | Yum! Bunny ate the apple! |
| Rain | sun, rain, rainbow | Sunny day! | Rain! | What comes now? | A rainbow! |
| Piggy | mud puddle, muddy pig, bath | A mud puddle! | Muddy piggy! | What does piggy need? | Piggy is clean! |

Each card is a chunky frame with a tiny 3D scene and a short act with its own sound (the egg wobbles, the cracked egg wobbles and crunches, the chick cheeps and hops, the apple falls with a thunk, the butterfly's open wings beat...). The frame colour is the same on every card of a round, so the odd one out is spotted by its picture. The painted sky panel is unlit, so it stays bright in every level look. The four-card versions in `story-tales.js` are no longer used.

## Common behaviour

- **Opening:** Pip waves, "Let's tell a story!" `[voiced]`; round 1 starts 0.6 s later. Rain, snow and falling leaves are pushed behind the stands (`calmBackdrop`), so nothing falls across a picture.
- **The narrator's set-up (L1: cards 1 and 2; L2: card 1), about 2 s, all in the pick view:** the told cards come down onto their stands together (0.6 s each, 0.15 s apart, sine-eased) and thunk; at 0.6 s card 1 shows its moment and its line is said ("An egg!"); 0.85 s later card 2 does the same ("Crack, crack!"). Lines queue behind any voice still playing (round 1: the intro) and never cut each other off. A card on a stand can be tapped to see its moment again from about 0.6 s into every round.
- **The choices:** 0.3 s after the last told card starts its moment, while its line is still being said, the choice cards pop up on the grass and take a finger at once (ready about 1.9 s into the round at L1, every round including round 1); the "?" hops onto the next stand. The question follows when the last line has finished (see each level). L3 deals as the camera settles. The Go! badge (top-right) only shows while there is a card to choose.
- **Choosing a card:** tap it (it travels to the next stand) or drag it up to the stand with the "?" (zone radius 1.6); released elsewhere it goes home. It travels on a low calm arc (0.8 s + 0.13 s per unit, at most 1.7 s, sine ease, never out of the frame), lands with a thunk and squash, shows its moment, and the narrator names it (the earlier cards' lines). The ending card's line is kept for her telling. Any old "Not yet!" caption is cleared when the right card is picked.
- **Wrong card:** it goes back to its spot (0.5 s) and shakes "no" (0.7 s). L1: "Hmm, not that one!" `[voiced]`, then "Look again!" `[voiced]`. L2/L3: "Not yet! What comes first?" (first stand) or "Not yet! What comes next?" `[voiced]`. Two wrong choices turn on errorless (a halo on the right card).
- **The question:** "What happens first?" for stand 1, "What happens next?" for stand 2, and the story's own question for stand 3 ("Who comes out?"). Each is voiced once per round (the story's own question always, even inside 30 s of the same words in another story); repeats in the same round are caption only, except when she is stuck (8 s) or taps the "?".
- **Demo and hints:** the first time she picks a card in the game, a slow hand (3.8 s, a touch ends it) carries the right card to the "?" stand, with a halo. Idle: 5 s = the question (caption) + the right card bobs; 8 s = the question voiced again + bob + halo + the engine's one slow hand demo; 20 s = errorless halo; 90 s = "Bye bye! See you soon!" and home. Tapping the "?" repeats the question and bobs the right card.
- **She tells the finished story:** the other story's card (L1) fades away (0.5 s); the camera moves close to the stands (0.9 s). Card 1 plays and its line shows. Then card 2 waits for her: it breathes gently; a hand taps it after 3 s; it plays by itself only after 8 s (it is her turn). A tap on it (or on any later card) plays it with its line. Then card 3 the same way; when it plays, the ending is **voiced** ("The chick hatched!"), Pip looks over with a joyful face. Tapping an already-told card plays it again; a card not yet told waits its turn.
- **The story is kept, and the next story starts at once:** about 0.7 s after her last tap (the ending plays, 0.2 s still) the ending card arcs back onto the next spot of the story shelf (about 1 s, a soft rising note on landing) and stays all level; tap it to see its moment again. Cards 1 and 2 slide back off their stands and down behind them (0.9 s, shrinking), tucked away out of sight, and the camera backs off to the pick view. 0.45 s in, once the old cards are off the stand tops, the next story's cards come down (overlapping the shelf move). Her last tap → the next card she can touch: about 1.9 s; → the next choices: about 2.3 s (L2) / 3.2 s (L1, two told cards). In the pick view the shelf's cards peek out behind the stands. Before the finale the shelf move is let finish.
- **Mash:** Pip scared face + wiggle. No line.
- **Finale:** the empty stands fade away (props, not her work), the camera glides to the story shelf (framed so all six cards and Pip fit inside the middle 4:3 of the screen, which is what the saved photo keeps), and Pip walks over to stand beside it. "Look what you made!" (voiced once per session) for 4 s; she can tap any story on the shelf and it plays its moment. Photo of the shelf, sticker, home.

## Level 1: the narrator tells two cards, she picks the ending

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 0 | Wide farm shot, Pip waves. | "Let's tell a story!" `[voiced]` | none | n/a | n/a | n/a | Round 1 |
| 1 | Cards 1 and 2 come down together; card 1 acts, then card 2 (about 2 s with the lines); the true ending and the same moment from another story pop up on the grass while "Crack, crack!" is said; "?" on stand 3. | "An egg!", "Crack, crack!", then "Who comes out?" `[voiced]` | Tap (or drag) the ending. | Round 1: slow hand carries the right card to the "?" with a halo. | Card travels to stand 3, plays. She tells the story (taps cards 2 and 3); "The chick hatched!" `[voiced]`. The ending goes to the shelf; cards 1 and 2 tuck away. | "Hmm, not that one!", "Look again!"; ladder as Common. | Round 2 |
| 2-6 | Same with the next story. | That story's two lines and its question. | Same. | Same; the hand only if stuck. | Same. | Same. | Next round; after round 6, finale |

- **Timings (autoplay, 1366x768):** something to touch 0.6 s after every round starts (card 1 on its stand); choices ready 1.9 s into every round, round 1 included.

## Level 2: the narrator tells card 1, she puts cards 2 and 3 in order

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | Card 1 comes down and acts; while its line is said, the story's cards 2 and 3 pop up (shuffled, no decoy); "?" on stand 2. | "A little seed!", then "What happens next?" `[voiced]` | Put the card that comes next on stand 2. | Round 1: demo hand + halo; "?" bobs. | Card travels to stand 2, plays, "A tiny sprout!"; "?" hops to stand 3. | Card 3 first: "Not yet! What comes next?" `[voiced]` | 2 |
| 2 | One card left; "?" on stand 3. | "What grows?" `[voiced]` | Put the last card on stand 3. | Same. | It plays; she tells the story; the ending is voiced; the ending goes to the shelf. | Only one card left: it cannot be wrong (dropped elsewhere it goes home). | Round 2 |

- **Timings:** something to touch about 0.6 s into every round; choices ready about 1.05 s in (one told card).

## Level 3: she puts all three cards in order

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | Camera glides to the pick view; three shuffled cards pop up as it settles; "?" on stand 1. | "What happens first?" `[voiced]` | Put the first card on stand 1. | Round 1: demo hand + halo. | Card travels in, plays, its line ("An apple tree!"). | "Not yet! What comes first?" `[voiced]` | 2 |
| 2 | "?" on stand 2. | "What happens next?" `[voiced]` | Next card on stand 2. | "?" bobs. | Plays, its line. | "Not yet! What comes next?" `[voiced]` | 3 |
| 3 | "?" on stand 3; one card left. | The story's question ("Who eats it?") `[voiced]` | Last card on stand 3. | Same. | Plays; she tells the story; the ending is voiced; the ending goes to the shelf. | n/a | Round 2 |

- **Timings:** choices ready about 0.7-1.2 s into every round (they come out as the camera settles).

## Every narrator line

"Let's tell a story!"; the twelve card lines and six questions in the table above; "What happens first?"; "What happens next?"; "Not yet! What comes first?"; "Not yet! What comes next?"; "Hmm, not that one!"; "Look again!"; the six endings; "Bye bye! See you soon!"; "Look what you made!"; "You did it! A sticker!". New lines without clips yet are in `tools/voice/new-lines.txt` ("Sunny day!" and "Rain!" already have clips).
