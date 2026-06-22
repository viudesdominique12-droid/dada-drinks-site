/* ============================================================
   DADA — Animated site
   GSAP + ScrollTrigger + Lenis
   ============================================================ */
gsap.registerPlugin(ScrollTrigger);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0,0);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE  = window.matchMedia('(pointer: coarse)').matches;

/* ---------- FLAVOR DATA ---------- */
const FLAVORS = [
  { id:'cola',        name:'Cola',          tag:'Le goût culte, version pétillante Dada.',   c:'#E2001A' },
  { id:'cola-zero',   name:'Cola Zéro',     tag:'Tout le goût du cola, zéro sucre.',         c:'#7A7A80' },
  { id:'cola-cherry', name:'Cola Cherry',   tag:'Cola + cerise, le combo qui claque.',       c:'#A8275E' },
  { id:'cerise',      name:'Cerise',        tag:'Rouge intense, fraîcheur qui réveille.',    c:'#C8102E' },
  { id:'fraise',      name:'Fraise',        tag:'La fraise plein fruit, plein peps.',        c:'#E63950' },
  { id:'litchi',      name:'Litchi',        tag:'Exotique, floral, carrément addictif.',     c:'#F26D8F' },
  { id:'lemon',       name:'Lemon',         tag:'Le citron qui te met une claque.',          c:'#4CAF50' },
  { id:'mangue',      name:'Mangue',        tag:'Un coup de soleil tropical en canette.',    c:'#1FA98C' },
  { id:'melon',       name:'Melon',         tag:'Doux, juteux, goût d’été.',                 c:'#F0A93B' },
  { id:'mojito',      name:'Mojito',        tag:'Menthe & citron vert, sans une goutte d’alcool.', c:'#8BC34A' },
  { id:'peche',       name:'Pêche',         tag:'La douceur de la pêche bien mûre.',         c:'#F2B872' },
  { id:'pomme',       name:'Pomme',         tag:'Pomme verte, croquante et nette.',          c:'#7CB342' },
  { id:'icetea',      name:'Ice Tea Pêche', tag:'Thé glacé pêche, façon Dada.',              c:'#E0A93B' },
];
const canSrc = id => `assets/cans/clean/${id}.png?v=2`;

/* ============================================================
   SMOOTH SCROLL (Lenis)
   ============================================================ */
let lenis;
if (!REDUCED && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ duration:1.1, smoothWheel:true, lerp:0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t)=> lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
}
function smoothScrollTo(target){
  if (lenis) lenis.scrollTo(target, { offset:0, duration:1.2 });
  else document.querySelector(target)?.scrollIntoView({behavior:'smooth'});
}

/* ============================================================
   SPLIT TEXT (custom, lightweight) — the "split reveal"
   ============================================================ */
function splitWords(el){
  const wrap = (node)=>{
    [...node.childNodes].forEach(child=>{
      if (child.nodeType === 3){
        const txt = child.textContent;
        if (!txt.trim()){ return; }
        const frag = document.createDocumentFragment();
        txt.split(/(\s+)/).forEach(tok=>{
          if (tok === '') return;
          if (/^\s+$/.test(tok)){ frag.appendChild(document.createTextNode(tok)); return; }
          const w = document.createElement('span'); w.className='r-word';
          const inner = document.createElement('span'); inner.className='r-inner';
          inner.textContent = tok;
          w.appendChild(inner); frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR' && child.tagName.toLowerCase() !== 'svg'){
        wrap(child);
      }
    });
  };
  wrap(el);
  return el.querySelectorAll('.r-inner');
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
if (!COARSE){
  const cur = document.querySelector('.cursor');
  const label = cur.querySelector('.cursor-label');
  const xTo = gsap.quickTo(cur,'x',{duration:0.35,ease:'power3'});
  const yTo = gsap.quickTo(cur,'y',{duration:0.35,ease:'power3'});
  window.addEventListener('mousemove', e=>{ xTo(e.clientX); yTo(e.clientY); });
  const hoverSel = 'a, button, [data-cursor], .fs-item, .flavor-card';
  document.querySelectorAll(hoverSel).forEach(el=>{
    el.addEventListener('mouseenter', ()=>{
      cur.classList.add('is-hover');
      label.textContent = el.getAttribute('data-cursor') || '';
    });
    el.addEventListener('mouseleave', ()=>{ cur.classList.remove('is-hover'); label.textContent=''; });
  });
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
if (!COARSE && !REDUCED){
  document.querySelectorAll('.btn, .nav-logo').forEach(btn=>{
    const strength = 0.4;
    btn.addEventListener('mousemove', e=>{
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width/2);
      const my = e.clientY - (r.top + r.height/2);
      gsap.to(btn,{x:mx*strength,y:my*strength,duration:0.5,ease:'power3'});
    });
    btn.addEventListener('mouseleave', ()=> gsap.to(btn,{x:0,y:0,duration:0.6,ease:'elastic.out(1,0.4)'}));
  });
}

/* ============================================================
   ANCHOR LINKS via Lenis
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if (id.length>1 && document.querySelector(id)){ e.preventDefault(); smoothScrollTo(id); }
  });
});

/* ============================================================
   NAV scroll state
   ============================================================ */
const nav = document.getElementById('nav');
if (nav) ScrollTrigger.create({ start:'top -60', onUpdate:self=>{
  nav.classList.toggle('scrolled', self.scroll() > 60);
}});
/* Accueil : nav cachée pendant l'intro + le zoom, révélée en entrant dans le hero */
const heroSection = document.getElementById('top');
const hasZoomIntro = document.getElementById('zoomParallax') && document.getElementById('intro');
if (nav && heroSection && hasZoomIntro && !REDUCED){
  nav.classList.add('nav-hidden');
  ScrollTrigger.create({ trigger: heroSection, start:'top 78%',
    onEnter:()=> nav.classList.remove('nav-hidden'),
    onLeaveBack:()=> nav.classList.add('nav-hidden') });
}

/* ---------- MOBILE MENU (burger) ---------- */
(function(){
  const burger = document.getElementById('burger');
  if (!burger || !nav) return;
  burger.setAttribute('aria-controls','nav');
  burger.setAttribute('aria-expanded','false');
  burger.setAttribute('aria-label','Menu');
  const setOpen = open => {
    nav.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  burger.addEventListener('click', ()=> setOpen(!nav.classList.contains('nav-open')));
  nav.querySelectorAll('.nav-links a, .btn-nav').forEach(a=>
    a.addEventListener('click', ()=> setOpen(false)));
  window.addEventListener('keydown', e=>{ if (e.key==='Escape') setOpen(false); });
})();

/* ============================================================
   BUILD FLAVOR CARDS — gamme (accueil) + boutique (particuliers) + packs (pros)
   ============================================================ */
function flavorCard(f, i){
  const card = document.createElement('article');
  card.className = 'flavor-card';
  card.style.setProperty('--c', f.c);
  card.setAttribute('data-cursor','Dada');
  card.innerHTML = `
    <div class="fc-glow"></div>
    <span class="fc-index">${String(i+1).padStart(2,'0')} / ${FLAVORS.length}</span>
    <img class="fc-can" src="${canSrc(f.id)}" alt="Dada ${f.name}" loading="lazy" />
    <div class="fc-meta">
      <h3 class="fc-name">${f.name}</h3>
      <p class="fc-tag">${f.tag}</p>
      <span class="fc-chip">Pétillante · 33cl</span>
    </div>`;
  return card;
}
const track = document.getElementById('gammeTrack');
if (track) FLAVORS.forEach((f,i)=> track.appendChild(flavorCard(f,i)));

const shopGrid = document.getElementById('shopGrid');
if (shopGrid){
  const shopSection = shopGrid.closest('.shop');
  FLAVORS.forEach((f,i)=>{
    const card = flavorCard(f,i);
    if (shopSection && !COARSE){
      // au survol : tout le fond de la section se teinte au parfum de la canette
      card.addEventListener('mouseenter', ()=>{ shopSection.style.backgroundColor = lightTint(f.c, 0.72); });
      card.addEventListener('mouseleave', ()=>{ shopSection.style.backgroundColor = ''; });
    }
    // bloc prix + ajouter au panier
    const meta = card.querySelector('.fc-meta');
    if (meta){
      const buy = document.createElement('div'); buy.className = 'fc-buy';
      buy.innerHTML = `<span class="fc-price">11,90&nbsp;€</span><button class="fc-add" type="button" data-cursor="Ajouter">Ajouter <span aria-hidden="true">+</span></button>`;
      buy.querySelector('.fc-add').addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); window.dadaAddToCart && window.dadaAddToCart({key:f.id, name:f.name, price:11.90, can:f.id, color:f.c}); });
      meta.appendChild(buy);
    }
    shopGrid.appendChild(card);
  });
}

const packGrid = document.getElementById('packGrid');
if (packGrid){
  const packsSection = packGrid.closest('.packs');
  FLAVORS.forEach((f,i)=>{
    const card = document.createElement('article');
    card.className = 'pack-card';
    card.style.setProperty('--c', f.c);
    card.innerHTML = `
      <div class="pk-glow"></div>
      <img src="${canSrc(f.id)}" alt="Dada ${f.name}" loading="lazy" />
      <div class="pk-meta"><h3>${f.name}</h3><span>Pack 24 × 33cl</span>
        <div class="pk-buy"><span class="pk-price">23,90&nbsp;€</span><button class="pk-add" type="button" data-cursor="Ajouter">Ajouter <span aria-hidden="true">+</span></button></div>
      </div>`;
    const padd = card.querySelector('.pk-add');
    if (padd) padd.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); window.dadaAddToCart && window.dadaAddToCart({key:f.id+'-pack', name:f.name+' · Pack 24', price:23.90, can:f.id, color:f.c}); });
    if (packsSection && !COARSE){
      // au survol : tout le fond de la section se teinte au parfum de la canette
      card.addEventListener('mouseenter', ()=>{ packsSection.style.backgroundColor = lightTint(f.c, 0.72); });
      card.addEventListener('mouseleave', ()=>{ packsSection.style.backgroundColor = ''; });
    }
    packGrid.appendChild(card);
  });
}

