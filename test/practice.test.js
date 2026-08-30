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
  assert.equal(engine.subtitleFor({ topic: "onestep" }), "What number is n?");
  assert.equal(engine.subtitleFor({ topic: "twostep" }), "Then do this");
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
  assert.equal(engine.usesWorkspace(settings), false);
});

test("first missing-number question is 8 + n = 12", () => {
  const question = engine.makeMissingQuestion({ tables: [3, 4] }, rngFrom([0.2, 0.8]), { first: true });
  assert.equal(question.topic, "missing");
  assert.equal(question.operation, "add");
  assert.equal(question.token, "n");
  assert.equal(question.slot, "right");
  assert.equal(question.prompt, "8 + n = 12");
  assert.equal(question.left, 8);
  assert.equal(question.right, 4);
  assert.equal(question.answer, 4);
  assert.equal(question.result, 12);
  assert.equal(question.known, 8);
  assert.equal(question.hint, "n is hiding");
  assert.ok(!/variable|algebra/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("missing-number why-model is take-from-both for 8 + n = 12", () => {
  const question = engine.makeMissingQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  assert.equal(engine.usesWhyModel(question), true);
  assert.equal(model.kind, "balance");
  assert.equal(model.known, 8);
  assert.equal(model.hidden, 4);
  assert.equal(model.total, 12);
  assert.equal(model.slot, "right");
  assert.equal(engine.whyLeftover(model), 4);
  assert.equal(engine.whyCaption(model, "idle"), "");
  assert.equal(engine.whyCaption(model, "lift"), "What's left?");
  assert.equal(engine.whyCaption(model, "reveal"), "8 + 4 = 12");
  assert.ok(!/Take \d+ from both/.test(engine.whyCaption(model, "idle")));
  assert.ok(!/Take \d+ from both/.test(engine.whyNudge(model)));
});

test("after isolation the written prompt is n = leftover", () => {
  const question = engine.makeMissingQuestion({}, () => 0, { first: true });
  assert.equal(engine.whyPrompt(question, "idle").prompt, "8 + n = 12");
  assert.equal(engine.whyPrompt(question, "lift").prompt, "n = 4");
  assert.equal(engine.whyPrompt(question, "reveal").prompt, "n = 4");
  assert.match(engine.whyPrompt(question, "lift").promptHtml, /n.* = 4/);
});

test("why-nudge does not name the known amount", () => {
  const question = engine.makeMissingQuestion({}, rngFrom([0.2, 0.8]));
  const model = engine.whyModel(question);
  assert.equal(engine.usesWhyModel(question), true);
  assert.doesNotMatch(engine.whyNudge(model), new RegExp(String(model.known)));
  assert.doesNotMatch(engine.whyCaption(model, "idle"), /Take \d+ from both/);
  assert.notEqual(engine.whyNudge(model), String(model.hidden));
  assert.equal(engine.whyCaption(model, "lift"), "What's left?");
});

test("isolated prompt follows leftover when n is on either side", () => {
  const question = engine.makeMissingQuestion({}, rngFrom([0.1, 0.2]));
  const model = engine.whyModel(question);
  const leftover = model.total - model.known;
  assert.equal(engine.whyLeftover(model), leftover);
  assert.equal(engine.whyPrompt(question, "lift").prompt, `n = ${leftover}`);
  assert.notEqual(engine.whyPrompt(question, "idle").prompt, engine.whyPrompt(question, "lift").prompt);
});

test("ordinary wrong answers still advance", () => {
  const question = engine.makeQuestion(6, 7, "multiply");
  const wrong = engine.gradeAnswer(question, "41");
  assert.equal(wrong.ok, false);
  assert.equal(engine.shouldAdvanceAfterGrade(question, wrong), true);
});

test("wrong leftover guess tilts and does not advance", () => {
  const question = engine.makeMissingQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  const wrong = engine.gradeAnswer(question, "5");
  const right = engine.gradeAnswer(question, "4");
  assert.equal(wrong.ok, false);
  assert.equal(engine.shouldAdvanceAfterGrade(question, wrong), false);
  assert.equal(engine.whyTilt(model, 5), "left");
  assert.equal(engine.whyTilt(model, 3), "right");
  assert.equal(engine.whyTilt(model, 4), "level");
  assert.equal(right.ok, true);
  assert.equal(engine.shouldAdvanceAfterGrade(question, right), true);
});

test("missing-number round is missing addend only, small numbers", () => {
  const slots = new Set();
  const tokens = new Set();
  let tick = 0;
  const round = engine.buildRound(
    { topic: "missing", tables: [3, 7], timerSeconds: 0, questionCount: 20 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 20);
  assert.equal(round.questions[0].prompt, "8 + n = 12");
  assert.equal(round.questions[0].answer, 4);
  for (const question of round.questions) {
    assert.equal(question.topic, "missing");
    assert.equal(question.operation, "add");
    assert.equal(question.symbol, "+");
    assert.ok(["left", "right"].includes(question.slot));
    assert.ok(question.prompt.includes("="));
    assert.ok(question.prompt.includes("n"));
    assert.match(question.prompt, /^(n \+ \d+|\d+ \+ n) = \d+$/);
    assert.ok(!question.prompt.includes("×"));
    assert.ok(!question.prompt.includes("÷"));
    assert.ok(!question.prompt.includes("−"));
    assert.ok(!/\d+n/.test(question.prompt.replace(" + n", "")));
    assert.equal(question.answer, question.slot === "left" ? question.left : question.right);
    assert.ok(question.answer >= 1 && question.answer <= 9);
    assert.ok(question.result <= 20);
    assert.ok(question.left <= 12);
    assert.ok(question.right <= 12);
    assert.ok(Math.max(question.left, question.right) < 1000);
    assert.equal(question.result, question.left + question.right);
    assert.equal(question.fullPrompt, true);
    const model = engine.whyModel(question);
    assert.equal(model.known + model.hidden, model.total);
    assert.equal(model.hidden, question.answer);
    tokens.add(question.token);
    slots.add(question.slot);
    assert.ok(!/variable|algebra/i.test(`${question.prompt} ${question.hint}`));
  }
  assert.ok(slots.has("left") && slots.has("right"));
  assert.deepEqual([...tokens], ["n"]);
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

test("normalizeSettings keeps a one-step Find n topic", () => {
  const settings = engine.normalizeSettings({ topic: "onestep" });
  assert.equal(settings.topic, "onestep");
  assert.equal(engine.subtitleFor(settings), "What number is n?");
  assert.equal(engine.markFor(settings), "n");
  assert.equal(engine.usesWorkspace(settings), true);
});

test("first one-step question is n plus a number", () => {
  const question = engine.makeOnestepQuestion({}, rngFrom([0.2, 0.8]), { first: true });
  assert.equal(question.topic, "onestep");
  assert.equal(question.form, "n+a");
  assert.equal(question.token, "n");
  assert.match(question.prompt, /^n \+ \d+ = \d+$/);
  assert.equal(question.answer, question.prompt.match(/^n \+ (\d+) = (\d+)$/).slice(1).reduce((a, b) => Number(b) - Number(a)));
  assert.equal(question.hint, "Find n");
  assert.ok(!/variable|algebra|equation|system|inequal/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("one-step round stays one operation and includes 3n and n/3 style", () => {
  const seen = new Set();
  let tick = 0;
  const round = engine.buildRound(
    { topic: "onestep", timerSeconds: 0, questionCount: 48 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 48);
  assert.equal(round.questions[0].form, "n+a");
  assert.match(round.questions[0].prompt, /^n \+ \d+ = \d+$/);
  for (const question of round.questions) {
    assert.equal(question.topic, "onestep");
    assert.ok(engine.ONESTEP_FORMS.includes(question.form));
    assert.ok(question.prompt.includes("n"));
    assert.ok(question.prompt.includes("="));
    assert.equal((question.prompt.match(/=/g) || []).length, 1);
    assert.ok(question.answer >= 1);
    assert.equal(Number.isInteger(question.answer), true);
    if (question.form === "n+a") {
      assert.equal(question.answer + question.left, question.right);
    }
    if (question.form === "a+n") {
      assert.equal(question.left + question.answer, question.right);
    }
    if (question.form === "n-a") {
      assert.equal(question.answer - question.left, question.right);
    }
    if (question.form === "a-n") {
      assert.equal(question.left - question.answer, question.right);
    }
    if (question.form === "an") {
      assert.equal(question.left * question.answer, question.right);
      assert.match(question.prompt, /^\d+n = \d+$/);
    }
    if (question.form === "n/a") {
      assert.equal(question.answer / question.left, question.right);
      assert.match(question.prompt, /^n\/\d+ = \d+$/);
    }
    if (question.form === "a/n") {
      assert.equal(question.left / question.answer, question.right);
      assert.match(question.prompt, /^\d+\/n = \d+$/);
    }
    assert.ok(!/variable|algebra|equation|two-step|system|inequal|graph/i.test(`${question.prompt} ${question.hint}`));
    seen.add(question.form);
  }
  assert.ok(seen.has("n+a"));
  assert.ok(seen.has("a-n"));
  assert.ok(seen.has("an"));
  assert.ok(seen.has("n/a"));
});

test("gradeAnswer scores n, not the other number", () => {
  const question = engine.makeOnestepQuestion({}, () => 0.2, { first: true });
  assert.deepEqual(engine.gradeAnswer(question, String(question.answer)), {
    ok: true,
    empty: false,
    given: question.answer,
  });
  assert.equal(engine.gradeAnswer(question, String(question.right)).ok, question.right === question.answer);
});

test("new progress recommends Find n facts and keeps original topics quiet", () => {
  const progress = engine.normalizeProgress(null);
  assert.equal(progress.recommended, "missing");
  assert.equal(engine.isSkillUnlocked(progress, "onestep"), false);
  assert.equal(engine.isSkillUnlocked(progress, "twostep"), false);
  assert.deepEqual(engine.otherSkills(progress, "missing"), ["times", "add", "subtract", "mix", "shapes"]);
  assert.equal(engine.skillCopy("missing").title, "Find n");
  assert.equal(engine.skillCopy("onestep").title, "Find n");
  assert.equal(engine.skillCopy("twostep").title, "Find n");
  assert.equal(engine.skillCopy("twostep").blurb, "Then do this");
});

test("a strong Find n round unlocks one-step and recommends it", () => {
  const after = engine.applyRoundProgress(
    engine.emptyProgress(),
    "missing",
    { asked: 10, accuracy: 100 },
    10,
  );
  assert.equal(engine.isSkillFluent(after, "missing"), true);
  assert.equal(engine.isSkillUnlocked(after, "onestep"), true);
  assert.equal(engine.isSkillUnlocked(after, "twostep"), false);
  assert.equal(after.recommended, "onestep");
  assert.ok(after.unlocked.includes("onestep"));
  assert.ok(!after.unlocked.includes("twostep"));
  assert.ok(engine.otherSkills(after, "onestep").includes("missing"));
  assert.ok(engine.otherSkills(after, "onestep").includes("times"));
  assert.ok(!engine.otherSkills(after, "onestep").includes("twostep"));
});

test("a weak round keeps that skill as the recommendation", () => {
  const after = engine.applyRoundProgress(
    engine.emptyProgress(),
    "add",
    { asked: 10, accuracy: 40 },
    2,
  );
  assert.equal(after.lastStruggled, "add");
  assert.equal(after.recommended, "add");
  assert.equal(engine.isSkillUnlocked(after, "onestep"), false);
});

test("recovering from a struggle returns to the Find n path", () => {
  const struggled = engine.applyRoundProgress(
    engine.emptyProgress(),
    "add",
    { asked: 10, accuracy: 40 },
    1,
  );
  const recovered = engine.applyRoundProgress(
    struggled,
    "add",
    { asked: 10, accuracy: 100 },
    10,
  );
  assert.equal(recovered.lastStruggled, null);
  assert.equal(recovered.recommended, "missing");
});

test("Find n facts stay the old missing-number style", () => {
  const question = engine.makeMissingQuestion({ tables: [3, 4] }, rngFrom([0.2, 0.8]), { first: true });
  assert.equal(question.topic, "missing");
  assert.match(question.prompt, /^\d+ \+ n = \d+$/);
  assert.notEqual(question.topic, "onestep");
});

test("normalizeSettings keeps a two-step Find n topic", () => {
  const settings = engine.normalizeSettings({ topic: "twostep" });
  assert.equal(settings.topic, "twostep");
  assert.equal(engine.subtitleFor(settings), "Then do this");
  assert.equal(engine.markFor(settings), "n");
  assert.equal(engine.usesWorkspace(settings), true);
});

test("first two-step question is a small 3n + 4 style problem", () => {
  const question = engine.makeTwostepQuestion({}, rngFrom([0.2, 0.8]), { first: true });
  assert.equal(question.topic, "twostep");
  assert.equal(question.form, "an+b");
  assert.equal(question.token, "n");
  assert.match(question.prompt, /^\d+n \+ \d+ = \d+$/);
  assert.equal(question.a * question.answer + question.b, question.c);
  assert.equal(question.hint, "Then do this");
  assert.ok(!/variable|algebra|equation|system|inequal|graph|parenthes/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("two-step round stays two operations and includes the four kid forms", () => {
  const seen = new Set();
  let tick = 0;
  const round = engine.buildRound(
    { topic: "twostep", timerSeconds: 0, questionCount: 48 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 48);
  assert.equal(round.questions[0].form, "an+b");
  assert.match(round.questions[0].prompt, /^\d+n \+ \d+ = \d+$/);
  for (const question of round.questions) {
    assert.equal(question.topic, "twostep");
    assert.ok(engine.TWOSTEP_FORMS.includes(question.form));
    assert.ok(question.prompt.includes("n"));
    assert.ok(question.prompt.includes("="));
    assert.equal((question.prompt.match(/=/g) || []).length, 1);
    assert.ok(!question.prompt.includes("("));
    assert.ok(!question.prompt.includes(")"));
    assert.equal((question.prompt.match(/n/g) || []).length, 1);
    assert.ok(question.answer >= 0);
    assert.equal(Number.isInteger(question.answer), true);
    assert.equal(Number.isInteger(question.a), true);
    assert.equal(Number.isInteger(question.b), true);
    assert.equal(Number.isInteger(question.c), true);
    assert.ok(question.c >= 0);
    if (question.form === "an+b") {
      assert.equal(question.a * question.answer + question.b, question.c);
      assert.match(question.prompt, /^\d+n \+ \d+ = \d+$/);
    }
    if (question.form === "n/a+b") {
      assert.equal(question.answer / question.a + question.b, question.c);
      assert.match(question.prompt, /^n\/\d+ \+ \d+ = \d+$/);
    }
    if (question.form === "an-b") {
      assert.equal(question.a * question.answer - question.b, question.c);
      assert.match(question.prompt, /^\d+n − \d+ = \d+$/);
    }
    if (question.form === "a-bn") {
      assert.equal(question.a - question.b * question.answer, question.c);
      assert.match(question.prompt, /^\d+ − \d+n = \d+$/);
    }
    assert.ok(!/variable|algebra|equation|two-step|system|inequal|graph/i.test(`${question.prompt} ${question.hint}`));
    seen.add(question.form);
  }
  assert.ok(seen.has("an+b"));
  assert.ok(seen.has("n/a+b"));
  assert.ok(seen.has("an-b"));
  assert.ok(seen.has("a-bn"));
});

test("gradeAnswer scores n on a two-step problem, not the other numbers", () => {
  const question = engine.makeTwostepQuestion({}, () => 0.2, { first: true });
  assert.deepEqual(engine.gradeAnswer(question, String(question.answer)), {
    ok: true,
    empty: false,
    given: question.answer,
  });
  assert.equal(engine.gradeAnswer(question, String(question.c)).ok, question.c === question.answer);
  assert.equal(engine.gradeAnswer(question, String(question.b)).ok, question.b === question.answer);
});

test("a strong one-step round unlocks two-step and recommends Find n again", () => {
  const afterMissing = engine.applyRoundProgress(
    engine.emptyProgress(),
    "missing",
    { asked: 10, accuracy: 100 },
    10,
  );
  const after = engine.applyRoundProgress(
    afterMissing,
    "onestep",
    { asked: 10, accuracy: 100 },
    10,
  );
  assert.equal(engine.isSkillFluent(after, "onestep"), true);
  assert.equal(engine.isSkillUnlocked(after, "twostep"), true);
  assert.equal(after.recommended, "twostep");
  assert.ok(after.unlocked.includes("twostep"));
  assert.equal(engine.skillCopy(after.recommended).title, "Find n");
  assert.equal(engine.skillCopy(after.recommended).blurb, "Then do this");
  assert.ok(engine.otherSkills(after, "twostep").includes("onestep"));
  assert.ok(engine.otherSkills(after, "twostep").includes("missing"));
  assert.ok(engine.otherSkills(after, "twostep").includes("times"));
  assert.ok(!engine.otherSkills(after, "twostep").includes("twostep"));
});

test("saved one-step fluency already recommends two-step", () => {
  const progress = engine.normalizeProgress({
    unlocked: ["onestep"],
    fluency: {
      missing: { strongRounds: 1, bestStreak: 10, lastAccuracy: 100, lastAsked: 10 },
      onestep: { strongRounds: 1, bestStreak: 10, lastAccuracy: 100, lastAsked: 10 },
    },
  });
  assert.equal(progress.recommended, "twostep");
  assert.equal(engine.isSkillUnlocked(progress, "twostep"), true);
  assert.equal(engine.isSkillUnlocked(progress, "onestep"), true);
});

test("an 8-streak on one-step is enough to unlock two-step", () => {
  const afterMissing = engine.applyRoundProgress(
    engine.emptyProgress(),
    "missing",
    { asked: 4, accuracy: 100 },
    8,
  );
  const after = engine.applyRoundProgress(
    afterMissing,
    "onestep",
    { asked: 8, accuracy: 100 },
    8,
  );
  assert.equal(engine.isSkillFluent(after, "onestep"), true);
  assert.equal(after.recommended, "twostep");
});

test("one-step rounds stay one-step even after two-step exists", () => {
  const round = engine.buildRound(
    { topic: "onestep", timerSeconds: 0, questionCount: 12 },
    cyclingRng(),
  );
  for (const question of round.questions) {
    assert.equal(question.topic, "onestep");
    assert.ok(engine.ONESTEP_FORMS.includes(question.form));
    assert.notEqual(question.topic, "twostep");
  }
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

test("product name is n / What's hiding, not Times Tables", () => {
  assert.equal(engine.PRODUCT_NAME, "n");
  assert.equal(engine.PRODUCT_BLURB, "What's hiding");
  const titles = engine.trailChapters().map((chapter) => chapter.title).join(" ");
  assert.doesNotMatch(titles, /SAT|calculus|Khan/i);
  assert.equal(engine.trailChapters()[0].id, "grade-3");
  assert.equal(engine.trailChapters()[0].nodes.map((node) => node.id).join(","), "number-sense,missing-addend,missing-subtrahend,times-facts");
});

test("first visit opens Grade 3 and only number sense is Start", () => {
  const progress = engine.normalizeProgress(null);
  assert.equal(progress.coins, engine.STARTER_COINS);
  assert.equal(engine.chapterStatus(progress, "grade-3"), "open");
  assert.equal(engine.chapterStatus(progress, "grade-4"), "closed");
  assert.equal(engine.chapterStatus(progress, "algebra-2"), "closed");
  assert.equal(engine.nodeStatus(progress, "number-sense"), "current");
  assert.equal(engine.nodeAction("current"), "Start");
  assert.equal(engine.nodeStatus(progress, "missing-addend"), "priced");
  assert.equal(engine.nodeStatus(progress, "missing-subtrahend"), "locked");
  assert.equal(engine.nodeStatus(progress, "times-facts"), "locked");
  assert.equal(engine.isNodePlayable("number-sense"), true);
  assert.equal(engine.isNodePlayable("missing-addend"), true);
  assert.equal(engine.isNodePlayable("missing-subtrahend"), true);
  assert.equal(engine.isNodePlayable("times-facts"), true);
  assert.equal(engine.canStartNode(progress, "number-sense"), true);
  assert.equal(engine.canStartNode(progress, "missing-addend"), false);
  assert.equal(engine.canStartNode(progress, "missing-subtrahend"), false);
  assert.equal(engine.canStartNode(progress, "times-facts"), false);
  assert.equal(engine.startNode().topic, "sense");
  const next = engine.nextPricedUnlock(progress);
  assert.equal(next.kind, "node");
  assert.equal(next.id, "missing-addend");
  assert.equal(next.cost, engine.NODE_UNLOCK_COST);
  assert.ok(progress.coins < next.cost);
});

test("correct n after the why-move earns coins; miss and skip-move pay 0", () => {
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 1, earnedThisRound: 0 }), engine.COIN_BASE);
  assert.equal(engine.payoutCoins({ ok: false, usesWhy: true, whyDone: true, streak: 4, earnedThisRound: 0 }), 0);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: false, streak: 4, earnedThisRound: 0 }), 0);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: false, whyDone: true, streak: 4, earnedThisRound: 0 }), 0);
});

test("streak bonus is small and a round cap stops grinding one family", () => {
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 2, earnedThisRound: 0 }), engine.COIN_BASE);
  assert.equal(
    engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: engine.COIN_STREAK_AT, earnedThisRound: 0 }),
    engine.COIN_BASE + engine.COIN_STREAK_BONUS,
  );
  assert.equal(
    engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 20, earnedThisRound: 0 }),
    engine.COIN_BASE + engine.COIN_STREAK_BONUS,
  );
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 8, earnedThisRound: engine.COIN_ROUND_CAP }), 0);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 8, earnedThisRound: engine.COIN_ROUND_CAP - 1 }), 1);
  let earned = 0;
  for (let streak = 1; streak <= 20; streak += 1) {
    earned += engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak, earnedThisRound: earned });
  }
  assert.equal(earned, engine.COIN_ROUND_CAP);
  assert.ok(engine.STARTER_COINS + engine.COIN_ROUND_CAP >= engine.NODE_UNLOCK_COST);
  assert.ok(engine.STARTER_COINS + engine.COIN_ROUND_CAP < engine.NODE_UNLOCK_COST * 2);
});

