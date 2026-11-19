const Store = (() => {
    const TASKS_KEY = 'pwa_prod_tasks_v2';
    const LOGS_KEY = 'pwa_prod_logs_v2';
    const PROFILE_KEY = 'pwa_prod_profile_v2';

    const formatLocalISO = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getTodayISO = () => formatLocalISO(new Date());

    const getProfile = () => {
        try {
            const raw = localStorage.getItem(PROFILE_KEY);
            return raw ? JSON.parse(raw) : { name: '' };
        } catch (error) {
            return { name: '' };
        }
    };

    const saveProfile = (name) => {
        const cleanName = String(name || '').trim();
        const profile = { name: cleanName };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        return profile;
    };

    const seedInitialTasks = () => {
        const today = getTodayISO();
        const initialTasks = [
            {
                id: 'task-101',
                title: 'Practice English',
                category: 'Communication',
                scheduledTime: '08:30',
                date: today,
                description: 'Improve spoken English fluency, vocabulary, and technical interview answers.',
                spentSeconds: 0,
                subtasks: [
                    { id: 'st-1', text: 'Task 1: Read 2 tech articles aloud', done: true },
                    { id: 'st-2', text: 'Task 2: Practice self-introduction', done: false },
                    { id: 'st-3', text: 'Task 3: Learn 10 new action verbs', done: false }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 'task-102',
                title: 'Python Coding Practice',
                category: 'Coding',
                scheduledTime: '10:00',
                date: today,
                description: 'Solve list comprehension, loops, and data structure problems.',
                spentSeconds: 0,
                subtasks: [
                    { id: 'st-4', text: 'Task 1: List slicing & methods', done: false },
                    { id: 'st-5', text: 'Task 2: Dictionary manipulation', done: false },
                    { id: 'st-6', text: 'Task 3: Build mini CLI script', done: false }
                ],
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(TASKS_KEY, JSON.stringify(initialTasks));
        return initialTasks;
    };

    const getTasks = () => {
        try {
            const raw = localStorage.getItem(TASKS_KEY);
            if (!raw) return seedInitialTasks();
            return JSON.parse(raw);
        } catch (error) {
            console.error('Error reading tasks:', error);
            return [];
        }
    };

    const saveTasks = (tasks) => {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    };

    const upsertTask = (taskData) => {
        const tasks = getTasks();
        const index = tasks.findIndex((t) => t.id === taskData.id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
        } else {
            tasks.unshift({
                id: 'task-' + Date.now(),
                title: taskData.title || 'Untitled Task',
                category: taskData.category || 'General',
                scheduledTime: taskData.scheduledTime || '09:30',
                date: taskData.date || getTodayISO(),
                description: taskData.description || '',
                spentSeconds: 0,
                subtasks: taskData.subtasks || [],
                createdAt: new Date().toISOString()
            });
        }
        saveTasks(tasks);
        return getTasks();
    };

    const deleteTask = (taskId) => {
        const filtered = getTasks().filter((t) => t.id !== taskId);
        saveTasks(filtered);
    };

    const addTaskTime = (taskId, seconds) => {
        const tasks = getTasks();
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
            task.spentSeconds = (task.spentSeconds || 0) + seconds;
            saveTasks(tasks);
        }
    };

    const getTaskProgress = (task) => {
        if (!task.subtasks || task.subtasks.length === 0) return 0;
        const completedCount = task.subtasks.filter((s) => s.done).length;
        return Math.round((completedCount / task.subtasks.length) * 100);
    };

    const getLogs = () => {
        try {
            return JSON.parse(localStorage.getItem(LOGS_KEY)) || [];
        } catch (error) {
            return [];
        }
    };

    const addLog = ({ taskId, taskTitle, category, durationSeconds }) => {
        const logs = getLogs();
        const now = new Date();
        logs.unshift({
            id: 'log-' + Date.now(),
            taskId,
            taskTitle,
            category,
            durationSeconds,
            date: formatLocalISO(now),
            loggedAt: now.toISOString()
        });
        localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    };

    const clearLogs = () => {
        localStorage.removeItem(LOGS_KEY);
    };

    const getActiveDatesSet = () => {
        const dates = new Set();
        getLogs().forEach((log) => {
            if (log.date) dates.add(log.date);
        });
        getTasks().forEach((task) => {
            if (getTaskProgress(task) > 0 && task.date) {
                dates.add(task.date);
            }
        });
        return dates;
    };

    const getConsecutiveStreak = () => {
        const activeDates = getActiveDatesSet();
        const cursor = new Date();
        const todayISO = formatLocalISO(cursor);

        if (!activeDates.has(todayISO)) {
            cursor.setDate(cursor.getDate() - 1);
            if (!activeDates.has(formatLocalISO(cursor))) {
                return 0;
            }
        }

        let streak = 0;
        while (activeDates.has(formatLocalISO(cursor))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    };

    return {
        getTodayISO,
        getProfile,
        saveProfile,
        getTasks,
        upsertTask,
        deleteTask,
        addTaskTime,
        getTaskProgress,
        getLogs,
        addLog,
        clearLogs,
        getActiveDatesSet,
        getConsecutiveStreak
    };
})();