// ============================================
// HABITGO — Challenge (i18n bilan)
// ============================================

function getAllChallenges() {
    return [
        {
            id: 'perfect_day', icon: '⭐',
            titleKey: 'challenge_perfect_day',
            descKey: 'challenge_perfect_day_desc',
            xp: 50,
            check: (s) => s.todayHabits > 0 && s.todayDone === s.todayHabits,
            progress: (s) => s.todayHabits === 0 ? 0 : Math.round((s.todayDone / s.todayHabits) * 100)
        },
        {
            id: 'three_checks', icon: '✅',
            titleKey: 'challenge_three_checks',
            descKey: 'challenge_three_checks_desc',
            xp: 20,
            check: (s) => s.todayDone >= 3,
            progress: (s) => Math.min(100, Math.round((s.todayDone / 3) * 100))
        },
        {
            id: 'early_bird', icon: '🌅',
            titleKey: 'challenge_early_bird',
            descKey: 'challenge_early_bird_desc',
            xp: 30,
            check: (s) => new Date().getHours() < 8 && s.todayDone >= 1,
            progress: (s) => new Date().getHours() >= 8 ? 0 : (s.todayDone >= 1 ? 100 : 0)
        },
        {
            id: 'add_habit', icon: '➕',
            titleKey: 'challenge_add_habit',
            descKey: 'challenge_add_habit_desc',
            xp: 25,
            check: (s) => {
                const today = getTodayStr();
                return habits.some(h => h.createdAt && h.createdAt.split('T')[0] === today);
            },
            progress: (s) => {
                const today = getTodayStr();
                return habits.some(h => h.createdAt && h.createdAt.split('T')[0] === today) ? 100 : 0;
            }
        },
        {
            id: 'keep_streak', icon: '🔥',
            titleKey: 'challenge_keep_streak',
            descKey: 'challenge_keep_streak_desc',
            xp: 40,
            check: (s) => {
                const today = getTodayStr();
                return habits.some(h => h.lastCheck === today && h.streak >= 3);
            },
            progress: (s) => {
                const today = getTodayStr();
                return habits.some(h => h.lastCheck === today && h.streak >= 3) ? 100 : 0;
            }
        },
        {
            id: 'half_done', icon: '💪',
            titleKey: 'challenge_half_done',
            descKey: 'challenge_half_done_desc',
            xp: 15,
            check: (s) => s.todayHabits > 0 && s.todayDone >= Math.ceil(s.todayHabits / 2),
            progress: (s) => {
                if (s.todayHabits === 0) return 0;
                const half = Math.ceil(s.todayHabits / 2);
                return Math.min(100, Math.round((s.todayDone / half) * 100));
            }
        }
    ];
}

// ============================================
// YORDAMCHI
// ============================================
function getTodayChallengeKey() {
    return `habitgo_challenge_${getTodayStr()}`;
}

function getTodayChallenge() {
    const today = getTodayStr();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = (hash * 31 + today.charCodeAt(i)) % 10000;
    }
    const ALL_CHALLENGES = getAllChallenges();
    return ALL_CHALLENGES[hash % ALL_CHALLENGES.length];
}

function getChallengeStats() {
    const today = getTodayStr();
    const todayDay = new Date().getDay();
    const activeHabits = habits.filter(h => isHabitActive(h));
    const todayHabits = activeHabits.filter(h => h.days.includes(todayDay));
    const todayDone = todayHabits.filter(h => h.completedDays.includes(today));

    return {
        todayHabits: todayHabits.length,
        todayDone: todayDone.length,
        activeHabits: activeHabits.length
    };
}

function getChallengeStatus() {
    const key = getTodayChallengeKey();
    return JSON.parse(localStorage.getItem(key)) || {
        completed: false, completedAt: null, xpEarned: 0
    };
}

function saveChallengeStatus(status) {
    localStorage.setItem(getTodayChallengeKey(), JSON.stringify(status));
}

// ============================================
// XP / LEVEL
// ============================================
function getUserXP() {
    if (!currentUserStats) return { totalXP: 0, level: 1 };
    return {
        totalXP: currentUserStats.total_xp || 0,
        level: currentUserStats.level || 1
    };
}

function getXPProgress() {
    const data = getUserXP();
    const currentLevelXP = (data.level - 1) * 100;
    const nextLevelXP = data.level * 100;
    const currentProgress = data.totalXP - currentLevelXP;
    const needed = nextLevelXP - currentLevelXP;

    return {
        current: currentProgress,
        needed: needed,
        percent: Math.min(100, Math.round((currentProgress / needed) * 100)),
        level: data.level,
        totalXP: data.totalXP
    };
}

