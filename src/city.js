import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const NEON = [0xf5ec16, 0xff257f, 0x29ddff, 0x8d52ff];

function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createWindowTexture(random, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#080b12';
  context.fillRect(0, 0, 128, 256);
  const colors = ['#f9dc75', '#8fdcff', accent, '#314152'];
  for (let y = 7; y < 250; y += 15) {
    for (let x = 7; x < 124; x += 15) {
      const lit = random() > 0.42;
      context.fillStyle = lit ? colors[Math.floor(random() * colors.length)] : '#101722';
      context.globalAlpha = lit ? 0.45 + random() * 0.55 : 0.5;
      context.fillRect(x, y, 7, 7);
      if (lit && random() > 0.85) context.fillRect(x, y + 8, 7, 1);
    }
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

function createSignTexture(title, subtitle, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 320;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(3,4,10,.94)';
  context.fillRect(0, 0, 768, 320);
  context.strokeStyle = color;
  context.lineWidth = 9;
  context.strokeRect(12, 12, 744, 296);
  context.fillStyle = color;
  context.fillRect(28, 28, 110, 8);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 24;
  context.font = 'italic 900 116px "Barlow Condensed", Arial, sans-serif';
  context.fillText(title, 384, 145, 690);
  context.shadowBlur = 0;
  context.font = '700 25px "Space Mono", monospace';
  context.fillText(subtitle, 384, 245, 650);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHelipadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 256, 256);
  context.fillStyle = 'rgba(7,10,14,.98)';
  context.beginPath();
  context.arc(128, 128, 122, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#cfc214';
  context.lineWidth = 8;
  context.beginPath();
  context.arc(128, 128, 116, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 2;
  context.beginPath();
  context.arc(128, 128, 96, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = '#cfc214';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'italic 900 112px "Barlow Condensed", Arial, sans-serif';
  context.fillText('H', 128, 121);
  context.font = '700 13px "Space Mono", monospace';
  context.fillText('NC // AIR OPS', 128, 205);
  context.lineWidth = 4;
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    context.beginPath();
    context.moveTo(128 + Math.cos(angle) * 104, 128 + Math.sin(angle) * 104);
    context.lineTo(128 + Math.cos(angle) * 111, 128 + Math.sin(angle) * 111);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRoofTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#2a313a';
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = 'rgba(15,20,27,.85)';
  context.lineWidth = 2;
  for (let i = 32; i < 256; i += 32) {
    context.beginPath();
    context.moveTo(i, 0);
    context.lineTo(i, 256);
    context.stroke();
    context.beginPath();
    context.moveTo(0, i);
    context.lineTo(256, i);
    context.stroke();
  }
  let seed = 8817;
  const noise = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 30; i += 1) {
    const x = noise() * 256;
    const y = noise() * 256;
    const radius = 3 + noise() * 18;
    const stain = context.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, i % 4 === 0 ? 'rgba(87,61,34,.34)' : 'rgba(10,14,19,.42)');
    stain.addColorStop(1, 'rgba(10,14,19,0)');
    context.fillStyle = stain;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.strokeStyle = 'rgba(196,185,40,.5)';
  context.lineWidth = 3;
  context.strokeRect(8, 8, 240, 240);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function buildCity(scene) {
  const random = randomGenerator(771994);
  const city = new THREE.Group();
  scene.add(city);
  const signs = [];
  const traffic = [];
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x090c13, roughness: 0.5, metalness: 0.8 });
  const buildingMaterials = ['#f5ec16', '#ff257f', '#29ddff', '#a762ff', '#f5ec16', '#29ddff'].map((accent) => {
    const texture = createWindowTexture(random, accent);
    return new THREE.MeshStandardMaterial({
      color: 0x343943, map: texture, emissiveMap: texture, emissive: 0xffffff,
      emissiveIntensity: 0.62, roughness: 0.5, metalness: 0.55,
    });
  });

  const roofs = [];
  const roofDeckMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, map: createRoofTexture(), roughness: 0.76, metalness: 0.2,
  });
  const unitMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x626d78, roughness: 0.54, metalness: 0.3 });
  const brightMetalMaterial = new THREE.MeshStandardMaterial({ color: 0xc2ccd6, roughness: 0.42, metalness: 0.35, side: THREE.DoubleSide });
  const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x8a949e, roughness: 0.48, metalness: 0.32 });
  const warningMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8c916, roughness: 0.5, metalness: 0.2, emissive: 0x353000, emissiveIntensity: 1,
  });
  const beaconMaterial = new THREE.MeshBasicMaterial({ color: 0xff385c, transparent: true, opacity: 0.9, toneMapped: false });
  const padLightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2a8, toneMapped: false });
  const helipadMaterial = new THREE.MeshBasicMaterial({
    map: createHelipadTexture(), transparent: true, toneMapped: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  });
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
  const pipeGeometry = new THREE.CylinderGeometry(1, 1, 1, 7);
  const discGeometry = new THREE.CylinderGeometry(1, 1, 1, 18);
  const sphereGeometry = new THREE.SphereGeometry(1, 7, 5);
  const helipadGeometry = new THREE.PlaneGeometry(1, 1);
  helipadGeometry.rotateX(-Math.PI / 2);
  const helipadRimGeometry = new THREE.TorusGeometry(1, 0.018, 5, 40);
  helipadRimGeometry.rotateX(-Math.PI / 2);
  const helipadPlatformGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 28);
  const fanRingGeometry = new THREE.TorusGeometry(1, 0.055, 5, 18);
  fanRingGeometry.rotateX(-Math.PI / 2);

  const rotorParts = [];
  for (let i = 0; i < 3; i += 1) {
    const blade = new THREE.BoxGeometry(1, 0.055, 0.16);
    blade.translate(0.5, 0, 0);
    blade.rotateY((i / 3) * Math.PI * 2);
    rotorParts.push(blade);
  }
  const rotorGeometry = mergeGeometries(rotorParts);

  const dishCone = new THREE.ConeGeometry(1, 0.46, 16, 1, true);
  dishCone.rotateX(Math.PI);
  const dishFeed = new THREE.CylinderGeometry(0.028, 0.028, 0.62, 6);
  dishFeed.translate(0, 0.31, 0);
  const dishTip = new THREE.SphereGeometry(0.065, 6, 5);
  dishTip.translate(0, 0.64, 0);
  const dishGeometry = mergeGeometries([dishCone, dishFeed, dishTip]);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({
    color: 0x05070b, roughness: 0.2, metalness: 0.9,
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  city.add(ground);

  function addBlock(x, y, z, width, height, depth, material = darkMaterial) {
    const block = new THREE.Mesh(unitBox, material);
    block.position.set(x, y, z);
    block.scale.set(width, height, depth);
    city.add(block);
    return block;
  }

  function addNeonFrame(mesh, width, height, depth, color) {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width * 1.005, height * 1.005, depth * 1.005));
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.42, toneMapped: false,
    }));
    lines.position.copy(mesh.position);
    city.add(lines);
  }

  function addRooftopDetails() {
    const decks = [];
    const hvacs = [];
    const fanDiscs = [];
    const towers = [];
    const generators = [];
    const warningStrips = [];
    const pipes = [];
    const pipeCaps = [];
    const turbineBases = [];
    const turbines = [];
    const rails = [];
    const railPosts = [];
    const parapets = [];
    const fanRings = [];
    const workLights = [];
    const masts = [];
    const crossbars = [];
    const beacons = [];
    const dishes = [];
    const helipadPlatforms = [];
    const helipadDecals = [];
    const helipadRims = [];
    const helipadLights = [];
    const dummy = new THREE.Object3D();

    const helipadRoofs = new Set(
      roofs
        .filter((roof) => !roof.central && !roof.deckOnly && roof.height > 22 && Math.min(roof.width, roof.depth) > 7.2)
        .sort((a, b) => b.height - a.height)
        .slice(0, 2),
    );

    const sideSlots = [
      [-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28],
      [-0.38, 0], [0.38, 0], [0, -0.38], [0, 0.38],
    ];

    function slotAllowed(roof, fx, fz) {
      if (!roof.keepOut) return true;
      return Math.abs(fx * roof.width) >= roof.keepOut.width / 2
        || Math.abs(fz * roof.depth) >= roof.keepOut.depth / 2;
    }

    function edgePosition(roof, inset = 0.4) {
      const side = Math.floor(random() * 4);
      const along = (random() - 0.5) * 0.54;
      if (side === 0) return [roof.x + along * roof.width, roof.z + roof.depth * inset];
      if (side === 1) return [roof.x + along * roof.width, roof.z - roof.depth * inset];
      if (side === 2) return [roof.x + roof.width * inset, roof.z + along * roof.depth];
      return [roof.x - roof.width * inset, roof.z + along * roof.depth];
    }

    roofs.forEach((roof) => {
      const y = roof.height + 0.26;
      const isHelipad = helipadRoofs.has(roof);
      decks.push({ x: roof.x, y: roof.height + 0.13, z: roof.z, scale: [roof.width * 1.018, 0.26, roof.depth * 1.018] });

      parapets.push(
        { x: roof.x, y: y + 0.09, z: roof.z - roof.depth / 2, scale: [roof.width, 0.18, 0.16] },
        { x: roof.x, y: y + 0.09, z: roof.z + roof.depth / 2, scale: [roof.width, 0.18, 0.16] },
        { x: roof.x - roof.width / 2, y: y + 0.09, z: roof.z, scale: [0.16, 0.18, roof.depth] },
        { x: roof.x + roof.width / 2, y: y + 0.09, z: roof.z, scale: [0.16, 0.18, roof.depth] },
      );

      if (roof.height > 20) {
        const railX = roof.width * 0.42;
        const railZ = roof.depth * 0.42;
        rails.push(
          { x: roof.x, y: y + 0.06, z: roof.z - railZ, scale: [roof.width * 0.84, 0.1, 0.1] },
          { x: roof.x, y: y + 0.06, z: roof.z + railZ, scale: [roof.width * 0.84, 0.1, 0.1] },
          { x: roof.x - railX, y: y + 0.06, z: roof.z, scale: [0.1, 0.1, roof.depth * 0.84] },
          { x: roof.x + railX, y: y + 0.06, z: roof.z, scale: [0.1, 0.1, roof.depth * 0.84] },
        );
        if (!isHelipad) {
          const edgeX = roof.width / 2 - 0.24;
          const edgeZ = roof.depth / 2 - 0.24;
          rails.push(
            { x: roof.x, y: y + 0.82, z: roof.z - edgeZ, scale: [roof.width * 0.94, 0.045, 0.045] },
            { x: roof.x, y: y + 0.82, z: roof.z + edgeZ, scale: [roof.width * 0.94, 0.045, 0.045] },
            { x: roof.x - edgeX, y: y + 0.82, z: roof.z, scale: [0.045, 0.045, roof.depth * 0.94] },
            { x: roof.x + edgeX, y: y + 0.82, z: roof.z, scale: [0.045, 0.045, roof.depth * 0.94] },
          );
          for (const [px, pz] of [
            [-edgeX, -edgeZ], [edgeX, -edgeZ], [-edgeX, edgeZ], [edgeX, edgeZ],
            [0, -edgeZ], [0, edgeZ], [-edgeX, 0], [edgeX, 0],
          ]) {
            railPosts.push({ x: roof.x + px, y: y + 0.44, z: roof.z + pz, scale: [0.055, 0.88, 0.055] });
          }
        }
      }

      if (roof.deckOnly) return;

      if (isHelipad) {
        const diameter = Math.min(roof.width, roof.depth) * 0.74;
        const radius = diameter / 2;
        helipadPlatforms.push({ x: roof.x, y: y + 0.08, z: roof.z, scale: [diameter, 0.16, diameter] });
        helipadDecals.push({ x: roof.x, y: y + 0.17, z: roof.z, scale: [diameter * 0.98, 1, diameter * 0.98] });
        helipadRims.push({ x: roof.x, y: y + 0.19, z: roof.z, scale: [radius * 0.98, 1, radius * 0.98] });
        for (let i = 0; i < 8; i += 1) {
          const angle = (i / 8) * Math.PI * 2;
          helipadLights.push({
            x: roof.x + Math.cos(angle) * radius * 0.93,
            y: y + 0.23,
            z: roof.z + Math.sin(angle) * radius * 0.93,
            scale: 0.085,
          });
        }
      }

      const availableSlots = sideSlots.filter(([fx, fz]) => slotAllowed(roof, fx, fz));
      for (let i = availableSlots.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
      }

      const occupied = [];
      const canPlace = (px, pz, halfWidth, halfDepth) => occupied.every((slot) => (
        Math.abs(px - slot.x) > halfWidth + slot.halfWidth + 0.12
        || Math.abs(pz - slot.z) > halfDepth + slot.halfDepth + 0.12
      ));
      const claim = (px, pz, halfWidth, halfDepth) => occupied.push({ x: px, z: pz, halfWidth, halfDepth });

      if (!isHelipad && availableSlots.length) {
        const maxW = Math.min(3, roof.width * 0.34);
        const maxD = Math.min(2.4, roof.depth * 0.3);
        const unitCount = Math.min(availableSlots.length, 2 + Math.floor(random() * (roof.height > 28 ? 3 : 2)));
        let added = 0;
        for (const [fx, fz] of availableSlots) {
          if (added >= unitCount) break;
          const px = roof.x + fx * roof.width;
          const pz = roof.z + fz * roof.depth;
          const roll = random();
          if (roll < 0.44) {
            const w = 1.25 + random() * Math.max(0.1, maxW - 1.25);
            const d = 1.1 + random() * Math.max(0.1, maxD - 1.1);
            const h = 0.75 + random() * 0.55;
            if (!canPlace(px, pz, w / 2 + 0.16, d / 2 + 0.16)) continue;
            claim(px, pz, w / 2 + 0.16, d / 2 + 0.16);
            hvacs.push({ x: px, y: y + h / 2, z: pz, scale: [w, h, d] });
            const fanRadius = Math.min(w, d) * 0.3;
            fanDiscs.push({ x: px, y: y + h + 0.01, z: pz, scale: [fanRadius, 0.06, fanRadius] });
            fanRings.push({ x: px, y: y + h + 0.03, z: pz, scale: [fanRadius * 1.04, 1, fanRadius * 1.04] });
            turbines.push({ x: px, y: y + h + 0.1, z: pz, scale: fanRadius * 0.82, speed: 3.8 + random() * 2.8, phase: random() * Math.PI * 2 });
            workLights.push({ x: px + w * 0.32, y: y + h + 0.06, z: pz + d * 0.34, scale: 0.055 });
          } else if (roll < 0.7) {
            const radius = Math.max(0.74, Math.min(1.35, Math.min(maxW, maxD) * 0.52));
            const h = 1.7 + random() * 1.5;
            if (!canPlace(px, pz, radius + 0.12, radius + 0.12)) continue;
            claim(px, pz, radius + 0.12, radius + 0.12);
            towers.push({ x: px, y: y + h / 2, z: pz, scale: [radius, h, radius] });
            fanRings.push({ x: px, y: y + h + 0.02, z: pz, scale: [radius * 0.94, 1, radius * 0.94] });
            turbines.push({ x: px, y: y + h + 0.1, z: pz, scale: radius * 0.82, speed: 2.6 + random() * 2.2, phase: random() * Math.PI * 2 });
            pipes.push({ x: px + radius * 1.12, y: y + 0.95, z: pz, scale: [0.1, 1.9, 0.1] });
            workLights.push({ x: px - radius * 0.92, y: y + h * 0.62, z: pz + radius * 0.92, scale: 0.05 });
          } else if (roll < 0.87) {
            const w = Math.min(2.9, maxW * 1.06);
            const d = Math.min(1.8, maxD * 0.96);
            const h = 0.95 + random() * 0.45;
            if (!canPlace(px, pz, w / 2 + 0.16, d / 2 + 0.16)) continue;
            claim(px, pz, w / 2 + 0.16, d / 2 + 0.16);
            generators.push({ x: px, y: y + h / 2, z: pz, scale: [w, h, d] });
            warningStrips.push(
              { x: px, y: y + h * 0.55, z: pz + d / 2 + 0.02, scale: [w * 0.72, 0.1, 0.03] },
              { x: px, y: y + h * 0.55, z: pz - d / 2 - 0.02, scale: [w * 0.72, 0.1, 0.03] },
            );
            const stackHeight = 2.5 + random() * 0.8;
            pipes.push({ x: px + w * 0.32, y: y + stackHeight / 2, z: pz - d * 0.24, scale: [0.1, stackHeight, 0.1] });
            pipeCaps.push({ x: px + w * 0.32, y: y + stackHeight + 0.03, z: pz - d * 0.24, scale: [0.3, 0.075, 0.3] });
            beacons.push({ x: px + w * 0.32, y: y + stackHeight + 0.12, z: pz - d * 0.24, scale: 0.075 });
            workLights.push({ x: px - w * 0.36, y: y + h + 0.06, z: pz + d * 0.36, scale: 0.05 });
          } else {
            const w = 1.3 + random() * 0.7;
            const d = 1.2 + random() * 0.6;
            const h = 1.1 + random() * 0.5;
            const stackHeight = 3.4 + random() * 2.2;
            if (!canPlace(px, pz, w / 2 + 0.24, d / 2 + 0.24)) continue;
            claim(px, pz, w / 2 + 0.24, d / 2 + 0.24);
            hvacs.push({ x: px, y: y + h / 2, z: pz, scale: [w, h, d] });
            pipes.push({ x: px + w * 0.28, y: y + stackHeight / 2, z: pz - d * 0.2, scale: [0.17, stackHeight, 0.17] });
            pipeCaps.push({ x: px + w * 0.28, y: y + stackHeight + 0.04, z: pz - d * 0.2, scale: [0.4, 0.09, 0.4] });
            beacons.push({ x: px + w * 0.28, y: y + stackHeight + 0.15, z: pz - d * 0.2, scale: 0.085 });
          }
          added += 1;
        }
      }

      const ventCount = 3 + Math.floor(random() * 3);
      for (let i = 0; i < ventCount; i += 1) {
        const [px, pz] = edgePosition(roof, isHelipad ? 0.46 : 0.4);
        const radius = 0.08 + random() * 0.1;
        const height = 1 + random() * 1.8;
        pipes.push({ x: px, y: y + height / 2, z: pz, scale: [radius, height, radius] });
        if (random() > 0.45) pipeCaps.push({ x: px, y: y + height + 0.04, z: pz, scale: [radius * 2.4, 0.08, radius * 2.4] });
      }

      if (random() > 0.26) {
        const count = random() > 0.76 ? 2 : 1;
        for (let i = 0; i < count; i += 1) {
          const [px, pz] = edgePosition(roof, isHelipad ? 0.47 : 0.42);
          const radius = 0.42 + random() * 0.24;
          const baseHeight = 0.38 + random() * 0.26;
          turbineBases.push({ x: px, y: y + baseHeight / 2, z: pz, scale: [radius * 1.06, baseHeight, radius * 1.06] });
          fanRings.push({ x: px, y: y + baseHeight + 0.02, z: pz, scale: [radius * 1.02, 1, radius * 1.02] });
          turbines.push({ x: px, y: y + baseHeight + 0.1, z: pz, scale: radius * 0.92, speed: 3 + random() * 3, phase: random() * Math.PI * 2 });
        }
      }

      if (roof.height > 19 && random() > 0.32) {
        const count = 1 + Math.floor(random() * 2);
        const baseX = roof.x + (random() > 0.5 ? 1 : -1) * roof.width * 0.34;
        const baseZ = roof.z + (random() > 0.5 ? 1 : -1) * roof.depth * 0.34;
        for (let i = 0; i < count; i += 1) {
          const height = 3.4 + random() * 3.8;
          const px = baseX + (i - 0.5) * 0.5;
          const pz = baseZ + (i - 0.5) * 0.45;
          masts.push({ x: px, y: y + height / 2, z: pz, scale: [0.06, height, 0.06] });
          crossbars.push(
            { x: px, y: y + height * 0.64, z: pz, scale: [1.15, 0.05, 0.05], ry: random() > 0.5 ? 0 : Math.PI / 2 },
            { x: px, y: y + height * 0.86, z: pz, scale: [0.78, 0.045, 0.045], ry: random() > 0.5 ? 0 : Math.PI / 2 },
          );
          beacons.push({ x: px, y: y + height + 0.08, z: pz, scale: 0.09 });
        }
      }

      if (!isHelipad && !roof.keepOut && roof.height > 14 && random() > 0.34) {
        const scale = 0.8 + random() * 0.65;
        const px = roof.x + (random() > 0.5 ? 1 : -1) * roof.width * 0.3;
        const pz = roof.z + (random() > 0.5 ? 1 : -1) * roof.depth * 0.3;
        const pedestal = 0.4 + scale * 0.36;
        pipes.push({ x: px, y: y + pedestal / 2, z: pz, scale: [0.075, pedestal, 0.075] });
        dishes.push({
          x: px, y: y + pedestal + scale * 0.32, z: pz, scale,
          rx: 0.55 + random() * 0.35, ry: (random() - 0.5) * Math.PI * 2,
        });
      }
    });

    function addInstances(geometry, material, items) {
      if (!items.length) return null;
      const mesh = new THREE.InstancedMesh(geometry, material, items.length);
      items.forEach((item, index) => {
        dummy.position.set(item.x, item.y, item.z);
        dummy.rotation.set(item.rx || 0, item.ry || 0, item.rz || 0);
        if (Array.isArray(item.scale)) dummy.scale.set(...item.scale);
        else dummy.scale.setScalar(item.scale ?? 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      city.add(mesh);
      return mesh;
    }

    addInstances(unitBox, roofDeckMaterial, decks);
    addInstances(unitBox, unitMetalMaterial, parapets);
    addInstances(unitBox, unitMetalMaterial, hvacs);
    addInstances(discGeometry, pipeMaterial, fanDiscs);
    addInstances(fanRingGeometry, brightMetalMaterial, fanRings);
    addInstances(cylinderGeometry, unitMetalMaterial, towers);
    addInstances(unitBox, unitMetalMaterial, generators);
    addInstances(unitBox, warningMaterial, warningStrips);
    addInstances(pipeGeometry, pipeMaterial, pipes);
    addInstances(cylinderGeometry, pipeMaterial, pipeCaps);
    addInstances(cylinderGeometry, pipeMaterial, turbineBases);
    addInstances(unitBox, brightMetalMaterial, rails);
    addInstances(unitBox, brightMetalMaterial, railPosts);
    addInstances(pipeGeometry, brightMetalMaterial, masts);
    addInstances(unitBox, brightMetalMaterial, crossbars);
    addInstances(sphereGeometry, beaconMaterial, beacons);
    addInstances(dishGeometry, brightMetalMaterial, dishes);
    addInstances(helipadPlatformGeometry, unitMetalMaterial, helipadPlatforms);
    addInstances(helipadGeometry, helipadMaterial, helipadDecals);
    addInstances(helipadRimGeometry, warningMaterial, helipadRims);
    addInstances(sphereGeometry, padLightMaterial, helipadLights);
    addInstances(sphereGeometry, padLightMaterial, workLights);

    let rotorMesh = null;
    if (turbines.length) {
      rotorMesh = new THREE.InstancedMesh(rotorGeometry, brightMetalMaterial, turbines.length);
      rotorMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      rotorMesh.frustumCulled = false;
      city.add(rotorMesh);
    }

    const cradleRoof = roofs
      .filter((roof) => !roof.deckOnly && !helipadRoofs.has(roof) && roof.height > 23)
      .sort((a, b) => b.height - a.height)[0];
    if (cradleRoof) {
      const roofY = cradleRoof.height + 0.26;
      const platformY = Math.max(6, cradleRoof.height * 0.67);
      const cradleX = cradleRoof.x + cradleRoof.width * 0.16;
      const cradleZ = cradleRoof.z + cradleRoof.depth / 2 + 0.42;
      const cradle = new THREE.Group();
      const platform = new THREE.Mesh(unitBox, unitMetalMaterial);
      platform.position.set(cradleX, platformY, cradleZ);
      platform.scale.set(2.4, 0.18, 0.62);
      cradle.add(platform);
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(unitBox, brightMetalMaterial);
        rail.position.set(cradleX, platformY + 0.58, cradleZ + side * 0.26);
        rail.scale.set(2.4, 0.06, 0.06);
        cradle.add(rail);
        for (const offset of [-1.05, 0, 1.05]) {
          const post = new THREE.Mesh(unitBox, brightMetalMaterial);
          post.position.set(cradleX + offset, platformY + 0.32, cradleZ + side * 0.26);
          post.scale.set(0.05, 0.56, 0.05);
          cradle.add(post);
        }
      }
      for (const offset of [-0.9, 0.9]) {
        const cable = new THREE.Mesh(unitBox, brightMetalMaterial);
        cable.position.set(cradleX + offset, (roofY + platformY) / 2, cradleZ);
        cable.scale.set(0.035, roofY - platformY, 0.035);
        cradle.add(cable);
        const end = new THREE.Mesh(unitBox, warningMaterial);
        end.position.set(cradleX + offset * 1.2, platformY + 0.25, cradleZ);
        end.scale.set(0.08, 0.5, 0.5);
        cradle.add(end);
      }
      const anchor = new THREE.Mesh(unitBox, warningMaterial);
      anchor.position.set(cradleX, roofY + 0.06, cradleZ - 0.3);
      anchor.scale.set(1.8, 0.08, 0.12);
      cradle.add(anchor);
      const cradleLight = new THREE.Mesh(sphereGeometry, beaconMaterial);
      cradleLight.position.set(cradleX + 0.98, platformY + 0.72, cradleZ);
      cradleLight.scale.setScalar(0.07);
      cradle.add(cradleLight);
      city.add(cradle);
    }

    function update(elapsed) {
      if (rotorMesh) {
        turbines.forEach((turbine, index) => {
          dummy.position.set(turbine.x, turbine.y, turbine.z);
          dummy.rotation.set(0, turbine.phase + elapsed * turbine.speed, 0);
          dummy.scale.setScalar(turbine.scale);
          dummy.updateMatrix();
          rotorMesh.setMatrixAt(index, dummy.matrix);
        });
        rotorMesh.instanceMatrix.needsUpdate = true;
      }
      beaconMaterial.opacity = 0.32 + Math.abs(Math.sin(elapsed * 2.2)) * 0.68;
    }

    return { update };
  }

  for (let x = -60; x <= 60; x += 12) {
    for (let z = -72; z <= 48; z += 12) {
      if (Math.abs(x) < 7 || (Math.abs(x) < 14 && z < -36)) continue;
      const centerBoost = 1 - Math.min(Math.abs(x) / 100, 0.45);
      let height = (9 + random() * 38) * centerBoost;
      if (z > 24) height *= 0.52;
      const width = 6.5 + random() * 3;
      const depth = 6.5 + random() * 3;
      const material = buildingMaterials[Math.floor(random() * buildingMaterials.length)];
      const building = addBlock(x, height / 2, z, width, height, depth, material);
      roofs.push({ x, z, width, depth, height });
      if (random() > 0.76) addNeonFrame(building, width, height, depth, NEON[Math.floor(random() * NEON.length)]);
      if (random() > 0.66) {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.16, height * 0.72), new THREE.MeshBasicMaterial({
          color: NEON[Math.floor(random() * NEON.length)], transparent: true, opacity: 0.9, toneMapped: false,
        }));
        strip.position.set(x + width * 0.28, height * 0.51, z + depth / 2 + 0.02);
        city.add(strip);
      }
    }
  }

  addBlock(0, 14, -49, 18, 28, 16, buildingMaterials[0]);
  addBlock(0, 35, -49, 13, 14, 13, buildingMaterials[2]);
  addBlock(0, 48, -49, 8, 12, 9, buildingMaterials[0]);
  addBlock(0, 60, -49, 2.4, 13, 2.4, darkMaterial);
  addBlock(0, 70, -49, 0.22, 9, 0.22, new THREE.MeshBasicMaterial({ color: 0xf5ec16, toneMapped: false }));
  addNeonFrame({ position: new THREE.Vector3(0, 35, -49) }, 13, 14, 13, 0x29ddff);
  roofs.push(
    { x: 0, z: -49, width: 18, depth: 16, height: 28, deckOnly: true },
    { x: 0, z: -49, width: 13, depth: 13, height: 42, deckOnly: true },
    { x: 0, z: -49, width: 8, depth: 9, height: 54, deckOnly: true },
  );

  const rooftop = addRooftopDetails();

  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x080a0e, roughness: 0.15, metalness: 0.92 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(11, 170), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.015, -10);
  city.add(road);
  const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(160, 10), roadMaterial);
  crossRoad.rotation.x = -Math.PI / 2;
  crossRoad.position.set(0, 0.02, -5);
  city.add(crossRoad);

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xe6d91c, transparent: true, opacity: 0.5, toneMapped: false });
  for (let z = -88; z < 72; z += 8) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 3.4), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.04, z);
    city.add(line);
  }
  for (let x = -75; x < 75; x += 8) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.08), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.045, -5);
    city.add(line);
  }

  function addSign(title, subtitle, color, position, width = 12, height = 5, rotation = 0) {
    const material = new THREE.MeshBasicMaterial({
      map: createSignTexture(title, subtitle, color), transparent: true,
      side: THREE.DoubleSide, toneMapped: false,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    sign.position.set(...position);
    sign.rotation.y = rotation;
    city.add(sign);
    signs.push(sign);
    return sign;
  }

  addSign('NO FUTURE', 'MAKE YOUR OWN LEGEND', '#f5ec16', [-20, 27, -15], 14, 5.8, 0.08);
  addSign('夜 CITY', 'AFTER DARK // ALWAYS AWAKE', '#ff257f', [24, 20, -25], 13, 5.4, -0.18);
  addSign('RIPPERDOC', 'CHROME UP // 24H', '#29ddff', [-36, 15, 3], 10, 4.2, 0.28);
  addSign('AFTERLIFE', 'LEGENDS NEVER DIE', '#f5ec16', [36, 11, 9], 11, 4.6, -0.32);
  addSign('DELAMAIN', 'LEAVE THE DRIVING TO US', '#29ddff', [12, 33, -57], 9, 3.8, 0);

  const posterMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  new THREE.TextureLoader().load('/edgerunners-poster.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    posterMaterial.map = texture;
    posterMaterial.needsUpdate = true;
  });
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(17, 9.56), posterMaterial);
  poster.position.set(27, 32, -5);
  poster.rotation.y = -0.25;
  city.add(poster);
  const posterFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(17.5, 10.05, 0.15)), new THREE.LineBasicMaterial({ color: 0xff257f, toneMapped: false }));
  posterFrame.position.copy(poster.position);
  posterFrame.rotation.copy(poster.rotation);
  city.add(posterFrame);

  const hologram = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.09, 8, 96), new THREE.MeshBasicMaterial({ color: 0x29ddff, transparent: true, opacity: 0.75, toneMapped: false }));
  hologram.add(ring);
  const ringTwo = ring.clone();
  ringTwo.scale.setScalar(0.82);
  ringTwo.material = ring.material.clone();
  ringTwo.material.color.setHex(0xff257f);
  hologram.add(ringTwo);
  const holoText = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.15), new THREE.MeshBasicMaterial({
    map: createSignTexture('NC//77', 'NIGHT CITY', '#29ddff'), transparent: true, toneMapped: false,
  }));
  hologram.add(holoText);
  hologram.position.set(0, 58, -48.8);
  city.add(hologram);

  const vehicleGeometry = new THREE.BoxGeometry(0.55, 0.24, 1.8);
  for (let i = 0; i < 38; i += 1) {
    const aerial = i > 27;
    const color = NEON[i % 3];
    const material = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    const vehicle = new THREE.Mesh(vehicleGeometry, material);
    const trail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, aerial ? 7 : 3), new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.35, toneMapped: false,
    }));
    trail.position.z = aerial ? 4 : 2;
    vehicle.add(trail);
    const axis = aerial || i % 3 === 0 ? 'x' : 'z';
    const direction = i % 2 === 0 ? 1 : -1;
    const lane = axis === 'z' ? direction * 2.4 : -5 + direction * 2.1;
    vehicle.position.set(axis === 'x' ? (random() - 0.5) * 140 : lane, aerial ? 17 + random() * 30 : 0.3, axis === 'z' ? (random() - 0.5) * 140 : lane);
    if (axis === 'x') vehicle.rotation.y = Math.PI / 2;
    if (direction < 0) vehicle.rotation.y += Math.PI;
    city.add(vehicle);
    traffic.push({ mesh: vehicle, axis, direction, speed: (aerial ? 12 : 7) + random() * 10 });
  }

  return {
    group: city,
    update(delta, elapsed) {
      rooftop.update(elapsed);
      traffic.forEach(({ mesh, axis, direction, speed }) => {
        mesh.position[axis] += delta * speed * direction;
        if (mesh.position[axis] * direction > 78) mesh.position[axis] = -78 * direction;
      });
      signs.forEach((sign, index) => {
        const flicker = Math.sin(elapsed * (2.1 + index * 0.13) + index) > -0.94 ? 1 : 0.35;
        sign.material.opacity = (0.84 + Math.sin(elapsed * 0.7 + index) * 0.12) * flicker;
      });
      hologram.rotation.y = Math.sin(elapsed * 0.35) * 0.18;
      ring.rotation.z = elapsed * 0.12;
      ringTwo.rotation.z = -elapsed * 0.17;
    },
  };
}
