import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
    const navigate = useNavigate();

    const FeatureCard = ({ icon, title, children }) => (
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700 text-left transition-all duration-300 hover:border-green-400 hover:shadow-green-glow hover:-translate-y-2">
            <div className="flex items-center mb-4">
                {icon}
                <h3 className="text-2xl font-bold text-green-400">{title}</h3>
            </div>
            <p className="text-gray-300">{children}</p>
        </div>
    );

    const handleGetStartedClick = () => {
        navigate('/auth');
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100 relative">
            <div className="absolute inset-0 z-0 opacity-10"><div className="absolute top-1/4 left-1/4 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div><div className="absolute top-1/2 right-1/4 w-48 h-48 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div><div className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div></div>
            <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto px-4 py-20 text-center">
                <h1 className="text-7xl md:text-8xl font-extrabold text-white mb-4 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-yellow-300">Welcome to ZENVANA</h1>
                <p className="text-2xl md:text-3xl text-gray-300 mb-10 max-w-3xl">Your AI financial advisor for your financial freedom</p>
                <section className="bg-gray-800 bg-opacity-70 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-gray-700 mb-8 max-w-3xl w-full transition-all duration-300 hover:shadow-green-glow">
                    <h2 className="text-4xl font-bold text-green-400 mb-4">Our Mission</h2>
                    <p className="text-xl text-gray-300 leading-relaxed">We believe financial expertise shouldn't be a luxury. Our mission is to empower every Indian with a personal AI advisor, making financial well-being and peace of mind a reality for all.</p>
                </section>
                <button onClick={handleGetStartedClick} className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-gray-900 font-bold py-5 px-12 rounded-full text-2xl transition duration-300 ease-in-out transform hover:-translate-y-2 hover:shadow-gold-glow shadow-lg mb-20">Get Started for Free</button>
                <section className="w-full">
                    <h2 className="text-5xl font-bold text-yellow-400 mb-12">All The Tools You Need. Powered by AI.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} title="Health Score">Get your free, real-time Financial Health Score to understand your standing at a glance and receive a personalized plan to improve it.</FeatureCard>
                        <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} title="Tax Saver">Our interactive AI tool compares tax regimes and analyzes your income to find every possible saving for you.</FeatureCard>
                        <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} title="AI Mentor">Your personal AI finance expert, ready 24/7 to answer any question, from complex investment queries to simple budgeting tips.</FeatureCard>
                        <FeatureCard icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} title="Dashboard">A single, clear view of your entire financial life—net worth, expenses, savings, and goals—all in one place.</FeatureCard>
                    </div>
                </section>
                <footer className="text-gray-400 text-md mt-20">Made with ❤️ by Rachit Banthia</footer>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 10s infinite cubic-bezier(0.6, 0.01, 0.3, 0.9); }
                .shadow-gold-glow { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6); }
                .shadow-green-glow { box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
            ` }} />
        </div>
    );
};

export default WelcomePage;
