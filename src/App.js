import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { auth, db } from './firebase/config';
import WelcomePage from './components/WelcomePage';
import Auth from './components/Auth';
import OnboardingFlow from './components/Onboarding';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaxSaver from './components/TaxSaver';
import AIChat from './components/AIChat';
import Profile from './components/Profile';
import AOS from 'aos';
import 'aos/dist/aos.css';

// A component to protect routes that require a user to be fully onboarded
const ProtectedRoute = ({ user, financialSummary, isLoading }) => {
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Loading Zenvana...</div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (!financialSummary) {
    return <Navigate to="/onboarding" replace />;
  }
  // Outlet is a placeholder for the child route (e.g., Dashboard, TaxSaver)
  return <Layout><Outlet /></Layout>;
};

// A component to protect the onboarding route
const OnboardingRoute = ({ user, financialSummary, isLoading, saveFinancialData }) => {
   if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Loading Zenvana...</div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (financialSummary) {
    return <Navigate to="/dashboard" replace />;
  }
  return <OnboardingFlow onSubmit={saveFinancialData} />;
};


function App() {
  const [user, setUser] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setIsLoading(true);
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
  }, []);

  const saveFinancialData = async (data) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated.");
    const dataToSave = { ...data, lastUpdated: new Date().toISOString() };
    try {
      const docRef = doc(db, `users/${currentUser.uid}/financial_data/summary`);
      await setDoc(docRef, dataToSave, { merge: true });
      setFinancialSummary(dataToSave);
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  };

  const handleLoginSuccess = () => {
    // After login, the onAuthStateChanged listener will fire.
    // We check the state there to determine where to navigate.
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        if(authUser) {
            const docRef = doc(db, `users/${authUser.uid}/financial_data/summary`);
            getDoc(docRef).then(docSnap => {
                if (docSnap.exists()) {
                    navigate('/dashboard');
                } else {
                    navigate('/onboarding');
                }
            });
            unsubscribe(); // Unsubscribe after the first check to avoid multiple navigations
        }
    });
  };
  
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth onLoginSuccess={handleLoginSuccess} />} />
      
      {/* Onboarding Route */}
      <Route 
        path="/onboarding" 
        element={<OnboardingRoute user={user} financialSummary={financialSummary} isLoading={isLoading} saveFinancialData={saveFinancialData} />} 
      />
      
      {/* Protected Application Routes */}
      <Route 
        element={<ProtectedRoute user={user} financialSummary={financialSummary} isLoading={isLoading} />}
      >
        <Route path="/dashboard" element={<Dashboard financialSummary={financialSummary} />} />
        <Route path="/tax-saver" element={<TaxSaver financialSummary={financialSummary} />} />
        <Route path="/ai-chat" element={<AIChat financialSummary={financialSummary} />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;