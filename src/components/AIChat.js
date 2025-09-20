import React, { useState, useEffect, useRef } from 'react';
import { getGroqResponse } from '../api/groq';
import { getGeminiResponse, analyzeDocument } from '../api/gemini';
import { MarkdownRenderer } from '../utils/helpers';

const AIChat = ({ financialSummary }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [file, setFile] = useState(null);
  const chatHistoryRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        role: 'model',
        parts: [{ text: `Namaste, ${financialSummary?.name || 'User'}! I'm your AI financial companion. I have reviewed your detailed profile. How can I help you today?` }]
      }]);
    }
  }, [financialSummary, chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (chatInput.trim() === '' && !file) return;

    setIsGeneratingResponse(true);
    const newUserMessage = { role: "user", parts: [{ text: chatInput }] };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatInput('');

    try {
        let aiResponse = '';
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1];
                const analysisResult = await analyzeDocument(base64Image, financialSummary);
                aiResponse = "I have analyzed your document. Here's what I found:\n\n" + JSON.stringify(analysisResult, null, 2);
                setChatHistory(prev => [...prev, { role: "model", parts: [{ text: aiResponse }] }]);
                setIsGeneratingResponse(false);
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            };
            reader.readAsDataURL(file);
        } else {
            // Simple query logic
            const prompt = `User's financial profile: ${JSON.stringify(financialSummary)}. User's question: ${chatInput}`;
            const isComplexQuery = chatInput.toLowerCase().includes('plan') || chatInput.toLowerCase().includes('strategy') || chatInput.toLowerCase().includes('analyze') || chatInput.toLowerCase().includes('predict');
            
            if (isComplexQuery) {
                aiResponse = await getGeminiResponse(prompt);
            } else {
                aiResponse = await getGroqResponse([{ role: 'user', content: prompt }]);
            }
            setChatHistory(prev => [...prev, { role: "model", parts: [{ text: aiResponse }] }]);
            setIsGeneratingResponse(false);
        }
    } catch (e) {
        setChatHistory(prev => [...prev, { role: "model", parts: [{ text: `Sorry, an error occurred: ${e.message}` }] }]);
        setIsGeneratingResponse(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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

      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask me anything about your finances..."
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
                {file ? file.name : "Upload a document to analyze"}
            </label>
            <input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/jpeg,image/png" />
        </div>
      </form>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:#222}.custom-scrollbar::-webkit-scrollbar-thumb{background:#10B981}`}</style>
    </section>
  );
};

export default AIChat;
