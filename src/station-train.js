import * as THREE from 'three';
import { TrainService, TRAIN_STATES } from './train-service.js';

function createArrivalDisplay(parent) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  let previousText = '';

  function draw(text) {
    if (text === previousText) return;
    previousText = text;
    context.fillStyle = '#041018';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#60edff';
    context.fillRect(0, 0, canvas.width, 8);
    context.strokeStyle = 'rgba(96,237,255,.5)';
    context.lineWidth = 3;
    context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
    context.fillStyle = '#7d9aa6';
    context.font = '700 24px "Space Mono", monospace';
    context.textAlign = 'left';
    context.fillText('SUMMIT // LINE 09', 42, 55);
    context.textAlign = 'right';
    context.fillStyle = '#ffd276';
    context.fillText('PLATFORMS 01–03', 982, 55);
    context.textAlign = 'left';
    context.fillStyle = '#effcff';
    context.font = '700 53px "Space Mono", monospace';
    context.fillText(text, 42, 148, 940);
    context.fillStyle = '#60edff';
    context.font = '700 20px "Space Mono", monospace';
    context.fillText('EXIT FIRST  //  STAND BEHIND THE AMBER LINE', 42, 210);
    texture.needsUpdate = true;
  }

  const back = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.65, 0.18), new THREE.MeshStandardMaterial({ color: 0x111920, roughness: 0.4, metalness: 0.65 }));
  back.position.set(-6.5, 11.65, -59.25);
  parent.add(back);
  for (const [z, rotation] of [[-59.13, 0], [-59.37, Math.PI]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 1.35), material);
    panel.position.set(-6.5, 11.65, z);
    panel.rotation.y = rotation;
    parent.add(panel);
  }
  const entrancePanel = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.8), material);
  entrancePanel.position.set(10.8, 1.9, -42.46);
  parent.add(entrancePanel);
  draw('ARRIVING // LINE 09');
  return { update: draw };
}

export function createStationTrain({ parent, config, materials, onAudio }) {
  const { white, carbon, carbonSoft, chrome, darkGlass, cyanGlow, amberGlow } = materials;
  const group = new THREE.Group();
  group.name = 'Line 09 passenger train';
  parent.add(group);
  const doors = [];
  const interiorMaterial = new THREE.MeshStandardMaterial({ color: 0x26343d, roughness: 0.62, metalness: 0.28 });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x7b3157, roughness: 0.72, metalness: 0.08 });
  const doorMaterial = new THREE.MeshStandardMaterial({ color: 0xb7c2c9, roughness: 0.34, metalness: 0.68 });
  const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffb64a });

  function box(material, x, y, z, width, height, depth, parent = group) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  config.carOffsets.forEach((offset, carIndex) => {
    const car = new THREE.Group();
    car.position.x = offset;
    group.add(car);
    box(interiorMaterial, 0, 0.16, 0, 7.8, 0.24, 2.4, car);
    box(white, 0, 2.52, 0, 7.8, 0.24, 2.4, car);
    box(carbon, 0, 2.7, 0, 7.45, 0.14, 2.15, car);
    box(white, 0, 1.35, -1.12, 7.8, 2.2, 0.16, car);
    box(darkGlass, 0, 1.78, -1.215, 6.7, 0.72, 0.04, car);
    for (const side of [-1, 1]) {
      box(white, side * 2.35, 1.35, 1.12, 3.1, 2.2, 0.16, car);
      box(darkGlass, side * 2.35, 1.78, 1.215, 2.45, 0.72, 0.04, car);
      box(carbonSoft, side * 0.88, 1.28, 1.22, 0.09, 2.2, 0.1, car);
      box(amberGlow, side * 0.82, 0.28, 1.25, 0.06, 0.08, 0.08, car);
      const panel = box(doorMaterial, side * 0.4, 1.28, 1.225, 0.78, 2.04, 0.09, car);
      const window = box(darkGlass, 0, 0.43, 0.052, 0.48, 0.65, 0.025, panel);
      window.position.set(0, 0.43, 0.052);
      doors.push({ panel, closedX: side * 0.4, side });
    }
    for (const side of [-1, 1]) {
      box(white, side * 3.82, 1.32, 0, 0.16, 2.25, 2.25, car);
      box(carbonSoft, side * 3.98, 0.45, 0, 0.28, 0.28, 0.6, car);
    }
    box(seatMaterial, 0, 0.65, -0.7, 5.8, 0.42, 0.52, car);
    box(cyanGlow, 0, 0.02, 1.12, 7.5, 0.08, 0.08, car);
    box(cyanGlow, 0, 0.02, -1.12, 7.5, 0.08, 0.08, car);
    for (let light = -2.5; light <= 2.5; light += 1.25) {
      box(amberGlow, light, 2.34, 0, 0.65, 0.035, 0.12, car);
    }
    box(indicatorMaterial, 0, 2.42, 1.26, 0.55, 0.08, 0.05, car);
    if (carIndex === config.carOffsets.length - 1) {
      box(carbonSoft, 4.12, 1.12, 0, 0.65, 1.65, 2.08, car);
      box(darkGlass, 4.46, 1.52, 0, 0.05, 0.62, 1.65, car);
      for (const z of [-0.7, 0.7]) box(cyanGlow, 4.47, 0.78, z, 0.05, 0.18, 0.34, car);
    }
  });

  const turret = box(carbonSoft, 0, 2.98, 0, 1.0, 0.45, 0.85);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.0, 6), chrome);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(0.65, 3.02, 0);
  group.add(barrel);
  const beaconMaterial = new THREE.MeshBasicMaterial({ color: 0xff425b, transparent: true, opacity: 0.8 });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), beaconMaterial);
  beacon.position.set(-0.35, 3.28, 0);
  group.add(beacon);
  group.position.set(config.startX, 9.5, config.trackZ ?? -67.5);

  const service = new TrainService(config, {
    onTransition(next) {
      if (next === TRAIN_STATES.BRAKE) onAudio?.('brake');
      if (next === TRAIN_STATES.OPEN_DOORS || next === TRAIN_STATES.CLOSE_DOORS) onAudio?.('door');
    },
  });
  const display = createArrivalDisplay(parent);

  return {
    service,
    group,
    update(delta, elapsed, gates) {
      service.update(delta, gates);
      group.visible = service.visible;
      group.position.x = service.x;
      group.position.z = config.trackZ ?? -67.5;
      doors.forEach(({ panel, closedX, side }) => {
        panel.position.x = closedX + side * service.doors * 0.74;
      });
      indicatorMaterial.color.setHex(service.doors > 0.98 ? 0x8dffca : service.doors > 0.02 ? 0xffbf5e : 0xff526a);
      beaconMaterial.opacity = 0.5 + Math.sin(elapsed * 4) * 0.3;
      display.update(service.display);
    },
    getDebugState() {
      return {
        state: service.state,
        stateElapsed: service.stateElapsed,
        cycle: service.cycle,
        x: service.x,
        doors: service.doors,
        display: service.display,
      };
    },
  };
}
