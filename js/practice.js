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
  const TOPICS = ["times", "add", "subtract", "mix", "shapes"];
  const DIFFICULTIES = ["2-digit", "3-digit", "thousands"];
  const MIX_OPERATIONS = ["add", "subtract", "multiply", "divide"];
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

  function normalizeShapeFocus(focus) {
    return SHAPE_FOCUSES.includes(focus) ? focus : "mix";
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

  function questionKey(question) {
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
    return topic === "add" || topic === "subtract" || topic === "mix";
  }

  return {
    TABLES,
    FACTORS,
    OPERATIONS,
    TOPICS,
    DIFFICULTIES,
    SHAPE_IDS,
    SHAPE_FOCUSES,
    DEFAULT_SETTINGS,
    normalizeSettings,
    makeQuestion,
    makeAddQuestion,
    makeSubtractQuestion,
    makeArithmeticQuestion,
    makeShapeQuestion,
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
  };
});
