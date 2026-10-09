// ============================================
// HABITGO — Auth (i18n bilan)
// ============================================

let currentUser = null;
let currentUserProfile = null;
let currentUserStats = null;
let authReady = false;

function showLanding() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('appPage').style.display = 'none';
    if (typeof closePage === 'function') closePage();
}

function showApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';

    if (currentUserProfile) {
        const name = currentUserProfile.name || 'Foydalanuvchi';
        document.getElementById('userName').textContent = name;
        document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    }

    if (typeof initApp === 'function') {
        setTimeout(() => initApp(), 100);
    }
}

function showLogin() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function closeModal() {
    document.getElementById('authModal').style.display = 'none';
}

// ============================================
// RO'YXATDAN O'TISH
// ============================================
async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        alert('❌ ' + t('auth_fill_all'));
        return;
    }
    if (password.length < 6) {
        alert('❌ ' + t('auth_password_short'));
        return;
    }
    if (!email.includes('@')) {
        alert('❌ ' + t('auth_email_invalid'));
        return;
    }

    const btn = document.querySelector('#registerForm button');
    const originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { name: name } }
        });

        if (error) {
            alert('❌ ' + error.message);
            return;
        }

        if (!data.user) {
            alert('❌ ' + t('error'));
            return;
        }

        currentUser = data.user;

        await new Promise(r => setTimeout(r, 1500));

        const { profile, stats } = await ensureUserProfile(currentUser.id, name, email);
        currentUserProfile = profile;
        currentUserStats = stats;

        closeModal();
        showApp();
        alert(`🎉 ${t('auth_welcome')}, ${name}!`);

    } catch (err) {
        console.error('[Auth] Register xatosi:', err);
        alert('❌ ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ============================================
// KIRISH
// ============================================
async function login() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('❌ ' + t('auth_fill_all'));
        return;
    }

    const btn = document.querySelector('#loginForm button');
    const originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert('❌ ' + t('auth_login_error'));
            return;
        }

        currentUser = data.user;
        const name = currentUser.user_metadata?.name || email.split('@')[0];

        const { profile, stats } = await ensureUserProfile(currentUser.id, name, email);
        currentUserProfile = profile;
        currentUserStats = stats;

        closeModal();
        showApp();
        alert(`👋 ${t('auth_welcome')}!`);

    } catch (err) {
        console.error('[Auth] Login xatosi:', err);
        alert('❌ ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ============================================
// CHIQISH
// ============================================
async function logout() {
    if (!confirm(t('auth_logout_confirm'))) return;

    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        currentUserProfile = null;
        currentUserStats = null;
        document.getElementById('profileDropdown').classList.remove('show');
        showLanding();
        alert('👋 ' + t('auth_bye'));
    } catch (err) {
        console.error('[Auth] Logout xatosi:', err);
    }
}

// ============================================
// PROFIL MENYUSI
// ============================================
function toggleProfileMenu() {
    document.getElementById('profileDropdown').classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const menu = document.querySelector('.profile-menu');
    if (menu && !menu.contains(e.target)) {
        const dd = document.getElementById('profileDropdown');
        if (dd) dd.classList.remove('show');
    }
});

// ============================================
// AVTOMATIK KIRISH
// ============================================
async function initializeAuth() {
    if (authReady) return;
    authReady = true;

    console.log('[Auth] ===== Boshlash =====');

    try {
        const session = await getSession();
        console.log('[Auth] Sessiya:', session ? session.user.email : 'yo\'q');

        if (!session || !session.user) {
            showLanding();
            return;
        }

        currentUser = session.user;
        const name = currentUser.user_metadata?.name || currentUser.email.split('@')[0];

        const { profile, stats } = await ensureUserProfile(currentUser.id, name, currentUser.email);
        currentUserProfile = profile;
        currentUserStats = stats;

        showApp();
        console.log('[Auth] ===== Tayyor =====');

    } catch (err) {
        console.error('[Auth] initializeAuth xatosi:', err);
        showLanding();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// ============================================
// AUTH HOLATI
// ============================================
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] State:', event);

    if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentUserProfile = null;
        currentUserStats = null;
        showLanding();
    } else if (event === 'TOKEN_REFRESHED' && session) {
        currentUser = session.user;
    }
});

// ============================================
// PREMIUM
// ============================================
function isPremium() {
    if (!currentUserStats) return false;
    if (currentUserStats.plan === 'free') return false;
    return true;
}