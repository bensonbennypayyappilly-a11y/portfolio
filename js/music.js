/* ==========================================================================
   An ambient score for the story, played live in the browser (no audio files).
   Soft pad chords follow the chapters; a few plucked notes wander over them.
   ========================================================================== */
(() => {
  'use strict';

  const btn = document.querySelector('.music-btn');
  const story = document.querySelector('.story');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn || !story) return;
  if (!AC) { btn.hidden = true; return; }
  const label = btn.querySelector('.music-label');

  // One chord per chapter, all around D major so the changes feel gentle.
  const CHORDS = [
    [38, 50, 57, 64, 66, 69], // Dmaj9
    [40, 52, 55, 59, 62, 66], // Em9
    [43, 55, 59, 62, 66, 69], // Gmaj9
    [35, 47, 54, 59, 62, 66], // Bm(add11)
    [45, 52, 57, 59, 64, 69], // Asus2
    [42, 54, 57, 61, 64, 69], // F#m7
    [43, 50, 59, 62, 66, 71], // Gmaj7
  ];
  const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83]; // D major pentatonic
  const LEVEL = 0.75;
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let ctx, master, verb, echo, pads;
  let voices = [], sounding = -1, chapter = 0;
  let on = false, inView = true, timer = 0, nextNote = 0, step = 3;

  function build() {
    ctx = new AC();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.connect(ctx.destination);
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(limiter);

    // A soft room: a short burst of decaying noise used as a reverb impulse.
    const len = Math.floor(ctx.sampleRate * 3.8);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb = ctx.createConvolver();
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    verb.connect(wet).connect(master);

    // A warm echo for the plucked notes.
    echo = ctx.createDelay(1.5);
    echo.delayTime.value = 0.46;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.34;
    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 2400;
    echo.connect(warmth).connect(feedback).connect(echo);
    warmth.connect(master);
    warmth.connect(verb);

    // Pads go through a slowly breathing low-pass filter.
    pads = ctx.createBiquadFilter();
    pads.type = 'lowpass';
    pads.frequency.value = 1000;
    const breath = ctx.createOscillator();
    const depth = ctx.createGain();
    breath.frequency.value = 0.07;
    depth.gain.value = 380;
    breath.connect(depth).connect(pads.frequency);
    breath.start();
    pads.connect(master);
    pads.connect(verb);
  }

  function playChord(i) {
    if (i === sounding) return;
    sounding = i;
    const now = ctx.currentTime;
    voices.forEach(({ gain, oscs }) => {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 3.5);
      oscs.forEach((o) => o.stop(now + 3.6));
    });
    voices = CHORDS[i % CHORDS.length].map((midi, k) => {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(k === 0 ? 0.07 : 0.045, now + 3.2);
      const oscs = [-5, 5].map((cents, j) => {
        const o = ctx.createOscillator();
        o.type = j ? 'triangle' : 'sine';
        o.frequency.value = hz(midi);
        o.detune.value = cents;
        o.connect(gain);
        o.start(now);
        return o;
      });
      if (ctx.createStereoPanner) {
        const pan = ctx.createStereoPanner();
        pan.pan.value = (k % 2 ? 1 : -1) * 0.25;
        gain.connect(pan).connect(pads);
      } else {
        gain.connect(pads);
      }
      return { gain, oscs };
    });
  }

  function pluck(time) {
    step = Math.max(0, Math.min(SCALE.length - 1, step + pick([-2, -1, 0, 1, 2])));
    const f = hz(SCALE[step]);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.11, time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0008, time + 2.4);
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.value = f;
    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = f * 2;
    const shimmerLevel = ctx.createGain();
    shimmerLevel.gain.value = 0.22;
    body.connect(env);
    shimmer.connect(shimmerLevel).connect(env);
    let out = env;
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.random() * 0.8 - 0.4;
      out = env.connect(pan);
    }
    out.connect(master);
    out.connect(echo);
    out.connect(verb);
    [body, shimmer].forEach((o) => { o.start(time); o.stop(time + 2.6); });
  }

  function schedule() {
    while (nextNote < ctx.currentTime + 0.3) {
      if (inView && Math.random() > 0.22) pluck(nextNote);
      nextNote += pick([0.45, 0.9, 0.9, 1.35, 1.8]);
    }
  }

  function fadeTo(value, seconds) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + seconds);
  }

  async function start() {
    if (!ctx) build();
    await ctx.resume();
    playChord(chapter);
    nextNote = ctx.currentTime + 0.4;
    clearInterval(timer);
    timer = setInterval(schedule, 100);
    fadeTo(inView ? LEVEL : 0, 2.5);
  }

  function stop() {
    if (!ctx) return;
    clearInterval(timer);
    fadeTo(0, 1.2);
    setTimeout(() => { if (!on) ctx.suspend(); }, 1400);
  }

  function toggle() {
    on = !on;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    label.textContent = on ? 'Music on' : 'Play music';
    if (on) start(); else stop();
  }

  btn.addEventListener('click', toggle);
  window.addEventListener('togglemusic', toggle);
  window.addEventListener('storychapter', (e) => {
    chapter = e.detail;
    if (ctx && on) playChord(chapter);
  });
  // Fade out once the story scrolls away, and back in when it returns.
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (ctx && on) fadeTo(inView ? LEVEL : 0, 1.8);
  }, { threshold: 0.05 }).observe(story);
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !on) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });
})();
