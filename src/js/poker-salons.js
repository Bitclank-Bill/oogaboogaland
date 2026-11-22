// Rooms off the Ember Den floor. Door landings and walk limits use the same room coordinates as the art.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const GOLD = "#b8893b", LACQUER = "#191713", IVORY = "#efe6d2", WALNUT = "#3c271e", ICE = "#9cc9e3";
  const ROOMS = [
    { name: "Cypherpunk Lounge", x: -BL.pokerGlazing.BOOK_X, z: -48.1, y: 0, w: 16.25, d: 17.6, h: 4.5 },
    { name: "Cold Storage", x: 1, z: -43, y: 0, w: 13, d: 11, h: 5 },
    { name: "21 Club", x: 10, z: -28, y: 17, w: 18, d: 15, h: 6 }
  ];
  // From, to, local x/z of the control, and local x/z where the player arrives. -1 is the main floor.
  const DOORS = [
    [-1, 0, ROOMS[0].x, -35.87, 0, 3.5, "Whitepaper"],
    [-1, 1, 0, -35.8, 0, 3.5, "Genesis Vault"],
    [-1, 2, 17.4, -34.25, 5.4, -3.4, "Gate 21"],
    [0, -1, 0, 5.1, -19.53, -34.0, "Back to the bar"],
    [1, -1, 0, 5.1, 0, -33, "Back to the hall"],
    [2, -1, 6.4, -4.6, 17.4, -32, "Gaming floor"],
    [0, 0, 2.42, -8.24, 0, 0, "Founders pass"]
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
    const seats=[];
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
      if(id===0){
        const piping=[];
        for(const s of [-1,1]) piping.push(M.beam(s*.42,.69,-.22,s*.42,.69,.30,.026,"#bb896a"));
        for(let col=-2;col<=2;col++){
          piping.push(mesh(.015,.55,.025,"#35252a",col*.143,.78,-.196));
          for(const y of [.7,.89]) piping.push(mesh(.031,.031,.024,"#a77959",col*.143,y,-.18));
        }
        seats.push({x,z,yaw,geometry:M.merge(seat,...piping)});
      }else parts.push(M.moved(M.turnedY(seat, yaw), x, 0, z));
      solid(x, z, 1.05, 1.05);
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
      const throat=DOORS[0][3]-(r.z+b), half=1.04;
      for(const side of [-1,1]){
        slab(side*(a+half)/2,r.h/2,b,a-half,r.h,.24,WALNUT);
        slab(side*(half+.08),1.43,b+throat/2,.16,2.86,throat,WALNUT);
        for(let j=0;j<4;j++) slab(side*half,1.4,b+j*.85,.055,2.75,.08,"#916241");
      }
      slab(0,(r.h+2.7)/2,b,2*half,r.h-2.7,.24,WALNUT);
      slab(0,2.81,b+throat/2,2.4,.22,throat,WALNUT);
      slab(0,.03,b+throat/2,2.22,.055,throat,"#4c352c");
      parts.push(BL.pokerSpeakeasy.interior(lite,r.w,r.d)); solid(0, 0, 3.26, 3.26); solid(-a+.65,.26,.81,2.32);
      // Leather reading chairs and a fireplace flanked by shelves and cipher-print panels.
      slab(0, 1.05, -b + 0.34, 3.5, 2.1, 0.6, WALNUT); slab(0, 1, -b + 0.66, 2.22, 1.5, 0.1, LACQUER);
      slab(0, 2.1, -b + 0.45, 3.85, 0.14, 0.84, GOLD); solid(0,-b+.92,3.58,1.66);
      for(let i=-2;i<=2;i++) rail(i*.32-.18,.44,-b+.88,i*.32+.2,.52,-b+1.27,.16,"#523225");
      // Random-length oak parquet blocks break the floor into alternating bands of grain.
      for(let j=0;j<16;j++) for(let k=0;k<10;k++){
        const x=(k-4.5)*1.53,z=(j-7.5)*1.02;
        const color=["#543729","#473127","#60402f","#53382d"][(k*3+j*5+(j>>1))%4];
        slab(x,.006,z,1.515,.012,1.003,color);
        if(!lite) for(let g=-1;g<=1;g++)
          rail(x-.7,.014,z+g*.21,x+.69,.014,z+g*.21+.045*Math.sin(k+j+g),.014,"#714d35");
      }
      for(const s of [-1,1]){
        const x=s*4.8;
        chair(x,-4.35,-s*1.86,"#733f39");chair(x,3.95,-s*.95,"#55383c");
        for(const z of [-5.5,5.1]){
          cylinder(x,z,[[0,0],[.36,0],[.24,.08],[.08,.14],[.07,.55],[.48,.60],[.50,.66],[0,.67]],"#674534");
          solid(x,z,1,1);
          cylinder(x+.16,z,[[0,.67],[.13,.67],[.14,.71],[.09,.73],[0,.69]],"#be976b");
          rail(x+.05,.74,z,x+.25,.73,z+.07,.029,"#6d4432");
          slab(x-.16,.70,z-.12,.26,.055,.34,"#773e3c");
        }
      }
      // A chain of woven diamonds runs inside the bordered carpet toward the hearth.
      for (const side of [-1, 1]) {
        for (let i = 0; i < 3; i++) slab(side * (1.22 + i * 0.15), 1.02, -b + 0.69, 0.07, 1.78, 0.08, i === 1 ? GOLD : "#946744");
        for (let z = -1.85; z < 1.0; z += 1.35) {
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
    const built = { seats, geometry: BL.pokerMarble.staticMesh(M.merge(...parts)), solids };
    if (ice) {
      built.cavern = BL.pokerMarble.staticMesh(BL.pokerIce.cavern(r, lite));
      built.glyph = BL.pokerIce.glyph(lite);
    }
    if (id === 2) {
      // Every other marble row repeats exactly. Bake each of the two patterns once.
      const stone = BL.pokerFloor.tiles(lite);
      built.paving = [0, 1].map(row => {
        const tiles = [];
        for (let col = 0; col < 9; col++) {
          const set = (col + row) % 2 ? stone.border : stone.field, tile = M.merge(set[(col + 3 * row) % set.length]);
          const v = tile.verts;
          for (let i = 0; i < v.length; i += 3) {
            v[i] = v[i] * .5 + (col - 4) * 2; v[i+1] *= .12; v[i+2] *= 1.875 / 4;
          }
          tiles.push(tile);
        }
        return BL.pokerMarble.staticMesh(M.merge(...tiles));
      });
    }
    cache.set(key, built);
    return built;
  };
  const fireplace=(room,r,lite)=>{
    const fire=[], smoke=[], z=-r.d/2+1.1;
    for(let i=0;i<(lite?7:15);i++){
      const phase=i*2.4, hot=i%3===0;
      const flame=M.lathe({segments:6,profile:[[0,0],[.11,.04],[.14,.18],[.078,.37],[.043,.53],[0,.71]],
        color:hot?"#ffd377":i%2?"#ec741f":"#cc4220",emissive:.98});
      for(let v=0;v<flame.verts.length;v+=3){
        const y=flame.verts[v+1];flame.verts[v]+=.28*y*Math.sin(phase+y*5);flame.verts[v+2]+=.115*y*Math.cos(phase+y*6);
      }
      fire.push(add(room,flame,.83*Math.sin(phase*.71),.43+.07*Math.cos(phase),z+Math.sin(phase)*.24+(hot?.15:0)));
    }
    const coals=[];
    for(let k=0;k<37;k++){
      const x=.86*Math.cos(k*2.4)*Math.sqrt((k+.5)/37),dz=.37*Math.sin(k*2.4)*Math.sqrt((k+.5)/37);
      coals.push(mesh(.12+(k%4)*.018,.069,.09,k%3?"#ac3a13":"#ffa13b",x,.45+(k%3)*.013,z+dz,k%3?.48:.88));
    }
    add(room,M.merge(...coals));
    const strands=[];
    for(let j=0;j<2;j++) for(let k=0;k<9;k++){
      const a=k*.66+j,b=a+.66, w=.014+k*.002;
      strands.push(M.beam(.08*Math.sin(a),k*.097,.045*Math.cos(a),.08*Math.sin(b),(k+1)*.097,.045*Math.cos(b),w,"#b29d91"));
    }
    const plume=M.merge(...strands);plume.glassOpacity=.17;plume.glassGrazing=0;plume.castShadow=false;
    for(const side of [-1,1]) for(const spot of [-5.5,5.1]) smoke.push(add(room,plume,side*4.8+.24,.75,spot+.06));
    return (t,calm)=>{
      const pulse=calm?0:.09*Math.sin(t*6.1)+.046*Math.sin(t*11.7);
      if(room.visible){
        for(let i=0;i<fire.length;i++){
          const n=fire[i],p=i*2.4;
          n.scale.y=.85+.26*Math.sin(p)+(calm?0:.24*Math.sin(t*5.1+p)+pulse);
          n.rotation.z=.14*Math.sin(p+(calm?0:t*3));n.glow=.95+pulse;
        }
        for(let i=0;i<smoke.length;i++) smoke[i].rotation.y=i+(calm?0:t*.38);
      }
      return pulse;
    };
  };
  const origin = i => i < 0 ? { x: 0, y: 0, z: 0 } : ROOMS[i];
  const build = (lite, vaultDoor, den) => {
    let glyph, hearth;
    const chairs=[];
    const root = S.createNode(), solids = [], targets = [], rooms = [];
    ROOMS.forEach((r, i) => {
      const g = interior(i, lite), room = add(root, g.geometry, r.x, r.y, r.z);
      rooms.push(room); solids.push(g.solids);
      if (g.paving) for (let row = 0; row < 8; row++)
        add(room, g.paving[row % 2], 0, -.013, (row - 3.5) * 1.875);

      if(i===0){
        for(const seat of g.seats){
          const chair=add(room,seat.geometry,seat.x,0,seat.z); chair.rotation.y=seat.yaw; chairs.push(chair);
        }
        hearth=fireplace(room,r,lite);
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
    const shelf = BL.pokerSpeakeasy.shelf(lite, DOORS[0][2], DOORS[0][3]);
    S.addChild(root, shelf.root);
    DOORS.forEach(([from, to, x, z, , , label], i) => {
      if (i === 3) { targets.push(S.createNode()); return; }
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
      rooms[2].visible = roofScope.root.visible = id !== 1;
      for (let i = 0; i < 2; i++) rooms[i].visible = i === id || i === 0 && id < 0 && shelf.opened;
      for (let i = 0; i < targets.length; i++) targets[i].visible = i === 0 ? id <= 0 : i !== 3 && DOORS[i][0] === id && (i !== 6 || !den.pass);
    };
    show(-1);
    return { root, solids, targets, chairs, hearth, glyph, shelf, roofScope, roofWins, sighting, refreshGate, show };
  };
  // Test the whole walking segment against furniture expanded by the visitor's body radius.
  const clear = (set, r, ax, az, bx, bz, radius) => {
    ax -= r.x; az -= r.z; bx -= r.x; bz -= r.z;
    if (Math.abs(bx) > r.w / 2 - radius - 0.14 || bz < -r.d / 2 + radius + .14 || r !== ROOMS[0] && bz > r.d / 2 - radius - .14) return false;
    for (const f of set) {
      const dx = bx - ax, dz = bz - az, w = f.w + radius, d = f.d + radius;
      if (Math.max(ax, bx) <= f.x - w || Math.min(ax, bx) >= f.x + w || Math.max(az, bz) <= f.z - d || Math.min(az, bz) >= f.z + d) continue;
      if (Math.abs(dx * (az - f.z) - dz * (ax - f.x)) < Math.abs(dx) * d + Math.abs(dz) * w || !dx && !dz) return false;
    }
    return true;
  };
  // Clip the swept step to hall, narrow passage and lounge. A diagonal cannot cut either jamb.
  const loungeWalk=(salons,ax,az,bx,bz,y,h,actor)=>{
    const radius=actor.bodyRadius,r=ROOMS[0],hall=-35.5+radius,front=r.z+r.d/2-radius-.14;
    if(!salons.shelf.clear(ax,az,bx,bz,radius)) return false;
    if(Math.min(az,bz)>=hall) return BL.pokerModels.walkable(ax,az,bx,bz,y,h,actor);
    if(!salons.shelf.opened) return false;
    const slope=az===bz?0:(bx-ax)/(bz-az);
    const low=Math.max(front,Math.min(az,bz)),high=Math.min(hall,Math.max(az,bz));
    if(low<=high && (Math.abs((ax+slope*(low-az))-r.x)>1.02-radius || Math.abs((ax+slope*(high-az))-r.x)>1.02-radius ||
      az===bz && Math.abs(bx-r.x)>1.02-radius)) return false;
    if(Math.max(az,bz)>hall){
      const x=ax+slope*(hall-az);
      if(!BL.pokerModels.walkable(az>hall?ax:x,Math.max(az,hall),bz>hall?bx:x,Math.max(bz,hall),y,h,actor)) return false;
    }
    return Math.min(az,bz)>=front || clear(salons.solids[0],r,az>front?ax+slope*(front-az):ax,Math.min(front,az),
      bz>front?ax+slope*(front-az):bx,Math.min(front,bz),radius);
  };
  BL.pokerSalons = Object.freeze({ ROOMS, DOORS, build, clear, loungeWalk });
})();
