import { mountFooter, mountGridIntro, mountTransitions } from './shared.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clock = document.querySelector('#clock');
const nav = document.querySelector('.nav');

function paintClock() {
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date()) + ' WAT / ABUJA';
}

paintClock();
const clockId = setInterval(paintClock, 1000);
let lastY = scrollY;
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = scrollY;
    nav?.classList.toggle('scrolled', y > 40 && y >= lastY);
    if (y < 40) nav?.classList.remove('scrolled');
    lastY = y;
    ticking = false;
  });
}, { passive: true });

const revealEls = document.querySelectorAll('.content-section,.work-card,.contact-card');
if (!reduced && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: 0.1 });
  revealEls.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
}

mountFooter({ reducedMotion: reduced });
mountGridIntro();
mountTransitions();

const city = document.querySelector('[data-cityscape]');
if (city && document.documentElement.classList.contains('theme-editorial')) city.hidden = true;
else if (city && !reduced) {
  import('three').then(({ default: THREE }) => {
    const renderer = new THREE.WebGLRenderer({ canvas: city, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1 : 1.25));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
      fragmentShader: `precision mediump float;varying vec2 vUv;uniform float uTime;float hash(float n){return fract(sin(n)*43758.5453);}void main(){vec2 uv=vUv;float c=0.0;for(int i=0;i<8;i++){float fi=float(i);float layer=1.0-fi*.07;float x=fract(uv.x*layer*12.0+uTime*(.004+fi*.001));float id=floor(uv.x*layer*12.0);float w=.72+hash(id+fi*19.0)*.24;float h=.08+hash(id*2.3+fi*31.0)*(.22+fi*.015);float b=step(x,w)*step(uv.y,h);c+=b*(.11-fi*.009);}gl_FragColor=vec4(vec3(.045,.012,.018)+vec3(.5,.025,.045)*c,1.0);}`
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    let raf = 0, visible = true;
    const resize = () => { const rect = city.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(city); resize();
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible && !document.hidden) draw(); else cancelAnimationFrame(raf); });
    observer.observe(city);
    const draw = () => { if (!visible || document.hidden) return; uniforms.uTime.value = performance.now() / 1000; renderer.render(scene, camera); raf = requestAnimationFrame(draw); };
    draw();
    addEventListener('pagehide', () => { cancelAnimationFrame(raf); resizeObserver.disconnect(); observer.disconnect(); material.dispose(); renderer.dispose(); }, { once: true });
  }).catch(error => console.warn('Cityscape unavailable:', error));
}

const globeHost = document.querySelector('[data-hero-globe]');
if (globeHost) {
  import('./hero-globe.js')
    .then(({ mountHeroGlobe }) => mountHeroGlobe(globeHost, { reducedMotion: reduced }))
    .catch(error => { globeHost.classList.add('globe-fallback'); globeHost.dataset.globeState = 'fallback'; console.warn('Hero globe unavailable; showing static fallback:', error); });
}

const homeOrbit = document.querySelector('[data-home-orbit]');
if (homeOrbit) {
  import('./home-orbit.js')
    .then(({ mountHomeOrbit }) => mountHomeOrbit(homeOrbit, { reducedMotion: reduced }))
    .catch(error => {
      homeOrbit.dataset.orbitState = 'fallback';
      homeOrbit.querySelector('[data-orbit-fallback]')?.removeAttribute('hidden');
      console.warn('Home orbit unavailable; showing static fallback:', error);
    });
}

  const awsArchitecture = document.querySelector('[data-aws-architecture]');
  if (awsArchitecture && !awsArchitecture.closest('main.home-main')) {
  import('./home-aws-architecture.js')
    .then(({ mountAwsArchitecture }) => mountAwsArchitecture(awsArchitecture, { reducedMotion: reduced }))
    .catch(error => {
      awsArchitecture.dataset.sceneState = 'fallback';
      awsArchitecture.querySelector('[data-aws-fallback]')?.removeAttribute('hidden');
      const canvas = awsArchitecture.querySelector('[data-aws-scene]');
      if (canvas) canvas.hidden = true;
      console.warn('AWS architecture scene unavailable; showing static fallback:', error);
    });
}

