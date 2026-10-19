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
const canSrc = id => `assets/cans/clean/${id}.png?v=3`;
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
      ${canFX(f.id, 'pk-can', 'Dada ' + f.name)}
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

/* enseignes (accueil) : défilement continu, ralenti au survol */
(function(){
  const track = document.querySelector('.retailers-track');
  if (!track || REDUCED) return;
  const loop = gsap.to(track, { xPercent:-50, repeat:-1, duration:34, ease:'none' });
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
  ScrollTrigger.create({
    trigger:'.experience', start:'top top', end:'bottom bottom', scrub:true,
    onUpdate:self=>{
      const p = self.progress;
      const idx = Math.min(steps.length-1, Math.floor(p*steps.length*0.999));
      steps.forEach((s,i)=> s.classList.toggle('is-active', i===idx));
      gsap.set(expCan, { rotationY:-16+p*32, y:(p-0.5)*-50, rotationZ:(p-0.5)*6 });
      // le reflet glisse sur le métal à mesure que la canette pivote
      expCan.style.setProperty('--sx', (118 - p*136).toFixed(1) + '%');
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
  // contact.html#pro (lien « Prendre rendez-vous » du bandeau SIAL) → profil présélectionné
  const fromHash = (location.hash || '').slice(1);
  applyProfile(PROFILES[fromHash] ? fromHash : 'particulier');

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
/* ajout panier → fizz + pop de l'icône
   (phase de capture : les boutons boutique font stopPropagation) */
document.addEventListener('click', e=>{
  const btn = e.target.closest('.fc-add,.pk-add,.fr-add');
  if (!btn) return;
  let x=e.clientX, y=e.clientY;
  if (!x && !y){ const r=btn.getBoundingClientRect(); x=r.left+r.width/2; y=r.top+r.height/2; }
  dadaFizz(x, y, 12);
  // on anime le SVG interne : le bouton a une transition CSS + un :hover
  // transform qui entreraient en conflit avec un tween sur le bouton lui-même
  const c = document.querySelector('.cart-toggle svg');
  if (c && !REDUCED) gsap.fromTo(c, {scale:1}, {scale:1.28, duration:.16, yoyo:true, repeat:1,
    ease:'power2.out', transformOrigin:'50% 50%', clearProps:'transform'});
}, true);

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
