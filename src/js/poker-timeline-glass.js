// Backlit painted glass with a dated inscription at the foot of each pair.
(() => {
  "use strict";
  const BL=window.BL;
  const chapters=[
    ["OCTOBER 2008","WHITE PAPER"],["JANUARY 2009","GENESIS BLOCK"],
    ["JANUARY 2009","SATOSHI TO HAL"],["MAY 2010","BITCOIN PIZZA"],
    ["NOVEMBER 2012","FIRST HALVING"],["NOVEMBER 2021","TAPROOT"]
  ];
  const M=BL.models,S=BL.scene;
  const canvas=(width,height)=>{
    const c=document.createElement("canvas");c.width=width;c.height=height;return c;
  };
  // Cut the colour filter to the stone opening before adding the opaque museum labels.
  const pane=(img,index,glass,rect)=>{
    const w=img.naturalWidth/3,h=img.naturalHeight/2,tile=canvas(Math.round(w),Math.round(h));
    const c=tile.getContext("2d");
    c.drawImage(img,index%3*w,Math.floor(index/3)*h,w,h,0,0,tile.width,tile.height);
    const size=192,filter=canvas(size,size),ctx=filter.getContext("2d");
    const [left,sill,width,height]=rect,top=sill+height;
    ctx.beginPath();
    for(const {i:ids} of glass.faces){
      for(let i=0;i<ids.length;i++){
        const v=ids[i]*3,x=(glass.verts[v]-left)*size/width,y=(top-glass.verts[v+1])*size/height;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.closePath();
    }
    ctx.clip();ctx.drawImage(tile,0,0,size,size);
    ctx.clearRect(size*(.5-.041/width),0,size*.082/width,size);
    ctx.clearRect(0,size*(1-.07/height),size,size*.07/height);
    const pixels=ctx.getImageData(0,0,size,size),data=pixels.data,colour=[0,0,0];
    let weight=0;
    for(let i=0;i<data.length;i+=4){
      // Dark painted details and the lead absorb most of the incident light.
      const transmission=Math.max(data[i],data[i+1],data[i+2])/255;
      data[i+3]*=transmission;
      const a=data[i+3]/255;weight+=a;
      for(let k=0;k<3;k++)colour[k]+=a*data[i+k];
    }
    ctx.putImageData(pixels,0,0);
    for(let k=0;k<3;k++)colour[k]/=255*Math.max(1,weight);
    c.textAlign="center";c.textBaseline="middle";c.font="bold "+Math.round(h*.030)+"px Georgia, serif";
    for(let i=0;i<2;i++){
      const x=w*(.25+.5*i),y=h*.937;
      c.fillStyle="rgba(36,25,21,.92)";c.fillRect(x-w*.214,y-h*.028,w*.428,h*.056);
      c.strokeStyle="#a78448";c.lineWidth=h*.0025;c.strokeRect(x-w*.214,y-h*.028,w*.428,h*.056);
      c.fillStyle="#f0d791";c.fillText(chapters[index][i],x,y,w*.40);
    }
    return {tile,filter,colour};
  };

  // Bake on fixed receiving surfaces once. Both projections use the same world
  // ray, so a stripe crossing the floor/wall joint keeps its colour and direction.
  const moon=BL.pokerThemes.club.night.moon,dx=-moon.x/moon.y,dz=-moon.z/moon.y;
  const project=(ctx,filter,position,rect,toPixel,rx,rz)=>{
    const side=Math.sign(position.x),[left,sill,width,height]=rect;
    const top=sill+height,z=position.z+side*left;
    const a=toPixel(position.x,top,z,rx,rz),b=toPixel(position.x,top,z+side*width,rx,rz);
    const d=toPixel(position.x,sill,z,rx,rz),size=filter.width;
    ctx.setTransform((b[0]-a[0])/size,(b[1]-a[1])/size,(d[0]-a[0])/size,(d[1]-a[1])/size,a[0],a[1]);
    ctx.drawImage(filter,0,0);
  };
  const bake=(windows,panes,rect,image,toPixel,room,seats,wall)=>{
    const ctx=image.getContext("2d");
    ctx.globalCompositeOperation="lighter";
    for(let i=0;i<windows.length;i++){
      const p=windows[i].position,filter=panes[i].filter;
      if(p.x*moon.x<=0)continue;
      // Integrate a small bright disk. A lead line near the sill stays sharper
      // than the same line several metres further down the ray.
      const count=12;
      ctx.globalAlpha=.64/count;
      for(let j=0;j<count;j++){
        const radius=.041*Math.sqrt((j+.5)/count),angle=j*2.39996323;
        project(ctx,filter,p,rect,toPixel,dx+radius*Math.cos(angle),dz+radius*Math.sin(angle));
      }
    }
    const mask=canvas(image.width,image.height),ink=mask.getContext("2d");
    shadow(ink,room.geometry,0,0,0,toPixel);
    for(const seat of seats)shadow(ink,seat.geometry,seat.x,seat.z,seat.yaw,toPixel);
    ctx.resetTransform();ctx.globalCompositeOperation="destination-out";
    ctx.globalAlpha=1;ctx.filter="blur(.9px)";ctx.drawImage(mask,0,0);
    if(!wall){
      ctx.globalCompositeOperation="lighter";
      // The broad night sky supplies a much weaker wash beneath both rows of windows.
      // Downsample before the blur so lettering and individual panes dissolve into it.
      for(let i=0;i<windows.length;i++){
        const p=windows[i].position,soft=canvas(10,10);
        soft.getContext("2d").drawImage(panes[i].filter,0,0,10,10);
        ctx.globalAlpha=.13;ctx.filter="blur(8px)";
        project(ctx,soft,p,rect,toPixel,-Math.sign(p.x)*.43,.12);
      }
    }
    ctx.resetTransform();ctx.filter="none";ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
  };
  // Project the static tables and chairs onto the receiver along the same rays.
  // Only source-facing polygons contribute so overlapping closed meshes form a union.
  const shadow=(ctx,geometry,px,pz,yaw,toPixel)=>{
    const v=geometry.verts,uv=new Float32Array(v.length/3*2),c=Math.cos(yaw),s=Math.sin(yaw);
    for(let i=0,j=0;i<v.length;i+=3,j+=2){
      const p=toPixel(px+c*v[i]+s*v[i+2],v[i+1],pz-s*v[i]+c*v[i+2],dx,dz);
      uv[j]=p[0];uv[j+1]=p[1];
    }
    const compact=BL.compactGeometry,cursor=compact?.createCursor(geometry);
    ctx.beginPath();
    for(let i=0;i<geometry.faces.length;i++){
      const ids=(compact?compact.readFace(geometry,i,cursor):geometry.faces[i]).i;
      let area=0,highest=-Infinity,lowest=Infinity;
      for(let j=0,prev=ids[ids.length-1];j<ids.length;j++){
        const id=ids[j],h=v[id*3+1];highest=Math.max(highest,h);lowest=Math.min(lowest,h);
        area+=uv[prev*2]*uv[id*2+1]-uv[id*2]*uv[prev*2+1];prev=id;
      }
      // The room mesh also holds the enclosing walls and the floor itself.
      if(area<=0||highest>3.25||lowest<-.001||highest<.10)continue;
      ctx.moveTo(uv[ids[0]*2],uv[ids[0]*2+1]);
      for(let j=1;j<ids.length;j++)ctx.lineTo(uv[ids[j]*2],uv[ids[j]*2+1]);
      ctx.closePath();
    }
    ctx.fill();
  };
  const receive=(parent,g,position,rotation,rect,image)=>{
    g.castShadow=false;
    g.imageSurface={rect,blend:"add",cutout:true,soft:true,bright:.035,fallback:()=>image};
    const node=S.createNode({geometry:g,position,rotation,sightHidden:true});
    S.addChild(parent,node);return node;
  };
  let atlas;
  const layouts=new WeakMap();
  const install=(room,r,group,windows,rect,seats)=>{
    if(typeof Image==="undefined")return;
    if(!atlas)atlas=new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=BL.pokerTimelineArt;
    });
    const width=r.w-.36,depth=r.d-.36,front=depth/2,height=r.h-.20,floorY=BL.pokerFloor.Y;
    atlas.then(img=>{
      if(!img)return;
      let maps=layouts.get(room.geometry);
      if(!maps){
        const panes=windows.map((node,i)=>pane(img,i,node.geometry,rect));
        const floor=canvas(512,Math.round(512*depth/width)),wall=canvas(512,Math.round(512*height/width));
        const floorPixel=(x,y,z,rx,rz)=>[(.5+(x+rx*(y-floorY))/width)*floor.width,(.5+(z+rz*(y-floorY))/depth)*floor.height];
        // The wall faces -z, so its local right is the room's -x.
        const wallPixel=(x,y,z,rx,rz)=>{
          const drop=(front-z)/rz;
          return [(.5-(x+rx*drop)/width)*wall.width,(1-(y-drop)/height)*wall.height];
        };
        bake(windows,panes,rect,floor,floorPixel,room,seats,false);
        bake(windows,panes,rect,wall,wallPixel,room,seats,true);
        maps={floor,wall,panes};layouts.set(room.geometry,maps);
      }
      for(let i=0;i<windows.length;i++){
        const {tile,colour}=maps.panes[i],win=windows[i],p=win.position,o=i*8;
        win.geometry.imageSurface={canvas:tile,rect,version:1,smooth:true,tessellated:true};
        const intensity=p.x*moon.x>0?.64:.29;
        group.lights.set([r.x+p.x-Math.sign(p.x)*.26,r.y+rect[1]+.48,r.z+p.z,6.6,
          intensity*colour[0]*.84,intensity*colour[1]*.94,intensity*colour[2],0],o);
      }
      const ground=M.panel({w:width,h:depth,tilesX:1,tilesY:1,color:"#ffffff"});
      receive(group,ground,{x:0,y:floorY,z:0},{x:-Math.PI/2,y:0,z:0},[-width/2,-depth/2,width,depth],maps.floor);
      // The wool catches the same incident pattern with a softer, darker return.
      const rug=BL.pokerSpeakeasy.rugSize;
      const weave=M.panel({w:rug.w,h:rug.d,tilesX:1,tilesY:1,color:"#ffffff"});
      receive(group,weave,{x:0,y:rug.top+.001,z:rug.z},{x:-Math.PI/2,y:0,z:0},
        [-width/2,-depth/2+rug.z,width,depth],maps.floor).smokeOpacity=.27;
      // Split the receiving plane around the bookcase passage.
      const g=M.geometry();
      for(const [x0,y0,x1,y1] of [[-width/2,0,-1.04,2.70],[1.04,0,width/2,2.70],[-width/2,2.70,width/2,height]]){
        M.face(g,[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(([x,y])=>M.pushVert(g,x,y,0)),[255,255,255]);
      }
      receive(group,g,{x:0,y:0,z:front},{x:0,y:Math.PI,z:0},[-width/2,0,width,height],maps.wall);
    });
  };
  BL.pokerTimelineGlass={install};
})();
