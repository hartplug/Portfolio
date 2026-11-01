/* home-scene-environment.js — additive environment layer for the Home
 * infrastructure command scene (Phase 4 enhancement).
 *
 * Adds a layered starfield, three planetary accents, wide elliptical orbital
 * paths, an atmospheric globe glow and a slow warm light — WITHOUT touching a
 * single scene-owned object. The protected chunk home-command-scene-W_myw5i2.js
 * stays byte-identical: this module only reads the scene through the existing
 * host.__orbitInspect() hook and attaches new children to the scene root.
 *
 * Motion is driven from one onBeforeRender callback on the glow mesh, so it
 * advances exactly once per rendered frame — automatically pausing when the
 * scene pauses (offscreen / tab hidden) and rendering static under
 * prefers-reduced-motion, because the scene renders a single frame in that mode.
 *
 * Cleanup mirrors the scene's own pattern: window pagehide (once) plus a light
 * watchdog that detaches/re-attaches if the scene is destroyed and re-mounted.
 */
import {
  Group, Mesh, SphereGeometry, TorusGeometry, MeshBasicMaterial, MeshStandardMaterial,
  PointLight, AmbientLight, Color, Vector3, MathUtils, AdditiveBlending, BackSide
} from './three.module-BbDkOMEo.js';

