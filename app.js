// ============================================
// HABITGO — Asosiy mantiq (Safari-compatible)
// ============================================

var habits = [];
var habitsLoaded = false;
var lastReportDate = localStorage.getItem('habitgo_last_report') || null;

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

    var allDaysEl = document.getElementById('allDays');
    if (allDaysEl && !allDaysEl.dataset.listenerAttached) {
        allDaysEl.dataset.listenerAttached = 'true';
        allDaysEl.addEventListener('change', function(e) {
            var days = document.querySelectorAll('.day');
            for (var i = 0; i < days.length; i++) {
                days[i].checked = false;
                days[i].disabled = e.target.checked;
            }
        });
        var daysList = document.querySelectorAll('.day');
        for (var i = 0; i < daysList.length; i++) {
            daysList[i].disabled = allDaysEl.checked;
        }
    }

    if (!window.habitgoInterval) {
        window.habitgoInterval = setInterval(function() {
            checkDailyReport();
            renderHabits();
            updateStats();
            if (typeof renderChallenge === 'function') renderChallenge();
        }, 60000);
    }
}

function showLoadingState(show) {
    var loading = document.getElementById('loadingOverlay');
    if (loading) loading.style.display = show ? 'flex' : 'none';
}

async function migrateLocalDataIfNeeded() {
    if (!currentUser) return;
    var migrationKey = 'habitgo_migrated_' + currentUser.id;
    if (localStorage.getItem(migrationKey) === 'true') return;

    var oldHabits = JSON.parse(localStorage.getItem('habitgo_habits_' + currentUser.id)) || [];
    if (oldHabits.length === 0) {
        localStorage.setItem(migrationKey, 'true');
        return;
    }

    for (var i = 0; i < oldHabits.length; i++) {
        var oldHabit = oldHabits[i];
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

async function loadHabits() {
    if (!currentUser) { habits = []; return; }
    try {
        var data = await getHabits(currentUser.id);
        habits = data.map(function(h) {
            return {
                id: h.id, name: h.name, period: h.period,
                days: (h.days || []).map(Number), time: h.time, place: h.place,
                startDate: h.start_date, endDate: h.end_date,
                completedDays: h.completed_days || [], streak: h.streak || 0,
                lastCheck: h.last_check, createdAt: h.created_at
            };
        });
        habitsLoaded = true;
    } catch (err) { habits = []; }
}

function showCurrentDate() {
    var now = new Date();
    var lang = translations[currentLang] || translations.uz;
    var days = lang.days_full || translations.uz.days_full;
    var months = {
        uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
        ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var monthNames = months[currentLang] || months.uz;

    var el = document.getElementById('currentDate');
    if (el) el.textContent = days[now.getDay()] + ', ' + now.getDate() + '-' + monthNames[now.getMonth()] + ', ' + now.getFullYear();
}

function showMotivation() {
    var text = tRandom('motivations');
    var el = document.getElementById('motivationText');
    if (el) el.textContent = text || 'HabitGo';

    if (typeof updateMotivationWithAI === 'function' && currentUser) {
        setTimeout(function() { updateMotivationWithAI(); }, 1500);
    }
}

function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function dateToStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function strToDate(str) {
    var parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getPeriodRange(period, startDateStr) {
    var start = strToDate(startDateStr);
    var end = new Date(start);
    if (period === 'weekly') end.setDate(end.getDate() + 6);
    else if (period === 'monthly') { end.setMonth(end.getMonth() + 1); end.setDate(end.getDate() - 1); }
    else if (period === 'yearly') { end.setFullYear(end.getFullYear() + 1); end.setDate(end.getDate() - 1); }
    return { start: dateToStr(start), end: dateToStr(end) };
}

function isHabitActive(habit) {
    var today = getTodayStr();
    return today >= habit.startDate && today <= habit.endDate;
}

function isHabitFinished(habit) {
    return getTodayStr() > habit.endDate;
}

function checkPremiumLimit() {
    var banner = document.getElementById('premiumLimit');
    if (!banner) return;
    if (typeof isPremium === 'function' && !isPremium() && habits.length >= 3) {
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

function openHabitModal() {
    document.getElementById('habitModal').style.display = 'flex';
    document.getElementById('habitName').focus();
}

function closeHabitModal() {
    document.getElementById('habitModal').style.display = 'none';
    resetForm();
}

document.addEventListener('click', function(e) {
    var modal = document.getElementById('habitModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        closeHabitModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        var modal = document.getElementById('habitModal');
        if (modal && modal.style.display === 'flex') closeHabitModal();
    }
});

async function addHabit() {
    if (!currentUser) { alert('❌ ' + t('alert_signin_required')); return; }
    if (typeof isPremium === 'function' && !isPremium() && habits.length >= 3) {
        alert('⚠️ ' + t('alert_limit_reached'));
        if (typeof showSubscription === 'function') showSubscription();
        return;
    }

    var name = document.getElementById('habitName').value.trim();
    var period = document.querySelector('input[name="period"]:checked').value;
    var time = document.getElementById('habitTime').value;
    var place = document.getElementById('habitPlace').value.trim();
    var allDays = document.getElementById('allDays').checked;
    var selectedDays = [];
    if (allDays) selectedDays = [0,1,2,3,4,5,6];
    else {
        var checkedDays = document.querySelectorAll('.day:checked');
        for (var i = 0; i < checkedDays.length; i++) {
            selectedDays.push(parseInt(checkedDays[i].value));
        }
    }

    if (!name) { alert('❌ ' + t('alert_enter_habit_name')); return; }
    if (selectedDays.length === 0) { alert('❌ ' + t('alert_select_day')); return; }
    if (!time) { alert('❌ ' + t('alert_select_time')); return; }
    if (!place) { alert('❌ ' + t('alert_enter_place')); return; }

    var today = getTodayStr();
    var range = getPeriodRange(period, today);
    var btn = document.querySelector('#habitModal .btn-add');
    var originalText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }

    try {
        var result = await insertHabit({
            user_id: currentUser.id, name: name, period: period,
            days: selectedDays.map(String), time: time, place: place,
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
        showToast('✅ "' + name + '" ' + t('toast_habit_added'));
    } catch (err) {
        alert('❌ ' + err.message);
    } finally {
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
}

function resetForm() {
    var nameEl = document.getElementById('habitName');
    var placeEl = document.getElementById('habitPlace');
    var timeEl = document.getElementById('habitTime');
    if (nameEl) nameEl.value = '';
    if (placeEl) placeEl.value = '';
    if (timeEl) timeEl.value = '06:00';
    var weekly = document.querySelector('input[name="period"][value="weekly"]');
    if (weekly) weekly.checked = true;
    var allDays = document.getElementById('allDays');
    if (allDays) allDays.checked = true;
    var days = document.querySelectorAll('.day');
    for (var i = 0; i < days.length; i++) { days[i].checked = false; days[i].disabled = true; }
}

async function deleteHabit(id) {
    if (!confirm(t('alert_delete_confirm'))) return;
    try {
        var success = await deleteHabitFromDB(id);
        if (success) {
            habits = habits.filter(function(h) { return h.id !== id; });
            renderHabits(); updateStats(); checkPremiumLimit();
            if (typeof renderChallenge === 'function') renderChallenge();
            showToast('🗑 ' + t('toast_habit_deleted'));
        }
    } catch (err) { alert('❌ ' + err.message); }
}

async function checkHabit(id) {
    var habit = null;
    for (var i = 0; i < habits.length; i++) {
        if (habits[i].id === id) { habit = habits[i]; break; }
    }
    if (!habit) return;

    var today = getTodayStr();
    var todayDay = new Date().getDay();

    if (habit.days.indexOf(todayDay) === -1) {
        alert('⚠️ ' + t('alert_not_today'));
        return;
    }

    var wasDone = habit.completedDays.indexOf(today) !== -1;
    var newCompletedDays, newStreak, newLastCheck;

    if (wasDone) {
        newCompletedDays = habit.completedDays.filter(function(d) { return d !== today; });
        newStreak = Math.max(0, habit.streak - 1);
        newLastCheck = habit.lastCheck;
    } else {
        newCompletedDays = habit.completedDays.concat([today]);
        var y = new Date(); y.setDate(y.getDate() - 1);
        var yStr = dateToStr(y);
        newStreak = (habit.completedDays.indexOf(yStr) !== -1 || habit.lastCheck === yStr) ? habit.streak + 1 : 1;
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
            if (newStreak === 7) setTimeout(function() { alert(t('streak_7')); }, 100);
            else if (newStreak === 30) setTimeout(function() { alert(t('streak_30')); }, 100);
            if (typeof checkForNewBadges === 'function') setTimeout(checkForNewBadges, 500);
            if (typeof renderChallenge === 'function') renderChallenge();
        }
    } catch (err) {
        habit.completedDays = wasDone ? newCompletedDays.concat([today]) : newCompletedDays.filter(function(d) { return d !== today; });
        renderHabits();
        alert('❌ ' + t('alert_save_error'));
    }
}

function renderHabits() {
    var list = document.getElementById('habitsList');
    var emptyMsg = document.getElementById('emptyMessage');
    var completedSection = document.getElementById('completedSection');
    var completedList = document.getElementById('completedList');
    if (!list) return;

    var activeHabits = habits.filter(function(h) { return isHabitActive(h); });
    var finishedHabits = habits.filter(function(h) { return isHabitFinished(h); });

    if (activeHabits.length === 0) {
        list.innerHTML = '';
        if (emptyMsg) emptyMsg.style.display = 'block';
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
        var today = getTodayStr();
        var todayDay = new Date().getDay();

        list.innerHTML = activeHabits.map(function(habit) {
            var isDone = habit.completedDays.indexOf(today) !== -1;
            var isToday = habit.days.indexOf(todayDay) !== -1;
            var totalDaysSpan = Math.ceil((strToDate(habit.endDate) - strToDate(habit.startDate)) / 86400000) + 1;
            var weeksCount = totalDaysSpan / 7;
            var totalDaysNeeded = Math.round(habit.days.length * weeksCount);
            var doneCount = habit.completedDays.length;
            var percent = Math.min(100, Math.round((doneCount / Math.max(1, totalDaysNeeded)) * 100));
            var dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
            var daysStr = habit.days.length === 7
                ? t('every_day')
                : habit.days.map(function(d) { return t(dayKeys[d]); }).join(', ');
            var warning = (isToday && !isDone) ? '<span class="habit-warning">' + t('not_done') + '</span>' : '';

            return '<div class="habit-item ' + (isDone ? 'completed' : '') + '">' +
                '<div class="habit-info">' +
                    '<div class="habit-name">' + escapeHtml(habit.name) + '</div>' +
                    '<div class="habit-meta">' +
                        '<span class="habit-badge">' + t('period_' + habit.period) + '</span>' +
                        '<span>⏰ ' + habit.time + '</span>' +
                        '<span>📍 ' + escapeHtml(habit.place) + '</span>' +
                        '<span>📅 ' + daysStr + '</span>' +
                        '<span>🔥 ' + habit.streak + '</span>' +
                        warning +
                    '</div>' +
                    '<div class="habit-progress"><div class="habit-progress-fill" style="width: ' + percent + '%"></div></div>' +
                    '<div style="font-size: 11px; color: #888; margin-top: 4px;">' + doneCount + ' / ' + totalDaysNeeded + ' ' + t('days_label') + ' (' + percent + '%)</div>' +
                '</div>' +
                '<div class="habit-actions">' +
                    '<button class="btn-notes" onclick="openNotesModal(' + habit.id + ')" title="' + t('notes_title') + '">📝</button>' +
                    '<button class="btn-check ' + (isDone ? 'done' : '') + '" onclick="checkHabit(' + habit.id + ')" ' +
                        (!isToday ? 'disabled style="opacity:0.3;cursor:not-allowed"' : '') + '>' +
                        (isDone ? '✓' : '○') +
                    '</button>' +
                    '<button class="btn-delete" onclick="deleteHabit(' + habit.id + ')">🗑</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    if (!completedSection || !completedList) return;
    if (finishedHabits.length === 0) {
        completedSection.style.display = 'none';
    } else {
        completedSection.style.display = 'block';
        completedList.innerHTML = finishedHabits.map(function(habit) {
            var totalDaysSpan = Math.ceil((strToDate(habit.endDate) - strToDate(habit.startDate)) / 86400000) + 1;
            var weeksCount = totalDaysSpan / 7;
            var totalDaysNeeded = Math.round(habit.days.length * weeksCount);
            var doneCount = habit.completedDays.length;
            var percent = Math.min(100, Math.round((doneCount / Math.max(1, totalDaysNeeded)) * 100));
            var feedback = percent >= 90 ? t('feedback_90') : percent >= 70 ? t('feedback_70') : percent >= 50 ? t('feedback_50') : t('feedback_low');
            return '<div class="completed-item">' +
                '<div class="habit-name">' + escapeHtml(habit.name) + '</div>' +
                '<div class="completed-percent">' + percent + '%</div>' +
                '<div class="completed-stats">📅 ' + habit.startDate + ' – ' + habit.endDate + '<br>✅ ' + doneCount + ' ' + t('days_label') + '<br>' + feedback + '</div>' +
            '</div>';
        }).join('');
    }
}

function updateStats() {
    var activeHabits = habits.filter(function(h) { return isHabitActive(h); });
    var today = getTodayStr();
    var totalEl = document.getElementById('totalHabits');
    var doneEl = document.getElementById('todayDone');
    var streakEl = document.getElementById('bestStreak');
    if (totalEl) totalEl.textContent = activeHabits.length;
    if (doneEl) doneEl.textContent = activeHabits.filter(function(h) { return h.completedDays.indexOf(today) !== -1; }).length;
    if (streakEl) streakEl.textContent = habits.length > 0 ? Math.max.apply(null, habits.map(function(h) { return h.streak; })) : 0;
}

function checkDailyReport() {
    var today = getTodayStr();
    if (lastReportDate === today) return;
    var now = new Date();
    if (now.getHours() < 6) return;

    var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    var yStr = dateToStr(yesterday); var yDay = yesterday.getDay();
    var activeYesterday = habits.filter(function(h) { return yStr >= h.startDate && yStr <= h.endDate; });
    var shouldDone = activeYesterday.filter(function(h) { return h.days.indexOf(yDay) !== -1; });
    var actuallyDone = shouldDone.filter(function(h) { return h.completedDays.indexOf(yStr) !== -1; });

    if (shouldDone.length === 0) {
        lastReportDate = today;
        localStorage.setItem('habitgo_last_report', today);
        return;
    }

    var percent = Math.round((actuallyDone.length / shouldDone.length) * 100);
    var title, text;
    if (percent === 100) {
        title = t('daily_report_perfect');
        text = t('report_all_done') + '\n\n' + actuallyDone.length + '/' + shouldDone.length + ' ✅\n\n' + tRandom('praise');
    }
    else if (percent >= 70) {
        title = t('daily_report_good');
        text = actuallyDone.length + '/' + shouldDone.length + ' (' + percent + '%)\n\n' + tRandom('praise');
    }
    else if (percent >= 50) {
        title = t('daily_report_ok');
        text = actuallyDone.length + '/' + shouldDone.length + ' (' + percent + '%)\n\n' + tRandom('encourage');
    }
    else {
        title = t('daily_report_bad');
        text = t('report_only') + ' ' + actuallyDone.length + '/' + shouldDone.length + ' (' + percent + '%)\n\n' + tRandom('encourage');
    }

    var titleEl = document.getElementById('reportTitle');
    var textEl = document.getElementById('reportText');
    var reportEl = document.getElementById('dailyReport');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    if (reportEl) reportEl.style.display = 'flex';
    lastReportDate = today;
    localStorage.setItem('habitgo_last_report', today);
}

function closeReport() {
    var el = document.getElementById('dailyReport');
    if (el) el.style.display = 'none';
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(text, type) {
    type = type || 'success';
    if (typeof showBackupToast === 'function') { showBackupToast(text); return; }
    var toast = document.createElement('div');
    toast.className = 'backup-toast';
    toast.textContent = text;
    if (type === 'error') toast.style.background = 'rgba(229, 57, 53, 0.95)';
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function updateTasksQuickInfo() {
    var info = document.getElementById('tasksQuickInfo');
    if (!info) return;
    if (typeof getTodayTasksCount !== 'function') return;
    var count = getTodayTasksCount();
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