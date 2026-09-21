import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import type { SolarCamCmd } from "./solarCamera";
import {
  defaultCameraDistance,
  lookForApp,
  maxCameraDistance,
  orbitForIndex,
  SUN,
  type PlanetLook,
  type PlanetOrbit,
} from "./solarSystem";
import type { AppModule } from "../types";

export interface SolarSceneHost {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
}

export interface SolarSceneHooks {
  getApps: () => AppModule[];
  getActiveId: () => string | null;
  getReducedMotion: () => boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

interface PlanetBody {
  id: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  atmosphere: THREE.Mesh;
  spinMesh: THREE.Object3D;
  hit: THREE.Mesh;
  labelEl: HTMLDivElement;
  orbitLine: THREE.LineLoop;
  look: PlanetLook;
  orbit: PlanetOrbit;
  tug: THREE.Vector3;
}

const HOME_TARGET = new THREE.Vector3(0, 0.15, 0);
const POINTER_CLICK_PX = 9;
const TUG_MAX = 1.15;

const SUN_VERT = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const SUN_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uMid;
uniform vec3 uRim;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocal;
void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPosition);
  float fres = pow(1.0 - abs(dot(N, V)), 2.35);
  float t = uTime * 0.55;
  float n = sin(vLocal.x * 6.4 + t) * sin(vLocal.y * 5.1 - t * 1.2) * sin(vLocal.z * 4.6 + t * 0.7);
  n = 0.55 + 0.45 * n;
  vec3 col = mix(uCore, uMid, n);
  col = mix(col, uRim, fres);
  col += uRim * fres * 0.85;
  gl_FragColor = vec4(col, 1.0);
}
`;

const ATM_VERT = /* glsl */ `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const ATM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(cameraPosition - vWorldPosition);
  float fres = pow(1.0 - abs(dot(N, V)), 2.5);
  gl_FragColor = vec4(uColor, fres * uOpacity);
}
`;

function createGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立光暈貼圖");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(180,255,255,0.85)");
  g.addColorStop(0.42, "rgba(0,229,255,0.32)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else if (mat) mat.dispose();
  });
}

export interface SolarSceneHandle {
  sync: () => void;
  applyCommand: (cmd: SolarCamCmd) => void;
  resetCamera: () => void;
  setFocus: (id: string | null) => void;
  dispose: () => void;
}

export function createSolarScene(host: SolarSceneHost, hooks: SolarSceneHooks): SolarSceneHandle {
  const renderer = new THREE.WebGLRenderer({
    canvas: host.canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x02060c, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "solar-label-layer";
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.inset = "0";
  labelRenderer.domElement.style.pointerEvents = "none";
  host.overlay.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02060c, 0.012);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 220);
  camera.position.set(0, 6.8, 16.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.minDistance = 4.2;
  controls.maxDistance = 36;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI * 0.86;
  controls.target.copy(HOME_TARGET);
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.7;

  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const scratch = new THREE.Vector3();
  const euler = new THREE.Euler(0, 0, 0, "XYZ");
  const camRight = new THREE.Vector3();
  const camUp = new THREE.Vector3();
  const spherical = new THREE.Spherical();

  scene.add(new THREE.AmbientLight(0x5d87a8, 0.42));
  scene.add(new THREE.HemisphereLight(0xb9e9ff, 0x070b12, 0.38));

  const sunLight = new THREE.PointLight(0xb8ffff, 28, 48, 1.15);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const fill = new THREE.DirectionalLight(0x3d9eff, 0.55);
  fill.position.set(-8, 10, 6);
  scene.add(fill);

  const stars = makeStarfield();
  scene.add(stars);

  const dust = makeDustRing();
  scene.add(dust);

  const glowTex = createGlowTexture();
  const sun = makeSun(glowTex);
  scene.add(sun.group);

  const planetsRoot = new THREE.Group();
  scene.add(planetsRoot);

  const planets: PlanetBody[] = [];
  let appSignature = "";
  let focusId: string | null = null;
  let hoveredId: string | null = null;
  let userDriving = false;
  let intro = hooks.getReducedMotion() ? 0 : 1;
  let disposed = false;
  let raf = 0;
  let simTime = 0;

  const tug = {
    planet: null as PlanetBody | null,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    dragged: false,
    sunDown: false,
  };

  controls.addEventListener("start", () => {
    userDriving = true;
  });
  controls.addEventListener("end", () => {
    userDriving = false;
  });

  function homeDistance() {
    return defaultCameraDistance(Math.max(1, planets.length));
  }

  function applyHomePose(instant: boolean) {
    const dist = homeDistance();
    const pos = new THREE.Vector3(dist * 0.08, dist * 0.42, dist * 0.9);
    if (instant) {
      camera.position.copy(pos);
      controls.target.copy(HOME_TARGET);
      controls.update();
      intro = 0;
      return;
    }
    camera.position.copy(pos.clone().multiplyScalar(0.42).add(new THREE.Vector3(0, 0.4, 0.8)));
    controls.target.copy(HOME_TARGET);
    intro = hooks.getReducedMotion() ? 0 : 1;
  }

  function resize() {
    const parent = host.canvas.parentElement ?? host.canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.85);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function rebuildPlanets() {
    const apps = hooks.getApps();
    const sig = apps.map((a) => `${a.id}|${a.name}|${a.icon}|${a.enabled}`).join(";");
    if (sig === appSignature) return;
    appSignature = sig;

    for (const p of planets) {
      p.group.removeFromParent();
      p.orbitLine.removeFromParent();
      disposeObject(p.group);
      disposeObject(p.orbitLine);
    }
    planets.length = 0;

    apps.forEach((app, index) => {
      const look = lookForApp(app);
      const orbit = orbitForIndex(index, apps.length);
      const body = makePlanet(app, look, orbit);
      planets.push(body);
      planetsRoot.add(body.orbitLine);
      planetsRoot.add(body.group);
    });

    controls.maxDistance = maxCameraDistance(apps.length);
    if (!focusId) {
      const dist = homeDistance();
      if (camera.position.length() < 2) camera.position.set(0, dist * 0.42, dist * 0.9);
    }
  }

  function planetPosition(orbit: PlanetOrbit, time: number, out: THREE.Vector3) {
    const angle = orbit.phase + time * orbit.speed;
    out.set(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius);
    euler.set(orbit.inclination, orbit.omega, 0, "XYZ");
    out.applyEuler(euler);
  }

  function setPointerNdc(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function hitPlanet(event: PointerEvent): PlanetBody | null {
    setPointerNdc(event);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(
      planets.map((p) => p.hit),
      false,
    );
    if (!hits.length) return null;
    return planets.find((p) => p.hit === hits[0].object) ?? null;
  }

  function hitSun(event: PointerEvent): boolean {
    setPointerNdc(event);
    raycaster.setFromCamera(pointerNdc, camera);
    return raycaster.intersectObject(sun.hit, false).length > 0;
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    const body = hitPlanet(event);
    if (body) {
      event.stopPropagation();
      controls.enabled = false;
      tug.planet = body;
      tug.pointerId = event.pointerId;
      tug.startX = event.clientX;
      tug.startY = event.clientY;
      tug.lastX = event.clientX;
      tug.lastY = event.clientY;
      tug.dragged = false;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = "grabbing";
      return;
    }
    tug.planet = null;
    tug.pointerId = event.pointerId;
    tug.startX = event.clientX;
    tug.startY = event.clientY;
    tug.dragged = false;
    tug.sunDown = hitSun(event);
  }

  function onPointerMove(event: PointerEvent) {
    if (tug.planet && event.pointerId === tug.pointerId) {
      const dx = event.clientX - tug.lastX;
      const dy = event.clientY - tug.lastY;
      tug.lastX = event.clientX;
      tug.lastY = event.clientY;
      if (Math.hypot(event.clientX - tug.startX, event.clientY - tug.startY) > POINTER_CLICK_PX) {
        tug.dragged = true;
      }
      camera.updateMatrixWorld();
      camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      camUp.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      const scale = 0.012 * Math.max(4, camera.position.distanceTo(controls.target));
      tug.planet.tug.addScaledVector(camRight, dx * scale);
      tug.planet.tug.addScaledVector(camUp, -dy * scale);
      if (tug.planet.tug.length() > TUG_MAX) tug.planet.tug.setLength(TUG_MAX);
      return;
    }

    if (event.buttons === 0 && event.pointerType === "mouse") {
      const body = hitPlanet(event);
      const next = body?.id ?? null;
      if (next !== hoveredId) {
        hoveredId = next;
        hooks.onHover(next);
        renderer.domElement.style.cursor = next ? "pointer" : "grab";
      } else if (!next && hitSun(event)) {
        renderer.domElement.style.cursor = "pointer";
      } else if (!next) {
        renderer.domElement.style.cursor = "grab";
      }
    }
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== tug.pointerId && tug.pointerId !== -1) return;
    const moved = Math.hypot(event.clientX - tug.startX, event.clientY - tug.startY);
    const body = tug.planet;
    const wasSun = tug.sunDown;
    tug.pointerId = -1;
    tug.planet = null;
    tug.sunDown = false;
    controls.enabled = true;
    renderer.domElement.style.cursor = "grab";
    try {
      renderer.domElement.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    if (moved > POINTER_CLICK_PX || tug.dragged) return;
    if (body) hooks.onSelect(body.id);
    else if (wasSun) {
      focusId = null;
      applyHomePose(false);
    }
  }

  function onDblClick(event: MouseEvent) {
    const fake = event as unknown as PointerEvent;
    if (hitPlanet(fake) || hitSun(fake)) return;
    focusId = null;
    applyHomePose(false);
  }

  renderer.domElement.addEventListener("pointerdown", onPointerDown, { capture: true });
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointercancel", onPointerUp);
  renderer.domElement.addEventListener("dblclick", onDblClick);

  const ro = new ResizeObserver(() => resize());
  ro.observe(host.canvas.parentElement ?? host.canvas);

  function applyCommand(cmd: SolarCamCmd) {
    if (cmd.type === "reset") {
      focusId = null;
      applyHomePose(false);
      return;
    }
    const offset = scratch.copy(camera.position).sub(controls.target);
    spherical.setFromVector3(offset);
    if (cmd.type === "orbit") {
      spherical.theta -= cmd.dx * 0.0075;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - cmd.dy * 0.0055, 0.18, Math.PI * 0.86);
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
    } else if (cmd.type === "pan") {
      camera.updateMatrixWorld();
      camRight.setFromMatrixColumn(camera.matrixWorld, 0);
      camUp.setFromMatrixColumn(camera.matrixWorld, 1);
      const factor = 0.012 * spherical.radius;
      const pan = camRight.multiplyScalar(-cmd.dx * factor).add(camUp.multiplyScalar(cmd.dy * factor));
      camera.position.add(pan);
      controls.target.add(pan);
    } else if (cmd.type === "dolly") {
      spherical.radius = THREE.MathUtils.clamp(
        spherical.radius * (1 - cmd.delta * 0.0012),
        controls.minDistance,
        controls.maxDistance,
      );
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
    }
    controls.update();
  }

  function tick() {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const reduced = hooks.getReducedMotion();
    const motionScale = reduced ? 0 : 1;
    simTime += dt * motionScale;

    rebuildPlanets();

    const activeId = hooks.getActiveId();
    focusId = activeId;

    stars.rotation.y += dt * 0.004 * motionScale;
    dust.rotation.y += dt * 0.01 * motionScale;
    sun.group.rotation.y += dt * 0.08 * motionScale;
    sun.rings.rotation.z += dt * 0.22 * motionScale;
    sun.ringsB.rotation.y -= dt * 0.16 * motionScale;
    const pulse = reduced ? 1 : 1 + Math.sin(clock.elapsedTime * 1.6) * 0.018;
    sun.core.scale.setScalar(pulse);
    (sun.material.uniforms.uTime as { value: number }).value = clock.elapsedTime;

    const hoverNow = hoveredId;
    for (const p of planets) {
      planetPosition(p.orbit, simTime, scratch);
      if (!tug.planet || tug.planet !== p) {
        p.tug.multiplyScalar(reduced ? 0.7 : 0.88);
        if (p.tug.lengthSq() < 1e-5) p.tug.set(0, 0, 0);
      }
      p.group.position.copy(scratch).add(p.tug);
      p.spinMesh.rotation.y += dt * p.orbit.spin * (reduced ? 0.12 : 1);

      const hot = p.id === activeId || p.id === hoverNow;
      const dim = hooks.getApps().find((a) => a.id === p.id)?.enabled === false;
      const s = (hot ? 1.16 : 1) * (dim ? 0.92 : 1);
      p.mesh.scale.setScalar(s);
      p.labelEl.classList.toggle("is-hot", hot);
      p.labelEl.classList.toggle("is-dim", Boolean(dim));
      const mat = p.mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = hot ? 1.15 : dim ? 0.18 : 0.45;
      const lineMat = p.orbitLine.material as THREE.LineBasicMaterial;
      lineMat.opacity = hot ? 0.55 : dim ? 0.1 : 0.22;
    }

    if (intro > 0 && !reduced && !userDriving && !activeId) {
      intro = Math.max(0, intro - dt * 0.42);
      const k = 1 - Math.pow(intro, 3);
      const dist = homeDistance();
      const from = new THREE.Vector3(0.6, 2.1, dist * 0.38);
      const to = new THREE.Vector3(dist * 0.08, dist * 0.42, dist * 0.9);
      camera.position.lerpVectors(from, to, k);
      controls.target.lerp(HOME_TARGET, 0.2);
    } else if (activeId && !userDriving && !tug.planet) {
      const body = planets.find((p) => p.id === activeId);
      if (body) {
        const lerp = 1 - Math.exp(-dt * 3.1);
        controls.target.lerp(body.group.position, lerp);
        const offset = scratch.copy(camera.position).sub(controls.target);
        const want = 4.6 + body.look.radius * 2.4;
        const nextR = THREE.MathUtils.lerp(offset.length(), want, lerp * 0.55);
        offset.setLength(Math.max(controls.minDistance, nextR));
        camera.position.copy(controls.target).add(offset);
      }
    } else if (!activeId && !userDriving && intro <= 0) {
      controls.target.lerp(HOME_TARGET, 1 - Math.exp(-dt * 1.4));
    }

    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  resize();
  rebuildPlanets();
  applyHomePose(hooks.getReducedMotion());
  raf = requestAnimationFrame(tick);

  return {
    sync: rebuildPlanets,
    applyCommand,
    resetCamera: () => {
      focusId = null;
      applyHomePose(false);
    },
    setFocus: (id) => {
      focusId = id;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown, true);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("dblclick", onDblClick);
      for (const p of planets) {
        disposeObject(p.group);
        disposeObject(p.orbitLine);
      }
      disposeObject(sun.group);
      disposeObject(stars);
      disposeObject(dust);
      glowTex.dispose();
      labelRenderer.domElement.remove();
      renderer.dispose();
    },
  };
}

function makeStarfield(): THREE.Points {
  const count = 1600;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 28 + Math.random() * 90;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const tint = Math.random();
    if (tint > 0.82) color.set("#9ad8ff");
    else if (tint > 0.6) color.set("#e7ffff");
    else color.set("#88a0b8");
    color.toArray(colors, i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

function makeDustRing(): THREE.Mesh {
  const geo = new THREE.RingGeometry(3.2, 12.5, 96, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.045,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return new THREE.Mesh(geo, mat);
}

function makeSun(glowTex: THREE.Texture) {
  const group = new THREE.Group();
  const coreGeo = new THREE.SphereGeometry(SUN.radius, 64, 48);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCore: { value: new THREE.Color(SUN.core) },
      uMid: { value: new THREE.Color(SUN.mid) },
      uRim: { value: new THREE.Color(SUN.rim) },
    },
    vertexShader: SUN_VERT,
    fragmentShader: SUN_FRAG,
    toneMapped: false,
  });
  const core = new THREE.Mesh(coreGeo, material);
  group.add(core);

  const atm = new THREE.Mesh(
    new THREE.SphereGeometry(SUN.radius * 1.12, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(SUN.glow) },
        uOpacity: { value: 0.95 },
      },
      vertexShader: ATM_VERT,
      fragmentShader: ATM_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
      toneMapped: false,
    }),
  );
  group.add(atm);

  const spriteMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x7af6ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.setScalar(SUN.radius * 6.4);
  group.add(sprite);

  const rings = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.55,
    toneMapped: false,
  });
  const torusA = new THREE.Mesh(new THREE.TorusGeometry(SUN.radius * 1.38, 0.02, 8, 96), ringMat);
  torusA.rotation.x = Math.PI / 2.15;
  const torusB = new THREE.Mesh(
    new THREE.TorusGeometry(SUN.radius * 1.55, 0.014, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x3d9eff, transparent: true, opacity: 0.4, toneMapped: false }),
  );
  torusB.rotation.x = Math.PI / 2.6;
  torusB.rotation.y = 0.4;
  rings.add(torusA, torusB);
  group.add(rings);

  const ringsB = new THREE.Group();
  const torusC = new THREE.Mesh(
    new THREE.TorusGeometry(SUN.radius * 1.22, 0.012, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0xb8ffff, transparent: true, opacity: 0.35, toneMapped: false }),
  );
  torusC.rotation.x = 1.05;
  ringsB.add(torusC);
  group.add(ringsB);

  const label = document.createElement("div");
  label.className = "sun-label";
  label.innerHTML = `<span class="sun-label-kicker">CORE</span><span class="sun-label-name">J.A.R.V.I.S.</span><span class="sun-label-sub">核心協議</span>`;
  const labelObj = new CSS2DObject(label);
  labelObj.position.set(0, -SUN.radius - 0.55, 0);
  group.add(labelObj);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(SUN.radius * 1.25, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(hit);

  return { group, core, material, rings, ringsB, hit };
}

function makePlanet(app: AppModule, look: PlanetLook, orbit: PlanetOrbit): PlanetBody {
  const group = new THREE.Group();
  const spinMesh = new THREE.Group();
  group.add(spinMesh);

  const geo = new THREE.SphereGeometry(look.radius, 48, 36);
  const mat = new THREE.MeshStandardMaterial({
    color: look.color,
    emissive: look.emissive,
    emissiveIntensity: 0.45,
    roughness: look.roughness,
    metalness: look.metalness,
  });
  const mesh = new THREE.Mesh(geo, mat);
  spinMesh.add(mesh);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(look.radius * 1.16, 32, 24),
    new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(look.atmosphere) },
        uOpacity: { value: 0.9 },
      },
      vertexShader: ATM_VERT,
      fragmentShader: ATM_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
      toneMapped: false,
    }),
  );
  spinMesh.add(atmosphere);

  if (look.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(look.radius * look.ring.inner, look.radius * look.ring.outer, 64),
      new THREE.MeshStandardMaterial({
        color: look.ring.color,
        emissive: look.ring.color,
        emissiveIntensity: 0.2,
        roughness: 0.6,
        metalness: 0.15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      }),
    );
    ring.rotation.x = Math.PI / 2.35;
    spinMesh.add(ring);
  }

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(look.radius * 1.55, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  group.add(hit);

  const labelEl = document.createElement("div");
  labelEl.className = "planet-label";
  labelEl.textContent = app.name;
  const labelObj = new CSS2DObject(labelEl);
  labelObj.position.set(0, look.radius + 0.38, 0);
  group.add(labelObj);

  const orbitLine = makeOrbitLine(orbit, look.atmosphere);

  return {
    id: app.id,
    group,
    mesh,
    atmosphere,
    spinMesh,
    hit,
    labelEl,
    orbitLine,
    look,
    orbit,
    tug: new THREE.Vector3(),
  };
}

function makeOrbitLine(orbit: PlanetOrbit, color: string): THREE.LineLoop {
  const pts: THREE.Vector3[] = [];
  const segments = 128;
  const e = new THREE.Euler(orbit.inclination, orbit.omega, 0, "XYZ");
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * orbit.radius, 0, Math.sin(a) * orbit.radius);
    p.applyEuler(e);
    pts.push(p);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const line = new THREE.LineLoop(geo, mat);
  line.frustumCulled = false;
  return line;
}
