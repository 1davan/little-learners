# Storyboard: Candy beats (`candy`)

- **World:** Home (`dressup`). A strawberry-cake stage (L1 pink, L2 mint, L3 blueberry) with a row of singing candies standing on it, a music board above them with a track of sugar tiles, a glass sweet jar on the shelf at the right end, Pip standing at the left end (it plays the tunes; Pip cannot walk here). The world's background music is paused all game: the candies are the music. Code: `app/src/lessons/candy.js`, `candy-tunes.js`, `candy-sound.js`.
- **Learning goal:** listens to a little tune played on singing candies (each colour always the same note, low to high) and copies it back; later with long and short notes; at L3 two lines of a nursery tune, played back together as the whole song with a soft band.
- **Candies (always the same pitch):** red jelly bean = C, orange wrapped sweet = D, yellow drop = E, green gummy = F, blue lollipop = G, purple gumdrop = A (low to high, left to right).
- **Levels:** 3. L1 = 6 rounds, L2 = 6 rounds, L3 = 5 rounds. The tunes are **chosen at random each time the game opens** (the order and which ones come up differ per play; none repeats within a game). The pools are listed below.
  - L1: slow (beat 0.78 s). Rounds 1-2: two candies (red, blue), two or three notes. Rounds 3-6: three candies (red, yellow, blue; "A new candy!" when the yellow one joins), two or three notes.
  - L2: faster (beat 0.6 s). Four candies (red, orange, yellow, blue) every round; three to five notes with long and short notes. Rounds alternate a nursery-tune fragment (1, 3, 5) and a rhythm pattern (2, 4, 6).
  - L3: beat 0.5 s. Rounds 1-2: five candies (red to blue), real tunes in two lines. Rounds 3-5: the purple gumdrop joins ("A new candy!"), tunes in two lines. After each round's second line the whole tune plays back together with a band.

## Voice rules for this game

- Lines here (`say`) are voiced with the clip if one exists, else the browser's robotic TTS. Only "Your turn!", "This one!", "You did it! A sticker!" and "Bye bye! See you soon!" have clips. "Listen!", "Listen again!", "Now the whole song!", "A new candy!" and the intro "Let's make candy music!" are listed as pending voice in `tools/voice/new-lines.txt` and currently fall to the browser TTS.
- The same line is voiced at most once per 30 s: since a phrase takes about 10 to 15 s, "Listen!" and "Your turn!" are caption only from the second phrase on within a 30 s window (so most phrases are narrated silently after the first).
- Tune names (for example "Hot cross buns") are shown as captions with `voice:false`: caption only. They appear after the round at L1/L2 and while the whole song plays at L3.
- Tunes never play over the narrator: the game waits for the voice clip to finish before playing a phrase.

## How a phrase plays (every round, every level)

Round set-up (first round of the game): the camera is set on the row, Pip waves, the intro line plays while each candy of the round pops onto the stage one after another, 0.32 s apart, singing its own note low to high. Each candy is tappable the moment it appears (about 0.9 s after the game opens). Rounds that add a candy: "A new candy!" `[no clip, TTS]`, the others hop to their new places and the new candy pops in singing.

