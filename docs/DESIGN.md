# Design plan

A planning pass with Fable 5.2 produced this plan, which was then built as described. It covers five Three.js lessons for a bright 2-year-old who can't read yet.

## Choosing topics from os-taxonomy

The youngest `ageRangeStart` in the taxonomy is 3, so every lesson is an early exposure.

**Chosen:**

| Topic | Taxonomy evidence | Goal for a 2-year-old |
|---|---|---|
| `mt_xppl18avyY` Sorting into categories | Sort a set by colour | Puts an object with others of the same colour |
| `mt_WcfaSfVT33` One-to-one counting and `mt_dmNvjroCPT` cardinality | Touch each object once while saying number names; the last word tells how many | Counts 1–3 with one touch per number |
| `mt_KJeEeTutJI` 2-D shapes | Identify a shape whatever its size or orientation | Matches circle, square and triangle, including tilted and small ones |
| `mt_LhkP_KKIRS` Naming basic emotions | Match facial expressions to emotion words | Taps the face showing the named feeling |
| `mt_NtJYlJdUe9` Measurable attributes, prerequisite of `mt_uhuxX8sg9f` Comparing lengths & heights | Compare directly | Picks big or small from a pair on a common baseline |

**Rejected:**
- Pitch of sounds: its hard prerequisites start at age 6. It appears only as the low "big" voice and high "small" voice.
- Local plants & animals: its hard prerequisites also start at age 6. Animals appear as characters instead.

**Research carried into the lessons:**
- **Counting:** counted objects leave the set (the "move-it" method), each touch and number word happen together, and the last word is stressed.
- **Shapes:** show non-typical examples early.
- **Sorting:** name the single attribute, and show the groups as visible stacks.
- **Size:** always use a common baseline.

## Rules for toddlers on a touchscreen

- **No text for the child.** Narration and pictures do all the explaining.
- **Generous touch areas.** Hit areas are measured in screen space and are at least 9% of the shorter side of the screen. Drop zones are at least 16%.
- **One finger at a time.** Contacts wider than 70 px are treated as a palm and ignored.
- **Every touch gets a sparkle and a sound,** but only correct actions move the game forward.
- **Mashing:** more than 5 taps in 1.5 s triggers a 1.5 s calm-down. Pip giggles and nothing is scored.
- **No failure states.** A wrong choice gets a soft boop and a spoken redirect. After 2 wrong choices the round becomes errorless.
- **Hint ladder** (seconds without a touch):
  1. 6 s: repeat the prompt.
  2. 12 s: halo around the answer plus a ghost hand demonstrating.
  3. 20 s: errorless.
  4. 45 s: "Bye bye" and back home with no penalty.
- **What gets recorded:** each round stores first-try (no wrong choice and no hint), number of wrong choices, hints used and time taken. The child never sees this.
- **Lesson length:** 6–8 rounds, about 2–3 minutes each.
- **Exits:** the child can hold the home button for 0.8 s. The parent gate is a 3 s hold on the top-right corner. The sleepy screen appears after 20 minutes.

## Audio

All sound effects are synthesized with WebAudio: pop, note, chime, boop, boing, whoosh, chomp, fanfare, giggle, aww, grr, gasp, trumpet, squeak, thunder.

Narration uses the operating system's offline voices through `speechSynthesis`:
- Voice loading is asynchronous, with a 2 s timeout.
- Each new utterance waits 60 ms after a cancel, because Windows drops speech started in the same tick.
- The utterance reference is kept so it isn't garbage-collected, and a safety timeout ends any utterance that never reports finishing.

## Rewards

- **Each correct answer:** confetti, a chime, a dance from Pip and rotating praise.
- **End of a lesson:** a fanfare, falling confetti and a sticker award that flies to the shelf on the home screen.
- **Crowns:** three stickers in one lesson put a crown on that lesson's object.
- **Levels:** progress is saved in localStorage and drives an adaptive level from 0 to 2.

## Engine

| Module | Responsibility |
|---|---|
| `stage` | Renderer, camera that adapts its field of view to the screen shape, frame loop |
| `toon` | Cached toon materials with a 3-step gradient, inked outlines (back faces pushed along normals, or a scaled hull for hard edges), cached geometry |
| `actors` | Pip and the animals, built from primitives, with parametric faces |
| `input` | Screen-space hit testing, dragging on a camera-facing plane, snapping to zones |
| `tween` | Scopes that are killed when a lesson is disposed |
| `fx` | Instanced confetti, halo, DOM sparkle, ghost hand |
| `lesson` | Base class: round flow, hint ladder, success and redirect, finale, dispose |
| `store` | Saved stickers, stats, levels and settings |
| `ui` | DOM overlays |

## Performance

- No shadow maps; blob shadows instead.
- No post-processing.
- Pixel ratio capped at 1.5 and frame time capped at 50 ms.
- If the WebGL context is lost, the app reloads.
