import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Profile = () => {
    const [formData, setFormData] = useState({
        name: '',
        dateOfBirth: '',
        maritalStatus: '',
        dependents: '',
        monthlyIncome: '',
        expenses: {},
        emergencyFund: '',
        investments: { equity: '', debt: '', realEstate: '', gold: '' },
        liabilities: { highInterest: '', lowInterest: '' },
        healthInsurance: '',
        healthInsuranceCoverage: '',
        termInsurance: '',
        termInsuranceCoverage: '',
        riskTolerance: '',
        financialWorry: '',
        customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }],
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchUserData = async () => {
            if (userId) {
                const docRef = doc(db, `users/${userId}/financial_data/summary`);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                }
            }
        };
        fetchUserData();
    }, [userId]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const numericFields = ['dependents', 'monthlyIncome', 'emergencyFund', 'healthInsuranceCoverage', 'termInsuranceCoverage'];
        if (type === 'text' && numericFields.includes(name)) {
            setFormData(p => ({ ...p, [name]: value.replace(/[^0-9]/g, '') }));
        } else {
            setFormData(p => ({ ...p, [name]: value }));
        }
    };
    
    const handleNestedChange = (e, parent, child) => {
        const { value } = e.target;
        setFormData(p => ({ ...p, [parent]: { ...p[parent], [child]: value.replace(/[^0-9]/g, '') } }));
    };

    const handleGoalChange = (index, e) => {
        const { name, value } = e.target;
        const newGoals = [...formData.customGoals];
        newGoals[index] = { ...newGoals[index], [name]: name === 'name' ? value : value.replace(/[^0-9-]/g, '') };
        setFormData(p => ({ ...p, customGoals: newGoals }));
    };

    const addGoal = () => {
        setFormData(p => ({ ...p, customGoals: [...p.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }] }));
    };

    const removeGoal = (index) => {
        setFormData(p => ({ ...p, customGoals: p.customGoals.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        const totalAssets =
            parseFloat(formData.emergencyFund || 0) +
            parseFloat(formData.investments.equity || 0) +
            parseFloat(formData.investments.debt || 0) +
            parseFloat(formData.investments.realEstate || 0) +
            parseFloat(formData.investments.gold || 0);
        const totalLiabilities =
            parseFloat(formData.liabilities.highInterest || 0) +
            parseFloat(formData.liabilities.lowInterest || 0);
        const netWorth = totalAssets - totalLiabilities;
        const totalMonthlyExpenses = Object.values(formData.expenses || {}).reduce((s, v) => s + parseFloat(v || 0), 0);
        const dataToSave = {
            ...formData,
            netWorth: netWorth,
            debt: totalLiabilities,
            monthlyExpenses: totalMonthlyExpenses,
            lastUpdated: new Date().toISOString()
        };

        try {
            const docRef = doc(db, `users/${userId}/financial_data/summary`);
            await setDoc(docRef, dataToSave, { merge: true });
            setMessage('Profile updated successfully!');
        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage('Failed to save profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-900 bg-opacity-80 p-8 rounded-3xl shadow-2xl border-gray-800 w-full">
            <h2 className="text-3xl font-bold text-green-400 mb-6">Your Profile & Financial Details</h2>
            {message && <p className={`text-center py-2 rounded-lg mb-4 ${message.includes('success') ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}>{message}</p>}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-3">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-gray-300 text-lg font-semibold mb-2">Name</label><input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" /></div>
                        <div><label className="block text-gray-300 text-lg font-semibold mb-2">Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" /></div>
                        <div><label className="block text-gray-300 text-lg font-semibold mb-2">Marital Status</label><select name="maritalStatus" value={formData.maritalStatus || ''} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"><option value="">Select one</option><option value="single">Single</option><option value="married">Married</option></select></div>
                        <div><label className="block text-gray-300 text-lg font-semibold mb-2">Dependents</label><input type="text" inputMode="numeric" name="dependents" value={formData.dependents || ''} onChange={handleChange} className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg" /></div>
                    </div>
                </div>

                {/* Cash Flow Section */}
                <div>
                    <h3 className="text-xl font-bold text-yellow-400 mb-3">Cash Flow</h3>
                    <div className="space-y-4">
                        <div><label className="block text-gray-300 text-lg font-semibold mb-2">Monthly Income (₹)</label><input type="text" inputMode="numeric" name="monthlyIncome" value={formData.monthlyIncome || ''} onChange={handleChange} className="w-full p-3 border rounded-xl bg-gray-800" /></div>
                        <h4 className="text-gray-300 text-lg font-semibold mb-2">Monthly Expenses (₹)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Object.entries(formData.expenses || {}).map(([key, value]) => (<div key={key}><label className="text-gray-300 font-semibold capitalize">{key}</label><input type="text" inputMode="numeric" name={key} value={value || ''} onChange={(e) => handleChange(e, 'expenses')} className="w-full p-2 rounded bg-gray-900 text-white" /></div>))}</div>
                    </div>
                </div>

                {/* Assets Section */}
                <div>
                    <h4 className="text-xl font-bold text-yellow-400 mb-3">Assets</h4>
                    <div className="space-y-4">
                        <div><label className="block text-lg font-semibold mb-1">Emergency Fund (₹)</label><input type="text" inputMode="numeric" name="emergencyFund" value={formData.emergencyFund || ''} onChange={handleChange} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                        <div><label className="block text-lg font-semibold mb-1">Equity Investments (₹)</label><input type="text" inputMode="numeric" value={formData.investments.equity || ''} onChange={(e) => handleNestedChange(e, 'investments', 'equity')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                        <div><label className="block text-lg font-semibold mb-1">Debt Investments (₹)</label><input type="text" inputMode="numeric" value={formData.investments.debt || ''} onChange={(e) => handleNestedChange(e, 'investments', 'debt')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                        <div><label className="block text-lg font-semibold mb-1">Real Estate (₹)</label><input type="text" inputMode="numeric" value={formData.investments.realEstate || ''} onChange={(e) => handleNestedChange(e, 'investments', 'realEstate')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                        <div><label className="block text-lg font-semibold mb-1">Gold & Others (₹)</label><input type="text" inputMode="numeric" value={formData.investments.gold || ''} onChange={(e) => handleNestedChange(e, 'investments', 'gold')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                    </div>
                </div>
                
                {/* Liabilities Section */}
                <div>
                    <h4 className="text-xl font-bold text-yellow-400 mb-3">Liabilities</h4>
                    <div className="space-y-4">
                        <div><label className="block text-lg font-semibold mb-1">High-Interest Debt (₹)</label><input type="text" inputMode="numeric" value={formData.liabilities.highInterest || ''} onChange={(e) => handleNestedChange(e, 'liabilities', 'highInterest')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                        <div><label className="block text-lg font-semibold mb-1">Low-Interest Debt (₹)</label><input type="text" inputMode="numeric" value={formData.liabilities.lowInterest || ''} onChange={(e) => handleNestedChange(e, 'liabilities', 'lowInterest')} className="w-full p-3 rounded-xl bg-gray-800" /></div>
                    </div>
                </div>

                {/* Goals Section */}
                <div>
                    <h4 className="text-xl font-bold text-yellow-400 mb-3">Financial Goals</h4>
                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {formData.customGoals.map((goal, index) => (
                            <div key={index} className="bg-gray-700 p-4 rounded-xl border border-gray-600">
                                <div className="flex justify-between items-center mb-3"><label className="font-semibold">Goal {index + 1}</label>{formData.customGoals.length > 1 && (<button type="button" onClick={() => removeGoal(index)} className="text-red-400 text-sm">Remove</button>)}</div>
                                <label className="block mt-2">Goal Name</label><input type="text" name="name" value={goal.name || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" placeholder="e.g., Retirement, Buy a Car" />
                                <label className="block mt-2">Target Amount (₹)</label><input type="text" inputMode="numeric" name="targetAmount" value={goal.targetAmount || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                                <label className="block mt-2">Amount Saved (₹)</label><input type="text" inputMode="numeric" name="amountSaved" value={goal.amountSaved || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                                <label className="block mt-2">Target Date</label><input type="date" name="targetDate" value={goal.targetDate || ''} onChange={(e) => handleGoalChange(index, e)} className="w-full p-2 rounded bg-gray-800" />
                            </div>
                        ))}
                        <button type="button" onClick={addGoal} className="w-full bg-green-700 font-bold py-2 px-4 rounded-xl">+ Add Another Goal</button>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <button type="submit" disabled={isSaving} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-8 text-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
