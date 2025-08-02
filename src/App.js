// src/App.js

import React, { useState, useEffect, useCallback } from 'react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

// Component Imports
import Layout from './components/Layout';
import WelcomePage from './components/WelcomePage';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import TaxSaver from './components/TaxSaver';
import AIChat from './components/AIChat';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDjN0_LU5WEtCNLNryPIUjavIJAOXghCCQ",
  authDomain: "zenvana-web.firebaseapp.com",
  projectId: "zenvana-web",
  storageBucket: "zenvana-web.appspot.com",
  messagingSenderId: "783039988566",
  appId: "1:783039988566:web:6e8948d86341d4805eccf7",
  measurementId: "G-TVZF4SK0YG"
};

// --- Main App Component ---
function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const groqApiKey = "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";

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
              setUserId(user.uid);
              const docRef = doc(firestore, `users/${user.uid}/financial_data/summary`);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) { 
                  setFinancialSummary(docSnap.data());
                  setCurrentPage('dashboard');
              } else {
                  setCurrentPage('welcome'); // If no data, show welcome page first
              }
              setIsAuthReady(true);
          } else {
             signInAnonymously(firebaseAuth).catch(err => console.error("Anonymous sign in failed:", err));
          }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setIsAuthReady(true); // Still allow app to render, even if Firebase fails
    }
  }, []);
  
  const saveFinancialData = async (data) => {
    if (!db || !userId) { 
        console.error("Save aborted: Firebase not ready or user not logged in");
        throw new Error("Firebase not ready"); 
    }
    setIsSubmitting(true);
    try {
      const docRef = doc(db, `users/${userId}/financial_data/summary`);
      const expensesParsed = {};
      for (const key in data.expenses) { expensesParsed[key] = parseFloat(data.expenses[key] || 0); }
      const dataToSave = { ...data, expenses: expensesParsed, lastUpdated: new Date().toISOString() };
      await setDoc(docRef, dataToSave, { merge: true });
      setFinancialSummary(dataToSave);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("!!! Critical Error saving data:", error);
      setIsSubmitting(false);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const callGroqAPIWithRetry = useCallback(async (prompt, retries = 1, delay = 3000) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "llama3-8b-8192" })
      });
      if (response.status === 503 && retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return callGroqAPIWithRetry(prompt, retries - 1, delay);
      }
      if (!response.ok) { throw new Error(`API call failed with status: ${response.status}`); }
      const result = await response.json();
      if (result.choices?.[0]?.message?.content) { return result.choices[0].message.content; } 
      else { throw new Error("Invalid response from AI."); }
    } catch (error) { console.error("Full error object:", error); throw error; }
  }, [groqApiKey]);

  const callChatAPI = async (userMessage) => {
    setIsGeneratingResponse(true);
    const systemInstruction = `You are ZENVANA, an expert AI financial advisor for India. You MUST ONLY answer questions related to personal finance, economics, investing, and money-related topics in an Indian context. If the user asks an off-topic question, you MUST politely decline. Here is the user's financial profile for context: ${JSON.stringify(financialSummary, null, 2)}`;
    const newHistory = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(newHistory);
    
    const messagesForAPI = [
        { role: "system", content: systemInstruction },
        ...newHistory.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.parts[0].text }))
    ];
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messagesForAPI, model: "llama3-8b-8192" })
        });
        if (!response.ok) { throw new Error(`API call failed with status: ${response.status}`); }
        const result = await response.json();
        if (result.choices?.[0]?.message?.content) {
            setChatHistory(prev => [...prev, { role: "model", parts: [{ text: result.choices[0].message.content }] }]);
        } else { throw new Error("Invalid response from AI."); }
    } catch (error) { 
        setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments." }] }]);
    } finally { 
        setIsGeneratingResponse(false);
    }
  };

  const handleLogout = async () => {
    if (!auth || !db || !userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/financial_data/summary`));
      await signOut(auth);
      setFinancialSummary(null); 
      setChatHistory([]); 
      setUserId(null); 
      setIsAuthReady(false); // Trigger re-auth
      setCurrentPage('welcome');
    } catch (error) { console.error("Logout error:", error); }
  };

  const renderContent = () => {
    if (!isAuthReady) {
      return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Loading Zenvana...</div>;
    }

    if (currentPage === 'onboarding') {
      return <OnboardingFlow onSubmit={saveFinancialData} initialData={financialSummary} isSubmitting={isSubmitting} />;
    }

    if (['dashboard', 'taxSaver', 'aiChat'].includes(currentPage) && financialSummary) {
      return (
        <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
          {currentPage === 'dashboard' && <Dashboard financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />}
          {currentPage === 'taxSaver' && <TaxSaver financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />}
          {currentPage === 'aiChat' && <AIChat chatHistory={chatHistory} setChatHistory={setChatHistory} callChatAPI={callChatAPI} isGeneratingResponse={isGeneratingResponse} financialSummary={financialSummary} />}
        </Layout>
      );
    }

    // Default to Welcome Page
    return <WelcomePage onGetStarted={() => setCurrentPage('onboarding')} />;
  };

  return <div>{renderContent()}</div>;
}

export default App;