test("a short honest number-sense run can buy missing addend", () => {
  let progress = engine.emptyProgress();
  let earned = 0;
  for (let streak = 1; streak <= 4; streak += 1) {
    const payout = engine.payoutCoins({
      ok: true,
      usesWhy: true,
      whyDone: true,
      streak,
      earnedThisRound: earned,
    });
    earned += payout;
    progress = engine.applyCoinPayout(progress, payout);
  }
  assert.ok(progress.coins >= engine.NODE_UNLOCK_COST);
  const spent = engine.spendUnlock(progress);
  assert.equal(spent.ok, true);
  assert.equal(spent.unlocked.id, "missing-addend");
  assert.equal(engine.nodeStatus(spent.progress, "number-sense"), "current");
  assert.equal(engine.nodeStatus(spent.progress, "missing-addend"), "current");
  assert.equal(engine.nodeAction(engine.nodeStatus(spent.progress, "missing-addend")), "Start");
  assert.equal(engine.canStartNode(spent.progress, "missing-addend"), true);
  assert.equal(engine.nodeStatus(spent.progress, "missing-subtrahend"), "priced");
  assert.equal(engine.nextPricedUnlock(spent.progress).id, "missing-subtrahend");
});

test("cannot unlock the next node without earning the rest", () => {
  const blocked = engine.spendUnlock(engine.emptyProgress());
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "coins");
  assert.equal(blocked.progress.coins, engine.STARTER_COINS);
  assert.equal(engine.nodeStatus(blocked.progress, "missing-addend"), "priced");
});

