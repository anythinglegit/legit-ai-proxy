// api/chat.js — simple & friendly
export const config = { runtime: 'edge' }; // Vercel Edge (fast)

export default async function handler(req) {
  // 1) If you just open the URL in a browser (GET), show an "alive" page.
  if (req.method === 'GET') {
    const html = `
      <!doctype html>
      <meta charset="utf-8">
      <title>Anything Legit AI Proxy</title>
      <style>
        body{font-family:system-ui,Arial,sans-serif;padding:32px;max-width:720px;margin:auto;line-height:1.5}
        .ok{font-size:20px}
        code{background:#f4f4f4;padding:2px 4px;border-radius:4px}
      </style>
      <h1>✅ Alive</h1>
      <p class="ok">Your AI proxy is deployed and reachable.</p>
      <p>For real chat, your app will POST JSON to <code>/api/chat</code>.</p>
      <hr>
      <p><b>Next:</b> paste this URL into your Flutter screen later.</p>
    `;
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  // 2) Only POST is allowed for actual chat.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with JSON body' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const { messages, city, lat, lng, system } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages[] required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Guidance to keep answers local & safe
    const sys = system ?? `
You are "Legit Friend", the local AI inside Anything Legit.
- Be brief, helpful, and local to the user's city.
- Use given city/coords. If unsure, ask a short clarifying question.
- Never invent prices/availability; offer a range or ask to confirm.
- Suggest helpful bundles (ride → cloakroom → tour) when relevant.
- Reply in the language of the last user message. Emojis only if user uses them.
`;

    const userContext = city ? `City: ${city}.` : '';
    const geoContext = (typeof lat === 'number' && typeof lng === 'number')
      ? `User approx location: ${lat},${lng}.` : '';

    // 🔑 Your key lives in Vercel env vars. Do NOT hardcode here.
    // ⚠️ Put a real model id you have access to (example: "gpt-4o-mini").
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: sys },
          { role: 'system', content: `${userContext} ${geoContext}`.trim() },
          ...messages
        ]
      })
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      return new Response(JSON.stringify({ error: 'Upstream AI error', detail }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? '(no reply)';
    return new Response(JSON.stringify({ reply }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
