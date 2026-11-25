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
  const lines=["I was born in Minneapolis.","I was a boy in Pendleton.","And in Scottsdale, I became your dad."];
  const stitch=(ctx,w,h)=>{
    ctx.save();ctx.scale(w/1000,h/1200);ctx.translate(183,10);ctx.rotate(Math.PI/2);
    ctx.fillStyle="#dfd2b6";ctx.fillRect(0,0,450,128);
    ctx.strokeStyle="#8d7857";ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(6,6,438,116);
    ctx.font="italic 23px Georgia, serif";ctx.fillStyle="#403729";ctx.textAlign="center";
    lines.forEach((s,i)=>ctx.fillText(s,225,40+i*28,422));ctx.restore();
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
  const plank=(x,y,z,w,h,d,color)=>M.bevelBox({w,h,d,color,bevel:.004,offset:{x,y,z}});
  const piers=M.cached(()=>M.merge(...[-1,1].flatMap(s=>[
    plank(s*.23,.065,0,.11,.13,.17,"#ba8d58"),plank(s*.23,.015,0,.146,.03,.195,"#9c7048")
  ])));
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
      open:ui=>ui.element("p",lines.join(" "))});
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
    return (dt,calm,silent=false)=>{
      if(age>=1)return;
      age=calm?1:Math.min(1,age+dt/.94);
      const t=age*age*(3-2*age);pose(from+(to-from)*t);
      if(age===1){if(!silent)onLand(to);onLand=null;}
    };
  };
  BL.pokerLoungeFamily={install,stitch,flightStops,gardenX,gardenZ};
})();
