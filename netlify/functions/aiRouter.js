const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async (event) => {
  try {
    const { mode = "groq-fast", question = "" } = JSON.parse(event.body || "{}");
    if (!question) return json(400, { error: "Missing question" });

    if (mode === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return json(500, { error: "OPENAI_API_KEY not set" });
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content:
              "You are Zenvana, India’s empathetic, trustworthy AI financial advisor. Balance tax optimization, risk management, and goal achievement. Be conservative, explain tradeoffs, and give step-by-step actions." },
            { role: "user", content: question }
          ],
          temperature: 0.3
        })
      });
      const data = await r.json();
      return json(200, { text: data.choices?.[0]?.message?.content || "" });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return json(500, { error: "GROQ_API_KEY not set" });
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are Zenvana, an efficient Indian personal finance co‑pilot. Keep responses crisp with numbered steps." },
          { role: "user", content: question }
        ],
        temperature: 0.4
      })
    });
    const data = await r.json();
    return json(200, { text: data.choices?.[0]?.message?.content || "" });
  } catch (e) {
    return json(500, { error: e.message });
  }
};

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
