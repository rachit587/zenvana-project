import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Configuration ---
// API Keys are directly included here.
// **CRITICAL FIX**: Corrected the storageBucket URL.

const firebaseConfig = {
  apiKey: "AIzaSyDJN0_LUSWEtCNLNryPIUjaviJAOXghCCQ",
  authDomain: "zenvana-web.firebaseapp.com",
  projectId: "zenvana-web",
  storageBucket: "zenvana-web.appspot.com", // <-- THIS WAS THE ERROR. IT'S NOW CORRECTED.
  messagingSenderId: "783039988566",
  appId: "1:783039988566:web:6e8948d86341d4885eccf7",
  measurementId: "G-TVZF4SK0YG"
};

const geminiApiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Reusable Components ---

// Markdown Renderer: Safely renders AI's response with basic formatting.
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;
  const renderInlineFormatting = (line) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : <span key={i}>{part}</span>);
  };
  const elements = text.split('\n').map((line, index) => {
    line = line.trim();
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold my-2 text-gray-200">{renderInlineFormatting(line.substring(4))}</h3>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold my-3 text-yellow-400">{renderInlineFormatting(line.substring(3))}</h2>;
    if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold my-4 text-green-400">{renderInlineFormatting(line.substring(2))}</h1>;
    if (line.startsWith('- ')) return <li key={index} className="ml-5 list-disc">{renderInlineFormatting(line.substring(2))}</li>;
    if (line.trim() !== '') return <p key={index} className="my-1">{renderInlineFormatting(line)}</p>;
    return null;
  });
  return <div className="text-gray-300 space-y-2">{elements}</div>;
};

