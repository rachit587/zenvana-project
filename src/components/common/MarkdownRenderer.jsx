import React from 'react';

const MarkdownRenderer = ({ text }) => {
  if (!text) return null;

  const renderInline = (line) => {
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-bold text-white">{part}</strong> : <span key={i}>{part}</span>
    );
  };

  const elements = text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold my-2 text-gray-200">{renderInline(line.slice(4))}</h3>;
    if (line.startsWith('## '))  return <h2 key={i} className="text-2xl font-bold my-3 text-yellow-400">{renderInline(line.slice(3))}</h2>;
    if (line.startsWith('# '))   return <h1 key={i} className="text-3xl font-bold my-4 text-green-400">{renderInline(line.slice(2))}</h1>;
    if (line.startsWith('- '))   return <li key={i} className="ml-5 list-disc">{renderInline(line.slice(2))}</li>;
    if (line.trim() !== '')      return <p key={i} className="my-1">{renderInline(line)}</p>;
    return null;
  });

  return <div className="text-gray-300">{elements}</div>;
};

export default MarkdownRenderer;
