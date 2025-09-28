import React from 'react';

export const formatIndianCurrency = (num) => {
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

export const getAge = (dateString) => {
    if (!dateString) return 30;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const MarkdownRenderer = ({ text }) => {
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

export const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const createFinancialSummaryPrompt = (summary) => {
    if (!summary) return "No financial summary available.";
    const monthlySavings = (summary.monthlyIncome || 0) - (summary.monthlyExpenses || 0);
    return `
- Name: ${summary.name || 'N/A'}
- Age: ${getAge(summary.dateOfBirth) || 'N/A'}
- Monthly Income: ${formatIndianCurrency(summary.monthlyIncome)}
- Monthly Expenses: ${formatIndianCurrency(summary.monthlyExpenses)}
- Monthly Savings: ${formatIndianCurrency(monthlySavings)}
- Risk Tolerance: ${summary.riskTolerance || 'N/A'}
- Primary Goal: "${summary.customGoals?.[0]?.name || 'Not specified'}"
- Emergency Fund: ${formatIndianCurrency(summary.emergencyFund)}
- Investments: ${formatIndianCurrency((parseFloat(summary.investments?.equity || 0)) + (parseFloat(summary.investments?.debt || 0)))}
- High-Interest Debt: ${formatIndianCurrency(summary.liabilities?.highInterest)}
- Health Insurance: ${summary.healthInsurance}
- Term Insurance: ${summary.termInsurance}
    `.trim();
};