// ============================================
// HABITGO — PWA (Safari + iOS fix)
// ============================================

var deferredPrompt = null;
var installButtonShown = false;

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

function isAndroidDevice() {
    return /Android/i.test(navigator.userAgent);
}

function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.indexOf('android-app://') !== -1;
}

// ============================================
// SERVICE WORKER RO'YXATDAN O'TKAZISH
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(registration) {
                console.log('[PWA] Service Worker ro\'yxatdan o\'tdi:', registration.scope);

                // Safari uchun yangilanishni kuzatish
                registration.addEventListener('updatefound', function() {
                    console.log('[PWA] Yangi SW topildi');
                });
            })
            .catch(function(err) {
                console.log('[PWA] SW xatosi:', err);
            });
    });
}

// ============================================
// INSTALL TAKLIFINI USHLASH (Chrome / Android)
// ============================================
window.addEventListener('beforeinstallprompt', function(event) {
    console.log('[PWA] Install taklif keldi');

    event.preventDefault();
    deferredPrompt = event;

    // Android va Chrome uchun install tugmasi
    if (!isPWA()) {
        showInstallButton();
    }
});

// ============================================
// INSTALL TUGMASI
// ============================================
function showInstallButton() {
    if (installButtonShown) return;

    var container = document.getElementById('installBanner');
    if (!container) return;

    container.style.display = 'flex';
    installButtonShown = true;
}

function hideInstallButton() {
    var container = document.getElementById('installBanner');
    if (container) {
        container.style.display = 'none';
    }
}

// ============================================
// INSTALL QILISH
// ============================================
async function installPWA() {
    if (isIOSDevice()) {
        // iOS uchun qo'llanma
        showIOSInstallHint();
        return;
    }

    if (!deferredPrompt) {
        alert('❗ Ilovani o\'rnatib bo\'lmaydi.\n\nBrauzer menyusidan "Add to Home Screen" ni tanlang.');
        return;
    }

    deferredPrompt.prompt();

    var choiceResult = await deferredPrompt.userChoice;
    console.log('[PWA] Foydalanuvchi tanlovi:', choiceResult.outcome);

    if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] O\'rnatildi!');
        showPWAToast('🎉 Ilova o\'rnatildi!');
    } else {
        console.log('[PWA] Bekor qilindi');
    }

    deferredPrompt = null;
    hideInstallButton();
}

// ============================================
// O'RNATILGANDAN KEYIN
// ============================================
window.addEventListener('appinstalled', function() {
    console.log('[PWA] O\'rnatildi!');
    hideInstallButton();
    showPWAToast('🎉 HabitGo telefoningizga o\'rnatildi!');
    deferredPrompt = null;
});

// ============================================
// iOS UCHUN QO'LLANMA
// ============================================
function showIOSInstallHint() {
    if (localStorage.getItem('habitgo_ios_hint_shown') === 'true') {
        alert('📱 Safari\'da pastdagi Share (⬆️) tugmasini bosing, keyin "Add to Home Screen" ni tanlang.');
        return;
    }

    var hint = document.createElement('div');
    hint.className = 'ios-install-hint';
    hint.innerHTML =
        '<div class="ios-hint-content">' +
            '<div class="ios-hint-icon">📱</div>' +
            '<h3>' + t('pwa_install') + '</h3>' +
            '<p>' + t('pwa_ios_hint') + '</p>' +
            '<button onclick="this.parentElement.parentElement.remove(); localStorage.setItem(\'habitgo_ios_hint_shown\', \'true\');">' + t('pwa_got_it') + '</button>' +
        '</div>';
    document.body.appendChild(hint);

    setTimeout(function() { hint.classList.add('show'); }, 10);
}

// ============================================
// ONLINE / OFFLINE
// ============================================
window.addEventListener('online', function() {
    console.log('[PWA] Online');
    showPWAToast('🌐 ' + t('pwa_online'));
});

window.addEventListener('offline', function() {
    console.log('[PWA] Offline');
    showPWAToast('📴 ' + t('pwa_offline'));
});

// ============================================
// TOAST XABAR
// ============================================
function showPWAToast(text) {
    var toast = document.createElement('div');
    toast.className = 'pwa-toast';
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(function() { toast.classList.add('show'); }, 10);
    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

// ============================================
// SAHIFA YUKLANGANDA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // PWA rejimida bo'lsa — install banner ko'rsatmaslik
    if (isPWA()) {
        console.log('[PWA] Allaqachon PWA rejimida');
        return;
    }

    // iOS uchun maxsus ko'rsatma (5 sekunddan keyin)
    if (isIOSDevice() && !isPWA()) {
        setTimeout(function() {
            // Faqat bir marta ko'rsatish
            if (localStorage.getItem('habitgo_ios_hint_shown') !== 'true') {
                showInstallButton();
            }
        }, 5000);
    }
});