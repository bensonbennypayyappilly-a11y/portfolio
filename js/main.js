/* ==========================================================================
   Benson Benny: portfolio interactions
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const root = document.documentElement;
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = () => mqReduce.matches;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const EMAIL = 'bensonbenny.payyappilly@gmail.com';
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ---------- Copy email ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }
  async function copyEmail() {
    const ok = await copyText(EMAIL);
    toast(ok ? 'Email copied. Talk soon!' : EMAIL);
  }
  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', copyEmail));

  /* ---------- Theme (dark first) ---------- */
  const metaTheme = $('meta[name="theme-color"]');
  const lamp = $('#lamp');
  function applyTheme(theme, persist) {
    root.dataset.theme = theme;
    if (persist) { try { localStorage.setItem('theme', theme); } catch { /* storage unavailable */ } }
    metaTheme.setAttribute('content', theme === 'dark' ? '#0a0908' : '#f4efe7');
    if (lamp) {
      lamp.setAttribute('aria-pressed', String(theme === 'light'));
      lamp.setAttribute('aria-label', theme === 'dark' ? 'Pull the lamp to switch on the light theme' : 'Pull the lamp to switch back to the dark theme');
    }
    window.dispatchEvent(new Event('themechange'));
  }
  // Light spreads out from the lamp when the browser supports view transitions.
  function toggleTheme() {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduced() || !lamp) { applyTheme(next, true); return; }
    const r = lamp.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.5;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next, true));
    vt.ready.then(() => {
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 800, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(() => {});
  }
  applyTheme(root.dataset.theme || 'dark', false);
  let pullLamp = toggleTheme;

  /* A tiny mechanical "click" for the pull switch */
  let audioCtx;
  function clickSound() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const len = Math.floor(audioCtx.sampleRate * 0.03);
      const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const band = audioCtx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 2600;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.3;
      src.connect(band).connect(gain).connect(audioCtx.destination);
      src.start();
    } catch { /* audio unavailable */ }
  }

  /* ---------- The pull-cord lamp ---------- */
  (function lampSwitch() {
    if (!lamp) return;
    const chain = $('.lamp-chain', lamp);
    const bead = $('.lamp-bead', lamp);
    const base = { y2: Number(chain.getAttribute('y2')), cy: Number(bead.getAttribute('cy')) };
    const MAX = 26, TRIGGER = 12;
    let startY = null, pull = 0, dragged = false, springRaf = 0;
    const setPull = (p) => {
      pull = p;
      chain.setAttribute('y2', (base.y2 + p).toFixed(2));
      bead.setAttribute('cy', (base.cy + p).toFixed(2));
    };
    function springBack() {
      const from = pull, t0 = performance.now();
      cancelAnimationFrame(springRaf);
      const step = (now) => {
        const t = (now - t0) / 1000;
        if (t > 0.9 || reduced()) { setPull(0); return; }
        setPull(from * Math.exp(-6 * t) * Math.cos(16 * t));
        springRaf = requestAnimationFrame(step);
      };
      springRaf = requestAnimationFrame(step);
    }
    function fire() {
      clickSound();
      lamp.classList.remove('swing');
      void lamp.offsetWidth;
      lamp.classList.add('swing', 'pulled');
      try { localStorage.setItem('lampPulled', '1'); } catch { /* storage unavailable */ }
      toggleTheme();
    }
    pullLamp = () => {
      if (reduced()) { fire(); return; }
      const t0 = performance.now();
      const down = (now) => {
        const k = Math.min(1, (now - t0) / 140);
        setPull(MAX * 0.8 * k);
        if (k < 1) requestAnimationFrame(down);
        else { fire(); springBack(); }
      };
      requestAnimationFrame(down);
    };
    lamp.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      startY = e.clientY;
      dragged = false;
      cancelAnimationFrame(springRaf);
      lamp.setPointerCapture(e.pointerId);
    });
    lamp.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      const dy = Math.max(0, Math.min(MAX, (e.clientY - startY) * 0.7));
      if (dy > 2) dragged = true;
      setPull(dy);
    });
    lamp.addEventListener('pointerup', () => {
      if (startY === null) return;
      startY = null;
      if (dragged) { if (pull >= TRIGGER) fire(); springBack(); }
    });
    lamp.addEventListener('pointercancel', () => { startY = null; springBack(); });
    // Keyboard, plain clicks and taps pull the cord for you.
    lamp.addEventListener('click', () => {
      if (dragged) { dragged = false; return; }
      pullLamp();
    });
    try { if (localStorage.getItem('lampPulled')) lamp.classList.add('pulled'); } catch { /* storage unavailable */ }
  })();

  /* ---------- Small details ---------- */
  $$('.kbd-hint').forEach((k) => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  $('#year').textContent = new Date().getFullYear();

  const localTime = $('#local-time');
  if (localTime) {
    const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
    const tick = () => { localTime.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 20000);
  }

  /* ---------- Scroll: nav state and progress bar ---------- */
  const nav = $('.nav');
  const bar = $('.progress span');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 8);
      const max = root.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Active nav link */
  const navLinks = $$('.nav-links a');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionObs.observe(s));

  /* ---------- Reveal on scroll ---------- */
  $$('[data-stagger]').forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.style.setProperty('--d', `${i * 80}ms`);
    });
  });
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  $$('.reveal').forEach((el) => revealObs.observe(el));

  /* ---------- Pointer niceties (desktop only) ---------- */
  if (mqFine.matches) {
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        if (reduced()) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.16}px, ${y * 0.28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Accessible radio groups (roving tabindex) ---------- */
  function radioGroup(group, onChange) {
    const items = $$('[role="radio"]', group);
    const select = (el, focus) => {
      items.forEach((b) => {
        const on = b === el;
        b.setAttribute('aria-checked', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      if (focus) el.focus();
      onChange(el.dataset.value, el);
    };
    items.forEach((b, i) => {
      b.addEventListener('click', () => select(b, false));
      b.addEventListener('keydown', (e) => {
        let j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % items.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + items.length) % items.length;
        if (j !== null) { e.preventDefault(); select(items[j], true); }
      });
    });
    const initial = items.find((b) => b.getAttribute('aria-checked') === 'true') || items[0];
    items.forEach((b) => { b.tabIndex = b === initial ? 0 : -1; });
    return { clear: () => items.forEach((b) => b.setAttribute('aria-checked', 'false')), items, select };
  }

  /* ==========================================================================
     Demo 1: LuvLit mini site builder
     ========================================================================== */
  (function luvlitDemo() {
    const box = $('[data-demo="luvlit"]');
    if (!box) return;
    const TYPES = {
      bakery: { label: 'Bakery', head: (a) => `Baked fresh this morning in ${a}.`, sub: 'Cakes, breads and cookies made in small batches. Order ahead or walk in.',
        items: [['Celebration cakes', 'Made to order'], ['Fresh breads', 'Out by 8am'], ['Cookies', 'By the box']] },
      cafe: { label: 'Café', head: (a) => `Good coffee and slow mornings in ${a}.`, sub: 'Filter coffee, all-day breakfast and a quiet corner to work from.',
        items: [['Filter coffee', 'Brewed fresh'], ['Breakfast', 'Served all day'], ['Work corner', 'Stay a while']] },
      salon: { label: 'Salon', head: (a) => `Look sharp, feel good, right here in ${a}.`, sub: 'Cuts, colour and grooming. Book a slot in seconds, no calls needed.',
        items: [['Haircuts', 'From 30 min'], ['Colour', 'Consult first'], ['Grooming', 'Walk-ins welcome']] },
      tailor: { label: 'Tailor', head: (a) => `Made to fit, stitched in ${a}.`, sub: 'Alterations, custom fits and uniforms, done on time and on budget.',
        items: [['Alterations', 'Same week'], ['Custom fits', 'Measured in store'], ['Uniforms', 'Bulk orders']] },
      tuition: { label: 'Tuition', head: (a) => `Patient tutoring for classes 6 to 12 in ${a}.`, sub: 'Small batches and regular progress updates for parents.',
        items: [['Maths', 'Classes 6–12'], ['Science', 'Concepts first'], ['Spoken English', 'Weekend batch']] },
    };
    const nameIn = $('#ll-name');
    const areaIn = $('#ll-area');
    const site = $('#ll-site');
    const out = {
      title: $('#ll-title'), initial: $('#ll-initial'), kicker: $('#ll-kicker'), head: $('#ll-headline'),
      sub: $('#ll-sub'), url: $('#ll-url'), services: $('#ll-services'),
    };
    let type = 'bakery';

    const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-') || 'your-business';
    const flash = (el) => { if (reduced()) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };

    function render(changedType) {
      const name = nameIn.value.trim() || 'Your Business';
      const area = areaIn.value.trim() || 'your area';
      const T = TYPES[type];
      out.title.textContent = name;
      out.initial.textContent = name.charAt(0).toUpperCase();
      out.kicker.textContent = `${T.label} · ${area}`;
      out.head.textContent = T.head(area);
      out.sub.textContent = T.sub;
      out.url.textContent = `${slug(name)} · preview`;
      site.setAttribute('aria-label', `Website preview for ${name}, a ${T.label.toLowerCase()} in ${area}`);
      if (changedType) {
        out.services.replaceChildren(...T.items.map(([title, note]) => {
          const card = document.createElement('div');
          card.className = 'site-card';
          const b = document.createElement('b');
          b.textContent = title;
          const s = document.createElement('span');
          s.textContent = note;
          card.append(b, s);
          return card;
        }));
        flash(out.head);
        flash(out.sub);
      }
    }
    nameIn.addEventListener('input', () => render(false));
    areaIn.addEventListener('input', () => render(false));
    radioGroup($('#ll-type'), (v) => { type = v; render(true); });
    radioGroup($('#ll-color'), (v) => { site.style.setProperty('--brand', v); });

    const publish = $('#ll-publish');
    const status = $('#ll-status');
    publish.addEventListener('click', () => {
      if (publish.disabled) return;
      publish.disabled = true;
      box.classList.remove('publishing');
      void box.offsetWidth;
      box.classList.add('publishing');
      const steps = ['Checking the mobile layout…', 'Adding online payments…', 'Listing it for local discovery…'];
      let k = 0;
      status.textContent = steps[0];
      const iv = setInterval(() => {
        k += 1;
        if (k < steps.length) { status.textContent = steps[k]; return; }
        clearInterval(iv);
        status.innerHTML = 'Preview ready. <a href="https://luvlit.in" target="_blank" rel="noopener">Build the real one at luvlit.in ↗</a>';
        publish.textContent = 'Publish again';
        publish.disabled = false;
      }, 680);
    });

    render(true);
  })();

  /* ==========================================================================
     Demo 2: OiDoit first-step finder
     ========================================================================== */
  (function oidoitDemo() {
    const app = $('#oi-app');
    if (!app) return;
    const TASKS = {
      emails: { label: 'Emails', steps: {
        low: ['Open your inbox. That’s it. Just look.', 'Star the one email that matters most.', 'Write one line back. Send it or save it as a draft.'],
        mid: ['Reply to the easiest email first, in two lines or fewer.', 'Archive anything that doesn’t need an answer.', 'Pick the next reply and give it five minutes.'],
        high: ['Clear every quick reply you can in ten minutes.', 'Draft the one reply you’ve been avoiding.', 'Archive, snooze or delete the rest.'],
      } },
      room: { label: 'Tidy room', steps: {
        low: ['Pick up five things and put them where they live.', 'Clear just one surface, like your bedside table.', 'Open a window and make the bed. Done is done.'],
        mid: ['Put on one song and tidy until it ends.', 'Gather everything that belongs in another room.', 'Clear the floor, nothing else.'],
        high: ['Set ten minutes and work clockwise around the room.', 'Fill one bag with things to donate or bin.', 'Wipe down the surfaces you just cleared.'],
      } },
      move: { label: 'Exercise', steps: {
        low: ['Put your shoes on. That’s the whole step.', 'Stretch gently for a couple of minutes, wherever you are.', 'Walk to the end of the street and back.'],
        mid: ['Go for a five-minute walk. Anywhere counts.', 'Pack your gym bag and leave it by the door.', 'Do one short routine you already know.'],
        high: ['Do ten minutes of whatever movement you enjoy.', 'Plan tomorrow’s session and put it in your calendar.', 'Try one new move or route today.'],
      } },
      study: { label: 'Study', steps: {
        low: ['Open your notes to the right page. No reading yet.', 'Read just one paragraph.', 'Write down one thing you didn’t know.'],
        mid: ['Read for five minutes, then write a one-line summary.', 'Answer one practice question.', 'List what you’ll cover in the next session.'],
        high: ['Ten focused minutes on the hardest topic first.', 'Teach the idea out loud as if to a friend.', 'Do three practice questions without notes.'],
      } },
      paperwork: { label: 'Paperwork', steps: {
        low: ['Find the document. Just put it on the table.', 'Read the first page. Don’t fill anything in.', 'Write down the one thing you need to ask about.'],
        mid: ['Fill in only the easy fields: name, date, address.', 'Gather the receipts or IDs it asks for.', 'Set a reminder for the deadline.'],
        high: ['Give it ten minutes and get as far as you can.', 'Make the call or send the email it needs.', 'Scan or photograph everything and file it.'],
      } },
    };
    const custom = (t) => ({
      low: [`Get everything you need for “${t}” in one place. No doing yet.`, `Spend two minutes on the very first bit of “${t}”.`, `Write the next step for “${t}” so future-you knows where to start.`],
      mid: [`Do the first five minutes of “${t}”. You can stop after.`, `Do the next smallest piece of “${t}”.`, `Tell someone you’re working on “${t}”.`],
      high: [`Give “${t}” ten focused minutes. Phone face-down.`, `Tackle the hardest part of “${t}” while you’re warm.`, `Finish one complete chunk of “${t}”.`],
    });
    const MINUTES = { low: 2, mid: 5, high: 10 };
    const KIND = [
      'Small is the point. You can stop after this.',
      'No catching up needed. Just this one thing.',
      'Starting is the hard part, and you’re here.',
      'Messy is fine. Done beats perfect.',
    ];
    const WINS = [
      'You started. That’s the hardest part.',
      'That counts. Seriously.',
      'One step done. Momentum is on your side now.',
      'Look at you, following through.',
    ];
    const CIRC = 276.46;

    const views = { pick: $('[data-view="pick"]', app), step: $('[data-view="step"]', app), win: $('[data-view="win"]', app) };
    const customIn = $('#oi-custom');
    const taskChips = $('#oi-tasks');
    const stepEl = $('#oi-step');
    const timeEl = $('#oi-time');
    const ring = $('#oi-ring');
    const startBtn = $('#oi-start');
    let task = 'emails', energy = 'low', idx = 0;
    let total = 120, remaining = 120, endAt = 0, iv = 0;

    const tasks = radioGroup(taskChips, (v) => { task = v; customIn.value = ''; taskChips.classList.remove('dim'); });
    radioGroup($('#oi-energy'), (v) => { energy = v; });
    customIn.addEventListener('input', () => taskChips.classList.toggle('dim', customIn.value.trim() !== ''));
    customIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); begin(); } });

    function show(name) {
      const hadFocus = app.contains(document.activeElement);
      Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });
      const v = views[name];
      v.classList.remove('enter');
      void v.offsetWidth;
      v.classList.add('enter');
      if (hadFocus) $('button:not([tabindex="-1"])', v).focus({ preventScroll: true });
    }
    const label = () => customIn.value.trim() || TASKS[task].label;
    const steps = () => (customIn.value.trim() ? custom(customIn.value.trim())[energy] : TASKS[task].steps[energy]);
    const fmt = (s) => { const c = Math.ceil(s); return `${Math.floor(c / 60)}:${String(c % 60).padStart(2, '0')}`; };

    function renderTimer() {
      timeEl.textContent = fmt(remaining);
      ring.style.strokeDashoffset = String(CIRC * (1 - remaining / total));
    }
    function stopTimer() { clearInterval(iv); iv = 0; }
    function toggleTimer() {
      if (iv) {
        stopTimer();
        startBtn.textContent = 'Resume';
        return;
      }
      endAt = performance.now() + remaining * 1000;
      startBtn.textContent = 'Pause';
      iv = setInterval(() => {
        remaining = Math.max(0, (endAt - performance.now()) / 1000);
        renderTimer();
        if (remaining <= 0) { stopTimer(); win(); }
      }, 250);
    }
    function showStep() {
      const list = steps();
      stopTimer();
      $('#oi-task-name').textContent = label();
      stepEl.textContent = list[idx % list.length];
      total = remaining = MINUTES[energy] * 60;
      renderTimer();
      startBtn.textContent = `Start ${MINUTES[energy]} min`;
      $('#oi-kind').textContent = pick(KIND);
      show('step');
    }
    function begin() { idx = 0; showStep(); }
    function win() {
      stopTimer();
      $('#oi-win-msg').textContent = pick(WINS);
      show('win');
    }

    $('#oi-go').addEventListener('click', begin);
    startBtn.addEventListener('click', toggleTimer);
    $('#oi-done').addEventListener('click', win);
    $('#oi-next').addEventListener('click', () => { idx += 1; showStep(); });
    $('#oi-back').addEventListener('click', () => { stopTimer(); show('pick'); });
    $('#oi-rest').addEventListener('click', () => {
      customIn.value = '';
      taskChips.classList.remove('dim');
      tasks.select(tasks.items[0], false);
      show('pick');
      toast('Win logged. Rest is part of the plan.');
    });
  })();

  /* ==========================================================================
     Demo 3: Recoora live payment monitor (simulated Stripe events)
     ========================================================================== */
  (function recooraDemo() {
    const box = $('[data-demo="recoora"]');
    if (!box) return;
    const CUSTOMERS = ['Northwind Studio', 'Lumen Labs', 'Paper Plane Co', 'Kettle & Crumb', 'Orbit Fitness',
      'Bluebird Yoga', 'Pixel Pantry', 'Atlas Tutors', 'Fern & Fig', 'Quill Notes', 'Harbor Coffee', 'Tiny Desk Co'];
    const PLANS = [19, 29, 49, 79, 129, 299];
    const EVENTS = [
      { type: 'charge.succeeded', w: 66, kind: 'ok' },
      { type: 'invoice.payment_failed', w: 11, kind: 'bad' },
      { type: 'customer.subscription.updated', w: 9, kind: 'warn' },
      { type: 'charge.refunded', w: 6, kind: 'warn' },
      { type: 'customer.subscription.deleted', w: 4, kind: 'bad' },
      { type: 'charge.dispute.created', w: 4, kind: 'bad' },
    ];
    const ALERTS = {
      'invoice.payment_failed': { title: 'Payment failed', level: 'bad',
        idea: 'Send a friendly card-update link within the hour, then retry in 3 days. Keep their access on while it gets fixed.' },
      'customer.subscription.deleted': { title: 'Subscription cancelled', level: 'bad',
        idea: 'Ask one short question about why they left, and offer a pause instead of a goodbye.' },
      'charge.dispute.created': { title: 'Dispute opened', level: 'bad',
        idea: 'Reach out personally with the receipt and usage history before responding to the dispute.' },
      downgrade: { title: 'Plan downgraded', level: 'warn',
        idea: 'Show them the features they used most on the higher plan, then check in after a week.' },
      refunds: { title: 'Refund pattern', level: 'warn',
        idea: 'Second refund this session. Group refunds by reason: a repeat is a product fix, not a support ticket.' },
    };
    const feed = $('#rc-feed');
    const alertList = $('#rc-alert-list');
    const pauseBtn = $('#rc-pause');
    const liveText = $('#rc-live-text');
    const sr = $('#rc-sr');
    const sparkPath = $('#rc-spark path');
    const k = { vol: $('#rc-vol'), ok: $('#rc-ok'), fail: $('#rc-fail'), alerts: $('#rc-alerts') };
    const state = { vol: 0, ok: 0, fail: 0, alerts: 0, refunds: 0, series: [0] };
    let paused = false, visible = false, timer = 0;

    const money = (n) => `$${n.toFixed(2)}`;
    const clock = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
    const totalW = EVENTS.reduce((s, e) => s + e.w, 0);
    function randomEvent() {
      let r = Math.random() * totalW;
      for (const e of EVENTS) { r -= e.w; if (r < 0) return e; }
      return EVENTS[0];
    }
    function setKpi(el, value) {
      if (el.textContent === value) return;
      el.textContent = value;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
    function renderKpis() {
      setKpi(k.vol, `$${state.vol.toLocaleString('en-US')}`);
      setKpi(k.ok, String(state.ok));
      setKpi(k.fail, String(state.fail));
      setKpi(k.alerts, String(state.alerts));
      const s = state.series.slice(-24);
      const max = Math.max(...s), min = Math.min(...s);
      const W = 88, H = 26;
      sparkPath.setAttribute('d', s.map((v, i) => {
        const x = (i / Math.max(1, s.length - 1)) * W;
        const y = H - 2 - ((v - min) / (max - min || 1)) * (H - 4);
        return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(''));
    }
    function addRow(type, who, amount, kind, note) {
      const li = document.createElement('li');
      li.className = `rc-ev ${kind}`;
      const ev = document.createElement('span');
      ev.className = 'ev';
      const ty = document.createElement('span');
      ty.className = 'type';
      ty.textContent = type;
      const wh = document.createElement('span');
      wh.className = 'who';
      wh.textContent = [who, note, clock()].filter(Boolean).join(' · ');
      ev.append(ty, wh);
      const amt = document.createElement('span');
      amt.className = 'amt';
      amt.textContent = (type === 'charge.refunded' ? '−' : '') + money(amount);
      li.append(ev, amt);
      feed.prepend(li);
      while (feed.children.length > 10) feed.lastElementChild.remove();
    }
    function typeText(el, text) {
      if (reduced()) { el.textContent = text; return; }
      let i = 0;
      el.classList.add('typing');
      const iv = setInterval(() => {
        i += 2;
        el.textContent = text.slice(0, i);
        if (i >= text.length) { clearInterval(iv); el.classList.remove('typing'); }
      }, 16);
    }
    function addAlert(a, who, amount) {
      state.alerts += 1;
      const empty = $('.rc-empty', alertList);
      if (empty) empty.remove();
      const card = document.createElement('div');
      card.className = `rc-alert ${a.level}`;
      card.innerHTML = '<div class="rc-alert-head"><b></b><span></span></div><p class="rc-alert-meta"></p>'
        + '<p class="rc-idea"><span class="spark-label">Retention idea</span><span class="txt"></span></p>';
      $('b', card).textContent = a.title;
      $('.rc-alert-head span', card).textContent = money(amount);
      $('.rc-alert-meta', card).textContent = `${who} · notified ${clock().slice(0, 5)}`;
      alertList.prepend(card);
      while (alertList.children.length > 3) alertList.lastElementChild.remove();
      typeText($('.txt', card), a.idea);
    }
    function emit(forced) {
      const def = forced ? EVENTS.find((e) => e.type === forced) : randomEvent();
      const who = pick(CUSTOMERS);
      const amount = pick(PLANS);
      let kind = def.kind, note = '', alert = ALERTS[def.type] || null;
      if (def.type === 'customer.subscription.updated') {
        const down = Math.random() < 0.55;
        note = down ? 'downgrade' : 'upgrade';
        kind = down ? 'warn' : 'ok';
        alert = down ? ALERTS.downgrade : null;
      }
      if (def.type === 'charge.refunded') {
        state.refunds += 1;
        alert = state.refunds % 2 === 0 ? ALERTS.refunds : null;
      }
      if (def.type === 'charge.succeeded') {
        state.ok += 1;
        state.vol += amount;
        state.series.push(state.vol);
      }
      if (def.type === 'invoice.payment_failed') state.fail += 1;
      addRow(def.type, who, amount, kind, note);
      if (alert) addAlert(alert, who, amount);
      renderKpis();
      return alert;
    }
    function schedule() {
      clearTimeout(timer);
      if (paused || !visible || document.hidden) return;
      timer = setTimeout(() => { emit(); schedule(); }, 1300 + Math.random() * 1600);
    }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: 0.15 }).observe(box);
    document.addEventListener('visibilitychange', schedule);
    pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      liveText.textContent = paused ? 'Paused' : 'Live · simulated';
      box.classList.toggle('paused', paused);
      schedule();
    });
    $$('[data-sim]', box).forEach((b) => b.addEventListener('click', () => {
      const a = emit(b.dataset.sim);
      sr.textContent = `${a.title}. Retention idea: ${a.idea}`;
    }));

    ['charge.succeeded', 'charge.succeeded', 'invoice.payment_failed', 'charge.succeeded', 'charge.succeeded']
      .forEach((t) => emit(t));
  })();

  /* ==========================================================================
     Skill graph
     ========================================================================== */
  (function skillGraph() {
    const graph = $('.graph');
    if (!graph) return;
    const svg = $('.graph-lines', graph);
    const chips = $$('.chip-btn', graph);
    const nodes = $$('.node', graph);
    const byId = Object.fromEntries(nodes.map((n) => [n.dataset.node, n]));
    const mqWide = matchMedia('(min-width: 961px)');
    let locked = null;

    const linksOf = (chip) => chip.dataset.links.split(' ');
    function clear() {
      graph.classList.remove('active');
      chips.concat(nodes).forEach((el) => el.classList.remove('on'));
      svg.replaceChildren();
    }
    function line(from, to) {
      if (!mqWide.matches) return;
      const g = graph.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();
      const x1 = a.right - g.left, y1 = a.top + a.height / 2 - g.top;
      const x2 = b.left - g.left, y2 = b.top + b.height / 2 - g.top;
      const dx = Math.max(40, (x2 - x1) * 0.5);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`);
      svg.append(p);
      p.style.setProperty('--len', String(Math.ceil(p.getTotalLength())));
    }
    function activate(el) {
      clear();
      graph.classList.add('active');
      el.classList.add('on');
      if (el.classList.contains('chip-btn')) {
        linksOf(el).forEach((id) => { const n = byId[id]; if (n) { n.classList.add('on'); line(el, n); } });
      } else {
        chips.filter((c) => linksOf(c).includes(el.dataset.node)).forEach((c) => { c.classList.add('on'); line(c, el); });
      }
    }
    const restore = () => (locked ? activate(locked) : clear());

    chips.concat(nodes).forEach((el) => {
      el.setAttribute('aria-pressed', 'false');
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') activate(el); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') restore(); });
      el.addEventListener('focus', () => activate(el));
      el.addEventListener('blur', restore);
      el.addEventListener('click', () => {
        locked = locked === el ? null : el;
        chips.concat(nodes).forEach((x) => x.setAttribute('aria-pressed', String(x === locked)));
        restore();
      });
    });
    window.addEventListener('resize', () => { if (graph.classList.contains('active')) restore(); });
  })();

  /* ==========================================================================
     Command palette
     ========================================================================== */
  (function commandPalette() {
    const palette = $('#palette');
    const panel = $('.palette-panel', palette);
    const input = $('#palette-input');
    const list = $('#palette-list');
    const go = (sel) => () => {
      const el = $(sel);
      if (!el) return;
      el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', sel);
    };
    const openUrl = (url) => () => window.open(url, '_blank', 'noopener');
    const COMMANDS = [
      { group: 'Jump to', label: 'Story', hint: 'From the beginning', keys: 'home top journey amazon kfc india', action: go('#top') },
      { group: 'Jump to', label: 'Work', hint: 'Three products, idea to launch', action: go('#work') },
      { group: 'Jump to', label: 'LuvLit', hint: 'Websites for local businesses', action: go('#luvlit') },
      { group: 'Jump to', label: 'OiDoit', hint: 'Execution companion', action: go('#oidoit') },
      { group: 'Jump to', label: 'Recoora', hint: 'AI-powered Stripe alerts', keys: 'stripe payments', action: go('#recoora') },
      { group: 'Jump to', label: 'Toolkit', hint: 'Skills mapped to proof', keys: 'skills', action: go('#toolkit') },
      { group: 'Jump to', label: 'Contact', hint: 'Let’s talk', keys: 'hire email', action: go('#contact') },
      { group: 'Actions', label: 'Copy email address', hint: EMAIL, action: copyEmail },
      { group: 'Actions', label: 'Write an email', hint: 'Opens your mail app', action: () => { window.location.href = `mailto:${EMAIL}`; } },
      { group: 'Actions', label: 'Play or pause the music', hint: 'An ambient score for the story', keys: 'sound audio song', action: () => window.dispatchEvent(new Event('togglemusic')) },
      { group: 'Actions', label: 'Pull the lamp', hint: 'Switch light / dark', keys: 'theme dark light mode', action: () => pullLamp() },
      { group: 'Links', label: 'Visit luvlit.in', hint: 'Live product', action: openUrl('https://luvlit.in') },
      { group: 'Links', label: 'Visit recoora.vercel.app', hint: 'Still live', keys: 'stripe', action: openUrl('https://recoora.vercel.app') },
      { group: 'Links', label: 'LinkedIn', hint: 'benson-benny', keys: 'profile cv', action: openUrl('https://www.linkedin.com/in/benson-benny-743675179/') },
    ];
    let filtered = COMMANDS;
    let sel = 0;
    let lastFocus = null;

    function score(q, c) {
      if (!q) return 1;
      const hay = `${c.label} ${c.hint || ''} ${c.keys || ''}`.toLowerCase();
      if (c.label.toLowerCase().startsWith(q)) return 4;
      if (hay.includes(q)) return 3;
      let i = 0;
      for (const ch of hay) { if (ch === q[i]) i += 1; if (i === q.length) return 1; }
      return 0;
    }
    function render() {
      const q = input.value.trim().toLowerCase();
      filtered = COMMANDS.map((c) => ({ c, s: score(q, c) })).filter((x) => x.s > 0)
        .sort((a, b) => (q ? b.s - a.s : 0)).map((x) => x.c);
      sel = Math.min(sel, Math.max(0, filtered.length - 1));
      list.replaceChildren();
      if (!filtered.length) {
        const li = document.createElement('li');
        li.className = 'palette-empty';
        li.setAttribute('role', 'presentation');
        li.textContent = 'Nothing matches that. Try “work”, “email” or “theme”.';
        list.append(li);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      let group = null;
      filtered.forEach((c, i) => {
        if (!q && c.group !== group) {
          group = c.group;
          const g = document.createElement('li');
          g.className = 'palette-group';
          g.setAttribute('role', 'presentation');
          g.textContent = group;
          list.append(g);
        }
        const li = document.createElement('li');
        li.className = 'palette-item';
        li.id = `cmd-${i}`;
        li.setAttribute('role', 'option');
        const label = document.createElement('span');
        label.className = 'pi-label';
        label.textContent = c.label;
        const hint = document.createElement('span');
        hint.className = 'pi-hint';
        hint.textContent = c.hint || '';
        li.append(label, hint);
        li.addEventListener('click', () => run(i));
        li.addEventListener('pointermove', () => { if (sel !== i) { sel = i; mark(); } });
        list.append(li);
      });
      mark();
    }
    function mark() {
      $$('.palette-item', list).forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
      const cur = $(`#cmd-${sel}`, list);
      if (cur) {
        input.setAttribute('aria-activedescendant', cur.id);
        cur.scrollIntoView({ block: 'nearest' });
      }
    }
    function open() {
      if (!palette.hidden) return;
      lastFocus = document.activeElement;
      palette.hidden = false;
      root.classList.add('locked');
      input.value = '';
      sel = 0;
      render();
      requestAnimationFrame(() => (mqFine.matches ? input.focus() : panel.focus()));
    }
    function close() {
      if (palette.hidden) return;
      palette.hidden = true;
      root.classList.remove('locked');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    function run(i) {
      const c = filtered[i];
      if (!c) return;
      close();
      setTimeout(c.action, 20);
    }

    input.addEventListener('input', () => { sel = 0; render(); });
    palette.addEventListener('keydown', (e) => {
      const n = filtered.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (n) { sel = (sel + 1) % n; mark(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) { sel = (sel - 1 + n) % n; mark(); } }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
    });
    palette.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    $$('[data-open-palette]').forEach((b) => b.addEventListener('click', open));
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (palette.hidden) open(); else close();
      } else if (e.key === '/' && palette.hidden && !e.target.closest('input, textarea, [contenteditable="true"]')) {
        e.preventDefault();
        open();
      }
    });
  })();

  /* ==========================================================================
     Letters that get bolder near the cursor (hero name + footer signature)
     ========================================================================== */
  function setLetter(s, f) {
    const base = Number(s.dataset.base);
    s.style.fontVariationSettings = `"wght" ${Math.round(base + (700 - base) * f)}`;
    s.style.setProperty('--f', f.toFixed(3));
  }
  function splitLetters(el) {
    const base = el.dataset.letters;
    const text = el.textContent;
    el.textContent = '';
    return Array.from(text).map((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      s.dataset.base = base;
      el.append(s);
      setLetter(s, 0);
      return s;
    });
  }
  function letterField(zone, letters, radius) {
    let px = 0, py = 0, raf = 0;
    const paint = () => {
      raf = 0;
      letters.forEach((s) => {
        const r = s.getBoundingClientRect();
        const f = Math.max(0, 1 - Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2)) / radius);
        setLetter(s, f * f * (3 - 2 * f));
      });
    };
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduced()) return;
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    });
    zone.addEventListener('pointerleave', () => letters.forEach((s) => setLetter(s, 0)));
  }
  function letterWave(letters) {
    if (reduced()) return;
    letters.forEach((s, i) => setTimeout(() => {
      setLetter(s, 1);
      setTimeout(() => setLetter(s, 0), 420);
    }, i * 75));
  }
  const heroLetters = $$('.story-name [data-letters]').flatMap(splitLetters);
  const footLetters = $$('.footer-name [data-letters]').flatMap(splitLetters);
  if (heroLetters.length) {
    letterField($('.story'), heroLetters, 260);
    setTimeout(() => letterWave(heroLetters), 2600);
  }
  if (footLetters.length) {
    letterField($('.footer'), footLetters, 300);
    const footObs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      letterWave(footLetters);
      footObs.disconnect();
    }, { threshold: 0.6 });
    footObs.observe($('.footer-name'));
  }

  /* ==========================================================================
     Section titles: word-by-word reveal and a hand-drawn underline
     ========================================================================== */
  (function titles() {
    const SCRIBBLE = 'M2 13 C 30 4, 60 17, 95 9 S 160 4, 198 11';
    $$('.section-title, .contact-title').forEach((title) => {
      let i = 0;
      const wrap = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.append(' '); return; }
              const w = document.createElement('span');
              w.className = 'w';
              w.style.setProperty('--i', i++);
              w.textContent = part;
              frag.append(w);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            wrap(child);
          }
        });
      };
      wrap(title);
      $$('em', title).forEach((em) => em.insertAdjacentHTML('beforeend',
        `<svg class="scribble" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true"><path d="${SCRIBBLE}" pathLength="1"/></svg>`));
      title.classList.add('split');
      revealObs.observe(title);
    });
  })();

  /* ==========================================================================
     Desktop extra: custom cursor
     ========================================================================== */
  if (mqFine.matches && !reduced()) {
    const ring = document.createElement('div');
    ring.className = 'cursor hidden';
    ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<span></span>';
    const dot = document.createElement('div');
    dot.className = 'cursor-dot hidden';
    dot.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot);
    root.classList.add('has-cursor');
    const label = $('span', ring);
    let mx = -100, my = -100, rx = -100, ry = -100, raf = 0;
    const follow = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.2 ? requestAnimationFrame(follow) : 0;
    };
    function aimAt(target) {
      if (!target || !target.closest) return;
      const labelled = target.closest('[data-cursor]');
      const text = !labelled && target.closest('input[type="text"]');
      const link = !labelled && !text && target.closest('a, button, [role="radio"], label');
      ring.classList.toggle('is-label', !!labelled);
      ring.classList.toggle('is-link', !!link);
      ring.classList.toggle('is-text', !!text);
      dot.classList.toggle('is-text', !!text);
      if (labelled) label.textContent = labelled.dataset.cursor;
    }
    // Scrolling moves the page under a still mouse, so re-check what it points at.
    window.addEventListener('scroll', () => { if (mx >= 0) aimAt(document.elementFromPoint(mx, my)); }, { passive: true });
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      ring.classList.remove('hidden');
      dot.classList.remove('hidden');
      if (!raf) raf = requestAnimationFrame(follow);
      aimAt(e.target);
    });
    document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    root.addEventListener('mouseleave', () => { ring.classList.add('hidden'); dot.classList.add('hidden'); });
  }
})();
