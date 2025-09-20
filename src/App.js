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
          if (location.pathname === '/' || location.pathname === '/auth') {
            navigate('/dashboard');
          }
        } else {
          setFinancialSummary(null);
          if (location.pathname === '/' || location.pathname === '/auth') {
            navigate('/onboarding');
          }
        }
      } else {
        setUser(null);
        setFinancialSummary(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location]);

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

  const handleAuthRedirect = (destination) => {
    if (user) {
      if (financialSummary) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/auth');
    }
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
      <Route path="/" element={<WelcomePage onGetStarted={handleAuthRedirect} />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={user && !financialSummary ? <OnboardingFlow onSubmit={saveFinancialData} /> : <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Access Denied</div>} />
      <Route path="/dashboard" element={user && financialSummary ? <Layout currentPage="dashboard" userId={user.uid}><Dashboard financialSummary={financialSummary} /></Layout> : <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Access Denied</div>} />
      <Route path="/tax-saver" element={user && financialSummary ? <Layout currentPage="tax-saver" userId={user.uid}><TaxSaver financialSummary={financialSummary} /></Layout> : <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Access Denied</div>} />
      <Route path="/ai-chat" element={user && financialSummary ? <Layout currentPage="ai-chat" userId={user.uid}><AIChat financialSummary={financialSummary} /></Layout> : <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Access Denied</div>} />
      <Route path="/profile" element={user ? <Layout currentPage="profile" userId={user.uid}><Profile /></Layout> : <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Access Denied</div>} />
      <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;
