# Character model brief (for the model design pass)

Little Learners is a touchscreen game for a 2-year-old, built with Three.js r170 (`app/vendor/three.module.js`). It has no build step and no image, model or audio files: every character is built in code from primitives. The parent says the current models look basic and wants each one much better designed.

## Your job
Make your model(s) look like a top-quality modern toddler game character: charming, readable at a glance, appealing proportions, polished details. Think high-end mobile kids' games, with chunky soft shapes and a cel-shaded look. Iterate until it looks great from the front, from three-quarters and from the side.

## Hard rules
- **Edit only the file(s) you were assigned** in `app/src/models/`. Do not edit `biped.js`, `faces.js`, `toon.js` or any other file; other agents are working in parallel. If you need a helper, write it inside your own file. You may copy code out of `biped.js` into your file and build your model standalone.
- **Keep the exported function name and signature** (e.g. `export function makeCrab(color = 0xff5a4a)`).
- **Keep the `userData` contract** listed at the top of your file. Games read those keys:
  - `head` is a Mesh/Group that sways, and `body` is breathed by scaling `.scale.y`.
  - `face` must come from `makeFace(R, opts)` in `faces.js` when the contract lists it, because `setFace(face, 'happy'|'sad'|'angry'|'scared'|'calm')` drives emotions in the Feelings game. You may position, scale or add to the face.
  - `arms` and `wings` are arrays of 2 meshes animated by `rotation.z`.
  - `claws` for the crab is an array of 2 animated by `rotation.z`.
  - `trunk` for the elephant is an array of segments animated by `rotation.x`.
  - `eyes` for the crab is an array.
  - `kind` is a string.
- **Model space.** The root Group's origin is between the feet on the ground (y = 0), and the model faces +z (toward the camera). Keep about the same overall height as now; check the current file. The body-part game also uses a bear and a bunny at scale 2.15, and other games place animals at fixed spots.
- **Materials.** Use the helpers in `toon.js`:
  - `mesh(geometry, color, { outline })` gives a toon material plus an inked outline. Use `outline` ≈ 0.02–0.04 for smooth shapes, `{ hull: 1.04, outline: 0 }` for boxes, and `outline: 0` for small inner details.
  - `geo.sphere / box / cyl / cone / torus / circle` are cached geometries.
  - `toon(color)`, `basic(color)`, `ink(geometry)` (solid ink colour), `blobShadow(r)`.
  - New custom geometries (LatheGeometry, ExtrudeGeometry, CapsuleGeometry, TubeGeometry…) are fine. Put them in module-level constants so they are created once and shared, and mark them `geometry.userData.shared = true` so they are not disposed.
- **Performance.** Keep it under about 70 meshes, not counting outlines. Up to 10 characters can be on screen at once on a modest Windows laptop.
- **Palette.** Soft, saturated, warm. The ink outline is the warm dark plum `0x3a2838`; never use pure black.

## Design guidance
- **Proportions:** a big head (about 45–55% of the height), a small round body, and short stubby limbs.
- **Eyes:** big, round and set low on the face, with white highlights.
- **Details:** rosy cheeks. Add a few signature details that make the species instantly recognisable to a toddler.
- **Silhouette:** must be readable at thumbnail size.
- **Smooth shapes:** use 20+ segments on spheres that are close to the camera.
- **No hard seams:** layer shapes (a belly patch, muzzle, inner ears, paw pads, tail) instead of sticking separate shapes together.

## Checking your work
From the project root, run:

```
tools/viewmodel.sh <kind> <outdir> [emotion]
```

It renders `<outdir>/<kind>.png` (front, three-quarter and side) and `<outdir>/<kind>-close.png` (a face close-up). Look at them with the Read tool.
- **Kinds:** pip, crab, duck, gull, hen, chick, bear, bunny, cat, frog, elephant, hedgehog, cow, pig, sheep, horse.
- **Output folder:** use a folder under `$TMPDIR`.
- **Emotions:** check at least `happy` and `sad` if your model has a face.
- **Errors:** any JS error is printed by the script, and the screenshot will show nothing. Fix it.

Do at least 3 render-and-improve rounds.

## Report back (short)
- What you changed.
- The final file path(s).
- Any contract change. There should be none, except that you may set `userData.anchors`; see `partAnchors` in `app/src/engine/beach.js`.
