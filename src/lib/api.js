export async function groqChat(payload) {
  const body = Array.isArray(payload)
    ? { messages: payload }
    : typeof payload === "string"
      ? { prompt: payload }
      : payload;

  const res = await fetch("/.netlify/functions/groqChat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Groq call failed");
  }
  const data = await res.json();
  return data.text;
}

export async function groqChatWithRetry(input, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await groqChat(input);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}
