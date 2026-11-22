// Bow & Bone's cabinet menu and controls. The host discovers this section before its director boots.
(() => {
  "use strict";
  const BL = window.BL;
  const section = document.createElement("div");
  section.id = "archery"; section.className = "race archery"; section.dataset.scene = "archery"; section.hidden = true;
  section.innerHTML = '<section class="race-results game-intro" id="archery-menu" aria-label="Bow and Bone"><h2 class="game-intro-title">Bow &amp; Bone</h2><p class="game-intro-goal" id="archery-message"></p><label id="archery-mode-label">Round <select id="archery-mode"><option value="range">Target range</option><option value="duel">Two-player duel</option><option value="defense">Legion defence</option></select></label><p class="help">Up / Down or W / S to aim. Hold Space or J to draw, then release to shoot. Use the aim and draw buttons on a phone.</p><div class="actions"><button type="button" class="game-intro-go" id="archery-start">Play</button><button type="button" id="archery-menu-exit">Return to arcade</button></div></section><div class="race-hud race-hud-left" id="archery-readout"></div><div class="race-hud race-hud-right" id="archery-controls"><button type="button" id="archery-up" aria-label="Aim higher">Aim up</button><button type="button" id="archery-down" aria-label="Aim lower">Aim down</button><button type="button" id="archery-draw">Hold to draw</button><button type="button" id="archery-pause">Pause</button><button type="button" id="archery-exit">Return</button></div>';
  document.getElementById("stage").append(section);
  const $ = id => document.getElementById(id);
  const create = ({ sim, signal, focus, start, resume, pause, exit, aim, draw, cancel }) => {
    const menu = $("archery-menu"), mode = $("archery-mode"), modeLabel = $("archery-mode-label"), message = $("archery-message");
    const play = $("archery-start"), readout = $("archery-readout"), controls = $("archery-controls");
    let last = "";
    const click = (id, action) => $(id).addEventListener("click", action, { signal });
    click("archery-start", () => { if (sim.status === "playing") resume(); else start(mode.value); focus(); });
    click("archery-menu-exit", exit); click("archery-exit", exit); click("archery-pause", () => { pause(); focus(); });
    const press = (id, down, up, abandon) => {
      const button = $(id); let pointer = null;
      button.addEventListener("pointerdown", e => { if (pointer !== null || e.button !== 0) return; e.preventDefault(); pointer = e.pointerId; button.setPointerCapture(pointer); focus(); down(); }, { signal });
      button.addEventListener("pointerup", e => { if (e.pointerId !== pointer) return; pointer = null; up(); focus(); }, { signal });
      const release = () => { if (pointer !== null) { pointer = null; abandon(); } };
      button.addEventListener("pointercancel", release, { signal }); button.addEventListener("lostpointercapture", release, { signal });
      button.addEventListener("keydown", e => { if (e.key !== "Enter" && e.key !== " ") return; e.preventDefault(); if (!e.repeat) down(); }, { signal });
      button.addEventListener("keyup", e => { if (e.key !== "Enter" && e.key !== " ") return; e.preventDefault(); up(); }, { signal });
      button.addEventListener("click", e => { if (e.detail === 0) { down(); up(); } }, { signal });
    };
    press("archery-up", () => aim(-1, true), () => aim(-1, false), () => aim(-1, false));
    press("archery-down", () => aim(1, true), () => aim(1, false), () => aim(1, false));
    press("archery-draw", () => draw(true), () => draw(false), cancel);
    const render = paused => {
      const playing = sim.status === "playing", ready = sim.status === "ready";
      menu.hidden = playing && !paused; readout.hidden = controls.hidden = !playing || paused; modeLabel.hidden = playing;
      const text = sim.mode === "duel" ? "Archer " + (sim.turn + 1) + " · " + sim.players[0].score + " : " + sim.players[1].score : "Score " + sim.score;
      const shown = text + " · Arrows " + sim.arrowsLeft + (sim.mode === "defense" ? " · Hearts " + sim.hearts + " · Wave " + sim.wave : "") + " · Aim " + Math.round(-sim.aim * 180 / Math.PI) + "° · Draw " + Math.round(sim.power * 100) + "%";
      if (shown !== last) { readout.textContent = shown; last = shown; }
      if (!menu.hidden) {
        play.textContent = paused ? "Resume" : ready ? "Play" : "Play again";
        message.textContent = paused ? "Paused" : ready ? "Choose a round, then press Play or Enter." : sim.mode === "duel" ? (sim.players[0].score === sim.players[1].score ? "A draw" : "Archer " + (sim.players[0].score > sim.players[1].score ? 1 : 2) + " wins") + " · " + text : (sim.status === "over" ? "The line is lost" : "Round complete") + " · " + text;
      }
    };
    section.hidden = false;
    return { render, mode: () => mode.value, dispose() { section.hidden = true; menu.hidden = readout.hidden = controls.hidden = true; } };
  };
  BL.archeryHud = { create };
})();
