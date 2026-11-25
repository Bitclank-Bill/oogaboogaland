// Small family objects at the hearth, in metres relative to the lounge.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,tau=Math.PI*2;
  const gardenX=-4.76,gardenZ=seat=>seat-2.24;
  const stems=[[-.22,.03,.88],[-.15,-.09,.72],[-.04,.05,.79],[-.08,-.13,.98],[.03,-.06,.64]];
  const perch=[.28,.65,-.12];
  const garden=M.cached(()=>{
    const parts=[],petals=M.geometry(),pads=M.geometry(),seed=BL.math.mulberry32(781);
    const pot=(profile,ink)=>M.lathe({profile,segments:40,color:ink});
    parts.push(pot([[.25,0],[.31,.025],[.42,.19],[.44,.20],[.44,.235],[.415,.245],[.385,.218],[.375,.185]],"#b86a4e"),
      pot([[0,.202],[.397,.202],[.391,.209],[0,.214]],"#60493a"));
    const stem=(x,y,z,xx,yy,zz,w,c)=>parts.push(M.beam(x,y,z,xx,yy,zz,w,c));
    // Creased double-sided petals and finely divided leaves keep each spike light enough to see through.
    const blade=(x,y,z,dx,dy,dz,wx,wy,wz,ink)=>{
      const indices=[[x,y,z],[x+.53*dx+wx,y+.53*dy+wy,z+.53*dz+wz],[x+dx,y+dy,z+dz],
        [x+.53*dx-wx,y+.53*dy-wy,z+.53*dz-wz],[x+.57*dx,y+.57*dy,z+.57*dz+.003]].map(v=>M.pushVert(petals,...v));
      const color=BL.math.hexToRgb(ink);
      for(let i=0;i<4;i++){
        const f=[indices[i],indices[(i+1)%4],indices[4]];
        M.face(petals,f,color,{emissive:.23});M.face(petals,f.slice().reverse(),color,{emissive:.23});
      }
    };
    for(const [x,z,top] of stems){
      stem(x*.72,.205,z*.76,x,top,z,.008,"#5f8052");
      for(let k=0;k<3;k++){
        const a=k*2.38+x*5,c=Math.cos(a),s=Math.sin(a),y=.28+k*.068;
        for(let l=-2;l<=2;l++){
          const b=a+l*.24;
          blade(x+c*.024,y,z+s*.024,.095*Math.cos(b),.043-Math.abs(l)*.009,.095*Math.sin(b),-.006*s,0,.006*c,"#577946");
        }
      }
      for(let k=0;k<9;k++){
        const a=k*2.4,dx=Math.sin(a),dz=Math.cos(a),y=top-.32+k*.04,size=.046-.0027*k;
        const bx=x+dx*size, bz=z+dz*size;
        stem(x,y-.018,z,bx,y,bz,.0045,"#799354");
        // Five petal-like sepals around a pale bee, plus the long backward nectar spur.
        for(let j=0;j<5;j++){
          const angle=j*tau/5,ac=Math.cos(angle),as=Math.sin(angle);
          blade(bx,y,bz,(dz*ac+.32*dx)*size,as*size,(-dx*ac+.32*dz)*size,
            -dz*as*size*.48,ac*size*.48,dx*as*size*.48,["#a58be8","#7163c6","#d2b9ff","#9984d9","#8272d1"][j]);
        }
        blade(bx,y,bz,-dx*size*1.1,size*.66,-dz*size*1.1,.004,0,.004,"#625594");
        blade(bx+.003*dx,y-.005,bz+.003*dz,.007*dx,.010,.007*dz,.005*dz,0,-.005*dx,"#efe9d7");
      }
    }
    const jade=["#618772","#739a7f","#8caf93","#adbea2"].map(c=>BL.math.hexToRgb(c));
    for(const [x,y,z,rx,ry] of [[.19,.31,.09,.111,.135],[.11,.456,.10,.076,.094],[.25,.495,.095,.080,.13],[.31,.62,.10,.049,.067]]){
      BL.hubModels.puff(pads,x,y,z,rx,ry,.031,jade,seed,6,12);
      for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){
        const bx=x+i*rx*.46,by=y+j*ry*.50,bz=z+.031*Math.sqrt(1-i*i*.21-j*j*.25);
        blade(bx,by,bz,.004,.010,.004,.003,0,0,"#dbc99d");
      }
    }
    stem(.31,.212,-.09,.21,.49,-.14,.025,"#82654e");
    stem(.21,.49,-.14,...perch,.014,"#94765a");
    stem(.22,.52,-.14,.135,.60,-.155,.010,"#94765a");
    for(const face of pads.faces)face.emissive=.16;
    return M.merge(...parts,petals,pads);
  });
  const flightStops=seat=>{
    const x=gardenX,z=gardenZ(seat),bloom=i=>[x+stems[i][0]+.176,.036+stems[i][2]-.22-.048,z+stems[i][1]+.040];
    return [bloom(0),[x-.03,.93,z+.47],bloom(2),[x+.30,.90,z+.43],[x+perch[0],.036+perch[1]+.041,z+perch[2]]];
  };
  // Dad's places, then Mom's, sewn on one label with a row of stitches between them.
  const dad=["I was born in Minneapolis.","I was a boy in Pendleton.","And in Scottsdale, I became your dad."];
  const mom=["I grew up in Traverse City, by the bay.","And in Scottsdale, I became your mom."];
  const stitch=(ctx,w,h)=>{
    ctx.save();ctx.scale(w/1000,h/1200);ctx.translate(239,10);ctx.rotate(Math.PI/2);
    ctx.fillStyle="#dfd2b6";ctx.fillRect(0,0,450,184);
    ctx.strokeStyle="#8d7857";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(6,6,438,172);
    ctx.beginPath();ctx.moveTo(60,112);ctx.lineTo(390,112);ctx.stroke();
    ctx.font="italic 23px Georgia, serif";ctx.fillStyle="#403729";ctx.textAlign="center";
    dad.forEach((s,i)=>ctx.fillText(s,225,38+i*28,422));
    ctx.fillStyle="#4b3a5e";mom.forEach((s,i)=>ctx.fillText(s,225,138+i*28,422));ctx.restore();
  };
  const sleeve=M.cached(()=>{
    const w=.32,g=M.panel({w,h:w,tilesX:1,tilesY:1,color:"#ddcaa0"});
    const canvas=document.createElement("canvas");canvas.width=canvas.height=384;
    const c=canvas.getContext("2d");c.fillStyle="#dfd2b4";c.fillRect(0,0,384,384);
    c.strokeStyle="#9a8868";c.strokeRect(14,14,356,356);
    c.lineWidth=2;c.strokeStyle="#6c776c";
    for(let i=0;i<3;i++){
      c.beginPath();c.moveTo(22,168+i*9);c.bezierCurveTo(72,150+i*7,108,97+i*20,174,143+i*13);
      c.bezierCurveTo(228,168+i*8,246,95+i*15,362,124+i*13);c.stroke();
    }
    for(let i=0;i<7;i++){
      c.beginPath();c.moveTo(228+i*3,163);c.bezierCurveTo(8+i*5,195,340-i*8,218,49+i*13,277);c.stroke();
    }
    c.strokeStyle="#67513d";c.lineWidth=5;c.beginPath();c.moveTo(94,227);c.quadraticCurveTo(167,179,246,210);c.stroke();
    for(let i=0;i<8;i++){const x=97+i*20,y=225-23*Math.sin(i*Math.PI/7)-2*i;c.fillRect(x,y-14,3,17);}
    c.lineWidth=2;c.beginPath();c.moveTo(95,211);c.quadraticCurveTo(167,163,246,194);c.stroke();
    c.fillStyle="#493f35";c.font="italic 29px Georgia, serif";c.textAlign="center";c.fillText("Pendleton, from Dad",192,326);
    g.imageSurface={canvas,rect:[-w/2,-w/2,w,w],smooth:true,version:1};return g;
  });
  // Traverse City, from Mom: a little Great Lakes lighthouse on a stone plinth, white with red bands, its lantern
  // turning. The lamp is her light, as the rose window's sun is: it swells each day at the minute Jones was born.
  const LIGHT_Y=.505;
  const lighthouse=M.cached(()=>{
    const turn=(profile,color,emissive=0)=>M.lathe({profile,segments:28,color,emissive});
    const tower=(y0,y1,color)=>{const r=y=>.085-(y-.06)*.06;return turn([[0,y0],[r(y0),y0],[r(y1),y1],[0,y1]],color);};
    const parts=[turn([[0,0],[.14,0],[.14,.04],[.125,.06],[0,.06]],"#8f8a82"),
      tower(.06,.17,"#f1ece2"),tower(.17,.21,"#b8322a"),tower(.21,.33,"#f1ece2"),tower(.33,.37,"#b8322a"),tower(.37,.46,"#f1ece2"),
      turn([[0,.46],[.084,.46],[.084,.472],[0,.472]],"#2d2a2c"),
      turn([[0,.540],[.066,.540],[0,.598]],"#b8322a"),turn([[0,.596],[.008,.6],[.006,.614],[0,.618]],"#2d2a2c")];
    for(let i=0;i<6;i++){const a=i*Math.PI/3;parts.push(M.beam(.048*Math.cos(a),.472,.048*Math.sin(a),.048*Math.cos(a),.54,.048*Math.sin(a),.006,"#2d2a2c"));}
    for(let i=0;i<12;i++){const a=i*Math.PI/6;parts.push(M.beam(.08*Math.cos(a),.472,.08*Math.sin(a),.08*Math.cos(a),.494,.08*Math.sin(a),.004,"#2d2a2c"));}
    parts.push(M.box({w:.034,h:.06,d:.01,color:"#5a3e2c",offset:{x:0,y:.09,z:.081}}),
      M.box({w:.016,h:.024,d:.008,color:"#3a4a5a",offset:{x:0,y:.27,z:.072}}),M.box({w:.016,h:.024,d:.008,color:"#3a4a5a",offset:{x:0,y:.41,z:.066}}));
    return M.merge(...parts);
  });
  const lamp=M.cached(()=>M.lathe({profile:[[0,-.03],[.026,-.022],[.03,0],[.026,.022],[0,.03]],segments:16,color:"#ffe6a0",emissive:1}));
  const lens=M.cached(()=>M.merge(...[-1,1].map(s=>M.box({w:.006,h:.034,d:.026,color:"#fff6d0",emissive:1,offset:{x:s*.034,y:0,z:0}}))));
  const note=["I grew up by Grand Traverse Bay, where lighthouses keep watch so the boats can always find their way home.",
    "Wherever you go, Jones, I’ll keep a light on for you.","Love, Mom"];
  // Petoskey stones from Grand Traverse Bay in a glazed dish before the lighthouse. Dry they are plain grey pebbles;
  // wet them and the six-sided fossil coral shows, then they dry back. One canvas paints both at `wet` 0 to 1.
  const STONES=[[-.062,.036,.052,.040],[.048,.052,.046,.036],[.058,-.040,.050,.041],[-.040,-.052,.044,.036],[.0,.0,.040,.034]];
  const STONE_R=.13,STONE_PX=256,WET_STEPS=16;
  const stoneCanvas=()=>{const c=document.createElement("canvas");c.width=c.height=STONE_PX;return c;};
  const paintStones=(c,wet)=>{
    const ctx=c.getContext("2d"),px=v=>(v/STONE_R*.5+.5)*STONE_PX,rand=BL.math.mulberry32(4471);
    ctx.fillStyle="#8a8478";ctx.fillRect(0,0,STONE_PX,STONE_PX);
    const mix=(a,b)=>a.map((v,i)=>Math.round(v+(b[i]-v)*wet));
    for(const [x,y,rx,ry] of STONES){
      const cx=px(x),cy=px(-y),ex=rx/STONE_R*.5*STONE_PX,ey=ry/STONE_R*.5*STONE_PX;
      ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,ex,ey,0,0,2*Math.PI);ctx.clip();
      const base=mix([190,184,172],[120,112,98]);ctx.fillStyle=`rgb(${base})`;ctx.fillRect(cx-ex,cy-ey,2*ex,2*ey);
      for(let i=0;i<40;i++){const g=mix([205,199,188],[132,124,110]);ctx.fillStyle=`rgba(${g},.5)`;ctx.beginPath();
        ctx.arc(cx+(rand()-.5)*2*ex,cy+(rand()-.5)*2*ey,1+rand()*3,0,2*Math.PI);ctx.fill();}
      if(wet>0){
        // The corallites: six-sided cells with pale walls, a dark eye and fine rays out to the walls.
        ctx.globalAlpha=wet;const cell=7.5,h=cell*Math.sqrt(3);
        for(let row=-6;row<=6;row++)for(let col=-6;col<=6;col++){
          const hx=cx+col*cell*1.5,hy=cy+row*h+(col%2?h/2:0);
          if(Math.hypot((hx-cx)/ex,(hy-cy)/ey)>1.15)continue;
          ctx.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;ctx.lineTo(hx+cell*Math.cos(a),hy+cell*Math.sin(a));}
          ctx.closePath();ctx.fillStyle="#6e6556";ctx.fill();ctx.strokeStyle="#d9ccb1";ctx.lineWidth=1.4;ctx.stroke();
          ctx.strokeStyle="rgba(214,201,176,.55)";ctx.lineWidth=.6;
          for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+cell*.8*Math.cos(a),hy+cell*.8*Math.sin(a));ctx.stroke();}
          ctx.fillStyle="#2f2a24";ctx.beginPath();ctx.arc(hx,hy,cell*.26,0,2*Math.PI);ctx.fill();
        }
        // The water's gloss along the top of each stone.
        ctx.globalAlpha=.35*wet;ctx.fillStyle="#ffffff";ctx.beginPath();ctx.ellipse(cx-ex*.25,cy-ey*.35,ex*.45,ey*.16,-.3,0,2*Math.PI);ctx.fill();
        ctx.globalAlpha=1;
      }
      ctx.restore();
    }
  };
  const stones=M.cached(()=>{
    const g=M.geometry(),white=[255,255,255];
    for(const [x,y,rx,ry] of STONES){
      const rings=6,sides=18,top=Math.min(rx,ry)*.55,ids=[];
      for(let i=0;i<=rings;i++){
        const phi=i/rings*Math.PI/2,row=[];
        for(let j=0;j<sides;j++){const t=j/sides*2*Math.PI;row.push(M.pushVert(g,x+rx*Math.sin(phi)*Math.cos(t),y+ry*Math.sin(phi)*Math.sin(t),top*Math.cos(phi)));}
        ids.push(row);
      }
      for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const k=(j+1)%sides;M.face(g,[ids[i][j],ids[i+1][j],ids[i+1][k],ids[i][k]],white,{emissive:.12});}
    }
    g.smooth=true;g.castShadow=false;return g;
  });
  const dish=M.cached(()=>M.lathe({profile:[[0,0],[.12,0],[.16,.012],[.175,.045],[.165,.05],[.15,.022],[0,.018]],segments:36,color:"#3f6f8c"}));
  const stoneNote=["Petoskey stones, from Grand Traverse Bay, where Mom grew up.",
    "Dry, they look like plain grey pebbles. Wet them, and you can see tiny six-sided corals that lived in a warm sea here long, long ago, before there were any people at all."];
  const plank=(x,y,z,w,h,d,color)=>M.bevelBox({w,h,d,color,bevel:.004,offset:{x,y,z}});
  // The bridge stands on Mom's bank and Dad's: each pier has its word burned into both faces in the carved signs'
  // alphabet, one dark run a row a quad standing a hair proud of the wood, so it reads from either side.
  const burn=(word,x,y,face)=>{
    const G=BL.hubModels.SIGN_GLYPHS,cell=.0085,width=(word.length*4-1)*cell,parts=[];
    for(let i=0;i<word.length;i++){
      const glyph=G[word[i]],sx=3/glyph[0].length;
      for(let r=0;r<5;r++)for(let c=0;c<glyph[r].length;c++){
        if(glyph[r][c]!=="1" || c>0 && glyph[r][c-1]==="1")continue;
        let e=c;while(e<glyph[r].length-1 && glyph[r][e+1]==="1")e++;
        const x0=-width/2+(i*4+c*sx)*cell,w=(e-c+1)*sx*cell;
        parts.push(M.box({w,h:cell,d:.002,color:"#4e321f",offset:{x:x0+w/2,y:(2-r)*cell,z:0}}));
      }
    }
    const letters=M.merge(...parts);
    if(face<0)M.turnedY(letters,Math.PI);
    return M.moved(letters,x,y,face*.0855);
  };
  // Her larkspur inlaid on the outer face of Mom's pier, the face toward her bank: a leaning stem, two leaves, and
  // florets in her violets shrinking up the spike.
  const sprig=()=>{
    const x=-.23-.0555,parts=[M.beam(x,.034,.012,x,.122,-.006,.0045,"#5f8a4e"),
      M.beam(x,.046,.010,x,.066,.034,.004,"#6f9a5a"),M.beam(x,.052,.009,x,.070,-.020,.004,"#6f9a5a")];
    const violets=["#9a7fe0","#b9a0f0","#8a6fd8","#c9adf5","#a58be8"];
    for(let f=0;f<6;f++){
      const t=f/5,y=.068+t*.052,z=.0075-t*.012,size=.0135-f*.0013;
      for(const side of [-1,1])parts.push(M.box({w:.002,h:size*.8,d:size*.7,color:violets[(f+(side>0?1:0))%5],emissive:.3,offset:{x,y,z:z+side*size*.42}}));
      parts.push(M.box({w:.0024,h:size*.34,d:size*.34,color:"#efe6ff",emissive:.3,offset:{x,y,z}}));
    }
    return M.merge(...parts);
  };
  const piers=M.cached(()=>M.merge(...[-1,1].flatMap(s=>[
    plank(s*.23,.065,0,.11,.13,.17,"#ba8d58"),plank(s*.23,.015,0,.146,.03,.195,"#9c7048"),
    ...[-1,1].map(face=>burn(s<0?"MOM":"DAD",s*.23,.078,face))
  ]),sprig()));
  const span=M.cached(()=>{
    const p=[],height=x=>.013+.066*(1-(x/.265)**2);
    for(let i=0;i<12;i++){
      const x=-.265+(i+.5)*.53/12;
      p.push(M.moved(M.turnedZ(plank(0,0,0,.046,.025,.166,i%3===1?"#cba477":"#bc9366"),Math.atan(-1.88*x)),x,height(x),0));
    }
    for(const s of [-1,1]){
      for(let i=0;i<=4;i++){
        const x=-.25+i*.125,y=height(x);
        p.push(plank(x,y+.035,s*.073,.012,.07,.012,"#935e39"));
        if(i<4)p.push(M.beam(x,y+.069,s*.073,x+.125,height(x+.125)+.069,s*.073,.012,"#a36d45"));
      }
    }
    p.push(plank(0,.174,-.074,.035,.049,.032,"#edb453"),plank(0,.201,-.074,.045,.009,.041,"#775534"));
    return M.merge(...p);
  });
  const bridgeShade=M.cached(()=>{
    const w=.68,h=.62,g=M.panel({w,h,tilesX:1,tilesY:1,color:"#594936"});
    const canvas=document.createElement("canvas");canvas.width=240;canvas.height=180;
    const c=canvas.getContext("2d");c.fillStyle="rgba(32,24,23,.34)";c.filter="blur(3px)";
    c.beginPath();c.moveTo(23,172);c.lineTo(23,86);c.quadraticCurveTo(120,16,217,86);
    c.lineTo(217,172);c.lineTo(184,172);c.lineTo(184,111);c.quadraticCurveTo(120,71,56,111);c.lineTo(56,172);c.fill();
    g.imageSurface={canvas,rect:[-w/2,-h/2,w,h],smooth:true,blend:"alpha",soft:true,version:1};g.castShadow=false;return g;
  });
  const install=(room,r,kit,items,blanket,record)=>{
    const {add,item}=kit,seat=BL.pokerLoungeStone.seatZ(r);
    add(room,garden(),gardenX,.036,gardenZ(seat));
    const jacket=item("Pendleton, from Dad",sleeve(),-BL.pokerLoungeStone.sideTableX-.22,
      BL.pokerLoungeStone.sideTableTop+.167,BL.pokerLoungeStone.sideTableZ(r)-.29,record.open);
    jacket.rotation.x=-.19;jacket.rotation.y=.16;
    items.push({title:"The sewn blanket label",node:blanket,anchor:blanket.parent.position,reach:.76,
      open:ui=>{ui.element("p",dad.join(" "));ui.element("p",mom.join(" "));}});
    const tower=item("Traverse City, from Mom",lighthouse(),-BL.pokerLoungeStone.sideTableX-1.02,.037,BL.pokerLoungeStone.sideTableZ(r)+.12,
      ui=>{for(const line of note)ui.element("p",line);});
    tower.scale.x=tower.scale.y=tower.scale.z=1.5;
    const beacon=add(tower,lamp(),0,LIGHT_Y,0),flash=add(tower,lens(),0,LIGHT_Y,0);
    // The stones wet on Action and dry back after a while; once wet, Action reads them (`act`, `actLabel`).
    const bowl=item("Petoskey stones",dish(),-BL.pokerLoungeStone.sideTableX-1.02,.037,BL.pokerLoungeStone.sideTableZ(r)+.58,
      ui=>{for(const line of stoneNote)ui.element("p",line);});
    const stoneGeo=stones(),pebbles=add(bowl,stoneGeo,0,.02,0);pebbles.rotation.x=-Math.PI/2;
    let wet=0,wetFor=0,shownWet=-1;
    const stoneCanvasEl=typeof document==="undefined"?null:stoneCanvas();
    const showWet=()=>{
      const step=Math.round(wet*WET_STEPS);
      if(!stoneCanvasEl || step===shownWet)return;
      shownWet=step;paintStones(stoneCanvasEl,step/WET_STEPS);
      if(!stoneGeo.imageSurface)stoneGeo.imageSurface={canvas:stoneCanvasEl,rect:[-STONE_R,-STONE_R,2*STONE_R,2*STONE_R],smooth:true,version:1};
      else stoneGeo.imageSurface.version++;
    };
    showWet();
    const stoneProp=items[items.length-1];
    stoneProp.actLabel=()=>wet<.5?"WET THE STONES":null;
    stoneProp.act=()=>{if(wet>=.5)return null;wetFor=24;return "The stones come alive: tiny six-sided corals, millions of years old.";};
    const x=-.78,z=seat-3.32,feet=item("Jones’s wooden bridge",piers(),x,.037,z,null);
    const prop=items[items.length-1],arch=add(feet,span()),shade=add(feet,bridgeShade(),0,.002,.29);
    shade.rotation.x=-Math.PI/2;shade.rotation.z=Math.PI;
    let from=0,to=0,age=1,onLand=null;
    const pose=u=>{
      arch.position.z=.23*(1-u);arch.position.y=.014+.12*u+.095*Math.sin(Math.PI*u);
      arch.rotation.y=-.31*(1-u);shade.visible=u>.02;shade.scale.y=Math.max(.02,u);shade.position.z=.29*u;
    };
    pose(0);prop.extraTarget=arch;prop.reach=1.05;
    prop.use=land=>{if(age<1)return false;from=to;to=1-to;age=0;onLand=land;return true;};
    prop.built=()=>to===1;
    let sweep=0;
    return (dt,calm,silent=false)=>{
      if(!calm){
        const light=BL.pokerBirthSky.light(Date.now());
        sweep=(sweep+dt*(.7+.5*light))%tau;flash.rotation.y=sweep;
        beacon.glow=flash.glow=.8+1.2*light;beacon.scale.x=beacon.scale.y=beacon.scale.z=1+.25*light;
        // Wetting takes a moment to soak in; drying takes longer.
        if(wetFor>0){wetFor-=dt;wet=Math.min(1,wet+dt/.6);}
        else if(wet>0)wet=Math.max(0,wet-dt/20);
        showWet();
      }
      if(age>=1)return;
      age=calm?1:Math.min(1,age+dt/.94);
      const t=age*age*(3-2*age);pose(from+(to-from)*t);
      if(age===1){if(!silent)onLand(to);onLand=null;}
    };
  };
  BL.pokerLoungeFamily={install,stitch,flightStops,gardenX,gardenZ};
})();
