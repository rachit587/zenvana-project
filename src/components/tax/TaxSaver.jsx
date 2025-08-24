import React, { useEffect, useState } from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { formatIndianCurrency, getAge } from '../../lib/utils';

const TaxSaver = ({ financialSummary, callGroqAPIWithRetry }) => {
  const [taxData, setTaxData] = useState({
    salaryIncome:'', otherIncome:'', investments80C:'', hra:'', homeLoanInterest:'',
    medicalInsurance80D:'', nps_80ccd1b:'', educationLoanInterest_80e:''
  });
  const [taxResult, setTaxResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(()=>{ if (financialSummary?.monthlyIncome) {
    const annual = parseFloat(financialSummary.monthlyIncome) * 12;
    setTaxData(p=>({ ...p, salaryIncome: String(annual)}));
  }},[financialSummary]);

  const fields = [
    ['salaryIncome','Annual Salary Income (from Form 16)','Your total gross salary before any deductions.'],
    ['otherIncome','Annual Income from Other Sources','Interest income, rent, capital gains'],
    ['investments80C','Total Investments under 80C','PPF, EPF, ELSS, etc. (Max ₹1,50,000)'],
    ['hra','HRA Exemption','Exempt portion of HRA'],
    ['homeLoanInterest','Home Loan Interest (Sec 24)','Max ₹2,00,000 for self-occupied'],
    ['medicalInsurance80D','Medical Insurance Premium (80D)','Self/family & parents'],
    ['nps_80ccd1b','NPS (80CCD(1B))','Additional ₹50,000'],
    ['educationLoanInterest_80e','Education Loan Interest (80E)','Total interest paid'],
  ];

  const onNum = e => setTaxData(p=>({ ...p, [e.target.name]: e.target.value.replace(/[^0-9]/g,'') }));

  const calcTax = (ti, regime) => {
    let tax = 0, slab = 0;
    if (regime==='old'){
      if (ti <= 500000) return { tax:0, slab:'0%'}
      if (ti > 1000000){ tax = 112500 + (ti-1000000)*0.30; slab=30; }
      else if (ti > 500000){ tax = 12500 + (ti-500000)*0.20; slab=20; }
      else if (ti > 250000){ tax = (ti-250000)*0.05; slab=5; }
    } else {
      if (ti <= 700000) return { tax:0, slab:'0%' }
      if (ti > 1500000){ tax = 150000 + (ti-1500000)*0.30; slab=30; }
      else if (ti > 1200000){ tax = 90000 + (ti-1200000)*0.20; slab=20; }
      else if (ti > 900000){ tax = 45000 + (ti-900000)*0.15; slab=15; }
      else if (ti > 600000){ tax = 15000 + (ti-600000)*0.10; slab=10; }
      else if (ti > 300000){ tax = (ti-300000)*0.05; slab=5; }
    }
    return { tax: Math.round(tax*1.04), slab: `${slab}%` }; // +4% cess
  };

  const run = async () => {
    setIsCalculating(true); setAiAnalysis('');
    const gI = parseFloat(taxData.salaryIncome||0) + parseFloat(taxData.otherIncome||0);
    const tI_new = Math.max(0, gI - 50000);
    const newRes = calcTax(tI_new,'new');
    const deductions = Object.values(taxData).slice(2).reduce((s,v)=>s+parseFloat(v||0),0);
    const tI_old = Math.max(0, gI - 50000 - deductions);
    const oldRes = calcTax(tI_old,'old');

    const better = newRes.tax < oldRes.tax ? 'New' : 'Old';
    const save = Math.abs(newRes.tax - oldRes.tax);
    setTaxResult({ nR:newRes.tax, oR:oldRes.tax, nRSlab:newRes.slab, oRSlab:oldRes.slab, bO:better, s:save });

    const prompt = `
You are ZENVANA, an expert AI Tax Advisor for India.
**USER CONTEXT:** ${financialSummary.name} (Age ${getAge(financialSummary.dateOfBirth)}), Risk ${financialSummary.riskTolerance}
Equity: ${formatIndianCurrency(financialSummary.investments?.equity)}, Debt: ${formatIndianCurrency(financialSummary.investments?.debt)}
Home Loan: ${parseFloat(taxData.homeLoanInterest||0)>0?'Yes':'No'}

**CALC DATA:**
Gross Income: ${formatIndianCurrency(gI)}
Deductions Entered: ${formatIndianCurrency(deductions)}
Recommended Regime: **${better}**
Potential Savings: **${formatIndianCurrency(save)}**
User Inputs: ${JSON.stringify(taxData)}

Create a concise Markdown report:
- Greet the user by name.
- Why the recommended regime wins (for this case).
- Missed opportunities (80C, 80D, 80CCD(1B), etc).
- 2–3 personalized tactics for the next year.
- End with an encouraging next step.`;

    try { setAiAnalysis(await callGroqAPIWithRetry(prompt)); }
    catch { setAiAnalysis('Sorry, I could not generate analysis right now. Please try again.'); }
    finally { setIsCalculating(false); }
  };

  if (!financialSummary) return <div className="p-10">Loading...</div>;

  return (
    <section className="p-6 rounded-2xl bg-gray-900">
      <h2 className="text-3xl font-bold text-green-400 mb-6">Interactive Tax Saver</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-5">
          {fields.map(([name,label,help])=>(
            <div key={name}>
              <label className="block mb-1 font-semibold text-gray-200">{label} (₹)</label>
              <input name={name} value={taxData[name]||''} onChange={onNum} inputMode="numeric" className="w-full p-2 rounded bg-gray-800 border border-gray-700"/>
              <p className="text-xs text-gray-400 mt-1">💡 {help}</p>
            </div>
          ))}
          <button onClick={run} disabled={isCalculating} className="w-full bg-green-600 font-bold py-3 rounded-xl">
            {isCalculating?'Calculating...':'Calculate & Analyze'}
          </button>
        </div>
        <div>
          {taxResult && (
            <div className="bg-gray-800 p-4 rounded-xl mb-4">
              <h3 className="text-xl font-bold text-yellow-400 text-center mb-3">Tax Regime Comparison</h3>
              <div className="text-center mb-4 p-3 rounded-lg bg-green-900">
                <p>The <b>{taxResult.bO} Regime</b> is better for you.</p>
                <p className="text-2xl font-extrabold text-green-400">You save {formatIndianCurrency(taxResult.s)}!</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-700 p-3 rounded-lg"><h4>Old Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.oR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.oRSlab}</p></div>
                <div className="bg-gray-700 p-3 rounded-lg"><h4>New Regime</h4><p className="text-2xl font-bold">{formatIndianCurrency(taxResult.nR)}</p><p className="text-sm text-gray-400">Top Slab: {taxResult.nRSlab}</p></div>
              </div>
            </div>
          )}
          {aiAnalysis && (<div className="bg-gray-800 p-4 rounded-xl"><h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI's Advice</h3><MarkdownRenderer text={aiAnalysis}/></div>)}
        </div>
      </div>
    </section>
  );
};

export default TaxSaver;
