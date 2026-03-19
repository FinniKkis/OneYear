const INTRO_DURATION_MS = 4500;
const SPAWN_EVERY_MS = 120;
const MAX_DROPS = 40;

// Укажи сюда свои картинки (положи файлы в папку assets/photos/)
// Пример: assets/photos/01.jpg, assets/photos/02.jpg ...
const PHOTO_PATHS = [
  "assets/photos/20250814-IMG_9810.jpg",
  "assets/photos/IMG_20250831_210831_234.jpg",
  "assets/photos/IMG_20250905_210019_286.jpg",
  "assets/photos/IMG_8935.JPG",
  "assets/photos/20251212_185135.jpg",
  "assets/photos/20251212_182139.jpg"
];

const INTRO_TEXT = "Яратам";

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function createDrop({ container, width, height, kind }) {
  const el = document.createElement("div");
  el.className = kind === "photo" ? "drop drop--photo" : "drop drop--text";
  el.setAttribute("aria-hidden", "true");

  if (kind === "photo") {
    const img = document.createElement("img");
    img.className = "drop__photo";
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.src = pick(PHOTO_PATHS);
    el.append(img);
  } else {
    el.textContent = INTRO_TEXT;
  }

  const startX = Math.random() * width;
  const drift = (Math.random() * 2 - 1) * (kind === "photo" ? 90 : 140);
  const rotate = (Math.random() * 2 - 1) * (kind === "photo" ? 22 : 8);
  const speed = (kind === "photo" ? 540 : 620) + Math.random() * 560; // px/s
  const startY = -80 - Math.random() * 280;

  const start = performance.now();

  function frame(now) {
    const t = (now - start) / 1000;
    const y = startY + t * speed;
    const x = startX + drift * t;

    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) rotate(${rotate}deg)`;

    if (y < height + 120) {
      requestAnimationFrame(frame);
    } else {
      el.remove();
    }
  }

  container.appendChild(el);
  requestAnimationFrame(frame);
}

function runIntro() {
  const intro = document.getElementById("intro");
  const rain = document.getElementById("rain");
  const main = document.getElementById("main");

  if (!intro || !rain || !main) return;

  if (prefersReducedMotion()) {
    document.body.style.background = "#F7B7A2";
    intro.classList.add("is-hidden");
    intro.setAttribute("aria-hidden", "true");
    main.classList.add("is-visible");
    main.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    return;
  }

  const rect = () => intro.getBoundingClientRect();
  let spawned = 0;

  const spawnTimer = window.setInterval(() => {
    const { width, height } = rect();
    if (spawned >= MAX_DROPS) return;
    spawned += 1;
    const kind = Math.random() < 0.62 ? "text" : "photo";
    createDrop({ container: rain, width, height, kind });
  }, SPAWN_EVERY_MS);

  window.setTimeout(() => {
    window.clearInterval(spawnTimer);

    // Плавный переход к главному экрану
    document.body.style.transition = "background 700ms ease";
    document.body.style.background = "#F7B7A2";

    intro.classList.add("is-hidden");
    intro.setAttribute("aria-hidden", "true");

    main.classList.add("is-visible");
    main.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // подчистим оставшиеся капли, чтобы не держать DOM
    window.setTimeout(() => {
      rain.replaceChildren();
    }, 900);
  }, clamp(INTRO_DURATION_MS, 1200, 12000));
}

window.addEventListener("load", runIntro);

const SCREEN_IDS = ["hero", "quest", "quest2", "break", "quest3", "quest4", "quest5", "prize"];

function goToScreen(id, { instant = false } = {}) {
  const stack = document.getElementById("stack");
  if (!stack) return;
  const idx = SCREEN_IDS.indexOf(id);
  if (idx === -1) return;

  if (instant) stack.classList.add("is-instant");
  stack.style.transform = `translateY(${-idx * 100}vh)`;
  if (instant) requestAnimationFrame(() => stack.classList.remove("is-instant"));
}

function lockScroll() {
  const prevent = (ev) => {
    // разрешаем прокрутку внутри элементов, где она нужна (пока таких нет)
    ev.preventDefault();
  };

  window.addEventListener("wheel", prevent, { passive: false });
  window.addEventListener("touchmove", prevent, { passive: false });
  window.addEventListener(
    "keydown",
    (ev) => {
      const blockKeys = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ];
      if (!blockKeys.includes(ev.key)) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea";
      if (isTyping) return;
      ev.preventDefault();
    },
    { passive: false },
  );
}

window.addEventListener("load", lockScroll);

document.addEventListener("click", (e) => {
  const btn = e.target?.closest?.(".hero__cta");
  if (!btn) return;
  goToScreen("quest");
});

function openModal(modal) {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

function spawnGreenConfetti({ container, fromEl, bursts = 90 }) {
  if (!container || !fromEl || prefersReducedMotion()) return Promise.resolve();

  const cRect = container.getBoundingClientRect();
  const fromRect = fromEl.getBoundingClientRect();
  const originX = fromRect.left - cRect.left + fromRect.width / 2;
  const originY = fromRect.top - cRect.top + fromRect.height - 18;

  const maxMs = 1700;

  for (let i = 0; i < bursts; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti";

    const dx = (Math.random() * 2 - 1) * 220;
    const dy = -(220 + Math.random() * 260);
    const dur = 1050 + Math.random() * 520;
    const delay = Math.random() * 180;

    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.setProperty("--dx", `${dx}px`);
    piece.style.setProperty("--dy", `${dy}px`);
    piece.style.setProperty("--dur", `${dur}ms`);
    piece.style.animationDelay = `${delay}ms`;
    piece.style.opacity = `${0.65 + Math.random() * 0.35}`;
    piece.style.background = `rgba(${35 + Math.random() * 45}, ${170 + Math.random() * 75}, ${
      70 + Math.random() * 60
    }, 0.95)`;

    container.appendChild(piece);
    window.setTimeout(() => piece.remove(), Math.min(maxMs, dur + delay + 80));
  }

  return new Promise((resolve) => {
    window.setTimeout(resolve, maxMs);
  });
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .replace(",", ".")
    .replace(/\s+/g, "");
}

function initTask1() {
  const section = document.getElementById("quest");
  const card = document.getElementById("task1Card");
  const form = document.getElementById("task1Form");
  const input = document.getElementById("task1Answer");
  const confetti = document.getElementById("confetti");

  if (!section || !card || !form || !input || !confetti) return;

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();

    const answer = normalizeAnswer(input.value);
    const asNumber = parseFloat(answer);
    const isCorrect =
      (answer === "7.19" || answer === "07.19") &&
      !Number.isNaN(asNumber) &&
      Math.abs(asNumber - 7.19) < 1e-6;

    card.classList.remove("is-wrong");

    if (!isCorrect) {
      // мигнуть красным
      card.classList.add("is-wrong");
      window.setTimeout(() => card.classList.remove("is-wrong"), 360);
      return;
    }

    // зелёная обводка + конфетти, затем переходим к заданию 2
    card.classList.add("is-correct");
    section.classList.add("is-success");
    spawnGreenConfetti({ container: confetti, fromEl: card, bursts: 110 });
    window.setTimeout(() => goToScreen("quest2"), 1600);
  });
}

window.addEventListener("load", initTask1);

function initTask2() {
  const section = document.getElementById("quest2");
  const card = document.getElementById("task2Card");
  const form = document.getElementById("task2Form");
  const hiddenInput = document.getElementById("task2Answer");
  const display = document.getElementById("safeDisplay");
  const keys = document.getElementById("safeKeys");
  const confetti = document.getElementById("confetti2");
  const breakBtn = document.getElementById("breakContinue");

  if (!section || !card || !form || !hiddenInput || !display || !keys || !confetti || !breakBtn) return;

  let code = "";

  function render() {
    const shown = code.padEnd(4, "•");
    display.textContent = shown;
    hiddenInput.value = code;
  }

  function pushDigit(d) {
    if (code.length >= 4) return;
    code += String(d);
    render();
  }

  function backspace() {
    code = code.slice(0, -1);
    render();
  }

  function clear() {
    code = "";
    render();
  }

  keys.addEventListener("click", (ev) => {
    const btn = ev.target?.closest?.("button");
    if (!btn) return;
    const digit = btn.dataset.key;
    const action = btn.dataset.action;
    if (digit != null) pushDigit(digit);
    if (action === "back") backspace();
    if (action === "clear") clear();
  });

  document.addEventListener("keydown", (ev) => {
    if (!section.contains(document.activeElement)) return;
    if (ev.key >= "0" && ev.key <= "9") pushDigit(ev.key);
    if (ev.key === "Backspace") backspace();
    if (ev.key === "Escape") clear();
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    card.classList.remove("is-wrong");

    const isCorrect = code === "0320";
    if (!isCorrect) {
      card.classList.add("is-wrong");
      window.setTimeout(() => card.classList.remove("is-wrong"), 360);
      return;
    }

    card.classList.add("is-correct");
    section.classList.add("is-success");
    await spawnGreenConfetti({ container: confetti, fromEl: card, bursts: 110 });

    goToScreen("break");
  });

  breakBtn.addEventListener("click", () => {
    goToScreen("quest3");
  });

  render();
}

window.addEventListener("load", initTask2);

function initTask3() {
  const container = document.getElementById("crossword");
  const list = document.getElementById("wordList");
  const section = document.getElementById("quest3");
  const confetti = document.getElementById("confetti3");
  const form = document.getElementById("task3Form");
  const input = document.getElementById("task3Answer");
  const card = document.getElementById("task3Card");
  if (!container || !list || !section || !confetti || !form || !input || !card) return;

  const size = 15;
  const grid = Array.from({ length: size }, () => Array(size).fill(null));

  const words = [
    { id: "lyubov", label: "любовь", text: "ЛЮБОВЬ", row: 1, col: 2, dir: "h" },
    { id: "otnosheniya", label: "отношения", text: "ОТНОШЕНИЯ", row: 4, col: 2, dir: "h" },
    { id: "zaichiki", label: "зайчики", text: "ЗАЙЧИКИ", row: 7, col: 4, dir: "h" },
    { id: "podsracheono", label: "просрачено", text: "ПРОСРАЧЕНО", row: 10, col: 5, dir: "h" },
    { id: "godovshina", label: "годовщина", text: "ГОДОВЩИНА", row: 14, col: 5, dir: "h" },
    { id: "svidanie", label: "свидание", text: "СВИДАНИЕ", row: 12, col: 6, dir: "h" },
    { id: "krasota", label: "красота", text: "КРАСОТА", row: 1, col: 12, dir: "v" },
    { id: "zhizn", label: "жизнь", text: "ЖИЗНЬ", row: 2, col: 14, dir: "v" },
    { id: "altynym", label: "алтыным", text: "АЛТЫНЫМ", row: 6, col: 2, dir: "v" },
    { id: "navsegda", label: "навсегда", text: "НАВСЕГДА", row: 0, col: 0, dir: "v" },
  ];

  // Расставляем буквы слов на сетке
  for (const word of words) {
    const chars = Array.from(word.text.toUpperCase());
    word.cells = [];
    chars.forEach((ch, idx) => {
      const r = word.row + (word.dir === "v" ? idx : 0);
      const c = word.col + (word.dir === "h" ? idx : 0);
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      if (grid[r][c] && grid[r][c] !== ch) return;
      grid[r][c] = ch;
      word.cells.push({ r, c });
    });
  }

  // Заполняем пустые клетки случайными буквами
  const alphabet = Array.from("АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ");

  function randomLetter() {
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  container.textContent = "";

  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const value = cell || randomLetter();
      const div = document.createElement("div");
      div.className = "crossword__cell crossword__cell--filled";
      div.dataset.r = String(r);
      div.dataset.c = String(c);
      div.textContent = value;
      container.appendChild(div);
    });
  });

  // список слов
  list.textContent = "";
  const found = new Set();

  function highlightWord(word, on) {
    word.cells.forEach(({ r, c }) => {
      const cellEl = container.querySelector(
        `.crossword__cell[data-r="${r}"][data-c="${c}"]`,
      );
      if (!cellEl) return;
      cellEl.classList.toggle("crossword__cell--found", on);
    });
  }

  function checkAllFound() {
    if (found.size !== words.length) return;
    card.classList.add("is-correct");
    section.classList.add("is-success");
    spawnGreenConfetti({ container: confetti, fromEl: card, bursts: 120 });
    window.setTimeout(() => {
      goToScreen("quest4");
    }, 1700);
  }

 

  function normalizeWord(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    card.classList.remove("is-wrong");

    const raw = normalizeWord(input.value);
    const word = words.find((w) => normalizeWord(w.label) === raw);

    if (!word || found.has(word.id)) {
      card.classList.add("is-wrong");
      window.setTimeout(() => card.classList.remove("is-wrong"), 360);
      return;
    }

    found.add(word.id);

    const item = list.querySelector(`[data-word-id="${word.id}"]`);
    if (item) item.classList.add("crossword__word--found");
    highlightWord(word, true);
    input.value = "";
    checkAllFound();
  });
}

window.addEventListener("load", initTask3);

// финальное задание: слайд-шоу
const FINAL_PHOTOS = [
  "assets/photos/q1.jpg",
  "assets/photos/q2.jpg",
  "assets/photos/q3.jpg"
];

function initTask4() {
  const img = document.getElementById("finalImage");
  const btn = document.getElementById("finalNext");
  if (!img || !btn) return;

  let index = 0;

  function showCurrent() {
    img.src = FINAL_PHOTOS[index] || "";
  }

  showCurrent();

  btn.addEventListener("click", () => {
    if (index < FINAL_PHOTOS.length - 1) {
      index += 1;
      showCurrent();
    } else {
      goToScreen("quest5");
    }
  });
}

window.addEventListener("load", initTask4);

function initPrize() {
  const btn = document.getElementById("claimPrize");
  if (!btn) return;
  btn.addEventListener("click", () => goToScreen("prize"));
}

window.addEventListener("load", initPrize);
