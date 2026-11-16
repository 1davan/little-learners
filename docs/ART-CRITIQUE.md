# Art-direction critique of the characters (Fable 5.2)

This is the review the character polish pass works from. Coordinates are in game space, as in `lib.py`. "Own layer" means `c.layer('<name>', base=..., target_faces=...)`, which gives the part its own crisp outline and lets it move rigidly.

## Already fixed in the engine or lib (don't redo)
- **Pip's idle wing jam:** `breathe()` now flutters relative to the rest angle.
- **Face snap:** it now accounts for `faceScale`, so the eyes no longer float. Checking `faceScale` and radius is still worthwhile.
- **Rigid head:** `lib.py` sets `c.neck = (y0, y1)` by default to `(headBoneY - 0.32, headBoneY - 0.08)`. Above y1 all body weight moves to the head bone, ramping over the band. Set `c.neck` yourself if your neck sits elsewhere, for example a neckless egg.
- **`c.paint_group(groups, colour, only=None)`:** colours exactly the skin from those blob groups. Use it for beaks, combs, wattles, feet, socks, wings and bells instead of boxes.
- **`c.owner(p)`:** the name of the group that owns point p.
- **New face options,** passed through `c.face(..., key=value)`:
  - `eyeX`, `eyeY` (fractions of R; defaults 0.36 and 0.12)
  - `eyeSize` (multiplier)
  - `browY` (brow height above the eyes, default 0.31)
  - `cheeks=0`
  - `cheekColor=0xRRGGBB`
  - `mouthY` and `mouthZ` (an existing offset for the mouth)
- **Eyes:** now smooth, flattened domes with two highlights.
- **Bone axes:** consistent. Left limb `+rotation.z` raises, right `-` raises; legs swing on `rotation.x`.
- **Paint borders:** crisp.

## Shared faults (fix in every character)
- **S1. Limb webbing.** Every wing and arm blob lies sunk against the torso along its whole length, so there's no armpit after the voxel remesh. Rotating the bone drags the flank into a triangular membrane from shoulder to hip, tears the outline at the shoulder, and cuts a jagged slit on the down-stroke. Games do this all the time: walk flap +0.25–0.35, ±0.5, dance +1.1, wave −1.6.
  - **Wings:** put them in their own layer with their own shape, a small root ball sunk into the body, and the wing bone owning that layer rigidly. Make the body bone own only the body groups (`group_rules`).
  - **Arms:** A-pose with a clear gap to the torso (shoulder, then about 0.35 outward and down), each arm its own group owned rigidly by the arm bone.
  - Test at +1.1, +0.55, −0.5 and −1.6.
- **S2. Head not rigid.** Now handled by `c.neck`; check it.
- **S3. Face floats.** Now handled; check `faceScale` against radius.
- **S4. Code mouth buried or broken by sculpted muzzles.** Smile depth relative to the surface: pig −0.178 (no mouth at all), hedgehog −0.088, sheep −0.044, bear −0.03, cat −0.028. Sad frowns split into dashes on cat, sheep and hedgehog. Use `mouthY=` and `mouthZ=` and reshape muzzles so the mouth sits on the surface.

## Per character (grade, problems, fixes)

### Pip — C+
1. Wings web at every raise and dent the flank when lowered.
   - Put the wings in their own layer `wings` (base `YEL_D`, target_faces 1600).
   - Shape: `c.curve([(s*.58,1.02,.04),(s*.74,.84,.05),(s*.82,.62,.04),(s*.84,.5,.03)],[.13,.2,.17,.07], flat=.38)` plus 3 tip scallops and a 0.12 root ball sunk in the body.
   - Bone from `(s*.58,1.02,.04)` to `(s*.84,.5,.04)`.
   - The body bone owns only the body groups.
2. Face: `c.face(center=(0,HY,0), radius≈0.83, mouth=0, faceScale=1.0)`.
3. The beak reads as orange lips, 0.16 wide by 0.10 tall, with a ragged edge.
   - Use cone blobs `(0,1.5,.62)(.13,.11,.12)`, `(0,1.49,.76)(.085,.075,.09)`, `(0,1.48,.87)(.04,.035,.05)`.
   - Colour with `paint_group`.
4. Peanut silhouette (head 0.70 on body 0.56 with a neck pinch). Head `(0.76,0.7,0.66)`, `HY` 1.55, add a neck blend `(0,1.12,0)(.4,.2,.38)`.
5. The belly is pale yellow on yellow. Set `CREAM` to `0xfff6cf` and `FLUFF` to `0xfffbe6`. Toes: capsule 0.26 long, r 0.07.

