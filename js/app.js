(function () {
  const engine = window.TimesTables;
  const STORAGE_KEY = "times-tables-settings";

  const screens = {
    setup: document.getElementById("screen-setup"),
    practice: document.getElementById("screen-practice"),
    results: document.getElementById("screen-results"),
  };

  const els = {
    tableGrid: document.getElementById("table-grid"),
    start: document.getElementById("start-practice"),
    setupError: document.getElementById("setup-error"),
    prompt: document.getElementById("prompt"),
    answer: document.getElementById("answer-display"),
    feedback: document.getElementById("feedback"),
    scoreCorrect: document.getElementById("score-correct"),
    scoreAsked: document.getElementById("score-asked"),
    streak: document.getElementById("streak"),
    timer: document.getElementById("timer"),
    progress: document.getElementById("progress"),
    keypad: document.getElementById("keypad"),
    restart: document.getElementById("restart-round"),
    changeTables: document.getElementById("change-tables"),
    resultsHeadline: document.getElementById("results-headline"),
    resultsScore: document.getElementById("results-score"),
    resultsAccuracy: document.getElementById("results-accuracy"),
    resultsTime: document.getElementById("results-time"),
    missedList: document.getElementById("missed-list"),
    playAgain: document.getElementById("play-again"),
    practiceMissed: document.getElementById("practice-missed"),
    resultsChange: document.getElementById("results-change-tables"),
  };

  const state = {
    settings: engine.normalizeSettings(loadSettings()),
    round: null,
    asked: 0,
    results: [],
    buffer: "",
    locked: false,
    streak: 0,
    startedAt: 0,
    remainingMs: 0,
    timerId: null,
    advanceId: null,
  };

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, node]) => {
      node.hidden = key !== name;
    });
  }

  function selectedOperation() {
    const checked = document.querySelector('input[name="operation"]:checked');
    return checked ? checked.value : "multiply";
  }

  function selectedTimer() {
    const checked = document.querySelector('input[name="timer"]:checked');
    return checked ? Number(checked.value) : 0;
  }

  function selectedCount() {
    const checked = document.querySelector('input[name="count"]:checked');
    return checked ? Number(checked.value) : 20;
  }

  function selectedTables() {
    return Array.from(els.tableGrid.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => Number(input.value),
    );
  }

  function readSetup() {
    return engine.normalizeSettings({
      tables: selectedTables(),
      operation: selectedOperation(),
      timerSeconds: selectedTimer(),
      questionCount: selectedCount(),
    });
  }

  function setChoice(name, value) {
    const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
    if (input) {
      input.checked = true;
    }
  }

  function renderTables(tables) {
    els.tableGrid.replaceChildren();
    engine.TABLES.forEach((table) => {
      const label = document.createElement("label");
      label.className = "chip";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = String(table);
      input.checked = tables.includes(table);
      input.addEventListener("change", () => {
        els.setupError.hidden = true;
      });
      const text = document.createElement("span");
      text.textContent = String(table);
      label.append(input, text);
      els.tableGrid.append(label);
    });
  }

  function hydrateSetup(settings) {
    renderTables(settings.tables);
    setChoice("operation", settings.operation);
    setChoice("timer", settings.timerSeconds);
    setChoice("count", settings.questionCount);
    updateCountDisabled(settings.timerSeconds);
  }

  function updateCountDisabled(timerSeconds) {
    const disabled = Number(timerSeconds) > 0;
    document.querySelectorAll('input[name="count"]').forEach((input) => {
      input.disabled = disabled;
    });
    document.getElementById("count-fieldset").classList.toggle("is-disabled", disabled);
  }

  function currentQuestion() {
    return engine.nextQuestion(state.round, state.asked);
  }

  function setAnswer(value) {
    state.buffer = value;
    els.answer.textContent = value || " ";
    els.answer.classList.toggle("is-empty", !value);
  }

  function setFeedback(message, kind) {
    els.feedback.textContent = message;
    els.feedback.dataset.kind = kind || "";
  }

  function updateHud() {
    const summary = engine.summarize(state.results);
    els.scoreCorrect.textContent = String(summary.correct);
    els.scoreAsked.textContent = String(summary.asked);
    els.streak.textContent = String(state.streak);
    const timed = state.settings.timerSeconds > 0;
    els.timer.hidden = !timed;
    if (timed) {
      els.timer.textContent = engine.formatClock(Math.ceil(state.remainingMs / 1000));
    }
    if (timed) {
      els.progress.textContent = "Until the timer ends";
    } else {
      const current = state.locked ? state.asked : state.asked + 1;
      els.progress.textContent = `${Math.min(current, state.settings.questionCount)} / ${state.settings.questionCount}`;
    }
  }

  function showQuestion() {
    const question = currentQuestion();
    state.locked = false;
    setAnswer("");
    setFeedback("Type the answer", "");
    els.prompt.textContent = `${question.prompt} =`;
    els.prompt.dataset.operation = question.operation;
    screens.practice.dataset.state = "idle";
    updateHud();
  }

  function clearTimers() {
    window.clearInterval(state.timerId);
    window.clearTimeout(state.advanceId);
    state.timerId = null;
    state.advanceId = null;
  }

  function finishRound() {
    clearTimers();
    const summary = engine.summarize(state.results);
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
    els.resultsHeadline.textContent = engine.headlineFor(summary);
    els.resultsScore.textContent = `${summary.correct} / ${summary.asked}`;
    els.resultsAccuracy.textContent = summary.asked ? `${summary.accuracy}% correct` : "No answers";
    els.resultsTime.textContent = `Time ${engine.formatClock(elapsedSeconds)}`;
    els.missedList.replaceChildren();
    if (!summary.missed.length) {
      const empty = document.createElement("li");
      empty.className = "missed-empty";
      empty.textContent = "No missed facts.";
      els.missedList.append(empty);
    } else {
      summary.missed.forEach((item) => {
        const row = document.createElement("li");
        row.textContent = `${item.prompt} = ${item.answer}`;
        els.missedList.append(row);
      });
    }
    els.practiceMissed.hidden = summary.missed.length === 0;
    showScreen("results");
  }

  function startTimer() {
    state.remainingMs = state.settings.timerSeconds * 1000;
    updateHud();
    const started = Date.now();
    state.timerId = window.setInterval(() => {
      state.remainingMs = Math.max(0, state.settings.timerSeconds * 1000 - (Date.now() - started));
      updateHud();
      if (state.remainingMs <= 0) {
        finishRound();
      }
    }, 200);
  }

  function beginRound(settings) {
    clearTimers();
    state.settings = engine.normalizeSettings(settings);
    saveSettings(state.settings);
    state.round = engine.buildRound(state.settings);
    state.asked = 0;
    state.results = [];
    state.streak = 0;
    state.startedAt = Date.now();
    showScreen("practice");
    showQuestion();
    if (state.settings.timerSeconds > 0) {
      startTimer();
    }
  }

  function shouldEndAfterAnswer() {
    if (state.settings.timerSeconds > 0) {
      return state.remainingMs <= 0;
    }
    return state.results.length >= state.settings.questionCount;
  }

  function submitAnswer() {
    if (state.locked) {
      return;
    }
    const question = currentQuestion();
    const grade = engine.gradeAnswer(question, state.buffer);
    if (grade.empty) {
      setFeedback("Enter a number", "hint");
      return;
    }

    state.locked = true;
    state.results.push({ question, ok: grade.ok, given: grade.given });
    state.asked += 1;
    if (grade.ok) {
      state.streak += 1;
      setFeedback("Correct", "ok");
      screens.practice.dataset.state = "ok";
    } else {
      state.streak = 0;
      setFeedback(`Not quite — ${question.prompt} = ${question.answer}`, "bad");
      screens.practice.dataset.state = "bad";
    }
    updateHud();

    const delay = grade.ok ? 700 : 1300;
    state.advanceId = window.setTimeout(() => {
      if (shouldEndAfterAnswer()) {
        finishRound();
        return;
      }
      showQuestion();
    }, delay);
  }

  function pressKey(key) {
    if (state.locked) {
      return;
    }
    if (key === "Enter") {
      submitAnswer();
      return;
    }
    if (key === "Backspace") {
      setAnswer(state.buffer.slice(0, -1));
      return;
    }
    if (/^\d$/.test(key) && state.buffer.length < 4) {
      setAnswer(state.buffer + key);
    }
  }

  function renderKeypad() {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Backspace", "0", "Enter"];
    els.keypad.replaceChildren();
    keys.forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "key";
      button.dataset.key = key;
      if (key === "Backspace") {
        button.textContent = "⌫";
        button.setAttribute("aria-label", "Delete");
      } else if (key === "Enter") {
        button.textContent = "OK";
        button.classList.add("is-enter");
      } else {
        button.textContent = key;
      }
      button.addEventListener("click", () => pressKey(key));
      els.keypad.append(button);
    });
  }

  function startFromSetup() {
    const tables = selectedTables();
    if (!tables.length) {
      els.setupError.hidden = false;
      els.setupError.textContent = "Pick at least one table.";
      return;
    }
    els.setupError.hidden = true;
    beginRound(readSetup());
  }

  document.querySelectorAll('input[name="timer"]').forEach((input) => {
    input.addEventListener("change", () => updateCountDisabled(selectedTimer()));
  });

  document.getElementById("select-all").addEventListener("click", () => {
    renderTables(engine.TABLES.slice());
    els.setupError.hidden = true;
  });

  document.getElementById("select-none").addEventListener("click", () => {
    renderTables([]);
  });

  els.start.addEventListener("click", startFromSetup);
  els.restart.addEventListener("click", () => beginRound(state.settings));
  els.changeTables.addEventListener("click", () => {
    clearTimers();
    hydrateSetup(state.settings);
    showScreen("setup");
  });
  els.playAgain.addEventListener("click", () => beginRound(state.settings));
  els.resultsChange.addEventListener("click", () => {
    hydrateSetup(state.settings);
    showScreen("setup");
  });
  els.practiceMissed.addEventListener("click", () => {
    const missed = state.results.filter((result) => !result.ok);
    const missedTables = Array.from(
      new Set(
        missed.map((result) =>
          result.question.operation === "divide" ? result.question.right : result.question.left,
        ),
      ),
    );
    beginRound({
      ...state.settings,
      tables: missedTables.length ? missedTables : state.settings.tables,
      timerSeconds: 0,
      questionCount: Math.max(10, missed.length),
    });
  });

  document.addEventListener("keydown", (event) => {
    if (screens.practice.hidden) {
      if (event.key === "Enter" && !screens.setup.hidden) {
        startFromSetup();
      }
      return;
    }
    if (event.key === "Enter" || event.key === "Backspace" || /^\d$/.test(event.key)) {
      event.preventDefault();
      pressKey(event.key);
    }
  });

  renderKeypad();
  hydrateSetup(state.settings);
  showScreen("setup");

  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
