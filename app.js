// ============================================
// HABITGO — Asosiy mantiq (i18n bilan)
// ============================================

let habits = [];
let habitsLoaded = false;
let lastReportDate = localStorage.getItem('habitgo_last_report') || null;

const praiseMessages = [
    "Zo'r ketayapsan! 🔥", "Sen haqiqiy qahramonsan! 💪",
    "Ajoyib intizom! Davom et! ⭐", "Bugun sen g'olibsан! 🏆", "Shu tarzda davom et! 🚀"
];

const encourageMessages = [
    "Bugun biroz qiyin bo'ldi, lekin ertaga yaxshiroq bo'ladi! 💪",
    "To'xtama! Har bir qadam muhim! 🌱", "Kichik qadamlar katta natijalar beradi! 🚀",
    "Sen qila olasan! Ertaga yangi imkoniyat! ✨", "Muvaffaqiyat — bu qayta urinishlar soni! 🎯"
];

const allMotivations = [
    "Bugun ajoyib kun bo'ladi! ✨", "Kichik qadamlar katta natijalarga olib keladi! 🚀",
    "Sen bugun kechagidan yaxshiroqsan! 💪", "Intizom — erkinlikdir! 🎯",
    "Har kuni 1% yaxshilanish = yiliga 37x o'sish! 📈", "Sen qila olasan! Faqat boshla! 🔥",
    "Muvaffaqiyat — bu odatlar yig'indisi! ⭐", "Bugun qilgan mehnating — ertangi muvaffaqiyating! 🌟",
    "To'xtama! Sen zo'r ketayapsan! 💫", "Kichik odatlar, katta o'zgarishlar! 🌱"
];

// ============================================
// INIT
// ============================================
async function initApp() {
    console.log('[App] initApp');
    showLoadingState(true);

    try {
        await loadBadges();
        await migrateLocalDataIfNeeded();
        await loadHabits();

        showCurrentDate();
        showMotivation();
        checkDailyReport();
        renderHabits();
        updateStats();
        checkPremiumLimit();

        if (typeof renderChallenge === 'function') renderChallenge();
        if (typeof loadTasks === 'function') await loadTasks();
        if (typeof updateTasksQuickInfo === 'function') updateTasksQuickInfo();
    } catch (err) {
        console.error('[App] Xato:', err);
    } finally {
        showLoadingState(false);
    }

    const allDaysEl = document.getElementById('allDays');
    if (allDaysEl && !allDaysEl.dataset.listenerAttached) {
        allDaysEl.dataset.listenerAttached = 'true';
        allDaysEl.addEventListener('change', (e) => {
            document.querySelectorAll('.day').forEach(cb => {
                cb.checked = false;
                cb.disabled = e.target.checked;
            });
        });
        document.querySelectorAll('.day').forEach(cb => {
            cb.disabled = allDaysEl.checked;
        });
    }

    if (!window.habitgoInterval) {
        window.habitgoInterval = setInterval(() => {
            checkDailyReport();
            renderHabits();
            updateStats();
            if (typeof renderChallenge === 'function') renderChallenge();
        }, 60000);
    }
}

function showLoadingState(show) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

// ============================================
// MIGRATSIYA
// ============================================
async function migrateLocalDataIfNeeded() {
    if (!currentUser) return;
    const migrationKey = `habitgo_migrated_${currentUser.id}`;
    if (localStorage.getItem(migrationKey) === 'true') return;

    const oldHabits = JSON.parse(localStorage.getItem(`habitgo_habits_${currentUser.id}`)) || [];
    if (oldHabits.length === 0) {
        localStorage.setItem(migrationKey, 'true');
        return;
    }

    for (const oldHabit of oldHabits) {
        try {
            await insertHabit({
                user_id: currentUser.id,
                name: oldHabit.name, period: oldHabit.period,
                days: (oldHabit.days || []).map(String),
                time: oldHabit.time, place: oldHabit.place,
                start_date: oldHabit.startDate, end_date: oldHabit.endDate,
                completed_days: (oldHabit.completedDays || []).map(String),
                streak: oldHabit.streak || 0, last_check: oldHabit.lastCheck || null
            });
        } catch (err) { console.error('[Migratsiya]', err); }
    }
    localStorage.setItem(migrationKey, 'true');
}

