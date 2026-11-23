// Rooms off the Ember Den floor. Door landings and walk limits use the same room coordinates as the art.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const GOLD = "#b8893b", LACQUER = "#191713", IVORY = "#efe6d2", WALNUT = "#3c271e", ICE = "#9cc9e3";
  const ROOMS = [
    { name: "Cypherpunk Lounge", x: -BL.pokerGlazing.BOOK_X, z: -48.1, y: 0, w: 16.25, d: 17.6, h: 13.5 },
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
    [0, 0, BL.pokerSpeakeasy.bookBay(ROOMS[0].w), -8.04, 0, 0, "Founders pass"]
  ];
  const mesh = (w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const add = (parent, geometry, x = 0, y = 0, z = 0) => {
    const n = S.createNode({ geometry, position: { x, y, z } }); S.addChild(parent, n); return n;
  };
  const letters = (text, cell, color, x, y, z) => {
    const g = BL.poolModels.carve(text, { joined:true, cell, color, emissive: 0.5 }); return M.moved(g.geometry, x - g.width / 2, y, z);
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
      if(id===0){
        seats.push({x,z,yaw,geometry:BL.pokerLoungeStone.chair()});
        solid(x,z,1.05,1.05);return;
      }
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
      parts.push(M.moved(M.turnedY(seat,yaw),x,0,z));
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
      parts.push(BL.pokerSpeakeasy.interior(lite,r.w,r.d)); solid(0, 0, 3.26, 3.26);
      for(const side of [-1,1]){
        solid(side*(a-.65),.26,.81,2.32);
        for(let j=0;j<=3;j++)solid(side*(a-.37),(2*j-3)*(r.d-.66)/6,.85,.85);
      }
      // Leather reading chairs and a fireplace flanked by shelves and carved wall figures.
      solid(0,-b+.88,5.775,1.66);
      for(const s of [-1,1]){
        rail(-1.23,.54,-b+1.05+s*.15,1.21,.60,-b+1.05-s*.16,.20,"#41302b");
        for(let i=-4;i<=4;i++)rail(i*.25-.07,.64,-b+1.07+s*.12,i*.25+.06,.70,-b+1.04+s*.12,.024,"#ba582b");
      }
      for(const s of [-1,1]){
        const x=s*4.8;
        chair(x,-4.35,-s*1.86,"#733f39");chair(x,3.95,-s*.95,"#55383c");
        for(const z of [-5.5,5.1]){
          cylinder(x,z,[[0,0],[.36,0],[.24,.08],[.08,.14],[.07,.55],[.48,.60],[.50,.66],[0,.67]],"#674534");
          solid(x,z,1,1);
          if(z<0)continue; // The fireside tables hold the record player and picture book.
          cylinder(x+s*.16,z,[[0,.67],[.13,.67],[.14,.71],[.09,.73],[0,.69]],"#be976b");
          rail(x+s*.05,.74,z,x+s*.25,.73,z+.07,.029,"#6d4432");
          slab(x-s*.16,.70,z-.12,.26,.055,.34,"#773e3c");
        }
      }
      // A chain of woven diamonds runs inside the bordered carpet toward the hearth.
      for (const side of [-1, 1]) {
        for (let z = -1.85; z < 1.0; z += 1.35) {
          rail(0, 0.04, z, side * 0.68, 0.04, z + 0.66, 0.045, "#ad815a");
          rail(side * 0.68, 0.04, z + 0.66, 0, 0.04, z + 1.32, 0.045, "#ad815a");
        }
      }
      for (let i=-3; i<=3; i++) rail(i*.39,.23,-b+1.54,i*.39,.53,-b+1.53,.038,GOLD);
      rail(-1.25,.50,-b+1.53,1.25,.50,-b+1.53,.038,GOLD);
      const bay=BL.pokerSpeakeasy.bookBay(r.w);
      for (const s of [-1, 1]) {
        for (const end of [-1, 1]) slab(s * bay + end * 1.72, 1.45, -b + 0.23, 0.14, 2.86, 0.54, WALNUT);
        slab(s * bay, 2.9, -b + 0.23, 3.69, 0.16, 0.56, WALNUT);
        for (let row = 0; row < 3; row++) {
          const y = 0.78 + row * 0.65;
          if(row===0)slab(s*bay,y,-b+.24,3.4,.08,.46,GOLD);
          else for(const sign of [-1,1])slab(s*bay+sign*1.15,y,-b+.24,1.10,.08,.46,GOLD);
          for (let j = 0; j < (lite ? 7 : 13); j++) {
            const h = 0.23 + (j * 7 % 6) * 0.045;
            const x=s*(bay-1.48+j*(lite ? .44 : .235)), thick=lite ? .29 : .205;
            if(row>0 && Math.abs(x-s*bay)<.63)continue;
            slab(x,y+h/2+.04,-b+.26,thick,h,.32,["#835343","#315749","#95724a","#51393a"][(j+row)%4]);
            slab(x,y+.13,-b+.424,thick*.76,.019,.013,GOLD,.25);
          }
        }
        chair(s * 2.18, -0.7, -s * 1.28, "#55353c");
        chair(s * 1.52, 1.93, -s * 2.52, "#55353c");
      }
      for(const sign of [-1,1])parts.push(M.moved(BL.pokerSpeakeasy.passCase(),sign*bay,1.70,DOORS[6][3]));
      // The companion vitrine holds a brass pocket watch and its winding crown.
      const watch=M.turnedX(M.lathe({profile:[[0,0],[.18,0],[.19,.026],[.16,.05],[0,.05]],color:GOLD,segments:24}),Math.PI/2);
      parts.push(M.moved(watch,-bay,1.67,DOORS[6][3]+.22));
      rail(-bay,1.67,DOORS[6][3]+.28,-bay+.075,1.73,DOORS[6][3]+.28,.018,LACQUER);
      rail(-bay,1.67,DOORS[6][3]+.28,-bay-.035,1.79,DOORS[6][3]+.28,.012,LACQUER);
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
    const smoke=[], z=-r.d/2+1.1;
    add(room,BL.pokerHearth.surround(r.h,lite),0,0,-r.d/2);
    const fire=BL.pokerHearth.fire(lite);
    add(room,fire.geometry,0,.45,z+.12);
    add(room,fire.behind,0,BL.pokerHearth.emblemY,-r.d/2+.86);
    const coals=[];
    for(let k=0;k<37;k++){
      const x=1.29*Math.cos(k*2.4)*Math.sqrt((k+.5)/37),dz=.37*Math.sin(k*2.4)*Math.sqrt((k+.5)/37);
      coals.push(mesh(.12+(k%4)*.018,.069,.09,k%3?"#ac3a13":"#ffa13b",x,.45+(k%3)*.013,z+dz,k%3?.48:.88));
    }
    add(room,M.merge(...coals));
    const strands=[];
    for(let j=0;j<2;j++) for(let k=0;k<9;k++){
      const a=k*.66+j,b=a+.66, w=.014+k*.002;
      strands.push(M.beam(.08*Math.sin(a),k*.097,.045*Math.cos(a),.08*Math.sin(b),(k+1)*.097,.045*Math.cos(b),w,"#b29d91"));
    }
    const plume=M.merge(...strands);plume.glassOpacity=.17;plume.glassGrazing=0;plume.castShadow=false;
    smoke.push(add(room,plume,5.04,.75,5.16));
    return (t,calm)=>{
      const pulse=calm?0:.09*Math.sin(t*6.1)+.046*Math.sin(t*11.7);
      if(room.visible){
        fire.update(calm?0:t);
        for(let i=0;i<smoke.length;i++) smoke[i].rotation.y=i+(calm?0:t*.38);
      }
      return pulse;
    };
  };
  const origin = i => i < 0 ? { x: 0, y: 0, z: 0 } : ROOMS[i];
  const build = (lite, vaultDoor, den) => {
    let glyph, hearth, heirlooms;
    const chairs=[],windowLight=S.createNode();
    windowLight.lights=new Float32Array(6*8);
    const root = S.createNode(), solids = [], targets = [], rooms = [];
    ROOMS.forEach((r, i) => {
      const g = interior(i, lite), room = add(root, g.geometry, r.x, r.y, r.z);
      rooms.push(room); solids.push(g.solids);
      if (g.paving) for (let row = 0; row < 8; row++)
        add(room, g.paving[row % 2], 0, -.013, (row - 3.5) * 1.875);

      if(i===0){
        S.addChild(room,windowLight);
        const ornaments=BL.pokerLoungeStone.outfit(room,r,lite,windowLight,g.seats);
        // One world-space grid per wall. At corners and around the door, trim
        // the stone tile while keeping the size and spacing of the etching.
        const pitch=1.82;
        const wall=(cx,cz,yaw,left,right,base,top)=>{
          const dx=Math.cos(yaw),dz=-Math.sin(yaw);
          for(let j=Math.floor(base/pitch);j<Math.ceil(top/pitch);j++){
            const v=j*pitch;
            for(let i=Math.floor(left/pitch+.5);i<Math.ceil(right/pitch+.5);i++){
              const u=(i-.5)*pitch;
              // Leave the marble bare behind each raised carving so a second
              // etched silhouette cannot show through its open spaces.
              const midX=cx+dx*i*pitch,midZ=cz+dz*i*pitch,midY=v+pitch/2;
              const plain=ornaments.some(({position:p})=>Math.abs(p.x-midX)<pitch/2 &&
                Math.abs(p.z-midZ)<pitch/2 && Math.abs(p.y-midY)<pitch/2);
              const paper=BL.pokerSpeakeasy.engraving(Math.max(0,(left-u)/pitch),Math.max(0,(base-v)/pitch),
                Math.min(1,(right-u)/pitch),Math.min(1,(top-v)/pitch),plain);
              const tile=add(room,paper,cx+dx*u,v,cz+dz*u);
              tile.rotation.y=yaw;tile.scale.x=tile.scale.y=pitch;
            }
          }
        };
        const a=r.w/2,b=r.d/2,top=r.h-.12;
        wall(0,-b+.145,0,.12-a,a-.12,.02,top);
        for(const side of [-1,1])wall(side*(a-.15),0,-side*Math.PI/2,.14-b,b-.14,.02,top);
        wall(0,b-.14,Math.PI,.12-a,-1.04,.02,2.70);
        wall(0,b-.14,Math.PI,1.04,a-.12,.02,2.70);
        wall(0,b-.14,Math.PI,.12-a,a-.12,2.70,top);
        for(const seat of g.seats){
          const chair=add(room,seat.geometry,seat.x,0,seat.z); chair.rotation.y=seat.yaw; chairs.push(chair);
        }
        hearth=fireplace(room,r,lite);
        heirlooms=BL.pokerLoungeHeirlooms.create(room,r);
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
      windowLight.visible=id===0;
      rooms[2].visible = roofScope.root.visible = id !== 1;
      for (let i = 0; i < 2; i++) rooms[i].visible = i === id || i === 0 && id < 0 && shelf.opened;
      for (let i = 0; i < targets.length; i++) targets[i].visible = i === 0 ? id <= 0 : i !== 3 && DOORS[i][0] === id && (i !== 6 || !den.pass);
    };
    // Seen through the open bookcase, the lounge occupies only the angular opening
    // between the jambs. Adjacent casino windows continue to look out onto the ocean.
    const surfaces=new Set(),left=new Float32Array(4),right=new Float32Array(4),lintel=new Float32Array(4);
    const gather=n=>{if(n.geometry)surfaces.add(n.geometry);for(const child of n.children)gather(child);};
    gather(rooms[0]);
    let clipped=false;
    const portalView=(eye,id)=>{
      const door=DOORS[0], dz=eye.z-door[3], outside=id<0 && shelf.opened && dz>.001;
      if(outside!==clipped){
        for(const g of surfaces){g.clipSlab=outside?left:null;g.clipSlab2=outside?right:null;g.clipPlane=outside?lintel:null;}
        clipped=outside;
      }
      if(!outside)return;
      const jamb=(plane,side)=>{
        const x=door[2]+side*1.04, dx=x-eye.x, scale=side/(128*Math.hypot(dx,dz));
        plane[0]=dz*scale;plane[2]=dx*scale;
        plane[3]=1-plane[0]*x-plane[2]*door[3];
      };
      jamb(left,-1);jamb(right,1);
      const slope=(2.73-eye.y)/dz;
      lintel[1]=1;lintel[2]=slope;lintel[3]=-eye.y-slope*eye.z;
    };
    show(-1);
    return { root, solids, targets, chairs, hearth, heirlooms, windowLights:windowLight.lights, portalView, glyph, shelf, roofScope, roofWins, sighting, refreshGate, show };
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
    if(!salons.shelf.opened && Math.max(az,bz)>=hall) return false;
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
