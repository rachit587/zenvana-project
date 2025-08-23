// Uses native fetch in Netlify (Node 18+). No extra deps needed.
exports.handler = async (event) => {
  try {
    const { mode = "groq-fast", question = "", profile = {}, chat = [] } = JSON.parse(event.body || "{}");
    if (!question) return j(400, { error: "Missing question" });

    // Compose a consistent, compliant system prompt
    const sys = [
      "You are ZENVANA, a hyper-personalized AI financial advisor for India.",
      "Balance tax optimization, risk management, and goal achievement.",
      "Be conservative, explain tradeoffs, give step-by-step actions.",
      "Use the provided USER PROFILE strictly for personalization.",
      "If asked non-finance topics, politely decline and guide back to finance."
    ].join(" ");

    const userContext = `--- USER PROFILE (JSON) ---\n${JSON.stringify(profile)}\n--- END PROFILE ---`;

    // Build messages (include short chat history for continuity)
    const baseMessages = [
      { role: "system", content: sys },
      { role: "user", content: userContext },
      ...chat.slice(-8).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text || m.parts?.[0]?.text || "" })),
      { role: "user", content: question }
    ];

    // OPENAI path (accurate/strategic)
    if (mode === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return j(500, { error: "OPENAI_API_KEY not set" });
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: baseMessages, temperature: 0.3 })
      });
      const data = await r.json();
      if (!r.ok) return j(r.status, { error: data.error?.message || "OpenAI request failed" });
      return j(200, { text: data.choices?.[0]?.message?.content || "" });
    }

    // Default GROQ path (fast/cheap)
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return j(500, { error: "GROQ_API_KEY not set" });

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3-8b-8192", messages: baseMessages, temperature: 0.4 })
    });
    const data = await r.json();
    if (!r.ok) return j(r.status, { error: data.error?.message || "Groq request failed" });
    return j(200, { text: data.choices?.[0]?.message?.content || "" });
  } catch (e) {
    return j(500, { error: e.message || "Unhandled error" });
  }
};

function j(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
