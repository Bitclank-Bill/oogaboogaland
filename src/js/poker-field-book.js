// Jones's picture book on the reading table. Picking it up opens the illustrated reader.
(() => {
  "use strict";
  const BL=window.BL,M=BL.models;
  const build=({item,add,box,paper},r)=>{
    const cloth="#aa4b1d";
    const book=item(BL.pokerStorybook.title,M.merge(box(0,.023,0,.63,.046,.63,cloth),
      box(0,.065,0,.60,.045,.60,paper),box(0,.098,0,.63,.024,.63,cloth),
      box(-.30,.064,0,.04,.10,.63,"#67391f")),BL.pokerLoungeStone.sideTableX,BL.pokerLoungeStone.sideTableTop,BL.pokerLoungeStone.sideTableZ(r),open);
    book.scale.x=book.scale.y=book.scale.z=.52;
    const jacket=M.panel({w:.62,h:.62,color:"#ffffff",altColor:"#ffffff",tilesX:1,tilesY:1,emissive:.30});
    const inset=add(book,jacket,0,.112,0);inset.rotation.x=-Math.PI/2;
    BL.pokerStorybook.binding().then(canvas=>{
      jacket.imageSurface={canvas,rect:[-.31,-.31,.62,.62],version:1,smooth:true};
    });
    book.rotation.y=.15;
    function open(ui){
      book.visible=false;
      BL.pokerStorybook.read(ui);
    }
    return {node:book,close(){book.visible=true;}};
  };
  BL.pokerFieldBook={build};
})();
