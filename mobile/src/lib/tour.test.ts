import assert from "node:assert/strict";
import { test } from "node:test";
import { TOUR_STEPS, placeBubble, sameRect, stepsFor } from "./tour.ts";

const TOP = 40;
const BOTTOM = 760;

test("bubble goes under the highlight when there is room", () => {
  assert.deepEqual(placeBubble({ x: 16, y: 120, width: 300, height: 60 }, 200, TOP, BOTTOM), { top: 194, arrow: "up" });
});

test("bubble goes above when the highlight is low on screen", () => {
  assert.deepEqual(placeBubble({ x: 16, y: 600, width: 300, height: 60 }, 200, TOP, BOTTOM), { top: 386, arrow: "down" });
});

test("a tall highlight pins the bubble to the edge with more room", () => {
  assert.deepEqual(placeBubble({ x: 16, y: 100, width: 300, height: 560 }, 200, TOP, BOTTOM), { top: 560, arrow: null });
  assert.deepEqual(placeBubble({ x: 16, y: 200, width: 300, height: 540 }, 200, TOP, BOTTOM), { top: 40, arrow: null });
});

test("no highlight: centred, never under the status bar", () => {
  assert.deepEqual(placeBubble(null, 200, TOP, BOTTOM), { top: 300, arrow: null });
  assert.deepEqual(placeBubble(null, 900, TOP, BOTTOM), { top: 40, arrow: null });
});

test("every step has a short title and a one or two line body", () => {
  for (const s of TOUR_STEPS) {
    assert.ok(s.title.length <= 24, s.title);
    assert.ok(s.body.length <= 110, `${s.title}: ${s.body.length} characters`);
  }
});

test("without Android features, the tour keeps only the steps that work everywhere", () => {
  const titles = stepsFor(false).map((s) => s.title);
  assert.deepEqual(titles, ["Welcome to STOIC", "Focus with Pebble", "Weekly pledge", "You're all set"]);
  assert.equal(stepsFor(true).length, TOUR_STEPS.length);
});

test("tour ends where it starts, on Today", () => {
  assert.equal(TOUR_STEPS[0].route, "/");
  assert.equal(TOUR_STEPS.at(-1)!.route, "/");
});

test("sameRect ignores sub-pixel jitter", () => {
  assert.ok(sameRect({ x: 1, y: 2, width: 3, height: 4 }, { x: 1.4, y: 2.2, width: 3, height: 4.5 }));
  assert.ok(!sameRect({ x: 1, y: 2, width: 3, height: 4 }, { x: 1, y: 12, width: 3, height: 4 }));
  assert.ok(!sameRect(null, { x: 1, y: 2, width: 3, height: 4 }));
});
