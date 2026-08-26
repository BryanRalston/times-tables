(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.TimesTables = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const OPERATIONS = ["multiply", "divide", "mix"];
  const TOPICS = ["times", "add", "subtract", "mix"];
  const DIFFICULTIES = ["2-digit", "3-digit", "thousands"];
  const MIX_OPERATIONS = ["add", "subtract", "multiply", "divide"];
  const DEFAULT_SETTINGS = {
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    topic: "times",
    operation: "multiply",
    difficulty: "3-digit",
    timerSeconds: 0,
    questionCount: 20,
  };

  function uniqueSortedNumbers(values) {
    return Array.from(
      new Set(
        values
          .map((value) => Number(value))
          .filter((value) => TABLES.includes(value)),
      ),
    ).sort((a, b) => a - b);
  }

  function normalizeOperation(operation) {
    return OPERATIONS.includes(operation) ? operation : "multiply";
  }

  function normalizeTopic(topic) {
    return TOPICS.includes(topic) ? topic : "times";
  }

  function normalizeDifficulty(difficulty) {
    return DIFFICULTIES.includes(difficulty) ? difficulty : "3-digit";
  }

  function normalizeSettings(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const tables = uniqueSortedNumbers(source.tables || DEFAULT_SETTINGS.tables);
    const timerSeconds = [0, 30, 60, 90].includes(Number(source.timerSeconds))
      ? Number(source.timerSeconds)
      : 0;
    const rawCount = Number(source.questionCount);
    const questionCount =
      Number.isInteger(rawCount) && rawCount > 0 ? Math.min(rawCount, 144) : 20;

    return {
      tables: tables.length ? tables : DEFAULT_SETTINGS.tables.slice(),
      topic: normalizeTopic(source.topic),
      operation: normalizeOperation(source.operation),
      difficulty: normalizeDifficulty(source.difficulty),
      timerSeconds,
      questionCount,
    };
  }

  function randomInt(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
  }

  function pickItem(items, rng) {
    return items[Math.floor(rng() * items.length)];
  }

  function needsRegroupAdd(left, right) {
    let a = left;
    let b = right;
    while (a > 0 || b > 0) {
      if (a % 10 + (b % 10) >= 10) {
        return true;
      }
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return false;
  }

  function needsRegroupSubtract(left, right) {
    let a = left;
    let b = right;
    while (a > 0 || b > 0) {
      if (a % 10 < b % 10) {
        return true;
      }
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
    }
    return false;
  }

  function generateAddPair(difficulty, rng) {
    const resolved = normalizeDifficulty(difficulty);
    let pair = { left: 10, right: 10 };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (resolved === "2-digit") {
        pair = {
          left: randomInt(10, 99, rng),
          right: randomInt(10, 99, rng),
        };
      } else if (resolved === "3-digit") {
        pair = {
          left: randomInt(100, 999, rng),
          right: rng() < 0.28 ? randomInt(12, 99, rng) : randomInt(100, 999, rng),
        };
      } else {
        const kind = rng();
        let left = randomInt(1000, 9999, rng);
        let right;
        if (kind < 0.12) {
          left = randomInt(1, 9, rng) * 1000;
          right = randomInt(100, 999, rng);
        } else if (kind < 0.55) {
          right = randomInt(100, 999, rng);
        } else {
          right = randomInt(1000, 9999, rng);
        }
        pair = { left, right };
      }
      if (needsRegroupAdd(pair.left, pair.right) || attempt === 9) {
        return pair;
      }
    }
    return pair;
  }

  function generateSubtractPair(difficulty, rng) {
    const resolved = normalizeDifficulty(difficulty);
    let pair = { left: 20, right: 10 };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (resolved === "2-digit") {
        const left = randomInt(20, 99, rng);
        pair = {
          left,
          right: randomInt(10, left, rng),
        };
      } else if (resolved === "3-digit") {
        const left = randomInt(100, 999, rng);
        const useTwoDigit = rng() < 0.22 || left < 200;
        pair = {
          left,
          right: useTwoDigit ? randomInt(12, 99, rng) : randomInt(100, left, rng),
        };
      } else {
        const left = randomInt(1000, 9999, rng);
        const kind = rng();
        let right;
        if (kind < 0.1) {
          right = randomInt(12, 99, rng);
        } else if (kind < 0.6) {
          right = randomInt(100, 999, rng);
        } else {
          right = randomInt(1000, left, rng);
        }
        pair = { left, right };
      }
      if (pair.left < pair.right) {
        pair = { left: pair.right, right: pair.left };
      }
      if (needsRegroupSubtract(pair.left, pair.right) || attempt === 9) {
        return pair;
      }
    }
    return pair;
  }

  function makeAddQuestion(left, right) {
    return {
      left,
      right,
      answer: left + right,
      operation: "add",
      symbol: "+",
      prompt: `${left} + ${right}`,
      fact: `${left} + ${right}`,
    };
  }

  function makeSubtractQuestion(left, right) {
    const minuend = Math.max(left, right);
    const subtrahend = Math.min(left, right);
    return {
      left: minuend,
      right: subtrahend,
      answer: minuend - subtrahend,
      operation: "subtract",
      symbol: "−",
      prompt: `${minuend} − ${subtrahend}`,
      fact: `${minuend} − ${subtrahend}`,
    };
  }

  function pickTimesOperation(operation, rng) {
    if (operation !== "mix") {
      return operation;
    }
    return rng() < 0.5 ? "multiply" : "divide";
  }

  function questionKey(question) {
    return `${question.operation}:${question.left}:${question.right}`;
  }

  function makeQuestion(table, factor, operation, rng) {
    const resolved = pickTimesOperation(normalizeOperation(operation), rng || Math.random);
    if (resolved === "divide") {
      return {
        left: table * factor,
        right: table,
        answer: factor,
        operation: "divide",
        symbol: "÷",
        prompt: `${table * factor} ÷ ${table}`,
        fact: `${table} × ${factor}`,
      };
    }

    return {
      left: table,
      right: factor,
      answer: table * factor,
      operation: "multiply",
      symbol: "×",
      prompt: `${table} × ${factor}`,
      fact: `${table} × ${factor}`,
    };
  }

  function allPairs(tables) {
    const selected = uniqueSortedNumbers(tables);
    const pairs = [];
    selected.forEach((table) => {
      FACTORS.forEach((factor) => {
        pairs.push({ table, factor });
      });
    });
    return pairs;
  }

  function shuffle(items, rng) {
    const next = items.slice();
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(rng() * (index + 1));
      const current = next[index];
      next[index] = next[swapWith];
      next[swapWith] = current;
    }
    return next;
  }

  function makeArithmeticQuestion(operation, difficulty, rng) {
    const random = rng || Math.random;
    if (operation === "subtract") {
      const pair = generateSubtractPair(difficulty, random);
      return makeSubtractQuestion(pair.left, pair.right);
    }
    const pair = generateAddPair(difficulty, random);
    return makeAddQuestion(pair.left, pair.right);
  }

  function pickMixOperation(rng) {
    return MIX_OPERATIONS[Math.floor(rng() * MIX_OPERATIONS.length)];
  }

  function makeTopicQuestion(settings, rng) {
    const topic = normalizeTopic(settings.topic);
    if (topic === "add") {
      return makeArithmeticQuestion("add", settings.difficulty, rng);
    }
    if (topic === "subtract") {
      return makeArithmeticQuestion("subtract", settings.difficulty, rng);
    }
    if (topic === "mix") {
      const mixed = pickMixOperation(rng);
      if (mixed === "add" || mixed === "subtract") {
        return makeArithmeticQuestion(mixed, settings.difficulty, rng);
      }
      const pairs = allPairs(settings.tables);
      const pair = pairs.length ? pickItem(pairs, rng) : { table: 2, factor: 2 };
      return makeQuestion(pair.table, pair.factor, mixed, rng);
    }
    const pairs = allPairs(settings.tables);
    const pair = pairs.length ? pickItem(pairs, rng) : { table: 2, factor: 2 };
    return makeQuestion(pair.table, pair.factor, settings.operation, rng);
  }

    function fillDeck(makeNext, count) {
    const deck = [];
    let lastKey = "";
    let skips = 0;
    while (deck.length < count) {
      const question = makeNext();
      if (questionKey(question) === lastKey && skips < 4) {
        skips += 1;
        continue;
      }
      skips = 0;
      deck.push(question);
      lastKey = questionKey(question);
    }
    return deck;
  }

  function buildTimesRound(normalized, rng) {
    const pairs = allPairs(normalized.tables);
    if (!pairs.length) {
      throw new Error("Choose at least one times table.");
    }

    const count = normalized.timerSeconds > 0 ? pairs.length : normalized.questionCount;
    const deck = [];
    let pool = [];
    let lastKey = "";

    while (deck.length < count) {
      if (!pool.length) {
        pool = shuffle(pairs, rng);
      }
      const next = pool.shift();
      const question = makeQuestion(next.table, next.factor, normalized.operation, rng);
      if (questionKey(question) === lastKey && pool.length > 0) {
        pool.push(next);
        continue;
      }
      deck.push(question);
      lastKey = questionKey(question);
    }

    return {
      settings: normalized,
      questions: deck,
    };
  }

  function buildArithmeticRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    const operation = normalized.topic === "subtract" ? "subtract" : "add";
    return {
      settings: normalized,
      questions: fillDeck(
        () => makeArithmeticQuestion(operation, normalized.difficulty, rng),
        count,
      ),
    };
  }

  function buildMixRound(normalized, rng) {
    const pairs = allPairs(normalized.tables);
    if (!pairs.length) {
      throw new Error("Choose at least one times table.");
    }
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    return {
      settings: normalized,
      questions: fillDeck(() => makeTopicQuestion(normalized, rng), count),
    };
  }

  function buildRound(settings, rng) {
    const normalized = normalizeSettings(settings);
    const random = rng || Math.random;
    if (normalized.topic === "add" || normalized.topic === "subtract") {
      return buildArithmeticRound(normalized, random);
    }
    if (normalized.topic === "mix") {
      return buildMixRound(normalized, random);
    }
    return buildTimesRound(normalized, random);
  }

  function buildReplayRound(questions, settings, rng) {
    const normalized = normalizeSettings(settings);
    const random = rng || Math.random;
    const source = (questions || []).filter((question) => question && question.prompt);
    if (!source.length) {
      return buildRound(normalized, random);
    }
    const count = normalized.timerSeconds > 0 ? source.length : normalized.questionCount;
    let pool = [];
    const deck = fillDeck(() => {
      if (!pool.length) {
        pool = shuffle(source, random);
      }
      return pool.shift();
    }, count);
    return {
      settings: normalized,
      questions: deck,
    };
  }

  function nextQuestion(round, asked) {
    if (!round.questions.length) {
      return null;
    }
    return round.questions[asked % round.questions.length];
  }

  function parseAnswer(raw) {
    const text = String(raw ?? "").trim();
    if (!text.length || !/^\d+$/.test(text)) {
      return null;
    }
    return Number.parseInt(text, 10);
  }

  function gradeAnswer(question, raw) {
    const given = parseAnswer(raw);
    if (given === null) {
      return { ok: false, empty: true, given: null };
    }
    return { ok: given === question.answer, empty: false, given };
  }

  function summarize(results) {
    const asked = results.length;
    const correct = results.filter((result) => result.ok).length;
    const missed = results
      .filter((result) => !result.ok)
      .map((result) => ({
        prompt: result.question.prompt,
        answer: result.question.answer,
        given: result.given,
        fact: result.question.fact,
      }));
    const accuracy = asked ? Math.round((correct / asked) * 100) : 0;

    return { asked, correct, missed, accuracy };
  }

  function headlineFor(summary) {
    if (!summary.asked) {
      return "No answers yet";
    }
    if (summary.accuracy === 100) {
      return "Perfect!";
    }
    if (summary.accuracy >= 80) {
      return "Strong work";
    }
    if (summary.accuracy >= 50) {
      return "Keep going";
    }
    return "Practice those facts again";
  }

  function formatClock(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
    const seconds = String(safe % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function subtitleFor(settings) {
    const normalized = normalizeSettings(settings);
    if (normalized.topic === "add") {
      return "Addition practice";
    }
    if (normalized.topic === "subtract") {
      return "Subtraction practice";
    }
    if (normalized.topic === "mix") {
      return "A mix of + − × ÷";
    }
    if (normalized.operation === "divide") {
      return "Division practice";
    }
    if (normalized.operation === "mix") {
      return "Times tables practice";
    }
    return "Multiplication practice";
  }

  function markFor(settings) {
    const normalized = normalizeSettings(settings);
    if (normalized.topic === "add") {
      return "+";
    }
    if (normalized.topic === "subtract") {
      return "−";
    }
    if (normalized.topic === "mix") {
      return "+×";
    }
    return "×÷";
  }

  function usesWorkspace(settings) {
    const topic = normalizeSettings(settings).topic;
    return topic === "add" || topic === "subtract" || topic === "mix";
  }

  return {
    TABLES,
    FACTORS,
    OPERATIONS,
    TOPICS,
    DIFFICULTIES,
    DEFAULT_SETTINGS,
    normalizeSettings,
    makeQuestion,
    makeAddQuestion,
    makeSubtractQuestion,
    makeArithmeticQuestion,
    buildRound,
    buildReplayRound,
    nextQuestion,
    gradeAnswer,
    summarize,
    headlineFor,
    formatClock,
    questionKey,
    subtitleFor,
    markFor,
    usesWorkspace,
  };
});
