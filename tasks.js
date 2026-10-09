// ============================================
// HABITGO — Rejalar (i18n bilan)
// ============================================

let tasks = [];
let currentTaskFilter = 'active';

function getTaskCategories() {
    return {
        study: { name: t('task_category_study'), icon: '📚', color: '#667eea' },
        work: { name: t('task_category_work'), icon: '💼', color: '#3b82f6' },
        sport: { name: t('task_category_sport'), icon: '💪', color: '#10b981' },
        personal: { name: t('task_category_personal'), icon: '🏠', color: '#f59e0b' },
        other: { name: t('task_category_other'), icon: '📌', color: '#888' }
    };
}

function getTaskPriorities() {
    return {
        low: { name: t('task_priority_low'), icon: '🟢', color: '#10b981' },
        medium: { name: t('task_priority_medium'), icon: '🟡', color: '#f59e0b' },
        high: { name: t('task_priority_high'), icon: '🔴', color: '#ef4444' }
    };
}

// ============================================
// YUKLASH
// ============================================
async function loadTasks() {
    if (!currentUser) { tasks = []; return; }
    try {
        const data = await getTasks(currentUser.id);
        tasks = data.map(t => ({
            id: t.id, name: t.name, desc: t.description,
            deadline: t.deadline, priority: t.priority, category: t.category,
            completed: t.completed, completedAt: t.completed_at, createdAt: t.created_at
        }));
        console.log('[Tasks] Yuklandi:', tasks.length);
    } catch (err) {
        console.error('[Tasks] loadTasks xatosi:', err);
        tasks = [];
    }
}

// ============================================
// SAHIFA
// ============================================
async function showTasks() {
    document.getElementById('tasksPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');
    await loadTasks();
    renderTasksHeader();
    renderTasks();
}

function closeTasks() {
    document.getElementById('tasksPage').style.display = 'none';
}

// ============================================
// HEADER
// ============================================
function renderTasksHeader() {
    const container = document.getElementById('tasksHeader');
    if (!container) return;

    const active = tasks.filter(t => !t.completed).length;
    const today = getTodayStr();
    const todayTasks = tasks.filter(t => !t.completed && t.deadline && t.deadline.split('T')[0] === today).length;
    const overdue = tasks.filter(t => !t.completed && t.deadline && t.deadline.split('T')[0] < today).length;
    const completed = tasks.filter(t => t.completed).length;

    container.innerHTML = `
        <div class="tasks-stat">
            <div class="tasks-stat-value">${active}</div>
            <div class="tasks-stat-label">${t('task_stats_active')}</div>
        </div>
        <div class="tasks-stat">
            <div class="tasks-stat-value">${todayTasks}</div>
            <div class="tasks-stat-label">${t('task_stats_today')}</div>
        </div>
        <div class="tasks-stat ${overdue > 0 ? 'overdue' : ''}">
            <div class="tasks-stat-value">${overdue}</div>
            <div class="tasks-stat-label">${t('task_stats_overdue')}</div>
        </div>
        <div class="tasks-stat">
            <div class="tasks-stat-value">${completed}</div>
            <div class="tasks-stat-label">${t('task_stats_done')}</div>
        </div>
    `;
}

// ============================================
// YANGI VAZIFA
// ============================================
async function addTask() {
    if (!currentUser) { alert('❌ ' + t('alert_signin_required')); return; }

    const name = document.getElementById('taskName').value.trim();
    const desc = document.getElementById('taskDesc').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const priority = document.querySelector('input[name="taskPriority"]:checked').value;
    const category = document.getElementById('taskCategory').value;

    if (!name) { alert('❌ ' + t('alert_enter_habit_name')); return; }

    let deadline = null;
    if (date) deadline = date + (time ? 'T' + time : 'T23:59');

    const btn = document.querySelector('#tasksPage .btn-add');
    const originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        const newTask = await insertTask({
            user_id: currentUser.id, name, description: desc || null,
            deadline, priority, category, completed: false
        });

        tasks.unshift({
            id: newTask.id, name: newTask.name, desc: newTask.description,
            deadline: newTask.deadline, priority: newTask.priority, category: newTask.category,
            completed: newTask.completed, completedAt: newTask.completed_at, createdAt: newTask.created_at
        });

        renderTasks();
        renderTasksHeader();
        resetTaskForm();

        if (typeof updateTasksQuickInfo === 'function') updateTasksQuickInfo();
        if (typeof showToast === 'function') showToast(`✅ "${name}" ${t('task_added')}`);
    } catch (err) {
        console.error('[Tasks] addTask xatosi:', err);
        alert('❌ ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function resetTaskForm() {
    document.getElementById('taskName').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDate').value = '';
    document.getElementById('taskTime').value = '';
    document.querySelector('input[name="taskPriority"][value="medium"]').checked = true;
    document.getElementById('taskCategory').value = 'study';
}

// ============================================
// BELGILASH
// ============================================
async function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const wasCompleted = task.completed;
    task.completed = !wasCompleted;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    renderTasks();
    renderTasksHeader();
    if (typeof updateTasksQuickInfo === 'function') updateTasksQuickInfo();

    try {
        await updateTask(taskId, {
            completed: task.completed,
            completed_at: task.completedAt
        });

        if (task.completed) {
            if (typeof playSound === 'function') playSound('success');
            if (typeof triggerConfetti === 'function') triggerConfetti();
        }
    } catch (err) {
        console.error('[Tasks] toggleTask xatosi:', err);
        task.completed = wasCompleted;
        renderTasks();
        renderTasksHeader();
    }
}

