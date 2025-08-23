import React, { useEffect, useState } from "react";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { app, db } from "./services/firebase/init";
import { askAdvisor } from "./services/ai/client";
import DashboardCards from "./components/DashboardCards";
import "./index.css";

export default function App() {
  const [uid, setUid] = useState(null);
  const [snapshot, setSnapshot] = useState({ netWorth: 0, monthlySavings: 0, healthScore: 0 });
  const [prompt, setPrompt] = useState("");
  const [aiResp, setAiResp] = useState("");

  useEffect(() => {
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { await signInAnonymously(auth); return; }
      setUid(user.uid);
      const ref = doc(db, `users/${user.uid}/financial_summary`, "default");
      const snap = await getDoc(ref);
      if (snap.exists()) setSnapshot(snap.data());
      else {
        const seed = { netWorth: 250000, monthlySavings: 15000, healthScore: 62 };
        await setDoc(ref, seed);
        setSnapshot(seed);
      }
    });
    return () => unsub();
  }, []);

  const handleAsk = async () => {
    const res = await askAdvisor({
      mode: "groq-fast",
      question: prompt || "Give me a snapshot and top 3 actions to improve my finances."
    });
    setAiResp(res.text || JSON.stringify(res, null, 2));
  };

  return (
    <div className="container">
      <header className="header">
        <div className="brand">Zenvana v2</div>
        <div className="badge">{uid ? `anon:${uid.slice(0,6)}` : "connecting..."}</div>
      </header>

      <DashboardCards snapshot={snapshot} />

      <section className="section">
        <h2>AI Advisor</h2>
        <p className="badge">All AI calls go through Netlify Functions (secure).</p>
        <textarea
          placeholder="Ask anything… e.g., 'Raise my Health Score to 75 in 90 days.'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <button className="button" onClick={handleAsk}>Ask Zenvana</button>
        </div>
        {aiResp && (
          <div className="section">
            <h3>Response</h3>
            <pre>{aiResp}</pre>
          </div>
        )}
      </section>
    </div>
  );
}
