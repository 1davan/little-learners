# Storyboard: Dress Monkey (`dress`)

- **World:** Home (`dressup`), a cosy bedroom: wallpaper, wooden floor, round rug, a window showing the outfit's weather, a wall mirror, an always-open pink wardrobe on the right, a Blender clothes rail (turned pink posts on bun feet, gold bar) in front of it. Pip watches from the back. Code: `app/src/lessons/dress.js`, `dress-clothes.js`, `dress-room.js`, `dress-moves.js`, `dress-sound.js`; models `tools/blender/creatures/monkey.py` (garment layers), `prop_dress_rail.py` (rail, coat hanger, trouser hanger, peg clip).
- **Learning goal:** puts each garment on the right body part (hat on head, top on body, shoes on feet); L3 also dresses for snowy weather.
- **Levels:** 3 (chosen by the parent). One whole outfit per level, one garment per round: L1 = 4 rounds, L2 = 5 rounds, L3 = 6 rounds. Only ONE garment is offered per round, so there is never a wrong garment. The only "wrong" is, on L2 and L3, putting it on the wrong body part.
- **Build-up object:** Monkey's outfit. Everything she puts on stays on all level; the emptied hangers collect at the end of the rail; the ending frames dressed Monkey beside his reflection.

## How the voice works here (applies to every beat)

- `success(...)` lines ("T-shirt on!") are caption only. Spoken: the round's instruction, the redirects, the intro, the sticker line.
- A line is voiced at most once per 30 s; repeats show the caption only.
- New wording that has no recorded clip yet falls back to the older, already-voiced wording (no robot voice): "Shoes! Put them on Monkey!" falls back to "Sneakers! Put them on Monkey!"; "Oops! On Monkey's head!" (etc.) falls back to "On Monkey's head!". All new lines are in `tools/voice/new-lines.txt`; once recorded they are used automatically.

## Common beat structure (every round, every level)

Camera fixed all game (pos 1.6, 3.5, 13.2). Monkey stands on the rug at left, the wardrobe at right, the rail in front of it.

- **The garment arrives during the last round's show-off.** About 0.5 s into Monkey's move, the last empty hanger slides along to the right end of the rail (a soft slide), the wardrobe draws a silent breath (0.3 s squash, no sound), then the next garment hops out on its own hanger (0.7 s arc) and hooks over the bar with a small wooden "tok", swinging a little. Round 1's garment arrives while Pip says hello.
- **Round start (taps open about 0.35 s after the round starts):** the thought bubble pops in up and to the right of Monkey's head (trail of dots toward his ear). One design at every level: a plain bubble with the real 3-D garment turning in it; L3 adds a small snowflake badge on its rim. Once his move has finished, Monkey shows the bare body part with a gesture ("hmm?", or a shivery "brrr" in the snow). On L1 and L2 that body part glows softly; on L3 it does not.
- **How garments hang:** tops (T-shirt, party dress, jumper, dungarees) on a wooden coat hanger, hook out of the collar; everything else pegged to a trouser hanger with wooden clips (shorts and tutu by the waistband, shoes and mittens one clip each, hats, bow tie and glasses by their top). The shorts and the tutu are shown on the rail and in the bubble as dedicated "hung up" shapes (`cloth_legs_shortsflat`: waistband, two legs, a notch between; `cloth_legs_tutuflat`: satin waistband over two tiers of scalloped tulle), because their worn shells read as a tub and a swim ring on their own; the pull-on swaps to the worn shell halfway. Mittens hang by their cuffs, thumbs out to the side. The party dress's bow is its own crisp layer (`cloth_body_dressbow`), worn with the dress.
- **Her turn:** drag the garment (grab area = the whole garment) onto Monkey. Lifting it off swings the hanger, one soft cloth sound. While carrying, Monkey's head follows it and over him he lights up with a delighted face.
- **Right drop (D7, SATISFACTION 16.1):** the garment is pulled on in 0.6 s from where you would put it on from (a hat from above as Monkey ducks into it; a top from the front, then his arms push through the sleeves; trousers from below with a little hop; shoes with a foot wiggle), a little stretched then snug, with ONE soft cloth "fwump". No puff, no sparkle. The bubble goes. A 0.3 s still beat, then Monkey's own move for that garment (the character reacts, not the screen: no floating emoji). Caption of the done line. Pip turns and nods or claps. The garment stays on all level.
- **Wrong part (L2, L3):** the garment glides back to its hanger, Monkey shakes his head with a giggle and points at the right part, which now glows; "Oops! On Monkey's legs!" (voiced); 0.9 s later one slow hand demo carries the garment to the right part (once per round). After 2 wrongs: errorless (halo + glow).
- **A tap on the garment:** L1 puts it on. L2 and L3: it only wiggles on its hanger and the prompt repeats (caption; voice only after 30 s) - a tap is never a shortcut to the answer (D5).
- **Dropped away from Monkey:** glides back to its hanger. Nothing else.
- **Stuck ladder:** 5 s the line again + bubble wobble + gesture + garment hop; 8 s one slow hand demo (once per garment); 12 s line + hop + halo + demo; 20 s errorless (part glows, garment halo); 90 s "Bye bye! See you soon!".
- **Go! badge:** shows once the round is ready; never during the show-off or the mirror ending (the pending badge is cancelled on a right drop).
- **Judging (L2, L3):** the drop point is compared on screen with every body-part anchor; the right part wins if it is within 1.5x the nearest part's distance, or within 8% of the screen's short side. Dungarees also accept the tummy (their bib is there) and the tutu the tummy.