### Chick — D+ (the parent's complaint: "the chick's wings, when they flap, do not look right")
1. Wings: each is a 0.1-thick bump fused to the egg with `weight_smooth=18`, so any flap pulls a membrane from eye level to hip with a torn shoulder line.
   - Own layer `wings` (base `0xffb420`).
   - Paddle: `curve([(s*.56,.9,.02),(s*.72,.74,.03),(s*.8,.56,.02)],[.1,.17,.08], flat=.4)` plus 2 scallops and a root ball `(s*.56,.9,.02)` r .1.
   - Bone from `v((s*.56,.9,.02))` to `v((s*.82,.5,.02))`, rigid.
   - Make the wings about 0.45 long so they read at thumbnail size.
2. At rest the wings barely show (`WING 0xffc52a` on `YEL 0xffdc45`). The own layer gives them an ink line.
3. It's one egg with a head bone, so a head turn smears the face. Delete the head bone, use `face(bone='body')`, and parent the tuft to body. The ball then turns as a whole.
4. The eyes bulge in 3/4 view. Add a face-plate blob `(0,.86,.2)(.5,.42,.42)` to `main`.
5. The belly patch runs up to the beak and has low contrast. Use a decal `(0,.36*S)` sized `(.34,.26,.3)*S`, scallops at y .56, colour `0xfff7cf`.
6. The tail is a slit from behind. Make a 3-feather fan: centre curve `(0,.5,-.52)` to `(0,.9,-.78)`, radii `[.12,.1,.05]`, side feathers at ±.14.
7. The feet swing about a pivot inside the body and pop out at the back when hopping or striding. Move them to their own `legs` layer with a 0.12 visible shin.

### Hen — D
1. Wings are the worst in the cast: at +1.1 the body becomes a manta-ray triangle.
   - Own layer, teardrop from `(s*.6,1.15,-.05)` to `(s*.8,.62,-.25)`, radii `[.14,.26,.22,.1]`, `flat=.4`, 3 `TIP` scallops, rigid.
2. The beak is a yellow rectangle painted by box. Use blobs `(0,.17,.14,.14)`, `(.12,.12,.1,.12)`, `(.22,.07,.06,.09)` along z, coloured with `paint_group`.
3. The wattle is a red scribble. Use two teardrops `(±.06,BY-.2,BZ+.04)(.07,.12,.06)`, stiffness 2.5, coloured with `paint_group`.
4. From the front the comb is a single spike. Centre `(0,TOP+.1,HZ)(.13,.2,.13)`; sides `(±.13,TOP+.02,HZ)(.11,.15,.12)` with rot z ∓25. Colour with `paint_group`.
5. Peanut silhouette (head 0.60 on body 0.62), and it's as tall as the cow. Body `(.72,.6,.7)`, head `(.5,.48,.46)` at `HY` 1.78, target height about 2.1.
6. The three tail feathers melt into one thumb. Use groups tailA/B/C, spread ±34°, radii `[.12,.14,.08]`.
7. A head turn cracks the chest patch. Chest decal height to 0.34, and check the neck ramp.

### Duck — C (good in profile, weak from the front)
1. Wings web, and raised wings look like flexed biceps.
   - Own layer `YEL_DK`: `curve([(s*.66,1.12,-.05),(s*.84,.95,-.3),(s*.86,.86,-.62),(s*.8,.9,-.86)],[.13,.26,.2,.07], flat=.36)`.
2. From the front it's a featureless yellow pear. `BELLY` is never painted: add `c.decal('belly',(0,.7),(.42,.4,.3),BELLY)`.
3. Bill: scratchy ink hairs along the seam. Colour it with `paint_group`, set the upper bill y half-size to 0.13, and make the nostrils `(.04,.06,.05)` or drop them.
4. The single-cone tuft makes an onion head. Use Pip's curl plus a wisp.
5. The feet are hidden under the breast from the front. Move them z +0.08.

### Crab — B− at rest, D in reactions
1. Claw rig: the rest pose is already "up", so a raise swings the claws inward and fuses them behind the eyes.
   - Re-sculpt the rest pose with claws out sideways: arm `(s*.7,.5,.2)` to `(s*1.05,.56,.3)`, palm `(s*1.25,.66,.32)`.
   - Bone from `(s*.72,.5,.2)` to `(s*1.25,.7,.32)`.
2. The eye stalks blend between head and antenna, so on a look-around an eyeball drops into the shell. Hard-assign stalk and eyeball vertices above y 1.0 to the antenna/stalk bone at weight 1, and add socket bumps at the stalk roots.
3. Legs are 3 thin sticks per side with no bones.
   - Curves with radii `[.11,.1,.07]`, knees at `(s*.95*k,.5)`, feet at `(s*1.12*k,.04)`, front pair forward 25°, back pair back 25°.
   - Bones `leg.L` / `leg.R`, each owning its side's leg groups.
4. Freckles are invisible. `SPOT` to `0xd9b8b2`, r .1. Consider `cheeks=0` if a cheek pokes out behind an eyeball.

