import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const OnboardingStep1 = ({ formData, handleChange, nextStep }) => {
    const today = new Date().toISOString().split('T')[0];
    return (
      <div data-aos="fade-in">
        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 1: Personal Details</h3>
        <p className="text-lg text-gray-400 mb-8 text-center">Let's start with who you are. This helps us understand your life stage.</p>
        <div className="space-y-6">
          <div><label htmlFor="name" className="block text-gray-300 text-lg font-semibold mb-2">Your Full Name</label><input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., Ananya Sharma" required /></div>
          <div><label htmlFor="dateOfBirth" className="block text-gray-300 text-lg font-semibold mb-2">Your Date of Birth</label><input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={today} min="1925-01-01" className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" required /></div>
          <div><label htmlFor="maritalStatus" className="block text-gray-300 text-lg font-semibold mb-2">Marital Status</label>
            <select name="maritalStatus" id="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"><option value="">Select one</option><option value="single">Single</option><option value="married">Married</option></select>
          </div>
          <div><label htmlFor="dependents" className="block text-gray-300 text-lg font-semibold mb-2">Number of Dependents</label><input type="text" inputMode="numeric" id="dependents" name="dependents" value={formData.dependents} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., 0, 1, 2" /></div>
          <button onClick={nextStep} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-4 px-8 rounded-xl text-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl">Next</button>
        </div>
      </div>
    );
};

const OnboardingStep2 = ({ formData, setFormData, nextStep, prevStep }) => {
    const expenseCategories = [{ name: 'housing', label: 'Housing (Rent/EMI)' }, { name: 'food', label: 'Food' }, { name: 'transportation', label: 'Transportation' }, { name: 'utilities', label: 'Utilities' }, { name: 'entertainment', label: 'Entertainment' }, { name: 'healthcare', label: 'Healthcare' }, { name: 'personalCare', label: 'Personal Care' }, { name: 'education', label: 'Education' }, { name: 'debtPayments', label: 'Debt Payments' }, { name: 'miscellaneous', label: 'Miscellaneous' }];
    const handleExpenseChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, expenses: { ...prev.expenses, [name]: value.replace(/[^0-9]/g, '') } })); };
    const handleIncomeChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };

    return (
      <div data-aos="fade-in">
        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 2: Your Cash Flow</h3>
        <p className="text-lg text-gray-400 mb-8 text-center">Let's understand what comes in and what goes out monthly.</p>
        <div className="space-y-6">
            <div>
                <label htmlFor="monthlyIncome" className="block text-gray-300 text-lg font-semibold mb-2">Average Monthly Take-Home Income (₹)</label>
                <input type="text" inputMode="numeric" id="monthlyIncome" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleIncomeChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" placeholder="e.g., 50000" required />
                <p className="text-xs text-gray-400 mt-1">💡 Enter your monthly income after all deductions like tax and PF.</p>
            </div>
            <div>
                 <h4 className="text-gray-300 text-lg font-semibold mb-2">Your Average Monthly Expenses (₹)</h4>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">{expenseCategories.map(c => (<div key={c.name} className="grid grid-cols-2 items-center gap-4"><label htmlFor={c.name} className="text-gray-300 font-semibold">{c.label}</label><input type="text" inputMode="numeric" id={c.name} name={c.name} value={formData.expenses?.[c.name] || ''} onChange={handleExpenseChange} className="p-2 border border-gray-700 rounded-lg bg-gray-900 text-white" placeholder="0" /></div>))}</div>
            </div>
        </div>
        <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition">Next</button></div>
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
            <p className="text-lg text-gray-400 mb-8 text-center">This gives us the big picture of your assets and liabilities.</p>
            <div className="space-y-6">
                <div>
                    <h4 className="text-xl font-bold text-yellow-400 mb-3">Your Assets (What you own)</h4>
                    <div className="space-y-4">
                        <div><label className="block text-lg font-semibold mb-1">Emergency Fund (₹)</label><input type="text" inputMode="numeric" name="emergencyFund" value={formData.emergencyFund} onChange={handleFieldChange} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Cash in savings accounts or liquid funds for emergencies (ideally 6x monthly expenses).</p></div>
                        <div><label className="block text-lg font-semibold mb-1">Equity Investments (₹)</label><input type="text" inputMode="numeric" value={formData.investments.equity} onChange={(e) => handleNestedChange(e, 'investments', 'equity')} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Value of stocks, equity mutual funds, ELSS etc.</p></div>
                        <div><label className="block text-lg font-semibold mb-1">Debt Investments (₹)</label><input type="text" inputMode="numeric" value={formData.investments.debt} onChange={(e) => handleNestedChange(e, 'investments', 'debt')} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Value of FDs, PPF, EPF, debt funds, bonds etc.</p></div>
                        <div><label className="block text-lg font-semibold mb-1">Real Estate (₹)</label><input type="text" inputMode="numeric" value={formData.investments.realEstate} onChange={(e) => handleNestedChange(e, 'investments', 'realEstate')} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Market value of investment properties (not your primary home).</p></div>
                        <div><label className="block text-lg font-semibold mb-1">Gold & Others (₹)</label><input type="text" inputMode="numeric" value={formData.investments.gold} onChange={(e) => handleNestedChange(e, 'investments', 'gold')} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Value of physical gold, SGBs, crypto etc.</p></div>
                    </div>
                </div>
                 <div>
                    <h4 className="text-xl font-bold text-yellow-400 mb-3">Your Liabilities (What you owe)</h4>
                    <div className="space-y-4">
                        <div><label className="block text-lg font-semibold mb-1">High-Interest Debt (₹)</label><input type="text" inputMode="numeric" value={formData.liabilities.highInterest} onChange={(e) => handleNestedChange(e, 'liabilities', 'highInterest')} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Total outstanding on credit cards, personal loans etc.</p></div>
                        <div><label className="block text-lg font-semibold mb-1">Low-Interest Debt (₹)</label><input type="text" inputMode="numeric" value={formData.liabilities.lowInterest} onChange={(e) => handleNestedChange(e, 'liabilities', 'lowInterest')} className="w-full p-3 rounded-xl bg-gray-800" /><p className="text-xs text-gray-400 mt-1">💡 Total outstanding on home loans, car loans etc.</p></div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition">Next</button></div>
        </div>
    );
};

