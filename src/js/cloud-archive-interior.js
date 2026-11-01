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
  // The TV changes channel every CHANNEL_SECONDS, through STATIC_SECONDS of snow. A chair is sat in from within
  // SIT_REACH of its edge, facing it; the sitter sits SEAT_Y up and stands up SEAT_BACK behind it.
  const CHANNEL_SECONDS = 9, STATIC_SECONDS = 0.25, TV_W = 480, TV_H = 360, SIT_REACH = 0.5, SIT_FACING = Math.cos(0.8), SEAT_Y = 0.5, SEAT_BACK = 1.1;
  const ARRIVAL_PITCH = -0.35, EXIT_HOLD = 0.35, BOARD_W = 960, BOARD_H = 600, PLAQUE_W = 512, PLAQUE_H = 128;
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
      if (!(bx > B.x0 && bx < B.x1 && bz > B.z0 && bz < B.z1 && clearOfRacks(bx, bz, r))) return false;
      for (const o of L.solids) if (Math.hypot(bx - o.x, bz - o.z) < o.r + r) return false;
      return true;
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
      // Below the floor the eye stays in the shaft while what it follows is down there too, pulled in toward the stalk
      // rather than lifted onto the floor; otherwise (the Ooga up on the floor) it is lifted out.
      if (p.y < 0.3 && camera.target.y > 0) p.y = 0.3;
      else if (p.y < 0.3) {
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

    // The TV: the island's pictures from the climb (`world.archiveViews`), one at a time, changing channel through a
    // moment of snow; with none (a page that opened here), a test card. Painted only when the channel changes.
    const views = world.archiveViews && world.archiveViews.length ? world.archiveViews : [];
    const tvCanvas = document.createElement("canvas");
    tvCanvas.width = TV_W; tvCanvas.height = TV_H;
    const tvGeometry = CM.plaque(tvCanvas, L.TV.screenW, L.TV.screenH);
    built.screen.geometry = tvGeometry;
    const tv = { channel: 0, wait: CHANNEL_SECONDS, snow: 0, version: 0 };
    let snowSeed = 1;
    const paintTv = () => {
      const g = tvCanvas.getContext("2d");
      if (tv.snow > 0) {
        const image = g.createImageData(TV_W / 4, TV_H / 4), d = image.data;
        for (let i = 0; i < d.length; i += 4) { snowSeed = (Math.imul(snowSeed, 1103515245) + 12345) | 0; d[i] = d[i + 1] = d[i + 2] = (snowSeed >>> 24); d[i + 3] = 255; }
        g.imageSmoothingEnabled = false;
        g.putImageData(image, 0, 0);
        g.drawImage(tvCanvas, 0, 0, TV_W / 4, TV_H / 4, 0, 0, TV_W, TV_H);
      } else if (views.length) {
        const v = views[tv.channel];
        g.drawImage(v.canvas, 0, 0, TV_W, TV_H);
        g.fillStyle = "rgba(0,0,0,0.12)";
        for (let y = 0; y < TV_H; y += 3) g.fillRect(0, y, TV_W, 1);
        g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(0, TV_H - 44, TV_W, 44);
        g.fillStyle = "#ffffff"; g.font = `700 22px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle";
        g.fillText(`ISLAND CAM · ${v.label.toUpperCase()}`, 14, TV_H - 22);
        g.fillStyle = "#e8b04a"; g.textAlign = "right"; g.fillText(`${tv.channel + 1}/${views.length}`, TV_W - 14, TV_H - 22);
      } else {
        const bars = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
        bars.forEach((c, i) => { g.fillStyle = c; g.fillRect(i * TV_W / 7, 0, TV_W / 7 + 1, TV_H); });
        g.fillStyle = "rgba(0,0,0,0.7)"; g.fillRect(0, TV_H / 2 - 40, TV_W, 80);
        g.fillStyle = "#ffffff"; g.font = `700 26px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("NO SIGNAL", TV_W / 2, TV_H / 2 - 12);
        g.font = `500 16px ${FONT}`; g.fillText("Climb the beanstalk from the island to tune in", TV_W / 2, TV_H / 2 + 18);
      }
      tvGeometry.imageSurface.version++;
      tv.version++;
    };
    paintTv();
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tune = (channel) => {
      if (!views.length) return;
      tv.channel = (channel + views.length) % views.length;
      tv.wait = CHANNEL_SECONDS;
      tv.snow = REDUCED.matches ? 0 : STATIC_SECONDS;
      paintTv();
    };
    const updateTv = (dt) => {
      if (!views.length) return;
      if (tv.snow > 0 && (tv.snow -= dt) <= 0) { tv.snow = 0; paintTv(); }
      if ((tv.wait -= dt) <= 0) tune(tv.channel + 1);
    };
    const tvBoard = {
      title: "Island cam", help: "The island as it looked on your way up. Arrow keys change channel.", wide: true,
      get canvas() { return views.length ? views[tv.channel].canvas : tvCanvas; }, get count() { return Math.max(1, views.length); }, get index() { return views.length ? tv.channel : 0; },
      get caption() { return views.length ? views[tv.channel].label : "No signal"; },
      get note() { return views.length ? "Pictures taken as you climbed the beanstalk. A live feed is planned." : "No pictures yet: climb the beanstalk from the island and the TV tunes in to it."; },
      get version() { return tv.version; },
      go: (i) => tune(i)
    };
    target(built.tv, { kind: "tv" }, 0.6);
    target(built.screen, { kind: "tv" }, 0.4);
    // The two armchairs, each a seat facing the TV; standing up leaves it behind the chair.
    const seats = L.CHAIRS.map((c) => ({ kind: "chair", x: c.x, y: SEAT_Y, z: c.z, floor: 0, ry: c.ry, sitter: null,
      walkAt: { x: c.x - Math.sin(c.ry) * SEAT_BACK, z: c.z - Math.cos(c.ry) * SEAT_BACK } }));
    built.chairs.forEach((node, i) => target(node, { kind: "chair", index: i }, 0.7));

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
    // A free chair within reach, the view facing it, the Ooga on the floor.
    const nearChair = () => {
      if (!avatar || avatar.camp.seat || avatar.hop > 0 || avatar.root.position.y - avatar.baseY > 0.1) return null;
      const p = avatar.root.position, c = camera.position, t = camera.target, fx = t.x - c.x, fz = t.z - c.z, f = Math.hypot(fx, fz) || 1;
      let near = null, best = 0.5 + avatar.bodyRadius + SIT_REACH;
      for (const s of seats) {
        const dx = s.x - p.x, dz = s.z - p.z, d = Math.hypot(dx, dz);
        if (!s.sitter && d < best && (dx * fx + dz * fz) / (d * f) > SIT_FACING) { near = s; best = d; }
      }
      return near;
    };
    // Into the chair, the view turned to the TV.
    const sit = (seat) => {
      if (!people.sitPlayer(seat)) return false;
      // Watching: through the sitter's own eyes, turned to the screen (from behind, the sitter's head hides it). The
      // pilot enters first person along the view on screen, so the eye is first aimed at the TV from the seat.
      const eye = avatar.root.position.y + avatar.headOffset, tx = L.TV.x, ty = L.TV.table + L.TV.h / 2, tz = L.TV.z + L.TV.d / 2;
      const dx = tx - seat.x, dy = ty - eye, dz = tz - seat.z;
      if (pilot.mode !== "first-person") {
        camera.position.x = seat.x; camera.position.y = eye; camera.position.z = seat.z;
        camera.target.x = tx; camera.target.y = ty; camera.target.z = tz;
        pilot.enterClose();
      } else {
        const o = pilot.orbit;
        o.yaw = o.tYaw = Math.atan2(-dx, -dz);
        o.pitch = o.tPitch = Math.atan2(-dy, Math.hypot(dx, dz));
      }
      return true;
    };
    const playerWorld = { level: 0, weapons: new Map(), magazine: { owned: false, count: 0, ammo: 0, carrier: null } };
    let people = null, avatar = null;
    const NO_ACTORS = [];
    if (playerName) {
      const sharedCtx = { root, input, hud, game, world: playerWorld, playerName, fx, viewYaw: 0, outsideActors: () => NO_ACTORS, outsideActorHeight: BL.remotePlayers.BODY_HEIGHT,
        groundAt, walkable, ladders: [L.LADDER], useNear: () => { const chair = nearChair(); return !!chair && sit(chair); }, jetpackAllowed: () => false };
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
    // View assist: the Ooga's outline over the racks, the floor (from above, into the shaft) and the lounge's furniture.
    const solidAt = (x, y, z) => {
      if (y < 0) return !L.inShaft(x, z);
      if (y < RACK.h) for (let i = 0; i < built.racks.length; i++) {
        const q = built.racks[i].position;
        if (Math.abs(x - q.x) < RACK.d / 2 && Math.abs(z - q.z) < RACK.w / 2) return true;
      }
      if (y < 1.1) for (let i = 0; i < L.solids.length; i++) { const o = L.solids[i]; if (Math.hypot(x - o.x, z - o.z) < o.r - 0.1) return true; }
      return false;
    };
    const assist = BL.viewAssist.create({ overlay: ctx.overlay, solidAt });

    // Up and back down: `climbed` once the Ooga has stood on the floor; after that, standing at the shaft's foot a
    // moment takes it home.
    let climbed = false, atFoot = 0, leaving = false, hintStage = null, actNear = null;
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
      if (o.kind === "tv") return views.length ? `Island cam · ${views[tv.channel].label} · tap to watch` : "A little TV · no signal yet";
      if (o.kind === "chair") return COARSE ? "Leather armchair · tap SIT beside it" : "Leather armchair · Space beside it sits";
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
        else if (o.kind === "tv") { tv.version++; hud.openBoard(tvBoard); }
        else if (o.kind === "chair") {
          const seat = seats[o.index];
          if (seat.sitter || nearChair() !== seat || !sit(seat)) hud.toast(COARSE ? "Walk up to a free chair, then tap SIT" : "Walk up to a free chair and press Space to sit");
        }
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
      if (stage === "climb") hud.hint(COARSE ? "Walk into the beanstalk and push the stick forward to climb" : "Walk into the beanstalk and hold W to climb · S climbs down", 9000);
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
        // On the stalk a first-person eye is pressed to the shaft's wall: step back to the trailing view for the climb.
        if (onLadder && pilot.mode === "first-person") pilot.exitClose(false);
        if (!climbed && feet > -0.05 && !onLadder) { climbed = true; hint("floor"); }
        if (climbed && feet < -S.depth + 0.05 && !onLadder) {
          if ((atFoot += dt) > EXIT_HOLD) handOff();
        } else atFoot = 0;
      }
      if (avatar && climbed) {
        const near = avatar.camp.seat ? "stand" : nearChair() ? "sit" : null;
        if (near !== actNear) {
          actNear = near;
          if (near === "sit") { hud.setAct("SIT"); hud.hint(COARSE ? "Tap SIT to take the chair" : "Space · Sit"); }
          else if (near === "stand") { hud.setAct("STAND UP!"); hud.hint(COARSE ? "Move or tap STAND UP! to get up" : "Move or press Space to stand up"); }
          else pilot.showAct();
        }
      }
      updateTv(dt);
      stepTweens(dt);
      fx.update(dt, elapsed);
    };
    const drawExtra = () => {};
    const overlay = (dt) => {
      fx.drawOverlay(dt, drawExtra);
      assist.update(camera, people && people.player, dt, pilot.closeMix);
    };
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
      cloudArchive: { layout: L, built, board, openDay, tv, tvBoard, seats, views, assist: assist.state, get avatar() { return avatar; }, get climbed() { return climbed; }, exit: handOff }
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
      renderer.releaseGeometry(tvGeometry); built.screen.geometry = null;
      footsteps.dispose();
      assist.dispose();
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
