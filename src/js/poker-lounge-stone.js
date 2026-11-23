// Three rib-vaulted bays spring from paired engaged piers along the lounge walls.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models,S=BL.scene;
  const pale="#d8dadd",rib="#bbbec1",deep="#767b80",inlay="#60646a";
  const mapped=BL.pokerMarble.mineralAtlas(()=>BL.pokerHearthMap,512);
  const finish=(g,min,max)=>{
    if(typeof Image!=="undefined")mapped(g,min,max);
    return g;
  };
  const archFlame=M.cached(()=>finish(BL.pokerHearth.crest(pale,.18),[-.82,-1.34,-.09],[.82,1.34,.20]));
  const chair=M.cached(()=>{
    const oak="#4e382e",carved="#866b4e",welt="#b2956c",velvet="#55353c",p=[];
    const box=(x,y,z,w,h,d,c)=>p.push(M.bevelBox({w,h,d,color:c,bevel:.025,offset:{x,y,z}}));
    const rod=(x,y,z,xx,yy,zz,w,c)=>p.push(M.beam(x,y,z,xx,yy,zz,w,c));

    box(0,.33,0,.89,.14,.83,oak);box(0,.445,.045,.79,.16,.69,velvet);
    box(0,.90,-.33,.78,.86,.125,oak);box(0,.91,-.251,.62,.70,.088,velvet);
    for(const s of [-1,1]){
      for(const z of [-.33,.31]){
        const x=s*.39,back=z<0, height=back?1.70:.73;
        p.push(M.moved(M.lathe({profile:[[.071,.02],[.08,.07],[.047,.13],[.046,.28],[.065,.31],[.055,.35],[.043,height-.15],
          [.072,height-.11],[.066,height-.07],[.034,height-.048],[.047,height-.02],[0,height+.08]],segments:10,color:carved}),x,0,z));
      }
      box(s*.405,.714,.01,.112,.075,.75,oak);
      rod(s*.39,.67,.29,s*.39,.55,-.18,.044,carved);
      for(let j=0;j<7;j++){
        const t=j/7,u=(j+1)/7;
        // High relief: the tracery seats in the wall, the mantle breaks its plane, and
  // the hands and their attributes are carved clear of the body toward the viewer.
  const wallFigure=(subject,lite)=>{
    const round=[],flat=[],ivory="#e4e1d9",fold="#c7c8c4",shadow="#a6a9a7",tau=Math.PI*2;
    const folio=subject==="reader",lantern=subject==="lantern",mason=subject==="mason";
    const sides=lite?8:14;
    const oval=(x,y,z,w,h,d,color,lean=0)=>{
      const profile=Array.from({length:lite?7:11},(_,i)=>{
        const t=Math.PI*i/(lite?6:10);
        return [Math.sin(t)*w,-Math.cos(t)*h];
      });
      const g=M.lathe({profile,segments:sides,color,emissive:.22});
      for(let j=2;j<g.verts.length;j+=3)g.verts[j]*=d/w;
      round.push(M.moved(M.turnedZ(g,lean),x,y,z));
    };
    const mould=(x,y,z,w,h,d,c,angle=0)=>{
      const g=M.bevelBox({w,h,d,bevel:Math.min(w,h,d)*.15,color:c,emissive:.18});
      flat.push(M.moved(M.turnedZ(g,angle),x,y,z));
    };
    const sweep=(a,b,c,r0,r1,color,bulge=0)=>{
      round.push(M.tube({rings:lite?5:9,segments:lite?5:8,colorFn:()=>color,emissive:.21,
        path:t=>{
          const u=1-t;
          return {x:u*u*a[0]+2*u*t*b[0]+t*t*c[0],y:u*u*a[1]+2*u*t*b[1]+t*t*c[1],z:u*u*a[2]+2*u*t*b[2]+t*t*c[2]};
        },radius:t=>r0*(1-t)+r1*t+bulge*Math.sin(t*Math.PI)}));
    };
    // A pointed canopy on slender jambs. Each crocket peels away from its stem.
    mould(0,.09,.13,1.06,.10,.39,fold);
    mould(0,.155,.16,1.14,.054,.43,ivory);
    for(const sign of [-1,1]){
      const x=sign*.52;
      sweep([x,.18,.059],[x,.72,.068],[x,1.18,.068],.032,.035,fold);
      sweep([x,1.17,.068],[x,1.44,.09],[0,1.70,.08],.051,.027,ivory);
      sweep([x*.90,1.17,.084],[x*.90,1.43,.094],[0,1.65,.086],.021,.012,fold);
      for(let i=0;i<4;i++){
        const t=(i+.55)/4,u=1-t,xx=x*(1-t*t),yy=1.17*u*u+2*1.44*t*u+1.70*t*t;
        sweep([xx,yy,.072],[xx+sign*.094,yy+.018,.14],[xx+sign*.062,yy+.10,.10],.010,.003,ivory,.021);
      }
      for(let i=0;i<3;i++)oval(sign*(.10+i*.125),.09-i*.020,.23,.034,.135-i*.018,.042,ivory,-sign*(.30+i*.26));
    }
    // A continuous rippled surface gives the skirt weight at the hem and gathers
    // its material into narrower pleats where the belt takes up the fabric.
    const robe=M.geometry(),rings=[],pleats=lite?32:56,cloth=BL.math.hexToRgb(ivory);
    for(const [y,rx,rz,dx,depth,wave,phase] of [
      [.19,.27,.135,-.016,.19,.032,.4],[.22,.29,.148,-.016,.19,.039,.4],[.32,.25,.133,-.022,.197,.033,.51],
      [.51,.224,.13,-.018,.207,.031,.78],[.69,.205,.12,.014,.218,.029,1.15],[.82,.162,.097,.025,.215,.014,1.50],
      [.86,.153,.090,.019,.214,.009,1.72],[1.00,.211,.127,-.003,.207,.013,2.27],[1.105,.218,.109,-.012,.20,.011,2.54],[1.16,.111,.071,-.015,.20,.008,2.69]]){
      const row=[];
      for(let i=0;i<pleats;i++){
        const a=i*tau/pleats,flute=wave*(Math.sin(7*a+phase)+.30*Math.sin(11*a-phase));
        row.push(M.pushVert(robe,dx+(rx+flute)*Math.cos(a),y,depth+(rz+flute)*Math.sin(a)));
      }
      rings.push(row);
    }
    for(let j=1;j<rings.length;j++)for(let i=0;i<pleats;i++){
      const k=(i+1)%pleats;M.face(robe,[rings[j-1][i],rings[j][i],rings[j][k],rings[j-1][k]],cloth,{emissive:.22});
    }
    round.push(robe);
    for(let i=0;i<4;i++){
      const dy=i*.038;
      sweep([-.195,1.11-dy*.36,.236],[.008,.92-dy,.475],[.182,.96-dy,.266],.014,.009,fold,.014);
    }
    // Distinct jaw, cheeks, orbital ridges, eyelids, nasal bridge and mouth. Build
    // the head about its own centre so the gaze follows the object in the hands.
    const headStart=round.length;
    oval(0,0,0,.110,.153,.103,ivory);
    oval(0,-.071,.036,.080,.086,.079,ivory);
    for(const sign of [-1,1]){
      oval(sign*.057,-.030,.073,.039,.041,.030,ivory);
      oval(sign*.107,-.004,-.003,.020,.035,.018,fold);
      sweep([sign*.012,.024,.099],[sign*.046,.052,.123],[sign*.084,.027,.079],.009,.004,ivory,.003);
      sweep([sign*.014,.011,.102],[sign*.043,.025,.117],[sign*.074,.013,.093],.004,.003,shadow,.002);
    }
    oval(0,-.010,.104,.019,.053,.027,ivory);
    oval(0,-.046,.125,.024,.017,.016,ivory);
    sweep([-.036,-.086,.099],[0,-.075,.124],[.036,-.083,.099],.003,.003,fold,.004);
    oval(.002,-.090,.102,.027,.007,.011,ivory);
    oval(0,.068,-.021,.115,.099,.103,fold);
    const locks=lite?9:14;
    for(let j=0;j<locks;j++){
      const a=tau*j/locks,s=Math.sin(a),c=Math.cos(a),front=Math.max(0,s);
      sweep([.030*c,.152,-.019+.030*s],[.134*c,.122,.003+.122*s],
        [.104*Math.cos(a+.16),-.047+.117*front+(mason?.024:0),-.018+.097*Math.sin(a+.16)],.012,.005,fold,.012);
    }
    const head=M.merge(...round.splice(headStart));
    M.turnedX(head,folio||mason?.14:.045);
    round.push(M.moved(M.turnedY(head,lantern?.32:folio?-.20:.12),-.015,1.313,.219));
    oval(-.014,1.16,.208,.063,.111,.062,ivory);
    for(const s of [-1,1]){
      oval(s*.113,.208,.247,.063,.042,.097,fold);
      const raised=lantern && s>0,handX=s*(raised?.309:folio?.143:.190);
      const handY=raised?1.21:folio?.90:s>0?1.035:.848;
      const elbow=[s*.278,.827,.232],wrist=[handX,handY,.367];
      sweep([s*.175,1.074,.192],[s*.257,1.047,.217],elbow,.084,.067,fold,.023);
      sweep(elbow,[s*(raised?.36:.265),handY-.060,.338],wrist,.063,.034,ivory,.012);
      oval(handX,handY+.01,.377,.042,.051,.035,ivory,-s*.46);
      for(let i=0;i<4;i++)sweep([handX+s*(i-1.5)*.012,handY-.003,.393],
        [handX+s*(i-1.5)*.013,handY-.023,.423],[handX+s*(i-1.5)*.012,handY-.040,.408],.008,.004,ivory);
    }
    if(folio){
      for(const s of [-1,1]){
        const leaf=M.bevelBox({w:.164,h:.209,d:.029,bevel:.006,color:pale,emissive:.22});
        flat.push(M.moved(M.turnedY(leaf,s*.28),s*.079,.94,.393));
        for(let j=0;j<5;j++)sweep([s*.015,.865+j*.033,.431],[s*.075,.892+j*.030,.427],[s*.146,.874+j*.031,.398],.004,.003,fold);
      }
    }else if(lantern){
      const x=.307;
      sweep([x-.055,1.106,.385],[x,1.30,.39],[x+.055,1.106,.385],.009,.009,ivory);
      for(const y of [.942,1.104])mould(x,y,.386,.144,.030,.118,ivory);
      for(const s of [-1,1])sweep([x+s*.058,.951,.421],[x+s*.064,1.038,.429],[x+s*.057,1.095,.421],.008,.008,fold);
      oval(x,1.019,.387,.040,.061,.032,pale);
    }else if(mason){
      sweep([.18,.96,.382],[.196,1.058,.385],[.231,1.15,.384],.015,.018,ivory);
      mould(.228,1.15,.387,.163,.075,.078,fold,.28);
      sweep([-.205,.787,.38],[-.166,.881,.382],[-.127,.977,.384],.008,.014,ivory);
    }else{
      for(const s of [-1,1])sweep([.193,1.06,.401],[.193+s*.073,.945,.417],[.193+s*.133,.771,.399],.014,.003,ivory);
      mould(-.165,.844,.377,.160,.223,.029,fold,.18);
    }
    return finish(M.shaded(round,flat),[-.66,-.07,-.09],[.66,1.77,.47]);
  };
  const arch=t=>[s*.38*(1-t*t),1.31+.47*(1.53*t-.53*t*t),-.33];
        const a=arch(t),b=arch(u);
        rod(...a,...b,.060,carved);
      }
      for(let j=0;j<8;j++)box(s*.292,.60+j*.086,-.190,.015,.015,.012,welt);
      // Twin lancets share a mullion and support the pierced trefoil at the crown.
      for(const side of [-1,1]){
        const x=s*.16;
        rod(x+side*.142,1.28,-.314,x+side*.142,1.40,-.314,.025,carved);
        for(let j=0;j<7;j++){
          const point=t=>[x+side*.142*(1-t*t),1.4+.155*(1.5*t-.5*t*t),-.314];
          rod(...point(j/7),...point((j+1)/7),.024,carved);
        }
      }
      rod(s*.17,1.54,-.314,s*.058,1.61,-.314,.027,carved);
      for(let j=0;j<7;j++)box(s*.403,.752,-.27+j*.091,.022,.015,.019,welt);
    }
    const crown=t=>{
      const r=.080+.023*Math.cos(3*t);
      return [r*Math.sin(t),1.639+r*Math.cos(t),-.314];
    };
    for(let i=0;i<36;i++)rod(...crown(i*Math.PI/18),...crown((i+1)*Math.PI/18),.023,carved);
    rod(0,1.738,-.314,0,1.772,-.323,.023,carved);
    // Each padded lozenge catches the fire at a slightly different angle.
    const quilt=M.geometry();
    for(let j=0;j<5;j++)for(let k=-2;k<=2;k++){
      if(Math.abs(k)%2!==j%2)continue;
      const x=k*.092,y=.673+j*.108;
      const v=[[x,y-.104,-.204],[x+.089,y,-.204],[x,y+.104,-.204],[x-.089,y,-.204],[x,y,-.170]].map(q=>M.pushVert(quilt,...q));
      for(let n=0;n<4;n++)M.face(quilt,[v[n],v[(n+1)%4],v[4]],BL.math.hexToRgb(n<2?"#70434b":"#643a43"),{emissive:.12});
      box(x,y-.105,-.199,.020,.020,.018,welt);
    }
    p.push(quilt);
    return M.merge(...p);
  });
  // High relief: the tracery seats in the wall, the mantle breaks its plane, and
  // the hands and their attributes are carved clear of the body toward the viewer.
  const wallFigure=(subject,lite)=>{
    const round=[],flat=[],ivory="#e4e1d9",fold="#c7c8c4",shadow="#a6a9a7",tau=Math.PI*2;
    const folio=subject==="reader",lantern=subject==="lantern",mason=subject==="mason";
    const sides=lite?8:14;
    const oval=(x,y,z,w,h,d,color,lean=0)=>{
      const profile=Array.from({length:lite?7:11},(_,i)=>{
        const t=Math.PI*i/(lite?6:10);
        return [Math.sin(t)*w,-Math.cos(t)*h];
      });
      const g=M.lathe({profile,segments:sides,color,emissive:.22});
      for(let j=2;j<g.verts.length;j+=3)g.verts[j]*=d/w;
      round.push(M.moved(M.turnedZ(g,lean),x,y,z));
    };
    const mould=(x,y,z,w,h,d,c,angle=0)=>{
      const g=M.bevelBox({w,h,d,bevel:Math.min(w,h,d)*.15,color:c,emissive:.18});
      flat.push(M.moved(M.turnedZ(g,angle),x,y,z));
    };
    const sweep=(a,b,c,r0,r1,color,bulge=0)=>{
      round.push(M.tube({rings:lite?5:9,segments:lite?5:8,colorFn:()=>color,emissive:.21,
        path:t=>{
          const u=1-t;
          return {x:u*u*a[0]+2*u*t*b[0]+t*t*c[0],y:u*u*a[1]+2*u*t*b[1]+t*t*c[1],z:u*u*a[2]+2*u*t*b[2]+t*t*c[2]};
        },radius:t=>r0*(1-t)+r1*t+bulge*Math.sin(t*Math.PI)}));
    };
    // A pointed canopy on slender jambs. Each crocket peels away from its stem.
    mould(0,.09,.13,1.06,.10,.39,fold);
    mould(0,.155,.16,1.14,.054,.43,ivory);
    for(const sign of [-1,1]){
      const x=sign*.52;
      sweep([x,.18,.059],[x,.72,.068],[x,1.18,.068],.032,.035,fold);
      sweep([x,1.17,.068],[x,1.44,.09],[0,1.70,.08],.051,.027,ivory);
      sweep([x*.90,1.17,.084],[x*.90,1.43,.094],[0,1.65,.086],.021,.012,fold);
      for(let i=0;i<4;i++){
        const t=(i+.55)/4,u=1-t,xx=x*(1-t*t),yy=1.17*u*u+2*1.44*t*u+1.70*t*t;
        sweep([xx,yy,.072],[xx+sign*.094,yy+.018,.14],[xx+sign*.062,yy+.10,.10],.010,.003,ivory,.021);
      }
      for(let i=0;i<3;i++)oval(sign*(.10+i*.125),.09-i*.020,.23,.034,.135-i*.018,.042,ivory,-sign*(.30+i*.26));
    }
    // A continuous rippled surface gives the skirt weight at the hem and gathers
    // its material into narrower pleats where the belt takes up the fabric.
    const robe=M.geometry(),rings=[],pleats=lite?32:56,cloth=BL.math.hexToRgb(ivory);
    for(const [y,rx,rz,dx,depth,wave,phase] of [
      [.19,.27,.135,-.016,.19,.032,.4],[.22,.29,.148,-.016,.19,.039,.4],[.32,.25,.133,-.022,.197,.033,.51],
      [.51,.224,.13,-.018,.207,.031,.78],[.69,.205,.12,.014,.218,.029,1.15],[.82,.162,.097,.025,.215,.014,1.50],
      [.86,.153,.090,.019,.214,.009,1.72],[1.00,.211,.127,-.003,.207,.013,2.27],[1.105,.218,.109,-.012,.20,.011,2.54],[1.16,.111,.071,-.015,.20,.008,2.69]]){
      const row=[];
      for(let i=0;i<pleats;i++){
        const a=i*tau/pleats,flute=wave*(Math.sin(7*a+phase)+.30*Math.sin(11*a-phase));
        row.push(M.pushVert(robe,dx+(rx+flute)*Math.cos(a),y,depth+(rz+flute)*Math.sin(a)));
      }
      rings.push(row);
    }
    for(let j=1;j<rings.length;j++)for(let i=0;i<pleats;i++){
      const k=(i+1)%pleats;M.face(robe,[rings[j-1][i],rings[j][i],rings[j][k],rings[j-1][k]],cloth,{emissive:.22});
    }
    round.push(robe);
    for(let i=0;i<4;i++){
      const dy=i*.038;
      sweep([-.195,1.11-dy*.36,.236],[.008,.92-dy,.475],[.182,.96-dy,.266],.014,.009,fold,.014);
    }
    // Distinct jaw, cheeks, orbital ridges, eyelids, nasal bridge and mouth. Build
    // the head about its own centre so the gaze follows the object in the hands.
    const headStart=round.length;
    oval(0,0,0,.110,.153,.103,ivory);
    oval(0,-.071,.036,.080,.086,.079,ivory);
    for(const sign of [-1,1]){
      oval(sign*.057,-.030,.073,.039,.041,.030,ivory);
      oval(sign*.107,-.004,-.003,.020,.035,.018,fold);
      sweep([sign*.012,.024,.099],[sign*.046,.052,.123],[sign*.084,.027,.079],.009,.004,ivory,.003);
      sweep([sign*.014,.011,.102],[sign*.043,.025,.117],[sign*.074,.013,.093],.004,.003,shadow,.002);
    }
    oval(0,-.010,.104,.019,.053,.027,ivory);
    oval(0,-.046,.125,.024,.017,.016,ivory);
    sweep([-.036,-.086,.099],[0,-.075,.124],[.036,-.083,.099],.003,.003,fold,.004);
    oval(.002,-.090,.102,.027,.007,.011,ivory);
    oval(0,.068,-.021,.115,.099,.103,fold);
    const locks=lite?9:14;
    for(let j=0;j<locks;j++){
      const a=tau*j/locks,s=Math.sin(a),c=Math.cos(a),front=Math.max(0,s);
      sweep([.030*c,.152,-.019+.030*s],[.134*c,.122,.003+.122*s],
        [.104*Math.cos(a+.16),-.047+.117*front+(mason?.024:0),-.018+.097*Math.sin(a+.16)],.012,.005,fold,.012);
    }
    const head=M.merge(...round.splice(headStart));
    M.turnedX(head,folio||mason?.14:.045);
    round.push(M.moved(M.turnedY(head,lantern?.32:folio?-.20:.12),-.015,1.313,.219));
    oval(-.014,1.16,.208,.063,.111,.062,ivory);
    for(const s of [-1,1]){
      oval(s*.113,.208,.247,.063,.042,.097,fold);
      const raised=lantern && s>0,handX=s*(raised?.309:folio?.143:.190);
      const handY=raised?1.21:folio?.90:s>0?1.035:.848;
      const elbow=[s*.278,.827,.232],wrist=[handX,handY,.367];
      sweep([s*.175,1.074,.192],[s*.257,1.047,.217],elbow,.084,.067,fold,.023);
      sweep(elbow,[s*(raised?.36:.265),handY-.060,.338],wrist,.063,.034,ivory,.012);
      oval(handX,handY+.01,.377,.042,.051,.035,ivory,-s*.46);
      for(let i=0;i<4;i++)sweep([handX+s*(i-1.5)*.012,handY-.003,.393],
        [handX+s*(i-1.5)*.013,handY-.023,.423],[handX+s*(i-1.5)*.012,handY-.040,.408],.008,.004,ivory);
    }
    if(folio){
      for(const s of [-1,1]){
        const leaf=M.bevelBox({w:.164,h:.209,d:.029,bevel:.006,color:pale,emissive:.22});
        flat.push(M.moved(M.turnedY(leaf,s*.28),s*.079,.94,.393));
        for(let j=0;j<5;j++)sweep([s*.015,.865+j*.033,.431],[s*.075,.892+j*.030,.427],[s*.146,.874+j*.031,.398],.004,.003,fold);
      }
    }else if(lantern){
      const x=.307;
      sweep([x-.055,1.106,.385],[x,1.30,.39],[x+.055,1.106,.385],.009,.009,ivory);
      for(const y of [.942,1.104])mould(x,y,.386,.144,.030,.118,ivory);
      for(const s of [-1,1])sweep([x+s*.058,.951,.421],[x+s*.064,1.038,.429],[x+s*.057,1.095,.421],.008,.008,fold);
      oval(x,1.019,.387,.040,.061,.032,pale);
    }else if(mason){
      sweep([.18,.96,.382],[.196,1.058,.385],[.231,1.15,.384],.015,.018,ivory);
      mould(.228,1.15,.387,.163,.075,.078,fold,.28);
      sweep([-.205,.787,.38],[-.166,.881,.382],[-.127,.977,.384],.008,.014,ivory);
    }else{
      for(const s of [-1,1])sweep([.193,1.06,.401],[.193+s*.073,.945,.417],[.193+s*.133,.771,.399],.014,.003,ivory);
      mould(-.165,.844,.377,.160,.223,.029,fold,.18);
    }
    return finish(M.shaded(round,flat),[-.66,-.07,-.09],[.66,1.77,.47]);
  };
  const arch=t=>1-.48*t-.52*t*t;
  const ceilingAt=(r,x,z)=>{
    const b=(r.d-.66)/6,a=r.w/2-.37;
    const localZ=Math.abs((Math.abs(z)+b)%(2*b)-b);
    return r.h-.23-4.52*(1-arch(Math.min(1,Math.abs(x)/a,localZ/b)));
  };
  const sill=3.46,shoulder=6.21,lancetTop=7.80;
  const archWidth=t=>1-t*t;
  const archHeight=(t,top)=>shoulder+(top-shoulder)*(1.66*t-.66*t*t);
  // The glass follows the very same twelve chords as the stonework. Each row
  // is a quad so the Canvas renderer can project the texture at oblique angles.
  const glazing=half=>{
    const g=M.geometry(),white=BL.math.hexToRgb("#ffffff");
    const vertex=(x,y)=>M.pushVert(g,x,y,0);
    for(const direction of [-1,1]){
      const radius=half/2,center=direction*radius;
      let left=vertex(center-radius,sill),right=vertex(center+radius,sill);
      for(let i=0;i<=12;i++){
        const t=i/12,span=Math.max(.0001,radius*archWidth(t)),y=archHeight(t,lancetTop);
        const l=vertex(center-span,y),r=vertex(center+span,y);
        M.face(g,[left,right,r,l],white,{emissive:.64});
        left=l;right=r;
      }
    }
    g.castShadow=false;
    return g;
  };
  const outfit=(room,r,lite,windowLight,seats)=>{
    const add=(geometry,x=0,y=0,z=0)=>{
      const n=S.createNode({geometry,position:{x,y,z}});S.addChild(room,n);return n;
    };
    const a=r.w/2-.37,b=(r.d-.66)/6,rise=4.52,spring=r.h-rise-.23;
    // Each carving is instanced twice, opposite its partner. Their corbels enter
    // the wall skin, clear the bookcase cornices and stop below the window sills.
    const figures=["reader","lantern","mason","drafter"].map(subject=>wallFigure(subject,lite));
    for(const side of [-1,1]){
      add(figures[0],side*BL.pokerSpeakeasy.bookBay(r.w),3.07,-r.d/2+.15);
      for(let j=0;j<3;j++){
        const carving=add(figures[j+1],side*(r.w/2-.15),1.68,(j-1)*2*b);
        carving.rotation.y=-side*Math.PI/2;
      }
    }
    const column=[],vault=[],web=M.geometry();
    const shaft=(x,z,profile,c)=>column.push(M.moved(M.lathe({profile,color:c,segments:lite?8:12,emissive:.14}),x,0,z));
    shaft(0,0,[[.37,.025],[.42,.15],[.40,.23],[.33,.33],[.27,.56],[.247,spring-.70],[.32,spring-.58],[.39,spring-.16],[.39,spring]],pale);
    for(let k=0;k<8;k++){
      const t=k*Math.PI/4,x=.248*Math.cos(t),z=.248*Math.sin(t);
      shaft(x,z,[[.107,.19],[.13,.28],[.08,.48],[.073,spring-.80],[.11,spring-.63],[.16,spring-.34],[.10,spring-.12],[.045,spring+.15]],rib);
    }
    for(const y of [1.36,spring-.53,spring-.17])shaft(0,0,[[.37,y],[.42,y+.05],[.41,y+.105],[.36,y+.14]],pale);
    const pier=finish(M.merge(...column),[-.45,0,-.45],[.45,spring,.45]);
    for(const s of [-1,1])for(let j=0;j<=3;j++)add(pier,s*a,0,(2*j-3)*b);
    const pt=(x,z)=>[a*x,spring+rise*arch(Math.min(Math.abs(x),Math.abs(z))),b*z];
    // Diagonals are the valleys shared by the four webs; face the occupied room.
    const n=lite?8:16;
    for(let j=0;j<n;j++)for(let k=0;k<n;k++){
      const x=-1+2*j/n,z=-1+2*k/n,d=2/n;
      const corners=[[x,z],[x+d,z],[x+d,z+d],[x,z+d]];
      const ids=corners.map(q=>M.pushVert(web,...pt(...q)));
      const mid=M.pushVert(web,...pt(x+d/2,z+d/2));
      for(let i=0;i<4;i++)M.face(web,[ids[i],ids[(i+1)%4],mid],BL.math.hexToRgb(pale),{emissive:.14});
    }
    vault.push(web);
    const archRib=(x0,z0,x1,z1,transverse=false)=>{
      let prev=null;
      for(let i=0;i<=16;i++){
        const t=i/16,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;
        const next=[x*a,spring+rise*arch(1-t)-.10,z*b];
        if(prev){
          vault.push(M.beam(...prev,...next,transverse?.18:.128,rib,.14));
          vault.push(M.beam(prev[0],prev[1]-.083,prev[2],next[0],next[1]-.083,next[2],.060,pale,.15));
        }
        prev=next;
      }
    };
    for(const s of [-1,1])for(const e of [-1,1]){
      archRib(s,e,0,0);
      archRib(s,e,s,0);
      if(e===-1)archRib(s,e,0,e,true);
    }
    // The mullion, paired lancets and outer arch stand proud of the glass.
    const half=b*.73;
    for(const s of [-1,1]){
      const x=s*(a+.13);
      const bar=(u,y,v,yy,width,c)=>vault.push(M.beam(x,y,u,x,yy,v,width,c,.18));
      for(const [center,radius,top,thick] of [[0,half,9.46,.12],[-half/2,half/2,lancetTop,.082],[half/2,half/2,lancetTop,.082]]){
        for(const sign of [-1,1]){
          const foot=center+sign*radius;
          bar(foot,sill,foot,shoulder,thick,rib);
          for(let i=0;i<12;i++){
            const t=i/12,u=(i+1)/12;
            bar(center+sign*radius*archWidth(t),archHeight(t,top),
              center+sign*radius*archWidth(u),archHeight(u,top),thick,pale);
          }
        }
      }
      bar(-half,sill,half,sill,.14,rib);
    }
    const bay=finish(M.merge(...vault),[-a,spring,-b],[a,r.h,b]);
    const flame=archFlame(),ornaments=[],windows=[];
    for(const j of [-1,0,1]){
      const z=j*2*b;
      add(bay,0,0,z);
      for(const s of [-1,1]){
        // From the entrance, read the left wall toward the hearth and the right wall back.
        const glass=add(glazing(half),s*(a+.155),0,z);
        glass.rotation.y=-s*Math.PI/2;
        windows[s<0?1-j:4+j]=glass;
        const ornament=add(flame,s*(r.w/2-.152),8.47,z);
        ornaments.push(ornament);
        ornament.rotation.y=-s*Math.PI/2;
        ornament.scale.x=ornament.scale.y=ornament.scale.z=.225;
      }
    }
    const lastArch=[];
    for(const s of [-1,1]){
      let prev=null;
      for(let i=0;i<=16;i++){
        const t=i/16,q=[s*a*(1-t),spring+rise*arch(1-t)-.1,3*b];
        if(prev)lastArch.push(M.beam(...prev,...q,.18,rib,.14));
        prev=q;
      }
    }
    add(finish(M.merge(...lastArch),[-a,spring,2*b],[a,r.h,3*b+.1]));
    const boss=M.lathe({profile:[[0,0],[.115,.057],[.21,.13],[.28,.23],[.21,.28],[0,.28]],segments:12,color:rib,emissive:.14});
    for(const j of [-1,0,1])add(boss,0,r.h-.65,2*j*b);
    // Bookmatched marble paving with a continuous grey inlay around each inset.
    const w=r.w/8,d=r.d/8;
    const paving=[];
    const block=(x,y,z,ww,h,dd,color)=>paving.push(M.box({w:ww,h,d:dd,color,emissive:.11,offset:{x,y,z}}));
    block(0,-.044,0,w-.012,.11,d-.012,pale);
    for(const s of [-1,1]){
      block(s*(w/2-.12),.013,0,.032,.004,d-.21,inlay);
      block(0,.013,s*(d/2-.12),w-.21,.004,.032,inlay);
    }
    const slab=finish(M.merge(...paving),[-w/2,-.10,-d/2],[w/2,.017,d/2]);
    for(let j=0;j<8;j++)for(let k=0;k<8;k++){
      const tile=add(slab,(k-3.5)*w,0,(j-3.5)*d);
      tile.rotation.y=(k<4)===(j<4)?0:Math.PI;
    }
    if(!lite){
      const gloss=M.panel({w:r.w-.25,h:r.d-.25,tilesX:1,tilesY:1,color:"#000000"});
      gloss.reflector=true;gloss.gloss=BL.pokerFloor.GLOSS;gloss.castShadow=false;
      S.addChild(windowLight,S.createNode({geometry:gloss,sightHidden:true,
        position:{x:0,y:BL.pokerFloor.Y,z:0},rotation:{x:-Math.PI/2,y:0,z:0}}));
    }
    BL.pokerTimelineGlass.install(room,r,windowLight,windows,[-half,sill,2*half,lancetTop-sill],seats);
    return ornaments;
  };
  BL.pokerLoungeStone=Object.freeze({chair,outfit,ceilingAt});
})();
