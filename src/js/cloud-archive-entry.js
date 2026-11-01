// The Cloud Archive's way in, on the island: one cloud that never drifts, high over the west meadow and edged in a faint
// gold, and the beanstalk it hides. A round from the visitor's own Ooga (in practice from a jetpack, since the cloud
// hangs half a tank up) makes it flash and grows the stalk from the meadow to it; Space at the stalk's foot climbs
// into the archive (scene-cloudarchive.js). The hub builds this only while that scene is registered (WIP: ?wip=
// cloudarchive), hands it shots through `hit` and Space through `nearFoot`/`action`, and disposes it with the visit.
// The reveal lasts the page (`world.archiveRevealed`), so the way back down finds the stalk standing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild, removeChild } = BL.scene;
  const { tube, box, merge, cached, turnedY, moved } = BL.models;
  const { clamp, mulberry32 } = BL.math;
  const HEIGHT = 26, GROW_SECONDS = 3.2, FOOT_REACH = 1.5, STALK_R = 0.32;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
  // A beanstalk `height` tall from y = 0: a gently winding tube, thick at the foot, with `leaves` broad leaves up it,
  // from `leafFrom` of the way up (the archive's shaft keeps its stretch bare, so the climb's view stays open).
  const stalkGeometry = (height, radius, leaves, leafFrom = 0) => {
    const wind = (t) => ({ x: Math.sin(t * 7) * radius * 0.9, y: t * height, z: Math.cos(t * 5) * radius * 0.6 });
    const parts = [tube({ path: wind, radius: (t) => radius * (1.15 - t * 0.45), rings: Math.max(8, Math.round(height * 1.5)), segments: 7,
      colorFn: (t) => (Math.floor(t * height * 2) % 2 ? "#4f9a38" : "#5aa940") })];
    const rand = mulberry32(1729 + Math.round(height * 10));
    for (let i = 0; i < leaves; i++) {
      const t = leafFrom + (1 - leafFrom) * (i + 0.6) / (leaves + 0.4), at = wind(t), a = rand() * Math.PI * 2, size = radius * (2.6 + rand() * 1.4);
      const leaf = merge(box({ w: size, h: 0.04, d: size * 0.55, color: "#6cc04a", offset: { x: radius + size / 2 } }),
        box({ w: size * 0.5, h: 0.05, d: size * 0.3, color: "#58a83c", offset: { x: radius + size * 0.95 } }));
      parts.push(moved(turnedY(leaf, a), at.x, at.y, at.z));
    }
    const geo = merge(...parts);
    geo.castShadow = false;
    return geo;
  };
  const stalk = cached(() => stalkGeometry(HEIGHT, STALK_R, 16));
  // A soft gold rim round the marked cloud: a flat ring the cloud's base sits in, lit a little.
  const halo = cached(() => {
    const geo = BL.models.ring({ r: 3.4, thickness: 0.12, segments: 24, color: "#ffd77a", emissive: 0.9 });
    geo.castShadow = false;
    return geo;
  });
  // Where the foot goes: the first meadow spot clear of paths and anything already placed, from a fixed list, so the
  // stalk stands in the same place on every visit.
  const SPOTS = [[-9, 5], [-7, -8], [9, 8], [-11, 2], [6, -9]];
  // What the archive's TV shows: the island seen from a few of its places, drawn once each on the way up (one a frame
  // while the view moves in, through the hub's `renderView`) and handed over as `world.archiveViews`. The banana pit
  // first; then whichever of these mouths and the north gate the island has.
  const MOUTH_VIEWS = [["c2", "Lightning Factory"], ["c3", "Ooga Arcade"], ["c11", "EntropyLab"]];
  const VIEW_W = 480, VIEW_H = 360;
  const shotList = (island, foot) => {
    const list = [{ label: "Banana pit", from: [0, 5.5, 9.5], at: [0, 0.6, 0] }];
    for (const [id, label] of MOUTH_VIEWS) {
      const m = island.mouths.find((mouth) => mouth.id === id);
      if (m) list.push({ label, from: [m.x + Math.sin(m.ry) * 11, m.floorY + 4.5, m.z + Math.cos(m.ry) * 11], at: [m.x, m.floorY + 2, m.z] });
    }
    if (island.gate) list.push({ label: "North gate", from: [island.gate.x, 6, island.gate.z + 14], at: [island.gate.x, 3, island.gate.z] });
    list.push({ label: "The beanstalk", from: [foot.x + 9, foot.y + 4, foot.z + 9], at: [foot.x, foot.y + 9, foot.z] });
    return list;
  };
  const create = ({ root, island, world, free, nearPath, addTarget, removeTarget, hud, renderView = null, canvas = null }) => {
    let foot = null;
    for (const [x, z] of SPOTS) if (island.onLand(x, z) && !nearPath(x, z, 1.6) && free(x, z, 1.4)) { foot = { x, z }; break; }
    if (!foot) foot = { x: SPOTS[0][0], z: SPOTS[0][1] };
    foot.y = island.surfaceAt(foot.x, foot.z);
    const group = createNode({ sightHidden: true });
    const cloud = createNode({ geometry: BL.hubModels.cloud(1), position: { x: foot.x, y: foot.y + HEIGHT + 0.6, z: foot.z }, scale: { x: 1.6, y: 1.6, z: 1.6 }, matrixCloud: true, sightHidden: true });
    const rim = createNode({ geometry: halo(), position: { x: foot.x, y: foot.y + HEIGHT + 0.2, z: foot.z }, sightHidden: true });
    const plant = createNode({ geometry: stalk(), position: { x: foot.x, y: foot.y, z: foot.z }, scale: { x: 1, y: 0.001, z: 1 }, visible: false, sightHidden: true });
    addChild(root, group); addChild(group, cloud); addChild(group, rim); addChild(group, plant);
    const cloudOwner = { kind: "archivecloud" }, stalkOwner = { kind: "beanstalk" };
    addTarget(cloud, cloudOwner, { radius: 3.6 });
    let grow = world.archiveRevealed ? 1 : 0, growing = false, flash = 0, stalkTarget = false, disposed = false;
    const showStalk = () => {
      plant.visible = grow > 0;
      plant.scale.y = Math.max(0.001, grow);
      if (grow >= 1 && !stalkTarget) { addTarget(plant, stalkOwner, { radius: 1.2 }); stalkTarget = true; }
    };
    showStalk();
    const action = { kind: "beanstalk" };
    // The TV's pictures: queued when the climb starts, one drawn and copied a frame.
    const shot = BL.scene.createCamera({ fov: 55, near: 0.2, far: 400 });
    let shots = null;
    const takeShot = () => {
      const s = shots.shift();
      shot.position.x = s.from[0]; shot.position.y = s.from[1]; shot.position.z = s.from[2];
      shot.target.x = s.at[0]; shot.target.y = s.at[1]; shot.target.z = s.at[2];
      if (!canvas || !canvas.width || !renderView(shot)) return;
      // The frame just drawn, cropped to the TV's 4:3 from the middle of the page's canvas.
      const out = document.createElement("canvas"), g = out.getContext("2d");
      out.width = VIEW_W; out.height = VIEW_H;
      const cw = Math.min(canvas.width, canvas.height * 4 / 3), ch = cw * 3 / 4;
      g.imageSmoothingQuality = "high";
      g.drawImage(canvas, (canvas.width - cw) / 2, (canvas.height - ch) / 2, cw, ch, 0, 0, VIEW_W, VIEW_H);
      world.archiveViews.push({ canvas: out, label: s.label, at: Date.now() });
    };
    return {
      action, foot,
      get revealed() { return grow >= 1; },
      // The view the hub's enterScene moves in on: up the stalk from its foot.
      view: { target: { x: foot.x, y: foot.y + 3, z: foot.z }, yaw: 0, pitch: 0.5 },
      // Space at the foot: the island's pictures for the TV start now, while the view moves in.
      climb: () => {
        if (!renderView) return;
        world.archiveViews = [];
        shots = shotList(island, foot);
      },
      tip: (owner) => owner.kind === "archivecloud" ? (grow > 0 ? "A cloud with something in it" : "A cloud that doesn't drift · something's in it")
        : owner.kind === "beanstalk" ? "Beanstalk · Space at its foot to climb" : null,
      isTarget: (owner) => owner === cloudOwner,
      // A weapon landed on the cloud: only the visitor's own shot or swing wakes it, once.
      hit: (byPlayer) => {
        if (disposed || !byPlayer || grow > 0 || growing) return;
        growing = true; flash = 1;
        world.archiveRevealed = true;
        if (REDUCED.matches) { grow = 1; growing = false; showStalk(); }
        hud.toast("The cloud shudders · something is growing below");
      },
      nearFoot: (x, y, z) => grow >= 1 && Math.hypot(x - foot.x, z - foot.z) < FOOT_REACH + STALK_R && Math.abs(y - foot.y - 1.1) < 1.6,
      update: (dt, elapsed) => {
        if (shots && shots.length) takeShot();
        if (growing) {
          grow = Math.min(1, grow + dt / GROW_SECONDS);
          if (grow >= 1) { growing = false; hud.toast("A beanstalk · Space at its foot to climb"); }
          showStalk();
        }
        flash = Math.max(0, flash - dt * 1.5);
        const pulse = REDUCED.matches ? 0 : Math.sin(elapsed * 1.3) * 0.04;
        const s = 1.6 + pulse + flash * 0.25;
        cloud.scale.x = cloud.scale.y = cloud.scale.z = s;
        rim.scale.x = rim.scale.z = clamp(1 + pulse * 2 + flash * 0.4, 0.5, 2);
      },
      liveGeometry: (set) => { set.add(stalk()).add(halo()); },
      dispose: () => {
        if (disposed) return;
        disposed = true;
        removeTarget(cloud);
        if (stalkTarget) removeTarget(plant);
        removeChild(root, group);
      }
    };
  };
  BL.cloudArchiveEntry = { create, stalkGeometry, HEIGHT };
})();
