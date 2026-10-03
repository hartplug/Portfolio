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
  revealEls.forEach(element => {
    element.classList.add('reveal');
    observer.observe(element);
  });
}

mountFooter();
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

const ring = document.querySelector('[data-ring]');
if (ring && !reduced) {
  import('gsap')
    .then(({ default: gsap }) => import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);
      const circle = ring.querySelector('circle');
      if (!circle) return;
      const length = circle.getTotalLength();
      gsap.set(circle, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(circle, { strokeDashoffset: 0, scrollTrigger: { trigger: ring, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to(ring, { scale: 2.5, opacity: 0, scrollTrigger: { trigger: ring, start: 'top bottom', end: 'bottom top', scrub: true } });
    }))
    .catch(error => console.warn('Ring animation unavailable:', error));
}

if (document.querySelector('#ai-orb')) {
  import('./ai-status-orb.js').then(({ createAIStatusOrb, ORB_STATES }) => {
    const canvas = document.querySelector('#ai-orb');
    try {
      const orb = createAIStatusOrb(canvas, { particles: innerWidth < 650 ? 3000 : 5500, autoplay: true, maxDpr: 1.5 });
      window.orb = orb;
      const buttons = [...document.querySelectorAll('.orb-state')];
      const update = name => {
        orb.setState(name);
        buttons.forEach(button => {
          const active = button.dataset.state === name;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
      };
      buttons.forEach(button => button.addEventListener('click', () => update(button.dataset.state)));
      addEventListener('keydown', event => {
        if (event.target.closest('button,input,textarea,select')) return;
        if (/^[1-4]$/.test(event.key)) update(ORB_STATES[Number(event.key) - 1]);
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          const index = ORB_STATES.indexOf(orb.getState());
          update(ORB_STATES[(index + (event.key === 'ArrowRight' ? 1 : -1) + 4) % 4]);
        }
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
