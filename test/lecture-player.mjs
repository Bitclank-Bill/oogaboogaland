// Focused playback regressions: node --test test/lecture-player.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { load } from '../scripts/lecture-check.mjs';

const source = readFileSync(new URL('../src/js/lecture-player.js', import.meta.url), 'utf8');
const fixture = async (recorded = true) => {
  const { L } = load(['btc-01']);
  const media = [];
  class Audio {
    constructor() { this.currentTime = 0; this.paused = true; this.ended = false; this.listeners = new Map(); media.push(this); }
    addEventListener(type, listener) { this.listeners.set(type, listener); }
    emit(type) { this.listeners.get(type)?.(); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    removeAttribute() {}
    load() {}
  }
  const BL = { lectures: L, deferredScripts: recorded ? {} : null, deferred: { load: async () => {} }, sound: { muted: false, subscribe: () => () => {} } };
  vm.runInNewContext(source, { window: { BL }, Audio, localStorage: { getItem: () => null, setItem() {} } });
  const player = BL.lecturePlayer.create(), entry = { id: 'btc-01', group: 'lecture-btc-a', audio: 'btc-01.m4a' };
  await player.open(entry);
  return { player, media, entry, L };
};

for (const speed of [1, 1.25, 1.5, 2]) {
  test(`${speed}x: audio is the cue clock, pitch is preserved, pause and reopen keep rate`, async () => {
    const { player: p, media, entry, L } = await fixture();
    assert.equal(p.setSpeed(speed), true);
    assert.equal(media[0].playbackRate, speed);
    assert.equal(media[0].preservesPitch, true);
    p.play();
    media[0].currentTime = 30 * speed;
    p.update(0.016);
    assert.equal(p.time, 30 * speed);
    const expected = L.state(); L.at(p.timeline, p.time, expected);
    assert.deepEqual(p.state, expected);
    p.pause(); const held = p.time; p.update(1);
    assert.equal(p.time, held); assert.equal(media[0].paused, true);
    p.play(); assert.equal(media[0].currentTime, held);
    await p.open(entry); assert.equal(media[1].playbackRate, speed);
    assert.equal(p.setSpeed(0), false); assert.equal(p.setSpeed(3), false);
    assert.equal(p.speed, speed); p.dispose();
  });
  test(`${speed}x: caption-only playback advances at the same rate`, async () => {
    const { player: p } = await fixture(false);
    p.setSpeed(speed); p.play(); p.update(1);
    assert.equal(p.time, speed); p.dispose();
  });
  test(`${speed}x: normal quizzes wait, selected replies resume, forward sections remain unlocked`, async () => {
    const { player: p, media } = await fixture();
    p.setSpeed(speed); p.play();
    for (const q of p.timeline.quizzes) {
      p.seek(p.timeline.sentences[q.ask].start);
      media[0].currentTime = q.hold; p.update(0.016);
      assert.equal(p.waiting, q.i); assert.equal(media[0].paused, true);
      assert.equal(p.answer(q.answer), true);
      assert.equal(media[0].currentTime, q.branches[q.answer].start);
      assert.equal(media[0].playbackRate, speed);
      assert.equal(media[0].paused, false);
      media[0].currentTime = q.branches[q.answer].end; p.update(0.016);
      assert.equal(p.time, q.end);
    }
    p.seek(0);
    for (let i = 1; i < p.timeline.sections.length; i++) {
      p.section(1);
      assert.equal(p.time, p.timeline.sections[i].start);
      assert.equal(p.waiting, -1);
      assert.equal(media[0].currentTime, p.time);
    }
    // An arbitrary seek into reply audio still goes to the question, never another answer's speech.
    const q = p.timeline.quizzes[0];
    p.seek(q.branches[0].start);
    assert.equal(p.time, p.timeline.sentences[q.ask].start);
    p.dispose();
  });
}


test('stop silences and releases the recording while preserving unfinished or completed progress', async () => {
  const { player: p, media, entry } = await fixture();
  p.play(); media[0].currentTime = 70; p.update(0.016);
  p.close();
  assert.equal(media[0].paused, true);
  assert.equal(p.playing, false); assert.equal(p.recorded, false); assert.equal(p.timeline, null);
  assert.equal(p.progress[entry.id].t, 70); assert.equal(p.progress[entry.id].done, false);
  await p.open(entry); assert.equal(p.time, 66);
  p.seek(p.timeline.duration - 1); p.play(); media[1].ended = true; p.update(0.016);
  assert.equal(p.progress[entry.id].done, true);
  p.close(); assert.equal(p.progress[entry.id].done, true);
  p.dispose();
});

for (const playing of [false, true]) test(`scrub previews without seeking, then restores playing=${playing}`, async () => {
  const { player: p, media, L } = await fixture();
  p.seek(20); if (playing) p.play();
  const state = JSON.stringify(p.state);
  assert.equal(p.beginScrub(), true); assert.equal(media[0].paused, true);
  p.moveScrub(70.4); p.play(); p.update(10);
  assert.equal(p.time, 20); assert.equal(media[0].currentTime, 20);
  assert.equal(JSON.stringify(p.state), state); assert.equal(p.scrubTime, 70);
  p.moveScrub(Infinity); assert.equal(p.scrubTime, 70);
  p.moveScrub(-10); assert.equal(p.scrubTime, 0);
  p.moveScrub(1e9); assert.equal(p.scrubTime, Math.floor(p.timeline.duration));
  p.moveScrub(70.6); p.endScrub();
  assert.equal(p.time, 71); assert.equal(media[0].currentTime, 71);
  assert.equal(p.playing, playing); assert.equal(media[0].paused, !playing);
  const expected = L.state(); L.at(p.timeline, 71, expected); assert.deepEqual(p.state, expected);
  p.dispose();
});
test('cancel and Stop during a drag never restart playback', async () => {
  const { player: p, media } = await fixture();
  p.seek(20); p.play(); p.beginScrub(); p.moveScrub(80); p.endScrub(true);
  assert.equal(p.time, 20); assert.equal(p.playing, false); assert.equal(media[0].paused, true);
  p.play(); p.beginScrub(); p.close(); assert.equal(p.endScrub(), false);
  assert.equal(p.playing, false); assert.equal(p.timeline, null); p.dispose();
});
test('exact scrub into every quiz reply retains that reply without awarding an answer', async () => {
  const { player: p, media } = await fixture();
  for (const q of p.timeline.quizzes) for (const branch of q.branches) {
    p.play(); p.beginScrub(); const target = Math.ceil(branch.start + 1);
    p.moveScrub(target); p.endScrub(); p.update(.01);
    assert.equal(p.time, target); assert.equal(p.waiting, -1);
    assert.equal(p.progress['btc-01'].q, 0);
    media[0].currentTime = branch.end; p.update(.01); assert.equal(p.time, q.end);
  }
  p.dispose();
});

for (const speed of [1, 1.25, 1.5, 2]) test(`${speed}x: background media events synchronize cues and hold a crossed quiz without frames`, async () => {
  const { player: p, media, L } = await fixture();
  p.setSpeed(speed); p.play();
  const audio = media[0], expected = L.state(), q = p.timeline.quizzes[0];
  audio.currentTime = 100; audio.emit('timeupdate');
  L.at(p.timeline, p.time, expected); assert.deepEqual(p.state, expected);
  assert.equal(p.time, 100); assert.equal(p.state.section, expected.section);
  // Simulate a throttled event arriving after all reply audio, with no animation frames in between.
  audio.currentTime = q.end + 10; audio.emit('timeupdate');
  assert.equal(p.time, q.hold - .02); assert.equal(p.waiting, q.i);
  assert.equal(audio.paused, true); assert.equal(audio.currentTime, p.time);
  L.at(p.timeline, p.time, expected); assert.deepEqual(p.state, expected);
  assert.equal(p.state.quiz, q.i);
  // The first foreground frame returns early at a held quiz: its cue state must already be correct.
  p.update(.016); assert.deepEqual(p.state, expected);
  p.answer(q.answer); audio.currentTime = q.branches[q.answer].end; audio.emit('timeupdate');
  assert.equal(p.time, q.end); L.at(p.timeline, p.time, expected); assert.deepEqual(p.state, expected);
  p.dispose();
});
test('background completion and stale recording events preserve the active lecture state', async () => {
  const { player: p, media, entry, L } = await fixture();
  p.seek(p.timeline.duration - 1); p.play();
  media[0].ended = true; media[0].paused = true; media[0].emit('ended');
  assert.equal(p.ended, true); assert.equal(p.playing, false); assert.equal(p.progress[entry.id].done, true);
  const expected = L.state(); L.at(p.timeline, p.timeline.duration, expected); assert.deepEqual(p.state, expected);
  await p.open(entry); p.play(); media[1].currentTime = 80;
  media[0].emit('timeupdate'); assert.equal(p.time, 0);
  media[1].emit('timeupdate'); assert.equal(p.time, 80);
  p.pause(); media[1].currentTime = 120; media[1].emit('timeupdate'); assert.equal(p.time, 80);
  p.dispose(); media[1].emit('ended'); assert.equal(p.timeline, null);
});
