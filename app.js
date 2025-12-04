// DOM elements
const input = document.getElementById("taskInput");
const dateInput = document.getElementById("taskDate");
const priorityInput = document.getElementById("taskPriority");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("taskList");
const sortSelect = document.getElementById("sortSelect");
const clearCompletedBtn = document.getElementById("clearCompleted");

// Edit modal elements
const editModal = document.getElementById("editModal");
const editText = document.getElementById("editText");
const editDate = document.getElementById("editDate");
const editPriority = document.getElementById("editPriority");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");

let tasks = [];            // in-memory
let editId = null;         // id of task being edited

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  renderTasks();
});

// Add listeners
addBtn.addEventListener("click", handleAdd);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleAdd();
});
sortSelect.addEventListener("change", renderTasks);
clearCompletedBtn.addEventListener("click", clearCompleted);

// Edit modal listeners
saveEdit.addEventListener("click", saveEditHandler);
cancelEdit.addEventListener("click", closeEditModal);

// Helpers
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

function handleAdd() {
  const text = input.value.trim();
  const date = dateInput.value;
  const priority = priorityInput.value;

  if (!text || !date) {
    // minimal validation—could show inline error
    return;
  }

  const task = {
    id: uid(),
    text,
    date,
    priority,
    completed: false,
    createdAt: Date.now()
  };

  tasks.push(task);
  saveTasks();
  renderTasks();

  // reset inputs
  input.value = "";
  dateInput.value = "";
  priorityInput.value = "Low";
}

// Persist
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
function loadTasks() {
  const raw = localStorage.getItem("tasks");
  tasks = raw ? JSON.parse(raw) : [];
}

// Render
function renderTasks() {
  // sort copy based on select
  const mode = sortSelect.value;
  let listToRender = [...tasks];

  if (mode === "date-asc") {
    listToRender.sort((a,b)=> new Date(a.date) - new Date(b.date));
  } else if (mode === "date-desc") {
    listToRender.sort((a,b)=> new Date(b.date) - new Date(a.date));
  } else if (mode === "priority") {
    const rank = { High: 3, Medium: 2, Low: 1 };
    listToRender.sort((a,b)=> rank[b.priority] - rank[a.priority] );
  } else { // newest
    listToRender.sort((a,b)=> b.createdAt - a.createdAt);
  }

  // clear
  list.innerHTML = "";
  if (listToRender.length === 0){
    const empty = document.createElement("div");
    empty.className = "task-item";
    empty.textContent = "No tasks — add one above.";
    list.appendChild(empty);
    return;
  }

  // append
  listToRender.forEach(task => {
    const li = createTaskElement(task);
    list.appendChild(li);
  });
}

// Create DOM for a single task
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;

  // left block
  const left = document.createElement("div");
  left.className = "task-left";

  // checkbox
  const checkbox = document.createElement("div");
  checkbox.className = "checkbox" + (task.completed ? " checked" : "");
  checkbox.title = "Mark complete";
  checkbox.addEventListener("click", () => toggleComplete(task.id, li));
  checkbox.innerHTML = task.completed ? "✓" : "";

  // info
  const info = document.createElement("div");
  info.className = "task-info";

  const title = document.createElement("div");
  title.className = "task-title" + (task.completed ? " completed" : "");
  title.textContent = task.text;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.textContent = formatDate(task.date) + " • " + task.priority + " priority";

  info.appendChild(title);
  info.appendChild(meta);

  left.appendChild(checkbox);
  left.appendChild(info);

  // right actions
  const actions = document.createElement("div");
  actions.className = "task-actions";

  // priority badge
  const badge = document.createElement("div");
  badge.className = "badge " + (task.priority.toLowerCase());
  badge.textContent = task.priority;
  actions.appendChild(badge);

  // edit button
  const editBtn = document.createElement("button");
  editBtn.className = "btn edit";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => openEditModal(task.id));
  actions.appendChild(editBtn);

  // delete button
  const delBtn = document.createElement("button");
  delBtn.className = "btn delete";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => removeTask(task.id, li));
  actions.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(actions);

  return li;
}

// Toggle complete state
function toggleComplete(id, liElement) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks[idx].completed = !tasks[idx].completed;
  saveTasks();
  // small visual update
  renderTasks();
}

// Remove with short animation
function removeTask(id, liElement) {
  // animate (optional) then remove
  if (liElement){
    liElement.style.animation = "fadeOut 150ms ease forwards";
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
    }, 160);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }
}

// Edit modal
function openEditModal(id) {
  const task = tasks.find(t=>t.id === id);
  if (!task) return;
  editId = id;
  editText.value = task.text;
  editDate.value = task.date;
  editPriority.value = task.priority;
  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden", "false");
  editText.focus();
}

function closeEditModal() {
  editId = null;
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden", "true");
}

function saveEditHandler() {
  if (!editId) return;
  const idx = tasks.findIndex(t => t.id === editId);
  if (idx === -1) return;

  const newText = editText.value.trim();
  const newDate = editDate.value;
  const newPriority = editPriority.value;

  if (!newText || !newDate) return;

  tasks[idx].text = newText;
  tasks[idx].date = newDate;
  tasks[idx].priority = newPriority;
  tasks[idx].createdAt = tasks[idx].createdAt || Date.now();

  saveTasks();
  closeEditModal();
  renderTasks();
}

// Utilities
function formatDate(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

// Clear all completed tasks
function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}
