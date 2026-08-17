import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
<<<<<<< HEAD
=======
import { ThemeProvider } from './context/ThemeContext.jsx';
>>>>>>> origin/Trivedi-branch
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
<<<<<<< HEAD
      <App />
=======
      <ThemeProvider>
        <App />
      </ThemeProvider>
>>>>>>> origin/Trivedi-branch
    </BrowserRouter>
  </React.StrictMode>
);
