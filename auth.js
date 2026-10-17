// ============================================
// HABITGO — Auth (Safari + iOS fix, xatosiz)
// ============================================

var currentUser = null;
var currentUserProfile = null;
var currentUserStats = null;
var authReady = false;

// ============================================
// SAFARI ANIQLASH
// ============================================
function isSafariBrowser() {
    var ua = navigator.userAgent;
    return /Safari/i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua);
}

function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// ============================================
// SAHIFA BOSHQARUVI
// ============================================
function showLanding() {
    var landing = document.getElementById('landingPage');
    var app = document.getElementById('appPage');

    if (landing) landing.style.display = 'block';
    if (app) app.style.display = 'none';

    if (typeof closePage === 'function') closePage();
}

function showApp() {
    var landing = document.getElementById('landingPage');
    var app = document.getElementById('appPage');

    if (landing) landing.style.display = 'none';
    if (app) app.style.display = 'block';

    // XATOLIKNI OLDINI OLISH UCHUN TEKSHIRUV
    var nameEl = document.getElementById('userName');
    var avatarEl = document.getElementById('userAvatar');

    if (currentUserProfile && nameEl && avatarEl) {
        var name = currentUserProfile.name || 'Foydalanuvchi';
        nameEl.textContent = name;
        avatarEl.textContent = name.charAt(0).toUpperCase();
    } else if (currentUser && avatarEl) {
        var fallbackName = currentUser.email.split('@')[0];
        avatarEl.textContent = fallbackName.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = fallbackName;
    }

    if (typeof initApp === 'function') {
        setTimeout(function() { initApp(); }, 100);
    }
}

// ============================================
// MODAL BOSHQARUVI
// ============================================
function showLogin() {
    var modal = document.getElementById('authModal');
    var loginForm = document.getElementById('loginForm');
    var regForm = document.getElementById('registerForm');

    if (modal) modal.style.display = 'flex';
    if (loginForm) loginForm.style.display = 'block';
    if (regForm) regForm.style.display = 'none';
}

function showRegister() {
    var modal = document.getElementById('authModal');
    var loginForm = document.getElementById('loginForm');
    var regForm = document.getElementById('registerForm');

    if (modal) modal.style.display = 'flex';
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
}

function closeModal() {
    var modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

// ============================================
// RO'YXATDAN O'TISH
// ============================================
async function register() {
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim().toLowerCase();
    var password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        alert('❌ ' + t('auth_fill_all'));
        return;
    }
    if (password.length < 6) {
        alert('❌ ' + t('auth_password_short'));
        return;
    }
    if (email.indexOf('@') === -1) {
        alert('❌ ' + t('auth_email_invalid'));
        return;
    }

    var btn = document.querySelector('#registerForm button');
    var originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        var result = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { name: name } }
        });

        if (result.error) {
            alert('❌ ' + result.error.message);
            return;
        }

        if (!result.data.user) {
            alert('❌ ' + t('error'));
            return;
        }

        currentUser = result.data.user;

        await new Promise(function(r) { setTimeout(r, 1500); });

        var profileData = await ensureUserProfile(currentUser.id, name, email);
        currentUserProfile = profileData.profile;
        currentUserStats = profileData.stats;

        closeModal();
        showApp();

        if (typeof trackRegister === 'function') trackRegister('email');
        alert('🎉 ' + t('auth_welcome') + ', ' + name + '!');

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
    var email = document.getElementById('loginEmail').value.trim().toLowerCase();
    var password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('❌ ' + t('auth_fill_all'));
        return;
    }

    var btn = document.querySelector('#loginForm button');
    var originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        var result = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (result.error) {
            alert('❌ ' + t('auth_login_error'));
            return;
        }

        currentUser = result.data.user;
        var name = (currentUser.user_metadata && currentUser.user_metadata.name) || email.split('@')[0];

        var profileData = await ensureUserProfile(currentUser.id, name, email);
        currentUserProfile = profileData.profile;
        currentUserStats = profileData.stats;

        closeModal();
        showApp();

        if (typeof trackLogin === 'function') trackLogin('email');
        alert('👋 ' + t('auth_welcome') + '!');

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
        if (typeof trackLogout === 'function') trackLogout();
        await supabaseClient.auth.signOut();
        currentUser = null;
        currentUserProfile = null;
        currentUserStats = null;

        var dd = document.getElementById('profileDropdown');
        if (dd) dd.classList.remove('show');

        showLanding();
        alert('👋 ' + t('auth_bye'));
    } catch (err) {
        console.error('[Auth] Logout xatosi:', err);
    }
}

