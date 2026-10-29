import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SYSTEMS = [
  { id: 'network', label: 'NETWORK', state: 'TRAFFIC ROUTING', position: [-1.55, 0.75, 1.12], tint: 0x91c5ce },
  { id: 'compute', label: 'COMPUTE', state: 'WORKLOADS', position: [0, 0.35, 0], tint: 0xd3bd8a },
  { id: 'data', label: 'DATA', state: 'STORAGE & PROCESSING', position: [1.48, -0.16, 0.7], tint: 0x91c5ce },
  { id: 'security', label: 'SECURITY', state: 'IDENTITY & POLICY', position: [-1.12, 1.43, -0.92], tint: 0xb8754f },
  { id: 'automation', label: 'AUTOMATION', state: 'REPEATABLE OPERATIONS', position: [1.18, -0.77, -1.04], tint: 0xb8754f },
  { id: 'observability', label: 'OBSERVABILITY', state: 'HEALTH & SIGNALS', position: [0.12, 1.47, 1.08], tint: 0x91c5ce },
];
const CONNECTIONS = [
  ['network', 'compute', 'traffic'], ['network', 'data', 'traffic'],
  ['security', 'compute', 'guard'], ['compute', 'data', 'traffic'],
  ['automation', 'compute', 'ops'], ['automation', 'data', 'ops'],
  ['observability', 'network', 'signal'], ['observability', 'compute', 'signal'], ['observability', 'data', 'signal'],
];
const COLORS = { traffic: 0x91c5ce, guard: 0xb8754f, ops: 0xd3bd8a, signal: 0xaabfc0 };
const v = ([x, y, z]) => new THREE.Vector3(x, y, z);

function frameGeometry(size, y, color, opacity = 0.42) {
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, 0.012, size));
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  line.position.y = y;
  return line;
}

