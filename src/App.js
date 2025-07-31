import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// --- Helper Functions & Components ---

const formatIndianCurrency = (num) => {
    if (typeof num !== 'number') {
        num = parseFloat(num || 0);
    }
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return formatter.format(num);
};

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

// --- Welcome Page Component ---
const WelcomePage = ({ onGetStarted }) => {
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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 relative">
      <div className="absolute inset-0 z-0 opacity-10"><div className="absolute top-1/4 left-1/4 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div><div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div><div className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div></div>
      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-7xl md:text-8xl font-extrabold text-white mb-4 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-yellow-300">Welcome to ZENVANA</h1>
        <p className="text-2xl md:text-3xl text-gray-300 mb-10 max-w-3xl">Your AI financial advisor for your financial freedom</p>
        
        <section className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-700 mb-8 max-w-3xl w-full transition-all duration-300 hover:shadow-green-glow">
          <h2 className="text-4xl font-bold text-green-400 mb-4">Our Mission</h2>
          <p className="text-xl text-gray-300 leading-relaxed">We believe financial expertise shouldn't be a luxury. Our mission is to empower every Indian with a personal AI advisor, making financial well-being and peace of mind a reality for all.</p>
        </section>

        <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-gold-glow shadow-lg mb-20">Get Started for Free</button>
        
        <section className="w-full">
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

// --- [NEW] Upgraded AI Chat Component ---
const AIChat = ({ chatHistory, isGeneratingResponse, callChatAPI, financialSummary, setChatHistory }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Set initial welcome message
  useEffect(() => {
    if (chatHistory.length === 0) {
        setChatHistory([{
            role: 'model',
            parts: [{ text: `Namaste, ${financialSummary?.name || 'User'}! I'm your AI financial companion. Ask me anything about your finances, or select one of the suggestions below to get started.` }]
        }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    callChatAPI(chatInput);
    setChatInput('');
  };

  const handlePromptClick = (prompt) => {
    callChatAPI(prompt);
  };

  const generateChatPrompts = () => {
    if (!financialSummary) return [];
    const prompts = [];
    const { healthInsurance, termInsurance, customGoals, debt } = financialSummary;

    if (healthInsurance === 'no') {
        prompts.push("Why is health insurance important in India?");
    }
    if (termInsurance === 'no') {
        prompts.push("Explain term insurance in simple terms.");
    }
    if (customGoals && customGoals.length > 0 && customGoals[0].name) {
        prompts.push(`How can I best invest for my "${customGoals[0].name}" goal?`);
    }
    if (parseFloat(debt || 0) > 0) {
        prompts.push("What's a good strategy to pay off my debt faster?");
    }
    
    // Add a default prompt if no specific conditions are met
    if (prompts.length === 0) {
        prompts.push("How can I increase my savings rate?");
        prompts.push("What are some good investment options for beginners in India?");
    }

    return prompts.slice(0, 3); // Return a max of 3 prompts
  };

  const suggestionPrompts = generateChatPrompts();

  return (
    <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-full min-h-[500px]">
      <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
      <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-700 ml-auto' : 'bg-gray-800 mr-auto'}`}>
            <p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'ZENVANA AI'}</p>
            <MarkdownRenderer text={msg.parts[0].text} />
          </div>
        ))}
        {isGeneratingResponse && (
          <div className="p-3 rounded-xl bg-gray-800 animate-pulse">
            <p>Thinking...</p>
          </div>
        )}
      </div>

      {/* Suggestion Prompts */}
      {!isGeneratingResponse && chatHistory.length <= 2 && (
          <div className="mb-4 flex flex-wrap gap-2">
              {suggestionPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handlePromptClick(prompt)} className="bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 py-2 px-3 rounded-full transition-colors">
                      {prompt}
                  </button>
              ))}
          </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-grow p-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
          disabled={isGeneratingResponse}
        />
        <button
          type="submit"
          className="bg-green-600 font-bold py-3 px-6 rounded-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!chatInput.trim() || isGeneratingResponse}
        >
          Send
        </button>
      </form>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
    </section>
  );
};


