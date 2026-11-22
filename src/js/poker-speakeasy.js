// Cabinet at the Whitepaper Bar and the joinery, copper prints and cipher table behind it.
(() => {
  "use strict";
  const BL = window.BL, M = BL.models, S = BL.scene;
  const walnut = "#563529", burl = "#774b36", brass = "#bd894d", copper = "#dd975c";
  const ink = "#28201f", leather = "#733937", green = "#234c41", ivory = "#ffdc97";
  const box = (x,y,z,w,h,d,color,emissive=0) => M.box({w,h,d,color,emissive,offset:{x,y,z}});
  const turned = (x,y,z,profile,color,segments,emissive=0) =>
    M.moved(M.lathe({profile,color,segments,emissive}),x,y,z);
  const mark = (x,y,z,h) => M.moved(BL.factoryModels.smoothBitcoin(h,.024,copper,.55),x,y,z);
  const lamp = (x,y,z) => M.merge(
    turned(x,y,z,[[0,0],[.19,0],[.2,.045],[.09,.09],[.038,.16],[.038,.43],[.09,.47]],brass,8),
    turned(x,y,z,[[.29,.46],[.29,.50],[.14,.71],[.054,.73],[0,.75]],ivory,8,.88),
    turned(x,y,z,[[.296,.46],[.296,.49]],brass,8,.24));
  // Copperplate silhouettes. Each horizontal ink stroke is a single face on its plate.
  const portraits = [
    ["    xxxx    ","   xxxxxxx  ","  xxooooox  ","  xoooooox  ","  xoxxoxxx  ","  oooxooxo  ","   ooxoox   ","   oooxxo   ","    oooo    ","   xxooox   ","  xxxooxxx  "," xxxxxxxxxx "],
    ["    oooo    ","   oooooo   ","  xoooooox  ","  xoooooox  ","  oxoooxxo  ","  ooooxoox  ","   ooooox   ","   ooxxxo   ","    oooo    ","   oxooxo   ","  oxooxxxo  "," xxxoxxoxxx "],
    ["    xxxx    ","  xxxxxxxx  ","  xxooooox  ","  xxooooox  ","  xxoxxxoxo ","  xooxoooxo ","  xxoooxox  ","  xxooooox  ","  xxxoooxx  ","   xxooxx   ","  oxoooxxo  "," xoxxxxxxxx "]
  ];
  const print = (index,x,y,z,yaw) => {
    const strokes = M.geometry(), size=.072;
    portraits[index].forEach((row,j) => {
      for (let i=0;i<row.length;) {
        const start=i, c=row[i++]; while(i<row.length && row[i]===c) i++;
        if(c===" ") continue;
        const l=(start-6)*size, r=(i-6)*size, t=(6-j)*size, b=t-size*.89;
        M.face(strokes,[[l,b],[r,b],[r,t],[l,t]].map(([u,v])=>M.pushVert(strokes,u,v,.093)),
          BL.math.hexToRgb(c==="o"?"#e6ae77":"#603628"),{emissive:.32});
      }
    });
    const frame=M.merge(box(0,0,0,1.16,1.32,.12,brass),box(0,0,.067,1.03,1.19,.032,"#b87c50",.23),
      strokes,box(0,-.53,.089,.31,.028,.015,brass),box(0,.74,.14,.56,.07,.29,brass),
      box(0,.702,.19,.46,.013,.14,ivory,.9));
    return M.moved(M.turnedY(frame,yaw),x,y,z);
  };
  const table = lite => {
    const parts=[], ring=(profile,color)=>parts.push(turned(0,0,0,profile,color,8));
    ring([[0,.05],[.78,.05],[.8,.12],[.60,.19],[.43,.23],[.40,.64],[1.46,.73]],walnut);
    ring([[1.46,.69],[1.65,.73],[1.65,.78],[0,.78]],brass);
    ring([[1.64,.77],[1.69,.82],[1.66,.89],[1.58,.92],[1.44,.90],[1.41,.854]],leather);
    ring([[0,.84],[1.425,.84],[1.425,.863],[0,.863]],green);
    for(const radius of [.34,.55,.62,1.3]) parts.push(M.moved(M.torus(radius,.009,brass,.33,32,4),0,.869,0));
    const glyph=BL.factoryModels.smoothBitcoin(.38,.014,brass,.36);
    parts.push(M.moved(M.turnedX(glyph,-Math.PI/2),0,.878,0));
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16, x=Math.cos(a),z=Math.sin(a), outer=i%4?.58:.615;
      parts.push(M.beam(.555*x,.875,.555*z,outer*x,.875,outer*z,.013,copper));
    }
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4, b=a+Math.PI/4;
      for(let j=1;j<=(lite?3:6);j++){
        const f=j/(lite?4:7), x=(1-f)*Math.cos(a)+f*Math.cos(b), z=(1-f)*Math.sin(a)+f*Math.sin(b);
        parts.push(M.beam(1.55*x,.916,1.55*z,1.55*x+.041*(Math.cos(b)-Math.cos(a)),.916,1.55*z+.041*(Math.sin(b)-Math.sin(a)),.012,"#d4ab86"));
      }
    }
    for(const [x,z,count] of [[-.79,.49,4],[-.65,.54,2],[.83,-.53,3]]) for(let i=0;i<count;i++){
      const y=.867+.027*i;
      parts.push(turned(x,y,z,[[0,0],[.077,0],[.077,.022],[.061,.026],[0,.026]],i%2?ivory:copper,8,.24));
    }
    return M.merge(...parts);
  };
  const interior = (lite,w,d) => {
    const parts=[table(lite)], a=w/2, wallZ=-d/2, k=BL.pokerMarble;
    // Panel mouldings, a chair rail and warm copper stitching catch the practical lamps.
    parts.push(box(0,2.24,wallZ+.115,w-.08,4.45,.04,"#29453b",.24));
    for(const side of [-1,1]){
      for(let j=0;j<8;j++){
        const z=wallZ+1.1+j*2.2;
        parts.push(box(side*(a-.14),2.87,z,.055,2.99,2.04,"#335146",.27),
          box(side*(a-.18),.71,z,.09,1.15,2.02,walnut),box(side*(a-.24),.70,z,.04,.91,1.78,"#674236"));
      }
      // Quarter-sawn panels, stepped picture frames and scalloped velvet acoustic lining.
      for(let j=0;j<8;j++){
        const z=wallZ+(j+.5)*d/8;
        for(let k=0;k<(lite?3:7);k++){
          const zz=z+(k/(lite?2:6)-.5)*1.66;
          parts.push(M.beam(side*(a-.27),.25,zz,side*(a-.27),1.16,zz+.047*Math.sin(k+j),.015,k%3?"#593a2b":"#875736"));
        }
        for(let k=-3;k<=3;k++) parts.push(box(side*(a-.23-.033*Math.cos(k)),2.74,z+k*.25,.091,2.53,.21,k%2?"#493138":"#55343b"));
      }
      for(const y of [.15,1.34,4.21])parts.push(box(side*(a-.26),y,0,.13,.076,.99*d,brass,.16));
      parts.push(box(side*4.19,1.39,wallZ+.17,4.0,2.76,.07,"#372729"));
    }
    // Staggered firebricks, a coal bed and a low grate inset into the marble surround.
    const bricks=["#5c3730","#7b4735","#61372e","#704239"];
    for(let j=0;j<6;j++) for(let i=0;i<5;i++){
      const x=-.85+i*.39+(j%2)*.11;
      parts.push(box(x,.43+j*.205,wallZ+.76,.375,.19,.065,bricks[(i+j*3)%4],.26));
    }
    parts.push(box(0,.35,wallZ+1,2.05,.14,.85,ink));
    for(let i=0;i<6;i++)parts.push(M.beam(-.84+i*.33,.37,wallZ+1.40,-.84+i*.33,.61,wallZ+.81,.042,brass));
    for(const s of [-1,1]){
      parts.push(k.slab({w:.48,h:1.66,d:.42,color:"#40383a",seed:70+s,veins:6,offset:{x:s*1.36,y:1.03,z:wallZ+.66}}),
        lamp(s*1.41,2.22,wallZ+.57),print(s<0?0:1,s*4.29,3.63,wallZ+.22,0));
      for(let j=0;j<3;j++) parts.push(print((j+(s<0?0:1))%3,s*(a-.32),2.45,-2.9+j*2.65,-s*Math.PI/2));
    }
    parts.push(k.slab({w:3.85,h:.15,d:1,color:"#41373b",seed:84,veins:9,offset:{x:0,y:2.14,z:wallZ+.49}}),
      box(0,3.18,wallZ+.15,1.63,1.65,.13,brass),box(0,3.18,wallZ+.24,1.52,1.54,.09,ink),
      mark(0,3.18,wallZ+.33,.59));
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,c=Math.cos(a),s=Math.sin(a),r=.64/Math.max(Math.abs(c),Math.abs(s));
      parts.push(M.beam(.37*c,3.18+.37*s,wallZ+.31,r*c,3.18+r*s,wallZ+.31,.023,copper));
    }
    // Walnut radiogram with a linen speaker grille, illuminated tuning scale and an LP on the platter.
    const hiFi=[box(0,.78,0,2.22,.84,.72,walnut),box(0,1.23,0,2.32,.09,.81,burl),
      box(-.39,.76,.37,1.22,.58,.04,"#977653"),box(.66,.88,.37,.68,.24,.04,ink),
      box(.65,.87,.396,.56,.082,.012,"#b18d57",.26)];
    for(const s of [-1,1])for(const e of [-1,1]) hiFi.push(M.beam(s*.98,.05,e*.32,s*.87,.43,e*.22,.071,burl));
    for(let k=0;k<18;k++)hiFi.push(box(-.95+k*.066,.76,.399,.024,.54,.02,"#51372b"));
    for(let k=0;k<12;k++)hiFi.push(box(.4+k*.043,.88,.413,.009,k%3?.032:.059,.012,ivory,.26));
    for(const dx of [.48,.84])hiFi.push(M.moved(M.turnedX(turned(0,0,0,[[.058,0],[.067,.028],[.049,.043],[0,.043]],brass,10),Math.PI/2),dx,.63,.38));
    hiFi.push(turned(-.38,1.28,0,[[0,0],[.32,0],[.32,.024],[0,.024]],ink,24),
      turned(-.38,1.307,0,[[.01,0],[.093,0],[.093,.011],[0,.011]],"#975d43",16),
      M.beam(.06,1.37,-.18,-.21,1.33,.10,.025,brass));
    for(let j=0;j<6;j++)hiFi.push(box(.62+j*.06,1.5,-.1,.045,.43,.42,bindings[j%5]));
    parts.push(M.moved(M.turnedY(M.merge(...hiFi),Math.PI/2),-a+.65,0,.26));
    // A two-tone sunburst carpet sits beneath the card table, with a woven border and short fringe.
    const rug=box(0,.024,.13,6.42,.022,5.64,"#532b32");
    parts.push(rug);
    for(const sign of [-1,1]){
      for(const inset of [.09,.18]){
        parts.push(box(sign*(3.21-inset),.039,.13,.025,.009,5.5,brass),box(0,.039,.13+sign*(2.82-inset),6.22,.009,.025,brass));
      }
      for(let j=0;j<(lite?23:57);j++){
        const xx=(j/(lite?22:56)-.5)*6.3;
        parts.push(box(xx,.027,.13+sign*2.86,.026,.015,.11,"#947657"));
      }
      for(let k=-7;k<=7;k++){
        const xx=k*.39,zz=.13+sign*2.49;
        parts.push(M.beam(xx-.16,.041,zz,xx,.041,zz-sign*.19,.028,"#a57a55"),
          M.beam(xx,.041,zz-sign*.19,xx+.16,.041,zz,.028,"#a57a55"));
      }
    }
    for(const x of [-4.3,-2.15,0,2.15,4.3]) parts.push(box(x,4.43,0,.12,.13,d,burl));
    for(const z of [-3.7,-1.4,.9,3.2]) parts.push(box(0,4.42,z,w,.15,.14,walnut));
    return M.merge(...parts);
  };
  const passCase = () => M.merge(
    box(0,0,-.11,1.03,1.11,.28,walnut),box(0,0,.04,.93,.99,.04,"#233e37",.27),
    box(0,-.51,.17,1.04,.09,.43,brass),box(0,.51,.17,1.04,.10,.44,brass),
    box(0,.448,.19,.49,.02,.18,ivory,.94),box(0,-.29,.23,.48,.09,.19,ink),
    ...[-1,1].map(s=>box(s*.49,0,.33,.032,.97,.032,brass)));
  const passCard = () => M.merge(box(0,0,0,.44,.29,.045,copper,.44),box(0,0,.025,.38,.232,.01,"#624232",.38),
    mark(0,0,.053,.17),...[-1,1].map(s=>box(s*.165,0,.039,.018,.16,.01,brass,.5)));
  const add = (parent,geometry,x=0,y=0,z=0) => {
    const n=S.createNode({geometry,position:{x,y,z}});S.addChild(parent,n);return n;
  };
  const bindings=["#633e30","#285048","#693e42","#9a7953","#373136"];
  const shelf = (lite, x, z) => {
    const frameParts=[],leaf=[],w=2.04,h=2.64,half=w/2;
    for(const s of [-1,1]){
      frameParts.push(box(s*1.83,1.43,-.13,1.55,2.86,.30,walnut),box(s*1.81,1.40,.034,1.35,2.51,.036,"#30443b"),
        box(s*1.81,1.40,.066,1.18,2.34,.02,"#364c40"),box(s*(half+.05),h/2,.02,.12,h+.13,.28,burl),
        box(s*(half+.087),h/2,.16,.03,h+.13,.035,brass),box(s*2.58,1.4,-.61,.14,2.9,1.48,walnut));
    }
    frameParts.push(box(0,h+.16,-.12,5.28,.32,.61,walnut),box(0,h+.04,.16,5.28,.04,.06,brass),
      box(0,.04,-.53,5.24,.08,1.25,walnut),box(0,2.79,-.64,5.24,.15,1.44,walnut));
    for(const side of [-1,1]){
      for(const height of [.31,1.16,2.17]){
        const center=side*1.82;
        for(const edge of [-1,1]){
          frameParts.push(box(center+edge*.59,height+.27,.092,.032,.55,.024,burl),
            box(center,height+.27+edge*.27,.091,1.19,.034,.024,burl));
        }
        for(let k=-3;k<=3;k++) frameParts.push(M.beam(center+k*.14,height+.04,.083,center+k*.14+.024,height+.48,.083,.011,"#54624c"));
      }
    }
    for(const y of [.35,1.32,2.29]) frameParts.push(turned(half+.012,y,.17,[[.041,0],[.053,.025],[.046,.18],[.053,.2],[0,.22]],brass,8));
    const root=S.createNode(), target=add(root,M.merge(...frameParts),x,0,z);
    leaf.push(box(-half,h/2,-.10,w,h,.18,walnut));
    for(const y of [.68,1.92]){
      leaf.push(box(-half,y,-.201,1.76,1.05,.038,burl),box(-half,y,-.226,1.61,.90,.02,"#3e4538"));
    }
    for(const side of [-w+.045,-.045]) leaf.push(box(side,h/2,.04,.085,h,.36,burl));
    for(let row=0;row<4;row++){
      const y=.17+row*.59, count=lite?7:10, step=(w-.23)/count;
      leaf.push(box(-half,y,.03,w-.1,.075,.37,burl),box(-half,y+.018,.22,w-.12,.02,.018,brass));
      for(let j=0;j<count;j++){
        if(row===2 && j===Math.floor(count*.6)) continue;
        const bx=-w+.12+(j+.5)*step,bh=.32+(j*3+row*2)%5*.04;
        leaf.push(box(bx,y+.04+bh/2,.055,step*.91,bh,.28,bindings[(j+2*row)%5]),
          box(bx,y+.09,.199,step*.72,.017,.012,brass,.22));
      }
    }
    const spillGeo=M.geometry();
    // A translucent taper admits the marble grain through the wash. Grow it with the leaf.
    for(let i=0;i<5;i++){
      const z0=i*.46,z1=z0+.46;
      const side=(d,right)=>-.12+.17*d+(right?1:-1)*(.37+.092*d);
      const ids=[[side(z0,false),z0],[side(z1,false),z1],[side(z1,true),z1],[side(z0,true),z0]]
        .map(([u,v])=>M.pushVert(spillGeo,u,.027,v));
      M.face(spillGeo,ids,BL.math.hexToRgb(["#ffc777","#edb067","#cd945a","#ac8154","#8e7150"][i]),{emissive:.85});
    }
    spillGeo.glassOpacity=.15; spillGeo.glassGrazing=0; spillGeo.castShadow=false;
    const spill=add(target,spillGeo,-.18,0,.11);
    const hinge=add(target,M.merge(...leaf),half,0,.07);
    const step=(w-.23)/(lite?7:10), column=Math.floor((lite?7:10)*.6);
    const book=add(hinge,M.merge(box(0,0,0,step*.94,.49,.34,"#e9dcb9",.43),mark(0,0,.186,.126)),
      -w+.12+(column+.5)*step,1.64,.12);
    let progress=0, opening=false;
    const pose=()=>{
      const u=Math.min(1,progress/.24), v=Math.max(0,(progress-.15)/.85);
      book.rotation.x=u*.26;book.position.z=.12+.115*u;
      hinge.rotation.y=1.61*v*v*(3-2*v);
      spill.visible=v>.02; spill.scale.x=Math.max(.01,v); spill.scale.z=Math.max(.01,v);

    };
    pose();
    const leafBox={x:-half,z:0,hx:half,hz:.23};
    const clear=(ax,az,bx,bz,r)=>{
      if (Math.min(az,bz)>z+w+.5+r || Math.min(ax,bx)>x+half+.5+r || Math.max(ax,bx)<x-half-.5-r) return true;
      const c=Math.cos(hinge.rotation.y), s=Math.sin(hinge.rotation.y);
      const dx=ax-x-half, dz=az-z-.07, ex=bx-x-half, ez=bz-z-.07;
      const a=dx*c-dz*s, b=dx*s+dz*c, e=ex*c-ez*s, f=ex*s+ez*c;
      if (!BL.pokerModels.crosses(a,b,e,f,r,leafBox)) return true;
      // If the shelf swung into the player, allow their next step out of its sweep.
      const gap=(u,v)=>Math.hypot(Math.max(-w-u,0,u),Math.max(0,Math.abs(v)-leafBox.hz));
      return gap(a,b)<r && gap(e,f)>gap(a,b);
    };
    const pickRay=ray=>{
      if (ray.dz>=0 || opening || progress>0) return Infinity;
      const t=(z+.21-ray.oz)/ray.dz;
      if (t<0 || Math.abs(ray.ox+t*ray.dx-x-half-book.position.x)>step*.55+.08) return Infinity;
      const y=ray.oy+t*ray.dy;
      return Math.abs(y-book.position.y)<.32 ? t : Infinity;
    };
    return {root,target,hinge,pickRay,clear,open(){if (opening || progress===1) return false; opening=true; return true;},get opened(){return opening || progress>0;},get ready(){return progress===1;},
      update(dt){
        if(opening){ progress=Math.min(1,progress+dt/.98); pose(); opening=progress<1; }

      }};
  };
  BL.pokerSpeakeasy=Object.freeze({interior,passCase,passCard,shelf});
})();
