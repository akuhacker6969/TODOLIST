document.addEventListener("DOMContentLoaded", function () {
  const loginSection = document.getElementById("loginSection");
  const todoSection = document.getElementById("todoSection");
  const userDisplay = document.getElementById("userDisplay");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const taskInput = document.getElementById("taskInput");
  const deadlineInput = document.getElementById("deadlineInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskList = document.getElementById("taskList");

  const filterSelect = document.getElementById("filterSelect");
  const taskCount = document.getElementById("taskCount");

  let currentUser = null;

  if (localStorage.getItem("currentUser")) {
    currentUser = localStorage.getItem("currentUser");
    showTodo();
    loadTasks();
  }

  loginBtn.addEventListener("click", function () {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          currentUser = username;
          localStorage.setItem("currentUser", username);
          showTodo();
          loadTasks();
        } else {
          alert("Username atau password salah.");
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        alert("Terjadi kesalahan saat login.");
      });
  });

  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    currentUser = null;
    showLogin();
  });

  addTaskBtn.addEventListener("click", function () {
    const text = taskInput.value.trim();
    const deadline = deadlineInput.value;
    if (text && deadline) {
      const task = {
        id: Date.now().toString(),
        text,
        deadline,
        completed: false,
      };
      const tasks = getTasks();
      tasks.push(task);
      saveTasks(tasks);
      renderTasks(tasks);
      taskInput.value = "";
      deadlineInput.value = "";
    }
  });

  filterSelect.addEventListener("change", function () {
    const filter = filterSelect.value;
    localStorage.setItem("filter_" + currentUser, filter);
    renderTasks(getTasks());
  });

  function showLogin() {
    loginSection.classList.remove("hidden");
    todoSection.classList.add("hidden");
    document.body.style.backgroundImage = "url('img/login-bg.png')";
  }

  function showTodo() {
    loginSection.classList.add("hidden");
    todoSection.classList.remove("hidden");
    userDisplay.textContent = currentUser;
    filterSelect.value = localStorage.getItem("filter_" + currentUser) || "all";
    document.body.style.backgroundImage = "url('img/dashboard-bg.png')";
  }

  function getTasks() {
    const tasksJSON = localStorage.getItem("tasks_" + currentUser);
    return tasksJSON ? JSON.parse(tasksJSON) : [];
  }

  function saveTasks(tasks) {
    localStorage.setItem("tasks_" + currentUser, JSON.stringify(tasks));
  }

  function loadTasks() {
    const tasks = getTasks();
    renderTasks(tasks);
  }

  function getRemainingDays(deadline) {
    const today = new Date();
    const dueDate = new Date(deadline);
    const diff = dueDate - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function updateTaskCount(tasks) {
    const total = tasks.length;
    const remaining = tasks.filter((t) => !t.completed).length;
    taskCount.textContent = `Total: ${total}, Belum Selesai: ${remaining}`;
  }

  function renderTasks(tasks) {
    taskList.innerHTML = "";
    const filter = localStorage.getItem("filter_" + currentUser) || "all";
    const filteredTasks = tasks.filter((task) => {
      if (filter === "completed") return task.completed;
      if (filter === "uncompleted") return !task.completed;
      return true;
    });

    filteredTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
      if (task.completed) li.classList.add("completed");

      const remainingDays = getRemainingDays(task.deadline);
      let deadlineLabel = `H-${remainingDays}`;
      if (remainingDays === 0) deadlineLabel = "Hari Ini";
      if (remainingDays < 0) deadlineLabel = "Lewat!";
      
      const deadlineColor = remainingDays < 0 ? "red" : remainingDays === 0 ? "orange" : "green";

      li.innerHTML = `
        <span>
          ${task.text} <small style="color:${deadlineColor}">(${task.deadline} - ${deadlineLabel})</small>
        </span>
        <div>
          <button onclick="toggleTask('${task.id}')">✅</button>
          <button onclick="deleteTask('${task.id}')">🗑️</button>
        </div>
      `;
      taskList.appendChild(li);
    });

    updateTaskCount(tasks);
  }

  window.toggleTask = function (id) {
    const tasks = getTasks();
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTasks(updated);
    renderTasks(updated);
  };

  window.deleteTask = function (id) {
    const tasks = getTasks();
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    renderTasks(updated);
  };
});
