import test from 'node:test';
import assert from 'node:assert/strict';
import { STATION_CONFIG } from '../src/station-config.js';
import { TrainService, TRAIN_STATES } from '../src/train-service.js';
import { PassengerFlow } from '../src/station-passengers.js';

function createSimulation() {
  const flow = new PassengerFlow(STATION_CONFIG);
  const service = new TrainService(STATION_CONFIG.train);
  return { flow, service };
}

function advance({ flow, service }, seconds, inspect = () => {}) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    service.update(0.05, flow.gates);
    flow.update(0.05, service);
    inspect(flow, service);
  }
}

test('departing passengers climb, queue, and board only after arrivals clear', () => {
  const simulation = createSimulation();
  let climbedStairs = false;
  let boardedBeforeExit = false;
  advance(simulation, 42, (flow, service) => {
    climbedStairs ||= flow.passengers.some((passenger) => passenger.state === 'approach' && passenger.position.y > STATION_CONFIG.groundY + 2);
    boardedBeforeExit ||= service.state === TRAIN_STATES.PASSENGERS_EXIT && flow.passengers.some((passenger) => passenger.state === 'boarding');
  });
  assert.equal(climbedStairs, true);
  assert.equal(boardedBeforeExit, false);
  assert.ok(simulation.flow.passengers.some((passenger) => passenger.state === 'riding' && passenger.boardedCycle === 0));
  assert.ok(simulation.flow.passengers.some((passenger) => passenger.state === 'waiting' || passenger.state === 'approach'));
});

test('arrivals descend to destinations and recycle while other riders remain onboard', () => {
  const simulation = createSimulation();
  let exitedAtGround = false;
  let recycled = false;
  let retainedDuringExit = false;
  advance(simulation, 125, (flow, service) => {
    exitedAtGround ||= flow.passengers.some((passenger) => passenger.hasCompletedExit && passenger.position.y === STATION_CONFIG.groundY);
    recycled ||= flow.passengers.some((passenger) => passenger.recycleCount > 0);
    retainedDuringExit ||= service.state === TRAIN_STATES.PASSENGERS_EXIT && flow.passengers.some((passenger) => passenger.state === 'riding');
  });
  assert.equal(exitedAtGround, true);
  assert.equal(recycled, true);
  assert.ok(simulation.service.cycle >= 1);
  assert.equal(retainedDuringExit, true);
  assert.ok(simulation.flow.passengers.every((passenger) => passenger.state !== 'away' || passenger.visible === false));
});

test('mobile passenger density still reserves arriving and retained riders', () => {
  const flow = new PassengerFlow(STATION_CONFIG, { count: STATION_CONFIG.passengers.mobileCount });
  assert.equal(flow.passengers.length, 10);
  assert.ok(flow.passengers.filter((passenger) => passenger.state === 'riding').length >= 6);
  assert.ok(flow.passengers.some((passenger) => passenger.state === 'approach'));
  assert.ok(flow.passengers.some((passenger) => passenger.state === 'waiting'));
});

test('an unfinished boarding passenger holds the doors fully open', () => {
  const simulation = createSimulation();
  let blockedPassenger;
  advance(simulation, 41, (flow, service) => {
    if (service.state === TRAIN_STATES.PASSENGERS_BOARD && !blockedPassenger) {
      blockedPassenger = flow.passengers.find((passenger) => passenger.state === 'boarding');
      if (blockedPassenger) blockedPassenger.speed = 0;
    }
  });
  assert.ok(blockedPassenger);
  assert.equal(simulation.service.state, TRAIN_STATES.CLOSE_DOORS);
  assert.equal(simulation.flow.gates.doorsClear, false);
  assert.equal(simulation.service.doors, 1);
  assert.equal(blockedPassenger.position.z > STATION_CONFIG.track.z - 0.2, true);
});
