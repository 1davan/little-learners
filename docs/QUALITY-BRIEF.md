# Quality brief: models, motion and physics

Little Learners is an offline Electron + Three.js touchscreen app for a 2-year-old. The parent is unhappy with the quality so far. Direct quotes:
- "The carrots are so shit. Why is that model so terrible?"
- "The chick's wings, when they flap, do not look right. This is just one example of very sloppy work!"
- "All models extremely good, movement good, physics good, they persist properly when they're meant to, they're cute, charming."

**The bar is premium toddler-app quality (Sago Mini / Toca Boca).** Every object a child sees should look hand-made by a good character or prop artist: soft, chunky, appealing shapes, clean silhouettes, crisp colour areas, and charm. Nothing may look like a programmer's placeholder made of spheres and cones.

Read these first:
- `docs/BLENDER-BRIEF.md`: the Blender pipeline, `tools/blender/lib.py` and the rig rules
- `tools/blender/props/kit.py`: the prop kit (rounded boxes, lathe, tubes, rings, stickers, bones for moving parts). See the examples in `tools/blender/creatures/prop_*.py`.
- `docs/GAME-BRIEF.md`: game rules, autoplay hooks and snap.js testing

## What's new in the pipeline (use it)
- **Crisp paint.** `lib.py` cuts the mesh exactly along colour borders and colours whole triangles, so `paint()`, `decal()` and `paint_fn()` give clean vinyl-toy edges. Design colour areas as clean shapes.
  - Avoid noisy, ragged edges unless it's on purpose, like a cow's patches.
  - For small sharp details (stickers, stripes, buttons, eyes on props), a separate `layer()` with its own outline often looks best.
- **Triangle budget.** Creatures are capped at 11,000 triangles (`LL_MAX_TRIS`) and layers at about a third of that. Props: aim for 800–4,000 triangles. Small items that appear in dozens (berries, coins, seeds) stay under about 600.
- **Bone axes are consistent.** Every bone's local Z faces the creature's front.
  - Arms, wings and claws: `rotation.z` swings them out and in. On the **left** limb (`L`, the one at −x) **positive raises**; on the **right**, negative raises.
  - Legs: `rotation.x` swings them forward and back.
  - `body` and `head` point straight up, so their rest rotation is the identity.
- **Pose sheet.** `__ll.router.go('viewer', { poses: '<kind>' })` shows six copies:
  1. rest
  2. limbs raised
  3. limbs lowered
  4. head turned and nodding
  5. legs mid-stride
  6. body leaning (trunk curled)

  **Every character must look right in all six.** No skin tearing, no body dragged by a limb, no wing sticking out like a plank, no limb through the body, no stretched webs.
- **Motion layer** (`app/src/engine/creature.js`, applied automatically to every Blender creature):
  - When a game moves a creature along the ground, it walks with a gait for its kind: hop (bunny, frog, chick, Pip), waddle (duck, hen, gull, pig), scuttle (crab), stomp (elephant), walk (everyone else). Set `c.extras['gait'] = '...'` in Blender, or `userData.gait` in game, to override.
  - Heads follow the child's finger for about 2.5 s after a touch, otherwise they look at the child with the odd glance around.
  - Idle sway; ears and tails bounce on footfalls.
  - Games can opt out per creature with `userData.noLook = true` or `userData.noWalk = true`.
  - So in games, **walk characters to places** (tween position along the ground at about 1.5–3 units/s) instead of teleporting or sliding them in a straight line through the air.
- **Faces.** `setFace(face, 'joy')` gives happy closed `^ ^` eyes and a big open smile with a tongue. Use it for delight moments. The other emotions are happy, sad, angry, scared and calm.
- **Physics** (`app/src/engine/physics.js`, Rapier; read its header):
  - `physics.add(obj)` now defaults to a convex hull of the object's real shape (pass `r` for a ball), so a carrot rolls like a carrot and a box tips over its edge.
  - Hard landings play a sound and a quick squash, visual only. Set `obj.userData.noSquash = true` to opt out.
  - Invisible play-pen walls keep things in view, and anything that falls out of the world pops back in.
  - `physics.toss(obj, target)` throws on a true arc that lands on target and settles softly.
  - `physics.container`, `box`, `moveStatic` and `removeStatic` manage static colliders. `planar` and `rot: [x, y, z]` options constrain movement.

## Persistence rules (the parent called this out)
- Things stay where they land until the game deliberately removes them. Never call `physics.clear()` between rounds; it freezes every object mid-air. Use `removeStatic`, `moveStatic` and `physics.remove(obj)` for individual changes.
- Something that sits on a table, shelf, plate or in a basket needs a static collider for that surface. Nothing may float, sink into the ground, or sit half inside another object.
- When something is used up (eaten, put away, given), make it visibly go: chomp, shrink-pop with a sound, or fly into a container. It must never just vanish or be left in an odd state. Food given to an animal stays on its plate until eaten.
- Leftovers from earlier rounds must not pile up and clutter the play area. Clear them deliberately with a little exit animation at a round change, or keep them tidy, for example in the basket.
- Characters keep the outfit, hat or held item a game gave them for as long as it makes sense, and don't lose it at a random moment.

## How to work
- Build with `tools/blender/build.sh <kinds...>` (only your own kinds).
- Check models in the viewer: `{ kind }`, `{ kind, close: true }`, `{ poses: kind }`, `{ kinds: [...] }`. Check in game with `tools/snap.js`.
  - Run only **one Electron at a time**.
  - Reload with `setTimeout(() => location.reload(), 50)`.
- Look at every screenshot critically and compare with the bar above. Iterate until a professional art director would sign off. That usually means 4–8 rounds per model. Zoom in by cropping a screenshot (`sips -c H W --cropOffset Y X in.jpg --out out.jpg`, then `sips -Z 900`).
- Keep every autoplay hook from `docs/GAME-BRIEF.md` working, and keep games' pacing snappy. A physics wait is never more than about 0.8 s.
- Edit only the files you were assigned. Other agents work in parallel. If you need an engine or `lib.py` change, put it in your report; small helpers inside your own files are fine.
