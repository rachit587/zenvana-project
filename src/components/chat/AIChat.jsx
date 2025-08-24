import React, { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';

const AIChat = ({ chatHistory, isGeneratingResponse, callChatAPI, financialSummary, setChatHistory }) => {
  const [chatInput, setChatInput] = useState('');
  const ref = useRef(null);

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [chatHistory]);
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{ role:'model', parts:[{ text:`Namaste, ${financialSummary?.name || 'User'}! How can I help you today?`}] }]);
    }
    // eslint-disable-next-line
  }, []);

  const send = (e) => { e.preventDefault(); if (!chatInput.trim()) return; callChatAPI(chatInput); setChatInput(''); };

  return (
    <section className="bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col min-h-[500px]">
      <h2 className="text-3xl font-bold text-green-400 mb-4">AI Financial Companion</h2>
      <div ref={ref} className="flex-grow overflow-y-auto pr-2 mb-4">
        {chatHistory.map((m,i)=>(
          <div key={i} className={`mb-3 p-3 rounded-xl max-w-[85%] ${m.role==='user'?'bg-gray-700 ml-auto':'bg-gray-800 mr-auto'}`}>
            <p className="text-sm font-semibold mb-1">{m.role==='user'?'You':'ZENVANA AI'}</p>
            <MarkdownRenderer text={m.parts[0].text} />
          </div>
        ))}
        {isGeneratingResponse && <div className="p-3 rounded-xl bg-gray-800 animate-pulse">Thinking...</div>}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask me anything about your finances..." className="flex-grow p-3 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-green-500"/>
        <button className="bg-green-600 font-bold py-3 px-6 rounded-xl" disabled={!chatInput.trim() || isGeneratingResponse}>Send</button>
      </form>
    </section>
  );
};

export default AIChat;