test("looks are a cheap sink and never skip the why-move", () => {
  const rich = engine.applyCoinPayout(engine.emptyProgress(), 8);
  const bought = engine.spendLook(rich, "leaf");
  assert.equal(bought.ok, true);
  assert.equal(bought.progress.look, "leaf");
  assert.equal(bought.progress.coins, rich.coins - engine.LOOK_COST);
  const again = engine.spendLook(bought.progress, "leaf");
  assert.equal(again.reason, "owned");
  assert.equal(again.progress.coins, bought.progress.coins);
  const broke = engine.spendLook(engine.emptyProgress(), "leaf");
  assert.equal(broke.ok, false);
  assert.equal(broke.progress.look, "ink");
});

test("finishing a missing-addend round marks that node for replay", () => {
  const after = engine.applyRoundProgress(engine.emptyProgress(), "missing", { asked: 4, accuracy: 100 }, 3);
  assert.ok(after.completedNodes.includes("missing-addend"));
  assert.equal(engine.nodeStatus(after, "missing-addend"), "replay");
  assert.equal(engine.nodeAction("replay"), "Replay");
  assert.equal(engine.nodeStatus(after, "missing-subtrahend"), "priced");
});

test("buying later Grade 3 nodes teaches times facts and never opens Grade 4", () => {
  let progress = engine.applyCoinPayout(engine.emptyProgress(), 40);
  const first = engine.spendUnlock(progress);
  const second = engine.spendUnlock(first.progress);
  const third = engine.spendUnlock(second.progress);
  assert.equal(first.unlocked.id, "missing-addend");
  assert.equal(engine.canStartNode(first.progress, "missing-addend"), true);
  assert.equal(second.unlocked.id, "missing-subtrahend");
  assert.equal(engine.canStartNode(second.progress, "missing-subtrahend"), true);
  assert.equal(third.unlocked.id, "times-facts");
  assert.equal(engine.isNodePlayable("times-facts"), true);
  assert.equal(engine.canStartNode(third.progress, "times-facts"), true);
  assert.equal(engine.nodeStatus(third.progress, "times-facts"), "current");
  assert.equal(engine.nodeAction(engine.nodeStatus(third.progress, "times-facts")), "Start");
  assert.equal(engine.nextPricedUnlock(third.progress), null);
  assert.equal(engine.chapterStatus(third.progress, "grade-4"), "closed");
  const blocked = engine.spendUnlock(third.progress);
  assert.equal(blocked.ok, false);
  assert.equal(engine.chapterStatus(blocked.progress, "grade-4"), "closed");
  assert.equal(engine.isNodePlayable("missing-factor"), false);
  assert.equal(engine.canStartNode(blocked.progress, "missing-factor"), false);
});

