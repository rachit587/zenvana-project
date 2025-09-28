// src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCloudflareStreamedResponse } from '../api/cloudflare';
import { formatIndianCurrency, getAge, MarkdownRenderer, createFinancialSummaryPrompt } from '../utils/helpers';

const ExpensePieChart = ({ expenses }) => {
  const chartData = Object.entries(expenses || {}).map(([key, value]) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), value: parseFloat(value || 0) })).filter(item => item.value > 0);
  const COLORS = ['#10B981', '#FBBF24', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F59E0B', '#6366F1', '#D946EF'];
  if (chartData.length === 0) { 
    return ( <div className="bg-gray-800 p-5 rounded-xl flex items-center justify-center h-full min-h-[300px]"><p className="text-gray-400">No expense data to display.</p></div> );
  }

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

const Dashboard = ({ financialSummary }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [isCalculatingHealth, setIsCalculatingHealth] = useState(true);
  const [improvementPlan, setImprovementPlan] = useState('');
  const [isGeneratingImprovement, setIsGeneratingImprovement] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({});
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({});

  useEffect(() => {
    const calculateAdvancedHealthScore = () => {
        if (!financialSummary) return;
        setIsCalculatingHealth(true);
        const { dateOfBirth, dependents, monthlyIncome, monthlyExpenses, termInsurance, healthInsurance, investments, liabilities, emergencyFund } = financialSummary;
        const age = getAge(dateOfBirth);
        const getPersona = (age, deps) => {
            const numDeps = parseInt(deps, 10);
            if (isNaN(numDeps) || numDeps <= 0) {
              return age < 30 ? 'Young Accumulator' : 'Established Protector';
            }
            return 'Family Builder';
        };
        const persona = getPersona(age, dependents || 0);
        const monthlySavings = parseFloat(monthlyIncome || 0) - parseFloat(monthlyExpenses || 0);
        const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : -1;
        const weights = {
            'Young Accumulator': { savings: 30, emergency: 20, debt: 20, insurance: 10, investment: 20 },
            'Family Builder': { savings: 20, emergency: 30, debt: 15, insurance: 25, investment: 10 },
            'Established Protector': { savings: 25, emergency: 25, debt: 20, insurance: 20, investment: 10 }
        };
        const personaWeights = weights[persona];
        let rawScores = { savings: 0, emergency: 0, debt: 0, insurance: 0, investment: 0 };
        if (savingsRate >= 30) rawScores.savings = 1; else if (savingsRate >= 15) rawScores.savings = 0.7; else if (savingsRate >= 5) rawScores.savings = 0.4;
        const emergencyMonths = monthlyExpenses > 0 ? parseFloat(emergencyFund || 0) / monthlyExpenses : 12;
        if (emergencyMonths >= 6) rawScores.emergency = 1; else if (emergencyMonths >= 3) rawScores.emergency = 0.7; else if (emergencyMonths >= 1) rawScores.emergency = 0.3;
        const highInterestDebt = parseFloat(liabilities?.highInterest || 0);
        if (highInterestDebt === 0) rawScores.debt = 1; else if (highInterestDebt / (monthlyIncome * 12) < 0.1) rawScores.debt = 0.5; else rawScores.debt = 0.1;
        const healthScoreValue = healthInsurance === 'yes' ? 1 : 0; const lifeScore = termInsurance === 'yes' ? 1 : 0;
        rawScores.insurance = (healthScoreValue * 0.5) + (lifeScore * 0.5);
        const totalInvestments = Object.values(investments || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
        if (totalInvestments / (monthlyIncome * 12) > 1) rawScores.investment = 1; else if (totalInvestments > 0) rawScores.investment = 0.5;
        let finalScore = Object.keys(rawScores).reduce((acc, factor) => acc + rawScores[factor] * personaWeights[factor], 0);
        if (savingsRate < 0) finalScore -= 10;
        setHealthScore(Math.max(0, Math.min(100, Math.round(finalScore))));
        setIsCalculatingHealth(false);
    };
    calculateAdvancedHealthScore();
  }, [financialSummary]);

  if (!financialSummary) { return (<div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">Loading Financial Data...</div>); }

  const mS = (financialSummary?.monthlyIncome || 0) - (financialSummary?.monthlyExpenses || 0);
  const sR = financialSummary?.monthlyIncome > 0 ? ((mS / parseFloat(financialSummary.monthlyIncome)) * 100) : 0;
  const cGP = (g) => { if (!g.targetAmount) return null; const tA = parseFloat(g.targetAmount); const aS = parseFloat(g.amountSaved || 0);
  const p = Math.min(100, (aS / tA) * 100); return { p: p.toFixed(2), s: p >= 100 ? 'Achieved!' : 'On Track' }; };
  const getScoreColor = (score) => { if (score === null) return 'text-gray-400';
  if (score >= 75) return 'text-green-400'; if (score >= 50) return 'text-yellow-400'; return 'text-red-500'; };
  const formatDate = (dateString) => { if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' }; return new Date(dateString).toLocaleDateString('en-IN', options); };

  const handleGeneratePlan = async (type, goal = null, index = null) => {
    let prompt;
    const summaryPrompt = createFinancialSummaryPrompt(financialSummary);

    if (type === 'improvement') {
        setIsGeneratingImprovement(true);
        setImprovementPlan('');
        prompt = `INSTRUCTIONS: You are ZENVANA AI, a financial advisor. The user's financial health score is ${healthScore}/100. Provide a concise, actionable plan in Markdown to improve their score. Focus on the top 2-3 most impactful areas.
---
**USER'S PROFILE SUMMARY:**
${summaryPrompt}`;
    } else if (type === 'goal') {
        setIsGeneratingGoalPlan(prev => ({ ...prev, [index]: true }));
        setGoalPlanResults(prev => ({ ...prev, [index]: '' }));
        prompt = `INSTRUCTIONS: You are ZENVANA AI, a financial advisor. Create a concise, actionable investment plan in Markdown for the user's specific goal. Calculate and state the required monthly SIP. Recommend an investment strategy using asset categories (e.g., Index Fund, ELSS), not specific fund names.
---
**USER'S PROFILE SUMMARY:**
${summaryPrompt}
---
**SPECIFIC GOAL TO ANALYZE:**
- Goal Name: "${goal.name}"
- Target Amount: ${formatIndianCurrency(goal.targetAmount)}
- Amount Already Saved: ${formatIndianCurrency(goal.amountSaved || 0)}
- Target Date: ${formatDate(goal.targetDate)}`;
    } else {
        return;
    }

    const messagesForAPI = [{ role: "user", content: prompt }];
    
    await getCloudflareStreamedResponse(messagesForAPI, (chunk) => {
        if (type === 'improvement') {
            setImprovementPlan(prev => prev + chunk);
        } else if (type === 'goal') {
            setGoalPlanResults(prev => ({ ...prev, [index]: (prev[index] || '') + chunk }));
        }
    });

    if (type === 'improvement') {
        setIsGeneratingImprovement(false);
    } else if (type === 'goal') {
        setIsGeneratingGoalPlan(prev => ({ ...prev, [index]: false }));
    }
  };
  
  return (
      <section className="space-y-8" data-aos="fade-up">
        <div>
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Namaste, {financialSummary.name}! Here's Your Financial Overview.</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Net Worth</span><span className="font-bold text-3xl text-white mt-1 block">{formatIndianCurrency(financialSummary.netWorth)}</span></div>
            <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Monthly Income</span><span className="font-bold text-3xl text-green-400 mt-1 block">{formatIndianCurrency(financialSummary.monthlyIncome)}</span></div>
            <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Monthly Expenses</span><span className="font-bold text-3xl text-yellow-400 mt-1 block">{formatIndianCurrency(financialSummary.monthlyExpenses)}</span></div>
            <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Monthly Savings</span><span className="font-bold text-3xl text-green-400 mt-1 block">{formatIndianCurrency(mS)}</span></div>
            <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Savings Rate</span><span className={`font-bold text-3xl mt-1 block ${sR < 10 ? 'text-red-500' : 'text-green-400'}`}>{sR.toFixed(1)}%</span></div>
            <div className="bg-gray-800 p-5 rounded-xl"><span className="text-gray-400 text-sm">Risk Tolerance</span><span className="font-bold text-3xl text-white mt-1 block capitalize">{financialSummary.riskTolerance || 'N/A'}</span></div>
          </div>
        </div>

        <div className="flex flex-col space-y-8">
            <div data-aos="fade-up">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">Financial Health Score</h3>
                <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center justify-center">
                    {isCalculatingHealth ? ( <div className="text-gray-400 m-auto">Calculating...</div> ) : (
                    <>
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="absolute w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)">
                                <circle className="text-gray-700" cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3"></circle>
                                <circle className={`${getScoreColor(healthScore).replace('text-', 'stroke-')}`} strokeDasharray={`${healthScore || 0}, 100`} cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" strokeLinecap="round" style={{transition: 'stroke-dasharray 1s ease-in-out'}}></circle>
                            </svg>
                            <div className={`text-5xl font-extrabold drop-shadow-lg ${getScoreColor(healthScore)}`}>{healthScore !== null ? healthScore : '--'}</div>
                        </div>
                        <p className="text-gray-400 mt-6 mb-4 text-center">This score reflects your current financial standing.</p>
                        <button onClick={() => handleGeneratePlan('improvement')} className="w-full max-w-sm bg-green-600 font-bold py-3 rounded-xl disabled:opacity-50" disabled={isGeneratingImprovement}>
                            {isGeneratingImprovement ? 'Generating Plan...' : 'Get AI Plan to Improve'}
                        </button>
                        {improvementPlan && <div className="mt-4 p-4 bg-gray-900 rounded-xl w-full max-w-2xl text-left"><MarkdownRenderer text={improvementPlan} /></div>}
                    </>
                    )}
                </div>
            </div>
            <div data-aos="fade-up">
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">Expense Breakdown</h3>
                <ExpensePieChart expenses={financialSummary.expenses} />
            </div>
        </div>
        
        <div className="mt-8" data-aos="fade-up">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4">Your Goals</h3>
          {financialSummary.customGoals?.some(g => g.name) ? (
            <div className="space-y-6">
              {financialSummary.customGoals.map((g, i) => {
                const pr = cGP(g);
                return pr ? (
                  <div key={i} className="bg-gray-800 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-3"><h4 className="font-semibold text-xl text-white">{g.name}</h4><div className="text-right"><p className="text-sm text-gray-400">Target</p><p className="font-bold text-lg text-white">{formatIndianCurrency(g.targetAmount)}</p></div></div>
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2"><span>Progress</span><div className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>By {formatDate(g.targetDate)}</span></div></div>
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-2"><div className="bg-green-500 h-4 rounded-full" style={{ width: `${pr.p}%` }}></div></div>
                    <p className="text-sm text-right text-gray-300">Saved: {formatIndianCurrency(g.amountSaved || 0)} <span className="text-green-400">({pr.s})</span></p>
                    <button onClick={() => handleGeneratePlan('goal', g, i)} className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-xl transition-colors disabled:opacity-50" disabled={isGeneratingGoalPlan[i]}>
                        {isGeneratingGoalPlan[i] ? 'Generating Plan...' : 'Generate AI Plan'}
                    </button>
                    {goalPlanResults[i] && <div className="mt-4 p-4 bg-gray-900 rounded-xl w-full text-left"><MarkdownRenderer text={goalPlanResults[i]} /></div>}
                  </div>
                ) : null;
              })}
            </div>
          ) : (<div className="bg-gray-800 p-5 rounded-xl text-center text-gray-400">You haven't set any financial goals yet. Add them in your Profile.</div>)}
        </div>
      </section>
  );
};

export default Dashboard;