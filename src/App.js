// src/App.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * IMPORTANT:
 * - All AI calls are now routed through /.netlify/functions/aiRouter (server-side),
 *   which uses GROQ for short/snappy answers and OpenAI for longer/strategic ones.
 * - Your onboarding data (profile) is automatically sent to the function as "profile"
 *   so responses are hyper-personalized with NO UI changes.
 */

const wait = (ms) => new Promise(res => setTimeout(res, ms));

/* ---------- Firebase (v1 config retained) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyDjN0_LU5WEtCNLNryPIUjavIJAOXghCCQ",
  authDomain: "zenvana-web.firebaseapp.com",
  projectId: "zenvana-web",
  storageBucket: "zenvana-web.appspot.com",
  messagingSenderId: "783039988566",
  appId: "1:783039988566:web:6e8948d86341d4805eccf7",
  measurementId: "G-TVZF4SK0YG"
};

/* ---------- Helpers ---------- */
const formatIndianCurrency = (num) => {
  if (typeof num !== 'number') num = parseFloat(num || 0);
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
  return formatter.format(num);
};
const getAge = (dateString) => {
  if (!dateString) return 30;
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  const renderInlineFormatting = (line) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : <span key={i}>{part}</span>));
  };
  const elements = text.split('\n').map((line, idx) => {
    if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold my-2 text-gray-200">{renderInlineFormatting(line.substring(4))}</h3>;
    if (line.startsWith('## '))  return <h2 key={idx} className="text-2xl font-bold my-3 text-yellow-400">{renderInlineFormatting(line.substring(3))}</h2>;
    if (line.startsWith('# '))   return <h1 key={idx} className="text-3xl font-bold my-4 text-green-400">{renderInlineFormatting(line.substring(2))}</h1>;
    if (line.startsWith('- '))   return <li key={idx} className="ml-5 list-disc">{renderInlineFormatting(line.substring(2))}</li>;
    if (line.trim() !== '')      return <p key={idx} className="my-1">{renderInlineFormatting(line)}</p>;
    return null;
  });
  return <div className="text-gray-300">{elements}</div>;
};

/* ---------- Layout ---------- */
const Layout = ({ children, userId, onNavigate, currentPage, handleLogout }) => (
  <div className="min-h-screen flex bg-gradient-to-br from-gray-950 to-gray-900 font-sans text-gray-100">
    <nav className="w-64 bg-gray-900 shadow-lg p-6 flex flex-col rounded-r-3xl transition-all duration-300 ease-in-out transform hover:shadow-2xl">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-green-400 drop-shadow-md">ZENVANA</h2>
        {userId && (<p className="text-xs text-gray-400 mt-2">User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-300 break-all">{userId}</span></p>)}
      </div>
      <ul className="space-y-4 flex-grow">
        <li><button onClick={() => onNavigate('dashboard')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-gray-700 hover:text-green-400 ${currentPage === 'dashboard' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300'}`}>🏠 Dashboard</button></li>
        <li><button onClick={() => onNavigate('taxSaver')}  className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-gray-700 hover:text-green-400 ${currentPage === 'taxSaver' ?  'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300'}`}>💸 Tax Saver</button></li>
        <li><button onClick={() => onNavigate('aiChat')}    className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-gray-700 hover:text-green-400 ${currentPage === 'aiChat' ?    'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300'}`}>🤖 AI Chat</button></li>
      </ul>
      <div className="mt-auto pt-8">
        <button onClick={handleLogout} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition">Logout & Start Over</button>
      </div>
    </nav>
    <main className="flex-grow p-8 overflow-auto">{children}</main>
  </div>
);

/* ---------- Welcome / Marketing ---------- */
const WelcomePage = ({ onGetStarted }) => {
  const FeatureCard = ({ icon, title, children }) => (
    <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 text-left transition-all duration-300 hover:border-green-400 hover:-translate-y-2">
      <div className="flex items-center mb-4">{icon}<h3 className="text-2xl font-bold text-green-400">{title}</h3></div>
      <p className="text-gray-300">{children}</p>
    </div>
  );
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 relative">
      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-7xl md:text-8xl font-extrabold text-white mb-4 drop-shadow-lg">Welcome to ZENVANA</h1>
        <p className="text-2xl md:text-3xl text-gray-300 mb-10 max-w-3xl">Your AI financial advisor for your financial freedom</p>
        <section className="bg-gray-800 bg-opacity-70 p-8 rounded-3xl shadow-2xl border border-gray-700 mb-8 max-w-3xl w-full">
          <h2 className="text-4xl font-bold text-green-400 mb-4">Our Mission</h2>
          <p className="text-xl text-gray-300">We believe financial expertise shouldn't be a luxury. Our mission is to empower every Indian with a personal AI advisor.</p>
        </section>
        <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl transition">Get Started for Free</button>
        <section className="w-full mt-16">
          <h2 className="text-5xl font-bold text-yellow-400 mb-12">All The Tools You Need. Powered by AI.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon={<span className="h-8 w-8 mr-3 text-green-400">🟩</span>} title="Health Score">Real-time financial health and a plan to improve it.</FeatureCard>
            <FeatureCard icon={<span className="h-8 w-8 mr-3 text-green-400">🧾</span>} title="Tax Saver">Compare regimes and find every legal saving.</FeatureCard>
            <FeatureCard icon={<span className="h-8 w-8 mr-3 text-green-400">🤖</span>} title="AI Mentor">24/7 answers from an Indian finance expert.</FeatureCard>
            <FeatureCard icon={<span className="h-8 w-8 mr-3 text-green-400">📊</span>} title="Dashboard">One clean view of net worth, savings, and goals.</FeatureCard>
          </div>
        </section>
        <footer className="text-gray-400 text-md mt-20">Made with ❤️ by Rachit Banthia</footer>
      </div>
    </div>
  );
};

/* ---------- Onboarding (v1 UI retained) ---------- */
const OnboardingStep1 = ({ formData, handleChange, nextStep }) => {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 1: Personal Details</h3>
      <div className="space-y-6">
        <div><label htmlFor="name" className="block text-gray-300 text-lg font-semibold mb-2">Your Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white" placeholder="e.g., Ananya Sharma" required /></div>
        <div><label htmlFor="dateOfBirth" className="block text-gray-300 text-lg font-semibold mb-2">Your Date of Birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} min="1925-01-01" className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white" required /></div>
        <div><label htmlFor="maritalStatus" className="block text-gray-300 text-lg font-semibold mb-2">Marital Status</label>
          <select name="maritalStatus" id="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white"><option value="">Select one</option><option value="single">Single</option><option value="married">Married</option></select>
        </div>
        <div><label htmlFor="dependents" className="block text-gray-300 text-lg font-semibold mb-2">Number of Dependents</label><input type="text" inputMode="numeric" id="dependents" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white" placeholder="0, 1, 2" /></div>
        <button onClick={nextStep} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-xl">Next</button>
      </div>
    </div>
  );
};

