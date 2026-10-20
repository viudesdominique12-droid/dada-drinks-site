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
  { id:'fraise',      name:'Fraise',        tag:'La fraise qui pétille, plein peps.',        c:'#E63950' },
  { id:'litchi',      name:'Litchi',        tag:'Exotique, floral, carrément addictif.',     c:'#F26D8F' },
  { id:'lemon',       name:'Lemon',         tag:'Le citron qui te met une claque.',          c:'#4CAF50' },
  { id:'mangue',      name:'Mangue',        tag:'Un coup de soleil tropical en canette.',    c:'#1FA98C' },
  { id:'melon',       name:'Melon',         tag:'Doux, juteux, goût d’été.',                 c:'#F0A93B' },
  { id:'mojito',      name:'Mojito',        tag:'Menthe & citron vert, sans une goutte d’alcool.', c:'#8BC34A' },
  { id:'peche',       name:'Pêche',         tag:'La douceur de la pêche bien mûre.',         c:'#F2B872' },
  { id:'pomme',       name:'Pomme',         tag:'Pomme verte, croquante et nette.',          c:'#7CB342' },
  { id:'icetea',      name:'Ice Tea Pêche', tag:'Thé glacé pêche, façon Dada.',              c:'#E0A93B' },
];
const canSrc = id => `assets/cans/clean/${id}.png?v=4`;
/* canette « vivante » : l'image + reflet métal + buée, les calques sont
   découpés à la silhouette exacte via mask-image (--can).
   --can doit être une URL ABSOLUE : un url() relatif dans une variable CSS se
   résout depuis la feuille de style (css/) et non depuis la page → 404. */
const canAbs = (id) => new URL(canSrc(id), location.href).href;
const canFX = (id, cls, label) =>
  `<span class="can-fx ${cls}" style="--can:url('${canAbs(id)}')" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>` +
  `<img class="can-fx__img" src="${canSrc(id)}" alt="" draggable="false" loading="lazy" />` +
  `<span class="can-fx__sheen"></span><span class="can-fx__frost"></span></span>`;
// canettes écrites en dur dans le HTML : silhouette posée ici, en absolu
document.querySelectorAll('.can-fx').forEach((el) => {
  const im = el.querySelector('img');
  if (im) el.style.setProperty('--can', `url("${im.src}")`);
});

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

