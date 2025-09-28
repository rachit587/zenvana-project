// src/components/AIChat.js

import React, { useState, useEffect, useRef } from 'react';
import { getMarketData } from '../api/yahooFinance';
import { getCloudflareStreamedResponse, analyzeImageWithCloudflare } from '../api/cloudflare';
import { MarkdownRenderer, createFinancialSummaryPrompt } from '../utils/helpers';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

const AIChat = ({ financialSummary }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState(null);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatHistory.length === 0 && financialSummary?.name) {
      setChatHistory([{
        role: 'model',
        parts: [{ text: `Namaste, ${financialSummary.name}! I'm your Zenvana AI financial companion. How can I help you today? You can ask me questions or upload a document for analysis.` }]
      }]);
    }
  }, [financialSummary, chatHistory]);
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (chatInput.trim() === '' && !file) return;

    const userQuestion = chatInput;
    const userFile = file;

    let displayMessage = userQuestion;
    if (userFile) {
        displayMessage = `${userQuestion}\n(Attached file: ${userFile.name})`;
    }
    const newUserMessage = { role: "user", parts: [{ text: displayMessage }] };
    setChatHistory(prev => [...prev, newUserMessage, { role: "model", parts: [{ text: "" }] }]);
    
    setChatInput('');
    setFile(null);
    setIsGeneratingResponse(true);

    if (userFile) {
        setStatusText('Reading your document...');
        try {
            const base64Image = await fileToBase64(userFile);
            setStatusText('Analyzing document with AI...');
            const visionPrompt = `You are ZENVANA AI, a financial analyst. The user has uploaded a document and asked: "${userQuestion}". Analyze the document and answer their question. Be helpful and concise. If the document is not a financial statement, describe what you see.`;
            const aiResponse = await analyzeImageWithCloudflare(base64Image, visionPrompt);
            setChatHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                const updatedMessage = { ...lastMessage, parts: [{ ...lastMessage.parts[0], text: aiResponse }] };
                newHistory[newHistory.length - 1] = updatedMessage;
                return newHistory;
            });
        } catch (error) {
             setChatHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                const updatedMessage = { ...lastMessage, parts: [{ ...lastMessage.parts[0], text: "There was an error processing the uploaded file." }] };
                newHistory[newHistory.length - 1] = updatedMessage;
                return newHistory;
            });
        }
    } else {
        const investmentKeywords = ['invest', 'stock', 'market', 'buy', 'sip', 'equity', 'mutual fund', 'shares'];
        const isInvestmentQuery = investmentKeywords.some(keyword => userQuestion.toLowerCase().includes(keyword));
        let marketDataContext = "No real-time market data was fetched.";

        if (isInvestmentQuery) {
            setStatusText('Fetching live market data...');
            const symbols = ['^NSEI', '^BSESN'];
            const marketData = await getMarketData(symbols);
            if (marketData && marketData.length > 0) {
                const formattedData = marketData.map(d => `  - ${d.longName} (${d.symbol}): Price is ₹${d.regularMarketPrice?.toFixed(2)}, Change is ${d.regularMarketChange?.toFixed(2)} (${d.regularMarketChangePercent?.toFixed(2)}%)`).join('\n');
                marketDataContext = `Current live Indian market data:\n${formattedData}`;
            }
        }
        
        setStatusText('Zenvana AI is thinking...');
        const summaryPrompt = createFinancialSummaryPrompt(financialSummary);
        const prompt = `INSTRUCTIONS: You are ZENVANA AI, an expert financial advisor for India. Based on the user profile summary and market data below, answer the user's question. Your answer MUST be personalized, concise, and easy to understand.
---
**USER'S PROFILE SUMMARY:**
${summaryPrompt}
---
**REAL-TIME MARKET DATA (if relevant):**
${marketDataContext}
---
**USER'S QUESTION:**
"${userQuestion}"`;
        const messagesForAPI = [{ role: "user", content: prompt }];
        
        await getCloudflareStreamedResponse(messagesForAPI, (chunk) => {
            setChatHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                const updatedMessage = {
                    ...lastMessage,
                    parts: [{ ...lastMessage.parts[0], text: lastMessage.parts[0].text + chunk }]
                };
                newHistory[newHistory.length - 1] = updatedMessage;
                return newHistory;
            });
        });
    }

    setIsGeneratingResponse(false);
    setStatusText('');
  };

  return (
    <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col h-full min-h-[600px]" data-aos="fade-up">
      <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
      <div ref={chatHistoryRef} className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${msg.role === 'user' ? 'bg-gray-700 ml-auto' : 'bg-gray-800 mr-auto text-left'}`}>
            <p className="text-sm font-semibold mb-1">{msg.role === 'user' ? 'You' : 'ZENVANA AI'}</p>
            {msg.parts[0].text ? <MarkdownRenderer text={msg.parts[0].text} /> : (isGeneratingResponse && i === chatHistory.length - 1 ? <div className="animate-pulse"><span>▌</span></div> : null)}
          </div>
        ))}
        {isGeneratingResponse && statusText && (
          <div className="p-3 rounded-xl bg-gray-800 animate-pulse w-fit mr-auto">
            <p>{statusText}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question or upload a document..."
            className="flex-grow p-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
            disabled={isGeneratingResponse}
          />
          <button
            type="submit"
            className="bg-green-600 font-bold py-3 px-6 rounded-xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(!chatInput.trim() && !file) || isGeneratingResponse}
          >
            Send
          </button>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-400">
            <label htmlFor="file-upload" className="flex items-center cursor-pointer hover:text-green-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {file ? `Selected: ${file.name}` : "Upload a document to analyze"}
            </label>
            <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png,application/pdf" />
            {file && (
                <button type="button" onClick={() => setFile(null)} className="text-red-400 hover:text-red-300 text-xs">
                    Clear
                </button>
            )}
        </div>
      </form>
    </section>
  );
};

export default AIChat;