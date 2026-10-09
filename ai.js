// ============================================
// HABITGO — AI Motivatsiya (i18n bilan)
// ============================================

async function getAIMotivation() {
    if (!currentUser || !currentUserStats) {
        return t('hero_sub');
    }

    const activeHabits = habits.filter(h => isHabitActive(h));
    const today = getTodayStr();
    const todayDay = new Date().getDay();
    const todayHabits = activeHabits.filter(h => h.days.includes(todayDay));
    const todayDone = todayHabits.filter(h => h.completedDays.includes(today));

    // Til bo'yicha prompt
    const langPrompts = {
        uz: {
            context: `
Ism: ${currentUserProfile?.name || 'Foydalanuvchi'}
Faol odatlar: ${activeHabits.length}
Bugun bajarilishi kerak: ${todayHabits.length}
Bugun bajarildi: ${todayDone.length}
Eng yaxshi streak: ${habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0}
Level: ${currentUserStats.level}
XP: ${currentUserStats.total_xp}
            `.trim(),
            praise: 'Bugun barcha odatlarni bajarding. Meni maqta!',
            encourage: 'Bugun bir nechta odatni bajarding. Meni rag\'batlantir!',
            push: 'Bugun hali hech narsa qilmadim. Meni boshlashga unda!',
            instruction: 'Vazifa: Qisqa, motivatsion va shaxsiy javob yozing (maksimum 2-3 gap, o\'zbek tilida).'
        },
        ru: {
            context: `
Имя: ${currentUserProfile?.name || 'Пользователь'}
Активных привычек: ${activeHabits.length}
Сегодня нужно: ${todayHabits.length}
Сегодня выполнено: ${todayDone.length}
Лучшая серия: ${habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0}
Уровень: ${currentUserStats.level}
XP: ${currentUserStats.total_xp}
            `.trim(),
            praise: 'Сегодня я выполнил все привычки. Похвали меня!',
            encourage: 'Сегодня я выполнил несколько привычек. Вдохнови меня!',
            push: 'Сегодня я ещё ничего не сделал. Подтолкни меня начать!',
            instruction: 'Задача: Напиши короткий, мотивационный и личный ответ (максимум 2-3 предложения, на русском языке).'
        },
        en: {
            context: `
Name: ${currentUserProfile?.name || 'User'}
Active habits: ${activeHabits.length}
Today needed: ${todayHabits.length}
Today done: ${todayDone.length}
Best streak: ${habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0}
Level: ${currentUserStats.level}
XP: ${currentUserStats.total_xp}
            `.trim(),
            praise: 'Today I completed all habits. Praise me!',
            encourage: 'Today I completed some habits. Encourage me!',
            push: 'Today I haven\'t done anything yet. Push me to start!',
            instruction: 'Task: Write a short, motivational and personal response (max 2-3 sentences, in English).'
        }
    };

    const langData = langPrompts[currentLang] || langPrompts.uz;

    const prompt = todayDone.length === todayHabits.length && todayHabits.length > 0
        ? langData.praise
        : todayDone.length > 0
            ? langData.encourage
            : langData.push;

    const fullPrompt = `${langData.instruction}\n\n${langData.context}\n\n${prompt}`;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/gemini-ai`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify({
                    prompt: fullPrompt,
                    context: langData.context,
                    lang: currentLang
                })
            }
        );

        const data = await response.json();
        return data.text || t('hero_sub');
    } catch (err) {
        console.error('[AI] Xato:', err);
        return t('hero_sub');
    }
}

async function updateMotivationWithAI() {
    const motivationEl = document.getElementById('motivationText');
    if (!motivationEl) return;

    motivationEl.textContent = '⏳ ' + t('loading');

    const text = await getAIMotivation();
    motivationEl.textContent = text;
}