// Private conversations over one-time pads (#188), shared unchanged by the classic page and the unit tier: the pad
// file two people swap outside Ooga, how a message is sealed and opened with it, and this device's record of how much
// of it is used. private-chat.js shows a conversation; the room only relays sealed frames (docs/auth-and-presence.md).
// The pad file: "OOGAPAD1", a 16-byte pad id, the two GitHub logins it was made for (lower case, the first is sender
// 0), then the material: CHECK bytes that only feed the fingerprint, and two equal halves, one for each sender, so the
// two directions never share a byte. Nothing here certifies that a file's bytes are random; `make` fills them from
// crypto.getRandomValues.
// A frame: version, type, pad id, direction (the sender's half), offset into that half (u32) and text length (u16),
// then the text XORed with fresh pad bytes and an HMAC-SHA256 tag over all of it. The tag's key is the KEY bytes at
// the offset and the text's pad follows them, so every frame uses KEY + length bytes nobody used before, and the
// next offset in that half starts after them. HMAC with a fresh random key per message stops anyone without the pad
// from altering a frame or making one up; the pad alone would only hide it. Lengths and timing still show.
// The record (`ledger`): per pad and sender, where this device sends next and how far it has read the other half,
// kept in localStorage and changed under a Web Lock so two tabs never take the same bytes. A range is written as used
// before it is sealed, so a crash, a refused send or a retry never seals new text with it: a retry resends the same
// frame while nothing was sealed after it, and otherwise seals the same text on fresh bytes. A record that cannot be read or written stops the pad. The pad itself is never stored.
// A conversation (`session`) starts with a hello from each side carrying how far it has read the other's half; a side
// whose own record is behind that, or whose partner sends from a range already read, has used the pad before on
// another device or a restored profile, and the pad must be replaced. Exports PAD (sizes), make, parse, roleOf,
// fingerprint, seal, open, ledger, session.
(() => {
  "use strict";
  const scope = typeof window === "undefined" ? globalThis : window;
  const BL = scope.BL = scope.BL || {};
  const MAGIC = [79, 79, 71, 65, 80, 65, 68, 49];
  const ID = 16, CHECK = 32, KEY = 32, TAG = 32, HEAD = 25, VERSION = 1;
  // The whole material: enough for a few dozen lines each way, and no more than a phone reads into memory with ease.
  const MIN = 4096, MAX = 64 * 1024 * 1024;
  const TYPE = { hello: 1, text: 2 };
  // A line is chat-policy's 160 UTF-16 units at most: 480 bytes of UTF-8 (a pair of units is 4 bytes, one unit 3 at most).
  const TEXT_BYTES = 480, HELLO_BYTES = 4;
  const SIZES = [256 * 1024, 1024 * 1024, 16 * 1024 * 1024];
  const LOGIN = /^[a-z0-9][a-z0-9-]{0,38}$/;
  const STORE = "oogaboogaland.pad.";
  const RECENT = 32, OUTBOX = 32;
  const fail = (code) => Object.assign(new Error(code), { code });
  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder(), decoder = new TextDecoder("utf-8", { fatal: true });
  const same = (a, b) => {
    if (a.length !== b.length) return false;
    let d = 0;
    for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
    return d === 0;
  };

  /** A new pad file for `a` and `b` (GitHub logins), `size` bytes of material from `random` (getRandomValues). */
  const make = (a, b, size, random) => {
    const one = String(a).toLowerCase(), two = String(b).toLowerCase();
    if (!LOGIN.test(one) || !LOGIN.test(two)) throw fail("login");
    if (one === two) throw fail("same");
    if (!Number.isInteger(size) || size < MIN || size > MAX) throw fail("size");
    const names = [encoder.encode(one), encoder.encode(two)];
    const head = MAGIC.length + ID + 2 + names[0].length + names[1].length;
    const out = new Uint8Array(head + size);
    out.set(MAGIC, 0);
    // getRandomValues fills 65536 bytes a call at most.
    for (let i = MAGIC.length; i < MAGIC.length + ID; i += 65536) random(out.subarray(i, Math.min(MAGIC.length + ID, i + 65536)));
    let at = MAGIC.length + ID;
    for (const name of names) { out[at++] = name.length; out.set(name, at); at += name.length; }
    for (let i = head; i < out.length; i += 65536) random(out.subarray(i, Math.min(out.length, i + 65536)));
    return out;
  };

  /** A pad file's parts, read in place (no copies), or an error with `code`: magic, short, login, same or size. */
  const parse = (bytes) => {
    if (!(bytes instanceof Uint8Array)) throw fail("magic");
    for (let i = 0; i < MAGIC.length; i++) if (bytes[i] !== MAGIC[i]) throw fail("magic");
    let at = MAGIC.length + ID;
    const logins = [];
    for (let k = 0; k < 2; k++) {
      const n = bytes[at];
      if (n === undefined || at + 1 + n > bytes.length) throw fail("short");
      let name;
      try { name = decoder.decode(bytes.subarray(at + 1, at + 1 + n)); } catch { throw fail("login"); }
      if (!LOGIN.test(name)) throw fail("login");
      logins.push(name);
      at += 1 + n;
    }
    if (logins[0] === logins[1]) throw fail("same");
    const size = bytes.length - at;
    if (size < MIN) throw fail("short");
    if (size > MAX) throw fail("size");
    const half = (size - CHECK) >> 1, start = at + CHECK;
    const id = bytes.subarray(MAGIC.length, MAGIC.length + ID);
    return { id, idHex: hex(id), logins, head: bytes.subarray(0, at), check: bytes.subarray(at, start),
      halves: [bytes.subarray(start, start + half), bytes.subarray(start + half, start + 2 * half)] };
  };

  /** Which half `me` sends from, talking to `peer`: 0 or 1; `not-you` or `not-peer` when the pad was made for others. */
  const roleOf = (pad, me, peer) => {
    const a = String(me).toLowerCase(), b = String(peer).toLowerCase();
    if (!pad.logins.includes(a)) throw fail("not-you");
    if (a === b || !pad.logins.includes(b)) throw fail("not-peer");
    return pad.logins[0] === a ? 0 : 1;
  };

  /** What two people compare outside Ooga to know they hold the same file: 20 hex digits in groups of four. */
  const fingerprint = async (subtle, pad) => {
    const joined = new Uint8Array(pad.head.length + pad.check.length);
    joined.set(pad.head, 0); joined.set(pad.check, pad.head.length);
    const digits = hex(new Uint8Array(await subtle.digest("SHA-256", joined)).subarray(0, 10));
    return digits.match(/.{4}/g).join(" ");
  };

  const tagOf = async (subtle, key, data) => {
    const k = await subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return new Uint8Array(await subtle.sign("HMAC", k, data));
  };

  /** A sealed frame of `type` carrying `plain`, sent from half `role` at `offset`, which the caller has recorded as used. */
  const seal = async (subtle, pad, role, offset, type, plain) => {
    const half = pad.halves[role], len = plain.length;
    if (len > TEXT_BYTES) throw fail("long");
    if (!Number.isInteger(offset) || offset < 0 || offset + KEY + len > half.length) throw fail("exhausted");
    const frame = new Uint8Array(HEAD + len + TAG), view = new DataView(frame.buffer);
    frame[0] = VERSION; frame[1] = type; frame.set(pad.id, 2); frame[18] = role;
    view.setUint32(19, offset); view.setUint16(23, len);
    const stream = half.subarray(offset + KEY, offset + KEY + len);
    for (let i = 0; i < len; i++) frame[HEAD + i] = plain[i] ^ stream[i];
    frame.set(await tagOf(subtle, half.subarray(offset, offset + KEY), frame.subarray(0, HEAD + len)), HEAD + len);
    return frame;
  };

  /** A frame from the other side opened, `{ ok: true, type, offset, next, plain, tag }`, or `{ ok: false, error }`:
   * malformed, version, pad (another pad), direction (not the other side's half), range or auth (the tag fails). */
  const open = async (subtle, pad, role, frame) => {
    if (!(frame instanceof Uint8Array) || frame.length < HEAD + TAG) return { ok: false, error: "malformed" };
    const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
    const len = view.getUint16(23), offset = view.getUint32(19), dir = frame[18], type = frame[1];
    if (frame.length !== HEAD + len + TAG || len > TEXT_BYTES || type !== TYPE.hello && type !== TYPE.text) return { ok: false, error: "malformed" };
    if (frame[0] !== VERSION) return { ok: false, error: "version" };
    if (!same(frame.subarray(2, 18), pad.id)) return { ok: false, error: "pad" };
    if (dir !== 1 - role) return { ok: false, error: "direction" };
    const half = pad.halves[dir];
    if (offset + KEY + len > half.length) return { ok: false, error: "range" };
    const tag = frame.subarray(HEAD + len);
    if (!same(await tagOf(subtle, half.subarray(offset, offset + KEY), frame.subarray(0, HEAD + len)), tag)) return { ok: false, error: "auth" };
    const plain = new Uint8Array(len), stream = half.subarray(offset + KEY, offset + KEY + len);
    for (let i = 0; i < len; i++) plain[i] = frame[HEAD + i] ^ stream[i];
    return { ok: true, type, offset, next: offset + KEY + len, plain, tag: hex(tag) };
  };

  /** This device's record for one pad and sender. `store` is { get(key), set(key, value) } over localStorage, which may
   * throw; `lock(name, fn)` runs fn alone across tabs (navigator.locks). Every method is async and throws an error
   * with `code` storage (unwritable), record (unreadable) or exhausted. */
  const ledger = (store, lock, pad, role) => {
    const key = STORE + pad.idHex + "." + role, size = pad.halves[role].length, other = pad.halves[1 - role].length;
    const valid = (r) => r && r.v === 1 && Number.isSafeInteger(r.send) && r.send >= 0 && r.send <= size && Number.isSafeInteger(r.recv) && r.recv >= 0 && r.recv <= other;
    const read = () => {
      let text;
      try { text = store.get(key); } catch { throw fail("storage"); }
      if (text === null || text === undefined) return null;
      let r;
      try { r = JSON.parse(text); } catch { throw fail("record"); }
      if (!valid(r)) throw fail("record");
      return r;
    };
    const write = (r) => {
      const text = JSON.stringify({ v: 1, send: r.send, recv: r.recv });
      try { store.set(key, text); } catch { throw fail("storage"); }
      // Read it back: a storage that drops writes must stop the pad, not let it reuse bytes after a reload.
      let back;
      try { back = store.get(key); } catch { throw fail("storage"); }
      if (back !== text) throw fail("storage");
    };
    return {
      size, other,
      // The record, made on the first use of this pad as this sender.
      start: () => lock(key, () => { const r = read() || { v: 1, send: 0, recv: 0 }; write(r); return { send: r.send, recv: r.recv }; }),
      // `need` bytes of this side's half, written as used before anyone seals with them; the offset they start at.
      reserve: (need) => lock(key, () => {
        const r = read();
        if (!r) throw fail("record");
        if (r.send + need > size) throw fail("exhausted");
        const offset = r.send;
        r.send += need;
        write(r);
        return offset;
      }),
      // How far the other side's half has been read, which only grows.
      received: (next) => lock(key, () => {
        const r = read();
        if (!r) throw fail("record");
        if (next > r.recv) { r.recv = next; write(r); }
        return r.recv;
      }),
      peek: () => lock(key, () => { const r = read(); return r ? { send: r.send, recv: r.recv } : null; }),
    };
  };

  /** One conversation on one pad: `send(frame, n)` hands a sealed frame to the room with a number to match its answer.
   * `start()` checks the record and says hello; `say(text)` seals a line; `heard(frame)` opens one from the other side,
   * one at a time in arrival order, and answers what it was: { kind: "hello" | "text" | "duplicate" | "dropped" |
   * "stopped", text?, error? }. A stop (`stopped`: behind-here, behind-there, or a record code) ends the pad here. */
  const session = ({ subtle, pad, role, ledger: book, send }) => {
    const s = { ready: false, stopped: "", recv: 0, send: 0, sent: 0, size: book.size, remaining: book.size, outbox: new Map() };
    const recent = [];
    let queue = Promise.resolve(), serial = 0;
    const stop = (code) => { if (!s.stopped) s.stopped = code; return { kind: "stopped", error: s.stopped }; };
    const guarded = async (fn) => { try { return await fn(); } catch (e) { return stop(e && e.code || "error"); } };
    const transmit = async (type, plain) => {
      const offset = await book.reserve(KEY + plain.length);
      s.send = offset + KEY + plain.length;
      s.remaining = book.size - s.send;
      const frame = await seal(subtle, pad, role, offset, type, plain), n = ++serial;
      // Kept until the room answers ok, for a retry; the oldest unanswered go past OUTBOX.
      s.outbox.set(n, { frame, type, plain });
      if (s.outbox.size > OUTBOX) s.outbox.delete(s.outbox.keys().next().value);
      send(frame, n);
      return n;
    };
    const run = (fn) => (queue = queue.then(fn, fn));
    return Object.assign(s, {
      start: () => run(() => guarded(async () => {
        const r = await book.start();
        s.recv = r.recv; s.send = r.send; s.remaining = book.size - r.send;
        const hello = new Uint8Array(HELLO_BYTES);
        new DataView(hello.buffer).setUint32(0, s.recv);
        await transmit(TYPE.hello, hello);
        return { kind: "started" };
      })),
      // `{ kind: "sent", n }`, or `{ kind: "refused", error: "long" | "empty" }` for a line that cannot go, or stopped.
      say: (text) => run(() => guarded(async () => {
        if (s.stopped) return { kind: "stopped", error: s.stopped };
        const bytes = encoder.encode(text);
        if (!bytes.length) return { kind: "refused", error: "empty" };
        if (bytes.length > TEXT_BYTES) return { kind: "refused", error: "long" };
        return { kind: "sent", n: await transmit(TYPE.text, bytes) };
      })),
      // A send the room refused or never answered, again: `{ kind: "sent", n }` with the number it now goes under, or
      // `{ kind: "gone" }`. While it is the newest frame sealed it goes again unchanged, so a copy that did arrive is a
      // repeat. Once a later frame has been sealed, that one may already have taken the other side past these bytes,
      // which would read as a pad used before; the same text is sealed again on fresh bytes instead. A pad never
      // carries new text on bytes it used, and the same text on two sets of bytes tells the room nothing.
      retry: (n) => run(() => guarded(async () => {
        const entry = s.outbox.get(n);
        if (!entry || s.stopped) return { kind: "gone" };
        if (n === serial) { send(entry.frame, n); return { kind: "sent", n }; }
        s.outbox.delete(n);
        return { kind: "sent", n: await transmit(entry.type, entry.plain) };
      })),
      delivered: (n) => { s.outbox.delete(n); s.sent++; },
      heard: (frame) => run(() => guarded(async () => {
        if (s.stopped) return { kind: "stopped", error: s.stopped };
        const got = await open(subtle, pad, role, frame);
        if (!got.ok) return { kind: "dropped", error: got.error };
        if (got.offset < s.recv) {
          for (const r of recent) if (r.offset === got.offset && r.tag === got.tag) return { kind: "duplicate" };
          // Genuine bytes from a range already read: the other side has used this pad before.
          return stop("behind-there");
        }
        s.recv = await book.received(got.next);
        recent.push({ offset: got.offset, tag: got.tag });
        if (recent.length > RECENT) recent.shift();
        if (got.type === TYPE.hello) {
          if (got.plain.length !== HELLO_BYTES) return { kind: "dropped", error: "malformed" };
          // The other side has read further into this side's half than this device ever sent: its record is behind.
          if (new DataView(got.plain.buffer).getUint32(0) > s.send) return stop("behind-here");
          s.ready = true;
          return { kind: "hello" };
        }
        let text;
        try { text = decoder.decode(got.plain); } catch { return { kind: "dropped", error: "malformed" }; }
        return { kind: "text", text };
      })),
    });
  };

  const PAD = Object.freeze({ MIN, MAX, KEY, TAG, HEAD, TEXT_BYTES, SIZES, STORE });
  BL.oneTimePad = Object.freeze({ PAD, TYPE, make, parse, roleOf, fingerprint, seal, open, ledger, session });
})();
