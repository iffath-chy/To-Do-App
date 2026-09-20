/* =========================================================
   STUDY PLANNER - script.js
   ---------------------------------------------------------
   This JavaScript controls:
   1. Adding tasks
   2. Editing tasks
   3. Deleting tasks
   4. Completing tasks
   5. Searching tasks
   6. Filtering tasks
   7. Course filtering
   8. Progress calculation
   9. Dark/light theme
   10. Saving data in localStorage
   11. Undo delete
   ========================================================= */


/* =========================================================
   1. GET HTML ELEMENTS
   ---------------------------------------------------------
   document.getElementById() finds an element using its ID.
   We store those elements in variables so we can use them
   later in the JavaScript.
   ========================================================= */

const form = document.getElementById("form");
const titleInput = document.getElementById("title");
const courseInput = document.getElementById("course");
const dueInput = document.getElementById("due");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

const titleError = document.getElementById("titleError");

const list = document.getElementById("list");
const empty = document.getElementById("empty");
const emptyTitle = document.getElementById("emptyTitle");
const emptySub = document.getElementById("emptySub");

const searchInput = document.getElementById("search");
const tabs = document.getElementById("tabs");

const courseList = document.getElementById("courseList");
const coursesDatalist = document.getElementById("courses");

const greeting = document.getElementById("greeting");
const todayElement = document.getElementById("today");
const summary = document.getElementById("summary");

const ring = document.getElementById("ring");
const ringFg = document.getElementById("ringFg");
const ringPct = document.getElementById("ringPct");

const statOpen = document.getElementById("statOpen");
const statToday = document.getElementById("statToday");
const statOverdue = document.getElementById("statOverdue");
const statOverdueBox = document.getElementById("statOverdueBox");

const footInfo = document.getElementById("footInfo");
const clearDone = document.getElementById("clearDone");

const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");
const undoBtn = document.getElementById("undoBtn");

const themeBtn = document.getElementById("themeBtn");


/* =========================================================
   2. APPLICATION DATA
   ========================================================= */

// All tasks are stored inside this array.
let tasks = [];

// This stores the ID of the task currently being edited.
// null means we are adding a new task.
let editingId = null;

// Used for the Undo button after deleting a task.
let deletedTask = null;

// Timer used to automatically hide the toast.
let toastTimer = null;

// Current selected filter.
let currentFilter = "all";

// Currently selected course.
// "all" means show tasks from every course.
let currentCourse = "all";


/* =========================================================
   3. LOCAL STORAGE
   ---------------------------------------------------------
   localStorage allows the browser to remember tasks even
   after the page is refreshed.
   ========================================================= */

const STORAGE_KEY = "study-planner-tasks";
const THEME_KEY = "study-planner-theme";


/* =========================================================
   4. CREATE UNIQUE TASK ID
   ========================================================= */

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}


/* =========================================================
   5. GET TODAY'S DATE
   ========================================================= */

function getTodayString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   6. FORMAT A DATE FOR DISPLAY
   ---------------------------------------------------------
   Example:
   2026-09-20
   becomes:
   Sep 20, 2026
   ========================================================= */

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString + "T00:00:00");

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}


/* =========================================================
   7. SAVE TASKS
   ========================================================= */

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}


/* =========================================================
   8. LOAD TASKS
   ========================================================= */

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      tasks = JSON.parse(saved);
    }
  } catch (error) {
    console.error("Could not load tasks:", error);
    tasks = [];
  }
}


/* =========================================================
   9. SAVE THEME
   ========================================================= */

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}


/* =========================================================
   10. LOAD THEME
   ========================================================= */

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.dataset.theme = savedTheme;
    updateThemeButton(savedTheme);
    return;
  }

  // If the user has not selected a theme manually,
  // let the operating system decide.
  document.documentElement.removeAttribute("data-theme");

  updateThemeButton();
}


/* =========================================================
   11. UPDATE THEME BUTTON
   ========================================================= */

