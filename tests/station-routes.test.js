import test from 'node:test';
import assert from 'node:assert/strict';
import { STATION_CONFIG } from '../src/station-config.js';
import { createStairWaypoints, getDoorWorldX } from '../src/station-routes.js';

test('stair waypoints match every tread and finish at platform height', () => {
  const points = createStairWaypoints();
  const { stairs, groundY, platformY } = STATION_CONFIG;
  assert.equal(points[0].y, groundY);
  assert.equal(points.at(-1).y, platformY);
  assert.equal(points.filter((point) => point.kind === 'step').length, stairs.stepsPerFlight * 2);
  const rise = (platformY - groundY) / (stairs.stepsPerFlight * 2);
  points.filter((point) => point.kind === 'step').forEach((point, index) => {
    assert.ok(Math.abs(point.y - (groundY + rise * (index + 1))) < 1e-8);
    assert.equal(point.x, stairs.x);
  });
  assert.ok(points.at(-1).z < STATION_CONFIG.platform.southEdgeZ);
});

test('platform and doors preserve train-side clearance and consistent stop alignment', () => {
  const { platform, track, train } = STATION_CONFIG;
  const trainSouthEdge = track.z + train.bodyWidth / 2;
  assert.ok(platform.northEdgeZ - trainSouthEdge >= track.platformGap);
  getDoorWorldX().forEach((x, index) => {
    assert.ok(Math.abs(x - [-14.4, -6, 2.4][index]) < 1e-8);
  });
  assert.ok(platform.minX < getDoorWorldX()[0]);
  assert.ok(platform.maxX > getDoorWorldX().at(-1));
});
