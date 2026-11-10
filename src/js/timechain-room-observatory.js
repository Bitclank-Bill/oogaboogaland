// A placeholder for the observatory room, until its build lands: the shell with a plain dome and floor.
(() => {
  "use strict";
  const BL = window.BL;
  const plan = (K, L) => {
    K.dome((ctx, D) => { D.sky(ctx, [[90, "#0b0a09"], [0, "#16110c"]]); });
    if (!L.rake) K.floor((ctx, F) => { F.tiles(); });
  };
  BL.timechainRoomKinds.observatory = { plan };
})();
