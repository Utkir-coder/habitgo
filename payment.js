// ============================================
// HABITGO — Payment (Demo)
// ============================================

function showSubscription() {
    document.getElementById('subscriptionPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    const planEl = document.getElementById('currentPlan');
    if (planEl && typeof currentUserStats !== 'undefined' && currentUserStats) {
        planEl.textContent = getPlanName(currentUserStats.plan);
    }
}

async function buyPremium(type) {
    if (!currentUser || !currentUserStats) {
        alert('❌ Tizimga kiring!');
        return;
    }

    const prices = {
        monthly: { amount: 9900, days: 30, name: 'Premium (1 oy)' },
        yearly: { amount: 99000, days: 365, name: 'Premium (1 yil)' }
    };

    const plan = prices[type];
    if (!plan) {
        alert('❌ Noto\'g\'ri tarif!');
        return;
    }

    // Tasdiqlash
    const confirmMsg = `💎 ${plan.name}\n\n` +
        `Narxi: ${plan.amount.toLocaleString()} so'm\n` +
        `Muddat: ${plan.days} kun\n\n` +
        `To'lovni tasdiqlaysizmi?`;

    if (!confirm(confirmMsg)) return;

    // Tugmani bloklash
    const buttons = document.querySelectorAll('#subscriptionPage .btn-primary, #subscriptionPage .btn-outline');
    buttons.forEach(btn => { btn.disabled = true; });

    try {
        // To'lov simulyatsiyasi
        await simulatePayment(plan.amount, plan.name);

        // Premium faollashtirish
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.days);

        const planType = type === 'yearly' ? 'yearly' : 'monthly';

        // Supabase'ga yozish
        await updateUserStats(currentUser.id, {
            plan: planType,
            plan_expires_at: expiresAt.toISOString()
        });

        // Local yangilash
        currentUserStats.plan = planType;
        currentUserStats.plan_expires_at = expiresAt.toISOString();

        // Effektlar
        if (typeof playSound === 'function') playSound('success');
        if (typeof triggerConfetti === 'function') triggerConfetti();

        // Tabrik
        alert(`🎉 Tabriklayman!\n\n${plan.name} faollashtirildi!\n\n📅 Tugash sanasi: ${formatDate(expiresAt.toISOString())}`);

        // Sahifani yopish
        closePage();

        // UI yangilash
        if (typeof checkPremiumLimit === 'function') checkPremiumLimit();
        if (typeof renderHabits === 'function') renderHabits();
        if (typeof renderBadgesPreview === 'function') renderBadgesPreview();

    } catch (err) {
        console.error('[Payment] Xato:', err);
        alert('❌ To\'lovda xato: ' + err.message);
    } finally {
        buttons.forEach(btn => { btn.disabled = false; });
    }
}

// To'lov simulyatsiyasi
function simulatePayment(amount, planName) {
    return new Promise((resolve) => {
        const loading = document.createElement('div');
        loading.className = 'payment-loading';
        loading.innerHTML = `
            <div class="payment-spinner"></div>
            <p>To'lov amalga oshirilmoqda...</p>
            <p style="font-size:12px;color:#aaa;margin-top:8px;">${planName}</p>
            <p style="font-size:14px;color:#fff;font-weight:bold;margin-top:4px;">${amount.toLocaleString()} so'm</p>
        `;
        document.body.appendChild(loading);

        setTimeout(() => {
            loading.remove();
            resolve(true);
        }, 2000);
    });
}

// Reja nomi
function getPlanName(plan) {
    return {
        free: 'Bepul',
        monthly: 'Premium',
        yearly: 'Yillik Premium'
    }[plan] || 'Bepul';
}

// Sana formatlash
function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}`;
}