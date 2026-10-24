import * as THREE from 'three';
import { getDoorWorldX } from './station-routes.js';

export function buildStationArchitecture({
  config,
  materials,
  makeSignTexture,
  addBox,
  addCyl,
  addPanel,
  addGeo,
  composeAt,
}) {
  const {
    white, concrete, concreteDark, carbon, carbonSoft, chrome, glass, darkGlass,
    solar, lotAsphalt, wood, cyanGlow, amberGlow, magentaGlow, greenGlow,
    markingMaterial, stationSignMaterial, transitStopMaterial,
  } = materials;
  const { platform, stairs, groundY, platformY, parking, track } = config;
  const platformLength = platform.maxX - platform.minX;
  const rise = (platformY - groundY) / (stairs.stepsPerFlight * 2);
  const firstRun = stairs.stepsPerFlight * stairs.tread;

  addBox(concrete, platform.centerX, platformY - 0.48, platform.centerZ, platformLength, 0.96, platform.depth);
  addBox(carbon, platform.centerX, platformY - 0.88, platform.centerZ, platformLength + 0.35, 0.18, platform.depth + 0.28);
  addBox(white, platform.centerX, platformY - 0.12, platform.centerZ, platformLength + 0.12, 0.24, platform.depth + 0.08);
  addBox(concreteDark, platform.centerX, platformY + 0.012, platform.centerZ, platformLength - 0.5, 0.024, platform.depth - 0.4);
  addBox(amberGlow, platform.centerX, platformY + 0.035, platform.safetyLineZ, platformLength - 1.0, 0.035, 0.1);
  addBox(carbonSoft, platform.centerX, platformY + 0.025, platform.safetyLineZ + 0.38, platformLength - 1.0, 0.04, 0.32);
  for (let x = platform.minX + 0.7; x < platform.maxX - 0.4; x += 0.7) {
    addBox(markingMaterial, x, platformY + 0.055, platform.safetyLineZ + 0.38, 0.32, 0.035, 0.22);
  }

  for (const x of [-25, -11, 9]) {
    addBox(concreteDark, x, 0.34, -63.8, 2.5, 0.68, 2.5);
    addBox(white, x, 4.45, -63.8, 1.15, 8.25, 1.15);
    addBox(carbonSoft, x, 4.7, -63.18, 0.72, 4.8, 0.1);
    addBox(chrome, x, 4.7, -63.11, 0.46, 0.05, 0.04);
    addBox(cyanGlow, x, 7.75, -63.17, 0.78, 0.08, 0.06);
    addBox(concrete, x, 8.35, -64.65, 1.35, 0.72, 9.3);
    addBox(carbon, x, 8.77, -64.65, 1.6, 0.16, 9.5);
  }

  const railSegments = [
    [platform.minX + 0.3, stairs.x - stairs.width / 2 - 0.35],
    [stairs.x + stairs.width / 2 + 0.35, platform.maxX - 0.3],
  ];
  railSegments.forEach(([start, end]) => {
    const center = (start + end) / 2;
    addBox(glass, center, platformY + 0.78, platform.southEdgeZ + 0.05, end - start, 1.35, 0.08);
    addBox(chrome, center, platformY + 1.5, platform.southEdgeZ + 0.05, end - start, 0.08, 0.1);
    addBox(cyanGlow, center, platformY + 0.22, platform.southEdgeZ + 0.11, end - start, 0.05, 0.04);
    for (let x = start; x <= end; x += 3.2) {
      addBox(chrome, x, platformY + 0.78, platform.southEdgeZ + 0.05, 0.08, 1.5, 0.1);
    }
  });
  for (const x of [platform.minX + 0.08, platform.maxX - 0.08]) {
    addBox(glass, x, platformY + 0.78, platform.centerZ, 0.08, 1.35, platform.depth - 0.25);
    addBox(chrome, x, platformY + 1.5, platform.centerZ, 0.1, 0.08, platform.depth - 0.2);
  }

  addBox(concrete, -6, 13.0, -62.25, 45.2, 0.34, 6.35);
  addBox(carbon, -6, 13.25, -62.25, 45.6, 0.18, 6.65);
  addBox(solar, -12, 13.39, -62.25, 27, 0.08, 5.5, 0.06, 0, 0);
  addBox(cyanGlow, -6, 12.79, -65.35, 44.4, 0.07, 0.09);
  addBox(amberGlow, -6, 12.79, -59.15, 44.4, 0.055, 0.08);
  for (const x of [-24, -12, 8, 14]) {
    addBox(carbonSoft, x, 11.28, -59.62, 0.22, 3.45, 0.28);
    addBox(chrome, x, 12.6, -62.25, 0.16, 0.2, 6.1);
    addBox(carbon, x, 12.83, -62.25, 0.34, 0.22, 6.25);
  }
  for (let x = -26; x <= 14; x += 4) {
    addBox(carbonSoft, x, 12.77, -62.1, 1.65, 0.12, 0.8);
    for (let vent = -0.55; vent <= 0.55; vent += 0.22) {
      addBox(chrome, x + vent, 12.69, -62.1, 0.07, 0.05, 0.68);
    }
  }
  addCyl(chrome, -6, 12.58, -59.48, 0.055, 0.055, 41.5, 8, 0, 0, Math.PI / 2);
  addCyl(carbonSoft, -6, 12.42, -59.48, 0.075, 0.075, 41.5, 8, 0, 0, Math.PI / 2);

  for (const [x, width] of [[-20, 9], [6, 5]]) {
    addBox(glass, x, 11.15, -59.35, width, 2.7, 0.08);
    addBox(carbon, x, 9.86, -59.35, width + 0.15, 0.12, 0.16);
  }
  addBox(carbon, -17.5, 11.75, -59.18, 17, 1.75, 0.16);
  addPanel(stationSignMaterial, -17.5, 11.75, -59.08, 15.6, 1.5);
  const routeMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'LINE 09 // CITY CENTER', sub: 'SUMMIT WEST  •  SUMMIT  •  CORPORATE LOOP', accent: '#ffd276' }),
    side: THREE.DoubleSide,
  });
  addBox(carbon, 4.8, 11.72, -59.18, 6.4, 1.72, 0.16);
  addPanel(routeMaterial, 4.8, 11.72, -59.08, 5.9, 1.45);

  getDoorWorldX(config).forEach((x, index) => {
    const numberMaterial = new THREE.MeshBasicMaterial({
      map: makeSignTexture({ title: `0${index + 1}`, sub: `BOARDING ZONE // LINE 09`, accent: index === 1 ? '#ffd276' : '#6ff4ff' }),
      side: THREE.DoubleSide,
    });
    addBox(carbon, x, 12.1, -64.9, 2.7, 1.0, 0.12);
    addPanel(numberMaterial, x, 12.1, -64.82, 2.45, 0.82);
    addBox(index === 1 ? amberGlow : cyanGlow, x, platformY + 0.045, -64.55, 1.6, 0.035, 0.07);
    for (const side of [-1, 1]) {
      addBox(markingMaterial, x + side * 1.0, platformY + 0.045, -64.15, 0.08, 0.03, 0.85);
    }
  });

  function addStationBench(x) {
    addBox(wood, x, platformY + 0.58, -61.15, 3.4, 0.16, 0.76);
    for (const height of [0.82, 1.08, 1.34]) {
      addBox(wood, x, platformY + height, -60.8, 3.4, 0.14, 0.14, -0.12, 0, 0);
    }
    addBox(carbonSoft, x, platformY + 0.35, -61.15, 3.55, 0.12, 0.86);
    for (const side of [-1, 1]) {
      addBox(carbon, x + side * 1.35, platformY + 0.3, -61.15, 0.14, 0.58, 0.66);
      addBox(chrome, x + side * 1.62, platformY + 0.85, -61.15, 0.08, 0.08, 0.72);
    }
  }
  addStationBench(-18);
  addStationBench(-1);

  const stepRise = rise;
  for (let flight = 0; flight < 2; flight += 1) {
    const flightStart = stairs.startZ - flight * (firstRun + stairs.landingDepth);
    for (let step = 0; step < stairs.stepsPerFlight; step += 1) {
      const index = flight * stairs.stepsPerFlight + step;
      const top = groundY + stepRise * (index + 1);
      addBox(concrete, stairs.x, top - stepRise / 2, flightStart - (step + 0.5) * stairs.tread, stairs.width, stepRise, stairs.tread + 0.025);
      addBox(markingMaterial, stairs.x, top + 0.012, flightStart - (step + 0.08) * stairs.tread, stairs.width - 0.18, 0.024, 0.055);
    }
    const flightRise = stepRise * stairs.stepsPerFlight;
    const centerY = groundY + flightRise * (flight + 0.5) - 0.2;
    const centerZ = flightStart - firstRun / 2;
    const stringerLength = Math.hypot(firstRun, flightRise);
    const angle = Math.atan2(flightRise, firstRun);
    for (const side of [-1, 1]) {
      addBox(carbonSoft, stairs.x + side * (stairs.width / 2 - 0.18), centerY, centerZ, 0.22, 0.32, stringerLength, angle, 0, 0);
      addBox(chrome, stairs.x + side * (stairs.width / 2 + 0.04), groundY + flightRise * (flight + 0.5) + 1.0, centerZ, 0.075, 0.075, stringerLength, angle, 0, 0);
      for (const step of [0, 6, 13]) {
        const top = groundY + stepRise * (flight * stairs.stepsPerFlight + step + 1);
        const z = flightStart - (step + 0.5) * stairs.tread;
        addBox(chrome, stairs.x + side * (stairs.width / 2 + 0.04), top + 0.52, z, 0.075, 1.05, 0.075);
      }
    }
  }
  const midY = groundY + stepRise * stairs.stepsPerFlight;
  const midZ = stairs.startZ - firstRun - stairs.landingDepth / 2;
  addBox(concrete, stairs.x, midY - 0.18, midZ, stairs.width + 0.15, 0.36, stairs.landingDepth);
  addBox(carbonSoft, stairs.x, midY - 0.42, midZ, stairs.width - 0.3, 0.18, stairs.landingDepth - 0.2);
  for (const side of [-1, 1]) {
    addBox(chrome, stairs.x + side * (stairs.width / 2 + 0.04), midY + 1.0, midZ, 0.08, 0.08, stairs.landingDepth);
    addBox(chrome, stairs.x + side * (stairs.width / 2 + 0.04), midY + 0.5, midZ, 0.08, 1.0, 0.08);
  }
  addBox(concrete, stairs.x, platformY - 0.18, -59.95, stairs.width + 0.2, 0.36, 1.25);

  addBox(concrete, 10.8, 0.15, -44.9, 8.6, 0.3, 5.4);
  addBox(carbon, 10.8, 3.5, -44.9, 8.2, 0.26, 4.8);
  addBox(white, 10.8, 3.69, -44.9, 8.5, 0.14, 5.0);
  addBox(cyanGlow, 10.8, 3.34, -42.55, 7.8, 0.06, 0.08);
  for (const [x, z] of [[7.2, -46.7], [14.6, -46.7], [7.2, -43], [14.6, -43]]) {
    addBox(carbonSoft, x, 1.8, z, 0.18, 3.3, 0.18);
  }
  addPanel(stationSignMaterial, 10.8, 2.85, -42.48, 6.8, 1.0);
  for (const x of [7.9, 13.7]) {
    addBox(carbonSoft, x, 1.15, -44.8, 0.75, 1.85, 0.72);
    addBox(darkGlass, x, 1.52, -44.41, 0.58, 0.68, 0.04);
    addBox(greenGlow, x, 0.85, -44.4, 0.36, 0.07, 0.04);
  }
  for (const x of [9.3, 12.3]) {
    addBox(chrome, x, 0.82, -45.5, 0.18, 1.2, 1.1);
    addBox(glass, x + (x < 10.8 ? 0.48 : -0.48), 1.0, -45.5, 0.78, 0.72, 0.06);
    addBox(cyanGlow, x, 1.46, -45.1, 0.22, 0.06, 0.05);
  }

  addBox(lotAsphalt, 28, 0.14, -43.5, 28, 0.12, 21);
  addBox(lotAsphalt, 23, 0.15, -38, 38, 0.14, 6.4);
  addBox(concrete, 25.5, 0.19, -53.6, 33, 0.24, 2.3);
  addBox(concrete, 13.5, 0.19, -48.7, 2.2, 0.24, 11.5);
  addBox(concreteDark, 28, 0.225, -44.25, 27.2, 0.035, 0.12);
  addBox(cyanGlow, 28, 0.23, -37.75, 27.2, 0.035, 0.08);
  parking.bayXs.forEach((x, index) => {
    for (const side of [-1, 1]) {
      addBox(markingMaterial, x + side * 1.8, 0.225, parking.bayZ, 0.09, 0.035, 5.8);
    }
    addBox(markingMaterial, x, 0.225, parking.bayZ - 2.9, 3.65, 0.035, 0.09);
    addBox(index % 2 ? cyanGlow : amberGlow, x, 0.23, parking.bayZ + 2.82, 1.2, 0.035, 0.07);
  });
  for (const x of [10, 17, 24, 31, 38]) {
    addBox(markingMaterial, x, 0.235, -41, 2.6, 0.035, 0.12);
  }
  addBox(markingMaterial, 39.8, 0.235, -41, 2.8, 0.035, 0.18, 0, -0.55, 0);
  addBox(markingMaterial, 39.8, 0.235, -41, 2.8, 0.035, 0.18, 0, 0.55, 0);
  addBox(solar, 28, 3.62, -48.5, 28.4, 0.12, 7.2, 0.16, 0, 0);
  addBox(cyanGlow, 28, 3.38, -45.05, 27.8, 0.06, 0.08);
  for (const x of [15, 28, 41]) {
    for (const z of [-51.3, -45.7]) {
      addBox(chrome, x, 1.82, z, 0.13, 3.25, 0.13);
      addBox(concreteDark, x, 0.31, z, 0.55, 0.35, 0.55);
    }
    addBox(carbon, x, 3.4, -48.5, 0.18, 0.18, 6.3);
  }
  for (let x = -3.2; x <= 3.2; x += 0.9) {
    addBox(markingMaterial, x, 0.245, -43.8, 0.52, 0.035, 3.0);
  }
  addPanel(transitStopMaterial, 14.7, 2.3, -53.45, 4.2, 1.0);
  addBox(carbonSoft, 14.7, 1.25, -53.58, 0.16, 2.5, 0.16);

  const adMaterial = new THREE.MeshBasicMaterial({
    map: makeSignTexture({ title: 'YOUR NEXT CHAPTER', sub: 'MERIDIAN // EDUCATION TO EVERY DISTRICT', accent: '#ff7aac', align: 'left' }),
    side: THREE.DoubleSide,
  });
  addBox(carbon, -26.4, 11.15, -62.1, 1.9, 2.65, 0.18);
  addPanel(adMaterial, -26.4, 11.15, -61.99, 1.65, 2.3);

  addGeo(cyanGlow, composeAt(new THREE.TorusGeometry(0.45, 0.035, 6, 24), -25.2, 11.1, -59.05));
}
