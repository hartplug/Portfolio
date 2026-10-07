import * as THREE from '../vendor/three.module.js';

/* SERVERLESS ARCHITECTURE STUDY — isolated Lab experience.
   Lifecycle is driven by a fixed-step simulation clock, never by render-frame cadence. */

const COPY = {
  user: ['USER / REQUEST', '01 · ENTRY', 'A visitor or application starts the HTTP request.', 'Sends the request into the API entry point.'],
  api: ['API GATEWAY', '02 · INGRESS', 'Routes a validated HTTP request to the function.', 'Validates and forwards the invocation to Lambda.'],
  lambda: ['LAMBDA', '03 · COMPUTE', 'Runs the application logic without a continuously running server.', 'Executes the function, then chooses a service action.'],
  dynamodb: ['DYNAMODB', '04 · DATA', 'Stores application data in a serverless key-value/document model.', 'A read or write returns data to the function.'],
  s3: ['S3', '05 · OBJECTS', 'Stores objects such as files, assets and application data.', 'An object operation returns its result to the function.'],
  sns: ['SNS', '06 · EVENTS', 'Publishes messages so other systems can react to events.', 'A publish action distributes an event to subscribers.'],
  cloudwatch: ['CLOUDWATCH', '07 · OBSERVABILITY', 'Collects logs, metrics and operational telemetry.', 'Records what the request did before it completes.'],
  response: ['RESPONSE', '08 · RETURN', 'The result travels back to the request origin.', 'Returns the finished response to the user.'],
  iam: ['IAM / SECURITY', '09 · ACCESS BOUNDARY', 'Controls who may invoke functions and what each role can access.', 'The access boundary protects the gateway and limits service permissions.'],
  workflow: ['AUTOMATION WORKFLOW', 'PROCESS · BUSINESS LOGIC', 'The business process Lambda is automating across these services.', 'Connects the request to the work the architecture exists to perform.'],
};
const STAGES = ['RECEIVED', 'INVOKED', 'PROCESSING', 'TELEMETRY', 'OBSERVED', 'COMPLETE'];
const STAGE_DETAIL = [
  'Request packet entering the API Gateway.',
  'Gateway has routed the invocation to Lambda.',
  'Lambda is executing application logic.',
  'Service action and telemetry are in flight.',
  'CloudWatch has observed the request path.',
  'Response is returning to the request origin.',
];
/* Fixed simulated durations in seconds — the same on every viewport. */
const STAGE_SECONDS = [1.5, 1.5, 1.8, 2.0, 1.5, 1.7];
const FIXED_STEP = 1 / 60;
const SERVICES = ['dynamodb', 's3', 'sns'];
/* The request path carries the teaching labels; branch services are named in the service strip and inspector. */
const PATH_LABELS = ['user', 'api', 'lambda', 'cloudwatch', 'response'];

/* Left-to-right request spine; services branch back in depth, CloudWatch sits above as observability. */
const LAYOUT = {
  // Foreground: request origin and ingress. Midground: compute and service field.
  // Background: observability and response return sit behind the system.
  user: [-4.15, 0.0, 3.35],
  api: [-2.45, 0.85, 2.05],
  lambda: [0.0, 0.18, 0.25],
  dynamodb: [2.25, 1.35, -0.45],
  s3: [3.15, 0.0, 0.15],
  sns: [2.15, -1.25, 0.85],
  cloudwatch: [0.6, 2.7, -3.25],
  response: [4.35, 0.4, -2.85],
  iam: [-3.25, 0.42, 0.55],
  workflow: [-0.7, 0.34, -1.25],
};
const LABEL_GLYPH_RATIO = 30 / 78; /* title glyph height in the two-line label */
const C = { gold: 0xd3bd8a, goldSoft: 0xc0a97c, blue: 0x9dbcc2, mint: 0xa8bcab, bone: 0xece6d8, quiet: 0x4a4a45 };

