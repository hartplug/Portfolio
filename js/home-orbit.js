import * as THREE from 'three';

const ORBIT_CONTENT = [
  { key: 'cloud', label: 'CLOUD', color: 0xcbb278, detail: 'AWS architecture and deployment.' },
  { key: 'workflows', label: 'WORKFLOWS', color: 0xb8754f, detail: 'Practical document and workflow automation.' },
  { key: 'it', label: 'IT SOLUTIONS', color: 0x91c5ce, detail: 'IT solutions shaped around business needs.' },
];

const point = (angle, radius, tilt) => new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * Math.cos(tilt), Math.sin(angle) * radius * Math.sin(tilt));

export function mountHomeOrbit(host, { reducedMotion = false } = {}) {
  const canvas = host.querySelector('[data-orbit-canvas]');
  const fallback = host.querySelector('[data-orbit-fallback]');
  const detail = host.querySelector('[data-orbit-detail]');
  if (!canvas) return { destroy() {} };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth >= 700, powerPreference: 'low-power' });
  } catch {
    host.dataset.orbitState = 'fallback';
    fallback?.removeAttribute('hidden');
    return { destroy() {} };
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 620 ? 1.25 : 1.6));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
  camera.position.set(0, 0, 7.2);
  const root = new THREE.Group(); scene.add(root);
  const core = new THREE.Group(); root.add(core);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 24), new THREE.MeshBasicMaterial({ color: 0xcbb278, wireframe: true, transparent: true, opacity: 0.28 }));
  core.add(globe);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1.12, 20, 14), new THREE.MeshBasicMaterial({ color: 0x8db9bd, transparent: true, opacity: 0.1, side: THREE.BackSide }));
  core.add(inner);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), new THREE.MeshBasicMaterial({ color: 0xdcc38e, transparent: true, opacity: 0.13 }));
  core.add(halo);

  const rings = [], orbitObjects = [], orbitRadius = 1.72;
  ORBIT_CONTENT.forEach((item, i) => {
    const tilt = [0.34, -0.55, 0.88][i];
    const curve = new THREE.EllipseCurve(0, 0, orbitRadius, orbitRadius * (0.73 + i * 0.035), 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(128).map(p => new THREE.Vector3(p.x, p.y * Math.cos(tilt), p.y * Math.sin(tilt)));
    const ringGeom = new THREE.BufferGeometry().setFromPoints(pts);
    const ringMat = new THREE.LineBasicMaterial({ color: item.color, transparent: true, opacity: 0.23 });
    const ring = new THREE.LineLoop(ringGeom, ringMat);
    ring.rotation.set([0.25, -0.3, 0.12][i], [0.2, 0.82, -0.68][i], 0.12 * i);
    root.add(ring); rings.push([ringGeom, ringMat]);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), new THREE.MeshBasicMaterial({ color: item.color }));
    node.userData = { key: item.key, label: item.label }; root.add(node);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.12 })); root.add(light);
    orbitObjects.push({ item, node, light, angle: [0.22, 2.28, 4.56][i], speed: [0.12, -0.09, 0.075][i], tilt });
  });

  const starPositions = new Float32Array(240 * 3); let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < starPositions.length; i += 3) { const a = rand() * Math.PI * 2, r = 2.15 + rand() * 1.9; starPositions[i] = Math.cos(a) * r; starPositions[i + 1] = (rand() - 0.5) * 3.5; starPositions[i + 2] = (rand() - 0.5) * 1.5; }
  const starsGeo = new THREE.BufferGeometry(); starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMat = new THREE.PointsMaterial({ color: 0xd7c9a7, size: 0.012, transparent: true, opacity: 0.52, sizeAttenuation: true });
  const stars = new THREE.Points(starsGeo, starsMat); root.add(stars);

  let raf = 0, visible = false, destroyed = false, dragging = false, moved = false, pointerId = null, downX = 0, downY = 0, detailTimer = 0;
  let targetRotX = -0.12, targetRotY = 0;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const resize = () => { const rect = host.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); render(); };
  const render = () => { if (!destroyed) renderer.render(scene, camera); };
  const showDetail = item => {
    if (!detail) return;
    clearTimeout(detailTimer); detail.querySelector('[data-orbit-detail-title]').textContent = item.label;
    detail.querySelector('[data-orbit-detail-copy]').textContent = item.detail; detail.dataset.active = item.key; detail.classList.add('is-open');
    detailTimer = window.setTimeout(() => detail.classList.remove('is-open'), 3400);
  };
  const pick = event => {
    const rect = canvas.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(orbitObjects.map(o => o.node), false);
    if (hits[0]) { const found = orbitObjects.find(o => o.node === hits[0].object); if (found) showDetail(found.item); }
  };
  const down = event => { if (reducedMotion || event.button > 0) return; dragging = true; moved = false; pointerId = event.pointerId; downX = event.clientX; downY = event.clientY; canvas.setPointerCapture?.(pointerId); };
  const move = event => {
    if (!dragging || pointerId !== event.pointerId) return;
    const dx = event.clientX - downX, dy = event.clientY - downY;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (moved) { targetRotY += dx * 0.006; targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.004, -0.7, 0.7); downX = event.clientX; downY = event.clientY; render(); }
  };
  const up = event => { if (!dragging || pointerId !== event.pointerId) return; dragging = false; pointerId = null; if (!moved) pick(event); if (!reducedMotion && visible) start(); };
  const cancel = () => { dragging = false; pointerId = null; };
  if (!reducedMotion) { canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', cancel); }
  canvas.addEventListener('click', pick);

  const frame = now => {
    raf = 0; if (destroyed || !visible || document.hidden || reducedMotion || dragging) return;
    const t = now * 0.001; root.rotation.x += (targetRotX - root.rotation.x) * 0.045; root.rotation.y += (targetRotY - root.rotation.y) * 0.045;
    core.rotation.y = t * 0.11; core.rotation.x = Math.sin(t * 0.15) * 0.018; halo.scale.setScalar(1 + Math.sin(t * 0.8) * 0.06);
    rings.forEach(([, mat], i) => { mat.opacity = 0.17 + 0.07 * (0.5 + 0.5 * Math.sin(t * 0.72 + i * 2)); });
    orbitObjects.forEach(o => { o.angle += o.speed * 0.016; const pos = point(o.angle, orbitRadius, o.tilt); o.node.position.copy(pos); o.light.position.copy(pos); o.light.scale.setScalar(1 + Math.sin(t * 1.3 + o.angle) * 0.13); });
    stars.rotation.z = Math.sin(t * 0.045) * 0.018; render(); raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && visible && !document.hidden && !destroyed && !reducedMotion) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const observer = new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); if (visible) { render(); start(); } else stop(); }, { threshold: 0.01 });
  const resizeObserver = new ResizeObserver(resize); observer.observe(host); resizeObserver.observe(host); resize();
  const visibilityChange = () => document.hidden ? stop() : start(); document.addEventListener('visibilitychange', visibilityChange);
  const activate = event => { const button = event.target.closest('[data-orbit-control]'); if (!button) return; const item = ORBIT_CONTENT.find(x => x.key === button.dataset.orbitControl); if (item) showDetail(item); };
  host.querySelectorAll('[data-orbit-control]').forEach(button => button.addEventListener('click', activate));
  host.dataset.orbitState = reducedMotion ? 'static' : 'ready';
  const destroy = () => {
    if (destroyed) return; destroyed = true; stop(); clearTimeout(detailTimer); observer.disconnect(); resizeObserver.disconnect(); document.removeEventListener('visibilitychange', visibilityChange);
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', cancel); canvas.removeEventListener('click', pick);
    host.querySelectorAll('[data-orbit-control]').forEach(button => button.removeEventListener('click', activate));
    globe.geometry.dispose(); globe.material.dispose(); inner.geometry.dispose(); inner.material.dispose(); halo.geometry.dispose(); halo.material.dispose(); rings.forEach(([g, m]) => { g.dispose(); m.dispose(); });
    orbitObjects.forEach(o => { o.node.geometry.dispose(); o.node.material.dispose(); o.light.geometry.dispose(); o.light.material.dispose(); }); starsGeo.dispose(); starsMat.dispose(); renderer.dispose();
  };
  addEventListener('pagehide', destroy, { once: true });
  return { destroy, showDetail };
}
