/* lab-serverless-scene.js — Phase B Serverless Learning 3D scene.
   Educational prototype. All telemetry simulated; no AWS connectivity.
   Exports DATA (nodes/routes/stages/events) + createServerlessScene(host). */

import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, SphereGeometry,
  TorusGeometry, TubeGeometry, QuadraticBezierCurve3, Raycaster, Vector2, Vector3,
  MeshBasicMaterial, MeshStandardMaterial, PointLight, AmbientLight,
  Color, MathUtils, AdditiveBlending
} from './three.module-BbDkOMEo.js';

/* ================= DATA — single source of truth ================= */

const NODES = [
  { id:'user',       title:'USER',        category:'REQUEST ORIGIN',    p:[-1.48,  .50,  .36], copy:'The client that initiates the request — a browser, mobile app or another service.' },
  { id:'api',        title:'API GATEWAY',category:'ENTRY & ROUTING',   p:[-0.94,  .02,  .82], copy:'Validates the request, applies authorization, and routes it to the compute layer.' },
  { id:'lambda',     title:'LAMBDA',      category:'COMPUTE & LOGIC',   p:[-0.12,  .06, 1.42], copy:'Runs the application logic when invoked. Here it performs three parallel actions: a table write, an object store, and an event publish.' },
  { id:'dynamodb',   title:'DYNAMODB',    category:'DATA · KEY/VALUE', p:[ 0.88,  .88,  .72], copy:'Receives the structured item written by the function.' },
  { id:'s3',         title:'S3',          category:'OBJECT STORAGE',    p:[ 1.20,  .22,  .55], copy:'Receives the result object written by the function.' },
  { id:'sns',        title:'SNS',        category:'EVENT DISTRIBUTION',p:[ 0.77, -.68,  .62], copy:'Receives the notification the function publishes; fan-out is downstream.' },
  { id:'cloudwatch', title:'CLOUDWATCH',  category:'OBSERVABILITY SINK',p:[-0.12, -.92,  .52], copy:'Collects metrics and logs from every service. A telemetry sink — never a sequential hop in the request path.' },
  { id:'response',   title:'RESPONSE',    category:'RETURN PATH',      p:[-1.40, -.58,  .28], copy:'Carries the assembled result back to the user client.' }
];

/* Frozen route graph: 10 routes verified in the shipped Home scene + approved route 11. */
const ROUTES = [
  { id:'r01', from:'user',       to:'api',        class:'REQUEST PATH' },
  { id:'r02', from:'api',        to:'lambda',     class:'INVOCATION' },
  { id:'r03', from:'lambda',     to:'dynamodb',   class:'DATA WRITE' },
  { id:'r04', from:'lambda',     to:'s3',         class:'DATA WRITE' },
  { id:'r05', from:'lambda',     to:'sns',        class:'EVENT PUBLISH' },
  { id:'r06', from:'lambda',     to:'cloudwatch', class:'DIRECT TELEMETRY' },
  { id:'r07', from:'dynamodb',   to:'cloudwatch', class:'SERVICE TELEMETRY' },
  { id:'r08', from:'s3',         to:'cloudwatch', class:'SERVICE TELEMETRY' },
  { id:'r09', from:'cloudwatch', to:'response',   class:'AGGREGATION RETURN' },
  { id:'r10', from:'response',   to:'user',       class:'RETURN PATH' },
  { id:'r11', from:'sns',        to:'cloudwatch', class:'SERVICE TELEMETRY / METRICS' }
];

/* Approved lifecycle — durations configurable (ms). Simulation time, not frame time. */
const STAGES = [
  { id:'RECEIVED',   dwell:1500, trace:'r01', label:'The request arrives at the gateway' },
  { id:'INVOKED',    dwell:1500, trace:'r02', label:'The function is invoked' },
  { id:'PROCESSING', dwell:3000, trace:'r03', sparks:[{r:'r03',at:500},{r:'r04',at:1200},{r:'r05',at:2000}], label:'Three parallel data actions' },
  { id:'TELEMETRY',  dwell:2000, trace:null,  sparks:[{r:'r06',at:0},{r:'r07',at:500},{r:'r08',at:1000},{r:'r11',at:1500}], label:'Metrics flow toward CloudWatch' },
  { id:'OBSERVED',   dwell:2000, trace:'r09', label:'Aggregated view, checks pass' },
  { id:'COMPLETE',   dwell:1500, trace:'r10', label:'The response is delivered' }
];
const CYCLE_MS = STAGES.reduce((s, x) => s + x.dwell, 0); // 11500