/* ---------- MOBILE MENU (burger) : panneau compact sous l'en-tête ---------- */
(function(){
  const burger = document.getElementById('burger');
  if (!burger || !nav) return;
  const here = location.pathname.split('/').pop() || 'index.html';
  const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
  const sheet = document.createElement('div');
  sheet.className = 'nav-sheet'; sheet.id = 'navSheet';
  sheet.innerHTML = `<nav class="ns-grid" aria-label="Menu">${[...nav.querySelectorAll('.nav-links a')].map(a =>
      `<a href="${a.getAttribute('href')}"${a.dataset.page === here ? ' class="is-here" aria-current="page"' : ''}>${a.textContent}${chev}</a>`).join('')}</nav>
    <div class="ns-foot">
      <a class="ns-contact" href="contact.html">Contact <span class="btn-dot"></span></a>
      <a class="ns-wa" href="https://wa.me/33782206131" target="_blank" rel="noopener" aria-label="Écrire à Dada sur WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.870 9.870 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.860 9.860 0 0 1-1.510-5.260c.001-5.450 4.436-9.884 9.888-9.884c2.640 0 5.122 1.030 6.988 2.898a9.820 9.820 0 0 1 2.893 6.994c-.003 5.450-4.437 9.884-9.885 9.884m8.413-18.297A11.820 11.820 0 0 0 12.050 0C5.495 0 .160 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.900 11.900 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.820 11.820 0 0 0-3.480-8.413"/></svg></a>
    </div>`;
  nav.appendChild(sheet);
  const scrim = document.createElement('div');
  scrim.className = 'nav-scrim'; document.body.appendChild(scrim);
  burger.setAttribute('aria-controls', 'navSheet');
  let openY = 0;
  const setOpen = open => {
    nav.classList.toggle('nav-open', open); scrim.classList.toggle('is-on', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Menu');
    openY = window.pageYOffset;
  };
  setOpen(false);
  burger.addEventListener('click', ()=> setOpen(!nav.classList.contains('nav-open')));
  scrim.addEventListener('click', ()=> setOpen(false));
  sheet.addEventListener('click', e=>{ if (e.target.closest('a')) setOpen(false); });
  window.addEventListener('keydown', e=>{ if (e.key==='Escape') setOpen(false); });
  // on referme dès qu'on fait défiler la page, ou si l'écran s'élargit
  window.addEventListener('scroll', ()=>{ if (nav.classList.contains('nav-open') && Math.abs(window.pageYOffset - openY) > 60) setOpen(false); }, {passive:true});
  window.matchMedia('(min-width:681px)').addEventListener('change', e=>{ if (e.matches) setOpen(false); });
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
    ${canFX(f.id, 'fc-can', 'Dada ' + f.name)}
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
    // bloc prix + ajouter au panier — tarif de la boutique officielle : pack de 24 × 33 cl à 32 €
    const chip = card.querySelector('.fc-chip');
    if (chip) chip.textContent = 'Pack de 24 × 33 cl';
    const meta = card.querySelector('.fc-meta');
    if (meta){
      const buy = document.createElement('div'); buy.className = 'fc-buy';
      buy.innerHTML = `<span class="fc-price">32,00&nbsp;€<small>le pack</small></span><div class="fc-ctl" data-id="${f.id}"></div>`;
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
    card.dataset.id = f.id;
    card.style.setProperty('--c', f.c);
    card.innerHTML = `
      <div class="pk-glow"></div>
      <span class="pk-n" aria-hidden="true">0</span>
      ${canFX(f.id, 'pk-can', 'Dada ' + f.name)}
      <div class="pk-meta"><h3>${f.name}</h3><span>Pack 24 × 33 cl</span></div>
      <div class="pk-ctl" role="group" aria-label="Packs de ${f.name} dans ta palette">
        <button type="button" data-pal="dec" aria-label="Un pack de ${f.name} en moins">−</button>
        <input type="number" inputmode="numeric" min="0" max="100" step="1" value="0" data-pal="set" aria-label="Nombre de packs de ${f.name}" />
        <button type="button" data-pal="inc" aria-label="Un pack de ${f.name} en plus">+</button>
      </div>`;
    if (packsSection && !COARSE){
      // au survol : tout le fond de la section se teinte au parfum de la canette
      card.addEventListener('mouseenter', ()=>{ packsSection.style.backgroundColor = lightTint(f.c, 0.72); });
      card.addEventListener('mouseleave', ()=>{ packsSection.style.backgroundColor = ''; });
    }
    packGrid.appendChild(card);
  });
}

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

/* enseignes (accueil) : défilement continu, ralenti au survol */
(function(){
  const track = document.querySelector('.retailers-track');
  if (!track || REDUCED) return;
  const loop = gsap.to(track, { xPercent:-50, repeat:-1, duration:60, ease:'none' });
  const box = track.parentElement;
  box.addEventListener('mouseenter', ()=> gsap.to(loop, { timeScale:0.18, duration:0.6, overwrite:true }));
  box.addEventListener('mouseleave', ()=> gsap.to(loop, { timeScale:1, duration:0.6, overwrite:true }));
})();

/* hero background giant DADA marquee */
if (!REDUCED && document.querySelector('.hmb-track')){
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
    .set(intro, { display:'none' }, 'split+=1.0')
    .add(()=>{ if (heroReveal) heroReveal.play(); }, 'split+=0.05');
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
   HERO PHOTO REVEAL — la photo se pose et le texte monte, joué à
   l'ouverture de l'intro « DADA » (voir startIntro)
   ============================================================ */
const heroPhoto = document.getElementById('heroPhoto');
let heroReveal = null;
if (heroPhoto && !REDUCED){
  const heroTL = gsap.timeline({ paused:true, defaults:{ ease:'power3.out' } });
  heroTL
    .fromTo(heroPhoto, { scale:1.16 }, { scale:1, duration:1.7, ease:'power3.out' })
    .fromTo('.hero .eyebrow',       { autoAlpha:0, y:20 }, { autoAlpha:1, y:0, duration:0.7 }, 0.18)
    .fromTo('.hero-title .w',        { yPercent:120 },      { yPercent:0, duration:1.0, stagger:0.07 }, 0.22)
    .fromTo('.hero-sub',            { autoAlpha:0, y:24 }, { autoAlpha:1, y:0, duration:0.8 }, 0.5)
    .fromTo('.hero-actions .btn',   { autoAlpha:0, y:24 }, { autoAlpha:1, y:0, duration:0.7, stagger:0.1 }, 0.6)
    .fromTo('.hero .scroll-cue',    { autoAlpha:0 },        { autoAlpha:1, duration:0.6 }, 0.85);
  heroReveal = heroTL;
  if (!document.getElementById('intro')) heroTL.play();
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
  // clearProps : sinon le transform inline résiduel écrase le :hover des cartes logos
  fadeUp('.retailers-marquee', { y:30, scrollTrigger:{ trigger:'.retailers-marquee', start:'top 90%' }});
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
  // sur mobile la canette a peu de marge sous l'en-tête fixe : mouvement vertical réduit
  const amp = window.matchMedia('(max-width:980px)').matches ? 0.3 : 1;
  ScrollTrigger.create({
    trigger:'.experience', start:'top top', end:'bottom bottom', scrub:true,
    onUpdate:self=>{
      const p = self.progress;
      const idx = Math.min(steps.length-1, Math.floor(p*steps.length*0.999));
      steps.forEach((s,i)=> s.classList.toggle('is-active', i===idx));
      gsap.set(expCan, { rotationY:-16+p*32, y:(p-0.5)*-50*amp, rotationZ:(p-0.5)*6 });
      // le reflet glisse sur le métal à mesure que la canette pivote
      expCan.style.setProperty('--sx', (118 - p*136).toFixed(1) + '%');
    }
  });
  // parallax the can column slightly
  gsap.to(expCan, { yPercent:-6*amp, ease:'none',
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
if (!REDUCED && document.querySelector('.band')){
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
    {id:'cola',        c:'#E2001A', kick:'01 · La demande',    title:'Une marque qui parle aux jeunes',
      desc:"Jul, Ninho, Sofiane, Alonzo : Dada s'invite dans les clips. 44 000 abonnés sur Instagram et une cote énorme chez les 10–25 ans."},
    {id:'mangue',      c:'#1FA98C', kick:'02 · Le produit',    title:'13 références qui claquent',
      desc:"Colas, fruités, mojito, ice tea : des canettes colorées qui attirent l'œil en rayon et en frigo."},
    {id:'melon',       c:'#F0A93B', kick:'03 · Les volumes',   title:'Palettes sur mesure',
      desc:"De 25 à 100 packs de 24 × 33 cl par palette, saveurs au choix : vous composez selon votre clientèle."},
    {id:'cola-cherry', c:'#A8275E', kick:'04 · La visibilité', title:'Une marque qui se voit',
      desc:"Affichage JCDecaux, taxis parisiens, pub télé, partenariats PFL et basket : la marque fait parler d'elle."},
    {id:'mojito',      c:'#8BC34A', kick:'05 · En boutique',   title:'Vitrines réfrigérées',
      desc:"Trois vitrines aux couleurs Dada (Slim, Moyen, Big), livrées avec des colis offerts."},
    {id:'litchi',      c:'#F26D8F', kick:'06 · Le contact',    title:'Un interlocuteur direct',
      desc:"Une question, une commande, un réassort ? L'équipe répond directement sur WhatsApp."}
  ];
  const N = BENEFITS.length;

  const cards = BENEFITS.map((b,i)=>{
    const el = document.createElement('article');
    el.className = 'bcard'; el.style.setProperty('--c', b.c);
    el.innerHTML =
      `<span class="bcard-dim" aria-hidden="true"></span>
       <span class="bcard-ghost">${String(i+1).padStart(2,'0')}</span>
       <span class="bcard-chip">Atout ${String(i+1).padStart(2,'0')} / 0${N}</span>
       <div class="bcard-glow"></div>
       ${canFX(b.id, 'bcard-can', 'Canette Dada ' + b.title)}
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

  // Fallback : reduced-motion ou pas de ScrollTrigger → pile verticale lisible
  if (REDUCED || typeof ScrollTrigger === 'undefined'){
    section.classList.add('is-static');
    cards.forEach(c=> c.classList.add('is-active'));
    ticks.forEach(t=> t.classList.add('is-on'));
    return;
  }

  // Les atouts s'empilent : le 1er est déjà là, chaque carte suivante monte du bas et se pose
  // dessus ; celles du dessous reculent un peu (plus petites, plus sombres, le haut dépasse).
  const M = N - 1;
  const STEP = 72;          // défilement par carte, en svh
  const TAIL = 0.5;         // la dernière carte reste un moment avant la suite de la page
  const LAND = 0.7;         // part de chaque intervalle où la carte arrive (le reste = repos)
  section.style.height = (100 + (M + TAIL) * STEP) + 'svh';
  const ease = x => 1 - Math.pow(1 - x, 3);
  const dims = cards.map(c => c.querySelector('.bcard-dim'));
  const tops = cards.map(c => [c.querySelector('.bcard-ghost'), c.querySelector('.bcard-chip')]);   // effacés quand la carte est recouverte
  let lastCur = -1;
  function paint(t){
    const land = cards.map((c,i)=> i === 0 ? 1 : Math.max(0, Math.min(1, (t - (i - 1)) / LAND)));
    const from = pin.clientHeight * 0.5 + stage.offsetHeight * 0.6;      // départ sous l'écran
    let cur = 0;
    for (let i = 1; i < N; i++) if (land[i] >= 0.5) cur = i;
    cards.forEach((card,i)=>{
      let depth = 0;
      for (let j = i + 1; j < N; j++) depth += land[j];
      const d = Math.min(depth, 3);
      const ty = (1 - ease(land[i])) * from - d * 24;      // ~12 px de chaque carte du dessous dépassent
      const sc = 1 - d * 0.04;
      card.style.transform = `translate(-50%, calc(-50% + ${ty.toFixed(1)}px)) scale(${sc.toFixed(3)})`;
      card.style.zIndex = 10 + i;
      card.style.visibility = (land[i] <= 0 || depth >= 3.5) ? 'hidden' : 'visible';
      card.style.opacity = depth > 2.5 ? Math.max(0, 3.5 - depth).toFixed(3) : '';
      card.style.pointerEvents = i === cur ? 'auto' : 'none';
      dims[i].style.opacity = (d * 0.17).toFixed(3);
      const o = Math.max(0, 1 - depth * 2.5).toFixed(3);
      tops[i].forEach(el => { if (el) el.style.opacity = o; });
    });
    if (cur === lastCur) return;
    lastCur = cur;
    cards.forEach((card,i)=> card.classList.toggle('is-active', i === cur));
    ticks.forEach((tk,i)=>{ tk.classList.toggle('is-on', i<=cur); tk.classList.toggle('is-current', i===cur); });
    pin.style.setProperty('--deck-c', BENEFITS[cur].c);
    if (counter) counter.textContent = String(cur+1).padStart(2,'0')+' / 0'+N;
  }
  const st = ScrollTrigger.create({
    trigger: section, start:'top top', end:'bottom bottom',
    scrub:true, invalidateOnRefresh:true,
    onUpdate: self => paint(Math.min(M, self.progress * (M + TAIL))),
    onRefresh: self => paint(Math.min(M, self.progress * (M + TAIL)))
  });
  paint(0);

  // a11y : clic sur une pastille → défile jusqu'à la carte posée
  ticks.forEach((tk,i)=> tk.addEventListener('click', ()=>{
    const y = st.start + (i / (M + TAIL)) * (st.end - st.start);
    if (lenis) lenis.scrollTo(y,{duration:0.8}); else window.scrollTo({top:y, behavior:'smooth'});
  }));
})();

/* ============================================================
   PANIER & DEVIS PRO — injectés sur toutes les pages
   Site concept : rien n'est payé ni transmis d'ici. Le panier se
   finalise sur WhatsApp (message tout rédigé) ou sur la boutique
   officielle, fiche par fiche (Squarespace ne peut pas recevoir un
   panier venu d'un autre site). Les pros composent un devis
   (palettes mixtes + vitrines) qui part sur WhatsApp.
   ============================================================ */
(function(){
  const navEl = document.getElementById('nav');
  if (!navEl) return;

  const WA = '33782206131';
  const SHOP = 'https://www.dadadrinks.com';
  // fiches de la boutique officielle (plusieurs slugs viennent du modèle Squarespace « brine »)
  const SHOP_SLUG = {
    cola:'dada-cola-pack-de-24-canettes', 'cola-zero':'dada-cola-zero-pack-de-24', 'cola-cherry':'dada-cola-cherry',
    cerise:'do-chua-2b6jz', fraise:'beets-3k7cg', litchi:'sauerkraut-2zh2p', lemon:'dada-lemon-pack-de-24-canettes',
    mangue:'lemons-alkye', melon:'spring-mix-9y7xp', mojito:'caperberries-37mae', peche:'dill-pickles-kby8f',
    pomme:'beni-shoga-bl23x', icetea:'dada-ice-tea-pack-de-24' };
  const PACK = 32, CANS = 24, MAXQ = 99;
  const TIERS = { 25:450, 50:900, 70:1155, 100:1600 };            // palettes mixtes, TTC
  const VITRINES = {
    slim:  { name:'Vitrine Slim',  price:718,  gift:10, img:'assets/photos/frigo-slim.png' },
    moyen: { name:'Vitrine Moyen', price:918,  gift:20, img:'assets/photos/frigo-moyen.png' },
    big:   { name:'Vitrine Big',   price:1620, gift:24, img:'assets/photos/frigo-double.png' } };
  const FL = Object.fromEntries(FLAVORS.map(f => [f.id, f]));
  const IDS = FLAVORS.map(f => f.id);
  const IS_PRO = !!document.getElementById('palBar');

  // milliers : espace insécable classique (l'espace fine U+202F n'existe pas dans Rubik)
  const fmt = (n, d) => n.toLocaleString('fr-FR', { minimumFractionDigits:d, maximumFractionDigits:d }).replace(/\u202f/g, '\u00a0') + '\u00a0€';
  const eur2 = n => fmt(n, 2), eur0 = n => fmt(n, 0);
  const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const waURL = m => `https://wa.me/${WA}?text=${encodeURIComponent(m)}`;

  /* --- état, gardé dans le navigateur --- */
  const load = k => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch(e){ return null; } };
  const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
  function readCart(){
    let c = load('dada-cart-v2'), migrated = false;
    if (!c){                                     // reprise de l'ancien panier : les packs seulement
      c = {}; const old = load('dada-cart');
      if (old){
        for (const k in old){ const m = /^(.+)-p24$/.exec(k); if (m && FL[m[1]] && old[k]) c[m[1]] = old[k].q; }
        migrated = true;
      }
    }
    const out = {};
    for (const k in c){ const q = Math.min(MAXQ, Math.floor(+c[k] || 0)); if (FL[k] && q > 0) out[k] = q; }
    if (migrated){ keep('dada-cart-v2', out); try { localStorage.removeItem('dada-cart'); } catch(e){} }
    return out;
  }
  function readDevis(){
    const d = load('dada-devis-v1') || {}, out = { palettes:[], vitrines:{} };
    (Array.isArray(d.palettes) ? d.palettes : []).forEach(p => {
      if (!p || !TIERS[p.size] || !p.mix) return;
      const mix = {}; let n = 0;
      for (const k in p.mix){ const q = Math.floor(+p.mix[k] || 0); if (FL[k] && q > 0){ mix[k] = q; n += q; } }
      if (n === +p.size) out.palettes.push({ size:+p.size, mix });
    });
    for (const k in (d.vitrines || {})){ const q = Math.min(MAXQ, Math.floor(+d.vitrines[k] || 0)); if (VITRINES[k] && q > 0) out.vitrines[k] = q; }
    return out;
  }
  let cart = readCart(), devis = readDevis();
  const saveCart = () => keep('dada-cart-v2', cart);
  const saveDevis = () => keep('dada-devis-v1', devis);
  const nPacks = () => IDS.reduce((a, id) => a + (cart[id] || 0), 0);
  const nDevis = () => devis.palettes.length + Object.values(devis.vitrines).reduce((a, b) => a + b, 0);
  const devisTotal = () => devis.palettes.reduce((a, p) => a + TIERS[p.size], 0)
    + Object.keys(devis.vitrines).reduce((a, k) => a + VITRINES[k].price * devis.vitrines[k], 0);
  const mixText = (mix, sep) => IDS.filter(id => mix[id]).map(id => `${mix[id]} ${FL[id].name}`).join(sep || ' · ');

  /* --- pictogrammes --- */
  const ic = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    sac:'<path d="M6.4 7.5h11.2a1.5 1.5 0 0 1 1.5 1.38l.85 10.5a2 2 0 0 1-2 2.12H6.05a2 2 0 0 1-2-2.12l.85-10.5A1.5 1.5 0 0 1 6.4 7.5z"/><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5"/>',
    x:'<path d="M6 6l12 12M18 6 6 18"/>', back:'<path d="M15 5l-7 7 7 7"/>', ext:'<path d="M8 16 16 8M9.5 8H16v6.5"/>',
    check:'<path d="m5 12.5 4.3 4.3L19 7.5"/>',
    shop:'<path d="M4 9.5 5.2 5h13.6L20 9.5"/><path d="M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 20v-5.5h5V20"/>',
    copy:'<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9"/>' };
  const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413"/></svg>';

  /* --- bouton panier dans la nav (regroupé avec Contact) --- */
  const toggle = document.createElement('button');
  toggle.className = 'cart-toggle'; toggle.type = 'button';
  toggle.setAttribute('aria-haspopup', 'dialog'); toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'cartDrawer'); toggle.setAttribute('data-cursor', 'Panier');
  toggle.innerHTML = ic(I.sac) + '<span class="cart-count" aria-hidden="true">0</span>';   // sac de courses, choisi le 2026-10-20
  const contactBtn = navEl.querySelector('.btn-nav');
  if (contactBtn){
    const actions = document.createElement('div'); actions.className = 'nav-actions';
    navEl.insertBefore(actions, contactBtn);
    actions.appendChild(toggle); actions.appendChild(contactBtn);
  } else navEl.appendChild(toggle);
  const countEl = toggle.querySelector('.cart-count');

  /* --- tiroir (panneau qui monte du bas sur mobile) --- */
  const overlay = document.createElement('div'); overlay.className = 'cart-overlay';
  const drawer = document.createElement('aside');
  drawer.className = 'cart-drawer'; drawer.id = 'cartDrawer';
  drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', 'cdTitle'); drawer.setAttribute('aria-hidden', 'true');
  drawer.setAttribute('data-lenis-prevent', '');
  drawer.innerHTML = `<span class="cd-grab" aria-hidden="true"></span>
    <div class="cd-head">
      <button class="cd-back" type="button" data-act="back" aria-label="Retour" hidden>${ic(I.back)}</button>
      <h3 id="cdTitle" tabindex="-1">Ton panier</h3>
      <button class="cd-close" type="button" data-act="close" aria-label="Fermer">${ic(I.x)}</button>
    </div>
    <div class="cd-tabs" role="tablist" aria-label="Panier ou devis pro" hidden>
      <button type="button" role="tab" data-tab="cart">Panier <b></b></button>
      <button type="button" role="tab" data-tab="devis">Devis pro <b></b></button>
    </div>
    <ol class="cd-steps" aria-label="Étapes de la commande"><li>Panier</li><li>Finaliser</li><li>C'est parti</li></ol>
    <div class="cd-body"></div>
    <div class="cd-foot"></div>`;
  document.body.append(overlay, drawer);
  const $ = s => drawer.querySelector(s);
  const titleEl = $('#cdTitle'), backBtn = $('.cd-back'), tabsEl = $('.cd-tabs'), stepsEl = $('.cd-steps');
  const body = $('.cd-body'), foot = $('.cd-foot');

  const live = document.createElement('p');
  live.className = 'sr-only'; live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  const say = t => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 40); };

  /* --- notification (ajout sans ouvrir le tiroir) --- */
  const toast = document.createElement('div');
  toast.className = 'dada-toast'; toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  let toastT;
  function hideToast(){ clearTimeout(toastT); toast.classList.remove('is-on'); }
  function toastShow(o){
    toast.innerHTML = `${o.img ? `<img src="${o.img}" alt="" draggable="false" />` : ''}<span class="dt-t">${o.text}</span>${o.action ? `<button type="button">${o.action}</button>` : ''}`;
    const b = toast.querySelector('button');
    if (b) b.addEventListener('click', () => { hideToast(); if (o.onAction) o.onAction(); });
    toast.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(hideToast, 4200);
  }
  toast.addEventListener('mouseenter', () => clearTimeout(toastT));
  toast.addEventListener('focusin', () => clearTimeout(toastT));
  toast.addEventListener('mouseleave', () => { clearTimeout(toastT); toastT = setTimeout(hideToast, 1800); });

  /* --- pastille + petite secousse du pictogramme --- */
  function renderBadge(){
    const p = nPacks(), d = nDevis(), n = p + d;
    countEl.textContent = n > 99 ? '99+' : n;
    toggle.classList.toggle('has-items', n > 0);
    toggle.setAttribute('aria-label', 'Panier, ' + (p ? plural(p, 'pack') : 'vide') + (d ? `, devis pro : ${plural(d, 'élément')}` : ''));
  }
  function bump(){
    renderBadge();
    toggle.classList.remove('is-bump'); void toggle.offsetWidth; toggle.classList.add('is-bump');
  }
  // une canette (ou une vitrine) vole jusqu'au panier
  function fly(img, done){
    const r = img && img.getBoundingClientRect ? img.getBoundingClientRect() : null;
    if (REDUCED || !r || !r.width || r.bottom < 0 || r.top > innerHeight){ done(); return; }
    const t = toggle.getBoundingClientRect();
    const h = Math.min(r.height, 150), w = h * (r.width / r.height);
    const el = document.createElement('img');
    el.src = img.currentSrc || img.src; el.alt = ''; el.className = 'cart-fly';
    el.style.cssText = `left:${r.left + r.width / 2 - w / 2}px;top:${r.top + r.height / 2 - h / 2}px;width:${w}px;height:${h}px`;
    document.body.appendChild(el);
    const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top + t.height / 2 - (r.top + r.height / 2);
    gsap.timeline({ onComplete:() => { el.remove(); done(); } })
      .to(el, { x:dx, duration:.75, ease:'power2.inOut' }, 0)
      .to(el, { y:dy, duration:.75, ease:'back.in(1.5)' }, 0)
      .to(el, { scale:22 / h, rotation:24, duration:.75, ease:'power3.in' }, 0)
      .to(el, { opacity:0, duration:.14 }, .63);
  }

  /* --- vues du tiroir --- */
  let tab = 'cart', view = 'list', lastMsg = '', undo = null, undoT;
  const shopDone = new Set();
  const info = { prenom:'', ville:'', nom:'', societe:'', villePro:'' };
  const undoBar = () => undo ? `<div class="cd-undo" role="status"><span>${esc(undo.label)}</span><button type="button" data-act="undo">Annuler</button></div>` : '';
  const qtyHTML = (act, key, val, n, label) => `<span class="cd-qty" role="group" aria-label="${label}">
      <button type="button" data-act="${act}dec" ${key} aria-label="${n} en moins">−</button><output>${val}</output>
      <button type="button" data-act="${act}inc" ${key} aria-label="${n} en plus">+</button></span>`;

  const TITLES = { list:'Ton panier', finish:'Finaliser', shop:'Sur la boutique', sent:"C'est parti",
    devis:'Ton devis pro', 'devis-sent':"C'est parti" };
  const VIEWS = {};

  VIEWS.list = () => {
    const ids = IDS.filter(id => cart[id]);
    if (!ids.length){
      body.innerHTML = undoBar() + `<div class="cd-empty">
        <img class="cd-empty-can" src="${canSrc('cola')}" alt="" draggable="false" />
        <h4>Ton panier a soif.</h4>
        <p>13 parfums, en pack de 24 canettes à 32&nbsp;€. Compose ton mix.</p>
        <a class="btn btn-primary" href="particuliers.html#boutique" data-go="boutique">Découvrir les parfums</a>
        ${IS_PRO ? '' : '<a class="cd-link" href="professionnels.html#palette" data-go="palette">Tu es pro&nbsp;? Compose ta palette</a>'}
      </div>`;
      foot.innerHTML = ''; return;
    }
    body.innerHTML = undoBar() + `<ul class="cd-lines">${ids.map(id => { const f = FL[id], q = cart[id]; return `
      <li class="cd-line" style="--c:${f.c}">
        <span class="cd-thumb"><img src="${canSrc(id)}" alt="" draggable="false" /></span>
        <span class="cd-meta"><b>${f.name}</b><small>Pack de 24 × 33&nbsp;cl · ${eur2(PACK)}</small></span>
        <button class="cd-rm" type="button" data-act="rm" data-id="${id}" aria-label="Retirer ${f.name} du panier">${ic(I.x)}</button>
        ${qtyHTML('', `data-id="${id}"`, q, `Un pack de ${f.name}`, `Packs de ${f.name}`)}
        <strong class="cd-lt">${eur2(q * PACK)}</strong>
      </li>`; }).join('')}</ul>${mixRow()}`;
    const n = nPacks();
    foot.innerHTML = `
      <div class="cd-sum"><span>${plural(n, 'pack')} · ${n * CANS} canettes</span><span>soit ${eur2(PACK / CANS)} la canette</span></div>
      <div class="cd-total"><span>Sous-total</span><strong>${eur2(n * PACK)}</strong></div>
      <p class="cd-ship">Prix de la boutique officielle. La livraison se règle à l'étape suivante.</p>
      <button class="btn btn-primary cd-cta" type="button" data-act="checkout">Passer commande</button>`;
  };
  function mixRow(){
    const rest = FLAVORS.filter(f => !cart[f.id]);
    if (!rest.length) return '';
    return `<div class="cd-mix"><p class="cd-mix-t">Complète ton mix</p><div class="cd-mix-row">${rest.map(f => `
      <button class="cd-mix-b" type="button" style="--c:${f.c}" data-act="inc" data-id="${f.id}" aria-label="Ajouter un pack de ${f.name}">
        <img src="${canSrc(f.id)}" alt="" draggable="false" loading="lazy" /><span>${f.name}</span><i aria-hidden="true">+</i></button>`).join('')}</div></div>`;
  }

  VIEWS.finish = () => {
    const n = nPacks();
    body.innerHTML = `
      <div class="cd-recap"><span>${plural(n, 'pack')} · ${eur2(n * PACK)}</span><button class="cd-link" type="button" data-act="back">Modifier</button></div>
      <section class="cd-opt cd-opt--wa" aria-labelledby="cdOptWa">
        <span class="cd-tag">Le plus direct</span>
        <span class="cd-opt-ic">${WA_SVG}</span>
        <h4 id="cdOptWa">Commander sur WhatsApp</h4>
        <p>Ta commande part toute rédigée à l'équipe Dada, qui te confirme la dispo, la livraison et le paiement.</p>
        <div class="cd-fields">
          <label><span>Prénom <em>(facultatif)</em></span><input type="text" data-info="prenom" autocomplete="given-name" maxlength="40" value="${esc(info.prenom)}" /></label>
          <label><span>Ville ou code postal <em>(facultatif)</em></span><input type="text" data-info="ville" autocomplete="address-level2" maxlength="60" value="${esc(info.ville)}" /></label>
        </div>
        <a class="cd-wa-btn" href="${waURL(cartMsg())}" target="_blank" rel="noopener" data-act="wa">${WA_SVG}Ouvrir WhatsApp</a>
      </section>
      <section class="cd-opt cd-opt--shop" aria-labelledby="cdOptShop">
        <span class="cd-opt-ic">${ic(I.shop)}</span>
        <h4 id="cdOptShop">Payer sur la boutique officielle</h4>
        <p>Paiement en ligne sur dadadrinks.com. Leur boutique ne peut pas recevoir ton panier&nbsp;: tu ajoutes chaque parfum depuis sa fiche, on te guide.</p>
        <button class="btn btn-ghost cd-cta" type="button" data-act="shop">Voir ma liste</button>
      </section>`;
    foot.innerHTML = `<p class="cd-note">Site concept&nbsp;: rien n'est payé ni transmis depuis ce site.</p>`;
  };

  VIEWS.shop = () => {
    const ids = IDS.filter(id => cart[id]);
    const done = ids.filter(id => shopDone.has(id)).length;
    body.innerHTML = `<p class="cd-intro">Ouvre chaque fiche, choisis la quantité et ajoute au panier sur dadadrinks.com. La disponibilité de chaque parfum s'affiche sur sa fiche.</p>
      <ul class="cd-check">${ids.map(id => { const f = FL[id], on = shopDone.has(id); return `
        <li class="${on ? 'is-done' : ''}" style="--c:${f.c}">
          <label><input type="checkbox" data-done="${id}"${on ? ' checked' : ''} /><span class="cd-box" aria-hidden="true">${ic(I.check)}</span>
            <img src="${canSrc(id)}" alt="" draggable="false" /><span class="cd-ck-t"><b>${cart[id]} × ${f.name}</b><small>Pack de 24 × 33&nbsp;cl</small></span></label>
          <a class="cd-open" href="${SHOP}/shop-brine/${SHOP_SLUG[id]}" target="_blank" rel="noopener" data-open="${id}" aria-label="Ouvrir la fiche ${f.name} sur dadadrinks.com">Ouvrir${ic(I.ext)}</a>
        </li>`; }).join('')}</ul>`;
    foot.innerHTML = `<div class="cd-prog" aria-hidden="true"><span style="--p:${ids.length ? done / ids.length : 0}"></span></div>
      <p class="cd-prog-t">Déjà ajoutés sur la boutique&nbsp;: ${done} sur ${ids.length}</p>
      <a class="btn btn-primary cd-cta" href="${SHOP}/cart" target="_blank" rel="noopener">Payer sur dadadrinks.com</a>`;
  };

  const sentHTML = (h, p) => `<div class="cd-sent">
      <span class="cd-sent-ic">${ic(I.check)}</span>
      <h4>${h}</h4><p>${p}</p>
      <p class="cd-msg">${esc(lastMsg).replace(/\n/g, '<br>')}</p>
      <button class="cd-link" type="button" data-act="copy">${ic(I.copy)}WhatsApp ne s'est pas ouvert&nbsp;? Copier le message</button>
    </div>`;
  VIEWS.sent = () => {
    body.innerHTML = sentHTML('Ta commande est prête.', "WhatsApp s'est ouvert avec ton message&nbsp;: il ne reste qu'à l'envoyer. L'équipe Dada te répond pour la dispo, la livraison et le paiement.");
    foot.innerHTML = `<button class="btn btn-primary cd-cta" type="button" data-act="clear">Vider mon panier</button>
      <button class="btn btn-ghost cd-cta" type="button" data-act="keep">Garder mon panier</button>`;
  };

  VIEWS.devis = () => {
    const vk = Object.keys(VITRINES).filter(k => devis.vitrines[k]);
    if (!devis.palettes.length && !vk.length){
      body.innerHTML = undoBar() + `<div class="cd-empty">
        <img class="cd-empty-pal" src="assets/pros/palette.jpg" alt="" draggable="false" />
        <h4>Ton devis est vide.</h4>
        <p>Compose une palette mixte de 25 à 100 packs, ou ajoute une vitrine Dada à ton point de vente.</p>
        <a class="btn btn-primary" href="professionnels.html#palette" data-go="palette">Composer ma palette</a>
      </div>`;
      foot.innerHTML = ''; return;
    }
    body.innerHTML = undoBar() + `<ul class="cd-lines">${devis.palettes.map((p, i) => `
      <li class="cd-line cd-line--pro">
        <span class="cd-thumb cd-thumb--img"><img src="assets/pros/palette.jpg" alt="" draggable="false" /></span>
        <span class="cd-meta"><b>Palette · ${p.size} packs</b><small>${mixText(p.mix)}</small></span>
        <button class="cd-rm" type="button" data-act="rm-pal" data-i="${i}" aria-label="Retirer la palette de ${p.size} packs">${ic(I.x)}</button>
        <span class="cd-unit">${eur2(TIERS[p.size] / p.size).replace(',00', '')} le pack</span>
        <strong class="cd-lt">${eur0(TIERS[p.size])}</strong>
      </li>`).join('')}${vk.map(k => { const v = VITRINES[k], q = devis.vitrines[k]; return `
      <li class="cd-line cd-line--pro">
        <span class="cd-thumb cd-thumb--img cd-thumb--fridge"><img src="${v.img}" alt="" draggable="false" /></span>
        <span class="cd-meta"><b>${v.name}</b><small>+ ${v.gift} colis offerts · ${eur0(v.price)} l'unité</small></span>
        <button class="cd-rm" type="button" data-act="rm-vit" data-k="${k}" aria-label="Retirer ${v.name} du devis">${ic(I.x)}</button>
        ${qtyHTML('v', `data-k="${k}"`, q, `Une ${v.name}`, `Nombre de ${v.name}`)}
        <strong class="cd-lt">${eur0(v.price * q)}</strong>
      </li>`; }).join('')}</ul>
      <div class="cd-fields cd-fields--pro">
        <label><span>Nom</span><input type="text" data-info="nom" autocomplete="name" maxlength="60" value="${esc(info.nom)}" /></label>
        <label><span>Société / enseigne</span><input type="text" data-info="societe" autocomplete="organization" maxlength="80" value="${esc(info.societe)}" /></label>
        <label class="cd-f-wide"><span>Ville <em>(facultatif)</em></span><input type="text" data-info="villePro" autocomplete="address-level2" maxlength="60" value="${esc(info.villePro)}" /></label>
        <p class="cd-err" hidden>Indique ton nom et ta société&nbsp;: l'équipe saura qui recontacter.</p>
      </div>`;
    foot.innerHTML = `<div class="cd-total"><span>Total TTC</span><strong>${eur0(devisTotal())}</strong></div>
      <p class="cd-ship">Tarifs de la boutique pro officielle. Livraison et délais confirmés par l'équipe.</p>
      <a class="cd-wa-btn cd-cta" href="${waURL(devisMsg())}" target="_blank" rel="noopener" data-act="wa-devis">${WA_SVG}Envoyer le devis sur WhatsApp</a>`;
  };
  VIEWS['devis-sent'] = () => {
    body.innerHTML = sentHTML('Ton devis est prêt.', "WhatsApp s'est ouvert avec ta demande&nbsp;: il ne reste qu'à l'envoyer. L'équipe Dada te répond avec les disponibilités et la livraison.");
    foot.innerHTML = `<button class="btn btn-primary cd-cta" type="button" data-act="clear-devis">Vider mon devis</button>
      <button class="btn btn-ghost cd-cta" type="button" data-act="keep">Garder mon devis</button>`;
  };

  function render(){
    // garder le focus et le défilement quand on re-dessine la même vue
    const prevKey = drawer.dataset.view, st = body.scrollTop, sel = focusSel(document.activeElement);
    renderBadge();
    tabsEl.hidden = !(IS_PRO || nDevis() > 0);
    tabsEl.querySelectorAll('[data-tab]').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
    tabsEl.querySelector('[data-tab="cart"] b').textContent = nPacks() || '';
    tabsEl.querySelector('[data-tab="devis"] b').textContent = nDevis() || '';
    const key = tab === 'cart' ? view : (view === 'sent' ? 'devis-sent' : 'devis');
    titleEl.textContent = TITLES[key];
    backBtn.hidden = !(key === 'finish' || key === 'shop');
    const step = tab === 'cart' && nPacks() ? ({ list:1, finish:2, shop:2, sent:3 })[view] : 0;
    stepsEl.hidden = !step;
    [...stepsEl.children].forEach((li, i) => {
      li.classList.toggle('is-done', i + 1 < step); li.classList.toggle('is-cur', i + 1 === step);
      if (i + 1 === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    drawer.dataset.view = key;
    VIEWS[key]();
    if (prevKey !== key) body.scrollTop = 0;
    else {
      body.scrollTop = st;
      const n = sel && drawer.querySelector(sel);
      if (n) n.focus({ preventScroll:true });
    }
  }
  function focusSel(a){
    if (!a || !drawer.contains(a) || !a.dataset) return null;
    for (const k of ['info', 'tab', 'done', 'open']) if (a.dataset[k]) return `[data-${k}="${a.dataset[k]}"]`;
    if (!a.dataset.act) return null;
    return `[data-act="${a.dataset.act}"]` + ['id', 'k', 'i'].map(k => a.dataset[k] ? `[data-${k}="${a.dataset[k]}"]` : '').join('');
  }
  function armUndo(){
    clearTimeout(undoT);
    undoT = setTimeout(() => { undo = null; const u = $('.cd-undo'); if (u) u.remove(); }, 6000);
  }

  /* --- messages envoyés sur WhatsApp --- */
  function cartMsg(){
    const n = nPacks();
    return [`Bonjour l'équipe Dada ! Je voudrais commander :`,
      ...IDS.filter(id => cart[id]).map(id => `• ${cart[id]} × ${FL[id].name} (pack de 24 × 33 cl)`),
      `Total : ${plural(n, 'pack')} (${n * CANS} canettes), soit ${eur2(n * PACK)} au prix de la boutique officielle.`,
      info.prenom && `Prénom : ${info.prenom}`,
      info.ville && `Livraison : ${info.ville}`,
      `Pouvez-vous me confirmer la dispo et la livraison ? Merci !`].filter(Boolean).join('\n');
  }
  function devisMsg(x){
    x = x || {};
    const L = [nDevis() ? `Bonjour l'équipe Dada ! Voici ma demande de devis pro :` : `Bonjour l'équipe Dada ! Je souhaite devenir partenaire et revendre Dada.`];
    devis.palettes.forEach(p => L.push(`• Palette mixte de ${p.size} packs, ${eur0(TIERS[p.size])} TTC : ${mixText(p.mix, ', ')}`));
    Object.keys(VITRINES).forEach(k => { const q = devis.vitrines[k]; if (q) L.push(`• ${q} × ${VITRINES[k].name} (+ ${VITRINES[k].gift} colis offerts), ${eur0(VITRINES[k].price * q)} TTC`); });
    if (nDevis()) L.push(`Total estimé : ${eur0(devisTotal())} TTC`);
    const nom = x.nom || info.nom, soc = x.societe || info.societe, ville = x.ville || info.villePro;
    if (nom) L.push(`Nom : ${nom}`);
    if (soc) L.push(`Société : ${soc}`);
    if (ville) L.push(`Ville : ${ville}`);
    if (x.email) L.push(`Email : ${x.email}`);
    if (x.tel) L.push(`Téléphone : ${x.tel}`);
    L.push(nDevis() ? `Pouvez-vous me confirmer les disponibilités et la livraison ? Merci !` : `Merci de me recontacter !`);
    return L.join('\n');
  }
  function copyText(txt, btn){
    const ok = () => { const l = btn.innerHTML; btn.textContent = 'Message copié'; setTimeout(() => { if (btn.isConnected) btn.innerHTML = l; }, 1800); };
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select();
      let r = false; try { r = document.execCommand('copy'); } catch(e){}
      ta.remove(); if (r) ok();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
  }

  /* --- ouvrir / fermer --- */
  const isOpen = () => drawer.classList.contains('is-open');
  let lastFocus = null;
  function open(which){
    tab = which || (IS_PRO && (nDevis() || !nPacks()) ? 'devis' : 'cart');
    view = 'list'; undo = null;
    render();
    if (!isOpen()) lastFocus = document.activeElement;
    drawer.classList.add('is-open'); overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false'); toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('cart-lock');
    if (lenis) lenis.stop();
    hideToast();
    setTimeout(() => $('.cd-close').focus({ preventScroll:true }), 80);
  }
  function close(){
    if (!isOpen()) return;
    drawer.classList.remove('is-open'); overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true'); toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('cart-lock');
    if (lenis) lenis.start();
    if (view === 'sent') view = 'list';
    const back = lastFocus && document.contains(lastFocus) && !drawer.contains(lastFocus) ? lastFocus : toggle;
    back.focus({ preventScroll:true });
  }
  const focusTitle = () => titleEl.focus({ preventScroll:true });
  toggle.addEventListener('click', () => { if (isOpen()) close(); else open(); });
  overlay.addEventListener('click', close);

  drawer.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ e.preventDefault(); close(); return; }
    const tb = e.target.closest && e.target.closest('[data-tab]');
    if (tb && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')){
      e.preventDefault(); tab = tb.dataset.tab === 'cart' ? 'devis' : 'cart'; view = 'list'; undo = null; render();
      tabsEl.querySelector(`[data-tab="${tab}"]`).focus(); return;
    }
    if (e.key !== 'Tab') return;
    const f = [...drawer.querySelectorAll('a[href],button,input,[tabindex="0"]')].filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === titleEl)){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  drawer.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.info;
    if (!k) return;
    info[k] = e.target.value.trim();
    const wa = $('[data-act="wa"]'); if (wa) wa.href = waURL(cartMsg());
    const wd = $('[data-act="wa-devis"]'); if (wd) wd.href = waURL(devisMsg());
    if (k === 'nom' || k === 'societe'){ const er = $('.cd-err'); if (er) er.hidden = true; }
  });
  drawer.addEventListener('change', e => {
    const id = e.target.dataset && e.target.dataset.done;
    if (!id) return;
    if (e.target.checked) shopDone.add(id); else shopDone.delete(id);
    render();
  });

  drawer.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-tab],[data-go],[data-open]');
    if (!t || !drawer.contains(t)) return;
    if (t.dataset.tab){ if (tab !== t.dataset.tab){ tab = t.dataset.tab; view = 'list'; undo = null; render(); } return; }
    if (t.dataset.go){                            // lien vers une section de la page courante
      if (document.getElementById(t.dataset.go)){ e.preventDefault(); close(); setTimeout(() => smoothScrollTo('#' + t.dataset.go), 280); }
      return;                                     // sinon : changement de page (rideau rouge)
    }
    if (t.dataset.open){ shopDone.add(t.dataset.open); setTimeout(render, 60); return; }
    const act = t.dataset.act, id = t.dataset.id, k = t.dataset.k;
    switch (act){
      case 'close': close(); break;
      case 'back': view = view === 'shop' ? 'finish' : 'list'; render(); focusTitle(); break;
      case 'inc': setQty(id, (cart[id] || 0) + 1); say(`${FL[id].name} : ${plural(cart[id], 'pack')}`); break;
      case 'dec': setQty(id, (cart[id] || 0) - 1); say(cart[id] ? `${FL[id].name} : ${plural(cart[id], 'pack')}` : `${FL[id].name} retiré du panier`); break;
      case 'rm': { const q = cart[id]; undo = { label:`${FL[id].name} retiré du panier`, fn:() => setQty(id, q) };
        setQty(id, 0); armUndo(); say(undo.label); break; }
      case 'undo': if (undo){ const fn = undo.fn; undo = null; clearTimeout(undoT); fn(); render(); } break;
      case 'checkout': view = 'finish'; render(); focusTitle(); break;
      case 'shop': view = 'shop'; render(); focusTitle(); break;
      case 'wa': lastMsg = cartMsg(); t.href = waURL(lastMsg); setTimeout(() => { view = 'sent'; render(); focusTitle(); }, 150); break;
      case 'copy': copyText(lastMsg || (tab === 'cart' ? cartMsg() : devisMsg()), t); break;
      case 'clear': cart = {}; saveCart(); syncCards(); shopDone.clear(); view = 'list'; render(); focusTitle(); say('Panier vidé'); break;
      case 'keep': view = 'list'; render(); focusTitle(); break;
      case 'vinc': devis.vitrines[k] = Math.min(MAXQ, (devis.vitrines[k] || 0) + 1); saveDevis(); render(); bump(); break;
      case 'vdec': devis.vitrines[k] = (devis.vitrines[k] || 0) - 1; if (devis.vitrines[k] <= 0) delete devis.vitrines[k]; saveDevis(); render(); break;
      case 'rm-vit': { const q = devis.vitrines[k]; delete devis.vitrines[k]; saveDevis();
        undo = { label:`${VITRINES[k].name} retirée du devis`, fn:() => { devis.vitrines[k] = q; saveDevis(); } }; armUndo(); render(); break; }
      case 'rm-pal': { const i = +t.dataset.i, p = devis.palettes[i]; if (!p) break; devis.palettes.splice(i, 1); saveDevis();
        undo = { label:`Palette de ${p.size} packs retirée`, fn:() => { devis.palettes.splice(i, 0, p); saveDevis(); } }; armUndo(); render(); break; }
      case 'wa-devis':
        if (!info.nom || !info.societe){
          e.preventDefault(); const er = $('.cd-err'); if (er) er.hidden = false;
          const miss = $(!info.nom ? '[data-info="nom"]' : '[data-info="societe"]'); if (miss) miss.focus(); break;
        }
        lastMsg = devisMsg(); t.href = waURL(lastMsg); setTimeout(() => { view = 'sent'; render(); focusTitle(); }, 150); break;
      case 'clear-devis': devis = { palettes:[], vitrines:{} }; saveDevis(); view = 'list'; render(); focusTitle(); say('Devis vidé'); break;
    }
  });

  // glisser le panneau vers le bas pour le fermer (mobile)
  let y0 = null;
  const SHEET = window.matchMedia('(max-width:680px)');
  drawer.addEventListener('touchstart', e => { if (SHEET.matches && e.target.closest('.cd-grab,.cd-head')) { y0 = e.touches[0].clientY; drawer.classList.add('is-drag'); } }, { passive:true });
  drawer.addEventListener('touchmove', e => { if (y0 === null) return; const dy = Math.max(0, e.touches[0].clientY - y0); drawer.style.transform = `translateY(${dy}px)`; }, { passive:true });
  drawer.addEventListener('touchend', e => {
    if (y0 === null) return;
    const dy = e.changedTouches[0].clientY - y0; y0 = null;
    drawer.classList.remove('is-drag'); drawer.style.transform = '';
    if (dy > 90) close();
  });

  /* --- quantités du panier + cartes de la boutique --- */
  function setQty(id, q, quiet){                  // quiet : la pastille attend l'arrivée de la canette
    q = Math.max(0, Math.min(MAXQ, q));
    if (q) cart[id] = q; else delete cart[id];
    saveCart(); syncCards();
    if (isOpen()) render(); else if (!quiet) renderBadge();
  }
  function addPack(id, img){
    setQty(id, (cart[id] || 0) + 1, true);
    fly(img, bump);
    const f = FL[id], q = cart[id];
    toastShow({ img:canSrc(id), text:`<b>+1 pack ${f.name}</b><small>${plural(q, 'pack')} de ${f.name} dans ton panier</small>`,
      action:'Voir le panier', onAction:() => open('cart') });
  }
  function syncCards(){
    document.querySelectorAll('.fc-ctl[data-id]').forEach(el => {
      const id = el.dataset.id, q = cart[id] || 0, f = FL[id];
      const step = el.querySelector('.fc-step'), had = el.contains(document.activeElement);
      if (q > 0 && step){ step.querySelector('output').textContent = q; return; }
      if (q > 0){
        el.innerHTML = `<div class="fc-step" role="group" aria-label="Packs de ${f.name} dans ton panier">
          <button type="button" data-act="dec" aria-label="Un pack de ${f.name} en moins">−</button><output>${q}</output>
          <button type="button" data-act="inc" aria-label="Un pack de ${f.name} en plus">+</button></div>`;
        if (had) el.querySelector('[data-act="inc"]').focus({ preventScroll:true });
      } else if (step || !el.firstElementChild){
        el.innerHTML = `<button class="fc-add" type="button" data-act="add" data-cursor="Ajouter" aria-label="Ajouter un pack de ${f.name} au panier">Ajouter <span aria-hidden="true">+</span></button>`;
        if (had) el.querySelector('button').focus({ preventScroll:true });
      }
    });
  }
  const shopGridEl = document.getElementById('shopGrid');
  if (shopGridEl){
    // phase de capture : les cartes ont leurs propres effets au clic
    shopGridEl.addEventListener('click', e => {
      const b = e.target.closest('.fc-ctl [data-act]');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      const id = b.closest('.fc-ctl').dataset.id;
      if (b.dataset.act === 'dec'){ setQty(id, (cart[id] || 0) - 1); say(cart[id] ? `${FL[id].name} : ${plural(cart[id], 'pack')}` : `${FL[id].name} retiré du panier`); return; }
      const r = b.getBoundingClientRect();
      dadaFizz(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 12);
      addPack(id, b.closest('.flavor-card').querySelector('.can-fx__img'));
    }, true);
  }
  syncCards();

  /* --- devis pro : vitrines --- */
  document.querySelectorAll('[data-vitrine]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const k = btn.dataset.vitrine, v = VITRINES[k];
    if (!v) return;
    devis.vitrines[k] = Math.min(MAXQ, (devis.vitrines[k] || 0) + 1); saveDevis();
    const r = btn.getBoundingClientRect();
    dadaFizz(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 12);
    fly(btn.closest('.fridge-card') && btn.closest('.fridge-card').querySelector('img'), bump);
    toastShow({ img:v.img, text:`<b>${v.name} ajoutée au devis</b><small>+ ${v.gift} colis offerts · ${eur0(v.price)}</small>`,
      action:'Voir le devis', onAction:() => open('devis') });
  }));

  /* --- devis pro : composeur de palette mixte --- */
  const palBar = document.getElementById('palBar'), packGridEl = document.getElementById('packGrid');
  if (palBar && packGridEl){
    const draft = load('dada-palette-draft') || {};
    let size = TIERS[draft.size] ? +draft.size : 25;
    const mix = {};
    for (const k in (draft.mix || {})){ const q = Math.floor(+draft.mix[k] || 0); if (FL[k] && q > 0) mix[k] = Math.min(100, q); }
    const tiers = [...document.querySelectorAll('.tier[data-size]')];
    const el = id => document.getElementById(id);
    const sum = () => IDS.reduce((a, id) => a + (mix[id] || 0), 0);
    const saveDraft = () => keep('dada-palette-draft', { size, mix });
    function paint(){
      const n = sum(), left = size - n;
      tiers.forEach(t => {
        const on = +t.dataset.size === size, b = t.querySelector('.tier-pick');
        t.classList.toggle('is-picked', on);
        if (b){ b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Choisie' : 'Choisir'; }
      });
      packGridEl.querySelectorAll('.pack-card[data-id]').forEach(card => {
        const q = mix[card.dataset.id] || 0, inp = card.querySelector('.pk-ctl input');
        card.classList.toggle('is-in', q > 0);
        card.querySelector('.pk-n').textContent = q;
        if (inp && document.activeElement !== inp) inp.value = q;
      });
      el('palN').textContent = n; el('palMax').textContent = size;
      el('palSize').textContent = `Palette de ${size} packs · ${eur0(TIERS[size])} TTC`;
      el('palMeter').innerHTML = IDS.filter(id => mix[id]).map(id => `<i style="width:${Math.min(100, mix[id] / size * 100)}%;background:${FL[id].c}" title="${mix[id]} ${FL[id].name}"></i>`).join('');
      const hint = el('palHint');
      hint.classList.toggle('is-warn', left < 0);
      hint.textContent = left > 0 ? (n ? `Encore ${plural(left, 'pack')} à répartir.` : 'Répartis tes packs avec les boutons + sous chaque parfum.')
        : left === 0 ? 'Palette complète. Ajoute-la à ton devis.' : `${plural(-left, 'pack')} de trop pour cette palette.`;
      el('palAdd').setAttribute('aria-disabled', left === 0 ? 'false' : 'true');
      el('palFill').hidden = left <= 0;
      saveDraft();
    }
    const shake = () => { const h = el('palHint'); h.classList.remove('is-shake'); void h.offsetWidth; h.classList.add('is-shake'); };
    function setMix(id, q){
      const cur = mix[id] || 0, max = Math.max(0, size - (sum() - cur));
      let v = Math.max(0, Math.floor(q) || 0);
      if (v > cur && v > max){ v = Math.max(cur, max); shake(); }   // pas au-delà de la palette
      if (v > 0) mix[id] = v; else delete mix[id];
      paint();
    }
    tiers.forEach(t => {
      const pick = () => { size = +t.dataset.size; paint(); };
      t.addEventListener('click', e => { if (!e.target.closest('a')) pick(); });
    });
    packGridEl.addEventListener('click', e => {
      const b = e.target.closest('[data-pal]');
      if (!b || b.tagName !== 'BUTTON') return;
      const id = b.closest('.pack-card').dataset.id;
      setMix(id, (mix[id] || 0) + (b.dataset.pal === 'inc' ? 1 : -1));
    });
    packGridEl.addEventListener('change', e => {
      const inp = e.target.closest('.pk-ctl input');
      if (inp) setMix(inp.closest('.pack-card').dataset.id, +inp.value);
    });
    packGridEl.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('.pk-ctl input')) e.target.blur(); });
    el('palFill').addEventListener('click', () => {
      let left = size - sum();
      if (left <= 0) return;
      let ids = IDS.filter(id => mix[id]);
      if (!ids.length) ids = IDS.slice();
      for (let i = 0; left > 0; i++, left--) mix[ids[i % ids.length]] = (mix[ids[i % ids.length]] || 0) + 1;
      paint();
    });
    el('palReset').addEventListener('click', () => { for (const k in mix) delete mix[k]; paint(); });
    el('palAdd').addEventListener('click', () => {
      if (sum() !== size){ shake(); return; }
      devis.palettes.push({ size, mix:{ ...mix } }); saveDevis();
      for (const k in mix) delete mix[k];
      paint(); fly(document.querySelector('.palette-visual img'), bump);
      toastShow({ img:'assets/pros/palette.jpg', text:`<b>Palette de ${size} packs ajoutée</b><small>${eur0(TIERS[size])} TTC dans ton devis pro</small>`,
        action:'Voir le devis', onAction:() => open('devis') });
    });
    paint();
  }

  /* --- formulaire pro : la demande part sur WhatsApp, avec le devis --- */
  const proForm = document.getElementById('proForm');
  if (proForm){
    proForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = id => (document.getElementById(id).value || '').trim();
      const x = { nom:v('pfNom'), societe:v('pfSoc'), email:v('pfMail'), tel:v('pfTel') };
      const note = document.getElementById('pfNote');
      const bad = !x.nom ? 'pfNom' : !x.societe ? 'pfSoc' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x.email) ? 'pfMail' : null;
      proForm.querySelectorAll('input').forEach(i => i.removeAttribute('aria-invalid'));
      if (bad){
        document.getElementById(bad).setAttribute('aria-invalid', 'true'); document.getElementById(bad).focus();
        note.classList.add('is-err');
        note.textContent = bad === 'pfMail' ? 'Indiquez un email valide.' : 'Indiquez votre nom et votre société.';
        return;
      }
      info.nom = x.nom; info.societe = x.societe;
      window.open(waURL(devisMsg(x)), '_blank', 'noopener');
      note.classList.remove('is-err');
      note.textContent = nDevis() ? "WhatsApp s'est ouvert avec votre demande et votre devis : il ne reste qu'à l'envoyer."
        : "WhatsApp s'est ouvert avec votre demande : il ne reste qu'à l'envoyer.";
    });
  }

  // autre onglet : on suit les changements
  window.addEventListener('storage', e => {
    if (e.key !== 'dada-cart-v2' && e.key !== 'dada-devis-v1') return;
    cart = readCart(); devis = readDevis(); syncCards();
    if (isOpen()) render(); else renderBadge();
  });
  renderBadge();
})();

