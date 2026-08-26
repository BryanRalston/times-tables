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
  assert.equal(settings.topic, "times");
  assert.equal(settings.difficulty, "3-digit");
  assert.equal(settings.timerSeconds, 0);
});

function cyclingRng() {
  return rngFrom([0.01, 0.18, 0.33, 0.47, 0.61, 0.74, 0.88, 0.96, 0.09, 0.22, 0.41, 0.55, 0.69, 0.83, 0.12]);
}

test("add questions are multi-digit, not facts within 20", () => {
  const round = engine.buildRound(
    { topic: "add", difficulty: "2-digit", timerSeconds: 0, questionCount: 24 },
    cyclingRng(),
  );
  assert.equal(round.questions.length, 24);
  for (const question of round.questions) {
    assert.equal(question.operation, "add");
    assert.ok(question.left >= 10 && question.left <= 99);
    assert.ok(question.right >= 10 && question.right <= 99);
    assert.equal(question.answer, question.left + question.right);
    assert.ok(question.answer >= 20);
  }
});

test("3-digit add uses a number in the hundreds", () => {
  const round = engine.buildRound(
    { topic: "add", difficulty: "3-digit", timerSeconds: 0, questionCount: 20 },
    cyclingRng(),
  );
  for (const question of round.questions) {
    assert.equal(question.operation, "add");
    assert.ok(Math.max(question.left, question.right) >= 100);
    assert.ok(Math.max(question.left, question.right) <= 999);
    assert.equal(question.answer, question.left + question.right);
  }
});

test("thousands add includes a number in the thousands", () => {
  const round = engine.buildRound(
    { topic: "add", difficulty: "thousands", timerSeconds: 0, questionCount: 16 },
    cyclingRng(),
  );
  for (const question of round.questions) {
    assert.equal(question.operation, "add");
    assert.ok(Math.max(question.left, question.right) >= 1000);
    assert.ok(question.answer === question.left + question.right);
  }
});

test("subtract answers stay non-negative", () => {
  for (const difficulty of engine.DIFFICULTIES) {
    const round = engine.buildRound(
      { topic: "subtract", difficulty, timerSeconds: 0, questionCount: 20 },
      cyclingRng(),
    );
    for (const question of round.questions) {
      assert.equal(question.operation, "subtract");
      assert.ok(question.left >= question.right);
      assert.ok(question.answer >= 0);
      assert.equal(question.answer, question.left - question.right);
    }
  }
});

test("mix includes add, subtract, multiply, and divide", () => {
  const seen = new Set();
  let tick = 0;
  const round = engine.buildRound(
    {
      topic: "mix",
      tables: [3, 7],
      difficulty: "2-digit",
      timerSeconds: 0,
      questionCount: 48,
    },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  for (const question of round.questions) {
    seen.add(question.operation);
    if (question.operation === "multiply") {
      assert.ok([3, 7].includes(question.left));
    }
    if (question.operation === "divide") {
      assert.ok([3, 7].includes(question.right));
    }
    if (question.operation === "subtract") {
      assert.ok(question.answer >= 0);
    }
  }
  assert.deepEqual([...seen].sort(), ["add", "divide", "multiply", "subtract"]);
});

test("times tables still ignore add/sub topics when topic is times", () => {
  const round = engine.buildRound(
    { tables: [4], operation: "divide", topic: "times", timerSeconds: 0, questionCount: 8 },
    rngFrom([0.2, 0.8, 0.1, 0.6]),
  );
  for (const question of round.questions) {
    assert.equal(question.operation, "divide");
    assert.equal(question.right, 4);
  }
});

test("replay round repeats the missed questions", () => {
  const missed = [
    engine.makeAddQuestion(347, 86),
    engine.makeSubtractQuestion(1205, 478),
  ];
  const round = engine.buildReplayRound(
    missed,
    { topic: "add", difficulty: "3-digit", timerSeconds: 0, questionCount: 6 },
    rngFrom([0.2, 0.9, 0.1]),
  );
  assert.equal(round.questions.length, 6);
  for (const question of round.questions) {
    assert.ok(["347 + 86", "1205 − 478"].includes(question.prompt));
  }
});

test("subtitle follows the chosen topic", () => {
  assert.equal(engine.subtitleFor({ topic: "add" }), "Addition practice");
  assert.equal(engine.subtitleFor({ topic: "subtract" }), "Subtraction practice");
  assert.equal(engine.subtitleFor({ topic: "mix" }), "A mix of + − × ÷");
  assert.equal(engine.subtitleFor({ topic: "times", operation: "multiply" }), "Multiplication practice");
  assert.equal(engine.subtitleFor({ topic: "times", operation: "divide" }), "Division practice");
});
