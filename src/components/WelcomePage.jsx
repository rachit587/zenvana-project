import React from 'react';

const WelcomePage = ({ onGetStarted }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 flex items-center justify-center">
    <div className="max-w-3xl text-center p-8">
      <h1 className="text-6xl font-extrabold text-white mb-4">Welcome to ZENVANA</h1>
      <p className="text-2xl text-gray-300 mb-10">Your AI financial advisor for your financial freedom</p>
      <button onClick={onGetStarted} className="bg-gradient-to-r from-green-600 to-yellow-600 text-gray-900 font-bold py-4 px-10 rounded-full">
        Get Started for Free
      </button>
    </div>
  </div>
);

export default WelcomePage;