// --- Tax Saver Component ---
const TaxSaver = ({ financialSummary, callGroqAPIWithRetry }) => {
    const [taxData, setTaxData] = useState({
        salaryIncome: '',
        otherIncome: '',
        investments80C: '',
        hra: '',
        homeLoanInterest: '',
        medicalInsurance80D: '',
        nps_80ccd1b: '',
        educationLoanInterest_80e: ''
    });
    const [taxResult, setTaxResult] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (financialSummary?.monthlyIncome) {
            const annualIncome = parseFloat(financialSummary.monthlyIncome) * 12;
            setTaxData(prev => ({ ...prev, salaryIncome: annualIncome.toString() }));
        }
    }, [financialSummary]);
    
    if (!financialSummary) { return <div className="text-center p-10">Loading financial data...</div>; }

    const fieldLabels = { salaryIncome: "Annual Salary Income (from Form 16)", otherIncome: "Annual Income from Other Sources (e.g., Interest, Rent)", investments80C: "Total Investments under Section 80C (PPF, ELSS, etc.)", hra: "House Rent Allowance (HRA) Exemption Claimed", homeLoanInterest: "Interest on Home Loan (Section 24)", medicalInsurance80D: "Medical Insurance Premium (Section 80D)", nps_80ccd1b: "NPS Contribution (Section 80CCD(1B))", educationLoanInterest_80e: "Interest on Education Loan (Section 80E)" };
    const handleNumberChange = (e) => { const { name, value } = e.target; setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };
    
    const calculateTax = (taxableIncome, regime) => {
        let tax = 0;
        let slabRate = 0;

        if (regime === 'old') {
            if (taxableIncome <= 500000) { return { tax: 0, slab: "0%" }; }
            if (taxableIncome > 1000000) { tax = 112500 + (taxableIncome - 1000000) * 0.30; slabRate = 30; } 
            else if (taxableIncome > 500000) { tax = 12500 + (taxableIncome - 500000) * 0.20; slabRate = 20; } 
            else if (taxableIncome > 250000) { tax = (taxableIncome - 250000) * 0.05; slabRate = 5; }
        } else { // New Regime (FY 2023-24 / AY 2024-25)
            if (taxableIncome <= 700000) { return { tax: 0, slab: "0%" }; }
            if (taxableIncome > 1500000) { tax = 150000 + (taxableIncome - 1500000) * 0.30; slabRate = 30; } 
            else if (taxableIncome > 1200000) { tax = 90000 + (taxableIncome - 1200000) * 0.20; slabRate = 20; } 
            else if (taxableIncome > 900000) { tax = 45000 + (taxableIncome - 900000) * 0.15; slabRate = 15; } 
            else if (taxableIncome > 600000) { tax = 15000 + (taxableIncome - 600000) * 0.10; slabRate = 10; } 
            else if (taxableIncome > 300000) { tax = (taxableIncome - 300000) * 0.05; slabRate = 5; }
        }
        
        const finalTax = Math.round(tax * 1.04); // 4% cess
        return { tax: finalTax, slab: `${slabRate}%` };
    };

    const handleTaxCalculation = async () => {
        setIsCalculating(true); 
        setAiAnalysis('');
        const gI = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        
        const tI_new = Math.max(0, gI - 50000);
        const { tax: nRT, slab: nRSlab } = calculateTax(tI_new, 'new');

        const tD = (parseFloat(taxData.investments80C || 0) + parseFloat(taxData.hra || 0) + parseFloat(taxData.homeLoanInterest || 0) + parseFloat(taxData.medicalInsurance80D || 0) + parseFloat(taxData.nps_80ccd1b || 0) + parseFloat(taxData.educationLoanInterest_80e || 0));
        const tI_old = Math.max(0, gI - 50000 - tD);
        const { tax: oRT, slab: oRSlab } = calculateTax(tI_old, 'old');

        setTaxResult({ nR: nRT, oR: oRT, bO: nRT < oRT ? 'New' : 'Old', s: Math.abs(nRT - oRT), nRSlab, oRSlab });
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const financialYear = currentDate.getMonth() >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
        
        const prompt = `
You are ZENVANA, an expert AI Tax Advisor for India. Your tone is professional, clear, and actionable. You are providing a tax analysis for the Financial Year ${financialYear}.

**USER & TAX CONTEXT:**
- Name: ${financialSummary.name || 'User'}
- Income Source: ${financialSummary.incomeSource || 'Not specified'}
- Risk Tolerance: ${financialSummary.riskTolerance || 'Not specified'}
- Gross Income Entered: ${formatIndianCurrency(gI)}
- Total Deductions Claimed: ${formatIndianCurrency(tD)}
- Recommended Regime (based on calculation): **${nRT < oRT ? 'New' : 'Old'} Regime**
- Potential Annual Savings: **${formatIndianCurrency(Math.abs(nRT - oRT))}**
- User's Deduction Inputs: ${JSON.stringify(taxData)}

**YOUR TASK:**
Generate a high-quality, personalized tax optimization report in Markdown.

## Namaste ${financialSummary.name}, Here's Your Tax Analysis
Start with a friendly greeting. State the recommended tax regime and the potential savings clearly upfront.

## Detailed Comparison
Provide a clear, side-by-side comparison of the Old vs. New tax regimes using the data provided. Explain *why* one is better in this specific case.

## 💡 Smart Deduction Analysis & Missed Opportunities
This is the most important section. Analyze the "User's Deduction Inputs" provided above.
- For any key deduction field where the user entered 0 or it's empty (e.g., "medicalInsurance80D": "0"), you MUST highlight this as a potential missed opportunity.
- Explain the benefit of that specific deduction. For example, "I noticed you haven't claimed a deduction under Section 80D for medical insurance. You can claim up to ₹25,000 for premiums, which could further reduce your tax."
- If the user has claimed deductions, praise them for it. "Great job utilizing your 80C limit!"

## Personalized Tax-Saving Strategies for Next Year
Based on the user's **income source** and **risk tolerance**, provide 2-3 specific, actionable suggestions to optimize their taxes for the *next* financial year.

## Your Path Forward
End with an empowering statement about taking control of tax planning.`;
        try {
            const result = await callGroqAPIWithRetry(prompt);
            setAiAnalysis(result);
        } catch (e) { 
            setAiAnalysis("My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments.");
        } finally { 
            setIsCalculating(false);
        }
    };
    return ( <section className="p-6 rounded-2xl bg-gray-900"><h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4">{Object.keys(fieldLabels).map((k) => (<div key={k}><label className="block mb-1">{fieldLabels[k]} (₹)</label><input type="text" inputMode="numeric" name={k} value={taxData[k] || ''} onChange={handleNumberChange} className="w-full p-2 rounded bg-gray-800" /></div>))}</div><div><button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl">{isCalculating ? 'Calculating...' : 'Calculate & Analyze'}</button>{taxResult && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Tax Regime Comparison</h3><div className="text-center mb-4 p-3 rounded-lg bg-green-900"><p className="text-lg">The **{taxResult.bO} Regime** is better for you.</p><p className="text-2xl font-extrabold text-green-400">You save {formatIndianCurrency(taxResult.s)}!</p></div><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.oR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.oRSlab}</p></div><div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.nR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.nRSlab}</p></div></div></div>)}{aiAnalysis && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI's Advice</h3><MarkdownRenderer text={aiAnalysis} /></div>)}</div></div></section> );
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
          <Tooltip contentStyle={{ backgroundColor: '#1F2B37', borderColor: '#374151', color: '#F9FAFB' }} formatter={(value) => `${formatIndianCurrency(value)}`} />
          <Legend wrapperStyle={{ color: '#D1D5DB' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Zenvana Insights Component ---
const ZenvanaInsights = ({ financialSummary, callGroqAPIWithRetry }) => {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const generateInsights = async () => {
            if (!financialSummary) return;
            setIsLoading(true);
            setError(null);

            const {
                name, monthlyIncome, expenses, debt, termInsurance, healthInsurance,
                customGoals, riskTolerance, financialWorry
            } = financialSummary;

            const totalMonthlyExpenses = Object.values(expenses || {}).reduce((sum, value) => sum + parseFloat(value || 0), 0);
            const monthlySavings = parseFloat(monthlyIncome || 0) - totalMonthlyExpenses;
            const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
            const emergencyFundTarget = totalMonthlyExpenses * 6;

            const prompt = `
You are ZENVANA, a top-tier AI financial advisor for India. Your analysis must be sharp, empathetic, and actionable.
Your task is to analyze the following user profile and generate the top 3 most critical financial insights.

**USER PROFILE:**
- Name: ${name}
- Monthly Income: ${formatIndianCurrency(monthlyIncome)}
- Total Monthly Expenses: ${formatIndianCurrency(totalMonthlyExpenses)}
- Monthly Savings: ${formatIndianCurrency(monthlySavings)} (Savings Rate: ${savingsRate.toFixed(1)}%)
- Ideal Emergency Fund (6x Expenses): ${formatIndianCurrency(emergencyFundTarget)}
- Total Debt: ${formatIndianCurrency(debt || 0)}
- Term Life Insurance: ${termInsurance}
- Health Insurance: ${healthInsurance}
- Financial Goals: ${customGoals?.length > 0 ? customGoals.map(g => g.name).join(', ') : 'None'}
- Risk Tolerance: ${riskTolerance}
- Biggest Worry: "${financialWorry}"

**ANALYSIS HIERARCHY (Address in this order of priority):**
1.  **Safety Net (Critical):** Check for missing Health or Term Insurance. This is the #1 priority. An inadequate emergency fund (less than 3 months of expenses covered by net worth) is also critical.
2.  **Debt Management:** High-cost debt (assume any debt is high-cost for this analysis) is the next priority.
3.  **Savings & Investments:** A low savings rate (< 15%) is a major concern.
4.  **Opportunities & Kudos:** Identify areas for improvement or acknowledge good habits.

**YOUR TASK:**
Respond with a JSON array containing exactly 3 insight objects. Do not add any text outside the JSON.
Each object must have three properties: "type" ("alert", "opportunity", or "kudos"), "title" (a short, catchy headline), and "description" (a 1-2 sentence explanation in simple, encouraging language).

Example JSON structure:
[
  {"type": "alert", "title": "Critical: No Health Insurance", "description": "A medical emergency is the biggest risk to your financial stability. Securing a health plan for yourself and your family should be your #1 priority."},
  {"type": "opportunity", "title": "Boost Your Savings", "description": "Your savings rate is a bit low. Let's explore ways to trim expenses so you can invest more towards your goals."},
  {"type": "kudos", "title": "Great Goal Setting!", "description": "It's fantastic that you've set clear financial goals. This is the first step towards achieving them."}
]
`;
            try {
                const result = await callGroqAPIWithRetry(prompt);
                const jsonMatch = result.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsedInsights = JSON.parse(jsonMatch[0]);
                    setInsights(parsedInsights);
                } else {
                    throw new Error("AI did not return valid JSON.");
                }
            } catch (err) {
                console.error("Error generating insights:", err);
                setError("Could not generate AI insights at this time. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        generateInsights();
    }, [financialSummary, callGroqAPIWithRetry]);

    const InsightCard = ({ insight }) => {
        const config = {
            alert: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
                borderColor: 'border-red-500',
                shadowColor: 'hover:shadow-red-glow'
            },
            opportunity: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
                borderColor: 'border-yellow-500',
                shadowColor: 'hover:shadow-yellow-glow'
            },
            kudos: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-2.7 5.4M7 14h6M7 17h6m-6-3h6" /></svg>,
                borderColor: 'border-green-500',
                shadowColor: 'hover:shadow-green-glow'
            }
        };
        const { icon, borderColor, shadowColor } = config[insight.type] || config.opportunity;

        return (
            <div className={`bg-gray-800 p-5 rounded-2xl border-l-4 ${borderColor} ${shadowColor} transition-shadow duration-300 flex items-start space-x-4`}>
                <div className="flex-shrink-0">{icon}</div>
                <div>
                    <h4 className="font-bold text-lg text-white">{insight.title}</h4>
                    <p className="text-gray-300">{insight.description}</p>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
             <div className="bg-gray-800 p-5 rounded-2xl text-center">
                <p className="text-gray-400 animate-pulse">Zenvana AI is analyzing your profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900 bg-opacity-50 p-5 rounded-2xl text-center">
                <p className="text-red-300">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Namaste, {financialSummary.name}! Here's Your Financial Snapshot.</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                ))}
            </div>
        </div>
    );
};


// --- [NEW] Simplified Dashboard Component ---
const Dashboard = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [isCalculatingHealth, setIsCalculatingHealth] = useState(true);
  const [improvementPlan, setImprovementPlan] = useState('');
  const [isGeneratingImprovement, setIsGeneratingImprovement] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({});
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({});

  const tME = Object.values(financialSummary?.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
  const mS = (financialSummary?.monthlyIncome || 0) - tME;
  const sR = financialSummary?.monthlyIncome > 0 ? ((mS / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;

  useEffect(() => {
    const handleCalculateHealthScore = async () => {
      if (!financialSummary) return;
      setIsCalculatingHealth(true);
      const prompt = `
You are ZENVANA, an AI financial analyst. Your task is to calculate a Financial Health Score (out of 100) based on Indian context.
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
          const result = await callGroqAPIWithRetry(prompt);
          const jsonMatch = result.match(/{[\s\S]*}/);
          if (jsonMatch) {
            const parsedResult = JSON.parse(jsonMatch[0]);
            setHealthScore(parsedResult.score);
          } else {
             setHealthScore(0);
          }
      } catch (e) {
          console.error("Failed to calculate health score:", e);
          setHealthScore(0);
      } finally {
          setIsCalculatingHealth(false);
      }
    };
    handleCalculateHealthScore();
  }, [financialSummary, callGroqAPIWithRetry, sR]);

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

  const cGP = (g) => { if (!g.targetAmount) return null; const tA = parseFloat(g.targetAmount); const aS = parseFloat(g.amountSaved || 0); const p = Math.min(100, (aS / tA) * 100); return { p: p.toFixed(2), s: p >= 100 ? 'Achieved!' : 'On Track' }; };
  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };
  const formatDate = (dateString) => { if (!dateString) return 'N/A'; const options = { year: 'numeric', month: 'short', day: 'numeric' }; return new Date(dateString).toLocaleDateString('en-IN', options); };

  const handleGenerateImprovementPlan = async () => {
    setIsGeneratingImprovement(true);
    setImprovementPlan('');
    const prompt = `
You are ZENVANA, an AI financial advisor for an Indian user. The user has a financial health score of ${healthScore}/100 and wants to improve it.
**USER PROFILE:**
- Savings Rate: ${sR.toFixed(2)}%
- Debt: ${formatIndianCurrency(financialSummary.debt || 0)}
- Insurance: Term Life: ${financialSummary.termInsurance}, Health: ${financialSummary.healthInsurance}
- Top Financial Worry: "${financialSummary.financialWorry}"
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
        const result = await callGroqAPIWithRetry(prompt);
        setImprovementPlan(result);
    } catch (e) {
        setImprovementPlan("My apologies, Zenvana AI could not create a plan right now. Please try again.");
    } finally {
        setIsGeneratingImprovement(false);
    }
  };
  
  const handleGenerateGoalPlan = async (g, i) => {
    setIsGeneratingGoalPlan(p => ({ ...p, [i]: true }));
    const prompt = `
You are ZENVANA, an expert AI financial advisor for an Indian user. Your tone is strategic, clear, and encouraging.
**User & Goal Context:**
- User's Name: ${financialSummary.name || 'User'}
- User's Risk Tolerance: ${financialSummary.riskTolerance || 'not specified'}
- Monthly Surplus (Income - Expenses): ${formatIndianCurrency(mS)}
- Goal: Achieve "${g.name}"
- Target Amount: ${formatIndianCurrency(g.targetAmount)}
- Amount Already Saved: ${formatIndianCurrency(g.amountSaved || 0)}
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
        const result = await callGroqAPIWithRetry(prompt);
        setGoalPlanResults(p => ({ ...p, [i]: result }));
    } catch (e) {
        setGoalPlanResults(p => ({ ...p, [i]: `My apologies, Zenvana AI is currently experiencing high traffic.` }));
    } finally {
        setIsGeneratingGoalPlan(p => ({ ...p, [i]: false }));
    }
  };

  return (
    <section className="space-y-8">
      <ZenvanaInsights financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Main Content Column --- */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Financial Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Net Worth</span><span className="font-bold text-3xl text-white mt-1">{formatIndianCurrency(financialSummary.netWorth)}</span></div>
              <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Income</span><span className="font-bold text-3xl text-green-400 mt-1">{formatIndianCurrency(financialSummary.monthlyIncome)}</span></div>
              <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Expenses</span><span className="font-bold text-3xl text-yellow-400 mt-1">{formatIndianCurrency(tME)}</span></div>
              <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Savings</span><span className="font-bold text-3xl text-green-400 mt-1">{formatIndianCurrency(mS)}</span></div>
              <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Savings Rate</span><span className={`font-bold text-3xl mt-1 ${sR < 0 ? 'text-red-500' : 'text-green-400'}`}>{sR.toFixed(2)}%</span></div>
              <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Risk Tolerance</span><span className="font-bold text-3xl text-white mt-1 capitalize">{financialSummary.riskTolerance || 'N/A'}</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Goals</h3>
            {financialSummary.customGoals?.some(g => g.name) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {financialSummary.customGoals.map((g, i) => {
                  const pr = cGP(g);
                  return pr ? (
                    <div key={i} className="bg-gray-800 p-5 rounded-xl">
                      <div className="flex justify-between items-start mb-3"><h4 className="font-semibold text-xl text-white">{g.name}</h4><div className="text-right"><p className="text-sm text-gray-400">Target</p><p className="font-bold text-lg text-white">{formatIndianCurrency(g.targetAmount)}</p></div></div>
                      <div className="flex justify-between items-center text-sm text-gray-400 mb-2"><span>Progress</span><div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>By {formatDate(g.targetDate)}</span></div></div>
                      <div className="w-full bg-gray-700 rounded-full h-4 mb-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${pr.p}%` }}></div></div>
                      <p className="text-sm text-right text-gray-300">Saved: {formatIndianCurrency(g.amountSaved || 0)} <span className="text-green-400">({pr.s})</span></p>
                      <button onClick={() => handleGenerateGoalPlan(g, i)} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-xl transition-colors" disabled={isGeneratingGoalPlan[i]}>
                          {isGeneratingGoalPlan[i] ? 'Generating Plan...' : 'Generate AI Plan'}
                      </button>
                      {goalPlanResults[i] && (<div className="mt-4 p-3 bg-gray-900 rounded-xl"><MarkdownRenderer text={goalPlanResults[i]} /></div>)}
                    </div>
                  ) : null;
                })}
              </div>
            ) : (<div className="bg-gray-800 p-5 rounded-xl text-center text-gray-400">You haven't set any financial goals yet.</div>)}
          </div>
        </div>

        {/* --- Side Column --- */}
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">Financial Health Score</h3>
                <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center">
                  {isCalculatingHealth ? (
                    <div className="text-gray-400">Calculating...</div>
                  ) : (
                    <>
                      <div className={`relative w-40 h-40 flex items-center justify-center`}>
                          <svg className="absolute w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)">
                              <circle className="text-gray-700" cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"></circle>
                              <circle className={`${getScoreColor(healthScore).replace('text-', 'stroke-')}`} strokeDasharray={`${healthScore || 0}, 100`} cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" strokeLinecap="round"></circle>
                          </svg>
                          <div className={`text-5xl font-extrabold ${getScoreColor(healthScore)}`}>
                              {healthScore !== null ? healthScore : '--'}
                          </div>
                      </div>
                      <p className="text-gray-400 mt-4 mb-4 text-center">This score reflects your current financial standing.</p>
                      <button onClick={handleGenerateImprovementPlan} className="w-full max-w-sm bg-green-600 font-bold py-3 rounded-xl" disabled={isGeneratingImprovement}>
                        {isGeneratingImprovement ? 'Generating Plan...' : 'Get AI Plan to Improve'}
                      </button>
                    </>
                  )}
                  {improvementPlan && <div className="mt-4 p-3 bg-gray-900 rounded-xl w-full"><MarkdownRenderer text={improvementPlan} /></div>}
                </div>
            </div>
             <div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">Expense Breakdown</h3>
                <ExpensePieChart expenses={financialSummary.expenses} />
            </div>
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
              if (docSnap.exists()) { 
                  setFinancialSummary(docSnap.data());
                  setCurrentPage('dashboard');
              } else {
                  // If no data, but user is logged in, maybe they are new
                  setCurrentPage('onboarding');
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
      setCurrentPage('dashboard'); // Navigate to dashboard after saving
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
    const systemInstruction = `You are ZENVANA, an expert AI financial advisor for India. Your primary goal is to provide helpful, safe, and accurate financial advice. You MUST ONLY answer questions related to personal finance, economics, investing, budgeting, and money-related topics in an Indian context. If the user asks an off-topic question, you MUST politely decline by saying: "As ZENVANA, your AI financial companion, my expertise is focused on helping you with your financial questions. How can I assist you with your finances today?" Do not answer the off-topic question. Here is the user's financial profile for context, use it to personalize your answers: ${JSON.stringify(financialSummary, null, 2)}`;
    
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
      setFinancialSummary(null); setChatHistory([]); setUserId(null); setIsAuthReady(false); setCurrentPage('welcome');
    } catch (error) { console.error("Logout error:", error); }
  };
  
  if (!isAuthReady) { return (<div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Loading...</div>); }
  const navToOnboard = () => { setCurrentPage(financialSummary ? 'dashboard' : 'onboarding'); };
  
  const renderPage = () => {
    switch(currentPage) {
        case 'welcome':
            return <WelcomePage onGetStarted={navToOnboard} />;
        case 'onboarding':
            return <OnboardingFlow onSubmit={saveFinancialData} initialData={financialSummary} isSubmitting={isSubmitting} />;
        case 'dashboard':
        case 'taxSaver':
        case 'aiChat':
            return (
                <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
                  {currentPage === 'dashboard' && financialSummary && (<Dashboard financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />)}
                  {currentPage === 'taxSaver' && financialSummary && (<TaxSaver financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />)}
                  {currentPage === 'aiChat' && financialSummary && (<AIChat chatHistory={chatHistory} setChatHistory={setChatHistory} callChatAPI={callChatAPI} isGeneratingResponse={isGeneratingResponse} financialSummary={financialSummary} />)}
                </Layout>
            );
        default:
            return <WelcomePage onGetStarted={navToOnboard} />;
    }
  }

  return (
    <div>
      {renderPage()}
    </div>
  );
}

export default App;
