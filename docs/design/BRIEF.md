# Design brief for the five new deep games

**Audience:** a bright 2-year-old girl, played on a touchscreen laptop with a grown-up nearby.

**The bar:** world class, in the league of Toca Boca, Sago Mini, Pok Pok, Busy Shapes (Edoki) and Thinkrolls, but calmer and simpler for age 2.

**The parent's demands so far:**
- **Pace:** calm, never frantic.
- **Sound:** very few sounds, and no boings.
- **Showing how:** show clearly how to play: a slow hand demo for each new action, again when the child is stuck, and a "Go!" badge when it's her turn.
- **Camera:** zoomed in on what she's doing.
- **Polish:**
  - No clipping.
  - No teleporting.
  - Characters never block targets.
- **Satisfaction:** real satisfaction from her own actions and creations, not from effects.
- **Learning:** genuinely educational, combining concepts smartly where it fits, with very gradual levels.

## Engine and tech constraints (design within these)

**Rendering and runtime**
- Three.js r170 inside Electron. Fully offline; it must run smoothly on a modest Windows laptop.
- Toon shading with ink outlines.

**Models**
- Everything visible is a Blender model built procedurally by Python scripts: `tools/blender/lib.py` (metaball sculpting, crisp vertex paint, rigging) and `tools/blender/props/kit.py` (rounded boxes, lathe, tubes, rings, stickers).
- No textures beyond canvas textures made in code.
- No external assets except CC0 sounds.
- Characters (Pip the chick mascot, bear, bunny, cat, frog, elephant, hedgehog, cow, pig, sheep, horse, hen, chick, duck, gull, crab, monkey) are rigged:
  - spring-physics ears and tails
  - code faces with happy / sad / angry / scared / calm / joy
  - walk gaits
  - look-at
  - per-character tap reactions

**Physics:** Rapier rigid bodies.
- Convex-hull colliders; static boxes and containers; toss arcs.
- No soft bodies.
- No real fluids or hair simulation; fake them convincingly.

**Input:** touch tap, drag and hold through the engine's input system, with generous hit areas.

**Audio**
- Pre-generated voice clips in the "Sulafat" voice: every caption line is turned into an audio file, so list every voice line.
- CC0 sound effects and synthesised musical notes.
- One gentle music loop per world.

**Engine features available:** read the header of `app/src/engine/lesson.js` for the APIs.
- The Lesson base class: levels 1–3, rounds, `say()`, `success()` (quiet by default), `redirect()`, `showHint()` demos, `nudgeTarget()`, the "Go!" gate.
- The keepsake tray.
- `beat()` (anticipation).
- A "look what you made" finale with a photo and a creation gallery.
- `sfx.step` rising notes.
- `glideCamera`.

## Read first
- `docs/FEEL-BRIEF.md`
- `docs/SATISFACTION.md`
- `docs/QUALITY-BRIEF.md`
- `docs/WORLDS.md`
- `docs/TODDLER-GAMES-RESEARCH.md`
- `app/src/lessons/cook.js` and `candy.js` (two recent games), to see what is possible.

## Taxonomy
Every game names real topic ids from the Marble os-taxonomy. A copy is at `$TMPDIR/ostax/os-taxonomy/data/topics.json`; if it's missing, clone `withmarbleapp/os-taxonomy` with `gh`.

## Deliverable

Write `docs/design/<id>.md` with these sections:
1. The pitch in two lines, plus the reference games and what we take from each.
2. Learning goals, with taxonomy ids.
3. The core loop, moment by moment, with every interaction and its exact feedback (visual, animation, sound and voice).
4. Progression:
   - Level 1, 2 and 3. Each level is a sequence of small rounds or puzzles. For puzzle games, list every puzzle concretely: layout, pieces and solution. Expect about 8–15 per level, getting harder very gradually.
   - Variety, so no two rounds feel the same.
5. Satisfaction beats and the end-of-level "look what you made" moment.
6. Characters and staging: who is where, the camera framing per moment, and how targets stay unblocked.
7. An asset list: every Blender model needed (name and description, reusing existing ones where possible), every sound, and every voice line with its exact text.
8. Technical notes within our constraints (physics setup, how to fake things), plus the risks and how to avoid them.
9. Acceptance criteria a strict reviewer can check.

Be concrete and implementable. An agent will build directly from this document.