### Gull — C−
1. Each wing is two disconnected islands. Use one curve `[(s*.38,.98,.02),(s*.42,.8,-.08),(s*.4,.6,-.3),(s*.36,.48,-.56)]`, radii `[.1,.24,.18,.06]`, `flat=.35`, as its own layer, rigid. Optionally add a `wing.L.2` mid bone.
2. The mantle is a hard grey rectangle. Use `c.paint('mantle',(0,.78,-.34),(.4,.34,.3),GREY_DK)`.
3. It reads as a penguin or chick.
   - Beak radii `[.1,.075,.05]` out to `HZ+.78`, tilted down 12°.
   - A red spot on both sides at `(±.06,HY-.2,HZ+.56)`, size `(.07,.05,.07)`.
   - Head 0.42 on a short visible neck.
4. The tail is a pancake. Use 3 scalloped blobs.

### Bear — B− (best face in the cast)
1. Arms web. Use an A-pose with a gap: shoulder `(s*.42,1.06,.06)` to wrist `(s*.84,.72,.16)`, r .14 tapering to .13, paw `(s*.9,.66,.18)` .16, body x .56 to .5. Arms are their own groups, owned rigidly.
2. No legs. Add a leg capsule `(s*.3,.42,.04)` to `(s*.31,.16,.1)`, r .19, and lift the body +0.1 so a crotch notch reads.
3. The head is about 40% of the height. Head to `(.78,.66,.66)`, torso y .56 to .48.
4. The tail is hidden inside the body. Move it to `(0,.5,-.62)`, .17.
5. Flat profile: muzzle z .27 to .36, snout .44 to .52, nose .63 to .72, then `mouthZ≈+0.06`.

### Cat — C+
1. Arms web. Shoulder `(s*.4,1.02,.08)` to wrist `(s*.78,.7,.16)`, r .12, own groups, rigid.
2. Painted whiskers and cheek stripes at the silhouette read as dirty scratches. Delete them, or make whiskers a thin layer of r .018 capsules, and move the cheek stripes inboard to x .6.
3. The sad frown splits on the twin muzzle puffs. Use one pad `(0,HY-.2,.36)(.24,.14,.2)` and adjust `mouthZ`.
4. The side-fluff blobs make a hexagonal head. Change them to `(s*.62,HY-.24,0)(.14,.12,.18)`.
5. No legs (as bear).
6. Two random dashes on the back of the head. Continue the "M" over the crown.

### Bunny — C
1. Proportions: a lanky tube whose head is about a third of the height. `HY` 1.76 to about 1.5, drop or halve the body blob `(0,.88)`, head to `(.74,.64,.62)`.
2. The arms sit forward on the chest, so they're invisible, and `rotation.z` turns them into flippers. Use side arms `(s*.36,1.0,.04)` to `(s*.7,.68,.12)`, r .11, pink pads, own groups.
3. White on white. Tail to z −.64, r .2; feet `(.24,.14,.42)` with pads `(.14,.1,.06)`; belly as one decal in `0xffdcc0`.
4. Cheek blush is buried. Sculpted cheeks to `(.25,.2,.18)`.
5. The muzzle is three overlapping decals, a blotchy stain. Use one oval `(0,HY-.2)(.26,.17,.3)`.

### Hedgehog — C+
1. The coat/face border is saw-toothed and tears on a head turn.
   - Paint the coat as `dome_r(p)>0.9 and not face_oval(p)`, using a smooth front-projected oval, plus a row of scallop decals along the hairline.
   - Drop the head bone (one ball), or set `c.neck` carefully.
2. The mouth is buried under the snout. Snout to `(0,.86,.72)(.15,.11,.14)`, `mouthY=-0.06, mouthZ=+0.07`.
3. Back: the spines look like pimples, and a tan crescent on the rump reads as a frown. Paint the tips only where `on_spine` and t > .6; spines r0 .16, length .42, fewer rows.
4. The paws are four tan buttons. Make the arms longer, `(s*.3,.3,.78)` r .09, with pink pads.

### Frog — B−
1. The face sphere (R 1.3) is bigger than the head: brows hover, cheeks hang off and the joy mouth floats. Use a smaller R with the new `eyeX`, `eyeY` and `browY` options, so the eyes still land in the eye domes.
2. Hop and stride swing the haunch and foot together into a "mermaid tail". Set `group_rules['leg.L']` to the foot group only, with the pivot at the ankle `(s*.68,.14,.2)`.
3. `n.z<-0.25` paint leaves a hard seam down each flank, and the spots smear.
   - Use an ellipsoid back paint.
   - Make spots decals from behind (`z_from=-3, dir=(0,0,1)`, size `(r,r,.2)`).
4. The arms vanish behind the jowl on a wave. Change them to `(s*.62,.95,.2)` to `(s*.9,.62,.4)`, r .12, with 3 finger pads.

