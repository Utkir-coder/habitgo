// ============================================
// HABITGO — Leaderboard (i18n bilan)
// ============================================

let currentLeaderboardFilter = 'streak';
let allUsersCache = [];

// ============================================
// FOYDALANUVCHILARNI YIG'ISH
// ============================================
async function getAllUsersStats() {
    try {
        const { data: profiles, error: pErr } = await supabaseClient
            .from('user_profiles').select('*');
        if (pErr) { console.error('[LB] profiles xatosi:', pErr); return []; }

        const { data: stats } = await supabaseClient
            .from('user_stats').select('*');

        const { data: allHabits } = await supabaseClient
            .from('habits').select('*');

        const { data: allBadges } = await supabaseClient
            .from('badges').select('*');

        return (profiles || []).map(profile => {
            const userStats = (stats || []).find(s => s.user_id === profile.user_id) || {};
            const userHabits = (allHabits || []).filter(h => h.user_id === profile.user_id);
            const userBadges = (allBadges || []).filter(b => b.user_id === profile.user_id);

            const totalCompleted = userHabits.reduce((sum, h) => sum + (h.completed_days || []).length, 0);
            const bestStreak = userHabits.length > 0
                ? Math.max(...userHabits.map(h => h.streak || 0)) : 0;

            const totalXP = userStats.total_xp || 0;
            const level = userStats.level || 1;
            const badgesCount = userBadges.length;

            let avgPercent = 0;
            if (userHabits.length > 0) {
                let totalPercent = 0;
                userHabits.forEach(h => {
                    try {
                        const start = strToDate(h.start_date);
                        const end = strToDate(h.end_date);
                        const totalDaysSpan = Math.ceil((end - start) / 86400000) + 1;
                        const weeksCount = totalDaysSpan / 7;
                        const daysArr = (h.days || []).map(Number);
                        const totalDaysNeeded = Math.round(daysArr.length * weeksCount);
                        const doneCount = (h.completed_days || []).length;
                        const percent = Math.min(100, Math.round((doneCount / Math.max(1, totalDaysNeeded)) * 100));
                        totalPercent += percent;
                    } catch (e) {}
                });
                avgPercent = Math.round(totalPercent / userHabits.length);
            }

            return {
                id: profile.user_id, name: profile.name, email: profile.email,
                isCurrentUser: currentUser && profile.user_id === currentUser.id,
                totalHabits: userHabits.length, totalCompleted, bestStreak,
                totalXP, level, badgesCount, avgPercent,
                plan: userStats.plan || 'free'
            };
        });
    } catch (err) {
        console.error('[LB] getAllUsersStats xatosi:', err);
        return [];
    }
}

// ============================================
// SARALASH
// ============================================
function sortUsersByFilter(users, filter) {
    const sorted = [...users];
    switch (filter) {
        case 'streak': sorted.sort((a, b) => b.bestStreak - a.bestStreak); break;
        case 'completed': sorted.sort((a, b) => b.totalCompleted - a.totalCompleted); break;
        case 'level': sorted.sort((a, b) => b.level - a.level || b.totalXP - a.totalXP); break;
        case 'xp': sorted.sort((a, b) => b.totalXP - a.totalXP); break;
        case 'percent': sorted.sort((a, b) => b.avgPercent - a.avgPercent); break;
        default: sorted.sort((a, b) => b.bestStreak - a.bestStreak);
    }
    return sorted;
}

