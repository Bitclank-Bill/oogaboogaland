// Era 0's cave in the Genesis Voyage, Machines That Count (1956–1969): the reference example for the era files (see
// genesis-exhibits.js for the kit and the rules). Facts from docs/genesis-voyage/eras/era-0-machines-that-count.md
// (branch gv/research): Feller's probability shelf (whitepaper citation [8], the cited 1957 edition) and ARPANET's
// interrupted first login (context, 29 October 1969). The IBM 350 plinth still stands in Era 3's cave
// (genesis-props.js) until it moves here.
(() => {
  "use strict";
  const sources = {
    e0Feller: { label: "Satoshi Nakamoto Institute library: Feller, An Introduction to Probability Theory and Its Applications, Vol. I",
      href: "https://nakamotoinstitute.org/library/introduction-probability-theory-vol-i/", kind: "whitepaper citation [8]", verified: true },
    e0Arpanet: { label: "Leonard Kleinrock (UCLA): the first words sent over the ARPANET, 29 October 1969",
      href: "https://www.lk.cs.ucla.edu/internet_first_words.html", kind: "context", verified: true }
  };
  window.BL.genesisExhibits.register(0, {
    sources,
    build(kit) {
      const { era, top, solid, sign, obstacle, prop } = kit;
      // Feller's shelf on the left bank: a tall bookcase of probability, the cited volume lit.
      const fx = -9, fz = era.z1 - 22;
      solid(3.2, 2.6, 0.7, "#5c3d24", fx, top + 1.3, fz);
      const inks = ["#7a2f2a", "#2f4f7a", "#3d6b3a", "#7a6a2f", "#5a2f6b"];
      for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
        const cited = row === 1 && i === 4;
        solid(0.26, 0.6, 0.5, cited ? "#f2c14e" : inks[(i + row) % inks.length], fx - 1.3 + i * 0.32, top + 0.55 + row * 0.8, fz + 0.1, cited ? 0.6 : 0);
      }
      obstacle(fx - 1.7, fx + 1.7, fz - 0.5, fz + 0.5);
      sign("FELLER'S PROBABILITY · 1957", "the edition Bitcoin's paper cites [8]", fx, top + 3.3, fz + 0.4, 0, 0.5);
      prop({ id: "e0-feller", year: 1957, title: "Feller's probability shelf", label: "FELLER · 1957", sourceKeys: ["e0Feller", "whitepaper"],
        at: { x: fx, y: top, z: fz + 1.2 }, reach: 1.8, pick: { w: 3.2, h: 2.6, d: 1 },
        onUse: () => ({ board: { room: "Feller probability shelf - 1957", sources: ["e0Feller", "whitepaper"], pages: [
          { caption: "In short", title: "Odds you can reason about", text: [
            "Probability gave people ways to reason about races with uncertain outcomes.",
            "1957 is the edition year of William Feller's book that the Bitcoin whitepaper lists as reference [8]. It is not the year probability was invented."] },
          { caption: "The connection", title: "The gambler's ruin", text: [
            "Section 11 of the whitepaper compares an attacker trying to catch up with the honest chain to a random walk, the Gambler's Ruin problem, and cites Feller.",
            "This is mathematics, not a payment system: it says nothing yet about how to stop a digital coin being spent twice."] }
        ] } }) });
      // ARPANET's two terminals on the right bank, a cable between them.
      const ax = 16, az = era.z - 6;
      for (const [x, name] of [[ax, "UCLA"], [ax + 8, "SRI"]]) {
        solid(1.2, 0.8, 0.8, "#cfc6aa", x, top + 0.4, az);
        solid(1, 0.8, 0.7, "#d8cfb4", x, top + 1.2, az);
        solid(0.8, 0.5, 0.04, "#38ff7a", x, top + 1.25, az + 0.37, 1.1);
        sign(name, "illustration, not the original machines", x, top + 2.4, az + 0.4, 0, 0.4);
        obstacle(x - 0.7, x + 0.7, az - 0.5, az + 0.5);
      }
      solid(7, 0.08, 0.08, "#2a2a2a", ax + 4, top + 0.05, az - 0.2);
      sign("ARPANET · 29 OCTOBER 1969", "the first host-to-host message, UCLA to SRI", ax + 4, top + 3.2, az + 0.4, 0, 0.5);
      prop({ id: "e0-arpanet", year: 1969, title: "ARPANET's interrupted login", label: "ARPANET · 1969", sourceKeys: ["e0Arpanet"],
        at: { x: ax + 4, y: top, z: az + 1.3 }, reach: 2.2, pick: { w: 9, h: 2, d: 1 },
        onUse: () => ({ board: { room: "ARPANET - 29 October 1969", sources: ["e0Arpanet"], pages: [
          { caption: "In short", title: "Two letters arrive", text: [
            "On 29 October 1969 a computer at UCLA sent the first host-to-host message over the ARPANET to one at SRI.",
            "The attempted login got as far as its first two letters before the system crashed; a later try worked."] },
          { caption: "Still unsolved", title: "A network is not money", text: [
            "Moving a message between computers does not show who owns something, or stop a digital token being spent twice.",
            "This is context for the voyage: the ARPANET is not in the Bitcoin whitepaper's references."] }
        ] } }) });
    }
  });
})();
