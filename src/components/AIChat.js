// src/components/AIChat.js

import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

const AIChat = ({ chatHistory, setChatHistory, isGeneratingResponse, callChatAPI, financialSummary }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatHistory.length === 0) {
        setChatHistory([{
            role: 'model',
            parts: [{ text: `Namaste, ${financialSummary?.name || 'User'}! I'm your AI financial companion. Ask me anything about your finances, or select one of the suggestions below to get started.` }]
        }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    callChatAPI(chatInput);
    setChatInput('');
  };

  const handlePromptClick = (prompt) => {
    callChatAPI(prompt);
  };

  const generateChatPrompts = () => {
    if (!financialSummary) return [];
    const prompts = [];
    const { healthInsurance, termInsurance, customGoals, debt } = financialSummary;

    if (healthInsurance === 'no') prompts.push("Why is health insurance important in India?");
    if (termInsurance === 'no') prompts.push("Explain term insurance in simple terms.");
    if (customGoals && customGoals.length > 0 && customGoals[0].name) prompts.push(`How can I best invest for my "${customGoals[0].name}" goal?`);
    if (parseFloat(debt || 0) > 0) prompts.push("What's a good strategy to pay off my debt faster?");
    
    if (prompts.length === 0) {
        prompts.push("How can I increase my savings rate?");
        prompts.push("What are some good investment options for beginners in India?");
    }
    return prompts.slice(0, 3);
  };

  const suggestionPrompts = generateChatPrompts();

  return (
    <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-full min-h-[500px]">
      <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
      <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-700 ml-auto' : 'bg-gray-800 mr-auto'}`}>
            <p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'ZENVANA AI'}</p>
            <MarkdownRenderer text={msg.parts[0].text} />
          </div>
        ))}
        {isGeneratingResponse && (
          <div className="p-3 rounded-xl bg-gray-800 animate-pulse">
            <p>Thinking...</p>
          </div>
        )}
      </div>

      {!isGeneratingResponse && chatHistory.length <= 2 && (
          <div className="mb-4 flex flex-wrap gap-2">
              {suggestionPrompts.map((prompt, i) => (
                  <button key={i} onClick={() => handlePromptClick(prompt)} className="bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 py-2 px-3 rounded-full transition-colors">
                      {prompt}
                  </button>
              ))}
          </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about your finances..."
          className="flex-grow p-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
          disabled={isGeneratingResponse}
        />
        <button
          type="submit"
          className="bg-green-600 font-bold py-3 px-6 rounded-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!chatInput.trim() || isGeneratingResponse}
        >
          Send
        </button>
      </form>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
    </section>
  );
};

export default AIChat;
