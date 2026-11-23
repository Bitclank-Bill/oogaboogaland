// The drawer holds Ana and Bo's hand-operated bicycle.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models;
  const build=({item,add,box,disc,walnut,brass,paper,ink,enamel})=>{
    let opened=false,spent=false,crank=0,drawerTravel=0;
    const drawer=item("Ana and Bo’s bicycle",M.merge(box(0,0,-.245,.76,.15,.74,walnut),
      box(0,.005,.139,.22,.034,.047,brass)),0,.73,1.68,ui=>{
      opened=true;
      const note=ui.status(),ledger=ui.element("p");
      const books=()=>{ledger.textContent=spent?"Practice ledger · Ana’s original output is spent. Bo has 0.6 BTC.":"Practice ledger · Ana holds one unspent output of 0.6 BTC.";};
      books();ui.button("Turn the crank",()=>{crank+=Math.PI*2;note.textContent="Both wheels turn.";});
      ui.button("Pay Bo 0.6 BTC",()=>{
        if(spent){note.textContent="The catch holds. That input was already spent when Ana bought the bicycle.";return;}
        spent=true;books();note.textContent="Bo received the practice payment.";
      });
      const leaf=ui.element("details"),summary=document.createElement("summary");summary.textContent="Lift the proofreader’s leaf";leaf.append(summary);
      const text=document.createElement("p");text.textContent="Each node checks that the outputs named by a transaction’s inputs are still available. This model leaves out fees.";leaf.append(text);
      for(const [title,url] of [["Read Bitcoin Core’s input check","https://github.com/bitcoin/bitcoin/blob/v29.0/src/consensus/tx_verify.cpp"],["Follow Ana and Bo in Bitcoin4Plebs","https://hotpixelgroup.github.io/bitcoin4plebs/"]]){
        const link=document.createElement("a");link.href=url;link.textContent=title;link.target="_blank";link.rel="noopener";leaf.append(link,document.createElement("br"));
      }
      ui.button("Reset the practice ledger",()=>{spent=false;books();note.textContent="Ready for another purchase.";});
    });
    const beam=(a,b,w,c)=>M.beam(...a,...b,w,c,.56);
    const rear=[-.22,.14,0],front=[.22,.14,0],pedal=[-.02,.12,0],seat=[-.11,.31,0],head=[.13,.30,0];
    const frame=add(drawer,M.merge(beam(rear,seat,.015,enamel),beam(seat,pedal,.018,enamel),beam(pedal,rear,.016,enamel),
      beam(seat,head,.019,enamel),beam(pedal,head,.018,enamel),beam(head,front,.016,brass),
      beam(head,[.16,.36,0],.014,brass),box(.16,.36,0,.023,.023,.12,ink),box(-.11,.326,0,.104,.025,.06,walnut)),0,0,-.19);
    frame.rotation.y=Math.PI/2;
    // The slide lifts the frame on a telescoping brass stand.
    add(drawer,disc(0,.074,-.19,.065,.07,walnut));
    add(frame,disc(0,-.14,0,.021,.26,brass));
    const drive=add(frame,M.merge(disc(0,0,0,.014,.025,brass),
      box(.023,0,.016,.05,.01,.012,brass),box(.047,0,.031,.025,.012,.035,ink)),...pedal);
    const spokes=[M.turnedX(M.torus(.117,.014,"#89735b",.44,24,5),Math.PI/2)];
    for(let i=0;i<5;i++){const a=i*Math.PI/5,x=.106*Math.cos(a),y=.106*Math.sin(a);spokes.push(M.beam(-x,-y,0,x,y,0,.008,brass,.55));}
    const wheel=M.merge(...spokes),wheels=[add(frame,wheel,...rear),add(frame,wheel,...front)];
    // The paired ledger leaves lie in the front of the tray, below the rising wheels.
    for(const side of [-1,1]){
      const x=side*.102;
      add(drawer,M.merge(box(x,.10,.085,.19,.014,.105,paper),box(x,.109,.066,.135,.004,.007,ink),
        box(x,.109,.09,.11,.004,.008,brass,.55)));
    }
    const paidMark=add(drawer,M.merge(M.beam(.063,.115,.105,.08,.115,.12,.008,enamel),
      M.beam(.08,.115,.12,.13,.115,.085,.008,enamel)));
    const catchNode=add(drawer,box(0,0,0,.035,.07,.048,brass),.28,.095,.095);
    frame.visible=paidMark.visible=false;
    return {drawer,close(){opened=false;},update(dt,calm){
      const step=Math.min(1,dt*6);
      drawerTravel+=((opened?1:0)-drawerTravel)*(calm?1:step);
      drawer.position.z=1.68+.57*drawerTravel;frame.visible=drawerTravel>.04;frame.position.y=.03+.20*drawerTravel;
      catchNode.rotation.x=spent?-.65:0;paidMark.visible=spent;
      const turn=Math.min(crank,dt*7);crank-=turn;
      if(!calm && turn){drive.rotation.z-=turn;for(const w of wheels)w.rotation.z-=turn;}
    }};
  };
  BL.pokerLoungeMachines={build};
})();
