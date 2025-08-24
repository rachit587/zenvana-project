// netlify/functions/groqChat.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { messages, prompt, model } = JSON.parse(event.body || "{}");
    const chosenModel = model || "llama-3.1-70b-versatile";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: chosenModel,
        temperature: 0.2,
        messages: messages ?? [
          { role: "system", content: "You are ZENVANA, an Indian personal finance expert. Be practical, accurate, India-first." },
          { role: "user", content: prompt || "Say hello" }
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, body: JSON.stringify({ error: err }) };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
