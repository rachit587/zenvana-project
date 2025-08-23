import React, { useEffect, useState, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AOS from "aos";
import "aos/dist/aos.css";

/* ---------- Firebase Web Config (client-safe) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyDjN0_LU5WEtCNLNryPIUjavIJAOXghCCQ",
  authDomain: "zenvana-web.firebaseapp.com",
  projectId: "zenvana-web",
  storageBucket: "zenvana-web.appspot.com",
  messagingSenderId: "783039988566",
  appId: "1:783039988566:web:6e8948d86341d4805eccf7",
  measurementId: "G-TVZF4SK0YG"
};

/* ---------- Utils ---------- */
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
const formatINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
const getAge = (dob) => { if (!dob) return 30; const d = new Date(dob); const t = new Date(); let a = t.getFullYear()-d.getFullYear(); const m=t.getMonth()-d.getMonth(); if(m<0||(m===0&&t.getDate()<d.getDate())) a--; return a; };
const Markdown = ({ text }) => {
  if (!text) return null;
  const line = (l, i) => {
    if (l.startsWith("### ")) return <h3 key={i} style={{margin:"8px 0"}}>{l.slice(4)}</h3>;
    if (l.startsWith("## "))  return <h2 key={i} style={{margin:"10px 0"}}>{l.slice(3)}</h2>;
    if (l.startsWith("- "))   return <li key={i} style={{marginLeft:16}}>{l.slice(2)}</li>;
    return <p key={i} style={{margin:"6px 0"}}>{l}</p>;
  };
  return <div>{text.split("\n").map(line)}</div>;
};

/* ---------- Layout ---------- */
const Layout = ({ children, userId, onNavigate, currentPage, onLogout }) => (
  <div className="container">
    <header className="header">
      <div className="brand">Zenvana v2</div>
      <div className="badge">{userId ? `uid:${userId.slice(0,6)}` : "connecting..."}</div>
    </header>
    <div style={{display:"flex", gap:16, marginBottom:16}}>
      <button className="button" onClick={() => onNavigate("dashboard")} disabled={currentPage==="dashboard"}>Dashboard</button>
      <button className="button" onClick={() => onNavigate("tax")} disabled={currentPage==="tax"}>Tax Saver</button>
      <button className="button" onClick={() => onNavigate("chat")} disabled={currentPage==="chat"}>AI Chat</button>
      <div style={{marginLeft:"auto"}}>
        <button className="button" style={{background:"#ef4444", color:"#fff"}} onClick={onLogout}>Logout</button>
      </div>
    </div>
    {children}
  </div>
);

/* ---------- Onboarding (v1 feel + helper tips) ---------- */
const Help = ({ children }) => <div className="help">💡 {children}</div>;

const OnboardingFlow = ({ initial, onSubmit, isSubmitting }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(initial || {
    name:"", dateOfBirth:"", maritalStatus:"", dependents:"",
    monthlyIncome:"", expenses:{},
    emergencyFund:"", investments:{equity:"", debt:"", realEstate:"", gold:""},
    liabilities:{highInterest:"", lowInterest:""},
    healthInsurance:"", healthInsuranceCoverage:"",
    termInsurance:"", termInsuranceCoverage:"",
    riskTolerance:"", financialWorry:"",
    customGoals:[{ name:"", targetAmount:"", amountSaved:"", targetDate:"" }]
  });

  const num = (e) => e.target.value.replace(/[^0-9]/g,"");
  const set = (k,v) => setData(p => ({...p, [k]: v}));

  useEffect(()=>{ AOS.init({ duration: 400, once:true }); },[]);

  const next = () => setStep(s=>s+1);
  const prev = () => setStep(s=>s-1);

  const submit = () => {
    const assets = Number(data.emergencyFund||0)
      + Number(data.investments.equity||0) + Number(data.investments.debt||0)
      + Number(data.investments.realEstate||0) + Number(data.investments.gold||0);
    const liabilities = Number(data.liabilities.highInterest||0) + Number(data.liabilities.lowInterest||0);
    const monthlyExpenses = Object.values(data.expenses||{}).reduce((a,v)=>a+Number(v||0),0);
    const netWorth = assets - liabilities;
    onSubmit({ ...data, netWorth, debt: liabilities, monthlyExpenses });
  };

  const expenseRows = [
    ["housing","Housing (Rent/EMI)"],["food","Food"],["transportation","Transportation"],
    ["utilities","Utilities"],["entertainment","Entertainment"],["healthcare","Healthcare"],
    ["personalCare","Personal Care"],["education","Education"],["debtPayments","Debt Payments"],["miscellaneous","Miscellaneous"]
  ];

  return (
    <div className="card">
      <h2>Onboarding — Step {step}</h2>

      {step===1 && (
        <div className="grid col-2" data-aos="fade-in">
          <div>
            <label>Your Full Name</label>
            <input className="input" value={data.name} onChange={e=>set("name",e.target.value)} placeholder="e.g., Ananya Sharma"/>
            <Help>Used to personalize advice messages.</Help>
          </div>
          <div>
            <label>Date of Birth</label>
            <input className="input" type="date" value={data.dateOfBirth} onChange={e=>set("dateOfBirth",e.target.value)} />
            <Help>Affects age‑based planning like insurance & retirement.</Help>
          </div>
          <div>
            <label>Marital Status</label>
            <select className="input" value={data.maritalStatus} onChange={e=>set("maritalStatus",e.target.value)}>
              <option value="">Select</option><option value="single">Single</option><option value="married">Married</option>
            </select>
            <Help>Helps tailor risk cover & goal recommendations.</Help>
          </div>
          <div>
            <label>Dependents</label>
            <input className="input" inputMode="numeric" value={data.dependents} onChange={e=>set("dependents",num(e))} placeholder="0, 1, 2"/>
            <Help>Impacts insurance adequacy & emergency fund size.</Help>
          </div>
          <div style={{gridColumn:"1 / -1", textAlign:"right"}}><button className="button" onClick={next}>Next</button></div>
        </div>
      )}

      {step===2 && (
        <div data-aos="fade-in">
          <div>
            <label>Average Monthly Take‑Home Income (₹)</label>
            <input className="input" inputMode="numeric" value={data.monthlyIncome} onChange={e=>set("monthlyIncome",num(e))} placeholder="50000"/>
            <Help>Used to compute savings rate, tax estimate and protection needs.</Help>
          </div>
          <div className="grid col-2 custom-scrollbar" style={{maxHeight:260, overflowY:"auto", marginTop:12}}>
            {expenseRows.map(([k, label])=>(
              <div key={k}>
                <label>{label} (₹)</label>
                <input className="input" inputMode="numeric" value={data.expenses[k]||""} onChange={e=>set("expenses",{...data.expenses,[k]:num(e)})} placeholder="0"/>
              </div>
            ))}
          </div>
          <Help>💡 Track at least the big 4: Housing, Food, Transport, Utilities. The rest can be rough for now.</Help>
          <div style={{display:"flex", gap:8, marginTop:12}}>
            <button className="button" style={{background:"#334155", color:"#fff"}} onClick={prev}>Previous</button>
            <button className="button" onClick={next}>Next</button>
          </div>
        </div>
      )}

      {step===3 && (
        <div data-aos="fade-in" className="grid col-2">
          <div>
            <h3>Assets</h3>
            <label>Emergency Fund (₹)</label>
            <input className="input" inputMode="numeric" value={data.emergencyFund} onChange={e=>set("emergencyFund",num(e))}/>
            <Help>Target 6 months of expenses as a buffer.</Help>

            <label style={{marginTop:8}}>Equity Investments (₹)</label>
            <input className="input" inputMode="numeric" value={data.investments.equity} onChange={e=>set("investments",{...data.investments, equity:num(e)})}/>
            <label>Debt Investments (₹)</label>
            <input className="input" inputMode="numeric" value={data.investments.debt} onChange={e=>set("investments",{...data.investments, debt:num(e)})}/>
            <label>Real Estate (₹)</label>
            <input className="input" inputMode="numeric" value={data.investments.realEstate} onChange={e=>set("investments",{...data.investments, realEstate:num(e)})}/>
            <label>Gold & Others (₹)</label>
            <input className="input" inputMode="numeric" value={data.investments.gold} onChange={e=>set("investments",{...data.investments, gold:num(e)})}/>
          </div>
          <div>
            <h3>Liabilities</h3>
            <label>High‑Interest Debt (₹)</label>
            <input className="input" inputMode="numeric" value={data.liabilities.highInterest} onChange={e=>set("liabilities",{...data.liabilities, highInterest:num(e)})}/>
            <Help>Credit cards/personal loans. Aim to clear ASAP.</Help>
            <label>Low‑Interest Debt (₹)</label>
            <input className="input" inputMode="numeric" value={data.liabilities.lowInterest} onChange={e=>set("liabilities",{...data.liabilities, lowInterest:num(e)})}/>
            <Help>Home/car/education loans at reasonable rates.</Help>
          </div>
          <div style={{gridColumn:"1 / -1", display:"flex", gap:8}}>
            <button className="button" style={{background:"#334155", color:"#fff"}} onClick={prev}>Previous</button>
            <button className="button" onClick={next}>Next</button>
          </div>
        </div>
      )}

      {step===4 && (
        <div data-aos="fade-in" className="grid col-2">
          <div>
            <label>Do you have Health Insurance?</label>
            <select className="input" value={data.healthInsurance} onChange={e=>set("healthInsurance",e.target.value)}>
              <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
            {data.healthInsurance==="yes" && (
              <>
                <label>Health Insurance Coverage (₹)</label>
                <input className="input" inputMode="numeric" value={data.healthInsuranceCoverage} onChange={e=>set("healthInsuranceCoverage",num(e))}/>
                <Help>Family cover of ₹5–10L is common starting point.</Help>
              </>
            )}
          </div>
          <div>
            <label>Do you have Term Life Insurance?</label>
            <select className="input" value={data.termInsurance} onChange={e=>set("termInsurance",e.target.value)}>
              <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
            {data.termInsurance==="yes" && (
              <>
                <label>Term Insurance Coverage (₹)</label>
                <input className="input" inputMode="numeric" value={data.termInsuranceCoverage} onChange={e=>set("termInsuranceCoverage",num(e))}/>
                <Help>Rule of thumb: ~15× annual income as cover.</Help>
              </>
            )}
          </div>

          <div>
            <label>Risk Tolerance</label>
            <select className="input" value={data.riskTolerance} onChange={e=>set("riskTolerance",e.target.value)}>
              <option value="">Select</option>
              <option value="low">Low (capital protection, low volatility)</option>
              <option value="medium">Medium (balanced growth vs risk)</option>
              <option value="high">High (aggressive growth, higher volatility)</option>
            </select>
            <Help>Determines your equity vs debt mix.</Help>
          </div>

          <div>
            <label>Single biggest financial worry?</label>
            <select className="input" value={data.financialWorry} onChange={e=>set("financialWorry",e.target.value)}>
              <option value="">Select</option>
              <option value="retirement">Retirement adequacy</option>
              <option value="debt">Getting out of debt</option>
              <option value="taxes">High taxes</option>
              <option value="investing">Not sure where to invest</option>
              <option value="expenses">Managing monthly expenses</option>
            </select>
          </div>

          <div style={{gridColumn:"1 / -1", display:"flex", gap:8}}>
            <button className="button" style={{background:"#334155", color:"#fff"}} onClick={prev}>Previous</button>
            <button className="button" onClick={next}>Next</button>
          </div>
        </div>
      )}

      {step===5 && (
        <div data-aos="fade-in">
          <h3>Your Financial Goals</h3>
          <div className="custom-scrollbar" style={{maxHeight:260, overflowY:"auto"}}>
            {data.customGoals.map((g, i)=>(
              <div key={i} className="card" style={{marginBottom:8}}>
                <label>Goal Name</label>
                <input className="input" value={g.name||""} onChange={e=>{
                  const cg=[...data.customGoals]; cg[i]={...cg[i], name:e.target.value}; set("customGoals",cg);
                }} placeholder="Retirement, Buy a car"/>
                <label>Target Amount (₹)</label>
                <input className="input" inputMode="numeric" value={g.targetAmount||""} onChange={e=>{
                  const cg=[...data.customGoals]; cg[i]={...cg[i], targetAmount:e.target.value.replace(/[^0-9]/g,"")}; set("customGoals",cg);
                }}/>
                <label>Amount Already Saved (₹)</label>
                <input className="input" inputMode="numeric" value={g.amountSaved||""} onChange={e=>{
                  const cg=[...data.customGoals]; cg[i]={...cg[i], amountSaved:e.target.value.replace(/[^0-9]/g,"")}; set("customGoals",cg);
                }}/>
                <label>Target Date</label>
                <input className="input" type="date" value={g.targetDate||""} onChange={e=>{
                  const cg=[...data.customGoals]; cg[i]={...cg[i], targetDate:e.target.value}; set("customGoals",cg);
                }}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex", gap:8, marginTop:10}}>
            <button className="button" style={{background:"#334155", color:"#fff"}} onClick={prev}>Previous</button>
            <button className="button" onClick={submit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Complete Onboarding"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Dashboard ---------- */
const ExpensePie = ({ expenses }) => {
  const data = Object.entries(expenses||{}).map(([k,v])=>({name:k, value:Number(v||0)})).filter(d=>d.value>0);
  const COLORS = ['#10B981','#FBBF24','#3B82F6','#8B5CF6','#EC4899','#6B7280','#14B8A6','#F59E0B','#6366F1','#D946EF'];
  if (!data.length) return <div className="card">No expense data to chart yet.</div>;
  return (
    <div className="card" style={{height:360}}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} outerRadius={120}>
            {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v)=>formatINR(v)} contentStyle={{background:"#0c121a", border:"1px solid #334155", color:"#e6edf3"}}/>
          <Legend wrapperStyle={{color:"#9fb0c0"}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = ({ profile, askGroq }) => {
  const [plan, setPlan] = useState("");
  const monthlySavings = Number(profile.monthlyIncome||0) - Number(profile.monthlyExpenses||0);
  const savingsRate = profile.monthlyIncome>0 ? (monthlySavings/profile.monthlyIncome)*100 : 0;

  const generatePlan = async () => {
    const prompt = `
You are ZENVANA. Create a 3‑step improvement plan based on:
Income: ${formatINR(profile.monthlyIncome)} | Savings Rate: ${savingsRate.toFixed(1)}%
Emergency Fund: ${formatINR(profile.emergencyFund)} | High‑Interest Debt: ${formatINR(profile.liabilities?.highInterest)}
Risk: ${profile.riskTolerance} | Worry: ${profile.financialWorry}
Keep it short, numbered, and actionable for THIS user.`;
    try { setPlan(await askGroq(prompt)); } catch { setPlan("Try again in a bit."); }
  };

  return (
    <div>
      <div className="grid col-3">
        <div className="card"><h3>Monthly Savings</h3><div className="value">{formatINR(monthlySavings)}</div></div>
        <div className="card"><h3>Savings Rate</h3><div className="value">{isNaN(savingsRate)? "0%": `${savingsRate.toFixed(1)}%`}</div></div>
        <div className="card"><h3>Emergency Fund</h3><div className="value">{formatINR(profile.emergencyFund)}</div></div>
      </div>

      <div className="grid col-2 section">
        <ExpensePie expenses={profile.expenses}/>
        <div className="card">
          <h3>Improve Your Finances</h3>
          <button className="button" onClick={generatePlan}>Generate Personalized Plan</button>
          {plan && <div style={{marginTop:12}}><Markdown text={plan}/></div>}
        </div>
      </div>
    </div>
  );
};

/* ---------- Tax Saver ---------- */
const TaxSaver = ({ profile, askGroq }) => {
  const [f, setF] = useState({
    salaryIncome:"", otherIncome:"", investments80C:"", hra:"", homeLoanInterest:"",
    medicalInsurance80D:"", nps_80ccd1b:"", educationLoanInterest_80e:""
  });
  const [res, setRes] = useState(null);
  const [ai, setAi] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(()=>{ if(profile?.monthlyIncome){ setF(p=>({...p, salaryIncome:String(Number(profile.monthlyIncome)*12)})); }},[profile]);

  const n = (e)=>e.target.value.replace(/[^0-9]/g,"");

  const calc = (taxable, regime) => {
    let tax=0, slab=0;
    if (regime==="old"){
      if (taxable<=500000) return {tax:0, slab:"0%"}; 
      if (taxable>1000000){ tax=112500+(taxable-1000000)*0.30; slab=30;}
      else if (taxable>500000){ tax=12500+(taxable-500000)*0.20; slab=20;}
      else if (taxable>250000){ tax=(taxable-250000)*0.05; slab=5;}
    } else {
      if (taxable<=700000) return {tax:0, slab:"0%"}; 
      if (taxable>1500000){ tax=150000+(taxable-1500000)*0.30; slab=30;}
      else if (taxable>1200000){ tax=90000+(taxable-1200000)*0.20; slab=20;}
      else if (taxable>900000){ tax=45000+(taxable-900000)*0.15; slab=15;}
      else if (taxable>600000){ tax=15000+(taxable-600000)*0.10; slab=10;}
      else if (taxable>300000){ tax=(taxable-300000)*0.05; slab=5;}
    }
    return { tax: Math.round(tax*1.04), slab: `${slab}%` }; // +4% cess
  };

  const handle = async () => {
    setBusy(true); setAi("");
    const GI = Number(f.salaryIncome||0)+Number(f.otherIncome||0);
    const newTI = Math.max(0, GI - 50000); // std deduction
    const oldDeductions = Number(f.investments80C||0)+Number(f.hra||0)+Number(f.homeLoanInterest||0)
      +Number(f.medicalInsurance80D||0)+Number(f.nps_80ccd1b||0)+Number(f.educationLoanInterest_80e||0);
    const oldTI = Math.max(0, GI - 50000 - oldDeductions);
    const nRes = calc(newTI,"new"); const oRes = calc(oldTI,"old");
    const better = nRes.tax < oRes.tax ? "New" : "Old";
    const save = Math.abs(nRes.tax - oRes.tax);
    setRes({ nRes, oRes, better, save });

    const prompt = `
You are ZENVANA, AI Tax Advisor (India).
User age: ${getAge(profile.dateOfBirth)} | Risk: ${profile.riskTolerance}
Gross Income: ${formatINR(GI)} | Deductions: ${formatINR(oldDeductions)}
Recommended Regime: **${better}** | Potential Savings: **${formatINR(save)}**
Inputs: ${JSON.stringify(f)}
Write a crisp Markdown report with: Summary → Comparison (Old vs New) → Missed Opportunities → Next steps.`;
    try { setAi(await askGroq(prompt)); } catch { setAi("Try again later."); } finally { setBusy(false); }
  };

  const fields = [
    ["salaryIncome","Annual Salary Income (Form 16)","Total gross salary before deductions."],
    ["otherIncome","Other Income","Interest, rent, capital gains etc."],
    ["investments80C","Investments under 80C","PPF/EPF/ELSS/Life premium (Max ₹1,50,000)."],
    ["hra","HRA Exemption","Only if receiving HRA + paying eligible rent."],
    ["homeLoanInterest","Home Loan Interest (Sec 24)","Self-occupied cap ₹2,00,000."],
    ["medicalInsurance80D","Medical Insurance (80D)","Self/family & parents."],
    ["nps_80ccd1b","NPS (80CCD(1B))","Additional ₹50,000 beyond 80C."],
    ["educationLoanInterest_80e","Education Loan Interest (80E)","Entire interest paid."]
  ];

  return (
    <div className="card">
      <h3>Interactive Tax Saver</h3>
      <div className="grid col-2">
        <div>
          {fields.map(([key,label,tip])=>(
            <div key={key} style={{marginBottom:12}}>
              <label>{label} (₹)</label>
              <input className="input" inputMode="numeric" value={f[key]||""} onChange={e=>setF(p=>({...p,[key]:n(e)}))}/>
              <Help>{tip}</Help>
            </div>
          ))}
          <button className="button" onClick={handle} disabled={busy}>{busy?"Calculating…":"Calculate & Analyze"}</button>
        </div>
        <div>
          {res && (
            <div className="card">
              <h4>Comparison</h4>
              <p><b>Old:</b> {formatINR(res.oRes.tax)} (Top slab {res.oRes.slab})</p>
              <p><b>New:</b> {formatINR(res.nRes.tax)} (Top slab {res.nRes.slab})</p>
              <div className="card" style={{background:"#073b27"}}><b>{res.better}</b> regime is better. You save <b>{formatINR(res.save)}</b>.</div>
            </div>
          )}
          {ai && <div className="card" style={{marginTop:12}}><Markdown text={ai}/></div>}
        </div>
      </div>
    </div>
  );
};

/* ---------- AI Chat ---------- */
const AIChat = ({ profile, chatHistory, setChatHistory, askHybrid, busy }) => {
  const [input, setInput] = useState("");
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [chatHistory]);

  const send = async (e) => {
    e.preventDefault();
    if(!input.trim()) return;
    const msg = input.trim();
    setChatHistory(h=>[...h, { role:"user", parts:[{text:msg}] }]);
    setInput("");
    const mode = msg.length <= 120 ? "groq-fast" : "openai";
    try {
      const text = await askHybrid({ question: msg, mode });
      setChatHistory(h=>[...h, { role:"model", parts:[{text}] }]);
    } catch {
      setChatHistory(h=>[...h, { role:"model", parts:[{text:"Zenvana AI is busy. Try again."}] }]);
    }
  };

  const quick = [
    "How can I increase my savings rate?",
    "Is my portfolio diversified?",
    profile.healthInsurance==="no" ? "Why is health insurance important?" : null
  ].filter(Boolean);

  return (
    <div className="card" style={{minHeight:420, display:"flex", flexDirection:"column"}}>
      <h3>AI Financial Companion</h3>
      <div ref={ref} className="custom-scrollbar" style={{flex:1, overflowY:"auto", paddingRight:6, marginBottom:8}}>
        {chatHistory.map((m,i)=>(
          <div key={i} className="card" style={{background:m.role==="user"?"#1f2937":"#0f172a", marginBottom:8}}>
            <b>{m.role==="user"?"You":"ZENVANA"}</b>
            <div style={{marginTop:6}}><Markdown text={m.parts[0].text}/></div>
          </div>
        ))}
      </div>
      {!busy && chatHistory.length<2 && (
        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:8}}>
          {quick.map((q,i)=><button key={i} className="button" onClick={()=>setInput(q)}>{q}</button>)}
        </div>
      )}
      <form onSubmit={send} style={{display:"flex", gap:8}}>
        <input className="input" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask anything about your money..." disabled={busy}/>
        <button className="button" disabled={!input.trim() || busy}>Send</button>
      </form>
    </div>
  );
};

/* ---------- APP ---------- */
export default function App(){
  const [uid,setUid] = useState(null);
  const [page,setPage] = useState("onboarding"); // start here if no profile
  const [profile,setProfile] = useState(null);
  const [chatHistory,setChatHistory] = useState([]);
  const [busy,setBusy] = useState(false);

  const app = useRef(null); const db = useRef(null);

  useEffect(()=>{
    app.current = initializeApp(firebaseConfig);
    db.current = getFirestore(app.current);
    const auth = getAuth(app.current);
    signInAnonymously(auth);
    const unsub = onAuthStateChanged(auth, async (user)=>{
      if(!user){ setUid(null); setPage("onboarding"); return; }
      setUid(user.uid);
      // Load profile from users/{uid}
      const pref = doc(db.current, "users", user.uid);
      const snap = await getDoc(pref);
      if (snap.exists()){
        setProfile(snap.data());
        setPage("dashboard");
      } else {
        setPage("onboarding");
      }
    });
    return ()=>unsub();
  },[]);

  /* ---- Server AI helper ---- */
  const askFunction = async ({ question, mode="groq-fast", chat=[] }) => {
    const r = await fetch("/.netlify/functions/aiRouter", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ mode, question, profile, chat })
    });
    if(!r.ok){ let e={}; try{e=await r.json();}catch{} throw new Error(e.error||`AI ${r.status}`); }
    const { text } = await r.json(); return text;
  };
  const askGroq = useCallback(async (prompt)=>askFunction({question:prompt, mode:"groq-fast"}), [profile]);
  const askHybrid = useCallback(async ({question, mode})=>{
    const chat = chatHistory.slice(-10).map(m=>({role:m.role==="user"?"user":"assistant", text:m.parts?.[0]?.text||""}));
    return askFunction({question, mode, chat});
  }, [chatHistory, profile]);

  const saveOnboarding = async (finalData) => {
    if(!uid) return;
    setBusy(true);
    try{
      const ref = doc(db.current, "users", uid);   // ✅ fixed path
      await setDoc(ref, finalData, { merge:true });
      setProfile(finalData);
      setPage("dashboard");
    } finally { setBusy(false); }
  };

  const logout = async ()=>{
    try{
      if(uid){ await deleteDoc(doc(db.current,"users",uid)).catch(()=>{}); }
      await signOut(getAuth(app.current));
      setProfile(null); setChatHistory([]); setPage("onboarding");
    }catch{}
  };

  if(page==="onboarding") return <OnboardingFlow initial={profile||undefined} onSubmit={saveOnboarding} isSubmitting={busy} />;

  return (
    <Layout userId={uid} onNavigate={setPage} currentPage={page} onLogout={logout}>
      {page==="dashboard" && <Dashboard profile={profile} askGroq={askGroq} />}
      {page==="tax" && <TaxSaver profile={profile} askGroq={askGroq} />}
      {page==="chat" && <AIChat profile={profile} chatHistory={chatHistory} setChatHistory={setChatHistory} askHybrid={askHybrid} busy={busy} />}
    </Layout>
  );
}
