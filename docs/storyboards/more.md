# Which has more? (id: `more`)

- **World:** Beach (world id `beach`), "More!" (icon 🐚). Source: app/src/lessons/more.js and more-items.js; models in tools/blender/creatures/prop_stall.py, prop_jar.py, prop_wagon.py and prop_morebead.py.
- **Learning goal:** taps the group that has MORE, sees the extras that are left over when the two groups pair up one-to-one, then feeds them to a hungry friend with her own finger. "More" only: "fewer" is an adult word (understood around age 4) and is not used anywhere in the game.
- **Build-up object:** the hungry friend (Gull, Duck or Crab) gets a little rounder with every snack she feeds it and stays round all level. The finale shows the round, full friend.
- **Levels:** 3, 6 rounds each. Every round brings a new snack or beach thing and new holder colours. L1: big differences (1 v 4, 5 v 1, 2 v 6, 3 v 1, 1 v 5, 6 v 2). L2: closer counts (2 v 4, 5 v 3, 3 v 6, 4 v 2, 3 v 5, 6 v 4). L3: still a clear ratio (2 v 5, 6 v 3, 3 v 6, 2 v 5, 4 v 2, 3 v 6) with a size trap and a spacing trap.
- Meta intro line: "Let's find more!" [voiced]

## Engine behaviour that applies to every round (engine/lesson.js)

- **Go! gate:** taps open as soon as the round is laid out; the Go! badge shows when the game is ready (forced after 3 s).
- **One hand demo per game:** at the start of round 1 (after the prompt) the hand taps the right holder (L3: it scans both holders without choosing). Any touch ends it. The first feeding of the game gets its own slow hand demo on the friend (see below).
- **Idle ladder (resets on every touch):** 5 s prompt again + nudge 1; 8 s prompt again (voiced again) + nudge 2 + the hand demo again; 20 s errorless; 90 s "Bye bye! See you soon!" [voiced] and Home. This game's nudges: while choosing, nudge 1 = the friend looks from one holder to the other (no hop: with two choices a hop would give the answer away); nudge 2 = the right holder hops and glows for 3 s. While feeding: the friend bounces and flaps. Errorless while choosing: the wrong holder shrinks a little and stops answering; while feeding: the friend helps itself, one snack every 0.6 s.
- **Wrong answer** (`redirect`): input locks 0.7 s, the redirect line shows; the 2nd wrong answer switches on errorless.
- **Voice:** a line is voiced only if its text is in assets/voice/index.json, at most once per 30 s (repeats are caption only). New lines are queued in tools/voice/new-lines.txt (marked [queued]: caption only until voiced).
- **Success** (quiet, after the last snack is eaten): Pip watches with a joy face, about 0.6 s of stillness, the next round.
- **Finale:** see "Ending" below; "Look what you made!" (voiced once per session) for 5 s while the friend is pokeable; photo (saved to the gallery); rain, 3-note resolve, "You did it! A sticker!" [voiced], sticker, Home.

## How a round works (all levels)