// ============================================
// O'CHIRISH
// ============================================
async function deleteTask(taskId) {
    if (!confirm(t('task_delete_confirm'))) return;
    try {
        const success = await deleteTaskFromDB(taskId);
        if (success) {
            tasks = tasks.filter(t => t.id !== taskId);
            renderTasks();
            renderTasksHeader();
            if (typeof updateTasksQuickInfo === 'function') updateTasksQuickInfo();
        }
    } catch (err) {
        console.error('[Tasks] deleteTask xatosi:', err);
    }
}

// ============================================
// FILTR
// ============================================
function setTaskFilter(filter) {
    currentTaskFilter = filter;
    document.querySelectorAll('.task-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

function getFilteredTasks() {
    const today = getTodayStr();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekStr = dateToStr(weekLater);

    switch (currentTaskFilter) {
        case 'active': return tasks.filter(t => !t.completed);
        case 'today': return tasks.filter(t => !t.completed && t.deadline && t.deadline.split('T')[0] === today);
        case 'week': return tasks.filter(t => !t.completed && t.deadline &&
            t.deadline.split('T')[0] >= today && t.deadline.split('T')[0] <= weekStr);
        case 'done': return tasks.filter(t => t.completed);
        case 'all':
        default: return [...tasks];
    }
}

// ============================================
// RENDER
// ============================================
function renderTasks() {
    const container = document.getElementById('tasksList');
    if (!container) return;

    const filtered = getFilteredTasks();
    const today = getTodayStr();
    const now = new Date();
    const TASK_CATEGORIES = getTaskCategories();
    const TASK_PRIORITIES = getTaskPriorities();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="tasks-empty">
                <div class="tasks-empty-icon">📝</div>
                <p>${t('task_empty')}</p>
                <small>${t('task_empty_hint')}</small>
            </div>
        `;
        return;
    }

    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return b.id - a.id;
    });

    container.innerHTML = filtered.map(task => {
        const category = TASK_CATEGORIES[task.category] || TASK_CATEGORIES.other;
        const priority = TASK_PRIORITIES[task.priority] || TASK_PRIORITIES.medium;

        let deadlineInfo = '';
        let isOverdue = false;
        let isToday = false;
        let isSoon = false;

        if (task.deadline) {
            const dlDate = task.deadline.split('T')[0];
            const dlTime = task.deadline.split('T')[1]?.substring(0, 5) || '23:59';
            const dl = new Date(task.deadline);
            const diffMs = dl - now;
            const diffDays = Math.floor(diffMs / 86400000);
            const diffHours = Math.floor(diffMs / 3600000);

            isOverdue = !task.completed && dlDate < today;
            isToday = dlDate === today;
            isSoon = !task.completed && diffHours >= 0 && diffHours < 24;

            let timeStr = '';
            if (isOverdue) timeStr = t('task_overdue') + ': ' + dlDate;
            else if (isToday) timeStr = t('task_today') + ' ' + (dlTime !== '23:59' ? dlTime : '');
            else if (diffDays === 1) timeStr = t('task_tomorrow') + ' ' + (dlTime !== '23:59' ? dlTime : '');
            else if (diffDays > 0 && diffDays < 7) timeStr = '📅 ' + diffDays + ' ' + t('task_in_days');
            else timeStr = '📅 ' + dlDate;

            deadlineInfo = `<span class="task-deadline ${isOverdue ? 'overdue' : isToday ? 'today' : isSoon ? 'soon' : ''}">${timeStr}</span>`;
        }

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                <button class="task-check ${task.completed ? 'done' : ''}" onclick="toggleTask(${task.id})">
                    ${task.completed ? '✓' : '○'}
                </button>
                <div class="task-content">
                    <div class="task-name">${escapeHtml(task.name)}</div>
                    ${task.desc ? `<div class="task-desc">${escapeHtml(task.desc)}</div>` : ''}
                    <div class="task-meta">
                        <span class="task-category" style="background: ${category.color}15; color: ${category.color};">
                            ${category.name}
                        </span>
                        <span class="task-priority" style="color: ${priority.color};">
                            ${priority.name}
                        </span>
                        ${deadlineInfo}
                    </div>
                </div>
                <button class="task-delete" onclick="deleteTask(${task.id})" title="${t('deleted')}">🗑</button>
            </div>
        `;
    }).join('');
}

function getTodayTasksCount() {
    const today = getTodayStr();
    return tasks.filter(t => !t.completed && t.deadline && t.deadline.split('T')[0] === today).length;
}