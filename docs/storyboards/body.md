# Bear's nose (id: `body`)

- **World:** Beach (world id `beach`), "Nose and toes!" (icon 👃). Source: app/src/lessons/body.js and body-gear.js.
- **Learning goal:** touches the named body part (nose, eyes, ears, mouth, tummy, hands, feet), then puts that part's beach gear on it (she says the part twice: once by touch, once by placing). Level 3 adds a sense sentence for four parts.
- **Levels:** 3, 6 rounds each. L1 uses four parts and Bear only; L2 all seven parts with Bunny then Kitty; L3 all seven with Froggy, Kitty, Bear and the sense lines.
- **Build-up object:** the friends getting kitted out. Gear stays on all level; friends already met stay in the scene (back-left, smaller) in their gear; the finale frames them all.
- Meta intro line: "Let's find nose and toes!" [to voice]

## Engine behaviour that applies to every round (engine/lesson.js)

- **Go!:** taps open as soon as the round is laid out; the Go! badge shows once the round is ready (max 3 s).
- **One hand demo per game:** at the start of round 1, after the prompt, the hand taps the right part (any touch ends it). Level 3 uses the same tap demo (no scan over three parts).
- **Idle ladder (resets on every touch):** 5 s prompt again + nudge 1; 8 s prompt again (voiced again) + nudge 2 + the hand demo again; 20 s errorless; 90 s "Bye bye! See you soon!" then Home.
- **Wrong answer** (`redirect`): input locks 0.7 s; the 2nd wrong answer in a round switches on the errorless step.
- **Voice:** a line is voiced only if it is in assets/voice/index.json; the same line at most once per 30 s unless the game passes `repeat`.
- **Success** (quiet): Pip turns toward the part and nods or claps; the game's payoff; a short stillness; next round. No confetti or praise word.
- **Finale:** onFinale, camera glide to the creation view, admire (6 s here) with "Look what you made!" (voiced once per session), photo, rain, "You did it! A sticker!", Home.

## How a "body" round works (all levels)

- Camera 3.3 high, 12.6 back. The friend of the round stands centre (L1/L3 x 0.4; L2 x 1.4 so the sunset sun is never behind its head), about 2.15x (capped so ears stay under the caption), with a soft contact shadow. Pip stands at the far left (L1 back-left by the umbrella; L2 front-left; L3 left behind the rock pool), never hidden by props.
- Every part is an invisible round tap target on the friend (nose 0.55, eyes 0.5 each, ears 0.9 each, mouth 0.5, tummy 1.0, hands 0.85 each, feet 0.85 each). All seven parts take taps at every level. At L1 only nose, tummy, ears, feet are asked; touching the other three just makes them react (no redirect line).
- **Prompt:** "<Part>! Touch <Friend>'s <part>." [voiced]. L3, eyes/nose/ears/mouth: "We see with our eyes! Touch Froggy's eyes!" style [voiced].
- **Every touch reacts** and grows with repeats (per friend): nose: squeak + small head puff; sniff sniff + "mmm"; "ah-choo" (scared face only when it was the wrong part, joy face when right). Eyes: one blink; two blinks; big wow eyes. Ears: a note and an ear flick with a head tilt (higher note and bigger flick each time; never a head squash or full spin). Mouth: "mmm" with a joy face; chomp with a nod; giggle, joy face and a little hop. Tummy: giggle and a belly jiggle that grows (joy face at the 3rd). Hands: the touched paw waves (wider each time). Feet: a thunk and a foot stomp (two stomps from the 2nd touch). While a reaction runs (1 s), more taps are silent. No floating emoji or symbols.
- **Wrong part:** that part reacts, then two voiced lines, the second after the first: what she touched ("That's the tummy!", "Those are the ears!" ...), then "Touch the <part>!" (both `repeat`, they teach the word).
- **Right part:** the part reacts and she hears the word at once: "Nose!" [voiced, repeat]. The friend touches its own part (0.6 s reach, 1.6 s in all): for nose, mouth and eyes the paw comes up in front of the cheek on its OWN side (never across the chest) and the head bows to meet it; the arm's ink outline is drawn without its push while the paw is up (an arm folded against the body used to show broken dark streaks down the torso); ears both paws to the ears; tummy two pats; hands two claps (drum); feet two stomps (no bending: the old bend pitched the whole friend and its ring into the towel). The arm swing is clamped. A paw already holding gear stays down.
- **The gear step (she puts it on):** 0.45 s after the right touch the part's gear pops onto open sand at the front right (x 3.2-4.5, z 2.15: below the waiting friends, in front of any resting ball, clear of the friend; something wide like the swim ring, or anything that would not fit there, waits smaller and grows as it goes on) and Pip says what to do: "Sunglasses on the eyes!", "Sun cream on the nose!", "Flowers on the ears!", "Lolly for the mouth!", "Swim ring on the tummy!", "Spade in the hands!", "Flippers on the feet!" [voiced]. The first time in the game the hand shows the drag (gear to part). She drags it onto the friend (anywhere on the friend counts; magnet near the part); a tap on the gear, or touching the part again, floats it over slowly (0.75 s). A drop on nothing walks it back to its spot. It flies on along a soft arc and stays: sunglasses on the eyes; a small dab of sun cream on the bridge of the nose (she carries a sun cream bottle: it tips, squeezes, the dab grows on, the bottle goes back to the sand and fades away); a flower behind each ear (pink, yellow); the lolly goes to the mouth for a bite (chomp) and is then held in the left paw; a swim ring low round the waist (the tummy stays touchable); a spade upright in the right paw, blade down; a flipper on each foot (they move with the legs). One soft note per gear (the level's rising tune). The friend smiles (joy face) and nods. Idle: 5 s the gear bobs; 8 s the hand shows the drag again; 20 s it goes on by itself.
- **Payoff:** feet: a beach ball rolls in, the friend kicks it and it comes to rest on the sand at the right, behind the gear spot (it stops there; a tap bounces it). Hands: a ball comes in and the friend bats it with the spade to the same place. Otherwise a short look (0.6 s). At most two balls; an older one fades when a third comes. A repeat part (L1 R5, R6) skips the gear step: the gear gives a proud bounce.
- **Friend change:** the friends still to come wait at the back right, smaller and spaced apart. 0.4 s after the gear goes on, the old friend walks to the back-left (shrinking to 0.7, keeping all its gear; at L2 Bunny walks to the paddling pool and hops in to paddle, the water hiding its feet; at L3 Froggy and Kitty stand apart, clear of Pip) while the new friend walks forward and grows to full size (3 units/s). The new friend is the one to touch from the moment it sets off: the next round opens 0.65 s after the gear went on, while it is still walking ("Hello <Name>!" [voiced], then the prompt). Round 1 also says hello to its friend.