// ============================================
// SAHIFA
// ============================================
async function showLeaderboard() {
    document.getElementById('leaderboardPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    const container = document.getElementById('leaderboardList');
    if (container) {
        container.innerHTML = `<p style="text-align:center;color:#999;padding:20px;">⏳ ${t('loading')}</p>`;
    }

    allUsersCache = await getAllUsersStats();
    renderLeaderboardHeader();
    renderLeaderboard();
}

function closeLeaderboard() {
    document.getElementById('leaderboardPage').style.display = 'none';
}

function setLeaderboardFilter(filter) {
    currentLeaderboardFilter = filter;
    document.querySelectorAll('.leaderboard-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderLeaderboard();
}

// ============================================
// RENDER
// ============================================
function renderLeaderboard() {
    const container = document.getElementById('leaderboardList');
    const podiumContainer = document.getElementById('leaderboardPodium');
    const selfContainer = document.getElementById('leaderboardSelf');

    if (!container) return;

    const sorted = sortUsersByFilter(allUsersCache, currentLeaderboardFilter);

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="leaderboard-empty">
                <div class="leaderboard-empty-icon">🏆</div>
                <p>${t('leaderboard_empty')}</p>
                <small>${t('leaderboard_empty_hint')}</small>
            </div>
        `;
        if (podiumContainer) podiumContainer.innerHTML = '';
        if (selfContainer) selfContainer.innerHTML = '';
        return;
    }

    if (podiumContainer) renderPodium(podiumContainer, sorted.slice(0, 3));

    const rest = sorted.slice(3);
    if (rest.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:#999;padding:15px;font-size:13px;">${t('leaderboard_only_3')}</p>`;
    } else {
        container.innerHTML = rest.map((user, idx) => renderLeaderboardRow(user, idx + 4)).join('');
    }

    if (selfContainer && currentUser) {
        const selfIndex = sorted.findIndex(u => u.id === currentUser.id);
        if (selfIndex !== -1) {
            selfContainer.innerHTML = `
                <div class="leaderboard-self-title">${t('leaderboard_your_place')}</div>
                ${renderLeaderboardRow(sorted[selfIndex], selfIndex + 1, true)}
            `;
        }
    }
}

function renderPodium(container, top3) {
    const order = [];
    if (top3[1]) order.push({ user: top3[1], rank: 2 });
    if (top3[0]) order.push({ user: top3[0], rank: 1 });
    if (top3[2]) order.push({ user: top3[2], rank: 3 });

    container.innerHTML = `
        <div class="podium-wrapper">
            ${order.map(({ user, rank }) => {
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                const height = rank === 1 ? 'tall' : rank === 2 ? 'medium' : 'short';
                const initials = (user.name || 'U').charAt(0).toUpperCase();
                const value = getLeaderboardValue(user, currentLeaderboardFilter);

                return `
                    <div class="podium-item rank-${rank}">
                        <div class="podium-avatar ${user.isCurrentUser ? 'current' : ''}">
                            ${initials}
                            ${user.plan !== 'free' ? '<div class="podium-crown">👑</div>' : ''}
                        </div>
                        <div class="podium-medal">${medal}</div>
                        <div class="podium-name">${escapeHtml(user.name || 'Foydalanuvchi')}${user.isCurrentUser ? ' (' + t('leaderboard_you') + ')' : ''}</div>
                        <div class="podium-value">${value}</div>
                        <div class="podium-bar ${height}"></div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderLeaderboardRow(user, rank, highlight = false) {
    const value = getLeaderboardValue(user, currentLeaderboardFilter);
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const initials = (user.name || 'U').charAt(0).toUpperCase();

    let rankClass = '';
    if (rank === 1) rankClass = 'gold';
    else if (rank === 2) rankClass = 'silver';
    else if (rank === 3) rankClass = 'bronze';

    return `
        <div class="leaderboard-row ${highlight ? 'highlight' : ''} ${user.isCurrentUser ? 'self' : ''} ${rankClass}">
            <div class="leaderboard-rank">${medal}</div>
            <div class="leaderboard-avatar">${initials}</div>
            <div class="leaderboard-user">
                <div class="leaderboard-name">
                    ${escapeHtml(user.name || 'Foydalanuvchi')}${user.isCurrentUser ? ` <span class="you-badge">${t('leaderboard_you')}</span>` : ''}
                    ${user.plan !== 'free' ? ' <span class="premium-badge">💎</span>' : ''}
                </div>
                <div class="leaderboard-meta">
                    <span>📋 ${user.totalHabits}</span>
                    <span>🏆 ${user.badgesCount}</span>
                </div>
            </div>
            <div class="leaderboard-value">${value}</div>
        </div>
    `;
}

function getLeaderboardValue(user, filter) {
    switch (filter) {
        case 'streak': return `🔥 ${user.bestStreak}`;
        case 'completed': return `✅ ${user.totalCompleted}`;
        case 'level': return `⭐ Lv.${user.level}`;
        case 'xp': return `⚡ ${user.totalXP} XP`;
        case 'percent': return `📊 ${user.avgPercent}%`;
        default: return `🔥 ${user.bestStreak}`;
    }
}

// ============================================
// HEADER
// ============================================
function renderLeaderboardHeader() {
    const container = document.getElementById('leaderboardHeader');
    if (!container) return;

    const myStats = allUsersCache.find(u => u.isCurrentUser);
    if (!myStats) { container.innerHTML = ''; return; }

    const sortedByStreak = sortUsersByFilter(allUsersCache, 'streak');
    const myRank = sortedByStreak.findIndex(u => u.id === myStats.id) + 1;

    container.innerHTML = `
        <div class="lb-header-card">
            <div class="lb-header-rank">
                <div class="lb-header-rank-value">#${myRank}</div>
                <div class="lb-header-rank-label">${t('leaderboard_your_rank')}</div>
            </div>
            <div class="lb-header-info">
                <div class="lb-header-info-item">
                    <span class="lb-header-icon">🔥</span>
                    <div>
                        <strong>${myStats.bestStreak}</strong>
                        <span>Streak</span>
                    </div>
                </div>
                <div class="lb-header-info-item">
                    <span class="lb-header-icon">✅</span>
                    <div>
                        <strong>${myStats.totalCompleted}</strong>
                        <span>${t('task_stats_done')}</span>
                    </div>
                </div>
                <div class="lb-header-info-item">
                    <span class="lb-header-icon">⭐</span>
                    <div>
                        <strong>Lv.${myStats.level}</strong>
                        <span>Level</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// TAKLIF
// ============================================
function inviteFriends() {
    const shareText = 'HabitGo — ' + t('challenge_title');

    if (navigator.share) {
        navigator.share({ title: 'HabitGo', text: shareText, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareText + '\n' + window.location.href).then(() => {
            if (typeof showToast === 'function') showToast('📋');
        });
    }
}