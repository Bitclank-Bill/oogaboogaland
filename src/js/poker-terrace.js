// The open east loggia and the three custom-built bars. All dimensions are in hall metres.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene, K = BL.pokerMarble;
  const brass = "#b78b4e", edge = "#e4c594", dark = "#302223", copper = "#b9704a", leather = "#713536", opal = "#ffe5ae";
  // Preserve the 8.5 m throat at the east bay. Scale the chamfered deck to ten times
  // the old walk polygon's area, including that unchanged throat (floor plan in metres).
  const inner=25, halfSpan=7*Math.sqrt(10), flatSpan=3*Math.sqrt(10);
  const throatArea=(inner-23)*2*BL.pokerGlazing.OPEN;
  const formerArea=throatArea+14*(32.2-inner)-4;
  const far=inner+(10*formerArea-throatArea+.25*(halfSpan-flatSpan)**2)/(2*halfSpan);
  const outer=z=>far-.25*Math.max(0,Math.abs(z)-flatSpan);
  const station=Object.freeze({x:far-2.5,y:1.62,z:-.6});
  const box = (x,y,z,w,h,d,color,emissive=0) => M.box({ w,h,d,color,emissive,offset:{x,y,z} });
  const turned = (x,y,z,profile,color,n=10,emissive=0) => M.moved(M.lathe({profile,color,segments:n,emissive}),x,y,z);
  const beam = M.beam, tau = 2*Math.PI;
  const bottle = (x,y,z,h,color,n) => {
    const r = h*0.23;
    const body=turned(x,y,z,[[0,0],[r,0],[r*1.12,h*.12],[r,h*.58],[r*.38,h*.74],[r*.38,h*.94],[r*.47,h*.94],[r*.47,h],[0,h]],color,n,.36);
    return M.merge(body,
      turned(x,y,z,[[r*1.11,h*.23],[r*1.08,h*.42]],"#ddc9aa",n,.34),
      turned(x,y,z,[[r*.38,h*.94],[r*.42,h*1.035],[0,h*1.04]],brass,n,.34),
      box(x-r*.41,y+h*.48,z+r*.93,.018,h*.21,.017,"#ffde9a",.62));
  };
  const goblet = (x,y,z,n) => turned(x,y,z,[[0,0],[.08,0],[.07,.018],[.016,.028],[.016,.14],[.075,.20],[.089,.29],[.079,.29],[.06,.225]],"#bbe2dc",n,.38);
  const lamp = (x,y,z,h) => M.merge(turned(x,y,z,[[0,0],[.19,0],[.16,.05],[.042,.1],[.034,h*.69],[.2,h*.72]],brass),
    turned(x,y,z,[[.23,h*.72],[.21,h*.86],[.13,h],[0,h]],opal,10,.92));
  const ring = (x,y,z,r,wire,color=brass) => M.moved(M.torus(r,wire,color,.24,20,5),x,y,z);
  const globeLamp = (x,y,z,h) => M.merge(
    turned(x,y,z,[[0,0],[.23,0],[.23,.07],[.09,.14],[.064,h*.77],[.24,h*.80]],brass,12,.19),
    turned(x,y+h*.8,z,[[.16,0],[.24,.08],[.275,.19],[.25,.30],[.17,.38],[0,.42]],opal,14,.93));
  const terraceLamp = (x,y,z) => {
    const p=[turned(x,y,z,[[0,0],[.17,0],[.17,.08],[.12,.11],[.15,.16],[.15,.43],[.19,.46],[.19,.50],[.08,.59],[0,.61]],dark,8,.26),
      turned(x,y,z,[[.152,.17],[.152,.42]],opal,8,.95)];
    for(let i=0;i<6;i++){const a=i*tau/6,dx=.16*Math.cos(a),dz=.16*Math.sin(a);p.push(beam(x+dx,y+.14,z+dz,x+dx,y+.45,z+dz,.034,brass));}
    return M.merge(...p);
  };
  const cache = M.scopedMap();
  const bar = (cx,cz,lite) => {
    const west = cx<0, key = "bar"+cx+lite;
    if(cache.has(key)) return cache.get(key);
    const p=[], z=cz-.52, front=cz+.54, n=lite?5:9;
    const wood = west ? "#53362c" : "#365353", inset = west ? "#32242b" : "#223b40";
    p.push(box(cx,.46,front-.22,15,.92,.7,wood),K.slab({w:15.3,h:.12,d:1.02,color:west?"#342a2a":"#344947",seed:103,veins:12,on:"top",offset:{x:cx,y:.96,z:front-.22}}));
    for(const y of [.12,.82,.94]) p.push(box(cx,y,front+.16,15.15,.035,.045,brass));
    p.push(beam(cx-7.44,.19,front+.41,cx+7.44,.19,front+.41,.054,brass));
    for(let i=0;i<15;i++){
      const x=cx-7+i;
      if(west){
        p.push(box(x,.47,front+.14,.89,.55,.045,inset));
        for(const dx of [-.4,-.2,0,.2,.4]) p.push(box(x+dx,.47,front+.174,.025,.52,.03,wood));
      }else{
        for(let j=0;j<6;j++){
          const a=j*Math.PI/6,b=(j+1)*Math.PI/6;
          p.push(beam(x+.48*Math.cos(a),.72-.52*Math.sin(a),front+.16,x+.48*Math.cos(b),.72-.52*Math.sin(b),front+.16,.034,copper));
        }
      }
      if(i%3===0) p.push(beam(x,.2,front+.15,x,.19,front+.41,.04,brass));
    }
    const bays=west?[-4.8,0,4.8]:[-6.65,6.65], rad=west?2.28:.76;
    for(const offset of bays){
      const x=cx+offset;
      p.push(box(x,2.3,z-.19,rad*2+.18,4.55,.38,inset));
      for(const side of [-1,1]){
        const dx=x+side*rad;
        p.push(box(dx,1.82,z+.04,.15,3.64,.33,brass));
        for(const shift of [-.09,.09]) p.push(box(dx+shift,1.83,z+.1,.045,3.55,.25,wood));
      }
      for(let j=0;j<12;j++){
        const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
        p.push(beam(x+rad*Math.cos(a),3.46+.96*Math.sin(a),z+.12,x+rad*Math.cos(b),3.46+.96*Math.sin(b),z+.12,.09,edge));
      }
      for(let row=0;row<3;row++){
        const y=1.46+row*.78, qty=west?(lite?4:8):(lite?2:3);
        p.push(box(x,y-.065,z+.12,rad*1.93,.12,.40,wood),box(x,y-.04,z+.33,rad*1.93,.025,.025,opal,.72));
        for(let i=0;i<qty;i++){
          const bx=x+((i+.5)/qty-.5)*rad*1.84, h=.32+((i*7+row*3)%5)*.064;
          p.push(bottle(bx,y,z+.17,h,["#744228","#528778","#995e40","#ae9274"][(i+row)%4],n));
        }
      }
      if(west) for(let i=-3;i<=3;i++){
        const glass=M.turnedZ(goblet(0,0,0,n),Math.PI);
        p.push(M.moved(glass,x+i*.32,3.78,z+.24));
      }
    }
    for(const dx of (west?[-4.8,0,4.8]:[-6.65,6.65])){
      const x=cx+dx;
      if(west){
        p.push(box(x,3.83,z+.23,2.45,.055,.21,brass));
      }else{
        for(let j=-4;j<=4;j++) p.push(box(x+j*.132,3.91,z+.22,.055,.9,.13,j%2?brass:copper));
        p.push(terraceLamp(x,3.38,z+.40));
      }
    }
    for(const side of [-1,1]){
      const x=cx+side*3.15;
      for(let i=0;i<(lite?3:6);i++) p.push(goblet(x+i*.21,1.034,front-.02-(i%2)*.14,n));
      p.push(ring(x-1,1.06,front-.06,.20,.018));
    }
    for(const dx of [-5.8,.8,5.5]){
      const x=cx+dx;
      p.push(box(x,1.035,front-.18,.80,.024,.39,brass),goblet(x-.18,1.05,front-.15,n),
        turned(x+.14,1.05,front-.22,[[0,0],[.10,0],[.145,.30],[.085,.335],[.06,.42],[0,.43]],"#c1b6a2",n,.23));
    }
    if(west) p.push(lamp(-14.05,1.025,front-.12,.64));
    const sign=BL.poolModels.carve(west?"WHITEPAPER":"WHALE WATCH",{cell:.074,color:opal,emissive:.58});
    // Set the aquarium name on its front frame so the upper rim clears every letter at player eye height.
    const signZ=west?z+.04:cz+.18, signY=west?4.76:4.98;
    p.push(box(cx,signY,signZ,west?5:5.8,.55,.25,dark),M.moved(sign.geometry,cx-sign.width/2,signY+.14,signZ+.14));
    const g=M.merge(...p);cache.set(key,g);return g;
  };
  const roofBar = lite => {
    const p=[], x=-3.6,z=-4.8;
    p.push(box(x,.6,z,6.45,1.20,.92,copper),K.slab({w:6.65,h:.14,d:1.16,seed:81,color:"#44312e",offset:{x,y:1.26,z}}));
    for(let k=0;k<9;k++){
      const dx=x+(k-4)*.68;
      p.push(box(dx,.61,z+.472,.60,.78,.05,k%2?"#a45d40":"#b47855"));
      // Engraved moon phases: a lit disc with a travelling dark chord cut into the copper panel.
      const disc=turned(0,0,0,[[0,0],[.21,0],[.21,.032],[0,.032]],edge,16,.27);
      const face=M.turnedX(disc,Math.PI/2);p.push(M.moved(face,dx,.66,z+.50));
      if(k!==4){
        const shade=M.merge(), pts=[];
        for(let j=0;j<=12;j++){const a=-Math.PI/2+j*Math.PI/12;pts.push([Math.cos(a)*.208,Math.sin(a)*.208]);}
        for(let j=12;j>=0;j--){const a=-Math.PI/2+j*Math.PI/12;pts.push([(.96-Math.abs(k-4)*.47)*Math.cos(a)*.208,Math.sin(a)*.208]);}
        const ids=pts.map(([u,v])=>M.pushVert(shade,dx+Math.sign(k-4)*u,.66+v,z+.537));
        M.face(shade,k<4?ids.reverse():ids,BL.math.hexToRgb("#604032"),{doubleSided:true});p.push(shade);
      }
    }
    for(const dx of [-2.8,2.8]){
      p.push(globeLamp(x+dx,1.33,z,1.20));
      p.push(beam(x+dx,1.36,z-.35,x+dx,2.54,z-.35,.055,brass));
    }
    p.push(box(x,2.47,z-.36,5.8,.10,.44,dark),box(x,2.53,z-.36,5.96,.045,.46,edge));
    for(const dx of [-2.08,-1.78,-1.48,-1.18,1.18,1.48,1.78,2.08])
      p.push(M.moved(M.turnedZ(goblet(0,0,0,8),Math.PI),x+dx,2.42,z-.18));
    for(const angle of [0,1.07,-.7])
      p.push(M.moved(M.turnedZ(M.turnedX(M.torus(.34,.015,edge,.43,24,5),1.13),angle),x,2.92,z-.34));
    p.push(turned(x,2.54,z-.34,[[.14,0],[.05,.10],[.045,.24],[0,.27]],brass));
    for(const dx of [-1.8,1.8]) for(let i=0;i<3;i++) p.push(goblet(x+dx+i*.18,1.33,z+.27,8));
    const title=BL.poolModels.carve("21 CLUB",{cell:.043,color:opal,emissive:.8});
    p.push(M.moved(title.geometry,x-title.width/2,1.14,z+.37));
    for(let i=0;i<(lite?28:82);i++){
      const xx=x-3.1+(i*.618034%1)*6.2, yy=.2+(i*.3817%1)*.6;
      p.push(box(xx,yy,z+.47,.044+(i%3)*.012,.025,.014,i%2?"#e19b67":"#854e38",.23));
    }
    for(const sy of [.14,1.17]) p.push(box(x,sy,z+.48,6.5,.044,.045,edge));
    p.push(beam(x-3.17,.21,z+.72,x+3.17,.21,z+.72,.065,brass));
    for(const rr of [1.52,1.62,2.15]) p.push(ring(1.5,.045,2,rr,.026,edge));
    const stone=BL.pokerFloor.tiles(lite);
    for(let i=0;i<9;i++) for(let j=0;j<8;j++){
      const set=(i+j)%2?stone.border:stone.field, g=M.merge(set[(i+3*j)%set.length]);
      for(let v=0;v<g.verts.length;v+=3){g.verts[v]*=.5;g.verts[v+1]*=.12;g.verts[v+2]*=1.875/4;}
      p.push(M.moved(g,(i-4)*2,-.013,(j-3.5)*1.875));
    }
    for(let i=0;i<8;i++) p.push(bottle(x-1.65+i*.44,1.33,z-.15,.32+(i%3)*.11,["#744128","#3b7166","#a57b4a"][i%3],lite?5:9));
    for(const sx of [-6,-4,-2]) p.push(turned(sx,0,-3.62,[[0,0],[.3,0],[.26,.06],[.065,.13],[.065,.68],[.29,.7]],brass),
      turned(sx,0,-3.62,[[.29,.7],[.33,.75],[.31,.85],[0,.87]],leather));
    for(let i=0;i<16;i++){
      const a=i*Math.PI/8, b=a+Math.PI/16, r=i%2?1.3:2.0;
      p.push(beam(1.5+.37*Math.cos(b),.025,2+.37*Math.sin(b),1.5+r*Math.cos(a),.025,2+r*Math.sin(a),.042,brass));
    }
    return M.merge(...p);
  };
  const booths=[];
  const fixtures=[{x:station.x,z:station.z,r:.55}];
  for(const side of [-1,1]) for(const [x,offset] of [[30.6,9],[40,17.8],[far-5.7,8.4]]){
    const z=side*offset, planterX=x-2.36, planterZ=z+side*1.60;
    booths.push({x,z,side,planterX,planterZ});
    fixtures.push({x,z,r:.50},{x:planterX,z:planterZ,r:.50});
    for(let i=0;i<7;i++){const a=.12+i*(Math.PI-.24)/6;fixtures.push({x:x+1.48*Math.cos(a),z:z+side*1.48*Math.sin(a),r:.52});}
  }
  // Reject a sweep through the wall beside the opening, including diagonal steps from the terrace.
  const clear = (ax,az,bx,bz,r) => {
    if(Math.max(ax,bx)<=23-r) return true;
    const opening=BL.pokerGlazing.OPEN-r;
    if(bx>outer(bz)-r || (bx>23-r && Math.abs(bz)>(bx<inner+r?opening:halfSpan-r))) return false;
    for(let i=0;i<2;i++){
      const x=i?inner+r:23-r;
      if((ax-x)*(bx-x)<0 && Math.abs(az+(bz-az)*(x-ax)/(bx-ax))>opening) return false;
    }
    const dx=bx-ax,dz=bz-az,dd=dx*dx+dz*dz;
    for(const f of fixtures){
      const u=dd?Math.max(0,Math.min(1,((f.x-ax)*dx+(f.z-az)*dz)/dd)):0;
      if((ax+dx*u-f.x)**2+(az+dz*u-f.z)**2<(f.r+r)**2) return false;
    }
    return true;
  };
  const build = lite => {
    const root=S.createNode(), p=[], glass=M.merge();
    const add=(parent,geometry,x=0,y=0,z=0)=>{const n=S.createNode({geometry,position:{x,y,z}});S.addChild(parent,n);n.glow=1;return n;};
    const floor=BL.pokerFloor.tiles(lite);
    // Reuse full-size casino marble. At the two chamfers only the outermost tile is tapered.
    const rows=14, dz=2*halfSpan/rows, columns=Math.ceil((far-inner)/4);
    const tileWidth=(outer(halfSpan)-inner)/(columns-1);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const z0=-halfSpan+row*dz, z=z0+dz/2, x0=inner+col*tileWidth;
      const set=(row+col)%2?floor.border:floor.field, tile=set[(row*3+col)%set.length];
      if(col===columns-1){
        const g=M.merge(tile),v=g.verts;
        for(let k=0;k<v.length;k+=3){
          const wz=z+v[k+2]*dz/4;
          v[k]=x0+(v[k]/4+.5)*(outer(wz)-x0);
          v[k+2]=wz;
        }
        add(root,g,0,-.112,0);
      }else{
        const n=add(root,tile,x0+tileWidth/2,-.112,z);n.scale.x=tileWidth/4;n.scale.z=dz/4;
      }
    }
    // Continue the marble through the open bay, overlapping the indoor threshold.
    for(const side of [-1,1]){
      const n=add(root,floor.field[0],(22.2+inner)/2,-.122,side*BL.pokerGlazing.OPEN/2);
      n.scale.x=(inner-22.2)/4;n.scale.z=BL.pokerGlazing.OPEN/4;
    }
    const apron=M.merge(),rim=[[inner,-halfSpan],[outer(halfSpan),-halfSpan],[far,-flatSpan],[far,flatSpan],[outer(halfSpan),halfSpan],[inner,halfSpan]];
    for(let i=0;i<rim.length;i++){
      const [x,z]=rim[i],[xx,zz]=rim[(i+1)%rim.length];
      const ids=[[x,.04,z],[xx,.04,zz],[xx,-.54,zz],[x,-.54,z]].map(q=>M.pushVert(apron,...q));
      M.face(apron,ids,BL.math.hexToRgb("#654d40"));
      p.push(beam(x,-.075,z,xx,-.075,zz,.065,brass));
    }
    p.push(apron);
    const perimeter=[[inner,-BL.pokerGlazing.OPEN],...rim,[inner,BL.pokerGlazing.OPEN]],points=[];
    for(let i=0;i<perimeter.length-1;i++){
      const [x,z]=perimeter[i],[xx,zz]=perimeter[i+1],n=Math.ceil(Math.hypot(xx-x,zz-z)/3.4);
      for(let k=0;k<n;k++)points.push([x+(xx-x)*k/n,z+(zz-z)*k/n]);
    }
    points.push(perimeter[perimeter.length-1]);
    points.forEach(([x,z],i)=>{
      p.push(turned(x,.06,z,[[0,0],[.14,0],[.095,.10],[.055,.16],[.055,1.05],[.11,1.08],[.07,1.16],[0,1.18]],brass,lite?5:8,.3));
      if(i%2===1) p.push(terraceLamp(x,1.23,z));
      if(!i)return;const [xx,zz]=points[i-1];
      for(const y of [.13,1.10])p.push(beam(x,y,z,xx,y,zz,y>1?.073:.06,edge));
      for (const level of [.22,.97]) p.push(beam(x,level,z,xx,level,zz,.025,brass));
      const ids=[[x,.19,z],[xx,.19,zz],[xx,1.03,zz],[x,1.03,z]].map(v=>M.pushVert(glass,...v));
      M.face(glass,ids,BL.math.hexToRgb("#8ba8aa"));M.face(glass,ids.slice().reverse(),BL.math.hexToRgb("#8ba8aa"));
    });
    glass.glassOpacity=.10;glass.glassGrazing=.42;glass.castShadow=false;add(root,glass);
    for(const s of [-1,1]){
      const z=s*BL.pokerGlazing.OPEN;
      p.push(turned(24.4,.03,z,[[0,0],[.40,0],[.40,.18],[.30,.32],[.26,3.95],[.36,4.11],[.4,4.25],[0,4.25]],"#a18568",12,.20));
      for(let i=0;i<10;i++){const a=i*tau/10;p.push(beam(24.4+.26*Math.cos(a),.36,z+.26*Math.sin(a),24.4+.26*Math.cos(a),3.94,z+.26*Math.sin(a),.037,brass));}
      p.push(lamp(24.15,2.26,z-s*.22,.68));
    }
    for(const {x:cx,z:bz,side:s,planterX:px,planterZ:pz} of booths){
      for(let i=0;i<7;i++){
        const a=.12+i*(Math.PI-.24)/6, x=cx+1.48*Math.cos(a),zz=bz+s*1.48*Math.sin(a);
        const padded=(w,h,d,y,z,color)=>M.bevelBox({w,h,d,color,bevel:.064,offset:{x:0,y,z}});
        const cushion=M.merge(box(0,.28,0,.76,.35,.87,dark),box(0,.235,0,.78,.036,.89,edge),
          padded(.76,.19,.84,.50,0,leather),padded(.75,.72,.23,.83,.36,leather),
          box(0,1.19,.36,.74,.032,.20,brass),box(0,.87,.23,.028,.04,.018,brass));
        p.push(M.moved(M.turnedY(cushion,Math.atan2(Math.cos(a),s*Math.sin(a))),x,0,zz));
      }
      p.push(turned(cx,0,bz,[[0,.06],[.31,.06],[.29,.13],[.075,.20],[.075,.68],[.48,.70],[.5,.76],[0,.76]],brass),lamp(cx,.76,bz,.33));
      p.push(turned(px,0,pz,[[0,.06],[.31,.06],[.45,.49],[.48,.53],[.47,.60],[0,.60]],copper));
      for(let i=0;i<(lite?8:17);i++){
        const a=i*2.40,len=.72+(i%4)*.15,h=.9+(i%3)*.24,leaf=M.merge();
        const pts=[[0,.58,0],[.32,.62+h,-.12],[len,.62+h*.72,0],[.32,.65+h,.12],[.34,.73+h,0]];
        const v=pts.map(q=>M.pushVert(leaf,...q));
        for(let j=0;j<4;j++)M.face(leaf,[v[4],v[j],v[(j+1)%4]],BL.math.hexToRgb(j%2?"#345545":"#587057"),{emissive:.22,doubleSided:true});
        p.push(M.moved(M.turnedY(leaf,a),px,0,pz));
      }
    }
    p.push(beam(24.4,4.26,-4.6,24.4,4.26,4.6,.22,brass));
    const ins=BL.poolModels.carve("TERRACE",{cell:.092,color:opal,emissive:.67});
    p.push(box(24.4,4.42,0,.27,.6,3.6,dark),M.moved(M.turnedY(M.moved(ins.geometry,-ins.width/2,0,0),-Math.PI/2),24.245,4.605,0));
    // Brass compass in the marble marks the observation court from the threshold.
    const court=station.x-3.8;
    for(const r of [2.7,2.84,3.38])p.push(ring(court,.075,0,r,.023,brass));
    for(let i=0;i<16;i++){
      const a=i*tau/16,r=i%4===0?2.65:i%2===0?1.93:1.12, star=M.geometry();
      const point=(along,across)=>[court+along*Math.cos(a)-across*Math.sin(a),.081,along*Math.sin(a)+across*Math.cos(a)];
      for(const side of [-1,1]){
        const vertices=[point(.17,0),point(.52,side*.23),point(r,0)];
        if(side<0)vertices.reverse();
        M.face(star,vertices.map(v=>M.pushVert(star,...v)),BL.math.hexToRgb(side>0?edge:copper),{emissive:.28});
      }
      p.push(star);
    }
    for(let i=0;i<3;i++){
      const a=i*tau/3;
      p.push(beam(station.x+.62*Math.cos(a),.07,station.z+.62*Math.sin(a),station.x,1.34,station.z,.106,brass));
    }
    p.push(turned(station.x,1.05,station.z,[[.13,0],[.22,.04],[.22,.12],[.12,.18],[.12,.52],[0,.54]],dark));
    const dial=ring(station.x,1.12,station.z,.32,.035,edge);
    p.push(dial,ring(station.x,.68,station.z,.33,.025));
    for(let i=0;i<16;i++){
      const a=i*tau/16,dx=Math.cos(a),dz=Math.sin(a);
      p.push(beam(station.x+dx*.25,1.14,station.z+dz*.25,station.x+dx*.31,1.14,station.z+dz*.31,.015,edge));
    }
    const base=add(root,M.merge(...p));base.geometry.castShadow=false;
    const yaw=add(root,null,station.x,station.y,station.z),pitch=add(yaw,null);
    const tube=M.merge(turned(0,0,0,[[0,-.68],[.066,-.68],[.066,-.49],[.10,-.45],[.12,-.30],[.13,.22],[.16,.28],[.16,.61],[.19,.64],[.19,.78],[0,.78]],brass,16,.25),
      turned(0,0,0,[[.17,.782],[.15,.793],[0,.793]],"#4399a5",16,.62));
    for(const y of [-.43,-.13,.23,.60]){const r=y>.2?.165:.134;const band=turned(0,0,0,[[r,y],[r+.007,y+.016],[r,y+.044]],dark,16);S.addChild(pitch,S.createNode({geometry:M.turnedX(band,Math.PI/2)}));}
    const target=add(pitch,M.turnedX(tube,Math.PI/2));return {root,yaw,pitch,target};
  };
  BL.pokerTerrace=Object.freeze({station,halfSpan,outer,clear,bar,roofBar,build});
})();
