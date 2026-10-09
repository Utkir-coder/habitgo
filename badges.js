// ============================================
// HABITGO — Badges (i18n bilan)
// ============================================

function getAllBadges() {
    return [
        { id: 'first_habit', icon: '🌱', nameKey: 'badge_first_habit', descKey: 'badge_first_habit_desc', check: (s) => s.totalHabits >= 1 },
        { id: 'first_check', icon: '✅', nameKey: 'badge_first_check', descKey: 'badge_first_check_desc', check: (s) => s.totalCompleted >= 1 },
        { id: 'streak_3', icon: '🔥', nameKey: 'badge_streak_3', descKey: 'badge_streak_3_desc', check: (s) => s.bestStreak >= 3 },
        { id: 'streak_7', icon: '🔥', nameKey: 'badge_streak_7', descKey: 'badge_streak_7_desc', check: (s) => s.bestStreak >= 7 },
        { id: 'streak_30', icon: '💎', nameKey: 'badge_streak_30', descKey: 'badge_streak_30_desc', check: (s) => s.bestStreak >= 30 },
        { id: 'streak_100', icon: '👑', nameKey: 'badge_streak_100', descKey: 'badge_streak_100_desc', check: (s) => s.bestStreak >= 100 },
        { id: 'habit_5', icon: '📚', nameKey: 'badge_habit_5', descKey: 'badge_habit_5_desc', check: (s) => s.totalHabits >= 5 },
        { id: 'habit_10', icon: '📖', nameKey: 'badge_habit_10', descKey: 'badge_habit_10_desc', check: (s) => s.totalHabits >= 10 },
        { id: 'done_10', icon: '🎯', nameKey: 'badge_done_10', descKey: 'badge_done_10_desc', check: (s) => s.totalCompleted >= 10 },
        { id: 'done_50', icon: '🏅', nameKey: 'badge_done_50', descKey: 'badge_done_50_desc', check: (s) => s.totalCompleted >= 50 },
        { id: 'done_100', icon: '🏆', nameKey: 'badge_done_100', descKey: 'badge_done_100_desc', check: (s) => s.totalCompleted >= 100 },
        { id: 'perfect_day', icon: '⭐', nameKey: 'badge_perfect_day', descKey: 'badge_perfect_day_desc', check: (s) => s.hasPerfectDay },
        { id: 'finished_habit', icon: '🎓', nameKey: 'badge_finished_habit', descKey: 'badge_finished_habit_desc', check: (s) => s.finishedHabits >= 1 },
        { id: 'finished_5', icon: '🎖', nameKey: 'badge_finished_5', descKey: 'badge_finished_5_desc', check: (s) => s.finishedHabits >= 5 },
        { id: 'premium', icon: '💎', nameKey: 'badge_premium', descKey: 'badge_premium_desc', check: (s) => s.isPremium },
        { id: 'early_bird', icon: '🌅', nameKey: 'badge_early_bird', descKey: 'badge_early_bird_desc', check: (s) => s.earlyBird },
        { id: 'night_owl', icon: '🦉', nameKey: 'badge_night_owl', descKey: 'badge_night_owl_desc', check: (s) => s.nightOwl }
    ];
}

let unlockedBadges = [];

// ============================================
// YUKLASH
// ============================================
async function loadBadges() {
    if (!currentUser) { unlockedBadges = []; return; }
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
        totalCompleted, bestStreak, hasPerfectDay,
        isPremium: typeof isPremium === 'function' && isPremium(),
        earlyBird: hour < 7 && todayDone.length > 0,
        nightOwl: hour >= 22 && todayDone.length > 0
    };
}

// ============================================
// YANGI BADGE'LAR
// ============================================
async function checkForNewBadges() {
    if (!currentUser) return;
    const ALL_BADGES = getAllBadges();
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
            <strong>${t('badge_unlocked')}</strong>
            <div>${t(badge.nameKey)}</div>
            <small>${t(badge.descKey)}</small>
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
// PREVIEW
// ============================================
function renderBadgesPreview() {
    const row = document.getElementById('badgesRow');
    if (!row) return;

    const ALL_BADGES = getAllBadges();
    const recent = unlockedBadges.slice(-6).reverse();

    if (recent.length === 0) {
        row.innerHTML = `<p style="color:#999;font-size:13px;">${t('badge_no_badges')}</p>`;
        return;
    }

    row.innerHTML = recent.map(id => {
        const badge = ALL_BADGES.find(b => b.id === id);
        if (!badge) return '';
        return `
            <div class="badge-mini" title="${t(badge.nameKey)}: ${t(badge.descKey)}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${t(badge.nameKey)}</div>
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

    const ALL_BADGES = getAllBadges();

    grid.innerHTML = ALL_BADGES.map(badge => {
        const isUnlocked = unlockedBadges.includes(badge.id);
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${isUnlocked ? badge.icon : '🔒'}</div>
                <div class="achievement-name">${t(badge.nameKey)}</div>
                <div class="achievement-desc">${t(badge.descKey)}</div>
                ${isUnlocked ? `<div class="achievement-badge">${t('badge_unlocked_label')}</div>` : ''}
            </div>
        `;
    }).join('');
}