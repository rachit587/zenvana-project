// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

// Import components
import Layout from "./components/Layout";
import WelcomePage from './components/WelcomePage';
import OnboardingFlow from "./pages/Onboarding/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import TaxSaver from "./pages/TaxSaver";
import AIChat from "./pages/AIChat";

const firebaseConfig = {
  apiKey: "AIzaSyDjN0_LU5WEtCNLNryPIUjavIJAOXghCCQ",
  authDomain: "zenvana-web.firebaseapp.com",
  projectId: "zenvana-web",
  storageBucket: "zenvana-web.appspot.com",
  messagingSenderId: "783039988566",
  appId: "1:783039988566:web:6e8948d86341d4805eccf7",
  measurementId: "G-TVZF4SK0YG"
};

function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState("welcome");
  const [financialSummary, setFinancialSummary] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groqApiKey = process.env.REACT_APP_GROQ_API_KEY;

  // 🔹 Firebase init
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
            setCurrentPage("dashboard");
          }
          setIsAuthReady(true);
        } else {
          signInAnonymously(firebaseAuth).catch(err => console.error("Anonymous sign in failed:", err));
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setIsAuthReady(true);
    }
  }, []);

  // 🔹 Save financial data
  const saveFinancialData = async (data) => {
    if (!db || !userId) throw new Error("Firebase not ready");

    setIsSubmitting(true);
    try {
      const docRef = doc(db, `users/${userId}/financial_data/summary`);
      await setDoc(docRef, { ...data, lastUpdated: new Date().toISOString() }, { merge: true });
      setFinancialSummary(data);
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Error saving data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Handle logout
  const handleLogout = async () => {
    if (!auth || !db || !userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/financial_data/summary`));
      await signOut(auth);
      setFinancialSummary(null);
      setChatHistory([]);
      setUserId(null);
      setIsAuthReady(false);
      setCurrentPage("welcome");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthReady) return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Loading...</div>;

  return (
    <div>
      {currentPage === "welcome" && <WelcomePage onGetStarted={() => setCurrentPage("onboarding")} />}
      {currentPage === "onboarding" && <OnboardingFlow onSubmit={saveFinancialData} initialData={financialSummary} isSubmitting={isSubmitting} />}
      {["dashboard", "taxSaver", "aiChat"].includes(currentPage) && financialSummary && (
        <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
          {currentPage === "dashboard" && <Dashboard financialSummary={financialSummary} />}
          {currentPage === "taxSaver" && <TaxSaver financialSummary={financialSummary} />}
          {currentPage === "aiChat" && (
            <AIChat chatHistory={chatHistory} setChatHistory={setChatHistory} isGeneratingResponse={isGeneratingResponse} financialSummary={financialSummary} />
          )}
        </Layout>
      )}
    </div>
  );
}

export default App;
