import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { STATION_CONFIG } from './station-config.js';
import { buildStationArchitecture } from './station-architecture.js';
import { createStationTrain } from './station-train.js';
import { createStationPassengers } from './station-passenger-view.js';
import { createBenchCommuter } from './station-bench.js';

const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);

export const SUBURB_VIEWS = {
  overview: { position: [142, 122, 190], target: [20, 2, -8] },
  houses: {
    position: [14, 30, -2], target: [100, 2, -28],
    mobile: { position: [4, 58, 44], target: [62, 6, -34] },
  },
  houses2: {
    position: [152, 17, -52], target: [82, 4, -34],
    mobile: { position: [146, 34, -60], target: [88, 6, -36] },
  },
  malls: { position: [8, 25, -2], target: [46, 3, 34] },
  street: { position: [-20, 9.2, 17], target: [18, 2.8, -3] },
  station: { position: [26, 18, -24], target: [-20, 8, -62] },
  bench: STATION_CONFIG.benchCamera,
  parks: { position: [-6, 22, 56], target: [-44, 2, 32] },
  school: { position: [-14, 20, -50], target: [-48, 3, -24] },
  church: { position: [0, 11, 26], target: [21, 7, 64] },
  sidewalks: { position: [-6, 3.4, 28], target: [0, 1.4, 2] },
};

