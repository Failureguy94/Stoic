import assert from "node:assert/strict";
import { test } from "node:test";
import { bedtimePart, choicesPart, computeScore, focusPart, hm, screenPart, wordFor, type ScoreInputs } from "./score.ts";

const MIN = 60_000;
const H = 60 * MIN;

const base: ScoreInputs = {
  screenMs: 2 * H,
  screenGoalMs: 3 * H,
  focusMs: 50 * MIN,
  focusGoalMs: 50 * MIN,
  wentBack: 0,
  overrode: 0,
  bedtimeMin: 0,
};

test("a day within every goal scores 100", () => {
  assert.equal(computeScore(base).total, 100);
});

test("screen time: full up to the goal, zero at twice the goal", () => {
  assert.equal(screenPart(3 * H, 3 * H).earned, 40);
  assert.equal(screenPart(4.5 * H, 3 * H).earned, 20);
  assert.equal(screenPart(6 * H, 3 * H).earned, 0);
  assert.equal(screenPart(9 * H, 3 * H).earned, 0);
});

test("focus scales with the goal and caps at full marks", () => {
  assert.equal(focusPart(0, 50 * MIN).earned, 0);
  assert.equal(focusPart(25 * MIN, 50 * MIN).earned, 13); // 12.5 rounds up
  assert.equal(focusPart(90 * MIN, 50 * MIN).earned, 25);
});

test("choices: no prompts is full marks, otherwise the share of Go back", () => {
  assert.equal(choicesPart(0, 0).earned, 20);
  assert.equal(choicesPart(3, 1).earned, 15);
  assert.equal(choicesPart(0, 4).earned, 0);
});

test("bedtime: zero minutes is full, 30 or more is zero", () => {
  assert.equal(bedtimePart(0).earned, 15);
  assert.equal(bedtimePart(15).earned, 8); // 7.5 rounds up
  assert.equal(bedtimePart(45).earned, 0);
});

test("without bedtime the other parts are rescaled to 100", () => {
  const s = computeScore({ ...base, bedtimeMin: null });
  assert.equal(s.parts.length, 3);
  assert.equal(s.total, 100);
  // Half the focus (13 of 25) with everything else full: (40 + 13 + 20) / 85.
  assert.equal(computeScore({ ...base, bedtimeMin: null, focusMs: 25 * MIN }).total, Math.round((100 * 73) / 85));
});

test("a rough day still gets a kind word", () => {
  const s = computeScore({ ...base, screenMs: 7 * H, focusMs: 0, overrode: 5, bedtimeMin: 60 });
  assert.equal(s.total, 0);
  assert.match(s.word, /fresh start/);
});

test("every part explains itself in a sentence", () => {
  for (const p of computeScore({ ...base, overrode: 2, wentBack: 1, bedtimeMin: 12 }).parts) {
    assert.ok(p.why.length > 10, `${p.id} has an explanation`);
    assert.ok(p.earned >= 0 && p.earned <= p.max, `${p.id} stays in range`);
  }
});

test("words for score bands", () => {
  assert.equal(wordFor(85), "Great day");
  assert.equal(wordFor(60), "Good day");
  assert.equal(wordFor(45), "Mixed day");
});

test("hours and minutes read naturally", () => {
  assert.equal(hm(45 * MIN), "45 min");
  assert.equal(hm(2 * H), "2 h");
  assert.equal(hm(2 * H + 5 * MIN), "2 h 5 min");
});
