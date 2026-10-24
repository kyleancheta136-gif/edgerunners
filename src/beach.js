import * as THREE from 'three';

const TAU = Math.PI * 2;

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

function makeSandTexture(random) {
  const texture = canvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#7d6258';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 9500; i += 1) {
      const light = 55 + Math.floor(random() * 75);
      ctx.fillStyle = `rgba(${light + 30},${light + 14},${light},${0.08 + random() * 0.2})`;
      const size = random() > 0.94 ? 2 : 1;
      ctx.fillRect(random() * width, random() * height, size, size);
    }
    for (let i = 0; i < 24; i += 1) {
      ctx.strokeStyle = 'rgba(34,28,39,.12)';
      ctx.beginPath();
      const y = random() * height;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y + 8, 170, y - 8, width, y + 2);
      ctx.stroke();
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 8);
  return texture;
}

function makeWoodTexture(random) {
  const texture = canvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = '#342b35';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 32) {
      ctx.fillStyle = y % 64 ? '#40333a' : '#49383d';
      ctx.fillRect(0, y + 2, width, 28);
      ctx.fillStyle = '#171822';
      ctx.fillRect(0, y, width, 2);
      for (let i = 0; i < 15; i += 1) {
        ctx.fillStyle = 'rgba(211,149,124,.09)';
        ctx.fillRect(random() * width, y + 5 + random() * 20, 20 + random() * 70, 1);
      }
    }
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 12);
  return texture;
}

function makeSignTexture() {
  return canvasTexture(1024, 320, (ctx, width, height) => {
    ctx.fillStyle = 'rgba(5,7,18,.96)';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#20e6ff';
    ctx.lineWidth = 7;
    ctx.strokeRect(13, 13, width - 26, height - 26);
    ctx.fillStyle = '#ff4f8b';
    ctx.fillRect(35, 34, 180, 7);
    ctx.fillStyle = '#ffe08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff5d86';
    ctx.shadowBlur = 30;
    ctx.font = 'italic 900 148px Arial, sans-serif';
    ctx.fillText('PACIFICA', width / 2, 145, 930);
    ctx.shadowColor = '#20e6ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#66efff';
    ctx.font = '700 27px monospace';
    ctx.fillText('COASTAL DISTRICT  //  AFTERGLOW BAR', width / 2, 259, 900);
  });
}

function makeWindowTexture(random) {
  return canvasTexture(128, 256, (ctx, width, height) => {
    ctx.fillStyle = '#090d1b';
    ctx.fillRect(0, 0, width, height);
    for (let y = 8; y < height - 5; y += 15) {
      for (let x = 7; x < width - 5; x += 14) {
        const lit = random() > 0.61;
        ctx.fillStyle = lit ? (random() > 0.6 ? '#ff9b8a' : '#55cfe4') : '#111a2b';
        ctx.globalAlpha = lit ? 0.35 + random() * 0.55 : 0.65;
        ctx.fillRect(x, y, 5, 6);
      }
    }
    ctx.globalAlpha = 1;
  });
}

