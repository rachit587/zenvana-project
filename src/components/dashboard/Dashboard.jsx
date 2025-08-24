import React, { useEffect, useState } from 'react';
import { formatIndianCurrency } from '../../lib/utils';
import MarkdownRenderer from '../common/MarkdownRenderer';

const Dashboard = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [healthScore, setHealthScore] = useState(null);
  const [plan, setPlan] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(()=> {
    if (!financialSummary) return;
    // simple scoring (same spirit as v1)
    const income = parseFloat(financialSummary.monthlyIncome||0);
    const expenses = parseFloat(financialSummary.monthlyExpenses||0);
    const savingsRate = income>0? ((income-expenses)/income)*100 : 0;
    let score = 20;
    if (savingsRate >= 30) score += 30; else if (savingsRate >= 15) score += 20; else if (savingsRate >= 5) score += 10;
    if (financialSummary.healthInsurance === 'yes') score += 10;
    if (financialSummary.termInsurance === 'yes') score += 10;
    if ((financialSummary.emergencyFund || 0) / (expenses || 1) >= 6) score += 20;
    setHealthScore(Math.max(0, Math.min(100, Math.round(score))));
  }, [financialSummary]);

  const genPlan = async () => {
    setBusy(true); setPlan('');
    const prompt = `You are ZENVANA. User health score: ${healthScore}. Income: ${formatIndianCurrency(financialSummary.monthlyIncome)}, Expenses: ${formatIndianCurrency(financialSummary.monthlyExpenses)}.
Create a short, high-impact improvement plan (Markdown).`;
    try { setPlan(await callGroqAPIWithRetry(prompt)); }
    catch { setPlan('Could not generate a plan. Please try again.'); }
    finally { setBusy(false); }
  };

  if (!financialSummary) return null;

  const monthlySavings = (financialSummary.monthlyIncome||0) - (financialSummary.monthlyExpenses||0);

  return (
    <section className="space-y-6">
      <h3 className="text-2xl font-bold text-yellow-400">Namaste, {financialSummary.name}! Here’s Your Financial Overview.</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Tile title="Net Worth" value={formatIndianCurrency(financialSummary.netWorth)} />
        <Tile title="Monthly Income" value={formatIndianCurrency(financialSummary.monthlyIncome)} accent="text-green-400"/>
        <Tile title="Monthly Expenses" value={formatIndianCurrency(financialSummary.monthlyExpenses)} accent="text-yellow-400"/>
        <Tile title="Monthly Savings" value={formatIndianCurrency(monthlySavings)} accent="text-green-400"/>
        <Tile title="Risk Tolerance" value={(financialSummary.riskTolerance||'N/A').toUpperCase()} />
        <Tile title="Health Score" value={healthScore ?? '--'} />
      </div>

      <div className="bg-gray-800 p-5 rounded-xl">
        <button onClick={genPlan} disabled={busy} className="bg-green-600 py-2 px-4 rounded-xl">{busy?'Generating...':'Get AI Plan to Improve'}</button>
        {plan && <div className="mt-4 p-3 bg-gray-900 rounded-xl"><MarkdownRenderer text={plan}/></div>}
      </div>
    </section>
  );
};

const Tile = ({ title, value, accent }) => (
  <div className="bg-gray-800 p-5 rounded-xl">
    <div className="text-sm text-gray-400">{title}</div>
    <div className={`text-3xl font-bold ${accent||'text-white'}`}>{value}</div>
  </div>
);

export default Dashboard;
