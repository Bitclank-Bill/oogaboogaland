// Each channel owns one texture shared by its permanent screens. Capture work stays capped at one
// visible feed per frame. Source factories make camera representations, never interactive scenes.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const create = ({ renderer, mouths, places }) => {
    const channels = [], feeds = [], sources = new Map(), meshes = new Set();
    const debug = new URLSearchParams(location.search).get("debug") === "1";
    let prepared = false, active = false;
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
    const quad = (width, height, surface) => ({ verts: [-width / 2, -height / 2, 0, width / 2, -height / 2, 0, width / 2, height / 2, 0, -width / 2, height / 2, 0],
      faces: [{ i: [0, 1, 2, 3], color: [255, 255, 255], emissive: 1 }], lines: [], castShadow: false, architectRoom: true, imageSurface: surface });
    const paint = (feed) => {
      const surface = feed.label.imageSurface, canvas = surface.canvas, ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0c1718"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#b7d4c5"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left";
      ctx.fillText(String(channels.indexOf(feed.channel) + 1).padStart(2, "0") + " / " + feed.channel.label, 8, 23);
      surface.version++;
    };
    const syncSources = () => {
      for (const [id, source] of sources) {
        if (!active) { source.dispose(); sources.delete(id); }
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
      for (let i = 0; i < channels.length; i++) {
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
  BL.observatoryCameras = { create };
})();
