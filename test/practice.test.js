const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/practice.js");

function rngFrom(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

test("multiply question uses the selected table", () => {
  const question = engine.makeQuestion(7, 8, "multiply");
  assert.equal(question.prompt, "7 × 8");
  assert.equal(question.answer, 56);
  assert.equal(question.operation, "multiply");
});

test("divide question stays inside the selected table", () => {
  const question = engine.makeQuestion(7, 8, "divide");
  assert.equal(question.prompt, "56 ÷ 7");
  assert.equal(question.answer, 8);
  assert.equal(question.fact, "7 × 8");
});

test("mix picks from the supplied rng", () => {
  const multiply = engine.makeQuestion(4, 5, "mix", () => 0.1);
  const divide = engine.makeQuestion(4, 5, "mix", () => 0.9);
  assert.equal(multiply.operation, "multiply");
  assert.equal(divide.operation, "divide");
});

test("round only uses selected tables", () => {
  const round = engine.buildRound(
    { tables: [3, 9], operation: "multiply", timerSeconds: 0, questionCount: 12 },
    rngFrom([0.2, 0.8, 0.1, 0.6]),
  );
  assert.equal(round.questions.length, 12);
  for (const question of round.questions) {
    assert.ok([3, 9].includes(question.left));
  }
});

test("gradeAnswer treats only exact integers as correct", () => {
  const question = engine.makeQuestion(6, 7, "multiply");
  assert.deepEqual(engine.gradeAnswer(question, "42"), { ok: true, empty: false, given: 42 });
  assert.deepEqual(engine.gradeAnswer(question, "41"), { ok: false, empty: false, given: 41 });
  assert.equal(engine.gradeAnswer(question, "").empty, true);
  assert.equal(engine.gradeAnswer(question, "abc").empty, true);
});

test("summarize counts score and missed facts", () => {
  const first = engine.makeQuestion(2, 4, "multiply");
  const second = engine.makeQuestion(5, 5, "multiply");
  const summary = engine.summarize([
    { question: first, ok: true, given: 8 },
    { question: second, ok: false, given: 20 },
  ]);
  assert.equal(summary.correct, 1);
  assert.equal(summary.asked, 2);
  assert.equal(summary.accuracy, 50);
  assert.equal(summary.missed[0].prompt, "5 × 5");
});

test("normalizeSettings falls back to a playable default", () => {
  const settings = engine.normalizeSettings({ tables: ["nope"], operation: "add", timerSeconds: 12 });
  assert.ok(settings.tables.length > 0);
  assert.equal(settings.operation, "multiply");
  assert.equal(settings.timerSeconds, 0);
});
