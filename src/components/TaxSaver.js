// src/components/TaxSaver.js

import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const formatIndianCurrency = (num) => {
    if (typeof num !== 'number') num = parseFloat(num || 0);
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return formatter.format(num);
};

const TaxSaver = ({ financialSummary, callGroqAPIWithRetry }) => {
    const [taxData, setTaxData] = useState({
        salaryIncome: '', otherIncome: '', investments80C: '', hra: '', homeLoanInterest: '', medicalInsurance80D: '', nps_80ccd1b: '', educationLoanInterest_80e: ''
    });
    const [taxResult, setTaxResult] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (financialSummary?.monthlyIncome) {
            const annualIncome = parseFloat(financialSummary.monthlyIncome) * 12;
            setTaxData(prev => ({ ...prev, salaryIncome: annualIncome.toString() }));
        }
    }, [financialSummary]);

    const fieldLabels = { salaryIncome: "Annual Salary Income", otherIncome: "Income from Other Sources", investments80C: "Investments under Section 80C", hra: "House Rent Allowance (HRA)", homeLoanInterest: "Interest on Home Loan (Sec 24)", medicalInsurance80D: "Medical Insurance Premium (Sec 80D)", nps_80ccd1b: "NPS Contribution (Sec 80CCD(1B))", educationLoanInterest_80e: "Interest on Education Loan (Sec 80E)" };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') }));
    };
    
    const calculateTax = (taxableIncome, regime) => {
        let tax = 0;
        let slabRate = 0;

        if (regime === 'old') {
            if (taxableIncome <= 500000) return { tax: 0, slab: "0%" };
            if (taxableIncome > 1000000) { tax = 112500 + (taxableIncome - 1000000) * 0.30; slabRate = 30; } 
            else if (taxableIncome > 500000) { tax = 12500 + (taxableIncome - 500000) * 0.20; slabRate = 20; } 
            else if (taxableIncome > 250000) { tax = (taxableIncome - 250000) * 0.05; slabRate = 5; }
        } else { // New Regime (Default)
            if (taxableIncome <= 700000) return { tax: 0, slab: "0%" };
            if (taxableIncome > 1500000) { tax = 150000 + (taxableIncome - 1500000) * 0.30; slabRate = 30; } 
            else if (taxableIncome > 1200000) { tax = 90000 + (taxableIncome - 1200000) * 0.20; slabRate = 20; } 
            else if (taxableIncome > 900000) { tax = 45000 + (taxableIncome - 900000) * 0.15; slabRate = 15; } 
            else if (taxableIncome > 600000) { tax = 15000 + (taxableIncome - 600000) * 0.10; slabRate = 10; } 
            else if (taxableIncome > 300000) { tax = (taxableIncome - 300000) * 0.05; slabRate = 5; }
        }
        
        const finalTax = Math.round(tax * 1.04); // 4% cess
        return { tax: finalTax, slab: `${slabRate}%` };
    };

    const handleTaxCalculation = async () => {
        setIsCalculating(true); 
        setAiAnalysis('');
        const grossIncome = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        
        // New Regime Calculation
        const taxableIncome_new = Math.max(0, grossIncome - 50000); // Standard Deduction
        const { tax: newRegimeTax, slab: newRegimeSlab } = calculateTax(taxableIncome_new, 'new');

        // Old Regime Calculation
        const totalDeductions = Object.entries(taxData)
            .filter(([key]) => !['salaryIncome', 'otherIncome'].includes(key))
            .reduce((sum, [, value]) => sum + parseFloat(value || 0), 0);
        const taxableIncome_old = Math.max(0, grossIncome - 50000 - totalDeductions);
        const { tax: oldRegimeTax, slab: oldRegimeSlab } = calculateTax(taxableIncome_old, 'old');

        const result = {
            newRegimeTax, oldRegimeTax,
            betterOption: newRegimeTax < oldRegimeTax ? 'New' : 'Old',
            savings: Math.abs(newRegimeTax - oldRegimeTax),
            newRegimeSlab, oldRegimeSlab
        };
        setTaxResult(result);
        
        // --- NEW: Focused AI Prompt ---
        const missedOpportunities = Object.entries(taxData)
            .filter(([key, value]) => !['salaryIncome', 'otherIncome'].includes(key) && parseFloat(value || 0) === 0)
            .map(([key]) => fieldLabels[key])
            .join(', ');

        const prompt = `
You are ZENVANA, an expert AI Tax Advisor for India. Your tone is professional, clear, and actionable.
**USER's SITUATION:**
- Name: ${financialSummary.name || 'User'}
- Recommended Regime: The **${result.betterOption} Regime** is better, saving them **${formatIndianCurrency(result.savings)}**.
- Missed Opportunities: The user has entered 0 for the following deductions: **${missedOpportunities || 'None'}**.

**YOUR TASK:**
Generate a short, high-quality, personalized tax optimization report in Markdown.
1.  **Start with a friendly greeting** and state the recommended regime and savings clearly.
2.  **Analyze Missed Opportunities:** This is the most important part. For each item in "Missed Opportunities", briefly explain what it is and how claiming it could reduce their tax next year. If there are no missed opportunities, praise them for their diligent tax planning.
3.  **Give One Smart Tip:** Provide one additional, actionable tax-saving tip for the next financial year (e.g., tax-loss harvesting, NPS, etc.).`;

        try {
            const aiResult = await callGroqAPIWithRetry(prompt);
            setAiAnalysis(aiResult);
        } catch (e) { 
            setAiAnalysis("My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments.");
        } finally { 
            setIsCalculating(false);
        }
    };

    if (!financialSummary) return <div className="text-center p-10">Loading financial data...</div>;

    return (
        <section className="p-6 rounded-2xl bg-gray-900">
            <h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {Object.keys(fieldLabels).map((key) => (
                        <div key={key}>
                            <label className="block mb-1 text-gray-300">{fieldLabels[key]} (₹)</label>
                            <input type="text" inputMode="numeric" name={key} value={taxData[key] || ''} onChange={handleNumberChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                        </div>
                    ))}
                    <button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 hover:bg-green-500 font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                        {isCalculating ? 'Calculating & Analyzing...' : 'Calculate & Get AI Advice'}
                    </button>
                </div>
                <div className="space-y-4">
                    {taxResult && (
                        <div className="bg-gray-800 p-4 rounded-xl">
                            <h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Tax Regime Comparison</h3>
                            <div className="text-center mb-4 p-3 rounded-lg bg-green-900">
                                <p className="text-lg">The **{taxResult.betterOption} Regime** is better for you.</p>
                                <p className="text-2xl font-extrabold text-green-400">You save {formatIndianCurrency(taxResult.savings)}!</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.oldRegimeTax)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.oldRegimeSlab}</p></div>
                                <div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.newRegimeTax)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.newRegimeSlab}</p></div>
                            </div>
                        </div>
                    )}
                    {aiAnalysis && (
                        <div className="bg-gray-800 p-4 rounded-xl">
                            <h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI's Advice</h3>
                            <MarkdownRenderer text={aiAnalysis} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TaxSaver;
