# WORDS: the shared first-words vocabulary (320 words, one toy set)

**What this is.** The single word list every word game draws from (word cards, "find the…", the A–Z alphabet game, naming in other games). 300 picturable nouns in 10 build batches of 30, plus 20 action and describing words that are shown as animations of models we already have (batch 11, no modelling).

**Where the words come from.** The MacArthur-Bates CDI toddler checklists (Words & Gestures and Words & Sentences) by category: animals, vehicles, toys, food and drink, clothing, body parts, small household items, furniture and rooms, outside things, places, people, action words, descriptive words. Words were chosen from those categories by three tests: (1) a 2-year-old is likely to hear it daily, (2) it can be shown as one unmistakable object, (3) it does not look like another word in the set. A handful of non-CDI words are included because toddlers love them or because the alphabet needs them (dinosaur, unicorn, digger, yak, igloo, x-ray, xylophone, yo-yo); each is marked `+`. The list was written from the CDI category structure, not copied from the form, so treat item-level CDI membership as approximate.

**Counts.** 320 words. 122 reuse an existing model (116 as it is, 6 composed by the game from existing models), 11 body-part words are shown on existing characters, 20 are animations, and **167 are new models** to build.

---

## 1. Rules for every word

### Spoken line
- The line is **just the word with an exclamation mark**: `Spoon!`. No article, no "this is a". One clip per word, Sulafat voice, said warmly and slowly, about 0.8–1.2 s, with 0.25 s of silence at each end so it is never clipped.
- Clip id: `word_<id>` where `<id>` is the model id without `prop_word_` (e.g. `word_spoon`). Plural-by-nature words are said as plurals (`Grapes!`, `Peas!`, `Socks` is not used: one sock, `Sock!`).
- The alphabet game builds its own line from the same word: `S is for Spoon!` (a second clip, id `abc_<id>`), only for the words marked as alphabet picks in section 4.
- Dialect: the game already says "colours", "wellies", "cookie" and "ladybug", so the default is British words with those two existing exceptions kept. The US alternates are in section 5; record both where listed so a parent setting can switch.