// ============================================
// LOAD HABITS
// ============================================
async function loadHabits() {
    if (!currentUser) { habits = []; return; }
    try {
        const data = await getHabits(currentUser.id);
        habits = data.map(h => ({
            id: h.id, name: h.name, period: h.period,
            days: (h.days || []).map(Number), time: h.time, place: h.place,
            startDate: h.start_date, endDate: h.end_date,
            completedDays: h.completed_days || [], streak: h.streak || 0,
            lastCheck: h.last_check, createdAt: h.created_at
        }));
        habitsLoaded = true;
    } catch (err) { habits = []; }
}

// ============================================
// SANA
// ============================================
function showCurrentDate() {
    const now = new Date();
    const days = translations[currentLang]?.days_full || translations.uz.days_full;
    const months = {
        uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
        ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    const monthNames = months[currentLang] || months.uz;

    const el = document.getElementById('currentDate');
    if (el) el.textContent = `${days[now.getDay()]}, ${now.getDate()}-${monthNames[now.getMonth()]}, ${now.getFullYear()}`;
}

// ============================================
// MOTIVATSIYA
// ============================================
function showMotivation() {
    const random = allMotivations[Math.floor(Math.random() * allMotivations.length)];
    const el = document.getElementById('motivationText');
    if (el) el.textContent = random;

    if (typeof updateMotivationWithAI === 'function' && currentUser) {
        setTimeout(() => updateMotivationWithAI(), 1500);
    }
}

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateToStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function strToDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function getPeriodRange(period, startDateStr) {
    const start = strToDate(startDateStr);
    const end = new Date(start);
    if (period === 'weekly') end.setDate(end.getDate() + 6);
    else if (period === 'monthly') { end.setMonth(end.getMonth() + 1); end.setDate(end.getDate() - 1); }
    else if (period === 'yearly') { end.setFullYear(end.getFullYear() + 1); end.setDate(end.getDate() - 1); }
    return { start: dateToStr(start), end: dateToStr(end) };
}

function isHabitActive(habit) {
    const today = getTodayStr();
    return today >= habit.startDate && today <= habit.endDate;
}

function isHabitFinished(habit) {
    return getTodayStr() > habit.endDate;
}

function checkPremiumLimit() {
    const banner = document.getElementById('premiumLimit');
    if (!banner) return;
    if (typeof isPremium === 'function' && !isPremium() && habits.length >= 3) {
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

// ============================================
// MODAL
// ============================================
function openHabitModal() {
    document.getElementById('habitModal').style.display = 'flex';
    document.getElementById('habitName').focus();
}

function closeHabitModal() {
    document.getElementById('habitModal').style.display = 'none';
    resetForm();
}

document.addEventListener('click', (e) => {
    const modal = document.getElementById('habitModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        closeHabitModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('habitModal');
        if (modal && modal.style.display === 'flex') closeHabitModal();
    }
});

// ============================================
// ADD HABIT
// ============================================
async function addHabit() {
    if (!currentUser) { alert('❌ ' + t('alert_signin_required')); return; }
    if (typeof isPremium === 'function' && !isPremium() && habits.length >= 3) {
        alert('⚠️ ' + t('alert_limit_reached'));
        if (typeof showSubscription === 'function') showSubscription();
        return;
    }

    const name = document.getElementById('habitName').value.trim();
    const period = document.querySelector('input[name="period"]:checked').value;
    const time = document.getElementById('habitTime').value;
    const place = document.getElementById('habitPlace').value.trim();
    const allDays = document.getElementById('allDays').checked;
    let selectedDays = [];
    if (allDays) selectedDays = [0,1,2,3,4,5,6];
    else document.querySelectorAll('.day:checked').forEach(cb => selectedDays.push(parseInt(cb.value)));

    if (!name) { alert('❌ ' + t('alert_enter_habit_name')); return; }
    if (selectedDays.length === 0) { alert('❌ ' + t('alert_select_day')); return; }
    if (!time) { alert('❌ ' + t('alert_select_time')); return; }
    if (!place) { alert('❌ ' + t('alert_enter_place')); return; }

    const today = getTodayStr();
    const range = getPeriodRange(period, today);
    const btn = document.querySelector('#habitModal .btn-add');
    const originalText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }

    try {
        const result = await insertHabit({
            user_id: currentUser.id, name, period,
            days: selectedDays.map(String), time, place,
            start_date: range.start, end_date: range.end,
            completed_days: [], streak: 0, last_check: null
        });

        habits.unshift({
            id: result.id, name: result.name, period: result.period,
            days: (result.days || []).map(Number), time: result.time, place: result.place,
            startDate: result.start_date, endDate: result.end_date,
            completedDays: result.completed_days || [], streak: result.streak || 0,
            lastCheck: result.last_check, createdAt: result.created_at
        });

        renderHabits(); updateStats(); checkPremiumLimit();
        closeHabitModal();

        if (typeof renderChallenge === 'function') renderChallenge();
        if (typeof checkForNewBadges === 'function') setTimeout(checkForNewBadges, 500);
        showToast(`✅ "${name}" ${t('toast_habit_added')}`);
    } catch (err) {
        alert('❌ ' + err.message);
    } finally {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
}

function resetForm() {
    const nameEl = document.getElementById('habitName');
    const placeEl = document.getElementById('habitPlace');
    const timeEl = document.getElementById('habitTime');
    if (nameEl) nameEl.value = '';
    if (placeEl) placeEl.value = '';
    if (timeEl) timeEl.value = '06:00';
    const weekly = document.querySelector('input[name="period"][value="weekly"]');
    if (weekly) weekly.checked = true;
    const allDays = document.getElementById('allDays');
    if (allDays) allDays.checked = true;
    document.querySelectorAll('.day').forEach(cb => { cb.checked = false; cb.disabled = true; });
}

// ============================================
// DELETE
// ============================================
async function deleteHabit(id) {
    if (!confirm(t('alert_delete_confirm'))) return;
    try {
        const success = await deleteHabitFromDB(id);
        if (success) {
            habits = habits.filter(h => h.id !== id);
            renderHabits(); updateStats(); checkPremiumLimit();
            if (typeof renderChallenge === 'function') renderChallenge();
            showToast('🗑 ' + t('toast_habit_deleted'));
        }
    } catch (err) { alert('❌ ' + err.message); }
}

// ============================================
// CHECK
// ============================================
async function checkHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    const today = getTodayStr();
    const todayDay = new Date().getDay();

    if (!habit.days.includes(todayDay)) {
        alert('⚠️ ' + t('alert_not_today'));
        return;
    }

    const wasDone = habit.completedDays.includes(today);
    let newCompletedDays, newStreak, newLastCheck;

    if (wasDone) {
        newCompletedDays = habit.completedDays.filter(d => d !== today);
        newStreak = Math.max(0, habit.streak - 1);
        newLastCheck = habit.lastCheck;
    } else {
        newCompletedDays = [...habit.completedDays, today];
        const y = new Date(); y.setDate(y.getDate() - 1);
        const yStr = dateToStr(y);
        newStreak = (habit.completedDays.includes(yStr) || habit.lastCheck === yStr) ? habit.streak + 1 : 1;
        newLastCheck = today;
        if (typeof playSound === 'function') playSound('success');
        if (typeof triggerConfetti === 'function') triggerConfetti();
    }

    habit.completedDays = newCompletedDays;
    habit.streak = newStreak;
    habit.lastCheck = newLastCheck;

    renderHabits(); updateStats();

    try {
        await updateHabit(id, {
            completed_days: newCompletedDays,
            streak: newStreak,
            last_check: newLastCheck
        });
        if (!wasDone) {
            if (newStreak === 7) setTimeout(() => alert(t('streak_7')), 100);
            else if (newStreak === 30) setTimeout(() => alert(t('streak_30')), 100);
            if (typeof checkForNewBadges === 'function') setTimeout(checkForNewBadges, 500);
            if (typeof renderChallenge === 'function') renderChallenge();
        }
    } catch (err) {
        habit.completedDays = wasDone ? [...newCompletedDays, today] : newCompletedDays.filter(d => d !== today);
        renderHabits();
        alert('❌ ' + t('alert_save_error'));
    }
}

// ============================================
// RENDER
// ============================================
function renderHabits() {
    const list = document.getElementById('habitsList');
    const emptyMsg = document.getElementById('emptyMessage');
    const completedSection = document.getElementById('completedSection');
    const completedList = document.getElementById('completedList');
    if (!list) return;

    const activeHabits = habits.filter(h => isHabitActive(h));
    const finishedHabits = habits.filter(h => isHabitFinished(h));

    if (activeHabits.length === 0) {
        list.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
        const today = getTodayStr();
        const todayDay = new Date().getDay();

        list.innerHTML = activeHabits.map(habit => {
            const isDone = habit.completedDays.includes(today);
            const isToday = habit.days.includes(todayDay);
            const totalDaysSpan = Math.ceil((strToDate(habit.endDate) - strToDate(habit.startDate)) / 86400000) + 1;
            const weeksCount = totalDaysSpan / 7;
            const totalDaysNeeded = Math.round(habit.days.length * weeksCount);
            const doneCount = habit.completedDays.length;
            const percent = Math.min(100, Math.round((doneCount / Math.max(1, totalDaysNeeded)) * 100));
            const dayNames = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
            const daysStr = habit.days.length === 7
                ? t('every_day')
                : habit.days.map(d => t(dayNames[d])).join(', ');
            const warning = (isToday && !isDone) ? `<span class="habit-warning">${t('not_done')}</span>` : '';

            return `
                <div class="habit-item ${isDone ? 'completed' : ''}">
                    <div class="habit-info">
                        <div class="habit-name">${escapeHtml(habit.name)}</div>
                        <div class="habit-meta">
                            <span class="habit-badge">${t('period_' + habit.period)}</span>
                            <span>⏰ ${habit.time}</span>
                            <span>📍 ${escapeHtml(habit.place)}</span>
                            <span>📅 ${daysStr}</span>
                            <span>🔥 ${habit.streak}</span>
                            ${warning}
                        </div>
                        <div class="habit-progress"><div class="habit-progress-fill" style="width: ${percent}%"></div></div>
                        <div style="font-size: 11px; color: #888; margin-top: 4px;">${doneCount} / ${totalDaysNeeded} ${t('days_label')} (${percent}%)</div>
                    </div>
                    <div class="habit-actions">
                        <button class="btn-notes" onclick="openNotesModal(${habit.id})" title="${t('notes_title')}">📝</button>
                        <button class="btn-check ${isDone ? 'done' : ''}" onclick="checkHabit(${habit.id})"
                                ${!isToday ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>
                            ${isDone ? '✓' : '○'}
                        </button>
                        <button class="btn-delete" onclick="deleteHabit(${habit.id})">🗑</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (!completedSection || !completedList) return;
    if (finishedHabits.length === 0) {
        completedSection.style.display = 'none';
    } else {
        completedSection.style.display = 'block';
        completedList.innerHTML = finishedHabits.map(habit => {
            const totalDaysSpan = Math.ceil((strToDate(habit.endDate) - strToDate(habit.startDate)) / 86400000) + 1;
            const weeksCount = totalDaysSpan / 7;
            const totalDaysNeeded = Math.round(habit.days.length * weeksCount);
            const doneCount = habit.completedDays.length;
            const percent = Math.min(100, Math.round((doneCount / Math.max(1, totalDaysNeeded)) * 100));
            let feedback = percent >= 90 ? t('feedback_90') : percent >= 70 ? t('feedback_70') : percent >= 50 ? t('feedback_50') : t('feedback_low');
            return `
                <div class="completed-item">
                    <div class="habit-name">${escapeHtml(habit.name)}</div>
                    <div class="completed-percent">${percent}%</div>
                    <div class="completed-stats">📅 ${habit.startDate} – ${habit.endDate}<br>✅ ${doneCount} ${t('days_label')}<br>${feedback}</div>
                </div>
            `;
        }).join('');
    }
}

function updateStats() {
    const activeHabits = habits.filter(h => isHabitActive(h));
    const today = getTodayStr();
    const totalEl = document.getElementById('totalHabits');
    const doneEl = document.getElementById('todayDone');
    const streakEl = document.getElementById('bestStreak');
    if (totalEl) totalEl.textContent = activeHabits.length;
    if (doneEl) doneEl.textContent = activeHabits.filter(h => h.completedDays.includes(today)).length;
    if (streakEl) streakEl.textContent = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
}

function checkDailyReport() {
    const today = getTodayStr();
    if (lastReportDate === today) return;
    const now = new Date();
    if (now.getHours() < 6) return;

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = dateToStr(yesterday); const yDay = yesterday.getDay();
    const activeYesterday = habits.filter(h => yStr >= h.startDate && yStr <= h.endDate);
    const shouldDone = activeYesterday.filter(h => h.days.includes(yDay));
    const actuallyDone = shouldDone.filter(h => h.completedDays.includes(yStr));

    if (shouldDone.length === 0) {
        lastReportDate = today;
        localStorage.setItem('habitgo_last_report', today);
        return;
    }

    const percent = Math.round((actuallyDone.length / shouldDone.length) * 100);
    let title, text;
    if (percent === 100) {
        title = t('daily_report_perfect');
        text = t('report_all_done') + `\n\n${actuallyDone.length}/${shouldDone.length} ✅\n\n` + randomFrom(praiseMessages);
    }
    else if (percent >= 70) {
        title = t('daily_report_good');
        text = `${actuallyDone.length}/${shouldDone.length} (${percent}%)\n\n` + randomFrom(praiseMessages);
    }
    else if (percent >= 50) {
        title = t('daily_report_ok');
        text = `${actuallyDone.length}/${shouldDone.length} (${percent}%)\n\n` + randomFrom(encourageMessages);
    }
    else {
        title = t('daily_report_bad');
        text = t('report_only') + ` ${actuallyDone.length}/${shouldDone.length} (${percent}%)\n\n` + randomFrom(encourageMessages);
    }

    const titleEl = document.getElementById('reportTitle');
    const textEl = document.getElementById('reportText');
    const reportEl = document.getElementById('dailyReport');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (reportEl) reportEl.style.display = 'flex';
    lastReportDate = today;
    localStorage.setItem('habitgo_last_report', today);
}

function closeReport() {
    const el = document.getElementById('dailyReport');
    if (el) el.style.display = 'none';
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(text, type = 'success') {
    if (typeof showBackupToast === 'function') { showBackupToast(text); return; }
    const toast = document.createElement('div');
    toast.className = 'backup-toast';
    toast.textContent = text;
    if (type === 'error') toast.style.background = 'rgba(229, 57, 53, 0.95)';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function updateTasksQuickInfo() {
    const info = document.getElementById('tasksQuickInfo');
    if (!info) return;
    if (typeof getTodayTasksCount !== 'function') return;
    const count = getTodayTasksCount();
    if (count > 0) {
        info.textContent = t('tasks_today', { n: count });
        info.style.color = '#ff6b35';
        info.style.fontWeight = '600';
    } else {
        info.textContent = t('tasks_manage');
        info.style.color = '';
        info.style.fontWeight = '';
    }
}