// Layout: The main shell with the sidebar.
const Layout = ({ children, userId, onNavigate, currentPage, handleLogout }) => (
  <div className="min-h-screen flex bg-gradient-to-br from-gray-950 to-gray-900 font-sans text-gray-100">
    <nav className="w-64 bg-gray-900 shadow-lg p-6 flex flex-col rounded-r-3xl">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-green-400 drop-shadow-md">ZENVANA</h2>
        {userId && <p className="text-xs text-gray-400 mt-2">User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-300 break-all">{userId}</span></p>}
      </div>
      <ul className="space-y-4 flex-grow">
        <li><button onClick={() => onNavigate('dashboard')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>Dashboard</button></li>
        <li><button onClick={() => onNavigate('taxSaver')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all ${currentPage === 'taxSaver' ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1l-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Tax Saver</button></li>
        <li><button onClick={() => onNavigate('aiChat')} className={`w-full text-left flex items-center p-3 rounded-xl transition-all ${currentPage === 'aiChat' ? 'bg-gray-700 text-green-400' : 'hover:bg-gray-700'}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>AI Chat</button></li>
      </ul>
      <div className="mt-auto pt-8"><button onClick={handleLogout} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl">Logout & Start Over</button></div>
    </nav>
    <main className="flex-grow p-8 overflow-auto custom-scrollbar">{children}</main>
  </div>
);

// Welcome Page
const WelcomePage = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
    <h1 className="text-7xl font-extrabold text-white mb-4">Welcome to ZENVANA</h1>
    <p className="text-3xl text-gray-300 mb-10 max-w-3xl">Empowering every Indian towards financial freedom.</p>
    <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl">Get Started</button>
  </div>
);

// Onboarding Flow
const OnboardingFlow = ({ onSubmit, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', dateOfBirth: '', monthlyIncome: '', netWorth: '', expenses: {}, customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }], riskTolerance: '', currentInvestments: '', dependents: '', debt: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
        newGoals[index] = { ...newGoals[index], [name]: (name === 'targetAmount' || name === 'amountSaved') ? value.replace(/[^0-9]/g, '') : value };
        setFormData(p => ({ ...p, customGoals: newGoals }));
    };

    const addGoal = () => setFormData(p => ({ ...p, customGoals: [...p.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
    const removeGoal = (index) => setFormData(p => ({ ...p, customGoals: p.customGoals.filter((_, i) => i !== index) }));

    const nextStep = () => setCurrentStep(p => p + 1);
    const prevStep = () => setCurrentStep(p => p - 1);

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');
        const totalMonthlyExpenses = Object.values(formData.expenses).reduce((sum, val) => sum + parseFloat(val || 0), 0);
        const result = await onSubmit({ ...formData, monthlyExpenses: totalMonthlyExpenses });
        if (result.success) {
            onComplete();
        } else {
            setError(`Save Failed: ${result.error}`);
            setIsLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
            <div className="bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-3xl w-full">
                {error && <div className="bg-red-800 text-white p-3 rounded-xl mb-4 text-center">{error}</div>}
                
                {currentStep === 1 && (
                    <div>
                        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 1: Basic Info</h3>
                        <div className="space-y-6">
                            <div><label htmlFor="name" className="block text-lg mb-2">Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" required /></div>
                            <div><label htmlFor="dateOfBirth" className="block text-lg mb-2">Date of Birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} className="w-full p-3 rounded-xl bg-gray-800" required /></div>
                            <button onClick={nextStep} className="w-full bg-green-600 font-bold py-3 rounded-xl">Next</button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                     <div>
                        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 2: Financial Foundation</h3>
                        <div className="space-y-6">
                            <div><label htmlFor="monthlyIncome" className="block text-lg mb-2">Monthly Income (₹)</label><input type="text" inputMode="numeric" id="monthlyIncome" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" required /></div>
                            <div><label htmlFor="netWorth" className="block text-lg mb-2">Current Net Worth (₹)</label><input type="text" inputMode="numeric" id="netWorth" name="netWorth" value={formData.netWorth} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                            <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-green-600 py-3 px-6 rounded-xl">Next</button></div>
                        </div>
                    </div>
                )}
                
                {currentStep === 3 && (
                    <div>
                        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 3: Monthly Expenses</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['housing', 'food', 'transportation', 'utilities', 'entertainment', 'healthcare', 'personalCare', 'education', 'debtPayments', 'miscellaneous'].map(c => (
                                <div key={c}><label htmlFor={c} className="block capitalize mb-1">{c} (₹)</label><input type="text" inputMode="numeric" id={c} name={c} value={formData.expenses?.[c] || ''} onChange={handleExpenseChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-green-600 py-3 px-6 rounded-xl">Next</button></div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div>
                        <h3 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Step 4: Financial Goals</h3>
                        <div className="space-y-4">
                            {formData.customGoals.map((goal, index) => (
                                <div key={index} className="bg-gray-700 p-4 rounded-xl">
                                    <div className="flex justify-between items-center mb-2"><label>Goal {index + 1}</label><button type="button" onClick={() => removeGoal(index)} className="text-red-400">Remove</button></div>
                                    <input type="text" name="name" value={goal.name} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800 mb-2" placeholder="Goal Name"/>
                                    <input type="text" inputMode="numeric" name="targetAmount" value={goal.targetAmount} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800 mb-2" placeholder="Target Amount (₹)"/>
                                    <input type="text" inputMode="numeric" name="amountSaved" value={goal.amountSaved} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800 mb-2" placeholder="Amount Saved (₹)"/>
                                    <input type="date" name="targetDate" value={goal.targetDate} min={today} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addGoal} className="w-full mt-4 bg-green-700 py-2 rounded-xl">+ Add Goal</button>
                        <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-green-600 py-3 px-6 rounded-xl">Next</button></div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div>
                        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 5: Final Details</h3>
                        <div className="space-y-4">
                            <div><label className="block text-lg mb-2">Risk Tolerance</label><select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800"><option value="">Select</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                            <div><label className="block text-lg mb-2">Current Investments</label><textarea name="currentInvestments" value={formData.currentInvestments} onChange={handleChange} rows="3" className="w-full p-3 rounded-xl bg-gray-800"></textarea></div>
                            <div><label className="block text-lg mb-2">Dependents</label><input type="text" inputMode="numeric" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                            <div><label className="block text-lg mb-2">Total Debt (₹)</label><input type="text" inputMode="numeric" name="debt" value={formData.debt} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                        </div>
                        <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 py-3 px-6 rounded-xl">Previous</button><button onClick={handleSubmit} disabled={isLoading} className="bg-green-600 py-3 px-6 rounded-xl disabled:opacity-50">{isLoading ? 'Saving...' : 'Complete'}</button></div>
                    </div>
                )}
            </div>
        </div>
    );
};

// AI Chat
const AIChat = ({ chatHistory, isGeneratingResponse, callGeminiAPI, financialSummary }) => {
    const [chatInput, setChatInput] = useState('');
    const chatHistoryRef = useRef(null);
    useEffect(() => { if (chatHistoryRef.current) { chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; } }, [chatHistory]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (chatInput.trim() === '' || !geminiApiKey) return;
        callGeminiAPI(chatInput);
        setChatInput('');
    };

    return (
        <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-full">
            <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
            {!geminiApiKey && <div className="bg-red-800 text-white p-3 rounded-xl mb-4"><strong>Warning:</strong> Gemini API key not found. AI features disabled.</div>}
            <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`mb-3 p-4 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-green-800 ml-auto' : 'bg-gray-800 mr-auto'}`}>
                        <p className="text-sm font-semibold mb-1 text-yellow-400">{msg.role === 'user' ? (financialSummary?.name || 'You') : 'ZENVANA AI'}</p>
                        <MarkdownRenderer text={msg.parts[0].text} />
                    </div>
                ))}
                {isGeneratingResponse && <div className="p-3 rounded-xl bg-gray-800 animate-pulse">Thinking...</div>}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={geminiApiKey ? "Ask anything..." : "AI Chat Disabled"} className="flex-grow p-3 rounded-xl bg-gray-800" disabled={isGeneratingResponse || !geminiApiKey} />
                <button type="submit" className="bg-green-600 font-bold py-3 px-6 rounded-xl" disabled={!chatInput.trim() || isGeneratingResponse || !geminiApiKey}>Send</button>
            </form>
        </section>
    );
};

// Tax Saver
const TaxSaver = () => {
    const [taxData, setTaxData] = useState({});
    const [taxResult, setTaxResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') }));
    };

    const calculateTaxLiability = (taxableIncome, regime) => {
        let tax = 0;
        if (regime === 'new') {
            if (taxableIncome <= 300000) tax = 0;
            else if (taxableIncome <= 600000) tax = (taxableIncome - 300000) * 0.05;
            else if (taxableIncome <= 900000) tax = 15000 + (taxableIncome - 600000) * 0.10;
            else if (taxableIncome <= 1200000) tax = 45000 + (taxableIncome - 900000) * 0.15;
            else if (taxableIncome <= 1500000) tax = 90000 + (taxableIncome - 1200000) * 0.20;
            else tax = 150000 + (taxableIncome - 1500000) * 0.30;
            if (taxableIncome <= 700000) tax = 0;
        } else {
            if (taxableIncome <= 250000) tax = 0;
            else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
            else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
            else tax = 112500 + (taxableIncome - 1000000) * 0.30;
            if (taxableIncome <= 500000) tax = 0;
        }
        return Math.round(tax * 1.04);
    };

    const handleTaxCalculation = () => {
        setIsCalculating(true);
        const grossIncome = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        const standardDeduction = 50000;

        const taxableIncome_new = Math.max(0, grossIncome - standardDeduction);
        const newRegimeTax = calculateTaxLiability(taxableIncome_new, 'new');

        const totalDeductions = Math.min(150000, parseFloat(taxData.investments80C || 0)) + parseFloat(taxData.hra || 0) + Math.min(200000, parseFloat(taxData.homeLoanInterest || 0)) + parseFloat(taxData.medicalInsurance80D || 0) + Math.min(50000, parseFloat(taxData.nps_80ccd1b || 0)) + parseFloat(taxData.educationLoanInterest_80e || 0);
        const taxableIncome_old = Math.max(0, grossIncome - standardDeduction - totalDeductions);
        const oldRegimeTax = calculateTaxLiability(taxableIncome_old, 'old');

        setTaxResult({ newRegimeTax, oldRegimeTax, betterOption: newRegimeTax < oldRegimeTax ? 'New' : 'Old', savings: Math.abs(newRegimeTax - oldRegimeTax) });
        setIsCalculating(false);
    };

    const fieldLabels = { salaryIncome: "Annual Salary", otherIncome: "Other Income", investments80C: "80C Investments", hra: "HRA Exemption", homeLoanInterest: "Home Loan Interest", medicalInsurance80D: "80D Medical Insurance", nps_80ccd1b: "NPS (80CCD1B)", educationLoanInterest_80e: "80E Education Loan" };

    return (
        <section className="p-6 rounded-2xl bg-gray-900">
            <h2 className="text-3xl font-bold text-green-400 mb-6">Tax Saver (FY 2024-25)</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {Object.keys(fieldLabels).map((key) => (
                        <div key={key}><label className="block mb-1">{fieldLabels[key]} (₹)</label><input type="text" inputMode="numeric" name={key} value={taxData[key] || ''} onChange={handleNumberChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                    ))}
                </div>
                <div>
                    <button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl disabled:opacity-50">{isCalculating ? 'Calculating...' : 'Calculate Tax'}</button>
                    {taxResult && (
                        <div className="mt-6 bg-gray-800 p-6 rounded-xl">
                            <h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Comparison</h3>
                            <div className="text-center mb-4 p-3 rounded-lg bg-green-900"><p className="text-lg"><strong>{taxResult.betterOption} Regime</strong> is better.</p><p className="text-2xl font-extrabold text-green-400">You save ₹{taxResult.savings.toLocaleString('en-IN')}!</p></div>
                            <div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-700 p-4 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">₹{taxResult.oldRegimeTax.toLocaleString('en-IN')}</p></div><div className="bg-gray-700 p-4 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">₹{taxResult.newRegimeTax.toLocaleString('en-IN')}</p></div></div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

// Dashboard
const Dashboard = ({ financialSummary }) => {
    const totalMonthlyExpenses = Object.values(financialSummary?.expenses || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const monthlySavings = (financialSummary?.monthlyIncome || 0) - totalMonthlyExpenses;
    const savingsRate = financialSummary?.monthlyIncome ? ((monthlySavings / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;

    const chartData = Object.entries(financialSummary?.expenses || {}).map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: parseFloat(value || 0) })).filter(item => item.value > 0);
    const COLORS = ['#10B981', '#FBBF24', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

    return (
        <section>
            <h2 className="text-4xl font-bold text-green-400 mb-6">Welcome, {financialSummary?.name || 'User'}!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400">Net Worth</span><p className="font-bold text-3xl">₹{parseFloat(financialSummary?.netWorth || 0).toLocaleString('en-IN')}</p></div>
                <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400">Monthly Savings</span><p className="font-bold text-3xl text-green-400">₹{monthlySavings.toLocaleString('en-IN')}</p></div>
                <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400">Savings Rate</span><p className="font-bold text-3xl text-green-400">{savingsRate.toFixed(1)}%</p></div>
            </div>
            <h3 className="text-2xl font-bold text-yellow-400 mt-8 mb-3">Expense Breakdown</h3>
            <div className="bg-gray-800 p-5 rounded-xl h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};


// --- Main App Component ---
function App() {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('loading');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthError(null);
        setUserId(user.uid);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFinancialSummary(docSnap.data());
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('welcome');
        }
      } else {
        signInAnonymously(auth).catch(err => {
          console.error("Firebase sign-in error:", err);
          setAuthError("Could not connect to the database. Please ensure your Firebase API key is correct and that Anonymous Authentication is enabled in your Firebase project.");
        });
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const saveFinancialData = async (data) => {
    if (!userId) return { success: false, error: "Authentication error." };
    try {
      await setDoc(doc(db, "users", userId), data);
      setFinancialSummary(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      await signOut(auth);
      setFinancialSummary(null);
      setChatHistory([]);
      setUserId(null);
      setAuthError(null);
      setIsAuthReady(false);
      setCurrentPage('loading');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const callGeminiAPI = async (userMessage) => {
    if (!geminiApiKey) return;
    setIsGeneratingResponse(true);
    const fullPrompt = `User Profile: ${JSON.stringify(financialSummary)}. User message: "${userMessage}"`;
    const currentChat = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(currentChat);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [...currentChat.slice(-10), { role: 'user', parts: [{ text: fullPrompt }] }] })
      });
      if (!response.ok) throw new Error('API call failed');
      const result = await response.json();
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: result.candidates[0].content.parts[0].text }] }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: `Error: ${error.message}` }] }]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Render logic
  if (authError) {
    return <div className="flex items-center justify-center min-h-screen bg-red-900 text-white p-8 text-center"><h1 className="text-2xl">{authError}</h1></div>;
  }
  if (!isAuthReady || currentPage === 'loading') {
    return <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Initializing...</div>;
  }

  // If user is logged in, show the main layout, otherwise show welcome/onboarding
  if (currentPage === 'welcome' || currentPage === 'onboarding') {
      if (currentPage === 'welcome') return <WelcomePage onGetStarted={() => setCurrentPage('onboarding')} />;
      if (currentPage === 'onboarding') return <OnboardingFlow onSubmit={saveFinancialData} onComplete={() => setCurrentPage('dashboard')} />;
  }

  const renderPageContent = () => {
      switch (currentPage) {
          case 'dashboard': return <Dashboard financialSummary={financialSummary} />;
          case 'taxSaver': return <TaxSaver />;
          case 'aiChat': return <AIChat chatHistory={chatHistory} isGeneratingResponse={isGeneratingResponse} callGeminiAPI={callGeminiAPI} financialSummary={financialSummary} />;
          default: return null;
      }
  }

  return (
    <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
      {renderPageContent()}
    </Layout>
  );
}

export default App;
