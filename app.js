// To-do list: all tasks live in one array, render() rebuilds the list from it,
// and save()/load() keep it in localStorage.
var STORAGE_KEY = "todo.tasks";
var MAX_LENGTH = 120;

var tasks = load();          // [{ id: 1730000000000, text: "Buy milk", done: false }, ...]
var filter = "all";          // all | active | done

var form = document.getElementById("form");
var input = document.getElementById("text");
var list = document.getElementById("list");
var errorBox = document.getElementById("error");

// ---------------------------------------------------------------- storage
function load() {
  try {
    var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    // Keep only well-formed tasks, so edited or corrupted storage never breaks the page.
    return data.filter(function (t) {
      return t && typeof t.id === "number" && typeof t.text === "string" && t.text.trim() !== "";
    }).map(function (t) {
      return { id: t.id, text: t.text.slice(0, MAX_LENGTH), done: t.done === true };
    });
  } catch (e) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    showError("Could not save: browser storage is full or blocked.");
  }
}

// ---------------------------------------------------------------- rendering
function visibleTasks() {
  if (filter === "active") return tasks.filter(function (t) { return !t.done; });
  if (filter === "done") return tasks.filter(function (t) { return t.done; });
  return tasks;
}

function button(text, action, label) {
  var b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.dataset.action = action;
  b.setAttribute("aria-label", label);
  return b;
}

function render() {
  list.replaceChildren();
  visibleTasks().forEach(function (t) {
    var li = document.createElement("li");
    li.dataset.id = t.id;
    li.className = t.done ? "task done" : "task";

    var box = document.createElement("input");
    box.type = "checkbox";
    box.checked = t.done;
    box.dataset.action = "toggle";
    box.id = "task-" + t.id;

    var label = document.createElement("label");
    label.htmlFor = box.id;
    label.textContent = t.text;            // textContent: user text can never inject HTML

    li.append(box, label, button("Delete", "delete", "Delete task: " + t.text));
    list.append(li);
  });

  var left = tasks.filter(function (t) { return !t.done; }).length;
  document.getElementById("count").textContent = left + (left === 1 ? " task left" : " tasks left");

  var empty = document.getElementById("empty");
  if (!tasks.length) empty.textContent = "No tasks yet. Add your first one above.";
  else if (!visibleTasks().length) empty.textContent = filter === "done" ? "No completed tasks." : "Nothing left to do!";
  else empty.textContent = "";

  document.getElementById("clear-done").hidden = !tasks.some(function (t) { return t.done; });
  document.querySelectorAll("[data-filter]").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.dataset.filter === filter));
  });
}

function showError(message) {
  errorBox.textContent = message;
}

// ---------------------------------------------------------------- events
form.addEventListener("submit", function (e) {
  e.preventDefault();                       // Enter key and the Add button both submit the form
  var text = input.value.trim().replace(/\s+/g, " ");
  if (!text) {
    showError("Type a task first.");
    input.focus();
    return;
  }
  if (tasks.some(function (t) { return !t.done && t.text.toLowerCase() === text.toLowerCase(); })) {
    showError("That task is already on your list.");
    return;
  }
  showError("");
  // Date.now() can repeat if two tasks are added in the same millisecond, so make sure the id is new.
  var id = Date.now();
  while (tasks.some(function (t) { return t.id === id; })) id++;
  tasks.push({ id: id, text: text, done: false });
  input.value = "";
  if (filter === "done") filter = "all";    // show the new task
  save();
  render();
});

input.addEventListener("input", function () { if (input.value.trim()) showError(""); });

// Event delegation: one listener for every task's checkbox and Delete button.
list.addEventListener("click", function (e) {
  var action = e.target.dataset.action;
  if (!action) return;
  var id = Number(e.target.closest("li").dataset.id);
  if (action === "delete") {
    tasks = tasks.filter(function (t) { return t.id !== id; });
  } else if (action === "toggle") {
    tasks.forEach(function (t) { if (t.id === id) t.done = !t.done; });
  }
  save();
  render();
});

document.querySelectorAll("[data-filter]").forEach(function (b) {
  b.addEventListener("click", function () {
    filter = b.dataset.filter;
    render();
  });
});

document.getElementById("clear-done").addEventListener("click", function () {
  tasks = tasks.filter(function (t) { return !t.done; });
  save();
  render();
});

// Keep several open tabs in sync.
window.addEventListener("storage", function (e) {
  if (e.key === STORAGE_KEY) { tasks = load(); render(); }
});

render();
