// src/lib/api.js
export async function groqChat(promptOrMessages, model) {
  const payload = Array.isArray(promptOrMessages)
    ? { messages: promptOrMessages, model }
    : { prompt: promptOrMessages, model };

  const res = await fetch("/.netlify/functions/groqChat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Groq call failed");
  }
  const data = await res.json();
  return data.text;
}

// simple retry with backoff
export async function groqChatWithRetry(input, model, tries = 3) {
  let err;
  for (let i = 0; i < tries; i++) {
    try {
      return await groqChat(input, model);
    } catch (e) {
      err = e;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw err;
}