const OnboardingStep4 = ({ formData, handleChange, nextStep, prevStep }) => {
    return (
        <div data-aos="fade-in">
            <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 4: Your Safety Net & Strategy</h3>
            <p className="text-lg text-gray-400 mb-8 text-center">Let's review your insurance coverage and investment approach.</p>
            <div className="space-y-6">
                <div>
                    <label className="block text-lg font-semibold mb-2">Do you have a separate Health Insurance plan (not from your employer)?</label>
                    <select name="healthInsurance" value={formData.healthInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option></select>
                </div>
                {formData.healthInsurance === 'yes' &&
                    <div data-aos="fade-in"><label className="block text-lg font-semibold mb-1">Health Insurance Coverage (₹)</label><input type="text" inputMode="numeric" name="healthInsuranceCoverage" value={formData.healthInsuranceCoverage} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g. 500000" /><p className="text-xs text-gray-400 mt-1">💡 Enter your total family floater cover amount.</p></div>
                }
                <div>
                    <label className="block text-lg font-semibold mb-2">Do you have a Term Life Insurance plan?</label>
                    <select name="termInsurance" value={formData.termInsurance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option></select>
                </div>
                {formData.termInsurance === 'yes' &&
                     <div data-aos="fade-in"><label className="block text-lg font-semibold mb-1">Term Insurance Coverage (₹)</label><input type="text" inputMode="numeric" name="termInsuranceCoverage" value={formData.termInsuranceCoverage} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" placeholder="e.g. 10000000" /><p className="text-xs text-gray-400 mt-1">💡 Your life cover amount. Recommended: 10-15x your annual income.</p></div>
                }
                <div>
                    <label className="block text-lg font-semibold mb-2">What is your risk tolerance for investments?</label>
                    <select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="low">Low: I prioritize safety over high returns.</option><option value="medium">Medium: I'm comfortable with balanced risk for moderate growth.</option><option value="high">High: I'm willing to take higher risks for potentially higher returns.</option></select>
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2">What is your single biggest financial worry right now?</label>
                    <select name="financialWorry" value={formData.financialWorry} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800"><option value="">Select one</option><option value="retirement">Saving enough for retirement</option><option value="debt">Getting out of debt</option><option value="taxes">High taxes</option><option value="investing">Not knowing where to invest</option><option value="expenses">Managing daily expenses</option></select>
                </div>
            </div>
            <div className="flex justify-between mt-8"><button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button><button onClick={nextStep} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-xl">Next</button></div>
        </div>
    );
};

const OnboardingStep5 = ({ formData, setFormData, prevStep, handleSubmit, isSubmitting }) => {
  const today = new Date().toISOString().split('T')[0];
  const handleGoalChange = (index, e) => { const { name, value } = e.target; const newGoals = [...formData.customGoals]; newGoals[index] = { ...newGoals[index], [name]: name === 'name' ? value : value.replace(/[^0-9-]/g, '') }; setFormData(p => ({ ...p, customGoals: newGoals })); };
  const addGoal = () => setFormData(p => ({ ...p, customGoals: [...p.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
  const removeGoal = (index) => setFormData(p => ({ ...p, customGoals: p.customGoals.filter((_, i) => i !== index) }));
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 5: Your Financial Goals</h3>
      <p className="text-lg text-gray-400 mb-8 text-center">What are you working towards? Defining goals is the first step to achieving them.</p>
      <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {formData.customGoals.map((goal, index) => (<div key={index} className="bg-gray-700 p-4 rounded-xl border border-gray-600">
              <div className="flex justify-between items-center mb-3"><label className="font-semibold">Goal {index + 1}</label>{formData.customGoals.length > 1 && (<button type="button" onClick={() => removeGoal(index)} className="text-red-400 text-sm">Remove</button>)}</div>
              <label className="block mt-2">Goal Name</label><input type="text" name="name" value={goal.name || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" placeholder="e.g., Retirement, Buy a Car"/>
              <label className="block mt-2">Target Amount (₹)</label><input type="text" inputMode="numeric" name="targetAmount" value={goal.targetAmount || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
              <label className="block mt-2">Amount Already Saved (₹)</label><input type="text" inputMode="numeric" name="amountSaved" value={goal.amountSaved || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
              <label className="block mt-2">Target Date</label><input type="date" name="targetDate" value={goal.targetDate || ''} min={today} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
          </div>))}
        <button type="button" onClick={addGoal} className="w-full bg-green-700 font-bold py-2 px-4 rounded-xl">+ Add Another Goal</button>
      </div>
      <div className="flex justify-between mt-8">
        <button onClick={prevStep} className="bg-gray-700 font-bold py-3 px-6 rounded-xl">Previous</button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-8 text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
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
      name: '',
      dateOfBirth: '',
      maritalStatus: '',
      dependents: '',
      monthlyIncome: '',
      expenses: {},
      emergencyFund: '',
      investments: { equity: '', debt: '', realEstate: '', gold: '' },
      liabilities: { highInterest: '', lowInterest: '' },
      healthInsurance: '',
      healthInsuranceCoverage: '',
      termInsurance: '',
      termInsuranceCoverage: '',
      riskTolerance: '',
      financialWorry: '',
      customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }],
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const numericFields = [ 'dependents', 'monthlyIncome', 'emergencyFund', 'healthInsuranceCoverage', 'termInsuranceCoverage' ];
    if (type === 'text' && numericFields.includes(name)) {
        setFormData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') }));
    } else {
        setFormData(p => ({ ...p, [name]: value }));
    }
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
    const finalData = {
        ...formData,
        netWorth: netWorth,
        debt: totalLiabilities,
        monthlyExpenses: totalMonthlyExpenses
    };
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

export default OnboardingFlow;