function updateThemeButton(theme) {

  if (theme === "dark") {
    themeBtn.textContent = "☀ Light mode";
  } else if (theme === "light") {
    themeBtn.textContent = "🌙 Dark mode";
  } else {
    themeBtn.textContent = "🌙 Theme";
  }
}


/* =========================================================
   12. CHANGE THEME
   ========================================================= */

themeBtn.addEventListener("click", () => {

  const currentTheme =
    document.documentElement.dataset.theme;

  if (currentTheme === "dark") {

    document.documentElement.dataset.theme = "light";
    saveTheme("light");
    updateThemeButton("light");

  } else {

    document.documentElement.dataset.theme = "dark";
    saveTheme("dark");
    updateThemeButton("dark");
  }
});


/* =========================================================
   13. GREETING
   ---------------------------------------------------------
   Displays:
   Good morning
   Good afternoon
   Good evening
   ========================================================= */

function updateGreeting() {

  const hour = new Date().getHours();

  let text;

  if (hour < 12) {
    text = "Good morning";
  } else if (hour < 18) {
    text = "Good afternoon";
  } else {
    text = "Good evening";
  }

  greeting.textContent = text;
}


/* =========================================================
   14. DISPLAY TODAY'S DATE
   ========================================================= */

function updateDate() {

  const today = new Date();

  todayElement.textContent =
    today.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
}


/* =========================================================
   15. GET SELECTED PRIORITY
   ========================================================= */

function getSelectedPriority() {

  const selected =
    document.querySelector(
      'input[name="priority"]:checked'
    );

  return selected ? selected.value : "medium";
}


/* =========================================================
   16. SET PRIORITY
   ---------------------------------------------------------
   Used when editing an existing task.
   ========================================================= */

function setPriority(priority) {

  const radio =
    document.querySelector(
      `input[name="priority"][value="${priority}"]`
    );

  if (radio) {
    radio.checked = true;
  }
}


/* =========================================================
   17. CREATE A NEW TASK
   ========================================================= */

function createTask(title, course, due, priority) {

  return {
    id: createId(),

    // The task's title.
    title: title,

    // Course name.
    course: course,

    // Due date.
    due: due,

    // high / medium / low.
    priority: priority,

    // Whether the task is completed.
    done: false,

    // Creation timestamp.
    createdAt: Date.now()
  };
}


/* =========================================================
   18. FORM SUBMISSION
   ---------------------------------------------------------
   This runs when the user clicks "Add task".
   ========================================================= */

form.addEventListener("submit", (event) => {

  // Prevent the browser from refreshing the page.
  event.preventDefault();

  // Remove unnecessary spaces.
  const title = titleInput.value.trim();
  const course = courseInput.value.trim();
  const due = dueInput.value;
  const priority = getSelectedPriority();


  /* -------------------------------------------------------
     VALIDATION
     ------------------------------------------------------- */

  if (!title) {

    titleError.hidden = false;
    titleInput.focus();

    return;
  }

  // Hide the error if the title is valid.
  titleError.hidden = true;


  /* -------------------------------------------------------
     EDIT EXISTING TASK
     ------------------------------------------------------- */

  if (editingId) {

    const task = tasks.find(
      task => task.id === editingId
    );

    if (task) {

      task.title = title;
      task.course = course;
      task.due = due;
      task.priority = priority;
    }

    showToast("Task updated");

  }

  /* -------------------------------------------------------
     ADD NEW TASK
     ------------------------------------------------------- */

  else {

    const task = createTask(
      title,
      course,
      due,
      priority
    );

    tasks.push(task);

    showToast("Task added");
  }


  // Save changes.
  saveTasks();

  // Reset the form.
  resetForm();

  // Refresh the screen.
  render();
});


/* =========================================================
   19. RESET FORM
   ========================================================= */

function resetForm() {

  form.reset();

  editingId = null;

  cancelBtn.hidden = true;

  submitBtn.textContent = "Add task";

  document.getElementById("formHeading").textContent =
    "New task";

  // Medium is the default priority.
  setPriority("medium");

  titleError.hidden = true;
}