// ============================================
// PROFIL MENYUSI — SAFARI + iOS FIX
// ============================================
function toggleProfileMenu() {
    var dropdown = document.getElementById('profileDropdown');
    var menu = document.querySelector('.profile-menu');
    var header = document.querySelector('.header');

    if (!dropdown || !menu) return;

    var isOpen = dropdown.classList.contains('show');

    if (isOpen) {
        dropdown.classList.remove('show');
        dropdown.removeAttribute('style');
        return;
    }

    var safari = isSafariBrowser();
    var ios = isIOSDevice();
    var isMobile = window.innerWidth <= 768;

    dropdown.removeAttribute('style');

    if (isMobile || safari || ios) {
        if (safari || ios) {
            dropdown.style.cssText =
                'position: absolute !important;' +
                'top: 100% !important;' +
                'right: 0 !important;' +
                'left: auto !important;' +
                'margin-top: 8px !important;' +
                'width: 240px !important;' +
                'max-width: calc(100vw - 24px) !important;' +
                'background: #f4f1ea !important;' +
                'border: 1px solid #d1c8b4 !important;' +
                'padding: 8px !important;' +
                'z-index: 99999 !important;' +
                'max-height: 70vh !important;' +
                'overflow-y: auto !important;' +
                '-webkit-overflow-scrolling: touch !important;' +
                'box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;';
            menu.style.position = 'relative';
        } else {
            var headerRect = header ? header.getBoundingClientRect() : { bottom: 60 };
            dropdown.style.cssText =
                'position: fixed !important;' +
                'top: ' + (headerRect.bottom + 4) + 'px !important;' +
                'right: 10px !important;' +
                'left: auto !important;' +
                'width: 240px !important;' +
                'max-width: calc(100vw - 20px) !important;' +
                'background: #f4f1ea !important;' +
                'border: 1px solid #d1c8b4 !important;' +
                'padding: 8px !important;' +
                'z-index: 99999 !important;' +
                'max-height: ' + (window.innerHeight - headerRect.bottom - 20) + 'px !important;' +
                'overflow-y: auto !important;' +
                '-webkit-overflow-scrolling: touch !important;' +
                'box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;';
        }
    }

    if (document.body.classList.contains('dark')) {
        dropdown.style.background = '#0a0e0c';
        dropdown.style.borderColor = '#c5a059';
    }

    dropdown.classList.add('show');
}

// ============================================
// TASHQARIGA BOSILGANDA YOPISH
// ============================================
document.addEventListener('click', function(e) {
    var menu = document.querySelector('.profile-menu');
    var dropdown = document.getElementById('profileDropdown');
    if (menu && dropdown && !menu.contains(e.target)) {
        dropdown.classList.remove('show');
        dropdown.removeAttribute('style');
    }
});

window.addEventListener('scroll', function() {
    if (window.innerWidth <= 768) {
        var dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            dropdown.removeAttribute('style');
        }
    }
}, { passive: true });

// ============================================
// AVTOMATIK KIRISH
// ============================================
async function initializeAuth() {
    if (authReady) return;
    authReady = true;

    console.log('[Auth] ===== Boshlash =====');

    try {
        var session = await getSession();
        console.log('[Auth] Sessiya:', session ? session.user.email : 'yo\'q');

        if (!session || !session.user) {
            showLanding();
            return;
        }

        currentUser = session.user;
        var name = (currentUser.user_metadata && currentUser.user_metadata.name) || currentUser.email.split('@')[0];

        var profileData = await ensureUserProfile(currentUser.id, name, currentUser.email);
        currentUserProfile = profileData.profile;
        currentUserStats = profileData.stats;

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
supabaseClient.auth.onAuthStateChange(function(event, session) {
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
// PREMIUM (Bepul versiya)
// ============================================
function isPremium() {
    return true;
}