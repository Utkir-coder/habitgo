// ============================================
// HABITGO — Backup (i18n to'liq)
// ============================================

function exportData() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        alert('❌ ' + t('alert_signin_required'));
        return;
    }

    const backup = {
        version: '1.0.0',
        app: 'HabitGo',
        exportedAt: new Date().toISOString(),
        lang: currentLang,
        user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            plan: currentUser.plan,
            planExpiresAt: currentUser.planExpiresAt,
            joinedAt: currentUser.joinedAt
        },
        habits: habits,
        xp: JSON.parse(localStorage.getItem(`habitgo_xp_${currentUser.id}`)) || { totalXP: 0, level: 1 },
        badges: JSON.parse(localStorage.getItem(`habitgo_badges_${currentUser.id}`)) || [],
        color: localStorage.getItem('habitgo_color') || 'purple',
        theme: localStorage.getItem('habitgo_theme') || 'light',
        notes: collectAllNotes()
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    const fileName = `habitgo_backup_${today}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof playSound === 'function') playSound('success');
    showBackupToast(`📤 "${fileName}" ${t('backup_loaded')}`);
}

function collectAllNotes() {
    if (typeof currentUser === 'undefined' || !currentUser) return {};
    const notes = {};
    habits.forEach(habit => {
        const key = `habitgo_notes_${currentUser.id}_${habit.id}`;
        const habitNotes = JSON.parse(localStorage.getItem(key)) || [];
        if (habitNotes.length > 0) notes[habit.id] = habitNotes;
    });
    return notes;
}

function importData() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        alert('❌ ' + t('alert_signin_required'));
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                validateAndRestore(backup);
            } catch (err) {
                alert('❌ ' + t('error') + ': ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function validateAndRestore(backup) {
    if (!backup || typeof backup !== 'object') {
        alert('❌ ' + t('error'));
        return;
    }

    if (backup.app !== 'HabitGo') {
        alert('❌ ' + t('error'));
        return;
    }

    if (!backup.habits || !Array.isArray(backup.habits)) {
        alert('❌ ' + t('error'));
        return;
    }

    const habitCount = backup.habits.length;
    const exportedDate = backup.exportedAt
        ? new Date(backup.exportedAt).toLocaleString('uz-UZ')
        : '-';

    const confirmMsg = `📥 ${t('backup_import')}\n\n` +
        `📅 ${exportedDate}\n` +
        `📋 ${t('backup_habits')}: ${habitCount}\n\n` +
        `⚠️ ${t('backup_warning')}\n\n` +
        `${t('payment_confirm')}`;

    if (!confirm(confirmMsg)) return;

    try {
        habits = backup.habits;
        saveHabits();

        if (backup.xp) localStorage.setItem(`habitgo_xp_${currentUser.id}`, JSON.stringify(backup.xp));
        if (backup.badges && Array.isArray(backup.badges)) {
            localStorage.setItem(`habitgo_badges_${currentUser.id}`, JSON.stringify(backup.badges));
        }

        if (backup.notes && typeof backup.notes === 'object') {
            habits.forEach(habit => {
                localStorage.removeItem(`habitgo_notes_${currentUser.id}_${habit.id}`);
            });
            Object.keys(backup.notes).forEach(habitId => {
                localStorage.setItem(`habitgo_notes_${currentUser.id}_${habitId}`, JSON.stringify(backup.notes[habitId]));
            });
        }

        if (backup.color) {
            localStorage.setItem('habitgo_color', backup.color);
            if (typeof applyColor === 'function') applyColor(backup.color);
        }
        if (backup.theme) {
            localStorage.setItem('habitgo_theme', backup.theme);
            if (typeof applyTheme === 'function') applyTheme(backup.theme);
        }

        if (typeof renderHabits === 'function') renderHabits();
        if (typeof updateStats === 'function') updateStats();
        if (typeof renderBadgesPreview === 'function') renderBadgesPreview();
        if (typeof renderChallenge === 'function') renderChallenge();
        if (typeof checkPremiumLimit === 'function') checkPremiumLimit();

        if (typeof playSound === 'function') playSound('success');
        if (typeof triggerConfetti === 'function') triggerConfetti();

        showBackupToast(`📥 ${habitCount} ${t('backup_restored')}`);
    } catch (err) {
        alert('❌ ' + t('error') + ': ' + err.message);
        console.error(err);
    }
}

function showBackupToast(text) {
    const toast = document.createElement('div');
    toast.className = 'backup-toast';
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getBackupInfo() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        return { habitsCount: 0, totalCompleted: 0, size: 0 };
    }

    const data = {
        habits: habits,
        xp: JSON.parse(localStorage.getItem(`habitgo_xp_${currentUser.id}`)) || {},
        badges: JSON.parse(localStorage.getItem(`habitgo_badges_${currentUser.id}`)) || []
    };

    const jsonStr = JSON.stringify(data);
    const sizeKB = Math.round(new Blob([jsonStr]).size / 1024 * 10) / 10;

    return {
        habitsCount: habits.length,
        totalCompleted: habits.reduce((sum, h) => sum + h.completedDays.length, 0),
        size: sizeKB
    };
}

async function showBackup() {
    document.getElementById('backupPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    // Sahifa sarlavhalari tarjimasi
    const pageTitle = document.querySelector('#backupPage h2');
    if (pageTitle) pageTitle.textContent = t('backup_title');

    const intro = document.querySelector('#backupPage .backup-intro');
    if (intro) intro.textContent = t('backup_desc');

    const cardTitle = document.querySelector('#backupPage .backup-info-card h3');
    if (cardTitle) cardTitle.textContent = t('backup_current');

    // Action tugmalari
    const exportTitle = document.querySelector('#backupPage .backup-action:nth-of-type(1) .backup-action-text strong');
    if (exportTitle) exportTitle.textContent = t('backup_export');
    const exportDesc = document.querySelector('#backupPage .backup-action:nth-of-type(1) .backup-action-text span');
    if (exportDesc) exportDesc.textContent = t('backup_export_desc');
    const exportBtn = document.querySelector('#backupPage .backup-btn.export');
    if (exportBtn) exportBtn.textContent = t('backup_upload');

    const importTitle = document.querySelector('#backupPage .backup-action:nth-of-type(2) .backup-action-text strong');
    if (importTitle) importTitle.textContent = t('backup_import');
    const importDesc = document.querySelector('#backupPage .backup-action:nth-of-type(2) .backup-action-text span');
    if (importDesc) importDesc.textContent = t('backup_import_desc');
    const importBtn = document.querySelector('#backupPage .backup-btn.import');
    if (importBtn) importBtn.textContent = t('backup_upload');

    const warning = document.querySelector('#backupPage .backup-warning');
    if (warning) warning.textContent = '⚠️ ' + t('backup_warning');

    // Ma'lumotlarni ko'rsatish
    const info = getBackupInfo();
    const container = document.getElementById('backupInfo');
    if (container) {
        container.innerHTML = `
            <div class="backup-stat">
                <div class="backup-stat-icon">📋</div>
                <div class="backup-stat-value">${info.habitsCount}</div>
                <div class="backup-stat-label">${t('backup_habits')}</div>
            </div>
            <div class="backup-stat">
                <div class="backup-stat-icon">✅</div>
                <div class="backup-stat-value">${info.totalCompleted}</div>
                <div class="backup-stat-label">${t('backup_done')}</div>
            </div>
            <div class="backup-stat">
                <div class="backup-stat-icon">💾</div>
                <div class="backup-stat-value">${info.size} KB</div>
                <div class="backup-stat-label">${t('backup_size')}</div>
            </div>
        `;
    }
}