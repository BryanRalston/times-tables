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
  const TOPICS = ["times", "add", "subtract", "mix", "sense", "missing", "subtrahend", "factor", "onestep", "twostep", "shapes"];
  const DIFFICULTIES = ["2-digit", "3-digit", "thousands"];
  const MIX_OPERATIONS = ["add", "subtract", "multiply", "divide"];
  const ONESTEP_FORMS = ["n+a", "a+n", "n-a", "a-n", "an", "n/a", "a/n"];
  const TWOSTEP_FORMS = ["an+b", "n/a+b", "an-b", "a-bn"];
  const FIND_N_TOPICS = ["sense", "missing", "subtrahend", "factor", "onestep", "twostep"];
  const PLAYABLE_TRAIL_TOPICS = ["sense", "missing", "subtrahend", "factor"];
  const ALWAYS_SKILLS = ["times", "add", "subtract", "mix", "missing", "shapes"];
  const SKILL_COPY = {
    times: { title: "Times tables", blurb: "Multiply and divide", list: "Times tables" },
    add: { title: "Add", blurb: "Stack the numbers", list: "Add" },
    subtract: { title: "Subtract", blurb: "Take away", list: "Subtract" },
    mix: { title: "Mix", blurb: "+ − × ÷ together", list: "Mix (+ − × ÷)" },
    sense: { title: "Find n", blurb: "What's hiding?", list: "Number sense" },
    missing: { title: "Find n", blurb: "What's hiding?", list: "What's hiding?" },
    subtrahend: { title: "Find n", blurb: "What's hiding?", list: "Missing subtrahend" },
    factor: { title: "Find n", blurb: "What's hiding?", list: "Times tables facts" },
    onestep: { title: "Find n", blurb: "What number is n?", list: "What number is n?" },
    twostep: { title: "Find n", blurb: "Then do this", list: "Then do this" },
    shapes: { title: "Shapes", blurb: "Names, sides, around", list: "Shapes" },
  };
  const FLUENCY_STREAK = 8;
  const FLUENCY_MIN_ASKED = 10;
  const FLUENCY_ACCURACY = 90;
  const STRUGGLE_MIN_ASKED = 8;
  const STRUGGLE_ACCURACY = 70;
  const SHAPE_IDS = ["triangle", "square", "rectangle", "pentagon", "hexagon", "circle"];
  const SHAPE_FOCUSES = ["mix", "names", "count", "measure"];
  const SHAPE_META = {
    triangle: { sides: 3, corners: 3, label: "triangle", kid: "triangle" },
    square: { sides: 4, corners: 4, label: "square", kid: "square" },
    rectangle: { sides: 4, corners: 4, label: "rectangle", kid: "rectangle" },
    pentagon: { sides: 5, corners: 5, label: "pentagon", kid: "pentagon (5 sides)" },
    hexagon: { sides: 6, corners: 6, label: "hexagon", kid: "hexagon (6 sides)" },
    circle: { sides: 0, corners: 0, label: "circle", kid: "circle" },
    lshape: { sides: 6, corners: 6, label: "L shape", kid: "L shape" },
  };
  const SHAPE_NAME_CHOICES = [
    { value: "triangle", label: "Triangle" },
    { value: "square", label: "Square" },
    { value: "rectangle", label: "Rectangle" },
    { value: "pentagon", label: "Pentagon (5 sides)" },
    { value: "hexagon", label: "Hexagon (6 sides)" },
    { value: "circle", label: "Circle" },
  ];
  const FIGURE_FILLS = ["#d7e8ef", "#e8dfc8", "#dce8d7", "#edd9d3"];
  const DEFAULT_SETTINGS = {
    tables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
    topic: "times",
    operation: "multiply",
    difficulty: "3-digit",
    shapeFocus: "mix",
    timerSeconds: 0,
    questionCount: 20,
  };
  const PRODUCT_NAME = "n";
  const PRODUCT_BLURB = "What's hiding";
  const STARTER_COINS = 3;
  const NODE_UNLOCK_COST = 12;
  const CHAPTER_UNLOCK_COST = 12;
  const LOOK_COST = 4;
  const COIN_BASE = 3;
  const COIN_STREAK_AT = 3;
  const COIN_STREAK_BONUS = 1;
  const COIN_ROUND_CAP = 15;
  const WHY_RUN_LENGTH = 4;
  const ISOLATED_HOLD_MS = 2800;
  const LOOK_IDS = ["ink", "leaf"];
  const START_NODE_ID = "number-sense";
  const START_CHAPTER_ID = "grade-3";
  const TOPIC_TO_NODE = {
    sense: "number-sense",
    missing: "missing-addend",
    subtrahend: "missing-subtrahend",
    factor: "times-facts",
  };
  const TRAIL_CHAPTERS = [
    {
      id: "grade-3",
      title: "Grade 3",
      blurb: "What's hiding this year",
      nodes: [
        { id: "number-sense", title: "Number sense", playable: true, topic: "sense" },
        { id: "missing-addend", title: "Missing addend", playable: true, topic: "missing" },
        { id: "missing-subtrahend", title: "Missing subtrahend", playable: true, topic: "subtrahend" },
        { id: "times-facts", title: "Times tables facts", playable: true, topic: "factor" },
      ],
    },
    {
      id: "grade-4",
      title: "Grade 4",
      blurb: "Later chapter",
      nodes: [
        { id: "missing-factor", title: "Missing factor", playable: false },
        { id: "multi-digit", title: "Multi-digit + − × ÷", playable: false },
      ],
    },
    {
      id: "grade-5",
      title: "Grade 5",
      blurb: "Later chapter",
      nodes: [
        { id: "fractions", title: "Fractions", playable: false },
        { id: "decimals-percents", title: "Decimals and percents", playable: false },
      ],
    },
    {
      id: "grade-6",
      title: "Grade 6",
      blurb: "Later chapter",
      nodes: [
        { id: "negatives", title: "Negatives", playable: false },
        { id: "one-then-two", title: "One-step then two-step", playable: false },
        { id: "ratios", title: "Ratios", playable: false },
      ],
    },
    {
      id: "grade-7",
      title: "Grade 7",
      blurb: "Later chapter",
      nodes: [
        { id: "linear-graph", title: "Linear + graph", playable: false },
        { id: "systems-intro", title: "Systems intro", playable: false },
      ],
    },
    {
      id: "grade-8",
      title: "Grade 8",
      blurb: "Later chapter",
      nodes: [
        { id: "geometry-measure", title: "Geometry measure", playable: false },
        { id: "exponents-roots", title: "Exponents and roots", playable: false },
      ],
    },
    {
      id: "algebra-1",
      title: "Algebra 1",
      blurb: "Later chapter",
      nodes: [
        { id: "linear", title: "Linear", playable: false },
        { id: "systems", title: "Systems", playable: false },
        { id: "quadratics", title: "Quadratics", playable: false },
      ],
    },
    {
      id: "geometry",
      title: "Geometry",
      blurb: "Later chapter",
      nodes: [
        { id: "angle-area-perimeter", title: "Angle / area / perimeter", playable: false },
      ],
    },
    {
      id: "algebra-2",
      title: "Algebra 2 / later",
      blurb: "Later chapter",
      nodes: [
        { id: "trig-ratios", title: "Trig ratios", playable: false },
        { id: "functions", title: "Functions", playable: false },
        { id: "stats", title: "Stats", playable: false },
      ],
    },
  ];
  const GRADE3_ADVANCE_NODES = ["missing-addend", "missing-subtrahend", "times-facts"];

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

  function isWhyRunTopic(topic) {
    return PLAYABLE_TRAIL_TOPICS.includes(normalizeTopic(topic));
  }

  function whyRunLength(topic) {
    return isWhyRunTopic(topic) ? WHY_RUN_LENGTH : 0;
  }

  function whyRunReturnsToPath(topic) {
    return isWhyRunTopic(topic);
  }

  function normalizeDifficulty(difficulty) {
    return DIFFICULTIES.includes(difficulty) ? difficulty : "3-digit";
  }

  function normalizeShapeFocus(focus) {
    return SHAPE_FOCUSES.includes(focus) ? focus : "mix";
  }

  function normalizeSettings(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const tables = uniqueSortedNumbers(source.tables || DEFAULT_SETTINGS.tables);
    const timerSeconds = [0, 30, 60, 90].includes(Number(source.timerSeconds))
      ? Number(source.timerSeconds)
      : 0;
    const topic = normalizeTopic(source.topic);
    const rawCount = Number(source.questionCount);
    const questionCount = whyRunLength(topic)
      ? WHY_RUN_LENGTH
      : Number.isInteger(rawCount) && rawCount > 0
        ? Math.min(rawCount, 144)
        : 20;

    return {
      tables: tables.length ? tables : DEFAULT_SETTINGS.tables.slice(),
      topic,
      operation: normalizeOperation(source.operation),
      difficulty: normalizeDifficulty(source.difficulty),
      shapeFocus: normalizeShapeFocus(source.shapeFocus),
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

  function isFindNTopic(topic) {
    return FIND_N_TOPICS.includes(topic);
  }

  function questionKey(question) {
    if (question && question.topic === "twostep") {
      return ["twostep", question.form, question.a, question.b, question.c, question.answer].join(":");
    }
    if (question && question.topic === "onestep") {
      return ["onestep", question.form, question.left, question.right, question.answer].join(":");
    }
    if (question && (question.topic === "missing" || question.topic === "subtrahend" || question.topic === "sense" || question.topic === "factor")) {
      return [question.topic, question.operation, question.slot, question.left, question.right, question.token].join(":");
    }
    if (question && (question.topic === "shapes" || question.kind)) {
      const figure = question.figure || {};
      const lengths = (figure.sideLengths || []).join("-");
      return [
        question.kind,
        question.shape,
        question.answer,
        figure.side || "",
        figure.length || "",
        figure.width || "",
        lengths,
      ].join(":");
    }
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

  function generateMissingAddSpec(rng) {
    const hidden = randomInt(1, 9, rng);
    const maxKnown = Math.max(1, 20 - hidden);
    const known = randomInt(1, Math.min(12, maxKnown), rng);
    const hideLeft = rng() < 0.5;
    return {
      operation: "add",
      symbol: "+",
      left: hideLeft ? hidden : known,
      right: hideLeft ? known : hidden,
      result: known + hidden,
      answer: hidden,
      slot: hideLeft ? "left" : "right",
    };
  }

  function formatMissingQuestion(spec, first) {
    const token = "n";
    const leftText = spec.slot === "left" ? token : String(spec.left);
    const rightText = spec.slot === "right" ? token : String(spec.right);
    const prompt = `${leftText} + ${rightText} = ${spec.result}`;
    const leftHtml = spec.slot === "left"
      ? `<span class="blank">${token}</span>`
      : String(spec.left);
    const rightHtml = spec.slot === "right"
      ? `<span class="blank">${token}</span>`
      : String(spec.right);
    const known = spec.slot === "left" ? spec.right : spec.left;
    return {
      topic: "missing",
      operation: "add",
      symbol: "+",
      kind: "missing",
      left: spec.left,
      right: spec.right,
      result: spec.result,
      known,
      slot: spec.slot,
      token,
      tokenKind: "letter",
      answer: spec.answer,
      answerKind: "number",
      prompt,
      promptHtml: `${leftHtml} + ${rightHtml} = ${spec.result}`,
      fullPrompt: true,
      hint: first ? "n is hiding" : "What number is n?",
      fact: `${spec.left} + ${spec.right} = ${spec.result}`,
      review: `${prompt}  so  n is ${spec.answer}`,
    };
  }

  function makeMissingQuestion(settings, rng, options) {
    const random = rng || Math.random;
    const first = Boolean(options && options.first);
    const spec = first
      ? {
          operation: "add",
          symbol: "+",
          left: 8,
          right: 4,
          result: 12,
          answer: 4,
          slot: "right",
        }
      : generateMissingAddSpec(random);
    return formatMissingQuestion(spec, first);
  }

  function generateMissingSubtrahendSpec(rng) {
    const hidden = randomInt(1, 9, rng);
    const maxDiff = Math.max(1, 20 - hidden);
    const difference = randomInt(1, Math.min(12, maxDiff), rng);
    return {
      operation: "subtract",
      symbol: "−",
      left: hidden + difference,
      right: hidden,
      result: difference,
      answer: hidden,
      slot: "right",
    };
  }

  function formatMissingSubtrahendQuestion(spec, first) {
    const token = "n";
    const prompt = `${spec.left} − ${token} = ${spec.result}`;
    return {
      topic: "subtrahend",
      operation: "subtract",
      symbol: "−",
      kind: "missing",
      family: "subtrahend",
      left: spec.left,
      right: spec.right,
      result: spec.result,
      known: spec.result,
      slot: "right",
      token,
      tokenKind: "letter",
      answer: spec.answer,
      answerKind: "number",
      prompt,
      promptHtml: `${spec.left} − <span class="blank">${token}</span> = ${spec.result}`,
      fullPrompt: true,
      hint: first ? "n is hiding" : "What number is n?",
      fact: `${spec.left} − ${spec.answer} = ${spec.result}`,
      review: `${prompt}  so  n is ${spec.answer}`,
    };
  }

  function makeMissingSubtrahendQuestion(settings, rng, options) {
    const random = rng || Math.random;
    const first = Boolean(options && options.first);
    const spec = first
      ? {
          operation: "subtract",
          symbol: "−",
          left: 12,
          right: 4,
          result: 8,
          answer: 4,
          slot: "right",
        }
      : generateMissingSubtrahendSpec(random);
    return formatMissingSubtrahendQuestion(spec, first);
  }

  function generateSenseSpec(rng, options) {
    const towardTwenty = Boolean(options && options.towardTwenty);
    if (!towardTwenty) {
      const hidden = randomInt(1, 9, rng);
      return {
        known: 10 - hidden,
        hidden,
        total: 10,
      };
    }
    const hidden = randomInt(1, 9, rng);
    return {
      known: 10,
      hidden,
      total: 10 + hidden,
    };
  }

  function formatSenseQuestion(spec, first) {
    const token = "n";
    const prompt = `${spec.known} + ${token} = ${spec.total}`;
    return {
      topic: "sense",
      operation: "add",
      symbol: "+",
      kind: "missing",
      family: "sense",
      left: spec.known,
      right: spec.hidden,
      result: spec.total,
      known: spec.known,
      slot: "right",
      token,
      tokenKind: "letter",
      answer: spec.hidden,
      answerKind: "number",
      prompt,
      promptHtml: `${spec.known} + <span class="blank">${token}</span> = ${spec.total}`,
      fullPrompt: true,
      hint: first ? "n is hiding" : "What number is n?",
      fact: `${spec.known} + ${spec.hidden} = ${spec.total}`,
      review: `${prompt}  so  n is ${spec.hidden}`,
    };
  }

  function makeSenseQuestion(settings, rng, options) {
    const random = rng || Math.random;
    const first = Boolean(options && options.first);
    const spec = first
      ? { known: 6, hidden: 4, total: 10 }
      : generateSenseSpec(random, options);
    return formatSenseQuestion(spec, first);
  }

  function generateFactorSpec(rng) {
    const groups = randomInt(2, 5, rng);
    const maxHidden = groups === 2 ? 10 : groups === 3 ? 8 : groups === 4 ? 6 : 5;
    const hidden = randomInt(2, maxHidden, rng);
    return {
      groups,
      hidden,
      total: groups * hidden,
      known: (groups - 1) * hidden,
    };
  }

  function formatFactorQuestion(spec, first) {
    const token = "n";
    const prompt = `${spec.groups} × ${token} = ${spec.total}`;
    return {
      topic: "factor",
      operation: "multiply",
      symbol: "×",
      kind: "missing",
      family: "factor",
      groups: spec.groups,
      left: spec.groups,
      right: spec.hidden,
      result: spec.total,
      known: spec.known,
      slot: "right",
      token,
      tokenKind: "letter",
      answer: spec.hidden,
      answerKind: "number",
      prompt,
      promptHtml: `${spec.groups} × <span class="blank">${token}</span> = ${spec.total}`,
      fullPrompt: true,
      hint: first ? "n is hiding" : "What number is n?",
      fact: `${spec.groups} × ${spec.hidden} = ${spec.total}`,
      review: `${prompt}  so  n is ${spec.hidden}`,
    };
  }

  function makeFactorQuestion(settings, rng, options) {
    const random = rng || Math.random;
    const first = Boolean(options && options.first);
    const spec = first
      ? { groups: 2, hidden: 4, total: 8, known: 4 }
      : generateFactorSpec(random);
    return formatFactorQuestion(spec, first);
  }

  function whyModel(question) {
    if (!question) {
      return null;
    }
    if (question.topic === "sense" && question.operation === "add") {
      return {
        kind: "frame",
        family: "sense",
        known: question.known,
        hidden: question.answer,
        total: question.result,
        slot: "right",
        token: question.token || "n",
        fact: `${question.left} + ${question.right} = ${question.result}`,
      };
    }
    if (question.topic === "missing" && question.operation === "add") {
      const known = question.slot === "left" ? question.right : question.left;
      return {
        kind: "balance",
        family: "addend",
        known,
        hidden: question.answer,
        total: question.result,
        slot: question.slot,
        token: question.token || "n",
        fact: `${question.left} + ${question.right} = ${question.result}`,
      };
    }
    if (question.topic === "subtrahend" && question.operation === "subtract") {
      return {
        kind: "balance",
        family: "subtrahend",
        known: question.result,
        hidden: question.answer,
        total: question.left,
        slot: "right",
        token: question.token || "n",
        fact: `${question.left} − ${question.answer} = ${question.result}`,
      };
    }
    if (question.topic === "factor" && question.operation === "multiply") {
      return {
        kind: "groups",
        family: "factor",
        groups: question.groups,
        known: question.known,
        hidden: question.answer,
        total: question.result,
        slot: "right",
        token: question.token || "n",
        fact: `${question.groups} × ${question.answer} = ${question.result}`,
      };
    }
    return null;
  }

  function whyLeftover(model) {
    if (!model) {
      return null;
    }
    return model.total - model.known;
  }

  function whyCaption(model, phase) {
    if (!model) {
      return "";
    }
    if (phase === "reveal") {
      return model.fact;
    }
    if (phase === "lift") {
      return "What's left?";
    }
    return "";
  }

  function whyNudge(model) {
    if (!model) {
      return "";
    }
    if (model.family === "sense") {
      return "Take the ones you can see first";
    }
    if (model.family === "factor") {
      return "Leave one group";
    }
    if (model.family === "addend" || model.family === "subtrahend") {
      return "Take the same from both first";
    }
    const unexpected = model.family;
    void unexpected;
    return "Take the ones you can see first";
  }

  function whyPrompt(question, phase) {
    const model = whyModel(question);
    if (!model) {
      return {
        prompt: question && question.prompt ? question.prompt : "",
        promptHtml: question && question.promptHtml ? question.promptHtml : "",
      };
    }
    if (phase === "lift" || phase === "reveal") {
      const leftover = whyLeftover(model);
      const token = model.token;
      return {
        prompt: `${token} = ${leftover}`,
        promptHtml: `<span class="blank">${token}</span> = ${leftover}`,
      };
    }
    return {
      prompt: question.prompt,
      promptHtml: question.promptHtml || question.prompt,
    };
  }

  function whyTilt(model, given) {
    if (!model || !Number.isInteger(given)) {
      return "level";
    }
    const leftover = whyLeftover(model);
    if (given === leftover) {
      return "level";
    }
    return given > leftover ? "left" : "right";
  }

  function shouldAdvanceAfterGrade(question, grade) {
    if (!grade || grade.empty) {
      return false;
    }
    if (usesWhyModel(question) && !grade.ok) {
      return false;
    }
    return true;
  }

  function usesWhyModel(question) {
    return Boolean(whyModel(question));
  }

  function isolatedHoldMs(question) {
    return usesWhyModel(question) ? ISOLATED_HOLD_MS : 0;
  }

  function leftoverHoldPlan(question, grade) {
    if (!shouldAdvanceAfterGrade(question, grade)) {
      return {
        kind: "stay",
        holdMs: 0,
        hideKeypad: false,
        keepModel: false,
        prompt: "",
      };
    }
    if (usesWhyModel(question) && grade.ok) {
      return {
        kind: "isolated",
        holdMs: isolatedHoldMs(question),
        hideKeypad: true,
        keepModel: true,
        prompt: whyPrompt(question, "reveal").prompt,
      };
    }
    return {
      kind: "advance",
      holdMs: 0,
      hideKeypad: false,
      keepModel: false,
      prompt: "",
    };
  }

  function onestepOperation(form) {
    if (form === "n+a" || form === "a+n") {
      return "add";
    }
    if (form === "n-a" || form === "a-n") {
      return "subtract";
    }
    if (form === "an") {
      return "multiply";
    }
    return "divide";
  }

  function generateOnestepSpec(form, rng) {
    if (form === "n+a" || form === "a+n") {
      const n = randomInt(2, 18, rng);
      const a = randomInt(2, 16, rng);
      return { form, n, a, b: n + a };
    }
    if (form === "n-a") {
      const a = randomInt(2, 12, rng);
      const n = randomInt(a + 2, a + 20, rng);
      return { form, n, a, b: n - a };
    }
    if (form === "a-n") {
      const n = randomInt(2, 16, rng);
      const b = randomInt(2, 16, rng);
      return { form, n, a: n + b, b };
    }
    if (form === "an") {
      const a = randomInt(2, 12, rng);
      const n = randomInt(2, 12, rng);
      return { form, n, a, b: a * n };
    }
    if (form === "n/a") {
      const a = randomInt(2, 12, rng);
      const b = randomInt(2, 12, rng);
      return { form, n: a * b, a, b };
    }
    const n = randomInt(2, 12, rng);
    const b = randomInt(2, 9, rng);
    return { form: "a/n", n, a: n * b, b };
  }

  function formatOnestepQuestion(spec, first) {
    const form = ONESTEP_FORMS.includes(spec.form) ? spec.form : "n+a";
    const n = spec.n;
    const a = spec.a;
    const b = spec.b;
    const blank = '<span class="blank">n</span>';
    let prompt;
    let promptHtml;
    if (form === "n+a") {
      prompt = `n + ${a} = ${b}`;
      promptHtml = `${blank} + ${a} = ${b}`;
    } else if (form === "a+n") {
      prompt = `${a} + n = ${b}`;
      promptHtml = `${a} + ${blank} = ${b}`;
    } else if (form === "n-a") {
      prompt = `n − ${a} = ${b}`;
      promptHtml = `${blank} − ${a} = ${b}`;
    } else if (form === "a-n") {
      prompt = `${a} − n = ${b}`;
      promptHtml = `${a} − ${blank} = ${b}`;
    } else if (form === "an") {
      prompt = `${a}n = ${b}`;
      promptHtml = `${a}${blank} = ${b}`;
    } else if (form === "n/a") {
      prompt = `n/${a} = ${b}`;
      promptHtml = `${blank}/${a} = ${b}`;
    } else {
      prompt = `${a}/n = ${b}`;
      promptHtml = `${a}/${blank} = ${b}`;
    }
    return {
      topic: "onestep",
      operation: onestepOperation(form),
      symbol: form === "an" ? "" : form === "n/a" || form === "a/n" ? "/" : form.includes("+") ? "+" : "−",
      kind: "onestep",
      form,
      left: a,
      right: b,
      result: b,
      token: "n",
      tokenKind: "letter",
      answer: n,
      answerKind: "number",
      prompt,
      promptHtml,
      fullPrompt: true,
      hint: first ? "Find n" : "What number is n?",
      fact: prompt,
      review: `${prompt}  so  n is ${n}`,
    };
  }

  function makeOnestepQuestion(settings, rng, options) {
    const random = rng || Math.random;
    const first = Boolean(options && options.first);
    const requested = options && options.form;
    const form = first
      ? "n+a"
      : ONESTEP_FORMS.includes(requested)
        ? requested
        : pickItem(ONESTEP_FORMS, random);
    let spec;
    if (first) {
      const n = randomInt(8, 16, random);
      const a = randomInt(5, 9, random);
      spec = { form: "n+a", n, a, b: n + a };
    } else {
      spec = generateOnestepSpec(form, random);
    }
    return formatOnestepQuestion(spec, first);
  }

  function twostepOperation(form) {
    if (form === "an+b" || form === "n/a+b") {
      return "add";
    }
    return "subtract";
  }

  function generateTwostepSpec(form, rng) {
    if (form === "an+b") {
      const a = randomInt(2, 9, rng);
      const n = randomInt(2, 12, rng);
      const b = randomInt(1, 12, rng);
      return { form, n, a, b, c: a * n + b };
    }
    if (form === "n/a+b") {
      const a = randomInt(2, 9, rng);
      const q = randomInt(2, 12, rng);
      const b = randomInt(1, 12, rng);
      return { form, n: a * q, a, b, c: q + b };
    }
    if (form === "an-b") {
      const a = randomInt(2, 9, rng);
      const n = randomInt(3, 12, rng);
      const product = a * n;
      const b = randomInt(1, Math.min(12, product - 1), rng);
      return { form, n, a, b, c: product - b };
    }
    const coeff = randomInt(2, 8, rng);
    const n = randomInt(1, 8, rng);
    const c = randomInt(1, 16, rng);
    return { form: "a-bn", n, a: c + coeff * n, b: coeff, c };
  }

  function formatTwostepQuestion(spec, first) {
    const form = TWOSTEP_FORMS.includes(spec.form) ? spec.form : "an+b";
    const n = spec.n;
    const a = spec.a;
    const b = spec.b;
    const c = spec.c;
    const blank = '<span class="blank">n</span>';
    let prompt;
    let promptHtml;
    if (form === "an+b") {
      prompt = `${a}n + ${b} = ${c}`;
      promptHtml = `${a}${blank} + ${b} = ${c}`;
    } else if (form === "n/a+b") {
      prompt = `n/${a} + ${b} = ${c}`;
      promptHtml = `${blank}/${a} + ${b} = ${c}`;
    } else if (form === "an-b") {
      prompt = `${a}n − ${b} = ${c}`;
      promptHtml = `${a}${blank} − ${b} = ${c}`;
    } else {
      prompt = `${a} − ${b}n = ${c}`;
      promptHtml = `${a} − ${b}${blank} = ${c}`;
    }
    return {
      topic: "twostep",
      operation: twostepOperation(form),
      symbol: form.includes("+") ? "+" : "−",
      kind: "twostep",
      form,
      a,
      b,
      c,
      left: a,
      right: c,
      result: c,
      token: "n",
      tokenKind: "letter",
      answer: n,
      answerKind: "number",
      prompt,
      promptHtml,
      fullPrompt: true,
      hint: first ? "Then do this" : "Find n",
      fact: prompt,
      review: `${prompt}  so  n is ${n}`,
    };
  }

  function makeTwostepQuestion(settings, rng, options) {
    const random = rng || Math.random;
    const first = Boolean(options && options.first);
    const requested = options && options.form;
    const form = first
      ? "an+b"
      : TWOSTEP_FORMS.includes(requested)
        ? requested
        : pickItem(TWOSTEP_FORMS, random);
    let spec;
    if (first) {
      const n = randomInt(3, 8, random);
      const a = randomInt(2, 4, random);
      const b = randomInt(2, 6, random);
      spec = { form: "an+b", n, a, b, c: a * n + b };
    } else {
      spec = generateTwostepSpec(form, random);
    }
    return formatTwostepQuestion(spec, first);
  }

  function pickShapeKind(focus, rng) {
    const resolved = normalizeShapeFocus(focus);
    if (resolved === "names") {
      return "name";
    }
    if (resolved === "count") {
      return rng() < 0.5 ? "sides" : "corners";
    }
    if (resolved === "measure") {
      return rng() < 0.58 ? "perimeter" : "area";
    }
    const roll = rng();
    if (roll < 0.22) {
      return "name";
    }
    if (roll < 0.4) {
      return "sides";
    }
    if (roll < 0.55) {
      return "corners";
    }
    if (roll < 0.8) {
      return "perimeter";
    }
    return "area";
  }

  function pickShapeForKind(kind, rng) {
    if (kind === "area") {
      return rng() < 0.42 ? "square" : "rectangle";
    }
    if (kind === "perimeter") {
      const roll = rng();
      if (roll < 0.16) {
        return "lshape";
      }
      if (roll < 0.36) {
        return "triangle";
      }
      if (roll < 0.54) {
        return "square";
      }
      if (roll < 0.72) {
        return "rectangle";
      }
      if (roll < 0.86) {
        return "pentagon";
      }
      return "hexagon";
    }
    return pickItem(SHAPE_IDS, rng);
  }

  function randomTriangleSides(rng) {
    for (let attempt = 0; attempt < 24; attempt += 1) {
      const ab = randomInt(3, 9, rng);
      const bc = randomInt(3, 9, rng);
      const ca = randomInt(3, 9, rng);
      if (ab + bc > ca && ab + ca > bc && bc + ca > ab) {
        return [ab, bc, ca];
      }
    }
    return [5, 5, 6];
  }

  function regularPolygonPoints(sides, cx, cy, radius, rotation) {
    const points = [];
    for (let index = 0; index < sides; index += 1) {
      const angle = rotation + (index * 2 * Math.PI) / sides;
      points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    return points;
  }

  function polygonCentroid(points) {
    const total = points.reduce(
      (sum, point) => [sum[0] + point[0], sum[1] + point[1]],
      [0, 0],
    );
    return [total[0] / points.length, total[1] / points.length];
  }

  function fitPoints(points, width, height, pad) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    const boxWidth = maxX - minX || 1;
    const boxHeight = maxY - minY || 1;
    const scale = Math.min((width - pad * 2) / boxWidth, (height - pad * 2) / boxHeight);
    const offsetX = (width - boxWidth * scale) / 2 - minX * scale;
    const offsetY = (height - boxHeight * scale) / 2 - minY * scale;
    return points.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY]);
  }

  function edgeLabel(p1, p2, centroid, distance) {
    const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    let nx = p2[1] - p1[1];
    let ny = p1[0] - p2[0];
    const length = Math.hypot(nx, ny) || 1;
    nx /= length;
    ny /= length;
    const outward = [mid[0] + nx * distance, mid[1] + ny * distance];
    const inward = [mid[0] - nx * distance, mid[1] - ny * distance];
    const outDist = Math.hypot(outward[0] - centroid[0], outward[1] - centroid[1]);
    const inDist = Math.hypot(inward[0] - centroid[0], inward[1] - centroid[1]);
    return outDist >= inDist ? outward : inward;
  }

  function labelsForPolygon(points, sideLengths) {
    const centroid = polygonCentroid(points);
    return points.map((point, index) => {
      const next = points[(index + 1) % points.length];
      const [x, y] = edgeLabel(point, next, centroid, 18);
      return { x, y, text: String(sideLengths[index]) };
    });
  }

  function triangleUnitPoints(sideAB, sideBC, sideCA) {
    const x = (sideAB * sideAB + sideCA * sideCA - sideBC * sideBC) / (2 * sideAB);
    const y = Math.sqrt(Math.max(0, sideCA * sideCA - x * x));
    return [
      [0, 0],
      [sideAB, 0],
      [x, y],
    ];
  }

  function makeRectFigure(length, width, showGrid, showLabels, fill, stroke) {
    const maxCells = Math.max(length, width);
    const cell = showGrid ? Math.min(26, Math.floor(150 / maxCells)) : 0;
    let boxWidth;
    let boxHeight;
    if (showGrid) {
      boxWidth = length * cell;
      boxHeight = width * cell;
    } else if (length === width) {
      boxWidth = 128;
      boxHeight = 128;
    } else {
      boxWidth = 168;
      boxHeight = 96;
    }
    const x = (280 - boxWidth) / 2;
    const y = (220 - boxHeight) / 2;
    const labels = [];
    if (showLabels) {
      labels.push({ x: x + boxWidth / 2, y: y - 16, text: String(length) });
      labels.push({ x: x + boxWidth / 2, y: y + boxHeight + 18, text: String(length) });
      labels.push({ x: x - 16, y: y + boxHeight / 2, text: String(width) });
      labels.push({ x: x + boxWidth + 16, y: y + boxHeight / 2, text: String(width) });
    }
    return {
      type: "rect",
      x,
      y,
      boxWidth,
      boxHeight,
      length,
      width,
      side: length === width ? length : undefined,
      cols: length,
      rows: width,
      cell: showGrid ? cell : 0,
      showGrid,
      fill,
      stroke,
      labels,
      sideLengths: [length, width, length, width],
    };
  }

  function makeShapeFigure(shape, kind, rng) {
    const fill = pickItem(FIGURE_FILLS, rng);
    const stroke = "#243038";
    const showLabels = kind === "perimeter" || kind === "area";
    const showGrid = kind === "area";

    if (shape === "circle") {
      return {
        type: "circle",
        cx: 140,
        cy: 110,
        r: 72,
        fill,
        stroke,
        labels: [],
        sideLengths: [],
      };
    }

    if (shape === "square") {
      const side = showGrid ? randomInt(2, 6, rng) : randomInt(2, 9, rng);
      return makeRectFigure(side, side, showGrid, showLabels, fill, stroke);
    }

    if (shape === "rectangle") {
      let length = showGrid ? randomInt(3, 6, rng) : randomInt(4, 9, rng);
      let width = showGrid ? randomInt(2, 5, rng) : randomInt(2, 7, rng);
      if (length === width) {
        length += 1;
      }
      if (width > length) {
        const swap = length;
        length = width;
        width = swap;
      }
      return makeRectFigure(length, width, showGrid, showLabels, fill, stroke);
    }

    if (shape === "triangle") {
      const [ab, bc, ca] = randomTriangleSides(rng);
      const fitted = fitPoints(triangleUnitPoints(ab, bc, ca), 280, 220, 36);
      return {
        type: "polygon",
        points: fitted,
        fill,
        stroke,
        labels: showLabels ? labelsForPolygon(fitted, [ab, bc, ca]) : [],
        sideLengths: [ab, bc, ca],
      };
    }

    if (shape === "pentagon" || shape === "hexagon") {
      const n = shape === "pentagon" ? 5 : 6;
      const side = randomInt(2, 8, rng);
      const points = regularPolygonPoints(n, 140, 110, 78, -Math.PI / 2);
      const sideLengths = Array.from({ length: n }, () => side);
      return {
        type: "polygon",
        points,
        side,
        fill,
        stroke,
        labels: showLabels ? labelsForPolygon(points, sideLengths) : [],
        sideLengths,
      };
    }

    const wide = randomInt(6, 10, rng);
    const tall = randomInt(6, 10, rng);
    const cutW = randomInt(2, Math.max(2, wide - 3), rng);
    const cutH = randomInt(2, Math.max(2, tall - 3), rng);
    const stem = wide - cutW;
    const topBar = tall - cutH;
    const unitPoints = [
      [0, 0],
      [wide, 0],
      [wide, topBar],
      [stem, topBar],
      [stem, tall],
      [0, tall],
    ];
    const sideLengths = [wide, topBar, cutW, cutH, stem, tall];
    const points = fitPoints(unitPoints, 280, 220, 36);
    return {
      type: "polygon",
      points,
      fill,
      stroke,
      labels: labelsForPolygon(points, sideLengths),
      sideLengths,
      wide,
      tall,
    };
  }

  function figureSvg(figure) {
    const parts = [];
    if (figure.type === "circle") {
      parts.push(
        `<circle cx="${figure.cx}" cy="${figure.cy}" r="${figure.r}" fill="${figure.fill}" stroke="${figure.stroke}" stroke-width="4" />`,
      );
    } else if (figure.type === "rect") {
      if (figure.showGrid && figure.cell) {
        for (let row = 0; row < figure.rows; row += 1) {
          for (let col = 0; col < figure.cols; col += 1) {
            const x = figure.x + col * figure.cell;
            const y = figure.y + row * figure.cell;
            parts.push(
              `<rect x="${x}" y="${y}" width="${figure.cell}" height="${figure.cell}" fill="${figure.fill}" stroke="${figure.stroke}" stroke-width="1.5" />`,
            );
          }
        }
      } else {
        parts.push(
          `<rect x="${figure.x}" y="${figure.y}" width="${figure.boxWidth}" height="${figure.boxHeight}" fill="${figure.fill}" stroke="${figure.stroke}" stroke-width="4" rx="4" />`,
        );
      }
    } else if (figure.type === "polygon") {
      const points = figure.points.map((point) => point.join(",")).join(" ");
      parts.push(
        `<polygon points="${points}" fill="${figure.fill}" stroke="${figure.stroke}" stroke-width="4" stroke-linejoin="round" />`,
      );
    }
    (figure.labels || []).forEach((label) => {
      parts.push(
        `<text x="${label.x}" y="${label.y}" text-anchor="middle" dominant-baseline="middle" class="shape-label">${label.text}</text>`,
      );
    });
    return `<svg class="shape-svg" viewBox="0 0 280 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join("")}</svg>`;
  }

  function sumSides(figure) {
    return (figure.sideLengths || []).reduce((total, value) => total + value, 0);
  }

  function shapeReview(kind, shape, figure, answer) {
    const meta = SHAPE_META[shape] || SHAPE_META.triangle;
    if (kind === "name") {
      return `This is a ${meta.kid}.`;
    }
    if (kind === "sides") {
      if (shape === "circle") {
        return "A circle has 0 straight sides.";
      }
      return `A ${meta.label} has ${meta.sides} sides.`;
    }
    if (kind === "corners") {
      if (shape === "circle") {
        return "A circle has 0 corners.";
      }
      return `A ${meta.label} has ${meta.corners} corners.`;
    }
    if (kind === "area") {
      const length = figure.length || figure.side;
      const width = figure.width || figure.side;
      return `${length} × ${width} = ${answer}`;
    }
    return `${(figure.sideLengths || []).join(" + ")} = ${answer}`;
  }

  function makeShapeQuestion(settings, rng) {
    const random = rng || Math.random;
    const focus = normalizeShapeFocus(settings && settings.shapeFocus);
    const kind = pickShapeKind(focus, random);
    const shape = pickShapeForKind(kind, random);
    const figure = makeShapeFigure(shape, kind, random);
    const meta = SHAPE_META[shape] || SHAPE_META.triangle;
    const base = {
      topic: "shapes",
      operation: "shape",
      kind,
      shape,
      figure,
      figureSvg: figureSvg(figure),
      left: 0,
      right: 0,
    };

    if (kind === "name") {
      return {
        ...base,
        prompt: "What shape is this?",
        hint: "Tap the name",
        answer: meta.label,
        answerKind: "choice",
        choices: SHAPE_NAME_CHOICES,
        fact: meta.kid,
        review: shapeReview(kind, shape, figure, meta.label),
      };
    }

    if (kind === "sides") {
      return {
        ...base,
        prompt: "How many straight sides?",
        hint: "Count the sides",
        answer: meta.sides,
        answerKind: "number",
        fact: `${meta.label} sides`,
        review: shapeReview(kind, shape, figure, meta.sides),
      };
    }

    if (kind === "corners") {
      return {
        ...base,
        prompt: "How many corners?",
        hint: "Count the corners",
        answer: meta.corners,
        answerKind: "number",
        fact: `${meta.label} corners`,
        review: shapeReview(kind, shape, figure, meta.corners),
      };
    }

    if (kind === "area") {
      const length = figure.length || figure.side;
      const width = figure.width || figure.side;
      const answer = length * width;
      return {
        ...base,
        prompt: "How many little squares fill it?",
        hint: "Count them, or multiply length × width",
        answer,
        answerKind: "number",
        fact: `${length} × ${width}`,
        review: shapeReview(kind, shape, figure, answer),
      };
    }

    const answer = sumSides(figure);
    const aroundHint = shape === "lshape"
      ? "Add every outside side"
      : "Add the side lengths. That is the distance around (perimeter).";
    return {
      ...base,
      prompt: "How far around?",
      hint: aroundHint,
      answer,
      answerKind: "number",
      fact: `around ${answer}`,
      review: shapeReview(kind, shape, figure, answer),
    };
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

  function buildShapesRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    return {
      settings: normalized,
      questions: fillDeck(() => makeShapeQuestion(normalized, rng), count),
    };
  }

  function buildMissingRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    let made = 0;
    return {
      settings: normalized,
      questions: fillDeck(() => {
        const first = made === 0;
        made += 1;
        return makeMissingQuestion(normalized, rng, { first });
      }, count),
    };
  }

  function buildSubtrahendRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    let made = 0;
    return {
      settings: normalized,
      questions: fillDeck(() => {
        const first = made === 0;
        made += 1;
        return makeMissingSubtrahendQuestion(normalized, rng, { first });
      }, count),
    };
  }

  function buildSenseRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    let made = 0;
    return {
      settings: normalized,
      questions: fillDeck(() => {
        const first = made === 0;
        const towardTwenty = !first && made >= count - 1;
        made += 1;
        return makeSenseQuestion(normalized, rng, { first, towardTwenty });
      }, count),
    };
  }

  function buildFactorRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    let made = 0;
    return {
      settings: normalized,
      questions: fillDeck(() => {
        const first = made === 0;
        made += 1;
        return makeFactorQuestion(normalized, rng, { first });
      }, count),
    };
  }

  function buildOnestepRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    let forms = [];
    let made = 0;
    return {
      settings: normalized,
      questions: fillDeck(() => {
        const first = made === 0;
        if (!forms.length) {
          forms = shuffle(ONESTEP_FORMS.slice(), rng);
        }
        const form = first ? "n+a" : forms.shift();
        made += 1;
        return makeOnestepQuestion(normalized, rng, { first, form });
      }, count),
    };
  }

  function buildTwostepRound(normalized, rng) {
    const count = normalized.timerSeconds > 0 ? 80 : normalized.questionCount;
    let forms = [];
    let made = 0;
    return {
      settings: normalized,
      questions: fillDeck(() => {
        const first = made === 0;
        if (!forms.length) {
          forms = shuffle(TWOSTEP_FORMS.slice(), rng);
        }
        const form = first ? "an+b" : forms.shift();
        made += 1;
        return makeTwostepQuestion(normalized, rng, { first, form });
      }, count),
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
    if (normalized.topic === "shapes") {
      return buildShapesRound(normalized, random);
    }
    if (normalized.topic === "missing") {
      return buildMissingRound(normalized, random);
    }
    if (normalized.topic === "subtrahend") {
      return buildSubtrahendRound(normalized, random);
    }
    if (normalized.topic === "sense") {
      return buildSenseRound(normalized, random);
    }
    if (normalized.topic === "factor") {
      return buildFactorRound(normalized, random);
    }
    if (normalized.topic === "onestep") {
      return buildOnestepRound(normalized, random);
    }
    if (normalized.topic === "twostep") {
      return buildTwostepRound(normalized, random);
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
    if (question && question.answerKind === "choice") {
      const text = String(raw ?? "").trim().toLowerCase();
      if (!text) {
        return { ok: false, empty: true, given: null };
      }
      return {
        ok: text === String(question.answer).toLowerCase(),
        empty: false,
        given: text,
      };
    }
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
        review: result.question.review,
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
    if (
      normalized.topic === "missing"
      || normalized.topic === "subtrahend"
      || normalized.topic === "sense"
      || normalized.topic === "factor"
    ) {
      return "What's hiding?";
    }
    if (normalized.topic === "onestep") {
      return "What number is n?";
    }
    if (normalized.topic === "twostep") {
      return "Then do this";
    }
    if (normalized.topic === "shapes") {
      return "Shapes practice";
    }
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
    if (isFindNTopic(normalized.topic)) {
      return "n";
    }
    if (normalized.topic === "shapes") {
      return "△□";
    }
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
    return topic === "add" || topic === "subtract" || topic === "mix" || topic === "onestep" || topic === "twostep";
  }

  function emptyProgress() {
    return {
      unlocked: [],
      fluency: {},
      lastStruggled: null,
      recommended: "missing",
      coins: STARTER_COINS,
      grantedStarter: true,
      unlockedNodes: [],
      openedChapters: [START_CHAPTER_ID],
      completedNodes: [],
      look: "ink",
      boughtLooks: ["ink"],
    };
  }

  function normalizeProgress(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const fluency = {};
    const incoming = source.fluency && typeof source.fluency === "object" ? source.fluency : {};
    TOPICS.forEach((skill) => {
      const rec = incoming[skill] && typeof incoming[skill] === "object" ? incoming[skill] : {};
      fluency[skill] = {
        strongRounds: Math.max(0, Number(rec.strongRounds) || 0),
        bestStreak: Math.max(0, Number(rec.bestStreak) || 0),
        lastAccuracy: Math.max(0, Number(rec.lastAccuracy) || 0),
        lastAsked: Math.max(0, Number(rec.lastAsked) || 0),
      };
    });
    const unlocked = Array.from(
      new Set(
        (Array.isArray(source.unlocked) ? source.unlocked : [])
          .map((skill) => normalizeTopic(skill))
          .filter((skill) => skill === "onestep" || skill === "twostep"),
      ),
    );
    const lastStruggled = TOPICS.includes(source.lastStruggled) ? source.lastStruggled : null;
    const knownNodeIds = trailNodeIds();
    const knownChapterIds = TRAIL_CHAPTERS.map((chapter) => chapter.id);
    const hasWallet = Object.prototype.hasOwnProperty.call(source, "coins") || source.grantedStarter;
    const coins = Math.max(0, Math.floor(Number(hasWallet ? source.coins : STARTER_COINS) || 0));
    const unlockedNodes = uniqueIds(source.unlockedNodes, knownNodeIds);
    const openedChapters = uniqueIds(
      Array.isArray(source.openedChapters) && source.openedChapters.length
        ? source.openedChapters
        : [START_CHAPTER_ID],
      knownChapterIds,
    );
    if (!openedChapters.includes(START_CHAPTER_ID)) {
      openedChapters.unshift(START_CHAPTER_ID);
    }
    const completedNodes = uniqueIds(source.completedNodes, knownNodeIds);
    GRADE3_ADVANCE_NODES.forEach((id, index) => {
      if (unlockedNodes.includes(id)) {
        return;
      }
      const laterPurchased = GRADE3_ADVANCE_NODES.slice(index + 1).some((later) => (
        unlockedNodes.includes(later)
      ));
      if (laterPurchased) {
        unlockedNodes.push(id);
      }
    });
    const look = LOOK_IDS.includes(source.look) ? source.look : "ink";
    const boughtLooks = uniqueIds(source.boughtLooks, LOOK_IDS);
    if (!boughtLooks.includes("ink")) {
      boughtLooks.unshift("ink");
    }
    if (!boughtLooks.includes(look)) {
      boughtLooks.push(look);
    }
    return {
      unlocked,
      fluency,
      lastStruggled,
      recommended: recommendedFrom(fluency, lastStruggled),
      coins,
      grantedStarter: true,
      unlockedNodes,
      openedChapters,
      completedNodes,
      look,
      boughtLooks,
    };
  }

  function uniqueIds(values, allowed) {
    const allowedSet = new Set(allowed);
    return Array.from(
      new Set((Array.isArray(values) ? values : []).filter((id) => allowedSet.has(id))),
    );
  }

  function trailChapters() {
    return TRAIL_CHAPTERS.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      blurb: chapter.blurb,
      nodes: chapter.nodes.map((node) => ({ ...node })),
    }));
  }

  function trailNodeIds() {
    return TRAIL_CHAPTERS.flatMap((chapter) => chapter.nodes.map((node) => node.id));
  }

  function findChapter(chapterId) {
    return TRAIL_CHAPTERS.find((chapter) => chapter.id === chapterId) || null;
  }

  function findNode(nodeId) {
    for (const chapter of TRAIL_CHAPTERS) {
      const node = chapter.nodes.find((item) => item.id === nodeId);
      if (node) {
        return { chapter, node };
      }
    }
    return null;
  }

  function isChapterOpen(progress, chapterId) {
    return normalizeProgress(progress).openedChapters.includes(chapterId);
  }

  function isNodePurchased(progress, nodeId) {
    if (nodeId === START_NODE_ID) {
      return true;
    }
    return normalizeProgress(progress).unlockedNodes.includes(nodeId);
  }

  function isNodeCompleted(progress, nodeId) {
    return normalizeProgress(progress).completedNodes.includes(nodeId);
  }

  function isNodePlayable(nodeId) {
    const found = findNode(nodeId);
    return Boolean(found && found.node.playable);
  }

  function nextPricedUnlock(progress) {
    const normalized = normalizeProgress(progress);
    for (const nodeId of GRADE3_ADVANCE_NODES) {
      if (!normalized.unlockedNodes.includes(nodeId)) {
        const found = findNode(nodeId);
        return {
          kind: "node",
          id: nodeId,
          chapterId: found ? found.chapter.id : START_CHAPTER_ID,
          title: found ? found.node.title : nodeId,
          cost: NODE_UNLOCK_COST,
        };
      }
    }
    return null;
  }

  function chapterStatus(progress, chapterId) {
    const chapter = findChapter(chapterId);
    if (!chapter) {
      return "closed";
    }
    if (isChapterOpen(progress, chapterId)) {
      return "open";
    }
    const next = nextPricedUnlock(progress);
    if (next && next.kind === "chapter" && next.id === chapterId) {
      return "priced";
    }
    return "closed";
  }

  function frontierPlayableNodeId(progress) {
    const normalized = normalizeProgress(progress);
    let frontier = START_NODE_ID;
    GRADE3_ADVANCE_NODES.forEach((id) => {
      if (normalized.unlockedNodes.includes(id) && isNodePlayable(id)) {
        frontier = id;
      }
    });
    return frontier;
  }

  function nodeStatus(progress, nodeId) {
    const found = findNode(nodeId);
    if (!found) {
      return "locked";
    }
    if (found.node.playable && isNodePurchased(progress, nodeId)) {
      const frontier = frontierPlayableNodeId(progress);
      if (nodeId === frontier && !isNodeCompleted(progress, nodeId)) {
        return "current";
      }
      return "replay";
    }
    if (!found.node.playable && isNodePurchased(progress, nodeId)) {
      return "coming";
    }
    const next = nextPricedUnlock(progress);
    if (next && next.kind === "node" && next.id === nodeId) {
      return "priced";
    }
    return "locked";
  }

  function canStartNode(progress, nodeId) {
    const status = nodeStatus(progress, nodeId);
    return status === "current" || status === "replay";
  }

  function playableTopic(topic) {
    return PLAYABLE_TRAIL_TOPICS.includes(topic) ? topic : "sense";
  }

  function nodeAction(status) {
    switch (status) {
      case "current":
        return "Start";
      case "replay":
        return "Replay";
      case "coming":
        return "Coming";
      case "priced":
        return "Unlock";
      case "locked":
        return "";
      default: {
        const unexpected = status;
        void unexpected;
        return "";
      }
    }
  }

  function loudPathAction(progress) {
    const normalized = normalizeProgress(progress);
    const next = nextPricedUnlock(normalized);
    const boughtAhead = GRADE3_ADVANCE_NODES.some((id) => normalized.unlockedNodes.includes(id));
    if (next && next.kind === "node" && (normalized.coins >= next.cost || boughtAhead)) {
      return { kind: "priced", id: next.id, cost: next.cost };
    }
    const currentId = trailNodeIds().find((id) => nodeStatus(normalized, id) === "current");
    if (currentId) {
      return { kind: "start", id: currentId };
    }
    return null;
  }

  function isLoudPathNode(progress, nodeId) {
    const loud = loudPathAction(progress);
    return Boolean(loud && loud.id === nodeId);
  }

  function startNode() {
    const found = findNode(START_NODE_ID);
    return found ? { ...found.node, chapterId: found.chapter.id } : null;
  }

  function payoutCoins(input) {
    const source = input && typeof input === "object" ? input : {};
    if (!source.ok) {
      return 0;
    }
    if (!source.usesWhy) {
      return 0;
    }
    if (!source.whyDone) {
      return 0;
    }
    const earned = Math.max(0, Math.floor(Number(source.earnedThisRound) || 0));
    const remaining = Math.max(0, COIN_ROUND_CAP - earned);
    if (!remaining) {
      return 0;
    }
    const streak = Math.max(0, Math.floor(Number(source.streak) || 0));
    const bonus = streak >= COIN_STREAK_AT ? COIN_STREAK_BONUS : 0;
    return Math.min(COIN_BASE + bonus, remaining);
  }

  function applyCoinPayout(progress, payout) {
    const next = normalizeProgress(progress);
    const amount = Math.max(0, Math.floor(Number(payout) || 0));
    next.coins += amount;
    return next;
  }

  function spendUnlock(progress) {
    const next = nextPricedUnlock(progress);
    const normalized = normalizeProgress(progress);
    if (!next) {
      return { ok: false, reason: "none", progress: normalized, unlocked: null };
    }
    if (normalized.coins < next.cost) {
      return { ok: false, reason: "coins", progress: normalized, unlocked: next };
    }
    normalized.coins -= next.cost;
    if (next.kind === "node") {
      if (!normalized.unlockedNodes.includes(next.id)) {
        normalized.unlockedNodes.push(next.id);
      }
    } else if (!normalized.openedChapters.includes(next.id)) {
      normalized.openedChapters.push(next.id);
    }
    return { ok: true, reason: "ok", progress: normalized, unlocked: next };
  }

  function spendLook(progress, look) {
    const normalized = normalizeProgress(progress);
    if (!LOOK_IDS.includes(look)) {
      return { ok: false, reason: "look", progress: normalized };
    }
    if (normalized.boughtLooks.includes(look)) {
      normalized.look = look;
      return { ok: true, reason: "owned", progress: normalized };
    }
    if (normalized.coins < LOOK_COST) {
      return { ok: false, reason: "coins", progress: normalized };
    }
    normalized.coins -= LOOK_COST;
    normalized.boughtLooks.push(look);
    normalized.look = look;
    return { ok: true, reason: "ok", progress: normalized };
  }

  function markNodeCompleted(progress, nodeId) {
    const next = normalizeProgress(progress);
    const found = findNode(nodeId);
    if (!found || next.completedNodes.includes(nodeId)) {
      return next;
    }
    next.completedNodes.push(nodeId);
    return next;
  }

  function recordIsFluent(rec) {
    return Boolean(rec && (rec.strongRounds >= 1 || rec.bestStreak >= FLUENCY_STREAK));
  }

  function recommendedFrom(fluency, lastStruggled) {
    if (lastStruggled && !recordIsFluent(fluency[lastStruggled])) {
      return lastStruggled;
    }
    if (!recordIsFluent(fluency.missing)) {
      return "missing";
    }
    if (!recordIsFluent(fluency.onestep)) {
      return "onestep";
    }
    return "twostep";
  }

  function isSkillFluent(progress, skill) {
    const rec = normalizeProgress(progress).fluency[normalizeTopic(skill)];
    return recordIsFluent(rec);
  }

  function isSkillUnlocked(progress, skill) {
    const id = normalizeTopic(skill);
    if (ALWAYS_SKILLS.includes(id)) {
      return true;
    }
    if (id === "onestep") {
      const normalized = normalizeProgress(progress);
      return normalized.unlocked.includes("onestep") || recordIsFluent(normalized.fluency.missing);
    }
    if (id === "twostep") {
      const normalized = normalizeProgress(progress);
      return normalized.unlocked.includes("twostep") || recordIsFluent(normalized.fluency.onestep);
    }
    return false;
  }

  function pickRecommended(progress) {
    return normalizeProgress(progress).recommended;
  }

  function applyRoundProgress(progress, skill, summary, streakPeak) {
    const next = normalizeProgress(progress);
    const id = normalizeTopic(skill);
    const asked = summary && Number.isInteger(summary.asked) ? summary.asked : 0;
    const accuracy = summary && Number.isInteger(summary.accuracy) ? summary.accuracy : 0;
    const rec = next.fluency[id] || { strongRounds: 0, bestStreak: 0, lastAccuracy: 0, lastAsked: 0 };
    rec.bestStreak = Math.max(rec.bestStreak || 0, Number(streakPeak) || 0);
    rec.lastAccuracy = accuracy;
    rec.lastAsked = asked;
    if (asked >= FLUENCY_MIN_ASKED && accuracy >= FLUENCY_ACCURACY) {
      rec.strongRounds = (rec.strongRounds || 0) + 1;
    }
    next.fluency[id] = rec;
    if (id === "missing" && recordIsFluent(rec) && !next.unlocked.includes("onestep")) {
      next.unlocked.push("onestep");
    }
    if (id === "onestep" && recordIsFluent(rec) && !next.unlocked.includes("twostep")) {
      next.unlocked.push("twostep");
    }
    if (asked >= STRUGGLE_MIN_ASKED && accuracy < STRUGGLE_ACCURACY) {
      next.lastStruggled = id;
    } else if (recordIsFluent(rec) && next.lastStruggled === id) {
      next.lastStruggled = null;
    }
    next.recommended = recommendedFrom(next.fluency, next.lastStruggled);
    const nodeId = TOPIC_TO_NODE[id];
    if (
      nodeId
      && asked > 0
      && !next.completedNodes.includes(nodeId)
      && isNodePurchased(next, nodeId)
    ) {
      next.completedNodes.push(nodeId);
    }
    return next;
  }

  function leftoverDigitCap(question) {
    if (!usesWhyModel(question)) {
      return 5;
    }
    const leftover = whyLeftover(whyModel(question));
    if (!Number.isInteger(leftover)) {
      return 1;
    }
    return Math.min(2, Math.max(1, String(Math.abs(leftover)).length));
  }

  function leftoverTypingAllowed(question, whyDone) {
    if (!usesWhyModel(question)) {
      return true;
    }
    return whyDone === true;
  }

  function appendAnswerDigit(buffer, digit, question, whyDone) {
    const next = String(digit);
    if (!/^\d$/.test(next)) {
      return String(buffer || "");
    }
    const current = String(buffer || "");
    if (!leftoverTypingAllowed(question, whyDone)) {
      return current;
    }
    if (usesWhyModel(question)) {
      const cap = leftoverDigitCap(question);
      if (current.length >= cap) {
        return next;
      }
      return current + next;
    }
    if (current.length >= 5) {
      return current;
    }
    return current + next;
  }

  function skillCopy(skill) {
    const id = normalizeTopic(skill);
    return SKILL_COPY[id] || SKILL_COPY.missing;
  }

  function otherSkills(progress, current) {
    const currentId = normalizeTopic(current);
    return TOPICS.filter((id) => id !== currentId && isSkillUnlocked(progress, id));
  }

  return {
    TABLES,
    FACTORS,
    OPERATIONS,
    TOPICS,
    DIFFICULTIES,
    ONESTEP_FORMS,
    TWOSTEP_FORMS,
    FIND_N_TOPICS,
    PLAYABLE_TRAIL_TOPICS,
    ALWAYS_SKILLS,
    SKILL_COPY,
    SHAPE_IDS,
    SHAPE_FOCUSES,
    DEFAULT_SETTINGS,
    PRODUCT_NAME,
    PRODUCT_BLURB,
    STARTER_COINS,
    NODE_UNLOCK_COST,
    CHAPTER_UNLOCK_COST,
    LOOK_COST,
    COIN_BASE,
    COIN_STREAK_AT,
    COIN_STREAK_BONUS,
    COIN_ROUND_CAP,
    WHY_RUN_LENGTH,
    ISOLATED_HOLD_MS,
    LOOK_IDS,
    START_NODE_ID,
    START_CHAPTER_ID,
    TRAIL_CHAPTERS,
    normalizeSettings,
    makeQuestion,
    makeAddQuestion,
    makeSubtractQuestion,
    makeArithmeticQuestion,
    makeShapeQuestion,
    makeMissingQuestion,
    makeMissingSubtrahendQuestion,
    makeSenseQuestion,
    makeFactorQuestion,
    makeOnestepQuestion,
    makeTwostepQuestion,
    whyModel,
    whyLeftover,
    whyCaption,
    whyNudge,
    whyPrompt,
    whyTilt,
    shouldAdvanceAfterGrade,
    usesWhyModel,
    isolatedHoldMs,
    leftoverHoldPlan,
    leftoverTypingAllowed,
    whyRunLength,
    whyRunReturnsToPath,
    figureSvg,
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
    emptyProgress,
    normalizeProgress,
    isSkillFluent,
    isSkillUnlocked,
    pickRecommended,
    applyRoundProgress,
    appendAnswerDigit,
    leftoverDigitCap,
    skillCopy,
    otherSkills,
    trailChapters,
    trailNodeIds,
    findChapter,
    findNode,
    isChapterOpen,
    isNodePurchased,
    isNodeCompleted,
    isNodePlayable,
    canStartNode,
    playableTopic,
    nextPricedUnlock,
    chapterStatus,
    nodeStatus,
    nodeAction,
    loudPathAction,
    isLoudPathNode,
    startNode,
    payoutCoins,
    applyCoinPayout,
    spendUnlock,
    spendLook,
    markNodeCompleted,
  };
});
