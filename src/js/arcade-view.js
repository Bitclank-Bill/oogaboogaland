// One cabinet visit: approach its glass, run the real menu/scene inside it, expand, and return.
// The hall is captured once at the glass; no second scene or renderer lives behind a running game.
(() => {
  "use strict";
  const BL = window.BL;
  const AXES = ["x", "y", "z"];
  const ease = t => t * t * (3 - 2 * t);
  const copy = camera => ({ position: { ...camera.position }, target: { ...camera.target }, fov: camera.fov });
  const mix = (camera, a, b, k) => {
    for (const key of AXES) {
      camera.position[key] = a.position[key] + (b.position[key] - a.position[key]) * k;
      camera.target[key] = a.target[key] + (b.target[key] - a.target[key]) * k;
    }
    camera.fov = a.fov + (b.fov - a.fov) * k;
  };
  const create = ({ canvas, renderer, go }) => {
    const stage = document.getElementById("stage"), backdrop = document.createElement("canvas"), paint = backdrop.getContext("2d");
    backdrop.id = "cabinet-backdrop"; backdrop.hidden = true; backdrop.setAttribute("aria-hidden", "true");
    document.body.prepend(backdrop);
    const exitButton = document.createElement("button");
    exitButton.type = "button"; exitButton.className = "cabinet-exit"; exitButton.textContent = "Return to arcade"; exitButton.hidden = true;
    exitButton.addEventListener("click", () => route("arcade")); document.body.append(exitButton);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visit = null, phase = "idle", age = 0, dispatching = false, lost = false;
    let shownW = 0, shownH = 0, shownX = -1, shownY = -1;
    let width = innerWidth, height = innerHeight, rw = 0, rh = 0, rx = 0, ry = 0;
    const rect = () => {
      width = innerWidth; height = innerHeight;
      if (visit?.rect) { rx = visit.rect.x * width; ry = visit.rect.y * height; rw = visit.rect.w * width; rh = visit.rect.h * height; return; }
      rw = Math.min(width * 0.86, height * 0.76 * 4 / 3); rh = rw * 3 / 4;
      rx = (width - rw) / 2; ry = (height - rh) / 2;
    };
    const duration = () => reduced.matches ? 0 : 0.7;
    const setPhase = value => {
      phase = value; age = 0; document.body.dataset.cabinetPhase = value;
      exitButton.hidden = value === "idle" || value === "playing" || value === "return" || value === "leaving" || value === "shrinking";
    };
    const screen = k => {
      rect();
      const w = rw + (width - rw) * k, h = rh + (height - rh) * k, x = rx * (1 - k), y = ry * (1 - k);
      if (w === shownW && h === shownH && x === shownX && y === shownY) return;
      shownX = x; shownY = y;
      stage.style.left = `${rx * (1 - k)}px`; stage.style.top = `${ry * (1 - k)}px`;
      stage.style.width = `${w}px`; stage.style.height = `${h}px`;
      document.body.style.setProperty("--cabinet-width", `${w}px`);
      document.body.style.setProperty("--cabinet-height", `${h}px`);
      stage.classList.add("cabinet-display"); backdrop.hidden = false;
      if (w !== shownW || h !== shownH) { shownW = w; shownH = h; renderer.resize(); }
    };
    const full = () => {
      stage.classList.remove("cabinet-display");
      stage.style.left = stage.style.top = stage.style.width = stage.style.height = "";
      backdrop.hidden = true;
      shownW = shownH = 0; renderer.resize();
    };
    const dispatch = (id, place) => {
      dispatching = true;
      try { return go(id, place, true); } finally { dispatching = false; }
    };
    const clear = () => {
      full(); visit = null; lost = false; setPhase("idle");
      BL.net.leaveCabinet();
      backdrop.width = backdrop.height = 1;
    };
    const unsubscribe = BL.net.subscribe(() => {
      if (visit?.live && (BL.net.state.room !== "live" || !BL.net.state.me || !BL.net.cabinet)) lost = true;
    });
    const begin = (id, cabinet, camera) => {
      if (visit) return false;
      rect();
      const S = BL.arcadeModels.SCREEN, c = Math.cos(cabinet.turn), s = Math.sin(cabinet.turn);
      const target = { x: cabinet.x + s * S.z, y: cabinet.y + S.y, z: cabinet.z + c * S.z };
      const d = S.h / (2 * Math.tan(camera.fov / 2) * (rh / height));
      const close = { target, fov: camera.fov, position: { x: target.x + s * Math.cos(S.lean) * d,
        y: target.y - Math.sin(S.lean) * d, z: target.z + c * Math.cos(S.lean) * d } };
      visit = { camera, id, live: !!BL.net.state.me, from: copy(camera), close, returnView: null, exit: null };
      setPhase("approach");
      return true;
    };
    const route = (id, place) => {
      if (!visit || dispatching) return false;
      if (phase === "return" || phase === "shrinking" || phase === "leaving") return true;
      visit.exit = id === "arcade" ? null : { id, place };
      if (phase === "approach") {
        visit.returnView = visit.from; visit.close = copy(visit.camera); setPhase("return"); return true;
      }
      setPhase("shrinking");
      return true;
    };
    const arrived = scene => {
      if (!visit) return;
      if (phase === "loading") { setPhase("menu"); screen(0); }
      else if (phase === "leaving" && scene.id === "arcade") {
        visit.returnView = null; full(); setPhase("return");
        BL.net.leaveCabinet();
      }
    };
    const update = (dt, scene, menu, transitioning) => {
      if (!visit) return;
      if (lost && !transitioning && phase !== "return" && phase !== "leaving" && phase !== "shrinking") {
        BL.hud.toast("Cabinet connection lost · returning to the arcade"); route("arcade");
      }
      age += dt;
      const k = ease(duration() ? Math.min(1, age / duration()) : 1);
      if (phase === "approach") mix(scene.camera, visit.from, visit.close, k);
      else if (phase === "menu") {
        screen(0);
        if (!menu) setPhase("expanding");
      } else if (phase === "expanding") {
        screen(k);
        if (k === 1) { full(); setPhase("playing"); }
      } else if (phase === "shrinking") {
        screen(1 - k);
        if (k === 1 && !transitioning) {
          setPhase("leaving");
          // Do not hand a game-world pose to the room between scenes.
          dispatch("arcade", visit.id === "cloud-hopper" ? "cloud-hopper-return" : null);
        }
      } else if (phase === "return") {
        if (!visit.returnView) visit.returnView = copy(scene.camera);
        mix(scene.camera, visit.close, visit.returnView, k);
        if (k === 1) {
          const exit = visit.exit;
          clear();
          scene.stay?.();
          if (exit) dispatch(exit.id, exit.place);
        }
      }
    };
    const afterDraw = () => {
      if (phase !== "approach" || age < duration()) return;
      backdrop.width = canvas.width; backdrop.height = canvas.height;
      paint.drawImage(canvas, 0, 0);
      visit.rect = { x: rx / width, y: ry / height, w: rw / width, h: rh / height };
      setPhase("loading");
      dispatch(visit.id === "cloud-hopper" ? "hub" : visit.id, visit.id === "cloud-hopper" ? "cloud-hopper" : null);
    };
    const failed = () => {
      if (!visit) return;
      if (phase === "leaving") { full(); setPhase("playing"); }
      else { visit.returnView = visit.from; full(); setPhase("return"); }
    };
    return { begin, route, arrived, update, afterDraw, failed,
      get active() { return !!visit; }, get phase() { return phase; },
      get held() { return visit && phase !== "menu" && phase !== "playing"; },
      dispose() { clear(); unsubscribe(); backdrop.remove(); exitButton.remove(); } };
  };
  BL.arcadeView = { create };
})();
