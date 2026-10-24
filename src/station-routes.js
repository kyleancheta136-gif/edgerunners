import { STATION_CONFIG } from './station-config.js';

export function createStairWaypoints(config = STATION_CONFIG) {
  const { stairs, groundY, platformY } = config;
  const points = [{ x: stairs.x, y: groundY, z: stairs.startZ + 0.2, kind: 'ground' }];
  const rise = (platformY - groundY) / (stairs.stepsPerFlight * 2);
  const firstRun = stairs.stepsPerFlight * stairs.tread;

  for (let flight = 0; flight < 2; flight += 1) {
    const flightStart = stairs.startZ - flight * (firstRun + stairs.landingDepth);
    for (let step = 0; step < stairs.stepsPerFlight; step += 1) {
      const index = flight * stairs.stepsPerFlight + step;
      points.push({
        x: stairs.x,
        y: groundY + rise * (index + 1),
        z: flightStart - (step + 0.5) * stairs.tread,
        kind: 'step',
      });
    }
    if (flight === 0) {
      points.push({
        x: stairs.x,
        y: groundY + rise * stairs.stepsPerFlight,
        z: stairs.startZ - firstRun - stairs.landingDepth / 2,
        kind: 'landing',
      });
    }
  }

  points.push({
    x: stairs.x,
    y: platformY,
    z: stairs.startZ - firstRun * 2 - stairs.landingDepth - 0.45,
    kind: 'platform',
  });
  return points;
}

export function getDoorWorldX(config = STATION_CONFIG) {
  return config.train.carOffsets.map((offset) => config.train.stopX + offset);
}

export function getWaitingPoint(doorIndex, queueIndex, config = STATION_CONFIG) {
  return {
    x: getDoorWorldX(config)[doorIndex] + 0.65 + (queueIndex % 2) * 0.55,
    y: config.platformY,
    z: -63.65 + Math.floor(queueIndex / 2) * 0.82,
    kind: 'waiting',
  };
}

export function createGroundApproach(origin = 'city', lane = 0, config = STATION_CONFIG) {
  const { groundY, entrance, stairs } = config;
  const offset = lane * 0.28;
  if (origin === 'parking') {
    return [
      { x: 31 + offset, y: groundY, z: -53.6, kind: 'ground' },
      { x: 13.5, y: groundY, z: -53.6 + offset, kind: 'ground' },
      { x: 13.5, y: groundY, z: entrance.z + offset, kind: 'ground' },
      { x: entrance.x, y: groundY, z: entrance.z + offset, kind: 'ground' },
      { x: stairs.x, y: groundY, z: stairs.startZ + 0.2, kind: 'ground' },
    ];
  }
  return [
    { x: -116 - lane * 2, y: groundY, z: entrance.z + offset, kind: 'ground' },
    { x: -72, y: groundY, z: entrance.z + offset, kind: 'ground' },
    { x: -28, y: groundY, z: entrance.z + offset, kind: 'ground' },
    { x: 8.6, y: groundY, z: entrance.z + offset, kind: 'ground' },
    { x: entrance.x, y: groundY, z: entrance.z + offset, kind: 'ground' },
    { x: stairs.x, y: groundY, z: stairs.startZ + 0.2, kind: 'ground' },
  ];
}

export function createBoardingPath(waitingPoint, doorIndex, config = STATION_CONFIG) {
  const doorX = getDoorWorldX(config)[doorIndex] + 0.42;
  return [
    { ...waitingPoint },
    { x: doorX, y: config.platformY, z: config.platform.safetyLineZ + 0.25, kind: 'boarding' },
    { x: doorX, y: config.platformY + 0.06, z: config.track.z + 1.05, kind: 'boarding' },
    { x: doorX, y: config.platformY + 0.12, z: config.track.z - 0.15, kind: 'riding' },
  ];
}

export function createExitPath(doorIndex, destination = 'city', lane = 0, config = STATION_CONFIG) {
  const doorX = getDoorWorldX(config)[doorIndex] - 0.42;
  const platformRoute = [
    { x: doorX, y: config.platformY + 0.12, z: config.track.z - 0.15, kind: 'exiting' },
    { x: doorX, y: config.platformY + 0.06, z: config.track.z + 1.05, kind: 'exiting' },
    { x: doorX, y: config.platformY, z: config.platform.safetyLineZ + 0.35, kind: 'exiting' },
    { x: doorX, y: config.platformY, z: -62.25, kind: 'platform' },
    { x: 7.8, y: config.platformY, z: -61.15, kind: 'platform' },
    { x: config.stairs.x, y: config.platformY, z: -60.1, kind: 'platform' },
  ];
  const stairs = createStairWaypoints(config).slice(0, -1).reverse();
  const ground = createGroundApproach(destination, lane, config).slice(0, -1).reverse();
  return [...platformRoute, ...stairs, ...ground];
}
