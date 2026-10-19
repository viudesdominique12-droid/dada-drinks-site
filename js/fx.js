/* ============================================================
   DADA FX — moteurs visuels (chargé après main.js)
   · JUS     : un seul moteur pour tous les mots remplis de liquide
   · BULLES  : système unique (reflet, liseré, oscillation, éclatement)
   · TUYAU   : tube de verre de l'histoire, le jus coule le long de la courbe
   Dépend de main.js : REDUCED, COARSE, gsap, ScrollTrigger, dadaFizz.
   ============================================================ */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const RM = typeof REDUCED !== 'undefined' ? REDUCED : matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  let uid = 0;
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const stops = (grad, list) => list.forEach(([o, c]) => { mk('stop', { offset: o }, grad).style.stopColor = c; });
  // interpolation dans une liste d'arrêts hexadécimaux (#rrggbb) → 'rgb(r,g,b)'
  const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixStops = (list, t) => {
    let k = 0;
    while (k < list.length - 2 && t > list[k + 1][0]) k++;
    const [o0, c0] = list[k], [o1, c1] = list[k + 1];
    const u = clamp((t - o0) / Math.max(1e-6, o1 - o0), 0, 1);
    const A = hexRGB(c0), B = hexRGB(c1);
    return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',') + ')';
  };

  /* ---------- une seule boucle d'animation + vitesse de scroll partagée ---------- */
  const loops = new Set();
  const SV = { v: 0, y: window.pageYOffset };
  let lastT = performance.now();
  if (!RM) {
    gsap.ticker.add((time) => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const y = window.pageYOffset;
      // vitesse lissée : un seul gros cran de molette ne fait pas tout renverser
      const inst = dt > 0 ? (y - SV.y) / dt : 0;
      SV.v += (inst - SV.v) * 0.35;
      SV.y = y;
      loops.forEach((fn) => fn(time, dt));
    });
  }
  const watch = (el, cb, margin) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin || '160px 0px' });
    io.observe(el);
    return io;
  };

  /* ============================================================
     JUS — mot-récipient
     Calques (dans le <g> découpé au texte) : vague arrière plus claire,
     corps avec dégradé de profondeur, caustiques qui dérivent, bulles qui
     montent / grossissent / éclatent sous la surface, reflet du ménisque.
     ============================================================ */
  function juice(cfg) {
    const { svg, group, shape } = cfg;
    if (!svg || !group || !shape) return null;
    const id = 'jz' + (++uid);
    const fs = parseFloat(shape.getAttribute('font-size')) || 100;
    const base = parseFloat(shape.getAttribute('y')) || fs * 0.84;
    let bb = null;
    try { bb = shape.getBBox(); } catch (e) { /* hors rendu */ }
    if (!bb || !bb.width) { const vb = svg.viewBox.baseVal; bb = { x: 0, width: vb.width }; }
    const X0 = bb.x - fs * 0.2, X1 = bb.x + bb.width + fs * 0.2;
    const CX = (X0 + X1) / 2, HW = (X1 - X0) / 2;
    const TOP = base - fs * (cfg.cap != null ? cfg.cap : 0.74);
    const BOT = base + fs * (cfg.desc != null ? cfg.desc : 0.02);
    const HH = BOT - TOP;
    const AMP = fs * (cfg.amp != null ? cfg.amp : 0.05);
    const N = Math.ceil((X1 - X0) / Math.max(3, fs * 0.055));
    const K1 = (Math.PI * 2) / (fs * 1.25), K2 = (Math.PI * 2) / (fs * 0.5);
    const C = Object.assign({ hi: '#FF7A82', mid: '#E8001C', deep: '#8E000F', back: '#FF5862' }, cfg.colors || {});

    const defs = svg.querySelector('defs') || mk('defs', null, svg);
    stops(mk('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs), [[0, C.hi], [0.14, C.mid], [1, C.deep]]);
    stops(mk('radialGradient', { id: id + 'b' }, defs), [
      [0, 'rgba(255,255,255,.05)'], [0.58, 'rgba(255,255,255,.09)'], [0.8, 'rgba(255,255,255,.8)'],
      [0.92, 'rgba(255,255,255,.22)'], [1, 'rgba(255,255,255,0)']]);
    stops(mk('radialGradient', { id: id + 'c' }, defs), [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);

    group.removeAttribute('transform');
    while (group.firstChild) group.removeChild(group.firstChild);
    const pBack = mk('path', null, group);
    pBack.style.fill = C.back; pBack.style.opacity = '.55';
    const pBody = mk('path', null, group);
    pBody.style.fill = `url(#${id}g)`;
    const gCaus = mk('g', null, group);
    const caus = [0, 1, 2].map(() => {
      const e = mk('ellipse', { rx: (fs * rnd(0.55, 1)).toFixed(1), ry: (fs * rnd(0.09, 0.16)).toFixed(1) }, gCaus);
      e.style.fill = `url(#${id}c)`; e.style.opacity = '.22';
      return { e, ph: rnd(0, 6.28), sp: rnd(0.18, 0.4) };
    });
    const gBub = mk('g', null, group);
    const pGlint = mk('path', null, group);
    Object.assign(pGlint.style, {
      fill: 'none', stroke: 'rgba(255,255,255,.72)', strokeWidth: (fs * 0.017).toFixed(2), strokeLinecap: 'round',
      strokeDasharray: `${(fs * 0.62).toFixed(1)} ${(fs * 0.2).toFixed(1)} ${(fs * 0.09).toFixed(1)} ${(fs * 0.34).toFixed(1)}`,
    });

    const st = { level: cfg.start || 0, tilt: 0, tiltV: 0, bob: 0, bobV: 0, on: false };
    if (RM) st.level = cfg.level;
    // couleur du jus à la hauteur y (repère du SVG), au niveau final : le dégradé du corps
    // couvre sa boîte, de la crête des vagues (S - AMP) au bas du calque (BOT + fs)
    st.colorAt = (y) => {
      const y0 = BOT - cfg.level * HH - AMP, y1 = BOT + fs;
      return mixStops([[0, C.hi], [0.14, C.mid], [1, C.deep]], clamp((y - y0) / (y1 - y0), 0, 1));
    };

    const bubs = [];
    const spawn = (b, first) => {
      b.r = fs * rnd(0.016, 0.05);
      b.x = rnd(bb.x, bb.x + bb.width);
      b.y = first ? rnd(TOP + HH * 0.25, BOT) : BOT + b.r + rnd(0, fs * 0.3);
      b.v = fs * rnd(0.25, 0.6);
      b.ph = rnd(0, 6.28); b.w = fs * rnd(0.012, 0.03); b.pop = 0;
      return b;
    };
    const nb = RM ? 0 : (cfg.bubbles != null ? cfg.bubbles : 10);
    for (let i = 0; i < nb; i++) {
      const c = mk('circle', null, gBub); c.style.fill = `url(#${id}b)`;
      const h = mk('circle', null, gBub); h.style.fill = 'rgba(255,255,255,.92)';
      bubs.push(spawn({ c, h }, true));
    }

    const surf = (x, S, t, tilt) =>
      S + AMP * (0.62 * Math.sin(K1 * x + 2.1 * t) + 0.38 * Math.sin(K2 * x - 3.0 * t + 1.3)) + tilt * (x - CX) / HW;

    function render(t, dt) {
      if (cfg.slosh !== false && !RM) {
        const tT = clamp(SV.v * 0.00022 * fs, -fs * 0.2, fs * 0.2);
        const tB = clamp(-SV.v * 0.00018 * fs, -fs * 0.14, fs * 0.14);
        st.tiltV += (tT - st.tilt) * 0.14; st.tiltV *= 0.86; st.tilt += st.tiltV;
        st.bobV += (tB - st.bob) * 0.14; st.bobV *= 0.86; st.bob += st.bobV;
      }
      const agit = 1 + Math.min(1.1, Math.abs(st.tilt) / (fs * 0.12));
      const S = BOT - st.level * HH + st.bob;
      const tilt = st.tilt;
      let dF = '', dB = '', dG = '';
      for (let i = 0; i <= N; i++) {
        const x = X0 + (X1 - X0) * (i / N);
        const yF = S + (surf(x, S, t, tilt) - S) * agit;
        const yB = S - AMP * 0.8 + AMP * agit * (0.55 * Math.sin(K1 * 0.82 * x - 1.6 * t + 2) + 0.45 * Math.sin(K2 * 1.15 * x + 2.3 * t)) + tilt * 0.75 * (x - CX) / HW;
        const xs = x.toFixed(1);
        dF += (i ? ' L ' : 'M ') + xs + ' ' + yF.toFixed(1);
        dB += (i ? ' L ' : 'M ') + xs + ' ' + yB.toFixed(1);
        dG += (i ? ' L ' : 'M ') + xs + ' ' + (yF + fs * 0.016).toFixed(1);
      }
      const tail = ` L ${X1.toFixed(1)} ${(BOT + fs).toFixed(1)} L ${X0.toFixed(1)} ${(BOT + fs).toFixed(1)} Z`;
      pBody.setAttribute('d', dF + tail);
      pBack.setAttribute('d', dB + tail);
      pGlint.setAttribute('d', dG);
      pGlint.style.strokeDashoffset = (-t * fs * 0.42).toFixed(1);
      caus.forEach((c, i) => {
        c.e.setAttribute('cx', (CX + Math.sin(t * c.sp + c.ph) * HW * 0.85).toFixed(1));
        c.e.setAttribute('cy', (S + (BOT - S) * (0.32 + i * 0.2)).toFixed(1));
      });
      if (!dt) return;
      for (const b of bubs) {
        if (b.pop) {
          b.pop += dt;
          const k = b.pop / 0.16;
          b.c.setAttribute('r', (b.r * (1 + k * 0.9)).toFixed(2));
          b.c.style.opacity = b.h.style.opacity = Math.max(0, 1 - k).toFixed(2);
          if (k >= 1) { spawn(b, false); b.c.style.opacity = b.h.style.opacity = '0'; }
          continue;
        }
        b.v += fs * 0.35 * dt;
        b.y -= b.v * dt;
        b.x += Math.sin(b.ph + t * 3.4) * b.w * dt * 6;
        const grow = 1 + clamp((BOT - b.y) / HH, 0, 1) * 0.4;
        const r = b.r * grow;
        if (b.y - r <= surf(b.x, S, t, tilt)) { b.pop = 1e-4; continue; }
        const a = clamp((BOT + fs * 0.2 - b.y) / (fs * 0.25), 0, 1);
        b.c.setAttribute('cx', b.x.toFixed(1)); b.c.setAttribute('cy', b.y.toFixed(1)); b.c.setAttribute('r', r.toFixed(2));
        b.h.setAttribute('cx', (b.x - r * 0.36).toFixed(1)); b.h.setAttribute('cy', (b.y - r * 0.38).toFixed(1)); b.h.setAttribute('r', (r * 0.22).toFixed(2));
        b.c.style.opacity = b.h.style.opacity = a.toFixed(2);
      }
    }

    render(0, 0);
    if (RM) return st;
    loops.add((t, dt) => { if (st.on) render(t, dt); });
    let started = false;
    watch(svg, (vis) => {
      st.on = vis;
      if (vis && !started && cfg.mode !== 'scroll') {
        started = true;
        gsap.to(st, { level: cfg.level, duration: cfg.dur || 1.9, delay: cfg.delay || 0.25, ease: 'power2.out' });
      }
    });
    if (cfg.mode === 'scroll' && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create(Object.assign({}, cfg.scroll, {
        onUpdate: (s) => { gsap.to(st, { level: s.progress * cfg.level, duration: 0.6, ease: 'power2.out', overwrite: true }); },
      }));
    }
    return st;
  }

  const q = (s, root) => (root || document).querySelector(s);
  const clipGroup = (svg, clipId) => svg && svg.querySelector(`g[clip-path="url(#${clipId})"]`);

  // ACCUEIL — « bouscule » (hero cinéma : contour blanc, jus rouge)
  const bous = q('.bouscule-svg');
  if (bous) juice({ svg: bous, group: clipGroup(bous, 'bousClip'), shape: q('.bous-empty', bous), level: 0.8, delay: 0.9, bubbles: 9 });

  // HISTOIRE — « à l'empire. » (le contour rend visible la partie vide)
  const emp = q('#empireSvg');
  let empJuice = null;   // le tube de verre reprend la couleur de ce jus à la base du E
  if (emp) {
    const m = q('#empMeasure', emp);
    if (m) m.classList.add('emp-outline');
    // niveau ~80 % de la hauteur des capitales : la vague reste visible, l'accent du À reste vide
    empJuice = juice({ svg: emp, group: clipGroup(emp, 'empClip'), shape: m, level: 0.8, delay: 0.5, bubbles: 14, amp: 0.045 });
  }

  // HISTOIRE — « la légende. » se remplit au scroll
  const leg = q('#legendeSvg');
  if (leg) juice({
    // 0.7 : la surface passe juste sous la hauteur d'x → vague visible sur toutes les lettres
    svg: leg, group: clipGroup(leg, 'legTextClip'), shape: q('.leg-empty', leg), level: 0.7, desc: 0.24, bubbles: 14,
    mode: 'scroll', scroll: { trigger: leg.closest('.cta') || leg, start: 'top 92%', end: 'center 58%' },
  });

  // CONTACT — « TOUT » prend la couleur du profil choisi
  const tout = q('.ct-juice-svg');
  if (tout) juice({
    svg: tout, group: clipGroup(tout, 'ctcClip'), shape: q('.ct-empty', tout), level: 0.82, delay: 0.4, bubbles: 7,
    colors: {
      hi: 'color-mix(in srgb, var(--accent) 58%, #fff)', mid: 'var(--accent)',
      deep: 'color-mix(in srgb, var(--accent) 58%, #000)', back: 'color-mix(in srgb, var(--accent) 72%, #fff)',
    },
  });

  // FOOTER — DADA géant (toutes les pages) + easter egg : un clic fait pétiller
  const fd = q('.fd-svg');
  if (fd) {
    juice({ svg: fd, group: clipGroup(fd, 'fdClip'), shape: q('.fd-empty', fd), level: 0.88, delay: 0.1, bubbles: 12, cap: 0.72 });
    const wrap = fd.closest('.footer-dada');
    if (wrap && typeof dadaFizz === 'function') wrap.addEventListener('click', (e) => dadaFizz(e.clientX, e.clientY, 16));
  }

  /* ============================================================
     BULLES — calque DOM réutilisable
     Chaque bulle : liseré lumineux + reflet (CSS .bub), monte en accélérant,
     oscille, grossit (pression), puis éclate à une hauteur aléatoire.
     ============================================================ */
  function fizz(container, n, o) {
    if (!container || RM) return;
    o = Object.assign({ size: [4, 13], speed: [55, 120], top: [0.5, 0.97], cls: '' }, o || {});
    let W = container.clientWidth, H = container.clientHeight, on = false;
    new ResizeObserver(() => { W = container.clientWidth; H = container.clientHeight; }).observe(container);
    const items = [];
    const reset = (b, first) => {
      b.s = rnd(o.size[0], o.size[1]);
      b.el.style.width = b.el.style.height = b.s.toFixed(1) + 'px';
      b.x = rnd(0.04, 0.96); b.y = first ? rnd(0, H * 0.7) : -b.s;
      b.v = rnd(o.speed[0], o.speed[1]); b.ph = rnd(0, 6.28); b.f = rnd(1.3, 2.8); b.w = rnd(3, 12);
      b.top = rnd(o.top[0], o.top[1]) * H; b.pop = 0; b.a = 0; b.sc = 0.65;
      return b;
    };
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.className = 'bub ' + o.cls;
      container.appendChild(el);
      items.push(reset({ el }, true));
    }
    watch(container, (v) => { on = v; });
    loops.add((t, dt) => {
      if (!on || !H) return;
      for (const b of items) {
        const x = b.x * W + Math.sin(b.ph + t * b.f) * b.w;
        if (b.pop) {
          b.pop += dt;
          const k = b.pop / 0.18;
          b.el.style.opacity = Math.max(0, 1 - k).toFixed(2);
          b.el.style.transform = `translate3d(${x.toFixed(1)}px,${(-b.y).toFixed(1)}px,0) scale(${(b.sc * (1 + k * 0.8)).toFixed(3)})`;
          if (k >= 1) reset(b, false);
          continue;
        }
        b.v *= 1 + 0.4 * dt;
        b.y += b.v * dt;
        b.a = Math.min(1, b.a + dt * 2.2);
        b.sc = 0.62 + 0.5 * Math.min(1, b.y / H);
        b.el.style.opacity = b.a.toFixed(2);
        b.el.style.transform = `translate3d(${x.toFixed(1)}px,${(-b.y).toFixed(1)}px,0) scale(${b.sc.toFixed(3)})`;
        if (b.y >= b.top) b.pop = 1e-4;
      }
    });
  }
  fizz(q('#expBubbles'), 18, { cls: 'bub--accent', size: [5, 15] });
  fizz(q('#ctaBubbles'), 16, { size: [5, 16], speed: [45, 100] });
  window.DadaFX = { juice, fizz };

  /* ============================================================
     TUYAU DE L'HISTOIRE — tube de verre
     Le jus est le tracé lui-même (stroke) révélé par un masque en pointillé :
     il coule LE LONG de la courbe, front arrondi (ménisque), flux visible,
     bulles qui remontent vers « l'empire ». Coordonnées en px réels.
     ============================================================ */
  (function pipe() {
    const svg = q('#juicePipe');
    if (!svg) return;
    const box = svg.closest('.juice-pipe');
    const wrap = svg.closest('.story-wrap');
    const empSvg = q('#empireSvg');
    const measure = q('#empMeasure');
    const sub = q('.page-hero .ph-sub');
    const BASE = 170;                       // le haut du tube est déjà plein : le jus sort du « E »
    let W = 0, H = 0, tw = 32, len = 0, fillLen = BASE, target = BASE, on = false;
    let mPath, juiceP, flow1, flow2, glow, gBub, LUT = [], bubbles = [];
    // géométrie (px, repère de la boîte) : départ sous le E, puis couloir entre les colonnes
    const geo = { eX: 85, gX: 85, lane: 170, enter: 300, eW: 0, bY: 6 };
    const baseY = measure ? parseFloat(measure.getAttribute('y')) || 150 : 150;
    // couleur du jus du E juste au-dessus de sa base : le tube démarre exactement dans ce rouge
    const JC = (empJuice && empJuice.colorAt) ? empJuice.colorAt(baseY - 3) : 'rgb(207,0,24)';
    let seam = null;   // ouvre le contour du E là où le col s'y raccorde

    function place() {
      if (!box || !wrap) return;
      if (getComputedStyle(box).display === 'none') {
        box.removeAttribute('style'); if (sub) sub.style.maxWidth = '';
        if (seam) seam.style.display = 'none';
        return;
      }
      if (empSvg && measure) {
        let ext = null;
        try { ext = measure.getExtentOfChar(measure.getNumberOfChars() - 2); } catch (e) { /* police pas prête */ }
        if (ext) {
          const sr = empSvg.getBoundingClientRect();
          const scale = sr.width / 900;
          const eCx = sr.left + (ext.x + ext.width / 2) * scale;
          const eBot = sr.top + baseY * scale;         // ligne de base du E
          const wr = wrap.getBoundingClientRect();
          const topRel = eBot - wr.top - 8 * scale;     // léger chevauchement : le tube part de la lettre
          // couloir = gouttière entre l'image et le texte du 1er chapitre
          const st1 = wrap.querySelector('.story');
          let gapX = wr.width / 2, lane = 150, enter = 300;
          if (st1) {
            const m = st1.querySelector('.story-media').getBoundingClientRect();
            const t = st1.querySelector('.story-text').getBoundingClientRect();
            const L = m.left < t.left ? m : t, R = m.left < t.left ? t : m;
            gapX = (L.right + R.left) / 2 - wr.left;
            lane = Math.max(60, R.left - L.right);
            enter = st1.getBoundingClientRect().top - wr.top - topRel;
          }
          const eX = eCx - wr.left;
          // marge au-delà du couloir : le masque de fondu (.juice-pipe) rogne tout ce qui dépasse
          // de la boîte, halo compris — sans elle, un trait vertical net apparaît le long du texte
          const pad = Math.max(lane / 2, 50) + 72;
          const left = Math.min(eX, gapX) - pad, right = Math.max(eX, gapX) + pad;
          Object.assign(geo, { eX: eX - left, gX: gapX - left, lane, enter: Math.max(120, enter), eW: ext.width * scale, bY: 8 * scale });
          // même largeur que le haut du col (0.8 × E), moins le liseré : le contour reste aux coins
          if (!seam) { seam = document.createElementNS(NS, 'rect'); empSvg.appendChild(seam); }
          const sw = ext.width * 0.8 - 2.4 / scale;
          seam.setAttribute('x', (ext.x + ext.width / 2 - sw / 2).toFixed(2));
          seam.setAttribute('width', sw.toFixed(2));
          seam.setAttribute('y', (baseY - 2.4 / scale).toFixed(2));
          seam.setAttribute('height', (4.8 / scale).toFixed(2));
          seam.style.fill = JC;
          seam.style.display = '';
          box.style.transform = 'none';
          box.style.left = left.toFixed(1) + 'px';
          box.style.width = (right - left).toFixed(1) + 'px';
          box.style.top = topRel.toFixed(1) + 'px';
          box.style.height = (wrap.offsetHeight * 1.02 - topRel).toFixed(1) + 'px';
          // le texte d'intro s'arrête avant le tube (il passait dessous)
          if (sub) {
            sub.style.maxWidth = '';
            const s = sub.getBoundingClientRect();
            const avail = eCx - 34 - 26 - s.left;
            if (avail > 240 && avail < s.width) sub.style.maxWidth = Math.floor(avail) + 'px';
          }
        }
      }
      build();
    }

    function build() {
      W = box.clientWidth; H = box.clientHeight;
      if (W < 10 || H < 10) return;
      tw = clamp(geo.lane * 0.24, 22, 42);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // tracé central : tombe sous le E, glisse jusqu'au couloir, puis serpente dedans
      const A = Math.max(0, (geo.lane - tw - 10) / 2 - 6);
      const turns = Math.max(1, (H - geo.enter) / 1900);
      const px = (y) => {
        const k = smooth(clamp(y / geo.enter, 0, 1));
        const cx = geo.eX + (geo.gX - geo.eX) * k;
        const ramp = smooth(clamp((y - geo.enter * 0.8) / 420, 0, 1));
        return cx + A * ramp * Math.sin(((y - geo.enter * 0.8) / Math.max(1, H - geo.enter)) * Math.PI * 2 * turns);
      };
      const n = Math.ceil(H / 10);
      let d = '';
      for (let i = 0; i <= n; i++) {
        const y = (i / n) * H;
        d += (i ? ' L ' : 'M ') + px(y).toFixed(1) + ' ' + y.toFixed(1);
      }
      const id = 'pp' + (++uid);
      const defs = mk('defs', null, svg);
      stops(mk('linearGradient', { id: id + 'j', x1: 0, y1: 0, x2: 0, y2: H, gradientUnits: 'userSpaceOnUse' }, defs),
        [[0, JC], [1, '#9A000E']]);
      stops(mk('radialGradient', { id: id + 'b' }, defs), [
        [0, 'rgba(255,255,255,.08)'], [0.6, 'rgba(255,255,255,.12)'], [0.82, 'rgba(255,255,255,.85)'], [1, 'rgba(255,255,255,0)']]);
      stops(mk('radialGradient', { id: id + 'g' }, defs), [[0, 'rgba(255,90,99,.55)'], [1, 'rgba(255,90,99,0)']]);
      const mask = mk('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', x: -40, y: -40, width: W + 80, height: H + 80 }, defs);
      const line = (attrs, style, parent) => { const p = mk('path', Object.assign({ d, fill: 'none' }, attrs || {}), parent || svg); Object.assign(p.style, style || {}); return p; };
      const area = (dd, fill) => { const p = mk('path', { d: dd }, svg); p.style.fill = fill; return p; };

      // col sous le « E » : aussi large que la lettre à sa base, il se resserre jusqu'au tube
      // (le haut, sous la ligne de base, est caché par le E qui passe au premier plan)
      const bY = geo.bY, nTop = Math.max(tw / 2 + 2, (geo.eW || tw) * 0.4), nLen = Math.max(16, tw * 0.75);
      const yS = bY + 2, yE = yS + nLen;
      // le bas du col suit le tracé du tube (qui commence déjà à glisser vers le couloir)
      const neck = (inf, y0) => {
        const x = px(0), xb = px(yE), a = nTop + inf, b = tw / 2 + inf, f = (v) => v.toFixed(1);
        return `M ${f(x - a)} ${f(y0)} L ${f(x + a)} ${f(y0)} L ${f(x + a)} ${f(yS)} `
          + `C ${f(x + a)} ${f(yS + nLen * 0.55)} ${f(xb + b)} ${f(yS + nLen * 0.4)} ${f(xb + b)} ${f(yE)} `
          + `L ${f(xb - b)} ${f(yE)} C ${f(xb - b)} ${f(yS + nLen * 0.4)} ${f(x - a)} ${f(yS + nLen * 0.55)} ${f(x - a)} ${f(yS)} Z`;
      };
      // reflets et courant n'apparaissent qu'après le col : à la jonction, le liquide est uni
      stops(mk('linearGradient', { id: id + 'f', x1: 0, y1: yE * 0.7, x2: 0, y2: yE + tw * 1.4, gradientUnits: 'userSpaceOnUse' }, defs),
        [[0, '#000'], [1, '#fff']]);
      const fade = mk('mask', { id: id + 'h', maskUnits: 'userSpaceOnUse', x: -40, y: -40, width: W + 80, height: H + 80 }, defs);
      mk('rect', { x: -40, y: -40, width: W + 80, height: H + 80, fill: `url(#${id}f)` }, fade);

      // verre : col évasé, liseré fin + corps givré
      area(neck(4, bY), 'rgba(40,10,14,.13)');
      area(neck(2.5, bY), 'rgba(255,255,255,.78)');
      line(null, { stroke: 'rgba(40,10,14,.13)', strokeWidth: tw + 8 + 'px' });
      line(null, { stroke: 'rgba(255,255,255,.78)', strokeWidth: tw + 5 + 'px' });
      line(null, { stroke: 'rgba(226,0,26,.06)', strokeWidth: tw + 'px' });
      area(neck(0, 0), `url(#${id}j)`);   // le col est toujours plein
      // masque de remplissage (front arrondi = ménisque)
      mPath = line(null, { stroke: '#fff', strokeWidth: tw + 'px', strokeLinecap: 'round' }, mask);
      const g = mk('g', { mask: `url(#${id}m)` }, svg);
      juiceP = line(null, { stroke: `url(#${id}j)`, strokeWidth: tw + 'px' }, g);
      const gFlow = mk('g', { mask: `url(#${id}h)` }, g);
      flow1 = line(null, { stroke: 'rgba(255,255,255,.2)', strokeWidth: tw * 0.42 + 'px', strokeLinecap: 'round', strokeDasharray: '30 76' }, gFlow);
      flow2 = line({ transform: `translate(${(tw * 0.2).toFixed(1)} 0)` },
        { stroke: 'rgba(110,0,8,.24)', strokeWidth: tw * 0.16 + 'px', strokeLinecap: 'round', strokeDasharray: '12 64' }, gFlow);
      gBub = mk('g', null, g);
      // reflets du verre, par-dessus le jus
      const gHi = mk('g', { mask: `url(#${id}h)` }, svg);
      line({ transform: `translate(${(-tw * 0.27).toFixed(1)} 0)` }, { stroke: 'rgba(255,255,255,.88)', strokeWidth: Math.max(2, tw * 0.11) + 'px', strokeLinecap: 'round' }, gHi);
      line({ transform: `translate(${(tw * 0.33).toFixed(1)} 0)` }, { stroke: 'rgba(255,255,255,.42)', strokeWidth: Math.max(1.2, tw * 0.05) + 'px', strokeLinecap: 'round' }, gHi);
      glow = mk('circle', { r: (tw * 1.15).toFixed(1) }, svg);
      glow.style.fill = `url(#${id}g)`;

      len = juiceP.getTotalLength();
      mPath.style.strokeDasharray = `${len.toFixed(1)} ${(len + tw * 2).toFixed(1)}`;
      LUT = [];
      for (let s = 0; s <= len; s += 4) { const p = juiceP.getPointAtLength(s); LUT.push([p.x, p.y]); }
      bubbles = [];
      if (!RM) {
        for (let i = 0; i < 24; i++) {
          const c = mk('circle', null, gBub); c.style.fill = `url(#${id}b)`;
          bubbles.push({ c, s: rnd(0, BASE), v: rnd(70, 150), r: rnd(1.8, tw * 0.13), ph: rnd(0, 6.28), f: rnd(1.5, 3.2) });
        }
      }
      fillLen = RM ? len : clamp(fillLen, BASE, len);
      target = RM ? len : clamp(target, BASE, len);
      draw(0, 0);
    }

    const at = (s) => LUT[clamp(Math.round(s / 4), 0, LUT.length - 1)] || [W / 2, 0];

    function draw(t, dt) {
      if (!mPath) return;
      fillLen += (target - fillLen) * (dt ? Math.min(1, dt * 7) : 1);
      mPath.style.strokeDashoffset = '0';
      mPath.style.strokeDasharray = `${fillLen.toFixed(1)} ${(len + tw * 2).toFixed(1)}`;
      const f = at(fillLen);
      glow.setAttribute('cx', f[0].toFixed(1)); glow.setAttribute('cy', f[1].toFixed(1));
      glow.style.opacity = fillLen < len - 4 ? '1' : '0';
      if (!dt) return;
      flow1.style.strokeDashoffset = (-t * 95).toFixed(1);
      flow2.style.strokeDashoffset = (-t * 160).toFixed(1);
      for (const b of bubbles) {
        b.s -= b.v * dt;                                  // remonte le courant vers le mot
        if (b.s < 0) { b.s = Math.max(0, fillLen - rnd(10, 260)); b.v = rnd(70, 150); }
        const p = at(b.s);
        const lat = Math.sin(b.ph + t * b.f) * tw * 0.27;
        b.c.setAttribute('cx', (p[0] + lat).toFixed(1));
        b.c.setAttribute('cy', p[1].toFixed(1));
        b.c.setAttribute('r', b.r.toFixed(1));
      }
    }

    place();
    if (document.fonts) document.fonts.ready.then(place);
    window.addEventListener('load', place);
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { place(); if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 180); });
    if (RM) return;
    watch(box, (v) => { on = v; }, '200px 0px');
    loops.add((t, dt) => { if (on) draw(t, dt); });
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: wrap, start: 'top 72%', end: 'bottom 30%',
        onUpdate: (s) => { target = BASE + s.progress * Math.max(0, len - BASE); },
      });
    }
  })();

  /* ============================================================
     ÉVÉNEMENT — bandeau SIAL : statut calculé selon la date
     ============================================================ */
  document.querySelectorAll('[data-event-start]').forEach((el) => {
    const start = new Date(el.dataset.eventStart + 'T00:00:00');
    const end = new Date(el.dataset.eventEnd + 'T23:59:59');
    const now = new Date();
    const badge = el.querySelector('[data-event-badge]');
    const state = now < start ? 'soon' : now > end ? 'past' : 'live';
    el.dataset.eventState = state;
    if (badge) badge.textContent = state === 'live' ? 'En ce moment' : state === 'soon' ? 'Bientôt' : 'Merci pour vos visites';
  });
})();
