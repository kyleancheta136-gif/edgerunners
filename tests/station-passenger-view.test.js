import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { STATION_CONFIG } from '../src/station-config.js';
import { createStationPassengers } from '../src/station-passenger-view.js';

test('every passenger has two rendered arms, legs, and shoes', () => {
  globalThis.window = { innerWidth: 1440 };
  const parent = new THREE.Group();
  createStationPassengers({ parent, config: STATION_CONFIG });
  const pairedParts = parent.children.slice(2, 5);
  for (const mesh of pairedParts) {
    assert.equal(mesh.count, STATION_CONFIG.passengers.desktopCount * 2);
  }
  delete globalThis.window;
});
