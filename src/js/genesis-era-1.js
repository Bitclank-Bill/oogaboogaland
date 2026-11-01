// Era 1's cave in the Genesis Voyage, Networks and Keys (1970–1979). Built only through the kit (genesis-exhibits.js);
// facts from docs/genesis-voyage/eras/era-1-networks-and-keys.md (branch gv/research) and nothing else. Notes for
// review: docs/genesis-voyage/exhibits/era-1.md.
//
// Left bank, gold signs: the ideas (all context; none is a Bitcoin whitepaper citation). Cerf and Kahn's gateway
// (May 1974 paper, December 1974 RFC 675) with a packet-routing puzzle; Merkle's puzzles (autumn 1974 proposal, April
// 1978 article) with a puzzle-box toy; Diffie and Hellman's public-key workbench (November 1976) with a toy key
// exchange; RSA's checkable signatures (1977 manuscript, February 1978 journal) with a toy signing desk.
// Right bank, plain signs: period technology (context). IBM's 8-inch floppy (drives sold 1971) as a handling toy; an
// original microcomputer front panel (inspired by the January 1975 Altair) with switches, lights and a 256-byte tray;
// an acoustic-coupler demonstration with original synthesized tones (model and speed are on HOLD in the dossier, so
// none is claimed); and a dated timeline wall.
//
// Contract (docs/genesis-voyage/EXHIBIT-CONTRACT.md on gv/exhibits): the era sign, pylons and overview board are the
// shared signage's; this file gives the overview's summary and guide pages, two section signs past the gateway, and
// `connection: "context"` with a `date` on every prop. Walking and docking: nothing stands between the stream's edge
// and 7 m in on the left bank (x > -7) or 6.75 m in on the right (x < 14), so the waterside walks, the trail strip, both
// boarding ramps and the dock stay clear; nothing in the gateway (first 10 m) or on a lamp's square; nothing above 8 m.
// Every toy keeps its state for the visit, has RESET, and is rebuilt fresh on the next visit; `update` allocates
// nothing; `dispose` closes the coupler's sound.
(() => {
  "use strict";
  const BL = window.BL;
  const DOSSIER = "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/research/docs/genesis-voyage/eras/era-1-networks-and-keys.md";
  // `verified: true`: the gv/research dossier records opening the page itself (31 October 2026). This build could not
  // reach the web to reopen them; see the exhibit notes.
  const sources = {
    e1CerfKahn: { label: "Cerf and Kahn, A Protocol for Packet Network Intercommunication (IEEE Trans. Communications, May 1974)",
      href: "https://sites.cs.ucsb.edu/~ravenben/classes/276/papers/ck74.pdf", kind: "context", verified: true },
    e1Rfc675: { label: "RFC 675, Specification of Internet Transmission Control Program (Cerf, Dalal, Sunshine, December 1974)",
      href: "https://www.rfc-editor.org/rfc/rfc675.html", kind: "context", verified: true },
    e1Merkle: { label: "Merkle, Secure Communications Over Insecure Channels (CACM, April 1978), Satoshi Nakamoto Institute library",
      href: "https://nakamotoinstitute.org/library/secure-communications-insecure-channels/", kind: "context", verified: true },
    e1MerkleHistory: { label: "Ralph Merkle: the 1974 puzzles proposal and its history (the author's own account)",
      href: "https://www.ralphmerkle.com/1974/", kind: "context", verified: true },
    e1DH: { label: "Diffie and Hellman, New Directions in Cryptography (IEEE Trans. Information Theory, November 1976)",
      href: "https://ee.stanford.edu/~hellman/publications/24.pdf", kind: "context", verified: true },
    e1RSA: { label: "Rivest, Shamir and Adleman, A Method for Obtaining Digital Signatures and Public-Key Cryptosystems (author-hosted)",
      href: "https://people.csail.mit.edu/rivest/Rsapaper.pdf", kind: "context", verified: true },
    e1RSASni: { label: "Satoshi Nakamoto Institute library: the RSA paper (CACM, February 1978)",
      href: "https://nakamotoinstitute.org/library/rsa-paper/", kind: "context", verified: true },
    e1FloppyIbm: { label: "IBM History: the floppy disk",
      href: "https://www.ibm.com/history/floppy-disk", kind: "context", verified: true },
    e1FloppyChm: { label: "Computer History Museum, Revolution: the 8-inch floppy disk",
      href: "https://www.computerhistory.org/revolution/story/261", kind: "context", verified: true },
    e1Altair: { label: "Computer History Museum timeline: 1975 (the Altair 8800)",
      href: "https://www.computerhistory.org/timeline/1975/", kind: "context", verified: true },
    e1Dossier: { label: "Genesis Voyage research dossier, Era 1 (acoustic-coupler model and speed: not yet cleared)",
      href: DOSSIER, kind: "context", verified: true }
  };

  const clean = (line) => BL.genesisProps.clean(line).toUpperCase();
  const powMod = (b, e, m) => { let r = 1; b %= m; for (let i = 0; i < e; i++) r = (r * b) % m; return r; };
  const words = (line) => { const s = clean(line), i = s.indexOf(" "); return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 1).trim()]; };
  const unknown = ["Unknown command. Type HELP."];

  // --- The toys' rules: pure, bounded, deterministic ------------------------------------------------------------------
  // Gateway puzzle: a message crosses NET A, then one of two gateways into a network with smaller packets. One link is
  // down each round; fragments arrive numbered, out of order and one short.
  const GW_ROUNDS = [{ text: "KEYS ON THE WIRE", down: 2 }, { text: "TWO NETWORKS MEET", down: 1 }, { text: "PACKETS IN ORDER", down: 2 }];
  const GW_NETS = [null, { gate: "G1", net: "NET B", max: 3 }, { gate: "G2", net: "NET C", max: 4 }];
  const MAX_FRAGS = 6;
  const createGateway = () => ({ round: 0, route: 0, pinged: [false, false, false], frags: [], have: [], order: [], missing: -1, solved: 0, anim: -1, single: false });
  const gatewayTerminal = (s) => {
    const show = (f) => f.replace(/ /g, "_");
    const fresh = () => { s.route = 0; s.frags = []; s.have = []; s.order = []; s.missing = -1; s.pinged = [false, false, false]; };
    return {
      banner: ["GATEWAY PUZZLE · a simplified illustration of the 1974 gateway idea", "Send a message from HOST A to HOST B across two networks.", "Type HELP for the commands.", ""],
      prompt: "HOST A>",
      run: (line) => {
        const [cmd, arg] = words(line), r = GW_ROUNDS[s.round];
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["MAP          the networks and gateways", "PING G1      is the way through gateway G1 working? (or G2)", "ROUTE G1     send through G1 (or G2)", "SEND         send the message", "RESEND <n>   ask again for fragment number n", "ASSEMBLE     put the fragments in order", "RESET        start the puzzle again"] };
        if (cmd === "MAP") return { lines: [`Message to send: "${r.text}" (round ${s.round + 1} of 3)`, "HOST A -- NET A (packets up to 8 letters)", "            +-- gateway G1 -- NET B (up to 3 letters) --+", "            +-- gateway G2 -- NET C (up to 4 letters) --+-- HOST B", "One of the links beyond the gateways is down this round. PING to find out."] };
        if (cmd === "PING") {
          const g = arg === "G1" ? 1 : arg === "G2" ? 2 : 0;
          if (!g) return { lines: ["PING G1 or PING G2."] };
          s.pinged[g] = true;
          return { lines: r.down === g ? [`${arg}: no reply. The link beyond ${arg} is down.`] : [`${arg}: reply from HOST B through ${GW_NETS[g].net}.`] };
        }
        if (cmd === "ROUTE") {
          const g = arg === "G1" ? 1 : arg === "G2" ? 2 : 0;
          if (!g) return { lines: ["ROUTE G1 or ROUTE G2."] };
          s.route = g; s.frags = []; s.have = []; s.order = [];
          return { lines: [`Route set: NET A, gateway ${arg}, ${GW_NETS[g].net}, HOST B. Now SEND.`] };
        }
        if (cmd === "SEND") {
          if (!s.route) return { lines: ["Choose a route first: ROUTE G1 or ROUTE G2."] };
          const net = GW_NETS[s.route];
          if (r.down === s.route) { s.anim = 0; s.single = false; s.missing = -2; return { lines: [`The packets reach ${net.gate}, but the link beyond it is down: nothing arrives.`, "PING the gateways, then choose another ROUTE."] }; }
          s.frags = [];
          for (let i = 0; i < r.text.length; i += net.max) s.frags.push(r.text.slice(i, i + net.max));
          const n = s.frags.length;
          s.missing = (s.round * 2 + 1) % n;
          s.have = s.frags.map((f, i) => i !== s.missing);
          s.order = [];
          for (let i = 1; i < n; i += 2) s.order.push(i);
          for (let i = 0; i < n; i += 2) s.order.push(i);
          s.anim = 0; s.single = false;
          const arrived = s.order.filter((i) => s.have[i]).map((i) => `#${i + 1} ${show(s.frags[i])}`).join("  ");
          return { lines: [`NET A carries it in packets of up to 8 letters. Gateway ${net.gate} splits them to fit ${net.net}`, `(${net.max} letters at most): ${n} fragments, each numbered.`, `Arrived at HOST B, in this order:  ${arrived}`, "One fragment was lost on the way. Which number is missing? Type RESEND and its number."] };
        }
        if (cmd === "RESEND") {
          const n = Number.parseInt(arg, 10) - 1;
          if (!s.frags.length) return { lines: ["Nothing has been sent yet."] };
          if (!(n >= 0 && n < s.frags.length)) return { lines: [`Fragments are numbered 1 to ${s.frags.length}.`] };
          if (s.have[n]) return { lines: [`HOST B already has fragment #${n + 1}.`] };
          s.have[n] = true; s.anim = 0; s.single = true;
          return { lines: [`Fragment #${n + 1} (${show(s.frags[n])}) arrives. Now ASSEMBLE.`] };
        }
        if (cmd === "ASSEMBLE") {
          if (!s.frags.length) return { lines: ["Nothing has arrived yet."] };
          if (s.have.some((h) => !h)) return { lines: ["A fragment is still missing. Look at the numbers that arrived."] };
          const text = s.frags.join("");
          s.solved = Math.min(99, s.solved + 1); s.round = (s.round + 1) % GW_ROUNDS.length; fresh();
          return { lines: [`HOST B puts the fragments in number order: "${text}"`, `Delivered! Puzzles solved this visit: ${s.solved}.`, "Next round: a new message, and a different link may be down. Type MAP."] };
        }
        if (cmd === "RESET") { const solved = s.solved; Object.assign(s, createGateway(), { solved: 0 }); return { lines: [`Puzzle reset (${solved} solved). Type MAP.`] }; }
        return { lines: unknown };
      }
    };
  };

  // Toy key exchange: public numbers p = 23 and g = 5, deliberately tiny so the eavesdropper's search can be shown.
  const DH_P = 23, DH_G = 5, BO_SECRETS = [6, 15, 9, 13];
  const createDh = () => ({ a: 0, A: 0, b: 0, B: 0, round: 0, sent: false, key: 0, anim: -1 });
  const dhTerminal = (s) => ({
    banner: ["PUBLIC-KEY WORKBENCH · a simplified toy model with tiny numbers. NOT secure.", `Public numbers everyone can see: p = ${DH_P}, g = ${DH_G}. You and Bo each keep one secret.`, "Eve (an invented listener) hears everything on the wire. Type HELP.", ""],
    prompt: "YOU>",
    run: (line) => {
      const [cmd, arg] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["PICK <n>   choose your secret number, 1 to 21", "SEND       swap public results with Bo over the wire", "SHARE      each side works out the shared key", "EVE        what the listener heard", "TRY        let Eve search every possible secret", "MIDDLE     what this does not prove", "RESET      start again"] };
      if (cmd === "PICK") {
        const n = Number.parseInt(arg, 10);
        if (!(n >= 1 && n <= 21)) return { lines: ["Pick a whole number from 1 to 21."] };
        s.a = n; s.A = powMod(DH_G, n, DH_P); s.b = BO_SECRETS[s.round % BO_SECRETS.length]; s.B = powMod(DH_G, s.b, DH_P); s.sent = false; s.key = 0;
        return { lines: [`Your secret: ${n} (keep it). Your public result: ${DH_G}^${n} mod ${DH_P} = ${s.A}.`, "Bo has picked a secret too. Now SEND."] };
      }
      if (cmd === "SEND") {
        if (!s.a) return { lines: ["PICK a secret first."] };
        s.sent = true; s.anim = 0;
        return { lines: [`On the wire: you send ${s.A}, Bo sends ${s.B}. Eve hears both numbers.`, "Neither secret ever crossed the wire. Now SHARE."] };
      }
      if (cmd === "SHARE") {
        if (!s.sent) return { lines: ["SEND first."] };
        const mine = powMod(s.B, s.a, DH_P), bos = powMod(s.A, s.b, DH_P);
        s.key = mine;
        return { lines: [`You:  Bo's ${s.B} ^ your secret ${s.a} mod ${DH_P} = ${mine}`, `Bo:   your ${s.A} ^ Bo's secret mod ${DH_P} = ${bos}`, mine === bos ? `Same key, ${mine}, worked out on both sides. The lamps match.` : "Keys differ (this should not happen)."] };
      }
      if (cmd === "EVE") return { lines: s.sent ? [`Eve heard p = ${DH_P}, g = ${DH_G}, ${s.A} and ${s.B}. She did not hear either secret.`] : ["Nothing on the wire yet."] };
      if (cmd === "TRY") {
        if (!s.sent) return { lines: ["SEND first, so Eve has something to work on."] };
        let x = 1;
        while (x < DH_P && powMod(DH_G, x, DH_P) !== s.A) x++;
        return { lines: [`Eve tries secrets 1, 2, 3 ... and after ${x} tries finds one that gives ${s.A}: ${x}.`, `With it she computes the key: ${powMod(s.B, x, DH_P)}. Tiny numbers are easy to search.`, "Real systems use numbers so large that this search is far out of reach. This table is a teaching toy."] };
      }
      if (cmd === "MIDDLE") return { lines: ["Key agreement does not show WHO is on the other end.", "If Eve could change messages, not just listen, she could swap in her own number on each side.", "Checking who you talk to needs something more, such as signatures (see the RSA desk)."] };
      if (cmd === "RESET") { const round = s.round + 1; Object.assign(s, createDh(), { round }); return { lines: ["Reset. Bo has a new secret. PICK yours."] }; }
      return { lines: unknown };
    }
  });

  // Toy signatures: n = 33 (3 x 11), public e = 3, private d = 7, the textbook-sized example. NOT secure.
  const RSA_N = 33, RSA_E = 3, RSA_D = 7;
  const createRsa = () => ({ signs: 0, stamp: 0, verdict: 0 });
  const msgOf = (arg) => {
    if (/^[A-Z]$/.test(arg)) return arg.charCodeAt(0) - 64;
    const n = Number.parseInt(arg, 10);
    return n >= 2 && n <= 32 ? n : 0;
  };
  const rsaTerminal = (s) => ({
    banner: ["CHECKABLE SIGNATURE DESK · a simplified toy model with tiny numbers. NOT secure.", `Public check numbers: n = ${RSA_N}, e = ${RSA_E}. The signing number stays secret in the desk.`, "Messages are a number 2 to 32, or a letter (A = 1 ... Z = 26). Type HELP.", ""],
    prompt: "DESK>",
    run: (line) => {
      const [cmd, rest] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["SIGN <m>          sign a message", "VERIFY <s> <m>    anyone can check signature s on message m", "DOUBLE            sign two conflicting payments", "RESET             clear the desk"] };
      if (cmd === "SIGN") {
        const m = msgOf(rest);
        if (!m) return { lines: ["SIGN a number 2 to 32, or a letter."] };
        s.signs = Math.min(999, s.signs + 1); s.stamp = 1; s.verdict = 0;
        return { lines: [`Message ${m}: signature ${powMod(m, RSA_D, RSA_N)} (made with the secret number).`, `Check it: VERIFY ${powMod(m, RSA_D, RSA_N)} ${m}. Then try VERIFY with a changed message.`] };
      }
      if (cmd === "VERIFY") {
        const parts = rest.split(/\s+/), sig = Number.parseInt(parts[0], 10), m = msgOf(parts[1] || "");
        if (!(sig >= 0 && sig < RSA_N) || !m) return { lines: ["VERIFY <signature 0-32> <message>."] };
        const ok = powMod(sig, RSA_E, RSA_N) === m;
        s.verdict = ok ? 1 : 2;
        return { lines: [`${sig} ^ ${RSA_E} mod ${RSA_N} = ${powMod(sig, RSA_E, RSA_N)}, the message was ${m}:`, ok ? "VALID. Only the holder of the secret number could have made it." : "FAILS. The message or the signature was changed."] };
      }
      if (cmd === "DOUBLE") {
        const a = 12, b = 21;
        s.verdict = 1; s.stamp = 1;
        return { lines: [`"Pay Bo" = ${a}: signature ${powMod(a, RSA_D, RSA_N)}. VALID.`, `"Pay Cy" = ${b}, the same coin: signature ${powMod(b, RSA_D, RSA_N)}. Also VALID.`, "Both checks pass. A signature shows who signed, not that they signed only once.", "Stopping that double spend without a central referee was still unsolved in this decade."] };
      }
      if (cmd === "RESET") { Object.assign(s, createRsa()); return { lines: ["Desk cleared."] }; }
      return { lines: unknown };
    }
  });

  // Front panel: eight data switches, a 256-byte memory and an address. RUN is a museum shortcut that reads the bytes
  // from address 0 as letters; a real machine ran them as instructions. Not an emulator.
  const LETTERS = { O: 0x4f, G: 0x47, A: 0x41 };
  const createPanel = () => ({ sw: 0, addr: 0, mem: new Uint8Array(256), dirty: true, won: false });
  const bin = (v) => (v | 256).toString(2).slice(1);
  const panelTerminal = (s) => ({
    banner: ["FRONT PANEL · an original panel inspired by early microcomputers. Not an emulator.", "Set eight switches, then DEPOSIT the byte at the address. Challenge: spell OOGA at addresses 0 to 3.", "Type HELP.", ""],
    prompt: "PANEL>",
    run: (line) => {
      const [cmd, arg] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["FLIP <n>        flip switch n (7 is leftmost, 0 rightmost)", "SET 01001111    set all eight switches at once", "DEPOSIT         store the switches at the address, then step on", "EXAMINE <n>     go to address n (0-255) and show its byte", "CODES           the switch patterns for O, G and A", "RUN             read memory from address 0 as letters (museum shortcut)", "RESET           clear memory and switches"] };
      if (cmd === "FLIP") {
        const n = Number.parseInt(arg, 10);
        if (!(n >= 0 && n <= 7)) return { lines: ["FLIP 0 to 7."] };
        s.sw ^= 1 << n; s.dirty = true;
        return { lines: [`Switches: ${bin(s.sw)}  (address ${s.addr})`] };
      }
      if (cmd === "SET") {
        if (!/^[01]{8}$/.test(arg)) return { lines: ["SET needs eight 0s and 1s, e.g. SET 01001111."] };
        s.sw = Number.parseInt(arg, 2); s.dirty = true;
        return { lines: [`Switches: ${bin(s.sw)}  (address ${s.addr})`] };
      }
      if (cmd === "DEPOSIT") {
        s.mem[s.addr] = s.sw; const at = s.addr; s.addr = (s.addr + 1) & 255; s.dirty = true;
        return { lines: [`Stored ${bin(s.sw)} at address ${at}. Address is now ${s.addr}.`] };
      }
      if (cmd === "EXAMINE") {
        const n = Number.parseInt(arg, 10);
        if (!(n >= 0 && n <= 255)) return { lines: ["EXAMINE 0 to 255."] };
        s.addr = n; s.dirty = true;
        return { lines: [`Address ${n}: ${bin(s.mem[n])}`] };
      }
      if (cmd === "CODES") return { lines: Object.keys(LETTERS).map((k) => `${k} = ${bin(LETTERS[k])}`).concat(["(Letter codes as later text standards write them; a teaching aid.)"]) };
      if (cmd === "RUN") {
        let text = "";
        for (let i = 0; i < 32 && s.mem[i]; i++) text += s.mem[i] >= 32 && s.mem[i] < 127 ? String.fromCharCode(s.mem[i]) : ".";
        const won = text.startsWith("OOGA");
        if (won && !s.won) { s.won = true; s.dirty = true; }
        return { lines: [text ? `Memory reads: ${text}` : "Memory from address 0 is empty.", won ? "You toggled in OOGA one byte at a time, as early owners entered programs." : "Museum shortcut: a real machine would run these bytes as instructions."] };
      }
      if (cmd === "RESET") { Object.assign(s, createPanel()); return { lines: ["Memory and switches cleared."] }; }
      return { lines: unknown };
    }
  });

  // Acoustic coupler: text becomes bits and each bit an original synthesized tone (two invented pitches, slowed down
  // to hear each bit). One oscillator and one gain, built on the first send from a gesture and reused.
  const BIT = 0.07, LO = 620, HI = 940, MAX_CHARS = 16, MAX_BITS = MAX_CHARS * 8;
  const createCoupler = () => ({ bits: new Uint8Array(MAX_BITS), count: 0, t: 0, playing: false, sends: 0 });
  let audio = null;
  const closeAudio = () => { if (audio) { try { audio.osc.stop(); } catch {} audio.context.close().catch(() => {}); } audio = null; };
  const sound = () => {
    const active = typeof navigator === "undefined" || !navigator.userActivation || navigator.userActivation.isActive;
    if (audio || !active || typeof AudioContext === "undefined" || !BL.sound) return audio;
    const context = new AudioContext(), osc = context.createOscillator(), gain = context.createGain();
    osc.type = "triangle"; gain.gain.value = 0; osc.connect(gain); gain.connect(BL.sound.output(context)); osc.start();
    audio = { context, osc, gain };
    return audio;
  };
  const play = (s, withTone) => {
    s.t = 0; s.playing = s.count > 0;
    const a = withTone ? sound() : null;
    if (!a || BL.sound.muted) return a ? "(sound is muted: watch the lamps)" : "(no sound here: watch the lamps)";
    if (a.context.state === "suspended") a.context.resume().catch(() => {});
    const t0 = a.context.currentTime + 0.05, f = a.osc.frequency, g = a.gain.gain, end = t0 + s.count * BIT;
    f.cancelScheduledValues(0); g.cancelScheduledValues(0);
    g.setValueAtTime(0, t0); g.linearRampToValueAtTime(0.05, t0 + 0.02);
    for (let i = 0; i < s.count; i++) f.setValueAtTime(s.bits[i] ? HI : LO, t0 + i * BIT);
    g.setValueAtTime(0.05, end); g.linearRampToValueAtTime(0, end + 0.03);
    return "";
  };
  const couplerTerminal = (s) => {
    const load = (text) => {
      const t = text.slice(0, MAX_CHARS);
      s.count = 0;
      for (let c = 0; c < t.length; c++) { const code = t.charCodeAt(c) & 255; for (let b = 7; b >= 0; b--) s.bits[s.count++] = (code >> b) & 1; }
      return t;
    };
    return {
      banner: ["ACOUSTIC COUPLER DEMO · the idea: a phone handset rests in two cups, and data travels as sound.", "The pitches and speed here are invented for listening; no real model's speed or tones are claimed.", "Type HELP.", ""],
      prompt: "COUPLER>",
      run: (line) => {
        const [cmd, arg] = words(line);
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["SEND <text>   up to 16 letters, played as tones (a low pitch for 0, a high pitch for 1)", "BITS <text>   show the bits without sound", "HELLO         a short original greeting tone", "STOP          silence", "RESET         clear the demo"] };
        if (cmd === "SEND" || cmd === "BITS") {
          if (!arg) return { lines: [`${cmd} needs some text.`] };
          const t = load(arg), lines = [];
          for (let c = 0; c < t.length; c++) lines.push(`${t[c] === " " ? "_" : t[c]}  ${bin(t.charCodeAt(c) & 255)}`);
          s.sends = Math.min(999, s.sends + 1);
          const note = play(s, cmd === "SEND");
          return { lines: lines.concat([cmd === "SEND" ? `${s.count} bits, slowed right down so each one can be heard. ${note}` : `${s.count} bits.`, "Real links also add framing bits around each character; left out here."]) };
        }
        if (cmd === "HELLO") {
          s.count = 0;
          for (let i = 0; i < 12; i++) s.bits[s.count++] = i < 6 ? 1 : i & 1;
          const note = play(s, true);
          return { lines: [`An original greeting: a steady high tone, then a warble. ${note}`] };
        }
        if (cmd === "STOP") { s.playing = false; if (audio) { audio.gain.gain.cancelScheduledValues(0); audio.gain.gain.setValueAtTime(0, audio.context.currentTime); } return { lines: ["Quiet."] }; }
        if (cmd === "RESET") { if (audio) { audio.gain.gain.cancelScheduledValues(0); audio.gain.gain.setValueAtTime(0, audio.context.currentTime); } Object.assign(s, createCoupler()); return { lines: ["Demo cleared."] }; }
        return { lines: unknown };
      }
    };
  };

  // The floppy: each use is one step of handling it. Captions only; the model moves in `update`.
  const FLOPPY_STEPS = [
    "Step 1 of 4: slide the disk out of its paper sleeve. Hold it by its square jacket.",
    "Step 2 of 4: slide it into the drive's slot, label edge last.",
    "Step 3 of 4: close the door. The disk spins and the drive reads the loader's instructions (an original animation).",
    "Step 4 of 4: eject it and put it back in its sleeve. IBM's first 8-inch disks were read-only loaders; writable floppies for personal computers came later. Use again to start over."
  ];

  // --- Panels (pages: { caption, title, text }) ---------------------------------------------------------------------
  const CONTEXT_NOTE = "Context exhibit: not a Bitcoin whitepaper citation.";
  const PANELS = {
    gateway: { room: "Networks meet at a gateway - 1974", sources: ["e1CerfKahn", "e1Rfc675"], pages: [
      { caption: "In short", title: "Different networks, one message", text: [
        "May 1974: Vinton Cerf and Robert Kahn publish a design for communication between \"different packet switching networks\".",
        "December 1974: RFC 675, by Cerf, Yogen Dalal and Carl Sunshine, specifies an Internet Transmission Control Program."] },
      { caption: "The puzzle", title: "Sizes, losses and order", text: [
        "The puzzle beside this board is a simplified illustration: networks can carry different packet sizes, packets can be lost, and they can arrive out of order.",
        "Numbering the pieces lets the far end ask again for what is missing and put the rest back in order."] },
      { caption: "Not yet", title: "Not the modern Internet", text: [
        "These are a 1974 paper and a 1974 specification. They are not the later switch-over of networks to the finished TCP/IP protocols, which is a separate milestone outside this cave.",
        "Reliable delivery also does not decide which of two competing digital payments is valid.", CONTEXT_NOTE] }
    ] },
    merkle: { room: "Merkle puzzles - proposed 1974 - published 1978", sources: ["e1MerkleHistory", "e1Merkle", "whitepaper"], pages: [
      { caption: "In short", title: "A secret over an open line", text: [
        "Ralph Merkle's own history dates his puzzle proposal to autumn 1974. The journal article appeared in April 1978.",
        "It showed how two people could \"select a key over open communications channels\", while a listener had much more work to do than they did."] },
      { caption: "The toy", title: "Puzzle Post", text: [
        "In the puzzle-box toy you open one small box of your choice. A listener does not know which one, so must search many.",
        "It is a toy model of the work gap, not a secure method."] },
      { caption: "Not this one", title: "A different Merkle paper", text: [
        "The Bitcoin whitepaper cites a different Merkle paper, from 1980, about hash trees. That one waits in a later cave.",
        "A work gap is not mining, and not a payment system.", CONTEXT_NOTE] }
    ] },
    dh: { room: "Public-key workbench - November 1976", sources: ["e1DH"], pages: [
      { caption: "In short", title: "New Directions in Cryptography", text: [
        "November 1976: Whitfield Diffie and Martin Hellman's paper is published. It records that the manuscript was received on 3 June 1976, and that parts were presented in 1975 and June 1976.",
        "It explored public-key systems, signatures, and ways to \"minimize the need for secure key distribution channels\"."] },
      { caption: "The table", title: "A simplified model", text: [
        "At the table you and Bo each keep a secret number, swap only public results, and still arrive at the same key. Eve hears the wire but not the secrets.",
        "The numbers are tiny so you can watch Eve search them all. It is a teaching toy, not secure cryptography."] },
      { caption: "Still unsolved", title: "Who is on the other end?", text: [
        "Key agreement by itself does not prove who the other person is, and it does nothing to stop a digital coin being spent twice.",
        "Bitcoin uses digital signatures, but that does not mean it uses this key exchange.", CONTEXT_NOTE] }
    ] },
    rsa: { room: "Checkable signatures - 1977 manuscript - 1978 journal", sources: ["e1RSA", "e1RSASni", "whitepaper"], pages: [
      { caption: "In short", title: "Anyone can check", text: [
        "Rivest, Shamir and Adleman's paper records the manuscript received on 4 April 1977 and revised on 1 September 1977. The journal published it in February 1978.",
        "It gave a concrete method for public-key encryption and digital signatures: \"Anyone can verify this signature\"."] },
      { caption: "The connection", title: "A documented link, between researchers", text: [
        "The paper credits Diffie and Hellman's work as motivating it. That documents a link between these researchers, not Bitcoin's choice of algorithm: Bitcoin's use of digital signatures does not mean it uses RSA."] },
      { caption: "Still unsolved", title: "Two valid signatures", text: [
        "A valid signature cannot stop its owner signing two conflicting payments. Try DOUBLE at the desk.",
        "The Bitcoin whitepaper of 2008 proposed a solution to that double-spending problem; nothing in this cave does.", CONTEXT_NOTE] }
    ] },
    floppy: { room: "8-inch floppy - IBM drives sold 1971", sources: ["e1FloppyIbm", "e1FloppyChm"], pages: [
      { caption: "In short", title: "A disk that loads a machine", text: [
        "1971: IBM begins selling floppy disk drives. The disk was 8 inches across.",
        "The Computer History Museum describes the original as a read-only disk holding about 80 KB, used to load a machine's microcode."] },
      { caption: "The toy", title: "Handle it", text: [
        "Use the drive four times: take the disk out of its sleeve, insert it, close the door to load, and eject.",
        "The model is enlarged and unbranded. The loading screen is an original animation, not real microcode."] },
      { caption: "Later", title: "Read-only first", text: [
        "Writable floppies for personal computers, and the smaller disks that followed, came later. They are not this disk.",
        "Context exhibit: period technology, not a step toward Bitcoin."] }
    ] },
    panel: { room: "Front panel - January 1975", sources: ["e1Altair"], pages: [
      { caption: "In short", title: "Switches and lights", text: [
        "January 1975: the Altair 8800 is introduced on a magazine cover. The Computer History Museum records a basic 256 bytes of memory, expandable to 64 KB.",
        "Owners entered programs a byte at a time on front-panel switches and read the result in lights."] },
      { caption: "The toy", title: "An original panel", text: [
        "This panel is an original design inspired by those machines, not a copy of one. It has eight switches, a 256-byte memory and a tray with one light per byte.",
        "It is not an emulator and runs no copied firmware. RUN simply reads the bytes as letters."] },
      { caption: "Context", title: "More people at the controls", text: [
        "Small computers let more people experiment for themselves.",
        "Context exhibit: period technology, not a step toward Bitcoin."] }
    ] },
    coupler: { room: "Acoustic coupler - 1970s demonstration", sources: ["e1Dossier"], pages: [
      { caption: "In short", title: "Data as sound", text: [
        "An acoustic coupler let a terminal use an ordinary telephone: the handset sat in two cups, one speaking tones into it, one listening.",
        "Here each 0 and 1 becomes one of two original synthesized pitches, slowed down so you can hear every bit."] },
      { caption: "Not yet verified", title: "No model, no speed", text: [
        "The voyage's research has not yet cleared a specific coupler model, its date or its speed, so none is claimed here.",
        "The cups, box and handset are a generic, unbranded model. The pitches are invented and match no real standard."] },
      { caption: "Context", title: "Period technology", text: [
        "Context exhibit: period technology, not a step toward Bitcoin."] }
    ] },
    timeline: { room: "Timeline - 1970 to 1979", sources: ["e1FloppyIbm", "e1CerfKahn", "e1MerkleHistory", "e1Rfc675", "e1Altair", "e1DH", "e1RSA", "e1RSASni", "e1Merkle"], pages: [
      { caption: "1971-1974", title: "Dates and what they mark", text: [
        "1971: IBM begins selling floppy drives.",
        "May 1974: Cerf and Kahn's paper is published.",
        "Autumn 1974: Merkle's puzzle proposal, by his own account.",
        "December 1974: RFC 675 specifies an Internet Transmission Control Program."] },
      { caption: "1975-1978", title: "Dates and what they mark", text: [
        "January 1975: the Altair 8800 is introduced on a magazine cover.",
        "November 1976: Diffie and Hellman's paper is published (received June 1976).",
        "April 1977: the RSA manuscript is received; February 1978: the journal publishes it.",
        "April 1978: Merkle's puzzles article is published."] },
      { caption: "Reading it", title: "All context", text: [
        "Gold plaques are ideas; plain plaques are period technology. Every one is context for the voyage, not a Bitcoin whitepaper citation."] }
    ] }
  };
  const board = (key) => () => ({ board: PANELS[key] });
  // For the shared overview board and panel (summary at most 280 characters, at most 3 pages).
  const overview = {
    summary: "Computers learned to talk across different networks, but a public wire could have listeners. Researchers explored agreeing on a secret and signatures anyone can check. Small computers let more people experiment. Context for Bitcoin, not citations.",
    sourceKeys: ["e1CerfKahn", "e1Rfc675", "e1MerkleHistory", "e1DH", "e1RSA", "e1FloppyIbm", "e1Altair", "e1Dossier", "whitepaper"],
    pages: [
      { caption: "Left bank", title: "Ideas (gold signs)", text: [
        "A gateway between packet networks (May and December 1974), with a packet puzzle. Merkle's puzzles (proposed autumn 1974, published April 1978). Diffie and Hellman's public keys (November 1976), with a key-exchange table. RSA's checkable signatures (manuscript 1977, journal February 1978), with a signing desk.",
        "These help explain Bitcoin's setting, but none of them is cited by the Bitcoin whitepaper. All are context."] },
      { caption: "Right bank", title: "Period technology (plain signs)", text: [
        "IBM's 8-inch floppy (drives sold from 1971), a front panel inspired by the January 1975 Altair, an acoustic-coupler demonstration with original tones, and a dated timeline wall.",
        "These are context too: the gear of the decade, not steps toward Bitcoin."] },
      { caption: "How to play", title: "Toys are teaching models", text: [
        "Walk up to a console and press Space (or USE). Every toy has HELP and RESET.",
        "The key, signature and puzzle toys use tiny numbers on purpose: they show the idea, not real security. The panel is not an emulator, and the coupler's model and speed are not yet verified."] }
    ]
  };

  // --- Live scene state (rebuilt each visit) ------------------------------------------------------------------------
  let S = null;
  const LAMP_COLORS = ["#ff5a4e", "#ffb23f", "#f2e14e", "#58e07a", "#4fb6ff", "#c47bff"];

  window.BL.genesisExhibits.register(1, {
    sources,
    overview,
    build(kit) {
      const { era, top, M, createNode, addChild, place, solid, sign, obstacle, prop, label } = kit;
      const Z1 = era.z1;
      closeAudio();
      S = { gw: createGateway(), dh: createDh(), rsa: createRsa(), panel: createPanel(), coupler: createCoupler(), floppy: { step: 0, spin: 0 }, post: { opened: -1 }, n: {} };
      S.gwTerm = gatewayTerminal(S.gw); S.dhTerm = dhTerminal(S.dh); S.rsaTerm = rsaTerminal(S.rsa);
      S.panelTerm = panelTerminal(S.panel); S.couplerTerm = couplerTerminal(S.coupler);
      const N = S.n;
      // A solid that a walking Ooga cannot enter when it stands on the ground.
      const block = (w, h, d, color, x, y, z, em = 0) => {
        const node = solid(w, h, d, color, x, y, z, em);
        if (y - h / 2 < top + 1.6) obstacle(x - w / 2 - 0.05, x + w / 2 + 0.05, z - d / 2 - 0.05, z + d / 2 + 0.05);
        return node;
      };
      const at = (geo, x, y, z, visible = true) => place(createNode({ geometry: geo, position: { x, y, z }, visible }));
      const goldSign = (title, sub, x, y, z, height = 0.6) => {
        const l = label(title, sub, { height, style: "gold" }), node = place(createNode({ position: { x, y, z } }));
        addChild(node, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
        return node;
      };
      const posts = (x, z, h, half) => { block(0.12, h, 0.12, "#2a2622", x - half, top + h / 2, z); block(0.12, h, 0.12, "#2a2622", x + half, top + h / 2, z); };
      // A console the visitor walks up to: a lectern behind the prop's spot.
      const lectern = (x, z, color = "#4a3a2a") => { block(0.9, 1.0, 0.5, color, x, top + 0.5, z - 0.9); solid(0.8, 0.5, 0.06, "#38ff7a", x, top + 1.15, z - 0.75, 0.9); };
      const PICK = { w: 1.4, h: 1.8, d: 2.4 };
      // A usable exhibit at (x, z); `on` is the model a tap should select ({ w, h, d, x, z }), else its lectern.
      const station = (def) => prop({ reach: 1.7, connection: "context", ...def, pick: def.on || { ...PICK, x: def.x, z: def.z - 0.6 }, at: { x: def.x, y: top, z: def.z } });
      const lit = (color) => M.box({ w: 0.08, h: 0.08, d: 0.04, color, emissive: 1.4 });

      // --- Section signs just past the gateway (the era sign and overview board are the shared signage's) ------------
      posts(-18, Z1 - 11.5, 4.4, 4);
      goldSign("IDEAS · 1970–1979", "gold signs · all context here, none cited by the Bitcoin whitepaper", -18, top + 5.0, Z1 - 11.5, 1.5);
      posts(26, Z1 - 11.5, 4.4, 4);
      sign("PERIOD TECHNOLOGY · 1970–1979", "plain signs · other technology of the decade · context", 26, top + 5.0, Z1 - 11.5, 0, 1.5);

      // --- Gateway and the packet puzzle (left bank) ---------------------------------------------------------------
      {
        const zc = Z1 - 24, ax = -27, bx = -10, gx = -18.5;
        solid(20, 0.04, 9, "#5b4630", -18.5, top + 0.02, zc);
        for (const [x, name] of [[ax, "HOST A · NET A"], [bx, "HOST B"]]) {
          block(1.6, 0.9, 1.1, "#cfc6aa", x, top + 0.45, zc);
          block(1.3, 0.8, 0.9, "#d8cfb4", x, top + 1.3, zc);
          solid(1.0, 0.55, 0.04, "#38ff7a", x, top + 1.32, zc + 0.46, 1.0);
          sign(name, "an illustration, not historical machines", x, top + 2.4, zc + 0.5, 0, 0.35);
        }
        N.gwLamps = [];
        for (const [g, dz] of [[1, 2.6], [2, -2.6]]) {
          const z = zc + dz;
          block(0.3, 2.6, 0.3, "#3d4a5c", gx - 1, top + 1.3, z); block(0.3, 2.6, 0.3, "#3d4a5c", gx + 1, top + 1.3, z);
          solid(2.4, 0.3, 0.4, "#3d4a5c", gx, top + 2.75, z);
          sign(`GATEWAY G${g}`, g === 1 ? "to NET B · 3 letters a packet" : "to NET C · 4 letters a packet", gx, top + 3.4, z + 0.25, 0, 0.3);
          // Lamp: dark until pinged, then green or red.
          const lamp = { off: at(M.box({ w: 0.3, h: 0.3, d: 0.3, color: "#333333" }), gx, top + 3.05, z), up: at(M.box({ w: 0.3, h: 0.3, d: 0.3, color: "#4cff7a", emissive: 1.4 }), gx, top + 3.05, z, false), down: at(M.box({ w: 0.3, h: 0.3, d: 0.3, color: "#ff4c4c", emissive: 1.4 }), gx, top + 3.05, z, false) };
          N.gwLamps[g] = lamp;
          solid(gx - 1 - ax, 0.06, 0.12, "#222222", (ax + gx - 1) / 2, top + 0.06, z);
          solid(bx - gx - 1, 0.06, 0.12, "#222222", (bx + gx + 1) / 2, top + 0.06, z);
        }
        solid(0.12, 0.06, 5.2, "#222222", ax + 0.9, top + 0.06, zc); solid(0.12, 0.06, 5.2, "#222222", bx - 0.9, top + 0.06, zc);
        N.hostLamp = at(M.box({ w: 0.25, h: 0.25, d: 0.25, color: "#f2c14e", emissive: 1.6 }), bx, top + 1.95, zc, false);
        const cube = M.box({ w: 0.32, h: 0.32, d: 0.32, color: "#4fb6ff", emissive: 0.6 });
        N.packets = [];
        for (let i = 0; i < MAX_FRAGS; i++) N.packets.push(at(cube, ax, top + 0.5, zc, false));
        N.gw = { ax: ax + 0.9, bx: bx - 0.9, gx, zc, y: top + 0.35 };
        goldSign("NETWORKS MEET · MAY AND DEC 1974", "context · not a Bitcoin whitepaper citation", gx, top + 4.4, zc + 0.3, 0.7);
        lectern(-11.5, zc + 5.2);
        station({ id: "e1-gateway-puzzle", year: 1974, date: "an illustration of the May 1974 paper and the December 1974 RFC 675", title: "Gateway puzzle", label: "GATEWAY PUZZLE · 1974", sourceKeys: ["e1CerfKahn", "e1Rfc675"], x: -11.5, z: zc + 6.1, on: { w: 18, h: 3.4, d: 7, x: gx, z: zc },
          onUse: () => ({ terminal: S.gwTerm }) });
        lectern(-23.5, zc + 5.2, "#6b4a22");
        station({ id: "e1-gateway", year: 1974, date: "May 1974 journal paper; December 1974 RFC 675 specification", title: "Networks meet at a gateway", label: "GATEWAY · MAY AND DEC 1974", sourceKeys: PANELS.gateway.sources, x: -23.5, z: zc + 6.1, onUse: board("gateway") });
      }

      // --- Merkle's puzzles (left bank) ----------------------------------------------------------------------------
      {
        const zc = Z1 - 35, x = -18;
        block(5.2, 3.4, 0.5, "#4a3a28", x, top + 1.7, zc);
        const shut = M.box({ w: 0.5, h: 0.32, d: 0.12, color: "#8a6a44" });
        N.postBoxes = [];
        for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) N.postBoxes.push(at(shut, x - 2.1 + c * 0.6, top + 0.45 + r * 0.5, zc + 0.3));
        N.postOpen = at(M.box({ w: 0.5, h: 0.32, d: 0.12, color: "#f2c14e", emissive: 1.2 }), x, top + 1, zc + 0.36, false);
        goldSign("MERKLE'S PUZZLES · 1974 PROPOSAL · 1978 ARTICLE", "context · not the 1980 Merkle paper Bitcoin cites", x, top + 4.1, zc + 0.3, 0.6);
        lectern(-22, zc + 2.2);
        station({ id: "e1-puzzle-post", year: 1974, date: "a toy model of the puzzles Merkle proposed in autumn 1974", on: { w: 5.2, h: 3.4, d: 1, x, z: zc }, title: "Puzzle Post toy", label: "PUZZLE POST · 1974", sourceKeys: ["e1MerkleHistory", "e1Merkle"], x: -22, z: zc + 3.1,
          onUse: () => {
            const p = S.post, i = (p.opened + 17) % 48;
            p.opened = i;
            const b = N.postBoxes[i].position;
            N.postOpen.position.x = b.x; N.postOpen.position.y = b.y; N.postOpen.visible = true;
            return { caption: `You picked box ${i + 1} of 48 and solved its small puzzle quickly. A listener does not know which box you chose and would have to search many. A toy model of the work gap, not a secure method.` };
          } });
        lectern(-14, zc + 2.2, "#6b4a22");
        station({ id: "e1-merkle", year: 1974, date: "autumn 1974 proposal (the author's account); April 1978 journal article", title: "Merkle puzzles", label: "MERKLE PUZZLES · 1974 / 1978", sourceKeys: PANELS.merkle.sources, x: -14, z: zc + 3.1, onUse: board("merkle") });
      }

      // --- Public-key workbench (left bank) ------------------------------------------------------------------------
      {
        const zc = Z1 - 48, x = -18;
        block(4.4, 0.8, 1.4, "#7a5a38", x, top + 0.4, zc);
        sign("YOU", "keep your secret", x - 1.9, top + 1.5, zc + 0.75, 0, 0.3);
        sign("BO", "keeps a secret too", x + 1.9, top + 1.5, zc + 0.75, 0, 0.3);
        block(0.12, 2.9, 0.12, "#2a2622", x - 2.4, top + 1.45, zc); block(0.12, 2.9, 0.12, "#2a2622", x + 2.4, top + 1.45, zc);
        solid(4.8, 0.04, 0.04, "#1a1a1a", x, top + 2.8, zc);
        block(0.7, 1.5, 0.7, "#556070", x, top + 0.75, zc - 1.7);
        solid(0.5, 0.5, 0.5, "#6a778a", x, top + 1.75, zc - 1.7);
        solid(0.1, 0.25, 0.2, "#c9a27a", x + 0.3, top + 1.8, zc - 1.7);
        sign("EVE", "an invented listener: hears the wire", x, top + 2.4, zc - 1.3, 0, 0.3);
        N.dhTokens = [at(M.box({ w: 0.22, h: 0.22, d: 0.22, color: "#4fb6ff", emissive: 1.2 }), x - 2.2, top + 2.62, zc, false),
          at(M.box({ w: 0.22, h: 0.22, d: 0.22, color: "#ff9e4f", emissive: 1.2 }), x + 2.2, top + 2.62, zc, false)];
        N.dh = { x0: x - 2.2, x1: x + 2.2 };
        // A lamp at each end per colour; SHARE lights the matching pair.
        N.dhLamps = [];
        for (let i = 0; i < LAMP_COLORS.length; i++) {
          const geo = M.box({ w: 0.3, h: 0.3, d: 0.3, color: LAMP_COLORS[i], emissive: 1.5 });
          N.dhLamps.push([at(geo, x - 1.7, top + 0.98, zc, false), at(geo, x + 1.7, top + 0.98, zc, false)]);
        }
        goldSign("PUBLIC-KEY WORKBENCH · NOV 1976", "teaching table · a simplified toy model, not secure · context", x, top + 3.7, zc + 0.3, 0.6);
        lectern(x, zc + 2.4);
        station({ id: "e1-dh-table", year: 1976, date: "a simplified toy model of the idea in the November 1976 paper", on: { w: 5, h: 3, d: 3.6, x, z: zc - 0.4 }, title: "Public-key workbench", label: "KEY EXCHANGE TABLE · 1976", sourceKeys: ["e1DH"], x, z: zc + 3.3, onUse: () => ({ terminal: S.dhTerm }) });
        lectern(-23.5, zc + 2.4, "#6b4a22");
        station({ id: "e1-dh", year: 1976, date: "November 1976 journal issue; manuscript received 3 June 1976", title: "New Directions in Cryptography", label: "DIFFIE AND HELLMAN · NOV 1976", sourceKeys: PANELS.dh.sources, x: -23.5, z: zc + 3.3, onUse: board("dh") });
      }

      // --- Checkable signatures (left bank) ------------------------------------------------------------------------
      {
        const zc = Z1 - 61, x = -18;
        block(2.6, 0.85, 1.2, "#5e4630", x, top + 0.425, zc);
        solid(0.9, 0.04, 0.6, "#efe6cf", x - 0.5, top + 0.87, zc);
        N.stamp = at(M.box({ w: 0.3, h: 0.35, d: 0.3, color: "#7a2f2a" }), x + 0.6, top + 1.2, zc);
        N.stampY = top + 1.2;
        N.verdict = [at(M.box({ w: 0.26, h: 0.26, d: 0.26, color: "#4cff7a", emissive: 1.4 }), x - 1.0, top + 1.05, zc - 0.4, false),
          at(M.box({ w: 0.26, h: 0.26, d: 0.26, color: "#ff4c4c", emissive: 1.4 }), x - 1.0, top + 1.05, zc - 0.4, false)];
        goldSign("CHECKABLE SIGNATURES · 1977 MANUSCRIPT · FEB 1978 JOURNAL", "toy numbers · context · a Bitcoin signature does not mean RSA", x, top + 2.6, zc + 0.3, 0.55);
        lectern(x, zc + 2.2);
        station({ id: "e1-rsa-desk", year: 1977, date: "a toy model of the method in the paper received 4 April 1977", on: { w: 2.8, h: 1.8, d: 1.4, x, z: zc }, title: "Toy signature desk", label: "SIGNATURE DESK · 1977", sourceKeys: ["e1RSA", "e1RSASni"], x, z: zc + 3.1, onUse: () => ({ terminal: S.rsaTerm }) });
        lectern(-23, zc + 2.2, "#6b4a22");
        station({ id: "e1-rsa", year: 1977, date: "manuscript received 4 April 1977, revised 1 September 1977; journal February 1978", title: "RSA signatures", label: "RSA · 1977 MANUSCRIPT · 1978 JOURNAL", sourceKeys: PANELS.rsa.sources, x: -23, z: zc + 3.1, onUse: board("rsa") });
      }

      // --- 8-inch floppy (right bank) ------------------------------------------------------------------------------
      {
        const zc = Z1 - 17, dx = 27, sx = 22.5;
        block(1.8, 1.2, 1.0, "#d4ccb4", dx, top + 0.6, zc);
        solid(0.7, 0.05, 0.05, "#1a1a1a", dx, top + 0.92, zc + 0.51);
        N.door = at(M.box({ w: 0.7, h: 0.1, d: 0.08, color: "#8a8270" }), dx, top + 1.05, zc + 0.53);
        N.diskLamp = at(M.box({ w: 0.08, h: 0.08, d: 0.04, color: "#ff4c4c", emissive: 1.6 }), dx + 0.7, top + 1.05, zc + 0.52, false);
        block(0.9, 0.9, 0.4, "#3a3530", sx, top + 0.45, zc);
        solid(0.72, 0.7, 0.06, "#e9e2cf", sx, top + 1.2, zc + 0.12);
        // The disk: a jacket and the hub that spins once loaded. Enlarged about 3 times so it can be seen.
        N.disk = place(createNode({ position: { x: sx, y: top + 1.05, z: zc + 0.06 } }));
        N.hub = createNode({ geometry: M.box({ w: 0.16, h: 0.16, d: 0.03, color: "#b8b0a0" }), position: { x: 0, y: 0, z: 0.02 } });
        addChild(N.disk, createNode({ geometry: M.box({ w: 0.6, h: 0.6, d: 0.02, color: "#151515" }) }), createNode({ geometry: M.box({ w: 0.4, h: 0.06, d: 0.025, color: "#f4efe2" }), position: { x: 0, y: 0.22, z: 0 } }), N.hub);
        N.floppy = { sleeve: [sx, top + 1.05, zc + 0.06], out: [sx, top + 1.6, zc + 0.3], slot: [dx, top + 0.92, zc + 0.75], inside: [dx, top + 0.92, zc + 0.2], pos: [sx, top + 1.05, zc + 0.06] };
        // The original loading animation: three instruction cards that light in turn.
        solid(1.4, 0.8, 0.06, "#101418", dx, top + 1.7, zc - 0.3);
        const card = M.box({ w: 0.36, h: 0.5, d: 0.04, color: "#7affb0", emissive: 1.1 });
        N.cards = [at(card, dx - 0.45, top + 1.7, zc - 0.25, false), at(card, dx, top + 1.7, zc - 0.25, false), at(card, dx + 0.45, top + 1.7, zc - 0.25, false)];
        sign("8-INCH FLOPPY · IBM DRIVES SOLD 1971", "period technology · context · enlarged, unbranded model", 25, top + 3.0, zc + 0.3, 0, 0.5);
        lectern(24.6, zc + 2.4);
        station({ id: "e1-floppy-toy", year: 1971, date: "1971: IBM begins selling floppy drives", on: { w: 6, h: 2.2, d: 1.4, x: 24.8, z: zc }, title: "Handle the 8-inch floppy", label: "FLOPPY · 1971", sourceKeys: ["e1FloppyIbm", "e1FloppyChm"], x: 24.6, z: zc + 3.3,
          onUse: () => { const f = S.floppy, c = FLOPPY_STEPS[f.step]; f.step = (f.step + 1) % FLOPPY_STEPS.length; return { caption: c }; } });
        lectern(30, zc + 2.4, "#6b4a22");
        station({ id: "e1-floppy", year: 1971, date: "1971: IBM begins selling floppy drives", title: "The 8-inch floppy", label: "8-INCH FLOPPY · 1971", sourceKeys: PANELS.floppy.sources, x: 30, z: zc + 3.3, onUse: board("floppy") });
      }

      // --- Front panel and its 256-byte tray (right bank) ----------------------------------------------------------
      {
        const zc = Z1 - 31, x = 25;
        block(3.0, 0.75, 1.4, "#5a4a3a", x, top + 0.375, zc);
        solid(2.6, 0.7, 1.2, "#2f4a6a", x, top + 1.1, zc);
        solid(2.5, 0.6, 0.02, "#d9d4c4", x, top + 1.1, zc + 0.61);
        const lever = M.box({ w: 0.06, h: 0.2, d: 0.06, color: "#e0e0e0", offset: { y: 0.1 } }), off = M.box({ w: 0.08, h: 0.08, d: 0.04, color: "#4a1a1a" });
        const red = lit("#ff4c4c");
        N.levers = []; N.dataOn = []; N.addrOn = [];
        for (let i = 0; i < 8; i++) {
          const lx = x + 1.05 - i * 0.3;
          N.levers.push(at(lever, lx, top + 0.92, zc + 0.65));
          at(off, lx, top + 1.22, zc + 0.63); N.dataOn.push(at(red, lx, top + 1.22, zc + 0.64, false));
          at(off, lx, top + 1.34, zc + 0.63); N.addrOn.push(at(red, lx, top + 1.34, zc + 0.64, false));
        }
        // The tray: one light per byte of memory, hung high on rods.
        solid(2.2, 2.2, 0.06, "#14110f", x, top + 3.8, zc - 0.3);
        solid(0.05, 2.4, 0.05, "#2a2622", x - 1, top + 6.0, zc - 0.3); solid(0.05, 2.4, 0.05, "#2a2622", x + 1, top + 6.0, zc - 0.3);
        const cell = M.box({ w: 0.08, h: 0.08, d: 0.03, color: "#ffb23f", emissive: 1.3 });
        N.tray = [];
        for (let i = 0; i < 256; i++) N.tray.push(at(cell, x - 0.9 + (i & 15) * 0.12, top + 4.7 - (i >> 4) * 0.12, zc - 0.25, false));
        N.wonLamp = at(M.box({ w: 2.2, h: 0.1, d: 0.06, color: "#58e07a", emissive: 1.4 }), x, top + 2.65, zc - 0.3, false);
        sign("FRONT PANEL · JAN 1975", "an original panel inspired by early microcomputers · context", x, top + 5.3, zc - 0.2, 0, 0.5);
        sign("256 BYTES · ONE LIGHT EACH", "lights up as you DEPOSIT", x, top + 2.4, zc - 0.25, 0, 0.3);
        lectern(x, zc + 2.4);
        station({ id: "e1-panel-toy", year: 1975, date: "inspired by the Altair 8800, introduced January 1975", on: { w: 3, h: 4.6, d: 1.6, x, z: zc }, title: "Front panel console", label: "FRONT PANEL · 1975", sourceKeys: ["e1Altair"], x, z: zc + 3.3, onUse: () => ({ terminal: S.panelTerm }) });
        lectern(30.5, zc + 2.4, "#6b4a22");
        station({ id: "e1-panel", year: 1975, date: "January 1975: the Altair 8800's magazine-cover introduction", title: "Switches and lights", label: "MICROCOMPUTERS · JAN 1975", sourceKeys: PANELS.panel.sources, x: 30.5, z: zc + 3.3, onUse: board("panel") });
      }

      // --- Acoustic coupler (right bank) ---------------------------------------------------------------------------
      {
        const zc = Z1 - 45, x = 25;
        block(2.4, 0.75, 1.1, "#6a5440", x, top + 0.375, zc);
        solid(1.0, 0.28, 0.5, "#c8c0a8", x, top + 0.89, zc);
        solid(0.3, 0.16, 0.3, "#222222", x - 0.3, top + 1.1, zc); solid(0.3, 0.16, 0.3, "#222222", x + 0.3, top + 1.1, zc);
        N.handset = place(createNode({ position: { x, y: top + 1.25, z: zc } }));
        addChild(N.handset, createNode({ geometry: M.box({ w: 0.95, h: 0.1, d: 0.14, color: "#3a3a3a" }) }),
          createNode({ geometry: M.box({ w: 0.24, h: 0.14, d: 0.2, color: "#333333" }), position: { x: -0.3, y: -0.04, z: 0 } }),
          createNode({ geometry: M.box({ w: 0.24, h: 0.14, d: 0.2, color: "#333333" }), position: { x: 0.3, y: -0.04, z: 0 } }));
        N.handsetY = top + 1.25;
        solid(0.5, 0.22, 0.45, "#4a4a4a", x + 0.85, top + 0.86, zc + 0.1);
        solid(0.6, 0.3, 0.04, "#101418", x - 0.85, top + 0.95, zc - 0.3);
        N.bitLamps = [at(lit("#4fb6ff"), x - 0.2, top + 0.9, zc + 0.26, false), at(lit("#ffb23f"), x + 0.2, top + 0.9, zc + 0.26, false)];
        const bar = M.box({ w: 0.1, h: 0.5, d: 0.06, color: "#7affb0", emissive: 1.0, offset: { y: 0.25 } });
        N.bars = [];
        for (let i = 0; i < 8; i++) { const b = at(bar, x - 0.42 + i * 0.12, top + 1.5, zc - 0.1); b.scale.y = 0.1; N.bars.push(b); }
        sign("ACOUSTIC COUPLER · 1970s", "a demonstration · original tones · model and speed not yet verified", x, top + 2.8, zc + 0.3, 0, 0.5);
        lectern(x, zc + 2.4);
        station({ id: "e1-coupler-toy", year: "1970s", date: "1970s demonstration; model, date and speed not yet verified", on: { w: 2.4, h: 2, d: 1.2, x, z: zc }, title: "Acoustic coupler demo", label: "COUPLER DEMO · 1970s", sourceKeys: ["e1Dossier"], x, z: zc + 3.3, onUse: () => ({ terminal: S.couplerTerm }) });
        lectern(30, zc + 2.4, "#6b4a22");
        station({ id: "e1-coupler", year: "1970s", date: "1970s demonstration; model, date and speed not yet verified", title: "Data as sound", label: "ACOUSTIC COUPLER · 1970s", sourceKeys: PANELS.coupler.sources, x: 30, z: zc + 3.3, onUse: board("coupler") });
      }

      // --- Timeline wall (right bank) ------------------------------------------------------------------------------
      {
        const zc = Z1 - 59, x = 26;
        block(11, 2.8, 0.4, "#3b2e22", x, top + 1.4, zc);
        const entries = [["1971", "IBM floppy drives sold", 0], ["MAY 1974", "Cerf and Kahn paper", 1], ["AUTUMN 1974", "Merkle proposal", 1], ["DEC 1974", "RFC 675", 1], ["JAN 1975", "Altair introduced", 0],
          ["NOV 1976", "Diffie and Hellman", 1], ["APR 1977", "RSA manuscript received", 1], ["FEB 1978", "RSA journal paper", 1], ["APR 1978", "Merkle article", 1]];
        entries.forEach(([when, what, idea], i) => {
          const px = x - 4.4 + (i % 5) * 2.2, py = top + (i < 5 ? 2.1 : 1.05), pz = zc + 0.25;
          if (idea) goldSign(when, what, px, py, pz, 0.36); else sign(when, what, px, py, pz, 0, 0.36);
        });
        sign("TIMELINE · 1970–1979", "gold: ideas · plain: period technology · all context", x, top + 3.3, zc + 0.25, 0, 0.45);
        station({ id: "e1-timeline", year: 1970, date: "the decade 1970 to 1979, each plaque with what its date marks", on: { w: 11, h: 2.8, d: 0.6, x, z: zc }, title: "Timeline of the decade", label: "TIMELINE · 1970–1979", sourceKeys: PANELS.timeline.sources, x, z: zc + 1.6, onUse: board("timeline") });
      }

    },

    // Every frame in this cave: move what the toys changed. Allocation-free.
    update(dt, elapsed) {
      if (!S) return;
      const N = S.n, k = Math.min(1, dt * 6);
      // Gateway: lamps, then the packets' run (up to MAX_FRAGS cubes, one lost unless it is a resend).
      const gw = S.gw;
      for (let g = 1; g <= 2; g++) {
        const l = N.gwLamps[g], known = gw.pinged[g], down = GW_ROUNDS[gw.round].down === g;
        l.off.visible = !known; l.up.visible = known && !down; l.down.visible = known && down;
      }
      N.hostLamp.visible = gw.solved > 0 && (elapsed % 1.2) < 0.8;
      if (gw.anim >= 0) {
        gw.anim += dt / 3;
        const G = N.gw, dz = gw.route === 2 ? -2.6 : 2.6, n = gw.single ? 1 : Math.min(MAX_FRAGS, Math.max(1, gw.frags.length || MAX_FRAGS));
        for (let i = 0; i < MAX_FRAGS; i++) {
          const c = N.packets[i], u = gw.anim * 1.4 - i * 0.08;
          c.visible = i < n && u > 0 && u < 1;
          if (!c.visible) continue;
          const lost = !gw.single && (gw.missing === -2 ? true : i === gw.missing % n);
          if (u < 0.5) { const t = u * 2; c.position.x = G.ax + (G.gx - G.ax) * t; c.position.z = G.zc + dz * t; c.position.y = G.y; }
          else if (lost) { c.position.x = G.gx; c.position.z = G.zc + dz; c.position.y = G.y - (u - 0.5) * 3; }
          else { const t = (u - 0.5) * 2; c.position.x = G.gx + (G.bx - G.gx) * t; c.position.z = G.zc + dz * (1 - t); c.position.y = G.y; }
        }
        if (gw.anim > 1) { gw.anim = -1; for (let i = 0; i < MAX_FRAGS; i++) N.packets[i].visible = false; }
      }
      // Key exchange: the two public numbers cross the wire, then the matching lamps.
      const dh = S.dh;
      if (dh.anim >= 0) {
        dh.anim = Math.min(2, dh.anim + dt * 0.8);
        const a = N.dhTokens[0], b = N.dhTokens[1], t = Math.min(1, dh.anim);
        a.visible = b.visible = dh.anim < 2;
        a.position.x = N.dh.x0 + (N.dh.x1 - N.dh.x0) * t; b.position.x = N.dh.x1 - (N.dh.x1 - N.dh.x0) * t;
        if (dh.anim >= 2) dh.anim = -1;
      }
      for (let i = 0; i < N.dhLamps.length; i++) { const on = dh.key > 0 && dh.key % LAMP_COLORS.length === i; N.dhLamps[i][0].visible = on; N.dhLamps[i][1].visible = on; }
      // Signature desk: the stamp comes down, the verdict lamp shows.
      const rsa = S.rsa;
      if (rsa.stamp > 0) { rsa.stamp = Math.max(0, rsa.stamp - dt * 2); N.stamp.position.y = N.stampY - Math.sin(rsa.stamp * Math.PI) * 0.22; }
      N.verdict[0].visible = rsa.verdict === 1; N.verdict[1].visible = rsa.verdict === 2;
      // Floppy: ease the disk to where its step puts it, spin while loaded, cards in turn.
      const f = S.floppy, F = N.floppy, step = f.step;
      const target = step === 0 ? F.sleeve : step === 1 ? F.out : step === 2 ? F.slot : F.inside;
      for (let i = 0; i < 3; i++) F.pos[i] += (target[i] - F.pos[i]) * k;
      N.disk.position.x = F.pos[0]; N.disk.position.y = F.pos[1]; N.disk.position.z = F.pos[2];
      const loaded = step === 3;
      if (loaded) N.hub.rotation.z += dt * 6;
      N.door.rotation.x += ((loaded ? -1.2 : 0) - N.door.rotation.x) * k;
      N.diskLamp.visible = loaded && (elapsed % 0.4) < 0.2;
      const card = loaded ? Math.floor(elapsed * 1.5) % 4 : -1;
      for (let i = 0; i < 3; i++) N.cards[i].visible = card >= 0 && i <= card - 1;
      // Front panel: only when a command changed it.
      const p = S.panel;
      if (p.dirty) {
        p.dirty = false;
        for (let i = 0; i < 8; i++) {
          const bit = 7 - i, on = (p.sw >> bit) & 1;
          N.levers[i].rotation.x = on ? -0.5 : 0.5; N.dataOn[i].visible = !!on; N.addrOn[i].visible = !!((p.addr >> bit) & 1);
        }
        for (let i = 0; i < 256; i++) N.tray[i].visible = p.mem[i] !== 0;
        N.wonLamp.visible = p.won;
      }
      // Coupler: the current bit's lamp and the current byte as bars, while it plays.
      const c = S.coupler;
      if (c.playing) {
        c.t += dt;
        const i = Math.floor(c.t / BIT);
        if (i >= c.count) c.playing = false;
        else {
          N.bitLamps[0].visible = !c.bits[i]; N.bitLamps[1].visible = !!c.bits[i];
          const base = i - (i & 7);
          for (let b = 0; b < 8; b++) N.bars[b].scale.y = base + b < c.count && c.bits[base + b] ? 1 : 0.2;
          N.handset.position.y = N.handsetY + Math.sin(c.t * 40) * 0.008;
        }
        if (!c.playing) { N.bitLamps[0].visible = N.bitLamps[1].visible = false; for (let b = 0; b < 8; b++) N.bars[b].scale.y = 0.1; N.handset.position.y = N.handsetY; }
      }
    },

    dispose() {
      closeAudio();
      S = null;
    }
  });
})();