### Model contract (all new models)
- **Id:** `prop_word_<id>`, lower case, no spaces (`prop_word_fireengine`). The 14 existing `prop_word_*` models already follow this.
- **Scripts:** one script per batch, `tools/blender/creatures/prop_words_<batch>.py`, building several models with the `ONLY=` pattern used by `prop_snacks.py`. Agents edit only their own batch script.
- **Pose:** bottom at y = 0, centred on x and z, facing **+z**. Long things (vehicles, fish, tools) lie along x with the "front" toward +x, turned about 25° toward the camera by the game, not in the model.
- **Card size:** every model must read inside a **2.0 × 2.0 × 2.0 box** (the word card). Build at the natural size given, and set `extras['fit']` (height) and `extras['wide']` if wider than tall, as `bricks-words.js` does.
- **Bones:** always a `body` bone straight up. Add the named extra bones in the spec (these drive the word's little "show": a lid, a wheel, a head). Animals and people also get `head` and a `face()` mount for the engine's code face.
- **Budget:** the "tris" column is the total after remesh, all layers. Do not exceed it by more than 20%. A screen may show 6 word models at once.

### Shared style (so 300 models read as one toy set)
1. **Chunky vinyl toy.** Everything looks like a well-made toy of the thing, not the thing. Round every edge (minimum radius about 6% of the model's size). No thin parts: nothing thinner than 0.06 at card size (handles, stalks, legs, wires are fat tubes).
2. **Three reads.** Each model has one silhouette shape, one main colour, and at most three signature details. If a detail does not help a toddler name it, leave it off.
3. **Proportion trick.** Enlarge the part that names the object by about 30% (the spout of a teapot, the ladder of a fire engine, the ears of a mouse, the trunk of an elephant).
4. **Palette.** Use only these, plus one tint lighter and one darker of each for shading bands:
   `RED ff4f4f · ORANGE ff9a2e · YELLOW ffd23a · GREEN 4cc75a · LEAF 2f8a3a · BLUE 3f8cff · SKY 8fd3ff · PURPLE 9b6dff · PINK ff7fbf · ROSE ff9ec4 · CREAM f2e8d8 · WHITE fffaf0 · BROWN b07a4a · WOOD d8924f · TAN f3d9ae · GREY b9c0c9 · SLATE 6f7a8c · INK 3a2838`.
   Never pure black or pure white. "Metal" is GREY with a WHITE highlight band; "glass" is SKY with a WHITE sticker glint; "wood" is WOOD with two darker grain lines.
5. **Crisp paint.** Colour changes are hard-edged vertex paint or separate layers, never gradients. Small graphics (labels, dials, windows, spots) are stickers or decals from the kit.
6. **Ink outline.** `extras['outline']`: 0.026 for models over 1.5 tall, 0.018 for small ones (food, small items). Inner details get their own layer so they pick up an ink edge.
7. **Faces.** Only animals and people have faces (the engine's code face: big low eyes, rosy cheeks). Objects never get faces, so "a cup" and "a character" are never confused. Exceptions: sun and moon keep the faces they already have, and toy characters (doll, teddy, robot) have faces because the real toys do.
8. **Scale honesty inside a category.** Within a batch, keep relative sizes believable before the card fit (mouse smaller than dog; cup smaller than kettle). The card fit then scales each to fill the card.
9. **Real colours first.** Use the colour a toddler expects (banana yellow, fire engine red, frog green). Where the real object has no fixed colour (cup, sock, car), take the colour listed so neighbours on a card are different colours.
10. **Animals** are "figurines": the simpler `Prop` build used by `prop_word_owl.py` (body + head bones, code face, spring bones named ear/tail/mane so the engine animates them), sitting or standing, about 2.2 tall, head about half the height. They do not need walk gaits. The 17 rigged characters are reused as they are.
11. **People** are one family of soft doll figures (not realistic humans): a bean body 2.3 tall, head 45% of height, mitten hands, stub feet, code face, hair as its own layer. Skin tones vary across the family (three tones: `f6cfa6`, `d9a273`, `9c6b4a`). Each person is named by one prop or hair cue.
12. **Check every model** with `tools/viewmodel.sh` at card size and as a 96 px thumbnail. Test: cover the label; would a 2-year-old name it? Then put it next to its batch neighbours and its "look-alike" (listed in the notes) and confirm they differ in silhouette and colour.

### Reading the tables
- **L** = first letter. **Model** = the id to load. **Src**: `R` reuse as is · `R*` reuse with the small change noted · `C` shown on an existing character · `N` new model · `A` animation only.
- `+` after a word = not a CDI item (see above).
- For `R` rows the spec column says what to check; for `N` rows it is the build spec.

---

## 2. The words

### Batch 1 — Farm, pet and garden animals (30 words · 11 new)

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 1 | Bear | "Bear!" | B | bear | R | Rigged character. | — |
| 2 | Bunny | "Bunny!" | B | bunny | R | Rigged character. Alphabet uses it as "Rabbit" for R (existing). | — |
| 3 | Cat | "Cat!" | C | cat | R | Rigged character. | — |
| 4 | Chick | "Chick!" | C | chick | R | Rigged character. Look-alike: duck (keep chick yellow and round, duck with a flat orange bill). | — |
| 5 | Cow | "Cow!" | C | cow | R | Rigged character. | — |
| 6 | Duck | "Duck!" | D | duck | R | Rigged character. | — |
| 7 | Hen | "Hen!" | H | hen | R | Rigged character. | — |
| 8 | Horse | "Horse!" | H | horse | R | Rigged character. | — |
| 9 | Pig | "Pig!" | P | pig | R | Rigged character. | — |
| 10 | Sheep | "Sheep!" | S | sheep | R | Rigged character. | — |
| 11 | Hedgehog + | "Hedgehog!" | H | hedgehog | R | Rigged character. | — |
| 12 | Frog | "Frog!" | F | frog | R | Rigged character. | — |
| 13 | Dog | "Dog!" | D | prop_word_dog | N | Sitting puppy-proportioned dog. Floppy ears hanging past the cheeks (spring), big black-INK button nose on a CREAM muzzle, wagging tail (spring), RED collar with a YELLOW tag. Body WOOD with one BROWN eye patch. | 7000 |
| 14 | Mouse | "Mouse!" | M | prop_word_mouse | N | Small egg body sitting up. Two huge round ears (ROSE inside, 60% of head width each), long thin-but-fat PINK tail curled to the front (spring), tiny PINK nose, two whisker tubes each side. Body GREY, CREAM tummy. | 6000 |
| 15 | Goat | "Goat!" | G | prop_word_goat | N | Standing on four stub legs. Two short curved CREAM horns, a little chin beard (spring "tuft"), sideways ears, short upright tail. Body WHITE with TAN patches, GREY hooves. Look-alike: sheep (goat is smooth, no wool, has beard). | 7500 |
| 16 | Donkey | "Donkey!" | D | prop_word_donkey | N | Standing. Very long upright ears (spring, ROSE inside), big CREAM muzzle with nostrils, short stiff INK mane, tail with a tuft. Body GREY, CREAM tummy. Look-alike: horse (donkey is grey, ears twice as long, no flowing mane). | 7500 |
| 17 | Goose | "Goose!" | G | prop_word_goose | N | Upright WHITE bird with a long S-curved neck (neck bone), ORANGE bill and big ORANGE webbed feet, small folded wings. Look-alike: duck (goose is white, tall, long neck). | 6000 |
| 18 | Turkey | "Turkey!" | T | prop_word_turkey | N | Round BROWN body with a big fan tail behind it of 7 fat feathers striped ORANGE, RED, YELLOW (fan bone opens), RED wattle (spring), YELLOW beak. | 7500 |
| 19 | Bird | "Bird!" | B | prop_word_bird | N | Small round songbird perched on a short WOOD twig. BLUE back and head, ORANGE breast, short YELLOW triangle beak, pointed tail up, wing.L and wing.R bones. Look-alike: chick (bird is blue and perched). | 5000 |
| 20 | Owl | "Owl!" | O | prop_word_owl | R | Existing. | — |
| 21 | Squirrel | "Squirrel!" | S | prop_word_squirrel | N | Sitting up holding a BROWN acorn in both paws. Enormous bushy tail curling up behind and over the head in an S (3 spring bones), small tufted ears. Body ORANGE, CREAM tummy and tail tip. | 7500 |
| 22 | Fox | "Fox!" | F | prop_word_fox | N | Sitting. Big triangle ears with INK tips, pointed CREAM muzzle and cheeks, fat bushy tail with a WHITE tip wrapped to the front (spring), INK socks. Body ORANGE. Look-alike: squirrel, cat (pointed white face and white tail tip decide it). | 7500 |
| 23 | Deer | "Deer!" | D | prop_word_deer | N | Standing fawn on four slim-but-chunky legs. Two small WOOD antlers with two prongs each, big sideways ears, WHITE spots on the back, short white tail. Body TAN-BROWN, CREAM tummy. | 7500 |
| 24 | Turtle | "Turtle!" | T | prop_word_turtle | N | Dome shell with 7 raised hexagon plates (LEAF plates on a GREEN shell, YELLOW rim), four flipper feet and a round head poking out front (head bone slides in and out), tiny tail. Skin light GREEN. | 6500 |
| 25 | Fish | "Fish!" | F | prop_fish | R | Existing chubby toy fish. | — |
| 26 | Bee | "Bee!" | B | prop_m_bee | R | Existing. | — |
| 27 | Butterfly | "Butterfly!" | B | prop_word_butterfly | N | Word-card butterfly (replaces prop_m_butterfly, which lies flat and reads edge-on): upright, wings open to the child, PURPLE upper and PINK lower wings with YELLOW spots, striped body, code face, wing.L / wing.R and spring antenna bones. | — |
| 28 | Ladybug | "Ladybug!" | L | prop_m_ladybug | R | Existing (game already says "ladybug"). | — |
| 29 | Snail | "Snail!" | S | prop_farmsnail | R | Existing. | — |
| 30 | Worm | "Worm!" | W | prop_m_worm | R | Existing. | — |

### Batch 2 — Wild, sea and tiny animals (30 words · 23 new)

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 31 | Elephant | "Elephant!" | E | elephant | R | Rigged character. | — |
| 32 | Monkey | "Monkey!" | M | monkey | R | Rigged character. | — |
| 33 | Crab | "Crab!" | C | crab | R | Rigged character. | — |
| 34 | Lion | "Lion!" | L | prop_word_lion | N | Sitting. A huge round mane of 10 fat BROWN scallop tufts framing a YELLOW face (mane spring), round ears in front of the mane, ROSE triangle nose, tail with a BROWN tuft. Body YELLOW-TAN. | 8000 |
| 35 | Tiger | "Tiger!" | T | prop_word_tiger | N | Sitting. ORANGE with bold INK stripes (5 on the back, 3 on each cheek, rings on the tail), WHITE muzzle, cheeks and tummy, round ears with white dots behind. Look-alike: lion, cat (stripes decide it). | 8000 |
| 36 | Zebra | "Zebra!" | Z | prop_word_zebra | N | Standing. WHITE with bold INK stripes wrapping body, legs and neck, upright striped mane (spring), INK muzzle, tail tuft. Look-alike: horse (stripes). | 8000 |
| 37 | Giraffe | "Giraffe!" | G | prop_word_giraffe | N | Standing, 3.0 tall before fit: a very long neck (2 neck bones), two little knobbed horns, YELLOW with ORANGE-BROWN rounded patches, short mane line, tail tuft. | 8000 |
| 38 | Hippo | "Hippo!" | H | prop_word_hippo | N | Barrel body on four stub legs, enormous square muzzle with two big nostrils on top and two peg teeth, tiny round ears and tail. PURPLE-GREY body, ROSE muzzle underside. | 7000 |
| 39 | Kangaroo | "Kangaroo!" | K | prop_word_kangaroo | N | Upright on huge feet with a thick tail as a third leg. A pouch on the tummy with a tiny joey head peeking out (joey bone pops up), long ears, small arms. Body TAN, CREAM tummy. | 8000 |
| 40 | Koala + | "Koala!" | K | prop_word_koala | N | Sitting, hugging a short WOOD branch with GREEN leaves. Big round fluffy ears (WHITE fluff inside), a large oval INK nose, no tail. Body GREY, WHITE chest. Look-alike: bear, mouse (big dark nose, grey, on a branch). | 7000 |
| 41 | Panda + | "Panda!" | P | prop_word_panda | N | Sitting holding a GREEN bamboo stick. WHITE body with INK ears, eye patches, arms and legs. Look-alike: bear (black and white decides it). | 7000 |
| 42 | Penguin | "Penguin!" | P | prop_word_penguin | N | Upright egg shape. INK-blue back and head, WHITE front and face, ORANGE beak and big flat feet, flipper wings out to the sides (wing bones), YELLOW cheek patches. | 6000 |
| 43 | Crocodile | "Crocodile!" | C | prop_word_crocodile | N | Long low body along x. Long snout with a row of rounded WHITE teeth showing in a smile (jaw bone opens), eyes on top bumps, zigzag ridge down back and tail (LEAF), four stub legs. Body GREEN, YELLOW tummy. | 7500 |
| 44 | Snake | "Snake!" | S | prop_word_snake | N | A fat coil of three loops with the head raised at the front (head bone sways), RED forked tongue (tongue bone flicks). GREEN with YELLOW diamond patches down the back, YELLOW underside. Look-alike: worm (coiled, patterned, tongue). | 5500 |
| 45 | Dinosaur + | "Dinosaur!" | D | prop_word_dinosaur | N | Friendly upright T-rex-like dino: big head, tiny arms, thick tail on the ground, row of round ORANGE plates from head to tail. Body GREEN, YELLOW tummy, small rounded WHITE teeth. | 8000 |
| 46 | Unicorn + | "Unicorn!" | U | prop_word_unicorn | N | Standing WHITE pony with a single spiral YELLOW horn, flowing mane and tail in three bands PINK, PURPLE, SKY (spring), PINK hooves. Look-alike: horse (horn and rainbow mane). | 8000 |
| 47 | Whale | "Whale!" | W | prop_word_whale | N | Big rounded teardrop along x with a small upturned tail fluke, a WHITE water spout of three fat drops on top (spout bone rises), grooved pale tummy. Body BLUE, SKY tummy. | 5500 |
| 48 | Dolphin | "Dolphin!" | D | prop_word_dolphin | N | Curved leaping arc along x: long beak, curved dorsal fin, two flippers, forked tail. Body SKY-GREY, WHITE tummy. Sits on a small WHITE splash base so it stands. Look-alike: whale, shark (beak and leaping curve). | 5500 |
| 49 | Shark | "Shark!" | S | prop_word_shark | N | Torpedo along x with one tall triangle back fin, crescent tail, a friendly smile with a zigzag of rounded WHITE teeth, three gill lines. Body SLATE, WHITE tummy. Never scary: round eyes, smile. | 5500 |
| 50 | Octopus | "Octopus!" | O | prop_word_octopus | N | Big dome head on eight fat curled arms spread in a ring (4 visible front arms have spring bones), two rows of pale sucker dots under each arm tip. PURPLE, ROSE suckers. | 8000 |
| 51 | Seal | "Seal!" | S | prop_word_seal | N | Lying with head and chest raised, balancing nothing. Smooth bean body, two front flippers, tail flippers together, whisker dots and three whisker tubes each side, INK nose. Body GREY, CREAM tummy. | 5500 |
| 52 | Jellyfish | "Jellyfish!" | J | prop_word_jellyfish | R | Existing. | — |
| 53 | Starfish | "Starfish!" | S | prop_word_starfish | N | Word-card variant of prop_starfish (original untouched; it is white for tinting and lies flat). ORANGE baked in, stuck upright in a small TAN sand mound and leaning back toward the camera, the bottom arm in the sand; slim, slightly curling arms with two rows of CREAM bumps. No face. Look-alike: star (starfish is orange, bumpy, slim curvy arms, on sand; prop_word_star is yellow, smooth and puffy). | 3700 |
| 54 | Parrot | "Parrot!" | P | prop_word_parrot | N | Upright on a WOOD perch. RED body, wings banded YELLOW then BLUE, long tail feathers down past the perch, big hooked CREAM beak, WHITE face patch. Look-alike: bird (hooked beak, long tail, red). | 6500 |
| 55 | Flamingo + | "Flamingo!" | F | prop_word_flamingo | N | Standing on one long leg (other folded), S-curved neck, bent beak with an INK tip. All PINK with ROSE wing. Legs are fat tubes (0.07) so they survive the outline. | 6000 |
| 56 | Camel | "Camel!" | C | prop_word_camel | N | Standing with two big rounded humps, long curved neck, droopy lip muzzle, tail tuft, broad feet. Body TAN, BROWN hump tops. | 7500 |
| 57 | Yak + | "Yak!" | Y | prop_word_yak | N | Stocky cow shape covered in a long shaggy BROWN coat that hangs to the ground in scalloped locks (skirt hides the legs, only hooves show), two wide curved CREAM horns, CREAM muzzle, forelock (spring). Alphabet helper for Y. | 7500 |
| 58 | Spider | "Spider!" | S | prop_word_spider | N | Word-card variant of prop_m_spider (original untouched; too dark and flat to read on a card). Round PURPLE body raised on eight fat darker-purple legs that radiate round it with high knees, paler tummy, cute code face. Look-alike: ant (spider is purple and round, 8 radiating legs, no antennae). | 4500 |
| 59 | Caterpillar | "Caterpillar!" | C | prop_st_caterpillar | R | Existing. | — |
| 60 | Ant | "Ant!" | A | prop_word_ant | N | Three fat round body segments in a row along x, six bent tube legs, two antennae with ball tips (spring), carrying a small GREEN leaf piece on its back. Body RED-BROWN. Look-alike: spider (3 segments, 6 legs, antennae). | 5000 |

### Batch 3 — Fruit and vegetables (30 words · 7 new)

All food sits bottom at y 0 as if on a plate. Food is small: outline 0.018. Cut faces (kiwi, avocado, watermelon) show the inside, because the inside is what names them.

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 61 | Apple | "Apple!" | A | prop_word_apple | R | Existing. | — |
| 62 | Banana | "Banana!" | B | prop_m_banana | R | Existing. | — |
| 63 | Orange | "Orange!" | O | prop_word_orange | N | Word-card orange, colour baked in (prop_m_orange is tint-only): ORANGE with ink-edged dimples, a LEAF star top, stalk and leaf. Look-alike: peach (no crease, no blush). | — |
| 64 | Pear | "Pear!" | P | prop_word_pear | R* | prop_m_pear rebuilt with its green colour baked in (no tint needed). | — |
| 65 | Grapes | "Grapes!" | G | prop_word_grapes | R | Existing. | — |
| 66 | Strawberry | "Strawberry!" | S | prop_m_strawberry | R | Existing. | — |
| 67 | Cherry | "Cherry!" | C | prop_m_cherry | R | Existing (pair on a stalk). | — |
| 68 | Lemon | "Lemon!" | L | prop_m_lemon | R | Existing. | — |
| 69 | Plum | "Plum!" | P | prop_word_plum | R* | prop_m_plum rebuilt with PURPLE baked in. | — |
| 70 | Blueberry | "Blueberry!" | B | prop_word_blueberry | N | A cluster of three BLUE berries (two below, one on top), each with a dark five-point crown; one model, no game placement. | — |
| 71 | Watermelon | "Watermelon!" | W | prop_word_watermelon | N | A half-moon slice standing up: RED flesh, INK seeds, pale rind band, GREEN striped skin. | — |
| 72 | Pineapple | "Pineapple!" | P | prop_word_pineapple | N | Fat oval body with a raised diamond grid (YELLOW diamonds, ORANGE grooves) and a tall crown of 9 pointed LEAF leaves fanning out (crown is 40% of the height, spring). | 3500 |
| 73 | Peach | "Peach!" | P | prop_word_peach | N | Round fruit with a deep crease down the front and a blush: ORANGE body with a hard-edged ROSE cheek on one side, short BROWN stalk with one GREEN leaf. Look-alike: orange, apple (crease and pink blush). | 1800 |
| 74 | Kiwi | "Kiwi!" | K | prop_word_kiwi | N | A half kiwi standing cut-face forward: fuzzy BROWN skin rim, bright GREEN flesh, CREAM centre, a ring of 14 INK seed dots. A second whole brown kiwi sits behind it. | 2000 |
| 75 | Raspberry | "Raspberry!" | R | prop_word_raspberry | N | A cone-dome built of about 30 fat round bumps, hollow dimple on top with a small GREEN star of leaves. PINK-RED. Look-alike: strawberry (bumpy, no seeds, rounder). | 2500 |
| 76 | Avocado | "Avocado!" | A | prop_word_avocado | N | A half avocado, cut face forward: pear-shaped, LEAF dark skin rim, pale GREEN to YELLOW flesh in two hard bands, a big round BROWN stone in the middle. | 2000 |
| 77 | Carrot | "Carrot!" | C | prop_word_carrot | R* | prop_carrot rebuilt without its face. | — |
| 78 | Tomato | "Tomato!" | T | prop_word_tomato | N | Lobed RED tomato with a big leafy LEAF star of six drooping sepals and a fat stalk. Look-alike: apple (the leafy top decides it). | — |
| 79 | Potato | "Potato!" | P | prop_ck_potato | R | Existing. | — |
| 80 | Onion | "Onion!" | O | prop_ck_onion | R | Existing. | — |
| 81 | Pepper | "Pepper!" | P | prop_ck_pepper | R | Existing. | — |
| 82 | Broccoli | "Broccoli!" | B | prop_k_broccoli | R | Existing. | — |
| 83 | Cucumber | "Cucumber!" | C | prop_k_cucumber | R | Existing. | — |
| 84 | Peas | "Peas!" | P | prop_word_peas | N | A fat open pod tipped toward the child (reads at card height) with four big pale-GREEN peas, two loose peas in front. | — |
| 85 | Corn | "Corn!" | C | prop_word_corn | R* | prop_corn rebuilt as a word card (no face, fit set). | — |
| 86 | Pumpkin | "Pumpkin!" | P | prop_m_pumpkin | R | Existing. | — |
| 87 | Mushroom | "Mushroom!" | M | prop_word_mushroom | R* | prop_m_mushroom rebuilt without its face, RED cap baked in. | — |
| 88 | Cabbage | "Cabbage!" | C | prop_farmcabbage | R | Existing. | — |
| 89 | Lettuce | "Lettuce!" | L | prop_word_lettuce | N | A loose open head: 8 big frilly-edged leaves cupped around a pale heart, wavy rims. Light GREEN leaves, YELLOW-green heart, WHITE ribs. Look-alike: cabbage (lettuce is open and frilly; cabbage is a tight ball). | 3500 |
| 90 | Vegetables | "Vegetables!" | V | prop_word_vegetables | N | A shallow WOOD crate holding five small veg poking out the top: carrot, tomato, broccoli, corn, pepper (simplified copies, each its true colour). Alphabet helper for V. | 5000 |

### Batch 4 — Meals, snacks and drinks (30 words · 24 new)

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 91 | Bread | "Bread!" | B | prop_word_bread | N | Word-card loaf (replaces `prop_bread`, a small roll that read as a bun): a sandwich loaf lying along x, the toast outline extruded, WOOD sides, BROWN domed top with three TAN score marks, the +x end cut to show a CREAM crumb face. Look-alike: toast (whole loaf vs one buttered slice). | 1650 |
| 92 | Toast | "Toast!" | T | prop_word_toast | N | One thick slice standing upright, classic bread-top outline. BROWN crust rim, toasted ORANGE-TAN face with a YELLOW pat of butter melting in the middle. Look-alike: bread (single slice with butter). | 1500 |
| 93 | Cheese | "Cheese!" | C | prop_k_cheese | R | Existing wedge with holes. | — |
| 94 | Egg | "Egg!" | E | prop_word_egg | R | Existing. | — |
| 95 | Milk | "Milk!" | M | prop_k_milk | R | Existing bottle. | — |
| 96 | Yogurt | "Yogurt!" | Y | prop_word_yogurt | N | Word-card pot (replaces `prop_k_yogurt`, whose small lid read as a box): pale PINK pot with a WHITE band and a strawberry sticker, a swirl of yogurt showing at the front, the round foil lid peeled from the front and standing up behind, curling over, silver underside with a PINK yogurt smear, a pull tab at the top. | 2650 |
| 97 | Jam | "Jam!" | J | prop_word_jam | N | Squat glass jar of RED jam with a RED-and-WHITE gingham lid cover tied with string, a WHITE label with one strawberry sticker. A small spoon of jam leans beside it. | 2500 |
| 98 | Honey | "Honey!" | H | prop_word_honey | N | Round beehive-shaped YELLOW pot with three ridges, a WOOD honey dipper standing in it with a fat ORANGE drip hanging off the dipper (drip bone stretches), a small bee sticker on the front. | 2500 |
| 99 | Cereal | "Cereal!" | C | prop_word_cereal | N | BLUE bowl of WHITE milk with about 14 chunky ring loops floating (RED, YELLOW, GREEN, ORANGE, PURPLE), a spoon resting on the rim. | 3000 |
| 100 | Soup | "Soup!" | S | prop_word_soup | N | Wide GREEN bowl with two handles, ORANGE-RED soup surface with a WHITE swirl, three fat WHITE steam curls rising (steam bones sway). Spoon beside. Look-alike: cereal (steam, handles, no loops). | 2500 |
| 101 | Pasta | "Pasta!" | P | prop_word_pasta | N | YELLOW bowl heaped with 10 big bow-tie pasta pieces (CREAM-YELLOW), RED sauce on top with one GREEN leaf. | 3500 |
| 102 | Noodles | "Noodles!" | N | prop_word_noodles | N | RED bowl with a tangle of long fat CREAM noodle tubes, a pair of noodles lifted high on a GREY fork above the bowl (fork bone lifts). Look-alike: pasta (long strands, lifted). | 4000 |
| 103 | Pizza | "Pizza!" | P | prop_word_pizza | N | One fat triangle slice, point forward and slightly raised: puffy TAN crust, YELLOW cheese with a wavy drip edge, three RED pepperoni discs, two GREEN pepper bits. | 2000 |
| 104 | Sandwich | "Sandwich!" | S | prop_word_sandwich | N | Word-card half (replaces `prop_sandwich`, which lies flat and reads as stripes at card size): a triangle-cut half standing on a crust edge, turned three-quarters, CREAM bread with golden crusts on the two short sides, the cut edge showing wavy GREEN lettuce, YELLOW cheese and two RED tomato slices peeking out. | 2150 |
| 105 | Sausage | "Sausage!" | S | prop_word_sausage | N | Two fat curved BROWN-RED sausages side by side on a WHITE plate, rounded knotted ends, a hard-edged darker grill stripe pattern, one glossy highlight band each. | 2000 |
| 106 | Chips | "Chips!" | C | prop_word_chips | N | A RED paper cone-box with a WHITE stripe, filled with 9 chunky YELLOW chips standing at different heights. | 2000 |
| 107 | Pancake | "Pancake!" | P | prop_word_pancake | N | Stack of three thick TAN pancakes with darker BROWN tops, a YELLOW butter square on top and ORANGE syrup dripping over two sides, on a WHITE plate. | 2500 |
| 108 | Cookie | "Cookie!" | C | prop_cookie | R | Existing (game already says "cookie"). | — |
| 109 | Cracker | "Cracker!" | C | prop_word_cracker | N | Word-card cracker (replaces `prop_k_cracker`, 0.11 tall, edge-on at card size): one square cracker standing up, leaning back 12 degrees, scalloped edge (4 bumps a side), golden face, golden-brown edges, 3 x 3 pricked holes as crisp inked dots. Look-alike: cookie (square, holes, no chips). | 2000 |
| 110 | Cake | "Cake!" | C | prop_word_cake | N | Round birthday cake on a stand: PINK icing dripping over a CREAM sponge, a ring of WHITE cream dollops, one RED cherry, one striped candle with a YELLOW flame (flame bone flickers). One wedge slightly pulled out to show two layers. | 4500 |
| 111 | Doughnut | "Doughnut!" | D | prop_m_donut | R | Existing. | — |
| 112 | Ice cream | "Ice cream!" | I | prop_word_icecream | R | Existing cone. | — |
| 113 | Lolly | "Lolly!" | L | prop_word_lolly | N | Word-card ice lolly (replaces the tintable `prop_lolly`, which is white without a game tint): colours baked in, ORANGE top, lower third a paler orange, a WHITE line between, one lighter highlight stripe, TAN stick. | 1050 |
| 114 | Popcorn | "Popcorn!" | P | prop_word_popcorn | N | A RED-and-WHITE striped tub, flared at the top, overflowing with about 20 puffy CREAM-YELLOW popped kernels (cloud blobs), two kernels mid-air above (pop bones). | 3500 |
| 115 | Chocolate | "Chocolate!" | C | prop_word_chocolate | N | A BROWN bar of 2 x 4 pillowy squares, the top-right corner bitten off with a scalloped bite edge, lower half wrapped in PURPLE foil with a YELLOW band, foil peeled back in a curl. | 2000 |
| 116 | Jelly | "Jelly!" | J | prop_word_jelly | N | A fluted dome jelly from a mould (8 lobes) on a WHITE plate, RED with one WHITE highlight band so it reads see-through. Top bone wobbles with spring physics: name the bones tail.1 and tail.2 up the middle so the engine springs them. | 2500 |
| 117 | Juice | "Juice!" | J | prop_word_juice | N | A small ORANGE carton with a sloped top, a WHITE-and-RED striped bendy straw, and an orange-slice sticker on the front. | 1500 |
| 118 | Water | "Water!" | W | prop_word_water | N | A clear tumbler (SKY glass, WHITE glint sticker) two-thirds full of BLUE water with a flat lighter surface, one fat BLUE drop hanging above it (drop bone falls). Look-alike: cup, milk (see-through blue, drop). | 1800 |
| 119 | Ice | "Ice!" | I | prop_word_ice | N | Three chunky rounded ice cubes stacked two-and-one, SKY with WHITE bevel highlights on the top edges and a small puddle under them. Alphabet helper for I. | 1500 |
| 120 | Rice | "Rice!" | R | prop_word_rice | N | A small BLUE-and-WHITE patterned bowl with a tall rounded dome of WHITE rice (pebbled surface of grain bumps), a GREEN pea trio on top. Look-alike: ice cream, cereal (white grainy dome, no loops). | 2500 |

### Batch 5 — Clothes and people (30 words · 28 new)

Clothes are shown **empty and puffed**, as if an invisible toddler were wearing them, standing upright and facing the camera, never flat. Each takes a different main colour so a row of clothes is a rainbow.

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 121 | Hat | "Hat!" | H | prop_word_hat | N | Word-card variant (prop_hat stays as it is; the flat straw sun hat filled only a third of the card): a woolly bobble hat, BLUE knitted dome with soft vertical ribs and one WHITE stripe, a WHITE ribbed turned-up cuff, a big YELLOW bobble. Faceless, colour baked. | 2500 |
| 122 | Shoe | "Shoe!" | S | prop_word_shoe | N | One chunky trainer, toe toward +x: RED upper, WHITE rubber toe cap and thick sole, WHITE laces in three crosses tied in a big bow, YELLOW heel tab. | 2500 |
| 123 | Sock | "Sock!" | S | prop_farmsock | R | Existing striped sock. | — |
| 124 | Boots | "Boots!" | B | prop_word_wellies | N | Word-card variant (prop_wellies is built white for tinting): a pair of chunky YELLOW wellies seen from the side, toes toward +x, staggered so both show, SLATE treaded soles and heels, darker top bands and pull tabs, open tops. Faceless, colour baked. Look-alike: shoe (red trainer, laces). | 2500 |
| 125 | Coat | "Coat!" | C | prop_word_coat | N | Puffy hooded winter coat, arms slightly out: YELLOW with four big round BLUE toggle buttons down the front, a hood with a CREAM fur rim, two patch pockets. | 3500 |
| 126 | Jumper | "Jumper!" | J | prop_word_jumper | N | Chunky knitted jumper, arms out: GREEN with two WHITE zigzag bands across the chest, ribbed cuffs, hem and round collar (grooved bands). Look-alike: coat, T-shirt (long sleeves, no opening, knit ribs). | 3000 |
| 127 | T-shirt | "T-shirt!" | T | prop_word_tshirt | N | Short-sleeved tee in the classic T outline: SKY with a big YELLOW star sticker on the chest, WHITE neck and sleeve trim. | 2000 |
| 128 | Trousers | "Trousers!" | T | prop_word_trousers | N | Two fat legs standing: BLUE denim with ORANGE stitch lines, turned-up cuffs showing a lighter inside, a waistband with one WOOD button and two front pockets. | 2500 |
| 129 | Shorts | "Shorts!" | S | prop_word_shorts | N | Short wide legs: RED with WHITE side stripes and a WHITE drawstring bow at the waist. Look-alike: trousers (legs a third of the length). | 1800 |
| 130 | Dress | "Dress!" | D | prop_word_dress | N | Bell-shaped dress with short puff sleeves and a flared wavy hem: PINK with WHITE polka dots, a WHITE round collar and a PURPLE ribbon bow at the waist (hem springs: bones tail.1, tail.2). | 3000 |
| 131 | Pyjamas | "Pyjamas!" | P | prop_word_pyjamas | N | Top and trousers together as one sleepy suit: SKY with YELLOW moons and stars stickers, WHITE cuffs, three buttons, a little collar. | 3500 |
| 132 | Nappy | "Nappy!" | N | prop_word_nappy | N | Puffy WHITE pants shape with two leg holes, a GREEN waistband with two tabs fastened at the front, a small YELLOW duck sticker on the front panel. | 1800 |
| 133 | Bib | "Bib!" | B | prop_word_bib | N | Rounded bib with a neck loop and a scooped crumb pocket at the bottom: ORANGE with a WHITE rim and a carrot sticker in the middle. | 1500 |
| 134 | Gloves | "Gloves!" | G | prop_word_gloves | N | A pair of mittens, thumbs out, joined by a string looping between them: RED with WHITE snowflake stickers and CREAM ribbed cuffs. | 2500 |
| 135 | Scarf | "Scarf!" | S | prop_word_scarf | N | A scarf wrapped in one loop as if round a neck, both ends hanging down the front at different lengths with tassel fringes (ends spring): wide stripes PURPLE and YELLOW. | 2500 |
| 136 | Glasses | "Glasses!" | G | prop_m_glasses | R | Existing. | — |
| 137 | Button | "Button!" | B | prop_word_button | N | Word-card variant (prop_m_button is built white for tinting): a big chunky RED sewing button standing on its edge, facing +z, a raised rim round a darker dished centre and four real holes. Faceless, colour baked. | 1200 |
| 138 | Zip | "Zip!" | Z | prop_word_zip | N | A short upright strip of BLUE cloth with a chunky zip down the middle: fat YELLOW teeth closed at the bottom, open in a V at the top, a big RED pull tab (pull bone slides up and closes the V). Alphabet helper for Z. | 2500 |
| 139 | Bag | "Bag!" | B | prop_word_bag | N | A toddler backpack: rounded GREEN body, a front pocket with a YELLOW zip line, two ORANGE shoulder straps visible at the sides, a top grab loop, a round bear-face patch on the pocket. | 3000 |
| 140 | Necklace | "Necklace!" | N | prop_word_necklace | N | A loop of 15 big round beads hanging in a U as if on a neck, colours repeating RED, YELLOW, BLUE, GREEN, with one large PINK heart bead at the bottom (spring). | 2500 |
| 141 | Baby | "Baby!" | B | prop_word_baby | N | Sitting doll figure, smallest of the family: big round head with one curl of hair on top, WHITE nappy, a dummy on a ribbon is NOT used (hides the face); instead a YELLOW rattle in one hand. Arms up to be picked up (arm bones). Skin tone f6cfa6. | 6000 |
| 142 | Girl | "Girl!" | G | prop_word_girl | N | Standing doll figure: two high bunches of BROWN hair tied with RED bobbles (spring), PURPLE dungaree dress over a WHITE top, RED shoes. Skin tone d9a273. Also carries the Hair word (batch 6). | 6500 |
| 143 | Boy | "Boy!" | B | prop_word_boy | N | Standing doll figure: short tufty INK-brown hair with a front quiff, GREEN-and-WHITE striped top, BLUE shorts, YELLOW shoes. Skin tone 9c6b4a. | 6500 |
| 144 | Mummy | "Mummy!" | M | prop_word_mummy | N | Taller doll figure (2.6): long BROWN hair in a low ponytail over one shoulder, ORANGE jumper, BLUE trousers, arms open for a hug. Skin tone d9a273 (matches Girl). | 7000 |
| 145 | Daddy | "Daddy!" | D | prop_word_daddy | N | Taller doll figure (2.7): short INK hair and a short beard band, GREEN checked shirt, SLATE trousers, arms open. Skin tone 9c6b4a (matches Boy). Look-alike: Mummy (beard, short hair, different colours). | 7000 |
| 146 | Grandma | "Grandma!" | G | prop_word_grandma | N | Doll figure, slightly shorter and rounder than Mummy: GREY hair in a round bun on top, round glasses, PURPLE cardigan with YELLOW buttons, a ROSE skirt. Skin tone f6cfa6. | 7000 |
| 147 | Grandpa | "Grandpa!" | G | prop_word_grandpa | N | Doll figure: bald top with GREY hair at the sides, big GREY moustache, flat BROWN cap, RED braces over a CREAM shirt. Skin tone f6cfa6. Look-alike: Daddy (grey, moustache, cap). | 7000 |
| 148 | Doctor | "Doctor!" | D | prop_word_doctor | N | Doll figure in a WHITE coat over a SKY top, a stethoscope round the neck (GREY tube, RED disc), a WHITE bag with a RED cross in one hand. INK hair in a bob. Skin tone d9a273. | 7000 |
| 149 | Queen | "Queen!" | Q | prop_word_queen | N | Doll figure in a long bell-shaped PURPLE gown with a WHITE fur trim dotted INK, wearing the big YELLOW crown with RED and BLUE gems (reuse the shapes of prop_word_crown, scaled), holding a short gold sceptre. Alphabet helper for Q (replaces "Queen's crown"). | 7500 |
| 150 | X-ray + | "X-ray!" | X | prop_word_xray | N | A thick rounded INK-blue plate on a small GREY stand, showing a WHITE cartoon hand skeleton (5 fat finger bones made of rounded segments, a wrist) as a raised sticker layer, a SKY glow rim. Friendly, not spooky. Alphabet helper for X. | 2500 |

### Batch 6 — My body, and getting clean (30 words · 7 new, 11 shown on characters)

**How body parts are shown.** No floating body parts. The camera pushes in on the part of a character, and a soft ring pulses on the part's anchor while the character wiggles that part. 11 words use the Bear, Bunny, Girl or Boy; this needs new **anchors** on those models (head, hair, cheek, armL, elbowL, legL, kneeL), which is rig work for this batch's agent, not new models. Three parts need a big clear model of their own because they are too small on a character: hand (also finger), foot (also toes close-up) and mouth (also teeth, tongue).

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 151 | Nose | "Nose!" | N | bear (anchor nose) | C | Existing anchor. Bear wiggles nose (scale pulse on the nose decal region). | — |
| 152 | Eye | "Eye!" | E | bear (anchor eyeL) | C | Existing anchor. Bear blinks slowly twice. | — |
| 153 | Ear | "Ear!" | E | bunny (anchor earL) | C | Existing anchor. Bunny, because its ears are the clearest; the ear flops. | — |
| 154 | Mouth | "Mouth!" | M | prop_word_mouth | N | A big friendly smiling mouth on a rounded skin-tone cushion (no eyes): ROSE lips, an open smile showing a row of 6 rounded WHITE top teeth and a PINK tongue (bones: jaw opens, tongue pokes out). Used for Mouth, Teeth and Tongue. | 3000 |
| 155 | Teeth | "Teeth!" | T | prop_word_mouth | R | Same model: jaw opens wide, the teeth layer flashes a highlight. | — |
| 156 | Tongue | "Tongue!" | T | prop_word_mouth | R | Same model: the tongue bone pokes out and wags. | — |
| 157 | Hair | "Hair!" | H | prop_word_girl (anchor hair) | C | Girl's bunches spring as she shakes her head. | — |
| 158 | Head | "Head!" | H | bear (new anchor head) | C | Bear pats the top of its head with one arm. | — |
| 159 | Hand | "Hand!" | H | prop_word_hand | N | A big open child's hand, palm forward, fingers up and spread: mitten-soft palm, five short fat fingers with rounded tips, a ROSE palm pad and faint nail ovals. Skin tone d9a273. Bones: finger.1 (thumb) to finger.5 (little finger) curl (rotation.x +); the whole hand waves (body). Used for Hand and Finger (index finger = finger.2). | 3500 |
| 160 | Finger | "Finger!" | F | prop_word_hand | R | Same model: four fingers curl down, the index finger stays up and wiggles. | — |
| 161 | Arm | "Arm!" | A | bear (new anchor armL) | C | Bear lifts one arm high and waves it. | — |
| 162 | Elbow | "Elbow!" | E | prop_word_boy (new anchor elbowL) | C | Boy puts hand on hip so the elbow points out; ring on the elbow. | — |
| 163 | Leg | "Leg!" | L | bear (new anchor legL) | C | Bear lifts one leg and shakes it. | — |
| 164 | Knee | "Knee!" | K | prop_word_boy (new anchor kneeL) | C | Boy lifts a knee; a small round plaster-pink patch decal marks each knee so the part reads (built: ROSE patch painted on both knees). | — |
| 165 | Foot | "Foot!" | F | prop_word_foot | N | One bare child's foot seen from the front-top, toes toward the camera: rounded heel and sole, five toes in a sloping row from a big round big toe down to a tiny little toe, faint nails. Skin tone f6cfa6. Bones: toes.1–5 wiggle. Used for Foot and Toes. | 3000 |
| 166 | Toes | "Toes!" | T | prop_word_foot | R | Same model: the five toes wiggle one after another. | — |
| 167 | Tummy | "Tummy!" | T | bear (anchor tummy) | C | Existing anchor. Bear pats its tummy with both hands. | — |
| 168 | Cheek | "Cheek!" | C | bear (new anchor cheek) | C | Bear's rosy cheeks puff (code face cheeks scale up). | — |
| 169 | Soap | "Soap!" | S | prop_word_soap | N | Word-card variant (prop_md_soap's heart hides at card size): a PINK bar tipped 38° up on a pile of WHITE suds so its pressed ROSE heart faces the camera, two small SKY bubbles floating up. Colour baked. | 2800 |
| 170 | Towel | "Towel!" | T | prop_word_towel | N | Word-card variant (prop_md_towel's origin is on its bar, so it hangs below the card floor): a thick SKY terry towel folded over a little WOOD towel stand (two posts, flat feet, round knobs), two WHITE woven bands near the hem. Colour baked, base on y = 0. | 3300 |
| 171 | Toothbrush | "Toothbrush!" | T | prop_md_brush | R | Existing, shown with the paste layer on. | — |
| 172 | Toothpaste | "Toothpaste!" | T | prop_md_paste | R | Existing tube. | — |
| 173 | Brush | "Brush!" | B | prop_md_hairbrush | R | Existing hairbrush. | — |
| 174 | Comb | "Comb!" | C | prop_word_comb | N | A wide chunky comb standing on its teeth, teeth toward -y: PURPLE rounded spine with a thumb grip dip, 9 fat rounded teeth. Look-alike: brush (flat, teeth in one row, no handle). | 1500 |
| 175 | Bath | "Bath!" | B | prop_md_bath | R | Existing. | — |
| 176 | Potty | "Potty!" | P | prop_word_potty | N | A one-piece toddler potty: rounded bowl with a high back rest and a raised front splash guard, wide flat base. GREEN with a WHITE inner bowl and a small star sticker on the back rest. | 2500 |
| 177 | Tissue | "Tissue!" | T | prop_md_tissues | R | Existing box with a tissue puffing out. | — |
| 178 | Sponge | "Sponge!" | S | prop_sponge | R | Existing. | — |
| 179 | Bubbles | "Bubbles!" | B | prop_word_bubbles | N | A YELLOW bubble wand (ring on a stick) standing in a small PINK tub, with five see-through bubbles of different sizes floating up and out from the ring (SKY spheres with WHITE glint and a PINK edge tint; each bubble has its own bone to drift). | 2500 |
| 180 | Plaster | "Plaster!" | P | prop_word_plaster | N | One big sticking plaster lying in a gentle arch: TAN strip with rounded ends, a raised CREAM pad in the middle, rows of tiny air-hole dots on each end, a RED heart sticker on the pad. | 1200 |

### Batch 7 — Toys, music and play (30 words · 18 new)

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 181 | Ball | "Ball!" | B | prop_word_ball | R | Existing. | — |
| 182 | Balloon | "Balloon!" | B | prop_word_balloon | N | Word-card variant: a RED teardrop balloon with a WHITE shine and a knot, a curly CREAM string down to a little loop on the ground. Colour baked. Bones: body (string end), tail.1 (spring: the balloon sways). | 1500 |
| 183 | Blocks | "Blocks!" | B | prop_m_block | R* | Existing block; the game stacks three (RED, YELLOW, BLUE) in a little tower for the card. No new model. | — |
| 184 | Book | "Book!" | B | prop_word_book | N | A thick picture book standing half open toward the camera: RED hard cover with a YELLOW star on the front, CREAM page block with three page lines, one page mid-turn (page bone turns), the open spread shows a simple sun picture. | 2500 |
| 185 | Doll | "Doll!" | D | prop_word_doll | N | A floppy rag doll sitting with legs out: YELLOW wool hair in two plaits, button eyes are the code face at small scale, PINK dress with a WHITE apron, striped RED-and-WHITE legs, stitched seams. Smaller and floppier than the people so it reads as a toy. | 6000 |
| 186 | Teddy | "Teddy!" | T | prop_word_teddy | N | A classic sitting teddy, clearly a toy and not the Bear character: TAN plush with visible stitched seams down the tummy, a square BLUE patch on one knee, round CREAM paw pads, a RED ribbon bow at the neck, head tilted. | 6500 |
| 187 | Puzzle | "Puzzle!" | P | prop_word_puzzle | N | Four chunky jigsaw pieces with round knobs, three joined in an L and the fourth lifted and tilted just above its gap (piece bone drops in): RED, YELLOW, GREEN, BLUE, thick WOOD-coloured sides. | 2500 |
| 188 | Crayon | "Crayon!" | C | prop_m_crayon | R | Existing. | — |
| 189 | Paint | "Paint!" | P | prop_word_paint | N | Word-card variant (prop_m_paintpot's label marks read as eyes and its origin is mid-height): a GREY paint tin with a WHITE shine ring and a YELLOW label with a RED splat, RED paint inside with a fat drip over the rim, a brush resting in it (WOOD handle, GREY ferrule, RED bristles). All baked, no composing. | 3100 |
| 190 | Pencil | "Pencil!" | P | prop_word_pencil | N | A fat short pencil leaning at 60°, point down, drawing a short curly GREY line on a WHITE paper square: YELLOW hexagon body, PINK rubber with a GREY metal band, WOOD cone and INK tip. Look-alike: crayon (hexagon, rubber, wooden point). | 1800 |
| 191 | Drum | "Drum!" | D | prop_drum | R | Existing. | — |
| 192 | Xylophone + | "Xylophone!" | X | prop_word_xylophone | N | Eight chunky bars getting shorter left to right in rainbow order (RED, ORANGE, YELLOW, GREEN, SKY, BLUE, PURPLE, PINK) on a WOOD frame with four round feet, two beaters with ball heads resting across it (bar bones dip when struck). Alphabet helper for X. | 3500 |
| 193 | Bell | "Bell!" | B | prop_word_bell | N | A hand bell: YELLOW flared bell with a rim band, a round clapper ball showing below (spring bone tail.1), a WOOD handle on top. (prop_cowbell is on a stand and reads as farm kit, so a new one.) | 1500 |
| 194 | Guitar | "Guitar!" | G | prop_word_guitar | N | A toy guitar standing upright: figure-eight ORANGE body with a dark round sound hole and a WHITE ring, WOOD neck, four fat CREAM strings, four round YELLOW tuning pegs on the head. | 3000 |
| 195 | Violin + | "Violin!" | V | prop_word_violin | N | A small BROWN violin leaning with its bow across it: narrow waist with two C-cuts, two f-hole stickers, a curled scroll at the top, INK chin rest; the bow is a WOOD stick with a WHITE ribbon. Look-alike: guitar (small, brown, has a bow). Alphabet helper for V. | 3000 |
| 196 | Piano | "Piano!" | P | prop_word_piano | N | A toy upright piano: RED rounded cabinet, a keyboard of 8 fat WHITE keys with 5 INK keys, a YELLOW music-note sticker on the front (key bones dip). | 3000 |
| 197 | Kite | "Kite!" | K | prop_word_kite | R | Existing. | — |
| 198 | Yo-yo + | "Yo-yo!" | Y | prop_word_yoyo | N | Two thick rounded discs with a groove between, hanging from a fat WHITE string that rises to a finger loop: RED discs with a YELLOW star on the face (bone: the yo-yo slides down and up the string and spins). Alphabet helper for Y. | 1500 |
| 199 | Bucket | "Bucket!" | B | prop_bucket | R | Existing. | — |
| 200 | Spade | "Spade!" | S | prop_spade | R | Existing. | — |
| 201 | Swing | "Swing!" | S | prop_word_swing | N | An A-frame of fat WOOD posts with a top bar, two thick YELLOW ropes down to a RED bucket seat (swing bone rocks from the top bar). | 3000 |
| 202 | Slide | "Slide!" | S | prop_word_slide | N | A chunky playground slide seen from three-quarters: BLUE ladder with four rungs and hand rails, a platform, a wide YELLOW chute curving down to the front with raised sides. | 3500 |
| 203 | Seesaw | "Seesaw!" | S | prop_word_seesaw | N | Word-card variant (prop_bal_seesaw is a thin plank at card size): a chunky toy seesaw, RED wedge pivot with a WHITE axle cap, a YELLOW plank tilted left-end-down, BLUE seats with backrests and RED loop handles at both ends. Bone plank (rotation.z rocks it on the pivot). | 2500 |
| 204 | Robot + | "Robot!" | R | prop_word_robot | N | A boxy toy robot with rounded corners: SKY square head with a code face on a darker screen panel, one spring antenna with a RED ball, GREY body with three coloured chest buttons and a dial, tube arms with C-claw hands (arm bones), fat feet. | 6000 |
| 205 | Rocket + | "Rocket!" | R | prop_word_rocket | N | A toy rocket standing on three fins: fat WHITE body, RED nose cone and fins, a round SKY porthole with a YELLOW rim, a BLUE band; an ORANGE-and-YELLOW flame layer below (flame bone, hidden at rest). | 3000 |
| 206 | Present | "Present!" | P | prop_m_giftbox | R | Existing gift box with prop_m_giftlid. | — |
| 207 | Rattle | "Rattle!" | R | prop_word_rattle | N | A baby rattle: a round see-through SKY ball head with five coloured beads visible inside, a ringed PINK handle ending in a YELLOW loop. | 2000 |
| 208 | Top | "Top!" | T | prop_word_top | N | A classic spinning top balanced on its point (leaning 8°): a wide rounded double-cone body in horizontal bands RED, YELLOW, GREEN, BLUE, a WOOD plunger knob on top. Spins on its body bone. | 1500 |
| 209 | Tent | "Tent!" | T | prop_word_tent | N | A play tent: a triangle ridge tent with both front flaps tied open showing a dark-PURPLE inside and a small YELLOW cushion, ORANGE-and-WHITE stripes, a small flag on the ridge, two guy ropes with pegs. | 3000 |
| 210 | Castle | "Castle!" | C | prop_word_castle | N | Word-card variant (prop_castle is a beige sandcastle): a toy castle, GREY crenellated front wall and taller keep, two round towers with RED cone roofs and INK window slits, a WOOD arched door, a YELLOW flag on the keep. | 4100 |

### Batch 8 — Kitchen and things around the house (30 words · 20 new)

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 211 | Cup | "Cup!" | C | prop_word_cup | N | A chunky BLUE mug tipped 16° toward the child so the CREAM inside shows, a big fat YELLOW loop handle at +x, a WHITE glint. (prop_m_cup read as a bucket at card size: no visible handle.) | 1500 |
| 212 | Bottle | "Bottle!" | B | prop_word_bottle | N | A baby bottle: see-through SKY body two-thirds full of WHITE milk with three measure lines, a wide PINK collar ring, a TAN teat on top. (prop_md_bottle is bubble bath, so a new one.) | 2000 |
| 213 | Bowl | "Bowl!" | B | prop_bowl | R | Existing. | — |
| 214 | Plate | "Plate!" | P | prop_m_plate | R | Existing, tilted up 50° on the card so the round face shows. | — |
| 215 | Spoon | "Spoon!" | S | prop_word_spoon | N | A toddler spoon standing at a slant: deep round GREY bowl with a WHITE highlight, a short fat BLUE handle with a round end and a small star. (prop_farmspoon is a hanging wooden spoon.) | 1200 |
| 216 | Fork | "Fork!" | F | prop_word_fork | N | The spoon's partner, same size: GREY head with three short fat rounded prongs, a short fat GREEN handle. Look-alike: spoon (prongs; different handle colour). | 1200 |
| 217 | Knife | "Knife!" | K | prop_ck_knife | R | Existing friendly cook's knife. | — |
| 218 | Pot | "Pot!" | P | prop_cookpot | R | Existing cook pot. | — |
| 219 | Kettle | "Kettle!" | K | prop_word_kettle | N | A round-bellied stove kettle: RED body, a short curved GREY spout with a puff of WHITE steam (steam bone), a big arched INK handle over the top, a small lid with a ball knob. Look-alike: teapot (handle over the top, steam, red). | 2500 |
| 220 | Jug | "Jug!" | J | prop_bal_jug | R | Existing, tinted YELLOW. | — |
| 221 | Jar | "Jar!" | J | prop_word_jar | N | A round see-through SKY glass jar of sweets: coloured round sweets in the bottom half, WHITE glints, a chunky ORANGE screw lid with two thread lines (lid bone lifts). Look-alike: jam (no red contents, no gingham cloth, no label). (prop_jar is a square glass case.) | 2200 |
| 222 | Teapot | "Teapot!" | T | prop_word_teapot | N | A fat round teapot: long S-curved spout to +x, loop handle at -x, lid with a round knob (lid bone lifts). CREAM with BLUE polka dots and a BLUE lid, to match prop_teacup. | 2500 |
| 223 | Key | "Key!" | K | prop_sinkkey | R | Existing. | — |
| 224 | Clock | "Clock!" | C | prop_md_clock | R | Existing. | — |
| 225 | Watch | "Watch!" | W | prop_word_watch | N | A chunky child's wristwatch curled in a ring as if on a wrist: round WHITE face with four INK number dots and two fat hands (RED and BLUE), YELLOW case, GREEN strap with holes and a buckle. Look-alike: clock (strap). | 2000 |
| 226 | Phone | "Phone!" | P | prop_word_phone | N | A rounded smartphone leaning back on a small stand: INK body, a bright SKY screen showing a GREEN call-button circle with a WHITE handset icon, and a 3 x 3 grid of small coloured app squares above it. | 1500 |
| 227 | Lamp | "Lamp!" | L | prop_word_lamp | N | A classic table lamp: round BLUE base and fat stem, an open YELLOW drum shade wider at the bottom with WHITE trims (layer `shade`, the game can make it glow), a WHITE bulb top showing, an INK pull cord with a RED bead. (prop_md_lamp read as a mushroom.) | 2000 |
| 228 | Torch | "Torch!" | T | prop_word_torch | N | A fat torch along x, lens toward +x: RED barrel with grip ridges, a wide GREY flared head, a YELLOW lens disc, a BLUE slide switch on top; a see-through pale YELLOW cone of light as a layer (shown when "on"). | 2000 |
| 229 | Box | "Box!" | B | prop_box | R | Existing cardboard box with flaps. Also the "ends in x" alphabet helper. | — |
| 230 | Basket | "Basket!" | B | prop_word_basket | N | An oval WOOD basket of stacked fat coils (alternate coils a shade darker), a BROWN braided rim and a big arched BROWN handle over the top. Look-alike: nest (handle, straight sides, no eggs). (prop_wicker has no handle.) | 2200 |
| 231 | Bin | "Bin!" | B | prop_word_bin | N | A GREEN pedal bin with the lid baked in: a GREY dome lid with a WHITE band and a knob (lid bone, hinged at the back), a GREY pedal at the front, a WHITE glint. | 1600 |
| 232 | Broom | "Broom!" | B | prop_word_broom | N | A broom standing head-down, leaning 10°: long fat WOOD handle with a RED tip, a wide flared head of chunky YELLOW bristle strands bound by two RED bands, a little dust-cloud puff layer at the bristles. | 2000 |
| 233 | Vacuum | "Vacuum!" | V | prop_word_vacuum | N | A cylinder vacuum cleaner: a rounded PURPLE body on two big wheels with a YELLOW button and a see-through SKY dust window, a fat ribbed GREY hose looping up to a wide floor head at the front. Alphabet helper for V. | 3500 |
| 234 | Scissors | "Scissors!" | S | prop_word_scissors | N | Round-ended child's scissors open in an X: two short GREY blades with rounded tips, two big loop handles, one ORANGE and one BLUE, a YELLOW pivot dot (blade bones snip). | 1800 |
| 235 | Hammer | "Hammer!" | H | prop_word_hammer | N | A toy hammer leaning head-up: fat WOOD handle, a chunky rounded RED head with a YELLOW flat face at one end and a rounded peen at the other. | 1500 |
| 236 | Money | "Money!" | M | prop_coin | R* | Existing coin; the game shows a short stack of three with one standing on edge. | — |
| 237 | Vase | "Vase!" | V | prop_word_vase | N | A curvy vase with a narrow neck and flared lip: BLUE with a WHITE wavy band, holding three simple flowers on fat GREEN stems (one RED tulip, one YELLOW daisy, one PINK). The vase is 60% of the height so the vase, not the flowers, is the subject. | 3000 |
| 238 | Candle | "Candle!" | C | prop_word_candle | N | A short fat CREAM candle in a round BLUE holder with a finger loop, two wax drips down the side, a teardrop flame YELLOW with an ORANGE core (flame bone flickers). | 1500 |
| 239 | Picture | "Picture!" | P | prop_frame | R* | Existing frame; the game puts a simple canvas picture (a house and sun) inside. | — |
| 240 | TV | "TV!" | T | prop_word_tv | N | A rounded flat TV on a small stand: INK-SLATE frame with fat rounded corners, a bright SKY screen showing a simple scene sticker (green hill, yellow sun), a RED power dot, a small remote lying in front. Look-alike: picture, phone (stand, wide, remote). | 2000 |

### Batch 9 — Furniture, rooms and things that go (30 words · 25 new)

Vehicles are **toy vehicles**: short, tall and round, wheels 30% larger than real, big rounded SKY windows with a WHITE glint, no drivers. Every vehicle has `wheel.F` and `wheel.B` bones (both wheels on an axle turn together) so they can roll. Each vehicle owns one colour.

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 241 | Chair | "Chair!" | C | prop_chair | R | Existing. | — |
| 242 | Table | "Table!" | T | prop_word_table | N | Word-card table (prop_md_table is a bedside cabinet and read as "drawers"): a thick rounded WOOD top with a darker apron, four fat slightly tapered legs with dark feet. No face. | 1600 |
| 243 | Bed | "Bed!" | B | prop_word_bed | N | Word-card bed, short and chunky for the card (prop_md_bed is a long flat frame): WOOD headboard (tall, peaked) and lower footboard, WHITE mattress, a puffy WHITE pillow, a thick BLUE duvet with a turned-down pale edge hanging over both sides with two YELLOW stars. prop_md_bed stays for the Home world and the Sleep animation. | 3000 |
| 244 | Sofa | "Sofa!" | S | prop_word_sofa | N | A plump two-seat sofa: fat rolled arms, two seat cushions and two back cushions with a button dimple each, four short WOOD feet. GREEN with one YELLOW scatter cushion. Look-alike: armchair, bed (two seats wide, arms both ends). | 3500 |
| 245 | Door | "Door!" | D | prop_m_door | R | Existing; opens on its hinge. | — |
| 246 | Window | "Window!" | W | prop_word_window | N | Word-card window (prop_window is a thin white frame that vanished on light cards): a WHITE rounded frame with a cross of bars, four BLUE-tinted SKY panes with WHITE glints, a WOOD sill, PINK curtains on a WOOD rail gathered by YELLOW ties. | 3300 |
| 247 | Stairs | "Stairs!" | S | prop_word_stairs | N | Five chunky WOOD steps rising to the right with a RED carpet runner down the middle, a handrail on fat posts along the far side with a round ball on the bottom post. | 3000 |
| 248 | Fridge | "Fridge!" | F | prop_k_fridge | R | Existing. | — |
| 249 | Oven | "Oven!" | O | prop_word_oven | N | A rounded cooker: WHITE body, a big oven door with a dark SKY window showing a tray glow in ORANGE (door bone opens down), a GREY bar handle, four round INK hob rings on top, a row of four RED knobs. | 3500 |
| 250 | Sink | "Sink!" | S | prop_md_sink | R | Existing basin with tap. | — |
| 251 | Toilet | "Toilet!" | T | prop_word_toilet | N | A rounded WHITE toilet: oval bowl, a seat and a lid standing open (lid bone), a square cistern behind with a GREY push button, a BLUE water disc inside, a loo roll on a holder at the side. Look-alike: potty (tall, has cistern and lid, white). | 3500 |
| 252 | Mirror | "Mirror!" | M | prop_word_mirror | N | Word-card mirror (prop_mirror is an empty frame): an oval YELLOW frame on a post and oval foot, silvery-blue glass with two WHITE diagonal highlight streaks and a darker rim shade. Look-alike: window (oval, one pane, no bars or curtains). | 1500 |
| 253 | Pillow | "Pillow!" | P | prop_word_pillow | N | A fat puffy rectangle pillow with four soft pointed corners and a sagging middle crease: WHITE with thin SKY stripes and a frilled edge on one end. | 1500 |
| 254 | Quilt | "Quilt!" | Q | prop_word_quilt | N | A thick patchwork quilt draped over a low rail so it hangs in soft folds: a grid of puffy squares in RED, YELLOW, GREEN, BLUE, PINK, each with a stitched cross dimple, a WHITE scalloped border. Alphabet helper for Q. | 3500 |
| 255 | Blanket | "Blanket!" | B | prop_word_blanket | N | A soft baby blanket folded in a thick square with one corner flopped open: plain PURPLE fleece with a wide satin PINK edge and one WHITE star. Plain and folded so it differs from the quilt. (prop_m_blanket is a 9-unit picnic rug.) | 1800 |
| 256 | Car | "Car!" | C | prop_word_car | N | Word-card toy car with its colour baked in (prop_m_car is tint-only): round BLUE body and cabin, four SKY windows and front/back screens with glints, door seam and handle, GREY bumpers, round lamps, WHITE hubs (wheel.F / wheel.B). | 3900 |
| 257 | Bus | "Bus!" | B | prop_word_bus | N | A tall rounded single-decker bus: RED, a row of four big side windows and a wide front window, a BLUE door, a YELLOW destination strip, round headlights. Longest vehicle (ratio 2:1). | 5000 |
| 258 | Train | "Train!" | T | prop_word_train (+ prop_word_carriage) | N | Word-card steam engine with baked colours (prop_engine is tint-only): BLUE boiler with YELLOW bands and dome, SLATE smokebox and chimney (chimney bone), RED cab with a window and RED cow-catcher, RED wheels (wheel.F / wheel.B), GREY coupling rods. prop_word_carriage goes behind it if space: a YELLOW coach with a RED roof and band, three windows a side, SLATE chassis and couplers, RED wheels. | 4700 + 3700 |
| 259 | Truck | "Truck!" | T | prop_word_truck | N | A dumper truck: BLUE cab with one side window, a big open YELLOW tipping bed (bed bone tips), six fat wheels in three pairs, a silver grille. | 5000 |
| 260 | Tractor | "Tractor!" | T | prop_word_tractor | N | GREEN body with a tall open cab frame and roof, a small exhaust pipe on the bonnet, huge YELLOW-hubbed back wheels with chunky tread blocks and small front wheels. | 5500 |
| 261 | Digger + | "Digger!" | D | prop_word_digger | N | YELLOW excavator: a cab on a turntable over two INK caterpillar tracks, a two-part arm (boom and stick bones) ending in a toothed bucket (bucket bone scoops). | 6000 |
| 262 | Fire engine | "Fire engine!" | F | prop_word_fireengine | N | RED engine with a WHITE stripe, a long GREY ladder lying on top that tilts up (ladder bone), a coiled YELLOW hose reel on the side, a BLUE light on the cab roof. | 6000 |
| 263 | Ambulance | "Ambulance!" | A | prop_word_ambulance | N | WHITE boxy van with a RED stripe round the middle, a big RED cross on the side and back door, a BLUE light bar on the roof. Look-alike: van (white with red cross and light). | 5000 |
| 264 | Plane | "Plane!" | P | prop_word_plane | N | A fat-bodied toy aeroplane: WHITE body with a BLUE belly stripe, short rounded wings with a RED engine pod each, a RED tail fin, four round windows, a rounded cockpit glass. Small wheels down. Propeller on the nose (prop bone spins). | 4500 |
| 265 | Helicopter | "Helicopter!" | H | prop_word_helicopter | N | A bubble-cab helicopter: ORANGE egg body with a huge SKY bubble window, a thin tail boom with a small side rotor, two skids, a big four-blade GREY rotor on top (rotor bone spins). | 4500 |
| 266 | Boat | "Boat!" | B | prop_sailboat | R | Existing sailboat. | — |
| 267 | Bike | "Bike!" | B | prop_word_bike | N | A child's bike in side view, standing on its stabilisers: fat PINK frame tubes (0.08), two big wheels with INK tyres and YELLOW hubs with four fat spokes, a WHITE saddle, handlebars with tassels, a small front basket. | 5000 |
| 268 | Scooter | "Scooter!" | S | prop_word_scooter | N | A three-wheel toddler scooter: a wide GREEN foot deck, two front wheels and one back, a tall T handlebar with ORANGE grips. Look-alike: bike (no seat, flat deck, T bar). | 3000 |
| 269 | Pushchair | "Pushchair!" | P | prop_word_pushchair | N | A buggy in side view: a PURPLE fabric seat with a curved hood (hood bone folds), a GREY frame with a push handle, four small wheels, a basket underneath; a small teddy sits in it so the seat reads. | 5000 |
| 270 | Van | "Van!" | V | prop_word_van | N | A rounded delivery van: ORANGE with a windowless box back carrying a big WHITE parcel sticker on the side, a cab with a side window, double back doors. Alphabet helper for V. | 4500 |

### Batch 10 — Outside, nature and places (30 words · 7 new)

| # | Word | Line | L | Model | Src | Spec: shape, signature details, colours | Tris |
|---|---|---|---|---|---|---|---|
| 271 | Sun | "Sun!" | S | prop_word_sun | R | Existing. | — |
| 272 | Moon | "Moon!" | M | prop_word_moon | R | Existing. | — |
| 273 | Star | "Star!" | S | prop_word_star | N | A puffy YELLOW five-point star standing on two points, no face. | — |
| 274 | Cloud | "Cloud!" | C | prop_word_cloud | N | A WHITE puffy cloud with a flat pale-SKY underside, no face. | — |
| 275 | Rain | "Rain!" | R | prop_word_cloud + prop_m_drop | R* | The word-card cloud tinted GREY-blue with six existing drops falling from it in a loop (game composes; drops fade in under the cloud and out at the ground, never teleport). | — |
| 276 | Rainbow | "Rainbow!" | R | prop_rainbow | R | Existing. | — |
| 277 | Snowman | "Snowman!" | S | prop_scene_snowman | R | Existing. | — |
| 278 | Tree | "Tree!" | T | prop_word_tree | R | Existing. | — |
| 279 | Flower | "Flower!" | F | prop_word_flower | R* | prop_bloom_daisy rebuilt without its face. | — |
| 280 | Leaf | "Leaf!" | L | prop_word_leaf | R | Existing. | — |
| 281 | Grass | "Grass!" | G | prop_word_grass | N | A thick tuft of about 14 fat pointed blades fanning from a small mound, different heights, two shades (GREEN and LEAF), one tiny WHITE daisy at the base (blades spring: tuft bones). | 2000 |
| 282 | Stone | "Stone!" | S | prop_rock | R | Existing rock. | — |
| 283 | Stick | "Stick!" | S | prop_word_stick | N | One fat knobbly BROWN stick lying along x with a short forked side twig, a paler cut end showing two rings, and one small GREEN leaf still on the fork. | 1200 |
| 284 | Puddle | "Puddle!" | P | prop_word_puddle | N | A BLUE puddle with two ripple rings and a glint, sunk in a grassy oval tile tipped 50° toward the child so it reads at card height. | — |
| 285 | Mud | "Mud!" | M | prop_word_mud | N | A gloopy BROWN mud splat with flat lumps and three bubbles on a grassy oval tile tipped 45° toward the child. | — |
| 286 | Sand | "Sand!" | S | prop_sandpile | R | Existing pile. | — |
| 287 | Shell | "Shell!" | S | prop_seashell | R | Existing. | — |
| 288 | Nest | "Nest!" | N | prop_word_nest | R | Existing. | — |
| 289 | Umbrella | "Umbrella!" | U | prop_word_umbrella | R* | prop_umbrella rebuilt with a RED canopy baked in. | — |
| 290 | Watering can | "Watering can!" | W | prop_word_wateringcan | N | A round GREEN can with a long spout to +x ending in a wide YELLOW rose with dot holes, a big loop handle over the top and back, and a fan of five SKY water drops from the rose (drop layer, shown when tipped). | 2500 |
| 291 | Ladder | "Ladder!" | L | prop_word_ladder | N | A short A-frame stepladder: two fat RED side rails each side, five thick YELLOW rungs on the front, a small top platform. Rails 0.09 thick. | 2000 |
| 292 | Fire | "Fire!" | F | prop_bonfire | R | Existing bonfire. | — |
| 293 | Mountain | "Mountain!" | M | prop_word_mountain | N | One big rounded-triangle peak with a smaller one beside it: PURPLE-GREY rock, a WHITE snow cap with a wavy lower edge on each, three tiny GREEN pine cones of trees at the foot for scale. | 2500 |
| 294 | Igloo + | "Igloo!" | I | prop_word_igloo | N | A WHITE dome built of rounded ice blocks (three courses of SKY-shaded block lines), a short arched tunnel entrance at the front with a dark INK-blue inside, a small snow drift at the side. Alphabet helper for I. | 2500 |
| 295 | Island | "Island!" | I | prop_word_island | N | One model: a BLUE water disc with a WHITE foam ring, a pale sand mound, a curved palm with six GREEN fronds and three coconuts. (prop_word_palm, the beach palm with GREEN fronds baked in, also exists.) | — |
| 296 | House | "House!" | H | prop_house | R | Existing. | — |
| 297 | Shop | "Shop!" | S | prop_word_shop | N | A compact toy shop that fills the card: pale-ROSE walls, BLUE roof, YELLOW sign board, RED/WHITE striped scalloped awning, a window of coloured goods, a BLUE door. | — |
| 298 | Barn | "Barn!" | B | prop_barn | R | Existing. | — |
| 299 | Bridge | "Bridge!" | B | prop_word_bridge | N | A humpback GREY stone arch bridge (block lines) with WOOD railings over a little BLUE stream. (prop_m_bridge is a castle drawbridge.) | — |
| 300 | Zoo + | "Zoo!" | Z | prop_word_zoo | N | A zoo entrance: two fat striped posts (ORANGE and WHITE) holding a curved GREEN arch sign with three big WHITE letter-like blocks, a small giraffe head and neck peeking over the fence on one side and a monkey tail hanging on the other, a low WOOD fence each side. Alphabet helper for Z. | 5000 |

### Batch 11 — Doing and describing words (20 words · animation only, no new models)

Each is a 2–3 s looped animation of a model that already exists. The "spec" is the animation brief. The actor must never teleport or clip: every move starts and ends in the rest pose.

| # | Word | Line | L | Model | Src | Animation brief | Tris |
|---|---|---|---|---|---|---|---|
| 301 | Jump | "Jump!" | J | frog | A | Frog crouches (anticipation 0.4 s), jumps straight up one body height, lands with a soft squash. No boing sound. | — |
| 302 | Sleep | "Sleep!" | S | bear + prop_md_bed | A | Bear lies in the bed under the duvet, eyes closed (calm face), chest rises slowly, three small "z" stickers drift up. | — |
| 303 | Eat | "Eat!" | E | bunny + prop_carrot | A | Bunny holds the carrot and takes three nibbles; the carrot shortens by a bite each time. | — |
| 304 | Wave | "Wave!" | W | pip | A | Pip lifts one wing and waves it side to side three times, looking at the child. | — |
| 305 | Clap | "Clap!" | C | monkey | A | Monkey claps both hands in front of its chest three times. One soft clap sound per clap is allowed. | — |
| 306 | Dance | "Dance!" | D | pig | A | Pig sways hips left and right, arms up, one slow full turn. | — |
| 307 | Kiss | "Kiss!" | K | hen + chick | A | Hen leans down and touches beak to the chick's head; one small PINK heart sticker rises. | — |
| 308 | Hug | "Hug!" | H | bear + bunny | A | Bear and bunny step together (walk gait), arms wrap, a gentle squeeze, hold 1 s. Check no clipping at the tummies. | — |
| 309 | Open | "Open!" | O | prop_chest | A | The chest lid lifts slowly on its hinge to show a soft glow inside, then closes. | — |
| 310 | Quack | "Quack!" | Q | duck | A | Duck opens its bill wide twice with the existing quack call. Alphabet helper for Q. | — |
| 311 | Yawn | "Yawn!" | Y | cat | A | Cat's mouth opens wide, eyes squeeze shut, front paws stretch forward, then settle. Alphabet helper for Y. | — |
| 312 | Up | "Up!" | U | prop_m_balloon | A | A RED balloon rises slowly from the ground to the top of the card, string trailing; the camera tilts up with it. | — |
| 313 | Down | "Down!" | D | chick + prop_word_slide | A | Chick sits at the top of the slide and slides down to the bottom. Needs batch 7's slide; until then use prop_sinkramp. | — |
| 314 | Under | "Under!" | U | cat + prop_md_table | A | Cat walks under the table and sits there, peeking out. | — |
| 315 | Big | "Big!" | B | elephant | A | Elephant fills the card, raises its trunk; the camera pulls back to fit it. Shown before or after Little, never together on first meeting. | — |
| 316 | Little | "Little!" | L | prop_word_mouse | A | Mouse sits small in the middle of a wide empty card; the camera pushes in to find it. Until batch 1's mouse exists, use chick. | — |
| 317 | Hot | "Hot!" | H | prop_word_soup | A | Soup steam curls rise; Pip leans in, pulls back and blows. Until batch 4's soup exists, use prop_cookpot with steam. | — |
| 318 | Cold | "Cold!" | C | prop_scene_snowman + pip | A | Pip stands by the snowman and shivers (fast small shake), small SKY snowflakes drift down. | — |
| 319 | Happy | "Happy!" | H | bear | A | Bear's face goes to joy, a small bounce on the toes, arms up. | — |
| 320 | Sad | "Sad!" | S | bear | A | Bear's face goes to sad, shoulders and head droop, one tear. Ends by returning to calm so the card never leaves her on sad. | — |

---

## 3. Build batches for the modelling agents

Ten agents, one per batch, in parallel. Each agent owns its batch's 30 words: it **builds the new models** and **audits the reused ones** at card size (run `tools/viewmodel.sh`, apply the 96 px thumbnail test, and report any reused model that fails rule 12 instead of editing another script). Because so much already exists, the new-model load is uneven; the two heaviest batches are split between two agents.

| Batch | Theme | Words | New models | Reuse / on character | Script | Agents |
|---|---|---|---|---|---|---|
| 1 | Farm, pet and garden animals | 1–30 | 11 | 19 | `prop_words_animals1.py` | 1 |
| 2 | Wild, sea and tiny animals | 31–60 | 23 | 7 | `prop_words_animals2a.py` (34–46), `prop_words_animals2b.py` (47–60) | 2 |
| 3 | Fruit and vegetables | 61–90 | 7 | 23 | `prop_words_fruitveg.py` | 1 |
| 4 | Meals, snacks and drinks | 91–120 | 24 | 6 | `prop_words_food.py` | 1 |
| 5 | Clothes and people | 121–150 | 25 | 5 | `prop_words_clothes.py` (122–140, 150), `prop_words_people.py` (141–149) | 2 |
| 6 | My body, and getting clean | 151–180 | 7 (+ 7 new anchors) | 23 | `prop_words_body.py` | 1 |
| 7 | Toys, music and play | 181–210 | 18 | 12 | `prop_words_toys.py` | 1 |
| 8 | Kitchen and household things | 211–240 | 20 | 10 | `prop_words_home.py` | 1 |
| 9 | Furniture, rooms and things that go | 241–270 | 25 | 5 | `prop_words_rooms.py` (furniture), `prop_words_vehicles.py` | 1 |
| 10 | Outside, nature and places | 271–300 | 7 | 23 | `prop_words_outside.py` | 1 (also takes batch 11's staging checks) |
| 11 | Doing and describing words | 301–320 | 0 | 20 animations | game code, after batches 1, 4 and 7 land | — |
| | **Total** | **320** | **167** | | | |

**Per-batch style notes (on top of the shared rules in section 1).**
- **Batches 1–2, animals.** All figurines share one build: same eye size and height on the face (use `faceScale` 1.0–1.15), same stub-leg thickness, same tummy-patch treatment, sitting unless the animal's shape needs four legs (horse-like, giraffe, deer, zebra, camel, yak). Line them up in one render before finishing; no animal should look like it came from another toy box. Sea animals have no legs and rest on their tummy or a small splash base.
- **Batch 3–4, food.** Everything is "one serving on a plate or in a bowl". Bowls and plates come from one shared profile function in the script, in different colours, so the crockery is a set. Food is slightly glossy: one hard-edged highlight band, never more.
- **Batch 5, clothes.** Same invisible-toddler body form under every garment so sizes match. Fabric is thick (0.08 hem thickness). People: one shared base-body function with parameters (height, girth, skin tone); hair, clothes and the one naming prop are layers.
- **Batch 6, body.** Hand, foot and mouth use the same three skin tones as the people. Keep them soft and mitten-like; no knuckles, no wrinkles.
- **Batch 7, toys.** Primary colours, WOOD parts, visible toy construction (pegs, knobs, stitched seams).
- **Batch 8, household.** Metal is always GREY with one WHITE band; handles are always a second colour from the body so the "holdable" part reads.
- **Batch 9, furniture and vehicles.** Furniture matches the existing Home world (`prop_md_*`, `prop_k_*`): rounded, pastel-leaning, WOOD feet. Vehicles share one wheel function (INK tyre, coloured hub, 5 tread bumps) at three sizes.
- **Batch 10, outside.** Matches the existing meadow and beach props; ground-contact models get a small grass or sand base only if they would otherwise fall over.

**Done means** (per model): builds with `tools/blender/build.sh`, appears in `index.json`, passes the cover-the-label test at card size and at 96 px, sits on y = 0 without clipping a flat card floor, tris within budget, named bones move only their own part (check `-pose.png`), and it sits next to its listed look-alike without confusion.

---

## 4. The alphabet (A–Z, at least three good words each)

The alphabet game picks from these. **Bold** = the recommended first pick (the clearest sound-to-picture match, using the letter's most common sound). The existing A–T picks in `bricks-words.js` are kept except Q.

| Letter | Count | Words (bold = alphabet picks) | Notes |
|---|---|---|---|
| A | 5 | **Apple**, **Ant**, **Ambulance**, Avocado, Arm | Short "a" for all three picks. |
| B | 38 | **Ball**, **Bear**, **Banana**, Bus, Book, Boat, Bed, Baby … | |
| C | 32 | **Cat**, **Cow**, **Car**, Cup, Cake, Carrot … | Use hard-c words only; avoid Cheese, Chick, Chair, Cherry, Chips, Chocolate, Cereal for the letter game ("ch" and soft c). |
| D | 16 | **Duck**, **Dog**, **Drum**, Door, Doll, Dinosaur … | |
| E | 6 | **Egg**, **Elephant**, **Elbow**, Eye, Ear, Eat | Egg, Elephant, Elbow have the short "e"; Eye, Ear, Eat do not, so keep them out of the letter game. |
| F | 11 | **Fish**, **Frog**, **Fox**, Flower, Fork, Foot … | |
| G | 11 | **Grapes**, **Goat**, **Girl**, Guitar, Grass … | Hard g only; avoid Giraffe for the letter game. |
| H | 15 | **Hat**, **Horse**, **Hen**, House, Hand, Hammer … | |
| I | 4 | **Igloo**, Ice cream, Ice, Island | Thin letter. Igloo is the only short "i"; Ice cream stays as the existing pick, with Ice and Island as the long-"i" family. |
| J | 8 | **Jellyfish**, **Jam**, **Jug**, Juice, Jelly, Jar, Jumper, Jump | |
| K | 9 | **Kite**, **Key**, **Kangaroo**, Koala, Kiwi, Kettle, Kiss | Avoid Knee and Knife for the letter game (silent k). |
| L | 10 | **Leaf**, **Lion**, **Lemon**, Lamp, Ladder, Ladybug … | |
| M | 11 | **Moon**, **Mouse**, **Milk**, Monkey, Mummy, Mirror … | |
| N | 5 | **Nest**, **Nose**, **Nappy**, Noodles, Necklace | |
| O | 6 | **Owl**, **Octopus**, **Orange**, Onion, Oven, Open | Octopus and Orange carry the short "o". |
| P | 32 | **Pig**, **Pear**, **Pizza**, Panda, Penguin, Plane … | Avoid Phone for the letter game ("ph"). |
| Q | 3 | **Queen**, **Quilt**, **Quack** | Workaround: Q has almost no toddler nouns. Queen is now a full figure (replacing "Queen's crown", which starts with the wrong picture); Quilt is a real bedtime object; Quack is the duck's animation, the one Q word every toddler already says. Spare: the question mark `prop_st_qmark` ("Question!") if a fourth is ever needed. |
| R | 7 | **Rabbit** (bunny, existing pick), **Rainbow**, **Rocket**, Robot, Rain, Rice, Raspberry, Rattle | The bunny is "Bunny!" as a word and "R is for Rabbit!" in the alphabet, as now. |
| S | 38 | **Sun**, **Sock**, **Spoon**, Star, Snail, Sandwich … | Avoid Sheep, Shoe, Shell, Shark, Shop, Shorts for the letter game ("sh"). |
| T | 27 | **Tree**, **Tiger**, **Train**, Table, Teddy, Tomato … | All plain "t". Avoid T-shirt and TV for the letter game (they say the letter name). |
| U | 4 | **Umbrella**, **Up**, **Under**, Unicorn | Workaround: three short-"u" picks; two are position words shown as animations (balloon goes up, cat under table). Unicorn has the long "you" sound, so it is a card word but the fourth choice for the letter. |
| V | 5 | **Van**, **Vase**, **Violin**, Vegetables, Vacuum | Workaround: Van and Vase are plain; Violin, Vegetables and Vacuum were added to make V deep enough. |
| W | 8 | **Water**, **Worm**, **Whale**, Window, Watch, Watermelon, Watering can, Wave | |
| X | 2 + 2 | **Xylophone**, **X-ray**, **bo-X** (also fo-X) | Workaround: no toddler word starts with the "ks" sound. Xylophone and X-ray are the two real X-initial pictures (Xylophone says "z", X-ray says the letter's name). The third is the honest phonics one: X at the **end**, "X is in bo**x**!" and "X is in fo**x**!", using the existing Box and the new Fox, with the X brick lighting up at the end of the word. |
| Y | 4 | **Yogurt**, **Yo-yo**, **Yak**, Yawn | Workaround: Yo-yo and Yak were added for Y. Yawn is the cat's animation. |
| Z | 3 | **Zebra**, **Zip**, **Zoo** | Workaround: Zip and Zoo were added for Z; both are things a toddler meets (coat zip, zoo trip). |

Every letter has at least three words; the thin letters are I (4), U (4), Y (4), Q (3), Z (3) and X (2 initial + 2 final).

---

## 5. Dialect switches

Default is British. Where the American word differs, record a second clip with the same id plus `_us`; the model is the same.

| Default line | US line | Letter change |
|---|---|---|
| "Nappy!" | "Diaper!" | N → D |
| "Trousers!" | "Pants!" | T → P |
| "Jumper!" | "Sweater!" | J → S |
| "Mummy!" | "Mommy!" | — |
| "Chips!" | "Fries!" | C → F |
| "Lolly!" | "Popsicle!" | L → P |
| "Jelly!" | "Jello!" | — |
| "Torch!" | "Flashlight!" | T → F |
| "Plaster!" | "Band-aid!" | P → B |
| "Pushchair!" | "Stroller!" | P → S |
| "Bin!" | "Trash can!" | B → T |
| "Sofa!" | "Couch!" | S → C |
| "Pyjamas!" | "Pajamas!" (spelling only) | — |
| "Doughnut!" | "Donut!" (spelling only) | — |
| "Tummy!", "Boots!", "Plane!", "Cookie!", "Ladybug!", "Truck!" | same | Chosen because they work in both. |

None of the alphabet picks in section 4 changes letter under the US switch except Nappy (use Noodles instead).

---

## 6. Voice lines to generate

- **320 word clips:** exactly the "Line" column above, ids `word_<id>`.
- **Alphabet clips for the bold picks in section 4** (about 78): "`<Letter>` is for `<Word>`!", plus the two X-final lines "X is in box!" and "X is in fox!". The A–T lines that already exist are reused; "Q is for Queen's crown!" is replaced by "Q is for Queen!".
- **12 US alternates** from section 5.
- No other lines belong to this document; each game lists its own prompts and praise.
