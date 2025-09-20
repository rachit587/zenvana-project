import React, { useState, useEffect } from 'react';
import { getGeminiResponse } from '../api/gemini';
import { formatIndianCurrency, getAge, MarkdownRenderer } from '../utils/helpers';

const TaxSaver = ({ financialSummary }) => {
    const [taxData, setTaxData] = useState({
        salaryIncome: '', otherIncome: '', investments80C: '', hra: '', homeLoanInterest: '',
        medicalInsurance80D: '', nps_80ccd1b: '', educationLoanInterest_80e: ''
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

    if (!financialSummary) { return <div className="text-center p-10">Loading financial data...</div>; }

    const taxFields = [
        { name: 'salaryIncome', label: 'Annual Salary Income (from Form 16)', helper: 'Your total gross salary before any deductions.' },
        { name: 'otherIncome', label: 'Annual Income from Other Sources', helper: 'e.g., Interest income, rental income, capital gains.' },
        { name: 'investments80C', label: 'Total Investments under Section 80C', helper: 'PPF, EPF, ELSS, life insurance premiums, etc. (Max: ₹1,50,000)' },
        { name: 'hra', label: 'House Rent Allowance (HRA) Exemption', helper: 'The exempt portion of your HRA.' },
        { name: 'homeLoanInterest', label: 'Interest on Home Loan (Section 24)', helper: 'Interest on home loan. (Max: ₹2,00,000 for self-occupied)' },
        { name: 'medicalInsurance80D', label: 'Medical Insurance Premium (Section 80D)', helper: 'Premium for self/family & parents.' },
        { name: 'nps_80ccd1b', label: 'NPS Contribution (Section 80CCD(1B))', helper: 'Additional contribution to NPS. (Max: ₹50,000)' },
        { name: 'educationLoanInterest_80e', label: 'Interest on Education Loan (Section 80E)', helper: 'Total interest paid on an education loan.' }
    ];
    const handleNumberChange = (e) => { const { name, value } = e.target; setTaxData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') })); };
    
    const calculateTax = (taxableIncome, regime) => {
        let tax = 0;
        let slabRate = 0;
        if (regime === 'old') {
            if (taxableIncome <= 500000) { return { tax: 0, slab: "0%" }; }
            if (taxableIncome > 1000000) { tax = 112500 + (taxableIncome - 1000000) * 0.30; slabRate = 30; } 
            else if (taxableIncome > 500000) { tax = 12500 + (taxableIncome - 500000) * 0.20; slabRate = 20; } 
            else if (taxableIncome > 250000) { tax = (taxableIncome - 250000) * 0.05; slabRate = 5; }
        } else {
            if (taxableIncome <= 700000) { return { tax: 0, slab: "0%" }; }
            if (taxableIncome > 1500000) { tax = 150000 + (taxableIncome - 1500000) * 0.30; slabRate = 30; } 
            else if (taxableIncome > 1200000) { tax = 90000 + (taxableIncome - 1200000) * 0.20; slabRate = 20; } 
            else if (taxableIncome > 900000) { tax = 45000 + (taxableIncome - 900000) * 0.15; slabRate = 15; } 
            else if (taxableIncome > 600000) { tax = 15000 + (taxableIncome - 600000) * 0.10; slabRate = 10; } 
            else if (taxableIncome > 300000) { tax = (taxableIncome - 300000) * 0.05; slabRate = 5; }
        }
        return { tax: Math.round(tax * 1.04), slab: `${slabRate}%` };
    };

    const handleTaxCalculation = async () => {
        setIsCalculating(true); setAiAnalysis('');
        const gI = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);
        const tI_new = Math.max(0, gI - 50000);
        const { tax: nRT, slab: nRSlab } = calculateTax(tI_new, 'new');
        const tD = Object.values(taxData).slice(2).reduce((sum, val) => sum + parseFloat(val || 0), 0);
        const tI_old = Math.max(0, gI - 50000 - tD);
        const { tax: oRT, slab: oRSlab } = calculateTax(tI_old, 'old');
        setTaxResult({ nR: nRT, oR: oRT, bO: nRT < oRT ? 'New' : 'Old', s: Math.abs(nRT - oRT), nRSlab, oRSlab });
        const prompt = `You are ZENVANA, an expert AI Tax Advisor for India, providing analysis for the current financial year. **DEEP USER CONTEXT:**- Name: ${financialSummary.name} (Age: ${getAge(financialSummary.dateOfBirth)})- Risk Tolerance: ${financialSummary.riskTolerance}- Existing Equity Investments: ${formatIndianCurrency(financialSummary.investments?.equity)}- Existing Debt Investments: ${formatIndianCurrency(financialSummary.investments?.debt)}- Has Home Loan: ${parseFloat(taxData.homeLoanInterest || 0) > 0 ? 'Yes' : 'No'}**TAX CALCULATION DATA:**- Gross Income Entered: ${formatIndianCurrency(gI)}- Total Deductions Claimed: ${formatIndianCurrency(tD)}- Recommended Regime (based on calculation): **${nRT < oRT ? 'New' : 'Old'} Regime**- Potential Annual Savings with this regime: **${formatIndianCurrency(Math.abs(nRT - oRT))}**- User's Deduction Inputs: ${JSON.stringify(taxData)}**YOUR TASK:** Generate a high-quality, personalized tax optimization report in Markdown. ## Namaste ${financialSummary.name}, Here's Your Tax Analysis Start with a friendly greeting. State the recommended tax regime and the potential savings clearly upfront. ## Detailed Comparison Provide a clear, side-by-side comparison of the Old vs. New tax regimes. Explain *why* one is better in this specific case (e.g., "The New Regime is better because your claimed deductions are not high enough to make the Old Regime's lower tax slabs beneficial."). ## 💡 Smart Deduction Analysis & Missed Opportunities Analyze the user's deduction inputs. For any key deduction field where the user entered 0 (like 80D, 80CCD1B), highlight this as a potential missed opportunity. Explain the benefit simply. If they have maxed out 80C, praise them: "Great job maxing out your 80C limit!" ## Personalized Tax-Saving Strategies for Next Year This is the most important part. Provide 2-3 **hyper-personalized** and actionable suggestions based on their **DEEP USER CONTEXT**. - **If their equity investments are low and risk tolerance is medium/high**, suggest ELSS as a way to save tax under 80C and build wealth. - **If they are paying home loan interest**, remind them about the principal deduction under 80C. - **Based on their age**, suggest appropriate long-term options (e.g., NPS for someone in their 30s). - **Example:** "Given your 'high' risk tolerance and current equity investments, consider using an Equity Linked Savings Scheme (ELSS) to fulfill your 80C limit. It offers wealth creation potential along with tax benefits." ## Your Path Forward End with an empowering statement about proactive tax planning.`;
        try {
            const result = await getGeminiResponse(prompt);
            setAiAnalysis(result);
        } catch (e) { 
            setAiAnalysis("My apologies, Zenvana AI is currently experiencing high traffic. Please try again in a few moments.");
        } finally { 
            setIsCalculating(false);
        }
    };

    return (
        <section className="p-6 rounded-2xl bg-gray-900">
            <h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-5">
                    {taxFields.map((field) => (
                         <div key={field.name}>
                            <label className="block mb-1 font-semibold text-gray-200">{field.label} (₹)</label>
                            <input type="text" inputMode="numeric" name={field.name} value={taxData[field.name] || ''} onChange={handleNumberChange} className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:ring-green-500 focus:outline-none" />
                            <p className="text-xs text-gray-400 mt-1.5">💡 {field.helper}</p>
                        </div>
                    ))}
                </div>
                  <div>
                     <button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl mb-4 transition transform hover:scale-105 disabled:opacity-50">
                        {isCalculating ? 'Calculating...' : 'Calculate & Analyze'}
                    </button>
                    {taxResult && (
                        <div className="bg-gray-800 p-4 rounded-xl">
                           <h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Tax Regime Comparison</h3>
                            <div className="text-center mb-4 p-3 rounded-lg bg-green-900">
                                <p className="text-lg">The **{taxResult.bO} Regime** is better for you.</p>
                               <p className="text-2xl font-extrabold text-green-400">You save {formatIndianCurrency(taxResult.s)}!</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                           <div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.oR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.oRSlab}</p></div>
                                <div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.nR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.nRSlab}</p></div>
                            </div>
                        </div>
                    )}
                    {aiAnalysis && (
                        <div className="mt-4 bg-gray-800 p-4 rounded-xl">
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
