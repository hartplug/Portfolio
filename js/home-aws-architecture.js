import * as THREE from 'three';

const NODES = [
  { id: 'vpc', label: 'VPC', detail: 'Illustrative network boundary for AWS resources.', color: 0xcab47f, position: [0, 0.08, -0.35] },
  { id: 'ec2', label: 'EC2', detail: 'Application compute for the deployed system.', color: 0xd2bc8b, position: [-0.66, 0.34, 0.2] },
  { id: 'rds', label: 'RDS', detail: 'Managed relational database service.', color: 0x94c6c8, position: [0.58, -0.18, 0.18] },
  { id: 's3', label: 'S3', detail: 'Object storage for static files and documents.', color: 0xc98e68, position: [1.84, 0.28, -0.1] },
  { id: 'iam', label: 'IAM', detail: 'Identity and access policies for AWS resources.', color: 0x94c6c8, position: [-1.8, 0.76, -0.14] },
  { id: 'backups', label: 'BACKUPS', detail: 'Basic backup coverage in an AWS environment.', color: 0xc98e68, position: [0.56, -0.93, -0.12] },
  { id: 'cloudwatch', label: 'CLOUDWATCH', detail: 'Monitoring and operational visibility.', color: 0x94c6c8, position: [-1.84, -0.55, -0.15] },
];
const NODE_BY_ID = Object.fromEntries(NODES.map(node => [node.id, node]));

function makeNodeMesh(id) {
  const group = new THREE.Group();
  group.userData.nodeId = id;
  const body = new THREE.MeshStandardMaterial({ color: 0x191a19, metalness: 0.35, roughness: 0.43 });
  const accent = new THREE.MeshStandardMaterial({ color: NODE_BY_ID[id].color, emissive: NODE_BY_ID[id].color, emissiveIntensity: 0.13, metalness: 0.35, roughness: 0.36 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24231f, metalness: 0.25, roughness: 0.5 });
  const addBox = (size, x, y, z, mat = body) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat); m.position.set(x, y, z); group.add(m); return m; };
  const addCylinder = (rt, rb, h, x, y, z, mat = accent, seg = 24) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); m.position.set(x, y, z); group.add(m); return m; };
  if (id === 'ec2') {
    [-0.16, 0.02, 0.20].forEach(y => {
      addBox([0.38, 0.13, 0.26], 0, y, 0);
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), accent); light.position.set(-0.12, y, 0.145); group.add(light);
      addBox([0.045, 0.018, 0.012], 0.04, y, 0.14, dark);
      addBox([0.045, 0.018, 0.012], 0.105, y, 0.14, dark);
    });
  } else if (id === 'rds') {
    addCylinder(0.16, 0.16, 0.42, 0, 0, 0, body, 32);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.16, 32), accent); top.rotation.x = -Math.PI / 2; top.position.y = 0.212; group.add(top);
    [-0.08, 0, 0.08].forEach(y => addBox([0.17, 0.014, 0.018], 0, y, 0.15, dark));
  } else if (id === 's3') {
    addCylinder(0.18, 0.18, 0.32, 0, -0.02, 0, body, 32);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 32), accent); rim.rotation.x = Math.PI / 2; rim.position.y = 0.15; group.add(rim);
    [-0.08, 0, 0.08].forEach(y => addBox([0.18, 0.012, 0.018], 0, y, 0.17, dark));
  } else if (id === 'iam') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.028, 10, 24), accent); ring.position.set(-0.08, 0.02, 0); group.add(ring);
    addBox([0.27, 0.045, 0.045], 0.12, 0.02, 0, accent); addBox([0.04, 0.085, 0.045], 0.21, -0.04, 0, accent);
  } else if (id === 'backups') {
    [-0.11, 0, 0.11].forEach((x, i) => { const box = addBox([0.1, 0.14, 0.11], x, i === 1 ? 0.04 : -0.01, 0, i === 1 ? accent : body); box.rotation.z = (i - 1) * 0.08; });
    addBox([0.32, 0.02, 0.09], 0, -0.1, 0, dark);
  } else if (id === 'cloudwatch') {
    [-0.11, 0, 0.11].forEach((x, i) => { const bar = addBox([0.055, [0.12, 0.23, 0.17][i], 0.04], x, [-0.02, 0.035, 0.005][i], 0, i === 1 ? accent : body); });
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 32, Math.PI), accent); arc.position.y = 0.14; group.add(arc);
  } else if (id === 'vpc') {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.28, 1.25, 0.9));
    const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xcab47f, transparent: true, opacity: 0.45 })); group.add(frame);
    const base = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 0.9), new THREE.MeshBasicMaterial({ color: 0xcab47f, transparent: true, opacity: 0.035, side: THREE.DoubleSide })); base.rotation.x = -Math.PI / 2; base.position.y = -0.625; group.add(base);
  }
  group.userData = { id, nodeId: id };
  return group;
}

