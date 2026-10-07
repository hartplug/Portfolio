import * as THREE from 'three';

export const ORB_STATES = ['listening', 'reasoning', 'searching', 'done'];
const COLORS = { listening: '#ff8fa3', reasoning: '#7c9cff', searching: '#ffbf5e', done: '#6ee7b0' };
const hexRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;

function createProgram(gl) {
  const vertex = `attribute vec3 aPosition;attribute vec3 aColor;uniform vec2 uResolution;uniform float uPointSize;uniform float uGain;varying vec3 vColor;void main(){float f=3.4;float s=f/(f-aPosition.z);vec2 p=vec2(aPosition.x,-aPosition.y)*s;gl_Position=vec4(p,0.0,1.0);gl_PointSize=uPointSize*s;vColor=aColor*(0.5+0.5*s)*uGain;}`;
  const fragment = `precision mediump float;varying vec3 vColor;void main(){float d=length(gl_PointCoord-vec2(0.5));float a=smoothstep(0.5,0.08,d);gl_FragColor=vec4(vColor*a,max(max(vColor.r,vColor.g),vColor.b)*a);}`;
  const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Shader compile failed');return shader;};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Shader link failed');return program;
}

export function createAIStatusOrb(canvas, options = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) throw new Error('WebGL is unavailable');
  const program = createProgram(gl);
  const positionBuffer = gl.createBuffer();
  const colorBuffer = gl.createBuffer();
  const loc = {
    position: gl.getAttribLocation(program, 'aPosition'),
    color: gl.getAttribLocation(program, 'aColor'),
    size: gl.getUniformLocation(program, 'uPointSize'),
    gain: gl.getUniformLocation(program, 'uGain'),
  };
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(0, 0, 0, 0);
  const count = Math.max(500, Math.min(options.particles ?? 8000, 16000));
  const seed0 = options.seed ?? 31713;
  let seed = seed0 >>> 0;
  const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const s = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { s[i * 4] = rnd(); s[i * 4 + 1] = rnd(); s[i * 4 + 2] = rnd(); s[i * 4 + 3] = rnd(); }
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const fromPositions = new Float32Array(count * 3);
  const fromColors = new Float32Array(count * 3);
  const stateColors = Object.fromEntries(ORB_STATES.map(k => [k, hexRgb(options.colors?.[k] ?? COLORS[k])]));
  let current = 'listening', from = 'listening', transitionStart = 0, transitionDuration = options.transition ?? 1.15;
  let voice = null, elapsed = 0, running = false, raf = 0, visible = true, destroyed = false;
  let autoplay = options.autoplay ?? false, lastAuto = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dpr = 1, width = 1, height = 1;

  function getColor() {
    const t = transitionStart ? smooth((elapsed - transitionStart) / transitionDuration) : 1;
    return stateColors[current].map((v, i) => mix(stateColors[from][i], v, t));
  }
  function setState(nameOrIndex, cfg = {}) {
    const next = typeof nameOrIndex === 'number' ? ORB_STATES[(nameOrIndex + ORB_STATES.length) % ORB_STATES.length] : nameOrIndex;
    if (!ORB_STATES.includes(next) || next === current) return;
    update(elapsed); fromPositions.set(positions); fromColors.set(colors);
    from = current; current = next; transitionStart = elapsed; transitionDuration = (options.transition ?? 1.15) * (reduced ? 0.6 : 1);
    if (cfg.instant) { from = current; transitionStart = 0; }
    canvas.setAttribute('aria-label', `Animated particle orb in ${current} state`);
    options.onStateChange?.(current);
  }
  function rotate(x, y, z, ax, ay) {
    const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
  }
  function targetAt(i, t) {
    const k = i * 4, a = s[k], b = s[k + 1], c = s[k + 2], d = s[k + 3];
    let x = 0, y = 0, z = 0, brightness = 0.5;
    if (current === 'listening') {
      const yy = 1 - 2 * a, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), phi = Math.PI * (3 - Math.sqrt(5)) * i;
      const lon = phi, lat = Math.acos(yy), v = voice === null ? .5 + .5 * Math.sin(t * 1.9) * Math.sin(t * 3.1 + 1.2) : voice;
      const ripple = Math.sin(lat * 6 - t * 3.2) * (.03 + .07 * v) + Math.sin(lon * 4 + t * 1.2) * .015;
      const r = (.8 + ripple) * Math.pow(c, .12);
      x = Math.cos(phi) * rr * r; y = yy * r; z = Math.sin(phi) * rr * r;
      brightness = .28 + Math.max(0, ripple) * 4 + .18 * d;
      [x, y, z] = rotate(x, y, z, .3, t * .22);
    } else if (current === 'reasoning') {
      const u = (a + t * .04) * Math.PI * 2, tube = .09 * Math.cbrt(b), theta = c * Math.PI * 2;
      const r = Math.cos(3 * u) + 2;
      x = .29 * r * Math.cos(2 * u) + tube * Math.cos(theta);
      y = .29 * r * Math.sin(2 * u) + tube * Math.sin(theta);
      z = -.29 * Math.sin(3 * u) + (d - .5) * .09;
      [x, y, z] = rotate(x, y, z, .55 + Math.sin(t * .3) * .35, t * .34);
      brightness = .26 + .4 * d;
    } else if (current === 'searching') {
      const phi = b * Math.PI * 2, ring = Math.floor(a * 10) < 7, r = ring ? (Math.floor(c * 5) + 1) / 5 * .92 : Math.sqrt(d) * .92;
      x = r * Math.cos(phi); y = r * Math.sin(phi); z = (rndFor(i) - .5) * .012;
      const beam = (t * 2.2) % (Math.PI * 2); let delta = (beam - phi) % (Math.PI * 2); if (delta < 0) delta += Math.PI * 2;
      const glow = Math.exp(-1.6 * delta);
      y += glow * .06; [x, y, z] = rotate(x, y, z, -.8, t * .14);
      brightness = (ring ? .2 : .08) + 1.25 * glow;
    } else {
      const breathing = 1 + .015 * Math.sin(t * 1.6), ring = a < .5;
      if (ring) { const phi = b * Math.PI * 2, r = .86 + (c - .5) * .035; x = Math.cos(phi) * r; y = Math.sin(phi) * r; z = (d - .5) * .035; }
      /* In screen-space, positive Y points down: negate to keep the Done mark upright. */
      else {
        const q = b * 2, p0 = q < 1 ? [-.38, .02] : [-.11, -.26], p1 = q < 1 ? [-.11, -.26] : [.42, .30], u = c;
        x = mix(p0[0], p1[0], u) + (d - .5) * .07; y = -(mix(p0[1], p1[1], u) + (a - .5) * .07); z = (rndFor(i) - .5) * .035;
      }
      /* The ring may breathe and turn subtly; keep the inner completion mark upright. */
      if (ring) [x, y, z] = rotate(x * breathing, y * breathing, z, 0, Math.sin(t * .6) * .2);
      brightness = .7 + .25 * d;
    }
    if (d > .965) brightness += .25;
    return [x, y, z, brightness];
  }
  function rndFor(i) { const v = Math.sin((i + seed0) * 127.1) * 43758.5453; return v - Math.floor(v); }
  function resize() {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const cap = options.maxDpr ?? 1.5; dpr = Math.min(devicePixelRatio || 1, cap);
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (w === width && h === height) return;
    width = w; height = h;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  function update(t) {
    elapsed = t;
    const dest = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const blend = transitionStart ? smooth((t - transitionStart) / transitionDuration) : 1;
    const aspect = width / Math.max(1, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (let i = 0; i < count; i++) {
      const [x, y, z, bright] = targetAt(i, t);
      let xx = x, yy = y, zz = z;
      const idx = i * 3;
      const c = stateColors[current];
      if (blend < 1 && from !== current) {
        const v=s[i*4+1]*2-1, ang=s[i*4]*Math.PI*2, rr=Math.sqrt(1-v*v), burst=Math.sin(Math.PI*blend)*.24*(.4+s[i*4+1]);
        xx=mix(fromPositions[idx],x,blend)+Math.cos(ang)*rr*burst;
        yy=mix(fromPositions[idx+1],y,blend)+v*burst;
        zz=mix(fromPositions[idx+2],z,blend)+Math.sin(ang)*rr*burst;
      }
      dest[idx]=xx/aspect;dest[idx+1]=yy;dest[idx+2]=zz;
      col[idx]=mix(fromColors[idx],c[0]*bright*.8,blend);
      col[idx+1]=mix(fromColors[idx+1],c[1]*bright*.8,blend);
      col[idx+2]=mix(fromColors[idx+2],c[2]*bright*.8,blend);
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer); gl.bufferData(gl.ARRAY_BUFFER, dest, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(loc.position); gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer); gl.bufferData(gl.ARRAY_BUFFER, col, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(loc.color); gl.vertexAttribPointer(loc.color, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(loc.gain, options.glow ?? .12); gl.uniform1f(loc.size, (options.pointSize ?? 3) * dpr * 5); gl.drawArrays(gl.POINTS, 0, count);
    gl.uniform1f(loc.size, (options.pointSize ?? 3) * dpr); gl.uniform1f(loc.gain, 1); gl.drawArrays(gl.POINTS, 0, count);
    const [r, g, b] = getColor().map(v => Math.round(v * 255)); canvas.parentElement?.style.setProperty('--orb-accent', `${r},${g},${b}`);
    if (autoplay && t - lastAuto > 3.2 && !userTouched) { lastAuto = t; setState((ORB_STATES.indexOf(current) + 1) % 4); }
  }
  let userTouched = false;
  function frame() { if (destroyed || !running || !visible || document.hidden) { raf = 0; return; } resize(); elapsed += (1 / 60) * (reduced ? .35 : 1); update(elapsed); raf = requestAnimationFrame(frame); }
  function play() { if (destroyed) return; running = true; if (!raf) raf = requestAnimationFrame(frame); }
  function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function onKey(e) {
    if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return;
    if (/^[1-4]$/.test(e.key)) { userTouched = true; setState(Number(e.key) - 1); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { userTouched = true; const n = ORB_STATES.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1); setState((n + 4) % 4); }
  }
  window.addEventListener('keydown', onKey);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) play(); else pause(); }); observer.observe(canvas);
  const visibility = () => document.hidden ? pause() : visible && play(); document.addEventListener('visibilitychange', visibility);
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  canvas.setAttribute('aria-label', 'Animated particle orb in Listening state');
  resize(); update(0); play();
  return {
    setState(nameOrIndex, cfg) { userTouched = true; setState(nameOrIndex, cfg); },
    getState: () => current,
    getColor,
    setVoiceLevel(v) { voice = v === null ? null : clamp(v); },
    setColors(obj) { for (const [k, v] of Object.entries(obj)) if (COLORS[k]) stateColors[k] = typeof v === 'string' ? hexRgb(v) : v; },
    renderAt(seconds) { elapsed = seconds; update(seconds); }, play, pause, resize,
    destroy() { destroyed = true; pause(); observer.disconnect(); ro.disconnect(); window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', visibility); gl.deleteBuffer(positionBuffer); gl.deleteBuffer(colorBuffer); gl.deleteProgram(program); }
  };
}

const canvas = document.querySelector('#ai-orb');
if (canvas && !window.__orbInitialized) {
  window.__orbInitialized = true;
  try {
    const orb = createAIStatusOrb(canvas, { particles: matchMedia('(max-width: 600px)').matches ? 3500 : 6500, autoplay: false });
    window.orb = orb;
    const controls = [...document.querySelectorAll('.orb-state')];
    const choose = name => { orb.setState(name); controls.forEach(btn => { const active = btn.dataset.state === name; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); }); };
    controls.forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.state)));
    const states = [...controls];
    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = states.findIndex(b => b.dataset.state === orb.getState()); choose(states[(n + (e.key === 'ArrowRight' ? 1 : -1) + states.length) % states.length].dataset.state); }
      else if (/^[1-4]$/.test(e.key)) choose(states[Number(e.key) - 1].dataset.state);
    });
  } catch (error) {
    canvas.hidden = true;
    document.querySelector('.orb-fallback').hidden = false;
    console.warn('AI Status Orb fallback:', error.message);
  }
}
