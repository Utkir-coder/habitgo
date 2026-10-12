// ============================================
// HABITGO — Analytics (Google Analytics 4)
// ============================================

// ============================================
// ASOSIY TRACKING
// ============================================
function trackEvent(eventName, params) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params || {});
        console.log('[Analytics]', eventName, params);
    }
}

function trackPageView(pageName) {
    trackEvent('page_view', {
        page_title: pageName,
        page_location: window.location.href
    });
}

// ============================================
// FOYDALANUVCHI EVENT'LARI
// ============================================
function trackRegister(method) {
    trackEvent('sign_up', {
        method: method || 'email'
    });
}

function trackLogin(method) {
    trackEvent('login', {
        method: method || 'email'
    });
}

function trackLogout() {
    trackEvent('logout');
}

// ============================================
// ODAT EVENT'LARI
// ============================================
function trackHabitAdded(habitName, period) {
    trackEvent('habit_added', {
        habit_name: habitName,
        period: period
    });
}

function trackHabitCompleted(habitName, streak) {
    trackEvent('habit_completed', {
        habit_name: habitName,
        streak: streak
    });
}

function trackHabitDeleted(habitName) {
    trackEvent('habit_deleted', {
        habit_name: habitName
    });
}

// ============================================
// REJA EVENT'LARI
// ============================================
function trackTaskAdded(taskName, priority) {
    trackEvent('task_added', {
        task_name: taskName,
        priority: priority
    });
}

function trackTaskCompleted(taskName) {
    trackEvent('task_completed', {
        task_name: taskName
    });
}

// ============================================
// SAHIFA EVENT'LARI
// ============================================
function trackPageOpen(pageName) {
    trackEvent('page_open', {
        page_name: pageName
    });
}

function trackLanguageChange(lang) {
    trackEvent('language_changed', {
        language: lang
    });
}

// ============================================
// PWA EVENT'LARI
// ============================================
function trackPWAInstall() {
    trackEvent('pwa_installed');
}

function trackPWAShown() {
    trackEvent('pwa_banner_shown');
}