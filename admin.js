// ============================================
// HABITGO — Admin Panel
// ============================================

const SUPABASE_URL = 'https://zispqithqfobiveofltm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppc3BxaXRocWZvYml2ZW9mbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTM5OTUsImV4cCI6MjEwNjkyOTk5NX0.v0EnDWu2PVaTaK0pr64XwHEJ3hPnlTQCPTMfmXprLzA';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let allUsers = [];
let allHabits = [];
let allTasks = [];
let allStats = [];

// ============================================
// SAHIFA YUKLANGANDA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    checkAdminSession();
});

async function checkAdminSession() {
    try {
        var session = await supabaseClient.auth.getSession();

        if (!session.data.session) {
            showLogin();
            return;
        }

        var user = session.data.session.user;
        var isAdmin = await checkIsAdmin(user.id);

        if (isAdmin) {
            showAdminPanel(user);
        } else {
            showAccessDenied();
        }
    } catch (err) {
        console.error('[Admin] Xato:', err);
        showLogin();
    }
}

async function checkIsAdmin(userId) {
    try {
        var result = await supabaseClient
            .from('admins')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        return result.data !== null;
    } catch (err) {
        console.error('[Admin] Admin tekshirish xatosi:', err);
        return false;
    }
}

function showLogin() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('adminPage').style.display = 'none';
}

function showAccessDenied() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('accessDenied').style.display = 'flex';
    document.getElementById('adminPage').style.display = 'none';
}

function showAdminPanel(user) {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('accessDenied').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    document.getElementById('adminEmailDisplay').textContent = user.email;

    loadAllData();
}

// ============================================
// ADMIN LOGIN
// ============================================
async function adminLogin() {
    var email = document.getElementById('adminEmail').value.trim().toLowerCase();
    var password = document.getElementById('adminPassword').value;
    var errorEl = document.getElementById('loginError');

    if (!email || !password) {
        errorEl.textContent = '❌ Email va parolni kiriting!';
        return;
    }

    errorEl.textContent = '⏳ Tekshirilmoqda...';

    try {
        var result = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (result.error) {
            errorEl.textContent = '❌ ' + result.error.message;
            return;
        }

        var user = result.data.user;
        var isAdmin = await checkIsAdmin(user.id);

        if (isAdmin) {
            showAdminPanel(user);
        } else {
            await supabaseClient.auth.signOut();
            errorEl.textContent = '🚫 Siz admin emassiz!';
            showAccessDenied();
        }
    } catch (err) {
        console.error('[Admin] Login xatosi:', err);
        errorEl.textContent = '❌ Xato: ' + err.message;
    }
}

async function adminLogout() {
    if (!confirm('Chiqishni xohlaysizmi?')) return;
    await supabaseClient.auth.signOut();
    location.reload();
}

// ============================================
// MA'LUMOTLARNI YUKLASH
// ============================================
async function loadAllData() {
    try {
        // 1. Foydalanuvchilar
        var profilesResult = await supabaseClient.from('user_profiles').select('*');
        var statsResult = await supabaseClient.from('user_stats').select('*');
        var habitsResult = await supabaseClient.from('habits').select('*');
        var tasksResult = await supabaseClient.from('tasks').select('*');

        allUsers = profilesResult.data || [];
        allStats = statsResult.data || [];
        allHabits = habitsResult.data || [];
        allTasks = tasksResult.data || [];

        renderStats();
        renderUsers();

    } catch (err) {
        console.error('[Admin] Ma\'lumot yuklash xatosi:', err);
    }
}

// ============================================
// STATISTIKA
// ============================================
function renderStats() {
    var today = new Date().toISOString().split('T')[0];

    var totalUsers = allUsers.length;
    var todayUsers = allUsers.filter(function(u) {
        return u.joined_at && u.joined_at.split('T')[0] === today;
    }).length;

    var activeUsers = 0;
    var totalHabits = allHabits.length;
    var totalCompleted = 0;
    var totalTasks = allTasks.length;

    // Har bir foydalanuvchi uchun
    var userCompletedMap = {};

    allHabits.forEach(function(h) {
        var userId = h.user_id;
        var completedCount = (h.completed_days || []).length;
        totalCompleted += completedCount;

        if (!userCompletedMap[userId]) userCompletedMap[userId] = 0;
        userCompletedMap[userId] += completedCount;
    });

    // Faol foydalanuvchilar (bugun bajarganlar)
    allUsers.forEach(function(u) {
        var userHabits = allHabits.filter(function(h) { return h.user_id === u.user_id; });
        var hasTodayActivity = userHabits.some(function(h) {
            return (h.completed_days || []).indexOf(today) !== -1;
        });
        if (hasTodayActivity) activeUsers++;
    });

    document.getElementById('statTotalUsers').textContent = totalUsers;
    document.getElementById('statTodayUsers').textContent = todayUsers;
    document.getElementById('statActiveUsers').textContent = activeUsers;
    document.getElementById('statTotalHabits').textContent = totalHabits;
    document.getElementById('statTotalCompleted').textContent = totalCompleted;
    document.getElementById('statTotalTasks').textContent = totalTasks;
}