const ring = document.querySelector('[data-ring]');
if (ring && !reduced) {
  import('gsap').then(({ default: gsap }) => import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
    gsap.registerPlugin(ScrollTrigger);
    const circle = ring.querySelector('circle');
    if (!circle) return;
    const length = circle.getTotalLength();
    gsap.set(circle, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(circle, { strokeDashoffset: 0, scrollTrigger: { trigger: ring, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to(ring, { scale: 2.5, opacity: 0, scrollTrigger: { trigger: ring, start: 'top bottom', end: 'bottom top', scrub: true } });
  })).catch(error => console.warn('Ring animation unavailable:', error));
}

const faqItems = [...document.querySelectorAll('.home-faq-item')];
const faq = document.querySelector('.home-faq-display');
if (faq) faq.setAttribute('aria-label', faq.textContent.split('').join(' '));
faqItems.forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach(other => { if (other !== item) other.open = false; });
  });
});

const flock = document.querySelector('[data-home-faq-flock]');
const faqSection = document.querySelector('.home-faq-section');
if (flock && faqSection && !reduced) {
  const paths = [...flock.querySelectorAll('path')];
  let raf = 0, start = 0, lastFrame = 0, visible = false;
  const drawFlock = time => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (time - lastFrame < 55) { raf = requestAnimationFrame(drawFlock); return; }
    lastFrame = time;
    if (!start) start = time;
    const t = (time - start) / 1000;
    paths.forEach((path, i) => {
      const phase = t * (0.12 + (i % 3) * 0.018) + i * 1.73;
      const x = Math.sin(phase) * (5 + (i % 3) * 2) + Math.sin(phase * .37) * 2;
      const y = Math.sin(phase * .63 + i) * (2.3 + (i % 2)) + Math.cos(phase * .22) * 1.2;
      const drift = ((t * (1.3 + (i % 3) * .2) + i * 18) % 126) - 13;
      path.style.transform = `translate3d(${drift}%, ${y}%, 0) translate(${x}px, 0)`;
      path.style.opacity = String(.055 + (Math.sin(phase * .6 + i) + 1) * .035);
    });
    raf = requestAnimationFrame(drawFlock);
  };
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible && !raf) raf = requestAnimationFrame(drawFlock);
    else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0 });
  observer.observe(faqSection);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && visible && !raf) raf = requestAnimationFrame(drawFlock);
  });
  addEventListener('pagehide', () => { if (raf) cancelAnimationFrame(raf); observer.disconnect(); }, { once: true });
}

if (document.querySelector('#ai-orb') && document.querySelector('.orb-state')) {
  import('./ai-status-orb.js').then(({ createAIStatusOrb, ORB_STATES }) => {
    const canvas = document.querySelector('#ai-orb');
    try {
      const orb = createAIStatusOrb(canvas, { particles: innerWidth < 650 ? 4200 : 7000, autoplay: false, maxDpr: 1.5 });
      window.orb = orb;
      const buttons = [...document.querySelectorAll('.orb-state')];
      const update = name => {
        orb.setState(name);
        buttons.forEach(button => { const active = button.dataset.state === name; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      };
      buttons.forEach(button => button.addEventListener('click', () => update(button.dataset.state)));
      addEventListener('keydown', event => {
        if (event.target.closest('button,input,textarea,select')) return;
        if (/^[1-4]$/.test(event.key)) update(ORB_STATES[Number(event.key) - 1]);
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { const index = ORB_STATES.indexOf(orb.getState()); update(ORB_STATES[(index + (event.key === 'ArrowRight' ? 1 : -1) + 4) % 4]); }
      });
    } catch (error) {
      canvas.hidden = true;
      const fallback = document.querySelector('.orb-fallback');
      if (fallback) fallback.hidden = false;
      console.warn('Orb fallback:', error.message);
    }
  }).catch(error => console.warn('Orb module failed:', error));
}

addEventListener('pagehide', () => clearInterval(clockId), { once: true });
