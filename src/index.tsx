import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { MidiProvider } from './midi/MidiContext';
import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : ''}>
      <MidiProvider>
        <App />
      </MidiProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
