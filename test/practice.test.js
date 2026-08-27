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

test("2-digit subtract uses two 2-digit numbers", () => {
  const round = engine.buildRound(
    { topic: "subtract", difficulty: "2-digit", timerSeconds: 0, questionCount: 20 },
    cyclingRng(),
  );
  for (const question of round.questions) {
    assert.ok(question.left >= 20 && question.left <= 99);
    assert.ok(question.right >= 10 && question.right <= question.left);
  }
});

test("thousands subtract is mostly bigger than a 2-digit take-away", () => {
  const round = engine.buildRound(
    { topic: "subtract", difficulty: "thousands", timerSeconds: 0, questionCount: 24 },
    cyclingRng(),
  );
  let chunky = 0;
  for (const question of round.questions) {
    assert.ok(question.left >= 1000);
    if (question.right >= 100) {
      chunky += 1;
    }
  }
  assert.ok(chunky >= 16, `expected mostly 3+ digit subtrahends, got ${chunky}`);
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
  assert.equal(engine.subtitleFor({ topic: "missing" }), "What's hiding?");
  assert.equal(engine.subtitleFor({ topic: "shapes" }), "Shapes practice");
  assert.equal(engine.subtitleFor({ topic: "times", operation: "multiply" }), "Multiplication practice");
  assert.equal(engine.subtitleFor({ topic: "times", operation: "divide" }), "Division practice");
});

test("normalizeSettings keeps a shapes topic and focus", () => {
  const settings = engine.normalizeSettings({ topic: "shapes", shapeFocus: "measure" });
  assert.equal(settings.topic, "shapes");
  assert.equal(settings.shapeFocus, "measure");
  assert.equal(engine.normalizeSettings({ topic: "shapes", shapeFocus: "nope" }).shapeFocus, "mix");
});

test("shapes name questions are multiple choice and show a picture", () => {
  const round = engine.buildRound(
    { topic: "shapes", shapeFocus: "names", timerSeconds: 0, questionCount: 12 },
    cyclingRng(),
  );
  const seen = new Set();
  for (const question of round.questions) {
    assert.equal(question.kind, "name");
    assert.equal(question.answerKind, "choice");
    assert.ok(engine.SHAPE_IDS.includes(question.shape));
    if (question.shape === "square") {
      assert.equal(question.figure.boxWidth, question.figure.boxHeight);
    }
    if (question.shape === "rectangle") {
      assert.notEqual(question.figure.boxWidth, question.figure.boxHeight);
    }
    assert.equal(question.answer, question.shape === "lshape" ? "L shape" : question.shape);
    assert.ok(question.figureSvg.includes("<svg"));
    assert.ok(question.choices.some((choice) => choice.value === question.answer));
    seen.add(question.shape);
  }
  assert.ok(seen.size >= 4);
});

test("circle has no straight sides and no corners", () => {
  const sides = engine.makeShapeQuestion({ shapeFocus: "count" }, rngFrom([0.1, 0.9, 0.2]));
  const corners = engine.makeShapeQuestion({ shapeFocus: "count" }, rngFrom([0.8, 0.9, 0.2]));
  assert.equal(sides.shape, "circle");
  assert.equal(sides.kind, "sides");
  assert.equal(sides.answer, 0);
  assert.match(sides.prompt, /straight sides/i);
  assert.ok(sides.figureSvg.includes("circle"));
  assert.equal(corners.shape, "circle");
  assert.equal(corners.kind, "corners");
  assert.equal(corners.answer, 0);
  assert.ok(corners.figureSvg.includes("circle"));
});

test("sides and corners match the picture", () => {
  const expected = {
    triangle: { sides: 3, corners: 3 },
    square: { sides: 4, corners: 4 },
    rectangle: { sides: 4, corners: 4 },
    pentagon: { sides: 5, corners: 5 },
    hexagon: { sides: 6, corners: 6 },
    circle: { sides: 0, corners: 0 },
  };
  const round = engine.buildRound(
    { topic: "shapes", shapeFocus: "count", timerSeconds: 0, questionCount: 36 },
    cyclingRng(),
  );
  for (const question of round.questions) {
    assert.ok(question.kind === "sides" || question.kind === "corners");
    assert.equal(question.answerKind, "number");
    assert.equal(question.answer, expected[question.shape][question.kind]);
    assert.ok(question.figureSvg.includes("<svg"));
  }
});

test("rectangle and square perimeter add the labeled sides", () => {
  const round = engine.buildRound(
    { topic: "shapes", shapeFocus: "measure", timerSeconds: 0, questionCount: 40 },
    cyclingRng(),
  );
  let perimeters = 0;
  let areas = 0;
  for (const question of round.questions) {
    assert.ok(question.figureSvg.includes("<svg"));
    if (question.kind === "perimeter") {
      perimeters += 1;
      const sum = question.figure.sideLengths.reduce((total, value) => total + value, 0);
      assert.equal(question.answer, sum);
      for (const value of question.figure.sideLengths) {
        assert.ok(question.figureSvg.includes(`>${value}</text>`));
      }
      if (question.shape === "square") {
        assert.equal(question.answer, 4 * question.figure.side);
      }
      if (question.shape === "rectangle") {
        assert.equal(question.answer, 2 * (question.figure.length + question.figure.width));
        assert.notEqual(question.figure.length, question.figure.width);
      }
    }
    if (question.kind === "area") {
      areas += 1;
      assert.ok(question.shape === "square" || question.shape === "rectangle");
      assert.equal(question.answer, question.figure.length * question.figure.width);
      assert.ok(question.figure.showGrid);
      assert.ok(question.figureSvg.includes("<rect"));
    }
  }
  assert.ok(perimeters >= 8);
  assert.ok(areas >= 4);
});

