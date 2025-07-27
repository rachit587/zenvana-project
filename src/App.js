import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

// Ensure Tailwind CSS is available in the environment
// This component assumes Tailwind CSS is configured and available globally.

// --- Markdown Renderer Component ---
const MarkdownRenderer = ({ text }) => {
  if (!text) return null;

  // Function to render inline elements like **bold** text
  const renderInlineFormatting = (line) => {
    // Split by the bold delimiter
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      // Every odd-indexed part is bold
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-white">{part}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Process the entire text block
  const elements = text.split('\n').map((line, index) => {
    // Headings
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-bold my-2 text-gray-200">{renderInlineFormatting(line.substring(4))}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold my-3 text-yellow-400">{renderInlineFormatting(line.substring(3))}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-3xl font-bold my-4 text-green-400">{renderInlineFormatting(line.substring(2))}</h1>;
    }
    // Unordered list items
    if (line.startsWith('- ')) {
      return <li key={index} className="ml-5 list-disc">{renderInlineFormatting(line.substring(2))}</li>;
    }
    // Return paragraphs for non-empty lines
    if (line.trim() !== '') {
      return <p key={index} className="my-1">{renderInlineFormatting(line)}</p>;
    }
    return null;
  });

  return <div className="text-gray-300">{elements}</div>;
};


// --- Layout Component with Left Navigation ---
const Layout = ({ children, userId, onNavigate, currentPage, handleLogout }) => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 to-gray-900 font-inter text-gray-100">
      {/* Left Navigation Bar */}
      <nav className="w-64 bg-gray-900 shadow-lg p-6 flex flex-col rounded-r-3xl transition-all duration-300 ease-in-out transform hover:shadow-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-extrabold text-green-400 drop-shadow-md">ZENVANA</h2>
          {userId && (
            <p className="text-xs text-gray-400 mt-2">
              User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md text-gray-300 break-all">{userId}</span>
            </p>
          )}
        </div>
        <ul className="space-y-4 flex-grow">
          <li>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:text-green-400
                ${currentPage === 'dashboard' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300 hover:text-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('taxSaver')}
              className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:text-green-400
                ${currentPage === 'taxSaver' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300 hover:text-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1l-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Tax Saver
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('aiChat')}
              className={`w-full text-left flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-gray-700 hover:text-green-400
                ${currentPage === 'aiChat' ? 'bg-gray-700 text-green-400 shadow-md' : 'text-gray-300 hover:text-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              AI Chat
            </button>
          </li>
        </ul>
        <div className="mt-auto pt-8"> {/* Push logout to bottom */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg"
          >
            Logout & Start Over
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
};

// --- WelcomePage Component ---
const WelcomePage = ({ onGetStarted }) => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 relative overflow-hidden">
    {/* Background particles/shapes for premium feel */}
    <div className="absolute inset-0 z-0 opacity-10">
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
    </div>

    <div className="relative z-10 flex flex-col items-center">
      <h1 className="text-7xl font-extrabold text-white mb-4 drop-shadow-lg animate-fade-in-down">
        Welcome to ZENVANA
      </h1>
      <p className="text-3xl text-gray-300 mb-10 max-w-3xl animate-fade-in-up">
        Our mission: To empower every Indian with the knowledge and tools to achieve financial literacy and freedom.
      </p>

      <button
        onClick={onGetStarted}
        className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl transition duration-200 ease-in-out transform hover:-translate-y-2 hover:shadow-gold-glow animate-bounce-once shadow-lg mb-16"
      >
        Get Started
      </button>

      <section className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-gray-700 mb-8 max-w-4xl w-full animate-fade-in-scale">
        <h2 className="text-4xl font-bold text-green-400 mb-6">About Us & Our Vision</h2>
        <p className="text-lg text-gray-300 mb-4 leading-relaxed">
          At ZENVANA, we envision a world where managing your money is intuitive, trustworthy, and stress-free. We are building the most intuitive, trustworthy, and empowering AI-driven personal finance companion, guiding users to their financial nirvana by simplifying complex financial concepts and providing actionable, personalized strategies.
        </p>
        <p className="text-lg text-gray-300 leading-relaxed">
          We're committed to delivering a premium, calming, and frictionless experience through personalized financial plans, AI chat, and comprehensive financial summaries from your data.
        </p>
      </section>

      <section className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-gray-700 mb-10 max-w-4xl w-full animate-fade-in-scale delay-300">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6">How We Can Help You</h2>
        <ul className="text-lg text-gray-300 space-y-4 text-left">
          <li className="flex items-start">
            <span className="text-green-400 text-2xl mr-3">✓</span>
            <strong>Personalized Financial Plans:</strong> Get tailor-made strategies based on your unique income, expenses, and goals.
          </li>
          <li className="flex items-start">
            <span className="text-green-400 text-2xl mr-3">✓</span>
            <strong>AI Chat Assistance:</strong> Your unlimited, free financial advisor ready to answer any query, provide guidance, and mentor you.
          </li>
          <li className="flex items-start">
            <span className="text-green-400 text-2xl mr-3">✓</span>
            <strong>Comprehensive Financial Summaries:</strong> Understand your financial health at a glance with clear, actionable insights.
          </li>
          <li className="flex items-start">
            <span className="text-green-400 text-2xl mr-3">✓</span>
            <strong>Smart Tax Saving:</strong> Leverage AI to identify personalized opportunities to save more on your taxes.
          </li>
        </ul>
      </section>

      <footer className="text-gray-400 text-md mt-10">
        Made with love ❤️ by Rachit Banthia
      </footer>
    </div>

    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes fade-in-down {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fade-in-scale {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes bounce-once {
        0%, 100% { transform: translateY(0); }
        20% { transform: translateY(-15px); }
        40% { transform: translateY(0); }
        60% { transform: translateY(-8px); }
        80% { transform: translateY(0); }
      }
      @keyframes blob {
        0% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
        100% { transform: translate(0px, 0px) scale(1); }
      }
      .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; } /* Faster */
      .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }   /* Faster */
      .animate-fade-in-scale { animation: fade-in-scale 0.7s ease-out forwards; } /* Faster */
      .animate-bounce-once { animation: bounce-once 1.5s ease-out forwards; } /* Slightly faster */
      .animate-blob { animation: blob 7s infinite cubic-bezier(0.6, 0.01, 0.3, 0.9); }
      .delay-300 { animation-delay: 0.2s; } /* Adjusted delay */
      .shadow-gold-glow { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); } /* Golden glow */
    ` }} />
  </div>
);

