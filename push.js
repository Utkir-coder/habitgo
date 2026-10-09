// ============================================
// HABITGO — Push Notification
// ============================================

const VAPID_PUBLIC_KEY = 'BMVBsQsDCaHhWV-we_NniHUsxzotUVNARGnc1lX8iH7hq8PpIEki2G8NF22aXg08JGJPpKEbX7fhA60Utjk1kEI
'; // ← O'zingizning public key

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

// Push subscription olish
async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Brauzer qo\'llab-quvvatlamaydi');
        return false;
    }

    if (!currentUser) {
        console.log('[Push] Tizimga kirmagan');
        return false;
    }

    try {
        // 1. Ruxsat so'rash
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('[Push] Ruxsat berilmadi');
            return false;
        }

        // 2. Service Worker tayyor
        const registration = await navigator.serviceWorker.ready;

        // 3. Subscription olish
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // 4. Supabase'ga saqlash
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
            return false;
        }

        console.log('[Push] Subscription saqlandi ✅');
        showToast('🔔 Eslatmalar yoqildi!');
        return true;

    } catch (err) {
        console.error('[Push] Xato:', err);
        return false;
    }
}

// Push'ni o'chirish
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

        showToast('🔕 Eslatmalar o\'chirildi');
        return true;
    } catch (err) {
        console.error('[Push] O\'chirish xatosi:', err);
        return false;
    }
}

// Foydalanuvchi obuna bo'lganmi?
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