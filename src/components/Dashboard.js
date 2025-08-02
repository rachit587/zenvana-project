// src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import ZenvanaInsights from './ZenvanaInsights';
import ExpensePieChart from './ExpensePieChart';
import MarkdownRenderer from './MarkdownRenderer';

// --- Helper Functions ---
const formatIndianCurrency = (num) => {
    if (typeof num !== 'number') num = parseFloat(num || 0);
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return formatter.format(num);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
};

// --- Local Financial Health Score Calculator ---
const calculateFinancialHealthScore = (summary) => {
    if (!summary || !summary.monthlyIncome) return 0;
    let score = 0;
    const { monthlyIncome, expenses, netWorth, debt, termInsurance, healthInsurance, customGoals } = summary;
    const totalMonthlyExpenses = Object.values(expenses || {}).reduce((sum, value) => sum + parseFloat(value || 0), 0);
    const monthlySavings = parseFloat(monthlyIncome) - totalMonthlyExpenses;
    const annualIncome = parseFloat(monthlyIncome) * 12;

    const savingsRate = annualIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    if (savingsRate >= 30) score += 35; else if (savingsRate >= 20) score += 25; else if (savingsRate >= 10) score += 15; else if (savingsRate > 0) score += 5;
    
    const emergencyFundCoverage = totalMonthlyExpenses > 0 ? parseFloat(netWorth || 0) / totalMonthlyExpenses : 0;
    if (emergencyFundCoverage >= 6) score += 25; else if (emergencyFundCoverage >= 3) score += 15; else if (emergencyFundCoverage >= 1) score += 5;

    if (healthInsurance === 'yes') score += 10;
    if (termInsurance === 'yes') score += 10;

    const dti = annualIncome > 0 ? (parseFloat(debt || 0) / annualIncome) * 100 : 0;
    if (dti < 20) score += 10; else if (dti <= 40) score += 5;

    if (customGoals?.some(g => g.name)) score += 10;
    return Math.round(score);
};

