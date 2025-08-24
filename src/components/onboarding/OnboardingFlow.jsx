import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Step1 = ({ data, onChange, next }) => {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 1: Personal Details</h3>
      <div className="space-y-6">
        <Field label="Your Full Name"><input name="name" value={data.name} onChange={onChange} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
        <Field label="Your Date of Birth"><input type="date" name="dateOfBirth" value={data.dateOfBirth} onChange={onChange} max={today} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
        <Field label="Marital Status">
          <select name="maritalStatus" value={data.maritalStatus} onChange={onChange} className="w-full p-3 rounded-xl bg-gray-800">
            <option value="">Select one</option><option value="single">Single</option><option value="married">Married</option>
          </select>
        </Field>
        <Field label="Number of Dependents"><input name="dependents" value={data.dependents} onChange={numOnly(onChange)} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
        <button onClick={next} className="w-full bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 rounded-xl">Next</button>
      </div>
    </div>
  );
};

const Step2 = ({ data, setData, next, prev }) => {
  const cats = ['housing','food','transportation','utilities','entertainment','healthcare','personalCare','education','debtPayments','miscellaneous'];
  const onExpense = e => setData(p=>({ ...p, expenses:{ ...p.expenses, [e.target.name]: e.target.value.replace(/[^0-9]/g,'') }}));
  const onIncome  = e => setData(p=>({ ...p, [e.target.name]: e.target.value.replace(/[^0-9]/g,'') }));
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 2: Your Cash Flow</h3>
      <Field label="Average Monthly Take-Home Income (₹)"><input name="monthlyIncome" value={data.monthlyIncome} onChange={onIncome} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {cats.map(c=>(
          <div key={c} className="grid grid-cols-2 gap-4 items-center">
            <label className="text-gray-300 font-semibold">{c}</label>
            <input name={c} value={data.expenses?.[c]||''} onChange={onExpense} className="p-2 rounded bg-gray-900"/>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={prev} className="bg-gray-700 py-2 px-6 rounded-xl">Previous</button>
        <button onClick={next} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-xl">Next</button>
      </div>
    </div>
  );
};

const Step3 = ({ data, setData, next, prev }) => {
  const onNested = (parent, child) => e => setData(p=>({ ...p, [parent]: { ...p[parent], [child]: e.target.value.replace(/[^0-9]/g,'') }}));
  const onField  = e => setData(p=>({ ...p, [e.target.name]: e.target.value.replace(/[^0-9]/g,'') }));
  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 3: Your Financial Snapshot</h3>
      <Section title="Your Assets">
        <Field label="Emergency Fund (₹)"><input name="emergencyFund" value={data.emergencyFund} onChange={onField} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
        {['equity','debt','realEstate','gold'].map(k=>(
          <Field key={k} label={`${k[0].toUpperCase()+k.slice(1)} Investments (₹)`}>
            <input value={data.investments[k]} onChange={onNested('investments',k)} className="w-full p-3 rounded-xl bg-gray-800"/>
          </Field>
        ))}
      </Section>
      <Section title="Your Liabilities">
        <Field label="High-Interest Debt (₹)"><input value={data.liabilities.highInterest} onChange={onNested('liabilities','highInterest')} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
        <Field label="Low-Interest Debt (₹)"><input value={data.liabilities.lowInterest} onChange={onNested('liabilities','lowInterest')} className="w-full p-3 rounded-xl bg-gray-800"/></Field>
      </Section>
      <div className="flex justify-between mt-6">
        <button onClick={prev} className="bg-gray-700 py-2 px-6 rounded-xl">Previous</button>
        <button onClick={next} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-xl">Next</button>
      </div>
    </div>
  );
};

const Step4 = ({ data, onChange, next, prev }) => (
  <div data-aos="fade-in">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 4: Your Safety Net & Strategy</h3>
    <Field label="Do you have separate Health Insurance?">
      <select name="healthInsurance" value={data.healthInsurance} onChange={onChange} className="w-full p-3 rounded-xl bg-gray-800">
        <option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option>
      </select>
    </Field>
    {data.healthInsurance==='yes' && <Field label="Health Insurance Coverage (₹)"><input name="healthInsuranceCoverage" value={data.healthInsuranceCoverage} onChange={numOnly(onChange)} className="w-full p-3 rounded-xl bg-gray-800"/></Field>}
    <Field label="Do you have Term Life Insurance?">
      <select name="termInsurance" value={data.termInsurance} onChange={onChange} className="w-full p-3 rounded-xl bg-gray-800">
        <option value="">Select one</option><option value="yes">Yes</option><option value="no">No</option>
      </select>
    </Field>
    {data.termInsurance==='yes' && <Field label="Term Insurance Coverage (₹)"><input name="termInsuranceCoverage" value={data.termInsuranceCoverage} onChange={numOnly(onChange)} className="w-full p-3 rounded-xl bg-gray-800"/></Field>}
    <Field label="Risk Tolerance">
      <select name="riskTolerance" value={data.riskTolerance} onChange={onChange} className="w-full p-3 rounded-xl bg-gray-800">
        <option value="">Select one</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
      </select>
    </Field>
    <Field label="Biggest Financial Worry">
      <select name="financialWorry" value={data.financialWorry} onChange={onChange} className="w-full p-3 rounded-xl bg-gray-800">
        <option value="">Select one</option><option value="retirement">Retirement</option><option value="debt">Debt</option><option value="taxes">Taxes</option><option value="investing">Investing</option><option value="expenses">Expenses</option>
      </select>
    </Field>
    <div className="flex justify-between mt-6">
      <button onClick={prev} className="bg-gray-700 py-2 px-6 rounded-xl">Previous</button>
      <button onClick={next} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-xl">Next</button>
    </div>
  </div>
);

const Step5 = ({ data, setData, prev, submit, isSubmitting }) => {
  const today = new Date().toISOString().split('T')[0];
  const onGoal = (i) => (e) => {
    const { name, value } = e.target;
    const arr = [...data.customGoals];
    arr[i] = { ...arr[i], [name]: name==='name'? value : value.replace(/[^0-9-]/g,'') };
    setData(p=>({ ...p, customGoals: arr }));
  };
  const add = () => setData(p=>({ ...p, customGoals:[...p.customGoals, { name:'', targetAmount:'', amountSaved:'', targetDate:'' }] }));
  const remove = (i) => setData(p=>({ ...p, customGoals: p.customGoals.filter((_,idx)=>idx!==i) }));

  return (
    <div data-aos="fade-in">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Step 5: Your Financial Goals</h3>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {data.customGoals.map((g,i)=>(
          <div key={i} className="bg-gray-700 p-4 rounded-xl">
            <div className="flex justify-between mb-2"><span className="font-semibold">Goal {i+1}</span>{data.customGoals.length>1&&<button className="text-red-400" onClick={()=>remove(i)}>Remove</button>}</div>
            <label className="block mt-2">Goal Name</label>
            <input name="name" value={g.name||''} onChange={onGoal(i)} className="w-full p-2 rounded bg-gray-800"/>
            <label className="block mt-2">Target Amount (₹)</label>
            <input name="targetAmount" value={g.targetAmount||''} onChange={onGoal(i)} className="w-full p-2 rounded bg-gray-800"/>
            <label className="block mt-2">Amount Already Saved (₹)</label>
            <input name="amountSaved" value={g.amountSaved||''} onChange={onGoal(i)} className="w-full p-2 rounded bg-gray-800"/>
            <label className="block mt-2">Target Date</label>
            <input type="date" name="targetDate" value={g.targetDate||''} min={today} onChange={onGoal(i)} className="w-full p-2 rounded bg-gray-800"/>
          </div>
        ))}
      </div>
      <button onClick={add} className="w-full bg-green-700 mt-3 py-2 rounded-xl">+ Add Another Goal</button>
      <div className="flex justify-between mt-6">
        <button onClick={prev} className="bg-gray-700 py-2 px-6 rounded-xl">Previous</button>
        <button onClick={submit} disabled={isSubmitting} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-3 px-8 rounded-xl">{isSubmitting?'Saving...':'Complete Onboarding'}</button>
      </div>
    </div>
  );
};

const OnboardingFlow = ({ onSubmit, initialData, isSubmitting }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initialData || {
    name:'', dateOfBirth:'', maritalStatus:'', dependents:'', monthlyIncome:'',
    expenses:{}, emergencyFund:'', investments:{ equity:'', debt:'', realEstate:'', gold:'' },
    liabilities:{ highInterest:'', lowInterest:'' },
    healthInsurance:'', healthInsuranceCoverage:'', termInsurance:'', termInsuranceCoverage:'',
    riskTolerance:'', financialWorry:'', customGoals:[{ name:'', targetAmount:'', amountSaved:'', targetDate:'' }],
  });

  useEffect(()=>{ AOS.init({ duration: 600, once: true }); },[step]);

  const onChange = (e) => {
    const { name, value, type } = e.target;
    const numeric = ['dependents','monthlyIncome','emergencyFund','healthInsuranceCoverage','termInsuranceCoverage'];
    setData(p => ({ ...p, [name]: (type==='text' && numeric.includes(name)) ? value.replace(/[^0-9]/g,'') : value }));
  };

  const submit = () => {
    const assets = ['equity','debt','realEstate','gold'].reduce((s,k)=>s+parseFloat(data.investments[k]||0), parseFloat(data.emergencyFund||0));
    const liabilities = ['highInterest','lowInterest'].reduce((s,k)=>s+parseFloat(data.liabilities[k]||0), 0);
    const monthlyExpenses = Object.values(data.expenses||{}).reduce((s,v)=>s+parseFloat(v||0), 0);
    onSubmit({ ...data, netWorth: assets-liabilities, debt: liabilities, monthlyExpenses });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="bg-gray-900 p-8 rounded-3xl max-w-3xl w-full">
        {step===1 && <Step1 data={data} onChange={onChange} next={()=>setStep(2)} />}
        {step===2 && <Step2 data={data} setData={setData} next={()=>setStep(3)} prev={()=>setStep(1)} />}
        {step===3 && <Step3 data={data} setData={setData} next={()=>setStep(4)} prev={()=>setStep(2)} />}
        {step===4 && <Step4 data={data} onChange={onChange} next={()=>setStep(5)} prev={()=>setStep(3)} />}
        {step===5 && <Step5 data={data} setData={setData} prev={()=>setStep(4)} submit={submit} isSubmitting={isSubmitting} />}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (<div className="mb-4"><label className="block text-gray-300 mb-1 font-semibold">{label}</label>{children}</div>);
const Section = ({ title, children }) => (<div className="mb-4"><h4 className="text-xl font-bold text-yellow-400 mb-2">{title}</h4><div className="space-y-3">{children}</div></div>);
const numOnly = (fn) => (e) => fn({ target:{ name:e.target.name, value:e.target.value.replace(/[^0-9]/g,'') }, preventDefault:()=>{} });

export default OnboardingFlow;
