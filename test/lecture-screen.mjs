// Focused integration regression: npm run build && node test/lecture-screen.mjs
// Uses the portable page's caption clock; recorded playback is covered by lecture-player.mjs.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { launch } from './browser.mjs';
const b = await launch({ w: 1440, h: 900 });
let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks++; };
try {
  await b.open(pathToFileURL(resolve('oogaboogaland.html')).href + '?debug=1&nosim=1&net=0&welcome=0&character=portlandhodl&pos=0#/sphere-1');
  for (let i = 0; i < 100; i++) {
    if (await b.evaluate('!!window.__ooga?.timechain?.motion')) break;
    await b.sleep(100);
  }
  await b.evaluate(`(async () => {
    const B = __ooga, M = B.timechain.motion, P = M.player;
    await P.open(BL.lectures.courseOf('first-principles').lectures[0]);
    window.quizTest = {
      ask(i = 0) {
        P.play(); const q = P.timeline.quizzes[i];
        P.seek(P.timeline.sentences[q.ask].start); P.update(q.hold - P.time + .01); B.advance(.2, 1 / 60);
      },
      point(i, across = .6, down = .5) {
        const D = M.screens().slide, r = M.quizRows[i], L = B.timechain.layout;
        const x = (r.x + r.w * across) / D.w, y = (r.y + r.h * down) / D.h, deg = Math.PI / 180;
        const el = Math.asin(Math.sin(D.el1 * deg) - y * (Math.sin(D.el1 * deg) - Math.sin(D.el0 * deg)));
        const p = BL.timechainRooms.onSphere(L, (D.az0 + x * (D.az1 - D.az0)) * deg, el, .994);
        return B.project(p.x, p.y, p.z);
      }
    };
    quizTest.ask();
  })()`);
  check(await b.evaluate('!document.getElementById("lecture-quiz") && !document.querySelector("dialog:modal")'), 'question stays on the dome without a floating card');
  for (const combat of [false, true]) for (const x of [-3, 0, 3]) {
    await b.evaluate(`(() => {
      const B = __ooga;
      if (B.pilot.aiming !== ${combat}) B.pilot.modeAction('mode-toggle');
      B.pilot.navigate({ position: { x: ${x}, y: 0, z: B.timechain.layout.arrival.z }, yaw: 0, pitch: .04, dist: 4 });
      B.advance(.3, 1 / 60); B.pilot.freeCursor(); quizTest.ask();
    })()`);
    await b.sleep(60);
    const option = x === 0 ? 1 : 0;
    const pt = await b.evaluate(`quizTest.point(${option}, ${x < 0 ? '.15' : x > 0 ? '.85' : '.6'})`);
    check(pt && pt.x > 0 && pt.x < 1440 && pt.y > 55 && pt.y < 900, 'projected row is visible');
    await b.mouse('mouseMoved', pt.x, pt.y, { button: 'none' });
    await b.evaluate('__ooga.advance(.1, 1 / 60)');
    check(await b.evaluate(`__ooga.timechain.motion.quizHover === ${option}`), `hover maps to curved row in ${combat ? 'combat' : 'carry'}, x=${x}`);
    await b.click(pt.x, pt.y);
    await b.evaluate('__ooga.advance(.05, 1 / 60)');
    check(await b.evaluate(`(() => { const p = __ooga.timechain.motion.player; return p.waiting === -1 && p.state.show === ${option + 1} && !document.querySelector('dialog:modal'); })()`), 'real click chooses the corresponding right or wrong reply');
    check(await b.evaluate('__ooga.timechain.motion.quizHover === -1'), 'answer clears hover');
    await b.evaluate('document.exitPointerLock?.()'); await b.sleep(60);
  }
  // The gap between rows must not choose either neighboring answer.
  await b.evaluate(`(() => { const B = __ooga; if (B.pilot.aiming) B.pilot.modeAction('mode-toggle'); quizTest.ask(); })()`);
  const gap = await b.evaluate('quizTest.point(0, .5, 1.1)');
  await b.click(gap.x, gap.y);
  check(await b.evaluate('__ooga.timechain.motion.player.waiting === 0 && !document.querySelector("dialog:modal")'), 'row gaps neither answer nor open a panel');
  // All five question layouts, including wrapped questions and keyboard keys captured for weapons elsewhere.
  for (let i = 0; i < 5; i++) {
    await b.evaluate(`quizTest.ask(${i})`);
    const pt = await b.evaluate('quizTest.point(1)');
    await b.mouse('mouseMoved', pt.x, pt.y, { button: 'none' }); await b.evaluate('__ooga.advance(.1,1/60)');
    check(await b.evaluate('__ooga.timechain.motion.quizHover === 1'), 'wrapped question shares its painted hit bounds');
    await b.key(i % 2 ? '1' : '2');
    check(await b.evaluate('__ooga.timechain.motion.player.waiting === -1'), 'number shortcuts work through the room weapon-key capture');
  }
  // Combat's focused center reticle selects without needing the floating/native cursor.
  await b.evaluate(`(() => { const B = __ooga; B.pilot.freeCursor(); if (!B.pilot.aiming) B.pilot.modeAction('mode-toggle'); B.pilot.freeCursor(); })()`);
  const center = await b.evaluate('({ x: innerWidth / 2, y: innerHeight / 2 })');
  await b.mouse('mouseMoved', center.x, center.y, { button: 'none' });
  await b.evaluate(`(() => {
    const B = __ooga, M = B.timechain.motion, L = B.timechain.layout, P = B.pilot;
    quizTest.ask(); P.enterClose();
    const position = { x: 0, y: 0, z: L.arrival.z };
    P.navigate({ position, yaw: 0, pitch: .04, dist: 4 }); B.advance(.2, 1 / 60);
    const D = M.screens().slide, r = M.quizRows[1], y = (r.y + r.h / 2) / D.h, deg = Math.PI / 180;
    const el = Math.asin(Math.sin(D.el1 * deg) - y * (Math.sin(D.el1 * deg) - Math.sin(D.el0 * deg)));
    const target = BL.timechainRooms.onSphere(L, 0, el, .994), eye = B.camera.position;
    const pitch = -Math.atan2(target.y - eye.y, eye.z - target.z);
    P.navigate({ position, yaw: 0, pitch, dist: 4 }); P.focusAim(true); B.advance(.3, 1 / 60);
    for (let i = 0; i < 4; i++) { const point = quizTest.point(1, .5); P.hooks.onOrbit(0, (point.y - innerHeight / 2) * .36); B.advance(.1, 1 / 60); }
  })()`);
  await b.sleep(80); await b.evaluate('__ooga.advance(.1, 1 / 60)');
  check(await b.evaluate('__ooga.pilot.aimFocused && __ooga.timechain.motion.quizHover === 1'), 'focused combat reticle highlights its row');
  await b.click(center.x, center.y);
  check(await b.evaluate('__ooga.timechain.motion.player.waiting === -1 && __ooga.timechain.motion.player.state.show === 2'), 'focused combat click selects the reticle answer');
  await b.evaluate('__ooga.pilot.freeCursor()');
  // The opaque green arrow exists only when the quiz screen center is outside the view.
  await b.evaluate(`window.quizTest.green = () => {
    const c = document.getElementById('overlay'), read = quizTest.readCanvas || (quizTest.readCanvas = document.createElement('canvas'));
    read.width = c.width; read.height = c.height;
    const ctx = read.getContext('2d', { willReadFrequently: true }); ctx.drawImage(c, 0, 0);
    const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
    let rim = 0, arrow = 0;
    for (let i = 0; i < pixels.length; i += 4) if (Math.abs(pixels[i] - 98) <= 3 && Math.abs(pixels[i + 1] - 218) <= 3 && Math.abs(pixels[i + 2] - 148) <= 3) {
      if (pixels[i + 3] > 40) rim++;
      if (pixels[i + 3] > 250) arrow++;
    }
    return { rim, arrow };
  }`);
  const glow = [];
  for (const yaw of [0, Math.PI / 2, Math.PI]) {
    glow.push(await b.evaluate(`(() => { const B = __ooga; quizTest.ask(); B.pilot.navigate({ position: { x: 0, y: 0, z: B.timechain.layout.arrival.z }, yaw: ${yaw}, pitch: .04, dist: 4 }); B.advance(1,1/60); return quizTest.green(); })()`));
  }
  check(glow[0].rim > 100 && glow[0].arrow === 0 && glow[1].arrow > 50 && glow[2].arrow > 50, 'quiz rim and arrow follow visible, side and behind-camera views: ' + JSON.stringify(glow));
  await b.evaluate('__ooga.timechain.motion.player.pause(); __ooga.advance(2, 1 / 60)');
  check(await b.evaluate('quizTest.green().rim === 0 && __ooga.timechain.motion.quizHover === -1'), 'pause clears quiz hover and attention cues');
  // No hand or arm roll: thumb-side direction remains upward throughout both overhead raises.
  const poses = await b.evaluate(`(() => {
    const B = __ooga, M = B.timechain.motion, results = [];
    for (const sign of [-1, 1]) {
      const parent = BL.scene.createNode(), lecturer = BL.lecturer.create({ parent, profile: BL.lectures.courseOf('first-principles').lecturer, stage: M.stage, hall: B.timechain.layout });
      const c = M.stage.places.centre;
      lecturer.root.position.x = c.x; lecturer.root.position.z = c.z;
      const st = { ...M.player.state, place: 'centre', gesture: 'point', speaking: true, into: .5 };
      const aim = { x: c.x + sign * 8, y: M.stage.top + 12, z: c.z - 12 };
      const parts = lecturer.figure.parts, side = sign < 0 ? 'R' : 'L';
      let min = Infinity;
      for (let frame = 0; frame < 150; frame++) {
        lecturer.update(1 / 60, frame / 60, st, true, null, aim, false);
        BL.scene.updateWorld(parent);
        const m = parts['fingers' + side].world;
        min = Math.min(min, sign * m[1] / Math.hypot(m[0], m[1], m[2]));
      }
      results.push({ min, roll: parts['arm' + side].rotation.y, wrist: parts['fingers' + side].rotation.y });
      lecturer.dispose();
    }
    return results;
  })()`);
  check(poses.every(p => p.min >= 0 && p.roll === 0 && p.wrist === 0), 'both pointing arms keep the thumb above the hand without axial roll: ' + JSON.stringify(poses));
  check(b.logs.length === 0, 'browser console stays clean: ' + JSON.stringify(b.logs));
  // Real pointer capture on the projected outline: previews hold the scene, releases seek once.
  await b.evaluate(`window.quizTest.bar = (fraction) => {
    const B = __ooga, D = B.timechain.motion.screens().outline, L = B.timechain.layout, deg = Math.PI / 180;
    const bar = BL.lectureSlides.timebar(D.w, D.h), x = (bar.x + bar.w * fraction) / D.w, y = (bar.y + bar.h / 2) / D.h;
    const el = Math.asin(Math.sin(D.el1 * deg) - y * (Math.sin(D.el1 * deg) - Math.sin(D.el0 * deg)));
    const p = BL.timechainRooms.onSphere(L, (D.az0 + x * (D.az1 - D.az0)) * deg, el, .994);
    return B.project(p.x, p.y, p.z);
  }`);
  for (const combat of [false, true]) for (const playing of [false, true]) {
    await b.evaluate(`(() => {
      const B = __ooga, P = B.timechain.motion.player;
      if (B.pilot.aiming !== ${combat}) B.pilot.modeAction('mode-toggle');
      B.pilot.navigate({ position: { x: 0, y: 0, z: B.timechain.layout.arrival.z }, yaw: Math.PI * .4, pitch: .04, dist: 4 });
      B.pilot.freeCursor(); P.pause(); P.seek(20); ${playing ? 'P.play();' : ''} B.advance(.1,1/60);
    })()`);
    const start = await b.evaluate('quizTest.bar(.4)'), end = await b.evaluate('quizTest.bar(.55)');
    await b.mouse('mousePressed', start.x, start.y, { button: 'left', clickCount: 1 });
    check(await b.evaluate('__ooga.timechain.motion.player.scrubbing && !__ooga.timechain.motion.player.playing'), 'bar press captures and pauses in ' + (combat ? 'combat' : 'carry'));
    const held = await b.evaluate('__ooga.timechain.motion.player.time');
    await b.mouse('mouseMoved', end.x, end.y, { button: 'left', buttons: 1 });
    await b.evaluate('__ooga.advance(.2,1/60)');
    check(await b.evaluate(`(() => { const p=__ooga.timechain.motion.player; return p.time === ${held} && Math.abs(p.scrubTime - Math.round(p.timeline.duration*.55)) < 3; })()`), 'drag previews the selected second while the cue clock stays frozen');
    const target = await b.evaluate('__ooga.timechain.motion.player.scrubTime');
    await b.mouse('mouseReleased', end.x, end.y, { button: 'left', clickCount: 1 });
    check(await b.evaluate(`(() => { const p=__ooga.timechain.motion.player; return !p.scrubbing && p.playing === ${playing} && Math.abs(p.time - ${target}) < 1; })()`), 'release seeks and restores the previous playback state');
  }
  // The thumb itself starts a hold without snapping to the pointer's offset.
  await b.evaluate('(() => { const p=__ooga.timechain.motion.player; p.pause(); p.seek(500); __ooga.advance(.1,1/60); })()');
  const thumbTime = await b.evaluate('__ooga.timechain.motion.player.time');
  const thumb = await b.evaluate('quizTest.bar(__ooga.timechain.motion.player.time / __ooga.timechain.motion.player.timeline.duration)');
  await b.mouse('mousePressed', thumb.x, thumb.y, { button: 'left', clickCount: 1 });
  const thumbState = await b.evaluate('({active: __ooga.timechain.motion.player.scrubbing, time: __ooga.timechain.motion.player.scrubTime})');
  check(thumbState.active && thumbState.time === Math.round(thumbTime), 'thumb press preserves the selected second: ' + JSON.stringify({thumbState, thumbTime, thumb}));
  const frozenPose = await b.evaluate('JSON.stringify(__ooga.timechain.motion.lecturer.figure.parts.armR.rotation)');
  await b.evaluate('__ooga.advance(2,1/60)');
  check(await b.evaluate('JSON.stringify(__ooga.timechain.motion.lecturer.figure.parts.armR.rotation)') === frozenPose, 'professor stays frozen throughout a held scrub');
  await b.mouse('mouseReleased', thumb.x, thumb.y, { button: 'left', clickCount: 1 });
  const cancel = await b.evaluate('quizTest.bar(.3)');
  await b.mouse('mousePressed', cancel.x, cancel.y, { button: 'left', clickCount: 1 });
  await b.evaluate('window.dispatchEvent(new Event("blur"))');
  check(await b.evaluate('!__ooga.timechain.motion.player.scrubbing && !__ooga.timechain.motion.player.playing'), 'blur cancels the captured drag and leaves playback paused');
  await b.mouse('mouseReleased', cancel.x, cancel.y, { button: 'left', clickCount: 1 });
  // Jump backwards within one unfinished stroke, where an incremental painter must erase later ink.
  const drawingTarget = await b.evaluate(`(() => {
    const B=__ooga, P=B.timechain.motion.player;
    B.pilot.freeCursor(); if (B.pilot.aiming) B.pilot.modeAction('mode-toggle');
    const stroke=P.timeline.strokes.find(s => s.length > 1.4 && s.start > P.timeline.duration * .3), target=Math.ceil(stroke.start + .05);
    P.pause(); P.seek(stroke.start + stroke.length - .1);
    B.pilot.navigate({position:{x:0,y:0,z:B.timechain.layout.arrival.z},yaw:Math.PI*.4,pitch:.04,dist:4});
    B.pilot.freeCursor(); B.advance(.3,1/60); return {start:P.time/P.timeline.duration,end:target/P.timeline.duration};
  })()`);
  const ink = await b.evaluate(`quizTest.bar(${drawingTarget.start})`);
  await b.mouse('mousePressed', ink.x, ink.y, {button:'left',clickCount:1});
  check(await b.evaluate('__ooga.timechain.motion.player.scrubbing'), 'partial drawing can be scrubbed: ' + JSON.stringify({ink,drawingTarget,debug:await b.evaluate('({focus:__ooga.pilot.aimFocused, aiming:__ooga.pilot.aiming,dialog:!!document.querySelector("dialog:modal"),time:__ooga.timechain.motion.player.time})')}));
  const earlier = await b.evaluate(`quizTest.bar(${drawingTarget.end})`);
  await b.mouse('mouseMoved', earlier.x, earlier.y, {button:'left',buttons:1});
  await b.mouse('mouseReleased', earlier.x, earlier.y, {button:'left',clickCount:1});
  await b.evaluate('__ooga.advance(.01,1/60)');
  check(await b.evaluate(`(() => {
    const B=__ooga, P=B.timechain.motion.player, live=B.timechain.built.live.find(l=>l.spec.id==='board');
    const actual=live.node.geometry.imageSurface.canvas, expected=document.createElement('canvas');
    expected.width=actual.width; expected.height=actual.height;
    BL.lectureSlides.board(expected.getContext('2d'),expected.width,expected.height,BL.timechainRoomModels.paintKit,P.timeline,P.state.epoch,P.time,BL.lectureSlides.mark());
    return actual.toDataURL() === expected.toDataURL();
  })()`), 'backward seek redraws the board exactly at the selected time');
  check(await b.evaluate(`(() => { const M=__ooga.timechain.motion, p=M.lecturer.root.position, place=M.stage.places[M.player.state.place]; return Math.hypot(p.x-place.x,p.z-place.z)<.01; })()`), 'release places the professor at the selected cue');
  check(b.logs.length === 0, 'scrubbing keeps the console clean: ' + JSON.stringify(b.logs));
  // Media events continue while the director has no frames. Drive that clock deterministically, then deliver
  // the real visibility handler and check what the hall paints on its first frame back.
  const background = await b.evaluate(`(async () => {
    const B=__ooga, M=B.timechain.motion, P=M.player, LS=BL.lectureSlides;
    const AudioClass=window.Audio, deferred=BL.deferredScripts, hidden=Object.getOwnPropertyDescriptor(document,'hidden');
    const painters={slide:LS.slide,board:LS.board,caption:LS.caption}, painted={}, results=[];
    let audio;
    window.Audio=class extends EventTarget {
      constructor() { super(); audio=this; this.currentTime=0; this.paused=true; this.ended=false; }
      play() { this.paused=false; return Promise.resolve(); }
      pause() { this.paused=true; }
      removeAttribute() {}
      load() {}
    };
    const show = (value) => { Object.defineProperty(document,'hidden',{configurable:true,value:!value}); document.dispatchEvent(new Event('visibilitychange')); };
    LS.slide=(...args)=>{painted.slide=args[4];painted.show=args[5];return painters.slide(...args);};
    LS.board=(...args)=>{painted.epoch=args[5];painted.time=args[6];return painters.board(...args);};
    LS.caption=(...args)=>{painted.caption=args[4];return painters.caption(...args);};
    try {
      BL.deferredScripts={}; await P.open(BL.lectures.courseOf('first-principles').lectures[0]); P.seek(0); P.play(); B.advance(.01,1/60);
      show(false);
      audio.currentTime=100; audio.dispatchEvent(new Event('timeupdate'));
      const expected=BL.lectures.state(); BL.lectures.at(P.timeline,100,expected);
      results.push({ok:P.state.sentence===expected.sentence && P.time===100,message:'hidden media event updates lecture cues without a frame'});
      show(true); B.advance(.01,1/60);
      const current = () => painted.slide===P.timeline.slides[P.state.slide].slide && painted.show===P.state.show && painted.caption===P.timeline.sentences[P.state.sentence].text && painted.epoch===P.state.epoch && painted.time===P.time;
      results.push({ok:current(),message:'first visible frame paints current slide, caption and board time'});
      const place=M.stage.places[P.state.place], position=M.lecturer.root.position;
      results.push({ok:Math.hypot(position.x-place.x,position.z-place.z)<.01,message:'first visible frame places professor at the current cue'});
      show(false);
      const q=P.timeline.quizzes[0]; audio.currentTime=q.end+10; audio.dispatchEvent(new Event('timeupdate'));
      show(true); B.advance(.01,1/60);
      results.push({ok:current() && P.waiting===q.i && P.state.quiz===q.i && audio.paused,message:'quiz reached in background returns to the correct question screen'});
    } finally {
      P.close(); window.Audio=AudioClass; BL.deferredScripts=deferred; Object.assign(LS,painters);
      if (hidden) Object.defineProperty(document,'hidden',hidden); else delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    }
    return results;
  })()`);
  for (const result of background) check(result.ok, result.message);
  check(b.logs.length === 0, 'background catch-up keeps the console clean: ' + JSON.stringify(b.logs));
  console.log(`${checks} lecture screen and pointing checks passed`);
} finally { await b.close(); }
