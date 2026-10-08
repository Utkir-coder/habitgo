// ============================================
// HABITGO — AI Motivatsiya (Gemini)
// ============================================

async function getAIMotivation() {
    if (!currentUser || !currentUserStats) {
        return "Bugun ajoyib kun bo'ladi! ✨";
    }

    const activeHabits = habits.filter(h => isHabitActive(h));
    const today = getTodayStr();
    const todayDay = new Date().getDay();
    const todayHabits = activeHabits.filter(h => h.days.includes(todayDay));
    const todayDone = todayHabits.filter(h => h.completedDays.includes(today));

    const context = `
Ism: ${currentUserProfile?.name || 'Foydalanuvchi'}
Faol odatlar: ${activeHabits.length}
Bugun bajarilishi kerak: ${todayHabits.length}
Bugun bajarildi: ${todayDone.length}
Eng yaxshi streak: ${habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0}
Level: ${currentUserStats.level}
XP: ${currentUserStats.total_xp}
    `.trim();

    const prompt = todayDone.length === todayHabits.length && todayHabits.length > 0
        ? "Bugun barcha odatlarni bajarding. Meni maqta!"
        : todayDone.length > 0
            ? "Bugun bir nechta odatni bajarding. Meni rag'batlantir!"
            : "Bugun hali hech narsa qilmadim. Meni boshlashga unda!";

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/gemini-ai`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({ prompt, context })
            }
        );

        const data = await response.json();
        return data.text || "Bugun ajoyib kun bo'ladi! ✨";
    } catch (err) {
        console.error('[AI] Xato:', err);
        return "Bugun ajoyib kun bo'ladi! ✨";
    }
}

async function updateMotivationWithAI() {
    const motivationEl = document.getElementById('motivationText');
    if (!motivationEl) return;

    motivationEl.textContent = '⏳ AI o\'ylayapti...';

    const text = await getAIMotivation();
    motivationEl.textContent = text;
}