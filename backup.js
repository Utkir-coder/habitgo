// ============================================
// HABITGO — Export / Import (JSON backup)
// ============================================

// ============================================
// EXPORT — Ma'lumotlarni saqlash
// ============================================
function exportData() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        alert('❌ Avval tizimga kiring!');
        return;
    }

    // Hamma ma'lumotlarni yig'ish
    const backup = {
        version: '1.0.0',
        app: 'HabitGo',
        exportedAt: new Date().toISOString(),
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

    // JSON fayl yaratish
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Fayl nomi: habitgo_backup_2026-10-06.json
    const today = new Date().toISOString().split('T')[0];
    const fileName = `habitgo_backup_${today}.json`;

    // Yuklash
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Toast
    if (typeof playSound === 'function') playSound('success');
    showBackupToast(`📤 "${fileName}" yuklab olindi!`);
}

// Hamma eslatmalarni yig'ish
function collectAllNotes() {
    if (typeof currentUser === 'undefined' || !currentUser) return {};

    const notes = {};
    habits.forEach(habit => {
        const key = `habitgo_notes_${currentUser.id}_${habit.id}`;
        const habitNotes = JSON.parse(localStorage.getItem(key)) || [];
        if (habitNotes.length > 0) {
            notes[habit.id] = habitNotes;
        }
    });
    return notes;
}

// ============================================
// IMPORT — Ma'lumotlarni yuklash
// ============================================
function importData() {
    if (typeof currentUser === 'undefined' || !currentUser) {
        alert('❌ Avval tizimga kiring!');
        return;
    }

    // Fayl tanlash
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
                alert('❌ Fayl noto\'g\'ri!\n\nXato: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// Backup'ni tekshirish va tiklash
function validateAndRestore(backup) {
    // 1. Format tekshirish
    if (!backup || typeof backup !== 'object') {
        alert('❌ Fayl formati noto\'g\'ri!');
        return;
    }

    if (backup.app !== 'HabitGo') {
        alert('❌ Bu HabitGo backup fayli emas!');
        return;
    }

    if (!backup.habits || !Array.isArray(backup.habits)) {
        alert('❌ Faylda odatlar topilmadi!');
        return;
    }

    // 2. Tasdiq so'rash
    const habitCount = backup.habits.length;
    const exportedDate = backup.exportedAt
        ? new Date(backup.exportedAt).toLocaleString('uz-UZ')
        : 'noma\'lum';

    const confirmMsg = `📥 Backup yuklash\n\n` +
        `📅 Sana: ${exportedDate}\n` +
        `👤 Foydalanuvchi: ${backup.user?.name || 'noma\'lum'}\n` +
        `📋 Odatlar soni: ${habitCount}\n\n` +
        `⚠️ Diqqat!\n` +
        `Hozirgi barcha ma'lumotlaringiz o'chiriladi va backup bilan almashtiriladi.\n\n` +
        `Davom etasizmi?`;

    if (!confirm(confirmMsg)) return;

    // 3. Tiklash
    try {
        // Odatlar
        habits = backup.habits;
        saveHabits();

        // XP
        if (backup.xp) {
            localStorage.setItem(`habitgo_xp_${currentUser.id}`, JSON.stringify(backup.xp));
        }

        // Badges
        if (backup.badges && Array.isArray(backup.badges)) {
            localStorage.setItem(`habitgo_badges_${currentUser.id}`, JSON.stringify(backup.badges));
        }

        // Eslatmalar
        if (backup.notes && typeof backup.notes === 'object') {
            // Avvalgi eslatmalarni o'chirish
            habits.forEach(habit => {
                localStorage.removeItem(`habitgo_notes_${currentUser.id}_${habit.id}`);
            });

            // Yangi eslatmalarni saqlash
            Object.keys(backup.notes).forEach(habitId => {
                const key = `habitgo_notes_${currentUser.id}_${habitId}`;
                localStorage.setItem(key, JSON.stringify(backup.notes[habitId]));
            });
        }

        // Rang va tema
        if (backup.color) {
            localStorage.setItem('habitgo_color', backup.color);
            if (typeof applyColor === 'function') applyColor(backup.color);
        }
        if (backup.theme) {
            localStorage.setItem('habitgo_theme', backup.theme);
            if (typeof applyTheme === 'function') applyTheme(backup.theme);
        }

        // UI yangilash
        if (typeof renderHabits === 'function') renderHabits();
        if (typeof updateStats === 'function') updateStats();
        if (typeof renderBadgesPreview === 'function') renderBadgesPreview();
        if (typeof renderChallenge === 'function') renderChallenge();
        if (typeof checkPremiumLimit === 'function') checkPremiumLimit();

        // Effektlar
        if (typeof playSound === 'function') playSound('success');
        if (typeof triggerConfetti === 'function') triggerConfetti();

        showBackupToast(`📥 ${habitCount} ta odat tiklandi!`);

    } catch (err) {
        alert('❌ Tiklashda xato:\n\n' + err.message);
        console.error(err);
    }
}

// ============================================
// TOAST XABAR
// ============================================
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

// ============================================
// STATISTIKA — Backup haqida
// ============================================
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
// ============================================
// BACKUP SAHIFASINI KO'RSATISH
// ============================================
function showBackup() {
    document.getElementById('backupPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    // Backup ma'lumotlarini ko'rsatish
    const info = getBackupInfo();
    const container = document.getElementById('backupInfo');
    if (container) {
        container.innerHTML = `
            <div class="backup-stat">
                <div class="backup-stat-icon">📋</div>
                <div class="backup-stat-value">${info.habitsCount}</div>
                <div class="backup-stat-label">Odatlar</div>
            </div>
            <div class="backup-stat">
                <div class="backup-stat-icon">✅</div>
                <div class="backup-stat-value">${info.totalCompleted}</div>
                <div class="backup-stat-label">Bajarilgan</div>
            </div>
            <div class="backup-stat">
                <div class="backup-stat-icon">💾</div>
                <div class="backup-stat-value">${info.size} KB</div>
                <div class="backup-stat-label">Hajmi</div>
            </div>
        `;
    }
}