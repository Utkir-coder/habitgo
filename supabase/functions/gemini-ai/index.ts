import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context } = await req.json()

    const fullPrompt = `Sen HabitGo ilovasining AI motivatsiya yordamchisisan.
Foydalanuvchi haqida: ${context}
Vazifa: Qisqa, motivatsion va shaxsiy javob yozing (maksimum 2-3 gap, o'zbek tilida).

Foydalanuvchi so'rovi: ${prompt}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        })
      }
    )

    const data = await response.json()
    console.log('[Gemini] Response:', JSON.stringify(data).substring(0, 200))

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Bugun ajoyib kun bo\'ladi! ✨'

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('[Gemini] Xato:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})