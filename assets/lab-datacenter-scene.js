/* lab-datacenter-scene.js — Phase D2 "Immersive Cloud Infrastructure Command Centre".
 * Elevated three-quarter isometric platform: user station left, gateway, Lambda
 * pedestal, data trio (DynamoDB/S3/SNS), CloudWatch screens, rear cloud hub,
 * COMPUTE/DATA rack-layer flanks, power + cooling at deck edges. Animated beams
 * follow the request lifecycle; service modules illuminate as the request
 * touches them. AWS services are LOGICAL representations within an illustrative
 * physical environment — NOT AWS's actual deployment. Educational prototype —
 * all activity SIMULATED, no real AWS connectivity.
 * Reuses the proven framework: one renderer/loop, shared three.module (1 fetch),
 * adaptive DPR, IO pause, reduced-motion static, context-loss recovery, disposal.
 */
import {
  WebGLRenderer, PerspectiveCamera, Scene, Color, Group, Mesh,
  MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial, BoxGeometry,
  CylinderGeometry, SphereGeometry, PlaneGeometry, TorusGeometry, TubeGeometry,
  CatmullRomCurve3, QuadraticBezierCurve3, Vector2, Vector3, Raycaster, MathUtils,
  PointLight, DirectionalLight, HemisphereLight, AdditiveBlending, DoubleSide,
  ACESFilmicToneMapping, PCFSoftShadowMap, PMREMGenerator
} from './three.module-BbDkOMEo.js';

const CYAN = 0x5fe3ff, AMBER = 0xffb84d, CHAMP = 0xd3bd8a, ICE = 0xbfe9ff;

/* 11 physical facility objects (P11 = cloud visualization anchor) */
const PHYS = [
  { id:'aisle',   title:'PLATFORM & DECK',      cat:'PHYSICAL · ZONE',        p:[ 0.0, 0,  1.0], role:'The raised infrastructure deck — polished floor with etched circuit traces carrying every connection.' },
  { id:'computeA',title:'COMPUTE RACK ROW A',  cat:'PHYSICAL · COMPUTE',    p:[-4.2, 0, -2.6], role:'Rear compute layer: server racks with bezels, blade slots and amber status LEDs.', hosts:['lambda'] },
  { id:'computeB',title:'COMPUTE RACK ROW B',  cat:'PHYSICAL · COMPUTE',    p:[ 4.2, 0, -2.6], role:'Second rear compute layer — the capacity partner that absorbs scaling events.' },
  { id:'storage', title:'STORAGE RACK',        cat:'PHYSICAL · DATA',       p:[ 1.6, 0, -2.8], role:'Drive arrays and storage hardware in the data layer.', hosts:['ddb','s3'] },
  { id:'network', title:'NETWORK PLANT',       cat:'PHYSICAL · NETWORK',    p:[ 0.0, 0,  0.2], role:'Top-of-rack switching, fibre spine and the deck cable channel.', hosts:['dns','lb','sns'] },
  { id:'power',   title:'POWER & UPS',         cat:'PHYSICAL · FACILITIES', p:[-6.3, 0,  2.6], role:'PDU and UPS units at the deck edge — the availability story beneath the platform.' },
  { id:'cooling', title:'COOLING',            cat:'PHYSICAL · FACILITIES', p:[ 6.3, 0,  2.6], role:'Deck-edge cooling unit pushing airflow across the racks.' },
  { id:'gate',    title:'GATEWAY STRUCTURE',   cat:'PHYSICAL · STRUCTURE',  p:[-2.8, 0,  2.0], role:'Champagne-lit gateway frame on the request path.', hosts:['api'] },
  { id:'user',    title:'USER STATION',        cat:'PHYSICAL · CLIENT',     p:[-5.9, 0,  2.4], role:'Client devices on a plinth — where requests originate and responses land.' },
  { id:'hud',     title:'TELEMETRY DISPLAYS',  cat:'PHYSICAL · TELEMETRY',  p:[ 0.9, 0,  4.7], role:'Floating operations screens at the front of the deck.', hosts:['cw'] },
  { id:'cloud',   title:'CLOUD LAYER',         cat:'PLATFORM ANCHOR',       p:[ 0.0, 0, -2.0], role:'The managed platform anchor above the deck — capacity and telemetry streams rain onto the platform.' },
];
/* 8 logical service modules on the deck walkway */
const LOGI = [
  { id:'dns',    title:'DNS / INTERNET ENTRY', cat:'LOGICAL · EDGE',        host:'network',  off:[-4.5, 0.55, 1.1], role:'Name resolution — how the platform is found before any request is routed.' },
  { id:'lb',     title:'LOAD BALANCER',        cat:'LOGICAL · EDGE',        host:'network',  off:[-3.7, 0.55, 1.1], role:'A service across the fabric, not one box: distributes traffic across healthy targets.' },
  { id:'api',    title:'API GATEWAY',          cat:'LOGICAL · INGRESS',     host:'gate',     off:[-2.8, 0.9,  2.0], role:'Authenticates, validates and meters every request before compute is invoked.' },
  { id:'lambda', title:'LAMBDA',               cat:'LOGICAL · APPLICATION', host:'computeA', off:[-1.0, 0.85, 2.2], role:'Serverless function runtime. Scales by platform decision — not by racking more servers.' },
  { id:'ddb',    title:'DYNAMODB',             cat:'LOGICAL · DATA',        host:'storage',  off:[ 1.3, 0.6,  2.6], role:'Managed NoSQL table — items written and read during request processing.' },
  { id:'s3',     title:'S3 STORAGE',           cat:'LOGICAL · DATA',        host:'storage',  off:[ 2.9, 0.55, 2.2], role:'Object storage for the durable artifacts of each request.' },
  { id:'sns',    title:'SNS EVENTS',           cat:'LOGICAL · MESSAGING',   host:'network',  off:[ 2.0, 0.7,  3.8], role:'Event bus on the fabric — fan-out notifications to downstream subscribers.' },
  { id:'cw',     title:'CLOUDWATCH',           cat:'LOGICAL · TELEMETRY',   host:'hud',      off:[ 0.9, 1.25, 4.7], role:'Metrics, logs and alarms — the observability service shown on the screens.' },
];
const ALL = PHYS.concat(LOGI);
const byId = id => ALL.find(c => c.id === id);
const EDGES = [
  ['user','dns'],['dns','lb'],['lb','api'],['api','lambda'],
  ['lambda','ddb'],['lambda','s3'],['lambda','sns'],['ddb','cw'],['s3','cw'],
  ['sns','cw'],['lambda','cw'],['cw','user'],
];

