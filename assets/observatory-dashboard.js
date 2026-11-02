/* observatory-dashboard.js — Phase B additive Observatory engineering rail.
   Attaches to the EXISTING DOM control plane; never touches the scene chunk.
   All telemetry SIMULATED. Educational prototype — no AWS connectivity. */

const EDGES = [
  ['internet','route53'], ['route53','alb'], ['alb','api'], ['api','compute'],
  ['compute','rds'], ['compute','s3'], ['iam','compute'], ['iam','rds'],
  ['deploy','compute'], ['compute','cloudwatch'], ['rds','cloudwatch']
];
const NODE_LABEL = {
  internet:'INTERNET', route53:'ROUTE 53', alb:'LOAD BALANCER', api:'API / INGRESS',
  compute:'COMPUTE', rds:'RDS', s3:'S3', iam:'IAM', cloudwatch:'CLOUDWATCH', deploy:'DEPLOYMENT'
};

/* Scenario scripts — deterministic event timelines (t ms, type, node, text). */
const SCENARIOS = {
  degrade: { name:'RESOURCE DEGRADATION', events:[
    [0,    'METRIC_DRIFT',  'rds',        'RDS p99 read latency rising above baseline (SIMULATED).'],
    [1500, 'ALARM',         'cloudwatch', 'CloudWatch latency alarm enters ALARM state (SIMULATED).'],
    [3000, 'DIAGNOSIS',     'compute',    'Connection saturation flagged on the compute fleet (SIMULATED).'],
    [4500, 'MITIGATION',    'rds',        'Read traffic shifted toward a replica; pool limits tuned (simulated runbook step).'],
    [6000, 'RECOVERY',      'rds',        'Latency returns to baseline; alarm returns to OK (SIMULATED).']
  ]},
  disrupt: { name:'SERVICE DISRUPTION', events:[
    [0,    'HEALTH_CHECK',  'alb',        'Load balancer reports failing health checks on one target (SIMULATED).'],
    [1500, 'ERROR_RATE',    'api',        'API 5xx error rate spikes above threshold (SIMULATED).'],
    [3000, 'ALARM',         'cloudwatch', 'Availability alarm paged (SIMULATED).'],
    [4500, 'FAILOVER',      'alb',        'Unhealthy target deregistered; traffic drained (simulated recovery step).'],
    [6000, 'RESTORED',      'api',        'Error rate normalises; service healthy (SIMULATED).']
  ]},
  scale: { name:'SCALING EVENT', events:[
    [0,    'TRAFFIC_SURGE', 'internet',   'Inbound traffic rises sharply (SIMULATED load profile).'],
    [1500, 'TARGET_UP',     'alb',        'Load balancer target count increases (SIMULATED).'],
    [3000, 'SCALE_OUT',     'compute',    'Auto scaling adds compute capacity (SIMULATED).'],
    [4500, 'WATCH',         'rds',        'RDS connection utilisation watched during scale-out (SIMULATED).'],
    [6000, 'STEADY_STATE',  'cloudwatch', 'Fleet reaches new steady state; metrics level (SIMULATED).']
  ]},
  observe: { name:'OBSERVABILITY EVENT', events:[
    [0,    'CONFIG_CHANGE', 'cloudwatch', 'New custom metric stream registered (SIMULATED).'],
    [1500, 'INSTRUMENT',    'compute',     'Application instrumented to emit the new metric (SIMULATED).'],
    [3000, 'DASHBOARD',     'cloudwatch', 'Operational dashboard extended with the new signal (SIMULATED).'],
    [4500, 'ALARM_TUNE',    'iam',        'Alarm thresholds recalibrated; permissions reviewed (SIMULATED).'],
    [6000, 'STEADY_STATE',  'cloudwatch', 'Observability baseline updated (SIMULATED).']
  ]}
};

const DEPLOY_STEPS = [
  [0,    'PIPELINE',  'deploy',    'Deployment pipeline starts a new revision (SIMULATED).'],
  [1500, 'HEALTH',    'compute',   'New revision passes health verification on the fleet (SIMULATED).'],
  [3000, 'ROLLOUT',   'alb',       'Traffic gradually shifted to the new revision (SIMULATED).'],
  [4500, 'OBSERVE',   'cloudwatch','Post-deploy metrics watched for regression (SIMULATED).'],
  [6000, 'COMPLETE',  'deploy',    'Deployment marked complete; revision recorded (SIMULATED).']
];

