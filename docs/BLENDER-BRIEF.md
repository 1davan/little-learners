# Blender creature brief

Little Learners is a touchscreen game for 2-year-olds, built with Three.js and Electron. Its characters used to be assembled in code from spheres and cones, and the parent said they looked "whack". For example, the bunny's ears were balls stuck on a head.

Every character is now **sculpted and rigged in Blender by a Python script**, exported as a `.glb`, and loaded by the game. The reference is `tools/blender/creatures/bunny.py`, which already works.

## The pipeline (already built; don't rewrite it)
- **`tools/blender/lib.py`**, the `Creature` class. Read its docstring.
  - **Sculpting:**
    - `blob()`, `capsule()` and `curve()` are soft metaball shapes. Shapes in the same `group` melt together like clay. Different groups stay as distinct shapes and are fused into one skin by a voxel remesh. Give arms, feet, horns and similar parts their own group so they keep their shape.
    - Sizes are surface half-extents in game units, calibrated at stiffness 2. Overlapping blobs in one group swell a little where they meet.
  - **Painting:**
    - `paint()` fills an ellipsoid region with a colour.
    - `paint_fn()` paints using any predicate.
    - `decal()` projects (x, y) onto the front surface. Use it for noses, muzzles, bellies and spots.
  - **Rigging:**
    - `bone()` and `chain()` add bones. `region=` restricts which vertices a bone may move. Weights are distance-based and smoothed over the surface.
    - `face(center, radius)` is where the game mounts its expressive code face (eyes, brows, mouth, tears and cheeks from `app/src/engine/faces.js`). It snaps automatically onto the head surface. Extra kwargs are stored on the face node: `faceScale`, `mouth=0` (no mouth, e.g. for beaks), `noseColor`.
    - `anchor(name, pos, bone)` sets a body-part anchor. A 2-tuple (x, y) snaps onto the front surface.
  - `c.extras[...]` is saved on the armature and becomes the model's `userData` in game:
    - `argMode='scale'` with `argScale` makes the maker's numeric argument scale the model.
    - `argMode='tint'` makes it tint the model. The material colour multiplies the vertex colours, so paint tintable areas white or light grey.
    - `outline` sets the ink outline thickness (default 0.028).
- **Build:** `tools/blender/build.sh <kind>` writes `app/assets/models/<kind>.glb` and refreshes `index.json`. It takes about 10 s per creature.
- **View:** `tools/viewmodel.sh <kind> $TMPDIR/<somewhere> [happy|sad|angry|scared]` renders the model in the real game. Read each PNG it produces with the Read tool:
  - `<kind>.png`: front, three-quarter and side views
  - `<kind>-close.png`: a face close-up
  - `<kind>-motion.png`: just after a shove, which shows the spring ears and tails and the skinning
  - `<kind>-pose.png`: limbs rotated and head turned, to check the rig
- **In game,** `app/src/engine/creature.js` handles loading:
  - It applies toon shading and an inked outline.
  - It gives **spring physics** to every bone whose name starts with ear / tail / trunk / antenna / mane / comb / wattle / tuft / forelock / cheek.
  - It maps bones onto the `userData` contract the games use. Bone names lose dots in the file, so `ear.L.1` becomes `earL1`.
  - `orCreature(kind, oldMaker)` means a built `.glb` replaces the old code model automatically.

## Rig rules (the games depend on these)
- Coordinates are in game space: x right, y up, the creature faces **+z**, and the feet stand on y = 0. Keep the old model's overall height, which you can check in its file in `app/src/models/`. The old file also lists the `userData` contract on its first line.
- `body` and `head` bones must point **straight up (+y)** with roll 0, so their rest rotation is identity. Games set `head.rotation.x/y/z` and `body.rotation.y` directly and then reset them to 0. For four-legged animals, the head bone still points straight up from the head's centre; add a `neck` bone between body and head if needed.
- Use these bone names when the creature has those parts:
  - `arm.L`/`arm.R` (games wave them by changing `rotation.z`)
  - `wing.L`/`wing.R` (rotation.z)
  - `claw.L`/`claw.R` (rotation.z, crab)
  - `trunk.1..n` (rotation.x, elephant)
  - `ear.L.n`/`ear.R.n` and `tail.n` (springy)
  - `leg.L`/`leg.R`, or `legF.L`, `legF.R`, `legB.L`, `legB.R`
- Use `region=` so each bone moves only its own part. For example, an ear bone must not drag the face, and a tail must not drag the bum. Check `-motion.png` and `-pose.png` for tearing, stretching or limbs pulling the body.
- Anchors for the body-part game, needed for the bear and bunny, and good for all: nose, eyeL, eyeR, mouth, tummy, handL, handR, footL, footR, earL, earR.

## Art direction
The target is a top-quality modern toddler game: soft clay or vinyl-toy shapes, cel-shaded with an ink outline.
- **Proportions:**
  - A big round head (about 45–55% of the height), a small soft pear body and short stubby limbs.
  - The feet should be readable.
  - Tiny hands are fine.
- **Signature details** a toddler recognises instantly:
  - Bunny: long ears with pink inner ears and a pom tail.
  - Cow: patches, a pink muzzle with nostrils, little horns and a tail tuft.
  - Pig: a snout disc with nostrils and a curly tail.
  - Sheep: a cloud of wool puffs with a dark face and legs.
  - Horse: a mane, a muzzle and hooves.
  - Hen: a red comb, wattle and beak, with wing nubs.
  - Chick: a fluffy yellow ball.
  - Crab: two big claws and eye stalks.
  - Duck: a flat orange bill.
  - Gull: a white body with grey wings.
  - Bear: round ears and a muzzle.
  - Cat: pointy ears, stripes and a tail.
  - Frog: big top eyes and a wide mouth.
  - Elephant: big flappy ears and a trunk.
  - Hedgehog: a spine coat around a cream face.
  - Pip: the round yellow chick mascot with wings, an orange beak and a sprout tuft.
- **Palette:** soft, saturated and warm. Never pure black. Use the existing model's colours as a starting point.
- **Silhouette:** must read at thumbnail size and from the side.
- **Faces:** the code face is what makes the character cute. Size and place it well with `faceScale`, and keep it on the front of the head.
- **Budget:** the default `target_faces` of 14000 is fine. Keep the file under about 900 KB.

## Process
Do at least 4 render-and-improve rounds per creature, and check all four renders each time. Compare against what a professional character artist would accept.

When you're done, the old code-built model in `app/src/models` is no longer used, so leave it alone.

## Hard rules
- Edit only `tools/blender/creatures/<your kinds>.py`. Don't edit `lib.py`, `creature.js` or any game file; other agents are working in parallel.
- If you need a `lib.py` feature, say so in your report, or implement a helper inside your own creature script.
- Run only your own kinds with `build.sh`. Never run it with no arguments.

## Report (short)
- Per creature: what it looks like now.
- Any `extras` used.
- Any problems seen in game (spring or rig issues).
- `lib.py`/`creature.js` changes you'd want.
