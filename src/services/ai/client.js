export async function askAdvisor({ mode = "groq-fast", question }) {
  const r = await fetch("/.netlify/functions/aiRouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, question })
  });
  if (!r.ok) throw new Error(`AI error: ${r.status}`);
  return r.json();
}