/* =========================================================
   20. CANCEL EDITING
   ========================================================= */

cancelBtn.addEventListener("click", () => {

  resetForm();

  titleInput.focus();
});


/* =========================================================
   21. EDIT A TASK
   ========================================================= */

function editTask(id) {

  const task = tasks.find(
    task => task.id === id
  );

  if (!task) return;

  editingId = id;

  titleInput.value = task.title;
  courseInput.value = task.course || "";
  dueInput.value = task.due || "";

  setPriority(task.priority || "medium");

  submitBtn.textContent = "Save changes";

  cancelBtn.hidden = false;

  document.getElementById("formHeading").textContent =
    "Edit task";

  titleError.hidden = true;

  titleInput.focus();

  // Scroll to the form.
  form.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   22. DELETE A TASK
   ========================================================= */

function deleteTask(id) {

  const index = tasks.findIndex(
    task => task.id === id
  );

  if (index === -1) return;

  // Store the deleted task so it can be restored.
  deletedTask = {
    task: tasks[index],
    index: index
  };

  // Remove the task.
  tasks.splice(index, 1);

  saveTasks();

  render();

  showToast("Task deleted");
}


/* =========================================================
   23. UNDO DELETE
   ========================================================= */

undoBtn.addEventListener("click", () => {

  if (!deletedTask) return;

  tasks.splice(
    deletedTask.index,
    0,
    deletedTask.task
  );

  saveTasks();

  deletedTask = null;

  render();

  hideToast();
});


/* =========================================================
   24. COMPLETE / UNCOMPLETE TASK
   ========================================================= */

function toggleTask(id) {

  const task = tasks.find(
    task => task.id === id
  );

  if (!task) return;

  task.done = !task.done;

  saveTasks();

  render();
}


/* =========================================================
   25. SEARCH TASKS
   ========================================================= */

searchInput.addEventListener("input", () => {

  render();
});


/* =========================================================
   26. FILTER TABS
   ========================================================= */

tabs.addEventListener("click", (event) => {

  const button =
    event.target.closest(".tab");

  if (!button) return;

  currentFilter =
    button.dataset.filter;

  // Update which tab is selected.
  document.querySelectorAll(".tab").forEach(tab => {

    tab.setAttribute(
      "aria-pressed",
      tab === button ? "true" : "false"
    );
  });

  render();
});


/* =========================================================
   27. GET TASK STATUS
   ---------------------------------------------------------
   Determines whether a task is:
   - overdue
   - today
   - upcoming
   - no due date
   ========================================================= */

function getDueStatus(task) {

  if (!task.due || task.done) {
    return "none";
  }

  const today = getTodayString();

  if (task.due < today) {
    return "overdue";
  }

  if (task.due === today) {
    return "today";
  }

  return "upcoming";
}


/* =========================================================
   28. FILTER TASKS
   ========================================================= */

function getFilteredTasks() {

  const search =
    searchInput.value.trim().toLowerCase();

  return tasks.filter(task => {

    /* -----------------------------------------------------
       SEARCH FILTER
       ----------------------------------------------------- */

    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search) ||
      (task.course || "").toLowerCase().includes(search);

    if (!matchesSearch) {
      return false;
    }


    /* -----------------------------------------------------
       COURSE FILTER
       ----------------------------------------------------- */

    if (
      currentCourse !== "all" &&
      (task.course || "") !== currentCourse
    ) {
      return false;
    }


    /* -----------------------------------------------------
       STATUS FILTER
       ----------------------------------------------------- */

    const status = getDueStatus(task);

    switch (currentFilter) {

      case "today":
        return status === "today";

      case "upcoming":
        return status === "upcoming";

      case "overdue":
        return status === "overdue";

      case "done":
        return task.done;

      case "all":
      default:
        return true;
    }
  });
}


/* =========================================================
   29. ESCAPE HTML
   ---------------------------------------------------------
   This prevents user-entered text from being interpreted
   as HTML.
   ========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   30. CREATE A TASK CARD
   ---------------------------------------------------------
   Converts one task object into HTML.
   ========================================================= */

