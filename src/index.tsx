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
    <BrowserRouter>
      <MidiProvider>
        <App />
      </MidiProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
