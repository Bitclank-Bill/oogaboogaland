# The Genesis overhaul: one museum cave (branch `gv/overhaul`)

Billy's candidate-3 playtest asked for a full redesign: one large, coherent museum cave walked on foot, with no boat,
stream, sailing, boarding or transport UI.
- **Candidate 3** (`db28481793e7a31b71d6bea8b7b923843fbf9ff7` on `gv/integration-2`) is untouched.
- **This branch** descends from it through `gv/museum`'s prototype (0238f67).
- **The interface the two builder tabs work to** is `OVERHAUL-CONTRACT.md`, frozen at `a29195b`.

## The room

- **Arrival:** an open **atrium** of 96 × 156 m in the middle, which the visitor arrives in on foot by the statue.
  The **huge white timeline screen** (24 × 8 m) stands ahead. The atrium's floor stays clear apart from a ring of
  eight pillars well in from the walls, and a gold band marks its edge.
- **The eight eras** stand round the atrium, **clockwise in date order** from the south-west:
  - West wall: Era 0, then Era 1.
  - North wall: Eras 2 and 3.
  - East wall: Eras 4 and 5.
  - South wall: Eras 6 and 7, which closes the loop beside the arrival.
- **Galleries:** each era has a gallery opening straight off the atrium under an arch with its era's sign in that
  era's own signage. Its floor, walls, roof, glowing seams and lamps are in that era's colours. A gold walk runs down
  its middle where the stream used to be.
- **One cave:** the galleries share the atrium and one roof. Neighbouring galleries are separated only by a
  partition, so the era identity comes from light, material and decor rather than from separate caves.
- **Sized to the content:** each gallery is as wide as its exhibits need, from 40 m (Era 7) to 76 m (Eras 1, 4 and 5),
  and as deep, from 57 to 72 m. Nothing was squeezed: every era keeps the layout its builders made.
  - Walking from the arrival to the nearest gallery's first exhibit takes about 70 m. The far side of the atrium is
    about 160 m away.
  - The timeline menu (G), the white screen and the workbench's Previous/Next with "Take me there" are the shortcuts.

## The atrium's centrepiece (`gv/ovh-atrium`, `genesis-atrium.js`)

An original artwork of the Steps toward Bitcoin in the middle of the atrium, laid out from the catalogue's READY trail
data alone.
- **The spiral:** ten plinths in date order, clockwise and inward like the galleries, rising a little each step.
  - **Marks:** a gold cube with its reference for a whitepaper citation, a gold ring for documented influence.
  - **Each plinth's sign** gives the step, year, title and class.
  - **The floor line:** a gold line joins them in order. It shows date order only, never that one led to the next.
- **The middle:** a dais holds the paper (step 11, the whitepaper itself, announced 31 October 2008). Beside it is the
  genesis block's record, marked "after the paper": context, not a step.
- **The floor map:** a ring of eight floor markers names each era and its years and points at its gallery's arch.
- **Use:** Space by a step, or a tap on it, opens that exhibit's workbench (`host.open`).
- **Rules kept:**
  - the view from the arrival to the white screen stays clear, and there's room to walk between every plinth;
  - a single bead of light runs along the line, held in Calm and under pause;
  - it adds one point light;
  - `update` allocates nothing.
- **Unit check:** `genesisAtriumProof`.

The game console (`genesis-cartridge.js`) and how an era asks for it are in OVERHAUL-CONTRACT.md, Addendum A, and
covered by `genesisCartridgeProof`.

## How the era files were kept

- **No coordinates rewritten:** each era's file builds exactly as before, in its old cave's coordinates. Every node
  it places goes under its gallery's frame node, a quarter turn at a time and moved
  (`genesis-world.js` `MUSEUM.toMuseum` / `fromMuseum`).
- **The scene turns into the museum:**
  - its walk-up points (`at`);
  - its obstacles (`boxToMuseum`; a quarter turn keeps boxes boxes);
  - its tap boxes, which stay in the frame (picking uses the graph's world transforms);
  - the visitor's position handed to the era's `update`, which is turned back into the era's own coordinates.
- **Fingerprints and Time,** with Tock's desk, the chain wall, the newspaper and the PC, drives and book, moves with
  Era 3's gallery in the same way.
- **Words only:** the era files' changes are their navigation wording, for example "board a boat and sail back
  upstream" becoming "walk back round the museum … or open it from the timeline (G)", and "left bank" becoming "left
  side" (a quarter turn keeps left and right as the visitor walks in).
- **Kept unchanged:** dates, sources, citation/influence/context classes, READY-only content and every demonstration.

## Checks

- **Unit:** `genesisMuseumProof` checks four things:
  - the galleries never overlap each other or the atrium, and each opens onto it;
  - they run clockwise in date order;
  - an era's coordinates turn into the museum and back exactly;
  - every one of the era files' 2,000-odd solids, signs, obstacles and exhibits lands inside its own gallery.
- **Unit (catalogue):** `genesisBenchProof` checks the catalogue (OVERHAUL-CONTRACT.md §1) beside the workbench rules.
- **Unit (holds):** `genesisHoldsProof` covers OVERHAUL-CONTRACT.md §4.
  - An explicit pause holds the scene's clock, the open exhibit, the walk, the ambient show and era changes.
  - The workbench keeps only its own exhibit running.
  - The timeline menu holds the walk, ambient activity, era music and captions.
  - The scene's `update()` gates each part on those holds.
- **Browser:** automated, software-rendered probes; see the checkpoint's `START-HERE.md`.
  - The 82-exhibit sweep checks that each exhibit opens through the host and that **each model's centre is framed in
    the stage**: one projected point per exhibit.
  - It is not complete visibility verification. A model can still be partly cut off by the stage's edge or hidden
    behind something.

## What remains

- **Long walks:** the atrium is large because the galleries are as wide as their exhibits. Compacting an era's
  exhibits inside its gallery is era-builder work, which was out of scope here.
- **Performance unmeasured:** on real hardware, all eight eras are in one cave. The lamps are re-ordered nearest-first
  every frame, so a lower tier keeps the ones in sight, but frame rate on a laptop or phone hasn't been measured.
- **Unused code:** `genesis-boat.js`, the boarding helpers and the boat captions in `genesis-voyage.js` are unused,
  and are kept until the redesign is accepted.
- **Not tested by people:** human playtesting, phones and touch, and sound.
