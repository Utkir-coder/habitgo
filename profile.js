// ============================================
// HABITGO — Profil (Bepul versiya)
// ============================================

function showProfile() {
    document.getElementById('profilePage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    if (!currentUser) return;

    var name = (currentUserProfile && currentUserProfile.name) || currentUser.email.split('@')[0] || 'Foydalanuvchi';
    var email = (currentUserProfile && currentUserProfile.email) || currentUser.email || '-';
    var joined = (currentUserProfile && currentUserProfile.joined_at) || null;

    document.getElementById('profileAvatar').textContent = name.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('profileJoined').textContent = formatDate(joined);

    // Statistika — habits massividan
    var totalHabits = habits.length;
    var totalDone = 0;
    var bestStreak = 0;

    for (var i = 0; i < habits.length; i++) {
        totalDone += habits[i].completedDays.length;
        if (habits[i].streak > bestStreak) {
            bestStreak = habits[i].streak;
        }
    }

    document.getElementById('pTotalHabits').textContent = totalHabits;
    document.getElementById('pTotalDone').textContent = totalDone;
    document.getElementById('pBestStreak').textContent = bestStreak;
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    var d = new Date(isoStr);
    var months = {
        uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
        ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var monthNames = months[currentLang] || months.uz;
    return d.getDate() + '-' + monthNames[d.getMonth()] + ', ' + d.getFullYear();
}

function closePage() {
    document.getElementById('profilePage').style.display = 'none';
    document.getElementById('achievementsPage').style.display = 'none';
    document.getElementById('statisticsPage').style.display = 'none';
    document.getElementById('backupPage').style.display = 'none';
}