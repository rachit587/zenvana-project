import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- UTILITY & HELPER COMPONENTS ---

/**
 * Gets the current financial and assessment year for India.
 * This ensures tax calculations are always relevant.
 * @returns {{financialYear: string, assessmentYear: string}}
 */
const getCurrentFinancialYears = () => {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0 = January, 11 = December
    const currentYear = today.getFullYear();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    return {
        financialYear: `${startYear}-${endYear.toString().slice(-2)}`,
        assessmentYear: `${endYear}-${(endYear + 1).toString().slice(-2)}`
    };
};

/**
 * A simple, reusable component to render markdown-like text into styled HTML.
 */
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  const renderInlineFormatting = (line) => {
    return line.split(/\*\*(.*?)\*\*/g).map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : <span key={i}>{part}</span>
    );
  };
  return text.split('\n').map((line, index) => {
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold my-2 text-gray-200">{renderInlineFormatting(line.substring(4))}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold my-3 text-yellow-400">{renderInlineFormatting(line.substring(3))}</h2>;
    if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold my-4 text-green-400">{renderInlineFormatting(line.substring(2))}</h1>;
    if (line.startsWith('- ')) return <li key={index} className="ml-5 list-disc">{renderInlineFormatting(line.substring(2))}</li>;
    if (line.trim() !== '') return <p key={index} className="my-1">{renderInlineFormatting(line)}</p>;
    return null;
  });
};

// --- LAYOUT & UI COMPONENTS ---

