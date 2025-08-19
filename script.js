// --- DOM Elements ---
const themeToggle = document.getElementById('themeToggle');
const workDurationSlider = document.getElementById('workDuration');
const breakDurationSlider = document.getElementById('breakDuration');
const workDurationValue = document.getElementById('workDurationValue');
const breakDurationValue = document.getElementById('breakDurationValue');
const timerDisplay = document.getElementById('timerDisplay');
const timeLeft = document.getElementById('timeLeft');
const sessionType = document.getElementById('sessionType');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const clearStatsBtn = document.getElementById('clearStatsBtn');
const progressRing = document.getElementById('progressRing');
const sessionsToday = document.getElementById('sessionsToday');
const focusTimeToday = document.getElementById('focusTimeToday');
const breakTimeToday = document.getElementById('breakTimeToday');
const allTimeSessions = document.getElementById('allTimeSessions');
const workCompleteSound = document.getElementById('workCompleteSound');
const breakCompleteSound = document.getElementById('breakCompleteSound');

// --- Task Panel DOM Elements ---
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskDue = document.getElementById('taskDue');
const taskPriority = document.getElementById('taskPriority');
const taskCompleted = document.getElementById('taskCompleted');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksUl = document.getElementById('tasksUl');
const tasksEmpty = document.getElementById('tasksEmpty');

// --- Timer State ---
let timer = {
  workDuration: 25,
  breakDuration: 5,
  timeRemaining: 25 * 60,
  isRunning: false,
  isPaused: false,
  isWorkSession: true,
  interval: null,
  totalCircumference: 2 * Math.PI * 117,
};

// --- Statistics ---
let stats = {
  sessionsToday: 0,
  focusTimeToday: 0,
  breakTimeToday: 0,
  allTimeSessions: 0,
  lastDate: new Date().toLocaleDateString()
};

// --- Task Panel State ---
let tasks = JSON.parse(localStorage.getItem('pomodoroTasksV2') || '[]');

// --- Initialization ---
function init() {
  loadSettings();
  loadStats();
  updateTimerDisplay();
  updateStatistics();
  setupEventListeners();
  checkNotificationPermission();
  resetDailyStatsIfNewDay();
  renderTasks();
}

function loadSettings() {
  const savedSettings = localStorage.getItem('pomodoroSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    timer.workDuration = settings.workDuration || 25;
    timer.breakDuration = settings.breakDuration || 5;

    workDurationSlider.value = timer.workDuration;
    breakDurationSlider.value = timer.breakDuration;
    workDurationValue.textContent = timer.workDuration;
    breakDurationValue.textContent = timer.breakDuration;

    if (settings.darkMode) {
      document.body.classList.replace('light', 'dark');
      themeToggle.checked = true;
    }
  }
  timer.timeRemaining = timer.workDuration * 60;
}

function loadStats() {
  const savedStats = localStorage.getItem('pomodoroStats');
  if (savedStats) {
    stats = { ...stats, ...JSON.parse(savedStats) };
  }
}

