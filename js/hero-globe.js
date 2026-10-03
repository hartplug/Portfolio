import * as THREE from 'three';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const ROUTES = [
  { from: 0.12, to: 0.34, color: 0xe30613, lift: 0.13 },
  { from: 0.28, to: 0.57, color: 0x008ea8, lift: 0.16 },
  { from: 0.63, to: 0.82, color: 0xe30613, lift: 0.12 },
  { from: 0.45, to: 0.91, color: 0x008ea8, lift: 0.10 },
  { from: 0.08, to: 0.68, color: 0xe30613, lift: 0.08 },
];

function pointOnSphere(index, count, radius) {
  const y = 1 - (index / (count - 1)) * 2;
  const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = GOLDEN_ANGLE * index;
  return new THREE.Vector3(Math.cos(theta) * ringRadius * radius, y * radius, Math.sin(theta) * ringRadius * radius);
}

function makeRoute(start, end, lift, radius) {
  const a = pointOnSphere(start, 32, radius);
  const b = pointOnSphere(end, 32, radius);
  const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(radius * (1 + lift));
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  return curve.getPoints(36);
}

export function mountHeroGlobe(host, { reducedMotion = false } = {}) {
  const canvas = host.querySelector('canvas');
  if (!canvas) return { destroy() {} };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: innerWidth >= 760,
      powerPreference: 'low-power',
    });
  } catch (error) {
    host.classList.add('globe-fallback');
    host.dataset.globeState = 'fallback';
    console.warn('WebGL unavailable for hero globe:', error.message);
    return { destroy() {} };
  }

  const dprCap = innerWidth < 760 ? 1.5 : 1.75;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
  camera.position.set(0, 0, 6.2);
  const globe = new THREE.Group();
  scene.add(globe);

  const sphereGeometry = new THREE.SphereGeometry(1.32, 40, 30);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x008ea8,
    wireframe: true,
    transparent: true,
    opacity: 0.42,
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  globe.add(sphere);

  const innerGeometry = new THREE.SphereGeometry(1.27, 20, 16);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.16,
    side: THREE.BackSide,
  });
  globe.add(new THREE.Mesh(innerGeometry, innerMaterial));

  const routeMaterials = [];
  const routeGeometries = [];
  for (const route of ROUTES) {
    const geometry = new THREE.BufferGeometry().setFromPoints(makeRoute(route.from, route.to, route.lift, 1.34));
    const material = new THREE.LineBasicMaterial({
      color: route.color,
      transparent: true,
      opacity: 0.78,
    });
    globe.add(new THREE.Line(geometry, material));
    routeGeometries.push(geometry);
    routeMaterials.push(material);
  }

  const nodeIndices = [2, 5, 9, 14, 18, 23, 27, 30];
  const nodeGeometry = new THREE.BufferGeometry();
  const nodePositions = new Float32Array(nodeIndices.length * 3);
  nodeIndices.forEach((index, i) => {
    const point = pointOnSphere(index, 32, 1.36);
    nodePositions.set(point.toArray(), i * 3);
  });
  nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
  const nodeMaterial = new THREE.PointsMaterial({
    color: 0xe30613,
    size: 0.055,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
  });
  globe.add(new THREE.Points(nodeGeometry, nodeMaterial));

  let width = 0;
  let height = 0;
  let raf = 0;
  let isVisible = false;
  let destroyed = false;
  let contextLost = false;
  let startTime = null;

  const resize = () => {
    if (destroyed) return;
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    drawStatic();
  };

  const drawStatic = () => {
    if (destroyed || contextLost || width < 1 || height < 1) return;
    renderer.render(scene, camera);
    host.classList.add('globe-ready');
    host.classList.remove('globe-fallback');
    host.dataset.globeState = reducedMotion ? 'static' : 'ready';
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    startTime = null;
  };

  const animate = now => {
    raf = 0;
    if (destroyed || contextLost || !isVisible || document.hidden || reducedMotion) return;
    if (startTime === null) startTime = now;
    const seconds = (now - startTime) / 1000;
    globe.rotation.y = seconds * 0.095;
    globe.rotation.x = Math.sin(seconds * 0.11) * 0.035;
    routeMaterials.forEach((material, i) => {
      material.opacity = 0.60 + 0.17 * (0.5 + 0.5 * Math.sin(seconds * 1.15 + i * 1.3));
    });
    drawStatic();
    raf = requestAnimationFrame(animate);
  };

  const start = () => {
    if (destroyed || contextLost || reducedMotion || !isVisible || document.hidden || raf) return;
    raf = requestAnimationFrame(animate);
  };
  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };
  const onContextLost = event => {
    event.preventDefault();
    contextLost = true;
    stop();
    host.classList.remove('globe-ready');
    host.classList.add('globe-fallback');
    host.dataset.globeState = 'fallback';
  };
  const onContextRestored = () => {
    contextLost = false;
    resize();
    start();
  };
  const observer = new IntersectionObserver(entries => {
    isVisible = Boolean(entries[0]?.isIntersecting);
    if (isVisible) {
      drawStatic();
      start();
    } else {
      stop();
    }
  }, { threshold: 0.01 });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  observer.observe(host);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost, false);
  canvas.addEventListener('webglcontextrestored', onContextRestored, false);
  resize();

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    stop();
    observer.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost, false);
    canvas.removeEventListener('webglcontextrestored', onContextRestored, false);
    sphereGeometry.dispose();
    sphereMaterial.dispose();
    innerGeometry.dispose();
    innerMaterial.dispose();
    routeGeometries.forEach(geometry => geometry.dispose());
    routeMaterials.forEach(material => material.dispose());
    nodeGeometry.dispose();
    nodeMaterial.dispose();
    renderer.dispose();
  };
  addEventListener('pagehide', destroy, { once: true });

  if (reducedMotion) drawStatic();
  else start();
  return { destroy };
}
