# Storyboard: My day (`myday`)

- **World:** Home (`dressup`). A doll's-house cross-section: bathroom on the left (a pedestal basin with Bunny's little step stool behind it, a claw-foot bath with the big towel over its rim, a bath mat, a pedal bin and a cabinet with tissues and a hairbrush), bedroom on the right (bed with a star duvet, a bedside table with the alarm clock and the lamp side by side, curtains, Teddy on the rug), a little doorway wall between. Hero: Bunny (a toddler stand-in). Pip watches from the back of the bathroom all level (at the bath it peeps over the far end of the tub); it never walks across the front of the house, and it is not in the bedroom. Code: `app/src/lessons/myday.js`, `myday-plans.js`, `myday-house.js`, `myday-fx.js`; models `tools/blender/creatures/prop_myday.py`.
- **Learning goal:** does Bunny's daily routines step by step in order (wash paws, brush teeth, sneeze and tissue and bin, bath, brush fur, wake up and make the bed, bedtime and lights off); L1 follows a glowing item, L2 follows a nudged morning, L3 picks the next step herself.
- **Levels:** 3, six rounds each, one routine per round (rounds are routines of 2 to 4 steps, 20 / 16 / 18 steps in all).
  - L1 "sunny day, in the bathroom": hands (paint), teeth, sneeze, bath, hands (mud), hair.
  - L2 "a morning in order" (dawn, Bunny starts asleep in bed): wake, make bed, hands, teeth, sneeze, hair.
  - L3 "the evening" (dusk, lamp glowing, room a little dim): hands (jam), bath, teeth, sneeze, bedtime, night.

(The code's internal level index is 0/1/2 for the child's L1/L2/L3. The comments in the code sometimes say "Level 2" meaning the second level; this file uses the child-facing L1-L3 throughout.)

## Voice and caption rules for this game

- Success lines (the "done" lines like "Clean paws!") and the round intros ("Painty paws!"), "To the bedroom!", "To the bathroom!", "Rinse!", "Ah... ah..." are all shown with `voice:false`: **always caption only**. Instruction lines (the step prompt) and the "gentle redirect" lines are spoken: with the clip if it exists, otherwise with the **browser's robotic TTS**. Marked `[voiced]` (clip exists), `[no clip, TTS]` (no clip; many are listed as pending in `tools/voice/new-lines.txt`), `[caption only]`.
- The same line is voiced only once per 30 s; a repeat within 30 s (for example "What comes next?" on consecutive L3 steps) is caption only.
- The base `ask` line of each routine ("Teeth time! What comes first?") is used ONLY on L3 as the first step's prompt. L1/L2 use the per-step `say` line instead.

## The standard step (how every step plays)

**Round start (rule 0: her turn starts at once).** The first thing to use is live the moment the round starts. If the routine happens somewhere else, Bunny sets off at the same moment and the camera eases straight over to the new place (1.0 s; to the other room with the caption "To the bedroom!" / "To the bathroom!" `[caption only]`). Bunny gets there like a toddler: one small hop down (off the stool, over the bath rim, out of bed), one smooth walk along the walkways (3 units/s where we can see it; out of the picture, between the rooms while the camera has gone on ahead, it hurries, so it walks in at the new place quickly), then one small hop up (onto the stool, over the bath rim, onto the mattress, where it lies back with its head on the pillow). The doorway path is at z -0.9, so Bunny never comes close to the camera. Things off Bunny play at once even while Bunny is still coming (filling the bath, spreading the duvet, closing the curtains, the toothpaste); the sink tap turns the water on at once and Bunny puts its paws under it as it arrives; a step done on Bunny (or on the bed while Bunny is getting out of it) plays the moment Bunny is in place. On Level 3 the round's question is said as the round starts. The set-up happens once Bunny is there: (hands rounds) four small glossy splats of paint, mud or jam on the paw pads, Bunny holding its paws up beside its chin to show them (0.7 s); (hair) ruffled tufts on both ears; (sneeze) the build-up; (wake) the ringing alarm. Moves between steps (into the bath, out onto the mat, out of bed) work the same way: the next thing is live at once.