/* Deterministic event trace (absolute ms within the cycle). */
function buildEvents() {
  const E = [];
  const ev = (t, type, svc, text, opts = {}) => E.push(Object.assign({ seq:E.length, tMs:t, type, service:svc, text, simulated:true }, opts));
  ev(0,    'REQUEST_RECEIVED', 'user',       'Request initiated by the user client.');
  ev(1200, 'GATEWAY_ACCEPT',   'api',        'API Gateway validates and accepts the request.');
  ev(1500, 'AUTHORIZER_PASS',  'api',        'Request authorization passed (simulated policy check).', { stageBoundary:true });
  ev(2100, 'LAMBDA_INVOKE',   'lambda',     'Lambda function invoked — warm start.');
  ev(2600, 'RUNTIME_READY',    'lambda',     'Execution environment prepared.');
  ev(3000, 'STAGE_CHANGE',     'lambda',     'Processing begins: three parallel data actions.', { stageBoundary:true });
  ev(3500, 'DATA_WRITE',       'dynamodb',   'Item written to the DynamoDB table.');
  ev(4200, 'OBJECT_PUT',       's3',         'Result object stored in S3.');
  ev(5000, 'EVENT_PUBLISH',    'sns',        'Notification published to the SNS topic.');
  ev(6000, 'METRIC_EMIT',      'lambda',     'Function duration metric emitted to CloudWatch.', { route:'r06', stageBoundary:true });
  ev(6500, 'METRIC_EMIT',      'dynamodb',   'Consumed-capacity metric emitted to CloudWatch.', { route:'r07' });
  ev(7000, 'METRIC_EMIT',      's3',         'Request-count metric emitted to CloudWatch.', { route:'r08' });
  ev(7500, 'METRIC_EMIT',      'sns',        'Publish metric emitted to CloudWatch (route 11).', { route:'r11' });
  ev(8000, 'METRICS_AGG',      'cloudwatch', 'Metrics aggregated across services.', { stageBoundary:true });
  ev(9200, 'ALARM_CHECK',      'cloudwatch', 'Alarm evaluation: OK — thresholds nominal (simulated).');
  ev(10000,'RESPONSE_BUILD',   'response',   'Response assembled from the function result.', { stageBoundary:true });
  ev(11000,'RESPONSE_DELIVERED','user',      'Response delivered to the user client.');
  return E;
}
const EVENTS = buildEvents();

export const DATA = { NODES, ROUTES, STAGES, EVENTS, CYCLE_MS };

/* ================= scene ================= */

const CY = { base:0x9fd8e8, hot:0x5fe3ff, dim:0x1c4a58, line:0x2b6a7c, text:0x9fd8e8 };

function curveBetween(a, b, zOffset) {
  const m = a.clone().add(b).multiplyScalar(0.5); m.z += zOffset;
  return new QuadraticBezierCurve3(a.clone(), m, b.clone());
}