/* Frigos & PLV : boutons « Ajouter » (cartes statiques) */
document.querySelectorAll('.fr-add').forEach(btn=>{
  btn.addEventListener('click', e=>{ e.preventDefault();
    window.dadaAddToCart && window.dadaAddToCart({
      key: btn.dataset.key, name: btn.dataset.name,
      price: parseFloat(btn.dataset.price), img: btn.dataset.img, color:'#E2001A'
    });
  });
});

/* active nav link by current page */
(function(){
  const file = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a[data-page]').forEach(a=>{
    if (a.getAttribute('data-page') === file) a.classList.add('active');
  });
})();

/* ============================================================
   MARQUEE loops
   ============================================================ */
function marquee(sel, dur, dir=1){
  const el = document.querySelector(sel);
  if (!el || REDUCED) return;
  gsap.to(el, { xPercent:-50*dir, repeat:-1, duration:dur, ease:'none' });
}
marquee('.band-track', 26, 1);
marquee('.cm-track', 30, -1);
marquee('.photo-track', 55, 1);

/* hero background giant DADA marquee */
if (!REDUCED){
  gsap.to('.hmb-track', { xPercent:-50, repeat:-1, duration:40, ease:'none' });
}

/* ============================================================
   LOADER + HERO INTRO
   ============================================================ */
function heroIntroReduced(){
  // guarantee hero content is visible (used for reduced-motion + safety)
  gsap.set('.hero-title .w, .hero .eyebrow, .hero-sub, .hero-actions .btn, .hero-photo, .hero .scroll-cue',
    { clearProps:'all', opacity:1, autoAlpha:1, y:0, yPercent:0, scale:1 });
}

function startIntro(){
  const intro = document.getElementById('intro');
  if (!intro){ return; }            // sous-pages : pas d'intro split
  if (REDUCED){ intro.remove(); heroIntroReduced(); return; }
  // ONE master timeline: split intro, then hero reveal (no callback handoff)
  const tl = gsap.timeline({ defaults:{ ease:'power4.out' } });
  tl.set(intro, { display:'block' })
    .from('.intro-word', { opacity:0, duration:0.55, ease:'power2.out', stagger:0.05 })
    .fromTo('.intro-streak', { scaleX:0, opacity:1 }, { scaleX:1, duration:0.5, ease:'power3.inOut' }, '-=0.15')
    .to('.intro-streak', { opacity:0, duration:0.3 }, '+=0.02')
    .addLabel('split', '-=0.1')
    .to('.intro-top',    { yPercent:-100, duration:1.0, ease:'power4.inOut' }, 'split')
    .to('.intro-bottom', { yPercent: 100, duration:1.0, ease:'power4.inOut' }, 'split')
    .set(intro, { display:'none' }, 'split+=1.0');
  // le hero ne se révèle plus ici : il « atterrit » au scroll quand on y entre
  // (voir HERO PHOTO REVEAL plus bas)
}

/* ============================================================
   HERO CAN — interactive 3D tilt + idle float + bubbles
   ============================================================ */
const canWrap = document.getElementById('canWrap');
const heroStage = document.getElementById('heroStage');
const heroGlow  = document.getElementById('heroGlow');

if (!REDUCED && canWrap){
  gsap.to('.hero-mesh', { rotation:12, scale:1.15, xPercent:-4, duration:24, ease:'sine.inOut', yoyo:true, repeat:-1 });
  gsap.to(canWrap, { y:-18, duration:3, ease:'sine.inOut', yoyo:true, repeat:-1 });
  gsap.to('.float-fruit.f1', { y:-26, x:10, duration:4, ease:'sine.inOut', yoyo:true, repeat:-1 });
  gsap.to('.float-fruit.f2', { y:22, x:-12, duration:5, ease:'sine.inOut', yoyo:true, repeat:-1 });
  gsap.to('.float-fruit.f3', { y:-30, duration:4.6, ease:'sine.inOut', yoyo:true, repeat:-1 });
}
if (!COARSE && !REDUCED && heroStage && canWrap){
  const rotY = gsap.quickTo(canWrap,'rotationY',{duration:0.8,ease:'power3'});
  const rotX = gsap.quickTo(canWrap,'rotationX',{duration:0.8,ease:'power3'});
  const glowX = gsap.quickTo(heroGlow,'xPercent',{duration:1,ease:'power3'});
  const glowY = gsap.quickTo(heroGlow,'yPercent',{duration:1,ease:'power3'});
  heroStage.addEventListener('mousemove', e=>{
    const r = heroStage.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    rotY(px*26); rotX(-py*18);
    glowX(px*30-50); glowY(py*30-50);
  });
  heroStage.addEventListener('mouseleave', ()=>{ rotY(0); rotX(0); glowX(-50); glowY(-50); });
}

/* bubbles generator */
function makeBubbles(container, n){
  if (!container || REDUCED) return;
  for (let i=0;i<n;i++){
    const b = document.createElement('span');
    b.className = 'bubble';
    const size = gsap.utils.random(4,13);
    b.style.width = b.style.height = size+'px';
    b.style.left = gsap.utils.random(20,80)+'%';
    container.appendChild(b);
    const animate = ()=>{
      gsap.fromTo(b,
        { y:0, opacity:0 },
        { y:gsap.utils.random(-260,-440), opacity:0.6, duration:gsap.utils.random(3,6),
          ease:'sine.out', delay:gsap.utils.random(0,4),
          onStart:()=> gsap.set(b,{opacity:0.6}),
          onComplete:()=>{ gsap.set(b,{opacity:0}); animate(); } });
    };
    animate();
  }
}
makeBubbles(document.getElementById('bubbles'), 14);
makeBubbles(document.getElementById('expBubbles'), 16);

/* ============================================================
   FLAVOR SWITCHER (hero)
   ============================================================ */
const heroCan = document.getElementById('heroCan');
const switchEls = document.querySelectorAll('.flavor-switch .fs-item');
// preload
FLAVORS.forEach(f=>{ const im=new Image(); im.src=canSrc(f.id); });

function lightTint(hex, w){          // mix flavor color toward white (w = 0..1)
  const n = parseInt(hex.replace('#',''),16);
  const mix = c => Math.round(c + (255-c)*w);
  return `rgb(${mix((n>>16)&255)},${mix((n>>8)&255)},${mix(n&255)})`;
}
function applyFlavorTheme(accent){
  const root = document.documentElement.style;
  root.setProperty('--accent', accent);
  root.setProperty('--hero-tint', lightTint(accent, 0.72));
}