export function createDataCenterScene(stage) {
  const canvas = stage.querySelector('[data-dc-canvas]');
  const labelsEl = stage.querySelector('[data-dc-labels]');
  const insp = stage.querySelector('[data-dc-inspector]');
  const fallback = stage.querySelector('[data-dc-fallback]');
  const resetBtn = stage.querySelector('[data-dc-reset]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const disposables = { mat: [] };
  const listeners = [];
  let dead = false, raf = 0, contextLost = false, visible = true;
  let beamMat = null, logicalVisible = false;

  let renderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { stage.dataset.sceneState = 'fallback'; if (fallback) fallback.hidden = false; return deadAPI(); }
  renderer.setClearColor(0x04070d, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.42;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.outputColorSpace = 'srgb';

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 90);
  stage.dataset.sceneState = 'loading';

  { const pm = new PMREMGenerator(renderer);
    const env = new Scene();
    const mk = (w, h, c, i, x, y, z, ry) => {
      const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: c, side: DoubleSide }));
      m.material.color.multiplyScalar(i); m.position.set(x, y, z); m.rotation.y = ry; env.add(m); };
    mk(14, 5, new Color(0x2a3550), 2.6, 0, 6, -9, 0);
    mk(12, 4, new Color(0x8fa8c8), 1.0, -7, 4, 0, 1.2);
    mk(12, 4, new Color(0x16303d), 2.2, 7, 3, 0, -1.2);
    mk(9, 3, new Color(0xffffff), 2.4, 0, 10, 0, Math.PI / 2);
    scene.environment = pm.fromScene(env, 0.05).texture;
    env.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    pm.dispose(); }

  const M = {
    frame:  new MeshStandardMaterial({ color: 0x5a636e, metalness: 0.9, roughness: 0.3 }),
    shell:  new MeshStandardMaterial({ color: 0x3a424e, metalness: 0.82, roughness: 0.38 }),
    panel:  new MeshStandardMaterial({ color: 0x1c222c, metalness: 0.55, roughness: 0.45 }),
    plinth: new MeshStandardMaterial({ color: 0x333c48, metalness: 0.68, roughness: 0.4 }),
    deck:   new MeshStandardMaterial({ color: 0x0e131c, metalness: 0.8, roughness: 0.2, envMapIntensity: 1.1 }),
    gold:   new MeshStandardMaterial({ color: 0x8a7340, metalness: 0.9, roughness: 0.28, emissive: 0x4a3c20, emissiveIntensity: 0.2 }),
    amber:  new MeshBasicMaterial({ color: AMBER }),
    cyanL:  new MeshBasicMaterial({ color: CYAN }),
    cyanDim:new MeshBasicMaterial({ color: 0x1d4653 }),
    glowC:  new MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false }),
  };
  Object.values(M).forEach(m => disposables.mat.push(m));
  const G = { unit: new BoxGeometry(1, 1, 1), cyl: new CylinderGeometry(1, 1, 1, 20), sph: new SphereGeometry(1, 16, 12), ring: new TorusGeometry(1, 0.05, 8, 40) };
  const box = (mat, w, h, d, x, y, z) => { const m = new Mesh(G.unit, mat); m.scale.set(w, h, d); m.position.set(x, y, z); return m; };

  /* deck */
  {
    const g = new PlaneGeometry(17, 12);
    const floor = new Mesh(g, new MeshStandardMaterial({ color: 0x0a0e16, metalness: 0.85, roughness: 0.16, envMapIntensity: 1.25 }));
    disposables.mat.push(floor.material);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; floor.receiveShadow = true; scene.add(floor);
    const deck = box(M.deck, 13.8, 0.34, 9.2, 0, 0.17, 0.6); deck.receiveShadow = true; deck.castShadow = true; scene.add(deck);
    const trim = box(M.gold, 14.0, 0.05, 9.4, 0, 0.03, 0.6); scene.add(trim);
    const trim2 = box(M.frame, 13.4, 0.06, 8.8, 0, 0.36, 0.6); scene.add(trim2);
    const sg = new PlaneGeometry(13.8, 9.2);
    const grid = new Mesh(sg, new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uC: { value: new Color(0x2e6a86) } },
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vU;uniform vec3 uC;
        void main(){vec2 g=abs(fract(vU*vec2(16.,11.))-.5);float l=min(g.x,g.y);
        float line=smoothstep(.035,.0,l)*.5;float fade=1.0-smoothstep(.25,1.0,abs(vU.y-.5)*2.0);
        gl_FragColor=vec4(uC,line*fade*.5);}`
    }));
    disposables.mat.push(grid.material);
    grid.rotation.x = -Math.PI / 2; grid.position.y = 0.35; scene.add(grid);
    const bg = new PlaneGeometry(40, 22);
    const haze = new Mesh(bg, new MeshBasicMaterial({ color: 0x04070d }));
    disposables.mat.push(haze.material);
    haze.position.set(0, 4, -14); scene.add(haze);
  }

  const pickables = [], compGroups = {}, anchors = {};
  let leds = [], fans = [], sweeps = [], cloudShells = [], ddbPulse = [], coolingShimmer = null, dnsRingDeco = null, moduleGlows = {};

  function rackShell(g, w, h, d, x, y, z, ledPhase) {
    const shell = box(M.shell, w, h, d, x, y + h / 2, z); shell.castShadow = true; shell.receiveShadow = true; g.add(shell);
    g.add(box(M.panel, w * 0.94, h * 0.96, 0.022, x, y + h / 2, z + d / 2 + 0.012));
    const nBays = Math.floor(h / 0.34);
    for (let r = 0; r < nBays; r++) {
      const by = y + 0.24 + r * 0.34;
      const bezel = box(M.frame, w * 0.84, 0.24, 0.018, x, by, z + d / 2 + 0.024); bezel.castShadow = false; g.add(bezel);
      g.add(box(M.panel, w * 0.76, 0.16, 0.014, x, by, z + d / 2 + 0.032));
      g.add(box(M.frame, w * 0.7, 0.022, 0.012, x, by - 0.06, z + d / 2 + 0.036));
      const led = new Mesh(G.sph, M.amber); led.scale.setScalar(0.015);
      led.position.set(x - w * 0.3, by + 0.06, z + d / 2 + 0.04);
      g.add(led); leds.push({ m: led, ph: ledPhase + r * 1.35 + x, bay: true });
      const led2 = new Mesh(G.sph, M.cyanL); led2.scale.setScalar(0.012);
      led2.position.set(x + w * 0.3, by + 0.06, z + d / 2 + 0.04);
      g.add(led2); leds.push({ m: led2, ph: ledPhase + r * 1.35 + 1.1 + x });
    }
    g.add(box(M.shell, w * 0.9, 0.07, d * 0.96, x, y + h - 0.035, z));
    g.add(box(M.frame, 0.05, 0.05, d * 0.7, x + w * 0.28, y + h + 0.03, z));
    g.add(box(M.frame, 0.05, 0.05, d * 0.7, x - w * 0.28, y + h + 0.03, z));
  }

  function comp(id, build) {
    const c = byId(id);
    const g = new Group(); g.position.fromArray(c.p); build(g, c);
    g.traverse(o => { if (o.isMesh) { o.userData.compId = id; pickables.push(o); } });
    compGroups[id] = g; scene.add(g);
  }

  comp('aisle', g => {
    const strip = box(new MeshBasicMaterial({ color: 0x0c1420, transparent: true, opacity: 0.012 }), 12, 0.02, 6.5, 0, 0.31, 1.6);
    disposables.mat.push(strip.material); g.add(strip);
    anchors.aisle = new Vector3(0, 0.32, -1.6);
  });

  comp('computeA', g => {
    for (let i = 0; i < 3; i++) rackShell(g, 1.0, 2.75, 0.95, i * 1.25 - 1.25, 0.34, 0, 2.4 + i);
    const rowLed = new Mesh(G.sph, M.amber); rowLed.scale.setScalar(0.02); rowLed.position.set(0, 2.5, 0.42); g.add(rowLed);
    leds.push({ m: rowLed, ph: 3.1, wave: true });
    const fan = new Mesh(new TorusGeometry(0.08, 0.008, 6, 16), M.amber); fan.rotation.x = Math.PI / 2; fan.position.set(0, 2.35, 0.42); g.add(fan); fans.push(fan);
    anchors.computeA = new Vector3(0, 2.8, 0);
  });

  comp('computeB', g => {
    for (let i = 0; i < 3; i++) rackShell(g, 1.0, 2.75, 0.95, i * 1.25 - 1.25, 0.34, 0, 4.1 + i);
    anchors.computeB = new Vector3(0, 2.8, 0);
  });

  comp('storage', g => {
    rackShell(g, 2.05, 2.55, 1.0, 0, 0.34, 0, 5.3);
    [[-0.55, 0.05], [-0.15, -0.14]].forEach(([x, zo], i) => {
      const silo = new Mesh(G.cyl, M.shell); silo.scale.set(0.2, 1.4, 0.2); silo.position.set(x, 1.28, zo); silo.castShadow = true; g.add(silo);
      const glassBand = new Mesh(G.cyl, M.glowC); glassBand.scale.set(0.205, 0.18, 0.205); glassBand.position.set(x, 1.5, zo); g.add(glassBand);
      const collar = new Mesh(G.ring, M.gold); collar.scale.set(0.2, 0.2, 0.2); collar.rotation.x = Math.PI / 2; collar.position.set(x, 2.0, zo); g.add(collar);
      const collar2 = new Mesh(G.ring, M.gold); collar2.scale.set(0.2, 0.2, 0.2); collar2.rotation.x = Math.PI / 2; collar2.position.set(x, 1.06, zo); g.add(collar2);
      const lens = new Mesh(G.sph, M.amber); lens.scale.setScalar(0.03); lens.position.set(x, 1.42, zo + 0.19); g.add(lens);
      ddbPulse.push({ m: lens, ph: i * 2.1 });
    });
    for (let i = 0; i < 8; i++) {
      const x = (i % 4) * 0.3 - 0.42, z = Math.floor(i / 4) * 0.22 - 0.2;
      const b = box(M.frame, 0.24, 0.18 + ((i * 5) % 3) * 0.04, 0.2, x, 0.68, z); b.castShadow = true; g.add(b);
      g.add(box(M.cyanDim, 0.25, 0.012, 0.21, x, 0.76 + ((i * 5) % 3) * 0.04, z));
    }
    anchors.storage = new Vector3(0, 2.3, 0);
  });

  comp('network', g => {
    g.add(box(M.plinth, 9.5, 0.06, 0.3, 0, 0.32, 1.6));
    for (let i = 0; i < 10; i++) g.add(box(M.frame, 0.02, 0.02, 9.2, -2 + i * 0.45, 0.36, 1.6));
    const rg = new TorusGeometry(0.28, 0.01, 8, 36);
    dnsRingDeco = new Mesh(rg, M.cyanL); dnsRingDeco.position.set(-4.5, 1.5, 1.1); g.add(dnsRingDeco);
    [-4.5, -3.7].forEach((x, si) => {
      const sw = box(M.shell, 0.55, 0.2, 0.42, x, 0.48, 1.1); sw.castShadow = true; g.add(sw);
      for (let p = 0; p < 8; p++) {
        const port = new Mesh(G.sph, p % 3 ? M.cyanDim : M.cyanL);
        port.scale.setScalar(0.011); port.position.set(x - 0.21 + p * 0.06, 0.56, 1.32); g.add(port);
        leds.push({ m: port, ph: 8.2 + p * 0.7 + si });
      }
      const patch = new Mesh(new CylinderGeometry(0.006, 0.006, 0.5, 5), M.cyanDim);
      patch.rotation.z = Math.PI / 2.4; patch.position.set(x + 0.15, 0.62, 1.25); g.add(patch);
    });
    anchors.network = new Vector3(0, 0.62, 1.6);
  });

  comp('power', g => {
    const base = box(M.plinth, 1.2, 0.14, 0.9, 0, 0.35, 0); base.receiveShadow = true; g.add(base);
    for (let i = 0; i < 3; i++) {
      const brick = box(M.shell, 0.32, 0.55, 0.6, -0.38 + i * 0.38, 0.7, 0); brick.castShadow = true; g.add(brick);
      const led = new Mesh(G.sph, M.amber); led.scale.setScalar(0.02); led.position.set(-0.38 + i * 0.38, 1.0, 0.32); g.add(led);
      leds.push({ m: led, ph: 6.2 + i });
    }
    anchors.power = new Vector3(0, 1.25, 0);
  });

  comp('cooling', g => {
    const body = box(M.shell, 1.25, 1.9, 0.95, 0, 1.23, 0); body.castShadow = true; g.add(body);
    for (let i = 0; i < 5; i++) g.add(box(M.panel, 1.1, 0.05, 0.04, 0, 0.8 + i * 0.28, 0.5));
    const flow = new Mesh(new PlaneGeometry(3.2, 1.3), new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
      uniforms: { uT: { value: 0 } },
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vU;uniform float uT;
        void main(){float w=sin(vU.x*22.+uT*1.4)*.5+.5;float a=w*.05*smoothstep(0.,.4,vU.x)*smoothstep(1.,.5,vU.x);
        gl_FragColor=vec4(vec3(.45,.72,.85),a);}`
    }));
    disposables.mat.push(flow.material);
    flow.rotation.y = -Math.PI / 2; flow.position.set(-1.7, 1.1, 0); g.add(flow); coolingShimmer = flow;
    anchors.cooling = new Vector3(0, 2.45, 0);
  });

  comp('gate', g => {
    [-1.0, 1.0].forEach(x => {
      g.add(box(M.frame, 0.18, 2.2, 0.22, x, 1.35, 0));
      g.add(box(M.gold, 0.19, 0.04, 0.23, x, 2.48, 0));
    });
    g.add(box(M.frame, 2.2, 0.18, 0.24, 0, 2.55, 0));
    g.add(box(M.gold, 2.2, 0.014, 0.25, 0, 2.44, 0));
    const seal = new Mesh(new TorusGeometry(0.22, 0.014, 8, 36), new MeshBasicMaterial({ color: CHAMP }));
    disposables.mat.push(seal.material);
    seal.rotation.x = Math.PI / 2; seal.position.set(0, 2.75, 0); g.add(seal);
    anchors.gate = new Vector3(0, 2.95, 0);
  });

  comp('user', g => {
    const plinth = box(M.plinth, 1.7, 0.14, 1.2, 0, 0.35, 0); plinth.receiveShadow = true; g.add(plinth);
    g.add(box(M.shell, 0.65, 0.04, 0.42, 0, 0.44, 0.1));
    const screen = box(M.panel, 0.65, 0.42, 0.02, 0, 0.7, -0.18); screen.rotation.x = -0.16; screen.castShadow = true; g.add(screen);
    const glow = box(new MeshBasicMaterial({ color: 0x2e7d96 }), 0.55, 0.32, 0.005, 0, 0.7, -0.165);
    glow.rotation.x = -0.16; disposables.mat.push(glow.material); g.add(glow);
    const phone = box(M.shell, 0.13, 0.02, 0.26, 0.55, 0.45, 0.3); phone.rotation.y = -0.4; g.add(phone);
    anchors.user = new Vector3(0, 1.1, 0);
  });

  let hudMat = null;
  comp('hud', g => {
    hudMat = new ShaderMaterial({
      transparent: true, depthWrite: false, side: DoubleSide,
      uniforms: { uT: { value: 0 }, uC: { value: new Color(0x9fd8ea) }, uA: { value: new Color(0xffb84d) } },
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vU;uniform float uT;uniform vec3 uC;uniform vec3 uA;
        float hash(float n){return fract(sin(n)*43758.5453);}
        void main(){
          float frame=smoothstep(0.,.04,vU.x)*smoothstep(1.,.96,vU.x)*smoothstep(0.,.06,vU.y)*smoothstep(1.,.94,vU.y);
          float body=step(.1,vU.x)*step(vU.x,.95)*step(.25,vU.y)*step(vU.y,.85);
          float col=floor(vU.x*12.);
          float h=0.15+0.55*abs(sin(uT*0.7+hash(col)*6.28));
          float bar=step(vU.y,.25+h*.55)*step(.15,vU.x)*step(vU.x,.9);
          vec3 c=mix(uC,uA,bar*.5);
          gl_FragColor=vec4(c,(frame*.4+bar*.22*body));}`
    });
    disposables.mat.push(hudMat);
    [[-0.5, 1.5, 4.4, 0.25], [1.2, 1.3, 5.1, -0.3], [-1.4, 1.42, 4.2, 0.4]].forEach(([x, y, z, ry]) => {
      const p = new Mesh(new PlaneGeometry(1.4, 0.85), hudMat);
      p.position.set(x, y, z); p.rotation.y = ry; g.add(p);
    });
    anchors.hud = new Vector3(0.9, 1.15, 4.7);
  });

  comp('cloud', g => {
    [[1.5, 0.10], [1.15, 0.14], [0.8, 0.2]].forEach(([r, op]) => {
      const sm = new MeshBasicMaterial({ color: 0x7fd8f2, transparent: true, opacity: op, wireframe: true });
      disposables.mat.push(sm);
      const s = new Mesh(new SphereGeometry(r, 12, 8), sm); s.position.set(0, 4.2, 0); g.add(s); cloudShells.push(s);
    });
    const core = new Mesh(new SphereGeometry(0.55, 14, 10), new MeshBasicMaterial({ color: ICE, transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false }));
    disposables.mat.push(core.material); core.position.set(0, 4.2, 0); g.add(core);
    beamMat = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
      uniforms: { uC: { value: new Color(0x8fd4f2) }, uT: { value: 0 } },
      vertexShader: 'varying float vY;void main(){vY=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying float vY;uniform vec3 uC;uniform float uT;
        void main(){float a=vY*0.22*(0.85+0.15*sin(uT*0.8));gl_FragColor=vec4(uC,a);}`
    });
    disposables.mat.push(beamMat);
    for (let i = 0; i < 6; i++) {
      const x = Math.sin(i * 2.4) * 0.85, z = Math.cos(i * 1.9) * 0.5;
      const beam = new Mesh(new CylinderGeometry(0.03, 0.09, 3.0, 8, 1, true), beamMat);
      beam.position.set(x, 2.5, z); g.add(beam);
      const ring = new Mesh(new TorusGeometry(1, 0.006, 6, 40),
        new MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
      disposables.mat.push(ring.material);
      ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.32, z);
      ring.userData.off = i * 0.17; ring.userData.max = 0.7;
      g.add(ring); sweeps.push(ring);
    }
    anchors.cloud = new Vector3(0, 5.9, 0);
  });

  /* logical service modules on the deck walkway */
  const logiMarkers = {};
  LOGI.forEach(c => {
    const g = new Group(); g.position.fromArray(c.off);
    const ped = box(M.plinth, 0.74, 0.3, 0.74, 0, 0.15, 0); ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
    const coreG = box(M.shell, 0.5, 0.4, 0.5, 0, 0.5, 0); coreG.castShadow = true; g.add(coreG);
    const inlay = box(M.glowC, 0.52, 0.06, 0.52, 0, 0.65, 0); g.add(inlay);
    const crown = new Mesh(new TorusGeometry(0.17, 0.007, 8, 32),
      new MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.75, blending: AdditiveBlending, depthWrite: false }));
    disposables.mat.push(crown.material);
    crown.rotation.x = Math.PI / 2; crown.position.set(0, 0.84, 0); g.add(crown);
    const gem = new Mesh(G.sph, new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }));
    disposables.mat.push(gem.material);
    gem.scale.setScalar(0.035); gem.position.set(0, 0.84, 0); g.add(gem);
    g.traverse(o => { if (o.isMesh) { o.userData.compId = c.id; o.userData.isLogical = true; pickables.push(o); } });
    logiMarkers[c.id] = g; compGroups[c.id] = g; scene.add(g);
    moduleGlows[c.id] = { inlay, crown };
    anchors[c.id] = new Vector3(0, 1.08, 0);
  });

  /* lighting */
  scene.add(new HemisphereLight(0x42506b, 0x07090f, 1.3));
  const key = new DirectionalLight(0xd6e4ff, 1.75);
  key.position.set(-6, 10, 8); key.castShadow = true;
  key.shadow.mapSize.set(768, 768);
  key.shadow.camera.left = -11; key.shadow.camera.right = 11;
  key.shadow.camera.top = 11; key.shadow.camera.bottom = -11;
  key.shadow.camera.far = 34; key.shadow.bias = -0.0006;
  scene.add(key);
  const pAmber = new PointLight(AMBER, 2.4, 8, 2); pAmber.position.set(-2, 2.8, 2); scene.add(pAmber);
  const pCyan = new PointLight(CYAN, 2.6, 9, 2); pCyan.position.set(0, 4.2, -2.2); scene.add(pCyan);
  const pGold = new PointLight(CHAMP, 1.2, 5, 2); pGold.position.set(-2.8, 3, 2); scene.add(pGold);
  const rim = new PointLight(0x3a7aa8, 1.6, 14, 2); rim.position.set(4, 3.2, -6); scene.add(rim);

  /* routes between logical modules */
  const wp = id => { const c = byId(id);
    return c.off ? new Vector3(c.off[0], c.off[1] + 0.55, c.off[2]) : new Vector3(c.p[0], c.p[1] + 0.85, c.p[2]); };
  const mkRoute = (aId, bId, lift, hex, slim) => {
    const a = wp(aId).clone(), b = wp(bId).clone();
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += lift;
    const curve = new CatmullRomCurve3([a, mid, b]);
    const tg = new TubeGeometry(curve, 30, slim ? 0.011 : 0.02, 6, false);
    const m = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uC: { value: new Color(hex) }, uPulse: { value: -1 }, uAmp: { value: 1 } },
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vU;uniform vec3 uC;uniform float uPulse;uniform float uAmp;
        void main(){float a=0.45*uAmp;float ends=smoothstep(0.,.07,vU.x)*smoothstep(1.,.93,vU.x);
        if(uPulse>=0.){float d=abs(vU.x-uPulse);a+=exp(-d*22.)*.95*uAmp;}
        gl_FragColor=vec4(uC,a*ends);}`
    });
    disposables.mat.push(m);
    scene.add(new Mesh(tg, m));
    return { curve, mat: m };
  };
  const R = {};
  R.user_api = mkRoute('user', 'api', 0.4, CYAN);
  R.api_lambda = mkRoute('api', 'lambda', 0.35, ICE);
  R.lambda_ddb = mkRoute('lambda', 'ddb', 0.3, CYAN);
  R.lambda_s3 = mkRoute('lambda', 's3', 0.45, CYAN);
  R.lambda_sns = mkRoute('lambda', 'sns', 0.5, CYAN);
  R.ddb_cw = mkRoute('ddb', 'cw', 0.7, 0x89a7b8, true);
  R.s3_cw = mkRoute('s3', 'cw', 0.9, 0x89a7b8, true);
  R.sns_cw = mkRoute('sns', 'cw', 0.6, 0x89a7b8, true);
  R.user_dns = mkRoute('user', 'dns', 0.25, 0x3f6d80, true);
  R.dns_lb = mkRoute('dns', 'lb', 0.25, 0x3f6d80, true);
  R.lb_api = mkRoute('lb', 'api', 0.25, 0x3f6d80, true);
  {
    const a = wp('lambda').add(new Vector3(0, 0.2, 0)), b = wp('user').add(new Vector3(0, 0.3, 0));
    const curve = new QuadraticBezierCurve3(a, new Vector3(-3.4, 2.6, 3.0), b);
    const tg = new TubeGeometry(curve, 36, 0.02, 6, false);
    const mat = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      uniforms: { uC: { value: new Color(CHAMP) }, uPulse: { value: -1 }, uAmp: { value: 1 } },
      vertexShader: 'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vU;uniform vec3 uC;uniform float uPulse;uniform float uAmp;
        void main(){float a=0.45*uAmp;float ends=smoothstep(0.,.07,vU.x)*smoothstep(1.,.93,vU.x);
        if(uPulse>=0.){float d=abs(vU.x-uPulse);a+=exp(-d*22.)*.95*uAmp;}
        gl_FragColor=vec4(uC,a*ends);}`
    });
    disposables.mat.push(mat);
    scene.add(new Mesh(tg, mat));
    R.response = { curve, mat };
  }
  const mkPacket = hex => {
    const g = new Group();
    const core = new Mesh(G.sph, new MeshBasicMaterial({ color: 0xffffff })); disposables.mat.push(core.material);
    const halo = new Mesh(G.sph, new MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false })); disposables.mat.push(halo.material);
    core.scale.setScalar(0.055); halo.scale.setScalar(0.15);
    g.add(core, halo); scene.add(g); return g;
  };
  const packet = mkPacket(CYAN), packetB = mkPacket(CYAN), packetC = mkPacket(CYAN), respPkt = mkPacket(CHAMP);
  const tele = [mkPacket(0x89a7b8), mkPacket(0x89a7b8), mkPacket(0x89a7b8)];

  const CYCLE = 7500;
  const SEG = [
    { t: 0.0, d: 1.1, r: R.user_api,   pkt: packet,  logi: ['api'] },
    { t: 1.2, d: 0.9, r: R.api_lambda, pkt: packet,  logi: ['api', 'lambda'] },
    { t: 2.2, d: 0.9, r: R.lambda_ddb, pkt: packet,  logi: ['lambda', 'ddb'] },
    { t: 2.4, d: 1.0, r: R.lambda_s3,  pkt: packetB, logi: ['lambda', 's3'] },
    { t: 2.6, d: 1.1, r: R.lambda_sns, pkt: packetC, logi: ['lambda', 'sns'] },
    { t: 3.9, d: 0.8, r: R.ddb_cw,      pkt: tele[0], logi: ['ddb', 'cw'] },
    { t: 4.1, d: 0.8, r: R.s3_cw,      pkt: tele[1], logi: ['s3', 'cw'] },
    { t: 4.3, d: 0.8, r: R.sns_cw,     pkt: tele[2], logi: ['sns', 'cw'] },
    { t: 5.6, d: 1.6, r: R.response,   pkt: respPkt, logi: ['lambda'] },
  ];

  /* labels */
  const labels = new Map();
  ALL.forEach(c => {
    const el = document.createElement('div');
    el.className = 'dc-label' + (c.off ? ' logical' : '');
    el.dataset.comp = c.id; el.tabIndex = 0; el.setAttribute('role', 'button');
    el.innerHTML = `${c.title}<small>${c.cat}</small>`; el.hidden = true;
    el.addEventListener('click', () => select(c.id));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c.id); } });
    if (labelsEl) labelsEl.append(el);
    labels.set(c.id, el);
  });
  const iTitle = document.querySelector('[data-dc-title]'), iCat = document.querySelector('[data-dc-category]');
  const iCopy = document.querySelector('[data-dc-copy]'), iIdx = document.querySelector('[data-dc-index]');
  const iClose = document.querySelector('[data-dc-close]'), iDisc = document.querySelector('[data-dc-disclaimer]');
  const iBody = document.querySelector('[data-dc-insp-body]'), iEmpty = document.querySelector('[data-dc-insp-empty]');
  const iMetrics = document.querySelector('[data-dc-insp-metrics]');
  let selected = null, hover = null;
  const revealedLogi = new Set();
  const ZONE_LABELS = new Set(['user', 'gate', 'cloud', 'hud']);
  const logiShown = id => logicalVisible || revealedLogi.has(id) || selected === id;
  const baseEm = new Map();
  function select(id, silent) {
    if (selected) {
      const g = compGroups[selected];
      g.traverse(o => { if (o.isMesh && o.material.emissiveIntensity !== undefined && baseEm.has(o.material)) o.material.emissiveIntensity = baseEm.get(o.material); });
      labels.get(selected)?.classList.remove('is-selected');
      const c0 = byId(selected); if (c0.p) g.position.y = c0.p[1];
      const gl0 = moduleGlows[selected]; if (gl0) { gl0.inlay.material = M.glowC; gl0.crown.material.opacity = 0.75; }
    }
    selected = id || null;
    if (!id) { if (iBody) iBody.hidden = true; if (iEmpty) iEmpty.hidden = false; if (iDisc) iDisc.hidden = true; state.selected = null; return; }
    const c = byId(id);
    const isLogi = !!c.off;
    let copy = c.role;
    if (isLogi) copy += ` Executes on: ${byId(c.host).title} (illustrative).`;
    else if (c.hosts) copy += ` Illustrative host of: ${c.hosts.map(h => byId(h).title).join(', ')}.`;
    if (iTitle) iTitle.textContent = c.title;
    if (iCat) iCat.textContent = c.cat;
    if (iCopy) iCopy.textContent = copy;
    if (iIdx) iIdx.textContent = String(ALL.findIndex(x => x.id === id) + 1).padStart(2, '0') + ' / 19';
    if (iDisc) iDisc.hidden = !isLogi;
    if (iBody) iBody.hidden = false;
    if (iEmpty) iEmpty.hidden = true;
    if (iMetrics) {
      iMetrics.innerHTML = '<h4>SIMULATED OPERATIONAL STATE</h4>' +
        [['STATE', isLogi ? 'ACTIVE · SIMULATED' : 'OPERATIONAL · SIMULATED'], ['CYCLE', 'C' + String(state.cycle).padStart(2, '0')]]
        .map(([k, v]) => `<div class="dc-metric"><span>${k}</span><b>${v}</b></div>`).join('');
    }
    labels.get(id)?.classList.add('is-selected');
    const g = compGroups[id];
    g.traverse(o => { if (o.isMesh && o.material.emissiveIntensity !== undefined) {
      if (!baseEm.has(o.material)) baseEm.set(o.material, o.material.emissiveIntensity);
      o.material.emissiveIntensity = baseEm.get(o.material) + 0.45;
    }});
    const gl = moduleGlows[id];
    if (gl) {
      const hot = new MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false });
      disposables.mat.push(hot);
      gl.inlay.material = hot; gl.crown.material.opacity = 1;
    }
    if (!isLogi && !reduced && !silent) g.position.y = c.p[1] + 0.09;
    state.selected = id;
  }
  if (iClose) iClose.addEventListener('click', () => select(null));

  /* camera — elevated three-quarter isometric anchor */
  const TGT = new Vector3(0, 0.85, 0.9);
  let az = 1.02, po = 0.66, rad = 10.2, azT = az, poT = po, radT = rad;
  const azMin = 0.62, azMax = 1.42, poMin = 0.44, poMax = 1.02, radMin = 6.5, radMax = 16;
  function applyCamera(t) {
    const dA = reduced ? 0 : Math.sin(t * 0.05) * 0.04, dP = reduced ? 0 : Math.sin(t * 0.037 + 2) * 0.01, dR = reduced ? 0 : Math.sin(t * 0.028 + 4) * 0.2;
    const a = az + dA, p = po + dP, r = rad + dR;
    camera.position.set(TGT.x + r * Math.sin(p) * Math.cos(a), TGT.y + r * Math.cos(p), TGT.z + r * Math.sin(p) * Math.sin(a));
    camera.lookAt(TGT);
  }
  function snapCamera() { az = azT; po = poT; rad = radT; applyCamera(0); }

  /* interaction (proven framework) */
  const ray = new Raycaster(), ndc = new Vector2();
  let dragging = false, moved = 0, px = 0, py = 0, pinchD = 0;
  const onDown = e => { if (contextLost) return; dragging = true; moved = 0; px = e.clientX; py = e.clientY; };
  const onMove = e => {
    if (contextLost) return;
    const r = canvas.getBoundingClientRect();
    if (dragging) {
      const dx = e.clientX - px, dy = e.clientY - py;
      moved += Math.abs(dx) + Math.abs(dy);
      azT = MathUtils.clamp(azT - dx * 0.004, azMin, azMax);
      poT = MathUtils.clamp(poT + dy * 0.003, poMin, poMax);
      px = e.clientX; py = e.clientY;
      if (reduced) { snapCamera(); renderOnce(); }
      return;
    }
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    const id = hit ? hit.object.userData.compId : null;
    if (id !== hover) {
      if (hover) labels.get(hover)?.classList.remove('is-peek');
      hover = id;
      if (hover) labels.get(hover)?.classList.add('is-peek');
      canvas.style.cursor = hover ? 'pointer' : 'grab';
      if (reduced) renderOnce();
    }
  };
  const onUp = e => {
    if (!dragging) return; dragging = false;
    if (moved < 6 && !contextLost) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      select(hit ? hit.object.userData.compId : null);
      if (reduced) renderOnce();
    }
  };
  const onWheel = e => { if (contextLost) return; e.preventDefault();
    radT = MathUtils.clamp(radT * (1 + Math.sign(e.deltaY) * 0.08), radMin, radMax);
    if (reduced) { snapCamera(); renderOnce(); } };
  const onTouch = e => {
    if (contextLost) return;
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (!dragging) { dragging = true; moved = 0; px = t.clientX; py = t.clientY; }
      else { const dx = t.clientX - px, dy = t.clientY - py;
        moved += Math.abs(dx) + Math.abs(dy);
        azT = MathUtils.clamp(azT - dx * 0.005, azMin, azMax);
        poT = MathUtils.clamp(poT + dy * 0.004, poMin, poMax);
        px = t.clientX; py = t.clientY;
        if (reduced) { snapCamera(); renderOnce(); } }
    } else if (e.touches.length === 2) {
      const dd = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinchD) { radT = MathUtils.clamp(radT * (pinchD / dd), radMin, radMax); if (reduced) { snapCamera(); renderOnce(); } }
      pinchD = dd;
    }
  };
  const onTouchEnd = e => { if (e.touches.length < 2) pinchD = 0; if (e.touches.length === 0) dragging = false; };
  const onResetCam = () => { azT = 1.02; poT = 0.66; radT = 10.2;
    select(null); if (reduced) { snapCamera(); renderOnce(); } };
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', () => dragging = false);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchstart', onTouch, { passive: true });
  canvas.addEventListener('touchmove', onTouch, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd);
  if (resetBtn) resetBtn.addEventListener('click', onResetCam);
  listeners.push(['pointerdown', onDown, canvas], ['pointermove', onMove, canvas], ['pointerup', onUp, canvas],
    ['wheel', onWheel, canvas], ['touchstart', onTouch, canvas], ['touchmove', onTouch, canvas],
    ['touchend', onTouchEnd, canvas], ['click', onResetCam, resetBtn]);
  const onLost = e => { e.preventDefault(); contextLost = true; stage.dataset.sceneState = 'fallback';
    if (fallback) fallback.hidden = false; if (lostNote) lostNote.hidden = false; };
  const onRestored = () => { contextLost = false; stage.dataset.sceneState = reduced ? 'static' : 'ready';
    if (fallback) fallback.hidden = true; if (lostNote) lostNote.hidden = true; renderOnce(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  listeners.push(['webglcontextlost', onLost, canvas], ['webglcontextrestored', onRestored, canvas]);
  const lostNote = document.createElement('div');
  lostNote.className = 'dc-lost'; lostNote.hidden = true;
  lostNote.textContent = '3D VIEW INTERRUPTED — MODES REMAIN ACTIVE · SIMULATED';
  stage.appendChild(lostNote);

  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, r.width < 620 ? 1.3 : 1.6));
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const v3 = new Vector3();
  function updateLabels() {
    if (!labelsEl) return;
    const r = stage.getBoundingClientRect();
    ALL.forEach(c => {
      const el = labels.get(c.id); if (!el) return;
      if (c.off) {
        el.classList.toggle('is-dim', !logiShown(c.id));
      } else if (!ZONE_LABELS.has(c.id) && hover !== c.id && selected !== c.id) { el.hidden = true; return; }
      const g = compGroups[c.id];
      v3.copy(anchors[c.id]).applyMatrix4(g.matrixWorld).project(camera);
      if (v3.z > 1 || v3.z < -1) { el.hidden = true; return; }
      const x = (v3.x * 0.5 + 0.5) * r.width, y = (-v3.y * 0.5 + 0.5) * r.height;
      if (x < -30 || x > r.width + 30 || y < -16 || y > r.height + 16) { el.hidden = true; return; }
      el.hidden = false;
      const cl = MathUtils.clamp(x, 4, Math.max(4, r.width - 74));
      el.style.transform = `translate(${Math.round(cl)}px, ${Math.round(y)}px) translate(-2px,-50%)`;
    });
  }

  const state = { stage, selected: null, tIn: 0, cycle: 1, playing: !reduced, speed: 1, scenario: null };
  function setSim(t) { state.tIn = ((t % CYCLE) + CYCLE) % CYCLE; state.cycle = Math.floor(t / CYCLE) + 1; }

  let frames = 0, simT = 0, lastFrame = 0;
  let adaptDone = false, adaptN = 0, adaptSum = 0, adaptT0 = 0;
  function tick(now) {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    if (contextLost || document.hidden || !visible) return;
    let activeSeg = null;
    const dt = Math.min((now - lastFrame) / 1000 || 0, 0.1); lastFrame = now;
    if (!adaptDone && !reduced) {
      if (!adaptT0) adaptT0 = now;
      adaptN++; adaptSum += dt;
      if (now - adaptT0 > 2600 && adaptN >= 12) {
        if ((adaptSum / adaptN) * 1000 > 58) { renderer.setPixelRatio(1); resize(); }
        adaptDone = true;
      }
    }
    if (state.playing) { simT += dt * state.speed; setSim(simT); }
    const t = simT;
    az += (azT - az) * 0.06; po += (poT - po) * 0.06; rad += (radT - rad) * 0.08;
    applyCamera(t);
    if (dnsRingDeco) dnsRingDeco.rotation.y = t * 0.3;
    leds.forEach(l => { const s = 0.6 + 0.5 * Math.abs(Math.sin(t * 1.9 + l.ph));
      l.m.scale.setScalar(0.016 * (l.wave && activeSeg ? s * 1.9 : s) + 0.006); });
    fans.forEach(f => f.rotation.z = t * 2.4);
    ddbPulse.forEach(p => p.m.scale.setScalar(0.03 * (0.7 + 0.5 * Math.sin(t * 1.3 + p.ph))));
    if (coolingShimmer) coolingShimmer.material.uniforms.uT.value = t;
    sweeps.forEach(s => {
      const ph = ((t * 0.22 + (s.userData.off || 0) * 0.5) % 1);
      s.scale.setScalar(0.1 + ph * (s.userData.max || 2.2));
      s.material.opacity = (1 - ph) * 0.4;
    });
    cloudShells.forEach((p, i) => { p.rotation.y = t * 0.05 * (i ? -1 : 1); });
    if (hudMat) hudMat.uniforms.uT.value = t;
    if (beamMat) beamMat.uniforms.uT.value = t;
    LOGI.forEach(c => { const m = logiMarkers[c.id]; if (m) m.rotation.y = Math.sin(t * 0.6 + c.off[0]) * 0.12; });
    Object.values(R).forEach(r => r.mat.uniforms.uPulse.value = -1);
    const cyc = state.tIn;
    revealedLogi.clear();
    const activeLogi = new Set();
    SEG.forEach(sg => {
      const u = (cyc - sg.t * 1000) / (sg.d * 1000);
      if (u >= 0 && u <= 1) {
        sg.r.mat.uniforms.uPulse.value = u;
        sg.pkt.position.copy(sg.r.curve.getPoint(u));
        sg.pkt.visible = true;
        sg.logi.forEach(l => { revealedLogi.add(l); activeLogi.add(l); });
        if (sg.r === R.api_lambda || sg.r === R.lambda_ddb || sg.r === R.lambda_s3 || sg.r === R.lambda_sns) activeSeg = sg;
      } else {
        sg.pkt.visible = cyc >= sg.t * 1000 && u <= 1;
      }
    });
    /* service illumination reacts to lifecycle activity */
    LOGI.forEach(c => {
      const gl = moduleGlows[c.id]; if (!gl) return;
      const active = activeLogi.has(c.id);
      const target = active ? 0.5 + 0.35 * Math.sin(t * 6) : (selected === c.id ? 0.55 : 0.16);
      gl.inlay.material.opacity += (target - gl.inlay.material.opacity) * 0.2;
    });
    state.phase = activeSeg ? 'PROCESSING' : cyc < 1200 ? 'RECEIVING' : cyc > 7200 ? 'RESPONDING' : 'TELEMETRY';
    renderer.render(scene, camera);
    updateLabels();
    frames++;
  }

  function renderOnce() { if (contextLost) return; renderer.render(scene, camera); updateLabels(); }

  const io = new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0.02 });
  io.observe(stage);
  const onVis = () => { if (!document.hidden && !reduced && !dead) lastFrame = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  listeners.push(['visibilitychange', onVis, document]);

  function staticPose() {
    packet.position.copy(R.user_api.curve.getPoint(0.5)); packet.visible = true;
    R.user_api.mat.uniforms.uPulse.value = 0.5;
    revealedLogi.add('api'); revealedLogi.add('lambda');
    respPkt.position.copy(R.response.curve.getPoint(0.5)); respPkt.visible = true;
    R.response.mat.uniforms.uPulse.value = 0.5;
  }
  if (reduced) { state.playing = false; snapCamera(); staticPose(); renderOnce(); stage.dataset.sceneState = 'static'; }
  else { raf = requestAnimationFrame(tick); stage.dataset.sceneState = 'ready'; }

  const api = {
    get state() { return state; },
    getState: () => state,
    select, deselect: () => select(null),
    COMPONENTS: ALL, PHYS, LOGI, EDGES, DIS: 'Illustrative relationship — not AWS’s actual physical deployment.',
    routes: Object.keys(R),
    setLogicalVisible(v) { logicalVisible = !!v; if (reduced) renderOnce(); },
    play() { if (!state.playing) { state.playing = true; lastFrame = performance.now(); } if (reduced) { simT = 0; setSim(simT); staticPose(); renderOnce(); } },
    pause() { state.playing = false; },
    replay() { simT = 0; setSim(0); state.cycle = 1; if (reduced) { staticPose(); renderOnce(); } else state.playing = true; },
    reset() { simT = 0; setSim(0); state.playing = false; if (reduced) { staticPose(); renderOnce(); } },
    scrub(ms) { simT = ms / state.speed; setSim(simT); if (reduced) { staticPose(); renderOnce(); } },
    setSpeed(s) { state.speed = s; },
    renderOnce,
    getInspect: () => ({ state: stage.dataset.sceneState, reduced, contextLost, components: ALL.length,
      selected, frames, tIn: state.tIn, cycle: state.cycle, playing: state.playing, phase: state.phase || 'IDLE',
      cam: camera.position.toArray().map(n => +n.toFixed(2)) }),
  };

  addEventListener('pagehide', () => {
    dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    listeners.forEach(([type, fn, el]) => { if (el) el.removeEventListener(type, fn); });
    scene.traverse(o => { if (o.isMesh) { o.geometry?.dispose?.(); if (!Object.values(M).includes(o.material)) o.material?.dispose?.(); } });
    Object.values(M).forEach(m => m.dispose());
    disposables.mat.forEach(m => m.dispose());
    renderer.dispose();
  }, { once: true });

  return api;
}
function deadAPI() {
  return { getState: () => ({}), getInspect: () => ({ state: 'fallback', components: 0 }),
    select() {}, deselect() {}, play() {}, pause() {}, replay() {}, reset() {}, scrub() {},
    setSpeed() {}, setLogicalVisible() {}, renderOnce() {}, COMPONENTS: [], PHYS: [], LOGI: [], EDGES: [], DIS: '', routes: [] };
}
