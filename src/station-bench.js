import * as THREE from 'three';

export function createBenchCommuter({ parent, config, reducedMotion = false }) {
  const group = new THREE.Group();
  group.name = 'Platform Bench commuter';
  group.position.set(...config.benchCamera.commuterPosition);
  parent.add(group);

  const hoodie = new THREE.MeshStandardMaterial({ color: 0xd8dde0, roughness: 0.94 });
  const hoodieShade = new THREE.MeshStandardMaterial({ color: 0xaeb9c0, roughness: 0.92 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0x202a35, roughness: 0.88 });
  const sneakers = new THREE.MeshStandardMaterial({ color: 0xe4e4de, roughness: 0.78 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xb98265, roughness: 0.82 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x242329, roughness: 0.96 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x18232c, roughness: 0.5, metalness: 0.35 });
  const accent = new THREE.MeshBasicMaterial({ color: 0x70e8f2 });
  const backpackMaterial = new THREE.MeshStandardMaterial({ color: 0x5f526c, roughness: 0.86 });

  function mesh(geometry, material, x, y, z, parent = group) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }

  const torso = mesh(new THREE.CapsuleGeometry(0.29, 0.56, 5, 12), hoodie, 0, 1.0, 0.02);
  torso.rotation.x = -0.08;
  const hood = mesh(new THREE.TorusGeometry(0.25, 0.085, 7, 18, Math.PI * 1.45), hoodieShade, 0, 1.32, 0.13);
  hood.rotation.z = -Math.PI * 0.22;
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.55, -0.04);
  group.add(headPivot);
  mesh(new THREE.SphereGeometry(0.215, 18, 14), skin, 0, 0, 0, headPivot);
  const hairCap = mesh(new THREE.SphereGeometry(0.22, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.53), hair, 0, 0.03, 0, headPivot);
  hairCap.rotation.x = -0.08;
  const headphoneBand = mesh(new THREE.TorusGeometry(0.235, 0.032, 7, 24, Math.PI), carbon, 0, 0.01, 0, headPivot);
  headphoneBand.rotation.z = 0;
  for (const side of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.065, 12), carbon, side * 0.225, -0.015, 0, headPivot).rotation.z = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.069, 12), accent, side * 0.23, -0.015, 0, headPivot).rotation.z = Math.PI / 2;
  }

  for (const side of [-1, 1]) {
    const upperArm = mesh(new THREE.CapsuleGeometry(0.09, 0.4, 4, 8), hoodie, side * 0.34, 1.02, -0.08);
    upperArm.rotation.x = -0.45;
    upperArm.rotation.z = side * 0.12;
    const forearm = mesh(new THREE.CapsuleGeometry(0.078, 0.34, 4, 8), hoodie, side * 0.34, 0.77, -0.29);
    forearm.rotation.x = Math.PI / 2.7;
    mesh(new THREE.SphereGeometry(0.085, 10, 8), skin, side * 0.34, 0.65, -0.47);

    const thigh = mesh(new THREE.CapsuleGeometry(0.13, 0.48, 4, 8), trousers, side * 0.16, 0.57, -0.3);
    thigh.rotation.x = Math.PI / 2;
    const calf = mesh(new THREE.CapsuleGeometry(0.105, 0.47, 4, 8), trousers, side * 0.16, 0.3, -0.59);
    calf.rotation.x = -0.08;
    const shoe = mesh(new THREE.BoxGeometry(0.25, 0.16, 0.43), sneakers, side * 0.16, 0.09, -0.7);
    shoe.rotation.y = side * -0.06;
    mesh(new THREE.BoxGeometry(0.26, 0.035, 0.44), carbon, side * 0.16, 0.025, -0.7);
  }

  const backpack = new THREE.Group();
  backpack.position.set(0.86, 0.39, -0.04);
  backpack.rotation.set(-0.08, -0.15, -0.08);
  group.add(backpack);
  mesh(new THREE.BoxGeometry(0.54, 0.7, 0.35), backpackMaterial, 0, 0, 0, backpack);
  mesh(new THREE.BoxGeometry(0.46, 0.28, 0.08), carbon, 0, -0.12, -0.21, backpack);
  mesh(new THREE.BoxGeometry(0.32, 0.035, 0.025), accent, 0, 0.13, -0.255, backpack);
  for (const side of [-1, 1]) {
    const strap = mesh(new THREE.TorusGeometry(0.18, 0.025, 6, 16, Math.PI), carbon, side * 0.15, 0.28, 0.04, backpack);
    strap.rotation.y = Math.PI / 2;
  }

  return {
    group,
    update(elapsed) {
      const motion = reducedMotion ? 0 : 1;
      torso.scale.y = 1 + Math.sin(elapsed * 1.25) * 0.009 * motion;
      torso.position.y = 1 + Math.sin(elapsed * 1.25) * 0.006 * motion;
      headPivot.rotation.y = Math.sin(elapsed * 0.27) * 0.1 * motion;
      headPivot.rotation.x = -0.04 + Math.sin(elapsed * 0.43) * 0.025 * motion;
    },
  };
}