(() => {
  const host = document.querySelector('[data-hero-globe]');
  if (!host) return;

  const TUNING = {
    starShells: [
      { count: 26, rMin: 20, rMax: 27, size: [0.070, 0.11], opacity: 0.80, spin: 0.0032 },
      { count: 22, rMin: 14, rMax: 19, size: [0.080, 0.13], opacity: 0.95, spin: 0.0058 },
      { count: 16, rMin: 10, rMax: 13, size: [0.10, 0.15], opacity: 1.0, spin: 0.0095 }
    ],
    twinklers: { count: 8, size: [0.11, 0.16], base: 0.45, amp: 0.35 },
    planets: [
      { color: 0x5d8fb8, emissive: 0x243e57, radius: 0.42, halo: 0.17,
        anchor: [-2.05, 1.30, -2.40], drift: [0.52, 0.38], driftSpeed: 0.075, selfSpin: 0.10, phase: 0.0 },
      { color: 0xd3b174, emissive: 0x5a4526, radius: 0.50, halo: 0.20,
        anchor: [2.15, -0.85, -2.90], drift: [0.46, 0.34], driftSpeed: -0.055, selfSpin: 0.06, phase: 2.1 },
      { color: 0x8a7aa8, emissive: 0x39304f, radius: 0.26, halo: 0.13,
        anchor: [1.50, -1.85, 1.15], drift: [0.40, 0.30], driftSpeed: 0.048, selfSpin: 0.14, phase: 4.2 }
    ],
    /* Three composed rings — the globe is the hero; rings are atmosphere.
     * Foreground: one softly lit champagne ellipse passing in front.
     * Background: two fainter paths at different angles (one muted cyan)
     * that read through depth and precession, not brightness. */
    rings: [
      { r: 3.35, tube: 0.0085, color: 0xd4bfa0, opacity: 0.30, rot: [74, 8, 0], precess: 0.008 },
      { r: 4.35, tube: 0.0045, color: 0x6f93a3, opacity: 0.11, rot: [28, -36, 12], precess: -0.005 },
      { r: 5.15, tube: 0.0038, color: 0xa08a68, opacity: 0.07, rot: [112, 52, -10], precess: 0.003 }
    ],
    glow: { radius: 2.05, color: 0xc9a35f, base: 0.085, amp: 0.025, period: 8.6 },
    light: { color: 0xd7b46a, intensity: 12, distance: 0, orbitR: 5.2, speed: 0.055, yAmp: 1.9, ySpeed: 0.045 },
    fillLight: { color: 0xe8c98a, intensity: 20, distance: 0, pos: [2.0, 1.2, 4.2], sway: 0.35, swaySpeed: 0.03 },
    ambient: { color: 0xd3a96d, intensity: 0.30 }
  };

  const noopRaycast = () => {};
  const dispose = (obj) => {
    obj.traverse?.((o) => {
      o.geometry?.dispose?.();
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose?.());
      else m?.dispose?.();
      o.raycast = noopRaycast;
    });
  };
  const vec = (rMin, rMax) => {
    const v = new Vector3().randomDirection().multiplyScalar(rMin + Math.random() * (rMax - rMin));
    v.y *= 0.82; // slight galactic flattening
    return v;
  };

  let attached = null;   // { scene, objects, updater, motion }
  let watchdog = null;

  function detach() {
    if (!attached) return;
    const { scene, objects } = attached;
    objects.forEach((o) => { if (o.parent === scene) scene.remove(o); });
    objects.forEach(dispose);
    attached = null;
  }

  function attach(inspect) {
    const info = inspect();
    const { scene } = info;
    if (!scene) return;

    const objects = [];
    const disposables = { geoms: [], mats: [] };

    /* ---- starfield: three shells with different depth/speed for parallax ---- */
    const starGroups = TUNING.starShells.map((shell) => {
      const g = new Group();
      const geo = new SphereGeometry(1, 6, 4);
      const mat = new MeshBasicMaterial({ color: 0xdfe6ee, transparent: true, opacity: shell.opacity, depthWrite: false });
      for (let i = 0; i < shell.count; i++) {
        const s = new Mesh(geo, mat);
        const size = shell.size[0] + Math.random() * (shell.size[1] - shell.size[0]);
        s.scale.setScalar(size);
        s.position.copy(vec(shell.rMin, shell.rMax));
        s.raycast = noopRaycast;
        g.add(s);
      }
      g.rotation.z = Math.random() * 0.4 - 0.2;
      objects.push(g);
      return { group: g, spin: shell.spin };
    });

    /* ---- gentle twinklers ---- */
    const twk = TUNING.twinklers;
    const twinkleGeo = new SphereGeometry(1, 6, 4);
    const twinklers = [];
    for (let i = 0; i < twk.count; i++) {
      const mat = new MeshBasicMaterial({ color: 0xf2ead9, transparent: true, opacity: 0.5, depthWrite: false });
      const s = new Mesh(twinkleGeo, mat);
      s.scale.setScalar(twk.size[0] + Math.random() * (twk.size[1] - twk.size[0]));
      s.position.copy(vec(12, 22));
      s.raycast = noopRaycast;
      twinklers.push({ mesh: s, speed: 0.14 + Math.random() * 0.22, phase: Math.random() * Math.PI * 2, base: twk.base, amp: twk.amp });
      objects.push(s);
    }

    /* ---- three planetary accents (anchored slow drift, distinct speeds) ---- */
    const planets = TUNING.planets.map((p) => {
      const body = new Mesh(
        new SphereGeometry(p.radius, 26, 18),
        new MeshStandardMaterial({ color: p.color, emissive: p.emissive, emissiveIntensity: 0.55, roughness: 0.85, metalness: 0.05 })
      );
      const halo = new Mesh(
        new SphereGeometry(p.radius * 1.85, 20, 14),
        new MeshBasicMaterial({ color: p.color, transparent: true, opacity: p.halo, side: BackSide, blending: AdditiveBlending, depthWrite: false })
      );
      body.raycast = noopRaycast;
      halo.raycast = noopRaycast;
      body.add(halo);
      body.position.fromArray(p.anchor);
      objects.push(body);
      return { body, p, angle: p.phase };
    });

    /* ---- wide elliptical orbital paths ---- */
    const ringGeo = [];
    const rings = TUNING.rings.map((r) => {
      const geo = new TorusGeometry(r.r, r.tube, 6, 220);
      ringGeo.push(geo);
      const mesh = new Mesh(geo, new MeshBasicMaterial({ color: r.color, transparent: true, opacity: r.opacity, depthWrite: false }));
      mesh.rotation.set(MathUtils.degToRad(r.rot[0]), MathUtils.degToRad(r.rot[1]), MathUtils.degToRad(r.rot[2] || 0));
      mesh.scale.set(1, 0.62, 1); // elliptical
      mesh.raycast = noopRaycast;
      objects.push(mesh);
      return { mesh, precess: r.precess };
    });

    /* ---- atmospheric globe glow + orbital warm light ---- */
    const glow = new Mesh(
      new SphereGeometry(TUNING.glow.radius, 28, 20),
      new MeshBasicMaterial({ color: TUNING.glow.color, transparent: true, opacity: TUNING.glow.base, blending: AdditiveBlending, depthWrite: false, side: BackSide })
    );
    glow.raycast = noopRaycast;
    objects.push(glow);

    const light = new PointLight(TUNING.light.color, TUNING.light.intensity, TUNING.light.distance);
    light.raycast = noopRaycast;
    objects.push(light);

    /* ---- front fill light: lifts the infrastructure components without
     * washing them out — warm, modest, gently swaying in front-right ---- */
    const fl = TUNING.fillLight;
    const fillLight = new PointLight(fl.color, fl.intensity, fl.distance);
    fillLight.position.fromArray(fl.pos);
    fillLight.raycast = noopRaycast;
    objects.push(fillLight);

    /* ---- gentle warm ambient floor so dark component materials stay
     * recognisable from any angle (MeshStandard only; rings/stars unlit) ---- */
    const amb = TUNING.ambient;
    const ambientLight = new AmbientLight(amb.color, amb.intensity);
    objects.push(ambientLight);

    objects.forEach((o) => scene.add(o));

    const motion = !info.reducedMotion;
    if (!motion && info.renderer && info.camera) {
      // Static mode renders exactly once at scene init — before this layer
      // attaches. Draw the added environment objects with one explicit
      // render so the reduced-motion presentation includes them (still no
      // animation loop, matching the scene's own static behaviour).
      info.renderer.render(scene, info.camera);
    }
    let last = performance.now();
    glow.onBeforeRender = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!motion) return;
      const t = now / 1000;

      starGroups.forEach((s) => { s.group.rotation.y += s.spin * dt; });
      twinklers.forEach((tw) => { tw.mesh.material.opacity = tw.base + tw.amp * (0.5 + 0.5 * Math.sin(t * tw.speed + tw.phase)); });

      planets.forEach((pl) => {
        pl.angle += pl.p.driftSpeed * dt;
        pl.body.position.set(
          pl.p.anchor[0] + Math.cos(pl.angle) * pl.p.drift[0],
          pl.p.anchor[1] + Math.sin(pl.angle * 0.7 + pl.p.phase) * pl.p.drift[1] * 0.8,
          pl.p.anchor[2] + Math.sin(pl.angle) * pl.p.drift[1]
        );
        pl.body.rotation.y += pl.p.selfSpin * dt;
      });

      rings.forEach((r) => { r.mesh.rotation.z += r.precess * dt; });
      glow.material.opacity = TUNING.glow.base + TUNING.glow.amp * Math.sin(t * (Math.PI * 2 / TUNING.glow.period));
      const la = t * TUNING.light.speed;
      light.position.set(Math.cos(la) * TUNING.light.orbitR, Math.sin(t * TUNING.light.ySpeed) * TUNING.light.yAmp, Math.sin(la) * TUNING.light.orbitR);
      fillLight.position.set(
        fl.pos[0] + Math.sin(t * fl.swaySpeed) * fl.sway,
        fl.pos[1] + Math.cos(t * fl.swaySpeed * 0.8) * fl.sway * 0.6,
        fl.pos[2]
      );
    };

    attached = { scene, objects, motion };
  }

  /* ---- lifecycle: wait for the protected scene to mount, then attach ---- */
  let lastScene = null;
  const tryAttach = () => {
    const inspect = host.__orbitInspect;
    if (typeof inspect !== 'function') { if (attached) detach(); lastScene = null; return; }
    let info;
    try { info = inspect(); } catch { return; }
    if (!info || info.scene !== lastScene) {
      detach();
      if (info?.scene) { attach(inspect); lastScene = info.scene; }
    }
  };
  watchdog = setInterval(tryAttach, 1200);
  tryAttach();

  addEventListener('pagehide', () => {
    clearInterval(watchdog);
    detach();
  }, { once: true });
})();
