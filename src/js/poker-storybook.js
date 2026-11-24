// Each stop after the binding is a pair of facing pages, in reading order.
(() => {
  "use strict";
  const BL=window.BL, title="The Bridge I Left You";
  const spreads=[
    {
      art:"s1",alt:"Wide-eyed baby Jones watches Dad write by lamplight. Dad has a bald head, a square jaw and close stubble. Tiny shoes sit beside his letter.",
      left:"Hey, Jones. You found it.",
      right:"You were four months old when I wrote this. You looked at everything with your eyes wide open, like you were taking it all in. I wonder what you’ll notice in these pages that I missed."
    },{
      art:"s2",alt:"At his keyboard, Dad builds a tool for planning ahead. A family looks at its savings and a calendar together.",
      left:"In 2011, I started Hot Pixel Group. The first thing I built was a website called myGooru. It helped people learn about money. They could see what they had, track how they were doing, and plan for the future they wanted.",
      right:"I taught myself to write software, Jones. Nobody showed me how to be an engineer. I had to figure it out one piece at a time. Even myGooru began with a blinking cursor waiting for me to type."
    },{
      art:"s3",alt:"Dad listens at the edge of a busy square. A lamp and a jumble of objects cast a funny monster’s shadow.",
      left:"My Bitcoin story began in Minnesota. I don’t remember the first time I heard the word. I do remember buying a little in 2016. In 2017 and 2018, I paid more attention and bought more.",
      right:"Even then, I couldn’t explain why a bitcoin was worth anything. I came to think it was a scam, and in 2018 I sold all of mine. It’s easy to imagine a monster when all you can see is a shadow."
    },{
      art:"s4",alt:"Dad’s team sketches an app. A lamp reveals the objects behind the monster. Distant neighbors open matching rulebooks.",
      left:"Around then I joined a small team building an app about Bitcoin and other digital money. I knew how to write software. I had a lot to learn about the money part. In late 2018, I finally started digging.",
      right:"I kept reading into 2019. Computers on the internet follow rules so they can talk to each other. Bitcoin has rules, too. A computer that checks them is called a node. All around the world, those nodes can check the same payment for themselves."
    },{
      art:"s5",alt:"Neighbors wave across a quiet street. Dad turns from a rising chart to the people beyond his window.",
      left:"In March 2020, COVID made people sick and shops closed. As the pandemic went on, new dollars were created and the stock market bounced back. I watched what that meant for my friends.",
      right:"Some friends already owned things like stocks. Those went up in value without my friends having to do a thing. My friends who worked for dollars and didn’t own those things could work just as hard and miss out. That felt unfair to me, Jones."
    },{
      art:"s6",alt:"Three copper coins lie on the counter on both market days. The second basket holds less. Across the river, a toy boat passes from its maker to a new owner.",
      left:"Imagine working a whole hour for the coins in your hand. Last time, those coins filled your basket. Today you have to leave something behind. You can save your coins, but you can’t put that hour back in your day.",
      right:"That was when Bitcoin stood apart for me. Anyone can check its rules, including the limit on how much bitcoin there can be. Nobody can change those rules alone. Two people with internet access can pay each other without a bank account. I felt I had a responsibility to help people learn about that choice."
    },{
      art:"s7",alt:"Neighbors pull chairs beside an empty lockbox. At a lamplit table Dad and his friends experiment with dice, tiles, and locks.",
      left:"Some people lost their bitcoin because someone could guess the secret words to their wallets. I went looking for people working on that problem. That’s how I found friends who cared about the same thing.",
      right:"Think of rolling a handful of dice under a cup. Could a friend guess every number before you lifted it? Together we built Entropy Lab to teach people why the secret to a wallet has to be so hard to guess."
    },{
      art:"s8",alt:"The friends’ drawn paths become floating islands and caves. Behind a bookcase is Jones’s marble lounge, its flame carving above the fire.",
      left:"What if you could walk inside the things we were learning? Those friends and I built Ooga Booga Land so people from anywhere could come play and discover something about Bitcoin for themselves.",
      right:"I helped build this world with a lot of good people. And this room, the one where you found the book?\n\nI built it for you."
    },{
      art:"s9",alt:"A younger Ooga points to the bridge in the book. Jones bends close to see. Beside them a lantern tilts, and on the far bank friends leave room on a plan for the next bridge.",
      left:"Dear Jones,\n\nYour mom and I hope you keep looking at the world with those wide-open eyes. Someday you’ll spot something I’ve walked past a hundred times. I’d love to hear you say, “Dad, come look.”\n\nI taught myself to build software. My friends in Bitcoin taught me a lot about life, about being free to choose what makes us happy, and about what we do with the time and energy we spend earning our money.\n\nBitcoin represents hope for fairer, freer, brighter future for humanity where the technology we use to get what we need from each other cannot be manipulated and corrupted.\n\nI want you, Jones, to be the person that pulls up a chair to help others. Be a node that continues to connect others, especially those that seem stranded. Be a bridge to a better place.\n\nAlways remember this: you are capable of building the world that you want to see.\n\nLove,\nDad"
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
    // Keep the largest type that leaves room for the whole illustration.
    // Measure the browser's own wrapping, including the letter's paragraph breaks.
    const fit=()=>{
      const leaf=stage.querySelector(".jones-spread"),height=stage.clientHeight;
      if(!leaf || !height || !stage.clientWidth)return;
      const letter=leaf.classList.contains("jones-letter"),pages=leaf.querySelectorAll(".jones-page");
      const stacked=letter && pages[1].offsetTop>pages[0].offsetTop;
      const available=height-1;
      leaf.style.setProperty("--art-limit",(letter && !stacked?available:available*(letter ? .24 : .34))+"px");
      const fits=size=>{
        leaf.style.setProperty("--type",size+"px");
        return leaf.getBoundingClientRect().height<=available;
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
