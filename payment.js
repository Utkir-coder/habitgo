// ============================================
// HABITGO — Payment (i18n bilan)
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
        alert('❌ ' + t('alert_signin_required'));
        return;
    }

    const prices = {
        monthly: { amount: 9900, days: 30, name: t('payment_plan_monthly') },
        yearly: { amount: 99000, days: 365, name: t('payment_plan_yearly') }
    };

    const plan = prices[type];
    if (!plan) {
        alert('❌ ' + t('payment_invalid_plan'));
        return;
    }

    const confirmMsg = `💎 ${plan.name}\n\n` +
        `${t('payment_plan_price')}: ${plan.amount.toLocaleString()} ${t('payment_amount')}\n` +
        `${t('payment_plan_days')}: ${plan.days} ${t('payment_days')}\n\n` +
        `${t('payment_confirm')}`;

    if (!confirm(confirmMsg)) return;

    const buttons = document.querySelectorAll('#subscriptionPage .btn-primary, #subscriptionPage .btn-outline');
    buttons.forEach(btn => { btn.disabled = true; });

    try {
        await simulatePayment(plan.amount, plan.name);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.days);

        const planType = type === 'yearly' ? 'yearly' : 'monthly';

        await updateUserStats(currentUser.id, {
            plan: planType,
            plan_expires_at: expiresAt.toISOString()
        });

        currentUserStats.plan = planType;
        currentUserStats.plan_expires_at = expiresAt.toISOString();

        if (typeof playSound === 'function') playSound('success');
        if (typeof triggerConfetti === 'function') triggerConfetti();

        alert(`🎉 ${t('payment_success')}\n\n${plan.name} ${t('payment_activated')}\n\n📅 ${t('payment_until')}: ${formatDate(expiresAt.toISOString())}`);

        closePage();

        if (typeof checkPremiumLimit === 'function') checkPremiumLimit();
        if (typeof renderHabits === 'function') renderHabits();
        if (typeof renderBadgesPreview === 'function') renderBadgesPreview();
        if (typeof checkForNewBadges === 'function') setTimeout(checkForNewBadges, 500);

    } catch (err) {
        console.error('[Payment] Xato:', err);
        alert('❌ ' + t('payment_error') + ': ' + err.message);
    } finally {
        buttons.forEach(btn => { btn.disabled = false; });
    }
}

function simulatePayment(amount, planName) {
    return new Promise((resolve) => {
        const loading = document.createElement('div');
        loading.className = 'payment-loading';
        loading.innerHTML = `
            <div class="payment-spinner"></div>
            <p>${t('payment_loading')}</p>
            <p style="font-size:12px;color:#aaa;margin-top:8px;">${planName}</p>
            <p style="font-size:14px;color:#fff;font-weight:bold;margin-top:4px;">${amount.toLocaleString()} ${t('payment_amount')}</p>
        `;
        document.body.appendChild(loading);

        setTimeout(() => { loading.remove(); resolve(true); }, 2000);
    });
}

function getPlanName(plan) {
    return {
        free: t('plan_free'),
        monthly: t('plan_monthly'),
        yearly: t('plan_yearly')
    }[plan] || t('plan_free');
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    const months = {
        uz: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
        ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    const monthNames = months[currentLang] || months.uz;
    return `${d.getDate()}-${monthNames[d.getMonth()]}, ${d.getFullYear()}`;
}