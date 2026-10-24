import * as THREE from 'three';

function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,.75)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,.25)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function makeMoonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(205, 170, 25, 256, 256, 240);
  gradient.addColorStop(0, '#fffbd0');
  gradient.addColorStop(0.6, '#f6e93d');
  gradient.addColorStop(1, '#d7a70b');
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(256, 256, 238, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = 'source-atop';
  for (let y = 80; y < 450; y += 28) {
    context.fillStyle = `rgba(25,15,25,${0.025 + (y % 3) * 0.01})`;
    context.fillRect(0, y, 512, 3);
  }
  return new THREE.CanvasTexture(canvas);
}

export function createAtmosphere(scene, reducedMotion, camera, onThunder) {
  const random = randomGenerator(2077);
  const group = new THREE.Group();
  scene.add(group);
  let worldMode = 'city';
  let weatherMode = 'off';

  const moon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeMoonTexture(), color: 0xfff39a, fog: false, toneMapped: false,
  }));
  moon.position.set(43, 48, -112);
  moon.scale.set(30, 30, 1);
  group.add(moon);

  const glowTexture = makeGlowTexture();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: 0xffcc55, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  halo.position.copy(moon.position);
  halo.scale.set(58, 58, 1);
  group.add(halo);

  const starPositions = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i += 1) {
    starPositions[i * 3] = (random() - 0.5) * 260;
    starPositions[i * 3 + 1] = 28 + random() * 95;
    starPositions[i * 3 + 2] = -80 - random() * 90;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    color: 0xa9c8ff, size: 0.22, transparent: true, opacity: 0.65,
    depthWrite: false, fog: false,
  }));
  group.add(stars);

  const dropCount = 2600;
  const rainDropCount = 1700;
  const dropLengths = new Float32Array(dropCount);
  const rainPositions = new Float32Array(dropCount * 6);
  for (let i = 0; i < dropCount; i += 1) {
    const x = (random() - 0.5) * 180;
    const y = random() * 100;
    const z = (random() - 0.5) * 180;
    const length = 1.1 + random() * 1.7;
    dropLengths[i] = length;
    rainPositions.set([x, y, z, x - length * 0.22, y - length, z], i * 6);
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainGeometry.setDrawRange(0, rainDropCount * 2);
  const rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({
    color: 0xb9e2ff, transparent: true, opacity: 0.26, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  rain.frustumCulled = false;
  group.add(rain);

  const windCount = 480;
  const windLengths = new Float32Array(windCount);
  const windPositions = new Float32Array(windCount * 6);
  for (let i = 0; i < windCount; i += 1) {
    const x = (random() - 0.5) * 220;
    const y = 2 + random() * 46;
    const z = (random() - 0.5) * 180;
    const length = 3 + random() * 7;
    windLengths[i] = length;
    windPositions.set([x, y, z, x + length, y + length * 0.06, z], i * 6);
  }
  const windGeometry = new THREE.BufferGeometry();
  windGeometry.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
  const wind = new THREE.LineSegments(windGeometry, new THREE.LineBasicMaterial({
    color: 0xb8dcff, transparent: true, opacity: 0.2, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  wind.frustumCulled = false;
  wind.visible = false;
  group.add(wind);

  const boltPositions = [];
  let boltX = 0;
  let boltY = 92;
  for (let step = 0; step < 9; step += 1) {
    const nextX = boltX + (random() - 0.5) * 9;
    const nextY = boltY - 2.6 - random() * 1.8;
    for (const offset of [-0.3, 0.3]) {
      boltPositions.push(boltX + offset, boltY, -98, nextX + offset, nextY, -98);
    }
    boltX = nextX;
    boltY = nextY;
  }
  const boltGeometry = new THREE.BufferGeometry();
  boltGeometry.setAttribute('position', new THREE.Float32BufferAttribute(boltPositions, 3));
  const bolt = new THREE.LineSegments(boltGeometry, new THREE.LineBasicMaterial({
    color: 0xdcf3ff, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  }));
  bolt.frustumCulled = false;
  group.add(bolt);

  const lightning = new THREE.PointLight(0xd5ecff, 0, 300, 1.6);
  group.add(lightning);
  const skyFlash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: 0xe6f4ff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  skyFlash.scale.set(170, 88, 1);
  group.add(skyFlash);
  const flashColor = new THREE.Color(0xd8ecff);
  const baseBackground = new THREE.Color();
  const baseFog = new THREE.Color();
  let flashActive = false;
  let flashLevel = 0;
  let nextStrike = 3 + random() * 3;

  const haze = [];
  [[-35, 5, -25, 0xff187c], [30, 8, -35, 0x13d9ff], [0, 4, 20, 0x9b2cff]].forEach(([x, y, z, color]) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture, color, transparent: true, opacity: 0.09,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sprite.position.set(x, y, z);
    sprite.scale.set(85, 34, 1);
    group.add(sprite);
    haze.push(sprite);
  });

  function applyWorld() {
    const openSky = worldMode === 'beach' || worldMode === 'suburbs';
    const storm = weatherMode === 'storm';
    const raining = weatherMode === 'rain' || storm;
    moon.visible = !openSky && !storm;
    halo.visible = !openSky && !storm;
    stars.visible = !openSky && !storm;
    haze.forEach((sprite) => { sprite.visible = !openSky; });
    rain.visible = raining;
    wind.visible = weatherMode === 'wind' || storm;
  }

  function restoreSky() {
    if (!flashActive) return;
    if (scene.background?.isColor) scene.background.copy(baseBackground);
    if (scene.fog?.color) scene.fog.color.copy(baseFog);
    flashActive = false;
  }

  function applyWeather(mode) {
    restoreSky();
    weatherMode = mode;
    const storm = mode === 'storm';
    rain.visible = mode === 'rain' || storm;
    rainGeometry.setDrawRange(0, (storm ? dropCount : rainDropCount) * 2);
    rain.material.opacity = storm ? 0.38 : 0.26;
    wind.visible = mode === 'wind' || storm;
    wind.material.opacity = storm ? 0.08 : 0.2;
    if (storm) {
      nextStrike = 2 + random() * 2;
    } else {
      flashLevel = 0;
      lightning.intensity = 0;
      skyFlash.material.opacity = 0;
      bolt.material.opacity = 0;
    }
    applyWorld();
  }

  return {
    setMode(mode) {
      worldMode = mode;
      applyWorld();
    },
    setWeather(mode) {
      applyWeather(mode);
    },
    syncMood() {
      if (scene.background?.isColor) baseBackground.copy(scene.background);
      if (scene.fog?.color) baseFog.copy(scene.fog.color);
    },
    update(delta, elapsed) {
      rain.position.x = camera.position.x;
      rain.position.z = camera.position.z;
      wind.position.x = camera.position.x;
      wind.position.z = camera.position.z;

      if (rain.visible) {
        const fall = delta * (weatherMode === 'storm' ? 54 : 36);
        for (let i = 0; i < dropCount; i += 1) {
          const index = i * 6;
          rainPositions[index + 1] -= fall;
          rainPositions[index + 4] -= fall;
          if (rainPositions[index + 4] < -1) {
            const height = 80 + random() * 20;
            rainPositions[index + 1] = height;
            rainPositions[index + 4] = height - dropLengths[i];
          }
        }
        rainGeometry.attributes.position.needsUpdate = true;
      }

      if (wind.visible) {
        const drift = delta * (weatherMode === 'storm' ? 46 : 28);
        for (let i = 0; i < windCount; i += 1) {
          const index = i * 6;
          windPositions[index] -= drift;
          windPositions[index + 3] -= drift;
          if (windPositions[index + 3] < -110) {
            const x = 105 + random() * 20;
            const y = 2 + random() * 46;
            const z = (random() - 0.5) * 180;
            const length = windLengths[i];
            windPositions[index] = x;
            windPositions[index + 1] = y;
            windPositions[index + 2] = z;
            windPositions[index + 3] = x + length;
            windPositions[index + 4] = y + length * 0.06;
            windPositions[index + 5] = z;
          }
        }
        windGeometry.attributes.position.needsUpdate = true;
      }

      if (weatherMode === 'storm') {
        if (!flashActive) {
          if (scene.background?.isColor) baseBackground.copy(scene.background);
          if (scene.fog?.color) baseFog.copy(scene.fog.color);
        }
        nextStrike -= delta;
        if (nextStrike <= 0) {
          nextStrike = 4.5 + random() * 5.5;
          flashLevel = 1;
          bolt.position.x = camera.position.x - 34 + random() * 68;
          bolt.position.z = camera.position.z;
          onThunder?.();
        }
        flashLevel = Math.max(0, flashLevel - delta * 2.2);
        if (flashLevel > 0) {
          flashActive = true;
          const pulse = flashLevel * (0.7 + Math.sin(elapsed * 74) * 0.3);
          if (scene.background?.isColor) scene.background.copy(baseBackground).lerp(flashColor, pulse * 0.42);
          if (scene.fog?.color) scene.fog.color.copy(baseFog).lerp(flashColor, pulse * 0.3);
          lightning.position.set(camera.position.x + 10, camera.position.y + 44, camera.position.z - 14);
          lightning.intensity = pulse * 2400;
          skyFlash.position.set(camera.position.x, camera.position.y + 34, camera.position.z - 70);
          skyFlash.material.opacity = pulse * 0.34;
          bolt.material.opacity = Math.min(1, Math.max(0, pulse * 2.4 - 0.35));
        } else if (flashActive) {
          restoreSky();
          lightning.intensity = 0;
          skyFlash.material.opacity = 0;
          bolt.material.opacity = 0;
        }
      }

      if (!reducedMotion) {
        stars.rotation.y = elapsed * 0.002;
      }
      haze.forEach((sprite, index) => {
        sprite.material.opacity = 0.075 + Math.sin(elapsed * 0.25 + index) * 0.018;
      });
    },
  };
}