async function addXP(amount) {
    if (!currentUser || !currentUserStats) return;

    const newTotalXP = (currentUserStats.total_xp || 0) + amount;
    const newLevel = Math.floor(newTotalXP / 100) + 1;
    const levelUp = newLevel > (currentUserStats.level || 1);

    currentUserStats.total_xp = newTotalXP;
    currentUserStats.level = newLevel;

    try {
        await updateUserStats(currentUser.id, {
            total_xp: newTotalXP, level: newLevel
        });

        if (levelUp) {
            setTimeout(() => {
                if (typeof playSound === 'function') playSound('success');
                if (typeof triggerConfetti === 'function') triggerConfetti();
                alert(`🎉 ${t('challenge_level_up')} ${newLevel}!`);
            }, 2000);
        }
    } catch (err) {
        console.error('[Challenge] addXP xatosi:', err);
    }
}

// ============================================
// CHALLENGE BAJARISH
// ============================================
async function completeChallenge() {
    const challenge = getTodayChallenge();
    const status = getChallengeStatus();

    if (status.completed) return;

    const stats = getChallengeStats();
    if (!challenge.check(stats)) {
        alert('⚠️ ' + t('challenge_not_done'));
        return;
    }

    status.completed = true;
    status.completedAt = new Date().toISOString();
    status.xpEarned = challenge.xp;
    saveChallengeStatus(status);

    await addXP(challenge.xp);

    if (typeof playSound === 'function') playSound('success');
    if (typeof triggerConfetti === 'function') triggerConfetti();

    showChallengeCompletedPopup(challenge);
    renderChallenge();
}

// ============================================
// RENDER
// ============================================
function renderChallenge() {
    const container = document.getElementById('challengeCard');
    if (!container) return;

    const challenge = getTodayChallenge();
    const status = getChallengeStatus();
    const stats = getChallengeStats();
    const progress = challenge.progress(stats);
    const isCompleted = status.completed;
    const levelProgress = getXPProgress();

    container.innerHTML = `
        <div class="challenge-header">
            <div class="challenge-title">
                <span class="challenge-icon">${challenge.icon}</span>
                <div>
                    <h3>${t('challenge_title')}</h3>
                    <p class="challenge-name">${t(challenge.titleKey)}</p>
                </div>
            </div>
            <div class="challenge-xp">+${challenge.xp} XP</div>
        </div>

        <p class="challenge-desc">${t(challenge.descKey)}</p>

        <div class="challenge-progress">
            <div class="challenge-progress-bar">
                <div class="challenge-progress-fill ${isCompleted ? 'completed' : ''}"
                     style="width: ${isCompleted ? 100 : progress}%"></div>
            </div>
            <div class="challenge-progress-text">
                ${isCompleted ? '✅ ' + t('challenge_done_btn') : `${progress}%`}
            </div>
        </div>

        ${isCompleted
            ? `<div class="challenge-done">${t('challenge_done')}</div>`
            : `<button class="challenge-btn" onclick="completeChallenge()" ${progress < 100 ? 'disabled' : ''}>
                ${progress >= 100 ? '✅ ' + t('challenge_reward') : t('challenge_continue')}
            </button>`
        }

        <div class="level-info">
            <div class="level-badge">${t('challenge_level')} ${levelProgress.level}</div>
            <div class="level-bar-wrapper">
                <div class="level-bar">
                    <div class="level-fill" style="width: ${levelProgress.percent}%"></div>
                </div>
                <div class="level-text">${levelProgress.current} / ${levelProgress.needed} XP</div>
            </div>
        </div>
    `;
}

// ============================================
// POPUP
// ============================================
function showChallengeCompletedPopup(challenge) {
    const popup = document.createElement('div');
    popup.className = 'challenge-popup';
    popup.innerHTML = `
        <div class="challenge-popup-inner">
            <div class="challenge-popup-icon">🎉</div>
            <h2>${t('challenge_complete')}</h2>
            <div class="challenge-popup-title">${challenge.icon} ${t(challenge.titleKey)}</div>
            <div class="challenge-popup-xp">+${challenge.xp} XP</div>
            <button onclick="this.parentElement.parentElement.remove()">${t('challenge_great')}</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
    setTimeout(() => {
        if (popup.parentElement) {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
}