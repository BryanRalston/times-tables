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
  const DEFAULT_SETTINGS = {
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    operation: "multiply",
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
      operation: normalizeOperation(source.operation),
      timerSeconds,
      questionCount,
    };
  }

  function pickOperation(operation, rng) {
    if (operation !== "mix") {
      return operation;
    }
    return rng() < 0.5 ? "multiply" : "divide";
  }

  function questionKey(question) {
    return `${question.operation}:${question.left}:${question.right}`;
  }

  function makeQuestion(table, factor, operation, rng) {
    const resolved = pickOperation(normalizeOperation(operation), rng || Math.random);
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

  function buildRound(settings, rng) {
    const normalized = normalizeSettings(settings);
    const random = rng || Math.random;
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
        pool = shuffle(pairs, random);
      }
      const next = pool.shift();
      const question = makeQuestion(next.table, next.factor, normalized.operation, random);
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

  return {
    TABLES,
    FACTORS,
    OPERATIONS,
    DEFAULT_SETTINGS,
    normalizeSettings,
    makeQuestion,
    buildRound,
    nextQuestion,
    gradeAnswer,
    summarize,
    headlineFor,
    formatClock,
    questionKey,
  };
});
