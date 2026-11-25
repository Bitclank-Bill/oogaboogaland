// Each stop after the binding is a pair of facing pages, in reading order.
(() => {
  "use strict";
  const BL=window.BL, title="The Bridge I Left You";
  const spreads=[
    {
      art:"s1",alt:"Wide-eyed baby Jones watches Dad write by lamplight. Dad has a bald head, a square jaw and close stubble. Tiny shoes sit beside his letter.",
      left:"Hi, Jones. You found it!",
      right:"When you were a tiny baby, my friends and I started building this world. It’s a little world inside the big, real one you are just starting to explore. One day, you’ll understand it even better than I do."
    },
    {
      art:"s2",alt:"At his keyboard, Dad builds a tool for planning ahead. A family looks at its savings and a calendar together.",
      left:"Here’s a little bit about your dad.\n\nBefore you were born, I started a company called Hot Pixel Group. We made apps and websites, and we helped lots of people find good work.",
      right:"I taught myself to write code, one letter at a time. Nobody showed me how. Every big thing I ever made started the same way: with a little blinking line on an empty screen."
    },
    {
      art:"s3",alt:"Dad listens at the edge of a busy square. A lamp and a jumble of objects cast a funny monster’s shadow.",
      left:"I first heard about Bitcoin in a city called Minneapolis. I bought a tiny bit. But I was very busy, and I never really took the time to learn about it.",
      right:"So it seemed a little scary, and I gave up on it.\n\nCan you see the monster? Look closer. It’s only a shadow."
    },
    {
      art:"s4",alt:"Dad’s team sketches an app. A lamp reveals the objects behind the monster. Distant neighbors open matching rulebooks.",
      left:"Then one day, I decided to really learn. I read and read and read. Here’s what I found out:",
      right:"Bitcoin is like a game that people all over the world play together. Everyone has the same rulebook, and lots of computers check every move, so nobody can cheat. That keeps it fair for everyone.\n\nSee? With the lamp on, the monster is just a pile of things."
    },
    {
      art:"s5",alt:"Neighbors wave across a quiet street. Dad turns from a rising chart to the people beyond his window.",
      left:"Then a sickness came, and almost everyone had to stay home for a long time. To help, lots and lots of new money was made.",
      right:"Our home and savings grew, so Mom and I were okay. But some of our friends worked just as hard and still fell behind, because each of their dollars bought a little less. That isn’t fair, Jones."
    },
    {
      art:"s6",alt:"Three copper coins lie on the counter on both market days. The second basket holds less. Across the river, a toy boat passes from its maker to a new owner.",
      left:"That’s when Bitcoin really mattered to me. Bitcoin is money that lives on computers, and nobody can make more of it whenever they want. There will only ever be 21 million, like a deck that always has the same number of cards.",
      right:"Look at the baskets. The same three coins buy less the second time, because someone made more coins. Bitcoin can’t shrink like that.\n\nI’ve spent years helping people learn about it, and I hope I always will."
    },
    {
      art:"s7",alt:"Neighbors pull chairs beside an empty lockbox. At a lamplit table Dad and his friends experiment with dice, tiles, and locks.",
      left:"So how did this book get here?\n\nIn the summer of 2026, some people lost their Bitcoin. The secret words that kept it safe were too easy for computers to guess.",
      right:"Some friends and I wanted to help. We made EntropyLab to show everyone why secret words have to be super hard to guess, like rolling dice again and again."
    },
    {
      art:"s8",alt:"The friends’ drawn paths become floating islands and caves. Behind a bookcase is Jones’s marble lounge, its flame carving above the fire.",
      left:"Then we wondered: what if you could walk around inside a world all about Bitcoin? So my friends and I built Ooga Booga Land, where anyone can come to play games, talk and learn.",
      right:"We’re building it to make the world a little better for kids like you, Jones. And this room, where you found this book?\n\nI built it just for you."
    },
    {
      art:"s9",alt:"A younger Ooga points to the bridge in the book. Jones bends close to see. Beside them a lantern tilts, and on the far bank friends leave room on a plan for the next bridge.",
      left:"You can build the world you want to see. Keep building bridges, Jones.\n\nWe love you."
    }
  ];
  const make=(parent,tag,cls,text)=>{
    const node=document.createElement(tag);node.className=cls;
    if(text!==undefined)node.textContent=text;
    parent.append(node);return node;
  };
  // One foil pressing for the tabletop texture and the reader. The leather grain
  // modulates the gold inside the letterforms and the rim catches the firelight.
  let jacket;
  const binding=()=>{
    if(!jacket)jacket=new Promise(resolve=>{
      const source=new Image(),canvas=document.createElement("canvas");
      canvas.width=canvas.height=1024;
      const ctx=canvas.getContext("2d");
      const press=()=>{
        if(source.naturalWidth)ctx.drawImage(source,0,0,1024,1024);
        else {ctx.fillStyle="#93471e";ctx.fillRect(0,0,1024,1024);}
        const foil=document.createElement("canvas");foil.width=1024;foil.height=470;
        const die=foil.getContext("2d");
        die.textAlign=ctx.textAlign="center";
        const lines=[["The Bridge",227],["I Left You",323],["For Jones, from Dad",414]];
        for(const [line,y] of lines){
          die.font=ctx.font=y===414?"italic 40px Georgia, serif":"600 94px Georgia, serif";
          ctx.fillStyle="#f2aa5a";ctx.fillText(line,535,y+2);
          ctx.fillStyle="#4a210e";ctx.fillText(line,534,y-2);
          const gold=die.createLinearGradient(0,y-72,0,y+4);
          gold.addColorStop(0,"#ae742c");gold.addColorStop(.43,"#ffdf91");gold.addColorStop(1,"#c59042");
          die.fillStyle=gold;die.fillText(line,535,y);
        }
        // source-atop retains the glyph mask while transferring the binding's grain.
        die.globalCompositeOperation="source-atop";die.globalAlpha=.24;
        die.drawImage(canvas,0,0,1024,470,0,0,1024,470);
        ctx.drawImage(foil,0,0);resolve(canvas);
      };
      source.onload=source.onerror=press;source.src=BL.pokerStoryArt.cover;
    });
    return jacket;
  };
  // Contrast for words printed on the paintings. INK and PAPER are the stylesheet's `.jones-full` colours; the ink
  // multiplies into the wash, so it only darkens and the plain ink is the worst case. CONTRAST is WCAG AAA.
  const INK=[43,34,25],PAPER=[247,238,219],CONTRAST=7,BAND=.44,MIN_TYPE=14,WASH_FLOOR=.32,SAMPLE_W=216,SAMPLE_H=108;
  const toLinear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const LINEAR=Float64Array.from({length:256},(_,v)=>toLinear(v));
  // Whole channel values read from the table; the wash's blends fall between them and are worked out exactly.
  const linear=v=>Number.isInteger(v)?LINEAR[v]:toLinear(v);
  const luminance=(r,g,b)=>.2126*linear(r)+.7152*linear(g)+.0722*linear(b);
  const needed=CONTRAST*(luminance(...INK)+.05)-.05;
  // Each painting read once at a small size: its colours, and how busy each point is (the luminance gradient).
  const samples=new Map();
  const sampleOf=img=>{
    if(!img || !img.complete || !img.naturalWidth)return null;
    if(samples.has(img.src))return samples.get(img.src);
    // Each cell keeps its darkest pixel, not the average: averaging would wash out the paint's thin dark outlines.
    const w=img.naturalWidth,h=img.naturalHeight,canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
    const full=ctx.getImageData(0,0,w,h).data,rgb=new Uint8ClampedArray(4*SAMPLE_W*SAMPLE_H),
      lum=new Float32Array(SAMPLE_W*SAMPLE_H).fill(2),busy=new Float32Array(SAMPLE_W*SAMPLE_H);
    for(let y=0;y<h;y++){
      const cy=Math.min(SAMPLE_H-1,Math.floor(y*SAMPLE_H/h));
      for(let x=0;x<w;x++){
        const j=4*(y*w+x),l=luminance(full[j],full[j+1],full[j+2]),c=cy*SAMPLE_W+Math.min(SAMPLE_W-1,Math.floor(x*SAMPLE_W/w));
        if(l<lum[c]){lum[c]=l;rgb[4*c]=full[j];rgb[4*c+1]=full[j+1];rgb[4*c+2]=full[j+2];}
      }
    }
    for(let y=1;y<SAMPLE_H-1;y++)for(let x=1;x<SAMPLE_W-1;x++){
      const i=y*SAMPLE_W+x;busy[i]=Math.abs(lum[i+1]-lum[i-1])+Math.abs(lum[i+SAMPLE_W]-lum[i-SAMPLE_W]);
    }
    const grid={rgb,busy};samples.set(img.src,grid);return grid;
  };
  // The least wash over the box (fractions of the spread) that lifts every pixel under it to the contrast, and the
  // box's mean busyness, so the calmer band wins when both need the same wash.
  const washFor=(grid,x0,y0,x1,y1)=>{
    const ax=Math.max(0,Math.floor(x0*SAMPLE_W)),bx=Math.min(SAMPLE_W,Math.ceil(x1*SAMPLE_W)),
      ay=Math.max(0,Math.floor(y0*SAMPLE_H)),by=Math.min(SAMPLE_H,Math.ceil(y1*SAMPLE_H));
    const clears=a=>{
      for(let y=ay;y<by;y++)for(let x=ax;x<bx;x++){
        const i=4*(y*SAMPLE_W+x),d=grid.rgb;
        if(luminance(a*PAPER[0]+(1-a)*d[i],a*PAPER[1]+(1-a)*d[i+1],a*PAPER[2]+(1-a)*d[i+2])<needed)return false;
      }
      return true;
    };
    let lo=0,hi=1;
    if(!clears(lo))for(let k=0;k<9;k++){const mid=(lo+hi)/2;if(clears(mid))hi=mid;else lo=mid;}
    else hi=0;
    let sum=0,n=0;
    for(let y=ay;y<by;y++)for(let x=ax;x<bx;x++){sum+=grid.busy[y*SAMPLE_W+x];n++;}
    return {wash:hi,busy:n?Math.min(1,sum/n/.25):0};
  };
  const read=ui=>{
    const reader=ui.element("section");reader.className="jones-reader";
    const dialog=reader.closest("dialog"),stage=make(reader,"div","jones-stage");
    stage.tabIndex=0;stage.setAttribute("role","region");stage.setAttribute("aria-label","Book pages");
    const nav=make(reader,"nav","actions jones-nav");nav.setAttribute("aria-label","Book controls");
    const previous=make(nav,"button","","‹ Previous");
    const status=make(nav,"output","jones-location");status.setAttribute("aria-live","polite");
    const next=make(nav,"button","","Next ›");
    const putDown=make(nav,"button","modal-close jones-return","×");
    putDown.setAttribute("aria-label","Close book");
    let upcoming=null,upcomingKey="";
    const art=(parent,key,alt)=>{
      const img=key===upcomingKey?upcoming:new Image();
      img.className="jones-art";img.alt=alt;img.onload=img.onerror=fit;
      if(img!==upcoming)img.src=BL.pokerStoryArt[key];
      parent.append(img);
    };
    const page=(parent,number,text)=>{
      const leaf=make(parent,"section","jones-page");leaf.setAttribute("aria-label","Page "+number);
      if(text)for(const paragraph of text.split("\n\n"))make(leaf,"p","",paragraph);
      return leaf;
    };
    // A full spread prints its words onto the painting, each page's block in the calmer of its top and bottom bands,
    // on a paper wash only as strong as the darkest pixel under the words needs for 7:1 against the ink. Where the
    // words would print too small to read, the spread stacks: the painting over plain paper.
    const overlay=leaf=>{
      leaf.classList.remove("jones-stacked");leaf.classList.add("jones-full");
      const pages=leaf.querySelectorAll(".jones-page"),img=leaf.querySelector(".jones-art"),band=leaf.clientHeight*BAND;
      if(!band)return false;
      for(const page of pages)page.dataset.band="bottom";
      const fits=size=>{
        leaf.style.setProperty("--type",size+"px");
        for(const page of pages)if(page.offsetHeight>band)return false;
        for(const p of leaf.querySelectorAll(".jones-page p"))if(p.scrollWidth>p.clientWidth)return false;
        return true;
      };
      if(!fits(MIN_TYPE))return false;
      let hi=26,lo=MIN_TYPE;
      if(fits(hi))lo=hi;
      else while(hi-lo>.125){
        const mid=(lo+hi)/2;
        if(fits(mid))lo=mid;else hi=mid;
      }
      leaf.style.setProperty("--type",lo+"px");
      const grid=sampleOf(img),frame=leaf.getBoundingClientRect();
      for(const page of pages){
        let best=null;
        for(const where of ["top","bottom"]){
          page.dataset.band=where;
          const box=page.getBoundingClientRect(),
            x0=(box.left-frame.left)/frame.width,y0=(box.top-frame.top)/frame.height,
            x1=(box.right-frame.left)/frame.width,y1=(box.bottom-frame.top)/frame.height,
            read=grid?washFor(grid,x0,y0,x1,y1):{wash:.92,busy:where==="top"?1:0},
            score=read.wash+.6*read.busy;
          if(!best || score<best.score)best={where,wash:read.wash,score};
        }
        page.dataset.band=best.where;
        page.style.setProperty("--wash",Math.max(WASH_FLOOR,best.wash).toFixed(3));
      }
      return true;
    };
    // Keep the largest type that leaves room for the whole illustration.
    // Measure the browser's own wrapping, including the letter's paragraph breaks.
    const fit=()=>{
      const leaf=stage.querySelector(".jones-spread"),height=stage.clientHeight;
      if(!leaf || !height || !stage.clientWidth)return;
      const letter=leaf.classList.contains("jones-letter");
      if(!letter){
        if(overlay(leaf))return;
        leaf.classList.remove("jones-full");leaf.classList.add("jones-stacked");
        for(const page of leaf.querySelectorAll(".jones-page")){page.removeAttribute("data-band");page.style.removeProperty("--wash");}
      }
      const pages=leaf.querySelectorAll(".jones-page");
      const stacked=letter && pages[1].offsetTop>pages[0].offsetTop;
      const available=height-1;
      leaf.style.setProperty("--art-limit",(letter && !stacked?available:available*(letter ? .24 : .34))+"px");
      // Words never break: the type shrinks until the longest word fits its page.
      const fits=size=>{
        leaf.style.setProperty("--type",size+"px");
        if(leaf.getBoundingClientRect().height>available)return false;
        for(const p of leaf.querySelectorAll(".jones-page p"))if(p.scrollWidth>p.clientWidth)return false;
        return true;
      };
      let hi=letter?23:26,lo=0;
      if(fits(hi))lo=hi;
      else while(hi-lo>.125){
        const mid=(lo+hi)/2;
        if(fits(mid))lo=mid;else hi=mid;
      }
      leaf.style.setProperty("--type",lo+"px");
      if(!letter || stacked){
        const textHeight=Math.max(pages[0].getBoundingClientRect().height,
          letter?0:pages[1].getBoundingClientRect().height);
        leaf.style.setProperty("--art-limit",Math.max(1,available-Math.ceil(textHeight))+"px");
      }
    };
    const sizeWatcher=new ResizeObserver(fit);
    sizeWatcher.observe(stage);
    dialog.addEventListener("close",()=>sizeWatcher.disconnect(),{once:true});
    document.fonts?.ready.then(fit);
    let index=0;
    const paint=()=>{
      stage.replaceChildren();
      if(index===0){
        const cover=make(stage,"article","jones-cover");
        cover.setAttribute("role","img");cover.setAttribute("aria-label",title+". For Jones, from Dad. A lantern-lit bridge stamped in gold.");
        binding().then(canvas=>{if(stage.contains(cover))cover.append(canvas);});
      }else{
        const s=spreads[index-1],leaf=make(stage,"article","jones-spread");
        if(s.right){
          leaf.classList.add("jones-full");
          art(leaf,s.art,s.alt);page(leaf,index*2-1,s.left);page(leaf,index*2,s.right);
        }else{
          leaf.classList.add("jones-letter");
          page(leaf,index*2-1,s.left);art(page(leaf,index*2),s.art,s.alt);
        }
      }
      upcomingKey=spreads[index]?.art || "";
      upcoming=upcomingKey?new Image():null;
      if(upcoming){upcoming.fetchPriority="low";upcoming.src=BL.pokerStoryArt[upcomingKey];}
      fit();
      status.textContent=index===0?"Front cover":"Pages "+(2*index-1)+"–"+(2*index);
      previous.disabled=index===0;next.disabled=index===spreads.length;
    };
    const turn=delta=>{
      const dest=index+delta;if(dest<0 || dest>spreads.length)return;
      index=dest;paint();
      if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
        const leaf=stage.querySelector(".jones-spread");
        if(leaf){
          // A passing paper shadow follows the turn without moving the printed words.
          const fold=make(leaf,"span","jones-fold");fold.setAttribute("aria-hidden","true");
          const flip=fold.animate([
            {transform:"translateX("+(delta>0?220:-220)+"%)",opacity:0},
            {opacity:.66,offset:.38},
            {transform:"translateX("+(delta>0?-220:220)+"%)",opacity:0}
          ],{duration:300,easing:"ease-in-out"});
          flip.onfinish=()=>fold.remove();
        }
      }
      if(previous.disabled)next.focus();else if(next.disabled)previous.focus();
    };
    previous.onclick=()=>turn(-1);next.onclick=()=>turn(1);putDown.onclick=()=>dialog.close();
    reader.onkeydown=e=>{
      if(e.altKey || e.ctrlKey || e.metaKey)return;
      if(e.key==="ArrowRight" || e.key==="ArrowLeft"){e.preventDefault();turn(e.key==="ArrowRight"?1:-1);}
    };
    paint();next.focus();
  };
  BL.pokerStorybook={read,title,binding};
})();
