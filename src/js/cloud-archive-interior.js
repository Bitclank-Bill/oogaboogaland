// One visit to the Cloud Archive (scene-cloudarchive.js), climbed into up the island's beanstalk. The Ooga arrives at
// the foot of a shaft under the cloud floor and climbs the stalk on the crew's own ladder (W/S, A/D, Space jumps off)
// up into a white room without walls, where one dark rack a day of the game's history stands down a long aisle, a
// book a commit (cloud-archive-models.js, cloud-archive-data.js). Tap a rack, or its plaque, for that day's board:
// its commits, merged PRs and who made them, with links out to GitHub; the arrows page through the days. Climbing back
// down to the foot of the shaft (or Leave, or Escape) hands the same Ooga back to the island at the beanstalk.
//
// Solo for now: no presence, poses or voice. The Ooga walks empty-handed and without a jetpack, as in the Sphere.
(() => {
  "use strict";
  const BL = window.BL;
  const { models, contributors, hud: hudMod, interact: interactMod, pilot: pilotMod, fx: fxMod } = BL;
  const { clamp } = BL.math;
  const { createNode, addChild, removeChild, createCamera, stepTweens, tweenCount, traverseVisible } = BL.scene;
  const DATA = BL.cloudArchiveData, CM = BL.cloudArchiveModels, L = CM.LAYOUT, S = L.SHAFT, RACK = L.RACK;
  const COARSE = window.matchMedia("(pointer: coarse)").matches;
  const NO_JETPACK = { owned: false, equipped: false, fuel: 1, blocked: false };
  const REPO_URL = `https://github.com/${DATA.repo}`;
  const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
  // White everywhere: the clear colour, sky and ground light all near white, a soft key light and little bloom.
  const RENDER_OPTS = {
    clear: [0.95, 0.955, 0.965], sky: [0.98, 0.98, 1], ground: [0.86, 0.87, 0.9], horizon: [0.95, 0.955, 0.965], zenith: [0.97, 0.975, 0.985],
    direct: [0.6, 0.6, 0.62], directStrength: 0.25, ambientFloor: 0.78, sun: [0, 0, 0], light: { x: 0.3, y: 0.9, z: 0.2 },
    shadowCenter: { x: 0, y: 1, z: -10 }, shadowExtent: 30,
    lights: new Float32Array(BL.glRenderer.POINT_LIGHT_CAPACITY * 8), lightCount: 0, bloomStrength: 0.2
  };
  // How long the Ooga must stand at the shaft's foot after climbing down before the island takes it back.
  const ARRIVAL_PITCH = -0.55, EXIT_HOLD = 0.35, BOARD_W = 960, BOARD_H = 600, PLAQUE_W = 512, PLAQUE_H = 128;
  const dayStats = (day) => {
    let prs = 0, bots = 0;
    const by = new Map();
    for (const c of day.commits) {
      if (c[3]) prs++;
      if (c[4] & 1) { bots++; continue; }
      by.set(c[1], (by.get(c[1]) || 0) + 1);
    }
    const people = [...by].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    return { commits: day.commits.length, prs, bots, people };
  };
  const STATS = DATA.days.map(dayStats);
  const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const paintPlaque = (i) => {
    const canvas = document.createElement("canvas"), g = canvas.getContext("2d"), s = STATS[i];
    canvas.width = PLAQUE_W; canvas.height = PLAQUE_H;
    g.fillStyle = "#1d1f24"; g.fillRect(0, 0, PLAQUE_W, PLAQUE_H);
    g.fillStyle = "#e8b04a"; g.fillRect(0, PLAQUE_H - 6, PLAQUE_W, 6);
    g.fillStyle = "#ffffff"; g.font = `700 52px ${FONT}`; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.fillText(DATA.days[i].date, PLAQUE_W / 2, 62);
    g.fillStyle = "#c9ccd3"; g.font = `500 26px ${FONT}`;
    g.fillText(`${plural(s.commits, "commit")} · ${plural(s.prs, "PR")} · ${plural(s.people.length, "person")}`.replace("persons", "people"), PLAQUE_W / 2, 104);
    return canvas;
  };
  // The day's board: date, counts, who (with their shelf colour) and the commits, as many as the page holds.
  const paintDay = (g, i) => {
    const day = DATA.days[i], s = STATS[i];
    g.fillStyle = "#f6f7f9"; g.fillRect(0, 0, BOARD_W, BOARD_H);
    g.fillStyle = "#1d1f24"; g.font = `700 34px ${FONT}`; g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.fillText(longDate(day.date), 36, 56);
    g.fillStyle = "#5b606b"; g.font = `500 20px ${FONT}`;
    g.fillText(`${plural(s.commits, "commit")} · ${plural(s.prs, "merged PR")} · ${s.people.length} ${s.people.length === 1 ? "person" : "people"}${s.bots ? ` · ${s.bots} by automation` : ""}`, 36, 88);
    let x = 36, y = 126;
    g.font = `600 18px ${FONT}`;
    for (const [p, n] of s.people) {
      const label = `${DATA.people[p]} ${n}`, w = g.measureText(label).width + 34;
      if (x + w > BOARD_W - 36) { x = 36; y += 32; }
      if (y > 220) break;
      g.fillStyle = CM.personColor(p); g.fillRect(x, y - 16, 14, 20);
      g.fillStyle = "#1d1f24"; g.fillText(label, x + 20, y);
      x += w;
    }
    y += 40;
    g.fillStyle = "#d4d7dd"; g.fillRect(36, y - 24, BOARD_W - 72, 2);
    g.font = `500 17px ${FONT}`;
    const lines = Math.floor((BOARD_H - 24 - y) / 25), list = day.commits;
    for (let n = 0; n < Math.min(list.length, lines); n++) {
      const c = list[n], more = n === lines - 1 && list.length > lines;
      if (more) { g.fillStyle = "#5b606b"; g.fillText(`…and ${list.length - n} more: open this day's commits on GitHub below`, 36, y); break; }
      g.fillStyle = c[4] & 1 ? "#8a9099" : c[3] ? "#a8741a" : "#1d1f24";
      const head = `${c[0].slice(0, 7)}  ${c[3] ? `#${c[3]} ` : ""}`, who = DATA.people[c[1]];
      g.font = `600 17px ui-monospace, Menlo, Consolas, monospace`; g.fillText(head, 36, y);
      const hw = g.measureText(head).width;
      g.font = `500 17px ${FONT}`;
      let title = c[2];
      const room = BOARD_W - 72 - hw - g.measureText(` · ${who}`).width;
      while (title.length > 4 && g.measureText(title).width > room) title = title.slice(0, -2);
      if (title !== c[2]) title = title.replace(/\s*\S?$/, "…");
      g.fillText(`${title} · ${who}`, 36 + hw, y);
      y += 25;
    }
  };

  const create = (shell, ctx) => {
    const { renderer, game, world, go, canvas } = ctx;
    const camera = createCamera({ fov: 60, near: 0.12, far: 260 });
    const root = createNode();
    const hud = hudMod.create({ signal: ctx.signal, roster: contributors.activeRoster, catalog: models.SWAG, tierColors: models.TIER_COLORS, renderIcon: hudMod.renderIcon, lootEnabled: ctx.lootEnabled });
    const hooks = {};
    const input = interactMod.create({ canvas, renderer, camera, hooks });
    const built = CM.build();
    addChild(root, built.root);
    RENDER_OPTS.lightCount = 0;

    // Walking: inside the shaft while down it, else the floor within the bounds and clear of the racks.
    const B = L.bounds;
    const clearOfRacks = (x, z, r) => {
      for (let i = 0; i < built.racks.length; i++) {
        const p = built.racks[i].position;
        if (Math.abs(x - p.x) < RACK.d / 2 + r && Math.abs(z - p.z) < RACK.w / 2 + r) return false;
      }
      return true;
    };
    const walkable = (ax, az, bx, bz, y, height, actor) => {
      const r = actor && actor.bodyRadius || 0.35;
      if (y < -1.8) return L.inShaft(bx, bz, r * 0.6);
      return bx > B.x0 && bx < B.x1 && bz > B.z0 && bz < B.z1 && clearOfRacks(bx, bz, r);
    };
    const groundAt = (x, z) => L.inShaft(x, z) ? -S.depth : 0;
    const roof = () => 40;
    const clampTarget = (p) => {
      p.x = clamp(p.x, B.x0, B.x1); p.z = clamp(p.z, B.z0, B.z1);
      p.y = clamp(p.y, L.inShaft(p.x, p.z) ? -S.depth + 0.4 : 0.4, 30);
    };
    const clampCamera = (p) => {
      const x = p.x, y = p.y, z = p.z;
      p.x = clamp(p.x, B.x0 - 4, B.x1 + 4); p.z = clamp(p.z, B.z0 - 4, B.z1 + 4);
      // Below the floor the eye stays in the shaft, pulled in toward the stalk rather than lifted onto the floor.
      if (p.y < 0.3) {
        if (!L.inShaft(p.x, p.z, 0.15)) { p.x = clamp(p.x, S.x0 + 0.15, S.x1 - 0.15); p.z = clamp(p.z, S.z0 + 0.15, S.z1 - 0.15); }
        p.y = Math.max(p.y, -S.depth + 0.3);
      } else p.y = Math.min(p.y, 34);
      return p.x !== x || p.y !== y || p.z !== z;
    };
    const keepCameraInside = () => {
      const p = camera.position, x = p.x, y = p.y, z = p.z;
      if (!clampCamera(p)) return;
      camera.target.x += p.x - x; camera.target.y += p.y - y; camera.target.z += p.z - z;
    };
    const view = { yaw: 0, pitch: 0.3, dist: 4, target: { x: L.arrival.x, y: -S.depth + 1.6, z: L.arrival.z } };
    const pilot = pilotMod.create({
      renderer, canvas, camera, hud, presets: { entrance: view }, landing: "entrance", pitch: [-0.4, 1.3], dist: [3, 10],
      follow: { y: 0.9, min: 3, max: 8, pitch: [0.15, 0.9] }, fly: { speed: 5, perDist: 0.4, climb: 3, yMax: 30 },
      clampTarget, clampCamera, observeOrbit: keepCameraInside, ceilingAt: roof, coarse: COARSE, mayPossess: (cave) => BL.net.mayDrive(cave.traits.name),
      jetpackStatus: () => NO_JETPACK,
      close: { eyeHeight: 1.1, eyeRatio: 0.95, eyeForward: 0.16, pitch: [-1.35, 1.35], trailingDist: 4, orbitDist: 5, maxStep: 0.6, groundAt }
    });
    const fx = fxMod.create({ root, input, hooks, hud, game, world, renderer, camera, overlay: ctx.overlay, tickerAt: { x: 0, y: 4, z: 0 } });
    const targets = [];
    const target = (node, owner, radius = 0) => { input.add(node, owner, { radius }); targets.push(node); return owner; };

    // The plaques over the racks, each its own small canvas, and every rack a target for its day's board.
    const plaques = [];
    built.racks.forEach((rack, i) => {
      const plaque = createNode({ geometry: CM.plaque(paintPlaque(i), 1.6, 0.4), position: { x: 0, y: RACK.h + 0.3, z: RACK.d / 2 } });
      addChild(rack, plaque);
      plaques.push(plaque);
      target(rack, { kind: "rack", index: i }, 1.7);
      target(plaque, { kind: "rack", index: i }, 0.8);
    });
    target(built.root.children[1], { kind: "stalk" }, 1.2);

    // The board: one page a day, painted when shown.
    const boardCanvas = document.createElement("canvas");
    boardCanvas.width = BOARD_W; boardCanvas.height = BOARD_H;
    let dayIndex = 0, boardVersion = 0, painted = -1;
    const showDay = (i) => {
      dayIndex = clamp(i, 0, DATA.days.length - 1);
      if (painted !== dayIndex) { paintDay(boardCanvas.getContext("2d"), dayIndex); painted = dayIndex; }
      boardVersion++;
    };
    const dayLinks = (i) => {
      const day = DATA.days[i], next = new Date(Date.parse(`${day.date}T00:00:00Z`) + 864e5).toISOString().slice(0, 10);
      const links = [{ href: `${REPO_URL}/commits/rock/?since=${day.date}&until=${next}`, label: "This day's commits on GitHub (new tab)" }];
      for (const c of day.commits) if (c[3] && links.length < 5) links.push({ href: `${REPO_URL}/pull/${c[3]}`, label: `PR #${c[3]}: ${c[2]} (new tab)` });
      return links;
    };
    const board = {
      title: "Cloud Archive", help: "One shelf a day, one book a commit. Arrow keys flip the days.", wide: true,
      get canvas() { return boardCanvas; }, get count() { return DATA.days.length; }, get index() { return dayIndex; },
      get caption() { return `${DATA.days[dayIndex].date} · day ${dayIndex + 1} of ${DATA.days.length}`; },
      get note() {
        const s = STATS[dayIndex];
        const who = s.people.map(([p, n]) => `${DATA.people[p]} (${n})`).join(", ");
        return `${plural(s.commits, "commit")}, ${plural(s.prs, "merged PR")}${who ? `, by ${who}` : ""}${s.bots ? `; ${s.bots} by automation` : ""}. From the game's own git history at ${DATA.head.slice(0, 7)}.`;
      },
      get links() { return dayLinks(dayIndex); },
      get version() { return boardVersion; },
      go: (i) => showDay(i)
    };
    const openDay = (i) => { showDay(i); hud.openBoard(board); };

    // The visitor's Ooga: the one handed over, else their own, else the roster's first they may drive.
    const mayPick = (entry) => !BL.net.mayDrive(entry.name);
    const own = BL.net.ownCharacter();
    let playerName = null;
    for (const name of [world.pilot, own && own.handle]) {
      const entry = name && contributors.roster.find((c) => c.name === name);
      if (entry && mayPick(entry)) { playerName = entry.name; break; }
    }
    if (!playerName) playerName = contributors.activeRoster.find(mayPick)?.name || null;
    world.pilot = null;
    const playerWorld = { level: 0, weapons: new Map(), magazine: { owned: false, count: 0, ammo: 0, carrier: null } };
    let people = null, avatar = null;
    const NO_ACTORS = [];
    if (playerName) {
      const sharedCtx = { root, input, hud, game, world: playerWorld, playerName, fx, viewYaw: 0, outsideActors: () => NO_ACTORS, outsideActorHeight: BL.remotePlayers.BODY_HEIGHT,
        groundAt, walkable, ladders: [L.LADDER], useNear: () => false, jetpackAllowed: () => false };
      people = sharedCtx.crew = BL.crew.create(sharedCtx);
      pilot.bind(sharedCtx);
      avatar = people.cavemen.get(playerName);
      avatar.weapon.primaryOwned = avatar.weapon.secondaryOwned = false;
      people.selectWeapon(0, avatar);
      avatar.weapon.aiming = false;
      avatar.parts.club.visible = avatar.parts.gun.visible = false;
      if (avatar.jet) people.removeJetpack(avatar);
      pilot.possess(avatar);
      // In first person at the shaft's foot, facing the stalk and looking up it to the light.
      pilot.enterClose();
      pilot.navigate({ position: { x: L.arrival.x, y: -S.depth, z: L.arrival.z }, yaw: 0, pitch: ARRIVAL_PITCH, dist: 4 });
    }
    keepCameraInside();
    BL.net.setBody(null);
    BL.net.setZone("none");
    const footsteps = BL.footsteps.create();

    // Up and back down: `climbed` once the Ooga has stood on the floor; after that, standing at the shaft's foot a
    // moment takes it home.
    let climbed = false, atFoot = 0, leaving = false, hintStage = null;
    const handOff = () => {
      if (leaving) return;
      world.pilot = avatar ? avatar.traits.name : null;
      world.pilotDetached = !avatar;
      world.archiveExit = true;
      leaving = go("hub");
      if (!leaving) world.archiveExit = false;
    };
    const stay = () => { leaving = false; world.archiveExit = false; climbed = false; atFoot = 0; };
    const WEAPON_KEYS = new Set(["1", "2", "r", "f", "g", "j"]);
    const armsKeys = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !WEAPON_KEYS.has(e.key.toLowerCase()) || e.target && e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", armsKeys, { capture: true, signal: ctx.signal });

    const tipFor = (hit) => {
      const o = hit.owner;
      if (o.kind === "rack") { const s = STATS[o.index]; return `${DATA.days[o.index].date} · ${plural(s.commits, "commit")} · tap to read the day`; }
      if (o.kind === "stalk") return COARSE ? "Beanstalk · climb down it to go home" : "Beanstalk · walk into the shaft and climb down (S) to go home";
      return "";
    };
    Object.assign(hooks, {
      onHover: (hit, p) => { if (hit) hud.tooltip.show(tipFor(hit), p.x, p.y); else hud.tooltip.hide(); },
      onHoverMove: (hit, p) => hud.tooltip.show(tipFor(hit), p.x, p.y),
      onTap: (hit) => {
        if (!hit) return;
        const o = hit.owner;
        if (o.kind === "rack") openDay(o.index);
        else if (o.kind === "stalk") hud.toast("Climb down the beanstalk to go back to the island");
      },
      ...pilot.hooks
    });
    hud.onAction((action) => {
      if (action === "leave") handOff();
      else if (action === "reset-view") pilot.resetCamera();
      else if (action === "jetpack-toggle") hud.toast("No jetpacks in the archive");
      else if (action.startsWith("mode-")) pilot.modeAction(action);
    });
    const mode = document.getElementById("archive-mode");
    if (mode) mode.textContent = `${DATA.days.length} days · ${DATA.commits} commits`;
    const hint = (stage) => {
      if (stage === hintStage) return;
      hintStage = stage;
      if (stage === "climb") hud.hint(COARSE ? "Push the stick forward to climb the beanstalk" : "W climbs the beanstalk · S climbs down · Space lets go", 6000);
      else if (stage === "floor") hud.hint(COARSE ? "Walk the aisle · tap a shelf to read its day" : "W A S D walk the aisle · click a shelf to read its day · climb down the stalk to leave", 6000);
    };
    hint("climb");

    const update = (dt, elapsed) => {
      pilot.readInput(dt);
      if (people) people.update(dt, elapsed);
      pilot.update(dt);
      keepCameraInside();
      footsteps.update(people && people.player);
      if (avatar && !leaving) {
        const feet = avatar.root.position.y - avatar.baseY, onLadder = !!(avatar.ladder && avatar.ladder.plane);
        if (!climbed && feet > -0.05 && !onLadder) { climbed = true; hint("floor"); }
        if (climbed && feet < -S.depth + 0.05 && !onLadder) {
          if ((atFoot += dt) > EXIT_HOLD) handOff();
        } else atFoot = 0;
      }
      stepTweens(dt);
      fx.update(dt, elapsed);
    };
    const drawExtra = () => {};
    const overlay = (dt) => fx.drawOverlay(dt, drawExtra);
    const onKey = (e) => {
      if (e.key === "0" && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) return pilot.resetCamera();
      if (e.key.toLowerCase() === "x" && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); return pilot.modeAction("mode-toggle"); }
      if (e.key === "Escape") { if (!pilot.escape()) handOff(); return true; }
      return false;
    };
    const onDonation = (donation, counted = null) => {
      game.recordDonation(donation, counted && counted.exact);
      world.level = Math.min(BL.pile.MAX_BANANAS, world.level + (counted ? counted.exact : BL.game.bananasFor(donation.sats)));
      hud.toast(`${donation.handle || "anon"} tipped ${BL.game.formatLarge(donation.sats)} sats · the island's pile grows`);
    };

    shell.root = root;
    shell.camera = camera;
    shell.input = input;
    shell.debug = {
      hud, camera, controls: pilot.controls, pilot, crew: people, cavemen: people ? people.cavemen : null,
      cloudArchive: { layout: L, built, board, openDay, get avatar() { return avatar; }, get climbed() { return climbed; }, exit: handOff }
    };

    const leave = () => {
      if (!leaving) {
        world.pilotDetached = !avatar;
        world.pilot = avatar ? avatar.traits.name : null;
        world.archiveExit = true;
      }
      window.removeEventListener("keydown", armsKeys, true);
      BL.net.setBody(null);
      for (const plaque of plaques) { renderer.releaseGeometry(plaque.geometry); plaque.geometry = null; }
      footsteps.dispose();
      if (people) people.dispose();
      fx.dispose();
      pilot.dispose();
      for (const node of targets) input.remove(node);
      targets.length = 0;
      while (root.children.length) removeChild(root, root.children[root.children.length - 1]);
      const count = input.targetCount;
      input.dispose();
      hud.dispose();
      shell.input = shell.debug = null;
      return { targets: count };
    };
    const liveGeometry = (set) => { if (avatar) set.add(avatar.headOpen).add(avatar.headClosed); };
    const stats = () => {
      let visible = 0;
      traverseVisible(root, () => visible++);
      return { visibleNodes: visible, tweens: tweenCount(), targets: input.targetCount, ...fx.stats() };
    };
    return { update, overlay, onKey, onDonation, stay, leave, liveGeometry, stats, renderOpts: RENDER_OPTS };
  };
  BL.cloudArchiveInterior = { create };
})();
