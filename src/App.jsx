// src/App.jsx
import React, { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signInAnonymously, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase/client";

// ✅ match your tree exactly
import Layout from "./components/Layout";
import WelcomePage from "./components/WelcomePage";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import Dashboard from "./components/dashboard/Dashboard";
import TaxSaver from "./components/tax/TaxSaver";
import AIChat from "./components/chat/AIChat";

import { groqChatWithRetry } from "./lib/api";

// simple banner if firebase env vars are missing in the frontend build
const MissingConfigBanner = ({ items = [] }) =>
  items.length ? (
    <div className="p-4 bg-red-900/70 text-red-100 border border-red-700 rounded-xl m-4">
      <p className="font-semibold mb-1">Missing configuration</p>
      <ul className="list-disc ml-6 text-sm">
        {items.map((i) => (
          <li key={i}>
            <code>{i}</code> not set.
          </li>
        ))}
      </ul>
    </div>
  ) : null;

export default function App() {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [currentPage, setCurrentPage] = useState("welcome");
  const [financialSummary, setFinancialSummary] = useState(null);

  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // frontend sanity check (GROQ key is server-side, so not checked here)
  const missing = [];
  if (!process.env.REACT_APP_FIREBASE_API_KEY) missing.push("REACT_APP_FIREBASE_API_KEY");
  if (!process.env.REACT_APP_FIREBASE_PROJECT_ID) missing.push("REACT_APP_FIREBASE_PROJECT_ID");
  if (!process.env.REACT_APP_FIREBASE_APP_ID) missing.push("REACT_APP_FIREBASE_APP_ID");

  // auth + load saved summary
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const snap = await getDoc(doc(db, `users/${user.uid}/financial_data/summary`));
        if (snap.exists()) {
          setFinancialSummary(snap.data());
          setCurrentPage("dashboard");
        }
        setIsAuthReady(true);
      } else {
        signInAnonymously(auth).catch(() => setIsAuthReady(true));
      }
    });
    return () => unsub();
  }, []);

  // persist onboarding result
  const saveFinancialData = async (data) => {
    setIsSubmitting(true);
    try {
      const ref = doc(db, `users/${userId}/financial_data/summary`);
      // ensure numbers in expenses
      const expensesParsed = Object.fromEntries(
        Object.entries(data.expenses || {}).map(([k, v]) => [k, parseFloat(v || 0)])
      );
      const payload = { ...data, expenses: expensesParsed, lastUpdated: new Date().toISOString() };
      await setDoc(ref, payload, { merge: true });
      setFinancialSummary(payload);
      setCurrentPage("dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  // serverless Groq helper (proxy function)
  const callGroqAPIWithRetry = useCallback(async (input) => {
    return await groqChatWithRetry(input);
  }, []);

  // chat wrapper to keep AIChat dumb/simple
  const callChatAPI = async (userMessage) => {
    setIsGeneratingResponse(true);

    const system = `You are ZENVANA, a hyper-personalized AI financial advisor for India.
Only answer money/finance questions in Indian context. If off-topic, politely decline.
USER CONTEXT:
${JSON.stringify(financialSummary, null, 2)}
`;

    const messages = [
      { role: "system", content: system },
      ...chatHistory.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.parts[0].text,
      })),
      { role: "user", content: userMessage },
    ];

    setChatHistory((h) => [...h, { role: "user", parts: [{ text: userMessage }] }]);

    try {
      const reply = await callGroqAPIWithRetry(messages);
      setChatHistory((h) => [...h, { role: "model", parts: [{ text: reply }] }]);
    } catch (e) {
      setChatHistory((h) => [
        ...h,
        { role: "model", parts: [{ text: "Sorry, I hit a snag. Try again." }] },
      ]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // logout + wipe current summary doc
  const handleLogout = async () => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/financial_data/summary`));
    } catch {}
    try {
      await signOut(auth);
    } catch {}
    setFinancialSummary(null);
    setChatHistory([]);
    setUserId(null);
    setIsAuthReady(false);
    setCurrentPage("welcome");
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        Loading...
      </div>
    );
  }

  const goOnboard = () => setCurrentPage(financialSummary ? "dashboard" : "onboarding");

  return (
    <div>
      <MissingConfigBanner items={missing} />

      {currentPage === "welcome" && <WelcomePage onGetStarted={goOnboard} />}

      {currentPage === "onboarding" && (
        <OnboardingFlow
          onSubmit={saveFinancialData}
          initialData={financialSummary}
          isSubmitting={isSubmitting}
        />
      )}

      {["dashboard", "taxSaver", "aiChat"].includes(currentPage) && financialSummary && (
        <Layout
          userId={userId}
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          handleLogout={handleLogout}
        >
          {currentPage === "dashboard" && (
            <Dashboard
              financialSummary={financialSummary}
              callGroqAPIWithRetry={callGroqAPIWithRetry}
            />
          )}

          {currentPage === "taxSaver" && (
            <TaxSaver
              financialSummary={financialSummary}
              callGroqAPIWithRetry={callGroqAPIWithRetry}
            />
          )}

          {currentPage === "aiChat" && (
            <AIChat
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              callChatAPI={callChatAPI}
              isGeneratingResponse={isGeneratingResponse}
              financialSummary={financialSummary}
            />
          )}
        </Layout>
      )}
    </div>
  );
}
