// ============================================
// HABITGO — Push Notification
// ============================================

const VAPID_PUBLIC_KEY = 'BMVBsQsDCaHhWV-we_NniHUsxzotUVNARGnc1lX8iH7hq8PpIEki2G8NF22aXg08JGJPpKEbX7fhA60Utjk1kEI';

// Base64 → Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Brauzer qo\'llab-quvvatlamaydi');
        alert('❌ Brauzer push notification qo\'llab-quvvatlamaydi');
        return false;
    }

    if (!currentUser) {
        alert('❌ Tizimga kiring!');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert('⚠️ Bildirishnoma ruxsati berilmadi');
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        const subJson = subscription.toJSON();

        const { error } = await supabaseClient
            .from('push_subscriptions')
            .upsert({
                user_id: currentUser.id,
                endpoint: subJson.endpoint,
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('[Push] Saqlash xatosi:', error);
            alert('❌ Saqlashda xato: ' + error.message);
            return false;
        }

        console.log('[Push] Subscription saqlandi ✅');
        if (typeof showToast === 'function') showToast('🔔 Eslatmalar yoqildi!');
        alert('✅ Eslatmalar yoqildi!');
        return true;

    } catch (err) {
        console.error('[Push] Xato:', err);
        alert('❌ Xato: ' + err.message);
        return false;
    }
}

async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            await supabaseClient
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);
        }

        if (typeof showToast === 'function') showToast('🔕 Eslatmalar o\'chirildi');
        return true;
    } catch (err) {
        console.error('[Push] O\'chirish xatosi:', err);
        return false;
    }
}

async function isPushSubscribed() {
    if (!('serviceWorker' in navigator)) return false;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        return !!subscription;
    } catch {
        return false;
    }
}