## Level 1: a sunny day (4 rounds, anywhere on Monkey, tap also works)

Window: sunny sky. Intro: Pip waves, "Monkey wants to get dressed!" `[voiced]`; the T-shirt hops onto the rail meanwhile.

| # | Garment (how it hangs) | Narrator says | Glow / gesture | Monkey's move | Caption |
|---|---|---|---|---|---|
| 1 | Stripy T-shirt (coat hanger) | "A T-shirt! Put it on Monkey!" | chest; pats tummy | flexes (arms out, a little bounce) | "T-shirt on!" |
| 2 | Orange shorts (two clips at the waistband) | "Shorts! Put them on Monkey!" | legs; looks down | wiggle with a chatter | "Shorts on!" |
| 3 | Sneakers (one clip each) | "Shoes! Put them on Monkey!" (until recorded: "Sneakers! Put them on Monkey!") | both feet; lifts each foot | runs on the spot | "Shoes on!" |
| 4 | Sun hat (one clip on the crown) | "A sun hat! Put it on Monkey!" | head; hand to head | gentle hat tip | "Hat on!" |

Round 1 opens with the one hand demo (lifting the T-shirt off its hanger and carrying it to Monkey's chest, 2.4 s; any touch ends it).

## Level 2: a party (5 rounds, the right body part; the part glows)

Window: pink party sky with balloons. The middle step (D1): the part still glows and Monkey points at it, but the garment must land there, and a tap no longer puts it on.

| # | Garment | Narrator says | Part (also OK) | Move | Caption | If wrong |
|---|---|---|---|---|---|---|
| 1 | Party dress (coat hanger) | "A party dress! Put it on Monkey!" | tummy | half-twirl each way, skirt swishing, face to the child | "So pretty!" | "Oops! On Monkey's tummy!" |
| 2 | Tutu (clips) | "A tutu! Put it on Monkey!" | legs (tummy) | sway on tiptoe, arms up | "Twirl twirl!" | "Oops! On Monkey's legs!" |
| 3 | Bow tie (clip) | "A bow tie! Put it on Monkey!" | neck | a bow, two notes | "Bow tie on!" | "Oops! Round Monkey's neck!" |
| 4 | Heart glasses (clip) | "Heart glasses! Put them on Monkey!" | eyes; a calm squint (D6) | sway, joy face | "Glasses on!" | "Oops! On Monkey's eyes!" |
| 5 | Party hat (clip on the pompom) | "A party hat! Put it on Monkey!" | head | hop with arms up, joy face (D6) | "Party hat on!" | "Oops! On Monkey's head!" |

## Level 3: a snowy day (6 rounds, the right body part, no glow)

Window: snowy sky. The bubble carries a snowflake badge. Monkey shivers a little at the start; the shiver fades with every garment and is gone once he is dressed (SATISFACTION 16.5). No glow until a wrong drop or 20 s stuck.

| # | Garment | Narrator says | Part (also OK) | Move | Caption |
|---|---|---|---|---|---|
| 1 | Dungarees (coat hanger, straps over it) | "Dungarees! Put them on Monkey's legs!" | legs (tummy, D3) | hops | "Dungarees on!" |
| 2 | Cosy jumper (coat hanger; worn over the dungarees, whose bib is hidden under it) | "A cosy jumper! Put it on Monkey's tummy!" | tummy | hugs himself | "Nice and cosy!" |
| 3 | Wellies (one clip each) | "Wellies! Put them on Monkey's feet!" | feet | stomps with little splashes | "Stomp stomp!" |
| 4 | Scarf (two clips) | "A scarf! Put it round Monkey's neck!" | neck | cosy hug | "Scarf on!" |
| 5 | Woolly hat (clip on the pompom) | "A woolly hat! Put it on Monkey's head!" | head | cosy hug | "Warm head!" |
| 6 | Mittens (a pair hung by their cuffs) | "Mittens! Put them on Monkey's hands!" | hands | claps | "Warm hands!" |

Wrong part: "Oops! On Monkey's legs!" etc., glow on, hand demo once.

## Ending (every level)

1. After the last move, the wardrobe doors swing shut (thunk), the emptied hangers sit at the end of the rail, Pip walks off behind the rail (out of the picture), and Monkey walks to the mirror (gait from the motion layer), seen whole in the room view, turning three-quarter to the child. Then the camera moves in (1.0 s) to frame Monkey and the mirror, with the caption clear of the mirror's bow. The glass clears: there is his reflection in the same outfit, facing out (a separate copy with the pose mirrored bone by bone, so its face is whole). Monkey gasps with a joy face and a little arms-up bounce.
2. "Look what you made!" (engine finale, 6 s admire). Each poke on Monkey or the reflection strikes the next of his outfit's poses (up to 4), and the reflection copies it. Nothing plays by itself (no extra dance, SATISFACTION 16.2/16.3).
3. The photo is taken in that frame (Monkey and the mirror), the sticker, Home. Home shows the photo.

## Timings (measured on a full autoplay, Nov 2026)

- Round start to taps open: 0.32-0.38 s on every round (round 1: 0.33 s on L1, 0.32 s on L2, 0.75 s on L3).
- Right drop to the next round's taps open: about 2.0-2.1 s (0.6 s pull-on, 0.3 s beat, the move under way while the next garment hooks on).
- Ending: about 3 s walk and reveal, then 6 s admire with pokes, photo, sticker.
