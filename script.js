document.addEventListener("DOMContentLoaded", () => {
  // ===== Calendar setup =====
  const monthYear = document.getElementById("monthYear");
  const calendarBody = document.getElementById("calendarBody");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");

  // ===== Tasks =====
  const selectedDateLabel = document.getElementById("selectedDateLabel");
  const taskInput = document.getElementById("taskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskList = document.getElementById("taskList");

  // ===== Notes =====
  const dateNotesLabel = document.getElementById("dateNotesLabel");
  const dateNoteArea = document.getElementById("dateNoteArea");
  const notesContainer = document.getElementById("notesContainer");
  const addNewNote = document.getElementById("addNewNote");

  let currentDate = new Date();
  let selectedDate = null;

  // ===== Helpers =====
  function safeParse(json, fallback = {}) {
    try {
      if (!json || json === "undefined" || json === "null") return fallback;
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  // ===== Load stored data safely =====
  let tasks = safeParse(localStorage.getItem("tasks"), {});
  let generalNotes = safeParse(localStorage.getItem("generalNotes"), []);

  // ===== Calendar Rendering =====
  function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    monthYear.textContent = `${date.toLocaleString("default", { month: "long" })} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();

    calendarBody.innerHTML = "";
    let row = document.createElement("tr");

    for (let i = 0; i < startDay; i++) {
      row.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cell = document.createElement("td");
      cell.textContent = day;
      const cellDate = new Date(year, month, day);

      if (isToday(cellDate)) cell.classList.add("today");

      cell.addEventListener("click", () => {
        selectedDate = cellDate;
        document.querySelectorAll("#calendar td").forEach(td => td.classList.remove("selected"));
        cell.classList.add("selected");
        selectedDateLabel.textContent = formatDate(selectedDate);
        renderTasks();
        showDateNotes(selectedDate);
      });

      row.appendChild(cell);
      if ((startDay + day) % 7 === 0) {
        calendarBody.appendChild(row);
        row = document.createElement("tr");
      }
    }
    calendarBody.appendChild(row);
  }

  function isToday(date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function formatDate(date) {
    return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;
  }

  // ===== Month Navigation =====
  prevMonth.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });
  nextMonth.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  // ===== TASK MANAGER =====
  addTaskBtn.addEventListener("click", () => {
    if (!selectedDate) return alert("Select a date first!");
    const text = taskInput.value.trim();
    if (!text) return alert("Enter a task!");

    const key = formatDate(selectedDate);
    if (!tasks[key]) tasks[key] = [];

    tasks[key].push({ text, completed: false });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    taskInput.value = "";
    renderTasks();
  });

  function renderTasks() {
    taskList.innerHTML = "";
    if (!selectedDate) return;
    const key = formatDate(selectedDate);
    const dayTasks = tasks[key] || [];

    dayTasks.forEach((task, idx) => {
      const li = document.createElement("li");
      li.className = "task" + (task.completed ? " completed" : "");
      li.innerHTML = `
        <span>${task.text}</span>
        <div>
          <button onclick="toggleTask('${key}',${idx})">${task.completed ? "❌" : "✅"}</button>
          <button onclick="deleteTask('${key}',${idx})">🗑️</button>
        </div>`;
      taskList.appendChild(li);
    });
  }

  window.toggleTask = (dateKey, idx) => {
    tasks[dateKey][idx].completed = !tasks[dateKey][idx].completed;
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  };

  window.deleteTask = (dateKey, idx) => {
    tasks[dateKey].splice(idx, 1);
    if (tasks[dateKey].length === 0) delete tasks[dateKey];
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
  };

  // ===== DATE NOTES =====
  function showDateNotes(date) {
    const key = "notes_" + formatDate(date);
    const savedNote = localStorage.getItem(key) || "";
    dateNotesLabel.textContent = formatDate(date);
    dateNoteArea.value = savedNote;
  }

  dateNoteArea.addEventListener("input", () => {
    if (selectedDate) {
      const key = "notes_" + formatDate(selectedDate);
      localStorage.setItem(key, dateNoteArea.value);
    }
  });

  // ===== GENERAL NOTES =====
  function renderGeneralNotes() {
    notesContainer.innerHTML = "";
    generalNotes.forEach((note, idx) => {
      const div = document.createElement("div");
      div.classList.add("note");
      div.innerHTML = `
        <div class="note-title">${note.title}</div>
        <div class="note-body">${note.body}</div>
        <div class="note-actions">
          <button onclick="editNote(${idx})">✏️</button>
          <button onclick="deleteNote(${idx})">🗑️</button>
        </div>
      `;
      notesContainer.appendChild(div);
    });
  }

  addNewNote.addEventListener("click", () => {
    const title = prompt("Enter note title:");
    const body = prompt("Enter note content:");
    if (title && body) {
      generalNotes.push({ title, body });
      localStorage.setItem("generalNotes", JSON.stringify(generalNotes));
      renderGeneralNotes();
    }
  });

  window.editNote = idx => {
    const note = generalNotes[idx];
    const newBody = prompt(`Edit "${note.title}":`, note.body);
    if (newBody !== null) {
      generalNotes[idx].body = newBody;
      localStorage.setItem("generalNotes", JSON.stringify(generalNotes));
      renderGeneralNotes();
    }
  };

  window.deleteNote = idx => {
    if (confirm("Delete this note?")) {
      generalNotes.splice(idx, 1);
      localStorage.setItem("generalNotes", JSON.stringify(generalNotes));
      renderGeneralNotes();
    }
  };

  // ===== Initial render =====
  renderCalendar(currentDate);
  renderGeneralNotes();
});
