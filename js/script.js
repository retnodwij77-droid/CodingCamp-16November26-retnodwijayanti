/* ===========================================================
   Life Dashboard — script.js
   Vanilla JS only. All data persists in Local Storage.
   =========================================================== */

(function () {
  "use strict";

  /* ---------- Local Storage helpers ---------- */
  const STORE = {
    tasks: "ld_tasks",
    links: "ld_links",
    theme: "ld_theme",
    name: "ld_name",
  };

  function loadData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn("Failed to read", key, e);
      return fallback;
    }
  }

  function saveData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to save", key, e);
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- Element shortcuts ---------- */
  const $ = (id) => document.getElementById(id);

  /* ===========================================================
     THEME (Light / Dark)
     =========================================================== */
  const themeToggle = $("themeToggle");
  const themeIcon = $("themeIcon");
  const themeLabel = $("themeLabel");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      themeIcon.textContent = "☀️";
      themeLabel.textContent = "Light";
    } else {
      themeIcon.textContent = "🌙";
      themeLabel.textContent = "Dark";
    }
  }

  let currentTheme = loadData(STORE.theme, "light");
  applyTheme(currentTheme);

  themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    saveData(STORE.theme, currentTheme);
  });

  /* ===========================================================
     GREETING + CLOCK
     =========================================================== */
  const clockEl = $("clock");
  const dateEl = $("date");
  const greetingEl = $("greeting");
  const nameDisplay = $("nameDisplay");
  const editNameBtn = $("editNameBtn");
  const nameInput = $("nameInput");
  const saveNameBtn = $("saveNameBtn");

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function getGreeting(h) {
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }

  function updateClock() {
    const now = new Date();
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    dateEl.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    const greeting = getGreeting(now.getHours());
    if (greetingEl.textContent !== greeting) greetingEl.textContent = greeting;
  }

  /* ---------- Custom name ---------- */
  let userName = loadData(STORE.name, "");

  function renderName() {
    nameDisplay.textContent = userName ? userName : "there";
  }
  renderName();

  function openNameEdit() {
    nameInput.value = userName;
    nameInput.classList.remove("hidden");
    saveNameBtn.classList.remove("hidden");
    nameInput.focus();
    nameInput.select();
  }

  function commitName() {
    const val = nameInput.value.trim();
    userName = val;
    saveData(STORE.name, userName);
    renderName();
    nameInput.classList.add("hidden");
    saveNameBtn.classList.add("hidden");
  }

  editNameBtn.addEventListener("click", openNameEdit);
  saveNameBtn.addEventListener("click", commitName);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitName(); }
    if (e.key === "Escape") {
      nameInput.classList.add("hidden");
      saveNameBtn.classList.add("hidden");
    }
  });

  updateClock();
  setInterval(updateClock, 1000);

  /* ===========================================================
     FOCUS TIMER (Pomodoro 25:00)
     =========================================================== */
  const POMODORO = 25 * 60; // seconds
  let timeLeft = POMODORO;
  let timerInterval = null;
  let running = false;

  const timerDisplay = $("timerDisplay");
  const timerLabel = $("timerLabel");
  const startBtn = $("startBtn");
  const stopBtn = $("stopBtn");
  const resetBtn = $("resetBtn");

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${pad(m)}:${pad(s)}`;
  }

  function renderTimer() {
    timerDisplay.textContent = formatTime(timeLeft);
    document.title = running || timeLeft < POMODORO
      ? `(${formatTime(timeLeft)}) Life Dashboard`
      : "Life Dashboard";
  }

  function setRunning(state) {
    running = state;
    startBtn.disabled = state;
    stopBtn.disabled = !state;
    timerLabel.textContent = state ? "Stay focused 💪" : (timeLeft < POMODORO ? "Paused" : "Ready to focus");
  }

  function tick() {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeLeft = 0;
      setRunning(false);
      timerLabel.textContent = "Time's up! Take a break ☕";
      timerDisplay.textContent = "00:00";
      try { navigator.vibrate && navigator.vibrate(200); } catch (e) {}
      return;
    }
  }

  startBtn.addEventListener("click", () => {
    if (running) return;
    if (timeLeft <= 0) timeLeft = POMODORO;
    setRunning(true);
    renderTimer();
    timerInterval = setInterval(tick, 1000);
  });

  stopBtn.addEventListener("click", () => {
    if (!running) return;
    clearInterval(timerInterval);
    timerInterval = null;
    setRunning(false);
    renderTimer();
  });

  resetBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = POMODORO;
    setRunning(false);
    timerLabel.textContent = "Ready to focus";
    renderTimer();
  });

  renderTimer();

  /* ===========================================================
     TASKS (To-Do List)
     =========================================================== */
  let tasks = loadData(STORE.tasks, []); // [{id, text, done}]
  const taskForm = $("taskForm");
  const taskInput = $("taskInput");
  const taskList = $("taskList");
  const taskWarning = $("taskWarning");
  const taskEmpty = $("taskEmpty");

  function showWarning(el, msg) {
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  function taskExists(text) {
    const norm = text.trim().toLowerCase();
    return tasks.some((t) => t.text.trim().toLowerCase() === norm);
  }

  function renderTasks() {
    taskList.innerHTML = "";
    if (tasks.length === 0) {
      taskEmpty.classList.remove("hidden");
      return;
    }
    taskEmpty.classList.add("hidden");

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " done" : "");
      li.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.addEventListener("change", () => toggleTask(task.id));

      const span = document.createElement("span");
      span.className = "task-text";
      span.textContent = task.text;

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.type = "button";
      editBtn.title = "Edit";
      editBtn.textContent = "✏️";
      editBtn.addEventListener("click", () => editTask(task.id));

      const delBtn = document.createElement("button");
      delBtn.className = "del-btn";
      delBtn.type = "button";
      delBtn.title = "Delete";
      delBtn.textContent = "🗑️";
      delBtn.addEventListener("click", () => deleteTask(task.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(actions);
      taskList.appendChild(li);
    });
  }

  function saveTasks() {
    saveData(STORE.tasks, tasks);
  }

  function addTask(text) {
    const clean = text.trim();
    if (!clean) return;
    if (taskExists(clean)) {
      showWarning(taskWarning, "⚠️ That task already exists. Try a different one.");
      return;
    }
    tasks.push({ id: uid(), text: clean, done: false });
    saveTasks();
    renderTasks();
  }

  function toggleTask(id) {
    const t = tasks.find((x) => x.id === id);
    if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
  }

  function deleteTask(id) {
    tasks = tasks.filter((x) => x.id !== id);
    saveTasks();
    renderTasks();
  }

  function editTask(id) {
    const li = taskList.querySelector(`[data-id="${id}"]`);
    if (!li) return;
    const task = tasks.find((x) => x.id === id);
    if (!task) return;

    const span = li.querySelector(".task-text");
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.maxLength = 100;
    input.className = "task-edit-input";
    li.replaceChild(input, span);
    input.focus();
    input.select();

    let done = false;
    function finish(save) {
      if (done) return;
      done = true;
      const val = input.value.trim();
      if (save && val && val.toLowerCase() !== task.text.trim().toLowerCase()) {
        // duplicate check against others
        const dup = tasks.some(
          (x) => x.id !== id && x.text.trim().toLowerCase() === val.toLowerCase()
        );
        if (dup) {
          showWarning(taskWarning, "⚠️ Another task already has that text.");
          renderTasks();
          return;
        }
        task.text = val;
        saveTasks();
      }
      renderTasks();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); finish(true); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); }
    });
    input.addEventListener("blur", () => finish(true));
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
  });

  renderTasks();

  /* ===========================================================
     QUICK LINKS
     =========================================================== */
  let links = loadData(STORE.links, []); // [{id, name, url}]
  const linkForm = $("linkForm");
  const linkName = $("linkName");
  const linkUrl = $("linkUrl");
  const linksContainer = $("linksContainer");
  const linksEmpty = $("linksEmpty");
  const linkWarning = $("linkWarning");

  function normalizeUrl(url) {
    let u = url.trim();
    if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  }

  function linkExists(name, url) {
    const n = name.trim().toLowerCase();
    const u = normalizeUrl(url).toLowerCase();
    return links.some((l) => l.name.trim().toLowerCase() === n || l.url.toLowerCase() === u);
  }

  function renderLinks() {
    linksContainer.innerHTML = "";
    if (links.length === 0) {
      linksEmpty.classList.remove("hidden");
      return;
    }
    linksEmpty.classList.add("hidden");

    links.forEach((link) => {
      const a = document.createElement("a");
      a.className = "link-chip";
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = link.url;

      const icon = document.createElement("span");
      icon.className = "link-icon";
      icon.textContent = "🔗";

      const label = document.createElement("span");
      label.textContent = link.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "link-remove";
      remove.title = "Delete link";
      remove.setAttribute("aria-label", "Delete link " + link.name);
      remove.textContent = "✕";
      remove.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        deleteLink(link.id);
      });

      a.appendChild(icon);
      a.appendChild(label);
      a.appendChild(remove);
      linksContainer.appendChild(a);
    });
  }

  function saveLinks() { saveData(STORE.links, links); }

  function addLink(name, url) {
    const cleanName = name.trim();
    const cleanUrl = normalizeUrl(url);
    if (!cleanName || !cleanUrl) {
      showWarning(linkWarning, "⚠️ Please provide both a link name and a URL.");
      return false;
    }
    if (linkExists(cleanName, cleanUrl)) {
      showWarning(linkWarning, "⚠️ A link with that name or URL already exists.");
      return false;
    }
    links.push({ id: uid(), name: cleanName, url: cleanUrl });
    saveLinks();
    renderLinks();
    return true;
  }

  function deleteLink(id) {
    links = links.filter((x) => x.id !== id);
    saveLinks();
    renderLinks();
  }

  linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = addLink(linkName.value, linkUrl.value);
    if (ok) {
      linkName.value = "";
      linkUrl.value = "";
      linkName.focus();
    }
  });

  renderLinks();
})();