export function mountHomeObservatory(host, { reducedMotion = false } = {}) {
  const canvas = host.querySelector('[data-observatory-canvas]');
  const fallback = host.querySelector('[data-observatory-fallback]');
  const detail = host.querySelector('[data-system-detail]');
  const buttons = [...host.querySelectorAll('[data-system-select]')];
  if (!canvas) return { destroy() {} };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth >= 700, powerPreference: 'default' });
  } catch {
    host.dataset.sceneState = 'fallback';
    if (fallback) fallback.hidden = false;
    return { destroy() {} };
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 620 ? 1.15 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x090a0b, 0.045);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(5.2, 4.15, 7.1);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.28, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.58;
  controls.maxPolarAngle = 2.15;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.22;

  scene.add(new THREE.HemisphereLight(0xddd1b0, 0x101517, 1.55));
  const key = new THREE.DirectionalLight(0xe9d7a8, 2.25); key.position.set(-3, 6, 5); scene.add(key);
  const cool = new THREE.PointLight(0x638e9a, 9, 12, 2); cool.position.set(3, 2, -3); scene.add(cool);
  const copper = new THREE.PointLight(0x9d5e3c, 4, 9, 2); copper.position.set(-4, 0, -2); scene.add(copper);

  const world = new THREE.Group();
  world.rotation.set(-0.12, 0.08, 0.02);
  scene.add(world);
  const geometries = new Set();
  const materials = new Set();
  const own = object => { if (object.geometry) geometries.add(object.geometry); const ms = Array.isArray(object.material) ? object.material : [object.material]; ms.filter(Boolean).forEach(m => materials.add(m)); return object; };
  const mat = (color, opts = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.24, ...opts }); materials.add(m); return m; };

  // Open, nested planes — an architectural section, not a globe or dashboard.
  const platformMaterial = mat(0x111513, { roughness: 0.72, metalness: 0.16, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
  for (const [size, y, tint, opacity] of [[4.05, -0.92, 0xd3bd8a, 0.38], [3.16, -0.14, 0x91c5ce, 0.34], [2.28, 0.64, 0xd3bd8a, 0.5]]) {
    const plate = own(new THREE.Mesh(new THREE.BoxGeometry(size, 0.045, size), platformMaterial));
    plate.position.y = y; world.add(plate);
    world.add(frameGeometry(size, y + 0.025, tint, opacity));
    const inset = frameGeometry(size * 0.87, y + 0.027, tint, opacity * 0.4); inset.rotation.y = Math.PI / 2; world.add(inset);
  }
  // Fine, sparse construction ticks along the layered planes.
  const tickMaterial = new THREE.LineBasicMaterial({ color: 0xc9b47d, transparent: true, opacity: 0.25, depthWrite: false }); materials.add(tickMaterial);
  for (let i = -2; i <= 2; i++) {
    const x = i * 0.68;
    const line = own(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -0.885, -1.95), new THREE.Vector3(x, -0.885, 1.95)]), tickMaterial));
    world.add(line);
  }
  // Central workload core: a small stack of load-bearing enclosures.
  const core = new THREE.Group(); core.position.set(0, 0.35, 0); world.add(core);
  for (const [w, h, d, y, color] of [[0.86, 0.28, 0.72, -0.25, 0x151816], [0.72, 0.3, 0.6, 0.06, 0x1b1d19], [0.52, 0.2, 0.48, 0.31, 0x24231e]]) {
    const block = own(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.43, metalness: 0.38 })));
    block.position.y = y; core.add(block);
    const outline = new THREE.LineSegments(new THREE.EdgesGeometry(block.geometry), new THREE.LineBasicMaterial({ color: 0xd3bd8a, transparent: true, opacity: 0.52, depthWrite: false }));
    outline.position.copy(block.position); core.add(outline); geometries.add(outline.geometry); materials.add(outline.material);
  }
  const coreSignal = own(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.12), mat(0xd3bd8a, { emissive: 0x594a27, emissiveIntensity: 0.5, roughness: 0.34 })));
  coreSignal.position.set(0, 0.47, 0); core.add(coreSignal);

  const byId = new Map(SYSTEMS.map(item => [item.id, item]));
  const nodes = new Map();
  const clickable = [];
  SYSTEMS.forEach((item, index) => {
    const group = new THREE.Group(); group.position.copy(v(item.position)); group.userData.systemId = item.id; world.add(group);
    const w = index === 1 ? 0.58 : 0.42, h = index === 1 ? 0.48 : 0.34, d = index === 1 ? 0.48 : 0.38;
    const casing = own(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(index === 1 ? 0x24231e : 0x171a18, { roughness: 0.48, metalness: 0.3 })));
    group.add(casing);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(casing.geometry), new THREE.LineBasicMaterial({ color: item.tint, transparent: true, opacity: 0.78, depthWrite: false }));
    group.add(edge); geometries.add(edge.geometry); materials.add(edge.material);
    const stripe = own(new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.018, 0.024), mat(item.tint, { emissive: item.tint, emissiveIntensity: 0.18, roughness: 0.4 })));
    stripe.position.set(0, h * 0.2, d * 0.51); group.add(stripe);
    const indicator = own(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.045), mat(item.tint, { emissive: item.tint, emissiveIntensity: 0.5 })));
    indicator.position.set(w * 0.34, h * 0.22, d * 0.52); group.add(indicator);
    const hit = own(new THREE.Mesh(new THREE.BoxGeometry(w * 1.5, h * 1.7, d * 1.5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })));
    hit.userData.systemId = item.id; group.add(hit); clickable.push(hit);
    nodes.set(item.id, { item, group, casing, edge, indicator, hit });
  });

  const connections = [];
  CONNECTIONS.forEach(([from, to, type], i) => {
    const a = v(byId.get(from).position), b = v(byId.get(to).position);
    // Deliberate orthogonal riser-and-bridge pathways, with a slight offset to show depth.
    const mid1 = new THREE.Vector3(a.x, Math.max(a.y, b.y) + 0.11 + (i % 2) * 0.045, a.z);
    const mid2 = new THREE.Vector3(b.x, mid1.y, b.z);
    const curve = new THREE.CatmullRomCurve3([a, mid1, mid2, b], false, 'centripetal', 0.25);
    const points = curve.getPoints(24);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({ color: COLORS[type], transparent: true, opacity: 0.46, dashSize: 0.09, gapSize: 0.065, depthWrite: false });
    const route = new THREE.Line(geo, material); route.computeLineDistances(); world.add(route);
    geometries.add(geo); materials.add(material);
    const tracer = own(new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.055), mat(COLORS[type], { emissive: COLORS[type], emissiveIntensity: 0.25, roughness: 0.36 })));
    world.add(tracer);
    connections.push({ from, to, type, route, curve, tracer, phase: i / CONNECTIONS.length });
  });

  // A restrained set of construction anchors and suspended uprights makes depth legible.
  const structural = new THREE.LineBasicMaterial({ color: 0x8b7860, transparent: true, opacity: 0.3, depthWrite: false }); materials.add(structural);
  for (const [x, z] of [[-1.82, -1.75], [1.82, -1.75], [-1.82, 1.75], [1.82, 1.75]]) {
    const line = own(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -0.89, z), new THREE.Vector3(x, 0.18, z)]), structural)); world.add(line);
  }
  // A few system-state markers, rather than a decorative particle cloud.
  const markerData = [[-1.95, -0.22, 0.18], [1.9, 0.42, -0.24], [-0.15, 1.9, -1.42], [1.72, -0.74, 1.38]];
  markerData.forEach((p, i) => {
    const marker = own(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), mat(i === 1 ? 0xb8754f : 0x91c5ce, { emissive: i === 1 ? 0x59321f : 0x203c42, emissiveIntensity: 0.4 })));
    marker.position.copy(v(p)); world.add(marker);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selectedId = null;
  let hoverId = null;
  let raf = 0;
  let visible = false;
  let destroyed = false;
  let last = 0;
  let elapsed = 0;
  let pointerDown = null;
  const setDetail = item => {
    if (!detail) return;
    detail.querySelector('[data-system-name]').textContent = item.label;
    detail.querySelector('[data-system-state]').textContent = item.state;
    detail.dataset.active = item.id;
  };
  const applySelection = id => {
    selectedId = id && byId.has(id) ? id : null;
    host.dataset.selectedSystem = selectedId || '';
    if (selectedId) setDetail(byId.get(selectedId));
    else if (detail) {
      detail.querySelector('[data-system-name]').textContent = 'SYSTEM OVERVIEW';
      detail.querySelector('[data-system-state]').textContent = 'CONNECTED BUSINESS INFRASTRUCTURE';
      detail.dataset.active = 'overview';
    }
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.systemSelect === selectedId)));
    updateHighlight();
    render();
  };
  const updateHighlight = () => {
    const active = selectedId || hoverId;
    connections.forEach(({ from, to, route, tracer }) => {
      const related = !active || from === active || to === active;
      route.material.opacity = related ? (active ? 0.86 : 0.46) : 0.1;
      tracer.visible = related;
    });
    nodes.forEach((entry, id) => {
      const related = !active || id === active || connections.some(c => (c.from === active || c.to === active) && (c.from === id || c.to === id));
      entry.edge.material.opacity = related ? (id === active ? 1 : 0.68) : 0.24;
      entry.indicator.scale.setScalar(id === active ? 1.35 : 1);
    });
  };
  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    camera.aspect = rect.width / rect.height;
    camera.fov = rect.width < 500 ? 39 : rect.width < 900 ? 36 : 34;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    controls.update();
    render();
  };
  const render = () => { if (!destroyed) renderer.render(scene, camera); };
  const onPointerMove = event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickable, false);
    const next = hits[0]?.object.userData.systemId || null;
    if (next !== hoverId) { hoverId = next; canvas.style.cursor = next ? 'pointer' : 'grab'; if (!selectedId) { updateHighlight(); render(); } }
  };
  const onPointerDown = event => { pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId }; };
  const onPointerUp = event => {
    if (!pointerDown || pointerDown.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 7;
    pointerDown = null;
    if (moved) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(clickable, false)[0]?.object.userData.systemId;
    applySelection(hit === selectedId ? null : hit);
  };
  const onKeyDown = event => {
    if (event.key === 'Escape') applySelection(null);
  };
  const onVisibility = () => { if (document.hidden) stop(); else start(); };
  const frame = now => {
    raf = 0;
    if (destroyed || !visible || document.hidden) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now; elapsed += dt;
    controls.update();
    connections.forEach(({ curve, tracer, phase }) => {
      const t = (elapsed * 0.085 + phase) % 1;
      tracer.position.copy(curve.getPoint(t));
    });
    render();
    raf = requestAnimationFrame(frame);
  };
  function start() { if (!raf && visible && !document.hidden && !destroyed) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) start(); else stop();
  }, { threshold: 0.01 });
  const resizeObserver = new ResizeObserver(resize);
  observer.observe(host); resizeObserver.observe(host);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', () => { pointerDown = null; });
  const buttonHandlers = new Map(buttons.map(button => [button, () => applySelection(button.dataset.systemSelect === selectedId ? null : button.dataset.systemSelect)]));
  buttonHandlers.forEach((handler, button) => button.addEventListener('click', handler));
  const resetButton = host.querySelector('[data-system-reset]');
  const onReset = () => { applySelection(null); controls.reset(); controls.autoRotate = !reducedMotion; controls.update(); render(); };
  resetButton?.addEventListener('click', onReset);
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('end', () => { if (!reducedMotion && !selectedId) controls.autoRotate = true; });
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisibility);
  addEventListener('pagehide', destroy, { once: true });
  if (fallback) fallback.hidden = true;
  host.dataset.sceneState = reducedMotion ? 'static' : 'ready';
  applySelection(null);
  resize(); start();

  function destroy() {
    if (destroyed) return;
    destroyed = true; stop(); observer.disconnect(); resizeObserver.disconnect(); controls.dispose();
    canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerdown', onPointerDown); canvas.removeEventListener('pointerup', onPointerUp);
    buttonHandlers.forEach((handler, button) => button.removeEventListener('click', handler));
    resetButton?.removeEventListener('click', onReset);
    document.removeEventListener('keydown', onKeyDown); document.removeEventListener('visibilitychange', onVisibility);
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
  }
  return { destroy, select: applySelection, reset: () => { controls.reset(); applySelection(null); } };
}
