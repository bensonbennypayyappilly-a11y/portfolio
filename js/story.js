/* ==========================================================================
   The story: scroll position picks the chapter, and the line draws its scene
   ========================================================================== */
(() => {
  'use strict';

  const story = document.querySelector('.story');
  if (!story) return;
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mqReduce.matches;

  const stage = story.querySelector('.stage');
  const chapters = $$('.chapter', story);
  const scenes = $$('.scene', story);
  const me = story.querySelector('#me');
  const ticks = $$('.tick', story);
  const num = story.querySelector('.ch-num');
  const name = story.querySelector('.ch-name');
  const keepGoing = story.querySelector('.keep-going');
  const keepLabel = keepGoing.querySelector('span');
  const nav = document.querySelector('.nav');
  const N = chapters.length;
  const DRAW_SHARE = 0.55; // how much of a chapter's scroll the line takes to draw its scene
  story.style.setProperty('--chapters', N);

  // Each scene is drawn as one continuous stroke across its paths, in order.
  const strokes = scenes.map((g) => {
    let total = 0;
    const parts = $$('.draw', g).map((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = String(len);
      const part = { p, len, start: total };
      total += len;
      return part;
    });
    return { parts, total };
  });
  function drawScene(i, amount) {
    const s = strokes[i];
    if (!s) return;
    const done = s.total * amount;
    s.parts.forEach(({ p, len, start }) => {
      p.style.strokeDashoffset = String(len - Math.max(0, Math.min(len, done - start)));
    });
  }

  let current = -1;
  let lastX = null;
  let walkTimer = 0;
  function setChapter(i) {
    current = i;
    const c = chapters[i];
    chapters.forEach((ch, k) => {
      ch.classList.toggle('is-active', k === i);
      ch.classList.toggle('is-past', k < i);
      $$('a', ch).forEach((a) => { a.tabIndex = k === i ? 0 : -1; });
    });
    scenes.forEach((g, k) => g.classList.toggle('is-on', k === i));
    stage.style.setProperty('--stage-bg', `var(--sc${i})`);
    num.textContent = String(i).padStart(2, '0');
    name.textContent = c.dataset.name;
    ticks.forEach((t, k) => t.setAttribute('aria-current', k === i ? 'step' : 'false'));
    keepLabel.textContent = i === N - 1 ? 'See the work' : 'Keep going';

    if (me) {
      const x = Number(c.dataset.x);
      $$('.arms', me).forEach((a) => a.classList.toggle('on', a.dataset.arms === c.dataset.pose));
      if (lastX !== null && x !== lastX && !reduced()) {
        me.classList.toggle('face-left', x < lastX);
        me.classList.add('walking');
        clearTimeout(walkTimer);
        walkTimer = setTimeout(() => me.classList.remove('walking'), 1100);
      }
      me.style.transform = `translate(${x}px, 470px)`;
      lastX = x;
    }
  }

  // The opening scene draws itself once on load; later scenes follow the scroll.
  let intro = reduced() ? 1 : 0;
  if (!intro) {
    const t0 = performance.now() + 600;
    const grow = (now) => {
      intro = Math.max(0, Math.min(1, (now - t0) / 1600));
      if (current === 0) drawScene(0, intro);
      if (intro < 1) requestAnimationFrame(grow);
    };
    requestAnimationFrame(grow);
  }

  const span = () => story.offsetHeight - window.innerHeight;
  function update() {
    const r = story.getBoundingClientRect();
    const total = span();
    const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    const f = Math.min(N - 1e-4, p * N);
    const i = Math.floor(f);
    if (i !== current) setChapter(i);
    const local = reduced() ? 1 : Math.min(1, (f - i) / DRAW_SHARE);
    drawScene(i, i === 0 ? Math.max(intro, local) : local);
    nav.classList.toggle('on-story', r.bottom > nav.offsetHeight);
  }
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Jump to a chapter, landing once its scene is mostly drawn.
  function goTo(i) {
    const top = story.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + span() * ((i + DRAW_SHARE + 0.05) / N), behavior: reduced() ? 'auto' : 'smooth' });
  }
  ticks.forEach((t, k) => t.addEventListener('click', () => goTo(k)));
  keepGoing.addEventListener('click', () => {
    if (current < N - 1) goTo(current + 1);
    else document.querySelector('#work').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  });

  update();
})();
