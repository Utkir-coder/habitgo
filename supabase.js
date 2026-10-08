// ============================================
// HABITGO — Supabase Client
// ============================================

const SUPABASE_URL = 'https://zispqithqfobiveofltm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppc3BxaXRocWZvYml2ZW9mbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNTM5OTUsImV4cCI6MjEwNjkyOTk5NX0.v0EnDWu2PVaTaK0pr64XwHEJ3hPnlTQCPTMfmXprLzA';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('[Supabase] Client tayyor');

// ============================================
// SESSIYA
// ============================================
async function getSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) return null;
        return data.session;
    } catch (err) {
        return null;
    }
}

// ============================================
// PROFIL
// ============================================
async function getUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
}

async function getUserStats(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) return null;
        return data;
    } catch (err) {
        return null;
    }
}

async function ensureUserProfile(userId, name, email) {
    let profile = await getUserProfile(userId);

    if (!profile) {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .insert([{ user_id: userId, name: name, email: email }])
            .select()
            .single();
        if (!error) profile = data;
    }

    let stats = await getUserStats(userId);

    if (!stats) {
        const { data, error } = await supabaseClient
            .from('user_stats')
            .insert([{ user_id: userId, total_xp: 0, level: 1, plan: 'free' }])
            .select()
            .single();
        if (!error) stats = data;
    }

    return { profile, stats };
}

// ============================================
// HABITS
// ============================================
async function getHabits(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    } catch (err) {
        return [];
    }
}

async function insertHabit(habit) {
    const habitData = {
        user_id: habit.user_id,
        name: habit.name,
        period: habit.period,
        days: (habit.days || []).map(String),
        time: habit.time,
        place: habit.place,
        start_date: habit.start_date,
        end_date: habit.end_date,
        completed_days: (habit.completed_days || []).map(String),
        streak: habit.streak || 0,
        last_check: habit.last_check || null
    };

    const { data, error } = await supabaseClient
        .from('habits')
        .insert([habitData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function updateHabit(habitId, updates) {
    if (updates.days) updates.days = updates.days.map(String);
    if (updates.completed_days) updates.completed_days = updates.completed_days.map(String);

    const { data, error } = await supabaseClient
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function deleteHabitFromDB(habitId) {
    const { error } = await supabaseClient
        .from('habits')
        .delete()
        .eq('id', habitId);
    return !error;
}

// ============================================
// TASKS
// ============================================
async function getTasks(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    } catch (err) {
        return [];
    }
}

async function insertTask(task) {
    const { data, error } = await supabaseClient
        .from('tasks')
        .insert([task])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function updateTask(taskId, updates) {
    const { data, error } = await supabaseClient
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function deleteTaskFromDB(taskId) {
    const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', taskId);
    return !error;
}

// ============================================
// BADGES
// ============================================
async function getBadges(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('badges')
            .select('*')
            .eq('user_id', userId);
        if (error) return [];
        return data || [];
    } catch (err) {
        return [];
    }
}

async function insertBadge(userId, badgeId) {
    const { data, error } = await supabaseClient
        .from('badges')
        .insert([{ user_id: userId, badge_id: badgeId }])
        .select()
        .single();
    if (error) return null;
    return data;
}

// ============================================
// NOTES
// ============================================
async function getNotes(userId, habitId) {
    try {
        const { data, error } = await supabaseClient
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .eq('habit_id', habitId)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data || [];
    } catch (err) {
        return [];
    }
}

async function insertNote(note) {
    const { data, error } = await supabaseClient
        .from('notes')
        .insert([note])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function deleteNoteFromDB(noteId) {
    const { error } = await supabaseClient
        .from('notes')
        .delete()
        .eq('id', noteId);
    return !error;
}

// ============================================
// USER STATS
// ============================================
async function updateUserStats(userId, updates) {
    const { data, error } = await supabaseClient
        .from('user_stats')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .maybeSingle();
    if (error) return null;
    return data;
}

console.log('[Supabase] Funksiyalar tayyor');