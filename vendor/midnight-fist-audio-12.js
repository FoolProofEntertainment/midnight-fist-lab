(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let voiceGain = null;
  let unlocked = false;
  let mode = "off";
  let musicTimer = null;
  let musicStep = 0;
  let fightTimer = null;
  let fightStep = 0;

  const MENU_MELODY = [0, 3, 5, 7, 5, 3, 0, -2];
  const FIGHT_MELODY = [0, 0, 3, 5, 7, 5, 3, 0, -2, 0, 5, 7];

  function ensure() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.42;
    sfxGain.connect(master);
    voiceGain = ctx.createGain();
    voiceGain.gain.value = 0.72;
    voiceGain.connect(master);
    return ctx;
  }

  function unlock() {
    const audio = ensure();
    if (!audio || unlocked) return;
    unlocked = true;
    if (audio.state === "suspended") audio.resume().catch(() => {});
  }

  function noteFreq(semi, base = 220) {
    return base * Math.pow(2, semi / 12);
  }

  function playTone({ freq, duration = 0.12, type = "square", gain = 0.08, attack = 0.01, release = 0.08, destination }) {
    const audio = ensure();
    if (!audio || !unlocked) return;
    const dest = destination || sfxGain;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    const now = audio.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);
    osc.connect(amp);
    amp.connect(dest);
    osc.start(now);
    osc.stop(now + duration + release + 0.02);
  }

  function playNoise({ duration = 0.2, gain = 0.12, filterFreq = 900, destination }) {
    const audio = ensure();
    if (!audio || !unlocked) return;
    const dest = destination || sfxGain;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = audio.createBufferSource();
    src.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const amp = audio.createGain();
    const now = audio.currentTime;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(dest);
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  function stopMusicLoops() {
    if (musicTimer) window.clearInterval(musicTimer);
    if (fightTimer) window.clearInterval(fightTimer);
    musicTimer = null;
    fightTimer = null;
  }

  function startMenuLoop() {
    stopMusicLoops();
    const audio = ensure();
    if (!audio || !unlocked) return;
    musicStep = 0;
    musicTimer = window.setInterval(() => {
      if (mode !== "menu") return;
      const semi = MENU_MELODY[musicStep % MENU_MELODY.length];
      playTone({
        freq: noteFreq(semi, 196),
        duration: 0.22,
        type: "triangle",
        gain: 0.05,
        destination: musicGain,
      });
      if (musicStep % 2 === 0) {
        playTone({
          freq: noteFreq(semi - 12, 98),
          duration: 0.28,
          type: "sine",
          gain: 0.03,
          destination: musicGain,
        });
      }
      musicStep += 1;
    }, 420);
  }

  function startFightLoop() {
    stopMusicLoops();
    const audio = ensure();
    if (!audio || !unlocked) return;
    fightStep = 0;
    fightTimer = window.setInterval(() => {
      if (mode !== "fight") return;
      const semi = FIGHT_MELODY[fightStep % FIGHT_MELODY.length];
      playTone({
        freq: noteFreq(semi, 220),
        duration: 0.1,
        type: "sawtooth",
        gain: 0.045,
        destination: musicGain,
      });
      playTone({
        freq: noteFreq(semi - 7, 110),
        duration: 0.12,
        type: "square",
        gain: 0.028,
        destination: musicGain,
      });
      if (fightStep % 4 === 0) {
        playNoise({ duration: 0.05, gain: 0.02, filterFreq: 1800, destination: musicGain });
      }
      fightStep += 1;
    }, 180);
  }

  function setMode(next) {
    mode = next;
    if (!unlocked) return;
    if (mode === "menu") startMenuLoop();
    else if (mode === "fight") startFightLoop();
    else stopMusicLoops();
  }

  function playClick() {
    unlock();
    playTone({ freq: 880, duration: 0.03, type: "square", gain: 0.05 });
    playTone({ freq: 1320, duration: 0.02, type: "triangle", gain: 0.03 });
  }

  function playTankRoll() {
    unlock();
    playNoise({ duration: 0.55, gain: 0.1, filterFreq: 240 });
    playTone({ freq: 62, duration: 0.5, type: "sawtooth", gain: 0.06 });
  }

  function playTankFire() {
    unlock();
    playNoise({ duration: 0.18, gain: 0.2, filterFreq: 420 });
    playTone({ freq: 120, duration: 0.08, type: "square", gain: 0.14 });
    playTone({ freq: 70, duration: 0.2, type: "sawtooth", gain: 0.1 });
  }

  function playExplosion() {
    unlock();
    playNoise({ duration: 0.65, gain: 0.28, filterFreq: 180 });
    playTone({ freq: 48, duration: 0.4, type: "sawtooth", gain: 0.16 });
    playTone({ freq: 92, duration: 0.25, type: "square", gain: 0.08 });
  }

  function announceWin(playerName) {
    unlock();
    const name = String(playerName || "Fighter").trim() || "Fighter";
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((voice) => /natural|neural|premium|enhanced/i.test(voice.name) && /^en[-_]/i.test(voice.lang)) ||
      voices.find((voice) => /david|mark|guy|daniel|george|ryan|male/i.test(`${voice.name} ${voice.lang}`)) ||
      voices.find((voice) => /^en[-_]/i.test(voice.lang));
    const makeLine = (text, rate, pitch) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      if (preferred) utterance.voice = preferred;
      return utterance;
    };
    const winnerLine = makeLine(`${name} wins!`, 0.86, 0.62);
    const riftalityLine = makeLine("Riftality.", 0.78, 0.56);
    winnerLine.onend = () => {
      window.setTimeout(() => window.speechSynthesis.speak(riftalityLine), 560);
    };
    window.speechSynthesis.speak(winnerLine);
  }

  function bindUnlock() {
    const unlockOnce = () => {
      unlock();
      if (mode === "off") setMode("menu");
      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
    };
    window.addEventListener("pointerdown", unlockOnce, { once: true });
    window.addEventListener("keydown", unlockOnce, { once: true });
  }

  window.MidnightFistAudio = {
    unlock,
    setMode,
    playClick,
    playTankRoll,
    playTankFire,
    playExplosion,
    announceWin,
  };

  bindUnlock();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
    window.speechSynthesis.getVoices();
  }
})();
