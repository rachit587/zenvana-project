// src/components/ZenvanaInsights.js

import React, { useState, useEffect } from 'react';

const formatIndianCurrency = (num) => {
    if (typeof num !== 'number') num = parseFloat(num || 0);
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return formatter.format(num);
};

const ZenvanaInsights = ({ financialSummary, callGroqAPIWithRetry }) => {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const generateInsights = async () => {
            if (!financialSummary) return;
            setIsLoading(true);
            setError(null);

            const { name, monthlyIncome, expenses, debt, termInsurance, healthInsurance, customGoals, financialWorry } = financialSummary;

            const totalMonthlyExpenses = Object.values(expenses || {}).reduce((sum, value) => sum + parseFloat(value || 0), 0);
            const monthlySavings = parseFloat(monthlyIncome || 0) - totalMonthlyExpenses;
            const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

            const prompt = `
You are ZENVANA, an expert AI financial advisor for India. Your analysis must be sharp, empathetic, and actionable.
Your task is to analyze the following user profile and generate the top 3 most critical and relevant financial insights.

**USER PROFILE FOR ANALYSIS:**
- Name: ${name}
- Monthly Income: ${formatIndianCurrency(monthlyIncome)}
- Total Monthly Expenses: ${formatIndianCurrency(totalMonthlyExpenses)}
- Monthly Savings Rate: ${savingsRate.toFixed(1)}%
- Total Debt: ${formatIndianCurrency(debt || 0)}
- Has Term Life Insurance: ${termInsurance}
- Has Health Insurance: ${healthInsurance}
- Has Financial Goals: ${customGoals?.length > 0 && customGoals[0].name ? 'Yes' : 'No'}
- Biggest Financial Worry: "${financialWorry}"

**YOUR INSTRUCTIONS:**
You must identify the top 3 most important insights from the user's profile based on this priority:
1.  **Critical Safety Net:** A lack of Health or Term Insurance ('no') is the highest priority 'alert'.
2.  **Debt Issues:** High debt is the second priority 'alert'.
3.  **Savings Issues:** A savings rate below 15% is a high priority 'opportunity'.
4.  **Positive Actions:** Acknowledge good habits (like having insurance or goals) with a 'kudos' insight if there are no urgent alerts or opportunities.

**YOUR RESPONSE FORMAT:**
You MUST respond ONLY with a valid JSON array containing exactly 3 insight objects. Do not write any introductory text, explanations, or comments outside of the JSON structure.

**Example of a valid JSON response:**
[
  {"type": "alert", "title": "Critical: No Health Insurance", "description": "A medical emergency is a huge financial risk. Securing a health plan for yourself and your family should be your #1 priority."},
  {"type": "opportunity", "title": "Boost Your Savings", "description": "Your savings rate is a bit low. Let's explore ways to trim expenses so you can invest more towards your goals."},
  {"type": "kudos", "title": "Great Goal Setting!", "description": "It's fantastic that you've set clear financial goals. This is the first step towards achieving them."}
]
`;
            try {
                const result = await callGroqAPIWithRetry(prompt);
                const jsonMatch = result.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const parsedInsights = JSON.parse(jsonMatch[0]);
                    setInsights(parsedInsights);
                } else {
                    console.error("AI Response was not valid JSON:", result);
                    throw new Error("AI did not return valid JSON.");
                }
            } catch (err) {
                console.error("Error generating or parsing insights:", err);
                setError("Could not generate AI insights at this time. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        generateInsights();
    }, [financialSummary, callGroqAPIWithRetry]);

    // The single, correct definition of InsightCard
    const InsightCard = ({ insight }) => {
        const config = {
            alert: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
                borderColor: 'border-red-500',
                shadowColor: 'hover:shadow-red-glow'
            },
            opportunity: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
                borderColor: 'border-yellow-500',
                shadowColor: 'hover:shadow-yellow-glow'
            },
            kudos: {
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-2.7 5.4M7 14h6M7 17h6m-6-3h6" /></svg>,
                borderColor: 'border-green-500',
                shadowColor: 'hover:shadow-green-glow'
            }
        };
        const { icon, borderColor, shadowColor } = config[insight.type] || config.opportunity;
        return (
            <div className={`bg-gray-800 p-5 rounded-2xl border-l-4 ${borderColor} ${shadowColor} transition-shadow duration-300 flex items-start space-x-4`}>
                <div className="flex-shrink-0">{icon}</div>
                <div>
                    <h4 className="font-bold text-lg text-white">{insight.title}</h4>
                    <p className="text-gray-300">{insight.description}</p>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
             <div className="bg-gray-800 p-5 rounded-2xl text-center">
                <p className="text-gray-400 animate-pulse">Zenvana AI is analyzing your profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900 bg-opacity-50 p-5 rounded-2xl text-center">
                <p className="text-red-300">{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Namaste, {financialSummary.name}! Here's Your AI Snapshot.</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                ))}
            </div>
        </div>
    );
};

export default ZenvanaInsights;
