// ============================================
// HABITGO — Heatmap (i18n bilan)
// ============================================

function getColorLevel(count, maxCount) {
    if (count === 0) return 0;
    if (maxCount === 0) return 1;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

function heatmapDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function showStatistics() {
    document.getElementById('statisticsPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    renderStatsSummary();
    renderHeatmap();
    renderHabitBreakdown();

    setTimeout(() => {
        if (typeof renderCharts === 'function') renderCharts();
    }, 100);
}

function renderHeatmap() {
    const container = document.getElementById('heatmapContainer');
    if (!container) return;

    const months = {
        uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
        ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
        en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
    const monthNames = months[currentLang] || months.uz;

    const dayLabels = [
        t('day_mon').charAt(0),
        t('day_tue').charAt(0),
        t('day_wed').charAt(0),
        t('day_thu').charAt(0),
        t('day_fri').charAt(0),
        t('day_sat').charAt(0),
        t('day_sun').charAt(0)
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    const startDay = startDate.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - offset);

    const dailyCounts = {};
    let maxCount = 0;

    habits.forEach(habit => {
        habit.completedDays.forEach(dateStr => {
            dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
            if (dailyCounts[dateStr] > maxCount) maxCount = dailyCounts[dateStr];
        });
    });

    let html = '<div class="heatmap-wrapper">';

    html += '<div class="heatmap-days">';
    dayLabels.forEach(label => {
        html += `<div class="heatmap-day-label">${label}</div>`;
    });
    html += '</div>';

    const weeks = [];
    const cells = [];

    let cursor = new Date(startDate);
    const todayStr = heatmapDateStr(today);

    while (cursor <= today) {
        const dateStr = heatmapDateStr(cursor);
        const count = dailyCounts[dateStr] || 0;
        const level = getColorLevel(count, maxCount);
        const isToday = dateStr === todayStr;

        cells.push({
            date: dateStr, count: count, level: level, isToday: isToday,
            dayOfWeek: cursor.getDay(), month: cursor.getMonth()
        });

        cursor.setDate(cursor.getDate() + 1);
    }

    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }

    let currentMonth = -1;
    let monthPositions = [];

    html += '<div class="heatmap-grid">';

    weeks.forEach((week, weekIdx) => {
        const firstCell = week[0];
        if (firstCell && firstCell.month !== currentMonth) {
            currentMonth = firstCell.month;
            monthPositions.push({ month: monthNames[currentMonth], position: weekIdx });
        }

        html += '<div class="heatmap-week">';
        week.forEach(cell => {
            const title = `${cell.date}: ${cell.count}`;
            html += `<div class="heatmap-cell level-${cell.level} ${cell.isToday ? 'today' : ''}" title="${title}"></div>`;
        });
        html += '</div>';
    });

    html += '</div></div>';

    let monthsHtml = '<div class="heatmap-months-row">';
    monthPositions.forEach((mp, idx) => {
        const nextPos = monthPositions[idx + 1]?.position || weeks.length;
        const span = nextPos - mp.position;
        monthsHtml += `<div class="heatmap-month-label" style="grid-column: span ${span}">${mp.month}</div>`;
    });
    monthsHtml += '</div>';

    container.innerHTML = monthsHtml + html;

    const legend = document.getElementById('heatmapLegend');
    if (legend) {
        legend.innerHTML = `
            <span class="legend-text">${t('stats_legend_less')}</span>
            <div class="heatmap-cell level-0"></div>
            <div class="heatmap-cell level-1"></div>
            <div class="heatmap-cell level-2"></div>
            <div class="heatmap-cell level-3"></div>
            <div class="heatmap-cell level-4"></div>
            <span class="legend-text">${t('stats_legend_more')}</span>
        `;
    }
}

function renderStatsSummary() {
    const container = document.getElementById('statsSummary');
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = heatmapDateStr(today);

    const totalCompleted = habits.reduce((sum, h) => sum + h.completedDays.length, 0);
    const activeHabits = habits.filter(h => typeof isHabitActive === 'function' && isHabitActive(h));
    const finishedHabits = habits.filter(h => typeof isHabitFinished === 'function' && isHabitFinished(h));

    let weekDone = 0, weekTotal = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = heatmapDateStr(d);
        const dDay = d.getDay();

        activeHabits.forEach(h => {
            if (dStr >= h.startDate && dStr <= h.endDate && h.days.includes(dDay)) {
                weekTotal++;
                if (h.completedDays.includes(dStr)) weekDone++;
            }
        });
    }

    let monthDone = 0, monthTotal = 0;
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = heatmapDateStr(d);
        const dDay = d.getDay();

        activeHabits.forEach(h => {
            if (dStr >= h.startDate && dStr <= h.endDate && h.days.includes(dDay)) {
                monthTotal++;
                if (h.completedDays.includes(dStr)) monthDone++;
            }
        });
    }

    const weekPercent = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;
    const monthPercent = monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0;

    container.innerHTML = `
        <div class="stats-summary-grid">
            <div class="summary-card">
                <div class="summary-icon">📊</div>
                <div class="summary-value">${totalCompleted}</div>
                <div class="summary-label">${t('stats_total')}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">📅</div>
                <div class="summary-value">${weekPercent}%</div>
                <div class="summary-label">${t('stats_week')} (${weekDone}/${weekTotal})</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">🗓</div>
                <div class="summary-value">${monthPercent}%</div>
                <div class="summary-label">${t('stats_month')} (${monthDone}/${monthTotal})</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">🔥</div>
                <div class="summary-value">${habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0}</div>
                <div class="summary-label">${t('best_streak')}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">✅</div>
                <div class="summary-value">${activeHabits.length}</div>
                <div class="summary-label">${t('stats_active')}</div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">🏆</div>
                <div class="summary-value">${finishedHabits.length}</div>
                <div class="summary-label">${t('stats_finished')}</div>
            </div>
        </div>
    `;
}

