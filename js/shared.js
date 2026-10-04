/* Shared footer and app-level motion primitives. */

export function mountFooter({ reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches } = {}) {
  if (document.querySelector('.ascii-footer')) {
    const footer = document.querySelector('.ascii-footer');
    if (!footer.querySelector('.ascii-hand') || !footer.querySelector('.footer-header h1')) {
      const markup = `<div class="footer-revealer" aria-hidden="true"></div><div class="footer-images" aria-hidden="true"><div class="footer-hand-img left"><canvas class="ascii-hand" aria-hidden="true"></canvas></div><div class="footer-hand-img right"><canvas class="ascii-hand" aria-hidden="true"></canvas></div></div><div class="footer-content"><nav class="footer-links" aria-label="Footer navigation"><a href="work.html">Work</a><a href="project.html">AWS case study</a><a href="lab.html">Lab</a><a href="contact.html">Contact</a></nav><div class="footer-text"><p>Cloud infrastructure and workflow automation for business systems. Abuja, Nigeria.</p></div></div><div class="footer-header" aria-label="I automate what costs you time"><h1><span>I automate</span><span>what costs you time</span></h1></div>`;
      footer.innerHTML = markup;
    }
    enhanceFooter(footer, reducedMotion);
    return;
  }
  const footer = document.createElement('footer');
  footer.className = 'ascii-footer';
  footer.innerHTML = `<div class="footer-revealer" aria-hidden="true"></div><div class="footer-images" aria-hidden="true"><div class="footer-hand-img left"><canvas class="ascii-hand" aria-hidden="true"></canvas></div><div class="footer-hand-img right"><canvas class="ascii-hand" aria-hidden="true"></canvas></div></div><div class="footer-content"><nav class="footer-links" aria-label="Footer navigation"><a href="work.html">Work</a><a href="project.html">AWS case study</a><a href="lab.html">Lab</a><a href="contact.html">Contact</a></nav><div class="footer-text"><p>Cloud infrastructure and workflow automation for business systems. Abuja, Nigeria.</p></div></div><div class="footer-header" aria-label="I automate what costs you time"><h1><span>I automate</span><span>what costs you time</span></h1></div>`;
  document.body.append(footer);
  enhanceFooter(footer, reducedMotion);
}

function enhanceFooter(footer, reducedMotion) {
  const cleanupParallax = !reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches ? initFooterParallax(footer) : () => {};
  const asciiControllers = initAsciiImages(footer, { reducedMotion, interactive: !reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches });
  if (reducedMotion) {
    footer.classList.add('revealed');
    footer.querySelectorAll('.footer-links a,.footer-text p,.footer-header span').forEach(el => { el.style.visibility = 'visible'; });
    return;
  }
  import('gsap').then(async ({ default: gsap }) => {
    const [{ ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
      import('gsap/ScrollTrigger'), import('gsap/SplitText'), import('lenis'),
    ]);
    gsap.registerPlugin(ScrollTrigger, SplitText);
    if (!window.__portfolioLenis) {
      const lenis = new Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.08, autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      const tick = time => lenis.raf(time * 1000);
      gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
      window.__portfolioLenis = { lenis, tick, gsap };
    }
    initFooterReveal(footer, gsap, ScrollTrigger, SplitText);
  }).catch(error => {
    footer.classList.add('footer-static', 'revealed');
    footer.querySelectorAll('.footer-links a,.footer-text p,.footer-header span').forEach(el => { el.style.visibility = 'visible'; el.style.transform = 'none'; });
    footer.querySelectorAll('.footer-hand-img').forEach((hand, i) => hand.style.setProperty('--hand-x', i ? '5%' : '-5%'));
    console.warn('Animated footer unavailable; showing static footer:', error);
  });
  addEventListener('pagehide', () => {
    cleanupParallax();
    asciiControllers.forEach(controller => controller.destroy());
    window.__portfolioLenis?.lenis.destroy();
    if (window.__portfolioLenis?.tick && window.__portfolioLenis?.gsap) window.__portfolioLenis.gsap.ticker.remove(window.__portfolioLenis.tick);
    window.__portfolioLenis = null;
  }, { once: true });
}