## Level 1: Bear on a striped towel under a big umbrella

Rounds: R1 nose, R2 ears, R3 tummy, R4 feet, R5 nose (repeat: gear bounce), R6 ears (repeat). The tummy is asked once only (the ring then covers the waist).

| # | What the child sees | Narrator says | Prompt: what she must do | If right | If wrong | Then |
|---|---|---|---|---|---|---|
| 1 | Bear already stands on the towel; Pip waves. | "Let's find nose and toes!" then "Hello Bear!" [voiced] | none (taps already open) | | | round 1 |
| 2 | R1 | "Nose! Touch Bear's nose." | Touch the nose (hand demo once) | "Nose!", Bear boops its nose; the sun cream bottle on the sand: "Sun cream on the nose!"; she drags it to the nose; a dab goes on. | "That's the tummy!" then "Touch the nose!" (eyes, mouth, hands only react) | next |
| 3 | R2 | "Ears! Touch Bear's ears." | Touch an ear | "Ears!", paws to ears; two flowers: "Flowers on the ears!" | as above | next |
| 4 | R3 | "Tummy! Touch Bear's tummy." | Touch the tummy | "Tummy!", two pats; the swim ring: "Swim ring on the tummy!"; it settles round the waist | as above | next |
| 5 | R4 | "Feet! Touch Bear's feet." | Touch a foot | "Feet!", two stomps; flippers: "Flippers on the feet!"; then a ball rolls in and Bear kicks it | as above | next |
| 6 | R5 | "Nose! Touch Bear's nose." | Touch the nose | "Nose!", boop, the dab gives a proud bounce | as above | next |
| 7 | R6 | "Ears! Touch Bear's ears." | Touch an ear | "Ears!", paws to ears, the flowers bounce | as above | finale |

## Level 2: Bunny then Kitty at a paddling pool (lifeguard flag)

Rounds: R1 Bunny eyes, R2 Bunny hands (ball batted), R3 Bunny mouth (lolly), R4 Kitty ears, R5 Kitty feet (ball kicked), R6 Kitty nose. Kitty waits at the back right from the start; after R3 Bunny goes paddling in the pool (back-left) with its sunglasses, spade and lolly, and Kitty walks forward ("Hello Kitty!").

## Level 3: Froggy, Kitty and Bear at the rock pool (night)

Rounds: R1 Froggy eyes, R2 Froggy mouth, R3 Kitty nose, R4 Kitty ears, R5 Bear hands, R6 Bear feet. Sense prompts for eyes, mouth, nose, ears. Kitty and Bear wait at the back right; Froggy (sunglasses, lolly) moves to behind the rock pool after R2, Kitty (sun cream, flowers) next to it after R4. The rock pool is a sculpted prop (sandy lip, sunken water, pebbles); rocks and seaweed sit at the far left-front and far right, clear of every friend.

## Ending (all levels)

Camera glides to frame every friend of the level in their gear (and Pip). Admire 6 s: her taps on any friend's parts make them react (ears flick, tummy jiggles, feet stomp: "head, tummy, toes"; nose, eyes, mouth, hands react too). "Look what you made!" Photo of all the kitted-out friends. Then the sticker.

## Timings (autoplay, measured)

- Game open to first touch possible: about 0.7 s. Every round's input is open the moment the round starts.
- Right touch to the gear being draggable: 0.42-0.48 s.
- Gear on to the next round open: 1.1 s (quiet look); 1.75-1.85 s after the feet kick; about 0.7 s when the friend changes (the new friend is touchable while it walks in). Her drop to the next answerable target, worst case (the lolly, which goes to the mouth for a bite first): about 1.9 s.

## Every narrator line

"Let's find nose and toes!"; "Hello Bear!", "Hello Bunny!", "Hello Kitty!", "Hello Froggy!"; the prompts above; the right words "Nose!", "Eyes!", "Ears!", "Mouth!", "Tummy!", "Hands!", "Feet!"; the wrong pairs "That's the nose!", "Those are the eyes!", "Those are the ears!", "That's the mouth!", "That's the tummy!", "Those are the hands!", "Those are the feet!" with "Touch the <part>!"; the gear lines above; "Look what you made!"; "You did it! A sticker!"; "Bye bye! See you soon!". All voiced (new ones are queued in tools/voice/new-lines.txt).
