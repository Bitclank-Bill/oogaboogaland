// Whale Watch. The bar and the terrace look into the same basin, in hall metres.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const TOP = 6.8, BED = -19.2;
  // The recessed front bay crosses the full width of Cold Storage behind its back wall.
  // Its glass return keeps a westward sightline from the bar while leaving the cave dry.
  const vault=BL.pokerSalons.ROOMS[1], eastReturn=vault.x+vault.w/2+1.2;
  const westBay=vault.x-vault.w/2-5.1, bayFront=vault.z-vault.d/2-3;
  const outline = [[eastReturn,-39],[72,-39],[86,-53],[86,-114],[74,-133],[-12,-133],[-23,-119],
    [-23,-69],[westBay,-57],[westBay,bayFront],[eastReturn,bayFront]];
  const frontSpill=[.72,.89]; // Shared waterline span for the steady waterfall and a breach surge.
  const cache = M.scopedMap();
  const face = (g, pts, color, glow) => M.face(g, pts.map(p => M.pushVert(g,...p)), color.map(Math.round), {emissive:glow});
  const add = (root, geometry, x=0, y=0, z=0) => {
    const n = S.createNode({geometry,position:{x,y,z}}); S.addChild(root,n); return n;
  };
  const pebble = (x,y,z,rx,ry,rz,color) => {
    const g=M.lathe({profile:[[0,-1],[.78,-.59],[1,0],[.78,.59],[0,1]],segments:8,color,emissive:.54});
    for(let k=0;k<g.verts.length;k+=3){
      g.verts[k]=x+rx*g.verts[k]; g.verts[k+1]=y+ry*g.verts[k+1]; g.verts[k+2]=z+rz*g.verts[k+2];
    }
    return g;
  };
  const scenery=lite=>{
    const rock=M.geometry(), reef=M.geometry(), frame=[], panes=M.geometry(), surface=M.geometry(), underside=M.geometry();
    // The splayed viewing port brings seawater right up to the bar; the outside wall clears Cold Storage.
    const port=-35.81, front=-39, left=4.06,right=15.94,base=1.04,head=5.16;
    const near=[[left,base,port],[right,base,port],[right,head,port],[left,head,port]];
    const far=[[eastReturn,BED,front],[24,BED,front],[24,TOP,front],[eastReturn,TOP,front]];
    for(let j=0;j<4;j++){
      const k=(j+1)%4;
      face(j===3?panes:reef,[near[j],near[k],far[k],far[j]],j===0?[25,72,82]:j===2?[44,120,134]:[24,83,98],.72);
      // Carry the visible lintel and sill to the far side of the vault. The pier stands at the outer end.
      const x0=j===0||j===3?westBay:near[j][0], x1=k===0||k===3?westBay:near[k][0];
      frame.push(M.beam(x0,near[j][1],port,x1,near[k][1],port,.21,"#413f39",.40),
        M.beam(x0,near[j][1],port+.096,x1,near[k][1],port+.096,.048,"#b8a076",.60));
    }
    const falls=[], random=BL.math.mulberry32(60138);
    const water=(g,alpha,flow)=>{
      // The WebGL water material has moving ripples and downward spray; Canvas animates the lake material.
      for(const f of g.faces) {if(lite) f.lake=true; else f.water=true;}
      g.castShadow=false;g.glass=alpha;g.twoSided=true;
      if(flow) g.lakeFlow=Float32Array.from(flow);
      return g;
    };
    // The basin rests in a tapered, stratified basalt shelf. Only the near and east faces are glazed.
    for(let i=0;i<outline.length;i++){
      const a=outline[i], b=outline[(i+1)%outline.length], dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz);
      const nx=-dz/len,nz=dx/len,n=Math.ceil(len/(lite?6:3.4));
      let prev;
      for(let k=0;k<=n;k++){
        const u=k/n,x=a[0]+dx*u,z=a[1]+dz*u;
        const at=(y,inset)=>[x+nx*inset,y,z+nz*inset];
        const seam=Math.sin(u*Math.PI);
        const row=[at(BED,0),at(BED-1.2,.66*seam),at(BED-3-random()*1.1,1.25*seam),
          at(BED-6-random()*3,.54*seam),at(BED-14-random()*4,-2*seam),[48+(x-48)*.60,-49-random()*5,-85+(z+85)*.65]];
        if(prev) for(let j=0;j<row.length-1;j++){
          const v=8*random(), c=[[48,72,76],[57,73,80],[32,48,58],[45,55,67],[30,36,50]][j];
          face(rock,[row[j+1],row[j],prev[j]],c.map(t=>t+v),.49);
          face(rock,[prev[j+1],row[j+1],prev[j]],c.map(t=>t+v+3),.46);
        }
        prev=row;
      }
      // Ocean colour grows darker with depth. These panels show the animals through the front glass.
      const back=i>=3 && i<outline.length-2;
      const wall=back?reef:panes, cols=back?n:1;
      for(let j=0;j<cols;j++) for(let k=0;k<(back?10:4);k++){
        const v=k/(back?10:4),w=(k+1)/(back?10:4);
        const pt=(u,h)=>[a[0]+dx*u,BED+26*h,a[1]+dz*u];
        const sun=back?Math.max(0,Math.sin(j*.79-k*.41)*Math.cos(j*.26+k*.29)):0;
        const start=i===0?(24-a[0])/dx:j/cols;
        const quad=[pt(start,v),pt((j+1)/cols,v),pt((j+1)/cols,w),pt(start,w)];
        face(wall,back?quad.reverse():quad,
          [10+v*10+sun*13,34+v*67+sun*29,53+v*82+sun*29],.77);
      }
      if(!back && i<outline.length-2){
        for(let j=0;j<=n;j+=lite?3:5){
          const x=a[0]+dx*j/n,z=a[1]+dz*j/n;
          if(i===0 && x<24)continue;
          frame.push(M.beam(x,BED,z,x,TOP,z,.105,"#497781",.54));
        }
      }
      frame.push(M.beam(a[0],TOP-.09,a[1],b[0],TOP-.09,b[1],.19,"#a5dfdb",.84),
        M.beam(a[0],BED,a[1],b[0],BED,b[1],.52,"#637d7b",.47));
      // Overflow weirs on the exposed lip bow outward to clear the shelf. Individual ribbons taper to spray.
      if(i<=3){
        const runs=i===0?[[.34,.42],frontSpill]:i===1?[[.08,.87]]:i===2?[[.13,.36],[.57,.79]]:[[.12,.70]];
        const g=M.geometry();
        for(const [lo,hi] of runs){
          const strips=Math.ceil((hi-lo)*len/(lite?1.5:.72));
          for(let s=0;s<strips;s++){
            const u=lo+(hi-lo)*s/strips,v=lo+(hi-lo)*(s+.99)/strips, spread=.88+random()*.23,drop=49+random()*7;
            let last;
            for(const t of [0,.04,.12,.32,.58,.83,1]){
              const reach=t===0?-.10:(.22+3.6*Math.sqrt(t))*spread;
              const p=h=>[a[0]+dx*h+nx*reach,TOP+.03-drop*t*t,a[1]+dz*h+nz*reach];
              const row=[p(u),p(v)];
              if(last)face(g,[row[0],row[1],last[1],last[0]],[111,185,215],.62+.11*spread);
              last=row;
            }
          }
        }
        falls.push(water(g,.48,[dx/len*.45,0,dz/len*.45,0,0,-.32,0,0]));
      }
    }
    // A triangle fan matches the clipped corners of the actual waterline.
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      const lid=[[48,TOP,-85],[a[0],TOP,a[1]],[b[0],TOP,b[1]]];
      face(surface,lid,[92,177,203],.58);face(surface,lid.reverse(),[69,143,172],.49);
      // Tint the sky through the waterline while transmitting the lightning channel down to its point of contact.
      face(underside,[[48,TOP+.045,-85],[b[0],TOP+.045,b[1]],[a[0],TOP+.045,a[1]]],[34,103,124],.68);
      face(reef,[[48,BED,-85],[a[0],BED,a[1]],[b[0],BED,b[1]]],[30,76,85],.61);
    }
    // A shallow header above the dry vault joins the two waterlines. The swimming depth starts behind its back wall.
    const header=[[westBay,TOP,front],[eastReturn,TOP,front],[eastReturn,TOP,bayFront],[westBay,TOP,bayFront]];
    face(surface,header,[89,169,186],.57);face(surface,header.slice().reverse(),[69,143,172],.49);
    face(underside,header.map(([x,y,z])=>[x,y+.045,z]).reverse(),[34,103,124],.68);
    face(reef,[[westBay,head,port],[eastReturn,head,port],[eastReturn,TOP,front],[westBay,TOP,front]],
      [39,104,121],.64);
    frame.push(M.beam(westBay,TOP,front,eastReturn,TOP,front,.15,"#a5dfdb",.84));
    for(let i=0;i<(lite?36:75);i++){
      const z=-45-random()*75, west=z<bayFront-7?-9:12;
      const x=west+random()*(70-west),y=BED-.42,h=1+random()*2.9;
      // Low outcrops on the sandy bed and ribbon kelp with a visible midrib.
      const r=M.lathe({segments:6,profile:[[0,0],[1,0],[.85,h*.55],[.4,h],[0,h*.93]],color:i%2?"#345b63":"#42666a",emissive:.57});
      const wide=1.4+random()*2.1;
      for(let j=0;j<r.verts.length;j+=3){r.verts[j]=x+r.verts[j]*wide;r.verts[j+1]+=y;r.verts[j+2]=z+r.verts[j+2]*wide*.71;}
      frame.push(r);
      for(let blade=0;blade<3;blade++){
        let last;
        for(let k=0;k<5;k++){
          const t=k/4,xx=x+blade*.42+t*(blade-1)+Math.sin(t*5+i)*t*.8, yy=y+(4+h+blade*.68)*t,zz=z+.55*blade+t*.75;
          const w=(.15+.12*Math.sin(t*3))*(1-t*.94),row=[[xx-w,yy,zz],[xx+w,yy,zz]];
          if(last)face(reef,[last[0],last[1],row[1],row[0]],[29,94+i%19,89],.67);
          last=row;
        }
      }
    }
    // A basalt ledge follows the west reveal into the tank. The kelp is rooted on that ledge, at eye level from the bar.
    const kelp=(x,y,z,h,phase)=>{
      let last;
      for(let k=0;k<=8;k++){
        const t=k/8,xx=x+.19*Math.sin(phase+6*t)+.29*t,zz=z+.40*Math.sin(phase+4*t),yy=y+h*t;
        const w=(.06+.14*Math.sin(Math.PI*t))*(1-.77*t);
        const row=[[xx-w,yy,zz],[xx,yy+.02,zz+.055],[xx+w,yy,zz]];
        if(last)for(let q=0;q<2;q++){
          const f=[last[q],last[q+1],row[q+1],row[q]];
          const col=q?[38,109,98]:[48,136,112];
          face(reef,f,col,.64);face(reef,f.reverse(),col,.64);
        }
        last=row;
      }
    };
    for(let i=0;i<(lite?18:38);i++){
      const z=bayFront-1-random()*25, x=westBay+.6+random()*3.9,y=-1.9-random()*2.1;
      frame.push(pebble(x,y,z,1.1+random(),.6+random(),.8+random(),"#385c61"));
      for(let j=0;j<3;j++)kelp(x+j*.28,y+.77,z+.18*j,1.3+random()*3.2,i*.91+j);
    }
    // Submerged mineral seams pick up the moving surface light at the narrow western end.
    const shafts=M.geometry();
    for(let i=0;i<(lite?24:52);i++){
      const z=-40-random()*84,west=z<bayFront-5?westBay:eastReturn;
      const x=west+random()*(80-west),h=7+random()*13,r=.20+random()*.80;
      face(shafts,[[x-r,TOP-.2,z],[x+r,TOP-.2,z],[x+3+r*2,TOP-h,z-2],[x+3-r*2,TOP-h,z-2]],
        [99,177,179],.83);
    }
    shafts.glassOpacity=.048;shafts.glassGrazing=0;shafts.castShadow=false;
    underside.glass=.55;underside.castShadow=false;
    panes.glassOpacity=.18;panes.twoSided=true;
    const stone=M.merge(rock,...frame);stone.castShadow=false;reef.castShadow=false;panes.castShadow=false;
    const pack=g=>{g.fogPierce=.76;return BL.pokerMarble.staticMesh(g);};
    return {shafts:pack(shafts),stone:pack(stone),reef:pack(reef),underside:pack(underside),panes:pack(panes),surface:pack(water(surface,.16)),falls:falls.map(pack),whale:BL.pokerBlueWhale.geometry(lite)};
  };

  // One circuit per resident per three minutes. Timestamps keep the lunge, flight and return
  // continuous with ordinary swimming. The opening leg passes the bar and the return clears the dry vault.
  const PERIOD=180, INTERVAL=60;
  const course=[[0,21,.8,-54],[11,37,1,-52],[24,51,-3,-64],[36,42,-7,-71],[47,29,-11,-62],
    [52,28,-11,-55.2],[56,32,-9.2,-52.5],[58.5,35.9,-6.45,-51.4],[60,38.2,-1.75,-50.9],
    [61.7,41.6,7.9,-50.3],[63.1,45.2,12.6,-50],[64,47.8,11,-49.9],[65.1,50.9,7,-50],
    [66.2,53.1,.5,-50.3],[68.5,57,-5,-51.4],[76,66,-7,-60],[90,73,-8,-78],[110,57,-6,-109],
    [126,30,-4,-111],[139,4,-2.4,-93],[150,-6,-1.3,-76],[157,0,-.7,-66],[165,12,-.3,-65],[174,17,.5,-60]];
  // Hermite velocities are in metres per second, including across the loop seam.
  const tangents=course.map((p,i)=>{
    const a=course[(i+course.length-1)%course.length],b=course[(i+1)%course.length];
    const dt=(b[0]-a[0]+PERIOD)%PERIOD;
    return [(b[1]-a[1])/dt,(b[2]-a[2])/dt,(b[3]-a[3])/dt];
  });
  const swim=(w,phase,time,turn,calm)=>{
    let i=course.length-1;
    while(i && phase<course[i][0])i--;
    const j=(i+1)%course.length,a=course[i],b=course[j],duration=(b[0]-a[0]+PERIOD)%PERIOD;
    const u=(phase-a[0])/duration, vel=w.velocity, p=w.body.position;
    let ax=0,az=0;
    for(let axis=0;axis<3;axis++){
      const start=a[axis+1],delta=b[axis+1]-start,va=tangents[i][axis]*duration,vb=tangents[j][axis]*duration;
      const h=3*delta-2*va-vb,k=va+vb-2*delta,value=start+u*(va+u*(h+u*k));
      if(axis===0)p.x=value;else if(axis===1)p.y=value;else p.z=value;
      vel[axis]=(va+u*(2*h+3*u*k))/duration;
      const acceleration=(2*h+6*u*k)/(duration*duration);
      if(axis===0)ax=acceleration;else if(axis===2)az=acceleration;
    }
    // A new visit starts underwater throughout the first minute.
    const smooth=BL.pokerWhaleBreach.smooth;
    if(!turn && phase>=52 && phase<76){
      const u=(phase-52)/24;
      p.y=-11+4*smooth(0,1,u);vel[1]=u*(1-u);
    }
    const cruise=1-smooth(45,52,phase)*(1-smooth(70,82,phase));
    p.y+=cruise*(w.lane*.64+.10*Math.sin(time*.94));
    p.z+=cruise*w.lane*1.65;
    const horizontal=Math.hypot(vel[0],vel[2]);
    const tilt=Math.atan2(vel[1],horizontal);
    const turnBank=Math.atan2(vel[0]*az-vel[2]*ax,Math.max(.2,horizontal)*2.4);
    const flop=turn?smooth(61.4,64.9,phase)*(1-smooth(65.6,70.1,phase)):0;
    const effort=.80+.23*Math.sin(time*.22)+.54*smooth(51,57,phase)*(1-smooth(59,61,phase));
    const airborne=turn?smooth(59.7,62,phase)*(1-smooth(65.8,69,phase)):0;
    const gape=turn?smooth(52.2,57.1,phase)*(1-smooth(60.55,61.35,phase)):0;
    const bank=.072*Math.sin(time*.17)+cruise*.30*turnBank+w.side*1.40*flop;
    BL.pokerBlueWhale.pose(w,time,Math.atan2(-vel[2],vel[0]),tilt*(1-.93*flop),bank,gape,effort*(1-.9*airborne),calm);
  };
  const build=lite=>{
    if(!cache.has(lite))cache.set(lite,scenery(lite));
    const g=cache.get(lite),root=S.createNode();
    for(const geom of [g.stone,g.reef,g.panes,g.underside,g.surface,...g.falls])add(root,geom);
    const rays=add(root,g.shafts);
    // Approximately 23 m, 21 m and 16 m nose to fluke in the same coordinates as the Oogas.
    const residents=[1.43,1.32,1.01].map((scale,i)=>{
      const w=BL.pokerBlueWhale.build(root,g.whale,scale);w.side=i===1?-1:1;w.lane=i-1;return w;
    });
    const frontWidth=outline[1][0]-outline[0][0];
    const weirX=outline[0][0]+frontWidth*(frontSpill[0]+frontSpill[1])/2;
    const breach=BL.pokerWhaleBreach.build(root,lite,TOP,outline[0][1],weirX,frontWidth*(frontSpill[1]-frontSpill[0]));
    const guest=BL.pokerBlueWhale.build(root,g.whale,.87);guest.body.visible=false;
    let age=12,peak=0,clock=0;
    const visit=value=>{
      if(value<1e9 || age<12 && value<=peak)return;
      age=0;peak=value;
      const scale=Math.min(1.10,.82+.09*Math.log10(value/1e9));
      guest.body.scale.x=guest.body.scale.y=guest.body.scale.z=scale;
    };
    const update=(dt,time,calm)=>{
      clock+=dt;
      // Lightning brings the school to the surface on the minute. The swim course reaches the surface ten seconds later.
      const turn=Math.floor(clock/INTERVAL)-1,active=turn<0?-1:turn%residents.length;
      for(let i=0;i<residents.length;i++){
        const phase=(clock+PERIOD-10-i*INTERVAL)%PERIOD;
        swim(residents[i],phase,clock+i*2.4,i===active,calm);
      }
      breach.update(clock-(turn+1)*INTERVAL-10,residents[active],calm);
      rays.position.x=calm?0:.38*Math.sin(time*.16);
      age=Math.min(12,age+dt);guest.body.visible=age<12;
      if(guest.body.visible){
        const u=age/12,s=Math.sin(Math.PI*u),c=Math.cos(Math.PI*u),p=guest.body.position;
        p.x=29+32*u;p.y=-14.8+4*s;p.z=-105+5*s;
        BL.pokerBlueWhale.pose(guest,time+.4,-Math.atan2(5*Math.PI*c,32),Math.atan2(4*Math.PI*c,32),.12*s,0,.8,calm);
      }
    };
    update(0,0,false);return {root,visit,update,residents,breach};
  };
  BL.pokerAquarium=Object.freeze({build});
})();
