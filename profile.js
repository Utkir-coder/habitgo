// ============================================
// HABITGO — Profil (i18n bilan)
// ============================================

function showProfile() {
    document.getElementById('profilePage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    if (!currentUser) return;

    const name = currentUserProfile?.name || currentUser.email.split('@')[0] || 'Foydalanuvchi';
    const email = currentUserProfile?.email || currentUser.email || '-';
    const plan = currentUserStats?.plan || 'free';

    document.getElementById('profileAvatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('profilePlan').textContent = getPlanName(plan);
    document.getElementById('profileJoined').textContent = formatDate(currentUserProfile?.joined_at);

    document.getElementById('pTotalHabits').textContent = habits.length;
    document.getElementById('pTotalDone').textContent = habits.reduce((sum, h) => sum + h.completedDays.length, 0);
    document.getElementById('pBestStreak').textContent = habits.length > 0
        ? Math.max(...habits.map(h => h.streak)) : 0;
}

function getPlanName(plan) {
    return {
        free: t('plan_free'),
        monthly: t('plan_monthly'),
        yearly: t('plan_yearly')
    }[plan] || t('plan_free');
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const months = {
        uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
        ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    const monthNames = months[currentLang] || months.uz;
    return `${d.getDate()}-${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
}

function closePage() {
    document.getElementById('profilePage').style.display = 'none';
    document.getElementById('subscriptionPage').style.display = 'none';
    document.getElementById('achievementsPage').style.display = 'none';
    document.getElementById('statisticsPage').style.display = 'none';
    document.getElementById('backupPage').style.display = 'none';
}