Phrase (about 6 to 12 s): the music board shows empty tiles for the phrase (a short tile for each short note, a long tile for each long note); "Listen!" is said (0.05 s in on the first phrase, 0.2 s on later ones); the tune waits for the narrator, at most 1.3 s; **Pip plays the tune**: each candy in turn lights up in its colour, squishes with a jelly wobble, opens its mouth and sings, a floating note rises, and its small twin appears on the tile (that is the "answer key" for what she must copy). Pip turns toward each candy and flaps one wing. The candies stay live: a tap while Pip plays (or during a replay, the sweet's flight, or between rounds) makes that candy sing softly; it is a play-along and never counts as right or wrong. Then 0.35 s and **"Your turn!"** `[voiced]` (caption only if within 30 s of last time). The candies become tappable. The Go! badge shows for every phrase, about 0.3 s after "Your turn!" (never while Pip is playing).

Child's turn: the next tile gently pulses. She taps the candy that comes next in the tune (tap or touch, any candy of the row).
- **Right candy:** it sings, its tile fills with that candy's colour and hops.
- **Long notes (long tiles) are press-and-hold:** while her finger stays down the candy keeps singing with its mouth open and glowing, and the long tile fills from left to right in the candy's colour over the note's length. Letting go early still counts (never a fail): the candy finishes the note itself and the tile fills the rest of the way in about 0.4 s. Holding longer than the note simply ends it when the tile is full. The first long note of the game gets a slow hand demo that presses and holds on that candy (about 1.2 s). After the last tile: a sparkle run up the whole row (each candy bobs in turn as a note plays), Pip hops with a joy face, a small twin of the last candy flies up and drops into the open sweet jar through its mouth, then over to the lowest free spot on the pile (clink; it stays there all game; lollipops lie on their side; sweets never overlap and ten always fit below the neck) in about 1.5 s; then 0.4 s and the second line (L3) or the end of the round.
- **Wrong candy:** it still sings, softly (it's music), the current tile wiggles; 0.5 s later the right candy plays its note with a halo (1.4 s), Pip turns toward it and "This one!" `[voiced]` is said. Counted per round.
- **Nothing (the engine ladder; every touch restarts it):** 5 s: "Listen again!" `[no clip, TTS]` and Pip replays the whole phrase (tiles she filled stay filled); 8 s after that: the next candy sings its note, hops with a halo, and a ghost hand taps it (presses and holds for a long note); 20 s: errorless (see below, with another replay); 90 s: "Bye bye! See you soon!" `[voiced]` and Home. Because a touch restarts the ladder, the hand comes back for each new note she gets stuck on.
- **Errorless (after two wrong taps in a round or 20 s idle):** every candy except the one that is next goes grey and cannot be tapped. After each right note the grey moves on: the next note's candy lights up and becomes the only playable one, so she can always finish the phrase. It clears at the end of the phrase.

First phrase of the game only: 0.5 s after "Your turn!" a slow ghost hand taps the right first candy (2.5 s; touches ignored for that time). It gives the answer (it is the actual next candy).

**Between rounds (L1, L2):** caption of the tune's name `[caption only]` (for example "Hot cross buns"), 1.2 s, then the next round. **L3 after the second line:** the tiles disappear, "Now the whole song!" `[no clip, TTS]`, the caption "<tune name>!" `[caption only]`, then the whole tune (both lines, or per the `full` order) plays with a soft band (pad chords, bass, brush) while each candy lights and sings in time and Pip bobs. About 10 to 20 s; she can play along (every candy is live, the next one glows half a beat early, any tap sings softly with a sparkle, no wrong notes).

## Tune pools (which tunes can come up)

Notes: C red, D orange, E yellow, F green, G blue, A purple. `:2` long ("ta-a"), `:0.5` short ("ti"), `:1.5` dotted. Each phrase is one line.

| Level | Pool and slots |
|---|---|
| L1 rounds 1-2 (red + blue) | pick 2 of: "Up!" C G; "Down!" G C; "Ding ding dong" C C G; "Dong dong ding" G G C; "Hop, hop" C G:2 |
| L1 rounds 3-6 (red, yellow, blue) | pick 4 of: "Cuckoo!" G E:2; "Cuckoo, cuckoo!" G E G; "Up the stairs" C E G; "Down the stairs" G E C; "Peekaboo" E E G; "Bounce, bounce" C E C; "Hello!" E G |
| L2 rounds 1, 3, 5 (tune fragments) | from: "Hot cross buns" E D C:2; "Mary had a little lamb" E D C D; "Little lamb" E E E:2; "Rain, rain, go away" G E G:0.5 G:0.5 E; "Jingle bells" E G C:1.5 D:0.5 E:2; "Twinkle, twinkle" C C G G; "Frère Jacques" C D E C; "E-I-E-I-O" E E D D C:2; "Row, row, row" C C C:0.5 D:0.5 E:2 |
| L2 rounds 2, 4, 6 (rhythm) | from: "Ta, ta, ti-ti, ta" C C C:0.5 C:0.5 C (and a second version G G E:0.5 E:0.5 G); "Long, short, short" C:2 G G; "Ti-ti, ti-ti, ta-a" E:0.5 E:0.5 D:0.5 D:0.5 C:2; "Ti-ti, ta" D:0.5 D:0.5 E |
| L3 rounds 1-2 (five candies) | pick 2 of: "Mary had a little lamb" (E D C D E E E:2 / D D D:2 E G G:2); "Row, row, row your boat" (C C C:0.75 D:0.25 E:2 / E:0.75 D:0.25 E:0.75 F:0.25 G:2); "Frère Jacques" (C D E C / E F G:2; plays back as 4 lines: line 1 twice then line 2 twice); "Ode to joy" (E E F G / G F E D); "Jingle bells" (E E E:2 E E E:2 / E G C:1.5 D:0.5 E:2) |
| L3 rounds 3-5 (six candies) | pick 3 of: "Twinkle, twinkle, little star" (C C G G A A G:2 / F F E E D D C:2); "Baa, baa, black sheep" (C C G G / A:0.5 A:0.5 A:0.5 A:0.5 G:2); "Old MacDonald" (C C C G A A G:2 / E E D D C:2); "London Bridge" (G:1.5 A:0.5 G F E F G:2 / D E F:2 E F G:2) |

## Level 1: two, then three candies (6 rounds)

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| Intro | Pip waves at the left of the cake stage. Camera on the row. | "Let's make candy music!" `[no clip, TTS]` | | | | | Round 1 |
| 1 set-up | The red jelly bean pops onto the stage and sings low, then the blue lollipop pops in and sings high. | none | listen | | | | 1a |
| 1a listen | Empty tiles on the board. Pip plays (two or three notes), each candy lit and singing, its twin appearing on its tile. | "Listen!" `[no clip, TTS]` | watch and listen (about 3 to 4 s of music) | | | | 1b |
| 1b copy | Candies glow ready; the next tile pulses. First time in the game: a ghost hand taps the first right candy (2.5 s). | "Your turn!" `[voiced]` | Tap the candies in the same order (red/blue). | The pulsing tile; the first-time hand; Go!. | Each right tap: the candy sings, its tile fills in colour. After the last: sparkle run, Pip hops, a sweet flies into the jar. Caption: the tune name (for example "Up!") `[caption only]`. | Wrong candy: sings softly, "Listen again!" `[no clip, TTS]`, the right one plays and glows. Idle: see ladder. | Round 2 |
| 2 | Same two candies, another tune from the pool. Listen then copy. | "Listen!" (caption only if within 30 s), "Your turn!" | as 1b (no hand demo) | | | | Round 3 |
| 3 set-up | "A new candy!" `[no clip, TTS]`; red and blue hop apart, the yellow drop pops in the middle singing. | "A new candy!" | | | | | 3a |
| 3 to 6 | Three candies (red, yellow, blue). Each round is one tune of two or three notes: Listen, Your turn, copy; sweet into the jar; the tune's name. | "Listen!" / "Your turn!" (voiced at most once per 30 s) | Tap the notes in order | tile pulse | as 1b | as 1b | Next round, then the finale after round 6 |

- **Ending:** after round 6's sweet, 1.2 s, then the finale: Pip stays; the whole row plays one last happy run (candies sing softly in turn); "Look what you made!" `[no clip, pending voice]` caption for at least 4 s, framed on the candy row and the jar of six sweets (`creationView`). During it she can poke the creation: a candy sings its note softly, the jar clinks with a little squash. Photo; rain; "You did it! A sticker!" `[voiced]`; Home.
- **Timings (measured, real mouse play, L2):** the first candy is tappable 1.2 s after the game opens and the candies never switch off again (play-along outside her turn). "Listen!" to "Your turn!" is 4.1 to 5.3 s (the tune itself); round 1's "Your turn!" comes 8.0 s after the game opens. Last note to next round: about 3 s of sparkle run and sweet into the jar, then 1.2 s, all with the candies live.
- **Every narrator line (L1):** "Let's make candy music!" `[no clip, TTS]`; "Listen!" `[no clip, TTS]`; "Your turn!" `[voiced]`; "Listen again!" `[no clip, TTS]`; "A new candy!" `[no clip, TTS]`; tune names as captions `[caption only]` (Up!, Down!, Ding ding dong, Dong dong ding, Hop, hop; Cuckoo!, Cuckoo, cuckoo!, Up the stairs, Down the stairs, Peekaboo, Bounce, bounce, Hello!); "Look what you made!" `[no clip]`; "You did it! A sticker!" `[voiced]`.

## Level 2: four candies, long and short notes (6 rounds)

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| Intro | As L1; the four candies (red, orange, yellow, blue) pop in singing, one after another. | "Let's make candy music!" `[no clip, TTS]` | | | | | Round 1 |
| 1 (tune) | Tiles: a short tile per quarter note, a long tile for a held note. Pip plays a three-to-five note fragment, for example E D C:2 ("Hot cross buns"). Long notes ring out longer and the candy keeps its open mouth longer. | "Listen!" `[no clip, TTS]`, then "Your turn!" `[voiced]` | Tap the notes in order; press and hold the candy for a long tile (the tile fills while she holds; an early release still counts). | Next tile pulses; first-time hand demo (round 1 only); the first long note gets a press-and-hold hand demo. | As L1; the tune's name appears at the end. | As L1. | Round 2 |
| 2 (rhythm) | A rhythm pattern such as C C C:0.5 C:0.5 C on one candy, or C:2 G G. Tiles show narrow short tiles for the quick notes. | "Listen!" / "Your turn!" | Tap in order | | "Ta, ta, ti-ti, ta" etc. `[caption only]` | | Round 3 |
| 3 to 6 | Alternating tune fragments and rhythm patterns (3 and 5 tunes, 4 and 6 rhythm), each from the pool. | | | | | | Finale after 6 |

- **Ending:** as L1 (jar of six sweets, finale run, "Look what you made!" framed on the row and jar, pokeable, sticker).
- **Tunes:** only one of the two "Ta, ta, ti-ti, ta" patterns can come up in a game, so no name shows twice.
- **Timings:** a phrase is about 8 to 14 s (the beat is shorter, but phrases are longer). First round adds the candies popping in (about 2.5 s).
- **Every narrator line (L2):** as L1 minus "A new candy!"; tune and rhythm names `[caption only]` as in the pool table.

## Level 3: real tunes in two lines, the whole song (5 rounds)

Each round has two phrases (the two lines of the tune). For each line: tiles, "Listen!", Pip plays the line, "Your turn!", she copies it, a sweet goes in the jar. After the second line: "Now the whole song!", the caption of the tune name with "!", and the full tune plays with the band. So 10 sweets in the jar by the end.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| Intro | As L1; five candies (red to blue) pop in singing. | "Let's make candy music!" `[no clip, TTS]` | | | | | Round 1 |
| 1a | Line one of a tune (six to eight notes, some long). | "Listen!" / "Your turn!" | Copy the line. | Next tile pulses; first-time hand demo; Go!. | Sweet in the jar. | Wrong: "Listen again!", the right candy plays and glows. After two wrong in the round (it counts across both lines): errorless, see below. | 1b |
| 1b | Line two. | "Listen!" (caption only) / "Your turn!" (caption only) | Copy it. | | Sweet in the jar. | | 1c |
| 1c | Tiles go away. The camera stays. The candies play the whole tune in time with a soft band and Pip bobbing. | "Now the whole song!" `[no clip, TTS]`, caption "<tune name>!" `[caption only]` | Play along: every candy is live; the candy whose note is next glows half a beat early; any tap sings softly with a sparkle. No wrong notes. | the early glow | | | Round 2 |
| 2 | Another five-candy tune, same pattern. | | | | | | Round 3 |
| 3 set-up | "A new candy!" `[no clip, TTS]`: the purple gumdrop pops in at the right singing its high note, the row spreads to six. | "A new candy!" | | | | | 3a |
| 3 to 5 | Six candies. Tunes of six to eight notes per line (Twinkle, Baa baa, Old MacDonald, London Bridge: three of the four). Same pattern. | as above | | | | | Finale |

- **Ending:** after the last whole-song playback: the finale run (each candy sings softly), "Look what you made!" `[no clip, pending]` for at least 4 s framed on the row and the full jar (candies and jar pokeable), photo, rain, "You did it! A sticker!" `[voiced]`, Home.
- **Timings:** each round is about 35 to 60 s (two lines of 8 to 15 s each plus the 10 to 20 s whole song). During the whole song she can play along (every candy is live).
- **Every narrator line (L3):** "Let's make candy music!"; "Listen!"; "Your turn!" `[voiced]`; "Listen again!"; "Now the whole song!"; "A new candy!"; "<Tune name>!" `[caption only]` for each tune: Mary had a little lamb!, Row, row, row your boat!, Frère Jacques!, Ode to joy!, Jingle bells!, Twinkle, twinkle, little star!, Baa, baa, black sheep!, Old MacDonald!, London Bridge!; "Look what you made!"; "You did it! A sticker!" `[voiced]`. All others except where marked are `[no clip, TTS]`.

## Fixed in the fix pass (audit C1 to C8)

- **C1 errorless dead end:** fixed. After each right note `advance()` re-runs `makeErrorless()`, so the playable candy moves on to the next note. Verified with real mouse play (two wrong taps, then the rest of the phrase on different candies).
- **C2 Go!:** off while the phrase plays, re-armed at "Your turn!" for every phrase.
- **C3 long notes:** press-and-hold with a filling tile (above).
- **C4 whole song:** play-along.
- **C5 wrong tap:** "This one!" as the right candy sings ("Listen again!" stays for the idle replay).
- **C6 stuck hand:** the game's own once-per-phrase 8 s hand was removed; the engine ladder's hand (restarted by every touch) shows the next candy, and no longer runs at the same moment as a phrase replay that switched the candies off.
- **C7 ending:** `creationView`, `creationObjects` (row and jar) and `onAdmirePoke`. The finale locks answers, so the game catches pokes itself during the admire.
- **C8 duplicate rhythm name:** fixed in `makePlan()`.
- **Final review P1-3 (rule 0):** candies stay live all game (soft play-along outside her turn, never counted); the pre-roll before the first phrase is cut so she can touch a candy 1.2 s after opening. **P2:** the music-board tiles are drawn 1.45x taller with bigger twins, and the track may use more of the board (gap 0.1, width 6.6), so L3's seven-tile lines read.
- **Also fixed (visual review):** the row is spaced by the candies' real widths (the jelly bean and wrapped sweet used to overlap with six candies); errorless greying is a pale wash, not a dark muddy tint; the twins on the music board fit inside their tiles; the jar has no lid (it used to float aside for each sweet) and sweets are packed without overlapping; at L3 the finale puts her last line back on the board, every tile filled.
- **Still open:** "Listen!", "Listen again!", "Now the whole song!", "A new candy!" and the intro have no clips yet (TTS); while TTS speaks, `voiceIdle()` doesn't cover it, so a replayed tune can start over the robotic voice. This goes away once the clips are recorded.
