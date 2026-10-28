/* ==========================================================================
   The story: a camera glides along one long line while a pen draws ahead of it
   ========================================================================== */
(() => {
  'use strict';

  const story = document.querySelector('.story');
  if (!story) return;
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mqReduce.matches;

  const stage = story.querySelector('.stage');
  const svg = story.querySelector('.story-svg');
  const baseline = svg.querySelector('.baseline');
  const pens = $$('.pen, .pen-halo', svg);
  const me = svg.querySelector('#me');
  const chapters = $$('.chapter', story);
  const ticks = $$('.tick', story);
  const num = story.querySelector('.ch-num');
  const name = story.querySelector('.ch-name');
  const keepGoing = story.querySelector('.keep-going');
  const keepLabel = keepGoing.querySelector('span');
  const nav = document.querySelector('.nav');

  const N = chapters.length;
  const SCENE_W = 1400; // world units between chapters
  const CENTER = 760;   // where each scene sits in its own stretch of the world
  const TOP = 120, VIEW_H = 440, GROUND = 470, LINE_START = -2000;
  const FIRST = CENTER, LAST = (N - 1) * SCENE_W + CENTER;
  story.style.setProperty('--chapters', N);

  // Every drawing is revealed as the pen passes over its stretch of the world.
  const strokes = $$('.scene', svg).flatMap((g) => {
    const offset = Number(g.dataset.offset);
    return $$('.draw', g).map((p) => {
      const len = p.getTotalLength();
      const box = p.getBBox();
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = String(len);
      return { p, len, x0: offset + box.x, span: Math.max(150, box.width), shown: -1 };
    });
  });
  const baseLen = baseline.getTotalLength();
  baseline.style.strokeDasharray = `${baseLen} ${baseLen}`;

  let viewW = 1440;
  const measure = () => {
    const r = svg.getBoundingClientRect();
    if (r.height > 0) viewW = (r.width * VIEW_H) / r.height;
  };

  let colors = [];
  const toRgb = (hex) => {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const readColors = () => {
    const cs = getComputedStyle(story);
    colors = chapters.map((_, i) => toRgb(cs.getPropertyValue(`--sc${i}`).trim() || '#000'));
  };

  const scrollProgress = () => {
    const span = story.offsetHeight - window.innerHeight;
    return span > 0 ? clamp(-story.getBoundingClientRect().top / span, 0, 1) : 0;
  };

  // The film opens with the pen drawing in from the left edge.
  let introPen = reduced() ? Infinity : null;
  const introStart = performance.now() + 250;

  let progress = scrollProgress();
  let lastCam = null, lastTime = performance.now(), stillSince = 0, facingLeft = false;
  let shownChapter = -1, pose = '';

  function setPose(next) {
    if (next === pose) return;
    pose = next;
    $$('.arms', me).forEach((a) => a.classList.toggle('on', a.dataset.arms === next));
  }

  function showChapter(i) {
    shownChapter = i;
    num.textContent = String(i).padStart(2, '0');
    name.textContent = chapters[i].dataset.name;
    ticks.forEach((t, k) => t.setAttribute('aria-current', k === i ? 'step' : 'false'));
    keepLabel.textContent = i === N - 1 ? 'See the work' : 'Keep going';
    chapters.forEach((c, k) => $$('a', c).forEach((a) => { a.tabIndex = k === i ? 0 : -1; }));
  }

  function render(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const target = scrollProgress();
    // Ease towards the scroll position so wheel steps become one continuous glide.
    progress = reduced() ? target : progress + (target - progress) * (1 - Math.exp(-dt * 6));
    if (Math.abs(target - progress) < 1e-5) progress = target;

    const cam = FIRST + progress * (LAST - FIRST);
    let pen = cam + viewW * 0.36;
    if (introPen !== Infinity) {
      const k = smooth(0, 1, (now - introStart) / 2600);
      introPen = cam - viewW / 2 - 40 + k * (pen - (cam - viewW / 2 - 40));
      pen = introPen;
      if (k >= 1) introPen = Infinity;
    }
    if (reduced()) pen = LAST + SCENE_W * 2;

    svg.setAttribute('viewBox', `${(cam - viewW / 2).toFixed(2)} ${TOP} ${viewW.toFixed(2)} ${VIEW_H}`);
    baseline.style.strokeDashoffset = String(Math.max(0, baseLen - (pen - LINE_START)));
    pens.forEach((c) => c.setAttribute('cx', pen.toFixed(1)));
    strokes.forEach((s) => {
      const f = Math.round(clamp((pen - s.x0) / s.span, 0, 1) * 1000) / 1000;
      if (f !== s.shown) { s.p.style.strokeDashoffset = String(s.len * (1 - f)); s.shown = f; }
    });

    // The little me walks just left of centre, matching the camera's pace.
    const v = lastCam === null ? 0 : cam - lastCam;
    lastCam = cam;
    if (Math.abs(v) > 0.35) { stillSince = now; facingLeft = v < 0; }
    const walking = !reduced() && now - stillSince < 160;
    me.style.transform = `translate(${(cam - Math.max(viewW * 0.3, 190)).toFixed(2)}px, ${GROUND}px)`;
    me.classList.toggle('walking', walking);
    me.classList.toggle('face-left', walking && facingLeft);

    // Chapters fade and drift with the scroll; the nearest one owns the pose.
    const pos = progress * (N - 1);
    const nearest = Math.round(pos);
    chapters.forEach((c, i) => {
      const d = pos - i;
      const o = 1 - smooth(0.14, 0.48, Math.abs(d));
      c.style.opacity = o.toFixed(3);
      c.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      c.style.setProperty('--d', d.toFixed(4));
      c.classList.toggle('is-active', i === nearest && o > 0.5);
    });
    setPose(!walking && Math.abs(pos - nearest) < 0.3 ? chapters[nearest].dataset.pose : 'walk');
    if (nearest !== shownChapter) showChapter(nearest);

    // Background colour blends between chapters as the camera travels.
    const i0 = Math.min(N - 1, Math.floor(pos));
    const i1 = Math.min(N - 1, i0 + 1);
    const t = smooth(0.2, 0.8, pos - i0);
    if (colors.length) {
      const rgb = colors[i0].map((c, k) => Math.round(c + (colors[i1][k] - c) * t));
      const bg = `rgb(${rgb.join(',')})`;
      stage.style.backgroundColor = bg;
      stage.style.setProperty('--stage-bg', bg);
    }

    nav.classList.toggle('on-story', story.getBoundingClientRect().bottom > nav.offsetHeight);
  }

  // Run every frame while the story is on screen.
  let raf = 0, visible = true;
  const loop = (now) => { render(now); raf = visible ? requestAnimationFrame(loop) : 0; };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { lastTime = performance.now(); raf = requestAnimationFrame(loop); }
    if (!visible) nav.classList.remove('on-story');
  }).observe(story);

  // Jump to a chapter; the camera glides there.
  function goTo(i) {
    const top = story.getBoundingClientRect().top + window.scrollY;
    const span = story.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (span * i) / (N - 1), behavior: 'auto' });
  }
  ticks.forEach((t, k) => t.addEventListener('click', () => goTo(k)));
  keepGoing.addEventListener('click', () => {
    if (shownChapter < N - 1) goTo(shownChapter + 1);
    else document.querySelector('#work').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  });

  window.addEventListener('resize', measure);
  window.addEventListener('themechange', readColors);
  measure();
  readColors();
  render(performance.now());
  raf = requestAnimationFrame(loop);
})();
