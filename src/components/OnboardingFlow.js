// src/components/OnboardingFlow.js

import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// --- Onboarding Steps (kept together as they are part of a single flow) ---

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
        <p className="text-xs text-gray-400 mt-1">💡 Your Net Worth = Total Assets (savings, investments) - Total Liabilities (loans, credit card debt).</p>
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
      <div><label className="block text-lg font-semibold mb-2">Primary source of income?</label><select name="incomeSource" value={formData.incomeSource} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="salaried">Salaried</option><option value="self_employed">Self-Employed / Business</option><option value="freelancer">Freelancer</option><option value="other">Other</option></select></div>
      <div><label className="block text-lg font-semibold mb-2">Risk tolerance for investments?</label><select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="low">Low: I prioritize safety.</option><option value="medium">Medium: Balanced risk for moderate growth.</option><option value="high">High: Higher risks for higher returns.</option></select></div>
      <div><label className="block text-lg font-semibold mb-2">Biggest financial worry?</label><select name="financialWorry" value={formData.financialWorry} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="retirement">Saving for retirement</option><option value="debt">Getting out of debt</option><option value="taxes">High taxes</option><option value="investing">Not knowing where to invest</option><option value="expenses">Managing daily expenses</option></select></div>
      <div><label className="block text-lg font-semibold mt-4 mb-2">Current Investments</label><textarea name="currentInvestments" value={formData.currentInvestments} onChange={handleChange} rows="3" className="w-full p-3 border rounded-xl bg-gray-800" placeholder="e.g., Stocks, Mutual Funds, FD, Gold..."></textarea></div>
      <div><label className="block text-lg font-semibold mt-4 mb-2">Number of Dependents</label><input type="text" inputMode="numeric" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800" placeholder="e.g., 0, 1, 2" /></div>
      <div><label className="block text-lg font-semibold mt-4 mb-2">Total Outstanding Debt (₹)</label><input type="text" inputMode="numeric" name="debt" value={formData.debt} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800" placeholder="e.g., 150000" /></div>
      <div><label className="block text-lg font-semibold mb-2">Do you have Term Life Insurance?</label><select name="termInsurance" value={formData.termInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option><option value="not_sure">Not Sure</option></select></div>
      <div><label className="block text-lg font-semibold mb-2">Do you have Health Insurance?</label><select name="healthInsurance" value={formData.healthInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option><option value="not_sure">Not Sure</option></select></div>
    </div>
    <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-8 text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
        </button>
    </div>
  </div>
);

// --- Main Onboarding Component ---
const OnboardingFlow = ({ onSubmit, initialData, isSubmitting }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || { name: '', dateOfBirth: '', monthlyIncome: '', netWorth: '', expenses: {}, customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }], incomeSource: '', riskTolerance: '', financialWorry: '', currentInvestments: '', dependents: '', debt: '', termInsurance: '', healthInsurance: '' });
  
  const handleChange = (e) => {
      const { name, value } = e.target;
      const numericFields = ['monthlyIncome', 'netWorth', 'dependents', 'debt'];
      setFormData(p => ({ ...p, [name]: numericFields.includes(name) ? value.replace(/[^0-9]/g, '') : value }));
  };
  
  const nextStep = () => setCurrentStep(p => p + 1);
  const prevStep = () => setCurrentStep(p => p - 1);
  const handleSubmit = () => { onSubmit(formData); };

  useEffect(() => { AOS.init({ duration: 600, once: true }); }, [currentStep]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="bg-gray-900 bg-opacity-80 p-8 rounded-3xl shadow-2xl border-gray-800 max-w-3xl w-full">
        {currentStep === 1 && (<OnboardingStep1 formData={formData} handleChange={handleChange} nextStep={nextStep} />)}
        {currentStep === 2 && (<OnboardingStep2 formData={formData} handleChange={handleChange} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 3 && (<OnboardingStep3 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 4 && (<OnboardingStep4 formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />)}
        {currentStep === 5 && (<OnboardingStep5 formData={formData} handleChange={handleChange} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />)}
      </div>
    </div>
  );
};

export default OnboardingFlow;
