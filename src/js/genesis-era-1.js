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
// On the gateway floor, between HOST B and the gateways, the relay cabinet (genesis-era-1-relay.js): a modern museum toy
// with no historical date, whose console game is Packet Relay. Each exhibit's finer parts (frames, trims, plates,
// knobs, chalk) are one merged mesh at its own spot (`buildDetails`), built only by the scene's kit.
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
      href: DOSSIER, kind: "context", verified: true },
    // The home cluster's only source: the exhibit notes that keep its historical references on HOLD (unverified).
    e1HoldNotes: { label: "Genesis Voyage exhibit notes, Era 1: the home TV, paddle console and pocket calculator's historical references are on HOLD (not yet verified)",
      href: "https://github.com/Bitcoin-Bill/oogaboogaland/blob/gv/upgrade-era-1/docs/genesis-voyage/exhibits/era-1.md", kind: "context", verified: false }
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
  const createGateway = () => ({ round: 0, route: 0, pinged: [false, false, false], frags: [], have: [], order: [], missing: -1, solved: 0, anim: -1, single: false, feed: 0, flash: 0 });
  const gatewayTerminal = (s) => {
    const show = (f) => f.replace(/ /g, "_");
    const fresh = () => { s.route = 0; s.frags = []; s.have = []; s.order = []; s.missing = -1; s.pinged = [false, false, false]; };
    return {
      banner: ["HOW TO USE", "  1. Type MAP and press Enter to see the networks.", "  2. Type PING G1 and PING G2 to find the gateway that works.", "  3. Type ROUTE and that gateway, then SEND.", "  4. RESEND the missing number, then ASSEMBLE.", "",
        "GATEWAY PUZZLE · a simplified illustration of the 1974 gateway idea", "Send a message from HOST A to HOST B across two networks.", "Type HELP for the commands.", ""],
      prompt: "HOST A>",
      run: (line) => {
        const [cmd, arg] = words(line), r = GW_ROUNDS[s.round];
        if (!cmd) return { lines: [] };
        if (cmd === "HELP") return { lines: ["MAP          the networks and gateways", "PING G1      is the way through gateway G1 working? (or G2)", "ROUTE G1     send through G1 (or G2)", "SEND         send the message", "RESEND <n>   ask again for fragment number n", "ASSEMBLE     put the fragments in order", "RESET        start the puzzle again"] };
        if (cmd === "MAP") return { lines: [`Message to send: "${r.text}" (round ${s.round + 1} of 3)`, "HOST A -- NET A (packets up to 8 letters)", "            +-- gateway G1 -- NET B (up to 3 letters) --+", "            +-- gateway G2 -- NET C (up to 4 letters) --+-- HOST B", "One of the links beyond the gateways is down this round. PING to find out."] };
        if (cmd === "PING") {
          const g = arg === "G1" ? 1 : arg === "G2" ? 2 : 0;
          if (!g) return { lines: ["PING G1 or PING G2."] };
          cue("relay");
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
          s.anim = 0; s.single = false; s.feed++; cue("rustle-paper");
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
          s.solved = Math.min(99, s.solved + 1); s.flash = 3; cue("chime"); s.round = (s.round + 1) % GW_ROUNDS.length; fresh();
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
    banner: ["HOW TO USE", "  1. Type PICK and a secret number from 1 to 21, e.g. PICK 4.", "  2. Type SEND to swap public numbers with Bo.", "  3. Type SHARE: you and Bo get the same key.", "  4. Type TRY to watch Eve search for it.", "",
      "PUBLIC-KEY WORKBENCH · a simplified toy model with tiny numbers. NOT secure.", `Public numbers everyone can see: p = ${DH_P}, g = ${DH_G}. You and Bo each keep one secret.`, "Eve (an invented listener) hears everything on the wire. Type HELP.", ""],
    prompt: "YOU>",
    run: (line) => {
      const [cmd, arg] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["PICK <n>   choose your secret number, 1 to 21", "SEND       swap public results with Bo over the wire", "SHARE      each side works out the shared key", "EVE        what the listener heard", "TRY        let Eve search every possible secret", "MIDDLE     what this does not prove", "RESET      start again"] };
      if (cmd === "PICK") {
        const n = Number.parseInt(arg, 10);
        if (!(n >= 1 && n <= 21)) return { lines: ["Pick a whole number from 1 to 21."] };
        cue("click");
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
        s.key = mine; cue("chime");
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
  const createRsa = () => ({ signs: 0, stamp: 0, verdict: 0, check: 0 });
  const msgOf = (arg) => {
    if (/^[A-Z]$/.test(arg)) return arg.charCodeAt(0) - 64;
    const n = Number.parseInt(arg, 10);
    return n >= 2 && n <= 32 ? n : 0;
  };
  const rsaTerminal = (s) => ({
    banner: ["HOW TO USE", "  1. Type SIGN 5 (or SIGN and a letter).", "  2. Type VERIFY, the signature it gave you, then 5.", "  3. VERIFY again with a different message: it fails.", "  4. Type DOUBLE to see what a signature cannot stop.", "",
      "CHECKABLE SIGNATURE DESK · a simplified toy model with tiny numbers. NOT secure.", `Public check numbers: n = ${RSA_N}, e = ${RSA_E}. The signing number stays secret in the desk.`, "Messages are a number 2 to 32, or a letter (A = 1 ... Z = 26). Type HELP.", ""],
    prompt: "DESK>",
    run: (line) => {
      const [cmd, rest] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["SIGN <m>          sign a message", "VERIFY <s> <m>    anyone can check signature s on message m", "DOUBLE            sign two conflicting payments", "RESET             clear the desk"] };
      if (cmd === "SIGN") {
        const m = msgOf(rest);
        if (!m) return { lines: ["SIGN a number 2 to 32, or a letter."] };
        s.signs = Math.min(999, s.signs + 1); s.stamp = 1; s.verdict = 0; cue("thunk");
        return { lines: [`Message ${m}: signature ${powMod(m, RSA_D, RSA_N)} (made with the secret number).`, `Check it: VERIFY ${powMod(m, RSA_D, RSA_N)} ${m}. Then try VERIFY with a changed message.`] };
      }
      if (cmd === "VERIFY") {
        const parts = rest.split(/\s+/), sig = Number.parseInt(parts[0], 10), m = msgOf(parts[1] || "");
        if (!(sig >= 0 && sig < RSA_N) || !m) return { lines: ["VERIFY <signature 0-32> <message>."] };
        const ok = powMod(sig, RSA_E, RSA_N) === m;
        s.verdict = ok ? 1 : 2; s.check = 1; cue(ok ? "chime" : "beep");
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
    banner: ["HOW TO USE", "  1. Type CODES to see the switch patterns for O, G and A.", "  2. Type SET and a pattern, e.g. SET 01001111.", "  3. Type DEPOSIT to store it; the address steps on.", "  4. Store O, O, G, A in turn, then type RUN.", "",
      "FRONT PANEL · an original panel inspired by early microcomputers. Not an emulator.", "Set eight switches, then DEPOSIT the byte at the address. Challenge: spell OOGA at addresses 0 to 3.", "Type HELP.", ""],
    prompt: "PANEL>",
    run: (line) => {
      const [cmd, arg] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["FLIP <n>        flip switch n (7 is leftmost, 0 rightmost)", "SET 01001111    set all eight switches at once", "DEPOSIT         store the switches at the address, then step on", "EXAMINE <n>     go to address n (0-255) and show its byte", "CODES           the switch patterns for O, G and A", "RUN             read memory from address 0 as letters (museum shortcut)", "RESET           clear memory and switches"] };
      if (cmd === "FLIP") {
        const n = Number.parseInt(arg, 10);
        if (!(n >= 0 && n <= 7)) return { lines: ["FLIP 0 to 7."] };
        s.sw ^= 1 << n; s.dirty = true; cue("click");
        return { lines: [`Switches: ${bin(s.sw)}  (address ${s.addr})`] };
      }
      if (cmd === "SET") {
        if (!/^[01]{8}$/.test(arg)) return { lines: ["SET needs eight 0s and 1s, e.g. SET 01001111."] };
        s.sw = Number.parseInt(arg, 2); s.dirty = true; cue("click");
        return { lines: [`Switches: ${bin(s.sw)}  (address ${s.addr})`] };
      }
      if (cmd === "DEPOSIT") {
        s.mem[s.addr] = s.sw; const at = s.addr; s.addr = (s.addr + 1) & 255; s.dirty = true; cue("relay");
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
        if (won && !s.won) { s.won = true; s.dirty = true; cue("chime"); }
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
  // Silences the coupler at once: its tones are scheduled ahead on the audio clock, so they are cancelled, not left to
  // run out. Used by STOP and RESET, and when the visitor leaves the cave (`active(false)`).
  const hush = () => {
    if (!audio) return;
    const now = audio.context.currentTime;
    audio.gain.gain.cancelScheduledValues(0); audio.gain.gain.setValueAtTime(0, now);
    audio.osc.frequency.cancelScheduledValues(0);
  };
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
    if (S && s.playing) S.ease.seat = 0;
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
      banner: ["HOW TO USE", "  1. Type SEND and a short word, e.g. SEND HI.", "  2. Listen and watch the lamps: a low pitch is 0, a high pitch is 1.", "  3. Type STOP to hush it, or BITS HI to see the bits in silence.", "",
        "ACOUSTIC COUPLER DEMO · the idea: a phone handset rests in two cups, and data travels as sound.", "The pitches and speed here are invented for listening; no real model's speed or tones are claimed.", "Type HELP.", ""],
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
        if (cmd === "STOP") { s.playing = false; hush(); return { lines: ["Quiet."] }; }
        if (cmd === "RESET") { hush(); Object.assign(s, createCoupler()); return { lines: ["Demo cleared."] }; }
        return { lines: unknown };
      }
    };
  };

  // --- At home in the 1970s: a paddle console, a home TV and a pocket calculator (the upgrade's cluster) -----------
  // Three museum toys in the right bank's living room. Their historical references (which consoles, which TV
  // connection, which calculators, and when) are on HOLD until a source is verified, so no date, maker, model or
  // specification is claimed: each says so, and its only source is the exhibit notes that hold that HOLD.
  const HOLD_NOTE = "Museum note: the historical reference for this toy is on HOLD until a source is verified, so no date, maker, model or specification is claimed here.";

  // Ooga Paddle: a turn-based paddle-and-ball game on the Ooga console, a modern museum homage (original rules,
  // names and look; not historical software). A 20 x 9 court, your paddle on the left, Ooga's on the right, three rows
  // tall; up to 8 moves a line; first to 5. Seeded, so RESET replays the same game.
  const PW = 20, PH = 9, PADDLE = 3, P_WIN = 5, P_TICKS = 8, P_SEED = 1975;
  const createPaddle = () => ({ rng: P_SEED, py: 3, cy: 3, bx: 10, by: 4, dx: 0, dy: 0, live: false, you: 0, ooga: 0, toward: 1, over: false, hits: 0, dirty: true, path: new Float32Array((P_TICKS + 1) * 5), pathN: 0, pathT: 0 });
  // One recorded tick (your paddle, Ooga's, the ball, whether it is live) for the TV's replay.
  const pathAdd = (s) => { const o = s.pathN * 5; s.path[o] = s.py; s.path[o + 1] = s.cy; s.path[o + 2] = s.bx; s.path[o + 3] = s.by; s.path[o + 4] = s.live ? 1 : 0; s.pathN++; };
  const prand = (s) => { s.rng = (Math.imul(s.rng, 1103515245) + 12345) >>> 0; return (s.rng >>> 8) / 16777216; };
  const paddleField = (s) => {
    const rows = ["+--------------------+"];
    for (let y = 0; y < PH; y++) {
      let row = "";
      for (let x = 0; x < PW; x++) {
        const c = x === 0 && y >= s.py && y < s.py + PADDLE ? "]" : x === PW - 1 && y >= s.cy && y < s.cy + PADDLE ? "[" : s.live && x === s.bx && y === s.by ? "o" : x === PW / 2 && y % 2 === 0 ? ":" : " ";
        row += c;
      }
      rows.push(`|${row}|`);
    }
    rows.push("+--------------------+", `YOU ${s.you}   OOGA ${s.ooga}   (first to ${P_WIN})`);
    return rows;
  };
  // One tick: your move, Ooga's move, then the ball. Returns "you" or "ooga" when a point is scored, else "".
  const paddleTick = (s, move) => {
    if (move === "U") s.py = Math.max(0, s.py - 1); else if (move === "D") s.py = Math.min(PH - PADDLE, s.py + 1);
    const mid = s.cy + 1;
    if (s.dx > 0 && prand(s) < 0.72) s.cy = Math.max(0, Math.min(PH - PADDLE, s.cy + Math.sign(s.by - mid)));
    if (!s.live) return "";
    let nx = s.bx + s.dx, ny = s.by + s.dy;
    if (ny < 0 || ny > PH - 1) { s.dy = -s.dy; ny = s.by + s.dy; }
    if (nx <= 0) {
      if (ny >= s.py && ny < s.py + PADDLE) { s.dx = 1; s.dy = ny - s.py - 1; nx = 1; s.hits++; }
      else { s.live = false; s.ooga++; s.toward = -1; return "ooga"; }
    } else if (nx >= PW - 1) {
      if (ny >= s.cy && ny < s.cy + PADDLE) { s.dx = -1; s.dy = ny - s.cy - 1; nx = PW - 2; }
      else { s.live = false; s.you++; s.toward = 1; return "you"; }
    }
    s.bx = nx; s.by = ny;
    return "";
  };
  const paddleTerminal = (s) => ({
    banner: ["HOW TO USE", "  1. Type S to serve the ball.", "  2. Type U or D to move your paddle one step, or W to wait: up to 8 a line, e.g. UUW.", "  3. Keep the ball in play; first to 5 points wins.", "  4. Tune the TV across the rug to the console's channel to watch it.", "",
      "OOGA PADDLE · a modern museum homage on an original Ooga console. Not historical software.", "Type HELP for the commands.", ""],
    prompt: "PADDLE>",
    run: (line) => {
      const [cmd] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["S        serve (or start a new game once one is won)", "U D W    move up, move down or wait one step; up to 8 a line, e.g. UUDW", "MORE     about this console", "SOURCES  where this comes from", "RESET    start again from the same first serve"] };
      if (cmd === "MORE") return { lines: ["This console, its two paddle controllers and its game are original to the museum: no copied game, program,", "name, logo, artwork, sound or shell. The game is a modern museum homage, not historical software.",
        "When the museum's live console arrives, the same console will also play Ooga Pong, the arcade's caveman version.", HOLD_NOTE] };
      if (cmd === "SOURCES") return { lines: [`Source: ${sources.e1HoldNotes.label}`] };
      if (cmd === "RESET") { Object.assign(s, createPaddle()); return { lines: ["Reset: scores 0-0, the same first serve. Type S.", ...paddleField(s)] }; }
      if (cmd === "S") {
        if (s.live) return { lines: ["The ball is already in play: move with U, D or W.", ...paddleField(s)] };
        if (s.over) { s.you = 0; s.ooga = 0; s.over = false; }
        s.bx = PW / 2; s.by = 1 + Math.floor(prand(s) * (PH - 2)); s.dx = s.toward; s.dy = prand(s) < 0.5 ? -1 : 1; s.live = true; s.dirty = true;
        return { lines: [s.dx > 0 ? "Served toward Ooga." : "Served toward you.", ...paddleField(s)] };
      }
      if (!/^[UDW]+$/.test(cmd) || cmd.length > P_TICKS) return { lines: [`Moves are U, D and W, up to ${P_TICKS} a line (e.g. UUW). Type HELP.`] };
      if (s.over) return { lines: ["The game is over. Type S for a new one."] };
      const said = [];
      s.pathN = 0; s.pathT = 0; pathAdd(s);
      for (let i = 0; i < cmd.length; i++) {
        const pt = paddleTick(s, cmd[i]);
        pathAdd(s);
        if (!pt) continue;
        said.push(pt === "you" ? "Your point! The ball got past Ooga." : "Ooga's point: the ball got past you.");
        if (s.you >= P_WIN || s.ooga >= P_WIN) { s.over = true; said.push(s.you >= P_WIN ? "You win the game! Type S to play again." : "Ooga wins this one. Type S to play again."); }
        else said.push("Type S to serve again.");
        break;
      }
      s.dirty = true;
      return { lines: [...said, ...paddleField(s)] };
    }
  });

  // Home TV: a toy tuner. The dial picks one of 12 channels (the toy's numbers); three carry invented programmes, the
  // console's picture arrives on the channel its selector box is set to, and the rest are snow. Each channel comes in
  // clearest at one fine-tuning setting. The real connection consoles of the period used is on HOLD.
  const TV_STATIONS = { 2: "card", 8: "sky", 11: "fish" };
  const TV_NAMES = { card: "an invented test card: colour bars", sky: "an invented night-sky programme", fish: "an invented fish-tank programme", console: "the Ooga console's picture: the paddle game" };
  // The fine setting each dial comes in clearest at (the console's two channels at the centre, so it shows at once).
  const TV_FINE = [0, 1, -1, 0, 2, 0, 0, 0, -1, 2, 0, -2, 1];
  const CONSOLE_CH = { A: 5, B: 6 };
  const createTv = () => ({ on: false, dial: 2, fine: 0, sw: "A", dirty: true, rng: 7 });
  const tvShows = (t) => !t.on ? "off" : t.dial === CONSOLE_CH[t.sw] ? "console" : TV_STATIONS[t.dial] || "snow";
  const tvClear = (t) => t.fine === TV_FINE[t.dial];
  const tvWhat = (t) => {
    const on = tvShows(t);
    if (on === "off") return ["The screen is dark. Type POWER to switch the TV on."];
    if (on === "snow") return [`Dial ${t.dial}: snow. Nothing is on this channel in this toy. Try UP or DOWN.`];
    return [`Dial ${t.dial}: ${TV_NAMES[on]}.`, tvClear(t) ? "The picture is clear." : "The picture is fuzzy: try FINE + or FINE -."];
  };
  const tvTerminal = (t) => ({
    banner: ["HOW TO USE", "  1. Type POWER to switch the TV on.", "  2. Type UP or DOWN (or DIAL 5) to turn the channel dial.", "  3. The console's picture is on the channel its selector box is set to: SWITCH A or SWITCH B.", "  4. If a picture is fuzzy, type FINE + or FINE - until it is clear.", "",
      "HOME TV · a toy tuner with invented programmes, so you can see how tuning picks one channel.", "Type HELP for the commands.", ""],
    prompt: "TV>",
    run: (line) => {
      const [cmd, arg] = words(line);
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["POWER          switch on or off", "UP / DOWN      turn the dial one channel", "DIAL <n>       turn straight to channel n (1-12, the toy's numbers)", "FINE + / FINE - fine-tune the picture", "SWITCH A or B  set the console's selector box", "WHAT           what is on now", "PATH           how the console's picture reaches the screen", "MORE  SOURCES  RESET"] };
      if (cmd === "MORE") return { lines: ["How the toy works: many signals reach a TV at once, and its tuner picks out one channel; turning the dial", "changes which. The console's picture comes in as one more channel, so you tune to it like any other.",
        "The programmes on this TV are invented for the museum.", "Which connection home consoles of the period actually used is not named here.", HOLD_NOTE] };
      if (cmd === "SOURCES") return { lines: [`Source: ${sources.e1HoldNotes.label}`] };
      if (cmd === "RESET") { Object.assign(t, createTv()); return { lines: ["The TV is off, on dial 2, fine tuning centred, selector on A."] }; }
      if (cmd === "PATH") return { lines: ["In this toy: console -> cable -> selector box -> the TV's input -> the tuner picks one channel -> the screen.", `The selector is on ${t.sw}, so the console comes in on dial ${CONSOLE_CH[t.sw]}.`, "The real connection of the period is on HOLD and not labelled."] };
      if (cmd === "WHAT") return { lines: tvWhat(t) };
      if (cmd === "POWER" || cmd === "ON" || cmd === "OFF") { const was = t.on; t.on = cmd === "ON" ? true : cmd === "OFF" ? false : !t.on; t.dirty = true; if (t.on !== was) cue(t.on ? "hum-start" : "hum-stop"); return { lines: [t.on ? "Click: the TV warms up." : "Click: the picture shrinks to a dot and the screen goes dark.", ...(t.on ? tvWhat(t) : [])] }; }
      if (cmd === "UP" || cmd === "DOWN" || cmd === "DIAL") {
        const n = cmd === "DIAL" ? Number.parseInt(arg, 10) : t.dial + (cmd === "UP" ? 1 : -1);
        if (cmd === "DIAL" && !(n >= 1 && n <= 12)) return { lines: ["DIAL 1 to 12 (the toy's channel numbers)."] };
        t.dial = ((n - 1 + 12) % 12) + 1; t.fine = 0; t.dirty = true; cue("clack");
        return { lines: [`Clunk: dial ${t.dial}.`, ...tvWhat(t)] };
      }
      if (cmd === "FINE") {
        if (arg !== "+" && arg !== "-") return { lines: ["FINE + or FINE -."] };
        t.fine = Math.max(-3, Math.min(3, t.fine + (arg === "+" ? 1 : -1))); t.dirty = true;
        return { lines: [`Fine tuning ${t.fine > 0 ? "+" : ""}${t.fine}.`, ...tvWhat(t)] };
      }
      if (cmd === "SWITCH") {
        if (arg !== "A" && arg !== "B") return { lines: ["SWITCH A or SWITCH B."] };
        t.sw = arg; t.dirty = true;
        return { lines: [`The console's selector box is on ${arg}: its picture now comes in on dial ${CONSOLE_CH[arg]}.`, ...(t.on ? tvWhat(t) : [])] };
      }
      return { lines: unknown };
    }
  });

  // Pocket calculator: a toy with an 8-place display (the toy's, not a claimed specification), working left to right.
  // Digits beyond 8 are refused, results are cut (not rounded) to fit, and a result too big shows E until C.
  const CALC_PLACES = 8;
  const createCalc = () => ({ acc: 0, op: "", entry: "", shown: "0", error: false, after: false, dirty: true });
  const calcFit = (n) => {
    if (!Number.isFinite(n)) return { text: "E", error: true, cut: false };
    const neg = n < 0, abs = Math.abs(n), room = CALC_PLACES - (neg ? 1 : 0), whole = String(Math.trunc(abs)).length;
    if (whole > room) return { text: "E", error: true, cut: false };
    const d = room - whole, p = 10 ** d, t = Math.trunc(abs * p + 1e-7) / p;
    let text = t.toFixed(d);
    if (text.includes(".")) text = text.replace(/0+$/, "").replace(/\.$/, "");
    return { text: (neg && t !== 0 ? "-" : "") + text, error: false, cut: Math.abs(t - abs) > 1e-9 * Math.max(1, abs) };
  };
  const calcApply = (a, op, b) => op === "+" ? a + b : op === "-" ? a - b : op === "X" ? a * b : b === 0 ? NaN : a / b;
  const calcKey = (c, k, notes) => {
    if (k === "C") { Object.assign(c, createCalc()); return; }
    if (c.error) { notes.add("E: press C to clear."); return; }
    if (k >= "0" && k <= "9" || k === ".") {
      if (c.after) { c.acc = 0; c.op = ""; c.after = false; }
      if (k === "." && c.entry.includes(".")) return;
      if (c.entry.replace(/[^0-9]/g, "").length >= CALC_PLACES && k !== ".") { notes.add(`The display is full: ${CALC_PLACES} places.`); return; }
      c.entry = k === "." ? (c.entry || "0") + "." : c.entry === "0" ? k : c.entry + k;
      c.shown = c.entry;
      return;
    }
    const value = c.entry ? Number(c.entry) : c.acc;
    const result = c.op && (c.entry || k === "=") ? calcApply(c.acc, c.op, value) : value;
    const fit = calcFit(result);
    c.entry = ""; c.shown = fit.text;
    if (fit.error) { c.error = true; notes.add("E: the answer does not fit the display (or divides by zero). Press C."); return; }
    if (fit.cut) notes.add(`Cut to fit: the display has only ${CALC_PLACES} places.`);
    c.acc = Number(fit.text);
    if (k === "=") { c.op = ""; c.after = true; } else { c.op = k; c.after = false; }
  };
  const calcTerminal = (c) => ({
    banner: ["HOW TO USE", "  1. Type a short sum and =, e.g. 12+30= (X multiplies, / divides).", "  2. Read the display, then try 2/3= to see what it cuts off.", "  3. Type C to clear, then try a sum too big for it, e.g. 99999999X9=.", "",
      "POCKET CALCULATOR · a toy with an 8-place display, working left to right.", "Type HELP for the commands.", ""],
    prompt: "CALC>",
    run: (line) => {
      const [cmd] = words(line), keys = clean(line).replace(/\s+/g, "").replace(/\*/g, "X");
      if (!cmd) return { lines: [] };
      if (cmd === "HELP") return { lines: ["0-9 .          digits and the point", "+ - X /        add, take away, multiply, divide (worked left to right)", "=              the answer", "C              clear", "MORE  SOURCES  RESET"] };
      if (cmd === "MORE") return { lines: ["A calculator's display holds only so many digits. This toy holds 8: it refuses a ninth digit, cuts a long", "answer to fit (it does not round), and shows E for an answer too big, until C clears it.",
        "It works each step as you press it, left to right, so 2+3X4= gives 20.", HOLD_NOTE] };
      if (cmd === "SOURCES") return { lines: [`Source: ${sources.e1HoldNotes.label}`] };
      if (cmd === "RESET") { Object.assign(c, createCalc()); return { lines: ["Cleared.", `Display: [${c.shown.padStart(9)}]`] }; }
      if (!/^[0-9.+\-X/=C]+$/.test(keys) || keys.length > 40) return { lines: ["Use digits, the point, + - X /, = and C (up to 40 keys). Type HELP."] };
      const notes = new Set();
      const wasError = c.error;
      for (let i = 0; i < keys.length; i++) calcKey(c, keys[i], notes);
      c.dirty = true;
      if (c.error && !wasError) cue("beep");
      return { lines: [`Display: [${c.shown.padStart(9)}]`, ...notes] };
    }
  });
  // The calculator's display as seven segments a place (a b c d e f g), for the model.
  const SEGS = { "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg", "-": "g", E: "adefg" };
  const SEG_ORDER = "abcdefg";
  // Writes the shown text into `cells` (CALC_PLACES chars, right-aligned, spaces before) and `dots` (the point after a cell).
  const calcCells = (text, cells, dots) => {
    for (let i = 0; i < CALC_PLACES; i++) { cells[i] = " "; dots[i] = 0; }
    let at = CALC_PLACES - 1;
    for (let i = text.length - 1; i >= 0 && at >= 0; i--) {
      const ch = text[i];
      if (ch === ".") { dots[at] = 1; continue; }
      cells[at--] = ch;
    }
    for (let i = 0; i < CALC_PLACES; i++) if (dots[i] && cells[i] === " ") cells[i] = "0";
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
      { caption: "How to use", title: "How to use", text: [
        "1. The teleprinter beside this board runs the Gateway puzzle.",
        "2. Walk up to it and press Space (USE on a touch screen).",
        "3. Type MAP to begin. HELP lists every command.",
        "4. Page on here with the arrows to read about the 1974 paper."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Walk up to the postbox stand by the wall of boxes.",
        "2. Press Space to open one box and solve its small puzzle.",
        "3. Press Space again to try another box.",
        "4. Page on here to read about Merkle's idea."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Walk up to the chalkboard at the long table.",
        "2. Press Space and type PICK and a number from 1 to 21.",
        "3. Then type SEND, then SHARE, and watch the lamps match.",
        "4. Page on here to read about the 1976 paper."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Walk up to the typewriter at the desk.",
        "2. Press Space and type SIGN 5.",
        "3. Check it with VERIFY, then try a changed message.",
        "4. Page on here to read about the paper."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Walk up to the button console in front of the drive.",
        "2. Press Space once to take the disk out of its sleeve.",
        "3. Press Space three more times: insert it, load it, eject it.",
        "4. Page on here to read about the first floppy drives."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Walk up to the binder stand in front of the panel.",
        "2. Press Space and type CODES to see the patterns.",
        "3. SET a pattern, then DEPOSIT it. Watch the levers and lights.",
        "4. Spell OOGA, then type RUN."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Walk up to the open terminal case in front of the desk.",
        "2. Press Space and type SEND HI.",
        "3. Listen, and watch the lamps and bars follow the bits.",
        "4. Type STOP to hush it."] },
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
      { caption: "How to use", title: "How to use", text: [
        "1. Read the plaques left to right, top row first.",
        "2. Gold plaques are ideas; plain plaques are period technology.",
        "3. Page on here for what each date marks."] },
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
      { caption: "Left side", title: "Ideas (gold signs)", text: [
        "A gateway between packet networks (May and December 1974), with a packet puzzle. Merkle's puzzles (proposed autumn 1974, published April 1978). Diffie and Hellman's public keys (November 1976), with a key-exchange table. RSA's checkable signatures (manuscript 1977, journal February 1978), with a signing desk.",
        "These help explain Bitcoin's setting, but none of them is cited by the Bitcoin whitepaper. All are context."] },
      { caption: "Right side", title: "Period technology (plain signs)", text: [
        "IBM's 8-inch floppy (drives sold from 1971), a front panel inspired by the January 1975 Altair, an acoustic-coupler demonstration with original tones, and a dated timeline wall.",
        "These are context too: the gear of the decade, not steps toward Bitcoin."] },
      { caption: "How to play", title: "Toys are teaching models", text: [
        "Walk up to a console and press Space (or USE). Every toy has HELP and RESET. By the hosts, the relay cabinet (a modern toy) routes packets round a dead link.",
        "The key, signature and puzzle toys use tiny numbers on purpose: they show the idea, not real security. The panel is not an emulator, and the coupler's model and speed are not yet verified."] }
    ]
  };

  // --- Finer parts: one merged mesh an exhibit ------------------------------------------------------------------------
  // An exhibit's finer parts (frames, trims, plates, knobs, keys, chalk) as one merged mesh at (x, y, z), its parts in
  // its own frame (y from the floor). The layout's dry run has no models, so it gets a bare node at the same spot:
  // every run counts the same pieces, and the mesh moves with its exhibit's cluster. Each spot is inside one of the
  // exhibit's own solids, so no cluster grows or joins another.
  const detail = (kit, x, y, z, make) => {
    const nd = kit.createNode(kit.M.merge ? { geometry: kit.M.merge(...make(kit.M)) } : {});
    nd.position.x = x; nd.position.y = y; nd.position.z = z;
    return kit.place(nd);
  };
  const B = (M, w, h, d, color, x, y, z, emissive = 0) => M.box({ w, h, d, color, emissive, offset: { x, y, z } });
  const grid = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const buildDetails = (kit) => {
    const { top } = kit, Z1 = kit.era.z1;
    // The two hosts: plinths, the tape drives' window frames, tape and heads, the processors' bezels, plates and
    // handles; the gateways' base plates and the cages round their lamps.
    detail(kit, -18.5, top, Z1 - 24, (M) => [...pool(M, 3.2, 1.6, -8.5, 0.5), ...pool(M, 3.2, 1.6, 8.5, 0.5), ...[-8.5, 8.5].flatMap((hx) => { const L = hx - 0.65, R = hx + 0.65; return [
      B(M, 2.7, 0.08, 0.85, "#3a332b", hx, 0.04, 0), B(M, 0.02, 1.9, 0.77, "#5a5248", hx, 0.95, 0),
      B(M, 1.06, 0.04, 0.03, "#8f8670", L, 1.78, 0.41), B(M, 1.06, 0.04, 0.03, "#8f8670", L, 0.92, 0.41), B(M, 0.04, 0.86, 0.03, "#8f8670", L - 0.53, 1.35, 0.41), B(M, 0.04, 0.86, 0.03, "#8f8670", L + 0.53, 1.35, 0.41),
      B(M, 0.02, 0.42, 0.01, "#5a4a3a", L + 0.19, 1.35, 0.415), B(M, 0.02, 0.42, 0.01, "#5a4a3a", L - 0.19, 1.35, 0.415), B(M, 0.22, 0.1, 0.04, "#c9c3b4", L, 1.35, 0.42),
      B(M, 1.06, 0.03, 0.03, "#2a2622", R, 1.665, 0.41), B(M, 1.06, 0.03, 0.03, "#2a2622", R, 1.135, 0.41), B(M, 0.5, 0.07, 0.02, "#c9a35a", R, 1.03, 0.4, 0.3),
      B(M, 0.04, 0.22, 0.04, "#b8b8b8", R + 0.47, 0.6, 0.42), B(M, 0.04, 0.22, 0.04, "#b8b8b8", L + 0.4, 0.6, 0.39)]; }),
      ...[2.6, -2.6].flatMap((dz) => [...[-1, 1].map((sd) => B(M, 0.5, 0.06, 0.5, "#2a3442", sd, 0.03, dz)), B(M, 2.5, 0.05, 0.46, "#5a6a80", 0, 2.92, dz),
        ...[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([a, b]) => B(M, 0.035, 0.4, 0.035, "#c9c3b4", a, 3.06, dz + b)), B(M, 0.46, 0.04, 0.46, "#c9c3b4", 0, 3.27, dz)])]);
    // The gateway puzzle's teleprinter: a plinth, the paper's fold over the top, platen knobs and orange function keys.
    detail(kit, -11.5, top, Z1 - 24 + 6.1 - 0.95, (M) => [...pool(M, 1.6, 1.4, 0, 0.4), B(M, 1.0, 0.06, 0.65, "#5a5248", 0, 0.03, 0), B(M, 0.62, 0.02, 0.14, "#f7f3ea", 0, 1.72, -0.27),
      ...[-1, 1].map((sd) => B(M, 0.06, 0.1, 0.1, "#2a2826", sd * 0.38, 1.07, -0.18)), ...grid(3, (r) => B(M, 0.06, 0.03, 0.05, "#c8601e", 0.38, 1.055, 0.08 + r * 0.075)),
      B(M, 0.5, 0.02, 0.05, "#efe8d6", 0, 1.01, 0.29)]);
    // Merkle's puzzle wall: a cornice, base and sides, shelf rails, and a brass number plate and knob on every box.
    detail(kit, -18, top, Z1 - 35, (M) => [...pool(M, 6, 1.6, 0, 0.9), B(M, 5.5, 0.16, 0.7, "#3a2c1e", 0, 3.48, 0.05), B(M, 5.5, 0.12, 0.7, "#3a2c1e", 0, 0.06, 0.05),
      ...[-1, 1].map((sd) => B(M, 0.14, 3.4, 0.62, "#3a2c1e", sd * 2.66, 1.7, 0.05)), ...grid(7, (r) => B(M, 5.0, 0.03, 0.1, "#3a2c1e", 0, 0.2 + r * 0.5, 0.3)),
      ...grid(48, (i) => B(M, 0.14, 0.035, 0.01, "#d9b44a", -2.1 + (i % 8) * 0.6, 0.55 + Math.floor(i / 8) * 0.5, 0.365, 0.2)),
      ...grid(48, (i) => B(M, 0.05, 0.05, 0.03, "#c9a35a", -2.1 + (i % 8) * 0.6, 0.4 + Math.floor(i / 8) * 0.5, 0.37))]);
    // Its postbox: hinges, a label card in a brass holder and a little flag.
    detail(kit, -22, top, Z1 - 35 + 3.1 - 0.95, (M) => [...[-1, 1].map((sd) => B(M, 0.04, 0.12, 0.03, "#d9b44a", sd * 0.18, 0.95, 0.26)), B(M, 0.26, 0.1, 0.015, "#c9a35a", 0, 0.74, 0.27),
      B(M, 0.2, 0.06, 0.01, "#f4efe2", 0, 0.74, 0.28), B(M, 0.03, 0.4, 0.03, "#2a2622", 0.3, 1.33, 0), B(M, 0.16, 0.1, 0.02, "#d94a3a", 0.38, 1.47, 0)]);
    // The key-exchange bench: a trimmed top, a keypad at each end, insulators on the wire's posts, and Eve's
    // headphones, notepad and the tap down from the wire.
    detail(kit, -18, top, Z1 - 48, (M) => [...pool(M, 5.2, 2.4, 0, 0.2), ...[-1, 1].flatMap((sd) => [B(M, 0.2, 0.16, 0.2, "#e8e2cc", sd * 1.95, 0.92, -0.38), B(M, 0.18, 0.012, 0.18, "#f2c84a", sd * 1.95, 1.005, -0.38, 0.25), B(M, 0.2, 0.16, 0.2, "#d8d0bc", sd * 1.45, 0.92, -0.38), B(M, 0.18, 0.012, 0.18, sd < 0 ? "#3a6ab8" : "#c8402a", sd * 1.45, 1.003, -0.38, 0.25), B(M, 0.19, 0.012, 0.19, "#c9d8d4", sd * 0.95, 0.866, -0.38), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => B(M, 0.015, 0.26, 0.015, "#e8f0ee", sd * 0.95 + a * 0.085, 1.0, -0.38 + b * 0.085, 0.2))]), B(M, 4.5, 0.04, 1.5, "#5a3f26", 0, 0.82, 0),
      ...[-1, 1].flatMap((sd) => [B(M, 0.6, 0.04, 0.4, "#e8dcc0", sd * 1.15, 0.86, 0.35), ...grid(9, (k) => B(M, 0.1, 0.03, 0.08, "#2a2622", sd * 1.15 - 0.17 + (k % 3) * 0.17, 0.89, 0.24 + Math.floor(k / 3) * 0.11)),
        B(M, 0.1, 0.12, 0.1, "#e8e2cc", sd * 2.4, 2.86, 0)]),
      B(M, 0.6, 0.06, 0.1, "#2a2a2a", 0, 2.03, -1.7), ...[-1, 1].map((sd) => B(M, 0.12, 0.2, 0.2, "#2a2a2a", sd * 0.31, 1.86, -1.7)),
      B(M, 0.02, 0.6, 0.02, "#1a1a1a", 0, 2.5, 0), B(M, 0.02, 0.02, 1.7, "#1a1a1a", 0, 2.2, -0.85), B(M, 0.02, 0.14, 0.02, "#1a1a1a", 0, 2.13, -1.7)]);
    // Its chalkboard: chalked working, a crossbar between the legs and an eraser on the ledge.
    // (Its spot sits 0.16 m into the easel so its dry-run box stays inside the exhibit's own footprint.)
    detail(kit, -18, top, Z1 - 48 + 3.3 - 0.95 + 0.16, (M) => [...[[-0.3, 1.62, 0.36], [0.22, 1.62, 0.3], [-0.25, 0.99, 0.42], [0.25, 0.99, 0.3], [0.38, 1.55, 0.12]].map(([x, y, w]) => B(M, w, 0.014, 0.006, "#e8e6dc", x, y, -0.09)),
      B(M, 1.2, 0.05, 0.05, "#7a5232", 0, 0.4, -0.16), B(M, 0.14, 0.04, 0.06, "#6b4a2b", 0.3, 0.925, -0.06)]);
    // The signature desk: a trimmed top, drawers with brass pulls, an ink pad under the stamp, a pen pot and cards.
    detail(kit, -18, top, Z1 - 61, (M) => [...pool(M, 3.2, 2.0, 0, 0.3), B(M, 0.36, 0.2, 0.22, "#6b4a2b", 0.12, 0.96, 0.38), B(M, 0.06, 0.06, 0.01, "#c9a35a", 0.02, 0.96, 0.492), B(M, 0.06, 0.06, 0.01, "#c9a35a", 0.22, 0.96, 0.492), B(M, 0.22, 0.01, 0.03, "#1a1a1a", 0.12, 1.061, 0.38), B(M, 2.7, 0.02, 1.3, "#3e2c1c", 0, 0.86, 0), ...[-1, 1].flatMap((sd) => [B(M, 0.8, 0.25, 0.02, "#6e5238", sd * 0.8, 0.55, 0.61), B(M, 0.2, 0.03, 0.03, "#c9a35a", sd * 0.8, 0.55, 0.63)]),
      B(M, 0.3, 0.03, 0.22, "#2a2a40", 0.6, 0.885, 0), B(M, 0.08, 0.14, 0.08, "#2a2622", 1.1, 0.94, -0.4), ...grid(3, (k) => B(M, 0.015, 0.12, 0.015, k ? "#d9b44a" : "#c84a3a", 1.08 + k * 0.02, 1.04, -0.4)),
      B(M, 0.3, 0.04, 0.2, "#f4efe2", 0.1, 0.89, -0.35)]);
    // Its typewriter: a space bar and the table's crossbar.
    detail(kit, -18, top, Z1 - 61 + 3.1 - 0.95, (M) => [B(M, 0.4, 0.02, 0.05, "#e8e2cc", 0, 0.86, 0.24),
      B(M, 0.86, 0.04, 0.04, "#6a6f74", 0, 0.12, 0.29)]);
    // The floppy drive: the slot's bezel, a plate, a power switch, the card board's supports, and a box of sleeved disks
    // on the sleeve stand.
    detail(kit, 27, top, Z1 - 17, (M) => [...pool(M, 6.5, 2.2, -2.2, 0.6), B(M, 0.27, 0.025, 0.02, "#5a554c", 0.4, 0.825, 0.512), B(M, 0.27, 0.025, 0.02, "#5a554c", 0.4, 0.575, 0.512), B(M, 0.025, 0.27, 0.02, "#5a554c", 0.275, 0.7, 0.512), B(M, 0.025, 0.27, 0.02, "#5a554c", 0.525, 0.7, 0.512), B(M, 0.9, 0.035, 0.03, "#5a554c", 0, 0.86, 0.52), ...[-1, 1].map((sd) => B(M, 0.035, 0.2, 0.03, "#5a554c", sd * 0.45, 0.95, 0.52)), B(M, 0.4, 0.06, 0.02, "#c9a35a", -0.5, 0.7, 0.52, 0.2),
      B(M, 0.1, 0.1, 0.04, "#d9562b", 0.7, 0.7, 0.52), B(M, 1.5, 0.05, 0.08, "#2a2622", 0, 2.12, -0.3), B(M, 1.5, 0.05, 0.08, "#2a2622", 0, 1.28, -0.3),
      ...[-1, 1].map((sd) => B(M, 0.05, 0.12, 0.05, "#2a2622", sd * 0.6, 1.22, -0.3)), B(M, 0.32, 0.2, 0.18, "#6b4a2b", -4.25, 1.0, -0.1), B(M, 0.28, 0.16, 0.02, "#e9e2cf", -4.25, 1.06, -0.005)]);
    // Its operator's console: lamps over the push buttons and a plate.
    detail(kit, 24.6, top, Z1 - 17 + 3.3 - 0.95, (M) => [...grid(4, (i) => B(M, 0.08, 0.05, 0.03, ["#ff8a5a", "#ffd76a", "#8fe07a", "#f4f1e6"][i], -0.27 + i * 0.18, 1.165, -0.2, 1.0)), B(M, 0.5, 0.06, 0.02, "#c9a35a", 0, 0.75, 0.26, 0.2)]);
    // The front panel: a trimmed case, the lamps' label strip, the switches' group bands, vents, and the byte tray's frame.
    detail(kit, 25, top, Z1 - 31, (M) => [...pool(M, 3.6, 2.2, 0, 0.6), B(M, 2.7, 0.04, 1.25, "#5a3a20", 0, 1.47, 0), B(M, 2.4, 0.012, 0.01, "#2a2622", 0, 1.28, 0.625),
      ...grid(3, (g) => B(M, 0.86, 0.04, 0.01, g % 2 ? "#3a6a9a" : "#9a3a3a", 0.75 - g * 0.9, 1.04, 0.625)), ...grid(6, (k) => B(M, 1.6, 0.01, 0.05, "#5a3a20", 0, 1.495, -0.45 + k * 0.12)),
      B(M, 2.3, 0.06, 0.1, "#c9a35a", 0, 4.92, -0.3), B(M, 2.3, 0.04, 0.1, "#c9a35a", 0, 2.73, -0.3), ...[-1, 1].map((sd) => B(M, 0.06, 2.2, 0.1, "#c9a35a", sd * 1.13, 3.83, -0.3))]);
    // Its manual: tabs out of the binder's edge and a pencil.
    detail(kit, 25, top, Z1 - 31 + 3.3 - 0.95, (M) => [...grid(4, (k) => B(M, 0.04, 0.01, 0.05, ["#d9641e", "#e9a23b", "#4f8a8b", "#6b7a3a"][k], 0.35, 1.0, -0.15 + k * 0.1)), B(M, 0.02, 0.02, 0.2, "#e9c23b", 0.12, 1.02, 0.1)]);
    // The acoustic coupler: rubber rims on the cups, a trimmed table, the phone's cord, and the bit meter's frame.
    detail(kit, 25, top, Z1 - 45, (M) => [...pool(M, 3.2, 2.0, 0, 0.4), ...[-1, 1].map((sd) => B(M, 0.34, 0.03, 0.34, "#111111", sd * 0.3, 1.19, 0)), B(M, 2.5, 0.02, 1.2, "#4a3a2a", 0, 0.76, 0),
      B(M, 0.02, 0.02, 0.5, "#2a2622", 0.6, 0.79, 0.1), B(M, 1.1, 0.04, 0.06, "#2a2622", 0, 1.48, -0.1), B(M, 1.1, 0.56, 0.02, "#1a1a1a", 0, 1.76, -0.15),
      ...[-1, 1].map((sd) => B(M, 0.04, 0.62, 0.04, "#2a2622", sd * 0.55, 1.77, -0.12))]);
    // Its portable terminal: the case's handle and catches.
    detail(kit, 25, top, Z1 - 45 + 3.3 - 0.95, (M) => [B(M, 0.3, 0.04, 0.04, "#2a1a10", 0, 1.28, -0.24), ...[-1, 1].map((sd) => B(M, 0.06, 0.05, 0.03, "#c9c3b4", sd * 0.3, 0.84, 0.24))]);
    // The home TV: chrome trim on top, a base rail, and the screen's bezel.
    detail(kit, 22.6, top, Z1 - 52, (M) => [...pool(M, 6, 4, 4.4, 0, 0.03), B(M, 0.62, 0.03, 1.52, "#c9c3b4", 0, 1.115, 0), B(M, 0.62, 0.05, 1.52, "#4a3020", 0, 0.27, 0),
      B(M, 0.01, 0.04, 0.9, "#c9a35a", 0.32, 1.05, 0.2), B(M, 0.01, 0.04, 0.9, "#c9a35a", 0.32, 0.39, 0.2)]);
    // The timeline wall: a cap and a base, a dateline across it with a tick at each plaque, and a stripe under the cap.
    detail(kit, 26, top, Z1 - 59, (M) => [...pool(M, 11, 2, 0, 1.0), B(M, 11.3, 0.12, 0.5, "#5a4430", 0, 2.86, 0), B(M, 11.3, 0.1, 0.5, "#5a4430", 0, 0.05, 0), B(M, 10.6, 0.04, 0.02, "#e9a23b", 0, 1.58, 0.21, 0.4),
      ...grid(9, (i) => B(M, 0.04, 0.18, 0.02, "#e9a23b", -4.4 + (i % 5) * 2.2, 1.58, 0.21, 0.4)), B(M, 11, 0.06, 0.02, "#d9641e", 0, 2.66, 0.21)]);
  };

  // --- The relay cabinet (genesis-era-1-relay.js): a modern museum toy beside the hosts ------------------------------
  // A cream cabinet on the gateway floor between HOST B and the gateways, its face a lit map of HOST A, three gateways
  // and HOST B: a teal lamp marks the route the switch points to, a red one the link taken down. No historical date; a
  // toy in the spirit of the gateway paper the hosts illustrate. Its console game is Packet Relay
  // (genesis-era-cartridges.js). Records: 7 (lamps 2, the cabinet and its finer parts in one mesh 1, sign 3, prop 1); its
  // obstacle keeps the cabinet's footprint for the layout.
  const RELAY = { x: -14.5, u: 19.8, laneY: [1.52, 1.32, 1.12] };
  const buildRelay = (kit, N) => {
    const { top, solid, sign, obstacle, prop, place, createNode, M } = kit, rx = RELAY.x, rz = kit.era.z1 - RELAY.u, face = rz + 0.36;
    N.relayTop = top;
    obstacle(rx - 0.85, rx + 0.85, rz - 0.4, rz + 0.4);
    N.relayRoute = place(createNode({ geometry: M.box({ w: 0.08, h: 0.08, d: 0.03, color: "#46ffd2", emissive: 1.6 }), position: { x: rx - 0.2, y: top + RELAY.laneY[0], z: face + 0.012 } }));
    N.relayDown = place(createNode({ geometry: M.box({ w: 0.1, h: 0.1, d: 0.03, color: "#ff4c4c", emissive: 1.6 }), position: { x: rx + 0.22, y: top + RELAY.laneY[0], z: face + 0.012 }, visible: false }));
    // The face's lit map (HOST A, three wires through three gateways, HOST B), a lever slot under it, a cap, a plinth,
    // vents, a plate and the switch's three marks.
    detail(kit, rx, top, rz, (M) => [...pool(M, 2.4, 1.8, 0, 0.6), B(M, 1.6, 1.8, 0.7, "#d8cdb0", 0, 0.9, 0), B(M, 1.3, 0.62, 0.02, "#141820", 0, 1.32, 0.355), B(M, 1.4, 0.04, 0.03, "#8a8270", 0, 1.65, 0.36), B(M, 1.4, 0.04, 0.03, "#8a8270", 0, 0.99, 0.36),
      ...[-1, 1].map((sd) => B(M, 0.16, 0.5, 0.012, "#efe6d2", sd * 0.52, 1.32, 0.37, 0.5)),
      ...RELAY.laneY.flatMap((y) => [B(M, 0.84, 0.012, 0.01, "#5a5a62", 0, y, 0.37, 0.4), B(M, 0.1, 0.1, 0.012, "#8e8e96", 0, y, 0.372, 0.3)]),
      B(M, 1.7, 0.1, 0.78, "#8a6a44", 0, 1.85, 0), B(M, 1.7, 0.08, 0.78, "#5a4430", 0, 0.04, 0), ...[0, 1, 2, 3].map((k) => B(M, 0.9, 0.025, 0.02, "#a89f88", 0, 0.3 + k * 0.08, 0.36)),
      B(M, 0.5, 0.07, 0.02, "#c9a35a", 0, 0.66, 0.36, 0.2), B(M, 0.5, 0.16, 0.04, "#2a2622", 0, 0.86, 0.37), ...[0, 1, 2].map((k) => B(M, 0.08, 0.03, 0.05, "#c9c3b4", -0.15 + k * 0.15, 0.86, 0.39))]);
    sign("RELAY CABINET · MODERN TOY", "1970s gallery / no real machine", rx, top + 2.5, rz + 0.2, 0, 0.42);
    const R = BL.genesisEra1Relay;
    let term = null;
    if (R) {
      S.relay = R.create();
      term = R.terminal(S.relay, () => { S.relayDirty = true; S.wake = true; });
    }
    prop({ id: "e1-relay", year: "1970s", date: "No historical date: a modern museum toy shown in the 1970s gallery", connection: "context", title: "Relay cabinet - modern toy",
      label: "RELAY CABINET · MODERN TOY · 1970s GALLERY", hint: "Type ROUTE 2, FAIL 2, then SEND", sourceKeys: ["e1CerfKahn", "e1Rfc675"],
      demo: ["ROUTE 2", "SEND", "FAIL 2", "SEND", "ROUTE 3", "SEND", "RULES"],
      at: { x: rx, y: top, z: rz + 1.4 }, reach: 1.7, pick: { w: 1.7, h: 2, d: 1.0, x: rx, z: rz },
      onUse: () => term ? { terminal: term } : { caption: "This station's program has not loaded yet." } });
  };

  // --- Live scene state (rebuilt each visit) ------------------------------------------------------------------------
  let S = null;
  // Interface sounds: only the Genesis tab's cue names, through the kit's `cue` when the scene offers one (see the
  // exhibit notes' integration requests), and only on a visitor's command or the moment it lands.
  const CUES = new Set(["whir", "click", "clack", "relay", "chime", "thunk", "rustle-paper", "beep", "hum-start", "hum-stop"]);
  const cue = (name) => { if (S && S.cue && CUES.has(name)) S.cue(name); };
  // A command may change a model: it wakes `update`, which otherwise does nothing while every model is settled.
  const woke = (term) => { const run = term.run; term.run = (line) => { const r = run(line); if (S) S.wake = true; return r; }; return term; };
  // One geometry from several parts (a single node for a moving part); a bare stand-in where the kit has no merge.
  const parts = (M, list) => M.merge ? M.merge(...list) : list[0];
  // An exhibit's light pool: three soft amber squares on the floor, brightest in the middle (emissive only).
  const pool = (M, w, d, x, z, y = 0.006) => [B(M, w, 0.006, d, "#c87a2a", x, y, z, 0.16), B(M, w * 0.7, 0.006, d * 0.7, "#e8963a", x, y + 0.003, z, 0.26), B(M, w * 0.42, 0.006, d * 0.42, "#ffb85a", x, y + 0.006, z, 0.38)];
  const LAMP_COLORS = ["#ff5a4e", "#ffb23f", "#f2e14e", "#58e07a", "#4fb6ff", "#c47bff"];

  // Eases v toward t by the fraction k, landing on t once within a thousandth (so a settled model reads as settled).
  const approach = (v, t, k) => Math.abs(t - v) < 1e-3 ? t : v + (t - v) * k;
  // One step of every model (update, and active(false) to settle them). Returns whether anything is still moving.
  const step = (dt, elapsed, calm) => {
    // k: a part settling in about half a second; k2: a slower reveal; k3: a small knob turning briskly.
    const N = S.n, E = S.ease, k = calm ? 1 : Math.min(1, dt * 6), k2 = calm ? 1 : Math.min(1, dt * 3.5), k3 = calm ? 1 : Math.min(1, dt * 12);
    let busy = false;
    // Gateway: lamps; the packets' run (up to MAX_FRAGS cubes, one lost unless it is a resend); the racks' reels and
    // lamps and the teleprinter's head while they travel; the paper feeding a line a send; HOST B's lamp after a solve.
    const gw = S.gw;
    for (let g = 1; g <= 2; g++) {
      const l = N.gwLamps[g], known = gw.pinged[g], down = GW_ROUNDS[gw.round].down === g;
      l.off.visible = !known; l.up.visible = known && !down; l.down.visible = known && down;
    }
    if (gw.flash > 0) { gw.flash = calm ? 0 : Math.max(0, gw.flash - dt); if (gw.flash > 0) busy = true; }
    N.hostLamp.visible = gw.solved > 0 && (gw.flash <= 0 || (elapsed % 0.6) < 0.4);
    if (calm && gw.anim >= 0) { gw.anim = -1; for (let i = 0; i < MAX_FRAGS; i++) N.packets[i].visible = false; }
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
    if (!calm && gw.anim >= 0) {
      busy = true;
      for (let i = 0; i < N.reels.length; i++) N.reels[i].rotation.z += dt * (i & 1 ? -1.2 : 1.6);
      const st = Math.floor(elapsed * 3);
      if (st !== S.rackStep) { S.rackStep = st; for (let i = 0; i < N.rackLights.length; i++) N.rackLights[i].visible = ((i * 7 + st * 3) % 5) < 2; }
      N.printHead.position.x = N.printX + Math.sin(gw.anim * 38) * 0.26;
    } else N.printHead.position.x = N.printX;
    const feed = Math.min(gw.feed, 8) * 0.012;
    E.paper = approach(E.paper, feed, k2); if (E.paper !== feed) busy = true;
    N.paper.position.y = N.paperY + E.paper;
    // Key exchange: the two mixtures cross the wire (yours green, Bo's orange), then the matching lamps. The paint: the
    // secret tins open on PICK and each jar fills with its mixture; after SHARE both jars fill the same brown.
    const dh = S.dh;
    if (calm && dh.anim >= 0) { dh.anim = -1; N.dhTokens[0].visible = N.dhTokens[1].visible = false; }
    if (dh.anim >= 0) {
      dh.anim = Math.min(2, dh.anim + dt * 0.8);
      const a = N.dhTokens[0], b = N.dhTokens[1], t = Math.min(1, dh.anim), e = t * t * (3 - 2 * t);
      a.visible = b.visible = dh.anim < 2;
      a.position.x = N.dh.x0 + (N.dh.x1 - N.dh.x0) * e; b.position.x = N.dh.x1 - (N.dh.x1 - N.dh.x0) * e;
      if (dh.anim >= 2) dh.anim = -1; else busy = true;
    }
    for (let i = 0; i < N.dhLamps.length; i++) { const on = dh.key > 0 && dh.key % LAMP_COLORS.length === i; N.dhLamps[i][0].visible = on; N.dhLamps[i][1].visible = on; }
    const lidT = dh.a > 0 ? 1 : 0, mixT = calm ? lidT : (dh.a > 0 && E.lid > 0.85 ? 1 : 0), sharedT = dh.key > 0 && (calm || E.mix > 0.95) ? 1 : 0;
    E.lid = approach(E.lid, lidT, k2); E.mix = approach(E.mix, mixT, k2); E.shared = approach(E.shared, sharedT, k2);
    if (E.lid !== lidT || E.mix !== mixT || E.shared !== sharedT || (dh.key > 0) !== (sharedT > 0)) busy = true;
    N.lids[0].rotation.x = N.lids[1].rotation.x = -E.lid * 1.9;
    N.mixFill[0].scale.y = N.mixFill[1].scale.y = Math.max(0.001, E.mix);
    N.sharedFill[0].scale.y = N.sharedFill[1].scale.y = Math.max(0.001, E.shared);
    // Signature desk: the stamp comes down as the red private key turns in the lock box; the signed card rises out of
    // it; VERIFY turns the green public key and its verdict lamp grows in.
    const rsa = S.rsa;
    if (rsa.stamp > 0) { rsa.stamp = calm ? 0 : Math.max(0, rsa.stamp - dt * 2); N.stamp.position.y = N.stampY - Math.sin(rsa.stamp * Math.PI) * 0.22; if (rsa.stamp > 0) busy = true; }
    N.keys[0].rotation.z = Math.sin(rsa.stamp * Math.PI) * 1.57;
    if (rsa.check > 0) { rsa.check = calm ? 0 : Math.max(0, rsa.check - dt * 1.6); if (rsa.check > 0) busy = true; }
    N.keys[1].rotation.z = Math.sin(rsa.check * Math.PI) * 1.57;
    const cardT = rsa.signs > 0 ? 1 : 0;
    E.card = approach(E.card, cardT, k2); if (E.card !== cardT) busy = true;
    N.sigCard.position.y = N.sigCardY + E.card * 0.15;
    if (rsa.verdict !== E.lastVerdict) { E.lastVerdict = rsa.verdict; E.verdict = 0; }
    E.verdict = approach(E.verdict, 1, k); if (E.verdict !== 1) busy = true;
    const vs = 0.25 + 0.75 * E.verdict;
    N.verdict[0].visible = rsa.verdict === 1; N.verdict[1].visible = rsa.verdict === 2;
    N.verdict[0].scale.x = N.verdict[0].scale.y = N.verdict[0].scale.z = N.verdict[1].scale.x = N.verdict[1].scale.y = N.verdict[1].scale.z = vs;
    // Floppy: the disk eases to where its step puts it; loaded, the door closes, the disk spins up behind the drive's
    // window while the loader is read (the lamp flickers, the cards light in turn), then spins down, read.
    const f = S.floppy, F = N.floppy, fs = f.step;
    if (fs !== E.lastStep) { if (fs === 3) { E.load = 0; cue("whir"); } else if (fs === 0 || fs === 2) cue("click"); E.lastStep = fs; }
    const target = fs === 0 ? F.sleeve : fs === 1 ? F.out : fs === 2 ? F.slot : F.inside;
    for (let i = 0; i < 3; i++) { F.pos[i] = approach(F.pos[i], target[i], k); if (F.pos[i] !== target[i]) busy = true; }
    N.disk.position.x = F.pos[0]; N.disk.position.y = F.pos[1]; N.disk.position.z = F.pos[2];
    const loaded = fs === 3;
    if (!loaded) E.load = 99; else if (E.load < 3.5) E.load = calm ? 3.5 : E.load + dt;
    const reading = loaded && E.load < 3.5;
    E.spin = calm ? 0 : approach(E.spin, reading ? 9 : 0, k2);
    if (E.spin > 0) { N.hub.rotation.z += dt * E.spin; N.spinDisc.rotation.z -= dt * E.spin; }
    if (reading || E.spin > 0) busy = true;
    const doorT = loaded ? -1.2 : 0;
    N.door.rotation.x = approach(N.door.rotation.x, doorT, k); if (N.door.rotation.x !== doorT) busy = true;
    N.diskLamp.visible = loaded && (!reading || (elapsed % 0.4) < 0.2);
    const cards = !loaded ? 0 : reading ? Math.min(3, Math.floor(E.load * 1.1)) : 3;
    for (let i = 0; i < 3; i++) N.cards[i].visible = i < cards;
    // Front panel: when a command changed it, a sweep runs across the lamps and down the byte tray, lighting the new
    // state as it passes; the switch levers swing to their places.
    const p = S.panel;
    if (p.dirty) { p.dirty = false; E.sweep = calm ? 1 : 0; S.panelLive = true; }
    if (S.panelLive) {
      E.sweep = calm ? 1 : Math.min(1, E.sweep + dt / 0.6);
      const litTo = Math.floor(E.sweep * 8.999), rows = Math.floor(E.sweep * 16.999);
      let moving = E.sweep < 1;
      for (let i = 0; i < 8; i++) {
        const bit = 7 - i, on = (p.sw >> bit) & 1, lt = on ? -0.5 : 0.5;
        S.levers[i] = approach(S.levers[i], lt, k); if (S.levers[i] !== lt) moving = true;
        N.levers[i].rotation.x = S.levers[i];
        N.dataOn[i].visible = !!on && i <= litTo; N.addrOn[i].visible = !!((p.addr >> bit) & 1) && i <= litTo;
      }
      for (let i = 0; i < 256; i++) N.tray[i].visible = p.mem[i] !== 0 && (i >> 4) <= rows;
      N.wonLamp.visible = p.won && E.sweep >= 1;
      S.panelLive = moving; if (moving) busy = true;
    }
    // Coupler: on SEND the handset lifts and seats in its cups with a thunk; the current bit's lamp and the current
    // byte as bars while it plays.
    let lift = 0;
    if (E.seat < 1) {
      E.seat = calm ? 1 : Math.min(1, E.seat + dt / 0.45);
      const u = E.seat;
      lift = u < 1 ? (u < 0.45 ? Math.sin(u / 0.45 * Math.PI / 2) * 0.16 : 0.16 * (1 - ((u - 0.45) / 0.55) * ((u - 0.45) / 0.55))) : 0;
      if (E.seat >= 1) cue("thunk"); else busy = true;
      N.handset.position.y = N.handsetY + lift;
    }
    const c = S.coupler;
    if (c.playing) {
      busy = true;
      c.t += dt;
      const i = Math.floor(c.t / BIT);
      if (i >= c.count) c.playing = false;
      else {
        N.bitLamps[0].visible = !c.bits[i]; N.bitLamps[1].visible = !!c.bits[i];
        const base = i - (i & 7);
        for (let b = 0; b < 8; b++) N.bars[b].scale.y = base + b < c.count && c.bits[base + b] ? 1 : 0.2;
        if (E.seat >= 1) N.handset.position.y = N.handsetY + (calm ? 0 : Math.sin(c.t * 40) * 0.008);
      }
      if (!c.playing) { N.bitLamps[0].visible = N.bitLamps[1].visible = false; for (let b = 0; b < 8; b++) N.bars[b].scale.y = 0.1; N.handset.position.y = N.handsetY; }
    }
    // The home cluster. The TV's knobs turn to the dial and fine settings; tuning in, snow lies over the new picture and
    // thins out; the console's game replays its last line a tick at a time on the screen, and the controllers' knobs
    // turn with each paddle; the calculator lights its places in turn from the right. Idle (TV off) nothing moves.
    const tv = S.tv, shows = tvShows(tv), pd = S.paddle, Sc = N.screen;
    let replay = false;
    if (tv.dirty) {
      if (shows !== E.lastShow) { E.tune = !calm && shows !== "off" && shows !== "snow" ? 0 : 1; E.lastShow = shows; }
      N.tvLamp.visible = tv.on;
      for (let i = 0; i < N.card.length; i++) N.card[i].visible = shows === "card";
      for (let i = 0; i < N.sky.length; i++) N.sky[i].visible = shows === "sky";
      for (let i = 0; i < N.fish.length; i++) N.fish[i].visible = shows === "fish";
      for (let i = 0; i < N.court.length; i++) N.court[i].visible = shows === "console";
      N.switchKnob.position.z = N.switchZ + (tv.sw === "B" ? -0.02 : 0.02);
      S.speckStep = -1;
    }
    const dialT = tv.dial * 0.5, fineT = tv.fine * 0.4;
    E.dial = approach(E.dial, dialT, k3); E.fine = approach(E.fine, fineT, k3);
    if (E.dial !== dialT || E.fine !== fineT) busy = true;
    N.tvDial.rotation.x = E.dial; N.tvFine.rotation.x = E.fine;
    if (E.tune < 1) { E.tune = calm ? 1 : Math.min(1, E.tune + dt / 0.7); busy = true; }
    const fuzzy = shows === "snow" || (shows !== "off" && !tvClear(tv)), nSpecks = fuzzy ? 8 : E.tune < 1 ? Math.ceil(8 * (1 - E.tune)) : 0;
    N.snowBg.visible = shows === "snow" || (shows !== "off" && E.tune < 0.35);
    for (let i = 0; i < N.specks.length; i++) N.specks[i].visible = i < nSpecks;
    if (nSpecks > 0 && (!calm || S.speckStep < 0)) {
      if (!calm) busy = true;
      const st = calm ? 0 : Math.floor(elapsed * 12);
      if (st !== S.speckStep) {
        S.speckStep = st;
        for (let i = 0; i < N.specks.length; i++) {
          tv.rng = (Math.imul(tv.rng, 1103515245) + 12345) >>> 0;
          N.specks[i].position.z = Sc.sz + ((tv.rng >>> 8) / 16777216 - 0.5) * 0.64;
          N.specks[i].position.y = Sc.sy + ((tv.rng & 255) / 256 - 0.5) * 0.44;
        }
      }
    }
    let py = pd.py, cy = pd.cy, bx = pd.bx, by = pd.by, live = pd.live;
    if (pd.pathN > 1 && pd.pathT < pd.pathN - 1) {
      pd.pathT = calm ? pd.pathN - 1 : Math.min(pd.pathN - 1, pd.pathT + dt / 0.14);
      const o = Math.floor(pd.pathT) * 5;
      py = pd.path[o]; cy = pd.path[o + 1]; bx = pd.path[o + 2]; by = pd.path[o + 3]; live = pd.path[o + 4] > 0;
      replay = true; if (pd.pathT < pd.pathN - 1) busy = true;
    }
    if (tv.dirty || pd.dirty || replay) {
      const onConsole = shows === "console";
      N.youPad.visible = N.oogaPad.visible = onConsole; N.ball.visible = onConsole && live;
      N.youPad.position.y = Sc.sy + 0.21 - (py + 1) * Sc.rowH; N.oogaPad.position.y = Sc.sy + 0.21 - (cy + 1) * Sc.rowH;
      N.ball.position.y = Sc.sy + 0.21 - by * Sc.rowH; N.ball.position.z = Sc.sz + Sc.half - bx * (2 * Sc.half / (PW - 1));
      tv.dirty = false; pd.dirty = false;
    }
    const youT = (py - 3) * 0.6, oogaT = (cy - 3) * 0.6;
    E.knobYou = approach(E.knobYou, youT, k3); E.knobOoga = approach(E.knobOoga, oogaT, k3);
    if (E.knobYou !== youT || E.knobOoga !== oogaT) busy = true;
    for (let i = 0; i < 2; i++) { N.knobs[i].rotation.y = N.knobs[i].baseY + E.knobYou; N.knobs[2 + i].rotation.y = N.knobs[2 + i].baseY + E.knobOoga; }
    // The relay cabinet: its route and down lamps follow the toy when a command changed it.
    if (S.relayDirty && S.relay) {
      S.relayDirty = false;
      const r = S.relay;
      N.relayRoute.position.y = N.relayTop + RELAY.laneY[r.route];
      N.relayDown.visible = r.down >= 0;
      if (r.down >= 0) N.relayDown.position.y = N.relayTop + RELAY.laneY[r.down];
    }
    const calc = S.calc;
    let drawCalc = false;
    if (calc.dirty) { calc.dirty = false; calcCells(calc.shown, S.cells, S.dots); E.reveal = calm ? 8 : 0; drawCalc = true; }
    if (E.reveal < 8) { E.reveal = calm ? 8 : Math.min(8, E.reveal + dt / 0.045); drawCalc = true; if (E.reveal < 8) busy = true; }
    if (drawCalc) {
      const from = CALC_PLACES - Math.floor(E.reveal);
      for (let i = 0; i < CALC_PLACES; i++) {
        const on = i >= from ? SEGS[S.cells[i]] || "" : "";
        for (let kk = 0; kk < 7; kk++) N.segs[i][kk].visible = on.indexOf(SEG_ORDER[kk]) >= 0;
        N.dots[i].visible = i >= from && S.dots[i] === 1;
      }
    }
    return busy;
  };

  window.BL.genesisExhibits.register(1, {
    sources,
    overview,
    build(kit) {
      const { era, top, M, createNode, addChild, place, solid, sign, obstacle, prop, label } = kit;
      const Z1 = era.z1;
      closeAudio();
      S = { gw: createGateway(), dh: createDh(), rsa: createRsa(), panel: createPanel(), coupler: createCoupler(), floppy: { step: 0, spin: 0 }, post: { opened: -1 }, rackStep: -1, speckStep: -1, paddle: createPaddle(), tv: createTv(), calc: createCalc(), n: {} };
      S.paddleTerm = paddleTerminal(S.paddle); S.tvTerm = tvTerminal(S.tv); S.calcTerm = calcTerminal(S.calc);
      S.gwTerm = gatewayTerminal(S.gw); S.dhTerm = dhTerminal(S.dh); S.rsaTerm = rsaTerminal(S.rsa);
      S.panelTerm = panelTerminal(S.panel); S.couplerTerm = couplerTerminal(S.coupler);
      for (const t of [S.paddleTerm, S.tvTerm, S.calcTerm, S.gwTerm, S.dhTerm, S.rsaTerm, S.panelTerm, S.couplerTerm]) woke(t);
      S.cue = typeof kit.cue === "function" ? kit.cue : null;
      // Eased values for the models (preallocated; update writes them in place). `wake` starts true so the first frame
      // settles every model; afterwards update runs only while something moves (`busy`) or a command woke it.
      S.wake = true; S.busy = false; S.wasCalm = false;
      S.ease = { lid: 0, mix: 0, shared: 0, keyTurn: 0, check: 0, card: 0, verdict: 1, lastVerdict: 0, paper: 0, load: 99, spin: 0, lastStep: 0,
        sweep: 1, seat: 1, dial: 0, fine: 0, tune: 1, lastShow: "off", knobYou: 0, knobOoga: 0, reveal: 8, lastShown: "" };
      S.levers = new Float32Array(8);
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
      // A reading stand for a panel, behind the prop's spot: paper on wood, no screen.
      const lectern = (x, z, color = "#6b4a22") => {
        block(0.7, 1.0, 0.45, color, x, top + 0.5, z - 0.9);
        solid(0.82, 0.06, 0.6, "#d9822b", x, top + 1.03, z - 0.88);
        solid(0.72, 0.03, 0.5, "#f1e8d2", x, top + 1.075, z - 0.86);
      };
      // --- The era's devices: original, unbranded 1970s-style models, each a different kind of machine, so none looks
      // like another cave's computer. Each stands behind its prop's spot (z - 0.95), where the visitor walks up.
      const keyCream = M.box({ w: 0.06, h: 0.03, d: 0.05, color: "#efe8d6" }), keyDark = M.box({ w: 0.05, h: 0.03, d: 0.04, color: "#2b2b2b" });
      // A teleprinter on its pedestal: keyboard well, platen and paper rising out of it.
      const teleprinter = (x, z) => {
        const zz = z - 0.95;
        block(0.95, 0.72, 0.6, "#dcd2b8", x, top + 0.36, zz);
        solid(0.95, 0.06, 0.06, "#c8601e", x, top + 0.74, zz + 0.31);
        solid(0.95, 0.28, 0.62, "#e8dfc6", x, top + 0.86, zz);
        solid(0.8, 0.04, 0.26, "#3a3632", x, top + 1.02, zz + 0.16);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) at(keyCream, x - 0.32 + c * 0.08, top + 1.055, zz + 0.08 + r * 0.075);
        solid(0.7, 0.14, 0.14, "#2a2826", x, top + 1.07, zz - 0.18);
        N.paper = solid(0.62, 0.6, 0.02, "#f7f3ea", x, top + 1.42, zz - 0.2); N.paperY = top + 1.42;
        // The print head on its carriage: it runs along the platen while packets travel (one merged part).
        N.printHead = place(createNode({ geometry: parts(M, [M.box({ w: 0.1, h: 0.08, d: 0.07, color: "#2a2826" }), M.box({ w: 0.04, h: 0.03, d: 0.03, color: "#c8601e", emissive: 0.6, offset: { x: 0, y: 0.05, z: 0.02 } })]), position: { x, y: top + 1.15, z: zz - 0.08 } }));
        N.printX = x;
        for (let i = 0; i < 5; i++) solid(0.42 - (i % 2) * 0.14, 0.012, 0.024, "#4a4a4a", x - 0.05, top + 1.24 + i * 0.08, zz - 0.18);
      };
      // An electric typewriter on a metal typing table.
      const typewriter = (x, z) => {
        const zz = z - 0.95;
        block(0.9, 0.66, 0.55, "#8a8f94", x, top + 0.33, zz);
        solid(0.94, 0.04, 0.6, "#b9b2a0", x, top + 0.68, zz);
        solid(0.62, 0.2, 0.44, "#4f8a8b", x, top + 0.8, zz);
        solid(0.72, 0.08, 0.1, "#2f3a3a", x, top + 0.94, zz - 0.14);
        solid(0.1, 0.04, 0.04, "#c9c3b4", x - 0.4, top + 0.98, zz - 0.14);
        solid(0.5, 0.36, 0.015, "#f7f3ea", x, top + 1.15, zz - 0.17);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) at(keyDark, x - 0.25 + c * 0.068 + r * 0.017, top + 0.92 - r * 0.02, zz + 0.04 + r * 0.05);
      };
      // A chalkboard on an easel, with the table's toy numbers chalked on it.
      const chalkboard = (x, z) => {
        const zz = z - 0.95;
        block(0.08, 1.7, 0.08, "#7a5232", x - 0.58, top + 0.85, zz); block(0.08, 1.7, 0.08, "#7a5232", x + 0.58, top + 0.85, zz);
        obstacle(x - 0.62, x + 0.62, zz - 0.1, zz + 0.16);
        solid(1.24, 0.86, 0.05, "#7a5232", x, top + 1.3, zz + 0.02);
        solid(1.12, 0.76, 0.03, "#2f4a3a", x, top + 1.3, zz + 0.05);
        solid(1.12, 0.05, 0.12, "#7a5232", x, top + 0.88, zz + 0.08);
        solid(0.09, 0.02, 0.02, "#f4f1e6", x - 0.3, top + 0.915, zz + 0.1);
        sign("p = 23 · g = 5", "toy numbers", x, top + 1.32, zz + 0.08, 0, 0.3);
      };
      // An operator's console of big square push buttons, for the floppy drive.
      const opConsole = (x, z) => {
        const zz = z - 0.95;
        block(0.8, 0.9, 0.5, "#5a3d26", x, top + 0.45, zz);
        solid(0.84, 0.24, 0.44, "#e4dcc4", x, top + 1.02, zz);
        const colors = ["#d9562b", "#e8b13a", "#5d9a4a", "#e9e2cf"];
        for (let i = 0; i < 4; i++) solid(0.14, 0.05, 0.14, colors[i], x - 0.27 + i * 0.18, top + 1.165, zz + 0.04, 0.4);
        solid(0.62, 0.05, 0.03, "#20201e", x, top + 1.08, zz + 0.23);
      };
      // A walnut stand with the panel's ring binder open on it.
      const manualStand = (x, z) => {
        const zz = z - 0.95;
        block(0.6, 0.95, 0.4, "#6b4a2b", x, top + 0.475, zz);
        solid(0.72, 0.04, 0.46, "#c8692a", x, top + 0.97, zz);
        solid(0.33, 0.02, 0.42, "#f7f3ea", x - 0.17, top + 1.0, zz); solid(0.33, 0.02, 0.42, "#f7f3ea", x + 0.17, top + 1.0, zz);
        for (let i = 0; i < 4; i++) { solid(0.24, 0.006, 0.016, "#3a3a3a", x - 0.17, top + 1.013, zz - 0.12 + i * 0.08); solid(0.24, 0.006, 0.016, "#3a3a3a", x + 0.17, top + 1.013, zz - 0.12 + i * 0.08); }
        for (let i = 0; i < 3; i++) solid(0.03, 0.03, 0.03, "#b8b8b8", x, top + 1.01, zz - 0.12 + i * 0.12);
      };
      // A portable printing terminal in an open carrying case, on a folding table.
      const portable = (x, z) => {
        const zz = z - 0.95;
        block(0.9, 0.7, 0.55, "#8a6a44", x, top + 0.35, zz);
        solid(0.78, 0.14, 0.46, "#4a3020", x, top + 0.77, zz);
        // The lid stands open on its hinge, tilted well back so it never hides the coupler behind it (one part).
        // (Its node stands at the stand's middle, inside its footprint; the hinge at the case's back edge is in the geometry.)
        const lidParts = [M.box({ w: 0.78, h: 0.42, d: 0.05, color: "#4a3020", offset: { x: 0, y: 0.21, z: 0 } }), M.box({ w: 0.7, h: 0.34, d: 0.02, color: "#c4b79a", offset: { x: 0, y: 0.21, z: 0.03 } })];
        place(createNode({ geometry: M.turnedX && M.moved ? M.moved(M.turnedX(parts(M, lidParts), -1.15), 0, 0, -0.24) : lidParts[0], position: { x, y: top + 0.84, z: zz } }));
        solid(0.62, 0.03, 0.2, "#e6dcc4", x, top + 0.855, zz + 0.08);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) at(keyDark, x - 0.25 + c * 0.07, top + 0.875, zz + 0.02 + r * 0.055);
        solid(0.42, 0.02, 0.12, "#f7f3ea", x, top + 0.86, zz - 0.11);
        solid(0.05, 0.03, 0.03, "#ff4c4c", x + 0.3, top + 0.86, zz - 0.11, 1.2);
      };
      // A wooden postbox stand with a brass slot, for the Puzzle Post.
      const postStand = (x, z) => {
        const zz = z - 0.95;
        block(0.62, 1.05, 0.5, "#8a3a2a", x, top + 0.525, zz);
        solid(0.68, 0.08, 0.56, "#5a2a1e", x, top + 1.09, zz);
        solid(0.34, 0.05, 0.02, "#d9b44a", x, top + 0.86, zz + 0.26, 0.3);
        solid(0.4, 0.26, 0.02, "#e8dcc0", x, top + 0.55, zz + 0.26);
      };
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
        // Each host is a pair of tall cabinets: a reel-to-reel tape drive, and a processor with rows of lamps and rocker
        // switches, in its own colour (an illustration, not historical machines).
        N.reels = []; N.rackLights = [];
        const reelGeo = M.box({ w: 0.36, h: 0.36, d: 0.03, color: "#2a2a2a" }), reelHub = M.box({ w: 0.12, h: 0.12, d: 0.04, color: "#c9c3b4" });
        const rackLit = M.box({ w: 0.05, h: 0.05, d: 0.03, color: "#ffcf5a", emissive: 1.5 }), rocker = M.box({ w: 0.06, h: 0.1, d: 0.04, color: "#f2ede0" }), vent = M.box({ w: 0.9, h: 0.02, d: 0.025, color: "#8f8670" });
        for (const [x, name, body] of [[ax, "HOST A · NET A", "#c8621e"], [bx, "HOST B", "#6b7a3a"]]) {
          const L = x - 0.65, Rx = x + 0.65, fz = zc + 0.39;
          block(1.25, 1.9, 0.75, "#e6dcc4", L, top + 0.95, zc); block(1.25, 1.9, 0.75, "#e6dcc4", Rx, top + 0.95, zc);
          solid(1.27, 0.14, 0.77, body, L, top + 1.83, zc); solid(1.27, 0.14, 0.77, body, Rx, top + 1.83, zc);
          solid(1.0, 0.82, 0.02, "#1c1a18", L, top + 1.35, fz);
          for (const ry of [1.55, 1.15]) {
            const reel = place(createNode({ position: { x: L, y: top + ry, z: fz + 0.02 } }));
            addChild(reel, createNode({ geometry: reelGeo }), createNode({ geometry: reelGeo, rotation: { x: 0, y: 0, z: 0.785 } }), createNode({ geometry: reelHub }));
            N.reels.push(reel);
          }
          solid(1.0, 0.5, 0.02, body, Rx, top + 1.4, fz);
          for (let i = 0; i < 12; i++) N.rackLights.push(at(rackLit, Rx - 0.42 + (i % 6) * 0.17, top + 1.52 - Math.floor(i / 6) * 0.14, fz + 0.02));
          for (let i = 0; i < 8; i++) at(rocker, Rx - 0.42 + i * 0.12, top + 1.22, fz + 0.02);
          solid(1.0, 0.5, 0.02, "#c9c0a6", Rx, top + 0.6, fz);
          for (let i = 0; i < 5; i++) at(vent, Rx, top + 0.42 + i * 0.09, fz + 0.01);
          sign(name, "an illustration, not historical machines", x, top + 2.45, zc + 0.5, 0, 0.35);
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
        solid(0.12, 0.06, 5.2, "#222222", ax + 1.4, top + 0.06, zc); solid(0.12, 0.06, 5.2, "#222222", bx - 1.4, top + 0.06, zc);
        N.hostLamp = at(M.box({ w: 0.25, h: 0.25, d: 0.25, color: "#f2c14e", emissive: 1.6 }), bx, top + 2.08, zc, false);
        const cube = M.box({ w: 0.32, h: 0.32, d: 0.32, color: "#4fb6ff", emissive: 0.6 });
        N.packets = [];
        for (let i = 0; i < MAX_FRAGS; i++) N.packets.push(at(cube, ax, top + 0.5, zc, false));
        N.gw = { ax: ax + 1.4, bx: bx - 1.4, gx, zc, y: top + 0.35 };
        goldSign("NETWORKS MEET · MAY AND DEC 1974", "context · not a Bitcoin whitepaper citation", gx, top + 4.4, zc + 0.3, 0.7);
        teleprinter(-11.5, zc + 6.1);
        station({ id: "e1-gateway-puzzle", hint: "Type MAP, then PING G1 and PING G2", year: 1974, date: "an illustration of the May 1974 paper and the December 1974 RFC 675", title: "Gateway puzzle", label: "GATEWAY PUZZLE · 1974", sourceKeys: ["e1CerfKahn", "e1Rfc675"], x: -11.5, z: zc + 6.1, on: { w: 18, h: 3.4, d: 7, x: gx, z: zc },
          onUse: () => ({ terminal: S.gwTerm }) });
        lectern(-23.5, zc + 5.2, "#6b4a22");
        station({ id: "e1-gateway", hint: "Read how the 1974 networks met", year: 1974, date: "May 1974 journal paper; December 1974 RFC 675 specification", title: "Networks meet at a gateway", label: "GATEWAY · MAY AND DEC 1974", sourceKeys: PANELS.gateway.sources, x: -23.5, z: zc + 6.1, onUse: board("gateway") });
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
        postStand(-22, zc + 3.1);
        station({ id: "e1-puzzle-post", hint: "Press Space to open a box", year: 1974, date: "a toy model of the puzzles Merkle proposed in autumn 1974", on: { w: 5.2, h: 3.4, d: 1, x, z: zc }, title: "Puzzle Post toy", label: "PUZZLE POST · 1974", sourceKeys: ["e1MerkleHistory", "e1Merkle"], x: -22, z: zc + 3.1,
          onUse: () => {
            const p = S.post, i = (p.opened + 17) % 48;
            p.opened = i;
            const b = N.postBoxes[i].position;
            N.postOpen.position.x = b.x; N.postOpen.position.y = b.y; N.postOpen.visible = true; S.wake = true; cue("click");
            return { caption: `You picked box ${i + 1} of 48 and solved its small puzzle quickly. A listener does not know which box you chose and would have to search many. A toy model of the work gap, not a secure method. Press Space again to try another box.` };
          } });
        lectern(-14, zc + 2.2, "#6b4a22");
        station({ id: "e1-merkle", hint: "Read about the puzzle idea", year: 1974, date: "autumn 1974 proposal (the author's account); April 1978 journal article", title: "Merkle puzzles", label: "MERKLE PUZZLES · 1974 / 1978", sourceKeys: PANELS.merkle.sources, x: -14, z: zc + 3.1, onUse: board("merkle") });
      }

      // --- Public-key workbench (left bank) ------------------------------------------------------------------------
      {
        const zc = Z1 - 48, x = -18;
        block(4.4, 0.8, 1.4, "#7a5a38", x, top + 0.4, zc);
        // Name boards on the bench's front skirt, below its top, so they never hide the paint or the lamps.
        sign("YOU", "keep your secret", x - 1.9, top + 0.42, zc + 0.75, 0, 0.3);
        sign("BO", "keeps a secret too", x + 1.9, top + 0.42, zc + 0.75, 0, 0.3);
        // Paint mixing, a picture of the idea: each side's secret tin opens on PICK and its mixing jar fills with the
        // public yellow plus its secret (yours green, Bo's orange); SHARE fills both jars the same brown. Tins and jars
        // are in the bench's merged mesh; only the lids and the paint move.
        const lid = M.box({ w: 0.22, h: 0.025, d: 0.22, color: "#b9b2a0", offset: { x: 0, y: 0, z: 0.11 } });
        N.lids = [-1, 1].map((sd) => place(createNode({ geometry: lid, position: { x: x + sd * 1.45, y: top + 1.02, z: zc - 0.49 } })));
        const fill = (color, w) => M.box({ w, h: 0.22, d: w, color, emissive: 0.15, offset: { x: 0, y: 0.11, z: 0 } });
        N.mixFill = [place(createNode({ geometry: fill("#6aa84f", 0.15), position: { x: x - 0.95, y: top + 0.87, z: zc - 0.38 } })), place(createNode({ geometry: fill("#e8902a", 0.15), position: { x: x + 0.95, y: top + 0.87, z: zc - 0.38 } }))];
        N.sharedFill = [-1, 1].map((sd) => place(createNode({ geometry: fill("#8a5a2a", 0.158), position: { x: x + sd * 0.95, y: top + 0.87, z: zc - 0.38 } })));
        for (const nd of [...N.mixFill, ...N.sharedFill]) nd.scale.y = 0.001;
        block(0.12, 2.9, 0.12, "#2a2622", x - 2.4, top + 1.45, zc); block(0.12, 2.9, 0.12, "#2a2622", x + 2.4, top + 1.45, zc);
        solid(4.8, 0.04, 0.04, "#1a1a1a", x, top + 2.8, zc);
        block(0.7, 1.5, 0.7, "#556070", x, top + 0.75, zc - 1.7);
        solid(0.5, 0.5, 0.5, "#6a778a", x, top + 1.75, zc - 1.7);
        solid(0.1, 0.25, 0.2, "#c9a27a", x + 0.3, top + 1.8, zc - 1.7);
        sign("EVE", "an invented listener: hears the wire", x, top + 2.4, zc - 1.3, 0, 0.3);
        N.dhTokens = [at(M.box({ w: 0.22, h: 0.22, d: 0.22, color: "#6aa84f", emissive: 1.2 }), x - 2.2, top + 2.62, zc, false),
          at(M.box({ w: 0.22, h: 0.22, d: 0.22, color: "#ff9e4f", emissive: 1.2 }), x + 2.2, top + 2.62, zc, false)];
        N.dh = { x0: x - 2.2, x1: x + 2.2 };
        // A lamp at each end per colour; SHARE lights the matching pair.
        N.dhLamps = [];
        for (let i = 0; i < LAMP_COLORS.length; i++) {
          const geo = M.box({ w: 0.3, h: 0.3, d: 0.3, color: LAMP_COLORS[i], emissive: 1.5 });
          N.dhLamps.push([at(geo, x - 1.7, top + 0.98, zc, false), at(geo, x + 1.7, top + 0.98, zc, false)]);
        }
        goldSign("PUBLIC-KEY WORKBENCH · NOV 1976", "teaching table · a simplified toy model, not secure · context", x, top + 3.7, zc + 0.3, 0.6);
        chalkboard(x, zc + 3.3);
        station({ id: "e1-dh-table", hint: "Type PICK 4, then SEND, then SHARE", year: 1976, date: "a simplified toy model of the idea in the November 1976 paper", on: { w: 5, h: 3, d: 3.6, x, z: zc - 0.4 }, title: "Public-key workbench", label: "KEY EXCHANGE TABLE · 1976", sourceKeys: ["e1DH"], x, z: zc + 3.3, onUse: () => ({ terminal: S.dhTerm }) });
        lectern(-23.5, zc + 2.4, "#6b4a22");
        station({ id: "e1-dh", hint: "Read about public keys", year: 1976, date: "November 1976 journal issue; manuscript received 3 June 1976", title: "New Directions in Cryptography", label: "DIFFIE AND HELLMAN · NOV 1976", sourceKeys: PANELS.dh.sources, x: -23.5, z: zc + 3.3, onUse: board("dh") });
      }

      // --- Checkable signatures (left bank) ------------------------------------------------------------------------
      {
        const zc = Z1 - 61, x = -18;
        block(2.6, 0.85, 1.2, "#5e4630", x, top + 0.425, zc);
        solid(0.9, 0.04, 0.6, "#efe6cf", x - 0.5, top + 0.87, zc);
        N.stamp = at(M.box({ w: 0.3, h: 0.35, d: 0.3, color: "#7a2f2a" }), x + 0.6, top + 1.2, zc);
        N.stampY = top + 1.2;
        // The lock box's keys turn: the red private key on SIGN, the green public key on VERIFY; a signed card rises.
        // (Each key's node stands inside the desk's footprint; the key reaches out to its keyhole in the geometry, and
        // turns about its own shaft.)
        const keyGeo = (bow) => parts(M, [M.box({ w: 0.02, h: 0.02, d: 0.12, color: "#c9a35a", offset: { x: 0, y: 0, z: 0.14 } }), M.box({ w: 0.07, h: 0.07, d: 0.015, color: bow, emissive: 0.35, offset: { x: 0, y: 0, z: 0.205 } }), M.box({ w: 0.035, h: 0.012, d: 0.02, color: "#c9a35a", offset: { x: 0.02, y: 0, z: 0.11 } })]);
        N.keys = [place(createNode({ geometry: keyGeo("#c84a3a"), position: { x: x + 0.02, y: top + 0.96, z: zc + 0.4 } })), place(createNode({ geometry: keyGeo("#4a9a5a"), position: { x: x + 0.22, y: top + 0.96, z: zc + 0.4 } }))];
        N.sigCard = place(createNode({ geometry: parts(M, [M.box({ w: 0.2, h: 0.13, d: 0.008, color: "#f4efe2" }), M.box({ w: 0.06, h: 0.06, d: 0.01, color: "#b8342a", emissive: 0.2, offset: { x: 0.05, y: -0.02, z: 0.002 } }), M.box({ w: 0.12, h: 0.008, d: 0.01, color: "#4a4a4a", offset: { x: -0.03, y: 0.035, z: 0.002 } })]), position: { x: x + 0.12, y: top + 0.96, z: zc + 0.38 } }));
        N.sigCardY = top + 0.96;
        N.verdict = [at(M.box({ w: 0.26, h: 0.26, d: 0.26, color: "#4cff7a", emissive: 1.4 }), x - 1.0, top + 1.05, zc - 0.4, false),
          at(M.box({ w: 0.26, h: 0.26, d: 0.26, color: "#ff4c4c", emissive: 1.4 }), x - 1.0, top + 1.05, zc - 0.4, false)];
        goldSign("CHECKABLE SIGNATURES · 1977 MANUSCRIPT · FEB 1978 JOURNAL", "toy numbers · context · a Bitcoin signature does not mean RSA", x, top + 2.6, zc + 0.3, 0.55);
        typewriter(x, zc + 3.1);
        station({ id: "e1-rsa-desk", hint: "Type SIGN 5, then VERIFY it", year: 1977, date: "a toy model of the method in the paper received 4 April 1977", on: { w: 2.8, h: 1.8, d: 1.4, x, z: zc }, title: "Toy signature desk", label: "SIGNATURE DESK · 1977", sourceKeys: ["e1RSA", "e1RSASni"], x, z: zc + 3.1, onUse: () => ({ terminal: S.rsaTerm }) });
        lectern(-23, zc + 2.2, "#6b4a22");
        station({ id: "e1-rsa", hint: "Read about checkable signatures", year: 1977, date: "manuscript received 4 April 1977, revised 1 September 1977; journal February 1978", title: "RSA signatures", label: "RSA · 1977 MANUSCRIPT · 1978 JOURNAL", sourceKeys: PANELS.rsa.sources, x: -23, z: zc + 3.1, onUse: board("rsa") });
      }

      // --- 8-inch floppy (right bank) ------------------------------------------------------------------------------
      {
        const zc = Z1 - 17, dx = 27, sx = 22.5;
        block(1.8, 1.2, 1.0, "#e8e0c8", dx, top + 0.6, zc);
        solid(1.82, 0.16, 1.02, "#5a3820", dx, top + 0.08, zc);
        solid(0.12, 1.22, 1.02, "#8a5a32", dx - 0.86, top + 0.6, zc); solid(0.12, 1.22, 1.02, "#8a5a32", dx + 0.86, top + 0.6, zc);
        for (let i = 0; i < 4; i++) solid(1.3, 0.025, 0.02, "#a89f88", dx, top + 0.3 + i * 0.08, zc + 0.51);
        solid(0.7, 0.05, 0.05, "#1a1a1a", dx, top + 0.92, zc + 0.51);
        N.door = at(M.box({ w: 0.7, h: 0.1, d: 0.08, color: "#8a8270" }), dx, top + 1.05, zc + 0.53);
        N.diskLamp = at(M.box({ w: 0.08, h: 0.08, d: 0.04, color: "#ff4c4c", emissive: 1.6 }), dx + 0.7, top + 1.05, zc + 0.52, false);
        // Behind the drive's window, the disk as it turns: brown media, the hub ring and the index hole (one part).
        N.spinDisc = place(createNode({ geometry: parts(M, [M.box({ w: 0.2, h: 0.2, d: 0.004, color: "#3a2a1c" }), (M.turnedZ ? M.turnedZ(M.box({ w: 0.2, h: 0.2, d: 0.004, color: "#3a2a1c" }), Math.PI / 4) : M.box({ w: 0.2, h: 0.2, d: 0.004, color: "#3a2a1c" })), M.box({ w: 0.06, h: 0.06, d: 0.006, color: "#c9c3b4" }), M.box({ w: 0.02, h: 0.02, d: 0.007, color: "#f4efe2", emissive: 0.4, offset: { x: 0.06, y: 0, z: 0 } })].map((g) => M.moved ? M.moved(g, 0, 0, 0.256) : g)), position: { x: dx + 0.4, y: top + 0.7, z: zc + 0.25 } }));
        block(0.9, 0.9, 0.4, "#3a3530", sx, top + 0.45, zc);
        solid(0.72, 0.7, 0.06, "#e9e2cf", sx, top + 1.2, zc + 0.12);
        // The disk: a jacket and the hub that spins once loaded. Enlarged about 3 times so it can be seen.
        N.disk = place(createNode({ position: { x: sx, y: top + 1.05, z: zc + 0.06 } }));
        N.hub = createNode({ geometry: M.box({ w: 0.16, h: 0.16, d: 0.03, color: "#b8b0a0" }), position: { x: 0, y: 0, z: 0.02 } });
        addChild(N.disk, createNode({ geometry: M.box({ w: 0.6, h: 0.6, d: 0.02, color: "#151515" }) }), createNode({ geometry: M.box({ w: 0.4, h: 0.06, d: 0.025, color: "#f4efe2" }), position: { x: 0, y: 0.22, z: 0 } }), N.hub);
        N.floppy = { sleeve: [sx, top + 1.05, zc + 0.06], out: [sx, top + 1.6, zc + 0.3], slot: [dx, top + 0.92, zc + 0.75], inside: [dx, top + 0.92, zc + 0.2], pos: [sx, top + 1.05, zc + 0.06] };
        // The original loading animation: three instruction cards that light in turn.
        solid(1.4, 0.8, 0.06, "#101418", dx, top + 1.7, zc - 0.3);
        const card = M.box({ w: 0.36, h: 0.5, d: 0.04, color: "#ffb347", emissive: 1.1 });
        N.cards = [at(card, dx - 0.45, top + 1.7, zc - 0.25, false), at(card, dx, top + 1.7, zc - 0.25, false), at(card, dx + 0.45, top + 1.7, zc - 0.25, false)];
        sign("8-INCH FLOPPY · IBM DRIVES SOLD 1971", "period technology · context · enlarged, unbranded model", 25, top + 3.0, zc + 0.3, 0, 0.5);
        opConsole(24.6, zc + 3.3);
        station({ id: "e1-floppy-toy", hint: "Press Space four times: out, in, load, eject", year: 1971, date: "1971: IBM begins selling floppy drives", on: { w: 6, h: 2.2, d: 1.4, x: 24.8, z: zc }, title: "Handle the 8-inch floppy", label: "FLOPPY · 1971", sourceKeys: ["e1FloppyIbm", "e1FloppyChm"], x: 24.6, z: zc + 3.3,
          onUse: () => { const f = S.floppy, c = FLOPPY_STEPS[f.step]; f.step = (f.step + 1) % FLOPPY_STEPS.length; S.wake = true; return { caption: c }; } });
        lectern(30, zc + 2.4, "#6b4a22");
        station({ id: "e1-floppy", hint: "Read how to handle the floppy", year: 1971, date: "1971: IBM begins selling floppy drives", title: "The 8-inch floppy", label: "8-INCH FLOPPY · 1971", sourceKeys: PANELS.floppy.sources, x: 30, z: zc + 3.3, onUse: board("floppy") });
      }

      // --- Front panel and its 256-byte tray (right bank) ----------------------------------------------------------
      {
        const zc = Z1 - 31, x = 25;
        block(3.0, 0.75, 1.4, "#6b4a2b", x, top + 0.375, zc);
        solid(2.6, 0.7, 1.2, "#c8692a", x, top + 1.1, zc);
        solid(0.12, 0.74, 1.24, "#5a3a20", x - 1.36, top + 1.1, zc); solid(0.12, 0.74, 1.24, "#5a3a20", x + 1.36, top + 1.1, zc);
        solid(2.5, 0.6, 0.02, "#efe6cf", x, top + 1.1, zc + 0.61);
        solid(2.5, 0.08, 0.03, "#1e1c1a", x, top + 0.88, zc + 0.62);
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
        manualStand(x, zc + 3.3);
        station({ id: "e1-panel-toy", hint: "Type CODES, then SET and DEPOSIT to spell OOGA", year: 1975, date: "inspired by the Altair 8800, introduced January 1975", on: { w: 3, h: 4.6, d: 1.6, x, z: zc }, title: "Front panel console", label: "FRONT PANEL · 1975", sourceKeys: ["e1Altair"], x, z: zc + 3.3, onUse: () => ({ terminal: S.panelTerm }) });
        lectern(30.5, zc + 2.4, "#6b4a22");
        station({ id: "e1-panel", hint: "Read about switches and lights", year: 1975, date: "January 1975: the Altair 8800's magazine-cover introduction", title: "Switches and lights", label: "MICROCOMPUTERS · JAN 1975", sourceKeys: PANELS.panel.sources, x: 30.5, z: zc + 3.3, onUse: board("panel") });
      }

      // --- Acoustic coupler (right bank) ---------------------------------------------------------------------------
      {
        const zc = Z1 - 45, x = 25;
        block(2.4, 0.75, 1.1, "#6a5440", x, top + 0.375, zc);
        solid(1.0, 0.28, 0.5, "#b08a5a", x, top + 0.89, zc);
        solid(0.3, 0.16, 0.3, "#222222", x - 0.3, top + 1.1, zc); solid(0.3, 0.16, 0.3, "#222222", x + 0.3, top + 1.1, zc);
        N.handset = place(createNode({ position: { x, y: top + 1.25, z: zc } }));
        addChild(N.handset, createNode({ geometry: M.box({ w: 0.95, h: 0.1, d: 0.14, color: "#3a3a3a" }) }),
          createNode({ geometry: M.box({ w: 0.24, h: 0.14, d: 0.2, color: "#333333" }), position: { x: -0.3, y: -0.04, z: 0 } }),
          createNode({ geometry: M.box({ w: 0.24, h: 0.14, d: 0.2, color: "#333333" }), position: { x: 0.3, y: -0.04, z: 0 } }));
        N.handsetY = top + 1.25;
        solid(0.5, 0.2, 0.45, "#7d8a3a", x + 0.85, top + 0.85, zc + 0.1);
        solid(0.42, 0.06, 0.12, "#6a7630", x + 0.85, top + 0.98, zc - 0.05);
        solid(0.24, 0.03, 0.24, "#e8e2cc", x + 0.85, top + 0.965, zc + 0.16);
        solid(0.08, 0.035, 0.08, "#7d8a3a", x + 0.85, top + 0.975, zc + 0.16);
        solid(0.5, 0.04, 0.4, "#f7f3ea", x - 0.85, top + 0.77, zc - 0.05);
        solid(0.5, 0.25, 0.02, "#f7f3ea", x - 0.85, top + 0.88, zc - 0.25);
        N.bitLamps = [at(lit("#4fb6ff"), x - 0.2, top + 0.9, zc + 0.26, false), at(lit("#ffb23f"), x + 0.2, top + 0.9, zc + 0.26, false)];
        const bar = M.box({ w: 0.1, h: 0.5, d: 0.06, color: "#ffb347", emissive: 1.0, offset: { y: 0.25 } });
        N.bars = [];
        for (let i = 0; i < 8; i++) { const b = at(bar, x - 0.42 + i * 0.12, top + 1.5, zc - 0.1); b.scale.y = 0.1; N.bars.push(b); }
        sign("ACOUSTIC COUPLER · 1970s", "a demonstration · original tones · model and speed not yet verified", x, top + 2.8, zc + 0.3, 0, 0.5);
        portable(x, zc + 3.3);
        station({ id: "e1-coupler-toy", hint: "Type SEND HI and listen", year: "1970s", date: "1970s demonstration; model, date and speed not yet verified", on: { w: 2.4, h: 2, d: 1.2, x, z: zc }, title: "Acoustic coupler demo", label: "COUPLER DEMO · 1970s", sourceKeys: ["e1Dossier"], x, z: zc + 3.3, onUse: () => ({ terminal: S.couplerTerm }) });
        lectern(30, zc + 2.4, "#6b4a22");
        station({ id: "e1-coupler", hint: "Read how data became sound", year: "1970s", date: "1970s demonstration; model, date and speed not yet verified", title: "Data as sound", label: "ACOUSTIC COUPLER · 1970s", sourceKeys: PANELS.coupler.sources, x: 30, z: zc + 3.3, onUse: board("coupler") });
      }


      // --- Era decor: 1970s set dressing, original and unbranded, making no claims ----------------------------------
      // Wood panelling and supergraphic stripes on both back walls, original poster art, sunburst emblems up high,
      // a lounge on each bank (shag rug, modular sofa, armchair, coffee table, arc lamp, plants) under amber globe
      // pendants, and an office corner (desk, chair, desk calculator, filing cabinet, bookshelf of binders). All of it
      // stands well back from the waterside walk (x <= -16 and x >= 22), out of the reserved plots and below 8 m;
      // only low furniture stands between the walk and the exhibits, so the signs and the overview stay in sight.
      {
        const WALL = { L: -33.86, R: 41.86 };
        const wallX = (side) => side < 0 ? WALL.L : WALL.R;
        const face = (side, layer) => wallX(side) - side * (0.13 + layer * 0.012);
        const art = (side, u, y, w, h, color, layer, em = 0) => solid(0.02, h, w, color, face(side, layer), y, Z1 - u, em);
        for (const side of [-1, 1]) {
          const wx = wallX(side);
          // Panelling to head height, then three supergraphic bands.
          solid(0.1, 2.4, 56, "#6e4a2a", wx - side * 0.04, top + 1.2, Z1 - 40);
          // The battens: one merged mesh along the wall (its spot is inside the panelling), the same pieces as before.
          detail(kit, wx - side * 0.04, top, Z1 - 40, (Mm) => { const list = []; for (let u = 12.7; u < 68; u += 1.4) list.push(B(Mm, 0.04, 2.4, 0.07, "#4e321c", -side * 0.06, 1.2, 40 - u)); return list; });
          // The battens' footprint as the layout knew it (each was its own piece), held to the cave's wall.
          obstacle(Math.max(era.cave.x0, wx - side * 0.1 - 0.25), Math.min(era.cave.x1, wx - side * 0.1 + 0.25), Z1 - 67.3 - 0.25, Z1 - 12.7 + 0.25);
          solid(0.06, 0.5, 56, "#8a4a1f", wx - side * 0.04, top + 3.0, Z1 - 40);
          solid(0.06, 0.5, 56, "#d9641e", wx - side * 0.04, top + 3.55, Z1 - 40);
          solid(0.06, 0.5, 56, "#e9a23b", wx - side * 0.04, top + 4.1, Z1 - 40);
          // Sunburst emblems high on the wall: a disc of two squares and eight rays, turned in the wall's plane.
          const ray = M.box({ w: 0.02, h: 0.1, d: 2.6, color: "#f2c14e" }), disc = M.box({ w: 0.03, h: 0.9, d: 0.9, color: "#e9a23b", emissive: 0.3 });
          for (const u of side < 0 ? [26, 54] : [30, 58]) {
            const z = Z1 - u, y = top + 6.4, x = face(side, 0);
            for (let k = 0; k < 8; k++) place(createNode({ geometry: ray, position: { x, y, z }, rotation: { x: k * Math.PI / 8, y: 0, z: 0 } }));
            place(createNode({ geometry: disc, position: { x: face(side, 1), y, z } }));
            place(createNode({ geometry: disc, position: { x: face(side, 1), y, z }, rotation: { x: Math.PI / 4, y: 0, z: 0 } }));
          }
        }
        // Posters: a dark frame and original art in stacked shapes (no words, no claims).
        const poster = (side, u, style) => {
          const y = top + 1.95;
          art(side, u, y, 1.5, 1.9, "#2a2018", 0);
          if (style === 0) { // sunset over hills
            art(side, u, y, 1.34, 1.74, "#f4e2bc", 1);
            const bands = ["#e9a23b", "#d9641e", "#a8401c", "#5a2a14"];
            for (let i = 0; i < 4; i++) art(side, u, y - 0.15 - i * 0.18, 1.34, 0.18, bands[i], 2);
            for (let i = 0; i < 3; i++) art(side, u, y + 0.05 + i * 0.12, 0.7 - i * 0.2, 0.12, "#f2c14e", 2);
          } else if (style === 1) { // mountains
            art(side, u, y, 1.34, 1.74, "#9cc3c7", 1);
            art(side, u, y + 0.65, 1.34, 0.3, "#e9a23b", 2);
            for (let i = 0; i < 5; i++) art(side, u, y - 0.6 + i * 0.22, 1.2 - i * 0.24, 0.22, i < 4 ? "#4f6a3a" : "#f4f1e6", 2);
          } else if (style === 2) { // nested squares
            const c = ["#5a2a14", "#d9641e", "#e9a23b", "#f4e2bc", "#4f8a8b"];
            for (let i = 0; i < 5; i++) art(side, u, y, 1.34 - i * 0.26, 1.34 - i * 0.26, c[i], 1 + i);
          } else { // rising steps
            art(side, u, y, 1.34, 1.74, "#f4e2bc", 1);
            const c = ["#8a4a1f", "#d9641e", "#e9a23b", "#4f8a8b", "#6b7a3a"];
            for (let i = 0; i < 5; i++) solid(0.02, 0.3 + i * 0.25, 0.22, c[i], face(side, 2), y - 0.72 + (0.3 + i * 0.25) / 2, Z1 - u - side * (-0.5 + i * 0.25));
          }
        };
        [[18, 0], [31, 1], [44, 2], [63, 3]].forEach(([u, st]) => poster(-1, u, st));
        [[20, 2], [33, 0], [47, 3], [63, 1]].forEach(([u, st]) => poster(1, u, st));
        // Furniture.
        const rug = (x, u, w, d, colors) => { for (let i = 0; i < colors.length; i++) solid(w / colors.length, 0.02, d, colors[i], x - w / 2 + (i + 0.5) * w / colors.length, top + 0.015, Z1 - u); };
        const sofa = (x, u, facing, color, len) => {
          const z = Z1 - u;
          block(0.95, 0.42, len, color, x, top + 0.21, z);
          block(0.28, 0.5, len, color, x - facing * 0.34, top + 0.66, z);
          block(0.95, 0.3, 0.22, color, x, top + 0.57, z - len / 2 + 0.11); block(0.95, 0.3, 0.22, color, x, top + 0.57, z + len / 2 - 0.11);
          for (let c = 0; c < Math.round(len / 0.8); c++) solid(0.6, 0.08, len / Math.round(len / 0.8) - 0.06, color, x + facing * 0.08, top + 0.46, z - len / 2 + (c + 0.5) * len / Math.round(len / 0.8));
        };
        const coffeeTable = (x, u, bare = false) => {
          const z = Z1 - u;
          block(1.2, 0.34, 1.6, "#5a3a20", x, top + 0.17, z);
          solid(1.3, 0.04, 1.7, "#7a5232", x, top + 0.36, z);
          if (bare) return;
          solid(0.3, 0.02, 0.4, "#d9641e", x - 0.2, top + 0.39, z + 0.3); solid(0.28, 0.02, 0.38, "#4f8a8b", x - 0.18, top + 0.41, z + 0.32);
          solid(0.2, 0.18, 0.2, "#e8dcc0", x + 0.3, top + 0.47, z - 0.4); solid(0.12, 0.2, 0.12, "#4f6a3a", x + 0.3, top + 0.66, z - 0.4);
        };
        const arcLamp = (x, u, dir) => {
          const z = Z1 - u;
          block(0.4, 0.1, 0.4, "#c9c3b4", x, top + 0.05, z);
          solid(0.05, 2.0, 0.05, "#c9c3b4", x, top + 1.1, z);
          solid(1.2, 0.05, 0.05, "#c9c3b4", x + dir * 0.6, top + 2.1, z);
          solid(0.5, 0.26, 0.5, "#d9641e", x + dir * 1.2, top + 1.95, z);
          solid(0.36, 0.03, 0.36, "#ffd27a", x + dir * 1.2, top + 1.81, z, 1.3);
        };
        const plant = (x, u) => {
          const z = Z1 - u;
          block(0.42, 0.42, 0.42, "#c8692a", x, top + 0.21, z);
          const leaf = M.box({ w: 0.5, h: 0.08, d: 0.16, color: "#4f6a3a" });
          for (let i = 0; i < 6; i++) place(createNode({ geometry: leaf, position: { x, y: top + 0.55 + i * 0.12, z }, rotation: { x: 0, y: i * 1.05, z: 0.35 } }));
        };
        const globe = M.box({ w: 0.5, h: 0.5, d: 0.5, color: "#ffb347", emissive: 1.3 });
        const pendant = (x, u, drop) => {
          const z = Z1 - u, y = top + 7.95 - drop - 0.3;
          solid(0.03, drop, 0.03, "#222222", x, top + 7.95 - drop / 2, z);
          at(globe, x, y, z);
          place(createNode({ geometry: globe, position: { x, y, z }, rotation: { x: 0, y: Math.PI / 4, z: 0 } }));
        };
        const BINDER_INKS = ["#d9641e", "#e9a23b", "#4f8a8b", "#6b7a3a", "#8a4a1f"];
        const bookshelf = (side, u) => {
          const x = wallX(side) - side * 0.32, z = Z1 - u;
          block(0.42, 2.2, 2.4, "#6e4a2a", x, top + 1.1, z);
          for (let r = 0; r < 4; r++) {
            solid(0.44, 0.04, 2.4, "#4e321c", x, top + 0.4 + r * 0.5, z);
          }
          // The binders: one merged mesh a shelf (its spot is inside the shelf), the same 96 as before.
          detail(kit, x, top, z, (Mm) => { const list = []; for (let r = 0; r < 4; r++) for (let i = 0; i < 24; i++) list.push(B(Mm, 0.28, 0.36, 0.07, BINDER_INKS[(i * 3 + r) % 5], -side * 0.08, 0.62 + r * 0.5, -1.1 + i * 0.09 + (i > 11 ? 0.1 : 0))); return list; });
          // The binders' footprint as the layout knew it (each was its own piece), so merging them moves nothing.
          obstacle(x - side * 0.08 - 0.25, x - side * 0.08 + 0.25, z - 1.35, z + 1.32);
        };
        const office = (x, u, side) => {
          const z = Z1 - u;
          block(0.8, 0.74, 1.6, "#6b4a2b", x, top + 0.37, z);
          solid(0.84, 0.04, 1.64, "#8a6a44", x, top + 0.76, z);
          solid(0.22, 0.05, 0.3, "#d8cfb4", x, top + 0.8, z + 0.4); solid(0.16, 0.02, 0.06, "#ff4c4c", x, top + 0.83, z + 0.32, 1.2);
          solid(0.3, 0.06, 0.4, "#c9c3b4", x, top + 0.81, z - 0.4);
          block(0.5, 0.45, 0.5, "#d9641e", x + side * 0.75, top + 0.225, z); block(0.1, 0.5, 0.5, "#d9641e", x + side * 0.98, top + 0.7, z);
        };
        const filing = (x, u) => {
          const z = Z1 - u;
          block(0.6, 1.3, 0.5, "#7b8a3c", x, top + 0.65, z);
          for (let i = 0; i < 4; i++) solid(0.62, 0.02, 0.52, "#5a6630", x, top + 0.3 + i * 0.3, z);
        };
        // Left bank: a lounge between the key table and the signature desk, an office corner by the back wall.
        rug(-21, 54, 8, 4.4, ["#8a4a1f", "#d9641e", "#e9a23b", "#d9641e", "#8a4a1f"]);
        sofa(-25, 54, 1, "#c99a2e", 2.6); sofa(-16.9, 54, -1, "#a0462a", 1.0); coffeeTable(-21, 54);
        arcLamp(-26.2, 51.6, 1); plant(-26.2, 56.6);
        pendant(-21, 53, 2.2); pendant(-21, 55.4, 2.6);
        bookshelf(-1, 27); bookshelf(-1, 41.5);
        office(-29.5, 41.5, 1); filing(-31.6, 38.8); plant(-31.6, 44.3);
        // Right bank: a lounge between the coupler and the timeline, an office corner by the back wall.
        rug(27, 52, 8, 4.4, ["#4f6a3a", "#e9a23b", "#c8692a", "#e9a23b", "#4f6a3a"]);
        sofa(31.2, 52, -1, "#7b8a3c", 2.6); coffeeTable(27, 52, true);
        arcLamp(32.4, 49.6, -1); plant(33.2, 55.9);
        pendant(27, 51, 2.2); pendant(27, 53.4, 2.6);
        bookshelf(1, 23.5);
        office(36, 23.5, -1); filing(38.6, 20.8); plant(38.6, 26.2);
      }

      // --- At home in the 1970s (right bank's living room): a floor-standing TV, the Ooga paddle console on the coffee
      // table, and a pocket calculator on a side table by the sofa. Original, unbranded models; the calculator is
      // enlarged so its display reads from the rug. History on HOLD (see HOLD_NOTE).
      {
        const U = 52, zt = Z1 - U, tx = 22.6, sx = tx + 0.31;
        // The TV: a wood-veneer cabinet on legs, screen on the left, speaker grille and two knobs on the right, ears on top.
        for (const [lx, lz] of [[-0.22, -0.65], [0.22, -0.65], [-0.22, 0.65], [0.22, 0.65]]) solid(0.05, 0.25, 0.05, "#2a2018", tx + lx, top + 0.125, zt + lz);
        obstacle(tx - 0.33, tx + 0.33, zt - 0.8, zt + 0.8);
        solid(0.6, 0.85, 1.5, "#6b4a2b", tx, top + 0.675, zt);
        solid(0.02, 0.62, 0.86, "#2a2622", sx, top + 0.72, zt + 0.2);
        N.tvOff = solid(0.02, 0.5, 0.7, "#3a4038", sx + 0.008, top + 0.72, zt + 0.2);
        solid(0.02, 0.36, 0.42, "#c9a77a", sx, top + 0.6, zt - 0.47);
        for (let i = 0; i < 3; i++) solid(0.025, 0.015, 0.4, "#6b4a2b", sx + 0.004, top + 0.48 + i * 0.12, zt - 0.47);
        N.tvDial = place(createNode({ position: { x: sx + 0.02, y: top + 0.93, z: zt - 0.58 } }));
        addChild(N.tvDial, createNode({ geometry: M.box({ w: 0.04, h: 0.1, d: 0.1, color: "#d9cfb8" }) }), createNode({ geometry: M.box({ w: 0.05, h: 0.045, d: 0.012, color: "#2a2622" }), position: { x: 0.005, y: 0.025, z: 0 } }));
        N.tvFine = place(createNode({ geometry: M.box({ w: 0.04, h: 0.07, d: 0.07, color: "#d9cfb8" }), position: { x: sx + 0.02, y: top + 0.93, z: zt - 0.38 } }));
        N.tvLamp = at(lit("#ff4c4c"), sx + 0.01, top + 0.84, zt - 0.3, false);
        const rod = M.box({ w: 0.02, h: 0.7, d: 0.02, color: "#c9c3b4" });
        solid(0.16, 0.06, 0.16, "#2a2622", tx, top + 1.13, zt + 0.2);
        place(createNode({ geometry: rod, position: { x: tx, y: top + 1.45, z: zt + 0.05 }, rotation: { x: -0.45, y: 0, z: 0 } }));
        place(createNode({ geometry: rod, position: { x: tx, y: top + 1.45, z: zt + 0.35 }, rotation: { x: 0.45, y: 0, z: 0 } }));
        // What the screen shows (toggled in update): snow, the test card, the night sky, the fish tank, the console's court.
        const scr = (d, h, color, x, y, z, em = 0.9) => at(M.box({ w: 0.006, h, d, color, emissive: em }), x, y, z, false);
        const sy = top + 0.72, sz = zt + 0.2, l1 = sx + 0.015, l2 = sx + 0.02;
        N.snowBg = scr(0.7, 0.5, "#8a8f8a", l1, sy, sz, 0.6);
        const speck = M.box({ w: 0.006, h: 0.03, d: 0.05, color: "#f4f4ee", emissive: 1.1 });
        N.specks = [];
        for (let i = 0; i < 8; i++) N.specks.push(at(speck, l2, sy, sz, false));
        const bars = ["#f4f1e6", "#f2e14e", "#46d2d2", "#58c05a", "#c84fbf", "#d94a3a"];
        N.card = bars.map((c, i) => scr(0.7 / 6, 0.5, c, l1, sy, sz + 0.35 - (i + 0.5) * 0.7 / 6));
        N.sky = [scr(0.7, 0.5, "#1a2350", l1, sy, sz, 0.5)];
        const star = M.box({ w: 0.006, h: 0.025, d: 0.025, color: "#fff2b0", emissive: 1.4 });
        for (const [dz, dy] of [[0.25, 0.15], [0.05, 0.1], [-0.2, 0.17], [0.15, -0.05], [-0.1, -0.12]]) N.sky.push(at(star, l2, sy + dy, sz + dz, false));
        N.fish = [scr(0.7, 0.5, "#2a8a8f", l1, sy, sz, 0.6), scr(0.12, 0.06, "#ff8a2a", l2, sy + 0.08, sz + 0.1, 1.1), scr(0.1, 0.05, "#f2e14e", l2, sy - 0.1, sz - 0.15, 1.1)];
        N.court = [scr(0.7, 0.5, "#1e3a26", l1, sy, sz, 0.5), scr(0.008, 0.46, "#cfe8c8", l2, sy, sz, 1)];
        N.youPad = scr(0.012, 0.16, "#f4f1e6", l2 + 0.001, sy, sz + 0.32, 1.2);
        N.oogaPad = scr(0.012, 0.16, "#f4f1e6", l2 + 0.001, sy, sz - 0.32, 1.2);
        N.ball = scr(0.03, 0.03, "#f4f1e6", l2 + 0.002, sy, sz, 1.3);
        N.screen = { sy, sz, half: 0.32, rowH: 0.42 / (PH - 1) };
        station({ id: "e1-tv", hint: "Type POWER, then UP or DOWN to find the console", year: "1970s", date: "a toy tuner; the period, the set and its connection are on HOLD (not yet verified)", title: "Home TV: tune a channel", label: "HOME TV · 1970s TOY", sourceKeys: ["e1HoldNotes"], x: 24.4, z: zt, on: { w: 0.8, h: 1.5, d: 1.7, x: tx, z: zt }, onUse: () => ({ terminal: S.tvTerm }) });

        // The Ooga console on the bare coffee table: a cream case with a walnut front and orange stripe, a selector
        // switch, two paddle controllers with big orange knobs on coiled leads, and its cable across the rug to the TV.
        const cx = 27, cz = Z1 - 52.0, ty = top + 0.38;
        solid(0.56, 0.09, 0.38, "#e8dcc0", cx, ty + 0.045, cz);
        solid(0.57, 0.05, 0.02, "#6b4a2b", cx, ty + 0.045, cz + 0.2);
        solid(0.57, 0.012, 0.39, "#d9822b", cx, ty + 0.085, cz);
        solid(0.08, 0.03, 0.04, "#2a2622", cx + 0.18, ty + 0.105, cz - 0.08);
        N.switchZ = cz - 0.08; N.switchKnob = solid(0.03, 0.02, 0.03, "#f4f1e6", cx + 0.16, ty + 0.125, cz - 0.08);
        const knob = M.box({ w: 0.07, h: 0.04, d: 0.07, color: "#d9641e" });
        N.knobs = [];
        for (const dx of [-0.2, 0.2]) {
          solid(0.11, 0.05, 0.15, "#e8dcc0", cx + dx, ty + 0.025, cz + 0.42);
          for (const base of [0, Math.PI / 4]) { const kn = place(createNode({ geometry: knob, position: { x: cx + dx, y: ty + 0.07, z: cz + 0.44 }, rotation: { x: 0, y: base, z: 0 } })); kn.baseY = base; N.knobs.push(kn); }
          solid(0.012, 0.012, 0.24, "#2a2622", cx + dx * 0.6, ty + 0.012, cz + 0.27);
        }
        solid(cx - 0.3 - (sx - 0.3), 0.012, 0.02, "#2a2622", (cx - 0.3 + sx - 0.3) / 2, top + 0.032, cz);
        station({ id: "e1-paddle", hint: "Type S to serve, then U and D to move", year: "1970s", date: "a modern museum homage on an original console; the historical reference is on HOLD (not yet verified)", title: "Ooga Paddle: play the console", label: "PADDLE CONSOLE · 1970s HOMAGE", sourceKeys: ["e1HoldNotes"], x: cx, z: Z1 - 49.9, on: { w: 1.4, h: 0.9, d: 1.6, x: cx, z: cz + 0.15 }, onUse: () => ({ terminal: S.paddleTerm }) });

        // The pocket calculator, enlarged about six times, upright on a stand on a side table, facing the rug: a
        // brown case, a dark window with eight red seven-segment places, and sixteen keys.
        const kx = 31.6, kz = Z1 - 54.9, fx = kx - 0.038, ky = top + 0.5;
        block(0.6, 0.5, 0.6, "#5a3a20", kx, top + 0.25, kz);
        solid(0.12, 0.06, 0.4, "#2a2622", kx + 0.04, ky + 0.03, kz);
        solid(0.05, 0.86, 0.52, "#5a3a20", kx, ky + 0.49, kz);
        solid(0.01, 0.14, 0.46, "#1a1414", fx, ky + 0.8, kz);
        const segH = M.box({ w: 0.006, h: 0.008, d: 0.03, color: "#ff3a2a", emissive: 1.6 }), segV = M.box({ w: 0.006, h: 0.032, d: 0.008, color: "#ff3a2a", emissive: 1.6 }), dot = M.box({ w: 0.006, h: 0.01, d: 0.01, color: "#ff3a2a", emissive: 1.6 });
        // Seen from the rug (facing +x), right is +z: places run left to right with z, and b and c are on the +z side.
        const SEG_AT = { a: [0, 0.04, segH], b: [0.02, 0.02, segV], c: [0.02, -0.02, segV], d: [0, -0.04, segH], e: [-0.02, -0.02, segV], f: [-0.02, 0.02, segV], g: [0, 0, segH] };
        N.segs = []; N.dots = [];
        for (let i = 0; i < CALC_PLACES; i++) {
          const dz = kz - 0.21 + i * 0.06, row = [];
          for (const k of SEG_ORDER) { const [hz, vy, geo] = SEG_AT[k]; row.push(at(geo, fx - 0.006, ky + 0.8 + vy, dz + hz, false)); }
          N.segs.push(row);
          N.dots.push(at(dot, fx - 0.006, ky + 0.755, dz + 0.028, false));
        }
        const key = M.box({ w: 0.012, h: 0.07, d: 0.09, color: "#e8dcc0" }), keyC = M.box({ w: 0.012, h: 0.07, d: 0.09, color: "#d9641e" });
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) at(r === 0 && c === 0 ? keyC : key, fx - 0.004, ky + 0.6 - r * 0.11, kz - 0.17 + c * 0.113);
        S.cells = new Array(CALC_PLACES).fill(" "); S.dots = new Uint8Array(CALC_PLACES);
        station({ id: "e1-calc", hint: "Type 12+30= then try 2/3=", year: "1970s", date: "a toy with an 8-place display; real models' dates and specifications are on HOLD (not yet verified)", title: "Pocket calculator: try a sum", label: "POCKET CALCULATOR · 1970s TOY", sourceKeys: ["e1HoldNotes"], x: 30.0, z: kz, on: { w: 0.8, h: 1.5, d: 0.8, x: kx, z: kz }, onUse: () => ({ terminal: S.calcTerm }) });
        sign("AT HOME · 1970s", "museum toys: a TV, a paddle console and a calculator · their history is on HOLD", 27, top + 2.7, Z1 - 49.0, 0, 0.42);
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
        station({ id: "e1-timeline", hint: "Read what each date marks", year: 1970, date: "the decade 1970 to 1979, each plaque with what its date marks", on: { w: 11, h: 2.8, d: 0.6, x, z: zc }, title: "Timeline of the decade", label: "TIMELINE · 1970–1979", sourceKeys: PANELS.timeline.sources, x, z: zc + 1.6, onUse: board("timeline") });
      }

      // --- Finer parts for every exhibit, then the relay cabinet (appended, so earlier pieces keep their order) ------
      buildDetails(kit);
      buildRelay(kit, N);

    },

    // Every frame in this gallery: move what the toys changed, eased and in order, allocating nothing. Nothing runs
    // while every model is settled: only a command (`wake`), something still moving (`busy`) or Calm changing brings
    // the models up to date. Calm shows each result in its final state at once; the scene's pause and its bench, menu
    // and console holds stop calling update, so every motion (all stepped by dt) freezes with them.
    update(dt, elapsed, state) {
      if (!S) return;
      const calm = !!(state && state.calm);
      if (!S.wake && !S.busy && calm === S.wasCalm) return;
      S.wake = false; S.wasCalm = calm;
      S.busy = step(dt, elapsed, calm);
    },

    // Leaving the gallery: the coupler falls silent, and every motion stops in its final state (so coming back resumes
    // nothing). The context stays for the visit; `dispose` closes it.
    active(on) {
      if (on || !S) return;
      const c = S.coupler, gw = S.gw, dh = S.dh, rsa = S.rsa, pd = S.paddle;
      c.playing = false; c.t = 0;
      hush();
      gw.anim = -1; gw.flash = 0; dh.anim = -1; rsa.stamp = 0; rsa.check = 0;
      if (pd.pathN > 0) pd.pathT = pd.pathN - 1;
      step(0, 0, true);
      S.busy = false;
    },

    // For checks only (test/genesis-era-1-upgrade2.mjs): the visit's state and nodes, read, never written.
    inspect: () => S,

    dispose() {
      closeAudio();
      S = null;
    }
  });
})();
