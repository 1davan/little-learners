# Storyboard: Snack chef (`snack`)

- **World:** Home (`dressup`), a cosy kitchen seen from the front: an island worktop with the sink at its left end (a low chrome tap at the basin's back right corner (its spout reaches in low from the right, below every friend's chin), a small hand towel on a low chrome stand on the worktop's back edge just left of the basin, the soap pump at the front left), the plate in the middle, a deep polka-dot fruit bowl, a chopping board, and the fridge standing at the island's right end. Beyond the fridge is the **dining corner**: a long table with a checked cloth where Pip waits as the host. Hungry friends walk along their lane behind the counter. Code: `app/src/lessons/snack.js`, `snack-kitchen.js`, `snack-wash.js`, `snack-foods.js`, `snack-reach.js` (the arm-reach search). Models: `tools/blender/creatures/prop_kitchen.py`.
- **Learning goal:** washes hands before food (soap, rub, rinse, dry), then builds a snack plate and counts each piece onto it; L2 a fruit and a veg; L3 one food from each of four groups, with the fruit washed first.
- **Build-up object (SATISFACTION 18):** the dining table. Each fed friend carries its own plate (the bitten pieces and crumbs still on it) to the table and stands behind it; the finale shows all three friends at the table with their plates, so she sees what she served and how many.
- **Levels:** 3 (L1 morning, L2 noon, L3 evening). Each level is **three snacks for three friends**, each snack is **two rounds** (wash, then plate): **6 rounds per level**.
  - L1: Bear (3 strawberries), Bunny (3 bananas), Pig (3 apples). Wash = tap the tap (the friend soaps its paws by itself), then rub the paws; the rinse plays by itself.
  - L2: Cat, Frog, Monkey. Wash = soap, rub, rinse. Plate = two-part plate (fruit | veg).
  - L3: Bear, Cat, Pig. Wash = soap, rub, rinse, towel. Plate = four-part plate (fruit, veg, bread, dairy); fruit is washed in the sink first, dairy is in the fridge.

## Voice rules for this game

- Prompts and redirects are spoken (clip if it exists). Success lines ("Clean hands!", "3 strawberries!", "A healthy plate!") and step chatter ("Soap!", "Rub rub rub!", "Rinse!", "Dry dry dry!", "Clean fruit!") are caption only.
- The count is spoken as each piece lands: "One!", "Two!", "Three!", "Four!" (`repeat: true`, so it is said every time).
- A line is voiced at most once per 30 s otherwise.

## Common beats

**Intro:** Pip (at the table, off the working pictures) says "Who is hungry? Snack time!". The first friend is already waiting behind the counter's left end (its legs hidden by the cupboards); 0.6 s later round 1. Every friend has a soft contact shadow and walks (no hopping).