**Each step.** It is her turn at once (drag and tap targets are live as soon as the step is laid out; they are switched off while a step's little show plays, so nothing can be grabbed out of it). The camera eases over (0.9 s) to frame the step: Bunny whole (ears and feet), the item and where it goes (L3: the whole routine's items), and at the sink always the whole hand towel. If Pip would then stand in front of anything she needs, it walks out of the picture. Then:
- L1 and L2: the item to use gets a halo (glow) and Bunny gets ready (paws held over the basin for washing steps). The instruction is spoken and captioned. The first time each kind of action comes up in the game (keyed by how:item:place:act), a slow ghost-hand demo plays on the real item: about 2.0 s for a tap, 3.4 s for a drag, 4.0 s for a rub. No new action is expected before it has been shown.
- L3: no halo, nothing glows. The prompt is the routine's `ask` for the first step and "What comes next?" for later steps. The first time each kind of action comes up, after 4 s without a touch, the hand only scans over the routine's things in a jumbled order (`choicePoints()`); it never shows which one is next. The demo that shows the answer stays on the stuck path (about 8, 18 and 28 s) and the engine ladder.
- The demo key is how:item:place (turning the tap on and turning it on again to rinse are one action, shown once).
- Go! badge: armed at each step (not during walks), shown once the step is ready.

