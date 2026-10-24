import test from 'node:test';
import assert from 'node:assert/strict';
import { progressAt, storyState } from '../src/lib/storyTimeline.js';

test('lighting follows hero, students, mission, challenges, and support', () => {
  for (const [progress, light] of [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1]]) {
    assert.ok(Math.abs(storyState(progress).light - light) < 1e-10);
  }
  assert.equal(storyState(1).halo, 0);
  assert.equal(storyState(3).halo, 0);
  assert.ok(storyState(4).halo > 0.99);
});

test('scrolling backward restores identical states without accumulated history', () => {
  const positions = Array.from({ length: 401 }, (_, i) => i / 100);
  const forward = positions.map(storyState);
  const backward = [...positions].reverse().map(storyState).reverse();
  assert.deepEqual(forward, backward);
  for (const state of forward) {
    for (const key of ['zoom', 'light', 'halo']) assert.ok(state[key] >= 0 && state[key] <= 1);
  }
  for (let i = 1; i < forward.length; i++) assert.ok(Math.abs(forward[i].light - forward[i - 1].light) < 0.05);
});

test('measured chapter positions tolerate resizing, overflow, and overscroll', () => {
  assert.equal(progressAt(150, [0, 100, 200, 400, 600]), 1.5);
  assert.equal(progressAt(300, [0, 200, 400, 800, 1200]), 1.5);
  assert.equal(progressAt(-100, [0, 100, 200]), 0);
  assert.equal(progressAt(900, [0, 100, 200]), 2);
});
