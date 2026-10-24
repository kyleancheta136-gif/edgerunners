const groundY = 0.24;
const platformY = 9.4;
const railZ = -67.5;
const stopX = -6;

export const STATION_CONFIG = {
  groundY,
  platformY,
  track: {
    z: railZ,
    platformGap: 0.55,
    length: 336,
  },
  platform: {
    minX: -28,
    maxX: 16,
    centerX: -6,
    centerZ: -62.4,
    depth: 6.6,
    northEdgeZ: -65.7,
    southEdgeZ: -59.1,
    safetyLineZ: -64.95,
  },
  stairs: {
    x: 10.8,
    width: 3.6,
    startZ: -46,
    stepsPerFlight: 14,
    tread: 0.42,
    landingDepth: 1.8,
  },
  entrance: { x: 10.8, z: -43.8 },
  parking: {
    minX: 14,
    maxX: 42,
    minZ: -54,
    maxZ: -33,
    aisleZ: -41,
    bayZ: -48.5,
    bayXs: [17, 21.5, 26, 30.5, 35, 39.5],
  },
  train: {
    startX: -145,
    brakeX: -32,
    stopX,
    exitX: 145,
    bodyWidth: 2.4,
    carOffsets: [-8.4, 0, 8.4],
    doorWidth: 1.6,
    doorSideZ: railZ + 1.23,
    timing: {
      APPROACH: 10,
      BRAKE: 6,
      STOP: 1,
      OPEN_DOORS: 2,
      PASSENGERS_EXIT: 6,
      PASSENGERS_BOARD: 7,
      CLOSE_DOORS: 2,
      DEPART: 9,
      RETURN_LATER: 17,
    },
  },
  passengers: {
    desktopCount: 18,
    mobileCount: 10,
    departingCount: 10,
    arrivalsPerStop: 4,
    minSpeed: 1.25,
    maxSpeed: 1.8,
  },
  benchCamera: {
    position: [4.5, 11.55, -59.75],
    target: [-12, 9.6, -70],
    mobile: {
      position: [4.5, 11.6, -59.75],
      target: [-6, 9.6, -64],
    },
    commuterPosition: [-0.45, platformY, -61.15],
    yawLimit: 0.12,
    pitchLimit: 0.055,
  },
};
