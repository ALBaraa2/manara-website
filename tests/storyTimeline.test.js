import test from 'node:test';
import assert from 'node:assert/strict';
import { OUTRO_AT, outroAt, progressAt, storyState } from '../src/lib/storyTimeline.js';

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

test('outro pulls the camera back while the lamp stays lit, and is fully reversible', () => {
  assert.equal(storyState(OUTRO_AT).pull, 0);
  assert.equal(storyState(OUTRO_AT + 1).pull, 1);
  for (let p = 0; p <= OUTRO_AT; p += 0.05) assert.equal(storyState(p).pull, 0);
  const positions = Array.from({ length: 101 }, (_, i) => OUTRO_AT + i / 100);
  const states = positions.map(storyState);
  for (const state of states) {
    assert.equal(state.light, 1);
    assert.ok(state.halo > 0.99 && state.zoom === 1 && state.pull >= 0 && state.pull <= 1);
  }
  for (let i = 1; i < states.length; i++) {
    assert.ok(states[i].pull >= states[i - 1].pull, 'pull never decreases while scrolling down');
    assert.ok(states[i].pull - states[i - 1].pull < 0.05, 'no jumps between neighbouring scroll positions');
  }
  assert.deepEqual([...positions].reverse().map(storyState).reverse(), states);
});

test('outro progress is clamped and tolerates degenerate layouts', () => {
  assert.equal(outroAt(500, 1000, 2000), 0);
  assert.equal(outroAt(1500, 1000, 2000), 0.5);
  assert.equal(outroAt(5000, 1000, 2000), 1);
  assert.ok(Number.isFinite(outroAt(10, 100, 100)));
});
