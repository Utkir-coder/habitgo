// ============================================
// HABITGO — PWA Install tugmasi
// ============================================

let deferredPrompt = null;
let installButtonShown = false;

// Service Worker'ni ro'yxatdan o'tkazish
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('[PWA] Service Worker ro\'yxatdan o\'tdi:', registration.scope);
            })
            .catch((err) => {
                console.log('[PWA] SW xatosi:', err);
            });
    });
}

// Install taklifini ushlash
window.addEventListener('beforeinstallprompt', (event) => {
    console.log('[PWA] Install taklif keldi');

    // Standart taklifni to'xtatish
    event.preventDefault();

    // Keyinroq ishlatish uchun saqlash
    deferredPrompt = event;

    // Install tugmasini ko'rsatish
    showInstallButton();
});

// Install tugmasini ko'rsatish
function showInstallButton() {
    if (installButtonShown) return;

    const container = document.getElementById('installBanner');
    if (!container) return;

    container.style.display = 'flex';
    installButtonShown = true;
}

// Install tugmasini yashirish
function hideInstallButton() {
    const container = document.getElementById('installBanner');
    if (container) {
        container.style.display = 'none';
    }
}

// Install tugmasi bosilganda
async function installPWA() {
    if (!deferredPrompt) {
        alert('❗ Ilovani o\'rnatib bo\'lmaydi.\n\nBrauzer menyusidan "Add to Home Screen" ni tanlang.');
        return;
    }

    // Install taklifini ko'rsatish
    deferredPrompt.prompt();

    // Foydalanuvchi javobini kutish
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Foydalanuvchi tanlovi:', outcome);

    if (outcome === 'accepted') {
        console.log('[PWA] O\'rnatildi!');
        showPWAToast('🎉 Ilova o\'rnatildi!');
    } else {
        console.log('[PWA] Bekor qilindi');
    }

    // Tugmani yashirish
    deferredPrompt = null;
    hideInstallButton();
}

// O'rnatilgandan keyin
window.addEventListener('appinstalled', () => {
    console.log('[PWA] O\'rnatildi!');
    hideInstallButton();
    showPWAToast('🎉 HabitGo telefoningizga o\'rnatildi!');
    deferredPrompt = null;
});

// PWA rejimida ishlayaptimi?
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
}

// Online/Offline holatini kuzatish
window.addEventListener('online', () => {
    console.log('[PWA] Online');
    showPWAToast('🌐 Internet qaytdi');
});

window.addEventListener('offline', () => {
    console.log('[PWA] Offline');
    showPWAToast('📴 Offline rejim — hammasi ishlaydi');
});

// Toast xabar
function showPWAToast(text) {
    const toast = document.createElement('div');
    toast.className = 'pwa-toast';
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    // PWA rejimida bo'lsa — install banner ko'rsatmaslik
    if (isPWA()) {
        console.log('[PWA] Allaqachon PWA rejimida');
        return;
    }

    // iOS uchun maxsus ko'rsatma
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !isPWA()) {
        setTimeout(() => {
            showIOSInstallHint();
        }, 5000);
    }
});

// iOS uchun install ko'rsatmasi
function showIOSInstallHint() {
    // Faqat bir marta ko'rsatish
    if (localStorage.getItem('habitgo_ios_hint_shown')) return;

    const hint = document.createElement('div');
    hint.className = 'ios-install-hint';
    hint.innerHTML = `
        <div class="ios-hint-content">
            <div class="ios-hint-icon">📱</div>
            <h3>HabitGo'ni o'rnatish</h3>
            <p>Safari'da pastdagi <strong>Share</strong> (⬆️) tugmasini bosing, keyin <strong>"Add to Home Screen"</strong> ni tanlang.</p>
            <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('habitgo_ios_hint_shown', 'true');">Tushundim</button>
        </div>
    `;
    document.body.appendChild(hint);

    setTimeout(() => hint.classList.add('show'), 10);
}