export function mountServerlessObservatory(root = document) {
  const stage = root.querySelector('[data-serverless-stage]');
  const canvas = root.querySelector('[data-serverless-canvas]');
  if (!stage || !canvas) return { destroy() {} };

  const el = {
    fallback: root.querySelector('[data-serverless-fallback]'),
    stageLabel: root.querySelector('[data-lifecycle-stage]'),
    detail: root.querySelector('[data-lifecycle-detail]'),
    status: root.querySelector('[data-observatory-status]'),
    name: root.querySelector('[data-inspect-name]'),
    role: root.querySelector('[data-inspect-role]'),
    copy: root.querySelector('[data-inspect-copy]'),
    life: root.querySelector('[data-inspect-life]'),
    reset: root.querySelector('[data-reset-view]'),
    buttons: [...root.querySelectorAll('[data-select-service]')],
    steps: [...root.querySelectorAll('[data-life-step]')],
  };

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const geometries = [];
  const materials = [];
  const nodes = {};
  const pickables = [];
  const paths = [];

  let renderer = null;
  let scene = null;
  let camera = null;
  let raycaster = null;
  let pointer = null;
  let rafId = 0;
  let disposed = false;
  let contextLost = false;

  /* ---- simulation state (frame-rate independent) ---- */
  let simSeconds = 0;
  let stageIndex = 0;
  let stageElapsed = 0;
  let serviceCursor = 0;
  let runs = 0;
  let ambient = 0;
  let accumulator = 0;

  let selected = 'lambda';
  let hovered = '';
  let drag = null;
  const view = { theta: 0.16, phi: 0.7, zoom: 1 };
  const HOME = { theta: 0.16, phi: 0.7, zoom: 1 };
  let cameraRadius = 1;
  let cameraAim = new THREE.Vector3();
  const cameraQuaternion = new THREE.Quaternion();
  const cameraPositionTarget = new THREE.Vector3();
  let targetTheta = HOME.theta;
  let targetPhi = HOME.phi;
  let targetZoom = HOME.zoom;

  const track = (geometry) => { geometries.push(geometry); return geometry; };
  const trackMat = (material) => { materials.push(material); return material; };

  const positions = Object.fromEntries(Object.entries(LAYOUT).map(([id, v]) => [id, new THREE.Vector3(...v)]));
  const CORE = new THREE.Vector3(0, 0.6, -0.2);
  const selectable = ['user','api','lambda','dynamodb','s3','sns','cloudwatch','response','iam','workflow'];

  /* ---------------- lifecycle ---------------- */
  function setStage(next, { silent = false } = {}) {
    stageIndex = next;
    if (next === 0 && simSeconds > 0) serviceCursor = Math.floor(runs) % SERVICES.length;
    if (next === 0 && stageElapsed === 0 && simSeconds > 0) serviceCursor = Math.floor(runs / 1) % SERVICES.length;
    stageElapsed = 0;
    if (el.stageLabel) el.stageLabel.textContent = STAGES[next];
    if (el.detail) el.detail.textContent = STAGE_DETAIL[next];
    root.dataset.lifecycleStage = STAGES[next];
    el.steps.forEach((node, i) => {
      node.classList.toggle('is-active', i === next);
      node.setAttribute('aria-current', i === next ? 'step' : 'false');
    });
    if (el.status) el.status.textContent = STAGES[next];
    if (!silent && next === 0) runs += 1;
  }

  function stepSimulation(dt) {
    simSeconds += dt;
    ambient += dt;
    stageElapsed += dt;
    if (stageElapsed >= STAGE_SECONDS[stageIndex]) {
      const next = stageIndex === 5 ? 0 : stageIndex + 1;
      if (stageIndex === 2) serviceCursor = (serviceCursor + 1) % SERVICES.length;
      setStage(next, { silent: true });
    }
  }

  /* Deterministic advancement used by the render loop and by tests.
     Steps the simulation in fixed quanta, then repaints so reported state matches the stage. */
  function advance(ms) {
    const seconds = Math.max(0, ms) / 1000;
    accumulator += seconds;
    let guard = 0;
    while (accumulator >= FIXED_STEP && guard < 900) {
      stepSimulation(FIXED_STEP);
      accumulator -= FIXED_STEP;
      guard += 1;
    }
    paint();
    return snapshot();
  }

  /* Clean deterministic restart: zero the simulated clock and the stage. */
  function resetSim() {
    simSeconds = 0;
    accumulator = 0;
    stageElapsed = 0;
    serviceCursor = 0;
    runs = 0;
    setStage(0, { silent: true });
    serviceCursor = 0;
    paint();
    return snapshot();
  }

  /* ---------------- physical observatory stage ---------------- */
  function buildEnvironment() {
    const floor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(34, 24)),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x0b0d0d, metalness: 0.22, roughness: 0.88 })),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.56;
    floor.receiveShadow = true;
    floor.name = 'lab-floor';
    floor.userData.environment = true;
    scene.add(floor);

    const platformMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x292b29, metalness: 0.44, roughness: 0.62, emissive: 0x090a09, emissiveIntensity: 0.05 }));
    const edgeMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x897850, metalness: 0.72, roughness: 0.4, emissive: 0x17130b, emissiveIntensity: 0.08 }));
    const gridMat = trackMat(new THREE.LineBasicMaterial({ color: 0x8b8068, transparent: true, opacity: 0.095 }));
    const groundGrid = new THREE.GridHelper(32, 32, 0x3d382f, 0x292a27);
    groundGrid.position.y = -0.545;
    groundGrid.material = gridMat;
    groundGrid.userData.environment = true;
    scene.add(groundGrid);

    function platform(x, z, w, d, h = 0.18, selected = false) {
      const group = new THREE.Group();
      group.position.set(x, -0.5 + h / 2, z);
      const slab = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), selected ? edgeMat : platformMat);
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);
      const trim = new THREE.Mesh(track(new THREE.BoxGeometry(w * 0.96, 0.018, d * 0.96)), edgeMat);
      trim.position.y = h / 2 + 0.01;
      group.add(trim);
      group.userData.environment = true;
      scene.add(group);
      return group;
    }
    platform(-4.0, 3.0, 2.5, 2.0, 0.2);
    platform(-2.6, 1.8, 2.1, 2.2, 0.28);
    platform(0.0, 0.2, 3.3, 2.8, 0.36, true);
    platform(2.6, 0.1, 4.0, 3.4, 0.24);
    platform(0.5, -3.0, 3.8, 1.6, 0.18);
    platform(-3.15, 0.55, 1.3, 1.2, 0.3);
    platform(-0.7, -1.4, 2.0, 1.6, 0.22);

    // Recessed access boundary perimeter; secondary perimeter not part of request path.
    const perimeter = new THREE.LineLoop(
      track(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.75, -0.43, 2.25), new THREE.Vector3(1.5, -0.43, 2.25),
        new THREE.Vector3(1.5, -0.43, -2.55), new THREE.Vector3(-3.75, -0.43, -2.55),
      ])), gridMat,
    );
    perimeter.userData.environment = true;
    scene.add(perimeter);
  }

  /* ---------------- topology ---------------- */
  function labelSprite(id) {
    const text = COPY[id][0];
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = '500 30px "DM Mono", monospace';
    const statusText = ['cloudwatch'].includes(id) ? 'READY / OBSERVING' : 'READY';
    const textWidth = Math.ceil(probe.measureText(text).width) + 20;
    const canvasEl = document.createElement('canvas');
    canvasEl.width = textWidth;
    canvasEl.height = 78;
    const ctx = canvasEl.getContext('2d');
    ctx.font = '500 30px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e6dcc4';
    ctx.fillText(text, textWidth / 2, 25);
    ctx.font = '400 15px "DM Mono", monospace';
    ctx.fillStyle = '#a8976f';
    ctx.fillText(statusText, textWidth / 2, 57);
    const texture = new THREE.CanvasTexture(canvasEl);
    texture.colorSpace = THREE.SRGBColorSpace;
    const labelGroup = new THREE.Group();
    labelGroup.userData.labelFor = id;
    const mat = trackMat(new THREE.MeshBasicMaterial({ color: 0x0a0c0c, transparent: true, opacity: 0.86, depthWrite: false, side: THREE.DoubleSide }));
    const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(1.15, 0.34)), mat);
    labelGroup.add(plate);
    const material = trackMat(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.96 }));
    const sprite = new THREE.Sprite(material);
    sprite.center.set(0.5, 0.5);
    sprite.scale.set(1.6, 0.43, 1);
    sprite.userData.pathLabel = PATH_LABELS.includes(id);
    sprite.userData.aspect = canvasEl.width / canvasEl.height;
    sprite.position.set(0, 0, 0.015);
    labelGroup.position.copy(positions[id]).add(new THREE.Vector3(0, labelOffset(id), 0));
    labelGroup.userData.pathLabel = sprite.userData.pathLabel;
    labelGroup.add(sprite);
    labelGroup.userData.screenLabel = sprite;
    scene.add(labelGroup);
    return labelGroup;
  }

  function buildNode(id, index) {
    const group = new THREE.Group();
    group.position.copy(positions[id]);
    group.userData.service = id;

    const isLambda = id === 'lambda';
    const base = isLambda ? 0x3c3520 : 0x1b2020;
    const core = trackMat(new THREE.MeshStandardMaterial({
      color: base, metalness: 0.7, roughness: 0.34,
      emissive: isLambda ? 0x4a3a1c : 0x111817,
      emissiveIntensity: isLambda ? 0.5 : 0.2,
    }));

    let body;
    if (id === 'user' || id === 'response') {
      body = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.26, 1)), core);
      const ring = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.42, 0.011, 5, 64)),
        trackMat(new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.5 })),
      );
      ring.rotation.x = 0.85;
      ring.userData.decorative = true;
      group.add(ring);
    } else if (id === 'api') {
      body = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.48, 0.5, 6)), core);
      body.rotation.z = Math.PI / 2;
      const band = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.4, 0.016, 6, 48)),
        trackMat(new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.62 })),
      );
      band.rotation.y = Math.PI / 2;
      band.userData.decorative = true;
      group.add(band);
    } else if (isLambda) {
      body = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.48, 0)), core);
      const ringA = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.68, 0.016, 6, 72)),
        trackMat(new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.6 })),
      );
      ringA.rotation.set(0.95, 0.3, 0.2);
      const ringB = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.84, 0.008, 4, 72)),
        trackMat(new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.3 })),
      );
      ringB.rotation.set(0.2, 1.1, 0.4);
      ringA.userData.decorative = true;
      ringB.userData.decorative = true;
      group.add(ringA, ringB);
    } else if (id === 'dynamodb') {
      body = new THREE.Mesh(track(new THREE.CylinderGeometry(0.34, 0.34, 0.52, 32)), core);
      for (const y of [-0.18, 0, 0.18]) {
        const band = new THREE.Mesh(
          track(new THREE.TorusGeometry(0.34, 0.011, 4, 32)),
          trackMat(new THREE.MeshBasicMaterial({ color: C.blue, transparent: true, opacity: 0.55 })),
        );
        band.position.y = y;
        band.userData.decorative = true;
        group.add(band);
      }
    } else if (id === 's3') {
      body = new THREE.Mesh(track(new THREE.BoxGeometry(0.58, 0.5, 0.52)), core);
      const lid = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.62, 0.08, 0.55)),
        trackMat(new THREE.MeshStandardMaterial({ color: 0x2a2820, metalness: 0.6, roughness: 0.34, emissive: 0x241f12, emissiveIntensity: 0.24 })),
      );
      lid.position.y = 0.28;
      lid.userData.decorative = true;
      group.add(lid);
    } else if (id === 'sns') {
      body = new THREE.Mesh(track(new THREE.DodecahedronGeometry(0.36, 0)), core);
      for (let k = 0; k < 3; k += 1) {
        const spoke = new THREE.Mesh(
          track(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6)),
          trackMat(new THREE.MeshBasicMaterial({ color: C.mint, transparent: true, opacity: 0.66 })),
        );
        const a = (k * Math.PI * 2) / 3;
        spoke.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.36, 0);
        spoke.rotation.z = -a;
        spoke.userData.decorative = true;
        group.add(spoke);
      }
    } else {
      body = new THREE.Mesh(track(new THREE.TorusGeometry(0.38, 0.045, 8, 56)), core);
      body.rotation.x = Math.PI / 2;
      const inner = new THREE.Mesh(
        track(new THREE.TorusGeometry(0.2, 0.011, 5, 40)),
        trackMat(new THREE.MeshBasicMaterial({ color: C.mint, transparent: true, opacity: 0.6 })),
      );
      inner.rotation.x = Math.PI / 2;
      inner.userData.decorative = true;
      group.add(inner);
    }

    const hit = new THREE.Mesh(
      track(new THREE.SphereGeometry(isLambda ? 0.72 : 0.54, 12, 10)),
      trackMat(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })),
    );
    hit.userData.service = id;
    group.add(body, hit);
    pickables.push(hit);
    scene.add(group);
    nodes[id] = { group, core, hit, index, label: labelSprite(id), baseIntensity: isLambda ? 0.5 : 0.2 };
  }

  function curve(a, b, bow = 0.1, lift = 0.16) {
    const from = positions[a];
    const to = positions[b];
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += lift;
    mid.z += bow;
    return new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
  }

  function buildPath(a, b, { id, tier, color, bow = 0.1, lift = 0.16, radius = 0.016 }) {
    const pathCurve = curve(a, b, bow, lift);
    const conduitRadius = tier === 'primary' ? 0.075 : tier === 'secondary' ? 0.035 : 0.022;
    const conduit = new THREE.Mesh(
      track(new THREE.TubeGeometry(pathCurve, 36, conduitRadius, 6, false)),
      trackMat(new THREE.MeshStandardMaterial({ color: tier === 'primary' ? 0x343026 : 0x1b201e, metalness: 0.58, roughness: 0.58, emissive: tier === 'primary' ? 0x17140d : 0x090d0c, emissiveIntensity: 0.22 })),
    );
    conduit.userData.route = id;
    scene.add(conduit);
    const geometry = track(new THREE.TubeGeometry(pathCurve, 48, radius, 6, false));
    const material = trackMat(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: tier === 'primary' ? 0.62 : tier === 'secondary' ? 0.15 : 0.08 }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.route = id;
    scene.add(mesh);
    const entry = { id, a, b, tier, mesh, material, radius, baseOpacity: material.opacity, on: false, curve: pathCurve };
    paths.push(entry);
    entry.conduit = conduit;
    return entry;
  }

  /* Primary request path — strongest. */
  const requestSegments = {};
  function buildTopology() {
    // background: two quiet rails only, to give depth without competing with the path
    for (const [rad, rx, rz, op] of [[4.1, 0.5, 0.86, 0.1], [5.2, 0.28, 0.66, 0.07]]) {
      const rail = new THREE.Mesh(
        track(new THREE.TorusGeometry(rad, 0.005, 4, 120)),
        trackMat(new THREE.MeshBasicMaterial({ color: C.goldSoft, transparent: true, opacity: op })),
      );
      rail.rotation.set(rx, 0.14, rz);
      rail.userData.background = true;
      scene.add(rail);
    }

    requestSegments.received = buildPath('user', 'api', { id: 'received', tier: 'primary', color: C.blue, bow: 0.35, lift: 0.5, radius: 0.026 });
    requestSegments.invoked = buildPath('api', 'lambda', { id: 'invoked', tier: 'primary', color: C.blue, bow: 0.3, lift: 0.42, radius: 0.026 });
    for (const service of SERVICES) {
      requestSegments[service] = buildPath('lambda', service, { id: service, tier: 'primary', color: C.gold, bow: 0.3, lift: 0.3, radius: 0.024 });
      // secondary: telemetry from each service to CloudWatch
      buildPath(service, 'cloudwatch', { id: 'telemetry-' + service, tier: 'secondary', color: C.mint, bow: 0.2, lift: 0.2, radius: 0.0075 });
    }
    // secondary: access/configuration relationships, deliberately quiet
    buildPath('api', 'iam', { id: 'access', tier: 'tertiary', color: C.quiet, bow: 0.1, lift: 0.1, radius: 0.0045 });
    buildPath('lambda', 'cloudwatch', { id: 'execution-log', tier: 'secondary', color: C.mint, bow: 0.35, lift: 0.4, radius: 0.0075 });
    requestSegments.observed = buildPath('cloudwatch', 'response', { id: 'observed', tier: 'primary', color: C.blue, bow: 0.3, lift: 0.5, radius: 0.024 });
    requestSegments.complete = buildPath('response', 'user', { id: 'complete', tier: 'primary', color: C.blue, bow: 0.5, lift: -1.0, radius: 0.021 });
  }

  /* ---------------- physical serverless components ---------------- */
  function addBox(parent, size, position, material, bevel = false) {
    const geometry = bevel ? new THREE.BoxGeometry(...size) : new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(track(geometry), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function buildPhysicalComponents() {
    const casing = trackMat(new THREE.MeshStandardMaterial({ color: 0x45443d, metalness: 0.58, roughness: 0.44, emissive: 0x13120d, emissiveIntensity: 0.1 }));
    const darkMetal = trackMat(new THREE.MeshStandardMaterial({ color: 0x303633, metalness: 0.72, roughness: 0.42 }));
    const warmMetal = trackMat(new THREE.MeshStandardMaterial({ color: 0x8b7953, metalness: 0.76, roughness: 0.34, emissive: 0x15120b, emissiveIntensity: 0.1 }));
    const soft = trackMat(new THREE.MeshStandardMaterial({ color: 0x626a63, metalness: 0.48, roughness: 0.48, emissive: 0x101311, emissiveIntensity: 0.07 }));

    // USER / CLIENT: actual desk base, display, stand and keyboard.
    const user = nodes.user.group;
    addBox(user, [0.9, 0.08, 0.58], [0, -0.16, 0], casing);
    addBox(user, [0.56, 0.39, 0.08], [0, 0.19, -0.13], darkMetal);
    addBox(user, [0.44, 0.27, 0.015], [0, 0.2, -0.081], soft);
    addBox(user, [0.12, 0.2, 0.07], [0, -0.01, -0.12], warmMetal);
    addBox(user, [0.32, 0.035, 0.12], [0, -0.095, 0.18], warmMetal);

    // API Gateway: a physical portal/ingress frame, not an abstract cylinder.
    const api = nodes.api.group;
    addBox(api, [0.14, 0.92, 0.16], [-0.52, 0.36, 0], warmMetal);
    addBox(api, [0.14, 0.92, 0.16], [0.52, 0.36, 0], warmMetal);
    addBox(api, [1.18, 0.13, 0.16], [0, 0.82, 0], warmMetal);
    addBox(api, [0.08, 0.42, 0.08], [0, 0.38, 0], casing);
    addBox(api, [0.045, 0.28, 0.045], [0, 0.39, 0.06], nodes.api.core);

    // AWS Lambda: a small execution cabinet with three stacked cores/slots.
    const lambda = nodes.lambda.group;
    addBox(lambda, [0.8, 0.86, 0.72], [0, -0.02, 0], casing);
    addBox(lambda, [0.64, 0.7, 0.58], [0, 0.01, 0], darkMetal);
    for (let i = 0; i < 3; i += 1) {
      const y = 0.23 - i * 0.23;
      addBox(lambda, [0.43, 0.13, 0.49], [0, y, 0.06], warmMetal);
      addBox(lambda, [0.28, 0.055, 0.02], [0, y, 0.32], nodes.lambda.core);
    }
    const coreLight = new THREE.PointLight(C.gold, 0, 2.6);
    coreLight.position.set(0, 0.3, 0.75);
    lambda.add(coreLight);
    nodes.lambda.activationLight = coreLight;

    // DynamoDB: tactile data-stack with distinct layers.
    const db = nodes.dynamodb.group;
    for (let i = 0; i < 4; i += 1) {
      const slab = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.42, 0.13, 24)), i % 2 ? darkMetal : soft);
      slab.position.y = -0.23 + i * 0.16;
      slab.castShadow = true;
      slab.receiveShadow = true;
      db.add(slab);
    }
    // S3: object store cabinet + three discernible object modules.
    const s3 = nodes.s3.group;
    addBox(s3, [0.82, 0.84, 0.7], [0, 0, 0], casing);
    for (let i = 0; i < 3; i += 1) {
      addBox(s3, [0.18, 0.46, 0.36], [-0.23 + i * 0.23, 0.03, 0.18], i === 1 ? soft : darkMetal);
      addBox(s3, [0.09, 0.025, 0.015], [-0.23 + i * 0.23, 0.32, 0.375], warmMetal);
    }
    // SNS: message switchboard with three outgoing physical sockets.
    const sns = nodes.sns.group;
    addBox(sns, [0.52, 0.43, 0.42], [0, 0.02, 0], casing);
    for (let i = 0; i < 3; i += 1) {
      const angle = -0.75 + i * 0.75;
      const socket = new THREE.Mesh(track(new THREE.CylinderGeometry(0.105, 0.105, 0.16, 16)), warmMetal);
      socket.rotation.z = Math.PI / 2;
      socket.position.set(Math.sin(angle) * 0.68, 0.02 + Math.cos(angle) * 0.23, 0.02);
      socket.castShadow = true;
      sns.add(socket);
      const tip = new THREE.Mesh(track(new THREE.SphereGeometry(0.055, 10, 8)), soft);
      tip.position.copy(socket.position).add(new THREE.Vector3(Math.sin(angle) * 0.15, 0, 0));
      sns.add(tip);
    }
    // IAM/security: access gate structure around the ingress boundary.
    const iam = new THREE.Group();
    iam.position.set(...LAYOUT.iam);
    iam.position.x = LAYOUT.iam[0];
    for (const x of [-0.38, 0.38]) addBox(iam, [0.08, 0.68, 0.08], [x, 0.34, 0], warmMetal);
    addBox(iam, [0.86, 0.06, 0.08], [0, 0.68, 0], warmMetal);
    addBox(iam, [0.55, 0.08, 0.12], [0, 0.18, 0], soft);
    scene.add(iam);
    nodes.iam = { group: iam, core: nodes.api.core, baseIntensity: 0.18, index: 8, label: labelSprite('iam'), activationLight: null };

    // IAM access layer annotation: labels the perimeter gate visually.
    nodes.iam.label = labelSprite('iam');
    // CloudWatch observability tower: stacked display plates + indicator lamps.
    const cw = nodes.cloudwatch.group;
    addBox(cw, [0.68, 0.95, 0.48], [0, 0.06, 0], casing);
    for (let i = 0; i < 3; i += 1) {
      addBox(cw, [0.48, 0.17, 0.035], [0, 0.32 - i * 0.24, 0.26], darkMetal);
      addBox(cw, [0.33, 0.022, 0.016], [0, 0.32 - i * 0.24, 0.285], nodes.cloudwatch.core);
    }
    const telemetryLamp = new THREE.Mesh(track(new THREE.SphereGeometry(0.07, 12, 10)), nodes.cloudwatch.core);
    telemetryLamp.position.set(0.25, 0.65, 0.2);
    cw.add(telemetryLamp);

    // Automation workflow: an actual central process assembly between gateway and Lambda.
    const work = new THREE.Group();
    work.position.set(...LAYOUT.workflow);
    work.position.z = LAYOUT.workflow[2];
    addBox(work, [1.25, 0.12, 0.85], [0, 0, 0], casing);
    addBox(work, [0.78, 0.52, 0.1], [0, 0.31, 0], darkMetal);
    for (let i = 0; i < 3; i += 1) {
      const cog = new THREE.Mesh(track(new THREE.TorusGeometry(0.13, 0.026, 6, 20)), i === 1 ? warmMetal : soft);
      cog.position.set(-0.27 + i * 0.27, 0.32, 0.08);
      work.add(cog);
    }
    scene.add(work);
    nodes.workflow = { group: work, core: nodes.lambda.core, baseIntensity: 0.2, index: 9, label: labelSprite('workflow'), activationLight: null };

    // Response: physical output/display terminal.
    const response = nodes.response.group;
    addBox(response, [0.76, 0.14, 0.5], [0, -0.12, 0], casing);
    addBox(response, [0.5, 0.36, 0.08], [0, 0.16, -0.1], darkMetal);
    addBox(response, [0.4, 0.26, 0.015], [0, 0.17, -0.052], soft);
  }

  /* ---- single request signal ---- */
  let signal = null;
  let halo = null;
  function buildSignal() {
    signal = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.075, 16, 12)),
      trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff })),
    );
    halo = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.19, 14, 10)),
      trackMat(new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })),
    );
    signal.userData.signal = 'request';
    halo.userData.signal = 'halo';
    scene.add(signal, halo);
  }

  /* Position of the single signal, sampled from the SAME curve objects that draw the lines,
     so it always travels along visible topology. */
  const scratch = new THREE.Vector3();
  function pointOn(entry, t) {
    if (!entry) return null;
    return entry.curve.getPointAt(Math.max(0, Math.min(1, t)), scratch.clone());
  }
  function signalPoint(stage, t) {
    const service = SERVICES[serviceCursor];
    if (stage === 0) return pointOn(requestSegments.received, t);
    if (stage === 1) return pointOn(requestSegments.invoked, t);
    if (stage === 2) return pointOn(requestSegments.invoked, 1).lerp(pointOn(requestSegments[service], 0.06), t * 0.06);
    if (stage === 3) {
      return t < 0.55
        ? pointOn(requestSegments[service], t / 0.55)
        : pointOn(paths.find((entry) => entry.id === 'telemetry-' + service), (t - 0.55) / 0.45);
    }
    if (stage === 4) return pointOn(requestSegments.observed, t);
    return pointOn(requestSegments.complete, t);
  }

  /* ---------------- camera ---------------- */
  function cloudRadius() {
    let max = 0;
    for (const id of Object.keys(positions)) max = Math.max(max, positions[id].distanceTo(CORE));
    return max + 0.9;
  }
  function labelOffset(id) { if (id === 'iam') return 0.92; if (id === 'workflow') return -0.9; if (id === 'cloudwatch') return 0.9; if (id === 'dynamodb') return 0.76; if (id === 'sns') return -0.8; if (id === 's3') return -0.82; if (id === 'user' || id === 'api' || id === 'lambda' || id === 'response') return -0.78; return -0.72; }
  function cloudSpan(distance, cp) {
    /* Project the node cloud (plus label rows) at a candidate distance and return normalised extents. */
    const probe = camera.clone();
    probe.position.set(
      CORE.x + distance * Math.sin(view.theta) * Math.cos(cp),
      CORE.y + distance * Math.sin(cp),
      CORE.z + distance * Math.cos(view.theta) * Math.cos(cp),
    );
    probe.lookAt(CORE);
    probe.updateMatrixWorld();
    probe.updateProjectionMatrix();
    let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity;
    for (const id of Object.keys(positions)) {
      for (const y of [0, labelOffset(id)]) {
        const v = positions[id].clone().add(new THREE.Vector3(0, y, 0)).project(probe);
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      }
    }
    return { x: (maxX - minX) / 2, y: (maxY - minY) / 2 };
  }
  function applyCamera() {
    if (!camera) return;
    const radius = cloudRadius();
    cameraAim.set(0.0, 0.55, 0.0);
    const aspect = Math.max(0.35, camera.aspect);
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distanceForHeight = radius / Math.tan(vFov / 2);
    const distanceForWidth = radius / (Math.tan(vFov / 2) * aspect);
    let distance = Math.max(distanceForHeight, distanceForWidth) * 1.04;
    const cp = Math.max(0.48, Math.min(0.92, view.phi));
    /* Fit the projected cloud to the frame: width-driven, with a vertical guard. */
    for (let i = 0; i < 4; i += 1) {
      const span = cloudSpan(distance, cp);
      if (!Number.isFinite(span.x) || !Number.isFinite(span.y) || span.x <= 0.01 || span.y <= 0.01) break;
      /* Target: node centres span ~78% of the frame width, with a vertical guard at 62%. */
      const widthTarget = window.innerWidth <= 768 || stage.clientWidth < 560 ? 0.72 : 0.78;
      const factor = Math.max(0.5, Math.min(1.4, Math.max(span.x / widthTarget, span.y / 0.62)));
      if (Math.abs(factor - 1) < 0.005) break;
      distance *= factor;
    }
    const d = distance / view.zoom;
    cameraRadius = d;
    cameraPositionTarget.set(
      cameraAim.x + d * Math.sin(view.theta) * Math.cos(cp),
      cameraAim.y + d * Math.sin(cp),
      cameraAim.z + d * Math.cos(view.theta) * Math.cos(cp),
    );
    camera.position.copy(cameraPositionTarget);
    camera.lookAt(cameraAim);
  }

  /* ---------------- selection ---------------- */
  function setSelected(id) {
    if (!COPY[id] || !nodes[id]) return;
    selected = id;
    el.name.textContent = COPY[id][0];
    el.role.textContent = COPY[id][1];
    el.copy.textContent = COPY[id][2];
    el.life.textContent = COPY[id][3];
    el.buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.selectService === id)));
    root.dataset.selectedService = id;
  }

  /* ---------------- render loop ---------------- */
  function fitLabels() {
    if (!camera) return;
    const height = Math.max(1, stage.clientHeight);
    const showPrimaryOnly = window.innerWidth < 768;
    const narrow = stage.clientWidth < 560 || showPrimaryOnly;
    const showAll = !showPrimaryOnly;
    const targetGlyphPx = narrow ? 8 : stage.clientWidth < 700 ? 8.7 : 9.5;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    for (const id of Object.keys(nodes)) {
      const group = nodes[id].label;
      if (!group) continue;
      const show = narrow ? group.userData.pathLabel : true;
      group.visible = show;
      if (!show) continue;
      const sprite = group.userData.screenLabel;
      const depth = Math.max(0.001, camera.position.distanceTo(group.position));
      const worldPerPixel = (2 * depth * Math.tan(vFov / 2)) / height;
      const aspect = sprite.userData.aspect || 3;
      const h = (targetGlyphPx / LABEL_GLYPH_RATIO) * worldPerPixel;
      sprite.scale.set(h * aspect, h, 1);
      const plate = group.children[0];
      const width = Math.max(1.15, h * aspect + 0.16);
      plate.scale.set(width / 1.15, h / 0.34, 1);
    }
  }

  function paint() {
    const reduced = motionQuery.matches;
    const active = STAGES[stageIndex];
    const progress = Math.min(1, stageElapsed / STAGE_SECONDS[stageIndex]);
    const service = SERVICES[serviceCursor];

    /* nodes: only the stage owner and the selection respond */
    for (const id of Object.keys(nodes)) {
      const node = nodes[id];
      const lit = (id === 'iam' && (active === 'RECEIVED' || active === 'INVOKED'))
        || (id === 'workflow' && active === 'PROCESSING')
        || (id === 'api' && (active === 'RECEIVED' || active === 'INVOKED'))
        || (id === 'lambda' && active === 'INVOKED')
        || (id === 'lambda' && active === 'PROCESSING')
        || (id === service && active === 'TELEMETRY')
        || (id === 'cloudwatch' && (active === 'TELEMETRY' || active === 'OBSERVED'))
        || (id === 'response' && (active === 'OBSERVED' || active === 'COMPLETE'))
        || (id === 'user' && (active === 'RECEIVED' || active === 'COMPLETE'));
      const isSelected = id === selected || id === hovered;
      const breathe = reduced ? 0 : Math.sin(ambient * 1.1 + node.index * 0.7) * 0.01;
      const scale = 1 + (lit ? 0.075 : 0) + (isSelected ? 0.045 : 0) + breathe;
      node.group.scale.setScalar(scale);
      node.core.emissiveIntensity = (id === 'lambda' && active === 'PROCESSING')
        ? 1.35
        : lit ? 0.85 : isSelected ? 0.55 : node.baseIntensity;
      if (node.label) {
        const status = lit ? (id === 'lambda' && active === 'PROCESSING' ? 'PROCESSING' : id === 'cloudwatch' ? 'OBSERVING' : 'ACTIVE') : id === 'cloudwatch' ? 'READY' : 'READY';
        node.label.userData.status = status;
      }
      if (node.activationLight) node.activationLight.intensity = lit ? (id === 'lambda' ? 0.62 : 0.35) : 0;
    }
    if (nodes.workflow && nodes.workflow.group.children.length) {
      const isActive = active === 'PROCESSING';
      nodes.workflow.group.children.forEach((child, i) => {
        if (child.isMesh && child.geometry.type === 'TorusGeometry' && !reduced) child.rotation.z = ambient * (i % 2 ? -0.35 : 0.35);
        if (child.material?.emissiveIntensity !== undefined && isActive) child.material.emissiveIntensity = 0.32;
      });
    }

    /* paths: primaries are always the strongest; the active one lights up */
    for (const path of paths) {
      let on = false;
      if (path.id === 'received') on = active === 'RECEIVED';
      else if (path.id === 'invoked') on = active === 'INVOKED' || active === 'PROCESSING';
      else if (path.id === service) on = active === 'TELEMETRY';
      else if (path.id === 'telemetry-' + service) on = active === 'TELEMETRY';
      else if (path.id === 'execution-log') on = active === 'TELEMETRY';
      else if (path.id === 'observed') on = active === 'OBSERVED';
      else if (path.id === 'complete') on = active === 'COMPLETE';
      path.on = on;
      const floor = path.tier === 'primary' ? 0.62 : path.tier === 'secondary' ? 0.15 : 0.08;
      path.material.opacity = on ? Math.min(0.95, floor + 0.4) : floor;
      path.conduit.material.color.set(on ? (path.tier === 'primary' ? 0x54482f : 0x292b24) : (path.tier === 'primary' ? 0x343026 : 0x1b201e));
      path.conduit.material.emissiveIntensity = on ? (path.tier === 'primary' ? 0.58 : 0.28) : 0.17;
      path.material.color.set(on ? (path.tier === 'primary' ? C.gold : C.bone) : (path.tier === 'primary' ? C.goldSoft : path.tier === 'secondary' ? C.mint : C.quiet));
    }

    /* single request signal */
    const point = signalPoint(stageIndex, progress);
    if (point && signal) {
      signal.position.copy(point);
      halo.position.copy(point);
      const pulse = reduced ? 1 : 1 + Math.sin(ambient * 6) * 0.12;
      halo.scale.setScalar(pulse);
      signal.visible = true;
      halo.visible = true;
    }

    if (camera) {
      if (!reduced && !drag) {
        view.theta += (targetTheta - view.theta) * 0.16;
        view.phi += (targetPhi - view.phi) * 0.16;
        view.zoom += (targetZoom - view.zoom) * 0.16;
      } else if (reduced) {
        view.theta = targetTheta; view.phi = targetPhi; view.zoom = targetZoom;
      }
      applyCamera();
      fitLabels();
    }
  }

  function frame(now) {
    if (disposed || contextLost) return;
    const dt = Math.min(0.25, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (running) advance(dt * 1000);
    paint();
    if (renderer) renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  let lastFrame = 0;
  let running = true;

  /* ---------------- interaction ---------------- */
  function pointerToNdc(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
  }
  function pick(event) {
    if (!raycaster || !camera) return '';
    pointerToNdc(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.service : '';
  }
  function onPointerDown(event) {
    if (!camera) return;
    if (event.button !== undefined && event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, theta: view.theta, phi: view.phi, moved: false };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }
  function onPointerMove(event) {
    if (!camera) return;
    if (drag) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      targetTheta = Math.max(-0.65, Math.min(0.65, drag.theta - dx * 0.0035));
      targetPhi = Math.max(0.48, Math.min(0.92, drag.phi + dy * 0.0035));
      applyCamera();
      return;
    }
    const over = pick(event);
    if (over !== hovered) {
      hovered = over;
      stage.classList.toggle('has-hover', Boolean(over));
      canvas.style.cursor = over ? 'pointer' : 'grab';
      if (over && window.matchMedia('(hover: hover)').matches) setSelected(over);
    }
  }
  function onPointerUp(event) {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    canvas.style.cursor = 'grab';
    if (moved) return;
    const id = pick(event);
    if (id) setSelected(id);
  }
  function onWheel(event) {
    if (!camera) return;
    event.preventDefault();
    targetZoom = Math.max(0.86, Math.min(1.22, targetZoom * Math.exp(-event.deltaY * 0.0009)));
    if (motionQuery.matches) view.zoom = targetZoom;
    applyCamera();
  }
  function onKeyDown(event) {
    const map = { ArrowLeft: -0.1, ArrowRight: 0.1 };
    if (event.key in map) {
      targetTheta = Math.max(-0.65, Math.min(0.65, targetTheta + map[event.key]));
      view.theta = targetTheta;
      applyCamera();
      event.preventDefault();
    } else if (event.key === 'Home') resetView();
  }
  function resetView() {
    view.theta = targetTheta = HOME.theta;
    view.phi = targetPhi = HOME.phi;
    view.zoom = targetZoom = HOME.zoom;
    applyCamera();
    setSelected('lambda');
    if (el.status) el.status.textContent = 'VIEW RESET · LAMBDA';
  }

  function resize() {
    if (!renderer || !camera) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.15 : 1.45));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    applyCamera();
  }

  /* ---------------- lifecycle of the scene itself ---------------- */
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(rafId);
    if (renderer) { renderer.dispose(); renderer = null; }
    if (el.fallback) el.fallback.hidden = false;
    root.dataset.sceneState = 'fallback';
    if (el.status) el.status.textContent = '3D UNAVAILABLE · STATIC PATH SHOWN';
  }
  function destroy() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pagehide', destroy);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('keydown', onKeyDown);
    el.reset?.removeEventListener('click', resetView);
    el.buttons.forEach((button) => button.removeEventListener('click', onButton));
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => { material.map?.dispose(); material.dispose(); });
    if (renderer) { renderer.dispose(); renderer = null; }
    stage.dataset.teardown = 'complete';
    delete root.__serverlessTest;
  }
  function onButton(event) { setSelected(event.currentTarget.dataset.selectService); }

  function snapshot() {
    return {
      stage: STAGES[stageIndex],
      stageIndex,
      runs,
      service: SERVICES[serviceCursor],
      progress: Number(Math.min(1, stageElapsed / STAGE_SECONDS[stageIndex]).toFixed(3)),
      simSeconds: Number(simSeconds.toFixed(3)),
      selected,
      sceneState: root.dataset.sceneState,
      lambdaEmissive: Number((nodes.lambda?.core.emissiveIntensity ?? 0).toFixed(3)),
      activePaths: paths.filter((path) => path.on).map((path) => path.id),
      signal: signal ? [Number(signal.position.x.toFixed(3)), Number(signal.position.y.toFixed(3)), Number(signal.position.z.toFixed(3))] : null,
      reducedMotion: motionQuery.matches,
    };
  }

  /* Numeric proof that the single signal sits on (not near) the drawn topology. */
  function signalOnPath() {
    if (!signal) return null;
    let best = { id: null, distance: Infinity };
    const probe = new THREE.Vector3();
    for (const entry of paths) {
      for (let i = 0; i <= 72; i += 1) {
        entry.curve.getPointAt(i / 72, probe);
        const d = probe.distanceTo(signal.position);
        if (d < best.distance) best = { id: entry.id, distance: Number(d.toFixed(4)) };
      }
    }
    let travelling = 0;
    let halos = 0;
    scene.traverse((object) => { if (object.userData?.signal === 'request') travelling += 1; if (object.userData?.signal === 'halo') halos += 1; });
    return { nearestPath: best.id, distanceToPath: best.distance, travellingSignals: travelling, signalHalos: halos, activePaths: paths.filter((entry) => entry.on).map((entry) => entry.id) };
  }

  function labelCollisionPairs(extents) {
    const ids = Object.keys(extents);
    const pairs = [];
    for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) {
      const a = extents[ids[i]], b = extents[ids[j]];
      if (!nodes[ids[i]]?.label?.visible || !nodes[ids[j]]?.label?.visible) continue;
      if (Math.abs(a.cx-b.cx) < a.halfW+b.halfW && Math.abs(a.cy-b.cy) < a.halfH+b.halfH) pairs.push([ids[i],ids[j]]);
    }
    return pairs;
  }

  function project() {
    if (!camera) return null;
    camera.updateMatrixWorld();
    const rect = canvas.getBoundingClientRect();
    const points = {};
    const labels = {};
    const labelExtents = {};
    for (const id of Object.keys(positions)) {
      const v = positions[id].clone().project(camera);
      points[id] = [Math.round((v.x * 0.5 + 0.5) * rect.width), Math.round((-v.y * 0.5 + 0.5) * rect.height)];
      const group = nodes[id]?.label;
      const sprite = group?.userData.screenLabel;
      const lv = positions[id].clone().add(new THREE.Vector3(0, labelOffset(id), 0)).project(camera);
      const cx = (lv.x * 0.5 + 0.5) * rect.width;
      const cy = (-lv.y * 0.5 + 0.5) * rect.height;
      const glyphPx = sprite && group.visible ? Number((sprite.scale.y * LABEL_GLYPH_RATIO * (rect.height / (2 * Math.max(0.001, camera.position.distanceTo(sprite.position)) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)))).toFixed(1)) : 0;
      labels[id] = [Math.round(cx), Math.round(cy)];
      if (sprite && group.visible) {
        const halfW = (sprite.scale.x / 2) / ((2 * Math.max(0.001, camera.position.distanceTo(sprite.position)) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect)) * rect.width;
        const halfH = (sprite.scale.y / 2) / ((2 * Math.max(0.001, camera.position.distanceTo(sprite.position)) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) * rect.height;
        labelExtents[id] = { cx, cy, halfW, halfH, glyphPx };
      }
    }
    const shownLabels = Object.values(labelExtents);
    const labelsInside = shownLabels.every((e) => e.cx - e.halfW > 2 && e.cx + e.halfW < rect.width - 2 && e.cy - e.halfH > 2 && e.cy + e.halfH < rect.height - 2);
    const glyphSizes = Object.fromEntries(Object.entries(labelExtents).map(([id, e]) => [id, e.glyphPx]));
    const hiddenBranchLabels = Object.keys(labels).filter((id) => !nodes[id]?.label?.visible);
    const xs = Object.values(points).map((v) => v[0]);
    const marginX = rect.width * 0.06;
    const marginY = rect.height * 0.08;
    const inside = Object.values(points).every(([x, y]) => x > marginX && x < rect.width - marginX && y > marginY && y < rect.height - marginY);
    let minGap = Infinity;
    const ids = Object.keys(points);
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const [ax, ay] = points[ids[i]];
        const [bx, by] = points[ids[j]];
        minGap = Math.min(minGap, Math.hypot(ax - bx, ay - by));
      }
    }
    return { canvas: [Math.round(rect.width), Math.round(rect.height)], points, labels, labelsInside, labelCollisions: labelCollisionPairs(labelExtents), glyphSizes, hiddenBranchLabels, widthUsage: Number(((Math.max(...xs) - Math.min(...xs)) / rect.width).toFixed(3)), inside, minGap: Math.round(minGap), spineLeftToRight: points.user[0] < points.api[0] && points.api[0] < points.lambda[0] && points.lambda[0] < points.response[0], sceneObjects: { requiredObjects:['user','api','lambda','dynamodb','s3','sns','iam','cloudwatch','workflow','response'].every(id => Boolean(nodes[id]?.group)), labels:Object.fromEntries(Object.keys(nodes).filter(id=>nodes[id].label).map(id=>[id,nodes[id].label.visible])), floor: Boolean(scene.getObjectByName('lab-floor')), platforms: scene.children.filter(o => o.userData.environment && o.type === 'Group').length, routeConduits: scene.children.filter(o => o.userData.route).length, physicalComponentParts: scene.children.reduce((sum,o)=>sum+(o.userData.service ? o.children.filter(c=>c.isMesh).length : 0),0) } };
  }

  /* ---------------- boot ---------------- */
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: window.innerWidth > 760, powerPreference: 'low-power' });
    renderer.setClearColor(0x070909, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x070909, 14, 26);
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    scene.add(new THREE.HemisphereLight(0xd8d0bb, 0x070909, 1.2));
    const key = new THREE.PointLight(C.gold, 22, 22);
    key.position.set(-1.5, 4, 5);
    scene.add(key);
    const fill = new THREE.PointLight(C.blue, 8, 18);
    fill.position.set(5, -1.5, -1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xd6c9ab, 2.4);
    rim.position.set(-5, 9, -7);
    scene.add(rim);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    buildEnvironment();
    buildTopology();
    Object.keys(LAYOUT).forEach((id, index) => buildNode(id, index));
    buildPhysicalComponents();
    buildSignal();

    setSelected('lambda');
    setStage(0, { silent: true });
    resize();
    paint();
    if (renderer) renderer.render(scene, camera);

    window.addEventListener('resize', resize);
    window.addEventListener('pagehide', destroy, { once: true });
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('keydown', onKeyDown);
    el.reset?.addEventListener('click', resetView);
    el.buttons.forEach((button) => button.addEventListener('click', onButton));

    if (el.fallback) el.fallback.hidden = true;
    root.dataset.sceneState = 'ready';
    if (el.status) el.status.textContent = 'RECEIVED';

    lastFrame = performance.now();
    rafId = requestAnimationFrame(frame);
  } catch (error) {
    console.error('[serverless-study] scene unavailable', error);
    if (el.fallback) el.fallback.hidden = false;
    root.dataset.sceneState = 'fallback';
  }

  root.__serverlessTest = {
    snapshot,
    tick: advance,
    setStage: (index) => { stageElapsed = 0; setStage(index, { silent: true }); paint(); return snapshot(); },
    resetSim,
    setRunning: (value) => { running = Boolean(value); return running; },
    signalOnPath,
    project,
    select: (id) => { setSelected(id); paint(); return snapshot(); },
    reset: () => { resetView(); return snapshot(); },
    loseContext: () => onContextLost(new Event('webglcontextlost', { cancelable: true })),
    destroy,
  };
  return root.__serverlessTest;
}

const target = document.querySelector('[data-serverless-experience]');
if (target) mountServerlessObservatory(target);
