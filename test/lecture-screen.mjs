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
  console.log(`${checks} lecture screen and pointing checks passed`);
} finally { await b.close(); }
