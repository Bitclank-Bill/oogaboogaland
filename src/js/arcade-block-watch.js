// The way to watch Block Frenzy: a walk-through doorway in the east wall of its entry hall (`BLOCK_HALL`), between the
// torch and the last map picture, with the shared Ooga portal in it. It is separate from the zipline, which stays the way
// to play. Layout, the signed-in rule and the door's walking are pure, for scene-arcade.js and the tests. `goToWatchDeck`
// is the one place the viewer leaves for the deck: Block Frenzy's watch deck does not exist yet, so it says so and
// nobody moves. The way back is `PLACE`: a deck sends a viewer to `go("arcade", PLACE)` and they stand at `ARRIVAL`.
(() => {
  "use strict";
  const BL = window.BL;
  const { BLOCK_HALL: BH } = BL.arcadeModels, CENTRE = -35.4, H = 3, Y = BH.y;
  // `z0`, `z1` the clear opening; `plane` the portal's surface, a little proud of the rock; `reach` how far a body's edge
  // may press past it, so its middle just crosses the surface and no further.
  const DOOR = { z: CENTRE, z0: CENTRE - 1.2, z1: CENTRE + 1.2, plane: BH.x1 - 0.15, reach: BH.x1 + 0.27, h: H, y: Y };
  // Over the tallest walker's head, in the view from the hall's middle: the hanging sign and the blade sign's heights.
  const SIGN_Y = 2.5, BLADE_Y = 3.1;
  const APERTURE = Object.freeze({ width: 2.5, height: H, footWidth: 2.5, footHeight: 0, inset: 0.06 });
  const PLACE = "block-watch", ARRIVAL = Object.freeze({ x: BH.x1 - 1.6, z: CENTRE, facing: -Math.PI / 2, deck: true });
  // How far a body reaches into rock here, negative in the clear: the hall's walk bound carried on to the portal, only
  // on the hall's own level and only across the opening.
  const doorDepth = (x, z, r, feet) => feet < Y - 1 || feet > Y + H ? Infinity : Math.max(BH.x0 + r - x, x + r - DOOR.reach, DOOR.z0 + r - z, z + r - DOOR.z1);
  const mayWatch = (signedIn, debug) => !!signedIn || !!debug;
  const SIGN_IN = "Sign in to watch Block Frenzy", SOON = "Block Frenzy viewing deck coming soon";
  // The stub until the watch deck lands: tells the visitor and leaves them standing. Returns whether they left.
  const goToWatchDeck = (hud) => { hud.toast(SOON); return false; };
  BL.arcadeBlockWatch = { SIGN_Y, BLADE_Y, DOOR, APERTURE, PLACE, ARRIVAL, SIGN_IN, SOON, doorDepth, mayWatch, goToWatchDeck };
})();
