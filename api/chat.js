// api/chat.js
export const config = { runtime: 'edge' }; // runs on Vercel Edge (fast, simple)

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const { messages, city, lat, lng, system } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages[] required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // System guidance: keep the assistant "local, legit, and bundle-aware"
    const sys = system ?? `
You are "Legit Friend", the local AI inside Anything Legit.
- Be brief, helpful, and local to the user's city.
- Use given city/coords. If unsure, ask a short clarifying question.
- Never invent prices/availability; offer a range or ask to confirm.
- Suggest helpful bundles (ride → cloakroom → tour) when relevant.
- Reply in the language of the last user message. Emojis only if user uses them.
`;

    const userContext = city ? `City: ${city}.` : '';
    const geoContext =
      typeof lat === 'number' && typeof lng === 'number'
        ? `User approx location: ${lat},${lng}.`
        : '';

    // ⚠️ We'll set AI_API_KEY later in Vercel. Do not hardcode keys here.
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5', // replace with the exact model id you'll use
        temperature: 0.3,
        messages: [
          { role: 'system', content: sys },
          { role: 'system', content: `${userContext} ${geoContext}`.trim() },
          ...messages,
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      return new Response(JSON.stringify({ error: 'Upstream AI error', detail }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? '(no reply)';
    return new Response(JSON.stringify({ reply }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', detail: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