switchEls.forEach(btn=>{
  btn.style.color = btn.dataset.accent;
  btn.setAttribute('aria-label', 'Parfum ' + (btn.dataset.name||''));
  btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');
  btn.addEventListener('click', ()=>{
    switchEls.forEach(b=>{ b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed','true');
    applyFlavorTheme(btn.dataset.accent);
    const tl = gsap.timeline();
    tl.to(heroCan,{ y:30, opacity:0, scale:0.9, rotationZ:-6, duration:0.3, ease:'power2.in',
        onComplete:()=>{ heroCan.src = canSrc(btn.dataset.can); } })
      .to(heroCan,{ y:0, opacity:1, scale:1, rotationZ:0, duration:0.6, ease:'power3.out' });
  });
});
// set initial theme from the active flavor
applyFlavorTheme(document.querySelector('.fs-item.is-active')?.dataset.accent || '#E2001A');

/* ============================================================
   HERO PHOTO REVEAL — la photo « atterrit » et le texte se révèle
   quand on entre dans le hero (après le zoom)
   ============================================================ */
const heroPhoto = document.getElementById('heroPhoto');
if (heroPhoto && !REDUCED){
  const heroTL = gsap.timeline({ paused:true, defaults:{ ease:'power3.out' } });
  heroTL
    .fromTo(heroPhoto, { autoAlpha:0, scale:1.22, yPercent:7 },
                       { autoAlpha:1, scale:1, yPercent:0, duration:1.25, ease:'power4.out' })
    .fromTo('.hero .eyebrow',       { autoAlpha:0, y:20 }, { autoAlpha:1, y:0, duration:0.7 }, 0.18)
    .fromTo('.hero-title .w',        { yPercent:120 },      { yPercent:0, duration:1.0, stagger:0.07 }, 0.22)
    .fromTo('.hero-sub',            { autoAlpha:0, y:24 }, { autoAlpha:1, y:0, duration:0.8 }, 0.5)
    .fromTo('.hero-actions .btn',   { autoAlpha:0, y:24 }, { autoAlpha:1, y:0, duration:0.7, stagger:0.1 }, 0.6)
    .fromTo('.hero .scroll-cue',    { autoAlpha:0 },        { autoAlpha:1, duration:0.6 }, 0.85);
  ScrollTrigger.create({ trigger:'.hero', start:'top 72%', once:true, onEnter:()=> heroTL.play() });
}

/* ============================================================
   REVEAL (split lines slide-up) for headings
   ============================================================ */
gsap.utils.toArray('.reveal-lines:not(.big-statement)').forEach(el=>{
  const inners = splitWords(el);
  if (REDUCED){ return; }
  gsap.from(inners, {
    yPercent:120, duration:1, ease:'power4.out', stagger:0.05,
    scrollTrigger:{ trigger:el, start:'top 88%' }
  });
});

/* big statement : word-by-word brightness on scrub */
(function(){
  const el = document.querySelector('.big-statement');
  if (!el) return;
  const inners = splitWords(el);
  if (REDUCED) return;
  gsap.set(inners, { opacity:0.14 });
  gsap.to(inners, {
    opacity:1, ease:'none', stagger:0.5,
    scrollTrigger:{ trigger:el, start:'top 78%', end:'bottom 60%', scrub:true }
  });
})();

/* generic fade-up for paragraphs / cards */
function fadeUp(sel, opts={}){
  gsap.utils.toArray(sel).forEach(el=>{
    gsap.from(el, Object.assign({
      y:40, opacity:0, duration:1, ease:'power3.out',
      scrollTrigger:{ trigger:el, start:'top 90%' }
    }, opts));
  });
}
if (!REDUCED){
  fadeUp('.section-tag');
  fadeUp('.story-media', { y:50, scale:0.97 });
  fadeUp('.story-text p');
  fadeUp('.cult-card', { stagger:0.08, scrollTrigger:{ trigger:'.culture-grid', start:'top 82%' }});
  fadeUp('.gamme-intro .muted');
  fadeUp('.cta-inner > p, .newsletter, .cta-note');
  fadeUp('.retailers span', { y:30, stagger:0.06, scrollTrigger:{ trigger:'.retailers', start:'top 88%' }});
}

/* ============================================================
   COUNTERS
   ============================================================ */
gsap.utils.toArray('.num[data-count]').forEach(el=>{
  const end = +el.dataset.count;
  const suffix = el.dataset.suffix || '';
  const obj = { v:0 };
  ScrollTrigger.create({
    trigger:el, start:'top 90%', once:true,
    onEnter:()=> gsap.to(obj,{ v:end, duration:1.8, ease:'power2.out',
      onUpdate:()=> el.textContent = Math.round(obj.v) + suffix })
  });
});

/* ============================================================
   GAMME — horizontal pinned scroll
   ============================================================ */
const gammePin = document.getElementById('gammePin');
const GAMME_SWIPE = window.matchMedia('(max-width:760px)').matches;   // mobile → carrousel au doigt
if (!REDUCED && gammePin && track && !GAMME_SWIPE){
  const pin = gammePin;
  const bar = document.getElementById('gammeBar');
  pin.style.setProperty('--gamme-c', FLAVORS[0].c);
  const getDist = ()=> track.scrollWidth - window.innerWidth + window.innerWidth*0.12;
  gsap.to(track, {
    x: ()=> -getDist(),
    ease:'none',
    scrollTrigger:{
      trigger: pin,
      start:'top top',
      end: ()=> '+=' + getDist(),
      pin:true,
      scrub:1,
      invalidateOnRefresh:true,
      onUpdate:self=>{
        if(bar) bar.style.width = (self.progress*100)+'%';
        const idx = Math.min(FLAVORS.length-1, Math.floor(self.progress*FLAVORS.length*0.999));
        pin.style.setProperty('--gamme-c', FLAVORS[idx].c);
      }
    }
  });
} else if (gammePin && track && GAMME_SWIPE){
  // MOBILE : carrousel horizontal qui se fait glisser au doigt (snap),
  // fond teinté selon la canette centrée (pas de pin, scroll naturel)
  const pin = gammePin;
  pin.classList.add('is-swipe');
  pin.style.setProperty('--gamme-c', FLAVORS[0].c);
  let raf = 0;
  pin.addEventListener('scroll', ()=>{
    if (raf) return;
    raf = requestAnimationFrame(()=>{ raf = 0;
      const r = pin.getBoundingClientRect(), center = r.left + r.width/2;
      const cards = track.children; let best = 0, bd = 1e9;
      for (let i=0;i<cards.length;i++){ const cr = cards[i].getBoundingClientRect(); const d = Math.abs((cr.left+cr.width/2)-center); if (d<bd){ bd=d; best=i; } }
      pin.style.setProperty('--gamme-c', FLAVORS[Math.min(FLAVORS.length-1,best)].c);
    });
  }, { passive:true });
} else if (gammePin && track){
  track.style.flexWrap = 'wrap';
  gammePin.style.height = 'auto';
}

/* ============================================================
   EXPERIENCE — sticky, scrub can rotation + step switch
   ============================================================ */
(function(){
  const steps = gsap.utils.toArray('.exp-step');
  const expCan = document.getElementById('expCan');
  if (!steps.length) return;
  steps[0].classList.add('is-active');
  if (REDUCED){ steps.forEach(s=>s.classList.add('is-active')); return; }
  ScrollTrigger.create({
    trigger:'.experience', start:'top top', end:'bottom bottom', scrub:true,
    onUpdate:self=>{
      const p = self.progress;
      const idx = Math.min(steps.length-1, Math.floor(p*steps.length*0.999));
      steps.forEach((s,i)=> s.classList.toggle('is-active', i===idx));
      gsap.set(expCan, { rotationY:-16+p*32, y:(p-0.5)*-50, rotationZ:(p-0.5)*6 });
    }
  });
  // parallax the can column slightly
  gsap.to(expCan, { yPercent:-6, ease:'none',
    scrollTrigger:{ trigger:'.experience', start:'top bottom', end:'bottom top', scrub:true }});
})();

/* ============================================================
   HISTOIRE — scrollytelling (transitions par chapitre)
   ============================================================ */
const HISTOIRE = [
  { year:'90s',      cap:'Origines',   emoji:'🏙️', c:'#E2001A',
    title:"Nanterre, l'école de la débrouille",
    desc:"Une famille modeste dans le 92. Très tôt, les petits boulots s'enchaînent — marché, voiturier, bagagiste, livreur — puis une pizzeria qu'il remet à flot. La niaque comme moteur." },
  { year:'2006',     cap:'Le départ',  emoji:'🎒', c:'#F0A93B',
    title:"Sac sur le dos, cap sur l'ailleurs",
    desc:"Il quitte tout pour l'autre bout du monde. Australie, puis Asie du Sud-Est : il voyage, il observe, il goûte tout ce qui lui tombe sous la main." },
  { year:'Malaisie', cap:'Le déclic',  emoji:'🌴', c:'#1FA98C',
    title:'Une gorgée qui change tout',
    desc:"En Malaisie, une boisson pétillante et fruitée le marque. Rien de tel en France, où les rayons tournent en rond depuis des années. L'idée est née." },
  { year:'2007',     cap:'La création',emoji:'✨', c:'#E3023B',
    title:'Dada voit le jour',
    desc:"Retour au pays. Il ose une canette transparente, jamais vue, et un nom emprunté au mouvement Dada. La pétillante prend enfin une attitude." },
  { year:'2015',     cap:"L'ascension",emoji:'🔥', c:'#F26D8F',
    title:'La rue adopte la marque',
    desc:"Épiceries, snacks, terrasses… Dada devient un réflexe. Le bouche-à-oreille fait le reste et la communauté grandit, ville après ville." },
  { year:'2026',     cap:"Aujourd'hui",emoji:'🌍', c:'#E2001A',
    title:'Dans tous les rayons',
    desc:"13 parfums, la grande distribution, des collabs avec la scène rap. Dada côtoie les géants — sans jamais renier d'où elle vient." },
];

(function(){
  const stage   = document.getElementById('histStage');
  const route   = document.getElementById('histRoute');
  const section = document.querySelector('.histoire');
  const pin     = document.getElementById('histoirePin');
  if (!stage || !section || !route || !pin) return;
  const N = HISTOIRE.length;

  HISTOIRE.forEach((h,i)=>{
    const sc = document.createElement('article');
    sc.className = 'hist-scene';
    sc.style.setProperty('--hs-c', h.c);
    sc.innerHTML = `
      <div class="hs-text hs-inner">
        <span class="hs-year">${h.year}</span>
        <h2 class="hs-title">${h.title}</h2>
        <p class="hs-desc">${h.desc}</p>
      </div>
      <div class="hs-visual hs-inner">
        <div class="hs-orb"><span class="hs-emoji">${h.emoji}</span></div>
        <span class="hs-step">${String(i+1).padStart(2,'0')} / ${String(N).padStart(2,'0')}</span>
      </div>`;
    stage.appendChild(sc);
  });

  const line  = document.createElement('div'); line.className='hr-line';
  const fill  = document.createElement('div'); fill.className='hr-fill';
  const marks = document.createElement('div'); marks.className='hr-marks';
  line.appendChild(fill);
  HISTOIRE.forEach(h=>{
    const m = document.createElement('div'); m.className='hr-mark';
    m.innerHTML = `<span class="hr-dot"></span><span class="hr-cap">${h.cap}</span>`;
    marks.appendChild(m);
  });
  route.appendChild(line); route.appendChild(marks);

  const scenes  = [...stage.querySelectorAll('.hist-scene')];
  const inners  = scenes.map(s=>[...s.querySelectorAll('.hs-inner')]);
  const markEls = [...marks.children];

  if (REDUCED){
    scenes.forEach(s=>{ s.style.position='relative'; s.style.opacity=1; s.style.transform='none'; s.style.padding='60px clamp(20px,5vw,64px)'; });
    pin.style.position='static'; pin.style.height='auto';
    section.style.height='auto'; section.style.padding='80px 0';
    markEls.forEach(m=>m.classList.add('is-on'));
    return;
  }

  section.style.height = (N*88)+'vh';
  scenes[0].style.opacity = 1;
  pin.style.setProperty('--histoire-c', HISTOIRE[0].c);
  markEls[0].classList.add('is-on','is-current');

  ScrollTrigger.create({
    trigger: section, start:'top top', end:'bottom bottom', scrub:true, invalidateOnRefresh:true,
    onUpdate:self=>{
      const p = self.progress, t = p*N;
      scenes.forEach((sc,i)=>{
        const u  = t - (i+0.5);
        const op = Math.max(0, 1 - Math.abs(u)*1.5);
        sc.style.opacity = op.toFixed(3);
        sc.style.pointerEvents = op>0.5 ? 'auto' : 'none';
        const ty = (-u*70).toFixed(1)+'px';
        inners[i].forEach(el=> el.style.transform = `translateY(${ty})`);
      });
      const cur = Math.min(N-1, Math.floor(t*0.999));
      fill.style.width = (p*100).toFixed(2)+'%';
      markEls.forEach((m,i)=>{ m.classList.toggle('is-on', i<=cur); m.classList.toggle('is-current', i===cur); });
      pin.style.setProperty('--histoire-c', HISTOIRE[cur].c);
    }
  });
})();

/* ============================================================
   BAND tilt parallax on scroll
   ============================================================ */
if (!REDUCED){
  gsap.fromTo('.band-track', { x:0 }, { x:-80, ease:'none',
    scrollTrigger:{ trigger:'.band', start:'top bottom', end:'bottom top', scrub:true }});
}

/* ============================================================
   INIT
   ============================================================ */
/* ---------- VIBE VIDEO (collaborations) ---------- */
(function(){
  const v = document.getElementById('vibeVideo');
  const b = document.getElementById('vibeSound');
  if (!v) return;
  if (b) b.addEventListener('click', ()=>{
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(()=>{});
    b.textContent = v.muted ? '🔇' : '🔊';
    b.setAttribute('aria-label', v.muted ? 'Activer le son' : 'Couper le son');
  });
  const tryPlay = ()=>{ if (v.muted) v.play().catch(()=>{}); };
  // joue dès qu'elle entre dans le viewport
  if ('IntersectionObserver' in window){
    new IntersectionObserver(es => es.forEach(e=>{ if (e.isIntersecting) tryPlay(); }), { threshold:0 }).observe(v);
  }
  // filet : démarre au tout premier geste de l'utilisateur (navigateurs qui bloquent l'autoplay)
  const kick = ()=>{ tryPlay(); window.removeEventListener('pointerdown',kick); window.removeEventListener('scroll',kick); window.removeEventListener('keydown',kick); };
  window.addEventListener('pointerdown',kick,{passive:true});
  window.addEventListener('scroll',kick,{passive:true});
  window.addEventListener('keydown',kick);
})();

/* ---------- HISTOIRE : tuyau central courbé (jus + bulles) + mot-récipient ---------- */
(function(){
  const pipeSvg = document.getElementById('juicePipe');
  const legLiquid = document.getElementById('legLiquid');
  if (!pipeSvg && !legLiquid) return;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---- tuyau central qui serpente ---- */
  if (pipeSvg){
    const amp=20, halfW=15, steps=80, pts=[];
    // démarre centré (cx=50 en haut) pour tomber pile sous le E, puis serpente doucement
    for(let i=0;i<=steps;i++){ const y=i/steps*1000; const ramp=Math.min(1,y/260); pts.push([50+amp*ramp*Math.sin(y*0.0125), y]); }
    // largeur du tuyau : pleine en haut, s'amincit doucement vers le bas (le bas se fond en transparence via #pipeFade)
    const hwAt=(y)=> halfW*(1 - 0.5*Math.max(0,(y-680)/320));
    let d='M '+(pts[0][0]-halfW).toFixed(1)+' 0';
    pts.forEach(([cx,y])=> d+=' L '+(cx-hwAt(y)).toFixed(1)+' '+y.toFixed(1));
    for(let i=pts.length-1;i>=0;i--){ const [cx,y]=pts[i]; d+=' L '+(cx+hwAt(y)).toFixed(1)+' '+y.toFixed(1); }
    d+=' Z';
    document.getElementById('pipePath').setAttribute('d', d);
    document.getElementById('pipeTrackPath').setAttribute('d', d);
    const revealPath=document.getElementById('pipeRevealPath');
    const BASE=80;            // le haut du tuyau reste rempli : le jus « part » du mot l'empire
    let pipeH=BASE, pipePhase=0, pipeAmp=4;
    // front de jus fluide : somme de 2 ondes basses fréquences, échantillonné finement
    const drawPipe=()=>{ let p='M -10 0 L 110 0 L 110 '+pipeH.toFixed(1);
      for(let x=110;x>=-10;x-=2.5){
        const y=pipeH + Math.sin(x*0.045+pipePhase)*pipeAmp + Math.sin(x*0.083-pipePhase*0.6)*(pipeAmp*0.45);
        p+=' L '+x.toFixed(1)+' '+y.toFixed(2);
      }
      revealPath.setAttribute('d', p+' Z'); };
    if (REDUCED){ pipeH=1000; pipeAmp=0; drawPipe(); }
    else {
      drawPipe();
      ScrollTrigger.create({ trigger: pipeSvg.closest('.story-wrap'), start:'top 80%', end:'bottom 22%', scrub:true,
        onUpdate:self=>{ pipeH=BASE+self.progress*(1000-BASE); drawPipe(); } });
      gsap.to({p:0},{p:1,duration:2.6,ease:'none',repeat:-1,onUpdate:function(){ pipePhase=this.targets()[0].p*6.283; drawPipe(); }});
      const bub=document.getElementById('pipeBubbles');
      for(let i=0;i<34;i++){
        const b=document.createElement('span'); b.className='pbub';
        const s=gsap.utils.random(4,14); b.style.width=b.style.height=s+'px';
        b.style.left=gsap.utils.random(36,64)+'%'; bub.appendChild(b);
        const run=()=>{
          const peak=gsap.utils.random(0.5,0.9);
          const tl=gsap.timeline({delay:gsap.utils.random(0,4),onComplete:run});
          tl.fromTo(b,{bottom:'-5%',opacity:0,x:0,scale:0.5},
            {bottom:gsap.utils.random(94,110)+'%',x:gsap.utils.random(-16,16),scale:1,
             duration:gsap.utils.random(3,6),ease:'sine.out'},0)
            .to(b,{opacity:peak,duration:0.7,ease:'sine.out'},0)
            .to(b,{opacity:0,duration:1,ease:'sine.in'},'>-1.1');
        };
        run();
      }
    }
  }

  /* ---- mot « à l'empire. » (hero) = récipient rempli de jus : vagues + bulles ---- */
  const empSvg = document.getElementById('empireSvg');
  if (empSvg){
    const w1=document.getElementById('empWave1');
    const w2=document.getElementById('empWave2');
    // bande de jus ondulée (crête sinusoïdale) balayée horizontalement
    const band=(off,baseY,amp,thick)=>{
      let p='M -40 '+(baseY+Math.sin((-40+off)*0.026)*amp).toFixed(1);
      for(let x=-24;x<=940;x+=16) p+=' L '+x+' '+(baseY+Math.sin((x+off)*0.026)*amp).toFixed(1);
      for(let x=940;x>=-40;x-=16) p+=' L '+x+' '+(baseY+thick+Math.sin((x+off)*0.026)*amp).toFixed(1);
      return p+' Z';
    };
    if (REDUCED){ w1.setAttribute('d', band(0,54,0,22)); w2.setAttribute('d', band(0,98,0,20)); }
    else {
      gsap.to({v:0},{v:1,duration:3.4,ease:'none',repeat:-1,onUpdate:function(){ w1.setAttribute('d', band(this.targets()[0].v*180,54,10,24)); }});
      gsap.to({v:0},{v:1,duration:5.0,ease:'none',repeat:-1,onUpdate:function(){ w2.setAttribute('d', band(-this.targets()[0].v*150+40,98,12,20)); }});
      const gb=document.getElementById('empBubbles');
      for(let i=0;i<20;i++){
        const c=document.createElementNS(NS,'circle');
        c.setAttribute('r', gsap.utils.random(3,8).toFixed(1));
        c.setAttribute('cx', gsap.utils.random(8,884).toFixed(0));
        c.setAttribute('cy','210');
        c.setAttribute('fill','rgba(255,255,255,0.6)');
        gb.appendChild(c);
        const run=()=>gsap.fromTo(c,{attr:{cy:205},opacity:0},
          {attr:{cy:gsap.utils.random(20,120)},opacity:gsap.utils.random(0.5,0.85),duration:gsap.utils.random(2.3,4.8),ease:'sine.out',
           delay:gsap.utils.random(0,4),onComplete:()=>{gsap.set(c,{opacity:0});run();}});
        run();
      }
    }
  }

  /* ---- aligne le départ du tuyau pile sous le bas du « E » de l'empire ---- */
  if (pipeSvg && empSvg){
    const pipeEl = pipeSvg.closest('.juice-pipe');
    const sw = pipeSvg.closest('.story-wrap');
    const measure = document.getElementById('empMeasure');
    const placePipe = ()=>{
      if (!pipeEl || !sw || !measure) return;
      if (getComputedStyle(pipeEl).display === 'none'){ pipeEl.removeAttribute('style'); return; }
      let ext; try { ext = measure.getExtentOfChar(measure.getNumberOfChars()-2); } catch(e){ return; }
      const sr = empSvg.getBoundingClientRect();
      const scale = sr.width/900;
      const eCx  = sr.left + (ext.x + ext.width/2)*scale;     // centre horizontal du E
      const eBot = sr.top  + 150*scale;                       // ligne de base du E = bas VISIBLE de la lettre (y=150 viewBox)
      const wr = sw.getBoundingClientRect();
      const pw = pipeEl.offsetWidth;
      const topRel = eBot - wr.top - 11;                      // léger chevauchement : le jus part collé sous le E
      pipeEl.style.transform = 'none';
      pipeEl.style.left   = (eCx - wr.left - pw/2).toFixed(1)+'px';
      pipeEl.style.top    = topRel.toFixed(1)+'px';
      pipeEl.style.height = (sw.offsetHeight*1.04 - topRel).toFixed(1)+'px';
    };
    placePipe();
    document.fonts && document.fonts.ready.then(placePipe);
    window.addEventListener('load', placePipe);
    let prt; window.addEventListener('resize', ()=>{ clearTimeout(prt); prt=setTimeout(()=>{ placePipe(); if(window.ScrollTrigger) ScrollTrigger.refresh(); }, 180); });
  }

  /* ---- mot « la légende » = récipient qui se remplit ---- */
  if (legLiquid){
    const wave=document.getElementById('legWave');
    const buildWave=(off)=>{ let p='M -60 12'; for(let x=-60;x<=820;x+=20){ p+=' L '+x+' '+(12+Math.sin((x+off)*0.045)*9).toFixed(1); } return p+' L 820 760 L -60 760 Z'; };
    wave.setAttribute('d', buildWave(0));
    let level=0;
    const apply=()=> legLiquid.setAttribute('transform','translate(0,'+(188-level*180).toFixed(1)+')');
    apply();
    const MAXFILL=0.8;   // jamais 100 % : on garde la surface ondulée visible
    if (REDUCED){ level=MAXFILL; apply(); return; }
    ScrollTrigger.create({ trigger:'.cta', start:'top 92%', end:'center 58%', scrub:0.6,
      onUpdate:self=>{ level=self.progress*MAXFILL; apply(); } });
    gsap.to({v:0},{v:1,duration:2.6,ease:'none',repeat:-1,onUpdate:function(){ wave.setAttribute('d', buildWave(this.targets()[0].v*140)); }});
    const gb=document.getElementById('legBubbles');
    for(let i=0;i<22;i++){
      const c=document.createElementNS(NS,'circle');
      c.setAttribute('r', gsap.utils.random(3,10).toFixed(1));
      c.setAttribute('cx', gsap.utils.random(30,730).toFixed(0));
      c.setAttribute('cy', '580');
      c.setAttribute('fill','rgba(255,255,255,0.6)');
      gb.appendChild(c);
      const run=()=>gsap.fromTo(c,{attr:{cy:580},opacity:0},
        {attr:{cy:gsap.utils.random(35,145)},opacity:gsap.utils.random(0.55,0.9),duration:gsap.utils.random(2.2,4.8),ease:'sine.out',
         delay:gsap.utils.random(0,3.5),onComplete:()=>{gsap.set(c,{opacity:0});run();}});
      run();
    }
  }
})();

/* ============================================================
   PRO — « Pourquoi Dada » : deck de cartes qui défile au scroll
   ============================================================ */
(function(){
  const section = document.getElementById('benefitsDeck');
  const pin     = document.getElementById('deckPin');
  const stage   = document.getElementById('deckStage');
  const rail    = document.getElementById('deckRail');
  const counter = document.getElementById('deckCount');
  if (!section || !pin || !stage) return;                // main.js partagé → feature-test

  const BENEFITS = [
    {id:'cola',        c:'#E2001A', kick:'01 · Pourquoi Dada', title:'Marges attractives',
      desc:"Une tarification pensée pour les revendeurs, du déstockage rapide grâce à une forte rotation."},
    {id:'mangue',      c:'#1FA98C', kick:'02 · Le produit',    title:'Produit différenciant',
      desc:"La canette transparente et les parfums originaux attirent l'œil et déclenchent l'achat d'impulsion."},
    {id:'melon',       c:'#F0A93B', kick:'03 · Logistique',    title:'Livraison & stock',
      desc:"Packs 24×33cl, commandes simples, réassort rapide partout en France."},
    {id:'cola-cherry', c:'#A8275E', kick:'04 · La demande',    title:'Forte demande',
      desc:"Une communauté de dizaines de milliers de fans qui réclament Dada près de chez eux."},
    {id:'mojito',      c:'#8BC34A', kick:'05 · En rayon',      title:'Visibilité & PLV',
      desc:"Présentoirs et supports de communication pour mettre la marque en avant dans votre point de vente."},
    {id:'litchi',      c:'#F26D8F', kick:'06 · Le service',    title:'Accompagnement',
      desc:"Une équipe dédiée pour vous conseiller, du premier contact au réassort."}
  ];
  const N = BENEFITS.length;

  const cards = BENEFITS.map((b,i)=>{
    const el = document.createElement('article');
    el.className = 'bcard'; el.style.setProperty('--c', b.c);
    el.innerHTML =
      `<span class="bcard-ghost">${String(i+1).padStart(2,'0')}</span>
       <span class="bcard-chip">Atout ${String(i+1).padStart(2,'0')} / 0${N}</span>
       <div class="bcard-glow"></div>
       <img class="bcard-can" src="${canSrc(b.id)}" alt="Canette Dada ${b.title}" draggable="false" loading="lazy"/>
       <div class="bcard-text">
         <span class="bcard-kicker">${b.kick}</span>
         <h3 class="bcard-title">${b.title}</h3>
         <p class="bcard-desc">${b.desc}</p>
       </div>`;
    stage.appendChild(el); return el;
  });
  const ticks = BENEFITS.map((b,i)=>{
    const t = document.createElement('button'); t.className='deck-tick'; t.type='button';
    t.style.setProperty('--c', b.c); t.setAttribute('aria-label','Voir : '+b.title);
    rail && rail.appendChild(t); return t;
  });

  // Fallback : reduced-motion, pas de ScrollTrigger, ou MOBILE → pile verticale lisible
  // (sur petit écran l'animation du deck superpose les cartes/textes)
  if (REDUCED || typeof ScrollTrigger === 'undefined' || window.matchMedia('(max-width:760px)').matches){
    section.classList.add('is-static');
    cards.forEach(c=> c.classList.add('is-active'));
    ticks.forEach(t=> t.classList.add('is-on'));
    return;
  }

  section.style.height = ((N + 0.6) * 100) + 'svh';
  pin.style.setProperty('--deck-c', BENEFITS[0].c);
  cards[0].classList.add('is-active');
  ticks[0].classList.add('is-on','is-current');

  let dir = 1;
  const M = N - 1;          // intervalles : carte 0 centrée à p=0, carte N-1 à p=1
  const HOLD = 0.34;        // zone où la carte reste pleine/centrée → repos toujours propre
  const st = ScrollTrigger.create({
    trigger: section, start:'top top', end:'bottom bottom',
    scrub:true, invalidateOnRefresh:true,
    onUpdate: self => {
      dir = self.direction;
      const p = self.progress, t = p * M;
      const cur = Math.max(0, Math.min(N-1, Math.round(t)));
      cards.forEach((card,i)=>{
        const u = t - i, a = Math.abs(u);
        const k = a <= HOLD ? 0 : Math.min(1, (a - HOLD)/(1 - HOLD));   // 0 = centrée, 1 = partie
        let ty, sc, rot;
        if (u >= 0){ ty = -k*72;  sc = 1 + k*0.06; rot = (dir<0 ? k*4 : -k*4); }  // s'envole vers le haut
        else       { ty = k*120;  sc = 1 - k*0.14; rot = k*3; }                    // monte depuis le bas
        card.style.transform = `translate(-50%, calc(-50% + ${ty.toFixed(1)}px)) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
        card.style.opacity = Math.max(0, 1 - k*1.05).toFixed(3);
        card.style.zIndex = Math.round(100 - a*10);
        card.style.pointerEvents = (a < 0.5) ? 'auto' : 'none';
        card.classList.toggle('is-active', i === cur);
      });
      ticks.forEach((tk,i)=>{ tk.classList.toggle('is-on', i<=cur); tk.classList.toggle('is-current', i===cur); });
      pin.style.setProperty('--deck-c', BENEFITS[cur].c);
      if (counter) counter.textContent = String(cur+1).padStart(2,'0')+' / 0'+N;
    }
  });

  // a11y : clic sur une pastille → saute à la carte (centre = p=i/M)
  ticks.forEach((tk,i)=> tk.addEventListener('click', ()=>{
    const y = st.start + (i/M) * (st.end - st.start);
    if (lenis) lenis.scrollTo(y,{duration:0.7}); else window.scrollTo({top:y, behavior:'smooth'});
  }));
})();

/* ============================================================
   PANIER (mini-cart démo) — injecté sur toutes les pages
   ============================================================ */
(function(){
  const navEl = document.getElementById('nav');
  if (!navEl) return;
  const eur = n => n.toFixed(2).replace('.',',')+' €';

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem('dada-cart')||'{}') || {}; } catch(e){ cart = {}; }
  for (const k in cart){ const v=cart[k]; if(!v||typeof v!=='object'||typeof v.q!=='number'){ delete cart[k]; } }
  const save = ()=>{ try{ localStorage.setItem('dada-cart', JSON.stringify(cart)); }catch(e){} };
  const nItems = ()=> Object.values(cart).reduce((a,b)=>a+(b.q||0),0);
  const total  = ()=> Object.values(cart).reduce((a,b)=>a+(b.q||0)*(b.price||0),0);

  // --- bouton panier dans la nav (regroupé avec Contact) ---
  const toggle = document.createElement('button');
  toggle.className = 'cart-toggle'; toggle.type = 'button';
  toggle.setAttribute('aria-label','Panier'); toggle.setAttribute('data-cursor','Panier');
  toggle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg><span class="cart-count">0</span>`;
  const contactBtn = navEl.querySelector('.btn-nav');
  if (contactBtn){
    const actions = document.createElement('div'); actions.className = 'nav-actions';
    navEl.insertBefore(actions, contactBtn);
    actions.appendChild(toggle); actions.appendChild(contactBtn);
  } else { navEl.appendChild(toggle); }
  const countEl = toggle.querySelector('.cart-count');

  // --- overlay + tiroir ---
  const overlay = document.createElement('div'); overlay.className='cart-overlay';
  const drawer = document.createElement('aside'); drawer.className='cart-drawer'; drawer.setAttribute('aria-hidden','true');
  drawer.innerHTML = `<div class="cart-head"><h3>Ton panier</h3><button class="cart-close" type="button" aria-label="Fermer">✕</button></div>
    <div class="cart-body"></div><div class="cart-foot"></div>`;
  document.body.appendChild(overlay); document.body.appendChild(drawer);
  const body = drawer.querySelector('.cart-body');
  const foot = drawer.querySelector('.cart-foot');

  function renderBadge(){ const n=nItems(); countEl.textContent=n; toggle.classList.toggle('has-items', n>0); }
  function render(){
    renderBadge();
    const ids = Object.keys(cart).filter(id=>cart[id].q>0);
    if (!ids.length){
      body.innerHTML = `<p class="cart-empty">Ton panier est vide.<br/>Ajoute tes parfums préférés 🥤</p>`;
      foot.innerHTML = ''; return;
    }
    body.innerHTML = ids.map(id=>`<div class="cart-item" style="--c:${cart[id].color||'#E2001A'}">
      <img src="${cart[id].img || canSrc(cart[id].can)}" alt="" draggable="false"/>
      <div class="ci-info"><span class="ci-name">${cart[id].name}</span><span class="ci-price">${eur(cart[id].price)}</span></div>
      <div class="ci-qty"><button type="button" data-act="dec" data-id="${id}" aria-label="Moins">−</button><span>${cart[id].q}</span><button type="button" data-act="inc" data-id="${id}" aria-label="Plus">+</button></div>
      <button class="ci-remove" type="button" data-act="rm" data-id="${id}" aria-label="Retirer">✕</button></div>`).join('');
    foot.innerHTML = `<div class="cart-total"><span>Total</span><strong>${eur(total())}</strong></div>
      <button class="btn btn-primary cart-checkout" type="button">Commander</button>
      <p class="cart-note">Démo — aucun paiement réel.</p>`;
  }
  const open = ()=>{ render(); drawer.classList.add('is-open'); overlay.classList.add('is-open'); drawer.setAttribute('aria-hidden','false'); };
  const close = ()=>{ drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); drawer.setAttribute('aria-hidden','true'); };

  toggle.addEventListener('click', open);
  overlay.addEventListener('click', close);
  drawer.querySelector('.cart-close').addEventListener('click', close);
  window.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  body.addEventListener('click', e=>{
    const b = e.target.closest('button[data-act]'); if(!b) return;
    const id=b.dataset.id; if(!cart[id]) return;
    if(b.dataset.act==='inc') cart[id].q++;
    else if(b.dataset.act==='dec') cart[id].q--;
    else cart[id].q=0;
    if(cart[id].q<=0) delete cart[id];
    save(); render();
  });
  foot.addEventListener('click', e=>{
    if(!e.target.closest('.cart-checkout')) return;
    cart={}; save(); renderBadge();
    body.innerHTML = `<div class="cart-done"><span class="cart-done-ic">✓</span><h4>Commande confirmée !</h4><p>Merci d'avoir rejoint la team Dada. (Démo — rien n'est facturé.)</p></div>`;
    foot.innerHTML = '';
  });

  // exposé pour les boutons « Ajouter » de la boutique
  window.dadaAddToCart = (item)=>{ if(!item||!item.key) return;
    if(cart[item.key]) cart[item.key].q++;
    else cart[item.key]={q:1, name:item.name, price:item.price, can:item.can, img:item.img, color:item.color};
    save(); open(); };
  renderBadge();
})();

/* ---------- ACCUEIL : « bouscule » se remplit de jus ---------- */
(function(){
  const liquid = document.getElementById('bousLiquid');
  if (!liquid) return;
  const NS='http://www.w3.org/2000/svg';
  const wave = document.getElementById('bousWave');
  const buildWave=(off,tilt,amp)=>{ const k=tilt||0, a=(amp==null?9:amp); let p='M -40 10'; for(let x=-40;x<=520;x+=14){ const t=(x-240)/240; const y=10+Math.sin((x+off)*0.05)*a+Math.sin((x-off)*0.09)*(a*0.35)+k*t; p+=' L '+x+' '+y.toFixed(1); } return p+' L 520 200 L -40 200 Z'; };
  wave.setAttribute('d', buildWave(0,0,12));
  const MAX=0.8;
  let level=0;
  const apply=()=> liquid.setAttribute('transform','translate(0,'+(96 - level*96).toFixed(1)+')');
  apply();
  if (REDUCED){ level=MAX; apply(); return; }
  // remplissage une fois, après l'apparition du hero
  gsap.to({v:0},{v:MAX, duration:1.7, ease:'power2.out', delay:2.2, onUpdate:function(){ level=this.targets()[0].v; }});
  // ondulation + ballottement reactif au scroll (slosh par inertie)
  const clampS=(v,a,b)=>Math.max(a,Math.min(b,v));
  let slosh=0, sloshV=0, bob=0, bobV=0, lastY=window.pageYOffset;
  gsap.ticker.add((time, deltaTime)=>{
    const y=window.pageYOffset, dt=Math.max(8, deltaTime||16);
    const vel=(y-lastY)*1000/dt; lastY=y;                 // px/s : scroll vers le haut => vel negatif
    if (y < window.innerHeight*1.3){
      const tS=clampS(vel*0.024,-28,28);                  // inclinaison de la surface (bien marquee)
      const tB=clampS(-vel*0.020,-24,24);                 // inertie verticale : scroll haut => jus vers le bas
      sloshV+=(tS-slosh)*0.16; sloshV*=0.85; slosh+=sloshV;
      bobV+=(tB-bob)*0.16;     bobV*=0.85;   bob+=bobV;
    } else { slosh=0;sloshV=0;bob=0;bobV=0; }
    const amp = 12 + Math.min(11, Math.abs(slosh)*0.55);   // vagues plus prononcees, encore plus agitees pendant le ballottement
    wave.setAttribute('d', buildWave(time*55, slosh, amp));
    liquid.setAttribute('transform','translate(0,'+(96 - level*96 + bob).toFixed(2)+')');
  });
  // bulles
  const gb=document.getElementById('bousBubbles');
  for(let i=0;i<12;i++){
    const c=document.createElementNS(NS,'circle');
    c.setAttribute('r', gsap.utils.random(3,8).toFixed(1));
    c.setAttribute('cx', gsap.utils.random(20,460).toFixed(0));
    c.setAttribute('cy','170');
    c.setAttribute('fill','rgba(255,255,255,0.6)');
    gb.appendChild(c);
    const run=()=>gsap.fromTo(c,{attr:{cy:170},opacity:0},{attr:{cy:gsap.utils.random(24,80)},opacity:gsap.utils.random(0.5,0.85),duration:gsap.utils.random(2.2,4.5),ease:'sine.out',delay:gsap.utils.random(1.5,5),onComplete:()=>{gsap.set(c,{opacity:0});run();}});
    run();
  }
})();

/* ---------- ACCUEIL : zoom-parallax (intro au scroll) ---------- */
(function(){
  const zoom = document.getElementById('zoomParallax');
  if (!zoom || REDUCED || typeof ScrollTrigger === 'undefined') return;
  const els = gsap.utils.toArray('#zoomParallax .zoom-el');
  const scales = [4, 5, 6, 5, 6, 8, 9];   // la 1re (centre = mec à la canette) remplit l'écran
  els.forEach((el,i)=>{
    gsap.to(el, { scale: scales[i] || 5, ease:'none',
      scrollTrigger:{ trigger: zoom, start:'top top', end:'bottom bottom', scrub:true, invalidateOnRefresh:true }});
  });
})();

/* ============================================================
   CONTACT — profil interactif, jauge canette, confirmation, FAQ
   ============================================================ */
(function(){
  const form = document.getElementById('ctForm');
  if (!form) return;
  const rootS = document.documentElement.style;
  const tint = (typeof lightTint === 'function') ? lightTint : (h)=>h;

  const PROFILES = {
    particulier:{ accent:'#E2001A', extra:'Sujet',
      help:`<h4>Par email</h4><p>Une question conso, un avis, une idée&nbsp;? Écris à <a href="mailto:hello@dadadrinks.com">hello@dadadrinks.com</a> — réponse sous ~24&nbsp;h.</p>` },
    pro:{ accent:'#1FA98C', extra:'Société',
      help:`<h4>Espace Pro</h4><p>Revente, distribution, CHR&nbsp;: passe par l'<a href="professionnels.html">espace pro</a> ou <a href="mailto:pro@dadadrinks.com">pro@dadadrinks.com</a>. Packs 24×33, frigos &amp; PLV.</p>` },
    presse:{ accent:'#A8275E', extra:'Média / publication',
      help:`<h4>Presse &amp; média</h4><p>Interviews, visuels, dossier de presse&nbsp;: <a href="mailto:presse@dadadrinks.com">presse@dadadrinks.com</a>. On traite en priorité.</p>` },
    collab:{ accent:'#E3023B', extra:'Projet / lien (IG, portfolio)',
      help:`<h4>Collabs &amp; artistes</h4><p>Une idée qui bouscule&nbsp;? Glisse ton lien. Musique, street, art — on adore. Voir nos <a href="collaborations.html">collabs</a>.</p>` },
  };

  const pfBtns = form.querySelectorAll('.ct-pf');
  const extraLabel = document.getElementById('ctExtraLabel');
  const help = document.getElementById('ctHelp');
  function applyProfile(key){
    const p = PROFILES[key]; if(!p) return;
    pfBtns.forEach(b=>{ const on=b.dataset.profil===key; b.classList.toggle('is-active',on); b.setAttribute('aria-selected', on?'true':'false'); });
    rootS.setProperty('--accent', p.accent);
    rootS.setProperty('--hero-tint', tint(p.accent, 0.82));
    if (extraLabel) extraLabel.textContent = p.extra;
    if (help) help.innerHTML = p.help;
  }
  pfBtns.forEach(b=> b.addEventListener('click', ()=> applyProfile(b.dataset.profil)));
  applyProfile('particulier');

  /* ---- jauge canette ---- */
  const juice = document.getElementById('ctJuice');
  const wave  = document.getElementById('ctWave');
  const pctEl = document.getElementById('ctPct');
  const labEl = document.getElementById('ctGaugeLab');
  const fields = ['nom','email','extra','msg'].map(id=>document.getElementById(id)).filter(Boolean);
  const H=172, TOP=30;
  let level=0, shown=0;
  const buildWave=(off,amp)=>{ let p='M 16 '+TOP; for(let x=16;x<=104;x+=8){ const y=TOP+Math.sin((x+off)*0.16)*amp; p+=' L '+x+' '+y.toFixed(1);} return p+' L 104 240 L 16 240 Z'; };
  function setGauge(){
    let n=0; fields.forEach(f=>{ if((f.value||'').trim()) n++; });
    level = fields.length ? n/fields.length : 0;
    if (pctEl) pctEl.textContent = Math.round(level*100)+'%';
    if (labEl) labEl.textContent = level>=1 ? 'Prêt à envoyer !' : (level>0 ? 'Continue…' : 'Remplis pour envoyer');
  }
  fields.forEach(f=> f.addEventListener('input', setGauge));
  if (!REDUCED && juice && wave){
    const NS='http://www.w3.org/2000/svg';
    const gb=document.getElementById('ctBubbles');
    for(let i=0;i<5;i++){ const c=document.createElementNS(NS,'circle');
      c.setAttribute('r',(1.6+Math.random()*1.7).toFixed(1)); c.setAttribute('cx',(30+Math.random()*60).toFixed(0)); c.setAttribute('cy','200'); c.setAttribute('fill','rgba(255,255,255,.7)'); gb.appendChild(c);
      const run=()=>gsap.fromTo(c,{attr:{cy:198},opacity:0},{attr:{cy:TOP+8},opacity:.8,duration:2+Math.random()*2,ease:'sine.out',delay:Math.random()*3,onComplete:()=>{gsap.set(c,{opacity:0});run();}}); run(); }
    gsap.ticker.add((time)=>{
      shown += (level-shown)*0.12;
      juice.setAttribute('transform','translate(0,'+((1-shown)*H).toFixed(1)+')');
      wave.setAttribute('d', buildWave(time*60, 2.4));
    });
  } else if (juice && wave){ wave.setAttribute('d', buildWave(0,0)); juice.setAttribute('transform','translate(0,'+H+')'); }
  setGauge();

  /* ---- envoi -> confirmation ---- */
  const success = document.getElementById('ctSuccess');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const nom=document.getElementById('nom'), email=document.getElementById('email'), msg=document.getElementById('msg');
    let ok=true;
    [nom,email,msg].forEach(f=>{ if(!f.value.trim()){ ok=false; f.classList.add('ct-invalid'); } else f.classList.remove('ct-invalid'); });
    if(email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)){ ok=false; email.classList.add('ct-invalid'); }
    if(!ok){ if(!REDUCED) gsap.fromTo(form.querySelector('.ct-send'),{x:-7},{x:0,duration:.5,ease:'elastic.out(1,0.3)'}); return; }
    level=1; setGauge();
    success.hidden=false;
    if(!REDUCED){
      gsap.fromTo(success,{autoAlpha:0},{autoAlpha:1,duration:.4});
      gsap.fromTo('.ct-success-ic',{scale:0,rotate:-30},{scale:1,rotate:0,duration:.7,ease:'back.out(2)',delay:.1});
      gsap.fromTo('.ct-splash',{scale:0,autoAlpha:0},{scale:1,autoAlpha:1,duration:.8,ease:'power3.out'});
      gsap.fromTo('.ct-success h3, .ct-success p, #ctReset',{y:18,autoAlpha:0},{y:0,autoAlpha:1,duration:.6,stagger:.08,delay:.2});
    }
  });
  const reset=document.getElementById('ctReset');
  if(reset) reset.addEventListener('click', ()=>{ form.reset(); success.hidden=true; setGauge();
    ['nom','email','msg'].forEach(id=>document.getElementById(id).classList.remove('ct-invalid')); });

  /* ---- FAQ accordéon ---- */
  document.querySelectorAll('#faqList .faq-q').forEach(q=>{
    const a=q.nextElementSibling;
    q.addEventListener('click', ()=>{
      const open=q.getAttribute('aria-expanded')==='true';
      document.querySelectorAll('#faqList .faq-q').forEach(o=>{ if(o!==q){ o.setAttribute('aria-expanded','false'); o.nextElementSibling.style.maxHeight=null; } });
      q.setAttribute('aria-expanded', open?'false':'true');
      a.style.maxHeight = open ? null : a.scrollHeight+'px';
    });
  });
})();

/* ---------- CONTACT : le mot « TOUT » se remplit de jus ---------- */
(function(){
  const liquid=document.getElementById('ctcLiquid'); if(!liquid) return;
  const NS='http://www.w3.org/2000/svg';
  const wave=document.getElementById('ctcWave');
  const buildWave=(off,tilt,amp)=>{ const k=tilt||0,a=(amp==null?8:amp); let p='M -40 12'; for(let x=-40;x<=340;x+=12){ const t=(x-150)/150; const y=12+Math.sin((x+off)*0.05)*a+Math.sin((x-off)*0.09)*(a*0.4)+k*t; p+=' L '+x+' '+y.toFixed(1);} return p+' L 340 200 L -40 200 Z'; };
  wave.setAttribute('d', buildWave(0,0,9));
  const MAX=0.82; let level=0;
  const apply=()=> liquid.setAttribute('transform','translate(0,'+(96-level*96).toFixed(1)+')');
  apply();
  if(REDUCED){ level=MAX; apply(); return; }
  gsap.to({v:0},{v:MAX,duration:1.6,ease:'power2.out',delay:.5,onUpdate:function(){ level=this.targets()[0].v; }});
  let lastY=window.pageYOffset, slosh=0,sloshV=0,bob=0,bobV=0;
  const clampS=(v,a,b)=>Math.max(a,Math.min(b,v));
  gsap.ticker.add((time,dt)=>{
    const y=window.pageYOffset, d=Math.max(8,dt||16); const vel=(y-lastY)*1000/d; lastY=y;
    if(y<window.innerHeight*1.3){ const tS=clampS(vel*0.02,-22,22), tB=clampS(-vel*0.018,-20,20); sloshV+=(tS-slosh)*0.16; sloshV*=0.85; slosh+=sloshV; bobV+=(tB-bob)*0.16; bobV*=0.85; bob+=bobV; } else { slosh=0;sloshV=0;bob=0;bobV=0; }
    const amp=9+Math.min(9,Math.abs(slosh)*0.5);
    wave.setAttribute('d', buildWave(time*55, slosh, amp));
    liquid.setAttribute('transform','translate(0,'+(96-level*96+bob).toFixed(2)+')');
  });
  const gb=document.getElementById('ctcBubbles');
  for(let i=0;i<8;i++){ const c=document.createElementNS(NS,'circle');
    c.setAttribute('r',gsap.utils.random(2.5,6).toFixed(1)); c.setAttribute('cx',gsap.utils.random(10,290).toFixed(0)); c.setAttribute('cy','180'); c.setAttribute('fill','rgba(255,255,255,0.6)'); gb.appendChild(c);
    const run=()=>gsap.fromTo(c,{attr:{cy:180},opacity:0},{attr:{cy:gsap.utils.random(22,70)},opacity:gsap.utils.random(0.4,0.8),duration:gsap.utils.random(2,4),ease:'sine.out',delay:gsap.utils.random(1,5),onComplete:()=>{gsap.set(c,{opacity:0});run();}}); run();
  }
})();

function boot(){ startIntro(); ScrollTrigger.refresh(); }
if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot);
// safety refresh after fonts
document.fonts && document.fonts.ready.then(()=> ScrollTrigger.refresh());
// safety: never let the intro trap the page
setTimeout(()=>{ const i=document.getElementById('intro'); if(i && getComputedStyle(i).display!=='none'){ i.style.display='none'; heroIntroReduced(); } }, 6000);