const Layout = ({ children, userId, onNavigate, currentPage, handleLogout }) => (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 to-gray-900 font-sans text-gray-100">
      <nav className="w-64 bg-gray-900 shadow-lg p-6 flex flex-col rounded-r-3xl">
        <div className="mb-10 text-center"><h2 className="text-4xl font-extrabold text-green-400 drop-shadow-md">ZENVANA</h2>
          {userId && (<p className="text-xs text-gray-400 mt-2">User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-300 break-all">{userId}</span></p>)}
        </div>
        <ul className="space-y-4 flex-grow">
          <li><button onClick={() => onNavigate('dashboard')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>Dashboard</button></li>
          <li><button onClick={() => onNavigate('taxSaver')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all ${currentPage === 'taxSaver' ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1l-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Tax Saver</button></li>
          <li><button onClick={() => onNavigate('aiChat')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all ${currentPage === 'aiChat' ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>AI Chat</button></li>
        </ul>
        <div className="mt-auto pt-8"><button onClick={handleLogout} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl">Logout & Start Over</button></div>
      </nav>
      <main className="flex-grow p-8 overflow-auto">{children}</main>
    </div>
);

const WelcomePage = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
    <h1 className="text-7xl font-extrabold text-white mb-4">Welcome to ZENVANA</h1>
    <p className="text-3xl text-gray-300 mb-10 max-w-3xl">Our mission: To empower every Indian with the knowledge and tools to achieve financial literacy and freedom.</p>
    <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl">Get Started</button>
  </div>
);

// --- ONBOARDING COMPONENTS (REWRITTEN AND CONSOLIDATED) ---
const OnboardingFlow = ({ onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', dateOfBirth: '', monthlyIncome: '', netWorth: '', expenses: {}, customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }], riskTolerance: '', currentInvestments: '', dependents: '', debt: '' });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['monthlyIncome', 'netWorth', 'dependents', 'debt'];
    setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? value.replace(/[^0-9]/g, '') : value }));
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, expenses: { ...prev.expenses, [name]: value.replace(/[^0-9]/g, '') } }));
  };

  const handleGoalChange = (index, e) => {
    const { name, value } = e.target;
    const newGoals = [...formData.customGoals];
    newGoals[index] = { ...newGoals[index], [name]: name === 'name' ? value : value.replace(/[^0-9-]/g, '') };
    setFormData(p => ({ ...p, customGoals: newGoals }));
  };

  const addGoal = () => setFormData(p => ({ ...p, customGoals: [...p.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
  const removeGoal = (index) => setFormData(p => ({ ...p, customGoals: p.customGoals.filter((_, i) => i !== index) }));

  const nextStep = () => setCurrentStep(p => p + 1);
  const prevStep = () => setCurrentStep(p => p - 1);
  
  const handleSubmit = () => {
    const totalMonthlyExpenses = Object.values(formData.expenses).reduce((sum, value) => sum + parseFloat(value || 0), 0);
    onSubmit({ ...formData, monthlyExpenses: totalMonthlyExpenses });
  };

  const today = new Date().toISOString().split('T')[0];
  const expenseCategories = [{ name: 'housing', label: 'Housing (Rent/EMI)' }, { name: 'food', label: 'Food' }, { name: 'transportation', label: 'Transportation' }, { name: 'utilities', label: 'Utilities' }, { name: 'entertainment', label: 'Entertainment' }, { name: 'healthcare', label: 'Healthcare' }, { name: 'personalCare', label: 'Personal Care' }, { name: 'education', label: 'Education' }, { name: 'debtPayments', label: 'Debt Payments' }, { name: 'miscellaneous', label: 'Other' }];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="bg-gray-900 bg-opacity-80 p-8 rounded-3xl shadow-2xl border-gray-800 max-w-3xl w-full">
        {currentStep === 1 && (
          <div>
            <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Welcome to ZENVANA!</h3>
            <div className="space-y-6">
              <div><label htmlFor="name" className="block text-lg mb-2">Your Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g., Ananya Sharma" /></div>
              <div><label htmlFor="dateOfBirth" className="block text-lg mb-2">Your Date of Birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} className="w-full p-3 rounded-xl bg-gray-800" /></div>
              <button onClick={nextStep} className="w-full bg-green-600 font-bold py-3 rounded-xl text-lg">Next</button>
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div>
            <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Financial Foundation</h3>
            <div className="space-y-6">
              <div><label htmlFor="monthlyIncome" className="block text-lg mb-2">Average Monthly Income (₹)</label><input type="text" inputMode="numeric" id="monthlyIncome" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g., 50000" /></div>
              <div><label htmlFor="netWorth" className="block text-lg mb-2">Current Net Worth (₹)</label><input type="text" inputMode="numeric" id="netWorth" name="netWorth" value={formData.netWorth} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g., 500000" /></div>
              <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-green-600 font-bold py-3 px-6 rounded-xl">Next</button></div>
            </div>
          </div>
        )}
        {currentStep === 3 && (
          <div>
            <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Monthly Expenses</h3>
            <div className="space-y-4">{expenseCategories.map(c => (<div key={c.name}><label htmlFor={c.name} className="block mb-1">{c.label} (₹)</label><input type="text" inputMode="numeric" id={c.name} name={c.name} value={formData.expenses[c.name] || ''} onChange={handleExpenseChange} className="w-full p-2 rounded bg-gray-800" placeholder="0" /></div>))}</div>
            <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-green-600 font-bold py-3 px-6 rounded-xl">Next</button></div>
          </div>
        )}
        {currentStep === 4 && (
          <div>
            <h3 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Your Financial Goals</h3>
            <div className="space-y-6">{formData.customGoals.map((goal, index) => (<div key={index} className="bg-gray-700 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3"><label className="font-semibold">Goal {index + 1}</label>{formData.customGoals.length > 1 && (<button type="button" onClick={() => removeGoal(index)} className="text-red-400 text-sm">Remove</button>)}</div>
                <input type="text" name="name" placeholder="Goal Name" value={goal.name || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800 mb-2" />
                <input type="text" inputMode="numeric" name="targetAmount" placeholder="Target Amount (₹)" value={goal.targetAmount || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800 mb-2" />
                <input type="text" inputMode="numeric" name="amountSaved" placeholder="Amount Already Saved (₹)" value={goal.amountSaved || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800 mb-2" />
                <input type="date" name="targetDate" value={goal.targetDate || ''} min={today} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
            </div>))}
            <button type="button" onClick={addGoal} className="w-full bg-green-700 font-bold py-2 px-4 rounded-xl mt-4">+ Add Another Goal</button></div>
            <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-green-600 font-bold py-3 px-6 rounded-xl">Next</button></div>
          </div>
        )}
        {currentStep === 5 && (
          <div>
            <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">A Little More About You</h3>
            <div className="space-y-6">
              <div><label className="block text-lg mb-2">Risk Tolerance</label><select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800"><option value="">Select one</option><option value="low">Low (Prefer safety)</option><option value="medium">Medium (Balanced)</option><option value="high">High (Comfortable with risk)</option></select></div>
              <div><label className="block text-lg mt-4 mb-2">Current Investments</label><textarea name="currentInvestments" value={formData.currentInvestments} onChange={handleChange} rows="3" className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g., Stocks, Mutual Funds..."></textarea></div>
              <div><label className="block text-lg mt-4 mb-2">Number of Dependents</label><input type="text" inputMode="numeric" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g., 0, 1, 2" /></div>
              <div><label className="block text-lg mt-4 mb-2">Total Debt (₹)</label><input type="text" inputMode="numeric" name="debt" value={formData.debt} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g., 150000" /></div>
            </div>
            <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={handleSubmit} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 text-xl rounded-xl">Complete Onboarding</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- DATA & AI COMPONENTS ---

const ExpensePieChart = ({ expenses }) => {
  const chartData = Object.entries(expenses || {}).map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: parseFloat(value || 0) })).filter(item => item.value > 0);
  const COLORS = ['#10B981', '#FBBF24', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F59E0B', '#6366F1', '#D946EF'];
  if (chartData.length === 0) return <div className="bg-gray-800 p-5 rounded-xl flex items-center justify-center h-full min-h-[300px]"><p className="text-gray-400">No expense data to display.</p></div>;
  return (
    <div className="bg-gray-800 p-5 rounded-xl h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const AIChat = ({ chatHistory, isGeneratingResponse, callGeminiAPI }) => {
    const [chatInput, setChatInput] = useState('');
    const chatHistoryRef = useRef(null);
    useEffect(() => { if (chatHistoryRef.current) { chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; } }, [chatHistory]);
    const handleSendMessage = (e) => { e.preventDefault(); if (chatInput.trim() === '') return; callGeminiAPI(chatInput); setChatInput(''); };
    return (
        <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-full min-h-[500px]">
            <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
            <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-700 ml-auto' : 'bg-gray-800 mr-auto'}`}>
                        <p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'ZENVANA AI'}</p>
                        {msg.role === 'user' ? <p>{msg.parts[0].text}</p> : <MarkdownRenderer text={msg.parts[0].text} />}
                    </div>
                ))}
                {isGeneratingResponse && (<div className="p-3 rounded-xl bg-gray-800 animate-pulse"><p>Thinking...</p></div>)}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about your finances..." className="flex-grow p-3 rounded-xl bg-gray-800" disabled={isGeneratingResponse} />
                <button type="submit" className="bg-green-600 font-bold py-3 px-6 rounded-xl" disabled={!chatInput.trim() || isGeneratingResponse}>Send</button>
            </form>
            <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
        </section>
    );
};

const TaxSaver = ({ apiKey, financialSummary }) => {
    const [taxData, setTaxData] = useState({});
    const [taxResult, setTaxResult] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const { financialYear, assessmentYear } = getCurrentFinancialYears();

    const fieldLabels = { salaryIncome: "Annual Salary Income", otherIncome: "Annual Income from Other Sources", investments80C: "Investments under Section 80C", hra: "HRA Exemption Claimed", homeLoanInterest: "Interest on Home Loan (Sec 24)", medicalInsurance80D: "Medical Insurance Premium (Sec 80D)", nps_80ccd1b: "NPS Contribution (Sec 80CCD(1B))", educationLoanInterest_80e: "Interest on Education Loan (Sec 80E)" };
    const handleNumberChange = (e) => { const { name, value } = e.target; setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };
    const calculateTax = (taxableIncome, isOldRegime) => { let tax = 0; const slabs = isOldRegime ? [{ l: 1000000, r: 0.30, b: 112500 }, { l: 500000, r: 0.20, b: 12500 }] : [{ l: 1500000, r: 0.30, b: 150000 }, { l: 1200000, r: 0.20, b: 90000 }, { l: 900000, r: 0.15, b: 45000 }, { l: 600000, r: 0.10, b: 15000 }]; for (const s of slabs) { if (taxableIncome > s.l) { tax = s.b + (taxableIncome - s.l) * s.r; break; } } return Math.round(tax * 1.04); };
    
    const handleTaxCalculation = async () => {
        setIsCalculating(true); setAiAnalysis('');
        const gI = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        const tI_new = Math.max(0, gI - 50000);
        const nRT = calculateTax(tI_new, false);
        const tD = Object.values(taxData).slice(2).reduce((sum, val) => sum + parseFloat(val || 0), 0);
        const tI_old = Math.max(0, gI - 50000 - tD);
        const oRT = calculateTax(tI_old, true);
        setTaxResult({ nR: nRT, oR: oRT, bO: nRT < oRT ? 'New' : 'Old', s: Math.abs(nRT - oRT) });
        
        const prompt = `As ZENVANA, the expert AI financial advisor for ${financialSummary.name}, provide a detailed tax analysis for FY ${financialYear} (AY ${assessmentYear}). The user's Gross Income is ₹${gI}, and they've claimed ₹${tD} in deductions. The calculated tax is ₹${oRT} (Old Regime) and ₹${nRT} (New Regime). The better option is the **${nRT < oRT ? 'New Regime' : 'Old Regime'}**, saving them **₹${Math.abs(nRT - oRT)}**. Provide a clear markdown comparison and give 2-3 actionable, personalized tax-saving tips based on their inputs.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
            if (!response.ok) throw new Error('AI analysis failed');
            const result = await response.json();
            setAiAnalysis(result.candidates[0].content.parts[0].text);
        } catch (e) { setAiAnalysis("Could not fetch AI analysis."); } finally { setIsCalculating(false); }
    };
    return ( <section className="p-6 rounded-2xl bg-gray-900"><h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver (FY {financialYear})</h2><div className="grid md:grid-cols-2 gap-6"><div className="space-y-4">{Object.entries(fieldLabels).map(([key, label]) => (<div key={key}><label className="block mb-1">{label} (₹)</label><input type="text" inputMode="numeric" name={key} value={taxData[key] || ''} onChange={handleNumberChange} className="w-full p-2 rounded bg-gray-800" /></div>))}</div><div><button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl">{isCalculating ? 'Calculating...' : 'Calculate & Analyze'}</button>{taxResult && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Tax Comparison</h3><div className="text-center mb-4 p-3 rounded-lg bg-green-900"><p className="text-lg">The **{taxResult.bO} Regime** is better for you.</p><p className="text-2xl font-extrabold text-green-400">You save ₹{taxResult.s.toLocaleString()}!</p></div><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">₹{taxResult.oR.toLocaleString()}</p></div><div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">₹{taxResult.nR.toLocaleString()}</p></div></div></div>)}{aiAnalysis && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI's Advice</h3><MarkdownRenderer text={aiAnalysis} /></div>)}</div></div></section> );
};

const Dashboard = ({ financialSummary, apiKey }) => {
  const [analysisResult, setAnalysisResult] = useState({ text: '', score: null, opportunity: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({});
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({});
  
  const tME = Object.values(financialSummary?.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
  const mS = (financialSummary?.monthlyIncome || 0) - tME;
  const sR = financialSummary?.monthlyIncome ? ((mS / parseFloat(financialSummary.monthlyIncome)) * 100).toFixed(2) : 0;
  
  const handleAnalyzeBudget = async () => {
    setIsAnalyzing(true); 
    setAnalysisResult({ text: '', score: null, opportunity: '' });

    const prompt = `As ZENVANA, an expert AI financial analyst, provide a comprehensive analysis for ${financialSummary.name}. Their profile: Income ₹${financialSummary.monthlyIncome}, Expenses ₹${tME}, Debt ₹${financialSummary.debt}, Risk Tolerance ${financialSummary.riskTolerance}. Output a valid JSON object with three keys: "healthScore" (a number 0-100 based on savings rate, debt-to-income, and expense balance), "topOpportunity" (a concise, one-sentence string with the most impactful action), and "analysisText" (a detailed markdown analysis with an encouraging tone, key observation, and actionable tips framed with behavioral finance principles).`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      if (!response.ok) throw new Error('Budget analysis failed');
      const result = await response.json();
      const rawText = result.candidates[0].content.parts[0].text;
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(cleanedText);
      setAnalysisResult({ text: parsedResult.analysisText, score: parsedResult.healthScore, opportunity: parsedResult.topOpportunity });
    } catch (e) { 
      setAnalysisResult({ text: `Sorry, there was an error generating the analysis. Please try again.`, score: null, opportunity: '' });
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const hGGP = async (g, i) => {
    setIsGeneratingGoalPlan(p => ({ ...p, [i]: true }));
    const prompt = `As ZENVANA, create a simple, encouraging, and actionable investment plan for ${financialSummary.name} to achieve their goal: "${g.name}". Profile: Target ₹${g.targetAmount}, Saved ₹${g.amountSaved}, Target Date ${g.targetDate}, Risk Tolerance ${financialSummary.riskTolerance}, Monthly Surplus ₹${mS}. Provide a markdown response with: Required Monthly SIP, 1-2 specific investment recommendations (e.g., Nifty 50 Index Fund) suitable for their risk profile, and a simple first step to get started.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      if (!response.ok) throw new Error('Goal plan generation failed');
      const result = await response.json();
      setGoalPlanResults(p => ({ ...p, [i]: result.candidates[0].content.parts[0].text }));
    } catch (e) { setGoalPlanResults(p => ({ ...p, [i]: `Error: Goal plan generation failed` })); } finally { setIsGeneratingGoalPlan(p => ({ ...p, [i]: false })); }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const cGP = (g) => { if (!g.targetAmount) return null; const tA = parseFloat(g.targetAmount); const aS = parseFloat(g.amountSaved || 0); const p = Math.min(100, (aS / tA) * 100); return { p: p.toFixed(2), s: p >= 100 ? 'Achieved!' : 'On Track' }; };

  return (
    <section className="p-8 rounded-2xl bg-gray-900 bg-opacity-80">
      <h2 className="text-4xl font-bold text-green-400 mb-6">Welcome, <span className="text-yellow-400">{financialSummary?.name || 'User'}!</span></h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Net Worth</span><span className="font-bold text-3xl text-white block">₹{parseFloat(financialSummary.netWorth || 0).toLocaleString('en-IN')}</span></div>
        <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Monthly Savings</span><span className="font-bold text-3xl text-green-400 block">₹{mS.toLocaleString('en-IN')}</span></div>
        <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Savings Rate</span><span className="font-bold text-3xl text-green-400 block">{sR}%</span></div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-xl mb-8">
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">AI Financial Analysis</h3>
        <button onClick={handleAnalyzeBudget} className="w-full bg-green-600 font-bold py-3 rounded-xl text-lg mb-4" disabled={isAnalyzing}>{isAnalyzing ? 'Analyzing...' : 'Get My Financial Health Score & Plan'}</button>
        {analysisResult.score && (
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-5 rounded-xl text-center"><h4 className="text-lg font-semibold text-gray-300 mb-2">Financial Health Score</h4><p className="text-6xl font-bold text-green-400">{analysisResult.score}</p><p className="text-gray-400">out of 100</p></div>
                <div className="bg-gray-900 p-5 rounded-xl text-center"><h4 className="text-lg font-semibold text-gray-300 mb-2">AI Opportunity Finder</h4><p className="text-xl text-yellow-300">{analysisResult.opportunity}</p></div>
            </div>
        )}
        {analysisResult.text && <div className="mt-4 p-4 bg-gray-900 rounded-xl"><MarkdownRenderer text={analysisResult.text} /></div>}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Expense Breakdown</h3>
          <ExpensePieChart expenses={financialSummary.expenses} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Goals</h3>
          {financialSummary.customGoals?.some(g => g.name) ? (
            <div className="space-y-4">{financialSummary.customGoals.map((g, i) => {
                const pr = cGP(g);
                return pr ? (<div key={i} className="bg-gray-800 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-xl text-white">{g.name}</h4>
                        <p className="font-bold text-lg text-white">₹{parseFloat(g.targetAmount).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${pr.p}%` }}></div></div>
                    <p className="text-sm text-right text-gray-300">Saved: ₹{parseFloat(g.amountSaved || 0).toLocaleString('en-IN')} ({pr.s})</p>
                    <button onClick={() => hGGP(g, i)} className="mt-4 w-full bg-yellow-600 text-gray-900 font-bold py-2 rounded-xl" disabled={isGeneratingGoalPlan[i]}>{isGeneratingGoalPlan[i] ? 'Generating...' : 'Generate AI Action Plan'}</button>
                    {goalPlanResults[i] && (<div className="mt-4 p-3 bg-gray-900 rounded-xl"><MarkdownRenderer text={goalPlanResults[i]} /></div>)}
                  </div>) : null;
              })}</div>
          ) : (<p>No goals set.</p>)}
        </div>
      </div>
    </section>
  );
};


// --- MAIN APP COMPONENT (REWRITTEN FOR STABILITY) ---
function App() {
  const [firebase, setFirebase] = useState({ db: null, auth: null, appId: null });
  const [user, setUser] = useState({ isAuthReady: false, uid: null });
  const [financialSummary, setFinancialSummary] = useState(null); // null: loading, undefined: not found, object: found
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  
  const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";

  // Step 1: Initialize Firebase and Auth State
  useEffect(() => {
    if (typeof window.__firebase_config === 'undefined') {
      console.error("Firebase config is missing!");
      setUser({ isAuthReady: true, uid: null });
      return;
    }
    
    const config = JSON.parse(window.__firebase_config);
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    setFirebase({ db, auth, appId: config.appId });

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser({ isAuthReady: true, uid: authUser.uid });
      } else {
        const token = window.__initial_auth_token;
        if (token) {
          signInWithCustomToken(auth, token).catch(() => signInAnonymously(auth));
        } else {
          signInAnonymously(auth);
        }
        setUser({ isAuthReady: true, uid: null });
      }
    });

    return () => unsubscribe();
  }, []);

  // Step 2: Listen for User Data in Real-Time
  useEffect(() => {
    if (user.uid && firebase.db) {
      const docRef = doc(firebase.db, `artifacts/${firebase.appId}/users/${user.uid}/financial_data`, 'summary');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setFinancialSummary(docSnap.data());
        } else {
          setFinancialSummary(undefined); // Explicitly set to 'not found'
        }
      });
      return () => unsubscribe();
    } else {
      setFinancialSummary(undefined); // No user, so no data
    }
  }, [user.uid, firebase.db, firebase.appId]);

  const saveFinancialData = async (data) => {
    if (!firebase.db || !user.uid || !firebase.appId) return;
    const docRef = doc(firebase.db, `artifacts/${firebase.appId}/users/${user.uid}/financial_data`, 'summary');
    const expensesParsed = {};
    for (const key in data.expenses) { expensesParsed[key] = parseFloat(data.expenses[key] || 0); }
    const dataToSave = { ...data, expenses: expensesParsed, lastUpdated: new Date().toISOString() };
    await setDoc(docRef, dataToSave, { merge: true });
    // No need to set page here. The onSnapshot listener will handle it automatically.
  };

  const callGeminiAPI = async (userMessage) => {
    if (!financialSummary) return;
    setIsGeneratingResponse(true);
    const systemContext = `System Note for Zenvana AI: You are an expert, empathetic Indian financial advisor advising ${financialSummary.name}. Their profile: Income ₹${financialSummary.monthlyIncome}, Risk Tolerance ${financialSummary.riskTolerance}. Use this context to make your advice deeply personal.`;
    const currentChat = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(currentChat);
    const apiPayload = [{ role: 'user', parts: [{ text: systemContext }] }, { role: 'model', parts: [{ text: "Understood." }] }, ...currentChat.slice(-10)];
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: apiPayload }) });
      if (!response.ok) throw new Error(`API call failed: ${response.status}`);
      const result = await response.json();
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: result.candidates[0].content.parts[0].text }] }]);
    } catch (error) { 
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: `Sorry, an error occurred. Details: ${error.message}` }] }]); 
    } finally { 
      setIsGeneratingResponse(false); 
    }
  };

  const handleLogout = async () => {
    if (!firebase.auth || !firebase.db || !user.uid) return;
    const docRef = doc(firebase.db, `artifacts/${firebase.appId}/users/${user.uid}/financial_data`, 'summary');
    await deleteDoc(docRef);
    await signOut(firebase.auth);
    setFinancialSummary(null);
    setChatHistory([]);
    setUser({ isAuthReady: true, uid: null });
  };

  // --- RENDER LOGIC ---
  if (!user.isAuthReady || financialSummary === null) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Initializing Zenvana...</div>;
  }

  if (!user.uid) {
    return <WelcomePage onGetStarted={() => { /* Auth flow will handle this */ }} />;
  }

  if (financialSummary === undefined) {
    return <OnboardingFlow onSubmit={saveFinancialData} initialData={null} />;
  }

  // If we reach here, user is logged in and has data.
  const pages = {
      dashboard: <Dashboard financialSummary={financialSummary} apiKey={apiKey} />,
      taxSaver: <TaxSaver apiKey={apiKey} financialSummary={financialSummary} />,
      aiChat: <AIChat chatHistory={chatHistory} isGeneratingResponse={isGeneratingResponse} callGeminiAPI={callGeminiAPI} />,
  };

  return (
      <Layout userId={user.uid} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
          {pages[currentPage] || pages.dashboard}
      </Layout>
  );
}

export default App;
