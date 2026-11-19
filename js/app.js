document.addEventListener('DOMContentLoaded', () => {
    let activeTaskId = null;
    let editingTaskId = null;
    let draftSubtasks = [];
    let selectedDate = Store.getTodayISO();

    // DOM References
    const toastContainer = document.getElementById('toast-container');
    const views = document.querySelectorAll('.screen-view');
    const dockBtns = document.querySelectorAll('.dock-btn[data-view]');

    // Profile Elements
    const profileModal = document.getElementById('profile-modal');
    const profileForm = document.getElementById('profile-form');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    const userAvatarInitial = document.getElementById('user-avatar-initial');
    const userDisplayName = document.getElementById('user-display-name');

    // Home View Elements
    const streakBadge = document.getElementById('streak-badge');
    const goalCarousel = document.getElementById('goal-cards-carousel');
    const activeTagsGroup = document.getElementById('active-tags-group');
    const activeScheduleLabel = document.getElementById('active-schedule-label');
    const activeTaskTitle = document.getElementById('active-task-title');
    const activeTaskDesc = document.getElementById('active-task-desc');
    const timerClock = document.getElementById('timer-clock');
    const startBtn = document.getElementById('start-timer-btn');
    const pauseBtn = document.getElementById('pause-timer-btn');
    const stopBtn = document.getElementById('stop-timer-btn');

    // Schedule View Elements
    const weekStrip = document.getElementById('week-strip');
    const timelineList = document.getElementById('timeline-list');
    const todayTaskCount = document.getElementById('today-task-count');
    const searchInput = document.getElementById('schedule-search-input');
    const currentMonthLabel = document.getElementById('current-month-label');

    // Detail View Elements
    const detailTitleInput = document.getElementById('detail-title-input');
    const detailCategoryInput = document.getElementById('detail-category-input');
    const detailTimeInput = document.getElementById('detail-time-input');
    const detailDateInput = document.getElementById('detail-date-input');
    const detailDescInput = document.getElementById('detail-desc-input');
    const detailRingCircle = document.getElementById('detail-ring-circle');
    const detailRingText = document.getElementById('detail-ring-text');
    const newSubtaskInput = document.getElementById('new-subtask-input');
    const subtaskChecklist = document.getElementById('subtask-checklist');

    // History & Modals
    const historyLogsList = document.getElementById('history-logs-list');
    const statTotalSessions = document.getElementById('stat-total-sessions');
    const statTotalTime = document.getElementById('stat-total-time');
    const notifModal = document.getElementById('notification-modal');
    const notifList = document.getElementById('notif-list');
    const notifStatusLine = document.getElementById('notif-status-line');
    const calendarModal = document.getElementById('calendar-modal');
    const monthlyGrid = document.getElementById('monthly-calendar-grid');
    const calendarMonthTitle = document.getElementById('calendar-month-title');

    // Toast Notification Helper
    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 2400);
    };

    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    };

    // Profile & Avatar Initial Renderer
    const getInitialChar = (name) => {
        const trimmed = (name || '').trim();
        return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
    };

    const renderProfile = () => {
        const profile = Store.getProfile();
        const displayName = profile.name || 'Your Name';
        const initial = getInitialChar(profile.name);

        userDisplayName.textContent = displayName;
        userAvatarInitial.textContent = initial;
        profileAvatarPreview.textContent = initial;
    };

    const openProfileModal = () => {
        const profile = Store.getProfile();
        profileNameInput.value = profile.name || '';
        profileAvatarPreview.textContent = getInitialChar(profile.name);
        profileModal.classList.remove('hidden');
        setTimeout(() => profileNameInput.focus(), 80);
    };

    // Navigation Switcher
    const switchView = (viewId) => {
        views.forEach((v) => v.classList.toggle('hidden', v.id !== viewId));
        dockBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.view === viewId));

        if (viewId === 'home-view') renderHome();
        if (viewId === 'schedule-view') renderSchedule();
        if (viewId === 'history-view') renderHistory();
    };

    // SVG Ring Calculator
    const buildRingSVG = (percent) => {
        const radius = 17;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        return `
            <div class="progress-ring-wrap">
                <svg class="progress-ring" width="44" height="44">
                    <circle class="ring-bg" cx="22" cy="22" r="${radius}"></circle>
                    <circle class="ring-fill" cx="22" cy="22" r="${radius}"
                        style="stroke-dasharray:${circumference}; stroke-dashoffset:${offset};"></circle>
                </svg>
                <span class="ring-text">${percent}%</span>
            </div>
        `;
    };

    // Update Consecutive Streak & Focus Badge
    const updateStreakHeader = () => {
        const streakDays = Store.getConsecutiveStreak();
        const totalSecs = Store.getLogs().reduce((acc, l) => acc + l.durationSeconds, 0);
        const mins = Math.floor(totalSecs / 60);
        streakBadge.textContent = `🔥 ${streakDays} Day Streak • ${mins}m`;
    };

    // Load Task into Active Timer Card
    const setActiveTask = (taskId) => {
        if (Timer.getStatus() || Timer.getElapsedSeconds() > 0) {
            showToast('⚠️ Finish or pause current timer first');
            return;
        }
        const task = Store.getTasks().find((t) => t.id === taskId);
        if (!task) return;

        activeTaskId = task.id;
        activeTaskTitle.textContent = task.title;
        activeTaskDesc.textContent = task.description || 'Ready to focus on this task.';
        activeScheduleLabel.textContent = task.scheduledTime || 'Today';
        activeTagsGroup.innerHTML = `
            <span class="soft-pill">${escapeHTML(task.category)}</span>
            <span class="soft-pill">${Store.getTaskProgress(task)}% Done</span>
        `;
        timerClock.textContent = '00:00:00';
        syncTimerControls('idle');
    };

    const syncTimerControls = (state) => {
        if (state === 'idle') {
            startBtn.disabled = !activeTaskId;
            startBtn.textContent = 'Start';
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        } else if (state === 'running') {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        } else if (state === 'paused') {
            startBtn.disabled = false;
            startBtn.textContent = 'Resume';
            pauseBtn.disabled = true;
            stopBtn.disabled = false;
        }
    };

    // Render Home View
    const renderHome = () => {
        renderProfile();
        updateStreakHeader();
        const tasks = Store.getTasks();
        if (!activeTaskId && tasks.length > 0) {
            setActiveTask(tasks[0].id);
        }

        goalCarousel.innerHTML = '';
        tasks.forEach((task) => {
            const pct = Store.getTaskProgress(task);
            const loggedMins = Math.round((task.spentSeconds || 0) / 60);
            const card = document.createElement('div');
            card.className = `goal-card ${task.id === activeTaskId ? 'selected' : ''}`;
            card.innerHTML = `
                <div>
                    <div class="goal-card-top">
                        <div class="goal-icon-box">📘</div>
                        ${buildRingSVG(pct)}
                    </div>
                    <h3>${escapeHTML(task.title)}</h3>
                    <p>${escapeHTML(task.description || 'Tap to view checklist & topics')}</p>
                </div>
                <div class="goal-card-footer">
                    <span>✓ ${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length} Topics</span>
                    <span>⏱ ${loggedMins}m</span>
                </div>
            `;
            card.addEventListener('click', () => openTaskDetail(task.id));
            goalCarousel.appendChild(card);
        });
    };

    // Render Schedule View
    const renderSchedule = () => {
        const dObj = new Date(selectedDate + 'T00:00:00');
        currentMonthLabel.textContent = dObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        weekStrip.innerHTML = '';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = -3; i <= 3; i++) {
            const d = new Date(dObj);
            d.setDate(dObj.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const btn = document.createElement('button');
            btn.className = `day-pill ${iso === selectedDate ? 'active' : ''}`;
            btn.innerHTML = `
                <span>${dayNames[d.getDay()]}</span>
                <span class="day-num-circle">${d.getDate()}</span>
            `;
            btn.addEventListener('click', () => {
                selectedDate = iso;
                renderSchedule();
            });
            weekStrip.appendChild(btn);
        }

        const query = searchInput.value.trim().toLowerCase();
        const tasks = Store.getTasks().filter((t) => {
            const matchesDate = t.date === selectedDate;
            const matchesSearch = !query || t.title.toLowerCase().includes(query) || t.category.toLowerCase().includes(query);
            return matchesDate && matchesSearch;
        });

        todayTaskCount.textContent = String(tasks.length).padStart(2, '0');
        timelineList.innerHTML = '';

        if (tasks.length === 0) {
            timelineList.innerHTML = `<p class="modal-subtext" style="text-align:center; padding:20px;">No tasks scheduled for this date. Tap + below to add one.</p>`;
            return;
        }

        tasks.forEach((task) => {
            const isHighlighted = task.id === activeTaskId;
            const pct = Store.getTaskProgress(task);
            const row = document.createElement('div');
            row.className = 'timeline-row';
            row.innerHTML = `
                <div class="timeline-time">${escapeHTML(task.scheduledTime || '09:30')}</div>
                <div class="timeline-card ${isHighlighted ? 'highlighted' : ''}">
                    <div class="timeline-card-top">
                        <h3>${escapeHTML(task.title)}</h3>
                        <span>${pct}%</span>
                    </div>
                    <p>${escapeHTML(task.description || task.category)}</p>
                    <div class="timeline-card-actions">
                        <span>${escapeHTML(task.category)} • ${task.subtasks.length} steps</span>
                        <button class="pill-btn sm ${isHighlighted ? 'pill-sage' : 'pill-emerald'} focus-now-btn">Focus</button>
                    </div>
                </div>
            `;
            row.querySelector('.focus-now-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                setActiveTask(task.id);
                switchView('home-view');
                showToast(`🎯 Loaded "${task.title}" into timer`);
            });
            row.querySelector('.timeline-card').addEventListener('click', () => openTaskDetail(task.id));
            timelineList.appendChild(row);
        });
    };

    // Open Task Detail / Create View
    const openTaskDetail = (taskId = null) => {
        editingTaskId = taskId;
        if (taskId) {
            const task = Store.getTasks().find((t) => t.id === taskId);
            if (!task) return;
            detailTitleInput.value = task.title;
            detailCategoryInput.value = task.category;
            detailTimeInput.value = task.scheduledTime || '09:30';
            detailDateInput.value = task.date || selectedDate;
            detailDescInput.value = task.description || '';
            draftSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
        } else {
            detailTitleInput.value = '';
            detailCategoryInput.value = 'Study';
            detailTimeInput.value = '10:00';
            detailDateInput.value = selectedDate;
            detailDescInput.value = '';
            draftSubtasks = [
                { id: 'st-' + Date.now(), text: 'Task 1: Core concept revision', done: false }
            ];
        }
        renderSubtaskChecklist();
        switchView('detail-view');
    };

    const renderSubtaskChecklist = () => {
        const doneCount = draftSubtasks.filter((s) => s.done).length;
        const pct = draftSubtasks.length === 0 ? 0 : Math.round((doneCount / draftSubtasks.length) * 100);

        const radius = 21;
        const circumference = 2 * Math.PI * radius;
        detailRingCircle.style.strokeDasharray = circumference;
        detailRingCircle.style.strokeDashoffset = circumference - (pct / 100) * circumference;
        detailRingText.textContent = `${pct}%`;

        subtaskChecklist.innerHTML = '';
        draftSubtasks.forEach((st, idx) => {
            const li = document.createElement('li');
            li.className = `subtask-item ${st.done ? 'done' : ''}`;
            li.innerHTML = `
                <div class="subtask-left">
                    <span class="check-circle">${st.done ? '✓' : ''}</span>
                    <span>${escapeHTML(st.text)}</span>
                </div>
                <button type="button" class="subtask-del" aria-label="Remove">✕</button>
            `;
            li.querySelector('.subtask-left').addEventListener('click', () => {
                draftSubtasks[idx].done = !draftSubtasks[idx].done;
                renderSubtaskChecklist();
            });
            li.querySelector('.subtask-del').addEventListener('click', (e) => {
                e.stopPropagation();
                draftSubtasks.splice(idx, 1);
                renderSubtaskChecklist();
            });
            subtaskChecklist.appendChild(li);
        });
    };

    // Render History View
    const renderHistory = () => {
        const logs = Store.getLogs();
        const totalSecs = logs.reduce((sum, l) => sum + l.durationSeconds, 0);
        statTotalSessions.textContent = logs.length;
        statTotalTime.textContent = `${Math.floor(totalSecs / 60)}m ${totalSecs % 60}s`;

        historyLogsList.innerHTML = '';
        if (logs.length === 0) {
            historyLogsList.innerHTML = `<li class="modal-subtext" style="text-align:center; padding:16px;">No focus sessions saved yet. Start a timer on the Home screen!</li>`;
            return;
        }

        logs.forEach((log) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <div>
                    <strong style="font-size:0.9rem;">${escapeHTML(log.taskTitle)}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(log.category)} • ${log.date}</div>
                </div>
                <span class="streak-pill">${Timer.formatTime(log.durationSeconds)}</span>
            `;
            historyLogsList.appendChild(li);
        });
    };

    // Monthly Calendar Progress Modal
    const openMonthlyCalendar = () => {
        const dObj = new Date(selectedDate + 'T00:00:00');
        const year = dObj.getFullYear();
        const month = dObj.getMonth();
        calendarMonthTitle.textContent = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const activeDates = Store.getActiveDatesSet();

        monthlyGrid.innerHTML = '';
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty';
            monthlyGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const cell = document.createElement('div');
            cell.className = `cal-day-cell ${activeDates.has(iso) ? 'has-progress' : ''}`;
            cell.textContent = day;
            cell.addEventListener('click', () => {
                selectedDate = iso;
                calendarModal.classList.add('hidden');
                switchView('schedule-view');
            });
            monthlyGrid.appendChild(cell);
        }

        calendarModal.classList.remove('hidden');
    };

    // Profile Modal Events
    document.getElementById('edit-profile-trigger').addEventListener('click', openProfileModal);
    document.getElementById('edit-name-trigger').addEventListener('click', openProfileModal);
    document.getElementById('close-profile-btn').addEventListener('click', () => profileModal.classList.add('hidden'));

    profileNameInput.addEventListener('input', () => {
        profileAvatarPreview.textContent = getInitialChar(profileNameInput.value);
    });

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredName = profileNameInput.value.trim();
        if (!enteredName) return;
        Store.saveProfile(enteredName);
        renderProfile();
        profileModal.classList.add('hidden');
        showToast(`👋 Welcome, ${enteredName}!`);
    });

    // Streak Pill Click -> Open Monthly Streak Calendar
    streakBadge.addEventListener('click', openMonthlyCalendar);

    // Timer Button Events
    startBtn.addEventListener('click', () => {
        if (!activeTaskId) return;
        Timer.start((formatted) => {
            timerClock.textContent = formatted;
        });
        syncTimerControls('running');
        showToast('⏱ Focus timer started');
    });

    pauseBtn.addEventListener('click', () => {
        Timer.pause();
        syncTimerControls('paused');
        showToast('⏸ Timer paused');
    });

    stopBtn.addEventListener('click', () => {
        const elapsed = Timer.stop();
        timerClock.textContent = '00:00:00';
        syncTimerControls('idle');

        if (elapsed > 0 && activeTaskId) {
            const task = Store.getTasks().find((t) => t.id === activeTaskId);
            if (task) {
                Store.addTaskTime(task.id, elapsed);
                Store.addLog({
                    taskId: task.id,
                    taskTitle: task.title,
                    category: task.category,
                    durationSeconds: elapsed
                });
                renderHome();
                showToast(`✅ Saved ${Timer.formatTime(elapsed)} to History!`);
            }
        } else {
            showToast('ℹ️ Run timer for at least 1 second to save');
        }
    });

    // Detail View Events
    document.getElementById('add-subtask-btn').addEventListener('click', () => {
        const text = newSubtaskInput.value.trim();
        if (!text) return;
        draftSubtasks.push({ id: 'st-' + Date.now(), text, done: false });
        newSubtaskInput.value = '';
        renderSubtaskChecklist();
    });

    document.getElementById('save-detail-btn').addEventListener('click', () => {
        const title = detailTitleInput.value.trim();
        if (!title) {
            showToast('⚠️ Please enter a task title');
            return;
        }
        Store.upsertTask({
            id: editingTaskId,
            title,
            category: detailCategoryInput.value.trim() || 'General',
            scheduledTime: detailTimeInput.value || '09:30',
            date: detailDateInput.value || selectedDate,
            description: detailDescInput.value.trim(),
            subtasks: draftSubtasks
        });
        showToast('✅ Task & progress saved!');
        switchView('home-view');
    });

    document.getElementById('delete-task-btn').addEventListener('click', () => {
        if (!editingTaskId) {
            switchView('home-view');
            return;
        }
        if (confirm('Delete this task?')) {
            if (activeTaskId === editingTaskId) {
                Timer.reset();
                activeTaskId = null;
            }
            Store.deleteTask(editingTaskId);
            showToast('🗑 Task deleted');
            switchView('home-view');
        }
    });

    // Navigation & Modal Listeners
    dockBtns.forEach((btn) => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    document.querySelectorAll('.nav-back-home').forEach((btn) => {
        btn.addEventListener('click', () => switchView('home-view'));
    });

    document.getElementById('detail-back-btn').addEventListener('click', () => switchView('home-view'));
    document.getElementById('dock-new-task-btn').addEventListener('click', () => openTaskDetail(null));
    document.getElementById('quick-add-btn').addEventListener('click', () => openTaskDetail(null));
    searchInput.addEventListener('input', renderSchedule);

    document.getElementById('open-calendar-btn').addEventListener('click', openMonthlyCalendar);
    document.getElementById('close-calendar-btn').addEventListener('click', () => calendarModal.classList.add('hidden'));

    document.getElementById('notif-bell-btn').addEventListener('click', () => {
        const userName = Store.getProfile().name || 'Friend';
        notifStatusLine.textContent = navigator.onLine ? '● Online & Offline Cached' : '● Offline Mode Active';
        const logs = Store.getLogs().slice(0, 5);
        notifList.innerHTML = logs.length
            ? logs.map((l) => `<li class="notif-item">✅ Completed <strong>${Timer.formatTime(l.durationSeconds)}</strong> on <em>${escapeHTML(l.taskTitle)}</em></li>`).join('')
            : `<li class="notif-item">👋 Welcome ${escapeHTML(userName)}! Start your first focus session today.</li>`;
        notifModal.classList.remove('hidden');
    });

    document.getElementById('close-notif-btn').addEventListener('click', () => notifModal.classList.add('hidden'));

    document.getElementById('clear-history-btn').addEventListener('click', () => {
        if (confirm('Clear all focus logs?')) {
            Store.clearLogs();
            renderHistory();
            updateStreakHeader();
            showToast('🧹 History cleared');
        }
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch((err) => console.error('SW Error:', err));
    }

    // Initial Load & First-Time User Prompt
    renderHome();
    if (!Store.getProfile().name) {
        openProfileModal();
    }
});