const ASCII_CHARS = '........:::=+xX#0369';
const CHAR_COLOR = '#803500';
const HOVER_COLOR = '#ff6a00';
const HOVER_CHAR_COLOR = '#0f0f0f';
const HOVER_RADIUS = 8;
const CLUSTER_SIZE = 10;
const HIGHLIGHT_LIFETIME = 300;

function initAsciiImages(footer, { reducedMotion, interactive }) {
  const controllers = [];
  footer.querySelectorAll('.footer-hand-img').forEach((wrap, i) => {
    const canvas = wrap.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const controller = { destroy: () => {} };
    controllers.push(controller);
    const image = new Image(); image.decoding = 'async';
    image.src = new URL(i === 0 ? '../images/hand-left.jpg' : '../images/hand-right.jpg', import.meta.url).href;
    image.addEventListener('load', () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const cssWidth = Math.max(220, Math.min(640, innerWidth * (innerWidth < 620 ? 0.72 : 0.46)));
      const cssHeight = cssWidth * image.naturalHeight / image.naturalWidth;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const cell = Math.max(7, Math.min(11, Math.round(cssWidth / (innerWidth < 620 ? 56 : 76))));
      const cols = Math.max(1, Math.floor(cssWidth / cell));
      const rows = Math.max(1, Math.round(cols * image.naturalHeight / image.naturalWidth));
      const cellW = cssWidth / cols, cellH = cssHeight / rows;
      const fontSize = Math.max(7, Math.min(11, Math.round(cellH * 0.78)));
      canvas.width = Math.round(cssWidth * dpr); canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`; canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = `${fontSize}px "DM Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const offCtx = off.getContext('2d', { willReadFrequently: true }); offCtx.drawImage(image, 0, 0, cols, rows);
      const pixels = offCtx.getImageData(0, 0, cols, rows).data;
      const cells = new Map();
      const staticLayer = document.createElement('canvas'); staticLayer.width = canvas.width; staticLayer.height = canvas.height;
      const staticCtx = staticLayer.getContext('2d'); staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0); staticCtx.font = ctx.font; staticCtx.textAlign = 'center'; staticCtx.textBaseline = 'middle'; staticCtx.fillStyle = CHAR_COLOR;
      const threshold = ASCII_CHARS.lastIndexOf('.');
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const pixel = (row * cols + col) * 4;
        const brightness = (pixels[pixel] + pixels[pixel + 1] + pixels[pixel + 2]) / 765;
        const charIndex = Math.min(ASCII_CHARS.length - 1, Math.floor((1 - brightness) * ASCII_CHARS.length));
        if (charIndex <= threshold) continue;
        const cellData = { col, row, char: ASCII_CHARS[charIndex], highlightEndTime: 0 };
        cells.set(`${col},${row}`, cellData);
        staticCtx.fillText(cellData.char, col * cellW + cellW / 2, row * cellH + cellH / 2);
      }
      let raf = 0, visible = false;
      const draw = () => {
        raf = 0; if (!visible) return;
        ctx.clearRect(0, 0, cssWidth, cssHeight); ctx.drawImage(staticLayer, 0, 0, cssWidth, cssHeight);
        const now = Date.now(); let active = false;
        for (const cellData of cells.values()) if (cellData.highlightEndTime > now) {
          active = true; ctx.fillStyle = HOVER_COLOR; ctx.fillRect(cellData.col * cellW, cellData.row * cellH, cellW, cellH);
          ctx.fillStyle = HOVER_CHAR_COLOR; ctx.fillText(cellData.char, cellData.col * cellW + cellW / 2, cellData.row * cellH + cellH / 2);
        }
        if (interactive && active) raf = requestAnimationFrame(draw);
      };
      const schedule = () => { if (visible && !raf) raf = requestAnimationFrame(draw); };
      const highlightCluster = (start, now) => {
        let current = start;
        for (let step = 0; step < CLUSTER_SIZE && current; step++) {
          current.highlightEndTime = now + HIGHLIGHT_LIFETIME + step * 10;
          const neighbours = [];
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const next = cells.get(`${current.col + dx},${current.row + dy}`); if (next) neighbours.push(next);
          }
          current = neighbours.length ? neighbours[Math.floor(Math.random() * neighbours.length)] : null;
        }
      };
      const onPointerMove = event => {
        const rect = canvas.getBoundingClientRect();
        const col = (event.clientX - rect.left) / rect.width * cols, row = (event.clientY - rect.top) / rect.height * rows;
        let nearest = null, distance = Infinity;
        for (const cellData of cells.values()) { const d = Math.hypot(cellData.col - col, cellData.row - row); if (d < distance) { nearest = cellData; distance = d; } }
        if (nearest && distance <= HOVER_RADIUS) { highlightCluster(nearest, Date.now()); schedule(); }
      };
      if (interactive) canvas.addEventListener('pointermove', onPointerMove, { passive: true });
      const observer = new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); if (visible) { draw(); schedule(); } else { cancelAnimationFrame(raf); raf = 0; } }, { threshold: 0.01 });
      observer.observe(footer);
      controller.destroy = () => { visible = false; cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener('pointermove', onPointerMove); };
      wrap.dataset.asciiState = 'ready';
      if (reducedMotion) { visible = true; draw(); }
    }, { once: true });
    image.addEventListener('error', () => { wrap.dataset.asciiState = 'fallback'; }, { once: true });
  });
  return controllers;
}

