# legit-ai-proxy

A tiny Vercel Edge Function that forwards chat requests from the Anything Legit app to an AI model and returns JSON replies.

> **Security:** Never put API keys in this repo. Add `AI_API_KEY` as a secret in Vercel (Project → Settings → Environment Variables).

## Endpoint (after deploy)

**POST** `/api/chat`  

**Body (JSON):**

    {
      "messages": [{"role":"user","content":"Hi"}],
      "city": "Rishikesh",
      "lat": 30.086,
      "lng": 78.267,
      "system": "(optional) extra instructions"
    }

**Response (JSON):**

    { "reply": "Hello! How can I help near Rishikesh today?" }

## Notes
- Model + key set via `AI_API_KEY` on Vercel.
- Keep replies local and concise; don’t invent prices—ask to confirm or give a range.