/* arrivée sur une ancre depuis une autre page (ex. particuliers.html#boutique) */
(function(){
  const id = (location.hash || '').slice(1);
  if (!/^[a-z][a-z0-9-]*$/i.test(id) || !document.getElementById(id)) return;
  window.addEventListener('load', () => setTimeout(() => smoothScrollTo('#' + id), 500));
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
    particulier:{ accent:'#E2001A', extra:'Sujet', can:'cola',
      help:`<h4>Une question&nbsp;?</h4><p>Un avis, une idée, un parfum introuvable&nbsp;? Écris-nous ici ou directement sur <a href="https://wa.me/33782206131" target="_blank" rel="noopener">WhatsApp</a>. Pour commander&nbsp;: la <a href="https://www.dadadrinks.com/shop-brine" target="_blank" rel="noopener">boutique officielle</a> (packs de 24).</p>` },
    pro:{ accent:'#1FA98C', extra:'Société', can:'mangue',
      help:`<h4>Espace Pro</h4><p>Revente, distribution, CHR&nbsp;: palettes de 25 à 100 packs, vitrines réfrigérées — tout est sur l'<a href="professionnels.html">espace pro</a>. Le plus rapide&nbsp;: <a href="https://wa.me/33782206131" target="_blank" rel="noopener">WhatsApp +33 7 82 20 61 31</a>.</p>` },
    presse:{ accent:'#A8275E', extra:'Média / publication', can:'cola-cherry',
      help:`<h4>Presse &amp; média</h4><p>Interview, visuels, reportage&nbsp;: précise ton média et ton délai, on revient vers toi. Tu peux aussi écrire en DM sur <a href="https://www.instagram.com/dadadrinks/" target="_blank" rel="noopener">Instagram</a>.</p>` },
    collab:{ accent:'#E3023B', extra:'Projet / lien (IG, portfolio)', can:'fraise',
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
    const exL = document.getElementById('ctgExtraLab');
    if (exL) exL.textContent = p.extra;
    // la canette de la jauge prend le parfum du profil (silhouette = URL absolue, cf. --can)
    const box = document.getElementById('ctgCan');
    if (box && p.can){
      const src = canSrc(p.can), abs = new URL(src, location.href).href;
      const swap = ()=>{ box.querySelectorAll('img').forEach(im=>{ im.src = src; }); box.style.setProperty('--can', `url("${abs}")`); };
      if (!box.dataset.can || REDUCED){ swap(); }
      else if (box.dataset.can !== p.can){ box.classList.add('is-swap'); setTimeout(()=>{ swap(); box.classList.remove('is-swap'); }, 260); }
      box.dataset.can = p.can;
    }
  }
  pfBtns.forEach(b=> b.addEventListener('click', ()=> applyProfile(b.dataset.profil)));
  // contact.html#pro (lien « Prendre rendez-vous » du bandeau SIAL) → profil présélectionné
  const fromHash = (location.hash || '').slice(1);
  applyProfile(PROFILES[fromHash] ? fromHash : 'particulier');

  /* ---- jauge : une vraie canette qui se remplit à mesure du formulaire ---- */
  const gauge = document.getElementById('ctGauge');
  const canBox = document.getElementById('ctgCan');
  const pctEl = document.getElementById('ctPct');
  const labEl = document.getElementById('ctGaugeLab');
  const steps = gauge ? [...gauge.querySelectorAll('.ctg-steps li')] : [];
  const F = { nom:document.getElementById('nom'), email:document.getElementById('email'), msg:document.getElementById('msg'), extra:document.getElementById('extra') };
  const okEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  const isDone = { nom:()=>F.nom.value.trim().length>1, email:()=>okEmail(F.email.value.trim()), msg:()=>F.msg.value.trim().length>4, extra:()=>F.extra.value.trim().length>0 };
  let wasFull = false;
  function setGauge(force){
    const n = force ? 3 : ['nom','email','msg'].filter(k=>isDone[k]()).length;
    const lvl = n/3;
    if (canBox) canBox.style.setProperty('--lvl', lvl.toFixed(3));
    if (pctEl) pctEl.textContent = Math.round(lvl*100)+'%';
    if (labEl) labEl.textContent = lvl>=1 ? 'Prête à partir !' : (lvl>0 ? 'Encore un effort…' : 'Remplis pour envoyer');
    steps.forEach(li=>{ const k=li.dataset.f; li.classList.toggle('is-done', (force && k!=='extra') || isDone[k]()); });
    const full = lvl>=1;
    if (gauge) gauge.classList.toggle('is-full', full);
    if (full && !wasFull && canBox){ const r=canBox.getBoundingClientRect(); dadaFizz(r.left+r.width/2, r.top+r.height*0.12, 14); }
    wasFull = full;
  }
  Object.values(F).forEach(f=> f && f.addEventListener('input', ()=>setGauge()));
  const bub = document.getElementById('ctgBubbles');
  if (bub && !REDUCED){
    for (let i=0;i<9;i++){ const b=document.createElement('i');
      b.style.cssText = `left:${(8+Math.random()*80).toFixed(1)}%;--s:${(4+Math.random()*7).toFixed(1)}px;--d:${(2.2+Math.random()*2.6).toFixed(2)}s;--dl:${(-Math.random()*4).toFixed(2)}s;--dx:${Math.round(Math.random()*16-8)}px`;
      bub.appendChild(b); }
  }
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
    setGauge(true);
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


/* --- CONTACT : le QG sur une vraie carte (Leaflet + tuiles OpenStreetMap, sans clé) --- */
(function(){
  const el = document.getElementById('ctMap');
  if (!el || typeof L === 'undefined') return;
  const QG = [48.870856, 2.305367];          // 66 avenue des Champs-Élysées, 75008 Paris (Base Adresse Nationale)
  const map = L.map(el, { center:QG, zoom:16, scrollWheelZoom:false, dragging:!COARSE, tap:false, zoomControl:true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(map);
  const icon = L.divIcon({ className:'dada-pin', iconSize:[56,64], iconAnchor:[28,53],
    html:'<span class="dp-pulse"></span><span class="dp-drop"><img src="assets/brand/logo-dada-white.png" alt=""></span>' });
  L.marker(QG, { icon, keyboard:false, title:'Dada Drinks — 66 avenue des Champs-Élysées' }).addTo(map);
  // la carte est mesurée avant la fin des animations d'entrée : on la recale une fois visible
  const io = new IntersectionObserver(es=>{ if (es.some(e=>e.isIntersecting)){ map.invalidateSize(); io.disconnect(); } });
  io.observe(el);
})();

/* ============================================================
   POLISH v56 — wipe de page, jus de scroll, fizz, footer DADA,
   parallax photo hero
   ============================================================ */
/* --- fizz : éclat de bulles (partagé) --- */
function dadaFizz(x, y, n){
  if (REDUCED) return;
  for (let i=0; i<(n||10); i++){
    const b = document.createElement('span');
    b.className = 'fizz-b';
    const s = gsap.utils.random(4,10);
    b.style.width = b.style.height = s+'px';
    b.style.left = (x-s/2)+'px'; b.style.top = (y-s/2)+'px';
    document.body.appendChild(b);
    gsap.fromTo(b, {opacity:1, scale:.6},
      { x:gsap.utils.random(-36,36), y:gsap.utils.random(-74,-24), scale:1, opacity:0,
        duration:gsap.utils.random(.55,1.05), ease:'power2.out', onComplete:()=>b.remove() });
  }
}

/* --- transition entre pages : wipe rouge --- */
(function(){
  // consomme le drapeau AVANT le guard reduced-motion (sinon il reste et
  // rejoue une arrivée fantôme quand l'utilisateur réactive les animations)
  const cameFromWipe = sessionStorage.getItem('dada-wipe') === '1';
  if (cameFromWipe) sessionStorage.removeItem('dada-wipe');
  if (REDUCED) return;
  const wipe = document.createElement('div');
  wipe.className = 'page-wipe'; wipe.setAttribute('aria-hidden','true');
  wipe.innerHTML = '<span>DADA</span>';
  document.body.appendChild(wipe);
  // normalise le transform : GSAP convertit le translateY(103%) du CSS en px
  // et le garderait comme composante séparée → on force y:0 + yPercent
  gsap.set(wipe, {yPercent:103, y:0});
  // arrivée : si on vient d'un wipe, il couvre puis s'échappe vers le haut
  if (cameFromWipe){
    gsap.fromTo(wipe, {yPercent:0}, {yPercent:-103, duration:.55, ease:'power3.inOut', delay:.05});
  }
  // départ : liens internes vers une autre page du site
  let leaving = false;
  document.addEventListener('click', e=>{
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href') || '';
    if (!/^[a-z-]+\.html(#.*)?$/i.test(href)) return;
    const cur = location.pathname.split('/').pop() || 'index.html';
    if (href.split('#')[0] === cur) return;          // même page (ancre) → laisser faire
    e.preventDefault();
    if (leaving) return;                             // anti double-clic / course entre liens
    leaving = true;
    sessionStorage.setItem('dada-wipe','1');
    gsap.killTweensOf(wipe);
    gsap.fromTo(wipe, {yPercent:103}, {yPercent:0, duration:.4, ease:'power3.in',
      onComplete:()=>{
        location.href = href;
        // failsafe : navigation annulée (Échap / réseau) → on relève le rideau
        setTimeout(()=>{ leaving = false; sessionStorage.removeItem('dada-wipe');
          gsap.to(wipe, {yPercent:103, duration:.4, ease:'power3.out'}); }, 2500);
      }});
  });
  // bfcache : ne jamais rester couvert au retour arrière
  window.addEventListener('pageshow', e=>{ if (e.persisted){ leaving=false; gsap.set(wipe, {yPercent:103, y:0}); } });
})();

/* --- barre de scroll « jus » --- */
(function(){
  const bar = document.createElement('div');
  bar.className = 'scroll-juice'; bar.setAttribute('aria-hidden','true');
  document.body.appendChild(bar);
  let max = 1;
  const measure = ()=>{ max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
  measure();
  window.addEventListener('resize', measure);
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.addEventListener('refresh', measure);
  const upd = ()=>{ bar.style.transform = 'scaleX(' + Math.min(1, window.pageYOffset/max) + ')'; };
  window.addEventListener('scroll', upd, {passive:true});
  upd();
})();


/* --- hero cinéma : lent drift parallax de la photo au scroll --- */
(function(){
  const photo = document.getElementById('heroPhoto');
  if (!photo || REDUCED) return;
  const img = photo.querySelector('img');
  if (typeof ScrollTrigger !== 'undefined' && img){
    gsap.set(img, {scale:1.12});
    gsap.fromTo(img, {yPercent:-4}, {yPercent:4, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top bottom', end:'bottom top', scrub:true }});
  }
})();

/* ============================================================
   V57 — traînée de bulles du curseur + bulles du CTA rouge
   ============================================================ */
(function(){
  if (COARSE || REDUCED) return;
  let lx=null, ly=null, acc=0, alive=0;
  window.addEventListener('mousemove', e=>{
    if (lx!==null) acc += Math.hypot(e.clientX-lx, e.clientY-ly);
    lx=e.clientX; ly=e.clientY;
    if (acc < 36 || alive >= 14) return;   // 1 bulle / ~36px de course, 14 max
    acc = 0; alive++;
    const b=document.createElement('span'); b.className='fizz-b fizz-t';
    const s=gsap.utils.random(3,6.5);
    b.style.width=b.style.height=s+'px';
    b.style.left=(e.clientX-s/2+gsap.utils.random(-6,6))+'px';
    b.style.top=(e.clientY-s/2+gsap.utils.random(-4,4))+'px';
    document.body.appendChild(b);
    gsap.to(b,{y:gsap.utils.random(-34,-14), x:gsap.utils.random(-10,10), opacity:0, scale:.35,
      duration:gsap.utils.random(.5,.8), ease:'power1.out', onComplete:()=>{ b.remove(); alive--; }});
  }, {passive:true});
})();

function boot(){ startIntro(); ScrollTrigger.refresh(); }
if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot);
// safety refresh after fonts
document.fonts && document.fonts.ready.then(()=> ScrollTrigger.refresh());
// safety: never let the intro trap the page
setTimeout(()=>{ const i=document.getElementById('intro'); if(i && getComputedStyle(i).display!=='none'){ i.style.display='none'; heroIntroReduced(); } }, 6000);