function initFooterParallax(footer) {
  const hands = [...footer.querySelectorAll('.footer-hand-img')]; if (hands.length !== 2) return () => {};
  const strength = 20, ease = 0.05; let targetX = 0, targetY = 0, driftX = 0, driftY = 0, raf = 0, visible = false;
  hands.forEach(hand => hand.style.setProperty('--hand-scale', String(1 + strength * 2 / 200)));
  const onMove = event => { const rect = footer.getBoundingClientRect(); targetX = ((event.clientX - rect.left) / rect.width - 0.5) * strength * 2; targetY = ((event.clientY - rect.top) / rect.height - 0.5) * strength * 2; schedule(); };
  const onLeave = () => { targetX = 0; targetY = 0; schedule(); };
  const tick = () => { raf = 0; if (!visible) return; driftX += (targetX - driftX) * ease; driftY += (targetY - driftY) * ease; hands[0].style.setProperty('--hand-x', `${-5 + driftX}px`); hands[0].style.setProperty('--hand-y', `${-driftY}px`); hands[1].style.setProperty('--hand-x', `${5 - driftX}px`); hands[1].style.setProperty('--hand-y', `${-driftY}px`); if (Math.abs(targetX - driftX) > 0.1 || Math.abs(targetY - driftY) > 0.1) schedule(); };
  function schedule() { if (visible && !raf) raf = requestAnimationFrame(tick); }
  const observer = new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); if (!visible) { cancelAnimationFrame(raf); raf = 0; } else schedule(); }, { threshold: 0.01 });
  observer.observe(footer); footer.addEventListener('pointermove', onMove, { passive: true }); footer.addEventListener('pointerleave', onLeave);
  return () => { observer.disconnect(); cancelAnimationFrame(raf); footer.removeEventListener('pointermove', onMove); footer.removeEventListener('pointerleave', onLeave); };
}