### Elephant — C+
1. The trunk root is as wide as the lower face and lies on the chest, so in 3/4 and profile it reads as an anteater.
   - Radii `[.16,.14,.125,.115,.12]`, root `(.17,.16,.15)`.
   - Points `(0,1.42,.9),(0,1.2,1.06),(0,1.0,1.12),(0,.88,1.24),(0,.96,1.38)`, keeping at least 0.12 clear of the chest.
2. With no mouth, joy and sad show in the eyes only. Consider a small side smile using `mouth=1`, `mouthY` and `mouthZ`, placed beside the trunk root.
3. A small sloped rear with no neck. Body to `(0,.9,-.4)(.7,.6,.74)`, legs r .26.
4. The ears are paper plates. Thickness .07 to .11 with a cupping negative blob.
5. The hair tuft forms a keyring loop. Use 3 sprigs r .045.
6. Walking webs the belly between the legs. `legB` z to −.86, `legF` to .26, each leg its own group owned rigidly.

### Cow — B−
1. The arms web into a poncho. Same arm fix as the bear.
2. The collar is a ragged band with gaps and the bell is a yellow rectangle. Make the collar its own layer `ring()` at y 1.2, and the bell a two-blob layer on a spring bone.
3. In profile the snout pad and chin are split by a deep notch, like an open beak. Bridge it with `(0,HY-.3,.3)(.34,.16,.26)` in group `chin`.
4. `p.y<0.15` paints one dark slab across both feet. Legs to x ±.33, r .17, with a negative blob `(0,.12,.1)(.08,.2,.3)` between them; colour the hooves with `paint_group`.
5. The patch beside the left eye swallows the ink eye on a head turn. Keep patches away from the eyes.
6. The nostrils are ragged smudges. Use decals `(±.12,HY-.12)(.05,.06,.12)` in `0xd9788f`; horns r .1 tapering to .06.

### Horse — C
1. It reads as a brown teddy with a wig and pig-nostril dots.
   - Head `(.6,.66,.56)`, snout pad `(0,FY-.12,.42)(.3,.2,.26)`, nostrils at `(±.14,FY-.2)`.
   - Ears `(.13,.3,.08)` at x .3.
   - Mane as a 4-lobe crest between the ears; remove the side locks.
2. The arms web (same arm fix), and the belly decal stretches into a diamond. Belly width .26.
3. The sock and hoof bands make a striped hem and paint the tail tip cream. Use `paint_group` on the leg groups only.
4. The chin tears at the neck on a head turn. Check the neck ramp.

### Pig — C−
1. No visible mouth in any emotion. `mouthY=-0.24`, snout to `(.26,.19,.16)` at `SY=HY-.06`.
2. The arms web. A-pose fix.
3. A long torso and about 38% head. `HY` to about 1.62.
4. Pink on pink. Belly `0xffd9e2`; set the face `cheekColor` to a deeper rose, for example `0xff6f91`.
5. The ear tips are thin with scratchy ink. `flat=.45`, tip r .08.
6. The tail is a hairline spiral. r .1, coil radius .18, at z −.56.

### Sheep — B−
1. The smile is buried and the frown broken. `mouthZ=+0.05`, or jowl z to .27.
2. The wool is a smooth blob, and the neck has a straight brown bib line. Use 16 puffs of r .3 at stiffness 3, plus a ruff of 6 puffs at the neckline.
3. There are white slivers on the brown near the ears. Re-whitening gets `only=lambda p: p.y>HY+0.3`.
4. The cap comes to a point. Remove `TUFT[8]`.
5. The arm paint catches wool. Use `paint_group`.

### Monkey — B (best rig)
1. The `cheek_peach` paints stick out of the mask as hooks at the jaw. Delete them and bridge with a decal `(0,HY-.05)(.3,.2,.3)`.
2. Flat profile: muzzle z to .3.
3. Feet only, no legs (as bear).
4. A slight armpit web at +1.1. Add a shoulder ramp.
5. In profile the tail reads as two sticks. Tilt the curl 20°.

**Monkey garments:** the clothes are layers on the monkey skeleton. Keep `cloth_*` layer names and slots unchanged, and re-check every garment still fits after any body change (`dress.js` relies on them).

## Cross-cutting
- **Body plans:** keep the cast consistent. The elephant is the only quadruped among upright chibis, which is acceptable as a baby elephant, but it should read as cute and chunky.
- **Head ratio:** 45–55% of the height for every character.
- **Heights:** relative heights should feel right. The hen shouldn't be as tall as the cow; aim for about 2.1.
- **Legs:** chibi bipeds should have short visible legs where the species allows (bear, cat, monkey, cow, horse, pig).
- **Shape-based colour:** paint by sculpted part (`paint_group`), not boxes.