const OnboardingStep2 = ({ formData, setFormData, nextStep, prevStep }) => {
  const expenseCategories = [
    { name: 'housing', label: 'Housing (Rent/EMI)' }, { name: 'food', label: 'Food' }, { name: 'transportation', label: 'Transportation' }, { name: 'utilities', label: 'Utilities' }, { name: 'entertainment', label: 'Entertainment' }, { name: 'healthcare', label: 'Healthcare' }, { name: 'personalCare', label: 'Personal Care' }, { name: 'education', label: 'Education' }, { name: 'debtPayments', label: 'Debt Payments' }, { name: 'miscellaneous', label: 'Miscellaneous' }
  ];
  const handleExpenseChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, expenses: { ...prev.expenses, [name]: value.replace(/[^0-9]/g, '') } })); };
  const handleIncomeChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 2: Your Cash Flow</h3>
      <div className="space-y-6">
        <div>
          <label htmlFor="monthlyIncome" className="block text-gray-300 text-lg font-semibold mb-2">Average Monthly Take-Home Income (₹)</label>
          <input type="text" inputMode="numeric" id="monthlyIncome" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleIncomeChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white" placeholder="50000" required />
        </div>
        <div>
          <h4 className="text-gray-300 text-lg font-semibold mb-2">Your Average Monthly Expenses (₹)</h4>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {expenseCategories.map(c => (
              <div key={c.name} className="grid grid-cols-2 items-center gap-4">
                <label htmlFor={c.name} className="text-gray-300 font-semibold">{c.label}</label>
                <input type="text" inputMode="numeric" id={c.name} name={c.name} value={formData.expenses?.[c.name] || ''} onChange={handleExpenseChange} className="p-2 border border-gray-700 rounded-lg bg-gray-900 text-white" placeholder="0" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-gray-700 text-white font-bold py-3 px-6 rounded-xl">Previous</button>
        <button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl">Next</button>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
    </div>
  );
};

const OnboardingStep3 = ({ formData, setFormData, nextStep, prevStep }) => {
  const handleNestedChange = (e, parent, child) => { const { value } = e.target; setFormData(p => ({ ...p, [parent]: { ...p[parent], [child]: value.replace(/[^0-9]/g, '') } })); };
  const handleFieldChange = (e) => { const { name, value } = e.target; setFormData(p => ({...p, [name]: value.replace(/[^0-9]/g, '') })); };
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 3: Your Financial Snapshot</h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-xl font-bold text-yellow-400 mb-3">Your Assets (What you own)</h4>
          <div className="space-y-4">
            <div><label className="block text-lg font-semibold mb-1">Emergency Fund (₹)</label><input type="text" inputMode="numeric" name="emergencyFund" value={formData.emergencyFund} onChange={handleFieldChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
            <div><label className="block text-lg font-semibold mb-1">Equity Investments (₹)</label><input type="text" inputMode="numeric" value={formData.investments.equity} onChange={(e) => handleNestedChange(e, 'investments', 'equity')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
            <div><label className="block text-lg font-semibold mb-1">Debt Investments (₹)</label><input type="text" inputMode="numeric" value={formData.investments.debt} onChange={(e) => handleNestedChange(e, 'investments', 'debt')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
            <div><label className="block text-lg font-semibold mb-1">Real Estate (₹)</label><input type="text" inputMode="numeric" value={formData.investments.realEstate} onChange={(e) => handleNestedChange(e, 'investments', 'realEstate')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
            <div><label className="block text-lg font-semibold mb-1">Gold & Others (₹)</label><input type="text" inputMode="numeric" value={formData.investments.gold} onChange={(e) => handleNestedChange(e, 'investments', 'gold')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
          </div>
        </div>
        <div>
          <h4 className="text-xl font-bold text-yellow-400 mb-3">Your Liabilities (What you owe)</h4>
          <div className="space-y-4">
            <div><label className="block text-lg font-semibold mb-1">High-Interest Debt (₹)</label><input type="text" inputMode="numeric" value={formData.liabilities.highInterest} onChange={(e) => handleNestedChange(e, 'liabilities', 'highInterest')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
            <div><label className="block text-lg font-semibold mb-1">Low-Interest Debt (₹)</label><input type="text" inputMode="numeric" value={formData.liabilities.lowInterest} onChange={(e) => handleNestedChange(e, 'liabilities', 'lowInterest')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-gray-700 text-white font-bold py-3 px-6 rounded-xl">Previous</button>
        <button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl">Next</button>
      </div>
    </div>
  );
};

const OnboardingStep4 = ({ formData, handleChange, nextStep, prevStep }) => (
  <div data-aos="fade-in">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 4: Your Safety Net & Strategy</h3>
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-semibold mb-2">Do you have a separate Health Insurance plan?</label>
        <select name="healthInsurance" value={formData.healthInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800">
          <option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option>
        </select>
      </div>
      {formData.healthInsurance === 'yes' && (
        <div><label className="block text-lg font-semibold mb-1">Health Insurance Coverage (₹)</label><input type="text" inputMode="numeric" name="healthInsuranceCoverage" value={formData.healthInsuranceCoverage} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="500000" /></div>
      )}
      <div>
        <label className="block text-lg font-semibold mb-2">Do you have a Term Life Insurance plan?</label>
        <select name="termInsurance" value={formData.termInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800">
          <option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option>
        </select>
      </div>
      {formData.termInsurance === 'yes' && (
        <div><label className="block text-lg font-semibold mb-1">Term Insurance Coverage (₹)</label><input type="text" inputMode="numeric" name="termInsuranceCoverage" value={formData.termInsuranceCoverage} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="10000000" /></div>
      )}
      <div>
        <label className="block text-lg font-semibold mb-2">Risk tolerance for investments?</label>
        <select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800">
          <option value="">Select one</option>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="block text-lg font-semibold mb-2">Single biggest financial worry?</label>
        <select name="financialWorry" value={formData.financialWorry} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800">
          <option value="">Select one</option>
          <option value="retirement">Saving enough for retirement</option>
          <option value="debt">Getting out of debt</option>
          <option value="taxes">High taxes</option>
          <option value="investing">Not knowing where to invest</option>
          <option value="expenses">Managing daily expenses</option>
        </select>
      </div>
    </div>
    <div className="flex justify-between mt-8">
      <button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button>
      <button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl">Next</button>
    </div>
  </div>
);

const OnboardingStep5 = ({ formData, setFormData, prevStep, handleSubmit, isSubmitting }) => {
  const today = new Date().toISOString().split('T')[0];
  const handleGoalChange = (index, e) => {
    const { name, value } = e.target;
    const newGoals = [...formData.customGoals];
    newGoals[index] = { ...newGoals[index], [name]: name === 'name' ? value : value.replace(/[^0-9-]/g, '') };
    setFormData(p => ({ ...p, customGoals: newGoals }));
  };
  const addGoal = () => setFormData(p => ({ ...p, customGoals: [...p.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
  const removeGoal = (index) => setFormData(p => ({ ...p, customGoals: p.customGoals.filter((_, i) => i !== index) }));
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 5: Your Financial Goals</h3>
      <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {formData.customGoals.map((goal, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-xl border border-gray-600">
            <div className="flex justify-between items-center mb-3"><label className="font-semibold">Goal {index + 1}</label>{formData.customGoals.length > 1 && (<button type="button" onClick={() => removeGoal(index)} className="text-red-400 text-sm">Remove</button>)}</div>
            <label className="block mt-2">Goal Name</label><input type="text" name="name" value={goal.name || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" placeholder="Retirement, Buy a Car"/>
            <label className="block mt-2">Target Amount (₹)</label><input type="text" inputMode="numeric" name="targetAmount" value={goal.targetAmount || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
            <label className="block mt-2">Amount Already Saved (₹)</label><input type="text" inputMode="numeric" name="amountSaved" value={goal.amountSaved || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
            <label className="block mt-2">Target Date</label><input type="date" name="targetDate" value={goal.targetDate || ''} min={today} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
          </div>
        ))}
        <button type="button" onClick={addGoal} className="w-full bg-green-700 font-bold py-2 px-4 rounded-xl">+ Add Another Goal</button>
      </div>
      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-8 text-xl rounded-xl disabled:opacity-50">
          {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
        </button>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
    </div>
  );
};

const OnboardingFlow = ({ onSubmit, initialData, isSubmitting }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {
    name: '', dateOfBirth: '', maritalStatus: '', dependents: '',
    monthlyIncome: '', expenses: {},
    emergencyFund: '',
    investments: { equity: '', debt: '', realEstate: '', gold: '' },
    liabilities: { highInterest: '', lowInterest: '' },
    healthInsurance: '', healthInsuranceCoverage: '',
    termInsurance: '', termInsuranceCoverage: '',
    riskTolerance: '', financialWorry: '',
    customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }],
  });
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const numericFields = ['dependents','monthlyIncome','emergencyFund','healthInsuranceCoverage','termInsuranceCoverage'];
    if (type === 'text' && numericFields.includes(name)) setFormData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') }));
    else setFormData(p => ({ ...p, [name]: value }));
  };
  const nextStep = () => setCurrentStep(p => p + 1);
  const prevStep = () => setCurrentStep(p => p - 1);
  const handleSubmit = () => {
    const totalAssets =
      parseFloat(formData.emergencyFund || 0) +
      parseFloat(formData.investments.equity || 0) +
      parseFloat(formData.investments.debt || 0) +
      parseFloat(formData.investments.realEstate || 0) +
      parseFloat(formData.investments.gold || 0);
    const totalLiabilities =
      parseFloat(formData.liabilities.highInterest || 0) +
      parseFloat(formData.liabilities.lowInterest || 0);
    const netWorth = totalAssets - totalLiabilities;
    const totalMonthlyExpenses = Object.values(formData.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
    const finalData = { ...formData, netWorth, debt: totalLiabilities, monthlyExpenses: totalMonthlyExpenses };
    onSubmit(finalData);
  };
  useEffect(() => { AOS.init({ duration: 600, once: true }); }, [currentStep]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="bg-gray-900 bg-opacity-80 p-8 rounded-3xl shadow-2xl border-gray-800 max-w-3xl w-full">
        {currentStep === 1 && (<OnboardingStep1 formData={formData} handleChange={handleChange} nextStep={nextStep} />)}
        {currentStep === 2 && (<OnboardingStep2 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 3 && (<OnboardingStep3 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 4 && (<OnboardingStep4 formData={formData} handleChange={handleChange} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 5 && (<OnboardingStep5 formData={formData} setFormData={setFormData} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />)}
      </div>
    </div>
  );
};

/* ---------- AI Chat (v1 UI, now server-routed AI) ---------- */
const AIChat = ({ chatHistory, isGeneratingResponse, callChatAPI, financialSummary, setChatHistory }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);

  useEffect(() => { if (chatHistoryRef.current) chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; }, [chatHistory]);
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        role: 'model',
        parts: [{ text: `Namaste, ${financialSummary?.name || 'User'}! I'm your AI financial companion. I have reviewed your profile. How can I help you today?` }]
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    callChatAPI(chatInput);
    setChatInput('');
  };

  const suggestionPrompts = (() => {
    if (!financialSummary) return [];
    const prompts = [];
    const { healthInsurance, termInsurance, customGoals, liabilities } = financialSummary;
    if (healthInsurance === 'no') prompts.push("Why is health insurance so important?");
    if (termInsurance === 'no') prompts.push("How much term insurance do I actually need?");
    if (parseFloat(liabilities?.highInterest || 0) > 0) prompts.push("Give me a strategy to pay off my credit card debt.");
    if (customGoals?.[0]?.name) prompts.push(`What's the best way to invest for my "${customGoals[0].name}" goal?`);
    if (prompts.length < 2) { prompts.push("How can I increase my savings rate?"); prompts.push("Is my portfolio diversified?"); }
    return [...new Set(prompts)].slice(0, 3);
  })();

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
          <div className="p-3 rounded-xl bg-gray-800 animate-pulse"><p>Thinking...</p></div>
        )}
      </div>

      {!isGeneratingResponse && chatHistory.length <= 2 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {suggestionPrompts.map((p, i) => (
            <button key={i} onClick={() => callChatAPI(p)} className="bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 py-2 px-3 rounded-full">{p}</button>
          ))}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask me anything about your finances..." className="flex-grow p-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none" disabled={isGeneratingResponse}/>
        <button type="submit" className="bg-green-600 font-bold py-3 px-6 rounded-xl disabled:opacity-50" disabled={!chatInput.trim() || isGeneratingResponse}>Send</button>
      </form>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
    </section>
  );
};

/* ---------- Tax Saver (v1 UI kept) ---------- */
const TaxSaver = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [taxData, setTaxData] = useState({
    salaryIncome: '', otherIncome: '', investments80C: '', hra: '', homeLoanInterest: '',
    medicalInsurance80D: '', nps_80ccd1b: '', educationLoanInterest_80e: ''
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

  if (!financialSummary) return <div className="text-center p-10">Loading financial data...</div>;

  const taxFields = [
    { name: 'salaryIncome', label: 'Annual Salary Income (from Form 16)', helper: 'Your total gross salary before any deductions.' },
    { name: 'otherIncome', label: 'Annual Income from Other Sources', helper: 'Interest income, rental income, capital gains, etc.' },
    { name: 'investments80C', label: 'Total Investments under Section 80C', helper: 'PPF, EPF, ELSS, life insurance premiums, etc. (Max: ₹1,50,000)' },
    { name: 'hra', label: 'HRA Exemption', helper: 'The exempt portion of your HRA.' },
    { name: 'homeLoanInterest', label: 'Interest on Home Loan (Sec 24)', helper: 'Max: ₹2,00,000 for self‑occupied' },
    { name: 'medicalInsurance80D', label: 'Medical Insurance Premium (Sec 80D)', helper: 'Self/family & parents.' },
    { name: 'nps_80ccd1b', label: 'NPS Contribution (Sec 80CCD(1B))', helper: 'Additional NPS: Max ₹50,000' },
    { name: 'educationLoanInterest_80e', label: 'Interest on Education Loan (Sec 80E)', helper: 'Total interest paid.' }
  ];
  const handleNumberChange = (e) => { const { name, value } = e.target; setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };

  const calculateTax = (taxableIncome, regime) => {
    let tax = 0; let slabRate = 0;
    if (regime === 'old') {
      if (taxableIncome <= 500000) return { tax: 0, slab: "0%" };
      if (taxableIncome > 1000000) { tax = 112500 + (taxableIncome - 1000000) * 0.30; slabRate = 30; }
      else if (taxableIncome > 500000) { tax = 12500 + (taxableIncome - 500000) * 0.20; slabRate = 20; }
      else if (taxableIncome > 250000) { tax = (taxableIncome - 250000) * 0.05; slabRate = 5; }
    } else {
      if (taxableIncome <= 700000) return { tax: 0, slab: "0%" };
      if (taxableIncome > 1500000) { tax = 150000 + (taxableIncome - 1500000) * 0.30; slabRate = 30; }
      else if (taxableIncome > 1200000) { tax = 90000 + (taxableIncome - 1200000) * 0.20; slabRate = 20; }
      else if (taxableIncome > 900000)  { tax = 45000 + (taxableIncome - 900000)  * 0.15; slabRate = 15; }
      else if (taxableIncome > 600000)  { tax = 15000 + (taxableIncome - 600000)  * 0.10; slabRate = 10; }
      else if (taxableIncome > 300000)  { tax = (taxableIncome - 300000)  * 0.05; slabRate = 5; }
    }
    return { tax: Math.round(tax * 1.04), slab: `${slabRate}%` }; // 4% cess
  };

  const handleTaxCalculation = async () => {
    setIsCalculating(true); setAiAnalysis('');
    const gI = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
    const tI_new = Math.max(0, gI - 50000);
    const { tax: nRT, slab: nRSlab } = calculateTax(tI_new, 'new');
    const tD = Object.values(taxData).slice(2).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const tI_old = Math.max(0, gI - 50000 - tD);
    const { tax: oRT, slab: oRSlab } = calculateTax(tI_old, 'old');
    setTaxResult({ nR: nRT, oR: oRT, bO: nRT < oRT ? 'New' : 'Old', s: Math.abs(nRT - oRT), nRSlab, oRSlab });

    const prompt = `
You are ZENVANA, an expert AI Tax Advisor for India.
DEEP USER CONTEXT:
- Name: ${financialSummary.name} (Age: ${getAge(financialSummary.dateOfBirth)})
- Risk Tolerance: ${financialSummary.riskTolerance}
- Existing Equity: ${formatIndianCurrency(financialSummary.investments?.equity)}
- Existing Debt: ${formatIndianCurrency(financialSummary.investments?.debt)}
- Home Loan Interest Entered: ${formatIndianCurrency(parseFloat(taxData.homeLoanInterest || 0))}
TAX DATA:
- Gross Income: ${formatIndianCurrency(gI)}
- Total Deductions Claimed: ${formatIndianCurrency(tD)}
- Recommended Regime: **${nRT < oRT ? 'New' : 'Old'}**
- Potential Annual Savings: **${formatIndianCurrency(Math.abs(nRT - oRT))}**
- Inputs: ${JSON.stringify(taxData)}
TASK: Generate a crisp, personalized Markdown report:
## Your Tax Analysis
- Start with a friendly greeting using their name.
- State recommended regime + savings upfront.
## Comparison
- Side-by-side (Old vs New) with slab notes.
## Missed Opportunities
- Point out 80C/80D/80CCD(1B) if low; praise if maxed.
## Next Steps
- 2–3 specific actions for THIS user.
`;
    try { const result = await callGroqAPIWithRetry(prompt); setAiAnalysis(result); }
    catch { setAiAnalysis("Zenvana AI is busy right now. Please try again."); }
    finally { setIsCalculating(false); }
  };

  return (
    <section className="p-6 rounded-2xl bg-gray-900">
      <h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          {taxFields.map((f) => (
            <div key={f.name}>
              <label className="block mb-1 font-semibold text-gray-200">{f.label} (₹)</label>
              <input type="text" inputMode="numeric" name={f.name} value={taxData[f.name] || ''} onChange={handleNumberChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-green-500" />
              <p className="text-xs text-gray-400 mt-1.5">💡 {f.helper}</p>
            </div>
          ))}
        </div>
        <div>
          <button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl mb-4 disabled:opacity-50">
            {isCalculating ? 'Calculating...' : 'Calculate & Analyze'}
          </button>
          {taxResult && (
            <div className="bg-gray-800 p-4 rounded-xl">
              <h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Tax Regime Comparison</h3>
              <div className="text-center mb-4 p-3 rounded-lg bg-green-900">
                <p className="text-lg">The <b>{taxResult.bO} Regime</b> is better for you.</p>
                <p className="text-2xl font-extrabold text-green-400">You save {formatIndianCurrency(taxResult.s)}!</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.oR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.oRSlab}</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.nR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.nRSlab}</p></div>
              </div>
            </div>
          )}
          {aiAnalysis && (
            <div className="mt-4 bg-gray-800 p-4 rounded-xl">
              <h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI’s Advice</h3>
              <MarkdownRenderer text={aiAnalysis} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* ---------- Expense Chart ---------- */
const ExpensePieChart = ({ expenses }) => {
  const chartData = Object.entries(expenses || {})
    .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: parseFloat(v || 0) }))
    .filter((d) => d.value > 0);
  const COLORS = ['#10B981','#FBBF24','#3B82F6','#8B5CF6','#EC4899','#6B7280','#14B8A6','#F59E0B','#6366F1','#D946EF'];
  if (chartData.length === 0) return (<div className="bg-gray-800 p-5 rounded-xl flex items-center justify-center h-full min-h-[300px]"><p className="text-gray-400">No expense data to display.</p></div>);
  return (
    <div className="bg-gray-800 p-5 rounded-xl h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={120} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1F2B37', borderColor: '#374151', color: '#F9FAFB' }} formatter={(value) => `${formatIndianCurrency(value)}`} />
          <Legend wrapperStyle={{ color: '#D1D5DB' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ---------- Dashboard (v1 logic retained) ---------- */
const Dashboard = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [isCalculatingHealth, setIsCalculatingHealth] = useState(true);
  const [improvementPlan, setImprovementPlan] = useState('');
  const [isGeneratingImprovement, setIsGeneratingImprovement] = useState(false);

  useEffect(() => {
    if (!financialSummary) return;
    setIsCalculatingHealth(true);

    const { dateOfBirth, dependents, monthlyIncome, monthlyExpenses, termInsurance, healthInsurance, investments, liabilities, emergencyFund } = financialSummary;
    const age = getAge(dateOfBirth);
    const persona = (parseInt(dependents || 0, 10) > 0) ? 'Family Builder' : (age < 30 ? 'Young Accumulator' : 'Established Protector');
    const monthlySavings = parseFloat(monthlyIncome || 0) - parseFloat(monthlyExpenses || 0);
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : -1;

    const weights = {
      'Young Accumulator':     { savings: 30, emergency: 20, debt: 20, insurance: 10, investment: 20 },
      'Family Builder':        { savings: 20, emergency: 30, debt: 15, insurance: 25, investment: 10 },
      'Established Protector': { savings: 25, emergency: 25, debt: 20, insurance: 20, investment: 10 }
    };
    const w = weights[persona];
    let raw = { savings: 0, emergency: 0, debt: 0, insurance: 0, investment: 0 };

    if (savingsRate >= 30) raw.savings = 1; else if (savingsRate >= 15) raw.savings = 0.7; else if (savingsRate >= 5) raw.savings = 0.4;
    const emergencyMonths = monthlyExpenses > 0 ? parseFloat(emergencyFund || 0) / monthlyExpenses : 12;
    if (emergencyMonths >= 6) raw.emergency = 1; else if (emergencyMonths >= 3) raw.emergency = 0.7; else if (emergencyMonths >= 1) raw.emergency = 0.3;
    const hiDebt = parseFloat(liabilities?.highInterest || 0);
    if (hiDebt === 0) raw.debt = 1; else if (hiDebt / (monthlyIncome * 12) < 0.1) raw.debt = 0.5; else raw.debt = 0.1;
    raw.insurance = (healthInsurance === 'yes' ? 0.5 : 0) + (termInsurance === 'yes' ? 0.5 : 0);
    const totalInv = Object.values(investments || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
    if (totalInv / (monthlyIncome * 12) > 1) raw.investment = 1; else if (totalInv > 0) raw.investment = 0.5;

    let score = Object.keys(raw).reduce((acc, k) => acc + raw[k] * w[k], 0);
    if (savingsRate < 0) score -= 10;
    setHealthScore(Math.max(0, Math.min(100, Math.round(score))));
    setIsCalculatingHealth(false);
  }, [financialSummary]);

  if (!financialSummary) return (<section className="p-8 rounded-2xl bg-gray-900 bg-opacity-80"><div className="flex items-center justify-center h-64"><p className="text-gray-400 text-lg">Loading your financial dashboard...</p></div></section>);

  const mS = (financialSummary?.monthlyIncome || 0) - (financialSummary?.monthlyExpenses || 0);
  const sR = financialSummary?.monthlyIncome > 0 ? ((mS / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;
  const getScoreColor = (score) => { if (score === null) return 'text-gray-400'; if (score >= 75) return 'text-green-400'; if (score >= 50) return 'text-yellow-400'; return 'text-red-500'; };

  const handleGenerateImprovementPlan = async () => {
    setIsGeneratingImprovement(true); setImprovementPlan('');
    const prompt = `
You are ZENVANA, an AI financial advisor for an Indian user.
Health Score: ${healthScore}/100
Savings Rate: ${sR.toFixed(1)}%
Emergency Fund: ${formatIndianCurrency(financialSummary.emergencyFund)} (${(parseFloat(financialSummary.emergencyFund || 0) / (financialSummary.monthlyExpenses || 1)).toFixed(1)} months)
High-Interest Debt: ${formatIndianCurrency(financialSummary.liabilities?.highInterest)}
Insurance: Health=${financialSummary.healthInsurance}, Term=${financialSummary.termInsurance}
Worry: ${financialSummary.financialWorry}
TASK: Give a concise, personalized plan in Markdown with 2–3 clear priorities and one action for TODAY.`;
    try { const result = await callGroqAPIWithRetry(prompt); setImprovementPlan(result); }
    catch { setImprovementPlan("Couldn't generate now. Please try again."); }
    finally { setIsGeneratingImprovement(false); }
  };

  return (
    <section className="p-6 rounded-2xl bg-gray-900">
      <h2 className="text-3xl font-bold text-green-400 mb-6">Your Dashboard</h2>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 p-5 rounded-xl"><h3 className="text-gray-400">Monthly Savings</h3><div className="text-3xl font-bold">{formatIndianCurrency(mS)}</div></div>
        <div className="bg-gray-800 p-5 rounded-xl"><h3 className="text-gray-400">Savings Rate</h3><div className="text-3xl font-bold">{isNaN(sR) ? '0%' : `${sR.toFixed(1)}%`}</div></div>
        <div className="bg-gray-800 p-5 rounded-xl"><h3 className="text-gray-400">Health Score</h3><div className={`text-3xl font-bold ${getScoreColor(healthScore)}`}>{isCalculatingHealth ? 'Calculating…' : `${healthScore}/100`}</div></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ExpensePieChart expenses={financialSummary.expenses} />
        <div className="bg-gray-800 p-5 rounded-xl">
          <h3 className="text-xl font-bold text-yellow-400 mb-3">Improve Your Score</h3>
          <button onClick={handleGenerateImprovementPlan} disabled={isGeneratingImprovement} className="bg-green-600 font-bold py-2 px-4 rounded-xl disabled:opacity-50">
            {isGeneratingImprovement ? 'Generating…' : 'Generate Personalized Plan'}
          </button>
          {improvementPlan && <div className="mt-4"><MarkdownRenderer text={improvementPlan} /></div>}
        </div>
      </div>
    </section>
  );
};

/* ---------- MAIN APP ---------- */
export default function App() {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const appRef = useRef(null);
  const dbRef = useRef(null);

  // initialize Firebase once
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    appRef.current = app;
    dbRef.current = getFirestore(app);
    const auth = getAuth(app);
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // load profile
        const pref = doc(dbRef.current, `users/${user.uid}`, "profile");
        const snap = await getDoc(pref);
        if (snap.exists()) {
          setFinancialSummary(snap.data());
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('welcome');
        }
      } else {
        setUserId(null);
        setCurrentPage('welcome');
      }
    });
    setFirebaseReady(true);
    return () => unsub();
  }, []);

  /* ----------- SERVER AI HELPER (Netlify function) ----------- */
  async function askAI({ question, mode = "groq-fast", profile = {}, chat = [] }) {
    const r = await fetch("/.netlify/functions/aiRouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, question, profile, chat })
    });
    if (!r.ok) {
      let err = {};
      try { err = await r.json(); } catch {}
      throw new Error(err.error || `AI error ${r.status}`);
    }
    return r.json(); // { text }
  }

  /* ----------- v1-compatible API wrappers ----------- */
  const callGroqAPIWithRetry = useCallback(async (prompt, retries = 3, delay = 800) => {
    try {
      const { text } = await askAI({
        mode: "groq-fast",
        question: prompt,
        profile: financialSummary || {},
        chat: []
      });
      return text;
    } catch (e) {
      if (retries > 0) { await wait(delay); return callGroqAPIWithRetry(prompt, retries - 1, delay * 2); }
      throw e;
    }
  }, [financialSummary]);

  const callChatAPI = async (userMessage) => {
    setIsGeneratingResponse(true);
    const newHistory = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(newHistory);

    const chatForFn = newHistory.slice(-10).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      text: m.parts?.[0]?.text || ""
    }));

    // Simple hybrid router: short → Groq, long → OpenAI
    const mode = userMessage.length <= 120 ? "groq-fast" : "openai";

    try {
      const { text } = await askAI({
        mode,
        question: userMessage,
        profile: financialSummary || {},
        chat: chatForFn
      });
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text }] }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "Zenvana AI is busy right now. Please try again." }] }]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  /* ----------- Onboarding submit / persistence ----------- */
  const handleOnboardingSubmit = async (finalData) => {
    if (!userId) return;
    const pref = doc(dbRef.current, `users/${userId}`, "profile");
    await setDoc(pref, finalData, { merge: true });
    setFinancialSummary(finalData);
    setCurrentPage('dashboard');
  };

  const handleNavigate = (page) => setCurrentPage(page);

  const handleLogout = async () => {
    try {
      if (!userId) return;
      // optional: clear user doc to "start over"
      await deleteDoc(doc(dbRef.current, `users/${userId}`, "profile")).catch(() => {});
      await signOut(getAuth(appRef.current));
      setFinancialSummary(null);
      setChatHistory([]);
      setCurrentPage('welcome');
    } catch (e) {
      // silent
    }
  };

  /* ----------- Render ----------- */
  if (!firebaseReady) return null;

  if (currentPage === 'welcome') {
    return <WelcomePage onGetStarted={() => setCurrentPage('onboarding')} />;
  }

  if (currentPage === 'onboarding') {
    return <OnboardingFlow onSubmit={handleOnboardingSubmit} initialData={financialSummary || undefined} isSubmitting={false} />;
  }

  return (
    <Layout userId={userId} onNavigate={handleNavigate} currentPage={currentPage} handleLogout={handleLogout}>
      {currentPage === 'dashboard' && <Dashboard financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />}
      {currentPage === 'taxSaver'  && <TaxSaver financialSummary={financialSummary}  callGroqAPIWithRetry={callGroqAPIWithRetry} />}
      {currentPage === 'aiChat'    && <AIChat chatHistory={chatHistory} isGeneratingResponse={isGeneratingResponse} callChatAPI={callChatAPI} financialSummary={financialSummary} setChatHistory={setChatHistory} />}
    </Layout>
  );
}
