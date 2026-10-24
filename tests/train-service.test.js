import test from 'node:test';
import assert from 'node:assert/strict';
import { TrainService, TRAIN_STATES } from '../src/train-service.js';

const timing = {
  APPROACH: 10,
  BRAKE: 6,
  STOP: 1,
  OPEN_DOORS: 2,
  PASSENGERS_EXIT: 6,
  PASSENGERS_BOARD: 7,
  CLOSE_DOORS: 2,
  DEPART: 9,
  RETURN_LATER: 17,
};

function createService(hooks) {
  return new TrainService({
    timing,
    startX: -145,
    brakeX: -32,
    stopX: -6,
    exitX: 145,
  }, hooks);
}

function advance(service, seconds, gates) {
  for (let elapsed = 0; elapsed < seconds - 1e-8; elapsed += 0.1) {
    service.update(Math.min(0.1, seconds - elapsed), gates);
  }
}

test('doors stay closed until the train has completely stopped', () => {
  const service = createService();
  assert.equal(service.state, TRAIN_STATES.APPROACH);
  advance(service, 15.9);
  assert.equal(service.state, TRAIN_STATES.BRAKE);
  assert.equal(service.doors, 0);
  advance(service, 0.2);
  assert.equal(service.state, TRAIN_STATES.STOP);
  assert.equal(service.x, -6);
  assert.equal(service.doors, 0);
  advance(service, 1.1);
  assert.equal(service.state, TRAIN_STATES.OPEN_DOORS);
  assert.ok(service.doors > 0);
});

test('arrivals clear before boarding and boarding clears before door closure', () => {
  const service = createService();
  advance(service, 24.9);
  assert.equal(service.state, TRAIN_STATES.PASSENGERS_EXIT);
  advance(service, 6.2, { arrivalsClear: false });
  assert.equal(service.state, TRAIN_STATES.PASSENGERS_EXIT);
  assert.equal(service.doors, 1);
  advance(service, 0.1, { arrivalsClear: true });
  assert.equal(service.state, TRAIN_STATES.PASSENGERS_BOARD);
  advance(service, 7.1, { doorsClear: false });
  assert.equal(service.state, TRAIN_STATES.CLOSE_DOORS);
  assert.equal(service.doors, 1);
  advance(service, 0.2, { doorsClear: true });
  assert.ok(service.doors < 1);
});

test('service repeats off-camera with the same stop position', () => {
  const transitions = [];
  const resetPositions = [];
  const service = createService({
    onTransition: (next) => transitions.push(next),
    onCycle: () => resetPositions.push(service.x),
  });
  advance(service, 60.2);
  assert.equal(service.cycle, 1);
  assert.equal(service.state, TRAIN_STATES.APPROACH);
  assert.deepEqual(resetPositions, [-145]);
  assert.deepEqual(transitions, [
    'BRAKE', 'STOP', 'OPEN_DOORS', 'PASSENGERS_EXIT', 'PASSENGERS_BOARD',
    'CLOSE_DOORS', 'DEPART', 'RETURN_LATER', 'APPROACH',
  ]);
  advance(service, 16.1);
  assert.equal(service.state, TRAIN_STATES.STOP);
  assert.equal(service.x, -6);
});
