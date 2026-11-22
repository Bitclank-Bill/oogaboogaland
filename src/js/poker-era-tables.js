// Poker eras are dressing at the rail. All nine seats and all card positions belong to the ordinary table.
(() => {
  "use strict";
  const BL=window.BL, M=BL.models, tau=Math.PI*2;
  const gold="#ce9b50", ink="#1b3030", ivory="#ffdfa0", copper="#926044";
  const box=(x,y,z,w,h,d,color,emissive=0)=>M.box({w,h,d,color,emissive,offset:{x,y,z}});
  const disc=(x,y,z,r,h,color,n=16,emissive=.18)=>M.moved(M.lathe({segments:n,profile:[[0,0],[r,0],[r,h],[0,h]],color,emissive}),x,y,z);
  const polygon=(g,points,color,emissive=.1)=>M.face(g,points.map(p=>M.pushVert(g,...p)),BL.math.hexToRgb(color),{emissive});
  const text=(value,cell,x,y,z)=>{
    const g=BL.poolModels.carve(value,{cell,color:ivory,emissive:.88}).geometry;
    if(value.includes(".") && !BL.hubModels.SIGN_GLYPHS["."]){
      const dot=box(8*cell+.5*cell,-4*cell,.16,cell,cell,.08,ivory,.88);
      const joined=M.merge(g,dot);
      return centerText(joined,x,y,z);
    }
    return centerText(g,x,y,z);
  };
  const centerText=(g,x,y,z)=>{
    const b=BL.scene.boundsOf(g);
    return M.moved(g,x-b.center[0],y-b.center[1],z-b.min[2]);
  };
  const names={0:"SATOSHI",4:"PIZZA DAY",9:"MT. GOX"};
  const sign=index=>{
    const p=[],front=[text("TABLE "+(index+1),.039,0,1.49,.081),text(names[index],.049,0,1.22,.081)];
    for(const x of [-.68,.68]){
      p.push(disc(x,0,0,.17,.055,gold,10),box(x,.54,0,.057,1.02,.057,copper));
    }
    p.push(box(0,1.37,0,1.91,.65,.14,gold),box(0,1.37,0,1.85,.585,.155,ink));
    for(const z of [-.08,.08])p.push(box(0,1.365,z,1.66,.012,.012,gold,.34));
    for(let i=-3;i<=3;i++)p.push(box(i*.085,1.70,0,.055,.31-Math.abs(i)*.055,.07,gold,.2));
    const face=M.merge(...front);
    p.push(face,M.turnedY(M.merge(face),Math.PI));
    return M.merge(...p);
  };
  // Outer-felt details sit above the ring's plane but outside the card and chip positions.
  const decoration=(index,lite,chair)=>{
    const p=[],g=M.geometry(),n=lite?32:64;
    const edge=(a,r,y)=>[Math.cos(a)*1.95*r,y,Math.sin(a)*1.25*r];
    if(index===0){
      for(let k=0;k<12;k++){
        const a=k*tau/12, pts=[edge(a,.90,.789),edge(a+.10,.90,.789),edge(a+.14,.95,.789),edge(a+.31,.95,.789)];
        for(let j=1;j<pts.length;j++)p.push(M.beam(...pts[j-1],...pts[j],.012,gold));
        const [x,y,z]=pts[0];p.push(disc(x,y,z,.026,.006,gold,8));
      }
      p.push(box(0,.91,-1.39,.43,.16,.06,gold),box(0,.91,-1.35,.395,.131,.027,ink),text("0",.021,0,.91,-1.33));
      // A separate empty founder's chair behind the players, with a fan crest and a reading light.
      const arm=[chair,box(0,.93,-.29,.79,.85,.12,"#3d2b23"),box(0,.94,-.21,.69,.74,.10,"#33262a")];
      for(const x of [-.39,.39])arm.push(box(x,.65,0,.10,.09,.65,gold));
      const medal=M.turnedX(disc(0,0,0,.255,.022,gold,24),Math.PI/2);
      arm.push(M.moved(medal,0,.98,-.155),text("B",.065,0,.98,-.13),box(-.035,.98,-.137,.014,.43,.015,gold),box(.043,.98,-.137,.014,.43,.015,gold));
      for(let k=-3;k<=3;k++)arm.push(box(k*.10,1.34,-.28,.084,.19-.033*Math.abs(k),.10,gold));
      const cx=-2.8,cz=-2.76;
      p.push(disc(cx,.005,cz,.78,.11,"#382a26",24),disc(cx,.108,cz,.78,.025,gold,24),M.moved(M.turnedY(M.merge(...arm),.4),cx,.14,cz));
      p.push(box(cx-.83,.58,cz,.055,1.16,.055,gold),disc(cx-.83,.02,cz,.20,.06,gold),disc(cx-.83,1.14,cz,.22,.12,"#ffdd95",12,.82));
    }else if(index===4){
      // Alternating enamel diamonds, then eight separated slices on a low peel at the dealer-side corner.
      for(let k=0;k<n;k++){
        const a=k*tau/n,b=(k+1)*tau/n,m=(a+b)/2;
        polygon(g,[edge(a,.94,.790),edge(m,.975,.790),edge(b,.94,.790),edge(m,.905,.790)].reverse(),k%2?"#e1bf96":"#ab4634");
      }
      const x=-1.31,z=-.92,y=.92,r=.42;
      p.push(disc(x,y-.052,z,r+.055,.035,gold,32),box(x-.38,y-.032,z,.44,.028,.088,gold));
      for(let i=0;i<8;i++){
        const a=i*tau/8+.024,b=(i+1)*tau/8-.024,m=(a+b)/2;
        const point=(ang,rad,h)=>[x+rad*Math.cos(ang),y+h,z+rad*Math.sin(ang)];
        polygon(g,[point(m,.029,0),point(b,r,0),point(m,r,0),point(a,r,0)],"#d99738",.30);
        polygon(g,[point(a,r-.062,.009),point(b,r-.062,.009),point(b,r,.009),point(m,r,.009),point(a,r,.009)],"#bd6e30");
        for(const [angle,rad,size] of [[m,.25,.045],[a+.18,.33,.035]]){
          const [px,py,pz]=point(angle,rad,.009);p.push(disc(px,py,pz,size,.012,"#a63c28",8,.30));
        }
      }
    }else{
      // Outside each broken slab the seam moves sideways before reaching the rim. Brass dogs bridge the fault.
      const shades=["#37413c","#41403a","#263635","#3c4039"],count=lite?16:28;
      const side=(a,y,scale)=>[2.25*scale*Math.cos(a),y,1.535*scale*Math.sin(a)];
      for(let i=0;i<count;i++){
        const a=i*tau/count,b=(i+1)*tau/count, k=(i%3-1)*.041, j=((i+1)%3-1)*.041;
        const hi=side(a,.765,1),mid=side(a+k,.68,1.01),lo=side(a-k,.55,.98);
        polygon(g,[hi,side(b,.765,1),side(b+j,.68,1.01),mid],shades[i%4]);
        polygon(g,[mid,side(b+j,.68,1.01),side(b-j,.55,.98),lo],shades[(i+1)%4]);
        if(i%3===0){
          p.push(M.beam(...hi,...mid,.022,"#171719"),M.beam(...mid,...lo,.023,"#171719"));
          for(const h of [.626,.715])p.push(M.beam(...side(a-.046,h,1.017),...side(a+.046,h,1.017),.028,gold));
        }
      }
      // A band of split slate also reads above the rail from a seated eye. Each brass staple straddles a seam.
      const stone=(a,r)=>edge(a,r,.796);
      for(let k=0;k<count;k++){
        const a=k*tau/count,b=(k+1)*tau/count;
        polygon(g,[stone(a,.995),stone(a+.019,.94),stone(b+.014,.94),stone(b-.005,.995)],shades[k%4],.17);
        if(k%3===1){
          const a0=stone(a-.028,.966),a1=stone(a+.044,.966);
          p.push(M.beam(...a0,...a1,.020,gold));
          for(const pt of [a0,a1])p.push(disc(pt[0],.798,pt[2],.016,.008,copper,6));
        }
      }
      for(let k=0;k<6;k++){
        const x=.57+k*.135,z=.986-k*.072;
        p.push(M.beam(x,.794,z,x+.135,.794,z,.014,gold),M.beam(x+.135,.794,z,x+.135,.794,z-.072,.014,gold));
      }
    }
    return M.merge(g,...p);
  };
  BL.pokerEraTables=Object.freeze({names,sign,decoration});
})();
