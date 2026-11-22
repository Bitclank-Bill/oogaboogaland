// Rooms off the Ember Den floor. Door landings and walk limits use the same room coordinates as the art.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const GOLD = "#b8893b", LACQUER = "#191713", IVORY = "#efe6d2", WALNUT = "#3c271e", ICE = "#9cc9e3";
  const ROOMS = [
    { name: "Cypherpunk Lounge", x: -13, z: -43, y: 0, w: 13, d: 11, h: 4.5 },
    { name: "Cold Storage", x: 1, z: -43, y: 0, w: 13, d: 11, h: 5 },
    { name: "21 Club", x: 10, z: -28, y: 17, w: 18, d: 15, h: 6 }
  ];
  // From, to, local x/z of the control, and local x/z where the player arrives. -1 is the main floor.
  const DOORS = [
    [-1, 0, -19.58, -35.87, 0, 3.5, "Whitepaper"],
    [-1, 1, 0, -35.8, 0, 3.5, "Genesis Vault"],
    [-1, 2, 17.4, -34.25, 5.4, -3.4, "Gate 21"],
    [0, -1, 0, 5.1, -19.53, -34.0, "Back to the bar"],
    [1, -1, 0, 5.1, 0, -33, "Back to the hall"],
    [2, -1, 6.4, -4.6, 17.4, -32, "Gaming floor"],
    [0, 0, 2.42, -4.94, 0, 0, "Founders pass"]
  ];
  const mesh = (w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const add = (parent, geometry, x = 0, y = 0, z = 0) => {
    const n = S.createNode({ geometry, position: { x, y, z } }); S.addChild(parent, n); return n;
  };
  const letters = (text, cell, color, x, y, z) => {
    const g = BL.poolModels.carve(text, { cell, color, emissive: 0.5 }); return M.moved(g.geometry, x - g.width / 2, y, z);
  };
  const cache = M.scopedMap();
  const interior = (id, lite) => {
    const key = id + ":" + lite;
    if (cache.has(key)) return cache.get(key);
    const r = ROOMS[id], a = r.w / 2, b = r.d / 2, ice = id === 1, open = id >= 2;
    const trim = ice ? "#7297ae" : GOLD, wall = ice ? "#263c4d" : LACQUER, parts = [], solids = [];
    const slab = (x, y, z, w, h, d, c, glow = 0) => parts.push(mesh(w, h, d, c, x, y, z, glow));
    const solid = (x, z, w, d) => solids.push({ x, z, w: w / 2, d: d / 2 });
    const bevel = (w, h, d, color, x, y, z, radius) => M.bevelBox({ w, h, d, color, bevel: radius, offset: { x, y, z } });
    const rail = (x, y, z, xx, yy, zz, width, color) => parts.push(M.beam(x, y, z, xx, yy, zz, width, color));
    const chair = (x, z, yaw, c) => {
      const seat = M.merge(bevel(0.96, 0.22, 0.88, WALNUT, 0, 0.24, 0, 0.05),
        bevel(0.79, 0.21, 0.69, c, 0, 0.44, 0.07, 0.08), bevel(0.89, 0.8, 0.24, c, 0, 0.71, -0.33, 0.09),
        bevel(0.13, 0.28, 0.7, c, -0.43, 0.54, 0.02, 0.05), bevel(0.13, 0.28, 0.7, c, 0.43, 0.54, 0.02, 0.05),
        mesh(0.73, 0.14, 0.65, trim, 0, 0.1, 0));
      if(ice){
        const tuft=[];
        for(let i=0;i<(lite?5:11);i++){
          const dx=(i/(lite?4:10)-.5)*.7;
          tuft.push(M.beam(dx,.93,-.16,dx*.94,.55+.04*Math.cos(i),-.10,.082,i%3?"#ced8d8":"#a1b6bf"));
        }
        parts.push(M.moved(M.turnedY(M.merge(...tuft),yaw),x,0,z));
      }
      parts.push(M.moved(M.turnedY(seat, yaw), x, 0, z)); solid(x, z, 1.05, 1.05);
    };
    const cylinder = (x, z, profile, c, glow = 0) => parts.push(M.moved(M.lathe({ profile, color: c, segments: lite ? 8 : 16, emissive: glow }), x, 0, z));
    const fire = (x, z, scale) => {
      cylinder(x, z, [[0, 0], [scale, 0], [scale, 0.35], [scale * 0.83, 0.48], [0, 0.48]], wall);
      for (const side of [-1, 1]) {
        rail(x - scale * 0.55, 0.51, z + side * 0.18, x + scale * 0.55, 0.55, z - side * 0.19, 0.14, "#553327");
      }
      for (let k = 0; k < 7; k++) {
        const t = k * 2.4, d = scale * 0.44 * Math.sin(k); cylinder(x + Math.cos(t) * d, z + Math.sin(t) * d,
          [[0, 0.47], [0.22, 0.51], [0.16, 0.78], [0, 0.9 + 0.35 * Math.cos(t)]], k % 2 ? "#e16b26" : "#f7ba55", 0.6);
      }
      solid(x, z, scale * 2, scale * 2);
    };
    slab(0, -0.14, 0, r.w, 0.28, r.d, ice ? "#315267" : "#2b2520");
    if (!ice) for (let k = -1; k <= 1; k += 2) {
      slab(k * (a - 0.32), 0.008, 0, 0.045, 0.012, r.d - 0.6, trim);
      slab(0, 0.008, k * (b - 0.32), r.w - 0.6, 0.012, 0.045, trim);
    }
    if (!open && !ice) {
      slab(0, r.h / 2, -b, r.w, r.h, 0.22, wall);
      // The front wall stands separately so the bar shelf can look into the same room.
      for (const s of [-1, 1]) {
        slab(s * a, r.h / 2, 0, 0.22, r.h, r.d, wall);
        for (let z = -b + 1; z < b; z += 2.1) {
          slab(s * (a - 0.17), r.h / 2, z, 0.14, r.h - 0.2, 0.08, trim);
          slab(s * (a - 0.20), 0.69, z, 0.21, 1.36, 0.18, WALNUT);
        }
      }
      slab(0, r.h + 0.08, 0, r.w, 0.16, r.d, wall);
    } else if (open) {
      // Exposed balcony edge, slim brass posts and two continuous rails looking down to the hall.
      for (const sign of [-1, 1]) for (const y of [0.44, 1]) {
        slab(0, y, sign * b, r.w, 0.075, 0.09, trim); slab(sign * a, y, 0, 0.09, 0.075, r.d, trim);
      }
      for (const sign of [-1, 1]) {
        for (let x = -a; x <= a; x += r.w / 6) slab(x, 0.5, sign * b, 0.09, 1, 0.09, trim);
        for (let z = -b; z < b; z += r.d / 4) slab(sign * a, 0.5, z, 0.09, 1, 0.09, trim);
      }
    }
    if (id === 0) {
      parts.push(BL.pokerSpeakeasy.interior(lite)); solid(0, 0, 3.26, 3.26);
      // Leather reading chairs and a fireplace flanked by shelves and cipher-print panels.
      slab(0, 1.05, -b + 0.34, 3.5, 2.1, 0.6, WALNUT); slab(0, 1, -b + 0.66, 2.22, 1.5, 0.1, LACQUER);
      slab(0, 2.1, -b + 0.45, 3.85, 0.14, 0.84, GOLD); fire(0, -b + 0.95, 0.75);
      // A woven diamond runner and a fluted surround lead the eye to the hearth.
      slab(0, 0.017, 0.15, 3.45, 0.023, 6.8, "#52312d");
      for (const side of [-1, 1]) {
        slab(side * 1.59, 0.034, 0.15, 0.055, 0.012, 6.56, "#be9361");
        for (let i = 0; i < 3; i++) slab(side * (1.22 + i * 0.15), 1.02, -b + 0.69, 0.07, 1.78, 0.08, i === 1 ? GOLD : "#946744");
        for (let z = -2.7; z < 2.9; z += 1.35) {
          rail(0, 0.04, z, side * 0.68, 0.04, z + 0.66, 0.045, "#ad815a");
          rail(side * 0.68, 0.04, z + 0.66, 0, 0.04, z + 1.32, 0.045, "#ad815a");
        }
      }
      for (let i=-2; i<=2; i++) rail(i*.32,.23,-b+1.54,i*.32,.53,-b+1.53,.038,GOLD);
      rail(-.75,.50,-b+1.53,.75,.50,-b+1.53,.038,GOLD);
      for (const s of [-1, 1]) {
        for (const end of [-1, 1]) slab(s * 4.15 + end * 1.72, 1.45, -b + 0.23, 0.14, 2.86, 0.54, WALNUT);
        slab(s * 4.15, 2.9, -b + 0.23, 3.69, 0.16, 0.56, WALNUT);
        for (let row = 0; row < 3; row++) {
          const y = 0.78 + row * 0.65;
          slab(s * 4.15, y, -b + 0.24, 3.4, 0.08, 0.46, GOLD);
          for (let j = 0; j < (lite ? 7 : 13); j++) {
            const h = 0.23 + (j * 7 % 6) * 0.045;
            const x=s*4.15-1.48+j*(lite ? .44 : .235), thick=lite ? .29 : .205;
            slab(x,y+h/2+.04,-b+.26,thick,h,.32,["#835343","#315749","#95724a","#51393a"][(j+row)%4]);
            slab(x,y+.13,-b+.424,thick*.76,.019,.013,GOLD,.25);
          }
        }
        chair(s * 2.18, -0.7, -s * 1.28, s < 0 ? "#644235" : "#463a31");
        chair(s * 1.52, 1.93, -s * 2.52, s < 0 ? "#583437" : "#4b5a44");
      }
      parts.push(M.moved(BL.pokerSpeakeasy.passCase(), DOORS[6][2], 1.70, DOORS[6][3]));
    } else if (ice) {
      // Drawer banks sit in shallow recesses in the far ice. Rime and inset metal catches articulate their faces.
      for (const side of [-1, 1]) {
        const x = side * 3.64, z = -b + 0.13;
        parts.push(bevel(2.82,1.83,0.42,"#1d3545",x,1.29,z,0.09));
        for (let row=0;row<3;row++) for (let col=0;col<3;col++) {
          const dx=x+(col-1)*0.91, y=0.73+row*0.56;
          parts.push(bevel(0.86,0.51,0.14,"#4a6479",dx,y,z+0.23,0.045));
          slab(dx,y+0.045,z+0.32,0.30,0.045,0.075,ICE,0.36);
        }
        solid(x,z,2.83,0.75);
        chair(side*4.15,-0.4,-side*1.55,"#aebfca");
        // Bound the lower arch where it meets a walker's shoulder.
        solid(side*(a-0.22),0,1.6,r.d);
        for (let i=0;i<8;i++) {
          const z=3.3-i*0.94, x=side*(1.22+1.08*Math.exp(-(z*z)/3));
          slab(x,0.017,z,0.12,0.026,0.22,"#ec973c",0.74);
        }
      }
      solid(0,0,3.18,3.18);
    } else {
      parts.push(BL.pokerTerrace.roofBar(lite),BL.pokerClub.roof(lite));
      for (const x of [-7.63,.40]) for (const z of [-6.40,-2.65]) solid(x,z,.52,.52); solid(-3.6, -4.8, 6.6, 1.14);
      for (const x of [-6, -4, -2]) solid(x, -3.62, 0.68, 0.68);
      for (const s of [-1, 1]) { fire(s * 4.3, 1, 0.86); chair(s * 6.3, 1.1, -s * 1.4, "#553e30"); chair(s * 4.3, 3.1, Math.PI, "#553e30"); }
      solid(0,-3,1.25,1.25); solid(0,6.96,5.48,.6);
    }
    const built = { geometry: M.merge(...parts), solids };
    if (ice) {
      built.cavern = BL.pokerIce.cavern(r, lite);
      built.glyph = BL.pokerIce.glyph(lite);
    }
    cache.set(key, built);
    return built;
  };
  const origin = i => i < 0 ? { x: 0, y: 0, z: 0 } : ROOMS[i];
  const build = (lite, vaultDoor, den) => {
    let glyph;
    const root = S.createNode(), solids = [], targets = [], rooms = [];
    ROOMS.forEach((r, i) => {
      const g = interior(i, lite), room = add(root, g.geometry, r.x, r.y, r.z);
      rooms.push(room); solids.push(g.solids);
      if (i === 0) {
        add(room, mesh(r.w, r.h, .22, WALNUT, 0, r.h / 2, r.d / 2));
      }
      if (g.cavern) {
        add(room, g.cavern);
        glyph = add(room, g.glyph, 0, 2.22, 0);
      }
    });
    // A glazed lift shaft at the far right links the two landings visibly from the tables.
    const lift = [], x = 17.4, z = -35.05;
    for (const dx of [-0.78, 0.78]) for (const dz of [-0.72, 0.72])
      lift.push(mesh(0.095, 19.35, 0.095, GOLD, x + dx, 9.675, z + dz));
    for (const y of [0.02, 2.35, 17.02, 19.35])
      lift.push(mesh(1.68, 0.085, 1.55, GOLD, x, y, z));
    const glazing = mesh(1.51, 19.25, 1.38, "#d7ceb9", x, 9.65, z);
    glazing.glassOpacity = 0.055; glazing.glassGrazing = 0.5; glazing.castShadow = false;
    add(root, M.merge(...lift)); add(root, glazing);
    const roof=ROOMS[2], roofScope=BL.pokerTerrace.mount({x:roof.x,y:roof.y+1.62,z:roof.z-3});
    S.addChild(root,roofScope.root);
    const shelf = BL.pokerSpeakeasy.shelf(lite, rooms[0].geometry, DOORS[0][2], DOORS[0][3]);
    S.addChild(root, shelf.root);
    DOORS.forEach(([from, to, x, z, , , label], i) => {
      if (i === 1) { targets.push(vaultDoor); return; }
      if (i === 0) { targets.push(shelf.target); return; }
      const p = origin(from);
      if (i === 6) {
        const card = add(root, BL.pokerSpeakeasy.passCard(), p.x + x, 1.57, p.z + z + .24);
        card.rotation.x = -.16; targets.push(card); return;
      }
      const parts = [mesh(1.9, 0.51, 0.12, LACQUER, 0, 0, 0), mesh(1.94, 0.045, 0.15, GOLD, 0, 0.27, 0),
        letters(label, Math.min(0.072, 0.44 / label.length), IVORY, 0, 0.09, -0.055)];
      const n = add(root, M.merge(...parts), p.x + x, p.y + 1.55, p.z + z);
      if (i === 3 || i === 4) n.rotation.y = Math.PI;
      targets.push(n);
    });
    const sighting=BL.pokerClub.nightWalk(rooms[2]);
    const roofWins=BL.pokerClub.fameWall(rooms[2],0,6.96,Math.PI);
    const gate=targets[2], meter=add(gate,mesh(1.92,.26,.13,LACQUER,0,-.42,0));
    const gateProgress=BL.pokerClub.line(meter,0,-.44,1.74,16,.075);
    let gateText="";
    const refreshGate=()=>{
      const text=den.bigWin||den.visits>=21?"CLUB OPEN":den.visits+"/21 VISITS";
      if(gateText!==text){gateProgress(text);gateText=text;}
    };
    // The two closed rooms have opaque walls behind the bar. The rooftop is visible from outside.
    const show = id => {
      refreshGate();
      for (let i = 0; i < 2; i++) rooms[i].visible = i === id;
      for (let i = 0; i < targets.length; i++) targets[i].visible = DOORS[i][0] === id && (i !== 6 || !den.pass);
    };
    show(-1);
    return { root, solids, targets, glyph, shelf, roofScope, roofWins, sighting, refreshGate, show };
  };
  // Test the whole walking segment against furniture expanded by the visitor's body radius.
  const clear = (set, r, ax, az, bx, bz, radius) => {
    ax -= r.x; az -= r.z; bx -= r.x; bz -= r.z;
    if (Math.abs(bx) > r.w / 2 - radius - 0.14 || Math.abs(bz) > r.d / 2 - radius - 0.14) return false;
    for (const f of set) {
      const dx = bx - ax, dz = bz - az, w = f.w + radius, d = f.d + radius;
      if (Math.max(ax, bx) <= f.x - w || Math.min(ax, bx) >= f.x + w || Math.max(az, bz) <= f.z - d || Math.min(az, bz) >= f.z + d) continue;
      if (Math.abs(dx * (az - f.z) - dz * (ax - f.x)) < Math.abs(dx) * d + Math.abs(dz) * w || !dx && !dz) return false;
    }
    return true;
  };
  BL.pokerSalons = Object.freeze({ ROOMS, DOORS, build, clear });
})();
