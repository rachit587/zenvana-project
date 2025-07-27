import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

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

const WelcomePage = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 relative overflow-hidden">
    <div className="absolute inset-0 z-0 opacity-10"><div className="absolute top-1/4 left-1/4 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div><div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div><div className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div></div>
    <div className="relative z-10 flex flex-col items-center">
      <h1 className="text-7xl font-extrabold text-white mb-4 drop-shadow-lg animate-fade-in-down">Welcome to ZENVANA</h1>
      <p className="text-3xl text-gray-300 mb-10 max-w-3xl animate-fade-in-up">Our mission: To empower every Indian with the knowledge and tools to achieve financial literacy and freedom.</p>
      <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl transition duration-200 ease-in-out transform hover:-translate-y-2 hover:shadow-gold-glow animate-bounce-once shadow-lg mb-16">Get Started</button>
      <section className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-gray-700 mb-8 max-w-4xl w-full animate-fade-in-scale">
        <h2 className="text-4xl font-bold text-green-400 mb-6">About Us & Our Vision</h2>
        <p className="text-lg text-gray-300 mb-4 leading-relaxed">At ZENVANA, we envision a world where managing your money is intuitive, trustworthy, and stress-free. We are building the most intuitive, trustworthy, and empowering AI-driven personal finance companion, guiding users to their financial nirvana by simplifying complex financial concepts and providing actionable, personalized strategies.</p>
      </section>
      <section className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-gray-700 mb-10 max-w-4xl w-full animate-fade-in-scale delay-300">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6">How We Can Help You</h2>
        <ul className="text-lg text-gray-300 space-y-4 text-left">
          <li className="flex items-start"><span className="text-green-400 text-2xl mr-3">✓</span><strong>AI Chat Assistance:</strong> Your unlimited, free financial advisor ready to answer any query, provide guidance, and mentor you.</li>
          <li className="flex items-start"><span className="text-green-400 text-2xl mr-3">✓</span><strong>Comprehensive Financial Summaries:</strong> Understand your financial health at a glance with clear, actionable insights.</li>
          <li className="flex items-start"><span className="text-green-400 text-2xl mr-3">✓</span><strong>Smart Tax Saving:</strong> Leverage AI to identify personalized opportunities to save more on your taxes.</li>
        </ul>
      </section>
      <footer className="text-gray-400 text-md mt-10">Made with love ❤️ by Rachit Banthia</footer>
    </div>
    <style dangerouslySetInnerHTML={{ __html: `@keyframes fade-in-down{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}@keyframes fade-in-up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}@keyframes fade-in-scale{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}@keyframes bounce-once{0%,100%{transform:translateY(0)}20%{transform:translateY(-15px)}40%{transform:translateY(0)}60%{transform:translateY(-8px)}80%{transform:translateY(0)}}@keyframes blob{0%{transform:translate(0px,0px) scale(1)}33%{transform:translate(30px,-50px) scale(1.1)}66%{transform:translate(-20px,20px) scale(.9)}100%{transform:translate(0px,0px) scale(1)}}.animate-fade-in-down{animation:fade-in-down .8s ease-out forwards}.animate-fade-in-up{animation:fade-in-up .8s ease-out forwards}.animate-fade-in-scale{animation:fade-in-scale .7s ease-out forwards}.animate-bounce-once{animation:bounce-once 1.5s ease-out forwards}.animate-blob{animation:blob 7s infinite cubic-bezier(.6,.01,.3,.9)}.delay-300{animation-delay:.2s}.shadow-gold-glow{box-shadow:0 0 20px rgba(255,215,0,.6)}` }} />
  </div>
);

