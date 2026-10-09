// ============================================
// HABITGO — Dark mode (i18n bilan)
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem('habitgo_theme') || 'light';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const current = document.body.classList.contains('dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('habitgo_theme', next);
}

function applyTheme(theme) {
    const btn = document.getElementById('themeBtn');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        if (btn) {
            btn.textContent = '☀️';
            btn.title = t('theme_light');
        }
    } else {
        document.body.classList.remove('dark');
        if (btn) {
            btn.textContent = '🌙';
            btn.title = t('theme_dark');
        }
    }
}

document.addEventListener('DOMContentLoaded', initTheme);