const Dashboard = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [improvementPlan, setImprovementPlan] = useState('');
  const [isGeneratingImprovement, setIsGeneratingImprovement] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({});
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({});

  const totalMonthlyExpenses = Object.values(financialSummary?.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
  const monthlySavings = (financialSummary?.monthlyIncome || 0) - totalMonthlyExpenses;
  const savingsRate = financialSummary?.monthlyIncome > 0 ? ((monthlySavings / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;

  useEffect(() => {
    if (financialSummary) {
      const score = calculateFinancialHealthScore(financialSummary);
      setHealthScore(score);
    }
  }, [financialSummary]);
  
  // FIXED: The logic for this function is now complete.
  const handleGenerateImprovementPlan = async () => {
    setIsGeneratingImprovement(true);
    setImprovementPlan('');
    const prompt = `
You are ZENVANA, an AI financial advisor for an Indian user.
The user has a financial health score of ${healthScore}/100. They want a clear, actionable plan to improve it.
**USER PROFILE:**
- Savings Rate: ${savingsRate.toFixed(2)}%
- Debt: ${formatIndianCurrency(financialSummary.debt || 0)}
- Insurance: Term Life: ${financialSummary.termInsurance}, Health: ${financialSummary.healthInsurance}
- Top Financial Worry: "${financialSummary.financialWorry}"
**YOUR TASK:**
Provide a detailed, medium-length explanation in Markdown on how to improve their financial health score. Focus on the 2-3 most impactful areas based on their profile. Structure your response with clear headings and actionable steps.
## Your Path to a Better Score
Start with an encouraging sentence.
## Priority 1: [Identify the biggest weakness, e.g., Boost Your Savings Rate]
Explain *why* this is important. Provide 2-3 practical, actionable tips.
## Priority 2: [Identify the second biggest weakness, e.g., Strengthen Your Safety Net]
Explain the importance of this area (e.g., insurance or debt reduction). Provide clear next steps.
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
- Monthly Surplus (Income - Expenses): ${formatIndianCurrency(monthlySavings)}
- Goal: Achieve "${g.name}"
- Target Amount: ${formatIndianCurrency(g.targetAmount)}
- Amount Already Saved: ${formatIndianCurrency(g.amountSaved || 0)}
- Target Date: ${formatDate(g.targetDate)}
**Your Task:**
Create a personalized, actionable, and structured investment plan in Markdown.
## Investment Plan for: ${g.name}
Start with an encouraging sentence.
## Current Status & Required Investment
- Calculate the remaining amount needed, number of months left, and required monthly investment (SIP). State this clearly.
## Recommended Investment Strategy
Based on risk tolerance and timeline, recommend 1-2 types of investments (e.g., RD, Debt Fund, Equity Fund). Explain why.
## Next Steps
Provide a clear, 2-step action plan.`;
    try {
        const result = await callGroqAPIWithRetry(prompt);
        setGoalPlanResults(p => ({ ...p, [i]: result }));
    } catch (e) {
        setGoalPlanResults(p => ({ ...p, [i]: `My apologies, Zenvana AI is currently experiencing high traffic.` }));
    } finally {
        setIsGeneratingGoalPlan(p => ({ ...p, [i]: false }));
    }
  };

  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };
  
  const calculateGoalProgress = (g) => {
      if (!g.targetAmount) return null;
      const targetAmount = parseFloat(g.targetAmount);
      const amountSaved = parseFloat(g.amountSaved || 0);
      const progress = Math.min(100, (amountSaved / targetAmount) * 100);
      return { p: progress.toFixed(2), s: progress >= 100 ? 'Achieved!' : 'On Track' };
  };

  if (!financialSummary) { return <div className="text-center p-10">Loading dashboard...</div>; }

  return (
    <section className="space-y-8">
      {/* --- Row 1: Overview --- */}
      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Net Worth</span><span className="font-bold text-3xl text-white mt-1">{formatIndianCurrency(financialSummary.netWorth)}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Income</span><span className="font-bold text-3xl text-green-400 mt-1">{formatIndianCurrency(financialSummary.monthlyIncome)}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Expenses</span><span className="font-bold text-3xl text-yellow-400 mt-1">{formatIndianCurrency(totalMonthlyExpenses)}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Monthly Savings</span><span className="font-bold text-3xl text-green-400 mt-1">{formatIndianCurrency(monthlySavings)}</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Savings Rate</span><span className={`font-bold text-3xl mt-1 ${savingsRate < 0 ? 'text-red-500' : 'text-green-400'}`}>{savingsRate.toFixed(2)}%</span></div>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-center"><span className="text-gray-400 text-sm">Risk Tolerance</span><span className="font-bold text-3xl text-white mt-1 capitalize">{financialSummary.riskTolerance || 'N/A'}</span></div>
        </div>
      </div>

      {/* --- Row 2: AI Snapshot --- */}
      <ZenvanaInsights financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />

      {/* --- Row 3: Health Score & Expenses --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Expense Breakdown</h3>
          <ExpensePieChart expenses={financialSummary.expenses} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Financial Health Score</h3>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center h-full">
             {healthScore === null ? <div className="text-gray-400 m-auto">Calculating...</div> : <>
                <div className={`relative w-40 h-40 flex items-center justify-center`}>
                    <svg className="absolute w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)">
                        <circle className="text-gray-700" cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"></circle>
                        <circle className={`${getScoreColor(healthScore).replace('text-', 'stroke-')}`} strokeDasharray={`${healthScore || 0}, 100`} cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" strokeLinecap="round"></circle>
                    </svg>
                    <div className={`text-5xl font-extrabold ${getScoreColor(healthScore)}`}>{healthScore}</div>
                </div>
                <p className="text-gray-400 mt-4 mb-4 text-center">This score reflects your current financial standing.</p>
                <button onClick={handleGenerateImprovementPlan} className="w-full max-w-sm bg-green-600 font-bold py-3 rounded-xl" disabled={isGeneratingImprovement}>
                  {isGeneratingImprovement ? 'Generating Plan...' : 'Get AI Plan to Improve'}
                </button>
                {improvementPlan && <div className="mt-4 p-3 bg-gray-900 rounded-xl w-full"><MarkdownRenderer text={improvementPlan} /></div>}
            </>}
          </div>
        </div>
      </div>
      
      {/* --- Row 4: Goals --- */}
      <div>
        <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Goals</h3>
        {financialSummary.customGoals?.some(g => g.name) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {financialSummary.customGoals.map((g, i) => {
              const progress = calculateGoalProgress(g);
              return progress ? (
                <div key={i} className="bg-gray-800 p-5 rounded-xl">
                  <div className="flex justify-between items-start mb-3"><h4 className="font-semibold text-xl text-white">{g.name}</h4><div className="text-right"><p className="text-sm text-gray-400">Target</p><p className="font-bold text-lg text-white">{formatIndianCurrency(g.targetAmount)}</p></div></div>
                  <div className="flex justify-between items-center text-sm text-gray-400 mb-2"><span>Progress</span><div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>By {formatDate(g.targetDate)}</span></div></div>
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${progress.p}%` }}></div></div>
                  <p className="text-sm text-right text-gray-300">Saved: {formatIndianCurrency(g.amountSaved || 0)} <span className="text-green-400">({progress.s})</span></p>
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
    </section>
  );
};

export default Dashboard;
