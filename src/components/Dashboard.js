// src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import ZenvanaInsights from './ZenvanaInsights';
import ExpensePieChart from './ExpensePieChart';
import MarkdownRenderer from './MarkdownRenderer';

// --- Helper Functions ---
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

// ====================================================================================
// --- NEW: Local Financial Health Score Calculator ---
// This function calculates the score instantly and reliably without calling an AI.
// ====================================================================================
const calculateFinancialHealthScore = (summary) => {
    if (!summary || !summary.monthlyIncome) return 0;

    let score = 0;
    const { monthlyIncome, expenses, netWorth, debt, termInsurance, healthInsurance, customGoals } = summary;

    const totalMonthlyExpenses = Object.values(expenses || {}).reduce((sum, value) => sum + parseFloat(value || 0), 0);
    const monthlySavings = parseFloat(monthlyIncome) - totalMonthlyExpenses;
    const annualIncome = parseFloat(monthlyIncome) * 12;

    // 1. Savings Rate (35 points)
    const savingsRate = annualIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    if (savingsRate >= 30) score += 35;
    else if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate > 0) score += 5;

    // 2. Emergency Fund (25 points)
    const emergencyFundCoverage = totalMonthlyExpenses > 0 ? parseFloat(netWorth || 0) / totalMonthlyExpenses : 0;
    if (emergencyFundCoverage >= 6) score += 25;
    else if (emergencyFundCoverage >= 3) score += 15;
    else if (emergencyFundCoverage >= 1) score += 5;

    // 3. Insurance Coverage (20 points)
    if (healthInsurance === 'yes') score += 10;
    if (termInsurance === 'yes') score += 10;

    // 4. Debt-to-Income Ratio (10 points)
    const dti = annualIncome > 0 ? (parseFloat(debt || 0) / annualIncome) * 100 : 0;
    if (dti < 20) score += 10;
    else if (dti <= 40) score += 5;

    // 5. Goal Setting (10 points)
    if (customGoals?.some(g => g.name)) score += 10;
    
    return Math.round(score);
};


const Dashboard = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [improvementPlan, setImprovementPlan] = useState('');
  const [isGeneratingImprovement, setIsGeneratingImprovement] = useState(false);

  // Calculate total monthly expenses and savings
  const totalMonthlyExpenses = Object.values(financialSummary?.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
  const monthlySavings = (financialSummary?.monthlyIncome || 0) - totalMonthlyExpenses;
  const savingsRate = financialSummary?.monthlyIncome > 0 ? ((monthlySavings / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;

  useEffect(() => {
    // When the component loads, calculate the score locally
    if (financialSummary) {
      const score = calculateFinancialHealthScore(financialSummary);
      setHealthScore(score);
    }
  }, [financialSummary]);

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
  
  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-500';
  };

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

  return (
    <section className="space-y-8">
      {/* --- Row 1: AI Snapshot --- */}
      <ZenvanaInsights financialSummary={financialSummary} callGroqAPIWithRetry={callGroqAPIWithRetry} />

      {/* --- Row 2: Health Score & Expenses --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Expense Breakdown</h3>
          <ExpensePieChart expenses={financialSummary.expenses} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Financial Health Score</h3>
          <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center h-full">
            {healthScore === null ? (
              <div className="text-gray-400 m-auto">Calculating...</div>
            ) : (
              <>
                <div className={`relative w-40 h-40 flex items-center justify-center`}>
                    <svg className="absolute w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)">
                        <circle className="text-gray-700" cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"></circle>
                        <circle className={`${getScoreColor(healthScore).replace('text-', 'stroke-')}`} strokeDasharray={`${healthScore || 0}, 100`} cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" strokeLinecap="round"></circle>
                    </svg>
                    <div className={`text-5xl font-extrabold ${getScoreColor(healthScore)}`}>
                        {healthScore}
                    </div>
                </div>
                <p className="text-gray-400 mt-4 mb-4 text-center">This score reflects your current financial standing.</p>
                <button onClick={handleGenerateImprovementPlan} className="w-full max-w-sm bg-green-600 font-bold py-3 rounded-xl" disabled={isGeneratingImprovement}>
                  {isGeneratingImprovement ? 'Generating Plan...' : 'Get AI Plan to Improve'}
                </button>
                {improvementPlan && <div className="mt-4 p-3 bg-gray-900 rounded-xl w-full"><MarkdownRenderer text={improvementPlan} /></div>}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
