/* lab-serverless-dashboard.js — Phase B engineering trace dashboard.
   Pure DOM. Subscribes to the scene's event emitter; no rendering logic. */

import { DATA } from './lab-serverless-scene.js';

export function createDashboard(rail, scene) {
  const { NODES, ROUTES, STAGES, EVENTS, CYCLE_MS } = DATA;
  const $ = (sel) => rail.querySelector(sel);

  /* ---- stage strip ---- */
  const stagesEl = $('[data-sl-stages]');
  const segs = STAGES.map((st, i) => {
    const li = document.createElement('div');
    li.className = 'sl-seg'; li.setAttribute('role', 'listitem');
    li.style.flex = String(st.dwell);
    li.innerHTML = `<i class="sl-seg-bar"><b></b></i><span>${st.id}</span><em>${(st.dwell / 1000).toFixed(1)}s</em>`;
    stagesEl.appendChild(li);
    return li;
  });

  /* ---- node list (keyboard focusable) ---- */
  const nodesEl = $('[data-sl-nodes]');
  NODES.forEach(n => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sl-node'; b.dataset.id = n.id;
    b.innerHTML = `<span>${n.title}</span><em>${n.category}</em>`;
    b.addEventListener('click', () => scene.selectNode(n.id));
    nodesEl.appendChild(b);
  });

  /* ---- metrics (all simulated) ---- */
  const metricsEl = $('[data-sl-metrics]');
  const metricDefs = [
    { id:'m1', label:'LAMBDA · DURATION', unit:'ms', fn:(t) => 84 + Math.round(Math.sin(t / 700) * 8 + (t % 300) / 18) },
    { id:'m2', label:'DYNAMODB · CONSUMED RCUS', unit:'RCU', fn:(t) => 2 + Math.round(Math.sin(t / 900) * 1.4 + 1) },
    { id:'m3', label:'CLOUDWATCH · METRICS RECEIVED', unit:'cnt', fn:(t) => Math.min(11, 1 + Math.floor(t / 1000)) }
  ];
  metricDefs.forEach(m => {
    const d = document.createElement('div');
    d.className = 'sl-metric'; d.innerHTML = `<span>${m.label}</span><strong>—</strong><em>SIMULATED · ${m.unit}</em>`;
    metricsEl.appendChild(d); m.el = d.querySelector('strong');
  });

  /* ---- trace log ---- */
  const traceEl = $('[data-sl-trace]');
  const rowFor = (e) => {
    const li = document.createElement('li');
    li.className = 'sl-evt' + (e.stageBoundary ? ' sl-evt-boundary' : '');
    li.innerHTML = `<button type="button"><i>t+${(e.tMs / 1000).toFixed(2)}s</i><b>${e.type}</b><span>${e.text}</span><em>${(scene.DATA ? '' : '')}SIMULATED</em></button>`;
    li.querySelector('button').addEventListener('click', () => scene.focusNode(e.service));
    return li;
  };
  const appendEvent = (e) => { traceEl.appendChild(rowFor(e)); traceEl.scrollTop = traceEl.scrollHeight; };

  /* ---- controls ---- */
  const playBtn = $('[data-sl-play]');
  const scrubEl = $('[data-sl-scrub]');
  const speedEl = $('[data-sl-speed]');
  playBtn.addEventListener('click', () => { scene.getState().playing ? scene.pause() : scene.play(); });
  $('[data-sl-replay]').addEventListener('click', () => { scene.replay(); clearTrace(); });
  $('[data-sl-reset-sim]').addEventListener('click', () => { scene.reset(); clearTrace(); });
  scrubEl.addEventListener('input', () => { scene.pause(); scene.scrub(Number(scrubEl.value)); });
  speedEl.addEventListener('change', () => scene.setSpeed(Number(speedEl.value)));
  function clearTrace() { traceEl.innerHTML = ''; }

  /* ---- wire emitter ---- */
  scene.on('trace-reset', clearTrace);
  scene.on('event', appendEvent);
  scene.on('stage', ({ index }) => {
    segs.forEach((s, i) => s.classList.toggle('is-active', i === index));
    segs.forEach((s, i) => s.classList.toggle('is-done', i < index));
  });
  scene.on('cycle', () => { segs.forEach(s => { s.classList.remove('is-done'); s.querySelector('b').style.width = '0%'; }); });
  scene.on('playing', (p) => { playBtn.textContent = p ? 'PAUSE' : 'PLAY'; playBtn.setAttribute('aria-pressed', String(p)); });
  scene.on('select', (sel) => {
    nodesEl.querySelectorAll('.sl-node').forEach(b => {
      const on = sel && b.dataset.id === sel.id; b.classList.toggle('is-active', on); if (on) b.setAttribute('aria-pressed', 'true'); else b.removeAttribute('aria-pressed');
    });
  });
  scene.on('tick', ({ tIn, stageIndex }) => {
    scrubEl.value = String(Math.round(tIn));
    const st = STAGES[stageIndex]; const local = tIn - STAGES.slice(0, stageIndex).reduce((s, x) => s + x.dwell, 0);
    segs[stageIndex].querySelector('b').style.width = Math.min(100, (local / st.dwell) * 100) + '%';
    metricDefs.forEach(m => { m.el.textContent = m.fn(tIn); });
  });
  scene.on('contextlost', () => { rail.classList.add('sl-scene-lost'); });
  scene.on('contextrestored', () => { rail.classList.remove('sl-scene-lost'); });

  /* initial paint */
  const st0 = scene.getState();
  segs[st0.stageIndex].classList.add('is-active');
  EVENTS.slice(0, 1).forEach(appendEvent);
  return { rail, scene };
}
