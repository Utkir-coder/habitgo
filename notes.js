// ============================================
// HABITGO — Eslatmalar (i18n bilan)
// ============================================

let currentNoteHabitId = null;
let currentNotes = [];

// ============================================
// YUKLASH
// ============================================
async function getHabitNotes(habitId) {
    if (!currentUser) return [];
    try {
        const data = await getNotes(currentUser.id, habitId);
        return data.map(n => ({
            id: n.id, text: n.text, mood: n.mood, date: n.created_at
        }));
    } catch (err) {
        console.error('[Notes] getHabitNotes xatosi:', err);
        return [];
    }
}

async function getNotesCount(habitId) {
    if (!currentUser) return 0;
    try {
        const { count, error } = await supabaseClient
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('habit_id', habitId);
        if (error) return 0;
        return count || 0;
    } catch (err) {
        return 0;
    }
}

// ============================================
// MODAL
// ============================================
async function openNotesModal(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    currentNoteHabitId = habitId;
    document.getElementById('notesHabitName').textContent = habit.name;
    document.getElementById('noteInput').value = '';

    currentNotes = await getHabitNotes(habitId);
    renderNotesList();

    document.getElementById('notesModal').style.display = 'flex';
    setTimeout(() => document.getElementById('noteInput').focus(), 100);
}

function closeNotesModal() {
    document.getElementById('notesModal').style.display = 'none';
    currentNoteHabitId = null;
    currentNotes = [];
}

// ============================================
// QO'SHISH
// ============================================
async function addNote() {
    if (!currentNoteHabitId || !currentUser) return;

    const input = document.getElementById('noteInput');
    const text = input.value.trim();
    const mood = document.getElementById('noteMood').value;

    if (!text) { alert('❌ ' + t('notes_enter_text')); return; }
    if (text.length > 500) { alert('❌ ' + t('notes_too_long')); return; }

    const btn = document.querySelector('#notesModal .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        const result = await insertNote({
            user_id: currentUser.id,
            habit_id: currentNoteHabitId,
            text: text, mood: mood
        });

        currentNotes.unshift({
            id: result.id, text: result.text, mood: result.mood, date: result.created_at
        });

        input.value = '';
        renderNotesList();
        renderHabits();

        if (typeof playSound === 'function') playSound('success');
    } catch (err) {
        console.error('[Notes] addNote xatosi:', err);
        alert('❌ ' + err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// ============================================
// O'CHIRISH
// ============================================
async function deleteNote(noteId) {
    if (!confirm(t('notes_delete_confirm'))) return;

    try {
        const success = await deleteNoteFromDB(noteId);
        if (success) {
            currentNotes = currentNotes.filter(n => n.id !== noteId);
            renderNotesList();
            renderHabits();
        }
    } catch (err) {
        console.error('[Notes] deleteNote xatosi:', err);
    }
}

// ============================================
// RENDER
// ============================================
function renderNotesList() {
    const container = document.getElementById('notesList');
    if (!container) return;

    if (currentNotes.length === 0) {
        container.innerHTML = `
            <div class="notes-empty">
                <div class="notes-empty-icon">📝</div>
                <p>${t('notes_empty')}</p>
                <small>${t('notes_empty_hint')}</small>
            </div>
        `;
        return;
    }

    container.innerHTML = currentNotes.map(note => {
        const date = new Date(note.date);
        const dateStr = formatNoteDate(date);
        const mood = getMoodEmoji(note.mood);

        return `
            <div class="note-item">
                <div class="note-header">
                    <div class="note-date">${mood} ${dateStr}</div>
                    <button class="note-delete" onclick="deleteNote(${note.id})" title="${t('deleted')}">🗑</button>
                </div>
                <div class="note-text">${escapeHtml(note.text)}</div>
            </div>
        `;
    }).join('');
}

function formatNoteDate(date) {
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return t('notes_now');
    if (mins < 60) return `${mins} ${t('notes_min_ago')}`;
    if (hours < 24) return `${hours} ${t('notes_hour_ago')}`;
    if (days < 7) return `${days} ${t('notes_day_ago')}`;

    const months = {
        uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
        ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
        en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
    const monthNames = months[currentLang] || months.uz;
    return `${date.getDate()}-${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
}

function getMoodEmoji(mood) {
    const moods = {
        great: '😄', good: '😊', neutral: '😐', bad: '😔', terrible: '😢'
    };
    return moods[mood] || '😐';
}

// ============================================
// CTRL+ENTER
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        const modal = document.getElementById('notesModal');
        if (modal && modal.style.display === 'flex' && currentNoteHabitId) {
            addNote();
        }
    }
});

document.addEventListener('click', (e) => {
    const modal = document.getElementById('notesModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        closeNotesModal();
    }
});