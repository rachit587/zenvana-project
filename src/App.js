import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from './firebase/config';
import WelcomePage from './components/WelcomePage';
import Auth from './components/Auth';
import OnboardingFlow from './components/Onboarding';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaxSaver from './components/TaxSaver';
import AIChat from './components/AIChat';
import Profile from './components/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const docRef = doc(db, `users/${authUser.uid}/financial_data/summary`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFinancialSummary(docSnap.data());
        } else {
          setFinancialSummary(null);
        }
      } else {
        setUser(null);
        setFinancialSummary(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // The empty dependency array ensures this runs only once on mount.

  const saveFinancialData = async (data) => {
    if (!user || !user.uid) {
      throw new Error("User not authenticated.");
    }
    const dataToSave = { ...data, lastUpdated: new Date().toISOString() };
    try {
      const docRef = doc(db, `users/${user.uid}/financial_data/summary`);
      await setDoc(docRef, dataToSave, { merge: true });
      setFinancialSummary(dataToSave);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  };

  // This function checks user status before rendering protected routes.
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Loading Zenvana...</div>;
    }
    if (!user) {
      navigate('/auth');
      return null;
    }
    if (!financialSummary && location.pathname !== '/onboarding') {
      navigate('/onboarding');
      return null;
    }
    return children;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
        Loading Zenvana...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow onSubmit={saveFinancialData} /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout currentPage="dashboard" userId={user.uid}><Dashboard financialSummary={financialSummary} /></Layout></ProtectedRoute>} />
      <Route path="/tax-saver" element={<ProtectedRoute><Layout currentPage="tax-saver" userId={user.uid}><TaxSaver financialSummary={financialSummary} /></Layout></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><Layout currentPage="ai-chat" userId={user.uid}><AIChat financialSummary={financialSummary} /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout currentPage="profile" userId={user.uid}><Profile /></Layout></ProtectedRoute>} />
      <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
