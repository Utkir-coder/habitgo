// ============================================
// HABITGO — Rang mavzulari (i18n bilan)
// ============================================

function getColorThemes() {
    return {
        purple: {
            nameKey: 'color_purple',
            icon: '🟣',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            primary: '#667eea',
            secondary: '#764ba2',
            primaryLight: '#eef1ff',
            primaryRgb: '102, 126, 234'
        },
        blue: {
            nameKey: 'color_blue',
            icon: '🔵',
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            primary: '#3b82f6',
            secondary: '#1e40af',
            primaryLight: '#eff6ff',
            primaryRgb: '59, 130, 246'
        },
        green: {
            nameKey: 'color_green',
            icon: '🟢',
            gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            primary: '#10b981',
            secondary: '#047857',
            primaryLight: '#ecfdf5',
            primaryRgb: '16, 185, 129'
        },
        orange: {
            nameKey: 'color_orange',
            icon: '🟠',
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            primary: '#f59e0b',
            secondary: '#d97706',
            primaryLight: '#fffbeb',
            primaryRgb: '245, 158, 11'
        },
        pink: {
            nameKey: 'color_pink',
            icon: '🌸',
            gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            primary: '#ec4899',
            secondary: '#be185d',
            primaryLight: '#fdf2f8',
            primaryRgb: '236, 72, 153'
        },
        red: {
            nameKey: 'color_red',
            icon: '🔴',
            gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
            primary: '#ef4444',
            secondary: '#991b1b',
            primaryLight: '#fef2f2',
            primaryRgb: '239, 68, 68'
        }
    };
}

function getCurrentColor() {
    return localStorage.getItem('habitgo_color') || 'purple';
}

function applyColor(themeKey) {
    const COLOR_THEMES = getColorThemes();
    const theme = COLOR_THEMES[themeKey];
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--primary-rgb', theme.primaryRgb);
    root.style.setProperty('--gradient', theme.gradient);

    updateDynamicColors(themeKey);
    localStorage.setItem('habitgo_color', themeKey);
}

function updateDynamicColors(themeKey) {
    const COLOR_THEMES = getColorThemes();
    const theme = COLOR_THEMES[themeKey];
    if (!theme) return;

    document.body.style.background = theme.gradient;

    document.querySelectorAll('.landing-page, .hero, .landing-nav').forEach(el => {
        if (el) el.style.background = 'transparent';
    });

    document.querySelectorAll('.btn-hero, .btn-add, .challenge-btn, .challenge-popup-inner button').forEach(btn => {
        if (btn) btn.style.background = theme.gradient;
    });

    document.querySelectorAll('.stat-number, .summary-value, .completed-percent').forEach(el => {
        if (el) el.style.color = theme.primary;
    });

    document.querySelectorAll('.habit-progress-fill').forEach(el => {
        if (el) el.style.background = `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`;
    });

    document.querySelectorAll('.level-fill').forEach(el => {
        if (el) el.style.background = theme.gradient;
    });

    document.querySelectorAll('.level-badge').forEach(el => {
        if (el) el.style.background = theme.gradient;
    });

    document.querySelectorAll('.habit-item').forEach(el => {
        if (el && !el.classList.contains('completed')) {
            el.style.borderLeftColor = theme.primary;
        }
    });

    document.querySelectorAll('.habit-badge').forEach(el => {
        if (el) el.style.background = theme.primary;
    });

    document.querySelectorAll('.breakdown-fill').forEach(el => {
        if (el) el.style.background = `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`;
    });

    document.querySelectorAll('.note-item').forEach(el => {
        if (el) el.style.borderLeftColor = theme.primary;
    });

    document.querySelectorAll('.btn-notes').forEach(btn => {
        if (btn) {
            btn.style.borderColor = theme.primary;
            btn.style.color = theme.primary;
        }
    });
}

function showColorPicker() {
    const modal = document.getElementById('colorPickerModal');
    if (!modal) return;
    modal.style.display = 'flex';
    renderColorOptions();
}

function closeColorPicker() {
    document.getElementById('colorPickerModal').style.display = 'none';
}

function renderColorOptions() {
    const container = document.getElementById('colorOptions');
    if (!container) return;

    const COLOR_THEMES = getColorThemes();
    const current = getCurrentColor();

    container.innerHTML = Object.keys(COLOR_THEMES).map(key => {
        const theme = COLOR_THEMES[key];
        const isActive = key === current;

        return `
            <div class="color-option ${isActive ? 'active' : ''}" onclick="selectColor('${key}')">
                <div class="color-preview" style="background: ${theme.gradient}"></div>
                <div class="color-name">${theme.icon} ${t(theme.nameKey)}</div>
                ${isActive ? '<div class="color-check">✓</div>' : ''}
            </div>
        `;
    }).join('');
}

function selectColor(themeKey) {
    applyColor(themeKey);

    if (typeof renderHabits === 'function') renderHabits();
    if (typeof renderChallenge === 'function') renderChallenge();
    if (typeof renderBadgesPreview === 'function') renderBadgesPreview();

    if (typeof renderCharts === 'function') {
        setTimeout(renderCharts, 100);
    }

    closeColorPicker();
    if (typeof playSound === 'function') playSound('success');

    const COLOR_THEMES = getColorThemes();
    const theme = COLOR_THEMES[themeKey];
    showColorToast(`${theme.icon} ${t(theme.nameKey)} ${t('color_changed')}`);
}

function showColorToast(text) {
    const toast = document.createElement('div');
    toast.className = 'color-toast';
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const current = getCurrentColor();
        if (current !== 'purple') applyColor(current);
    }, 100);
});