function taskHTML(task) {

  const status = getDueStatus(task);

  let dueBadge = "";

  if (status === "overdue") {

    dueBadge =
      `<span class="badge overdue">Overdue</span>`;

  } else if (status === "today") {

    dueBadge =
      `<span class="badge today">Due today</span>`;

  } else if (status === "upcoming") {

    dueBadge =
      `<span class="badge soon">
        Due ${escapeHTML(formatDate(task.due))}
      </span>`;
  }


  const courseHTML = task.course
    ? `<span class="chip"
             style="--h:${getCourseHue(task.course)}">
         ${escapeHTML(task.course)}
       </span>`
    : "";


  return `
    <li
      class="task
        ${task.done ? "done" : ""}
        ${task.course ? "has-course" : ""}"
      data-id="${escapeHTML(task.id)}"
      data-pri="${escapeHTML(task.priority)}"
      style="--h:${getCourseHue(task.course || "General")}"
    >

      <!-- Completion checkbox -->
      <input
        class="check"
        type="checkbox"
        ${task.done ? "checked" : ""}
        aria-label="Mark ${escapeHTML(task.title)} as complete"
      >

      <!-- Task information -->
      <div class="body">

        <p class="task-title">
          <span class="title">
            ${escapeHTML(task.title)}
          </span>
        </p>

        <div class="meta">

          ${courseHTML}

          ${dueBadge}

          <!-- Priority -->
          <span class="pri">
            <span class="dot"></span>
            ${escapeHTML(
              capitalize(task.priority)
            )}
          </span>

        </div>
      </div>

      <!-- Edit and delete buttons -->
      <div class="actions">

        <button
          type="button"
          class="icon-btn edit"
          aria-label="Edit task"
          title="Edit"
        >
          ✎
        </button>

        <button
          type="button"
          class="icon-btn del"
          aria-label="Delete task"
          title="Delete"
        >
          ×
        </button>

      </div>

    </li>
  `;
}


/* =========================================================
   31. CAPITALIZE TEXT
   ========================================================= */

function capitalize(value) {

  if (!value) return "";

  return value.charAt(0).toUpperCase() +
         value.slice(1);
}


/* =========================================================
   32. CREATE A CONSISTENT COLOR FOR EACH COURSE
   ---------------------------------------------------------
   Different course names receive different HSL hues.
   ========================================================= */

function getCourseHue(course) {

  if (!course) return 210;

  let hash = 0;

  for (let i = 0; i < course.length; i++) {
    hash =
      course.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
}


/* =========================================================
   33. DISPLAY TASKS
   ========================================================= */

function renderTasks() {

  const filteredTasks =
    getFilteredTasks();


  /* -------------------------------------------------------
     SORT TASKS
     -------------------------------------------------------
     Uncompleted tasks appear before completed tasks.
     Tasks with due dates appear before tasks without dates.
     ------------------------------------------------------- */

  filteredTasks.sort((a, b) => {

    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }

    if (a.due && b.due) {
      return a.due.localeCompare(b.due);
    }

    if (a.due) return -1;

    if (b.due) return 1;

    return b.createdAt - a.createdAt;
  });


  /* -------------------------------------------------------
     SHOW EMPTY STATE IF THERE ARE NO RESULTS
     ------------------------------------------------------- */

  if (filteredTasks.length === 0) {

    list.innerHTML = "";

    empty.hidden = false;

    if (tasks.length === 0) {

      emptyTitle.textContent =
        "No tasks yet";

      emptySub.textContent =
        "Add your first task to get started.";

    } else {

      emptyTitle.textContent =
        "No matching tasks";

      emptySub.textContent =
        "Try another filter or search term.";
    }

    return;
  }


  /* -------------------------------------------------------
     DISPLAY TASKS
     ------------------------------------------------------- */

  empty.hidden = true;

  list.innerHTML = `
    <ul class="cards">
      ${filteredTasks
        .map(task => taskHTML(task))
        .join("")}
    </ul>
  `;
}