- **Layout:** two holders (left and right, x -3.75..-3.9 and +3.75..+3.9), the hungry friend on the sand in the gap between them, in front, facing her; Pip watches from behind it in the gap. Backdrop props that lined up with the holders or the friend (lantern posts, sailboats, the bonfire) are hidden in this game; the sunset sun sets just off the left edge (its glow and its glitter path follow), the night moon sits lower and further right, so nothing sits behind a holder, the rows or a button.
- **Set-up (about 0.6-1.1 s):** last round's leftovers (the group she did not pick, still in its holder) settle away (0.45 s). The holders get the round's new colours and a soft squash. Both groups drop in TOGETHER, one thing every 0.1 s, each straight into its own spot on the holder's floor (a short fall, a landing squash, one soft "pup" per landing), so each group stands in a neat, countable line. Both groups are drawn at ONE size per round (from the bigger group), so neither looks like more just by being bigger (except on the L3 size-trap round). The friend calls and bounces once as things start to fall. Taps open as soon as the last thing lands.
- **Prompt:** "Tap the one with more <things>!" [queued] (fish / shells / stars / ice creams / balls / cookies), the same form every round.
- **Targets:** each holder is one big tap target (radius 2.3 around its middle).
- **Wrong holder:** the friend looks at that holder, shakes its head, then looks at the right one; the holder gives a small wobble; "Not that one! Find more!" [queued].
- **Right holder (the match-up, the lesson, at most about 1.9 s):** caption "More!" at once. Both groups hop up out of their holders (0.6 s; forward from under the stall's awning; straight up out of the open jar or wagon, never through a wall) into two rows above the holders and below the caption, the left group on top, the right group below, in the same columns. A string of yellow beads joins each pair, one pair every 0.3 s (0.22-0.3 s when there are 3-4 pairs), each on the next note of the tune (`sfx.step`), and the two partners give a little squash. The extras, with no partner, wiggle and glow: "More!" [voiced] is spoken right then, and feeding opens at once. The pairs stay up to look at until her first gulp (or 1.2 s); then the beads go and the group she did NOT pick hops back home into its holder (and stays there until next round).
- **She feeds the friend (her action, one gulp per touch):** the chosen row stays up as the friend's dinner. "Feed Gull! Tap Gull!" (or Duck / Crab) [queued], voiced the first time only (later rounds: caption only). The first time, a slow hand demo taps the friend. Each tap on the friend sends the next snack (the one nearest it) on a short arc into its mouth; she can also tap a snack, or drag it to the friend's mouth (the friend opens its wings or claws wide as it comes near). Each snack goes in with one gulp on the next note of the level's tune (the notes climb all level), a joy face, and a small swell: the friend gets a little rounder (L1 +5% per round, L2/L3 +4.5%) and STAYS that round. One gulp at a time (taps closer than 0.33 s apart wait).
- **Taps on the friend while choosing or during the match-up:** it bounces and flaps (its own reaction; the generic poke would undo its roundness). Its wings flap only a little and it turns at most 0.3 rad (Crab 0.2), so the round friend never reaches a holder.
- Nothing floats over the scene: no "+1" or counting numbers, no hearts, no "?".

## Level 1 - Picnic stalls with Gull

**Look:** two striped picnic stalls; the things stand on the counter, level with its white front roll. Gull (1.05x) stands on the sand between them, a little right of centre; Pip (0.78x) behind her, to the left, so both are seen.

| # | What the child sees | Narrator says | Prompt: what she must do | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1 | Pip waves, hello sound; the stalls and Gull. | "Let's find more!" [voiced] (intro) | none | Pip waves | none | none | Round 1 sets up at once |
| 2 | R1: 1 fish drop into the left (orange) stall, 4 into the right (sky blue) stall. | "Tap the one with more fish!" [queued] | Tap the right stall | Round 1: the hand taps the right stall. | Match-up (1 pair, 3 extras glow, "More!" [voiced]); she feeds Gull the 4 fish ("Feed Gull! Tap Gull!" [queued, voiced this once], the hand shows it). | Left stall: Gull looks, shakes its head, looks right; "Not that one! Find more!" [queued]. | Next round |
| 3 | R2: 5 shells (red) v 1 shell (blue). | "Tap the one with more shells!" [queued] | Tap the left stall | Go! | Match-up (1 pair, 4 extras); she feeds 5 shells (caption "Feed Gull! Tap Gull!"). | As above. | Next round |
| 4 | R3: 2 stars (purple) v 6 stars (green). | "Tap the one with more stars!" [queued] | Right stall | Go! | 2 pairs, 4 extras; she feeds 6. | As above. | Next round |
| 5 | R4: 3 ice creams (green) v 1 (pink). | "Tap the one with more ice creams!" [queued] | Left stall | Go! | 1 pair, 2 extras; she feeds 3. | As above. | Next round |
| 6 | R5: 1 ball (yellow) v 5 balls (purple). | "Tap the one with more balls!" [queued] | Right stall | Go! | 1 pair, 4 extras; she feeds 5. | As above. | Next round |
| 7 | R6: 6 cookies (blue) v 2 (red). | "Tap the one with more cookies!" [queued] | Left stall | Go! | 2 pairs, 4 extras; she feeds 6. | As above. | Finale |

## Level 2 - Big glass jars with Duck

**Look:** two big open-topped glass jars (rounded glass, a rolled rim and a thick foot in the round's colour, a pale aqua back panel so what is inside reads clearly against it instead of the sea). Things drop in through the open mouth and hop out the same way. Duck (0.75x) between them on the sand, a little right of centre; Pip behind, to the left. Stars are pink here (orange stars melted into the sunset).

Rounds: R1 2 v 4 shells (right), R2 5 v 3 ice creams (left), R3 3 v 6 fish (right), R4 4 v 2 balls (left), R5 3 v 5 stars (right), R6 6 v 4 cookies (left). Same beats as Level 1, with "Feed Duck! Tap Duck!" [queued].

## Level 3 - Beach wagons with Crab

**Look:** two chunky toy wagons (low front wall so what is inside shows, a white rolled rim, the pull handle folded down in front with its red grip on the sand); Crab (0.56x) on the sand between them, Pip behind it. Night beach; the moon sits a little lower and further right than usual, clear of the hold button and the rows; the bonfire and lantern posts are hidden.

Rounds: R1 2 v 5 cookies (right), R2 6 v 3 stars (left), R3 3 v 6 balls (right; SIZE TRAP: the 3 are drawn 1.35x, the 6 at 0.7x), R4 2 v 5 fish (right), R5 4 v 2 ice creams (left), R6 3 v 6 shells (right; SPACING TRAP: the 3 spread wide, the 6 packed close). Round 1's demo scans both wagons without choosing. Same beats, with "Feed Crab! Tap Crab!" [queued].

## Ending (all levels)

After the last snack: the last group she did not pick settles away, and the friend, now very round, tries one big flap and a tiny lift that does not take off, settles down, gives a soft contented burp ("mmm") and dozes (eyes closing slowly). The camera glides to the round friend (it fills about half the screen height); "Look what you made!" for 5 s: her taps on the friend make it burp again (joy face, a soft squash). Then the photo, rain, resolve, sticker, Home. Nothing automatic she cannot affect; no lap or dance.

## Every narrator line

1. "Let's find more!" [voiced]
2. Prompt: "Tap the one with more fish!" / "...shells!" / "...stars!" / "...ice creams!" / "...balls!" / "...cookies!" [queued]
3. Wrong: "Not that one! Find more!" [queued]
4. Right: "More!" (caption at the tap; voiced as the extras glow) [voiced]
5. Feeding: "Feed Gull! Tap Gull!" / "Feed Duck! Tap Duck!" / "Feed Crab! Tap Crab!" [queued; voiced the first time in a game, caption after]
6. Idle repeats of the prompt; "Bye bye! See you soon!" [voiced]
7. Finale: "Look what you made!"; "You did it! A sticker!" [voiced]

## Timings

Rule: at most 2 s from her action to the next thing she can answer. Measured numbers are in the latest fix report (autoplay with a phase monitor, full play of each level).