**Camera:** close on the sink (soap, towel stand, basin, tap and the friend's face; looking down onto the basin) or on the plate (with the bowl and board; with the sink while a fruit still needs washing at L3; with the fridge once only dairy is missing). It glides (0.9 to 1.1 s) between them. The finale glides to the dining table.

**Wash round (1, 3, 5).** Input opens with the round (0.3 s). The friend walks along its lane from its waiting spot behind the counter's left end (about 1.5 s), turns to us, raises its paws while still back in its lane, steps up to the counter with them held up, and puts them **down into the basin, right under the tap's spout**. No arm ever sweeps through the counter, the basin or the tap. Its head stays clear of the tap, soap and basin (the pose is searched on the friend's real shape: where to stand, how far to lean with the head tipped back, how to swing each arm; short-armed friends reach a little further). A tap on the right step while it is still stepping up is kept: the water starts at once and the step plays on arrival. The next object to use gently breathes; during the rub step the paws glow softly.
- **Tap (L1):** water runs onto the paws (the stream stops on them with a small splash), then the friend squeezes the soap pump: a pink dollop lands on the paws ("Soap!"), a little foam.
- **Soap (L2, L3):** "Wash hands first! Tap the soap!" The pump presses, the dollop lands on the paws, a little foam.
- **Rub (all levels):** "Rub the hands!" Press on the paws and rub back and forth (each ~120 px of rubbing is one rub; the foam grows under the finger as she moves), or tap the paws three times. Each rub: the paws go round each other, clear bubbles float out to the sides, the foam grows ("Rub rub rub!" caption). After three rubs: L1 rinses by itself; L2 and L3 ask "Now rinse! Tap the tap!".
- **Rinse:** the paws go a little lower, just to the left of the spout's tip; the water pours from the spout in a curved ribbon onto them and runs off them down to the basin floor (a ring of splash there), lumps of foam wash off into the basin and the foam melts away (1.6 s); then a shake down in the basin (drops fly into the sink).
- **Towel (L3):** "Tap the towel!" The friend lifts its paws out of the basin, steps over to the towel stand, takes the towel off the bar with both paws, holds it up a little over the worktop's back edge and rubs its paws dry in it (the towel folds round them; "Dry dry dry!"), hangs it back on the bar and steps back. The towel is only ever on its stand or in the friend's paws, never over the basin, always below the friend's chin.
- Wrong order: calm face, "Soap first!" / "Rub the hands first!" / "Rinse first!" / "Tap the towel!". Touching something this level does not use (the soap on L1, the towel on L1-L2) makes it bob, silently. Dragging a food during the wash: it flies home, "Wash hands first!".
- **After the last step:** joy face, "Clean hands!" (caption), Pip watches from the table.

**Plate round (2, 4, 6).** The fresh plate pops in; the food drops into the bowl / pops onto the board; input is open at once. The friend lifts its paws out of the sink and steps over to the plate (about 2.5 s), "ooh, food!" face. Drag (or tap) food onto the plate. Each piece rises up first (clear of the bowl and other fruit), then across, then down onto its section: a plop, the plate dips toward it, a rising note, the spoken count, a small coloured number beside the plate, the friend's joy face. At L2/L3 the empty sections glow softly for 2 s after each piece (no voice).
- A food that does not fit: it flies home, calm face, and the line says what is missing ("Now a veg!", "Now bread!", "Now milk or cheese! Look in the fridge!"...).
- **When the plate is full:** a held breath (the plate squashes a little, sounds hush), the friend gasps happily, then eats: each piece goes up to its mouth for **two bites** (a chomp each: the piece gets smaller and crumbs fall on the plate), then the smaller piece goes back onto its spot and stays; then a tummy pat. Meanwhile the next friend walks in to wait behind the counter's left end.
- **Then:** the friend turns, the plate rises a little off the worktop and goes low and straight back into its paws behind the counter (well clear of the fruit bowl, below its face), and it carries the plate at tummy height along its lane behind the counter and the fridge to its place at the table, turns to us, steps up and sets the plate down. The camera is already back at the sink with the next friend (no waiting). The last friend is watched carrying its plate off along the counter; the camera then glides to the table as it arrives.

## Level 1: morning

| # | What she sees | Prompt | Action | Then |
|---|---|---|---|---|
| 1 | Bear steps up to the sink, paws into the basin | "Wash hands first! Tap the tap!" | tap the tap (2 s hand demo first time) | water, soap by itself |
| 1b | Soapy paws glowing | "Rub the hands!" | rub (3 s rub demo first time) | rinse by itself, "Clean hands!" |
| 2 | Plain plate, 3 strawberries drop into the bowl | "Put 3 strawberries on the plate!" | drag / tap 3 times ("One! Two! Three!") | "3 strawberries!", Bear eats, carries plate to table |
| 3-4 | Bunny, 3 bananas | as above | | |
| 5-6 | Pig, 3 apples | as above | | finale |

## Level 2: noon

| # | Prompt | Action |
|---|---|---|
| wash | "Wash hands first! Tap the soap!" / "Rub the hands!" / "Now rinse! Tap the tap!" | soap, rub x3, tap |
| plate | "A fruit and a veg, please!" (then "Now a veg!" / "Now a fruit!" on a wrong pick) | one fruit (bowl) and one veg (board) onto the two-part plate |

The fridge holds milk, cheese and yogurt to peek at (tap: it opens, a cold puff, it shuts).

## Level 3: evening

| # | Prompt | Action |
|---|---|---|
| wash | soap, "Rub the hands!", rinse, "Tap the towel!" | four steps |
| plate | "Fill up the plate!" | one of each group onto the four-part plate (its sections show a strawberry, a carrot, bread and a milk bottle) |
| fruit | "Wash the fruit first!" (if dragged to the plate unwashed), "Wash a fruit in the sink!" (when it is the last one missing) | drag (or tap) the fruit into the basin: it rolls under the running water, "Clean fruit!", then hops onto the plate |
| dairy | "Now milk or cheese! Look in the fridge!" | tap the fridge (it opens), drag the cheese / milk / yogurt to the plate; the door shuts again |

## Ending (every level)

The camera glides to the dining table: the three friends stand behind it with their plates (the bitten pieces and crumbs still on them), Pip at the end. "Look what you made!" (voiced once per session), at least 4 s to admire (poking a plate presses it and plays its note, its friend smiles), the photo, then "You did it! A sticker!".

## Timings (measured with real pointer events, every level)

- The next friend comes in to wait behind the counter's left end while the plate round plays (off-picture), and steps up to the sink and gets its paws ready while the last friend starts eating.
- The wash round starts once the plate's friend has gasped and taken its first bite (about 1.6 s after the plate is full); the rest of the eating and the walk to the table carry on during the wash round.
- The prompt is said once the friend is at the sink (about 1.1 s into the round). A touch on the soap or the tap before that answers at once (the pump squishes and a blob of soap waits on its nozzle; the tap gushes) and is done as soon as the friend is ready.
- Plate round: food can be dragged at once; the friend reaches the plate about 3 s in.