export function createServerlessScene(host) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = host.querySelector('[data-sl-canvas]');
  const labelsHost = host.querySelector('[data-sl-labels]');
  const inspector = host.querySelector('[data-sl-inspector]');
  const listeners = {};
  const emit = (k, v) => (listeners[k] || []).forEach(fn => fn(v));

  const renderer = new WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 40); camera.position.set(0, 0, 5.4);
  const root = new Group(); root.rotation.set(-0.1, -0.18, 0); scene.add(root);
  scene.add(new AmbientLight(0x7ab8cf, 0.55));
  const keyLight = new PointLight(0x9fe8ff, 14, 0); keyLight.position.set(2.2, 2.4, 4.2); scene.add(keyLight);

  const pos = new Map(NODES.map(n => [n.id, new Vector3(...n.p)]));
  const nodeObjs = new Map(); const routeMeshes = new Map(); const disposables = [];
  const ray = new Raycaster(); const ndc = new Vector2();
  let selected = null, hovered = null, frame = 0, raf = 0, running = true, visible = true;
  let contextLost = false, disposed = false;

  /* boundary wireframe sphere + equator ring */
  const bGeo = new SphereGeometry(1.95, 28, 18);
  const bMat = new MeshBasicMaterial({ color:CY.line, wireframe:true, transparent:true, opacity:0.05 });
  const boundary = new Mesh(bGeo, bMat); root.add(boundary); disposables.push(bGeo, bMat);
  const eqGeo = new TorusGeometry(1.95, 0.006, 8, 90);
  const eqMat = new MeshBasicMaterial({ color:CY.dim, transparent:true, opacity:0.5 });
  const equator = new Mesh(eqGeo, eqMat); equator.rotation.x = Math.PI / 2.4; root.add(equator); disposables.push(eqGeo, eqMat);

  /* nodes: core + ring */
  const coreGeo = new SphereGeometry(0.085, 20, 14);
  const ringGeo = new TorusGeometry(0.165, 0.011, 8, 40);
  NODES.forEach((n, i) => {
    const g = new Group(); g.position.copy(pos.get(n.id));
    const coreMat = new MeshStandardMaterial({ color:CY.base, emissive:CY.base, emissiveIntensity:0.35, roughness:0.4, metalness:0.1 });
    const core = new Mesh(coreGeo, coreMat); g.add(core);
    const ringMat = new MeshBasicMaterial({ color:CY.dim, transparent:true, opacity:0.55 });
    const ring = new Mesh(ringGeo, ringMat); ring.rotation.set(MathUtils.degToRad(60 + i * 24), MathUtils.degToRad(i * 40), 0); g.add(ring);
    const haloMat = new MeshBasicMaterial({ color:CY.hot, transparent:true, opacity:0.0, blending:AdditiveBlending });
    const halo = new Mesh(new SphereGeometry(0.14, 14, 10), haloMat); g.add(halo);
    disposables.push(coreMat, ringMat, haloMat, halo.geometry);
    g.userData = { id:n.id, halo, coreMat, ringMat };
    nodeObjs.set(n.id, g); root.add(g);
  });

  /* routes: thin tubes, alternating z-offset */
  const tubeMat = new Map();
  ROUTES.forEach((r, i) => {
    const curve = curveBetween(pos.get(r.from), pos.get(r.to), (i % 2 ? 0.12 : -0.12));
    const geo = new TubeGeometry(curve, 26, 0.006, 4, false);
    const mat = new MeshBasicMaterial({ color:CY.line, transparent:true, opacity:0.34 });
    const mesh = new Mesh(geo, mat); mesh.userData = { route:r.id };
    disposables.push(geo, mat);
    routeMeshes.set(r.id, { mesh, mat, curve, base:0.34 });
    root.add(mesh);
  });

  /* packet + sparks */
  const pkGeo = new SphereGeometry(0.042, 14, 10);
  const pkMat = new MeshBasicMaterial({ color:CY.hot, blending:AdditiveBlending, transparent:true, opacity:0.95 });
  const packet = new Mesh(pkGeo, pkMat); packet.visible = false; disposables.push(pkGeo, pkMat);
  root.add(packet);
  const sparkPool = [];
  for (let i = 0; i < 4; i++) {
    const s = new Mesh(new SphereGeometry(0.026, 10, 8), new MeshBasicMaterial({ color:CY.hot, blending:AdditiveBlending, transparent:true, opacity:0.9 }));
    s.visible = false; sparkPool.push(s); root.add(s); disposables.push(s.geometry, s.material);
  }

  /* labels (DOM) */
  const labelEls = new Map();
  NODES.forEach(n => {
    const el = document.createElement('span');
    el.className = 'sl-label'; el.dataset.id = n.id; el.textContent = n.title;
    labelsHost.appendChild(el); labelEls.set(n.id, el);
  });

  /* ---------- simulation state (independent of rendering) ---------- */
  const state = { simTime:0, playing:true, speed:1, cycle:0, stageIndex:-1, doneEvents:new Set() };
  const stageAt = (t) => { let acc = 0; for (let i = 0; i < STAGES.length; i++) { acc += STAGES[i].dwell; if (t < acc) return i; } return STAGES.length - 1; };
  const stageStart = (i) => STAGES.slice(0, i).reduce((s, x) => s + x.dwell, 0);

  function setSimTime(t, opts = {}) {
    const prevCycle = Math.floor(state.simTime / CYCLE_MS);
    state.simTime = MathUtils.clamp(t, 0, CYCLE_MS * 1e6); // monotonic clock across cycles
    const cyc = Math.floor(state.simTime / CYCLE_MS);
    if (cyc !== state.cycle || opts.force) { state.cycle = cyc; emit('cycle', cyc + 1); }
    const tIn = state.simTime % CYCLE_MS;
    const si = stageAt(tIn);
    if (si !== state.stageIndex || opts.force) {
      state.stageIndex = si; emit('stage', { index:si, stage:STAGES[si], tIn });
      host.querySelector('[data-sl-stage-label]').textContent = 'STAGE — ' + STAGES[si].id;
    }
    host.querySelector('[data-sl-cycle]').textContent = 'CYCLE ' + String(state.cycle + 1).padStart(2, '0');
    for (const e of EVENTS) {
      const abs = cyc * CYCLE_MS + e.tMs;
      if (state.simTime >= abs && !state.doneEvents.has(abs + ':' + e.seq)) {
        state.doneEvents.add(abs + ':' + e.seq);
        emit('event', e);
      }
    }
    emit('tick', { tIn, stageIndex:si, cycle:state.cycle });
  }

  /* deterministic visuals, pure function of simTime */
  function applySimVisuals() {
    const tIn = state.simTime % CYCLE_MS;
    const si = stageAt(tIn); const st = STAGES[si];
    const tLocal = tIn - stageStart(si);
    /* reset route emphasis */
    ROUTES.forEach(r => { const rm = routeMeshes.get(r.id); rm.mat.opacity = rm.base; });
    /* trace edge packet */
    if (!reduced && st.trace) {
      const rm = routeMeshes.get(st.trace); rm.mat.opacity = 0.95;
      const f = Math.min(1, tLocal / st.dwell);
      rm.curve.getPoint(f, packet.position); packet.visible = true;
    } else packet.visible = false;
    /* stage route emphasis even without packet */
    if (st.trace) routeMeshes.get(st.trace).mat.opacity = Math.max(0.9, routeMeshes.get(st.trace).mat.opacity);
    /* sparks */
    sparkPool.forEach(s => s.visible = false);
    if (!reduced && st.sparks) {
      st.sparks.forEach((sp, i) => {
        const life = tLocal - sp.at;
        if (life >= 0 && life <= 600) {
          const s = sparkPool[i]; const rm = routeMeshes.get(sp.r);
          rm.mat.opacity = 0.85;
          rm.curve.getPoint(Math.min(1, life / 600), s.position); s.visible = true;
        }
      });
    }
    /* node emphasis by stage */
    const active = { RECEIVED:['user','api'], INVOKED:['api','lambda'], PROCESSING:['lambda','dynamodb','s3','sns'], TELEMETRY:['lambda','dynamodb','s3','sns','cloudwatch'], OBSERVED:['cloudwatch','response'], COMPLETE:['response','user'] }[st.id] || [];
    nodeObjs.forEach((g, id) => {
      const isSel = id === selected, isOn = active.includes(id) || isSel || id === hovered;
      g.userData.halo.material.opacity = MathUtils.lerp(g.userData.halo.material.opacity, isSel ? 0.8 : isOn ? 0.5 : 0, 0.12);
      g.userData.coreMat.emissiveIntensity = isSel ? 1.4 : isOn ? 0.9 : 0.35;
      g.userData.ringMat.opacity = isSel ? 1 : isOn ? 0.75 : 0.55;
      g.userData.ringMat.color.setHex(isSel ? CY.hot : CY.dim);
    });
  }

  /* ---------- rendering loop (single driver) ---------- */
  let last = 0;
  function loop(ts) {
    raf = 0;
    if (disposed || contextLost) return;
    const delta = last ? Math.min((ts - last) / 1000, 0.04) : 0; last = ts;
    if (state.playing && visible && !document.hidden) setSimTime(state.simTime + delta * 1000 * state.speed);
    applySimVisuals();
    updateLabels();
    renderer.render(scene, camera);
    frame++; host.dataset.frames = String(frame);
    if (!reduced || frame < 2) raf = requestAnimationFrame(loop);
    else host.dataset.sceneState = 'static';
  }
  function start() { if (!raf && visible && !contextLost && !disposed) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }

  function updateLabels() {
    if (frame % 2) return;
    const w = host.clientWidth, h = host.clientHeight;
    NODES.forEach(n => {
      const v = pos.get(n.id).clone(); root.localToWorld(v); v.project(camera);
      const el = labelEls.get(n.id);
      if (v.z > 1) { el.style.opacity = '0'; return; }
      el.style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
      const on = n.id === selected || n.id === hovered;
      el.classList.toggle('is-active', on);
      el.style.opacity = on ? '1' : '0.72';
    });
  }

  /* ---------- interaction ---------- */
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([...nodeObjs.values()], true);
    for (const h of hits) { let o = h.object; while (o && !o.userData.id) o = o.parent; if (o) return o.userData.id; }
    return null;
  }
  function select(id) {
    selected = id;
    if (!id) { inspector.hidden = true; emit('select', null); return; }
    const n = NODES.find(x => x.id === id); const i = NODES.indexOf(n);
    host.querySelector('[data-sl-index]').textContent = String(i + 1).padStart(2, '0') + ' / 08';
    host.querySelector('[data-sl-title]').textContent = n.title;
    host.querySelector('[data-sl-category]').textContent = n.category;
    host.querySelector('[data-sl-copy]').textContent = n.copy;
    const outs = ROUTES.filter(r => r.from === id); const ins = ROUTES.filter(r => r.to === id);
    host.querySelector('[data-sl-state]').textContent = 'ROUTES: ' + (ins.length + outs.length) + ' CONNECTED (' + outs.length + ' OUT · ' + ins.length + ' IN)';
    inspector.hidden = false;
    emit('select', { id, node:n });
  }
  canvas.addEventListener('pointerdown', e => {
    const id = pick(e.clientX, e.clientY);
    if (id) { select(id); return; }
    drag.active = true; drag.x = e.clientX; drag.y = e.clientY; canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
  });
  const drag = { active:false, x:0, y:0, vx:0, vy:0, rx:-0.1, ry:-0.18 };
  canvas.addEventListener('pointermove', e => {
    if (drag.active) {
      drag.vx = (e.clientX - drag.x) * 0.004; drag.vy = (e.clientY - drag.y) * 0.004;
      drag.ry += drag.vx; drag.rx = MathUtils.clamp(drag.rx + drag.vy, -0.7, 0.7);
      drag.x = e.clientX; drag.y = e.clientY;
      root.rotation.set(drag.rx, drag.ry, 0);
    } else hovered = pick(e.clientX, e.clientY);
  });
  const endDrag = e => { drag.active = false; canvas.classList.remove('is-dragging'); try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  host.querySelector('[data-sl-close]').addEventListener('click', () => select(null));
  const baseRotation = () => { drag.rx = -0.1; drag.ry = -0.18; root.rotation.set(drag.rx, drag.ry, 0); };
  host.querySelector('[data-sl-reset]').addEventListener('click', baseRotation);
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const ids = NODES.map(n => n.id); const cur = selected ? ids.indexOf(selected) : -1;
      select(ids[(cur + (e.key === 'ArrowRight' ? 1 : ids.length)) % ids.length]); e.preventDefault();
    }
  });

  /* ---------- visibility / lifecycle / context loss ---------- */
  const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold:0.05 });
  io.observe(host);
  const vis = () => document.hidden ? stop() : start();
  document.addEventListener('visibilitychange', vis);
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault(); contextLost = true; stop();
    host.querySelector('[data-sl-fallback]').hidden = false;
    host.dataset.sceneState = 'fallback'; emit('contextlost');
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false; host.querySelector('[data-sl-fallback]').hidden = true;
    host.dataset.sceneState = 'ready'; last = 0; start(); emit('contextrestored');
  }, false);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); const ro = new ResizeObserver(resize); ro.observe(host);

  setSimTime(0, { force:true });
  host.dataset.sceneState = reduced ? 'static' : 'ready';
  if (reduced) { applySimVisuals(); updateLabels(); renderer.render(scene, camera); }
  else start();

  const onPageHide = () => api.dispose();
  addEventListener('pagehide', onPageHide, { once:true });

  const api = {
    DATA, reduced,
    on(k, fn) { (listeners[k] = listeners[k] || []).push(fn); },
    play() { if (!state.playing) { state.playing = true; emit('playing', true); start(); } },
    pause() { if (state.playing) { state.playing = false; emit('playing', false); } },
    setSpeed(v) { state.speed = v; },
    scrub(ms) { state.doneEvents.clear(); emit('trace-reset'); setSimTime(ms, { force:true }); if (reduced) { applySimVisuals(); updateLabels(); renderer.render(scene, camera); } },
    replay() { state.doneEvents.clear(); emit('trace-reset'); state.cycle = -1; setSimTime(0, { force:true }); emit('replay'); api.play(); },
    reset() { state.doneEvents.clear(); emit('trace-reset'); state.cycle = -1; setSimTime(0, { force:true }); baseRotation(); select(null); api.pause(); },
    selectNode(id) { select(id); },
    focusNode(id) { select(id); const t = NODES.find(n => n.id === id).title; emit('focus', t); },
    getState() { return { simTime:state.simTime, tIn:state.simTime % CYCLE_MS, cycle:state.cycle + 1, stageIndex:state.stageIndex, stage:STAGES[state.stageIndex].id, playing:state.playing, selected, contextLost, frames:frame, nodes:nodeObjs.size, routes:routeMeshes.size }; },
    dispose() {
      if (disposed) return; disposed = true; stop(); io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', vis);
      disposables.forEach(d => d.dispose && d.dispose());
      scene.clear(); renderer.dispose(); emit('disposed');
    }
  };
  return api;
}