const Step1 = ({ formData, handleChange, nextStep }) => {
    const today = new Date().toISOString().split('T')[0];
    return (
      <div className="animate-fade-in-scale">
        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Welcome to ZENVANA!</h3>
        <p className="text-lg text-gray-400 mb-8 text-center">Let's start by getting to know you.</p>
        <div className="space-y-6">
          <div><label htmlFor="name" className="block text-gray-300 text-lg font-semibold mb-2">Your Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., Ananya Sharma" required /></div>
          <div><label htmlFor="dateOfBirth" className="block text-gray-300 text-lg font-semibold mb-2">Your Date of Birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} min="1925-01-01" className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" required /></div>
          <button onClick={nextStep} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-4 px-8 rounded-xl text-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl">Next</button>
        </div>
      </div>
    );
};
const Step2 = ({ formData, handleChange, nextStep, prevStep }) => (
  <div className="animate-fade-in-scale">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Financial Foundation</h3>
    <div className="space-y-6">
      <div><label htmlFor="monthlyIncome" className="block text-gray-300 text-lg font-semibold mb-2">Average Monthly Income (₹)</label><input type="text" inputMode="numeric" id="monthlyIncome" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., 50000" required /></div>
      <div><label htmlFor="netWorth" className="block text-gray-300 text-lg font-semibold mb-2">Current Net Worth (₹)</label><input type="text" inputMode="numeric" id="netWorth" name="netWorth" value={formData.netWorth} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., 500000" /></div>
      <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition">Next</button></div>
    </div>
  </div>
);
const Step3 = ({ formData, setFormData, nextStep, prevStep }) => {
  const expenseCategories = [{ name: 'housing', label: 'Housing' }, { name: 'food', label: 'Food' }, { name: 'transportation', label: 'Transportation' }, { name: 'utilities', label: 'Utilities' }, { name: 'entertainment', label: 'Entertainment' }, { name: 'healthcare', label: 'Healthcare' }, { name: 'personalCare', label: 'Personal Care' }, { name: 'education', label: 'Education' }, { name: 'debtPayments', label: 'Debt Payments' }, { name: 'miscellaneous', label: 'Miscellaneous' }];
  const handleExpenseChange = (e) => { const { name, value } = e.target; const sanitizedValue = value.replace(/[^0-9]/g, ''); setFormData(prev => ({ ...prev, expenses: { ...prev.expenses, [name]: sanitizedValue } })); };
  return (
    <div className="animate-fade-in-scale">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Monthly Expenses</h3>
      <div className="space-y-4">
        {expenseCategories.map(category => (<div key={category.name}><label htmlFor={category.name} className="block text-gray-300 font-semibold mb-1">{category.label} (₹)</label><input type="text" inputMode="numeric" id={category.name} name={category.name} value={formData.expenses?.[category.name] || ''} onChange={handleExpenseChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="0" /></div>))}
      </div>
      <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition">Next</button></div>
    </div>
  );
};
const Step4 = ({ formData, setFormData, nextStep, prevStep }) => {
  const today = new Date().toISOString().split('T')[0];
  const handleGoalChange = (index, e) => { const { name, value, type } = e.target; const sanitizedValue = type === 'text' && name !== 'name' ? value.replace(/[^0-9]/g, '') : value; const newGoals = [...formData.customGoals]; newGoals[index] = { ...newGoals[index], [name]: sanitizedValue }; setFormData(prev => ({ ...prev, customGoals: newGoals })); };
  const addGoal = () => setFormData(prev => ({ ...prev, customGoals: [...prev.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
  const removeGoal = (index) => setFormData(prev => ({ ...prev, customGoals: prev.customGoals.filter((_, i) => i !== index) }));
  return (
    <div className="animate-fade-in-scale">
      <h3 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Your Financial Goals</h3>
      <div className="space-y-6">
        {formData.customGoals.map((goal, index) => (<div key={index} className="bg-gray-700 p-4 rounded-xl mb-4 border border-gray-600">
            <div className="flex justify-between items-center mb-3"><label className="block text-gray-300 font-semibold">Goal {index + 1}</label>{formData.customGoals.length > 1 && (<button type="button" onClick={() => removeGoal(index)} className="text-red-400 hover:text-red-500 text-sm">Remove</button>)}</div>
            <label htmlFor={`goalName-${index}`} className="block text-gray-300 mt-2">Goal Name</label><input type="text" id={`goalName-${index}`} name="name" value={goal.name} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 border rounded-lg bg-gray-800 text-white" />
            <label htmlFor={`goalAmount-${index}`} className="block text-gray-300 mt-2">Target Amount (₹)</label><input type="text" inputMode="numeric" id={`goalAmount-${index}`} name="targetAmount" value={goal.targetAmount} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 border rounded-lg bg-gray-800 text-white" />
            <label htmlFor={`amountSaved-${index}`} className="block text-gray-300 mt-2">Amount Already Saved (₹)</label><input type="text" inputMode="numeric" id={`amountSaved-${index}`} name="amountSaved" value={goal.amountSaved} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 border rounded-lg bg-gray-800 text-white" />
            <label htmlFor={`goalDate-${index}`} className="block text-gray-300 mt-2">Target Date</label><input type="date" id={`goalDate-${index}`} name="targetDate" value={goal.targetDate} min={today} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 border rounded-lg bg-gray-800 text-white" />
        </div>))}
        <button type="button" onClick={addGoal} className="w-full bg-green-700 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-600 transition">+ Add Another Goal</button>
      </div>
      <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition">Next</button></div>
    </div>
  );
};
const Step5 = ({ formData, handleChange, prevStep, handleSubmit }) => (
  <div className="animate-fade-in-scale">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">A Little More About You</h3>
    <div className="space-y-6">
      <div><label htmlFor="riskTolerance" className="block text-gray-300 text-lg font-semibold mb-2">Your Risk Tolerance</label><select id="riskTolerance" name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white"><option value="">Select one</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
      <div><label htmlFor="currentInvestments" className="block text-gray-300 text-lg font-semibold mb-2 mt-4">Current Investments</label><textarea id="currentInvestments" name="currentInvestments" value={formData.currentInvestments} onChange={handleChange} rows="3" className="w-full p-3 border rounded-xl bg-gray-800 text-white"></textarea></div>
      <div><label htmlFor="dependents" className="block text-gray-300 text-lg font-semibold mb-2 mt-4">Number of Dependents</label><input type="text" inputMode="numeric" id="dependents" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800 text-white" /></div>
      <div><label htmlFor="debt" className="block text-gray-300 text-lg font-semibold mb-2 mt-4">Total Outstanding Debt (₹)</label><input type="text" inputMode="numeric" id="debt" name="debt" value={formData.debt} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800 text-white" /></div>
    </div>
    <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={handleSubmit} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-4 px-8 rounded-xl text-xl transition">Complete Onboarding</button></div>
  </div>
);

const OnboardingFlow = ({ onSubmit, initialData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || { name: '', dateOfBirth: '', monthlyIncome: '', netWorth: '', expenses: {}, customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }], riskTolerance: '', currentInvestments: '', dependents: '', debt: '' });
  const handleChange = (e) => { const { name, value } = e.target; const numericFields = ['monthlyIncome', 'netWorth', 'dependents', 'debt']; if (numericFields.includes(name)) { const sanitizedValue = value.replace(/[^0-9]/g, ''); setFormData(prev => ({ ...prev, [name]: sanitizedValue })); } else { setFormData(prev => ({ ...prev, [name]: value })); }};
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const handleSubmit = () => { const totalMonthlyExpenses = Object.values(formData.expenses).reduce((sum, val) => sum + parseFloat(val || 0), 0); onSubmit({ ...formData, monthlyExpenses: totalMonthlyExpenses }); };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-3xl w-full">
        {currentStep === 1 && (<Step1 formData={formData} handleChange={handleChange} nextStep={nextStep} />)}
        {currentStep === 2 && (<Step2 formData={formData} handleChange={handleChange} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 3 && (<Step3 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 4 && (<Step4 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 5 && (<Step5 formData={formData} handleChange={handleChange} prevStep={prevStep} handleSubmit={handleSubmit} />)}
      </div>
    </div>
  );
};

const AIChat = ({ chatHistory, isGeneratingResponse, callGeminiAPI }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);
  useEffect(() => { if (chatHistoryRef.current) { chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; } }, [chatHistory]);
  const handleSendMessage = (e) => { e.preventDefault(); if (chatInput.trim() === '') return; callGeminiAPI(chatInput); setChatInput(''); };
  return (
    <section className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-800 flex flex-col h-full min-h-[500px]">
      <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
      <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
        {chatHistory.map((msg, index) => (<div key={index} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-700 text-gray-100 ml-auto rounded-br-none' : 'bg-gray-800 text-gray-200 mr-auto rounded-bl-none'}`}><p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'ZENVANA AI'}</p>{msg.role === 'user' ? <p>{msg.parts[0].text}</p> : <MarkdownRenderer text={msg.parts[0].text} />}</div>))}
        {isGeneratingResponse && (<div className="mb-3 p-3 rounded-xl bg-gray-800 text-gray-200 mr-auto rounded-bl-none animate-pulse"><p className="text-sm font-semibold mb-1">ZENVANA AI</p><p>Thinking...</p></div>)}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about your finances..." className="flex-grow p-3 border rounded-xl bg-gray-800 text-white" disabled={isGeneratingResponse} />
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition" disabled={isGeneratingResponse || chatInput.trim() === ''}>Send</button>
      </form>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222;border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981;border-radius:10px}`}</style>
    </section>
  );
};

const TaxSaver = () => {
    const [taxData, setTaxData] = useState({ salaryIncome: '', otherIncome: '', investments80C: '', hra: '', homeLoanInterest: '', medicalInsurance80D: '', nps_80ccd1b: '', educationLoanInterest_80e: '' });
    const [taxResult, setTaxResult] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const fieldLabels = { salaryIncome: "Annual Salary Income", otherIncome: "Other Income", investments80C: "80C Investments", hra: "HRA Exemption", homeLoanInterest: "Home Loan Interest", medicalInsurance80D: "80D Medical Insurance", nps_80ccd1b: "NPS Contribution", educationLoanInterest_80e: "Education Loan Interest" };
    const handleNumberChange = (e) => { const { name, value } = e.target; const sanitizedValue = value.replace(/[^0-9]/g, ''); setTaxData(prev => ({ ...prev, [name]: sanitizedValue })); };
    const calculateTax = (taxableIncome, isOldRegime) => {
        const cess = 0.04; let tax = 0;
        const slabs = isOldRegime ? [{ limit: 1000000, rate: 0.30, base: 112500 }, { limit: 500000, rate: 0.20, base: 12500 }, { limit: 250000, rate: 0.05, base: 0 }] : [{ limit: 1500000, rate: 0.30, base: 150000 }, { limit: 1200000, rate: 0.20, base: 90000 }, { limit: 900000, rate: 0.15, base: 45000 }, { limit: 600000, rate: 0.10, base: 15000 }, { limit: 300000, rate: 0.05, base: 0 }];
        for (const s of slabs) { if (taxableIncome > s.limit) { tax = s.base + (taxableIncome - s.limit) * s.rate; break; } }
        return Math.round(tax * (1 + cess));
    };
    const handleTaxCalculation = async () => {
        setIsCalculating(true); setTaxResult(null); setAiAnalysis('');
        const grossIncome = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        const taxableIncomeNew = Math.max(0, grossIncome - 50000);
        const newRegimeTax = calculateTax(taxableIncomeNew, false);
        const totalDeductions = Object.values(taxData).slice(2).reduce((sum, val) => sum + parseFloat(val || 0), 0);
        const taxableIncomeOld = Math.max(0, grossIncome - 50000 - totalDeductions);
        const oldRegimeTax = calculateTax(taxableIncomeOld, true);
        setTaxResult({ newRegime: newRegimeTax, oldRegime: oldRegimeTax, betterOption: newRegimeTax < oldRegimeTax ? 'New' : 'Old', savings: Math.abs(newRegimeTax - oldRegimeTax) });
        const prompt = `Analyze this tax calculation for an Indian user: Gross Income: ₹${grossIncome}, Deductions: ₹${totalDeductions}. Old Regime Tax: ₹${oldRegimeTax}, New Regime Tax: ₹${newRegimeTax}. Recommend the better option and give one actionable tax-saving tip.`;
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error('AI analysis failed');
            const aiResult = await response.json();
            setAiAnalysis(aiResult.candidates[0].content.parts[0].text);
        } catch (error) { setAiAnalysis("Could not fetch AI analysis."); } finally { setIsCalculating(false); }
    };
    return (
        <section className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800">
            <h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">{Object.keys(taxData).map((key) => (<div key={key}><label htmlFor={key} className="block mb-1">{fieldLabels[key]} (₹)</label><input type="text" inputMode="numeric" name={key} value={taxData[key]} onChange={handleNumberChange} className="w-full p-2 rounded bg-gray-800" /></div>))}</div>
                <div><button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 hover:bg-green-700 font-bold py-3 px-6 rounded-xl transition">{isCalculating ? 'Calculating...' : 'Calculate & Analyze'}</button>
                    {taxResult && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">Tax Comparison</h3><div className="text-center mb-4 p-3 rounded-lg bg-green-900"><p className="text-lg">The **{taxResult.betterOption} Regime** is better.</p><p className="text-2xl font-extrabold text-green-400">You save ₹{taxResult.savings.toLocaleString()}!</p></div><div className="grid grid-cols-2 gap-4 text-center"><div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p>₹{taxResult.oldRegime.toLocaleString()}</p></div><div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p>₹{taxResult.newRegime.toLocaleString()}</p></div></div></div>)}
                    {aiAnalysis && (<div className="mt-4 bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-green-400 mb-2">AI's Advice</h3><MarkdownRenderer text={aiAnalysis} /></div>)}
                </div>
            </div>
        </section>
    );
};

const Dashboard = ({ financialSummary, callGeminiAPI }) => {
  const [budgetAnalysisResult, setBudgetAnalysisResult] = useState('');
  const [isAnalyzingBudget, setIsAnalyzingBudget] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({});
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({});
  const totalMonthlyExpenses = Object.values(financialSummary?.expenses || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const monthlySavings = (financialSummary?.monthlyIncome || 0) - totalMonthlyExpenses;
  const savingsRate = financialSummary?.monthlyIncome ? ((monthlySavings / financialSummary.monthlyIncome) * 100).toFixed(2) : 0;
  const calculateGoalProgress = (goal) => {
    if (!goal.targetAmount || parseFloat(goal.targetAmount) === 0) return null;
    const targetAmount = parseFloat(goal.targetAmount); const amountSaved = parseFloat(goal.amountSaved || 0); const progress = Math.min(100, (amountSaved / targetAmount) * 100);
    return { progress: progress.toFixed(2), status: progress >= 100 ? 'Achieved!' : 'On Track' };
  };
  const handleAnalyzeBudget = async () => {
    setIsAnalyzingBudget(true); setBudgetAnalysisResult('');
    const prompt = `Analyze this budget for a user in India: Monthly Income ₹${financialSummary.monthlyIncome}, Expenses ${JSON.stringify(financialSummary.expenses)}. Provide one key insight and one actionable tip for improvement.`;
    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Budget analysis failed');
      const result = await response.json();
      setBudgetAnalysisResult(result.candidates[0].content.parts[0].text);
    } catch (error) { setBudgetAnalysisResult(`Error analyzing budget: ${error.message}`); } finally { setIsAnalyzingBudget(false); }
  };
  const handleGenerateGoalPlan = async (goal, index) => {
    setIsGeneratingGoalPlan(prev => ({ ...prev, [index]: true })); setGoalPlanResults(prev => ({ ...prev, [index]: '' }));
    const prompt = `Create a simple investment plan for this goal for an Indian user with a ${financialSummary.riskTolerance} risk tolerance: Goal: ${goal.name}, Target: ₹${goal.targetAmount}, Already Saved: ₹${goal.amountSaved}, Target Date: ${goal.targetDate}. Current monthly savings surplus is ₹${monthlySavings}. Suggest one or two suitable investment types.`;
    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Goal plan generation failed');
      const result = await response.json();
      setGoalPlanResults(prev => ({ ...prev, [index]: result.candidates[0].content.parts[0].text }));
    } catch (error) { setGoalPlanResults(prev => ({ ...prev, [index]: `Error generating plan: ${error.message}` })); } finally { setIsGeneratingGoalPlan(prev => ({ ...prev, [index]: false })); }
  };
  return (
    <section className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-800">
      <h2 className="text-4xl font-bold text-green-400 mb-6">Welcome, <span className="text-yellow-400">{financialSummary?.name || 'User'}!</span></h2>
      {financialSummary ? (<div className="space-y-6 text-lg">
          <h3 className="text-2xl font-bold text-gray-300 mt-6 mb-3">Your Financial Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700"><span>Net Worth:</span><span className="font-bold text-3xl"> ₹{parseFloat(financialSummary.netWorth || 0).toLocaleString()}</span></div>
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700"><span>Monthly Income:</span><span className="font-bold text-3xl text-green-400"> ₹{parseFloat(financialSummary.monthlyIncome || 0).toLocaleString()}</span></div>
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700"><span>Monthly Savings:</span><span className="font-bold text-3xl text-green-400"> ₹{monthlySavings.toLocaleString()}</span></div>
          </div>
          <h3 className="text-2xl font-bold text-yellow-400 mt-6 mb-3">Your Goals Progress</h3>
          {financialSummary.customGoals?.some(g => g.name) ? (<div className="space-y-4">
              {financialSummary.customGoals.map((goal, index) => {
                const goalProgress = calculateGoalProgress(goal);
                return goalProgress ? (<div key={index} className="bg-gray-800 p-5 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2"><span className="font-semibold text-xl">{goal.name}</span><span>Target: ₹{parseFloat(goal.targetAmount).toLocaleString()}</span></div>
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${goalProgress.progress}%` }}></div></div>
                    <p className="text-sm text-right">Saved: ₹{parseFloat(goal.amountSaved || 0).toLocaleString()} ({goalProgress.status})</p>
                    <button onClick={() => handleGenerateGoalPlan(goal, index)} className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-xl" disabled={isGeneratingGoalPlan[index]}>{isGeneratingGoalPlan[index] ? 'Generating...' : 'Generate Action Plan'}</button>
                    {goalPlanResults[index] && (<div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-xl"><MarkdownRenderer text={goalPlanResults[index]} /></div>)}
                  </div>) : null;
              })}</div>) : (<p>No custom goals set yet.</p>)}
          <h3 className="text-2xl font-bold text-yellow-400 mt-6 mb-3">Budget Analysis & Optimization</h3>
          <div className="bg-gray-700 p-5 rounded-xl border border-gray-600">
            <button onClick={handleAnalyzeBudget} className="w-full bg-green-600 hover:bg-green-700 text-gray-900 font-bold py-3 px-6 rounded-xl" disabled={isAnalyzingBudget}>{isAnalyzingBudget ? 'Analyzing...' : 'Get Budget Optimization Tips'}</button>
            {budgetAnalysisResult && (<div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-xl"><MarkdownRenderer text={budgetAnalysisResult} /></div>)}
          </div>
        </div>) : (<p>Loading financial summary...</p>)}
    </section>
  );
};