/* =========================================================
   34. HANDLE TASK BUTTONS
   ---------------------------------------------------------
   Event delegation allows us to use one event listener
   for all dynamically created task cards.
   ========================================================= */

list.addEventListener("click", (event) => {

  const taskElement =
    event.target.closest(".task");

  if (!taskElement) return;

  const id =
    taskElement.dataset.id;


  // Edit button
  if (
    event.target.closest(".edit")
  ) {
    editTask(id);
    return;
  }


  // Delete button
  if (
    event.target.closest(".del")
  ) {
    deleteTask(id);
  }
});


/* =========================================================
   35. HANDLE CHECKBOXES
   ========================================================= */

list.addEventListener("change", (event) => {

  if (
    !event.target.classList.contains("check")
  ) {
    return;
  }

  const taskElement =
    event.target.closest(".task");

  if (!taskElement) return;

  toggleTask(
    taskElement.dataset.id
  );
});


/* =========================================================
   36. UPDATE STATISTICS
   ========================================================= */

function updateStats() {

  const openTasks =
    tasks.filter(task => !task.done);

  const completedTasks =
    tasks.filter(task => task.done);

  const todayTasks =
    tasks.filter(
      task => getDueStatus(task) === "today"
    );

  const overdueTasks =
    tasks.filter(
      task => getDueStatus(task) === "overdue"
    );


  statOpen.textContent =
    openTasks.length;

  statToday.textContent =
    todayTasks.length;

  statOverdue.textContent =
    overdueTasks.length;


  /* -------------------------------------------------------
     Highlight overdue box if there are overdue tasks.
     ------------------------------------------------------- */

  statOverdueBox.classList.toggle(
    "bad",
    overdueTasks.length > 0
  );


  /* -------------------------------------------------------
     Update summary text.
     ------------------------------------------------------- */

  if (tasks.length === 0) {

    summary.textContent =
      "No tasks yet";

  } else if (openTasks.length === 0) {

    summary.textContent =
      "All tasks complete 🎉";

  } else {

    summary.textContent =
      `${openTasks.length} task${
        openTasks.length === 1 ? "" : "s"
      } remaining`;
  }


  /* -------------------------------------------------------
     Footer information.
     ------------------------------------------------------- */

  footInfo.textContent =
    `${tasks.length} task${
      tasks.length === 1 ? "" : "s"
    }`;


  /* -------------------------------------------------------
     Show Clear Completed button only when needed.
     ------------------------------------------------------- */

  clearDone.hidden =
    completedTasks.length === 0;
}


/* =========================================================
   37. UPDATE PROGRESS RING
   ========================================================= */

function updateProgress() {

  const total = tasks.length;

  const completed =
    tasks.filter(task => task.done).length;


  let percentage = 0;

  if (total > 0) {
    percentage =
      Math.round(
        (completed / total) * 100
      );
  }


  /* -------------------------------------------------------
     Update percentage text.
     ------------------------------------------------------- */

  ringPct.textContent =
    `${percentage}%`;


  /* -------------------------------------------------------
     Update accessibility label.
     ------------------------------------------------------- */

  ring.setAttribute(
    "aria-label",
    `${percentage}% of tasks done`
  );


  /* -------------------------------------------------------
     Calculate SVG circle circumference.
     -------------------------------------------------------
     Circle radius = 52 from your HTML.

     Circumference:
     2 × π × radius
     ------------------------------------------------------- */

  const radius = 52;

  const circumference =
    2 * Math.PI * radius;


  ringFg.style.strokeDasharray =
    circumference;


  /* -------------------------------------------------------
     Calculate how much of the circle should be hidden.
     ------------------------------------------------------- */

  const offset =
    circumference -
    (percentage / 100) * circumference;


  ringFg.style.strokeDashoffset =
    offset;
}


/* =========================================================
   38. UPDATE COURSE LIST
   ========================================================= */

