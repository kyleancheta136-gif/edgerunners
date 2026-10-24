import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildCity } from './city.js';
import { buildMarketplace } from './marketplace.js';
import { buildHighway } from './highway.js';
import { buildBeach } from './beach.js';
import { buildSuburbs, SUBURB_VIEWS } from './suburbs.js';
import { createAtmosphere } from './atmosphere.js';

const OVERVIEW = { position: [54, 35, 72], target: [0, 18, -20] };
const DISTRICTS = {
  heywood: { position: [-43, 20, 35], target: [-25, 14, -15] },
  center: { position: [31, 29, 35], target: [0, 27, -43] },
  japantown: { position: [45, 20, 25], target: [25, 18, -18] },
  market: { position: [15, 9, 28], target: [0, 4, -10] },
  highway: { position: [17, 9, 28], target: [0, 3, -35] },
  beach: { position: [26, 11, 38], target: [0, 3, -25] },
  suburbs: SUBURB_VIEWS.overview,
};
const MOODS = {
  city: [0x03050a, 0x080916, 0.0095, 1.05],
  market: [0x050309, 0x160716, 0.018, 1.1],
  highway: [0x02050c, 0x06101c, 0.007, 1],
  beach: [0x14091c, 0x2c1024, 0.006, 1.1],
  suburbs: [0x4f9fca, 0x4f9fca, 0.0019, 1.16],
};
const WEATHER_MOODS = {
  off: { fog: 0.86, exposure: 1.07 },
  rain: { fog: 1, exposure: 1 },
  storm: { fog: 1.45, exposure: 0.88 },
  wind: { fog: 0.78, exposure: 1.05 },
};
const SUBURB_SKY = {
  off: 0x4f9fca,
  rain: 0x8098a6,
  storm: 0x667985,
  wind: 0x91bccd,
};

export function createCityScene(container, { onThunder } = {}) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x080916, 0.0095);

  const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(...OVERVIEW.position);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...OVERVIEW.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.045;
  controls.enablePan = false;
  controls.minDistance = 24;
  controls.maxDistance = 125;
  controls.minPolarAngle = 0.45;
  controls.maxPolarAngle = Math.PI / 2.06;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.16;

  const ambient = new THREE.HemisphereLight(0x7288bd, 0x120818, 1.7);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0x91a7ff, 1.6);
  keyLight.position.set(25, 65, 35);
  scene.add(keyLight);
  const magentaLight = new THREE.PointLight(0xff187c, 180, 65, 2);
  magentaLight.position.set(-22, 16, -8);
  scene.add(magentaLight);
  const cyanLight = new THREE.PointLight(0x13d9ff, 160, 60, 2);
  cyanLight.position.set(26, 19, -18);
  scene.add(cyanLight);

  const worlds = {
    city: buildCity(scene),
    market: buildMarketplace(scene),
    highway: buildHighway(scene),
    beach: buildBeach(scene),
    suburbs: buildSuburbs(scene),
  };
  Object.entries(worlds).forEach(([id, world]) => { world.group.visible = id === 'city'; });
  const atmosphere = createAtmosphere(scene, reducedMotion, camera, onThunder);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.72, 0.55, 0.68);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let transition = null;
  let exploring = false;
  let activeWorld = 'city';
  let weather = 'off';
  const clock = new THREE.Clock();

  function applyMood() {
    const [background, fog, density, exposure] = MOODS[activeWorld] || MOODS.city;
    const profile = WEATHER_MOODS[weather] || WEATHER_MOODS.off;
    const suburbTint = activeWorld === 'suburbs' ? SUBURB_SKY[weather] || SUBURB_SKY.off : null;
    scene.background.setHex(suburbTint ?? background);
    scene.fog.color.setHex(suburbTint ?? fog);
    scene.fog.density = density * profile.fog;
    renderer.toneMappingExposure = exposure * profile.exposure;
    atmosphere.setMode(activeWorld);
    atmosphere.syncMood();
    worlds.suburbs.setWeather?.(weather);
  }

  function activateWorld(id) {
    activeWorld = id;
    Object.entries(worlds).forEach(([worldId, world]) => { world.group.visible = worldId === id; });
    const suburbs = id === 'suburbs';
    controls.minDistance = suburbs ? 6.5 : 24;
    controls.maxDistance = suburbs ? 320 : 125;
    controls.maxPolarAngle = suburbs ? Math.PI * 0.497 : Math.PI / 2.06;
    ambient.intensity = suburbs ? 0.85 : 1.7;
    keyLight.intensity = suburbs ? 0.9 : 1.6;
    magentaLight.intensity = suburbs ? 22 : 180;
    cyanLight.intensity = suburbs ? 18 : 160;
    bloom.strength = suburbs ? 0.42 : 0.72;
    bloom.threshold = suburbs ? 1.0 : 0.68;
    bloom.radius = suburbs ? 0.45 : 0.55;
    applyMood();
  }

  function moveCamera(view, duration = 1800) {
    const narrow = camera.aspect < 0.95;
    const mobileFrame = narrow && Boolean(view.mobile);
    const framed = mobileFrame ? view.mobile : view;
    const toTarget = new THREE.Vector3(...framed.target);
    const toPosition = new THREE.Vector3(...framed.position);
    if (activeWorld === 'suburbs' && view !== SUBURB_VIEWS.overview && narrow && !mobileFrame) {
      const dolly = Math.min(1.7, 1.02 / camera.aspect);
      toPosition.sub(toTarget).multiplyScalar(dolly).add(toTarget);
    }
    transition = {
      started: performance.now(), duration: reducedMotion ? 1 : duration,
      fromPosition: camera.position.clone(), toPosition,
      fromTarget: controls.target.clone(), toTarget,
    };
  }

  controls.addEventListener('start', () => {
    transition = null;
    controls.autoRotate = false;
  });

  function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;
    if (transition) {
      const progress = Math.min((performance.now() - transition.started) / transition.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
      controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
      if (progress === 1) transition = null;
    }
    Object.values(worlds).forEach((world) => {
      if (world.group.visible) world.update(delta, elapsed);
    });
    atmosphere.update(delta, elapsed);
    controls.update();
    composer.render();
  }

  renderer.setAnimationLoop(animate);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    focusDistrict(id) {
      const location = DISTRICTS[id] ? id : 'center';
      exploring = true;
      controls.autoRotate = false;
      activateWorld(worlds[location] ? location : 'city');
      moveCamera(DISTRICTS[location]);
    },
    focusSuburbPlace(place) {
      if (activeWorld !== 'suburbs') return;
      exploring = true;
      controls.autoRotate = false;
      moveCamera(SUBURB_VIEWS[place] || SUBURB_VIEWS.overview, 1500);
    },
    reset() {
      exploring = false;
      controls.autoRotate = !reducedMotion;
      activateWorld('city');
      moveCamera(OVERVIEW, 2000);
    },
    setWeather(mode) {
      weather = WEATHER_MOODS[mode] ? mode : 'off';
      atmosphere.setWeather(weather);
      applyMood();
      return weather;
    },
    setQuality(high) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, high ? 1.6 : 1));
      bloom.enabled = high;
    },
    get exploring() { return exploring; },
  };
}