test("first missing-subtrahend question is 12 − n = 8", () => {
  const question = engine.makeMissingSubtrahendQuestion({}, () => 0, { first: true });
  assert.equal(question.topic, "subtrahend");
  assert.equal(question.operation, "subtract");
  assert.equal(question.token, "n");
  assert.equal(question.slot, "right");
  assert.equal(question.prompt, "12 − n = 8");
  assert.equal(question.left, 12);
  assert.equal(question.right, 4);
  assert.equal(question.result, 8);
  assert.equal(question.answer, 4);
  assert.equal(question.known, 8);
  assert.equal(question.hint, "n is hiding");
  assert.ok(!/variable|algebra|inverse|add n/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("missing-subtrahend why-model puts minuend against known leftover", () => {
  const question = engine.makeMissingSubtrahendQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  assert.equal(engine.usesWhyModel(question), true);
  assert.equal(model.kind, "balance");
  assert.equal(model.family, "subtrahend");
  assert.equal(model.total, 12);
  assert.equal(model.known, 8);
  assert.equal(model.hidden, 4);
  assert.equal(engine.whyLeftover(model), 4);
  assert.equal(engine.whyCaption(model, "idle"), "");
  assert.equal(engine.whyCaption(model, "lift"), "What's left?");
  assert.equal(engine.whyCaption(model, "reveal"), "12 − 4 = 8");
  assert.equal(engine.whyPrompt(question, "idle").prompt, "12 − n = 8");
  assert.equal(engine.whyPrompt(question, "lift").prompt, "n = 4");
  assert.doesNotMatch(engine.whyNudge(model), /12|8|add|inverse/i);
});

test("wrong leftover on missing subtrahend tilts and does not advance", () => {
  const question = engine.makeMissingSubtrahendQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  const wrong = engine.gradeAnswer(question, "5");
  const right = engine.gradeAnswer(question, "4");
  assert.equal(wrong.ok, false);
  assert.equal(engine.shouldAdvanceAfterGrade(question, wrong), false);
  assert.equal(engine.whyTilt(model, 5), "left");
  assert.equal(engine.whyTilt(model, 3), "right");
  assert.equal(engine.whyTilt(model, 4), "level");
  assert.equal(right.ok, true);
  assert.equal(engine.shouldAdvanceAfterGrade(question, right), true);
});

test("missing-subtrahend round stays take-away n, small numbers", () => {
  let tick = 0;
  const round = engine.buildRound(
    { topic: "subtrahend", timerSeconds: 0, questionCount: 20 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 20);
  assert.equal(round.questions[0].prompt, "12 − n = 8");
  assert.equal(round.questions[0].answer, 4);
  for (const question of round.questions) {
    assert.equal(question.topic, "subtrahend");
    assert.equal(question.operation, "subtract");
    assert.match(question.prompt, /^\d+ − n = \d+$/);
    assert.ok(!question.prompt.includes("×"));
    assert.ok(!question.prompt.includes("÷"));
    assert.ok(!question.prompt.includes("+"));
    assert.ok(question.answer >= 1 && question.answer <= 9);
    assert.ok(question.left <= 20);
    assert.ok(question.result <= 12);
    assert.ok(question.left < 1000);
    assert.equal(question.left - question.answer, question.result);
    assert.equal(question.fullPrompt, true);
    const model = engine.whyModel(question);
    assert.equal(model.family, "subtrahend");
    assert.equal(model.total - model.known, model.hidden);
    assert.equal(model.hidden, question.answer);
    assert.equal(engine.whyPrompt(question, "lift").prompt, `n = ${model.hidden}`);
    assert.ok(!/variable|algebra|inverse/i.test(`${question.prompt} ${question.hint}`));
  }
});

test("missing addend rounds stay addend-only after subtrahend exists", () => {
  const addend = engine.buildRound(
    { topic: "missing", timerSeconds: 0, questionCount: 8 },
    cyclingRng(),
  );
  assert.equal(addend.questions[0].prompt, "8 + n = 12");
  for (const question of addend.questions) {
    assert.equal(question.topic, "missing");
    assert.equal(question.operation, "add");
    assert.equal(engine.whyModel(question).family, "addend");
    assert.ok(!question.prompt.includes("−"));
  }
});

test("playableTopic only allows the four Grade 3 teaching families", () => {
  assert.equal(engine.playableTopic("sense"), "sense");
  assert.equal(engine.playableTopic("missing"), "missing");
  assert.equal(engine.playableTopic("subtrahend"), "subtrahend");
  assert.equal(engine.playableTopic("factor"), "factor");
  assert.equal(engine.playableTopic("times"), "sense");
  assert.equal(engine.playableTopic("onestep"), "sense");
  assert.equal(engine.normalizeSettings({ topic: "sense" }).topic, "sense");
  assert.equal(engine.normalizeSettings({ topic: "factor" }).topic, "factor");
  assert.equal(engine.normalizeSettings({ topic: "subtrahend" }).topic, "subtrahend");
  assert.equal(engine.subtitleFor({ topic: "sense" }), "What's hiding?");
  assert.equal(engine.subtitleFor({ topic: "factor" }), "What's hiding?");
  assert.equal(engine.subtitleFor({ topic: "subtrahend" }), "What's hiding?");
  assert.equal(engine.usesWorkspace({ topic: "sense" }), false);
  assert.equal(engine.usesWorkspace({ topic: "factor" }), false);
  assert.equal(engine.usesWorkspace({ topic: "subtrahend" }), false);
});

test("a missing-subtrahend round marks that node for replay, not times facts", () => {
  const after = engine.applyRoundProgress(
    engine.emptyProgress(),
    "subtrahend",
    { asked: 4, accuracy: 100 },
    3,
  );
  assert.ok(after.completedNodes.includes("missing-subtrahend"));
  assert.ok(!after.completedNodes.includes("times-facts"));
  assert.ok(!after.completedNodes.includes("number-sense"));
  const opened = engine.spendUnlock(engine.applyCoinPayout(after, 12));
  assert.equal(engine.nodeStatus(opened.progress, "missing-subtrahend"), "replay");
  assert.equal(engine.nodeAction("replay"), "Replay");
});

test("coins still require why-move plus correct n on subtrahend", () => {
  const question = engine.makeMissingSubtrahendQuestion({}, () => 0, { first: true });
  assert.equal(engine.usesWhyModel(question), true);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 1, earnedThisRound: 0 }), engine.COIN_BASE);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: false, streak: 4, earnedThisRound: 0 }), 0);
  assert.equal(engine.payoutCoins({ ok: false, usesWhy: true, whyDone: true, streak: 4, earnedThisRound: 0 }), 0);
});

