// ============================================
// HABITGO — Rang mavzulari
// ============================================

const COLOR_THEMES = {
    purple: {
        name: 'Binafsha',
        icon: '🟣',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        primary: '#667eea',
        secondary: '#764ba2',
        primaryLight: '#eef1ff',
        primaryRgb: '102, 126, 234'
    },
    blue: {
        name: 'Ko\'k',
        icon: '🔵',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        primary: '#3b82f6',
        secondary: '#1e40af',
        primaryLight: '#eff6ff',
        primaryRgb: '59, 130, 246'
    },
    green: {
        name: 'Yashil',
        icon: '🟢',
        gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        primary: '#10b981',
        secondary: '#047857',
        primaryLight: '#ecfdf5',
        primaryRgb: '16, 185, 129'
    },
    orange: {
        name: 'To\'q sariq',
        icon: '🟠',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        primary: '#f59e0b',
        secondary: '#d97706',
        primaryLight: '#fffbeb',
        primaryRgb: '245, 158, 11'
    },
    pink: {
        name: 'Pushti',
        icon: '🌸',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        primary: '#ec4899',
        secondary: '#be185d',
        primaryLight: '#fdf2f8',
        primaryRgb: '236, 72, 153'
    },
    red: {
        name: 'Qizil',
        icon: '🔴',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
        primary: '#ef4444',
        secondary: '#991b1b',
        primaryLight: '#fef2f2',
        primaryRgb: '239, 68, 68'
    }
};

// Joriy rangni olish
function getCurrentColor() {
    return localStorage.getItem('habitgo_color') || 'purple';
}

// Rangni qo'llash
function applyColor(themeKey) {
    const theme = COLOR_THEMES[themeKey];
    if (!theme) return;

    // CSS o'zgaruvchilarni o'rnatish
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--primary-rgb', theme.primaryRgb);
    root.style.setProperty('--gradient', theme.gradient);

    // Sahifadagi dinamik joylarni yangilash
    updateDynamicColors(themeKey);

    // Saqlash
    localStorage.setItem('habitgo_color', themeKey);
}

// Dinamik ranglarni yangilash (JS orqali)
function updateDynamicColors(themeKey) {
    const theme = COLOR_THEMES[themeKey];
    if (!theme) return;

    // Body'ning orqa fonini yangilash (landing page va app)
    document.body.style.background = theme.gradient;

    // Barcha gradient elementlarini yangilash
    document.querySelectorAll('.landing-page, .hero, .landing-nav').forEach(el => {
        if (el) el.style.background = 'transparent';
    });

    // Tugmalarni yangilash
    document.querySelectorAll('.btn-hero, .btn-add, .challenge-btn, .challenge-popup-inner button').forEach(btn => {
        if (btn) btn.style.background = theme.gradient;
    });

    // Header logo va profil menyusini yangilash
    // (bular allaqachon gradient, o'zgaradi avtomatik)

    // Statistik raqamlarni yangilash
    document.querySelectorAll('.stat-number, .summary-value, .completed-percent').forEach(el => {
        if (el) el.style.color = theme.primary;
    });

    // Progress bar fill'larni yangilash
    document.querySelectorAll('.habit-progress-fill').forEach(el => {
        if (el) el.style.background = `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`;
    });

    // Level bar fill
    document.querySelectorAll('.level-fill').forEach(el => {
        if (el) el.style.background = theme.gradient;
    });

    // Level badge
    document.querySelectorAll('.level-badge').forEach(el => {
        if (el) el.style.background = theme.gradient;
    });

    // Habit item chap tomoni
    document.querySelectorAll('.habit-item').forEach(el => {
        if (el && !el.classList.contains('completed')) {
            el.style.borderLeftColor = theme.primary;
        }
    });

    // Habit badge
    document.querySelectorAll('.habit-badge').forEach(el => {
        if (el) el.style.background = theme.primary;
    });

    // Breakdown fill
    document.querySelectorAll('.breakdown-fill').forEach(el => {
        if (el) el.style.background = `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`;
    });

    // Note item chap tomoni
    document.querySelectorAll('.note-item').forEach(el => {
        if (el) el.style.borderLeftColor = theme.primary;
    });

    // Notes tugma
    document.querySelectorAll('.btn-notes').forEach(btn => {
        if (btn) {
            btn.style.borderColor = theme.primary;
            btn.style.color = theme.primary;
        }
    });

    // HTML body fonini yangilash
    const styleTag = document.getElementById('dynamic-theme-style');
    if (styleTag) styleTag.remove();
}

// Rangni tanlash modali
function showColorPicker() {
    const modal = document.getElementById('colorPickerModal');
    if (!modal) return;

    modal.style.display = 'flex';
    renderColorOptions();
}

function closeColorPicker() {
    document.getElementById('colorPickerModal').style.display = 'none';
}

// Rang variantlarini ko'rsatish
function renderColorOptions() {
    const container = document.getElementById('colorOptions');
    if (!container) return;

    const current = getCurrentColor();

    container.innerHTML = Object.keys(COLOR_THEMES).map(key => {
        const theme = COLOR_THEMES[key];
        const isActive = key === current;

        return `
            <div class="color-option ${isActive ? 'active' : ''}" onclick="selectColor('${key}')">
                <div class="color-preview" style="background: ${theme.gradient}"></div>
                <div class="color-name">${theme.icon} ${theme.name}</div>
                ${isActive ? '<div class="color-check">✓</div>' : ''}
            </div>
        `;
    }).join('');
}

// Rangni tanlash
function selectColor(themeKey) {
    applyColor(themeKey);

    // Barcha dinamik elementlarni qayta render qilish
    if (typeof renderHabits === 'function') renderHabits();
    if (typeof renderChallenge === 'function') renderChallenge();
    if (typeof renderBadgesPreview === 'function') renderBadgesPreview();

    // Chart'larni qayta chizish (yangi rang bilan)
    if (typeof renderCharts === 'function') {
        setTimeout(renderCharts, 100);
    }

    // Modal yopish
    closeColorPicker();

    // Ovoz
    if (typeof playSound === 'function') playSound('success');

    // Popup
    const theme = COLOR_THEMES[themeKey];
    showColorToast(`${theme.icon} ${theme.name} mavzusi yoqildi!`);
}

// Toast (kichik xabar)
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

// Sahifa yuklanganda rangni qo'llash
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const current = getCurrentColor();
        if (current !== 'purple') {
            applyColor(current);
        }
    }, 100);
});

// Rang o'zgarganda render qilinadigan elementlarni kuzatish
// (renderHabits chaqirilganda ham rang saqlanib qolishi uchun)
const originalRenderHabits = window.renderHabits;
if (typeof originalRenderHabits === 'function') {
    window.renderHabits = function() {
        originalRenderHabits.apply(this, arguments);
        const current = getCurrentColor();
        if (current !== 'purple') {
            setTimeout(() => {
                const theme = COLOR_THEMES[current];
                document.querySelectorAll('.habit-item').forEach(el => {
                    if (el && !el.classList.contains('completed')) {
                        el.style.borderLeftColor = theme.primary;
                    }
                });
                document.querySelectorAll('.habit-badge').forEach(el => {
                    if (el) el.style.background = theme.primary;
                });
                document.querySelectorAll('.stat-number').forEach(el => {
                    if (el) el.style.color = theme.primary;
                });
            }, 10);
        }
    };
}