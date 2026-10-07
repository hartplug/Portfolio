import * as THREE from 'three';

const CHAMPAGNE = 0xd0bd91;
const WARM_WHITE = 0xe8dfcd;

function circleGeometry(radius, segments = 256) {
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function mountHomeCommandScene(host, { reducedMotion = false } = {}) {
  const canvas = host.querySelector('[data-command-canvas]');
  const fallback = host.querySelector('[data-command-fallback]');
  const overlays = host.querySelector('[data-command-overlays]');
  if (!host || !canvas) return { destroy() {} };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth >= 700, powerPreference: 'low-power' });
  } catch (error) {
    host.dataset.sceneState = 'fallback';
    if (fallback) fallback.hidden = false;
    canvas.hidden = true;
    if (overlays) overlays.hidden = true;
    console.warn('Home orbital renderer unavailable:', error);
    return { destroy() {}, inspect: () => ({ fallback: true }) };
  }

  renderer.setClearColor(0x070808, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.01, 50);
  camera.position.set(0, 0.48, 5.25);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xb7a98a, 0x080b11, 0.34));
  const keyLight = new THREE.DirectionalLight(0xf0d9aa, 1.0);
  keyLight.position.set(-3.5, 4.5, 5.5);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0xc7a66d, 0.34, 7.5, 2);
  fillLight.position.set(-1.8, 0.8, 3.1);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0x8d7c58, 0.6);
  rimLight.position.set(4.5, -1.5, -4);
  scene.add(rimLight);

  const orbitalSystem = new THREE.Group();
  orbitalSystem.rotation.set(0, 0, 0);
  scene.add(orbitalSystem);
  const globeRoot = new THREE.Group();
  const globeCore = new THREE.Group();
  globeCore.rotation.set(-0.24, 0.18, -0.08);
  globeRoot.add(globeCore);
  orbitalSystem.add(globeRoot);
  const resources = { geometries: new Set(), materials: new Set() };
  const keep = (geometry, material) => {
    resources.geometries.add(geometry);
    resources.materials.add(material);
    return new THREE.Mesh(geometry, material);
  };

  const globeRadius = 2.35;
  const outerWire = keep(
    new THREE.SphereGeometry(globeRadius, 88, 56),
    new THREE.MeshBasicMaterial({ color: CHAMPAGNE, wireframe: true, transparent: true, opacity: 0.44, depthWrite: false }),
  );
  globeCore.add(outerWire);

  const innerWire = keep(
    new THREE.SphereGeometry(globeRadius * 0.992, 36, 26),
    new THREE.MeshBasicMaterial({ color: 0xb19d79, wireframe: true, transparent: true, opacity: 0.17, depthWrite: false }),
  );
  innerWire.rotation.set(0.13, 0.19, -0.1);
  globeCore.add(innerWire);

  const structuralShell = keep(
    new THREE.SphereGeometry(globeRadius * 0.976, 24, 18),
    new THREE.MeshBasicMaterial({ color: 0x604f35, wireframe: true, transparent: true, opacity: 0.14, depthWrite: false }),
  );
  structuralShell.rotation.set(-0.22, 0.4, 0.16);
  globeCore.add(structuralShell);

  const rings = [];
  const ringDefinitions = [
    { radius: globeRadius * 1.16, rotation: [1.26, 0.12, 0.08], mobileRotation: [0.88, 0.12, 0.08], color: CHAMPAGNE, opacity: 0.5, speed: 0.0016, seed: 2 },
    { radius: globeRadius * 1.19, rotation: [-1.14, 0.44, -0.28], mobileRotation: [-0.82, 0.44, -0.28], color: 0xb59d70, opacity: 0.34, speed: -0.0011, seed: 5 },
    { radius: globeRadius * 1.22, rotation: [0.22, -0.92, 0.48], mobileRotation: [0.18, -0.66, 0.48], color: 0x9d825d, opacity: 0.28, speed: 0.0008, seed: 8 },
  ];
  for (const definition of ringDefinitions) {
    const geometry = circleGeometry(definition.radius);
    geometry.computeBoundingSphere();
    const material = new THREE.LineBasicMaterial({ color: definition.color, transparent: true, opacity: definition.opacity, depthWrite: false, toneMapped: false });
    resources.geometries.add(geometry);
    resources.materials.add(material);
    const ring = new THREE.LineLoop(geometry, material);
    ring.rotation.set(...definition.rotation);
    orbitalSystem.add(ring);
    rings.push({ object: ring, speed: definition.speed, seed: definition.seed, material, baseOpacity: definition.opacity, desktopRotation: definition.rotation, mobileRotation: definition.mobileRotation });
  }

  const core = new THREE.Group();
  globeCore.add(core);
  const coreRingMaterial = new THREE.MeshBasicMaterial({ color: CHAMPAGNE, transparent: true, opacity: 0.7, toneMapped: false });
  const coreRing = keep(new THREE.TorusGeometry(0.24, 0.007, 4, 96), coreRingMaterial);
  coreRing.rotation.x = Math.PI / 2;
  core.add(coreRing);
  const coreSurface = keep(
    new THREE.SphereGeometry(0.16, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0x17140f, roughness: 0.72, metalness: 0.18, emissive: 0x241c10, emissiveIntensity: 0.42 }),
  );
  coreSurface.scale.set(1, 0.55, 1);
  coreSurface.position.y = -0.035;
  core.add(coreSurface);
  const coreLabel = keep(
    new THREE.PlaneGeometry(0.2, 0.08),
    new THREE.MeshBasicMaterial({ color: WARM_WHITE, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide }),
  );
  coreLabel.position.set(0, 0.025, 0);
  core.add(coreLabel);
  const corePin = keep(
    new THREE.SphereGeometry(0.04, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0xf2d99f, toneMapped: false }),
  );
  corePin.position.y = 0.03;
  core.add(corePin);

  const networkPositions = new Float32Array(260 * 3);
  let networkSeed = 8731;
  const random = () => { networkSeed = (networkSeed * 1664525 + 1013904223) >>> 0; return networkSeed / 4294967296; };
  for (let i = 0; i < 260; i += 1) {
    const y = 1 - (i / 259) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = i * (Math.PI * (3 - Math.sqrt(5)));
    const depth = 1.652 + (random() - 0.5) * 0.002;
    networkPositions[i * 3] = Math.cos(angle) * radius * depth;
    networkPositions[i * 3 + 1] = y * depth;
    networkPositions[i * 3 + 2] = Math.sin(angle) * radius * depth;
  }
  const networkGeometry = new THREE.BufferGeometry();
  networkGeometry.setAttribute('position', new THREE.BufferAttribute(networkPositions, 3));
  const networkMaterial = new THREE.PointsMaterial({ color: 0xc5ad7c, size: 0.014, transparent: true, opacity: 0.18, depthWrite: false, sizeAttenuation: true });
  resources.geometries.add(networkGeometry);
  resources.materials.add(networkMaterial);
  const network = new THREE.Points(networkGeometry, networkMaterial);
  globeCore.add(network);

  const atmosphereMaterial = new THREE.MeshBasicMaterial({ color: 0x97845c, transparent: true, opacity: 0.022, side: THREE.BackSide, depthWrite: false });
  globeCore.add(keep(new THREE.SphereGeometry(globeRadius * 1.03, 40, 28), atmosphereMaterial));

  const designRadius = Math.max(globeRadius * 1.22, ...rings.map((ring) => ring.object.geometry.boundingSphere?.radius ?? 0));
  const compositionRadius = designRadius * 1.04;

  const shellMaterial = resources.materials.values().find((material) => material.color?.getHex() === CHAMPAGNE && material.wireframe);
  const rimWireMaterial = resources.materials.values().find((material) => material.color?.getHex() === 0xb19d79 && material.wireframe);
  const pulseMaterials = [shellMaterial, rimWireMaterial, coreRingMaterial, networkMaterial].filter(Boolean);
  const pulseBase = pulseMaterials.map((material) => material.opacity);

  let raf = 0;
  let visible = false;
  let destroyed = false;
  let fallbackActive = false;
  let previousTime = null;
  let staticMode = reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const resizeObserver = new ResizeObserver(resize);
  let intersectionObserver;

  function resize() {
    if (destroyed || fallbackActive) return;
    const rect = host.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const narrow = rect.width < 620;
    const compositionScale = 1;
    orbitalSystem.scale.setScalar(compositionScale);
    if (narrow) {
      rings.forEach(({ object, mobileRotation }) => {
        object.rotation.set(...mobileRotation);
        object.userData.baseRotation = mobileRotation.slice();
      });
    }
    const targetCoverage = 0.98;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.25 : 1.5));
    renderer.setSize(rect.width, rect.height, false);
    if (narrow) {
      camera.position.set(0, 0.42, 11.2);
      camera.fov = 42;
      camera.near = 0.01;
      camera.far = 40;
      camera.aspect = rect.width / rect.height;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      return;
    }
    camera.aspect = rect.width / rect.height;
    const verticalHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(46) / 2));
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * camera.aspect);
    const limitingHalf = Math.min(verticalHalf, horizontalHalf);
    const distance = compositionRadius / Math.sin(limitingHalf) / targetCoverage;
    camera.fov = THREE.MathUtils.radToDeg(verticalHalf) * 2;
    camera.position.set(0, distance * 0.085, distance);
    camera.lookAt(0, 0, 0);
    camera.near = 0.01;
    camera.far = distance + compositionRadius * 1.4;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previousTime = null;
  }

  function frame(time) {
    raf = 0;
    if (destroyed || fallbackActive || !visible || document.hidden) return;
    if (!staticMode) {
      const dt = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      globeCore.rotation.y += dt * 0.008;
      globeCore.rotation.x = -0.24 + Math.sin(time * 0.000018) * 0.014;
      globeCore.rotation.z = -0.08 + Math.sin(time * 0.000013) * 0.01;
      orbitalSystem.rotation.y += dt * 0.0012;
      orbitalSystem.rotation.x = Math.sin(time * 0.000014) * 0.008;
      orbitalSystem.rotation.z = Math.sin(time * 0.000011) * 0.006;
      rings.forEach(({ object, speed, seed, material, baseOpacity }) => {
        const phase = time * 0.000017 + seed;
        const base = object.userData.baseRotation || object.rotation.toArray().slice(0, 3);
        object.rotation.set(
          base[0] + Math.sin(phase) * 0.003,
          base[1] + Math.sin(phase * 0.83) * 0.003,
          base[2] + Math.sin(phase * 0.67) * 0.003,
        );
        object.rotateZ(dt * speed);
        object.rotateY(dt * speed * 0.31);
        object.rotateX(dt * speed * (seed % 2 ? 0.19 : -0.23));
        const depthBias = Math.max(0.82, 0.92 + Math.sin(phase) * 0.12);
        material.opacity = baseOpacity * depthBias;
      });
      const pulse = Math.pow((Math.sin(time * 0.00005) + 1) * 0.5, 16);
      pulseMaterials.forEach((material, index) => {
        material.opacity = pulseBase[index] * (1 + pulse * (index === 2 ? 0.35 : index === 3 ? 0.3 : 0.16));
      });
    }
    renderer.render(scene, camera);
    host.dataset.frames = String(Number(host.dataset.frames || 0) + 1);
    if (!staticMode) raf = requestAnimationFrame(frame);
  }

  function draw() {
    if (!destroyed && !fallbackActive && visible && !document.hidden && !raf) raf = requestAnimationFrame(frame);
  }

  function onContextLost(event) {
    event.preventDefault();
    fallbackActive = true;
    stop();
    host.dataset.sceneState = 'fallback';
    if (fallback) fallback.hidden = false;
    canvas.hidden = true;
    if (overlays) overlays.hidden = true;
  }

  function onMotionChange() {
    staticMode = reducedMotion || motionQuery.matches;
    stop();
    if (visible && !document.hidden) {
      if (staticMode) renderer.render(scene, camera);
      else draw();
    }
  }

  function onVisibilityChange() {
    visible = !document.hidden && host.getBoundingClientRect().bottom > 0 && host.getBoundingClientRect().top < innerHeight;
    if (visible) draw();
    else stop();
  }

  canvas.addEventListener('webglcontextlost', onContextLost, false);
  motionQuery.addEventListener?.('change', onMotionChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
  resizeObserver.observe(host);
  intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      resize();
      if (staticMode) renderer.render(scene, camera);
      else draw();
    } else stop();
  }, { threshold: 0.01 });
  intersectionObserver.observe(host);
  resize();
  host.dataset.sceneState = staticMode ? 'static' : 'ready';
  host.__orbitInspect = () => ({ scene, camera, renderer, globeRoot, globeCore, orbitalSystem, core, rings, staticMode, outerWire, innerWire, structuralShell, materials: resources.materials });
  host.dataset.frames = '0';

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    canvas.removeEventListener('webglcontextlost', onContextLost);
    motionQuery.removeEventListener?.('change', onMotionChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    resources.geometries.forEach((geometry) => geometry.dispose());
    resources.materials.forEach((material) => material.dispose());
    renderer.dispose();
    delete host.__orbitInspect;
  }

  addEventListener('pagehide', destroy, { once: true });
  host.__orbitInspect = () => ({ scene, camera, renderer, globeRoot, globeCore, orbitalSystem, core, rings, staticMode });
  return { destroy, inspect: () => ({ scene, camera, renderer, globeRoot, globeCore, orbitalSystem, core, rings, staticMode }) };
}