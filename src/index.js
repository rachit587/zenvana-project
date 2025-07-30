import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Import global styles, including Tailwind
import App from './App';

// This is the entry point of your React app.
// It renders the main App component into the 'root' div in your index.html file.
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