function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  useEffect(() => { const style = document.createElement('style'); style.innerHTML = `input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`; document.head.appendChild(style); return () => { document.head.removeChild(style); }; }, []);

  const fetchFinancialData = useCallback(async (firestore, currentUserId, appId) => {
    if (!firestore || !currentUserId || !appId) return;
    try {
      const docRef = doc(firestore, `artifacts/${appId}/users/${currentUserId}/financial_data`, 'summary');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) { setFinancialSummary(docSnap.data()); }
    } catch (error) { console.error("Error fetching data:", error); }
  }, []);

  useEffect(() => {
    try {
      const appId = '1:783039988566:web:6e8948d86341d4805eccf7';
      const firebaseConfig = { apiKey: "AIzaSyDjN0_LU5WEtCNLNryPIUjavIJAOXghCCQ", authDomain: "zenvana-web.firebaseapp.com", projectId: "zenvana-web", storageBucket: "zenvana-web.firebasestorage.app", messagingSenderId: "783039988566", appId: "1:783039988566:web:6e8948d86341d4805eccf7", measurementId: "G-TVZF4SK0YG" };
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestore); setAuth(firebaseAuth);
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) { setUserId(user.uid); setIsAuthReady(true); if (firestore) { fetchFinancialData(firestore, user.uid, appId); } }
        else { try { await signInAnonymously(firebaseAuth); } catch (error) { console.error("Auth error:", error); } }
      });
      return () => unsubscribe();
    } catch (error) { console.error("Firebase init error:", error); }
  }, [fetchFinancialData]);

  const saveFinancialData = async (data) => {
    if (!db || !userId) return;
    try {
      const appId = '1:783039988566:web:6e8948d86341d4805eccf7';
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/financial_data`, 'summary');
      const expensesParsed = {};
      for (const key in data.expenses) { expensesParsed[key] = parseFloat(data.expenses[key] || 0); }
      const dataToSave = { ...data, expenses: expensesParsed, lastUpdated: new Date().toISOString() };
      await setDoc(docRef, dataToSave, { merge: true });
      setFinancialSummary(dataToSave);
      setCurrentPage('dashboard');
    } catch (error) { console.error("Error saving data:", error); }
  };
  const callGeminiAPI = async (userMessage) => {
    setIsGeneratingResponse(true);
    const contextPrompt = `You are ZENVANA, an expert Indian financial advisor. Use the user's profile to give a personalized answer. Profile: ${JSON.stringify(financialSummary)}. User's message: "${userMessage}"`;
    const currentChatHistory = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(currentChatHistory);
    try {
      const payload = { contents: [...currentChatHistory.slice(-10), { role: "user", parts: [{ text: contextPrompt }] }] };
      const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('API call failed');
      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: text }] }]);
    } catch (error) { setChatHistory(prev => [...prev, { role: "model", parts: [{ text: `Error: ${error.message}` }] }]); } finally { setIsGeneratingResponse(false); }
  };
  const handleLogout = async () => {
    if (!auth || !db || !userId) return;
    try {
      const appId = '1:783039988566:web:6e8948d86341d4805eccf7';
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/financial_data`, 'summary');
      await deleteDoc(docRef);
      await signOut(auth);
      setFinancialSummary(null); setChatHistory([]); setUserId(null); setIsAuthReady(false); setCurrentPage('welcome');
    } catch (error) { console.error("Error on logout:", error); }
  };
  if (!isAuthReady) { return (<div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">Loading...</div>); }
  const navigateToOnboardingOrDashboard = () => { if (financialSummary && financialSummary.monthlyIncome > 0) { setCurrentPage('dashboard'); } else { setCurrentPage('onboarding'); }};
  return (
    <div className="min-h-screen">
      {currentPage === 'welcome' && <WelcomePage onGetStarted={navigateToOnboardingOrDashboard} />}
      {currentPage === 'onboarding' && <OnboardingFlow onSubmit={saveFinancialData} initialData={financialSummary} />}
      {currentPage !== 'welcome' && currentPage !== 'onboarding' && (
        <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
          {currentPage === 'dashboard' && (<Dashboard financialSummary={financialSummary} callGeminiAPI={callGeminiAPI} />)}
          {currentPage === 'taxSaver' && (<TaxSaver />)}
          {currentPage === 'aiChat' && (<AIChat chatHistory={chatHistory} isGeneratingResponse={isGeneratingResponse} callGeminiAPI={callGeminiAPI} />)}
        </Layout>
      )}
    </div>
  );
}

export default App;
