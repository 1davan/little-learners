# How does Pip feel? (id: `feelings`)

- **World:** Meadow.
- **Learning goal:** name basic emotions (happy, sad, angry, scared). She matches a friend's face to Pip's, then comforts Pip in the right way.
- **Levels:** 3 (6 rounds each). L1 the picnic hill, L2 the toy table, L3 the tree stump in the snowy garden.
- Source: `app/src/lessons/feelings.js` (+ `feelings-stories.js`, `feelings-props.js`).
- Updated for the fix pass (AUDIT-meadow F1–F7, QA feelings 1–28).
- Tags: `[voiced]` has a clip; `[to record]` is in `tools/voice/new-lines.txt` and silent until recorded; `[caption only]` is never spoken.

## Behaviour shared by every round

- **Story and friends together (rule 0):** a short story, one quick moment of about 1.5–2 s (a present drops and pops open, the scoop rolls off, a ball knocks the tower over, a bee zooms in…), plays on Pip's stage. **At the same time** two or three friends step in from just beside their places, growing smoothly, each showing a feeling face. Two friends stand at x ±3.9 (scale 1.05); with three, at x -4, 0, 4, the middle one forward and smaller. **Taps open about 0.6–0.9 s into the round.** At the story's peak Pip's face changes, the feeling is **named at that instant**, "Pip is sad." `[to record]`, and the prompt follows: "Find a sad friend!" `[to record]`. If she taps the right friend before the peak, that's fine: the story completes before the comforting starts.
- **Wrong friend:** it makes its own feeling sound, hops, and its feeling icon floats over it. "That one is happy. Find a sad friend!" `[to record]`. After 2 wrong taps the others shrink (errorless).
- **Right friend:** the comforting starts **at once** (it is on Pip, who is already there), and the friend joins in when it arrives. The other friends walk off at the sides. The chosen friend walks to the foot of the stage (about 3 units/s) and makes one hop up (0.8 s; up first, then over, so it clears the stage's front). It lands beside Pip on his left (the story props are on his right). There is no flying.
- **Comforting (her action):** the camera glides close again, and the instruction is voiced:
  - **sad, scared:** "Give Pip a hug!" `[to record]`. She presses and holds Pip (or the friend). While she holds, they lean together and squeeze, and Pip's face goes sad (or scared), then calm, then happy over 1.5 s of holding. Letting go relaxes the hug and keeps the progress.
  - **angry:** "Big breath with Pip!" `[to record]`. She presses and holds: both slowly puff up. When she lets go after a real breath in, they breathe out (one whoosh), shrink back and calm down. A short press just puffs and settles.
  - **happy:** "Tap Pip! Happy dance!" `[to record]`. Each tap is one spin-hop together; after three, the dance is done.
  - A slow ghost-hand demo shows the gesture the first time it appears in a game (a long press, or two taps). After 6 s with nothing, the line is said again and the demo replays. After 11 s it happens by itself.
- **Then:** both smile and gently let go, and the next round's friends step in at once. Meanwhile the story is put right (a new scoop, the tower rebuilt, the bee settles beside a flower…), with no floating hearts, and the next story starts when that is done. The friend hops down the stage's left side (a low hop) and **walks to sit with the friends who stayed**, on the grass at the stage's left (two rows of three, 1.6 apart). They stay all level.
- **Stuck ladder during the choice:** 5 s, the prompt again plus the right friend hops. 8 s, spoken again, a glow, and the hand demo (it points at the tummy, so the face stays visible). L3 uses a scan over all friends instead, so the answer is not given away. 20 s, errorless.

## Level 1: picnic hill (friends: bear, bunny, kitty, hedgehog)

| # | Story | Pip feels | Friends | Gesture |
|---|---|---|---|---|
| 1 | A present drops and pops its lid (a star). | happy | happy, sad | tap dance |
| 2 | The ice-cream scoop rolls off. | sad | sad, happy | hug |
| 3 | A ball knocks the cup tower over. | angry | angry, happy | big breath |
| 4 | The balloon floats away. | sad | sad, angry | hug |
| 5 | A thunder cloud (low, clear of the caption). | scared | scared, happy, sad | hug |
| 6 | A cupcake. | happy | happy, angry, scared | tap dance |

## Level 2: toy table (friends: frog, kitty, piggy, bunny)

| # | Story | Pip feels | Friends | Gesture |
|---|---|---|---|---|
| 1 | The ball rolls away. | sad | sad, happy | hug |
| 2 | The block tower falls. | angry | angry, sad | big breath |
| 3 | A jack-in-the-box. | scared | scared, happy, angry | hug |
| 4 | A present bursts with balls (clear of Pip's wing). | happy | happy, sad, angry | tap dance |
| 5 | A frog takes the ball. | angry | angry, scared, happy | big breath |
| 6 | A spider drops down (clear of his wing). | scared | scared, sad, angry | hug |

## Level 3: tree stump (friends: hedgehog, sheep, bear, bunny)

| # | Story | Pip feels | Friends | Gesture |
|---|---|---|---|---|
| 1 | The flower loses its petals. | sad | sad, happy, scared | hug |
| 2 | Acorns rain down (now acorn-sized); one bonks him. | angry | angry, sad, happy | big breath |
| 3 | A mole pops up. | scared | scared, sad, angry | hug |
| 4 | A butterfly. | happy | happy, scared, sad | tap dance |
| 5 | The pot tower falls. | angry | angry, scared, happy | big breath |
| 6 | A bee zooms round; the fix sees it hover beside a flower. | scared | scared, angry, sad | hug |

## Ending (all levels)

- Everyone who stayed walks into **one row in front of the stage** (1.7 apart), one after another (the one nearest the stage first, to the far end), and turns to the child. The camera frames Pip's stage and that row, fitted to the 4:3 photo (`creationView`, from the row's width). The others have walked off; everyone smiles. The present in the first story now rests on the blanket after it opens, and the friend on the picnic hill stands clear of the basket.
- Admire, at least 4 s: "Look what you made!" `[to record]`. Poking a friend who stayed makes it beam and giggle.
- Photo, "You did it! A sticker!" `[voiced]`, the sticker, Home.

## Timings (measured, autoplay, round start → input open)

- Round start → taps open (measured, autoplay): L1 0.64, 0.62, 0.63, 0.62, 0.88, 0.86 s. L2 0.60, 0.61, 0.86, 0.86, 0.88, 0.85 s. L3 0.87, 0.85, 0.86, 0.87, 0.87, 0.86 s.
- The story peak (the feeling named, then the prompt) comes 1.2–2.3 s into the round (measured over all 18 stories).
- After the right tap: about 2–3 s walk and hop, then the comforting (hers), then about 1–2 s for the story fix.

## Every narrator line

- Intro "How does Pip feel?" `[voiced]`.
- Labels (`[to record]`): "Pip is happy.", "Pip is sad.", "Pip is angry.", "Pip is scared.".
- Prompts (`[to record]`): "Find a happy friend!", "Find a sad friend!", "Find an angry friend!", "Find a scared friend!".
- Gestures (`[to record]`): "Give Pip a hug!", "Big breath with Pip!", "Tap Pip! Happy dance!".
- Redirects (`[to record]`): "That one is {x}. Find a/an {y} friend!", 12 lines.
- Ending: "Look what you made!", "You did it! A sticker!".

## Not done (see the fix report)

- AUDIT F6 asks that the put-right story props be kept at the back, scaled down. They settle away slowly (0.5 s) at the next round instead. The friends who stayed are the level's build-up and the finale's subject.

## Timing after the release review (rule: her last action → the next thing she can answer ≤ 2 s)

- Her comforting done → the next friends can be tapped: 0.6–0.86 s. Friend tap → comforting open: at once if she taps after the feeling is named; 1.6–2.5 s when tapped before the story's peak (the story completes first).