function saveSettings() {
  const settings = {
    workDuration: timer.workDuration,
    breakDuration: timer.breakDuration,
    darkMode: document.body.classList.contains('dark')
  };
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

function saveStats() {
  localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

function checkNotificationPermission() {
  if (Notification && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

function resetDailyStatsIfNewDay() {
  const today = new Date().toLocaleDateString();
  if (stats.lastDate !== today) {
    stats.sessionsToday = 0;
    stats.focusTimeToday = 0;
    stats.breakTimeToday = 0;
    stats.lastDate = today;
    saveStats();
    updateStatistics();
  }
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(timer.timeRemaining / 60)).padStart(2, '0');
  const seconds = String(timer.timeRemaining % 60).padStart(2, '0');
  timeLeft.textContent = `${minutes}:${seconds}`;

  sessionType.textContent = timer.isWorkSession ? 'Work Session' : 'Break Session';
  timerDisplay.classList.toggle('work', timer.isWorkSession);
  timerDisplay.classList.toggle('break', !timer.isWorkSession);
  progressRing.setAttribute('stroke', timer.isWorkSession ? '#ff6347' : '#4CAF50');

  const totalSeconds = timer.isWorkSession ? timer.workDuration * 60 : timer.breakDuration * 60;
  const dashoffset = timer.totalCircumference * (1 - timer.timeRemaining / totalSeconds);
  progressRing.style.strokeDasharray = timer.totalCircumference;
  progressRing.style.strokeDashoffset = dashoffset;
}

function updateStatistics() {
  sessionsToday.textContent = stats.sessionsToday;
  focusTimeToday.textContent = `${stats.focusTimeToday}m`;
  breakTimeToday.textContent = `${stats.breakTimeToday}m`;
  allTimeSessions.textContent = stats.allTimeSessions;
}

function startTimer() {
  if (!timer.isRunning) {
    timer.isRunning = true;
    timer.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i> Pause';
    workDurationSlider.disabled = true;
    breakDurationSlider.disabled = true;
    timer.interval = setInterval(updateTimer, 1000);
    timerDisplay.classList.add('pulse');
  }
}

function updateTimer() {
  if (timer.timeRemaining > 0) {
    timer.timeRemaining--;
    updateTimerDisplay();
  } else {
    clearInterval(timer.interval);
    if (timer.isWorkSession) {
      stats.sessionsToday++;
      stats.allTimeSessions++;
      stats.focusTimeToday += timer.workDuration;
      sendNotification('Work session completed!', 'Time for a break!');
      playSound(workCompleteSound);
      timer.isWorkSession = false;
      timer.timeRemaining = timer.breakDuration * 60;
    } else {
      stats.breakTimeToday += timer.breakDuration;
      sendNotification('Break time over!', 'Ready to focus again?');
      playSound(breakCompleteSound);
      timer.isWorkSession = true;
      timer.timeRemaining = timer.workDuration * 60;
      timer.isRunning = false;
      startBtn.disabled = false;
    }
    saveStats();
    updateStatistics();
    updateTimerDisplay();
    timer.isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    workDurationSlider.disabled = false;
    breakDurationSlider.disabled = false;
    timerDisplay.classList.remove('pulse');
  }
}

function pauseTimer() {
  clearInterval(timer.interval);
  timer.isPaused = true;
  timer.isRunning = false;
  startBtn.disabled = false;
  pauseBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Resume';
  timerDisplay.classList.remove('pulse');
}

function resumeTimer() {
  if (timer.isPaused) {
    timer.isRunning = true;
    timer.isPaused = false;
    startBtn.disabled = true;
    pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i> Pause';
    timer.interval = setInterval(updateTimer, 1000);
    timerDisplay.classList.add('pulse');
  }
}

function resetTimer() {
  clearInterval(timer.interval);
  timer.isRunning = false;
  timer.isPaused = false;
  timer.isWorkSession = true;
  timer.timeRemaining = timer.workDuration * 60;
  updateTimerDisplay();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i> Pause';
  workDurationSlider.disabled = false;
  breakDurationSlider.disabled = false;
  timerDisplay.classList.remove('pulse');
}

function sendNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

// --- Unlock Audio ---
workCompleteSound.muted = false;
workCompleteSound.volume = 1;
breakCompleteSound.muted = false;
breakCompleteSound.volume = 1;

function unlockAudio() {
  [workCompleteSound, breakCompleteSound].forEach(audio => {
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(err => {
      console.warn("Unlock failed for", audio.id, err);
    });
  });
}

document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("touchstart", unlockAudio, { once: true });

function playSound(audioElement) {
  audioElement.currentTime = 0;
  audioElement.play().catch(err => {
    console.warn("Playback blocked for", audioElement.id, err);
  });
}

function setupEventListeners() {
  themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
    saveSettings();
  });

  workDurationSlider.addEventListener('input', () => {
    timer.workDuration = parseInt(workDurationSlider.value, 10);
    workDurationValue.textContent = timer.workDuration;
    timer.timeRemaining = timer.workDuration * 60;
    saveSettings();
    updateTimerDisplay();
  });

  breakDurationSlider.addEventListener('input', () => {
    timer.breakDuration = parseInt(breakDurationSlider.value, 10);
    breakDurationValue.textContent = timer.breakDuration;
    saveSettings();
    updateTimerDisplay();
  });

  startBtn.addEventListener('click', () => {
    //playSound(workCompleteSound);
    //playSound(breakCompleteSound);
    startTimer();
  });

  pauseBtn.addEventListener('click', () => {
    if (timer.isRunning) {
      pauseTimer();
    } else if (timer.isPaused) {
      resumeTimer();
    }
  });

  resetBtn.addEventListener('click', resetTimer);

  clearStatsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all statistics?')) {
      stats = {
        sessionsToday: 0,
        focusTimeToday: 0,
        breakTimeToday: 0,
        allTimeSessions: 0,
        lastDate: new Date().toLocaleDateString()
      };
      saveStats();
      updateStatistics();
    }
  });

  addTaskBtn && addTaskBtn.addEventListener('click', addTask);
  taskTitle && taskTitle.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') addTask();
  });
}

// --- Task Panel Functions ---
function renderTasks() {
  if (!tasksUl || !tasksEmpty) return;
  tasksUl.innerHTML = '';
  if (tasks.length === 0) {
    tasksEmpty.style.display = 'block';
    return;
  }
  tasksEmpty.style.display = 'none';
  tasks.forEach((task, idx) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.className = 'mr-2';
    checkbox.onchange = () => toggleTaskCompleted(idx);

    const info = document.createElement('div');
    info.style.flex = '1';
    info.innerHTML = `<strong>${task.title}</strong><br>
      <span style="font-size:0.95em;">${task.desc || ''}</span>
      <div style="font-size:0.85em;color:#888;">
        ${task.due ? 'Due: ' + task.due : ''} ${task.priority ? '| ' + task.priority : ''}
      </div>`;

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.onclick = () => deleteTask(idx);

    li.appendChild(checkbox);
    li.appendChild(info);
    li.appendChild(delBtn);
    tasksUl.appendChild(li);
  });
}

function addTask() {
  if (!taskTitle) return;
  const title = taskTitle.value.trim();
  if (!title) return;
  tasks.push({
    title,
    desc: taskDesc ? taskDesc.value.trim() : '',
    due: taskDue ? taskDue.value : '',
    priority: taskPriority ? taskPriority.value : 'Medium',
    completed: taskCompleted ? taskCompleted.checked : false
  });
  localStorage.setItem('pomodoroTasksV2', JSON.stringify(tasks));
  renderTasks();
  taskTitle.value = '';
  if (taskDesc) taskDesc.value = '';
  if (taskDue) taskDue.value = '';
  if (taskPriority) taskPriority.value = 'Medium';
  if (taskCompleted) taskCompleted.checked = false;
}

function deleteTask(idx) {
  tasks.splice(idx, 1);
  localStorage.setItem('pomodoroTasksV2', JSON.stringify(tasks));
  renderTasks();
}

function toggleTaskCompleted(idx) {
  tasks[idx].completed = !tasks[idx].completed;
  localStorage.setItem('pomodoroTasksV2', JSON.stringify(tasks));
  renderTasks();
}

init();
