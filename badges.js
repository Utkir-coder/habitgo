// ============================================
// HABITGO — Badges (Supabase)
// ============================================

const ALL_BADGES = [
    { id: 'first_habit', icon: '🌱', name: 'Birinchi qadam', desc: 'Birinchi odatni qo\'shding', check: (s) => s.totalHabits >= 1 },
    { id: 'first_check', icon: '✅', name: 'Birinchi belgi', desc: 'Birinchi odatni bajarding', check: (s) => s.totalCompleted >= 1 },
    { id: 'streak_3', icon: '🔥', name: '3 kun ketma-ket', desc: '3 kunlik streak', check: (s) => s.bestStreak >= 3 },
    { id: 'streak_7', icon: '🔥', name: 'Bir hafta!', desc: '7 kunlik streak', check: (s) => s.bestStreak >= 7 },
    { id: 'streak_30', icon: '💎', name: 'Bir oy!', desc: '30 kunlik streak', check: (s) => s.bestStreak >= 30 },
    { id: 'streak_100', icon: '👑', name: '100 kun!', desc: '100 kunlik streak', check: (s) => s.bestStreak >= 100 },
    { id: 'habit_5', icon: '📚', name: '5 ta odat', desc: '5 ta odat qo\'shding', check: (s) => s.totalHabits >= 5 },
    { id: 'habit_10', icon: '📖', name: '10 ta odat', desc: '10 ta odat qo\'shding', check: (s) => s.totalHabits >= 10 },
    { id: 'done_10', icon: '🎯', name: '10 marta', desc: '10 marta bajarding', check: (s) => s.totalCompleted >= 10 },
    { id: 'done_50', icon: '🏅', name: '50 marta', desc: '50 marta bajarding', check: (s) => s.totalCompleted >= 50 },
    { id: 'done_100', icon: '🏆', name: '100 marta', desc: '100 marta bajarding', check: (s) => s.totalCompleted >= 100 },
    { id: 'perfect_day', icon: '⭐', name: 'Mukammal kun', desc: 'Bir kunda hamma odatni bajarding', check: (s) => s.hasPerfectDay },
    { id: 'finished_habit', icon: '🎓', name: 'Tugallangan', desc: 'Birinchi odatni tugatding', check: (s) => s.finishedHabits >= 1 },
    { id: 'finished_5', icon: '🎖', name: '5 ta tugallangan', desc: '5 ta odatni tugatding', check: (s) => s.finishedHabits >= 5 },
    { id: 'premium', icon: '💎', name: 'Premium', desc: 'Premium obunaga o\'tding', check: (s) => s.isPremium },
    { id: 'early_bird', icon: '🌅', name: 'Erta qush', desc: 'Ertalab odat bajarding', check: (s) => s.earlyBird },
    { id: 'night_owl', icon: '🦉', name: 'Tungi boyqush', desc: 'Kechqurun odat bajarding', check: (s) => s.nightOwl }
];

let unlockedBadges = [];

// ============================================
// YUKLASH
// ============================================
async function loadBadges() {
    if (!currentUser) {
        unlockedBadges = [];
        return;
    }

    try {
        const data = await getBadges(currentUser.id);
        unlockedBadges = data.map(b => b.badge_id);
        console.log('[Badges] Yuklandi:', unlockedBadges.length);
    } catch (err) {
        console.error('[Badges] loadBadges xatosi:', err);
        unlockedBadges = [];
    }
}

// ============================================
// STATISTIKA
// ============================================
function getUserStatsForBadges() {
    const today = getTodayStr();
    const todayDay = new Date().getDay();
    const activeHabits = habits.filter(h => isHabitActive(h));
    const finishedHabits = habits.filter(h => isHabitFinished(h));

    const totalCompleted = habits.reduce((sum, h) => sum + h.completedDays.length, 0);
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

    const todayHabits = activeHabits.filter(h => h.days.includes(todayDay));
    const todayDone = todayHabits.filter(h => h.completedDays.includes(today));
    const hasPerfectDay = todayHabits.length > 0 && todayDone.length === todayHabits.length;

    const hour = new Date().getHours();

    return {
        totalHabits: habits.length,
        activeHabits: activeHabits.length,
        finishedHabits: finishedHabits.length,
        totalCompleted,
        bestStreak,
        hasPerfectDay,
        isPremium: typeof isPremium === 'function' && isPremium(),
        earlyBird: hour < 7 && todayDone.length > 0,
        nightOwl: hour >= 22 && todayDone.length > 0
    };
}

// ============================================
// YANGI BADGE'LARNI TEKSHIRISH
// ============================================
async function checkForNewBadges() {
    if (!currentUser) return;

    const stats = getUserStatsForBadges();
    const newBadges = [];

    for (const badge of ALL_BADGES) {
        if (!unlockedBadges.includes(badge.id) && badge.check(stats)) {
            try {
                const result = await insertBadge(currentUser.id, badge.id);
                if (result) {
                    unlockedBadges.push(badge.id);
                    newBadges.push(badge);
                }
            } catch (err) {
                console.error('[Badges] insertBadge xatosi:', err);
            }
        }
    }

    if (newBadges.length > 0) {
        newBadges.forEach((badge, i) => {
            setTimeout(() => showBadgeNotification(badge), i * 1500);
        });
        renderBadgesPreview();
    }
}

// ============================================
// POPUP
// ============================================
function showBadgeNotification(badge) {
    const popup = document.createElement('div');
    popup.className = 'badge-popup';
    popup.innerHTML = `
        <div class="badge-popup-icon">${badge.icon}</div>
        <div class="badge-popup-info">
            <strong>🎉 Yangi yutuq!</strong>
            <div>${badge.name}</div>
            <small>${badge.desc}</small>
        </div>
    `;
    document.body.appendChild(popup);

    if (typeof triggerConfetti === 'function') triggerConfetti();
    if (typeof playSound === 'function') playSound('success');

    setTimeout(() => popup.classList.add('show'), 10);
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 300);
    }, 4000);
}

// ============================================
// PREVIEW (asosiy sahifada)
// ============================================
function renderBadgesPreview() {
    const row = document.getElementById('badgesRow');
    if (!row) return;

    const recent = unlockedBadges.slice(-6).reverse();

    if (recent.length === 0) {
        row.innerHTML = '<p style="color:#999;font-size:13px;">Hali yutuq yo\'q. Odatlaringizni bajarib boshlang! 🌱</p>';
        return;
    }

    row.innerHTML = recent.map(id => {
        const badge = ALL_BADGES.find(b => b.id === id);
        if (!badge) return '';
        return `
            <div class="badge-mini" title="${badge.name}: ${badge.desc}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            </div>
        `;
    }).join('');
}

// ============================================
// YUTUQLAR SAHIFASI
// ============================================
function showAchievements() {
    document.getElementById('achievementsPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    grid.innerHTML = ALL_BADGES.map(badge => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${isUnlocked ? badge.icon : '🔒'}</div>
                <div class="achievement-name">${badge.name}</div>
                <div class="achievement-desc">${badge.desc}</div>
                ${isUnlocked ? '<div class="achievement-badge">✅ Ochilgan</div>' : ''}
            </div>
        `;
    }).join('');
}