// ============================================
// FOYDALANUVCHILAR JADVALI
// ============================================
function renderUsers(filter) {
    filter = filter || '';
    var tbody = document.getElementById('usersTable');
    var filtered = allUsers;

    if (filter) {
        var f = filter.toLowerCase();
        filtered = allUsers.filter(function(u) {
            return (u.name && u.name.toLowerCase().indexOf(f) !== -1) ||
                   (u.email && u.email.toLowerCase().indexOf(f) !== -1);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading-row">Foydalanuvchi topilmadi</td></tr>';
        document.getElementById('usersCount').textContent = '0 ta foydalanuvchi';
        return;
    }

    tbody.innerHTML = filtered.map(function(user, index) {
        var userStats = allStats.find(function(s) { return s.user_id === user.user_id; }) || {};
        var userHabits = allHabits.filter(function(h) { return h.user_id === user.user_id; });
        var userTasks = allTasks.filter(function(t) { return t.user_id === user.user_id; });

        var totalCompleted = userHabits.reduce(function(sum, h) {
            return sum + (h.completed_days || []).length;
        }, 0);

        var bestStreak = userHabits.length > 0
            ? Math.max.apply(null, userHabits.map(function(h) { return h.streak || 0; }))
            : 0;

        var level = userStats.level || 1;
        var plan = userStats.plan || 'free';
        var joined = user.joined_at ? new Date(user.joined_at).toLocaleDateString('uz-UZ') : '-';

        var planBadge = plan === 'free'
            ? '<span class="badge badge-free">Bepul</span>'
            : '<span class="badge badge-premium">💎 Premium</span>';

        return '<tr>' +
            '<td>' + (index + 1) + '</td>' +
            '<td>' + escapeHtml(user.name || '-') + '</td>' +
            '<td>' + escapeHtml(user.email || '-') + '</td>' +
            '<td>' + joined + '</td>' +
            '<td>' + userHabits.length + '</td>' +
            '<td>' + totalCompleted + '</td>' +
            '<td>🔥 ' + bestStreak + '</td>' +
            '<td>⭐ ' + level + '</td>' +
            '<td>' + planBadge + '</td>' +
            '<td><button class="btn-view" onclick="showUserDetails(\'' + user.user_id + '\')">Ko\'rish</button></td>' +
        '</tr>';
    }).join('');

    document.getElementById('usersCount').textContent = filtered.length + ' ta foydalanuvchi';
}

function filterUsers() {
    var filter = document.getElementById('userSearch').value;
    renderUsers(filter);
}

// ============================================
// FOYDALANUVCHI BATAFSIL
// ============================================
function showUserDetails(userId) {
    var user = allUsers.find(function(u) { return u.user_id === userId; });
    if (!user) return;

    var userStats = allStats.find(function(s) { return s.user_id === userId; }) || {};
    var userHabits = allHabits.filter(function(h) { return h.user_id === userId; });
    var userTasks = allTasks.filter(function(t) { return t.user_id === userId; });

    var totalCompleted = userHabits.reduce(function(sum, h) {
        return sum + (h.completed_days || []).length;
    }, 0);

    var bestStreak = userHabits.length > 0
        ? Math.max.apply(null, userHabits.map(function(h) { return h.streak || 0; }))
        : 0;

    document.getElementById('modalUserName').textContent = user.name || 'Foydalanuvchi';

    var joined = user.joined_at ? new Date(user.joined_at).toLocaleString('uz-UZ') : '-';

    document.getElementById('modalUserInfo').innerHTML =
        '<p><strong>Email:</strong> <span>' + escapeHtml(user.email) + '</span></p>' +
        '<p><strong>Ro\'yxatdan o\'tgan:</strong> <span>' + joined + '</span></p>' +
        '<p><strong>Odatlar:</strong> <span>' + userHabits.length + '</span></p>' +
        '<p><strong>Bajarilgan:</strong> <span>' + totalCompleted + '</span></p>' +
        '<p><strong>Eng yaxshi streak:</strong> <span>🔥 ' + bestStreak + '</span></p>' +
        '<p><strong>Vazifalar:</strong> <span>' + userTasks.length + '</span></p>' +
        '<p><strong>Level:</strong> <span>⭐ ' + (userStats.level || 1) + '</span></p>' +
        '<p><strong>XP:</strong> <span>⚡ ' + (userStats.total_xp || 0) + '</span></p>' +
        '<p><strong>Tarif:</strong> <span>' + (userStats.plan || 'free') + '</span></p>';

    document.getElementById('userModal').style.display = 'flex';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

// ============================================
// YORDAMCHI
// ============================================
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Modal tashqarisi
document.addEventListener('click', function(e) {
    var modal = document.getElementById('userModal');
    if (modal && e.target === modal) {
        closeUserModal();
    }
});

console.log('[Admin] Tayyor');