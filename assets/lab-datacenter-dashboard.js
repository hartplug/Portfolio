/* lab-datacenter-dashboard.js — Phase D2 command-centre dashboard.
 * Left: modes + mode body. Right: inspector metrics. Bottom: lifecycle stages,
 * flow controls, metric cards, mini topology. All values SIMULATED.
 */
export function createDashboard(doc, scene) {
  const PHYS = scene.PHYS, LOGI = scene.LOGI, ALL = scene.COMPONENTS, EDGES = scene.EDGES;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = id => ALL.find(c => c.id === id);
  const label = id => byId(id).title;
  const $ = sel => doc.querySelector(sel);

  const EVENTS = [
    { t: 0, id: 'user', stage: 'RECEIVED', ev: 'REQUEST_IN', txt: 'Request initiated at the user station.' },
    { t: 1200, id: 'api', stage: 'INVOKED', ev: 'API_AUTHORIZE', txt: 'API Gateway validates and authorizes.' },
    { t: 2300, id: 'lambda', stage: 'PROCESSING', ev: 'LAMBDA_INVOKE', txt: 'Function invoked on warm compute.' },
    { t: 3300, id: 'ddb', stage: 'PROCESSING', ev: 'DDB_WRITE', txt: 'Item written to DynamoDB.' },
    { t: 3500, id: 's3', stage: 'PROCESSING', ev: 'S3_PUT', txt: 'Result object stored in S3.' },
    { t: 3700, id: 'sns', stage: 'PROCESSING', ev: 'SNS_PUBLISH', txt: 'Notification published to SNS.' },
    { t: 4700, id: 'cw', stage: 'TELEMETRY', ev: 'METRICS_EMIT', txt: 'Telemetry streams into CloudWatch.' },
    { t: 5600, id: 'lambda', stage: 'COMPLETE', ev: 'RESPONSE_BUILD', txt: 'Response assembled and returned.' },
    { t: 7200, id: 'user', stage: 'COMPLETE', ev: 'RESPONSE_DELIVERED', txt: 'Response delivered to the user station.' },
  ];
  const STAGES = ['RECEIVED', 'INVOKED', 'PROCESSING', 'TELEMETRY', 'COMPLETE'];

  const SCENARIOS = {
    degrade:  { name: 'RESOURCE DEGRADATION', cls: 'degrade', events: [
      [0,'LATENCY_RISE','ddb','P99 latency climbs near capacity.'],[1500,'ALARM','cw','Latency alarm breaches.'],
      [3000,'THROTTLE','ddb','Requests throttled; retries rise.'],[4500,'SCALE_UP','ddb','Capacity increased.'],
      [6000,'RECOVERED','ddb','Latency back to baseline.'] ] },
    disrupt:  { name: 'SERVICE DISRUPTION', cls: 'disrupt', events: [
      [0,'ERROR_SPIKE','lambda','Runtime fault raises error rate.'],[1500,'ALARM','cw','Error-rate alarm raised.'],
      [3000,'FAILOVER','lb','Traffic drained from unhealthy targets.'],[4500,'RESTART','lambda','Functions move to healthy capacity.'],
      [6000,'RESTORED','lambda','Error rate normal again.'] ] },
    scale:    { name: 'SCALING EVENT', cls: 'scale', events: [
      [0,'TRAFFIC_SURGE','user','Traffic burst arrives.'],[1500,'TARGET_UP','lb','LB targets grow.'],
      [3000,'CONCURRENCY','lambda','Concurrency scales out.'],[4500,'WATCH','cw','Concurrency tracked.'],
      [6000,'STEADY_STATE','lambda','Concurrency settles.'] ] },
    observe:  { name: 'OBSERVABILITY EVENT', cls: 'observe', events: [
      [0,'TRACE_SAMPLE','api','Trace sampled at the gateway.'],[1500,'SPAN_CHAIN','lambda','Spans chain through the runtime.'],
      [3000,'LOG_STREAM','sns','Event delivery logged.'],[4500,'DASHBOARD','cw','Ops displays update.'],
      [6000,'BASELINE','cw','Telemetry steady again.'] ] },
    recover:   { name: 'RECOVERY DRILL', cls: 'recover', events: [
      [0,'DRILL_START','cw','Scheduled recovery drill begins.'],[1500,'DEGRADE_SIM','ddb','Simulated dependency slows.'],
      [3000,'CIRCUIT_OPEN','api','Gateway sheds load.'],[4500,'BACKUP_PATH','lb','Traffic shifts to recovery path.'],
      [6000,'DRILL_PASS','user','Drill passes; service resumes.'] ] },
  };

  const PROFILES = {
    user:{thru:'940 rps',lat:'—',err:'0.1%',util:'—',conc:'—',cost:'client-side',note:'Bursty client traffic pattern.'},
    dns:{thru:'12k q/s',lat:'18 ms',err:'0.01%',util:'—',conc:'—',cost:'≈ $0.40 /M queries',note:'Anycast resolution.'},
    lb:{thru:'940 rps',lat:'1.1 ms',err:'0.02%',util:'—',conc:'—',cost:'≈ $18 /mo',note:'Least-outstanding-requests routing.'},
    api:{thru:'820 rps',lat:'12 ms',err:'0.05%',util:'—',conc:'—',cost:'≈ $0.90 /M',note:'Caching cuts origin calls ~35%.'},
    lambda:{thru:'800 inv/s',lat:'42 ms',err:'0.09%',util:'68%',conc:'1,240',cost:'≈ $0.20 /M GB-s',note:'Warm starts ~85%.'},
    ddb:{thru:'800 WCU/s',lat:'6 ms',err:'0.01%',util:'61%',conc:'—',cost:'≈ $1.25 /M WCU',note:'On-demand capacity.'},
    s3:{thru:'210 obj/s',lat:'24 ms',err:'—',util:'—',conc:'—',cost:'≈ $0.023 /GB·mo',note:'Lifecycle policies applied.'},
    sns:{thru:'600 msg/s',lat:'9 ms',err:'0.03%',util:'—',conc:'—',cost:'≈ $0.50 /M pub',note:'Fan-out to subscribers.'},
    cw:{thru:'40k metrics',lat:'—',err:'—',util:'—',conc:'—',cost:'≈ $9.50 /mo',note:'1-minute alarm windows.'},
    aisle:{thru:'—',lat:'—',err:'—',util:'—',conc:'—',cost:'structural',note:'Raised platform deck.'},
    computeA:{thru:'—',lat:'—',err:'—',util:'68%',conc:'—',cost:'≈ $610 /mo rack',note:'Illustrative compute layer.'},
    computeB:{thru:'—',lat:'—',err:'—',util:'37%',conc:'—',cost:'≈ $610 /mo rack',note:'Spare capacity partner.'},
    storage:{thru:'—',lat:'—',err:'—',util:'54%',conc:'—',cost:'≈ $420 /mo rack',note:'Drives + arrays, simulated.'},
    network:{thru:'9.4 Gb/s',lat:'0.4 ms',err:'—',util:'52%',conc:'—',cost:'≈ $80 /mo',note:'Redundant fibre spine.'},
    power:{thru:'—',lat:'—',err:'—',util:'41%',conc:'—',cost:'≈ $120 /mo',note:'N+1 UPS; generator feed.'},
    cooling:{thru:'—',lat:'—',err:'—',util:'49%',conc:'—',cost:'≈ $95 /mo',note:'Airflow simulated.'},
    gate:{thru:'—',lat:'—',err:'—',util:'—',conc:'—',cost:'structural',note:'Gateway structure.'},
    hud:{thru:'—',lat:'—',err:'—',util:'—',conc:'—',cost:'≈ $25 /mo',note:'Ops displays (simulated feed).'},
    cloud:{thru:'—',lat:'—',err:'—',util:'—',conc:'—',cost:'≈ $34 /mo',note:'Aggregate simulated estimate.'},
  };

  const nodesEl = $('[data-dc-nodes]'), traceEl = $('[data-dc-trace]');
  const nodegrid = $('[data-dc-nodegrid]'), archDetail = $('[data-dc-arch-detail]');
  const metricsEl = $('[data-dc-metrics]'), costblock = $('[data-dc-costblock]');
  const scnEl = $('[data-dc-scenarios]'), failTrace = $('[data-dc-fail-trace]');
  const scrub = $('[data-dc-scrub]'), playBtn = $('[data-dc-play]');
  const phaseLabel = $('[data-dc-phase-label]'), cycleLabel = $('[data-dc-cycle]');
  const flowtime = $('[data-dc-flowtime]');
  const cards = { thru: $('[data-dc-card="thru"]'), lat: $('[data-dc-card="lat"]'), err: $('[data-dc-card="err"]'), inv: $('[data-dc-card="inv"]') };
  const trends = { thru: $('[data-dc-card-trend="thru"]'), lat: $('[data-dc-card-trend="lat"]'), err: $('[data-dc-card-trend="err"]'), inv: $('[data-dc-card-trend="inv"]') };
  const lifecycleEl = $('[data-dc-lifecycle]'), topoEl = $('[data-dc-topo]');

  /* component buttons */
  const addNodeBtn = (parent, c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dc-node'; b.dataset.comp = c.id;
    b.innerHTML = `<span>${c.title}</span><small>${c.off ? 'LOGICAL' : c.cat.replace('PHYSICAL · ', '')}</small>`;
    b.addEventListener('click', () => scene.select(c.id));
    parent.append(b);
  };
  ALL.forEach(c => addNodeBtn(nodesEl, c));
  nodegrid.innerHTML = '<h4 class="dc-grid-head">PHYSICAL INFRASTRUCTURE</h4>';
  PHYS.forEach(c => addNodeBtn(nodegrid, c));
  const lh = document.createElement('h4'); lh.className = 'dc-grid-head dc-grid-head-logi';
  lh.textContent = 'LOGICAL AWS SERVICES · ILLUSTRATIVE'; nodegrid.append(lh);
  LOGI.forEach(c => addNodeBtn(nodegrid, c));

  /* lifecycle stage chips */
  STAGES.forEach(st => {
    const s = document.createElement('span');
    s.className = 'dc-stage-chip'; s.dataset.stage = st; s.textContent = st;
    lifecycleEl.append(s);
  });

  /* mini topology */
  const TOPO_NODES = ['user', 'api', 'lambda', 'ddb', 's3', 'sns', 'cw'];
  TOPO_NODES.forEach(id => {
    const n = document.createElement('span');
    n.className = 'dc-topo-node'; n.dataset.topo = id; n.textContent = label(id).split(' ')[0];
    n.title = label(id);
    n.addEventListener('click', () => scene.select(id));
    topoEl.append(n);
  });
  function refreshTopo(activeIds) {
    topoEl.querySelectorAll('.dc-topo-node').forEach(n =>
      n.classList.toggle('is-active', activeIds.includes(n.dataset.topo)));
  }

  /* trace rows */
  const rows = EVENTS.map(e => ({ ...e, el: null }));
  rows.forEach(r => {
    const li = document.createElement('li');
    li.className = 'dc-evt';
    li.innerHTML = `<button type="button"><i>t+${(r.t / 1000).toFixed(1)}s</i><b>${r.ev}</b><span>[${label(r.id)}] ${r.txt}</span><em>SIMULATED</em></button>`;
    li.querySelector('button').addEventListener('click', () => scene.select(r.id));
    traceEl.append(li); r.el = li;
  });

  /* metric cards — deterministic functions of lifecycle stage */
  function cardVals(tIn) {
    const st = tIn < 1200 ? 'r' : tIn < 2300 ? 'i' : tIn < 4700 ? 'p' : tIn < 7200 ? 't' : 'c';
    return {
      thru: { r: '112', i: '486', p: '940', t: '731', c: '410' }[st],
      lat:  { r: '18 ms', i: '31 ms', p: '128 ms', t: '96 ms', c: '54 ms' }[st],
      err:  { r: '0.0%', i: '0.0%', p: '0.1%', t: '0.1%', c: '0.0%' }[st],
      inv:  { r: '0', i: '12', p: '1,240', t: '980', c: '310' }[st],
    };
  }
  function refreshBand() {
    const tIn = scene.state.tIn;
    scrub.value = tIn;
    const v = cardVals(tIn);
    cards.thru.textContent = v.thru; cards.lat.textContent = v.lat;
    cards.err.textContent = v.err; cards.inv.textContent = v.inv;
    trends.thru.textContent = '▲ SIMULATED'; trends.lat.textContent = '▲ SIMULATED';
    trends.err.textContent = '▲ SIMULATED'; trends.inv.textContent = '▲ SIMULATED';
    const activeStages = [...new Set(rows.filter(r => r.t <= tIn).map(r => r.stage))];
    lifecycleEl.querySelectorAll('.dc-stage-chip').forEach(ch =>
      ch.classList.toggle('is-active', activeStages.includes(ch.dataset.stage)));
    const activeIds = rows.filter(r => r.t <= tIn && r.t >= tIn - 2200).map(r => r.id);
    refreshTopo(activeIds);
    const mm = (tIn / 1000);
    flowtime.textContent = `00:0${Math.floor(mm)}.${Math.floor((mm % 1) * 10)} / 00:07.5`;
    if (phaseLabel) phaseLabel.textContent = 'LIFECYCLE — ' + (scene.state.phase || 'IDLE');
    if (cycleLabel) cycleLabel.textContent = 'CYCLE ' + String(scene.state.cycle).padStart(2, '0');
    rows.forEach(r => r.el.classList.toggle('shown', r.t <= tIn));
    nodesEl.querySelectorAll('.dc-node').forEach(b => b.classList.toggle('is-selected', b.dataset.comp === scene.state.selected));
  }

  playBtn.addEventListener('click', () => {
    const playing = !scene.state.playing;
    playing ? scene.play() : scene.pause();
    playBtn.textContent = playing ? 'PAUSE' : 'PLAY';
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
  });
  $('[data-dc-replay]').addEventListener('click', () => { scene.replay(); playBtn.textContent = 'PAUSE'; playBtn.setAttribute('aria-pressed', 'true'); });
  $('[data-dc-reset-sim]').addEventListener('click', () => { scene.reset(); playBtn.textContent = 'PLAY'; playBtn.setAttribute('aria-pressed', 'false'); });
  scrub.addEventListener('input', () => scene.scrub(+scrub.value));
  const speedSel = $('[data-dc-speed]');
  if (speedSel) speedSel.addEventListener('change', () => scene.setSpeed(+speedSel.value));

  /* modes */
  let mode = 'workflow';
  doc.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => {
    mode = tab.dataset.mode;
    doc.querySelectorAll('[data-mode]').forEach(t2 => { t2.classList.toggle('active', t2 === tab); t2.setAttribute('aria-selected', t2 === tab ? 'true' : 'false'); });
    doc.querySelectorAll('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== mode);
    scene.setLogicalVisible(mode !== 'workflow');
    if (mode === 'failure') stopScenario();
  }));

  /* B: architecture explorer */
  function refreshB() {
    const sel = scene.state.selected;
    nodegrid.querySelectorAll('.dc-node').forEach(b => b.classList.toggle('is-selected', b.dataset.comp === sel));
    if (!sel) { archDetail.innerHTML = '<span class="dc-arch-empty">No component selected.</span>'; return; }
    const c = byId(sel); const isLogi = !!c.off;
    let rel = '';
    if (isLogi) {
      const deps = EDGES.filter(e => e[0] === sel).map(e => e[1]).concat(EDGES.filter(e => e[1] === sel).map(e => e[0]));
      rel = `<h4>EXECUTES ON (ILLUSTRATIVE)</h4><ul class="dc-deps">
             <li><button type="button" data-jump="${c.host}"><b>⌂</b> ${byId(c.host).title}</button></li></ul>
             <h4>CONNECTIONS</h4><ul class="dc-deps">${
             deps.map(d => `<li><button type="button" data-jump="${d}"><b>→</b> ${label(d)}</button></li>`).join('') ||
             '<li><span class="dc-arch-empty">None.</span></li>'}</ul>`;
    } else {
      const hosted = c.hosts || [];
      const deps = EDGES.filter(e => e[0] === sel || e[1] === sel);
      rel = `<h4>${hosted.length ? 'HOSTS (ILLUSTRATIVE)' : 'PHYSICAL'}</h4><ul class="dc-deps">${
             hosted.map(h => `<li><button type="button" data-jump="${h}"><b>L</b> ${byId(h).title}</button></li>`).join('') ||
             '<li><span class="dc-arch-empty">Hosts no services directly.</span></li>'}</ul>` +
             (deps.length ? `<h4>ADJACENT SERVICES</h4><ul class="dc-deps">${deps.map(e => {
               const o = e[0] === sel ? e[1] : e[0];
               return `<li><button type="button" data-jump="${o}"><b>→</b> ${label(o)}</button></li>`; }).join('')}</ul>` : '') +
             `<p class="dc-arch-note">${scene.DIS}</p>`;
    }
    archDetail.innerHTML = `<strong>${c.title}</strong><span class="dc-arch-cat">${c.cat}</span><p>${c.role}</p>${rel}`;
    archDetail.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => scene.select(b.dataset.jump)));
  }

  /* C: failure scenarios */
  let scnTimer = 0, scnStep = 0, deployStep = 0, deployTimer = 0;
  const scnButtons = [];
  Object.entries(SCENARIOS).forEach(([key, s]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dc-scn is-' + s.cls; b.textContent = s.name;
    b.addEventListener('click', () => runScenario(key));
    scnEl.append(b); scnButtons.push([key, b]);
  });
  function addFailRow(e, cls) {
    const li = document.createElement('li'); li.className = 'dc-evt is-' + cls;
    li.innerHTML = `<button type="button"><i>t+${(e[0] / 1000).toFixed(1)}s</i><b>${e[1]}</b><span>[${label(e[2])}] ${e[3]}</span><em>SIMULATED</em></button>`;
    li.querySelector('button').addEventListener('click', () => scene.select(e[2]));
    failTrace.append(li); failTrace.scrollTop = failTrace.scrollHeight;
  }
  function stopScenario() { if (scnTimer) { clearInterval(scnTimer); scnTimer = 0; } scnStep = 0;
    scnButtons.forEach(([, b]) => b.classList.remove('is-active')); }
  function runScenario(key) {
    stopScenario(); scene.pause();
    const s = SCENARIOS[key];
    scnButtons.find(([k]) => k === key)[1].classList.add('is-active');
    failTrace.innerHTML = '';
    if (reduced) { s.events.forEach(e => addFailRow(e, s.cls)); scene.select(s.events[0][2]); return; }
    addFailRow(s.events[0], s.cls); scene.select(s.events[0][2]); scnStep = 1;
    scnTimer = setInterval(() => {
      if (scnStep >= s.events.length) { clearInterval(scnTimer); scnTimer = 0; return; }
      const e = s.events[scnStep]; addFailRow(e, s.cls); scene.select(e[2]); scnStep++;
    }, 1500);
  }
  $('[data-dc-fail-run]').addEventListener('click', () => {
    stopScenario(); if (deployTimer) return;
    const drill = SCENARIOS.recover.events; deployStep = 0; failTrace.innerHTML = '';
    if (reduced) { drill.forEach(e => addFailRow(e, 'recover')); scene.select('cw'); return; }
    deployTimer = setInterval(() => {
      if (deployStep >= drill.length) { clearInterval(deployTimer); deployTimer = 0; return; }
      const e = drill[deployStep]; addFailRow(e, 'recover'); scene.select(e[2]); deployStep++;
    }, 1500);
  });
  $('[data-dc-fail-step]').addEventListener('click', () => {
    stopScenario();
    const drill = SCENARIOS.recover.events;
    if (deployStep >= drill.length) deployStep = 0;
    if (!failTrace.children.length || !failTrace.lastElementChild.classList.contains('is-recover')) { failTrace.innerHTML = ''; deployStep = 0; }
    const e = drill[deployStep]; addFailRow(e, 'recover'); scene.select(e[2]); deployStep++;
  });
  $('[data-dc-fail-reset]').addEventListener('click', () => {
    stopScenario(); if (deployTimer) { clearInterval(deployTimer); deployTimer = 0; }
    deployStep = 0; failTrace.innerHTML = ''; scene.select(null);
  });

  /* D: cost & performance */
  function refreshD() {
    const sel = scene.state.selected;
    const p = PROFILES[sel || 'cloud'];
    const c = byId(sel || 'cloud');
    metricsEl.innerHTML = `<h3>SIMULATED PROFILE — ${c.title}</h3>` +
      [['THROUGHPUT', p.thru], ['P99 LATENCY', p.lat], ['ERROR RATE', p.err], ['UTILIZATION', p.util], ['CONCURRENCY', p.conc]]
        .map(([k, v]) => `<div class="dc-metric"><span>${k}</span><b>${v || '—'}</b></div>`).join('') +
      `<p class="dc-metric-note">${p.note}</p>`;
    costblock.innerHTML = `<h3>ESTIMATED MONTHLY COST <em>· SIMULATED</em></h3>
      <div class="dc-cost-chip"><span>${c.title}</span><b>${p.cost}</b></div>
      <p class="dc-metric-note">Planning figures only — illustrative, not AWS's actual deployment. Validate with the AWS pricing calculator.</p>`;
  }

  let lastSel = undefined;
  setInterval(() => {
    if (mode === 'workflow') refreshBand();
    if (mode === 'arch') refreshB();
    if (mode === 'cost') refreshD();
    if (scene.state.selected !== lastSel) {
      lastSel = scene.state.selected;
      if (mode === 'cost') refreshD();
      if (mode === 'arch') refreshB();
    }
  }, reduced ? 400 : 120);

  return { refreshBand, refreshB, refreshD };
}