function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  paint(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeAsphaltTexture(random) {
  const texture = canvasTexture(512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#1a1f25';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 12000; i += 1) {
      const value = 24 + Math.floor(random() * 34);
      ctx.fillStyle = `rgba(${value},${value + 3},${value + 7},${0.12 + random() * 0.24})`;
      const size = random() > 0.9 ? 2 : 1;
      ctx.fillRect(random() * width, random() * height, size, size);
    }
    for (let i = 0; i < 14; i += 1) {
      ctx.strokeStyle = `rgba(95,225,235,${0.04 + random() * 0.07})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const y = random() * height;
      ctx.moveTo(random() * width, y);
      ctx.bezierCurveTo(width * 0.3, y + 18, width * 0.7, y - 14, width, y + 4);
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

function makeLawnTexture(random) {
  const texture = canvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#2a5c37';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 32) {
      ctx.fillStyle = y % 64 ? 'rgba(90,164,106,.12)' : 'rgba(16,54,30,.12)';
      ctx.fillRect(0, y, width, 32);
    }
    for (let i = 0; i < 5200; i += 1) {
      const light = random();
      ctx.fillStyle = light > 0.965
        ? `rgba(150,255,196,${0.3 + random() * 0.4})`
        : `rgba(${54 + light * 46},${96 + light * 60},${58 + light * 34},.35)`;
      ctx.fillRect(random() * width, random() * height, 1, 1 + random() * 2);
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  return texture;
}

function makeConcreteTexture(random) {
  const texture = canvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#9aa3ab';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 3200; i += 1) {
      const value = 120 + Math.floor(random() * 75);
      ctx.fillStyle = `rgba(${value},${value + 4},${value + 8},.22)`;
      ctx.fillRect(random() * width, random() * height, 1 + random() * 2, 1);
    }
    ctx.strokeStyle = 'rgba(46,56,64,.30)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

function makeTowerWindowTexture(random) {
  const texture = canvasTexture(128, 256, (ctx, width, height) => {
    ctx.fillStyle = '#07060c';
    ctx.fillRect(0, 0, width, height);
    for (let y = 6; y < height - 4; y += 12) {
      for (let x = 5; x < width - 4; x += 11) {
        const lit = random() > 0.62;
        ctx.fillStyle = lit
          ? (random() > 0.82 ? '#ffb26b' : '#ff3a54')
          : '#170d18';
        ctx.globalAlpha = lit ? 0.5 + random() * 0.5 : 0.8;
        ctx.fillRect(x, y, 4, 5);
      }
    }
    ctx.globalAlpha = 1;
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  return texture;
}

function makeSignTexture({ title, sub = '', accent = '#6ff4ff', bg = '#07131d', align = 'center' }) {
  return canvasTexture(1024, 256, (ctx, width, height) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(0, 0, width, 9);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 3;
    ctx.strokeRect(13, 13, width - 26, height - 26);
    ctx.globalAlpha = 1;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    const x = align === 'center' ? width / 2 : 46;
    ctx.fillStyle = accent;
    ctx.font = '700 23px "Space Mono", monospace';
    ctx.globalAlpha = 0.92;
    ctx.fillText(sub.toUpperCase(), x, 62);
    ctx.globalAlpha = 1;
    let size = 132;
    ctx.font = `italic 900 ${size}px "Arial Narrow", Arial, sans-serif`;
    while (ctx.measureText(title).width > width - 108 && size > 46) {
      size -= 6;
      ctx.font = `italic 900 ${size}px "Arial Narrow", Arial, sans-serif`;
    }
    ctx.fillStyle = '#f3f7fa';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 22;
    ctx.textBaseline = 'middle';
    ctx.fillText(title.toUpperCase(), x, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.8;
    ctx.font = '700 19px "Space Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('NC // 2077', width - 34, height - 28);
    ctx.globalAlpha = 1;
  });
}

function makeLedWallTexture(random) {
  const texture = canvasTexture(512, 256, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#04121a');
    gradient.addColorStop(0.55, '#0a2330');
    gradient.addColorStop(1, '#1b0d22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(80,232,255,.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,190,92,.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(66, height - 24);
    ctx.lineTo(66, 168);
    ctx.lineTo(146, 168);
    ctx.lineTo(146, 96);
    ctx.lineTo(236, 96);
    ctx.lineTo(236, 138);
    ctx.lineTo(318, 138);
    ctx.lineTo(318, 58);
    ctx.lineTo(430, 58);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,244,255,.55)';
    for (let i = 0; i < 90; i += 1) {
      const x = 36 + random() * (width - 72);
      const y = 30 + random() * (height - 60);
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = '#dffbff';
    ctx.font = '700 26px "Space Mono", monospace';
    ctx.fillText('ARASAKA', 34, 46);
    ctx.fillStyle = 'rgba(255,189,90,.9)';
    ctx.font = '700 16px "Space Mono", monospace';
    ctx.fillText('SMART ESTATE // PRIVATE', 34, 70);
  });
  return texture;
}

function makeAdTexture() {
  return canvasTexture(512, 1024, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#07172b');
    gradient.addColorStop(0.45, '#34204a');
    gradient.addColorStop(1, '#a51648');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-0.42);
    ctx.fillStyle = 'rgba(108,240,255,.16)';
    ctx.fillRect(-360, -80, 720, 46);
    ctx.fillRect(-360, 92, 720, 16);
    ctx.fillStyle = 'rgba(255,197,92,.30)';
    ctx.fillRect(-360, 20, 500, 8);
    ctx.restore();
    ctx.strokeStyle = 'rgba(151,246,255,.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = 'italic 900 118px "Arial Narrow", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MERIDIAN', width / 2, 950);
    ctx.fillStyle = '#7befff';
    ctx.font = '700 25px "Space Mono", monospace';
    ctx.fillText('SUMMIT RIDGE // LEVEL 04', width / 2, 992);
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath();
    ctx.arc(width / 2, 330, 168, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, 330, 138, 0.3, 4.2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath();
    ctx.arc(width / 2, 330, 96, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe0a3';
    ctx.font = '700 30px "Space Mono", monospace';
    ctx.fillText('NEW SEASON', width / 2, 540);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.font = '400 22px "Space Mono", monospace';
    ctx.fillText('AUTO // BEAUTY // BIO', width / 2, 580);
  });
}

function makeWayfinderTexture() {
  return canvasTexture(512, 512, (ctx, width, height) => {
    ctx.fillStyle = '#06131b';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(100,235,255,.4)';
    ctx.lineWidth = 2;
    for (let x = 32; x < width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 26);
      ctx.lineTo(x, height - 26);
      ctx.stroke();
    }
    for (let y = 32; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(width - 24, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#ffbd5a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(96, 400);
    ctx.lineTo(96, 240);
    ctx.lineTo(248, 240);
    ctx.lineTo(248, 140);
    ctx.lineTo(390, 140);
    ctx.stroke();
    ctx.fillStyle = '#75f3ff';
    [[96, 400], [96, 240], [248, 240], [248, 140], [390, 140]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, TAU);
      ctx.fill();
    });
    ctx.fillStyle = '#f0fbff';
    ctx.font = '700 30px "Space Mono", monospace';
    ctx.fillText('SUMMIT RIDGE', 46, 68);
    ctx.fillStyle = '#76efff';
    ctx.font = '400 18px "Space Mono", monospace';
    ctx.fillText('SECTOR MAP // PUBLIC ACCESS', 46, 100);
    ctx.fillStyle = '#ffcc7d';
    ctx.font = '700 17px "Space Mono", monospace';
    ctx.fillText('NC TRANSIT', 320, 390);
    ctx.fillText('MERIDIAN', 300, 300);
    ctx.fillText('ACADEMY', 250, 205);
    ctx.fillStyle = '#8fffc2';
    ctx.fillText('SUMMIT GREEN', 60, 330);
  });
}

function makeAvPadTexture() {
  return canvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#101820';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#63f1ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(128, 128, 96, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(128, 128, 72, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#8ff7ff';
    ctx.font = 'italic 900 88px "Arial Narrow", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AV', 128, 126);
    ctx.fillStyle = '#ffc265';
    ctx.font = '700 16px "Space Mono", monospace';
    ctx.fillText('SKYPORT 07', 128, 190);
  });
}

function makePoolTexture() {
  const texture = canvasTexture(128, 128, (ctx, width, height) => {
    ctx.fillStyle = '#0b5666';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(130,245,255,.4)';
    ctx.lineWidth = 2;
    for (let y = 10; y < height; y += 18) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin(x * 0.11 + y) * 4;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

function makeSunTexture() {
  return canvasTexture(256, 256, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, 'rgba(255,252,235,1)');
    gradient.addColorStop(0.16, 'rgba(255,244,205,.95)');
    gradient.addColorStop(0.34, 'rgba(255,228,158,.4)');
    gradient.addColorStop(1, 'rgba(255,216,132,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

function makeCloudTexture() {
  return canvasTexture(256, 128, (ctx) => {
    [[70, 72, 46], [120, 58, 52], [172, 72, 42], [100, 88, 38], [146, 92, 32]].forEach(([x, y, radius]) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,.85)');
      gradient.addColorStop(0.55, 'rgba(255,255,255,.42)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fill();
    });
  });
}

export function buildSuburbs(scene, { onAudio, reducedMotion = false } = {}) {
  const random = seededRandom(24072077);
  const group = new THREE.Group();
  group.name = 'Summit Ridge Suburbs';
  scene.add(group);

  const buckets = new Map();
  const dummy = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  const localMatrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const vector = new THREE.Vector3();

  function addGeo(material, geometry) {
    if (!buckets.has(material)) buckets.set(material, []);
    buckets.get(material).push(geometry);
  }

  function composeAt(geometry, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    quaternion.setFromEuler(new THREE.Euler(rx, ry, rz));
    matrix.compose(vector.set(x, y, z), quaternion, new THREE.Vector3(sx, sy, sz));
    geometry.applyMatrix4(matrix);
    return geometry;
  }

  function addBox(material, x, y, z, width, height, depth, rx = 0, ry = 0, rz = 0) {
    addGeo(material, composeAt(new THREE.BoxGeometry(width, height, depth), x, y, z, rx, ry, rz));
  }

  function addCyl(material, x, y, z, radiusTop, radiusBottom, height, segments = 10, rx = 0, ry = 0, rz = 0) {
    addGeo(material, composeAt(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), x, y, z, rx, ry, rz));
  }

  function addCone(material, x, y, z, radius, height, segments = 12, rx = 0, ry = 0, rz = 0) {
    addGeo(material, composeAt(new THREE.ConeGeometry(radius, height, segments), x, y, z, rx, ry, rz));
  }

  function addSphere(material, x, y, z, radius, widthSegments = 10, heightSegments = 7, sy = 1) {
    addGeo(material, composeAt(new THREE.SphereGeometry(radius, widthSegments, heightSegments), x, y, z, 0, 0, 0, 1, sy, 1));
  }

  function addPanel(material, x, y, z, width, height, ry = 0, rx = 0) {
    addGeo(material, composeAt(new THREE.PlaneGeometry(width, height), x, y, z, rx, ry, 0));
  }

  function localBox(parent, material, x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.applyMatrix4(localMatrix.compose(vector.set(x, y, z), quaternion.identity(), new THREE.Vector3(1, 1, 1)));
    geometry.applyMatrix4(parent);
    addGeo(material, geometry);
  }

  function localPanel(parent, material, x, y, z, width, height, ry = 0) {
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.applyMatrix4(localMatrix.compose(
      vector.set(x, y, z),
      quaternion.setFromEuler(new THREE.Euler(0, ry, 0)),
      new THREE.Vector3(1, 1, 1),
    ));
    geometry.applyMatrix4(parent);
    addGeo(material, geometry);
  }

  // --- Palette ------------------------------------------------------------
  const asphaltTexture = makeAsphaltTexture(random);
  const lawnTexture = makeLawnTexture(random);
  const concreteTexture = makeConcreteTexture(random);

  const asphalt = new THREE.MeshStandardMaterial({ color: 0xffffff, map: asphaltTexture, roughness: 0.72, metalness: 0.16 });
  const lotAsphalt = new THREE.MeshStandardMaterial({ color: 0x929ba2, map: asphaltTexture, roughness: 0.78, metalness: 0.12 });
  const lawn = new THREE.MeshStandardMaterial({ color: 0xffffff, map: lawnTexture, roughness: 0.92 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe6ebee, roughness: 0.46, metalness: 0.1 });
  const warmWhite = new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.56, metalness: 0.08 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTexture, roughness: 0.68, metalness: 0.1 });
  const concreteDark = new THREE.MeshStandardMaterial({ color: 0x515b64, roughness: 0.76, metalness: 0.14 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.32, metalness: 0.62 });
  const carbonSoft = new THREE.MeshStandardMaterial({ color: 0x242a32, roughness: 0.48, metalness: 0.4 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xb8c4cc, roughness: 0.2, metalness: 0.92 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x1a4054, roughness: 0.08, metalness: 0.94,
    emissive: 0x0a2b3c, emissiveIntensity: 0.5, side: THREE.DoubleSide,
  });
  const darkGlass = new THREE.MeshStandardMaterial({
    color: 0x0d1922, roughness: 0.12, metalness: 0.9,
    emissive: 0x113646, emissiveIntensity: 0.35,
  });
  const terracotta = new THREE.MeshStandardMaterial({ color: 0x9a4b34, roughness: 0.7, metalness: 0.06 });
  const fieldGreen = new THREE.MeshStandardMaterial({ color: 0x2e6641, roughness: 0.9 });
  const dirt = new THREE.MeshStandardMaterial({ color: 0x8b6b4a, roughness: 0.95 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6b52, roughness: 0.8 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x222c31, roughness: 0.95 });
  const solar = new THREE.MeshStandardMaterial({ color: 0x122a3e, roughness: 0.18, metalness: 0.8 });
  const hedge = new THREE.MeshStandardMaterial({ color: 0x235237, roughness: 0.94 });
  const meadow = new THREE.MeshStandardMaterial({ color: 0x315b41, roughness: 0.97 });

  const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x6ef4ff });
  const amberGlow = new THREE.MeshBasicMaterial({ color: 0xffbf5e });
  const redGlow = new THREE.MeshBasicMaterial({ color: 0xff3552 });
  const whiteGlow = new THREE.MeshBasicMaterial({ color: 0xf3fbff });
  const greenGlow = new THREE.MeshBasicMaterial({ color: 0x9dffc4 });
  const magentaGlow = new THREE.MeshBasicMaterial({ color: 0xff4f9d });
  const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xa9b8bd });
  const laneGlow = new THREE.MeshBasicMaterial({ color: 0x4fe7ff });
  const laneAmber = new THREE.MeshBasicMaterial({ color: 0xffb64a });
  const bollardGlow = new THREE.MeshBasicMaterial({ color: 0xff4862, transparent: true, opacity: 0.8 });
  const poolTexture = makePoolTexture();
  const poolWater = new THREE.MeshStandardMaterial({
    color: 0x1ba1b8, map: poolTexture, roughness: 0.16, metalness: 0.35,
    emissive: 0x0d6473, emissiveIntensity: 0.55, transparent: true, opacity: 0.92,
  });

  const ledWallMaterial = new THREE.MeshBasicMaterial({ map: makeLedWallTexture(random) });
  const adTexture = makeAdTexture();
  const adMaterial = new THREE.MeshBasicMaterial({ map: adTexture, side: THREE.DoubleSide });
  const wayfinderMaterial = new THREE.MeshBasicMaterial({ map: makeWayfinderTexture(), side: THREE.DoubleSide });
  const avPadMaterial = new THREE.MeshBasicMaterial({ map: makeAvPadTexture(), transparent: true, depthWrite: false });
  const sentrySignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'ARASAKA', sub: 'BIOMETRIC ACCESS // ESTATES', accent: '#ff5b72', align: 'left' }),
    side: THREE.DoubleSide,
  });
  const sentryStreetSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'MILITECH', sub: 'AUTONOMOUS SENTRY GRID', accent: '#6ff4ff', align: 'left' }),
    side: THREE.DoubleSide,
  });
  const bioSignTexture = makeSignTexture({ title: 'BIO//DISPENSARY', sub: 'AUTOMATED CARE POD', accent: '#8dffd0', align: 'left' });
  const bioSignMaterial = new THREE.MeshBasicMaterial({ map: bioSignTexture, side: THREE.DoubleSide, transparent: true });
  const stationSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT STATION', sub: 'NC TRANSIT // BADGE ACCESS ONLY', accent: '#66efff' }),
    side: THREE.DoubleSide,
  });
  const stationWestSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT WEST', sub: 'NC TRANSIT // PLATFORM 02', accent: '#ffd27d' }),
    side: THREE.DoubleSide,
  });
  const stationWarningMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'ARMED TRANSIT', sub: 'MONORAIL PERIMETER // MILITECH', accent: '#ff5b72', align: 'left' }),
    side: THREE.DoubleSide,
  });
  const mallSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'MERIDIAN MALL', sub: 'RETAIL // DINING // CINEMA', accent: '#ffc46b' }),
    side: THREE.DoubleSide,
  });
  const retailSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'MERIDIAN ROW', sub: 'CURATED RETAIL ARCADE', accent: '#6ff4ff' }),
    side: THREE.DoubleSide,
  });
  const habitatSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'HABITAT', sub: 'HOME SYSTEMS // BIG BOX', accent: '#ff8a5b' }),
    side: THREE.DoubleSide,
  });
  const schoolSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT ACADEMY', sub: 'ELEMENTARY // MIDDLE // HIGH', accent: '#79f0ff' }),
    side: THREE.DoubleSide,
  });
  const churchSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'ST. ADRIAN', sub: 'CHAPEL // ALL WELCOME', accent: '#ffc979' }),
    side: THREE.DoubleSide,
  });
  const communitySignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'COMMUNITY AID', sub: 'SUMMIT RIDGE CIVIC', accent: '#8fffc2', align: 'left' }),
    side: THREE.DoubleSide,
  });
  const parkSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT GREEN', sub: 'PARKS // RECREATION', accent: '#a4ffb8' }),
    side: THREE.DoubleSide,
  });
  const poolSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'AQUATIC CLUB', sub: 'MEMBERS // COMMUNITY', accent: '#73f2ff', align: 'left' }),
    side: THREE.DoubleSide,
  });
  const estateSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT ESTATES', sub: 'ARASAKA RESIDENTIAL // PRIVATE', accent: '#ffc46b' }),
    side: THREE.DoubleSide,
  });
  const rowSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT ROW', sub: 'RESIDENTIAL // PHASE 02', accent: '#ffd28a' }),
    side: THREE.DoubleSide,
  });
  const transitStopMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'NC TRANSIT', sub: 'SUMMIT LOOP // LINE 09', accent: '#7df4ff', align: 'left' }),
    side: THREE.DoubleSide,
  });
  const playSignMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'SUMMIT PLAY', sub: "CHILDREN'S PARK // ALL AGES", accent: '#a4ffb8' }),
    side: THREE.DoubleSide,
  });
  const vendorNoodleMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'NOODLE BAR', sub: 'HOT SYNTH STOCK // 24H', accent: '#ffbc66' }),
    side: THREE.DoubleSide,
  });
  const vendorTacoMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'TACO RIDE', sub: 'GRILLED PROTEIN // NC', accent: '#ff6f8e' }),
    side: THREE.DoubleSide,
  });
  const vendorJuiceMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'BIO SMOOTH', sub: 'COLD PRESS // DAILY', accent: '#7dffcf' }),
    side: THREE.DoubleSide,
  });
  const playRed = new THREE.MeshStandardMaterial({ color: 0xd34a5c, roughness: 0.5, metalness: 0.18 });
  const playGold = new THREE.MeshStandardMaterial({ color: 0xf2b13c, roughness: 0.46, metalness: 0.2 });
  const playTeal = new THREE.MeshStandardMaterial({ color: 0x2fa8a2, roughness: 0.5, metalness: 0.18 });
  const sand = new THREE.MeshStandardMaterial({ color: 0xc7ab7c, roughness: 1 });

  // --- Atmosphere --------------------------------------------------------
  const sunTexture = makeSunTexture();
  const sunGroup = new THREE.Group();
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture, color: 0xfff1c8, transparent: true, depthWrite: false, fog: false, toneMapped: false,
  }));
  sunDisc.position.set(-168, 98, -150);
  sunDisc.scale.set(64, 64, 1);
  sunGroup.add(sunDisc);
  const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture, color: 0xffd98c, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
  }));
  sunHalo.position.copy(sunDisc.position);
  sunHalo.scale.set(215, 215, 1);
  sunGroup.add(sunHalo);
  group.add(sunGroup);

  const cloudMaterial = new THREE.SpriteMaterial({
    map: makeCloudTexture(), color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false, fog: false,
  });
  [
    [-150, 122, -186, 150, 54], [82, 140, -200, 172, 60], [192, 126, -28, 132, 46],
    [-212, 136, 58, 152, 52], [40, 156, 186, 182, 60], [-44, 122, -88, 116, 40],
  ].forEach(([x, y, z, width, height]) => {
    const cloud = new THREE.Sprite(cloudMaterial);
    cloud.position.set(x, y, z);
    cloud.scale.set(width, height, 1);
    group.add(cloud);
  });

  const sunLight = new THREE.DirectionalLight(0xffe6c2, 2.1);
  sunLight.position.set(60, 92, 44);
  group.add(sunLight);
  const skyLight = new THREE.HemisphereLight(0xc4e4ff, 0x20352c, 1.25);
  group.add(skyLight);
  const rimLight = new THREE.DirectionalLight(0x8fd8ff, 0.55);
  rimLight.position.set(-48, 46, -64);
  group.add(rimLight);

  // --- Terrain and road network ------------------------------------------
  addBox(new THREE.MeshStandardMaterial({ color: 0x2a4a37, roughness: 0.94 }), 0, -0.2, 4, 380, 0.4, 330);
  addBox(meadow, -122, 0.01, 92, 124, 0.03, 118);
  addBox(meadow, 122, 0.01, 106, 96, 0.03, 104);
  addBox(meadow, -118, 0.01, -100, 116, 0.03, 92);
  addBox(lawn, 42, 0.08, -32, 58, 0.16, 58);
  addBox(lawn, 118, 0.05, -41, 104, 0.1, 46);
  addBox(concrete, 43, 0.08, 36, 52, 0.16, 52);
  addBox(lawn, -43, 0.08, 35, 50, 0.16, 46);
  addBox(lawn, -47, 0.08, -24, 42, 0.16, 37);
  addBox(lawn, 26, 0.08, 76, 38, 0.16, 33);

  addBox(asphalt, 0, 0.02, 0, 336, 0.16, 12);
  addBox(asphalt, 0, 0.02, -4, 8, 0.16, 312);

  // --- Curved suburb drive, junction roundabout and Summit Row ------------
  const junction = { x: 62, z: -40 };
  const junctionRadius = 9;
  const rowEnd = { x: 163, z: -40 };
  const rowEndRadius = 7.5;
  const driveCurve = new THREE.CubicBezierCurve(
    new THREE.Vector2(34, -4),
    new THREE.Vector2(34, -26),
    new THREE.Vector2(44, -40),
    new THREE.Vector2(56, -40),
  );

  function drivePoint(t) {
    return driveCurve.getPoint(t);
  }

  function driveTangent(t) {
    return driveCurve.getTangent(t).normalize();
  }

  function addRibbon(material, innerOffset, outerOffset, y, tStart = 0, tEnd = 1, segments = 56) {
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = tStart + (tEnd - tStart) * (i / segments);
      const center = drivePoint(t);
      const tangent = driveTangent(t);
      positions.push(center.x - tangent.y * innerOffset, y, center.y + tangent.x * innerOffset);
      positions.push(center.x - tangent.y * outerOffset, y, center.y + tangent.x * outerOffset);
      uvs.push(0, (i / segments) * 9, 1, (i / segments) * 9);
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    addGeo(material, geometry);
  }

  function addSidewalkArc(cx, cz, inner, outer, thetaStart, thetaLength, y = 0.25) {
    const geometry = new THREE.RingGeometry(inner, outer, 64, 1, thetaStart, thetaLength);
    geometry.rotateX(-Math.PI / 2);
    addGeo(concrete, composeAt(geometry, cx, y, cz));
  }

  function addTrashBin(x, z, ground, accent, yaw = 0) {
    addCyl(carbon, x, ground + 0.44, z, 0.34, 0.3, 0.88, 12);
    addCyl(concreteDark, x, ground + 0.9, z, 0.36, 0.36, 0.07, 12);
    addCyl(accent, x, ground + 0.6, z, 0.345, 0.345, 0.05, 12);
    addBox(carbon, x + Math.sin(yaw) * 0.32, ground + 0.72, z + Math.cos(yaw) * 0.32, 0.3, 0.16, 0.07, 0, yaw, 0);
    addBox(accent, x + Math.sin(yaw) * 0.37, ground + 0.88, z + Math.cos(yaw) * 0.37, 0.22, 0.025, 0.05, 0, yaw, 0);
  }

  addRibbon(asphalt, -4.5, 4.5, 0.22);
  addRibbon(concrete, 4.72, 7.2, 0.25, 0.085, 0.86);
  addRibbon(concrete, -7.2, -4.72, 0.25, 0.085, 0.86);
  addRibbon(concreteDark, 4.5, 4.72, 0.245, 0.02, 0.86);
  addRibbon(concreteDark, -4.72, -4.5, 0.245, 0.02, 0.86);
  addRibbon(laneGlow, 3.95, 4.05, 0.235, 0.03, 0.9);
  addRibbon(laneGlow, -4.05, -3.95, 0.235, 0.03, 0.9);

  for (let t = 0.09; t < 0.86; t += 0.075) {
    const point = drivePoint(t);
    const tangent = driveTangent(t);
    addBox(markingMaterial, point.x, 0.235, point.y, 0.16, 0.02, 2.3, 0, Math.atan2(tangent.x, tangent.y), 0);
  }

  // Junction roundabout where the drive meets Summit Row.
  addGeo(asphalt, composeAt(new THREE.CylinderGeometry(junctionRadius, junctionRadius, 0.12, 64), junction.x, 0.16, junction.z));
  addBox(asphalt, 113.5, 0.16, -40, 93, 0.12, 7);
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(junctionRadius - 0.15, 0.055, 6, 72), junction.x, 0.235, junction.z, Math.PI / 2, 0, 0));
  for (let i = 0; i < 20; i += 1) {
    const angle = (i / 20) * TAU;
    addBox(markingMaterial, junction.x + Math.cos(angle) * 6.7, 0.235, junction.z + Math.sin(angle) * 6.7, 0.14, 0.02, 0.9, 0, -angle, 0);
  }
  addGeo(concrete, composeAt(new THREE.RingGeometry(3.9, 5.3, 48), junction.x, 0.228, junction.z, -Math.PI / 2, 0, 0));
  addCyl(concreteDark, junction.x, 0.33, junction.z, 3.9, 4.02, 0.26, 44);
  addGeo(lawn, composeAt(new THREE.CircleGeometry(3.7, 44), junction.x, 0.47, junction.z, -Math.PI / 2, 0, 0));
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(3.72, 0.04, 5, 56), junction.x, 0.49, junction.z, Math.PI / 2, 0, 0));
  addCyl(chrome, junction.x, 2.0, junction.z, 0.34, 0.52, 3.2, 10);
  addSphere(new THREE.MeshStandardMaterial({ color: 0x14343c, roughness: 0.18, metalness: 0.95, emissive: 0x07262c, emissiveIntensity: 0.6 }), junction.x, 4.35, junction.z, 1.0, 18, 12);
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(1.3, 0.03, 6, 48), junction.x, 4.35, junction.z, Math.PI / 2, 0, 0));
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * TAU + 0.4;
    addSphere(hedge, junction.x + Math.cos(angle) * 2.9, 1.0, junction.z + Math.sin(angle) * 2.9, 0.66, 8, 6, 0.8);
  }

  // East end of Summit Row becomes a proper turning circle.
  addGeo(asphalt, composeAt(new THREE.CylinderGeometry(rowEndRadius, rowEndRadius, 0.12, 48), rowEnd.x, 0.16, rowEnd.z));
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(rowEndRadius - 0.15, 0.05, 6, 64), rowEnd.x, 0.235, rowEnd.z, Math.PI / 2, 0, 0));
  addGeo(concrete, composeAt(new THREE.RingGeometry(3.4, 4.15, 40), rowEnd.x, 0.228, rowEnd.z, -Math.PI / 2, 0, 0));
  addCyl(concreteDark, rowEnd.x, 0.33, rowEnd.z, 3.35, 3.46, 0.26, 36);
  addGeo(lawn, composeAt(new THREE.CircleGeometry(3.2, 36), rowEnd.x, 0.47, rowEnd.z, -Math.PI / 2, 0, 0));
  addCyl(chrome, rowEnd.x, 1.9, rowEnd.z, 0.16, 0.24, 2.6, 8);
  addSphere(amberGlow, rowEnd.x, 3.35, rowEnd.z, 0.52, 12, 8);
  addGeo(amberGlow, composeAt(new THREE.TorusGeometry(0.72, 0.03, 5, 32), rowEnd.x, 3.35, rowEnd.z, Math.PI / 2, 0, 0));
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * TAU + 0.8;
    addSphere(hedge, rowEnd.x + Math.cos(angle) * 2.5, 0.9, rowEnd.z + Math.sin(angle) * 2.5, 0.58, 8, 6, 0.8);
  }
  addBox(carbon, rowEnd.x - 2.6, 1.45, rowEnd.z - 1.5, 0.14, 2.2, 0.14);
  addBox(carbon, rowEnd.x - 2.6, 1.45, rowEnd.z + 1.5, 0.14, 2.2, 0.14);
  addPanel(rowSignMaterial, rowEnd.x - 2.55, 2.1, rowEnd.z, 3.6, 1.0, -Math.PI / 2);

  // Continuous sidewalks around both circles and along the row.
  addSidewalkArc(junction.x, junction.z, 9.3, 11.7, 0, TAU);
  // Drive and row asphalt sit over the ring at the two mouths so the walk stays unbroken.
  addRibbon(asphalt, -4.64, 4.64, 0.256, 0.845, 1, 14);
  addBox(asphalt, 72.55, 0.242, -40, 3.6, 0.032, 7.3);
  addSidewalkArc(rowEnd.x, rowEnd.z, 7.7, 9.8, Math.PI * 1.11, Math.PI * 1.78);
  addBox(concrete, 112, 0.14, -35.3, 84, 0.2, 2.4);
  addBox(concrete, 112, 0.14, -44.7, 84, 0.2, 2.4);
  addBox(concreteDark, 112, 0.245, -36.55, 84, 0.03, 0.12);
  addBox(concreteDark, 112, 0.245, -43.45, 84, 0.03, 0.12);
  addBox(concrete, 70.2, 0.14, -35.15, 2.8, 0.2, 3.0);
  addBox(concrete, 70.2, 0.14, -44.85, 2.8, 0.2, 3.0);
  addBox(concrete, 153.6, 0.14, -35.15, 2.8, 0.2, 3.0);
  addBox(concrete, 153.6, 0.14, -44.85, 2.8, 0.2, 3.0);
  addBox(concrete, 28.9, 0.15, -8.3, 1.8, 0.2, 3.0);
  addBox(concrete, 39.1, 0.15, -8.3, 1.8, 0.2, 3.0);

  // Bins along the estate loop.
  addTrashBin(75.2, -34.35, 0.24, cyanGlow, Math.PI);
  addTrashBin(79.4, -34.35, 0.24, amberGlow, Math.PI);
  addTrashBin(108, -34.35, 0.24, cyanGlow, Math.PI);
  addTrashBin(137, -34.35, 0.24, amberGlow, Math.PI);
  addTrashBin(75.2, -45.55, 0.24, amberGlow, 0);
  addTrashBin(94, -45.55, 0.24, cyanGlow, 0);
  addTrashBin(123, -45.55, 0.24, amberGlow, 0);
  addTrashBin(149, -45.55, 0.24, cyanGlow, 0);
  addTrashBin(26.2, -8.9, 0.18, cyanGlow, Math.PI);
  addTrashBin(43.2, -8.9, 0.18, amberGlow, Math.PI);

  // Lane markings and pedestrian crossings.
  for (let x = 76; x <= 152; x += 8) {
    addBox(markingMaterial, x, 0.235, -40, 2.8, 0.02, 0.12);
  }
  addBox(laneGlow, 116.5, 0.235, -36.7, 87, 0.03, 0.06);
  addBox(laneGlow, 116.5, 0.235, -43.3, 87, 0.03, 0.06);
  for (let i = 0; i < 8; i += 1) {
    addBox(markingMaterial, 73.4, 0.262, -36.7 - i * 0.92, 1.9, 0.02, 0.5);
    addBox(markingMaterial, 152.6, 0.24, -36.7 - i * 0.92, 1.9, 0.02, 0.5);
  }
  const crossingT = 0.72;
  const crossingPoint = drivePoint(crossingT);
  const crossingTangent = driveTangent(crossingT);
  const crossingYaw = Math.atan2(-crossingTangent.y, crossingTangent.x);
  for (let i = -3; i <= 3; i += 1) {
    addBox(
      markingMaterial,
      crossingPoint.x - crossingTangent.y * i * 0.92,
      0.245,
      crossingPoint.y + crossingTangent.x * i * 0.92,
      2.5, 0.02, 0.5, 0, crossingYaw, 0,
    );
  }
  for (let i = 0; i < 7; i += 1) {
    addBox(markingMaterial, 30.1 + i * 1.28, 0.245, -8.3, 0.55, 0.02, 2.6);
  }

  addBox(concrete, 0, 0.08, 7.8, 336, 0.2, 3.6);
  addBox(concrete, 0, 0.08, -7.8, 336, 0.2, 3.6);
  addBox(concrete, 5.6, 0.08, -4, 3.2, 0.2, 312);
  addBox(concrete, -5.6, 0.08, -4, 3.2, 0.2, 312);
  addBox(concreteDark, 0, 0.14, 6.05, 336, 0.16, 0.28);
  addBox(concreteDark, 0, 0.14, -6.05, 336, 0.16, 0.28);

  // Lane markings and self-healing fiber seams.
  const dashPositions = [];
  for (let x = -164; x <= 164; x += 7) {
    dashPositions.push([x, 0.11, 3.3], [x, 0.11, -3.3]);
  }
  for (let z = -156; z <= 148; z += 8) {
    if (Math.abs(z) < 9) continue;
    dashPositions.push([2.55, 0.11, z], [-2.55, 0.11, z]);
  }
  const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(3.2, 0.03, 0.16), markingMaterial, dashPositions.length);
  dashPositions.forEach((position, i) => {
    dummy.position.set(...position);
    dummy.rotation.set(0, position[2] === 3.3 || position[2] === -3.3 ? 0 : Math.PI / 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dashMesh.setMatrixAt(i, dummy.matrix);
  });
  group.add(dashMesh);

  addBox(laneAmber, 0, 0.115, 0.3, 330, 0.03, 0.14);
  addBox(laneAmber, 0, 0.115, -0.3, 330, 0.03, 0.14);
  addBox(laneGlow, 0, 0.115, 5.55, 330, 0.03, 0.1);
  addBox(laneGlow, 0, 0.115, -5.55, 330, 0.03, 0.1);
  addBox(laneAmber, 0, 0.115, -4, 0.14, 0.03, 294);
  addBox(laneGlow, 3.7, 0.115, -4, 0.1, 0.03, 294);
  addBox(laneGlow, -3.7, 0.115, -4, 0.1, 0.03, 294);

  const crosswalk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.03, 4.6), markingMaterial, 28);
  let crossIndex = 0;
  for (let i = 0; i < 7; i += 1) {
    [-8.7, 8.7].forEach((x) => {
      dummy.position.set(x + (i - 3) * 0.85, 0.12, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      crosswalk.setMatrixAt(crossIndex, dummy.matrix);
      crossIndex += 1;
    });
    [-10.2, 10.2].forEach((z) => {
      dummy.position.set(0, 0.12, z + (i - 3) * 0.85);
      dummy.rotation.set(0, Math.PI / 2, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      crosswalk.setMatrixAt(crossIndex, dummy.matrix);
      crossIndex += 1;
    });
  }
  group.add(crosswalk);

  for (let i = 0; i < 14; i += 1) {
    addBox(laneGlow, -150 + random() * 300, 0.112, (random() - 0.5) * 9.4, 0.9 + random() * 3.6, 0.02, 0.055, 0, random() * Math.PI, 0);
  }
  for (let x = -46; x <= 46; x += 23) {
    addBox(carbonSoft, x, 0.11, 2.4, 3.4, 0.03, 1.4);
    addBox(laneAmber, x, 0.125, 1.72, 3.4, 0.02, 0.06);
    addBox(laneAmber, x, 0.125, 3.08, 3.4, 0.02, 0.06);
  }

  // --- Houses -------------------------------------------------------------
  function addHouseAt(x, z, yaw, variant, scale = 1) {
    const parent = new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.16, z),
      new THREE.Quaternion().setFromAxisAngle(UP, yaw),
      new THREE.Vector3(scale, scale, scale),
    );
    const accent = variant === 1 ? carbonSoft : white;

    localBox(parent, accent, 0, 2.1, 0, 10.6, 4.2, 7.6);
    localBox(parent, carbon, 0, 4.35, 0, 10.9, 0.32, 7.9);
    localBox(parent, white, -1.1, 5.9, 0, 6.6, 3.2, 5.6);
    localBox(parent, carbon, -1.1, 7.62, 0, 7.1, 0.3, 6.1);
    localBox(parent, darkGlass, 2.6, 2.35, 3.82, 4.6, 1.55, 0.1);
    localBox(parent, glowMatForVariant(variant), -2.9, 2.35, 3.86, 3.4, 1.55, 0.06);
    localBox(parent, glass, -1.1, 5.9, 2.84, 5.2, 1.5, 0.08);
    localBox(parent, carbon, 0, 7.85, 0, 8.4, 0.18, 6.6);
    localBox(parent, carbonSoft, 4.35, 3.0, 4.3, 1.1, 0.18, 3.4);
    localBox(parent, white, -6.1, 1.45, 0.8, 4.8, 2.9, 5.4);
    localBox(parent, carbon, -6.1, 1.6, 3.54, 4.1, 2.1, 0.12);
    localBox(parent, amberGlow, -6.1, 3.0, 3.62, 4.15, 0.07, 0.06);
    localBox(parent, carbon, 3.8, 3.0, 3.95, 3.4, 0.24, 2.1);
    localBox(parent, glass, 3.8, 2.25, 4.98, 2.5, 1.4, 0.08);
    localBox(parent, accent, -0.3, 0.05, 5.45, 3.2, 0.16, 3.5);
    localBox(parent, laneGlow, -0.3, 0.14, 7.15, 3.0, 0.03, 0.08);
    localBox(parent, asphalt, -6.1, 0.05, 5.0, 3.5, 0.1, 4.6);
    localBox(parent, lawn, 0, 0.02, -8.9, 12.4, 0.06, 8.8);
    localBox(parent, hedge, -4.6, 0.6, -6.6, 1.1, 1.2, 4.5);
    localBox(parent, hedge, 4.6, 0.6, -6.6, 1.1, 1.2, 4.5);
    localBox(parent, carbonSoft, -2.4, 8.1, 0.4, 1.3, 0.55, 1.1);
    localBox(parent, carbonSoft, 1.8, 8.1, -0.8, 1.1, 0.45, 1.5);
    localBox(parent, chrome, 1.8, 8.36, -0.8, 1.2, 0.06, 1.6);
    localBox(parent, chrome, -8.55, 0.95, 4.1, 0.12, 1.9, 0.12);
    localBox(parent, cyanGlow, -8.55, 1.72, 4.16, 0.22, 0.18, 0.08);
    localBox(parent, amberGlow, -4.2, 3.05, 3.66, 0.72, 0.16, 0.05);
    if (variant === 2) {
      localBox(parent, solar, 0.6, 7.99, -0.5, 4.6, 0.06, 2.6);
      localBox(parent, carbon, 0.6, 7.93, -0.5, 4.9, 0.08, 2.9);
    }

    const ledGeometry = new THREE.PlaneGeometry(4.9, 1.9);
    ledGeometry.applyMatrix4(localMatrix.compose(
      new THREE.Vector3(0.2, 5.7, 2.96),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)),
      new THREE.Vector3(1, 1, 1),
    ));
    ledGeometry.applyMatrix4(parent);
    addGeo(ledWallMaterial, ledGeometry);

    if (variant === 1) {
      localBox(parent, concrete, 2.1, 0.01, -6.2, 5.1, 0.14, 2.9);
      localBox(parent, poolWater, 2.1, 0.07, -6.2, 4.6, 0.08, 2.4);
    } else {
      localBox(parent, lawn, 2.1, 0.02, -6.4, 4.8, 0.04, 2.7);
    }

    return {
      x, z, yaw, variant,
      backX: x + Math.sin(yaw) * -7.4,
      backZ: z + Math.cos(yaw) * -7.4,
    };
  }

  function glowMatForVariant(variant) {
    return variant === 2 ? amberGlow : cyanGlow;
  }

  const houses = [];
  for (let i = 0; i < 6; i += 1) {
    const scale = 0.97 + (i % 3) * 0.025;
    houses.push(addHouseAt(79 + i * 14, -25.9 + (i % 2 ? 0.4 : -0.4), Math.PI, (i + 1) % 3, scale));
    houses.push(addHouseAt(76 + i * 14, -54.0 + (i % 2 ? 0.3 : -0.3), 0, i % 3, scale));
  }

  const holoUniforms = { uTime: { value: 0 } };
  function makeHoloMaterial(color) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: holoUniforms.uTime,
        uColor: { value: new THREE.Color(color) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        void main() {
          vUv = uv;
          vNormalW = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vViewDir;
        uniform float uTime;
        uniform vec3 uColor;
        void main() {
          float fresnel = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.4);
          vec2 grid = abs(fract(vUv * vec2(26.0, 13.0)) - .5);
          float lines = smoothstep(.45, .5, max(grid.x, grid.y));
          float sweep = smoothstep(.985, 1.0, sin(vUv.x * 34.0 - uTime * 1.2) * .5 + .5);
          float alpha = lines * .18 + fresnel * .2 + sweep * .05 + .012;
          gl_FragColor = vec4(uColor * (1.1 + fresnel), alpha);
        }
      `,
    });
  }
  const holoCyan = makeHoloMaterial(0x55eaff);
  const holoAmber = makeHoloMaterial(0xffb762);
  houses.forEach((house, index) => {
    if (house.variant !== 1) return;
    const geometry = new THREE.SphereGeometry(1, 26, 14, 0, TAU, 0, Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, index % 2 ? holoAmber : holoCyan);
    mesh.position.set(house.backX, 0.24, house.backZ);
    mesh.scale.set(6.2, 4.2, 6.2);
    group.add(mesh);
  });

  // --- Summit Play park and vendor row ------------------------------------
  addBox(lawn, 61, 0.17, -20.8, 18, 0.1, 14.4);
  addBox(concrete, 61, 0.14, -26.4, 18, 0.2, 3.2);
  addBox(rubber, 60.5, 0.2, -20.4, 15.4, 0.06, 8.2);
  addBox(hedge, 51.6, 0.75, -20.8, 0.8, 1.1, 13.6);
  addBox(hedge, 61, 0.75, -13.5, 19.6, 1.1, 0.8);
  addBox(hedge, 69.9, 0.75, -19.8, 0.8, 1.1, 11.6);

  addBox(chrome, 50.6, 1.25, -27.75, 0.14, 2.5, 0.14);
  addPanel(playSignMaterial, 50.6, 2.32, -27.8, 4.6, 1.4, Math.PI);
  addBox(amberGlow, 50.6, 3.06, -27.86, 4.7, 0.07, 0.08);

  function addVendorStall(x, signMaterial, accentMaterial) {
    const z = -26.3;
    addBox(concreteDark, x, 0.27, z - 0.1, 3.0, 0.22, 2.5);
    addBox(white, x, 1.4, z, 2.5, 2.2, 1.9);
    addBox(carbon, x, 2.58, z, 2.9, 0.18, 2.2);
    addBox(accentMaterial, x, 2.2, z - 0.96, 2.6, 0.4, 0.08);
    addBox(carbonSoft, x, 1.18, z - 1.0, 2.3, 0.16, 0.55);
    addBox(glass, x, 1.75, z - 0.82, 1.9, 0.9, 0.08);
    addPanel(signMaterial, x, 2.94, z - 0.98, 2.3, 0.78, Math.PI);
    addBox(carbon, x - 1.14, 2.9, z - 0.96, 0.07, 0.95, 0.07);
    addBox(carbon, x + 1.14, 2.9, z - 0.96, 0.07, 0.95, 0.07);
    addBox(accentMaterial, x, 3.4, z - 0.96, 2.5, 0.06, 0.08);
    for (let i = 0; i < 5; i += 1) {
      addBox(i % 2 ? white : accentMaterial, x - 1.0 + i * 0.5, 2.66, z - 1.42, 0.5, 0.07, 0.95, -0.14, 0, 0);
    }
    addBox(wood, x + 0.9, 0.5, z + 0.72, 0.6, 0.5, 0.6);
    addBox(wood, x - 0.95, 0.4, z + 0.78, 0.55, 0.4, 0.55);
    addBox(carbonSoft, x, 0.45, z - 1.55, 0.5, 0.6, 0.5);
    for (const side of [-1, 1]) {
      addCyl(chrome, x + side * 0.8, 0.82, z - 1.62, 0.26, 0.26, 0.06, 12);
      addCyl(chrome, x + side * 0.8, 0.45, z - 1.62, 0.06, 0.07, 0.75, 6);
    }
  }
  addVendorStall(55, vendorNoodleMaterial, amberGlow);
  addVendorStall(61, vendorTacoMaterial, magentaGlow);
  addVendorStall(67, vendorJuiceMaterial, greenGlow);

  for (const x of [51.9, 70.1]) {
    addCyl(carbonSoft, x, 1.8, -28.05, 0.07, 0.1, 3.6, 6);
    addSphere(amberGlow, x, 3.62, -28.05, 0.09, 6, 4);
  }
  for (let i = 0; i <= 14; i += 1) {
    const f = i / 14;
    addSphere(i % 2 ? amberGlow : cyanGlow, 51.9 + f * 18.2, 3.45 - Math.sin(f * Math.PI) * 0.38, -28.05, 0.075, 6, 4);
  }

  addTrashBin(52.8, -24.4, 0.22, cyanGlow, Math.PI / 2);
  addTrashBin(69.2, -24.4, 0.22, amberGlow, -Math.PI / 2);
  addTrashBin(50.0, -25.6, 0.22, amberGlow, Math.PI / 2);
  addTrashBin(71.6, -25.0, 0.22, cyanGlow, -Math.PI / 2);

  const parkSwings = [];
  addBox(playTeal, 53.9, 1.85, -21.7, 0.14, 3.4, 0.14, 0, 0, -0.18);
  addBox(playTeal, 57.3, 1.85, -21.7, 0.14, 3.4, 0.14, 0, 0, 0.18);
  addBox(playRed, 55.6, 3.52, -21.7, 3.9, 0.12, 0.14);
  for (let i = 0; i < 2; i += 1) {
    const swing = new THREE.Group();
    swing.position.set(55.05 + i * 1.3, 3.46, -21.7);
    const rodLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.55, 4), chrome);
    rodLeft.position.set(-0.3, -1.275, 0);
    const rodRight = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.55, 4), chrome);
    rodRight.position.set(0.3, -1.275, 0);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.36), i ? playGold : playRed);
    seat.position.y = -2.55;
    swing.add(rodLeft, rodRight, seat);
    group.add(swing);
    parkSwings.push(swing);
  }

  for (const [sx, sz] of [[61.6, -22.6], [63.2, -22.6], [61.6, -21.2], [63.2, -21.2]]) {
    addBox(playTeal, sx, 1.35, sz, 0.14, 2.7, 0.14);
  }
  addBox(carbonSoft, 62.4, 1.32, -21.9, 1.9, 0.16, 1.6);
  addBox(playRed, 62.4, 2.86, -21.9, 2.2, 0.14, 1.9);
  addBox(playRed, 62.4, 2.55, -22.7, 2.0, 0.6, 0.1);
  for (let i = 0; i < 4; i += 1) {
    addBox(wood, 61.15, 0.35 + i * 0.34, -21.85, 0.7, 0.08, 0.5);
  }
  addBox(playTeal, 61.35, 1.5, -21.85, 0.08, 1.1, 0.08);
  addBox(playGold, 62.4, 0.93, -20.0, 1.15, 0.12, 3.6, 0.24, 0, 0);
  addBox(playRed, 61.8, 1.12, -20.0, 0.06, 0.28, 3.6, 0.24, 0, 0);
  addBox(playRed, 63.0, 1.12, -20.0, 0.06, 0.28, 3.6, 0.24, 0, 0);

  const domeMaterial = new THREE.MeshStandardMaterial({ color: 0x2fa8a2, wireframe: true, roughness: 0.5, metalness: 0.2 });
  addGeo(domeMaterial, composeAt(new THREE.IcosahedronGeometry(1.5, 1), 66.2, 1.5, -21.5));
  for (const [hx, hy, hz, material] of [[65.0, 1.8, -21.1, playGold], [67.3, 2.1, -21.7, playRed], [66.0, 2.5, -22.3, playGold]]) {
    addSphere(material, hx, hy, hz, 0.13, 8, 6);
  }

  for (const [x, z, material] of [[58.7, -17.5, playRed], [63.9, -17.2, playGold]]) {
    addCyl(chrome, x, 0.4, z, 0.07, 0.1, 0.8, 8);
    addSphere(material, x, 1.0, z, 0.42, 10, 8);
    addBox(carbonSoft, x, 1.34, z, 0.1, 0.5, 0.1);
  }

  addCyl(chrome, 67.3, 0.46, -17.2, 0.16, 0.24, 0.92, 8);
  addBox(playRed, 67.3, 0.2, -17.2, 1.8, 0.4, 1.2);
  const seesaw = new THREE.Group();
  seesaw.position.set(67.3, 0.92, -17.2);
  const seesawPlank = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.5), playGold);
  const seesawSeatA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), playRed);
  seesawSeatA.position.set(-1.4, 0.12, 0);
  const seesawSeatB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), playTeal);
  seesawSeatB.position.set(1.4, 0.12, 0);
  const seesawHandleA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), chrome);
  seesawHandleA.position.set(-1.1, 0.3, 0);
  const seesawHandleB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), chrome);
  seesawHandleB.position.set(1.1, 0.3, 0);
  seesaw.add(seesawPlank, seesawSeatA, seesawSeatB, seesawHandleA, seesawHandleB);
  group.add(seesaw);

  addBox(wood, 54.3, 0.34, -16.4, 3.4, 0.28, 0.22);
  addBox(wood, 54.3, 0.34, -19.0, 3.4, 0.28, 0.22);
  addBox(wood, 52.6, 0.34, -17.7, 0.22, 0.28, 2.6);
  addBox(wood, 56.0, 0.34, -17.7, 0.22, 0.28, 2.6);
  addBox(sand, 54.3, 0.26, -17.7, 3.0, 0.06, 2.2);
  addBox(concrete, 61, 0.22, -24.4, 2.0, 0.06, 1.2);

  // --- Security: sentry hubs, scan grid, bollards -------------------------
  function addSentry(x, z, yaw, signMaterial, height = 3.1) {
    const parent = new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.18, z),
      new THREE.Quaternion().setFromAxisAngle(UP, yaw),
      new THREE.Vector3(1, 1, 1),
    );
    localBox(parent, carbon, 0, 0.22, 0, 2.6, 0.44, 2.1);
    localBox(parent, white, 0, 0.42, 0, 2.3, 0.24, 1.8);
    localBox(parent, carbonSoft, 0, height * 0.5, 0, 0.85, height, 0.85);
    localBox(parent, white, 0, height, 0, 2.0, 1.15, 1.25);
    localBox(parent, carbon, 0, height + 0.78, 0, 2.2, 0.34, 1.4);
    localBox(parent, cyanGlow, 0, height + 0.98, 0.15, 1.5, 0.06, 0.06);
    localBox(parent, glass, 0, height + 0.15, 0.64, 1.2, 0.55, 0.05);
    localBox(parent, carbon, -0.72, height + 0.28, 0.72, 0.18, 0.18, 0.6);
    localBox(parent, carbon, 0.72, height + 0.28, 0.72, 0.18, 0.18, 0.6);
    localBox(parent, redGlow, -0.72, height + 0.28, 1.04, 0.1, 0.1, 0.1);
    localBox(parent, redGlow, 0.72, height + 0.28, 1.04, 0.1, 0.1, 0.1);
    localBox(parent, amberGlow, -0.45, height - 0.38, 0.65, 0.5, 0.06, 0.06);
    localBox(parent, redGlow, 0.45, height - 0.38, 0.65, 0.5, 0.06, 0.06);
    localBox(parent, carbon, 0, height + 1.55, 0, 0.08, 1.2, 0.08);
    localPanel(parent, signMaterial, 0, height + 1.25, 0.7, 2.1, 0.52);
    return parent;
  }

  addSentry(23.2, -12.8, 1.05, sentrySignMaterial, 3.2);
  addSentry(9.2, 10.1, 1.05, sentryStreetSignMaterial, 3.3);
  addSentry(-1.4, -52.4, -0.2, sentrySignMaterial, 3.2);
  addSentry(49.6, -47.4, 0.4, sentrySignMaterial, 3.1);

  const scanUniforms = { uTime: { value: 0 }, uGlow: { value: 0.6 } };
  const scanMaterial = new THREE.ShaderMaterial({
    uniforms: scanUniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uGlow;
      void main() {
        float line = smoothstep(.94, 1.0, sin(vUv.y * 60.0 - uTime * 3.2) * .5 + .5);
        float edge = smoothstep(.06, .0, abs(vUv.x - .5) - .44);
        float vertical = smoothstep(.04, .0, abs(fract(vUv.x * 8.0) - .5) - .46);
        float alpha = (line * .05 + vertical * .035 + edge * .12 + .006) * uGlow;
        gl_FragColor = vec4(vec3(.33, .92, 1.0), alpha);
      }
    `,
  });
  const scanPanel = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.4), scanMaterial);
  scanPanel.position.set(34, 2.2, -12.6);
  group.add(scanPanel);
  addBox(carbon, 28.4, 3.0, -12.6, 0.34, 6.0, 0.34);
  addBox(carbon, 39.6, 3.0, -12.6, 0.34, 6.0, 0.34);
  addBox(cyanGlow, 34, 5.78, -12.6, 10.8, 0.08, 0.16);
  addBox(carbon, 34, 5.94, -12.6, 11.6, 0.16, 0.4);
  addPanel(estateSignMaterial, 34, 5.02, -12.5, 6.6, 1.5, 0);

  const bollardPositions = [[52.6, -28.6], [54.2, -28.6], [67.8, -28.6], [69.4, -28.6]];
  const bollards = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.2, 1.0, 8), chrome, bollardPositions.length);
  bollardPositions.forEach(([x, z], i) => {
    dummy.position.set(x, 0.55, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bollards.setMatrixAt(i, dummy.matrix);
    addBox(bollardGlow, x, 0.87, z, 0.28, 0.09, 0.28);
  });
  group.add(bollards);

  // --- Retail / malls -----------------------------------------------------
  // Strip mall with a shared parking forecourt.
  addBox(lotAsphalt, 40, 0.14, 15.7, 40, 0.12, 7.2);
  addBox(white, 40, 2.3, 24.2, 38, 4.4, 8.4);
  addBox(carbon, 40, 4.55, 24.2, 38.3, 0.3, 8.7);
  addBox(carbon, 40, 4.85, 24.2, 36.8, 0.22, 8.9);
  addBox(glass, 40, 2.5, 19.94, 35.8, 1.9, 0.1);
  addBox(carbon, 40, 3.62, 19.86, 36.4, 0.26, 0.7);
  addBox(carbon, 40, 0.3, 19.8, 37, 0.24, 1.4);
  for (let i = 0; i < 5; i += 1) {
    const x = 24 + i * 8;
    addBox(i % 2 ? carbonSoft : warmWhite, x, 3.8, 19.5, 6.4, 0.16, 1.4, 0.12, 0, 0);
    addBox(i % 2 ? amberGlow : cyanGlow, x, 3.45, 19.9, 5.6, 0.05, 0.05);
    addBox(carbonSoft, x - 2.3, 0.9, 19.28, 0.12, 1.8, 0.12);
    addBox(carbonSoft, x + 2.3, 0.9, 19.28, 0.12, 1.8, 0.12);
  }
  addPanel(retailSignMaterial, 40, 5.55, 19.9, 23, 2.3, Math.PI);
  addBox(carbonSoft, 40, 5.05, 22.5, 1.4, 0.7, 1.2);
  addBox(carbonSoft, 48, 5.05, 22.5, 1.1, 0.6, 1.0);
  for (const [x, z] of [[27, 23], [34, 25.6], [49, 22.8], [55, 25.2]]) {
    addBox(carbonSoft, x, 5.25, z, 2.5, 0.8, 1.9);
    addCyl(chrome, x, 5.7, z, 0.62, 0.62, 0.06, 12);
  }
  addBox(glass, 40, 4.98, 23.4, 4.2, 0.1, 1.6);

  // Parking stripes and charging posts.
  const stallPositions = [];
  for (let i = 3; i < 10; i += 1) stallPositions.push({ x: 24 + i * 3.4, z: 15.6, rot: 0 });
  for (let i = 0; i < 6; i += 1) stallPositions.push({ x: -34 + i * 3.2, z: -10.5, rot: Math.PI / 2 });
  for (let i = 0; i < 9; i += 1) stallPositions.push({ x: -22 + i * 3.2, z: -46.5, rot: 0 });
  const stallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.03, 4.2), markingMaterial, stallPositions.length);
  stallPositions.forEach((stall, i) => {
    dummy.position.set(stall.x, 0.21, stall.z);
    dummy.rotation.set(0, stall.rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stallMesh.setMatrixAt(i, dummy.matrix);
  });
  group.add(stallMesh);

  // Enclosed mall, atrium, digital billboard.
  addBox(white, 44, 4.4, 42, 22, 8.8, 16);
  addBox(carbon, 44, 8.85, 42, 22.4, 0.28, 16.4);
  addBox(carbon, 44, 4.8, 42, 22.3, 0.35, 16.2);
  addBox(glass, 44, 2.7, 33.92, 18, 2.6, 0.1);
  addBox(glass, 34.85, 4.2, 42, 0.1, 4.6, 10.6);
  addBox(carbon, 44, 0.35, 33.6, 23, 0.3, 2.2);
  addBox(white, 44, 3.4, 32.8, 9.6, 6.2, 2.4);
  addBox(glass, 44, 3.8, 31.62, 8.2, 4.4, 0.1);
  addBox(carbon, 44, 6.75, 32.4, 11, 0.3, 4.6);
  addBox(carbonSoft, 44, 7.6, 39, 5.5, 1.6, 5);
  addBox(carbonSoft, 50, 9.2, 43, 3.2, 0.8, 4.2);
  addBox(carbonSoft, 37, 9.2, 38, 2.6, 0.7, 3.1);
  addCyl(chrome, 50, 9.66, 43, 0.9, 0.9, 0.08, 12);
  addCyl(chrome, 37, 9.6, 38, 0.7, 0.7, 0.08, 12);
  addBox(glass, 47, 9.05, 34.8, 4.0, 0.1, 1.2);
  addBox(glass, 40, 9.05, 48.4, 4.4, 0.1, 1.2);
  addBox(carbonSoft, 55, 9.45, 47, 2.2, 1.0, 1.8);
  addPanel(mallSignMaterial, 44, 8.2, 33.86, 15.5, 2.6, Math.PI);
  addPanel(adMaterial, 52.4, 6.3, 33.82, 5.2, 8.7, Math.PI);
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(3.3, 0.07, 8, 48), 44, 8.2, 35.4, Math.PI / 2, 0, 0));
  addPanel(bioSignMaterial, 33.4, 6.9, 33.9, 5.2, 1.2, Math.PI);

  // Big-box retail with loading bays.
  addBox(warmWhite, 60, 3.2, 55, 14, 6.4, 9);
  addBox(carbon, 60, 6.55, 55, 14.4, 0.3, 9.4);
  addBox(glass, 60, 2.2, 50.44, 11.6, 1.6, 0.1);
  addBox(carbon, 60, 4.1, 50.4, 12, 0.35, 0.8);
  addPanel(habitatSignMaterial, 60, 5.6, 50.38, 9.2, 1.8, Math.PI);
  addBox(carbonSoft, 65.6, 1.9, 58.2, 2.6, 3.8, 2.4);
  addBox(carbon, 65.6, 0.3, 58.2, 2.8, 0.6, 2.6);
  for (let i = 0; i < 3; i += 1) addBox(carbonSoft, 55 + i * 3.6, 6.9, 55, 1.7, 0.7, 2.2);
  for (let i = 0; i < 4; i += 1) addBox(solar, 55.6 + i * 2.4, 6.95, 57.6, 2.0, 0.06, 2.6, 0.12, 0, 0);

  // Drive-thru bio-dispensary pods.
  function addDispensary(x, z, yaw) {
    const parent = new THREE.Matrix4().compose(
      new THREE.Vector3(x, 0.18, z),
      new THREE.Quaternion().setFromAxisAngle(UP, yaw),
      new THREE.Vector3(1, 1, 1),
    );
    localBox(parent, carbon, 0, 0.2, 0, 9.2, 0.4, 7.4);
    localBox(parent, chrome, -3.1, 1.8, 0.3, 0.34, 3.4, 0.34);
    localBox(parent, chrome, 3.1, 1.8, 0.3, 0.34, 3.4, 0.34);
    localBox(parent, chrome, 0, 3.65, 0.3, 6.6, 0.22, 0.5);
    const canopy = new THREE.CylinderGeometry(2.5, 2.5, 6.7, 18, 1, true, 0, Math.PI);
    localMatrix.compose(
      new THREE.Vector3(0, 3.55, 0.3),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)),
      new THREE.Vector3(1, 1, 1),
    );
    canopy.applyMatrix4(localMatrix);
    canopy.applyMatrix4(parent);
    addGeo(chrome, canopy);
    localBox(parent, carbon, -1.7, 1.8, -1.9, 1.6, 2.9, 1.5);
    localBox(parent, glass, -1.7, 2.5, -1.1, 1.3, 1.1, 0.08);
    localBox(parent, cyanGlow, -1.7, 3.25, -1.16, 1.1, 0.06, 0.06);
    localBox(parent, chrome, 1.8, 0.95, -2.1, 0.2, 1.6, 0.2);
    localBox(parent, chrome, 1.8, 2.1, -1.9, 0.2, 1.4, 1.6);
    const iris = new THREE.TorusGeometry(0.36, 0.045, 6, 28);
    localMatrix.compose(new THREE.Vector3(1.8, 2.1, -1.0), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    iris.applyMatrix4(localMatrix);
    iris.applyMatrix4(parent);
    addGeo(cyanGlow, iris);
    localBox(parent, carbonSoft, -1.7, 0.22, 2.5, 2.4, 0.2, 1.1);
    localPanel(parent, bioSignMaterial, 0, 4.9, 2.5, 6.6, 1.5, 0);
    localBox(parent, carbon, 0, 6.0, 2.5, 6.9, 0.18, 0.18);
    return parent;
  }
  addBox(lotAsphalt, 62.4, 0.14, 15.4, 14, 0.12, 11.4);
  addDispensary(27.5, 16.2, Math.PI);
  addDispensary(61.8, 15.4, Math.PI);

  // Prestige vending kiosks at the mall entrance.
  for (let i = 0; i < 5; i += 1) {
    const x = 36.5 + i * 3.1;
    addBox(chrome, x, 1.4, 30.6, 1.25, 2.6, 0.85);
    addBox(carbon, x, 0.25, 30.6, 1.45, 0.35, 1.05);
    addBox(i % 2 ? cyanGlow : amberGlow, x, 1.65, 30.14, 0.9, 1.1, 0.04);
    addBox(carbon, x, 2.85, 30.6, 1.4, 0.16, 1.0);
    addBox(cyanGlow, x, 2.95, 30.32, 1.0, 0.03, 0.06);
  }

  // Micro-drones cleaning the retail forecourt.
  // (Animated in the drone array further below.)

  // --- Parks --------------------------------------------------------------
  const pathRing = new THREE.RingGeometry(17.2, 19.2, 72);
  pathRing.rotateX(-Math.PI / 2);
  addGeo(concrete, composeAt(pathRing, -43, 0.19, 35, 0, 0, 0, 1.18, 1, 0.82));
  addBox(lawn, -43, 0.17, 35, 34, 0.03, 26);
  addBox(lawn, -61, 0.17, 18.5, 13, 0.03, 9.5);
  addBox(rubber, -56.5, 0.2, 18.2, 12, 0.08, 10.2);
  addBox(carbonSoft, -60.6, 1.4, 21.2, 2.3, 2.8, 2.3);
  addBox(amberGlow, -60.6, 2.85, 21.2, 2.4, 0.1, 2.4);
  addCone(carbonSoft, -60.6, 3.45, 21.2, 1.9, 1.4, 4);
  addBox(chrome, -58.2, 1.0, 16.3, 2.8, 0.16, 0.16, 0, 0, -0.55);
  addBox(cyanGlow, -56.2, 0.55, 15.6, 1.1, 0.12, 0.9);
  addCyl(carbonSoft, -53.4, 1.2, 21.4, 0.13, 0.13, 2.4, 6);
  addCyl(carbonSoft, -51.4, 1.2, 21.4, 0.13, 0.13, 2.4, 6);
  addBox(carbonSoft, -52.4, 2.4, 21.4, 2.5, 0.14, 0.14);
  addBox(magentaGlow, -52.4, 2.32, 20.95, 1.15, 0.1, 0.1);
  addBox(cyanGlow, -52.4, 2.32, 21.85, 1.15, 0.1, 0.1);
  for (let i = 0; i < 4; i += 1) {
    addSphere(i % 2 ? amberGlow : magentaGlow, -60 + i * 1.8, 0.8, 16.4 + (i % 2) * 2.8, 0.32, 8, 6);
    addCyl(chrome, -60 + i * 1.8, 0.45, 16.4 + (i % 2) * 2.8, 0.06, 0.09, 0.7, 6);
  }

  // Community pool.
  addBox(concrete, -27.5, 0.22, 19.5, 14.4, 0.18, 9);
  addBox(concreteDark, -27.5, 0.27, 19.5, 10.8, 0.14, 6.2);
  addBox(poolWater, -27.5, 0.33, 19.5, 10.4, 0.06, 5.8);
  for (let i = 0; i < 5; i += 1) addBox(markingMaterial, -31.6 + i * 2.05, 0.37, 19.5, 0.06, 0.02, 5.5);
  for (const x of [-33.1, -21.9]) {
    addBox(chrome, x, 0.75, 18.0, 0.12, 1.1, 0.12);
    addBox(chrome, x, 1.28, 18.2, 0.12, 0.12, 0.6);
  }
  addBox(glass, -27.5, 0.8, 14.4, 14.2, 1.2, 0.08);
  addBox(glass, -34.6, 0.8, 19.5, 0.08, 1.2, 9);
  addBox(glass, -20.4, 0.8, 19.5, 0.08, 1.2, 9);
  addPanel(poolSignMaterial, -27.5, 2.0, 14.2, 5.6, 1.4, 0);
  addBox(chrome, -23.2, 1.9, 24, 0.1, 2.6, 0.1);
  addBox(chrome, -23.2, 3.2, 24, 0.1, 0.1, 1.2);

  // Ball diamond.
  addGeo(dirt, composeAt(new THREE.CircleGeometry(8.4, 40), -50, 0.2, 47.5, -Math.PI / 2, 0, 0, 1.22, 1, 0.9));
  addGeo(lawn, composeAt(new THREE.CircleGeometry(3.4, 24), -50, 0.22, 47.5, -Math.PI / 2, 0, 0));
  addBox(markingMaterial, -50, 0.23, 44.1, 0.7, 0.02, 0.7);
  addBox(markingMaterial, -54.4, 0.23, 47.5, 0.55, 0.02, 0.55);
  addBox(markingMaterial, -50, 0.23, 50.9, 0.55, 0.02, 0.55);
  addBox(markingMaterial, -45.6, 0.23, 47.5, 0.55, 0.02, 0.55);
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (0.12 + i * 0.126);
    addCyl(chrome, -50 + Math.cos(angle) * 9.4, 0.95, 47.5 + Math.sin(angle) * 7.2, 0.05, 0.06, 1.7, 6);
  }
  addBox(whiteGlow, -50 + Math.cos(Math.PI * 0.5) * 9.6, 1.7, 47.5 + Math.sin(Math.PI * 0.5) * 7.3, 3.6, 0.06, 0.06);

  // Soccer field.
  addBox(lawn, -49, 0.18, 31, 24, 0.03, 14);
  const pitchLines = [
    [-49, 0.22, 24.1, 24, 0.02, 0.12],
    [-49, 0.22, 37.9, 24, 0.02, 0.12],
    [-61, 0.22, 31, 0.12, 0.02, 13.8],
    [-37, 0.22, 31, 0.12, 0.02, 13.8],
    [-49, 0.22, 31, 0.12, 0.02, 13.8],
  ];
  pitchLines.forEach((line) => addBox(markingMaterial, ...line));
  addGeo(markingMaterial, composeAt(new THREE.TorusGeometry(2.4, 0.04, 4, 40), -49, 0.23, 31, Math.PI / 2, 0, 0));
  for (const x of [-60.5, -37.5]) {
    addCyl(chrome, x, 1.2, 28.2, 0.07, 0.07, 2.4, 6);
    addCyl(chrome, x, 1.2, 33.8, 0.07, 0.07, 2.4, 6);
    addBox(chrome, x, 2.4, 31, 0.08, 0.08, 5.6);
    addBox(carbonSoft, x + (x < -49 ? 0.8 : -0.8), 1.1, 31, 0.08, 1.9, 4.4);
  }

  // Dog run.
  addBox(lawn, -28.5, 0.19, 45, 10.4, 0.03, 12);
  for (let i = 0; i < 5; i += 1) {
    addCyl(chrome, -33.2, 0.8, 39.4 + i * 2.8, 0.05, 0.07, 1.3, 6);
    addCyl(chrome, -23.8, 0.8, 39.4 + i * 2.8, 0.05, 0.07, 1.3, 6);
  }
  addBox(chrome, -28.5, 0.95, 39.2, 9.4, 0.05, 0.05);
  addBox(chrome, -28.5, 0.95, 51.0, 9.4, 0.05, 0.05);
  addBox(chrome, -33.2, 0.95, 45.1, 0.05, 0.05, 11.8);
  addBox(chrome, -23.8, 0.95, 45.1, 0.05, 0.05, 11.8);
  addGeo(amberGlow, composeAt(new THREE.TorusGeometry(1.2, 0.08, 6, 24), -30, 1.4, 45, 0, 0, 0));
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(0.9, 0.07, 6, 24), -26, 1.2, 47, 0, 0, 0));
  addBox(carbonSoft, -25.5, 0.8, 41.5, 2.4, 0.12, 0.8, 0.5, 0, 0);
  addBox(carbonSoft, -25.5, 1.25, 42.0, 2.4, 0.12, 0.8, -0.4, 0, 0);

  // Park wayfinding and seating.
  addBox(carbon, -20.5, 1.2, 44, 0.3, 2.4, 0.3);
  addPanel(parkSignMaterial, -20.5, 2.7, 44, 6.2, 1.7, Math.PI / 2);
  addBox(carbon, -20.5, 3.65, 44, 0.35, 0.25, 6.6);

  // --- School -------------------------------------------------------------
  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, 14.2, 9, 0, TAU, false);
  const trackHole = new THREE.Path();
  trackHole.absellipse(0, 0, 11.2, 6.2, 0, TAU, true);
  trackShape.holes.push(trackHole);
  const trackGeometry = new THREE.ShapeGeometry(trackShape, 64);
  trackGeometry.rotateX(-Math.PI / 2);
  addGeo(terracotta, composeAt(trackGeometry, -48, 0.2, -26));
  const infield = new THREE.CircleGeometry(1, 48);
  infield.scale(10.9, 5.9, 1);
  infield.rotateX(-Math.PI / 2);
  addGeo(fieldGreen, composeAt(infield, -48, 0.21, -26));
  for (let i = 0; i < 4; i += 1) {
    const rx = 11.6 + i * 0.8;
    const rz = 6.5 + i * 0.75;
    const line = new THREE.TorusGeometry(1, 0.035, 4, 80);
    line.scale(rx, rz, 1);
    line.rotateX(-Math.PI / 2);
    addGeo(markingMaterial, composeAt(line, -48, 0.24, -26));
  }
  addBox(white, -48, 3.2, -11.6, 25, 6.4, 7.4);
  addBox(carbon, -48, 6.62, -11.6, 25.4, 0.3, 7.8);
  addBox(carbon, -48, 3.55, -11.7, 25.3, 0.28, 7.5);
  addBox(glass, -48, 2.4, -14.88, 23.2, 2.4, 0.1);
  addBox(glass, -35.44, 3.2, -11.6, 0.1, 4.2, 5.8);
  addBox(white, -34.2, 2.6, -8.8, 6.4, 5.2, 4.6);
  addBox(carbon, -34.2, 5.32, -8.8, 6.7, 0.24, 4.9);
  addBox(carbon, -31.2, 3.5, -10.4, 3.8, 0.2, 2.2);
  addBox(cyanGlow, -31.2, 3.64, -9.3, 3.4, 0.06, 0.06);
  addPanel(schoolSignMaterial, -35.32, 5.0, -11.6, 9.2, 1.8, Math.PI / 2);
  addPanel(schoolSignMaterial, -48, 7.0, -7.6, 12.6, 2.2, 0);
  addBox(carbonSoft, -44, 7.0, -11.6, 2.6, 0.8, 2.2);
  addBox(carbonSoft, -53, 7.0, -11.6, 2.2, 0.7, 1.8);
  for (let i = 0; i < 6; i += 1) {
    addBox(solar, -58 + i * 3.4, 7.08, -11.6, 2.8, 0.06, 2.2, 0.14, 0, 0);
  }
  addBox(carbon, -31.5, 0.3, -36.4, 17.2, 0.42, 0.7);
  addBox(carbon, -31.5, 0.9, -37.3, 17.2, 0.42, 0.7);
  addBox(carbon, -31.5, 1.5, -38.2, 17.2, 0.42, 0.7);
  addBox(white, -31.5, 2.4, -37.4, 17.4, 0.14, 3.4);
  addBox(carbon, -31.5, 0.3, -35.5, 17.2, 0.42, 0.7);

  addBox(lotAsphalt, -31.5, 0.14, -11, 9, 0.12, 9.5);
  for (let i = 0; i < 5; i += 1) addBox(carbonSoft, -31.5, 3.2, -14.8 + i * 1.9, 8.4, 0.14, 0.12);
  for (let i = 0; i < 4; i += 1) {
    addCyl(chrome, -35.4 + i * 2.6, 1.6, -15.4, 0.09, 0.09, 3.2, 6);
    addBox(solar, -35.4 + i * 2.6, 3.35, -13.8, 3.2, 0.08, 2.8, 0.32, 0, 0);
  }
  addBox(carbon, -31.5, 3.8, -17.4, 10, 0.2, 0.2);

  // --- Church and civic center -------------------------------------------
  addBox(white, 22, 3.6, 76, 10, 7.2, 17);
  addBox(carbon, 22, 7.3, 76, 10.4, 0.3, 17.4);
  addBox(carbon, 22, 3.8, 76, 10.3, 0.32, 17.2);
  addBox(carbonSoft, 22, 8.4, 76, 4.4, 0.6, 18);
  const roofLeft = new THREE.BoxGeometry(6.5, 0.22, 17.4);
  roofLeft.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(19.1, 8.1, 76),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.42)),
    new THREE.Vector3(1, 1, 1),
  ));
  addGeo(carbonSoft, roofLeft);
  const roofRight = new THREE.BoxGeometry(6.5, 0.22, 17.4);
  roofRight.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(24.9, 8.1, 76),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.42)),
    new THREE.Vector3(1, 1, 1),
  ));
  addGeo(carbonSoft, roofRight);
  addBox(white, 22, 7.2, 67.5, 4.6, 14.4, 4.6);
  addBox(glass, 22, 6.6, 65.16, 1.5, 10.6, 0.08);
  addBox(carbon, 22, 12.3, 67.5, 3.4, 0.3, 3.4);
  addBox(carbon, 22, 14.34, 67.5, 5.05, 0.3, 5.05);
  addCone(carbonSoft, 22, 17.3, 67.5, 2.9, 5.8, 4);
  addBox(white, 22, 20.3, 67.5, 0.22, 2.6, 0.22);
  addBox(white, 22, 20.9, 67.5, 1.5, 0.22, 0.22);
  addBox(redGlow, 22, 21.7, 67.5, 0.22, 0.16, 0.22);
  addGeo(amberGlow, composeAt(new THREE.TorusGeometry(3.25, 0.09, 8, 48), 22, 13.35, 67.5, Math.PI / 2, 0, 0));
  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(3.8, 0.035, 6, 44), 22, 12.75, 67.5, Math.PI / 2, 0, 0));
  addBox(carbon, 22, 2.0, 65.08, 5.8, 3.8, 0.3);
  addBox(glass, 22, 1.9, 64.9, 3.6, 3.0, 0.08);
  addBox(amberGlow, 22, 3.52, 64.85, 3.9, 0.06, 0.06);
  addBox(concrete, 22, 0.3, 64.55, 7, 0.26, 1.4);
  addBox(carbon, 22, 5.7, 64.0, 6.4, 0.3, 2.4);
  addBox(carbon, 22, 5.95, 62.85, 6.4, 0.4, 0.2);
  addPanel(churchSignMaterial, 22, 6.55, 64.84, 6.4, 1.6, Math.PI);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const color = i % 2 ? magentaGlow : cyanGlow;
      addBox(color, 22 + side * 5.02, 4.2, 71 + i * 3.1, 0.06, 2.6, 1.15);
      addBox(carbon, 22 + side * 5.04, 4.2, 71 + i * 3.1, 0.08, 2.9, 0.16);
    }
  }
  addBox(concrete, 22, 0.24, 61.6, 18, 0.24, 7.2);
  addGeo(concrete, composeAt(new THREE.RingGeometry(1.9, 3.6, 48), 22, 0.38, 61.6, -Math.PI / 2, 0, 0));
  addCyl(concreteDark, 22, 0.55, 61.6, 1.8, 2.05, 0.55, 24);
  addGeo(poolWater, composeAt(new THREE.CylinderGeometry(1.65, 1.65, 0.12, 24), 22, 0.75, 61.6));
  addCyl(chrome, 22, 1.0, 61.6, 0.16, 0.26, 0.8, 10);
  const fountainJet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.16, 2.2, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9beeff, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  fountainJet.position.set(22, 2.0, 61.6);
  group.add(fountainJet);
  addBox(white, 36, 2.6, 78, 11, 5.2, 12);
  addBox(carbon, 36, 5.32, 78, 11.4, 0.28, 12.4);
  addBox(glass, 30.44, 2.6, 78, 0.1, 2.4, 9);
  addBox(glass, 36, 2.9, 71.94, 8.6, 2.1, 0.1);
  addPanel(communitySignMaterial, 30.32, 4.2, 78, 7.4, 1.5, -Math.PI / 2);
  addBox(carbonSoft, 33, 5.9, 78, 2.2, 0.8, 1.8);
  addBox(carbonSoft, 40, 5.9, 78, 1.8, 0.7, 1.5);
  addBox(hedge, 12.4, 0.8, 70, 1.2, 1.2, 14);
  addBox(wood, 16, 0.7, 59.6, 3.2, 0.18, 0.7, 0, 0.5, 0);
  addBox(carbon, 14.6, 0.43, 59.6, 0.12, 0.5, 0.5);
  addBox(carbon, 17.4, 0.43, 59.6, 0.12, 0.5, 0.5);
  addBox(amberGlow, 16, 0.81, 59.3, 3.0, 0.4, 0.03, 0, 0.5, 0);

  // --- Elevated maglev monorail and station -------------------------------
  const railZ = -67.5;
  addBox(white, 0, 9.0, railZ, 336, 0.8, 2.7);
  addBox(carbon, 0, 9.44, railZ - 1.0, 336, 0.16, 0.3);
  addBox(carbon, 0, 9.44, railZ + 1.0, 336, 0.16, 0.3);
  addBox(laneGlow, 0, 9.5, railZ + 1.33, 336, 0.04, 0.06);
  for (let x = -156; x <= 156; x += 18) {
    if ((x > -22 && x < 4) || (x > -70 && x < -42)) continue;
    addBox(white, x, 4.5, railZ, 1.7, 9, 1.7);
    addBox(carbonSoft, x, 4.5, railZ + 0.95, 2.2, 6.4, 0.14);
    addBox(concreteDark, x, 0.3, railZ, 2.6, 0.6, 2.6);
    addBox(cyanGlow, x, 8.2, railZ + 1.0, 1.3, 0.08, 0.1);
  }
  const westStationX = -56;
  const westPlatformZ = railZ + 5.4;
  addBox(white, -64.15, 8.9, westPlatformZ, 7.7, 1.0, 6.6);
  addBox(white, -49.85, 8.9, westPlatformZ, 11.7, 1.0, 6.6);
  addBox(white, -58, 8.9, railZ + 3.0, 4.6, 1.0, 1.8);
  addBox(white, westStationX, 12.55, westPlatformZ, 25, 0.3, 7.2);
  addBox(carbon, westStationX, 12.78, westPlatformZ, 25.2, 0.14, 7.5);
  addBox(amberGlow, westStationX, 12.33, railZ + 2.05, 23.4, 0.06, 0.1);
  for (const x of [-64, -48]) {
    addCyl(chrome, x, 10.9, railZ + 2.3, 0.1, 0.14, 3.4, 8);
    addCyl(chrome, x, 10.9, railZ + 8.3, 0.1, 0.14, 3.4, 8);
    addBox(white, x, 4.4, westPlatformZ, 1.1, 8, 1.1);
    addBox(amberGlow, x, 7.6, railZ + 1.78, 0.9, 0.06, 0.06);
  }
  addBox(white, -63.25, 9.4, railZ + 8.75, 5.5, 2.2, 0.3);
  addBox(white, -50.75, 9.4, railZ + 8.75, 9.5, 2.2, 0.3);
  addBox(carbon, westStationX, 11.7, railZ + 8.83, 18, 2.0, 0.22);
  addPanel(stationWestSignMaterial, westStationX, 11.7, railZ + 8.96, 13, 1.75, 0);
  addBox(amberGlow, westStationX, 10.62, railZ + 8.91, 19.6, 0.06, 0.06);
  for (let i = 0; i < 11; i += 1) {
    addBox(concrete, -58, 0.45 + i * 0.86, -57.6 - i * 0.56, 4.2, 0.86, 0.64);
  }
  addBox(chrome, -59.89, 4.95, -60.4, 0.08, 0.1, 10.4, -2.148, 0, 0);
  addBox(chrome, -56.11, 4.95, -60.4, 0.08, 0.1, 10.4, -2.148, 0, 0);
  addBox(concrete, -56, 0.08, -56.8, 12, 0.16, 6.4);
  addBox(white, -63.4, 1.6, -55.8, 3.4, 2.8, 3.2);
  addBox(carbon, -63.4, 3.08, -55.8, 3.7, 0.2, 3.5);
  addBox(glass, -63.4, 1.63, -54.16, 3.0, 2.0, 0.08);
  addBox(carbon, -63.4, 2.68, -54.1, 3.3, 0.3, 0.6);
  addBox(wood, -59.4, 0.78, -54.6, 2.3, 0.12, 0.6);
  addBox(wood, -59.4, 1.1, -54.88, 2.3, 0.5, 0.1);
  addBox(carbon, -60.3, 0.44, -54.6, 0.1, 0.56, 0.45);
  addBox(carbon, -58.5, 0.44, -54.6, 0.1, 0.56, 0.45);
  addCyl(chrome, -51.8, 2.0, -54.2, 0.06, 0.08, 3.7, 6);
  addBox(amberGlow, -51.8, 3.86, -54.2, 0.8, 0.05, 0.05);
  addTrashBin(-51.2, -58.0, 0.16, amberGlow, Math.PI);
  addTrashBin(14.2, -54.1, 0.28, cyanGlow, 0);

  buildStationArchitecture({
    config: STATION_CONFIG,
    materials: {
      white, concrete, concreteDark, carbon, carbonSoft, chrome, glass, darkGlass,
      solar, lotAsphalt, wood, cyanGlow, amberGlow, magentaGlow, greenGlow,
      markingMaterial, stationSignMaterial, transitStopMaterial,
    },
    makeSignTexture,
    addBox,
    addCyl,
    addPanel,
    addGeo,
    composeAt,
  });

  // --- Sidewalk furniture -------------------------------------------------
  // Sound-cancellation streetlights.
  const lampPositions = [];
  for (let x = -140; x <= 140; x += 28) {
    lampPositions.push({ x, z: 8.8, ry: Math.PI });
    lampPositions.push({ x, z: -8.8, ry: 0 });
  }
  for (let z = -144; z <= 144; z += 32) {
    if (Math.abs(z) < 12) continue;
    lampPositions.push({ x: 8.9, z, ry: -Math.PI / 2 });
    lampPositions.push({ x: -8.9, z, ry: Math.PI / 2 });
  }
  for (let x = 80; x <= 150; x += 14) {
    lampPositions.push({ x, z: -35.3, ry: Math.PI });
  }
  for (const [x, z, ry] of [
    [70.8, -31.2, -Math.PI * 0.75], [70.8, -48.8, -Math.PI * 0.25],
    [53.2, -48.8, Math.PI * 0.25], [53.2, -31.2, Math.PI * 0.75],
    [154.8, -31.8, Math.PI * 0.75], [154.8, -48.2, Math.PI * 0.25],
    [50.4, -23.0, Math.PI / 2], [68.6, -23.0, -Math.PI / 2],
  ]) {
    lampPositions.push({ x, z, ry });
  }
  const clearLampPositions = lampPositions.filter(({ x, z }) => !(
    (x > 7 && x < 16 && z > -62 && z < -42)
    || (x > 13 && x < 43 && z > -55 && z < -32)
  ));
  const poleMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.15, 5.6, 8), carbonSoft, clearLampPositions.length);
  const lampHead = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.26, 0.5), carbon, clearLampPositions.length);
  const lampLight = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.06, 0.1), amberGlow, clearLampPositions.length);
  const speakerPanels = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.55, 0.14), carbon, clearLampPositions.length * 2);
  const speakerGlow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.06, 0.04), cyanGlow, clearLampPositions.length * 2);
  clearLampPositions.forEach((lamp, i) => {
    dummy.position.set(lamp.x, 2.98, lamp.z);
    dummy.rotation.set(0, lamp.ry, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleMesh.setMatrixAt(i, dummy.matrix);
    dummy.position.set(lamp.x + Math.sin(lamp.ry) * 0.9, 5.45, lamp.z + Math.cos(lamp.ry) * 0.9);
    dummy.updateMatrix();
    lampHead.setMatrixAt(i, dummy.matrix);
    dummy.position.set(lamp.x + Math.sin(lamp.ry) * 0.9, 5.30, lamp.z + Math.cos(lamp.ry) * 0.9);
    dummy.updateMatrix();
    lampLight.setMatrixAt(i, dummy.matrix);
    for (let side = 0; side < 2; side += 1) {
      const offset = (side ? 1 : -1) * 0.55;
      dummy.position.set(
        lamp.x + Math.sin(lamp.ry) * 0.9 + Math.cos(lamp.ry) * offset,
        4.65,
        lamp.z + Math.cos(lamp.ry) * 0.9 - Math.sin(lamp.ry) * offset,
      );
      dummy.rotation.set(0.18, lamp.ry, 0);
      dummy.updateMatrix();
      speakerPanels.setMatrixAt(i * 2 + side, dummy.matrix);
      dummy.position.set(
        lamp.x + Math.sin(lamp.ry) * 0.9 + Math.cos(lamp.ry) * offset,
        4.95,
        lamp.z + Math.cos(lamp.ry) * 0.9 - Math.sin(lamp.ry) * offset,
      );
      dummy.rotation.set(0, lamp.ry, 0);
      dummy.updateMatrix();
      speakerGlow.setMatrixAt(i * 2 + side, dummy.matrix);
    }
  });
  group.add(poleMesh, lampHead, lampLight, speakerPanels, speakerGlow);

  // Wayfinding screens.
  function addWayfinder(x, z, ry) {
    addBox(carbon, x, 1.15, z, 0.28, 2.3, 0.28);
    addBox(carbonSoft, x, 2.55, z, 1.4, 3.1, 0.16);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 2.8), wayfinderMaterial);
    panel.position.set(x + Math.sin(ry) * 0.09, 2.55, z + Math.cos(ry) * 0.09);
    panel.rotation.y = ry;
    group.add(panel);
    addBox(cyanGlow, x, 4.15, z, 1.5, 0.05, 0.16);
  }
  addWayfinder(7.4, 11.6, Math.PI);
  addWayfinder(7.4, -43.2, 0);
  addWayfinder(-19.8, 40.8, Math.PI / 2);

  // Benches.
  const benchParts = [];
  const benchSeat = new THREE.BoxGeometry(2.6, 0.14, 0.62);
  benchSeat.translate(0, 0.58, 0);
  benchParts.push(benchSeat);
  const benchBack = new THREE.BoxGeometry(2.6, 0.5, 0.12);
  benchBack.translate(0, 0.92, -0.25);
  benchParts.push(benchBack);
  for (const x of [-1.05, 1.05]) {
    const leg = new THREE.BoxGeometry(0.12, 0.55, 0.5);
    leg.translate(x, 0.3, 0);
    benchParts.push(leg);
  }
  const benchGeometry = mergeGeometries(benchParts);
  const benchPositions = [
    [-39, 41, 0.25], [-18, 25, -0.4], [-38, 18, 0.15], [-12, 36, 1.2],
    [26, 61, 0.1], [6.8, 26, -Math.PI / 2], [-6.8, 44, Math.PI / 2],
    [-23, 62.5, 0.4], [27.5, 58.4, Math.PI],
    [57.4, -15.3, 0], [64.8, -15.3, 0],
    [52.9, -23.4, Math.PI / 2], [69.1, -23.4, -Math.PI / 2],
  ];
  const benches = new THREE.InstancedMesh(benchGeometry, wood, benchPositions.length);
  benchPositions.forEach((bench, i) => {
    dummy.position.set(bench[0], 0.2, bench[1]);
    dummy.rotation.set(0, bench[2], 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    benches.setMatrixAt(i, dummy.matrix);
  });
  group.add(benches);

  // Planters with luminous edging.
  const planterPositions = [
    [-12, 16], [-12, 24], [10.6, 32], [10.6, 48], [18, 64.8], [27, 64.5],
    [-23.2, 37], [-62, 44], [42, 62], [-34, 52],
    [52.3, -26.6], [69.7, -26.6],
  ];
  const planters = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.62, 0.72, 0.85, 10), concreteDark, planterPositions.length);
  const planterRings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.68, 0.035, 5, 24), cyanGlow, planterPositions.length);
  const planterBushes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.62, 0), hedge, planterPositions.length);
  planterRings.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  planterPositions.forEach((position, i) => {
    dummy.position.set(position[0], 0.58, position[1]);
    dummy.rotation.set(0, i * 0.6, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    planters.setMatrixAt(i, dummy.matrix);
    dummy.position.set(position[0], 1.12, position[1]);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    planterRings.setMatrixAt(i, dummy.matrix);
    dummy.position.set(position[0], 1.36, position[1]);
    dummy.rotation.set(0, i, 0);
    dummy.scale.set(1.15, 0.9, 1.15);
    dummy.updateMatrix();
    planterBushes.setMatrixAt(i, dummy.matrix);
  });
  group.add(planters, planterRings, planterBushes);

  // Trees (instanced trunks and crowns).
  const treePositions = [];
  for (let x = -158; x <= 158; x += 14) {
    if (Math.abs(x) < 11) continue;
    treePositions.push([x, 11.1, 1 + random() * 0.15]);
    if (x + 4 < -66 || x + 4 > 66) treePositions.push([x + 4, -11.1, 0.92 + random() * 0.2]);
  }
  for (let z = -144; z <= 140; z += 16) {
    if (Math.abs(z) < 12) continue;
    if (z !== 24 && z !== 8) treePositions.push([10.4, z, 0.88 + random() * 0.18]);
    treePositions.push([-10.4, z + 5, 0.9 + random() * 0.2]);
  }
  for (let x = -176; x <= 176; x += 15) {
    if (Math.abs(x) < 12) continue;
    treePositions.push([x, 158, 0.95 + random() * 0.3]);
    treePositions.push([x + 5, 150, 0.9 + random() * 0.28]);
    treePositions.push([x, -152, 0.95 + random() * 0.3]);
    treePositions.push([x + 5, -144, 0.9 + random() * 0.28]);
  }
  for (let z = -140; z <= 144; z += 15) {
    if (Math.abs(z) < 10) continue;
    treePositions.push([176, z, 0.95 + random() * 0.3]);
    treePositions.push([168, z + 5, 0.9 + random() * 0.28]);
    treePositions.push([-176, z, 0.95 + random() * 0.3]);
    treePositions.push([-168, z + 5, 0.9 + random() * 0.28]);
  }
  for (let x = -158; x <= -96; x += 18) {
    for (let z = 42; z <= 126; z += 18) {
      if (random() > 0.22) treePositions.push([x + random() * 6, z + random() * 6, 0.95 + random() * 0.4]);
    }
    for (let z = -122; z <= -66; z += 18) {
      if (random() > 0.25) treePositions.push([x + random() * 6, z + random() * 6, 0.95 + random() * 0.4]);
    }
  }
  for (let x = -78; x <= 66; x += 18) {
    for (let z = 104; z <= 148; z += 18) {
      const groveX = x + random() * 6;
      const groveZ = z + random() * 6;
      if (Math.abs(groveX) < 12 || random() <= 0.2) continue;
      treePositions.push([groveX, groveZ, 0.95 + random() * 0.4]);
    }
  }
  for (let x = 112; x <= 166; x += 18) {
    for (let z = 56; z <= 134; z += 18) {
      if (random() > 0.24) treePositions.push([x + random() * 6, z + random() * 6, 0.95 + random() * 0.4]);
    }
  }
  [
    [-42, 20], [-38, 21], [-22, 28], [-25, 54], [-22, 55], [-63, 44], [-62, 55], [-42, 56], [-30, 56],
    [-64, -8], [-66, -24], [-60, -42], [-48, -48], [-34, -50], [-26, -30], [-26, -18], [-62, -52], [-24, -45],
    [46, 68], [46, 86], [8, 84], [12, 90], [50, 60], [48, 92],
    [58, -52], [38, -56], [44, -54], [30, -45.5], [26.5, -28.5], [23.5, -40.5],
    [20, -50], [16, -22], [22, -20], [24, -6], [60, -2], [64, -4],
    [51.2, -11.6], [70.2, -11.6],
    [64, 30], [64, 50], [20, 36], [70, 62], [50, 64], [68, 44],
    [74, -44.05], [88, -44.05], [102, -44.05], [116, -44.05], [130, -44.05], [144, -44.05],
  ].forEach(([x, z]) => treePositions.push([x, z, 0.9 + random() * 0.35]));

  // Keep the guided camera lines clear of crowns that would fill the foreground.
  const clearOfCamera = [[10.4, 40], [10.4, -40], [10.4, -56], [20, -50], [-14, 11.1]];
  for (let i = treePositions.length - 1; i >= 0; i -= 1) {
    const [x, z] = treePositions[i];
    const inStationHardscape = (x > 7 && x < 44 && z > -56 && z < -32)
      || (x > -30 && x < 18 && z > -74 && z < -41);
    if (inStationHardscape || clearOfCamera.some(([cx, cz]) => Math.abs(cx - x) < 0.6 && Math.abs(cz - z) < 0.6)) treePositions.splice(i, 1);
  }

  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.18, 0.3, 3.4, 7),
    new THREE.MeshStandardMaterial({ color: 0x4d3a2d, roughness: 0.92 }),
    treePositions.length,
  );
  const crowns = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1.6, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86 }),
    treePositions.length * 2,
  );
  treePositions.forEach((tree, i) => {
    const [x, z, scale] = tree;
    dummy.position.set(x, 1.7 * scale + 0.16, z);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    for (let crownIndex = 0; crownIndex < 2; crownIndex += 1) {
      const offset = crownIndex === 0 ? 0 : 0.5;
      dummy.position.set(x + (crownIndex ? 0.45 : -0.2) * scale, (3.9 + offset) * scale + 0.16, z + (crownIndex ? 0.35 : -0.3) * scale);
      dummy.rotation.set(random() * 0.4, random() * TAU, random() * 0.4);
      dummy.scale.set(scale * (crownIndex ? 0.78 : 1), scale * (crownIndex ? 0.72 : 0.95), scale * (crownIndex ? 0.78 : 1));
      dummy.updateMatrix();
      crowns.setMatrixAt(i * 2 + crownIndex, dummy.matrix);
      crowns.setColorAt(i * 2 + crownIndex, new THREE.Color([0x2f6b4a, 0x3d8259, 0x2a5e4a, 0x35755e][(i + crownIndex) % 4]));
    }
  });
  group.add(trunks, crowns);

  // --- Crosswalk signals --------------------------------------------------
  function addSignal(x, z, ry) {
    addCyl(carbonSoft, x, 2.3, z, 0.1, 0.14, 4.6, 8);
    addBox(carbonSoft, x + Math.sin(ry) * 1.6, 4.55, z + Math.cos(ry) * 1.6, 3.4, 0.16, 0.16, 0, ry, 0);
    addBox(carbon, x + Math.sin(ry) * 3.1, 4.2, z + Math.cos(ry) * 3.1, 0.6, 1.3, 0.42, 0, ry, 0);
    addBox(redGlow, x + Math.sin(ry) * 3.1, 4.55, z + Math.cos(ry) * 3.1, 0.18, 0.18, 0.06, 0, ry, 0);
    addBox(amberGlow, x + Math.sin(ry) * 3.1, 4.25, z + Math.cos(ry) * 3.1, 0.18, 0.18, 0.06, 0, ry, 0);
    addBox(greenGlow, x + Math.sin(ry) * 3.1, 3.95, z + Math.cos(ry) * 3.1, 0.18, 0.18, 0.06, 0, ry, 0);
  }
  addSignal(-7.3, 7.3, Math.PI / 4);
  addSignal(7.3, 7.3, -Math.PI / 4);
  addSignal(7.3, -7.3, Math.PI * 0.75);
  addSignal(-7.3, -7.3, -Math.PI * 0.75);

  // --- AV pad and transit stop -------------------------------------------
  addBox(lotAsphalt, 13, 0.14, 18, 9.4, 0.12, 9.4);
  addBox(concreteDark, 13, 5.65, 18, 9.2, 0.45, 9.2);
  addPanel(avPadMaterial, 13, 5.9, 18, 8.2, 8.2, 0, -Math.PI / 2);
  for (const [sx, sz] of [[9.7, 14.7], [16.3, 14.7], [9.7, 21.3], [16.3, 21.3]]) {
    addBox(white, sx, 2.8, sz, 1.1, 5.6, 1.1);
    addBox(carbon, sx, 3.4, sz, 1.25, 0.16, 1.25);
    addBox(cyanGlow, sx, 5.3, sz, 1.2, 0.06, 0.08);
  }
  const rampAngle = -0.72;
  addBox(white, 13, 3.05, 10.6, 3.2, 0.3, 6.8, rampAngle, 0, 0);
  addBox(cyanGlow, 11.42, 3.18, 10.6, 0.07, 0.07, 6.8, rampAngle, 0, 0);
  addBox(cyanGlow, 14.58, 3.18, 10.6, 0.07, 0.07, 6.8, rampAngle, 0, 0);
  addBox(white, 11.6, 2.0, 12.9, 0.36, 4.0, 0.36);
  addBox(white, 14.4, 2.0, 12.9, 0.36, 4.0, 0.36);
  addBox(white, 13, 0.42, 7.3, 3.4, 0.56, 1.1);
  addBox(carbon, 13, 5.98, 18, 9.4, 0.14, 9.4);

  // --- Training / transit signage along collector -------------------------
  addBox(glass, -9.4, 1.4, 29, 0.1, 2.2, 5.4);
  addBox(carbon, -9.4, 2.62, 29, 0.16, 0.16, 5.8);
  addBox(carbon, -9.4, 0.25, 26.4, 0.22, 0.5, 0.22);
  addBox(carbon, -9.4, 0.25, 31.6, 0.22, 0.5, 0.22);
  addPanel(transitStopMaterial, -9.32, 1.5, 29, 4.4, 1.3, Math.PI / 2);

  // --- Animated traffic ---------------------------------------------------
  const carParts = [];
  const carBody = new THREE.BoxGeometry(4.3, 0.68, 1.9);
  carBody.translate(0, 0.62, 0);
  carParts.push(carBody);
  const carHood = new THREE.BoxGeometry(1.3, 0.28, 1.8);
  carHood.translate(1.6, 0.88, 0);
  carParts.push(carHood);
  const carCabin = new THREE.BoxGeometry(2.05, 0.62, 1.65);
  carCabin.translate(-0.35, 1.22, 0);
  carParts.push(carCabin);
  for (const x of [-1.35, 1.35]) {
    for (const z of [-0.92, 0.92]) {
      const wheel = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 10);
      wheel.rotateZ(Math.PI / 2);
      wheel.translate(x, 0.35, z);
      carParts.push(wheel);
    }
  }
  const carGeometry = mergeGeometries(carParts);
  const carMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.55 });
  const carCount = 19;
  const carMesh = new THREE.InstancedMesh(carGeometry, carMaterial, carCount);
  carMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const parkedColors = [0x171c23, 0x6f7b86, 0x303943, 0x9ea8af, 0x1b2a36, 0x7a2f3f, 0x2c4a55, 0xd9dde0, 0x1a1d24, 0x40515c, 0x233c47, 0x8c969c];
  for (let i = 6; i < carCount; i += 1) {
    carMesh.setColorAt(i, new THREE.Color(parkedColors[(i - 6) % parkedColors.length]));
  }
  group.add(carMesh);
  const parkedPlacements = [
    [27.5, 13.9, 0], [36.2, 17, Math.PI / 2], [42, 17, Math.PI / 2],
    [46.5, 17, Math.PI / 2], [52, 17, Math.PI / 2], [-31.5, -12.8, Math.PI / 2],
    [17, -48.5, Math.PI / 2], [26, -48.5, Math.PI / 2], [35, -48.5, Math.PI / 2], [39.5, -48.5, Math.PI / 2], [64, 10.6, 0],
    [88, -37.45, 0], [132, -42.55, Math.PI],
  ];
  parkedPlacements.forEach(([x, z, ry], index) => {
    dummy.position.set(x, 0.2, z);
    dummy.rotation.set(0, ry, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    carMesh.setMatrixAt(index + 6, dummy.matrix);
  });

  const movingCars = [
    { x: -60, lane: 2.2, dir: 1, speed: 12.5, length: 328, offset: 0 },
    { x: -12, lane: 2.2, dir: 1, speed: 10.2, length: 328, offset: 0 },
    { x: 46, lane: 2.2, dir: 1, speed: 14, length: 328, offset: 0 },
    { x: 70, lane: -2.2, dir: -1, speed: 13, length: 328, offset: 0 },
    { x: 22, lane: -2.2, dir: -1, speed: 11.5, length: 328, offset: 0 },
    { x: -36, lane: -2.2, dir: -1, speed: 15, length: 328, offset: 0 },
  ];
  movingCars.forEach((car, index) => carMesh.setColorAt(index, new THREE.Color([0x14181f, 0x3894a8, 0x7a2538, 0x1b2029, 0xbcb187, 0x273a46][index])));

  const carLight = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.16, 0.35), whiteGlow, 12);
  const carTail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.14, 0.32), redGlow, 12);
  carLight.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  carTail.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(carLight, carTail);

  // --- Pedestrians --------------------------------------------------------
  const walkerData = [];
  function addWalker(data) { walkerData.push(data); }
  [
    { axis: 'x', at: 7.7, min: -62, max: 62, dir: 1, speed: 1.1, offset: 6, jog: false, shirt: 0x1d5a65 },
    { axis: 'x', at: 8.2, min: -58, max: 58, dir: -1, speed: 0.9, offset: 22, jog: false, shirt: 0xd6d2c4 },
    { axis: 'x', at: -7.7, min: -54, max: 54, dir: 1, speed: 1.05, offset: 37, jog: false, shirt: 0x7d273c },
    { axis: 'x', at: 7.8, min: -48, max: 48, dir: -1, speed: 1.3, offset: 14, jog: true, shirt: 0x2c3a46 },
    { axis: 'z', at: 5.8, min: -32, max: 60, dir: 1, speed: 0.95, offset: 12, jog: false, shirt: 0xcfede6 },
    { axis: 'z', at: -5.8, min: -34, max: 58, dir: -1, speed: 1.0, offset: 29, jog: false, shirt: 0x354c73 },
    { axis: 'z', at: 5.8, min: 8, max: 58, dir: -1, speed: 1.15, offset: 3, jog: false, shirt: 0xe2b37b },
    { axis: 'z', at: 7.2, min: 12, max: 56, dir: 1, speed: 0.8, offset: 9, jog: false, shirt: 0x9d4f5d },
    { axis: 'x', at: -35.35, min: 74, max: 152, dir: 1, speed: 1.0, offset: 8, jog: false, shirt: 0x375f6b, ground: 0.205 },
    { axis: 'x', at: -44.65, min: 76, max: 152, dir: -1, speed: 0.85, offset: 31, jog: true, shirt: 0xc7c1ad, ground: 0.205 },
    { axis: 'x', at: -35.3, min: 78, max: 150, dir: -1, speed: 1.25, offset: 44, jog: false, shirt: 0x5c4b6e, ground: 0.205 },
    { axis: 'z', at: 73.3, min: -44.0, max: -36.0, dir: 1, speed: 0.8, offset: 2, jog: false, shirt: 0x2f5f58, ground: 0.223 },
    { axis: 'z', at: 73.9, min: -44.0, max: -36.0, dir: -1, speed: 0.75, offset: 5, jog: false, shirt: 0xcaa269, ground: 0.223 },
    { axis: 'x', at: -27.45, min: 53, max: 69, dir: 1, speed: 0.45, offset: 4, jog: false, shirt: 0xd6a07d, ground: 0.205 },
    { axis: 'x', at: -27.35, min: 53, max: 69, dir: -1, speed: 0.4, offset: 9, jog: false, shirt: 0x4f6f52, ground: 0.205 },
    { axis: 'x', at: -14.35, min: 53.5, max: 68.5, dir: 1, speed: 0.55, offset: 6, jog: false, shirt: 0x7c4b5e, ground: 0.19 },
  ].forEach(addWalker);
  [
    { cx: -43, cz: 35, rx: 17.5, rz: 13.8, speed: 0.11, offset: 1.2, jog: false, shirt: 0x2a5f54 },
    { cx: -43, cz: 35, rx: 17.5, rz: 13.8, speed: 0.1, offset: 3.6, jog: false, shirt: 0xc9d6d4 },
    { cx: -48, cz: -26, rx: 12.8, rz: 7.7, speed: 0.22, offset: 0.4, jog: true, shirt: 0xd3a24a },
    { cx: -48, cz: -26, rx: 12.8, rz: 7.7, speed: 0.19, offset: 2.1, jog: true, shirt: 0x4e7f95 },
    { cx: 44, cz: 33, rx: 11.5, rz: 2.2, speed: 0.14, offset: 0.4, jog: false, shirt: 0x9c8b5f },
    { cx: 22, cz: 63.4, rx: 4.5, rz: 1.8, speed: 0.12, offset: 2.2, jog: false, shirt: 0x54686a },
    { cx: junction.x, cz: junction.z, rx: 10.5, rz: 10.5, speed: 0.09, offset: 0.35, jog: false, shirt: 0x2f7f92, ground: 0.22 },
    { cx: junction.x, cz: junction.z, rx: 10.5, rz: 10.5, speed: -0.075, offset: 2.6, jog: false, shirt: 0xd8b06a, ground: 0.22 },
    { cx: junction.x, cz: junction.z, rx: 10.5, rz: 10.5, speed: 0.115, offset: 4.5, jog: true, shirt: 0x9e3b55, ground: 0.22 },
  ].forEach((walker) => addWalker({ ...walker, kind: 'ellipse' }));

  function curveSidewalkPath(offset, from = 0.1, to = 0.84, steps = 26) {
    const points = [];
    let length = 0;
    for (let i = 0; i <= steps; i += 1) {
      const t = from + (to - from) * (i / steps);
      const point = drivePoint(t);
      const tangent = driveTangent(t);
      const x = point.x - tangent.y * offset;
      const z = point.y + tangent.x * offset;
      if (i > 0) {
        const previous = points[i - 1];
        length += Math.hypot(x - previous.x, z - previous.z);
      }
      points.push({ x, z, distance: length });
    }
    return { points, length };
  }
  [
    { ...curveSidewalkPath(5.9), speed: 0.95, offset: 6, dir: 1, jog: false, shirt: 0x355d75, ground: 0.22 },
    { ...curveSidewalkPath(-5.9), speed: 0.85, offset: 24, dir: -1, jog: false, shirt: 0xbd7f5c, ground: 0.22 },
    { ...curveSidewalkPath(5.9), speed: 1.2, offset: 39, dir: -1, jog: true, shirt: 0x486e46, ground: 0.22 },
  ].forEach((path) => addWalker({ ...path, kind: 'path' }));

  const skinTones = [0xd6a07d, 0x8d5b44, 0xc28b68, 0x6d4537, 0xe0b090, 0x9a684d];
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }), walkerData.length);
  const torsos = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.42, 1.08, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.76 }), walkerData.length);
  const arms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.085, 0.11, 0.98, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 }), walkerData.length * 2);
  const legs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.13, 1.05, 6), carbonSoft, walkerData.length * 2);
  const visors = new THREE.InstancedMesh(new THREE.BoxGeometry(0.44, 0.08, 0.1), cyanGlow, walkerData.length);
  const walkerShadows = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.48, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    walkerData.length,
  );
  [heads, torsos, arms, legs, visors, walkerShadows].forEach((mesh) => { mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); });
  walkerData.forEach((walker, index) => {
    heads.setColorAt(index, new THREE.Color(skinTones[index % skinTones.length]));
    torsos.setColorAt(index, new THREE.Color(walker.shirt));
    arms.setColorAt(index * 2, new THREE.Color(skinTones[index % skinTones.length]));
    arms.setColorAt(index * 2 + 1, new THREE.Color(skinTones[index % skinTones.length]));
  });
  group.add(heads, torsos, arms, legs, visors, walkerShadows);

  const partMatrix = new THREE.Matrix4();
  const rootMatrix = new THREE.Matrix4();
  const rootQuaternion = new THREE.Quaternion();
  const rootScale = new THREE.Vector3(1, 1, 1);
  function composePart(position, rotation) {
    return new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(1, 1, 1),
    );
  }
  function setPart(mesh, index, localPosition, localRotation = [0, 0, 0]) {
    partMatrix.copy(composePart(localPosition, localRotation));
    matrix.multiplyMatrices(rootMatrix, partMatrix);
    mesh.setMatrixAt(index, matrix);
  }

  function updateWalkers(elapsed) {
    walkerData.forEach((walker, index) => {
      let x;
      let z;
      let yaw;
      if (walker.kind === 'ellipse') {
        const angle = walker.offset + elapsed * walker.speed;
        x = walker.cx + Math.cos(angle) * walker.rx;
        z = walker.cz + Math.sin(angle) * walker.rz;
        yaw = Math.atan2(-Math.sin(angle) * walker.rx, Math.cos(angle) * walker.rz);
      } else if (walker.kind === 'path') {
        const span = walker.length;
        let travel = ((walker.offset + elapsed * walker.speed) % span + span) % span;
        if (walker.dir < 0) travel = span - travel;
        const points = walker.points;
        let segment = 1;
        while (segment < points.length - 1 && points[segment].distance < travel) segment += 1;
        const from = points[segment - 1];
        const to = points[segment];
        const segmentLength = Math.max(to.distance - from.distance, 1e-4);
        const amount = Math.min(Math.max((travel - from.distance) / segmentLength, 0), 1);
        x = from.x + (to.x - from.x) * amount;
        z = from.z + (to.z - from.z) * amount;
        const dx = ((to.x - from.x) / segmentLength) * walker.dir;
        const dz = ((to.z - from.z) / segmentLength) * walker.dir;
        yaw = Math.atan2(dx, dz);
      } else {
        const span = walker.max - walker.min;
        const travel = ((walker.offset + elapsed * walker.speed) % span);
        const position = walker.dir > 0 ? travel : span - travel;
        if (walker.axis === 'x') {
          x = walker.min + position;
          z = walker.at;
          yaw = walker.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          x = walker.at;
          z = walker.min + position;
          yaw = walker.dir > 0 ? 0 : Math.PI;
        }
      }
      const stride = elapsed * (walker.jog ? 7.4 : 3.6) + index * 1.7;
      const bob = Math.abs(Math.sin(stride)) * (walker.jog ? 0.07 : 0.025);
      const ground = walker.ground ?? 0.2;
      rootMatrix.compose(
        new THREE.Vector3(x, ground + bob, z),
        rootQuaternion.setFromAxisAngle(UP, yaw),
        rootScale,
      );
      const swing = Math.sin(stride) * (walker.jog ? 0.7 : 0.42);
      setPart(heads, index, [0, 2.3, 0]);
      setPart(torsos, index, [0, 1.52, 0]);
      setPart(visors, index, [0, 2.34, 0.28]);
      setPart(arms, index * 2, [0.43, 1.48, 0], [swing * 0.8, 0, -0.1]);
      setPart(arms, index * 2 + 1, [-0.43, 1.48, 0], [-swing * 0.8, 0, 0.1]);
      setPart(legs, index * 2, [0.2, 0.56, 0], [-swing, 0, 0.02]);
      setPart(legs, index * 2 + 1, [-0.2, 0.56, 0], [swing, 0, -0.02]);
      dummy.position.set(x, ground + 0.015, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      walkerShadows.setMatrixAt(index, dummy.matrix);
    });
    [heads, torsos, arms, legs, visors, walkerShadows].forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
  }
  updateWalkers(0);

  const stationTrain = createStationTrain({
    parent: group,
    config: { ...STATION_CONFIG.train, trackZ: STATION_CONFIG.track.z },
    materials: { white, carbon, carbonSoft, chrome, darkGlass, cyanGlow, amberGlow },
    onAudio,
  });
  const stationPassengers = createStationPassengers({ parent: group, config: STATION_CONFIG, onAudio });
  const benchCommuter = createBenchCommuter({ parent: group, config: STATION_CONFIG, reducedMotion });

  // --- Quadruped estate patrol mech --------------------------------------
  function makeQuadMech() {
    const mech = new THREE.Group();
    const legPivots = [];
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.1, 1.8), carbon);
    body.position.y = 2.05;
    mech.add(body);
    const topPlate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.5), white);
    topPlate.position.y = 2.68;
    mech.add(topPlate);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 0.9), carbonSoft);
    head.position.set(0, 2.4, 1.12);
    mech.add(head);
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.08), redGlow);
    eye.position.set(0, 2.42, 1.6);
    mech.add(eye);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(sx * 1.02, 1.75, sz * 0.62);
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.05, 6), carbonSoft);
        upper.position.y = -0.52;
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.0, 6), chrome);
        lower.position.y = -1.38;
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.18, 0.62), carbon);
        foot.position.set(0, -1.9, 0.08);
        pivot.add(upper, lower, foot);
        mech.add(pivot);
        legPivots.push(pivot);
      }
    }
    const laserPivot = new THREE.Group();
    laserPivot.position.set(0, 2.42, 1.5);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.09, 9.5, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff2848, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    beam.rotation.x = Math.PI / 2;
    beam.position.z = 4.75;
    laserPivot.add(beam);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), redGlow);
    dot.position.set(0, 0, 9.4);
    laserPivot.add(dot);
    mech.add(laserPivot);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.8, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    mech.add(shadow);
    group.add(mech);
    return { group: mech, legs: legPivots, laser: laserPivot };
  }
  const quadMech = makeQuadMech();

  // --- Bipedal street patrol mech ----------------------------------------
  function makeBipedMech() {
    const mech = new THREE.Group();
    const legPivots = [];
    const armPivots = [];
    const hips = new THREE.Group();
    hips.position.y = 2.5;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.7, 1.15), carbon);
    torso.position.y = 0.9;
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 1.35), white);
    chest.position.y = 1.55;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.75), carbonSoft);
    head.position.set(0, 2.15, 0.08);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.06), redGlow);
    visor.position.set(0, 2.18, 0.48);
    hips.add(torso, chest, head, visor);
    for (const sx of [-1, 1]) {
      const shin = new THREE.Group();
      shin.position.set(sx * 0.5, 0, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.2, 6), carbonSoft);
      thigh.position.y = -0.6;
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.2, 6), chrome);
      calf.position.y = -1.8;
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.5), white);
      knee.position.y = -1.2;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.95), carbon);
      foot.position.set(0, -2.42, 0.16);
      shin.add(thigh, calf, knee, foot);
      hips.add(shin);
      legPivots.push(shin);
    }
    for (const sx of [-1, 1]) {
      const armPivot = new THREE.Group();
      armPivot.position.set(sx * 1.08, 1.62, 0);
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.8), white);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 6), carbonSoft);
      arm.position.y = -0.8;
      armPivot.add(shoulder, arm);
      hips.add(armPivot);
      armPivots.push(armPivot);
    }
    mech.add(hips);
    const laserPivot = new THREE.Group();
    laserPivot.position.set(0, 4.68, 0.46);
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.08, 13, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff2848, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    beam.rotation.x = Math.PI / 2;
    beam.position.z = 6.5;
    laserPivot.add(beam);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), redGlow);
    dot.position.set(0, 0, 12.9);
    laserPivot.add(dot);
    mech.add(laserPivot);
    const shoulderPlate = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.12, 0.88), redGlow);
    shoulderPlate.position.set(1.08, 1.95, 0);
    mech.add(shoulderPlate);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.4, 18), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.26, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.03;
    mech.add(shadow);
    group.add(mech);
    return { group: mech, legs: legPivots, arms: armPivots, hips, laser: laserPivot };
  }
  const bipedMech = makeBipedMech();

  // --- Drones -------------------------------------------------------------
  function makeDrone(scale = 1, cleaning = false) {
    const drone = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), chrome);
    body.scale.set(1, 0.62, 1);
    drone.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.09, 0.52), carbon);
    top.position.y = 0.14;
    drone.add(top);
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), cyanGlow);
    light.position.set(0, 0.06, 0.32);
    drone.add(light);
    const rotors = [];
    for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.06), carbonSoft);
      arm.position.set(x * 0.55, 0.08, z * 0.55);
      arm.rotation.y = Math.atan2(x, z);
      drone.add(arm);
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.03, 12), carbonSoft);
      rotor.position.set(x, 0.14, z);
      drone.add(rotor);
      rotors.push(rotor);
    }
    if (cleaning) {
      const brush = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x5cffe6, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      brush.position.y = -0.55;
      brush.rotation.x = Math.PI;
      drone.add(brush);
    }
    drone.scale.setScalar(scale);
    group.add(drone);
    return { group: drone, rotors };
  }
  const drones = [
    { ...makeDrone(1.1), cx: 57, cz: -20, radius: 3.2, y: 2.5, speed: 0.55, phase: 0 },
    { ...makeDrone(1.0), cx: 31, cz: -40, radius: 4.2, y: 2.2, speed: 0.45, phase: 2.1 },
    { ...makeDrone(1.2, true), cx: -4.8, cz: 20, radius: 2.4, y: 0.85, speed: 0.7, phase: 1.1 },
    { ...makeDrone(0.9, true), cx: 34, cz: 27, radius: 5.2, y: 0.9, speed: 0.6, phase: 3.3 },
    { ...makeDrone(1.0), cx: -45, cz: 37, radius: 6.5, y: 3.4, speed: 0.35, phase: 4.2 },
    { ...makeDrone(1.15), cx: -9, cz: -67, radius: 8.5, y: 14.4, speed: 0.42, phase: 0.7 },
  ];

  // --- Hover AV -----------------------------------------------------------
  const av = new THREE.Group();
  const avBody = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 2.25), carbon);
  avBody.position.y = 0.4;
  av.add(avBody);
  const avCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.8), darkGlass);
  avCanopy.position.set(-0.25, 0.98, 0);
  av.add(avCanopy);
  const avNose = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 2.05), white);
  avNose.position.set(1.85, 0.6, 0);
  av.add(avNose);
  const avLights = [];
  for (const [x, z] of [[-1.7, -1.25], [1.7, -1.25], [-1.7, 1.25], [1.7, 1.25]]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 6), chrome);
    strut.position.set(x, 0.18, z);
    av.add(strut);
    const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 14), carbonSoft);
    turbine.position.set(x, -0.22, z);
    av.add(turbine);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 20), cyanGlow);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, -0.16, z);
    av.add(ring);
    avLights.push(turbine);
  }
  const avTail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 1.7), redGlow);
  avTail.position.set(-2.36, 0.55, 0);
  av.add(avTail);
  av.position.set(13, 7.4, 18);
  av.rotation.y = -0.35;
  group.add(av);
  const avLight = new THREE.PointLight(0x5cefff, 22, 14, 2);
  avLight.position.set(13, 6.8, 18);
  group.add(avLight);

  // --- Swings -------------------------------------------------------------
  addBox(carbon, -55.2, 2.4, 13.2, 0.12, 4.2, 0.12, 0, 0, -0.2);
  addBox(carbon, -52.0, 2.4, 13.2, 0.12, 4.2, 0.12, 0, 0, 0.2);
  addBox(carbon, -53.6, 4.35, 13.2, 4.0, 0.12, 0.12);
  const swings = [];
  for (let i = 0; i < 3; i += 1) {
    const swing = new THREE.Group();
    swing.position.set(-55.0 + i * 1.4, 4.2, 13.3);
    const left = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4), chrome);
    left.position.set(-0.32, -1.2, 0);
    const right = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4), chrome);
    right.position.set(0.32, -1.2, 0);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.42), i === 1 ? amberGlow : cyanGlow);
    seat.position.y = -2.4;
    swing.add(left, right, seat);
    group.add(swing);
    swings.push(swing);
  }

  // --- Lights -------------------------------------------------------------
  const mallLight = new THREE.PointLight(0x66eaff, 34, 38, 2);
  mallLight.position.set(44, 7, 32);
  group.add(mallLight);
  const stationLight = new THREE.PointLight(0x6df1ff, 26, 34, 2);
  stationLight.position.set(-9, 12, -60);
  group.add(stationLight);
  const churchLight = new THREE.PointLight(0xffb86b, 24, 26, 2);
  churchLight.position.set(22, 5, 66);
  group.add(churchLight);
  const parkLight = new THREE.PointLight(0x9dffc8, 18, 28, 2);
  parkLight.position.set(-43, 6, 30);
  group.add(parkLight);

  // --- Distant megacity ring ---------------------------------------------
  const towerTexture = makeTowerWindowTexture(random);
  const towerMaterial = new THREE.MeshStandardMaterial({
    color: 0x201a28, map: towerTexture, emissiveMap: towerTexture,
    emissive: 0xff4455, emissiveIntensity: 0.5, roughness: 0.8, metalness: 0.3,
  });
  const towers = [];
  for (let i = 0; i < 34; i += 1) {
    const angle = (i / 34) * TAU + random() * 0.08;
    const radius = 230 + random() * 45;
    towers.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      width: 6 + random() * 12,
      height: 26 + random() * 65,
      depth: 6 + random() * 12,
    });
  }
  const towerMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), towerMaterial, towers.length);
  towers.forEach((tower, i) => {
    dummy.position.set(tower.x, tower.height / 2 - 2, tower.z);
    dummy.rotation.set(0, random() * TAU, 0);
    dummy.scale.set(tower.width, tower.height, tower.depth);
    dummy.updateMatrix();
    towerMesh.setMatrixAt(i, dummy.matrix);
  });
  group.add(towerMesh);

  // --- Merged static geometry --------------------------------------------
  buckets.forEach((geometries, material) => {
    if (!geometries.length) return;
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, material);
    group.add(mesh);
  });

  // --- Update loop --------------------------------------------------------
  const carLocal = new THREE.Matrix4();
  const carRoot = new THREE.Matrix4();
  const carQuaternion = new THREE.Quaternion();
  const carScale = new THREE.Vector3(1, 1, 1);

  function updateCars(elapsed) {
    movingCars.forEach((car, index) => {
      const x = car.dir > 0
        ? -164 + ((car.offset + elapsed * car.speed) % car.length)
        : 164 - ((car.offset + elapsed * car.speed) % car.length);
      const yaw = car.dir > 0 ? 0 : Math.PI;
      carRoot.compose(new THREE.Vector3(x, 0.1, car.lane), carQuaternion.setFromAxisAngle(UP, yaw), carScale);
      carMesh.setMatrixAt(index, carRoot);
      for (let side = 0; side < 2; side += 1) {
        const z = side === 0 ? -0.62 : 0.62;
        carLocal.copy(new THREE.Matrix4().compose(
          new THREE.Vector3(2.18, 0.62, z),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1),
        ));
        matrix.multiplyMatrices(carRoot, carLocal);
        carLight.setMatrixAt(index * 2 + side, matrix);
        carLocal.copy(new THREE.Matrix4().compose(
          new THREE.Vector3(-2.18, 0.62, z),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1),
        ));
        matrix.multiplyMatrices(carRoot, carLocal);
        carTail.setMatrixAt(index * 2 + side, matrix);
      }
    });
    carMesh.instanceMatrix.needsUpdate = true;
    carLight.instanceMatrix.needsUpdate = true;
    carTail.instanceMatrix.needsUpdate = true;
  }
  updateCars(0);

  return {
    group,
    getStationDebugState() {
      return { train: stationTrain.getDebugState(), passengers: stationPassengers.getDebugState() };
    },
    setWeather(mode) {
      const wet = mode === 'rain' || mode === 'storm';
      sunGroup.visible = !wet;
      cloudMaterial.opacity = mode === 'storm' ? 0.6 : mode === 'rain' ? 0.5 : mode === 'wind' ? 0.16 : 0.22;
      cloudMaterial.color.setHex(mode === 'storm' ? 0x8c99a4 : 0xffffff);
    },
    update(delta, elapsed) {
      holoUniforms.uTime.value = elapsed;
      scanUniforms.uTime.value = elapsed;

      updateWalkers(elapsed);
      updateCars(elapsed);

      stationTrain.update(delta, elapsed, stationPassengers.gates);
      stationPassengers.update(delta, elapsed, stationTrain.service);
      benchCommuter.update(elapsed);

      const avBob = Math.sin(elapsed * 0.9) * 0.16;
      av.position.y = 7.4 + avBob;
      av.rotation.z = Math.sin(elapsed * 0.7) * 0.015;
      avLights.forEach((turbine, index) => { turbine.rotation.y = elapsed * (9 + index); });
      avLight.intensity = 20 + Math.sin(elapsed * 2.4) * 3;

      const quadAngle = elapsed * 0.115;
      quadMech.group.position.set(junction.x + Math.cos(quadAngle) * 6.4, 0.24, junction.z + Math.sin(quadAngle) * 6.4);
      quadMech.group.rotation.y = Math.atan2(-Math.sin(quadAngle), Math.cos(quadAngle));
      quadMech.group.position.y = 0.24 + Math.abs(Math.sin(elapsed * 2.4)) * 0.05;
      quadMech.legs.forEach((leg, index) => {
        leg.rotation.x = Math.sin(elapsed * 2.4 + (index % 2 ? Math.PI : 0)) * 0.28;
      });
      quadMech.laser.rotation.x = 0.26;
      quadMech.laser.rotation.y = Math.sin(elapsed * 0.75) * 0.72;

      const patrol = (elapsed * 0.028) % 2;
      const bipedX = patrol < 1 ? -24 + patrol * 48 : 24 - (patrol - 1) * 48;
      const bipedYaw = patrol < 1 ? Math.PI / 2 : -Math.PI / 2;
      bipedMech.group.position.set(bipedX, 0.18, 7.45);
      bipedMech.group.rotation.y = bipedYaw;
      bipedMech.group.position.y = 0.18 + Math.abs(Math.sin(elapsed * 2.6)) * 0.06;
      bipedMech.legs.forEach((leg, index) => {
        leg.rotation.x = Math.sin(elapsed * 2.6 + (index ? Math.PI : 0)) * 0.3;
      });
      bipedMech.arms.forEach((arm, index) => {
        arm.rotation.x = Math.sin(elapsed * 2.6 + (index ? 0 : Math.PI)) * 0.22;
      });
      bipedMech.laser.rotation.x = 0.2;
      bipedMech.laser.rotation.y = Math.sin(elapsed * 0.55) * 0.48;

      drones.forEach((drone, index) => {
        const angle = drone.phase + elapsed * drone.speed;
        drone.group.position.set(
          drone.cx + Math.cos(angle) * drone.radius,
          drone.y + Math.sin(elapsed * 1.4 + index) * 0.18,
          drone.cz + Math.sin(angle) * drone.radius,
        );
        drone.group.rotation.y = -angle + Math.PI / 2;
        drone.rotors.forEach((rotor, rotorIndex) => {
          rotor.rotation.y = elapsed * (22 + rotorIndex * 2);
        });
      });

      swings.forEach((swing, index) => {
        swing.rotation.x = Math.sin(elapsed * 1.15 + index * 0.8) * 0.22;
      });
      parkSwings.forEach((swing, index) => {
        swing.rotation.x = Math.sin(elapsed * 1.6 + index * 1.3) * 0.38;
      });
      seesaw.rotation.z = Math.sin(elapsed * 1.25) * 0.2;

      if (fountainJet) {
        fountainJet.scale.y = 1 + Math.sin(elapsed * 2.2) * 0.06;
        fountainJet.material.opacity = 0.33 + Math.sin(elapsed * 3.1) * 0.08;
      }
      const poolOffset = elapsed * 0.012;
      poolTexture.offset.x = poolOffset % 1;
      poolTexture.offset.y = Math.sin(elapsed * 0.25) * 0.03;

      scanUniforms.uGlow.value = 0.55 + Math.abs(Math.sin(elapsed * 0.8)) * 0.6;
      bollardGlow.opacity = 0.45 + Math.abs(Math.sin(elapsed * 2.2)) * 0.4;
      bioSignMaterial.opacity = Math.sin(elapsed * 13.7) > -0.975 ? 1 : 0.55;
      estateSignMaterial.color.setScalar(0.94 + Math.sin(elapsed * 1.4) * 0.03);
      poolWater.emissiveIntensity = 0.5 + Math.sin(elapsed * 0.8) * 0.06;
    },
  };
}