test("gradeAnswer accepts a shape name tap", () => {
  const question = engine.makeShapeQuestion({ shapeFocus: "names" }, () => 0.1);
  assert.equal(question.kind, "name");
  assert.deepEqual(engine.gradeAnswer(question, question.answer), {
    ok: true,
    empty: false,
    given: question.answer,
  });
  assert.equal(engine.gradeAnswer(question, "circle").ok, question.answer === "circle");
  assert.equal(engine.gradeAnswer(question, "").empty, true);
});

test("normalizeSettings keeps a missing-number topic", () => {
  const settings = engine.normalizeSettings({ topic: "missing" });
  assert.equal(settings.topic, "missing");
  assert.equal(engine.subtitleFor(settings), "What's hiding?");
  assert.equal(engine.markFor(settings), "n");
  assert.equal(engine.usesWorkspace(settings), true);
});

test("first missing-number question is a small add with n", () => {
  const question = engine.makeMissingQuestion({ tables: [3, 4] }, rngFrom([0.2, 0.8]), { first: true });
  assert.equal(question.topic, "missing");
  assert.equal(question.operation, "add");
  assert.equal(question.token, "n");
  assert.equal(question.slot, "right");
  assert.match(question.prompt, /^\d+ \+ n = \d+$/);
  assert.equal(question.answer, question.right);
  assert.equal(question.result, question.left + question.right);
  assert.equal(question.hint, "n is the missing number");
  assert.ok(!/variable|algebra/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("missing-number round mixes + − × ÷ and hides one number", () => {
  const seen = new Set();
  const tokens = new Set();
  const slots = new Set();
  let stretch = 0;
  let tick = 0;
  const round = engine.buildRound(
    { topic: "missing", tables: [3, 7], timerSeconds: 0, questionCount: 48 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 48);
  assert.equal(round.questions[0].token, "n");
  assert.equal(round.questions[0].operation, "add");
  assert.match(round.questions[0].prompt, /^\d+ \+ n = \d+$/);
  for (const question of round.questions) {
    assert.equal(question.topic, "missing");
    assert.ok(["add", "subtract", "multiply", "divide"].includes(question.operation));
    assert.ok(question.prompt.includes("="));
    assert.ok(question.prompt.includes(question.token));
    assert.ok(question.answer >= 0);
    assert.equal(question.fullPrompt, true);
    if (question.slot === "left") {
      assert.equal(question.answer, question.left);
      assert.ok(question.prompt.startsWith(`${question.token} `));
    } else {
      assert.equal(question.answer, question.right);
    }
    if (question.operation === "add") {
      assert.equal(question.result, question.left + question.right);
    }
    if (question.operation === "subtract") {
      assert.ok(question.left > question.right);
      assert.equal(question.result, question.left - question.right);
    }
    if (question.operation === "multiply") {
      assert.equal(question.result, question.left * question.right);
      assert.ok([3, 7].includes(question.left) || [3, 7].includes(question.right));
    }
    if (question.operation === "divide") {
      assert.equal(question.left, question.right * question.result);
      assert.ok([3, 7].includes(question.right) || question.slot === "right");
    }
    if ((question.operation === "add" || question.operation === "subtract") && question.left >= 20) {
      stretch += 1;
    }
    seen.add(question.operation);
    tokens.add(question.token);
    slots.add(question.slot);
    assert.ok(!/variable|algebra/i.test(`${question.prompt} ${question.hint}`));
  }
  assert.deepEqual([...seen].sort(), ["add", "divide", "multiply", "subtract"]);
  assert.ok(slots.has("left") && slots.has("right"));
  assert.ok(tokens.has("n"));
  assert.ok(stretch >= 2, `expected some multi-digit stretch, got ${stretch}`);
});

test("gradeAnswer scores the hidden number, not the total", () => {
  const question = engine.makeMissingQuestion({ tables: [4] }, () => 0.2, { first: true });
  assert.deepEqual(engine.gradeAnswer(question, String(question.answer)), {
    ok: true,
    empty: false,
    given: question.answer,
  });
  assert.equal(engine.gradeAnswer(question, String(question.result)).ok, question.result === question.answer);
  assert.equal(engine.gradeAnswer(question, "").empty, true);
});

test("mix stays numbers-only and times tables still work", () => {
  const mix = engine.buildRound(
    {
      topic: "mix",
      tables: [4],
      difficulty: "2-digit",
      timerSeconds: 0,
      questionCount: 24,
    },
    cyclingRng(),
  );
  for (const question of mix.questions) {
    assert.ok(["add", "subtract", "multiply", "divide"].includes(question.operation));
    assert.notEqual(question.topic, "shapes");
    assert.notEqual(question.topic, "missing");
  }
  const times = engine.buildRound(
    { topic: "times", tables: [8], operation: "multiply", timerSeconds: 0, questionCount: 6 },
    rngFrom([0.2, 0.8, 0.1, 0.6]),
  );
  for (const question of times.questions) {
    assert.equal(question.operation, "multiply");
    assert.equal(question.left, 8);
  }
});