function curvePoints(start, end, lift = 0.18) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += lift;
  return new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(48);
}

export function mountAwsArchitecture(host, { reducedMotion = false } = {}) {
  const canvas = host.querySelector('[data-aws-scene]');
  const fallback = host.querySelector('[data-aws-fallback]');
  const detailTitle = host.querySelector('[data-aws-detail-title]');
  const detailCopy = host.querySelector('[data-aws-detail-copy]');
  if (!canvas) return { destroy() {} };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth > 700, powerPreference: 'low-power' });
  } catch {
    host.dataset.sceneState = 'fallback'; fallback?.removeAttribute('hidden'); canvas.hidden = true;
    return { destroy() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 620 ? 1.15 : 1.45));
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80); camera.position.set(0, 4.4, 15.2); camera.lookAt(0, 0, 0);
  const fitCamera = () => {
    const width = host.clientWidth || 1, height = host.clientHeight || 1, aspect = width / height;
    camera.aspect = aspect;
    camera.position.set(0, aspect < 1 ? 3.5 : 4.1, aspect < 1 ? 13.2 : 13.8);
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  };

  const root = new THREE.Group(); scene.add(root);
  scene.add(new THREE.HemisphereLight(0xb5c8c7, 0x151313, 1.3));
  const keyLight = new THREE.PointLight(0xd3bd8a, 9, 12); keyLight.position.set(-3, 4, 4); scene.add(keyLight);
  const fillLight = new THREE.PointLight(0x729ca6, 6, 10); fillLight.position.set(3, -2, 2); scene.add(fillLight);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshBasicMaterial({ color: 0xc9b47d, transparent: true, opacity: 0.035, side: THREE.DoubleSide })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.24; root.add(floor);

  const nodeGroups = new Map();
  NODES.forEach(node => {
    const object = makeNodeMesh(node.id); object.position.set(...node.position); root.add(object); nodeGroups.set(node.id, object);
  });

  const routeSpecs = [
    ['ec2', 'rds', 0.12], ['ec2', 's3', 0.28], ['rds', 'backups', -0.12], ['ec2', 'cloudwatch', 0.18], ['iam', 'ec2', 0.12], ['vpc', 's3', 0.12],
  ];
  const routes = [], pulseMeshes = [];
  const nodeCenter = node => { const v = nodeGroups.get(node).position.clone(); if (node === 'vpc') v.y += 0.1; return v; };
  for (const [from, to, lift] of routeSpecs) {
    const a = nodeCenter(from), b = nodeCenter(to);
    if (from === 'vpc') a.x += 0.72;
    if (to === 'vpc') b.x -= 0.7;
    const pts = curvePoints(a.toArray(), b.toArray(), lift);
    const curve = new THREE.QuadraticBezierCurve3(pts[0], pts[Math.floor(pts.length / 2)], pts[pts.length - 1]);
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineBasicMaterial({ color: 0xc6b17c, transparent: true, opacity: 0.24 });
    root.add(new THREE.Line(geometry, material)); routes.push({ geometry, material, curve });
    for (let i = 0; i < 2; i++) {
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), new THREE.MeshBasicMaterial({ color: i ? 0x9bcbd0 : 0xd7bd86, transparent: true, opacity: 0.9 }));
      root.add(pulse); pulseMeshes.push({ mesh: pulse, curve, offset: (i * 0.48 + Math.random() * 0.12) % 1, speed: i ? 0.1 : 0.075 });
    }
  }

  let raf = 0, visible = false, destroyed = false, selected = null, elapsed = 0, touching = false, downX = 0, downY = 0;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const resize = () => { const rect = host.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); fitCamera(); render(); };
  const render = () => { if (!destroyed) renderer.render(scene, camera); };
  const nodeButtons = [...host.querySelectorAll('.aws-node-list [data-aws-node]')];
  const introOverlay = document.querySelector('.grid-intro');
  const selectNode = id => {
    const node = NODE_BY_ID[id]; if (!node) return;
    selected = id;
    nodeButtons.forEach(option => {
      const active = option.dataset.awsNode === id;
      option.classList.toggle('active', active);
      option.setAttribute('aria-pressed', String(active));
    });
    nodeGroups.forEach((group, nodeId) => group.traverse(object => { if (object.material?.emissive) object.material.emissiveIntensity = nodeId === id ? 0.45 : 0.13; }));
    render();
  };
  const selectButtonNode = event => {
    const nodeId = event?.currentTarget?.dataset?.awsNode;
    const node = NODE_BY_ID[nodeId];
    if (!node) return;
    selected = nodeId;
    nodeButtons.forEach(option => {
      const active = option.dataset.awsNode === nodeId;
      option.classList.toggle('active', active);
      option.setAttribute('aria-pressed', String(active));
    });
    nodeGroups.forEach((group, id) => group.traverse(object => { if (object.material?.emissive) object.material.emissiveIntensity = id === nodeId ? 0.45 : 0.13; }));
    render();
  };
  nodeButtons.forEach(button => button.addEventListener('click', selectButtonNode));



  if (introOverlay) {
    host.querySelectorAll('.aws-node-list [data-aws-node]').forEach(button => {
      button.addEventListener('click', () => introOverlay.querySelector('.intro-skip, .button')?.click(), { once: true });
    });
  }
  selectNode('ec2');


  const onPick = event => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const meshes = [...nodeGroups.values()].flatMap(group => group.children);
    const hit = raycaster.intersectObjects(meshes, true)[0];
    if (!hit) return;
    let object = hit.object;
    while (object && !object.userData.nodeId) object = object.parent;
    if (object?.userData.nodeId && object.userData.nodeId !== 'vpc') selectNode(object.userData.nodeId);
  };
  canvas.addEventListener('click', onPick);
  const onKey = event => {
    const current = NODES.findIndex(node => node.id === selected);
    if (event.key === 'ArrowRight') { selectNode(NODES[(current + 1 + NODES.length) % NODES.length].id); event.preventDefault(); }
    else if (event.key === 'ArrowLeft') { selectNode(NODES[(current - 1 + NODES.length) % NODES.length].id); event.preventDefault(); }
  };
  canvas.addEventListener('keydown', onKey);
  const touchStart=e=>{if(e.touches.length!==1)return;touching=true;downX=e.touches[0].clientX;downY=e.touches[0].clientY;};
  const touchEnd=e=>{if(!touching)return;touching=false;const p=e.changedTouches[0],dx=p.clientX-downX,dy=p.clientY-downY;if(Math.abs(dx)+Math.abs(dy)>18){root.rotation.y+=dx*.005;root.rotation.x=THREE.MathUtils.clamp(root.rotation.x+dy*.004,-.55,.55);render();}};
  host.addEventListener('touchstart',touchStart,{passive:true});host.addEventListener('touchend',touchEnd,{passive:true});

  const frame = now => {
    raf = 0; if (destroyed || !visible || document.hidden || reducedMotion) return;
    elapsed = now * 0.001;
    root.rotation.y = Math.sin(elapsed * 0.16) * 0.055;
    root.rotation.x = Math.sin(elapsed * 0.11) * 0.016;
    keyLight.position.x = -3 + Math.sin(elapsed * 0.18) * 0.35;
    routes.forEach((route, i) => { route.material.opacity = 0.17 + 0.1 * (0.5 + 0.5 * Math.sin(elapsed * 1.0 + i * 1.1)); });
    pulseMeshes.forEach(pulse => { const t = (elapsed * pulse.speed + pulse.offset) % 1; pulse.mesh.position.copy(pulse.curve.getPoint(t)); pulse.mesh.scale.setScalar(0.82 + 0.35 * Math.sin(t * Math.PI)); });
    render(); raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!raf && visible && !document.hidden && !destroyed && !reducedMotion) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const observer = new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); if (visible) { render(); start(); } else stop(); }, { threshold: 0.02 });
  const resizeObserver = new ResizeObserver(resize); observer.observe(host); resizeObserver.observe(host); resize();
  const visibility = () => document.hidden ? stop() : start(); document.addEventListener('visibilitychange', visibility);
  host.dataset.sceneState = reducedMotion ? 'static' : 'ready';
  selectNode('ec2');
  if (reducedMotion) render(); else start();
  const destroy = () => {
    if (destroyed) return; destroyed = true; stop(); observer.disconnect(); resizeObserver.disconnect(); document.removeEventListener('visibilitychange', visibility);
    canvas.removeEventListener('click', onPick); canvas.removeEventListener('keydown', onKey); nodeButtons.forEach(button => button.removeEventListener('click', selectButtonNode)); host.removeEventListener('touchstart',touchStart);host.removeEventListener('touchend',touchEnd);
    nodeGroups.forEach(group => group.traverse(object => { object.geometry?.dispose?.(); if (Array.isArray(object.material)) object.material.forEach(m => m.dispose()); else object.material?.dispose?.(); }));
    routes.forEach(route => { route.geometry.dispose(); route.material.dispose(); }); pulseMeshes.forEach(pulse => { pulse.mesh.geometry.dispose(); pulse.mesh.material.dispose(); });
    floor.geometry.dispose(); floor.material.dispose(); renderer.dispose();
  };
  addEventListener('pagehide', destroy, { once: true });
  return { destroy, selectNode };
}
