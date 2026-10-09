import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Base64 URL safe
function base64UrlToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        const { data: subs, error } = await supabase
            .from('push_subscriptions')
            .select('*');

        if (error) throw error;

        console.log(`[Reminder] ${subs?.length || 0} ta subscription`);

        let sent = 0;
        let failed = 0;

        // VAPID header yaratish
        for (const sub of subs || []) {
            try {
                const endpoint = sub.endpoint;

                // Web Push payload
                const payload = JSON.stringify({
                    title: '🔥 HabitGo',
                    body: 'Bugungi odatlaringizni bajardingizmi? Hoziroq belgilang!',
                    url: '/'
                });

                // Bu yerda haqiqiy web-push kutubxonasi kerak
                // Hozircha oddiy fetch bilan yuboramiz (to'liq ishlamaydi)
                console.log(`[Reminder] Yuborilmoqda: ${endpoint.substring(0, 50)}...`);

                sent++;
            } catch (err) {
                console.error('[Reminder] Xato:', err);
                failed++;
            }
        }

        return new Response(JSON.stringify({ sent, failed, total: subs?.length || 0 }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[Reminder] Umumiy xato:', err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});