function updateCourses() {

  const courses = [
    ...new Set(
      tasks
        .map(task => task.course)
        .filter(Boolean)
    )
  ].sort();


  /* -------------------------------------------------------
     Update datalist suggestions.
     ------------------------------------------------------- */

  coursesDatalist.innerHTML =
    courses
      .map(course =>
        `<option value="${escapeHTML(course)}"></option>`
      )
      .join("");


  /* -------------------------------------------------------
     Course sidebar.
     ------------------------------------------------------- */

  const allButton = `
    <button
      type="button"
      class="course-btn all"
      aria-pressed="${currentCourse === "all"}"
      data-course="all"
    >
      <span class="cdot"></span>
      <span class="cname">All courses</span>
      <span class="ccount">${tasks.length}</span>
    </button>
  `;


  const courseButtons =
    courses.map(course => {

      const count =
        tasks.filter(
          task => task.course === course
        ).length;

      const hue =
        getCourseHue(course);

      return `
        <button
          type="button"
          class="course-btn"
          data-course="${escapeHTML(course)}"
          aria-pressed="${currentCourse === course}"
        >
          <span
            class="cdot"
            style="--h:${hue}"
          ></span>

          <span class="cname">
            ${escapeHTML(course)}
          </span>

          <span class="ccount">
            ${count}
          </span>
        </button>
      `;
    }).join("");


  courseList.innerHTML =
    allButton + courseButtons;
}


/* =========================================================
   39. COURSE FILTER CLICK
   ========================================================= */

courseList.addEventListener("click", (event) => {

  const button =
    event.target.closest(".course-btn");

  if (!button) return;

  currentCourse =
    button.dataset.course;

  updateCourses();

  render();
});


/* =========================================================
   40. UPDATE TAB COUNTS
   ========================================================= */

function updateTabCounts() {

  const counts = {

    all: tasks.length,

    today:
      tasks.filter(
        task => getDueStatus(task) === "today"
      ).length,

    upcoming:
      tasks.filter(
        task => getDueStatus(task) === "upcoming"
      ).length,

    overdue:
      tasks.filter(
        task => getDueStatus(task) === "overdue"
      ).length,

    done:
      tasks.filter(task => task.done).length
  };


  document.querySelectorAll(".tab")
    .forEach(button => {

      const filter =
        button.dataset.filter;

      const number =
        button.querySelector(".n");

      if (number) {
        number.textContent =
          counts[filter] || 0;
      }
    });
}


/* =========================================================
   41. CLEAR COMPLETED TASKS
   ========================================================= */

clearDone.addEventListener("click", () => {

  const completed =
    tasks.filter(task => task.done).length;

  if (completed === 0) return;


  tasks =
    tasks.filter(task => !task.done);

  saveTasks();

  render();

  showToast(
    `${completed} completed task${
      completed === 1 ? "" : "s"
    } cleared`
  );
});


/* =========================================================
   42. SHOW TOAST
   ========================================================= */

function showToast(message) {

  clearTimeout(toastTimer);

  toastMsg.textContent = message;

  toast.hidden = false;


  toastTimer =
    setTimeout(() => {

      hideToast();

    }, 4000);
}


/* =========================================================
   43. HIDE TOAST
   ========================================================= */

function hideToast() {

  toast.hidden = true;
}


/* =========================================================
   44. MAIN RENDER FUNCTION
   ---------------------------------------------------------
   This refreshes everything on the screen.
   ========================================================= */

function render() {

  renderTasks();

  updateStats();

  updateProgress();

  updateCourses();

  updateTabCounts();
}


/* =========================================================
   45. START THE APPLICATION
   ========================================================= */

// Load saved tasks.
loadTasks();

// Load saved theme.
loadTheme();

// Set greeting.
updateGreeting();

// Set today's date.
updateDate();

// Draw the application.
render();


/* =========================================================
   46. SET DEFAULT DATE
   ---------------------------------------------------------
   The due-date field starts empty.
   You could uncomment the following line if you want
   today's date to be automatically selected.
   ========================================================= */

// dueInput.value = getTodayString();
