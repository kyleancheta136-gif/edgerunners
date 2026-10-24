import * as THREE from 'three';

const CYAN = 0x28dfff;
const PINK = 0xff287d;
const AMBER = 0xffc45b;

function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeAsphaltTexture(random) {
  const texture = canvasTexture(512, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#11151b';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i += 1) {
      const shade = 17 + Math.floor(random() * 25);
      ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 5},${0.15 + random() * 0.35})`;
      const size = random() * 2 + 0.4;
      ctx.fillRect(random() * w, random() * h, size, size);
    }
    for (let i = 0; i < 34; i += 1) {
      const x = random() * w;
      const y = random() * h;
      const gradient = ctx.createLinearGradient(x, y, x + 8, y + 150);
      gradient.addColorStop(0, 'rgba(85,125,150,0)');
      gradient.addColorStop(0.5, 'rgba(85,125,150,.12)');
      gradient.addColorStop(1, 'rgba(85,125,150,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, 2 + random() * 8, 80 + random() * 180);
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 18);
  texture.anisotropy = 4;
  return texture;
}

function makeBuildingTexture(random, accent) {
  return canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#070b13';
    ctx.fillRect(0, 0, w, h);
    for (let y = 7; y < h - 5; y += 14) {
      for (let x = 6; x < w - 4; x += 13) {
        const lit = random() > 0.48;
        ctx.globalAlpha = lit ? 0.4 + random() * 0.6 : 0.65;
        ctx.fillStyle = lit ? (random() > 0.8 ? accent : '#a9d9e8') : '#101927';
        ctx.fillRect(x, y, 6, 7);
      }
    }
    ctx.globalAlpha = 1;
  });
}

function makeSignTexture(title, subtitle, arrow) {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#062b31';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b8fff4';
    ctx.lineWidth = 9;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = '#e7fff9';
    ctx.font = '700 75px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 52, 105);
    ctx.fillStyle = '#75f7e7';
    ctx.font = '600 39px monospace';
    ctx.fillText(subtitle, 55, 184);
    ctx.fillStyle = '#e7fff9';
    ctx.font = '700 105px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(arrow, 955, 161);
  });
}

function makeGlowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(170,235,255,.75)');
    gradient.addColorStop(0.2, 'rgba(80,185,255,.28)');
    gradient.addColorStop(1, 'rgba(20,90,160,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeCabinGeometry() {
  const vertices = new Float32Array([
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5,
    -0.38, 1, -0.31, 0.38, 1, -0.31, 0.38, 1, 0.31, -0.38, 1, 0.31,
  ]);
  const indices = [
    0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7, 4, 5, 6, 4, 6, 7, 0, 3, 2, 0, 2, 1,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildHighway(scene) {
  const random = seededRandom(20772077);
  const group = new THREE.Group();
  group.name = 'Night City Highway';
  scene.add(group);

  const box = new THREE.BoxGeometry(1, 1, 1);
  const horizontalPlane = new THREE.PlaneGeometry(1, 1);
  horizontalPlane.rotateX(-Math.PI / 2);
  const dummy = new THREE.Object3D();

  function addMesh(geometry, material, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rotation);
    group.add(mesh);
    return mesh;
  }

  function addInstances(geometry, material, transforms, colors) {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((transform, index) => {
      dummy.position.set(...transform.p);
      dummy.scale.set(...(transform.s || [1, 1, 1]));
      dummy.rotation.set(...(transform.r || [0, 0, 0]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      if (colors) mesh.setColorAt(index, new THREE.Color(colors[index]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    return mesh;
  }

  const asphalt = makeAsphaltTexture(random);
  const roadMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x252a32, map: asphalt, roughnessMap: asphalt, roughness: 0.32,
    metalness: 0.78, clearcoat: 1, clearcoatRoughness: 0.13,
  });
  addMesh(new THREE.PlaneGeometry(24, 360), roadMaterial, [0, 0, -120], [1, 1, 1], [-Math.PI / 2, 0, 0]);

  const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.55, metalness: 0.65 });
  addMesh(horizontalPlane, shoulderMaterial, [0, -0.055, -120], [150, 1, 360]);

  const whiteLine = new THREE.MeshBasicMaterial({ color: 0xb8d4d5, transparent: true, opacity: 0.72 });
  const amberLine = new THREE.MeshBasicMaterial({ color: 0xffcf42, transparent: true, opacity: 0.82 });
  const dashes = [];
  for (const x of [-7, -3.5, 3.5, 7]) {
    for (let z = 54; z > -298; z -= 9) dashes.push({ p: [x, 0.025, z], s: [0.11, 1, 4.2] });
  }
  addInstances(horizontalPlane, whiteLine, dashes);
  addInstances(horizontalPlane, amberLine, [-10.75, 10.75].map((x) => ({ p: [x, 0.026, -120], s: [0.15, 1, 356] })));

  const reflectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const reflections = [];
  const reflectionColors = [];
  for (let i = 0; i < 70; i += 1) {
    reflections.push({
      p: [(random() - 0.5) * 21, 0.032 + random() * 0.003, 48 - random() * 330],
      s: [0.05 + random() * 0.22, 1, 3 + random() * 15],
      r: [0, (random() - 0.5) * 0.035, 0],
    });
    reflectionColors.push([CYAN, PINK, AMBER][i % 3]);
  }
  addInstances(horizontalPlane, reflectionMaterial, reflections, reflectionColors);

  const concrete = new THREE.MeshStandardMaterial({ color: 0x303844, roughness: 0.68, metalness: 0.35 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x52606b, roughness: 0.3, metalness: 0.9 });
  const barrierBases = [];
  const barrierRails = [];
  const reflectors = [];
  for (let z = 53; z > -298; z -= 6) {
    for (const x of [-11.85, 11.85]) {
      barrierBases.push({ p: [x, 0.34, z], s: [0.58, 0.68, 5.88] });
      barrierRails.push({ p: [x, 0.83, z], s: [0.18, 0.18, 5.88] });
      if (Math.round(z) % 12 === 5) reflectors.push({ p: [x - Math.sign(x) * 0.31, 0.62, z], s: [0.035, 0.11, 0.35] });
    }
    barrierBases.push({ p: [0, 0.29, z], s: [0.42, 0.58, 5.88] });
    barrierRails.push({ p: [0, 0.66, z], s: [0.17, 0.15, 5.88] });
  }
  addInstances(box, concrete, barrierBases);
  addInstances(box, steel, barrierRails);
  addInstances(box, new THREE.MeshBasicMaterial({ color: AMBER, toneMapped: false }), reflectors);

  const poleGeometry = new THREE.CylinderGeometry(0.09, 0.14, 1, 8);
  const poles = [];
  const arms = [];
  const cyanLamps = [];
  const amberLamps = [];
  const lightPools = [];
  for (let z = 42, row = 0; z > -280; z -= 24, row += 1) {
    for (const side of [-1, 1]) {
      poles.push({ p: [side * 13.3, 3.8, z], s: [1, 7.6, 1] });
      arms.push({ p: [side * 12.55, 7.48, z], s: [1.65, 0.11, 0.11] });
      const lamp = { p: [side * 11.78, 7.36, z], s: [0.65, 0.12, 0.34] };
      (row % 3 === 0 ? amberLamps : cyanLamps).push(lamp);
      lightPools.push({ p: [side * 9.7, 0.04, z], s: [7.5, 1, 17] });
    }
  }
  addInstances(poleGeometry, steel, poles);
  addInstances(box, steel, arms);
  addInstances(box, new THREE.MeshBasicMaterial({ color: 0x9eefff, toneMapped: false }), cyanLamps);
  addInstances(box, new THREE.MeshBasicMaterial({ color: 0xffd394, toneMapped: false }), amberLamps);
  addInstances(horizontalPlane, new THREE.MeshBasicMaterial({
    map: makeGlowTexture(), color: 0x7acfff, transparent: true, opacity: 0.22,
    depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  }), lightPools);

  const cyanLight = new THREE.PointLight(CYAN, 65, 42, 2);
  cyanLight.position.set(-10, 6, 8);
  group.add(cyanLight);
  const pinkLight = new THREE.PointLight(PINK, 55, 38, 2);
  pinkLight.position.set(10, 5, -25);
  group.add(pinkLight);

  const gantryMaterial = new THREE.MeshStandardMaterial({ color: 0x35434c, roughness: 0.35, metalness: 0.9 });
  const signMaterials = [];
  function addGantry(z, labels) {
    addMesh(box, gantryMaterial, [-11.4, 4, z], [0.24, 8, 0.24]);
    addMesh(box, gantryMaterial, [11.4, 4, z], [0.24, 8, 0.24]);
    addMesh(box, gantryMaterial, [0, 7.85, z], [23.2, 0.25, 0.25]);
    labels.forEach((label, index) => {
      const x = labels.length === 1 ? 0 : (index === 0 ? -5.6 : 5.6);
      const material = new THREE.MeshBasicMaterial({
        map: makeSignTexture(...label), side: THREE.DoubleSide, toneMapped: false,
      });
      signMaterials.push(material);
      addMesh(box, steel, [x, 6.65, z - 0.09], [9.8, 2.5, 0.18]);
      addMesh(new THREE.PlaneGeometry(9.5, 2.25), material, [x, 6.65, z + 0.02]);
    });
  }
  addGantry(-28, [
    ['NIGHT CITY', 'NORTH  //  CITY CENTER', '↑'],
    ['WATSON  07', 'KEEP RIGHT  //  2 KM', '↗'],
  ]);
  addGantry(-142, [['PACIFICA  12', 'EXPRESS LANES  //  STAY HUMAN', '↓']]);

  const overpassZ = -88;
  addMesh(box, concrete, [0, 6.1, overpassZ], [76, 1.15, 8.5]);
  addMesh(box, steel, [0, 6.95, overpassZ - 4], [76, 0.75, 0.24]);
  addMesh(box, steel, [0, 6.95, overpassZ + 4], [76, 0.75, 0.24]);
  for (const x of [-17, 17]) {
    addMesh(box, concrete, [x, 2.8, overpassZ], [1.4, 5.6, 2.2]);
    addMesh(box, concrete, [x, 5.35, overpassZ], [5.2, 0.7, 2.8]);
  }
  addMesh(box, new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.7, toneMapped: false }),
    [0, 5.52, overpassZ + 4.27], [42, 0.07, 0.06]);

  const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
  const antennaTransforms = [];
  ['#28dfff', '#ff287d', '#ffd36a'].forEach((accent, set) => {
    const texture = makeBuildingTexture(random, accent);
    const material = new THREE.MeshStandardMaterial({
      color: 0x67717e, map: texture, emissiveMap: texture, emissive: 0xffffff,
      emissiveIntensity: 0.75, roughness: 0.48, metalness: 0.65,
    });
    const transforms = [];
    for (let i = 0; i < 15; i += 1) {
      const side = i % 2 ? -1 : 1;
      const width = 7 + random() * 11;
      const depth = 7 + random() * 12;
      const height = 24 + random() * 66 + set * 6;
      const x = side * (23 + random() * 65);
      const z = -110 - random() * 185;
      transforms.push({ p: [x, height / 2 - 0.1, z], s: [width, height, depth] });
      if (random() > 0.45) antennaTransforms.push({ p: [x, height + 3, z], s: [0.13, 6, 0.13] });
    }
    addInstances(buildingGeometry, material, transforms);
  });
  addInstances(box, new THREE.MeshBasicMaterial({ color: PINK, toneMapped: false }), antennaTransforms);

  const carCount = 48;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.24, metalness: 0.78 });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x071825, emissive: 0x082d43, emissiveIntensity: 0.45, roughness: 0.1, metalness: 0.88,
  });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.88, metalness: 0.15 });
  const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xc8f5ff, toneMapped: false });
  const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff164f, toneMapped: false });
  const trailMaterial = new THREE.MeshBasicMaterial({
    color: 0xff174f, transparent: true, opacity: 0.2, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const wheelGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
  wheelGeometry.rotateZ(Math.PI / 2);
  const cabinGeometry = makeCabinGeometry();

  function dynamicInstances(geometry, material, count, colors = false) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    if (colors) mesh.setColorAt(0, new THREE.Color(0xffffff));
    group.add(mesh);
    return mesh;
  }

  const carMeshes = {
    body: dynamicInstances(box, bodyMaterial, carCount),
    hood: dynamicInstances(box, bodyMaterial, carCount),
    glass: dynamicInstances(cabinGeometry, glassMaterial, carCount),
    roof: dynamicInstances(box, bodyMaterial, carCount),
    wheels: dynamicInstances(wheelGeometry, tireMaterial, carCount * 4),
    headlights: dynamicInstances(box, headlightMaterial, carCount * 2),
    taillights: dynamicInstances(box, taillightMaterial, carCount * 2),
    trails: dynamicInstances(box, trailMaterial, carCount * 2),
  };
  const carPalette = [0x182431, 0xbcc4c9, 0x801b3c, 0x123f52, 0xd19b22, 0x34205e, 0x681616];
  const cars = [];
  const laneX = [-8.75, -5.25, -1.75, 1.75, 5.25, 8.75];
  for (let i = 0; i < carCount; i += 1) {
    const lane = i % 6;
    const direction = lane < 3 ? -1 : 1;
    const slot = Math.floor(i / 6);
    const car = {
      x: laneX[lane], z: 48 - slot * 39 - random() * 10, direction,
      speed: 17 + (lane % 3) * 3.2 + random() * 1.2,
      width: 1.5 + random() * 0.28, length: 3.5 + random() * 0.75,
      cabin: 0.53 + random() * 0.18,
      quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), direction < 0 ? 0 : Math.PI),
    };
    cars.push(car);
    const color = new THREE.Color(carPalette[Math.floor(random() * carPalette.length)]);
    carMeshes.body.setColorAt(i, color);
    carMeshes.hood.setColorAt(i, color);
    carMeshes.roof.setColorAt(i, color);
  }
  carMeshes.body.instanceColor.needsUpdate = true;
  carMeshes.hood.instanceColor.needsUpdate = true;
  carMeshes.roof.instanceColor.needsUpdate = true;

  const rootMatrix = new THREE.Matrix4();
  const localMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();
  const rootPosition = new THREE.Vector3();
  const localPosition = new THREE.Vector3();
  const localScale = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const identity = new THREE.Quaternion();

  function setCarPart(mesh, index, x, y, z, sx, sy, sz) {
    localPosition.set(x, y, z);
    localScale.set(sx, sy, sz);
    localMatrix.compose(localPosition, identity, localScale);
    worldMatrix.multiplyMatrices(rootMatrix, localMatrix);
    mesh.setMatrixAt(index, worldMatrix);
  }

  function updateCars(delta) {
    cars.forEach((car, i) => {
      car.z += car.direction * car.speed * delta;
      if (car.direction < 0 && car.z < -292) car.z = 55;
      if (car.direction > 0 && car.z > 55) car.z = -292;
      rootPosition.set(car.x, 0, car.z);
      rootMatrix.compose(rootPosition, car.quaternion, one);
      const w = car.width;
      const l = car.length;
      setCarPart(carMeshes.body, i, 0, 0.57, 0, w, 0.46, l);
      setCarPart(carMeshes.hood, i, 0, 0.83, -l * 0.32, w * 0.91, 0.16, l * 0.31);
      setCarPart(carMeshes.glass, i, 0, 0.77, 0.12, w * 0.83, 0.68, l * car.cabin);
      setCarPart(carMeshes.roof, i, 0, 1.47, 0.12, w * 0.65, 0.09, l * car.cabin * 0.6);
      const wheelZ = l * 0.31;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([side, axle], wheel) => {
        setCarPart(carMeshes.wheels, i * 4 + wheel, side * w * 0.51, 0.36, axle * wheelZ, 0.22, 0.34, 0.34);
      });
      for (const side of [-1, 1]) {
        const lightIndex = i * 2 + (side === 1 ? 1 : 0);
        setCarPart(carMeshes.headlights, lightIndex, side * w * 0.32, 0.63, -l * 0.505, 0.25, 0.13, 0.055);
        setCarPart(carMeshes.taillights, lightIndex, side * w * 0.32, 0.65, l * 0.505, 0.25, 0.12, 0.055);
        setCarPart(carMeshes.trails, lightIndex, side * w * 0.32, 0.5, l * 0.5 + 3.2, 0.085, 0.045, 6.2);
      }
    });
    Object.values(carMeshes).forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
  }

  updateCars(0);
  return {
    group,
    update(delta, elapsed) {
      updateCars(Math.min(delta, 0.05));
      trailMaterial.opacity = 0.17 + Math.sin(elapsed * 2.2) * 0.035;
      signMaterials.forEach((material, index) => {
        material.opacity = 0.92 + Math.sin(elapsed * 1.7 + index * 2.4) * 0.08;
        material.transparent = true;
      });
      cyanLight.intensity = 62 + Math.sin(elapsed * 0.8) * 5;
    },
  };
}