function renderHabitBreakdown() {
    const container = document.getElementById('habitBreakdown');
    if (!container) return;

    if (habits.length === 0) {
        container.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">${t('empty_message')}</p>`;
        return;
    }

    container.innerHTML = habits.map(habit => {
        const totalDaysSpan = Math.ceil((strToDate(habit.endDate) - strToDate(habit.startDate)) / 86400000) + 1;
        const weeksCount = totalDaysSpan / 7;
        const totalDaysNeeded = Math.round(habit.days.length * weeksCount);
        const doneCount = habit.completedDays.length;
        const percent = Math.min(100, Math.round((doneCount / Math.max(1, totalDaysNeeded)) * 100));

        const status = typeof isHabitActive === 'function' && isHabitActive(habit)
            ? '🟢 ' + t('stats_active')
            : '✅ ' + t('stats_finished');

        return `
            <div class="breakdown-item">
                <div class="breakdown-header">
                    <div class="breakdown-name">${escapeHtml(habit.name)}</div>
                    <div class="breakdown-status">${status}</div>
                </div>
                <div class="breakdown-meta">
                    <span>${t('period_' + habit.period)}</span>
                    <span>🔥 ${habit.streak}</span>
                    <span>✅ ${doneCount}/${totalDaysNeeded}</span>
                </div>
                <div class="breakdown-bar">
                    <div class="breakdown-fill" style="width: ${percent}%"></div>
                </div>
                <div class="breakdown-percent">${percent}%</div>
            </div>
        `;
    }).join('');
}

function closeStatistics() {
    document.getElementById('statisticsPage').style.display = 'none';

    if (typeof weeklyChartInstance !== 'undefined' && weeklyChartInstance) {
        weeklyChartInstance.destroy();
        weeklyChartInstance = null;
    }
    if (typeof monthlyChartInstance !== 'undefined' && monthlyChartInstance) {
        monthlyChartInstance.destroy();
        monthlyChartInstance = null;
    }
}