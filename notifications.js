// ============================================
// HABITGO — Notification + Ovoz
// ============================================

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function sendNotification(title, body, icon = '🚀') {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">' + icon + '</text></svg>',
            badge: '🚀',
            tag: 'habitgo',
            requireInteraction: false
        });
    } catch (e) {
        console.log('Notification error:', e);
    }
}

let audioContext = null;

function playSound(type) {
    try {
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const notes = {
            success: [523.25, 659.25, 783.99],
            warning: [440, 349.23],
            click: [880]
        };

        const freq = notes[type] || notes.click;
        let time = audioContext.currentTime;

        freq.forEach(f => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.value = f;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            osc.start(time);
            osc.stop(time + 0.3);

            time += 0.1;
        });
    } catch (e) {
        console.log('Audio error:', e);
    }
}

function checkReminders() {
    if (typeof habits === 'undefined' || habits.length === 0) return;

    const now = new Date();
    const today = getTodayStr();
    const todayDay = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const activeHabits = habits.filter(h => isHabitActive(h));

    activeHabits.forEach(habit => {
        if (!habit.days.includes(todayDay)) return;
        if (habit.completedDays.includes(today)) return;
        if (habit.time !== currentTime) return;

        sendNotification(
            `⏰ ${habit.name}`,
            `📍 ${habit.place} · ${habit.time}\nBajarish vaqti keldi!`,
            '⏰'
        );

        playSound('warning');
        showReminderPopup(habit);
    });

    if (currentTime === '23:59') {
        const todayHabits = activeHabits.filter(h => h.days.includes(todayDay));
        const doneToday = todayHabits.filter(h => h.completedDays.includes(today));

        if (todayHabits.length > 0 && doneToday.length < todayHabits.length) {
            const remaining = todayHabits.length - doneToday.length;
            sendNotification(
                '⚠️ Bugun tugamadi!',
                `${remaining} ta odat bajarilmadi. Hali vaqt bor! 💪`,
                '⚠️'
            );
        }
    }
}

function showReminderPopup(habit) {
    const popup = document.createElement('div');
    popup.className = 'reminder-popup';
    popup.innerHTML = `
        <div class="reminder-icon">⏰</div>
        <div class="reminder-info">
            <strong>${escapeHtml(habit.name)}</strong>
            <div>📍 ${escapeHtml(habit.place)}</div>
            <div>🕐 ${habit.time}</div>
        </div>
        <button onclick="this.parentElement.remove()" class="reminder-close">×</button>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);

    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 10000);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(requestNotificationPermission, 3000);
    setInterval(checkReminders, 60000);
    setTimeout(checkReminders, 5000);
});