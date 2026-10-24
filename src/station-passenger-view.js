import * as THREE from 'three';
import { PassengerFlow } from './station-passengers.js';

export function createStationPassengers({ parent, config, onAudio }) {
  const count = window.innerWidth <= 760 ? config.passengers.mobileCount : config.passengers.desktopCount;
  const flow = new PassengerFlow(config, { count });
  const rootMatrix = new THREE.Matrix4();
  const partMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();
  const rootQuaternion = new THREE.Quaternion();
  const partQuaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const rootScale = new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler();
  let lastFootstep = -1;

  function instances(geometry, roughness = 0.8, capacity = count) {
    const mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness, metalness: 0.05 }),
      capacity,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  }

  const heads = instances(new THREE.SphereGeometry(0.19, 10, 8), 0.72);
  const torsos = instances(new THREE.CapsuleGeometry(0.23, 0.52, 3, 8));
  const arms = instances(new THREE.CapsuleGeometry(0.075, 0.47, 2, 6), 0.8, count * 2);
  const legs = instances(new THREE.BoxGeometry(0.16, 0.72, 0.18), 0.8, count * 2);
  const shoes = instances(new THREE.BoxGeometry(0.19, 0.12, 0.32), 0.8, count * 2);
  const backpacks = instances(new THREE.BoxGeometry(0.4, 0.52, 0.2));
  const meshes = [heads, torsos, arms, legs, shoes, backpacks];
  const skin = [0xf0bd98, 0x9b664d, 0xd89a74, 0x704b3f];
  const shirts = [0x6d9cb0, 0xd7b45e, 0x8b6f9f, 0x607d68, 0xc87968, 0xd8d4c8];
  const trousers = [0x1d2833, 0x27242e, 0x30333a];

  flow.passengers.forEach((passenger, index) => {
    const shirt = new THREE.Color(shirts[index % shirts.length]);
    const pants = new THREE.Color(trousers[index % trousers.length]);
    heads.setColorAt(index, new THREE.Color(skin[index % skin.length]));
    torsos.setColorAt(index, shirt);
    backpacks.setColorAt(index, new THREE.Color(index % 2 ? 0x343c43 : 0x7c4c45));
    for (const side of [0, 1]) {
      arms.setColorAt(index * 2 + side, shirt);
      legs.setColorAt(index * 2 + side, pants);
      shoes.setColorAt(index * 2 + side, new THREE.Color(0xd8dde0));
    }
  });

  function setPart(mesh, index, localPosition, localRotation = [0, 0, 0]) {
    position.set(...localPosition);
    euler.set(...localRotation);
    partQuaternion.setFromEuler(euler);
    partMatrix.compose(position, partQuaternion, scale);
    worldMatrix.multiplyMatrices(rootMatrix, partMatrix);
    mesh.setMatrixAt(index, worldMatrix);
  }

  function update(delta, elapsed, service) {
    flow.update(delta, service);
    flow.passengers.forEach((passenger, index) => {
      const size = passenger.visible ? 1 : 0;
      position.set(passenger.position.x, passenger.position.y, passenger.position.z);
      rootQuaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, passenger.heading);
      rootScale.setScalar(size);
      rootMatrix.compose(position, rootQuaternion, rootScale);
      const swing = passenger.moving ? Math.sin(elapsed * 8 + index * 0.7) * 0.55 : 0;
      const bob = passenger.moving ? Math.abs(Math.sin(elapsed * 8 + index)) * 0.035 : Math.sin(elapsed * 1.4 + index) * 0.008;
      setPart(heads, index, [0, 1.72 + bob, 0.025], [0, Math.sin(elapsed * 0.5 + index) * 0.08, 0]);
      setPart(torsos, index, [0, 1.13 + bob, 0]);
      for (const side of [-1, 1]) {
        const partIndex = index * 2 + (side === 1 ? 1 : 0);
        setPart(arms, partIndex, [side * 0.3, 1.13 + bob, 0], [swing * side, 0, side * -0.08]);
        setPart(legs, partIndex, [side * 0.12, 0.47, 0], [-swing * side, 0, 0]);
        setPart(shoes, partIndex, [side * 0.12, 0.08, 0.07 + swing * side * 0.13]);
      }
      setPart(backpacks, index, [0, 1.18 + bob, -0.25]);

      const step = Math.floor(elapsed * 3.2 + index * 0.37);
      if (passenger.moving && passenger.visible && step !== passenger.renderStep) {
        passenger.renderStep = step;
        if (elapsed - lastFootstep > 0.22) {
          onAudio?.('footstep');
          lastFootstep = elapsed;
        }
      }
    });
    meshes.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
  }

  update(0, 0, { state: 'APPROACH', doors: 0, cycle: 0 });
  return {
    flow,
    update,
    get gates() { return flow.gates; },
    getDebugState: () => flow.getDebugState(),
  };
}
