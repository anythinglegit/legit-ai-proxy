# legit-ai-proxy

A tiny Vercel Edge Function that forwards chat requests from the Anything Legit app to an AI model and returns JSON replies.

> **Security:** Never put API keys in this repo. Add `AI_API_KEY` as a secret in Vercel.

## How it works
Your Flutter app sends a POST request to `/api/chat` with the user's message and (optionally) city/coords.  
This function forwards it to the AI model and returns `{ "reply": "..." }`.

## Endpoint (after deploy)
**POST** `/api/chat`  
**Body (JSON):**
```json
{
  "messages": [{"role":"user","content":"Hi"}],
  "city": "Rishikesh",
  "lat": 30.086,
  "lng": 78.267,
  "system": "(optional) extra instructions"
}