export function buildBeach(scene) {
  const random = seededRandom(9042077);
  const group = new THREE.Group();
  group.name = 'Pacifica Beach';
  scene.add(group);

  const dummy = new THREE.Object3D();
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const dark = new THREE.MeshStandardMaterial({ color: 0x111522, roughness: 0.48, metalness: 0.72 });
  const coralGlow = new THREE.MeshBasicMaterial({ color: 0xff537f, toneMapped: false });
  const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x42e8ff, toneMapped: false });
  const goldGlow = new THREE.MeshBasicMaterial({ color: 0xffd68a, toneMapped: false });

  function box(position, scale, material = dark, parent = group) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  function setInstance(mesh, index, position, scale, rotation = [0, 0, 0]) {
    dummy.position.set(...position);
    dummy.scale.set(...scale);
    dummy.rotation.set(...rotation);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }

  // A striped, horizon-sized sunset with a soft atmospheric halo.
  const sunMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        vec3 bottom = vec3(1.0, 0.24, 0.39);
        vec3 top = vec3(1.0, 0.91, 0.38);
        vec3 color = mix(bottom, top, smoothstep(0.05, 0.95, vUv.y));
        float cuts = step(0.17 + (1.0 - vUv.y) * 0.22, fract(vUv.y * 15.0));
        if (vUv.y < 0.48 && cuts < 0.5) discard;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(23, 96), sunMaterial);
  sun.position.set(-82, 23, -132);
  sun.renderOrder = -2;
  group.add(sun);

  const halo = new THREE.Mesh(new THREE.PlaneGeometry(76, 76), new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; void main(){
      float d=length(vUv-.5)*2.; float a=pow(max(0.,1.-d),2.8)*.32;
      gl_FragColor=vec4(1.,.19,.29,a);
    }`,
  }));
  halo.position.set(-82, 23, -132.4);
  halo.renderOrder = -3;
  group.add(halo);

  const starPositions = [];
  for (let i = 0; i < 90; i += 1) {
    starPositions.push((random() - 0.5) * 270, 35 + random() * 85, -95 - random() * 70);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    color: 0xb8dfff, size: 0.24, transparent: true, opacity: 0.65,
    depthWrite: false, fog: false, toneMapped: false,
  }));
  group.add(stars);

  // Low, distant silhouettes frame rather than cover the setting sun.
  const windowTexture = makeWindowTexture(random);
  const skylineMaterial = new THREE.MeshStandardMaterial({
    color: 0x24273c, map: windowTexture, emissiveMap: windowTexture,
    emissive: 0xb8cfff, emissiveIntensity: 0.4, roughness: 0.72, metalness: 0.35,
  });
  const skylineData = [];
  for (let x = -92; x <= 92; x += 6 + random() * 4) {
    if (Math.abs(x) < 25) continue;
    const width = 4 + random() * 5;
    const height = 8 + random() * 25;
    skylineData.push({ x, width, height, depth: 5 + random() * 7 });
  }
  const skyline = new THREE.InstancedMesh(unitBox, skylineMaterial, skylineData.length);
  skylineData.forEach((building, index) => {
    setInstance(skyline, index, [building.x, building.height / 2 - 1, -111 - random() * 8], [building.width, building.height, building.depth]);
  });
  group.add(skyline);

  // Reflective wet sand meets a displaced, fog-aware neon ocean.
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(180, 88), new THREE.MeshPhysicalMaterial({
    color: 0x9a776c, map: makeSandTexture(random), roughness: 0.3,
    metalness: 0.2, clearcoat: 0.72, clearcoatRoughness: 0.2,
  }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, -0.14, 35);
  group.add(sand);

  const waterUniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    { uTime: { value: 0 } },
  ]);
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    fog: true,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying float vWave;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec3 p = position;
        float shore = smoothstep(0.0, 0.2, uv.y);
        float a = sin(p.x * .23 + p.y * .34 + uTime * 1.15);
        float b = sin(p.x * -.41 + p.y * .18 + uTime * .78);
        float c = cos(p.x * .12 + p.y * .62 - uTime * 1.4);
        p.z = (a * .28 + b * .17 + c * .08) * mix(.16, 1., shore);
        vWave = p.z;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying float vWave;
      #include <fog_pars_fragment>
      void main() {
        vec3 dx = dFdx(vWorld);
        vec3 dy = dFdy(vWorld);
        vec3 normal = normalize(cross(dx, dy));
        if (normal.y < 0.0) normal = -normal;
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
        vec3 deep = vec3(.012, .045, .105);
        vec3 dusk = vec3(.12, .075, .19);
        vec3 color = mix(deep, dusk, fresnel * .85 + vUv.y * .16);
        float ripple = pow(max(0., sin(vWorld.z * 1.5 + vWorld.x * .23 + uTime * 1.8)), 18.0);
        float sunPath = exp(-abs(vWorld.x) * .075) * smoothstep(-28., -95., vWorld.z);
        color += vec3(1., .25, .19) * sunPath * (ripple * .65 + max(vWave, 0.) * .18);
        float cyanReflection = exp(-abs(vWorld.x - 22.) * .22) * ripple;
        float pinkReflection = exp(-abs(vWorld.x + 22.) * .18) * pow(max(0., sin(vWorld.z * 1.1 - uTime)), 12.0);
        color += vec3(.02, .65, .9) * cyanReflection * .38;
        color += vec3(.8, .02, .28) * pinkReflection * .24;
        vec3 halfDir = normalize(viewDir + normalize(vec3(-.3, .8, .4)));
        color += vec3(.5, .65, .85) * pow(max(dot(normal, halfDir), 0.), 90.) * .5;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(180, 150, 100, 110), waterMaterial);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, -0.12, -79);
  group.add(ocean);

  const foamMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vNoise;
      void main() {
        vUv = uv;
        vec3 p = position;
        float curve = sin(p.x * .12 + uTime * .55) * .65 + sin(p.x * .37 - uTime) * .16;
        p.y += curve + sin(uTime * .7) * .7;
        p.z += sin(p.x * .4 + uTime) * .025;
        vNoise = sin(p.x * 2.4 + uTime) * sin(p.y * 4. - uTime * 1.4);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vNoise;
      void main() {
        float edge = sin(vUv.y * 3.14159);
        float bands = smoothstep(.15, .8, sin(vUv.y * 27. + vNoise * 2.) * .5 + .5);
        float flecks = smoothstep(.25, .85, sin(vUv.x * 510. + vNoise * 4.) * sin(vUv.y * 73.));
        float alpha = edge * (bands * .34 + flecks * .38 + .08);
        gl_FragColor = vec4(mix(vec3(.55,.75,.85), vec3(1.,.77,.76), vUv.y), alpha);
      }
    `,
  });
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(180, 9, 120, 10), foamMaterial);
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(0, 0.025, -4);
  foam.renderOrder = 2;
  group.add(foam);

  // The Afterglow bar and timber boardwalk.
  const wood = new THREE.MeshStandardMaterial({
    color: 0x8f6870, map: makeWoodTexture(random), roughness: 0.48, metalness: 0.2,
  });
  box([-23, 0.25, 0], [18, 0.7, 13], wood);
  box([-23, 3.1, -5.2], [17, 5.5, 0.55], dark);
  box([-31.2, 3.1, 0], [0.55, 5.5, 10], dark);
  box([-14.8, 3.1, 0], [0.55, 5.5, 10], dark);
  box([-23, 6.15, 0], [19, 0.55, 12], dark);
  box([-23, 1.7, 3.1], [15, 1.1, 1.4], wood);
  box([-23, 2.32, 3.75], [15.4, 0.12, 0.12], coralGlow);
  box([-23, 5.82, 5.85], [18.5, 0.12, 0.12], cyanGlow);
  box([-31.1, 3.25, 5.3], [0.12, 5.1, 0.12], coralGlow);
  box([-14.9, 3.25, 5.3], [0.12, 5.1, 0.12], cyanGlow);
  const signMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture(), transparent: true, toneMapped: false, side: THREE.DoubleSide,
  });
  const pacificaSign = new THREE.Mesh(new THREE.PlaneGeometry(16.5, 5.15), signMaterial);
  pacificaSign.position.set(-23, 8.75, 4.8);
  group.add(pacificaSign);

  const stoolGeometry = new THREE.CylinderGeometry(0.58, 0.58, 0.18, 10);
  const stools = new THREE.InstancedMesh(stoolGeometry, coralGlow, 5);
  const stoolLegs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 1.35, 6), dark, 5);
  for (let i = 0; i < 5; i += 1) {
    const x = -29 + i * 3;
    setInstance(stools, i, [x, 1.45, 5.1], [1, 1, 1]);
    setInstance(stoolLegs, i, [x, 0.73, 5.1], [1, 1, 1]);
  }
  group.add(stools, stoolLegs);

  box([22, 0.22, 14], [8, 0.65, 43], wood);
  box([22, 0.22, -33], [7, 0.65, 63], wood);
  box([18.55, 0.58, -33], [0.1, 0.1, 62], cyanGlow);
  box([25.45, 0.58, -33], [0.1, 0.1, 62], coralGlow);
  box([18.9, 1.2, -34], [0.1, 0.1, 60], dark);
  box([25.1, 1.2, -34], [0.1, 0.1, 60], dark);

  const pierZ = [];
  for (let z = -4; z >= -64; z -= 7.5) pierZ.push(z);
  const piles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 5, 7), dark, pierZ.length * 2);
  const lampPoles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.11, 3.7, 6), dark, pierZ.length * 2);
  const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffc782, transparent: true, toneMapped: false });
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6), lampMaterial, pierZ.length * 2);
  pierZ.forEach((z, i) => {
    [18.9, 25.1].forEach((x, side) => {
      const index = i * 2 + side;
      setInstance(piles, index, [x, -1.65, z], [1, 1, 1]);
      setInstance(lampPoles, index, [x, 2.05, z], [1, 1, 1]);
      setInstance(lamps, index, [x, 3.95, z], [1, 1, 1]);
    });
  });
  group.add(piles, lampPoles, lamps);

  const barLight = new THREE.PointLight(0xff3f81, 85, 28, 2);
  barLight.position.set(-22, 5, 7);
  group.add(barLight);
  const pierLight = new THREE.PointLight(0x32dfff, 55, 30, 2);
  pierLight.position.set(22, 4, -19);
  group.add(pierLight);

  // Reusable segmented palms; only the instanced fronds move each frame.
  const palmData = [
    { x: -36, z: 8, h: 12, lx: 1.5, lz: -0.5 },
    { x: -34, z: 25, h: 14, lx: -1.2, lz: 0.8 },
    { x: -10, z: 0, h: 10, lx: -1.1, lz: 0.4 },
    { x: 34, z: 9, h: 13, lx: -1.5, lz: -0.8 },
    { x: 35, z: 28, h: 11, lx: 1.1, lz: 0.5 },
    { x: 8, z: 30, h: 12, lx: 0.8, lz: -0.6 },
  ];
  const trunkSegments = 8;
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.36, 0.47, 1, 7),
    new THREE.MeshStandardMaterial({ color: 0x584044, roughness: 0.92 }),
    palmData.length * trunkSegments,
  );
  const up = new THREE.Vector3(0, 1, 0);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  function palmPoint(palm, t, target) {
    return target.set(palm.x + palm.lx * t * t, palm.h * t, palm.z + palm.lz * t * t);
  }
  palmData.forEach((palm, palmIndex) => {
    for (let segment = 0; segment < trunkSegments; segment += 1) {
      palmPoint(palm, segment / trunkSegments, p0);
      palmPoint(palm, (segment + 1) / trunkSegments, p1);
      direction.subVectors(p1, p0);
      quaternion.setFromUnitVectors(up, direction.clone().normalize());
      const radius = 1 - segment * 0.055;
      matrix.compose(p0.clone().add(p1).multiplyScalar(0.5), quaternion, new THREE.Vector3(radius, direction.length(), radius));
      trunks.setMatrixAt(palmIndex * trunkSegments + segment, matrix);
    }
  });
  group.add(trunks);

  const frondPositions = [];
  const frondIndices = [];
  const frondSteps = 9;
  for (let i = 0; i <= frondSteps; i += 1) {
    const t = i / frondSteps;
    const width = Math.sin(t * Math.PI) * 0.72 + 0.03;
    const y = -t * t * 1.45;
    const z = t * 5.6;
    frondPositions.push(-width, y, z, width, y, z);
    if (i < frondSteps) {
      const a = i * 2;
      frondIndices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const frondGeometry = new THREE.BufferGeometry();
  frondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frondPositions, 3));
  frondGeometry.setIndex(frondIndices);
  frondGeometry.computeVertexNormals();
  const frondMaterial = new THREE.MeshStandardMaterial({ color: 0x174f51, roughness: 0.76, side: THREE.DoubleSide });
  const frondsPerPalm = 8;
  const fronds = new THREE.InstancedMesh(frondGeometry, frondMaterial, palmData.length * frondsPerPalm);
  fronds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const frondData = [];
  palmData.forEach((palm, palmIndex) => {
    for (let j = 0; j < frondsPerPalm; j += 1) {
      frondData.push({ palm, angle: j / frondsPerPalm * TAU + palmIndex * 0.41, phase: random() * TAU, scale: 0.8 + random() * 0.32 });
    }
  });
  group.add(fronds);

  // Striped umbrellas and low loungers, all instanced.
  const umbrellaData = [
    { x: -4, z: 13, s: 1 },
    { x: 8, z: 19, s: 0.9 },
    { x: -13, z: 24, s: 1.08 },
  ];
  const canopyGeometry = new THREE.ConeGeometry(3.25, 1.15, 12, 1, true).toNonIndexed();
  const canopyColors = [];
  const coral = new THREE.Color(0xe94f79);
  const cream = new THREE.Color(0xffd8a1);
  const positions = canopyGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 3) {
    const angle = Math.atan2(positions.getZ(i) + positions.getZ(i + 1) + positions.getZ(i + 2), positions.getX(i) + positions.getX(i + 1) + positions.getX(i + 2));
    const color = (Math.floor((angle + Math.PI) / TAU * 12) % 2) ? coral : cream;
    for (let j = 0; j < 3; j += 1) canopyColors.push(color.r, color.g, color.b);
  }
  canopyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(canopyColors, 3));
  const canopies = new THREE.InstancedMesh(canopyGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, side: THREE.DoubleSide }), umbrellaData.length);
  const umbrellaPoles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.065, 0.09, 4.7, 6), goldGlow, umbrellaData.length);
  umbrellaData.forEach((umbrella, i) => {
    setInstance(canopies, i, [umbrella.x, 4.65, umbrella.z], [umbrella.s, umbrella.s, umbrella.s], [0, i * 0.4, 0]);
    setInstance(umbrellaPoles, i, [umbrella.x, 2.3, umbrella.z], [1, 1, 1]);
  });
  group.add(canopies, umbrellaPoles);

  const loungerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, metalness: 0.3 });
  const loungers = new THREE.InstancedMesh(unitBox, loungerMaterial, umbrellaData.length * 6);
  const localMatrix = new THREE.Matrix4();
  const rootMatrix = new THREE.Matrix4();
  const rootQuaternion = new THREE.Quaternion();
  function composedMatrix(position, scale, rotation = [0, 0, 0]) {
    return new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale),
    );
  }
  umbrellaData.forEach((umbrella, i) => {
    rootMatrix.compose(new THREE.Vector3(umbrella.x + 4.2, 0, umbrella.z + 1.4), rootQuaternion.setFromAxisAngle(up, -0.25 + i * 0.22), new THREE.Vector3(1, 1, 1));
    const pieces = [
      { p: [0, 0.67, 0], s: [1.55, 0.16, 2.7], r: [0.06, 0, 0] },
      { p: [0, 1.3, -1.3], s: [1.55, 0.16, 1.55], r: [-0.72, 0, 0] },
      { p: [-0.62, 0.32, -0.9], s: [0.12, 0.65, 0.12], r: [0, 0, 0] },
      { p: [0.62, 0.32, -0.9], s: [0.12, 0.65, 0.12], r: [0, 0, 0] },
      { p: [-0.62, 0.32, 0.9], s: [0.12, 0.65, 0.12], r: [0, 0, 0] },
      { p: [0.62, 0.32, 0.9], s: [0.12, 0.65, 0.12], r: [0, 0, 0] },
    ];
    pieces.forEach((piece, j) => {
      localMatrix.copy(composedMatrix(piece.p, piece.s, piece.r));
      matrix.multiplyMatrices(rootMatrix, localMatrix);
      loungers.setMatrixAt(i * 6 + j, matrix);
      loungers.setColorAt(i * 6 + j, new THREE.Color(j < 2 ? (i % 2 ? 0x43bdd0 : 0xe6698c) : 0x242333));
    });
  });
  group.add(loungers);

  // Five stylized locals with visors; instance matrices provide a subtle idle bob.
  const people = [
    { x: -4, z: 5, yaw: 0.3, shirt: 0xf05b85, skin: 0x9b624e, phase: 0.2 },
    { x: 4, z: 8, yaw: -0.5, shirt: 0x35bfd1, skin: 0xd49a76, phase: 1.8 },
    { x: 13, z: 3, yaw: 2.7, shirt: 0xf0ba62, skin: 0x6f453d, phase: 3.2 },
    { x: -11, z: 13, yaw: 1.3, shirt: 0x7455c7, skin: 0xb9785d, phase: 4.1 },
    { x: 23, z: -16, yaw: 3.1, shirt: 0xdd4e78, skin: 0xc98d6d, phase: 5.4 },
  ];
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.76 });
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 8, 6), bodyMaterial, people.length);
  const torsos = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.46, 1.15, 6), bodyMaterial, people.length);
  const limbs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.13, 1.05, 5), bodyMaterial, people.length * 4);
  const visors = new THREE.InstancedMesh(unitBox, cyanGlow, people.length);
  [heads, torsos, limbs].forEach((mesh) => mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage));
  people.forEach((person, i) => {
    heads.setColorAt(i, new THREE.Color(person.skin));
    torsos.setColorAt(i, new THREE.Color(person.shirt));
    for (let j = 0; j < 4; j += 1) limbs.setColorAt(i * 4 + j, new THREE.Color(j < 2 ? person.skin : 0x25283a));
  });
  group.add(heads, torsos, limbs, visors);

  function updatePeople(elapsed) {
    people.forEach((person, i) => {
      const bob = Math.sin(elapsed * 1.25 + person.phase) * 0.025;
      rootMatrix.compose(
        new THREE.Vector3(person.x, 0.12 + bob, person.z),
        rootQuaternion.setFromAxisAngle(up, person.yaw),
        new THREE.Vector3(1, 1, 1),
      );
      const parts = [
        { mesh: heads, index: i, p: [0, 2.35, 0], s: [1, 1, 1], r: [0, 0, 0] },
        { mesh: torsos, index: i, p: [0, 1.52, 0], s: [1, 1, 1], r: [0, 0, 0] },
        { mesh: visors, index: i, p: [0, 2.39, 0.3], s: [0.48, 0.09, 0.08], r: [0, 0, 0] },
      ];
      for (let j = 0; j < 4; j += 1) {
        const arm = j < 2;
        const side = j % 2 ? 1 : -1;
        parts.push({
          mesh: limbs, index: i * 4 + j,
          p: [side * (arm ? 0.43 : 0.2), arm ? 1.48 : 0.58, 0],
          s: [1, 1, 1], r: [arm ? 0.08 : 0, 0, side * (arm ? -0.16 : 0.035)],
        });
      }
      parts.forEach((part) => {
        localMatrix.copy(composedMatrix(part.p, part.s, part.r));
        matrix.multiplyMatrices(rootMatrix, localMatrix);
        part.mesh.setMatrixAt(part.index, matrix);
      });
    });
    heads.instanceMatrix.needsUpdate = true;
    torsos.instanceMatrix.needsUpdate = true;
    limbs.instanceMatrix.needsUpdate = true;
    visors.instanceMatrix.needsUpdate = true;
  }

  function updateFronds(elapsed) {
    frondData.forEach((frond, index) => {
      const palm = frond.palm;
      const sway = Math.sin(elapsed * 0.65 + frond.phase) * 0.055;
      setInstance(
        fronds,
        index,
        [palm.x + palm.lx, palm.h, palm.z + palm.lz],
        [frond.scale, frond.scale, frond.scale],
        [sway * 0.5, frond.angle + sway, Math.cos(elapsed * 0.5 + frond.phase) * 0.035],
      );
    });
    fronds.instanceMatrix.needsUpdate = true;
  }
  updateFronds(0);
  updatePeople(0);

  return {
    group,
    update(delta, elapsed) {
      waterUniforms.uTime.value = elapsed;
      foamMaterial.uniforms.uTime.value = elapsed;
      updateFronds(elapsed);
      updatePeople(elapsed);
      lampMaterial.opacity = 0.88 + Math.sin(elapsed * 1.7) * 0.1;
      const flicker = Math.sin(elapsed * 7.3) > -0.965 ? 1 : 0.58;
      signMaterial.opacity = (0.93 + Math.sin(elapsed * 0.8) * 0.06) * flicker;
      stars.material.opacity = 0.57 + Math.sin(elapsed * 0.23) * 0.08;
      barLight.intensity = 82 + Math.sin(elapsed * 1.1) * 5;
    },
  };
}