(function init() {
  const shell = document.querySelector('[data-aws-architecture]');
  if (!shell) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- injected styles (champagne/amber identity) ---- */
  const css = document.createElement('style');
  css.textContent = `
  .obs-rail{grid-column:1/-1;grid-row:3;margin:4px 0 0;padding:18px 20px 16px;border:1px solid rgba(211,189,138,.24);background:#12100d}
  .obs-rail-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
  .obs-rail-head h2{margin:0;color:#eee3d1;font:600 11px var(--mono);letter-spacing:.16em}
  .obs-sim-chip{padding:3px 8px;border:1px solid rgba(211,189,138,.45);color:#d3bd8a;font:6.5px var(--mono);letter-spacing:.13em}
  .obs-scenarios{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
  .obs-scn{min-height:38px;padding:0 14px;border:1px solid rgba(211,189,138,.22);background:transparent;color:#c9b98e;font:7.5px var(--mono);letter-spacing:.1em;cursor:pointer;transition:color .2s,border-color .2s,background .2s}
  .obs-scn:hover{color:#f0e3c5;border-color:rgba(211,189,138,.6)}
  .obs-scn.is-active{background:rgba(211,189,138,.12);border-color:#d3bd8a;color:#f0e3c5}
  .obs-scn:focus-visible{outline:1px solid #d3bd8a;outline-offset:2px}
  .obs-deploy{display:flex;gap:8px;align-items:center;margin-bottom:14px}
  .obs-deploy>span{color:#8e897d;font:6.5px var(--mono);letter-spacing:.13em}
  .obs-cols{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.4fr);gap:18px}
  .obs-deps{display:grid;gap:5px;align-content:start}
  .obs-deps h3,.obs-metrics h3,.obs-timeline h3{margin:0 0 7px;color:#8e897d;font:6.5px var(--mono);letter-spacing:.15em}
  .obs-dep{display:flex;justify-content:space-between;gap:8px;padding:7px 9px;border:1px solid rgba(211,189,138,.14);background:rgba(211,189,138,.03);color:#c9b98e;font:7.5px var(--mono);letter-spacing:.06em;text-align:left}
  .obs-dep b{color:#d3bd8a;font-weight:500}
  .obs-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .obs-metrics h3{grid-column:1/-1}
  .obs-metric{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 9px;border-top:1px solid rgba(211,189,138,.28);background:rgba(211,189,138,.03);font:7.5px var(--mono)}
  .obs-metric span{color:#9a948a;letter-spacing:.08em}
  .obs-metric b{color:#eee3d1;font-weight:500}
  .obs-metric em{color:#d3bd8a;font:5.5px var(--mono);letter-spacing:.12em;font-style:normal}
  .obs-timeline ol{list-style:none;margin:0;padding:0;max-height:210px;overflow-y:auto;border-top:1px solid rgba(211,189,138,.2);scrollbar-width:thin;scrollbar-color:#4a4438 transparent}
  .obs-evt button{display:grid;grid-template-columns:56px 1fr;gap:2px 10px;width:100%;padding:7px 2px;border:0;border-bottom:1px solid rgba(211,189,138,.09);background:transparent;text-align:left;cursor:pointer}
  .obs-evt button:hover{background:rgba(211,189,138,.06)}
  .obs-evt button:focus-visible{outline:1px solid #d3bd8a;outline-offset:-1px}
  .obs-evt i{color:#6b685f;font:6.5px var(--mono)}
  .obs-evt b{color:#d3bd8a;font:6.5px var(--mono);letter-spacing:.08em;font-weight:500}
  .obs-evt span{grid-column:2;color:#c4beb2;font:9.5px/1.5 var(--sans)}
  .obs-evt em{grid-column:2;color:#858177;font:5.5px var(--mono);letter-spacing:.12em;font-style:normal}
  .obs-evt{border-left:2px solid transparent}
  .obs-evt.is-degrade{border-left-color:#ffb27a}.obs-evt.is-degrade b{color:#ffb27a}
  .obs-evt.is-disrupt{border-left-color:#ff8a7a}.obs-evt.is-disrupt b{color:#ff8a7a}
  .obs-evt.is-scale{border-left-color:#7fc4ff}.obs-evt.is-scale b{color:#7fc4ff}
  .obs-evt.is-observe{border-left-color:#d3bd8a}.obs-evt.is-observe b{color:#d3bd8a}
  .obs-evt.is-deploy{border-left-color:#9cbc92}.obs-evt.is-deploy b{color:#9cbc92}
  .obs-ctx-note{margin-top:12px;padding:8px 10px;border:1px solid rgba(255,178,122,.5);color:#ffb27a;font:7px var(--mono);letter-spacing:.1em}
  .obs-ctx-note[hidden]{display:none}
  @media(max-width:1000px){.obs-cols{grid-template-columns:minmax(0,1fr)}.obs-rail{grid-row:auto;margin:4px 0 0}}
  @media(max-width:760px){.obs-metrics{grid-template-columns:minmax(0,1fr)}.obs-rail{margin:4px 0 0}}
  @media(prefers-reduced-motion:reduce){.obs-scn{transition:none}}`;
  document.head.appendChild(css);

  /* ---- rail DOM (inserted after the existing controls) ---- */
  const controls = shell.querySelector('.observatory-controls');
  const rail = document.createElement('div');
  rail.className = 'obs-rail'; rail.setAttribute('aria-label', 'Simulated operations dashboard');
  rail.innerHTML = `
    <div class="obs-rail-head"><h2>OPERATIONS · SIMULATED</h2><span class="obs-sim-chip">ALL TELEMETRY SIMULATED</span></div>
    <div class="obs-scenarios" role="group" aria-label="Simulated scenarios"></div>
    <div class="obs-deploy"><span>DEPLOYMENT SIM</span>
      <button type="button" class="obs-scn" data-deploy="run">RUN</button>
      <button type="button" class="obs-scn" data-deploy="step">STEP</button>
      <button type="button" class="obs-scn" data-deploy="reset">RESET</button>
    </div>
    <div class="obs-cols">
      <div class="obs-deps"><h3>DEPENDENCIES · SELECTED COMPONENT</h3><div data-obs-deps></div></div>
      <div class="obs-timeline"><h3>OPERATIONAL EVENT TIMELINE</h3><ol data-obs-timeline></ol></div>
    </div>
    <div class="obs-metrics" data-obs-metrics><h3>COMPONENT METRICS (SIMULATED)</h3></div>
    <div class="obs-ctx-note" data-obs-ctx hidden>3D CONTEXT INTERRUPTED — THE DASHBOARD REMAINS ACTIVE · RELOAD TO RESTORE THE 3D VIEW</div>`;
  controls.after(rail);

  const depsEl = rail.querySelector('[data-obs-deps]');
  const timelineEl = rail.querySelector('[data-obs-timeline]');
  const metricsEl = rail.querySelector('[data-obs-metrics]');
  const scenariosEl = rail.querySelector('.obs-scenarios');

  /* ---- dependency exploration (listens to existing node selection) ---- */
  let currentSelection = 'compute';
  function renderDeps(id) {
    const outs = EDGES.filter(e => e[0] === id); const ins = EDGES.filter(e => e[1] === id);
    depsEl.innerHTML = '';
    if (!outs.length && !ins.length) { depsEl.innerHTML = '<div class="obs-dep"><span>NO DIRECT DEPENDENCIES IN THIS MODEL</span></div>'; return; }
    ins.forEach(([f, t]) => { const d = document.createElement('button'); d.type = 'button'; d.className = 'obs-dep'; d.innerHTML = `<b>${NODE_LABEL[f]}</b><span>→ ${NODE_LABEL[t]}</span>`; d.addEventListener('click', () => selectNode(f)); depsEl.appendChild(d); });
    outs.forEach(([f, t]) => { const d = document.createElement('button'); d.type = 'button'; d.className = 'obs-dep'; d.innerHTML = `<span>${NODE_LABEL[f]} →</span><b>${NODE_LABEL[t]}</b>`; d.addEventListener('click', () => selectNode(t)); depsEl.appendChild(d); });
  }
  function selectNode(id) { const b = shell.querySelector(`[data-aws-node="${id}"]`); if (b) b.click(); }
  shell.querySelector('.aws-node-list').addEventListener('click', e => {
    const b = e.target.closest('[data-aws-node]'); if (!b) return;
    currentSelection = b.dataset.awsNode; renderDeps(currentSelection); renderMetrics(currentSelection);
  });
  function renderMetrics(id) {
    metricsEl.querySelectorAll('.obs-metric').forEach(m => m.remove());
    const defs = {
      latency:['P99 LATENCY', ['18ms','31ms','9ms','12ms','44ms','7ms','9ms','2ms','15ms','—']],
      errors:['ERROR RATE', ['0.0%','0.0%','0.4%','0.1%','0.0%','0.0%','0.0%','0.0%','0.2%','—']],
      load:['THROUGHPUT', ['1.2k rps','860 rps','1.1k rps','940 rps','1.0k rps','210 qps','380 req/s','—','1.0k ev','—']]
    };
    const order = Object.keys(NODE_LABEL); const idx = order.indexOf(id);
    Object.entries(defs).forEach(([k, [label, vals]]) => {
      const m = document.createElement('div'); m.className = 'obs-metric';
      m.innerHTML = `<span>${NODE_LABEL[id]} · ${label}</span><b>${vals[idx] ?? '—'}</b><em>SIMULATED</em>`;
      metricsEl.appendChild(m);
    });
  }

  /* ---- timeline ---- */
  function addEvent(e, scenario) {
    const li = document.createElement('li'); li.className = 'obs-evt' + (scenario ? ' is-' + scenario : '');
    li.innerHTML = `<button type="button"><i>t+${(e[0] / 1000).toFixed(1)}s</i><b>${e[1]}</b><span>${e[2] ? '[' + NODE_LABEL[e[2]] + '] ' : ''}${e[3]}</span><em>SIMULATED</em></button>`;
    li.querySelector('button').addEventListener('click', () => { if (e[2]) selectNode(e[2]); });
    timelineEl.appendChild(li); timelineEl.scrollTop = timelineEl.scrollHeight;
  }
  function clearTimeline() { timelineEl.innerHTML = ''; }

  /* ---- scenario engine (deterministic; pauses under reduced motion replay instantly) ---- */
  let timer = 0, scenarioName = null, queue = [], scenarioButtons = [];
  Object.entries(SCENARIOS).forEach(([key, scn]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'obs-scn'; b.textContent = scn.name;
    b.addEventListener('click', () => runScenario(key));
    scenariosEl.appendChild(b); scenarioButtons.push([key, b]);
  });
  function stopScenario() { if (timer) { clearInterval(timer); timer = 0; } queue = []; scenarioButtons.forEach(([k, b]) => b.classList.remove('is-active')); }
  function resetDeploy() { deployStep = 0; deployRunning = false; if (deployTimer) { clearInterval(deployTimer); deployTimer = 0; } }
  function runScenario(key) {
    stopScenario(); resetDeploy(); scenarioName = key; clearTimeline();
    scenarioButtons.find(([k]) => k === key)[1].classList.add('is-active');
    const evts = SCENARIOS[key].events;
    if (reduced) { evts.forEach(e => addEvent(e, key)); if (evts[0][2]) selectNode(evts[0][2]); return; }
    addEvent(evts[0], key); if (evts[0][2]) selectNode(evts[0][2]);
    let i = 1;
    timer = setInterval(() => {
      if (i >= evts.length) { clearInterval(timer); timer = 0; return; }
      addEvent(evts[i], key);
      if (evts[i][2]) selectNode(evts[i][2]);  /* sync 3D emphasis with the timeline */
      i++;
    }, 1500);
  }

  /* ---- deployment simulation ---- */
  let deployStep = 0, deployRunning = false, deployTimer = 0;
  rail.querySelectorAll('[data-deploy]').forEach(b => b.addEventListener('click', () => {
    const mode = b.dataset.deploy;
    if (mode === 'reset') { stopScenario(); scenarioName = null; resetDeploy(); clearTimeline(); return; }
    if (mode === 'step') {
      if (deployStep >= DEPLOY_STEPS.length) deployStep = 0;
      stopScenario(); scenarioName = null;
      addEvent(DEPLOY_STEPS[deployStep], 'deploy');
      const n = DEPLOY_STEPS[deployStep][2]; if (n) selectNode(n);
      deployStep++;
    }
    if (mode === 'run') {
      if (deployRunning) return;
      stopScenario(); scenarioName = null;
      deployRunning = true; deployStep = 0; clearTimeline();
      if (reduced) { DEPLOY_STEPS.forEach(e => addEvent(e, 'deploy')); selectNode('deploy'); deployRunning = false; return; }
      deployTimer = setInterval(() => {
        if (deployStep >= DEPLOY_STEPS.length) { clearInterval(deployTimer); deployTimer = 0; deployRunning = false; return; }
        addEvent(DEPLOY_STEPS[deployStep], 'deploy');
        const n = DEPLOY_STEPS[deployStep][2]; if (n) selectNode(n);
        deployStep++;
      }, 1500);
    }
  }));

  /* ---- WebGL context-loss wrapper (graceful; scene chunk untouched) ---- */
  const canvas = shell.querySelector('[data-aws-scene]');
  const ctxNote = rail.querySelector('[data-obs-ctx]');
  canvas.addEventListener('webglcontextlost', e => {
    ctxNote.hidden = false;
    shell.querySelector('[data-aws-fallback]').hidden = false;
    shell.dataset.sceneState = 'fallback';
    addEvent([Date.now(), 'CONTEXT_LOST', null, 'WebGL context interrupted — dashboard remains active (SIMULATED environment).'], 'system');
  }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    ctxNote.hidden = true;
    shell.querySelector('[data-aws-fallback]').hidden = true;
    shell.dataset.sceneState = 'ready';
  }, false);

  /* ---- initial state ---- */
  renderDeps(currentSelection); renderMetrics(currentSelection);
  window.__obsRail = { get selection() { return currentSelection; }, get scenario() { return scenarioName; }, get timelineCount() { return timelineEl.children.length; } };
})();
