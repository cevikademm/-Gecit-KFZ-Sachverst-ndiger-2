import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';
import { LangProvider } from './i18n/LangContext.jsx';

// Boot mesajini kaldir
const boot = document.getElementById('boot');
if (boot) boot.remove();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </React.StrictMode>
);