// --- OnboardingForm Components (Multi-step) ---

const OnboardingStep1_PersonalInfo = ({ formData, handleChange, nextStep }) => {
    // Get today's date in YYYY-MM-DD format to set as max for date of birth
    const today = new Date().toISOString().split('T')[0];

    return (
      <div className="animate-fade-in-scale">
        <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Welcome to ZENVANA!</h3>
        <p className="text-lg text-gray-400 mb-8 text-center">Let's start by getting to know you.</p>
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-300 text-lg font-semibold mb-2">
              Your Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              placeholder="e.g., Ananya Sharma"
              required
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-gray-300 text-lg font-semibold mb-2">
              Your Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={today} // Prevent selecting future dates
              min="1925-01-01" // Prevent selecting dates too far in the past
              className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              required
            />
          </div>
          <button
            onClick={nextStep}
            className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-4 px-8 rounded-xl text-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl"
          >
            Next
          </button>
        </div>
      </div>
    );
};

const OnboardingStep2_BasicInfo = ({ formData, handleChange, nextStep, prevStep }) => (
  <div className="animate-fade-in-scale">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Financial Foundation</h3>
    <p className="text-lg text-gray-400 mb-8 text-center">Now, let's look at your financial overview.</p>
    <div className="space-y-6">
      <div>
        <label htmlFor="monthlyIncome" className="block text-gray-300 text-lg font-semibold mb-2">
          Average Monthly Income (₹)
        </label>
        <input
          type="text" // Change to text to handle sanitization
          inputMode="numeric" // Helps mobile users see a numeric keyboard
          id="monthlyIncome"
          name="monthlyIncome"
          value={formData.monthlyIncome}
          onChange={handleChange}
          className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
          placeholder="e.g., 50000"
          required
        />
      </div>
      <div>
        <label htmlFor="netWorth" className="block text-gray-300 text-lg font-semibold mb-2">
          Current Net Worth (₹) - (Assets minus Liabilities)
        </label>
        <input
          type="text" // Change to text to handle sanitization
          inputMode="numeric"
          id="netWorth"
          name="netWorth"
          value={formData.netWorth}
          onChange={handleChange}
          className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
          placeholder="e.g., 500000"
        />
      </div>
       <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-md"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg"
        >
          Next: Your Expenses
        </button>
      </div>
    </div>
  </div>
);

