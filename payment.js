// ============================================
// OBUNA VA TO'LOV
// ============================================
function showSubscription() {
    document.getElementById('subscriptionPage').style.display = 'flex';
    document.getElementById('profileDropdown').classList.remove('show');

    document.getElementById('currentPlan').textContent = getPlanName(currentUser.plan);
}

function buyPremium(type) {
    if (!currentUser) return;

    const prices = {
        monthly: { amount: 9900, days: 30, name: 'Premium (1 oy)' },
        yearly: { amount: 99000, days: 365, name: 'Premium (1 yil)' }
    };

    const plan = prices[type];

    if (!confirm(`💎 ${plan.name}\n\nNarxi: ${plan.amount.toLocaleString()} so'm\n\nTo'lovni tasdiqlaysizmi?`)) {
        return;
    }

    // ⚠️ DEMO: haqiqiy to'lov emas
    // Keyinchalik Payme/Click API bilan almashtiriladi
    simulatePayment(plan.amount, () => {
        // To'lov muvaffaqiyatli
        currentUser.plan = type;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + plan.days);
        currentUser.planExpiresAt = expiresAt.toISOString();

        updateCurrentUser();

        alert(`🎉 Tabriklaymiz! ${plan.name} faollashtirildi!\n\n📅 Tugash sanasi: ${formatDate(currentUser.planExpiresAt)}`);

        closePage();
        if (typeof renderHabits === 'function') renderHabits();
    });
}

// To'lovni simulyatsiya qilish (demo)
function simulatePayment(amount, onSuccess) {
    // "Loading" ko'rsatish
    const loading = document.createElement('div');
    loading.className = 'payment-loading';
    loading.innerHTML = `
        <div class="payment-spinner"></div>
        <p>To'lov amalga oshirilmoqda...</p>
        <p style="font-size:12px;color:#888;">${amount.toLocaleString()} so'm</p>
    `;
    document.body.appendChild(loading);

    // 2 sekunddan keyin muvaffaqiyat
    setTimeout(() => {
        loading.remove();
        onSuccess();
    }, 2000);
}