test("first number-sense question hides 4 on a ten-frame", () => {
  const question = engine.makeSenseQuestion({}, () => 0, { first: true });
  assert.equal(question.topic, "sense");
  assert.equal(question.operation, "add");
  assert.equal(question.token, "n");
  assert.equal(question.prompt, "6 + n = 10");
  assert.equal(question.known, 6);
  assert.equal(question.answer, 4);
  assert.equal(question.result, 10);
  assert.equal(question.hint, "n is hiding");
  assert.ok(!/variable|algebra|flashcard|quiz/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("number-sense why-model is a ten-frame hide, then n = leftover", () => {
  const question = engine.makeSenseQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  assert.equal(engine.usesWhyModel(question), true);
  assert.equal(model.kind, "frame");
  assert.equal(model.family, "sense");
  assert.equal(model.known, 6);
  assert.equal(model.hidden, 4);
  assert.equal(model.total, 10);
  assert.equal(engine.whyLeftover(model), 4);
  assert.equal(engine.whyCaption(model, "idle"), "");
  assert.equal(engine.whyCaption(model, "lift"), "What's left?");
  assert.equal(engine.whyCaption(model, "reveal"), "6 + 4 = 10");
  assert.equal(engine.whyPrompt(question, "idle").prompt, "6 + n = 10");
  assert.equal(engine.whyPrompt(question, "lift").prompt, "n = 4");
  assert.doesNotMatch(engine.whyNudge(model), /6|4|10/);
});

test("wrong leftover on number sense tilts and does not advance", () => {
  const question = engine.makeSenseQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  const wrong = engine.gradeAnswer(question, "5");
  const right = engine.gradeAnswer(question, "4");
  assert.equal(wrong.ok, false);
  assert.equal(engine.shouldAdvanceAfterGrade(question, wrong), false);
  assert.equal(engine.whyTilt(model, 5), "left");
  assert.equal(engine.whyTilt(model, 3), "right");
  assert.equal(engine.whyTilt(model, 4), "level");
  assert.equal(right.ok, true);
  assert.equal(engine.shouldAdvanceAfterGrade(question, right), true);
});

test("number-sense round stays hide/count within 20", () => {
  let tick = 0;
  const round = engine.buildRound(
    { topic: "sense", timerSeconds: 0, questionCount: 20 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 20);
  assert.equal(round.questions[0].prompt, "6 + n = 10");
  let sawTwenty = false;
  for (const question of round.questions) {
    assert.equal(question.topic, "sense");
    assert.equal(question.operation, "add");
    assert.match(question.prompt, /^\d+ \+ n = \d+$/);
    assert.ok(!question.prompt.includes("×"));
    assert.ok(question.answer >= 1 && question.answer <= 9);
    assert.ok(question.result <= 20);
    assert.ok(question.known <= 10);
    assert.ok(question.left < 100);
    assert.equal(question.known + question.answer, question.result);
    const model = engine.whyModel(question);
    assert.equal(model.kind, "frame");
    assert.equal(model.total - model.known, model.hidden);
    assert.equal(engine.whyPrompt(question, "lift").prompt, `n = ${model.hidden}`);
    if (question.result > 10) {
      sawTwenty = true;
      assert.equal(question.known, 10);
    }
    assert.ok(!/variable|algebra|SAT|calculus/i.test(`${question.prompt} ${question.hint}`));
  }
  assert.equal(sawTwenty, true);
});

test("first times-facts question is missing factor 2 × n = 8", () => {
  const question = engine.makeFactorQuestion({}, () => 0, { first: true });
  assert.equal(question.topic, "factor");
  assert.equal(question.operation, "multiply");
  assert.equal(question.token, "n");
  assert.equal(question.prompt, "2 × n = 8");
  assert.equal(question.groups, 2);
  assert.equal(question.answer, 4);
  assert.equal(question.result, 8);
  assert.equal(question.known, 4);
  assert.equal(question.hint, "n is hiding");
  assert.ok(!/variable|algebra|keypad|quiz/i.test(`${question.prompt} ${question.hint} ${question.review}`));
});

test("times-facts why-model isolates one group, then n = leftover", () => {
  const question = engine.makeFactorQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  assert.equal(engine.usesWhyModel(question), true);
  assert.equal(model.kind, "groups");
  assert.equal(model.family, "factor");
  assert.equal(model.groups, 2);
  assert.equal(model.known, 4);
  assert.equal(model.hidden, 4);
  assert.equal(model.total, 8);
  assert.equal(engine.whyLeftover(model), 4);
  assert.equal(engine.whyCaption(model, "lift"), "What's left?");
  assert.equal(engine.whyCaption(model, "reveal"), "2 × 4 = 8");
  assert.equal(engine.whyPrompt(question, "idle").prompt, "2 × n = 8");
  assert.equal(engine.whyPrompt(question, "lift").prompt, "n = 4");
  assert.doesNotMatch(engine.whyNudge(model), /2|4|8|×/);
});

test("wrong leftover on missing factor tilts and does not advance", () => {
  const question = engine.makeFactorQuestion({}, () => 0, { first: true });
  const model = engine.whyModel(question);
  const wrong = engine.gradeAnswer(question, "5");
  const right = engine.gradeAnswer(question, "4");
  assert.equal(wrong.ok, false);
  assert.equal(engine.shouldAdvanceAfterGrade(question, wrong), false);
  assert.equal(engine.whyTilt(model, 5), "left");
  assert.equal(engine.whyTilt(model, 3), "right");
  assert.equal(engine.whyTilt(model, 4), "level");
  assert.equal(right.ok, true);
  assert.equal(engine.shouldAdvanceAfterGrade(question, right), true);
});

test("times-facts round is missing factor, not a product keypad quiz", () => {
  let tick = 0;
  const round = engine.buildRound(
    { topic: "factor", tables: [7, 8], timerSeconds: 0, questionCount: 20 },
    () => {
      tick += 1;
      return (tick % 97) / 97;
    },
  );
  assert.equal(round.questions.length, 20);
  assert.equal(round.questions[0].prompt, "2 × n = 8");
  for (const question of round.questions) {
    assert.equal(question.topic, "factor");
    assert.equal(question.operation, "multiply");
    assert.match(question.prompt, /^\d+ × n = \d+$/);
    assert.ok(!/^\d+ × \d+$/.test(question.prompt));
    assert.ok(question.groups >= 2 && question.groups <= 5);
    assert.ok(question.answer >= 2 && question.answer <= 10);
    assert.ok(question.result <= 25);
    assert.equal(question.groups * question.answer, question.result);
    assert.equal(question.known, (question.groups - 1) * question.answer);
    const model = engine.whyModel(question);
    assert.equal(model.kind, "groups");
    assert.equal(model.total - model.known, model.hidden);
    assert.equal(engine.whyPrompt(question, "lift").prompt, `n = ${model.hidden}`);
    assert.ok(!/variable|algebra|SAT|calculus/i.test(`${question.prompt} ${question.hint}`));
  }
});

test("coins still require why-move plus correct n on sense and factor", () => {
  const sense = engine.makeSenseQuestion({}, () => 0, { first: true });
  const factor = engine.makeFactorQuestion({}, () => 0, { first: true });
  assert.equal(engine.usesWhyModel(sense), true);
  assert.equal(engine.usesWhyModel(factor), true);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: true, streak: 1, earnedThisRound: 0 }), engine.COIN_BASE);
  assert.equal(engine.payoutCoins({ ok: true, usesWhy: true, whyDone: false, streak: 4, earnedThisRound: 0 }), 0);
  assert.equal(engine.payoutCoins({ ok: false, usesWhy: true, whyDone: true, streak: 4, earnedThisRound: 0 }), 0);
});

test("finishing sense or factor marks that Grade 3 node for replay", () => {
  const afterSense = engine.applyRoundProgress(engine.emptyProgress(), "sense", { asked: 4, accuracy: 100 }, 3);
  assert.ok(afterSense.completedNodes.includes("number-sense"));
  assert.equal(engine.nodeStatus(afterSense, "number-sense"), "replay");
  assert.equal(engine.nodeStatus(afterSense, "missing-addend"), "priced");
  const opened = engine.spendUnlock(engine.applyCoinPayout(engine.emptyProgress(), 40));
  const afterFactor = engine.applyRoundProgress(
    engine.spendUnlock(engine.spendUnlock(opened.progress).progress).progress,
    "factor",
    { asked: 4, accuracy: 100 },
    3,
  );
  assert.ok(afterFactor.completedNodes.includes("times-facts"));
  assert.equal(engine.nodeStatus(afterFactor, "times-facts"), "replay");
  assert.equal(engine.chapterStatus(afterFactor, "grade-4"), "closed");
});

test("old saves that already opened later Grade 3 nodes keep missing addend", () => {
  const progress = engine.normalizeProgress({
    coins: 6,
    unlockedNodes: ["missing-subtrahend"],
    completedNodes: ["missing-addend"],
  });
  assert.ok(progress.unlockedNodes.includes("missing-addend"));
  assert.equal(engine.nodeStatus(progress, "number-sense"), "current");
  assert.equal(engine.canStartNode(progress, "missing-addend"), true);
  assert.equal(engine.canStartNode(progress, "missing-subtrahend"), true);
  assert.equal(engine.nodeStatus(progress, "times-facts"), "priced");
});