**Actions.**
- Tap steps: tap the tap/bath tap/clock/curtains/lamp.
- Drop steps: drag the item onto the target (a drop zone on Bunny or on a piece of furniture) and let go. On L1-L2 tapping a drop/rub item (not dragging) only sends it home and repeats the instruction.
- Rub steps: drag the item onto the target and rub back and forth over it. Progress counts finger travel near the target (forgiving radius; about 0.4 / 0.55 / 0.65 of the screen's short side on L1/L2/L3; halved when stuck). Each rub makes a soft scrub (soap, brushes, sponge) or rustle (towels) at most every 0.4 s, Bunny smiles, and the change happens under her finger: the splat of mess nearest the soap goes and foam grows on the paws, a tuft of fur flattens where the hairbrush passes, foam grows on the head or at the mouth. A few soap bubbles (never more than 4, never in a heap, drifting away from Pip) float up to pop. When brushing teeth, Bunny's right paw comes up to the brush.

**Right.** The step's own little show (see the table), the item goes home on a soft arc (a later grab cancels any flight), then 0.6 s and the next step. When the last step is done, `success` shows the routine's "done" line as a caption only (quiet success: no confetti, no chime, no praise word) and Bunny reacts in character (the payoff): after washing it brings its clean paws up and looks at them; elsewhere a contented little wiggle; asleep, three slow Zs. Pip looks over and nods. Then 0.5 s of stillness and the next round. Bubbles are hers: they are never popped by the game.

**Wrong (any level).** Tapping the wrong tap-thing in the same room: it wobbles. Dropping the wrong item in a zone this routine uses, or rubbing the wrong item on Bunny (about a quarter-screen of travel): the item flies home, the step's hint line is said (e.g. "The tap first!"), Bunny shakes his head. Wrong item let go anywhere else: flies home silently. Item from the other room: ignored. After two wrongs: errorless (halo on the right item, rubbing needs half as much, line said again).

**Nothing (idle ladder).** 6 s: the line is said again and the right item bobs or wobbles (not on L3 at this step). About 8 s: the hand demo plays again, then again about 18 s and 28 s (on L3 the repeats also add a halo). 12 s: the line again, nudge plus halo, hand demo (engine ladder). 20 s: errorless (halo, half the rubbing, line again). 45 s: "Bye bye! See you soon!" `[voiced]` and she is taken Home.

## Step reference (what each step does when she gets it right)

| Step | Where | Right action | What happens |
|---|---|---|---|
| wet (sink tap) | sink | Tap the tap | Knob turns; Bunny leans on the basin's back rim with both paws down inside the bowl; the water runs from the low spout right onto the paws with a little crown of splashes; paws turn under it; about 2.5 s; tap closes. |
| lather | sink | Rub the soap on the paws | Under the soap, the splat of mess nearest it goes (there are four small glossy splats), foam grows on the paws (up to 8 soft puffs, no ink lines), now and then a bubble floats up to the right. |
| rinse | sink | Tap the tap | Water again; the foam slides off into the bowl one puff at a time; any mess left goes. |
| dry | sink | Rub the towel on the paws | As soon as the towel touches the paws it wraps round them (a soft roll, paw tips showing) and her rubbing jiggles it; done: a last rub, the towel goes back to its bar; Bunny looks at its paws and claps twice softly. (Let go too early: the towel unwraps and goes home.) |
| squeeze | sink | Drag the toothpaste onto the brush | Tube glides to the brush, squeak, squeezes, a stripe of paste on the bristles. |
| scrub | sink | Rub the brush on Bunny's teeth (brush head near the mouth) | Right paw comes up to the brush; up to 3 small flat foam puffs at the mouth; the paste is used up. |
| gargle | sink | Drag the cup onto Bunny's mouth | The brush and paste lie down across the left dish while the cup is out; Bunny raises its right paw and holds the cup at its mouth, head tips back, gargle sounds; cup home (brush and paste hop back in); Bunny leans over and spits 3 small drops into the bowl; big smile. |
| atchoo | sink | Drag the tissue onto Bunny's nose | Tissue (a soft crumpled puff) at the nose, "Atchoo!" floats up, sneeze; the tissue scrunches and Bunny holds it up in its right paw by its cheek (it stays in the paw). |
| binIt | sink | Drag the used tissue onto the bin | Lid flips up, the tissue is tossed (real physics) into the bin, thunk, lid shuts, a fresh tissue rises out of the box. |
| autoRinse | sink | (automatic after the soap in the sneeze routine) | caption "Rinse!" `[caption only]`, then the rinse. |
| fill | bath | Tap the bath tap | Knob turns, stream, the water (a soft blue surface with a light rim, just inside the tub) rises 2 s, the rubber duck bobs up. Bunny watches from the mat beside the tub. |
| pourBubbles | bath | Drag the bubble bottle onto the bath | Bottle tips and pours, 13 soft foam heaps settle on the water inside the tub's walls (clear of the duck); then Bunny hops over the rim into the bath (splash). In the tub its tail and long feet are tucked away under the water and its paws stay inside the tub, so nothing pokes through the tub's walls. |
| soapy | bath | Rub the sponge on Bunny's head | Foam on the head (up to 6 puffs, close to the head); 2 bubbles drift off to the side; then Bunny hops out over the rim onto the mat and the bath drains slowly. |
| dryBody | mat | Rub the big towel on Bunny | The big bath towel wraps round Bunny's shoulders (a soft cape with its front edges hanging down), a cosy wiggle, then it goes back over the bath's rim. |
| fluff | sink | Rub the hairbrush on the named ear | Each third of the rub smooths the ruffled tuft nearest the brush; the ear ends smooth and stays smooth; a happy little head shake. |
| wakeUp | bed | Tap the clock | Ringing stops, Zs go, eyes open, a big yawn and a stretch (Bunny lying under the duvet). |
| openDrapes | bed | Tap the curtains | Swoosh, curtains slide open, window turns to day; then the duvet slides off onto the floor (Bunny sits up, hops down and goes round to the head of the bed as the next round starts). |
| spreadDuvet | bedside | Drag the duvet onto the bed | The duvet (carried folded) flies onto the bed and spreads out flat. |
| teddyPillow | bedside | Drag Teddy onto the pillow | Teddy sits on the pillow, leaning on the headboard, legs out; squeak. |
| closeDrapes | bedroom | Tap the curtains | Swoosh, curtains slide shut, room dims (Bunny is already on its way to bed: it hops up onto the mattress and lies back, head on the pillow, ears up off it). |
| cuddle | bedroom | Drag Teddy onto Bunny | Teddy goes into Bunny's arms against its tummy, wherever Bunny is (on its way, Bunny carries it to bed); in bed Teddy lies on Bunny's tummy with its head by Bunny's chin; "mmm". |
| tuckIn | in bed | Drag the duvet onto Bunny | The duvet comes up from the foot of the bed over Bunny and Teddy to the chin (Teddy's head peeps out). |
| lightsOff | in bed | Tap the lamp | Tick, the room goes darker, nine glow stars come out on the wall above the bed one by one, Bunny's eyes close, slow Zs. |

Bunny's reaction when a routine ends: see "Right" above (no twirl).

## Level 1: a sunny day in the bathroom (6 rounds, the item glows)

Start: Bunny stands beside the step stool and hops up onto it as the game opens; Pip waves, "Let's help Bunny!" `[voiced]` (intro), round 1 (her first touch is possible about 1 s after the game opens).

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| R1 intro | Bunny on the stool holds its paws up: little splats of paint on both pads. | "Painty paws!" `[caption only]` | none (set-up, 0.6 s) | | | | step 1 |
| 1.1 | Bunny holds paws over the basin; the tap glows. | "Tap the tap for water!" `[no clip, TTS]` | Tap the sink tap. | Halo on tap; one 2 s ghost-hand tap demo; Go!. | wet. | "The tap first!" `[voiced]` if she tries the soap/towel. | 1.2 |
| 1.2 | Soap glows on the sink. | "Rub the soap on Bunny's paws!" `[no clip, TTS]` | Drag the soap to the paws and rub. | Halo; 4 s hand demo (drag then rub); Go!. | lather. | "Now the soap!" `[voiced]` | 1.3 |
| 1.3 | Tap glows again (paws lathered). | "Tap the tap to rinse!" `[no clip, TTS]` | Tap the tap. | Halo (no second demo: the same action as 1.1). | rinse. | "The tap again!" `[no clip, TTS]` | 1.4 |
| 1.4 | Towel on the bar glows; paws held out. | "Rub the towel on Bunny's paws!" `[no clip, TTS]` | Drag towel to paws, rub. | Halo; 4 s demo. | dry. Round cheer. Caption "Clean paws!" `[caption only]` | "Now the towel!" `[voiced]` | R2 |
| R2 | Bunny stays at the sink. Camera reframes to the brush and cup. Intro caption. | "Teeth time!" `[caption only]` | | | | | 2.1 |
| 2.1 | Toothpaste glows (in the cup beside the brush). | "Put the toothpaste on the brush!" `[no clip, TTS]` | Drag the tube onto the brush. | Halo, 3.4 s demo. | squeeze. | "The toothpaste first!" `[no clip, TTS]` | 2.2 |
| 2.2 | Brush glows. | "Brush Bunny's teeth!" `[new line, pending voice]` | Drag the brush to Bunny's mouth, rub. | Halo, 4 s demo. | scrub. | "Now the brush!" `[no clip, TTS]` | 2.3 |
| 2.3 | Cup glows. | "Give Bunny the cup of water!" `[no clip, TTS]` | Drag the cup to Bunny's mouth. | Halo, 3.4 s demo. | gargle. "Shiny teeth!" `[caption only]` | "Now the cup!" `[voiced]` | R3 |
| R3 | Bunny gasps, scared face, head tilts back (1.1 s) while "Ah... ah..." appears. Camera moves to the cabinet and bin. | "Ah... ah..." `[caption only]` (no intro line, no "ask" on this level) | | | | | 3.1 |
| 3.1 | Tissue glows on the cabinet. | "Put the tissue on Bunny's nose!" `[no clip, TTS]` | Drag the tissue to Bunny's nose. | Halo, 3.4 s demo. | atchoo. | "The tissue first!" `[no clip, TTS]` | 3.2 |
| 3.2 | Bunny holds the used tissue out; the bin glows. | "Put the tissue in the bin!" `[no clip, TTS]` | Drag the tissue to the bin. | Halo, 3.4 s demo. | binIt. | "The tissue in the bin!" `[no clip, TTS]` | 3.3 |
| 3.3 | Soap glows. | "Rub the soap on Bunny's paws!" `[no clip, TTS]` | Drag soap to paws and rub. | Halo. No demo (already shown in round 1). | lather, then automatic rinse with caption "Rinse!". "Bless you!" `[caption only]` | "Now the soap!" `[voiced]` | R4 |
| R4 | Bunny hops down, walks to the bath mat beside the tub (camera glides along). | "Bath time!" `[caption only]` | | | | | 4.1 |
| 4.1 | The whole tub, Bunny on the mat beside it, Pip peeping over the far end. Bath tap glows. | "Tap the tap to fill the bath!" `[no clip, TTS]` | Tap the bath tap. | Halo, 2 s demo. | fill. | "The bath tap first!" `[no clip, TTS]` | 4.2 |
| 4.2 | Bubble bottle glows. | "Pour the bubbles in the bath!" `[no clip, TTS]` | Drag the bottle over the bath. | Halo, 3.4 s demo. | pourBubbles, then Bunny hops into the bath. | "Now the bubbles!" `[no clip, TTS]` | 4.3 |
| 4.3 | Bunny sits in the bubbles; sponge glows. | "Rub the sponge on Bunny's head!" `[no clip, TTS]` | Drag sponge to Bunny's head, rub. | Halo, 4 s demo. | soapy; Bunny hops out, bath drains. | "Now the sponge!" `[voiced]` | 4.4 |
| 4.4 | Bunny on the mat; the big towel over the bath's rim glows. | "Rub the big towel on Bunny!" `[no clip, TTS]` | Drag towel onto Bunny, rub. | Halo, 4 s demo. | dryBody. "All clean!" `[caption only]` | "Now the big towel!" `[no clip, TTS]` | R5 |
| R5 | Bunny walks back to the sink; mud on the paws. | "Muddy paws!" `[caption only]` | | | | | 5.1 |
| 5.1-5.4 | The same four sink steps as round 1 (tap, soap, tap again, towel), same lines, same redirects. No demos (all shown). | "Tap the tap for water!" / "Rub the soap on Bunny's paws!" / "Tap the tap to rinse!" / "Rub the towel on Bunny's paws!" (as 1.1 to 1.4) | as 1.1 to 1.4 | halo only | "Clean paws!" `[caption only]` | | R6 |
| R6 | Bunny at the sink; ruffled tufts of fur stick out of both ears. Hairbrush on the cabinet. | "Messy fur!" `[caption only]` | | | | | 6.1 |
| 6.1 | Hairbrush glows. | "Brush Bunny's ear!" `[no clip, TTS]` | Drag the brush onto Bunny's right ear, rub. | Halo, 4 s demo. | fluff. | "The brush!" `[voiced]` | 6.2 |
| 6.2 | Brush glows again. | "Brush the other ear!" `[no clip, TTS]` | Drag brush to the other ear, rub. | Halo, new 4 s demo (different ear). | fluff. "So fluffy!" `[caption only]` | "The other ear!" `[voiced]` | Finale |

- **Ending:** the camera glides to clean, happy Bunny at the sink (`creationView`), five soap bubbles float up spaced out (poppable), "Look what you made!" for at least 4 s (a poke on Bunny makes it giggle: `creationObjects` = Bunny), photo, then the engine's sticker.
- **Timings (measured, autoplay, 1280x800):** her turn starts the moment every round starts (0 s). Bunny sets off for the next place as soon as a routine ends and is in place 2.4 s (bath) and 2.0 s (back at the sink) after the round starts; meanwhile the bath tap works at once, and the sink tap turns the water on at once (the paws go under it as Bunny arrives). Between steps 0.6 s. A full level takes about 2 minutes.
- **Every narrator line (L1):** "Let's help Bunny!" `[voiced]`; "Painty paws!" `[caption only]`; the four hands lines `[no clip, TTS]`: Tap the tap for water! / Rub the soap on Bunny's paws! / Tap the tap to rinse! / Rub the towel on Bunny's paws!; "Clean paws!"; "Teeth time!"; three teeth lines `[no clip, TTS]` (Put the toothpaste on the brush! / Rub the brush on Bunny's teeth! / Give Bunny the cup of water!); "Shiny teeth!"; "Ah... ah..."; sneeze lines `[no clip, TTS]` (Put the tissue on Bunny's nose! / Put the tissue in the bin! / Rub the soap on Bunny's paws!); "Rinse!"; "Bless you!"; "Bath time!"; bath lines `[no clip, TTS]` (Tap the tap to fill the bath! / Pour the bubbles in the bath! / Rub the sponge on Bunny's head! / Rub the big towel on Bunny!); "All clean!"; "Muddy paws!"; "Clean paws!"; "Messy fur!"; hair lines `[no clip, TTS]` (Brush Bunny's ear! / Brush the other ear!); "So fluffy!"; "Look what you made!"; "You did it! A sticker!" `[voiced]`. Redirects `[voiced]`: The tap first! / Now the soap! / Now the towel! / Now the cup! / Now the sponge! / The brush! / The other ear!; `[no clip, TTS]`: The tap again! / The toothpaste first! / Now the brush! / The tissue first! / The tissue in the bin! / The bath tap first! / Now the bubbles! / Now the big towel!

## Level 2: a morning in order (dawn, 6 rounds, items glow)

Window shows a pink dawn; Bunny starts asleep in bed, lying on its back with its head on the pillow, ears up off it, the star duvet tucked to its chin (eyes shut, a slow Z every 2.6 s); curtains closed; the alarm clock rings in short bursts and jiggles. The camera starts on the whole bed and the clock. Same glow/demo rules as L1; the lines use each step's `say`. Pip is in the bathroom (it joins the picture from round 3).

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| 1.1 | Sleeping Bunny, ringing clock glows. | "Ring ring! Tap the clock!" `[voiced]` | Tap the alarm clock. | Ringing and jiggling, halo, 2 s tap demo, Go!. | wakeUp. | "The clock!" `[voiced]` | 1.2 |
| 1.2 | Bunny awake in bed; curtains glow. | "Tap the curtains to open them!" `[no clip, TTS]` | Tap the curtains. | Halo, 2 s demo. | openDrapes, then the duvet slides off to the floor, Bunny gets up and goes round to the head of the bed. "Good morning!" `[caption only]` | "The curtains!" `[voiced]` | R2 |
| 2.1 | Bunny by the head of the bed; the duvet (in a heap off the foot of the bed) glows. | "Put the duvet on the bed!" `[no clip, TTS]` | Drag duvet to the bed. | Halo, 3.4 s demo. | spreadDuvet. | "The duvet first!" `[voiced; listed pending in new-lines.txt]` | 2.2 |
| 2.2 | Teddy on the rug glows. | "Put Teddy on the pillow!" `[no clip, TTS]` | Drag Teddy onto the pillow. | Halo, 3.4 s demo. | teddyPillow (Teddy sits on the pillow). "Nice and tidy!" `[caption only]` | "Now Teddy!" `[voiced]` | R3 |
| R3 | Bunny walks through the doorway (camera glides along, "To the bathroom!" `[caption only]`) and hops on the stool, holds up muddy paws: "Muddy paws!" `[caption only]` | | | | | | 3.1 |
| 3.1-3.4 | Hands routine: tap, soap, tap again, towel (same as L1 R1; its four demos play now because "shown" starts empty in this game). | same four hands lines; redirects as L1 | | | "Clean paws!" `[caption only]` | | R4 |
| R4 | "Teeth time!" `[caption only]` | | | | | | 4.1-4.3 |
| 4.1-4.3 | Teeth routine as L1 (paste, brush, cup). | as L1 | | | "Shiny teeth!" `[caption only]` | | R5 |
| R5 | "Ah... ah..." caption, gasp. No intro line. | | | | | | 5.1-5.3 |
| 5.1-5.3 | Sneeze routine as L1 (tissue to nose, tissue to bin, soap with auto-rinse); no soap demo here (the same action was already shown in round 3). | as L1 | | | "Bless you!" `[caption only]` | | R6 |
| R6 | "Messy fur!" `[caption only]` | | | | | | 6.1-6.2 |
| 6.1-6.2 | Hair routine as L1 (two ears). | as L1 | | | "So fluffy!" `[caption only]` | | Finale |

- **Ending:** as L1 (Bunny at the sink, framed; bubbles; "Look what you made!"; sticker).
- **Timings (measured):** her turn starts the moment every round starts (0 s). Round 2: the duvet can be dragged at once (it lands once Bunny is out of bed, about 1.5 s); Bunny is at the head of the bed 4.2 s in. Round 3: the tap works at once; Bunny is on the stool 3.4 s in. Between steps 0.6 s.
- **Every narrator line (L2):** "Let's help Bunny!" `[voiced]`; "Ring ring! Tap the clock!" `[voiced]`; "Tap the curtains to open them!" `[no clip, TTS]`; "Good morning!"; "Put the duvet on the bed!" `[no clip, TTS]`; "Put Teddy on the pillow!" `[no clip, TTS]`; "Nice and tidy!"; "To the bathroom!"; "Wash your paws!"; then the hands/teeth/sneeze/hair lines exactly as in L1 (with "Wash your paws!" instead of "Painty paws!"); "Look what you made!"; "You did it! A sticker!" `[voiced]`.

## Level 3: the evening (dusk, nothing glows, she picks what comes next, 6 rounds)

Window shows dusk with a moon; the lamp pool glows; light a little dimmer (25%). The bed is turned down (duvet folded at the foot). Bunny starts beside the step stool and hops up. Camera frames the whole routine's items, nothing is lit. The prompt is the routine's `ask` (said as the round starts) then "What comes next?". A first-time look only scans over the choices; the answer is shown only when she is stuck.

| # | What the child sees | Narrator says | Prompt | How she knows | If right | If wrong or nothing | Then |
|---|---|---|---|---|---|---|---|
| R1 | Bunny to the sink; jam on both paws. Caption "Sticky jam paws!" `[caption only]`. | | | | | | 1.1 |
| 1.1 | Sink: tap, soap, towel all in frame, none glowing. | "Wash Bunny's paws! What comes first?" `[no clip, TTS, listed pending]` | Tap the tap (nothing tells her). | Only the words. If she waits 4 s: the hand scans over tap, soap and towel (no answer). 8 s: the hand demo of the tap with a halo. | wet. | Soap or towel: the item flies home, Bunny shakes his head, "The tap first!" `[voiced]`. | 1.2 |
| 1.2 | | "What comes next?" `[voiced]` (caption only if said in the last 30 s) | Rub soap on the paws. | Same. | lather. | "Now the soap!" `[voiced]` | 1.3 |
| 1.3 | | "What comes next?" `[caption only]` (within 30 s) | Tap the tap again. | Same. | rinse. | "The tap again!" `[no clip, TTS]` | 1.4 |
| 1.4 | | "What comes next?" `[caption only]` | Towel on paws. | Same. | dry. "Clean paws!" `[caption only]` | "Now the towel!" `[voiced]` | R2 |
| R2 | "Bath time! What comes first?" is said; Bunny walks to the bath mat beside the tub. The whole tub and Bunny in the picture. | | | | | | 2.1 |
| 2.1 | Bath tap, bottle, sponge, big towel somewhere in the picture. | "Bath time! What comes first?" `[voiced]` | Tap the bath tap. | Words only; demo after 2.5 s idle. | fill. | "The bath tap first!" `[no clip, TTS]` | 2.2 |
| 2.2 | | "What comes next?" | Pour the bubbles in the bath. | | pourBubbles, Bunny hops in. | "Now the bubbles!" `[no clip, TTS]` | 2.3 |
| 2.3 | | "What comes next?" | Sponge on Bunny's head. | | soapy; hops out. | "Now the sponge!" `[voiced]` | 2.4 |
| 2.4 | | "What comes next?" | Big towel on Bunny. | | dryBody. "All clean!" `[caption only]` | "Now the big towel!" `[no clip, TTS]` | R3 |
| R3 | Bunny back to the sink. | | | | | | 3.1 |
| 3.1 | Paste, brush, cup in frame. | "Teeth time! What comes first?" `[voiced]` | Toothpaste on the brush. | Words. | squeeze. | "The toothpaste first!" `[no clip, TTS]` | 3.2 |
| 3.2 | | "What comes next?" | Brush on the teeth. | | scrub. | "Now the brush!" `[no clip, TTS]` | 3.3 |
| 3.3 | | "What comes next?" | Cup of water to the mouth. | | gargle. "Shiny teeth!" `[caption only]` | "Now the cup!" `[voiced]` | R4 |
| R4 | Bunny gasps, "Ah... ah..." `[caption only]`. | | | | | | 4.1 |
| 4.1 | Tissue box, bin, soap in frame. | "Ah... ah... What do we need?" `[voiced]` | Tissue onto the nose. | Words. | atchoo. | "The tissue first!" `[no clip, TTS]` | 4.2 |
| 4.2 | | "What comes next?" | Tissue in the bin. | | binIt. | "The tissue in the bin!" `[no clip, TTS]` | 4.3 |
| 4.3 | | "What comes next?" | Soap rub on paws. | | lather, auto "Rinse!" `[caption only]`. "Bless you!" `[caption only]` | "Now the soap!" `[voiced]` | R5 |
| R5 | "Bedtime! What comes first?" is said; Bunny walks into the bedroom ("To the bedroom!" `[caption only]`, the camera glides along). Curtains open. | | | | | | 5.1 |
| 5.1 | Curtains, bed and Teddy (on the rug) in frame. | "Bedtime! What comes first?" `[voiced]` | Tap the curtains to close them. | Words. | closeDrapes: curtains shut, room dims (meanwhile Bunny walks in from the bathroom, hops onto the mattress and lies down). | "The curtains first!" `[no clip, TTS]` | 5.2 |
| 5.2 | Bunny lying in bed, calm face; Teddy on the rug. | "What comes next?" | Drag Teddy to Bunny. | | cuddle (Teddy on Bunny's tummy, head by its chin, arms round it). "So cosy!" `[caption only]` | "Now Teddy!" `[voiced]` | R6 |
| R6 | Bunny in bed; duvet folded at the foot. | | | | | | 6.1 |
| 6.1 | Duvet and lamp in frame. | "Sleepy time! What comes next?" `[voiced]` | Duvet on Bunny. | Words. | tuckIn (duvet over Bunny and Teddy to the chin). | "The duvet first!" `[voiced]` | 6.2 |
| 6.2 | | "What comes next?" | Tap the lamp. | | lightsOff: stars, Bunny's eyes close, Zzz. "Night night!" `[caption only]` | "Now the lamp!" `[no clip, TTS]` | Finale |

- **Ending:** a quiet ending (`quietEnding` while Bunny sleeps): three slow Zs; the camera pulls back slowly (2.5 s) to the dark bedroom with the glow stars; "Look what you made!" for at least 4 s (a poke on sleeping Bunny makes one soft Z); photo; the sticker arrives silently (no rain, no chime, caption "A sticker!" only). Note: the engine still voices "Look what you made!" the first time in a session even in a quiet ending (engine change requested).
- **Timings (measured):** her turn starts the moment every round starts (0 s). Bunny in place: R2 2.4 s (bath), R3 2.0 s (sink), R5 6.1 s (bed; the curtains work at once, and Teddy can be given to Bunny on the way: Bunny carries it to bed). Between steps 0.6 s.
- **Every narrator line (L3):** "Let's help Bunny!"; "Sticky jam paws!"; the six `ask` lines `[voiced]` except "Wash Bunny's paws! What comes first?" `[no clip, TTS]`: Wash Bunny's paws! What comes first? / Bath time! What comes first? / Teeth time! What comes first? / Ah... ah... What do we need? / Bedtime! What comes first? / Sleepy time! What comes next?; "What comes next?" `[voiced]` (repeats caption only); done lines "Clean paws!", "All clean!", "Shiny teeth!", "Bless you!", "So cosy!", "Night night!" `[caption only]`; "Rinse!", "To the bedroom!"; redirects as in the tables; "Look what you made!"; "You did it! A sticker!" `[voiced]`.

## Notes

- Instruction lines without a clip still fall back to the browser voice (see `tools/voice/new-lines.txt`; "Brush Bunny's teeth!" is new).
- Models (all in `prop_myday.py`): sink rebuilt for the washing pose (thin steep back wall, low spout over the paws); hand towel, big bath towel (on the rim), towel wrap (round the paws) and bath cape (round Bunny) as soft draped cloth; tissue a crumpled puff; curtains at real size with a scalloped hem; duvet as four shapes (spread, tucked over Bunny - shaped from the real lying pose sampled in game, `myday_bunny_lying.json` - folded, heap); bed with a piped fitted sheet and a plump pillow; bath without the ragged band.
