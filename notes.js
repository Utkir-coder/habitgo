// ============================================
// HABITGO — Eslatmalar (Supabase)
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
            id: n.id,
            text: n.text,
            mood: n.mood,
            date: n.created_at
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

    // Eslatmalarni yuklash
    currentNotes = await getHabitNotes(habitId);
    renderNotesList();

    document.getElementById('notesModal').style.display = 'flex';

    setTimeout(() => {
        document.getElementById('noteInput').focus();
    }, 100);
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

    if (!text) {
        alert('❌ Eslatma matnini kiriting!');
        return;
    }

    if (text.length > 500) {
        alert('❌ 500 belgidan oshmasligi kerak!');
        return;
    }

    const btn = document.querySelector('#notesModal .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;

    try {
        const result = await insertNote({
            user_id: currentUser.id,
            habit_id: currentNoteHabitId,
            text: text,
            mood: mood
        });

        currentNotes.unshift({
            id: result.id,
            text: result.text,
            mood: result.mood,
            date: result.created_at
        });

        input.value = '';
        renderNotesList();
        renderHabits(); // Habit kartochkasidagi badge yangilash

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
    if (!confirm('Bu eslatmani o\'chirmoqchimisiz?')) return;

    try {
        const success = await deleteNoteFromDB(noteId);
        if (success) {
            currentNotes = currentNotes.filter(n => n.id !== noteId);
            renderNotesList();
            renderHabits(); // Habit badge yangilash
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
                <p>Hali eslatma yo'q</p>
                <small>Birinchi eslatmangizni yozing!</small>
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
                    <button class="note-delete" onclick="deleteNote(${note.id})" title="O'chirish">🗑</button>
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

    if (mins < 1) return 'Hozir';
    if (mins < 60) return `${mins} daqiqa oldin`;
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    return `${date.getDate()}-${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function getMoodEmoji(mood) {
    const moods = {
        great: '😄',
        good: '😊',
        neutral: '😐',
        bad: '😔',
        terrible: '😢'
    };
    return moods[mood] || '😐';
}

// ============================================
// Ctrl+Enter — tez qo'shish
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        const modal = document.getElementById('notesModal');
        if (modal && modal.style.display === 'flex' && currentNoteHabitId) {
            addNote();
        }
    }
});

// Modal tashqarisiga bosilganda yopish
document.addEventListener('click', (e) => {
    const modal = document.getElementById('notesModal');
    if (modal && modal.style.display === 'flex' && e.target === modal) {
        closeNotesModal();
    }
});