function initFooterReveal(footer, gsap, ScrollTrigger, SplitText) {
  const heading = footer.querySelector('.footer-header h1');
  const chars = new SplitText(heading, { type: 'chars', charsClass: 'char' });
  const lineTargets = [footer.querySelector('.footer-text p'), ...footer.querySelectorAll('.footer-links a')];
  const lines = new SplitText(lineTargets, { type: 'lines', mask: 'lines', linesClass: 'line' });
  gsap.set(chars.chars, { position: 'relative', yPercent: 125 }); gsap.set(lines.lines, { yPercent: 100 }); gsap.set(lineTargets, { visibility: 'visible' });
  const hands = footer.querySelectorAll('.footer-hand-img'), reveal = { left: -125, right: 125 };
  gsap.set(hands[0], { xPercent: reveal.left, scale: 1.2 }); gsap.set(hands[1], { xPercent: reveal.right, scale: 1.2 });
  let active = false;
  const animateIn = () => {
    if (active) return; active = true; footer.classList.add('revealed');
    gsap.timeline().to(reveal, { left: 0, right: 0, duration: 1, ease: 'power3.out', onUpdate: () => { gsap.set(hands[0], { xPercent: reveal.left }); gsap.set(hands[1], { xPercent: reveal.right }); } }, 0)
      .to(chars.chars, { yPercent: 0, duration: 0.8, ease: 'power3.out', stagger: { each: 0.04, from: 'center' } }, 0.08)
      .to(lines.lines, { yPercent: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.18);
  };
  const animateOut = () => {
    if (!active) return; active = false; gsap.set(reveal, { left: 0, right: 0 }); footer.classList.remove('revealed');
    gsap.timeline().to(reveal, { left: -125, right: 125, duration: 0.4, ease: 'power2.in', onUpdate: () => { gsap.set(hands[0], { xPercent: reveal.left }); gsap.set(hands[1], { xPercent: reveal.right }); } }, 0)
      .to(chars.chars, { yPercent: 125, duration: 0.35, ease: 'power2.in', stagger: { each: 0.01, from: 'center' } }, 0)
      .to(lines.lines, { yPercent: 100, duration: 0.32, ease: 'power2.in', stagger: 0.02 }, 0);
  };
  const trigger = ScrollTrigger.create({ trigger: footer.querySelector('.footer-revealer'), start: 'top 50%', onEnter: animateIn, onLeaveBack: animateOut });
  if (footer.getBoundingClientRect().top < innerHeight * 0.5) animateIn();
  addEventListener('pagehide', () => { trigger.kill(); chars.revert(); lines.revert(); }, { once: true });
}

export function mountGridIntro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || sessionStorage.getItem('grid-intro-seen')) return;
  const overlay = document.createElement('div'); overlay.className = 'grid-intro'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', 'intro-title');
  overlay.innerHTML = '<div class="grid-intro-cells" aria-hidden="true"></div><div class="grid-intro-content"><p class="eyebrow">PT / CLOUD SYSTEMS</p><h2 id="intro-title">Interface<br>ready.</h2><p class="grid-progress-label">INITIALISING <span>100%</span></p><button class="button" type="button">Enter →</button><button class="intro-skip" type="button">Skip intro</button></div>';
  document.body.append(overlay); const cells = overlay.querySelector('.grid-intro-cells'); for (let i = 0; i < 12; i++) { const d = document.createElement('i'); cells.append(d); }
  requestAnimationFrame(() => overlay.classList.add('ready'));
  const close = () => { sessionStorage.setItem('grid-intro-seen', '1'); overlay.classList.add('exit'); setTimeout(() => overlay.remove(), 650); };
  overlay.querySelector('.button').addEventListener('click', close); overlay.querySelector('.intro-skip').addEventListener('click', close); overlay.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }); overlay.querySelector('.button').focus();
}

export function mountTransitions() {
  document.addEventListener('click', event => {
    const link = event.target.closest('a'); if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.origin !== location.origin || !link.pathname.match(/\.(html)?$/)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault(); sessionStorage.setItem('page-transition', '1');
    const cover = document.createElement('div'); cover.className = 'page-cover'; cover.innerHTML = '<div></div>'.repeat(12); document.body.append(cover);
    requestAnimationFrame(() => cover.classList.add('cover')); setTimeout(() => location.href = link.href, 520);
  });
}
