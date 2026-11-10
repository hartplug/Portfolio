/* home-command-scene-W_myw5i2.js — Home hero cinematic globe (redesign).
 * A large dark metallic digital globe with procedural geographic detail,
 * champagne-gold orbital rings, electric-cyan data paths, floating glass
 * tech cards, illuminated particle drift and atmospheric rim lighting —
 * a full-bleed interactive 3D background behind the Home hero content.
 * Simulated visualization only. Public contract preserved:
 *   export mountHomeCommandScene(host) -> { destroy, reset, inspect }
 *   host.__orbitInspect() -> { scene, camera, renderer, root, reducedMotion, contextLost }
 */
import {
  WebGLRenderer, PerspectiveCamera, Scene, Color, Group, Mesh,
  MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial, SphereGeometry,
  TorusGeometry, TubeGeometry, QuadraticBezierCurve3,
  Vector3, MathUtils, HemisphereLight, DirectionalLight,
  PointLight, AdditiveBlending, DoubleSide, BackSide,
  ACESFilmicToneMapping, PMREMGenerator, PlaneGeometry
} from './three.module-BbDkOMEo.js';

const SAND = 0xc4b596, SAND_MUTED = 0xa89a7a, CYAN = 0x7ab8c8;

export function mountHomeCommandScene(host) {
  const stage = host.querySelector('.command-stage') || host;
  const canvas = host.querySelector('[data-command-canvas]');
  const fallback = host.querySelector('[data-command-fallback]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposables = { geo: [], mat: [] };
  const listeners = [];
  let dead = false, raf = 0, contextLost = false, visible = true, frames = 0;

  if (!canvas) {
    host.dataset.sceneState = 'fallback';
    if (fallback) fallback.hidden = false;
    return { destroy() {}, reset() {}, inspect: () => ({ reducedMotion: reduced, contextLost: false }) };
  }

  let renderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { host.dataset.sceneState = 'fallback'; if (fallback) fallback.hidden = false;
    return { destroy() {}, reset() {}, inspect: () => ({ reducedMotion: reduced, contextLost: true }) }; }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = 'srgb';

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 60);

  { /* cool studio env for metal reflections */
    const pm = new PMREMGenerator(renderer);
    const env = new Scene();
    const mk = (w, h, c, i, x, y, z, ry) => {
      const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: c, side: DoubleSide }));
      m.material.color.multiplyScalar(i); m.position.set(x, y, z); m.rotation.y = ry; env.add(m);
    };
    mk(10, 4, new Color(0x232d44), 2.4, 0, 4, -7, 0);
    mk(9, 3, new Color(0x8fa8c8), 0.9, -5, 3, 2, 1.2);
    mk(9, 3, new Color(0x14283a), 2.0, 5, 2.5, 2, -1.2);
    mk(7, 2, new Color(0xffffff), 2.0, 0, 8, 0, Math.PI / 2);
    scene.environment = pm.fromScene(env, 0.06).texture;
    env.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    pm.dispose();
  }

  const root = new Group(); scene.add(root);

  /* ---------- globe ---------- */
  const globe = new Group(); root.add(globe);
  const R = 2.15;
  const surfaceMat = new MeshStandardMaterial({ color: 0x12100e, metalness: 0.85, roughness: 0.35, envMapIntensity: 1.2 });
  disposables.mat.push(surfaceMat);
  const globeMesh = new Mesh(new SphereGeometry(R, 48, 32), surfaceMat);
  disposables.geo.push(globeMesh.geometry);
  globeMesh.rotation.y = 0.4; globe.add(globeMesh);

  /* procedural geographic detail: continents + graticule (additive shader shell) */
  const detailMat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    uniforms: { uT: { value: 0 }, uC: { value: new Color(0x181512) }, uHot: { value: new Color(0xa89a7a) } },
    vertexShader: `
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      void main(){ vP=position; vN=normalize(normalMatrix*normal); vUv=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vP; varying vec3 vN; varying vec2 vUv;
      uniform float uT; uniform vec3 uC; uniform vec3 uHot;
      float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise(vec3 p){
        vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        float n=mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
        return n; }
      void main(){
        float land=noise(vP*1.35)*.6+noise(vP*2.9)*.3+noise(vP*6.1)*.1;
        float continents=smoothstep(.52,.62,land);
        float grid=max(abs(fract(vUv.x*24.)-.5),abs(fract(vUv.y*16.)-.5));
        float lines=smoothstep(.47,.5,grid)*.30;
        float rim=pow(1.-abs(dot(vN,vec3(0.,0.,1.))),2.)*.26;
        vec3 col=mix(uC,uHot,continents*.55);
        float a=continents*.46+lines+rim;
        gl_FragColor=vec4(col,a*.78); }`
  });
  disposables.mat.push(detailMat);
  const detailMesh = new Mesh(new SphereGeometry(R * 1.003, 48, 32), detailMat);
  disposables.geo.push(detailMesh.geometry);
  detailMesh.rotation.y = 0.4; globe.add(detailMesh);

  /* atmosphere rim glow */
  const atmoMat = new ShaderMaterial({
    transparent: true, depthWrite: false, side: BackSide, blending: AdditiveBlending,
    uniforms: { uC: { value: new Color(0xc4b596) } },
    vertexShader: 'varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vN;uniform vec3 uC;void main(){float i=pow(.72-dot(vN,vec3(0.,0.,1.)),3.);gl_FragColor=vec4(uC,i*.68);}'
  });
  disposables.mat.push(atmoMat);
  const atmo = new Mesh(new SphereGeometry(R * 1.16, 32, 24), atmoMat);
  disposables.geo.push(atmo.geometry); globe.add(atmo);

  /* ---------- champagne-gold orbital rings ---------- */
  const COPPER = 0xad7050;
  const ringDefs = [
    { r: 2.38, tube: 0.004,  tilt: [0.35, 1.15, 0.50], precess: 0.05,  emissive: 0.15, arc: 1.05, col: SAND },
    { r: 2.58, tube: 0.0035, tilt: [-0.45, -1.25, 1.70], precess: -0.04, emissive: 0.10, arc: 0.85, col: COPPER },
    { r: 2.80, tube: 0.003,  tilt: [0.20, 1.35, 2.80], precess: 0.03,  emissive: 0.08, arc: 0.70, col: SAND },
  ];
  const rings = ringDefs.map(d => {
    const g = new TorusGeometry(d.r, d.tube, 8, 90, d.arc);
    disposables.geo.push(g);
    const m = new MeshStandardMaterial({ color: d.col, metalness: 0.9, roughness: 0.32,
      emissive: new Color(d.col).multiplyScalar(0.22), emissiveIntensity: d.emissive, envMapIntensity: 1.1 });
    disposables.mat.push(m);
    const ring = new Mesh(g, m);
    ring.rotation.set(d.tilt[0], d.tilt[1], d.tilt[2]);
    root.add(ring);
    return { mesh: ring, precess: d.precess, base: d.tilt.slice() };
  });

  /* ---------- cyan data-path arcs + packets ---------- */
  const arcMat = () => {
    const m = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uC: { value: new Color(CYAN) }, uPulse: { value: -1 } },
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vU;uniform vec3 uC;uniform float uPulse;
        void main(){float a=.22;float ends=smoothstep(0.,.06,vU.x)*smoothstep(1.,.94,vU.x);
        if(uPulse>=0.){a+=exp(-abs(vU.x-uPulse)*16.)*.8;}
        gl_FragColor=vec4(uC,a*ends);}`
    });
    disposables.mat.push(m); return m;
  };
  const arcs = [];
  const sph = (lat, lon, rr) => new Vector3(
    rr * Math.cos(lat) * Math.cos(lon), rr * Math.sin(lat), rr * Math.cos(lat) * Math.sin(lon));
  for (let i = 0; i < 5; i++) {
    const a1 = sph(0.35 + i * 0.28 - 0.5, i * 1.1 + 0.3, R * 1.01);
    const a2 = sph(0.1 - i * 0.32, i * 1.2 + 2.2, R * 1.01);
    const mid = a1.clone().add(a2).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.28 + i * 0.06));
    const curve = new QuadraticBezierCurve3(a1, mid, a2);
    const g = new TubeGeometry(curve, 40, 0.012, 6, false);
    disposables.geo.push(g);
    const mesh = new Mesh(g, arcMat());
    globe.add(mesh);
    arcs.push({ mesh, curve, phase: i * 0.19, dur: 3.4 + i * 0.5 });
  }
  const arcPktG = new SphereGeometry(0.03, 8, 6); disposables.geo.push(arcPktG);
  const packets = arcs.map((a, i) => {
    const m = new MeshBasicMaterial({ color: i % 2 ? 0xe8dfc8 : 0x9fd8f0, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false });
    disposables.mat.push(m);
    const p = new Mesh(arcPktG, m); globe.add(p);
    return { arc: a, mesh: p };
  });

  /* ---------- floating glass tech cards ---------- */
  const cardMat = new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide,
    uniforms: { uT: { value: 0 }, uC: { value: new Color(0xa89a7a) } },
    vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vU;uniform float uT;uniform vec3 uC;
      void main(){
        float frame=smoothstep(0.,.05,vU.x)*smoothstep(1.,.95,vU.x)*smoothstep(0.,.09,vU.y)*smoothstep(1.,.91,vU.y);
        float lines=step(.86,fract(vU.y*7.))*.3*step(.12,vU.x)*step(vU.x,.88);
        float bar=step(vU.y,.5+.3*sin(uT*.8+vU.x*9.))*.28*step(.15,vU.x)*step(vU.x,.85)*step(.2,vU.y)*step(vU.y,.8);
        float a=frame*.5+lines*.5+bar;
        gl_FragColor=vec4(uC,a*.6);}`
  });
  disposables.mat.push(cardMat);
  const cardGeo = new PlaneGeometry(0.62, 0.4); disposables.geo.push(cardGeo);
  const cards = [];
  [[-2.6, 1.7, 1.6, 0.5], [2.7, 2.1, -0.8, -0.6], [3.0, -0.9, 1.9, -0.35], [-2.9, -1.6, -0.4, 0.45]].forEach((d, i) => {
    const c = new Mesh(cardGeo, cardMat);
    c.position.set(d[0], d[1], d[2]); c.rotation.y = d[3];
    root.add(c); cards.push({ mesh: c, base: [d[0], d[1], d[2]], ph: i * 1.7 });
  });

  /* ---------- particle drift ---------- */
  const partGeo = new SphereGeometry(0.014, 6, 5); disposables.geo.push(partGeo);
  const parts = [];
  for (let i = 0; i < 22; i++) {
    const m = new MeshBasicMaterial({ color: i % 4 === 3 ? CYAN : SAND, transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false });
    disposables.mat.push(m);
    const p = new Mesh(partGeo, m);
    p.userData = { rr: 2.6 + (i % 5) * 0.55, a: i * 0.628, el: 0.5 + Math.sin(i * 2.1) * 0.5, sp: 0.06 + (i % 4) * 0.02 };
    root.add(p); parts.push(p);
  }

  /* ---------- lighting ---------- */
  scene.add(new HemisphereLight(0x181512, 0x0a0907, 1.0));
  const key = new DirectionalLight(0xc8d8f0, 1.4); key.position.set(-5, 7, 6); scene.add(key);
  const rimG = new PointLight(SAND, 0.9, 12, 2); rimG.position.set(4.5, 3.5, -4); scene.add(rimG);
  const rimC = new PointLight(CYAN, 0.35, 12, 2); rimC.position.set(-4, -2.5, 4); scene.add(rimC);

  /* ---------- layout / camera (globe offset right on wide screens) ---------- */
  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, r.width < 620 ? 1.3 : 1.6));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    const wide = r.width >= 900, tab = r.width >= 620;
    root.scale.setScalar(wide ? 0.95 : tab ? 0.52 : 0.42);
    if (wide)     { root.position.set(3.02, -0.10, 0); camera.position.set(0, 0.90, 8.4); }
    else if (tab) { root.position.set(1.15, -0.95, 0); camera.position.set(0, 0.60, 8.4); }
    else          { root.position.set(0.00, -0.95, 0); camera.position.set(0, 0.40, 8.4); }
    camera.lookAt(0, 0.10, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  /* ---------- pointer parallax ---------- */
  let px = 0, py = 0, tx = 0, ty = 0;
  const onPointer = e => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  const onLeave = () => { tx = 0; ty = 0; };
  addEventListener('pointermove', onPointer);
  stage.addEventListener('pointerleave', onLeave);
  listeners.push(['pointermove', onPointer, null], ['pointerleave', onLeave, stage]);

  /* ---------- context loss ---------- */
  const onLost = e => { e.preventDefault(); contextLost = true; host.dataset.sceneState = 'fallback';
    if (fallback) fallback.hidden = false; };
  const onRestored = () => { contextLost = false; host.dataset.sceneState = reduced ? 'static' : 'ready';
    if (fallback) fallback.hidden = true; renderOnce(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  listeners.push(['webglcontextlost', onLost, canvas], ['webglcontextrestored', onRestored, canvas]);

  host.__orbitInspect = () => ({ scene, camera, renderer, root, services: [], reducedMotion: reduced, contextLost });

  /* ---------- loop ---------- */
  let t = 0, last = 0, adaptDone = false, adaptN = 0, adaptSum = 0, adaptT0 = 0;
  function tick(now) {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    if (contextLost || document.hidden || !visible) return;
    const dt = Math.min((now - last) / 1000 || 0, 0.1); last = now;
    t += dt;
    if (!adaptDone && !reduced) {
      if (!adaptT0) adaptT0 = now;
      adaptN++; adaptSum += dt;
      if (now - adaptT0 > 2600 && adaptN >= 12) {
        if ((adaptSum / adaptN) * 1000 > 58) { renderer.setPixelRatio(1); resize(); }
        adaptDone = true;
      }
    }
    const sp = reduced ? 0 : dt * 0.06;
    globe.rotation.y += sp;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    root.rotation.y = reduced ? 0 : px * 0.12;
    root.rotation.x = reduced ? 0 : py * 0.05;
    rings.forEach(rg => { rg.mesh.rotation.z = rg.base[2] + (reduced ? 0 : t * rg.precess); });
    arcs.forEach(a => { a.mesh.material.uniforms.uPulse.value = -1; });
    packets.forEach(p => {
      const cyc = (t / p.arc.dur + p.arc.phase) % 1;
      if (!reduced || cyc < 0.5) {
        p.mesh.position.copy(p.arc.curve.getPoint(cyc));
        p.arc.mesh.material.uniforms.uPulse.value = cyc;
        p.mesh.visible = true;
      } else p.mesh.visible = false;
    });
    cards.forEach(c => {
      c.mesh.position.y = c.base[1] + (reduced ? 0 : Math.sin(t * 0.7 + c.ph) * 0.12);
      c.mesh.rotation.z = reduced ? 0 : Math.sin(t * 0.4 + c.ph) * 0.05;
    });
    if (!reduced) parts.forEach(p => {
      p.userData.a += dt * p.userData.sp;
      p.position.set(
        Math.cos(p.userData.a) * p.userData.rr,
        p.userData.el + Math.sin(t * 0.5 + p.userData.a) * 0.3,
        Math.sin(p.userData.a) * p.userData.rr * 0.7);
    });
    if (detailMat.uniforms) detailMat.uniforms.uT.value = t;
    if (cardMat.uniforms) cardMat.uniforms.uT.value = t;
    renderer.render(scene, camera);
    frames++;
  }
  function renderOnce() { if (!contextLost) renderer.render(scene, camera); }

  const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0.02 });
  io.observe(host);
  const onVis = () => { if (!document.hidden && !dead) last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  listeners.push(['visibilitychange', onVis, document]);

  if (reduced) {
    packets.forEach(p => { p.mesh.position.copy(p.arc.curve.getPoint(0.35)); p.mesh.visible = true; });
    parts.forEach(p => {
      p.position.set(Math.cos(p.userData.a) * p.userData.rr, p.userData.el, Math.sin(p.userData.a) * p.userData.rr * 0.7);
    });
    renderOnce();
    host.dataset.sceneState = 'static';
  } else {
    raf = requestAnimationFrame(tick);
    host.dataset.sceneState = 'ready';
  }

  function destroy() {
    if (dead) return; dead = true;
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    listeners.forEach(([type, fn, el]) => {
      if (el === null) removeEventListener(type, fn);
      else if (el) el.removeEventListener(type, fn);
    });
    scene.traverse(o => { if (o.isMesh) { o.geometry?.dispose?.(); o.material?.dispose?.(); } });
    disposables.mat.forEach(m => m.dispose());
    disposables.geo.forEach(g => g.dispose());
    renderer.dispose();
    delete host.__orbitInspect;
  }
  addEventListener('pagehide', destroy, { once: true });

  return {
    destroy,
    reset: () => { px = py = tx = ty = 0; globe.rotation.y = 0; if (reduced) renderOnce(); },
    inspect: () => ({ selected: null, hovered: null, reducedMotion: reduced, contextLost, routeCount: arcs.length, frames })
  };
}
