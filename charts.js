// ============================================
// HABITGO — Chart.js grafiklari (i18n bilan)
// ============================================

let weeklyChartInstance = null;
let monthlyChartInstance = null;

// ============================================
// HAFTALIK GRAFIK
// ============================================
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;

    if (weeklyChartInstance) weeklyChartInstance.destroy();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const doneData = [];
    const totalData = [];

    const dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = heatmapDateStr(d);
        const dDay = d.getDay();

        labels.push(t(dayKeys[dDay]) + ' ' + d.getDate());

        let done = 0;
        let total = 0;

        habits.forEach(h => {
            if (dStr >= h.startDate && dStr <= h.endDate && h.days.includes(dDay)) {
                total++;
                if (h.completedDays.includes(dStr)) done++;
            }
        });

        doneData.push(done);
        totalData.push(total);
    }

    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    weeklyChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: t('stats_progress'),
                    data: doneData,
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderRadius: 8,
                    borderSkipped: false
                },
                {
                    label: t('task_stats_active'),
                    data: totalData,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderRadius: 8,
                    borderSkipped: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, font: { size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, stepSize: 1 },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor, font: { size: 11 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============================================
// OYLIK GRAFIK
// ============================================
function renderMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;

    if (monthlyChartInstance) monthlyChartInstance.destroy();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const percentData = [];

    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = heatmapDateStr(d);
        const dDay = d.getDay();

        if (i % 5 === 0 || i === 0) {
            labels.push(d.getDate() + '-' + (d.getMonth() + 1));
        } else {
            labels.push('');
        }

        let done = 0;
        let total = 0;

        habits.forEach(h => {
            if (dStr >= h.startDate && dStr <= h.endDate && h.days.includes(dDay)) {
                total++;
                if (h.completedDays.includes(dStr)) done++;
            }
        });

        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        percentData.push(percent);
    }

    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    monthlyChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: t('stats_percent'),
                data: percentData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor, font: { size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: (ctx) => `${t('stats_progress')}: ${ctx.parsed.y}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor,
                        callback: (v) => v + '%'
                    },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor, font: { size: 10 } },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js yuklanmagan');
        return;
    }
    renderWeeklyChart();
    renderMonthlyChart();
}