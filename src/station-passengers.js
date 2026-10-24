import {
  createBoardingPath,
  createExitPath,
  createGroundApproach,
  createStairWaypoints,
  getWaitingPoint,
} from './station-routes.js';
import { TRAIN_STATES } from './train-service.js';

function moveAlongPath(passenger, delta) {
  const target = passenger.path[passenger.segment];
  if (!target) return true;
  const dx = target.x - passenger.position.x;
  const dy = target.y - passenger.position.y;
  const dz = target.z - passenger.position.z;
  const distance = Math.hypot(dx, dy, dz);
  const step = passenger.speed * delta;
  if (distance <= step || distance < 1e-6) {
    passenger.position = { ...target };
    passenger.segment += 1;
    passenger.moving = passenger.segment < passenger.path.length;
    return passenger.segment >= passenger.path.length;
  }
  passenger.position.x += (dx / distance) * step;
  passenger.position.y += (dy / distance) * step;
  passenger.position.z += (dz / distance) * step;
  passenger.heading = Math.atan2(dx, dz);
  passenger.moving = true;
  return false;
}

export class PassengerFlow {
  constructor(config, { count = config.passengers.desktopCount } = {}) {
    this.config = config;
    this.lastServiceState = TRAIN_STATES.APPROACH;
    this.passengers = Array.from({ length: count }, (_, id) => ({
      id,
      state: 'riding',
      position: { x: config.train.stopX, y: config.platformY + 0.12, z: config.track.z - 0.15 },
      speed: config.passengers.minSpeed + (id % 5) / 4 * (config.passengers.maxSpeed - config.passengers.minSpeed),
      visible: false,
      moving: false,
      heading: 0,
      doorIndex: id % config.train.carOffsets.length,
      queueIndex: Math.floor(id / config.train.carOffsets.length),
      path: null,
      segment: 0,
      waitElapsed: 0,
      boardedCycle: -1,
      hasCompletedExit: false,
      recycleCount: 0,
    }));

    const onboardReserve = Math.min(count - 2, config.passengers.arrivalsPerStop + 2);
    const departingTotal = Math.min(config.passengers.departingCount, count - onboardReserve);
    const departing = this.passengers.slice(-departingTotal);
    departing.forEach((passenger, index) => {
      passenger.doorIndex = index % config.train.carOffsets.length;
      passenger.queueIndex = Math.floor(index / config.train.carOffsets.length);
      if (index < Math.min(4, Math.max(1, departing.length - 1))) {
        passenger.state = 'waiting';
        passenger.position = getWaitingPoint(passenger.doorIndex, passenger.queueIndex, config);
        passenger.visible = true;
      } else {
        this.resetDeparting(passenger, index % 3 === 0 ? 'parking' : 'city');
      }
    });
  }

  get gates() {
    const arrivalsClear = !this.passengers.some((passenger) => (
      passenger.state === 'exiting' && passenger.position.z < -62.1
    ));
    const doorsClear = !this.passengers.some((passenger) => (
      passenger.state === 'boarding'
      || (passenger.state === 'exiting' && passenger.position.z < this.config.platform.safetyLineZ + 0.3)
    ));
    return { arrivalsClear, doorsClear };
  }

  resetDeparting(passenger, origin = 'city') {
    const lane = passenger.id % 3 - 1;
    const waitingPoint = getWaitingPoint(passenger.doorIndex, passenger.queueIndex, this.config);
    passenger.state = 'approach';
    passenger.path = [
      ...createGroundApproach(origin, lane, this.config),
      ...createStairWaypoints(this.config).slice(1),
      { x: 7.8, y: this.config.platformY, z: -60.6, kind: 'platform' },
      waitingPoint,
    ];
    passenger.position = { ...passenger.path[0] };
    passenger.segment = 1;
    passenger.visible = true;
    passenger.moving = true;
    passenger.waitElapsed = 0;
    passenger.hasCompletedExit = false;
  }

  beginArrivals(service) {
    const riders = this.passengers.filter((passenger) => passenger.state === 'riding');
    riders.slice(0, Math.min(this.config.passengers.arrivalsPerStop, riders.length)).forEach((passenger, index) => {
      passenger.state = 'exiting';
      passenger.path = createExitPath(
        passenger.doorIndex,
        (passenger.id + service.cycle) % 3 === 0 ? 'parking' : 'city',
        passenger.id % 3 - 1,
        this.config,
      );
      passenger.position = { ...passenger.path[0] };
      passenger.segment = 1;
      passenger.waitElapsed = -index * 0.35;
      passenger.visible = false;
      passenger.moving = false;
    });
  }

  update(delta, service) {
    if (service.state === TRAIN_STATES.OPEN_DOORS && this.lastServiceState !== TRAIN_STATES.OPEN_DOORS) {
      this.beginArrivals(service);
    }

    for (const passenger of this.passengers) {
      passenger.moving = false;
      if (passenger.state === 'away') {
        if (service.state === TRAIN_STATES.RETURN_LATER && service.stateElapsed > 2) this.resetDeparting(passenger);
        continue;
      }
      if (passenger.state === 'riding') continue;

      if (passenger.state === 'exiting') {
        if (service.state === TRAIN_STATES.OPEN_DOORS) continue;
        const inDoorway = passenger.position.z < this.config.platform.safetyLineZ + 0.3;
        if (inDoorway && service.doors < 0.99) continue;
        passenger.waitElapsed += delta;
        if (passenger.waitElapsed < 0) continue;
        passenger.visible = true;
        if (moveAlongPath(passenger, delta)) {
          passenger.state = 'away';
          passenger.visible = false;
          passenger.hasCompletedExit = true;
          passenger.recycleCount += 1;
        }
        continue;
      }

      if (passenger.state === 'approach' && moveAlongPath(passenger, delta)) {
        passenger.state = 'waiting';
        passenger.waitElapsed = 0;
      }

      if (passenger.state === 'waiting') {
        passenger.waitElapsed += delta;
        const target = getWaitingPoint(passenger.doorIndex, passenger.queueIndex, this.config);
        passenger.path = [passenger.position, target];
        passenger.segment = 1;
        const atQueuePoint = moveAlongPath(passenger, delta);
        const canBoard = service.doors > 0.99
          && [TRAIN_STATES.PASSENGERS_BOARD, TRAIN_STATES.CLOSE_DOORS].includes(service.state)
          && this.gates.arrivalsClear;
        if (atQueuePoint && canBoard && passenger.waitElapsed >= passenger.queueIndex * 0.3) {
          passenger.state = 'boarding';
          passenger.path = createBoardingPath(passenger.position, passenger.doorIndex, this.config);
          passenger.segment = 1;
        }
        continue;
      }

      if (passenger.state === 'boarding') {
        if (service.doors < 0.99) continue;
        if (moveAlongPath(passenger, delta)) {
          passenger.state = 'riding';
          passenger.visible = false;
          passenger.boardedCycle = service.cycle;
        }
      }
    }
    this.lastServiceState = service.state;
  }

  getDebugState() {
    return this.passengers.map(({ id, state, position, visible, boardedCycle, recycleCount }) => ({
      id, state, position: { ...position }, visible, boardedCycle, recycleCount,
    }));
  }
}
