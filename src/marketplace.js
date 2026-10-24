import * as THREE from 'three';

export function buildMarketplace(scene) {
  const group = new THREE.Group();
  group.name = 'NightMarket';
  scene.add(group);

  let seed = 0x51f15e;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (items) => items[Math.floor(random() * items.length)];
  const dummy = new THREE.Object3D();
  const batches = new Map();
  const signMaterials = [];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  const taperedGeo = new THREE.CylinderGeometry(0.82, 1, 1, 8);
  const sphereGeo = new THREE.SphereGeometry(1, 8, 6);
  const lowSphereGeo = new THREE.DodecahedronGeometry(1, 0);
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const circleGeo = new THREE.CircleGeometry(1, 20);
  const standard = (color, roughness = 0.7, metalness = 0.05, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const glow = (color, intensity = 2) => standard(color, 0.35, 0.1, {
    emissive: color,
    emissiveIntensity: intensity,
    toneMapped: false
  });
  const mats = {
    pavement: standard(0x111722, 0.3, 0.5),
    stone: standard(0x242b36, 0.72, 0.2),
    metal: standard(0x27313b, 0.3, 0.8),
    darkMetal: standard(0x111820, 0.38, 0.75),
    wood: standard(0x493326, 0.85, 0),
    counter: standard(0x26343a, 0.48, 0.45),
    paper: standard(0xd7b48a, 0.9, 0),
    ceramic: standard(0xd8e0db, 0.24, 0.05),
    food: standard(0xe59b45, 0.72, 0),
    produce: standard(0x7ecb57, 0.7, 0),
    chrome: standard(0x9cb7c7, 0.16, 0.95),
    crate: standard(0x78543a, 0.9, 0),
    cable: standard(0x101318, 0.8, 0.3),
    pink: glow(0xff2388, 2.5),
    cyan: glow(0x20e7ff, 2.3),
    amber: glow(0xffa52e, 2.1),
    lime: glow(0xa5ff4d, 1.8),
    redLantern: glow(0xff5638, 1.5),
    goldLantern: glow(0xffc45c, 1.4),
    violetLantern: glow(0xb576ff, 1.5),
    puddle: standard(0x172c3c, 0.08, 0.85, {
      transparent: true,
      opacity: 0.58,
      depthWrite: false
    })
  };

  function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  const stripeTexture = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d7d7d7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#656565';
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 16, h);
    ctx.fillStyle = 'rgba(20,20,20,.12)';
    for (let i = 0; i < 90; i++) ctx.fillRect(random() * w, random() * h, 1, 5 + random() * 15);
  });
  stripeTexture.wrapS = stripeTexture.wrapT = THREE.RepeatWrapping;
  stripeTexture.repeat.set(2, 1);
  const awnings = [0xe84068, 0x24a9b5, 0xe69b32, 0x7652bd, 0x3e9b69, 0xd95135].map(
    (color) => standard(color, 0.88, 0, { map: stripeTexture })
  );

  function queue(geo, material, matrix) {
    if (!batches.has(geo)) batches.set(geo, new Map());
    const materials = batches.get(geo);
    if (!materials.has(material)) materials.set(material, []);
    materials.get(material).push(matrix.clone());
  }

  function add(geo, material, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    queue(geo, material, dummy.matrix);
  }

  const up = new THREE.Vector3(0, 1, 0);
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  function beam(a, b, radius, material) {
    va.set(...a);
    vb.set(...b);
    const direction = vb.clone().sub(va);
    dummy.position.copy(va).add(vb).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    dummy.scale.set(radius, direction.length(), radius);
    dummy.updateMatrix();
    queue(cylinderGeo, material, dummy.matrix);
  }

  add(planeGeo, mats.pavement, 0, -0.055, -7, 25, 52, 1, -Math.PI / 2);
  add(boxGeo, mats.stone, -10.7, 0.08, -7, 0.45, 0.22, 51);
  add(boxGeo, mats.stone, 10.7, 0.08, -7, 0.45, 0.22, 51);
  for (let z = -31; z <= 17; z += 2) {
    add(boxGeo, mats.darkMetal, 0, -0.015, z, 10.2, 0.025, 0.025);
  }
  for (const x of [-4.9, 4.9]) add(boxGeo, mats.cyan, x, 0.005, -7, 0.035, 0.025, 48);
  for (let i = 0; i < 20; i++) {
    add(circleGeo, mats.puddle, (random() - 0.5) * 9, -0.025, 15 - random() * 46,
      0.35 + random() * 1.2, 0.25 + random() * 0.65, 1, -Math.PI / 2, 0, random() * Math.PI);
  }
  for (let i = 0; i < 34; i++) {
    add(planeGeo, i % 3 ? mats.paper : mats.produce, (random() - 0.5) * 9.4, 0.006,
      14 - random() * 44, 0.08 + random() * 0.17, 0.12 + random() * 0.2, 1,
      -Math.PI / 2, 0, random() * Math.PI);
  }

  const labels = ['NOODLES', 'CHROME', 'RAMEN 88', 'AUGMENTS', 'DUMPLINGS', 'NEON TEA',
    'SKEWERS', 'SPARE PARTS', 'HOT POT', 'SYNTH FRUIT', 'REPAIR', 'NIGHT BITES'];
  const steamEmitters = [];
  const vendors = [];

  function makeSign(text, color, x, y, z, ry, width = 3.25, height = 0.9) {
    const css = `#${new THREE.Color(color).getHexString()}`;
    const texture = canvasTexture(512, 144, (ctx, w, h) => {
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = css;
      ctx.lineWidth = 7;
      ctx.strokeRect(7, 7, w - 14, h - 14);
      ctx.shadowColor = css;
      ctx.shadowBlur = 18;
      ctx.fillStyle = css;
      ctx.font = 'bold 57px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2 - 5, w - 35);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d7f8ff';
      ctx.font = '16px monospace';
      ctx.fillText('OPEN 24H  //  LEVEL 07', w / 2, h - 19);
    });
    const material = standard(0xffffff, 0.35, 0.05, {
      map: texture,
      emissiveMap: texture,
      emissive: 0xffffff,
      emissiveIntensity: 1.6,
      side: THREE.DoubleSide,
      toneMapped: false
    });
    const mesh = new THREE.Mesh(planeGeo, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    mesh.scale.set(width, height, 1);
    group.add(mesh);
    signMaterials.push({ material, phase: random() * 20, base: 1.35 + random() * 0.75 });
    add(boxGeo, mats.darkMetal, x - Math.sin(ry) * 0.08, y, z - Math.cos(ry) * 0.08,
      width + 0.16, height + 0.14, 0.13, 0, ry);
  }

  for (let row = 0; row < 6; row++) {
    for (const side of [-1, 1]) {
      const index = row * 2 + (side === 1 ? 1 : 0);
      const z = 8 - row * 6;
      const x = side * 7.15;
      const awning = awnings[index % awnings.length];
      const neon = [mats.pink, mats.cyan, mats.amber, mats.lime][index % 4];
      add(boxGeo, mats.darkMetal, side * 8.75, 2.05, z, 0.18, 4.1, 4.75);
      add(boxGeo, awning, x, 4.34, z, 3.85, 0.16, 4.95, 0, 0, side * 0.105);
      add(boxGeo, awning, side * 5.25, 4.1, z, 0.13, 0.5, 4.95);
      for (let k = 0; k < 11; k++) {
        add(sphereGeo, awning, side * 5.22, 3.85, z - 2.25 + k * 0.45, 0.09, 0.18, 0.24);
      }
      for (const px of [5.38, 8.55]) {
        for (const pz of [-2.18, 2.18]) {
          add(cylinderGeo, mats.metal, side * px, 2.12, z + pz, 0.065, 4.25, 0.065);
        }
      }
      add(boxGeo, mats.counter, side * 5.95, 0.94, z, 1.18, 1.55, 4.25);
      add(boxGeo, mats.wood, side * 5.88, 1.76, z, 1.45, 0.16, 4.5);
      add(boxGeo, neon, side * 5.33, 1.25, z, 0.045, 0.055, 4.12);
      add(boxGeo, mats.metal, side * 8.32, 2.55, z, 0.58, 0.1, 3.9);
      add(boxGeo, mats.metal, side * 8.32, 3.25, z, 0.58, 0.1, 3.9);
      for (let shelf = 0; shelf < 2; shelf++) {
        for (let j = 0; j < 7; j++) {
          add(j % 2 ? boxGeo : cylinderGeo, j % 3 ? mats.chrome : neon,
            side * 8.15, 2.76 + shelf * 0.7, z - 1.55 + j * 0.51,
            0.14, 0.25 + random() * 0.18, 0.14);
        }
      }
      for (let j = 0; j < 9; j++) {
        const pz = z - 1.75 + j * 0.43;
        const px = side * (5.65 + random() * 0.35);
        if (index % 3 === 0 || index % 3 === 2) {
          add(taperedGeo, mats.ceramic, px, 1.94, pz, 0.2, 0.17, 0.2);
          add(sphereGeo, mats.food, px, 2.035, pz, 0.15, 0.055, 0.15);
        } else if (index % 3 === 1) {
          add(j % 2 ? lowSphereGeo : boxGeo, j % 2 ? mats.chrome : neon,
            px, 2.02, pz, 0.18, 0.25 + random() * 0.18, 0.18, 0, random() * Math.PI);
        } else {
          add(sphereGeo, j % 2 ? mats.produce : mats.food, px, 1.99, pz, 0.18, 0.18, 0.18);
        }
      }
      if (index % 3 !== 1) steamEmitters.push([side * 5.7, 2.08, z + 0.3]);
      for (const dz of [-1.45, 1.45]) {
        add(cylinderGeo, mats.darkMetal, side * 4.82, 0.43, z + dz, 0.07, 0.8, 0.07);
        add(cylinderGeo, awning, side * 4.82, 0.85, z + dz, 0.3, 0.12, 0.3);
        add(boxGeo, mats.crate, side * 7.55, 0.35, z + dz, 0.85, 0.7, 0.8, 0, 0.08 * dz);
      }
      for (const dz of [-1.65, 1.65]) {
        const lanternMat = [mats.redLantern, mats.goldLantern, mats.violetLantern][(index + (dz > 0 ? 1 : 0)) % 3];
        add(cylinderGeo, mats.cable, side * 5.55, 3.65, z + dz, 0.018, 0.65, 0.018);
        add(sphereGeo, lanternMat, side * 5.55, 3.2, z + dz, 0.3, 0.42, 0.3);
        add(cylinderGeo, mats.darkMetal, side * 5.55, 3.58, z + dz, 0.19, 0.08, 0.19);
        add(cylinderGeo, mats.amber, side * 5.55, 2.72, z + dz, 0.025, 0.3, 0.025);
      }
      const signRotation = -side * 0.82;
      makeSign(labels[index], [0xff318d, 0x35eaff, 0xffb52e, 0xa876ff][index % 4],
        side * 5.75, 4.93, z + 0.55, signRotation);
      vendors.push({ x: side * 7.05, z, yaw: -side * Math.PI / 2, phase: random() * Math.PI * 2, vendor: true });
    }
  }

  for (const z of [11, 2, -7, -16, -25]) {
    const points = [];
    for (let j = 0; j <= 12; j++) {
      const x = -8.8 + j * (17.6 / 12);
      points.push([x, 6.6 - 1.25 * (1 - (x / 8.8) ** 2), z]);
      if (j > 0) beam(points[j - 1], points[j], 0.018, mats.cable);
      if (j % 2 === 0) {
        add(cylinderGeo, mats.cable, x, points[j][1] - 0.16, z, 0.015, 0.3, 0.015);
        add(sphereGeo, [mats.pink, mats.cyan, mats.amber][(j / 2 + Math.abs(z)) % 3],
          x, points[j][1] - 0.36, z, 0.095, 0.13, 0.095);
      }
    }
  }

  const groundTexture = canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#20d8ed';
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#58e9f5';
    ctx.font = 'bold 104px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NIGHT MARKET', w / 2, h / 2);
  });
  const groundLabel = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
    map: groundTexture,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    toneMapped: false
  }));
  groundLabel.position.set(0, 0.012, 13.2);
  groundLabel.rotation.x = -Math.PI / 2;
  groundLabel.scale.set(7, 1.75, 1);
  group.add(groundLabel);

  makeSign('夜市  //  NIGHT MARKET', 0xff3b9d, 0, 7.25, 10.8, 0, 7.8, 1.05);
  beam([-5.2, 6.25, 10.8], [-5.2, 7.8, 10.8], 0.055, mats.metal);
  beam([5.2, 6.25, 10.8], [5.2, 7.8, 10.8], 0.055, mats.metal);

  for (const [geo, materials] of batches) {
    for (const [material, matrices] of materials) {
      const mesh = new THREE.InstancedMesh(geo, material, matrices.length);
      matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = material !== mats.puddle;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }

  const steamTexture = canvasTexture(64, 64, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, 'rgba(225,245,255,.75)');
    gradient.addColorStop(0.35, 'rgba(195,225,235,.35)');
    gradient.addColorStop(1, 'rgba(160,200,215,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
  const steamCount = steamEmitters.length * 9;
  const steamPositions = new Float32Array(steamCount * 3);
  const steamData = [];
  for (let i = 0; i < steamCount; i++) {
    steamData.push({ emitter: steamEmitters[i % steamEmitters.length], phase: random(), drift: random() * 6.28 });
  }
  const steamGeometry = new THREE.BufferGeometry();
  steamGeometry.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
  const steam = new THREE.Points(steamGeometry, new THREE.PointsMaterial({
    color: 0xc9e5ed,
    map: steamTexture,
    size: 1.15,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    sizeAttenuation: true
  }));
  steam.frustumCulled = false;
  group.add(steam);

  const walkers = [];
  for (let i = 0; i < 46; i++) {
    const direction = i % 2 ? 1 : -1;
    walkers.push({
      lane: -3.75 + (i % 6) * 1.48 + (random() - 0.5) * 0.35,
      start: -25 + random() * 38,
      direction,
      speed: 0.42 + random() * 0.65,
      phase: random() * Math.PI * 2,
      vendor: false
    });
  }
  const people = vendors.concat(walkers);
  const bodyMaterial = standard(0xffffff, 0.72, 0.08);
  const skinMaterial = standard(0xffffff, 0.82, 0);
  const hairMaterial = standard(0xffffff, 0.9, 0);
  const trouserMaterial = standard(0xffffff, 0.8, 0.05);
  const visorMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const crowd = {};
  function crowdPart(name, geo, material) {
    const mesh = new THREE.InstancedMesh(geo, material, people.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    crowd[name] = mesh;
    group.add(mesh);
    return mesh;
  }
  crowdPart('body', taperedGeo, bodyMaterial);
  crowdPart('head', lowSphereGeo, skinMaterial);
  crowdPart('hair', lowSphereGeo, hairMaterial);
  crowdPart('leftLeg', cylinderGeo, trouserMaterial);
  crowdPart('rightLeg', cylinderGeo, trouserMaterial);
  crowdPart('leftArm', cylinderGeo, bodyMaterial);
  crowdPart('rightArm', cylinderGeo, bodyMaterial);
  crowdPart('leftFoot', boxGeo, trouserMaterial);
  crowdPart('rightFoot', boxGeo, trouserMaterial);
  crowdPart('visor', boxGeo, visorMaterial);
  crowdPart('bag', boxGeo, bodyMaterial);
  const clothing = [0xe34b75, 0x2b9ead, 0xe29a38, 0x684d9c, 0x376b65, 0x33445e, 0xa8a05a, 0x812f4d];
  const skins = [0xf1c7a5, 0xd99b73, 0xb87552, 0x815039, 0xf0d1b8];
  const hairs = [0x14121a, 0x30261f, 0x672e4d, 0x173f52, 0xc4b99d];
  const trousers = [0x141b29, 0x252331, 0x29313a, 0x3b2635];
  const color = new THREE.Color();
  people.forEach((person, i) => {
    person.height = 0.9 + random() * 0.18;
    person.shirt = pick(clothing);
    person.skin = pick(skins);
    person.hair = pick(hairs);
    person.pants = pick(trousers);
    person.bag = !person.vendor && random() > 0.48;
    person.visor = random() > 0.56;
    crowd.body.setColorAt(i, color.setHex(person.shirt));
    crowd.leftArm.setColorAt(i, color);
    crowd.rightArm.setColorAt(i, color);
    crowd.bag.setColorAt(i, color.setHex(person.bag ? pick(clothing) : 0x000000));
    crowd.head.setColorAt(i, color.setHex(person.skin));
    crowd.hair.setColorAt(i, color.setHex(person.hair));
    crowd.leftLeg.setColorAt(i, color.setHex(person.pants));
    crowd.rightLeg.setColorAt(i, color);
    crowd.leftFoot.setColorAt(i, color);
    crowd.rightFoot.setColorAt(i, color);
    crowd.visor.setColorAt(i, color.setHex(i % 2 ? 0x32eaff : 0xff3c9e));
  });
  Object.values(crowd).forEach((mesh) => {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  function setPart(mesh, index, x, y, z, yaw, lx, ly, lz, sx, sy, sz, rx = 0, rz = 0) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    dummy.position.set(x + lx * c + lz * s, y + ly, z - lx * s + lz * c);
    dummy.rotation.set(rx, yaw, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  function updateCrowd(t) {
    people.forEach((person, i) => {
      let x;
      let z;
      let yaw;
      let stride = 0;
      let bob;
      if (person.vendor) {
        x = person.x;
        z = person.z;
        yaw = person.yaw;
        bob = Math.sin(t * 1.7 + person.phase) * 0.018;
      } else {
        const travel = person.start + person.direction * person.speed * t;
        z = ((travel + 25) % 38 + 38) % 38 - 25;
        x = person.lane + Math.sin(t * 0.55 + person.phase) * 0.18;
        yaw = person.direction > 0 ? 0 : Math.PI;
        stride = Math.sin(t * person.speed * 6.5 + person.phase) * 0.55;
        bob = Math.abs(Math.sin(t * person.speed * 6.5 + person.phase)) * 0.055;
      }
      const h = person.height;
      const armMotion = person.vendor ? -0.35 + Math.sin(t * 1.4 + person.phase) * 0.25 : -stride * 0.75;
      setPart(crowd.body, i, x, bob, z, yaw, 0, 1.25 * h, 0, 0.31, 0.98 * h, 0.25);
      setPart(crowd.head, i, x, bob, z, yaw, 0, 2.0 * h, 0, 0.255, 0.28, 0.255);
      setPart(crowd.hair, i, x, bob, z, yaw, 0, 2.17 * h, -0.015, 0.265, 0.15, 0.265);
      setPart(crowd.leftLeg, i, x, bob, z, yaw, -0.15, 0.47 * h, 0, 0.105, 0.78 * h, 0.105, stride);
      setPart(crowd.rightLeg, i, x, bob, z, yaw, 0.15, 0.47 * h, 0, 0.105, 0.78 * h, 0.105, -stride);
      setPart(crowd.leftArm, i, x, bob, z, yaw, -0.37, 1.28 * h, 0, 0.09, 0.72 * h, 0.09, armMotion, -0.08);
      setPart(crowd.rightArm, i, x, bob, z, yaw, 0.37, 1.28 * h, 0, 0.09, 0.72 * h, 0.09, person.vendor ? armMotion : stride * 0.75, 0.08);
      setPart(crowd.leftFoot, i, x, bob, z, yaw, -0.15, 0.1, 0.09, 0.22, 0.16, 0.38, stride * 0.25);
      setPart(crowd.rightFoot, i, x, bob, z, yaw, 0.15, 0.1, 0.09, 0.22, 0.16, 0.38, -stride * 0.25);
      const visorScale = person.visor ? 1 : 0;
      setPart(crowd.visor, i, x, bob, z, yaw, 0, 2.02 * h, 0.245, 0.32 * visorScale, 0.065 * visorScale, 0.035 * visorScale);
      const bagScale = person.bag ? 1 : 0;
      setPart(crowd.bag, i, x, bob, z, yaw, 0, 1.28 * h, -0.25, 0.38 * bagScale, 0.5 * bagScale, 0.18 * bagScale);
    });
    Object.values(crowd).forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
  }

  let internalTime = 0;
  updateCrowd(0);
  return {
    group,
    update(delta = 0, elapsed) {
      internalTime += delta;
      const t = elapsed === undefined ? internalTime : elapsed;
      updateCrowd(t);
      signMaterials.forEach(({ material, phase, base }) => {
        const flicker = Math.sin(t * 19 + phase) > 0.965 ? 0.35 : 1;
        material.emissiveIntensity = base * flicker * (0.92 + Math.sin(t * 2.1 + phase) * 0.08);
      });
      for (let i = 0; i < steamCount; i++) {
        const data = steamData[i];
        const age = (data.phase + t * 0.16) % 1;
        const emitter = data.emitter;
        steamPositions[i * 3] = emitter[0] + Math.sin(age * 5 + data.drift) * age * 0.38;
        steamPositions[i * 3 + 1] = emitter[1] + age * 2.35;
        steamPositions[i * 3 + 2] = emitter[2] + Math.cos(age * 4 + data.drift) * age * 0.32;
      }
      steamGeometry.attributes.position.needsUpdate = true;
      groundLabel.material.opacity = 0.55 + Math.sin(t * 1.3) * 0.1;
    }
  };
}
