import React from 'react';

const Layout = ({ children, userId, onNavigate, currentPage, handleLogout }) => (
  <div className="min-h-screen flex bg-gradient-to-br from-gray-950 to-gray-900 text-gray-100">
    <nav className="w-64 bg-gray-900 p-6 flex flex-col rounded-r-3xl shadow-lg">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-extrabold text-green-400">ZENVANA</h2>
        {userId && (
          <p className="text-xs text-gray-400 mt-2">
            User ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded-md break-all">{userId}</span>
          </p>
        )}
      </div>
      <ul className="space-y-3 flex-grow">
        {[
          ['dashboard','Dashboard'],
          ['taxSaver','Tax Saver'],
          ['aiChat','AI Chat'],
        ].map(([key,label]) => (
          <li key={key}>
            <button
              onClick={() => onNavigate(key)}
              className={`w-full text-left p-3 rounded-xl transition hover:bg-gray-700 ${currentPage===key?'bg-gray-700 text-green-400':'text-gray-300'}`}>
              {label}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleLogout} className="mt-6 w-full bg-red-800 hover:bg-red-700 py-3 rounded-xl">Logout & Start Over</button>
    </nav>
    <main className="flex-grow p-8 overflow-auto">{children}</main>
  </div>
);

export default Layout;
