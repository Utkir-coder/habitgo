// ============================================
// HABITGO — Auth (Analytics bilan)
// ============================================

var currentUser = null;
var currentUserProfile = null;
var currentUserStats = null;
var authReady = false;

function isSafariBrowser() {
    var ua = navigator.userAgent;
    return /Safari/i.test(ua) && !/Chrome/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua);
}

function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function showLanding() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('appPage').style.display = 'none';
    if (typeof closePage === 'function') closePage();
}

function showApp() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('appPage').style.display = 'block';

    if (currentUserProfile) {
        var name = currentUserProfile.name || 'Foydalanuvchi';
        document.getElementById('userName').textContent = name;
        document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    }

    if (typeof initApp === 'function') {
        setTimeout(function() { initApp(); }, 100);
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

async function logout() {
    if (!confirm(t('auth_logout_confirm'))) return;

    try {
        if (typeof trackLogout === 'function') trackLogout();
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
                'background: #ffffff !important;' +
                'border-radius: 14px !important;' +
                'box-shadow: 0 15px 50px rgba(0,0,0,0.35) !important;' +
                'padding: 8px !important;' +
                'z-index: 99999 !important;' +
                'max-height: 70vh !important;' +
                'overflow-y: auto !important;' +
                '-webkit-overflow-scrolling: touch !important;' +
                'border: 1px solid #e0e0e0 !important;' +
                '-webkit-transform: translateZ(0) !important;' +
                'transform: translateZ(0) !important;';
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
                'background: #ffffff !important;' +
                'border-radius: 14px !important;' +
                'box-shadow: 0 15px 50px rgba(0,0,0,0.35) !important;' +
                'padding: 8px !important;' +
                'z-index: 99999 !important;' +
                'max-height: ' + (window.innerHeight - headerRect.bottom - 20) + 'px !important;' +
                'overflow-y: auto !important;' +
                '-webkit-overflow-scrolling: touch !important;' +
                'border: 1px solid #e0e0e0 !important;';
        }
    }

    if (document.body.classList.contains('dark')) {
        dropdown.style.background = '#1e1e2e';
        dropdown.style.borderColor = '#3a3a4e';
    }

    dropdown.classList.add('show');
}

document.addEventListener('click', function(e) {
    var menu = document.querySelector('.profile-menu');
    var dropdown = document.getElementById('profileDropdown');
    if (menu && dropdown && !menu.contains(e.target)) {
        dropdown.classList.remove('show');
        dropdown.removeAttribute('style');
    }
});

var lastScrollY = window.scrollY;
window.addEventListener('scroll', function() {
    if (window.innerWidth <= 768 && Math.abs(window.scrollY - lastScrollY) > 50) {
        var dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            dropdown.removeAttribute('style');
        }
        lastScrollY = window.scrollY;
    }
}, { passive: true });

window.addEventListener('resize', function() {
    var dropdown = document.getElementById('profileDropdown');
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdown.removeAttribute('style');
    }
});

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

function isPremium() {
    return true;
}