const OnboardingStep3_Expenses = ({ formData, setFormData, nextStep, prevStep }) => {
  const expenseCategories = [
    { name: 'housing', label: 'Housing (Rent/EMI, Maintenance)' },
    { name: 'food', label: 'Food (Groceries, Dining Out)' },
    { name: 'transportation', label: 'Transportation (Fuel, Public Transport, Vehicle EMI)' },
    { name: 'utilities', label: 'Utilities (Electricity, Water, Internet)' },
    { name: 'entertainment', label: 'Entertainment (Movies, Subscriptions, Hobbies)' },
    { name: 'healthcare', label: 'Healthcare (Medicines, Doctor Visits, Insurance Premiums)' },
    { name: 'personalCare', label: 'Personal Care (Salon, Gym, Clothing)' },
    { name: 'education', label: 'Education (Tuition, Books)' },
    { name: 'debtPayments', label: 'Debt Payments (Loans, Credit Cards - excluding Home/Vehicle EMI)' },
    { name: 'miscellaneous', label: 'Miscellaneous/Other Expenses' },
  ];

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = value.replace(/[^0-9]/g, ''); // Allow only numbers
    setFormData(prev => ({
      ...prev,
      expenses: { ...prev.expenses, [name]: sanitizedValue }
    }));
  };

  return (
    <div className="animate-fade-in-scale">
      <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">Your Monthly Expenses</h3>
      <p className="text-lg text-gray-400 mb-8 text-center">Let's break down where your money goes each month.</p>
      <div className="space-y-4">
        {expenseCategories.map(category => (
          <div key={category.name}>
            <label htmlFor={category.name} className="block text-gray-300 font-semibold mb-1">
              {category.label} (₹)
            </label>
            <input
              type="text" // Change to text to handle sanitization
              inputMode="numeric"
              id={category.name}
              name={category.name}
              value={formData.expenses?.[category.name] || ''}
              onChange={handleExpenseChange}
              className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
              placeholder="0"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-md"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg"
        >
          Next: Your Goals
        </button>
      </div>
    </div>
  );
};

const OnboardingStep4_Goals = ({ formData, setFormData, nextStep, prevStep }) => {
  const today = new Date().toISOString().split('T')[0];

  const handleGoalChange = (index, e) => {
    const { name, value, type } = e.target;
    // Sanitize number inputs
    const sanitizedValue = type === 'text' && name !== 'name' ? value.replace(/[^0-9]/g, '') : value;
    const newGoals = [...formData.customGoals];
    newGoals[index] = { ...newGoals[index], [name]: sanitizedValue };
    setFormData(prev => ({ ...prev, customGoals: newGoals }));
  };

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      customGoals: [...prev.customGoals, { name: '', targetAmount: '', amountSaved: '', targetDate: '' }]
    }));
  };

  const removeGoal = (index) => {
    setFormData(prev => ({
      ...prev,
      customGoals: prev.customGoals.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="animate-fade-in-scale">
      <h3 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Your Financial Goals</h3>
      <p className="text-lg text-gray-400 mb-8 text-center">What are you saving for? Let's define your aspirations.</p>
      <div className="space-y-6">
        {formData.customGoals.map((goal, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-xl mb-4 border border-gray-600">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-gray-300 font-semibold">
                Goal {index + 1}
              </label>
              {formData.customGals.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="text-red-400 hover:text-red-500 text-sm font-semibold transition duration-200"
                >
                  Remove
                </button>
              )}
            </div>
            <label htmlFor={`goalName-${index}`} className="block text-gray-300 font-semibold mt-2">
              Goal Name
            </label>
            <input
              type="text"
              id={`goalName-${index}`}
              name="name"
              value={goal.name}
              onChange={(e) => handleGoalChange(index, e)}
              className="w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-green-400 text-base mb-2"
              placeholder="e.g., Buy a house, Retirement"
            />
            <label htmlFor={`goalAmount-${index}`} className="block text-gray-300 font-semibold mt-2">
              Target Amount (₹)
            </label>
            <input
              type="text"
              inputMode="numeric"
              id={`goalAmount-${index}`}
              name="targetAmount"
              value={goal.targetAmount}
              onChange={(e) => handleGoalChange(index, e)}
              className="w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-green-400 text-base mb-2"
              placeholder="e.g., 10000000"
            />
            <label htmlFor={`amountSaved-${index}`} className="block text-gray-300 font-semibold mt-2">
              Amount Already Saved for this Goal (₹)
            </label>
            <input
              type="text"
              inputMode="numeric"
              id={`amountSaved-${index}`}
              name="amountSaved"
              value={goal.amountSaved}
              onChange={(e) => handleGoalChange(index, e)}
              className="w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-green-400 text-base mb-2"
              placeholder="e.g., 50000"
            />
            <label htmlFor={`goalDate-${index}`} className="block text-gray-300 font-semibold mt-2">
              Target Date
            </label>
            <input
              type="date"
              id={`goalDate-${index}`}
              name="targetDate"
              value={goal.targetDate}
              min={today} // Prevent setting goals for the past
              onChange={(e) => handleGoalChange(index, e)}
              className="w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-green-400 text-base"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addGoal}
          className="w-full bg-green-700 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-600 transition duration-200 ease-in-out shadow-md hover:shadow-lg"
        >
          + Add Another Goal
        </button>
      </div>
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-md"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg"
        >
          Next: Additional Info
        </button>
      </div>
    </div>
  );
};

const OnboardingStep5_AdditionalInfo = ({ formData, handleChange, prevStep, handleSubmit }) => (
  <div className="animate-fade-in-scale">
    <h3 className="text-3xl font-bold text-green-400 mb-6 text-center">A Little More About You</h3>
    <p className="text-lg text-gray-400 mb-8 text-center">Help us tailor your advice even further.</p>
    <div className="space-y-6">
      <div>
        <label htmlFor="riskTolerance" className="block text-gray-300 text-lg font-semibold mb-2">
          Your Risk Tolerance
        </label>
        <select
          id="riskTolerance"
          name="riskTolerance"
          value={formData.riskTolerance}
          onChange={handleChange}
          className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
        >
          <option value="">Select one</option>
          <option value="low">Low (Prefer safety over high returns)</option>
          <option value="medium">Medium (Balanced approach)</option>
          <option value="high">High (Comfortable with risk for higher returns)</option>
        </select>
      </div>
      <div>
        <label htmlFor="currentInvestments" className="block text-gray-300 text-lg font-semibold mb-2 mt-4">
          Current Investments (e.g., Stocks, Mutual Funds, FD, Gold)
        </label>
        <textarea
          id="currentInvestments"
          name="currentInvestments"
          value={formData.currentInvestments}
          onChange={handleChange}
          rows="3"
          className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
          placeholder="Describe your current investment portfolio..."
        ></textarea>
      </div>
      <div>
        <label htmlFor="dependents" className="block text-gray-300 text-lg font-semibold mb-2 mt-4">
          Number of Dependents
        </label>
        <input
          type="text"
          inputMode="numeric"
          id="dependents"
          name="dependents"
          value={formData.dependents}
          onChange={handleChange}
          className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
          placeholder="e.g., 0, 1, 2"
        />
      </div>
      <div>
        <label htmlFor="debt" className="block text-gray-300 text-lg font-semibold mb-2 mt-4">
          Total Outstanding Debt (₹)
        </label>
        <input
          type="text"
          inputMode="numeric"
          id="debt"
          name="debt"
          value={formData.debt}
          onChange={handleChange}
          className="w-full p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
          placeholder="e.g., 150000 (home loan, personal loan, etc.)"
        />
      </div>
    </div>
    <div className="flex justify-between mt-8">
      <button
        onClick={prevStep}
        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-md"
      >
        Previous
      </button>
      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-4 px-8 rounded-xl text-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg hover:shadow-2xl"
      >
        Complete Onboarding & Go to Dashboard
      </button>
    </div>
  </div>
);


const OnboardingFlow = ({ onSubmit, initialData, userId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialData || {
    name: '',
    dateOfBirth: '',
    monthlyIncome: '',
    netWorth: '',
    expenses: {
      housing: '', food: '', transportation: '', utilities: '', entertainment: '',
      healthcare: '', personalCare: '', education: '', debtPayments: '', miscellaneous: ''
    },
    customGoals: [{ name: '', targetAmount: '', amountSaved: '', targetDate: '' }],
    riskTolerance: '',
    currentInvestments: '',
    dependents: '',
    debt: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Check if the input is one of our numeric-only fields
    const numericFields = ['monthlyIncome', 'netWorth', 'dependents', 'debt'];
    if (numericFields.includes(name)) {
        const sanitizedValue = value.replace(/[^0-9]/g, ''); // Allow only numbers
        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = () => {
    const totalMonthlyExpenses = Object.values(formData.expenses).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    onSubmit({ ...formData, monthlyExpenses: totalMonthlyExpenses });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
      <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-3xl w-full">
        {currentStep === 1 && (
          <OnboardingStep1_PersonalInfo
            formData={formData}
            handleChange={handleChange}
            nextStep={nextStep}
          />
        )}
        {currentStep === 2 && (
          <OnboardingStep2_BasicInfo
            formData={formData}
            handleChange={handleChange}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 3 && (
          <OnboardingStep3_Expenses
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 4 && (
          <OnboardingStep4_Goals
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 5 && (
          <OnboardingStep5_AdditionalInfo
            formData={formData}
            handleChange={handleChange}
            prevStep={prevStep}
            handleSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};


// --- AIChat Component ---
const AIChat = ({ chatHistory, setChatHistory, isGeneratingResponse, callGeminiAPI, userId }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    callGeminiAPI(chatInput);
    setChatInput('');
  };

  return (
    <section className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-800 flex flex-col h-full min-h-[500px]">
      <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
      <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Start a conversation with ZENVANA AI! Ask anything about your finances.
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 p-3 rounded-xl max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-gray-700 text-gray-100 ml-auto rounded-br-none' // User bubble
                  : 'bg-gray-800 text-gray-200 mr-auto rounded-bl-none' // AI bubble
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {msg.role === 'user' ? 'You' : 'ZENVANA AI'}
              </p>
              {msg.role === 'user' ? <p>{msg.parts[0].text}</p> : <MarkdownRenderer text={msg.parts[0].text} />}
            </div>
          ))
        )}
        {isGeneratingResponse && (
          <div className="mb-3 p-3 rounded-xl bg-gray-800 text-gray-200 mr-auto rounded-bl-none animate-pulse">
            <p className="text-sm font-semibold mb-1">ZENVANA AI</p>
            <p>Thinking...</p>
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-grow p-3 border border-gray-700 rounded-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isGeneratingResponse}
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isGeneratingResponse || chatInput.trim() === ''}
        >
          Send
        </button>
      </form>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #222;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10B981; /* Bright Green */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669; /* Darker Green */
        }
      `}</style>
    </section>
  );
};

// --- TaxSaver Component ---
const TaxSaver = ({ userId }) => {
    const [taxData, setTaxData] = useState({
        salaryIncome: '',
        otherIncome: '',
        investments80C: '',
        hra: '',
        homeLoanInterest: '',
        medicalInsurance80D: '',
        nps_80ccd1b: '',
        educationLoanInterest_80e: '',
    });
    const [taxResult, setTaxResult] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    
    // Define more descriptive labels for the form fields
    const fieldLabels = {
        salaryIncome: "Annual Salary Income (from Form 16)",
        otherIncome: "Annual Income from Other Sources (e.g., Interest, Rent)",
        investments80C: "Total Investments under Section 80C (PPF, ELSS, etc.)",
        hra: "House Rent Allowance (HRA) Exemption Claimed",
        homeLoanInterest: "Interest on Home Loan (Section 24)",
        medicalInsurance80D: "Medical Insurance Premium (Section 80D)",
        nps_80ccd1b: "NPS Contribution (Section 80CCD(1B))",
        educationLoanInterest_80e: "Interest on Education Loan (Section 80E)",
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = value.replace(/[^0-9]/g, ''); // Allow only numbers
        setTaxData(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    const calculateTax = (taxableIncome, isOldRegime) => {
        const cess = 0.04;
        let tax = 0;
        let slab = '0%';

        const slabs = isOldRegime
            ? [
                { limit: 1000000, rate: 0.30, base: 112500 },
                { limit: 500000, rate: 0.20, base: 12500 },
                { limit: 250000, rate: 0.05, base: 0 },
                { limit: 0, rate: 0, base: 0 }
            ]
            : [ // New Regime Slabs (FY 2024-25)
                { limit: 1500000, rate: 0.30, base: 150000 },
                { limit: 1200000, rate: 0.20, base: 90000 },
                { limit: 900000, rate: 0.15, base: 45000 },
                { limit: 600000, rate: 0.10, base: 15000 },
                { limit: 300000, rate: 0.05, base: 0 },
                { limit: 0, rate: 0, base: 0 }
            ];

        for (const s of slabs) {
            if (taxableIncome > s.limit) {
                tax = s.base + (taxableIncome - s.limit) * s.rate;
                slab = `${s.rate * 100}%`;
                break;
            }
        }

        const totalTax = tax * (1 + cess);
        return { totalTax: Math.round(totalTax), slab };
    };

    const handleTaxCalculation = async () => {
        setIsCalculating(true);
        setTaxResult(null);
        setAiAnalysis('');

        const grossIncome = parseFloat(taxData.salaryIncome || 0) + parseFloat(taxData.otherIncome || 0);

        // New Regime Calculation
        const standardDeductionNew = 50000;
        const taxableIncomeNew = Math.max(0, grossIncome - standardDeductionNew);
        const newRegimeResult = calculateTax(taxableIncomeNew, false);

        // Old Regime Calculation
        const standardDeductionOld = 50000;
        const totalDeductions =
            parseFloat(taxData.investments80C || 0) +
            parseFloat(taxData.hra || 0) +
            parseFloat(taxData.homeLoanInterest || 0) +
            parseFloat(taxData.medicalInsurance80D || 0) +
            parseFloat(taxData.nps_80ccd1b || 0) +
            parseFloat(taxData.educationLoanInterest_80e || 0);
        
        const taxableIncomeOld = Math.max(0, grossIncome - standardDeductionOld - totalDeductions);
        const oldRegimeResult = calculateTax(taxableIncomeOld, true);
        
        const result = {
            newRegime: { tax: newRegimeResult.totalTax, slab: newRegimeResult.slab },
            oldRegime: { tax: oldRegimeResult.totalTax, slab: oldRegimeResult.slab },
            savings: Math.abs(newRegimeResult.totalTax - oldRegimeResult.totalTax),
            betterOption: newRegimeResult.totalTax < oldRegimeResult.totalTax ? 'New' : 'Old',
        };
        setTaxResult(result);

        const currentDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
        // AI Analysis Prompt
        const prompt = `As ZENVANA, an expert Indian financial advisor, analyze the following tax calculation. The current date is ${currentDate}. The user wants to know which tax regime is better for them and why.

        **Response Style Guide:**
        - **Formatting:** Use Markdown. Use hashes for headings (e.g., ## My Heading), double asterisks for bold (e.g., **Important**), and hyphens for lists.
        - **Tone:** Precise and straightforward.
        - **Content:**
          1. Start by stating which regime is better and by how much.
          2. Explain that under the **Old Regime**, their tax slab is **${result.oldRegime.slab}**, and under the **New Regime**, it's **${result.newRegime.slab}**.
          3. Provide actionable advice based on their inputs. If they haven't filled their 80C limit, suggest it. If their deductions are low, explain why the New Regime might be better.

        **User's Data for Context:**
        - Gross Income: ₹${grossIncome}
        - Total Deductions Claimed (Old Regime): ₹${totalDeductions}
        - 80C Investments: ₹${taxData.investments80C || 0}
        
        Generate a helpful and actionable analysis.`;

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('AI analysis failed');
            const aiResult = await response.json();
            const analysisText = aiResult.candidates[0].content.parts[0].text;
            setAiAnalysis(analysisText);
        } catch (error) {
            console.error("Error fetching AI analysis:", error);
            setAiAnalysis("Could not fetch AI analysis at this time.");
        } finally {
            setIsCalculating(false);
        }
    };

    const investment80C = parseFloat(taxData.investments80C || 0);
    const limit80C = 150000;
    const progress80C = Math.min((investment80C / limit80C) * 100, 100);

    return (
        <section className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-800">
            <h2 className="text-3xl font-bold text-green-400 mb-2">Interactive Tax Saver</h2>
            <p className="text-gray-400 mb-6">Compare tax regimes and get AI-powered advice instantly.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Form */}
                <div className="space-y-4">
                    {Object.keys(taxData).map((key) => (
                         <div key={key}>
                            <label htmlFor={key} className="block text-gray-300 font-semibold mb-1">{fieldLabels[key]} (₹)</label>
                            <input type="text" inputMode="numeric" name={key} value={taxData[key]} onChange={handleNumberChange} className="w-full p-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-green-500" />
                            {key === 'investments80C' && (
                                <>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress80C}%` }}></div>
                                    </div>
                                    <p className="text-xs text-right text-gray-400 mt-1">Utilized: ₹{investment80C.toLocaleString()} / ₹{limit80C.toLocaleString()}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* Results and Analysis */}
                <div className="space-y-4">
                    <button onClick={handleTaxCalculation} disabled={isCalculating} className="w-full bg-green-600 hover:bg-green-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {isCalculating ? 'Calculating...' : 'Calculate & Analyze Tax'}
                    </button>
                    {taxResult && (
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 animate-fade-in-scale">
                            <h3 className="text-xl font-bold text-yellow-400 mb-4 text-center">Tax Regime Comparison</h3>
                             <div className="text-center mb-4 p-3 rounded-lg bg-green-900 border border-green-700">
                                <p className="text-lg font-bold text-white">The **{taxResult.betterOption} Regime** is better for you.</p>
                                <p className="text-2xl font-extrabold text-green-400">You save ₹{taxResult.savings.toLocaleString()}!</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <h4 className="font-bold text-lg text-gray-200">Old Regime</h4>
                                    <p className="text-2xl font-bold text-white">₹{taxResult.oldRegime.tax.toLocaleString()}</p>
                                    <p className="text-sm text-gray-400">Tax Slab: {taxResult.oldRegime.slab}</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <h4 className="font-bold text-lg text-gray-200">New Regime</h4>
                                    <p className="text-2xl font-bold text-white">₹{taxResult.newRegime.tax.toLocaleString()}</p>
                                    <p className="text-sm text-gray-400">Tax Slab: {taxResult.newRegime.slab}</p>
                                </div>
                            </div>
                        </div>
                    )}
                     {aiAnalysis && (
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 animate-fade-in-scale">
                             <h3 className="text-xl font-bold text-green-400 mb-2">ZENVANA AI's Advice</h3>
                             <MarkdownRenderer text={aiAnalysis} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};


// --- Dashboard Component ---
const Dashboard = ({ financialSummary, userId, saveFinancialSummary, callGeminiAPI, handleLogout }) => {
  const [budgetAnalysisResult, setBudgetAnalysisResult] = useState('');
  const [isAnalyzingBudget, setIsAnalyzingBudget] = useState(false);
  const [goalPlanResults, setGoalPlanResults] = useState({}); // Stores plans for each goal by index
  const [isGeneratingGoalPlan, setIsGeneratingGoalPlan] = useState({}); // Track loading state for each goal

  const totalMonthlyExpenses = Object.values(financialSummary?.expenses || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);
  const monthlySavings = (financialSummary?.monthlyIncome || 0) - totalMonthlyExpenses;
  const savingsRate = financialSummary?.monthlyIncome ? ((monthlySavings / financialSummary.monthlyIncome) * 100).toFixed(2) : 0;

  const calculateGoalProgress = (goal) => {
    if (!goal.targetAmount || parseFloat(goal.targetAmount) === 0) return null;
    const targetAmount = parseFloat(goal.targetAmount);
    const amountSaved = parseFloat(goal.amountSaved || 0);
    const progress = Math.min(100, (amountSaved / targetAmount) * 100);

    let status = 'On Track';
    if (progress >= 100) {
      status = 'Achieved!';
    }
    
    return {
      progress: progress.toFixed(2),
      status: status
    };
  };

  const handleAnalyzeBudget = async () => {
    setIsAnalyzingBudget(true);
    setBudgetAnalysisResult('');

    const currentDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `As a financial advisor for ZENVANA, analyze the provided financial data for a user in India. The current date is ${currentDate}. Based on their specific numbers, provide a personalized budget optimization plan.

    **Response Style Guide:**
    - **Formatting:** Use Markdown. Use hashes for headings (e.g., ## My Heading), double asterisks for bold (e.g., **Important**), and hyphens for lists.
    - **Tone:** Precise, encouraging, and straightforward.
    - **Content:** Do NOT repeat the user's raw financial numbers (income, expenses). Use the data to give tailored advice. For example, instead of "Your income is ₹50,000", say "With your current income, you can focus on...".

    Here is the user's data for your analysis:
    - Monthly Income: ₹${financialSummary.monthlyIncome || 'Not provided'}
    - Monthly Expenses Breakdown: ${JSON.stringify(financialSummary.expenses || {})}
    - Net Worth: ₹${financialSummary.netWorth || 'Not provided'}
    - Current Monthly Savings: ₹${monthlySavings}

    Provide a helpful and actionable response that is directly tailored to these details.`;

    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc"; 

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        setBudgetAnalysisResult(result.candidates[0].content.parts[0].text);
      } else {
        setBudgetAnalysisResult("Sorry, I couldn't generate budget analysis at this moment. Please try again.");
      }
    } catch (error) {
      console.error("Error analyzing budget:", error);
      setBudgetAnalysisResult(`Error analyzing budget: ${error.message}`);
    } finally {
      setIsAnalyzingBudget(false);
    }
  };

  const handleGenerateGoalPlan = async (goal, index) => {
    setIsGeneratingGoalPlan(prev => ({ ...prev, [index]: true }));
    setGoalPlanResults(prev => ({ ...prev, [index]: '' }));
    
    const currentDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `
    You are ZENVANA, an expert Indian financial advisor. Your task is to create a highly personalized and actionable financial plan for a user to achieve a specific goal. The current date is ${currentDate}.

    **Analyze the user's complete financial situation first:**
    - **Name:** ${financialSummary.name}
    - **Monthly Income:** ₹${financialSummary.monthlyIncome}
    - **Total Monthly Expenses:** ₹${totalMonthlyExpenses}
    - **Current Monthly Savings (Surplus):** ₹${monthlySavings}
    - **Risk Tolerance:** ${financialSummary.riskTolerance}
    - **Existing Investments:** ${financialSummary.currentInvestments || 'Not specified'}
    - **Dependents:** ${financialSummary.dependents}
    - **Outstanding Debt:** ₹${financialSummary.debt}

    **Now, focus on this specific goal:**
    - **Goal Name:** ${goal.name}
    - **Target Amount:** ₹${goal.targetAmount}
    - **Amount Already Saved:** ₹${goal.amountSaved}
    - **Target Date:** ${goal.targetDate}

    **Your Response MUST follow this structure:**

    1.  **Goal Analysis:**
        - Start with a clear heading: **Action Plan for your '${goal.name}' Goal**.
        - Calculate the remaining amount needed.
        - Calculate the number of months until the target date.
        - Calculate the **Required Monthly Investment (RMI)** to reach the goal. State this number clearly and in bold.

    2.  **Investment Strategy (Personalized):**
        - Create a heading: **Personalized Investment Strategy**.
        - Based on the user's **Risk Tolerance** ('low', 'medium', 'high') and the goal's timeline (short-term, mid-term, long-term), recommend a specific asset allocation.
        - **Example for 'high' risk:** "Given your high-risk tolerance and a long-term horizon, I recommend an aggressive growth strategy. Consider allocating funds to a diversified portfolio of 70% in equity mutual funds (e.g., a mix of large-cap and flexi-cap funds) and 30% in debt instruments to provide stability."
        - **Example for 'low' risk:** "For your short-term goal and low-risk preference, capital preservation is key. I suggest a conservative approach: 80% in high-yield savings accounts or liquid funds, and 20% in corporate bond funds."
        - Suggest 1-2 specific types of investment products available in India that fit the strategy (e.g., "Index Funds," "ELSS for tax saving," "Corporate Bond Funds," "Post Office Deposits").

    3.  **Bridging the Gap (If Necessary):**
        - Compare the **Required Monthly Investment (RMI)** with the user's **Current Monthly Savings (Surplus)**.
        - If the RMI is higher than their current surplus, create a heading: **How to Bridge the Savings Gap**.
        - Provide 2-3 **concrete, actionable suggestions** to increase their savings. Analyze their expense breakdown (${JSON.stringify(financialSummary.expenses)}) to find potential areas for reduction. For example: "I noticed your 'Entertainment' expenses are ₹${financialSummary.expenses.entertainment}. Could you reduce this by ₹[amount] by opting for home-streaming services over frequent cinema visits?" or "Consider negotiating your internet bill or switching to a cheaper plan to save on 'Utilities'."

    4.  **Final Encouragement:**
        - End with a positive and encouraging closing statement.

    **Formatting Rules:**
    - Use Markdown. Use hashes for headings (e.g., ## My Heading), double asterisks for bold (e.g., **Important**), and hyphens for lists.
    - Keep the tone professional, precise, and empowering.
    `;

    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        setGoalPlanResults(prev => ({ ...prev, [index]: result.candidates[0].content.parts[0].text }));
      } else {
        setGoalPlanResults(prev => ({ ...prev, [index]: "Sorry, I couldn't generate a personalized plan for this goal at this moment." }));
      }
    } catch (error) {
      console.error("Error generating goal plan:", error);
      setGoalPlanResults(prev => ({ ...prev, [index]: `Error generating plan: ${error.message}` }));
    } finally {
      setIsGeneratingGoalPlan(prev => ({ ...prev, [index]: false }));
    }
  };


  return (
    <section className="bg-gray-900 bg-opacity-80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-800 flex flex-col h-full">
      <h2 className="text-4xl font-bold text-green-400 mb-6">
        Welcome, <span className="text-yellow-400">{financialSummary?.name || 'User'}!</span>
      </h2>
      {financialSummary ? (
        <div className="space-y-6 text-lg">
           <h3 className="text-2xl font-bold text-gray-300 mt-6 mb-3">Your Financial Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-between items-start border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0">
              <span className="font-semibold text-gray-300">Net Worth:</span>
              <span className="text-white font-bold text-3xl mt-1 break-all">₹{parseFloat(financialSummary.netWorth || 0).toLocaleString()}</span>
            </div>
            <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-between items-start border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0">
              <span className="font-semibold text-gray-300">Monthly Income:</span>
              <span className="text-green-400 font-bold text-3xl mt-1 break-all">₹{parseFloat(financialSummary.monthlyIncome || 0).toLocaleString()}</span>
            </div>
            <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-between items-start border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0">
              <span className="font-semibold text-gray-300">Monthly Expenses:</span>
              <span className="text-yellow-400 font-bold text-3xl mt-1 break-all">₹{totalMonthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-between items-start border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0">
              <span className="font-semibold text-gray-300">Monthly Savings:</span>
              <span className="text-green-400 font-bold text-3xl mt-1 break-all">₹{monthlySavings.toLocaleString()}</span>
            </div>
            <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-between items-start border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0">
              <span className="font-semibold text-gray-300">Savings Rate:</span>
              <span className="text-green-400 font-bold text-3xl mt-1 break-all">{savingsRate}%</span>
            </div>
            <div className="bg-gray-800 p-5 rounded-xl flex flex-col justify-between items-start border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0">
              <span className="font-semibold text-gray-300">Risk Tolerance:</span>
              <span className="text-gray-200 font-bold text-3xl mt-1 capitalize break-all">{financialSummary.riskTolerance || 'N/A'}</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-4 text-right">
            Last Updated: {new Date(financialSummary.lastUpdated).toLocaleDateString()}
          </p>

          <h3 className="text-2xl font-bold text-yellow-400 mt-6 mb-3">Your Goals Progress</h3>
          {financialSummary.customGoals && financialSummary.customGoals.length > 0 && financialSummary.customGoals.some(g => g.name) ? (
            <div className="space-y-4">
              {financialSummary.customGoals.map((goal, index) => {
                const goalProgress = calculateGoalProgress(goal);
                return goalProgress ? (
                  <div key={index} className="bg-gray-800 p-5 rounded-xl border border-gray-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-300 text-xl">{goal.name}</span>
                      <span className="text-sm text-gray-400">Target: ₹{parseFloat(goal.targetAmount).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                      <div
                        className="bg-green-500 h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-center text-xs font-bold text-gray-900"
                        style={{ width: `${goalProgress.progress}%` }}
                      >
                       {goalProgress.progress > 10 && `${goalProgress.progress}%`}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 text-right">
                      Saved: <span className="font-bold text-white">₹{parseFloat(goal.amountSaved || 0).toLocaleString()}</span> / <span className="font-bold text-white">₹{parseFloat(goal.targetAmount).toLocaleString()}</span>
                       <span className={`ml-2 font-bold ${goalProgress.status === 'Achieved!' ? 'text-green-400' : 'text-yellow-400'}`}>({goalProgress.status})</span>
                    </p>
                    <button
                      onClick={() => handleGenerateGoalPlan(goal, index)}
                      className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isGeneratingGoalPlan[index]}
                    >
                      {isGeneratingGoalPlan[index] ? 'Generating Plan...' : '✨ Generate Action Plan'}
                    </button>
                    {goalPlanResults[index] && (
                      <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-xl">
                        <MarkdownRenderer text={goalPlanResults[index]} />
                      </div>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-gray-500">No custom goals set yet. Please go to Onboarding to add some!</p>
          )}

          <h3 className="text-2xl font-bold text-green-400 mt-6 mb-3">General Suggestions</h3>
          <div className="bg-gray-700 p-5 rounded-xl border border-gray-600">
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Consider increasing your monthly savings to accelerate goal achievement.</li>
              <li>Explore investment options aligned with your risk tolerance for better returns.</li>
              <li>Review your monthly expenses to identify areas for potential cost reduction.</li>
              <li>Utilize the Tax Saver tool to optimize your tax liabilities.</li>
              <li>Don't hesitate to use the AI Chat for personalized advice on any financial topic!</li>
            </ul>
          </div>

          <h3 className="text-2xl font-bold text-yellow-400 mt-6 mb-3">✨ Budget Analysis & Optimization</h3>
          <div className="bg-gray-700 p-5 rounded-xl border border-gray-600">
            <button
              onClick={handleAnalyzeBudget}
              className="w-full bg-green-600 hover:bg-green-700 text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 ease-in-out transform hover:-translate-y-1 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAnalyzingBudget}
            >
              {isAnalyzingBudget ? 'Analyzing Budget...' : '✨ Get Budget Optimization Tips'}
            </button>
            {budgetAnalysisResult && (
              <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-xl">
                <MarkdownRenderer text={budgetAnalysisResult} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading financial summary...</p>
      )}
    </section>
  );
};


// --- Main App Component ---
function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome'); // 'welcome', 'onboarding', 'dashboard', 'taxSaver', 'aiChat'
  const [financialSummary, setFinancialSummary] = useState(null); // This will hold all user financial data

  const [chatHistory, setChatHistory] = useState([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);

  // Add global style to disable number input scroll
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide arrows from number inputs in Chrome, Safari, Edge, Opera */
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Hide arrows from number inputs in Firefox */
      input[type=number] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);


  // Firebase Initialization and Authentication
  useEffect(() => {
    try {
      const appId = '1:783039988566:web:6e8948d86341d4805eccf7'; // Your App ID
      // YOUR FIREBASE CONFIG IS NOW DIRECTLY HERE
      const firebaseConfig = {
          apiKey: "AIzaSyDjN0_LU5WEtCNLNryPIUjavIJAOXghCCQ",
          authDomain: "zenvana-web.firebaseapp.com",
          projectId: "zenvana-web",
          storageBucket: "zenvana-web.firebasestorage.app",
          messagingSenderId: "783039988566",
          appId: "1:783039988566:web:6e8948d86341d4805eccf7",
          measurementId: "G-TVZF4SK0YG"
      };
      
      const initialAuthToken = null;

      if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase config is not available.");
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
          console.log("Firebase Auth State Changed: User is signed in with UID:", user.uid);
          if (firestore) {
            fetchFinancialData(firestore, user.uid, appId);
          }
        } else {
          console.log("Firebase Auth State Changed: No user is signed in. Attempting anonymous sign-in or custom token sign-in.");
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
              console.log("Signed in with custom token.");
            } else {
              await signInAnonymously(firebaseAuth);
              console.log("Signed in anonymously.");
            }
          } catch (error) {
            console.error("Firebase authentication error:", error);
          }
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);

  // Function to fetch financial data from Firestore
  const fetchFinancialData = useCallback(async (firestore, currentUserId, appId) => {
    if (!firestore || !currentUserId || !appId) {
      console.log("Firestore or userId or appId not ready for fetching financial data.");
      return;
    }
    try {
      const docRef = doc(firestore, `artifacts/${appId}/users/${currentUserId}/financial_data`, 'summary');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFinancialSummary(data);
        console.log("Financial data fetched:", data);
      } else {
        console.log("No financial data found for this user.");
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    }
  }, []);


  // Function to save financial data to Firestore
  const saveFinancialData = async (data) => {
    if (!db || !userId) {
      console.error("Database or User ID not available to save data.");
      return;
    }
    try {
      const appId = '1:783039988566:web:6e8948d86341d4805eccf7'; // Your App ID
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/financial_data`, 'summary');

      const expensesParsed = {};
      for (const key in data.expenses) {
        expensesParsed[key] = parseFloat(data.expenses[key] || 0);
      }

      const dataToSave = {
        ...data,
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        monthlyIncome: parseFloat(data.monthlyIncome || 0),
        monthlyExpenses: Object.values(expensesParsed).reduce((sum, val) => sum + val, 0),
        expenses: expensesParsed,
        netWorth: parseFloat(data.netWorth || 0),
        dependents: parseInt(data.dependents || 0),
        debt: parseFloat(data.debt || 0),
        customGoals: data.customGoals.map(goal => ({
          ...goal,
          targetAmount: parseFloat(goal.targetAmount || 0),
          amountSaved: parseFloat(goal.amountSaved || 0),
        })),
        lastUpdated: new Date().toISOString()
      };

      await setDoc(docRef, dataToSave, { merge: true });
      setFinancialSummary(dataToSave);
      console.log("Financial data saved successfully!");
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Error saving financial data:", error);
    }
  };

  // Function to call Gemini API
  const callGeminiAPI = async (userMessage) => {
    setIsGeneratingResponse(true);
    
    const totalExpenses = Object.values(financialSummary.expenses || {}).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const goalsSummary = financialSummary.customGoals.map(g => `${g.name} (Target: ₹${g.targetAmount}, Saved: ₹${g.amountSaved})`).join(', ');
    const currentDate = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
    
    const contextPrompt = `You are ZENVANA, a friendly and expert financial advisor for users in India. The current date is ${currentDate}.

    **Your Persona & Response Style:**
    - **Formatting:** Use Markdown. Use hashes for headings (e.g., ## My Heading), double asterisks for bold (e.g., **Important**), and hyphens for lists.
    - **Tone:** Be precise, encouraging, and straightforward.
    - **Context is Key:** Always use the user's profile below to make your answer highly personalized and relevant.

    **User Profile for Context:**
    - Name: ${financialSummary.name}
    - Monthly Income: ₹${financialSummary.monthlyIncome}
    - Net Worth: ₹${financialSummary.netWorth}
    - Total Monthly Expenses: ₹${totalExpenses}
    - Financial Goals: ${goalsSummary || 'None set'}
    - Risk Tolerance: ${financialSummary.riskTolerance}
    - Dependents: ${financialSummary.dependents}
    - Outstanding Debt: ₹${financialSummary.debt}

    Now, provide a personalized and helpful response to the user's message:
    "${userMessage}"`;

    const currentChatHistory = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
    setChatHistory(currentChatHistory);

    try {
      const payload = { contents: [{ role: "user", parts: [{ text: contextPrompt }] }] };
      const apiKey = "AIzaSyCI2bvLtdFURRGEio7u_6GXFqgoOcGkLnc";

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.error.message}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setChatHistory(prev => [...prev, { role: "model", parts: [{ text: text }] }]);
      } else {
        setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "Sorry, I couldn't generate a response." }] }]);
        console.warn("Unexpected Gemini API response structure:", result);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: `Error: ${error.message}` }] }]);
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // Effect to fetch initial data once auth is ready
  useEffect(() => {
    if (isAuthReady && db && userId) {
      fetchFinancialData(db, userId, '1:783039988566:web:6e8948d86341d4805eccf7'); // Your App ID
    }
  }, [isAuthReady, db, userId, fetchFinancialData]);

  // Logout Function
  const handleLogout = async () => {
    if (!auth || !db || !userId) {
      console.error("Auth, DB, or User ID not available for logout.");
      return;
    }
    try {
      const appId = '1:783039988566:web:6e8948d86341d4805eccf7'; // Your App ID
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/financial_data`, 'summary');
      await deleteDoc(docRef);

      await signOut(auth);
      setFinancialSummary(null);
      setChatHistory([]);
      setUserId(null);
      setIsAuthReady(false);
      setCurrentPage('welcome');
      console.log("User logged out and data cleared.");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };


  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-100">
        <div className="text-xl text-gray-300">Loading ZENVANA...</div>
      </div>
    );
  }

  const navigateToOnboardingOrDashboard = () => {
    if (financialSummary && financialSummary.monthlyIncome > 0) {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('onboarding');
    }
  };

  return (
    <div className="min-h-screen">
      {currentPage === 'welcome' && <WelcomePage onGetStarted={navigateToOnboardingOrDashboard} />}
      {currentPage === 'onboarding' && <OnboardingFlow onSubmit={saveFinancialData} initialData={financialSummary} userId={userId} />}
      {currentPage !== 'welcome' && currentPage !== 'onboarding' && (
        <Layout userId={userId} onNavigate={setCurrentPage} currentPage={currentPage} handleLogout={handleLogout}>
          {currentPage === 'dashboard' && (
            <Dashboard
              financialSummary={financialSummary}
              userId={userId}
              saveFinancialSummary={saveFinancialData}
              callGeminiAPI={callGeminiAPI}
              handleLogout={handleLogout}
            />
          )}
          {currentPage === 'taxSaver' && (
            <TaxSaver
              userId={userId}
            />
          )}
          {currentPage === 'aiChat' && (
            <AIChat
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              isGeneratingResponse={isGeneratingResponse}
              callGeminiAPI={callGeminiAPI}
              userId={userId}
            />
          )}
        </Layout>
      )}
    </div>
  );
}

export default App;