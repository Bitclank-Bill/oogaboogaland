// Twenty-four shared texture slots; one slot changes area periodically. Capture work stays capped
// at one visible feed per frame. Source factories make camera representations, never interactive scenes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const SLOTS = 24, SWITCH_SECONDS = 15;
  const create = ({ renderer, mouths, places }) => {
    const channels = [], feeds = [], sources = new Map(), meshes = new Set();
    const debug = new URLSearchParams(location.search).get("debug") === "1";
    let prepared = false, active = false, switchIn = SWITCH_SECONDS, turn = 0, next = SLOTS;
    const channel = (id, label, eye, target, far, fov = 46, build = null) => {
      const camera = BL.scene.createCamera({ fov, near: 0.5, far });
      Object.assign(camera.position, eye); Object.assign(camera.target, target);
      channels.push({ id, label, camera, build });
    };
    const at = (p, x, y, z) => ({ x: p.x + x, y: p.y + y, z: p.z + z });
    channel("pile", "BANANA PILE", { x: 5, y: 4, z: 7 }, { x: 0, y: 0.8, z: 0 }, 22, 38);
    channel("rainforest", "MEMPOOL LAKE", at(places.pool, 0, 11, 4), at(places.pool, 0, -1.5, 0), 28, 60);
    channel("repos", "MERGE ROCK", at(places.repos, 8, 9, -13), at(places.repos, 0, 2, 0), 35, 56);
    channel("bifrost.chamber", "BIFROST CHAMBER", { x: 0, y: 4.2, z: 11.5 }, { x: 0, y: 3.2, z: -2 }, 40, 62,
      () => BL.observatoryBifrost.create(renderer));
    for (const [id, label] of [["c10", "B.C.A."], ["c3", "OOGA ARCADE"], ["c2", "LIGHTNING FACTORY"], ["c11", "ENTROPYLAB"], ["c1", "MIRROR ENTRANCE"]]) {
      const m = mouths.find(mouth => mouth.id === id);
      if (!m) continue;
      const sr = Math.sin(m.ry), cr = Math.cos(m.ry);
      channel(id, label, { x: m.x + sr * 13 + cr * 4, y: m.floorY + 6, z: m.z + cr * 13 - sr * 4 },
        { x: m.x, y: m.floorY + 1.5, z: m.z }, 32);
    }
    channel("sphere", "TIMECHAIN SPHERE", at(places.sphere, 20, 17, 30), at(places.sphere, 0, 3, 0), 65, 55);
    if (places.bifrost) channel("bifrost", "BIFROST ISLET", at(places.bifrost, 8, 7, 14), at(places.bifrost, 0, 3, 0), 40, 55);
    for (const id of BL.timechainRooms.OPEN) {
      const room = BL.timechainRooms.get(id);
      if (room.lockable) continue;
      const L = BL.timechainRooms.layout(id);
      channel(room.zone, "TCS / " + room.name.toUpperCase(), { x: L.R * 0.12, y: 3.5, z: L.doorZ - 2 },
        { x: 0, y: L.yMin + 1.2, z: -L.R * 0.2 }, L.R * 2.5, 68, () => BL.observatoryTimechain.create(renderer, id));
    }
    const local = (m, x, y, z) => ({ x: m.x + x * Math.cos(m.ry) + z * Math.sin(m.ry),
      y: (m.floorY ?? m.y ?? m.floor) + y, z: m.z - x * Math.sin(m.ry) + z * Math.cos(m.ry) });
    for (const [mouth, id, label, depth] of [["c10", "bca-office", "B.C.A. OFFICE", 4.7], ["c11", "lab-floor", "ENTROPYLAB FLOOR", 7]]) {
      const m = mouths.find(m => m.id === mouth);
      if (m) channel(id, label, local(m, 0.8, 2.8, -1), local(m, 0, 1, -depth), 18, 68);
    }
    channel("hq", "HEADQUARTERS", { x: 4, y: places.hq.floor + 2.5, z: 8 }, { x: 0, y: places.hq.floor + 1, z: 0 }, 32, 68);
    channel("hq-basement", "HQ BASEMENT", { x: 4, y: places.hq.basement.floor + 2.5, z: 8 }, { x: 0, y: places.hq.basement.floor + 1, z: 0 }, 30, 68);
    const poolFloor = BL.poolLayout.FLOOR;
    channel("rainforest-under", "MEMPOOL CHAMBER", local(places.pool, 0, poolFloor + 2.5, 5), local(places.pool, 0, poolFloor + 1.5, 11), 22, 68);
    channel("library", "LIBRARY NOOK", local(places.library, 0, 2.5, 5), local(places.library, 0, 1.3, 0), 16, 58);
    channel("hq-gallery", "HQ WINDOW GALLERY", { x: -6, y: places.hq.floor + 2, z: -17 }, { x: 5, y: places.hq.floor + 1, z: -22 }, 25, 65);
    channel("north-pass", "NORTH PASS", { x: places.gate.x + 3, y: 7, z: places.gate.z + 10 }, { x: places.gate.x, y: 3, z: places.gate.z }, 32, 60);
    const quad = (width, height, surface) => ({ verts: [-width / 2, -height / 2, 0, width / 2, -height / 2, 0, width / 2, height / 2, 0, -width / 2, height / 2, 0],
      faces: [{ i: [0, 1, 2, 3], color: [255, 255, 255], emissive: 1 }], lines: [], castShadow: false, architectRoom: true, imageSurface: surface });
    const paint = (feed) => {
      const surface = feed.label.imageSurface, canvas = surface.canvas, ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0c1718"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#b7d4c5"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left";
      ctx.fillText(String(channels.indexOf(feed.channel) + 1).padStart(2, "0") + " / " + feed.channel.label, 8, 23, canvas.width - 16);
      surface.version++;
    };
    const selected = (id) => { for (const feed of feeds) if (feed.channel.id === id) return true; return false; };
    const select = (feed, choice) => {
      feed.channel = choice; feed.camera = choice.camera; feed.source = null; feed.last = -Infinity;
      feed.pending = true; feed.heaviest = null; feed.geometry.imageSurface.version++; paint(feed);
    };
    const syncSources = () => {
      for (const [id, source] of sources) {
        if (!active || !selected(id)) { source.dispose(); sources.delete(id); }
      }
      for (const feed of feeds) {
        feed.source = null;
        if (!active || !feed.channel.build || renderer.kind !== "webgl2") continue;
        let source = sources.get(feed.channel.id);
        if (!source) {
          source = feed.channel.build(); sources.set(feed.channel.id, source);
          renderer.prepareScene(source.meshes);
          for (const geometry of source.meshes) renderer.prepareGeometry(geometry);
        }
        feed.source = source;
      }
    };
    const prepare = () => {
      if (prepared) return; prepared = true;
      for (let i = 0; i < Math.min(SLOTS, channels.length); i++) {
        const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 144;
        const ctx = canvas.getContext("2d"); ctx.fillStyle = "#122326"; ctx.fillRect(0, 0, 256, 144);
        ctx.fillStyle = "#aac8bd"; ctx.font = "16px monospace"; ctx.textAlign = "center";
        ctx.fillText(renderer.kind === "webgl2" ? "CONNECTING" : "CAMERA OFFLINE", 128, 70);
        const geometry = quad(3.08, 1.72, { canvas, version: 0, rect: [-1.54, -0.86, 3.08, 1.72], smooth: true });
        const labelCanvas = document.createElement("canvas"); labelCanvas.width = 384; labelCanvas.height = 32;
        const label = quad(3.08, 0.25, { canvas: labelCanvas, version: 0, rect: [-1.54, -0.125, 3.08, 0.25], smooth: true });
        const feed = { geometry, label, camera: channels[i].camera, channel: channels[i], source: null, pending: true, visible: true,
          captures: 0, last: -Infinity, draws: 0, triangles: 0, profile: debug };
        geometry.imageSurface.feed = feed; meshes.add(geometry); meshes.add(label); feeds.push(feed); paint(feed);
      }
    };
    const setActive = (on) => {
      if (active === on) return;
      active = on;
      if (on) prepare();
      syncSources();
    };
    const update = (dt) => {
      if (!active || document.hidden) return;
      if (channels.length > feeds.length) {
        switchIn -= dt;
        if (switchIn <= 0) {
          switchIn = SWITCH_SECONDS;
          // Rotate every slot fairly, including those behind the viewer. Their captures stay idle.
          // A pending image cannot show the old area underneath the replacement area's label.
          let choice;
          do { choice = channels[next++ % channels.length]; } while (selected(choice.id));
          select(feeds[turn++ % feeds.length], choice); syncSources();
        }
      }
      for (const feed of feeds) if (feed.source && feed.visible) feed.source.update(dt);
    };
    return { feeds, channels, prepare, setActive, update,
      observes(id) {
        if (active) for (const feed of feeds) if (feed.visible && feed.channel.id === id) return true;
        return false;
      },
      near(x, y, z, radius2) {
        if (!active) return false;
        for (const f of feeds) if (f.visible && !f.channel.build) {
          const p = f.camera.target;
          if ((p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2 < radius2) return true;
        }
        return false;
      },
      liveGeometry(set) { for (const g of meshes) set.add(g); for (const source of sources.values()) for (const g of source.meshes) set.add(g); },
      dispose() { setActive(false); for (const g of meshes) renderer.releaseGeometry(g); feeds.length = 0; meshes.clear(); }
    };
  };
  BL.observatoryCameras = { create, SLOTS, SWITCH_SECONDS };
})();
