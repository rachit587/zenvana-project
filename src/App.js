import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';

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

// --- Markdown Renderer Component ---
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  const renderInlineFormatting = (line) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) { return <strong key={i} className="font-bold text-white">{part}</strong>; }
      return <span key={i}>{part}</span>;
    });
  };
  const elements = text.split('\n').map((line, index) => {
    if (line.startsWith('### ')) { return <h3 key={index} className="text-xl font-bold my-2 text-gray-200">{renderInlineFormatting(line.substring(4))}</h3>; }
    if (line.startsWith('## ')) { return <h2 key={index} className="text-2xl font-bold my-3 text-yellow-400">{renderInlineFormatting(line.substring(3))}</h2>; }
    if (line.startsWith('# ')) { return <h1 key={index} className="text-3xl font-bold my-4 text-green-400">{renderInlineFormatting(line.substring(2))}</h1>; }
    if (line.startsWith('- ')) { return <li key={index} className="ml-5 list-disc">{renderInlineFormatting(line.substring(2))}</li>; }
    if (line.trim() !== '') { return <p key={index} className="my-1">{renderInlineFormatting(line)}</p>; }
    return null;
  });
  return <div className="text-gray-300">{elements}</div>;
};

// --- Layout Component ---
const Layout = ({ children, userId, onNavigate, currentPage, handleLogout }) => (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 to-gray-900 font-sans text-gray-100">
      <nav className="w-64 bg-gray-900 shadow-lg p-6 flex flex-col rounded-r-3xl transition-all duration-300 ease-in-out transform hover:shadow-2xl">
        <div className="mb-10 text-center"><h2 className="text-4xl font-extrabold text-green-400 drop-shadow-md">ZENVANA</h2>
          {userId && (<p className="text-xs text-gray-400 mt-2">User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-300 break-all">{userId}</span></p>)}
        </div>
        <ul className="space-y-4 flex-grow">
          <li><button onClick={() => onNavigate('dashboard')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:text-green-400 ${currentPage === 'dashboard' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300 hover:text-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>Dashboard</button></li>
          <li><button onClick={() => onNavigate('taxSaver')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:text-green-400 ${currentPage === 'taxSaver' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300 hover:text-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1l-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Tax Saver</button></li>
          <li><button onClick={() => onNavigate('aiChat')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:text-green-400 ${currentPage === 'aiChat' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300 hover:text-gray-100'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>AI Chat</button></li>
        </ul>
        <div className="mt-auto pt-8"><button onClick={handleLogout} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg">Logout & Start Over</button></div>
      </nav>
      <main className="flex-grow p-8 overflow-auto">{children}</main>
    </div>
);

// --- Welcome Page Component (NEW & IMPROVED V2) ---
const WelcomePage = ({ onGetStarted }) => {
  useEffect(() => { AOS.init({ duration: 1000, once: true }); }, []);

  const FeatureCard = ({ icon, title, children }) => (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 text-left transition-all duration-300 hover:border-green-400 hover:shadow-green-glow hover:-translate-y-2">
      <div className="flex items-center mb-4">
        {icon}
        <h3 className="text-2xl font-bold text-green-400">{title}</h3>
      </div>
      <p className="text-gray-300">{children}</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10"><div className="absolute top-1/4 left-1/4 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div><div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div><div className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div></div>
      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto px-4">
        <h1 data-aos="fade-down" className="text-7xl md:text-8xl font-extrabold text-white mb-4 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-yellow-300">Welcome to ZENVANA</h1>
        <p data-aos="fade-up" className="text-2xl md:text-3xl text-gray-300 mb-10 max-w-3xl">Your AI financial advisor for your financial freedom</p>
        
        <section data-aos="fade-up" data-aos-delay="200" className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-700 mb-8 max-w-3xl w-full transition-all duration-300 hover:shadow-green-glow">
          <h2 className="text-4xl font-bold text-green-400 mb-4">Our Mission</h2>
          <p className="text-xl text-gray-300 leading-relaxed">We believe financial expertise shouldn't be a luxury. Our mission is to empower every Indian with a personal AI advisor, making financial well-being and peace of mind a reality for all.</p>
        </section>

        <button data-aos="zoom-in" data-aos-delay="400" onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-gold-glow shadow-lg mb-20">Get Started for Free</button>
        
        <section data-aos="fade-up" data-aos-delay="600" className="w-full">
            <h2 className="text-5xl font-bold text-yellow-400 mb-12">All The Tools You Need. Powered by AI.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    title="Health Score"
                >
                    Get your free, real-time Financial Health Score to understand your standing at a glance and receive a personalized plan to improve it.
                </FeatureCard>
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                    title="Tax Saver"
                >
                    Our interactive AI tool compares tax regimes and analyzes your income to find every possible saving for you.
                </FeatureCard>
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                    title="AI Mentor"
                >
                    Your personal AI finance expert, ready 24/7 to answer any question, from complex investment queries to simple budgeting tips.
                </FeatureCard>
                <FeatureCard 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    title="Dashboard"
                >
                    A single, clear view of your entire financial life—net worth, expenses, savings, and goals—all in one place.
                </FeatureCard>
            </div>
        </section>

        <footer className="text-gray-400 text-md mt-20">Made with ❤️ by Rachit Banthia</footer>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite cubic-bezier(0.6, 0.01, 0.3, 0.9); }
        .shadow-gold-glow { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6); }
        .shadow-green-glow { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
      ` }} />
    </div>
  );
};

// --- Onboarding Components ---
const OnboardingStep1 = ({ formData, handleChange, nextStep }) => {
    const today = new Date().toISOString().split('T')[0];
    return (
      <div data-aos="fade-in">
        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Welcome to ZENVANA!</h3>
        <p className="text-lg text-gray-400 mb-8 text-center">Let's start with your personal details.</p>
        <div className="space-y-6">
          <div><label htmlFor="name" className="block text-gray-300 text-lg font-semibold mb-2">Your Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., Ananya Sharma" required /></div>
          <div><label htmlFor="dateOfBirth" className="block text-gray-300 text-lg font-semibold mb-2">Your Date of Birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} min="1925-01-01" className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" required /></div>
          <button onClick={nextStep} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-4 px-8 rounded-xl text-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl">Next</button>
        </div>
      </div>
    );
};
const OnboardingStep2 = ({ formData, handleChange, nextStep, prevStep }) => (
  <div data-aos="fade-in">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Financial Foundation</h3>
    <p className="text-lg text-gray-400 mb-8 text-center">Let's look at your financial overview.</p>
    <div className="space-y-6">
      <div>
        <label htmlFor="monthlyIncome" className="block text-gray-300 text-lg font-semibold mb-2">Average Monthly Take-Home Income (₹)</label>
        <input type="text" inputMode="numeric" id="monthlyIncome" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., 50000" required />
        <p className="text-xs text-gray-400 mt-1">💡 Enter your monthly income after all deductions like tax and PF.</p>
      </div>
      <div>
        <label htmlFor="netWorth" className="block text-gray-300 text-lg font-semibold mb-2">Current Net Worth (₹)</label>
        <input type="text" inputMode="numeric" id="netWorth" name="netWorth" value={formData.netWorth} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., 500000" />
        <p className="text-xs text-gray-400 mt-1">💡 Your Net Worth = Total Assets (e.g., savings, investments) - Total Liabilities (e.g., loans, credit card debt).</p>
      </div>
       <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition">Next</button></div>
    </div>
  </div>
);
const OnboardingStep3 = ({ formData, setFormData, nextStep, prevStep }) => {
  const expenseCategories = [{ name: 'housing', label: 'Housing (Rent/EMI)' }, { name: 'food', label: 'Food' }, { name: 'transportation', label: 'Transportation' }, { name: 'utilities', label: 'Utilities' }, { name: 'entertainment', label: 'Entertainment' }, { name: 'healthcare', label: 'Healthcare' }, { name: 'personalCare', label: 'Personal Care' }, { name: 'education', label: 'Education' }, { name: 'debtPayments', label: 'Debt Payments' }, { name: 'miscellaneous', label: 'Miscellaneous' }];
  const handleExpenseChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, expenses: { ...prev.expenses, [name]: value.replace(/[^0-9]/g, '') } })); };
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Monthly Expenses</h3>
      <div className="space-y-4">{expenseCategories.map(c => (<div key={c.name}><label htmlFor={c.name} className="block text-gray-300 font-semibold mb-1">{c.label} (₹)</label><input type="text" inputMode="numeric" id={c.name} name={c.name} value={formData.expenses?.[c.name] || ''} onChange={handleExpenseChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white" placeholder="0" /></div>))}</div>
      <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl">Next</button></div>
    </div>
  );
};
const OnboardingStep4 = ({ formData, setFormData, nextStep, prevStep }) => {
  const today = new Date().toISOString().split('T')[0];
  const handleGoalChange = (index, e) => { const { name, value } = e.target; const newGoals = [...formData.customGoals]; newGoals[index] = { ...newGoals[index], [name]: name === 'name' ? value : value.replace(/[^0-9-]/g, '') }; setFormData(p => ({ ...p, customGoals: newGoals })); };
  const addGoal = () => setFormData(p => ({ ...p, customGoals: [...p.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
  const removeGoal = (index) => setFormData(p => ({ ...p, customGoals: p.customGoals.filter((_, i) => i !== index) }));
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Your Financial Goals</h3>
      <div className="space-y-6">{formData.customGoals.map((goal, index) => (<div key={index} className="bg-gray-700 p-4 rounded-xl border border-gray-600">
          <div className="flex justify-between items-center mb-3"><label className="font-semibold">Goal {index + 1}</label>{formData.customGoals.length > 1 && (<button type="button" onClick={() => removeGoal(index)} className="text-red-400 text-sm">Remove</button>)}</div>
          <label className="block mt-2">Goal Name</label><input type="text" name="name" value={goal.name || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
          <label className="block mt-2">Target Amount (₹)</label><input type="text" inputMode="numeric" name="targetAmount" value={goal.targetAmount || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
          <label className="block mt-2">Amount Saved (₹)</label><input type="text" inputMode="numeric" name="amountSaved" value={goal.amountSaved || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
          <label className="block mt-2">Target Date</label><input type="date" name="targetDate" value={goal.targetDate || ''} min={today} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
      </div>))}
      <button type="button" onClick={addGoal} className="w-full bg-green-700 font-bold py-2 px-4 rounded-xl">+ Add Goal</button></div>
      <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl">Next</button></div>
    </div>
  );
};
const OnboardingStep5 = ({ formData, handleChange, prevStep, handleSubmit, isSubmitting }) => (
  <div data-aos="fade-in">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">The Complete Picture</h3>
    <p className="text-lg text-gray-400 mb-8 text-center">Just a few more details for hyper-personalized advice.</p>
    <div className="space-y-6">
      <div><label className="block text-lg font-semibold mb-2">What is your primary source of income?</label><select name="incomeSource" value={formData.incomeSource} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="salaried">Salaried</option><option value="self_employed">Self-Employed / Business</option><option value="freelancer">Freelancer</option><option value="other">Other</option></select></div>
      <div><label className="block text-lg font-semibold mb-2">What is your risk tolerance for investments?</label><select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="low">Low: I prioritize safety over high returns.</option><option value="medium">Medium: I'm comfortable with balanced risk for moderate growth.</option><option value="high">High: I'm willing to take higher risks for potentially higher returns.</option></select></div>
      <div><label className="block text-lg font-semibold mb-2">What is your single biggest financial worry right now?</label><select name="financialWorry" value={formData.financialWorry} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="retirement">Saving enough for retirement</option><option value="debt">Getting out of debt</option><option value="taxes">High taxes</option><option value="investing">Not knowing where to invest</option><option value="expenses">Managing daily expenses</option></select></div>
      <div><label className="block text-lg font-semibold mt-4 mb-2">Current Investments</label><textarea name="currentInvestments" value={formData.currentInvestments} onChange={handleChange} rows="3" className="w-full p-3 border rounded-xl bg-gray-800" placeholder="e.g., Stocks, Mutual Funds, FD, Gold..."></textarea><p className="text-xs text-gray-400 mt-1">💡 The more detail, the better our portfolio analysis will be.</p></div>
      <div><label className="block text-lg font-semibold mt-4 mb-2">Number of Dependents</label><input type="text" inputMode="numeric" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800" placeholder="e.g., 0, 1, 2" /></div>
      <div><label className="block text-lg font-semibold mt-4 mb-2">Total Outstanding Debt (₹)</label><input type="text" inputMode="numeric" name="debt" value={formData.debt} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800" placeholder="e.g., 150000" /><p className="text-xs text-gray-400 mt-1">💡 Include home loans, personal loans, credit card balances, etc.</p></div>
      <div><label className="block text-lg font-semibold mb-2">Do you have a Term Life Insurance plan?</label><select name="termInsurance" value={formData.termInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option><option value="not_sure">Not Sure</option></select></div>
      <div><label className="block text-lg font-semibold mb-2">Do you have a separate Health Insurance plan?</label><select name="healthInsurance" value={formData.healthInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option><option value="not_sure">Not Sure</option></select></div>
    </div>
    <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-8 text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
        </button>
    </div>
  </div>
);
const OnboardingFlow = ({ onSubmit, initialData, isSubmitting }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || { name: '', dateOfBirth: '', monthlyIncome: '', netWorth: '', expenses: {}, customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }], incomeSource: '', riskTolerance: '', financialWorry: '', currentInvestments: '', dependents: '', debt: '', termInsurance: '', healthInsurance: '' });
  const handleChange = (e) => { const { name, value } = e.target; const nF = ['monthlyIncome', 'netWorth', 'dependents', 'debt']; setFormData(p => ({ ...p, [name]: nF.includes(name) ? value.replace(/[^0-9]/g, '') : value })); };
  const nextStep = () => setCurrentStep(p => p + 1);
  const prevStep = () => setCurrentStep(p => p - 1);
  const handleSubmit = () => {
      const tME = Object.values(formData.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
      onSubmit({ ...formData, monthlyExpenses: tME });
  };
  useEffect(() => { AOS.init({ duration: 600, once: true }); }, [currentStep]);
  return ( <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100"> <div className="bg-gray-900 bg-opacity-80 p-8 rounded-3xl shadow-2xl border-gray-800 max-w-3xl w-full"> {currentStep === 1 && (<OnboardingStep1 formData={formData} handleChange={handleChange} nextStep={nextStep} />)} {currentStep === 2 && (<OnboardingStep2 formData={formData} handleChange={handleChange} nextStep={nextStep} prevStep={prevStep} />)} {currentStep === 3 && (<OnboardingStep3 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)} {currentStep === 4 && (<OnboardingStep4 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)} {currentStep === 5 && (<OnboardingStep5 formData={formData} handleChange={handleChange} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />)} </div> </div> );
};

// --- AI Chat Component ---
const AIChat = ({ chatHistory, isGeneratingResponse, callChatAPI }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);
  useEffect(() => { if (chatHistoryRef.current) { chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; } }, [chatHistory]);
  const handleSendMessage = (e) => { e.preventDefault(); if (chatInput.trim() === '') return; callChatAPI(chatInput); setChatInput(''); };
  return ( <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-full min-h-[500px]"> <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2> <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">{chatHistory.map((msg, i) => (<div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-700 ml-auto' : 'bg-gray-800 mr-auto'}`}><p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'ZENVANA AI'}</p>{msg.role === 'user' ? <p>{msg.parts[0].text}</p> : <MarkdownRenderer text={msg.parts[0].text} />}</div>))} {isGeneratingResponse && (<div className="p-3 rounded-xl bg-gray-800 animate-pulse"><p>Thinking...</p></div>)}</div> <form onSubmit={handleSendMessage} className="flex gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about your finances..." className="flex-grow p-3 rounded-xl bg-gray-800" disabled={isGeneratingResponse} /><button type="submit" className="bg-green-600 font-bold py-3 px-6 rounded-xl" disabled={!chatInput.trim() || isGeneratingResponse}>Send</button></form> <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style> </section> );
};

// --- Tax Saver Component ---
const TaxSaver = ({ financialSummary, callGeminiAPIWithRetry }) => {
    const [taxData, setTaxData] = useState({});
    const [taxResult, setTaxResult] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    if (!financialSummary) { return <div className="text-center p-10">Loading financial data...</div>; }
    const fieldLabels = { salaryIncome: "Annual Salary Income (from Form 16)", otherIncome: "Annual Income from Other Sources (e.g., Interest, Rent)", investments80C: "Total Investments under Section 80C (PPF, ELSS, etc.)", hra: "House Rent Allowance (HRA) Exemption Claimed", homeLoanInterest: "Interest on Home Loan (Section 24)", medicalInsurance80D: "Medical Insurance Premium (Section 80D)", nps_80ccd1b: "NPS Contribution (Section 80CCD(1B))", educationLoanInterest_80e: "Interest on Education Loan (Section 80E)" };
    const handleNumberChange = (e) => { const { name, value } = e.target; setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };
    const calculateTax = (taxableIncome, isOldRegime) => { let tax = 0; let taxSlab = '0%'; const slabs = isOldRegime ? [{ l: 1000000, r: 0.30, b: 112500 }, { l: 500000, r: 0.20, b: 12500 }] : [{ l: 1500000, r: 0.30, b: 150000 }, { l: 1200000, r: 0.20, b: 90000 }, { l: 900000, r: 0.15, b: 45000 }, { l: 600000, r: 0.10, b: 15000 }]; for (const s of slabs) { if (taxableIncome > s.l) { tax = s.b + (taxableIncome - s.l) * s.r; taxSlab = `${s.r * 100}%`; break; } } return { tax: Math.round(tax * 1.04), slab: taxSlab }; };
    const handleTaxCalculation = async () => {
        setIsCalculating(true); 
        setAiAnalysis('');
        const gI = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        const tI_new = Math.max(0, gI - 50000);
        const { tax: nRT, slab: nRSlab } = calculateTax(tI_new, false);
        const tD = (parseFloat(taxData.investments80C || 0) + parseFloat(taxData.hra || 0) + parseFloat(taxData.homeLoanInterest || 0) + parseFloat(taxData.medicalInsurance80D || 0) + parseFloat(taxData.nps_80ccd1b || 0) + parseFloat(taxData.educationLoanInterest_80e || 0));
        const tI_old = Math.max(0, gI - 50000 - tD);
        const { tax: oRT, slab: oRSlab } = calculateTax(tI_old, true);
        setTaxResult({ nR: nRT, oR: oRT, bO: nRT < oRT ? 'New' : 'Old', s: Math.abs(nRT - oRT), nRSlab, oRSlab });
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const financialYear = currentDate.getMonth() >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
        const prompt = `
You are ZENVANA, an expert AI Tax Advisor for India. Your tone is professional, clear, and actionable.
Analysis for Financial Year ${financialYear}.

**User & Tax Context:**
- Name: ${financialSummary.name || 'User'}
- Income Source: ${financialSummary.incomeSource || 'Not specified'}
- Risk Tolerance: ${financialSummary.riskTolerance || 'Not specified'}
- Gross Income Entered: ₹${gI.toLocaleString('en-IN')}
- Total Deductions Entered: ₹${tD.toLocaleString('en-IN')}
- Recommended Regime (based on calculation): **${nRT < oRT ? 'New' : 'Old'} Regime**
- Potential Annual Savings: **₹${Math.abs(nRT - oRT).toLocaleString('en-IN')}**

**Your Task:** Generate a high-quality, personalized tax optimization report in Markdown.

## Namaste ${financialSummary.name}, Here's Your Tax Analysis
Start with a friendly greeting. State the recommended tax regime and the potential savings clearly upfront.

## Detailed Comparison
Provide a clear, side-by-side comparison of the Old vs. New tax regimes using the data provided. Explain *why* one is better in this specific case.

## Personalized Tax-Saving Strategies for Next Year
Based on the user's **income source** and **risk tolerance**, provide 2-3 specific, actionable suggestions to optimize their taxes for the *next* financial year.
- **If Salaried:** Suggest maximizing HRA, LTA, and standard deduction. Mention NPS for additional 80CCD(1B) benefits.
- **If Self-Employed/Freelancer:** Suggest claiming all eligible business expenses (e.g., rent, internet, travel). Mention the presumptive taxation scheme (Section 44ADA) if applicable.
- **Based on Risk Tolerance:**
  - **Low Risk:** Suggest PPF or Tax-saving FDs for 80C.
  - **High Risk:** Suggest ELSS mutual funds for 80C, highlighting the potential for higher returns and the 3-year lock-in.

## Your Path Forward
End with an empowering statement about taking control of tax planning.`;
        try {
            const result = await callGeminiAPIWithRetry(prompt);
            setAiAnalysis(result);
        } catch (e) { 
            setAiAnalysis("My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments.");
        } finally { 
            setIsCalculating(false);
        }
    };
    return ( <section className="p-6 rounded-2xl bg-gray-900"><h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4">{Object.keys(fieldLabels).map((k) => (<div key={k}><label className="block mb-1">{fieldLabels[k]} (₹)</label><input type="text" inputMode="numeric" name={k} value={taxData[k] || ''} onChange={handleNumberChange} className="w-full p-2 rounded bg-gray-800" /></div>))}</div><div><button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl">{isCalculating ? 'Calculating...' : 'Calculate & Analyze'}</button>{taxResult && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Tax Regime Comparison</h3><div className="text-center mb-4 p-3 rounded-lg bg-green-900"><p className="text-lg">The **{taxResult.bO} Regime** is better for you.</p><p className="text-2xl font-extrabold text-green-400">You save ₹{taxResult.s.toLocaleString()}!</p></div><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">₹{taxResult.oR.toLocaleString()}</p><p className="text-sm text-gray-400">Tax Slab: {taxResult.oRSlab}</p></div><div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">₹{taxResult.nR.toLocaleString()}</p><p className="text-sm text-gray-400">Tax Slab: {taxResult.nRSlab}</p></div></div></div>)}{aiAnalysis && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI's Advice</h3><MarkdownRenderer text={aiAnalysis} /></div>)}</div></div></section> );
};

// --- Expense Pie Chart Component ---
const ExpensePieChart = ({ expenses }) => {
  const chartData = Object.entries(expenses || {}).map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: parseFloat(value || 0) })).filter(item => item.value > 0);
  const COLORS = ['#10B981', '#FBBF24', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F59E0B', '#6366F1', '#D946EF'];
  if (chartData.length === 0) { return ( <div className="bg-gray-800 p-5 rounded-xl flex items-center justify-center h-full min-h-[300px]"><p className="text-gray-400">No expense data to display.</p></div> ); }
  return (
    <div className="bg-gray-800 p-5 rounded-xl h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1F2B37', borderColor: '#374151', color: '#F9FAFB' }} formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
          <Legend wrapperStyle={{ color: '#D1D5DB' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ financialSummary, callGeminiAPIWithRetry }) => {
  // --- All Hooks must be at the top level ---
  const [budgetAnalysisResult, setBudgetAnalysisResult] = useState('');
  const [isAnalyzingBudget, setIsAnalyzingBudget] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({});
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({});
  const [healthScore, setHealthScore] = useState(null);
  const [isCalculatingHealth, setIsCalculatingHealth] = useState(true);
  const [improvementPlan, setImprovementPlan] = useState('');
  const [isGeneratingImprovement, setIsGeneratingImprovement] = useState(false);
  const [emergencyFundPlan, setEmergencyFundPlan] = useState('');
  const [isPlanningEmergency, setIsPlanningEmergency] = useState(false);

  // --- Calculations ---
  const tME = Object.values(financialSummary.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
  const mS = (financialSummary.monthlyIncome || 0) - tME;
  const sR = financialSummary.monthlyIncome > 0 ? ((mS / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;

  // --- useEffect for Health Score Calculation ---
  useEffect(() => {
    // This function is defined inside useEffect to capture the correct state
    const handleCalculateHealthScore = async () => {
      if (!financialSummary) return; // Guard clause
      setIsCalculatingHealth(true);
      const prompt = `
You are ZENVANA, an AI financial analyst. Your task is to calculate a Financial Health Score (out of 100).
**USER DATA:**
- Savings Rate: ${sR.toFixed(2)}%
- Debt-to-Income Ratio (approximated): ${financialSummary.monthlyIncome > 0 ? ((parseFloat(financialSummary.debt || 0) / (parseFloat(financialSummary.monthlyIncome) * 12)) * 100).toFixed(2) : 0}%
- Term Life Insurance: ${financialSummary.termInsurance}
- Health Insurance: ${financialSummary.healthInsurance}
- Has Financial Goals: ${financialSummary.customGoals?.some(g => g.name) ? 'Yes' : 'No'}
**SCORING LOGIC (out of 100):**
- **Savings Rate (40 points):** A rate >= 30% gets 40 pts. 20%-29% gets 30 pts. 10%-19% gets 20 pts. 0%-9% gets 10 pts. A negative rate gets 0 pts.
- **Debt Level (20 points):** DTI < 30% = 20 pts. DTI 30-50% = 10 pts. DTI > 50% = 0 pts.
- **Life Insurance (15 points):** 'yes' = 15 pts. 'not_sure' = 5 pts. 'no' = 0 pts.
- **Health Insurance (15 points):** 'yes' = 15 pts. 'not_sure' = 5 pts. 'no' = 0 pts.
- **Goal Setting (10 points):** 'yes' = 10 pts. 'no' = 0 pts.
**YOUR TASK:**
1. Calculate the final score based on the logic.
2. Respond ONLY in this JSON format: {"score": <calculated_score>}`;
      try {
          const result = await callGeminiAPIWithRetry(prompt);
          const parsedResult = JSON.parse(result);
          setHealthScore(parsedResult.score);
      } catch (e) {
          console.error("Failed to calculate health score:", e);
          setHealthScore(0);
      } finally {
          setIsCalculatingHealth(false);
      }
    };
    handleCalculateHealthScore();
  }, [financialSummary, callGeminiAPIWithRetry, sR]);

  // --- Conditional Return for Loading State ---
  if (!financialSummary) { 
    return ( 
      <section className="p-8 rounded-2xl bg-gray-900 bg-opacity-80">
        <h2 className="text-4xl font-bold text-green-400 mb-6">Welcome!</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-lg">Loading your financial dashboard...</p>
        </div>
      </section> 
    ); 
  }

  // --- Helper Functions ---
  const cGP = (g) => { if (!g.targetAmount) return null; const tA = parseFloat(g.targetAmount); const aS = parseFloat(g.amountSaved || 0); const p = Math.min(100, (aS / tA) * 100); return { p: p.toFixed(2), s: p >= 100 ? 'Achieved!' : 'On Track' }; };
  const formatOptionText = (option) => {
    if (!option) return 'Not Specified';
    const map = { 'salaried': 'Salaried', 'self_employed': 'Self-Employed / Business', 'freelancer': 'Freelancer', 'other': 'Other', 'low': 'Low (Prioritizes safety)', 'medium': 'Medium (Balanced approach)', 'high': 'High (Seeks higher returns)', 'retirement': 'Saving enough for retirement', 'debt': 'Getting out of debt', 'taxes': 'High taxes', 'investing': 'Not knowing where to invest', 'expenses': 'Managing daily expenses', 'yes': 'Yes', 'no': 'No', 'not_sure': 'Not Sure' };
    return map[option] || option.charAt(0).toUpperCase() + option.slice(1);
  };
  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };

  // --- AI API Call Handlers ---
  const handleGenerateImprovementPlan = async () => {
    setIsGeneratingImprovement(true);
    setImprovementPlan('');
    const prompt = `
You are ZENVANA, an AI financial advisor. The user has a financial health score of ${healthScore}/100 and wants to improve it.
**USER PROFILE:**
- Savings Rate: ${sR.toFixed(2)}%
- Debt: ₹${parseFloat(financialSummary.debt || 0).toLocaleString('en-IN')}
- Insurance: Term Life: ${formatOptionText(financialSummary.termInsurance)}, Health: ${formatOptionText(financialSummary.healthInsurance)}
- Top Financial Worry: "${formatOptionText(financialSummary.financialWorry)}"
**YOUR TASK:**
Provide a detailed, medium-length explanation in Markdown on how to improve their financial health score. Focus on the 2-3 most impactful areas. Structure your response with clear headings and actionable steps.
## Your Path to a Better Score
Start with an encouraging sentence.
## Priority 1: [Identify the biggest weakness, e.g., Boost Your Savings Rate]
Explain *why* this is important. Provide 2-3 practical, actionable tips. For example, if savings are low, suggest the "pay yourself first" method or trimming a specific high-expense category.
## Priority 2: [Identify the second biggest weakness, e.g., Strengthen Your Safety Net]
Explain the importance of this area (e.g., insurance or debt reduction). Provide clear next steps, like "Research term insurance plans online this weekend" or "Consider the 'snowball' method to start paying down your smallest debt."
## Your Next Step
End with a single, simple call to action for the user to take today.`;
    try {
        const result = await callGeminiAPIWithRetry(prompt);
        setImprovementPlan(result);
    } catch (e) {
        setImprovementPlan("My apologies, Zenvana AI could not create a plan right now. Please try again.");
    } finally {
        setIsGeneratingImprovement(false);
    }
  };
  const handleAnalyzeBudget = async () => {
    setIsAnalyzingBudget(true); setBudgetAnalysisResult('');
    const userAge = financialSummary.dateOfBirth ? (new Date().getFullYear() - new Date(financialSummary.dateOfBirth).getFullYear()) : 'N/A';
    const prompt = `
You are ZENVANA, an elite AI financial advisor for India. Your tone is empathetic, professional, and deeply insightful.
**USER PROFILE SUMMARY**
- Name: ${financialSummary.name || 'User'}, Age: ${userAge}
- Income Source: ${formatOptionText(financialSummary.incomeSource)}
- Monthly Income: ₹${parseFloat(financialSummary.monthlyIncome || 0).toLocaleString('en-IN')} (Savings Rate: ${sR.toFixed(2)}%)
- Top Financial Worry: "${formatOptionText(financialSummary.financialWorry)}"
- Insurance: Term Life: ${formatOptionText(financialSummary.termInsurance)}, Health: ${formatOptionText(financialSummary.healthInsurance)}
**YOUR TASK: Generate a comprehensive financial health analysis in Markdown.**
**STRUCTURE:**
## Namaste ${financialSummary.name}, Here Is Your Financial Health Analysis!
Start with a warm greeting and summarize their situation, highlighting their savings rate.
## 💡 Key Observation & Insight
Identify the SINGLE most important insight from their profile. Explain why it's critical.
## 🎯 Addressing Your Top Worry: "${formatOptionText(financialSummary.financialWorry)}"
Directly address their biggest concern with one clear, actionable first step.
## 🛡️ Risk Management Check
Provide CRITICAL advice based on their insurance status. Praise them if covered, or gently urge them to get quotes if not.
## 📊 Expense Deep Dive & Optimization
Analyze their top 2 spending categories from: ${JSON.stringify(financialSummary.expenses)}. Provide ONE specific optimization tip.
## 🚀 Your Path Forward
End with an empowering statement.`;
    try { const result = await callGeminiAPIWithRetry(prompt); setBudgetAnalysisResult(result); } 
    catch (e) { setBudgetAnalysisResult("My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments."); } 
    finally { setIsAnalyzingBudget(false); }
  };
  const handleGenerateEmergencyPlan = async () => {
    setIsPlanningEmergency(true); setEmergencyFundPlan('');
    const targetFund = tME * 6;
    const prompt = `
You are ZENVANA, an AI financial planner.
**USER CONTEXT:**
- Monthly Expenses: ₹${tME.toLocaleString('en-IN')}
- Ideal Emergency Fund (6x monthly expenses): ₹${targetFund.toLocaleString('en-IN')}
- Monthly Savings/Surplus: ₹${mS.toLocaleString('en-IN')}
**YOUR TASK:** Create a simple, actionable emergency fund plan in Markdown.
## Your Emergency Fund Plan
State the target fund size clearly.
## Recommended Action
- If their monthly surplus (₹${mS}) is positive, suggest they allocate a specific portion of it (e.g., 25% or 50%) towards this fund each month.
- Calculate how many months it would take to reach the goal with this allocation.
- Suggest safe places to keep this money, like a high-yield savings account or a liquid mutual fund.
## Why It Matters
Briefly explain that an emergency fund is the #1 defense against financial shocks.`;
    try {
        const result = await callGeminiAPIWithRetry(prompt);
        setEmergencyFundPlan(result);
    } catch (e) {
        setEmergencyFundPlan("My apologies, Zenvana AI could not create a plan right now. Please try again.");
    } finally {
        setIsPlanningEmergency(false);
    }
  };
  const handleGenerateGoalPlan = async (g, i) => {
    setIsGeneratingGoalPlan(p => ({ ...p, [i]: true }));
    const prompt = `
You are ZENVANA, an expert AI financial advisor. Your tone is strategic, clear, and encouraging.
**User & Goal Context:**
- User's Name: ${financialSummary.name || 'User'}
- User's Risk Tolerance: ${financialSummary.riskTolerance || 'not specified'}
- Monthly Surplus (Income - Expenses): ₹${mS.toLocaleString('en-IN')}
- Goal: Achieve "${g.name}"
- Target Amount: ₹${parseFloat(g.targetAmount).toLocaleString('en-IN')}
- Amount Already Saved: ₹${parseFloat(g.amountSaved || 0).toLocaleString('en-IN')}
- Target Date: ${formatDate(g.targetDate)}
**Your Task:**
Create a personalized, actionable, and structured investment plan in Markdown.
## Investment Plan for: ${g.name}
Start with an encouraging sentence.
## Current Status & Required Investment
- Calculate the remaining amount needed.
- Calculate the number of months until the target date.
- Calculate the required monthly investment (SIP) to reach the goal. State this clearly.
## Recommended Investment Strategy
Based on the user's risk tolerance and the goal's timeline, recommend 1-2 specific types of investments (e.g., RD, Debt Fund, Hybrid Fund, Equity Fund). Explain *why* for each. Do not recommend specific stocks or fund names.
## Next Steps
Provide a clear, 2-step action plan (e.g., Research on a platform, Automate with SIP).`;
    try {
        const result = await callGeminiAPIWithRetry(prompt);
        setGoalPlanResults(p => ({ ...p, [i]: result }));
    } catch (e) {
        setGoalPlanResults(p => ({ ...p, [i]: `My apologies, Zenvana AI is currently experiencing high traffic.` }));
    } finally {
        setIsGeneratingGoalPlan(p => ({ ...p, [i]: false }));
    }
  };
  const formatDate = (dateString) => { if (!dateString) return 'N/A'; const options = { year: 'numeric', month: 'short', day: 'numeric' }; return new Date(dateString).toLocaleDateString('en-IN', options); };

  // --- JSX Render ---
  return (
    <section className="p-8 rounded-2xl bg-gray-900 bg-opacity-80 space-y-8">
      <h2 className="text-4xl font-bold text-green-400">Welcome, <span className="text-yellow-400">{financialSummary.name || 'User'}!</span></h2>
      
      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">Your Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Net Worth</span><span className="font-bold text-3xl text-white mt-1">₹{parseFloat(financialSummary.netWorth || 0).toLocaleString('en-IN')}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Income</span><span className="font-bold text-3xl text-green-400 mt-1">₹{parseFloat(financialSummary.monthlyIncome || 0).toLocaleString('en-IN')}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Expenses</span><span className="font-bold text-3xl text-yellow-400 mt-1">₹{tME.toLocaleString('en-IN')}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Savings</span><span className="font-bold text-3xl text-green-400 mt-1">₹{mS.toLocaleString('en-IN')}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Savings Rate</span><span className={`font-bold text-3xl mt-1 ${sR < 0 ? 'text-red-500' : 'text-green-400'}`}>{sR.toFixed(2)}%</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Risk Tolerance</span><span className="font-bold text-3xl text-white mt-1 capitalize">{financialSummary.riskTolerance || 'N/A'}</span></div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">Your Financial Health Score</h3>
        <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center">
          {isCalculatingHealth ? (
            <div className="text-gray-400">Calculating your score...</div>
          ) : (
            <>
              <div className={`relative w-48 h-48 flex items-center justify-center`}>
                  <svg className="absolute w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)">
                      <circle className="text-gray-700" cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"></circle>
                      <circle className={`${getScoreColor(healthScore).replace('text-', 'stroke-')}`} strokeDasharray={`${healthScore || 0}, 100`} cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" strokeLinecap="round"></circle>
                  </svg>
                  <div className={`text-5xl font-extrabold ${getScoreColor(healthScore)}`}>
                      {healthScore !== null ? healthScore : '--'}
                  </div>
              </div>
              <p className="text-gray-400 mt-4 mb-4">This score reflects your current financial health.</p>
              <button onClick={handleGenerateImprovementPlan} className="w-full max-w-sm bg-green-600 font-bold py-3 rounded-xl" disabled={isGeneratingImprovement}>
                {isGeneratingImprovement ? 'Generating Plan...' : 'Get AI Plan to Improve'}
              </button>
            </>
          )}
          {improvementPlan && <div className="mt-4 p-3 bg-gray-900 rounded-xl w-full"><MarkdownRenderer text={improvementPlan} /></div>}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">Expense Breakdown</h3>
        <ExpensePieChart expenses={financialSummary.expenses} />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">Emergency Fund Planner</h3>
        <div className="bg-gray-800 p-5 rounded-xl">
            <p className="text-center text-gray-300 mb-2">Your ideal emergency fund is 6 months of expenses:</p>
            <p className="text-center text-4xl font-bold text-green-400 mb-4">₹{(tME * 6).toLocaleString('en-IN')}</p>
            <button onClick={handleGenerateEmergencyPlan} className="w-full bg-green-600 font-bold py-3 rounded-xl" disabled={isPlanningEmergency}>
              {isPlanningEmergency ? 'Planning...' : 'Create My AI Savings Plan'}
            </button>
          {emergencyFundPlan && <div className="mt-4 p-3 bg-gray-900 rounded-xl"><MarkdownRenderer text={emergencyFundPlan} /></div>}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">Your Goals</h3>
        {financialSummary.customGoals?.some(g => g.name) ? (
          <div className="space-y-4">
            {financialSummary.customGoals.map((g, i) => {
              const pr = cGP(g);
              return pr ? (
                <div key={i} className="bg-gray-800 p-5 rounded-xl">
                  <div className="flex justify-between items-start mb-3"><h4 className="font-semibold text-xl text-white">{g.name}</h4><div className="text-right"><p className="text-sm text-gray-400">Target</p><p className="font-bold text-lg text-white">₹{parseFloat(g.targetAmount).toLocaleString('en-IN')}</p></div></div>
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-2"><span>Progress</span><div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>By {formatDate(g.targetDate)}</span></div></div>
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${pr.p}%` }}></div></div>
                  <p className="text-sm text-right text-gray-300">Saved: ₹{parseFloat(g.amountSaved || 0).toLocaleString('en-IN')} <span className="text-green-400">({pr.s})</span></p>
                  <button onClick={() => handleGenerateGoalPlan(g, i)} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-xl transition-colors" disabled={isGeneratingGoalPlan[i]}>
                      {isGeneratingGoalPlan[i] ? 'Generating Plan...' : 'Generate AI Plan'}
                  </button>
                  {goalPlanResults[i] && (<div className="mt-4 p-3 bg-gray-900 rounded-xl"><MarkdownRenderer text={goalPlanResults[i]} /></div>)}
                </div>
              ) : null;
            })}
          </div>
        ) : (<p className="text-center text-gray-400 p-4">You haven't set any financial goals yet.</p>)}
      </div>

      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-3">Detailed Financial Analysis</h3>
        <div className="bg-gray-800 p-5 rounded-xl">
          <button onClick={handleAnalyzeBudget} className="w-full bg-green-600 font-bold py-3 rounded-xl" disabled={isAnalyzingBudget}>
            {isAnalyzingBudget ? 'Analyzing...' : 'Get Detailed Financial Analysis'}
          </button>
          {budgetAnalysisResult && <div className="mt-4 p-3 bg-gray-900 rounded-xl"><MarkdownRenderer text={budgetAnalysisResult} /></div>}
        </div>
      </div>
    </section>
  );
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
              if (docSnap.exists()) { setFinancialSummary(docSnap.data()); }
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
  
  const saveFinancialData = async (data) => {
    if (!db || !userId) { console.error("Save aborted: Firebase not ready"); throw new Error("Firebase not ready"); }
    setIsSubmitting(true);
    try {
      const docRef = doc(db, `users/${userId}/financial_data/summary`);
      const expensesParsed = {};
      for (const key in data.expenses) { expensesParsed[key] = parseFloat(data.expenses[key] || 0); }
      const dataToSave = { ...data, expenses: expensesParsed, lastUpdated: new Date().toISOString() };
      await setDoc(docRef, dataToSave, { merge: true });
      setFinancialSummary(dataToSave);
    } catch (error) {
      console.error("!!! Critical Error saving data:", error);
      setIsSubmitting(false);
      throw error;
    } 
  };

  useEffect(() => {
    if (financialSummary && currentPage === 'onboarding') {
      setCurrentPage('dashboard');
      setIsSubmitting(false);
    }
  }, [financialSummary, currentPage]);
  
  const callGroqAPIWithRetry = async (prompt, retries = 1, delay = 3000) => {
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
  };

  const callChatAPI = async (userMessage) => {
    setIsGeneratingResponse(true);
    const systemInstruction = `You are ZENVANA, an expert AI financial advisor for India. Your primary goal is to provide helpful, safe, and accurate financial advice. You MUST ONLY answer questions related to personal finance, economics, investing, budgeting, and money-related topics. If the user asks an off-topic question, you MUST politely decline by saying: "As ZENVANA, your AI financial companion, my expertise is focused on helping you with your financial questions. How can I assist you with your finances today?" Do not answer the off-topic question. Here is the user's financial profile for context, use it to personalize your answers: ${JSON.stringify(financialSummary, null, 2)}`;
    const currentChat = [...chatHistory, { role: "user", content: userMessage }];
    setChatHistory(currentChat);

    const messagesForAPI = [
      { role: "system", content: systemInstruction },
      ...currentChat.slice(-10).map(m => ({ role: m.role, content: m.content }))
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
        setChatHistory(prev => [...prev, { role: "assistant", content: result.choices[0].message.content }]);
      } else { throw new Error("Invalid response from AI."); }
    } catch (error) { 
      setChatHistory(prev => [...prev, { role: "assistant", content: "My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments." }]); 
    } finally { 
      setIsGeneratingResponse(false);
    }
  };

  const handleLogout = async () => {
    if (!auth || !db || !userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/financial_data/summary`));
      await signOut(auth);
      setFinancialSummary(null); setChatHistory([]); setUserId(null); setIsAuthReady(false); setCurrentPage('welcome');
    } catch (error) { console.error("Logout error:", error); }
  };
  
  if (!isAuthReady) { return (<div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Loading...</div>); }
  const navToOnboard = () => { setCurrentPage(financialSummary ? 'dashboard' : 'onboarding'); };
  
  return (
    <div>
      {currentPage === 'welcome' && <WelcomePage onGetStarted={navToOnboard} />}
      {currentPage === 'onboarding' && <OnboardingFlow onSubmit={saveFinancialData} initialData={financialSummary} isSubmitting={isSubmitting} />}
      {currentPage !== 'welcome' && currentPage !== 'onboarding' && (
        <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
          {currentPage === 'dashboard' && (<Dashboard financialSummary={financialSummary} callGeminiAPIWithRetry={callGroqAPIWithRetry} />)}
          {currentPage === 'taxSaver' && (<TaxSaver financialSummary={financialSummary} callGeminiAPIWithRetry={callGroqAPIWithRetry} />)}
          {currentPage === 'aiChat' && (<AIChat chatHistory={chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] }))} callChatAPI={callChatAPI} isGeneratingResponse={isGeneratingResponse} />)}
        </Layout>
      )}
    </div>
  );
}

export default App;
